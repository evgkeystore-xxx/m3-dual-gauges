'use strict';
/* M3 Dual Gauges 0.1.4 - minimal RHMI launch based on the MGU Store app. */
const OnlineApp = require('oap-sdk/src/core/OnlineApp.js');
const logging = require('oap-sdk/src/logging/logging');
const log = logging.getSDKLogger();
const fail = e => String(e && (e.stack || e.message) || e);
class M3DualGauges extends OnlineApp {
  constructor() {
    super();
    this.ready = false;
    this.uuid = null;
    this.states = [];
    this.style = 0;
    this.pending = null;
    this.starting = false;
    this.visible = false;
    this.rpm = null;
    this.speed = null;
    this.ticker = null;
    this.on('initialized', () => this.onInitialized().catch(e => log.error('M3DG INIT_FAILED ' + fail(e))));
    this.on('entryPointExecute', uuid => {
      log.info('M3DG ENTRY_EXECUTED '+String(uuid));
      this.onOpen(uuid).catch(e => log.error('M3DG OPEN_FAILED '+fail(e)));
    });
    this.on('error', e => log.error('M3DG SDK_ERROR ' + fail(e)));
    this.on('shutdown', () => {if(this.ticker) clearInterval(this.ticker); log.info('M3DG SHUTDOWN');});
  }
  async onInitialized() {
    if(this.starting || this.ready) return;
    this.starting = true;
    log.info('M3DG INITIALIZED_BEGIN 0.1.4');
    if(!this.rhmiApplication) {
      log.warn('M3DG INIT_NO_RHMI background start');
      await this.initialized();
      return;
    }
    const rhmi = this.rhmiApplication;
    const one = rhmi.getByName('ST_M3_Red');
    const two = rhmi.getByName('ST_M3_Purple');
    if(!one || !two) throw Error('RHMI_MISSING_STATES red='+!!one+' purple='+!!two);
    this.states = [one,two];
    await Promise.all(this.states.map(s => s.updateResources()));
    log.info('M3DG STATES_RESOURCES_OK');
    const defs = this.appDescription && this.appDescription.application && this.appDescription.application.entryPoints || [];
    const entries = this.getEntryPoints();
    const entry = entries.find(ep=>defs.some(d=>d.uuid===ep.getDescription().uuid));
    if(!entry) throw Error('ENTRY_NOT_HANDED_BY_MANAGER count='+entries.length);
    const desc = entry.getDescription();
    this.uuid = desc.uuid;
    await entry.init();
    log.info('M3DG ENTRY_INIT_OK '+this.uuid);
    await rhmi.mapEntryState(this.uuid,one);
    log.info('M3DG ENTRY_MAPPED');
    /* Never override entry text or icon: the app manager owns them. */
    await entry.setAvailability('ENABLED');
    log.info('M3DG ENTRY_ENABLED');
    const reasonData = this.getVisibilityData && this.getVisibilityData();
    const reason = reasonData && reasonData.reason || this.startReason;
    const foreground=['ENTRY_POINT','LUM','BOOKMARK','START_WIDGET','TRIGGER_HMI','SPEECH_COMMAND'].includes(reason);
    if(foreground) this.registerActive();
    await this.initialized();
    this.ready = true;
    log.info('M3DG INITIALIZED_DONE reason='+reason);
    const last=this.getLastExecutedEntryPointUuid&&this.getLastExecutedEntryPointUuid();
    if(last || this.pending) await this.onOpen(last||this.pending);
    else if(foreground) await this.onOpen(this.uuid);
    /* Data subscriptions must not block entry point registration. */
    this.ticker=setInterval(()=>{ if(this.visible) this.draw(); },1000);
  }
  async onOpen(uuid) {
    if(!this.ready) { this.pending=uuid||true; log.info('M3DG ENTRY_PENDING'); return; }
    this.pending=null;
    if(uuid && uuid !== true && uuid!==this.uuid) log.warn('M3DG UUID_DIFFERENT '+uuid);
    this.visible=true;
    await this.rhmiApplication.openEntryState(this.uuid);
    log.info('M3DG OPEN_ENTRY_OK');
    this.draw();
  }
  draw() {
    const rhmi=this.rhmiApplication;
    if(!rhmi || !this.ready)return;
    const rpm=this.rpm===null?'NO DATA':Math.round(this.rpm);
    const speed=this.speed===null?'NO DATA':Math.round(this.speed);
    for(const theme of ['Red','Purple']) {
      for(const [name,value] of [['RPM','RPM: '+rpm],['Speed','km/h: '+speed]]) {
        const comp=rhmi.getByName('m3'+theme+name);
        if(comp) Promise.resolve(comp.setValue(0,'Text',value,'Text')).catch(e=>log.warn('M3DG DRAW_FAILED '+name+' '+fail(e)));
      }
    }
  }
}
log.info('M3DG BOOT 0.1.4');
process.on('uncaughtException',e=>log.error('M3DG UNCAUGHT '+fail(e)));
process.on('unhandledRejection',e=>log.error('M3DG UNHANDLED '+fail(e)));
const app=new M3DualGauges();
try { Promise.resolve(app.start()).catch(e=>log.error('M3DG START_FAILED '+fail(e))); }
catch(e) { log.error('M3DG START_THROW '+fail(e)); }
