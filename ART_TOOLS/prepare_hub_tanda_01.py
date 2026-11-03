#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DEADBEAT DISCO · HUB · TANDA 01 — preparación reproducible de los 10 assets.

Convierte las 10 ilustraciones fuente de ART_ASSETS/hub/tanda_01/_source/ en los
PNG finales que consumen los registros REALES del motor. Las dimensiones NO se
inventan: salen de ART_AUDIT/asset_inventory.json (binarios embebidos en la
build activa) y de la sonda de runtime ART_TOOLS/qa/hub_tanda_01_probe.js, que
mide los drawImage() efectivos del HUB.

Recorte: se reutiliza build_alpha()/crop_alpha() de prepare_tanda_02.py (clave
por distancia al color de fondo detectado en esquinas, rampa de antialias y
cierre de huecos interiores). La colocación es 'contain' con pivote explícito:
NUNCA se deforma la imagen para encajar en un slot.

El suelo (HUB-01) es el único opaco: el pintor T3B lo usa como patrón 'repeat',
por lo que además se comprueba y corrige la continuidad de los bordes.

Uso: PYTHONPATH=<pillow> python3 ART_TOOLS/prepare_hub_tanda_01.py
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "ART_ASSETS" / "hub" / "tanda_01" / "_source"
DST = ROOT / "ART_ASSETS" / "hub" / "tanda_01"
REL = "ART_ASSETS/hub/tanda_01/"

# Reutiliza el recorte ya auditado de la Tanda 02 (no se duplica lógica).
_spec = importlib.util.spec_from_file_location("prep02", ROOT / "ART_TOOLS" / "prepare_tanda_02.py")
prep02 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(prep02)

# id, fichero, dimensiones EXACTAS del slot, modo, pivote, umbral croma,
# slot(es) V5/T3B reales, clasificación funcional, función en la composición,
# caja de dibujo medida en el HUB (dx,dy,dw,dh) y nota de anclaje.
SPEC = [
    dict(id="HUB-01", name="suelo_central", file="hub_01_suelo_central.png",
         w=512, h=512, mode="opaque", pivot="tile", thr=0,
         slot="t3b_material_01", loader="T3B",
         classification="Arquitectónico / Funcional",
         role="Superficie principal del HUB. Patrón repeat de __DDM_PAINT_MATERIAL(c,1,0,0,1920,1320) en ensureHubArtAssets().",
         draw=[0, 0, 1920, 1320],
         anchor="tile 512x512; origen (0,0) del canvas de suelo HUB; repeat sin offset",
         note="Único recurso sin alfa: un tile con alpha crearía huecos en el patrón. Bordes igualados para repetición sin costura."),
    dict(id="HUB-02", name="pista_central", file="hub_02_pista_central.png",
         w=760, h=430, mode="cutout", pivot="center", thr=18,
         slot="hub_pista_medallion", loader="V5",
         classification="Decorativo",
         role="Identidad visual del espacio: medallón/alfombra de la pista central, bajo el escudo del zorro.",
         draw=[916, 746, 668, 378],
         anchor="center; drawImage(cx-334, cy-ph/2, 668, 378) con cx=1250, cy=935",
         note="El motor aplica un filtro que borra píxeles rojizos en el rectángulo central (34.5%-65.5% x, 24%-70% y): el centro se ha generado en cian/oro/violeta, sin magenta."),
    dict(id="HUB-03", name="paredes", file="hub_03_paredes.png",
         w=120, h=176, mode="cutout", pivot="bottom-center", thr=18,
         slot="wall_stained_glass_arch", loader="V5 (familia modular Tanda 02)",
         classification="Arquitectónico",
         role="Delimitar y dar profundidad: panel recto repetido por el pintor de muros $b/_b en el perímetro del HUB.",
         draw=[40, -178, 135, 156],
         anchor="bottom-center; el pintor por edge aplica su propia transform y sortY",
         note="Proporción nativa 120x176 conservada. La transformación 135x156 del pintor es previa y no se modifica; el panel se dibuja simétrico para tolerarla."),
    dict(id="HUB-04", name="cabina_dj", file="hub_04_cabina_dj.png",
         w=720, h=392, mode="cutout", pivot="bottom-center", thr=18,
         slot="hub_dj_shrine", loader="V5",
         classification="Interactivo",
         role="Elemento protagonista del escenario; estación DJ (1250,445), solid 236x84.",
         draw=[1058, 280, 384, 209],
         anchor="bottom-center; sh=384*naturalHeight/naturalWidth, base en p.y+44=489",
         note="No se toca la estación ni el sistema musical: solo la imagen consumida por hubDraw()."),
    dict(id="HUB-05", name="barra_bebidas", file="hub_05_barra_bebidas.png",
         w=380, h=313, mode="cutout", pivot="bottom-center", thr=18,
         slot="hub_bar_shrine", loader="V5",
         classification="Interactivo",
         role="Zona diferenciada 'EL ÚLTIMO TRAGO' (1910,845), solid 196x86.",
         draw=[1767, 659, 286, 236],
         anchor="bottom-center; sh=286*naturalHeight/naturalWidth, base en p.y+50=895",
         note="El colisionador 196x86 permanece en el motor; la imagen no añade ni bloquea paso."),
    dict(id="HUB-06", name="columnas", file="hub_06_columnas.png",
         w=76, h=148, mode="cutout", pivot="bottom-center", thr=18,
         slot="club_speaker_tower_prop", loader="V5",
         classification="Arquitectónico",
         role="Reforzar arquitectura y volumen: columnas/torres acústicas que flanquean escenario y muros.",
         draw=[954, 380, 63, 122],
         anchor="bottom-center; dibujada por el pintor de props V5 con su sortY",
         note="Columna art-déco con rejilla de altavoz integrada: misma familia que la cabina y el bar."),
    dict(id="HUB-07", name="sofas_asientos", file="hub_07_sofas_asientos.png",
         w=224, h=172, mode="cutout", pivot="bottom-center", thr=18,
         slot=["hub_vip_booth_nw", "hub_vip_booth_ne"], loader="V5",
         classification="Decorativo",
         role="Zona de descanso VIP en las dos alcobas norte (785,545) y (1715,545).",
         draw=[681, 439, 208, 160],
         anchor="bottom-center; sh=208*naturalHeight/naturalWidth, base en p.y+54",
         note="Un único PNG registrado en los dos slots de alcoba. El motor calcula la altura por aspecto natural, así que no hay deformación; la alcoba NE queda 23 px más alta."),
    dict(id="HUB-08", name="luminarias_neones", file="hub_08_luminarias_neones.png",
         w=67, h=152, mode="cutout", pivot="top-center", thr=18,
         slot="hub_disco_chandelier", loader="V5",
         classification="Funcional / Decorativo",
         role="Iluminación ambiental sobre la pista: lámpara colgante en (1250,615).",
         draw=[1217, 575, 66, 150],
         anchor="top-center; drawImage(dbX-33, dbY-40, 66, 150); la cadena queda arriba",
         note="El halo lo calcula el motor con Wb(); el PNG no hornea sombras ni bloom de fondo."),
    dict(id="HUB-09", name="puertas_accesos", file="hub_09_puertas_accesos.png",
         w=320, h=175, mode="cutout", pivot="center", thr=18,
         slot="hub_abyss_stair_crack", loader="V5",
         classification="Interactivo / Funcional",
         role="Acceso de descenso a otras zonas (sur del HUB).",
         draw=[1085, 1256, 330, 180],
         anchor="center; diamante 2:1 enrasado con el suelo, sin colisionador nuevo",
         note="No se sustituye ninguna hoja de puerta: la lógica de apertura Ot.openT y los slots campaign_door_* de la Tanda 02 quedan intactos."),
    dict(id="HUB-10", name="decoracion_ambiental", file="hub_10_decoracion_ambiental.png",
         w=167, h=136, mode="cutout", pivot="center", thr=18,
         slot="hub_trophy_board_prop", loader="V5",
         classification="Decorativo",
         role="Completar identidad visual: tablón de trofeos / muro de la vergüenza junto al escenario.",
         draw=[922, 337, 156, 127],
         anchor="center; prop de pared dibujado por el pintor V5",
         note="Humor negro: bola de discoteca agrietada, cráneo y disco de oro doblado. Sin texto generado."),
]


def seamless_tile(im: Image.Image) -> tuple[Image.Image, dict]:
    """Corrige costuras del patrón sin cambiar el lenguaje visual.

    B = im desplazada media tesela: sus bordes son columnas/filas contiguas del
    original, luego no tienen costura. La cruz central de B (donde salta el
    wrap) se sustituye por el original A con máscara suave.
    """
    W, H = im.size
    a = im.convert("RGB")
    b = ImageChops.offset(a, W // 2, H // 2)
    cross = Image.new("L", (W, H), 0)
    px = cross.load()
    band = max(24, W // 12)
    for y in range(H):
        for x in range(W):
            if abs(x - W // 2) < band or abs(y - H // 2) < band:
                px[x, y] = 255
    mask = cross.filter(ImageFilter.GaussianBlur(band * 0.55))
    out = Image.composite(a, b, mask)

    def seam(img):
        p = img.load()
        d = []
        for y in range(H):
            d.append(sum(abs(p[0, y][c] - p[W - 1, y][c]) for c in range(3)) / 3)
        for x in range(W):
            d.append(sum(abs(p[x, 0][c] - p[x, H - 1][c]) for c in range(3)) / 3)
        return round(sum(d) / len(d), 2)

    return out, {"edgeMismatchBefore": seam(a), "edgeMismatchAfter": seam(out),
                 "method": "half-tile offset + feathered center cross (ImageChops.offset)"}


def place_contain(im: Image.Image, alpha: Image.Image, W: int, H: int, pivot: str):
    """Escala 'contain' (sin deformar) y coloca según el pivote declarado."""
    sw, sh = im.size
    k = min(W / sw, H / sh)
    nw, nh = max(1, round(sw * k)), max(1, round(sh * k))
    piece = im.convert("RGBA").resize((nw, nh), Image.LANCZOS)
    piece.putalpha(alpha.resize((nw, nh), Image.LANCZOS))
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x = (W - nw) // 2
    y = (H - nh) if pivot == "bottom-center" else (0 if pivot == "top-center" else (H - nh) // 2)
    canvas.alpha_composite(piece, (x, y))
    return canvas, {"scale": round(k, 5), "placed": [nw, nh], "offset": [x, y],
                    "pivot": pivot, "deformed": False}


def medallion_compat(im: Image.Image) -> dict:
    """HUB-02: el motor (drawHubFloorLayer) borra en caché los píxeles del
    rectángulo central que cumplen r>90 && (r+b)>2.6*g+60 (filtro 'no skull'
    del medallón anterior). En vez de tocar el motor, se baja el canal rojo de
    esos píxeles hasta un valor seguro: el cian/oro se conserva y el violeta
    pasa a azul, sin agujeros en la alfombra nueva.
    """
    W, H = im.size
    x0, x1 = round(W * 0.345), round(W * 0.655)
    y0, y1 = round(H * 0.24), round(H * 0.70)
    px = im.load()
    changed = 0
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b, a = px[x, y]
            if a and r > 90 and (r + b) > 2.6 * g + 60:
                px[x, y] = (88, g, b, a)
                changed += 1
    residual = 0
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b, a = px[x, y]
            if a and r > 90 and (r + b) > 2.6 * g + 60:
                residual += 1
    return {"rect": [x0, y0, x1, y1], "pixelsRecolored": changed,
            "residualErasablePx": residual,
            "reason": "filtro drawHubFloorLayer / __DDM_V5_MED_NO_SKULL"}


def verify(im: Image.Image, spec: dict) -> dict:
    out = {"width": im.width, "height": im.height, "mode": im.mode,
           "format": "PNG", "exactSize": [im.width, im.height] == [spec["w"], spec["h"]]}
    if im.mode == "RGBA":
        a = im.getchannel("A")
        hist = a.histogram()
        lo, hi = a.getextrema()
        total = im.width * im.height
        out.update(alphaChannel=True, alphaExtrema=[lo, hi],
                   transparentPx=hist[0], partialPx=sum(hist[1:254]), opaquePx=hist[255],
                   coveragePct=round(100 * (total - hist[0]) / total, 2))
        corner = [a.getpixel(p) for p in [(0, 0), (im.width - 1, 0),
                                          (0, im.height - 1), (im.width - 1, im.height - 1)]]
        out["cornersTransparent"] = all(v == 0 for v in corner)
        # halo blanquecino: píxeles semitransparentes muy claros
        px = im.load()
        halo = 0
        for y in range(im.height):
            for x in range(im.width):
                r, g, b, al = px[x, y]
                # Solo cuenta el halo BLANCO desaturado; los brillos cian/oro
                # legítimos del neón no son residuo de croma.
                if 8 < al < 250 and min(r, g, b) > 205 and (max(r, g, b) - min(r, g, b)) < 28:
                    halo += 1
        out["whiteFringePx"] = halo
        out["whiteFringePct"] = round(100 * halo / max(1, out["partialPx"]), 2)
        out["borderClean"] = out["cornersTransparent"] and out["whiteFringePct"] < 12
    else:
        out.update(alphaChannel=False, transparentPx=0, opaquePx=im.width * im.height,
                   cornersTransparent=False, whiteFringePx=0, borderClean=True)
    return out


def main():
    DST.mkdir(parents=True, exist_ok=True)
    man = {
        "tanda": "HUB-01",
        "title": "Reconstrucción de escenarios · HUB · Tanda 01 (10 assets)",
        "build": "DEADBEAT_DISCO.ART.html",
        "integrationFile": "ART_PACK/art_pack.js",
        "loader": "window.__T3B_IMAGES[1] + __T3B.reload(1) / window.__DDM_V5_IMG[slot] (registros existentes)",
        "dimensionSource": "ART_AUDIT/asset_inventory.json + ART_TOOLS/qa/hub_tanda_01_probe.js (medición drawImage en HUB real)",
        "preparation": "ART_TOOLS/prepare_hub_tanda_01.py · build_alpha/crop_alpha reutilizados de prepare_tanda_02.py · contain + pivote · RGB opaco solo para el tile",
        "count": len(SPEC),
        "assets": [],
    }
    for s in SPEC:
        src_path = SRC / s["file"]
        raw = Image.open(src_path).convert("RGB")
        seam = None
        geo = None
        if s["mode"] == "opaque":
            base = raw.resize((s["w"], s["h"]), Image.LANCZOS)
            final, seam = seamless_tile(base)
            geo = {"scale": round(s["w"] / raw.width, 5), "mode": "opaque-resize+seamless",
                   "sourceSize": list(raw.size), "deformed": False}
        else:
            alpha, bg = prep02.build_alpha(raw, s["thr"])
            # Decontaminación del croma blanco: 1 px de erosión elimina el
            # antialias mezclado con el fondo y se recupera un borde suave.
            alpha = alpha.filter(ImageFilter.MinFilter(3))
            alpha = alpha.filter(ImageFilter.GaussianBlur(0.45))
            # El desenfoque posterior a la erosión deja un residuo de fondo
            # casi invisible (alfa < 24): se elimina para no dejar halo blanco.
            alpha = alpha.point(lambda v: 0 if v < 24 else v)
            obj, alpha = prep02.crop_alpha(raw, alpha)
            # Los píxeles transparentes deben tener RGB neutro oscuro: al
            # reducir con LANCZOS no se reintroduce un halo blanco.
            clean = obj.convert("RGB")
            cp, ap = clean.load(), alpha.load()
            for y in range(clean.height):
                for x in range(clean.width):
                    if ap[x, y] == 0:
                        cp[x, y] = (10, 12, 18)
            final, place = place_contain(clean, alpha, s["w"], s["h"], s["pivot"])
            geo = {"scale": place["scale"], "placed": place["placed"],
                   "offset": place["offset"], "pivot": place["pivot"],
                   "deformed": place["deformed"], "sourceSize": list(raw.size),
                   "alphaBBox": [obj.width, obj.height], "backgroundDetected": list(bg),
                   "threshold": s["thr"], "mode": "contain + chroma decontamination"}
        compat = None
        if s["id"] == "HUB-02":
            compat = medallion_compat(final)
        out = DST / s["file"]
        final.save(out, "PNG", optimize=True)
        chk = Image.open(out)
        chk.load()
        rec = {
            "id": s["id"], "name": s["name"],
            "file": REL + s["file"], "source": REL + "_source/" + s["file"],
            "sourceSize": list(raw.size),
            "bytes": out.stat().st_size,
            "sha256": hashlib.sha256(out.read_bytes()).hexdigest(),
            "slot": s["slot"], "loader": s["loader"],
            "classification": s["classification"], "role": s["role"],
            "measuredDrawBox": s["draw"], "anchor": s["anchor"], "note": s["note"],
            "preparation": geo,
        }
        rec.update(verify(chk, s))
        if seam:
            rec["tileSeams"] = seam
        if compat:
            rec["medallionFilterCompat"] = compat
        man["assets"].append(rec)
        print(f"{s['id']} {s['name']:<22} {chk.width:>4}x{chk.height:<4} "
              f"{chk.mode:<4} alpha={rec['alphaChannel']} "
              f"cover={rec.get('coveragePct', 100):5.1f}% "
              f"corners={rec['cornersTransparent']} fringe={rec.get('whiteFringePct', 0)}% "
              f"exact={rec['exactSize']} {out.stat().st_size:>7}B")
    (DST / "manifest.json").write_text(json.dumps(man, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("\nmanifest:", DST / "manifest.json", "assets:", len(man["assets"]))


if __name__ == "__main__":
    main()
