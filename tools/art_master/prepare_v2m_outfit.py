#!/usr/bin/env python3
"""Prepare genérico de la colección v2m (ocho atuendos de la directiva V1.0).

Lee maestros .cache/v2m/m_<outfit>_<pose>.png y produce las sprites del motor
(assets/characters/outfits/<outfit>/<pose>.png) con las convenciones del contrato:
idle/walk_a 288x512 figure-hip; aim/hurt 352x512 figure-bbox; roll 384x384
contain; death 640x320 contain + flip horizontal. Volcado del maestro a concepts.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageFilter
from artlib import chroma_matte, fit_canvas

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BLUE = (10, 10, 245)
OUTFITS = ('original', 'rapture', 'shadow', 'apocalypse', 'gunslinger',
           'fightclub', 'kitchenriot', 'streetart')
POSES = {
    'idle': 'idle', 'walk': 'walk_a', 'aim': 'aim',
    'hurt': 'hurt', 'roll': 'roll', 'death': 'death',
}
FIT = {
    'idle': dict(size=(288, 512), mode='figure', height=462, baseline=505, align='hip', sharpen=20),
    'walk_a': dict(size=(288, 512), mode='figure', height=462, baseline=505, align='hip', sharpen=20),
    'aim': dict(size=(352, 512), mode='figure', height=462, baseline=505, align='bbox', sharpen=20),
    'hurt': dict(size=(352, 512), mode='figure', height=462, baseline=505, align='bbox', sharpen=20),
    'roll': dict(size=(384, 384), mode='contain', margin=8),
    'death': dict(size=(640, 320), mode='contain', margin=8),
}


def normalize_blue(im):
    import numpy as np
    a = np.array(im.convert('RGB'))
    r, g, b = (a[:, :, i].astype(int) for i in range(3))
    a[(b - g > 55) & (b - r > 70)] = list(BLUE)
    return Image.fromarray(a)


def border_key(im):
    """Recorte de último recurso: color mediano del borde → alpha por distancia."""
    import numpy as np
    a = np.array(im.convert('RGB')).astype(int)
    h, w, _ = a.shape
    border = np.concatenate([a[0:6].reshape(-1, 3), a[-6:].reshape(-1, 3),
                             a[:, 0:6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    key = np.median(border, axis=0)
    dist = np.sqrt(((a - key) ** 2).sum(axis=2))
    alpha = np.where(dist < 62, 0, 255).astype('uint8')
    out = im.convert('RGBA')
    import PIL.Image as PILImage
    am = PILImage.fromarray(alpha, 'L')
    out.putalpha(am)
    return out


def despeckle(cut):
    """Conserva sólo la componente conexa mayor del alpha (quita ruido cian)."""
    import numpy as np
    a = np.array(cut.getchannel('A'))
    mask = a > 24
    if mask.sum() == 0:
        return cut
    try:
        from scipy import ndimage  # noqa
        lab, n = ndimage.label(mask)
        if n > 1:
            sizes = ndimage.sum(mask, lab, range(1, n + 1))
            keep = int(np.argmax(sizes)) + 1
            a = np.where(lab == keep, a, 0).astype('uint8')
            cut.putalpha(PILImage.fromarray(a, 'L'))
    except Exception:
        pass
    return cut


def main(only=None):
    todo = [only] if only else list(OUTFITS)
    for outfit in todo:
        outdir = os.path.join(ROOT, 'assets', 'characters', 'outfits', outfit)
        os.makedirs(outdir, exist_ok=True)
        for src_pose, dst_pose in POSES.items():
            src = os.path.join(ROOT, '.cache', 'v2m', f'm_{outfit}_{src_pose}.png')
            if not os.path.exists(src):
                print(f'-- pendiente {outfit}/{dst_pose}')
                continue
            im = Image.open(src).convert('RGB')
            im.save(os.path.join(ROOT, 'assets', 'characters', 'outfits', 'concepts',
                                 f'v2m_{outfit}_{src_pose}.webp'), lossless=True, method=6)
            im = normalize_blue(im)
            try:
                cut, _ = chroma_matte(im, key='blue', mode='hard')
            except Exception:
                from city_matte import city_matte
                try:
                    cut = city_matte(Image.open(src).convert('RGB'))
                except Exception:
                    cut = border_key(Image.open(src).convert('RGB'))
            # Si el fondo no se recortó (marco opuesto), recorte por color de borde.
            import numpy as np
            ab = np.array(cut.getchannel('A'))
            edge = np.concatenate([ab[0:4].ravel(), ab[-4:].ravel(), ab[:, 0:4].ravel(), ab[:, -4:].ravel()])
            if (edge > 24).mean() > 0.5:
                cut = border_key(Image.open(src).convert('RGB'))
            cut = despeckle(cut)
            spec = dict(FIT[dst_pose])
            size = spec.pop('size')
            frame, _meta = fit_canvas(cut, size=size, fit=spec)
            if dst_pose == 'death':
                frame = frame.transpose(Image.FLIP_LEFT_RIGHT)
            frame.save(os.path.join(outdir, f'{dst_pose}.png'))
            print(f'OK {outfit}/{dst_pose} {frame.size}')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
