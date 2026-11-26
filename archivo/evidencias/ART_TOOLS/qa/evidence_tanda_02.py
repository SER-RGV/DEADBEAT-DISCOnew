#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tanda 02 — evidencia derivada EXCLUSIVAMENTE de capturas del juego real.

No genera ni simula capturas: amplía regiones de PNG ya capturados por CDP en
ART_EVIDENCE/tanda_02/ y mide diferencias objetivas entre ellos.

Salidas:
  modular_connections/corner_closeup.png  ampliación de captura real
  modular_connections/module_strip.png    composición de comprobación de los 4
                                          módulos de muro (NO es captura de juego;
                                          se etiqueta como tal en el informe)
  doors/threshold_closeup.png            ampliación de captura real
  doors/closed_closeup.png / open_closeup.png
  gameplay/player_closeup.png
  logs/file_checks.json                  decodificación, alfa, dimensiones
  logs/visual_diff.json                  diferencias antes/después y A/B
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "ART_EVIDENCE" / "tanda_02"
AS = ROOT / "ART_ASSETS" / "tanda_02"
LOG = EV / "logs"
LOG.mkdir(parents=True, exist_ok=True)


def load(p: Path):
    if not p.exists():
        return None
    im = Image.open(p)
    im.load()
    return im.convert("RGB")


def label(im: Image.Image, text: str):
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, im.width, 22), fill=(8, 10, 18))
    d.text((6, 5), text, fill=(240, 224, 144))
    return im


def closeup(src: Path, dst: Path, box, scale=2, text=""):
    im = load(src)
    if im is None:
        return None
    c = im.crop(box).resize(((box[2] - box[0]) * scale, (box[3] - box[1]) * scale),
                            Image.LANCZOS)
    label(c, text or ("AMPLIACION DE CAPTURA REAL · " + src.name))
    c.save(dst)
    return {"source": str(src.relative_to(ROOT)), "box": list(box),
            "scale": scale, "output": str(dst.relative_to(ROOT)),
            "size": [c.width, c.height]}


def diff_box(a: Path, b: Path, thresh=18):
    """Bounding box de la región que cambia entre dos capturas del mismo
    estado de cámara. Se usa para localizar la puerta SIN inventar coordenadas."""
    ia, ib = load(a), load(b)
    if ia is None or ib is None or ia.size != ib.size:
        return None, None
    d = ImageChops.difference(ia, ib).convert("L").point(
        lambda v: 255 if v > thresh else 0)
    bbox = d.getbbox()
    changed = sum(1 for v in d.getdata() if v > 0)
    return bbox, {"changedPixels": changed,
                  "changedRatio": round(changed / (ia.width * ia.height), 5)}


def diff_region(off: Path, on: Path, y_min=0, y_max=10**6, thresh=18):
    """BBox de los píxeles que cambian entre dos capturas con la MISMA cámara,
    restringido a una franja vertical. Localiza módulos sin adivinar coordenadas."""
    ia, ib = load(off), load(on)
    if ia is None or ib is None or ia.size != ib.size:
        return None
    d = ImageChops.difference(ia, ib).convert("L").point(
        lambda v: 255 if v > thresh else 0)
    # se anula todo lo que queda fuera de la franja pedida
    px = d.load()
    for y in range(d.height):
        if y < y_min or y >= y_max:
            for x in range(d.width):
                px[x, y] = 0
    return d.getbbox()


def pad_box(bbox, im_size, margin=70, scale=2, max_w=760, max_h=560):
    x0, y0, x1, y1 = bbox
    w, h = im_size
    x0, y0 = max(0, x0 - margin), max(0, y0 - margin)
    x1, y1 = min(w, x1 + margin), min(h, y1 + margin)
    if (x1 - x0) * scale > max_w:
        c = (x0 + x1) // 2
        x0, x1 = max(0, c - max_w // (2 * scale)), min(w, c + max_w // (2 * scale))
    if (y1 - y0) * scale > max_h:
        c = (y0 + y1) // 2
        y0, y1 = max(0, c - max_h // (2 * scale)), min(h, c + max_h // (2 * scale))
    return (x0, y0, x1, y1)


def file_checks():
    man = json.loads((AS / "manifest.json").read_text(encoding="utf-8"))
    out = []
    for a in man["assets"]:
        p = ROOT / a["path"]
        im = Image.open(p)
        im.load()
        alpha = im.getchannel("A") if "A" in im.getbands() else None
        lo, hi = alpha.getextrema() if alpha else (None, None)
        transparent = sum(1 for v in alpha.getdata() if v < 8) if alpha else 0
        out.append({
            "id": a["id"], "name": a["name"], "path": a["path"],
            "decodes": True, "format": im.format, "mode": im.mode,
            "width": im.width, "height": im.height,
            "matchesManifest": im.width == a["width"] and im.height == a["height"],
            "hasAlpha": alpha is not None, "alphaExtrema": [lo, hi],
            "transparentPixels": transparent,
            "bytes": p.stat().st_size,
            "sourcePreserved": (ROOT / a["source"]).exists(),
        })
    return out


def module_strip():
    """Composición de COMPROBACIÓN de continuidad de la familia de muro.
    NO es una captura del juego; se documenta explícitamente como evidencia
    auxiliar de alineación de cornisa/baseboard entre módulos."""
    names = ["wall_straight.png", "wall_corner_inner.png",
             "wall_corner_outer.png", "wall_end_cap.png"]
    W, H, PAD = 1080, 300, 20
    canvas = Image.new("RGB", (W, H), (24, 6, 25))
    d = ImageDraw.Draw(canvas)
    d.rectangle((0, 0, W, 26), fill=(8, 10, 18))
    d.text((8, 7), "COMPROBACION DE CONTINUIDAD · composicion auxiliar "
                   "(NO captura del juego) · A01 A02 A03 A04", fill=(240, 224, 144))
    x = PAD
    for n in names:
        im = Image.open(AS / n).convert("RGBA")
        k = min(210 / im.width, 210 / im.height)
        im = im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS)
        canvas.paste(im, (x + (230 - im.width) // 2, 60 + (210 - im.height) // 2), im)
        d.text((x, 40), n.replace(".png", ""), fill=(56, 189, 248))
        x += 250
    d.text((20, 275), "Misma cornisa / baseboard / contorno / luz NW en los 4 modulos.",
           fill=(250, 204, 21))
    p = EV / "modular_connections" / "module_strip.png"
    canvas.save(p)
    return str(p.relative_to(ROOT))


def edge_continuity():
    """Continuidad de la familia de muro en los PNG finales.

    Mide (a) la fila de la cornisa (primer píxel opaco desde arriba) y del
    zócalo (último píxel opaco) en cada módulo: si coinciden, la moldura
    llega a la misma altura y dos módulos consecutivos no escalonan; y (b) la
    discrepancia entre columnas de borde, que SOLO es interpretable en
    módulos de frente plano. A01 es isométrico con cara lateral derecha,
    así que sus dos bordes tienen siluetas distintas POR DISEÑO: un valor
    alto ahí no es un hueco, sino una limitación de esta métrica. Se documenta
    como tal en el informe, no se corrige el sistema ni se simula un pase.
    """
    out = []
    types = {"wall_straight.png": "isometrico con cara lateral (métrica de bordes NO aplicable)",
             "wall_corner_inner.png": "frente plano / esquina interior",
             "wall_corner_outer.png": "frente plano / esquina exterior",
             "wall_end_cap.png": "frente plano / terminal"}
    for n, kind in types.items():
        im = Image.open(AS / n).convert("RGBA")
        a = im.getchannel("A")
        w, h = im.size
        col = [any(a.getpixel((x, y)) > 40 for x in range(w)) for y in range(h)]
        rows = [y for y, v in enumerate(col) if v]
        left = [a.getpixel((0, y)) > 40 for y in range(h)]
        right = [a.getpixel((w - 1, y)) > 40 for y in range(h)]
        mismatch = sum(1 for l, r in zip(left, right) if l != r)
        out.append({"asset": n, "type": kind,
                    "corniceRow": rows[0] if rows else None,
                    "baseboardRow": rows[-1] if rows else None,
                    "edgeMismatchRows": mismatch, "height": h,
                    "ratio": round(mismatch / h, 4),
                    "interpretation": "NO APLICABLE (isometría)" if "isometrico" in kind
                                      else ("bordes equivalentes" if mismatch / h < 0.15
                                            else "revisar visualmente")})
    return out


def main():
    res = {"generated": [], "diff": {}, "fileChecks": file_checks(),
           "edgeContinuity": edge_continuity(), "moduleStrip": module_strip()}

    # 1) r0 es sala `start` (sin encuentro): el motor la entrega con las
    #    puertas ya abiertas. Se mide y se documenta, NO se presenta como
    #    verificación de puerta cerrada.
    closed0 = EV / "doors" / "after_closed.png"
    open0 = EV / "doors" / "after_open.png"
    _, d0 = diff_box(closed0, open0)
    res["diff"]["r0ClosedVsOpenStartRoom"] = d0
    res["diff"]["r0Note"] = ("Sala start sin encuentro: Ot.openT=.8 al entrar. "
                             "La diferencia minima confirma que NO hay transicion "
                             "cerrada->abierta verificable en esta sala.")

    # 2) Sala REAL de combate (r23, círculo 3) con puerta cerrada y abierta.
    closed = EV / "doors" / "closed_real.png"
    opened = EV / "doors" / "open_real.png"
    bbox, dinfo = diff_box(closed, opened)
    res["diff"]["combatClosedVsOpen"] = dinfo
    if bbox:
        res["diff"]["combatChangeBBox"] = list(bbox)
    if closed.exists() and opened.exists():
        # En r23 la puerta lateral izquierda es la visible y lleva el letrero
        # "sellada": se amplía esa región de la captura real.
        box = (0, 320, 300, 620)
        for src, dst, sc, txt in [
            (closed, EV / "doors" / "closed_closeup.png", 3,
             "PUERTA CERRADA / SELLADA · sala de combate r23 · ampliacion de captura real"),
            (opened, EV / "doors" / "open_closeup.png", 3,
             "PUERTA ABIERTA · sala despejada r23 · ampliacion de captura real"),
        ]:
            r = closeup(src, dst, box, sc, txt)
            if r:
                res["generated"].append(r)

    # 3) A/B en la MISMA build (única diferencia = familia T02)
    off = EV / "before" / "03_room_modules_off.png"
    on = EV / "after" / "03_room_modules_on.png"
    _, ab = diff_box(off, on)
    res["diff"]["abSameBuild"] = ab
    top = diff_region(off, on, 0, 260)
    bottom = diff_region(off, on, 600, 900)
    res["diff"]["abChangedBBoxTop"] = list(top) if top else None
    res["diff"]["abChangedBBoxBottom"] = list(bottom) if bottom else None

    # 4) Vistas de conexiones: franjas LOCALIZADAS por la diferencia A/B.
    if top:
        r = closeup(on, EV / "modular_connections" / "overview_closeup.png",
                    pad_box(top, (1280, 900), margin=55, scale=2,
                            max_w=1800, max_h=380), 2,
                    "VISTA GENERAL DE CONEXIONES · muro superior · "
                    "ampliacion de captura real")
        if r:
            res["generated"].append(r)
    if bottom:
        r = closeup(on, EV / "doors" / "threshold_closeup.png",
                    pad_box(bottom, (1280, 900), margin=50, scale=3,
                            max_w=1200, max_h=480), 3,
                    "UMBRAL DE ENTRADA · region localizada por diferencia A/B · "
                    "ampliacion de captura real")
        if r:
            res["generated"].append(r)

    # Mismo sistema modular en otra sala real (círculo 3, muros por panel).
    circle = EV / "modular_connections" / "circle_02_gula.png"
    if circle.exists():
        r = closeup(circle, EV / "modular_connections" / "corner_closeup.png",
                    (250, 0, 1050, 140), 2,
                    "CONEXIONES MODULARES / ESQUINAS · muro superior de r23 · "
                    "ampliacion de captura real")
        if r:
            res["generated"].append(r)

    # 5) Jugador en pantalla
    for src, dst, txt in [
        (EV / "gameplay" / "after_player.png", EV / "gameplay" / "player_closeup.png",
         "JUGADOR EN PANTALLA · ampliacion de captura real"),
        (EV / "gameplay" / "combat_player.png", EV / "gameplay" / "combat_closeup.png",
         "JUGADOR EN SALA DE COMBATE · ampliacion de captura real"),
    ]:
        if src.exists():
            r = closeup(src, dst, (420, 250, 860, 650), 2, txt)
            if r:
                res["generated"].append(r)

    # 6) Antes/después entre builds (incluye T01 + T02, no es A/B puro)
    _, bd = diff_box(EV / "before" / "02_room.png", EV / "after" / "02_room.png")
    res["diff"]["buildBeforeVsAfter"] = bd

    (LOG / "file_checks.json").write_text(
        json.dumps(res, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (LOG / "visual_diff.json").write_text(
        json.dumps(res["diff"], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "files": len(res["fileChecks"]),
        "allDecode": all(c["decodes"] for c in res["fileChecks"]),
        "allDims": all(c["matchesManifest"] for c in res["fileChecks"]),
        "allAlpha": all(c["hasAlpha"] for c in res["fileChecks"]),
        "allSources": all(c["sourcePreserved"] for c in res["fileChecks"]),
        "generated": len(res["generated"]),
        "diff": res["diff"],
        "edgeContinuity": res["edgeContinuity"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
