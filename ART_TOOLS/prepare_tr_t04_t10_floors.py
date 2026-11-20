#!/usr/bin/env python3
"""TOTAL ART REBUILD — TR_T04..TR_T10 (círculos III–IX), clase B: regenera en su sitio.
Uso: python3 ART_TOOLS/prepare_tr_t04_t10_floors.py"""
import importlib.util, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("asset_pipeline", os.path.join(ROOT, "tools", "asset_pipeline.py"))
ap = importlib.util.module_from_spec(spec); sys.modules["asset_pipeline"] = ap; spec.loader.exec_module(ap)

JOBS = [
    ("prop_barrel_infernal",      "/tmp/dd_raw/tr_t03/prop_barrel_infernal.png",   "assets/props/prop_barrel_infernal.png",   "rgba",  (224, 256), True,  "bottom-center"),
    ("floor_03_greed_slate_gold", "/tmp/dd_raw/tr_t04/floor_03_greed_slate_gold.png","assets/floors/floor_03_greed_slate_gold.png","floor",(512, 512), False, "top-left"),
    ("floor_04_wrath_burgundy",   "/tmp/dd_raw/tr_t05/floor_04_wrath_burgundy.png", "assets/floors/floor_04_wrath_burgundy.png","floor",(512, 512), False, "top-left"),
    ("wall_wrath_furnace",        "/tmp/dd_raw/tr_t05/wall_wrath_furnace.png",     "assets/walls/wall_wrath_furnace.png",     "rgba",  (256, 384), True,  "bottom-center"),
    ("floor_05_pride_obsidian_gold","/tmp/dd_raw/tr_t06/floor_05_pride_obsidian_gold.png","assets/floors/floor_05_pride_obsidian_gold.png","floor",(512, 512), False, "top-left"),
    ("floor_06_violence_ash_slabs","/tmp/dd_raw/tr_t07/floor_06_violence_ash_slabs.png","assets/floors/floor_06_violence_ash_slabs.png","floor",(512, 512), False, "top-left"),
    ("floor_07_envy_travertine",  "/tmp/dd_raw/tr_t08/floor_07_envy_travertine.png","assets/floors/floor_07_envy_travertine.png","floor",(512, 512), False, "top-left"),
    ("floor_08_ice_abyssal",      "/tmp/dd_raw/tr_t09/floor_08_ice_abyssal.png",   "assets/floors/floor_08_ice_abyssal.png",  "floor",(512, 512), False, "top-left"),
    ("wall_ice_glacier",          "/tmp/dd_raw/tr_t09/wall_ice_glacier.png",       "assets/walls/wall_ice_glacier.png",       "rgba",  (256, 384), True,  "bottom-center"),
    ("floor_09_core_cosmic_vein", "/tmp/dd_raw/tr_t10/floor_09_core_cosmic_vein.png","assets/floors/floor_09_core_cosmic_vein.png","floor",(512, 512), False, "top-left"),
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
        Image.open(dest).save(f"/tmp/tr_t_backup_{asset_id}.png")
    ap.save_optimized_png(final, dest, alpha)
    print(f"OK {asset_id} -> {dest_rel} {final.size[0]}x{final.size[1]} {os.path.getsize(dest)/1024:.1f}KB trans={trans} opaque={opaque}")
