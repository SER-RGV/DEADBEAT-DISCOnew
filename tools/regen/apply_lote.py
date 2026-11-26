#!/usr/bin/env python3
"""
FASE 2 · apply_lote.py

Aplica un lote procesado (en assets/_regen/LOTE_XX/) al juego, es decir:
  1. Hace backup de los PNG/JPG actuales (si existen) a backups/regen/LOTE_XX_pre/.
  2. Copia los nuevos archivos de _regen/LOTE_XX/ a su ubicación final en assets/.
  3. Actualiza manifest.json y src/dd_asset_registry.js (sha16, rev, bytes).
  4. Regenera el build HTML con tools/build_active_html.py.
  5. Deja un registro de lo aplicado con rollback fácil.

Uso:
  python3 tools/regen/apply_lote.py LOTE_00.sample        (aplicar solo la muestra)
  python3 tools/regen/apply_lote.py LOTE_00               (aplicar el lote completo)
  python3 tools/regen/apply_lote.py LOTE_00 --dry-run     (simular sin copiar)

ROLLBACK: python3 tools/regen/rollback_lote.py LOTE_00
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent

REGISTRY_JS = REPO / "src" / "dd_asset_registry.js"
MANIFEST_JSON = REPO / "assets" / "manifest.json"

MANIFEST_RE = re.compile(r'^(\s*const MANIFEST = )(\{.*\})(;\s*)$')
VERSION_RE = re.compile(r'(const ASSET_CACHE_VERSION = \(window\.__DD_ASSET_VERSION \|\| ")([^"]+)("\);)')


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def dump_json(p, obj):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def file_facts(p: Path):
    data = p.read_bytes()
    from PIL import Image
    im = Image.open(p)
    return {"w": im.width, "h": im.height, "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
            "format": f"{im.format} {im.mode}"}


def apply_lote(batch_path: Path, dry_run: bool):
    b = load_json(batch_path)
    lote_id = b["lote_id"]
    batch_name = b["batch"]  # may end in .sample
    out_root = REPO / "assets" / "_regen" / lote_id
    report_path = out_root / f"{lote_id}.report.json"
    backup_root = REPO / "backups" / "regen" / f"{lote_id}_pre_{batch_name.replace('.','_')}"
    apply_log_path = out_root / f"{batch_name}.applied.json"

    if not report_path.exists():
        raise SystemExit(f"No existe {report_path}; ejecuta process_lote primero")
    report = load_json(report_path)

    applied = {"applied_at": now_iso(), "batch": batch_name, "lote_id": lote_id,
               "backup_dir": str(backup_root.relative_to(REPO)),
               "assets": {}}

    print(f"Aplicando {batch_name} ({len(b['assets'])} assets)")
    print(f"  Backup en: {backup_root.relative_to(REPO)}")
    if dry_run:
        print("  *** MODO DRY-RUN: no se copiará ni modificará nada ***")
    print()

    # Phase 1: backup
    for a in b["assets"]:
        aid = a["id"]
        # location = _regen/ path (source of new file); final_location = destination in assets/
        real_final = REPO / a.get("final_location", a.get("src", a["location"]))
        rel_final = str(real_final.relative_to(REPO))
        if real_final.exists() and not dry_run:
            backup_path = backup_root / rel_final
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(real_final, backup_path)
            applied["assets"][aid] = {"backup": str(backup_path.relative_to(REPO)),
                                      "replaced": True,
                                      "old_sha256": sha256_file(real_final)}
        elif real_final.exists() and dry_run:
            print(f"  [DRY] backup de {rel_final}")
            applied["assets"][aid] = {"backup": "(dry-run)", "replaced": True}
        else:
            applied["assets"][aid] = {"replaced": False}

    def _do_restore():
        """Rollback parcial si algo falla a mitad del apply."""
        print("\n  [ROLLBACK AUTOMÁTICO] restaurando desde backup...")
        for aid2, info2 in applied["assets"].items():
            if info2.get("replaced") and info2.get("backup"):
                bpath = REPO / info2["backup"]
                final_loc = info2.get("final") or a2_rel(aid2)
                fpath = REPO / final_loc if final_loc else None
                if fpath and bpath.exists():
                    fpath.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(bpath, fpath)
            elif not info2.get("replaced") and info2.get("status") == "APPLIED":
                final_loc = info2.get("final")
                if final_loc:
                    fpath = REPO / final_loc
                    if fpath.exists():
                        fpath.unlink()
        print("  [ROLLBACK AUTOMÁTICO] completado.")

    def a2_rel(aid2):
        for aa in b["assets"]:
            if aa["id"] == aid2:
                return str((REPO / aa.get("final_location", aa.get("src", aa["location"]))).relative_to(REPO))
        return None

    # Phase 2: copy new files to final location (with atomic rollback on failure)
    copied = []
    try:
        for a in b["assets"]:
            aid = a["id"]
            src_path = REPO / a["location"]
            final_path = REPO / a.get("final_location", a.get("src", a["location"]))
            rel_final = str(final_path.relative_to(REPO))
            if not src_path.exists():
                print(f"  [SALTA] {aid}: no existe {src_path.relative_to(REPO)}")
                applied["assets"][aid]["status"] = "MISSING_SOURCE"
                continue
            if dry_run:
                print(f"  [DRY] copia {src_path.relative_to(REPO)} → {rel_final}")
                applied["assets"][aid]["status"] = "WOULD_COPY"
                continue
            final_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src_path, final_path)
            copied.append(aid)
            f = file_facts(final_path)
            applied["assets"][aid].update({
                "status": "APPLIED",
                "final": rel_final,
                "w": f["w"], "h": f["h"], "bytes": f["bytes"], "sha256": f["sha256"],
            })
            print(f"  [OK] {aid:42s} → {rel_final} ({f['bytes']/1024:.1f} KB)")
    except Exception as e:
        print(f"\n  [ERROR] durante la copia: {e}")
        _do_restore()
        raise

    if dry_run:
        print("\nDry run terminado. Sin cambios.")
        return

    # Phase 3: update manifest + registry
    manifest = load_json(MANIFEST_JSON)
    n_added = n_updated = 0
    for a in b["assets"]:
        aid = a["id"]
        final_src = a.get("final_location", a.get("src", a["location"]))
        final_path = REPO / final_src
        if not final_path.exists():
            continue
        f = file_facts(final_path)
        prev = manifest["entries"].get(aid)
        entry = dict(prev or {})
        entry.update({
            "id": aid,
            "name": a["name"],
            "category": a["category"],
            "src": final_src,
            "w": f["w"], "h": f["h"],
            "alpha": bool(a.get("alpha", True)),
            "pivot": a.get("pivot", entry.get("pivot", "bottom-center")),
            "sha16": f["sha256"][:16],
            "rev": batch_name,
        })
        manifest["entries"][aid] = entry
        # originalId is the same as id for our rebuilds
        entry["originalId"] = entry.get("originalId", aid)
        manifest["byOriginalId"][entry["originalId"]] = aid
        n_updated += 1 if prev else 0
        n_added += 0 if prev else 1

    manifest["totalRegistered"] = len(manifest["entries"])
    dump_json(MANIFEST_JSON, manifest)

    # Update JS registry
    lines = REGISTRY_JS.read_text(encoding="utf-8").split("\n")
    idx = m = None
    for i, l in enumerate(lines):
        mm = MANIFEST_RE.match(l)
        if mm:
            idx, m = i, mm
            break
    if idx is None:
        raise SystemExit("No se encontró const MANIFEST en dd_asset_registry.js")
    lines[idx] = m.group(1) + json.dumps(manifest, ensure_ascii=False) + m.group(3)
    txt = "\n".join(lines)

    # Bump cache version
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    def bump(mm):
        cur = mm.group(2)
        day, _, n = cur.partition(".")
        n = int(n or 0) + 1 if day == today else 1
        return mm.group(1) + f"{today}.{n}" + mm.group(3)
    txt, nsub = VERSION_RE.subn(bump, txt, count=1)
    if nsub != 1:
        raise SystemExit("No se pudo actualizar ASSET_CACHE_VERSION")
    REGISTRY_JS.write_text(txt, encoding="utf-8")
    new_version = VERSION_RE.search(txt).group(2)

    print(f"\n  Manifest actualizado: {n_updated} actualizados, {n_added} añadidos")
    print(f"  ASSET_CACHE_VERSION → {new_version}")

    # Phase 4: rebuild HTML
    build_script = REPO / "tools" / "build_active_html.py"
    if build_script.exists():
        print(f"\n  Regenerando HTML de build...")
        r = subprocess.run([sys.executable, str(build_script)], cwd=str(REPO),
                           capture_output=True, text=True)
        if r.returncode == 0:
            print(f"  ✓ Build OK")
            applied["build_stdout"] = r.stdout[-1000:]
        else:
            print(f"  ✗ Build falló (rc={r.returncode})")
            print(f"  stderr: {r.stderr[-500:]}")
            applied["build_error"] = r.stderr[-1000:]
    else:
        print(f"  [AVISO] No existe {build_script}")

    dump_json(apply_log_path, applied)
    print(f"\nRegistro de aplicación: {apply_log_path.relative_to(REPO)}")
    print(f"ROLLBACK: python3 tools/regen/rollback_lote.py {lote_id} --batch {batch_name}")


def main():
    ap = argparse.ArgumentParser(description="Aplica un lote procesado al juego.")
    ap.add_argument("batch", help="ID del lote o ruta al JSON (p.ej. LOTE_00.sample)")
    ap.add_argument("--dry-run", action="store_true", help="Simular sin modificar archivos")
    args = ap.parse_args()

    # Resolver batch
    bp = Path(args.batch)
    if not bp.is_absolute():
        if bp.suffix == ".json" and bp.exists():
            bp = bp.resolve()
        else:
            cand = REPO / "docs" / "ASSET_REGEN" / "LOTES" / f"{args.batch}.json"
            cand_s = REPO / "docs" / "ASSET_REGEN" / "LOTES" / f"{args.batch}.sample.json"
            if cand.exists():
                bp = cand.resolve()
            elif cand_s.exists():
                bp = cand_s.resolve()
            else:
                raise SystemExit(f"No se encontró el lote: {args.batch}")

    apply_lote(bp, args.dry_run)


if __name__ == "__main__":
    main()
