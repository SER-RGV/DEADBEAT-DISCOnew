#!/usr/bin/env python3
"""TOTAL ART REBUILD — TR_T02 (Círculo I Lujuria): regenera en su sitio (clase B)
floor_01_lust_dancefloor, wall_panel_neon_crown, prop_sofa_magenta, prop_mirror_baroque.
Uso: python3 ART_TOOLS/prepare_tr_t02_lujuria.py
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = "/tmp/dd_raw/tr_t02"
spec = importlib.util.spec_from_file_location("asset_pipeline", os.path.join(ROOT, "tools", "asset_pipeline.py"))
ap = importlib.util.module_from_spec(spec); sys.modules["asset_pipeline"] = ap; spec.loader.exec_module(ap)

JOBS = [
    ("floor_01_lust_dancefloor", f"{RAW}/floor_01_lust_dancefloor.png", "assets/floors/floor_01_lust_dancefloor.png", "floor", (512, 512), False, "top-left"),
    ("wall_panel_neon_crown",    f"{RAW}/wall_panel_neon_crown.png",    "assets/walls/wall_panel_neon_crown.png",    "rgba",  (256, 384), True,  "bottom-center"),
    ("prop_sofa_magenta",        f"{RAW}/prop_sofa_magenta.png",        "assets/props/prop_sofa_magenta.png",        "rgba",  (384, 256), True,  "bottom-center"),
    ("prop_mirror_baroque",      f"{RAW}/prop_mirror_baroque.png",      "assets/props/prop_mirror_baroque.png",      "rgba",  (224, 384), True,  "bottom-center"),
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
    # Respaldo del bitmap anterior en /tmp (el historial queda en git)
    if os.path.isfile(dest):
        Image.open(dest).save(f"/tmp/tr_t02_backup_{asset_id}.png")
    ap.save_optimized_png(final, dest, alpha)
    print(f"OK {asset_id} -> {dest_rel} {final.size[0]}x{final.size[1]} {os.path.getsize(dest)/1024:.1f}KB trans={trans} opaque={opaque}")
