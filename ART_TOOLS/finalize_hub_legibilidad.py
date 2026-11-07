#!/usr/bin/env python3
"""Cierre de la MODIFICACIÓN PRIORITARIA A–F.

Verifica integridad (nada ajeno tocado, 0 eliminaciones, JSON válidos,
sintaxis) y genera ART_EVIDENCE/hub/correccion/hashes.json.
"""
from __future__ import annotations
import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'ART_EVIDENCE' / 'hub' / 'correccion'
HTML = ROOT / 'DEADBEAT_DISCO.ART.html'
PACK = ROOT / 'ART_PACK' / 'art_pack.js'
BASE_HTML_SHA = '3e82dc77b9fd4c59d01e016628b204b1b07042c7f8f9085de3433141e5429011'
PACK_SHA = '330c9f46fd32e0f9782009252ea1380321e9e37a3e500e9fadf8869e914921c5'
MARKERS = ['/* === MODIFICACIÓN PRIORITARIA:INICIO',
           '/* === MODIFICACIÓN PRIORITARIA:CLIP:BEGIN',
           '/* === MODIFICACIÓN PRIORITARIA:CLIP:END',
           '        LEG.install();']


def sha(p: pathlib.Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main() -> int:
    errs = []
    html = HTML.read_text(encoding='utf-8')
    for m in MARKERS:
        if html.count(m) != 1:
            errs.append(f'marcador {m!r} aparece {html.count(m)} veces')
    if 'LEGIBILIDAD:TEST' in html:
        errs.append('quedan marcadores LEGIBILIDAD:TEST')
    if '__LEG_DEBUG' in html or '__ZF_DEBUG' in html or '__PIX_AT_CORRECTION' in html:
        errs.append('queda código de depuración temporal en el HTML')

    diff = subprocess.run(['git', 'diff', '--numstat', '--', 'DEADBEAT_DISCO.ART.html'],
                          cwd=ROOT, capture_output=True, text=True).stdout.strip()
    parts = diff.split()
    if len(parts) >= 2 and parts[1] != '0':
        errs.append(f'el HTML tiene eliminaciones: {diff}')

    pack_sha = sha(PACK)
    if pack_sha != PACK_SHA:
        errs.append(f'art_pack.js cambió: {pack_sha}')

    # base recuperable por --restore
    base = subprocess.run(['git', 'show',
                           '56dfd85df28f3ba29ff5dfee62b1d02c5ce09d6b:DEADBEAT_DISCO.ART.html'],
                          cwd=ROOT, capture_output=True).stdout
    if hashlib.sha256(base).hexdigest() != BASE_HTML_SHA:
        errs.append('la base recuperable no coincide con el SHA publicado')

    for j in sorted(OUT.glob('*.json')):
        try:
            json.loads(j.read_text(encoding='utf-8'))
        except Exception as e:
            errs.append(f'JSON inválido {j.name}: {e}')

    evid = sorted(p for p in OUT.iterdir()
                  if p.is_file() and p.name != 'hashes.json')
    extra = [ROOT / 'ART_TOOLS' / 'hub_legibilidad_block.js',
             ROOT / 'ART_TOOLS' / 'apply_hub_legibilidad.py',
             ROOT / 'ART_TOOLS' / 'qa' / 'hub_legibilidad_correccion_qa.js',
             ROOT / 'ART_TOOLS' / 'qa' / 'hub_legibilidad_metricas.py',
             ROOT / 'ART_TOOLS' / 'finalize_hub_legibilidad.py',
             ROOT / 'ART_CORRECCION_LEGIBILIDAD_HUB.md',
             ROOT / 'ART_AUDITORIA_LEGIBILIDAD_HUB.md',
             ROOT / 'ART_PROPUESTA_CORRECCION_PRECIPICIO.md']
    files = []
    for p in evid + extra:
        files.append({'path': str(p.relative_to(ROOT)), 'bytes': p.stat().st_size,
                      'sha256': sha(p)})
    data = {'generatedAt': __import__('datetime').datetime.now().isoformat(),
            'phase': 'MODIFICACIÓN PRIORITARIA A–F',
            'htmlInserciones': int(parts[0]) if parts else None,
            'htmlEliminaciones': int(parts[1]) if len(parts) > 1 else None,
            'artPackSha256': pack_sha,
            'htmlBaseSha256Recuperable': BASE_HTML_SHA,
            'totalFicheros': len(files), 'files': files,
            'errors': errs, 'ok': not errs}
    (OUT / 'hashes.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n',
                                     encoding='utf-8')
    print('diff HTML', diff, '| art_pack', pack_sha[:12],
          '| ficheros', len(files), '| errores', len(errs))
    for e in errs:
        print('  ERROR', e)
    return 0 if not errs else 1


if __name__ == '__main__':
    raise SystemExit(main())
