#!/usr/bin/env python3
"""Calibra los parametros de alfa de prepare_tanda_03.py.

Para cada combinacion comprueba los puntos de control de las 4 laminas:
los negros internos (pelo, camiseta, pantalon) deben quedar con alfa 255 y
el fondo (perimetral e interior) con alfa 0. No escribe assets: solo imprime
la tabla de calibracion y la combinacion optima.
"""

from __future__ import annotations

import sys
from itertools import product
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ART_TOOLS"))
import prepare_tanda_03 as prep  # noqa: E402

GRID = list(product([8, 10, 12], [40, 50, 60], [1, 2, 3]))


def main() -> None:
    ims = {
        n: Image.open(prep.SRC / f"{n}.png").convert("RGB")
        for n, _ in prep.FILES
    }
    print(f"{'bg_tol':>7} {'blur':>5} {'thr':>4} | {'OK':>7} | "
          f"{'interior':>8} {'fondo':>6} | {'halos':>5} | anchos bbox")
    print("-" * 82)
    best = []
    for bg_tol, blur, thr in GRID:
        rows = []
        for n, im in ims.items():
            out, m = prep.build_alpha(im, bg_tol=bg_tol, near_blur=blur,
                                      near_thr=thr)
            qa = prep.check_controls(n, out)
            bb = out.getchannel("A").getbbox()
            rows.append((n, qa, m, bb[2] - bb[0] if bb else -1))
        ok = sum(1 for _, q, _, _ in rows
                 if q["interior_preserved"] and q["background_cleared"])
        interior = sum(1 for _, q, _, _ in rows if q["interior_preserved"])
        fondo = sum(1 for _, q, _, _ in rows if q["background_cleared"])
        halos = sum(m["bright_halo_candidates_px"] for _, _, m, _ in rows)
        anchos = "/".join(str(w) for _, _, _, w in rows)
        print(f"{bg_tol:>7} {blur:>5} {thr:>4} | {ok:>7} | "
              f"{interior:>8} {fondo:>6} | {halos:>5} | {anchos}")
        if ok == len(ims) and halos == 0:
            best.append((bg_tol, blur, thr))
    print("-" * 82)
    print("Combinaciones que pasan 4/4 sin halos:", best)
    print("Configuracion activa:", prep.BG_TOL, prep.NEAR_BLUR, prep.NEAR_THR)


if __name__ == "__main__":
    main()
