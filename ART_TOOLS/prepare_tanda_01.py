#!/usr/bin/env python3
"""Fase 1 · Tanda 01 — preparación técnica de assets.

Convierte las ilustraciones generadas (fondo negro) en sprites con alpha real,
recorte sin bordes residuales y escala EXACTAMENTE igual a la del asset al que
sustituyen en el motor. No modifica el juego; solo produce archivos + manifiesto.

Uso: python3 ART_TOOLS/prepare_tanda_01.py
"""
from PIL import Image, ImageFilter
from collections import deque
import pathlib, json, hashlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "ART_ASSETS" / "tanda_01" / "_source"
DST = ROOT / "ART_ASSETS" / "tanda_01"

# id del asset en el motor -> (archivo, dimensiones destino, modo, pivote)
SPEC = [
    # id, archivo, dimensiones, modo, pivote, umbral de fondo (max canal)
    ("t3b_material_00",             "floor_00_obsidian_vein.png",   (512, 512), "opaque", "tile",          10),
    ("t3b_material_01",             "floor_01_neon_dancefloor.png", (512, 512), "opaque", "tile",          10),
    ("t3b_material_02",             "floor_02_gilded_mosaic.png",   (512, 512), "opaque", "tile",          10),
    ("hub_fox_crest_emblem",        "hub_fox_crest_emblem.png",     (560, 332), "cutout", "center",        45),
    ("decor_neon_rug",              "decor_neon_rug.png",           (456, 243), "cutout", "bottom-center", 10),
    ("decor_potted_palm",           "decor_potted_palm.png",        (209, 147), "cutout", "bottom-center", 10),
    ("boss_01_anden",               "boss_01_anden.png",            (400, 386), "cutout", "bottom-center", 10),
    ("weapons/weapon_m1911.png",    "weapon_m1911.png",             (160,  87), "cutout", "center",        10),
]

BLACK_MAX = 10   # fondo negro puro; el negro INTERIOR del objeto (18-30) se conserva
HOLE_MIN = 1500  # bolsas negras cerradas grandes (p. ej. interior del halo) -> alpha 0


def cutout(im, thr=10):
    """Alpha real por inundación desde el borde: conserva los negros INTERIORES
    del objeto (cuero, pelo, acero) y elimina solo el fondo conectado."""
    w, h = im.size
    px = im.load()
    alpha = [[255] * w for _ in range(h)]
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            i = y * w + x
            if not seen[i] and max(px[x, y][:3]) <= thr:
                seen[i] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            i = y * w + x
            if not seen[i] and max(px[x, y][:3]) <= thr:
                seen[i] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        alpha[y][x] = 0
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if not seen[i] and max(px[nx, ny][:3]) <= thr:
                    seen[i] = 1
                    q.append((nx, ny))
    # Bolsas negras CERRADAS: solo se eliminan las grandes (interior de un halo);
    # las pequeñas son detalle negro del objeto y deben permanecer opacas.
    visited = bytearray(w * h)
    for sy in range(h):
        for sx in range(w):
            i = sy * w + sx
            if visited[i] or alpha[sy][sx] == 0 or max(px[sx, sy][:3]) > thr:
                continue
            comp = []
            q2 = deque([(sx, sy)])
            visited[i] = 1
            while q2:
                x, y = q2.popleft()
                comp.append((x, y))
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if not visited[j] and alpha[ny][nx] and max(px[nx, ny][:3]) <= thr:
                            visited[j] = 1
                            q2.append((nx, ny))
            if len(comp) >= HOLE_MIN:
                for x, y in comp:
                    alpha[y][x] = 0
    a = Image.new("L", (w, h))
    a.putdata([v for row in alpha for v in row])
    a = a.filter(ImageFilter.GaussianBlur(0.6))  # antialias suave del contorno
    out = im.convert("RGBA")
    out.putalpha(a)
    return out


def fit(im, size, mode, pivot):
    tw, th = size
    if mode == "opaque":
        return im.convert("RGB").resize((tw, th), Image.LANCZOS)
    bbox = im.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()
    if not bbox:
        raise RuntimeError("recorte vacío: el fondo no se pudo eliminar")
    obj = im.crop(bbox)
    ow, oh = obj.size
    scale = min(tw / ow, th / oh)
    nw, nh = max(1, round(ow * scale)), max(1, round(oh * scale))
    obj = obj.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    x = (tw - nw) // 2
    y = th - nh if pivot == "bottom-center" else (th - nh) // 2
    canvas.alpha_composite(obj, (x, y))
    return canvas


def alpha_stats(im):
    if im.mode != "RGBA":
        return {"alphaChannel": False, "transparentPx": 0, "opaquePx": im.width * im.height}
    a = im.getchannel("A").histogram()
    return {"alphaChannel": True, "transparentPx": a[0], "partialPx": sum(a[1:254]),
            "opaquePx": a[255], "coveragePct": round(100 * (sum(a[1:]) / (im.width * im.height)), 2)}


def main():
    DST.mkdir(parents=True, exist_ok=True)
    man = {"tanda": "01", "build": "DEADBEAT_DISCO.ART.html", "assets": []}
    for key, fname, size, mode, pivot, thr in SPEC:
        src = SRC / fname
        if not src.exists():  # tolerancia: fuentes junto a los destinos
            src = DST / fname
        raw = Image.open(src).convert("RGB")
        prepared = cutout(raw, thr) if mode == "cutout" else raw
        final = fit(prepared, size, mode, pivot)
        out = DST / fname
        final.save(out, "PNG", optimize=True)
        rec = {"id": key, "file": f"ART_ASSETS/tanda_01/{fname}",
               "source": str(src.relative_to(ROOT)), "sourceSize": list(raw.size),
               "width": final.width, "height": final.height, "mode": final.mode,
               "format": "PNG", "pivot": pivot, "kind": mode,
               "bytes": out.stat().st_size,
               "sha256": hashlib.sha256(out.read_bytes()).hexdigest()}
        rec.update(alpha_stats(final))
        man["assets"].append(rec)
        print(f"{key:34s} {final.width:4d}x{final.height:<4d} {final.mode:4s} "
              f"alpha={rec.get('transparentPx', 0):7d}px  {out.stat().st_size:7d}B")
    (DST / "manifest.json").write_text(json.dumps(man, indent=2, ensure_ascii=False), encoding="utf-8")
    print("manifiesto:", DST / "manifest.json")


if __name__ == "__main__":
    main()
