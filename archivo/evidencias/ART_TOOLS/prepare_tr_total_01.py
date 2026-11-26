#!/usr/bin/env python3
"""
TOTAL ART REBUILD — Tanda TR_T01 (HUB, incremento 1)
Postprocesa las fuentes crudas de /tmp/dd_raw/tr_total_01/ al formato de
producción del proyecto y las registra en el manifiesto.

Uso:  python3 ART_TOOLS/prepare_tr_total_01.py
"""
import hashlib
import importlib.util
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = "/tmp/dd_raw/tr_total_01"

spec = importlib.util.spec_from_file_location("asset_pipeline", os.path.join(ROOT, "tools", "asset_pipeline.py"))
ap = importlib.util.module_from_spec(spec)
sys.modules["asset_pipeline"] = ap
spec.loader.exec_module(ap)

JOBS = [
    {
        "id": "hub_floor_main",
        "src": os.path.join(RAW, "hub_floor_main.png"),
        "dest": "assets/floors/hub_floor_main.png",
        "kind": "floor",
        "target": (512, 512),
        "alpha": False,
        "pivot": "top-left",
        "name": "Suelo HUB · Damero negro y granate con filete magenta (Refugio)",
        "category": "floors",
        "original_id": "hub:floor_main",
    },
    {
        "id": "hub_portal_frame",
        "src": os.path.join(RAW, "hub_portal_frame.png"),
        "dest": "assets/props/hub_portal_frame.png",
        "kind": "rgba",
        "target": (256, 384),
        "alpha": True,
        "pivot": "bottom-center",
        "name": "Arco portal de círculo · Obsidiana gótica con circuitos (HUB)",
        "category": "props",
        "original_id": "hub:portal_frame",
    },
]

report = []
for job in JOBS:
    im = Image.open(job["src"])
    if job["kind"] == "floor":
        final = ap.make_seamless_tile(im, job["target"][0], job["target"][1])
        trans_px = 0
        opaque_px = int(final.size[0] * final.size[1])
    else:
        clean = ap.extract_clean_rgba(im.convert("RGBA"))
        final = ap.fit_rgba_to_canvas(clean, job["target"][0], job["target"][1], job["pivot"])
        arr = np.array(final)
        trans_px = int(np.sum(arr[:, :, 3] == 0))
        opaque_px = int(np.sum(arr[:, :, 3] > 200))
        if trans_px < 50 or opaque_px < 50:
            raise RuntimeError(f"Alpha check failed for {job['id']}: trans={trans_px} opaque={opaque_px}")
    dest = os.path.join(ROOT, job["dest"])
    ap.save_optimized_png(final, dest, job["alpha"])
    with open(dest, "rb") as bf:
        sha = hashlib.sha256(bf.read()).hexdigest()
    # Esquinas: opacas en suelos, transparentes en props
    a = np.array(Image.open(dest).convert("RGBA"))
    corners = [tuple(a[0, 0]), tuple(a[0, -1]), tuple(a[-1, 0]), tuple(a[-1, -1])]
    report.append({
        "id": job["id"], "dest": job["dest"], "size": list(final.size),
        "bytes": os.path.getsize(dest), "sha256": sha,
        "alpha_px": {"transparent": trans_px, "opaque": opaque_px},
        "corners": [[int(v) for v in c[:3]] + [int(c[3])] for c in corners],
    })
    print(f"OK {job['id']} -> {job['dest']} {final.size[0]}x{final.size[1]} "
          f"{os.path.getsize(dest)/1024:.1f}KB sha256={sha[:16]} corners={corners}")

# Registro en MASTER_INVENTORY.json (idempotente por id)
inv_path = os.path.join(ROOT, "docs", "ART_REBUILD", "MASTER_INVENTORY.json")
inv = json.load(open(inv_path, encoding="utf-8"))
existing = {a["id"] for a in inv["assets"]}
added = 0
for job in JOBS:
    if job["id"] in existing:
        continue
    inv["assets"].append({
        "index": len(inv["assets"]) + 1,
        "tanda": "TR_T01",
        "tanda_number": 101,
        "original_id": job["original_id"],
        "id": job["id"],
        "name": job["name"],
        "category": job["category"],
        "location": job["dest"],
        "dimensions": list(job["target"]),
        "alpha": job["alpha"],
        "pivot": job["pivot"],
        "dependencies": [],
        "code_references": ["src/dd_hub_system.js", "src/dd_world_renderer.js"],
        "reference_source": "ART_REFERENCES/2026-11-TOTAL/Mapa del Hub Neon-Cybergótico del Disco Infernal.png",
        "prompt_spec": "Deadbeat Disco total reconstruction · HUB increment 1",
        "reconstruction_status": "DONE",
        "integration_status": "PENDING_RUNTIME_CHECK",
        "validation_status": "PENDING_BROWSER",
        "sha256": next(r["sha256"] for r in report if r["id"] == job["id"]),
        "bytes": next(r["bytes"] for r in report if r["id"] == job["id"]),
    })
    added += 1
if added:
    inv["total_assets"] = inv["total_assets"] + added
    inv["updated_at"] = "2026-11-15T00:00:00Z"
    inv["categories_summary"]["floors"] = inv["categories_summary"].get("floors", 0) + (1 if any(j["category"] == "floors" for j in JOBS) else 0)
    inv["categories_summary"]["props"] = inv["categories_summary"].get("props", 0) + (1 if any(j["category"] == "props" for j in JOBS) else 0)
    json.dump(inv, open(inv_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"MASTER_INVENTORY: +{added} assets (total_planned={inv['total_assets']})")

with open(os.path.join(ROOT, "docs", "TOTAL_ART_REBUILD", "TR_T01_report.json"), "w", encoding="utf-8") as f:
    json.dump({"tanda": "TR_T01", "date": "2026-11-15", "assets": report}, f, ensure_ascii=False, indent=2)
print("report -> docs/TOTAL_ART_REBUILD/TR_T01_report.json")
