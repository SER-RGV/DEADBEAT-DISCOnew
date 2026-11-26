"""Offline HUD artwork. Rasterize the seven symbols at their existing native sizes."""
from pathlib import Path
from io import BytesIO
from resvg_py import svg_to_bytes
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / 'assets/ui'
INK = '#201926'

def path(d, fill, stroke='none', width=0):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"/>'

def disk(x, y, r, color):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}"/>'

def badge(name, size, colors, drawing):
    light, mid, dark = colors
    doc = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size*4}" height="{size*4}" viewBox="0 0 64 64"><defs><linearGradient id="paint" x2="80%" y2="100%"><stop stop-color="{light}"/><stop offset=".52" stop-color="{mid}"/><stop offset="1" stop-color="{dark}"/></linearGradient></defs>{drawing}</svg>'''
    with Image.open(BytesIO(svg_to_bytes(svg_string=doc))) as im:
        im.convert('RGBA').resize((size,size),Image.Resampling.LANCZOS).save(OUT / f'hud_{name}.png',optimize=True)

P = 'url(#paint)'
heart = 'M32 57 C26 52 5 38 5 22 C5 7 22 3 32 16 C42 3 59 7 59 22 C59 37 40 52 32 57Z'
badge('heart_full',128,('#ffaf98','#d84260','#792443'),path(heart,P,INK,3)+path('M11 22 Q12 13 20 14','none','#ffe0b9',3)+path('M18 36 Q27 43 34 46 L32 51Z','#b92c50'))
badge('heart_empty',128,('#392f43','#261f30','#16141e'),path(heart,P,'#9c7184',3)+path('M12 22 Q14 14 20 14','none','#685363',2))
badge('shield_badge',128,('#c2edde','#62c7be','#335d75'),path('M32 4 Q44 12 57 13 Q57 46 32 60 Q7 46 7 13 Q21 12 32 4Z',P,INK,3)+path('M32 12 Q41 18 49 18 Q48 39 32 51 Q16 39 15 18 Q23 18 32 12Z','#28394b')+path('M32 18 L41 31 L32 45 L23 31Z',P))
badge('credit_coin',128,('#f5daa0','#ce9859','#926044'),disk(32,32,29,INK)+disk(32,32,26,P)+disk(32,32,21,'#745038')+disk(32,32,19,'#ddac70')+path('M20 20 L25 24 L31 16 L36 24 L43 19 L41 30 H22Z',INK)+path('M22 36 Q22 27 32 28 Q43 28 43 36 Q43 41 37 43 L36 47 H27 L26 43 Q21 41 22 36Z',INK)+disk(28,36,2.4,'#ebbe86')+disk(36,36,2.4,'#ebbe86'))
badge('skill_bomb',160,('#fbd49d','#ca906b','#a64b64'),path('M31 8 L51 19 V42 L31 54 L11 42 V19Z',P,INK,3)+path('M11 19 L31 30 L51 19 M31 30 V54','none',INK,2.6)+path('M31 14 L36 17 L31 20 L26 17Z','#fff1c8')+path('M15 26 L23 30 L18 32 L25 38','none','#5c2638',2.6)+path('M38 33 L44 29 M38 41 L44 37','none','#502638',2.6)+path('M54 6 L50 13 M58 16 L54 18 M5 43 L3 49','none','#f4b87c',2.5))
badge('skill_boost',160,('#ffb3a1','#df698a','#a73b76'),path('M30 6 H54 L39 25 H53 L18 59 L26 36 H12Z',P,INK,3)+path('M7 21 H21 M4 28 H17','none','#82c9cd',3)+path('M31 11 H44 L29 27Z','#ffdbc0'))
badge('skill_dodge',160,('#c7ecdc','#74c4bf','#476b89'),path('M7 40 C1 25 20 10 40 12 L41 6 L55 16 L40 26 L40 20 C23 19 11 31 7 40Z',P,INK,2)+path('M57 24 C64 39 45 54 25 52 L24 58 L10 48 L25 38 L25 44 C40 44 54 33 57 24Z',P,INK,2)+path('M27 34 L36 27 L34 34 L26 39Z','#d1e6d7'))
