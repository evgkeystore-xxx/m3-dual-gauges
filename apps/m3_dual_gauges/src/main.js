'use strict';
// Forked host/renderer integration from IterioDev Car Data 1.4.1 (see LICENSE/NOTICE).
const fs = require('fs');
const path = require('path');
const someip = require('oap-sdk/src/someip/someipBuilders');
const logging = require('oap-sdk/src/logging/logging');
const { createHost } = require('./online-host');
const logSdk = logging.getSDKLogger();
const say = m => logSdk.info('[M3DG] ' + m);
const R = path.join(__dirname, '..', 'renderer');
let screens = null, latest = {rpm:null,speed:null};
let reads = [];
function connect(iface, field, key, scale, ms) {
  someip.buildAndInitTypedProxy(iface, '1', {timeoutMs:10000}).then(proxy => {
    say('connected ' + key);
    const signal = proxy[field];
    if (!signal || typeof signal.getValue !== 'function') { say('missing getter '+key); return; }
    function poll(){
      Promise.resolve().then(()=>signal.getValue()).then(data=>{
        let raw=key==='rpm' ? data && data.actualValueRPMEngineCrankshaft : data && data.speedVehicleCentreOfGravity;
        if(typeof raw==='number' && Number.isFinite(raw)) latest[key] = Math.max(0, raw*scale);
      }).catch(e=>say('poll '+key+' '+e.message)).then(()=>setTimeout(poll,ms));
    }
    poll();
  }).catch(e=>say('connect '+key+' '+e.message));
}
function draw(){
  if(!screens)return;
  const rpm=latest.rpm, speed=latest.speed;
  screens.set('rpmDial',{value:rpm});screens.set('speedDial',{value:speed});
  screens.set('rpmLabel',{text:'RPM  '+(rpm===null?'--':Math.round(rpm))});
  screens.set('speedLabel',{text:'KM/H  '+(speed===null?'--':Math.round(speed))});
}
function startScreens(rhmi, hosts){
  const {RenderClient}=require(path.join(R,'kit/renderd.js'));
  const {ScreenApp}=require(path.join(R,'screenapp.js'));
  const design=JSON.parse(fs.readFileSync(path.join(R,'screens.json'),'utf8'));
  const logger={info:say,warn:say,error:say};
  const gpu=new RenderClient('m3_dual_gauges',logger);
  screens=new ScreenApp(gpu,design,{view:'id8',log:logger});
  screens.bindHosts(hosts,{open:name=>rhmi.openState(name),close:name=>rhmi.closeState(name)});
  screens.on('show',()=>{say('screen showing');draw();});
  screens.on('closed',why=>{say('screen closed '+why);if(why!=='hmi')rhmi.closeState('engine').catch(e=>say('close '+e.message));});
  gpu.connect();
  setInterval(draw,100);
  connect('de.bmw.infotainment.vehicle.CDS','statusEngineSpeed2','rpm',0.25,50);
  connect('de.bmw.infotainment.vehicle.Vehicle2','statusCarSpeed2','speed',1/64,100);
}
say('boot 0.2.0');
createHost({states:['engine'],log:say,onReady:startScreens,onHidden:()=>say('hidden'),onShutdown:()=>say('shutdown')});
