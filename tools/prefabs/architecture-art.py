"""Offline architectural masters and art orders. Requires Pillow, no runtime imports."""
import json, math, random, re, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/SALAS/PREFABS/lote-01'
PNG = OUT / 'png'
PNG.mkdir(parents=True, exist_ok=True)

def node(script, *args):
    return subprocess.check_output(['node', str(ROOT/'tools/prefabs'/script), *args], text=True)
rooms = [json.loads(node('inspect.cjs', '0','0',key)) for key in ('r1','r2')]
source = dict(re.findall(r'^## ([^\n]+)\n.*?```text\n(.*?)\n```', node('sprite-order.cjs'), re.M|re.S))
records = {}

# All lighting is in fixed screen coordinates. Directional details are drawn
# directly in each final canvas, never obtained by rotating a different PNG.
def metal(w,h,color,pattern):
    rng=random.Random('lot01/'+pattern)
    img=Image.new('RGB',(w,h)); pixels=[]
    for y in range(h):
        for x in range(w):
            v=rng.choice((-2,-1,-1,0,0,1,1,2))
            if pattern=='suelo':
                # Staggered ceramic bays; the lattice repeats across both boundaries.
                u=(x+64*(y//64%2))%128; t=y%64
                v+=(-11 if u<2 or t<2 else 6 if u==2 or t==2 else 0)+2*math.cos(2*math.pi*u/128)
            elif pattern in ('cara','cantoTarima'):
                u=x%(32 if pattern=='cara' else 16); v+=-9 if u<3 else 6 if u==3 else 0
            elif pattern in ('tarima','pisada-7','pisada-5'):
                if (x+(y//8%2)*4)%12 in (0,1) and y%8 in (1,2):v-=10
            else:v+=2*math.cos(2*math.pi*y/8)
            pixels.append(tuple(max(0,min(255,int(c+v))) for c in color))
    img.putdata(pixels);return img

def export(id,img,pivot,size,view,usage,detail):
    img.save(PNG/(id+'.png'));records[id]=dict(file='png/'+id+'.png',pixels=list(img.size),pivotPx=pivot,nominalU=size,view=view,uses=usage,detail=detail,shadow='separate',rotationRuntime=0)

def band(id,w,h,col,view,use,detail):
    img=metal(math.ceil(w*2),math.ceil(h*2),col,id);d=ImageDraw.Draw(img);W,H=img.size
    if id.startswith('pisada'):
        d.rectangle((0,H-4,W-1,H-2),fill='#786e68');d.line((0,H-1,W-1,H-1),fill='#353039')
    if id=='contrahuella':d.line((0,0,W-1,0),fill='#534853');d.line((0,H-1,W-1,H-1),fill='#292630')
    export(id,img,[0,0],[w,h],view,use,detail)

both=['r1','r2']
band('suelo',128,128,(45,41,49),'cenital',both,'Muestra 128 × 128 u, repetición bidireccional. Juntas de loseta desplazadas; sin borde perimetral.')
band('tapa',64,24,(58,55,60),'cenital',both,'Módulo UV de 64 × 24 u: metal bruñido, sin labio de puerta ni esquina pintada.')
band('cara',64,72,(52,45,53),'alzado',both,'Módulo frontal 64 × 72 u; recortar a la altura de cada tramo. Chapa de ritmo vertical, sin biseles laterales falsos.')
d=rooms[0]['decks'][0]; band('tarima',d['w'],d['h'],(62,50,58),'cenital',both,'Placa antideslizante independiente del canto. No repetir la silueta del monitor.')
band('cantoTarima',64,42,(48,40,47),'alzado',both,'Módulo 64 × 42 u; en nave usar solo 30 u de altura, sin comprimir el acanalado.')
band('contrahuella',d['w'],6,(49,40,49),'S',both,'Una sola faja vertical. Sin huella superior ni franja luminosa.')

for room in rooms:
    key=room['key'];st=room['decks'][0];t=st['treads'][0]
    band('pisada-'+str(st['steps']),t['w'],t['h'],(75,64,71),'S',[key],'Una sola huella, microperforación sobria y nariz de níquel al sur; no dibujar contrahuella. Conservar la profundidad lógica, no usar la altura redondeada del PNG.')
    for o in room['openings']:
        side={'top':'S','bottom':'N','left':'E','right':'W'}[o['side']];n=o['normal'];tan=o['tangent'];origin=o['origin'];wall=next(w for w in room['walls'] if w['edge']==o['edge']);height=wall['height'];usage=f"{key}:{wall['segment']}→{o['to']}"
        def master(id,poly,z,jamb=None):
            ref=origin if jamb is None else {c:sum(p[c] for p in poly)/4 for c in ('x','y')}
            instance={'link':usage,'anchorXY':[ref['x'],ref['y']],'z':0,'sortY':max(p['y'] for p in poly) if jamb is not None else None}
            if id in records:records[id]['uses'].append(instance);return
            x0,y0=min(p['x'] for p in poly),min(p['y'] for p in poly);w=max(p['x'] for p in poly)-x0;h=max(p['y'] for p in poly)-y0
            pad=4;W,H=round(w*2),round(h*2);rise=round(z*2);im=Image.new('RGBA',(W+2*pad,H+rise+2*pad));cap=metal(W,H,(62,59,62),'tapa');face=metal(W,rise or 1,(53,45,51),'cara');dr=ImageDraw.Draw(cap)
            if jamb is None:
                cap=metal(W,H,(60,56,62),'umbral');dr=ImageDraw.Draw(cap)
                # Lines parallel to aperture, recessed entrance rim and quiet fixings.
                for dist,col in [(2,'#77706e'),(6,'#35313a'),(11,'#514b52')]:
                    x=dist if n['x']>0 else W-1-dist;y=dist if n['y']>0 else H-1-dist
                    dr.line((x,3,x,H-4) if n['x'] else (3,y,W-4,y),fill=col,width=2)
                for x in (12,W-13):
                    for y in (12,H-13):dr.ellipse((x-2,y-2,x+2,y+2),fill='#443e46');dr.point((x-1,y-1),fill='#887e79')
            else:
                im.paste(face,(pad,pad+H));dx=tan['x']*(1 if jamb==0 else -1);dy=tan['y']*(1 if jamb==0 else -1)
                dr.rectangle((0,0,W-1,H-1),outline='#473f46');edge=(W-2,1,W-2,H-2) if dx==1 else (1,1,1,H-2) if dx==-1 else (1,H-2,W-2,H-2) if dy==1 else (1,1,W-2,1)
                dr.line(edge,fill='#958782',width=2);dr.line((1,1,W-2,1),fill='#797176');body=ImageDraw.Draw(im);body.line((pad,pad+H,pad,pad+H+rise-1),fill='#72656a');body.line((pad,pad+H+rise-3,pad+W-1,pad+H+rise-3),fill='#39313a')
            im.paste(cap,(pad,pad));pivot=[pad+2*(ref['x']-x0),pad+rise+2*(ref['y']-y0)]
            export(id,im,pivot,[w,h,z],side,[instance], 'Marco de 4 px alfa; pivote en centro de base del montante. Solo bisel hacia la luz; sin sombra horneada.' if jamb is not None else 'Marco de 4 px alfa. Pivote en el punto medio del borde exterior, no en el centro de la placa. Perfil de entrada discreto y centro libre.')
        master('umbral-'+side,o['threshold'],0)
        for i,poly in enumerate(o['jambs']):master(f'jamba-{side}-{i}',poly,height,i)

assert len(records)==20 and all(k in source for k in records)
(OUT/'kit.json').write_text(json.dumps({'pxPerUnit':2,'referencePlayerU':[64,96],'assets':records},indent=2,ensure_ascii=False)+'\n')
text='# Lote 01 · órdenes de generación individuales\n\nUna salida por bloque. Dimensiones en píxeles del máster, pivote medido desde arriba a la izquierda. UV = material de superficie, no sprite vertical.\n'
for id,a in records.items():
    w,h=a['pixels'];text+=f"\n## `{id}.png` · {a['view']}\n\n```text\n{source[id]} {a['detail']} Entrega un PNG de {w} × {h} px a 2 px/u. Pivote {a['pivotPx']} px como metadato, sin marcador visible. Mantén las verticales aplomadas; no añadas otros módulos ni leyendas.\n```\n"
(OUT/'prompts.md').write_text(text)
# The proof is an offline composition, never a full staircase used as a sprite.
board=Image.new('RGB',(1250,1040),'#151419');draw=ImageDraw.Draw(board)
def font(s):
    try:return ImageFont.truetype('DejaVuSans.ttf',s)
    except OSError:return ImageFont.load_default()
def caption(x,y,t,size=17,color='#d7caca'):draw.text((x,y),t,font=font(size),fill=color)
def get(id):return Image.open(PNG/(id+'.png')).convert('RGBA')
caption(40,24,'DEADBEAT DISCO    /    ARQUITECTURA',27);caption(40,65,'LOTE 01      SEMILLA 0  /  PLANTA 0      ·      PRUEBA DE MONTAJE OFFLINE',15,'#a699a0')
for i,room in enumerate(rooms):
    st=room['decks'][0];x=50+i*612;y=154;caption(x,y-40,room['key']+'    '+room['template'].upper(),21)
    # Rasterize edges from cumulative world coordinates to avoid 5 × rounding error.
    paste=lambda im,x,y:board.paste(im,(x,y),im)
    paste(get('tarima'),x,y);py=y+188
    for j,t in enumerate(st['treads']):
        h=round((j+1)*2*t['h'])-round(j*2*t['h']);paste(get('pisada-'+str(st['steps'])).resize((410,h)),x,py);py+=h
        paste(get('contrahuella'),x,py);py+=12
    caption(x+425,y+8,f"{st['steps']} huellas",15);caption(x+425,y+33,f"Z +{st['rise']} u",15)
caption(40,653,'PLACAS CARDINALES   /   umbral + dos jambas independientes',18)
for i,v in enumerate('WNES'):
    x=40+i*307;caption(x,702,'VISTA '+v,15);im=get('umbral-'+v);im.thumbnail((148,140));board.paste(im,(x,744),im)
    for j in (0,1):
        im=get(f'jamba-{v}-{j}');im.thumbnail((58,140));board.paste(im,(x+155+j*65,744),im)
for i,id in enumerate(['suelo','tapa','cara','cantoTarima']):
    im=get(id);x=40+i*307;board.paste(im.crop((0,0,min(230,im.width),min(78,im.height))),(x,915));caption(x,1000,id,14)
board.save(OUT/'prueba.jpg',quality=91)
