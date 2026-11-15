'use strict';
/* M3 Diagnostics: READ-ONLY local report server. No ECU API, arbitrary command, write or upload endpoint. */
const http=require('http'),fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=process.env.M3_OAP_ROOT||'/var/opt/public/oap';
const URL=require('url').URL;
const PORT=Number(process.env.M3_DIAG_PORT||8484);
const IDS=['m3_dual_gauges','ks_pops_controller','ks_m3_cockpit'];
const redact=s=>String(s).replace(/(github_pat_|ghp_)[A-Za-z0-9_]+/g,'[REDACTED]').replace(/(token|password|secret|authorization)(\s*[=:]\s*)[^\s,;]+/ig,'$1$2[REDACTED]');
function read(file,max){try{const s=fs.statSync(file);if(!s.isFile())return null;const n=Math.min(s.size,max||1024*1024),b=Buffer.alloc(n),fd=fs.openSync(file,'r');try{fs.readSync(fd,b,0,n,Math.max(0,s.size-n));}finally{fs.closeSync(fd);}return b.toString('utf8');}catch(e){return null;}}
function json(file){const s=read(file,2*1024*1024);if(!s)return null;try{return JSON.parse(s);}catch(e){return {parseError:String(e.message),file:file};}}
function scan(){const found={};try{fs.readdirSync(ROOT).filter(n=>/^oap_\d+$/.test(n)).forEach(n=>{const dir=path.join(ROOT,n),p=json(path.join(dir,'source','package.json'));if(!p||IDS.indexOf(p.name)<0)return;found[p.name]={id:p.name,version:p.version,uid:Number(n.slice(4)),base:dir,data:path.join(dir,'data')};});}catch(e){found.scanError=String(e.stack||e);}return found;}
function processes(uid){const result=[];try{fs.readdirSync('/proc').filter(n=>/^\d+$/.test(n)).forEach(n=>{try{const s=fs.readFileSync('/proc/'+n+'/status','utf8');const m=/^Uid:\s+(\d+)/m.exec(s);if(!m||Number(m[1])!==uid)return;const c=fs.readFileSync('/proc/'+n+'/cmdline','utf8').replace(/\u0000/g,' ');result.push({pid:Number(n),command:redact(c)});}catch(e){}});}catch(e){}return result;}
function report(id){const a=scan()[id];if(!a)return {id:id,installed:false,reason:'Nie znaleziono pakietu w '+ROOT+'/oap_*/source/package.json'};const status=json(path.join(a.data,'m3-status.json'));const boot=read(path.join(a.data,'m3-boot.log'),256*1024);const events=read(path.join(a.data,'m3-events.ndjson'),512*1024);const backups=[];try{fs.readdirSync(path.join(a.data,'m3-backups')).filter(n=>/^settings-[a-zA-Z0-9-]+\.json$/.test(n)).sort().reverse().forEach(n=>backups.push(n));}catch(e){}
 return {id:id,version:a.version,installed:true,uid:a.uid,processes:processes(a.uid),status:status,statusAgeSeconds:status&&status.generatedAt?Math.round((Date.now()-Date.parse(status.generatedAt))/1000):null,bootLog:redact(boot||'Brak m3-boot.log: nowy modul startowy nie zapisal jeszcze wpisu.'),events:redact(events||'Brak zdarzen aplikacji.'),backups:backups,ecuMapBackup:false,paths:{status:path.join(a.data,'m3-status.json')}};
}
function send(res,code,data,type,name){res.statusCode=code;res.setHeader('Content-Type',type||'application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');if(name)res.setHeader('Content-Disposition','attachment; filename="'+name+'"');res.end(typeof data==='string'?data:JSON.stringify(data,null,2));}
function allowed(req){const a=String(req.socket.remoteAddress||'').replace(/^::ffff:/,'');return a==='127.0.0.1'||a==='::1'||a.indexOf('172.16.222.')===0;}
function journal(id,done){const a=scan()[id];if(!a)return done('App package not found; no UID to filter.');let finished=false;const finish=s=>{if(!finished){finished=true;done(redact(s));}};
 cp.execFile('journalctl',['-b','--since','10 minutes ago','--no-pager','-o','short-iso','_UID='+a.uid],{timeout:6000,maxBuffer:2*1024*1024},(err,out,stderr)=>{
 const first='=== APPLICATION UID '+a.uid+' ===\n'+(out||'')+(err?'\n'+String(err.message)+'\n'+stderr:'');
 cp.execFile('journalctl',['-b','--since','10 minutes ago','--no-pager','-o','short-iso','-u','oapcontroller.service','-u','mgu-app-fallback.service','-u','mgu-render.service'],{timeout:6000,maxBuffer:2*1024*1024},(e,o,s)=>{const lines=(o||'').split('\n').filter(l=>/M3SUITE|m3_dual_gauges|ks_pops_controller|ks_m3_cockpit|error|failed|exception/i.test(l)||l.indexOf(String(a.uid))>=0);finish(first+'\n\n=== FILTERED APP MANAGER / RENDERER ===\n'+lines.join('\n')+(e?'\n'+String(e.message)+'\n'+s:''));});
 });}
function handler(req,res){if(!allowed(req))return send(res,403,{error:'Local BMW hotspot / loopback only'});if(req.method!=='GET')return send(res,405,{error:'Read-only service. GET only.'});let u;try{u=new URL(req.url,'http://127.0.0.1:'+PORT);}catch(e){return send(res,400,{error:'Bad URL'});}const id=u.searchParams.get('id')||'';const download=u.searchParams.get('download')==='1';
 if(u.pathname==='/'){const page=read(path.join(__dirname,'index.html'),512*1024);return send(res,page?200:500,page||'Missing index.html','text/html; charset=utf-8');}
 if(u.pathname==='/health')return send(res,200,{service:'m3-diagnostics',version:'1.0.0',readOnly:true,ecuWriteEnabled:false});
 if(u.pathname==='/api/report'){const x={generatedAt:new Date().toISOString(),service:'m3-diagnostics',readOnly:true,apps:IDS.map(report)};return send(res,200,redact(JSON.stringify(x,null,2)),null,download?'m3-diagnostics.json':null);}
 if(IDS.indexOf(id)<0)return send(res,400,{error:'Choose an allowlisted app id'});
 if(u.pathname==='/api/app')return send(res,200,redact(JSON.stringify(report(id),null,2)),null,download?id+'-report.json':null);
 if(u.pathname==='/api/journal')return journal(id,s=>send(res,200,s,'text/plain; charset=utf-8',download?id+'-startup.log':null));
 if(u.pathname==='/api/backup'){const name=u.searchParams.get('name')||'',a=scan()[id];if(!a||!/^settings-[a-zA-Z0-9-]+\.json$/.test(name)||path.basename(name)!==name)return send(res,400,{error:'Invalid backup filename'});const s=read(path.join(a.data,'m3-backups',name),2*1024*1024);return send(res,s?200:404,s||JSON.stringify({error:'Backup missing'}),'application/json; charset=utf-8',name);}
 return send(res,404,{error:'Unknown read-only route'});
}
const hosts=process.env.M3_DIAG_TEST==='1'?['127.0.0.1']:['127.0.0.1','172.16.222.97'];const running=[];
function listen(host){const s=http.createServer(handler);s.on('error',e=>{console.error('[M3SUITE diagnostics] '+host+':'+PORT+' '+e.message);try{s.close();}catch(x){}if(e.code==='EADDRNOTAVAIL')setTimeout(()=>listen(host),10000);});s.listen(PORT,host,()=>console.log('[M3SUITE diagnostics] read-only http://'+host+':'+PORT));running.push(s);}
if(require.main===module)hosts.forEach(listen);
module.exports={handler:handler,report:report,scan:scan};
