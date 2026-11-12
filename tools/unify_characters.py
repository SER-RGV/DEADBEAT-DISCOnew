import os, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

def remove_neutral_checkerboard(im, region_box=None, lum_min=155, diff_max=18, replace_rgba=(0, 0, 0, 0)):
    im = im.convert("RGBA")
    arr = np.array(im)
    H, W, _ = arr.shape
    x0, y0, x1, y1 = region_box if region_box else (0, 0, W, H)
    sub = arr[y0:y1, x0:x1]
    r = sub[:,:,0].astype(int)
    g = sub[:,:,1].astype(int)
    b = sub[:,:,2].astype(int)
    a = sub[:,:,3].astype(int)
    max_diff = np.maximum(np.abs(r-g), np.maximum(np.abs(g-b), np.abs(r-b)))
    lum = (r + g + b) // 3
    mask = (a > 0) & (max_diff <= diff_max) & (lum >= lum_min)
    sub[mask] = replace_rgba
    arr[y0:y1, x0:x1] = sub
    return Image.fromarray(arr, "RGBA")

def clean_npc_armorer():
    p = "backups/pre_unification_snapshot/assets/characters/npc_armorer_hub.png"
    im = Image.open(p).convert("RGBA")
    arr = np.array(im)
    H, W, _ = arr.shape
    r, g, b, a = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int), arr[:,:,3].astype(int)
    max_diff = np.maximum(np.abs(r-g), np.maximum(np.abs(g-b), np.abs(r-b)))
    lum = (r + g + b) // 3
    # Remove neutral white/grey checkerboard between boots (y > 220, x in 95..155) and floating dust specks
    boot_gap = np.zeros((H, W), dtype=bool)
    boot_gap[220:312, 95:160] = True
    mask_boots = boot_gap & (a > 0) & (max_diff <= 22) & (lum >= 145)
    arr[mask_boots] = [0, 0, 0, 0]
    # Remove isolated stray specks outside main silhouette
    specks = (a > 0) & (lum >= 160) & (max_diff <= 20)
    # Keep skin/eyes/horns inside head/chest (y in 30..160, x in 85..170)
    interior = np.zeros((H, W), dtype=bool)
    interior[35:230, 75:185] = True
    arr[specks & (~interior)] = [0, 0, 0, 0]
    out = Image.fromarray(arr, "RGBA")
    out.save("assets/characters/npc_armorer_hub.png")
    print("Cleaned npc_armorer_hub.png")

def clean_npc_dj():
    p = "backups/pre_unification_snapshot/assets/characters/npc_dj_booth_world.png"
    im = Image.open(p).convert("RGBA")
    # Behind left elbow: x in 215..250, y in 95..160
    im = remove_neutral_checkerboard(im, region_box=(210, 90, 255, 165), lum_min=145, diff_max=22)
    im.save("assets/characters/npc_dj_booth_world.png")
    print("Cleaned npc_dj_booth_world.png")

def clean_player_boost():
    p = "backups/pre_unification_snapshot/assets/characters/player_boost_00.png"
    im = Image.open(p).convert("RGBA")
    arr = np.array(im)
    r, g, b, a = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int), arr[:,:,3].astype(int)
    max_diff = np.maximum(np.abs(r-g), np.maximum(np.abs(g-b), np.abs(r-b)))
    lum = (r + g + b) // 3
    # Neutral white/grey checkerboard trapped inside the sonic trail (x < 170, y > 170)
    H, W, _ = arr.shape
    region = np.zeros((H, W), dtype=bool)
    region[165:312, 10:175] = True
    mask = region & (a > 0) & (max_diff <= 24) & (lum >= 135)
    arr[mask] = [0, 0, 0, 0]
    out = Image.fromarray(arr, "RGBA")
    out.save("assets/characters/player_boost_00.png")
    print("Cleaned player_boost_00.png")

def build_unified_protagonist_frames():
    w0 = Image.open("backups/pre_unification_snapshot/assets/characters/player_walk_00.png").convert("RGBA")
    w1 = Image.open("backups/pre_unification_snapshot/assets/characters/player_walk_01.png").convert("RGBA")
    w2_orig = Image.open("backups/pre_unification_snapshot/assets/characters/player_walk_02.png").convert("RGBA")
    shoot = Image.open("backups/pre_unification_snapshot/assets/characters/player_shoot_00.png").convert("RGBA")
    fire2 = Image.open("backups/pre_unification_snapshot/assets/characters/player_fire2.png").convert("RGBA")

    # 1. Reconstruct player_idle_00.png (224x320):
    # Upper body (y=0..176) from w0 (relaxed arms, sleeveless vest with magenta neon piping, full arm tattoo)
    # Lower body (y=172..320) from shoot (planted balanced combat stance legs, centered under torso)
    idle = Image.new("RGBA", (224, 320), (0, 0, 0, 0))
    # Crop shoot legs (y=168..320) and center horizontally under w0 torso (shoot is 240w, w0 is 224w -> offset -8)
    shoot_legs = shoot.crop((8, 168, 232, 320))
    idle.alpha_composite(shoot_legs, (0, 168))
    # Upper torso from w1 (more upright relaxed arm posture) y=0..174
    w1_upper = w1.crop((0, 0, 224, 174))
    # Clear overlapping slice y=168..172 cleanly
    idle_arr = np.array(idle)
    idle_arr[:170, :, :] = 0
    idle = Image.fromarray(idle_arr, "RGBA")
    idle.alpha_composite(w1_upper, (0, 0))
    # Add subtle glowing magenta Debt Fissure ("La Marca del Sello") on chest/collar
    draw_idle = ImageDraw.Draw(idle)
    draw_idle.line([(122, 86), (126, 98), (123, 108)], fill=(255, 45, 149, 210), width=2)
    idle.save("assets/characters/player_idle_00.png")
    idle.save("assets/cinematics/characters/protagonist/hero_idle_00.png")
    print("Built unified player_idle_00.png & hero_idle_00.png")

    # 2. Unify player_walk_02.png (224x320):
    # w2_orig had a short sleeve hiding the upper arm tattoo; graft w0's sleeveless tattooed upper torso (y=0..172)
    # onto w2_orig's opposite-leg stride (y=170..320) so all 4 walk frames have identical sleeveless vest & tattoo!
    w2 = Image.new("RGBA", (224, 320), (0, 0, 0, 0))
    w2_legs = w2_orig.crop((0, 170, 224, 320))
    w2.alpha_composite(w2_legs, (0, 170))
    w0_upper = w0.crop((0, 0, 224, 172))
    w2.alpha_composite(w0_upper, (0, 0))
    w2.save("assets/characters/player_walk_02.png")
    w2.save("assets/cinematics/characters/protagonist/hero_walk_02.png")
    print("Built unified player_walk_02.png & hero_walk_02.png")

    # 3. Reconstruct player_walk_03.png (224x320):
    # Frame 03 of the 4-frame walk cycle is the passing/recovery stride between w2 (wide stride) and w0.
    # Combine w1's passing legs shifted slightly back with w0's upper torso + slight 2px vertical passing lift.
    w3 = Image.new("RGBA", (224, 320), (0, 0, 0, 0))
    w1_legs = w1.crop((0, 170, 224, 320))
    w3.alpha_composite(w1_legs, (2, 170))
    w1_torso = w1.crop((0, 0, 224, 172))
    w3.alpha_composite(w1_torso, (1, 1))
    w3.save("assets/characters/player_walk_03.png")
    w3.save("assets/cinematics/characters/protagonist/hero_walk_03.png")
    print("Built unified player_walk_03.png & hero_walk_03.png")

    # Also ensure hero_walk_00, hero_walk_01, hero_shoot_00 are synced
    w0.save("assets/cinematics/characters/protagonist/hero_walk_00.png")
    w1.save("assets/cinematics/characters/protagonist/hero_walk_01.png")
    shoot.save("assets/cinematics/characters/protagonist/hero_shoot_00.png")

    # 4. Reconstruct player_firehip.png (256x320):
    # Full-body rapid hip-fire stance sharing waist y=173, head y=24, boots y=312!
    # Base from shoot/fire2 legs + lower-angled rapid-fire weapon arm & dual magenta-cyan muzzle burst
    hip = Image.new("RGBA", (256, 320), (0, 0, 0, 0))
    # Place fire2 legs & torso centered (fire2 is 280x320 -> crop 12..268)
    f2_body = fire2.crop((12, 0, 268, 320))
    hip.alpha_composite(f2_body, (0, 0))
    # Add cyan/magenta dual harmonic muzzle flash at barrel tip (x=222, y=100)
    glow = Image.new("RGBA", (256, 320), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([204, 84, 248, 122], fill=(56, 189, 248, 110))
    gdraw.ellipse([212, 90, 242, 116], fill=(255, 45, 149, 180))
    gdraw.polygon([(220, 103), (254, 95), (242, 103), (254, 111)], fill=(248, 250, 252, 240))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=1.2))
    hip.alpha_composite(glow)
    hip.save("assets/characters/player_firehip.png")
    print("Built unified full-body player_firehip.png")

    # 5. Export normalized 8-directional views from ART_ASSETS/tanda_03/fase_b/ into assets/characters/
    dirs = ["E", "SE", "S", "SO", "O", "NO", "N", "NE"]
    for d in dirs:
        src_p = f"ART_ASSETS/tanda_03/fase_b/{d}.png"
        if os.path.exists(src_p):
            dim = Image.open(src_p).convert("RGBA")
            # Normalize to 224x320 canvas with head at y=24, feet at y=312 (height 288)
            target_h = 288
            scale = target_h / max(1, dim.height)
            target_w = max(1, int(round(dim.width * scale)))
            dim_s = dim.resize((target_w, target_h), Image.Resampling.LANCZOS)
            canv = Image.new("RGBA", (224, 320), (0, 0, 0, 0))
            ox = (224 - target_w) // 2
            oy = 312 - target_h
            canv.alpha_composite(dim_s, (ox, oy))
            canv.save(f"assets/characters/player_dir_{d}.png")
    print("Exported 8 normalized directional sprites player_dir_E..NE.png")

    # 6. Build Protagonist Master Sprite Atlas (assets/atlases/protagonist_atlas.png + .json)
    os.makedirs("assets/atlases", exist_ok=True)
    atlas_frames = [
        ("player_idle_00", "assets/characters/player_idle_00.png"),
        ("player_walk_00", "assets/characters/player_walk_00.png"),
        ("player_walk_01", "assets/characters/player_walk_01.png"),
        ("player_walk_02", "assets/characters/player_walk_02.png"),
        ("player_walk_03", "assets/characters/player_walk_03.png"),
        ("player_shoot_00", "assets/characters/player_shoot_00.png"),
        ("player_fire2", "assets/characters/player_fire2.png"),
        ("player_firehip", "assets/characters/player_firehip.png"),
        ("player_hurt_00", "assets/characters/player_hurt_00.png"),
        ("player_roll_00", "assets/characters/player_roll_00.png"),
        ("player_boost_00", "assets/characters/player_boost_00.png"),
        ("player_death_00", "assets/characters/player_death_00.png"),
        ("player_dir_E", "assets/characters/player_dir_E.png"),
        ("player_dir_SE", "assets/characters/player_dir_SE.png"),
        ("player_dir_S", "assets/characters/player_dir_S.png"),
        ("player_dir_SO", "assets/characters/player_dir_SO.png"),
        ("player_dir_O", "assets/characters/player_dir_O.png"),
        ("player_dir_NO", "assets/characters/player_dir_NO.png"),
        ("player_dir_N", "assets/characters/player_dir_N.png"),
        ("player_dir_NE", "assets/characters/player_dir_NE.png"),
    ]
    cell_w, cell_h = 352, 320
    cols = 5
    rows = math.ceil(len(atlas_frames) / cols)
    atlas_im = Image.new("RGBA", (cols * cell_w, rows * cell_h), (0, 0, 0, 0))
    atlas_meta = {
        "atlas": "assets/atlases/protagonist_atlas.png",
        "character": "El Desafinado",
        "cell_size": [cell_w, cell_h],
        "ground_y": 312,
        "waist_split_y": 173,
        "frames": {}
    }
    for idx, (fid, fp) in enumerate(atlas_frames):
        r, c = divmod(idx, cols)
        fim = Image.open(fp).convert("RGBA")
        ox = c * cell_w + (cell_w - fim.width) // 2
        oy = r * cell_h + (cell_h - fim.height)
        atlas_im.alpha_composite(fim, (ox, oy))
        atlas_meta["frames"][fid] = {
            "x": ox, "y": oy, "w": fim.width, "h": fim.height,
            "pivot": [ox + fim.width // 2, r * cell_h + 312],
            "source": fp
        }
    atlas_im.save("assets/atlases/protagonist_atlas.png")
    with open("assets/atlases/protagonist_atlas.json", "w", encoding="utf-8") as f:
        json.dump(atlas_meta, f, indent=2)
    print("Saved assets/atlases/protagonist_atlas.png & .json")

if __name__ == "__main__":
    clean_npc_armorer()
    clean_npc_dj()
    clean_player_boost()
    build_unified_protagonist_frames()
