#!/usr/bin/env python3
"""
FASE 2 · planner.py

Lee docs/ASSET_REGEN/LOTES_PLAN.json + assets/prompts.json + assets/manifest.json
y genera:
  - docs/ASSET_REGEN/LOTES/LOTE_XX.json     (batch file compatible con batch.py)
  - docs/ASSET_REGEN/LOTES/LOTE_XX.sample.json (solo las muestras para aprobación)
  - docs/ASSET_REGEN/LOTES/_INDEX.json     (resumen de todos los lotes)

Los JSON generados siguen el formato que espera tools/art_master/batch.py
(batch, defaults, assets[] con id/raw/size/location/pivot/original_id/category/name).
Los lotes generados apuntan a 'location' en assets/_regen/LOTE_XX/<category>/<id>.png
(no sobrescriben activos finales — el paso de 'apply' hace la copia).

Uso:
  python3 tools/regen/planner.py [--lote LOTE_XX]   (uno o todos)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
PLAN_PATH = REPO / "docs" / "ASSET_REGEN" / "LOTES_PLAN.json"
PROMPTS_PATH = REPO / "assets" / "prompts.json"
MANIFEST_PATH = REPO / "assets" / "manifest.json"
OUT_DIR = REPO / "docs" / "ASSET_REGEN" / "LOTES"


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def dump_json(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def build_batch_for_lote(lote: dict, prompts: dict, manifest: dict, sample_only: bool = False) -> dict:
    """Construye el JSON de batch en el formato esperado por batch.py."""
    lote_id = lote["id"]
    # Determinar lista de IDs
    ids = list(lote.get("include_ids", []))
    cats = lote.get("categories", [])
    excl = set(lote.get("exclude_ids", []))
    for k, v in manifest["entries"].items():
        if v["category"] in cats and k not in excl:
            ids.append(k)
    # Dedup preservando orden
    seen = set()
    ids = [x for x in ids if not (x in seen or seen.add(x))]

    if sample_only:
        samples = lote.get("samples", [])
        ids = [x for x in ids if x in samples]
        if not ids:
            return None  # lote sin muestras

    policy = load_json(PLAN_PATH)["policy"]
    post = policy["postprocess"]

    assets = []
    for aid in ids:
        if aid not in manifest["entries"]:
            print(f"  WARN: {aid} no está en manifest; se omite")
            continue
        e = manifest["entries"][aid]
        p = prompts["assets"].get(aid, {})
        cat_dir = e["category"]
        # Output under _regen (not final location yet)
        location = f"assets/_regen/{lote_id}/{cat_dir}/{aid}.png"
        # For backdrops that are JPG
        if e["src"].lower().endswith((".jpg", ".jpeg")):
            location = location.replace(".png", ".jpg")
        # Determine chroma key: overlays and opaque floors/walls may not need alpha
        matte = "hard"
        key = "green"
        alpha = e.get("alpha", True)
        if not alpha:
            matte = "none"
        # Special: effects additive
        if e["category"] == "effects":
            key = "green"
            matte = "hard"
        # Build asset entry for batch.py
        asset = {
            "id": aid,
            "raw": f"{aid}.png",  # expected raw filename from generation
            "name": e.get("name", aid),
            "category": e["category"],
            "size": [e["w"], e["h"]],
            "location": location,         # _regen path (where process writes)
            "final_location": e["src"],   # real destination in assets/ (for apply)
            "original_id": aid,
            "pivot": e.get("pivot", "bottom-center"),
            "alpha": alpha,
            "key": key,
            "matte": matte,
            "band": post.get("band", 3),
            "prompt": p.get("prompt", ""),
            "negative_prompt": p.get("negative_prompt", ""),
        }
        # Reference anchors for characters/bosses/enemies
        if e["category"] in ("enemies", "bosses", "characters"):
            asset["anchors_raw"] = {"foot": [e["w"] // 2, int(e["h"] * 0.9)], "unit": e["h"]}
            asset["fit"] = {"mode": "contain", "halo": 24, "ground_line": 0.9}
        elif e["category"] == "floors":
            # Opaque seamless tiles: generator fills canvas entirely; if green bleeds, matte+paste-on-black will reveal it in QC.
            asset["fit"] = {"mode": "cover", "trim": 0}
            asset["alpha"] = False
            asset["matte"] = "hard"  # chroma-key any leftover green, then flatten to black
        elif e["category"] in ("walls",):
            asset["fit"] = {"mode": "contain", "halo": 24, "ground_line": 1.0}
        elif e["category"] in ("ui", "logos", "overlays"):
            if e["category"] == "overlays":
                asset["fit"] = {"mode": "cover", "trim": 0}
            else:
                asset["fit"] = {"mode": "contain", "halo": 16}
        elif e["category"] in ("props", "pickups", "environments"):
            asset["fit"] = {"mode": "contain", "halo": 24, "ground_line": 1.0}
        elif e["category"] == "weapons":
            asset["fit"] = {"mode": "contain", "halo": 24}
        elif e["category"] == "effects":
            asset["fit"] = {"mode": "contain", "halo": 8}
        elif e["category"] == "cinematics":
            if "_01_" in aid or "_02_" in aid or "_03_" in aid:
                # parallax layers RGBA
                asset["fit"] = {"mode": "cover", "trim": 0}
                asset["alpha"] = True
                asset["matte"] = "hard"
            elif "backdrop" in aid or aid.startswith("cine_bg") and "_" not in aid[len("cine_bg"):].split("_", 1)[0]:
                # Composite bg (opaque 2560x1440) — generator paints the full frame
                asset["fit"] = {"mode": "cover", "trim": 0}
                asset["alpha"] = False
                asset["matte"] = "none"
            elif "cine_intro" in aid:
                asset["fit"] = {"mode": "cover", "trim": 0}
                asset["alpha"] = False
                asset["matte"] = "none"
            elif aid.startswith("cine_circle"):
                asset["fit"] = {"mode": "cover", "trim": 0}
                asset["alpha"] = False
                asset["matte"] = "none"
            else:
                asset["fit"] = {"mode": "contain", "halo": 24}
        assets.append(asset)

    batch = {
        "batch": lote_id + (".sample" if sample_only else ""),
        "title": lote["title"] + (" · MUESTRA" if sample_only else ""),
        "created": datetime.utcnow().strftime("%Y-%m-%d"),
        "lote_id": lote_id,
        "sample_only": sample_only,
        "phase": lote.get("phase", ""),
        "priority": lote.get("priority", ""),
        "note": lote.get("note", ""),
        "existing_source": lote.get("existing_source"),
        "needs_decision": lote.get("needs_decision", False),
        "needs_approval": lote.get("needs_approval", False),
        "style": "DEADBEAT DISCO · ilustración digital estilizada (no pixel art). Ver docs/ASSET_REGEN/PROMPTS/.",
        "defaults": {
            "key": post.get("key", "green"),
            "matte": post.get("matte", "hard"),
            "band": post.get("band", 3),
            "pivot": "bottom-center",
            "alpha": True,
        },
        "regen_output_dir": policy["output_dir"].replace("XX", lote_id.split("_")[1]),
        "backup_dir": policy["backup_dir"].replace("XX", lote_id.split("_")[1]),
        "master_dir": policy["master_dir"].replace("XX", lote_id.split("_")[1]),
        "assets": assets,
    }
    return batch


def main():
    ap = argparse.ArgumentParser(description="Generar JSON de lotes desde el plan.")
    ap.add_argument("--lote", help="Generar solo un lote (p.ej. LOTE_00). Por defecto genera todos.")
    args = ap.parse_args()

    plan = load_json(PLAN_PATH)
    prompts = load_json(PROMPTS_PATH)
    manifest = load_json(MANIFEST_PATH)

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    index = {"generated_at": datetime.utcnow().isoformat() + "Z", "lotes": []}
    n_full = n_sample = 0

    for lote in plan["lotes"]:
        if args.lote and lote["id"] != args.lote:
            continue

        # Lote completo
        full = build_batch_for_lote(lote, prompts, manifest, sample_only=False)
        if full:
            dump_json(OUT_DIR / f"{lote['id']}.json", full)
            n_full += 1
            print(f"[OK] {lote['id']}.json: {len(full['assets'])} assets")

        # Lote muestra
        sample = build_batch_for_lote(lote, prompts, manifest, sample_only=True)
        if sample:
            dump_json(OUT_DIR / f"{lote['id']}.sample.json", sample)
            n_sample += 1
            print(f"[OK] {lote['id']}.sample.json: {len(sample['assets'])} muestras")

        index["lotes"].append({
            "id": lote["id"],
            "title": lote["title"],
            "phase": lote.get("phase"),
            "priority": lote.get("priority"),
            "n_assets": len(full["assets"]) if full else 0,
            "n_samples": len(sample["assets"]) if sample else 0,
            "sample_ids": lote.get("samples", []),
        })

    dump_json(OUT_DIR / "_INDEX.json", index)
    print(f"\nGenerados {n_full} lotes completos y {n_sample} lotes de muestra en {OUT_DIR}")


if __name__ == "__main__":
    main()
