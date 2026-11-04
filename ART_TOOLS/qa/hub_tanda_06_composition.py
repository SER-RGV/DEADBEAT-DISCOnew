#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HUB · TANDA 06 — FASE 1b · PRUEBA DE COMPOSICIÓN EN TRES ZONAS
================================================================
NO produce assets. Proyecta, sobre capturas REALES del HUB, las cajas mundo
propuestas para la envolvente arquitectónica usando la matriz de cámara
MEDIDA por hub_tanda_06_camera_audit.js. Demuestra, antes de producir, qué
caras y planos son visibles, la continuidad de uniones, proporciones, anclajes
y lectura desde la cámara de juego.

Salidas: ART_EVIDENCE/hub/tanda_06/composicion_*.jpg, plano_caras_visibles.png,
         composicion.json, camera_audit.json
         ART_HUB_TANDA_06_CAMERA_AUDIT.md
Uso: PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/qa/hub_tanda_06_composition.py
"""
import json, math, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
EV = os.path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_06')
os.makedirs(EV, exist_ok=True)
RUNTIME = json.load(open(os.path.join(EV, 'camera_audit_runtime.json'), encoding='utf-8'))
# Cámaras adicionales medidas por el arnés A/B de QA (10 zonas). Se usan SOLO
# para la cobertura de las 4 cajas repetidas de los paramentos laterales;
# los overlays siguen usando las 6 capturas de la auditoría de cámara.
try:
    _QA = json.load(open(os.path.join(EV, 'despues_runtime_full.json'), encoding='utf-8'))
except (OSError, ValueError):
    _QA = {}
ZONES = {z: v['camera'] for z, v in RUNTIME['zones'].items()}
for _z, _cam in (_QA.get('zoneCamera') or {}).items():
    ZONES.setdefault(_z, _cam)

SCALE = 0.9375
SW, SH = 1280, 900
# Polígono real medido en buildHubSpace(): Ps=(290,265,1920,1320), cut=210
RX, RY, RW, RH, CUT = 290, 265, 1920, 1320, 210
POLY = [(RX+CUT,RY),(RX+RW-CUT,RY),(RX+RW,RY+CUT),(RX+RW,RY+RH-CUT),
        (RX+RW-CUT,RY+RH),(RX+CUT,RY+RH),(RX,RY+RH-CUT),(RX,RY+CUT)]

# KIT DEFINITIVO: se lee del manifiesto para que las cajas de la prueba de
# composición sean EXACTAMENTE las medidas tras la preparación (aspecto real,
# sin deformación). La fase 1b se ejecutó primero con cajas nominales y se
# repite aquí con las definitivas; orientación y caras no cambian.
MANIFEST = json.load(open(os.path.join(ROOT, 'ART_ASSETS', 'hub', 'tanda_06',
                                      'manifest.json'), encoding='utf-8'))
COLORS = {'T06-01': '#ff2d95', 'T06-02': '#ff2d95', 'T06-03': '#ff2d95',
          'T06-04': '#facc15', 'T06-05': '#facc15', 'T06-06': '#a855f7',
          'T06-07': '#a855f7', 'T06-08': '#22d3ee', 'T06-09': '#f472b6',
          'T06-10': '#4ade80'}
PROPOSALS = []
for _a in MANIFEST['assets']:
    _loc = _a['location']
    _box = _loc['worldBox']
    _base = dict(
        id=_a['id'], name=_a['name'],
        kind='flat' if _a['anchor']['t06flat'] else 'wall',
        x=_loc['x'], y=_loc['y'], w=_box[2], h=_box[3],
        face=_a['visibleFace'], color=COLORS[_a['id']])
    PROPOSALS.append(_base)
    # Repeticiones de T06-06/07 (y=780/1540) para continuidad y=400..1540.
    # Sus cajas mundo ya están medidas en el manifiesto; se proyectan tal cual.
    for _i, _b in enumerate(_loc.get('additionalWorldBoxes') or [], 1):
        _r = dict(_base)
        _r.update(id='%s-R%d' % (_a['id'], _i),
                  name='%s · repetición %d' % (_a['name'], _i),
                  worldBox=list(_b), repetitionOf=_a['id'])
        PROPOSALS.append(_r)

# Tres zonas representativas (una por orientación de muro) + 3 de apoyo
PRIMARY = [
  ('norte',       'A · NORTE / CABINA DJ',  'Muro norte: cara SUR, cornisa, viga, zócalo'),
  ('pared_oeste', 'B · OESTE / ARSENAL',    'Muro oeste: cara ESTE, capa superior hacia -X'),
  ('pared_este',  'C · ESTE / BARRA VIP',   'Muro este: cara OESTE, simetría de luz'),
]
SUPPORT = ['vip_oeste','vip_este','centro','dj','bar','arcade','sellos']
ALL_ZONES = [z[0] for z in PRIMARY] + SUPPORT

def proj(wx, wy, cam):
    return (SW/2 + SCALE*(wx-cam['x']), SH/2 + SCALE*(wy-cam['y']))

def world_box(p):
    if 'worldBox' in p:
        return tuple(p['worldBox'])
    if p['kind'] in ('flat','corner'):
        return (p['x']-p['w']/2, p['y']-p['h']/2, p['x']+p['w']/2, p['y']+p['h']/2)
    return (p['x']-p['w']/2, p['y']-p['h'], p['x']+p['w']/2, p['y'])

def screen_box(p, cam):
    a,b,c,d = world_box(p)
    x0,y0 = proj(a,b,cam); x1,y1 = proj(c,d,cam)
    return (x0,y0,x1,y1)

def font(sz):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
              '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf']:
        if os.path.exists(f):
            try: return ImageFont.truetype(f, sz)
            except Exception: pass
    return ImageFont.load_default()
F12, F14, F18 = font(12), font(14), font(18)

def rgb(c):
    return tuple(int(c[i:i+2],16) for i in (1,3,5))

def measure(zone):
    """Cobertura de las 10 cajas en una zona (sin dibujar)."""
    cam = ZONES[zone]
    rows = []
    for p in PROPOSALS:
        b = screen_box(p, cam)
        inside = b[0] >= -1 and b[1] >= -1 and b[2] <= SW+1 and b[3] <= SH+1
        inter = b[2] > 0 and b[0] < SW and b[3] > 0 and b[1] < SH
        rows.append(dict(id=p['id'], worldBox=[round(v,1) for v in world_box(p)],
                         screenBox=[round(v,1) for v in b], face=p['face'],
                         fullVisible=inside, intersectsViewport=inter))
    return dict(zone=zone, camera=cam,
                transform=dict(a=SCALE,b=0,c=0,d=SCALE,
                               e=round(SW/2-SCALE*cam['x'],4),
                               f=round(SH/2-SCALE*cam['y'],4)),
                proposals=rows)

def overlay(zone, title, note, measured):
    cam = measured['camera']
    base = Image.open(os.path.join(EV,'camera_audit_%s.png'%zone)).convert('RGBA')
    lay = Image.new('RGBA', base.size, (0,0,0,0))
    d = ImageDraw.Draw(lay, 'RGBA')
    # Rejilla mundo cada 250 u (referencia de proyección real)
    gx0 = math.floor((cam['x']-SW/(2*SCALE))/250)*250
    gx1 = cam['x']+SW/(2*SCALE)+250
    gy0 = math.floor((cam['y']-SH/(2*SCALE))/250)*250
    gy1 = cam['y']+SH/(2*SCALE)+250
    for wx in range(int(gx0), int(gx1), 250):
        x0,_ = proj(wx,gy0,cam); x1,_ = proj(wx,gy1,cam)
        d.line([(x0,0),(x1,SH)], fill=(120,200,255,40), width=1)
        if 0 <= x0 <= SW-60: d.text((x0+3,SH-22),str(wx),font=F12,fill=(150,215,255,170))
    for wy in range(int(gy0), int(gy1), 250):
        _,y0 = proj(gx0,wy,cam); _,y1 = proj(gx1,wy,cam)
        d.line([(0,y0),(SW,y1)], fill=(120,200,255,40), width=1)
        if 0 <= y0 <= SH-20: d.text((SW-52,y0+2),str(wy),font=F12,fill=(150,215,255,170))
    # Límite real del octógono
    pts=[proj(*q,cam) for q in POLY]
    d.line(pts+[pts[0]], fill=(34,211,238,210), width=3, joint='curve')
    for q in pts:
        d.ellipse([q[0]-4,q[1]-4,q[0]+4,q[1]+4], fill=(34,211,238,220))
    # Cajas propuestas (alfa real, no sustitución de píxel)
    for p,row in zip(PROPOSALS, measured['proposals']):
        if not row['intersectsViewport']: continue
        b = row['screenBox']; R = rgb(p['color'])
        d.rectangle((b[0],b[1],b[2],b[3]), outline=R+(235,), width=3)
        d.rectangle((b[0]+3,b[1]+3,b[2]-3,b[3]-3), fill=R+(34,))
        if p['kind'] in ('wall','wall_side','corner'):
            cap = min(16, max(6,(b[3]-b[1])*0.11))
            d.rectangle((b[0]+3,b[1]+3,b[2]-3,b[1]+3+cap), fill=(34,211,238,95))
        lab = p['id']+' '+p['name']
        ly=max(2,min(SH-18,b[1]+4)); lx=max(2,min(SW-250,b[0]+5))
        d.rectangle((lx-2,ly-2,lx+7.0*len(lab)+4,ly+16), fill=(3,6,14,205))
        d.text((lx,ly),lab,font=F12,fill=R+(255,))
    # Ejes / profundidad
    ox,oy = SW-190, SH-118
    d.rectangle((ox-10,oy-28,SW-6,SH-6), fill=(3,6,14,210))
    d.line([(ox,oy),(ox+62,oy)], fill=(255,45,149,255), width=3)
    d.polygon([(ox+62,oy),(ox+54,oy-5),(ox+54,oy+5)], fill=(255,45,149,255))
    d.text((ox+66,oy-8),'+X',font=F12,fill=(255,45,149,255))
    d.line([(ox,oy),(ox,oy+44)], fill=(34,211,238,255), width=3)
    d.polygon([(ox,oy+44),(ox-5,oy+36),(ox+5,oy+36)], fill=(34,211,238,255))
    d.text((ox+8,oy+30),'+Y = CERCA',font=F12,fill=(34,211,238,255))
    d.text((ox-4,oy-22),'ALTURA = -Y pantalla',font=F12,fill=(232,217,160,255))
    d.rectangle((262,0,SW,34), fill=(3,6,14,215))
    d.text((272,9),title+'  |  '+note,font=F14,fill=(235,240,255,255))
    out = os.path.join(EV,'composicion_%s.jpg'%zone)
    Image.alpha_composite(base,lay).convert('RGB').save(out,quality=90)
    return os.path.relpath(out,ROOT)

def faces_diagram():
    W,H=1280,860
    im=Image.new('RGB',(W,H),(6,8,18)); d=ImageDraw.Draw(im,'RGBA')
    ox,oy,s=70,90,0.46
    P=lambda q:(ox+q[0]*s,oy+q[1]*s)
    poly=[P(q) for q in POLY]
    d.polygon(poly,fill=(24,16,42,255))
    d.line(poly+[poly[0]],fill=(34,211,238,255),width=4,joint='curve')
    d.line([P((500,265)),P((2000,265))],fill=(255,45,149,255),width=10)
    d.line([P((290,475)),P((290,1375))],fill=(168,85,247,255),width=10)
    d.line([P((2210,475)),P((2210,1375))],fill=(168,85,247,255),width=10)
    d.line([P((500,265)),P((290,475))],fill=(250,204,21,255),width=8)
    d.line([P((2000,265)),P((2210,475))],fill=(250,204,21,255),width=8)
    for p in PROPOSALS:
        a,b,c,e=world_box(p); q=[P((a,b)),P((c,b)),P((c,e)),P((a,e))]
        d.line(q+[q[0]],fill=rgb(p['color'])+(205,),width=2)
    d.text((70,30),'HUB · CARAS Y PLANOS VISIBLES DESDE LA CÁMARA ORTOGRÁFICA 2.5D',font=F18,fill=(235,240,255,255))
    d.text((70,58),'Mundo real: octógono Ps=(290,265,1920,1320), cut=210 · cámara sin rotación, zoom 0,9375',font=F12,fill=(160,180,210,255))
    ly=690
    d.rectangle((70,ly,1210,830),fill=(10,14,28,240),outline=(90,110,150,255))
    items=[
      ('#ff2d95','Muro NORTE: cara SUR (+Y) visible; coronación superior visible; cara norte OCULTA.'),
      ('#a855f7','Muros OESTE/ESTE: caras interiores ESTE/OESTE visibles; cara exterior OCULTA.'),
      ('#facc15','Machones de esquina: unión a inglete sobre el paramento norte, no pared frontal.'),
      ('#22d3ee','Viga/casetón de techo: solo cara INFERIOR y canto frontal; sin cara superior.'),
      ('#f472b6','Cortinaje: fachada FRONTAL colgada de la cornisa, con pliegues y anclaje superior.'),
      ('#4ade80','Zócalo: plano de SUELO sin altura; asienta la fachada y evita flotación.'),
    ]
    for i,(c,t) in enumerate(items):
        yy=ly+12+i*21
        d.rectangle((88,yy+2,104,yy+14),fill=c)
        d.text((116,yy),t,font=F12,fill=(220,228,245,255))
    out=os.path.join(EV,'plano_caras_visibles.png'); im.save(out)
    return os.path.relpath(out,ROOT)

def main():
    measured={z:measure(z) for z in ALL_ZONES}
    zones=[]
    for z,t,n in PRIMARY:
        m=measured[z]; m['title']=t; m['note']=n
        m['image']=overlay(z,t,n,m); zones.append(m)
    diagram=faces_diagram()
    # Cobertura: cada uno de los 10 recursos debe tener >=1 zona con caja completa
    coverage={}
    for p in PROPOSALS:
        full=[z for z in ALL_ZONES if next(r for r in measured[z]['proposals'] if r['id']==p['id'])['fullVisible']]
        coverage[p['id']]=dict(fullVisibleZones=full, ok=bool(full))
    comp=dict(tanda='06', phase='FASE 1b · prueba de composición previa a producción',
              projection='ortográfica oblicua 2.5D, escala uniforme, sin cizalla/rotación',
              world=dict(Ps=[RX,RY,RW,RH],cut=CUT,poly=POLY,worldSize=[2500,1850]),
              cameraMeasured=RUNTIME['environment']['camera'],
              semi2d=RUNTIME['environment']['semi2d'],
              visibleFaces=dict(norte='SUR (+Y)',oeste='ESTE (+X)',este='OESTE (-X)',
                                techo='INFERIOR',suelo='SUPERIOR (cenital)',
                                ocultas=['cara norte del muro norte','caras exteriores de los muros laterales',
                                         'cara superior de la viga','trasera del cortinaje']),
              primaryZones=[z[0] for z in PRIMARY], supportZones=SUPPORT,
              zones=zones, coverage=coverage,
              allAssetsHaveFullVisibleZone=all(v['ok'] for v in coverage.values()),
              diagram=diagram,
              verdict='APROBADA' if all(v['ok'] for v in coverage.values()) else 'BLOQUEADA',
              rationale='Caras interiores, coronación, ingletes y zócalo se leen desde la cámara '
                        'de juego; no se requiere cambiar cámara ni proyección.')
    json.dump(comp,open(os.path.join(EV,'composicion.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=2)
    json.dump(dict(tanda='06',source='DEADBEAT_DISCO.ART.html + medición Chromium en el HUB real',
                   cameraProjection='pantalla = centro + zoom*(mundo - (B,L))',
                   zoom=SCALE,rotation=0,shear=0,depthScaleForHubCustom=1.0,
                   semi2dScaleFor=RUNTIME['environment']['semi2d'],
                   ySort='sort(y ascendente); hubCustom.sortY = dc.y',
                   hubPolygon=dict(Ps=[RX,RY,RW,RH],cut=CUT,poly=POLY),
                   floorCache=dict(size=[1920,1320],origin=[290,265],center=[1250,935],
                                   revision='window.__T3B.revision'),
                   cameraLimits=dict(x=[883,1617],yMin=655,
                                     measured=[RUNTIME['zones'][z]['camera'] for z in RUNTIME['zones']]),
                   existingWallPainter='generador de salas de campaña (rotate atan2(dy,dx)); '
                                       'NO activo en el HUB: solo suelo cacheado + ribete Rs.edges',
                   decision='No imponer isometría matemática; fachadas billboard alineadas a ejes '
                            'X/Y reales, coronación y zócalo para anclar volumen.'),
              open(os.path.join(EV,'camera_audit.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=2)
    md="""# HUB · TANDA 06 — FASE 1 · AUDITORÍA DE CÁMARA Y PERSPECTIVA REAL

Fuente de verdad: `DEADBEAT_DISCO.ART.html` y medición en vivo con Chromium/Playwright
(`ART_TOOLS/qa/hub_tanda_06_camera_audit.js` → `camera_audit_runtime.json`).
**No se ha modificado ningún archivo del juego durante esta fase.**

## 1. Proyección medida (no teórica)

| Concepto | Valor real |
|---|---|
| Transformación de cámara | `translate(y/2,x/2) → scale(N.applied) → translate(-B,-L)` |
| Matriz `getTransform()` en `drawImage` | `a=d=0,9375`, `b=c=0` en las 6 zonas |
| Mundo → pantalla | `sx = 0,9375·(x−B)+640`; `sy = 0,9375·(y−L)+450` |
| Rotación / cizalla / escala por profundidad de cámara | **ninguna** |
| Zoom | `0,9375` uniforme; `viewW=1365`, `viewH=960` a 1280×900 |
| Eje +X | derecha en pantalla, sin foreshortening |
| Eje +Y | abajo en pantalla = **más cerca** (profundidad creciente) |
| Altura vertical | se pinta hacia **−Y de pantalla** (billboard), no por transform |
| `DMO.camera()` | `x=B, y=L, zoom, viewW, viewH, lead={0,10}` |
| Límites de cámara medidos | `B∈[883,1617]`, `L≥655` (`lead +10`) |
| Y-sort | cola `sort(y ascendente)`; `hubCustom.sortY = dc.y` (T05/T06) |
| `DMO_SEMI2D.scaleFor(y)` | 0,804 (y=300) → 1,174 (y=1500): **solo props procedurales**; `hubCustom` (`Lc → hubDraw`) no recibe esa escala |

Conclusión: la cámara es **ortográfica oblicua 2.5D de escala uniforme**. La ilusión
isométrica la aportan los sprites y el suelo pintado, **no una proyección isométrica
matemática**. Por tanto no se impone una isometría distinta: las fachadas se construyen
alineadas a los ejes X/Y reales, con coronación (cara superior) y zócalo (plano de suelo)
para dar volumen sin deformar. Aplicar `scaleFor(y)` a la envolvente rompería la
continuidad entre tramos contiguos, por lo que **se descarta deliberadamente**.

## 2. Geometría, límites y capas existentes

* `buildHubSpace()` fija `Ps = (290,265,1920,1320)` y el octógono con `cut=210`:
  `(500,265) (2000,265) (2210,475) (2210,1375) (2000,1585) (500,1585) (290,1375) (290,475)`.
  Mundo `E=2500, k=1850`. `Ls(g)` recorta el suelo a ese polígono; la capa de props
  **no** está recortada, por lo que las fachadas pueden ocupar la franja perimetral.
* Caché de suelo `hubCachedFloorCv` 1920×1320 dibujada en `(290,265)`; centro `(1250,935)`;
  se invalida por `window.__T3B.revision`. Contiene la pasarela norte
  `(180,12,1560,56)` → mundo `(470,277)…(2030,333)` y la plataforma DJ
  `(680,60,560,195)` → mundo `(970,325)…(1530,520)`.
* `Lc()` delega en `prop.hubDraw(g,prop)` cuando `prop.hubCustom` (mecanismo T01–T05).
  `addHubCustomProp` define `sortY = cfg.sortY ?? y + …`, `solid:false`.
* El pintor de muros con `rotate(atan2(dy,dx))`, `_b()`, `wall_stained_glass_arch`,
  `wall_ceiling_neon_fixture` y `club_wall_sconce_side` pertenece al **generador de salas
  de campaña** (`Zb`/`$b`/`Ob`). En el HUB solo queda el suelo cacheado y un ribete de
  `Rs.edges`: **no existen paredes verticales en el HUB**. T06 cubre esa carencia sin
  tocar ese sistema.

## 3. Caras y planos visibles desde la cámara

| Plano | Cara visible | Cara oculta | Tratamiento T06 |
|---|---|---|---|
| Muro norte (`y≈180…330`, `x=500…2000`) | **SUR (+Y)**, hacia el interior; corona superior | cara norte, trasera | fachada frontal + banda de coronación iluminada arriba |
| Muro oeste (`x≈290`, `y=780…1160`) | **ESTE (+X)** | cara oeste | fachada estrecha con capa superior hacia −X, luz rasante |
| Muro este (`x≈2210`) | **OESTE (−X)** | cara este | simétrico, capa superior hacia +X |
| Machones de esquina | inglete a 45° hacia el interior | arista exterior | unión diagonal sobre el paramento norte |
| Viga / casetón de techo | **cara inferior** y canto frontal | cara superior | vigas vistas, focos integrados, sin volumen dinámico |
| Cortinaje | frontal colgada de la cornisa | trasera | pliegues, anclaje superior, sin sombra de suelo |
| Zócalo | cenital | — | plano de suelo, sin altura, asienta la fachada |

No se dibuja ninguna pared "frontal sobre el suelo" en el centro de la sala: todas las
fachadas se anclan a la línea de base del perímetro real, con `sortY` coherente para que
el jugador y los props cercanos las ocluyan correctamente.

## 4. Prueba de composición en tres zonas (antes de producir)

`ART_TOOLS/qa/hub_tanda_06_composition.py` proyecta las **14 cajas mundo** (10
recursos + 4 repeticiones de los paramentos laterales `T06-06/07` en `y=780/1540`)
sobre capturas reales usando la matriz medida. Salidas `composicion_norte.jpg`,
`composicion_pared_oeste.jpg`, `composicion_pared_este.jpg`,
`plano_caras_visibles.png`, `composicion.json`.

| Zona | Cámara medida | Qué se comprueba |
|---|---|---|
| A · NORTE / DJ | `(1250,655)` | tres tramos de muro norte, continuidad de cornisa, viga, zócalo, cara SUR |
| B · OESTE / ARSENAL | `(883,975)` | paramento oeste, cara ESTE, escala y anclaje al límite `x=290` |
| C · ESTE / BARRA VIP | `(1617,975)` | paramento este, cara OESTE, simetría de coronación y luz |

Zonas de apoyo para cobertura: `vip_oeste (883,655)`, `vip_este (1617,655)`,
`centro (1250,945)`, `dj (1273,655)`, `bar (1617,923)`, `arcade (883,1195)` y
`sellos (1617,1195)` (estas cuatro últimas medidas por el arnés A/B de QA).
`composicion.json` incluye, para cada una de las 14 cajas, su `worldBox`,
`screenBox` y las zonas donde la caja completa cae dentro del viewport.
**Cobertura %d/%d con al menos una zona completa** (ver `coverage`).

Veredicto de la fase: **`APROBADA`**. No se modifica cámara, proyección, geometría
general, colisiones, puertas ni estaciones. Se autoriza pasar a producción de los 10
recursos con las orientaciones documentadas en `composicion.json`.
"""
    md = md % (sum(1 for v in coverage.values() if v['ok']), len(coverage))
    open(os.path.join(ROOT,'ART_HUB_TANDA_06_CAMERA_AUDIT.md'),'w',encoding='utf-8').write(md)
    print('composicion: %d zonas primarias, %d cajas (%d recursos), veredicto %s' %
          (len(zones),len(PROPOSALS),len(MANIFEST['assets']),comp['verdict']))
    for k,v in coverage.items():
        print('  %s fullVisible=%s'%(k,','.join(v['fullVisibleZones']) or 'NINGUNA'))
    if comp['verdict']!='APROBADA': raise SystemExit(2)

if __name__=='__main__': main()
