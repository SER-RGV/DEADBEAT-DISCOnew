#!/usr/bin/env python3
"""Prepare *draft* dark-knight frames for visual review, not runtime use.

Run with an environment containing Pillow, NumPy and SciPy. The conversion uses
exactly the existing art pipeline; a successful chroma key does not certify that
poses, weapon anchors or waist seams are suitable for the game.
"""
from pathlib import Path
from PIL import Image
from artlib import chroma_matte, fit_canvas, save_png

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/characters/outfits/concepts'
DEST = ROOT / 'assets/characters/outfits/caballero_drafts'

# Shared body height and floor line for standing and walking. These are drafts,
# not a promise that generated figures align anatomically across frames.
FRAMES = {
    'idle': 'caballero_oscuro.png',
    'walk_a': 'caballero_paso_1.webp',
    'walk_b': 'caballero_paso_2.webp',
    'aim': 'caballero_apuntar.webp',
    'hurt': 'caballero_herido.webp',
}


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for name, src in FRAMES.items():
        image = Image.open(SOURCE / src)
        matte, _ = chroma_matte(image, key='green', mode='hard')
        frame, info = fit_canvas(matte, (288, 512), {
            'mode': 'figure', 'height': 462, 'baseline': 505,
            'align': 'hip', 'sharpen': 20,
        })
        if info['clipped']:
            raise RuntimeError(f'{name}: figure clipped, adjust canvas/anchors before use: {info}')
        if frame.getchannel('A').getbbox() is None:
            raise RuntimeError(f'{name}: empty frame')
        save_png(frame, str(DEST / (name + '.png')))
        print(name, info)


if __name__ == '__main__':
    main()
