#!/usr/bin/env python3
"""Build zoomed FASE 04 before/after and per-action contact sheets from QA captures."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/evidence/atuendos/fase04-combat"
BEFORE = ROOT / "docs/evidence/atuendos/fase03-capturas"
IDS = ("original", "rapture", "shadow", "apocalypse", "gunslinger", "fightclub", "kitchenriot", "streetart")
CROP = (500, 205, 755, 460)  # gameplay camera center around the player, same 1280x720 capture
TILE = 306
HEADER = 34
BG = (15, 12, 22)
INK = (10, 9, 16)
PINK = (255, 45, 122)
CYAN = (34, 211, 238)
FONT = ImageFont.load_default()


def crop_tile(path: Path) -> Image.Image:
    with Image.open(path) as im:
        im = im.convert("RGB").crop(CROP)
        im = im.resize((TILE, TILE), Image.Resampling.LANCZOS)
    return im


def label(draw: ImageDraw.ImageDraw, box, text, color):
    draw.rectangle(box, fill=INK)
    draw.text((box[0] + 10, box[1] + 9), text, font=FONT, fill=color)


def build_before_after():
    gap, left = 8, 112
    width = left + TILE * 2 + gap * 3
    height = 52 + len(IDS) * (TILE + HEADER + 8)
    sheet = Image.new("RGB", (width, height), BG)
    d = ImageDraw.Draw(sheet)
    d.text((18, 14), "FASE 04 · LOCOMOCIÓN EN GAMEPLAY · CAPTURA BASE vs. RENDER ACTUAL", font=FONT, fill=(255, 242, 190))
    y = 48
    for outfit in IDS:
        label(d, (8, y, left - 4, y + TILE + HEADER), outfit.upper(), PINK)
        before = crop_tile(BEFORE / f"game-{outfit}.jpg")
        after = crop_tile(OUT / f"run-{outfit}.jpg")
        label(d, (left, y, left + TILE, y + HEADER), "FASE 03 · GAMEPLAY", (225, 220, 225))
        label(d, (left + TILE + gap, y, left + TILE * 2 + gap, y + HEADER), "FASE 04 · CORRER", CYAN)
        sheet.paste(before, (left, y + HEADER))
        sheet.paste(after, (left + TILE + gap, y + HEADER))
        y += TILE + HEADER + 8
    sheet.save(OUT / "antes-despues-locomocion.jpg", quality=88, optimize=True)


def build_actions():
    actions = (("recoil", "RETROCESO", PINK), ("charged", "CARGA", (255, 242, 190)),
               ("ability", "HABILIDAD", CYAN), ("hurt", "DAÑO", (255, 111, 120)),
               ("death", "MUERTE", PINK))
    gap, left = 7, 112
    width = left + len(actions) * TILE + (len(actions) + 1) * gap
    height = 52 + len(IDS) * (TILE + HEADER + 8)
    sheet = Image.new("RGB", (width, height), BG)
    d = ImageDraw.Draw(sheet)
    d.text((18, 14), "FASE 04 · RESPUESTA POR ESTADO · RECORTES DE LA PARTIDA REAL", font=FONT, fill=(255, 242, 190))
    y = 48
    for outfit in IDS:
        label(d, (8, y, left - 4, y + TILE + HEADER), outfit.upper(), PINK)
        for i, (stem, title, color) in enumerate(actions):
            x = left + gap + i * (TILE + gap)
            label(d, (x, y, x + TILE, y + HEADER), title, color)
            sheet.paste(crop_tile(OUT / f"{stem}-{outfit}.jpg"), (x, y + HEADER))
        y += TILE + HEADER + 8
    sheet.save(OUT / "matriz-acciones-fase04.jpg", quality=88, optimize=True)


if __name__ == "__main__":
    build_before_after()
    build_actions()
    print("PASS: antes-despues-locomocion.jpg + matriz-acciones-fase04.jpg")
