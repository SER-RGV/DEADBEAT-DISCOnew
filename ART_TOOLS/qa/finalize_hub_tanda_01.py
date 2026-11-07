#!/usr/bin/env python3
"""HUB · TANDA 01 — cierre de evidencias.

Genera, a partir de las capturas REALES ya guardadas por
`ART_TOOLS/qa/validate_hub_tanda_01.js`:
  * `ART_EVIDENCE/hub/tanda_01/visual_diff.json`  (diferencias de píxel A/B)
  * `ART_EVIDENCE/hub/tanda_01/hashes.json`       (SHA-256 del cambio)
y añade ambas referencias a `report.json`, sin alterar el resultado de
ninguna de las 12 comprobaciones ya ejecutadas.

Uso:  PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/qa/finalize_hub_tanda_01.py
Requiere Pillow. No modifica el juego, los assets ni los estados de QA.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

from PIL import Image, ImageChops

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
EV = os.path.join(ROOT, "ART_EVIDENCE", "hub", "tanda_01")

PAIRS = [
    ("antes_vs_despues", "antes_01_hub.png", "despues_01_hub.png", None),
    ("control_vs_despues", "control_01_hub.png", "despues_01_hub.png", None),
    ("antes_vs_control", "antes_01_hub.png", "control_01_hub.png", None),
    ("puertas_cerradas_vs_abiertas", "doors_closed.png", "doors_open.png", None),
    ("puertas_zona_central", "doors_closed.png", "doors_open.png", (320, 180, 960, 720)),
]


def pixel_diff(a: str, b: str, box=None) -> dict:
    pa, pb = os.path.join(EV, a), os.path.join(EV, b)
    A = Image.open(pa).convert("RGB")
    B = Image.open(pb).convert("RGB")
    if A.size != B.size:
        return {"error": "tamaños distintos", "a": list(A.size), "b": list(B.size)}
    ca = A.crop(box) if box else A
    cb = B.crop(box) if box else B
    d = ImageChops.difference(ca, cb)
    data = list(d.get_flattened_data() if hasattr(d, "get_flattened_data")
                else d.getdata())
    changed = sum(1 for p in data if max(p) > 12)
    total = len(data)
    return {
        "a": a, "b": b, "size": list(A.size), "box": box,
        "thresholdPerChannel": 12,
        "changedPx": changed, "totalPx": total,
        "changedPct": round(100.0 * changed / total, 2),
        "meanAbsDiff": round(sum(sum(p) for p in data) / (3.0 * total), 2),
    }


def changed_files() -> list[str]:
    out = subprocess.run(
        ["git", "status", "--porcelain=v1", "-uall"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout.splitlines()
    files = []
    for line in out:
        if len(line) < 4:
            continue
        rel = line[3:].strip()
        if " -> " in rel:                       # renombrado
            rel = rel.split(" -> ", 1)[1]
        if os.path.isfile(os.path.join(ROOT, rel)):
            files.append(rel)
    if not files:
        # Tras el commit el worktree está limpio: se firma el mismo conjunto
        # a partir del último commit para que el cierre sea reproducible.
        out = subprocess.run(
            ["git", "show", "--pretty=format:", "--name-only", "HEAD"],
            cwd=ROOT, capture_output=True, text=True, check=True,
        ).stdout.splitlines()
        files = [l.strip() for l in out
                 if l.strip() and os.path.isfile(os.path.join(ROOT, l.strip()))]
    return sorted(files)


def sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def git(*args: str) -> str:
    try:
        return subprocess.run(
            ["git", *args], cwd=ROOT, capture_output=True, text=True, check=True
        ).stdout.strip()
    except Exception:
        return ""


def main() -> int:
    os.makedirs(EV, exist_ok=True)

    diffs = {name: pixel_diff(a, b, box) for name, a, b, box in PAIRS}
    with open(os.path.join(EV, "visual_diff.json"), "w", encoding="utf-8") as f:
        json.dump(diffs, f, indent=2, ensure_ascii=False)

    files = changed_files()
    hp = os.path.join(EV, "hashes.json")
    rp = os.path.join(EV, "report.json")
    report_rel = os.path.relpath(rp, ROOT)
    hashes_rel = os.path.relpath(hp, ROOT)
    # report.json se firma DESPUÉS de inyectarle las referencias, para que el
    # hash publicado corresponda exactamente al archivo entregado.
    hashes = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "algorithm": "sha256",
        "source": "git status --porcelain=v1 -uall",
        "selfExcluded": hashes_rel,
        "reportSignedLast": report_rel,
        "fileCount": len(files),
        "files": [],
    }
    for rel in files:
        if rel in (report_rel, hashes_rel):
            continue
        hashes["files"].append(
            {"path": rel, "bytes": os.path.getsize(os.path.join(ROOT, rel)),
             "sha256": sha256(os.path.join(ROOT, rel))}
        )

    def write_hashes() -> None:
        hashes["fileCount"] = len(hashes["files"])
        with open(hp, "w", encoding="utf-8") as f:
            json.dump(hashes, f, indent=2, ensure_ascii=False)

    write_hashes()

    with open(rp, encoding="utf-8") as f:
        report = json.load(f)
    report["visualDiff"] = diffs
    report["hashesFile"] = "hashes.json"
    report["hashesCount"] = len(hashes["files"]) + 1  # + el propio report.json
    report["git"] = {
        "sessionBranch": git("branch", "--show-current"),
        "head": git("rev-parse", "HEAD"),
        "main": git("rev-parse", "main"),
        "originMain": git("rev-parse", "origin/main"),
        "remoteArteYRecursos": git("ls-remote", "--heads", "origin", "arte-y-recursos"),
        "note": "main y origin/main no se han tocado; el usuario autorizó commit/push en la rama de sesión y PR hacia arte-y-recursos sin merge.",
    }
    for c in report["checks"]:
        if c["id"] in (4, 5, 7, 10):
            ev = list(c.get("evidence") or [])
            for extra in ("visual_diff.json", "hashes.json"):
                if extra not in ev:
                    ev.append(extra)
            c["evidence"] = ev
    with open(rp, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    hashes["files"].append(
        {"path": report_rel, "bytes": os.path.getsize(rp), "sha256": sha256(rp)}
    )
    hashes["files"].sort(key=lambda x: x["path"])
    write_hashes()

    print("visual_diff.json :", len(diffs), "comparativas")
    for k, v in diffs.items():
        print("  %-32s %6s%% px cambiados" % (k, v.get("changedPct", "ERR")))
    print("hashes.json      :", hashes["fileCount"], "archivos")
    print("report.json      : actualizado (12 checks sin modificar)")
    bad = [c["id"] for c in report["checks"] if c["state"] != "APROBADO"]
    print("checks no aprobados:", bad or "ninguno")
    return 0


if __name__ == "__main__":
    sys.exit(main())
