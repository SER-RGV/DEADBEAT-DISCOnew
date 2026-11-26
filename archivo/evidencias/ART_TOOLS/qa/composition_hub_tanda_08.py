#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TANDA 08 · FASE 1 — Generador de la prueba de composición.

Crea una COPIA TEMPORAL del HTML activo (`t08_composition.html`) con el
prototipo procedural de `t08_composition_block.js` inyectado en DOS puntos
nuevos (sin tocar ninguna línea de T01-T07), ejecuta el arnés Playwright y
borra la copia al terminar.

Uso: python3 ART_TOOLS/qa/composition_hub_tanda_08.py
Salida: ART_EVIDENCE/hub/tanda_08/composition_proof.json + capturas.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HTML = ROOT / 'DEADBEAT_DISCO.ART.html'
BLOCK = ROOT / 'ART_TOOLS' / 'qa' / 't08_composition_block.js'
TEMP = ROOT / 't08_composition.html'
PROBE = ROOT / 'ART_TOOLS' / 'qa' / 't08_composition_probe.js'


def main() -> int:
    html = HTML.read_text(encoding='utf-8')
    block = BLOCK.read_text(encoding='utf-8')

    a_mod = '/* === TANDA07:END (módulo) ============================================= */\n'
    a_call = '        T07.installHooks();\n'
    if html.count(a_mod) != 1 or html.count(a_call) != 1:
        raise SystemExit('Anclas de composición no únicas')
    if 'TANDA08:COMPOSITION' in html:
        raise SystemExit('El HTML activo ya contiene el prototipo (no esperado)')

    # A) módulo del prototipo dentro de initDmoHubV35, tras el módulo T07.
    html = html.replace(a_mod, a_mod + '\n' + block + '\n', 1)
    # B) llamada de enganches tras T07.installHooks() en buildHubSpace.
    call = (a_call +
            '        /* === TANDA08:COMPOSITION:BEGIN · enganches del prototipo === */\n'
            '        T08P.installHooks();\n'
            '        /* === TANDA08:COMPOSITION:END ================================= */\n')
    html = html.replace(a_call, call, 1)

    TEMP.write_text(html, encoding='utf-8')
    print('copia temporal:', TEMP.name, len(html.encode()), 'bytes')
    try:
        r = subprocess.run(['node', str(PROBE)], cwd=str(ROOT), timeout=300)
        return r.returncode
    finally:
        TEMP.unlink(missing_ok=True)
        print('copia temporal eliminada')


if __name__ == '__main__':
    sys.exit(main())
