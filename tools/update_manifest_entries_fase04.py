import json
import re

with open("assets/cinematics/manifest.json", "r", encoding="utf-8") as f:
    cine_manifest = json.load(f)

with open("src/dd_asset_registry.js", "r", encoding="utf-8") as f:
    registry_js = f.read()

manifest_match = re.search(r'const MANIFEST = (\{.*?\});\n  const images =', registry_js, re.DOTALL)
assert manifest_match, "Failed to locate MANIFEST object in dd_asset_registry.js"

manifest = json.loads(manifest_match.group(1))

# Register remaining cinematic assets
for k, meta in cine_manifest["assets"].items():
    if k not in manifest["entries"]:
        manifest["entries"][k] = {
            "id": k,
            "originalId": f"cine:{meta['category']}:{k}",
            "name": meta["name"],
            "category": meta["category"],
            "src": meta["file"],
            "w": meta["expected"].get("w", 256),
            "h": meta["expected"].get("h", 256),
            "alpha": meta["expected"].get("alpha", True),
            "pivot": "center",
            "tanda": "CINEMATICS_FINAL"
        }
        if "fallback" in meta:
            manifest["entries"][k]["fallback"] = meta["fallback"]
    else:
        if "fallback" in meta:
            manifest["entries"][k]["fallback"] = meta["fallback"]

manifest["totalRegistered"] = len(manifest["entries"])

new_manifest_str = "const MANIFEST = " + json.dumps(manifest, ensure_ascii=False) + ";\n  const images ="
registry_js = registry_js[:manifest_match.start()] + new_manifest_str + registry_js[manifest_match.end():]

with open("src/dd_asset_registry.js", "w", encoding="utf-8") as f:
    f.write(registry_js)

print(f"Updated registry with all cinematic assets! Total: {manifest['totalRegistered']}")
