#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HUB · TANDA 04 — FASE 3 · aplicación mínima y reversible sobre el HTML.

Conecta los 13 PNG ya registrados por TANDA 03 a los renderers existentes del
HUB. Tres inserciones localizadas, todas entre marcadores TANDA04:BEGIN/END y
detrás de un único flag `window.__DDM_HUB_T04` (activo por defecto).

  A) `hubDecor`  → 3 props nuevos con solid:false (renderer de props Lc).
  B) `drawHubFloorLayer()` → 4 paños de suelo (hook Wf).
  C) `drawHubAerialLayer()` → 6 placas de señalética (hook Ph).

No crea motor, canvas, caché, loader ni sistema de dibujo independiente.
No toca gameplay, colisiones, geometría, puertas, estaciones, música, HUD,
guardado, progresión ni IA.

Idempotente: si los marcadores ya están, no vuelve a aplicar. Con --restore
elimina exactamente los tres bloques y devuelve el HTML a su estado anterior.

Uso:  python3 ART_TOOLS/qa/apply_hub_tanda_04_html.py [--restore]
"""
from __future__ import annotations

import hashlib
import shutil
import sys

ROOT = "/home/user/DEADBEAT-DISCOnew"
HTML = ROOT + "/DEADBEAT_DISCO.ART.html"
BACKUP = "/tmp/t4/DEADBEAT_DISCO.ART.PRE_T04.html"

# ---------------------------------------------------------------- A ---------
A_OLD = '''          { id: "hub_decor_cooler_w", slot: "club_water_cooler_prop", x: 452, y: 692, h: 104, flip: false },
          { id: "hub_decor_vending_e", slot: "club_vending_machine_prop", x: 2048, y: 692, h: 118, flip: true }
        ];
        for (const dc of hubDecor) {
          addHubCustomProp({
            id: dc.id, kind: "circle", x: dc.x, y: dc.y, r: 10, solid: false, tall: false, sortY: dc.y,
            hubDraw: function (ctx, p) {
              const im = V5D(dc.slot);
              if (!im) return;
              ctx.save(); ctx.imageSmoothingEnabled = false;
'''
A_NEW = '''          { id: "hub_decor_cooler_w", slot: "club_water_cooler_prop", x: 452, y: 692, h: 104, flip: false },
          { id: "hub_decor_vending_e", slot: "club_vending_machine_prop", x: 2048, y: 692, h: 118, flip: true },
          /* === TANDA04:BEGIN · 3 anclajes derivados (FASE 2) · solid:false ===
             T03-05 / T03-06 / T03-07 conectados al renderer de props YA existente
             (hubDecor -> addHubCustomProp -> Lc). solid:false => sin colliders,
             sin cambios de hitbox ni de geometría. Reversible con el flag
             window.__DDM_HUB_T04. Ver ART_HUB_TANDA_04_AUDIT.md / _MATRIX.md. */
          { id: "hub_decor_planter_v02", slot: "h03_planter_variant_02", x: 452, y: 900, h: 88, flip: false, t04: "T03-05" },
          { id: "hub_decor_bench_v02",   slot: "h03_bench_variant_02",   x: 2048, y: 900, h: 74, flip: true,  t04: "T03-06" },
          { id: "hub_decor_vip_lounge",  slot: "h03_vip_booth_lounge",   x: 785, y: 760, h: 136, flip: false, t04: "T03-07" }
          /* === TANDA04:END === */
        ];
        for (const dc of hubDecor) {
          addHubCustomProp({
            id: dc.id, kind: "circle", x: dc.x, y: dc.y, r: 10, solid: false, tall: false, sortY: dc.y,
            hubDraw: function (ctx, p) {
              /* TANDA04:BEGIN · reversibilidad A/B sin reconstruir el motor */
              if (dc.t04 && window.__DDM_HUB_T04 === false) return;
              /* TANDA04:END */
              const im = V5D(dc.slot);
              if (!im) return;
              ctx.save(); ctx.imageSmoothingEnabled = !!dc.t04; /* TANDA04: arte pintado, no pixel art */
'''

# ---------------------------------------------------------------- B ---------
B_OLD = '''        if (hubCachedFloorCv) {
          __t3bHubDraws++; g.drawImage(hubCachedFloorCv, 290, 265);
        }
'''
B_NEW = '''        if (hubCachedFloorCv) {
          __t3bHubDraws++; g.drawImage(hubCachedFloorCv, 290, 265);
        }

        /* === TANDA04:BEGIN · Familia A: 4 panos de suelo (FASE 2/3) ===
           Renderer de SUELO existente (hook Wf), sobre la capa cacheada
           1920x1320 en (290,265) y antes del medallón. Cajas mundo MEDIDAS
           en manifest T03, disjuntas y dentro del octógono; orientacion
           O/E/S/N conservada. Sin cache nueva ni canvas alternativo. */
        if (window.__DDM_HUB_T04 !== false) {
          const t04Floors = [
            ["h03_floor_patch_o",        290,  720, 580, 430],
            ["h03_floor_patch_e",       1630,  720, 580, 430],
            ["h03_floor_patch_s_crack",  870, 1256, 760, 329],
            ["h03_floor_north_dj",       870,  265, 760, 224]
          ];
          const t04SmoothFloor = g.imageSmoothingEnabled;
          g.imageSmoothingEnabled = true;
          for (const f of t04Floors) {
            const im = window.__DDM_V5_IMG && window.__DDM_V5_IMG[f[0]];
            if (im && im.complete && im.naturalWidth > 0) g.drawImage(im, f[1], f[2], f[3], f[4]);
          }
          g.imageSmoothingEnabled = t04SmoothFloor;
        }
        /* === TANDA04:END === */
'''

# ---------------------------------------------------------------- C ---------
C_OLD = '''        g.restore();

        const nearest = (!hub.modalOpen && !hub.invasion.active && !hub.invasion.warningActive)
'''
C_NEW = '''        g.restore();

        /* === TANDA04:BEGIN · Familia D: 6 placas diegeticas (FASE 2/3) ===
           Anclajes derivados del signY REAL de 6 estaciones medidas; misma
           escala 144x96 en las 6 zonas A-F y ninguna oculta, porque esta capa
           se dibuja DESPUES de los props. Claves V5 ya registradas por T03. */
        if (window.__DDM_HUB_T04 !== false) {
          const t04Signs = [
            ["h03_zone_signage_a",  958,  565],
            ["h03_zone_signage_b", 1178,  431],
            ["h03_zone_signage_c", 1178, 1363],
            ["h03_zone_signage_d",  633,  781],
            ["h03_zone_signage_e", 1718,  781],
            ["h03_zone_signage_f",  583, 1133]
          ];
          const t04SmoothSign = g.imageSmoothingEnabled;
          g.imageSmoothingEnabled = true;
          for (const s of t04Signs) {
            const im = window.__DDM_V5_IMG && window.__DDM_V5_IMG[s[0]];
            if (im && im.complete && im.naturalWidth > 0) g.drawImage(im, s[1], s[2], 144, 96);
          }
          g.imageSmoothingEnabled = t04SmoothSign;
        }
        /* === TANDA04:END === */

        const nearest = (!hub.modalOpen && !hub.invasion.active && !hub.invasion.warningActive)
'''

PAIRS = [("A · hubDecor", A_OLD, A_NEW),
         ("B · drawHubFloorLayer", B_OLD, B_NEW),
         ("C · drawHubAerialLayer", C_OLD, C_NEW)]


def sha(b):
    return hashlib.sha256(b).hexdigest()


def main() -> None:
    data = open(HTML, "rb").read()
    text = data.decode("utf-8")
    restore = "--restore" in sys.argv
    print("SHA antes:", sha(data), "| bytes:", len(data))

    if restore:
        for name, old, new in PAIRS:
            assert text.count(new) == 1, "%s: bloque T04 no unico" % name
            text = text.replace(new, old, 1)
        out = text.encode("utf-8")
        open(HTML, "wb").write(out)
        print("RESTAURADO. SHA:", sha(out), "| bytes:", len(out))
        return

    if "TANDA04:BEGIN" in text:
        print("Ya aplicado (idempotente); no se modifica nada.")
        return
    shutil.copyfile(HTML, BACKUP)
    for name, old, new in PAIRS:
        n = text.count(old)
        assert n == 1, "%s: ancla encontrada %d veces (esperada 1)" % (name, n)
        text = text.replace(old, new, 1)
        print("aplicado", name)
    out = text.encode("utf-8")
    open(HTML, "wb").write(out)
    assert text.count("TANDA04:BEGIN") == 4, "marcadores inesperados"  # A tiene 2, B y C 1 cada uno
    print("SHA despues:", sha(out), "| bytes:", len(out), "| delta:", len(out) - len(data))
    print("backup:", BACKUP)


if __name__ == "__main__":
    main()
