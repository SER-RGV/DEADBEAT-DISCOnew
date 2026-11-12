#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEADBEAT DISCO — hojas de contacto para revisar arte y capturas.

    sheet.py <salida.jpg> <archivos…> [--cols 6] [--cell 220] [--zoom 1.0]
             [--crop ANCHOxALTO] [--label nombre|ruta|no] [--strip PREFIJO]
             [--bg oscuro|claro|ambos]

  - Sin --crop: cada imagen se reduce para caber en la celda (--cell px). Las que
    tienen transparencia se pegan sobre fondo oscuro, claro o ambos (para ver halos).
  - Con --crop: recorta ANCHOxALTO px del centro de cada imagen y lo amplía
    --zoom veces (capturas del juego: mismo encuadre en todas).
  - Etiqueta: nombre del archivo (sin --strip) y tamaño original.

Es una ayuda de revisión; no modifica los archivos de entrada.
"""
from __future__ import annotations

import argparse
import math
import os

from PIL import Image, ImageDraw

DARK = (40, 38, 52)
LIGHT = (198, 190, 210)


def _tile(path, cell, crop, zoom, bg):
    im = Image.open(path)
    ow, oh = im.size
    if crop:
        cw, ch = crop
        src = im.convert("RGB")
        box = (ow // 2 - cw // 2, oh // 2 - ch // 2, ow // 2 + cw // 2, oh // 2 + ch // 2)
        t = src.crop(box).resize((max(1, int(cw * zoom)), max(1, int(ch * zoom))), Image.Resampling.LANCZOS)
        return t, (ow, oh)
    has_alpha = im.mode in ("RGBA", "LA", "PA") or "transparency" in im.info
    a = im.convert("RGBA")
    a.thumbnail((cell - 6, cell - 6), Image.Resampling.LANCZOS)
    if not has_alpha:
        return a.convert("RGB"), (ow, oh)
    grounds = [DARK, LIGHT] if bg == "ambos" else [LIGHT if bg == "claro" else DARK]
    t = Image.new("RGB", (cell * len(grounds), cell), DARK)
    for i, col in enumerate(grounds):
        g = Image.new("RGBA", (cell, cell), col + (255,))
        g.alpha_composite(a, ((cell - a.width) // 2, (cell - a.height) // 2))
        t.paste(g.convert("RGB"), (i * cell, 0))
    return t, (ow, oh)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("out")
    ap.add_argument("files", nargs="+")
    ap.add_argument("--cols", type=int, default=6)
    ap.add_argument("--cell", type=int, default=220)
    ap.add_argument("--zoom", type=float, default=1.0)
    ap.add_argument("--crop", default="")
    ap.add_argument("--label", default="nombre", choices=["nombre", "ruta", "no"])
    ap.add_argument("--strip", default="")
    ap.add_argument("--bg", default="oscuro", choices=["oscuro", "claro", "ambos"])
    ap.add_argument("--quality", type=int, default=88)
    a = ap.parse_args()

    crop = tuple(int(v) for v in a.crop.lower().split("x")) if a.crop else None
    tiles = []
    for f in a.files:
        try:
            t, size = _tile(f, a.cell, crop, a.zoom, a.bg)
        except Exception as e:  # archivo ilegible: se anota y se sigue
            print("  [omitido] %s (%s)" % (f, e))
            continue
        name = f if a.label == "ruta" else os.path.splitext(os.path.basename(f))[0]
        if a.strip and name.startswith(a.strip):
            name = name[len(a.strip):]
        tiles.append((t, name, size))
    if not tiles:
        raise SystemExit("sin imágenes")
    lh = 0 if a.label == "no" else 14
    tw = max(t.width for t, _, _ in tiles)
    th = max(t.height for t, _, _ in tiles)
    cols = max(1, min(a.cols, len(tiles)))
    rows = math.ceil(len(tiles) / cols)
    sheet = Image.new("RGB", (cols * tw, rows * (th + lh)), (18, 16, 26))
    d = ImageDraw.Draw(sheet)
    for i, (t, name, size) in enumerate(tiles):
        x, y = (i % cols) * tw, (i // cols) * (th + lh)
        sheet.paste(t, (x + (tw - t.width) // 2, y + (th - t.height) // 2))
        if lh:
            label = name if crop else "%s %dx%d" % (name, size[0], size[1])
            d.text((x + 3, y + th + 1), label[: max(8, tw // 6)], fill=(232, 232, 236))
    os.makedirs(os.path.dirname(os.path.abspath(a.out)) or ".", exist_ok=True)
    sheet.save(a.out, quality=a.quality)
    print(a.out, sheet.size, len(tiles))


if __name__ == "__main__":
    main()
