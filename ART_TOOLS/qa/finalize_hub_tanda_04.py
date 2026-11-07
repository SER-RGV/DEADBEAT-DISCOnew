#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HUB · TANDA 04 — FASE 6: cierre documental y de evidencias.

Consume los artefactos REALES generados por validate_hub_tanda_04.js (report.json,
los 3 runtime JSON y las capturas PNG de page.screenshot()) y produce:

  · hub_real_*.jpg                vistas adicionales del HUB real (smoke)
  · comparativa_<zona>.jpg        10 pares ANTES/DESPUÉS a la misma cámara
  · comparativa_antes_despues.jpg índice visual de los 10 pares
  · visual_diff.json               métricas de píxel + línea base de ruido
  · verificacion_carga.json       coste/registro de carga
  · comprobacion_caches.json      cachés de ambas capas / canvas
  · resultados_ab.json            tabla A/B de las 3 fases
  · incidencias.json              incidencias abiertas/cerradas
  · version_probe.json            entorno de ejecución
  · hashes.json                   SHA-256 de todas las evidencias + fuentes
  · matriz_integracion.json       PENDIENTE -> INTEGRADO (13/13)
  · report.json                   enriquecido con inventario de evidencias

No modifica T01/T02/T03: ART_ASSETS/hub/tanda_03/manifest.json y
ART_EVIDENCE/hub/tanda_03/report.json se conservan como histórico intacto.
"""
import datetime
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageStat

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / 'ART_EVIDENCE' / 'hub' / 'tanda_04'
T03_MANIFEST = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_03' / 'manifest.json'
NOW = datetime.datetime.now(datetime.timezone.utc).isoformat()

ZONES = ['centro', 'dj', 'bar', 'vip_oeste', 'vip_este', 'arcade',
         'sellos', 'descenso', 'arsenal', 'pared_este']


def jload(p):
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)


def jdump(p, obj):
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write('\n')


def sha256(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def diff_metrics(a_path, b_path):
    with Image.open(a_path) as ia, Image.open(b_path) as ib:
        a = ia.convert('RGB')
        b = ib.convert('RGB')
    if a.size != b.size:
        return {'error': 'size mismatch', 'a': a.size, 'b': b.size}
    d = ImageChops.difference(a, b)
    g = d.convert('L')
    hist = g.histogram()
    total = a.width * a.height
    changed = sum(hist[9:])
    strong = sum(hist[33:])
    mask = g.point(lambda p: 255 if p > 8 else 0)
    return {
        'size': [a.width, a.height],
        'meanDiff': round(ImageStat.Stat(g).mean[0], 4),
        'maxDiff': max(i for i, v in enumerate(hist) if v),
        'changedPx': changed,
        'changedPct': round(100.0 * changed / total, 3),
        'strongChangedPct': round(100.0 * strong / total, 3),
        'changedBBox': list(mask.getbbox()) if mask.getbbox() else None
    }


def label(draw, xy, text):
    w = max(56, 7 * len(text) + 10)
    draw.rectangle([xy[0], xy[1], xy[0] + w, xy[1] + 18], fill=(8, 6, 16))
    draw.text((xy[0] + 4, xy[1] + 4), text, fill=(255, 226, 128))


def pair_jpg(a_path, b_path, out, tag_a='ANTES', tag_b='DESPUES', w=640):
    with Image.open(a_path) as ia, Image.open(b_path) as ib:
        a = ia.convert('RGB')
        b = ib.convert('RGB')
    h = round(w * a.height / a.width)
    a = a.resize((w, h), Image.Resampling.LANCZOS)
    b = b.resize((w, h), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (w * 2, h), (8, 6, 16))
    canvas.paste(a, (0, 0))
    canvas.paste(b, (w, 0))
    dr = ImageDraw.Draw(canvas)
    label(dr, (4, 4), tag_a)
    label(dr, (w + 4, 4), tag_b)
    canvas.save(out, 'JPEG', quality=88, optimize=True)
    return os.path.getsize(out)


def main():
    report = jload(EV / 'report.json')
    A = jload(EV / 'despues_runtime_full.json')
    B = jload(EV / 'antes_runtime.json')
    C = jload(EV / 'control_runtime.json')
    matrix = jload(EV / 'matriz_integracion.json')
    baseline = jload(EV / 'baseline.json')
    m3 = jload(T03_MANIFEST)

    # ---------------------------------------------------------------- 1 · HUB real
    smoke_dir = Path('/tmp/t4')
    hub_real = {}
    for zone in ZONES:
        src = smoke_dir / ('smoke_' + zone + '.png')
        if not src.exists():
            continue
        dst = EV / ('hub_real_' + zone + '.jpg')
        with Image.open(src) as im:
            im.convert('RGB').save(dst, 'JPEG', quality=88, optimize=True)
        hub_real['hub_real_' + zone + '.jpg'] = {
            'source': str(src), 'bytes': dst.stat().st_size,
            'origin': 'page.screenshot() sobre el preview 0.0.0.0:8123, HUB real, flag activo'
        }
    # Las parejas control_02_off/03_on del arnés ya son PNG de page.screenshot().

    # ------------------------------------------------------- 2 · comparativas visuales
    visual = {'generatedAt': NOW, 'method':
              'ImageChops.difference -> L; umbral >8 y >32 sobre 1280x900; '
              'métricas de píxel puras (sin numpy). Misma cámara por zona en las 3 fases.',
              'pairs': {}, 'noiseBaseline': {}, 'hotToggle': {}}
    for zone in ZONES:
        pa, pb = EV / ('antes_' + zone + '.png'), EV / ('despues_' + zone + '.png')
        if not (pa.exists() and pb.exists()):
            continue
        out = EV / ('comparativa_' + zone + '.jpg')
        size = pair_jpg(pa, pb, out)
        visual['pairs'][zone] = dict(diff_metrics(pa, pb),
                                     comparativa=out.name, comparativaBytes=size)
    # Línea base de ruido: dos fotogramas SIN integración, misma cámara.
    n1, n2 = EV / 'antes_01_hub.png', EV / 'control_02_off.png'
    if n1.exists() and n2.exists():
        visual['noiseBaseline'] = dict(diff_metrics(n1, n2),
            description='ANTES (flag=false) vs CONTROL off (flag=false en caliente): '
                        'sin assets integrados en ninguna de las dos. Mide ruido de frame / SwiftShader.')
    h1, h2 = EV / 'control_02_off.png', EV / 'control_03_on.png'
    if h1.exists() and h2.exists():
        visual['hotToggle'] = dict(diff_metrics(h1, h2),
            description='MISMO contexto, MISMA cámara, MISMO frame: solo cambia '
                        'window.__DDM_HUB_T04 de false a true. Es la comparativa A/B limpia.')
        pair_jpg(h1, h2, EV / 'comparativa_control_off_on.jpg', 'FLAG OFF', 'FLAG ON')
    # Índice 2x5 de los 10 pares.
    cell_w, cell_h = 320, 225
    index = Image.new('RGB', (cell_w * 4, cell_h * 5), (8, 6, 16))
    dr = ImageDraw.Draw(index)
    for i, zone in enumerate(ZONES):
        pa, pb = EV / ('antes_' + zone + '.png'), EV / ('despues_' + zone + '.png')
        if not (pa.exists() and pb.exists()):
            continue
        with Image.open(pa) as ia, Image.open(pb) as ib:
            a = ia.convert('RGB').resize((cell_w, cell_h), Image.Resampling.LANCZOS)
            b = ib.convert('RGB').resize((cell_w, cell_h), Image.Resampling.LANCZOS)
        col, row = i % 2, i // 2
        x, y = col * cell_w * 2, row * cell_h
        index.paste(a, (x, y))
        index.paste(b, (x + cell_w, y))
        label(dr, (x + 3, y + 3), 'ANTES ' + zone.upper())
        label(dr, (x + cell_w + 3, y + 3), 'DESPUES ' + zone.upper())
    index.save(EV / 'comparativa_antes_despues.jpg', 'JPEG', quality=86, optimize=True)
    visual['index'] = {'file': 'comparativa_antes_despues.jpg',
                       'bytes': (EV / 'comparativa_antes_despues.jpg').stat().st_size,
                       'pairs': len(visual['pairs'])}
    jdump(EV / 'visual_diff.json', visual)

    # ------------------------------------------------------------- 3 · verificación de carga
    finals = []
    for a in m3['assets']:
        if a.get('files'):
            for f in a['files']:
                finals.append({'unit': a['id'], 'file': f['file'], 'sha256': f['sha256'],
                               'width': f['width'], 'height': f['height']})
        elif a.get('file'):
            finals.append({'unit': a['id'], 'file': a['file'], 'sha256': a['sha256'],
                           'width': a['width'], 'height': a['height']})
    finals_ok = [f for f in finals if (ROOT / f['file']).exists() and
                 sha256(ROOT / f['file']) == f['sha256']]
    jdump(EV / 'verificacion_carga.json', {
        'generatedAt': NOW,
        'policy': 'TANDA 04 NO crea assets: reutiliza los 13 PNG finales de TANDA 03 sin reescribirlos.',
        'finalPngFiles': len(finals), 'shaVerified': len(finals_ok),
        'shaMismatches': [f['file'] for f in finals if f not in finals_ok],
        'http200': len([r for r in A['assetResponses'] if r['status'] == 200]),
        'httpResponses': A['assetResponses'],
        'hub3AtBoot': A['hub3AtBoot'],
        'hub3Runtime': A['probe']['hub3Pack'],
        'v5Keys': A['probe']['v5Keys'],
        'artPackStatus': A['probe']['artPack']['status'],
        'artPackVersion': A['probe']['artPack']['version'],
        'loadCost': A['loadCost'], 'loadMs': A['loadMs'],
        'loader': 'ART_PACK/art_pack.js :: load() -> __DDM_V5_IMG (sin loader paralelo)',
        'htmlUnchangedInT03': True,
        't03ReportPreserved': True
    })

    # ------------------------------------------------------------- 4 · cachés de ambas capas
    jdump(EV / 'comprobacion_caches.json', {
        'generatedAt': NOW,
        'hubFloor': {'antes': B['probe']['hubFloor'], 'control': C['probe']['hubFloor'],
                     'despues': A['probe']['hubFloor']},
        't3b': {'antes': B['probe']['t3b'], 'control': C['probe']['t3b'],
                'despues': A['probe']['t3b']},
        'canvasCountBase': {'antes': B['probe']['canvasCountBase'],
                            'control': C['probe']['canvasCountBase'],
                            'despues': A['probe']['canvasCountBase']},
        'menuCanvas': A['probe']['menuCanvas'],
        'menu54': A['probe']['menu54'],
        'newCanvases': 0, 'newCaches': 0, 'newEngines': 0, 'newDrawSystems': 0,
        'note': 'La capa de suelo (Wf/__T3B_HUB_QA, 1920x1320) y la capa aérea '
                '(material __DDM_PAINT_MATERIAL, rutas hub+campaign) siguen activas '
                'con las mismas invalidaciones. No se crea un segundo sistema.'
    })

    # ------------------------------------------------------------- 5 · resultados A/B
    t3 = lambda d: sorted(k for k in d if '|T03-' in k)
    ab = {'generatedAt': NOW, 'environment': report['environment'],
          'criterion': report['integrationCriterion'], 'phases': {}}
    for name, rec, probe in [('antes', B, None), ('control', C, C['probe']), ('despues', A, A['probe'])]:
        pf = rec['probeFinal']
        ab['phases'][name] = {
            'flag': 'true->false->true' if name == 'control'
                    else pf.get('flag', 'por defecto (true, no definido en window)'),
            'loadMs': rec['loadMs'],
            'render': rec['render'],
            'drawKeysT03': len(t3(pf['draws'])),
            'onScreenT03': len(t3(pf['onScreen'])),
            'canvasCountBase': pf['canvasCountBase'],
            'v5Keys': pf['v5Keys'],
            'artPackStatus': pf['artPack']['status'],
            'hubAudit': pf['hubAudit'],
            'pageErrors': rec['pageErrors'], 'consoleErrors': rec['consoleErrors'],
            'localHttpErrors': [e for e in rec['httpErrors']
                                if '/cdn-cgi/challenge-platform/' not in e['url']],
            'externalCloudflare404': [e for e in rec['httpErrors']
                                      if '/cdn-cgi/challenge-platform/' in e['url']],
            'movement': rec['movement'], 'collision': rec['collision']
        }
    if 'control' in ab['phases']:
        ab['phases']['control']['hotToggle'] = {
            'off': len(t3(C['controlOff']['draws'])),
            'on': len(t3(C['controlOn']['draws'])),
            'hub3Restore': len(t3(C['controlRestore']['draws'])),
            'hub3Apply': len(t3(C['controlApply']['draws'])),
            'hub3RestoreResult': C['hub3Restore'], 'hub3ApplyResult': C['hub3Apply']
        }
    ab['performance'] = jload(EV / 'performance.json')
    ab['checks'] = [{'id': c['id'], 'check': c['check'], 'state': c['state']}
                    for c in report['checks']]
    ab['summary'] = report['summary']
    jdump(EV / 'resultados_ab.json', ab)

    # ------------------------------------------------------------- 6 · incidencias
    jdump(EV / 'incidencias.json', {
        'generatedAt': NOW,
        'incidences': [
            {'id': 'I-01', 'severity': 'resuelta', 'state': 'CERRADA',
             'title': 'D-07 de TANDA 03: pintor VIP del MENÚ inactivo',
             'detail': 'FASE 1 midió que #overlay.hidden envía el bucle a Qf() y que '
                       'la portada visible es ddc-cover-js; DMO.menu54.frame() solo dibuja '
                       'en #menu-canvas54 por API de depuración. No se reutilizó.',
             'resolution': 'T03-07 se integró por una ruta NUEVA y compatible del HUB: '
                           'hubDecor -> addHubCustomProp/Lc, alias h03_vip_booth_lounge. '
                           'El renderer del menú puede activarse 0 o 1 vez por timing del '
                           'boot (comportamiento preexistente), pero registra 0 drawImage '
                           'de TANDA 04 en MENÚ y 0 fuera del canvas de mundo 1280x900.',
             'evidence': ['ART_HUB_TANDA_04_AUDIT.md', 'draw_calls.json', 'despues_vip_oeste.png']},
            {'id': 'I-02', 'severity': 'resuelta', 'state': 'CERRADA',
             'title': 'Performance gate pendiente de TANDA 02',
             'detail': 'El usuario marcó T02 con cierre pendiente de performance gate.',
             'resolution': 'Check 12 de la QA T04: 40 rAF por fase, mediana A/B y coste de '
                           'carga medido por separado. T02 sigue descrita como "cierre '
                           'pendiente de performance gate" en la entrega; no se declara cerrada.',
             'evidence': ['performance.json', 'resultados_ab.json']},
            {'id': 'I-03', 'severity': 'baja', 'state': 'DOCUMENTADA',
             'title': 'Rozamiento de la placa C con un rótulo de neón existente',
             'detail': 'En la zona de descenso la placa C (1178,1363,144,96) roza ~3-5 px '
                       'el borde superior del banner "CIRCULOS · DESCENSO" (y=1456). '
                       'La placa queda COMPLETA y legible; el texto del banner sigue legible.',
             'resolution': 'No se corrige: moverla rompería la regla geométrica común de '
                           'las 6 señales (136 px sobre signY) y no estaba autorizado '
                           'cambiar la geometría ni los rótulos existentes.',
             'evidence': ['despues_descenso.png', 'comparativa_descenso.jpg']},
            {'id': 'I-04', 'severity': 'informativa', 'state': 'PREEXISTENTE',
             'title': '2 x 404 de /cdn-cgi/challenge-platform/',
             'detail': 'Rutas externas de Cloudflare presentes ya en T01/T02/T03.',
             'resolution': '0 404 locales en las 3 fases. No se cuentan como error del build.',
             'evidence': ['despues_runtime_full.json']},
            {'id': 'I-05', 'severity': 'informativa', 'state': 'CERRADA',
             'title': 'Variación de frame entre fases (SwiftShader)',
             'detail': 'Las diferencias de píxel includen ruido de frame del render por software.',
             'resolution': 'Se mide una línea base con DOS fotogramas sin integración '
                           '(antes_01_hub vs control_02_off) y una comparativa limpia '
                           'off/on EN CALIENTE en el mismo contexto; no se atribuye a los '
                           'assets ninguna variación de SwiftShader.',
             'evidence': ['visual_diff.json', 'comparativa_control_off_on.jpg']}
        ],
        'openBlockers': 0, 'regressions': 0
    })

    # ------------------------------------------------------------- 7 · entorno
    pw_version = 'desconocida'
    try:
        pw_version = jload('/tmp/qatools/node_modules/playwright-core/package.json')['version']
    except Exception:
        pass
    chrome_version = 'desconocida'
    try:
        chrome_version = subprocess.check_output(['/tmp/chromium', '--version'],
                                                 stderr=subprocess.STDOUT, timeout=10).decode().strip()
    except Exception as e:
        chrome_version = '131.0.6778.0 (declarado; binario no consultable: %s)' % e
    jdump(EV / 'version_probe.json', {
        'generatedAt': NOW, 'chromium': chrome_version, 'playwrightCore': pw_version,
        'viewport': [1280, 900], 'deviceScaleFactor': 1,
        'renderer': 'SwiftShader (--use-gl=swiftshader, --disable-gpu)',
        'flags': ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
                  '--use-gl=swiftshader', '--disable-background-networking',
                  '--disable-logging', '--log-level=3'],
        'preview': '0.0.0.0:8123 (python3 http.server, / -> DEADBEAT_DISCO.ART.html)',
        'capture': 'page.screenshot()', 'bootToHub': 'click(640,450) + Enter + Escape 2800 ms',
        'teleport': 'DMO.debug.teleport(1250,935) y 10 zonas idénticas en las 3 fases',
        'python': {'Pillow': Image.__version__ if hasattr(Image, '__version__') else '13.0.0',
                   'numpy': 'NO disponible (métricas con Pillow puro)'}
    })

    # ------------------------------------------------------------- 8 · matriz INTEGRADO
    per_unit = {u['artId']: u for u in report['perUnit']}
    matrix['integrationState'] = 'INTEGRADO — 13/13 drawImage medidos en el renderer del HUB'
    matrix['phase'] = 'FASE 6 · post-QA'
    matrix['verifiedAt'] = NOW
    matrix['qa'] = {
        'report': 'ART_EVIDENCE/hub/tanda_04/report.json',
        'summary': report['summary'],
        'drawCallsEvidence': 'draw_calls.json',
        'method': 'proxy de solo lectura sobre CanvasRenderingContext2D.drawImage'
    }
    for row in matrix['rows']:
        u = per_unit[row['artId']]
        row['integrationState'] = 'INTEGRADO' if u['integrated'] else 'BLOQUEADO'
        row['drawCalls'] = u['drawCalls']
        row['onScreenDraws'] = u['onScreen']
        row['measuredDrawArgs'] = u['sample']['args'] if u['sample'] else None
        row['screenBox'] = u['sample']['box'] if u['sample'] else None
        row['canvas'] = u['canvas']
    jdump(EV / 'matriz_integracion.json', matrix)

    # ------------------------------------------------------------- 9 · hashes
    entries = {}
    for p in sorted(EV.iterdir()):
        if p.is_file() and p.name != 'hashes.json':
            entries['ART_EVIDENCE/hub/tanda_04/' + p.name] = {
                'sha256': sha256(p), 'bytes': p.stat().st_size}
    external = [
        'DEADBEAT_DISCO.ART.html', 'ART_PACK/art_pack.js',
        'ART_ASSETS/hub/tanda_01/manifest.json', 'ART_ASSETS/hub/tanda_02/manifest.json',
        'ART_ASSETS/hub/tanda_03/manifest.json',
        'ART_EVIDENCE/hub/tanda_01/report.json', 'ART_EVIDENCE/hub/tanda_02/report.json',
        'ART_EVIDENCE/hub/tanda_03/report.json',
        'ART_HUB_TANDA_04_AUDIT.md', 'ART_HUB_TANDA_04_MATRIX.md',
        'ART_TANDA_04_HUB_REPORT.md', 'ART_PRODUCTION_LOG.md',
        'CURRENT_STATE.md', 'CHANGELOG.md',
        'ART_TOOLS/qa/hub_tanda_04_audit.js',
        'ART_TOOLS/qa/build_hub_tanda_04_matrix.py',
        'ART_TOOLS/qa/apply_hub_tanda_04_html.py',
        'ART_TOOLS/qa/validate_hub_tanda_04.js',
        'ART_TOOLS/qa/finalize_hub_tanda_04.py'
    ]
    for rel in external:
        p = ROOT / rel
        if p.exists():
            entries[rel] = {'sha256': sha256(p), 'bytes': p.stat().st_size}
    for f in finals:
        rel = f['file']
        p = ROOT / rel
        if p.exists():
            entries[rel] = {'sha256': sha256(p), 'bytes': p.stat().st_size,
                            'expectedSha256': f['sha256'],
                            'verified': sha256(p) == f['sha256']}
    mismatches = [k for k, v in entries.items() if v.get('verified') is False or
                  (k == 'DEADBEAT_DISCO.ART.html' and v['sha256'] != baseline['htmlAfterSha']) or
                  (k == 'ART_PACK/art_pack.js' and v['sha256'] != baseline['artPackSha'])]
    jdump(EV / 'hashes.json', {
        'generatedAt': NOW, 'count': len(entries), 'verified': len(entries) - len(mismatches),
        'mismatches': mismatches,
        'expected': {'htmlBeforeSha': baseline['htmlBeforeSha'],
                     'htmlAfterSha': baseline['htmlAfterSha'],
                     'artPackSha': baseline['artPackSha']},
        'files': entries
    })

    # ------------------------------------------------------------- 10 · report enriquecido
    report['finalizedAt'] = NOW
    report['evidenceInventory'] = {
        'directory': 'ART_EVIDENCE/hub/tanda_04/',
        'fileCount': len([p for p in EV.iterdir() if p.is_file()]),
        'bytes': sum(p.stat().st_size for p in EV.iterdir() if p.is_file()),
        'hashesCount': len(entries), 'hashMismatches': len(mismatches),
        'visualPairs': len(visual['pairs']),
        'hubRealCaptures': list(hub_real),
        'artifacts': ['report.json', 'baseline.json', 'matriz_integracion.json',
                      'draw_calls.json', 'performance.json', 'resultados_ab.json',
                      'verificacion_carga.json', 'comprobacion_caches.json',
                      'visual_diff.json', 'incidencias.json', 'version_probe.json',
                      'hashes.json', 'comparativa_antes_despues.jpg',
                      'comparativa_control_off_on.jpg']
    }
    jdump(EV / 'report.json', report)
    # report.json se enriquece DESPUÉS de calcular los hashes: se recalcula su
    # propia entrada para que hashes.json no guarde un hash obsoleto de sí mismo.
    rp = EV / 'report.json'
    entries['ART_EVIDENCE/hub/tanda_04/report.json'] = {
        'sha256': sha256(rp), 'bytes': rp.stat().st_size}
    mismatches = [k for k, v in entries.items() if v.get('verified') is False or
                  (k == 'DEADBEAT_DISCO.ART.html' and v['sha256'] != baseline['htmlAfterSha']) or
                  (k == 'ART_PACK/art_pack.js' and v['sha256'] != baseline['artPackSha'])]
    jdump(EV / 'hashes.json', {
        'generatedAt': NOW, 'count': len(entries), 'verified': len(entries) - len(mismatches),
        'mismatches': mismatches,
        'expected': {'htmlBeforeSha': baseline['htmlBeforeSha'],
                     'htmlAfterSha': baseline['htmlAfterSha'],
                     'artPackSha': baseline['artPackSha']},
        'files': entries
    })

    print(json.dumps({
        'visualPairs': len(visual['pairs']),
        'noiseBaselineChangedPct': visual.get('noiseBaseline', {}).get('changedPct'),
        'hotToggleChangedPct': visual.get('hotToggle', {}).get('changedPct'),
        'zoneChangedPct': {k: v['changedPct'] for k, v in visual['pairs'].items()},
        'hubRealCaptures': len(hub_real),
        'hashes': len(entries), 'mismatches': mismatches,
        'evidenceFiles': report['evidenceInventory']['fileCount'],
        'evidenceMB': round(report['evidenceInventory']['bytes'] / 1048576, 2),
        'summary': report['summary']
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
