#!/usr/bin/env python3
"""TOTAL ART REBUILD — TR_W2/W3 (props del HUB y sala, clase B: regenera en su sitio).
Uso: python3 ART_TOOLS/prepare_tr_w2_hub_props.py
Materias primas: /tmp/dd_raw/tr_w2/<id>.png
Nota: fondo verde #00ff00 para sujetos oscuros (extract_clean_rgba rama chroma).
"""
import importlib.util, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("asset_pipeline", os.path.join(ROOT, "tools", "asset_pipeline.py"))
ap = importlib.util.module_from_spec(spec); sys.modules["asset_pipeline"] = ap; spec.loader.exec_module(ap)
RAW = "/tmp/dd_raw/tr_w2"

JOBS = [
    ("prop_bar_counter",      "assets/props/prop_bar_counter.png",      (416, 256), "bottom-center"),
    ("prop_dj_booth",         "assets/props/prop_dj_booth.png",         (448, 288), "bottom-center"),
    ("prop_speaker_tower",    "assets/props/prop_speaker_tower.png",    (224, 384), "bottom-center"),
    ("prop_subwoofer_cyan",   "assets/props/prop_subwoofer_cyan.png",   (256, 352), "bottom-center"),
    ("prop_chandelier_gold",  "assets/props/prop_chandelier_gold.png",  (320, 320), "center"),
    ("prop_candelabra_floor", "assets/props/prop_candelabra_floor.png", (192, 320), "bottom-center"),
    ("prop_sofa_black",       "assets/props/prop_sofa_black.png",       (384, 256), "bottom-center"),
    ("prop_bookshelf_hub",    "assets/props/prop_bookshelf_hub.png",    (320, 384), "bottom-center"),
    ("prop_cooler_neon",      "assets/props/prop_cooler_neon.png",      (224, 352), "bottom-center"),
    ("prop_gothic_statue",    "assets/props/prop_gothic_statue.png",    (224, 384), "bottom-center"),
    # TR_W3
    ("prop_arcade_cabinet",   "assets/props/prop_arcade_cabinet.png",   (256, 352), "bottom-center"),
    ("prop_vending_machine",  "assets/props/prop_vending_machine.png",  (256, 352), "bottom-center"),
    ("prop_crate_club",       "assets/props/prop_crate_club.png",       (256, 224), "bottom-center"),
    ("prop_armchair_vip",     "assets/props/prop_armchair_vip.png",     (256, 256), "bottom-center"),
    ("prop_bench_neon",       "assets/props/prop_bench_neon.png",       (320, 192), "bottom-center"),
    ("prop_neon_palm",        "assets/props/prop_neon_palm.png",        (320, 384), "bottom-center"),
    ("prop_sigil_poster",     "assets/props/prop_sigil_poster.png",     (224, 288), "center"),
    ("prop_bollard_pair",     "assets/props/prop_bollard_pair.png",     (224, 288), "bottom-center"),
    ("prop_chest_closed",     "assets/props/prop_chest_closed.png",     (256, 224), "bottom-center"),
    # TR_W4
    ("prop_potted_plant",   "assets/props/prop_potted_plant.png",     (256, 320), "bottom-center"),
    ("prop_hub_fox_neon",   "assets/props/prop_hub_fox_neon.png",     (384, 512), "center"),
    ("prop_neon_flower",    "assets/props/prop_neon_flower.png",      (256, 256), "center"),
    ("prop_bar_bottles",    "assets/props/prop_bar_bottles.png",      (256, 224), "bottom-center"),
    ("prop_chest_open",     "assets/props/prop_chest_open.png",       (256, 256), "bottom-center"),
    ("enemy_security_walk",   "assets/enemies/enemy_security_walk.png",   (224, 432), "bottom-center"),
    ("enemy_security_windup", "assets/enemies/enemy_security_windup.png", (400, 432), "bottom-center"),
    ("enemy_security_attack", "assets/enemies/enemy_security_attack.png", (480, 400), "bottom-center"),
    ("enemy_security_death",  "assets/enemies/enemy_security_death.png",  (432, 416), "bottom-center"),
    # TR_W5
    ("enemy_dancer_walk",   "assets/enemies/enemy_dancer_walk.png",   (272, 432), "bottom-center"),
    ("enemy_dancer_windup", "assets/enemies/enemy_dancer_windup.png", (320, 448), "bottom-center"),
    ("enemy_dancer_attack", "assets/enemies/enemy_dancer_attack.png", (480, 416), "bottom-center"),
    ("enemy_dancer_death",  "assets/enemies/enemy_dancer_death.png",  (384, 432), "bottom-center"),
    ("enemy_fanatic_walk",   "assets/enemies/enemy_fanatic_walk.png",   (336, 400), "bottom-center"),
    ("enemy_fanatic_windup", "assets/enemies/enemy_fanatic_windup.png", (384, 320), "bottom-center"),
    ("enemy_fanatic_attack", "assets/enemies/enemy_fanatic_attack.png", (384, 400), "bottom-center"),
    ("enemy_fanatic_death",  "assets/enemies/enemy_fanatic_death.png",  (496, 448), "bottom-center"),
    ("enemy_chef_walk",    "assets/enemies/enemy_chef_walk.png",    (608, 512), "bottom-center"),
    ("enemy_chef_windup",  "assets/enemies/enemy_chef_windup.png",  (432, 704), "bottom-center"),
    # TR_W6
    ("enemy_chef_attack",  "assets/enemies/enemy_chef_attack.png",  (800, 528), "bottom-center"),
    ("enemy_chef_death",   "assets/enemies/enemy_chef_death.png",   (656, 592), "bottom-center"),
    ("enemy_drone_walk",   "assets/enemies/enemy_drone_walk.png",   (272, 432), "bottom-center"),
    ("enemy_drone_windup", "assets/enemies/enemy_drone_windup.png", (240, 432), "bottom-center"),
    ("enemy_drone_attack", "assets/enemies/enemy_drone_attack.png", (432, 432), "bottom-center"),
    ("enemy_drone_death",  "assets/enemies/enemy_drone_death.png",  (416, 448), "bottom-center"),
    ("enemy_elite_walk",   "assets/enemies/enemy_elite_walk.png",   (320, 496), "bottom-center"),
    ("enemy_elite_windup", "assets/enemies/enemy_elite_windup.png", (336, 512), "bottom-center"),
    ("enemy_elite_attack", "assets/enemies/enemy_elite_attack.png", (672, 432), "bottom-center"),
    ("enemy_elite_death",  "assets/enemies/enemy_elite_death.png",  (496, 464), "bottom-center"),
    # TR_W7 (chef_death y elite_windup regeneradas v2 con verde explícito)
    ("boss_00_anden_idle",   "assets/bosses/boss_00_anden_idle.png",   (304, 576), "bottom-center"),
    ("boss_00_anden_attack", "assets/bosses/boss_00_anden_attack.png", (464, 576), "bottom-center"),
    ("boss_00_anden_hit",    "assets/bosses/boss_00_anden_hit.png",    (384, 448), "bottom-center"),
    ("boss_00_anden_death",  "assets/bosses/boss_00_anden_death.png",  (416, 352), "bottom-center"),
    ("boss_01_magneta_idle",   "assets/bosses/boss_01_magneta_idle.png",   (352, 576), "bottom-center"),
    ("boss_01_magneta_attack", "assets/bosses/boss_01_magneta_attack.png", (352, 576), "bottom-center"),
    ("boss_01_magneta_hit",    "assets/bosses/boss_01_magneta_hit.png",    (352, 448), "bottom-center"),
    ("boss_01_magneta_death",  "assets/bosses/boss_01_magneta_death.png",  (448, 448), "bottom-center"),
    # TR_W8
    ("boss_02_bufe_idle",    "assets/bosses/boss_02_bufe_idle.png",    (464, 528), "bottom-center"),
    ("boss_02_bufe_attack",  "assets/bosses/boss_02_bufe_attack.png",  (592, 528), "bottom-center"),
    ("boss_02_bufe_hit",     "assets/bosses/boss_02_bufe_hit.png",     (384, 448), "bottom-center"),
    ("boss_02_bufe_death",   "assets/bosses/boss_02_bufe_death.png",   (416, 352), "bottom-center"),
    ("boss_03_cajero_idle",   "assets/bosses/boss_03_cajero_idle.png",   (304, 560), "bottom-center"),
    ("boss_03_cajero_attack", "assets/bosses/boss_03_cajero_attack.png", (416, 448), "bottom-center"),
    ("boss_03_cajero_hit",    "assets/bosses/boss_03_cajero_hit.png",    (384, 448), "bottom-center"),
    ("boss_03_cajero_death",  "assets/bosses/boss_03_cajero_death.png",  (416, 352), "bottom-center"),
    ("boss_04_pogo_idle",     "assets/bosses/boss_04_pogo_idle.png",     (448, 544), "bottom-center"),
    ("boss_04_pogo_attack",   "assets/bosses/boss_04_pogo_attack.png",   (576, 544), "bottom-center"),
    # TR_W9 (+ pogo/bufe v2 regeneradas en tr_w8)
    ("boss_04_pogo_hit",   "assets/bosses/boss_04_pogo_hit.png",   (384, 448), "bottom-center"),
    ("boss_04_pogo_death", "assets/bosses/boss_04_pogo_death.png", (416, 352), "bottom-center"),
    ("boss_05_oficiante_idle",   "assets/bosses/boss_05_oficiante_idle.png",   (352, 560), "bottom-center"),
    ("boss_05_oficiante_attack", "assets/bosses/boss_05_oficiante_attack.png", (416, 448), "bottom-center"),
    ("boss_05_oficiante_hit",    "assets/bosses/boss_05_oficiante_hit.png",    (384, 448), "bottom-center"),
    ("boss_05_oficiante_death",  "assets/bosses/boss_05_oficiante_death.png",  (416, 352), "bottom-center"),
    ("boss_06_matarife_idle",    "assets/bosses/boss_06_matarife_idle.png",    (496, 544), "bottom-center"),
    ("boss_06_matarife_attack",  "assets/bosses/boss_06_matarife_attack.png",  (416, 448), "bottom-center"),
    ("boss_06_matarife_hit",     "assets/bosses/boss_06_matarife_hit.png",     (384, 448), "bottom-center"),
    # TR_W10 (+ pogo_death v2 painterly en tr_w9)
    ("boss_04_pogo_death",   "assets/bosses/boss_04_pogo_death.png",   (416, 352), "bottom-center"),
    ("boss_06_matarife_death", "assets/bosses/boss_06_matarife_death.png", (416, 352), "bottom-center"),
    ("boss_07_imitador_idle",   "assets/bosses/boss_07_imitador_idle.png",   (336, 576), "bottom-center"),
    ("boss_07_imitador_attack", "assets/bosses/boss_07_imitador_attack.png", (416, 448), "bottom-center"),
    ("boss_07_imitador_hit",    "assets/bosses/boss_07_imitador_hit.png",    (384, 448), "bottom-center"),
    ("boss_07_imitador_death",  "assets/bosses/boss_07_imitador_death.png",  (416, 352), "bottom-center"),
    ("boss_08_traidor_idle",    "assets/bosses/boss_08_traidor_idle.png",    (368, 576), "bottom-center"),
    ("boss_08_traidor_attack",  "assets/bosses/boss_08_traidor_attack.png",  (416, 448), "bottom-center"),
    ("boss_08_traidor_hit",     "assets/bosses/boss_08_traidor_hit.png",     (384, 448), "bottom-center"),
    # TR_W11
    ("boss_08_traidor_death",   "assets/bosses/boss_08_traidor_death.png",   (416, 352), "bottom-center"),
    ("boss_09_nucleo_idle",     "assets/bosses/boss_09_nucleo_idle.png",     (352, 592), "bottom-center"),
    ("boss_09_nucleo_attack",   "assets/bosses/boss_09_nucleo_attack.png",   (416, 448), "bottom-center"),
    ("boss_09_nucleo_hit",      "assets/bosses/boss_09_nucleo_hit.png",      (384, 448), "bottom-center"),
    ("boss_09_nucleo_death",    "assets/bosses/boss_09_nucleo_death.png",    (416, 352), "bottom-center"),
    ("boss_10_arquitecto_idle", "assets/bosses/boss_10_arquitecto_idle.png", (496, 560), "bottom-center"),
    ("boss_10_arquitecto_attack", "assets/bosses/boss_10_arquitecto_attack.png", (448, 448), "bottom-center"),
]
def rawpath(a):
    for d in ("/tmp/dd_raw/tr_w11", "/tmp/dd_raw/tr_w10", "/tmp/dd_raw/tr_w9", "/tmp/dd_raw/tr_w8", "/tmp/dd_raw/tr_w7", "/tmp/dd_raw/tr_w6", "/tmp/dd_raw/tr_w5", "/tmp/dd_raw/tr_w4", "/tmp/dd_raw/tr_w3", "/tmp/dd_raw/tr_w2"):
        if os.path.isfile(f"{d}/{a}.png"):
            return f"{d}/{a}.png"
    return f"{RAW}/{a}.png"
missing = [a for a, *_ in JOBS if not os.path.isfile(rawpath(a))]
if missing:
    print(f"AVISO: materias primas ausentes, se saltan (provisional conservado): {', '.join(missing)}")
JOBS = [j for j in JOBS if os.path.isfile(rawpath(j[0]))]
POST_DESPILL = {
    "prop_dj_booth", "prop_speaker_tower", "prop_candelabra_floor", "prop_bar_counter",
    "prop_subwoofer_cyan", "prop_cooler_neon", "prop_gothic_statue", "prop_bookshelf_hub",
    "prop_neon_palm", "prop_sigil_poster", "prop_bollard_pair",
    "prop_potted_plant", "prop_hub_fox_neon", "prop_neon_flower", "prop_bar_bottles",
    "prop_chest_open",
    "enemy_security_walk", "enemy_security_windup", "enemy_security_attack", "enemy_security_death",
    "enemy_dancer_walk", "enemy_dancer_windup", "enemy_dancer_attack", "enemy_dancer_death",
    "enemy_fanatic_walk", "enemy_fanatic_windup", "enemy_fanatic_attack", "enemy_fanatic_death",
    "enemy_chef_walk", "enemy_chef_windup", "enemy_chef_attack", "enemy_chef_death",
    "enemy_drone_walk", "enemy_drone_windup", "enemy_drone_attack", "enemy_drone_death",
    "enemy_elite_walk", "enemy_elite_windup", "enemy_elite_attack", "enemy_elite_death",
    "boss_00_anden_idle", "boss_00_anden_attack", "boss_00_anden_hit", "boss_00_anden_death",
    "boss_01_magneta_idle", "boss_01_magneta_attack", "boss_01_magneta_hit", "boss_01_magneta_death",
    "boss_02_bufe_idle", "boss_02_bufe_attack", "boss_02_bufe_hit", "boss_02_bufe_death",
    "boss_03_cajero_idle", "boss_03_cajero_attack", "boss_03_cajero_hit", "boss_03_cajero_death",
    "boss_04_pogo_idle", "boss_04_pogo_attack", "boss_04_pogo_hit", "boss_04_pogo_death",
    "boss_02_bufe_hit",
    "boss_04_pogo_death",
    "boss_07_imitador_idle", "boss_07_imitador_attack", "boss_07_imitador_hit", "boss_07_imitador_death",
    "boss_08_traidor_idle", "boss_08_traidor_attack", "boss_08_traidor_hit", "boss_08_traidor_death",
    "boss_06_matarife_death",
    "boss_09_nucleo_idle", "boss_09_nucleo_attack", "boss_09_nucleo_hit", "boss_09_nucleo_death",
    "boss_10_arquitecto_idle", "boss_10_arquitecto_attack",
    "boss_05_oficiante_idle", "boss_05_oficiante_attack", "boss_05_oficiante_hit", "boss_05_oficiante_death",
    "boss_06_matarife_idle", "boss_06_matarife_attack", "boss_06_matarife_hit",
}
REFIT_BOTTOM = {"prop_bookshelf_hub": (320, 384), "prop_gothic_statue": (224, 384), "prop_bollard_pair": (224, 288)}

def green_despill(pil_im, thr=10):
    a = np.array(pil_im).astype(np.int32)
    g_ex = a[:, :, 1] - np.maximum(a[:, :, 0], a[:, :, 2])
    mask = (g_ex > thr) & (a[:, :, 3] > 0)
    a[mask, 3] = 0
    return Image.fromarray(a.astype(np.uint8), "RGBA"), int(mask.sum())

def refit_contain(pil_im, tw, th, pivot):
    a = np.array(pil_im)
    mask = a[:, :, 3] > 14
    if not mask.any():
        return pil_im
    ys, xs = np.where(mask)
    crop = pil_im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    pad = 0.05
    aw, ah = int(tw * (1 - 2 * pad)), int(th * (1 - 2 * pad))
    scale = min(aw / crop.size[0], ah / crop.size[1])
    nw, nh = max(1, int(crop.size[0] * scale)), max(1, int(crop.size[1] * scale))
    crop = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    oy = (th - nh - max(2, int(th * 0.025))) if pivot == "bottom-center" else ((th - nh) // 2)
    canvas.paste(crop, ((tw - nw) // 2, oy), crop)
    return canvas

for asset_id, dest_rel, target, pivot in JOBS:
    im = Image.open(rawpath(asset_id)).convert("RGBA")
    clean = ap.extract_clean_rgba(im)
    final = ap.fit_rgba_to_canvas(clean, target[0], target[1], pivot)
    arr = np.array(final)
    trans = int((arr[:, :, 3] == 0).sum()); opaque = int((arr[:, :, 3] > 200).sum())
    if trans < 50 or opaque < 50:
        raise RuntimeError(f"alpha check failed for {asset_id}: trans={trans} opaque={opaque}")
    if asset_id in POST_DESPILL:
        final, removed = green_despill(final, 10)
        print(f"      despill {asset_id}: {removed} px")
    if asset_id in REFIT_BOTTOM:
        final = refit_contain(final, REFIT_BOTTOM[asset_id][0], REFIT_BOTTOM[asset_id][1], pivot)
        print(f"      refit {asset_id}")
    dest = os.path.join(ROOT, dest_rel)
    if os.path.isfile(dest):
        Image.open(dest).save(f"/tmp/tr_w2_backup_{asset_id}.png")
    ap.save_optimized_png(final, dest, True)
    print(f"OK {asset_id} -> {dest_rel} {final.size[0]}x{final.size[1]} {os.path.getsize(dest)/1024:.1f}KB trans={trans} opaque={opaque}")
