#!/usr/bin/env python3
"""TOTAL ART REBUILD — TR_W2 (props del HUB, clase B: regenera en su sitio).
Uso: python3 ART_TOOLS/prepare_tr_w2_hub_props.py
Materias primas: /tmp/dd_raw/tr_w2/<id>.png
Nota: fondo verde #00ff00 para sujetos oscuros (extract_clean_rgba rama chroma).
"""
import importlib.util, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("asset_pipeline", os.path.join(ROOT, "tools", "asset_pipeline.py"))
ap = importlib.util.module_from_spec(spec); sys.modules["asset_pipeline"] = ap; spec.loader.exec_module(ap)
RAW = "/tmp/dd_raw/tr_w2"

JOBS = [
    ("prop_bar_counter",      "assets/props/prop_bar_counter.png",      (416, 256), "bottom-center"),
    ("prop_dj_booth",         "assets/props/prop_dj_booth.png",         (448, 288), "bottom-center"),
    ("prop_speaker_tower",    "assets/props/prop_speaker_tower.png",    (224, 384), "bottom-center"),
    ("prop_subwoofer_cyan",   "assets/props/prop_subwoofer_cyan.png",   (256, 352), "bottom-center"),
    ("prop_chandelier_gold",  "assets/props/prop_chandelier_gold.png",  (320, 320), "center"),
    ("prop_candelabra_floor", "assets/props/prop_candelabra_floor.png", (192, 320), "bottom-center"),
    ("prop_sofa_black",       "assets/props/prop_sofa_black.png",       (384, 256), "bottom-center"),
    ("prop_bookshelf_hub",    "assets/props/prop_bookshelf_hub.png",    (320, 384), "bottom-center"),
    ("prop_cooler_neon",      "assets/props/prop_cooler_neon.png",      (224, 352), "bottom-center"),
    ("prop_gothic_statue",    "assets/props/prop_gothic_statue.png",    (224, 384), "bottom-center"),
]
missing = [a for a, *_ in JOBS if not os.path.isfile(f"{RAW}/{a}.png")]
if missing:
    sys.exit(f"Faltan materias primas en {RAW}: {', '.join(missing)}")
for asset_id, dest_rel, target, pivot in JOBS:
    im = Image.open(f"{RAW}/{asset_id}.png").convert("RGBA")
    clean = ap.extract_clean_rgba(im)
    final = ap.fit_rgba_to_canvas(clean, target[0], target[1], pivot)
    arr = np.array(final)
    trans = int((arr[:, :, 3] == 0).sum()); opaque = int((arr[:, :, 3] > 200).sum())
    if trans < 50 or opaque < 50:
        raise RuntimeError(f"alpha check failed for {asset_id}: trans={trans} opaque={opaque}")
    dest = os.path.join(ROOT, dest_rel)
    if os.path.isfile(dest):
        Image.open(dest).save(f"/tmp/tr_w2_backup_{asset_id}.png")
    ap.save_optimized_png(final, dest, True)
    print(f"OK {asset_id} -> {dest_rel} {final.size[0]}x{final.size[1]} {os.path.getsize(dest)/1024:.1f}KB trans={trans} opaque={opaque}")
