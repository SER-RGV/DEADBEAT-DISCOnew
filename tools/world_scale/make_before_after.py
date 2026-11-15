#!/usr/bin/env python3
"""FASE 08 · Copia y compone las capturas de la sonda en docs/WORLD_SCALE_REBUILD/BEFORE_AFTER/.

Uso:
  python3 tools/world_scale/make_before_after.py \
      --before /tmp/ddqa/scale/legacy/r1080 \
      --after /tmp/ddqa/scale/after/r1080 /tmp/ddqa/scale/after/r900 /tmp/ddqa/scale/after/r720

* `before/`  : capturas del perfil legacy (= build anterior) reducidas a 1280 px de ancho.
* `after/`   : capturas DESPUÉS por resolución, reducidas a 1280 px de ancho.
* `compare_<situacion>_1080.jpg` : ANTES (izq.) | DESPUÉS (der.) a 1080p con rótulo.
* `summary.json` : telemetría resumida de cada carpeta (cámara, sala, figuras, trayectoria, coste por cuadro).
"""
import argparse, json, os, shutil, sys
from PIL import Image, ImageDraw

SITS = ["room_normal", "room_crowd", "corridor", "boss_arena", "transition", "edge", "hub"]
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "docs", "WORLD_SCALE_REBUILD", "BEFORE_AFTER")


def shrink(src, dst, width=1280, quality=74):
    im = Image.open(src).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(dst, quality=quality, optimize=True)
    return im


def label(im, text):
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 8 + 7 * len(text), 22], fill=(0, 0, 0))
    d.text((4, 5), text, fill=(255, 255, 255))
    return im


def summarize(folder):
    p = os.path.join(folder, "probe_report.json")
    if not os.path.exists(p):
        return None
    r = json.load(open(p))
    out = {"tag": r.get("tag"), "url": r.get("url"), "pageErrors": len(r.get("pageErrors") or []), "runs": []}
    for run in r.get("runs") or []:
        s = {"res": run.get("res"), "shots": {}, "trajectory": {k: v for k, v in (run.get("trajectory") or {}).items() if k != "sample"},
             "visited": [(v.get("level"), v.get("geo"), v["rect"]["w"], v["rect"]["h"]) for v in (run.get("visited") or [])],
             "perf": run.get("perfEnd")}
        for name, t in (run.get("tele") or {}).items():
            cam = t.get("camera") or {}
            s["shots"][name] = {
                "camera": {"x": cam.get("x"), "y": cam.get("y"), "zoom": round(cam.get("zoom") or 0, 4), "viewW": cam.get("viewW"), "viewH": cam.get("viewH")},
                "mode": (t.get("cameraModule") or {}).get("mode"),
                "room": (t.get("room") or {}).get("rect"), "level": (t.get("room") or {}).get("level"),
                "player": t.get("player"), "boss": t.get("boss"), "enemies": len(t.get("enemies") or []),
                "profile": (t.get("scaleProfile") or {}).get("profile"),
            }
        f = None
        for t in (run.get("tele") or {}).values():
            if t.get("figures"):
                f = t["figures"]
                break
        s["figures"] = f
        out["runs"].append(s)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--before", required=True)
    ap.add_argument("--after", nargs="+", required=True)
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()
    os.makedirs(os.path.join(a.out, "before"), exist_ok=True)
    os.makedirs(os.path.join(a.out, "after"), exist_ok=True)
    summary = {"before": summarize(a.before), "after": []}
    before_imgs = {}
    for f in sorted(os.listdir(a.before)):
        if f.endswith(".jpg"):
            dst = os.path.join(a.out, "before", f)
            before_imgs[f] = shrink(os.path.join(a.before, f), dst)
    after_1080 = {}
    for folder in a.after:
        summary["after"].append(summarize(folder))
        for f in sorted(os.listdir(folder)):
            if f.endswith(".jpg"):
                dst = os.path.join(a.out, "after", f)
                im = shrink(os.path.join(folder, f), dst)
                if "1920x1080" in f:
                    after_1080[f] = im
    # comparativas a 1080p
    for sit in SITS:
        b = next((im for n, im in before_imgs.items() if n.endswith(sit + ".jpg") and "1920x1080" in n), None)
        c = next((im for n, im in after_1080.items() if n.endswith(sit + ".jpg")), None)
        if b is None or c is None:
            continue
        w, h = b.width, b.height
        sheet = Image.new("RGB", (w * 2 + 8, h), (20, 20, 20))
        sheet.paste(label(b.copy(), "ANTES (legacy) 1920x1080 " + sit), (0, 0))
        sheet.paste(label(c.copy(), "DESPUES (intermedia) 1920x1080 " + sit), (w + 8, 0))
        sheet.save(os.path.join(a.out, "compare_%s_1080.jpg" % sit), quality=72, optimize=True)
    json.dump(summary, open(os.path.join(a.out, "summary.json"), "w"), indent=1, ensure_ascii=False)
    print("BEFORE_AFTER listo en", a.out)


if __name__ == "__main__":
    sys.exit(main())
