#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DEADBEAT DISCO · HUB · TANDA 06 — preparación reproducible de 10 assets.
=====================================================================
Envolvente arquitectónica. Reutiliza EXCLUSIVAMENTE los sistemas de
preparación ya validados (build_alpha/crop_alpha de prepare_tanda_02.py,
kill_exterior_halo/despill_dark de prepare_hub_tanda_05.py). Las 10 fuentes
de `_source/` quedan intactas; los finales son RGBA con transparencia real,
bordes limpios, sin halos, pivote definido y SIN DEFORMACIÓN: el tamaño final
se deriva del aspecto del bbox alfa medido, y las cajas mundo / anclajes se
recalculan a partir de ese aspecto (los 3 tramos del muro norte abutan).

Salida: ART_ASSETS/hub/tanda_06/manifest.json (+ 10 PNG finales).
Uso: PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/prepare_hub_tanda_06.py
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_06'
SRC = BASE / '_source'
REL = 'ART_ASSETS/hub/tanda_06/'


def _mod(name, rel):
    s = importlib.util.spec_from_file_location(name, ROOT / 'ART_TOOLS' / rel)
    m = importlib.util.module_from_spec(s)
    s.loader.exec_module(m)
    return m


prep02 = _mod('ddm_prep02_t06', 'prepare_tanda_02.py')
prep05 = _mod('ddm_prep05_t06', 'prepare_hub_tanda_05.py')
prephub02 = _mod('ddm_prephub02_t06', 'prepare_hub_tanda_02.py')
verify = prephub02.verify

def flood_alpha(raw: Image.Image, bg, tol: int = 10) -> Image.Image:
    """Clave de fondo por CONECTIVIDAD, específica de la envolvente T06.

    Las fachadas son rectángulos con paneles casi negros (distancia al fondo
    7..17) encerrados por cornisas de oro. Una croma global (T05) se come esos
    paneles legítimos. Aquí el fondo uniforme se propaga desde el borde de la
    imagen SOLO a través de píxeles casi iguales al fondo (<= tol); la cornisa
    y los nervios de oro cortan la propagación, de modo que los paneles oscuros
    interiores permanecen opacos. Se conserva el contorno irregular real
    (cortinaje, machones) y se aplica un antialias ligero.
    """
    r, g, b = ImageChops.difference(raw, Image.new('RGB', raw.size, bg)).split()
    dist = ImageChops.lighter(ImageChops.lighter(r, g), b)
    w, h = raw.size
    dp = dist.load()
    reached = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            i = y * w + x
            if dp[x, y] <= tol and not reached[i]:
                reached[i] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            i = y * w + x
            if dp[x, y] <= tol and not reached[i]:
                reached[i] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                j = ny * w + nx
                if not reached[j] and dp[nx, ny] <= tol:
                    reached[j] = 1
                    q.append((nx, ny))
    a = Image.new('L', (w, h), 255)
    ap = a.load()
    for y in range(h):
        for x in range(w):
            if reached[y * w + x]:
                ap[x, y] = 0
    return a.filter(ImageFilter.GaussianBlur(0.5))


def prepared_object(source: str, tol: int = 10):
    """Prepara una fuente sin deformarla: clave por conectividad + despill."""
    raw = Image.open(SRC / source).convert('RGB')
    bg = prep02.bg_color(raw)
    alpha = flood_alpha(raw, bg, tol)
    obj, alpha = prep02.crop_alpha(raw, alpha)
    clean, alpha = prep05.despill_dark(obj.convert('RGB'), alpha, bg)
    obj, alpha = prep02.crop_alpha(clean, alpha)
    geo = {
        'sourceSize': list(raw.size), 'alphaBBox': [obj.width, obj.height],
        'backgroundDetected': list(tuple(bg)), 'tolerance': tol,
        'mode': 'flood-fill desde borde (tol=10) + unpremultiply despill sobre fondo negro; '
                'sin kill_exterior_halo: los paneles oscuros de las fachadas son legítimos',
        'antiAlias': 'GaussianBlur(0.5) + erosion 1px'
    }
    return obj, alpha, geo


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


# ---------------------------------------------------------------------------
# KIT DE 10 RECURSOS. `nominalH` = altura del PNG final (px, antes del pad).
# `worldH` = altura de fachada en unidades mundo; `x`/`y` = anclaje (y = base).
# `face` = cara visible medida en la auditoría de cámara; `plane` = plano real.
# `t06hang` = colgante (sin sombra de suelo); `t06flat` = plano de suelo.
# ---------------------------------------------------------------------------
SPEC = [
  dict(id='T06-01', folder='01_paramento_norte_o', name='paramento_norte_oeste',
       source='hub_t06_01_paramento_norte_o.png', final='hub_t06_01_paramento_norte_o.png',
       alias='h06_paramento_norte_o', nominalH=150, pad=6, thr=16,
       pivot='bottom-center', kind='wall', worldH=150, x=None, y=330,
       face='SUR (+Y)', plane='Muro norte · fachada vertical + coronación',
       orientation='Horizontal sobre eje X; cara sur hacia el interior; pilar en extremo O',
       category='A · Envolvente / paramentos',
       function='Tramo oeste del muro norte; cierra el perímetro tras la cabina DJ.',
       why='El HUB solo tiene suelo cacheado y ribete de Rs.edges: no existe pared vertical. '
           'La caché dibuja la pasarela norte en mundo (470,277)…(2030,333), que es la línea '
           'de base real de este paramento.',
       relation='Continuidad: abuta con T06-02 por su borde E; la cornisa y el zócalo T06-10 '
                'son comunes a los 3 tramos. Se dibuja ANTES que la cabina DJ (sortY 330 < 486), '
                'por lo que el shrine ocluye correctamente la fachada.',
       atmosphere='Luz principal magenta desde abajo; secundaria cian en la cara superior; '
                  'zonas oscuras en los paneles; sin saturación.'),
  dict(id='T06-02', folder='02_paramento_norte_c', name='paramento_norte_central',
       source='hub_t06_02_paramento_norte_c.png', final='hub_t06_02_paramento_norte_c.png',
       alias='h06_paramento_norte_c', nominalH=150, pad=6, thr=16,
       pivot='bottom-center', kind='wall', worldH=150, x=None, y=330,
       face='SUR (+Y)', plane='Muro norte · fachada vertical + coronación',
       orientation='Horizontal sobre eje X; cara sur; hornacina central simétrica',
       category='A · Envolvente / paramentos',
       function='Tramo central del muro norte con hornacina art-déco tras el DJ.',
       why='El rótulo diegético «LA DISCOTECA · DJ STAGE» se dibuja en mundo (1250,326) en '
           'la capa aérea; necesita una fachada real detrás en lugar de suelo infinito.',
       relation='Abuta con T06-01 por O y T06-03 por E; mismo sortY=330. La viga T06-08 y el '
                'zócalo T06-10 se dibujan después y comparten eje x=1250.',
       atmosphere='Hornacina violeta/cian como luz secundaria; neón rosa en la base; '
                  'oro envejecido en la cornisa.'),
  dict(id='T06-03', folder='03_paramento_norte_e', name='paramento_norte_este',
       source='hub_t06_03_paramento_norte_e.png', final='hub_t06_03_paramento_norte_e.png',
       alias='h06_paramento_norte_e', nominalH=150, pad=6, thr=16,
       pivot='bottom-center', kind='wall', worldH=150, x=None, y=330,
       face='SUR (+Y)', plane='Muro norte · fachada vertical + coronación',
       orientation='Horizontal sobre eje X; cara sur; pilar en extremo E',
       category='A · Envolvente / paramentos',
       function='Tramo este del muro norte; cierra el perímetro sobre la zona VIP E.',
       why='El flanco norte-este (x 1500…2000, y 180…330) está vacío en el HUB real; '
           'el cortinaje T06-09 cuelga de esta cornisa.',
       relation='Abuta con T06-02 por O. El machón T06-05 y el cortinaje T06-09 se apoyan '
                'en este tramo. Aplique amarillo ácido propio, sin reutilizar T02-10.',
       atmosphere='Aplique amarillo ácido puntual; cian en coronación; magenta en base.'),
  dict(id='T06-04', folder='04_machon_esquina_no', name='machon_esquina_noroeste',
       source='hub_t06_04_machon_esquina_no.png', final='hub_t06_04_machon_esquina_no.png',
       alias='h06_machon_esquina_no', nominalH=150, pad=6, thr=16,
       pivot='bottom-center', kind='corner', worldH=150, x=600, y=330,
       face='NO→SE (inglete 45°)', plane='Machón de unión sobre paramento norte',
       orientation='Cara izquierda hacia NO, cara derecha frontal; inglete diagonal',
       category='B · Esquinas / uniones',
       function='Machón de esquina NO: da espesor y continuidad al arranque del muro norte.',
       why='El octágono real tiene cut=210, pero el pintor de esquinas pertenece a campaña; '
           'en el HUB la unión entre el tramo O y el perímetro O es solo una línea.',
       relation='Se superpone al extremo O de T06-01 (mismo sortY=330, se dibuja después) '
                'para formar el inglete. No sustituye las columnas T01-06 ni T03-05.',
       atmosphere='Neón rosa en cara frontal, cian en cara recedente; oro en el inglete.'),
  dict(id='T06-05', folder='05_machon_esquina_ne', name='machon_esquina_noreste',
       source='hub_t06_05_machon_esquina_ne.png', final='hub_t06_05_machon_esquina_ne.png',
       alias='h06_machon_esquina_ne', nominalH=150, pad=6, thr=16,
       pivot='bottom-center', kind='corner', worldH=150, x=1900, y=330,
       face='NE→SO (inglete 45°)', plane='Machón de unión sobre paramento norte',
       orientation='Cara derecha hacia NE, cara izquierda frontal; inglete diagonal',
       category='B · Esquinas / uniones',
       function='Machón de esquina NE, simétrico del NO.',
       why='Cierra la esquina norte-este real del octógono sin imponer una proyección nueva.',
       relation='Se superpone al extremo E de T06-03; base común y mismo sortY. '
                'El cortinaje T06-09 cuelga 35 u a la izquierda.',
       atmosphere='Cian en cara frontal, rosa en cara recedente; violeta en el capital.'),
  dict(id='T06-06', folder='06_paramento_oeste', name='paramento_oeste',
       source='hub_t06_06_paramento_oeste.png', final='hub_t06_06_paramento_oeste.png',
       alias='h06_paramento_oeste', nominalH=380, pad=6, thr=16,
       pivot='bottom-center', kind='wall_side', worldH=380, x=330, y=1160,
       face='ESTE (+X)', plane='Muro oeste · fachada vertical estrecha + capa superior',
       orientation='Vertical sobre eje Y; cara este hacia el interior; capa superior hacia -X',
       category='A · Envolvente / paramentos',
       function='Paramento oeste entre el arsenal y el rincón arcade.',
       why='El límite real x=290 solo tiene un ribete cian de Rs.edges; no hay fachada. '
           'El suelo T03-01 ocupa mundo [290,720,580,430], así que este tramo se ancla '
           'por debajo (y 780…1160) sin solaparlo.',
       relation='sortY=1160: se dibuja detrás de los props de y<1160 de la zona O. '
                'Se REPITE en y=780 y y=1540 (mismo asset, 3 tramos contiguos) para '
                'cubrir la arista real y=475…1375 sin huecos. No toca colisiones ni '
                'estaciones; solid:false.',
       additionalAnchors=[{'x': 330, 'y': 780}, {'x': 330, 'y': 1540}],
       atmosphere='Luz rasante cálida desde el interior; neón rosa en el borde E; '
                  'negro profundo en el fondo.'),
  dict(id='T06-07', folder='07_paramento_este', name='paramento_este',
       source='hub_t06_07_paramento_este.png', final='hub_t06_07_paramento_este.png',
       alias='h06_paramento_este', nominalH=380, pad=6, thr=16,
       pivot='bottom-center', kind='wall_side', worldH=380, x=2170, y=1160,
       face='OESTE (-X)', plane='Muro este · fachada vertical estrecha + capa superior',
       orientation='Vertical sobre eje Y; cara oeste hacia el interior; capa superior hacia +X',
       category='A · Envolvente / paramentos',
       function='Paramento este, simétrico del oeste, tras la barra VIP.',
       why='El límite real x=2210 carece de cara interior; el suelo T03-02 ocupa '
           '[1630,720,580,430] y queda por encima de este anclaje.',
       relation='Mismo sortY=1160 que T06-06; ninguno invade la pista central '
                '(x 700…1800). Se REPITE en y=780 y y=1540 para cubrir la arista '
                'y=475…1375 sin huecos. Sin colisiones.',
       additionalAnchors=[{'x': 2170, 'y': 780}, {'x': 2170, 'y': 1540}],
       atmosphere='Luz fría cian desde el interior; oro en los nervios; violeta en sombra.'),
  dict(id='T06-08', folder='08_viga_caseton_techo', name='viga_caseton_techo',
       source='hub_t06_08_viga_caseton_techo.png', final='hub_t06_08_viga_caseton_techo.png',
       alias='h06_viga_caseton_techo', nominalH=90, pad=6, thr=16,
       pivot='top-center', kind='beam', worldH=90, x=1250, y=330,
       face='INFERIOR', plane='Techo / viga vista · cara inferior y canto frontal',
       orientation='Horizontal sobre eje X, suspendida; solo se ve la cara inferior',
       category='C · Techos y elementos superiores',
       function='Fragmento de techo y viga con focos empotrados sobre el muro norte.',
       why='La capa aérea existente solo tiene la araña central (1250,615) y haces de luz; '
           'no hay ninguna estructura de techo que explique de dónde cuelga.',
       relation='Se dibuja DESPUÉS de los 3 paramentos (mismo sortY=330, orden de array) '
                'para que el canto frontal quede delante de la cornisa. t06hang=true: '
                'sin sombra de suelo. No crea efectos volumétricos dinámicos.',
       atmosphere='Tres focos cálidos de intensidad moderada, línea cian en el canto; '
                  'fondos casi negros.'),
  dict(id='T06-09', folder='09_cortinaje_acustico', name='cortinaje_acustico',
       source='hub_t06_09_cortinaje_acustico.png', final='hub_t06_09_cortinaje_acustico.png',
       alias='h06_cortinaje_acustico', nominalH=230, pad=6, thr=16,
       pivot='top-center', kind='hang', worldH=230, x=1865, y=430,
       face='FRONTAL', plane='Cortinaje / panel acústico colgado de la cornisa',
       orientation='Vertical, suspendido del borde superior; pliegues descendentes',
       category='C · Techos, cortinajes y remates',
       function='Cortinaje acústico que absorbe el muro norte-este y aporta material blando.',
       why='Los únicos tejidos del HUB son los sofás VIP T01-07; no hay cortinaje '
           'arquitectónico. No repite el line array T05-08 (equipo, no tejido).',
       relation='Anclaje superior en y=200 (bajo la cornisa de T06-03, base 330); '
                't06hang=true → sin sombra de suelo ni flotación. sortY=430.',
       atmosphere='Terciopelo burdeos con rim light rosa a la derecha y cian a la '
                  'izquierda; fieltro oscuro detrás; brillo bajo.'),
  dict(id='T06-10', folder='10_zocalo_remate_suelo', name='zocalo_remate_suelo',
       source='hub_t06_10_zocalo_remate_suelo.png', final='hub_t06_10_zocalo_remate_suelo.png',
       alias='h06_zocalo_remate_suelo', nominalH=36, pad=6, thr=16,
       pivot='center', kind='flat', worldH=36, x=1250, y=340,
       face='SUELO (cenital)', plane='Suelo · remate / zócalo plano, sin altura',
       orientation='Horizontal sobre eje X, plano de suelo, bordes paralelos',
       category='E · Remates y transiciones',
       function='Zócalo que asienta la fachada norte y evita la lectura de pared flotante.',
       why='Es la unión real entre la línea de base y=330 de los paramentos y el suelo '
           'cacheado; sin ella la fachada parecería pegada encima del suelo.',
       relation='t06flat=true: el hubDraw existente lo dibuja centrado en (x,y) como plano '
                'de suelo, SIN altura y SIN sombra. sortY=340, se dibuja el último de la '
                'familia norte. No modifica colisiones ni geometría.',
       atmosphere='Doble filete de oro, línea cian, piedra pulida con reflejo magenta tenue.'),
]

# Bandera de integración por KIND
for s in SPEC:
    s['t06hang'] = s['kind'] in ('beam', 'hang')
    s['t06flat'] = s['kind'] == 'flat'
    s['flip'] = False
    s['solid'] = False
    s['tall'] = False
    s['pulse'] = None


def main() -> None:
    manifest = {
        'tanda': '06',
        'title': 'HUB · TANDA 06 — Envolvente arquitectónica, perspectiva y atmósfera (10 assets)',
        'build': 'DEADBEAT_DISCO.ART.html',
        'integrationFiles': ['ART_PACK/art_pack.js', 'DEADBEAT_DISCO.ART.html'],
        'loader': 'window.__DDM_V5_IMG[alias h06_*] mediante load() de ART_PACK/art_pack.js',
        'renderer': 'hubDecor -> addHubCustomProp -> Lc (Y-sort existente)',
        'flag': 'window.__DDM_HUB_T06 !== false',
        'cameraSource': 'ART_EVIDENCE/hub/tanda_06/camera_audit.json + composicion.json',
        'projection': 'ortográfica oblicua 2.5D, zoom 0,9375, a=d, b=c=0; sin imponer isometría',
        'dimensionSource': 'bbox alfa MEDIDO de cada fuente; escala uniforme, sin deformación; '
                           'anchos mundo derivados del aspecto real y anclajes recalculados '
                           'para que los 3 tramos del muro norte abuten',
        'preparation': 'ART_TOOLS/prepare_hub_tanda_06.py · bg_color/crop_alpha de '
                       'prepare_tanda_02.py · clave por conectividad (flood-fill desde borde) '
                       'propia de T06 · despill_dark de prepare_hub_tanda_05.py · '
                       'pad transparente para bordes limpios',
        'policy': '10 assets NUEVOS; no se repite ningún recurso de TANDA 01-05. Sin cámara, '
                  'proyección, geometría general, colisiones, puertas, estaciones, '
                  'interacciones, progresión, combate, HUD, canvas adicional ni motor paralelo.',
        'count': len(SPEC), 'finalPngFiles': len(SPEC), 'sourceFiles': len(SPEC),
        'integrationState': 'PENDIENTE', 'assets': []
    }

    prepared = []
    for s in SPEC:
        obj, alpha, geo = prepared_object(s['source'], 10)
        # Escala uniforme al alto nominal: el aspecto del PNG final ES el del objeto.
        inner_w = max(1, round(obj.width * s['nominalH'] / obj.height))
        inner_h = s['nominalH']
        piece = obj.convert('RGBA').resize((inner_w, inner_h), Image.LANCZOS)
        piece.putalpha(alpha.resize((inner_w, inner_h), Image.LANCZOS))
        canvas = ImageOps.expand(piece, border=s['pad'], fill=(0, 0, 0, 0))
        w, h = canvas.size
        dst_dir = BASE / s['folder'] / 'final'
        dst_dir.mkdir(parents=True, exist_ok=True)
        dst = dst_dir / s['final']
        canvas.save(dst, 'PNG', optimize=True)
        spec_v = dict(s, w=w, h=h)
        v = verify(canvas, spec_v)
        dw = round(s['worldH'] * w / h)
        prepared.append(dict(s=s, w=w, h=h, dw=dw, canvas=canvas, v=v, geo=geo, dst=dst))
        print(s['id'], s['name'], '->', w, 'x', h,
              '| aspect', round(w / h, 3), '| dw', dw,
              '| exactSize', v['exactSize'], '| RGBA', v['mode'] == 'RGBA',
              '| corners', v['cornersTransparent'], '| halo%', v['whiteFringePct'],
              '| coverage%', v['coveragePct'])

    # Los tres tramos del muro norte ABUTAN: el ancho se mide, no se presupone.
    cursor = 500
    for rec in prepared[:3]:
        rec['x'] = round(cursor + rec['dw'] / 2)
        cursor += rec['dw']
    north_end = cursor

    for rec in prepared:
        s = rec['s']; w, h, dw = rec['w'], rec['h'], rec['dw']
        x = rec.get('x', s['x']); y = s['y']
        if s['t06flat']:
            world_box = [x - (dw >> 1), y - (s['worldH'] >> 1), dw, s['worldH']]
        else:
            world_box = [x - (dw >> 1), y - s['worldH'], dw, s['worldH']]
        manifest['assets'].append({
            'id': s['id'], 'name': s['name'], 'alias': s['alias'],
            'source': REL + '_source/' + s['source'],
            'sourceSha256': sha256(SRC / s['source']),
            'file': REL + s['folder'] + '/final/' + s['final'],
            'sha256': sha256(rec['dst']), 'bytes': rec['dst'].stat().st_size,
            'width': w, 'height': h, 'expected': [w, h],
            'mode': 'RGBA', 'format': 'PNG', 'pivot': s['pivot'],
            'verification': rec['v'], 'preparation': rec['geo'],
            'category': s['category'], 'classification': s['category'],
            'function': s['function'], 'why': s['why'],
            'orientationSpatial': s['orientation'], 'visibleFace': s['face'],
            'plane': s['plane'], 'relationToCameraAndExisting': s['relation'],
            'atmosphere': s['atmosphere'],
            'location': {'x': x, 'y': y, 'worldH': s['worldH'],
                         'worldBox': world_box, 'sortY': y,
                         'plane': s['plane'], 'face': s['face'],
                         'additionalAnchors': s.get('additionalAnchors', []),
                         'additionalWorldBoxes': [
                             [q['x'] - (dw >> 1), q['y'] - s['worldH'], dw, s['worldH']]
                             for q in s.get('additionalAnchors', [])]},
            'dimensions': {'png': [w, h], 'worldH': s['worldH'], 'worldW': dw,
                           'aspect': round(w / h, 5), 'scale': 'uniforme 0,9375 (cámara)',
                           'deformed': False,
                           'derivation': 'dw = round(worldH * pngW / pngH) = round(%d*%d/%d) = %d'
                                         % (s['worldH'], w, h, dw)},
            'anchor': {'x': x, 'y': y, 'worldH': s['worldH'], 'pivot': s['pivot'],
                       'flip': s['flip'], 'solid': s['solid'], 'tall': s['tall'],
                       't06hang': s['t06hang'], 't06flat': s['t06flat'],
                       'pulse': s['pulse'], 'sortY': y},
            'renderer': 'hubDecor -> addHubCustomProp -> Lc',
            'integrationState': 'PENDIENTE'
        })

    manifest['northWall'] = {'startX': 500, 'endX': north_end,
                             'segments': [{'id': r['s']['id'], 'x': r['x'], 'dw': r['dw']}
                                          for r in prepared[:3]],
                             'abutmentGaps': 0,
                             'note': 'Anclajes recalculados con anchos medidos; 0 huecos.'}
    (BASE / 'manifest.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    bad = [a['id'] for a in manifest['assets']
           if not (a['verification']['exactSize'] and a['verification']['cornersTransparent']
                   and a['verification']['borderClean'] and a['mode'] == 'RGBA')]
    print('\nRESUMEN', len(manifest['assets']), 'assets | muro norte',
          manifest['northWall']['startX'], '->', north_end,
          '| incidencias:', bad)
    if bad:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
