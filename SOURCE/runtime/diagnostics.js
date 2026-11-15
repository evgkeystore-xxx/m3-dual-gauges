'use strict';
const fs=require('fs'),path=require('path'),os=require('os');
function mkdir(dir){if(fs.existsSync(dir))return;const parent=path.dirname(dir);if(parent!==dir)mkdir(parent);try{fs.mkdirSync(dir,448);}catch(e){if(e.code!=='EEXIST')throw e;}}
function scrub(s){return String(s).replace(/(github_pat_|ghp_)[A-Za-z0-9_]+/g,'[TOKEN REDACTED]').replace(/((?:password|token|authorization|secret)\s*[:=]\s*)[^\s,;]+/ig,'$1[REDACTED]');}
function serial(e){if(e instanceof Error)return scrub(e.stack||e.message);if(typeof e==='string')return scrub(e);try{return scrub(JSON.stringify(e,null,2));}catch(x){return scrub(String(e));}}
class Diagnostics{
 constructor(config,data,sdkLog){this.config=config;this.data=data;this.sdkLog=sdkLog||console;this.events=[];this.failures={};this.links={};this.lastWrite=0;this.boot=new Date().toISOString();this.file=path.join(data,'m3-suite-status.json');this.logFile=path.join(data,'m3-suite.log');this.state={phase:'BOOT',display:'CONNECTING',renderer:false,visible:false};try{mkdir(data);}catch(e){this.events.push({at:this.boot,level:'ERROR',code:'DATA_DIR',message:serial(e)});}this.info('BOOT',config.id+' '+config.version+' pid='+process.pid+' uid='+(process.getuid?process.getuid():'desktop'));}
 event(level,code,message,details){const now=Date.now(),text=serial(message),old=this.failures[code];if(level==='ERROR'||level==='WARN'){if(old&&old.message===text){old.count++;old.last=new Date(now).toISOString();if(now-old.logged<10000)return;old.logged=now;}else this.failures[code]={message:text,details:details===undefined?null:JSON.parse(JSON.stringify(details)),count:1,first:new Date(now).toISOString(),last:new Date(now).toISOString(),logged:now};}
 const ev={at:new Date(now).toISOString(),level:level,code:code,message:text};if(details!==undefined)ev.details=JSON.parse(JSON.stringify(details));this.events.push(ev);if(this.events.length>200)this.events.shift();
 const line='[M3SUITE]['+this.config.id+']['+code+'] '+text;
 try{(level==='ERROR'?this.sdkLog.error:level==='WARN'?this.sdkLog.warn:this.sdkLog.info).call(this.sdkLog,line);}catch(e){console.error(line);}
 try{if(fs.existsSync(this.logFile)&&fs.statSync(this.logFile).size>1048576)fs.renameSync(this.logFile,this.logFile+'.1');fs.appendFileSync(this.logFile,ev.at+' '+level+' '+line+(details?' '+serial(details):'')+'\n');}catch(e){/* Kept in memory and in the SDK log even if storage is unavailable. */}
 this.flush(true);}
 info(c,m,d){this.event('INFO',c,m,d);}warn(c,m,d){this.event('WARN',c,m,d);}error(c,e,d){this.event('ERROR',c,e,d);}
 clear(c){if(this.failures[c]){delete this.failures[c];this.info('RECOVERED',c);}}
 link(k,v){this.links[k]=Object.assign({at:new Date().toISOString()},v);}
 update(v){Object.assign(this.state,v);this.flush(false);}
 snapshot(){return {schema:1,app:this.config.id,title:this.config.title,version:this.config.version,pid:process.pid,boot:this.boot,at:new Date().toISOString(),state:this.state,links:this.links,errors:this.failures,events:this.events,mapProtection:{ecuFlash:false,mapSwitch:false,ecuBackupSupported:false,claimedTuneHp:700,claimedTuneHpSource:'user declaration; not measured'},dataDirectory:this.data};}
 flush(force){if(!force&&Date.now()-this.lastWrite<1000)return;this.lastWrite=Date.now();try{const f=this.file+'.tmp';fs.writeFileSync(f,JSON.stringify(this.snapshot(),null,2),{mode:384});fs.renameSync(f,this.file);}catch(e){/* Never prevent the RHMI start due to diagnostic storage. */}}
 fullText(){return JSON.stringify(this.snapshot(),null,2);}
}
function addresses(){const out=[];const all=os.networkInterfaces();Object.keys(all).forEach(k=>(all[k]||[]).forEach(n=>{if(n.family==='IPv4'&&!n.internal)out.push('http://'+n.address+':8471');}));return out;}
module.exports={Diagnostics:Diagnostics,mkdir:mkdir,serial:serial,addresses:addresses};
