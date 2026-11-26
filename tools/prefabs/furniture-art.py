"""Cardinal RGBA furniture masters. Offline only; Pillow + Node."""
from pathlib import Path
import json, math, re, subprocess, random
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[2]; out=root/'docs/SALAS/PREFABS/lote-02'; png=out/'png'; png.mkdir(parents=True,exist_ok=True)
def node(script,*args):return subprocess.check_output(['node',str(root/'tools/prefabs'/script),*args],text=True)
orders=dict(re.findall(r'^## ([^\n]+)\n.*?```text\n(.*?)\n```',node('sprite-order.cjs'),re.M|re.S))
ink='#231e29'; steel='#625661'; nickel='#a0948d'; wine='#643948'; plum='#47303e'

def plate(asset,broken,w,h):
    # Percent coordinates are authored per view; no bitmap rotation or mirroring.
    im=Image.new('RGBA',(w*3,h*3));d=ImageDraw.Draw(im);X=lambda x:round(x*(im.width-1)/100);Y=lambda y:round(y*(im.height-1)/100)
    def pts(a):return [(X(x),Y(y)) for x,y in a]
    def poly(a,col,edge=ink): d.polygon(pts(a),fill=col,outline=edge,width=3)
    def line(a,col=nickel,px=1):d.line(pts(a),fill=col,width=3*px,joint='curve')
    def box(x,y,r,b,col,edge=ink,rad=1):d.rounded_rectangle((X(x),Y(y),X(r),Y(b)),radius=rad*3,fill=col,outline=edge,width=3)
    def oval(x,y,r,b,col,edge=ink):d.ellipse((X(x),Y(y),X(r),Y(b)),fill=col,outline=edge,width=3)
    if asset=='monitor':
        for x in (9,71):box(x,93,x+17,99,ink)
        box(2,5,98,95,'#352f39',rad=4);poly([(2,5),(13,0),(87,0),(98,5)],steel);box(7,9,93,91,'#29262f','#79656e',3)
        for y,r in [(25,19),(60,32)]:
            for k,col in [(1,'#61515c'),(.87,'#211e28'),(.71,'#443b47'),(.43,'#332c38'),(.26,'#695963')]:
                a=r*k;b=a*w/h;oval(50-a,y-b,50+a,y+b,col)
        for y in (80,82.5,85):line([(17,y),(83,y)],steel)
        for x in (11,89):
            for y in (12,88):oval(x-1.5,y-.6,x+1.5,y+.6,nickel)
    elif asset=='panel':
        poly([(5,6),(71,1),(96,13),(96,91),(72,99),(5,91)],'#38343f');poly([(5,6),(71,1),(71,96),(5,91)],'#514652');poly([(71,1),(98,13),(98,90),(71,98)],'#74626c');
        for y in (18,26,34,42,50):line([(14,y),(60,y-3)],ink,2)
        for y in (23,48,73):
            oval(77,y,92,y+12,ink,nickel);oval(82,y+3,91,y+9,'#302937');line([(88,y+9),(95,y+12),(94,y+20)],ink,2)
        box(14,68,58,82,'#37313d');line([(20,74),(35,74)],'#a59180');line([(39,74),(52,74)],steel)
    elif asset=='puesto':
        box(8,86,93,98,ink);poly([(1,22),(99,22),(94,90),(7,90)],'#503640');poly([(1,22),(9,3),(91,3),(99,22)],'#75616a');line([(10,4),(90,4)],'#bfaa96',2);box(6,26,94,82,'#3b303a','#75606a');
        for x in range(11,93,6):line([(x,32),(x,76)],'#51424c',2)
        box(5,82,95,88,'#776573');line([(9,83),(92,83)],'#a4958e')
    elif asset=='mesa' and not broken:
        for x,y in [(16,36),(78,36),(9,58),(85,58)]:box(x,y,x+5,y+40,'#524753');line([(x+1,y+1),(x+1,y+36)],'#93838a')
        box(1,5,99,62,'#362b34',rad=6);box(1,0,99,55,'#70545b','#a18a83',6);box(4,5,96,49,'#57434d','#887279',4);line([(9,7),(91,7)],'#a59186');line([(5,54),(95,54)],steel)
    elif asset=='mesa':
        poly([(10,85),(28,71),(48,76),(37,81),(55,85),(35,88)],'#775b60');poly([(52,92),(68,77),(90,80),(76,85),(81,88)],'#634953');line([(22,91),(67,83),(79,88)],steel,3);line([(26,90),(63,83)],nickel);box(15,79,19,92,ink)
    elif asset=='sofa' and not broken:
        # West profile: cushions extend left; tall back is ONLY on the east.
        box(21,83,30,98,ink);box(77,84,86,98,ink);box(6,25,91,91,'#49303e',rad=9);box(9,27,69,80,'#734453','#93717a',8)
        for y in (32,52):
            box(12,y,65,y+18,'#794653','#593542',5);line([(17,y+2),(58,y+2)],'#95616b')
        box(65,1,94,86,plum,'#92747d',8);box(69,5,89,78,wine,'#7f5764',5)
        for y in (20,40,60):oval(76,y,80,y+3,ink)
        for y in (18,75):box(4,y,71,y+12,'#603c4a','#966e79',5)
    elif asset=='sofa':
        poly([(12,84),(27,72),(74,75),(90,86),(76,91),(20,92)],'#3c2d39');poly([(15,83),(32,71),(49,76),(55,85),(36,91)],'#764957');line([(61,86),(65,78),(68,86),(71,76),(74,84),(77,77)],nickel,2);poly([(71,86),(79,80),(90,82),(85,88)],wine)
    else:raise ValueError(asset)
    if asset=='monitor':
        for y in range(10,79,2):
            for x in (13,18,81,86):d.point((X(x+y%3),Y(y)),fill='#a89999')
        box(41,86,59,88,'#80746d')
    if asset=='sofa' and not broken:
        for y in (35,55):
            for x in range(18,58,4):line([(x,y),(x+1,y)],'#b18a87')
        for y in (12,32,52):line([(71,y),(75,y+7),(78,y+8),(84,y+3)],'#875c69')
    if asset=='mesa' and not broken:
        for x in (8,91):
            for y in (9,44):oval(x,y,x+1.4,y+2,'#ae9891')
    # Directional brushed metal/vinyl finish, deterministic and low contrast.
    im=im.resize((w,h),Image.Resampling.LANCZOS);pix=im.load();rng=random.Random(asset)
    for y in range(h):
        for x in range(w):
            r,g,b,a=pix[x,y]
            if a:
                k=round(6*(1-x/w)-5*y/h+2.5*math.sin(x/w*9+y/h*3)+rng.uniform(-2.2,2.2))
                pix[x,y]=tuple(max(0,min(255,v+k)) for v in (r,g,b))+(a,)
    return im

records={}; examples={}
for key in ('r1','r2'):
    mesh=json.loads(node('inspect.cjs','0','0',key))
    for p in mesh['placements']:
        for state in (['intacto','roto'] if p['destructible'] else ['intacto']):
            id=f"{p['asset']}-{p['view']}-{state}";assert id in orders
            usage={k:p[k] for k in ('id','segment','anchor','elevation','sortY','collider','solid','destructible','action')};usage['room']=key
            if id in records:records[id]['uses'].append(usage);continue
            w,h=(math.ceil(round(2*p['artSize'][k],6)) for k in ('w','h'));rx,ry=(p['shadow'][k]*2 for k in ('rx','ry'));pad=5
            pivot=[pad+w/2,pad+h-ry];size=(w+2*pad,h+2*pad);im=Image.new('RGBA',size);im.paste(plate(p['asset'],state=='roto',w,h),(pad,pad));im.save(png/(id+'.png'))
            sh=Image.new('RGBA',size);sd=ImageDraw.Draw(sh);cx,cy=pivot
            if state=='roto':rx*=.73;ry*=.62
            for k,alpha in [(1,30),(.84,53),(.62,79)]:sd.ellipse((cx-rx*k,cy-ry*k,cx+rx*k,cy+ry*k),fill=(16,12,20,alpha))
            sh.save(png/(id+'-sombra.png'));examples[id]=(im,sh);records[id]=dict(file=id+'.png',shadowFile=id+'-sombra.png',state=state,view=p['view'],artSizeU=p['artSize'],sizePx=size,pivotPx=pivot,shadowRadiiPx=[rx,ry],uses=[usage]);
assert len(records)==7
for a in ('mesa-N','sofa-W'):
    intact,broken=(records[a+'-'+v] for v in ('intacto','roto'));assert intact['sizePx']==broken['sizePx'] and intact['pivotPx']==broken['pivotPx'];assert examples[a+'-roto'][0].getbbox()[1]>examples[a+'-intacto'][0].getbbox()[1]
(out/'kit.json').write_text(json.dumps(dict(pxPerUnit=2,playerReferenceU=[64,96],assets=records),indent=2,ensure_ascii=False)+'\n')
(out/'prompts.md').write_text('# Lote 02 · órdenes individuales\n\n'+''.join(f"## {id}\n\n```text\n{orders[id]} Lienzo {r['sizePx'][0]} × {r['sizePx'][1]} px. Pivote base {r['pivotPx']} px, sin marca impresa. Sombra separada en otro PNG del mismo tamaño.\n```\n\n" for id,r in records.items()))
board=Image.new('RGB',(1080,740),'#16131b');d=ImageDraw.Draw(board)
def font(s):
    try:return ImageFont.truetype('DejaVuSans.ttf',s)
    except OSError:return ImageFont.load_default()
def text(x,y,t,s,col='#e4d7cb'):d.text((x,y),t,font=font(s),fill=col)
text(32,20,'DEADBEAT DISCO   /   MOBILIARIO',31);text(34,70,'LOTE 02     ·     SEMILLA 0     /     PLANTA 0     ·     PRUEBA A 2 PX/U',14,'#b69f9f')
rows=[('monitor-S-intacto',108,380),('panel-E-intacto',322,380),('puesto-N-intacto',587,380),('mesa-N-intacto',879,380),('sofa-W-intacto',157,666),('sofa-W-roto',450,666),('mesa-N-roto',870,666)]
for id,x,y in rows:
    im,sh=examples[id];px,py=records[id]['pivotPx'];pos=(round(x-px),round(y-py));d.line((x-72,y,x+72,y),fill='#453c46');board.paste(sh,pos,sh);board.paste(im,pos,im);text(x-70,y+27,id,16);text(x-70,y+51,' / '.join(u['room'] for u in records[id]['uses']),12,'#b09c9d')
board.save(out/'prueba.jpg',quality=92)
