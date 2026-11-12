import os, re, json, base64, io, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

with open("DEADBEAT_DISCO.ART.html", "r", encoding="utf-8") as f:
    art_html = f.read()

m_hd = re.search(r"window\.__HD_DATA=(\{.*?\});</script>", art_html, re.S)
HD_DATA = json.loads(m_hd.group(1)) if m_hd else {}

m_v5 = re.search(r"const DDM_V5_ASSET_DATA = Object\.freeze\((\{.*?\})\);", art_html, re.S)
V5_DATA = json.loads(m_v5.group(1)) if m_v5 else {}

def decode_uri(uri):
    b64 = uri.split(",", 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")

def smooth_hd_upscale(im, target_size, sharpen=1.35):
    im = im.convert("RGBA")
    # 2x supersampled Lanczos + Bilateral-like median smoothing on RGB + crisp alpha + unsharp mask
    w, h = target_size
    im_2x = im.resize((w * 2, h * 2), Image.Resampling.LANCZOS)
    r, g, b, a = im_2x.split()
    rgb = Image.merge("RGB", (r, g, b)).filter(ImageFilter.SMOOTH_MORE)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.12)
    rgb = ImageEnhance.Sharpness(rgb).enhance(sharpen)
    a_smooth = a.filter(ImageFilter.GaussianBlur(radius=0.8))
    merged = Image.merge("RGBA", (*rgb.split(), a_smooth))
    return merged.resize((w, h), Image.Resampling.LANCZOS)

def complete_all_121_weapons():
    os.makedirs("assets/weapons", exist_ok=True)
    weapon_keys = sorted([k for k in HD_DATA.keys() if k.startswith("weapons/weapon_")])
    print(f"Found {len(weapon_keys)} weapons in __HD_DATA")
    existing_16 = set(os.listdir("assets/weapons"))
    generated_count = 0
    for wk in weapon_keys:
        fname = os.path.basename(wk)
        out_path = os.path.join("assets/weapons", fname)
        if fname in existing_16 and os.path.exists(out_path):
            # Already 320x160 HD in assets/weapons
            continue
        src_im = decode_uri(HD_DATA[wk])
        bbox = src_im.getbbox()
        if bbox:
            src_im = src_im.crop(bbox)
        # Fit cleanly inside 320x160 canvas (max 284x132) with HD smoothing & subtle neon rim
        scale = min(284 / max(1, src_im.width), 132 / max(1, src_im.height))
        tw = max(1, int(round(src_im.width * scale)))
        th = max(1, int(round(src_im.height * scale)))
        hd_im = smooth_hd_upscale(src_im, (tw, th), sharpen=1.45)

        canv = Image.new("RGBA", (320, 160), (0, 0, 0, 0))
        ox = (320 - tw) // 2
        oy = (160 - th) // 2
        # Subtle dark-ink + violet drop shadow for readability in shop & HUD
        arr = np.array(hd_im)
        alpha = Image.fromarray(arr[:,:,3], "L").filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
        outline = Image.new("RGBA", (tw, th), (10, 6, 18, 220))
        outline.putalpha(alpha)
        canv.alpha_composite(outline, (ox, oy))
        canv.alpha_composite(hd_im, (ox, oy))
        canv.save(out_path)
        generated_count += 1
    print(f"Exported and upgraded {generated_count} pending weapons -> total {len(os.listdir('assets/weapons'))} in assets/weapons/")

    # Build Weapons Master Atlas (assets/atlases/weapons_atlas.png + .json)
    os.makedirs("assets/atlases", exist_ok=True)
    all_w = sorted([f for f in os.listdir("assets/weapons") if f.endswith(".png")])
    cols = 11
    rows = math.ceil(len(all_w) / cols)
    cw, ch = 160, 80
    atlas = Image.new("RGBA", (cols * cw, rows * ch), (0, 0, 0, 0))
    meta = {"atlas": "assets/atlases/weapons_atlas.png", "cell_size": [cw, ch], "total_weapons": len(all_w), "frames": {}}
    for idx, fn in enumerate(all_w):
        r, c = divmod(idx, cols)
        im = Image.open(os.path.join("assets/weapons", fn)).convert("RGBA").resize((cw, ch), Image.Resampling.LANCZOS)
        ox, oy = c * cw, r * ch
        atlas.alpha_composite(im, (ox, oy))
        wid = fn.replace(".png", "")
        meta["frames"][wid] = {"x": ox, "y": oy, "w": cw, "h": ch, "source": f"assets/weapons/{fn}"}
    atlas.save("assets/atlases/weapons_atlas.png")
    with open("assets/atlases/weapons_atlas.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print("Saved assets/atlases/weapons_atlas.png & .json")

def unify_pickups_effects_ui_props():
    # 1. Paint HD Ruby-Neon Heart for hud_heart_full.png (128x128) and pickup_heart_00.png (160x160)
    def make_hd_heart(sz):
        S = sz * 2
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        draw = ImageDraw.Draw(im)
        cx, cy = S // 2, int(S * 0.48)
        pts = []
        for deg in range(0, 360, 2):
            t = math.radians(deg)
            x = 16 * (math.sin(t) ** 3)
            y = -(13 * math.cos(t) - 5 * math.cos(2*t) - 2 * math.cos(3*t) - math.cos(4*t))
            scale = S * 0.022
            pts.append((cx + x * scale, cy + y * scale))
        # Outer glow
        glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow)
        gdraw.polygon(pts, fill=(255, 45, 149, 130), outline=(255, 45, 149, 220))
        glow = glow.filter(ImageFilter.GaussianBlur(radius=S * 0.05))
        im.alpha_composite(glow)
        # Dark obsidian-gold rim
        draw.polygon(pts, fill=(190, 18, 60, 255), outline=(14, 8, 22, 255))
        # Inner bevel facets
        pts_in = [(cx + (px - cx)*0.84, cy + (py - cy)*0.84) for (px, py) in pts]
        draw.polygon(pts_in, fill=(244, 63, 94, 255), outline=(255, 45, 149, 255))
        pts_core = [(cx + (px - cx)*0.55, cy + (py - cy)*0.55 - S*0.02) for (px, py) in pts]
        draw.polygon(pts_core, fill=(255, 110, 175, 235))
        # Specular highlight
        draw.ellipse([int(S*0.28), int(S*0.24), int(S*0.42), int(S*0.36)], fill=(255, 240, 250, 230))
        # Re-stroke crisp dark outer contour
        for i in range(len(pts)):
            p1, p2 = pts[i], pts[(i+1)%len(pts)]
            draw.line([p1, p2], fill=(12, 6, 20, 255), width=max(4, S // 42))
            draw.line([p1, p2], fill=(246, 196, 83, 180), width=max(2, S // 84))
        return im.resize((sz, sz), Image.Resampling.LANCZOS)

    make_hd_heart(128).save("assets/ui/hud_heart_full.png")
    make_hd_heart(160).save("assets/pickups/pickup_heart_00.png")

    # 2. pickup_boost_00.png from crisp HD hud_skill_boost.png
    boost_hd = Image.open("assets/ui/hud_skill_boost.png").convert("RGBA")
    boost_hd.resize((160, 160), Image.Resampling.LANCZOS).save("assets/pickups/pickup_boost_00.png")

    # 3. pickup_companion_00.png from crisp HD companion_drone_ally.png
    comp_hd = Image.open("assets/characters/companion_drone_ally.png").convert("RGBA")
    comp_canv = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    comp_s = comp_hd.resize((142, 142), Image.Resampling.LANCZOS)
    comp_canv.alpha_composite(comp_s, (9, 9))
    comp_canv.save("assets/pickups/pickup_companion_00.png")

    # 4. pickup_turret_00.png from crisp HD V5 allied_combat_turret
    if "allied_combat_turret" in V5_DATA:
        tur_im = decode_uri(V5_DATA["allied_combat_turret"])
        bbox = tur_im.getbbox()
        if bbox: tur_im = tur_im.crop(bbox)
        scale = min(132 / tur_im.width, 132 / tur_im.height)
        tw, th = int(round(tur_im.width * scale)), int(round(tur_im.height * scale))
        tur_s = smooth_hd_upscale(tur_im, (tw, th), sharpen=1.4)
        t_canv = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
        t_canv.alpha_composite(tur_s, ((160 - tw)//2, (160 - th)//2))
        t_canv.save("assets/pickups/pickup_turret_00.png")

    # 5. pickup_ammo_00.png (160x160): HD painted twin brass/neon rounds
    S = 320
    ammo = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    adraw = ImageDraw.Draw(ammo)
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([40, 40, 280, 280], fill=(246, 196, 83, 85))
    ammo.alpha_composite(glow.filter(ImageFilter.GaussianBlur(14)))
    for bx, by, ang in [(115, 165, -22), (195, 155, -22)]:
        bul = Image.new("RGBA", (120, 220), (0, 0, 0, 0))
        bd = ImageDraw.Draw(bul)
        # Casing
        bd.rounded_rectangle([24, 88, 96, 200], radius=10, fill=(217, 119, 6, 255), outline=(12, 6, 20, 255), width=6)
        bd.rectangle([34, 94, 52, 192], fill=(252, 211, 77, 220))
        # Neon magenta ring band
        bd.rectangle([28, 108, 92, 122], fill=(255, 45, 149, 255))
        # Tip ogive
        bd.polygon([(26, 88), (60, 18), (94, 88)], fill=(245, 158, 11, 255), outline=(12, 6, 20, 255))
        bd.polygon([(42, 84), (60, 28), (64, 84)], fill=(254, 243, 199, 220))
        bul_r = bul.rotate(ang, resample=Image.Resampling.BICUBIC, expand=True)
        ammo.alpha_composite(bul_r, (bx - bul_r.width//2, by - bul_r.height//2))
    ammo.resize((160, 160), Image.Resampling.LANCZOS).save("assets/pickups/pickup_ammo_00.png")

    # 6. relic_magnet.png (160x160): HD painted horseshoe magnet with cyan/magenta arcs
    S = 320
    mag = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    md = ImageDraw.Draw(mag)
    md.arc([56, 56, 264, 264], start=180, end=360, fill=(14, 8, 22, 255), width=56)
    md.arc([62, 62, 258, 258], start=180, end=360, fill=(190, 18, 60, 255), width=42)
    md.arc([70, 70, 250, 250], start=195, end=345, fill=(255, 45, 149, 220), width=14)
    # Left & right legs + silver/cyan poles
    for lx in [58, 214]:
        md.rectangle([lx, 150, lx+48, 246], fill=(190, 18, 60, 255), outline=(14, 8, 22, 255), width=6)
        md.rectangle([lx, 204, lx+48, 246], fill=(226, 232, 240, 255), outline=(14, 8, 22, 255), width=6)
        md.rectangle([lx+8, 210, lx+22, 240], fill=(56, 189, 248, 230))
    # Electric arc between poles
    md.line([(106, 228), (140, 214), (175, 236), (214, 224)], fill=(56, 189, 248, 245), width=7)
    md.line([(106, 228), (140, 214), (175, 236), (214, 224)], fill=(248, 250, 252, 255), width=3)
    mag.resize((160, 160), Image.Resampling.LANCZOS).save("assets/pickups/relic_magnet.png")

    # 7. Clean relic_pact.png (remove jagged white paper circle halo), relic_coil.png & relic_tempo.png (remove box frame)
    pact = Image.open("backups/pre_unification_snapshot/assets/pickups/relic_pact.png").convert("RGBA")
    arr = np.array(pact)
    r, g, b, a = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int), arr[:,:,3].astype(int)
    # Envelope is warm parchment (R > B + 20); outer halo is white/neutral (R≈G≈B > 200)
    max_diff = np.maximum(np.abs(r-g), np.maximum(np.abs(g-b), np.abs(r-b)))
    lum = (r + g + b) // 3
    halo = (a > 0) & (lum >= 195) & (max_diff <= 22)
    arr[halo] = [0, 0, 0, 0]
    pact_clean = Image.fromarray(arr, "RGBA")
    # Add soft magenta-gold arcane glow behind the envelope
    pglow = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(pglow).ellipse([20, 20, 140, 140], fill=(255, 45, 149, 75))
    pglow = pglow.filter(ImageFilter.GaussianBlur(8))
    pglow.alpha_composite(pact_clean)
    pglow.save("assets/pickups/relic_pact.png")

    for rfn in ["relic_coil.png", "relic_tempo.png"]:
        rim = Image.open(f"backups/pre_unification_snapshot/assets/pickups/{rfn}").convert("RGBA")
        # Apply circular vignette alpha mask so the rectangular box border disappears cleanly
        mask = Image.new("L", (160, 160), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.ellipse([14, 14, 146, 146], fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(4))
        orig_a = rim.split()[3]
        new_a = Image.fromarray(np.minimum(np.array(orig_a), np.array(mask)), "L")
        rim.putalpha(new_a)
        # Add ornate neon-gold circular ring border matching relic_echo / relic_lowpass
        ring = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
        rdraw = ImageDraw.Draw(ring)
        rdraw.ellipse([12, 12, 148, 148], outline=(14, 8, 22, 240), width=6)
        rdraw.ellipse([14, 14, 146, 146], outline=(246, 196, 83, 210), width=3)
        rim.alpha_composite(ring)
        rim.save(f"assets/pickups/{rfn}")

    # 8. Upgrade pixelated projectiles: proj_slug.png (160x96), proj_ricochet.png (192x96), proj_heavy.png (192x96)
    def make_hd_proj(w, h, core_col, trail_col, tip_col):
        S_w, S_h = w * 2, h * 2
        im = Image.new("RGBA", (S_w, S_h), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        cy = S_h // 2
        # Trail glow
        glow = Image.new("RGBA", (S_w, S_h), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.polygon([(16, cy), (int(S_w*0.72), cy - 34), (int(S_w*0.88), cy), (int(S_w*0.72), cy + 34)], fill=(*trail_col, 160))
        glow = glow.filter(ImageFilter.GaussianBlur(10))
        im.alpha_composite(glow)
        # Metallic/energy warhead
        d.rounded_rectangle([int(S_w*0.42), cy - 22, int(S_w*0.78), cy + 22], radius=10, fill=(*core_col, 255), outline=(14, 8, 22, 255), width=5)
        d.polygon([(int(S_w*0.74), cy - 22), (S_w - 18, cy), (int(S_w*0.74), cy + 22)], fill=(*tip_col, 255), outline=(14, 8, 22, 255))
        d.line([(24, cy), (int(S_w*0.78), cy)], fill=(248, 250, 252, 240), width=6)
        return im.resize((w, h), Image.Resampling.LANCZOS)

    make_hd_proj(160, 96, (217, 119, 6), (255, 45, 149), (253, 224, 71)).save("assets/effects/proj_slug.png")
    make_hd_proj(192, 96, (245, 158, 11), (255, 45, 149), (56, 189, 248)).save("assets/effects/proj_ricochet.png")
    make_hd_proj(192, 96, (51, 65, 85), (56, 189, 248), (255, 45, 149)).save("assets/effects/proj_heavy.png")

    # 9. Smooth & upgrade pixelated VFX: vfx_explosion_inferno.png, vfx_fire_plume.png, vfx_soul_flame.png
    for vfn, sz in [("vfx_explosion_inferno.png", (320, 320)), ("vfx_fire_plume.png", (160, 256)), ("vfx_soul_flame.png", (192, 192))]:
        vim = Image.open(f"backups/pre_unification_snapshot/assets/effects/{vfn}").convert("RGBA")
        # Remove blocky pixel grid via downscale + bicubic/lanczos + median + glow bloom
        w, h = sz
        small = vim.resize((w // 3, h // 3), Image.Resampling.BOX)
        smooth = small.resize((w, h), Image.Resampling.BICUBIC)
        bloom = smooth.filter(ImageFilter.GaussianBlur(radius=4.5))
        out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        out.alpha_composite(bloom)
        out.alpha_composite(smooth)
        out = ImageEnhance.Contrast(out).enhance(1.18)
        out.save(f"assets/effects/{vfn}")

    # 10. Fix prop_sigil_poster.png (replace stark white canvas with dark obsidian/parchment + glowing magenta sigil)
    poster = Image.open("backups/pre_unification_snapshot/assets/props/prop_sigil_poster.png").convert("RGBA")
    arr = np.array(poster)
    r, g, b, a = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int), arr[:,:,3].astype(int)
    # Bright white canvas pixels inside the frame (R>180, G>180, B>180) -> convert to deep gothic obsidian-violet (#180D28)
    is_white_bg = (a > 128) & (r > 175) & (g > 165) & (b > 175)
    arr[is_white_bg, 0] = 24
    arr[is_white_bg, 1] = 13
    arr[is_white_bg, 2] = 40
    # Anti-alias transition pixels (pinkish-white edges of the sigil on white bg)
    is_pale_pink = (a > 128) & (r > 190) & (g > 110) & (g <= 165) & (b > 160)
    arr[is_pale_pink, 0] = 185
    arr[is_pale_pink, 1] = 35
    arr[is_pale_pink, 2] = 125
    Image.fromarray(arr, "RGBA").save("assets/props/prop_sigil_poster.png")

    # 11. Fix prop_chandelier_gold.png (strip baked white checkerboard between chains)
    chan = Image.open("backups/pre_unification_snapshot/assets/props/prop_chandelier_gold.png").convert("RGBA")
    arr = np.array(chan)
    r, g, b, a = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int), arr[:,:,3].astype(int)
    max_diff = np.maximum(np.abs(r-g), np.maximum(np.abs(g-b), np.abs(r-b)))
    lum = (r + g + b) // 3
    # Neutral white/grey checkerboard has max_diff <= 18 and lum >= 145 (gold has R >> B, flame has R >> B)
    chk = (a > 0) & (max_diff <= 18) & (lum >= 145)
    arr[chk] = [0, 0, 0, 0]
    Image.fromarray(arr, "RGBA").save("assets/props/prop_chandelier_gold.png")
    print("Unified pickups, relics, projectiles, VFX, UI hearts, and props")

def export_v5_circle_and_hub_assets():
    os.makedirs("assets/environments/v5", exist_ok=True)
    exported = 0
    for k, uri in sorted(V5_DATA.items()):
        out_p = f"assets/environments/v5/{k}.png"
        if not os.path.exists(out_p):
            im = decode_uri(uri)
            im.save(out_p)
            exported += 1
    print(f"Exported {exported} V5 isometric Circle & HUB assets to assets/environments/v5/")

if __name__ == "__main__":
    complete_all_121_weapons()
    unify_pickups_effects_ui_props()
    export_v5_circle_and_hub_assets()
