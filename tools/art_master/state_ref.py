#!/usr/bin/env python3
"""Referencia para generar un fotograma de estado a partir del reposo de un personaje.

Un fotograma de estado (ataque, impacto, muerte) se pide al generador con la figura de
reposo como única imagen de referencia. Dos cosas de esa referencia pasan a la salida:

  * la proporción del lienzo y el tamaño relativo de la figura: una pose que no cabe no
    se dibuja más pequeña, se recorta. Por eso la figura se pega en el centro de un
    lienzo croma más ancho;
  * todo lo que el reposo traiga de más: la línea de suelo bajo los pies y los cables
    que llegan al borde superior se heredaron en 3 de 3 fotogramas de R03. Por eso la
    referencia se monta con la figura YA LIMPIA (mismas claves `erase`, `keep`,
    `ground_line` y `fade` que usa `batch.py process`) y no con el croma original.

Uso:
    state_ref.py <tanda.json> [--only id,id] [--k 1.35] [--raw DIR] [--out DIR]

Escribe `<raw>/_refs/ref_<nombre>_wide.png` (para `boss_06_matarife_idle`,
`ref_06_matarife_wide.png`) e imprime el factor que hay que anotar en la ficha del
fotograma: K = alto de la imagen generada / alto de esta referencia.
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
DEFAULT_RAW_ROOT = os.environ.get("DD_RAW_ROOT", "/home/user/dd_work/raw")


def ref_name(asset_id):
    name = asset_id
    for prefix in ("boss_", "enemy_", "npc_"):
        if name.startswith(prefix):
            name = name[len(prefix):]
            break
    if name.endswith("_idle"):
        name = name[:-5]
    return "ref_%s_wide.png" % name


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("batch")
    ap.add_argument("--only", default="", help="ids separados por comas (por defecto, todos los *_idle)")
    ap.add_argument("--k", type=float, default=1.35, help="ancho del lienzo respecto al original (1.30–1.40)")
    ap.add_argument("--raw", default="", help="carpeta de los croma originales")
    ap.add_argument("--out", default="", help="carpeta de salida (por defecto <raw>/_refs)")
    a = ap.parse_args()

    import numpy as np
    from PIL import Image
    import artlib

    with open(a.batch, encoding="utf-8") as fh:
        b = json.load(fh)
    defaults = b.get("defaults", {})
    raw_dir = a.raw or os.path.join(DEFAULT_RAW_ROOT, b["batch"])
    out_dir = a.out or os.path.join(raw_dir, "_refs")
    os.makedirs(out_dir, exist_ok=True)
    want = set(x for x in a.only.split(",") if x)
    done = 0
    for asset in b.get("assets", []):
        if want and asset["id"] not in want:
            continue
        if not want and not asset["id"].endswith("_idle"):
            continue
        asset = dict(defaults, **asset)
        raw = os.path.join(raw_dir, asset.get("raw", asset["id"] + ".png"))
        if not os.path.exists(raw):
            print("  [FALTA] %s" % raw)
            continue
        src = Image.open(raw).convert("RGB")
        px = np.asarray(src)
        frame = np.concatenate([px[:6].reshape(-1, 3), px[-6:].reshape(-1, 3),
                                px[:, :6].reshape(-1, 3), px[:, -6:].reshape(-1, 3)])
        chroma = tuple(int(v) for v in np.median(frame, axis=0))
        keyed, _ = artlib.chroma_matte(src, key=asset.get("key", "green"), mode=asset.get("matte", "hard"),
                                       band=int(asset.get("band", 3)),
                                       despill_all=bool(asset.get("despill_all", False)))
        keyed, cleaned = artlib.apply_cleanup(keyed, asset)
        w, h = keyed.size
        big_w = int(round(w * a.k))
        big_w += (big_w - w) % 2
        out = Image.new("RGB", (big_w, h), chroma)
        out.paste(keyed.convert("RGB"), ((big_w - w) // 2, 0), keyed.getchannel("A"))
        dst = os.path.join(out_dir, ref_name(asset["id"]))
        out.save(dst)
        done += 1
        print("%s  %dx%d  croma %s  limpieza %s  K = alto generado / %d"
              % (dst, big_w, h, chroma, json.dumps(cleaned, ensure_ascii=False) if cleaned else "ninguna", h))
    print("%d referencias" % done)


if __name__ == "__main__":
    main()
