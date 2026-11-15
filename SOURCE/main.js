'use strict';
const fs=require('fs'),path=require('path');
const ROOT=typeof __dirname==='string'?path.join(__dirname,'..'):'/var/opt/public/oap/oap_'+process.getuid()+'/source';
const DATA=path.join(ROOT,'..','data');
const runtime=n=>require(path.join(ROOT,'renderer','runtime',n));
let diag=null,controller=null;
try{
 const config=JSON.parse(fs.readFileSync(path.join(ROOT,'suite.json'),'utf8'));
 // Create independent file diagnostics BEFORE loading the firmware SDK or our OnlineApp host.
 diag=new (runtime('diagnostics.js').Diagnostics)(config,DATA,console);
 process.on('unhandledRejection',e=>diag.error('UNHANDLED_REJECTION',e));
 process.on('uncaughtException',e=>{diag.error('UNCAUGHT_EXCEPTION',e);diag.update({phase:'FATAL'});diag.flush(true);if(controller)controller.hide();setTimeout(()=>process.exit(1),250);});
 const logging=require('oap-sdk/src/logging/logging');diag.sdkLog=logging.getSDKLogger();
 const someip=require('oap-sdk/src/someip/someipBuilders');
 const SuiteHost=require('./host.js').SuiteHost;
 const host=new SuiteHost({states:['home'],diag:diag,
 ready:(rhmi,states)=>{controller=new (runtime('controller.js').Controller)(config,ROOT,DATA,someip,diag);controller.bind(rhmi,states.home);controller.connect();},
 shown:()=>{if(controller)controller.show();},hidden:()=>{if(controller)controller.hide();},shutdown:()=>controller?controller.shutdown():undefined});
 host.start().catch(e=>{diag.error('OAP_START',e);diag.update({phase:'START_FAILED'});diag.flush(true);});
}catch(e){if(diag){diag.error('BOOT_FATAL',e);diag.update({phase:'FATAL'});diag.flush(true);}else{console.error('[M3SUITE] BOOT_FATAL',e&&e.stack||e);try{if(!fs.existsSync(DATA))fs.mkdirSync(DATA,448);fs.writeFileSync(path.join(DATA,'m3-suite-boot-error.txt'),String(e&&e.stack||e),{mode:384});}catch(ignore){}}}
