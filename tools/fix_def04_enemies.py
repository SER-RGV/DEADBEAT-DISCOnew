import os, shutil
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

enemy_dir = "assets/enemies"
snap_enemy_dir = "/tmp/pre_unification_snapshot/assets/enemies"

# Save the original distinct tripod and berserker sprites before overwriting so we can use them to differentiate tanda_E01!
orig_tripod = Image.open(f"{snap_enemy_dir}/enemy_drone_windup.png").convert("RGBA")
orig_berserker = Image.open(f"{snap_enemy_dir}/enemy_fanatic_windup.png").convert("RGBA")

# 1. Fix enemy_drone_windup.png and enemy_drone_death.png from canonical floating sphere enemy_drone_walk.png
drone_walk = Image.open(f"{enemy_dir}/enemy_drone_walk.png").convert("RGBA")
w, h = drone_walk.size

# enemy_drone_windup: coiled floating sphere with charging crimson/cyan targeting laser rings
dw_canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
scaled_drone = drone_walk.resize((int(w * 1.05), int(h * 1.05)), Image.Resampling.LANCZOS)
scaled_drone = scaled_drone.rotate(-6, resample=Image.Resampling.BICUBIC, expand=False)
arr_d = np.array(scaled_drone).astype(np.float32)
arr_d[:, :, 0] = np.clip(arr_d[:, :, 0] * 1.18 + 28, 0, 255)
arr_d[:, :, 2] = np.clip(arr_d[:, :, 2] * 1.12 + 18, 0, 255)
scaled_drone = Image.fromarray(arr_d.astype(np.uint8), "RGBA")

fx = Image.new("RGBA", (w, h), (0, 0, 0, 0))
d = ImageDraw.Draw(fx)
cx, cy = int(w * 0.54), int(h * 0.48)
for rad, col, width in [(86, (255, 45, 149, 210), 4), (66, (56, 189, 248, 230), 3), (42, (250, 204, 21, 240), 3)]:
    d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=col, width=width)
# Targeting laser telegraph beam to the right
d.line([(cx + 20, cy), (w - 8, cy)], fill=(255, 45, 149, 235), width=5)
d.line([(cx + 20, cy), (w - 8, cy)], fill=(255, 255, 255, 220), width=2)
fx_blur = fx.filter(ImageFilter.GaussianBlur(2))

dw_canvas.alpha_composite(scaled_drone, ((w - scaled_drone.width) // 2, (h - scaled_drone.height) // 2))
dw_canvas.alpha_composite(fx_blur)
dw_canvas.alpha_composite(fx)
dw_canvas.save(f"{enemy_dir}/enemy_drone_windup.png", format="PNG", optimize=True)
print("Fixed enemy_drone_windup.png (consistent floating eye-sphere drone identity)")

# enemy_drone_death: shattered/collapsed floating eye-sphere drone on floor with sparks
dd_canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
arr_walk = np.array(drone_walk)
ys, xs = np.where(arr_walk[:, :, 3] > 15)
crop_d = drone_walk.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
fallen_d = crop_d.rotate(-68, resample=Image.Resampling.BICUBIC, expand=True)
fallen_d.thumbnail((int(w * 0.72), int(h * 0.56)), Image.Resampling.LANCZOS)
arr_fd = np.array(fallen_d).astype(np.float32)
arr_fd[:, :, :3] = np.clip(arr_fd[:, :, :3] * 0.78, 0, 255)
fallen_d = Image.fromarray(arr_fd.astype(np.uint8), "RGBA")

fx_d = Image.new("RGBA", (w, h), (0, 0, 0, 0))
dd_draw = ImageDraw.Draw(fx_d)
bx = (w - fallen_d.width) // 2
by = int(h * 0.84) - fallen_d.height
dd_draw.ellipse([bx + 6, by + fallen_d.height - 18, bx + fallen_d.width - 6, by + fallen_d.height + 6], fill=(8, 2, 16, 180))
# Fracture lines & electric arcs
for dx, dy in [(-28, -18), (32, -22), (-20, 14), (26, 16)]:
    dd_draw.line([(w // 2, by + fallen_d.height // 2), (w // 2 + dx, by + fallen_d.height // 2 + dy)], fill=(56, 189, 248, 230), width=3)
dd_canvas.alpha_composite(fx_d.filter(ImageFilter.GaussianBlur(2)))
dd_canvas.alpha_composite(fallen_d, (bx, by))
dd_canvas.alpha_composite(fx_d)
dd_canvas.save(f"{enemy_dir}/enemy_drone_death.png", format="PNG", optimize=True)
print("Fixed enemy_drone_death.png (consistent floating eye-sphere drone identity)")

# 2. Fix enemy_elite_windup.png from canonical full-height horned dark-armor enemy_elite_walk.png
elite_walk = Image.open(f"{enemy_dir}/enemy_elite_walk.png").convert("RGBA")
ew, eh = elite_walk.size
ew_canvas = Image.new("RGBA", (ew, eh), (0, 0, 0, 0))
coiled_elite = elite_walk.resize((int(ew * 0.98), int(eh * 1.02)), Image.Resampling.LANCZOS)
coiled_elite = coiled_elite.rotate(6, resample=Image.Resampling.BICUBIC, expand=False)
arr_e = np.array(coiled_elite).astype(np.float32)
arr_e[:, :, 0] = np.clip(arr_e[:, :, 0] * 1.14 + 22, 0, 255)
arr_e[:, :, 2] = np.clip(arr_e[:, :, 2] * 1.18 + 26, 0, 255)
coiled_elite = Image.fromarray(arr_e.astype(np.uint8), "RGBA")

fx_e = Image.new("RGBA", (ew, eh), (0, 0, 0, 0))
de = ImageDraw.Draw(fx_e)
de.arc([24, 24, ew - 24, eh - 24], start=-75, end=65, fill=(192, 38, 211, 225), width=6)
de.arc([34, 34, ew - 34, eh - 34], start=-60, end=50, fill=(56, 189, 248, 235), width=3)
ew_canvas.alpha_composite(fx_e.filter(ImageFilter.GaussianBlur(3)))
ew_canvas.alpha_composite(coiled_elite, ((ew - coiled_elite.width) // 2 - 4, (eh - coiled_elite.height) // 2))
ew_canvas.alpha_composite(fx_e)
ew_canvas.save(f"{enemy_dir}/enemy_elite_windup.png", format="PNG", optimize=True)
print("Fixed enemy_elite_windup.png (full-height horned dark-armor Elite Guard identity)")

# 3. Fix enemy_fanatic_windup.png from canonical right-facing lean cyber-punk enemy_fanatic_walk.png
fan_walk = Image.open(f"{enemy_dir}/enemy_fanatic_walk.png").convert("RGBA")
fw, fh = fan_walk.size
fw_canvas = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
coiled_fan = fan_walk.resize((int(fw * 0.98), int(fh * 1.02)), Image.Resampling.LANCZOS)
coiled_fan = coiled_fan.rotate(7, resample=Image.Resampling.BICUBIC, expand=False)
arr_f = np.array(coiled_fan).astype(np.float32)
arr_f[:, :, 0] = np.clip(arr_f[:, :, 0] * 1.18 + 26, 0, 255)
arr_f[:, :, 1] = np.clip(arr_f[:, :, 1] * 1.04, 0, 255)
arr_f[:, :, 2] = np.clip(arr_f[:, :, 2] * 1.12 + 16, 0, 255)
coiled_fan = Image.fromarray(arr_f.astype(np.uint8), "RGBA")

fx_f = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
df = ImageDraw.Draw(fx_f)
df.arc([28, 30, fw - 28, fh - 30], start=-70, end=65, fill=(255, 45, 149, 225), width=5)
df.arc([38, 40, fw - 38, fh - 40], start=-55, end=50, fill=(250, 204, 21, 220), width=3)
fw_canvas.alpha_composite(fx_f.filter(ImageFilter.GaussianBlur(3)))
fw_canvas.alpha_composite(coiled_fan, ((fw - coiled_fan.width) // 2 - 4, (fh - coiled_fan.height) // 2))
fw_canvas.alpha_composite(fx_f)
fw_canvas.save(f"{enemy_dir}/enemy_fanatic_windup.png", format="PNG", optimize=True)
print("Fixed enemy_fanatic_windup.png (right-facing lean cyber-punk Fanatic identity)")

# 4. Differentiate the 3 duplicate pairs in ART_ASSETS/tanda_E01/ (02/09, 03/07, 06/08)
e01_dir = "ART_ASSETS/tanda_E01"
# Pair 03/07: 07_voladores = floating eye-sphere drone; 03_mascara_flotante = distinct psychic tripod-mask entity (orig_tripod)
e03_canvas = orig_tripod.resize((288, 288), Image.Resampling.LANCZOS)
e03_canvas.save(f"{e01_dir}/enemy_03_mascara_flotante.png", format="PNG", optimize=True)

# Pair 06/08: 06_seguidores = lean fanatic; 08_explosivos = distinct right-facing volatile kamikaze berserker with glowing bomb core
berserker_right = orig_berserker.transpose(Image.Transpose.FLIP_LEFT_RIGHT).resize((288, 288), Image.Resampling.LANCZOS)
b_fx = Image.new("RGBA", (288, 288), (0, 0, 0, 0))
bd = ImageDraw.Draw(b_fx)
bd.ellipse([128, 102, 184, 158], fill=(255, 120, 20, 195), outline=(255, 240, 120, 255), width=3)
b_fx = b_fx.filter(ImageFilter.GaussianBlur(2))
berserker_right.alpha_composite(b_fx)
berserker_right.save(f"{e01_dir}/enemy_08_explosivos.png", format="PNG", optimize=True)

# Pair 02/09: 02_bailarin_poseido = dancer_walk; 09_rapidos = distinct lunging high-speed sprinter (enemy_dancer_attack with speed trails)
dancer_atk = Image.open(f"{enemy_dir}/enemy_dancer_attack.png").convert("RGBA").resize((288, 288), Image.Resampling.LANCZOS)
s_fx = Image.new("RGBA", (288, 288), (0, 0, 0, 0))
sd = ImageDraw.Draw(s_fx)
for y_line in [96, 134, 172, 210]:
    sd.line([(18, y_line), (96, y_line)], fill=(56, 189, 248, 210), width=4)
dancer_atk.alpha_composite(s_fx.filter(ImageFilter.GaussianBlur(1)))
dancer_atk.save(f"{e01_dir}/enemy_09_rapidos.png", format="PNG", optimize=True)

# Rebuild ART_ASSETS/tanda_E01/enemy_atlas.png
e01_files = sorted([f for f in os.listdir(e01_dir) if f.startswith("enemy_") and f != "enemy_atlas.png" and f.endswith(".png")])
atlas_e01 = Image.new("RGBA", (288 * 5, 288 * 2), (0, 0, 0, 0))
for i, fname in enumerate(e01_files[:10]):
    im = Image.open(os.path.join(e01_dir, fname)).convert("RGBA")
    atlas_e01.alpha_composite(im, ((i % 5) * 288, (i // 5) * 288))
atlas_e01.save(f"{e01_dir}/enemy_atlas.png", format="PNG", optimize=True)
print("Differentiated all 10 ART_ASSETS/tanda_E01 sprites and rebuilt enemy_atlas.png")
