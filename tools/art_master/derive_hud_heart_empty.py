#!/usr/bin/env python3
"""T07 HUD · corazón vacío derivado del corazón lleno (determinista, sin IA).

`updateHud()` muestra `hud_heart_empty` con `opacity:.28; filter:grayscale(1)`: cualquier
trazo magenta queda casi invisible sobre el panel oscuro del HUD (medido en juego: máximo
30/255). Para que la vida perdida se lea como corazón hueco sin tocar el CSS, el vacío se
deriva de la silueta exacta de `hud_heart_full` con un aro claro (rosa pálido, luminancia
~220 → ~80/255 tras el CSS) y relleno carbón translúcido.

Uso:
    python3 tools/art_master/derive_hud_heart_empty.py \
        [--full assets/ui/hud_heart_full.png] [--out /home/user/dd_work/raw/T07_HUD/hud_heart_empty.png]

La salida es el "crudo" RGBA del lote (ficha: matte none, fit stretch); después:
    batch.py process docs/ART_REBUILD/batches/T07_HUD.json --only hud_heart_empty --no-sheet
"""
import argparse
import os

from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

RING_RGB = (255, 207, 227)     # rosa pálido: sobrevive al grayscale+opacity del CSS
INK_RGB = (20, 12, 26)         # contorno tinta exterior (coherente con el lleno)
FILL_RGBA = (26, 14, 26, 150)  # carbón translúcido: hueco, pero con cuerpo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--full", default=os.path.join(ROOT, "assets", "ui", "hud_heart_full.png"))
    ap.add_argument("--out", default="/home/user/dd_work/raw/T07_HUD/hud_heart_empty.png")
    ap.add_argument("--ring", type=int, default=11, help="grosor del aro claro en px (a 128²)")
    ap.add_argument("--ink", type=int, default=3, help="grosor del contorno tinta exterior en px")
    args = ap.parse_args()

    full = Image.open(args.full).convert("RGBA")
    w, h = full.size
    S = 4  # supermuestreo para bordes suaves
    alpha = full.split()[3].resize((w * S, h * S), Image.Resampling.BICUBIC)
    mask = alpha.point(lambda v: 255 if v >= 128 else 0)             # silueta (incluye la tinta del lleno)
    k_ink = args.ink * S * 2 + 1
    k_ring = (args.ink + args.ring) * S * 2 + 1
    inner_ring = mask.filter(ImageFilter.MinFilter(k_ink))           # silueta sin la tinta exterior
    core = mask.filter(ImageFilter.MinFilter(k_ring))                # interior hueco

    out = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    ink = Image.new("RGBA", mask.size, INK_RGB + (255,))
    ring = Image.new("RGBA", mask.size, RING_RGB + (255,))
    fill = Image.new("RGBA", mask.size, FILL_RGBA)
    out.paste(ink, (0, 0), mask)
    out.paste(ring, (0, 0), inner_ring)
    out.paste(fill, (0, 0), core)
    # brillo discreto arriba-izquierda del aro, como el filo blanco del lleno
    hl = Image.new("RGBA", mask.size, (255, 255, 255, 255))
    hl_mask = Image.new("L", mask.size, 0)
    from PIL import ImageDraw
    d = ImageDraw.Draw(hl_mask)
    d.ellipse((int(w * S * 0.24), int(h * S * 0.17), int(w * S * 0.40), int(h * S * 0.30)), fill=255)
    hl_mask = Image.composite(hl_mask, Image.new("L", mask.size, 0), inner_ring)
    out.paste(hl, (0, 0), hl_mask)

    final = out.resize((w, h), Image.Resampling.LANCZOS)
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    final.save(args.out, "PNG", optimize=True)
    bbox = final.split()[3].getbbox()
    print("corazón vacío derivado -> %s  %dx%d  bbox=%s  aro=%dpx tinta=%dpx" % (args.out, w, h, bbox, args.ring, args.ink))


if __name__ == "__main__":
    main()
