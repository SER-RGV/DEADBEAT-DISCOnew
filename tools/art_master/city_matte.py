#!/usr/bin/env python3
"""Matte the v3 identity showcases (neon city backdrops) into transparent figures.

The v3 edits returned themed backdrops instead of plain key color. The backdrop
is saturated magenta/purple/cyan scenery; the figures are ink-outlined and
mostly desaturated or red-crimson, so background = saturated band-colored
pixels connected to the border. Small stray remnants are dropped afterwards.
"""
import numpy as np
from PIL import Image
from scipy import ndimage


def city_matte(im, halo_fix=True):
    rgb = np.asarray(im.convert('RGB')).astype(np.float32) / 255
    mx = rgb.max(axis=2); mn = rgb.min(axis=2); d = mx - mn
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    hue = np.where(mx == r, ((g - b) / np.maximum(d, 1e-6)) % 6,
          np.where(mx == g, (b - r) / np.maximum(d, 1e-6) + 2, (r - g) / np.maximum(d, 1e-6) + 4)) * 60
    sat = d / np.maximum(mx, 1e-6)
    band = ((hue > 272) & (hue < 338)) | ((hue > 213) & (hue < 258))
    cand = band & (sat > 0.20) & (mx > 0.10)
    labels, _ = ndimage.label(cand)
    border = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
    bg = np.isin(labels, border[border != 0])
    dist = ndimage.distance_transform_edt(~bg)
    coverage = np.clip(dist / 2.2, 0, 1)
    if halo_fix:
        clean = dist >= 4
        if clean.any():
            _, (iy, ix) = ndimage.distance_transform_edt(~clean, return_indices=True)
            filled = rgb[iy, ix]
            halo = (dist > 0) & (dist < 4)
            rgb = np.where(halo[..., None], filled, rgb)
    rgba = np.dstack((np.clip(rgb * 255, 0, 255).astype(np.uint8), (coverage * 255).astype(np.uint8)))
    result = Image.fromarray(rgba, 'RGBA')
    # drop small detached remnants
    a = np.asarray(result)[:, :, 3] > 40
    labels, n = ndimage.label(a)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(labels), labels, range(1, n + 1))
        big = np.argmax(sizes) + 1
        out = np.asarray(result).copy()
        for i in range(1, n + 1):
            if i != big and sizes[i - 1] < 4500:
                out[labels == i, 3] = 0
        result = Image.fromarray(out, 'RGBA')
    bbox = result.getchannel('A').getbbox()
    return result.crop(bbox) if bbox else result
