#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEADBEAT DISCO — inventario de arte clasificado A–E.

Fuente de verdad: docs/ART_REBUILD/AUDIT_CLASSIFICATION.json  (id -> clase, motivo, tanda).
Este script:
    init    crea/actualiza la clasificación a partir del inventario maestro, del
            registro y de las reglas de la auditoría (no pisa lo ya marcado como E);
    render  escribe docs/ART_REBUILD/AUDIT_INVENTORY.md (tablas por familia).

`batch.py mark` pasa a clase E los assets de una tanda validada en el juego.

Escala:
    A  Conservar          ilustración al nivel objetivo, sin defectos.
    B  Rehacer (estilo)   funciona, pero es pixel art / paleta reducida o no sigue las guías.
    C  Falta              no hay arte de la línea nueva: el juego muestra el sprite heredado.
    D  Defectuoso         defecto visible en el propio archivo (damero horneado, huecos,
                          fotograma basura, identidad distinta, halo). Prioridad en su familia.
    E  Rehecho            sustituido en esta reconstrucción y validado dentro del juego.
"""
from __future__ import annotations

import collections
import datetime as _dt
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
INV = os.path.join(ROOT, "docs", "ART_REBUILD", "MASTER_INVENTORY.json")
REG = os.path.join(ROOT, "src", "dd_asset_registry.js")
OUT_JSON = os.path.join(ROOT, "docs", "ART_REBUILD", "AUDIT_CLASSIFICATION.json")
OUT_MD = os.path.join(ROOT, "docs", "ART_REBUILD", "AUDIT_INVENTORY.md")

SCALE = collections.OrderedDict([
    ("A", "Conservar: ilustración al nivel objetivo, sin defectos visibles."),
    ("B", "Rehacer por estilo: funciona, pero es pixel art / paleta reducida o no sigue las guías de referencia."),
    ("C", "Falta: no existe arte de la línea nueva; el juego muestra el sprite heredado del motor."),
    ("D", "Defectuoso: defecto visible en el archivo (damero horneado, huecos, fotograma basura, identidad distinta, halo)."),
    ("E", "Rehecho: sustituido en esta reconstrucción y validado dentro del juego."),
])

CHECKER = "damero de transparencia o huecos blancos horneados en la imagen"
GARBAGE = "fotograma basura: no representa al personaje de su familia"
DRIFT = "identidad distinta de la del resto de fotogramas de su familia"
HALO = "halo / flecos claros alrededor de la silueta"
PIXEL = "pixel art de paleta reducida; no sigue el acabado de ilustración de las guías"
BOARD = "lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos"

DEFECTS = {
    "enemy_dancer_attack": CHECKER, "enemy_security_attack": CHECKER, "enemy_fanatic_attack": CHECKER,
    "enemy_elite_attack": GARBAGE, "enemy_security_windup": DRIFT,
    "enemy_chef_walk": DRIFT, "enemy_chef_windup": DRIFT, "enemy_chef_attack": DRIFT, "enemy_chef_death": DRIFT,
    "boss_04_pogo_attack": CHECKER, "boss_06_matarife_attack": CHECKER, "boss_09_nucleo_attack": CHECKER,
    "boss_03_cajero_hit": GARBAGE, "boss_03_cajero_attack": GARBAGE, "boss_05_oficiante_hit": GARBAGE,
    "boss_09_nucleo_hit": GARBAGE, "boss_04_pogo_idle": GARBAGE, "boss_08_traidor_idle": GARBAGE,
    "boss_02_bufe_hit": DRIFT,
    "door_gothic_closed": CHECKER, "door_gothic_open": CHECKER, "wall_panel_gothic_niche": CHECKER,
    "portal_avaricia_gold": HALO, "ui_victory_emblem": HALO,
    "npc_dj_booth_world": "no coincide con el retrato dialogue_portrait_dj (otro personaje)",
}
KEEP = {
    "logo_deadbeat_graffiti", "emblem_fox_crown", "menu_main_backdrop", "menu_main_backdrop_a", "hud_portrait_protagonist",
    "dialogue_portrait_dj", "map_infernal_tower", "ui_defeat_emblem", "ui_shop_emblem", "logo_deadbeat_cinematic",
    "overlay_vignette_gothic", "effect_anamorphic_flare", "effect_dust_particles",
}
BATCH_OF = [
    (r"^enemy_", "R02_ENEMIGOS"), (r"^boss_", "R03_JEFES"), (r"^npc_|^companion_", "R04_PNJ_Y_HUD"),
    (r"^hud_|^ui_", "R04_PNJ_Y_HUD"), (r"^weapon_", "R05_ARMAS"), (r"^pickup_|^relic_", "R06_RECOGIBLES"),
    (r"^proj_|^vfx_", "R07_EFECTOS"), (r"^prop_", "R08_MOBILIARIO"), (r"^wall_|^door_|^portal_|^threshold_", "R09_ARQUITECTURA"),
    (r"^cine_", "R10_CINEMATICA"),
]


def now_iso():
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_registry():
    line = open(REG, encoding="utf-8").read().split("\n")[3]
    return json.loads(re.search(r"=\s*(\{.*\});?\s*$", line).group(1))["entries"]


def planned_batch(aid):
    for rx, b in BATCH_OF:
        if re.search(rx, aid):
            return b
    return None


def classify(aid, category, exists):
    if not exists:
        return "C", "sin arte de la línea nueva: se ve el sprite heredado del motor"
    if aid in DEFECTS:
        return "D", DEFECTS[aid]
    if re.match(r"^cine_bg0[1-6]_", aid) or re.match(r"^cine_bg0[1-6]_[a-z_]+$", aid) and category == "cinematics":
        return "D", BOARD
    if aid in KEEP or category in ("floors",):
        return "A", "ilustración sin defectos visibles"
    if category == "cinematics":
        return "B", "tarjeta de 960×540 (1280×720 la de entrada) con acabado pixelado; se amplía a pantalla completa"
    return "B", PIXEL


def cmd_init():
    inv = json.load(open(INV, encoding="utf-8"))
    reg = load_registry()
    prev = json.load(open(OUT_JSON, encoding="utf-8")) if os.path.exists(OUT_JSON) else {"assets": {}}
    out = collections.OrderedDict()
    rows = [(a["id"], a["category"], a["location"], a.get("art_revision")) for a in inv["assets"]]
    inv_ids = {a["id"] for a in inv["assets"]}
    rows += [(k, v["category"], v["src"], v.get("rev")) for k, v in reg.items() if k not in inv_ids]
    for aid, cat, loc, rev in rows:
        old = prev["assets"].get(aid)
        if old and old.get("class") == "E":
            out[aid] = old
            continue
        cls, why = classify(aid, cat, os.path.exists(os.path.join(ROOT, loc)))
        rec = collections.OrderedDict([("class", cls), ("category", cat), ("path", loc), ("why", why)])
        if rev:
            rec["class"] = "E" if (old and old.get("class") == "E") else "E?"
            rec["why"] = "arte de la tanda %s; pendiente de marcar como validado" % rev
            rec["batch"] = rev
        else:
            pb = planned_batch(aid)
            if pb and cls != "A":
                rec["batch"] = pb
        out[aid] = rec
    doc = collections.OrderedDict([("scale", SCALE), ("updated_at", now_iso()), ("total", len(out)), ("assets", out)])
    json.dump(doc, open(OUT_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("clasificados", len(out), dict(collections.Counter(v["class"] for v in out.values())))


def cmd_render():
    doc = json.load(open(OUT_JSON, encoding="utf-8"))
    assets = doc["assets"]
    by_cat = collections.defaultdict(list)
    for aid, r in assets.items():
        by_cat[r["category"]].append((aid, r))
    order = ["characters", "enemies", "bosses", "weapons", "pickups", "effects", "props", "floors", "walls", "environments",
             "ui", "logos", "cinematics", "overlays"]
    cats = [c for c in order if c in by_cat] + sorted(c for c in by_cat if c not in order)
    L = []
    L.append("# Inventario de arte clasificado A–E")
    L.append("")
    L.append("> Generado por `tools/art_master/audit_report.py render` a partir de `AUDIT_CLASSIFICATION.json` (%s). No editar a mano." % doc["updated_at"])
    L.append("")
    L.append("| Clase | Significado |")
    L.append("|---|---|")
    for k, v in doc["scale"].items():
        L.append("| **%s** | %s |" % (k, v))
    L.append("")
    L.append("## Resumen por familia")
    L.append("")
    L.append("| Familia | Total | A | B | C | D | E |")
    L.append("|---|---:|---:|---:|---:|---:|---:|")
    tot = collections.Counter()
    for c in cats:
        cnt = collections.Counter(r["class"] for _, r in by_cat[c])
        tot.update(cnt)
        L.append("| `%s` | %d | %d | %d | %d | %d | %d |" % (c, len(by_cat[c]), cnt["A"], cnt["B"], cnt["C"], cnt["D"], cnt["E"]))
    L.append("| **Total** | **%d** | **%d** | **%d** | **%d** | **%d** | **%d** |" % (len(assets), tot["A"], tot["B"], tot["C"], tot["D"], tot["E"]))
    L.append("")
    for c in cats:
        L.append("## `%s` (%d)" % (c, len(by_cat[c])))
        L.append("")
        rows = by_cat[c]
        # Las faltas de armas son 105 filas idénticas: se resumen en una lista compacta.
        missing = [(a, r) for a, r in rows if r["class"] == "C"]
        rest = [(a, r) for a, r in rows if r["class"] != "C"]
        if rest:
            L.append("| ID | Clase | Motivo | Tanda |")
            L.append("|---|:---:|---|---|")
            for aid, r in sorted(rest, key=lambda x: ("DBAE".index(x[1]["class"]) if x[1]["class"] in "DBAE" else 9, x[0])):
                L.append("| `%s` | **%s** | %s | %s |" % (aid, r["class"], r["why"], ("`%s`" % r["batch"]) if r.get("batch") else "—"))
            L.append("")
        if missing:
            L.append("**Clase C — %d sin arte nuevo** (tanda `%s`): %s" % (len(missing), missing[0][1].get("batch", "—"),
                                                                          ", ".join("`%s`" % a for a, _ in missing)))
            L.append("")
    open(OUT_MD, "w", encoding="utf-8").write("\n".join(L) + "\n")
    print("escrito", os.path.relpath(OUT_MD, ROOT), "·", dict(tot))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "render"
    if cmd == "init":
        cmd_init()
    elif cmd == "render":
        cmd_render()
    else:
        raise SystemExit(__doc__)
