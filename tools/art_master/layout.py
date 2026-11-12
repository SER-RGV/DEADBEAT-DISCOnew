#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEADBEAT DISCO — ART PRODUCTION MASTER · colocación de figuras completas (jefes, PNJ)

    layout.py <tanda.json> [--only id,id] [--ppu 2.8] [--pad 8] [--write] [--raw DIR]

Lee la clave `layout` de cada asset de la tanda y calcula `size`, `fit` y
`anchors_raw` con el mismo contrato que los enemigos de R02 (ver README):

    anchors.foot   punto de apoyo: eje del cuerpo sobre la línea de suelo
    anchors.unit   alto de la FIGURA DE REFERENCIA como fracción del lienzo

Cada personaje es su propia familia. Su fotograma de referencia (el reposo) fija la
escala; los demás estados la heredan, corregida por K si el generador los devolvió a
otro tamaño:

    "layout": {"unit_world": 196, "ax": 480}                      referencia
    "layout": {"unit_world": 190, "ax": 520, "unit_rows": [32, 969]}
                                    la figura de referencia no es toda la tinta (aquí
                                    se excluyen los cables que suben por encima del aro)
    "layout": {"ref": "boss_00_anden_idle", "k": 0.861, "ax": 484}  estado derivado

    unit_world  alto de la figura de referencia en px de mundo
    ax          eje de apoyo en px del maestro (sin él: centroide del 60 % inferior)
    ay          línea de suelo en px del maestro (sin ella: fila más baja con tinta)
    k           cuántas veces mide este maestro respecto al de referencia
    ref         id del asset de referencia

Se mide sobre el maestro DESPUÉS de las limpiezas del asset (`erase`, `keep`,
`ground_line`, `fade`) y de `flip_x`, igual que hace `batch.py process`.
Sin `--write` sólo imprime; con `--write` actualiza el JSON de la tanda.
"""
import argparse
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import numpy as np            # noqa: E402
from PIL import Image         # noqa: E402

import artlib                 # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MASTERS_DIR = os.path.join(ROOT, "ART_ASSETS", "rebuild_masters")
DEFAULT_RAW_ROOT = os.environ.get("DD_RAW_ROOT", "/home/user/dd_work/raw")


def load_clean(batch, asset, raw_dir):
    """Maestro del asset ya recortado del croma y con sus limpiezas aplicadas."""
    raw_name = asset.get("raw", asset["id"] + ".png")
    raw = os.path.join(raw_dir, raw_name)
    mpath = os.path.join(MASTERS_DIR, batch["batch"], os.path.splitext(raw_name)[0] + ".webp")
    if os.path.exists(raw):
        keyed, _ = artlib.chroma_matte(Image.open(raw), key=asset.get("key", "green"), mode=asset.get("matte", "hard"),
                                       band=int(asset.get("band", 3)), despill_all=bool(asset.get("despill_all", False)))
    elif os.path.exists(mpath):
        keyed = Image.open(mpath)
    else:
        raise SystemExit("%s: no hay maestro (%s ni %s)" % (asset["id"], raw, mpath))
    keyed, _ = artlib.apply_cleanup(keyed.convert("RGBA"), asset)
    if asset.get("flip_x"):
        keyed = keyed.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return keyed.convert("RGBA")


def facts(im):
    a = np.asarray(im.getchannel("A"), dtype=np.float32)
    ys, xs = np.where(a > 10)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
    cut = y0 + int((y1 - y0) * 0.40)
    cols = a[cut:y1].sum(axis=0)
    ax = float((cols * np.arange(a.shape[1])).sum() / max(cols.sum(), 1e-6))
    return {"bbox": [x0, y0, x1, y1], "ax": round(ax, 1), "ay": y1}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("batch")
    ap.add_argument("--only", default="")
    ap.add_argument("--ppu", type=float, default=None, help="texeles por px de mundo (por defecto, layout_defaults.ppu de la tanda o 2.8)")
    ap.add_argument("--pad", type=int, default=None)
    ap.add_argument("--raw", default=None)
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    with open(args.batch, encoding="utf-8") as fh:
        b = json.load(fh)
    defaults = b.get("defaults", {})
    ld = b.get("layout_defaults", {})
    ppu = float(args.ppu if args.ppu is not None else ld.get("ppu", 2.8))
    pad = int(args.pad if args.pad is not None else ld.get("pad", 8))
    raw_dir = args.raw or os.path.join(DEFAULT_RAW_ROOT, b["batch"])
    want = set(args.only.split(",")) if args.only else None
    by_id = {a["id"]: a for a in b["assets"]}

    family = {}     # id de referencia -> {"scale", "unit_h"}

    def family_of(ref_id):
        if ref_id in family:
            return family[ref_id]
        ra = by_id.get(ref_id)
        if ra is None or "layout" not in ra or "unit_world" not in ra["layout"]:
            raise SystemExit("referencia '%s' sin layout.unit_world" % ref_id)
        merged = dict(defaults)
        merged.update(ra)
        f = facts(load_clean(b, merged, raw_dir))
        rows = ra["layout"].get("unit_rows") or [f["bbox"][1], f["bbox"][3]]
        unit_h = float(rows[1] - rows[0])
        family[ref_id] = {"scale": ra["layout"]["unit_world"] * ppu / unit_h, "unit_h": unit_h}
        return family[ref_id]

    out = {}
    for raw_asset in b["assets"]:
        lay = raw_asset.get("layout")
        if not lay or (want and raw_asset["id"] not in want):
            continue
        a = dict(defaults)
        a.update(raw_asset)
        ref_id = lay.get("ref") or raw_asset["id"]
        fam = family_of(ref_id)
        k = float(lay.get("k", 1.0))
        im = load_clean(b, a, raw_dir)
        f = facts(im)
        ax = float(lay["ax"]) if "ax" in lay else f["ax"]
        ay = float(lay["ay"]) if "ay" in lay else float(f["ay"])
        fscale = round(fam["scale"] / k, 4)
        funit = round(fam["unit_h"] * k, 1)
        x0, y0, x1, y1 = f["bbox"]
        left, right = (ax - x0) * fscale, (x1 - ax) * fscale
        up, down = (ay - y0) * fscale, max(0.0, (y1 - ay) * fscale)
        W = int(math.ceil((left + right + 2 * pad) / 16.0) * 16)
        H = int(math.ceil((up + down + 2 * pad) / 16.0) * 16)
        cx = int(round(pad + left + (W - (left + right + 2 * pad)) / 2.0))
        cy = int(round(H - pad - down))
        res = {
            "size": [W, H],
            "fit": {"mode": "anchor", "scale": fscale, "ax": round(ax, 1), "ay": round(ay, 1), "cx": cx, "cy": cy, "sharpen": 30},
            "anchors_raw": {"foot": [round(ax, 1), round(ay, 1)], "unit_h": funit},
        }
        out[raw_asset["id"]] = dict(res, _bbox=f["bbox"], _ax_auto=f["ax"], _figure_px=[round((x1 - x0) * fscale), round((y1 - y0) * fscale)],
                                    _unit_px=round(funit * fscale, 1), _unit=round(funit * fscale / H, 4))
        if args.write:
            raw_asset.update(res)
        print("%-30s lienzo %4dx%-4d escala %.4f  figura %4dx%-4d  unidad %.1f px (%.3f del alto)  eje %.1f (auto %.1f)" % (
            raw_asset["id"], W, H, fscale, out[raw_asset["id"]]["_figure_px"][0], out[raw_asset["id"]]["_figure_px"][1],
            funit * fscale, funit * fscale / H, ax, f["ax"]))
    if args.write:
        with open(args.batch, "w", encoding="utf-8") as fh:
            json.dump(b, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        print("escrito:", args.batch)
    else:
        print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
