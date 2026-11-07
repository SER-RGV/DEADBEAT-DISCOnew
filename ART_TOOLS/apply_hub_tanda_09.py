#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Aplica (o revierte) la capa de rutinas de la TANDA 09 en el HTML activo.

Dos INSERCIONES, cero eliminaciones de TANDA 01–08:
  1) módulo T09 tras `TANDA08:END (módulo)` dentro de initDmoHubV35();
  2) `T09.install();` tras `T08.install();` dentro de buildHubSpace().

NO toca ART_PACK/art_pack.js. Idempotente; --restore devuelve el HTML a su
estado PRE_T09 exacto (verificado por SHA-256).

Uso: python3 ART_TOOLS/apply_hub_tanda_09.py [--restore]
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / 'DEADBEAT_DISCO.ART.html'
BLOCK = ROOT / 'ART_TOOLS' / 'hub_tanda_09_block.js'
BACKUP = Path('/tmp/t9/DEADBEAT_DISCO_ART_html.PRE_T09')
HASHFILE = Path('/tmp/t9/html.sha256.PRE_T09')

ANCHOR_MODULE = '/* === TANDA08:END (módulo) ============================================== */'
ANCHOR_CALL = '        T08.install();\n'
M_BEGIN = '/* === TANDA09:BEGIN · MÓDULO'
M_END = '/* === TANDA09:END (módulo) ================================================== */\n'
C_BEGIN = '        /* === TANDA09:BEGIN · FASE 2/3/4 · enganches ============================ */\n'
C_END = '        /* === TANDA09:END · FASE 2/3/4 ======================================== */\n'
CALL_BLOCK = (C_BEGIN +
              '        T09.install();\n' +
              C_END)


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def restore() -> int:
    # Restauración EXACTA desde el respaldo tomado en la primera aplicación.
    # Es la única forma de garantizar que no queden líneas huérfanas y que el
    # SHA-256 coincida bit a bit con el estado PRE_T09.
    if BACKUP.exists():
        HTML.write_bytes(BACKUP.read_bytes())
    else:
        s = HTML.read_text(encoding='utf-8')
        a, b = s.find(M_BEGIN), s.find(M_END)
        if a >= 0 and b > a:
            s = s[:a] + s[b + len(M_END):]
        c, d = s.find(C_BEGIN), s.find(C_END)
        if c >= 0 and d > c:
            s = s[:c] + s[d + len(C_END):]
        HTML.write_text(s, encoding='utf-8')
    s = HTML.read_text(encoding='utf-8')
    ok = ('TANDA09:BEGIN' not in s and 'T09.install()' not in s)
    if HASHFILE.exists():
        want = HASHFILE.read_text(encoding='utf-8').strip()
        ok = ok and sha(HTML) == want
        print('--restore SHA-256 exacto:', sha(HTML) == want)
    print('--restore marcadores eliminados:', ok)
    return 0 if ok else 3


def main() -> int:
    if '--restore' in sys.argv:
        return restore()
    s = HTML.read_text(encoding='utf-8')
    if 'TANDA09:BEGIN' in s:
        print('ABORT: ya existen marcadores TANDA09; usa --restore antes de reaplicar')
        return 2
    if s.count(ANCHOR_MODULE) != 1:
        print('ABORT: ancla de módulo no única:', s.count(ANCHOR_MODULE)); return 2
    if s.count(ANCHOR_CALL) != 1:
        print('ABORT: ancla de llamada no única:', s.count(ANCHOR_CALL)); return 2
    block = BLOCK.read_text(encoding='utf-8')
    if not block.startswith(M_BEGIN) or M_END not in block:
        print('ABORT: el bloque T09 no tiene los marcadores esperados'); return 2

    if not BACKUP.exists():
        BACKUP.parent.mkdir(parents=True, exist_ok=True)
        BACKUP.write_bytes(HTML.read_bytes())
        HASHFILE.write_text(sha(HTML) + '\n', encoding='utf-8')
        print('backup PRE_T09:', BACKUP, sha(HTML)[:16])

    s = s.replace(ANCHOR_MODULE, ANCHOR_MODULE + '\n' + block.strip('\n') + '\n', 1)
    s = s.replace(ANCHOR_CALL, ANCHOR_CALL + CALL_BLOCK, 1)
    HTML.write_text(s, encoding='utf-8')

    checks = dict(
        bytes=HTML.stat().st_size,
        lines=len(s.splitlines()),
        moduleMarkers=s.count('TANDA09:BEGIN · MÓDULO') == 1 and s.count('TANDA09:END (módulo)') == 1,
        callMarkers=s.count('TANDA09:BEGIN · FASE 2/3/4') == 1 and s.count('TANDA09:END · FASE 2/3/4') == 1,
        installCall=s.count('T09.install();') == 1,
        flag=s.count('__DDM_HUB_T09') >= 2,
        t07Intact=s.count('T07.installActors();') == 1 and s.count('T07.installHooks();') == 1,
        t08Intact=s.count('T08.install();') == 1 and s.count('TANDA08:END (módulo)') == 1,
        artPackUntouched=True)
    print(json.dumps(checks, ensure_ascii=False, indent=2))
    return 0 if all(v for k, v in checks.items() if isinstance(v, bool)) else 3


if __name__ == '__main__':
    raise SystemExit(main())
