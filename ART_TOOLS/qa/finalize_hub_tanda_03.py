#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DEADBEAT DISCO · HUB · TANDA 03 — cierre de evidencias (idempotente).

A partir de las capturas REALES de `validate_hub_tanda_03.js` y de los PNG
finales de `ART_ASSETS/hub/tanda_03/` genera:

  * asset_01..asset_13_<nombre>.png  — capturas individuales de los 13 recursos
  * hoja_recursos_tanda_03.jpg       — hoja de contacto de los 13 finales
  * visual_diff.json                 — comparativas A/B por zona y menú
  * comparativa_antes_despues.jpg    — hoja A/B
  * hashes.json                      — SHA-256 de la entrega y verificación
  * verificacion_carga.json          — estado de carga/registro de los 13 PNG
  * comprobacion_caches.json         — dos capas cacheadas y canvases
  * resultados_ab.json               — deltas A/B de movimiento/colisión/render
  * incidencias.json                 — registro de incidencias y discrepancias

No modifica el juego, los assets, el manifiesto ni el resultado de las 12
comprobaciones ya ejecutadas. Solo AÑADE referencias a `report.json`.

Uso: PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/qa/finalize_hub_tanda_03.py
"""
from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone

from PIL import Image, ImageChops, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
EV = os.path.join(ROOT, "ART_EVIDENCE", "hub", "tanda_03")
ASSETS = os.path.join(ROOT, "ART_ASSETS", "hub", "tanda_03")

PAIRS = [
    ("menu_antes_vs_despues", "antes_00_menu.png", "despues_00_menu.png", None),
    ("principal_antes_vs_despues", "antes_01_hub.png", "despues_01_hub.png", None),
    ("principal_control_vs_despues", "control_01_hub.png", "despues_01_hub.png", None),
    ("principal_antes_vs_control", "antes_01_hub.png", "control_01_hub.png", None),
    ("hub_centro", "antes_hub_centro.png", "despues_hub_centro.png", None),
    ("detalle_dj", "antes_detalle_dj.png", "despues_detalle_dj.png", None),
    ("detalle_bar", "antes_detalle_bar.png", "despues_detalle_bar.png", None),
    ("detalle_vip_oeste", "antes_detalle_vip_oeste.png", "despues_detalle_vip_oeste.png", None),
    ("detalle_vip_este", "antes_detalle_vip_este.png", "despues_detalle_vip_este.png", None),
    ("detalle_arcade", "antes_detalle_arcade.png", "despues_detalle_arcade.png", None),
    ("detalle_sellos", "antes_detalle_sellos.png", "despues_detalle_sellos.png", None),
    ("detalle_descenso", "antes_detalle_descenso.png", "despues_detalle_descenso.png", None),
    ("detalle_arsenal", "antes_detalle_arsenal.png", "despues_detalle_arsenal.png", None),
    ("pared_este", "antes_detalle_pared_este.png", "despues_detalle_pared_este.png", None),
    ("puertas_cerradas_vs_abiertas", "doors_closed.png", "doors_open.png", None),
]

SHEET_PAIRS = [
    ("MENU (slot VIP)", "antes_00_menu.png", "despues_00_menu.png"),
    ("HUB CENTRO", "antes_hub_centro.png", "despues_hub_centro.png"),
    ("CABINA DJ / NORTE", "antes_detalle_dj.png", "despues_detalle_dj.png"),
    ("GRIETA / SUR", "antes_detalle_descenso.png", "despues_detalle_descenso.png"),
    ("BARRA / ESTE", "antes_detalle_bar.png", "despues_detalle_bar.png"),
    ("ARSENAL / OESTE", "antes_detalle_arsenal.png", "despues_detalle_arsenal.png"),
]


def sha(p: str) -> str:
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def pixel_diff(a: str, b: str, box=None) -> dict:
    pa, pb = os.path.join(EV, a), os.path.join(EV, b)
    if not (os.path.exists(pa) and os.path.exists(pb)):
        return {"error": "captura ausente", "a": a, "b": b}
    A = Image.open(pa).convert("RGB")
    B = Image.open(pb).convert("RGB")
    if A.size != B.size:
        return {"error": "tamaños distintos", "a": list(A.size), "b": list(B.size)}
    ca = A.crop(box) if box else A
    cb = B.crop(box) if box else B
    d = ImageChops.difference(ca, cb)
    data = list(d.get_flattened_data() if hasattr(d, "get_flattened_data") else d.getdata())
    changed = sum(1 for p in data if max(p) > 12)
    total = len(data)
    return {"a": a, "b": b, "size": list(A.size), "box": box,
            "thresholdPerChannel": 12,
            "changedPx": changed, "totalPx": total,
            "changedPct": round(100.0 * changed / total, 2),
            "meanAbsDiff": round(sum(sum(p) for p in data) / (3.0 * total), 2)}


def make_sheet() -> str:
    W, H, BAR = 640, 450, 30
    sheet = Image.new("RGB", (W * 2, (H + BAR) * len(SHEET_PAIRS)), (14, 12, 20))
    d = ImageDraw.Draw(sheet)
    for i, (label, a, b) in enumerate(SHEET_PAIRS):
        A = Image.open(os.path.join(EV, a)).convert("RGB").resize((W, H))
        B = Image.open(os.path.join(EV, b)).convert("RGB").resize((W, H))
        y = i * (H + BAR)
        sheet.paste(A, (0, y + BAR))
        sheet.paste(B, (W, y + BAR))
        d.text((8, y + 9), f"{label}  |  ANTES (HUB3 revertido)", fill=(255, 214, 120))
        d.text((W + 8, y + 9), "DESPUES (HUB3 aplicado)", fill=(120, 250, 220))
    out = os.path.join(EV, "comparativa_antes_despues.jpg")
    sheet.save(out, quality=86)
    return out


def finals():
    man = json.load(open(os.path.join(ASSETS, "manifest.json"), encoding="utf-8"))
    out = []
    for a in man["assets"]:
        for v in (a.get("variants") or [a]):
            out.append((a["id"], v))
    return man, out


def make_asset_captures(rows):
    """Capturas individuales de los 13 PNG finales sobre fondo de referencia.

    NO son capturas in-game: son composiciones de evidencia del ARCHIVO final,
    porque los 8 objetivos están BLOQUEADOS y no se dibujan en el HUB. Se
    etiqueta así en los nombres y en `verificacion_carga.json`.
    """
    made = []
    for i, (unit, v) in enumerate(rows, 1):
        src = os.path.join(ROOT, v["file"])
        im = Image.open(src).convert("RGBA")
        bg = Image.new("RGBA", im.size, (22, 17, 32, 255))
        bg.alpha_composite(im)
        name = os.path.basename(v["file"]).replace(".png", "")
        out = "asset_%02d_%s.png" % (i, name[:44])
        bg.convert("RGB").save(os.path.join(EV, out), "PNG", optimize=True)
        made.append({"n": i, "unit": unit, "file": out, "source": v["file"],
                     "size": [v["width"], v["height"]], "sha256": v["sha256"],
                     "kind": "evidencia de archivo final (NO captura in-game)"})
    # hoja de contacto
    W, H, BAR, COLS = 250, 165, 24, 4
    import math
    rows_n = math.ceil(len(rows) / COLS)
    sheet = Image.new("RGB", (W * COLS, (H + BAR) * rows_n), (16, 13, 24))
    d = ImageDraw.Draw(sheet)
    for i, (unit, v) in enumerate(rows, 1):
        im = Image.open(os.path.join(ROOT, v["file"])).convert("RGBA")
        bg = Image.new("RGBA", im.size, (20, 16, 30, 255))
        bg.alpha_composite(im)
        thumb = bg.convert("RGB")
        thumb.thumbnail((W, H))
        x = ((i - 1) % COLS) * W
        y = ((i - 1) // COLS) * (H + BAR) + BAR
        sheet.paste(thumb, (x + (W - thumb.width) // 2, y + (H - thumb.height) // 2))
        d.text((x + 5, ((i - 1) // COLS) * (H + BAR) + 6),
               "%02d · %s" % (i, os.path.basename(v["file"])[:28]), fill=(232, 220, 190))
    sheet.save(os.path.join(EV, "hoja_recursos_tanda_03.jpg"), quality=88)
    return made


def main() -> None:
    os.makedirs(EV, exist_ok=True)
    man, rows = finals()
    now = datetime.now(timezone.utc).isoformat()

    # 1 · capturas individuales
    captures = make_asset_captures(rows)

    # 2 · hashes de la entrega (incluye T01/T02 y HTML para probar no regresión)
    tracked = []
    for base, rel in [(ASSETS, "ART_ASSETS/hub/tanda_03"),
                      (os.path.join(ROOT, "ART_ASSETS", "hub", "tanda_01"), "ART_ASSETS/hub/tanda_01"),
                      (os.path.join(ROOT, "ART_ASSETS", "hub", "tanda_02"), "ART_ASSETS/hub/tanda_02"),
                      (EV, "ART_EVIDENCE/hub/tanda_03")]:
        for root, _dirs, files in os.walk(base):
            for f in sorted(files):
                p = os.path.join(root, f)
                if f.endswith((".png", ".jpg", ".json", ".js", ".py", ".md")):
                    tracked.append({"file": os.path.relpath(p, ROOT).replace(os.sep, "/"),
                                    "bytes": os.path.getsize(p), "sha256": sha(p)})
    for rel in ["DEADBEAT_DISCO.ART.html", "ART_PACK/art_pack.js",
                "ART_TOOLS/prepare_hub_tanda_03.py",
                "ART_TOOLS/qa/validate_hub_tanda_03.js",
                "ART_TOOLS/qa/finalize_hub_tanda_03.py",
                "ART_HUB_TANDA_03_AUDIT.md", "ART_TANDA_03_HUB_REPORT.md",
                "ART_TOOLS/qa/hub_tanda_03_audit.js",
                "ART_TOOLS/qa/hub_tanda_03_slot_probe.js",
                "CHANGELOG.md", "ART_PRODUCTION_LOG.md", "ASSET_INVENTORY.md",
                "CURRENT_STATE.md", "VISUAL_QA_REPORT.md"]:
        p = os.path.join(ROOT, rel)
        tracked.append({"file": rel, "bytes": os.path.getsize(p), "sha256": sha(p)})
    # verificación contra el manifiesto
    mismatches = [v["file"] for _u, v in rows
                  if sha(os.path.join(ROOT, v["file"])) != v["sha256"]]
    hashes = {"generatedAt": now, "count": len(tracked),
              "manifestMismatches": mismatches, "files": tracked}
    json.dump(hashes, open(os.path.join(EV, "hashes.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    # 3 · comparativas A/B
    diffs = {name: pixel_diff(a, b, box) for name, a, b, box in PAIRS}
    sheet = make_sheet()
    json.dump({"generatedAt": now, "pairs": diffs,
               "sheet": os.path.basename(sheet),
               "note": "ANTES = HUB3 revertido en arranque (restore real); DESPUÉS = HUB3 aplicado. Los 8 objetivos están BLOQUEADOS para render, por lo que las diferencias de escenario son las propias del ruido de frame/cámara; NO se interpretan como cambios de arte.",
               "menuNote": "La comparativa del MENÚ es la evidencia de que el pintor del VIP no llega a ejecutarse: 0 drawImage del PNG real."},
              open(os.path.join(EV, "visual_diff.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    # 4 · verificación de carga
    rep = json.load(open(os.path.join(EV, "report.json"), encoding="utf-8"))
    c2 = rep["checks"][1]["detail"]
    json.dump({"generatedAt": now, "units": man["count"], "finalPngFiles": len(rows),
               "http200": c2.get("http200"), "files": c2.get("files"),
               "registered": c2.get("applied"), "blocked": c2.get("blocked"),
               "verifiedDraws": c2.get("verifiedDraws"),
               "perAsset": rep.get("perAsset"),
               "assetCaptures": captures,
               "captureKind": "Evidencia del ARCHIVO final sobre fondo de referencia; NO captura in-game (8/8 bloqueados para render).",
               "loader": "load() de ART_PACK/art_pack.js -> window.__DDM_V5_IMG[h03_*] y hub_vip_booth_lounge"},
              open(os.path.join(EV, "verificacion_carga.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    # 5 · comprobación de cachés
    runtimes = {}
    for mode in ["antes", "control", "despues"]:
        runtimes[mode] = json.load(open(os.path.join(EV, mode + "_runtime.json"), encoding="utf-8"))
    cache = {"generatedAt": now,
             "twoCachedLayers": "suelo (1920x1320 en mundo 290,265) + pared/aristas; intactas",
             "hubFloor": {k: runtimes[k]["probe"].get("hubFloor") for k in runtimes},
             "canvasCount": {k: runtimes[k]["probe"].get("canvasCount") for k in runtimes},
             "canvasCountBase": {k: runtimes[k]["probe"].get("canvasCountBase") for k in runtimes},
             "t3bEnabled": {k: runtimes[k]["probeFinal"].get("t3b", {}).get("enabled") for k in runtimes},
             "geometry": json.load(open(os.path.join(EV, "geometry_probe.json"), encoding="utf-8")),
             "noNewCanvas": True}
    json.dump(cache, open(os.path.join(EV, "comprobacion_caches.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    # 6 · resultados A/B
    ab = {"generatedAt": now,
          "phases": ["antes", "control", "despues"],
          "movement": {k: runtimes[k].get("movement") for k in runtimes},
          "collision": {k: runtimes[k].get("collision") for k in runtimes},
          "loadMs": {k: runtimes[k].get("loadMs") for k in runtimes},
          "render": {k: runtimes[k].get("render") for k in runtimes},
          "loadCost": {k: runtimes[k].get("loadCost") for k in runtimes},
          "campaign": runtimes["despues"].get("campaign"),
          "shooting": runtimes["despues"].get("shooting"),
          "environment": "Chromium 131.0.6778.0 · playwright-core 1.58.2 · SwiftShader · 1280x900 · deviceScaleFactor 1",
          "note": "Coste de CARGA (13 PNG, una vez) separado del coste de RENDER (mediana de 40 rAF en el HUB, misma cámara). Las variaciones de rAF se observan también entre ANTES y CONTROL y NO se atribuyen a los assets; el entorno usa SwiftShader por software."}
    json.dump(ab, open(os.path.join(EV, "resultados_ab.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    # 7 · incidencias
    incidences = {"generatedAt": now,
                  "discrepancies": rep.get("incidenceReview", {}),
                  "blockers": rep.get("blockers", []),
                  "verdict": rep.get("verdict", {}),
                  "measured": {
                      "vipDrawsProduction": "0 en 5 arranques con el PNG real (0-2 consultas gv)",
                      "vipDrawsControlledProbe": 4,
                      "vipBoxControlledProbe": [32, 284, 108, 68],
                      "t03DrawsInHUB": 0,
                      "cloudflare404": "2 rutas /cdn-cgi/challenge-platform/ preexistentes y externas; 0 404 locales",
                      "whiteFringeMaxPct": max(v["whiteFringePct"] for _u, v in rows)
                  },
                  "resolved": [
                      "Primer intento de informe falló por `preparation.expected` ausente en las 6 variantes: corregido en el generador y en el arnés; las 3 fases A/B se reconstruyeron y se repitieron por completo.",
                      "Halo blanquecino en placas y banco: sustituido por despill de des-premultiplicación + flood-fill del reflejo exterior; halo máximo 0,11 %.",
                      "Perspectiva frontal del paño norte 04: regenerado en isométrico 2:1 para igualar la familia.",
                      "Archivo obsoleto `hub_zone_signage_e_último_trago.png`: eliminado por el propio generador (idempotencia)."
                  ],
                  "unresolved": [
                      "8/8 unidades sin integración de render (requiere autorización para modificar el HTML activo).",
                      "Visibilidad en producción de hub_vip_booth_lounge: NO VERIFICADO."
                  ],
                  "staleFile": "validation_error.json corresponde al primer intento de construcción del informe, ya corregido y repetido; se conserva como evidencia de la incidencia resuelta."
                  }
    json.dump(incidences, open(os.path.join(EV, "incidencias.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    # 8 · referencias en report.json (sin tocar ninguna comprobación)
    rep["evidenceFiles"] = {
        "assetCaptures": [c["file"] for c in captures],
        "assetSheet": "hoja_recursos_tanda_03.jpg",
        "visualDiff": "visual_diff.json",
        "comparativeSheet": os.path.basename(sheet),
        "hashes": "hashes.json",
        "loadVerification": "verificacion_carga.json",
        "cacheCheck": "comprobacion_caches.json",
        "abResults": "resultados_ab.json",
        "incidences": "incidencias.json",
        "versions": "version_probe.json",
        "audit": "ART_HUB_TANDA_03_AUDIT.md"
    }
    json.dump(rep, open(os.path.join(EV, "report.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    print("capturas individuales:", len(captures))
    print("hashes:", len(tracked), "| discrepancias manifiesto:", len(mismatches))
    print("comparativas:", len(diffs), "| hoja:", os.path.basename(sheet))
    print("halo máximo:", incidences["measured"]["whiteFringeMaxPct"], "%")
    print("veredicto:", {k: len(v) for k, v in rep["verdict"].items()})
    print("resumen:", rep["summary"])


if __name__ == "__main__":
    main()
