"""Author missing cardinal furniture views; no bitmap rotation/mirroring.

Offline: Pillow, already used by tools/prefabs/furniture-art.py. The new PNGs
inherit the canvas, pivot and generic elliptical shadow of their original asset.
Existing source files are read only. Deterministic transparent RGBA masters.
"""
from pathlib import Path
import json, math, random
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/prefabs/club'
PIVOTS = OUT / 'pivots.json'
REFERENCES = {'sofa': 'sofa-W', 'mesa': 'mesa-N', 'monitor': 'monitor-S', 'panel': 'panel-E'}
VIEWS = {'sofa': ('N','S'), 'mesa': ('S','W'), 'monitor': ('W',), 'panel': ('N',)}
INK='#231e29'; STEEL='#625661'; NICKEL='#a0948d'; WINE='#643948'; PLUM='#47303e'

def draw_plate(asset, view, broken, w, h):
    im=Image.new('RGBA',(w*3,h*3)); d=ImageDraw.Draw(im)
    X=lambda x:round(x*(im.width-1)/100); Y=lambda y:round(y*(im.height-1)/100)
    def pts(a): return [(X(x),Y(y)) for x,y in a]
    def poly(a,col,edge=INK): d.polygon(pts(a),fill=col,outline=edge,width=3)
    def line(a,col=NICKEL,px=1): d.line(pts(a),fill=col,width=3*px,joint='curve')
    def box(x,y,r,b,col,edge=INK,rad=1): d.rounded_rectangle((X(x),Y(y),X(r),Y(b)),radius=rad*3,fill=col,outline=edge,width=3)
    def oval(x,y,r,b,col,edge=INK): d.ellipse((X(x),Y(y),X(r),Y(b)),fill=col,outline=edge,width=3)
    if asset=='monitor' and view=='W':
        # Side view: front speaker grille at left, cabinet side visible at right.
        box(12,93,25,99,INK); box(69,93,83,99,INK)
        poly([(9,5),(25,0),(79,2),(92,8),(92,92),(79,96),(25,95),(9,90)],'#352f39')
        poly([(9,5),(25,0),(25,95),(9,90)],'#29262f','#79656e')
        poly([(25,0),(79,2),(92,8),(92,92),(79,96),(25,95)],'#514652')
        box(33,9,83,86,'#39323d','#79656e',3)
        for y in (19,24,29,34,39,44,49,54,59,64,69,74): line([(39,y),(77,y)],'#554953')
        for y in (14,82):
            for x in (35,80): oval(x,y,x+2,y+1.5,NICKEL)
        line([(14,14),(14,85)],'#79656e')
    elif asset=='panel' and view=='N':
        # North-facing panel: authored rear/control face, ports face the room.
        poly([(6,10),(18,3),(82,3),(94,10),(94,91),(82,97),(18,97),(6,91)],'#38343f')
        box(12,10,88,91,'#514652','#79656e',3);box(17,15,83,84,'#37313d','#74626c',2)
        for x in (26,43,60):
            oval(x,28,x+12,40,INK,NICKEL);oval(x+3,31,x+9,37,'#625661')
        for y in (53,59,65,71):line([(25,y),(74,y)],'#76636d')
        for x in (16,83):
            for y in (14,87):oval(x,y,x+2,y+2,NICKEL)
    elif asset=='sofa' and not broken:
        box(13,83,22,98,INK);box(78,83,87,98,INK)
        box(4,13,96,91,'#49303e','#92747d',8)
        if view=='S':
            # Front is south: backrest sits on the north side of accessible seats.
            box(9,15,91,39,PLUM,'#92747d',7);box(13,18,87,34,WINE,'#875c69',5)
            for x in (28,49,70):oval(x,25,x+2,28,INK)
            for x in (11,38,65):
                box(x,42,x+24,76,'#794653','#593542',5);line([(x+3,46),(x+21,46)],'#a07378')
            box(4,33,12,83,'#603c4a','#966e79',4);box(88,33,96,83,'#603c4a','#966e79',4)
            box(11,78,89,88,'#603c4a','#966e79',4)
        else:
            # North front: the broad back is nearer the southern edge.
            for x in (11,38,65):
                box(x,16,x+24,46,'#794653','#593542',5);line([(x+3,20),(x+21,20)],'#a07378')
            box(4,19,12,70,'#603c4a','#966e79',4);box(88,19,96,70,'#603c4a','#966e79',4)
            box(9,47,91,88,PLUM,'#92747d',7);box(13,52,87,82,WINE,'#875c69',5)
            for x in (27,49,71):line([(x,58),(x+3,65),(x+6,58)],'#875c69');oval(x+2,66,x+5,69,INK)
    elif asset=='sofa':
        # Low debris and exposed springs; no intact back silhouette or collider.
        poly([(8,83),(22,72),(45,74),(58,81),(83,76),(93,85),(81,92),(17,93)],'#3c2d39')
        if view=='S':
            poly([(12,84),(25,73),(42,76),(46,87),(33,91)],'#764957')
            poly([(56,85),(67,78),(88,81),(85,88),(72,91)],WINE)
        else:
            poly([(13,86),(27,79),(40,80),(46,90),(25,92)],WINE)
            poly([(53,82),(66,73),(83,76),(90,86),(74,89)],'#764957')
        line([(43,87),(46,78),(49,86),(52,77),(55,85),(58,78)],NICKEL,2)
        line([(22,91),(72,89)],STEEL)
    elif asset=='mesa' and not broken:
        if view=='S':
            for x,y in [(15,39),(78,39),(9,58),(85,58)]:box(x,y,x+5,y+39,'#524753');line([(x+1,y+1),(x+1,y+35)],'#93838a')
            box(1,5,99,62,'#362b34',rad=6);box(1,0,99,55,'#70545b','#a18a83',6)
            box(4,6,96,50,'#57434d','#887279',4);line([(9,48),(91,48)],'#a59186');line([(5,58),(95,58)],STEEL)
            for x in (8,91):
                for y in (10,43):oval(x,y,x+1.4,y+2,'#ae9891')
        else:
            # West profile, narrower top; same canvas/pivot and footprint contract.
            for x,y in [(30,38),(64,38),(25,60),(69,60)]:box(x,y,x+4,y+37,'#524753');line([(x+1,y+1),(x+1,y+34)],'#93838a')
            box(20,5,80,63,'#362b34',rad=5);box(20,0,80,55,'#70545b','#a18a83',5)
            box(24,5,76,49,'#57434d','#887279',3);line([(27,8),(73,8)],'#a59186')
    elif asset=='mesa':
        if view=='S':
            poly([(8,87),(24,73),(44,78),(37,83),(57,87),(36,91)],'#775b60')
            poly([(51,91),(69,76),(91,80),(78,85),(83,89)],'#634953')
            line([(20,92),(66,83),(79,88)],STEEL,3);line([(25,91),(64,84)],NICKEL)
        else:
            poly([(20,88),(34,74),(51,78),(44,84),(57,87),(41,91)],'#775b60')
            poly([(50,92),(62,78),(78,81),(69,86),(72,89)],'#634953')
            line([(30,91),(60,84),(72,89)],STEEL,3);line([(33,90),(59,85)],NICKEL)
    else: raise ValueError((asset,view,broken))
    im=im.resize((w,h),Image.Resampling.LANCZOS);pix=im.load();rng=random.Random(asset+view+str(broken))
    for y in range(h):
        for x in range(w):
            r,g,b,a=pix[x,y]
            if a:
                k=round(6*(1-x/w)-5*y/h+2.5*math.sin(x/w*9+y/h*3)+rng.uniform(-2.2,2.2))
                pix[x,y]=tuple(max(0,min(255,v+k)) for v in (r,g,b))+(a,)
    return im

def main():
    pivots=json.loads(PIVOTS.read_text());made=[]
    for asset,views in VIEWS.items():
        for view in views:
            for state in (('intacto','roto') if asset in ('sofa','mesa') else ('intacto',)):
                target=f'{asset}-{view}-{state}'; source=f'{REFERENCES[asset]}-{state}'
                reference=Image.open(OUT/(source+'.png')).convert('RGBA'); w,h=reference.size;pad=5
                im=Image.new('RGBA',(w,h));im.paste(draw_plate(asset,view,state=='roto',w-2*pad,h-2*pad),(pad,pad))
                im.save(OUT/(target+'.png'))
                # Original shadows are neutral ellipses, not directional artwork.
                Image.open(OUT/(source+'-sombra.png')).save(OUT/(target+'-sombra.png'))
                pivots[target]=pivots[source];made.append(target)
    PIVOTS.write_text(json.dumps(pivots,ensure_ascii=False,indent=2)+'\n')
    print('\n'.join(made))
if __name__=='__main__': main()
