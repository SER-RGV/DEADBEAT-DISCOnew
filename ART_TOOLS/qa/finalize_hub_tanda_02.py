#!/usr/bin/env python3
"""HUB · TANDA 02 — cierre de evidencias.

A partir de las capturas REALES guardadas por
`ART_TOOLS/qa/validate_hub_tanda_02.js` genera:
  * `ART_EVIDENCE/hub/tanda_02/visual_diff.json`        (A/B por zonas)
  * `ART_EVIDENCE/hub/tanda_02/comparativa_antes_despues.jpg` (hoja A/B)
  * `ART_EVIDENCE/hub/tanda_02/hashes.json`             (SHA-256 de la entrega)
y añade esas referencias a `report.json` SIN alterar el resultado de ninguna
de las 12 comprobaciones ya ejecutadas.

Uso:  PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/qa/finalize_hub_tanda_02.py
Requiere Pillow. No modifica el juego, los assets ni los estados de QA.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

from PIL import Image, ImageChops, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
EV = os.path.join(ROOT, "ART_EVIDENCE", "hub", "tanda_02")

PAIRS = [
    ("principal_antes_vs_despues", "antes_01_hub.png", "despues_01_hub.png", None),
    ("principal_control_vs_despues", "control_01_hub.png", "despues_01_hub.png", None),
    ("principal_antes_vs_control", "antes_01_hub.png", "control_01_hub.png", None),
    ("principal_zona_central", "antes_01_hub.png", "despues_01_hub.png", (320, 180, 960, 720)),
    ("hub_centro", "antes_hub_centro.png", "despues_hub_centro.png", None),
    ("arcade", "antes_detalle_arcade.png", "despues_detalle_arcade.png", None),
    ("arsenal", "antes_detalle_arsenal.png", "despues_detalle_arsenal.png", None),
    ("sellos", "antes_detalle_sellos.png", "despues_detalle_sellos.png", None),
    ("descenso", "antes_detalle_descenso.png", "despues_detalle_descenso.png", None),
    ("barra", "antes_detalle_bar.png", "despues_detalle_bar.png", None),
    ("dj", "antes_detalle_dj.png", "despues_detalle_dj.png", None),
    ("pared_este", "antes_detalle_pared_este.png", "despues_detalle_pared_este.png", None),
    ("vip_oeste", "antes_detalle_vip_oeste.png", "despues_detalle_vip_oeste.png", None),
    ("vip_este", "antes_detalle_vip_este.png", "despues_detalle_vip_este.png", None),
    ("puertas_cerradas_vs_abiertas", "doors_closed.png", "doors_open.png", None),
]

SHEET_PAIRS = [
    ("HUB CENTRO", "antes_hub_centro.png", "despues_hub_centro.png"),
    ("ARCADE F1", "antes_detalle_arcade.png", "despues_detalle_arcade.png"),
    ("SELLOS F2", "antes_detalle_sellos.png", "despues_detalle_sellos.png"),
    ("ARSENAL D", "antes_detalle_arsenal.png", "despues_detalle_arsenal.png"),
    ("DESCENSO", "antes_detalle_descenso.png", "despues_detalle_descenso.png"),
    ("PARED ESTE", "antes_detalle_pared_este.png", "despues_detalle_pared_este.png"),
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


def make_sheet() -> str:
    W, H, BAR = 640, 450, 30
    sheet = Image.new("RGB", (W * 2, (H + BAR) * len(SHEET_PAIRS)), (14, 12, 20))
    d = ImageDraw.Draw(sheet)
    for i, (label, a, b) in enumerate(SHEET_PAIRS):
        A = Image.open(os.path.join(EV, a)).convert("RGB").resize((W, H))
        B = Image.open(os.path.join(EV, b)).convert("RGB").resize((W, H))
        y = i * (H + BAR)
        sheet.paste(A, (0, y + BAR))
        sheet.paste(B, (W, y + BAR))
        d.text((8, y + 9), f"{label}  |  ANTES (T01 sin T02)", fill=(255, 214, 120))
        d.text((W + 8, y + 9), "DESPUES (T01 + T02)", fill=(120, 250, 220))
    out = os.path.join(EV, "comparativa_antes_despues.jpg")
    sheet.save(out, quality=86)
    return out


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
        if " -> " in rel:
            rel = rel.split(" -> ", 1)[1]
        if os.path.isfile(os.path.join(ROOT, rel)):
            files.append(rel)
    if not files:
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
    sheet = make_sheet()

    files = changed_files()
    hp = os.path.join(EV, "hashes.json")
    rp = os.path.join(EV, "report.json")
    report_rel = os.path.relpath(rp, ROOT)
    hashes_rel = os.path.relpath(hp, ROOT)
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
    report["visualDiff"] = {
        k: {"changedPct": v.get("changedPct"), "meanAbsDiff": v.get("meanAbsDiff"),
            "a": v.get("a"), "b": v.get("b"), "box": v.get("box")}
        for k, v in diffs.items()
    }
    report["visualDiffFile"] = "visual_diff.json"
    report["comparativaFile"] = os.path.basename(sheet)
    report["hashesFile"] = "hashes.json"
    report["hashesCount"] = len(hashes["files"]) + 1
    report["git"] = {
        "sessionBranch": git("branch", "--show-current"),
        "baseHeadAtClosure": git("rev-parse", "HEAD"),
        "main": git("rev-parse", "main"),
        "originMain": git("rev-parse", "origin/main"),
        "remoteArteYRecursos": git("ls-remote", "--heads", "origin", "arte-y-recursos"),
        "note": "Cierre ejecutado ANTES del commit de entrega: baseHeadAtClosure es el commit padre (Tanda 01). main y origin/main no se han tocado. El usuario autorizó commit/push en la rama de sesión y PR hacia arte-y-recursos SIN merge.",
    }
    report["reproduction"] = {
        "server": "python3 http.server en 0.0.0.0:8123 con / -> DEADBEAT_DISCO.ART.html",
        "qa": "QA_LIB=/tmp/qatools/node_modules/playwright-core CHROME_PATH=/tmp/chromium LD_LIB_PATH=/tmp/chromelibs/lib:/tmp node ART_TOOLS/qa/validate_hub_tanda_02.js",
        "canvasProbe": "node ART_TOOLS/qa/canvas_probe_hub_tanda_02.js",
        "closure": "PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/qa/finalize_hub_tanda_02.py",
        "camera": "Las capturas principales ANTES/CONTROL/DESPUES se toman en el mismo punto (teleport 1250,935) para que el diff de píxeles sea válido.",
    }
    for c in report["checks"]:
        if c["id"] in (4, 5, 7, 10):
            ev = list(c.get("evidence") or [])
            for extra in ("visual_diff.json", "comparativa_antes_despues.jpg", "hashes.json"):
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
        print("  %-34s %6s%% px cambiados" % (k, v.get("changedPct", "ERR")))
    print("comparativa      :", os.path.basename(sheet))
    print("hashes.json      :", hashes["fileCount"], "archivos")
    print("report.json      : actualizado (12 checks sin modificar)")
    bad = [c["id"] for c in report["checks"] if c["state"] != "APROBADO"]
    print("checks no aprobados:", bad or "ninguno")
    return 0


if __name__ == "__main__":
    sys.exit(main())
