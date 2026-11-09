import json

manifest_path = "assets/cinematics/backgrounds/final/manifest.json"
with open(manifest_path, "r", encoding="utf-8") as f:
    cine_manifest = json.load(f)

entries = {}
for sc in cine_manifest["scenarios"]:
    # 1. Master background entry
    entries[sc["id"]] = {
        "id": sc["id"],
        "originalId": f"cine:{sc['code'].lower()}",
        "name": f"Cinemática {sc['code']} · {sc['name']} (Master 2.5K)",
        "category": "cinematics",
        "src": sc["relative_path"],
        "w": 2560,
        "h": 1440,
        "alpha": False,
        "pivot": "center",
        "tanda": "CINEMATICS_FINAL"
    }
    # 2. Layer entries
    for lay in sc["layers"]:
        lay_id = f"{sc['id']}_{lay['file'].replace('.png', '')}"
        entries[lay_id] = {
            "id": lay_id,
            "originalId": f"cine:{sc['code'].lower()}:{lay['file'].replace('.png', '')}",
            "name": f"Cinemática {sc['code']} · {lay['depth_plane']} ({lay['file']})",
            "category": "cinematics",
            "src": f"assets/cinematics/backgrounds/final/{sc['id']}/{lay['file']}",
            "w": 1920,
            "h": 1080,
            "alpha": True,
            "pivot": "center",
            "tanda": "CINEMATICS_FINAL"
        }

print(f"Generated {len(entries)} asset entries:")
for k, v in entries.items():
    print(f" - {k} -> {v['src']}")

with open("/tmp/cine_asset_entries.json", "w", encoding="utf-8") as f:
    json.dump(entries, f, indent=2, ensure_ascii=False)
