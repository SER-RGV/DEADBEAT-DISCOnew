#!/usr/bin/env python3
"""
FASE 2 · process_lote.py

Postprocesa los PNG crudos (generados sobre verde croma #00ff00) de un lote y
produce PNG finales (o JPG) en assets/_regen/LOTE_XX/<category>/<id>.png,
más WebP maestros en assets/_regen/LOTE_XX/_masters/, más un informe JSON.

No sobrescribe NADA fuera de assets/_regen/. La aplicación al juego se hace
con apply_lote.py (que sí hace backup previo).

Uso:
  python3 tools/regen/process_lote.py docs/ASSET_REGEN/LOTES/LOTE_00.sample.json \
      --raw /ruta/a/los/png_raw/

  --raw       directorio con PNG crudos (<id>.png tal como salen del generador).
              Por defecto busca en assets/_regen/<lote_id>/_raw/.
  --only      lista separada por comas de IDs a procesar (por defecto todos).
  --no-sheet  no genera hoja de contacto.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
ART_MASTER = REPO / "tools" / "art_master"
sys.path.insert(0, str(ART_MASTER))

import artlib  # type: ignore
from PIL import Image, ImageDraw


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def dump_json(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def process_lote(batch_path: Path, raw_dir: Path, only: str | None, no_sheet: bool):
    b = load_json(batch_path)
    lote_id = b["lote_id"]
    lote_num = lote_id.split("_")[1]

    # Output dirs (all under _regen, never overwriting game assets)
    out_root = REPO / "assets" / "_regen" / lote_id
    masters_dir = out_root / "_masters"
    report_path = out_root / f"{lote_id}.report.json"
    out_root.mkdir(parents=True, exist_ok=True)
    masters_dir.mkdir(parents=True, exist_ok=True)

    report = load_json(report_path) if report_path.exists() else {"batch": b["batch"], "lote_id": lote_id, "assets": {}}
    report["processed_at"] = now_iso()
    report["raw_dir"] = str(raw_dir.relative_to(REPO)) if raw_dir.is_relative_to(REPO) else str(raw_dir)
    report["output_root"] = str(out_root.relative_to(REPO))
    report["masters_dir"] = str(masters_dir.relative_to(REPO))

    # Filter assets
    assets = b["assets"]
    if only:
        want = set(only.split(","))
        assets = [a for a in assets if a["id"] in want]

    ok = 0
    finals = []
    for a in assets:
        aid = a["id"]
        raw_name = a.get("raw", aid + ".png")
        raw_path = raw_dir / raw_name
        matte = a.get("matte", "hard")
        mpath = masters_dir / (Path(raw_name).stem + ".webp")

        prev_rec = report["assets"].get(aid) or {}

        if raw_path.exists():
            src = Image.open(raw_path)
            rec = {"raw": raw_name, "raw_size": list(src.size), "source": "croma"}
            if matte == "none":
                keyed = src.convert("RGBA" if a.get("alpha", True) else "RGB")
            else:
                keyed, minfo = artlib.chroma_matte(
                    src,
                    key=a.get("key", "green"),
                    mode=matte,
                    band=int(a.get("band", 3)),
                    despill_all=bool(a.get("despill_all", False)),
                )
                rec["matte"] = minfo
            mbytes = artlib.save_master_webp(keyed, str(mpath))
        elif mpath.exists():
            keyed = Image.open(mpath).convert("RGBA" if a.get("alpha", True) else "RGB")
            rec = {"raw": raw_name, "raw_size": list(keyed.size), "source": "maestro_archivado"}
            if prev_rec.get("matte"):
                rec["matte"] = prev_rec["matte"]
            mbytes = mpath.stat().st_size
        else:
            print(f"  [FALTA RAW] {aid}: no está ni en {raw_path} ni en {mpath}")
            report["assets"][aid] = {"status": "MISSING_RAW", "raw": str(raw_path)}
            continue

        keyed, cleaned = artlib.apply_cleanup(keyed, a)
        rec.update(cleaned)

        if a.get("flip_x"):
            keyed = keyed.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

        fit = dict(a.get("fit", {}))
        if matte == "none" and "mode" not in fit:
            fit["mode"] = "cover"

        target_size = tuple(a["size"])
        final, finfo = artlib.fit_canvas(keyed.convert("RGBA"), target_size, fit)

        anchors = artlib.canvas_anchors(fit, target_size, a.get("anchors_raw"))
        if anchors:
            rec["anchors"] = anchors

        if not a.get("alpha", True):
            bg = Image.new("RGB", final.size, (0, 0, 0))
            bg.paste(final.convert("RGB"))
            final = bg

        dst = REPO / a["location"]
        dst.parent.mkdir(parents=True, exist_ok=True)

        if dst.suffix.lower() in (".jpg", ".jpeg"):
            final.convert("RGB").save(dst, "JPEG", quality=int(a.get("jpeg_quality", 90)),
                                      optimize=True, progressive=True)
            data = dst.read_bytes()
            saved = {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
        else:
            saved = artlib.save_png(final, str(dst))

        qc = artlib.qc_metrics(final.convert("RGBA"))
        rec.update({
            "fit": finfo,
            "final": a["location"],
            "bytes": saved["bytes"],
            "sha256": saved["sha256"],
            "master": str(mpath.relative_to(REPO)),
            "master_bytes": mbytes,
            "qc": qc,
            "status": "PROCESSED",
        })

        flags = [k for k in ("ghost", "touches_edge", "baked_checker_suspect", "empty") if qc.get(k)]
        if qc.get("green_spill_pct", 0) > 1.5 and a.get("key", "green") == "green" and not a.get("allow_green"):
            flags.append("green_spill")
        if finfo.get("clipped"):
            flags.append("clipped")
        rec["qc_flags"] = flags

        report["assets"][aid] = rec
        finals.append((aid, str(dst)))
        ok += 1
        flagstr = ("AVISOS: " + ",".join(flags)) if flags else ""
        print(f"  [OK] {aid:42s} {final.size[0]:4d}x{final.size[1]:<4d} {saved['bytes']:>8d} B  {flagstr}")

    dump_json(report_path, report)

    # Hoja de contacto
    if finals and not no_sheet:
        cell = 256
        cols = min(len(finals), 5)
        rows = math.ceil(len(finals) / cols)
        sheet = Image.new("RGB", (cols * cell * 2, rows * (cell + 20)), (18, 14, 26))
        d = ImageDraw.Draw(sheet)
        for i, (aid, p) in enumerate(finals):
            im = Image.open(p).convert("RGBA")
            t = im.copy()
            t.thumbnail((cell - 12, cell - 12), Image.Resampling.LANCZOS)
            cx = (i % cols) * cell * 2
            cy = (i // cols) * (cell + 20)
            for k, bgc in enumerate([(26, 18, 40, 255), (196, 188, 204, 255)]):
                tile = Image.new("RGBA", (cell, cell), bgc)
                tile.alpha_composite(t, ((cell - t.width) // 2, (cell - t.height) // 2))
                sheet.paste(tile.convert("RGB"), (cx + k * cell, cy))
            d.text((cx + 4, cy + cell + 2), f"{aid} {im.width}x{im.height}", fill=(235, 235, 240))
        sheet_dir = out_root / "_qc"
        sheet_dir.mkdir(exist_ok=True)
        sheet_path = sheet_dir / "contact_sheet.jpg"
        sheet.save(sheet_path, quality=90)
        print(f"\nHoja de contacto: {sheet_path.relative_to(REPO)} ({sheet.size})")

    print(f"\nProcesados {ok} / {len(assets)}")
    print(f"Informe: {report_path.relative_to(REPO)}")
    return ok


def main():
    ap = argparse.ArgumentParser(description="Postprocesa un lote de raw → PNG finales en _regen.")
    ap.add_argument("batch", help="Ruta al JSON del lote (p.ej. docs/ASSET_REGEN/LOTES/LOTE_00.sample.json)")
    ap.add_argument("--raw", help="Directorio con PNG crudos (<id>.png). Por defecto assets/_regen/<id>/_raw/")
    ap.add_argument("--only", help="IDs separados por comas (solo esos)")
    ap.add_argument("--no-sheet", action="store_true", help="No generar hoja de contacto")
    args = ap.parse_args()

    batch_path = Path(args.batch).resolve()
    if not batch_path.exists():
        raise SystemExit(f"No existe: {batch_path}")

    b = load_json(batch_path)
    lote_id = b["lote_id"]

    if args.raw:
        raw_dir = Path(args.raw).resolve()
    else:
        raw_dir = REPO / "assets" / "_regen" / lote_id / "_raw"

    if not raw_dir.exists():
        raise SystemExit(f"No existe el directorio raw: {raw_dir}\n"
                         f"Coloca los PNG generados sobre verde croma en {raw_dir}/<id>.png")

    process_lote(batch_path, raw_dir, args.only, args.no_sheet)


if __name__ == "__main__":
    main()
