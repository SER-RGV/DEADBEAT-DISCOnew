#!/usr/bin/env python3
"""Tanda 03 / FASE C - 8 familias de animacion del protagonista.

Un asset individual por familia, todos en el MISMO lienzo canonico (560x1130)
con el suelo en y=1130 y anclaje abajo-centro. Eso es lo que hace posible la
continuidad de fotogramas: ningun frame se recorta con un bbox propio, todos
comparten coordenadas, escala y punto de apoyo.

El pipeline de alfa hereda la logica calibrada en FASE A (flood-fill estricto
+ envoltura de proximidad, sin des-premultiplicacion) y la EXTiende para los
fondos claros: dos de las fuentes salieron con fondo blanco o con una mancha
blanca. Se eliminan los pixeles de fondo oscuro Y los claros neutros
conectados al borde, conservando piel, tatuajes y cabello por saturacion y
por la envoltura.

Los 8 assets son POSES CLAVE de diseno, no una secuencia de N fotogramas por
familia: el limite es 10 assets por tanda y la secuenciacion real depende del
controlador del motor (FASE D). La continuidad se mide y se documenta aqui.

NO integra en el HTML, NO crea un segundo sistema de animacion y NO toca
mecanicas, armas ni render.
"""

from __future__ import annotations

import hashlib
import json
import statistics
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ART_TOOLS"))
import prepare_tanda_03 as A  # noqa: E402

SRC = ROOT / "ART_ASSETS" / "tanda_03" / "fase_c" / "_source"
DST = ROOT / "ART_ASSETS" / "tanda_03" / "fase_c"

CANVAS_W, CANVAS_H = 560, 1130
PAD = 2
BG_DARK_TOL = 12
LIGHT_MIN = 150          # min(canal) para considerar claro-neutro
LIGHT_NEUTRAL = 35       # max(canal)-min(canal) maximo de un gris de fondo
STRONG = 45
NEAR_BLUR = 50
NEAR_THR = 1
SOFT_BAND = 5
SOFT_RAMP = 8
MIN_HOLE = 9            # area minima de un agujero interno a corregir
MAX_HOLE = 8000         # area maxima: por encima se respeta como abertura real


def fill_internal_holes(out: Image.Image, src: Image.Image) -> tuple[int, int]:
    """Rellena agujeros de alfa rodeados por personaje con el color ORIGINAL.

    El generador deja a veces parches negros muy lisos en camiseta o pantalon
    que el flood-fill clasifica como fondo. El color de la fuente es correcto;
    solo el alfa se puso a 0. Se rellenan unicamente componentes transparentes
    que NO tocan el borde del lienzo y que son pequenas, para no cerrar
    aberturas reales entre brazo y torso o entre piernas.
    """
    w, h = out.size
    a = out.getchannel("A").load()
    sp = src.load()
    seen = bytearray(w * h)
    op = out.load()
    holes = pixels = 0
    for sy in range(h):
        for sx in range(w):
            i = sy * w + sx
            if seen[i] or a[sx, sy] > 128:
                continue
            q = deque([(sx, sy)])
            seen[i] = 1
            comp = []
            touches_border = False
            while q:
                x, y = q.popleft()
                comp.append((x, y))
                if x == 0 or y == 0 or x == w - 1 or y == h - 1:
                    touches_border = True
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if not seen[j] and a[nx, ny] <= 128:
                            seen[j] = 1
                            q.append((nx, ny))
            if touches_border or not (MIN_HOLE <= len(comp) <= MAX_HOLE):
                continue
            holes += 1
            pixels += len(comp)
            for x, y in comp:
                op[x, y] = (*sp[x, y], 255)
    return holes, pixels


def is_white_speck(c: tuple[int, int, int]) -> bool:
    """Blanco/gris muy claro y NEUTRO. La piel iluminada llega a ~207 y tiene
    tinte, asi que queda fuera: esto solo captura motas del generador."""
    return min(c) > 210 and (max(c) - min(c)) < 20


def repair_white_specks(out: Image.Image) -> tuple[int, int]:
    """Inpainting por propagacion: cada mota blanca toma el color medio de sus
    vecinos opacos no-blancos (y ese color se propaga al interior de la mota).
    Mantiene alfa 255: es personaje, no fondo."""
    w, h = out.size
    px = out.load()
    seen = bytearray(w * h)
    specks = pixels = 0
    for sy in range(h):
        for sx in range(w):
            i = sy * w + sx
            if seen[i] or px[sx, sy][3] <= 128 or not is_white_speck(px[sx, sy][:3]):
                continue
            q = deque([(sx, sy)])
            seen[i] = 1
            comp = []
            while q:
                x, y = q.popleft()
                comp.append((x, y))
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        cc = px[nx, ny]
                        if not seen[j] and cc[3] > 128 and is_white_speck(cc[:3]):
                            seen[j] = 1
                            q.append((nx, ny))
            if len(comp) > 2000:
                continue
            specks += 1
            pixels += len(comp)
            inside = set(comp)
            colour = {}
            frontier = deque()
            for x, y in comp:
                acc = []
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if (nx, ny) in inside or not (0 <= nx < w and 0 <= ny < h):
                        continue
                    cc = px[nx, ny]
                    if cc[3] > 128 and not is_white_speck(cc[:3]):
                        acc.append(cc[:3])
                if acc:
                    colour[(x, y)] = tuple(
                        round(sum(c[k] for c in acc) / len(acc)) for k in range(3))
                    frontier.append((x, y))
            while frontier:
                x, y = frontier.popleft()
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if (nx, ny) in inside and (nx, ny) not in colour:
                        colour[(nx, ny)] = colour[(x, y)]
                        frontier.append((nx, ny))
            if colour:
                default = tuple(round(sum(v[k] for v in colour.values()) / len(colour))
                                for k in range(3))
            else:
                default = (12, 12, 14)
            for x, y in comp:
                px[x, y] = (*colour.get((x, y), default), 255)
    return specks, pixels


# Mapeo a los estados REALES del motor (ART_AUDIT/player_render_audit.json).
FAMILIES = [
    ("IDLE", "idle", 10, "Postura neutral de pie, frame cero de la serie"),
    ("CAMINAR", "walk", 15, "Paso medio, pierna izquierda adelante, contrabalanceo de brazos"),
    ("CORRER", "run", 20, "Sprint, torso inclinado, rodilla alta, cabello hacia atras"),
    ("DISPARAR", "shoot", 60, "Apoyo estable, ambos brazos al frente empuñando arma INVISIBLE"),
    ("DISPARO_CARGADO", "charged", 65, "Misma familia de disparo con mayor tension y apertura de piernas"),
    ("HABILIDAD", "ability", 70, "Brazo derecho levantado, mano abierta, sin efectos"),
    ("DANO", "hurt", 80, "Retroceso por impacto, torso arqueado, mano al pecho"),
    ("MUERTE", "death", 100, "Cuerpo abatido en horizontal, ojos cerrados, silueta ancha y baja"),
]


def bg_dark(im: Image.Image) -> tuple[int, int, int]:
    """Mediana de los pixeles OSCUROS del perimetro (ignora zonas blancas)."""
    w, h = im.size
    s = []
    for x in range(0, w, max(1, w // 24)):
        s += [im.getpixel((x, 0)), im.getpixel((x, h - 1))]
    for y in range(0, h, max(1, h // 24)):
        s += [im.getpixel((0, y)), im.getpixel((w - 1, y))]
    dark = [c for c in s if max(c) < 60]
    if not dark:
        return (3, 3, 2)
    return tuple(int(statistics.median(c[i] for c in dark)) for i in range(3))


def is_light_neutral(c: tuple[int, int, int]) -> bool:
    return min(c) > LIGHT_MIN and (max(c) - min(c)) < LIGHT_NEUTRAL


def build_alpha(im: Image.Image) -> tuple[Image.Image, dict]:
    w, h = im.size
    px = im.load()
    bg = bg_dark(im)

    cand = bytearray(w * h)
    strong_img = Image.new("L", (w, h), 0)
    sp = strong_img.load()
    light_px = 0
    for y in range(h):
        for x in range(w):
            c = px[x, y]
            dd = A.dist(c, bg)
            light = is_light_neutral(c)
            if light:
                light_px += 1
            if dd <= BG_DARK_TOL or light:
                cand[y * w + x] = 1
            if dd > STRONG and not light:
                sp[x, y] = 255

    ext = bytearray(w * h)
    q = deque()
    border = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)]
    border += [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    for x, y in border:
        i = y * w + x
        if cand[i] and not ext[i]:
            ext[i] = 1
            q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                j = ny * w + nx
                if cand[j] and not ext[j]:
                    ext[j] = 1
                    q.append((nx, ny))

    near = strong_img.filter(ImageFilter.GaussianBlur(NEAR_BLUR)).load()
    core = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if not ext[i] and near[x, y] > NEAR_THR:
                core[i] = 1
    core_img = Image.new("L", (w, h), 0)
    core_img.putdata([255 if v else 0 for v in core])
    band = core_img.filter(ImageFilter.MaxFilter(SOFT_BAND)).load()
    corep = core_img.load()

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    soft = halo = residual_light = 0
    for y in range(h):
        for x in range(w):
            c = px[x, y]
            i = y * w + x
            if core[i]:
                op[x, y] = (*c, 255)
                if is_light_neutral(c):
                    residual_light += 1
                continue
            if band[x, y] and not ext[i]:
                v = min(1.0, near[x, y] / SOFT_RAMP)
                if v <= 0.05:
                    op[x, y] = (*c, 0)
                    continue
                av = round(v * 255)
                op[x, y] = (*c, av)
                soft += 1
                # Un halo real es un gris/blanco NEUTRO semitransparente.
                # Piel, tatuajes y rim magenta/cian son saturados: no son halos.
                if v < 0.6 and is_light_neutral(c):
                    halo += 1
                continue
            op[x, y] = (*c, 0)
    holes, hole_px = fill_internal_holes(out, im)
    specks, speck_px = repair_white_specks(out)
    return out, {"bg_dark": list(bg), "light_pixels_in_source": light_px,
                 "alpha_soft_edge_px": soft, "bright_halo_candidates_px": halo,
                 "light_neutral_opaque_px": residual_light,
                 "internal_holes_filled": holes, "hole_pixels_restored": hole_px,
                 "white_specks_repaired": specks,
                 "white_speck_pixels_restored": speck_px}


def to_canvas(out: Image.Image) -> tuple[Image.Image, dict]:
    """Recorta, escala y ancla abajo-centro en el lienzo canonico compartido."""
    bb = out.getchannel("A").getbbox()
    if bb is None:
        raise RuntimeError("alfa vacio")
    x0, y0, x1, y1 = bb
    w, h = out.size
    x0, y0 = max(0, x0 - PAD), max(0, y0 - PAD)
    x1, y1 = min(w, x1 + PAD), min(h, y1 + PAD)
    crop = out.crop((x0, y0, x1, y1))
    cw, ch = crop.size
    f = min(CANVAS_W / cw, CANVAS_H / ch)
    nw, nh = max(1, round(cw * f)), max(1, round(ch * f))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    canvas.paste(crop, ((CANVAS_W - nw) // 2, CANVAS_H - nh), crop)
    return canvas, {"raw_bbox_in_source": [x0, y0, x1, y1],
                    "scaled_size": [nw, nh], "scale_factor": round(f, 5)}


def continuity_metrics(out: Image.Image) -> dict:
    a = out.getchannel("A").load()
    w, h = out.size
    rows = [y for y in range(h) if any(a[x, y] > 128 for x in range(w))]
    cols = [x for x in range(w) if any(a[x, y] > 128 for y in range(h))]
    total = sum(1 for y in range(0, h, 2) for x in range(0, w, 2) if a[x, y] > 128)
    cy = sum(y for y in range(0, h, 2) for x in range(0, w, 2)
             if a[x, y] > 128) / total if total else 0
    return {"head_row": min(rows) if rows else None,
            "support_row": max(rows) if rows else None,
            "silhouette_height": (max(rows) - min(rows) + 1) if rows else 0,
            "silhouette_width": (max(cols) - min(cols) + 1) if cols else 0,
            "center_of_mass_y": round(cy, 1),
            "support_aligned_to_canvas_bottom": bool(rows and max(rows) >= h - 6),
            "opaque_sample_px": total}


def process(key: str, state: str, priority: int, desc: str) -> dict:
    src = SRC / f"{key}.png"
    im = Image.open(src).convert("RGB")
    sw, sh = im.size
    out, m = build_alpha(im)
    canvas, geo = to_canvas(out)
    cont = continuity_metrics(canvas)
    a = canvas.getchannel("A").load()
    if not (a[CANVAS_W // 2, CANVAS_H - 5] or cont["opaque_sample_px"] > 500):
        print(f"  aviso {key}: poco contenido opaco")
    # El borde INFERIOR es el suelo: los pies DEBEN tocarlo, y MUERTE ocupa
    # casi todo el ancho. Se comprueba solo borde superior y mitad superior
    # de los laterales, donde ningun personaje puede llegar. Un fondo
    # incrustado apareceria justamente ahi.
    perim = [(x, 0) for x in range(0, CANVAS_W, 20)]
    perim += [(x, y) for y in range(0, CANVAS_H // 2, 20)
              for x in (0, CANVAS_W - 1)]
    perim += [(0, 0), (CANVAS_W - 1, 0)]
    # Umbral 128: un fondo incrustado seria totalmente opaco. Los valores
    # residuales <=11 son cola de la banda suave de antialiasing, no fondo.
    perimeter_clear = all(a[x, y] <= 128 for x, y in perim)

    dst = DST / f"{key}.png"
    canvas.save(dst, "PNG", optimize=True)
    sha = hashlib.sha256(dst.read_bytes()).hexdigest()
    hist = canvas.getchannel("A").histogram()
    return {
        "id": key,
        "engine_state": state,
        "state_priority": priority,
        "description": desc,
        "source": str(src.relative_to(ROOT)),
        "file": str(dst.relative_to(ROOT)),
        "source_size": [sw, sh],
        "output_size": [CANVAS_W, CANVAS_H],
        "mode": "RGBA",
        "canvas_shared": "560x1130, suelo en y=1130, anclaje abajo-centro",
        "geometry": geo,
        "alpha_min": min(i for i, n in enumerate(hist) if n),
        "alpha_max": max(i for i, n in enumerate(hist) if n),
        "alpha_metrics": {k: m[k] for k in
                          ("bg_dark", "light_pixels_in_source",
                           "alpha_soft_edge_px", "bright_halo_candidates_px",
                           "light_neutral_opaque_px",
                           "internal_holes_filled", "hole_pixels_restored",
                           "white_specks_repaired",
                           "white_speck_pixels_restored")},
        "continuity": cont,
        "perimeter_clear": perimeter_clear,
        "pivot_proposed": "bottom-center (x=280, y=1130)",
        "sha256": sha,
        "bytes": dst.stat().st_size,
    }


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    items = [process(*f) for f in FAMILIES]
    upright = [i for i in items if i["id"] != "MUERTE"]
    aligned = sum(1 for i in items if i["continuity"]["support_aligned_to_canvas_bottom"])
    heights = [i["continuity"]["silhouette_height"] for i in upright]
    height_spread = max(heights) - min(heights) if heights else 0
    halos_ok = all(i["alpha_metrics"]["bright_halo_candidates_px"] == 0 for i in items)
    perimeter_ok = all(i["perimeter_clear"] for i in items)
    rgba_ok = all(i["mode"] == "RGBA" and i["alpha_min"] == 0
                  and i["alpha_max"] == 255 for i in items)
    death_ok = next(i for i in items if i["id"] == "MUERTE")["continuity"]["silhouette_height"] < 400
    closed = (aligned == len(items) and halos_ok and perimeter_ok
              and rgba_ok and death_ok)
    manifest = {
        "tanda": "03", "fase": "C",
        "status": ("FASE C CERRADA - 8 poses clave, lienzo canonico compartido, "
                   "continuidad medida; NO integradas en el juego" if closed
                   else "FASE C NO CERRADA - revisar QA"),
        "purpose": "Un asset individual por familia de animacion. Poses CLAVE de "
                   "diseno, no una secuencia de N fotogramas por familia: el limite "
                   "es 10 assets por tanda y la secuenciacion real depende del "
                   "controlador del motor (FASE D).",
        "identity_reference": "ART_ASSETS/tanda_03/master_full_body.png",
        "orientation_reference": "ART_ASSETS/tanda_03/fase_b/SE.png",
        "engine_states_source": "ART_AUDIT/player_render_audit.json (STATE_PRIORITIES)",
        "preparation": "ART_TOOLS/prepare_tanda_03_fase_c.py",
        "canvas": {"width": CANVAS_W, "height": CANVAS_H,
                   "ground_y": CANVAS_H, "anchor": "bottom-center",
                   "reason": "Todos los frames comparten coordenadas, escala y "
                             "punto de apoyo: es la base de la continuidad."},
        "max_assets_per_tanda": 10,
        "assets_in_this_tanda": len(items),
        "continuity_qa": {
            "frames_with_support_on_ground": f"{aligned}/{len(items)}",
            "upright_silhouette_height_spread_px": height_spread,
            "upright_heights": {i["id"]: i["continuity"]["silhouette_height"] for i in upright},
            "death_is_horizontal_low_silhouette": death_ok,
            "all_perimeters_transparent": perimeter_ok,
            "no_bright_neutral_halos": halos_ok,
            "all_rgba_with_real_alpha": rgba_ok,
            "internal_alpha_holes_repaired": sum(
                i["alpha_metrics"]["internal_holes_filled"] for i in items),
            "white_specks_inpainted": sum(
                i["alpha_metrics"]["white_specks_repaired"] for i in items),
            "metric_note": "light_neutral_opaque_px cuenta piel/tatuajes claros "
                           "legitimos, por eso NO se usa como criterio de cierre; "
                           "se comprueba en su lugar que el perimetro quede "
                           "totalmente transparente.",
            "transition_order": ["IDLE", "CAMINAR", "CORRER", "DISPARAR",
                                 "DISPARO_CARGADO", "HABILIDAD", "DANO", "MUERTE"],
            "note": "La continuidad se mide aqui por lienzo, suelo, escala y "
                    "silueta. La secuenciacion REAL de fotogramas sigue "
                    "NO VERIFICADA hasta FASE D con el controlador del motor.",
        },
        "known_deviations": [
            "CORRER y HABILIDAD se generaron con fondo blanco o mancha blanca; "
            "se elimino en el pipeline de alfa con deteccion de claros neutros "
            "conectados al borde (sin regenerar ni usar reflejos).",
            "MUERTE se regenero una vez: la primera salida era una figura de pie "
            "con los ojos cerrados, no un cuerpo abatido.",
        ],
        "not_generated": ["N fotogramas por familia", "spritesheet definitivo",
                          "integracion en HTML", "cambios en el render",
                          "segundo sistema de animacion"],
        "items": items,
    }
    (DST / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    for i in items:
        c = i["continuity"]
        print(f"{i['id']:16s} {i['engine_state']:8s} p={i['state_priority']:3d}  "
              f"src={str(i['source_size']):>11} h={c['silhouette_height']:4d} "
              f"w={c['silhouette_width']:3d} suelo={c['support_aligned_to_canvas_bottom']} "
              f"huecos={i['alpha_metrics']['internal_holes_filled']:2d} "
              f"perim={i['perimeter_clear']} "
              f"halos={i['alpha_metrics']['bright_halo_candidates_px']} sha={i['sha256'][:12]}")
    print(f"\nSuelo alineado {aligned}/{len(items)}; dispersion alturas erguidas "
          f"{height_spread}px; muerte horizontal={death_ok}; "
          f"perimetros limpios={perimeter_ok}; halos={halos_ok}; RGBA={rgba_ok}")
    print("ESTADO:", "CERRADA" if closed else "NO CERRADA")
    print("manifest.json escrito")


if __name__ == "__main__":
    main()
