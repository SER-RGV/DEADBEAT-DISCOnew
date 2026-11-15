#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEADBEAT DISCO — contrato de animación (FASE 02 §4), DERIVADO del registro real.

    anim_contract.py            escribe docs/ART_REBUILD/ANIMATION_CONTRACT.json
    anim_contract.py --check    sólo valida (código de salida 1 si hay incumplimientos)

Qué es: la descripción, por entidad y estado, de qué id del registro dibuja el
motor, cuántos fotogramas tiene de verdad (casi siempre UNO), qué reloj lo
mueve (procedimental) y qué anclas usa. No inventa spritesheets: el proyecto
anima por ESTADO + movimiento procedimental (zancada, balanceo, respiración,
destello, colapso) sobre un fotograma por estado; la única secuencia real de
varios fotogramas es la caminata del protagonista (player_walk_00..03, 8 fps).

Fuentes de verdad (si cambian, este script debe cambiar con ellas):
  · src/dd_asset_registry.js        ids, anchors, rev  (MANIFEST)
  · src/dd_world_renderer.js        ENEMY_STATE_ASSET, BOSS_STATE_ASSET,
                                    PLAYER_POSE_TO_ID, PLAYER_AIM_SECTORS,
                                    drawEnemy / drawEnemyDeath / drawBoss / drawPickup
  · tools/build_active_html.py      ddEnemyView / ddBossView (estado por enemigo)
  · motor (backups/*.ORIGINAL.html) relojes: ye.animT += dt·(8|2); t.animT += 4·dt;
                                    player_walk + floor(8·Z) % 4

Reglas que valida (--check):
  R1  cada estado declarado existe en el registro y su archivo existe en disco;
  R2  todos los estados de una familia/jefe comparten `rev` con su fotograma base
      (walk / idle): el renderizador no mezcla generaciones de arte;
  R3  los fotogramas de figura traen anchors.foot y anchors.unit (contrato de lienzo);
  R4  los 4 fotogramas de caminar del protagonista existen y miden lo mismo.
"""
from __future__ import annotations

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
REG = os.path.join(ROOT, "src", "dd_asset_registry.js")
OUT = os.path.join(ROOT, "docs", "ART_REBUILD", "ANIMATION_CONTRACT.json")
MANIFEST_RE = re.compile(r"^(\s*const MANIFEST = )(\{.*\})(;\s*)$")

ENEMY_FAMILIES = ["security", "dancer", "fanatic", "drone", "chef", "elite"]
ENEMY_STATES = ["walk", "windup", "attack", "hit", "death"]
BOSS_SLUGS = ["boss_00_anden", "boss_01_magneta", "boss_02_bufe", "boss_03_cajero", "boss_04_pogo",
              "boss_05_oficiante", "boss_06_matarife", "boss_07_imitador", "boss_08_traidor",
              "boss_09_nucleo", "boss_10_arquitecto"]
BOSS_STATES = ["idle", "attack", "hit", "death"]
# Estados que NO existen por contrato (R03: el jefe secreto sólo tiene reposo y ataque; el
# renderizador dibuja el reposo con la señal procedimental). No cuentan como incumplimiento.
BOSS_STATE_EXEMPT = {("boss_10_arquitecto", "hit"), ("boss_10_arquitecto", "death")}
# Multiplicador del reloj de zancada que aplica el puente (ddEnemyView.phase) por tipo del motor.
ENEMY_PHASE_MULT = {"tank(chef)": 1.2, "sprinter(fanatic)": 3.4, "otros": 2.0}

PLAYER_POSES = {
    "player_idle": ["player_idle_00"],
    "player_walk": ["player_walk_00", "player_walk_01", "player_walk_02", "player_walk_03"],
    "player_fire": ["player_shoot_00"],
    "player_fire2": ["player_fire2"],
    "player_firehip": ["player_firehip"],
    "player_hit": ["player_hurt_00"],
    "player_roll": ["player_roll_00"],
    "player_death": ["player_death_00"],
    "player_boost": ["player_boost_00"],
}
PLAYER_AIM = [("+72..+90", "player_aim_up_03"), ("+47..+72", "player_aim_up_02"), ("+19..+47", "player_aim_up_01"),
              ("-15..+19", "player_shoot_00"), ("-41..-15", "player_aim_down_01"), ("-70..-41", "player_aim_down_02"),
              ("-90..-70", "player_aim_down_03")]
PLAYER_SPLIT_OVERLAY = {"player_firehip": "player_firehip_arms", "player_aim_down_02": "player_aim_down_02_arms",
                        "player_aim_down_03": "player_aim_down_03_arms"}
PICKUPS = ["pickup_heart_00", "pickup_ammo_00", "pickup_bomb_00", "pickup_boost_00", "pickup_shield_00",
           "pickup_damageup_00", "pickup_fireup_00", "pickup_speedup_00", "pickup_turret_00",
           "pickup_companion_00", "pickup_mutation_00", "pickup_credits_00",
           "relic_needle", "relic_lowpass", "relic_magnet", "relic_pact", "relic_echo", "relic_coil",
           "relic_prism", "relic_tempo"]


def read_manifest():
    for line in open(REG, encoding="utf-8"):
        m = MANIFEST_RE.match(line.rstrip("\n"))
        if m:
            return json.loads(m.group(2))
    raise SystemExit("No se encontró MANIFEST en " + REG)


def frame_record(entries, aid, problems, need_anchors):
    e = entries.get(aid)
    if not e:
        problems.append("R1 %s: no está en el registro" % aid)
        return {"id": aid, "registered": False}
    path = os.path.join(ROOT, e["src"])
    rec = {"id": aid, "registered": True, "src": e["src"], "w": e["w"], "h": e["h"], "rev": e.get("rev"),
           "frames": 1, "anchors": e.get("anchors")}
    if not os.path.exists(path):
        problems.append("R1 %s: falta el archivo %s" % (aid, e["src"]))
        rec["file"] = "MISSING"
    if need_anchors:
        a = e.get("anchors") or {}
        if not (isinstance(a.get("foot"), list) and isinstance(a.get("unit"), (int, float))):
            problems.append("R3 %s: sin anchors.foot/unit" % aid)
    return rec


def build():
    man = read_manifest()
    entries = man["entries"]
    problems = []
    doc = {
        "schema": "dd-animation-contract/1",
        "generated_from": {"registry": "src/dd_asset_registry.js", "cache_version": None,
                           "renderer": "src/dd_world_renderer.js", "bridge": "tools/build_active_html.py"},
        "model": {
            "kind": "state-frame + procedural",
            "summary": "Un PNG por estado. El puente decide el estado por entidad; el renderizador elige el id "
                       "<entidad>_<estado>, lo apoya en anchors.foot a la altura anchors.unit y añade el movimiento "
                       "(zancada, balanceo, respiración, destello, colapso). No hay atlas ni controlador de fotogramas; "
                       "la única secuencia multi-fotograma real es player_walk_00..03.",
            "canvas_contract": {
                "foot": "[u,v] punto de apoyo en el suelo, fracción del lienzo",
                "unit": "fracción del alto del lienzo que mide la figura de referencia (walk/idle erguido); "
                        "los estados de una familia comparten escala: unit × alto = mismos px en todos",
                "pivot": "anchors.foot (figuras) · center (objetos)",
                "legacy": "sin anclas → pivote abajo-centro y figura al 86 % del lienzo",
            },
            "no_mixing_rule": "si el fotograma de un estado no comparte `rev` con el base (walk/idle), se dibuja el base "
                              "con señal procedimental (inclinación, destello, colapso).",
        },
        "clocks": {
            "player.animT": "+= dt × (8 si se mueve, 2 parado)  [motor]",
            "player.walk_frame": "player_walk_0{floor(8·Z) mod 4}: 4 fotogramas a 8 fps  [motor, Z = reloj de juego en s]",
            "enemy.animT": "+= 4 × dt  [motor]; view.phase = animT × mult (tank 1.2 · sprinter 3.4 · resto 2.0)  [puente]",
            "enemy.stride": "cyc = phase × π/2 → una zancada completa cada 4 unidades de fase; sólo si velocidad > 14 px/s",
            "enemy.breath": "parado: sy = 1 + 0.012·sin(2.6·t + 0.05·x)",
            "boss.motion": "balanceo sólo con desplazamiento real; entrada: alpha 0.25→1, escala 0.78→1",
            "pickup.bob": "sin(4.5·t + 0.03·x) × 4 px; halo cian #22d3ee; sombra en y+14",
        },
        "procedural": {
            "enemy": {
                "walk_moving": {"bob": "-|sin(cyc)| × 2.6 × (figH/88)", "tilt": "sin(cyc) × 0.035 rad"},
                "hit": {"window_s": 0.12, "tilt": "-0.10·n", "scale": "(1+0.05·n, 1-0.07·n)",
                        "flash": "tope 0.5, caída cuadrática en 0.14 s"},
                "windup_fallback": {"tilt": -0.15, "scale": [1.04, 0.96]},
                "attack_fallback": {"tilt": 0.2, "scale": [0.97, 1.04], "bob": "-2·k"},
                "death": {"duration_s_default": 0.38, "back_px": "14 × (figH/88) con easing cuadrático",
                          "fade": "desde el 55 % de la duración", "flash": "primer 18 %",
                          "fallback_without_frame": {"rotate": -0.09, "scale": "(1+0.16·e, max(0.24, 1-0.62·e))"}},
                "variant_rim": {"keys": ["blindado", "incendiario", "criogenico", "conductivo", "toxico", "espectral", "caotico"],
                                "pulse": "alpha × (0.8 + 0.2·sin(4·t + 0.03·x))"},
            },
            "boss": {"flash_cap": 0.36, "states_map": {"idle": "idle", "attack": "attack", "recover": "hit",
                                                        "hit": "hit", "death": "death"}},
        },
        "entities": {},
    }
    # versión de caché
    for line in open(REG, encoding="utf-8"):
        m = re.search(r"ASSET_CACHE_VERSION\s*=.*?[\"'](\d{8}\.\d+)[\"']", line)
        if m:
            doc["generated_from"]["cache_version"] = m.group(1)
            break

    # --- protagonista
    player = {"driver": "resolvePlayerPose (renderer) ← pAnim.upperPose/lowerPose (motor, PLAYER_POSE_TO_ID)",
              "poses": {}, "aim_sectors": [], "split_overlays": {}, "hero_walk_full": []}
    for pose, ids in PLAYER_POSES.items():
        recs = [frame_record(entries, i, problems, False) for i in ids]
        player["poses"][pose] = {"frames": len(ids), "fps": 8 if pose == "player_walk" else None,
                                 "loop": pose == "player_walk", "ids": recs}
    sizes = {(r.get("w"), r.get("h")) for r in player["poses"]["player_walk"]["ids"] if r.get("registered")}
    if len(sizes) != 1 or len(player["poses"]["player_walk"]["ids"]) != 4:
        problems.append("R4 player_walk_00..03: faltan fotogramas o tamaños distintos %s" % sorted(sizes))
    for rng, aid in PLAYER_AIM:
        player["aim_sectors"].append({"elevation_deg": rng, "id": aid, "registered": aid in entries})
    for up, ov in PLAYER_SPLIT_OVERLAY.items():
        player["split_overlays"][up] = {"overlay": ov, "registered": ov in entries}
    for i in range(4):
        hid = "hero_walk_0%d" % i
        player["hero_walk_full"].append({"id": hid, "registered": hid in entries})
    doc["entities"]["player"] = player

    # --- enemigos
    enemies = {"driver": "ddEnemyView (puente) → DD_WORLD.drawEnemy / drawEnemyDeath (renderer)",
               "state_assets": {s: "enemy_<fam>_" + s for s in ENEMY_STATES},
               "phase_mult": ENEMY_PHASE_MULT, "families": {}}
    for fam in ENEMY_FAMILIES:
        base = entries.get("enemy_%s_walk" % fam) or {}
        fam_rec = {"base": "enemy_%s_walk" % fam, "rev": base.get("rev"), "states": {}}
        for st in ENEMY_STATES:
            aid = "enemy_%s_%s" % (fam, st)
            rec = frame_record(entries, aid, problems, True)
            rec["loop"] = st == "walk"
            rec["dedicated"] = bool(rec.get("registered") and rec.get("rev") == base.get("rev") and rec.get("anchors"))
            if rec.get("registered") and rec.get("rev") != base.get("rev"):
                problems.append("R2 %s: rev %s ≠ base %s" % (aid, rec.get("rev"), base.get("rev")))
            fam_rec["states"][st] = rec
        enemies["families"][fam] = fam_rec
    doc["entities"]["enemies"] = enemies

    # --- jefes
    bosses = {"driver": "ddBossView (puente) → DD_WORLD.drawBoss (renderer)", "slugs": {}}
    for slug in BOSS_SLUGS:
        base = entries.get(slug + "_idle") or {}
        b = {"base": slug + "_idle", "rev": base.get("rev"), "states": {}}
        for st in BOSS_STATES:
            aid = slug + "_" + st
            if (slug, st) in BOSS_STATE_EXEMPT and aid not in entries:
                b["states"][st] = {"id": aid, "registered": False, "fallback": slug + "_idle",
                                   "note": "sin fotograma por contrato R03: reposo + señal procedimental"}
                continue
            rec = frame_record(entries, aid, problems, True)
            rec["loop"] = st == "idle"
            rec["dedicated"] = bool(rec.get("registered") and rec.get("rev") == base.get("rev") and rec.get("anchors"))
            if rec.get("registered") and rec.get("rev") != base.get("rev"):
                problems.append("R2 %s: rev %s ≠ base %s" % (aid, rec.get("rev"), base.get("rev")))
            b["states"][st] = rec
        bosses["slugs"][slug] = b
    doc["entities"]["bosses"] = bosses

    # --- objetos
    pk = {"driver": "DD_WORLD.drawPickup (suelo, 44 px × escala) · dd_ui_system.js (reserva HUD) · "
                    "tarjetas del cofre y lista de pasivos (relic_*, parche 1f del build)",
          "frames": 1, "loop": False, "ids": {}}
    for aid in PICKUPS:
        rec = frame_record(entries, aid, problems, False)
        rec["pivot"] = (entries.get(aid) or {}).get("pivot")
        pk["ids"][aid] = rec
    doc["entities"]["pickups"] = pk

    doc["validation"] = {"rules": ["R1 existe", "R2 misma rev que el base", "R3 anchors foot/unit en figuras",
                                   "R4 caminata del protagonista completa"],
                         "problems": problems, "ok": not problems}
    return doc


def main(argv):
    doc = build()
    if "--check" in argv:
        for p in doc["validation"]["problems"]:
            print("  [X]", p)
        print("contrato de animación:", "OK" if doc["validation"]["ok"] else "%d incumplimientos" % len(doc["validation"]["problems"]))
        return 0 if doc["validation"]["ok"] else 1
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    n_en = sum(len(f["states"]) for f in doc["entities"]["enemies"]["families"].values())
    n_bo = sum(len(b["states"]) for b in doc["entities"]["bosses"]["slugs"].values())
    print("escrito %s · enemigos %d estados · jefes %d estados · objetos %d · problemas %d" %
          (os.path.relpath(OUT, ROOT), n_en, n_bo, len(doc["entities"]["pickups"]["ids"]), len(doc["validation"]["problems"])))
    for p in doc["validation"]["problems"]:
        print("  [X]", p)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
