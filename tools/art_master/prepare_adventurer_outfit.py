#!/usr/bin/env python3
"""Build the Aventurero del bosque sprites from the green-screen art masters.
Requires Pillow, NumPy and SciPy (as does artlib).
"""
from pathlib import Path
import numpy as np
from PIL import Image
from artlib import chroma_matte, fit_canvas, save_png

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/characters/outfits/concepts'
DEST = ROOT / 'assets/characters/outfits/aventurero'
FRAMES = {'idle':'capucha_idle', 'walk_a':'capucha_walk', 'aim':'capucha_aim', 'hurt':'capucha_hurt', 'roll':'capucha_roll', 'death':'capucha_death'}


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for name, source in FRAMES.items():
        im = Image.open(SOURCE / ('aventurero_' + source + '.webp')).convert('RGB')
        # Normalize uneven blue background, preserving green fabric and cyan embroidery.
        a = np.array(im)
        r, g, b = (a[:, :, i].astype(int) for i in range(3))
        a[(b-g > 55) & (b-r > 70)] = [10, 10, 245]
        im = Image.fromarray(a)
        im, _ = chroma_matte(im, key='blue', mode='hard')
        if name == 'death':
            im = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if name in ('roll', 'death'):
            size = (384, 384) if name == 'roll' else (640, 320)
            fit = {'mode':'contain', 'margin':8, 'anchor':'bottom'}
        else:
            size = (288, 512)
            fit = {'mode':'figure', 'height':462, 'baseline':505, 'align':'hip', 'sharpen':20}
        frame, info = fit_canvas(im, size, fit)
        if info.get('clipped') or frame.getchannel('A').getbbox() is None:
            raise RuntimeError(f'{name}: empty or clipped sprite: {info}')
        save_png(frame, str(DEST / (name + '.png')))
        print(name, info)


if __name__ == '__main__':
    main()
