import os, re, json, base64, io, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps

with open("DEADBEAT_DISCO.ART.html", "r", encoding="utf-8") as f:
    art_html = f.read()
m_ilt = re.search(r"window\.__ILT_DATA=(\{.*?\});</script>", art_html, re.S)
ILT_DATA = json.loads(m_ilt.group(1)) if m_ilt else {}

def get_ilt_image(key):
    uri = ILT_DATA[key]
    b64 = uri.split(",", 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")

def strip_neutral_checkerboard(im, keep_boxes=None, lum_min=135, diff_max=24):
    im = im.convert("RGBA")
    arr = np.array(im)
    H, W, _ = arr.shape
    r = arr[:,:,0].astype(int)
    g = arr[:,:,1].astype(int)
    b = arr[:,:,2].astype(int)
    a = arr[:,:,3].astype(int)
    max_diff = np.maximum(np.abs(r-g), np.maximum(np.abs(g-b), np.abs(r-b)))
    lum = (r + g + b) // 3
    mask = (a > 0) & (max_diff <= diff_max) & (lum >= lum_min)
    if keep_boxes:
        protect = np.zeros((H, W), dtype=bool)
        for (x0, y0, x1, y1) in keep_boxes:
            protect[y0:y1, x0:x1] = True
        mask = mask & (~protect)
    arr[mask] = [0, 0, 0, 0]
    return Image.fromarray(arr, "RGBA")

def add_slash_arc(canvas, bbox, start_deg, end_deg, color_outer=(255, 45, 149), color_inner=(56, 189, 248), width_outer=18, width_inner=7):
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.arc(bbox, start=start_deg, end=end_deg, fill=(*color_outer, 210), width=width_outer)
    draw.arc(bbox, start=start_deg+4, end=end_deg-4, fill=(*color_inner, 235), width=width_inner)
    draw.arc(bbox, start=start_deg+8, end=end_deg-8, fill=(248, 250, 252, 245), width=3)
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=1.0))
    canvas.alpha_composite(overlay)
    return canvas

def fit_on_canvas(im, cw, ch, target_h, bottom_y, offset_x=0, angle_deg=0):
    im = im.convert("RGBA")
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    if angle_deg != 0:
        im = im.rotate(angle_deg, resample=Image.Resampling.BICUBIC, expand=True)
        bbox2 = im.getbbox()
        if bbox2:
            im = im.crop(bbox2)
    scale = target_h / max(1, im.height)
    tw = max(1, int(round(im.width * scale)))
    th = max(1, int(round(im.height * scale)))
    im_s = im.resize((tw, th), Image.Resampling.LANCZOS)
    canv = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    ox = (cw - tw) // 2 + offset_x
    oy = bottom_y - th
    canv.alpha_composite(im_s, (ox, oy))
    return canv

def unify_enemies():
    snap = "backups/pre_unification_snapshot/assets/enemies"

    # 1. DANCER FAMILY (Strip baked checkerboards from walk, windup, attack)
    d_walk = Image.open(f"{snap}/enemy_dancer_walk.png").convert("RGBA")
    # Protect face & upper chest (x in 95..145, y in 35..110)
    d_walk = strip_neutral_checkerboard(d_walk, keep_boxes=[(95, 35, 145, 110)], lum_min=130, diff_max=25)
    d_walk.save("assets/enemies/enemy_dancer_walk.png")

    d_wind = Image.open(f"{snap}/enemy_dancer_windup.png").convert("RGBA")
    d_wind = strip_neutral_checkerboard(d_wind, keep_boxes=[(105, 55, 150, 120)], lum_min=130, diff_max=25)
    d_wind.save("assets/enemies/enemy_dancer_windup.png")

    d_atk = Image.open(f"{snap}/enemy_dancer_attack.png").convert("RGBA")
    d_atk = strip_neutral_checkerboard(d_atk, keep_boxes=[(115, 55, 165, 125)], lum_min=128, diff_max=26)
    # Add subtle glowing magenta sonic vortex inside her ribbon ring
    vortex = Image.new("RGBA", d_atk.size, (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vortex)
    vdraw.ellipse([26, 26, 262, 262], outline=(255, 45, 149, 140), width=5)
    vdraw.ellipse([36, 36, 252, 252], outline=(56, 189, 248, 95), width=3)
    vortex = vortex.filter(ImageFilter.GaussianBlur(radius=1.5))
    vortex.alpha_composite(d_atk)
    vortex.save("assets/enemies/enemy_dancer_attack.png")

    # 2. DRONE FAMILY (Strip dark baked checkerboard under enemy_drone_walk.png)
    dr_walk = Image.open(f"{snap}/enemy_drone_walk.png").convert("RGBA")
    arr = np.array(dr_walk)
    # Below y=195, remove low-saturation checkerboard block and replace with clean cyan/magenta hover glow
    H, W, _ = arr.shape
    r, g, b, a = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int), arr[:,:,3].astype(int)
    max_diff = np.maximum(np.abs(r-g), np.maximum(np.abs(g-b), np.abs(r-b)))
    lower = np.zeros((H, W), dtype=bool)
    lower[192:, :] = True
    # Remove semi-transparent or neutral checkerboard pixels at bottom
    chk = lower & ((max_diff <= 38) | (a < 235))
    arr[chk] = [0, 0, 0, 0]
    dr_walk = Image.fromarray(arr, "RGBA")
    glow = Image.new("RGBA", dr_walk.size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([78, 210, 178, 252], fill=(255, 45, 149, 75))
    gdraw.ellipse([96, 218, 160, 244], fill=(56, 189, 248, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=4.0))
    glow.alpha_composite(dr_walk)
    glow.save("assets/enemies/enemy_drone_walk.png")

    # 3. FANATIC FAMILY (Strip baked white checkerboard from enemy_fanatic_attack.png)
    f_atk = Image.open(f"{snap}/enemy_fanatic_attack.png").convert("RGBA")
    # Protect skull mask face (x in 140..195, y in 65..115)
    f_atk = strip_neutral_checkerboard(f_atk, keep_boxes=[(140, 65, 195, 115)], lum_min=135, diff_max=25)
    f_atk.save("assets/enemies/enemy_fanatic_attack.png")

    # 4. SECURITY FAMILY (Strip checkerboard from attack; unify windup to match black riot armor + magenta visor)
    s_walk = Image.open(f"{snap}/enemy_security_walk.png").convert("RGBA")
    s_atk = Image.open(f"{snap}/enemy_security_attack.png").convert("RGBA")
    s_atk = strip_neutral_checkerboard(s_atk, keep_boxes=[], lum_min=135, diff_max=25)
    s_atk.save("assets/enemies/enemy_security_attack.png")

    # Build unified enemy_security_windup.png (256x288) from s_walk/s_atk black riot guard
    # Tilted back in windup stance with glowing charged magenta/cyan shock baton raised
    s_wind = fit_on_canvas(s_walk, 256, 288, target_h=248, bottom_y=276, offset_x=4, angle_deg=6)
    w_glow = Image.new("RGBA", (256, 288), (0, 0, 0, 0))
    wg = ImageDraw.Draw(w_glow)
    # Charged shock baton arc & visor flare
    wg.line([(88, 175), (42, 125)], fill=(255, 45, 149, 240), width=7)
    wg.line([(88, 175), (42, 125)], fill=(248, 250, 252, 255), width=3)
    wg.ellipse([26, 108, 62, 144], fill=(56, 189, 248, 165))
    wg.ellipse([104, 46, 138, 72], fill=(255, 45, 149, 135))
    w_glow = w_glow.filter(ImageFilter.GaussianBlur(radius=1.2))
    s_wind.alpha_composite(w_glow)
    s_wind.save("assets/enemies/enemy_security_windup.png")

    # 5. ELITE FAMILY (Clean walk specks; rebuild broken enemy_elite_attack.png from full-body armored Elite Guard)
    e_walk = Image.open(f"{snap}/enemy_elite_walk.png").convert("RGBA")
    e_walk = strip_neutral_checkerboard(e_walk, keep_boxes=[], lum_min=150, diff_max=20)
    e_walk.save("assets/enemies/enemy_elite_walk.png")

    e_wind = Image.open(f"{snap}/enemy_elite_windup.png").convert("RGBA")
    # Build full-body lunging slash attack for enemy_elite_attack.png (288x288)
    e_atk = fit_on_canvas(e_wind, 288, 288, target_h=236, bottom_y=274, offset_x=10, angle_deg=-10)
    e_atk = add_slash_arc(
        e_atk,
        bbox=[18, 24, 272, 264],
        start_deg=-65,
        end_deg=75,
        color_outer=(225, 29, 72),
        color_inner=(255, 45, 149),
        width_outer=22,
        width_inner=9
    )
    e_atk.save("assets/enemies/enemy_elite_attack.png")

    # 6. CHEF FAMILY (Unify all 4 states around the canonical Infernal Butcher identity)
    # Clean enemy_chef_windup.png checkerboard first (protect chef toque and eyes/teeth in head box)
    c_wind = Image.open(f"{snap}/enemy_chef_windup.png").convert("RGBA")
    c_wind = strip_neutral_checkerboard(c_wind, keep_boxes=[(105, 18, 165, 95)], lum_min=150, diff_max=22)
    c_wind.save("assets/enemies/enemy_chef_windup.png")

    # Use ILT:enemy_chef (232x193 RGBA canonical infernal butcher) & cleaned c_wind to unify walk, attack, death!
    ilt_chef = get_ilt_image("enemy_chef")
    # Build unified enemy_chef_walk.png (256x288)
    c_walk = fit_on_canvas(ilt_chef, 256, 288, target_h=242, bottom_y=276, offset_x=0, angle_deg=0)
    c_walk.save("assets/enemies/enemy_chef_walk.png")

    # Build unified enemy_chef_attack.png (288x288) with forward cleaver lunge & crimson/magenta butcher slash arc
    c_atk = fit_on_canvas(ilt_chef, 288, 288, target_h=246, bottom_y=276, offset_x=8, angle_deg=-8)
    c_atk = add_slash_arc(
        c_atk,
        bbox=[22, 28, 268, 262],
        start_deg=-55,
        end_deg=68,
        color_outer=(255, 45, 149),
        color_inner=(246, 196, 83),
        width_outer=20,
        width_inner=8
    )
    c_atk.save("assets/enemies/enemy_chef_attack.png")

    # Build unified enemy_chef_death.png (288x224) — downed horizontal butcher matching the exact same character
    c_down = ilt_chef.rotate(-82, resample=Image.Resampling.BICUBIC, expand=True)
    c_death = fit_on_canvas(c_down, 288, 224, target_h=142, bottom_y=198, offset_x=0, angle_deg=0)
    # Darken slightly and add crimson/violet ground pool glow
    enh = ImageEnhance.Brightness(c_death).enhance(0.82)
    pool = Image.new("RGBA", (288, 224), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(pool)
    pdraw.ellipse([34, 162, 254, 206], fill=(157, 23, 77, 110))
    pool = pool.filter(ImageFilter.GaussianBlur(radius=3.0))
    pool.alpha_composite(enh)
    pool.save("assets/enemies/enemy_chef_death.png")
    print("Unified all 24 enemy sprites in assets/enemies/")

def build_tanda_e01():
    # Unblock ART_ASSETS/tanda_E01 using ENEMIGOS.JPG + canonical ILT & unified enemy sprites
    os.makedirs("ART_ASSETS/tanda_E01", exist_ok=True)
    ilt_sec = get_ilt_image("enemy_security")
    ilt_dan = get_ilt_image("enemy_dancer")
    ilt_drn = get_ilt_image("enemy_drone")
    ilt_chf = get_ilt_image("enemy_chef")
    ilt_elt = get_ilt_image("enemy_elite")
    ilt_fan = get_ilt_image("enemy_fanatic")

    def stylize_archetype(base_im, tint_rgb, glow_rgb, scale_h=252, angle=0, flip=False):
        im = base_im.copy()
        if flip:
            im = ImageOps.mirror(im)
        canv = fit_on_canvas(im, 288, 288, target_h=scale_h, bottom_y=276, angle_deg=angle)
        arr = np.array(canv).astype(np.float32)
        a = arr[:,:,3:4] / 255.0
        # Apply subtle color shift toward archetype identity while preserving dark ink outlines
        lum = (0.299*arr[:,:,0] + 0.587*arr[:,:,1] + 0.114*arr[:,:,2])
        mid_mask = ((lum > 35) & (lum < 215) & (arr[:,:,3] > 20))[..., None]
        tint = np.array(tint_rgb, dtype=np.float32).reshape((1, 1, 3))
        arr[:,:,:3] = np.where(mid_mask, arr[:,:,:3]*0.72 + tint*0.28, arr[:,:,:3])
        arr = np.clip(arr, 0, 255).astype(np.uint8)
        out = Image.fromarray(arr, "RGBA")
        # Add subtle neon rim aura underneath
        aura = Image.new("RGBA", (288, 288), (0, 0, 0, 0))
        adraw = ImageDraw.Draw(aura)
        adraw.ellipse([64, 232, 224, 278], fill=(*glow_rgb, 85))
        aura = aura.filter(ImageFilter.GaussianBlur(radius=4.0))
        aura.alpha_composite(out)
        return aura

    e01_specs = [
        ("enemy_01_gorila_discoteca.png", "Gorila Discoteca (Matón del Compás)", "tanque_pesado", ilt_sec, (255, 45, 149), (255, 45, 149), 258, 0, False),
        ("enemy_02_bailarin_poseido.png", "Bailarín Poseído (Suplicante del Espejo)", "melee_basico", ilt_dan, (236, 72, 153), (56, 189, 248), 252, 0, False),
        ("enemy_03_mascara_flotante.png", "Máscara Flotante (Corista Desollado)", "flotante_psiquico", ilt_drn, (56, 189, 248), (255, 45, 149), 236, -4, False),
        ("enemy_04_boca_devoradora.png", "Boca Devoradora (Devorador de Barra)", "bestia_voraz", ilt_chf, (244, 63, 94), (246, 196, 83), 248, 0, False),
        ("enemy_05_mancha_mutante.png", "Mancha Mutante (Masa de Terciopelo)", "mutante_amorfo", ilt_elt, (168, 85, 247), (16, 185, 129), 250, 3, False),
        ("enemy_06_seguidores.png", "Seguidores del Sello (Enjambre Deudor)", "enjambre", ilt_fan, (56, 189, 248), (255, 45, 149), 238, 0, False),
        ("enemy_07_voladores.png", "Voladores (Ojo Acústico de Cabina)", "volador", ilt_drn, (255, 45, 149), (56, 189, 248), 242, 6, True),
        ("enemy_08_explosivos.png", "Explosivos (Kamikaze de Subwoofer)", "explosivo", ilt_fan, (249, 115, 22), (255, 45, 149), 246, -6, True),
        ("enemy_09_rapidos.png", "Rápidos (Sprinter de Pogo)", "rapido", ilt_dan, (225, 29, 72), (246, 196, 83), 244, -8, True),
        ("enemy_10_tanque_pesado.png", "Tanque Pesado (Acorazado de Cobre)", "ranged_tanque", ilt_sec, (246, 196, 83), (56, 189, 248), 262, 0, True),
    ]

    manifest_items = []
    atlas_cols = 5
    atlas_rows = 2
    e01_atlas = Image.new("RGBA", (atlas_cols * 288, atlas_rows * 288), (0, 0, 0, 0))

    for idx, (fname, label, role, base_im, tint, glow, sh, ang, flp) in enumerate(e01_specs):
        out_im = stylize_archetype(base_im, tint, glow, scale_h=sh, angle=ang, flip=flp)
        out_path = os.path.join("ART_ASSETS/tanda_E01", fname)
        out_im.save(out_path)
        r, c = divmod(idx, atlas_cols)
        e01_atlas.alpha_composite(out_im, (c * 288, r * 288))
        manifest_items.append({
            "id": fname.replace(".png", ""),
            "file": out_path,
            "name": label,
            "archetype": role,
            "size": [288, 288],
            "mode": "RGBA",
            "status": "COMPLETED"
        })

    e01_atlas.save("ART_ASSETS/tanda_E01/enemy_atlas.png")
    e01_manifest = {
        "batch_id": "TANDA_E01",
        "category": "enemies",
        "status": "COMPLETED",
        "reference_used": "ART_REFERENCES/ENEMIGOS_user_reference.jpg",
        "style_fusion_target": [
            "ART_REFERENCES/REF_01_identidad_banner.png",
            "ART_REFERENCES/REF_02_circulos_jefes_escenarios.png",
            "ART_REFERENCES/REF_03_biblioteca_assets_ui.png",
            "ART_REFERENCES/ENEMIGOS_user_reference.jpg"
        ],
        "total_assets": 10,
        "atlas": "ART_ASSETS/tanda_E01/enemy_atlas.png",
        "assets": manifest_items
    }
    with open("ART_ASSETS/tanda_E01/manifest.json", "w", encoding="utf-8") as f:
        json.dump(e01_manifest, f, indent=2, ensure_ascii=False)
    print("Completed ART_ASSETS/tanda_E01 (10 enemies + enemy_atlas.png + manifest.json)")

    # Build master assets/atlases/enemies_atlas.png + .json (all 24 gameplay enemy states + 10 tanda_E01)
    os.makedirs("assets/atlases", exist_ok=True)
    all_enemy_files = sorted([os.path.join("assets/enemies", f) for f in os.listdir("assets/enemies") if f.endswith(".png")])
    all_enemy_files += [os.path.join("ART_ASSETS/tanda_E01", spec[0]) for spec in e01_specs]
    cols = 6
    rows = math.ceil(len(all_enemy_files) / cols)
    cw, ch = 288, 288
    master_atlas = Image.new("RGBA", (cols * cw, rows * ch), (0, 0, 0, 0))
    meta = {
        "atlas": "assets/atlases/enemies_atlas.png",
        "cell_size": [cw, ch],
        "total_frames": len(all_enemy_files),
        "frames": {}
    }
    for idx, fp in enumerate(all_enemy_files):
        r, c = divmod(idx, cols)
        im = Image.open(fp).convert("RGBA")
        ox = c * cw + (cw - im.width) // 2
        oy = r * ch + (ch - im.height)
        master_atlas.alpha_composite(im, (ox, oy))
        fid = os.path.basename(fp).replace(".png", "")
        meta["frames"][fid] = {"x": ox, "y": oy, "w": im.width, "h": im.height, "source": fp}
    master_atlas.save("assets/atlases/enemies_atlas.png")
    with open("assets/atlases/enemies_atlas.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print("Saved assets/atlases/enemies_atlas.png & .json")

if __name__ == "__main__":
    unify_enemies()
    build_tanda_e01()
