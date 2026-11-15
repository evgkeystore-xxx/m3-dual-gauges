/* M3 Cockpit iDrive 8 — opt-in CLUSTER WIDGET (not full cluster replacement).
 * Uses the documented cluster-render/1 protocol, 2026. Requires robertnisipeanu/idrive-apps
 * cluster-render installed separately. Defaults OFF. No unverified ECU reads.
 * GPL-3.0-or-later.
 */
'use strict';
const net=require('net'),fs=require('fs'),path=require('path'),zlib=require('zlib');
const SOCKET='/dev/shm/cluster-render/render.sock';
const WIDTH=1140,HEIGHT=480;
class ClusterWidget{
 constructor(root,log){this.root=root;this.log=log||console;this.socket=null;this.active=false;this.ready=false;this.rx=Buffer.alloc(0);this.seq=0;this.theme=3;this.rpm=5900;this.threshold=7000;this.lastError='';this.isPublished=false;}
 send(type,body){if(!this.socket||this.socket.destroyed)return false;let header=Buffer.alloc(5);header.writeUInt32LE(body.length+1,0);header[4]=type;return this.socket.write(Buffer.concat([header,body]));}
 json(data){return this.send(0x4a,Buffer.from(JSON.stringify(data),'utf8'));}
 start(theme,rpm,threshold){if(this.active){this.updateTheme(theme);this.updateRpm(rpm,threshold);return;}
 this.active=true;this.theme=theme;this.rpm=rpm;this.threshold=threshold;this.ready=false;this.isPublished=false;
 try{this.socket=net.createConnection(SOCKET);const s=this.socket;s.on('connect',()=>this.json({op:'hello',app:'ks_m3_cockpit',proto:1}));
 s.on('data',buf=>this.onData(buf));s.on('error',e=>{this.lastError=e.message;if(this.log.warn)this.log.warn('cluster-widget: '+e.message)});
 s.on('close',()=>{this.ready=false;this.isPublished=false;this.socket=null;this.active=false});}
 catch(e){this.active=false;this.lastError=e.message;}}
 onData(buf){this.rx=this.rx.length?Buffer.concat([this.rx,buf]):buf;while(this.rx.length>=5){let len=this.rx.readUInt32LE(0);if(len<1||len>1024*1024){this.lastError='Bad reply';this.stop();return;}if(this.rx.length<4+len)break;const type=this.rx[4],body=this.rx.slice(5,4+len);this.rx=this.rx.slice(4+len);if(type!==0x4a)continue;let evt;try{evt=JSON.parse(body.toString('utf8'))}catch(e){continue;}
 if(evt.op==='hello'){if(evt.backend!=='id8'||typeof evt.targets!=='string'||evt.targets.indexOf('widget:')<0){this.lastError='Wymagany renderer iDrive 8 / target widget';this.stop();return;}this.ready=true;this.publish()}
 else if(evt.op==='error'){this.lastError=String(evt.reason||evt.message||'Renderer error');if(this.log.warn)this.log.warn('cluster-widget '+this.lastError)}
 }}
 img(theme){let n=Math.max(1,Math.min(12,Math.round(theme)||3)),file=path.join(this.root,'widget_'+(n<10?'0':'')+n+'.rgba.z');return zlib.inflateSync(fs.readFileSync(file));}
 frame(ref,pixels){const b=Buffer.alloc(4+8+2);b.writeUInt32LE(ref,0);b.writeUInt32LE(++this.seq,4);b.writeUInt32LE(0,8);b.writeUInt16LE(0,12);this.send(0x46,Buffer.concat([b,pixels]));}
 publish(){if(!this.ready)return; // show only in the stock cluster's optional widget area, not on speedometer
 this.json({op:'layer',ref:1,target:'widget',kind:'image',class:'content',x:550,y:220,w:1140,h:480,iw:WIDTH,ih:HEIGHT,fps:10,sampling:'bilinear',contend:0,exclusive:0,visible:1});
 // Real-time GPU overlay: narrow shift-light strip; never obscures the factory gauges.
 const shader='precision mediump float; varying vec2 v_uv; uniform highp float u_time; uniform float u_rpm; uniform float u_limit; void main(){ float x=v_uv.x; float y=v_uv.y; float v=clamp((u_rpm-5500.0)/2500.0,0.0,1.0); float zone=step(0.16,x)*step(x,0.84)*step(0.015,y)*step(y,0.045); float tick=step(0.40,fract(x*34.0)); float blink=mix(1.0,0.36+0.64*abs(sin(u_time*6.2831853*2.0)),step(u_limit,u_rpm)); vec3 col=mix(vec3(0.15,0.44,0.82),vec3(1.0,0.1,0.2),v); gl_FragColor=vec4(col, zone*tick*v*blink*0.90); }';
 this.json({op:'layer',ref:2,target:'widget',kind:'effect',class:'overlay',x:550,y:220,w:1140,h:480,fs:shader,time:1,exclusive:0,contend:0,visible:1});
 this.isPublished=true;this.updateTheme(this.theme);this.updateRpm(this.rpm,this.threshold);}
 updateTheme(theme){this.theme=Math.max(1,Math.min(12,Math.round(theme)||3));if(!this.ready||!this.isPublished)return;try{this.frame(1,this.img(this.theme))}catch(e){this.lastError=e.message}}
 updateRpm(rpm,threshold){this.rpm=Math.max(0,Math.min(8000,Number(rpm)||0));this.threshold=Math.max(6000,Math.min(8000,Number(threshold)||7000));if(!this.ready||!this.isPublished)return;this.json({op:'uniform',ref:2,name:'u_rpm',v:this.rpm});this.json({op:'uniform',ref:2,name:'u_limit',v:this.threshold});}
 stop(){const s=this.socket;this.active=false;this.ready=false;this.isPublished=false;this.socket=null;this.rx=Buffer.alloc(0);if(s){try{if(!s.destroyed){const send=(obj)=>{let b=Buffer.from(JSON.stringify(obj),'utf8');let h=Buffer.alloc(5);h.writeUInt32LE(b.length+1,0);h[4]=0x4a;s.write(Buffer.concat([h,b]))};send({op:'drop',ref:2});send({op:'drop',ref:1});s.end()}}catch(e){try{s.destroy()}catch(_){}}}}
}
module.exports={ClusterWidget};
