#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DEADBEAT DISCO · HUB · TANDA 03 — preparación reproducible de los assets.

Convierte las 8 ilustraciones fuente de ART_ASSETS/hub/tanda_03/*/source/ en
13 PNG finales (7 unidades individuales + 6 variantes del sistema de
señalética), conservando TODAS las fuentes originales íntegras.

Las dimensiones NO se estiman:
  * Suelos: rectángulos MUNDO medidos en runtime (canvas de suelo cacheado
    1920x1320 dibujado en (290,265), cajas de estaciones/props/grieta/DJ de
    ART_EVIDENCE/hub/tanda_03/audit_runtime.json).
  * Variantes de mobiliario: dimensiones naturales EXACTAS de los slots V5
    club_neon_planter_prop (96x108) y limbo_bench_prop (256x198), medidas.
  * VIP lounge: caja de dibujo REAL 108x68 en el pintor del menú
    (slot_probe.json) a 2x para no perder detalle, sin deformar el aspecto.
  * Señalética: SIN slot V5. Se registra explícitamente `slot: null` y
    `dimensionSource: sin slot medido`; el tamaño consignado es el tamaño
    REAL del archivo final verificado con Pillow, no una estimación de motor.

Pipeline: build_alpha()/crop_alpha() de prepare_tanda_02.py + place_contain()/
verify() de prepare_hub_tanda_02.py. contain + pivote, NUNCA deformación,
descontaminación de croma y RGB neutro en transparentes.

Uso: PYTHONPATH=<pillow> python3 ART_TOOLS/prepare_hub_tanda_03.py
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import unicodedata
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "ART_ASSETS" / "hub" / "tanda_03"
REL = "ART_ASSETS/hub/tanda_03/"

_spec = importlib.util.spec_from_file_location("prep02", ROOT / "ART_TOOLS" / "prepare_tanda_02.py")
prep02 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(prep02)
_spec2 = importlib.util.spec_from_file_location("prephub02", ROOT / "ART_TOOLS" / "prepare_hub_tanda_02.py")
prephub02 = importlib.util.module_from_spec(_spec2)
_spec2.loader.exec_module(prephub02)

place_contain = prephub02.place_contain
verify = prephub02.verify

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# ---------------------------------------------------------------------------
# 8 unidades de producción. `slot=None` == BLOQUEADO: no hay pintor en el HUB.
# ---------------------------------------------------------------------------
SPEC = [
    dict(id="T03-01", folder="01_floor_patch_o", name="pano_suelo_oeste",
         source="hub_t03_01_floor_o.png", final="hub_floor_patch_o.png",
         w=580, h=430, pivot="center", thr=18, slot=None,
         worldBox=[290, 720, 580, 430], orientation="OESTE",
         classification="Arquitectónico / Suelo (Familia A)",
         role="Paño perimetral OESTE entre el medallón y el muro; zona D/arsenal (705,855).",
         dimensionSource="Rectángulo mundo medido: suelo 1920x1320 en (290,265); medallón 760x430 centrado en (1250,935) -> x 290..870, y 720..1150.",
         note="Abanico radial art-déco en mármol obsidiana con latón y vetas magenta/cian. El pliego lo llama 'oriental'; el código y el informe T02 lo sitúan al OESTE (discrepancia D-02)."),
    dict(id="T03-02", folder="02_floor_patch_e", name="pano_suelo_este",
         source="hub_t03_02_floor_e.png", final="hub_floor_patch_e.png",
         w=580, h=430, pivot="center", thr=18, slot=None,
         worldBox=[1630, 720, 580, 430], orientation="ESTE",
         classification="Arquitectónico / Suelo (Familia A)",
         role="Paño perimetral ESTE entre el medallón y el muro; zona E/barra (1790,855) y expendedora (2048,692).",
         dimensionSource="Rectángulo mundo medido: x 1630..2210, y 720..1150 (simétrico del Oeste respecto a cx=1250).",
         note="Misma familia de mármol/latón/esmalte pero composición de chevrones anidados y arcos violeta/cian; no repite el patrón del Oeste ni la textura de T01."),
    dict(id="T03-03", folder="03_floor_patch_s_crack", name="pano_suelo_sur_grieta",
         source="hub_t03_03_floor_s_crack.png", final="hub_floor_patch_s_crack.png",
         w=760, h=329, pivot="center", thr=18, slot=None,
         worldBox=[870, 1256, 760, 329], orientation="SUR",
         classification="Arquitectónico / Suelo (Familia A)",
         role="Banda meridional posterior a la grieta de descenso (estación C, 1250,1365).",
         dimensionSource="Caja medida de hub_abyss_stair_crack [1085,1256,330,180] y borde sur del suelo y=1585 -> x 870..1630, y 1256..1585.",
         note="Fisuras cian que continúan visualmente la fractura existente. No se modifica la geometría, la caja ni las colisiones de la grieta."),
    dict(id="T03-04", folder="04_floor_north_dj", name="pano_suelo_norte_dj",
         source="hub_t03_04_floor_north_dj.png", final="hub_floor_north_dj.png",
         w=760, h=224, pivot="center", thr=18, slot=None,
         worldBox=[870, 265, 760, 224], orientation="NORTE",
         classification="Arquitectónico / Suelo (Familia A)",
         role="Corredor norte junto a la cabina del DJ (estación B, 1250,525).",
         dimensionSource="Borde superior del suelo y=265 y caja medida de hub_dj_shrine [1058,280,384,209] -> x 870..1630, y 265..489.",
         note="Motivo de onda/ecualizador incrustado en el pavimento: relación con la zona musical sin convertirse en decoración independiente ni en señal de HUD."),
    dict(id="T03-05", folder="05_planter_variant_02", name="jardinera_variante_02",
         source="hub_t03_05_planter_v02.png", final="hub_planter_variant_02.png",
         w=96, h=108, pivot="bottom-center", thr=18, slot=None,
         worldBox=None, orientation=None,
         classification="Mobiliario / Variante (Familia B)",
         role="Segunda variante de jardinera para las 4 instancias de hubDecor (1005/1495 x 702/1178).",
         dimensionSource="Dimensiones naturales EXACTAS del slot V5 club_neon_planter_prop (96x108, caja 78x88), medidas en audit_runtime.json.",
         note="Silueta diferenciada: urna acanalada alta sobre plinto escalonado, frente a la tina baja de T02. Mismo anclaje bottom-center y mismo tamaño de slot; no se añade colisionador."),
    dict(id="T03-06", folder="06_bench_variant_02", name="banco_variante_02",
         source="hub_t03_06_bench_v02.png", final="hub_bench_variant_02.png",
         w=256, h=198, pivot="bottom-center", thr=18, slot=None,
         worldBox=None, orientation=None,
         classification="Mobiliario / Variante (Familia B)",
         role="Segunda variante de banco para las 2 instancias de hubDecor (1085/1415, 1252).",
         dimensionSource="Dimensiones naturales EXACTAS del slot V5 limbo_bench_prop (256x198, caja 96x74), medidas en audit_runtime.json.",
         note="Respaldo en abanico con nervios radiales y medallón, frente al banco liso de T02. Proporciones funcionales y anclaje compatibles; sin cambios de colisión ni interacción."),
    dict(id="T03-07", folder="07_vip_booth_lounge", name="vip_booth_lounge",
         source="hub_t03_07_vip_lounge.png", final="hub_vip_booth_lounge.png",
         w=216, h=136, pivot="center", thr=18, slot="hub_vip_booth_lounge",
         worldBox=None, orientation=None,
         classification="Espacio VIP / Setpiece de menú (Familia C)",
         role="Alcoba VIP dibujada 4 veces (2 lados x 2 filas) en el banner 'pixel-club' del MENÚ, caja 108x68.",
         dimensionSource="Caja de dibujo REAL 108x68 medida con slot_probe.json (vipDrawsMenu=4, vipBoxMenu=[32,284,108,68]); archivo a 2x (216x136) conservando el aspecto 108/68=1.588 sin deformación.",
         note="ÚNICO objetivo con clave V5 y pintor en el código (banner del menú 768x500, 4 drawImage de 108x68), NO en el HUB. D-07: ese renderer no está activo en el build en ejecución (0 dibujos medidos en 5 arranques); la integración de render queda BLOQUEADA y la visibilidad en producción NO VERIFICADA. No se declara 'nuevo espacio VIP en el HUB'."),
    dict(id="T03-08", folder="08_zone_signage", name="sistema_senaletica_6_zonas",
         source="hub_t03_08_signage_master.png", final=None,
         w=192, h=128, pivot="center", thr=18, slot=None,
         worldBox=None, orientation=None,
         classification="Señalética diegética / Sistema de 6 variantes (Familia D)",
         role="Sistema de señalética física para las 6 zonas A-F del HUB. Una unidad de producción con 6 variantes.",
         dimensionSource="SIN slot V5 medido (discrepancia D-01). El tamaño consignado 192x128 es el tamaño REAL del archivo final verificado con Pillow; escala de referencia tomada de hub_trophy_board_prop (167x136, caja 156x127) y wall_neon_club_crest (84x84, caja 48x48).",
         note="Placa física de latón con cartela central, sin texto en la fuente. Las 6 variantes comparten tipografía, materiales, iluminación, jerarquía, lenguaje gráfico y escala; cada zona recibe color de neón y numeral propios. No modifica navegación, puertas ni desbloqueo."),
]

ZONES = [
    dict(key="A", roman="I",   label="PISTA",       color=(244, 63, 94),  station="dancer_0 (1030,785)"),
    dict(key="B", roman="II",  label="CABINA DJ",   color=(34, 211, 238), station="dj (1250,525)"),
    dict(key="C", roman="III", label="DESCENSO",    color=(168, 85, 247), station="lift (1250,1365)"),
    dict(key="D", roman="IV",  label="ARSENAL",     color=(253, 224, 71),  station="arsenal (705,855)"),
    dict(key="E", roman="V",   label="BARRA",       color=(236, 72, 153), station="bar (1790,855)"),
    dict(key="F", roman="VI",  label="ARCADE",      color=(129, 140, 248), station="arcade (655,1135) / seals (1845,1135)"),
]


def kill_background_halo(rgb: Image.Image, alpha: Image.Image, bg):
    """Elimina el reflejo grisáceo del fondo CONECTADO al exterior.

    Las fuentes incluyen una sombra/reflejo gris (p. ej. 166,159,150) que no
    es lo bastante clara para el umbral de croma y queda opaca. Se construye
    una máscara de «parecido al fondo» y se propaga desde los bordes: solo se
    borra lo que toca el exterior, de modo que los reflejos cálidos INTERIORES
    del latón (210,202,188) se conservan.
    """
    from collections import deque
    w, h = rgb.size
    px, ap = rgb.load(), alpha.load()
    bg = tuple(bg)
    kind = bytearray(w * h)  # 0 objeto, 1 fondo-like opaco, 2 exterior transparente
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if ap[x, y] == 0:
                kind[y * w + x] = 2
                continue
            mn = min(r, g, b)
            d = max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2]))
            if mn > 120 and d < 115 and abs(r - b) < 38 and r >= b:
                kind[y * w + x] = 1
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            i = y * w + x
            if kind[i] and not seen[i]:
                seen[i] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            i = y * w + x
            if kind[i] and not seen[i]:
                seen[i] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                j = ny * w + nx
                if kind[j] and not seen[j]:
                    seen[j] = 1
                    q.append((nx, ny))
    removed = 0
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if seen[i] and kind[i] == 1:
                ap[x, y] = 0
                px[x, y] = (10, 12, 18)
                removed += 1
    return rgb, alpha, removed


def despill(rgb: Image.Image, alpha: Image.Image, bg):
    """Des-premultipica el color del borde y elimina el sangrado del fondo.

    Las fuentes se generan sobre fondo marfil. En los píxeles de antialias el
    RGB es una mezcla de objeto y fondo; dejarlo tal cual produce el halo
    blanquecino visible en placas y banco. Aquí se recupera el color real del
    objeto: fg = (src - (1-a)*bg) / a. Además se erosiona 1 px y se eliminan
    los píxeles casi acromáticos muy claros (reflejo del fondo), conservando
    el latón dorado (que tiene azul mucho más bajo que rojo).
    """
    a = alpha.filter(ImageFilter.MinFilter(3))
    a = a.filter(ImageFilter.GaussianBlur(0.45))
    a = a.point(lambda v: 0 if v < 26 else v)
    clean = rgb.copy()
    cp, ap = clean.load(), a.load()
    bg = tuple(bg)
    for y in range(clean.height):
        for x in range(clean.width):
            al = ap[x, y]
            r, g, b = cp[x, y]
            if al == 0:
                cp[x, y] = (10, 12, 18)
                continue
            mx, mn = max(r, g, b), min(r, g, b)
            if al > 235 and mn > 195 and mx - mn < 28:
                ap[x, y] = 0
                cp[x, y] = (10, 12, 18)
                continue
            if al < 250:
                f = al / 255.0
                cp[x, y] = tuple(
                    max(0, min(255, int((c - (1.0 - f) * bg[i]) / f)))
                    for i, c in enumerate((r, g, b)))
            else:
                cp[x, y] = (r, g, b)
    return clean, a


def prepared_object(folder: str, source: str, thr: int):
    """Devuelve (RGB recortado y descontaminado, alpha, geometría)."""
    src = BASE / folder / "source" / source
    raw = Image.open(src).convert("RGB")
    src_size = list(raw.size)
    alpha, bg = prep02.build_alpha(raw, thr)
    obj, alpha = prep02.crop_alpha(raw, alpha)
    clean = obj.convert("RGB")
    clean, alpha, halo_removed = kill_background_halo(clean, alpha, bg)
    clean, alpha = despill(clean, alpha, bg)
    obj, alpha = prep02.crop_alpha(clean, alpha)
    geo = {"sourceSize": src_size, "alphaBBox": [obj.width, obj.height],
           "backgroundDetected": list(bg), "threshold": thr,
           "haloPixelsRemoved": halo_removed,
           "mode": "contain + exterior halo flood-fill + unpremultiply despill"}
    return obj, alpha, geo


def recolor_neon(im: Image.Image, color) -> Image.Image:
    """Recolorea SOLO los píxeles de neón (azulados/magenta, alta saturación).

    El latón (rojo > azul) queda intacto: así las 6 señales comparten
    materiales y solo cambia la identidad cromática de zona.
    """
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a < 40:
                continue
            mx, mn = max(r, g, b), min(r, g, b)
            if mx > 135 and mx - mn > 65 and b > int(r * 0.85):
                px[x, y] = (min(255, int(0.22 * r + 0.78 * color[0])),
                            min(255, int(0.22 * g + 0.78 * color[1])),
                            min(255, int(0.22 * b + 0.78 * color[2])), a)
    return out


def draw_signage(im: Image.Image, z: dict) -> Image.Image:
    """Inscribe numeral romano y rótulo de zona EN LA CARTELA (objeto físico)."""
    out = im.copy()
    d = ImageDraw.Draw(out)
    c = z["color"]
    W, H = out.size
    f_num = ImageFont.truetype(FONT_BOLD, 38)
    f_lbl = ImageFont.truetype(FONT_BOLD, 13)
    cx, cy = W // 2, H // 2
    # jerarquía: numeral de zona, filete de neón de identidad, rótulo.
    # Todo dentro de la cartela; sin halo artificial ni texto sobre el marco.
    d.text((cx, cy - 16), z["roman"], font=f_num, fill=c, anchor="mm",
           stroke_width=1, stroke_fill=(6, 5, 14))
    d.line([(cx - 50, cy + 10), (cx + 50, cy + 10)], fill=c, width=2)
    d.text((cx, cy + 26), z["key"] + " · " + z["label"], font=f_lbl,
           fill=(238, 226, 205), anchor="mm",
           stroke_width=1, stroke_fill=(6, 5, 14))
    return out


def sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def signage_fname(z: dict) -> str:
    slug = unicodedata.normalize("NFKD", z["label"]).encode("ascii", "ignore").decode()
    slug = slug.lower().replace(" ", "_")
    return "hub_zone_signage_%s_%s.png" % (z["key"].lower(), slug)


def main() -> None:
    # Idempotencia: elimina solo variantes generadas por ESTE script que ya no
    # se producen (p. ej. un nombre antiguo con tilde). Nunca toca fuentes ni
    # recursos de otras tandas.
    expected = {signage_fname(z) for z in ZONES}
    sig_dir = BASE / "08_zone_signage" / "final"
    sig_dir.mkdir(parents=True, exist_ok=True)
    for stale in sig_dir.glob("hub_zone_signage_*.png"):
        if stale.name not in expected:
            stale.unlink()
            print("stale removido:", stale.name)

    man = {
        "tanda": "HUB-03",
        "title": "Reconstrucción del entorno del HUB · Tanda 03 (suelos, mobiliario, lounge VIP y señalética)",
        "build": "DEADBEAT_DISCO.ART.html (INTACTO)",
        "integrationFile": "ART_PACK/art_pack.js (bloque HUB3_* independiente)",
        "loader": "window.__DDM_V5_IMG[slot] / __DDM_GET_V5(slot) — registro y load() existentes",
        "dimensionSource": "ART_EVIDENCE/hub/tanda_03/audit_runtime.json + geometry_probe.json + slot_probe.json; rectángulos mundo medidos en runtime",
        "preparation": "ART_TOOLS/prepare_hub_tanda_03.py · build_alpha/crop_alpha de prepare_tanda_02.py · contain + pivote · descontaminación de croma",
        "productionUnits": 8,
        "finalPngFiles": 13,
        "count": len(SPEC),
        "integrationPolicy": "Los 8 objetivos se producen, cargan con load() y registran en el MISMO window.__DDM_V5_IMG con alias h03_*. La integración de RENDER está BLOQUEADA en los 8: 7 no tienen slot y T03-07 tiene un pintor en el código cuyo renderer no está activo en el build (D-07). Registro ≠ integración. HTML intacto (D-01/D-05/D-07).",
        "assets": [],
    }
    objs = {}
    for s in SPEC:
        objs[s["id"]] = prepared_object(s["folder"], s["source"], s["thr"])

    for s in SPEC:
        clean, alpha, geo = objs[s["id"]]
        folder = BASE / s["folder"]
        final_dir = folder / "final"
        final_dir.mkdir(parents=True, exist_ok=True)
        src_rel = REL + s["folder"] + "/source/" + s["source"]
        base_rec = {
            "id": s["id"], "name": s["name"],
            "source": src_rel, "sourceSize": geo["sourceSize"],
            "slot": s["slot"],
            "drawSlot": s["slot"],
            "loader": "V5" if s["slot"] else "V5 (registro; sin pintor)",
            "classification": s["classification"], "role": s["role"],
            "orientation": s["orientation"],
            "worldBox": s["worldBox"],
            "anchor": ("center; drawImage(vb, 32, 284, 108, 68) x4 en menú"
                       if s["id"] == "T03-07" else
                       ("bottom-center; mismo pivote que el slot de T02" if s["id"] in ("T03-05", "T03-06")
                        else "center; rectángulo mundo propuesto, sin pintor")),
            "dimensionSource": s["dimensionSource"],
            "integrationState": ("BLOQUEADO — registro V5 y loader reales, pero el renderer del MENÚ está inactivo en el build (D-07); visibilidad NO VERIFICADA"
                                 if s["slot"] else
                                 "BLOQUEADO — sin slot de dibujo en el HUB; requiere autorización para modificar el HTML"),
            "visibleInGame": False,
            "referenceSystem": ("DMO_V5 / banner pixel-club del MENÚ (d.menu 768x500, renderer inactivo)"
                                if s["slot"] else
                                "__T3B capa de suelo cacheada / hubDecor / capa aérea (sin punto de inserción público)"),
            "note": s["note"],
            "preparation": dict(geo, expected=[s["w"], s["h"]], pivot=s["pivot"], deformed=False),
            "files": [],
        }

        if s["id"] == "T03-08":
            variants = []
            template = dict(base_rec)
            for z in ZONES:
                placed, place = place_contain(clean, alpha, s["w"], s["h"], s["pivot"])
                placed = recolor_neon(placed, z["color"])
                placed = draw_signage(placed, z)
                fname = signage_fname(z)
                out = final_dir / fname
                placed.save(out, "PNG", optimize=True)
                chk = Image.open(out); chk.load()
                rec = dict(template)
                v = verify(chk, s)
                rec.update(v)
                rec.update({
                    "variantOf": "T03-08", "zone": z["key"], "roman": z["roman"],
                    "label": z["label"], "accentRGB": list(z["color"]),
                    "stationReference": z["station"],
                    "file": REL + s["folder"] + "/final/" + fname,
                    "bytes": out.stat().st_size, "sha256": sha256(out),
                    "preparation": dict(geo, expected=[s["w"], s["h"]],
                                        placed=place["placed"], scale=place["scale"],
                                        offset=place["offset"], pivot=s["pivot"],
                                        deformed=False, mode="contain + recolor neón + cartela"),
                })
                base_rec["files"].append({"file": rec["file"], "sha256": rec["sha256"],
                                          "bytes": rec["bytes"], "width": rec["width"],
                                          "height": rec["height"], "zone": z["key"]})
                variants.append(rec)
                print("T03-08/%s %-26s %dx%d alpha=%s fringe=%s%% exact=%s %dB" %
                      (z["key"], fname[:26], chk.width, chk.height,
                       rec["alphaChannel"], rec["whiteFringePct"], rec["exactSize"], out.stat().st_size))
            base_rec["variants"] = variants
            base_rec["width"], base_rec["height"] = s["w"], s["h"]
            base_rec["exactSize"] = all(v["exactSize"] for v in variants)
            base_rec["file"] = REL + s["folder"] + "/final/ (6 variantes)"
            base_rec["bytes"] = sum(v["bytes"] for v in variants)
            base_rec["sha256"] = None
            base_rec["sha256Note"] = "Un sistema: SHA-256 individual por variante en `variants[]` y `files[]`."
            man["assets"].append(base_rec)
        else:
            final, place = place_contain(clean, alpha, s["w"], s["h"], s["pivot"])
            out = final_dir / s["final"]
            final.save(out, "PNG", optimize=True)
            chk = Image.open(out); chk.load()
            rec = dict(base_rec)
            rec.update(verify(chk, s))
            rec.update({
                "file": REL + s["folder"] + "/final/" + s["final"],
                "bytes": out.stat().st_size, "sha256": sha256(out),
                "sourceSha256": sha256(BASE / s["folder"] / "source" / s["source"]),
                "preparation": dict(geo, placed=place["placed"], scale=place["scale"],
                                    offset=place["offset"], pivot=s["pivot"],
                                    deformed=False, mode="contain + chroma decontamination"),
            })
            man["assets"].append(rec)
            print("%s %-26s %dx%d alpha=%s cover=%5.1f%% corners=%s fringe=%s%% exact=%s %dB" %
                  (s["id"], s["final"][:26], chk.width, chk.height,
                   rec["alphaChannel"], rec["coveragePct"], rec["cornersTransparent"],
                   rec["whiteFringePct"], rec["exactSize"], out.stat().st_size))

    (BASE / "manifest.json").write_text(
        json.dumps(man, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("\nmanifest:", BASE / "manifest.json",
          "| unidades:", len(man["assets"]),
          "| PNG finales:", sum(len(a.get("variants", [])) or 1 for a in man["assets"]))


if __name__ == "__main__":
    main()
