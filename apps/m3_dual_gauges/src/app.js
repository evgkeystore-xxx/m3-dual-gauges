 'use strict';
const OnlineApp = require('oap-sdk/src/core/OnlineApp.js');
const logging = require('oap-sdk/src/logging/logging');
const someip = require('oap-sdk/src/someip/someipBuilders');
const log = logging.getSDKLogger();
class Gauges extends OnlineApp {
 constructor(){ super(); this.rpm=null;this.speed=null;this.page=0;this.ready=false;this.states=[];
 this.on('initialized',()=>this.begin().catch(e=>log.error('M3DG init '+e.message)));
 this.on('entryPointExecute',()=>this.open());
 this.on('shutdown',()=>this.destroyBundles().catch(()=>{}).then(()=>process.exit(0)));
 this.on('error',e=>log.warn('M3DG error '+e.message)); }
 async begin(){
  if(!this.rhmiApplication){await this.initialized();return;}
  const r=this.rhmiApplication;
  this.states=['ST_M3_Red','ST_M3_Purple'].map(n=>r.getByName(n));
  if(this.states.some(s=>!s))throw Error('RHMI states missing');
  for(const s of this.states)await s.updateResources();
  for(const name of ['m3RedSwitch','m3PurpleSwitch']){
    const c=r.getByName(name);
    if(c)c.on('action',()=>this.switchStyle());
  }
  this.ready=true;
  await this.registerEntryPoints();
  await this.initialized();
  this.subscribe('de.bmw.infotainment.vehicle.CDS','statusEngineSpeed2','rpm',0.25);
  this.subscribe('de.bmw.infotainment.vehicle.Vehicle2','statusCarSpeed2','speed',0.015625);
  const last=this.getLastExecutedEntryPointUuid&&this.getLastExecutedEntryPointUuid();
  if(last)this.open();
  setInterval(()=>this.paint(),1000);
 }
 async subscribe(iface,field,key,mul){try{
  let proxy=await someip.buildTypedProxy(iface,'1');await proxy.init();await proxy.waitUntilAvailable();
  const update=v=>{let n=Number(v);if(Number.isFinite(n)){this[key]=Math.max(0,n*mul);this.paint();}};
  await proxy[field].subscribe(update);
  try{update(await proxy[field].getValue());}catch(e){};
  log.info('M3DG subscribed '+field);
 }catch(e){log.warn('M3DG signal '+field+' unavailable: '+e.message);}}
 paint(){if(!this.ready)return;for(const theme of ['Red','Purple']){
  const a=this.rhmiApplication.getByName('m3'+theme+'RPM'),b=this.rhmiApplication.getByName('m3'+theme+'Speed');
  if(a)a.setValue(0,'Text','RPM: '+(this.rpm===null?'NO DATA':Math.round(this.rpm)),'Text').catch(()=>{});
  if(b)b.setValue(0,'Text','km/h: '+(this.speed===null?'NO DATA':Math.round(this.speed)),'Text').catch(()=>{});
 }}
 open(){if(!this.ready)return;this.rhmiApplication.focusState(this.states[this.page]).catch(e=>log.warn('M3DG focus '+e.message));this.paint();}
 switchStyle(){this.page=1-this.page;this.open();}
}
const app=new Gauges();app.start().catch(e=>log.error('M3DG start '+e.message));
