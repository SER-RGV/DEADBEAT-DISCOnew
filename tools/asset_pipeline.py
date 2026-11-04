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
    Auto-crops transparent padding around the sprite and places it cleanly into (target_w, target_h)
    respecting pivot ('bottom-center', 'center', or 'grip-calibrated').
    """
    arr = np.array(im)
    mask = arr[:, :, 3] > 14
    if not np.any(mask):
        return im.resize((target_w, target_h), Image.Resampling.LANCZOS)

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
    Center-crops square, resizes to (target_w, target_h), and applies smooth periodic
    edge cross-blending so tiled floors have zero visible grid seams.
    """
    rgb = im.convert("RGB")
    w, h = rgb.size
    s = min(w, h)
    # Trim 6% outer margin in case generation had vignette border
    s_inner = int(s * 0.88)
    x0 = (w - s_inner) // 2
    y0 = (h - s_inner) // 2
    sq = rgb.crop((x0, y0, x0 + s_inner, y0 + s_inner)).resize((target_w, target_h), Image.Resampling.LANCZOS)

    arr = np.array(sq, dtype=np.float32)
    shifted = np.roll(np.roll(arr, target_h // 2, axis=0), target_w // 2, axis=1)

    # Cosine diamond/edge weight: 1 at center of original, 0 at outer wrap seams
    ux = np.linspace(-1.0, 1.0, target_w, dtype=np.float32)
    uy = np.linspace(-1.0, 1.0, target_h, dtype=np.float32)
    gx, gy = np.meshgrid(ux, uy)
    edge_dist = 1.0 - np.maximum(np.abs(gx), np.abs(gy))
    blend = np.clip(edge_dist / 0.22, 0.0, 1.0)
    blend = 0.5 - 0.5 * np.cos(np.pi * blend)
    out = arr * blend[:, :, None] + shifted * (1.0 - blend[:, :, None])
    res = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), mode="RGB")
    return ImageEnhance.Sharpness(res).enhance(1.12)


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
    with open(INV_PATH, "r", encoding="utf-8") as f:
        inv = json.load(f)

    entries = {}
    by_orig = {}
    for a in inv["assets"]:
        fpath = os.path.join(ROOT, a["location"])
        if os.path.isfile(fpath) and os.path.getsize(fpath) > 0:
            im = Image.open(fpath)
            w, h = im.size
            with open(fpath, "rb") as bf:
                sha = hashlib.sha256(bf.read()).hexdigest()[:16]
            meta = {
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
                "sha16": sha
            }
            entries[a["id"]] = meta
            by_orig[a["original_id"]] = a["id"]

    manifest_out = {
        "totalRegistered": len(entries),
        "totalPlanned": inv["total_assets"],
        "entries": entries,
        "byOriginalId": by_orig
    }
    with open(os.path.join(ROOT, "assets", "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest_out, f, indent=2, ensure_ascii=False)

    js_code = f"""/* AUTO-GENERATED BY tools/asset_pipeline.py — DO NOT EDIT MANUALLY */
(function () {{
  "use strict";
  const MANIFEST = {json.dumps(manifest_out, ensure_ascii=False)};
  const images = Object.create(null);
  const status = Object.create(null);
  let loadedCount = 0;
  let errorCount = 0;

  function preloadAll() {{
    const ids = Object.keys(MANIFEST.entries);
    for (let i = 0; i < ids.length; i++) {{
      const id = ids[i];
      const meta = MANIFEST.entries[id];
      const img = new Image();
      img.decoding = "async";
      status[id] = "loading";
      img.onload = function () {{
        status[id] = "ready";
        loadedCount++;
        // Automatically wire into __HD_EXTRA / __HD_ASSETS if weapon, player, pickup, or boss!
        if (meta.originalId && meta.originalId.indexOf("/") > 0) {{
          window.__HD_EXTRA = window.__HD_EXTRA || {{}};
          window.__HD_EXTRA[meta.originalId] = img;
          if (window.__HD_ASSETS && window.__HD_ASSETS.images) {{
            const pMap = {{
              "player/player_idle_00.png": "player_idle",
              "player/player_walk_00.png": "player_walk0",
              "player/player_walk_01.png": "player_walk1",
              "player/player_walk_02.png": "player_walk2",
              "player/player_walk_03.png": "player_walk3",
              "player/player_shoot_00.png": "player_fire",
              "player/player_fire2.png": "player_fire2",
              "player/player_firehip.png": "player_firehip",
              "player/player_hurt_00.png": "player_hit",
              "player/player_roll_00.png": "player_roll",
              "player/player_death_00.png": "player_death",
              "player/player_boost_00.png": "player_boost"
            }};
            if (pMap[meta.originalId]) {{
              window.__HD_ASSETS.images[pMap[meta.originalId]] = img;
            }}
          }}
          if (window.__DD_BRIDGE && typeof window.__DD_BRIDGE.invalidateWeaponCache === "function" && meta.category === "weapons") {{
            const wid = meta.id.replace(/^weapon_/, "");
            window.__DD_BRIDGE.invalidateWeaponCache(wid);
          }}
        }}
        if (window.__DD_BRIDGE && typeof window.__DD_BRIDGE.invalidateRoomCache === "function") {{
          window.__DD_BRIDGE.invalidateRoomCache();
        }}
        if (window.DD_UI && typeof window.DD_UI.refreshAssets === "function") {{
          window.DD_UI.refreshAssets();
        }}
      }};
      img.onerror = function () {{
        status[id] = "error";
        errorCount++;
      }};
      img.src = meta.src;
      images[id] = img;
    }}
  }}

  function get(id) {{
    const im = images[id];
    return (im && im.complete && im.naturalWidth > 0) ? im : null;
  }}

  function getByOriginal(origId) {{
    const id = MANIFEST.byOriginalId[origId];
    return id ? get(id) : null;
  }}

  function integrity(filterTanda) {{
    const ids = Object.keys(MANIFEST.entries);
    const results = [];
    let ok = 0;
    for (const id of ids) {{
      const m = MANIFEST.entries[id];
      if (filterTanda && m.tanda !== filterTanda) continue;
      const im = images[id];
      const live = !!(im && im.complete && im.naturalWidth === m.w && im.naturalHeight === m.h);
      if (live) ok++;
      results.push({{
        id,
        tanda: m.tanda,
        category: m.category,
        expected: [m.w, m.h],
        actual: im ? [im.naturalWidth || 0, im.naturalHeight || 0] : [0, 0],
        status: status[id] || "unknown",
        live
      }});
    }}
    return {{
      pass: ok === results.length && errorCount === 0,
      checked: results.length,
      ok,
      errors: errorCount,
      totalRegistered: ids.length,
      totalPlanned: MANIFEST.totalPlanned,
      results
    }};
  }}

  preloadAll();
  window.DD_ASSETS = Object.freeze({{
    manifest: MANIFEST,
    images,
    get,
    getByOriginal,
    integrity,
    stats: function () {{
      return {{
        registered: Object.keys(MANIFEST.entries).length,
        loaded: loadedCount,
        errors: errorCount,
        planned: MANIFEST.totalPlanned
      }};
    }}
  }});
}})();
"""
    with open(os.path.join(ROOT, "src", "dd_asset_registry.js"), "w", encoding="utf-8") as f:
        f.write(js_code)


def process_tanda(tanda_num: int):
    with open(INV_PATH, "r", encoding="utf-8") as f:
        inv = json.load(f)

    tanda_key = f"TANDA_{tanda_num:02d}"
    batch = [a for a in inv["assets"] if a["tanda"] == tanda_key]
    if len(batch) != 10:
        raise RuntimeError(f"Expected 10 assets in {tanda_key}, found {len(batch)}")

    raw_dir = f"/tmp/dd_raw/tanda_{tanda_num:02d}"
    report = []
    for a in batch:
        raw_path = os.path.join(raw_dir, f"{a['id']}.png")
        if not os.path.isfile(raw_path):
            raise FileNotFoundError(f"Missing raw asset {raw_path}")

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
    print(f"=== {tanda_key} PROCESSED & REGISTERED (10/10) ===")
    for r in report:
        print("  ", " | ".join(r))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--init-registry":
        rebuild_registry()
        print("Initialized empty src/dd_asset_registry.js")
    elif len(sys.argv) > 1:
        process_tanda(int(sys.argv[1]))
    else:
        rebuild_registry()
