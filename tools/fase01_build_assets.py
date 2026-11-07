#!/usr/bin/env python3
"""
DEADBEAT DISCO — Fase 01 · BLOQUE 02
Reconstrucción determinista de los assets de arranque (LOADING / INTRO / MENÚ).

Reglas que cumple este script (ver FASE_01_BLOQUE_02_ASSETS.md):
  · No inventa diseños: todo deriva del arte aprobado que ya vive en el repositorio.
  · Es determinista: misma entrada -> mismos bytes (sin aleatoriedad, sin red).
  · Declara los límites: cuando la única fuente es de 1280x720 se dice en el informe.

Salidas (assets/fase01/):
  menu_backdrop_2k.webp        2560x1440  Ilustración del menú, capa limpia (sin UI horneada)
  loading_keyart_2k.webp       2560x1440  Key art del club para la pantalla de carga
  emblem_fox_glow.png           768x768   Emblema aprobado + halo de neón (alpha)
  logo_deadbeat_trim.png        740x614   Logotipo aprobado recortado a su caja real (alpha)
  brand_divider.png            1200x64   Filete divisor con diamante (alpha)
  menu_icon_*.png                 64x64   5 iconos de navegación (2 estados)
"""
import hashlib
import json
import os

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_MENU = os.path.join(ROOT, "assets", "ui", "menu_main_backdrop.png")
SRC_KEYART = os.path.join(ROOT, "assets", "cinematics", "cine_intro_club_panorama.png")
SRC_EMBLEM = os.path.join(ROOT, "assets", "logos", "emblem_fox_crown.png")
SRC_LOGO = os.path.join(ROOT, "assets", "logos", "logo_deadbeat_graffiti.png")
OUT = os.path.join(ROOT, "assets", "fase01")

NEON_PINK = (255, 45, 122)
NEON_CYAN = (34, 211, 238)
CREAM = (246, 240, 226)
INK = (8, 4, 14)

os.makedirs(OUT, exist_ok=True)
report = []


def note(kind, path, size, extra=None):
    full = os.path.join(OUT, path)
    sha = hashlib.sha256(open(full, "rb").read()).hexdigest()
    entry = {
        "file": "assets/fase01/" + path,
        "bytes": os.path.getsize(full),
        "sha256": sha,
        "w": size[0],
        "h": size[1],
    }
    if extra:
        entry.update(extra)
    report.append(entry)
    print(f"  {path:<30} {size[0]}x{size[1]}  {os.path.getsize(full)/1024:8.1f} KB  sha16 {sha[:16]}")
    return entry


def to_2k(src, dst_webp, sharp_radius=1.15, sharp_percent=58, quality=92):
    """Escalado controlado 1280x720 -> 2560x1440 + recuperación de micro-contraste.

    No añade contenido: sólo remuestrea con Lanczos y aplica un unsharp suave para
    compensar la pérdida de acutancia del remuestreado. No se usa IA ni se inventan
    detalles; el resultado se documenta como 'ampliación determinista'."""
    im = Image.open(src).convert("RGB")
    assert im.size == (1280, 720), f"fuente inesperada: {im.size}"
    big = im.resize((2560, 1440), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=sharp_radius, percent=sharp_percent, threshold=2))
    big.save(os.path.join(OUT, dst_webp), "WEBP", quality=quality, method=6)
    return big.size


def emblem_with_glow(src, dst, canvas=768):
    """Emblema aprobado, intacto, sobre lienzo mayor con halo de neón.

    El halo se construye a partir de la SILUETA de la propia pieza (canal alfa):
    no se redibuja el emblema, sólo se le añade resplandor alrededor."""
    em = Image.open(src).convert("RGBA")
    bbox = em.getbbox()
    em = em.crop(bbox)
    scale = int(canvas * 0.70)
    em = em.resize((scale, int(scale * em.height / em.width)), Image.LANCZOS)

    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    ox = (canvas - em.width) // 2
    oy = (canvas - em.height) // 2

    # Halo: 3 pasadas de desenfoque sobre copias tintadas de la silueta.
    for radius, alpha, color in ((46, 90, NEON_PINK), (26, 130, NEON_PINK), (10, 170, CREAM)):
        layer = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
        tint = Image.new("RGBA", em.size, color + (alpha,))
        tint.putalpha(ImageChops.multiply(em.split()[3], Image.new("L", em.size, alpha)))
        layer.paste(tint, (ox, oy), tint)
        layer = layer.filter(ImageFilter.GaussianBlur(radius))
        out = Image.alpha_composite(out, layer)
    out = Image.alpha_composite(out, Image.alpha_composite(Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0)), _paste(em, ox, oy, canvas)))
    out.save(os.path.join(OUT, dst), "PNG", optimize=True)
    return (canvas, canvas)


def _paste(im, ox, oy, canvas):
    layer = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    layer.paste(im, (ox, oy), im)
    return layer


def logo_trim(src, dst):
    """Logotipo aprobado recortado a su caja real + 8 px de aire. Sin retoques."""
    im = Image.open(src).convert("RGBA")
    bbox = im.getbbox()
    pad = 8
    box = (max(0, bbox[0] - pad), max(0, bbox[1] - pad),
           min(im.width, bbox[2] + pad), min(im.height, bbox[3] + pad))
    im.crop(box).save(os.path.join(OUT, dst), "PNG", optimize=True)
    return im.crop(box).size


def divider(dst, w=1200, h=64):
    """Filete horizontal: degradado que muere en los extremos + diamante central.
    Geometría plana, coherente con los clip-path del menú (chaflanes de 45°)."""
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    mid = h // 2
    for x in range(w):
        t = x / (w - 1)
        a = int(190 * (1 - abs(t - 0.5) * 1.72) ** 2)
        if a <= 0:
            continue
        col = NEON_PINK if abs(t - 0.5) > 0.16 else NEON_CYAN
        d.point((x, mid), fill=col + (a,))
        if a > 90:
            d.point((x, mid - 1), fill=col + (a // 2,))
            d.point((x, mid + 1), fill=col + (a // 2,))
    cx = w // 2
    r = 11
    d.polygon([(cx, mid - r), (cx + r, mid), (cx, mid + r), (cx - r, mid)], fill=NEON_CYAN + (255,))
    d.polygon([(cx, mid - r + 4), (cx + r - 4, mid), (cx, mid + r - 4), (cx - r + 4, mid)], fill=INK + (255,))
    d.polygon([(cx, mid - r + 8), (cx + r - 8, mid), (cx, mid + r - 8), (cx - r + 8, mid)], fill=NEON_PINK + (255,))
    img.save(os.path.join(OUT, dst), "PNG", optimize=True)
    return (w, h)


# --- Iconos de navegación (64x64, 2 estados: normal / seleccionado) ------------
ICON_GLYPHS = {
    # nueva partida: triángulo de play
    "new":    [(22, 16), (48, 32), (22, 48)],
    # continuar: doble chevron
    "cont":   None,
    # cargar: carpeta/ranura
    "load":   None,
    # opciones: engranaje simplificado de 8 dientes
    "opts":   None,
    # creditos: cinta/estrella
    "cred":   None,
}


def icons():
    made = []
    for state, color in (("idle", NEON_PINK), ("sel", CREAM)):
        for name in ICON_GLYPHS:
            img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            if name == "new":
                d.polygon(ICON_GLYPHS[name], fill=color + (255,))
            elif name == "cont":
                for off in (0, 13):
                    d.polygon([(18 + off, 18), (34 + off, 32), (18 + off, 46)], fill=color + (255,))
            elif name == "load":
                # ranura de guardado: carpeta (pestana + cuerpo) con marca central
                d.line((14, 18, 30, 18), fill=color + (255,), width=4)
                d.line((30, 18, 34, 22), fill=color + (255,), width=4)
                d.rectangle((12, 22, 52, 50), outline=color + (255,), width=4)
                d.line((22, 36, 42, 36), fill=color + (255,), width=4)
            elif name == "opts":
                import math
                cx, cy = 32, 32
                d.ellipse((cx - 15, cy - 15, cx + 15, cy + 15), outline=color + (255,), width=5)
                for i in range(8):
                    a = math.radians(i * 45)
                    x1, y1 = cx + math.cos(a) * 17, cy + math.sin(a) * 17
                    x2, y2 = cx + math.cos(a) * 24, cy + math.sin(a) * 24
                    d.line((x1, y1, x2, y2), fill=color + (255,), width=5)
            elif name == "cred":
                d.ellipse((14, 14, 50, 50), outline=color + (255,), width=4)
                d.ellipse((26, 26, 38, 38), fill=color + (255,))
                d.line((32, 6, 32, 14), fill=color + (255,), width=4)
                d.line((32, 50, 32, 58), fill=color + (255,), width=4)
            fn = f"menu_icon_{name}_{state}.png"
            img.save(os.path.join(OUT, fn), "PNG", optimize=True)
            made.append(note("icon", fn, (64, 64), {"state": state, "glyph": name}))
    return made


def main():
    print("FASE 01 · BLOQUE 02 — reconstrucción de assets")
    print("· menu_backdrop_2k")
    note("background", "menu_backdrop_2k.webp", to_2k(SRC_MENU, "menu_backdrop_2k.webp"),
         {"source": "assets/ui/menu_main_backdrop.png", "method": "lanczos+unsharp", "alpha": False})
    print("· loading_keyart_2k")
    note("background", "loading_keyart_2k.webp", to_2k(SRC_KEYART, "loading_keyart_2k.webp", 1.05, 45, 90),
         {"source": "assets/cinematics/cine_intro_club_panorama.png", "method": "lanczos+unsharp", "alpha": False})
    print("· emblem_fox_glow")
    note("logo", "emblem_fox_glow.png", emblem_with_glow(SRC_EMBLEM, "emblem_fox_glow.png"),
         {"source": "assets/logos/emblem_fox_crown.png", "method": "silhouette glow", "alpha": True})
    print("· logo_deadbeat_trim")
    note("logo", "logo_deadbeat_trim.png", logo_trim(SRC_LOGO, "logo_deadbeat_trim.png"),
         {"source": "assets/logos/logo_deadbeat_graffiti.png", "method": "alpha bbox trim", "alpha": True})
    print("· brand_divider")
    note("ui", "brand_divider.png", divider("brand_divider.png"),
         {"source": "generated geometry", "method": "vector-ish raster", "alpha": True})
    print("· icons")
    icons()

    meta = {
        "fase": "FASE 01",
        "bloque": "02",
        "generator": "tools/fase01_build_assets.py",
        "deterministic": True,
        "palette": ["#08040e", "#ff2d7a", "#22d3ee", "#f6f0e2"],
        "assets": report,
    }
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"\n{len(report)} assets · manifest.json escrito")


if __name__ == "__main__":
    main()
