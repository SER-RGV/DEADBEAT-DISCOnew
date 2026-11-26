#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DEADBEAT DISCO · HUB · TANDA 07 — preparación reproducible de 6 assets.

«El umbral del infierno». Se parte de 6 fuentes generadas en `_source/` y se
producen 6 finales con tamano EXACTO, modo y alfa controlados:

  * 4 texturas RGBA con mascaras de alfa HORIZONTALES/VERTICALES calculadas
    aqui (rampa superior, fundido de esquinas, mascara de apertura, mascara
    de paredes de pozo). No son croma: el borde se funde con el mundo oscuro,
    por lo que no hay halo claro sobre el HUB. Ademas se aplica un despill
    oscuro en los pixeles semitransparentes.
  * 2 placas RGB/JPEG opacas para la transicion de llegada (pantalla).

NO se generan sprites de NPC: el mecanismo de animacion existente del HUB
(V5 hub_clubber_dancer_a/b alternados + lean/bounce/drift, y
hub_cliente000_npc con breathe) cubre las cinco actividades de la Fase 3.
Los dos intentos de «clubber sentada» se descartaron por no respetar la pose
y por ser innecesarios (ver ART_TANDA_07_FASE3_MATRIZ_NPC.md).

Uso: PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/prepare_hub_tanda_07.py
Salida: ART_ASSETS/hub/tanda_07/manifest.json + 6 finales.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_07'
SRC = BASE / '_source'
REL = 'ART_ASSETS/hub/tanda_07/'

# id, fuente, destino, tamano exacto, modo, tipo de mascara, categoria
SPECS = [
    dict(id='T07-01', alias='h07_labio_acantilado',
         src='hub_t07_07_labio_banda.png',
         dst='01_labio/final/hub_t07_01_labio.png', size=(1500, 115),
         mask='top_corners', crop=(0, 96, 1584, 400),
         unit='Labio del acantilado · COTA -01',
         world=[500, 1470, 1500, 115], phase='Fase 2/4'),
    dict(id='T07-02', alias='h07_estrato_rococo',
         src='hub_t07_02_estrato_rococo.png',
         dst='02_estrato/final/hub_t07_02_estrato.png', size=(2100, 110),
         mask='top_corners', crop=(0, 100, 1584, 610),
         unit='Cara rocosa por estratos · COTA -02',
         world=[200, 1585, 2100, 110], phase='Fase 2/4'),
    dict(id='T07-03', alias='h07_apertura_profundidad',
         src='hub_t07_03_apertura_profundidad.png',
         dst='03_apertura/final/hub_t07_03_apertura.png', size=(420, 260),
         mask='aperture', crop=None,
         unit='Abertura de la grieta · COTA -02/-03',
         world=[1040, 1560, 420, 260], phase='Fase 2/4'),
    dict(id='T07-04', alias='h07_exterior_infernal',
         src='hub_t07_04_exterior_infernal.jpg',
         dst='04_exterior/final/hub_t07_04_exterior.jpg', size=(1280, 720),
         mask='none', crop=None, jpeg=True,
         unit='Exterior infernal · transicion de llegada',
         world=None, phase='Fase 2'),
    dict(id='T07-05', alias='h07_pozo_capas',
         src='hub_t07_05_pozo_capas.png',
         dst='05_pozo/final/hub_t07_05_pozo.png', size=(512, 1024),
         mask='shaft', crop=None,
         unit='Capas de profundidad del pozo · transicion de descenso',
         world=None, phase='Fase 4'),
    dict(id='T07-06', alias='h07_panorama_acantilado',
         src='hub_t07_01_labio_acantilado.png',
         dst='06_panorama/final/hub_t07_06_panorama.jpg', size=(1280, 720),
         mask='none', crop=None, jpeg=True,
         unit='Panorama discoteca/acantilado · placa intermedia de llegada',
         world=None, phase='Fase 2'),
]

BG = (8, 6, 16)  # violeta-negro del mundo: destino del despill


def smooth(u: float) -> float:
    u = max(0.0, min(1.0, u))
    return u * u * (3.0 - 2.0 * u)


def alpha_mask(kind: str, w: int, h: int):
    """Devuelve una mascara L (0..255)."""
    px = bytearray(w * h)

    def hprof(x: int) -> float:
        t = abs(x - (w - 1) / 2.0) / ((w - 1) / 2.0)
        if kind == 'aperture':
            # centro opaco (la abertura), fundido hacia los bordes
            return 1.0 - smooth((t - 0.55) / 0.45)
        if kind == 'shaft':
            # paredes opacas en los bordes, centro transparente (no tapa la escalera)
            return smooth((t - 0.20) / 0.55)
        if kind == 'top_corners':
            return smooth(min(x, w - 1 - x) / 34.0)
        return 1.0

    hx = [hprof(x) for x in range(w)]
    for y in range(h):
        if kind == 'top_corners':
            v = smooth(y / 15.0)
        elif kind == 'aperture':
            v = smooth(y / 22.0) * smooth((h - 1 - y) / 34.0)
        elif kind == 'shaft':
            v = smooth(y / 90.0) * smooth((h - 1 - y) / 90.0)
        else:
            v = 1.0
        row = y * w
        for x in range(w):
            px[row + x] = int(round(255 * v * hx[x]))
    return Image.frombytes('L', (w, h), bytes(px)).filter(ImageFilter.GaussianBlur(0.6))


def despill(im: Image.Image, a: Image.Image) -> Image.Image:
    """Evita halos claros: los pixeles semitransparentes tienden al fondo oscuro."""
    rgb = im.convert('RGB')
    src = rgb.load()
    ap = a.load()
    out = Image.new('RGB', rgb.size)
    op = out.load()
    w, h = rgb.size
    for y in range(h):
        for x in range(w):
            av = ap[x, y] / 255.0
            k = (1.0 - av) * 0.85
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
    exact = list(im.size) == list(spec['size'])
    if im.mode == 'RGBA':
        a = im.getchannel('A')
        corners = [a.getpixel((0, 0)), a.getpixel((w - 1, 0)),
                   a.getpixel((0, h - 1)), a.getpixel((w - 1, h - 1))]
        corners_transparent = all(v <= 8 for v in corners)
        hist = a.histogram()
        opaque = hist[255]
        transparent = hist[0]
        # «halo claro»: pixeles semitransparentes con luminancia alta
        light = 0
        semi = 0
        ap = a.load()
        rp = im.load()
        for y in range(0, h, 2):
            for x in range(0, w, 2):
                av = ap[x, y]
                if 8 < av < 247:
                    semi += 1
                    r, g, b = rp[x, y][:3]
                    if (r + g + b) / 3 > 205:
                        light += 1
        halo_pct = round(100.0 * light / semi, 4) if semi else 0.0
        return dict(exactSize=exact, mode=im.mode,
                    cornersTransparent=corners_transparent, corners=corners,
                    opaquePct=round(100.0 * opaque / (w * h), 2),
                    transparentPct=round(100.0 * transparent / (w * h), 2),
                    semiTransparentSampled=semi, whiteFringePct=halo_pct,
                    borderClean=halo_pct < 1.0, alphaReal=True)
    return dict(exactSize=exact, mode=im.mode, alphaReal=False,
                cornersTransparent=None, whiteFringePct=None,
                borderClean=True, opaquePct=100.0, transparentPct=0.0,
                semiTransparentSampled=0)


def build(spec: dict):
    src = SRC / spec['src']
    if not src.exists():
        raise SystemExit('Falta fuente: ' + str(src))
    raw = Image.open(src).convert('RGB')
    if spec.get('crop'):
        raw = raw.crop(spec['crop'])
    w, h = spec['size']
    raw = raw.resize((w, h), Image.LANCZOS)

    if spec.get('jpeg'):
        out = raw
        params = dict(format='JPEG', quality=88, optimize=True, subsampling=0)
    else:
        a = alpha_mask(spec['mask'], w, h)
        out = despill(raw, a).convert('RGBA')
        out.putalpha(a)
        params = dict(format='PNG', optimize=True)

    dst = BASE / spec['dst']
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, **params)
    return dst, out


def main() -> None:
    # Descarte documentado de las dos pruebas de NPC sentado
    for j in ('hub_t07_06_clubber_sentado.png', 'hub_t07_06_clubber_sentado_v2.png'):
        p = SRC / j
        if p.exists():
            p.unlink()

    assets = []
    for s in SPECS:
        dst, im = build(s)
        v = verify(im, s)
        rec = dict(id=s['id'], alias=s['alias'], unit=s['unit'],
                   file=REL + s['dst'], source=REL + '_source/' + s['src'],
                   expected=list(s['size']), natural=list(im.size),
                   mode=im.mode, worldBox=s['world'], phase=s['phase'],
                   mask=s['mask'], sha256=sha256(dst), bytes=dst.stat().st_size,
                   verification=v)
        assets.append(rec)
        print(f"{s['id']} {s['alias']:<28} {im.size} {im.mode:<4} "
              f"exact={v['exactSize']} halo={v['whiteFringePct']} "
              f"border={v['borderClean']} {dst.stat().st_size} B")

    ok = all(a['verification']['exactSize'] and a['verification']['borderClean']
             and (a['mode'] in ('RGB', 'RGBA')) for a in assets)
    man = dict(
        tanda='07', title='El umbral del infierno', phase='FASE 2-4 · assets',
        status='PREPARADO' if ok else 'INVALIDO',
        generated=__import__('datetime').datetime.now().isoformat(timespec='seconds'),
        source='generate_image + ART_TOOLS/prepare_hub_tanda_07.py',
        pipeline=['resize LANCZOS a tamano exacto', 'mascara de alfa calculada',
                  'despill oscuro en semitransparentes', 'blur 0.6 de antialias'],
        rules=['sin deformacion de personajes (no hay sprites de NPC nuevos)',
               'sin pixel art', 'sin halos claros', 'transparencia real en texturas',
               'placas de llegada opacas en JPEG'],
        npcSpritesGenerated=0,
        npcDecision='Se reutiliza hub_clubber_dancer_a/b + hub_cliente000_npc; '
                    'el mecanismo existente cubre bailar/conversar/descansar/'
                    'recorrer/reaccionar. Dos pruebas de sprite sentado descartadas.',
        count=len(assets), assets=assets, allValid=ok)
    (BASE / 'manifest.json').write_text(
        json.dumps(man, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('\nmanifest:', BASE / 'manifest.json', '| allValid =', ok)
    if not ok:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
