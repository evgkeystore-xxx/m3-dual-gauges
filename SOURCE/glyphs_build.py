#!/usr/bin/env python3
"""Developer-only raster glyph bake. Produces a JS module of compressed alpha pixels.
Does NOT copy, embed, distribute or ship a TTF/OTF font file.
"""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,zlib,base64,math
fontfile='/usr/share/fonts/opentype/inter/InterDisplay-Medium.otf'
chars=''.join(dict.fromkeys('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /-_.:+%()!?<>|[]@#*°ĄĆĘŁŃÓŚŹŻąćęłńóśźż\\=,;'))
res=[]
for size in [32,48,64,96]:
    f=ImageFont.truetype(fontfile,size)
    glyph=[]
    for ch in chars:
        b=f.getbbox(ch,anchor='ls')
        advance=round(f.getlength(ch),2)
        w=max(1,b[2]-b[0]);h=max(1,b[3]-b[1]);glyph.append((ch,b,advance,w,h))
    width=1024;xx=2;yy=2;rowh=0;metrics={};loc=[]
    for ch,b,advance,w,h in glyph:
        if xx+w+4>width:xx=2;yy+=rowh+5;rowh=0
        loc.append((ch,xx,yy,b,advance,w,h));xx+=w+5;rowh=max(rowh,h)
    height=yy+rowh+3
    im=Image.new('L',(width,height),0);d=ImageDraw.Draw(im)
    for ch,x,y,b,advance,w,h in loc:
        # anchor='ls' puts the glyph at its baseline; align ink top-left into atlas cell.
        d.text((x-b[0],y-b[1]),ch,font=f,fill=255,anchor='ls')
        metrics[str(ord(ch))]=[x,y,w,h,b[0],b[1],advance]
    blob=base64.b64encode(zlib.compress(im.tobytes(),9)).decode('ascii')
    res.append({'size':size,'ascent':size,'descent':0,'atlasW':width,'atlasH':height,'glyphs':metrics,'data':blob})
    print(size,width,height,len(blob))
js='''\'use strict\';\n/* Rasterized UI lettering. No font file is bundled or exposed.\n * Glyph pixels were baked for this application; the original typeface is not included. */\nconst zlib=require('zlib');\nconst sizes='''+json.dumps(res,separators=(',',':'))+''';\nconst cache={};\nfunction get(name,requested){let best=sizes[sizes.length-1];for(const s of sizes){if(s.size>=requested){best=s;break;}}if(!cache[best.size])cache[best.size]={size:best.size,ascent:best.ascent,descent:best.descent,atlasW:best.atlasW,atlasH:best.atlasH,glyphs:best.glyphs,alpha:zlib.inflateSync(Buffer.from(best.data,'base64'))};return cache[best.size];}\nfunction measure(f,str){let w=0;for(const ch of String(str)){const g=f.glyphs[ch.codePointAt(0)]||f.glyphs[63];if(g)w+=g[6];}return w;}\nmodule.exports={get:get,measure:measure};\n'''
Path('/mnt/data/m3_touch_work/SOURCE/kit/fonts.js').write_text(js)
