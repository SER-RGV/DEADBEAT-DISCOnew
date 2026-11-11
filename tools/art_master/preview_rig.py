#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEADBEAT DISCO — previsualización FUERA DEL MOTOR del montaje del protagonista.

Reproduce en Pillow lo que hace DD_WORLD.drawProtagonist con los PNG finales:
    piernas (desde su cinturón hacia abajo) + torso del sector de puntería (hasta su
    cinturón, casado con el de las piernas) + capa de puños + arma en anchors.hand.

Sirve para revisar costuras de cintura y anclas de mano en segundos, sin lanzar el
navegador (la sonda en juego, tools/art_master/probe_player.js, tarda ~4 min y es
la validación que cuenta). La tabla de sectores de aquí es una COPIA de
PLAYER_AIM_SECTORS en src/dd_world_renderer.js: si cambia allí, cambia aquí.

Uso:
    python tools/art_master/preview_rig.py <salida.jpg>
           [--legs player_shoot_00,player_walk_01] [--long] [--step 15] [--zoom 0.6] [--cols 7]
"""
from __future__ import annotations

import argparse
import json
import math
import os
import re

from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
REG = os.path.join(ROOT, "src", "dd_asset_registry.js")
REPORT = os.path.join(ROOT, "docs", "ART_REBUILD", "batches", "R01_PROTAGONISTA.report.json")

# (elevación mínima en grados, fotograma). Positivo = hacia arriba.
AIM_SECTORS = [
    (72, "player_aim_up_03"),
    (47, "player_aim_up_02"),
    (19, "player_aim_up_01"),
    (-15, "player_shoot_00"),
    (-41, "player_aim_down_01"),
    (-70, "player_aim_down_02"),
    (-999, "player_aim_down_03"),
]
OVERLAY = {
    "player_firehip": "player_firehip_arms",
    "player_aim_down_02": "player_aim_down_02_arms",
    "player_aim_down_03": "player_aim_down_03_arms",
}
SEAM = 0.004


def load_meta():
    """Anclas por id: primero el registro (lo que verá el juego), luego el informe del lote."""
    meta = {}
    try:
        line = open(REG, encoding="utf-8").read().split("\n")[3]
        man = json.loads(re.search(r"=\s*(\{.*\});?\s*$", line).group(1))
        for k, v in man["entries"].items():
            meta[k] = {"src": v["src"], "anchors": v.get("anchors") or {}}
    except Exception:
        pass
    try:
        rep = json.load(open(REPORT, encoding="utf-8"))["assets"]
        for k, v in rep.items():
            meta[k] = {"src": v["final"], "anchors": v.get("anchors") or {}}  # el informe es más reciente
    except Exception:
        pass
    return meta


def sector(el_deg: float, long_gun: bool) -> str:
    for lo, fid in AIM_SECTORS:
        if el_deg >= lo:
            return "player_fire2" if (long_gun and fid == "player_shoot_00") else fid
    return AIM_SECTORS[-1][1]


def compose(meta, upper_id, lower_id, el_deg, W=440, H=560, weapon_len=74):
    U = Image.open(os.path.join(ROOT, meta[upper_id]["src"])).convert("RGBA")
    L = Image.open(os.path.join(ROOT, meta[lower_id]["src"])).convert("RGBA")
    bu = meta[upper_id]["anchors"].get("belt", 0.4914)
    bl = meta[lower_id]["anchors"].get("belt", 0.4914)
    out = Image.new("RGBA", (W, H), (58, 30, 44, 255))
    cx, top = W // 2, 30
    lift = (bl - bu) * 512.0
    ly = int(round(bl * L.height))
    legs = L.crop((0, ly, L.width, L.height))
    out.alpha_composite(legs, (cx - L.width // 2, top + ly))
    uy = int(round((bu + SEAM) * U.height))
    torso = U.crop((0, 0, U.width, uy))
    ty = top + int(round(lift))
    out.alpha_composite(torso, (cx - U.width // 2, ty))
    ov = OVERLAY.get(upper_id)
    if ov and ov in meta:
        O = Image.open(os.path.join(ROOT, meta[ov]["src"])).convert("RGBA")
        out.alpha_composite(O, (cx - O.width // 2, ty))
    hand = meta[upper_id]["anchors"].get("hand")
    d = ImageDraw.Draw(out)
    if hand:
        hx = cx + (hand[0] - 0.5) * U.width
        hy = ty + hand[1] * U.height
        a = math.radians(-el_deg)  # lienzo: y hacia abajo
        ex, ey = hx + math.cos(a) * weapon_len, hy + math.sin(a) * weapon_len
        bx, by = hx - math.cos(a) * weapon_len * 0.22, hy - math.sin(a) * weapon_len * 0.22
        d.line([(bx, by), (ex, ey)], fill=(20, 22, 30, 255), width=13)
        d.line([(bx, by), (ex, ey)], fill=(120, 160, 190, 255), width=7)
        d.ellipse([hx - 4, hy - 4, hx + 4, hy + 4], fill=(255, 230, 0, 255))
    d.text((6, 6), "%+d°  %s" % (el_deg, upper_id.replace("player_", "")), fill=(255, 255, 255, 255))
    d.text((6, H - 16), "piernas: " + lower_id.replace("player_", ""), fill=(200, 200, 200, 255))
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--legs", default="player_shoot_00,player_walk_01")
    ap.add_argument("--long", action="store_true", help="arma larga: sector horizontal = player_fire2")
    ap.add_argument("--step", type=int, default=15)
    ap.add_argument("--zoom", type=float, default=0.6)
    ap.add_argument("--cols", type=int, default=7)
    a = ap.parse_args()
    meta = load_meta()
    tiles = []
    for lower in a.legs.split(","):
        tiles += [compose(meta, sector(el, a.long), lower, el) for el in range(90, -91, -a.step)]
    tw, th = tiles[0].size
    tw2, th2 = int(tw * a.zoom), int(th * a.zoom)
    cols = max(1, a.cols)
    nrows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (tw2 * cols, th2 * nrows), (0, 0, 0))
    for i, t in enumerate(tiles):
        sheet.paste(t.convert("RGB").resize((tw2, th2), Image.Resampling.LANCZOS), ((i % cols) * tw2, (i // cols) * th2))
    sheet.save(a.out, quality=90)
    print(a.out, sheet.size)


if __name__ == "__main__":
    main()
