#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEADBEAT DISCO — capa de paralaje de la multitud (cinemática).

Extrae la multitud (siluetas oscuras) de la lámina aprobada de la pista
(`op_03_dancefloor.jpg`) como un PNG RGBA independiente, alineado píxel a píxel
con la lámina. Permite mover a los bailarines por separado del fondo y dibujar
sus repeticiones (el bucle visible) sin tocar el arte original, que se conserva
intacto.

No inventa dibujo: sólo recorta píxeles ya aprobados. Si la lámina cambia, se
vuelve a ejecutar este script.

Uso:  /ruta/python tools/art_master/cinematic_crowd_layer.py
Necesita: pillow, numpy.
"""
from __future__ import annotations

import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "assets/cinematics/restart/opening/op_03_dancefloor.jpg")
OUT = os.path.join(ROOT, "assets/cinematics/restart/opening/op_03_crowd_layer.png")

# La banda de la multitud empieza por debajo del 46 % de la altura; por encima
# está la arquitectura (bóvedas, ventanas, reloj) y no se recorta.
BAND_TOP = 0.46
# Umbral de luminancia de las siluetas (tinta casi negra sobre neón).
LUM_MAX = 64.0
# Suavizado del borde alfa, en píxeles.
FEATHER = 1.1


def shift(mask: np.ndarray, dy: int, dx: int) -> np.ndarray:
    h, w = mask.shape
    out = np.zeros_like(mask)
    ys, xs = slice(max(0, dy), h + min(0, dy)), slice(max(0, dx), w + min(0, dx))
    yd, xd = slice(max(0, -dy), h - max(0, dy)), slice(max(0, -dx), w - max(0, dx))
    out[ys, xs] = mask[yd, xd]
    return out


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]

    band = np.ones((h, w), bool)
    band[: int(h * BAND_TOP), :] = False

    mask = (lum < LUM_MAX) & band
    for _ in range(2):                                   # erosión: quita motas
        mask = mask & shift(mask, 1, 0) & shift(mask, -1, 0) & shift(mask, 0, 1) & shift(mask, 0, -1)
    for _ in range(3):                                   # dilatación: recupera brazos
        mask = mask | shift(mask, 1, 0) | shift(mask, -1, 0) | shift(mask, 0, 1) | shift(mask, 0, -1)

    alpha = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(FEATHER))
    out = im.convert("RGBA")
    out.putalpha(alpha)
    out.save(OUT, optimize=True)
    print("capa de multitud:", OUT, out.size, "cobertura %.1f %%" % (mask.mean() * 100))


if __name__ == "__main__":
    main()
