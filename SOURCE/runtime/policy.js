'use strict';
/* The only possible vehicle commands in this suite. No arbitrary request route.
 * No flash, programming session, security access, reset, map switching or MG Flasher writes.
 * A fresh, explicit, on-screen confirmation is required for an MHD exhaust-FLAP command.
 * This does not control burble duration, timing, fuel or aggressiveness. */
const READ_PIDS=[0x05,0x0B,0x0C,0x0D,0x0E,0x0F,0x33,0x5C];
function allow(sid,d,ctx){ctx=ctx||{};if(!Array.isArray(d))return {ok:false,why:'INVALID_REQUEST'};
 if(sid===0x01&&d.length===1&&READ_PIDS.indexOf(d[0])>=0)return {ok:true};
 if(sid===0x22&&d.length===2&&((d[0]===0x65&&d[1]===0x1E)||(d[0]===0x64&&d[1]===0xFD)))return {ok:true};
 if(sid!==0x2F||d.length!==2||d[0]!==0x02||[0,1,2].indexOf(d[1])<0)return {ok:false,why:'MAP_PROTECTION: command is not allowlisted'};
 if(!ctx.pops)return {ok:false,why:'READ_ONLY_APP'};
 if(!ctx.confirmed)return {ok:false,why:'USER_CONFIRMATION_REQUIRED'};
 if(d[1]===0&&ctx.releaseOwned)return {ok:true};
 if(ctx.demo)return {ok:false,why:'DEMO: vehicle commands disabled'};
 const now=Number.isFinite(ctx.now)?ctx.now:Date.now();
 if(!ctx.speed||!Number.isFinite(ctx.speed.value)||!Number.isFinite(ctx.speed.at)||now-ctx.speed.at>2000||now-ctx.speed.at<0||ctx.speed.value>0.5||ctx.speed.value<0)return {ok:false,why:'PARK_REQUIRED: no fresh real stationary-speed signal'};
 return {ok:true};
}
module.exports={allow:allow,READ_PIDS:READ_PIDS};
