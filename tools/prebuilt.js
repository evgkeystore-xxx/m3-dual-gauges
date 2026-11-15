'use strict';
// MGU Store invokes this with {dir}, {id}, {version}; the committed source TGZ is the output.
const fs=require('fs'),path=require('path');
const a=process.argv.slice(2);if(a.length!==3)throw Error('Expected app folder, id and version');
const p=path.join(a[0],a[1]+'@'+a[2]+'.tgz');
const m=JSON.parse(fs.readFileSync(path.join(a[0],'app.json'),'utf8'));
if(m.id!==a[1]||m.version!==a[2])throw Error('Manifest/version mismatch');
const s=fs.statSync(p);if(!s.isFile()||s.size<=0||s.size>=64*1024*1024)throw Error('Missing, empty or oversized artifact');
console.log('M3SUITE source package '+p+' ('+s.size+' bytes), SDK linked on the head unit');
