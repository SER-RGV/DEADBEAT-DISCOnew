import os, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

def strip_checkerboard_boss(im, protect_boxes=None, lum_min=135, diff_max=22):
    im = im.convert("RGBA")
    arr = np.array(im)
    H, W, _ = arr.shape
    r, g, b, a = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int), arr[:,:,3].astype(int)
    max_diff = np.maximum(np.abs(r-g), np.maximum(np.abs(g-b), np.abs(r-b)))
    lum = (r + g + b) // 3
    mask = (a > 0) & (max_diff <= diff_max) & (lum >= lum_min)
    if protect_boxes:
        prot = np.zeros((H, W), dtype=bool)
        for (x0, y0, x1, y1) in protect_boxes:
            prot[y0:y1, x0:x1] = True
        mask = mask & (~prot)
    arr[mask] = [0, 0, 0, 0]
    return Image.fromarray(arr, "RGBA")

def make_fullbody_hit_from_idle(idle_im, canvas_size=(384, 448), flash_rgb=(255, 45, 149), accent_rgb=(56, 189, 248)):
    im = idle_im.convert("RGBA")
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    # Recoil tilt (-7 deg) + slight compression
    im_rot = im.rotate(7, resample=Image.Resampling.BICUBIC, expand=True)
    bbox2 = im_rot.getbbox()
    if bbox2:
        im_rot = im_rot.crop(bbox2)
    cw, ch = canvas_size
    target_h = min(ch - 36, int(round(im.height * 0.98)))
    scale = target_h / max(1, im_rot.height)
    tw = max(1, int(round(im_rot.width * scale)))
    th = max(1, int(round(im_rot.height * scale)))
    im_s = im_rot.resize((tw, th), Image.Resampling.LANCZOS)

    # Tint highlights with damage recoil flash while keeping dark ink outlines crisp
    arr = np.array(im_s).astype(np.float32)
    lum = 0.299*arr[:,:,0] + 0.587*arr[:,:,1] + 0.114*arr[:,:,2]
    hit_mask = ((lum > 40) & (arr[:,:,3] > 20))[..., None]
    fc = np.array(flash_rgb, dtype=np.float32).reshape((1, 1, 3))
    arr[:,:,:3] = np.where(hit_mask, np.clip(arr[:,:,:3]*0.72 + fc*0.38, 0, 255), arr[:,:,:3])
    im_s = Image.fromarray(arr.astype(np.uint8), "RGBA")

    canv = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    ox = (cw - tw) // 2 + 8
    oy = (ch - 18) - th

    # Add impact shockburst behind torso
    burst = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(burst)
    cx, cy = cw // 2, int(ch * 0.44)
    bdraw.ellipse([cx - 88, cy - 88, cx + 88, cy + 88], fill=(*flash_rgb, 95))
    bdraw.ellipse([cx - 56, cy - 56, cx + 56, cy + 56], fill=(*accent_rgb, 130))
    for ang_deg in range(0, 360, 45):
        rad = math.radians(ang_deg + 15)
        x1 = cx + int(math.cos(rad) * 30)
        y1 = cy + int(math.sin(rad) * 30)
        x2 = cx + int(math.cos(rad) * 112)
        y2 = cy + int(math.sin(rad) * 112)
        bdraw.line([(x1, y1), (x2, y2)], fill=(248, 250, 252, 210), width=3)
    burst = burst.filter(ImageFilter.GaussianBlur(radius=1.5))
    canv.alpha_composite(burst)
    canv.alpha_composite(im_s, (ox, oy))
    return canv

def unify_bosses():
    snap = "backups/pre_unification_snapshot/assets/bosses"

    # 1. boss_01_magneta (Véspera, La Reina del Espejo): strip neutral checkerboard in attack & hit halo
    for fn in ["boss_01_magneta_attack.png", "boss_01_magneta_hit.png"]:
        im = Image.open(f"{snap}/{fn}").convert("RGBA")
        # Protect face only (warm/pale skin has R > G, neutral checkerboard has R≈G≈B)
        im = strip_checkerboard_boss(im, protect_boxes=None, lum_min=140, diff_max=18)
        im.save(f"assets/bosses/{fn}")

    # 2. boss_03_cajero (Áurea / El Cajero): replace giant disembodied head on boss_03_cajero_hit.png with full-body hit!
    caj_idle = Image.open(f"{snap}/boss_03_cajero_idle.png").convert("RGBA")
    caj_idle = strip_checkerboard_boss(caj_idle, protect_boxes=[(165, 38, 218, 92)], lum_min=150, diff_max=16)
    caj_idle.save("assets/bosses/boss_03_cajero_idle.png")
    caj_hit = make_fullbody_hit_from_idle(caj_idle, (384, 448), flash_rgb=(246, 196, 83), accent_rgb=(255, 45, 149))
    caj_hit.save("assets/bosses/boss_03_cajero_hit.png")

    # 3. boss_04_pogo (Brama, El Señor del Mosh): strip full-canvas baked white/grey checkerboard from boss_04_pogo_attack.png!
    pogo_atk = Image.open(f"{snap}/boss_04_pogo_attack.png").convert("RGBA")
    pogo_atk = strip_checkerboard_boss(pogo_atk, protect_boxes=None, lum_min=128, diff_max=24)
    # Add clean translucent violet/magenta mosh shockwave ring behind him
    ring = Image.new("RGBA", pogo_atk.size, (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(ring)
    rdraw.ellipse([36, 48, 380, 392], outline=(168, 85, 247, 150), width=8)
    rdraw.ellipse([54, 66, 362, 374], outline=(255, 45, 149, 120), width=4)
    ring = ring.filter(ImageFilter.GaussianBlur(radius=1.8))
    ring.alpha_composite(pogo_atk)
    ring.save("assets/bosses/boss_04_pogo_attack.png")

    # 4. boss_05_oficiante (El Obispo de la Nota Ausente):
    # Clean attack flame checkerboard; replace mismatched female portrait bust on boss_05_oficiante_hit.png with full-body Bishop hit!
    ofi_idle = Image.open(f"{snap}/boss_05_oficiante_idle.png").convert("RGBA")
    ofi_idle = strip_checkerboard_boss(ofi_idle, protect_boxes=[(168, 72, 216, 130)], lum_min=150, diff_max=18)
    ofi_idle.save("assets/bosses/boss_05_oficiante_idle.png")

    ofi_atk = Image.open(f"{snap}/boss_05_oficiante_attack.png").convert("RGBA")
    ofi_atk = strip_checkerboard_boss(ofi_atk, protect_boxes=[(175, 72, 232, 135)], lum_min=145, diff_max=20)
    ofi_atk.save("assets/bosses/boss_05_oficiante_attack.png")

    ofi_hit = make_fullbody_hit_from_idle(ofi_idle, (384, 448), flash_rgb=(168, 85, 247), accent_rgb=(255, 45, 149))
    ofi_hit.save("assets/bosses/boss_05_oficiante_hit.png")

    # 5. boss_06_matarife (El Corazón Encadenado): strip baked white checkerboards from attack and hit!
    mat_atk = Image.open(f"{snap}/boss_06_matarife_attack.png").convert("RGBA")
    mat_atk = strip_checkerboard_boss(mat_atk, protect_boxes=None, lum_min=130, diff_max=24)
    mat_atk.save("assets/bosses/boss_06_matarife_attack.png")

    mat_hit = Image.open(f"{snap}/boss_06_matarife_hit.png").convert("RGBA")
    mat_hit = strip_checkerboard_boss(mat_hit, protect_boxes=None, lum_min=135, diff_max=22)
    mat_hit.save("assets/bosses/boss_06_matarife_hit.png")

    # 6. boss_09_nucleo (El Rey del Compás / El Núcleo):
    # Strip checkerboard circle from attack; replace 8-bit magenta pixel blob on boss_09_nucleo_hit.png with full-body Sovereign hit!
    nuc_idle = Image.open(f"{snap}/boss_09_nucleo_idle.png").convert("RGBA")
    nuc_atk = Image.open(f"{snap}/boss_09_nucleo_attack.png").convert("RGBA")
    nuc_atk = strip_checkerboard_boss(nuc_atk, protect_boxes=None, lum_min=128, diff_max=24)
    nuc_atk.save("assets/bosses/boss_09_nucleo_attack.png")

    nuc_hit = make_fullbody_hit_from_idle(nuc_idle, (384, 448), flash_rgb=(255, 45, 149), accent_rgb=(56, 189, 248))
    nuc_hit.save("assets/bosses/boss_09_nucleo_hit.png")

    # 7. boss_10_arquitecto: clean neutral checkerboard specks around crown
    for fn in ["boss_10_arquitecto_idle.png", "boss_10_arquitecto_attack.png"]:
        im = Image.open(f"{snap}/{fn}").convert("RGBA")
        im = strip_checkerboard_boss(im, protect_boxes=None, lum_min=160, diff_max=14)
        im.save(f"assets/bosses/{fn}")

    print("Unified all 42 Sovereign boss sprites in assets/bosses/")

    # 8. Build Master Boss Atlas (assets/atlases/bosses_atlas.png + .json) including all 42 assets/bosses + 19 ART_ASSETS/bosses
    os.makedirs("assets/atlases", exist_ok=True)
    boss_files = sorted([os.path.join("assets/bosses", f) for f in os.listdir("assets/bosses") if f.endswith(".png")])
    for sub in ["tanda_01", "tanda_02"]:
        d = os.path.join("ART_ASSETS/bosses", sub)
        if os.path.exists(d):
            boss_files += sorted([os.path.join(d, f) for f in os.listdir(d) if f.endswith(".png")])

    cols = 6
    rows = math.ceil(len(boss_files) / cols)
    cw, ch = 416, 448
    atlas = Image.new("RGBA", (cols * cw, rows * ch), (0, 0, 0, 0))
    meta = {
        "atlas": "assets/atlases/bosses_atlas.png",
        "cell_size": [cw, ch],
        "total_frames": len(boss_files),
        "frames": {}
    }
    for idx, fp in enumerate(boss_files):
        r, c = divmod(idx, cols)
        im = Image.open(fp).convert("RGBA")
        im.thumbnail((cw, ch), Image.Resampling.LANCZOS)
        ox = c * cw + (cw - im.width) // 2
        oy = r * ch + (ch - im.height)
        atlas.alpha_composite(im, (ox, oy))
        fid = os.path.basename(fp).replace(".png", "")
        meta["frames"][fid] = {"x": ox, "y": oy, "w": im.width, "h": im.height, "source": fp}
    atlas.save("assets/atlases/bosses_atlas.png")
    with open("assets/atlases/bosses_atlas.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print("Saved assets/atlases/bosses_atlas.png & .json")

if __name__ == "__main__":
    unify_bosses()
