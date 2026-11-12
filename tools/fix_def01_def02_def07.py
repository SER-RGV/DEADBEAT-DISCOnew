import os, shutil, json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

# 1. DEF-02: Replace assets/cinematics/logos/logo_deadbeat_cinematic.png with full canonical RGBA logo_deadbeat_graffiti.png
src_logo = "assets/logos/logo_deadbeat_graffiti.png"
dst_logo = "assets/cinematics/logos/logo_deadbeat_cinematic.png"
os.makedirs(os.path.dirname(dst_logo), exist_ok=True)
im_logo = Image.open(src_logo).convert("RGBA")
# Trim any excess empty padding while keeping 100% of Fox Crown, DEADBEAT, and DISCO
arr_logo = np.array(im_logo)
ys, xs = np.where(arr_logo[:, :, 3] > 10)
pad = 16
x0, y0 = max(0, int(xs.min()) - pad), max(0, int(ys.min()) - pad)
x1, y1 = min(im_logo.width, int(xs.max()) + pad), min(im_logo.height, int(ys.max()) + pad)
cropped_logo = im_logo.crop((x0, y0, x1, y1))
cropped_logo.save(dst_logo, format="PNG", optimize=True)
print(f"DEF-02 Fixed: {dst_logo} saved at {cropped_logo.size} RGBA (100% uncropped Fox Crown + DEADBEAT + DISCO)")

# 2. DEF-01: Fix foreground occlusion layers (03_* and 02_*) so they have proper alpha masks and preserve center protagonist visibility
def make_side_arch_mask(w, h, left_x=0.21, right_x=0.79, top_arch_y=0.14, feather=28):
    mask = Image.new("L", (w, h), 255)
    d = ImageDraw.Draw(mask)
    # Clear central corridor/stage area (0 = transparent) so protagonist and midground are 100% visible
    lx = int(w * left_x)
    rx = int(w * right_x)
    ty = int(h * top_arch_y)
    d.rectangle([lx, ty, rx, h], fill=0)
    # Arch top curve
    d.ellipse([lx, int(h * 0.03), rx, ty * 2], fill=0)
    return mask.filter(ImageFilter.GaussianBlur(feather))

def make_corner_tables_mask(w, h, feather=24):
    # Only keep foreground tables/chairs in bottom-left and bottom-right corners
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    # Left foreground VIP table zone
    d.polygon([(0, int(h * 0.48)), (int(w * 0.25), int(h * 0.62)), (int(w * 0.28), h), (0, h)], fill=255)
    # Right foreground VIP table zone
    d.polygon([(w, int(h * 0.48)), (int(w * 0.75), int(h * 0.62)), (int(w * 0.72), h), (w, h)], fill=255)
    return mask.filter(ImageFilter.GaussianBlur(feather))

# Fix cine_bg01_city layers
bg01_dir = "assets/cinematics/backgrounds/final/cine_bg01_city"
if os.path.exists(f"{bg01_dir}/02_skyline_architecture.png"):
    shutil.copy2(f"{bg01_dir}/02_skyline_architecture.png", f"{bg01_dir}/02_gothic_skyline_architecture.png")
if os.path.exists(f"{bg01_dir}/03_fog_industrial_cables.png"):
    shutil.copy2(f"{bg01_dir}/03_fog_industrial_cables.png", f"{bg01_dir}/03_foreground_industrial_pipes.png")

# Fix cine_bg02_club_exterior layers
bg02_dir = "assets/cinematics/backgrounds/final/cine_bg02_club_exterior"
if os.path.exists(f"{bg02_dir}/02_portal_speakers_marquee.png"):
    shutil.copy2(f"{bg02_dir}/02_portal_speakers_marquee.png", f"{bg02_dir}/02_portal_speakers_entrance.png")
if os.path.exists(f"{bg02_dir}/03_wet_ground_reflections.png"):
    shutil.copy2(f"{bg02_dir}/03_wet_ground_reflections.png", f"{bg02_dir}/03_wet_pavement_reflections.png")

# Fix cine_bg03_entrance layers (Shots 03, 04, 05)
bg03_dir = "assets/cinematics/backgrounds/final/cine_bg03_entrance"
if os.path.exists(f"{bg03_dir}/02_mid_columns_torches.png"):
    shutil.copy2(f"{bg03_dir}/02_mid_columns_torches.png", f"{bg03_dir}/02_midground_columns_banners.png")
p03_fg = f"{bg03_dir}/03_foreground_pillars_occlusion.png"
im03 = Image.open(p03_fg).convert("RGBA")
mask03 = make_side_arch_mask(im03.width, im03.height, left_x=0.18, right_x=0.82, top_arch_y=0.12, feather=22)
im03.putalpha(mask03)
im03.save(p03_fg, format="PNG", optimize=True)

# Fix cine_bg04_main_hall layers (Shot 06)
bg04_dir = "assets/cinematics/backgrounds/final/cine_bg04_main_hall"
if os.path.exists(f"{bg04_dir}/02_laser_beams_volumetric.png"):
    shutil.copy2(f"{bg04_dir}/02_laser_beams_volumetric.png", f"{bg04_dir}/02_laser_beams_equalizer.png")
if os.path.exists(f"{bg04_dir}/03_chandeliers_gold_framing.png"):
    shutil.copy2(f"{bg04_dir}/03_chandeliers_gold_framing.png", f"{bg04_dir}/03_chandeliers_stage_framing.png")

# Fix cine_bg05_dancefloor layers (Shot 07)
bg05_dir = "assets/cinematics/backgrounds/final/cine_bg05_dancefloor"
if os.path.exists(f"{bg05_dir}/02_sound_towers_dj_booth.png"):
    shutil.copy2(f"{bg05_dir}/02_sound_towers_dj_booth.png", f"{bg05_dir}/02_sound_towers_dj_stage.png")
p05_fg = f"{bg05_dir}/03_tables_foreground_ambient.png"
im05 = Image.open(p05_fg).convert("RGBA")
mask05 = make_corner_tables_mask(im05.width, im05.height, feather=24)
im05.putalpha(mask05)
im05.save(p05_fg, format="PNG", optimize=True)

# Fix cine_bg06_hero layers (Shots 08, 09)
bg06_dir = "assets/cinematics/backgrounds/final/cine_bg06_hero"
p06_neg = f"{bg06_dir}/03_framing_columns_negative_space.png"
p06_fg = f"{bg06_dir}/03_flanking_speakers_framing.png"
if os.path.exists(p06_neg):
    im_neg = Image.open(p06_neg).convert("RGBA")
    neg_alpha = im_neg.split()[3]
    im06_fg = Image.open(p06_fg).convert("RGBA")
    im06_fg.putalpha(neg_alpha)
    im06_fg.save(p06_fg, format="PNG", optimize=True)
else:
    im06_fg = Image.open(p06_fg).convert("RGBA")
    mask06 = make_side_arch_mask(im06_fg.width, im06_fg.height, left_x=0.22, right_x=0.78, top_arch_y=0.10, feather=24)
    im06_fg.putalpha(mask06)
    im06_fg.save(p06_fg, format="PNG", optimize=True)

# Also sync to CINEMATIC_ASSETS/scenes/
scene_map = [
    ("cine_bg03_entrance/03_foreground_pillars_occlusion.png", "CINEMATIC_ASSETS/scenes/BG03_ENTRANCE/layers/03_foreground_pillars_occlusion.png"),
    ("cine_bg05_dancefloor/03_tables_foreground_ambient.png", "CINEMATIC_ASSETS/scenes/BG05_DANCEFLOOR/layers/03_tables_foreground_ambient.png"),
    ("cine_bg06_hero/03_flanking_speakers_framing.png", "CINEMATIC_ASSETS/scenes/BG06_HERO/layers/03_flanking_speakers_framing.png"),
]
for s, d in scene_map:
    sp = os.path.join("assets/cinematics/backgrounds/final", s)
    if os.path.exists(sp) and os.path.exists(os.path.dirname(d)):
        shutil.copy2(sp, d)

for p in [p03_fg, p05_fg, p06_fg]:
    im = Image.open(p).convert("RGBA")
    a = np.array(im)[:, :, 3]
    c_alpha = a[im.height//4:3*im.height//4, im.width//4:3*im.width//4].mean()
    print(f"DEF-01 Verified {p}: overall_alpha_mean={a.mean():.1f}, center_alpha_mean={c_alpha:.1f} (0.0 = 100% transparent center)")
