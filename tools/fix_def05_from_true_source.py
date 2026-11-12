import os
import numpy as np
from collections import deque
from PIL import Image, ImageFilter

dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]

for d in dirs:
    src = f"ART_ASSETS/tanda_03/fase_b/_source/{d}.png"
    im = Image.open(src).convert("RGBA")
    arr = np.array(im)
    h, w, _ = arr.shape
    r, g, b = arr[:, :, 0].astype(np.int32), arr[:, :, 1].astype(np.int32), arr[:, :, 2].astype(np.int32)
    max_rgb = np.maximum(np.maximum(r, g), b)
    
    # 1. Core foreground: any pixel brighter than the flat [8,8,6] studio backdrop (skin, hair highlights, jeans [28,34,34], boot rim [26,9,22])
    fg_core = (max_rgb >= 15).astype(np.uint8) * 255
    # Zero out any border noise within 12px of canvas edges
    fg_core[:12, :] = 0; fg_core[-12:, :] = 0; fg_core[:, :12] = 0; fg_core[:, -12:] = 0
    
    # 2. Dilate by 7px (MaxFilter(15)) to capture the dark [4,5,3] ink outline surrounding the character, then close interior holes
    fg_dilated = Image.fromarray(fg_core, "L").filter(ImageFilter.MaxFilter(15))
    dil_np = np.array(fg_dilated) > 128
    
    # 3. Flood-fill from borders on ~dil_np so all interior regions (black vest, dark hair, inner boots) are 100% solid
    ext_bg = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if not dil_np[0, x]: ext_bg[0, x] = True; q.append((0, x))
        if not dil_np[h - 1, x]: ext_bg[h - 1, x] = True; q.append((h - 1, x))
    for y in range(h):
        if not dil_np[y, 0]: ext_bg[y, 0] = True; q.append((y, 0))
        if not dil_np[y, w - 1]: ext_bg[y, w - 1] = True; q.append((y, w - 1))
    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not ext_bg[ny, nx] and not dil_np[ny, nx]:
                ext_bg[ny, nx] = True
                q.append((ny, nx))
                
    solid_fg = ~ext_bg
    # Erode back by 4px (MinFilter(9)) so the silhouette hugs the exact outer edge of the black ink outline
    eroded = Image.fromarray(solid_fg.astype(np.uint8) * 255, "L").filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(0.8))
    alpha_np = np.array(eroded)
    alpha_np = np.where(alpha_np < 32, 0, alpha_np)
    arr[:, :, 3] = alpha_np
    rgba = Image.fromarray(arr, "RGBA")
    
    ys, xs = np.where(alpha_np > 40)
    crop = rgba.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    
    # Save master in ART_ASSETS/tanda_03/fase_b/{d}.png
    crop.save(f"ART_ASSETS/tanda_03/fase_b/{d}.png", format="PNG", optimize=True)
    
    # Save 256x256 runtime sprite in assets/characters/player_dir_{d}.png
    target_h = 232
    target_w = int(round(crop.width * (target_h / crop.height)))
    resized = crop.resize((target_w, target_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((256 - target_w) // 2, 246 - target_h))
    dst = f"assets/characters/player_dir_{d}.png"
    canvas.save(dst, format="PNG", optimize=True)
    # Check opaque pixel coverage in top half vs bottom half (legs/boots)
    top_cov = (np.array(canvas)[:128, :, 3] > 100).sum()
    bot_cov = (np.array(canvas)[128:, :, 3] > 100).sum()
    print(f"Exported {dst}: figure=({target_w}x{target_h}) top_pixels={top_cov} bottom_legs_pixels={bot_cov}")
