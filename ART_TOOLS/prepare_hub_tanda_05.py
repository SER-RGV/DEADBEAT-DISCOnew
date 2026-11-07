#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DEADBEAT DISCO · HUB · TANDA 05 — preparación reproducible de 10 assets.

Reutiliza build_alpha()/crop_alpha() de ART_TOOLS/prepare_tanda_02.py y
place_contain()/verify() de ART_TOOLS/prepare_hub_tanda_02.py, con un
despill adaptado a fuentes sobre fondo NEGRO (las fuentes de T03 venían sobre
fondo marfil). Las 10 fuentes de `_source/` quedan intactas; los finales se
escriben en `<carpeta>/final/` con transparencia real, pivote registrado y
tamaño exacto. No se deforma ningún recurso: siempre `contain`.

Uso: PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/prepare_hub_tanda_05.py
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_05'
SRC = BASE / '_source'
REL = 'ART_ASSETS/hub/tanda_05/'

_spec = importlib.util.spec_from_file_location('prep02', ROOT / 'ART_TOOLS' / 'prepare_tanda_02.py')
prep02 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(prep02)
_spec2 = importlib.util.spec_from_file_location('prephub02', ROOT / 'ART_TOOLS' / 'prepare_hub_tanda_02.py')
prephub02 = importlib.util.module_from_spec(_spec2)
_spec2.loader.exec_module(prephub02)

place_contain = prephub02.place_contain
verify = prephub02.verify


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def kill_exterior_halo(rgb: Image.Image, alpha: Image.Image, bg):
    """Borra SOLO los píxeles opacos parecidos al fondo y conectados al borde.

    Las fuentes tienen un fondo negro casi uniforme con un leve degradado; una
    parte puede superar el umbral de croma. Se propaga desde el exterior para
    no comerse los negros INTERIORES legítimos (laca, pantalla, cristal).
    """
    w, h = rgb.size
    px, ap = rgb.load(), alpha.load()
    bg = tuple(bg)
    kind = bytearray(w * h)  # 1 = fondo-like y opaco
    for y in range(h):
        for x in range(w):
            if ap[x, y] == 0:
                continue
            r, g, b = px[x, y]
            d = max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2]))
            if max(r, g, b) < 96 and d < 62:
                kind[y * w + x] = 1
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            i = y * w + x
            if kind[i] and not seen[i]:
                seen[i] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            i = y * w + x
            if kind[i] and not seen[i]:
                seen[i] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                j = ny * w + nx
                if kind[j] and not seen[j]:
                    seen[j] = 1
                    q.append((nx, ny))
    removed = 0
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if seen[i] and kind[i] == 1:
                ap[x, y] = 0
                px[x, y] = (8, 8, 14)
                removed += 1
    return rgb, alpha, removed


def despill_dark(rgb: Image.Image, alpha: Image.Image, bg):
    """Des-premultipica el borde contra el fondo NEGRO y erosiona 1 px.

    A diferencia de T03 NO se eliminan los píxeles claros: aquí los blancos
    son neón y reflejos legítimos, no sangrado de un fondo marfil.
    """
    a = alpha.filter(ImageFilter.MinFilter(3))
    a = a.filter(ImageFilter.GaussianBlur(0.4))
    a = a.point(lambda v: 0 if v < 24 else v)
    clean = rgb.copy()
    cp, ap = clean.load(), a.load()
    bg = tuple(bg)
    for y in range(clean.height):
        for x in range(clean.width):
            al = ap[x, y]
            if al == 0:
                cp[x, y] = (8, 8, 14)
                continue
            r, g, b = cp[x, y]
            if al < 250:
                f = al / 255.0
                cp[x, y] = tuple(
                    max(0, min(255, int((c - (1.0 - f) * bg[i]) / f)))
                    for i, c in enumerate((r, g, b)))
            else:
                cp[x, y] = (r, g, b)
    return clean, a


def prepared_object(source: str, thr: int):
    raw = Image.open(SRC / source).convert('RGB')
    src_size = list(raw.size)
    alpha, bg = prep02.build_alpha(raw, thr)
    obj, alpha = prep02.crop_alpha(raw, alpha)
    clean, alpha, halo = kill_exterior_halo(obj.convert('RGB'), alpha, bg)
    clean, alpha = despill_dark(clean, alpha, bg)
    obj, alpha = prep02.crop_alpha(clean, alpha)
    geo = {'sourceSize': src_size, 'alphaBBox': [obj.width, obj.height],
           'backgroundDetected': list(bg), 'threshold': thr,
           'haloPixelsRemoved': halo,
           'mode': 'contain + exterior dark-halo flood-fill + unpremultiply despill (dark bg)'}
    return obj, alpha, geo


# ---------------------------------------------------------------------------
# 10 recursos. Las coordenadas mundo y la altura `worldH` están derivadas de
# la auditoría del HUB real (ART_EVIDENCE/hub/tanda_05/audit_runtime.json) y
# de las cajas de props/estaciones medidas en T01-T04. No se inventan slots.
# `alias` = clave V5 h05_* que registra ART_PACK/art_pack.js con load().
# ---------------------------------------------------------------------------
SPEC = [
    dict(id='T05-01', folder='01_garra_del_limbo', name='garra_del_limbo',
         source='hub_t05_01_garra_del_limbo.png', final='hub_t05_01_garra_del_limbo.png',
         alias='h05_garra_del_limbo', w=147, h=280, thr=16, pivot='bottom-center',
         x=455, y=1310, worldH=180, flip=False, pulse=None,
         category='A · Máquinas y entretenimiento', interactiveClass='Funcional (sin lógica nueva)',
         classification='Máquina de premios / entretenimiento',
         function='Máquina de garra con peluches fantasma; da identidad al cuadrante SW.',
         why='La auditoría visual muestra el perímetro suroeste (x 300-520, y 1150-1350) '
             'completamente vacío salvo el banco de recreativas en (655,1210). '
             'Es una máquina distinta del shrine de T02-01 (batería de 3 cabinas) y '
             'de la expendedora T02-04.',
         dimensionSource='Altura mundo 150 u derivada de hub_decor_cooler_w (h=104) y '
                         'hub_decor_vending_e (h=118); ancho 220x280 conserve la '
                         'proporción del objeto sin deformación -> dw=118 u.'),
    dict(id='T05-02', folder='02_banco_del_olvido', name='banco_del_olvido',
         source='hub_t05_02_banco_del_olvido.png', final='hub_t05_02_banco_del_olvido.png',
         alias='h05_banco_del_olvido', w=133, h=240, thr=16, pivot='bottom-center',
         x=2040, y=1160, worldH=150, flip=False, pulse=None,
         category='A/D · Máquinas y terminales', interactiveClass='Funcional (sin lógica nueva)',
         classification='Terminal dispensador de fichas del universo del juego',
         function='Terminal de fichas con mano esquelética; cierra el perímetro SE.',
         why='El cuadrante sureste (x 1980-2100, y 1000-1200) está vacío: el espejo de '
             'sellos está en (1845,1210) y la expendedora en (2048,692). No repite '
             'ningún terminal de T01-T04.',
         dimensionSource='Altura mundo 132 u entre cooler (104) y vending (118/140); '
                         '160x240 -> dw=88 u, sin deformación.'),
    dict(id='T05-03', folder='03_subwoofer_stack', name='subwoofer_stack',
         source='hub_t05_03_subwoofer_stack.png', final='hub_t05_03_subwoofer_stack.png',
         alias='h05_subwoofer_stack', w=253, h=160, thr=16, pivot='bottom-center',
         x=905, y=430, worldH=120, flip=False, pulse=None,
         category='B · Equipamiento de discoteca', interactiveClass='Decorativo / equipamiento',
         classification='Torre de subwoofers apilados',
         function='Cuerpo grave junto al flanco izquierdo de la cabina DJ.',
         why='El flanco norte izquierdo (x 800-1010, y 300-440) solo tiene el cartel '
             'narrativo y el sofá VIP; las torres de T01-06 son columnas estrechas '
             '(club_speaker_tower_prop). Falta un equipo de graves de gran volumen.',
         dimensionSource='Altura mundo 120 u comparable a club_speaker_tower_prop (h=122); '
                         '264x160 -> dw=198 u, apilado horizontal sin deformar.'),
    dict(id='T05-04', folder='04_video_wall', name='video_wall',
         source='hub_t05_04_video_wall.png', final='hub_t05_04_video_wall.png',
         alias='h05_video_wall', w=249, h=144, thr=16, pivot='top-center',
         x=1560, y=360, worldH=110, flip=False, pulse=0.7,
         category='B/C · Equipamiento audiovisual y decoración', interactiveClass='Ambiental animado',
         classification='Panel de videowall LED con pulso de brillo',
         function='Pantalla modular sobre el muro norte; primera pantalla del HUB.',
         why='El muro norte a la derecha del DJ (x 1450-1680, y 230-370) está vacío; '
             'no existe ninguna pantalla ni panel AV en el HUB (solo letreros diegéticos).',
         dimensionSource='Altura mundo 110 u; 288x144 -> dw=220 u. El pulso usa '
                         'globalAlpha del ctx existente, sin sistema de animación nuevo.'),
    dict(id='T05-05', folder='05_consola_aux', name='consola_auxiliar',
         source='hub_t05_05_consola_aux.png', final='hub_t05_05_consola_aux.png',
         alias='h05_consola_aux', w=150, h=140, thr=16, pivot='bottom-center',
         x=1560, y=520, worldH=70, flip=True, pulse=None,
         category='B · Equipamiento de discoteca', interactiveClass='Funcional / decorativo',
         classification='Consola auxiliar de mezcla (sidecar)',
         function='Equipo de control junto al flanco derecho de la cabina.',
         why='La cabina DJ de T01-04 es un único bloque; a su derecha (x 1500-1630, '
             'y 450-520) no hay equipo auxiliar. Complementa, no sustituye, el shrine.',
         dimensionSource='Altura mundo 70 u (mesa baja, por debajo del sofá VIP h=62 '
                         'pero con ancho mayor); 240x140 -> dw=120 u.'),
    dict(id='T05-06', folder='06_neon_ultimo_trago', name='neon_ultimo_trago',
         source='hub_t05_06_neon_ultimo_trago.png', final='hub_t05_06_neon_ultimo_trago.png',
         alias='h05_neon_ultimo_trago', w=201, h=192, thr=16, pivot='top-center',
         x=1910, y=640, worldH=96, flip=False, pulse=1.4,
         category='C · Decoración ambiental', interactiveClass='Ambiental animado',
         classification='Neón colgante de la barra con pulso',
         function='Hito vertical luminoso sobre la barra «El Último Trago».',
         why='La barra (1910,845) tiene mostrador y botellas pero ningún rótulo '
             'colgante; la lámpara T01-08 es una araña central y T02-10 son apliques '
             'laterales. El neón no repite las 6 placas de T04.',
         dimensionSource='Altura mundo 96 u; 288x192 -> dw=144 u, mismo ancho que '
                         'las placas de T04 pero silueta y capa distintas.'),
    dict(id='T05-07', folder='07_cartel_ultima_sesion', name='cartel_ultima_sesion',
         source='hub_t05_07_cartel_ultima_sesion.png', final='hub_t05_07_cartel_ultima_sesion.png',
         alias='h05_cartel_ultima_sesion', w=196, h=130, thr=16, pivot='center', pad=8,
         x=600, y=760, worldH=120, flip=False, pulse=None,
         category='C · Decoración ambiental / objeto narrativo', interactiveClass='Decorativo narrativo',
         classification='Cartel de la última sesión (humor negro)',
         function='Objeto narrativo en el muro oeste, entre arsenal y refrigerador.',
         why='El muro oeste (x 510-610, y 640-760) solo tiene el mostrador del arsenal '
             'más abajo; falta un objeto de pared con historia. No repite el tablón '
             'de trofeos T01-10 ni la señalética T04.',
         dimensionSource='Altura mundo 120 u; 180x240 -> dw=90 u. Glifos abstractos '
                         'en lugar de texto para evitar letras generadas mal.'),
    dict(id='T05-08', folder='08_line_array', name='line_array_colgante',
         source='hub_t05_08_line_array.png', final='hub_t05_08_line_array.png',
         alias='h05_line_array', w=68, h=178, thr=16, pivot='top-center',
         x=1250, y=720, worldH=170, flip=False, pulse=None,
         category='B/C · Equipamiento / elemento colgante', interactiveClass='Arquitectónico / ambiental',
         classification='Cluster de altavoces colgante (line array)',
         function='Rigging aéreo sobre el corredor central de la pista.',
         why='El corredor central entre la cabina y el medallón (x 1130-1370, y 610-700) '
             'solo tiene haces de luz; falta equipamiento suspendido. Es un cluster '
             'volado, distinto de las torres de suelo T01-06 y de la araña T01-08.',
         dimensionSource='Altura mundo 90 u; 320x120 -> dw=240 u, centrado sobre '
                         'el eje x=1250 del HUB.'),
    dict(id='T05-09', folder='09_cordon_vip', name='cordon_vip',
         source='hub_t05_09_cordon_vip.png', final='hub_t05_09_cordon_vip.png',
         alias='h05_cordon_vip', w=128, h=120, thr=16, pivot='bottom-center',
         x=930, y=560, worldH=80, flip=False, pulse=None,
         category='C/D · Decoración y circulación', interactiveClass='Arquitectónico (sin collider)',
         classification='Cordón VIP con postes cráneo',
         function='Delimita el acceso a la zona VIP oeste sin bloquear el paso.',
         why='La zona VIP oeste tiene sofá (785,545) y alcoba T03-07, pero ningún '
             'límite visual de circulación. solid:false -> 0 cambios de hitbox.',
         dimensionSource='Altura mundo 60 u; 260x120 -> dw=130 u. Caja x 865..995, '
                         'y 500..560, sin solapar sofá ni placa A de T04.'),
    dict(id='T05-10', folder='10_confesionario', name='confesionario_neon',
         source='hub_t05_10_confesionario.png', final='hub_t05_10_confesionario.png',
         alias='h05_confesionario', w=158, h=260, thr=16, pivot='bottom-center',
         x=1715, y=700, worldH=150, flip=False, pulse=None,
         category='A/D · Dispositivo del universo / interactividad potencial', interactiveClass='Funcional (sin lógica nueva)',
         classification='Confesionario de quejas al Más Allá',
         function='Terminal narrativa en la zona VIP este; humor negro.',
         why='La zona VIP este (x 1660-1780, y 550-690) está vacía entre el sofá '
             '(1715,545) y la placa E (1718,781). Aporta un dispositivo propio del '
             'universo sin repetir el espejo de sellos ni la barra.',
         dimensionSource='Altura mundo 140 u; 190x260 -> dw=102 u.'),
]


def main() -> None:
    manifest = {
        'tanda': '05',
        'title': 'HUB · TANDA 05 — Equipamiento, vida ambiental e interactividad (10 assets)',
        'build': 'DEADBEAT_DISCO.ART.html',
        'integrationFiles': ['ART_PACK/art_pack.js', 'DEADBEAT_DISCO.ART.html'],
        'loader': 'window.__DDM_V5_IMG[alias h05_*] mediante load() de ART_PACK/art_pack.js',
        'renderer': 'hubDecor -> addHubCustomProp -> Lc (Y-sort existente)',
        'flag': 'window.__DDM_HUB_T05 !== false',
        'dimensionSource': 'ART_EVIDENCE/hub/tanda_05/audit_runtime.json + cajas de props '
                           'y estaciones medidas en TANDA 01-04',
        'preparation': 'ART_TOOLS/prepare_hub_tanda_05.py · build_alpha/crop_alpha de '
                       'prepare_tanda_02.py · contain + pivote · despill para fondo negro',
        'policy': '10 assets NUEVOS; no se repite ningún recurso de TANDA 01-04. '
                  'Sin geometría, colisiones, estaciones, interacciones, progresión, '
                  'combate, inventario, economía, guardado, música ni DJ nuevos.',
        'count': len(SPEC),
        'finalPngFiles': len(SPEC),
        'sourceFiles': len(SPEC),
        'interactivity': 'Ningún sistema de interacción nuevo. T05-01/02/05/10 son '
                         'FUNCIONALES (apariencia de uso) y su interacción real se '
                         'documenta como PROPUESTA, no implementada. T05-04/06 usan '
                         'un pulso de globalAlpha del contexto existente.',
        'assets': [],
    }
    for s in SPEC:
        obj, alpha, geo = prepared_object(s['source'], s['thr'])
        pad = s.get('pad', 0)
        inner_w, inner_h = s['w'] - 2 * pad, s['h'] - 2 * pad
        canvas, placement = place_contain(obj.convert('RGBA'), alpha, inner_w, inner_h, s['pivot'])
        if pad:
            # Margen transparente: un cartel enmarcado es rectangular, pero se
            # exige borde limpio y esquinas transparentes como en T01-T04.
            canvas = ImageOps.expand(canvas, border=pad, fill=(0, 0, 0, 0))
            placement = dict(placement, padding=pad, finalCanvas=[s['w'], s['h']])
        dst_dir = BASE / s['folder'] / 'final'
        dst_dir.mkdir(parents=True, exist_ok=True)
        dst = dst_dir / s['final']
        canvas.save(dst, 'PNG', optimize=True)
        v = verify(canvas, s)
        dw = round(s['worldH'] * s['w'] / s['h'])
        world_box = [s['x'] - (dw >> 1), s['y'] - s['worldH'], dw, s['worldH']]
        manifest['assets'].append({
            'id': s['id'], 'name': s['name'], 'alias': s['alias'],
            'source': REL + '_source/' + s['source'],
            'sourceSha256': sha256(SRC / s['source']),
            'file': REL + s['folder'] + '/final/' + s['final'],
            'sha256': sha256(dst), 'bytes': dst.stat().st_size,
            'width': s['w'], 'height': s['h'], 'expected': [s['w'], s['h']],
            'mode': 'RGBA', 'format': 'PNG', 'pivot': s['pivot'],
            'placement': placement, 'preparation': geo, 'verification': v,
            'category': s['category'], 'interactiveClass': s['interactiveClass'],
            'classification': s['classification'],
            'function': s['function'], 'why': s['why'],
            'dimensionSource':
                'Altura mundo %d u; PNG %dx%d con el aspecto EXACTO del bbox alfa '
                'recortado (sin padding, sin deformación); dw=%d u = '
                'round(%d*%d/%d); pivote %s.' %
                (s['worldH'], s['w'], s['h'], dw, s['worldH'], s['w'], s['h'], s['pivot']),
            'dimensionRationale': s['dimensionSource'],
            'anchor': {'x': s['x'], 'y': s['y'], 'worldH': s['worldH'],
                       'flip': s['flip'], 'pulse': s['pulse'],
                       'solid': False, 'tall': False},
            'worldBox': world_box,
            'renderer': 'hubDecor -> addHubCustomProp -> Lc',
            'integrationState': 'PENDIENTE'
        })
        print(s['id'], s['name'], '->', s['w'], 'x', s['h'],
              '| exactSize', v['exactSize'], '| RGBA', v['mode'] == 'RGBA',
              '| corners', v['cornersTransparent'], '| halo%', v['whiteFringePct'],
              '| coverage%', v['coveragePct'], '| worldBox', world_box)
    (BASE / 'manifest.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    bad = [a['id'] for a in manifest['assets']
           if not (a['verification']['exactSize'] and a['verification']['cornersTransparent']
                   and a['verification']['borderClean'] and a['verification']['mode'] == 'RGBA')]
    print('\nRESUMEN', len(manifest['assets']), 'assets | incidencias:', bad)


if __name__ == '__main__':
    main()
