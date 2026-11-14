 'use strict';
const OnlineApp = require('oap-sdk/src/core/OnlineApp.js');
const logging = require('oap-sdk/src/logging/logging');
const someip = require('oap-sdk/src/someip/someipBuilders');
const log = logging.getSDKLogger();
class Gauges extends OnlineApp {
 constructor(){ super(); this.rpm=null;this.speed=null;this.page=0;this.ready=false;this.states=[];this.starting=false;this.pendingOpen=false;
 this.on('initialized',()=>{log.info('M3DG initialized event');this.begin().catch(e=>log.error('M3DG init '+(e.stack||e.message)));});
 this.on('entryPointExecute',()=>{log.info('M3DG entry point executed');this.pendingOpen=true;this.open();});
 this.on('shutdown',()=>this.destroyBundles().catch(()=>{}).then(()=>process.exit(0)));
 this.on('error',e=>log.warn('M3DG error '+e.message)); }
 async begin(){
  if(this.starting || this.ready)return;
  this.starting=true;
  if(!this.rhmiApplication){log.warn('M3DG no RHMI application at init');this.starting=false;return;}
  const r=this.rhmiApplication;
  this.states=['ST_M3_Red','ST_M3_Purple'].map(n=>r.getByName(n));
  if(this.states.some(s=>!s))throw Error('RHMI states missing');
  for(const s of this.states){try{await s.updateResources();}catch(e){log.warn('M3DG resources: '+e.message);}}
  for(const name of ['m3RedSwitch','m3PurpleSwitch']){
    const c=r.getByName(name);
    if(c)c.on('action',()=>this.switchStyle());
  }
  this.ready=true;
  try{await this.registerEntryPoints();log.info('M3DG entry points registered');}catch(e){log.error('M3DG entry register failed '+(e.stack||e.message));}
  try{await this.initialized();}catch(e){log.warn('M3DG initialization completion '+e.message);}
  this.subscribe('de.bmw.infotainment.vehicle.CDS','statusEngineSpeed2','rpm',0.25);
  this.subscribe('de.bmw.infotainment.vehicle.Vehicle2','statusCarSpeed2','speed',0.015625);
  const last=this.getLastExecutedEntryPointUuid&&this.getLastExecutedEntryPointUuid();
  if(last || this.pendingOpen)this.open();
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
 open(){if(!this.ready){this.pendingOpen=true;log.info('M3DG queued open until ready');return;}this.pendingOpen=false;log.info('M3DG focus theme '+this.page);this.rhmiApplication.focusState(this.states[this.page]).catch(e=>log.warn('M3DG focus '+(e.stack||e.message)));this.paint();}
 switchStyle(){this.page=1-this.page;this.open();}
}
log.info('M3DG version 0.1.2 loaded');const app=new Gauges();app.start().catch(e=>log.error('M3DG start '+(e.stack||e.message)));
