#!/usr/bin/env python3
"""Aplicador mínimo y REVERSIBLE de la «MODIFICACIÓN PRIORITARIA» (A–F).

Inserta exactamente 4 bloques (0 eliminaciones) en DEADBEAT_DISCO.ART.html:
  1. el módulo `hub_legibilidad_block.js` tras TANDA09:END (módulo);
  2. apertura del gancho de clip en T08 `drawCutaway()`;
  3. cierre de ese gancho;
  4. `LEG.install()` tras `T09.install()` en `buildHubSpace()`.

`--restore` recupera el HTML byte a byte desde el commit de la auditoría
`56dfd85df28f3ba29ff5dfee62b1d02c5ce09d6b` (idéntico al publicado en 3a22d5b),
o desde una copia de seguridad local, y verifica el SHA-256.

Uso:  python3 ART_TOOLS/apply_hub_legibilidad.py [--check|--restore]
"""
from __future__ import annotations
import hashlib
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / "DEADBEAT_DISCO.ART.html"
BLOCK = ROOT / "ART_TOOLS" / "hub_legibilidad_block.js"
BASE_COMMIT = "56dfd85df28f3ba29ff5dfee62b1d02c5ce09d6b"
BASE_SHA = "3e82dc77b9fd4c59d01e016628b204b1b07042c7f8f9085de3433141e5429011"
BACKUP = pathlib.Path("/tmp/t10/HTML.PRE_LEGIBILIDAD")

M_MODULE = "/* === MODIFICACIÓN PRIORITARIA:INICIO"
M_CLIP_A = "/* === MODIFICACIÓN PRIORITARIA:CLIP:BEGIN"
M_CLIP_B = "/* === MODIFICACIÓN PRIORITARIA:CLIP:END"
M_INSTALL = "        LEG.install();"

A_MODULE = "/* === TANDA09:END (módulo) ================================================== */"
A_CLIP_A = "          c.beginPath();\n          c.moveTo(-40, T); c.lineTo(W + 40, T);"
A_CLIP_B = "          c.closePath(); c.clip();\n          const bg = c.createLinearGradient(0, T, 0, H);"
A_INSTALL = "        T09.install();"

CLIP_OPEN = (
    "          /* === MODIFICACIÓN PRIORITARIA:CLIP:BEGIN ==================================\n"
    "             Con el flag activo, T08 recorta el cutaway con la boca REAL de la\n"
    "             grieta (posición en pantalla derivada de la cámara). Con false,\n"
    "             `clipCutaway` devuelve false y se usa la trayectoria original. */\n"
    "          if (!(window.DMO_HUB_LEGIBILIDAD &&\n"
    "                window.DMO_HUB_LEGIBILIDAD.clipCutaway &&\n"
    "                window.DMO_HUB_LEGIBILIDAD.clipCutaway(c, q))) {\n"
    "          /* === MODIFICACIÓN PRIORITARIA:CLIP:IFEND ================================= */\n"
)
CLIP_CLOSE = (
    "          /* === MODIFICACIÓN PRIORITARIA:CLIP:END =================================== */\n"
    "          }\n"
)
INSTALL = (
    "        /* === MODIFICACIÓN PRIORITARIA:BEGIN · enganche ===============================\n"
    "           Se monta aquí, en buildHubSpace(), cuando T01–T09 ya están en su cadena\n"
    "           final. reversible con window.__DDM_HUB_LEGIBILIDAD = false. */\n"
    "        LEG.install();\n"
    "        /* === MODIFICACIÓN PRIORITARIA:END · enganche ================================= */\n"
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_base() -> bytes:
    p = subprocess.run(
        ["git", "show", f"{BASE_COMMIT}:DEADBEAT_DISCO.ART.html"],
        cwd=ROOT, capture_output=True,
    )
    if p.returncode == 0 and p.stdout:
        return p.stdout
    if BACKUP.exists():
        return BACKUP.read_bytes()
    raise SystemExit("No se pudo recuperar la base: ni git show ni copia local")


def check(text: str) -> dict:
    return {
        "module": text.count(M_MODULE),
        "clip_begin": text.count(M_CLIP_A),
        "clip_end": text.count(M_CLIP_B),
        "install": text.count(M_INSTALL),
        "sha": sha(text.encode("utf-8")),
        "bytes": len(text.encode("utf-8")),
    }


def main() -> int:
    raw = HTML.read_bytes()
    text = raw.decode("utf-8")
    mode = sys.argv[1] if len(sys.argv) > 1 else "--apply"

    if mode == "--check":
        print(check(text))
        return 0

    if mode == "--restore":
        base = read_base()
        if sha(base) != BASE_SHA:
            raise SystemExit(f"La base recuperada no coincide con {BASE_SHA}")
        BACKUP.parent.mkdir(parents=True, exist_ok=True)
        BACKUP.write_bytes(base)
        HTML.write_bytes(base)
        print(f"RESTAURADO: {sha(HTML.read_bytes())} | {len(base)} bytes")
        return 0

    if mode != "--apply":
        raise SystemExit("Uso: --apply | --check | --restore")

    st = check(text)
    if any(st[k] for k in ("module", "clip_begin", "clip_end", "install")):
        raise SystemExit(f"Ya hay marcadores: {st}. Usa --restore antes.")
    if sha(raw) != BASE_SHA:
        raise SystemExit("El HTML no es la base publicada; abortando.")

    base = read_base()
    HTML_BACKUP = base
    BACKUP.parent.mkdir(parents=True, exist_ok=True)
    BACKUP.write_bytes(HTML_BACKUP)

    module = BLOCK.read_text(encoding="utf-8").rstrip("\n")
    # 1) módulo
    assert text.count(A_MODULE) == 1, "ancla de módulo no única"
    text = text.replace(A_MODULE, A_MODULE + "\n" + module + "\n", 1)
    # 2) apertura del clip: se inserta DESPUÉS de `c.beginPath();`
    assert text.count(A_CLIP_A) == 1, "ancla de clip no única"
    text = text.replace(
        A_CLIP_A,
        "          c.beginPath();\n" + CLIP_OPEN
        + "          c.moveTo(-40, T); c.lineTo(W + 40, T);",
        1,
    )
    # 3) cierre del clip
    assert text.count(A_CLIP_B) == 1, "ancla de cierre no única"
    text = text.replace(
        A_CLIP_B,
        "          c.closePath(); c.clip();\n" + CLIP_CLOSE
        + "          const bg = c.createLinearGradient(0, T, 0, H);",
        1,
    )
    # 4) enganche en buildHubSpace()
    assert text.count(A_INSTALL) == 1, "ancla de install no única"
    text = text.replace(A_INSTALL, A_INSTALL + "\n" + INSTALL.rstrip("\n"), 1)

    HTML.write_bytes(text.encode("utf-8"))
    out = check(HTML.read_text(encoding="utf-8"))
    print("APLICADO:", out)
    assert out["module"] == 1 and out["clip_begin"] == 1
    assert out["clip_end"] == 1 and out["install"] == 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
