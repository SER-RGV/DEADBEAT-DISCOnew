#!/usr/bin/env python3
"""Build the Kickboxer sprites from the blue-screen art masters.
Requires Pillow, NumPy and SciPy (as does artlib).
"""
from pathlib import Path
import numpy as np
from PIL import Image
from artlib import chroma_matte, fit_canvas, save_png

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/characters/outfits/concepts'
DEST = ROOT / 'assets/characters/outfits/kickboxer'
FRAMES = {'idle':'idle', 'walk_a':'walk', 'aim':'aim', 'hurt':'hurt', 'roll':'roll', 'death':'death'}


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for name, source in FRAMES.items():
        im = Image.open(SOURCE / ('kickboxer_vendas_' + source + '.webp')).convert('RGB')
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
