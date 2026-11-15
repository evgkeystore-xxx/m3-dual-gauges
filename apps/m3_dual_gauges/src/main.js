'use strict';
/* M3 Dual Gauges - iDrive 8. Lifecycle: reference Car Data online-host.js.
   All vehicle information is read-only. Unknown values are shown as --. */
const fs = require('fs');
const path = require('path');
const logging = require('oap-sdk/src/logging/logging');
const someip = require('oap-sdk/src/someip/someipBuilders');
const { createHost } = require('./online-host.js');
const say = s => logging.getSDKLogger().info('[M3DG 0.3.2] ' + String(s));
const SOURCE = typeof __dirname === 'string' ? path.join(__dirname, '..') : `/var/opt/public/oap/oap_${process.getuid()}/source`;
const RENDERER = path.join(SOURCE, 'renderer');
const runtime = f => require(path.join(RENDERER, f));
let screens = null;
let visible = false;
const latest = { rpm: null, speed: null };
let lastUpdate = {rpm:0,speed:0};
function num(x){return typeof x==='number' && isFinite(x);}
function draw(){
  if(!screens || !visible)return;
  try{
    const rpm=(Date.now()-lastUpdate.rpm<2500)?latest.rpm:null;
    const speed=(Date.now()-lastUpdate.speed<2500)?latest.speed:null;
    screens.set('rpmDial',{value:rpm});
    screens.set('speedDial',{value:speed});
    screens.set('rpmLabel',{text:'RPM  '+(rpm===null?'--':Math.round(rpm))});
    screens.set('speedLabel',{text:'KM/H  '+(speed===null?'--':Math.round(speed))});
  }catch(e){say('draw: '+e.message);}
}
function connect(name,field,key,property,scale,interval){
  // Poll only after screen has started; a missing vehicle service must never block startup.
  someip.buildAndInitTypedProxy(name,'1',{timeoutMs:10000}).then(proxy=>{
    const getter=proxy && proxy[field];
    if(!getter || typeof getter.getValue!=='function'){say('no getter '+key);return;}
    say('proxy connected '+key);
    function poll(){
      if(!visible){setTimeout(poll,interval);return;}
      Promise.resolve().then(()=>getter.getValue()).then(x=>{
        const v=x&&x[property];
        if(num(v)){latest[key]=Math.max(0,v*scale);lastUpdate[key]=Date.now();}
      }).catch(e=>say('poll '+key+': '+e.message)).then(()=>setTimeout(poll,interval));
    }
    poll();
  }).catch(e=>say('service '+key+': '+e.message));
}
function startScreens(rhmi,hosts){
  say('onReady: creating renderer');
  const design=JSON.parse(fs.readFileSync(path.join(RENDERER,'screens.json'),'utf8'));
  const {RenderClient}=runtime('kit/renderd.js');
  const {ScreenApp}=runtime('screenapp.js');
  const logger={info:say,warn:say,error:say};
  const gpu=new RenderClient('m3_dual_gauges',logger);
  screens=new ScreenApp(gpu,design,{view:'id8',log:logger});
  screens.bindHosts(hosts,{open:name=>rhmi.openState(name),close:name=>rhmi.closeState(name)});
  screens.on('show',()=>{visible=true;say('engine screen shown');draw();});
  screens.on('closed',()=>{visible=false;say('screen closed');});
  gpu.connect();
  say('onReady: renderer connected');
  setInterval(draw,100);
  connect('de.bmw.infotainment.vehicle.CDS','statusEngineSpeed2','rpm','actualValueRPMEngineCrankshaft',0.25,50);
  connect('de.bmw.infotainment.vehicle.Vehicle2','statusCarSpeed2','speed','speedVehicleCentreOfGravity',1/64,100);
}
say('start');
createHost({states:['engine'],log:say,onReady:startScreens,onHidden:()=>{visible=false;say('hidden');},onShutdown:()=>say('shutdown')});
