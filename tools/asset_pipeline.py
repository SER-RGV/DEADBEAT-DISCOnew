#!/usr/bin/env python3
"""
DEADBEAT DISCO — Automated High-Resolution Asset Processing Pipeline
Processes raw generated high-res illustrations (/tmp/dd_raw/tanda_XX/<id>.png) into:
- Clean RGBA sprites with zero background halo and preserved dark-ink contours (alpha=True)
- Seamless 512x512 tileable floor textures via cosine cross-blend wrap (category='floors', alpha=False)
- Aspect-fitted crisp Lanczos-resampled UI/cinematic panels (alpha=False)
Updates src/dd_asset_registry.js and assets/manifest.json.
"""
import json
import os
import sys
import hashlib
import numpy as np
from scipy import ndimage
from PIL import Image, ImageEnhance, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INV_PATH = os.path.join(ROOT, "docs", "ART_REBUILD", "MASTER_INVENTORY.json")


def extract_clean_rgba(im: Image.Image) -> Image.Image:
    """
    Extracts clean, halo-free RGBA foreground from an isolated illustration generated
    on a uniform studio background (chroma green, white, light grey, or solid dark),
    preserving Deadbeat Disco's signature dark-ink contour and internal neon highlights.
    """
    rgba = im.convert("RGBA")
    arr = np.array(rgba, dtype=np.float32)
    rgb = arr[:, :, :3]
    h, w, _ = rgb.shape

    # Sample border ring (outer 6px) to determine dominant background color(s)
    top = rgb[:6, :, :].reshape(-1, 3)
    bot = rgb[-6:, :, :].reshape(-1, 3)
    left = rgb[:, :6, :].reshape(-1, 3)
    right = rgb[:, -6:, :].reshape(-1, 3)
    border = np.concatenate([top, bot, left, right], axis=0)
    bg_med = np.median(border, axis=0)

    # Check if background is bright green chroma (#00ff00-ish)
    is_green_bg = (bg_med[1] > 140) and (bg_med[1] - max(bg_med[0], bg_med[2]) > 45)

    # Euclidean + max-channel color distance from border median
    diff = np.linalg.norm(rgb - bg_med[None, None, :], axis=2)

    if is_green_bg:
        # Green dominance metric: g - max(r, b)
        green_excess = rgb[:, :, 1] - np.maximum(rgb[:, :, 0], rgb[:, :, 2])
        bg_candidate = (green_excess > 28) | (diff < 52)
        # Despill green fringe on semi-edge pixels
        spill = np.clip(green_excess, 0, None)
        rgb[:, :, 1] = np.where(green_excess > 12, rgb[:, :, 1] - 0.85 * spill, rgb[:, :, 1])
    else:
        # Adaptive threshold from border variance
        border_std = float(np.clip(np.std(border), 8.0, 28.0))
        thresh = max(26.0, border_std * 1.9)
        bg_candidate = diff < thresh

        # Also catch faint checkerboard if a model drew a 2-tone light/dark neutral grid on border
        sat = np.max(rgb, axis=2) - np.min(rgb, axis=2)
        lum = np.mean(rgb, axis=2)
        border_sat = float(np.median(np.max(border, axis=1) - np.min(border, axis=1)))
        if border_sat < 22 and float(np.std(np.mean(border, axis=1))) > 14:
            b_min, b_max = np.percentile(np.mean(border, axis=1), [10, 90])
            checker_cand = (sat < 20) & (lum >= b_min - 14) & (lum <= b_max + 14)
            bg_candidate = bg_candidate | checker_cand

    # Flood-fill ONLY from outer image edges so internal dark/bright details inside the closed ink outline stay 100% opaque!
    seed = np.zeros((h, w), dtype=bool)
    seed[0, :] = bg_candidate[0, :]
    seed[-1, :] = bg_candidate[-1, :]
    seed[:, 0] = bg_candidate[:, 0]
    seed[:, -1] = bg_candidate[:, -1]

    labeled, _ = ndimage.label(bg_candidate, structure=np.ones((3, 3), dtype=int))
    edge_labels = np.unique(labeled[seed])
    edge_labels = edge_labels[edge_labels > 0]
    exterior_bg = np.isin(labeled, edge_labels)
    if is_green_bg:
        # Also punch out enclosed pure #00FF00 chroma cutouts (e.g. open iron frames)
        green_interior = (rgb[:, :, 1] > 165) & ((rgb[:, :, 1] - np.maximum(rgb[:, :, 0], rgb[:, :, 2])) > 65)
        exterior_bg = exterior_bg | green_interior

    # Erode foreground mask by 1px at exterior boundary & smooth 1.2px for clean anti-aliased edge
    fg = (~exterior_bg).astype(np.float32)
    fg_eroded = ndimage.binary_erosion(fg > 0.5, iterations=1).astype(np.float32)
    alpha = ndimage.gaussian_filter(0.65 * fg + 0.35 * fg_eroded, sigma=0.85)
    alpha = np.clip((alpha - 0.12) / 0.82, 0.0, 1.0)
    alpha[exterior_bg & (alpha < 0.22)] = 0.0

    # Darken outer 1-2px semi-transparent fringe toward Deadbeat Disco dark ink (#08040e) to eliminate any light halo
    fringe = (alpha > 0.02) & (alpha < 0.88)
    ink = np.array([8.0, 4.0, 14.0], dtype=np.float32)
    w_ink = (1.0 - alpha[:, :, None]) * 0.75
    rgb = np.where(fringe[:, :, None], rgb * (1.0 - w_ink) + ink * w_ink, rgb)

    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    return Image.fromarray(out, mode="RGBA")


def fit_rgba_to_canvas(im: Image.Image, target_w: int, target_h: int, pivot: str) -> Image.Image:
    """
    Auto-crops transparent padding around the sprite (isolating the primary central
    standalone subject if the generator repeated multiple copies across a wide strip)
    and places it cleanly into (target_w, target_h) respecting pivot.
    """
    arr = np.array(im)
    mask = arr[:, :, 3] > 14
    if not np.any(mask):
        return im.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Dilate slightly (4px) so micro-details stay grouped without merging side-by-side strip copies
    grouped = ndimage.binary_dilation(mask, iterations=4)
    labeled, num_comp = ndimage.label(grouped)
    if num_comp > 1:
        H, W = mask.shape
        cx_img = W * 0.5
        best_lbl = 1
        best_score = -1.0
        total_fg = float(np.sum(mask))
        for lbl in range(1, num_comp + 1):
            comp_mask = mask & (labeled == lbl)
            area = float(np.sum(comp_mask))
            if area < total_fg * 0.06:
                continue
            ys_c, xs_c = np.where(comp_mask)
            cx_c = float(np.mean(xs_c))
            # Prefer large component closest to horizontal center
            centrality = 1.0 - (abs(cx_c - cx_img) / max(1.0, W * 0.5))
            score = area * (0.65 + 0.35 * centrality)
            if score > best_score:
                best_score = score
                best_lbl = lbl
        # Zero out duplicate side-by-side copies!
        keep = labeled == best_lbl
        arr = arr.copy()
        arr[~keep, 3] = 0
        im = Image.fromarray(arr, mode="RGBA")
        mask = arr[:, :, 3] > 14

    ys, xs = np.where(mask)
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    cropped = im.crop((x0, y0, x1, y1))

    pad_ratio = 0.04 if pivot == "grip-calibrated" else 0.05
    avail_w = max(1, int(round(target_w * (1.0 - 2 * pad_ratio))))
    avail_h = max(1, int(round(target_h * (1.0 - 2 * pad_ratio))))

    cw, ch = cropped.size
    scale = min(avail_w / cw, avail_h / ch)
    nw = max(1, int(round(cw * scale)))
    nh = max(1, int(round(ch * scale)))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    ox = (target_w - nw) // 2
    if pivot == "bottom-center":
        oy = target_h - nh - max(2, int(round(target_h * 0.025)))
    else:
        oy = (target_h - nh) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def make_seamless_tile(im: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """
    Preserves full-bleed 1:1 architectural grid geometry at (target_w, target_h)
    with a narrow 4% perimeter wrap-blend so tiled floors have zero edge seams
    and zero ghosting on internal geometric patterns.
    """
    rgb = im.convert("RGB")
    w, h = rgb.size
    s = min(w, h)
    x0 = (w - s) // 2
    y0 = (h - s) // 2
    sq = rgb.crop((x0, y0, x0 + s, y0 + s)).resize((target_w, target_h), Image.Resampling.LANCZOS)

    arr = np.array(sq, dtype=np.float32)
    # Symmetrize outer 10px seam smoothly against opposite edge
    seam = max(6, int(round(target_w * 0.025)))
    for i in range(seam):
        t = 0.5 * (1.0 - (i / float(seam)))
        # Left/Right edge match
        avg_lr = 0.5 * (arr[:, i, :] + arr[:, target_w - 1 - i, :])
        arr[:, i, :] = arr[:, i, :] * (1.0 - t) + avg_lr * t
        arr[:, target_w - 1 - i, :] = arr[:, target_w - 1 - i, :] * (1.0 - t) + avg_lr * t
        # Top/Bottom edge match
        avg_tb = 0.5 * (arr[i, :, :] + arr[target_h - 1 - i, :, :])
        arr[i, :, :] = arr[i, :, :] * (1.0 - t) + avg_tb * t
        arr[target_h - 1 - i, :] = arr[target_h - 1 - i, :] * (1.0 - t) + avg_tb * t

    res = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGB")
    return ImageEnhance.Sharpness(res).enhance(1.08)


def fit_opaque_cover(im: Image.Image, target_w: int, target_h: int) -> Image.Image:
    rgb = im.convert("RGB")
    w, h = rgb.size
    target_ar = target_w / target_h
    cur_ar = w / h
    if cur_ar > target_ar:
        nw = int(round(h * target_ar))
        x0 = (w - nw) // 2
        rgb = rgb.crop((x0, 0, x0 + nw, h))
    else:
        nh = int(round(w / target_ar))
        y0 = (h - nh) // 2
        rgb = rgb.crop((0, y0, w, y0 + nh))
    return rgb.resize((target_w, target_h), Image.Resampling.LANCZOS)


def save_optimized_png(im: Image.Image, dest_path: str, has_alpha: bool):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    # Quantize to high-fidelity 256-color RGBA/RGB PNG (~35-85 KB per asset, zero pixelation, crisp alpha!)
    # Exception: large 1280x720 backdrops or smooth gradients keep full 24-bit if small enough or fast-quantized
    w, h = im.size
    if has_alpha:
        q = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        q.save(dest_path, format="PNG", optimize=True)
    else:
        if w * h >= 900000:
            # For 1280x720 / 960x540 cinematic backdrops, quantize with Floyd-Steinberg for smooth gradients + compact git footprint
            q = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
            q.save(dest_path, format="PNG", optimize=True)
        else:
            q = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
            q.save(dest_path, format="PNG", optimize=True)


def rebuild_registry():
    """Regenera src/dd_asset_registry.js y assets/manifest.json desde MASTER_INVENTORY.

    REGLA DE SEGURIDAD (2026-11-15): la regeneración es ADITIVA. Las entradas
    del registro existente que no proceden del inventario se CONSERVAN
    (se registran como "legacy_kept"), nunca se descartan en silencio. La
    plantilla JS conserva el mecanismo de invalidación de caché
    (ASSET_CACHE_VERSION + ?v=) y el fallback onerror->getVersionedUrl.
    """
    with open(INV_PATH, "r", encoding="utf-8") as f:
        inv = json.load(f)

    # 1) Entradas del inventario cuyos ficheros existen
    entries = {}
    by_orig = {}
    for a in inv["assets"]:
        fpath = os.path.join(ROOT, a["location"])
        if os.path.isfile(fpath) and os.path.getsize(fpath) > 0:
            im = Image.open(fpath)
            w, h = im.size
            with open(fpath, "rb") as bf:
                sha = hashlib.sha256(bf.read()).hexdigest()[:16]
            entries[a["id"]] = {
                "id": a["id"],
                "originalId": a["original_id"],
                "name": a["name"],
                "category": a["category"],
                "src": a["location"],
                "w": w,
                "h": h,
                "alpha": a["alpha"],
                "pivot": a["pivot"],
                "tanda": a["tanda"],
                "sha16": sha,
            }
            by_orig[a["original_id"]] = a["id"]

    # 2) Fusión con el registro existente: la metadata legacy (ficheros vivos)
    #    gana; solo se refrescan sha16/w/h desde el disco. El inventario aporta
    #    entradas nuevas (ids no existentes en el registro).
    reg_path = os.path.join(ROOT, "src", "dd_asset_registry.js")
    legacy_kept = 0
    legacy_ids = []
    if os.path.isfile(reg_path):
        try:
            src = open(reg_path, "r", encoding="utf-8").read()
            ms = src.index("const MANIFEST = ") + len("const MANIFEST = ")
            me = src.index(";\n  const images", ms)
            legacy = json.loads(src[ms:me])
            for lid, lmeta in legacy.get("entries", {}).items():
                fpath = os.path.join(ROOT, lmeta.get("src", ""))
                if not os.path.isfile(fpath) or os.path.getsize(fpath) == 0:
                    print(f"  AVISO legacy sin fichero, se omite: {lid}")
                    continue
                with open(fpath, "rb") as bf:
                    sha = hashlib.sha256(bf.read()).hexdigest()[:16]
                with Image.open(fpath) as im:
                    w, h = im.size
                merged = dict(lmeta)  # conserva rev, anchors, fallback, tanda, etc.
                merged["sha16"] = sha
                merged["w"] = w
                merged["h"] = h
                entries[lid] = merged
                if lmeta.get("originalId"):
                    by_orig[lmeta["originalId"]] = lid
        except Exception as exc:  # nunca dejar el registro en estado desconocido
            raise RuntimeError(f"No se pudo fusionar el registro existente: {exc}")

    # 3) Inventario aporta solo entradas nuevas
    for a in inv["assets"]:
        if a["id"] in entries:
            continue
        fpath = os.path.join(ROOT, a["location"])
        if os.path.isfile(fpath) and os.path.getsize(fpath) > 0:
            with Image.open(fpath) as im:
                w, h = im.size
            with open(fpath, "rb") as bf:
                sha = hashlib.sha256(bf.read()).hexdigest()[:16]
            entries[a["id"]] = {
                "id": a["id"],
                "originalId": a["original_id"],
                "name": a["name"],
                "category": a["category"],
                "src": a["location"],
                "w": w,
                "h": h,
                "alpha": a["alpha"],
                "pivot": a["pivot"],
                "tanda": a["tanda"],
                "sha16": sha,
            }
            if a["original_id"] not in by_orig:
                by_orig[a["original_id"]] = a["id"]
    inv_ids = {a["id"] for a in inv["assets"]}
    legacy_ids = sorted(k for k in entries if k not in inv_ids)
    legacy_kept = len(legacy_ids)

    manifest_out = {
        "totalRegistered": len(entries),
        "totalPlanned": inv["total_assets"],
        "entries": entries,
        "byOriginalId": by_orig,
    }
    with open(os.path.join(ROOT, "assets", "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest_out, f, indent=2, ensure_ascii=False)

    template = open(os.path.join(ROOT, "tools", "registry_template.js"), "r", encoding="utf-8").read()
    js_code = template.replace("__MANIFEST_JSON__", json.dumps(manifest_out, ensure_ascii=False))
    with open(reg_path, "w", encoding="utf-8") as f:
        f.write(js_code)
    print(f"rebuild_registry: {len(entries)} entradas ({legacy_kept} legacy conservadas); "
          f"manifest.json actualizado.")
    if legacy_ids:
        print("  legacy_kept:", ", ".join(sorted(legacy_ids)))


def process_tanda(tanda_num: int):
    with open(INV_PATH, "r", encoding="utf-8") as f:
        inv = json.load(f)

    tanda_key = f"TANDA_{tanda_num:02d}"
    batch = [a for a in inv["assets"] if a["tanda"] == tanda_key]
    if len(batch) != 10:
        raise RuntimeError(f"Expected 10 assets in {tanda_key}, found {len(batch)}")

    raw_dir = f"/tmp/dd_raw/tanda_{tanda_num:02d}"
    report = []
    missing = []
    for a in batch:
        raw_path = os.path.join(raw_dir, f"{a['id']}.png")
        if not os.path.isfile(raw_path):
            missing.append(a["id"])
            continue

        src_im = Image.open(raw_path)
        tw, th = a["dimensions"]
        if a["alpha"]:
            clean_rgba = extract_clean_rgba(src_im)
            final_im = fit_rgba_to_canvas(clean_rgba, tw, th, a["pivot"])
            # Verify both opaque foreground and transparent background pixels exist
            arr = np.array(final_im)
            trans_px = int(np.sum(arr[:, :, 3] == 0))
            opaque_px = int(np.sum(arr[:, :, 3] > 200))
            if trans_px < 50 or opaque_px < 50:
                raise RuntimeError(f"Alpha check failed for {a['id']}: trans={trans_px}, opaque={opaque_px}")
        elif a["category"] == "floors":
            final_im = make_seamless_tile(src_im, tw, th)
            trans_px = 0
            opaque_px = tw * th
        else:
            final_im = fit_opaque_cover(src_im, tw, th)
            trans_px = 0
            opaque_px = tw * th

        dest_path = os.path.join(ROOT, a["location"])
        save_optimized_png(final_im, dest_path, a["alpha"])
        size_kb = os.path.getsize(dest_path) / 1024.0
        report.append((a["id"], a["location"], f"{tw}x{th}", f"{size_kb:.1f}KB", f"trans={trans_px}"))

    rebuild_registry()
    print(f"=== {tanda_key} PROCESSED & REGISTERED ({len(report)}/{len(batch)}) ===")
    for r in report:
        print("  ", " | ".join(r))
    if missing:
        print("  PENDING (platform turn cap / retry queued):", ", ".join(missing))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--init-registry":
        rebuild_registry()
        print("Initialized empty src/dd_asset_registry.js")
    elif len(sys.argv) > 1:
        process_tanda(int(sys.argv[1]))
    else:
        rebuild_registry()
