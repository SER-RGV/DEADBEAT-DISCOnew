#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DEADBEAT DISCO · HUB · TANDA 02 — preparación reproducible de los 10 assets.

Convierte las 10 ilustraciones fuente de ART_ASSETS/hub/tanda_02/_source/ en
los PNG finales que consumen los registros REALES del motor (__DDM_V5_IMG).
Las dimensiones NO se inventan: son las naturales del recurso que el motor
sirve HOY, medidas en el HUB ejecutado por
ART_TOOLS/qa/hub_tanda_02_audit.js -> audit_runtime.json (registrySizes) y
contrastadas con ART_AUDIT/asset_inventory.json.

Recorte: se reutiliza build_alpha()/crop_alpha() de prepare_tanda_02.py, con la
misma descontaminación de croma que la TANDA 01 (erosión 1 px, blur 0.45,
corte alfa<24, RGB neutro oscuro en transparentes). Colocación 'contain' con
pivote explícito: NUNCA se deforma la imagen para encajar en un slot.

T02-04: la fuente generada contiene dos expendedoras y el slot pinta UNA. Se
conserva la fuente original íntegra y se aplica un recorte de preparación
documentado (sourceCrop) para aislar la primera máquina; no se genera otra
imagen y no se borra ningún recurso.

Uso: PYTHONPATH=<pillow> python3 ART_TOOLS/prepare_hub_tanda_02.py
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "ART_ASSETS" / "hub" / "tanda_02" / "_source"
DST = ROOT / "ART_ASSETS" / "hub" / "tanda_02"
REL = "ART_ASSETS/hub/tanda_02/"

_spec = importlib.util.spec_from_file_location("prep02", ROOT / "ART_TOOLS" / "prepare_tanda_02.py")
prep02 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(prep02)

# id, fichero, dimensiones EXACTAS del slot (medidas), pivote, slot V5 real,
# clasificación, función, caja de dibujo medida, anclaje y notas.
SPEC = [
    dict(id="T02-01", name="maquinas_recreativas", file="hub_t02_01_arcade.png",
         w=264, h=239, pivot="bottom-center", thr=18,
         slot="hub_arcade_shrine", loader="V5",
         classification="Interactivo / Mobiliario secundario",
         role="Banco de recreativas del Rincón Arcade (zona F1, 655,1210); estación F.",
         draw=[0, 0, 236, 214], anchor="bottom-center; hubDraw() calcula sh=236*naturalHeight/naturalWidth",
         shared="HUB + banner de sala de campaña (mismo slot de arte)",
         note="Dos cabinas art-déco con marquesina en abanico y CRT cian/magenta. No se añade interacción."),
    dict(id="T02-02", name="arsenal_mostrador", file="hub_t02_02_arsenal.png",
         w=360, h=253, pivot="bottom-center", thr=18,
         slot="hub_arsenal_shrine", loader="V5",
         classification="Interactivo / Mobiliario funcional",
         role="Mostrador del Arsenal de Caronte (zona D, 590,845); estación D.",
         draw=[0, 0, 276, 194], anchor="bottom-center; sw=276, sh=276*naturalHeight/naturalWidth",
         shared="Solo HUB (clave pre-cableada en addHubCustomProp)",
         note="Vitrina con tres armas estilizadas sobre terciopelo. Colisionador 184x86 intacto."),
    dict(id="T02-03", name="espejo_sellos", file="hub_t02_03_seals.png",
         w=244, h=237, pivot="bottom-center", thr=18,
         slot="hub_seals_shrine", loader="V5",
         classification="Interactivo / Objeto narrativo",
         role="Espejo de los Sellos (zona F2, 1845,1210); estación F.",
         draw=[1737, 1040, 216, 210], anchor="bottom-center; sw=216, sh=216*naturalHeight/naturalWidth",
         shared="HUB + banner de sala de campaña",
         note="Marco en sunburst con tres alveolos de sello. El aura y el contador de sellos siguen en el motor."),
    dict(id="T02-04", name="maquina_expendedora", file="hub_t02_04_vending.png",
         w=100, h=152, pivot="bottom-center", thr=18,
         slot="club_vending_machine_prop", loader="V5",
         classification="Decorativo / Equipamiento de discoteca",
         role="Expendedora del lado este (2048,692) y decor de aristas de sala.",
         draw=[0, 0, 78, 118], anchor="bottom-center; dh=118, dw=118*naturalWidth/naturalHeight",
         sourceCrop=[510, 0, 925, 768],
         shared="HUB + pintor de aristas de salas de campaña",
         note="La fuente generada traía dos máquinas; sourceCrop aísla una sin borrar la fuente original."),
    dict(id="T02-05", name="dispensador_agua", file="hub_t02_05_cooler.png",
         w=61, h=136, pivot="bottom-center", thr=18,
         slot="club_water_cooler_prop", loader="V5",
         classification="Decorativo / Objeto narrativo",
         role="Dispensador del lado oeste (452,692) y decor de aristas.",
         draw=[429, 588, 47, 104], anchor="bottom-center; dh=104, dw=104*naturalWidth/naturalHeight",
         shared="HUB + pintor de aristas de salas de campaña",
         note="Humor negro: botella cian con halo de 'agua bendita'. Sin texto generado."),
    dict(id="T02-06", name="bancos_descanso", file="hub_t02_06_bench.png",
         w=256, h=198, pivot="bottom-center", thr=18,
         slot="limbo_bench_prop", loader="V5",
         classification="Decorativo / Mobiliario secundario",
         role="Bancos gemelos junto al descenso (1037,1178).",
         draw=[1037, 1178, 96, 74], anchor="bottom-center; dw=96, dh=96*naturalHeight/naturalWidth",
         shared="HUB + salas de campaña (mismo slot de arte)",
         note="Banqueta art-déco con respaldo en abanico; variante de mobiliario, no elemento de relleno."),
    dict(id="T02-07", name="jardinera_neon", file="hub_t02_07_planter.png",
         w=96, h=108, pivot="bottom-center", thr=18,
         slot="club_neon_planter_prop", loader="V5",
         classification="Decorativo / Variante visual",
         role="Cuatro jardineras fijas (1005/1495 × 702/1178) y aristas de sala.",
         draw=[966, 614, 78, 88], anchor="bottom-center; dh=88, dw=88*naturalWidth/naturalHeight",
         shared="HUB + pintor de aristas de salas de campaña",
         note="Variante de la familia: follaje violeta con puntas cian/magenta y cráneo oculto."),
    dict(id="T02-08", name="plataforma_descenso", file="hub_t02_08_liftpad.png",
         w=198, h=104, pivot="center", thr=18,
         slot="descent_abyssal_lift_pad", loader="V5",
         classification="Funcional / Interactivo",
         role="Plataforma de descenso; dibujada también en las puertas de sala.",
         draw=[-99, -52, 198, 104], anchor="center; drawImage(lp,-92,-48,184,96) tras translate/rotate",
         shared="HUB + puertas de salas de campaña",
         note="Diamante 2:1 enrasado. No se cambia Ot.openT ni la lógica de plunge."),
    dict(id="T02-09", name="luminaria_techo", file="hub_t02_09_ceiling_fixture.png",
         w=148, h=38, pivot="center", thr=18,
         slot="wall_ceiling_neon_fixture", loader="V5 (capa de pared en caché)",
         classification="Arquitectónico / Iluminación",
         role="Barra de neón horizontal de techo/muro, pintada en la caché de pared.",
         draw=[52, -177, 116, 30], anchor="top-center; drawImage(nf, i-58, 12-l, 116, 30)",
         shared="HUB + salas de campaña (pintor $b/_b)", cached=True,
         note="Se invalida la caché con DMO_INFERNAL_ART.invalidate() (API existente) para que se redibuje."),
    dict(id="T02-10", name="aplique_pared", file="hub_t02_10_sconce.png",
         w=48, h=60, pivot="center", thr=18,
         slot="club_wall_sconce_side", loader="V5 (capa de aristas en caché)",
         classification="Arquitectónico / Señalización luminosa",
         role="Apliques laterales de pared; 228 consultas __DDM_GET_V5 en el barrido del HUB.",
         draw=[0, -42, 38, 48], anchor="top-left; drawImage(ss, wx-6, wy-42, 38, 48)",
         shared="HUB + salas de campaña (pintor de aristas)", cached=True,
         note="Pantalla de cristal violeta con luz cian/rosa. No añade fuentes de luz nuevas al sistema."),
]


def place_contain(im, alpha, W, H, pivot):
    sw, sh = im.size
    k = min(W / sw, H / sh)
    nw, nh = max(1, round(sw * k)), max(1, round(sh * k))
    piece = im.convert("RGBA").resize((nw, nh), Image.LANCZOS)
    piece.putalpha(alpha.resize((nw, nh), Image.LANCZOS))
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x = (W - nw) // 2
    y = (H - nh) if pivot == "bottom-center" else (0 if pivot.startswith("top") else (H - nh) // 2)
    canvas.alpha_composite(piece, (x, y))
    return canvas, {"scale": round(k, 5), "placed": [nw, nh], "offset": [x, y],
                    "pivot": pivot, "deformed": False}


def verify(im, spec):
    out = {"width": im.width, "height": im.height, "mode": im.mode, "format": "PNG",
           "exactSize": [im.width, im.height] == [spec["w"], spec["h"]]}
    a = im.getchannel("A")
    hist = a.histogram()
    lo, hi = a.getextrema()
    total = im.width * im.height
    out.update(alphaChannel=True, alphaExtrema=[lo, hi], transparentPx=hist[0],
               partialPx=sum(hist[1:254]), opaquePx=hist[255],
               coveragePct=round(100 * (total - hist[0]) / total, 2))
    corner = [a.getpixel(p) for p in [(0, 0), (im.width - 1, 0),
                                      (0, im.height - 1), (im.width - 1, im.height - 1)]]
    out["cornersTransparent"] = all(v == 0 for v in corner)
    px = im.load()
    halo = 0
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, al = px[x, y]
            if 8 < al < 250 and min(r, g, b) > 205 and (max(r, g, b) - min(r, g, b)) < 28:
                halo += 1
    out["whiteFringePx"] = halo
    out["whiteFringePct"] = round(100 * halo / max(1, out["partialPx"]), 2)
    out["borderClean"] = out["cornersTransparent"] and out["whiteFringePct"] < 12
    return out


def main():
    DST.mkdir(parents=True, exist_ok=True)
    man = {
        "tanda": "HUB-02",
        "title": "Reconstrucción integral de escenarios · HUB · Tanda 02 (10 assets)",
        "build": "DEADBEAT_DISCO.ART.html",
        "integrationFile": "ART_PACK/art_pack.js",
        "loader": "window.__DDM_V5_IMG[slot] / __DDM_GET_V5(slot) (registro existente)",
        "dimensionSource": "ART_EVIDENCE/hub/tanda_02/audit_runtime.json (registrySizes medido en HUB real) + ART_AUDIT/asset_inventory.json",
        "preparation": "ART_TOOLS/prepare_hub_tanda_02.py · build_alpha/crop_alpha de prepare_tanda_02.py · contain + pivote · descontaminación de croma",
        "sharedSystems": "6 slots son compartidos con el pintor de aristas/puertas de salas de campaña; solo cambia el Image, no la geometría ni la lógica. Ver ART_HUB_TANDA_02_AUDIT.md §3.",
        "count": len(SPEC), "assets": [],
    }
    for s in SPEC:
        src_path = SRC / s["file"]
        raw_full = Image.open(src_path).convert("RGB")
        src_size = list(raw_full.size)
        raw = raw_full
        crop = None
        if s.get("sourceCrop"):
            crop = s["sourceCrop"]
            raw = raw_full.crop(crop)
        alpha, bg = prep02.build_alpha(raw, s["thr"])
        alpha = alpha.filter(ImageFilter.MinFilter(3))
        alpha = alpha.filter(ImageFilter.GaussianBlur(0.45))
        alpha = alpha.point(lambda v: 0 if v < 24 else v)
        obj, alpha = prep02.crop_alpha(raw, alpha)
        clean = obj.convert("RGB")
        cp, ap = clean.load(), alpha.load()
        for y in range(clean.height):
            for x in range(clean.width):
                if ap[x, y] == 0:
                    cp[x, y] = (10, 12, 18)
        final, place = place_contain(clean, alpha, s["w"], s["h"], s["pivot"])
        out = DST / s["file"]
        final.save(out, "PNG", optimize=True)
        chk = Image.open(out)
        chk.load()
        geo = dict(place, sourceSize=src_size, alphaBBox=[obj.width, obj.height],
                   backgroundDetected=list(bg), threshold=s["thr"],
                   mode="contain + chroma decontamination")
        if crop:
            geo["sourceCrop"] = crop
            geo["sourceCropReason"] = "la fuente generada contenía dos expendedoras; el slot pinta una. Fuente original conservada íntegra."
        rec = {
            "id": s["id"], "name": s["name"],
            "file": REL + s["file"], "source": REL + "_source/" + s["file"],
            "sourceSize": src_size,
            "bytes": out.stat().st_size,
            "sha256": hashlib.sha256(out.read_bytes()).hexdigest(),
            "slot": s["slot"], "loader": s["loader"],
            "classification": s["classification"], "role": s["role"],
            "measuredDrawBox": s["draw"], "anchor": s["anchor"],
            "sharedWith": s["shared"], "cachedLayer": bool(s.get("cached")),
            "note": s["note"], "preparation": geo,
        }
        rec.update(verify(chk, s))
        man["assets"].append(rec)
        print(f"{s['id']} {s['name']:<24} {chk.width:>4}x{chk.height:<4} "
              f"alpha={rec['alphaChannel']} cover={rec['coveragePct']:5.1f}% "
              f"corners={rec['cornersTransparent']} fringe={rec['whiteFringePct']}% "
              f"exact={rec['exactSize']} {out.stat().st_size:>7}B")
    (DST / "manifest.json").write_text(json.dumps(man, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("\nmanifest:", DST / "manifest.json", "assets:", len(man["assets"]))


if __name__ == "__main__":
    main()
