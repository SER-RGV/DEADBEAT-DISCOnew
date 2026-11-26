#!/usr/bin/env python3
"""Extract the original embedded boss PNGs from the active build, read-only."""
from __future__ import annotations
import base64, hashlib, json, re, struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "DEADBEAT_DISCO.ART.html"
OUT = ROOT / "ART_ASSETS" / "bosses" / "_source"
OUT.mkdir(parents=True, exist_ok=True)
text = HTML.read_text(encoding="utf-8")

def embedded_object(var: str) -> dict[str, str]:
    match = re.search(r"window\." + re.escape(var) + r"\s*=\s*(\{.*?\})\s*;", text, re.S)
    if not match:
        raise RuntimeError(f"Embedded object not found: window.{var}")
    return json.loads(match.group(1))

def png_meta(data: bytes) -> tuple[int, int, int]:
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("asset is not PNG")
    width, height = struct.unpack(">II", data[16:24])
    color_type = data[25]
    return width, height, color_type

ilt = embedded_object("__ILT_DATA")
hd = embedded_object("__HD_DATA")
selected: dict[str, tuple[dict[str, str], str]] = {}
for key in ("boss_01_anden", "boss_02_reinaespectro", "boss_03_reydisco",
            "boss_04_entidadvoraz", "resident_magneta"):
    selected[key] = (ilt, key)
for boss in ("boss_05_fusioncosmica", "boss_06_djabismo",
             "boss_07_altavoztitan", "boss_08_djcalavera", "boss_09_nucleofinal"):
    for state in ("attack_00", "attack_01", "hit_00", "death_00"):
        key = f"bosses/{boss}_{state}.png"
        if key in hd:
            selected[key] = (hd, key)

rows = []
for key, (container, source_key) in selected.items():
    uri = container.get(source_key)
    if not uri or not uri.startswith("data:image/png;base64,"):
        raise RuntimeError(f"PNG data missing for {source_key}")
    data = base64.b64decode(uri.partition(",")[2], validate=True)
    w, h, color_type = png_meta(data)
    slug = source_key.replace("/", "__")
    path = OUT / f"{slug}.png"
    if path.exists() and path.read_bytes() != data:
        raise RuntimeError(f"Refusing to overwrite different source: {path}")
    path.write_bytes(data)
    rows.append({
        "id": source_key,
        "source_build": HTML.name,
        "source_location": f"window.{source_key.split('/')[0] if '/' in source_key else '__ILT_DATA'}[{json.dumps(source_key)}]",
        "file": str(path.relative_to(ROOT)),
        "bytes": len(data),
        "width": w,
        "height": h,
        "png_color_type": color_type,
        "alpha_channel_declared": color_type in (4, 6),
        "sha256": hashlib.sha256(data).hexdigest(),
        "status": "ORIGINAL_EXTRACTED_UNMODIFIED"
    })

result = {
    "source": HTML.name,
    "source_sha256": hashlib.sha256(HTML.read_bytes()).hexdigest(),
    "extraction": "decoded from existing inline PNG data URIs; no resampling or edits",
    "count": len(rows),
    "assets": rows,
}
manifest = ROOT / "ART_ASSETS" / "bosses" / "source_inventory.json"
manifest.parent.mkdir(parents=True, exist_ok=True)
manifest.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Extracted {len(rows)} boss source PNGs to {OUT}")
print(f"Inventory: {manifest.relative_to(ROOT)}")
