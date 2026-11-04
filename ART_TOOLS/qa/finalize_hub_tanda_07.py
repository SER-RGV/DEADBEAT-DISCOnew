#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TANDA 07 · cierre documental (idempotente, NO regenera arte).

Verifica los 6 SHA-256 finales contra manifest.json, marca el manifest como
INTEGRADO_VALIDADO con la trazabilidad de integración y genera
ART_EVIDENCE/hub/tanda_07/report.json a partir de qa_tanda07.json.

Uso: python3 ART_TOOLS/qa/finalize_hub_tanda_07.py
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAN = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_07' / 'manifest.json'
EVI = ROOT / 'ART_EVIDENCE' / 'hub' / 'tanda_07'
QA = EVI / 'qa_tanda07.json'
REPORT = EVI / 'report.json'


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    man = json.loads(MAN.read_text(encoding='utf-8'))
    qa = json.loads(QA.read_text(encoding='utf-8'))
    if qa.get('verdict') != 'APROBADO':
        raise SystemExit('QA no APROBADO (' + str(qa.get('verdict')) + '): no se cierra.')

    hashes = []
    for a in man['assets']:
        f = ROOT / a['file']
        got = sha256(f) if f.exists() else None
        ok = got == a['sha256']
        hashes.append({'id': a['id'], 'alias': a['alias'], 'file': a['file'],
                       'sha256': got, 'expected': a['sha256'], 'ok': ok,
                       'bytes': f.stat().st_size if f.exists() else 0})
    bad = [h for h in hashes if not h['ok']]
    if bad:
        raise SystemExit('Hashes discrepantes: ' + json.dumps(bad, ensure_ascii=False))

    man['phase'] = 'FASE 2-5 · assets + integración + QA'
    man['status'] = 'INTEGRADO_VALIDADO'
    man['integratedAt'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
    man['integration'] = {
        'loader': 'ART_PACK/art_pack.js :: HUB7_ASSETS / loadHub7() tras loadHub6()',
        'registry': 'window.__DDM_V5_IMG[alias h07_*] (mismo load(), sin loader paralelo)',
        'renderer': 'DEADBEAT_DISCO.ART.html :: T07 en initDmoHubV35',
        'hooks': 'Wf (geografía/mundo), Ph (ambiental/mundo), zf (pantalla antes del HUD), Tf (estado)',
        'hookInstall': 'en tiempo de arranque desde buildHubSpace(); una sola vez',
        'flag': 'window.__DDM_HUB_T07 = false desactiva TODO lo nuevo',
        'version': 'fase1-...+hub-tanda06+hub-tanda07',
        'v5Keys': 168,
        'newSystems': 0,
        'audioModified': False,
        'cameraModified': False,
        'collisionsModified': False,
        'newCanvases': 0,
        'newRAF': 0,
        'phases': {
            '2': 'llegada breve (1,85 s / 0,95 s con movimiento reducido), sin transitionLock',
            '3': '6 actores NPC en 5 actividades sobre addHubCustomProp -> Lc -> Y-sort',
            '4': 'continuidad visual del descenso (pozo, luz, brasas) sobre floorDropAnim',
            '5': 'QA A/B + regresión'
        }
    }
    man['qa'] = {
        'suite': qa['suite'], 'report': 'ART_EVIDENCE/hub/tanda_07/qa_tanda07.json',
        'verdict': qa['verdict'], 'passed': qa['passed'], 'total': qa['total'],
        'harness': 'ART_TOOLS/qa/validate_hub_tanda_07.js',
        'screenshots': 'ART_EVIDENCE/hub/tanda_07/t07_qa_*.jpg'
    }
    MAN.write_text(json.dumps(man, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    report = {
        'tanda': '07', 'title': 'El umbral del infierno',
        'generatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'verdict': qa['verdict'], 'passed': qa['passed'], 'total': qa['total'],
        'fases': ['0 auditoría', '1 geografía', '2 llegada', '3 NPC', '4 descenso', '5 QA'],
        'assets': {'count': man['count'], 'allValid': man['allValid'],
                   'hashes': len(hashes), 'hashMismatches': len(bad),
                   'finals': [h['file'] for h in hashes]},
        'checks': [{'id': c['id'], 'ok': c['ok'], 'name': c['name']} for c in qa['checks']],
        'noVerificadoBloqueado': [
            'vídeo/captura en movimiento continuo', 'mando físico real',
            'audio audible (sólo se verifica el estado del secuenciador)',
            'inventario completo de frames NPC originales',
            'regresión formal completa de TANDA 01-06 (sólo smoke de carga/topología)',
            'rendimiento sostenido en producción con los 6 assets T07',
            'medición de latencia de llegada en hardware real'
        ],
        'git': {'branch': 'arena/109fe45c-deadbeat-disconew', 'pr': 1,
                'merge': False, 'main': 'd75e021fb13418bf49d5853c1a9583e7d11b90f2'}
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (EVI / 'hashes.json').write_text(json.dumps({
        'generatedAt': report['generatedAt'], 'files': len(hashes),
        'mismatches': len(bad), 'hashes': hashes
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('manifest:', man['status'], '| assets', man['count'], '| hashes', len(hashes), '/', len(bad), 'discrepancias')
    print('report:', REPORT.relative_to(ROOT), '| QA', qa['passed'], '/', qa['total'], qa['verdict'])


if __name__ == '__main__':
    main()
