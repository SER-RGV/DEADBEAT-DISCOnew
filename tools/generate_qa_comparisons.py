import os, math
from PIL import Image, ImageDraw

os.makedirs("assets/qa", exist_ok=True)

def draw_checker_box(tw, th):
    box = Image.new("RGBA", (tw, th), (24, 20, 36, 255))
    bdraw = ImageDraw.Draw(box)
    for by in range(0, th, 16):
        for bx in range(0, tw, 16):
            if ((bx // 16) + (by // 16)) % 2 == 1:
                bdraw.rectangle([bx, by, bx+15, by+15], fill=(36, 30, 52, 255))
    return box

def build_before_after_sheet(title, pairs, out_path, cols=2, cell_w=240, cell_h=240):
    # Each pair is (label, before_path, after_path)
    rows = math.ceil(len(pairs) / cols)
    pair_w = cell_w * 2 + 24
    pad = 20
    header = 54
    label_h = 34
    W = cols * (pair_w + pad) + pad
    H = header + rows * (cell_h + label_h + pad) + pad
    canvas = Image.new("RGB", (W, H), (11, 8, 18))
    draw = ImageDraw.Draw(canvas)
    draw.text((pad, 16), title, fill=(255, 45, 149))

    for idx, (lbl, bp, ap) in enumerate(pairs):
        r, c = divmod(idx, cols)
        x0 = pad + c * (pair_w + pad)
        y0 = header + r * (cell_h + label_h + pad)

        for side, (tag, p, border_col) in enumerate([("ANTES (DEFECTO)", bp, (239, 68, 68)), ("DESPUES (UNIFICADO)", ap, (34, 211, 238))]):
            bx = x0 + side * (cell_w + 16)
            by = y0
            box = draw_checker_box(cell_w, cell_h)
            if os.path.exists(p):
                im = Image.open(p).convert("RGBA")
                im.thumbnail((cell_w - 12, cell_h - 12), Image.Resampling.LANCZOS)
                box.alpha_composite(im, ((cell_w - im.width)//2, (cell_h - im.height)//2))
            canvas.paste(box.convert("RGB"), (bx, by))
            draw.rectangle([bx, by, bx+cell_w, by+cell_h], outline=border_col, width=2)
            draw.rectangle([bx, by, bx+145, by+20], fill=border_col)
            draw.text((bx+6, by+4), tag, fill=(10, 6, 18))

        draw.text((x0 + 4, y0 + cell_h + 8), lbl, fill=(241, 245, 249))

    canvas.save(out_path)
    print("Saved", out_path)

snap = "backups/pre_unification_snapshot"

# 1. BEFORE / AFTER CHARACTERS
build_before_after_sheet(
    "DEADBEAT DISCO — QA ANTES VS DESPUES · PROTAGONISTA (EL DESAFINADO) Y NPCS DEL REFUGIO",
    [
        ("player_idle_00.png (Busto roto sin piernas -> Cuerpo completo alineado)", f"{snap}/assets/characters/player_idle_00.png", "assets/characters/player_idle_00.png"),
        ("player_firehip.png (Busto gigante cortado -> Guardia completa hip-fire)", f"{snap}/assets/characters/player_firehip.png", "assets/characters/player_firehip.png"),
        ("player_walk_03.png (Espalda encogida -> Frame 4 ciclo caminata coherente)", f"{snap}/assets/characters/player_walk_03.png", "assets/characters/player_walk_03.png"),
        ("player_walk_02.png (Manga corta inconsistente -> Chaleco sin mangas + tatuaje)", f"{snap}/assets/characters/player_walk_02.png", "assets/characters/player_walk_02.png"),
        ("player_boost_00.png (Damero blanco en estela -> Estela neón limpia RGBA)", f"{snap}/assets/characters/player_boost_00.png", "assets/characters/player_boost_00.png"),
        ("npc_armorer_hub.png (Damero blanco entre botas -> Recorte alfa limpio)", f"{snap}/assets/characters/npc_armorer_hub.png", "assets/characters/npc_armorer_hub.png"),
    ],
    "assets/qa/BEFORE_AFTER_CHARACTERS.png",
    cols=2, cell_w=230, cell_h=260
)

# 2. BEFORE / AFTER ENEMIES
build_before_after_sheet(
    "DEADBEAT DISCO — QA ANTES VS DESPUES · FAMILIAS DE ENEMIGOS (LIMPIEZA DE DAMEROS E IDENTIDAD)",
    [
        ("enemy_dancer_attack.png (Damero blanco en aro -> Vórtice magenta RGBA)", f"{snap}/assets/enemies/enemy_dancer_attack.png", "assets/enemies/enemy_dancer_attack.png"),
        ("enemy_dancer_walk.png (Damero blanco bajo brazos -> Silueta limpia RGBA)", f"{snap}/assets/enemies/enemy_dancer_walk.png", "assets/enemies/enemy_dancer_walk.png"),
        ("enemy_chef_walk.png (Vampiro delgado inconexo -> Carnicero infernal unificado)", f"{snap}/assets/enemies/enemy_chef_walk.png", "assets/enemies/enemy_chef_walk.png"),
        ("enemy_chef_death.png (Caricatura en shorts -> Carnicero abatido coherente)", f"{snap}/assets/enemies/enemy_chef_death.png", "assets/enemies/enemy_chef_death.png"),
        ("enemy_elite_attack.png (Casco fragmentado roto -> Estocada guardia de élite)", f"{snap}/assets/enemies/enemy_elite_attack.png", "assets/enemies/enemy_elite_attack.png"),
        ("enemy_security_attack.png (Damero blanco en arco -> Arco de porra neón limpio)", f"{snap}/assets/enemies/enemy_security_attack.png", "assets/enemies/enemy_security_attack.png"),
        ("enemy_security_windup.png (Demonio con cuernos -> Guardia antidisturbios)", f"{snap}/assets/enemies/enemy_security_windup.png", "assets/enemies/enemy_security_windup.png"),
        ("enemy_fanatic_attack.png (Damero blanco en capa -> Estocada limpia RGBA)", f"{snap}/assets/enemies/enemy_fanatic_attack.png", "assets/enemies/enemy_fanatic_attack.png"),
    ],
    "assets/qa/BEFORE_AFTER_ENEMIES.png",
    cols=2, cell_w=230, cell_h=230
)

# 3. BEFORE / AFTER BOSSES
build_before_after_sheet(
    "DEADBEAT DISCO — QA ANTES VS DESPUES · LOS 9 SOBERANOS (CUERPO COMPLETO Y LIMPIEZA DE DAMEROS)",
    [
        ("boss_03_cajero_hit.png (Cabeza gigante flotante -> Cuerpo completo en impacto)", f"{snap}/assets/bosses/boss_03_cajero_hit.png", "assets/bosses/boss_03_cajero_hit.png"),
        ("boss_04_pogo_attack.png (Damero blanco completo -> Onda de choque limpia RGBA)", f"{snap}/assets/bosses/boss_04_pogo_attack.png", "assets/bosses/boss_04_pogo_attack.png"),
        ("boss_05_oficiante_hit.png (Retrato femenino inconexo -> Obispo cuerpo completo)", f"{snap}/assets/bosses/boss_05_oficiante_hit.png", "assets/bosses/boss_05_oficiante_hit.png"),
        ("boss_06_matarife_attack.png (Damero blanco en tajo -> Tajo carmesí limpio)", f"{snap}/assets/bosses/boss_06_matarife_attack.png", "assets/bosses/boss_06_matarife_attack.png"),
        ("boss_09_nucleo_attack.png (Damero oscuro circular -> Soberano + tentáculos neón)", f"{snap}/assets/bosses/boss_09_nucleo_attack.png", "assets/bosses/boss_09_nucleo_attack.png"),
        ("boss_09_nucleo_hit.png (Mancha pixelada 8-bit -> Rey del Compás en impacto)", f"{snap}/assets/bosses/boss_09_nucleo_hit.png", "assets/bosses/boss_09_nucleo_hit.png"),
    ],
    "assets/qa/BEFORE_AFTER_BOSSES.png",
    cols=2, cell_w=240, cell_h=260
)

# 4. BEFORE / AFTER CINEMATICS, PICKUPS, RELICS & PROPS
build_before_after_sheet(
    "DEADBEAT DISCO — QA ANTES VS DESPUES · CINEMÁTICAS, RELIQUIAS, PICKUPS Y PROPS",
    [
        ("cine_bg01_city.png (Barra debug superior -> Pintura HD limpia de referencia)", f"{snap}/assets/cinematics/cine_bg01_city.png", "assets/cinematics/backgrounds/final/cine_bg01_city/cine_bg01_city.png"),
        ("cine_bg02_club_exterior.png (Barra debug superior -> Fachada catedralicia HD)", f"{snap}/assets/cinematics/cine_bg02_club_exterior.png", "assets/cinematics/backgrounds/final/cine_bg02_club_exterior/cine_bg02_club_exterior.png"),
        ("cine_bg04_main_hall.png (Barra debug 'RL' -> Nave principal con Zorro y láseres)", f"{snap}/assets/cinematics/cine_bg04_main_hall.png", "assets/cinematics/backgrounds/final/cine_bg04_main_hall/cine_bg04_main_hall.png"),
        ("relic_pact.png (Halo blanco recortado -> Sobre lacrado con aura magenta)", f"{snap}/assets/pickups/relic_pact.png", "assets/pickups/relic_pact.png"),
        ("relic_tempo.png (Caja cuadrada con damero -> Medallón Metrónomo de Hueso)", f"{snap}/assets/pickups/relic_tempo.png", "assets/pickups/relic_tempo.png"),
        ("prop_sigil_poster.png (Lienzo blanco cegador -> Lienzo obsidiana gótico)", f"{snap}/assets/props/prop_sigil_poster.png", "assets/props/prop_sigil_poster.png"),
    ],
    "assets/qa/BEFORE_AFTER_CINEMATICS_AND_UI.png",
    cols=2, cell_w=260, cell_h=190
)

# 5. ANIMATION STRIP PREVIEW & PIVOT / WAIST-SPLIT VERIFICATION SHEET
W, H = 1680, 1180
anim_sheet = Image.new("RGB", (W, H), (12, 8, 20))
adraw = ImageDraw.Draw(anim_sheet)
adraw.text((24, 16), "DEADBEAT DISCO — VERIFICACIÓN DE SECUENCIAS DE ANIMACIÓN, PIVOTES DE SUELO Y CORTE DE CINTURA (WAIST-SPLIT)", fill=(255, 45, 149))

# Row 1: Protagonist 4-frame Walk Cycle + Idle + Shoot + Fire2 + FireHip (with ground line y=312 and waist split line y=173)
adraw.text((24, 48), "1. EL DESAFINADO — CICLO DE CAMINATA Y COMBATE (Línea Cian = Corte Cintura 54% · Línea Magenta = Pivote Suelo y=312)", fill=(56, 189, 248))
p_strip = ["player_idle_00.png", "player_walk_00.png", "player_walk_01.png", "player_walk_02.png", "player_walk_03.png", "player_shoot_00.png", "player_fire2.png", "player_firehip.png"]
for i, fn in enumerate(p_strip):
    bx = 24 + i * 204
    by = 74
    box = draw_checker_box(192, 240)
    im = Image.open(f"assets/characters/{fn}").convert("RGBA")
    scale = 220 / 320.0
    tw, th = int(round(im.width * scale)), int(round(im.height * scale))
    im_s = im.resize((tw, th), Image.Resampling.LANCZOS)
    ox = (192 - tw) // 2
    oy = 10
    box.alpha_composite(im_s, (ox, oy))
    anim_sheet.paste(box.convert("RGB"), (bx, by))
    # Draw waist-split line (54%) and ground pivot line (312/320)
    wy = by + oy + int(round(th * 0.54))
    gy = by + oy + int(round(th * (312 / 320.0)))
    adraw.line([(bx, wy), (bx + 192, wy)], fill=(56, 189, 248), width=1)
    adraw.line([(bx, gy), (bx + 192, gy)], fill=(255, 45, 149), width=2)
    adraw.rectangle([bx, by, bx + 192, by + 240], outline=(80, 60, 110))
    adraw.text((bx + 6, by + 244), fn.replace(".png", ""), fill=(226, 232, 240))

# Row 2: Protagonist 8-Directional Turnaround (E, SE, S, SO, O, NO, N, NE)
adraw.text((24, 344), "2. EL DESAFINADO — GIRO DIRECCIONAL DE 8 ÁNGULOS (E · SE · S · SO · O · NO · N · NE)", fill=(56, 189, 248))
dirs = ["E", "SE", "S", "SO", "O", "NO", "N", "NE"]
for i, d in enumerate(dirs):
    bx = 24 + i * 204
    by = 370
    box = draw_checker_box(192, 220)
    im = Image.open(f"assets/characters/player_dir_{d}.png").convert("RGBA")
    scale = 200 / 320.0
    tw, th = int(round(im.width * scale)), int(round(im.height * scale))
    im_s = im.resize((tw, th), Image.Resampling.LANCZOS)
    ox = (192 - tw) // 2
    oy = 10
    box.alpha_composite(im_s, (ox, oy))
    anim_sheet.paste(box.convert("RGB"), (bx, by))
    gy = by + oy + int(round(th * (312 / 320.0)))
    adraw.line([(bx, gy), (bx + 192, gy)], fill=(255, 45, 149), width=2)
    adraw.rectangle([bx, by, bx + 192, by + 220], outline=(80, 60, 110))
    adraw.text((bx + 6, by + 224), f"DIR_{d}", fill=(226, 232, 240))

# Row 3: Enemy 4-State Combat Progression (Chef & Dancer: walk -> windup -> attack -> death)
adraw.text((24, 618), "3. ENEMIGOS — PROGRESIÓN DE ESTADOS DE COMBATE (WALK -> WINDUP -> ATTACK -> DEATH)", fill=(56, 189, 248))
e_strip = [
    "enemy_chef_walk.png", "enemy_chef_windup.png", "enemy_chef_attack.png", "enemy_chef_death.png",
    "enemy_dancer_walk.png", "enemy_dancer_windup.png", "enemy_dancer_attack.png", "enemy_dancer_death.png"
]
for i, fn in enumerate(e_strip):
    bx = 24 + i * 204
    by = 644
    box = draw_checker_box(192, 200)
    im = Image.open(f"assets/enemies/{fn}").convert("RGBA")
    im.thumbnail((176, 176), Image.Resampling.LANCZOS)
    box.alpha_composite(im, ((192 - im.width)//2, (200 - im.height)//2))
    anim_sheet.paste(box.convert("RGB"), (bx, by))
    adraw.rectangle([bx, by, bx + 192, by + 200], outline=(80, 60, 110))
    adraw.text((bx + 6, by + 204), fn.replace(".png", ""), fill=(226, 232, 240))

# Row 4: Sovereign Boss 4-State Combat Progression (Pogo/Brama & Nucleo/Rey del Compás: idle -> attack -> hit -> death)
adraw.text((24, 874), "4. SOBERANOS — PROGRESIÓN DE ESTADOS DE COMBATE (IDLE -> ATTACK -> HIT -> DEATH)", fill=(56, 189, 248))
b_strip = [
    "boss_04_pogo_idle.png", "boss_04_pogo_attack.png", "boss_04_pogo_hit.png", "boss_04_pogo_death.png",
    "boss_09_nucleo_idle.png", "boss_09_nucleo_attack.png", "boss_09_nucleo_hit.png", "boss_09_nucleo_death.png"
]
for i, fn in enumerate(b_strip):
    bx = 24 + i * 204
    by = 900
    box = draw_checker_box(192, 230)
    im = Image.open(f"assets/bosses/{fn}").convert("RGBA")
    im.thumbnail((180, 214), Image.Resampling.LANCZOS)
    box.alpha_composite(im, ((192 - im.width)//2, (230 - im.height)//2))
    anim_sheet.paste(box.convert("RGB"), (bx, by))
    adraw.rectangle([bx, by, bx + 192, by + 230], outline=(80, 60, 110))
    adraw.text((bx + 6, by + 234), fn.replace(".png", ""), fill=(226, 232, 240))

anim_sheet.save("assets/qa/ANIMATION_STRIP_PREVIEW_SHEET.png")
print("Saved assets/qa/ANIMATION_STRIP_PREVIEW_SHEET.png")
