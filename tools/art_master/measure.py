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

Modo --actor (enemigos y PNJ, figura completa): ver actor_layout().
    python tools/art_master/measure.py --actor R02_ENEMIGOS/enemy_security_*.png \
           --ref R02_ENEMIGOS/enemy_security_walk.png --unit-world 88
           [--ax ARCHIVO=X] [--rel ARCHIVO=K]

Modo --scale (¿a qué tamaño dibujó el generador este maestro?): ver scale_match().
    python tools/art_master/measure.py --scale R02_ENEMIGOS/enemy_chef_windup.png \
           --ref R02_ENEMIGOS/enemy_chef_walk.png --box 800,128,970,300 [--rot=-40,40]
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


def actor_layout(raws, ref, unit_world, ppu, pad, key="green", ax_override=None, rel=None):
    """
    Colocación de fotogramas de ENEMIGOS / PNJ (figura completa, sin corte de cintura).

    Todos los fotogramas de una familia comparten escala. La fija el fotograma de
    referencia (`--ref`, su `walk` erguido): su figura mide `unit_world` px de mundo y
    se quiere a `ppu` texeles por px de mundo (4.7 = densidad del protagonista).
    Por fotograma se mide, sobre el maestro ya recortado del croma:
        ay  línea de suelo  = fila más baja con tinta
        ax  eje de apoyo    = centroide en x del 60 % inferior de la figura
                              (caderas y piernas: un arma o un brazo extendido no lo mueven)
    y se propone el lienzo mínimo (múltiplos de 16, `pad` px libres) con el punto de
    apoyo donde caiga; el registro guarda ese punto (anchors.foot), así que el pivote
    no tiene por qué ser el centro del lienzo.

    El eje automático falla cuando el torso baja hasta la franja inferior (una figura
    a cuatro patas): el cuerpo «resbala» respecto a `walk`. Para esos casos,
    `--ax archivo.png=X` fija el eje a mano (p. ej. el mismo X que el `walk` cuando el
    generador dejó los pies en el mismo sitio). Compruébese con preview_actors.py --onion.

    `--rel archivo.png=K` declara que ese maestro está dibujado K veces más grande
    (K < 1: más pequeño) que la referencia. Pasa cuando al generador se le da un
    lienzo de referencia ampliado para que quepa una pose más alta o más ancha: la
    salida mide siempre ~1,06 Mpx, así que la figura sale reducida. K se mide con
    `measure.py --scale`; el fotograma se coloca con escala `scale / K` y su
    `unit_h` pasa a ser `unit_h · K`, de modo que en el juego mide lo mismo.

    Imprime, por maestro, el fragmento JSON listo para el lote.
    """
    def keyed(path):
        im, _ = artlib.chroma_matte(Image.open(path), key=key, mode="hard", band=3)
        return im.convert("RGBA")

    def facts(im):
        a = np.asarray(im.getchannel("A"), dtype=np.float32)
        ys, xs = np.where(a > 10)
        x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
        cut = y0 + int((y1 - y0) * 0.40)
        band = a[cut:y1]
        cols = band.sum(axis=0)
        ax = float((cols * np.arange(a.shape[1])).sum() / max(cols.sum(), 1e-6))
        return {"bbox": [x0, y0, x1, y1], "ax": round(ax, 1), "ay": y1}

    ref_path = ref if os.path.isabs(ref) else os.path.join(RAW_ROOT, ref)
    rf = facts(keyed(ref_path))
    unit_h = rf["bbox"][3] - rf["bbox"][1]
    scale = round(unit_world * ppu / unit_h, 4)
    out = {"_family": {"ref": os.path.basename(ref_path), "unit_h_raw": unit_h, "unit_world": unit_world, "ppu": ppu, "scale": scale}}
    for path in raws:
        p = path if os.path.isabs(path) else os.path.join(RAW_ROOT, path)
        f = facts(keyed(p))
        forced = (ax_override or {}).get(os.path.basename(p))
        if forced is not None:
            f["ax_auto"] = f["ax"]
            f["ax"] = round(float(forced), 1)
        k = float((rel or {}).get(os.path.basename(p), 1.0))
        fscale = round(scale / k, 4)                 # escala de ESTE maestro al lienzo
        funit = round(unit_h * k, 1)                 # la figura de referencia, en px de este maestro
        x0, y0, x1, y1 = f["bbox"]
        left, right = (f["ax"] - x0) * fscale, (x1 - f["ax"]) * fscale
        up = (f["ay"] - y0) * fscale
        W = int(np.ceil((left + right + 2 * pad) / 16.0) * 16)
        H = int(np.ceil((up + 2 * pad) / 16.0) * 16)
        cx = int(round(pad + left + (W - (left + right + 2 * pad)) / 2.0))
        cy = H - pad
        out[os.path.basename(p)] = {
            "size": [W, H],
            "fit": {"mode": "anchor", "scale": fscale, "ax": f["ax"], "ay": f["ay"], "cx": cx, "cy": cy, "sharpen": 30},
            "anchors_raw": {"foot": [f["ax"], f["ay"]], "unit_h": funit if k != 1.0 else unit_h},
            "_bbox": f["bbox"], "_figure_px": [round((x1 - x0) * fscale), round((y1 - y0) * fscale)],
        }
        if k != 1.0:
            out[os.path.basename(p)]["_rel"] = k
        if forced is not None:
            out[os.path.basename(p)]["_ax_auto"] = f["ax_auto"]
    print(json.dumps(out, indent=1))


def scale_match(new_path, ref_path, box, srange=(0.4, 1.3), rrange=(0.0, 0.0), roi=None, key="green", down=2):
    """
    ¿A qué tamaño está dibujado `new_path` respecto a `ref_path`?

    Busca un rasgo RÍGIDO de la referencia (`box` = x0,y0,x1,y1 sobre el maestro de
    referencia: la cabeza, un casco, una bota… algo que no cambie con la pose) dentro
    del maestro nuevo, probando escalas y giros, por correlación cruzada normalizada
    con máscara (el croma no cuenta). Devuelve la escala K con la que mejor encaja:
    K = 0,78 significa que la figura nueva mide el 78 % de la de referencia.

    Dos pasadas: una gruesa (escala 0,04; giro 10°) y otra fina alrededor del mejor
    (escala 0,01; giro 2,5°). `--rot=a,b` acota el giro en grados (antihorario
    positivo); sin él no se gira. `--roi` limita la búsqueda en el maestro nuevo.

    Es una ESTIMACIÓN: con `score` por debajo de ~0,45 el rasgo no se parece lo
    bastante (expresión distinta, tapado, otra vista) y hay que medir con otro rasgo
    o a mano. Conviene medir dos rasgos y comparar.
    """
    from scipy.signal import fftconvolve

    def load(path):
        im = Image.open(path).convert("RGB")
        keyed, _ = artlib.chroma_matte(im, key=key, mode="hard")
        a = keyed.getchannel("A")
        g = keyed.convert("RGB").convert("L")
        if down > 1:
            size = (im.size[0] // down, im.size[1] // down)
            a, g = a.resize(size, Image.BOX), g.resize(size, Image.BOX)
        return g, a

    g_ref, a_ref = load(ref_path)
    g_new, a_new = load(new_path)
    bx = [int(round(v / down)) for v in box]
    t_g, t_a = g_ref.crop(bx), a_ref.crop(bx)
    A = np.asarray(a_new, dtype=np.float32) / 255.0
    I = np.asarray(g_new, dtype=np.float32) / 255.0 * A + 0.5 * (1 - A)
    off = (0, 0)
    Acrop = A
    if roi:
        r = [int(round(v / down)) for v in roi]
        I = I[r[1]:r[3], r[0]:r[2]]
        Acrop = A[r[1]:r[3], r[0]:r[2]]
        off = (r[0], r[1])
    I2 = I * I

    def score(sc, ang):
        tg, ta = t_g, t_a
        if ang:
            tg = tg.rotate(ang, resample=Image.BICUBIC, expand=True, fillcolor=128)
            ta = ta.rotate(ang, resample=Image.BICUBIC, expand=True, fillcolor=0)
        w, h = max(4, int(round(tg.size[0] * sc))), max(4, int(round(tg.size[1] * sc)))
        if h >= I.shape[0] or w >= I.shape[1]:
            return None
        tg, ta = tg.resize((w, h), Image.BICUBIC), ta.resize((w, h), Image.BICUBIC)
        m = (np.asarray(ta, dtype=np.float32) / 255.0 > 0.5).astype(np.float32)
        n = float(m.sum())
        if n < 40:
            return None
        t = np.asarray(tg, dtype=np.float32) / 255.0
        t = (t - (t * m).sum() / n) * m
        tt = float((t * t).sum())
        if tt < 1e-6:
            return None
        num = fftconvolve(I, t[::-1, ::-1], mode="valid")
        s1 = fftconvolve(I, m[::-1, ::-1], mode="valid")
        s2 = fftconvolve(I2, m[::-1, ::-1], mode="valid")
        cov = fftconvolve(Acrop, m[::-1, ::-1], mode="valid") / n
        var = np.maximum(s2 - s1 * s1 / n, 1e-6)
        ncc = num / np.sqrt(tt * var)
        # Sólo cuentan ventanas que caen sobre la figura y con contraste comparable al
        # del rasgo: sobre croma liso o piel plana la varianza es casi nula y el
        # cociente se dispara sin que haya parecido alguno.
        ncc[(cov < 0.7) | (var < 0.3 * tt)] = -1.0
        iy, ix = np.unravel_index(int(np.argmax(ncc)), ncc.shape)
        return float(ncc[iy, ix]), (int((ix + off[0]) * down), int((iy + off[1]) * down)), (w * down, h * down)

    def sweep(scales, angles):
        best = None
        for ang in angles:
            for sc in scales:
                r = score(float(sc), float(ang))
                if r and (best is None or r[0] > best["score"]):
                    best = {"score": round(r[0], 3), "k": round(float(sc), 3), "rot": float(ang), "at": list(r[1]), "size": list(r[2])}
        return best

    a0, a1 = rrange
    coarse = sweep(np.arange(srange[0], srange[1] + 1e-6, 0.04), np.arange(a0, a1 + 1e-6, 10.0) if a1 > a0 else [a0])
    if coarse is None:
        return {"error": "sin coincidencia"}
    fine = sweep(np.arange(max(0.1, coarse["k"] - 0.06), coarse["k"] + 0.0601, 0.01),
                 np.arange(coarse["rot"] - 7.5, coarse["rot"] + 7.51, 2.5) if a1 > a0 else [a0])
    fine["coarse"] = {"k": coarse["k"], "rot": coarse["rot"], "score": coarse["score"]}
    return fine


def main() -> None:
    if "--scale" in sys.argv:
        ap = argparse.ArgumentParser(description=scale_match.__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
        ap.add_argument("raws", nargs="+")
        ap.add_argument("--scale", action="store_true")
        ap.add_argument("--ref", required=True)
        ap.add_argument("--box", required=True, help="x0,y0,x1,y1 del rasgo rígido en el maestro de referencia")
        ap.add_argument("--range", default="0.4,1.3", help="escalas a probar: min,max")
        ap.add_argument("--rot", default="0,0", help="giros a probar en grados: min,max")
        ap.add_argument("--roi", default=None, help="x0,y0,x1,y1 del maestro nuevo donde buscar")
        ap.add_argument("--key", default="green")
        a = ap.parse_args()
        rp = a.ref if os.path.exists(a.ref) else os.path.join(RAW_ROOT, a.ref)
        out = {}
        for q in a.raws:
            path = q if os.path.exists(q) else os.path.join(RAW_ROOT, q)
            out[os.path.basename(path)] = scale_match(
                path, rp, [int(v) for v in a.box.split(",")],
                tuple(float(v) for v in a.range.split(",")), tuple(float(v) for v in a.rot.split(",")),
                [int(v) for v in a.roi.split(",")] if a.roi else None, a.key)
        print(json.dumps(out, indent=1))
        return
    if "--actor" in sys.argv:
        ap = argparse.ArgumentParser(description=actor_layout.__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
        ap.add_argument("raws", nargs="+")
        ap.add_argument("--actor", action="store_true")
        ap.add_argument("--ref", required=True, help="maestro de referencia de la familia (walk erguido)")
        ap.add_argument("--unit-world", type=float, required=True, help="alto de esa figura en px de mundo")
        ap.add_argument("--ppu", type=float, default=4.7, help="texeles por px de mundo")
        ap.add_argument("--pad", type=int, default=8)
        ap.add_argument("--key", default="green")
        ap.add_argument("--ax", action="append", default=[], metavar="ARCHIVO=X", help="fija a mano el eje de apoyo de un maestro")
        ap.add_argument("--rel", action="append", default=[], metavar="ARCHIVO=K", help="ese maestro está dibujado K veces el tamaño de la referencia (ver --scale)")
        a = ap.parse_args()
        forced, rel = {}, {}
        for item in a.ax:
            name, _, val = item.partition("=")
            forced[os.path.basename(name)] = float(val)
        for item in a.rel:
            name, _, val = item.partition("=")
            rel[os.path.basename(name)] = float(val)
        actor_layout(a.raws, a.ref, a.unit_world, a.ppu, a.pad, a.key, forced, rel)
        return
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
