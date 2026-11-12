#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEADBEAT DISCO — previsualización FUERA DEL MOTOR de los enemigos sobre el suelo.

Reproduce en Pillow lo que hace DD_WORLD.drawEnemy con los PNG finales y sus anclas
(anchors.foot, anchors.unit): cada fotograma se apoya en la línea de suelo, con el
círculo de colisión del motor debajo y el protagonista al lado para comparar escala.

Sirve para comprobar en segundos, sin lanzar el navegador:
    - que los estados de una familia no cambian de tamaño ni «resbalan» al pasar de
      uno a otro (el eje de apoyo cae en el mismo sitio del cuerpo);
    - que el círculo de colisión queda bajo el cuerpo en cada pose;
    - la escala relativa entre familias y contra el protagonista.

La tabla de alturas se LEE de src/dd_world_renderer.js (ENEMY_BASE, ENEMY_FOOT_K,
PLAYER_BASE_H, PLAYER_FOOT_Y): no hay copia que pueda quedarse vieja.
La validación que cuenta sigue siendo la sonda en juego (probe_enemies.js).

Uso:
    python tools/art_master/preview_actors.py <salida.jpg>
           [--batch docs/ART_REBUILD/batches/R02_ENEMIGOS.json] [--zoom 3]
           [--states walk,windup,attack,death] [--onion]

    --onion  añade una columna con los estados superpuestos (piel de cebolla)
             alineados por el punto de apoyo: muestra cuánto se mueve el cuerpo.
"""
from __future__ import annotations

import argparse
import json
import os
import re

from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
REG = os.path.join(ROOT, "src", "dd_asset_registry.js")
RENDERER = os.path.join(ROOT, "src", "dd_world_renderer.js")

FLOOR = (58, 52, 70)
INK = (236, 236, 240)


def renderer_constants():
    src = open(RENDERER, encoding="utf-8").read()
    block = re.search(r"const ENEMY_BASE = \{(.*?)\};", src, re.S)
    if not block:
        raise SystemExit("No se encontró ENEMY_BASE en " + RENDERER)
    base = {m.group(1): (float(m.group(2)), float(m.group(3)))
            for m in re.finditer(r"(\w+):\s*\{\s*h:\s*([\d.]+),\s*r:\s*([\d.]+)[^}]*\}", block.group(1))}

    def num(name, default):
        m = re.search(r"const %s = ([\d.]+);" % name, src)
        return float(m.group(1)) if m else default

    return base, num("ENEMY_FOOT_K", 0.65), num("PLAYER_BASE_H", 104), num("PLAYER_FOOT_Y", 16)


def load_meta(batch_path):
    """Anclas por id: el registro (lo que verá el juego) y, por encima, el informe del lote."""
    meta = {}
    line = open(REG, encoding="utf-8").read().split("\n")[3]
    man = json.loads(re.search(r"=\s*(\{.*\});?\s*$", line).group(1))
    for k, v in man["entries"].items():
        meta[k] = {"src": v["src"], "anchors": v.get("anchors") or {}, "rev": v.get("rev")}
    if batch_path:
        rep = os.path.splitext(batch_path)[0] + ".report.json"
        if os.path.exists(rep):
            for k, v in (json.load(open(rep, encoding="utf-8")).get("assets") or {}).items():
                if k in meta and v.get("anchors"):
                    meta[k]["anchors"] = v["anchors"]
    return meta


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("out")
    ap.add_argument("--batch", default=os.path.join(ROOT, "docs", "ART_REBUILD", "batches", "R02_ENEMIGOS.json"))
    ap.add_argument("--zoom", type=float, default=3.0, help="px de imagen por px de mundo")
    ap.add_argument("--states", default="walk,windup,attack,death")
    ap.add_argument("--onion", action="store_true")
    a = ap.parse_args()

    base, foot_k, player_h, player_foot = renderer_constants()
    meta = load_meta(a.batch)
    states = [s for s in a.states.split(",") if s]
    z = a.zoom

    cell_w = int(150 * z)
    rows = []
    for fam, (fig_h, r) in base.items():
        walk = meta.get("enemy_%s_walk" % fam)
        if not walk:
            continue
        row_h = int((max(fig_h, player_h) * 1.32 + 30) * z)
        cols = 1 + len(states) + (1 if a.onion else 0)
        row = Image.new("RGBA", (cell_w * cols, row_h), FLOOR + (255,))
        d = ImageDraw.Draw(row)
        ground = row_h - int(20 * z)            # y de pantalla del punto de apoyo (pies)

        def place(im, an, cx, alpha=1.0):
            unit = an.get("unit", 0.86)
            foot = an.get("foot", [0.5, 0.985])
            s = fig_h * z / (unit * im.height)
            w, h = max(1, int(round(im.width * s))), max(1, int(round(im.height * s)))
            t = im.resize((w, h), Image.Resampling.LANCZOS)
            if alpha < 1:
                t.putalpha(t.getchannel("A").point(lambda v: int(v * alpha)))
            row.alpha_composite(t, (int(round(cx - foot[0] * w)), int(round(ground - foot[1] * h))))

        def floor_marks(cx):
            ey = ground - foot_k * r * z      # centro del círculo de colisión del motor
            d.ellipse([cx - r * z, ey - r * z, cx + r * z, ey + r * z], outline=(120, 230, 255), width=2)
            d.line([(cx - 60 * z, ground), (cx + 60 * z, ground)], fill=(150, 140, 170), width=1)
            d.line([(cx, ground - 6 * z), (cx, ground + 6 * z)], fill=(255, 220, 90), width=2)

        # Protagonista (escala): lienzo de player_h px de mundo con el borde inferior en y + player_foot.
        hero = meta.get("player_idle_00")
        cx = cell_w // 2
        if hero:
            him = Image.open(os.path.join(ROOT, hero["src"])).convert("RGBA")
            s = player_h * z / him.height
            t = him.resize((int(him.width * s), int(him.height * s)), Image.Resampling.LANCZOS)
            # mismo suelo de colisión que el enemigo: el (x, y) del jugador queda foot_k·r por encima de los pies del enemigo
            ey = ground - foot_k * r * z
            row.alpha_composite(t, (int(cx - t.width / 2), int(ey + player_foot * z - t.height)))
            d.ellipse([cx - 12 * z, ey - 12 * z, cx + 12 * z, ey + 12 * z], outline=(120, 230, 255), width=1)
        d.text((6, 4), "%s  h=%g px  r=%g" % (fam, fig_h, r), fill=INK)

        frames = []
        for i, st in enumerate(states):
            cx = cell_w * (i + 1) + cell_w // 2
            m = meta.get("enemy_%s_%s" % (fam, st))
            floor_marks(cx)
            if not m or m.get("rev") != walk.get("rev"):
                d.text((cell_w * (i + 1) + 6, 4), "%s: pendiente" % st, fill=(255, 170, 120))
                continue
            im = Image.open(os.path.join(ROOT, m["src"])).convert("RGBA")
            place(im, m["anchors"], cx)
            floor_marks(cx)
            frames.append((im, m["anchors"]))
            d.text((cell_w * (i + 1) + 6, 4), "%s  %dx%d  pie %.3f" % (st, im.width, im.height, m["anchors"].get("foot", [0.5])[0]), fill=INK)
        if a.onion and frames:
            cx = cell_w * (len(states) + 1) + cell_w // 2
            for im, an in frames:
                place(im, an, cx, alpha=0.5)
            floor_marks(cx)
            d.text((cell_w * (len(states) + 1) + 6, 4), "superpuestos", fill=INK)
        rows.append(row)

    if not rows:
        raise SystemExit("sin familias que dibujar")
    W = max(r.width for r in rows)
    sheet = Image.new("RGB", (W, sum(r.height for r in rows)), FLOOR)
    y = 0
    for r in rows:
        sheet.paste(r.convert("RGB"), (0, y))
        y += r.height
    os.makedirs(os.path.dirname(os.path.abspath(a.out)) or ".", exist_ok=True)
    sheet.save(a.out, quality=88)
    print(a.out, sheet.size)


if __name__ == "__main__":
    main()
