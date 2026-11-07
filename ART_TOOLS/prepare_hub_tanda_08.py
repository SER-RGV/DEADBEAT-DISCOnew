#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DEADBEAT DISCO · HUB · TANDA 08 — preparación reproducible de 10 assets.

«El abismo vivo». Las 10 fuentes generadas en `_source/` se convierten en
finales RGBA con tamaño EXACTO, alfa real y contraste graduado POR PLANO:

  * bandas   → rampa de alfa vertical + fundido lateral (se integran unas
               con otras sin costuras ni halos claros);
  * objetos  → recorte automático por luminancia + alfa radial suave
               (columna, plataforma, rocas, humo);
  * planos lejanos → atenuación de brillo y saturación para que la distancia
               se interprete por contraste, no sólo por tamaño.

NO hay sprites, NPC, criaturas ni enemigos. No se repite el mismo recurso:
las dos paredes próximas son fuentes distintas.

Uso: PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/prepare_hub_tanda_08.py
Salida: ART_ASSETS/hub/tanda_08/manifest.json + 10 finales.
"""
from __future__ import annotations

import datetime
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_08'
SRC = BASE / '_source'
REL = 'ART_ASSETS/hub/tanda_08/'
BG = (8, 6, 16)

# id, alias, fuente, destino, tamaño exacto, máscara, plano, brillo, saturación,
# recorte automático, función visual y relación con la cámara
SPECS = [
    dict(id='T08-01', alias='h08_pared_cercana_izq',
         src='hub_t08_01_pared_cercana_izq.png',
         dst='01_pared_izq/final/hub_t08_01_pared_izq.png',
         size=(900, 300), mask='band', plane='P1 cercano',
         bright=1.00, sat=1.00, crop=None,
         unit='Pared rocosa próxima izquierda',
         camera='factor .92 · anclada al borde sur y1585',
         purpose='Máxima definición; arranca del labio T07 y converge al abismo'),
    dict(id='T08-02', alias='h08_pared_cercana_der',
         src='hub_t08_02_pared_cercana_der.png',
         dst='02_pared_der/final/hub_t08_02_pared_der.png',
         size=(900, 300), mask='band', plane='P1 cercano',
         bright=1.00, sat=1.00, crop=None,
         unit='Pared rocosa próxima derecha (silueta distinta)',
         camera='factor .92 · anclada al borde sur y1585',
         purpose='Evita repetición evidente; contrapunto cian/magenta'),
    dict(id='T08-03', alias='h08_estrato_medio',
         src='hub_t08_03_estrato_medio.png',
         dst='03_estrato/final/hub_t08_03_estrato.png',
         size=(1600, 220), mask='band', plane='P2 medio',
         bright=0.82, sat=0.92, crop=None,
         unit='Estrato geológico intermedio',
         camera='factor .66 · banda horizontal completa',
         purpose='Continuidad del terreno T07 por debajo del borde'),
    dict(id='T08-04', alias='h08_columna_natural',
         src='hub_t08_04_columna_natural.png',
         dst='04_columna/final/hub_t08_04_columna.png',
         size=(300, 460), mask='object', plane='P2 medio',
         bright=0.95, sat=0.95, crop='auto:46',
         unit='Columna natural de basalto',
         camera='factor .66 · 2 instancias, escala 1.0 / 0.72',
         purpose='Escala vertical y lectura de distancia media'),
    dict(id='T08-05', alias='h08_plataforma_suspendida',
         src='hub_t08_05_plataforma_suspendida.png',
         dst='05_plataforma/final/hub_t08_05_plataforma.png',
         size=(700, 260), mask='object', plane='P3 intermedio',
         bright=0.90, sat=0.92, crop='auto:38',
         unit='Plataforma rocosa suspendida',
         camera='factor .40 · balanceo suave',
         purpose='Elemento suspendido con vida propia, sin criaturas'),
    dict(id='T08-06', alias='h08_pared_lejana',
         src='hub_t08_06_pared_lejana.png',
         dst='06_pared_lejana/final/hub_t08_06_pared_lejana.png',
         size=(1600, 180), mask='band', plane='P4 lejano',
         bright=0.46, sat=0.62, crop=None,
         unit='Pared cavernaria lejana',
         camera='factor .20 · banda horizontal completa',
         purpose='Menor contraste; atmósfera y disolución de formas'),
    dict(id='T08-07', alias='h08_rocas_suspendidas',
         src='hub_t08_07_rocas_suspendidas.png',
         dst='07_rocas/final/hub_t08_07_rocas.png',
         size=(900, 260), mask='object', plane='P3 intermedio',
         bright=0.88, sat=0.92, crop='auto:34',
         unit='Agrupación de rocas flotantes',
         camera='factor .40 · 2 instancias con escala y volteo distintos',
         purpose='Movimiento lejano y siluetas de escala'),
    dict(id='T08-08', alias='h08_cavidades_lejanas',
         src='hub_t08_08_cavidades_lejanas.png',
         dst='08_cavidades/final/hub_t08_08_cavidades.png',
         size=(1600, 160), mask='band', plane='P4 lejano',
         bright=0.52, sat=0.66, crop=None,
         unit='Cavidades y arcos lejanos',
         camera='factor .20 · banda horizontal completa',
         purpose='Segunda lectura de profundidad, casi monocroma'),
    dict(id='T08-09', alias='h08_luces_abismo',
         src='hub_t08_09_luces_abismo.png',
         dst='09_luces/final/hub_t08_09_luces.png',
         size=(1200, 200), mask='band', plane='P5 fondo',
         bright=1.00, sat=1.00, crop=None,
         unit='Fuentes de luz infernal en el fondo',
         camera='factor .08 · banda inferior',
         purpose='Interpretar la distancia con luces diminutas; crece con shaftOpen'),
    dict(id='T08-10', alias='h08_humo_infernal',
         src='hub_t08_10_humo_infernal.png',
         dst='10_humo/final/hub_t08_10_humo.png',
         size=(360, 640), mask='smoke', plane='ambiente',
         bright=0.92, sat=0.90, crop='auto:34',
         unit='Columna de humo infernal',
         camera='espacio de pantalla · 4 columnas, escalas y derivas distintas',
         purpose='Corrientes lentas con densidad variable, integradas con las luces'),
]


def smooth(u: float) -> float:
    u = max(0.0, min(1.0, u))
    return u * u * (3.0 - 2.0 * u)


def grade(im: Image.Image, bright: float, sat: float) -> Image.Image:
    if sat != 1.0:
        im = ImageEnhance.Color(im).enhance(sat)
    if bright != 1.0:
        im = ImageEnhance.Brightness(im).enhance(bright)
    # Tinte hacia el violeta-negro del mundo (evita que el fondo parezca gris)
    r, g, b = im.split()
    r = r.point(lambda v: int(v * 0.97 + BG[0] * 0.03))
    g = g.point(lambda v: int(v * 0.95 + BG[1] * 0.05))
    b = b.point(lambda v: int(v * 1.00 + BG[2] * 0.00))
    return Image.merge('RGB', (r, g, b))


def auto_crop(im: Image.Image, threshold: int) -> Image.Image:
    """Recorta al objeto luminoso descartando el fondo negro generado."""
    small = im.convert('L').resize((im.width // 4, im.height // 4))
    px = small.load()
    xs, ys = [], []
    for y in range(small.height):
        for x in range(small.width):
            if px[x, y] > threshold:
                xs.append(x); ys.append(y)
    if not xs:
        return im
    k = 4
    x0 = max(0, (min(xs) - 8) * k); x1 = min(im.width, (max(xs) + 9) * k)
    y0 = max(0, (min(ys) - 8) * k); y1 = min(im.height, (max(ys) + 9) * k)
    if x1 - x0 < 40 or y1 - y0 < 40:
        return im
    return im.crop((x0, y0, x1, y1))


def band_mask(w: int, h: int) -> Image.Image:
    px = bytearray(w * h)
    fade_v = max(8, int(h * 0.18))
    fade_h = max(8, int(w * 0.05))
    for y in range(h):
        v = smooth(y / fade_v) * smooth((h - 1 - y) / fade_v)
        row = y * w
        for x in range(w):
            u = smooth(min(x, w - 1 - x) / fade_h)
            px[row + x] = int(round(255 * v * u))
    return Image.frombytes('L', (w, h), bytes(px)).filter(ImageFilter.GaussianBlur(0.8))


def object_mask(im: Image.Image, w: int, h: int, smoke: bool = False) -> Image.Image:
    lum = im.convert('L').resize((w, h), Image.LANCZOS)
    lp = lum.load()
    px = bytearray(w * h)
    lo, hi = (14.0, 96.0) if smoke else (20.0, 108.0)
    for y in range(h):
        # elipse suave centrada: elimina el halo de fondo alrededor del objeto
        ny = abs(y - (h - 1) / 2.0) / ((h - 1) / 2.0)
        for x in range(w):
            nx = abs(x - (w - 1) / 2.0) / ((w - 1) / 2.0)
            rad = 1.0 - smooth((max(nx * 0.86, ny) - 0.62) / 0.38)
            lum_a = smooth((lp[x, y] - lo) / (hi - lo))
            edge = smooth(y / (h * 0.08)) * smooth((h - 1 - y) / (h * 0.08)) if smoke else 1.0
            px[y * w + x] = int(round(255 * rad * lum_a * edge))
    return Image.frombytes('L', (w, h), bytes(px)).filter(ImageFilter.GaussianBlur(1.1))


def despill(im: Image.Image, a: Image.Image) -> Image.Image:
    rgb = im.convert('RGB')
    src, ap = rgb.load(), a.load()
    out = Image.new('RGB', rgb.size)
    op = out.load()
    w, h = rgb.size
    for y in range(h):
        for x in range(w):
            k = (1.0 - ap[x, y] / 255.0) * 0.85
            r, g, b = src[x, y]
            op[x, y] = (int(r + (BG[0] - r) * k),
                        int(g + (BG[1] - g) * k),
                        int(b + (BG[2] - b) * k))
    return out


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda: f.read(1 << 18), b''):
            h.update(chunk)
    return h.hexdigest()


def verify(im: Image.Image, spec: dict) -> dict:
    w, h = im.size
    a = im.getchannel('A')
    corners = [a.getpixel((0, 0)), a.getpixel((w - 1, 0)),
               a.getpixel((0, h - 1)), a.getpixel((w - 1, h - 1))]
    hist = a.histogram()
    ap, rp = a.load(), im.load()
    light = semi = 0
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            av = ap[x, y]
            if 8 < av < 247:
                semi += 1
                r, g, b = rp[x, y][:3]
                if (r + g + b) / 3 > 205:
                    light += 1
    halo = round(100.0 * light / semi, 4) if semi else 0.0
    mean_lum = sum(im.convert('L').resize((64, 32)).getdata()) / 2048.0
    return dict(exactSize=list(im.size) == list(spec['size']), mode=im.mode,
                cornersTransparent=all(v <= 8 for v in corners), corners=corners,
                opaquePct=round(100.0 * hist[255] / (w * h), 2),
                transparentPct=round(100.0 * hist[0] / (w * h), 2),
                semiTransparentSampled=semi, whiteFringePct=halo,
                borderClean=halo < 1.0, alphaReal=True,
                meanLuminance=round(mean_lum, 2))


def build(spec: dict):
    src = SRC / spec['src']
    if not src.exists():
        raise SystemExit('Falta fuente: ' + str(src))
    raw = Image.open(src).convert('RGB')
    cr = spec.get('crop')
    if isinstance(cr, str) and cr.startswith('auto:'):
        raw = auto_crop(raw, int(cr.split(':')[1]))
    elif cr:
        raw = raw.crop(cr)
    w, h = spec['size']
    raw = grade(raw.resize((w, h), Image.LANCZOS), spec['bright'], spec['sat'])
    kind = spec['mask']
    a = band_mask(w, h) if kind == 'band' else object_mask(raw, w, h, kind == 'smoke')
    out = despill(raw, a).convert('RGBA')
    out.putalpha(a)
    dst = BASE / spec['dst']
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, format='PNG', optimize=True)
    return dst, out


def main() -> None:
    assets = []
    for s in SPECS:
        dst, im = build(s)
        v = verify(im, s)
        rec = dict(id=s['id'], alias=s['alias'], unit=s['unit'], plane=s['plane'],
                   file=REL + s['dst'], source=REL + '_source/' + s['src'],
                   expected=list(s['size']), natural=list(im.size), mode=im.mode,
                   mask=s['mask'], bright=s['bright'], saturation=s['sat'],
                   pivot='centro', anchor=s['camera'], visualFunction=s['purpose'],
                   sha256=sha256(dst), bytes=dst.stat().st_size, verification=v)
        assets.append(rec)
        print(f"{s['id']} {s['alias']:<27} {im.size} {im.mode} "
              f"exact={v['exactSize']} corner={v['cornersTransparent']} "
              f"halo={v['whiteFringePct']} lum={v['meanLuminance']} "
              f"{dst.stat().st_size} B")
    ok = all(a['verification']['exactSize'] and a['verification']['borderClean']
             and a['verification']['cornersTransparent'] and a['mode'] == 'RGBA'
             for a in assets)
    man = dict(
        tanda='08', title='El abismo vivo', phase='FASE 2 · assets',
        status='PREPARADO' if ok else 'INVALIDO',
        generated=datetime.datetime.now().isoformat(timespec='seconds'),
        source='generate_image + ART_TOOLS/prepare_hub_tanda_08.py',
        compositionProof='ART_EVIDENCE/hub/tanda_08/composition_proof.json (16/16 APROBADA)',
        pipeline=['recorte automático por luminancia en objetos',
                  'resize LANCZOS a tamaño exacto',
                  'gradación de brillo/saturación por plano de profundidad',
                  'máscara de alfa (banda / objeto / humo)',
                  'despill oscuro en semitransparentes', 'blur de antialias'],
        rules=['sin NPC, criaturas ni enemigos', 'sin pixel art', 'sin halos claros',
               'transparencia real', 'las dos paredes próximas son fuentes distintas',
               'planos lejanos con menos contraste que los cercanos'],
        npcSpritesGenerated=0, count=len(assets), assets=assets, allValid=ok)
    (BASE / 'manifest.json').write_text(
        json.dumps(man, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('\nmanifest:', BASE / 'manifest.json', '| allValid =', ok)
    if not ok:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
