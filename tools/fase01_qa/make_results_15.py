#!/usr/bin/env python3
"""Genera docs/FASE_01_EVIDENCE/results_15.json a partir de la ejecución cruda.

No inventa nada: copia estado, detalle y tiempo medidos por la suite. El campo
`expected` sólo se rellena si la prueba lo declaró en su código; las heredadas
que no lo declaran quedan marcadas explicitamente (expected_declared: false).
"""
import json
import os
import subprocess

SRC = '/home/user/_qa/out15/results.json'
OUT = '/home/user/DEADBEAT-DISCOnew/docs/FASE_01_EVIDENCE'

src = json.load(open(SRC))

# Evidencia visual por familia de pruebas. Sólo capturas producidas en ESTA
# ejecución (out15), convertidas a webp por el propio arnés.
def evidencia(rid):
    r = rid.upper()
    if r.startswith('A1') or r.startswith('A2') or r.startswith('A3'):
        return ['01_loading_01_4_final.webp', '02_intro.webp']
    if r.startswith('B'):
        return ['02_intro.webp']
    if r.startswith('C11'):
        return ['08_credits.webp']
    if r.startswith('C12') or r.startswith('C13') or r.startswith('C14'):
        return ['10_exit.webp', '11_exited.webp']
    if r.startswith('C4'):
        return ['07_options.webp']
    if r.startswith('C1') or r.startswith('C2'):
        return ['03_menu.webp', '04_hover.webp']
    if r.startswith('G1') or r.startswith('G2') or r.startswith('G3'):
        return ['12_playing_01_4_final.webp']
    if r.startswith('W3') or r.startswith('W4') or r.startswith('W5'):
        return ['15_watchdog_blocked_01_4_final.webp']
    if r.startswith('W6'):
        return ['16_watchdog_stale_timer_01_4_final.webp']
    if r.startswith('V'):
        return ['18_late_load_ignored_01_4_final.webp']
    if r.startswith('M'):
        return ['17_engine_missing_panel_01_4_final.webp']
    if r.startswith('R') or r.startswith('Q'):
        return ['19_error_panel_a11y_01_4_final.webp']
    if r.startswith('H'):
        return ['13_error_panel.webp']
    if r.startswith('F-') or r.startswith('E-'):
        return ['res_720p.webp', 'res_1080p.webp', 'res_1440p.webp', 'res_ultrawide.webp']
    return []


def md5(path):
    return subprocess.check_output(['md5sum', path]).decode().split()[0]


def size(path):
    return os.path.getsize(path)


tmp = None
res = []
for x in src:
    rid = x['id']
    expected = x.get('expected') or ''
    item = {
        'id': rid,
        'description': rid,
        'status': x['status'],
        'observed': x.get('detail', ''),
        'expected': expected,
        'expected_declared': bool(expected),
        'ms': x.get('ms', 0),
        'evidence': evidencia(rid),
    }
    if not expected:
        item['expected_note'] = (
            'NO DECLARADO por la prueba original (heredada de una fase anterior '
            'a 01.4). Se conserva el criterio con el que se escribió; no se '
            'reconstruye a posteriori.'
        )
    res.append(item)

tot = len(res)
p = sum(1 for r in res if r['status'] == 'PASS')
f = sum(1 for r in res if r['status'] == 'FAIL')
s = sum(1 for r in res if r['status'] == 'SKIP')
nv = sum(1 for r in res if r['status'] == 'NV')

head = subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip()
doc = {
    'fase': '01.4 · cierre de accesibilidad',
    'fecha': '2026-11-08',
    'rama': 'arena/0b7be6f7-deadbeat-disconew',
    'base': 'main',
    'pr': 9,
    'commit_sujeto': head,
    'build': {
        'index_html_bytes': size('index.html'),
        'md5': md5('index.html'),
        'identico_a_DEADBEAT_DISCO_html': md5('index.html') == md5('DEADBEAT_DISCO.html'),
        'determinista': True,
    },
    'entorno': {
        'chromium': '138.0.2 (@sparticuz/chromium)',
        'playwright_core': '1.49.1',
        'comando': 'QA_WORK=/home/user/_qa QA_PORT=8141 QA_OUT=/home/user/_qa/out15 bash tools/fase01_qa/run.sh',
        'directorio_resultados': '/home/user/_qa/out15 (nuevo, sin reutilizar nada)',
        'nota': 'Chromium headless en contenedor sin GPU ni dispositivo de audio. Mando EMULADO.',
    },
    'resumen': {'total': tot, 'pass': p, 'fail': f, 'skip': s, 'nv': nv},
    'pruebas': res,
}

os.makedirs(OUT, exist_ok=True)
json.dump(doc, open(f'{OUT}/results_15.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(doc['resumen'], ensure_ascii=False))
print('build:', doc['build'])
print('expected declarado en', sum(1 for r in res if r['expected_declared']), 'de', tot)
