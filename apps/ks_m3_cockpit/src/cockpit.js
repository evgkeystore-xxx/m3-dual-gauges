/* M3 Competition Cockpit Studio 1.0.0 (prototype)
 * iDrive 8 OAP app using mgu-render: theme gallery and opt-in cluster widget.
 * Not a replacement for stock speedometer, warning lamps or official software.
 * GPU overlay values are SIMULATED, never assert ECU connection.
 */
'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const OnlineApp=require('oap-sdk/src/core/OnlineApp.js');
const logging=require('oap-sdk/src/logging/logging');
const {RenderClient,imageOp}=require('./mgu_render_client.js');
const {ClusterWidget}=require('./cluster_widget.js');
const logger=logging.getSDKLogger(),ID='ks_m3_cockpit',W=1440,H=540;
const ASSETS=findAssets();const DATA=findData(),FILE=path.join(DATA,'config.json');
const DEFAULT={theme:3,enabled:true,flash:true,demo:false,widgetEnabled:false,threshold:7000,rpm:5900};
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
function load(){const o=Object.assign({},DEFAULT);try{const s=JSON.parse(fs.readFileSync(FILE,'utf8'));if(Number.isFinite(s.theme))o.theme=clamp(Math.round(s.theme),1,12);if(Number.isFinite(s.rpm))o.rpm=clamp(Math.round(s.rpm/50)*50,0,8000);if(Number.isFinite(s.threshold))o.threshold=clamp(Math.round(s.threshold/50)*50,6000,8000);for(const k of ['enabled','flash','demo'])if(typeof s[k]==='boolean')o[k]=s[k]; // widget disabled on EVERY startup: requires fresh opt-in
 }catch(e){}o.widgetEnabled=false;return o;}
function save(s){try{if(!fs.existsSync(DATA))fs.mkdirSync(DATA);fs.writeFileSync(FILE,JSON.stringify(Object.assign({},s,{widgetEnabled:false}),null,2))}catch(e){logger.warn('Config save '+e.message)}}
function getTheme(n){return 'theme_'+String(n).padStart(2,'0')+'.rgba.z'}
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
 constructor(){this.base={};
 this.font={};for(const size of [14,16,20,24])this.font[size]={pix:zlib.inflateSync(fs.readFileSync(path.join(ASSETS,'font_'+size+'.alpha.z'))),meta:JSON.parse(fs.readFileSync(path.join(ASSETS,'font_'+size+'.json'),'utf8'))};}
 getBase(k){if(!this.base[k]){this.base={};const file=typeof k==='number'?getTheme(k):k+'.rgba.z';try{this.base[k]=zlib.inflateSync(fs.readFileSync(path.join(ASSETS,file)));}catch(e){logger.error('asset load '+k+': '+e.message);throw e;}}return this.base[k];}
 pix(b,w,h,x,y,col,a){x=x|0;y=y|0;if(x<0||x>=w||y<0||y>=h)return;let i=4*(y*w+x),v=a/255;for(let k=0;k<3;k++)b[i+k]=(b[i+k]*(1-v)+col[k]*v)|0;b[i+3]=255;}
 dot(b,w,h,x,y,r,col,a){for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++)if(xx*xx+yy*yy<=r*r)this.pix(b,w,h,x+xx,y+yy,col,a)}
 line(b,w,h,x0,y0,x1,y1,col,r,a){let n=Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0)));for(let i=0;i<=n;i++){let x=x0+(x1-x0)*i/(n||1),y=y0+(y1-y0)*i/(n||1);this.dot(b,w,h,x,y,r,col,a)}}
 text(b,w,h,s,x,y,size,col){let f=this.font[size],atlas=f.pix,meta=f.meta,g=meta.glyphs;let ax=x|0;for(const ch of Array.from(String(s))){let v=g[ch]||g['?'];if(!v)continue;for(let dy=0;dy<meta.height;dy++)for(let dx=0;dx<Math.min(v.width,meta.cell);dx++){let alpha=atlas[dy*meta.width+v.x+dx];if(alpha>10)this.pix(b,w,h,ax+dx,y+dy,col,alpha)}ax+=v.width;}}
 drawOverlay(st,screen,rpm,confirm,widgetReady){let w=220,h=350,b=Buffer.alloc(w*h*4); // separate small pixmap, updated without rewriting the photo
 const txt=(s,x,y,n,c)=>this.text(b,w,h,s,x,y,n,c||[238,245,255]);let red=[247,48,76],cyan=[51,190,245],white=[235,243,255];
 if(screen==='settings'){
  const lines=[st.enabled?'WLACZONE':'WYLACZONE',st.widgetEnabled?(widgetReady?'WIDGET AKTYWNY':'WIDGET CZEKA'):'WIDGET OFF',st.flash?'LED ON':'LED OFF',st.demo?'DEMO ON':'DEMO OFF',confirm?'POTWIERDZ RESET':'RESET'];
  lines.forEach((v,i)=>{let y=i*60+18;this.line(b,w,h,12,y+23,196,y+23,[52,81,106],1,120);txt(v,23,y,16,i===1&&!st.widgetEnabled?red:(i===4&&confirm?red:cyan))});
 }else{
  txt('RPM  /  DEMO',12,4,16,cyan);txt(String(Math.round(rpm/50)*50),8,36,24,white);
  const cx=110,cy=185,R=82,angle=(155+(rpm/8000)*240)*Math.PI/180;
  for(let k=0;k<=18;k++){const a=(155+k/18*240)*Math.PI/180;this.dot(b,w,h,cx+R*Math.cos(a),cy+R*Math.sin(a),2,[120,161,186],210)}
  let x=cx+R*.88*Math.cos(angle),y=cy+R*.88*Math.sin(angle);
  this.line(b,w,h,cx,cy,x,y,red,3,255);this.dot(b,w,h,cx,cy,5,white,255);this.dot(b,w,h,x,y,4,red,255);
  if(rpm>=st.threshold&&st.flash&&(Math.floor(Date.now()/250)%2===0)){for(let j=0;j<10;j++){let color=(j%2)?white:red;this.line(b,w,h,j*21,116,j*21+14,116,color,2,245)}}
  txt(st.demo?'SIMULACJA AUTO':'STEROWANIE RECZNE',8,290,14,[167,194,215]);txt('BEZ ECU / OBD',8,315,14,red);
 }
 return b;}
}
class CockpitApp extends OnlineApp{
 constructor(){super();this.config=load();this.page='main';this.visible=false;this.gfx=null;this.widget=null;this.gpu=new RenderClient(ID,logger,{mode:'layer'});this.gpu.fps(24);this.lastBase='';this.lastUploaded=false;this.rpm=this.config.rpm;this.demoTick=0;this.confirmReset=false;this.resetAt=0;this.lastFrame=0;
 this.gpu.on('ready',(s,info)=>{try{if(!this.gfx)this.gfx=new Gfx();if(!this.widget)this.widget=new ClusterWidget(ASSETS,logger);this.ready(info);}catch(e){logger.error('GFX INIT FAILED '+(e&&e.stack||e));}});this.gpu.on('tick',()=>this.render());this.gpu.on('touch',(phase,x,y)=>this.touch(phase,x,y));this.gpu.on('closed',()=>{this.lastBase='';this.gpu.show(this.visible)});
 this.on('initialized',()=>this.init().catch(e=>logger.error('MGU STARTUP FAILED: '+(e&&e.stack||e))));this.on('entryPointExecute',id=>this.enter(id));this.on('changeVisibility',x=>{if(x&&x.visible===false)this.show(false)});this.on('shutdown',()=>{if(this.timer)clearInterval(this.timer);if(this.widget)this.widget.stop();this.gpu.close()});}
  init(){
  const rhmi=this.rhmiApplication;
  logger.info('MGU SAFE startup ' + process.cwd() + ' assets=' + ASSETS);if(!rhmi){logger.info('Cockpit: background start without RHMI');return Promise.resolve(this.initialized());}
  const isForeground=()=>{const d=this.getVisibilityData&&this.getVisibilityData();return ['ENTRY_POINT','LUM','BOOKMARK','START_WIDGET','TRIGGER_HMI','SPEECH_COMMAND'].indexOf((d&&d.reason)||this.startReason)>=0;};
  this.host=rhmi.getByName('home');
  if(!this.host)throw Error('Cockpit: RHMI host state not found');
  this.host.on('visible',e=>{if(e&&(e.visible===true||e.visible==='true'||e.visible===1))this.show(true)});
  rhmi.on('applicationStackChanged',stack=>{if(stack&&Object.keys(stack).length){if(Object.prototype.hasOwnProperty.call(stack,'ROOT_APP'))this.show(true);else if(this.visible)this.show(false);}});
  try{this.gpu.connect();}catch(e){logger.error('RENDER CONNECT FAILED: '+(e&&e.stack||e));}
  const eps=this.getEntryPoints()||[];
  const defs=(this.appDescription&&this.appDescription.application&&this.appDescription.application.entryPoints)||[];
  const ep=eps.find(x=>defs.some(d=>d.uuid===x.getDescription().uuid));
  const foreground=isForeground();
  return Promise.resolve(this.host.updateResources())
   .then(()=>{if(!ep){logger.warn('Cockpit: manager gave no matching entry point');return;}const d=ep.getDescription();return Promise.resolve(ep.init()).then(()=>rhmi.mapEntryState(d.uuid,this.host))
    .then(()=>Promise.resolve().then(()=>ep.entryPoint.setText(d.textId)).then(()=>d.icon?ep.entryPoint.setIcon(d.icon):undefined).catch(e=>logger.warn('Cockpit icon/text: '+e.message)))
    .then(()=>ep.setAvailability('ENABLED'));})
   .then(()=>{if(foreground){try{Promise.resolve(this.registerActive()).catch(e=>logger.warn('registerActive: '+e.message));}catch(e){logger.warn('registerActive: '+e.message);}}return this.initialized();})
   .then(()=>{if(foreground)this.show(true);const id=this.getLastExecutedEntryPointUuid&&this.getLastExecutedEntryPointUuid();if(id)return this.enter(id);});
 }
 enter(id){if(!this.rhmiApplication||!id)return Promise.resolve();this.show(true);return Promise.resolve(this.rhmiApplication.openEntryState(id)).catch(e=>logger.error('Cockpit openEntryState: '+e.message));}
 ready(info){if(!info||!info.appArea||!info.modes||info.modes.indexOf('layer')<0){logger.warn('No native layer mode');return;}let a=info.appArea,scale=Math.min(a.w/W,a.h/H);this.gpu.mode('layer');this.gpu.place({x:a.x,y:a.y,w:a.w,h:a.h,scale,ox:Math.max(0,(a.w-W*scale)/2),oy:Math.max(0,(a.h-H*scale)/2)});this.gpu.pixmap(1,W,H,'rgba','linear');this.gpu.pixmap(2,220,350,'rgba','linear');this.gpu.claim([{x:0,y:0,w:W,h:H}]);this.gpu.show(this.visible);this.lastBase='';if(!this.timer)this.timer=setInterval(()=>this.advance(),50);}
 show(b){this.visible=!!b;this.gpu.show(this.visible);if(this.visible){this.lastBase='';this.render()}if(this._initialized&&this._appStatusService){const q=b?[this.registerActive(),this.registerHmiVisible()]:[this.unregisterHmiVisible(),this.registerInactive()];q.forEach(p=>Promise.resolve(p).catch(()=>{}))}}
 baseKey(){return this.page==='settings'?'settings':this.config.enabled?this.config.theme:'disabled'}
 render(){if(!this.visible||!this.gpu.ready||!this.gpu.native||!this.gpu.placement)return;const k=this.baseKey();if(k!==this.lastBase){this.gpu.pixels(1,[{x:0,y:0,w:W,h:H}],this.gfx.getBase(k));this.lastBase=k}this.gpu.pixels(2,[{x:0,y:0,w:220,h:350}],this.gfx.drawOverlay(this.config,this.page,this.rpm,this.confirmReset,this.widget.ready));const x=this.page==='settings'?1012:1210,y=this.page==='settings'?157:160;this.gpu.frameWords(new Uint32Array(Array.from(imageOp(1,0,0,W,H,0)).concat(Array.from(imageOp(2,x,y,220,350,0)))));}
 advance(){if(this.config.demo&&this.config.enabled){this.demoTick+=0.055;this.rpm=clamp(Math.round((4100+3650*Math.sin(this.demoTick))/50)*50,0,8000)} if(this.config.widgetEnabled&&this.widget.ready)this.widget.updateRpm(this.rpm,this.config.threshold);}
 choose(n){this.config.theme=clamp(n,1,12);this.lastBase='';this.persist();if(this.config.widgetEnabled)this.widget.updateTheme(this.config.theme)}
 persist(){save(this.config)}
 optWidget(v){if(!v){this.config.widgetEnabled=false;this.widget.stop();return}this.config.widgetEnabled=true;this.widget.start(this.config.theme,this.rpm,this.config.threshold)}
 reset(){this.optWidget(false);this.config=Object.assign({},DEFAULT);this.rpm=this.config.rpm;this.page='main';this.confirmReset=false;this.lastBase='';this.persist()}
 touch(phase,x,y){if(phase!=='down'||!Number.isFinite(x)||!Number.isFinite(y))return;
 if(this.page==='settings'){
  if(x>=150&&x<350&&y>=461&&y<510){this.page='main';this.lastBase='';return;}
  if(x<180||x>1290)return;
  if(y>=162&&y<214){this.config.enabled=!this.config.enabled;if(!this.config.enabled)this.optWidget(false);this.lastBase='';}
  else if(y>=221&&y<273){this.optWidget(!this.config.widgetEnabled);}
  else if(y>=280&&y<332){this.config.flash=!this.config.flash;}
  else if(y>=339&&y<391){this.config.demo=!this.config.demo;}
  else if(y>=398&&y<450){if(this.confirmReset&&Date.now()-this.resetAt<4000){this.reset();return;}this.confirmReset=true;this.resetAt=Date.now();setTimeout(()=>{this.confirmReset=false},4100);return;}
  this.persist();return;
 }
 if(x>=14&&x<=227&&y>=78&&y<78+12*34){this.choose(clamp(Math.floor((y-78)/34)+1,1,12));return;}
 if(x>=1210&&x<=1428){if(y>=80&&y<134){this.page='settings';this.lastBase='';return;}
 if(y>=143&&y<203){this.config.demo=false;this.rpm=clamp(Math.round((1000+7000*clamp((x-1210)/208,0,1))/50)*50,0,8000);this.config.rpm=this.rpm;this.persist();return;}
 if(y>=219&&y<273){this.choose(clamp(this.config.theme+(x>1315?1:-1),1,12));return;}
 if(y>=291&&y<345){this.page='settings';this.lastBase='';return;}
 if(y>=354&&y<408){this.page='settings';this.confirmReset=true;this.resetAt=Date.now();this.lastBase='';return;}
 }
 }
}
module.exports={CockpitApp,Gfx,load,DEFAULT};if(process.env.M3_COCKPIT_PREVIEW!=='1')new CockpitApp().start().catch(e=>logger.error('Cockpit startup '+(e&&e.stack||e)));
