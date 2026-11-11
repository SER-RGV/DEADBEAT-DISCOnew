"""Generate cinematic registry entries from the editable central manifest.

The stable IDs and non-cinematic metadata remain in the existing registry; the
central manifest is the source of paths, dimensions and fallbacks for the intro.
"""
import json
import re

with open('assets/cinematics/manifest.json', encoding='utf-8') as f:
    manifest = json.load(f)
with open('src/dd_asset_registry.js', encoding='utf-8') as f:
    registry_source = f.read()
match = re.search(r'const MANIFEST = (\{.*?\});\n  const images =', registry_source, re.DOTALL)
if not match:
    raise RuntimeError('Registry manifest not found')
registry = json.loads(match.group(1))
entries = {}
for asset_id, asset in manifest['assets'].items():
    if asset_id not in registry['entries']:
        raise ValueError(f'No existing registry entry for {asset_id}')
    entry = dict(registry['entries'][asset_id])
    size = asset['expected']
    entry.update(src=asset['file'], w=size['w'], h=size['h'],
                 alpha=size.get('alpha', False), fallback=asset['fallback'])
    entries[asset_id] = entry
with open('/tmp/cine_asset_entries.json', 'w', encoding='utf-8') as f:
    json.dump(entries, f, ensure_ascii=False, indent=2)
print(f'Generated {len(entries)} cinematic entries from the central manifest')
