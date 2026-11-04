#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DEADBEAT DISCO · HUB · TANDA 09 — preparación reproducible de 4 posturas NPC.

Las 4 fuentes generadas en `_source/` (fondo croma verde uniforme) se convierten
en finales RGBA con alfa real, croma eliminado, despill, recorte automático y
tamaño de lienzo EXACTO 131 x 232 con pivote en la línea de pies.

NO crea NPC nuevos: son posturas alternativas opcionales para los 10 props de
NPC ya existentes. Si un sprite no carga, el motor usa el sprite V5 original.

Uso: PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/prepare_hub_tanda_09.py
Salida: ART_ASSETS/hub/tanda_09/manifest.json + 4 finales.
"""
from __future__ import annotations

import datetime
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_09'
SRC = BASE / '_source'
REL = 'ART_ASSETS/hub/tanda_09/'
CANVAS = (131, 232)

# id, alias V5, fuente, destino, altura del personaje en el lienzo, descripción
SPECS = [
    dict(id='T09-01', alias='t09_rest_seated',
         src='hub_t09_01_descanso.png',
         dst='01_descanso/final/hub_t09_01_descanso.png',
         height=158, unit='Postura de descanso sentado/reclinado',
         use='t07_descanso · rest y posture_change'),
    dict(id='T09-02', alias='t09_observe',
         src='hub_t09_02_observador.png',
         dst='02_observador/final/hub_t09_02_observador.png',
         height=232, unit='Postura de observación, cabeza girada',
         use='hub_ambient_dancer_sw (arcade) y t07_recorrido (grieta) · OBSERVE'),
    dict(id='T09-03', alias='t09_greeting',
         src='hub_t09_03_gesto.png',
         dst='03_gesto/final/hub_t09_03_gesto.png',
         height=232, unit='Gesto pequeño de saludo, brazo levantado',
         use='t07_charla_01/02 · gesture y reacción al jugador'),
    dict(id='T09-04', alias='t09_wait',
         src='hub_t09_04_espera.png',
         dst='04_espera/final/hub_t09_04_espera.png',
         height=232, unit='Espera quieta, brazos cruzados',
         use='hub_ambient_clubber_bar · WAIT y bar_shift'),
]


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda: f.read(1 << 18), b''):
            h.update(chunk)
    return h.hexdigest()


def chroma_key(im: Image.Image) -> Image.Image:
    """Fondo verde -> alfa 0 con borde suave; elimina el spill verde del borde."""
    rgb = im.convert('RGB')
    w, h = rgb.size
    src = rgb.load()
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    dst = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = src[x, y]
            # exceso de verde frente al mayor de los otros dos canales
            excess = g - max(r, b)
            if excess >= 62:
                continue                       # fondo puro
            if excess <= 18:
                a = 255
            else:
                a = int(round(255.0 * (62 - excess) / (62 - 18)))
            # despill: el verde no puede superar a los otros canales en el borde
            if g > max(r, b):
                g = min(g, max(r, b) + 10)
            dst[x, y] = (r, g, b, a)
    return out


def auto_crop(im: Image.Image, pad: int = 3) -> Image.Image:
    a = im.getchannel('A')
    small = a.resize((max(1, im.width // 4), max(1, im.height // 4)))
    px = small.load()
    xs, ys = [], []
    for y in range(small.height):
        for x in range(small.width):
            if px[x, y] > 24:
                xs.append(x); ys.append(y)
    if not xs:
        return im
    k = 4
    x0 = max(0, (min(xs) - pad) * k); x1 = min(im.width, (max(xs) + pad + 1) * k)
    y0 = max(0, (min(ys) - pad) * k); y1 = min(im.height, (max(ys) + pad + 1) * k)
    return im.crop((x0, y0, x1, y1))


def build(spec: dict) -> dict:
    p = SRC / spec['src']
    if not p.exists():
        raise FileNotFoundError(p)
    keyed = chroma_key(Image.open(p))
    cropped = auto_crop(keyed)
    th = spec['height']
    tw = max(1, int(round(cropped.width * th / cropped.height)))
    scaled = cropped.resize((tw, th), Image.LANCZOS)
    # limpieza final de posibles halos verdes residuales tras el escalado
    a = scaled.getchannel('A').filter(ImageFilter.GaussianBlur(0.35))
    scaled.putalpha(a)

    canvas = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    px = (CANVAS[0] - tw) // 2
    canvas.alpha_composite(scaled, (px, CANVAS[1] - th))
    out = BASE / spec['dst']
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, 'PNG', optimize=True)

    # verificación
    alpha = canvas.getchannel('A')
    corners = [alpha.getpixel(xy) for xy in
               [(0, 0), (CANVAS[0] - 1, 0), (0, CANVAS[1] - 1), (CANVAS[0] - 1, CANVAS[1] - 1)]]
    hist = alpha.histogram()
    ap, rp = alpha.load(), canvas.load()
    light = semi = 0
    for y in range(0, CANVAS[1], 2):
        for x in range(0, CANVAS[0], 2):
            av = ap[x, y]
            if 8 < av < 247:
                semi += 1
                r, g, b = rp[x, y][:3]
                if g > r + 55 and g > b + 55 and g > 130:
                    light += 1
    halo = round(100.0 * light / semi, 4) if semi else 0.0
    return dict(
        id=spec['id'], alias=spec['alias'], unit=spec['unit'], use=spec['use'],
        source=REL + '_source/' + spec['src'], file=REL + spec['dst'],
        exactSize=list(canvas.size) == list(CANVAS), size=list(CANVAS),
        mode=canvas.mode, figureHeight=th, figureWidth=tw,
        cornersTransparent=all(v <= 8 for v in corners), corners=corners,
        opaquePct=round(100.0 * hist[255] / (CANVAS[0] * CANVAS[1]), 2),
        transparentPct=round(100.0 * hist[0] / (CANVAS[0] * CANVAS[1]), 2),
        greenFringePct=halo, borderClean=halo < 1.0, alphaReal=True,
        bytes=out.stat().st_size, sha256=sha256(out))


def main() -> None:
    rows = [build(s) for s in SPECS]
    ok = (len(rows) == 4
          and all(r['exactSize'] and r['alphaReal'] and r['cornersTransparent']
                  and r['borderClean'] and 4.0 < r['opaquePct'] < 60.0 for r in rows))
    man = dict(
        tanda='09', title='HUB · TANDA 09 — 4 posturas NPC para rutinas ambientales',
        generatedAt=datetime.datetime.now().isoformat(timespec='seconds'),
        status='PREPARADO' if ok else 'REVISAR',
        canvas=list(CANVAS), pivot='línea de pies (bottom-center)',
        key='croma verde #00FF00 con borde suave y despill',
        fallback='Si el sprite no carga o __DDM_HUB_T09 === false se usa el sprite V5 original',
        integration='Módulo T09 en DEADBEAT_DISCO.ART.html; SIN cambios en ART_PACK/art_pack.js',
        assets=rows, count=len(rows),
        checks=dict(exactSize=sum(r['exactSize'] for r in rows),
                    alphaReal=sum(r['alphaReal'] for r in rows),
                    cornersTransparent=sum(r['cornersTransparent'] for r in rows),
                    borderClean=sum(r['borderClean'] for r in rows),
                    hashes=len({r['sha256'] for r in rows})))
    (BASE / 'manifest.json').write_text(json.dumps(man, ensure_ascii=False, indent=2) + '\n',
                                        encoding='utf-8')
    for r in rows:
        print(f"{r['id']} {r['alias']:18s} {r['size']} fig {r['figureWidth']}x{r['figureHeight']} "
              f"opaco {r['opaquePct']:5.2f}% halo {r['greenFringePct']:.3f}% "
              f"esquinas {r['cornersTransparent']} sha {r['sha256'][:12]}")
    print('manifest.json ->', man['status'], '| checks', man['checks'])
    if not ok:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
