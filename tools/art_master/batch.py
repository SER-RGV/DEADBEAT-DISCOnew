#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEADBEAT DISCO — ART PRODUCTION MASTER · tandas de producción (R01, R02, …)

Uso (siempre con /home/user/.venv/bin/python):

  batch.py process  docs/ART_REBUILD/batches/R01_PROTAGONISTA.json [--only id,id] [--raw DIR]
      maestro croma -> PNG final en assets/… + maestro WebP + métricas QC + hoja de contacto

  batch.py register docs/ART_REBUILD/batches/R01_PROTAGONISTA.json [--only id,id]
      alta/actualización ADITIVA en src/dd_asset_registry.js (MANIFEST), assets/manifest.json
      y docs/ART_REBUILD/MASTER_INVENTORY.json. Nunca borra entradas existentes.

  batch.py mark     docs/ART_REBUILD/batches/R01_PROTAGONISTA.json --evidence docs/ART_REBUILD/evidence/R01
      tras la validación EN EL JUEGO: integration_status=INTEGRATED, validation_status=VERIFIED

  batch.py audit [--fix]
      comprobación ESTÁTICA del registro contra los archivos (existe, tamaño natural ==
      w/h registrados, alfa declarado == transparencia real); con --fix corrige el dato
      registrado, nunca el PNG

Por qué no se usa tools/asset_pipeline.py::rebuild_registry(): reescribe el
registro completo a partir de MASTER_INVENTORY con una plantilla antigua y
perdería las 35 entradas añadidas después (capas de cinemática BG01–BG06,
menu_main_backdrop_a…) y el versionado de caché. Este registrador sólo
toca la línea `const MANIFEST = {...}` y la constante ASSET_CACHE_VERSION.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import math
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

REGISTRY_JS = os.path.join(ROOT, "src", "dd_asset_registry.js")
MANIFEST_JSON = os.path.join(ROOT, "assets", "manifest.json")
INVENTORY_JSON = os.path.join(ROOT, "docs", "ART_REBUILD", "MASTER_INVENTORY.json")
MASTERS_DIR = os.path.join(ROOT, "ART_ASSETS", "rebuild_masters")
DEFAULT_RAW_ROOT = os.environ.get("DD_RAW_ROOT", "/home/user/dd_work/raw")


def now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(p):
    with open(p, encoding="utf-8") as fh:
        return json.load(fh)


def dump_json(p, obj):
    with open(p, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=2)
        fh.write("\n")


def load_batch(path):
    b = load_json(path)
    inv = load_json(INVENTORY_JSON)
    by_id = {a["id"]: a for a in inv["assets"]}
    defaults = b.get("defaults", {})
    out = []
    for raw in b["assets"]:
        a = dict(defaults)
        a.update(raw)
        base = by_id.get(a["id"])
        if base:
            a.setdefault("name", base["name"])
            a.setdefault("category", base["category"])
            a.setdefault("location", base["location"])
            a.setdefault("size", base["dimensions"])
            a.setdefault("original_id", base["original_id"])
            a.setdefault("pivot", base["pivot"])
            a.setdefault("alpha", base.get("alpha", True))
            a.setdefault("code_references", base.get("code_references", []))
            a["_exists_in_inventory"] = True
            a["_tanda"] = base["tanda"]
        else:
            for req in ("name", "category", "location", "size", "original_id", "pivot"):
                if req not in a:
                    raise SystemExit("asset nuevo '%s' sin campo obligatorio '%s'" % (a["id"], req))
            a.setdefault("alpha", True)
            a["_exists_in_inventory"] = False
            a["_tanda"] = b["batch"]
        out.append(a)
    return b, out


def select(assets, only):
    if not only:
        return assets
    want = set(only.split(","))
    return [a for a in assets if a["id"] in want]


# --------------------------------------------------------------------------- #
def cmd_process(args):
    from PIL import Image, ImageDraw
    import artlib

    b, assets = load_batch(args.batch)
    assets = select(assets, args.only)
    raw_dir = args.raw or os.path.join(DEFAULT_RAW_ROOT, b["batch"])
    report_path = os.path.splitext(args.batch)[0] + ".report.json"
    report = load_json(report_path) if os.path.exists(report_path) else {"batch": b["batch"], "assets": {}}
    report["processed_at"] = now_iso()
    ok = 0
    finals = []
    for a in assets:
        raw_name = a.get("raw", a["id"] + ".png")
        raw = os.path.join(raw_dir, raw_name)
        matte = a.get("matte", "hard")
        # Maestro archivado en el repo: cuadro completo ya recortado del croma, uno por
        # ilustración (varios assets pueden salir del mismo maestro).
        mpath = os.path.join(MASTERS_DIR, b["batch"], os.path.splitext(raw_name)[0] + ".webp")
        prev_rec = report["assets"].get(a["id"]) or {}
        if os.path.exists(raw):
            src = Image.open(raw)
            rec = {"raw": os.path.basename(raw), "raw_size": list(src.size), "source": "croma"}
            if matte == "none":
                keyed = src.convert("RGBA" if a.get("alpha", True) else "RGB")
            else:
                keyed, minfo = artlib.chroma_matte(src, key=a.get("key", "green"), mode=matte,
                                                   band=int(a.get("band", 3)), despill_all=bool(a.get("despill_all", False)))
                rec["matte"] = minfo
            mbytes = artlib.save_master_webp(keyed, mpath)
        elif os.path.exists(mpath):
            # Sin el PNG croma original (p. ej. clon limpio del repo): se parte del maestro archivado.
            keyed = Image.open(mpath).convert("RGBA" if a.get("alpha", True) else "RGB")
            rec = {"raw": os.path.basename(raw), "raw_size": list(keyed.size), "source": "maestro_archivado"}
            if prev_rec.get("matte"):
                rec["matte"] = prev_rec["matte"]
            mbytes = os.path.getsize(mpath)
        else:
            print("  [FALTA MAESTRO] %s -> %s (ni croma ni %s)" % (a["id"], raw, os.path.relpath(mpath, ROOT)))
            report["assets"][a["id"]] = {"status": "MISSING_RAW"}
            continue
        keyed, cleaned = artlib.apply_cleanup(keyed, a)   # erase, keep, ground_line, fade
        rec.update(cleaned)
        if a.get("flip_x"):
            keyed = keyed.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        fit = dict(a.get("fit", {}))
        if matte == "none" and "mode" not in fit:
            fit["mode"] = "cover"
        final, finfo = artlib.fit_canvas(keyed.convert("RGBA"), a["size"], fit)
        anchors = artlib.canvas_anchors(fit, a["size"], a.get("anchors_raw"))
        if anchors:
            rec["anchors"] = anchors
        if not a.get("alpha", True):
            bg = Image.new("RGB", final.size, (0, 0, 0))
            bg.paste(final.convert("RGB"))
            final = bg
        dst = os.path.join(ROOT, a["location"])
        if dst.lower().endswith((".jpg", ".jpeg")):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            final.convert("RGB").save(dst, "JPEG", quality=int(a.get("jpeg_quality", 90)), optimize=True, progressive=True)
            data = open(dst, "rb").read()
            saved = {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
        else:
            saved = artlib.save_png(final, dst)
        qc = artlib.qc_metrics(final.convert("RGBA"))
        rec.update({"fit": finfo, "final": a["location"], "bytes": saved["bytes"], "sha256": saved["sha256"],
                    "master": os.path.relpath(mpath, ROOT), "master_bytes": mbytes, "qc": qc, "status": "PROCESSED"})
        flags = [k for k in ("ghost", "touches_edge", "baked_checker_suspect", "empty") if qc.get(k)]
        if qc.get("green_spill_pct", 0) > 1.5 and a.get("key", "green") == "green" and not a.get("allow_green"):
            flags.append("green_spill")
        if finfo.get("clipped"):
            flags.append("clipped")
        rec["qc_flags"] = flags
        report["assets"][a["id"]] = rec
        finals.append((a["id"], dst))
        ok += 1
        print("  [OK] %-34s %4dx%-4d %6d B  %s" % (a["id"], final.size[0], final.size[1], saved["bytes"], ("AVISOS: " + ",".join(flags)) if flags else ""))
    dump_json(report_path, report)

    # Hoja de contacto de control de calidad (fondo oscuro + fondo claro)
    if finals and not args.no_sheet:
        cell = int(args.cell)
        cols = min(len(finals), int(args.cols))
        rows = math.ceil(len(finals) / cols)
        sheet = Image.new("RGB", (cols * cell * 2, rows * (cell + 16)), (18, 14, 26))
        d = ImageDraw.Draw(sheet)
        for i, (aid, p) in enumerate(finals):
            im = Image.open(p).convert("RGBA")
            t = im.copy()
            t.thumbnail((cell - 8, cell - 8), Image.Resampling.LANCZOS)
            cx = (i % cols) * cell * 2
            cy = (i // cols) * (cell + 16)
            for k, bgc in enumerate([(26, 18, 40, 255), (196, 188, 204, 255)]):
                tile = Image.new("RGBA", (cell, cell), bgc)
                tile.alpha_composite(t, ((cell - t.width) // 2, (cell - t.height) // 2))
                sheet.paste(tile.convert("RGB"), (cx + k * cell, cy))
            d.text((cx + 4, cy + cell + 2), "%s %dx%d" % (aid, im.width, im.height), fill=(235, 235, 240))
        out = args.sheet or os.path.join("/tmp/ddqa/sheets", b["batch"] + ("_" + args.tag if args.tag else "") + ".jpg")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        sheet.save(out, quality=90)
        print("hoja de contacto:", out, sheet.size)
    print("procesados %d / %d" % (ok, len(assets)))


# --------------------------------------------------------------------------- #
MANIFEST_RE = re.compile(r"^(\s*const MANIFEST = )(\{.*\})(;\s*)$")
VERSION_RE = re.compile(r'(const ASSET_CACHE_VERSION = \(window\.__DD_ASSET_VERSION \|\| ")([^"]+)("\);)')


def read_registry():
    lines = open(REGISTRY_JS, encoding="utf-8").read().split("\n")
    for i, l in enumerate(lines):
        m = MANIFEST_RE.match(l)
        if m:
            return lines, i, m, json.loads(m.group(2))
    raise SystemExit("No se encontró `const MANIFEST = {...};` en " + REGISTRY_JS)


def write_registry(lines, idx, m, manifest):
    manifest["totalRegistered"] = len(manifest["entries"])
    lines[idx] = m.group(1) + json.dumps(manifest, ensure_ascii=False) + m.group(3)
    txt = "\n".join(lines)
    today = _dt.datetime.now(_dt.timezone.utc).strftime("%Y%m%d")

    def bump(mm):
        cur = mm.group(2)
        day, _, n = cur.partition(".")
        n = int(n or 0) + 1 if day == today else 1
        return mm.group(1) + "%s.%d" % (today, n) + mm.group(3)

    txt, nsub = VERSION_RE.subn(bump, txt, count=1)
    if nsub != 1:
        raise SystemExit("No se pudo actualizar ASSET_CACHE_VERSION")
    with open(REGISTRY_JS, "w", encoding="utf-8") as fh:
        fh.write(txt)
    dump_json(MANIFEST_JSON, manifest)
    return VERSION_RE.search(txt).group(2)


def file_facts(path):
    from PIL import Image
    data = open(path, "rb").read()
    im = Image.open(path)
    return {"w": im.width, "h": im.height, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(),
            "format": "%s %s" % (im.format, im.mode)}


def cmd_register(args):
    b, assets = load_batch(args.batch)
    assets = select(assets, args.only)
    lines, idx, m, manifest = read_registry()
    inv = load_json(INVENTORY_JSON)
    by_id = {a["id"]: a for a in inv["assets"]}
    report_path = os.path.splitext(args.batch)[0] + ".report.json"
    report = load_json(report_path) if os.path.exists(report_path) else {}
    added = updated = 0
    for a in assets:
        dst = os.path.join(ROOT, a["location"])
        if not os.path.exists(dst):
            print("  [SIN ARCHIVO FINAL] %s — no se registra" % a["id"])
            continue
        f = file_facts(dst)
        if [f["w"], f["h"]] != list(a["size"]):
            raise SystemExit("%s: dimensiones %sx%s != contrato %s" % (a["id"], f["w"], f["h"], a["size"]))
        prev = manifest["entries"].get(a["id"])
        entry = dict(prev or {})
        entry.update({
            "id": a["id"], "originalId": a["original_id"], "name": a["name"], "category": a["category"],
            "src": a["location"], "w": f["w"], "h": f["h"], "alpha": bool(a.get("alpha", True)),
            "pivot": a["pivot"], "tanda": (prev or {}).get("tanda", a["_tanda"]),
            "sha16": f["sha256"][:16], "rev": b["batch"],
        })
        anchors = ((report.get("assets") or {}).get(a["id"]) or {}).get("anchors")
        if anchors:
            entry["anchors"] = anchors
        elif "anchors" in entry and a.get("anchors_raw") is None:
            entry.pop("anchors", None)
        if a.get("overlay_of"):
            entry["overlayOf"] = a["overlay_of"]
        manifest["entries"][a["id"]] = entry
        manifest["byOriginalId"][a["original_id"]] = a["id"]
        added += 0 if prev else 1
        updated += 1 if prev else 0

        rec = by_id.get(a["id"])
        if rec is None:
            rec = {
                "index": max(x["index"] for x in inv["assets"]) + 1, "tanda": b["batch"], "tanda_number": None,
                "original_id": a["original_id"], "id": a["id"], "name": a["name"], "category": a["category"],
                "location": a["location"], "dimensions": list(a["size"]), "alpha": bool(a.get("alpha", True)),
                "pivot": a["pivot"], "dependencies": [], "code_references": a.get("code_references", []),
            }
            inv["assets"].append(rec)
            by_id[a["id"]] = rec
        rec.update({
            "name": a["name"], "location": a["location"], "dimensions": [f["w"], f["h"]],
            "format": f["format"], "sha256": f["sha256"], "bytes": f["bytes"],
            "reference_source": a.get("reference", rec.get("reference_source")),
            "prompt_spec": a.get("prompt", rec.get("prompt_spec")),
            "use": a.get("use", rec.get("use")), "entity": a.get("entity", rec.get("entity")),
            "art_revision": b["batch"], "art_style": "ilustración digital estilizada (no pixel art)",
            "master": ((report.get("assets") or {}).get(a["id"]) or {}).get("master")
                      or os.path.join("ART_ASSETS", "rebuild_masters", b["batch"], os.path.splitext(a.get("raw", a["id"] + ".png"))[0] + ".webp"),
            "reconstruction_status": "DONE", "integration_status": "REGISTERED", "validation_status": "PENDING",
            "notes": a.get("notes", rec.get("notes")), "updated_at": now_iso(),
        })
        if a.get("code_references"):
            rec["code_references"] = a["code_references"]
        print("  [REG] %-34s %s" % (a["id"], "actualizado" if prev else "ALTA NUEVA"))
    inv["total_assets"] = len(inv["assets"])
    inv["updated_at"] = now_iso()
    manifest["totalPlanned"] = max(int(manifest.get("totalPlanned", 0)), len(inv["assets"]))
    ver = write_registry(lines, idx, m, manifest)
    dump_json(INVENTORY_JSON, inv)
    print("registro: %d altas, %d actualizados · total registrado %d · ASSET_CACHE_VERSION %s" % (added, updated, len(manifest["entries"]), ver))


def cmd_mark(args):
    b, assets = load_batch(args.batch)
    assets = select(assets, args.only)
    inv = load_json(INVENTORY_JSON)
    by_id = {a["id"]: a for a in inv["assets"]}
    n = 0
    for a in assets:
        rec = by_id.get(a["id"])
        if not rec or rec.get("art_revision") != b["batch"]:
            continue
        rec["integration_status"] = "INTEGRATED"
        rec["validation_status"] = args.status
        rec["evidence"] = args.evidence
        rec["validated_at"] = now_iso()
        n += 1
    inv["updated_at"] = now_iso()
    dump_json(INVENTORY_JSON, inv)
    print("marcados %d assets como INTEGRATED/%s (evidencia: %s)" % (n, args.status, args.evidence))
    # Inventario clasificado A–E: lo validado en el juego pasa a clase E (rehecho).
    if os.path.exists(AUDIT_JSON) and args.status == "VERIFIED":
        aud = load_json(AUDIT_JSON)
        e = 0
        for a in assets:
            rec = by_id.get(a["id"])
            if not rec or rec.get("art_revision") != b["batch"]:
                continue
            cur = aud["assets"].setdefault(a["id"], {"category": rec.get("category"), "path": rec.get("location")})
            cur["class"] = "E"
            cur["why"] = "rehecho en la tanda %s y validado dentro del juego" % b["batch"]
            cur["batch"] = b["batch"]
            cur["evidence"] = args.evidence
            e += 1
        aud["updated_at"] = now_iso()
        aud["total"] = len(aud["assets"])
        dump_json(AUDIT_JSON, aud)
        print("clasificación A–E: %d assets pasan a clase E (regenerar tablas: audit_report.py render)" % e)


CINE_MANIFEST_JSON = os.path.join(ROOT, "assets", "cinematics", "manifest.json")
AUDIT_JSON = os.path.join(ROOT, "docs", "ART_REBUILD", "AUDIT_CLASSIFICATION.json")


def cmd_audit(args):
    """
    Equivalente ESTÁTICO de DD_ASSETS.integrity(): compara cada entrada del registro
    con el archivo real:
      - existe;
      - tamaño natural == w/h registrados;
      - `alpha` registrado == el archivo tiene de verdad algún píxel transparente.
    Con --fix corrige el DATO registrado para que diga la verdad del archivo (nunca
    toca el PNG) y lo propaga a assets/manifest.json, al inventario maestro y al
    manifiesto cinemático. El dato `alpha` lo usa DD_CINE: una capa 100 % opaca no
    puede dibujarse como primer plano por delante del protagonista.
    """
    from PIL import Image
    lines, idx, m, manifest = read_registry()
    missing, wrong, alpha_wrong = [], [], []
    for aid, e in manifest["entries"].items():
        path = os.path.join(ROOT, e["src"])
        if not os.path.exists(path):
            missing.append((aid, e["src"]))
            continue
        with Image.open(path) as im:
            if (im.width, im.height) != (e.get("w"), e.get("h")):
                wrong.append((aid, (e.get("w"), e.get("h")), (im.width, im.height)))
            if "alpha" in e:
                has_alpha_channel = im.mode in ("RGBA", "LA", "PA") or "transparency" in im.info
                real = bool(has_alpha_channel and im.convert("RGBA").getchannel("A").getextrema()[0] < 255)
                if bool(e["alpha"]) != real:
                    alpha_wrong.append((aid, bool(e["alpha"]), real))
    for aid, src in missing:
        print("  [FALTA]  %-46s %s" % (aid, src))
    for aid, reg, real in wrong:
        print("  [TAMAÑO] %-46s registrado %sx%s · archivo %sx%s" % (aid, reg[0], reg[1], real[0], real[1]))
    for aid, reg, real in alpha_wrong:
        print("  [ALFA]   %-46s registrado alpha=%s · archivo %s" % (aid, str(reg).lower(), "con transparencia" if real else "100 % opaco"))
    print("auditoría: %d registrados · %d sin archivo · %d con tamaño distinto · %d con alfa mal declarado"
          % (len(manifest["entries"]), len(missing), len(wrong), len(alpha_wrong)))
    if not args.fix:
        if missing or wrong or alpha_wrong:
            raise SystemExit(1)
        return
    if not wrong and not alpha_wrong:
        return
    inv = load_json(INVENTORY_JSON)
    by_id = {a["id"]: a for a in inv["assets"]}
    cine = load_json(CINE_MANIFEST_JSON) if os.path.exists(CINE_MANIFEST_JSON) else None
    cine_assets = cine["assets"] if cine and isinstance(cine.get("assets"), dict) else {}
    for aid, _reg, real in wrong:
        manifest["entries"][aid]["w"], manifest["entries"][aid]["h"] = real
        if aid in by_id:
            by_id[aid]["dimensions"] = {"width": real[0], "height": real[1]} if isinstance(by_id[aid].get("dimensions"), dict) else "%dx%d" % real
        if aid in cine_assets and isinstance(cine_assets[aid].get("expected"), dict):
            cine_assets[aid]["expected"]["w"], cine_assets[aid]["expected"]["h"] = real
    for aid, _reg, real in alpha_wrong:
        manifest["entries"][aid]["alpha"] = real
        if aid in by_id and "alpha" in by_id[aid]:
            by_id[aid]["alpha"] = real
        if aid in cine_assets and isinstance(cine_assets[aid].get("expected"), dict) and "alpha" in cine_assets[aid]["expected"]:
            cine_assets[aid]["expected"]["alpha"] = real
    ver = write_registry(lines, idx, m, manifest)
    inv["updated_at"] = now_iso()
    dump_json(INVENTORY_JSON, inv)
    if cine:
        dump_json(CINE_MANIFEST_JSON, cine)
    print("corregidos %d tamaños y %d datos de alfa · ASSET_CACHE_VERSION %s" % (len(wrong), len(alpha_wrong), ver))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("process"); p.add_argument("batch"); p.add_argument("--only"); p.add_argument("--raw")
    p.add_argument("--cell", default="220"); p.add_argument("--cols", default="4"); p.add_argument("--sheet"); p.add_argument("--tag", default="")
    p.add_argument("--no-sheet", action="store_true"); p.set_defaults(fn=cmd_process)
    p = sub.add_parser("register"); p.add_argument("batch"); p.add_argument("--only"); p.set_defaults(fn=cmd_register)
    p = sub.add_parser("mark"); p.add_argument("batch"); p.add_argument("--only"); p.add_argument("--evidence", required=True)
    p.add_argument("--status", default="VERIFIED"); p.set_defaults(fn=cmd_mark)
    p = sub.add_parser("audit"); p.add_argument("--fix", action="store_true"); p.set_defaults(fn=cmd_audit)
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
