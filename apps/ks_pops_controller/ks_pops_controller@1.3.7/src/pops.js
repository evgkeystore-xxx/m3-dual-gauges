/* Pops controller 1.3.0 — experimental BMW iDrive 8 OAP application.
 * NATIVE MGU DISPLAY ONLY: UI/persisted profiles, demo metrics, no ECU commands,
 * no OEM camera access, no native audio routing. License: GPL-3.0-or-later.
 */
'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const OnlineApp=require('oap-sdk/src/core/OnlineApp.js');
const logging=require('oap-sdk/src/logging/logging');
const {RenderClient,imageOp}=require('./mgu_render_client.js');
const logger=logging.getSDKLogger();
const ID='ks_pops_controller',W=1440,H=540,MODES=['comfort','sport','sportplus','pn'],VIEWS=['params','graphs','engine'];
const ASSETS=findAssets(),DATA=findData(),FILE=path.join(DATA,'profiles-v4.json');
const CAPABILITY=path.join(DATA,'multimap-capability.json');
function capability(){try{const c=JSON.parse(fs.readFileSync(CAPABILITY,'utf8'));
 if(c&&c.schema===1&&c.capability==='mhd-multimap'&&c.status==='verified'&&c.evidence==='confirmed-on-this-ecu-by-tuner'&&Number.isInteger(c.mapCount)&&c.mapCount>=2&&c.mapCount<=4&&typeof c.tuneIdentifier==='string'&&c.tuneIdentifier.length>=4&&c.tuneIdentifier.length<=128)return {available:true,count:c.mapCount};}catch(e){}return {available:false,count:0};}
function clip(v,a,b){return Math.min(b,Math.max(a,v));}function clone(x){return JSON.parse(JSON.stringify(x));}
const DEFAULT={mode:'sportplus',view:'params',enabled:true,maxPower:700,maxNm:900,maxBoost:2.5,debug:false,debugExpanded:false,soundEnabled:false,sound:'r6',volume:25,profiles:{
 comfort:{rpmFrom:1000,rpmTo:7600,length:0,power:0,delay:0,flame:false,flameLength:0,flamePower:0},
 sport:{rpmFrom:2500,rpmTo:4200,length:0.8,power:35,delay:300,flame:false,flameLength:0,flamePower:0},
 sportplus:{rpmFrom:2500,rpmTo:5000,length:2.4,power:80,delay:200,flame:false,flameLength:70,flamePower:80},
 pn:{rpmFrom:1600,rpmTo:3500,length:0.6,power:25,delay:400,flame:false,flameLength:50,flamePower:50}}};
function load(){const o=clone(DEFAULT);try{const u=JSON.parse(fs.readFileSync(FILE,'utf8'));
 if(MODES.includes(u.mode))o.mode=u.mode;if(VIEWS.includes(u.view))o.view=u.view;
 for(const b of ['enabled','debug','soundEnabled'])if(typeof u[b]==='boolean')o[b]=u[b];
 for(const n of [['maxPower',50,2000],['maxNm',100,2500],['maxBoost',0.5,5],['volume',0,100]])if(Number.isFinite(u[n[0]]))o[n[0]]=clip(u[n[0]],n[1],n[2]);
 if(['r6','v6','v10','v12'].includes(u.sound))o.sound=u.sound;
 for(const k of MODES){const p=u.profiles&&u.profiles[k];if(!p)continue;for(const key of ['rpmFrom','rpmTo','length','power','delay','flameLength','flamePower'])if(Number.isFinite(p[key])){
  const bounds=key.startsWith('rpm')?[1000,7600,100]:key==='length'?[0,4,.1]:key==='delay'?[0,1000,25]:[0,100,5];o.profiles[k][key]=clip(Math.round(p[key]/bounds[2])*bounds[2],bounds[0],bounds[1]);}
  if(typeof p.flame==='boolean')o.profiles[k].flame=p.flame;
  if(o.profiles[k].rpmFrom>o.profiles[k].rpmTo)o.profiles[k].rpmTo=o.profiles[k].rpmFrom;
 }
 }catch(e){}o.profiles.comfort.length=0;o.profiles.comfort.power=0;o.profiles.comfort.flame=false;return o;}
function findAssets(){
 const roots=[__dirname,path.join(__dirname,'..'),path.join(__dirname,'..','..'),process.cwd(),
  path.dirname(process.mainModule&&process.mainModule.filename||process.execPath),
  path.join(process.cwd(),'source'),path.join(process.cwd(),'package')];
 for(const root of roots){for(const relative of ['assets','package/assets','source/assets','../assets','../source/assets']){
   const candidate=path.resolve(root,relative);
   try{if(fs.statSync(candidate).isDirectory()&&fs.existsSync(path.join(candidate,'font_14.alpha.z')))return candidate;}catch(e){}
 }}
 const fallback=path.resolve(process.cwd(),'assets');logger.error('ASSETS NOT FOUND from cwd '+process.cwd()+' __dirname='+__dirname);return fallback;
}
function findData(){return path.resolve(process.cwd(),'../data');}
class Gfx{
 constructor(){this.base={};this.fonts={};this.p=Buffer.alloc(W*H*4);
 for(const n of [14,16,20,24])this.fonts[n]={data:zlib.inflateSync(fs.readFileSync(path.join(ASSETS,'font_'+n+'.alpha.z'))),info:JSON.parse(fs.readFileSync(path.join(ASSETS,'font_'+n+'.json'),'utf8'))};}
 getBase(k){if(!this.base[k]){this.base={};try{this.base[k]=zlib.inflateSync(fs.readFileSync(path.join(ASSETS,k+'.rgba.z')));}catch(e){logger.error('asset load '+k+': '+e.message);throw e;}}return this.base[k];}
 pix(x,y,c,a=255){x=x|0;y=y|0;if(x<0||x>=W||y<0||y>=H)return;const i=(y*W+x)*4,t=a/255;for(let j=0;j<3;j++)this.p[i+j]=this.p[i+j]*(1-t)+c[j]*t;this.p[i+3]=255;}
 rect(x,y,w,h,c,a=255){for(let yy=Math.max(0,y|0);yy<Math.min(H,(y+h)|0);yy++)for(let xx=Math.max(0,x|0);xx<Math.min(W,(x+w)|0);xx++)this.pix(xx,yy,c,a);}
 circle(x,y,r,c,a=255){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(dx*dx+dy*dy<=r*r)this.pix(x+dx,y+dy,c,a);}
 knob(x,y){x=Math.round(x);y=Math.round(y);this.circle(x,y+2,14,[4,13,25],215);this.circle(x,y,12,[89,157,198]);this.circle(x,y,9,[233,246,255]);this.circle(x-3,y-3,3,[255,255,255],115);}
 line(x0,y0,x1,y1,c,w=2){let dx=x1-x0,dy=y1-y0,n=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy)));for(let i=0;i<=n;i++){const x=x0+dx*i/(n||1),y=y0+dy*i/(n||1);if(w===1)this.pix(x,y,c);else this.circle(x,y,w-1,c);}}
 width(t,n){const g=this.fonts[n].info.glyphs;let w=0;Array.from(String(t)).forEach(ch=>w+=(g[ch]||g['?']).width);return w;}
 text(t,x,y,n,c=[242,249,255],side){const f=this.fonts[n],inf=f.info,g=inf.glyphs;if(side==='right')x-=this.width(t,n);if(side==='center')x-=this.width(t,n)/2;let ax=Math.round(x);
 for(const ch of Array.from(String(t))){const v=g[ch]||g['?'];if(!v)continue;for(let dy=0;dy<inf.height;dy++)for(let dx=0;dx<Math.min(v.width,inf.cell);dx++){let a=f.data[dy*inf.width+v.x+dx];if(a>10)this.pix(ax+dx,y+dy,c,a);}ax+=v.width;}}
 bar(x,y,w,h,value,max,pulse){let r=clip(value/max,0,1),col=r>=.95?[255,pulse?200:20,pulse?220:65]:r>=.85?[255,49,85]:r>=.6?[255,171,40]:[0,226,130];const n=Math.round(r*w);this.rect(x,y,n,h,col,245);this.rect(x,y,n,2,[242,255,255],125);if(r>=.85)this.rect(x,y-2,n,h+4,col,r>=.95?(pulse?80:30):35);}
 graph(history,started,selected){const x0=1040,x1=1402,y0=194,y1=391;for(let i=0;i<=4;i++)this.line(x0,y0+(y1-y0)*i/4,x1,y0+(y1-y0)*i/4,[31,61,89],1);
 for(let i=0;i<=6;i++)this.line(x0+(x1-x0)*i/6,y0,x0+(x1-x0)*i/6,y1,[23,50,75],1);
 if(!history.length)return;const latest=history[history.length-1].time;
 for(const [k,max,c] of [['rpm',7600,[60,202,255]],['km',700,[255,76,119]],['boost',2.5,[246,195,91]]]){let prev=null;for(const p of history){let t=(latest-p.time)/60000,x=x1-clip(t,0,1)*(x1-x0),y=y1-clip(p[k]/max,0,1)*(y1-y0);if(prev)this.line(prev[0],prev[1],x,y,c,2);prev=[x,y];}}
 if(selected!==null){let idx=clip(selected|0,0,history.length-1),p=history[idx],x=x1-clip((latest-p.time)/60000,0,1)*(x1-x0);this.line(x,y0,x,y1,[221,239,255],1);this.rect(1032,419,360,25,[7,23,38]);this.text(p.rpm+'rpm / '+p.km+'KM / '+p.boost.toFixed(2)+'bar',1044,423,14,[212,238,255]);}}
 render(st,screen,cap,metrics,history,graphRunning,selected,flash){const view=st.view||'params';const k=MODES.includes(screen)?screen+'_'+view:screen;this.getBase(k).copy(this.p);const white=[245,251,255];
 if(MODES.includes(screen)){
  if(screen!=='comfort'){const p=st.profiles[screen],big=screen==='sport',lo=58,hi=big?959:557;
   this.text(p.rpmFrom+' - '+p.rpmTo,260,178,20,white);
   this.knob(lo+(hi-lo)*(p.rpmFrom-1000)/6600,230);this.knob(lo+(hi-lo)*(p.rpmTo-1000)/6600,230);
   const sliderStart=big?287:206,sliderEnd=big?876:484,valX=big?963:574;
   for(const f of [{key:'length',max:4,y:310,at:293,txt:p.length.toFixed(1)+' s'},{key:'power',max:100,y:375,at:360,txt:p.power+'%'},{key:'delay',max:1000,y:440,at:426,txt:p.delay+' ms'}]){this.knob(sliderStart+(sliderEnd-sliderStart)*(p[f.key]/f.max),f.y);this.text(f.txt,valX,f.at,20,white,'right');}
   if(screen==='sportplus'||screen==='pn'){this.knob(760+170*p.flameLength/100,235);this.knob(760+170*p.flamePower/100,294);this.text(p.flameLength+'%',969,222,14,white,'right');this.text(p.flamePower+'%',969,281,14,white,'right');}
  }
 }
 if(screen==='settings'){
  const vals=[[''+st.maxPower,422,211],[''+st.maxNm,422,265],[st.maxBoost.toFixed(1),425,317]];
  for(const [v,x,y] of vals){this.rect(383,y-6,83,26,[7,23,38],248);this.text(v,x,y,16,white,'right');}
  this.rect(844,208,125,25,[9,26,42]);this.text(st.sound.toUpperCase(),854,211,16,white);
  this.rect(934,263,51,30,[8,26,43]);this.text(st.volume+'%',976,270,14,white,'right');
  if(st.debugExpanded){this.rect(518,369,459,108,[3,13,24],245);this.text('Debug / OAP',527,376,14,[128,213,255]);this.text('Renderer: '+(this.p.length?'UI OK':'OFF'),527,398,14,white);this.text('Telemetria: DEMO / no ECU',527,420,14,white);this.text('Mapy MHD: '+(cap&&cap.available?cap.count:'niepotwierdzone'),527,442,14,white);}
 }
 if(view==='engine'){
  const items=[{v:metrics.km,max:st.maxPower,y:219,txt:metrics.km+' KM',textY:172},{v:metrics.nm,max:st.maxNm,y:324,txt:metrics.nm+' Nm',textY:276},{v:metrics.boost,max:st.maxBoost,y:429,txt:metrics.boost.toFixed(2)+' bar',textY:383}];
  for(const it of items){this.bar(1047,it.y,347,15,it.v,it.max,flash);this.text(it.txt,1390,it.textY,24,white,'right');}
 }
 if(view==='graphs'){
  this.graph(history,graphRunning,selected);
  if(graphRunning&&history.length){this.rect(1331,142,81,35,[93,17,36],250);this.text('STOP',1371,149,16,white,'center');}
 }
 return this.p;
 }
}
class PopsApp extends OnlineApp{
 constructor(){super();this.settings=load();this.screen=this.settings.mode;this.last=this.settings.mode;this.visible=false;this.dirty=true;this.drag=null;this.saveTimer=null;this.renderTimer=null;this.capability=capability();this.gfx=null;this.gpu=new RenderClient(ID,logger,{mode:'layer'});this.gpu.fps(15);
  this.demoPhase=0;this.metrics={rpm:3250,km:612,nm:760,boost:1.34};this.history=[];this.graphRunning=false;this.selectedSample=null;this.flash=false;
  this.gpu.on('ready',(s,info)=>{try{if(!this.gfx)this.gfx=new Gfx();this.ready(info);}catch(e){logger.error('GFX INIT FAILED '+(e&&e.stack||e));}});this.gpu.on('touch',(phase,x,y)=>this.touch(phase,x,y));this.gpu.on('tick',()=>this.draw());this.gpu.on('closed',()=>{this.dirty=true;this.gpu.show(this.visible)});
  this.on('initialized',()=>this.init().catch(e=>logger.error('MGU STARTUP FAILED: '+(e&&e.stack||e))));this.on('entryPointExecute',id=>this.enter(id));this.on('changeVisibility',d=>{if(d&&d.visible===false)this.show(false)});this.on('shutdown',()=>{clearInterval(this.renderTimer);clearTimeout(this.saveTimer);this.gpu.close()});}
  init(){
  const rhmi=this.rhmiApplication;
  logger.info('MGU SAFE startup ' + process.cwd() + ' assets=' + ASSETS);if(!rhmi){logger.info('Pops: background start without RHMI');return Promise.resolve(this.initialized());}
  const isForeground=()=>{const d=this.getVisibilityData&&this.getVisibilityData();return ['ENTRY_POINT','LUM','BOOKMARK','START_WIDGET','TRIGGER_HMI','SPEECH_COMMAND'].indexOf((d&&d.reason)||this.startReason)>=0;};
  this.host=rhmi.getByName('home');
  if(!this.host)throw Error('Pops: RHMI host state not found');
  this.host.on('visible',e=>{if(e&&(e.visible===true||e.visible==='true'||e.visible===1))this.show(true)});
  rhmi.on('applicationStackChanged',stack=>{if(stack&&Object.keys(stack).length){if(Object.prototype.hasOwnProperty.call(stack,'ROOT_APP'))this.show(true);else if(this.visible)this.show(false);}});
  try{this.gpu.connect();}catch(e){logger.error('RENDER CONNECT FAILED: '+(e&&e.stack||e));}
  const eps=this.getEntryPoints()||[];
  const defs=(this.appDescription&&this.appDescription.application&&this.appDescription.application.entryPoints)||[];
  const ep=eps.find(x=>defs.some(d=>d.uuid===x.getDescription().uuid));
  const foreground=isForeground();
  return Promise.resolve(this.host.updateResources())
   .then(()=>{if(!ep){logger.warn('Pops: manager gave no matching entry point');return;}const d=ep.getDescription();return Promise.resolve(ep.init()).then(()=>rhmi.mapEntryState(d.uuid,this.host))
    .then(()=>Promise.resolve().then(()=>ep.entryPoint.setText(d.textId)).then(()=>d.icon?ep.entryPoint.setIcon(d.icon):undefined).catch(e=>logger.warn('Pops icon/text: '+e.message)))
    .then(()=>ep.setAvailability('ENABLED'));})
   .then(()=>{if(foreground){try{Promise.resolve(this.registerActive()).catch(e=>logger.warn('registerActive: '+e.message));}catch(e){logger.warn('registerActive: '+e.message);}}return this.initialized();})
   .then(()=>{if(foreground)this.show(true);const id=this.getLastExecutedEntryPointUuid&&this.getLastExecutedEntryPointUuid();if(id)return this.enter(id);});
 }
 enter(id){if(!this.rhmiApplication||!id)return Promise.resolve();this.show(true);return Promise.resolve(this.rhmiApplication.openEntryState(id)).catch(e=>logger.error('Pops openEntryState: '+e.message));}
 ready(info){if(!info||!info.appArea||!info.modes||info.modes.indexOf('layer')<0){logger.warn('No mgu-render layer mode');return;}const a=info.appArea,scale=Math.min(a.w/W,a.h/H);this.gpu.mode('layer');this.gpu.place({x:a.x,y:a.y,w:a.w,h:a.h,scale,ox:Math.max(0,(a.w-W*scale)/2),oy:Math.max(0,(a.h-H*scale)/2)});this.gpu.pixmap(1,W,H,'rgba','linear');this.gpu.claim([{x:0,y:0,w:W,h:H}]);this.gpu.show(this.visible);this.dirty=true;if(this.visible)this.draw();clearInterval(this.renderTimer);this.renderTimer=setInterval(()=>{this.demo();this.draw()},600);}
 show(b){if(this.visible===b)return;this.visible=b;this.gpu.show(b);if(b){this.dirty=true;this.draw();}if(this._initialized&&this._appStatusService){const v=b?[this.registerActive(),this.registerHmiVisible()]:[this.unregisterHmiVisible(),this.registerInactive()];v.forEach(p=>Promise.resolve(p).catch(()=>{}));}}
 save(){clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>{try{fs.mkdirSync(DATA,{recursive:true});fs.writeFileSync(FILE,JSON.stringify(this.settings,null,2),'utf8')}catch(e){logger.warn('save '+e.message)}},250)}
 refresh(){this.dirty=true;this.save();this.draw()}
 demo(){this.demoPhase+=.17;const s=Math.sin;this.metrics={rpm:Math.round(3250+380*s(this.demoPhase)),km:Math.round(612+85*s(.59*this.demoPhase)),nm:Math.round(760+90*s(.53*this.demoPhase)),boost:1.34+.26*s(.71*this.demoPhase)};this.flash=!this.flash;if(this.graphRunning){this.history.push({...this.metrics,time:Date.now()});const cut=Date.now()-60000;while(this.history.length&&this.history[0].time<cut)this.history.shift();if(this.history.length>160)this.history.shift()}this.dirty=true;}
 draw(){if(!this.visible||!this.gpu.ready||!this.gpu.native||!this.gpu.placement)return;if(this.dirty){this.gpu.pixels(1,[{x:0,y:0,w:W,h:H}],this.gfx.render(this.settings,this.screen,this.capability,this.metrics,this.history,this.graphRunning,this.selectedSample,this.flash));this.dirty=false;}this.gpu.frameWords(imageOp(1,0,0,W,H,0));}
 touch(phase,x,y){if(!this.visible||!Number.isFinite(x)||!Number.isFinite(y))return;if(phase==='up'){this.drag=null;return;}if(phase==='move'&&!this.drag)return;if(phase!=='down'&&phase!=='move')return;
 if(phase==='down'){
  if(y>=84&&y<=139&&x>=1027){const i=Math.floor((x-1027)/128);if(i>=0&&i<3){this.settings.view=VIEWS[i];this.refresh();return;}}
  if(this.settings.view==='graphs'&&x>=1330&&x<=1414&&y>=138&&y<181){this.graphRunning=!this.graphRunning;this.history=[];this.selectedSample=null;this.refresh();return;}
  if(this.settings.view==='graphs'&&x>=1030&&x<=1413&&y>=184&&y<=413&&this.history.length){const idx=Math.round(clip((x-1040)/360,0,1)*(this.history.length-1));this.selectedSample=idx;this.refresh();return;}
  if(this.screen==='settings'){
   if(x>=40&&x<=150&&y>=90&&y<138){this.screen=this.last;this.refresh();return;}
   if(x>=442&&x<495&&y>=150&&y<193){this.settings.enabled=!this.settings.enabled;this.refresh();return;}
   if(x>=378&&x<496&&y>=195&&y<248){this.settings.maxPower=clip(this.settings.maxPower+(x>428?10:-10),50,2000);this.refresh();return;}
   if(x>=378&&x<496&&y>=250&&y<301){this.settings.maxNm=clip(this.settings.maxNm+(x>428?10:-10),100,2500);this.refresh();return;}
   if(x>=378&&x<496&&y>=302&&y<355){this.settings.maxBoost=clip(Math.round((this.settings.maxBoost+(x>428?.1:-.1))*10)/10,.5,5);this.refresh();return;}
   if(x>=913&&x<=970&&y>=148&&y<198){this.settings.soundEnabled=!this.settings.soundEnabled;this.refresh();return;}
   if(x>=840&&x<=969&&y>=195&&y<250){const names=['r6','v6','v10','v12'];this.settings.sound=names[(names.indexOf(this.settings.sound)+1)%names.length];this.refresh();return;}
   if(x>=811&&x<=977&&y>=253&&y<303){this.settings.volume=Math.round(clip((x-811)/166,0,1)*20)*5;this.refresh();return;}
   if(x>=515&&x<675&&y>=356&&y<383){this.settings.debugExpanded=!this.settings.debugExpanded;this.refresh();return;}
   return;
  }
  if(this.screen==='camera'){
   if(x>=40&&x<=150&&y>=90&&y<140){this.screen=this.last;this.refresh();}return;}
  if(y>=73&&y<140&&x>=22&&x<837){const idx=Math.floor((x-22)/206);if(idx>=0&&idx<4){const name=MODES[idx];this.settings.mode=name;this.screen=this.last=name;this.refresh();return;}}
  if(y>=73&&y<140&&x>=841&&x<922){this.last=this.screen;this.screen='camera';this.refresh();return;}
  if(y>=73&&y<140&&x>=923&&x<1005){this.last=this.screen;this.screen='settings';this.refresh();return;}
 }
 if(!MODES.includes(this.screen)||this.screen==='comfort'||!this.settings.enabled)return;
 const mode=this.screen,p=this.settings.profiles[mode],big=mode==='sport';
 if(phase==='down'){
  const lo=58,hi=big?960:559;
  if(y>=208&&y<=260&&x>=lo-15&&x<=hi+15){const a=lo+(hi-lo)*(p.rpmFrom-1000)/6600,b=lo+(hi-lo)*(p.rpmTo-1000)/6600;this.drag=Math.abs(x-a)<Math.abs(x-b)?'rpmFrom':'rpmTo';}
  else if(y>=289&&y<=330&&x>=200&&x<=(big?875:490))this.drag='length';
  else if(y>=351&&y<=402&&x>=200&&x<=(big?875:490))this.drag='power';
  else if(y>=417&&y<=462&&x>=200&&x<=(big?875:490))this.drag='delay';
  else if((mode==='sportplus'||mode==='pn')&&y>=162&&y<=206&&x>=927&&x<=985){p.flame=!p.flame;this.refresh();return;}
  else if((mode==='sportplus'||mode==='pn')&&y>=211&&y<263&&x>=760&&x<=932)this.drag='flameLength';
  else if((mode==='sportplus'||mode==='pn')&&y>=270&&y<323&&x>=760&&x<=932)this.drag='flamePower';
 }
 if(!this.drag)return;
 if(this.drag==='rpmFrom'||this.drag==='rpmTo'){
  const lo=58,hi=big?959:557,r=clip(Math.round((1000+6600*(x-lo)/(hi-lo))/100)*100,1000,7600);
  if(this.drag==='rpmFrom')p.rpmFrom=Math.min(r,p.rpmTo);else p.rpmTo=Math.max(r,p.rpmFrom);
 }else{
  const a=this.drag.startsWith('flame')?760:big?287:206,b=this.drag.startsWith('flame')?930:big?876:484,t=clip((x-a)/(b-a),0,1);
  if(this.drag==='length')p.length=Math.round(t*40)/10;else if(this.drag==='delay')p.delay=Math.round(t*40)*25;else p[this.drag]=Math.round(t*20)*5;
 }
 this.refresh();}
}
module.exports={PopsApp,Gfx,load,capability};if(process.env.POPS_PREVIEW!=='1')new PopsApp().start().catch(e=>logger.error('Pops startup '+(e&&e.stack||e)));
