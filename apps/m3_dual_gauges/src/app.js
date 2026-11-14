'use strict';
const OnlineApp = require('oap-sdk/src/core/OnlineApp.js');
const logging = require('oap-sdk/src/logging/logging');
const someip = require('oap-sdk/src/someip/someipBuilders');
const log = logging.getSDKLogger();
const PREFIX = '[M3_DUAL_GAUGES] ';
const error = e => String((e && e.stack) || (e && e.message) || e);
class M3DualGauges extends OnlineApp {
  constructor() {
    super();
    this.ready = false;
    this.stopping = false;
    this.rpm = null;
    this.speed = null;
    this.theme = 0;
    this.rootState = null;
    this.states = [];
    this.timers = [];
    this.pendingEntry = null;
    this.on('initialized', () => this.initializeScreen().catch(e => log.error(PREFIX+'initialize: '+error(e))));
    this.on('entryPointExecute', uuid => {
      this.pendingEntry = uuid;
      if (this.ready) this.open(uuid).catch(e => log.error(PREFIX+'open: '+error(e)));
    });
    this.on('shutdown', () => this.shutdown());
    this.on('error', e => log.error(PREFIX+'SDK: '+error(e)));
  }
  async initializeScreen() {
    log.info(PREFIX+'init start');
    const rhmi = this.rhmiApplication;
    if (!rhmi) {
      log.warn(PREFIX+'no RHMI: completing background initialization');
      await this.initialized();
      return;
    }
    const red = rhmi.getByName('ST_M3_Red');
    const purple = rhmi.getByName('ST_M3_Purple');
    if (!red) {
      log.error(PREFIX+'missing RHMI state ST_M3_Red');
      await this.initialized();
      return;
    }
    this.rootState = red;
    this.states = [red, purple || red];
    // An invalid secondary screen must not prevent the primary screen from launching.
    for (const state of this.states) {
      try { await state.updateResources(); }
      catch (e) { log.warn(PREFIX+'state resources: '+error(e)); }
    }
    for (const name of ['m3RedSwitch', 'm3PurpleSwitch']) {
      try {
        const control = rhmi.getByName(name);
        if (control) control.on('action', () => this.changeTheme().catch(e => log.warn(PREFIX+'theme: '+error(e))));
      } catch (e) { log.warn(PREFIX+'button '+name+': '+error(e)); }
    }
    let registered = false;
    try {
      const listed = (this.appDescription && this.appDescription.application && this.appDescription.application.entryPoints) || [];
      const entries = typeof this.getEntryPoints === 'function' ? this.getEntryPoints() : [];
      const entry = entries.find(ep => {
        const d = ep.getDescription();
        return listed.some(candidate => candidate.uuid === d.uuid);
      });
      if (entry) {
        const d = entry.getDescription();
        await entry.init();
        await rhmi.mapEntryState(d.uuid, red);
        try {
          await entry.entryPoint.setText(d.textId);
          if (d.icon) await entry.entryPoint.setIcon(d.icon);
        } catch (e) { log.warn(PREFIX+'entry decorations: '+error(e)); }
        await entry.setAvailability('ENABLED');
        registered = true;
        log.info(PREFIX+'entry mapped '+d.uuid);
      } else {
        log.warn(PREFIX+'no entry point handed by MGU; do not block initialization');
      }
    } catch (e) {
      log.error(PREFIX+'entry registration: '+error(e));
    }
    // Always complete SDK initialization so an unavailable entry point doesn't freeze startup.
    const foreground = ['ENTRY_POINT','BOOKMARK','LUM','START_WIDGET','TRIGGER_HMI','SPEECH_COMMAND'];
    const visibility = (typeof this.getVisibilityData === 'function' && this.getVisibilityData()) || {};
    if (foreground.indexOf(visibility.reason || this.startReason) !== -1) {
      try { await Promise.resolve(this.registerActive()); }
      catch (e) { log.warn(PREFIX+'registerActive: '+error(e)); }
    }
    await this.initialized();
    this.ready = true;
    log.info(PREFIX+'SDK ready; entry registered='+registered);
    const uuid = this.pendingEntry || (this.getLastExecutedEntryPointUuid && this.getLastExecutedEntryPointUuid());
    if (uuid) await this.open(uuid).catch(e => log.error(PREFIX+'first open: '+error(e)));
    // Telemetry runs after successful screen init and never blocks starting the UI.
    this.updateText();
    this.timers.push(setInterval(() => this.updateText(), 250));
    this.pollTelemetry('de.bmw.infotainment.vehicle.CDS','statusEngineSpeed2','rpm',0.25,100);
    this.pollTelemetry('de.bmw.infotainment.vehicle.Vehicle2','statusCarSpeed2','speed',1/64,150);
  }
  async open(uuid) {
    if (!this.ready || !this.rhmiApplication || !uuid) return;
    await this.rhmiApplication.openEntryState(uuid);
    this.updateText();
  }
  async changeTheme() {
    if (!this.ready || !this.rhmiApplication) return;
    this.theme = 1 - this.theme;
    const state = this.states[this.theme] || this.rootState;
    if (state) await this.rhmiApplication.focusState(state);
    this.updateText();
  }
  async pollTelemetry(iface, field, key, scale, delay) {
    try {
      const proxy = await someip.buildAndInitTypedProxy(iface,'1',{timeoutMs:10000});
      const attribute = proxy && proxy[field];
      if (!attribute || typeof attribute.getValue !== 'function') throw new Error('missing getter '+field);
      const tick = async () => {
        if (this.stopping) return;
        try {
          const raw = await attribute.getValue();
          const value = raw && typeof raw === 'object' ?
            (key === 'rpm' ? raw.actualValueRPMEngineCrankshaft : raw.speedVehicleCentreOfGravity) : raw;
          const n = Number(value);
          if (Number.isFinite(n) && n >= 0 && n !== 65535) this[key] = n * scale;
        } catch (e) { /* Wait until the service responds; UI remains available. */ }
        this.timers.push(setTimeout(tick,delay));
      };
      tick();
    } catch (e) { log.warn(PREFIX+'telemetry '+field+': '+error(e)); }
  }
  updateText() {
    if (!this.ready || !this.rhmiApplication) return;
    const rpm = this.rpm == null ? '--' : String(Math.round(this.rpm));
    const speed = this.speed == null ? '--' : String(Math.round(this.speed));
    for (const theme of ['Red','Purple']) {
      for (const [suffix,message] of [['RPM','OBROTY '+rpm+' RPM'],['Speed','PREDKOSC '+speed+' km/h']]) {
        try {
          const c = this.rhmiApplication.getByName('m3'+theme+suffix);
          if (c) Promise.resolve(c.setValue(0,'Text',message,'Text')).catch(e => log.warn(PREFIX+'setValue: '+error(e)));
        } catch (e) { log.warn(PREFIX+'label '+suffix+': '+error(e)); }
      }
    }
  }
  shutdown() {
    if (this.stopping) return;
    this.stopping = true;
    this.ready = false;
    for (const id of this.timers) { clearTimeout(id); clearInterval(id); }
    Promise.resolve(this.destroyBundles()).catch(e => log.warn(PREFIX+'shutdown '+error(e))).then(() => process.exit(0));
  }
}
new M3DualGauges().start().catch(e => log.error(PREFIX+'start: '+error(e)));
