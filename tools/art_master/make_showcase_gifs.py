#!/usr/bin/env python3
"""Showcases animados (GIF) por atuendo: halo neón, scanline, destellos y placa."""
import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
LOOKS = [
    ('00', 'EL DESAFINADO', 'El look de siempre.', 'original'),
    ('01', 'RAPTURE', 'Elegancia art deco.', 'rapture'),
    ('02', 'SHADOW', 'Sigilo con estilo.', 'shadow'),
    ('03', 'APOCALYPSE', 'Blindado para el fin.', 'apocalypse'),
    ('04', 'GUNSLINGER', 'Listo para el duelo.', 'gunslinger'),
    ('05', 'FIGHT CLUB', 'Vendas y garra.', 'fightclub'),
    ('06', 'KITCHEN RIOT', 'Cocina punk.', 'kitchenriot'),
    ('07', 'STREET ART', 'El lienzo eres tu.', 'streetart'),
]
W, H = 480, 640
MAGENTA, CYAN, VIOLET = (255, 0, 110), (0, 229, 255), (155, 0, 255)
FONTS = {s: ImageFont.truetype(FONT, s) for s in (15, 17, 20, 24, 30)}


def bg_frame(t):
    im = Image.new('RGB', (W, H), (11, 8, 18))
    d = ImageDraw.Draw(im)
    for y in range(H):
        k = y / H
        d.line([(0, y), (W, y)], fill=(int(11 + 30 * k), int(8 + 12 * k), int(18 + 46 * k)))
    glow = Image.new('L', (W, H), 0)
    gd = ImageDraw.Draw(glow)
    r = 210 + int(18 * math.sin(t * 0.9))
    gd.ellipse([W // 2 - r, -140, W // 2 + r, 170], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    im.paste(Image.new('RGB', (W, H), MAGENTA), (0, 0), glow)
    for yy in range(0, H, 16):
        for xx in range(0, W, 16):
            d.ellipse([xx, yy, xx + 2, yy + 2], fill=(30, 22, 48))
    for i in range(26):
        x = (i * 173 + int(t * 26)) % W
        y = (i * 271 + int(t * 41)) % H
        b = 90 + int(60 * math.sin(t * 2 + i))
        d.ellipse([x, y, x + 2, y + 2], fill=(b, b // 2, b))
    return im


def glow_text(d, xy, text, font, fill, glow, spread=3):
    x, y = xy
    for dx in range(-spread, spread + 1, 2):
        for dy in range(-spread, spread + 1, 2):
            d.text((x + dx, y + dy), text, font=font, fill=glow)
    d.text(xy, text, font=font, fill=fill)


def build(look, out):
    num, name, desc, folder = look
    sc0 = Image.open(os.path.join(ROOT, 'assets', 'characters', 'outfits', folder, 'showcase.png')).convert('RGBA')
    frames = []
    for k in range(30):
        t = k * 0.12
        im = bg_frame(t)
        d = ImageDraw.Draw(im)
        f_name = FONTS[30] if len(name) < 10 else FONTS[24]
        glow_text(d, (24, 20), f'{num}  {name}', f_name, (245, 230, 214), MAGENTA, 3)
        glow_text(d, (26, 58), desc, FONTS[15], (200, 195, 210), VIOLET, 2)
        # respiración sutil
        zoom = 1 + 0.012 * math.sin(t * 1.3)
        sc = sc0.resize((int(sc0.width * zoom), int(sc0.height * zoom)), Image.Resampling.LANCZOS)
        sc.thumbnail((400, 470), Image.Resampling.LANCZOS)
        pulse = 0.6 + 0.4 * math.sin(t * 2.4)
        halo = Image.new('RGBA', (sc.width + 40, sc.height + 40), (0, 0, 0, 0))
        hd = ImageDraw.Draw(halo)
        hd.ellipse([4, 4, halo.width - 4, halo.height - 4],
                   outline=tuple(int(c * pulse) for c in MAGENTA) + (110,), width=5)
        halo = halo.filter(ImageFilter.GaussianBlur(7))
        x0, y0 = (W - sc.width) // 2, 96
        im.paste(halo, (x0 - 20, y0 - 20), halo)
        im.paste(sc, (x0, y0), sc)
        d.ellipse([x0 - 14, y0 - 8, x0 + sc.width + 14, y0 + sc.height + 8],
                  outline=tuple(int(c * (0.55 + 0.45 * pulse)) for c in CYAN), width=2)
        sy = int((t * 260) % (H + 120)) - 60
        band = Image.new('RGBA', (W, 26), (0, 229, 255, 26))
        im.paste(band, (0, sy), band)
        d.rectangle([0, H - 8, W, H], fill=MAGENTA if (k // 5) % 2 == 0 else CYAN)
        frames.append(im.convert('P', palette=Image.ADAPTIVE, colors=128))
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=90, loop=0, optimize=True, disposal=2)


def main():
    outdir = os.path.join(ROOT, 'docs', 'evidence', 'coleccion')
    os.makedirs(outdir, exist_ok=True)
    for look in LOOKS:
        out = os.path.join(outdir, f'showcase-{look[3]}.gif')
        build(look, out)
        print('gif', look[3], os.path.getsize(out) // 1024, 'KB')


if __name__ == '__main__':
    main()
