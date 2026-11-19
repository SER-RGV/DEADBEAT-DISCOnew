#!/usr/bin/env python3
"""Build the Caballero sprites from the blue-screen art masters.
Requires Pillow, NumPy and SciPy (as does artlib).

Modeled on prepare_kickboxer_outfit.py; concept filenames keep their original
Spanish names (see FRAMES below).
"""
from pathlib import Path
import numpy as np
from PIL import Image
from artlib import chroma_matte, fit_canvas, save_png

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/characters/outfits/concepts'
DEST = ROOT / 'assets/characters/outfits/caballero'
FRAMES = {
    'idle': 'caballero_oscuro.png',
    'walk_a': 'caballero_paso_1.webp',
    'aim': 'caballero_apuntar.webp',
    'hurt': 'caballero_herido.webp',
    'roll': 'caballero_esquiva.webp',
    'death': 'caballero_caida.webp',
}


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for name, source in FRAMES.items():
        im = Image.open(SOURCE / source).convert('RGB')
        # Normalize uneven blue background before keying.
        a = np.array(im)
        r, g, b = (a[:, :, i].astype(int) for i in range(3))
        a[(b-g > 55) & (b-r > 70)] = [10, 10, 245]
        im = Image.fromarray(a)
        im, _ = chroma_matte(im, key='blue', mode='hard')
        if name == 'death':
            im = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if name in ('roll', 'death'):
            size = (384, 384) if name == 'roll' else (640, 320)
            fit = {'mode': 'contain', 'margin': 8, 'anchor': 'bottom'}
        else:
            size = (288, 512)
            fit = {'mode': 'figure', 'height': 462, 'baseline': 505, 'align': 'hip', 'sharpen': 20}
            if name == 'walk_a':
                # The wide stride + flowing tabard misleads the hip band; center the bbox.
                fit['align'] = 'bbox'
        frame, info = fit_canvas(im, size, fit)
        if info.get('clipped') or frame.getchannel('A').getbbox() is None:
            raise RuntimeError(f'{name}: empty or clipped sprite: {info}')
        save_png(frame, str(DEST / (name + '.png')))
        print(name, info)


if __name__ == '__main__':
    main()
