'use strict';
/* M3 M CONTROL - authored cockpit UI for the user's 2880×960 iDrive 8 renderer.
 * Native HMI has exclusive top 0..75 and climate 840..959. All controls and
 * hit targets are in renderer logical coordinates, not CSS/browser coordinates.
 */
const Recorder=require('../kit/record').Recorder;
const C={ink:'#03070e',deep:'#071120',navy:'#0a1b32',panel:'#0d1e35',edge:'#315073',white:'#f6f8ff',muted:'#abb9cc',sub:'#7b8eaa',red:'#ff2454',scarlet:'#fb4b6f',blue:'#26a8ff',ice:'#66dbff',purple:'#ad69ff',green:'#41eeb3',yellow:'#ffbd59'};
const THEMES=[['M PERFORMANCE','#ff2454','needle'],['M BLUE','#30b8ff','ring'],['NIGHT PURPLE','#a566ff','needle'],['TRACK RED','#ff5a43','bar'],['NIGHT DRIVE','#8399bc','ring'],['M COMPETITION','#ff315b','needle'],['ICE BLUE','#61ddff','ring'],['GOLD EDITION','#ffbf5e','bar'],['STEALTH','#bdcbe5','digital'],['RACE DAY','#ff8842','needle'],['TOURING','#45ecb1','ring'],['M BLACK','#a5aec5','digital']];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const fmt=(n,d)=>typeof n==='number'&&Number.isFinite(n)?n.toFixed(d||0):'--';
function wrap(s,n){const out=[];String(s).split('\n').forEach(line=>{while(line.length>n){let p=line.lastIndexOf(' ',n);if(p<n*.5)p=n;out.push(line.slice(0,p));line=line.slice(p).trim();}out.push(line);});return out;}
class View{
 constructor(config){this.config=config;this.buttons=[];this.sliders=[];this.model=null;}
 text(r,s,x,y,size,color,align){return r.text(String(s),x,y+size*.85,size,color||C.white,{align:align||'left',font:'m3suite-raster-v1'});}
 stroke(r,x,y,w,h,c){r.strokeRoundRect(x,y,w,h,16,2,c||C.edge);}
 backdrop(r){r.clear([0,0,0,0]);r.gradientRect(0,76,2880,764,[[0,'#040916'],[.3,'#09182b'],[.68,'#081222'],[1,'#040811']]);
  r.quad([[0,79],[810,79],[490,838],[0,838]],'#071a35');r.quad([[720,79],[1430,79],[1060,838],[470,838]],'#091b33');r.quad([[2020,79],[2460,79],[2090,838],[1730,838]],'#091a30');
  r.line(415,835,1040,80,3,'#183756');r.line(1860,836,2180,80,3,'#14314e');
  r.gradientRect(0,77,2880,4,[[0,'#0e59a9'],[.3,C.blue],[.55,C.red],[1,'#253974']]);
  r.gradientRect(0,836,2880,3,[[0,'#0d3760'],[.4,C.blue],[.75,C.red],[1,'#0e326b']]);}
 plate(r,x,y,w,h,c){r.card(x,y,w,h,20,[[0,'#122947'],[.36,'#0a1a31'],[1,'#071220']]);r.strokeRoundRect(x,y,w,h,20,2,c||'#244364');r.roundRect(x+20,y+10,w-40,3,2,c||'#27537c');}
 button(r,id,label,x,y,w,h,active,disabled,accent){const c=accent||C.blue;
  r.card(x,y,w,h,14,active?[[0,'#6a2448'],[.48,c],[1,'#4b162f']]:[[0,'#17314f'],[.44,'#0b2038'],[1,'#091321']]);
  r.strokeRoundRect(x,y,w,h,14,active?4:2,active?'#f6aabe':disabled?'#26334a':'#37628a');
  if(active)r.roundRect(x+14,y+h-8,w-28,4,2,'#ffd3df');else r.roundRect(x+13,y+7,w-26,2,1,'#2b6089');
  this.text(r,label,x+w/2,y+(h-30)/2,Math.min(31,h*.49),disabled?'#73839d':C.white,'center');
  if(id&&!disabled)this.buttons.push({id,x,y,w,h,kind:'button'});
 }
 sectionLabel(r,label,x,y,w,accent){this.text(r,label,x,y,29,C.muted);r.line(x,y+37,x+w,y+37,2,accent||'#264768');}
 header(r,m){r.gradientRect(0,83,2880,82,[[0,'#071326'],[.53,'#12233d'],[1,'#091423']]);
  const stripes=[C.blue,'#6c73f2',C.red];stripes.forEach((c,i)=>r.quad([[54+i*19,110],[70+i*19,110],[58+i*19,145],[42+i*19,145]],c));
  this.text(r,'M',125,105,51,C.white);this.text(r,'CONTROL',175,115,35,C.white);r.line(470,108,470,149,2,'#50637f');
  this.text(r,this.config.kind==='pops'?'Pops Studio':this.config.kind==='cockpit'?'Cockpit Studio':'Dual Gauges',498,114,34,'#b8c9e1');
  this.text(r,'M3 G80',2230,115,30,C.white);r.circle(2450,133,9,m.frame.demo?C.yellow:m.frame.hasReal?C.green:C.red);
  this.text(r,m.frame.demo?'DEMO':m.frame.hasReal?'DANE LIVE':'BRAK DANYCH',2483,116,29,m.frame.demo?C.yellow:m.frame.hasReal?C.green:C.red);
 }
 tabs(r,m){const t=this.config.kind==='pops'?[['home','POPS'],['params','PARAMETRY'],['graphs','WYKRESY'],['exhaust','KLAPA MHD'],['settings','USTAWIENIA'],['errors','BLEDY']]:[['home','ZEGARY'],['params','PARAMETRY'],['graphs','WYKRESY'],['themes','MOTYWY'],['settings','USTAWIENIA'],['errors','BLEDY']];
  const slim=this.config.kind==='pops',x=55,y=slim?747:183,w=449,h=slim?39:65;
  t.forEach((a,i)=>this.button(r,'page:'+a[0],a[1],x+i*462,y,w,h,m.page===a[0],false,m.page===a[0]?C.red:C.blue));
 }
 status(r,m){const f=m.frame,online=f.hasReal&&!f.demo,color=f.demo?C.yellow:online?C.green:C.red;
  r.card(55,792,2770,41,10,[[0,'#082539'],[.45,'#111c31'],[1,'#0c192a']]);r.strokeRoundRect(55,792,2770,41,10,1,'#2a4b72');r.circle(76,813,8,color);
  const state=(f.demo?'DEMO':online?'LIVE':'OFFLINE')+' | RPM '+fmt(f.values.rpm)+' | KM/H '+fmt(f.values.speed)+' | BLEDY '+(m.errors||0)+' | DOTYK '+(m.touchSupported?'GOTOWY':'NIEAKTYWNY')+' : '+(m.touchEvents||0)+' | DOTKNIJ PO SZCZEGOLY';
  this.text(r,state,99,799,22,color);this.text(r,'MAPA MHD 700 KM / TYLKO ODCZYT',2800,800,20,C.sub,'right');
  this.buttons.push({id:'page:errors',kind:'button',x:55,y:792,w:2045,h:41});
 }
 draw(m){this.model=m;this.buttons=[];this.sliders=[];const r=new Recorder(2880,960,{textScale:1});this.backdrop(r);r.clip(0,76,2880,764);this.header(r,m);
  if(this.config.kind==='pops'&&m.page==='home'){this.pops(r,m);this.tabs(r,m);}else{this.tabs(r,m);if(m.page==='errors')this.errors(r,m);else if(m.page==='settings')this.settings(r,m);else if(m.page==='themes')this.themes(r,m);else if(m.page==='graphs')this.graphs(r,m);else if(m.page==='params')this.params(r,m);else if(m.page==='engine')this.engine(r,m);else if(m.page==='exhaust')this.exhaust(r,m);else if(m.page==='profile')this.pops(r,m);else this.gauges(r,m);}
  if(m.notice){r.card(740,745,1420,35,8,[[0,'#483044'],[1,'#221c2b']]);this.text(r,String(m.notice).slice(0,98),760,748,22,C.yellow);}this.status(r,m);r.noclip();return r;}
 hitTarget(x,y){for(let i=this.sliders.length-1;i>=0;i--){const a=this.sliders[i];if(x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h)return a;}for(let i=this.buttons.length-1;i>=0;i--){const a=this.buttons[i];if(x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h)return a;}return null;}
 hit(x,y){const t=this.hitTarget(x,y);return t?t.id:null;}
 slider(r,id,title,val,min,max,step,x,y,w,accent,disabled,unit){const c=accent||C.red;
  this.text(r,title,x,y-47,26,C.muted);this.text(r,fmt(val,step<1?1:0)+(unit||''),x+w,y-46,29,C.white,'right');
  r.roundRect(x,y+21,w,12,6,'#284058');r.gradientRect(x,y+21,w,12,[[0,C.green],[.43,C.yellow],[.83,C.red],[1,'#dc315a']]);
  const p=clamp((val-min)/(max-min),0,1);r.circle(x+p*w,y+27,19,'#f5f8ff');r.circle(x+p*w,y+27,13,disabled?'#8090a7':c);
  this.text(r,String(min),x,y+48,20,C.sub);this.text(r,String(max),x+w,y+48,20,C.sub,'right');
  if(!disabled)this.sliders.push({kind:'slider',id,x,y:y-14,w,h:92,min,max,step});}
 range(r,a,b,x,y,w){this.text(r,'AKTYWACJA OBROTOW',x,y-44,26,C.muted);this.text(r,a+' - '+b+' RPM',x+w,y-44,30,C.white,'right');r.roundRect(x,y+20,w,13,6,'#1f354e');r.gradientRect(x,y+20,w,13,[[0,C.green],[.5,C.yellow],[1,C.red]]);
  [a,b].forEach((val,i)=>{const xx=x+w*clamp((val-1000)/6600,0,1);r.circle(xx,y+27,19,C.white);r.circle(xx,y+27,12,i?C.red:C.blue);});this.text(r,'1000',x,y+49,20,C.sub);this.text(r,'7600',x+w,y+49,20,C.sub,'right');this.sliders.push({kind:'range',id:'range:rpm',x,y:y-10,w,h:94,min:1000,max:7600,step:100});}
 telemetry(r,m){const v=m.frame.values;this.plate(r,2107,264,718,470,C.blue);this.text(r,'PARAMETRY LIVE',2137,289,34,C.white);
  const rows=[['AKTUALNA MOC',fmt(v.powerHp),'KM'],['OBROTY SILNIKA',fmt(v.rpm),'RPM'],['DOLADOWANIE',fmt(v.boost,2),'bar'],['MOMENT',fmt(v.torque),'Nm'],['TEMP. OLEJU',fmt(v.oil),' C'],['PLYNU CHLODZACEGO',fmt(v.coolant),' C']];
  rows.forEach((a,i)=>{const y=346+i*62;r.line(2137,y-7,2791,y-7,2,'#244260');r.roundRect(2138,y+9,5,35,3,i%2?C.red:C.blue);this.text(r,a[0],2159,y+7,23,C.muted);this.text(r,a[1]+' '+a[2],2790,y+3,31,i===0?C.ice:C.white,'right');});}
 pops(r,m){const s=m.settings,p=s.profile[s.mode];const modes=[['comfort','Comfort'],['sport','Sport'],['sportplus','Sport+'],['pn','P / N']];
  modes.forEach((a,i)=>this.button(r,'mode:'+a[0],a[1],55+i*506,177,488,68,s.mode===a[0],false,a[0]==='pn'?C.purple:C.red));
  this.button(r,null,'KAMERA',2091,177,344,68,false,true,C.blue);this.button(r,'page:settings','USTAWIENIA',2453,177,372,68,false,false,C.blue);
  this.plate(r,55,264,1325,470,C.blue);this.text(r,'PROFIL SPORT / USTAWIENIA LOKALNE',89,290,33,C.white);this.text(r,'MHD POPS: BRAK POTWIERDZONEGO API ZAPISU',89,337,23,C.yellow);
  this.range(r,p.rpmMin,p.rpmMax,105,431,1219);
  this.slider(r,'profile:duration','DLUGOSC',p.duration,0,4,.1,105,573,364,C.red,s.mode==='comfort',' s');
  this.slider(r,'profile:aggression','MOC',p.aggression,0,100,5,535,573,364,C.red,s.mode==='comfort',' %');
  this.slider(r,'profile:delay','OPOZNIENIE',p.delay||0,0,1000,25,965,573,340,C.red,s.mode==='comfort',' ms');
  this.plate(r,1402,264,682,470,C.purple);this.text(r,'FLAME MODE',1435,293,36,C.white);this.text(r,'TYLKO PODGLAD / BRAK API ECU',1435,348,24,C.yellow);
  this.button(r,null,'SPORT+  /  NIEAKTYWNE',1435,405,618,69,false,true,C.red);this.button(r,null,'P / N  /  NIEAKTYWNE',1435,494,618,69,false,true,C.purple);
  this.text(r,'BEZ ZMIAN TWOJEJ MAPY MHD',1434,631,25,C.green);this.text(r,'700 KM / JEDEN SLOT',1434,677,24,C.sub);
  this.telemetry(r,m);
 }
 dial(r,x,y,R,val,max,label,unit,accent){const valid=typeof val==='number'&&Number.isFinite(val),p=valid?clamp(val/max,0,1):0;
  r.arc(x,y,R-14,R,230,490,'#26466d');r.arc(x,y,R-12,R+5,230,230+260*p,accent,{round:true});r.arc(x,y,R-12,R+5,455,490,C.red);
  for(let i=0;i<=16;i++){const a=(230+260*i/16)*Math.PI/180;r.line(x+Math.sin(a)*(R-22),y-Math.cos(a)*(R-22),x+Math.sin(a)*(R-42),y-Math.cos(a)*(R-42),i%4===0?4:2,i>13?C.red:C.muted);}
  const a=(230+260*p)*Math.PI/180;r.line(x,y,x+Math.sin(a)*(R-62),y-Math.cos(a)*(R-62),7,accent);r.circle(x,y,18,accent);r.circle(x,y,9,C.white);
  this.text(r,fmt(val),x,y+52,89,C.white,'center');this.text(r,unit,x,y+153,24,C.muted,'center');this.text(r,label,x,y+R+18,32,C.white,'center');}
 gauges(r,m){const v=m.frame.values,t=THEMES[m.settings.theme]||THEMES[0];this.plate(r,55,265,2770,468,t[1]);
  this.text(r,this.config.kind==='cockpit'?'M3 COMPETITION / COCKPIT STUDIO':'M3 COMPETITION / DUAL GAUGES',92,291,36,C.white);this.text(r,t[0],2790,293,29,t[1],'right');
  this.dial(r,690,500,158,v.rpm,8000,'OBROTY SILNIKA','RPM',t[1]);this.dial(r,2195,500,158,v.speed,340,'PREDKOSC','km/h',C.ice);
  this.plate(r,1110,351,645,304,C.blue);this.text(r,'M3',1432,379,60,C.white,'center');this.text(r,'COMPETITION',1432,444,38,C.white,'center');
  this.text(r,fmt(v.powerHp),1432,492,76,C.ice,'center');this.text(r,'KM / MOC OBLICZONA',1432,576,24,C.muted,'center');
  this.button(r,'theme:prev','<',1150,663,120,56,false,false,C.blue);this.button(r,'page:themes','12 MOTYWOW',1280,663,400,56,false,false,t[1]);this.button(r,'theme:next','>',1690,663,120,56,false,false,C.blue);
 }
 mini(r,label,value,unit,x,y,w,h,color){this.plate(r,x,y,w,h,color);this.text(r,label,x+29,y+22,28,C.muted);this.text(r,value,x+w-36,y+69,72,C.white,'right');this.text(r,unit,x+30,y+h-52,27,C.sub);}
 params(r,m){const v=m.frame.values,rows=[['OBROTY',fmt(v.rpm),'RPM'],['PREDKOSC',fmt(v.speed),'KM/H'],['MOC OBLICZONA',fmt(v.powerHp),'KM'],['MOMENT',fmt(v.torque),'NM'],['DOLADOWANIE',fmt(v.boost,2),'BAR'],['TEMP. OLEJU',fmt(v.oil),' C'],['CHLODZENIE',fmt(v.coolant),' C'],['ZAPLON',fmt(v.timing,1),' DEG']];
  rows.forEach((a,i)=>this.mini(r,a[0],a[1],a[2],55+i%4*699,264+Math.floor(i/4)*239,674,218,i%2?C.red:C.blue));}
 graphs(r,m){this.plate(r,55,265,2770,469,C.blue);this.text(r,'WYKRES OBROTOW / 60 SEKUND',100,296,38,C.white);this.button(r,'graph:toggle',m.recording?'STOP':'START',2470,289,311,70,m.recording,false,C.red);
  const x=180,y=402,w=2460,h=243;for(let i=0;i<5;i++){const yy=y+i*h/4;r.line(x,yy,x+w,yy,1,'#2a496c');this.text(r,String(8000-i*2000),x-23,yy-17,24,C.muted,'right');}
  let prev=null;m.history.filter(a=>m.at-a.at<=60000).forEach(p=>{const xx=x+w-(m.at-p.at)/60000*w,yy=y+h-clamp(p.rpm/8000,0,1)*h;if(prev)r.line(prev[0],prev[1],xx,yy,5,C.red);prev=[xx,yy];});this.text(r,'-60 S',x,678,26,C.muted);this.text(r,'TERAZ',x+w,678,26,C.muted,'right');
  this.text(r,m.frame.demo?'DEMO / SYMULACJA':m.frame.hasReal?'DANE Z SAMOCHODU':'BRAK ODCZYTOW',100,704,25,m.frame.demo?C.yellow:C.green);}
 themes(r,m){this.text(r,'WYBIERZ STYL M PERFORMANCE',83,269,35,C.white);THEMES.forEach((a,i)=>{const x=55+i%6*463,y=315+Math.floor(i/6)*200;this.button(r,'theme:'+i,a[0],x,y,443,157,m.settings.theme===i,false,a[1]);r.roundRect(x+24,y+130,392,7,3,a[1]);});}
 engine(r,m){const v=m.frame.values,rows=[['MOC / SKALA '+m.settings.maxPower+' KM',v.powerHp,m.settings.maxPower,'KM',C.red],['MOMENT',v.torque,1000,'NM',C.blue],['DOLADOWANIE',v.boost,3,'BAR',C.purple]];rows.forEach((a,i)=>{const y=263+i*157;this.plate(r,55,y,2770,142,a[4]);this.text(r,a[0],90,y+20,32,C.muted);this.text(r,fmt(a[1],a[3]==='BAR'?2:0)+' '+a[3],2780,y+15,53,C.white,'right');r.roundRect(88,y+105,2670,16,8,'#263c58');if(typeof a[1]==='number')r.roundRect(88,y+105,2670*clamp(a[1]/a[2],0,1),16,8,a[4]);});}
 exhaust(r,m){const f=m.flap;this.plate(r,55,265,1672,468,C.red);this.text(r,'KLAPA WYDECHU / MHD',91,297,43,C.white);this.text(r,'ODREBNA FUNKCJA OD POPS / BURBLE',91,366,29,C.muted);this.text(r,'POZYCJA: '+(m.at-f.at<6000?fmt(f.pct,1)+' %':'--'),91,423,44,C.ice);
  this.button(r,'flap:open','OTWORZ',94,545,498,93,false,m.busy,C.red);this.button(r,'flap:close','ZAMKNIJ',618,545,500,93,false,m.busy,C.red);this.button(r,'flap:oem','ORYGINALNE',1144,545,527,93,false,m.busy,C.blue);
  this.text(r,'POTWIERDZENIE: DWUKROTNE DOTKNIECIE / TYLKO NA POSTOJU',94,682,24,C.yellow);
  this.plate(r,1745,265,1080,468,C.blue);this.text(r,'JEDNA MAPA MHD / 700 KM',1780,304,37,C.white);this.text(r,'BRAK FLASH / BRAK MULTIMAP',1780,380,30,C.green);this.text(r,'ORYGINALNE ODDAJE KLAPE DME',1780,445,27,C.muted);this.text(r,'NIE PRZYWRACA MAPY FABRYCZNEJ',1780,494,27,C.muted);this.text(r,'BRAK API POPS MHD',1780,581,28,C.yellow);}
 settings(r,m){this.plate(r,55,265,2770,469,C.blue);this.text(r,'USTAWIENIA I BEZPIECZENSTWO',95,299,42,C.white);this.text(r,'TWOJA MAPA MHD 700 KM NIE JEST MODYFIKOWANA',95,365,29,C.green);
  this.button(r,'backup','KOPIA USTAWIEN',95,449,625,82,false,false,C.blue);this.button(r,'restore','PRZYWROC USTAWIENIA',745,449,695,82,false,false,C.blue);this.button(r,'autoDemo','AUTO DEMO: '+(m.settings.autoDemo?'ON':'OFF'),1465,449,605,82,m.settings.autoDemo,false,C.red);this.button(r,'retry','PONOW ODCZYT',2097,449,685,82,false,false,C.blue);
  this.button(r,'flash','SHIFT LED: '+(m.settings.flash?'ON':'OFF'),96,571,626,77,m.settings.flash,false,C.red);this.text(r,'KOPIA DOTYCZY USTAWIEN APLIKACJI - NIE ECU',760,588,30,C.yellow);this.text(r,'DIAGNOSTYKA: '+(m.phoneUrl||'HTTP://IP-MGU:8471').toUpperCase(),95,678,26,C.ice);}
 errors(r,m){this.plate(r,55,265,2770,469,C.red);const lines=wrap(m.errorText||'BRAK ZAPISANYCH BLEDOW',140),per=10,max=Math.max(1,Math.ceil(lines.length/per)),page=clamp(m.errorPage,0,max-1);this.text(r,'DIAGNOSTYKA / '+(page+1)+' / '+max,96,299,36,C.white);
  lines.slice(page*per,(page+1)*per).forEach((s,i)=>this.text(r,s,100,353+i*28,22,i===0?C.yellow:C.muted));
  this.button(r,'error:prev','POPRZEDNIA',95,661,500,62,false,page===0,C.blue);this.button(r,'error:next','NASTEPNA',610,661,500,62,false,page>=max-1,C.blue);this.button(r,'error:refresh','ODSWIEZ',1125,661,500,62,false,false,C.blue);this.button(r,'retry','POLACZ PONOWNIE',1642,661,1139,62,false,false,C.red);}
}
module.exports={View,THEMES,wrap,fmt};
