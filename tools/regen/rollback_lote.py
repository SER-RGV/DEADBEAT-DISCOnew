#!/usr/bin/env python3
"""
FASE 2 · rollback_lote.py

Revierte un lote aplicado:
  1. Lee el archivo .applied.json guardado por apply_lote.
  2. Restaura los backups (de backups/regen/LOTE_XX_pre_*/...) a su ubicación original.
  3. Si un asset no tenía backup (era nuevo), borra la copia nueva.
  4. Reconstruye manifest.json y dd_asset_registry.js con los hashes antiguos.
  5. Regenera el HTML.

Uso:
  python3 tools/regen/rollback_lote.py LOTE_00
  python3 tools/regen/rollback_lote.py LOTE_00 --batch LOTE_00.sample
  python3 tools/regen/rollback_lote.py LOTE_00 --dry-run
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

from PIL import Image

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
REGISTRY_JS = REPO / "src" / "dd_asset_registry.js"
MANIFEST_JSON = REPO / "assets" / "manifest.json"
MANIFEST_RE = re.compile(r'^(\s*const MANIFEST = )(\{.*\})(;\s*)$')
VERSION_RE = re.compile(r'(const ASSET_CACHE_VERSION = \(window\.__DD_ASSET_VERSION \|\| ")([^"]+)("\);)')


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def dump_json(p, obj):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def sha256_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def file_facts(p):
    data = p.read_bytes()
    im = Image.open(p)
    return {"w": im.width, "h": im.height, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def find_applied_log(lote_id: str, batch_name: str | None) -> Path:
    out_root = REPO / "assets" / "_regen" / lote_id
    if batch_name:
        cand = out_root / f"{batch_name}.applied.json"
        if cand.exists():
            return cand
        raise SystemExit(f"No existe {cand}")
    # Buscar el más reciente
    logs = sorted(out_root.glob("*.applied.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not logs:
        raise SystemExit(f"No hay .applied.json en {out_root}; el lote no se ha aplicado")
    return logs[0]


def rollback(lote_id: str, batch_name: str | None, dry_run: bool):
    log_path = find_applied_log(lote_id, batch_name)
    log = load_json(log_path)
    batch_id = log["batch"]
    backup_root = REPO / log["backup_dir"]
    print(f"Revirtiendo {batch_id}")
    print(f"  Log: {log_path.relative_to(REPO)}")
    print(f"  Backup: {backup_root.relative_to(REPO)}")
    if dry_run:
        print("  *** MODO DRY-RUN ***")
    print()

    restored = removed = skipped = failed = 0
    # Phase 1: restore from backup / remove new files
    for aid, info in log["assets"].items():
        final_rel = info.get("final")
        if not final_rel:
            # May be from an earlier run without "final" field; look up in manifest
            manifest = load_json(MANIFEST_JSON)
            if aid in manifest["entries"]:
                final_rel = manifest["entries"][aid]["src"]
        if not final_rel:
            print(f"  [SALTA] {aid}: sin ruta final conocida")
            skipped += 1
            continue
        final_path = REPO / final_rel
        if info.get("replaced") and info.get("backup"):
            backup_path = REPO / info["backup"]
            if not backup_path.exists():
                print(f"  [ERROR] {aid}: no existe backup {info['backup']}")
                failed += 1
                continue
            if dry_run:
                print(f"  [DRY] restaura {final_rel} desde backup")
            else:
                final_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(backup_path, final_path)
                print(f"  [RESTAURADO] {aid} ← {info['backup']}")
            restored += 1
        else:
            # Asset was new (no previous file); remove it
            if final_path.exists():
                if dry_run:
                    print(f"  [DRY] elimina {final_rel} (era nuevo)")
                else:
                    final_path.unlink()
                    print(f"  [ELIMINADO] {final_rel}")
                removed += 1
            else:
                skipped += 1

    if dry_run:
        print("\nDry run terminado. Sin cambios.")
        return

    # Phase 2: rebuild manifest from disk (restore sha16/rev for restored files)
    manifest = load_json(MANIFEST_JSON)
    n_restored_entries = 0
    n_removed_entries = 0
    for aid, info in log["assets"].items():
        final_rel = info.get("final")
        if not final_rel:
            continue
        final_path = REPO / final_rel
        if final_path.exists():
            f = file_facts(final_path)
            entry = manifest["entries"].get(aid)
            if entry:
                entry["w"] = f["w"]
                entry["h"] = f["h"]
                entry["sha16"] = f["sha256"][:16]
                # Restore previous rev if we know it
                entry["rev"] = "rollback"
                n_restored_entries += 1
        else:
            # If the asset was new and now removed, remove from manifest? Only if rev matches our batch
            entry = manifest["entries"].get(aid)
            if entry and entry.get("rev") == batch_id:
                del manifest["entries"][aid]
                n_removed_entries += 1

    manifest["totalRegistered"] = len(manifest["entries"])
    dump_json(MANIFEST_JSON, manifest)

    # Phase 3: update JS registry
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

    print(f"\n  Manifest: {n_restored_entries} entradas restauradas, {n_removed_entries} eliminadas")

    # Phase 4: rebuild HTML
    build_script = REPO / "tools" / "build_active_html.py"
    if build_script.exists():
        print(f"  Regenerando HTML...")
        r = subprocess.run([sys.executable, str(build_script)], cwd=str(REPO),
                           capture_output=True, text=True)
        if r.returncode == 0:
            print(f"  ✓ Build OK")
        else:
            print(f"  ✗ Build falló: {r.stderr[-500:]}")

    # Mark log as rolled back
    log["rolled_back_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    log_path.write_text(json.dumps(log, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"\nRollback completado: {restored} restaurados, {removed} eliminados, {skipped} skip, {failed} errores")


def main():
    ap = argparse.ArgumentParser(description="Revierte un lote aplicado.")
    ap.add_argument("lote", help="ID del lote (p.ej. LOTE_00)")
    ap.add_argument("--batch", help="Nombre de batch específico (por defecto el más reciente)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    rollback(args.lote, args.batch, args.dry_run)


if __name__ == "__main__":
    main()
