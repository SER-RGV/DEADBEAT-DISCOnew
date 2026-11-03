#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DEADBEAT DISCO · Fase 1 · Tanda 02 — preparación reproducible de assets.

Convierte las 10 ilustraciones fuente de ART_ASSETS/tanda_02/_source/ en los
PNG finales que el motor espera, usando EXCLUSIVAMENTE las dimensiones de los
slots V5 reales que consumen el pintor de muros ($b / _b) y el pintor de
puertas (Bg). No se genera ninguna lámina, spritesheet ni sustituto.

Recorte:
  1. Se detecta el color de fondo por mediana de las 4 esquinas (negro en 9
     fuentes, blanco en threshold_entry). NO se asume un color fijo.
  2. Clave por distancia al fondo con umbral por asset + rampa de antialias,
     de modo que los halos de neón no dejen bordes sucios.
  3. Se restauran los huecos INTERIORES grandes (negros legítimos del objeto)
     mediante componentes conexas que no tocan el borde: evita agujeros.
  4. Se recorta al bounding box alfa y se escala al tamaño exacto del slot
     (modo 'fit' = recorte centrado, 'contain' = padding transparente).
  5. Se guarda RGBA con canal alfa real, separado de las fuentes originales.

Uso: python3 ART_TOOLS/prepare_tanda_02.py
"""
from __future__ import annotations

import json
import statistics
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "ART_ASSETS" / "tanda_02" / "_source"
DST = ROOT / "ART_ASSETS" / "tanda_02"

# id, fichero fuente, fichero final, slot V5 REAL, w, h, modo, umbral, pivote,
# uso previsto, referencia de código, nota de adaptación
SPEC = [
    dict(id="A01", name="wall_straight", src="wall_straight.png",
         file="wall_straight.png", slot="wall_stained_glass_arch", w=120, h=176,
         mode="fit", thr=14, pivot="bottom-center",
         use="Panel recto base. El motor lo repite por panel a lo largo de cada edge.",
         code="_b(ctx,i,y,o,r,t) / $b wrapper v8.6 · panelCount=round(edge.len/230)",
         adapt="Proporcion 0.68 coincide con el slot (120x176)."),
    dict(id="A02", name="wall_corner_inner", src="wall_corner_inner.png",
         file="wall_corner_inner.png", slot="wall_limbo_ticket_window", w=144, h=144,
         mode="fit", thr=14, pivot="bottom-center",
         use="Esquina interior / panel de union en muro de circulo 0 (HUB-LIMBO), c%3==1.",
         code="$b wrapper v8.6 · drawImage(lw, i-68, -160, 136, 136)",
         adapt="Proporcion 1:1 coincide con el slot."),
    dict(id="A03", name="wall_corner_outer", src="wall_corner_outer.png",
         file="wall_corner_outer.png", slot="wall_avaricia_vault_door", w=150, h=86,
         mode="fit", thr=14, pivot="bottom-center",
         use="Esquina exterior / modulo de cambio de orientacion, circulo 3.",
         code="$b wrapper · else if(3===o) drawImage(vd, i-84, -132, 168, 96)",
         adapt="1.79 -> 1.74, recorte centrado del 3% horizontal."),
    dict(id="A04", name="wall_end_cap", src="wall_end_cap.png",
         file="wall_end_cap.png", slot="wall_traicion_glacier_panel", w=124, h=64,
         mode="fit", thr=14, pivot="bottom-center",
         use="Remate terminal de tramo de muro, circulo 8.",
         code="$b wrapper · else if(8===o) drawImage(gw, i-84, -128, 168, 87)",
         adapt="1.83 -> 1.94, recorte centrado del 6% vertical."),
    dict(id="A05", name="wall_pillar", src="wall_pillar.png",
         file="wall_pillar.png", slot="nucleo_pillar_prop", w=204, h=505,
         mode="fit", thr=14, pivot="bottom-center",
         use="Pilar estructural. Se resuelve via hasV5Slot() en props con colisionador propio.",
         code="v8.2 resolvePropV5 · hasV5Slot('nucleo_pillar_prop')",
         adapt="0.558 -> 0.404: recorte lateral centrado; el fuste es central y no se pierde."),
    dict(id="A06", name="door_closed", src="door_closed.png",
         file="door_closed.png", slot="campaign_door_leaf", w=76, h=54,
         mode="fit", thr=14, pivot="center",
         crop=(0.115, 0.055, 0.515, 0.965),
         use="Hoja UNA de puerta cerrada. El motor la dibuja dos veces (2ª espejada).",
         code="Bg(door) · drawImage(dl, wx-60-58*o, wy-86, 60, 80) + scale(-1,1)",
         adapt="Se recorta la media puerta IZQUIERDA de la fuente: el slot es una sola "
               "hoja, no la puerta doble. La apertura sigue siendo desplazamiento "
               "58*o de la misma hoja; NO se cambia la logica de apertura."),
    dict(id="A07", name="door_open", src="door_open.png",
         file="door_open.png", slot="campaign_door_side_leaf", w=52, h=136,
         mode="fit", thr=16, pivot="center",
         crop=(0.355, 0.045, 0.585, 0.965),
         use="Hoja lateral de paso abierto. El motor la desplaza -118*o al abrir.",
         code="Bg(door) · else if(|nx|>.58) drawImage(sl, -8, -88-118*o, 48, 136)",
         adapt="INCOMPATIBILIDAD DOCUMENTADA: el motor no tiene un sprite alternativo "
               "de 'puerta abierta'; anima la MISMA hoja con Ot.openT. La pieza se "
               "adapta a la franja central del hueco y se integra como hoja lateral, "
               "no como estado del interruptor de apertura."),
    dict(id="A08", name="doorway_frame", src="doorway_frame.png",
         file="doorway_frame.png", slot="campaign_door_frame", w=196, h=124,
         mode="fit", thr=14, pivot="center",
         use="Marco de portal con centro VACIO: deja ver las hojas detras, cerradas o abiertas.",
         code="Bg(door) · drawImage(df, wx-96, wy-114, 192, 122)",
         adapt="1.83 -> 1.58, recorte centrado del 14% horizontal; el hueco central "
               "se conserva integro para no tapar el paso."),
    dict(id="A09", name="threshold_entry", src="threshold_entry.png",
         file="threshold_entry.png", slot="campaign_door_south_gate", w=196, h=67,
         mode="contain", thr=40, pivot="center",
         use="Umbral de entrada enrasado con el suelo de la puerta sur.",
         code="Bg(door) · else if(ny<-.58) drawImage(sg, wx-98, wy-46, 196, 67)",
         adapt="Fondo BLANCO en la fuente (detectado por esquinas). Diamante 2:1 se "
               "conserva completo con 'contain' y padding transparente: sin deformar "
               "y sin recortar las puntas. No anade colisiones ni falso obstaculo."),
    dict(id="A10", name="wall_neon_detail", src="wall_neon_detail.png",
         file="wall_neon_detail.png", slot="wall_neon_club_crest", w=84, h=84,
         mode="fit", thr=14, pivot="center",
         use="Modulo de neon complementario sobre muro / HUD de escenario.",
         code="$b wrapper · 1===o && c%2===0 drawImage(cr, i-26, -172, 52, 52); "
              "DMO_HUB v3.5 decor 44x44 / 48x48",
         adapt="Proporcion 1:1 coincide con el slot."),
]

HOLE_MIN = 900          # huecos interiores legítimos por debajo de este área se rellenan
RAMP = 26               # rampa de antialias sobre el umbral


def bg_color(im: Image.Image):
    w, h = im.size
    pts = [im.getpixel(p) for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
                                    (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]]
    return tuple(int(statistics.median(c[k] for c in pts)) for k in range(3))


def build_alpha(im: Image.Image, thr: int):
    """Devuelve una máscara L (0=fondo, 255=objeto) con rampa y cierre de huecos."""
    bg = bg_color(im)
    solid = Image.new("RGB", im.size, bg)
    diff = ImageChops.difference(im, solid)
    # distancia por canal -> máximo de los tres
    r, g, b = diff.split()
    dist = ImageChops.lighter(ImageChops.lighter(r, g), b)

    # rampa: por debajo de thr -> 0; entre thr y thr+RAMP -> transición suave
    lut = [0 if v <= thr else (255 if v >= thr + RAMP else int(255 * (v - thr) / RAMP))
           for v in range(256)]
    alpha = dist.point(lut)

    # Cierre de huecos interiores: binarizamos y etiquetamos componentes de
    # "transparente" que NO tocan el borde. Las grandes son detalles negros
    # legítimos del objeto (fondo, vidriera, jambas), no fondo.
    binary = alpha.point(lambda v: 255 if v >= 128 else 0)
    w, h = binary.size
    px = binary.load()
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            i = y * w + x
            if px[x, y] == 0 and not seen[i]:
                seen[i] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            i = y * w + x
            if px[x, y] == 0 and not seen[i]:
                seen[i] = 1
                q.append((x, y))
    while q:                                   # fondo conectado al borde
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                j = ny * w + nx
                if not seen[j] and px[nx, ny] == 0:
                    seen[j] = 1
                    q.append((nx, ny))

    out = alpha.copy()
    op = out.load()
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if px[x, y] == 0 and not seen[i]:   # hueco interior
                op[x, y] = 255
    # antialias final muy ligero, sin comer el contorno
    return out.filter(ImageFilter.GaussianBlur(0.45)), bg


def crop_alpha(im: Image.Image, alpha: Image.Image):
    bbox = alpha.getbbox()
    if not bbox:
        raise RuntimeError("recorte vacío: toda la imagen se consideró fondo")
    return im.crop(bbox), alpha.crop(bbox)


def place(im: Image.Image, alpha: Image.Image, W: int, H: int, mode: str):
    sw, sh = im.size
    if mode == "contain":
        k = min(W / sw, H / sh)
        nw, nh = max(1, round(sw * k)), max(1, round(sh * k))
        placed = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        piece = im.convert("RGBA").resize((nw, nh), Image.LANCZOS)
        pa = alpha.resize((nw, nh), Image.LANCZOS)
        piece.putalpha(pa)
        placed.paste(piece, ((W - nw) // 2, (H - nh) // 2))
        return placed, (nw, nh, (W - nw) // 2, (H - nh) // 2)
    # fit: escala cubriendo y recorta el exceso centrado (sin deformar)
    k = max(W / sw, H / sh)
    nw, nh = max(1, round(sw * k)), max(1, round(sh * k))
    big = im.convert("RGBA").resize((nw, nh), Image.LANCZOS)
    ba = alpha.resize((nw, nh), Image.LANCZOS)
    big.putalpha(ba)
    l, t = (nw - W) // 2, (nh - H) // 2
    return big.crop((l, t, l + W, t + H)), (nw, nh, l, t)


def main():
    DST.mkdir(parents=True, exist_ok=True)
    manifest = {
        "tanda": "02",
        "title": "Reconstruccion artistica: arquitectura modular de la discoteca",
        "family": "arquitectura interior modular",
        "loader": "window.__DDM_V5_IMG[key] -> window.__DDM_GET_V5(key) "
                  "(registro V5 existente, ampliado en ART_PACK/art_pack.js)",
        "html": "DEADBEAT_DISCO.ART.html (sin modificar: ya carga ART_PACK/art_pack.js)",
        "count": len(SPEC),
        "preparation": "ART_TOOLS/prepare_tanda_02.py · Pillow · recorte por distancia "
                       "al color de fondo detectado en esquinas · cierre de huecos "
                       "interiores · LANCZOS · canal alfa real",
        "assets": [],
    }
    for s in SPEC:
        src_path = SRC / s["src"]
        src = Image.open(src_path).convert("RGB")
        if s.get("crop"):
            a, b, c, d = s["crop"]
            w, h = src.size
            src = src.crop((round(a * w), round(b * h), round(c * w), round(d * h)))
        alpha, bg = build_alpha(src, s["thr"])
        obj, alpha = crop_alpha(src, alpha)
        final, geo = place(obj, alpha, s["w"], s["h"], s["mode"])
        out = DST / s["file"]
        final.save(out, "PNG", optimize=True)

        # verificación inmediata del canal alfa y de la decodificación
        chk = Image.open(out)
        chk.load()
        a = chk.getchannel("A")
        lo, hi = a.getextrema()
        opaque = sum(1 for v in a.getdata() if v > 8)
        total = s["w"] * s["h"]
        manifest["assets"].append({
            "id": s["id"], "name": s["name"], "path": "ART_ASSETS/tanda_02/" + s["file"],
            "source": "ART_ASSETS/tanda_02/_source/" + s["src"],
            "width": chk.width, "height": chk.height,
            "format": "PNG", "mode": chk.mode, "alpha": True,
            "alphaExtrema": [lo, hi], "opaqueRatio": round(opaque / total, 4),
            "bytes": out.stat().st_size,
            "pivot": s["pivot"], "intendedUse": s["use"],
            "loader": "V5", "slot": s["slot"],
            "codeReferences": s["code"], "adaptation": s["adapt"],
            "backgroundDetected": list(bg), "threshold": s["thr"],
            "scaleMode": s["mode"],
            "sourceCrop": s.get("crop") or "auto-alpha-bbox",
            "placeGeometry": geo,
            "integrationStatus": "pending",
            "validationResult": "pending",
        })
        print(f"{s['id']} {s['name']:<20} {chk.width:>3}x{chk.height:<3} "
              f"bg={bg} alpha={lo}..{hi} opaque={opaque/total:.1%} -> {out.name}")

    (DST / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("\nmanifest:", DST / "manifest.json", "assets:", len(manifest["assets"]))


if __name__ == "__main__":
    main()
