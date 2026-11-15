'use strict';
const fs=require('fs'),path=require('path');
const RenderClient=require('../kit/renderd').RenderClient;
const Settings=require('./settings').Settings,Gateway=require('./gateway').Gateway,Telemetry=require('./telemetry').Telemetry,View=require('./view').View;
const truth=v=>v===true||v==='true'||v===1||v==='1';
class Controller{
 constructor(config,root,data,someip,diag){this.config=config;this.root=root;this.data=data;this.diag=diag;this.settings=new Settings(data,diag);if(config.kind==='cockpit'&&!fs.existsSync(path.join(data,'m3-suite-settings.json')))this.settings.value.theme=8;this.gateway=new Gateway(someip,diag,config);this.telemetry=new Telemetry(someip,diag,this.gateway);this.view=new View(config);this.page='home';this.visible=false;this.paused=false;this.history=[];this.recording=false;this.errorPage=0;this.errorText='';this.notice='';this.noticeUntil=0;this.busy=false;this.confirm=null;this.destroyed=false;this.press=null;this.lastMode='';this.lastSample=0;this.flapTimer=null;this.pollingFlap=false;this.touchCount=0;this.touchLast=null;this.touchStart=null;this.touchWarnAt=0;this.phoneUrl=(require('./diagnostics').addresses().filter(u=>u.indexOf('169.254.')<0)[0]||'http://IP-MGU:8471');
 const log={info:s=>diag.info('RENDER',s),warn:s=>diag.warn('RENDER',s),error:s=>diag.error('RENDER',s)};
 // This is the exact compatibility protocol used by the confirmed-working Dual Gauges,
 // not the mgu-render/1-only client which silently refused the old renderer.
 this.gpu=new RenderClient(config.id,log);
 this.gpu.maxFps(15);
 this.gpu.on('ready',screen=>{try{this.place(screen);diag.clear('RENDER_TIMEOUT');diag.update({renderer:true,screen:screen,phase:'RENDER_READY',touchAdvertised:this.gpu.touch,rendererProtocol:this.gpu.version,rendererSocket:this.gpu.activeSocket});if(!this.gpu.touch)diag.warn('TOUCH_NOT_ADVERTISED','Renderer READY returned touch=false: no app code can receive physical taps until renderer touch routing works. Check Store > Renderer, restart MGU head unit to activate updated renderer, then read renderer journal. Do not flash ECU.');else diag.clear('TOUCH_NOT_ADVERTISED');this.draw();this.claim();this.gpu.show(this.visible&&!this.paused);}catch(e){diag.error('RENDER_READY',e);}});
 this.gpu.on('close',()=>{diag.update({renderer:false});diag.warn('RENDER_DISCONNECTED','Socket closed; automatic reconnect is active');});
 this.gpu.on('closed',()=>{diag.info('RENDER_HMI_EXIT','HMI/other app took focus');this.hide();});
 this.gpu.on('touch',(phase,x,y)=>this.touch(phase,x,y));
 this.telemetry.on('mode',m=>{this.history=[];this.diag.update({display:m});});
 this.timer=setInterval(()=>{if(this.destroyed)return;try{if(this.visible&&!this.paused)this.draw();this.diag.update({visible:this.visible,renderer:!!this.gpu.ready,rendererProtocol:this.gpu.version,rendererSocket:this.gpu.activeSocket,touchAdvertised:this.gpu.touch,touchEvents:this.touchCount,lastTouch:this.touchLast,page:this.page,flap:this.gateway.flap});}catch(e){diag.error('DRAW',e);}},100);
 this.started=Date.now();this.watch=setInterval(()=>{if(this.visible&&!this.gpu.ready&&Date.now()-this.started>8000)diag.error('RENDER_TIMEOUT',Error('No renderer READY; expected socket /run/mgu-renderd/renderd.sock. App JS runs, renderer is not ready.'));},5000);
 if(config.kind==='pops')diag.warn('MHD_BURBLE_UNSUPPORTED','No verified MHD burble-duration/aggressiveness API in the supplied references. Profile sliders edit local demo only. Exhaust flap is a separate feature; map switch/flash disabled.');
 }
 bind(rhmi,state){this.rhmi=rhmi;this.host=state;
  state.on('visible',ev=>{if(truth(ev&&ev.visible))this.show();else this.hide();});
  // A drawn renderer layer does not necessarily hold the HMI widget focus.
  // Hiding and releasing the touch claim on focus=false made buttons inert
  // although the screen was still visibly in front. Only visibility or the
  // renderer CLOSED event can release a shown layer; focus is diagnostic.
  state.on('focus',ev=>{this.diag.info('RHMI_FOCUS',JSON.stringify(ev||{}));
    this.diag.update({rhmiFocus:truth(ev&&ev.focus)});
    if(this.visible){this.paused=false;this.claim();}
  });
 }
 connect(){this.diag.info('RENDER_CONNECT','Compatibility RenderClient '+RenderClient.socketPath());this.gpu.connect();}
 place(screen){const id8=screen.w/screen.h>2.8;const target=id8?{w:2880,h:960,x:0,y:76,aw:2880,ah:764}:{w:1920,h:720,x:84,y:76,aw:1836,ah:644};const k=Math.min(screen.w/target.w,screen.h/target.h),scale=k*Math.min(target.aw/2880,target.ah/764);this.gpu.place({x:0,y:0,w:screen.w,h:screen.h,scale:scale,ox:k*target.x,oy:k*target.y-76*scale});this.diag.info('LAYOUT','Reserved native top/status and climate regions',{design:{w:2880,h:960,top:76,bottom:120},content:{y:76,h:764},screen:screen,placement:this.gpu.placement});}
 claim(){const regions=this.visible?[{x:0,y:76,w:2880,h:764}]:[];
  this.gpu.claim(regions);this.diag.update({touchClaim:regions,rendererTouch:this.gpu.touch});
 }
 show(){if(this.destroyed)return;const changed=!this.visible;this.visible=true;this.paused=false;this.telemetry.start();if(changed){this.started=Date.now();this.diag.info('UI_OPEN',this.config.title);if(this.config.kind==='pops')this.flapPoll();}this.draw();this.claim();this.gpu.show(true);}
 hide(){this.visible=false;this.telemetry.stop();this.gpu.show(false);this.gpu.claim([]);clearTimeout(this.flapTimer);this.flapTimer=null;}
 flapPoll(){if(!this.visible||this.destroyed||this.pollingFlap)return;this.pollingFlap=true;this.gateway.readFlap().catch(e=>this.diag.warn('FLAP_LINK',e)).then(()=>{this.pollingFlap=false;if(this.visible&&!this.destroyed)this.flapTimer=setTimeout(()=>this.flapPoll(),3000);});}
 model(){const at=Date.now();const frame=this.telemetry.getFrame(this.settings.value.autoDemo,at);if(this.recording&&at-this.lastSample>=200){this.lastSample=at;const rpm=frame.values.rpm;if(typeof rpm==='number')this.history.push({at:at,rpm:rpm,mode:frame.mode});}this.history=this.history.filter(p=>at-p.at<=60000);this.diag.update({display:frame.mode,values:frame.values,realValues:frame.real,lastReadings:frame.entries,flap:this.gateway.flap,capabilities:{telemetry:'read-only',flap:this.config.kind==='pops'?'requires acknowledged MHD reply':'not offered',burbleWrite:false,mapFlash:false,mapBackup:false,mapSwitch:false,cluster:false,camera:false,oemAudio:false}});
 const errorKeys=Object.keys(this.diag.failures||{});const lastError=errorKeys.length?this.diag.failures[errorKeys[errorKeys.length-1]].message:'';
 return {touchSupported:this.gpu.touch,touchEvents:this.touchCount,phoneUrl:this.phoneUrl,errors:errorKeys.length,lastError:lastError,settings:this.settings.value,frame:frame,flap:this.gateway.flap,page:this.page,history:this.history,recording:this.recording,errorText:this.errorText,errorPage:this.errorPage,busy:this.busy,notice:at<this.noticeUntil?this.notice:'',at:at};}
 draw(){if(!this.visible||this.paused||!this.gpu.ready||!this.gpu.placement)return;this.gpu.frame(this.view.draw(this.model()));}
 note(s,ms){this.notice=String(s);this.noticeUntil=Date.now()+(ms||10000);this.diag.info('UI_NOTICE',s);}
 report(){this.errorText=this.diag.fullText();this.errorPage=0;}
 confirmAction(key){if(this.confirm&&this.confirm.key===key&&Date.now()-this.confirm.at<7000){this.confirm=null;return true;}this.confirm={key:key,at:Date.now()};this.note('POTWIERDZ: NACISNIJ TEN SAM PRZYCISK PONOWNIE. NIC JESZCZE NIE WYSLANO.',7000);return false;}
 // A touch is an INPUT event, not a button's graphic. Accept down-only renderers and drag events.
 // The previous build required matching down+up and therefore ignored real taps when only DOWN arrived.
 touch(phase,x,y){
  this.touchCount++;this.touchLast={phase:phase,x:x,y:y,at:Date.now()};
  if(this.touchCount<=8||this.touchCount%30===0)this.diag.info('TOUCH_RAW','Renderer touch '+phase,{x:x,y:y,visible:this.visible,paused:this.paused,claim:this.gpu.claims,placement:this.gpu.placement});
  this.diag.update({touchEvents:this.touchCount,lastTouch:this.touchLast,touchAdvertised:this.gpu.touch});
  if(!this.visible||this.paused)return;
  let tx=x,ty=y,target=this.view.hitTarget(tx,ty);
  // Some versions send logical coordinates, others pixels within the active
  // display; a remote touch forwarder may send normalized 0..1 coordinates.
  // Only accept a conversion when it actually lands on a drawn hit target.
  if(!target&&this.gpu.placement){
   const p=this.gpu.placement,sc=p.scale||1;
   const choices=[[(x-(p.ox||0))/sc,(y-(p.oy||0))/sc],
     [(x-(p.x||0)-(p.ox||0))/sc,(y-(p.y||0)-(p.oy||0))/sc]];
   if(x>=0&&x<=1&&y>=0&&y<=1){
     choices.push([x*2880,y*960]);
     choices.push([(x*(p.w||2880)-(p.ox||0))/sc,(y*(p.h||960)-(p.oy||0))/sc]);
   }
   for(const point of choices){const t=this.view.hitTarget(point[0],point[1]);if(t){tx=point[0];ty=point[1];target=t;break;}}
  }
  if(!target && (phase==='down'||phase==='up')) this.diag.info('TOUCH_UNMAPPED','Renderer event outside UI controls',{raw:{x,y},logical:{x:tx,y:ty}});
  if(phase==='down'){
   this.touchStart=target;this.press=target?target.id:null;
   if(!target){this.diag.info('TOUCH_EMPTY','No control at touch',{x:tx,y:ty});return;}
   if(target.kind==='slider'||target.kind==='range'){this.sliderTouch(target,tx,false);this.draw();return;}
   // Execute on DOWN; the renderer's UP may be omitted by some head units.
   try{this.action(target.id);this.draw();this.diag.info('TOUCH_ACTION','Pressed '+target.id);}catch(e){this.diag.error('ACTION_'+target.id,e);this.note(e.message);this.report();this.page='errors';}
   return;
  }
  if(phase==='move'){if(this.touchStart&&(this.touchStart.kind==='slider'||this.touchStart.kind==='range')){this.sliderTouch(this.touchStart,tx,false);this.draw();}return;}
  if(phase==='up'){
   if(this.touchStart&&(this.touchStart.kind==='slider'||this.touchStart.kind==='range')){this.sliderTouch(this.touchStart,tx,true);this.draw();}
   // Some renderers only emit UP for a tap. Handle that too, but never double-fire a DOWN.
   else if(!this.touchStart&&target&&target.kind==='button'){try{this.action(target.id);this.draw();}catch(e){this.diag.error('ACTION_'+target.id,e);}}
   this.touchStart=null;this.press=null;
  }
 }
 sliderTouch(t,x,commit){if(this.config.kind!=='pops')return;const mode=this.settings.value.mode;if(mode==='comfort')return;
  const p=this.settings.value.profile[mode];if(!p)return;
  const ratio=Math.max(0,Math.min(1,(x-t.x)/t.w));let value=t.min+Math.round((t.max-t.min)*ratio/t.step)*t.step;
  value=Math.round(value*10)/10;
  if(t.kind==='range'){
   if(!t._active){const a=Math.abs(value-p.rpmMin),b=Math.abs(value-p.rpmMax);t._active=a<=b?'rpmMin':'rpmMax';}
   if(t._active==='rpmMin')p.rpmMin=Math.min(value,p.rpmMax);else p.rpmMax=Math.max(value,p.rpmMin);
  }else{const key=t.id.split(':')[1];if(['duration','aggression','delay'].indexOf(key)<0)return;p[key]=value;}
  if(commit){this.settings.save('demo-profile-slider');this.diag.info('DEMO_PROFILE_EDIT','Saved local profile only',{mode:mode,key:t._active||t.id,value:value});t._active=null;}
 }
 action(id){if(id.indexOf('page:')===0){this.page=id.slice(5);if(this.page==='errors')this.report();if(this.page==='profile'){this.diag.warn('MHD_BURBLE_UNSUPPORTED','DEMO profiles only; no ECU writes for burble settings');}this.draw();return;}
 if(id==='retry'){this.telemetry.retry();this.note('PONAWIAM ODCZYTY. MAPA ECU BEZ ZMIAN.');return;}
 if(id==='error:prev'){this.errorPage=Math.max(0,this.errorPage-1);return;}
 if(id==='error:next'){const wrap=require('./view').wrap;this.errorPage=Math.min(Math.ceil(wrap(this.errorText,140).length/10)-1,this.errorPage+1);return;}
 if(id==='error:refresh'){this.report();return;}
 if(id==='graph:toggle'){this.recording=!this.recording;if(this.recording)this.history=[];return;}
 if(id==='backup'){const file=this.settings.backup('manual');this.note('KOPIA USTAWIEN GOTOWA. TO NIE JEST KOPIA MAPY MHD.');this.diag.info('BACKUP_FILE',file);return;}
 if(id==='restore'){if(!this.confirmAction(id))return;this.settings.restore();this.note('PRZYWROCONO USTAWIENIA APLIKACJI, NIE MAPE ECU.');return;}
 if(id==='autoDemo'){this.settings.value.autoDemo=!this.settings.value.autoDemo;this.settings.save('auto-demo');return;}
 if(id==='flash'){this.settings.value.flash=!this.settings.value.flash;this.settings.save('shift-led');return;}
 if(id.indexOf('theme:')===0){const n=id.slice(6);this.settings.value.theme=n==='next'?(this.settings.value.theme+1)%12:n==='prev'?(this.settings.value.theme+11)%12:Math.max(0,Math.min(11,Number(n)||0));this.settings.save('theme');return;}
 if(id.indexOf('mode:')===0){const mode=id.slice(5);if(['comfort','sport','sportplus','pn'].indexOf(mode)>=0){this.settings.value.mode=mode;this.settings.save('demo-profile-mode');}return;}
 if(id.indexOf('profile:')===0){const s=id.split(':'),key=s[1],sign=s[2]==='+'?1:-1,mode=this.settings.value.mode;if(mode==='comfort')return;const p=this.settings.value.profile[mode];const b={duration:[0,4,.1],aggression:[0,100,5],delay:[0,1000,25],rpmMin:[1000,7600,100],rpmMax:[1000,7600,100]}[key];if(!b)return;p[key]=Math.round(Math.max(b[0],Math.min(b[1],p[key]+b[2]*sign))*10)/10;if(p.rpmMin>p.rpmMax)p.rpmMax=p.rpmMin;this.settings.save('demo-profile-only');return;}
 if(id.indexOf('flap:')===0){if(this.config.kind!=='pops'||this.busy)return;const mode=id.slice(5);if(['open','close','oem'].indexOf(mode)<0)return;if(!this.confirmAction(id))return;const frame=this.telemetry.getFrame(false);const speed=this.telemetry.read('speed');this.settings.backup('before-exhaust-flap-command');this.busy=true;this.note('WYSYLAM TYLKO STEROWANIE KLAPA. BEZ FLASH I BEZ PRZELACZANIA MAP.');
 const ctx={pops:true,confirmed:true,demo:!frame.hasReal,speed:speed,releaseOwned:mode==='oem'&&this.gateway.flap.owned};
 this.gateway.setFlap(mode,ctx).then(result=>{this.diag.clear('FLAP_COMMAND');this.note(result.position?'DME POTWIERDZILO POLECENIE KLAPY. TO NIE ZMIANA POPSOW ANI MAPY.':'POLECENIE PRZYJETE, ALE BRAK POTWIERDZENIA POZYCJI. ZOBACZ BLEDY.');if(result.readbackError)this.diag.warn('FLAP_READBACK',result.readbackError);},e=>{this.diag.error('FLAP_COMMAND',e,{mode:mode,realSpeed:speed});this.note('BLAD KLAPY: '+e.message);this.report();this.page='errors';}).then(()=>{this.busy=false;});return;}
 }
 shutdown(){this.destroyed=true;this.hide();clearInterval(this.timer);clearInterval(this.watch);const release=this.gateway.flap.owned?this.gateway.setFlap('oem',{pops:true,confirmed:true,releaseOwned:true}):Promise.resolve();return require('./gateway').limit(release,8000,'FLAP_RELEASE_ON_EXIT').catch(e=>this.diag.warn('FLAP_RELEASE_ON_EXIT',e)).then(()=>{this.gateway.close();this.gpu.close();this.diag.flush(true);});}
}
module.exports={Controller:Controller};
