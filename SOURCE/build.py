#!/usr/bin/env python3
"""Reproducible source packages for MGU Store. Python 3 standard library only.
No BMW SDK, extracted car fonts, ECU binary, tune or native renderer is packaged.
Run: python SOURCE/build.py
"""
from pathlib import Path
import json, shutil, tarfile, gzip, io, hashlib, tempfile
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'SOURCE'
def jsave(p,data):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def pack(folder,out):
    out.parent.mkdir(parents=True,exist_ok=True)
    with out.open('wb') as raw, gzip.GzipFile(filename='',mode='wb',fileobj=raw,mtime=0,compresslevel=9) as gz, tarfile.open(fileobj=gz,mode='w',format=tarfile.PAX_FORMAT) as tf:
        for p in sorted(folder.rglob('*')):
            if not p.is_file(): continue
            info=tf.gettarinfo(str(p),arcname=p.relative_to(folder).as_posix())
            info.uid=info.gid=0;info.uname=info.gname='';info.mtime=0;info.mode=0o644
            with p.open('rb') as f:tf.addfile(info,f)
    with tarfile.open(out,'r:gz') as tf:
        size=sum(m.size for m in tf.getmembers() if m.isfile())
    assert out.stat().st_size<64*1024*1024 and size<64*1024*1024,(out,size)
    return {'compressed':out.stat().st_size,'expanded':size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
def rhmi(tree,a):
    d=tree/'rhmiData'; title=a['title']
    app={'schemaVersion':'1.0.0','application':{'uuid':a['uuid'],'type':'OnlineApp','name':a['id'],'vendor':'owner','version':a['version'],'defaultLanguage':'en_GB','uiDescriptions':[{'applicationFilePath':'./uiDescriptions/ID8/application.xml','uiDescriptionFilePath':'./uiDescriptions/ID8/uiDescription.json','hmi':['ID8']}],'stringBundleUuid':a['strings'],'resourceBundleUuid':a['resources'],'variantGroups':[{'stringsPath':'./variantGroups/Common/texts','hmi':['ID8'],'brands':['BMW'],'resourcesPath':'./resources'}],'entryPoints':[{'uuid':a['entry'],'textId':'SID_0','insertionStateId':3000,'insertionFocusId':0,'appearance':'DEFAULT','insertionMode':0,'insertionOrder':0,'insertionPriority':0,'insertionGroup':0,'isGroupHeader':False,'availability':'ENABLED','icon':'icon.png'}]}}
    jsave(d/'application.json',app)
    for lang in ['en_GB','en_US','pl_PL']:
        for sub in ['strings','variantGroups/Common/texts']:jsave(d/sub/(lang+'.json'),{'SID_0':title})
    (d/'resources').mkdir(parents=True);shutil.copy2(SOURCE/'icons'/(a['id']+'.png'),d/'resources/icon.png')
    ui=d/'uiDescriptions/ID8';ui.mkdir(parents=True)
    (ui/'application.xml').write_text('''<?xml version="1.0" encoding="UTF-8"?>
<application>
 <container id="1000" type="logical"><layoutGroup id="1100"><component id="1110" type="bookmark"/></layoutGroup></container>
 <container id="3000" type="state" widget="LT_State_Wide_List">
  <layoutGroup id="3200" name="Titlebar"><component id="3220" type="title"><property id="2" value="1"/></component></layoutGroup>
  <layoutGroup id="3400" name="List"><property id="3" value="1"/></layoutGroup>
 </container>
</application>
''')
    jsave(ui/'uiDescription.json',{'schemaVersion':'1.3.0','containers':{'1000':{'type':'logical','name':'logicalContainer','components':{'1110':{'type':'bookmark','name':'bookmark'}}},'3000':{'type':'state','name':'home','components':{'3220':{'type':'title','name':'homeTitle','rows':[{'Text':{'value':'SID_0','type':'StringId'}}]}}}}})
def main():
    apps=json.loads((SOURCE/'apps.json').read_text());metrics={};components=[]
    for index,a in enumerate(apps):
        dest=ROOT/'apps'/a['id'];dest.mkdir(parents=True,exist_ok=True)
        # Keep each public folder compact, exactly like prebuilt source packages in the supplied repo.
        for old in dest.glob('*.tgz'):old.unlink()
        desc=('Wspolny zgodny renderer; rzeczywiste odczyty, pelna diagnostyka i oznaczone DEMO po braku danych. Bez flash/przelaczania map.' if a['kind']!='pops' else 'Telemetria i potwierdzane sterowanie klapa MHD. Brak API regulacji burble: profile tylko DEMO. Bez flash/przelaczania map.')
        requires={'mgu-deploy':'0.7.5','mgu-render':'0.6.21','m3-suite-diagnostics':'1.0.0'}
        meta={'id':a['id'],'version':a['version'],'title':a['title'],'description':desc,'mguHmi':['ID8'],'needs':['renderer'],'requires':requires,'uninstallable':True}
        jsave(dest/'app.json',meta);shutil.copy2(SOURCE/'icons'/(a['id']+'.png'),dest/'icon.png')
        with tempfile.TemporaryDirectory(prefix='m3-source-') as temp:
            src=Path(temp);tree=src/'package';tree.mkdir();(src/'src').mkdir()
            jsave(src/'mgu-app.json',{'schema':1,'id':a['id'],'version':a['version'],'tree':'package','modules':['src/main.js','src/host.js'],'sdk':['oap-sdk/src/core/OnlineApp.js','oap-sdk/src/logging/logging','oap-sdk/src/someip/someipBuilders'],'mguHmi':['ID8'],'requires':requires})
            shutil.copy2(SOURCE/'main.js',src/'src/main.js');shutil.copy2(SOURCE/'host.js',src/'src/host.js')
            for d in ['runtime','kit']:shutil.copytree(SOURCE/d,tree/'renderer'/d)
            for n in ['manifest.json','permissions.json']:shutil.copy2(SOURCE/'templates'/n,tree/n)
            shutil.copy2(SOURCE/'icons'/(a['id']+'.png'),tree/'icon.png');jsave(tree/'suite.json',a)
            # Generated javascript/app.js and javascript/runner.js are added by the unit's source linker.
            jsave(tree/'package.json',{'name':a['id'],'version':a['version'],'description':desc,'private':False,'main':'javascript/runner.js','mguHmi':['ID8'],'mguRequires':requires,'mguLocalOnly':True,'productName':a['title'],'author':'M3 Suite project','license':'MIT','oapAppSettings':{'maxDiskUsage':16777216,'cpuLimit':50,'memoryThresholdKB':102400,'priority':'PRIO_LOW','visibility':'FOREGROUND','latencyClass':'FOREGROUND','loggingId':['M3DG','M3PC','M3CS'][index],'userLoginRequired':False,'backgroundPriority':150,'someipManifest':'manifest.json'},'files':['icon.png','javascript','manifest.json','package.json','permissions.json','suite.json','renderer','rhmiData','LICENSE','THIRD_PARTY_NOTICES.md'],'dependencies':{'oap-sdk':'24.10.2'}})
            rhmi(tree,a)
            shutil.copy2(ROOT/'LICENSE',tree/'LICENSE');shutil.copy2(ROOT/'THIRD_PARTY_NOTICES.md',tree/'THIRD_PARTY_NOTICES.md')
            artifact=dest/(a['id']+'@'+a['version']+'.tgz');st=pack(src,artifact);metrics[a['id']]=st
        rel=artifact.relative_to(ROOT).as_posix()
        components.append(dict(meta,kind='app',build='unit',icon=(dest/'icon.png').relative_to(ROOT).as_posix(),artifact={'name':artifact.name,'url':rel,'size':st['compressed'],'sha256':st['sha256']}))
    tool=ROOT/'tools/m3-suite-diagnostics';toolmeta=json.loads((tool/'component.json').read_text())
    tooldest=ROOT/'packages/m3-suite-diagnostics@1.0.0.tgz';st=pack(tool,tooldest);metrics['m3-suite-diagnostics']=st
    components.append({k:toolmeta[k] for k in ['id','kind','version','title','description','mguHmi','optional','uninstallable']})
    components[-1]['artifact']={'name':tooldest.name,'url':tooldest.relative_to(ROOT).as_posix(),'size':st['compressed'],'sha256':st['sha256']}
    jsave(ROOT/'mgu-repo.json',{'schema':1,'apps':{'path':'apps/*','manifest':'app.json','mguHmi':['ID8'],'build':{'node':'tools/prebuilt.js','args':['{dir}','{id}','{version}'],'output':'{dir}/{id}@{version}.tgz'},'uninstallable':True},'tools':[{'id':'m3-suite-diagnostics','path':'tools/m3-suite-diagnostics'}]})
    jsave(ROOT/'catalog.json',{'schema':2,'components':components})
    jsave(ROOT/'DOCS/PACKAGE_SIZES.json',metrics)
    print(json.dumps(metrics,indent=2))
if __name__=='__main__':main()
