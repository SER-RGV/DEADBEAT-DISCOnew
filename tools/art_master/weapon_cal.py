#!/usr/bin/env python3
"""
DEADBEAT DISCO — ART PRODUCTION MASTER · calibración MEDIDA de sprites de arma (T05)

El motor (módulo v3.2, función `it`) dibuja el PNG del arma con la mano del
protagonista en el punto (grip, gripY) del lienzo, el fogonazo en (tip, axis) y la
mano de apoyo en (sup, supY); todo en fracciones del lienzo completo (320×160).
Hasta T05 esos números se escribían a ojo en WEAPON_OVERRIDES. Aquí se MIDEN sobre
la imagen final:

  * eje del cañón (axis): mediana del centro vertical de las columnas del tercio
    derecho de la silueta (la zona del cañón / punta).
  * boca (tip): última columna opaca.
  * empuñadura (grip): tramo de columnas que «cuelgan» por debajo del eje (culata
    de pistola, pistolete, cargador…) más cercano al previo de su clase; sin tramo
    útil se usa el previo. La mano se coloca a mitad de la caída.
  * mano de apoyo (sup): sólo en clases que la usan; a +Δ del grip, bajo el guardamanos.

Uso:
  weapon_cal.py <png> --cls fusil [--out overlay.png] [--json]
  (desde batch.py: measure(png_path, cls, hints) → dict de anclas normalizadas)
"""
from __future__ import annotations
import argparse
import json
import os
import sys
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image, ImageDraw

# ---------------------------------------------------------------------------
# Previos por clase del motor (cls de WEAPON_OVERRIDES). Fracciones del ANCHO de
# la silueta (bbox), no del lienzo. `sup` = desplazamiento desde el grip; None =
# la clase se empuña a una mano. `hang` = si se busca el tramo colgante.
# ---------------------------------------------------------------------------
CLASS_PRIOR: Dict[str, Dict] = {
    "pistola":        {"grip": 0.24, "sup": None, "hang": True},
    "revolver":       {"grip": 0.22, "sup": None, "hang": True},
    "pistolaEnergia": {"grip": 0.26, "sup": None, "hang": True},
    "varita":         {"grip": 0.22, "sup": None, "hang": False},
    "smg":            {"grip": 0.40, "sup": 0.30, "hang": True},
    "escopetaBombeo": {"grip": 0.30, "sup": 0.34, "hang": True},
    "escopeta":       {"grip": 0.30, "sup": 0.34, "hang": True},
    "escopetaDoble":  {"grip": 0.30, "sup": 0.32, "hang": True},
    "fusil":          {"grip": 0.36, "sup": 0.32, "hang": True},
    "fusilPrecision": {"grip": 0.34, "sup": 0.32, "hang": True},
    "ametralladora":  {"grip": 0.36, "sup": 0.30, "hang": True},
    "lanzador":       {"grip": 0.38, "sup": 0.26, "hang": True},
    "energia":        {"grip": 0.30, "sup": 0.32, "hang": True},
    "dispositivo":    {"grip": 0.32, "sup": 0.28, "hang": True},
    "baston":         {"grip": 0.30, "sup": 0.26, "hang": False},
    "lanza":          {"grip": 0.28, "sup": 0.28, "hang": False},
    "armaLigera":     {"grip": 0.16, "sup": None, "hang": False},
    "armaPesada":     {"grip": 0.22, "sup": 0.30, "hang": False},
    "cuchillo":       {"grip": 0.26, "sup": None, "hang": False},
    "punos":          {"grip": 0.42, "sup": None, "hang": False},
    "arco":           {"grip": 0.35, "sup": 0.37, "hang": False},
}
DEFAULT_PRIOR = {"grip": 0.30, "sup": 0.30, "hang": True}


def _runs(mask: np.ndarray, min_w: int = 4) -> List[Tuple[int, int]]:
    """Tramos [a, b) de True consecutivos con anchura mínima."""
    out: List[Tuple[int, int]] = []
    start = None
    for i, v in enumerate(mask.tolist() + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= min_w:
                out.append((start, i))
            start = None
    return out


def measure(png_path: str, cls: str, hints: Optional[Dict] = None) -> Dict:
    hints = dict(hints or {})
    im = Image.open(png_path).convert("RGBA")
    W, H = im.size
    a = np.asarray(im.getchannel("A"), dtype=np.float32) / 255.0
    solid = a >= 0.38
    if not solid.any():
        raise RuntimeError("sprite vacío: %s" % png_path)
    ys, xs = np.where(solid)
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    bw, bh = x1 - x0, y1 - y0
    prior = dict(DEFAULT_PRIOR)
    prior.update(CLASS_PRIOR.get(cls, {}))
    for k in ("grip", "sup", "hang"):
        if k in hints:
            prior[k] = hints[k]

    # Perfiles por columna
    rows = np.arange(H, dtype=np.float32)[:, None]
    mass = a.sum(axis=0)
    top = np.full(W, np.nan, dtype=np.float32)
    bot = np.full(W, np.nan, dtype=np.float32)
    cen = np.full(W, np.nan, dtype=np.float32)
    for x in range(x0, x1):
        col = solid[:, x]
        if col.any():
            idx = np.where(col)[0]
            top[x], bot[x] = idx.min(), idx.max() + 1
            cen[x] = float((a[:, x] * rows[:, 0]).sum() / max(a[:, x].sum(), 1e-6))

    # Eje del cañón: tercio derecho de la silueta (zona de la boca)
    rb0 = int(x0 + (1.0 - float(hints.get("axis_band", 0.32))) * bw)
    band = [x for x in range(rb0, x1) if not np.isnan(cen[x])]
    if len(band) < 3:
        band = [x for x in range(x0, x1) if not np.isnan(cen[x])]
    axis_y = float(np.median([cen[x] for x in band]))
    thick = float(np.median([bot[x] - top[x] for x in band]))
    if "axis_v" in hints:
        axis_y = float(hints["axis_v"]) * H
    tip_x = float(x1 - 1)

    # Empuñadura
    method = {"grip": "prior"}
    gx = x0 + float(prior["grip"]) * bw
    gy = None
    if prior.get("hang"):
        thr = axis_y + max(1.15 * thick, 0.20 * bh)
        lim = int(x0 + 0.82 * bw)
        hang = np.zeros(W, dtype=bool)
        for x in range(x0, lim):
            if not np.isnan(bot[x]) and bot[x] > thr:
                hang[x] = True
        # Sólo los tramos PROFUNDOS (≥ 55 % de la caída máxima): así el pistolete y el
        # tambor/cargador quedan separados por el guardamonte, y se elige el tramo más
        # cercano al previo de la clase (a ≤ 0,16 del ancho de la silueta).
        hang_cols = [x for x in range(x0, lim) if hang[x]]
        runs = []
        if hang_cols:
            dmax = float(np.percentile([bot[x] - axis_y for x in hang_cols], 95))
            thr2 = axis_y + max(thr - axis_y, 0.55 * dmax)
            deep = np.zeros(W, dtype=bool)
            for x in hang_cols:
                if bot[x] >= thr2:
                    deep[x] = True
            runs = _runs(deep, min_w=max(4, int(0.012 * W)))
        if runs:
            best = None
            for (ra, rb) in runs:
                cu = ((ra + rb) / 2.0 - x0) / float(bw)
                d = abs(cu - float(prior["grip"]))
                if best is None or d < best[0]:
                    best = (d, ra, rb)
            if best and best[0] <= float(hints.get("max_dev", 0.16)):
                _, ra, rb = best
                run_bot = float(np.percentile([bot[x] for x in range(ra, rb)], 85))
                # la mano, en la mitad alta de la caída del tramo (bajo el armazón)
                gx = (ra + rb) / 2.0
                gy = axis_y + 0.46 * (run_bot - axis_y)
                method = {"grip": "hang", "run": [int(ra), int(rb)], "run_bot": round(run_bot, 1), "cands": len(runs)}
    if gy is None:
        # Previo directo: si en esa columna cuelga algo bajo el eje (pistolete, garganta de la
        # culata) la mano va a media caída; si no (asta, hoja), al centro de masa de la columna.
        xi = int(min(max(round(gx), x0), x1 - 1))
        c = cen[xi] if not np.isnan(cen[xi]) else axis_y
        b = bot[xi] if not np.isnan(bot[xi]) else axis_y
        gy = max(c, axis_y + 0.5 * (b - axis_y)) if (b - axis_y) > 1.3 * thick else c
    if "grip_v" in hints:
        # Altura explícita (fracción del alto del PNG): armas gordas (BFG, mortero, minigun)
        # donde el grosor del cuerpo impide distinguir el pistolete por su caída.
        gy = float(hints["grip_v"]) * H
        method["grip_v"] = "hint"
    gx = float(min(max(gx, x0 + 2), x1 - 2))
    gy = float(min(max(gy, y0 + 1), y1 - 1))

    # Mano de apoyo
    sup = None
    compact = (bw / float(max(bh, 1))) < 1.9 and cls in ("smg", "dispositivo", "energia", "pistolaEnergia")
    if prior.get("sup") is not None and not compact:
        sx = gx + float(prior["sup"]) * bw
        sx = min(sx, x0 + 0.86 * bw)
        xi = int(round(sx))
        win = [bot[x] for x in range(max(x0, xi - 6), min(x1, xi + 7)) if not np.isnan(bot[x])]
        sb = float(np.median(win)) if win else axis_y + thick / 2
        sy = sb - 0.22 * thick
        sy = max(sy, axis_y + 0.15 * thick)
        if "sup_v" in hints:
            # Altura explícita de la mano de apoyo (fracción del alto del PNG): arcos (el motor
            # dibuja el antebrazo de apoyo desde el grip hasta sup en el marco SIN girar, así que
            # sup_v = grip_v lo deja horizontal) y armas con la mano delantera sobre un cuerpo grueso.
            sy = float(hints["sup_v"]) * H
            method["sup_v"] = "hint"
        sup = [round(sx / W, 3), round(min(sy, y1 - 1) / H, 3)]
        # apoyo demasiado cerca del grip (arma corta): el motor exige ≥ 10 px de separación
        if (sup[0] - gx / W) * W < 0.10 * W:
            sup = None

    out = {
        "grip": [round(gx / W, 3), round(gy / H, 3)],
        "axis": round(axis_y / H, 3),
        "tip": round(tip_x / W, 3),
        "sup": sup,
        "oriented": True,
        "cls": cls,
        "bbox": [x0, y0, x1, y1],
        "method": method,
        "thick_px": round(thick, 1),
    }
    if "tip" in hints:
        # Boca explícita (fracción del ancho del PNG): p. ej. lanzallamas con llama piloto pintada.
        out["tip"] = round(float(hints["tip"]), 3)
        method["tip"] = "hint"
    if "spriteRot" in hints:
        out["spriteRot"] = float(hints["spriteRot"])
        out["oriented"] = False
    return out


def overlay(png_path: str, cal: Dict, out_path: str, scale: int = 2) -> None:
    im = Image.open(png_path).convert("RGBA")
    W, H = im.size
    bg = Image.new("RGBA", (W, H), (28, 22, 40, 255))
    bg.alpha_composite(im)
    bg = bg.resize((W * scale, H * scale), Image.NEAREST)
    d = ImageDraw.Draw(bg)
    ay = cal["axis"] * H * scale
    d.line([(0, ay), (W * scale, ay)], fill=(255, 220, 0, 255), width=1)
    tx = cal["tip"] * W * scale
    d.line([(tx, 0), (tx, H * scale)], fill=(0, 255, 255, 255), width=1)
    gx, gy = cal["grip"][0] * W * scale, cal["grip"][1] * H * scale
    d.ellipse([gx - 5, gy - 5, gx + 5, gy + 5], outline=(255, 40, 40, 255), width=2)
    if cal.get("sup"):
        sx, sy = cal["sup"][0] * W * scale, cal["sup"][1] * H * scale
        d.ellipse([sx - 5, sy - 5, sx + 5, sy + 5], outline=(80, 255, 120, 255), width=2)
    b = cal.get("bbox")
    if b:
        d.rectangle([b[0] * scale, b[1] * scale, b[2] * scale - 1, b[3] * scale - 1], outline=(255, 0, 200, 160), width=1)
    d.text((4, H * scale - 14), "%s grip=%s axis=%s tip=%s sup=%s %s" % (
        cal.get("cls"), cal["grip"], cal["axis"], cal["tip"], cal.get("sup"), cal.get("method", {}).get("grip")),
        fill=(255, 255, 255, 255))
    bg.convert("RGB").save(out_path)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("png")
    ap.add_argument("--cls", default="fusil")
    ap.add_argument("--out", default=None, help="PNG con la superposición de medidas")
    ap.add_argument("--hints", default=None, help="JSON con ajustes (grip, grip_v, sup, sup_v, tip, hang, axis_v, axis_band, max_dev, spriteRot)")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    hints = json.loads(a.hints) if a.hints else {}
    cal = measure(a.png, a.cls, hints)
    if a.out:
        overlay(a.png, cal, a.out)
    print(json.dumps(cal, ensure_ascii=False) if a.json else json.dumps(cal, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
