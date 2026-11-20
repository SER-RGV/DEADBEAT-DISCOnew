#!/usr/bin/env python3
"""TOTAL ART REBUILD — TR_T03 (Círculo II Gula), clase B: regenera en su sitio.
Uso: python3 ART_TOOLS/prepare_tr_t03_gula.py"""
import importlib.util, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = "/tmp/dd_raw/tr_t03"
spec = importlib.util.spec_from_file_location("asset_pipeline", os.path.join(ROOT, "tools", "asset_pipeline.py"))
ap = importlib.util.module_from_spec(spec); sys.modules["asset_pipeline"] = ap; spec.loader.exec_module(ap)

JOBS = [
    ("floor_02_gula_terracotta", f"{RAW}/floor_02_gula_terracotta.png", "assets/floors/floor_02_gula_terracotta.png", "floor", (512, 512), False, "top-left"),
    ("wall_gula_banquet",        f"{RAW}/wall_gula_banquet.png",        "assets/walls/wall_gula_banquet.png",        "rgba",  (256, 384), True,  "bottom-center"),
    ("prop_banquet_table",       f"{RAW}/prop_banquet_table.png",       "assets/props/prop_banquet_table.png",       "rgba",  (416, 288), True,  "bottom-center"),
]
for asset_id, raw, dest_rel, kind, target, alpha, pivot in JOBS:
    im = Image.open(raw)
    if kind == "floor":
        final = ap.make_seamless_tile(im, target[0], target[1])
        trans = 0; opaque = final.size[0] * final.size[1]
    else:
        clean = ap.extract_clean_rgba(im.convert("RGBA"))
        final = ap.fit_rgba_to_canvas(clean, target[0], target[1], pivot)
        arr = np.array(final)
        trans = int((arr[:, :, 3] == 0).sum()); opaque = int((arr[:, :, 3] > 200).sum())
        if trans < 50 or opaque < 50:
            raise RuntimeError(f"alpha check failed for {asset_id}: trans={trans} opaque={opaque}")
    dest = os.path.join(ROOT, dest_rel)
    if os.path.isfile(dest):
        Image.open(dest).save(f"/tmp/tr_t03_backup_{asset_id}.png")
    ap.save_optimized_png(final, dest, alpha)
    print(f"OK {asset_id} -> {dest_rel} {final.size[0]}x{final.size[1]} {os.path.getsize(dest)/1024:.1f}KB trans={trans} opaque={opaque}")
