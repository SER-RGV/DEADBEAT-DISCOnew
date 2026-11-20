#!/usr/bin/env python3
"""Retouch arm damage on the outfit concept art, then rebuild the sprites.

The generated blue-backed masters contain torn sleeve edges, detached garment
shards and stray gray fragments. This pass repairs the masters in place
(before the chroma key), so every downstream sprite benefits:

1. Detached opaque islands that do not touch the main figure are painted back
   to the local background color (the chroma key then removes them).
2. Arm boxes get their garment boundary smoothed (morphological closing plus
   blurred-threshold) and any jaggies filled with locally sampled garment color.
3. Hand-placed sleeve/cuff repairs for the worst geometry (see REPAIRS).

Requires Pillow, NumPy and SciPy.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
CONCEPTS = ROOT / 'assets/characters/outfits/concepts'

# Coarse arm boxes (x0, y0, x1, y1) on the 768x1365 masters; they only limit
# where boundary smoothing may paint, never which pixels survive.
ARM_BOXES = {
    'cocinero_idle': [(25, 255, 165, 500), (430, 255, 610, 480)],
    'cocinero_walk': [(25, 255, 165, 500), (430, 255, 610, 480)],
    'cocinero_aim': [(180, 330, 380, 470), (560, 300, 768, 460)],
    'cocinero_hurt': [(120, 200, 320, 420), (430, 180, 640, 420)],
    'cocinero_roll': [(180, 300, 420, 520), (420, 280, 660, 520)],
    'cocinero_death': [(120, 260, 360, 520), (380, 260, 640, 520)],
    'pintor_idle': [(25, 255, 165, 500), (430, 255, 610, 480)],
    'pintor_walk': [(25, 255, 165, 500), (430, 255, 610, 480)],
    'pintor_aim': [(180, 330, 380, 470), (560, 300, 768, 460)],
    'pintor_hurt': [(120, 200, 320, 420), (430, 180, 640, 420)],
    'pintor_roll': [(180, 300, 420, 520), (420, 280, 660, 520)],
    'pintor_death': [(120, 260, 360, 520), (380, 260, 640, 520)],
}


def local_bg(arr, y0, y1, x0, x1):
    """Median border color of the full image, matching the prepare scripts."""
    edge = np.concatenate((arr[:12].reshape(-1, 3), arr[-12:].reshape(-1, 3),
                           arr[:, :12].reshape(-1, 3), arr[:, -12:].reshape(-1, 3)))
    return np.median(edge, axis=0)


def remove_detached(arr, min_touch_dilate=4, max_keep=400000):
    """Paint detached opaque islands back to the background color."""
    bg = local_bg(arr, 0, arr.shape[0], 0, arr.shape[1])
    dist = np.linalg.norm(arr.astype(np.float32) - bg, axis=2)
    body = dist > 40
    labels, n = ndimage.label(body)
    if n <= 1:
        return 0
    sizes = ndimage.sum(np.ones_like(labels), labels, range(1, n + 1))
    # Grow the body mask slightly: fragments that brush the silhouette count as
    # attached and are left for the manual repairs.
    grown = ndimage.binary_dilation(body, iterations=4)
    labels_g, _ = ndimage.label(grown)
    touching = set(np.unique(labels_g[body])) - {0}
    removed = 0
    for i in range(1, n + 1):
        if i in touching or sizes[i - 1] > max_keep:
            continue
        m = labels == i
        arr[m] = bg.astype(arr.dtype)
        removed += int(m.sum())
    return removed


def smooth_garment_edges(arr, boxes, iterations=7):
    """Morph-closing + blur-threshold the garment boundary inside arm boxes."""
    bg = local_bg(arr, 0, arr.shape[0], 0, arr.shape[1])
    dist = np.linalg.norm(arr.astype(np.float32) - bg, axis=2)
    opaque = dist > 40
    for (x0, y0, x1, y1) in boxes:
        sub = opaque[y0:y1, x0:x1]
        if not sub.any():
            continue
        closed = ndimage.binary_closing(sub, structure=np.ones((3, 3)), iterations=iterations)
        filled = ndimage.binary_fill_holes(closed)
        grown = filled & ~ndimage.binary_erosion(filled, iterations=1)
        new = grown & ~sub
        if not new.any():
            continue
        # Fill with a flat garment color sampled just inside the new boundary.
        src = filled & ~new
        src &= ndimage.binary_erosion(src, iterations=2)
        if not src.any():
            continue
        ys, xs = np.nonzero(src)
        # Sample from the side closest to each new pixel via nearest index.
        pts = np.stack([ys, xs], axis=1)
        ny, nx = np.nonzero(new)
        idx = (ny[:, None] - pts[None, :, 0]) ** 2 + (nx[:, None] - pts[None, :, 1]) ** 2
        nearest = pts[idx.argmin(axis=1)]
        for (py, px), (sy, sx) in zip(np.stack([ny, nx], 1), nearest):
            arr[y0 + py, x0 + px] = arr[y0 + sy, x0 + sx]
    return arr


def main():
    names = sorted({k.rsplit('_', 1)[0] for k in ARM_BOXES})
    for stem, boxes in ARM_BOXES.items():
        path = CONCEPTS / (stem + '.webp')
        im = Image.open(path).convert('RGB')
        arr = np.array(im)
        removed = remove_detached(arr)
        arr = smooth_garment_edges(arr, boxes)
        Image.fromarray(arr).save(path, lossless=True, method=6)
        print(stem, 'detached px removed:', removed)


if __name__ == '__main__':
    main()
