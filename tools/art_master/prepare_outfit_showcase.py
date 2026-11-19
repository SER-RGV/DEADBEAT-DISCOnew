#!/usr/bin/env python3
"""Prepare selection-only portraits from the preserved blue-backed masters.

Requires Pillow, NumPy and SciPy. These are not gameplay animation frames.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
from artlib import save_png

ROOT = Path(__file__).resolve().parents[2]
CONCEPTS = ROOT / 'assets/characters/outfits/concepts'
OUTFITS = ROOT / 'assets/characters/outfits'
NAMES = ('caballero', 'asesino', 'jinete', 'buzo', 'pistolero', 'lagrimas', 'entrenador', 'aventurero', 'cocinero')


def main():
    for name in NAMES:
        image = Image.open(CONCEPTS / ('showcase_' + name + '.webp')).convert('RGB')
        rgb = np.asarray(image).astype(np.float32)
        # The reference background is uniformly colored, with slight compression
        # and gradients. Color-distance limits avoid removing cyan costume details.
        edge = np.concatenate((rgb[:12].reshape(-1, 3), rgb[-12:].reshape(-1, 3),
                               rgb[:, :12].reshape(-1, 3), rgb[:, -12:].reshape(-1, 3)))
        bg = np.median(edge, axis=0)
        dist = np.linalg.norm(rgb - bg, axis=2)
        candidate = dist < 48
        labels, _ = ndimage.label(candidate)
        border = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
        connected = np.isin(labels, border[border != 0])
        # Also remove isolated areas of the identical backdrop between limbs.
        background = connected | (dist < 20)
        # Soft 2px matte plus chroma-spill decontamination on the border.
        d = ndimage.distance_transform_edt(~background)
        coverage = np.clip(d / 2.2, 0, 1)
        clean = d >= 4
        _, (iy, ix) = ndimage.distance_transform_edt(~clean, return_indices=True)
        filled = rgb[iy, ix]
        halo = (d > 0) & (d < 4)
        rgb = np.where(halo[..., None], filled, rgb)
        alpha = (coverage * 255).astype(np.uint8)
        rgba = np.dstack((np.clip(rgb, 0, 255).astype(np.uint8), alpha))
        result = Image.fromarray(rgba, 'RGBA')
        bbox = result.getchannel('A').getbbox()
        if not bbox or bbox[0] <= 0 or bbox[1] <= 0 or bbox[2] >= image.width or bbox[3] >= image.height:
            raise RuntimeError(f'{name}: image clipped or background not removed: {bbox}')
        result = result.crop(bbox)
        result.thumbnail((600, 1120), Image.Resampling.LANCZOS)
        save_png(result, str(OUTFITS / name / 'showcase.png'))
        print(name, 'bg', bg.astype(int).tolist(), 'bbox', bbox, 'size', result.size)

if __name__ == '__main__':
    main()
