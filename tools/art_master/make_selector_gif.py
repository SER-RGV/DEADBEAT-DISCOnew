#!/usr/bin/env python3
"""GIF animado tipo selector del menú con efectos neón para los ocho aspectos."""
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
    # halftone
    for yy in range(0, H, 16):
        for xx in range(0, W, 16):
            d.ellipse([xx, yy, xx + 2, yy + 2], fill=(30, 22, 48))
    # destellos
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


def look_image(i):
    return Image.open(os.path.join(ROOT, 'assets', 'characters', 'outfits', LOOKS[i][3], 'showcase.png')).convert('RGBA')


FONTS = {s: ImageFont.truetype(FONT, s) for s in (13, 15, 17, 20, 24, 30)}


def main():
    thumbs = []
    for i in range(8):
        t = look_image(i).copy()
        t.thumbnail((40, 74), Image.Resampling.LANCZOS)
        thumbs.append(t)
    frames = []

    def draw_look(i, local, trans):
        t = local
        im = bg_frame(t)
        d = ImageDraw.Draw(im)
        # placa superior
        d.rectangle([0, 0, W, 6], fill=MAGENTA)
        num, name, desc, _ = LOOKS[i]
        f_name = FONTS[30] if len(name) < 10 else FONTS[24]
        glow_text(d, (24, 20), f'{num}  {name}', f_name, (245, 230, 214), MAGENTA, 3)
        glow_text(d, (26, 58), desc, FONTS[15], (200, 195, 210), VIOLET, 2)
        # showcase con halo pulsante
        sc = look_image(i)
        sc.thumbnail((400, 470), Image.Resampling.LANCZOS)
        pulse = 0.6 + 0.4 * math.sin(t * 2.4)
        halo = Image.new('RGBA', (sc.width + 40, sc.height + 40), (0, 0, 0, 0))
        hd = ImageDraw.Draw(halo)
        col = tuple(int(c * pulse) for c in MAGENTA) + (110,)
        hd.ellipse([4, 4, halo.width - 4, halo.height - 4], outline=col, width=5)
        halo = halo.filter(ImageFilter.GaussianBlur(7))
        x0, y0 = (W - sc.width) // 2, 96
        im.paste(halo, (x0 - 20, y0 - 20), halo)
        im.paste(sc, (x0, y0), sc)
        # anillo neón vivo
        d.ellipse([x0 - 14, y0 - 8, x0 + sc.width + 14, y0 + sc.height + 8],
                  outline=tuple(int(c * (0.55 + 0.45 * pulse)) for c in CYAN), width=2)
        # barrido scanline
        sy = int((t * 260) % (H + 120)) - 60
        band = Image.new('RGBA', (W, 26), (0, 229, 255, 26))
        im.paste(band, (0, sy), band)
        # fila de miniaturas del selector
        d.rectangle([0, H - 78, W, H], fill=(16, 11, 26))
        d.line([(0, H - 78), (W, H - 78)], fill=MAGENTA, width=2)
        for j, th in enumerate(thumbs):
            tx = 14 + j * 57
            if j == i:
                d.rectangle([tx - 5, H - 70, tx + 45, H - 10], outline=CYAN, width=2)
                d.rectangle([tx - 3, H - 68, tx + 43, H - 12], outline=MAGENTA, width=1)
            im.paste(th, (tx, H - 66), th)
        if trans > 0:
            fl = Image.new('RGBA', (W, H), (255, 240, 250, int(150 * trans)))
            im.paste(fl, (0, 0), fl)
        return im

    for i in range(8):
        for k in range(13):
            frames.append(draw_look(i, k * 0.11, 0))
        for k in range(3):
            frames.append(draw_look(i, 1.4 + k * 0.11, 1 - k / 3))
    out = os.path.join(ROOT, 'docs', 'evidence', 'coleccion', 'selector-animado.gif')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    frames = [f.convert('P', palette=Image.ADAPTIVE, colors=128) for f in frames]
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=90, loop=0, optimize=True, disposal=2)
    print('gif', out, os.path.getsize(out) // 1024, 'KB')
    # cartel estático
    poster = draw_look(5, 0.8, 0).convert('RGB')
    poster.save(os.path.join(ROOT, 'docs', 'evidence', 'coleccion', 'selector-poster.png'))
    print('poster ok')


if __name__ == '__main__':
    main()
