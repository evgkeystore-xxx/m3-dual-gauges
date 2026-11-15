from pathlib import Path
import json,zipfile,hashlib,shutil
from PIL import Image,ImageDraw,ImageFont
root=Path('/mnt/data/m3_touch_work')
apps=json.loads((root/'SOURCE/apps.json').read_text())
tests=json.loads((root/'TESTS/results.json').read_text())
metrics=json.loads((root/'DOCS/PACKAGE_SIZES.json').read_text())
assert tests['failed']==0
lines=['# BMW M3 G80 — raport wydania Motorsport Touch','',
 'Wydanie: 15.11.2026. Testy lokalne, **nie test na samochodzie**.','',
 '## Wersje']
for a in apps:lines.append(f"- {a['title']}: {a['version']}")
lines+=['','## Kontrola','',f"- {tests['passed']} testów zaliczonych, {tests['failed']} niezaliczonych.",
 '- Symulacja pełnego E_TOUCH przez socket: dotknięcie zakładki zmienia stronę.','- DOWN bez UP oraz UP bez DOWN: przejście do zakładki.','- Suwak: DOWN/MOVE/UP zmienia lokalny profil, bez wysłania polecenia do ECU.',
 '- Weryfikacja źródłowych manifestów, kolejności modułów, RHMI, rozmiarów, SHA256 i składni JS.',
 '- Podglądy PNG pochodzą z lokalnego renderera z DEMO, nie z fizycznego MGU.',
 '- Górne 76 i dolne 120 jednostek ekranu pozostają przezroczyste.',
 '- Renderer: preferowany /run/mgu-render/render.sock, zgodny fallback /run/mgu-renderd/renderd.sock.',
 '- Status: touchAdvertised, touchEvents, lastTouch i rendererSocket w raporcie.',
 '', '## Pakiety', '', '| Aplikacja | TGZ (bajty) | Po rozpakowaniu (bajty) |', '|---|---:|---:|']
for k,v in metrics.items():lines.append(f"| {k} | {v['compressed']:,} | {v['expanded']:,} |")
lines+=['','## Granice weryfikacji','',
 'Nie sprawdzono rzeczywistego dotyku w BMW ani sterowania klapą wydechu na konkretnej mapie MHD. Instalacja aplikacji nie potwierdza obsługi dotyku przez renderer. Gdy licznik touchEvents pozostaje 0 po dotknięciu ekranu, trzeba sprawdzić usługę renderera i raport 8471.',
 'Suwaki profili Pops są wyłącznie lokalnym DEMO. Nie flashują ECU, nie zmieniają mapy i nie regulują rzeczywistych strzałów.',
 '', '## Testy szczegółowe','']
for i,t in enumerate(tests['tests'],1):lines.append(f"{i}. {t['status']} — {t['name']}")
(root/'TEST_REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
# Combined screenshot preview, generated from actual local renderer output.
imgs=[Image.open(root/'DOCS/PREVIEW'/f'{a["id"]}-offline-demo.png').convert('RGB') for a in [apps[1],apps[0],apps[2]]]
W=1600;H=round(imgs[0].height*W/imgs[0].width)
out=Image.new('RGB',(W,H*3+50),'#060b15')
for i,im in enumerate(imgs):out.paste(im.resize((W,H),Image.Resampling.LANCZOS),(0,i*(H+25)))
out.save('/mnt/data/BMW_M3_MOTORSPORT_NOWY_WYGLAD.png',optimize=True)
paths=[]
for top in ['SOURCE','apps','tools','packages','DOCS','TESTS']:
 for p in (root/top).rglob('*'):
  if p.is_file() and '__pycache__' not in p.parts:paths.append(p)
for name in ['README.md','TEST_REPORT.md','THIRD_PARTY_NOTICES.md','LICENSE','mgu-repo.json','catalog.json']:
 paths.append(root/name)
paths=sorted(set(paths),key=lambda p:p.relative_to(root).as_posix())
assert len(paths)<100,len(paths)
with zipfile.ZipFile('/mnt/data/BMW_M3_MOTORSPORT_TOUCH_3_APLIKACJE_GITHUB.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in paths:z.write(p,p.relative_to(root).as_posix())
with zipfile.ZipFile('/mnt/data/BMW_M3_MOTORSPORT_TOUCH_3_APLIKACJE_USB.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in paths:z.write(p,'mgu-repo/m3-suite/'+p.relative_to(root).as_posix())
print('files:',len(paths))
for f in ['/mnt/data/BMW_M3_MOTORSPORT_TOUCH_3_APLIKACJE_GITHUB.zip','/mnt/data/BMW_M3_MOTORSPORT_TOUCH_3_APLIKACJE_USB.zip','/mnt/data/BMW_M3_MOTORSPORT_NOWY_WYGLAD.png']:
 p=Path(f);print(p.name,p.stat().st_size,hashlib.sha256(p.read_bytes()).hexdigest()[:16])
