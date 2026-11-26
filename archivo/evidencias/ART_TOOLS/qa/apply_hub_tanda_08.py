#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TANDA 08 · FASE 3 — Integración NO destructiva en la build activa.

6 inserciones en total (3 en art_pack.js, 2 en el HTML, 1 de versión), todas
con anclas ÚNICAS y marcadores TANDA08:BEGIN/END. No toca ninguna línea de
TANDA 01–07.

  art_pack.js : bloque HUB8_* (mismo load()), encadenado tras loadHub7(),
                exports hub8*, versión.
  HTML        : módulo T08 tras el módulo T07 (DENTRO de initDmoHubV35),
                T08.install() tras T07.installHooks() (DENTRO de buildHubSpace).

Se guardan backups en /tmp/t8/*.PRE_T08.* antes de escribir. Si ya existen
marcadores T08, aborta: restaurar primero con --restore.

Uso: python3 ART_TOOLS/qa/apply_hub_tanda_08.py [--restore]
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HTML = ROOT / 'DEADBEAT_DISCO.ART.html'
PACK = ROOT / 'ART_PACK' / 'art_pack.js'
MOD = ROOT / 'ART_TOOLS' / 'qa' / 'hub_tanda_08_block.js'
PACKBLOCK = ROOT / 'ART_TOOLS' / 'qa' / 'hub_tanda_08_pack_block.js'
BK = Path('/tmp/t8')
BK.mkdir(exist_ok=True)

A_MOD = '      /* === TANDA07:END (módulo) ============================================= */\n'
A_CALL = '        T07.installHooks();\n'
A_PACK_END = '  /* === TANDA07:END · HUB7_* ================================================ */\n'
A_VER = "    version: 'fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02+hub-tanda03+hub-tanda05+hub-tanda06+hub-tanda07',\n"
A_CHAIN = """                    /* TANDA07:BEGIN · mismo load(), encadenado tras TANDA 06 */
                    loadHub7(function (k7) {
                      st.status = (st.errors.length || (st.archErrors || []).length ||
                                   (st.hubErrors || []).length || (st.hub2Errors || []).length ||
                                   (st.hub3Errors || []).length || (st.hub5Errors || []).length ||
                                   (st.hub6Errors || []).length || (st.hub7Errors || []).length)
                        ? 'applied-with-errors' : 'applied';
                      st.finishedAt = Date.now();
                    });
                    /* TANDA07:END */
"""
A_EXPORT = "    hub7Restore: hub7Restore, hub7Apply: hub7Apply, hub7Tag: hub7Tag,\n"

CHAIN_NEW = """                    /* TANDA07:BEGIN · mismo load(), encadenado tras TANDA 06 */
                    loadHub7(function (k7) {
                      /* TANDA08:BEGIN · mismo load(), encadenado tras TANDA 07 */
                      loadHub8(function (k8) {
                        st.status = (st.errors.length || (st.archErrors || []).length ||
                                     (st.hubErrors || []).length || (st.hub2Errors || []).length ||
                                     (st.hub3Errors || []).length || (st.hub5Errors || []).length ||
                                     (st.hub6Errors || []).length || (st.hub7Errors || []).length ||
                                     (st.hub8Errors || []).length)
                          ? 'applied-with-errors' : 'applied';
                        st.finishedAt = Date.now();
                      });
                      /* TANDA08:END */
                    });
                    /* TANDA07:END */
"""
CALL_NEW = (A_CALL +
            '        /* === TANDA08:BEGIN · FASE 3/4 · enganches ============================ */\n'
            '        T08.install();\n'
            '        /* === TANDA08:END · FASE 3/4 ======================================== */\n')
EXPORT_NEW = (A_EXPORT +
              '    hub8: hub8, hub8Manifest: function () { return JSON.parse(JSON.stringify(HUB8_ASSETS)); },\n'
              '    hub8Restore: hub8Restore, hub8Apply: hub8Apply, hub8Tag: hub8Tag,\n')


def backup(p: Path) -> None:
    dst = BK / (p.name.replace('.', '_') + '.PRE_T08')
    if not dst.exists():
        shutil.copy2(p, dst)
        print('backup:', dst, dst.stat().st_size, 'B')


def restore() -> None:
    for p, tag in ((HTML, 'DEADBEAT_DISCO_ART_html.PRE_T08'),
                   (PACK, 'art_pack_js.PRE_T08')):
        src = BK / tag
        if src.exists():
            shutil.copy2(src, p)
            print('restaurado:', p.name, p.stat().st_size, 'B')
    print('restore completo')


def main() -> int:
    if '--restore' in sys.argv:
        restore()
        return 0
    html = HTML.read_text(encoding='utf-8')
    pack = PACK.read_text(encoding='utf-8')
    mod = MOD.read_text(encoding='utf-8').rstrip('\n') + '\n'
    packblock = PACKBLOCK.read_text(encoding='utf-8').strip('\n') + '\n'

    if 'TANDA08:BEGIN' in html or 'TANDA08:BEGIN' in pack:
        raise SystemExit('Ya hay marcadores T08: use --restore antes de reaplicar')
    for name, text, anchor in (
        ('HTML módulo', html, A_MOD), ('HTML llamada', html, A_CALL),
        ('pack fin HUB7', pack, A_PACK_END), ('pack versión', pack, A_VER),
        ('pack cadena', pack, A_CHAIN), ('pack exports', pack, A_EXPORT),
    ):
        n = text.count(anchor)
        if n != 1:
            raise SystemExit(f'Ancla {name} con {n} coincidencias (esperada 1)')
    if 'T08.install();' in html or 'loadHub8(' in pack:
        raise SystemExit('Integración parcial detectada')

    backup(HTML); backup(PACK)

    # --- HTML: 2 inserciones ------------------------------------------------
    html = html.replace(A_MOD, A_MOD + mod, 1)
    html = html.replace(A_CALL, CALL_NEW, 1)
    # --- art_pack.js: 4 inserciones -----------------------------------------
    pack = pack.replace(A_PACK_END, A_PACK_END + packblock, 1)
    pack = pack.replace(A_VER, A_VER.replace('+hub-tanda07', '+hub-tanda07+hub-tanda08'), 1)
    pack = pack.replace(A_CHAIN, CHAIN_NEW, 1)
    pack = pack.replace(A_EXPORT, EXPORT_NEW, 1)

    HTML.write_text(html, encoding='utf-8')
    PACK.write_text(pack, encoding='utf-8')

    print('HTML :', HTML.stat().st_size, 'B,', html.count(chr(10)) + 1, 'líneas')
    print('PACK :', PACK.stat().st_size, 'B,', pack.count(chr(10)) + 1, 'líneas')
    for label, text in (('HTML', html), ('PACK', pack)):
        print(f'  {label}: TANDA08:BEGIN={text.count("TANDA08:BEGIN")} '
              f'END={text.count("TANDA08:END")}')
    assert html.count('TANDA08:BEGIN') == 2 and html.count('TANDA08:END') == 2
    assert pack.count('TANDA08:BEGIN') == 2 and pack.count('TANDA08:END') == 2
    print('6 inserciones aplicadas; T01–07 sin tocar')
    return 0


if __name__ == '__main__':
    sys.exit(main())
