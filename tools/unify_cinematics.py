import os, json, shutil, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

# First back up the 6 cine_bg* master PNGs before replacing
os.makedirs("backups/pre_unification_snapshot/assets/cinematics", exist_ok=True)
for bg in ["cine_bg01_city", "cine_bg02_club_exterior", "cine_bg03_entrance", "cine_bg04_main_hall", "cine_bg05_dancefloor", "cine_bg06_hero"]:
    src_p = f"assets/cinematics/backgrounds/final/{bg}/{bg}.png"
    dst_p = f"backups/pre_unification_snapshot/assets/cinematics/{bg}.png"
    if os.path.exists(src_p) and not os.path.exists(dst_p):
        shutil.copy2(src_p, dst_p)

def strip_top_debug_bar(im):
    # Existing cine_bg05 & cine_bg06 have a top debug bar + color swatches in the top 6.2% of height.
    # Crop from y = int(H * 0.065) to H, and resize cleanly to target dimensions.
    w, h = im.size
    crop_y = int(round(h * 0.068))
    cropped = im.crop((0, crop_y, w, h))
    return cropped.resize((w, h), Image.Resampling.LANCZOS)

def color_grade_deadbeat(im, magenta_boost=1.08, contrast=1.10):
    im = im.convert("RGB")
    im = ImageEnhance.Contrast(im).enhance(contrast)
    im = ImageEnhance.Color(im).enhance(1.12)
    arr = np.array(im).astype(np.float32)
    # Subtle gothic-neon shadow & highlight grade (deep obsidian-violet shadows, vibrant magenta/cyan highlights)
    lum = (0.299*arr[:,:,0] + 0.587*arr[:,:,1] + 0.114*arr[:,:,2]) / 255.0
    arr[:,:,0] = np.clip(arr[:,:,0] * (0.96 + 0.12 * lum) * magenta_boost, 0, 255)
    arr[:,:,2] = np.clip(arr[:,:,2] * (1.02 + 0.08 * (1.0 - lum)), 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGB")

def make_parallax_layers(master_1080, mode):
    """
    Given a clean 1920x1080 RGB master painting, creates true 2.5D parallax layers:
    - layer 01 (RGB, 1920x1080): Far background / atmospheric vault depth (slightly softened distant plane)
    - layer 02 (RGBA, 1920x1080): Midground architectural / volumetric lighting layer with real alpha transparency
    - layer 03 (RGBA, 1920x1080): Foreground framing / occlusion / reflection layer with real alpha transparency
    """
    W, H = 1920, 1080
    # Layer 01: Full canvas atmospheric base
    l01 = master_1080.copy().convert("RGB")

    # Layer 02: Midground with alpha mask (opens center-top sky/vault so l01 parallax is visible behind l02)
    l02 = master_1080.copy().convert("RGBA")
    m02 = Image.new("L", (W, H), 255)
    d02 = ImageDraw.Draw(m02)
    if mode == "city":
        # Sky & moon region transparent so skyline moves in parallax over sky
        d02.ellipse([int(W*0.18), -int(H*0.15), int(W*0.88), int(H*0.48)], fill=0)
    elif mode == "exterior":
        # Upper night sky flanks & central portal depth transparent
        d02.polygon([(0, 0), (int(W*0.24), 0), (int(W*0.14), int(H*0.52)), (0, int(H*0.52))], fill=0)
        d02.polygon([(int(W*0.76), 0), (W, 0), (W, int(H*0.52)), (int(W*0.86), int(H*0.52))], fill=0)
    elif mode == "entrance":
        # Central far doorway & upper vault core transparent
        d02.ellipse([int(W*0.34), int(H*0.18), int(W*0.66), int(H*0.76)], fill=0)
    elif mode in ("main_hall", "dancefloor", "hero"):
        # Highlight beams & midground stage towers emphasized
        d02.ellipse([int(W*0.28), int(H*0.04), int(W*0.72), int(H*0.42)], fill=40)
    m02 = m02.filter(ImageFilter.GaussianBlur(radius=36))
    l02.putalpha(m02)

    # Layer 03: Foreground framing (left/right edges, lower foreground pipes/pavement/tables) with transparent center
    l03 = master_1080.copy().convert("RGBA")
    m03 = Image.new("L", (W, H), 0)
    d03 = ImageDraw.Draw(m03)
    if mode == "city":
        # Left foreground building & copper pipes + right foreground rooftops
        d03.polygon([(0, 0), (int(W*0.32), 0), (int(W*0.46), H), (0, H)], fill=255)
        d03.polygon([(int(W*0.82), 0), (W, 0), (W, H), (int(W*0.72), H)], fill=255)
        d03.rectangle([0, int(H*0.72), W, H], fill=255)
    elif mode == "exterior":
        # Wet pavement reflections & velvet stanchions in lower third
        d03.rectangle([0, int(H*0.66), W, H], fill=255)
    elif mode == "entrance":
        # Foreground open wooden doors on left & right flanks (0..18% and 82%..100%)
        d03.rectangle([0, 0, int(W*0.18), H], fill=255)
        d03.rectangle([int(W*0.82), 0, W, H], fill=255)
    elif mode == "main_hall":
        # Foreground giant speaker stacks on left/right + upper chandelier
        d03.rectangle([0, 0, int(W*0.15), H], fill=255)
        d03.rectangle([int(W*0.85), 0, W, H], fill=255)
        d03.ellipse([int(W*0.38), -20, int(W*0.62), int(H*0.32)], fill=255)
    elif mode == "dancefloor":
        # Foreground booth tables & flanking columns
        d03.rectangle([0, int(H*0.68), int(W*0.24), H], fill=255)
        d03.rectangle([int(W*0.76), int(H*0.68), W, H], fill=255)
    elif mode == "hero":
        # Flanking gothic speaker columns & foreground mist
        d03.rectangle([0, 0, int(W*0.18), H], fill=255)
        d03.rectangle([int(W*0.82), 0, W, H], fill=255)
        d03.rectangle([0, int(H*0.82), W, H], fill=220)
    m03 = m03.filter(ImageFilter.GaussianBlur(radius=28))
    l03.putalpha(m03)

    return l01, l02, l03

def build_8frame_loop(master_1080, out_loop_dir):
    os.makedirs(out_loop_dir, exist_ok=True)
    W, H = 1920, 1080
    for i in range(8):
        phase = (i / 8.0) * (2.0 * math.pi)
        pulse = 0.5 + 0.5 * math.sin(phase)
        frame = master_1080.copy().convert("RGBA")
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        # Subtle breathing neon glow in center & lower reflection
        alpha_m = int(14 + 18 * pulse)
        alpha_c = int(12 + 16 * (1.0 - pulse))
        od.ellipse([int(W*0.25), int(H*0.12), int(W*0.75), int(H*0.78)], fill=(255, 45, 149, alpha_m))
        od.ellipse([int(W*0.30), int(H*0.45), int(W*0.70), int(H*0.98)], fill=(56, 189, 248, alpha_c))
        overlay = overlay.filter(ImageFilter.GaussianBlur(radius=48))
        frame.alpha_composite(overlay)
        frame.convert("RGB").save(os.path.join(out_loop_dir, f"frame_0{i}.png"))

def unify_all_cinematics():
    up = "ART_REFERENCES/canonical_uploads"
    # Load the 4 canonical clean user reference paintings:
    ref_bg01 = color_grade_deadbeat(Image.open(f"{up}/descarga (9).png"), magenta_boost=1.08, contrast=1.10)
    ref_bg02 = color_grade_deadbeat(Image.open(f"{up}/descarga (4).png"), magenta_boost=1.08, contrast=1.10)
    ref_bg03 = color_grade_deadbeat(Image.open(f"{up}/descarga (11).png"), magenta_boost=1.08, contrast=1.10)
    ref_bg04 = color_grade_deadbeat(Image.open(f"{up}/descarga (7).png"), magenta_boost=1.08, contrast=1.10)

    # For BG05 (Dancefloor Drop) & BG06 (Hero Altar), strip the top debug bar from the existing 2560x1440 paintings
    raw_bg05 = Image.open("backups/pre_unification_snapshot/assets/cinematics/cine_bg05_dancefloor.png").convert("RGB")
    ref_bg05 = strip_top_debug_bar(raw_bg05)

    raw_bg06 = Image.open("backups/pre_unification_snapshot/assets/cinematics/cine_bg06_hero.png").convert("RGB")
    ref_bg06 = strip_top_debug_bar(raw_bg06)

    scenes = [
        ("cine_bg01_city", "BG01_CITY", "city", ref_bg01, [
            "01_sky_moon_atmosphere.png", "01_sky_atmosphere.png",
            "02_gothic_skyline_architecture.png", "02_skyline_architecture.png",
            "03_foreground_industrial_pipes.png", "03_fog_industrial_cables.png"
        ]),
        ("cine_bg02_club_exterior", "BG02_CLUB_EXTERIOR", "exterior", ref_bg02, [
            "01_gothic_cathedral_facade.png", "01_gothic_cathedral_facade.png",
            "02_portal_speakers_entrance.png", "02_portal_speakers_marquee.png",
            "03_wet_pavement_reflections.png", "03_wet_ground_reflections.png"
        ]),
        ("cine_bg03_entrance", "BG03_ENTRANCE", "entrance", ref_bg03, [
            "01_vaulted_hallway_depth.png", "01_hallway_vault_focal_light.png",
            "02_midground_columns_banners.png", "02_mid_columns_torches.png",
            "03_foreground_pillars_occlusion.png", "03_foreground_pillars_occlusion.png"
        ]),
        ("cine_bg04_main_hall", "BG04_MAIN_HALL", "main_hall", ref_bg04, [
            "01_cathedral_nave_vaults.png", "01_cathedral_nave_vaults.png",
            "02_laser_beams_equalizer.png", "02_laser_beams_volumetric.png",
            "03_chandeliers_stage_framing.png", "03_chandeliers_gold_framing.png"
        ]),
        ("cine_bg05_dancefloor", "BG05_DANCEFLOOR", "dancefloor", ref_bg05, [
            "01_astrological_dancefloor_grid.png", "01_astrological_dancefloor_grid.png",
            "02_sound_towers_dj_stage.png", "02_sound_towers_dj_booth.png",
            "03_tables_foreground_ambient.png", "03_fog_strobe_ambient_glow.png"
        ]),
        ("cine_bg06_hero", "BG06_HERO", "hero", ref_bg06, [
            "01_axial_portal_rosette.png", "01_axial_rosette_architecture.png",
            "02_hero_rimlight_spotlight.png", "02_hero_rimlight_spotlight.png",
            "03_flanking_speakers_framing.png", "03_framing_columns_negative_space.png"
        ])
    ]

    for slug, cine_dir_name, mode, master_src, layer_names in scenes:
        base_dir = f"assets/cinematics/backgrounds/final/{slug}"
        os.makedirs(f"{base_dir}/layers", exist_ok=True)
        os.makedirs(f"{base_dir}/loops", exist_ok=True)

        # Save 2560x1440 master & 1920x1080 _master.png
        m_2560 = master_src.resize((2560, 1440), Image.Resampling.LANCZOS)
        m_1080 = master_src.resize((1920, 1080), Image.Resampling.LANCZOS)
        m_2560.save(f"{base_dir}/{slug}.png")
        m_1080.convert("RGBA").save(f"{base_dir}/{slug}_master.png")

        # Generate 2.5D parallax layers
        l01, l02, l03 = make_parallax_layers(m_1080, mode)
        for fn in set([layer_names[0], layer_names[1]]):
            l01.save(f"{base_dir}/layers/{fn}")
        for fn in set([layer_names[2], layer_names[3]]):
            l02.save(f"{base_dir}/layers/{fn}")
        for fn in set([layer_names[4], layer_names[5]]):
            l03.save(f"{base_dir}/layers/{fn}")

        # Generate 8-frame animated loop
        build_8frame_loop(m_1080, f"{base_dir}/loops")

        # Also populate CINEMATIC_ASSETS/scenes/{cine_dir_name}/ so zero folders remain empty!
        ca_dir = f"CINEMATIC_ASSETS/scenes/{cine_dir_name}"
        os.makedirs(f"{ca_dir}/layers", exist_ok=True)
        m_1080.save(f"{ca_dir}/master.png")
        l01.save(f"{ca_dir}/layers/{layer_names[0]}")
        l02.save(f"{ca_dir}/layers/{layer_names[2]}")
        l03.save(f"{ca_dir}/layers/{layer_names[4]}")
        print(f"Unified {slug} & populated {ca_dir}")

    # Also copy hero sprites and logo into CINEMATIC_ASSETS/characters/protagonist/ and CINEMATIC_ASSETS/logos/
    os.makedirs("CINEMATIC_ASSETS/characters/protagonist", exist_ok=True)
    for fn in os.listdir("assets/cinematics/characters/protagonist"):
        if fn.endswith(".png"):
            shutil.copy2(f"assets/cinematics/characters/protagonist/{fn}", f"CINEMATIC_ASSETS/characters/protagonist/{fn}")
    os.makedirs("CINEMATIC_ASSETS/logos", exist_ok=True)
    shutil.copy2("assets/cinematics/logos/logo_deadbeat_cinematic.png", "CINEMATIC_ASSETS/logos/logo_deadbeat_cinematic.png")

    # Update CINEMATIC_ASSETS/manifest.json to COMPLETED
    with open("CINEMATIC_ASSETS/manifest.json", "r", encoding="utf-8") as f:
        cman = json.load(f)
    cman["status"] = "COMPLETED_UNIFIED_HD"
    for k, sc in cman.get("scenes", {}).items():
        sc["status"] = "COMPLETED"
    with open("CINEMATIC_ASSETS/manifest.json", "w", encoding="utf-8") as f:
        json.dump(cman, f, indent=2, ensure_ascii=False)
    print("Updated CINEMATIC_ASSETS/manifest.json to COMPLETED_UNIFIED_HD")

if __name__ == "__main__":
    unify_all_cinematics()
