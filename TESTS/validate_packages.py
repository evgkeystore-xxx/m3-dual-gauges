#!/usr/bin/env python3
"""Validate the actual installation artifacts, not just the outer ZIP."""
import json, tarfile, hashlib, re, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
report=[]
def ok(name,detail=''):report.append({'check':name,'status':'PASS','detail':detail})
def read(tf,n):return tf.extractfile(n).read()
configs=json.loads((ROOT/'SOURCE/apps.json').read_text())
cat=json.loads((ROOT/'catalog.json').read_text())
assert len(cat['components'])==4
ok('Three applications plus one independent diagnostics tool')
for a in configs:
 d=ROOT/'apps'/a['id'];meta=json.loads((d/'app.json').read_text());f=d/(a['id']+'@'+a['version']+'.tgz')
 assert meta['version']==a['version'] and meta['id']==a['id']
 with tarfile.open(f,'r:gz') as tf:
  members=tf.getmembers();names={m.name for m in members}
  assert all(not n.startswith('/') and '..' not in n.split('/') for n in names)
  assert all(m.isfile() for m in members)
  source=json.loads(read(tf,'mgu-app.json'));pkg=json.loads(read(tf,'package/package.json'));rhmi=json.loads(read(tf,'package/rhmiData/application.json'))['application'];suite=json.loads(read(tf,'package/suite.json'))
  assert source['id']==pkg['name']==suite['id']==a['id'];assert source['version']==pkg['version']==rhmi['version']==suite['version']==a['version']
  assert source['tree']=='package' and source['modules']==['src/main.js','src/host.js']
  for n in source['modules']:assert n in names
  sdk=set(source['sdk']);builtins={'fs','path'};modules=set(source['modules'])
  for n in modules:
   code=read(tf,n).decode()
   for req in re.findall(r"\brequire\(['\"]([^'\"]+)['\"]\)",code):
    if req.startswith('./'):
     p=(Path(n).parent/req).as_posix();assert p in modules,(n,req)
    else:assert req in sdk or req in builtins,(n,req)
  for item in pkg['files']:
   if item=='javascript':continue # generated app.js + runner.js from firmware donor
   assert 'package/'+item in names or any(n.startswith('package/'+item+'/') for n in names),item
  assert pkg['main']=='javascript/runner.js' and 'package/javascript/app.js' not in names
  assert rhmi['uuid']==a['uuid'] and rhmi['entryPoints'][0]['uuid']==a['entry']
  assert 'appletId' not in rhmi
  ui=json.loads(read(tf,'package/rhmiData/uiDescriptions/ID8/uiDescription.json'));assert ui['containers']['3000']['name']=='home'
  for lang in ['en_GB','en_US','pl_PL']:
   text=json.loads(read(tf,'package/rhmiData/variantGroups/Common/texts/'+lang+'.json'));assert text['SID_0']==a['title']
  for notice in ['LICENSE','NOTICE','SOURCE']:
   assert read(tf,'package/renderer/kit/'+notice)==(ROOT/'SOURCE/kit'/notice).read_bytes()
  assert all('/node_modules/' not in n and not n.endswith(('.ttf','.otf','.woff','.woff2')) for n in names)
  assert sum(m.size for m in members)<64*1024*1024 and f.stat().st_size<64*1024*1024
  # Every new runtime module is actually packaged, with exactly current source bytes.
  for p in (ROOT/'SOURCE/runtime').glob('*.js'):assert read(tf,'package/renderer/runtime/'+p.name)==p.read_bytes()
  for p in (ROOT/'SOURCE/kit').glob('*.js'):assert read(tf,'package/renderer/kit/'+p.name)==p.read_bytes()
  assert read(tf,'src/main.js')==(ROOT/'SOURCE/main.js').read_bytes()
  assert read(tf,'src/host.js')==(ROOT/'SOURCE/host.js').read_bytes()
 entry=next(c for c in cat['components'] if c['id']==a['id'])
 assert entry['artifact']['size']==f.stat().st_size
 assert entry['artifact']['sha256']==hashlib.sha256(f.read_bytes()).hexdigest()
 subprocess.run(['node',str(ROOT/'tools/prebuilt.js'),str(d),a['id'],a['version']],check=True,capture_output=True)
 ok(a['id']+' '+a['version']+' contents, modules, runtime bytes, RHMI, notices, sizes and SHA256')
for p in ROOT.rglob('*.json'):json.loads(p.read_text())
ok('All JSON files parse')
for p in ROOT.rglob('*.js'):subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
ok('All JavaScript files pass node --check')
assert len(list(ROOT.rglob('*'))) < 150 # documentation may add a few entries; file count reported separately
ok('Source repository contains no upstream car fonts, extracted SDK or map binaries')
(ROOT/'TESTS/package-results.json').write_text(json.dumps({'checks':report,'status':'PASS','note':'This validates packages locally; it is not a real BMW installation test.'},indent=2)+'\n')
print(json.dumps(report,indent=2))
