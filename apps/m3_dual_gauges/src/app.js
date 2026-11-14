'use strict';
/* M3 Dual Gauges - launch fix 0.1.3. RHMI lifecycle modelled on working OnlineApp host. */
const OnlineApp = require('oap-sdk/src/core/OnlineApp.js');
const logging = require('oap-sdk/src/logging/logging');
const someip = require('oap-sdk/src/someip/someipBuilders');
const log = logging.getSDKLogger();
const ERR = e => String((e && (e.stack || e.message)) || e);
const FOREGROUND = ['ENTRY_POINT','LUM','BOOKMARK','START_WIDGET','TRIGGER_HMI','SPEECH_COMMAND'];
class Gauges extends OnlineApp {
 constructor(){
  super();
  this.rpm=null; this.speed=null; this.page=0; this.ready=false; this.states=[];
  this.launchUuid=null; this.openPending=false; this.initializing=false; this.pollTimer=null;
  this.on('initialized',()=>this.begin().catch(e=>log.error('M3DG begin FAILED '+ERR(e))));
  this.on('entryPointExecute',uuid=>this.entryExecute(uuid).catch(e=>log.error('M3DG execute FAILED '+ERR(e))));
  this.on('shutdown',()=>this.shutdownGauges());
  this.on('error',e=>log.error('M3DG SDK error '+ERR(e)));
 }
 async begin(){
  if(this.initializing||this.ready)return;
  this.initializing=true;
  log.info('M3DG 0.1.3 initialized signal');
  const rhmi=this.rhmiApplication;
  if(!rhmi){log.warn('M3DG no RHMI; complete background init');await this.initialized();return;}
  this.states=['ST_M3_Red','ST_M3_Purple'].map(name=>rhmi.getByName(name));
  if(this.states.some(s=>!s))throw Error('M3DG missing RHMI host states');
  await Promise.all(this.states.map(s=>s.updateResources()));
  for(const name of ['m3RedSwitch','m3PurpleSwitch']){
   const button=rhmi.getByName(name);
   if(button)button.on('action',()=>this.switchStyle());
  }
  for(const s of this.states){s.on('visible',()=>this.paint());}
  const entries=((this.appDescription||{}).application||{}).entryPoints||[];
  const handed=this.getEntryPoints()||[];
  const entry=handed.find(ep=>entries.some(d=>d.uuid===ep.getDescription().uuid));
  if(!entry)throw Error('M3DG no entryPoint from app manager; cannot enable tile');
  const desc=entry.getDescription();
  this.launchUuid=desc.uuid;
  await entry.init();
  await rhmi.mapEntryState(desc.uuid,this.states[0]);
  try{
   await entry.entryPoint.setText(desc.textId);
   if(desc.icon)await entry.entryPoint.setIcon(desc.icon);
  }catch(e){log.warn('M3DG entry label/icon '+ERR(e));}
  await entry.setAvailability('ENABLED');
  log.info('M3DG tile ENABLED '+desc.uuid);
  const visibility=(this.getVisibilityData&&this.getVisibilityData())||{};
  const foreground=FOREGROUND.indexOf(visibility.reason||this.startReason)>=0;
  if(foreground){try{await this.registerActive();}catch(e){log.warn('M3DG active '+ERR(e));}}
  await this.initialized();
  this.ready=true;
  log.info('M3DG RHMI READY, foreground='+foreground);
  const last=this.getLastExecutedEntryPointUuid&&this.getLastExecutedEntryPointUuid();
  if(foreground||last||this.openPending){await this.entryExecute(last||this.launchUuid);}
  this.pollTimer=setInterval(()=>this.paint(),1000);
  this.connect('de.bmw.infotainment.vehicle.CDS','statusEngineSpeed2','rpm',0.25);
  this.connect('de.bmw.infotainment.vehicle.Vehicle2','statusCarSpeed2','speed',1/64);
 }
 async entryExecute(uuid){
  if(!this.ready){this.openPending=true;return;}
  this.openPending=false;
  uuid=uuid||this.launchUuid;
  log.info('M3DG openEntryState '+uuid);
  await this.rhmiApplication.openEntryState(uuid);
  if(this.page===1)await this.rhmiApplication.focusState(this.states[1]);
  this.paint();
 }
 async switchStyle(){
  this.page=1-this.page;
  if(!this.ready)return;
  try{await this.rhmiApplication.focusState(this.states[this.page]);}catch(e){log.warn('M3DG switch '+ERR(e));}
  this.paint();
 }
 async connect(iface,field,key,factor){
  try{
   const proxy=await someip.buildTypedProxy(iface,'1');
   await proxy.init();
   await proxy.waitUntilAvailable(10000);
   const target=proxy[field];
   if(!target)throw Error('missing attribute '+field);
   const apply=v=>{
    const raw=(v&&typeof v==='object')?(key==='rpm'?v.actualValueRPMEngineCrankshaft:v.actualValueVehicleSpeed):v;
    const n=Number(raw);
    if(Number.isFinite(n)){this[key]=Math.max(0,n*factor);this.paint();}
   };
   // Not all vehicle attributes emit notifications: getter supplies the initial value.
   if(typeof target.subscribe==='function')try{await target.subscribe(apply);}catch(e){log.warn('M3DG notify '+field+' '+ERR(e));}
   if(typeof target.getValue==='function')try{apply(await target.getValue());}catch(e){log.warn('M3DG read '+field+' '+ERR(e));}
   log.info('M3DG connected '+field);
  }catch(e){log.warn('M3DG signal unavailable '+field+' '+ERR(e));}
 }
 paint(){
  if(!this.ready)return;
  for(const theme of ['Red','Purple']){
   const a=this.rhmiApplication.getByName('m3'+theme+'RPM');
   const b=this.rhmiApplication.getByName('m3'+theme+'Speed');
   if(a)Promise.resolve(a.setValue(0,'Text','RPM: '+(this.rpm===null?'NO DATA':Math.round(this.rpm)),'Text')).catch(e=>log.warn('M3DG rpm label '+ERR(e)));
   if(b)Promise.resolve(b.setValue(0,'Text','km/h: '+(this.speed===null?'NO DATA':Math.round(this.speed)),'Text')).catch(e=>log.warn('M3DG speed label '+ERR(e)));
  }
 }
 shutdownGauges(){
  if(this.pollTimer)clearInterval(this.pollTimer);
  Promise.resolve(this.destroyBundles()).catch(e=>log.warn('M3DG shutdown '+ERR(e))).then(()=>process.exit(0));
 }
}
log.info('M3DG 0.1.3 boot');
const app=new Gauges();
app.start().catch(e=>log.error('M3DG start FAILED '+ERR(e)));
