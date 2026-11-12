import os, shutil
import numpy as np
from PIL import Image, ImageFilter

# 1. Re-export all 8 directional player sprites at full head-to-boot height from ART_ASSETS/tanda_03/fase_b/
dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]
for d in dirs:
    src = f"ART_ASSETS/tanda_03/fase_b/{d}.png"
    dst = f"assets/characters/player_dir_{d}.png"
    im = Image.open(src).convert("RGBA")
    arr = np.array(im)
    ys, xs = np.where(arr[:, :, 3] > 15)
    crop = im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    
    # Fit full head-to-boot figure into 256x256 with consistent bottom-baseline at y=246 and height=232px
    target_h = 232
    target_w = int(round(crop.width * (target_h / crop.height)))
    resized = crop.resize((target_w, target_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    ox = (256 - target_w) // 2
    oy = 246 - target_h
    canvas.alpha_composite(resized, (ox, oy))
    canvas.save(dst, format="PNG", optimize=True)
    print(f"Re-exported full-body (head-to-boot) {dst} from {src} -> figure size {resized.size}")

# 2. Unify head angle and walking proportions across player_walk_00..03
char_dir = "assets/characters"
w02 = Image.open(f"{char_dir}/player_walk_02.png").convert("RGBA")
w03 = Image.open(f"{char_dir}/player_walk_03.png").convert("RGBA")
w00 = Image.open(f"{char_dir}/player_walk_00.png").convert("RGBA")
w01 = Image.open(f"{char_dir}/player_walk_01.png").convert("RGBA")

# Extract canonical 3/4 head & upper collar from w02 (y=0..72) and blend seamlessly onto w00 and w01 lower bodies (y=58..256)
def unify_walk_frame(base_walk, ref_upper, y_split=66, feather=6, dx_head=0, dy_head=0):
    w, h = base_walk.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    
    # Find horizontal centroid of neck/shoulders around y_split in both images to align head perfectly
    arr_base = np.array(base_walk)
    arr_ref = np.array(ref_upper)
    xs_base = np.where(arr_base[y_split-4:y_split+4, :, 3] > 40)[1]
    xs_ref = np.where(arr_ref[y_split-4:y_split+4, :, 3] > 40)[1]
    cx_base = int(np.mean(xs_base)) if len(xs_base) else w // 2
    cx_ref = int(np.mean(xs_ref)) if len(xs_ref) else w // 2
    shift_x = (cx_base - cx_ref) + dx_head
    
    # Shift ref_upper horizontally by shift_x
    shifted_ref = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shifted_ref.alpha_composite(ref_upper, (shift_x, dy_head))
    
    # Create smooth vertical blend mask: 255 above y_split (use canonical 3/4 head/collar), 0 below y_split (use base_walk torso/arms/legs)
    mask = np.zeros((h, w), dtype=np.float32)
    for y in range(h):
        if y < y_split - feather:
            mask[y, :] = 1.0
        elif y <= y_split + feather:
            mask[y, :] = 1.0 - (y - (y_split - feather)) / float(2 * feather)
        else:
            mask[y, :] = 0.0
    mask_3d = mask[:, :, None]
    
    blended = (np.array(shifted_ref, dtype=np.float32) * mask_3d + np.array(base_walk, dtype=np.float32) * (1.0 - mask_3d))
    return Image.fromarray(np.clip(blended, 0, 255).astype(np.uint8), "RGBA")

w00_fixed = unify_walk_frame(w00, w02, y_split=66, feather=5, dx_head=0, dy_head=0)
w01_fixed = unify_walk_frame(w01, w03, y_split=66, feather=5, dx_head=0, dy_head=0)

w00_fixed.save(f"{char_dir}/player_walk_00.png", format="PNG", optimize=True)
w01_fixed.save(f"{char_dir}/player_walk_01.png", format="PNG", optimize=True)

# Sync to cinematic protagonist sprites as well
for i, im_w in enumerate([w00_fixed, w01_fixed, w02, w03]):
    for c_path in [
        f"assets/cinematics/characters/protagonist/hero_walk_0{i}.png",
        f"CINEMATIC_ASSETS/characters/protagonist/hero_walk_0{i}.png"
    ]:
        if os.path.exists(os.path.dirname(c_path)):
            im_w.save(c_path, format="PNG", optimize=True)

print("Unified head angle and walking proportions across player_walk_00..03 and hero_walk_00..03")
