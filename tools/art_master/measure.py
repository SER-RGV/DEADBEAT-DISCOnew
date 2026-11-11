#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEADBEAT DISCO — medición de registro de fotogramas del protagonista.

El generador conserva el torso en la misma posición del maestro en todas las poses
"de pie". Para colocar cada fotograma en el lienzo sin escalones en la cintura hay
que saber, por fotograma, dónde quedó la hebilla del cinturón. Este script la busca
por correlación cruzada normalizada (NCC) de una plantilla recortada del fotograma
de referencia, y devuelve los valores que usa el lote (docs/ART_REBUILD/batches):

    ax      = eje de torso del maestro (ref_ax + dx)        -> fit.ax
    belt_y  = borde inferior del cinturón (ref_belt + dy)   -> anchors_raw.belt_y
    ay      = fila más baja con tinta (línea de suelo)      -> fit.ay

Uso:
    python tools/art_master/measure.py <maestro.png> [<maestro2.png> ...]
           [--ref <maestro_ref.png>] [--box x0,y0,x1,y1] [--ref-ax 562] [--ref-belt 490]
           [--search 90]

No modifica nada: imprime JSON. Un `score` por debajo de ~0,45 indica que la hebilla
está tapada o girada y hay que medir a mano sobre una rejilla.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import artlib  # noqa: E402

RAW_ROOT = os.environ.get("DD_RAW_ROOT", "/home/user/dd_work/raw")


def _gray(im: Image.Image) -> np.ndarray:
    return np.asarray(im.convert("L"), dtype=np.float32)


def ncc_search(img: np.ndarray, tpl: np.ndarray, x0: int, y0: int, radius: int):
    """Mejor desplazamiento (dx, dy) de la plantilla alrededor de (x0, y0)."""
    th, tw = tpl.shape
    t = tpl - tpl.mean()
    tn = float(np.sqrt((t * t).sum())) or 1.0
    best = (-2.0, 0, 0)
    H, W = img.shape
    for dy in range(-radius, radius + 1):
        yy = y0 + dy
        if yy < 0 or yy + th > H:
            continue
        for dx in range(-radius, radius + 1):
            xx = x0 + dx
            if xx < 0 or xx + tw > W:
                continue
            p = img[yy:yy + th, xx:xx + tw]
            q = p - p.mean()
            qn = float(np.sqrt((q * q).sum()))
            if qn < 1e-3:
                continue
            s = float((q * t).sum()) / (qn * tn)
            if s > best[0]:
                best = (s, dx, dy)
    return best


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("raws", nargs="+")
    ap.add_argument("--ref", default=os.path.join(RAW_ROOT, "R01_PROTAGONISTA", "player_shoot_00.png"))
    ap.add_argument("--box", default="584,456,634,496", help="caja de la hebilla en el maestro de referencia")
    ap.add_argument("--ref-ax", type=float, default=562.0)
    ap.add_argument("--ref-belt", type=float, default=490.0)
    ap.add_argument("--search", type=int, default=90)
    a = ap.parse_args()

    x0, y0, x1, y1 = [int(v) for v in a.box.split(",")]
    ref = _gray(Image.open(a.ref).convert("RGB"))
    tpl = ref[y0:y1, x0:x1]
    out = {}
    for p in a.raws:
        path = p if os.path.exists(p) else os.path.join(RAW_ROOT, p)
        rgb = Image.open(path).convert("RGB")
        score, dx, dy = ncc_search(_gray(rgb), tpl, x0, y0, a.search)
        keyed, _info = artlib.chroma_matte(rgb, key="green", mode="hard")
        bb = artlib.alpha_bbox(keyed)
        out[os.path.basename(path)] = {
            "score": round(score, 3), "dx": dx, "dy": dy,
            "ax": a.ref_ax + dx, "belt_y": a.ref_belt + dy,
            "ay": (bb[3] - 1) if bb else None, "bbox": list(bb) if bb else None,
        }
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
