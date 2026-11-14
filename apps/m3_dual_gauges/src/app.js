 'use strict';
const OnlineApp = require('oap-sdk/src/core/OnlineApp.js');
const logging = require('oap-sdk/src/logging/logging');
const someip = require('oap-sdk/src/someip/someipBuilders');
const log = logging.getSDKLogger();
const REFRESH = 160;
class M3Gauges extends OnlineApp {
  constructor() {
    super();
    this.rpm = null; this.speed = null; this.theme = 0;
    this.ready = false; this.states = []; this.timers = [];
    this.on('initialized', () => this.prepare().catch(e => log.error('M3DG prepare: '+String(e))));
    this.on('entryPointExecute', uuid => this.open(uuid).catch(e => log.error('M3DG open: '+String(e))));
    this.on('shutdown', () => this.stop());
    this.on('error', e => log.error('M3DG SDK: '+String(e)));
  }
  async prepare() {
    const rhmi = this.rhmiApplication;
    if (!rhmi) { await this.initialized(); return; }
    this.states = [rhmi.getByName('ST_M3_Red'), rhmi.getByName('ST_M3_Purple')];
    if (this.states.some(s => !s)) throw new Error('RHMI states missing');
    await Promise.all(this.states.map(s => s.updateResources()));
    for (const name of ['m3RedSwitch','m3PurpleSwitch']) {
      const c = rhmi.getByName(name);
      if (c) c.on('action', () => this.changeTheme().catch(e => log.warn('M3DG theme '+String(e))));
    }
    const declared = (this.appDescription && this.appDescription.application && this.appDescription.application.entryPoints) || [];
    const points = this.getEntryPoints();
    const entry = points.find(x => declared.some(y => y.uuid === x.getDescription().uuid));
    if (!entry) throw new Error('no entry point from HMI');
    const info = entry.getDescription();
    await entry.init();
    await rhmi.mapEntryState(info.uuid, this.states[0]);
    try {
      await entry.entryPoint.setText(info.textId);
      if (info.icon) await entry.entryPoint.setIcon(info.icon);
    } catch(e) { log.warn('M3DG entry visuals '+String(e)); }
    await entry.setAvailability('ENABLED');
    this.ready = true;
    const vd = this.getVisibilityData && this.getVisibilityData();
    if (vd && ['ENTRY_POINT','BOOKMARK','LUM','START_WIDGET'].indexOf(vd.reason)>=0) {
      try { await this.registerActive(); } catch(e) {}
    }
    await this.initialized();
    const initial = this.getLastExecutedEntryPointUuid && this.getLastExecutedEntryPointUuid();
    if (initial) await this.open(initial);
    this.refresh();
    this.timers.push(setInterval(() => this.refresh(), 200));
    this.monitor('de.bmw.infotainment.vehicle.CDS','statusEngineSpeed2','rpm',0.25,50);
    this.monitor('de.bmw.infotainment.vehicle.Vehicle2','statusCarSpeed2','speed',1/64,100);
  }
  async monitor(iface,field,key,scale,ms) {
    try {
      const proxy=await someip.buildAndInitTypedProxy(iface,'1',{timeoutMs:10000});
      const attr=proxy[field];
      if (!attr || typeof attr.getValue!=='function') throw new Error('Getter unavailable: '+field);
      const accept=x=>{
        const v = x && typeof x === 'object' ? (key === 'rpm' ? x.actualValueRPMEngineCrankshaft : x.speedVehicleCentreOfGravity) : x;
        const n=Number(v);
        if (Number.isFinite(n) && n>=0 && n!==65535) this[key]=n*scale;
      };
      try { await attr.subscribe(accept); } catch(e) { log.warn('M3DG subscribe '+field+': '+String(e)); }
      const poll=async()=>{
        if (!this.ready) return;
        try { accept(await attr.getValue()); } catch(e) {}
        this.timers.push(setTimeout(poll,ms));
      };
      poll();
    } catch(e) { log.warn('M3DG no telemetry '+field+' '+String(e)); }
  }
  refresh() {
    if (!this.ready || !this.rhmiApplication) return;
    const rpm = this.rpm === null ? 'BRAK DANYCH' : String(Math.round(this.rpm));
    const speed = this.speed === null ? 'BRAK DANYCH' : String(Math.round(this.speed));
    for (const theme of ['Red','Purple']) {
      const a=this.rhmiApplication.getByName('m3'+theme+'RPM');
      const b=this.rhmiApplication.getByName('m3'+theme+'Speed');
      if(a) Promise.resolve(a.setValue(0,'Text','OBROTY  '+rpm+' RPM','Text')).catch(()=>{});
      if(b) Promise.resolve(b.setValue(0,'Text','PREDKOSC  '+speed+' km/h','Text')).catch(()=>{});
    }
  }
  async open(uuid) {
    if (!this.ready || !uuid) return;
    await this.rhmiApplication.openEntryState(uuid);
    this.refresh();
  }
  async changeTheme() {
    if (!this.ready) return;
    this.theme=1-this.theme;
    await this.rhmiApplication.focusState(this.states[this.theme]);
    this.refresh();
  }
  stop() {
    this.ready=false;
    this.timers.forEach(t=>{clearTimeout(t);clearInterval(t);});
    Promise.resolve(this.destroyBundles()).catch(e=>log.warn('M3DG shutdown '+String(e))).then(()=>process.exit(0));
  }
}
new M3Gauges().start().catch(e=>log.error('M3DG start '+String(e)));
