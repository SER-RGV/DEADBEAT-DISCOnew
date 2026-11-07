#!/usr/bin/env python3
"""Prepare the first ten boss visuals without changing their embedded sources.

The generation service returned RGB images with a checkerboard/flat backdrop
painted into the pixels. This script removes only edge-connected neutral colors
matching the dominant border palette, then fits RGBA cutouts to the live slots.
"""
from __future__ import annotations
from collections import Counter, deque
from hashlib import sha256
from pathlib import Path
import json
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "ART_ASSETS/bosses/tanda_01/_source"
DST = ROOT / "ART_ASSETS/bosses/tanda_01"

# (source file, public art key, stable boss ID, native target or None, pivot)
SPECS = [
    ("01_boss_01_djdoom_master.png", "boss_art_boss_01_djdoom", "boss_01_djdoom", (400, 386), "bottom-center"),
    ("02_boss_02_reinaespectro_master.png", "boss_art_boss_02_reinaespectro", "boss_02_reinaespectro", (349, 400), "bottom-center"),
    ("03_boss_03_reydisco_master.png", "boss_art_boss_03_reydisco", "boss_03_reydisco", (400, 271), "bottom-center"),
    ("04_boss_04_entidadvoraz_master.png", "boss_art_boss_04_entidadvoraz", "boss_04_entidadvoraz", (400, 307), "bottom-center"),
    ("05_boss_05_fusioncosmica_master.png", "boss_art_boss_05_fusioncosmica", "boss_05_fusioncosmica", None, "bottom-center"),
    ("06_boss_06_djabismo_master.png", "boss_art_boss_06_djabismo", "boss_06_djabismo", None, "bottom-center"),
    ("07_boss_07_altavoztitan_master.png", "boss_art_boss_07_altavoztitan", "boss_07_altavoztitan", None, "bottom-center"),
    ("08_boss_08_djcalavera_master.png", "boss_art_boss_08_djcalavera", "boss_08_djcalavera", None, "bottom-center"),
    ("09_boss_09_nucleofinal_master.png", "boss_art_boss_09_nucleofinal", "boss_09_nucleofinal", None, "bottom-center"),
    ("10_boss_09_nucleofinal_attack_01.png", "bosses/boss_09_nucleofinal_attack_01.png", "boss_09_nucleofinal", (160, 106), "center"),
]


def border_palette(im: Image.Image) -> list[tuple[int, int, int]]:
    """Infer likely grayscale backdrop colors from an 8px image perimeter."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    counts: Counter[tuple[int, int, int]] = Counter()
    for y in range(h):
        if y >= 8 and y < h - 8:
            xs = range(8) if w <= 16 else (*range(8), *range(w - 8, w))
        else:
            xs = range(w)
        for x in xs:
            r, g, b = px[x, y]
            if max(r, g, b) - min(r, g, b) <= 20:
                counts[((r // 8) * 8, (g // 8) * 8, (b // 8) * 8)] += 1
    if not counts:
        raise RuntimeError("no neutral border colors; cannot safely infer backdrop")
    top = counts.most_common(12)
    max_count = top[0][1]
    palette = []
    for color, count in top:
        if count < max(400, max_count * 0.12):
            continue
        if any(max(abs(color[i] - c[i]) for i in range(3)) <= 12 for c in palette):
            continue
        palette.append(color)
        if len(palette) == 4:
            break
    return palette


def remove_edge_backdrop(im: Image.Image, hole_threshold: int = 1000,
                         hole_luma_threshold: int = 210) -> tuple[Image.Image, dict]:
    """Flood only backdrop-like neutral pixels touching an edge (8-connected)."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    data = rgb.tobytes()
    palette = border_palette(rgb)
    candidate = bytearray(w * h)
    levels = [round((r + g + b) / 3) for r, g, b in palette]
    # The generator's checkerboard is antialiased and may include many neutral
    # gray values between its two swatches. Expand the neutral range, but still
    # flood only from the frame edge so enclosed pale costume/teeth details stay.
    lo, hi = max(0, min(levels) - 36), min(255, max(levels) + 36)
    for i in range(w * h):
        j = i * 3
        r, g, b = data[j], data[j + 1], data[j + 2]
        gray = (r + g + b) // 3
        if max(r, g, b) - min(r, g, b) <= 26 and lo <= gray <= hi:
            candidate[i] = 1
    alpha = bytearray([255]) * (w * h)
    q: deque[int] = deque()
    def seed(i: int) -> None:
        if candidate[i]:
            candidate[i] = 0
            alpha[i] = 0
            q.append(i)
    for x in range(w):
        seed(x); seed((h - 1) * w + x)
    for y in range(h):
        seed(y * w); seed(y * w + w - 1)
    while q:
        i = q.popleft()
        x, y = i % w, i // w
        y0, y1 = max(0, y - 1), min(h - 1, y + 1)
        x0, x1 = max(0, x - 1), min(w - 1, x + 1)
        for ny in range(y0, y1 + 1):
            row = ny * w
            for nx in range(x0, x1 + 1):
                ni = row + nx
                if candidate[ni]:
                    candidate[ni] = 0
                    alpha[ni] = 0
                    q.append(ni)
    # A few enclosed negative spaces (e.g. gaps between a maw's tentacles or
    # broken orbit segments) contain the same bright neutral checker pattern
    # but cannot be reached from the canvas edge. Remove only large, pale,
    # neutral connected patches; never clear darker enclosed character shading.
    seen = bytearray(w * h)
    cleared_holes = 0
    for start in range(w * h):
        if not candidate[start] or seen[start]:
            continue
        comp = []
        q2 = deque([start])
        seen[start] = 1
        lum_sum = 0
        while q2:
            i = q2.popleft()
            comp.append(i)
            j = i * 3
            lum_sum += (data[j] + data[j + 1] + data[j + 2]) // 3
            x, y = i % w, i // w
            for ny in range(max(0, y - 1), min(h, y + 2)):
                row = ny * w
                for nx in range(max(0, x - 1), min(w, x + 2)):
                    ni = row + nx
                    if candidate[ni] and not seen[ni]:
                        seen[ni] = 1
                        q2.append(ni)
        mean_luma = lum_sum / max(1, len(comp))
        if len(comp) >= hole_threshold and mean_luma >= hole_luma_threshold:
            for i in comp:
                alpha[i] = 0
            cleared_holes += len(comp)
    matte = Image.frombytes("L", (w, h), bytes(alpha))
    # Remove the last one-pixel neutral fringe at source resolution, then soften
    # the ink edge slightly; the shrink is negligible after downsampling.
    matte = matte.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.55))
    out = rgb.convert("RGBA")
    out.putalpha(matte)
    bbox = matte.point(lambda a: 255 if a > 16 else 0).getbbox()
    if not bbox:
        raise RuntimeError("cutout empty; refusing to emit a blank boss")
    histogram = matte.histogram()
    transparent = histogram[0]
    partial = sum(histogram[1:255])
    return out, {"background_palette_rgb": palette, "cutout_bbox": list(bbox),
                 "source_transparent_px": transparent, "source_partial_alpha_px": partial,
                 "enclosed_backdrop_pixels_cleared": cleared_holes}


def fit_sprite(cutout: Image.Image, target: tuple[int, int] | None,
               pivot: str) -> Image.Image:
    a = cutout.getchannel("A")
    bbox = a.point(lambda v: 255 if v > 16 else 0).getbbox()
    if not bbox:
        raise RuntimeError("missing silhouette bbox")
    obj = cutout.crop(bbox)
    if target is None:
        # Boss 05–09 have no static illustrated slot; retain the generated
        # silhouette ratio and normalize only height for the existing ILT draw.
        th = 400
        tw = max(1, round(obj.width * th / obj.height))
        return obj.resize((tw, th), Image.Resampling.LANCZOS)
    tw, th = target
    scale = min(tw / obj.width, th / obj.height)
    nw, nh = max(1, round(obj.width * scale)), max(1, round(obj.height * scale))
    obj = obj.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    x = (tw - nw) // 2
    y = (th - nh) // 2 if pivot == "center" else th - nh
    canvas.alpha_composite(obj, (x, y))
    return canvas


def alpha_counts(im: Image.Image) -> dict:
    hist = im.getchannel("A").histogram()
    return {"transparent_px": hist[0], "partial_alpha_px": sum(hist[1:255]),
            "opaque_px": hist[255], "coverage_pct": round(100 * sum(hist[1:]) / (im.width * im.height), 3)}


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    assets = []
    for source_name, asset_id, boss_id, target, pivot in SPECS:
        source = SRC / source_name
        raw = Image.open(source).convert("RGB")
        is_attack_frame = asset_id.startswith("bosses/")
        cutout, qa = remove_edge_backdrop(
            raw, hole_threshold=5 if is_attack_frame else 1000,
            hole_luma_threshold=185 if is_attack_frame else 210)
        final = fit_sprite(cutout, target, pivot)
        out = DST / asset_id if "/" in asset_id else DST / f"{asset_id}.png"
        out.parent.mkdir(parents=True, exist_ok=True)
        final.save(out, format="PNG", optimize=True)
        row = {
            "id": asset_id,
            "boss_id": boss_id,
            "source": str(source.relative_to(ROOT)),
            "file": str(out.relative_to(ROOT)),
            "source_dimensions": list(raw.size),
            "dimensions": [final.width, final.height],
            "format": "PNG",
            "mode": final.mode,
            "pivot": pivot,
            "loader": "DMO_ILT" if asset_id.startswith("boss_") else "HD",
            "expected_slot_dimensions": list(target) if target else None,
            "sha256": sha256(out.read_bytes()).hexdigest(),
            "bytes": out.stat().st_size,
            "status": "PREPARED_NOT_YET_INTEGRATED",
            "qa": {**qa, **alpha_counts(final)},
        }
        assets.append(row)
        print(f"{asset_id:45s} {final.width:4d}x{final.height:<4d} "
              f"alpha0={row['qa']['transparent_px']:7d} partial={row['qa']['partial_alpha_px']:6d} "
              f"sha256={row['sha256'][:16]}")
    manifest = {
        "batch": "BOSS-T01",
        "source_build": "DEADBEAT_DISCO.ART.html",
        "asset_count": len(assets),
        "status": "PREPARED_NOT_YET_INTEGRATED",
        "assets": assets,
    }
    (DST / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
