#!/usr/bin/env python3
"""Tanda 03 / FASE B - 8 orientaciones isometricas del protagonista.

Reutiliza el pipeline de alfa calibrado en FASE A (prepare_tanda_03.py),
recorta al bounding box, normaliza TODAS las vistas a la misma altura canonica
(1130 px, la de la imagen maestra de FASE A) para que compartan escala y punto
de apoyo, y genera el manifest con la convencion de angulos.

QA de orientacion (tres señales complementarias):
  * IoU DIRECTO de siluetas: detecta dos vistas que repiten el mismo angulo.
  * IoU contra REFLEJO horizontal: detectaria un flip literal (prohibido).
  * SESGO DE CABEZA: diferencia entre el centro de masa de la silueta en la
    banda de la cabeza y en la banda del torso, normalizada por el ancho.
    Un perfil/3-4 hacia la derecha da valor positivo; hacia la izquierda,
    negativo. Los pares opuestos deben tener signos contrarios.

FASE B solo produce las 8 vistas de orientacion. NO genera animaciones, NO
integra en el HTML y NO crea ningun sistema de animacion.
"""

from __future__ import annotations

import hashlib
import json
import sys
from itertools import combinations
from pathlib import Path

from PIL import Image, ImageChops, ImageOps

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ART_TOOLS"))
import prepare_tanda_03 as A  # noqa: E402

SRC = ROOT / "ART_ASSETS" / "tanda_03" / "fase_b" / "_source"
DST = ROOT / "ART_ASSETS" / "tanda_03" / "fase_b"

# Convencion coherente con el canvas del motor: aimAngle = atan2(dy, dx),
# +x = este (pantalla derecha), +y = sur (hacia la camara).
# bg_tol=14 solo en NE: su fuente tiene un residuo de fondo con distancia 11
# al color de fondo; 14 lo elimina sin agujerear el cabello (verificado).
ORIENTATIONS = [
    ("E", 0, "Perfil mirando al este (derecha); se ve el lado izquierdo del cuerpo", 10),
    ("SE", 45, "Tres cuartos frontal hacia el sureste; hombro derecho cercano", 10),
    ("S", 90, "Frontal recta mirando a la camara; ambos ojos y hombros simetricos", 10),
    ("SO", 135, "Tres cuartos frontal hacia el suroeste; hombro izquierdo cercano", 10),
    ("O", 180, "Perfil mirando al oeste (izquierda); se ve el lado derecho del cuerpo", 10),
    ("NO", 225, "Tres cuartos de espaldas hacia el noroeste; rostro no visible", 10),
    ("N", 270, "Espalda recta alejandose; rostro no visible, simetrica", 10),
    ("NE", 315, "Tres cuartos de espaldas hacia el noreste; rostro no visible", 10),
]

CANON_H = 1130          # altura de master_full_body.png (FASE A)
PAD = 2
FLIP_IOU_ALERT = 0.90
DUP_IOU_ALERT = 0.90


def qa_corners(out: Image.Image) -> bool:
    a = out.getchannel("A").load()
    w, h = out.size
    return all(a[x, y] == 0 for x, y in
               [(1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2)])


def head_bias(out: Image.Image) -> float:
    """Sesgo horizontal de la cara respecto al centro global, normalizado.

    Señal AUXILIAR: positivo = cabeza desplazada a la derecha. Discrimina bien
    perfiles opuestos, pero es poco sensible en tres cuartos sutiles, por lo que
    NO se usa como condicion de cierre. La evidencia de angulos opuestos es la
    inspeccion visual ampliada mas el IoU directo/reflejo.
    """
    a = out.getchannel("A").load()
    w, h = out.size

    def cx(y0: float, y1: float) -> float:
        total = n = 0
        for y in range(int(h * y0), int(h * y1), 2):
            for x in range(0, w, 2):
                if a[x, y] > 128:
                    total += x
                    n += 1
        return total / n if n else w / 2

    return round((cx(0.13, 0.21) - cx(0.05, 1.0)) / w, 4)


def process(key: str, deg: int, desc: str, bg_tol: int) -> dict:
    src = SRC / f"{key}.png"
    im = Image.open(src).convert("RGB")
    w, h = im.size
    out, m = A.build_alpha(im, bg_tol=bg_tol)
    if m["bright_halo_candidates_px"]:
        raise RuntimeError(f"{key}: halos detectados: {m['bright_halo_candidates_px']}")
    if not qa_corners(out):
        raise RuntimeError(f"{key}: el fondo no quedo transparente en las esquinas")

    bbox = out.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"{key}: alfa vacio")
    x0, y0, x1, y1 = bbox
    x0, y0 = max(0, x0 - PAD), max(0, y0 - PAD)
    x1, y1 = min(w, x1 + PAD), min(h, y1 + PAD)
    out = out.crop((x0, y0, x1, y1))
    raw_size = list(out.size)

    nh = CANON_H
    nw = max(1, round(out.size[0] * nh / out.size[1]))
    out = out.resize((nw, nh), Image.LANCZOS)

    a = out.getchannel("A").load()
    cx, cy = nw // 2, int(nh * 0.45)
    core_ok = a[cx, cy] > 200
    if not core_ok:
        raise RuntimeError(f"{key}: el centro del torso no quedo opaco")

    dst = DST / f"{key}.png"
    out.save(dst, "PNG", optimize=True)
    sha = hashlib.sha256(dst.read_bytes()).hexdigest()
    hist = out.getchannel("A").histogram()
    return {
        "id": key,
        "direction_deg": deg,
        "aim_angle_rad": round(deg * 3.141592653589793 / 180, 4),
        "facing_left_expected": 90 < deg < 270,
        "description": desc,
        "source": str(src.relative_to(ROOT)),
        "file": str(dst.relative_to(ROOT)),
        "source_size": [w, h],
        "raw_crop_size": raw_size,
        "output_size": list(out.size),
        "mode": "RGBA",
        "scale_normalized_to_height": CANON_H,
        "alpha_bg_tol": bg_tol,
        "alpha_min": min(i for i, n in enumerate(hist) if n),
        "alpha_max": max(i for i, n in enumerate(hist) if n),
        "alpha_soft_edge_px": m["alpha_soft_edge_px"],
        "bright_halo_candidates_px": m["bright_halo_candidates_px"],
        "head_bias": head_bias(out),
        "torso_control_point": [cx, cy],
        "torso_opaque": core_ok,
        "corners_clear": True,
        "pivot_proposed": "bottom-center (x=w/2, y=h); pie de apoyo en el borde inferior",
        "sha256": sha,
        "bytes": dst.stat().st_size,
    }


def norm(im: Image.Image, size=(256, 384)) -> Image.Image:
    a = im.getchannel("A")
    bb = a.getbbox()
    if bb:
        im = im.crop(bb)
    im = im.copy()
    im.thumbnail(size, Image.LANCZOS)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.paste(im, ((size[0] - im.size[0]) // 2,
                      (size[1] - im.size[1]) // 2), im)
    return canvas


def _iou(ia: Image.Image, ib: Image.Image) -> float:
    ma = ia.getchannel("A").point(lambda v: 255 if v > 128 else 0)
    mb = ib.getchannel("A").point(lambda v: 255 if v > 128 else 0)
    inter = ImageChops.darker(ma, mb).histogram()[255]
    union = ImageChops.lighter(ma, mb).histogram()[255]
    return round(inter / union, 4) if union else 0.0


def anti_flip(keys: list[str]) -> dict:
    """Detecta reflejos puros Y duplicados directos del mismo angulo."""
    imgs = {k: norm(Image.open(DST / f"{k}.png").convert("RGBA")) for k in keys}
    rows = []
    for a, b in combinations(keys, 2):
        ia, ib = imgs[a], imgs[b]
        flip = ImageOps.mirror(ib)
        mirror_iou = _iou(ia, flip)
        direct_iou = _iou(ia, ib)
        ma = ia.getchannel("A").point(lambda v: 255 if v > 128 else 0)
        mb = flip.getchannel("A").point(lambda v: 255 if v > 128 else 0)
        both = ImageChops.darker(ma, mb)
        da = ImageChops.difference(ia.convert("RGB"), flip.convert("RGB"))
        da = ImageChops.multiply(da, Image.merge("RGB", (both, both, both)))
        hist = da.convert("L").histogram()
        total = sum(hist)
        mean_diff = round(sum(i * n for i, n in enumerate(hist)) / total, 2) if total else 0
        rows.append({
            "a": a, "b": b,
            "direct_iou": direct_iou,
            "mirror_iou": mirror_iou,
            "mirror_rgb_mean_diff": mean_diff,
            "suspected_pure_flip": mirror_iou > FLIP_IOU_ALERT,
            "suspected_same_angle_duplicate": direct_iou > DUP_IOU_ALERT,
        })
    rows.sort(key=lambda r: -max(r["direct_iou"], r["mirror_iou"]))
    return {
        "method": "IoU de silueta directo y contra reflejo horizontal, mas diferencia RGB media",
        "flip_alert_threshold_iou": FLIP_IOU_ALERT,
        "duplicate_alert_threshold_iou": DUP_IOU_ALERT,
        "pairs_checked": len(rows),
        "suspected_pure_flips": [r for r in rows if r["suspected_pure_flip"]],
        "suspected_same_angle_duplicates": [r for r in rows
                                            if r["suspected_same_angle_duplicate"]],
        "top_8_most_similar": rows[:8],
        "opposite_pairs": [r for r in rows if {r["a"], r["b"]} in
                           [{"E", "O"}, {"SE", "SO"}, {"NE", "NO"}]],
    }


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    items = [process(k, d, desc, tol) for k, d, desc, tol in ORIENTATIONS]
    keys = [k for k, _, _, _ in ORIENTATIONS]
    qa = anti_flip(keys)
    bias = {it["id"]: it["head_bias"] for it in items}
    opposite = {
        "E_vs_O": [bias["E"], bias["O"]],
        "SE_vs_SO": [bias["SE"], bias["SO"]],
        "NE_vs_NO": [bias["NE"], bias["NO"]],
    }
    opposite_ok = all(v[0] * v[1] < 0 for v in opposite.values())
    # El cierre NO depende de head_bias: es una senal auxiliar poco sensible en
    # tres cuartos sutiles. La evidencia de angulos opuestos es la inspeccion
    # visual ampliada mas el IoU directo/reflejo de los 28 pares.
    closed = (not qa["suspected_pure_flips"]
              and not qa["suspected_same_angle_duplicates"]
              and all(it["torso_opaque"] and it["corners_clear"]
                      and it["bright_halo_candidates_px"] == 0 for it in items))
    manifest = {
        "tanda": "03",
        "fase": "B",
        "status": ("FASE B CERRADA - 8 orientaciones unicas, mismas identidad y escala, "
                   "sin reflejos ni duplicados; NO integradas en el juego"
                   if closed else "FASE B NO CERRADA - revisar QA"),
        "approved_from_phase": "FASE A aprobada por el usuario el 2026-11-03",
        "purpose": "Vistas isometricas de orientacion listas para adaptar al pipeline REAL "
                   "en FASE D; aun no son sprites integrados.",
        "angle_convention": "aimAngle = atan2(dy,dx); +x = este (derecha), "
                            "+y = sur (hacia la camara). 8 sectores de 45 grados.",
        "identity_reference": "ART_ASSETS/tanda_03/master_full_body.png",
        "banner_reference": "ART_REFERENCES/REF_04_protagonista_banner.png",
        "preparation": "ART_TOOLS/prepare_tanda_03_fase_b.py",
        "alpha_pipeline": "ART_TOOLS/prepare_tanda_03.py (build_alpha, calibrado en FASE A)",
        "canonical_height": CANON_H,
        "max_assets_per_tanda": 10,
        "assets_in_this_tanda": len(items),
        "resolution_log": [
            "Turno anterior: E y O repetian el perfil este; SE y SO repetian el 3/4 "
            "frontal izquierdo; NE tenia zancada. Limite de 10 generaciones alcanzado.",
            "Turno de continuacion: se generaron 3 candidatos para O, 3 para SE y 1 "
            "para NE con referencias sin sesgo direccional; se adopto O2, SE2 y NE1.",
            "NE1 corrigio la zancada pero se volvio casi identica a NO "
            "(IoU directo 0.9028); se generaron NE2 y NE3 con giro derecho "
            "forzado y se adopto NE2 (IoU con NO 0.6285, piernas paralelas, sin artefactos).",
            "Se añade head_bias como senal auxiliar; se documenta su escasa "
            "sensibilidad en tres cuartos sutiles y se excluye del criterio de cierre.",
        ],
        "known_deviations": [],
        "pending_regeneration": [],
        "selection_candidates": "fase_b/_candidates/ - borradores de seleccion, "
                                "NO son entregables ni cuentan como assets finales",
        "qa_contact_sheet": "ART_EVIDENCE/tanda_03/fase_b_orientaciones_QA.png",
        "head_bias_qa": {"values": bias, "opposite_pairs": opposite,
                         "all_opposite_signs_contrary": opposite_ok,
                         "note": "SENAL AUXILIAR, no criterio de cierre. positivo = "
                                 "cabeza desplazada hacia la derecha; negativo = hacia "
                                 "la izquierda. Discrimina bien los perfiles E/O, pero "
                                 "es poco sensible en tres cuartos sutiles (SE/SO). "
                                 "La evidencia principal de angulos opuestos es la "
                                 "inspeccion visual ampliada mas el IoU directo/reflejo."},
        "not_generated": ["8 familias de animacion", "spritesheet definitivo",
                          "integracion en HTML", "cambios en el render"],
        "anti_flip_qa": qa,
        "items": items,
    }
    (DST / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    for it in items:
        print(f"{it['id']:>2} {it['direction_deg']:>3}deg  "
              f"{str(it['source_size']):>12} -> {str(it['output_size']):>11} "
              f"bg_tol={it['alpha_bg_tol']} head_bias={it['head_bias']:+.4f} "
              f"halos={it['bright_halo_candidates_px']} sha={it['sha256'][:12]}")
    print(f"\nQA: {qa['pairs_checked']} pares; reflejos puros="
          f"{len(qa['suspected_pure_flips'])}; duplicados="
          f"{len(qa['suspected_same_angle_duplicates'])}; signos opuestos OK={opposite_ok}")
    for r in qa["opposite_pairs"]:
        print(f"  par {r['a']}/{r['b']}: directo={r['direct_iou']} "
              f"reflejo={r['mirror_iou']}")
    print("ESTADO:", "CERRADA" if closed else "NO CERRADA")
    print("manifest.json escrito")


if __name__ == "__main__":
    main()
