#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEADBEAT DISCO — ART PRODUCTION MASTER · biblioteca de procesado de assets.

Convierte una ilustración maestra (generada individualmente sobre un fondo
croma plano) en el asset final del juego:

    maestro RGB  ->  mate alfa (croma + descontaminación de color)
                 ->  recorte al contenido
                 ->  ajuste al lienzo del contrato (ancho x alto, pivote)
                 ->  PNG RGBA a todo color (SIN cuantizar a paleta, SIN dithering)

A diferencia de tools/asset_pipeline.py (línea anterior, pixel-art), aquí NO se
reduce a 256 colores: la dirección de arte vigente es ilustración digital
estilizada, no pixel art.

Requiere: pillow, numpy, scipy (usar /home/user/.venv/bin/python).
"""
from __future__ import annotations

import hashlib
import os
from typing import Dict, Optional, Tuple

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

# --------------------------------------------------------------------------- #
# 1. Mate alfa por croma                                                        #
# --------------------------------------------------------------------------- #

def _dominance(rgb: np.ndarray, key: str) -> np.ndarray:
    """Cuánto 'domina' el color croma en cada píxel (0 = nada, ~1 = croma puro)."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if key == "green":
        return g - np.maximum(r, b)
    if key == "magenta":
        return np.minimum(r, b) - g
    if key == "blue":
        return b - np.maximum(r, g)
    raise ValueError("croma no soportado: %s" % key)


def _key_level(rgb: np.ndarray, key: str) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if key == "green":
        return g
    if key == "magenta":
        return np.minimum(r, b)
    return b


def _despill(rgb: np.ndarray, key: str, mask: np.ndarray) -> np.ndarray:
    out = rgb.copy()
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    if key == "green":
        lim = np.maximum(r, b)
        g[mask] = np.minimum(g, lim)[mask]
    elif key == "magenta":
        # el derrame magenta sube R y B a la vez: se limitan al nivel del verde
        lim = np.maximum(g, np.minimum(r, b) * 0.0 + g)
        excess = np.minimum(r, b) - g
        excess = np.clip(excess, 0, None)
        r[mask] = (r - excess)[mask]
        b[mask] = (b - excess)[mask]
    elif key == "blue":
        lim = np.maximum(r, g)
        b[mask] = np.minimum(b, lim)[mask]
    return out


def chroma_matte(img: Image.Image, key: str = "green", mode: str = "hard",
                 band: int = 3, despill_all: bool = False) -> Tuple[Image.Image, Dict]:
    """
    Devuelve (RGBA, info).

    mode="hard": personajes/objetos sólidos. Todo lo que no es croma es opaco;
                 sólo se calcula alfa parcial en una banda de `band` px alrededor
                 del contorno (evita velos oscuros por sombreado del fondo).
    mode="soft": VFX / brillos. El alfa se estima en toda la imagen a partir de
                 la mezcla con el croma (conserva halos y humo translúcidos).
    """
    rgb = np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0
    h, w, _ = rgb.shape
    dom = _dominance(rgb, key)
    lvl = _key_level(rgb, key)
    ratio = dom / np.maximum(lvl, 1e-3)

    # Fondo de referencia: mediana de un marco de 8 px
    m = 8
    frame = np.zeros((h, w), bool)
    frame[:m, :] = frame[-m:, :] = True
    frame[:, :m] = frame[:, -m:] = True
    bg_rgb = np.median(rgb[frame], axis=0)
    d_bg = float(np.median(dom[frame]))
    if d_bg < 0.25:
        raise RuntimeError("El marco de la imagen no es croma '%s' (dominancia %.2f)" % (key, d_bg))

    bgish = (ratio > 0.5) & (lvl > 0.22) & (dom > 0.18 * d_bg)
    core = ~bgish

    # Dominancia local del fondo (por si el croma no es perfectamente uniforme)
    dist_to_core = ndimage.distance_transform_edt(bgish)
    sure_bg = bgish & (dist_to_core > band)
    if sure_bg.sum() > 100:
        num = ndimage.gaussian_filter(np.where(sure_bg, dom, 0.0), 12)
        den = ndimage.gaussian_filter(sure_bg.astype(np.float32), 12)
        d_local = np.where(den > 0.02, num / np.maximum(den, 1e-6), d_bg)
        d_local = np.clip(d_local, 0.6 * d_bg, 1.2 * d_bg)
    else:
        d_local = np.full((h, w), d_bg, np.float32)

    a_raw = 1.0 - np.clip(dom, 0, None) / d_local
    a_lin = np.clip((a_raw - 0.10) / 0.78, 0.0, 1.0)

    if mode == "soft":
        alpha = a_lin
        alpha[sure_bg & (a_raw < 0.14)] = 0.0
    else:
        dist_to_bg = ndimage.distance_transform_edt(core)
        alpha = np.ones((h, w), np.float32)
        alpha[sure_bg] = 0.0
        edge = (bgish & ~sure_bg) | (core & (dist_to_bg <= band))
        alpha[edge] = a_lin[edge]

    # Descontaminación: quitar el croma mezclado en los píxeles semitransparentes
    part = (alpha > 0.0) & (alpha < 0.999)
    out = rgb.copy()
    a3 = alpha[..., None]
    un = (rgb - (1.0 - a3) * bg_rgb[None, None, :]) / np.maximum(a3, 1e-3)
    out[part] = np.clip(un, 0, 1)[part]

    near_edge = ndimage.binary_dilation(alpha < 0.999, iterations=band + 1) & (alpha > 0)
    out = _despill(out, key, np.ones((h, w), bool) if despill_all else near_edge)

    # Motas sueltas (ruido del generador): componentes diminutas y aisladas
    removed = 0
    if mode == "hard":
        lab, n = ndimage.label(alpha > 0.35)
        if n > 1:
            sizes = ndimage.sum(np.ones_like(lab), lab, index=np.arange(1, n + 1))
            big = sizes.max()
            small = np.where(sizes < max(24.0, 0.00035 * big))[0] + 1
            if len(small):
                kill = np.isin(lab, small)
                alpha[kill] = 0.0
                removed = int(len(small))

    rgba = np.dstack([np.clip(out, 0, 1), alpha])
    res = Image.fromarray((rgba * 255.0 + 0.5).astype(np.uint8), "RGBA")
    info = {
        "key": key, "mode": mode, "bg_rgb": [round(float(x), 3) for x in bg_rgb],
        "bg_dominance": round(d_bg, 3), "opaque_pct": round(float((alpha > 0.5).mean() * 100), 2),
        "specks_removed": removed,
    }
    return res, info


def erase_regions(im: Image.Image, regions) -> Image.Image:
    """
    Limpieza puntual de elementos NO deseados del maestro (p. ej. una sombra de suelo
    que el generador dibujó pese a pedirse fondo liso). `regions` es una lista de
    polígonos [[x, y], ...] o rectángulos {"rect": [x0, y0, x1, y1]} en píxeles del maestro.
    Sólo borra (alfa = 0); nunca inventa contenido.
    """
    from PIL import ImageDraw
    if not regions:
        return im
    a = im.getchannel("A")
    d = ImageDraw.Draw(a)
    for reg in regions:
        if isinstance(reg, dict) and "rect" in reg:
            d.rectangle([int(v) for v in reg["rect"]], fill=0)
        else:
            d.polygon([tuple(pt) for pt in reg], fill=0)
    out = im.copy()
    out.putalpha(a)
    return out


def keep_regions(im: Image.Image, regions) -> Image.Image:
    """
    Inverso de erase_regions: conserva SÓLO lo que cae dentro de la unión de los
    polígonos / rectángulos dados (píxeles del maestro) y vuelve transparente el
    resto. Se usa para derivar una capa parcial de la MISMA ilustración (p. ej. los
    antebrazos y puños de una pose que cuelgan por debajo del cinturón y que el
    corte de cintura perdería). Nunca inventa contenido.
    """
    from PIL import ImageDraw
    if not regions:
        return im
    mask = Image.new("L", im.size, 0)
    d = ImageDraw.Draw(mask)
    for reg in regions:
        if isinstance(reg, dict) and "rect" in reg:
            d.rectangle([int(v) for v in reg["rect"]], fill=255)
        else:
            d.polygon([tuple(pt) for pt in reg], fill=255)
    a = np.minimum(np.asarray(im.getchannel("A")), np.asarray(mask))
    out = im.copy()
    out.putalpha(Image.fromarray(a, "L"))
    return out


def remove_ground_line(im: Image.Image, max_thick: int = 12, search: float = 0.14,
                       min_run: int = 28, min_cover: float = 0.10) -> Tuple[Image.Image, Dict]:
    """
    Borra la «línea de suelo» que el generador traza bajo los pies aunque se pida fondo
    liso (6 de las 8 primeras ilustraciones de jefes la traían): un trazo de tinta
    horizontal y fino que sobresale a ambos lados de la figura.

    Cómo se reconoce, sin tocar la figura:
      1. sólo se mira la franja inferior (`search` del alto de la figura);
      2. por columna, cuentan los tramos verticales de tinta de `max_thick` px o menos
         (la línea es fina; un zapato, un bajo de túnica o una peana no lo son);
      3. la fila con más píxeles de ese tipo es la línea, si cubre al menos
         `min_cover` del ancho de la figura; se toma la banda de filas contiguas;
      4. dentro de la banda sólo se borran los tramos horizontales de `min_run` px o
         más: la punta de una bota o el pico de una capa no llegan.
    Donde la línea pasa por debajo de un pie queda fundida con la suela (el tramo
    vertical ya no es fino) y no se toca. Sólo borra; nunca pinta.
    Devuelve (imagen, info) con `found`, las filas de la banda y los píxeles borrados.
    """
    # Cualquier alfa cuenta: así el tramo fino incluye el borde suavizado de la línea
    # y no queda un rastro de puntos semitransparentes donde estuvo.
    a = np.asarray(im.getchannel("A")) > 0
    ys, xs = np.where(a)
    if ys.size == 0:
        return im, {"found": False, "reason": "vacío"}
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    top = max(y0, y1 - max(8, int((y1 - y0) * float(search))))
    thin = np.zeros(a.shape, dtype=bool)
    for x in range(x0, x1):
        col = a[:, x]
        if not col[top:y1].any():
            continue
        d = np.diff(np.concatenate(([0], col.astype(np.int8), [0])))
        for s_, e_ in zip(np.where(d == 1)[0], np.where(d == -1)[0]):
            if e_ > top and (e_ - s_) <= max_thick:
                thin[s_:e_, x] = True
    rows = thin[top:y1].sum(axis=1)
    if rows.size == 0 or rows.max() < min_cover * (x1 - x0):
        return im, {"found": False, "reason": "sin trazo fino horizontal", "max_row_px": int(rows.max()) if rows.size else 0}
    peak = int(rows.argmax())
    thr = max(6, rows[peak] * 0.2)
    b0 = peak
    while b0 > 0 and rows[b0 - 1] >= thr and peak - (b0 - 1) <= max_thick:
        b0 -= 1
    b1 = peak + 1
    while b1 < rows.size and rows[b1] >= thr and b1 - peak <= max_thick:
        b1 += 1
    b0 += top
    b1 += top
    hit = thin[b0:b1].any(axis=0)
    # tramos horizontales (se toleran huecos de 2 px)
    cols = np.where(hit)[0]
    kill = np.zeros(a.shape[1], dtype=bool)
    if cols.size:
        start = prev = int(cols[0])
        for c in list(cols[1:]) + [None]:
            if c is not None and c - prev <= 3:
                prev = int(c)
                continue
            if prev - start + 1 >= min_run:
                kill[start:prev + 1] = True
            if c is not None:
                start = prev = int(c)
    if not kill.any():
        return im, {"found": False, "reason": "tramos demasiado cortos"}
    # Se borra el tramo vertical fino completo de cada columna marcada (aunque asome
    # un píxel fuera de la banda), no la banda entera.
    erase = np.zeros(a.shape, dtype=bool)
    lo, hi = max(0, b0 - max_thick), min(a.shape[0], b1 + max_thick)
    erase[lo:hi, kill] = thin[lo:hi, kill]
    # …pero sólo los tramos que realmente cruzan la banda
    lab_keep = np.zeros(a.shape, dtype=bool)
    for x in np.where(kill)[0]:
        colv = erase[:, x]
        d = np.diff(np.concatenate(([0], colv.astype(np.int8), [0])))
        for s_, e_ in zip(np.where(d == 1)[0], np.where(d == -1)[0]):
            if e_ > b0 and s_ < b1:
                lab_keep[s_:e_, x] = True
    alpha = np.asarray(im.getchannel("A")).copy()
    alpha[lab_keep] = 0
    out = im.copy()
    out.putalpha(Image.fromarray(alpha, "L"))
    return out, {"found": True, "rows": [int(b0), int(b1)], "erased_px": int(lab_keep.sum()),
                 "columns": [int(np.where(kill)[0].min()), int(np.where(kill)[0].max()) + 1]}


def fade_regions(im: Image.Image, regions) -> Image.Image:
    """
    Desvanece hacia un borde lo que el generador prolongó hasta el límite del cuadro
    (cables, hilos de marioneta): un corte recto se ve; un fundido se lee como «sigue
    hacia arriba». `regions` es una lista de {"rect": [x0, y0, x1, y1], "dir": "up" |
    "down" | "left" | "right"} en píxeles del maestro: el alfa se multiplica por una
    rampa lineal que vale 0 en el borde hacia el que apunta `dir` y 1 en el opuesto.
    Sólo reduce el alfa; nunca pinta.
    """
    if not regions:
        return im
    alpha = np.asarray(im.getchannel("A")).astype(np.float32)
    H, W = alpha.shape
    for reg in regions:
        x0, y0, x1, y1 = [int(v) for v in reg["rect"]]
        x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
        if x1 <= x0 or y1 <= y0:
            continue
        d = reg.get("dir", "up")
        if d in ("up", "down"):
            ramp = np.linspace(0.0, 1.0, y1 - y0, dtype=np.float32)
            if d == "down":
                ramp = ramp[::-1]
            alpha[y0:y1, x0:x1] *= ramp[:, None]
        else:
            ramp = np.linspace(0.0, 1.0, x1 - x0, dtype=np.float32)
            if d == "right":
                ramp = ramp[::-1]
            alpha[y0:y1, x0:x1] *= ramp[None, :]
    out = im.copy()
    out.putalpha(Image.fromarray(np.clip(alpha + 0.5, 0, 255).astype(np.uint8), "L"))
    return out


def apply_cleanup(keyed: Image.Image, asset: Dict) -> Tuple[Image.Image, Dict]:
    """
    Limpiezas declaradas en el asset de una tanda, siempre en este orden y siempre en
    píxeles del MAESTRO (antes de `flip_x` y del encaje): `erase`, `keep`,
    `ground_line`, `fade`. Lo usan `batch.py process` y `layout.py`, para que lo que
    se mide sea exactamente lo que luego se guarda.
    """
    rec: Dict = {}
    if asset.get("erase"):
        keyed = erase_regions(keyed.convert("RGBA"), asset["erase"])
        rec["erase"] = asset["erase"]
    if asset.get("keep"):
        keyed = keep_regions(keyed.convert("RGBA"), asset["keep"])
        rec["keep"] = asset["keep"]
    if asset.get("ground_line"):
        params = asset["ground_line"] if isinstance(asset["ground_line"], dict) else {}
        keyed, info = remove_ground_line(keyed.convert("RGBA"), **params)
        rec["ground_line"] = info
    if asset.get("fade"):
        keyed = fade_regions(keyed.convert("RGBA"), asset["fade"])
        rec["fade"] = asset["fade"]
    return keyed, rec


def canvas_anchors(fit: Dict, size: Tuple[int, int], anchors_raw: Optional[Dict]) -> Dict:
    """
    Convierte puntos medidos sobre el MAESTRO (px) en anclas normalizadas del lienzo
    final (0..1), para fotogramas colocados con fit.mode == "anchor":
        belt_y : fila del borde inferior del cinturón  -> "belt"  (fracción de alto)
        hand   : [x, y] de la mano que empuña el arma  -> "hand"  ([u, v])
        foot   : [x, y] del punto de apoyo en el suelo -> "foot"  ([u, v])
        unit_h : alto en px de la figura de referencia
                 de la familia (su `walk` erguido)     -> "unit"  (fracción de alto)
    El renderizador lee estas anclas del registro (entries[id].anchors) para el
    corte de cintura, para colocar el arma y para apoyar y escalar a los enemigos;
    no hay coordenadas a ojo en el código.
    """
    if not anchors_raw or fit.get("mode") != "anchor":
        return {}
    W, H = float(size[0]), float(size[1])
    s = float(fit["scale"])
    ax, ay, cx, cy = float(fit["ax"]), float(fit["ay"]), float(fit["cx"]), float(fit["cy"])
    out: Dict = {}
    if "belt_y" in anchors_raw:
        out["belt"] = round((cy - (ay - float(anchors_raw["belt_y"])) * s) / H, 4)
    if "hand" in anchors_raw:
        hx, hy = anchors_raw["hand"]
        out["hand"] = [round((cx + (float(hx) - ax) * s) / W, 4), round((cy - (ay - float(hy)) * s) / H, 4)]
    if "foot" in anchors_raw:
        fx, fy = anchors_raw["foot"]
        out["foot"] = [round((cx + (float(fx) - ax) * s) / W, 4), round((cy - (ay - float(fy)) * s) / H, 4)]
    if "unit_h" in anchors_raw:
        out["unit"] = round(float(anchors_raw["unit_h"]) * s / H, 4)
    return out


# --------------------------------------------------------------------------- #
# 2. Ajuste al lienzo del contrato                                              #
# --------------------------------------------------------------------------- #

def alpha_bbox(im: Image.Image, thr: int = 10) -> Optional[Tuple[int, int, int, int]]:
    a = np.asarray(im.getchannel("A"))
    ys, xs = np.where(a > thr)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def _resize_premult(im: Image.Image, size: Tuple[int, int]) -> Image.Image:
    """Reescalado Lanczos con alfa premultiplicado (sin halos en el borde)."""
    size = (max(1, int(round(size[0]))), max(1, int(round(size[1]))))
    return im.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def _sharpen(im: Image.Image, amount: int) -> Image.Image:
    if amount <= 0:
        return im
    rgb = im.convert("RGB").filter(ImageFilter.UnsharpMask(radius=0.7, percent=amount, threshold=1))
    out = rgb.convert("RGBA")
    out.putalpha(im.getchannel("A"))
    return out


def fit_canvas(im: Image.Image, size: Tuple[int, int], fit: Optional[Dict] = None) -> Tuple[Image.Image, Dict]:
    """
    fit = {
      "mode":   "contain" (por defecto) | "figure" | "cover" | "stretch",
      "margin": px libres alrededor (contain),
      "anchor": "center" | "bottom" | "top" | "left" | "right",
      # mode "figure" (personajes que comparten escala entre fotogramas):
      "height": alto en px que debe ocupar la figura de cabeza a pies,
      "baseline": y (px) donde apoyan los pies,
      "align": "bbox" | "hip"  (hip = centra la cadera en el eje del lienzo, para el corte de cintura)
      "hip_band": [0.50, 0.60] fracción de la altura de la figura usada para medir la cadera,
      "dx": desplazamiento manual en px,
      "sharpen": % de máscara de enfoque tras reducir (0 = no)
    }
    """
    fit = dict(fit or {})
    W, H = int(size[0]), int(size[1])
    mode = fit.get("mode", "contain")
    sharpen = int(fit.get("sharpen", 35))
    info: Dict = {"mode": mode}

    if mode in ("cover", "stretch"):
        src = im.convert("RGBA")
        if mode == "cover":
            s = max(W / src.width, H / src.height)
            r = _resize_premult(src, (src.width * s, src.height * s))
            x0 = (r.width - W) // 2
            y0 = (r.height - H) // 2
            out = r.crop((x0, y0, x0 + W, y0 + H))
        else:
            out = _resize_premult(src, (W, H))
        return _sharpen(out, sharpen), info

    bb = alpha_bbox(im)
    if bb is None:
        raise RuntimeError("asset vacío tras el mate alfa")
    sub = im.crop(bb)
    bw, bh = sub.size
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    if mode == "anchor":
        # Colocación explícita: el punto (ax, ay) del maestro cae en (cx, cy) del lienzo
        # con una escala común `scale`. Es el modo de los fotogramas de un mismo
        # personaje: misma escala, misma línea de suelo y mismo eje de cadera.
        s = float(fit["scale"])
        r = _resize_premult(sub, (bw * s, bh * s))
        x = int(round(float(fit["cx"]) - (float(fit["ax"]) - bb[0]) * s))
        y = int(round(float(fit["cy"]) - (float(fit["ay"]) - bb[1]) * s))
        inside = (0 <= x and 0 <= y and x + r.width <= W and y + r.height <= H)
        if inside:
            canvas.alpha_composite(r, (x, y))
        else:
            _paste_clipped(canvas, r, x, y)
        info.update({"scale": round(s, 4), "x": x, "y": y, "w": r.width, "h": r.height, "clipped": not inside,
                     "free": [x, y, W - (x + r.width), H - (y + r.height)]})
        return _sharpen(canvas, sharpen), info

    if mode == "figure":
        target_h = float(fit.get("height", H - 12))
        s = target_h / bh
        r = _resize_premult(sub, (bw * s, bh * s))
        baseline = int(fit.get("baseline", H - 6))
        if fit.get("align", "hip") == "hip":
            lo, hi = fit.get("hip_band", [0.50, 0.60])
            a = np.asarray(r.getchannel("A"), dtype=np.float32)
            band = a[int(r.height * lo):int(r.height * hi)]
            cols = band.sum(axis=0)
            cx = float((cols * np.arange(r.width)).sum() / max(cols.sum(), 1e-6))
        else:
            cx = r.width / 2.0
        x = int(round(W / 2.0 - cx)) + int(fit.get("dx", 0))
        y = baseline - r.height + int(fit.get("dy", 0))
        info.update({"scale": round(s, 4), "x": x, "y": y, "w": r.width, "h": r.height, "hip_cx": round(cx, 1)})
        canvas.alpha_composite(r, (x, y)) if (0 <= x and 0 <= y and x + r.width <= W and y + r.height <= H) else _paste_clipped(canvas, r, x, y)
        info["clipped"] = not (0 <= x and 0 <= y and x + r.width <= W and y + r.height <= H)
        return _sharpen(canvas, sharpen), info

    margin = int(fit.get("margin", 4))
    s = min((W - 2 * margin) / bw, (H - 2 * margin) / bh)
    if not fit.get("upscale", True):
        s = min(s, 1.0)
    r = _resize_premult(sub, (bw * s, bh * s))
    anchor = fit.get("anchor", "center")
    x = (W - r.width) // 2
    y = (H - r.height) // 2
    if anchor == "bottom":
        y = H - margin - r.height
    elif anchor == "top":
        y = margin
    elif anchor == "left":
        x = margin
    elif anchor == "right":
        x = W - margin - r.width
    x += int(fit.get("dx", 0))
    y += int(fit.get("dy", 0))
    canvas.alpha_composite(r, (x, y))
    info.update({"scale": round(s, 4), "x": x, "y": y, "w": r.width, "h": r.height})
    return _sharpen(canvas, sharpen), info


def _paste_clipped(canvas: Image.Image, r: Image.Image, x: int, y: int) -> None:
    W, H = canvas.size
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + r.width), min(H, y + r.height)
    if x1 <= x0 or y1 <= y0:
        return
    canvas.alpha_composite(r.crop((x0 - x, y0 - y, x1 - x, y1 - y)), (x0, y0))


# --------------------------------------------------------------------------- #
# 3. Guardado + control de calidad                                              #
# --------------------------------------------------------------------------- #

def clean_transparent_rgb(im: Image.Image) -> Image.Image:
    """Pone a negro el RGB de los píxeles totalmente transparentes (PNG más pequeño, sin basura)."""
    arr = np.asarray(im.convert("RGBA")).copy()
    arr[arr[..., 3] == 0, :3] = 0
    return Image.fromarray(arr, "RGBA")


def save_png(im: Image.Image, path: str) -> Dict:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    im = clean_transparent_rgb(im) if im.mode == "RGBA" else im
    im.save(path, "PNG", optimize=True)
    data = open(path, "rb").read()
    return {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def save_master_webp(im: Image.Image, path: str, max_side: Optional[int] = None, quality: int = 92, crop: bool = False) -> int:
    """
    Archiva el maestro YA RECORTADO DEL CROMA (RGBA) en WebP: color con pérdida a
    calidad alta y alfa sin pérdida. Por defecto conserva el CUADRO COMPLETO del
    maestro, sin recortar ni reescalar: las medidas del lote (fit.ax / fit.ay,
    anchors_raw, polígonos keep/erase) están en píxeles de ese cuadro, así que el
    repositorio puede volver a generar los PNG finales sin el PNG croma original.
    """
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    src = im
    if crop:
        bb = alpha_bbox(im) if im.mode == "RGBA" else None
        src = im.crop(bb) if bb else im
    if max_side and max(src.size) > max_side:
        s = max_side / max(src.size)
        src = _resize_premult(src, (src.width * s, src.height * s)) if src.mode == "RGBA" else src.resize((int(src.width * s), int(src.height * s)), Image.Resampling.LANCZOS)
    if src.mode == "RGBA":
        src = clean_transparent_rgb(src)
    src.save(path, "WEBP", quality=quality, method=6, exact=False)
    return os.path.getsize(path)


def qc_metrics(im: Image.Image) -> Dict:
    """Comprobaciones automáticas por asset (el control visual va aparte, con hojas de contacto)."""
    arr = np.asarray(im.convert("RGBA")).astype(np.float32) / 255.0
    a = arr[..., 3]
    rgb = arr[..., :3]
    vis = a > 0.05
    out: Dict = {"size": list(im.size)}
    if vis.sum() == 0:
        out["empty"] = True
        return out
    out["coverage_pct"] = round(float(vis.mean() * 100), 1)
    out["mean_alpha_visible"] = round(float(a[vis].mean()), 3)
    # 'fantasma': silueta casi toda semitransparente
    out["ghost"] = bool(a[vis].mean() < 0.72)
    # resto de croma verde visible
    g_dom = rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2])
    out["green_spill_pct"] = round(float(((g_dom > 0.22) & vis).sum() / vis.sum() * 100), 2)
    # ¿toca el borde del lienzo? (posible recorte)
    out["touches_edge"] = bool(vis[0].any() or vis[-1].any() or vis[:, 0].any() or vis[:, -1].any())
    # damero de transparencia falso horneado en la imagen (defecto visto en la línea anterior)
    grey = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    lightgrey = (grey > 0.72) & (sat < 0.06) & vis
    out["baked_checker_suspect"] = bool(lightgrey.sum() / max(1, vis.sum()) > 0.22)
    return out
