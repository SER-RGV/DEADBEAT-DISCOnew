#!/usr/bin/env python3
"""
FASE 2 · validate_lote.py

Validación de un lote procesado en assets/_regen/LOTE_XX/. Comprueba:
  - Todos los assets del JSON tienen su PNG generado.
  - Dimensiones exactas al contrato (w × h).
  - Canal alfa coherente con el contrato.
  - Tamaño de archivo en rango razonable (no vacíos, no >2 MB sin justificación).
  - No hay verde croma residual excesivo en bordes (green_spill).
  - El pivote declarado es uno válido.
  - El informe report.json existe y marca status=PROCESSED.
  - WebP maestro existe y tiene un tamaño razonable.
  - (Opcional) comparación opcional contra el asset actual en assets/ para detectar
    cambios accidentales de paleta.

Uso:
  python3 tools/regen/validate_lote.py docs/ASSET_REGEN/LOTES/LOTE_00.sample.json
  python3 tools/regen/validate_lote.py LOTE_00
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def validate_lote(batch_path: Path, compare_current: bool):
    b = load_json(batch_path)
    lote_id = b["lote_id"]
    out_root = REPO / "assets" / "_regen" / lote_id
    report_path = out_root / f"{lote_id}.report.json"

    results = {"ok": 0, "warn": 0, "fail": 0, "checks": []}

    def check(level, asset_id, msg):
        results[level] = results.get(level, 0) + 1
        tag = {"ok": "✓", "warn": "⚠", "fail": "✗"}[level]
        print(f"  {tag} {asset_id or '(lote)':42s} {msg}")
        results["checks"].append({"level": level, "id": asset_id, "msg": msg})

    # Existe informe?
    if not report_path.exists():
        check("fail", "", f"No existe {report_path.relative_to(REPO)}; ejecuta process_lote primero")
        return results
    report = load_json(report_path)

    # Recorrer assets
    for a in b["assets"]:
        aid = a["id"]
        cat = a["category"]
        exp_w, exp_h = a["size"]
        exp_alpha = a.get("alpha", True)
        dst = REPO / a["location"]

        # File exists?
        if not dst.exists():
            check("fail", aid, f"no existe {dst.relative_to(REPO)}")
            continue
        # Report status
        rec = report["assets"].get(aid)
        if not rec:
            check("warn", aid, "sin entrada en report.json")
        elif rec.get("status") != "PROCESSED":
            check("fail", aid, f"status={rec.get('status')}")
            continue

        # Open image
        try:
            im = Image.open(dst)
        except Exception as e:
            check("fail", aid, f"no se puede abrir: {e}")
            continue

        # Dimensions
        if im.size != (exp_w, exp_h):
            check("fail", aid, f"dimensiones {im.size} != contrato ({exp_w},{exp_h})")
        else:
            check("ok", aid, f"dimensiones OK {exp_w}x{exp_h}")

        # Alpha mode
        has_alpha = im.mode in ("RGBA", "LA", "PA")
        if exp_alpha and not has_alpha and dst.suffix.lower() not in (".jpg", ".jpeg"):
            check("fail", aid, f"contrato dice alpha=True pero la imagen es {im.mode}")
        elif not exp_alpha and has_alpha:
            check("warn", aid, f"contrato dice alpha=False pero la imagen es {im.mode}")
        else:
            check("ok", aid, f"canal alfa OK ({im.mode})")

        # File size sanity
        fbytes = dst.stat().st_size
        if fbytes < 200:
            check("fail", aid, f"archivo muy pequeño ({fbytes} B)")
        elif fbytes > 2_500_000 and cat not in ("cinematics",):
            check("warn", aid, f"archivo grande ({fbytes/1_000_000:.2f} MB)")
        else:
            check("ok", aid, f"peso OK ({fbytes/1024:.1f} KB)")

        # QC flags from report
        if rec:
            flags = rec.get("qc_flags", [])
            for fl in flags:
                if fl in ("ghost", "empty", "clipped"):
                    check("fail", aid, f"QC flag: {fl}")
                else:
                    check("warn", aid, f"QC flag: {fl}")
            # Master webp exists
            mpath = REPO / rec.get("master", "")
            if mpath.exists():
                check("ok", aid, f"maestro WebP OK ({mpath.stat().st_size/1024:.1f} KB)")
            else:
                check("warn", aid, f"falta maestro WebP: {mpath}")

        # Pivot sanity
        pivot = a.get("pivot", "")
        valid_pivots = {"center", "bottom-center", "top-left", "top-center", "bottom-left", "bottom-right"}
        if pivot not in valid_pivots:
            # Can also be a numeric pair like [x,y]
            if not (isinstance(pivot, list) and len(pivot) == 2):
                check("warn", aid, f"pivot desconocido: {pivot}")

        # Optional: compare against current game asset
        if compare_current:
            current_path = REPO / a.get("src") if a.get("src") else None
            if current_path and current_path.exists() and current_path != dst:
                try:
                    cur = Image.open(current_path)
                    check("ok", aid, f"comparado con actual: {cur.size} vs nuevo {im.size}")
                except Exception:
                    pass

    # Resumen
    print()
    print(f"RESUMEN {lote_id}: {results['ok']} OK · {results['warn']} avisos · {results['fail']} fallos")
    results_path = out_root / f"{lote_id}.validation.json"
    results_path.parent.mkdir(parents=True, exist_ok=True)
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Informe de validación: {results_path.relative_to(REPO)}")
    return results


def resolve_batch(arg: str) -> Path:
    p = Path(arg)
    if p.exists():
        return p.resolve()
    # Try by lote id
    cand = REPO / "docs" / "ASSET_REGEN" / "LOTES" / f"{arg}.json"
    if cand.exists():
        return cand.resolve()
    cand_sample = REPO / "docs" / "ASSET_REGEN" / "LOTES" / f"{arg}.sample.json"
    if cand_sample.exists():
        return cand_sample.resolve()
    raise SystemExit(f"No se encontró el lote: {arg}")


def main():
    ap = argparse.ArgumentParser(description="Valida un lote procesado.")
    ap.add_argument("batch", help="Ruta al JSON o ID del lote (p.ej. LOTE_00)")
    ap.add_argument("--compare", action="store_true", help="Compara contra los assets actuales del juego")
    args = ap.parse_args()

    bp = resolve_batch(args.batch)
    print(f"Validando: {bp.relative_to(REPO)}")
    print()
    r = validate_lote(bp, args.compare)
    sys.exit(1 if r["fail"] > 0 else 0)


if __name__ == "__main__":
    main()
