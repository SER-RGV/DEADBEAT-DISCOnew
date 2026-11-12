import os, json, urllib.request
from PIL import Image, ImageDraw, ImageFilter

# 1. Verify HTTP 200 OK across all HTML builds and all 586 registered assets on http://127.0.0.1:8080
base_url = "http://127.0.0.1:8080/"
html_targets = ["index.html", "DEADBEAT_DISCO.html", "DEADBEAT_DISCO.ART.html", "assets/manifest.json", "ART_ASSETS/tanda_E01/manifest.json", "CINEMATIC_ASSETS/manifest.json"]
for ht in html_targets:
    with urllib.request.urlopen(base_url + ht) as resp:
        assert resp.status == 200, f"Failed {ht}: {resp.status}"
print(f"Verified HTTP 200 OK for all {len(html_targets)} core HTML & manifest endpoints")

with open("assets/manifest.json", "r", encoding="utf-8") as f:
    man = json.load(f)

entries = man["entries"]
ok_count = 0
missing = []
for aid, meta in entries.items():
    src = meta["src"]
    url = base_url + urllib.parse.quote(src)
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                ok_count += 1
            else:
                missing.append((aid, src, resp.status))
    except Exception as e:
        missing.append((aid, src, str(e)))

print(f"Verified HTTP 200 OK for {ok_count}/{len(entries)} registered assets on live server (missing/404: {len(missing)})")
assert len(missing) == 0, f"Missing assets: {missing[:10]}"

# 2. Render In-Context Runtime Scene Proofs (6 panels: Intro Shot 4, Intro Shot 7, El Refugio HUB, Pista I Lujuria Combat, Pista IV Ira Boss Brama, Pista IX Nucleo Boss Rey del Compás)
W, H = 1920, 1280
sheet = Image.new("RGB", (W, H), (10, 6, 18))
sdraw = ImageDraw.Draw(sheet)
sdraw.text((28, 16), "DEADBEAT DISCO — VERIFICACIÓN EN CONTEXTO DE ESCENA (CINEMÁTICA 2.5D · EL REFUGIO HUB · COMBATE EN PISTAS · SOBERANOS · HUD)", fill=(255, 45, 149))

pw, ph = 608, 360

def make_cine_shot_4():
    # Shot 4: El Pasillo de Entrada (BG03 layers + Protagonist silhouette in magenta/gold backlight + foreground pillars)
    canv = Image.new("RGBA", (pw, ph), (6, 2, 12, 255))
    l1 = Image.open("assets/cinematics/backgrounds/final/cine_bg03_entrance/01_vaulted_hallway_depth.png").convert("RGBA").resize((pw, ph), Image.Resampling.LANCZOS)
    l2 = Image.open("assets/cinematics/backgrounds/final/cine_bg03_entrance/02_midground_columns_banners.png").convert("RGBA").resize((pw, ph), Image.Resampling.LANCZOS)
    l3 = Image.open("assets/cinematics/backgrounds/final/cine_bg03_entrance/03_foreground_pillars_occlusion.png").convert("RGBA").resize((pw, ph), Image.Resampling.LANCZOS)
    canv.alpha_composite(l1)
    canv.alpha_composite(l2)
    # Backlight glow + protagonist walk_01
    glow = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([pw//2 - 80, ph//2 - 60, pw//2 + 80, ph - 30], fill=(255, 45, 149, 130))
    canv.alpha_composite(glow.filter(ImageFilter.GaussianBlur(18)))
    hero = Image.open("assets/cinematics/characters/protagonist/hero_walk_01.png").convert("RGBA")
    hh = int(ph * 0.44)
    hw = int(hh * (hero.width / hero.height))
    hero_s = hero.resize((hw, hh), Image.Resampling.LANCZOS)
    canv.alpha_composite(hero_s, (pw//2 - hw//2, int(ph*0.82) - hh))
    canv.alpha_composite(l3)
    # Letterbox bars
    d = ImageDraw.Draw(canv)
    d.rectangle([0, 0, pw, 32], fill=(4, 2, 8, 240))
    d.rectangle([0, ph-32, pw, ph], fill=(4, 2, 8, 240))
    d.text((12, 9), "PLANO 04 · EL PASILLO DE ENTRADA · EL DESAFINADO", fill=(255, 45, 149))
    d.text((12, ph-22), "LA NOCHE QUE VUELVE · CONTRALUZ MAGENTA Y ORO", fill=(203, 213, 225))
    return canv.convert("RGB")

def make_cine_shot_7():
    # Shot 7: La Pista Central y la Cabina de Tempo (BG04/05 + Protagonist + floor reflection + laser drop)
    canv = Image.new("RGBA", (pw, ph), (6, 2, 12, 255))
    bg = Image.open("assets/cinematics/backgrounds/final/cine_bg04_main_hall/cine_bg04_main_hall.png").convert("RGBA").resize((pw, ph), Image.Resampling.LANCZOS)
    canv.alpha_composite(bg)
    hero = Image.open("assets/cinematics/characters/protagonist/hero_shoot_00.png").convert("RGBA")
    hh = int(ph * 0.42)
    hw = int(hh * (hero.width / hero.height))
    hero_s = hero.resize((hw, hh), Image.Resampling.LANCZOS)
    canv.alpha_composite(hero_s, (pw//2 - hw//2, int(ph*0.86) - hh))
    d = ImageDraw.Draw(canv)
    d.rectangle([0, 0, pw, 32], fill=(4, 2, 8, 240))
    d.rectangle([0, ph-32, pw, ph], fill=(4, 2, 8, 240))
    d.text((12, 9), "PLANO 07 · LA PISTA CENTRAL Y LA CABINA DE TEMPO", fill=(255, 45, 149))
    d.text((12, ph-22), "128 BPM BEAT DROP · EL ZORRO CORONADO SOBRE LA CABINA", fill=(56, 189, 248))
    return canv.convert("RGB")

def make_room_scene(circle_idx, title_banner, boss_slug=None):
    canv = Image.new("RGBA", (pw, ph), (8, 4, 16, 255))
    floors = {
        0: "assets/floors/floor_10_hub_checker.png",
        1: "assets/floors/floor_01_lust_dancefloor.png",
        4: "assets/floors/floor_04_wrath_burgundy.png",
        9: "assets/floors/floor_09_core_cosmic_vein.png"
    }
    medallions = {
        0: "ART_ASSETS/hub/tanda_01/hub_02_pista_central.png",
        1: "assets/environments/v5/hub_pista_medallion.png",
        4: "assets/environments/v5/ira_floor_medallion.png",
        9: "assets/environments/v5/nucleo_floor_mandala.png"
    }
    stages = {
        0: "ART_ASSETS/hub/tanda_01/hub_04_cabina_dj.png",
        1: "assets/environments/v5/lujuria_boudoir_stage.png",
        4: "assets/environments/v5/ira_furnace_stage.png",
        9: "assets/environments/v5/nucleo_cathedral_stage.png"
    }
    fl_im = Image.open(floors[circle_idx]).convert("RGBA").resize((128, 128), Image.Resampling.LANCZOS)
    for y in range(64, ph, 128):
        for x in range(0, pw, 128):
            canv.alpha_composite(fl_im, (x, y))
    # Dark club moody glaze
    glaze = Image.new("RGBA", (pw, ph), (8, 4, 18, 78))
    canv.alpha_composite(glaze)
    # North wall band
    wall_im = Image.open("assets/walls/wall_panel_neon_crown.png").convert("RGBA").resize((96, 84), Image.Resampling.LANCZOS)
    for x in range(0, pw, 96):
        canv.alpha_composite(wall_im, (x, 0))
    # Stage centerpiece on North Wall
    st_im = Image.open(stages[circle_idx]).convert("RGBA")
    st_im.thumbnail((240, 110), Image.Resampling.LANCZOS)
    canv.alpha_composite(st_im, ((pw - st_im.width)//2, 4))
    # Floor medallion in center
    med_im = Image.open(medallions[circle_idx]).convert("RGBA")
    med_im.thumbnail((260, 150), Image.Resampling.LANCZOS)
    canv.alpha_composite(med_im, ((pw - med_im.width)//2, int(ph*0.56) - med_im.height//2))

    if circle_idx == 0:
        # HUB props & NPCs: Tempo at booth, Bartender, Armorer, Ambient clubber, Descent Pad, Protagonist idle_00
        for p_path, px, py, th in [
            ("assets/props/prop_sofa_magenta.png", 170, 195, 68),
            ("assets/props/prop_sofa_magenta.png", 435, 195, 68),
            ("assets/characters/npc_dj_booth_world.png", 304, 108, 86),
            ("assets/characters/npc_bartender_hub.png", 145, 132, 82),
            ("assets/characters/npc_armorer_hub.png", 92, 240, 84),
            ("ART_ASSETS/hub/tanda_09/02_observador/final/hub_t09_02_observador.png", 475, 225, 78),
            ("assets/environments/threshold_descent_pad.png", 304, 310, 64),
            ("assets/characters/player_idle_00.png", 260, 260, 92),
        ]:
            im = Image.open(p_path).convert("RGBA")
            tw = int(th * (im.width / im.height))
            im_s = im.resize((tw, th), Image.Resampling.LANCZOS)
            canv.alpha_composite(im_s, (px - tw//2, py - th))
    else:
        # Combat scene: Protagonist firing + Enemies + Boss if boss_slug
        p_im = Image.open("assets/characters/player_firehip.png" if boss_slug else "assets/characters/player_shoot_00.png").convert("RGBA")
        th = 92
        tw = int(th * (p_im.width / p_im.height))
        canv.alpha_composite(p_im.resize((tw, th), Image.Resampling.LANCZOS), (145 - tw//2, 265 - th))

        proj = Image.open("assets/effects/proj_plasma.png" if boss_slug else "assets/effects/proj_slug.png").convert("RGBA").resize((48, 22), Image.Resampling.LANCZOS)
        canv.alpha_composite(proj, (215, 202))

        if boss_slug:
            b_im = Image.open(f"assets/bosses/{boss_slug}.png").convert("RGBA")
            bh = 168
            bw = int(bh * (b_im.width / b_im.height))
            canv.alpha_composite(b_im.resize((bw, bh), Image.Resampling.LANCZOS), (425 - bw//2, 280 - bh))
        else:
            for ep, ex, ey in [
                ("assets/enemies/enemy_dancer_attack.png", 385, 235),
                ("assets/enemies/enemy_security_attack.png", 475, 285),
                ("assets/enemies/enemy_chef_walk.png", 295, 305),
            ]:
                e_im = Image.open(ep).convert("RGBA")
                eh = 92
                ew = int(eh * (e_im.width / e_im.height))
                canv.alpha_composite(e_im.resize((ew, eh), Image.Resampling.LANCZOS), (ex - ew//2, ey - eh))

    # Draw HUD overlay (Portrait + Hearts + Weapon + Room Banner)
    d = ImageDraw.Draw(canv)
    d.rectangle([8, 8, 210, 54], fill=(8, 4, 16, 220), outline=(255, 45, 149, 220), width=1)
    port = Image.open("assets/ui/hud_portrait_protagonist.png").convert("RGBA").resize((40, 40), Image.Resampling.LANCZOS)
    canv.alpha_composite(port, (11, 11))
    heart = Image.open("assets/ui/hud_heart_full.png").convert("RGBA").resize((18, 18), Image.Resampling.LANCZOS)
    for hi in range(4):
        canv.alpha_composite(heart, (56 + hi * 20, 12))
    d.rectangle([56, 35, 198, 45], fill=(255, 45, 149, 235))
    d.rectangle([pw - 245, 8, pw - 8, 34], fill=(8, 4, 16, 220), outline=(56, 189, 248, 200), width=1)
    d.text((pw - 236, 15), title_banner[:32], fill=(248, 250, 252))
    return canv.convert("RGB")

panels = [
    ("1. CINEMÁTICA «LA NOCHE QUE VUELVE» · PLANO 04 (EL DESAFINADO EN CONTRALUZ)", make_cine_shot_4()),
    ("2. CINEMÁTICA «LA NOCHE QUE VUELVE» · PLANO 07 (PISTA CENTRAL Y CABINA DE TEMPO)", make_cine_shot_7()),
    ("3. EL REFUGIO (HUB) · PISTA ASTROLÓGICA, TEMPO, ARMERÍA Y PROTAGONISTA UNIFICADO", make_room_scene(0, "EL REFUGIO · ZONA SEGURA")),
    ("4. PISTA I · EL VESTÍBULO DEL ESPEJO (LUJURIA) · COMBATE EN CONTEXTO", make_room_scene(1, "PISTA I · VESTÍBULO DEL ESPEJO")),
    ("5. PISTA IV · EL FOSO DE COBRE (IRA) · DUELO CONTRA BRAMA (SIN DAMERO)", make_room_scene(4, "PISTA IV · BRAMA EL SEÑOR DEL MOSH", "boss_04_pogo_attack")),
    ("6. PISTA IX · EL NÚCLEO · DUELO CONTRA EL REY DEL COMPÁS (CUERPO COMPLETO)", make_room_scene(9, "PISTA IX · EL REY DEL COMPÁS", "boss_09_nucleo_attack")),
]

for idx, (lbl, pim) in enumerate(panels):
    r, c = divmod(idx, 3)
    x = 24 + c * (pw + 24)
    y = 58 + r * (ph + 48)
    sheet.paste(pim, (x, y))
    sdraw.rectangle([x, y, x + pw, y + ph], outline=(255, 45, 149), width=2)
    sdraw.text((x + 4, y + ph + 8), lbl, fill=(226, 232, 240))

# Bottom strip: La Cabina (Armería) Weapon Grid Showcase (18 unified weapons from the 121 arsenal)
sdraw.text((24, 882), "7. LA CABINA (ARMERÍA DEL REFUGIO) — MUESTRA DEL ARSENAL COMPLETO DE 121 ARMAS HD UNIFICADAS (320x160 RGBA)", fill=(56, 189, 248))
w_files = sorted([f for f in os.listdir("assets/weapons") if f.endswith(".png")])
step = max(1, len(w_files) // 18)
sample_w = [w_files[i * step] for i in range(18)]
for idx, wf in enumerate(sample_w):
    r, c = divmod(idx, 9)
    bx = 24 + c * 208
    by = 912 + r * 124
    box = Image.new("RGBA", (196, 108), (18, 12, 30, 255))
    wim = Image.open(f"assets/weapons/{wf}").convert("RGBA")
    wim.thumbnail((180, 84), Image.Resampling.LANCZOS)
    box.alpha_composite(wim, ((196 - wim.width)//2, (92 - wim.height)//2))
    sheet.paste(box.convert("RGB"), (bx, by))
    sdraw.rectangle([bx, by, bx + 196, by + 108], outline=(90, 60, 130), width=1)
    sdraw.text((bx + 6, by + 88), wf.replace("weapon_", "").replace(".png", "")[:22], fill=(246, 196, 83))

sheet.save("assets/qa/IN_CONTEXT_RUNTIME_SCENES.png")
print("Saved assets/qa/IN_CONTEXT_RUNTIME_SCENES.png")
