import os, shutil
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

boss_dir = "assets/bosses"
snap_boss_dir = "/tmp/pre_unification_snapshot/assets/bosses"

# 1. Restore boss_03_cajero_idle, attack, death from pre_unification_snapshot (canonical gold-medallion banker)
for st in ["idle", "attack", "death"]:
    src = os.path.join(snap_boss_dir, f"boss_03_cajero_{st}.png")
    dst = os.path.join(boss_dir, f"boss_03_cajero_{st}.png")
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"Restored distinct canonical {dst} from snapshot")

def make_attack_from_idle(idle_path, out_path, accent_rgb=(192, 38, 211), secondary_rgb=(56, 189, 248)):
    im = Image.open(idle_path).convert("RGBA")
    w, h = im.size
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    
    # Dynamic forward lunge pose (slight scale + forward tilt)
    lunged = im.resize((int(w * 1.04), int(h * 1.04)), Image.Resampling.LANCZOS)
    lunged = lunged.rotate(-5, resample=Image.Resampling.BICUBIC, expand=False)
    ox = (w - lunged.width) // 2 + 4
    oy = (h - lunged.height) // 2
    
    # Draw energy slash / arcane burst aura behind and in front
    fx = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(fx)
    cx, cy = w // 2, h // 2
    # Outer energy crescent / shockwave arcs
    for r_scale, col, width in [
        (0.44, (*accent_rgb, 210), 10),
        (0.39, (*secondary_rgb, 230), 6),
        (0.34, (255, 240, 200, 220), 4),
    ]:
        rx, ry = int(w * r_scale), int(h * r_scale)
        d.arc([cx - rx, cy - ry, cx + rx, cy + ry], start=-65, end=75, fill=col, width=width)
        d.arc([cx - rx - 8, cy - ry + 6, cx + rx - 8, cy + ry + 6], start=125, end=235, fill=(*accent_rgb, 145), width=max(2, width - 3))
    fx_blur = fx.filter(ImageFilter.GaussianBlur(4))
    
    canvas.alpha_composite(fx_blur)
    canvas.alpha_composite(lunged, (ox, oy))
    canvas.alpha_composite(fx)
    canvas.save(out_path, format="PNG", optimize=True)
    print(f"Generated canonical-identity attack sprite: {out_path}")

def make_hit_from_idle(idle_path, out_path, flash_rgb=(255, 45, 149), rim_rgb=(56, 189, 248)):
    im = Image.open(idle_path).convert("RGBA")
    w, h = im.size
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    
    # Backward recoil tilt + slight squash
    recoiled = im.resize((int(w * 0.96), int(h * 0.98)), Image.Resampling.LANCZOS)
    recoiled = recoiled.rotate(8, resample=Image.Resampling.BICUBIC, expand=False)
    
    # Subtle hit flash tint on non-transparent pixels while preserving full costume/character detail
    arr = np.array(recoiled).astype(np.float32)
    alpha = arr[:, :, 3:4] / 255.0
    # Brighten and tint slightly toward flash_rgb on edges/highlights
    arr[:, :, 0] = np.clip(arr[:, :, 0] * 1.15 + flash_rgb[0] * 0.14, 0, 255)
    arr[:, :, 1] = np.clip(arr[:, :, 1] * 1.05 + rim_rgb[1] * 0.08, 0, 255)
    arr[:, :, 2] = np.clip(arr[:, :, 2] * 1.15 + rim_rgb[2] * 0.14, 0, 255)
    recoiled = Image.fromarray(arr.astype(np.uint8), "RGBA")
    
    # Impact spark lines around torso
    fx = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(fx)
    cx, cy = int(w * 0.48), int(h * 0.46)
    for dx, dy in [(-42, -28), (44, -22), (-36, 26), (40, 30), (0, -46), (18, 42)]:
        d.line([(cx + dx // 3, cy + dy // 3), (cx + dx, cy + dy)], fill=(*rim_rgb, 235), width=3)
        d.line([(cx + dx // 2, cy + dy // 2), (cx + int(dx * 1.15), cy + int(dy * 1.15))], fill=(255, 255, 255, 220), width=2)
    fx_blur = fx.filter(ImageFilter.GaussianBlur(2))
    
    ox = (w - recoiled.width) // 2 - 4
    oy = (h - recoiled.height) // 2 + 2
    canvas.alpha_composite(recoiled, (ox, oy))
    canvas.alpha_composite(fx_blur)
    canvas.alpha_composite(fx)
    canvas.save(out_path, format="PNG", optimize=True)
    print(f"Generated canonical-identity hit sprite: {out_path}")

def make_death_from_idle(idle_path, out_path, soul_rgb=(255, 45, 149)):
    im = Image.open(idle_path).convert("RGBA")
    w, h = im.size
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    
    # Crop tight around character first
    arr = np.array(im)
    ys, xs = np.where(arr[:, :, 3] > 15)
    char_crop = im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    
    # Rotate ~82 degrees so the character lies collapsed on the floor at the bottom of the frame
    fallen = char_crop.rotate(-82, resample=Image.Resampling.BICUBIC, expand=True)
    # Fit nicely into (w * 0.86, h * 0.52)
    fallen.thumbnail((int(w * 0.86), int(h * 0.52)), Image.Resampling.LANCZOS)
    
    # Slightly darken/desaturate fallen body + add soul-dissipation embers rising above
    f_arr = np.array(fallen).astype(np.float32)
    f_arr[:, :, :3] = np.clip(f_arr[:, :, :3] * 0.82, 0, 255)
    fallen = Image.fromarray(f_arr.astype(np.uint8), "RGBA")
    
    fx = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(fx)
    bx = (w - fallen.width) // 2
    by = int(h * 0.84) - fallen.height
    # Ground shadow pool
    d.ellipse([bx + 8, by + fallen.height - 22, bx + fallen.width - 8, by + fallen.height + 8], fill=(8, 2, 16, 180))
    # Dissolving neon embers above fallen boss
    for ex, ey, er in [(w*0.36, by-12, 5), (w*0.48, by-24, 7), (w*0.58, by-16, 6), (w*0.44, by-36, 4), (w*0.64, by-28, 5)]:
        d.ellipse([ex-er, ey-er, ex+er, ey+er], fill=(*soul_rgb, 210))
    fx_blur = fx.filter(ImageFilter.GaussianBlur(3))
    
    canvas.alpha_composite(fx_blur)
    canvas.alpha_composite(fallen, (bx, by))
    canvas.save(out_path, format="PNG", optimize=True)
    print(f"Generated canonical-identity death sprite: {out_path}")

# Reconstruct mismatched boss states from each boss's canonical idle sprite:
# 1) boss_00_anden: fix hit (was teal/red coat)
make_hit_from_idle(f"{boss_dir}/boss_00_anden_idle.png", f"{boss_dir}/boss_00_anden_hit.png", (192, 38, 211), (56, 189, 248))

# 2) boss_01_magneta: ensure hit matches crimson horned diva idle 100%
make_hit_from_idle(f"{boss_dir}/boss_01_magneta_idle.png", f"{boss_dir}/boss_01_magneta_hit.png", (255, 45, 149), (246, 196, 83))

# 3) boss_02_bufe: fix attack, hit, death (were white-toque human chef instead of horned demon banquet master)
make_attack_from_idle(f"{boss_dir}/boss_02_bufe_idle.png", f"{boss_dir}/boss_02_bufe_attack.png", (245, 158, 11), (239, 68, 68))
make_hit_from_idle(f"{boss_dir}/boss_02_bufe_idle.png", f"{boss_dir}/boss_02_bufe_hit.png", (245, 158, 11), (255, 45, 149))
make_death_from_idle(f"{boss_dir}/boss_02_bufe_idle.png", f"{boss_dir}/boss_02_bufe_death.png", (245, 158, 11))

# 4) boss_03_cajero: fix hit from restored gold-medallion banker idle
make_hit_from_idle(f"{boss_dir}/boss_03_cajero_idle.png", f"{boss_dir}/boss_03_cajero_hit.png", (250, 204, 21), (56, 189, 248))

# 5) boss_05_oficiante: fix attack, hit, death from canonical black/silver Gothic Bishop idle
make_attack_from_idle(f"{boss_dir}/boss_05_oficiante_idle.png", f"{boss_dir}/boss_05_oficiante_attack.png", (168, 85, 247), (250, 204, 21))
make_hit_from_idle(f"{boss_dir}/boss_05_oficiante_idle.png", f"{boss_dir}/boss_05_oficiante_hit.png", (168, 85, 247), (56, 189, 248))
make_death_from_idle(f"{boss_dir}/boss_05_oficiante_idle.png", f"{boss_dir}/boss_05_oficiante_death.png", (168, 85, 247))

# 6) boss_06_matarife: fix hit from canonical horned bronze butcher idle (was silver knight)
make_hit_from_idle(f"{boss_dir}/boss_06_matarife_idle.png", f"{boss_dir}/boss_06_matarife_hit.png", (251, 113, 133), (245, 158, 11))

# 7) boss_10_arquitecto: fix attack (was female priestess) and create missing hit and death from spiked Sovereign idle
make_attack_from_idle(f"{boss_dir}/boss_10_arquitecto_idle.png", f"{boss_dir}/boss_10_arquitecto_attack.png", (168, 85, 247), (56, 189, 248))
make_hit_from_idle(f"{boss_dir}/boss_10_arquitecto_idle.png", f"{boss_dir}/boss_10_arquitecto_hit.png", (168, 85, 247), (56, 189, 248))
make_death_from_idle(f"{boss_dir}/boss_10_arquitecto_idle.png", f"{boss_dir}/boss_10_arquitecto_death.png", (168, 85, 247))
