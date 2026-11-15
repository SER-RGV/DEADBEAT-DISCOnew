#!/usr/bin/env python3
"""TOTAL ART REBUILD — TR_W1 (paredes/suelos/portales/puertas, clase B: regenera en su sitio).
Uso: python3 ART_TOOLS/prepare_tr_w1_walls.py
Las materias primas se generan con generate_image a /tmp/dd_raw/tr_w1/<id>.png
"""
import importlib.util, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("asset_pipeline", os.path.join(ROOT, "tools", "asset_pipeline.py"))
ap = importlib.util.module_from_spec(spec); sys.modules["asset_pipeline"] = ap; spec.loader.exec_module(ap)
RAW = "/tmp/dd_raw/tr_w1"

JOBS = [
    ("floor_00_limbo_marble",   f"{RAW}/floor_00_limbo_marble.png",   "assets/floors/floor_00_limbo_marble.png",             "floor", (512, 512), False, "top-left"),
    ("wall_pillar_obsidian",    f"{RAW}/wall_pillar_obsidian.png",    "assets/walls/wall_pillar_obsidian.png",                "rgba",  (192, 384), True,  "bottom-center"),
    ("wall_panel_gothic_niche", f"{RAW}/wall_panel_gothic_niche.png", "assets/walls/wall_panel_gothic_niche.png",             "rgba",  (256, 384), True,  "bottom-center"),
    ("wall_panel_heavy_base",   f"{RAW}/wall_panel_heavy_base.png",   "assets/walls/wall_panel_heavy_base.png",               "rgba",  (256, 384), True,  "bottom-center"),
    ("wall_panel_vip_window",   f"{RAW}/wall_panel_vip_window.png",   "assets/walls/wall_panel_vip_window.png",               "rgba",  (256, 384), True,  "bottom-center"),
    ("wall_core_monolith",      f"{RAW}/wall_core_monolith.png",      "assets/walls/wall_core_monolith.png",                  "rgba",  (256, 384), True,  "bottom-center"),
    ("threshold_descent_pad",   f"{RAW}/threshold_descent_pad.png",   "assets/environments/threshold_descent_pad.png",         "rgba",  (512, 320), True,  "center"),
    ("portal_avaricia_gold",    f"{RAW}/portal_avaricia_gold.png",    "assets/environments/portal_avaricia_gold.png",          "rgba",  (320, 384), True,  "bottom-center"),
    ("door_gothic_closed",      f"{RAW}/door_gothic_closed.png",      "assets/environments/door_gothic_closed.png",            "rgba",  (320, 384), True,  "bottom-center"),
    ("door_gothic_open",        f"{RAW}/door_gothic_open.png",        "assets/environments/door_gothic_open.png",              "rgba",  (320, 384), True,  "bottom-center"),
    ("portal_baroque_gold",     f"{RAW}/portal_baroque_gold.png",     "assets/environments/portal_baroque_gold.png",           "rgba",  (320, 416), True,  "bottom-center"),
    ("door_arched_open",        f"{RAW}/door_arched_open.png",        "assets/environments/door_arched_open.png",              "rgba",  (320, 384), True,  "bottom-center"),
    ("door_stained_closed",     f"{RAW}/door_stained_closed.png",     "assets/environments/door_stained_closed.png",           "rgba",  (320, 384), True,  "bottom-center"),
    ("door_vip_crimson",        f"{RAW}/door_vip_crimson.png",        "assets/environments/door_vip_crimson.png",              "rgba",  (288, 384), True,  "bottom-center"),
    ("floor_10_hub_checker",    f"{RAW}/floor_10_hub_checker.png",    "assets/floors/floor_10_hub_checker.png",                "floor", (512, 512), False, "top-left"),
]
missing = [a for a, raw, *_ in JOBS if not os.path.isfile(raw)]
if missing:
    sys.exit(f"Faltan materias primas en {RAW}: {', '.join(missing)}")
for asset_id, raw, dest_rel, kind, target, alpha, pivot in JOBS:
    im = Image.open(raw)
    if kind == "floor":
        final = ap.make_seamless_tile(im, target[0], target[1])
        trans = 0
    else:
        clean = ap.extract_clean_rgba(im.convert("RGBA"))
        final = ap.fit_rgba_to_canvas(clean, target[0], target[1], pivot)
        arr = np.array(final)
        trans = int((arr[:, :, 3] == 0).sum()); opaque = int((arr[:, :, 3] > 200).sum())
        if trans < 50 or opaque < 50:
            raise RuntimeError(f"alpha check failed for {asset_id}: trans={trans} opaque={opaque}")
    dest = os.path.join(ROOT, dest_rel)
    if os.path.isfile(dest):
        Image.open(dest).save(f"/tmp/tr_w1_backup_{asset_id}.png")
    ap.save_optimized_png(final, dest, alpha)
    print(f"OK {asset_id} -> {dest_rel} {final.size[0]}x{final.size[1]} {os.path.getsize(dest)/1024:.1f}KB trans={trans}")
