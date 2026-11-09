import json
import re

with open("/tmp/cine_asset_entries.json", "r", encoding="utf-8") as f:
    cine_entries = json.load(f)

with open("src/dd_asset_registry.js", "r", encoding="utf-8") as f:
    registry_js = f.read()

# Locate MANIFEST object in dd_asset_registry.js
manifest_match = re.search(r'const MANIFEST = (\{.*?\});\n  const images =', registry_js, re.DOTALL)
assert manifest_match, "Failed to locate MANIFEST object in dd_asset_registry.js"

manifest = json.loads(manifest_match.group(1))

# Merge cine entries
for k, v in cine_entries.items():
    manifest["entries"][k] = v
    if "byOriginalId" in manifest and v.get("originalId"):
        manifest["byOriginalId"][v["originalId"]] = k

manifest["totalRegistered"] = len(manifest["entries"])

new_manifest_str = "const MANIFEST = " + json.dumps(manifest, ensure_ascii=False) + ";\n  const images ="

registry_js = registry_js[:manifest_match.start()] + new_manifest_str + registry_js[manifest_match.end():]

with open("src/dd_asset_registry.js", "w", encoding="utf-8") as f:
    f.write(registry_js)

print(f"Successfully integrated {len(cine_entries)} cinematic assets into src/dd_asset_registry.js (Total: {manifest['totalRegistered']})")
