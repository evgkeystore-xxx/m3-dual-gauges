#!/usr/bin/env python3
"""Read-only validation of the three M3 Suite packages. Python 3.8+; no dependencies."""
from pathlib import Path
import hashlib, json, re, tarfile, sys
ROOT=Path(__file__).resolve().parent.parent
EXPECTED={'m3_dual_gauges':'0.4.0','ks_pops_controller':'1.4.0','ks_m3_cockpit':'1.1.0'}
LIMIT=64*1024*1024
rows=[]
try:
    for aid,ver in EXPECTED.items():
        folder=ROOT/'apps'/aid
        meta=json.loads((folder/'app.json').read_text(encoding='utf-8'))
        assert meta['id']==aid and meta['version']==ver, 'app.json version mismatch'
        archive=folder/(aid+'@'+ver+'.tgz')
        with tarfile.open(archive) as tg:
            names=set(tg.getnames())
            def obj(name):
                f=tg.extractfile(name)
                if f is None: raise ValueError('Missing file: '+name)
                return json.load(f)
            m=obj('mgu-app.json'); p=obj(m['tree']+'/package.json')
            assert m['id']==p['name']==aid and m['version']==p['version']==ver
            assert m['modules'][0]=='src/main.js'
            for name in m['modules']: assert name in names, name
            for item in p['files']:
                prefix=m['tree']+'/'+item
                assert any(n==prefix or n.startswith(prefix+'/') for n in names), prefix
            for name in names:
                assert not name.startswith('/') and '..' not in Path(name).parts, name
                if name.endswith('.json'): obj(name)
            unpacked=sum(x.size for x in tg.getmembers())
            assert archive.stat().st_size<LIMIT and unpacked<LIMIT, '64 MiB limit'
        rows.append({'app':aid,'version':ver,'tgzBytes':archive.stat().st_size,'unpackedBytes':unpacked,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()})
    component=json.loads((ROOT/'tools/m3-diagnostics/component.json').read_text(encoding='utf-8'))
    for entry in component['files']+component['units']:
        assert (ROOT/'tools/m3-diagnostics'/entry['from']).is_file(), entry['from']
    tracked=[f for f in ROOT.rglob('*') if f.is_file() and '.git' not in f.relative_to(ROOT).parts and 'sources' not in f.relative_to(ROOT).parts]
    total=sum(f.stat().st_size for f in tracked)
    print(json.dumps({'result':'PASS','packages':rows,'visibleFiles':len(tracked),'workingTreeBytes':total},indent=2))
    if total>=LIMIT:
        print('WARNING: repository tree still exceeds 64 MiB. Remove obsolete duplicate assets/packages after backing up the repository.',file=sys.stderr)
    if len(tracked)>100:
        print('WARNING: more than 100 files. Use Git or GitHub Desktop; do not upload generated sources/ through the website.',file=sys.stderr)
except Exception as exc:
    print('VALIDATION FAILED: '+str(exc),file=sys.stderr)
    sys.exit(1)
