import os, json, hashlib, glob, re
from PIL import Image

def build_atlas(files, out_png, out_json, cols=6, cell_w=256, cell_h=256):
    rows = (len(files) + cols - 1) // cols
    atlas = Image.new("RGBA", (cols * cell_w, rows * cell_h), (0, 0, 0, 0))
    frames = {}
    for idx, p in enumerate(files):
        im = Image.open(p).convert("RGBA")
        im.thumbnail((cell_w, cell_h), Image.Resampling.LANCZOS)
        c, r = idx % cols, idx // cols
        ox = c * cell_w + (cell_w - im.width) // 2
        oy = r * cell_h + (cell_h - im.height) // 2
        atlas.alpha_composite(im, (ox, oy))
        fid = os.path.splitext(os.path.basename(p))[0]
        frames[fid] = {"x": c * cell_w, "y": r * cell_h, "w": cell_w, "h": cell_h, "src": p}
    atlas.save(out_png, format="PNG", optimize=True)
    with open(out_json, "w") as f:
        json.dump({"image": out_png, "width": atlas.width, "height": atlas.height, "frames": frames}, f, indent=2)
    print(f"Rebuilt {out_png} ({len(files)} frames)")

build_atlas(sorted(glob.glob("assets/characters/*.png")), "assets/atlases/protagonist_atlas.png", "assets/atlases/protagonist_atlas.json", cols=5, cell_w=256, cell_h=256)
build_atlas(sorted(glob.glob("assets/enemies/*.png")), "assets/atlases/enemies_atlas.png", "assets/atlases/enemies_atlas.json", cols=6, cell_w=256, cell_h=256)
build_atlas(sorted(glob.glob("assets/bosses/*.png")), "assets/atlases/bosses_atlas.png", "assets/atlases/bosses_atlas.json", cols=8, cell_w=256, cell_h=256)

with open("assets/manifest.json") as f:
    manifest = json.load(f)

for st in ["hit", "death"]:
    bid = f"boss_10_arquitecto_{st}"
    bpath = f"assets/bosses/{bid}.png"
    if os.path.exists(bpath):
        im = Image.open(bpath)
        sha = hashlib.sha256(open(bpath, "rb").read()).hexdigest()[:16]
        manifest["entries"][bid] = {
            "id": bid,
            "originalId": f"secretBoss:{st}",
            "name": f"El Arquitecto del Sello ({st})",
            "category": "bosses",
            "src": bpath,
            "w": im.width,
            "h": im.height,
            "width": im.width,
            "height": im.height,
            "alpha": True,
            "pivot": "bottom-center",
            "tanda": "TANDA_05",
            "sha16": sha
        }
        manifest["byOriginalId"][f"secretBoss:{st}"] = bid

for eid, meta in manifest["entries"].items():
    p = meta["src"].split("?")[0]
    if os.path.exists(p):
        im = Image.open(p)
        meta["w"] = meta["width"] = im.width
        meta["h"] = meta["height"] = im.height
        meta["sha16"] = hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]

total_assets = len(manifest["entries"])
manifest["totalRegistered"] = total_assets
manifest["totalAssets"] = total_assets
with open("assets/manifest.json", "w") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

reg_src = open("src/dd_asset_registry.js").read()
new_manifest_str = json.dumps(manifest, ensure_ascii=False)
reg_src_new = re.sub(r"const MANIFEST = \{.*?\};\n", f"const MANIFEST = {new_manifest_str};\n", reg_src, count=1)
with open("src/dd_asset_registry.js", "w") as f:
    f.write(reg_src_new)
print(f"Updated assets/manifest.json and src/dd_asset_registry.js ({total_assets} total assets)")
