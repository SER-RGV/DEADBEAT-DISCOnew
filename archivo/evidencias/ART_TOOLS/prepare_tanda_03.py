#!/usr/bin/env python3
"""Tanda 03 / FASE A - preparacion de las 4 laminas de diseno del protagonista.

Convierte las fuentes RGB (fondo negro casi solido con un gradiente suave)
en PNG RGBA con alfa real: sin fondo de color solido incrustado y sin halos
claros en los bordes.

Dificultad: el personaje es mayoritariamente NEGRO (cabello, camiseta,
pantalon) y el fondo tambien, sin un contorno cerrado continuo. Un umbral de
luminancia global se come los negros internos; un region-growing con
tolerancia acumulativa o un flood-fill con umbral alto agujerea la ropa;
un criterio de actividad local tampoco cierra las fugas. La solucion que
pasa todos los puntos de control combina tres cosas:

  1. flood-fill 4-conectividad ESTRICTO desde el borde con tolerancia baja
     (BG_TOL=10): elimina el fondo sin tocar jamas los negros internos;
  2. una ENVOLTURA DE PROXIMIDAD: se marcan los pixeles inequivocamente
     personaje (piel, tatuajes, rim magenta/cian, bien lejos del color de
     fondo) y se propaga con un gaussian blur amplio. El gradiente de fondo
     que el flood-fill dejo como isla queda fuera de la envoltura, mientras
     que pelo, camiseta y pantalon quedan dentro y se conservan opacos;
  3. banda de 2 px alrededor de la envoltura con alfa decreciente. NO se
     des-premultiplica el color: amplificaria un pixel oscuro a claro y
     crearia exactamente el halo que la biblia visual prohibe.

Los parametros se calibraron con ART_TOOLS/qa/calibrate_tanda_03_alpha.py y
se verifican en cada ejecucion con puntos de control de interior y de fondo
(perimetral e interior), registrados en manifest.json.

Son laminas de DISENO/COMPROBACION, no sprites finales: no se genera aqui
ninguna de las 8 orientaciones jugables ni ninguna familia de animacion.
"""

from __future__ import annotations

import hashlib
import json
import statistics
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "ART_ASSETS" / "tanda_03" / "_source"
DST = ROOT / "ART_ASSETS" / "tanda_03"

FILES = [
    ("master_full_body", "Imagen maestra de cuerpo entero, 3/4 isometrica sur-este"),
    ("view_front", "Vista frontal isometrica de comprobacion de identidad"),
    ("view_side", "Vista lateral / perfil 90 grados"),
    ("view_back", "Vista posterior"),
]

BG_TOL = 10        # flood-fill estricto: NO subir, agujerea pelo/ropa
STRONG = 45        # distancia al fondo para considerar pixel inequivocamente personaje
NEAR_BLUR = 50     # radio de propagacion de la envoltura
NEAR_THR = 1       # calibrado: unico valor que pasa 4/4 controles con 0 halos
SOFT_BAND = 5      # MaxFilter(5) => banda suave de 2 px
SOFT_RAMP = 8      # rampa de alfa de la banda
PAD = 2

# Puntos de control en coordenadas de la imagen FUENTE.
# "solid" incluye deliberadamente negros internos (pelo, camiseta, pantalon),
# que son los que un umbral mal calibrado se come. "clear" incluye fondo
# perimetral Y fondo interior lejos del borde, donde aparecia la isla residual.
CONTROL = {
    "master_full_body": {
        "solid": [(430, 160), (420, 480), (260, 500), (400, 900), (360, 1000)],
        "clear": [(20, 20), (820, 20), (20, 600), (820, 600), (20, 1240),
                  (820, 1240), (100, 300), (750, 300), (100, 1000), (750, 1000)],
    },
    "view_front": {
        "solid": [(430, 160), (420, 480), (260, 500), (400, 900), (360, 1000)],
        "clear": [(20, 20), (820, 20), (20, 600), (820, 600), (20, 1240),
                  (820, 1240), (100, 300), (750, 300), (100, 1000), (750, 1000)],
    },
    "view_side": {
        "solid": [(470, 180), (450, 500), (430, 850), (450, 1050), (440, 950)],
        "clear": [(20, 20), (870, 20), (20, 600), (870, 600), (20, 1180),
                  (870, 1180), (100, 300), (800, 300), (100, 1000), (800, 1000)],
    },
    "view_back": {
        "solid": [(420, 180), (420, 480), (300, 500), (360, 850), (360, 1000)],
        "clear": [(20, 20), (820, 20), (20, 600), (820, 600), (20, 1240),
                  (820, 1240), (100, 300), (750, 300), (100, 1000), (750, 1000)],
    },
}


def bg_color(im: Image.Image) -> tuple[int, int, int]:
    w, h = im.size
    samples = []
    for x in range(0, w, max(1, w // 24)):
        samples.append(im.getpixel((x, 0)))
        samples.append(im.getpixel((x, h - 1)))
    for y in range(0, h, max(1, h // 24)):
        samples.append(im.getpixel((0, y)))
        samples.append(im.getpixel((w - 1, y)))
    return tuple(int(statistics.median(s[i] for s in samples)) for i in range(3))


def dist(a: tuple[int, int, int], b: tuple[int, int, int]) -> int:
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))


def build_alpha(im: Image.Image, bg_tol: int = BG_TOL, strong: int = STRONG,
                near_blur: float = NEAR_BLUR,
                near_thr: float = NEAR_THR) -> tuple[Image.Image, dict]:
    """Devuelve la RGBA completa (sin recortar) y metricas de la pasada."""
    w, h = im.size
    px = im.load()
    bg = bg_color(im)

    # 1) flood-fill estricto del fondo conectado al perimetro.
    cand = bytearray(w * h)
    dmap = bytearray(w * h)
    strong_img = Image.new("L", (w, h), 0)
    sp = strong_img.load()
    for y in range(h):
        for x in range(w):
            d = dist(px[x, y], bg)
            dmap[y * w + x] = min(255, d)
            if d <= bg_tol:
                cand[y * w + x] = 1
            if d > strong:
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
            if nx < 0 or ny < 0 or nx >= w or ny >= h:
                continue
            j = ny * w + nx
            if cand[j] and not ext[j]:
                ext[j] = 1
                q.append((nx, ny))

    # 2) envoltura de proximidad alrededor de las zonas inequivocas.
    near = strong_img.filter(ImageFilter.GaussianBlur(near_blur)).load()
    core = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if not ext[i] and near[x, y] > near_thr:
                core[i] = 1
    core_img = Image.new("L", (w, h), 0)
    core_img.putdata([255 if v else 0 for v in core])
    band = core_img.filter(ImageFilter.MaxFilter(SOFT_BAND)).load()
    corep = core_img.load()

    # 3) alfa: interior opaco, banda suave, exterior transparente.
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    n_transparent = n_solid = n_soft = halo = bg_residual = 0
    for y in range(h):
        for x in range(w):
            c = px[x, y]
            i = y * w + x
            if core[i]:
                op[x, y] = (*c, 255)
                n_solid += 1
                if dmap[i] <= 10:
                    bg_residual += 1
                continue
            if band[x, y] and not ext[i]:
                v = near[x, y] / SOFT_RAMP
                a = max(0.0, min(1.0, v))
                if a <= 0.05:
                    op[x, y] = (*c, 0)
                    n_transparent += 1
                    continue
                av = round(a * 255)
                op[x, y] = (*c, av)
                n_soft += 1
                if a < 0.6 and sum(c) > sum(bg) + 120:
                    halo += 1
                continue
            op[x, y] = (*c, 0)
            n_transparent += 1
    metrics = {
        "bg": list(bg), "bg_tol": bg_tol, "strong": strong,
        "near_blur": near_blur, "near_thr": near_thr,
        "alpha_transparent_px": n_transparent, "alpha_solid_px": n_solid,
        "alpha_soft_edge_px": n_soft, "bright_halo_candidates_px": halo,
        "solid_background_like_px": bg_residual,
    }
    return out, metrics


def check_controls(name: str, out: Image.Image) -> dict:
    a = out.getchannel("A").load()
    c = CONTROL[name]
    solid = {p: a[p[0], p[1]] for p in c["solid"]}
    clear = {p: a[p[0], p[1]] for p in c["clear"]}
    return {
        "solid_points": {f"{x},{y}": v for (x, y), v in solid.items()},
        "background_points": {f"{x},{y}": v for (x, y), v in clear.items()},
        "interior_preserved": all(v == 255 for v in solid.values()),
        "background_cleared": all(v == 0 for v in clear.values()),
    }


def process(name: str, description: str) -> dict:
    src = SRC / f"{name}.png"
    im = Image.open(src).convert("RGB")
    w, h = im.size
    out, m = build_alpha(im)
    qa = check_controls(name, out)
    if not qa["interior_preserved"] or not qa["background_cleared"]:
        raise RuntimeError(f"{name}: QA de puntos de control fallida: {qa}")

    bbox = out.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"{name}: alfa totalmente vacio")
    x0, y0, x1, y1 = bbox
    x0, y0 = max(0, x0 - PAD), max(0, y0 - PAD)
    x1, y1 = min(w, x1 + PAD), min(h, y1 + PAD)
    out = out.crop((x0, y0, x1, y1))

    dst = DST / f"{name}.png"
    out.save(dst, "PNG", optimize=True)
    sha = hashlib.sha256(dst.read_bytes()).hexdigest()
    hist = out.getchannel("A").histogram()
    area = out.size[0] * out.size[1]
    return {
        "id": name,
        "description": description,
        "source": str(src.relative_to(ROOT)),
        "file": str(dst.relative_to(ROOT)),
        "source_size": [w, h],
        "output_size": list(out.size),
        "mode": "RGBA",
        "background_sampled": m["bg"],
        "alpha_params": {k: m[k] for k in
                         ("bg_tol", "strong", "near_blur", "near_thr")},
        "alpha_bbox_in_source": [x0, y0, x1, y1],
        "alpha_min": min(i for i, n in enumerate(hist) if n),
        "alpha_max": max(i for i, n in enumerate(hist) if n),
        "alpha_transparent_px": m["alpha_transparent_px"],
        "alpha_solid_px": m["alpha_solid_px"],
        "alpha_soft_edge_px": m["alpha_soft_edge_px"],
        "bright_halo_candidates_px": m["bright_halo_candidates_px"],
        "solid_background_like_px": m["solid_background_like_px"],
        "solid_ratio_in_crop": round(m["alpha_solid_px"] / area, 4),
        "control_points_qa": qa,
        "pivot_proposed": "bottom-center (x=w/2, y=h); pie de apoyo en el borde inferior",
        "sha256": sha,
        "bytes": dst.stat().st_size,
    }


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    items = [process(n, d) for n, d in FILES]
    manifest = {
        "tanda": "03",
        "fase": "A",
        "status": "DISENO MAESTRO - PENDIENTE DE APROBACION EXPLICITA",
        "purpose": "Laminas de diseno/comprobacion de identidad. NO son sprites finales.",
        "reference": "ART_REFERENCES/REF_04_protagonista_banner.png",
        "audit": "ART_AUDIT/player_render_audit.json",
        "palette": ["#0a0c12", "#191a25", "#2d0619", "#ff2d95",
                    "#facc15", "#38bdf8", "#c084fc"],
        "preparation": "ART_TOOLS/prepare_tanda_03.py",
        "alpha_calibration": "ART_TOOLS/qa/calibrate_tanda_03_alpha.py",
        "discarded": "ART_ASSETS/tanda_03/_source/DISCARDED_turnaround_draft.png",
        "discarded_reason": "La primera generacion devolvio un turnaround de 7 figuras; "
                            "no cumple 'una imagen maestra de cuerpo entero'. Se conserva "
                            "solo como referencia de identidad, no es entregable.",
        "not_generated": ["8 orientaciones jugables", "8 familias de animacion",
                          "spritesheet definitivo", "integracion en HTML"],
        "items": items,
    }
    (DST / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    for it in items:
        q = it["control_points_qa"]
        print(f"{it['id']:18s} {it['source_size']} -> {it['output_size']} "
              f"alfa {it['alpha_min']}..{it['alpha_max']} "
              f"suave={it['alpha_soft_edge_px']} halos={it['bright_halo_candidates_px']} "
              f"QA interior={q['interior_preserved']} fondo={q['background_cleared']} "
              f"sha={it['sha256'][:12]}")
    print("manifest.json escrito")


if __name__ == "__main__":
    main()
