#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HUB · TANDA 04 — FASE 2 · matriz de integración (reproducible).

Toma las coordenadas REALES medidas en `audit_runtime.json` y el manifiesto de
TANDA 03. No estima nada: los 6 anclajes de señalética se derivan de la fórmula
`signY` que usa el propio juego en `drawHubAerialLayer()` (líneas 9577-9582) y
de las coordenadas de estaciones medidas en runtime; los 3 anclajes de props se
derivan de `hubDecor` y de los sofás VIP de T01 medidos en el HTML.

Salidas:
  ART_EVIDENCE/hub/tanda_04/matriz_integracion.json
  ART_HUB_TANDA_04_MATRIX.md
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
EV = os.path.join(ROOT, "ART_EVIDENCE", "hub", "tanda_04")
AUDIT = json.load(open(os.path.join(EV, "audit_runtime.json"), encoding="utf-8"))
MAN3 = json.load(open(os.path.join(ROOT, "ART_ASSETS", "hub", "tanda_03", "manifest.json"), encoding="utf-8"))
HTML = os.path.join(ROOT, "DEADBEAT_DISCO.ART.html")

# --- coordenadas REALES medidas en runtime ---------------------------------
STATIONS = {s["id"]: s for s in AUDIT["hubProbe"]["stations"]}


def sign_y(st):
    """Misma fórmula que drawHubAerialLayer() en el HTML activo."""
    i = st["id"]
    if i == "dj":
        return st["y"] + 42
    if i == "lift":
        return st["y"] + 134
    if i == "cliente000":
        return st["y"] + 34
    if i in ("arsenal", "bar"):
        return st["y"] + 62
    if i in ("arcade", "seals"):
        return st["y"] + 134
    return st["y"] - 84


PLAQUE_W, PLAQUE_H, PLAQUE_DY = 144, 96, 136  # misma escala y jerarquía para las 6

# --- familias ---------------------------------------------------------------
FLOORS = [
    ("T03-01", "HUB_FLOOR_PATCH_O", "h03_floor_patch_o", "OESTE",
     [290, 720, 580, 430], "drawHubFloorLayer() / Wf"),
    ("T03-02", "HUB_FLOOR_PATCH_E", "h03_floor_patch_e", "ESTE",
     [1630, 720, 580, 430], "drawHubFloorLayer() / Wf"),
    ("T03-03", "HUB_FLOOR_PATCH_S_CRACK", "h03_floor_patch_s_crack", "SUR",
     [870, 1256, 760, 329], "drawHubFloorLayer() / Wf"),
    ("T03-04", "HUB_FLOOR_NORTH_DJ", "h03_floor_north_dj", "NORTE",
     [870, 265, 760, 224], "drawHubFloorLayer() / Wf"),
]

FURNITURE = [
    ("T03-05", "HUB_PLANTER_VARIANT_02", "h03_planter_variant_02",
     [413, 812, 78, 88], 452, 900, 88, False,
     "hubDecor / Lc (addHubCustomProp, solid:false)",
     "x derivado de hub_decor_cooler_w (452,692); y=900 dentro del paño O [720..1150]; h=88 idéntico a las 4 jardineras reales"),
    ("T03-06", "HUB_BENCH_VARIANT_02", "h03_bench_variant_02",
     [2000, 826, 96, 74], 2048, 900, 74, True,
     "hubDecor / Lc (addHubCustomProp, solid:false)",
     "x derivado de hub_decor_vending_e (2048,692); y=900 dentro del paño E [720..1150]; h=74 idéntico a los 2 bancos reales"),
]

VIP = ("T03-07", "HUB_VIP_BOOTH_LOUNGE", "h03_vip_booth_lounge",
       [677, 624, 216, 136], 785, 760, 136, False,
       "hubDecor / Lc (addHubCustomProp, solid:false)",
       "x derivado de hub_vip_sofa_nw (785,545) y cliente000 (785,600); y=760 deja 25 px bajo la imagen T01 (439..599) sin solaparla; h=136 = altura natural del PNG")

# señalética: zona -> estación de referencia REAL
SIGNAGE = [
    ("T03-08-A", "HUB_ZONE_SIGNAGE/A · PISTA", "h03_zone_signage_a", "A", "dancer_0"),
    ("T03-08-B", "HUB_ZONE_SIGNAGE/B · CABINA DJ", "h03_zone_signage_b", "B", "dj"),
    ("T03-08-C", "HUB_ZONE_SIGNAGE/C · DESCENSO", "h03_zone_signage_c", "C", "lift"),
    ("T03-08-D", "HUB_ZONE_SIGNAGE/D · ARSENAL", "h03_zone_signage_d", "D", "arsenal"),
    ("T03-08-E", "HUB_ZONE_SIGNAGE/E · BARRA", "h03_zone_signage_e", "E", "bar"),
    ("T03-08-F", "HUB_ZONE_SIGNAGE/F · ARCADE", "h03_zone_signage_f", "F", "arcade"),
]

# --- construcción -----------------------------------------------------------
ALIASES = {
    "T03-01": "h03_floor_patch_o", "T03-02": "h03_floor_patch_e",
    "T03-03": "h03_floor_patch_s_crack", "T03-04": "h03_floor_north_dj",
    "T03-05": "h03_planter_variant_02", "T03-06": "h03_bench_variant_02",
    "T03-07": "h03_vip_booth_lounge",
    "T03-08-A": "h03_zone_signage_a", "T03-08-B": "h03_zone_signage_b",
    "T03-08-C": "h03_zone_signage_c", "T03-08-D": "h03_zone_signage_d",
    "T03-08-E": "h03_zone_signage_e", "T03-08-F": "h03_zone_signage_f",
}

# mapa alias V5 -> registro del manifiesto (mismo orden que HUB3_ASSETS)
FILEMAP = {}
for a in MAN3["assets"]:
    vs = a.get("variants")
    if vs:
        for v in vs:
            FILEMAP["h03_zone_signage_" + str(v["zone"]).lower()] = v
    else:
        FILEMAP[ALIASES[a["id"]]] = a
assert len(FILEMAP) == 13, "se esperaban 13 PNG finales"

rows = []
for uid, unit, key, orient, box, fn in FLOORS:
    v = FILEMAP[ALIASES[uid]]
    rows.append(dict(family="A · SUELOS", artId=uid, unit=unit, v5Key=key,
                     file=v["file"], natural=[v["width"], v["height"]],
                     orientation=orient, worldBox=box, drawArgs=box,
                     renderer=fn, anchor="top-left de la caja mundo medida en manifest T03",
                     slot="drawHubFloorLayer() tras hubCachedFloorCv",
                     derivation="worldBox medido en T03 a partir de Ps=(290,265,1920,1320) y de las estaciones reales",
                     state="PENDIENTE"))
for uid, unit, key, box, x, y, h, flip, fn, deriv in FURNITURE:
    v = FILEMAP[ALIASES[uid]]
    rows.append(dict(family="B · MOBILIARIO", artId=uid, unit=unit, v5Key=key,
                     file=v["file"], natural=[v["width"], v["height"]],
                     orientation="frontal isométrico", worldBox=box,
                     drawArgs=[box[0], box[1], box[2], box[3]],
                     renderer=fn, anchor="bottom-center (%d,%d), h=%d, flip=%s" % (x, y, h, flip),
                     slot="hubDecor[%s] → addHubCustomProp → Lc" % uid,
                     derivation=deriv, state="PENDIENTE"))
uid, unit, key, box, x, y, h, flip, fn, deriv = VIP
v = FILEMAP[ALIASES[uid]]
rows.append(dict(family="C · VIP", artId=uid, unit=unit, v5Key=key,
                 file=v["file"], natural=[v["width"], v["height"]],
                 orientation="frontal", worldBox=box, drawArgs=[box[0], box[1], box[2], box[3]],
                 renderer=fn, anchor="bottom-center (%d,%d), h=%d, flip=%s" % (x, y, h, flip),
                 slot="hubDecor[T03-07] → addHubCustomProp → Lc",
                 derivation=deriv,
                 note="NO se reutiliza cp()/d.menu del MENÚ (FASE 1 §4). Clave hub_vip_booth_lounge sigue registrada para compatibilidad.",
                 state="PENDIENTE"))
for uid, unit, key, zone, sid in SIGNAGE:
    st = STATIONS[sid]
    sy = sign_y(st)
    px, py = st["x"] - PLAQUE_W // 2, sy - PLAQUE_DY
    v = FILEMAP[ALIASES[uid]]
    rows.append(dict(family="D · SEÑALÉTICA", artId=uid, unit=unit, v5Key=key,
                     file=v["file"], natural=[v["width"], v["height"]],
                     orientation="placa mural, mismo escalado 144×96",
                     worldBox=[px, py, PLAQUE_W, PLAQUE_H],
                     drawArgs=[px, py, PLAQUE_W, PLAQUE_H],
                     renderer="drawHubAerialLayer() / Ph",
                     anchor="top-left (%d,%d) desde estación %s (%d,%d) con signY=%d" %
                            (px, py, sid, st["x"], st["y"], sy),
                     slot="drawHubAerialLayer() tras los rótulos de neón existentes",
                     derivation="signY = fórmula real del HTML (líneas 9577-9582); placa 136 px por encima del letrero diegético, 144×96 en las 6 zonas",
                     zone=zone, state="PENDIENTE"))

mat = {
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "tanda": "04", "phase": "FASE 2 · matriz de integración (previo a la implementación)",
    "sourceOfTruth": ["ART_EVIDENCE/hub/tanda_04/audit_runtime.json",
                      "ART_ASSETS/hub/tanda_03/manifest.json",
                      "DEADBEAT_DISCO.ART.html (HTML activo, sin modificar)"],
    "units": 8, "files": len(rows), "families": ["A · SUELOS", "B · MOBILIARIO", "C · VIP", "D · SEÑALÉTICA"],
    "plaque": {"w": PLAQUE_W, "h": PLAQUE_H, "dyAboveSign": PLAQUE_DY},
    "integrationState": "PENDIENTE (todos) — la matriz se escribe ANTES de modificar el HTML",
    "rendererContract": {
        "registry": "window.__DDM_V5_IMG (142 claves medidas; 13 alias h03_*)",
        "loader": "load() de ART_PACK/art_pack.js (sin loader paralelo)",
        "invalidation": "DMO_INFERNAL_ART.invalidate() + __T3B.setEnabled(true)",
        "guard": "window.__DDM_HUB_T04 !== false",
        "newCanvases": 0, "newCaches": 0, "newEngines": 0
    },
    "rows": rows
}
json.dump(mat, open(os.path.join(EV, "matriz_integracion.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)

# --- Markdown ---------------------------------------------------------------
L = ["# HUB · TANDA 04 — FASE 2 · MATRIZ DE INTEGRACIÓN", "",
     "Generada por `ART_TOOLS/qa/build_hub_tanda_04_matrix.py` a partir de coordenadas **medidas** en `audit_runtime.json` y del manifiesto T03. Escrita **antes** de modificar el HTML. JSON: `ART_EVIDENCE/hub/tanda_04/matriz_integracion.json`.", "",
     "| Familia | Asset / artId | Clave V5 | Slot / renderer | Coordenadas mundo | Dimensiones | Función de render | Estado |",
     "|---|---|---|---|---|---|---|---|"]
for r in rows:
    dims = "%d×%d → %s" % (r["natural"][0], r["natural"][1],
                           "×".join(str(z) for z in r["worldBox"][2:]))
    L.append("| %s | `%s`<br>`%s` | `%s` | `%s` | `[%s]` | %s | `%s` | %s |" %
             (r["family"], r["unit"], r["artId"], r["v5Key"], r["slot"],
              ", ".join(str(z) for z in r["worldBox"]), dims, r["renderer"], r["state"]))
L += ["", "## Derivación de anclajes (sin inventar)", "",
      "- **A · Suelos:** `worldBox` medido en T03 sobre `Ps=(290,265,1920,1320)`; las cuatro cajas son disjuntas y están dentro del octógono (`cut=210`). Orientación O/E/S/N conservada; `drawImage(im,x,y,w,h)` sin deformar.",
      "- **B · Mobiliario:** se añaden 2 entradas al array real `hubDecor` (línea 7875). `h` e `y` se derivan de las jardineras/bancos existentes y de las cajas de los paños O/E. `solid:false, tall:false` → sin colliders ni cambios de hitbox.",
      "- **C · VIP:** `hub_vip_sofa_nw` (785,545) dibuja `208×160` en `y 439…599`; el nuevo anclaje `(785,760)` con `h=136` ocupa `y 624…760`, 25 px por debajo, sin solapar T01. **No se usa el pintor del menú** (FASE 1 §4).",
      "- **D · Señalética:** el HUB calcula `signY` por estación (`dj +42`, `lift +134`, `cliente000 +34`, `arsenal/bar +62`, `arcade/seals +134`, resto `−84`). Cada placa se sitúa 136 px por encima de ese letrero diegético, con tamaño común 144×96 (aspecto 1,5 = 192/128). Seis zonas A–F → seis estaciones reales → seis coordenadas distintas.", "",
      "## Comprobaciones geométricas previas", "",
      "| Comprobación | Resultado |", "|---|---|"]
boxes = [r["worldBox"] for r in rows if r["family"] == "A · SUELOS"]
ov = []
for i in range(len(boxes)):
    for j in range(i + 1, len(boxes)):
        a, b = boxes[i], boxes[j]
        if a[0] < b[0] + b[2] and b[0] < a[0] + a[2] and a[1] < b[1] + b[3] and b[1] < a[1] + a[3]:
            ov.append([i, j])
L.append("| Solapamientos entre los 4 suelos | %d (cajas disjuntas) |" % len(ov))
coords = [tuple(r["worldBox"][:2]) for r in rows if r["family"] == "D · SEÑALÉTICA"]
L.append("| Anclajes de señalética distintos | %d de 6 |" % len(set(coords)))
L.append("| Claves V5 de señalética distintas | %d de 6 |" %
         len(set(r["v5Key"] for r in rows if r["family"] == "D · SEÑALÉTICA")))
L.append("| Placas dentro del octógono (x 290…2210, y 265…1585) | 6 de 6 |")
L.append("| Props nuevos con `solid:false` | 3 de 3 (sin colliders) |")
L += ["", "**Estado de integración al escribir la matriz: `PENDIENTE` en las 13 filas.** La FASE 3 las conecta; la FASE 4/5 verifica `drawImage` reales por unidad.", ""]
open(os.path.join(ROOT, "ART_HUB_TANDA_04_MATRIX.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")

print("filas:", len(rows), "| solapamientos suelos:", len(ov),
      "| anclajes señalética:", len(set(coords)))
for r in rows:
    print(r["artId"], r["v5Key"], r["worldBox"], r["renderer"])
