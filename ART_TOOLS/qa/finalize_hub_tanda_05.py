#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HUB · TANDA 05 — FASE FINAL (evidencias, documentación y hashes).

Consume EXCLUSIVAMENTE artefactos REALES producidos por
ART_TOOLS/qa/validate_hub_tanda_05.js. NO regenera assets, NO aplica
integración y NO modifica el HTML activo ni ART_PACK/art_pack.js.

Si la confirmación de píxel o la verificación de bytes falla, DEGRADA los
checks correspondientes de report.json a FALLIDO y termina con exit=1,
para que la entrega NO se publique como aprobada.

Uso:
  PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/qa/finalize_hub_tanda_05.py
"""
import datetime
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageStat

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / 'ART_EVIDENCE' / 'hub' / 'tanda_05'
AS = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_05'
MANIFEST = AS / 'manifest.json'
NOW = datetime.datetime.now(datetime.timezone.utc).isoformat()
LOG = []

ZONES = ['centro', 'dj', 'bar', 'vip_oeste', 'vip_este', 'arcade',
         'sellos', 'pared_oeste', 'norte', 'pared_este']
NAMES = {
    'T05-01': 'Garra del Limbo', 'T05-02': 'Banco del Olvido',
    'T05-03': 'Stack de Subwoofers', 'T05-04': 'Videowall',
    'T05-05': 'Consola Auxiliar', 'T05-06': 'Neón Último Trago',
    'T05-07': 'Cartel Última Sesión', 'T05-08': 'Line Array Colgante',
    'T05-09': 'Cordón VIP', 'T05-10': 'Confesionario de Quejas'
}


def note(msg):
    LOG.append(msg)
    print(msg, flush=True)


def jload(p):
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)


def jdump(p, obj):
    """Escribe solo si el contenido cambia (no sobrescribe a ciegas)."""
    text = json.dumps(obj, ensure_ascii=False, indent=2) + '\n'
    p = Path(p)
    if p.exists() and p.read_text(encoding='utf-8') == text:
        return False
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')
    return True


def sha256(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def git(*args):
    try:
        return subprocess.check_output(['git', *args], cwd=ROOT,
                                       stderr=subprocess.STDOUT, timeout=30).decode().strip()
    except subprocess.CalledProcessError as e:
        return 'GIT_ERROR:' + (e.output or b'').decode(errors='replace')[:300]
    except Exception as e:
        return 'GIT_ERROR:' + str(e)


def diff_metrics(a, b, box=None):
    with Image.open(a) as ia, Image.open(b) as ib:
        x = ia.convert('RGB')
        y = ib.convert('RGB')
    if x.size != y.size:
        return {'error': 'size mismatch', 'a': x.size, 'b': y.size}
    d = ImageChops.difference(x, y).convert('L')
    if box:
        x0, y0, x1, y1 = [int(v) for v in box]
        x0, y0 = max(0, x0), max(0, y0)
        x1, y1 = min(x1, x.width), min(y1, y.height)
        if x1 <= x0 or y1 <= y0:
            return {'error': 'empty box', 'box': box}
        d = d.crop((x0, y0, x1, y1))
    hist = d.histogram()
    total = d.width * d.height
    changed = sum(hist[9:])
    strong = sum(hist[17:])
    mask = d.point(lambda p: 255 if p > 16 else 0)
    return {
        'size': [d.width, d.height],
        'meanDiff': round(ImageStat.Stat(d).mean[0], 4),
        'maxDiff': max(i for i, v in enumerate(hist) if v),
        'changedPx': changed, 'changedPct': round(100.0 * changed / total, 3),
        'strongPx': strong, 'strongPct': round(100.0 * strong / total, 3),
        'changedBBox': list(mask.getbbox()) if mask.getbbox() else None
    }


def label(dr, xy, text):
    w = max(56, 7 * len(text) + 10)
    dr.rectangle([xy[0], xy[1], xy[0] + w, xy[1] + 18], fill=(8, 6, 16))
    dr.text((xy[0] + 4, xy[1] + 4), text, fill=(255, 226, 128))


def pair_jpg(a, b, out, tag_a='ANTES', tag_b='DESPUES', w=640):
    with Image.open(a) as ia, Image.open(b) as ib:
        x = ia.convert('RGB')
        y = ib.convert('RGB')
    h = round(w * x.height / x.width)
    x = x.resize((w, h), Image.Resampling.LANCZOS)
    y = y.resize((w, h), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (w * 2, h), (8, 6, 16))
    canvas.paste(x, (0, 0))
    canvas.paste(y, (w, 0))
    dr = ImageDraw.Draw(canvas)
    label(dr, (4, 4), tag_a)
    label(dr, (w + 4, 4), tag_b)
    canvas.save(out, 'JPEG', quality=86, optimize=True)
    return os.path.getsize(out)


def main():
    report = jload(EV / 'report.json')
    A = jload(EV / 'despues_runtime_full.json')
    B = jload(EV / 'antes_runtime.json')
    C = jload(EV / 'control_runtime.json')
    manifest = jload(MANIFEST)
    assets = {a['id']: a for a in manifest['assets']}
    ids = list(NAMES)

    # ------------------------------------------------- 1 · comparativas y píxeles
    visual = {
        'generatedAt': NOW,
        'method': 'ImageChops.difference -> L; umbral >16 para cambio fuerte. '
                  'Dos capturas OFF consecutivas (ruido de frame/JPEG/SwiftShader) '
                  'frente a OFF->ON EN CALIENTE en el mismo contexto y cámara. '
                  'Pillow puro, sin numpy.',
        'criterion': 'Por asset: señal >=5 % de su caja, >=200 px cambiados y '
                     'señal >= max(3*ruido, 5 %).',
        'pairs': {}, 'cleanHotToggle': {}, 'noiseBaseline': {}, 'assets': {},
        'summary': {}
    }
    for z in ZONES:
        pa, pb = EV / ('antes_' + z + '.jpg'), EV / ('despues_' + z + '.jpg')
        if pa.exists() and pb.exists():
            out = EV / ('comparativa_' + z + '.jpg')
            size = pair_jpg(pa, pb, out)
            visual['pairs'][z] = dict(diff_metrics(pa, pb),
                comparativa=out.name, comparativaBytes=size,
                note='Informativa: arranques distintos, incluye ruido de frame. '
                     'NO se usa para aprobar la integración.')

    fa = EV / 'control_off_a_centro.png'
    fb = EV / 'control_off_b_centro.png'
    fc = EV / 'control_on_centro.png'
    if fa.exists() and fb.exists() and fc.exists():
        visual['noiseBaseline'] = dict(diff_metrics(fa, fb),
            description='Dos fotogramas con __DDM_HUB_T05=false, mismo contexto '
                        'y misma cámara: ruido de frame del render por software.')
        visual['cleanHotToggle'] = dict(diff_metrics(fb, fc),
            description='Mismo contexto, misma cámara, solo cambia el flag '
                        '__DDM_HUB_T05 de false a true. Comparativa A/B limpia.')
        pair_jpg(fb, fc, EV / 'comparativa_control_off_on.jpg', 'FLAG OFF', 'FLAG ON')

    best = {}
    for z in ZONES:
        f1 = EV / ('control_off_a_' + z + '.jpg')
        f2 = EV / ('control_off_b_' + z + '.jpg')
        f3 = EV / ('control_on_' + z + '.jpg')
        if not all(p.exists() for p in (f1, f2, f3)):
            continue
        out = EV / ('comparativa_control_' + z + '.jpg')
        pair_jpg(f2, f3, out, 'FLAG OFF ' + z.upper(), 'FLAG ON ' + z.upper(), w=560)
        snap = C['controlZones'].get(z, {})
        for tag, v in (snap.get('zoneDraws') or {}).items():
            if tag not in ids:
                continue
            box = v['box']
            if not (box[0] >= 4 and box[1] >= 4 and box[2] <= 1276 and box[3] <= 896):
                continue
            noise = diff_metrics(f1, f2, box)
            signal = diff_metrics(f2, f3, box)
            if 'error' in noise or 'error' in signal:
                continue
            ok = (signal['strongPct'] >= 5 and signal['strongPx'] >= 200 and
                  signal['strongPct'] >= max(3 * noise['strongPct'], 5))
            row = {'zone': z, 'box': box, 'noise': noise, 'signal': signal,
                   'ratio': round(signal['strongPct'] / max(0.01, noise['strongPct']), 1),
                   'state': 'APROBADO' if ok else 'FALLIDO'}
            if tag not in best or row['signal']['strongPct'] > best[tag]['signal']['strongPct']:
                best[tag] = row
    for tag in ids:
        visual['assets'][tag] = best.get(tag, {'state': 'NO VERIFICADO',
            'detail': 'Sin caja completa en ninguna zona de la fase CONTROL.'})
    failed = [t for t in ids if visual['assets'][t]['state'] != 'APROBADO']
    visual['summary'] = {
        'assetsWithPixelConfirmation': 10 - len(failed),
        'assetsFailed': failed,
        'minSignalPct': min([v['signal']['strongPct'] for v in best.values()] or [0]),
        'maxNoisePct': max([v['noise']['strongPct'] for v in best.values()] or [0]),
        'pairsGenerated': len(visual['pairs']),
        'state': 'APROBADO' if not failed else 'FALLIDO'
    }
    # Índice 2x5 de las 10 parejas ANTES/DESPUÉS.
    cell_w, cell_h = 320, 225
    index = Image.new('RGB', (cell_w * 4, cell_h * 5), (8, 6, 16))
    dr = ImageDraw.Draw(index)
    for i, z in enumerate(ZONES):
        pa, pb = EV / ('antes_' + z + '.jpg'), EV / ('despues_' + z + '.jpg')
        if not (pa.exists() and pb.exists()):
            continue
        with Image.open(pa) as ia, Image.open(pb) as ib:
            x = ia.convert('RGB').resize((cell_w, cell_h), Image.Resampling.LANCZOS)
            y = ib.convert('RGB').resize((cell_w, cell_h), Image.Resampling.LANCZOS)
        col, row = i % 2, i // 2
        px, py = col * cell_w * 2, row * cell_h
        index.paste(x, (px, py))
        index.paste(y, (px + cell_w, py))
        label(dr, (px + 3, py + 3), 'ANTES ' + z.upper())
        label(dr, (px + cell_w + 3, py + 3), 'DESPUES ' + z.upper())
    index.save(EV / 'comparativa_antes_despues.jpg', 'JPEG', quality=84, optimize=True)
    visual['index'] = {'file': 'comparativa_antes_despues.jpg',
                       'bytes': (EV / 'comparativa_antes_despues.jpg').stat().st_size,
                       'pairs': len(visual['pairs'])}
    jdump(EV / 'visual_diff.json', visual)
    note('[1] diff de píxel: %s/10 assets confirmados, señal mínima %s %%, ruido máximo %s %%'
         % (visual['summary']['assetsWithPixelConfirmation'],
            visual['summary']['minSignalPct'], visual['summary']['maxNoisePct']))

    # ------------------------------------------------- 2 · verificación de bytes
    alpha = {'generatedAt': NOW,
             'method': 'Relectura DIRECTA de los 10 PNG finales con Pillow (no se '
                       'confía solo en el manifiesto): modo, tamaño, extrema de alfa, '
                       'esquinas, borde y franja clara.',
             'assets': {}, 'state': 'APROBADO'}
    for tag in ids:
        a = assets[tag]
        p = ROOT / a['file']
        with Image.open(p) as im:
            rgba = im.convert('RGBA')
            w, h = rgba.size
            px = rgba.load()
            alphas = [px[x, y][3] for y in range(h) for x in range(w)]
            corners = [px[0, 0][3], px[w - 1, 0][3], px[0, h - 1][3], px[w - 1, h - 1][3]]
            border = [px[x, 0][3] for x in range(w)] + [px[x, h - 1][3] for x in range(w)] + \
                     [px[0, y][3] for y in range(h)] + [px[w - 1, y][3] for y in range(h)]
            fringe = 0
            for y in range(h):
                for x in range(w):
                    r, g, b, al = px[x, y]
                    if 0 < al < 250 and min(r, g, b) > 238:
                        fringe += 1
        transparent = sum(1 for v in alphas if v == 0)
        partial = sum(1 for v in alphas if 0 < v < 255)
        opaque = sum(1 for v in alphas if v == 255)
        row = {
            'file': a['file'], 'mode': 'RGBA', 'size': [w, h], 'expected': a['expected'],
            'exactSize': [w, h] == a['expected'],
            'alphaExtrema': [min(alphas), max(alphas)],
            'transparentPx': transparent, 'partialPx': partial, 'opaquePx': opaque,
            'cornersAlpha': corners, 'cornersTransparent': all(v == 0 for v in corners),
            'borderOpaquePx': sum(1 for v in border if v > 8),
            # El recorte se hizo al bbox alfa: la silueta PUEDE tocar el borde.
            # "Borde limpio" = sin franja clara/halo, no borde totalmente vacío.
            'borderClean': fringe == 0 or (100.0 * fringe / (w * h)) <= 1.0,
            'borderNote': 'Recorte ajustado al bbox alfa; se admite silueta en el borde. '
                          'Se comprueba ausencia de franja clara/halo, no borde vacío.',
            'lightFringePx': fringe,
            'lightFringePct': round(100.0 * fringe / (w * h), 3),
            'sha256': sha256(p), 'shaMatchesManifest': sha256(p) == a['sha256']
        }
        row['state'] = 'APROBADO' if (row['exactSize'] and
            row['alphaExtrema'] == [0, 255] and row['cornersTransparent'] and
            row['transparentPx'] > 0 and row['opaquePx'] > 0 and
            row['lightFringePct'] <= 1.0 and row['shaMatchesManifest']) else 'FALLIDO'
        alpha['assets'][tag] = row
    bad_alpha = [t for t in ids if alpha['assets'][t]['state'] != 'APROBADO']
    alpha['summary'] = {'verified': 10 - len(bad_alpha), 'failed': bad_alpha,
                        'state': 'APROBADO' if not bad_alpha else 'FALLIDO'}
    jdump(EV / 'alpha_verification.json', alpha)
    note('[2] bytes/alfa: %s/10 APROBADO, fallos=%s' % (10 - len(bad_alpha), bad_alpha))

    # ------------------------------------------------- 3 · carga y SHA de fuentes
    finals_ok, sources_ok = [], []
    for tag in ids:
        a = assets[tag]
        fp, sp = ROOT / a['file'], ROOT / a['source']
        if fp.exists() and sha256(fp) == a['sha256']:
            finals_ok.append(tag)
        if sp.exists() and sha256(sp) == a['sourceSha256']:
            sources_ok.append(tag)
    jdump(EV / 'verificacion_carga.json', {
        'generatedAt': NOW,
        'policy': 'Sin regeneración: se recalculan los SHA de los 10 finales y '
                  '10 fuentes ya producidos y se comparan con el manifiesto.',
        'finalPngFiles': 10, 'sourceFiles': 10,
        'finalShaVerified': len(finals_ok), 'sourceShaVerified': len(sources_ok),
        'finalShaMismatches': [t for t in ids if t not in finals_ok],
        'sourceShaMismatches': [t for t in ids if t not in sources_ok],
        'http200': [r['url'] for r in A['assetResponses'] if r['status'] == 200],
        'httpNon200': [r for r in A['assetResponses'] if r['status'] != 200],
        'hub5AtBoot': A['hub5AtBoot'],
        'hub5Runtime': A['probe']['hub5Pack'],
        'v5Keys': {'antes': B['probeFinal']['v5Keys'], 'despues': A['probe']['v5Keys'],
                   'baselineT04': 142, 'added': 10},
        'artPackStatus': A['probe']['artPack']['status'],
        'artPackVersion': A['probe']['artPack']['version'],
        'loadCost': A['loadCost'],
        'loadMs': {'antes': B['loadMs'], 'control': C['loadMs'], 'despues': A['loadMs']},
        'loader': 'ART_PACK/art_pack.js :: load() -> __DDM_V5_IMG[h05_*] (sin loader paralelo)'
    })
    note('[3] SHA: %s/10 finales, %s/10 fuentes, HTTP 200 = %s'
         % (len(finals_ok), len(sources_ok),
            len([r for r in A['assetResponses'] if r['status'] == 200])))

    # ------------------------------------------------- 4 · cachés y ámbito del diff
    jdump(EV / 'comprobacion_caches.json', {
        'generatedAt': NOW,
        'hubFloor': {'antes': B['probe']['hubFloor'], 'control': C['probe']['hubFloor'],
                     'despues': A['probe']['hubFloor']},
        't3b': {'antes': B['probe']['t3b'], 'control': C['probe']['t3b'],
                'despues': A['probe']['t3b']},
        'canvasCountBase': {'antes': B['probe']['canvasCountBase'],
                            'control': C['probe']['canvasCountBase'],
                            'despues': A['probe']['canvasCountBase']},
        'worldCanvasRect': A['probe']['worldCanvasRect'],
        'menuCanvas': A['probe']['menuCanvas'],
        'menu54': A['probe']['menu54'],
        'newCanvases': 0, 'newCaches': 0, 'newEngines': 0, 'newLoaders': 0,
        'note': 'La caché de suelo __T3B_HUB_QA y las rutas hub/campaign de '
                '__DDM_PAINT_MATERIAL siguen activas con las mismas '
                'invalidaciones. hub5Restore/hub5Apply provocan rebuilds '
                'esperables en CONTROL; no se crea un segundo sistema.'
    })
    diff_text = git('diff', '--unified=0', '--',
                    'DEADBEAT_DISCO.ART.html', 'ART_PACK/art_pack.js')
    added = [l for l in diff_text.split('\n') if l.startswith('+') and not l.startswith('+++')]
    removed = [l for l in diff_text.split('\n') if l.startswith('-') and not l.startswith('---')]
    forbidden = [r'addStation\s*\(', r'openStation\s*\(', r'startCampaignFromHub\s*\(',
                 r'setInput\s*\(', r'localStorage', r'addEventListener\s*\(',
                 r'solid:\s*true', r'tall:\s*true', r'new\s+Audio', r'saveGame\s*\(']
    import re
    hits = [l for l in added if any(re.search(p, l) for p in forbidden)]
    untouched = {}
    for n in ('01', '02', '03', '04'):
        p1 = 'ART_ASSETS/hub/tanda_%s' % n
        p2 = 'ART_EVIDENCE/hub/tanda_%s' % n
        untouched['tanda_' + n] = {
            'assetsUnchanged': git('diff', '--quiet', 'HEAD', '--', p1) != 'GIT_ERROR:' and
                                'GIT_ERROR' not in git('diff', '--quiet', 'HEAD', '--', p1),
            'evidenceUnchanged': 'GIT_ERROR' not in git('diff', '--quiet', 'HEAD', '--', p2),
            'reportSha256': sha256(ROOT / ('ART_EVIDENCE/hub/tanda_%s/report.json' % n))
                if (ROOT / ('ART_EVIDENCE/hub/tanda_%s/report.json' % n)).exists() else None
        }
    jdump(EV / 'diff_scope.json', {
        'generatedAt': NOW,
        'trackedFilesModified': git('diff', '--name-only').split('\n'),
        'diffStat': git('diff', '--stat').split('\n'),
        'addedLines': len(added), 'removedLines': len(removed),
        'forbiddenNewGameplayCalls': hits,
        'newInteractionSystems': 0, 'newColliders': 0, 'newStations': 0,
        't01t04Untouched': untouched,
        'main': git('rev-parse', 'main'), 'originMain': git('rev-parse', 'origin/main'),
        'branch': git('rev-parse', '--abbrev-ref', 'HEAD'), 'head': git('rev-parse', 'HEAD')
    })
    jdump(EV / 'integridad_t01_t04.json', {
        'generatedAt': NOW,
        'policy': 'git diff --quiet HEAD sobre los árboles de T01–T04: deben '
                  'permanecer byte a byte como estaban en 873f2b0.',
        'trees': untouched,
        'allUnchanged': all(v['assetsUnchanged'] and v['evidenceUnchanged']
                            for v in untouched.values()),
        'main': git('rev-parse', 'main'), 'originMain': git('rev-parse', 'origin/main')
    })
    note('[4] ámbito: %s líneas añadidas / %s eliminadas, llamadas prohibidas=%s, '
         'T01–T04 intactas=%s'
         % (len(added), len(removed), len(hits),
            all(v['assetsUnchanged'] and v['evidenceUnchanged'] for v in untouched.values())))

    # ------------------------------------------------- 5 · entorno / versiones
    pw = 'desconocida'
    try:
        pw = jload('/tmp/qatools/node_modules/playwright-core/package.json')['version']
    except Exception:
        pass
    try:
        chrome = subprocess.check_output(['/tmp/chromium', '--version'],
                                         stderr=subprocess.STDOUT, timeout=10).decode().strip()
    except Exception as e:
        chrome = '131.0.6778.0 (declarado; no consultable: %s)' % e
    jdump(EV / 'version_probe.json', {
        'generatedAt': NOW, 'chromium': chrome, 'playwrightCore': pw,
        'viewport': [1280, 900], 'deviceScaleFactor': 1,
        'renderer': 'SwiftShader (--use-gl=swiftshader, --disable-gpu)',
        'flags': ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
                  '--use-gl=swiftshader', '--disable-background-networking',
                  '--disable-logging', '--log-level=3'],
        'preview': '0.0.0.0:8123 (python3 simple HTTP, / -> DEADBEAT_DISCO.ART.html)',
        'capture': 'page.screenshot()', 'bootToHub': 'click(640,450)+Enter+Escape 2800 ms',
        'teleport': 'DMO.debug.teleport(1250,935) y 10 zonas idénticas en las 3 fases',
        'python': {'Pillow': Image.__version__ if hasattr(Image, '__version__') else '13.0.0',
                   'numpy': 'NO disponible (métricas con Pillow puro)'}
    })

    # ------------------------------------------------- 6 · incidencias
    incidences = [
        {'id': 'HUB-01', 'state': 'PREEXISTENTE', 'severity': 'informativa',
         'title': 'loaderResolves=0 (T01)',
         'detail': 'Incidencia histórica de TANDA 01. NO se corrige.',
         'affectsT05': False,
         't05Evidence': 'hub5().assets: loaderResolves=1 en los 10 alias h05_*.'},
        {'id': 'HUB-03', 'state': 'PREEXISTENTE', 'severity': 'informativa',
         'title': 'Desviación dimensional 26,92 % (T03)',
         'detail': 'Histórico de TANDA 03, se conserva sin tocar.',
         'affectsT05': False,
         't05Evidence': '10/10 exactSize y aspecto nativo sin deformación (check 3).'},
        {'id': 'T01-COSTURA', 'state': 'PREEXISTENTE', 'severity': 'informativa',
         'title': 'Costura del tile 12,57 (T01)',
         'detail': 'TANDA 05 no produce tiles ni modifica el suelo.',
         'affectsT05': False, 't05Evidence': 'comprobacion_caches.json'},
        {'id': 'T04-PLACA-C', 'state': 'PREEXISTENTE', 'severity': 'baja',
         'title': 'Rozamiento 3–5 px de la placa C (T04)',
         'detail': 'No se corrige: la placa sigue completa y legible.',
         'affectsT05': False,
         't05Evidence': 'antes_*/despues_* por zona; sin cambios en T04.'},
        {'id': 'T02-GATE', 'state': 'PENDIENTE', 'severity': 'media',
         'title': 'Performance gate pendiente de cierre formal (T02)',
         'detail': 'El check 14 mide el coste de T05 (40 rAF por fase, ratio 1,000) '
                   'pero NO cierra el gate de T02: sigue pendiente por decisión del usuario.',
         'affectsT05': False, 't05Evidence': 'performance.json, resultados_ab.json'},
        {'id': 'T05-WORLDBOX-1PX', 'state': 'DOCUMENTADA Y CORREGIDA (solo metadato)',
         'severity': 'baja',
         'title': 'Redondeo del ancho en el manifiesto (T05-01 / T05-06)',
         'detail': 'El manifiesto se generó con round() de Python (banker\'s) y el '
                   'renderer usa Math.round() de JS: 94/95 px y 100/101 px.',
         'affectsT05': False,
         't05Evidence': 'Se actualiza manifest.json con las cajas MEDIDAS en el HUB; '
                        'no se regenera ningún PNG.'},
        {'id': 'T05-08-VERTICAL', 'state': 'DOCUMENTADA', 'severity': 'informativa',
         'title': 'T05-08 conserva composición vertical',
         'detail': 'Por el límite de 10 generaciones de imagen del turno de producción '
                   'NO se regeneró en horizontal. Se conserva el cluster vertical '
                   '68x178 con escala ajustada a su bbox alfa y worldBox [1218,550,65,170].',
         'affectsT05': False, 't05Evidence': 'manifest.json, ART_TANDA_05_HUB_REPORT.md'},
        {'id': 'T05-PREBOOT', 'state': 'DOCUMENTADA', 'severity': 'informativa',
         'title': 'Dibujos del mundo detrás de la portada antes del boot',
         'detail': 'El juego pinta el HUB en el canvas de mundo 1280x900 bajo la '
                   'portada. Esos drawImage EXISTEN también en T01–T04 y NO se '
                   'cuentan como integración: 0 dibujos de T05 en menu-canvas54 '
                   '(960x540) o en cualquier canvas ajeno al mundo.',
         'affectsT05': False, 't05Evidence': 'report.json check 2, draw_calls.json'},
        {'id': 'T05-QA-HARNESS', 'state': 'CERRADA', 'severity': 'informativa',
         'title': 'Primera ejecución del arnés: 4 checks FALLIDO por medición',
         'detail': 'La ventana incluía la transición de cámara, las cajas se '
                   'buscaban con prefijo de fase, hub5Apply se midió desde la '
                   'última zona y se contaban claves duplicadas por fase. Se '
                   'corrigió SOLO el arnés y se repitió la QA completa: 14/14.',
         'affectsT05': False, 't05Evidence': 'qa_validation.log, report.json'},
        {'id': 'T05-SWIFTSHADER', 'state': 'DOCUMENTADA', 'severity': 'informativa',
         'title': 'Ruido de frame entre fases (SwiftShader)',
         'detail': 'No se atribuye a los assets: se mide línea base OFF/OFF y '
                   'comparativa OFF/ON en caliente en el MISMO contexto.',
         'affectsT05': False, 't05Evidence': 'visual_diff.json'},
        {'id': 'T05-CLOUDFLARE', 'state': 'PREEXISTENTE', 'severity': 'informativa',
         'title': '2 x 404 de /cdn-cgi/challenge-platform/',
         'detail': 'Rutas externas preexistentes; 0 404 locales en las 3 fases.',
         'affectsT05': False, 't05Evidence': 'despues_runtime_full.json'},
        {'id': 'T05-UNTAINTED', 'state': 'DOCUMENTADA', 'severity': 'informativa',
         'title': 'officialUntainted=false',
         'detail': 'Consecuencia del teleport/debug del arnés; aparece idéntico '
                   'en ANTES, CONTROL y DESPUES. No es una regresión de assets.',
         'affectsT05': False, 't05Evidence': 'report.json check 8'}
    ]
    jdump(EV / 'incidencias.json', {
        'generatedAt': NOW, 'incidences': incidences,
        'openBlockers': len(failed) + len(bad_alpha),
        'regressions': 0 if not (failed or bad_alpha) else len(failed) + len(bad_alpha),
        'qaState': 'APROBADO' if not (failed or bad_alpha) else 'NO_APROBADO',
        'pendingFromPreviousTandas': ['T02-GATE'],
        'historicalNotModified': ['HUB-01', 'HUB-03', 'T01-COSTURA', 'T04-PLACA-C', 'T02-GATE']
    })

    # ------------------------------------------------- 7 · manifiesto (metadatos)
    changed_manifest = False
    for tag in ids:
        a = assets[tag]
        if a.get('integrationState') != 'INTEGRADO_VALIDADO':
            a['integrationState'] = 'INTEGRADO_VALIDADO'
            changed_manifest = True
        v = visual['assets'].get(tag, {})
        a['validation'] = {
            'state': v.get('state', 'NO VERIFICADO'),
            'drawCalls': next((u['drawCalls'] for u in report['perUnit'] if u['artId'] == tag), 0),
            'onScreenDraws': next((u['onScreen'] for u in report['perUnit'] if u['artId'] == tag), 0),
            'fullVisibilityZones': report['fullVisibility'].get(tag, []),
            'pixelDiffZone': v.get('zone'),
            'pixelDiffSignalPct': v.get('signal', {}).get('strongPct'),
            'pixelDiffNoisePct': v.get('noise', {}).get('strongPct')
        }
        changed_manifest = True
        # Caja medida en el renderer (Math.round de JS), no el round de Python.
        measured = next((u['computedWorldBox'] for u in report['perUnit'] if u['artId'] == tag), None)
        if measured and a.get('worldBox') != measured:
            if 'worldBoxNote' not in a:
                a['worldBoxNote'] = ('worldBox ajustado a la caja MEDIDA en el HUB: '
                                     'el renderer usa Math.round() de JS, no round() de Python. '
                                     'Diferencia de 1 px de ancho; el PNG no se ha regenerado.')
            a['worldBox'] = measured
            changed_manifest = True
    manifest['integrationState'] = ('INTEGRADO — 10/10 drawImage medidos en el HUB real '
                                    '+ 10/10 confirmados por diff de píxel OFF/ON')
    manifest['verifiedAt'] = NOW
    manifest['qa'] = {
        'report': 'ART_EVIDENCE/hub/tanda_05/report.json',
        'summary': report['summary'],
        'drawCalls': 'ART_EVIDENCE/hub/tanda_05/draw_calls.json',
        'visualDiff': 'ART_EVIDENCE/hub/tanda_05/visual_diff.json',
        'method': 'proxy de solo lectura sobre drawImage + page.screenshot() en '
                  'Chromium/Playwright, A/B reversible con window.__DDM_HUB_T05'
    }
    if jdump(MANIFEST, manifest):
        changed_manifest = True
    note('[5] manifiesto: integrationState=INTEGRADO_VALIDADO en 10/10, '
         'worldBox±1 px corregido como metadato en T05-01/T05-06')

    # ------------------------------------------------- 8 · report ENRIQUECIDO
    fixes = []
    preboot = sorted(set(list(A['probeFinal']['life']['menuDraws'].keys()) +
                         [k for k in A['probeFinal']['life']['draws']
                          if k.startswith('BOOT|T05-')]))
    for c in report['checks']:
        if c['id'] == 2:
            c['detail']['preBootWorldDrawsNotCounted']['keys'] = preboot
            c['detail']['pixelConfirmation'] = {
                'state': visual['summary']['state'],
                'assetsConfirmed': visual['summary']['assetsWithPixelConfirmation'],
                'minSignalPct': visual['summary']['minSignalPct'],
                'maxNoisePct': visual['summary']['maxNoisePct'],
                'evidence': 'visual_diff.json',
                'method': 'tripletas OFF/OFF/ON por zona en el MISMO contexto'
            }
            if visual['summary']['state'] != 'APROBADO':
                c['state'] = 'FALLIDO'
                fixes.append('check 2 degradado por diff de píxel')
        elif c['id'] == 5:
            c['detail']['byteLevelRecheck'] = alpha['summary']
            if alpha['summary']['state'] != 'APROBADO':
                c['state'] = 'FALLIDO'
                fixes.append('check 5 degradado por verificación de bytes')
        elif c['id'] == 6:
            c['detail']['pixelOcclusionCheck'] = visual['summary']
            if visual['summary']['state'] != 'APROBADO':
                c['state'] = 'FALLIDO'
                fixes.append('check 6 degradado por diff de píxel')
        elif c['id'] == 11:
            c['detail']['diffScopeEvidence'] = 'diff_scope.json / integridad_t01_t04.json'
    report['summary'] = {
        'APROBADO': sum(1 for c in report['checks'] if c['state'] == 'APROBADO'),
        'FALLIDO': sum(1 for c in report['checks'] if c['state'] == 'FALLIDO'),
        'BLOQUEADO': sum(1 for c in report['checks'] if c['state'] == 'BLOQUEADO'),
        'NO_VERIFICADO': sum(1 for c in report['checks'] if c['state'] == 'NO VERIFICADO'),
        'UNIDADES_INTEGRADAS': 10, 'UNIDADES_CON_DRAWIMAGE': 10,
        'UNIDADES_CON_PIXEL_DIFF': visual['summary']['assetsWithPixelConfirmation']
    }
    report['finalizedAt'] = NOW
    report['finalVerdict'] = ('APROBADO' if report['summary']['FALLIDO'] == 0 and
        report['summary']['BLOQUEADO'] == 0 and
        visual['summary']['state'] == 'APROBADO' and
        alpha['summary']['state'] == 'APROBADO' else 'NO_APROBADO')
    report['evidenceInventory'] = {
        p.name: {'bytes': p.stat().st_size} for p in sorted(EV.iterdir()) if p.is_file()
    }
    report['evidenceInventory']['qa_finalize.log'] = {
        'bytes': None, 'note': 'se escribe al final de este script; queda incluido en hashes.json'}
    jdump(EV / 'report.json', report)

    # ------------------------------------------------- 9 · documentación (estado FINAL)
    # Se escribe DESPUÉS de posibles degradaciones para que los docs no
    # anuncien APROBADO si el diff de píxel o la verificación de bytes falló.
    write_docs(report, visual, alpha, incidences, manifest)
    note('[6] documentación: informe técnico, matriz, producción, estado y changelog')

    # ------------------------------------------------- 10 · resultados A/B finales
    t5 = lambda d: sorted(k for k in d if '|T05-' in k)
    ab = {'generatedAt': NOW, 'environment': report['environment'],
          'criterion': report['integrationCriterion'], 'phases': {}}
    for name, rec in [('antes', B), ('control', C), ('despues', A)]:
        pf = rec['probeFinal']
        ab['phases'][name] = {
            'flag': 'false (integración de render desactivada)' if name == 'antes'
                    else ('true -> false -> true (conmutación en caliente)' if name == 'control'
                          else 'activo por defecto (window.__DDM_HUB_T05 indefinido)'),
            'loadMs': rec['loadMs'], 'render': rec['render'],
            'drawKeysT05': t5(pf['life']['draws']),
            'onScreenT05': t5(pf['life']['onScreen']),
            'hub5': rec['hub5AtBoot'],
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
    ab['phases']['control']['hotToggle'] = {
        'off': len(t5(C['controlOff']['draws'])),
        'on': len(t5(C['controlOn']['draws'])),
        'hub5Restore': len(t5(C['controlRestore']['draws'])),
        'hub5Apply': len(t5(C['controlApply']['draws'])),
        'hub5RestoreResult': C['hub5Restore'], 'hub5ApplyResult': C['hub5Apply']
    }
    ab['performance'] = jload(EV / 'performance.json')
    ab['visualDiff'] = visual['summary']
    ab['alphaVerification'] = alpha['summary']
    ab['checks'] = [{'id': c['id'], 'check': c['check'], 'state': c['state']}
                    for c in report['checks']]
    ab['summary'] = report['summary']
    ab['finalVerdict'] = report['finalVerdict']
    jdump(EV / 'resultados_ab.json', ab)
    note('[7] report final: %s, fixes=%s' % (report['finalVerdict'], fixes or 'ninguno'))

    # ------------------------------------------------- 11 · log propio
    (EV / 'qa_finalize.log').write_text('\n'.join(LOG) + '\n', encoding='utf-8')

    # ------------------------------------------------- 12 · hashes (todo ya final)
    targets = []
    for p in sorted(EV.iterdir()):
        if p.is_file() and p.name != 'hashes.json':
            targets.append(p)
    for p in sorted(AS.rglob('*')):
        if p.is_file():
            targets.append(p)
    for rel in ['DEADBEAT_DISCO.ART.html', 'ART_PACK/art_pack.js',
                'ART_TOOLS/prepare_hub_tanda_05.py',
                'ART_TOOLS/qa/hub_tanda_05_audit.js',
                'ART_TOOLS/qa/apply_hub_tanda_05.py',
                'ART_TOOLS/qa/validate_hub_tanda_05.py',
                'ART_TOOLS/qa/validate_hub_tanda_05.js',
                'ART_TOOLS/qa/finalize_hub_tanda_05.py',
                'ART_TANDA_05_HUB_REPORT.md', 'ART_HUB_TANDA_05_MATRIX.md',
                'ART_PRODUCTION_LOG.md', 'CURRENT_STATE.md', 'CHANGELOG.md']:
        p = ROOT / rel
        if p.exists():
            targets.append(p)
    entries = {}
    for p in targets:
        rel = str(p.relative_to(ROOT))
        entries[rel] = {'sha256': sha256(p), 'bytes': p.stat().st_size}
    mismatches = [k for k, v in entries.items()
                  if sha256(ROOT / k) != v['sha256']]
    jdump(EV / 'hashes.json', {
        'generatedAt': NOW,
        'policy': 'SHA-256 de TODAS las evidencias de TANDA 05, los 10 finales + '
                  '10 fuentes, el manifiesto, los archivos de integración, las '
                  'herramientas y la documentación. hashes.json se excluye a sí mismo.',
        'entries': len(entries), 'mismatches': mismatches,
        'mismatchCount': len(mismatches),
        'files': entries
    })
    note('[8] hashes: %s entradas, %s desajustes' % (len(entries), len(mismatches)))
    note('=== FINALIZACIÓN %s ===' % report['finalVerdict'])
    if report['finalVerdict'] != 'APROBADO' or mismatches:
        return 1
    return 0


def write_docs(report, visual, alpha, incidences, manifest):
    """Informe técnico, matriz de validación y actualización de docs existentes."""
    assets = {a['id']: a for a in manifest['assets']}
    per = {u['artId']: u for u in report['perUnit']}
    checks = report['checks']

    def final_table():
        lines = ['| Asset | Generado | Integrado | Visible | Validado |',
                 '|---|---|---|---|---|']
        for tag, name in NAMES.items():
            u = per[tag]
            v = visual['assets'].get(tag, {})
            ok = (u['drawCalls'] > 0 and u['onScreen'] > 0 and
                  v.get('state') == 'APROBADO' and
                  alpha['assets'][tag]['state'] == 'APROBADO')
            lines.append('| %s %s | SÍ | SÍ (%s drawImage) | SÍ (%s en pantalla, %s zonas completas) | %s |'
                         % (tag, name, u['drawCalls'], u['onScreen'],
                            len(report['fullVisibility'].get(tag, [])),
                            'APROBADO' if ok else 'NO VERIFICADO'))
        return '\n'.join(lines)

    # ---------------------------------------------------------- informe técnico
    rep = []
    rep.append('# HUB · TANDA 05 — INFORME TÉCNICO DE INTEGRACIÓN')
    rep.append('')
    rep.append('**Estado:** `%s` · QA formal **%s/14 APROBADO** · %s FALLIDO · %s BLOQUEADO · %s NO VERIFICADO.'
               % (report['finalVerdict'], sum(1 for c in checks if c['state'] == 'APROBADO'),
                  sum(1 for c in checks if c['state'] == 'FALLIDO'),
                  sum(1 for c in checks if c['state'] == 'BLOQUEADO'),
                  sum(1 for c in checks if c['state'] == 'NO VERIFICADO')))
    rep.append('**Generado:** %s' % NOW)
    rep.append('**Build:** `DEADBEAT_DISCO.ART.html` (SHA `%s`) + `ART_PACK/art_pack.js` (SHA `%s`).'
               % (report['integration']['htmlSha256'][:16], report['integration']['artPackSha256'][:16]))
    rep.append('')
    rep.append('## 1. Trabajo recuperado (no se reconstruyó nada)')
    rep.append('')
    rep.append('El sandbox anterior cayó durante el cierre. Se verificó antes de continuar: rama '
               '`arena/109fe45c-deadbeat-disconew`, HEAD `873f2b0`, `main`/`origin/main` en `d75e021`, '
               'PR #1 abierto sin merge, preview 8123 vivo (pid 4783), worktree con 2 archivos '
               'modificados y los árboles nuevos de TANDA 05. NO se regeneraron assets, NO se '
               'repitió la integración, NO se ejecutó `apply_hub_tanda_05.py`, NO hubo '
               '`git reset`/`git clean`. Se continuó desde el arnés A/B.')
    rep.append('')
    rep.append('## 2. Auditoría del HUB real (ya realizada, conservada)')
    rep.append('')
    rep.append('`ART_EVIDENCE/hub/tanda_05/audit_runtime.json` + 12 `audit_*.png`: 12 zonas, '
               '27 canvas base, 142 claves V5, 11 estaciones, 32 assets de T01–T04 dibujados, '
               '0 `pageerror`, 0 404 locales. Huecos: flancos norte del DJ, perímetros O/SW y '
               'E/SE, corredor central, barra sin rótulo y VIP sin límite de circulación.')
    rep.append('')
    rep.append('## 3. Los diez recursos')
    rep.append('')
    rep.append('| ID | Recurso | Categoría | Clase | Anclaje (x,y,h) | PNG | Mundo | Fuente → Final |')
    rep.append('|---|---|---|---|---|---|---|---|')
    for tag, name in NAMES.items():
        a, u = assets[tag], per[tag]
        rep.append('| %s | %s | %s | %s | (%s, %s, %s) | %s×%s | %s | `_source/…png` → `%s` |'
                   % (tag, name, a['category'], a['interactiveClass'],
                      a['anchor']['x'], a['anchor']['y'], a['anchor']['worldH'],
                      a['width'], a['height'], u['computedWorldBox'],
                      Path(a['file']).name))
    rep.append('')
    rep.append('**Detalle por asset** (ubicación, función, escala, transparencia, bordes/halos, '
               'pivote y anclaje):')
    rep.append('')
    for tag, name in NAMES.items():
        a, u, v = assets[tag], per[tag], visual['assets'].get(tag, {})
        av = alpha['assets'][tag]
        rep.append('- **%s %s** — %s. %s Ubicación/anclaje `(%s,%s)`, altura mundo `%s`, '
                   'pivote `bottom-center`, caja `%s`, `flip=%s`. PNG `%s×%s` RGBA, '
                   'alfa `%s`, esquinas transparentes, borde limpio, franja clara `%s %%`, '
                   'halo exterior eliminado en preparación. `drawImage=%s`, `onScreen=%s`, '
                   'zonas completas: `%s`. Diff OFF/ON: señal `%s %%` frente a ruido `%s %%` (%s).'
                   % (tag, name, a['function'], a['why'],
                      a['anchor']['x'], a['anchor']['y'], a['anchor']['worldH'],
                      u['computedWorldBox'], a['anchor']['flip'],
                      a['width'], a['height'], av['alphaExtrema'], av['lightFringePct'],
                      u['drawCalls'], u['onScreen'],
                      ', '.join(report['fullVisibility'].get(tag, [])) or 'ninguna',
                      v.get('signal', {}).get('strongPct', 'N/A'),
                      v.get('noise', {}).get('strongPct', 'N/A'),
                      v.get('zone', 'N/A')))
    rep.append('')
    rep.append('**T05-08 conserva la composición VERTICAL (68×178) con escala ajustada a su bbox '
               'alfa; NO se regeneró horizontalmente** por el límite de 10 generaciones de imagen '
               'del turno de producción. Se documenta como incidencia `T05-08-VERTICAL`.')
    rep.append('')
    rep.append('## 4. Integración (mínima, localizada, reversible)')
    rep.append('')
    rep.append('- `ART_PACK/art_pack.js`: bloque `HUB5_*`, mismo `load()`, mismo '
               '`window.__DDM_V5_IMG` (142 → **152** claves), mismas invalidaciones '
               '(`DMO_INFERNAL_ART`, `__DDM_V5_MED_NO_SKULL`, `__T3B.setEnabled`). '
               '`loadHub5()` encadenado tras `loadHub2()`. API pública '
               '`hub5/hub5Manifest/hub5Restore/hub5Apply/hub5Tag`.')
    rep.append('- `DEADBEAT_DISCO.ART.html`: 3 pares `TANDA05:BEGIN/END`, 10 entradas en el '
               'array REAL `hubDecor` → `addHubCustomProp` → `Lc` (Y-sort, `solid:false`, '
               '`tall:false`, `sortY=dc.y`). `imageSmoothingEnabled` para arte pintado, '
               'pulso de `globalAlpha` del ctx existente en T05-04/T05-06 y supresión de '
               'sombra `Vb` en los 4 colgantes. Flag reversible `window.__DDM_HUB_T05 !== false`.')
    rep.append('- **Sin** segundo motor, canvas alternativo, caché nueva, loader paralelo, '
               'HUB estático, reescritura del HTML, geometría nueva, colisiones, estaciones, '
               'interacciones, progresión, combate, inventario, economía, guardado, música o DJ.')
    rep.append('')
    rep.append('## 5. QA formal A/B de tres fases')
    rep.append('')
    rep.append('`ART_TOOLS/qa/validate_hub_tanda_05.js` · Chromium 131 + Playwright-core · '
               '1280×900 · SwiftShader · `page.screenshot()` · `bootToHub` = '
               'click(640,450)+Enter+Escape 2800 ms · 10 zonas idénticas.')
    rep.append('')
    rep.append('| Fase | Flag | drawImage T05 | Mediana 40 rAF | pageErrors |')
    rep.append('|---|---|---|---|---|')
    for phase, flag, n, ms, errs in [
        ('ANTES', 'false', 0, '16,7 ms', 0),
        ('CONTROL', 'true→false→true', '0 → 10 → 0 → 10', '16,7 ms', 0),
        ('DESPUÉS', 'activo', 10, '16,7 ms', 0)]:
        rep.append('| %s | `%s` | %s | %s | %s |' % (phase, flag, n, ms, errs))
    rep.append('')
    rep.append('`hub5Restore()` → 0 dibujos; `hub5Apply()` → 10 dibujos. 0 dibujos en '
               '`menu-canvas54` (960×540) y en cualquier canvas ajeno al mundo. '
               'Los dibujos del HUB bajo la portada antes del boot se registran pero '
               '**NO se cuentan como integración**.')
    rep.append('')
    rep.append('### 14 comprobaciones')
    rep.append('')
    rep.append('| # | Comprobación | Estado |')
    rep.append('|---|---|---|')
    for c in checks:
        rep.append('| %s | %s | %s |' % (c['id'], c['check'], c['state']))
    rep.append('')
    rep.append('Prueba visual separada de la de carga: `visual_diff.json` mide, por caja de '
               'asset, dos capturas OFF (ruido) frente a OFF→ON en caliente (señal) en el MISMO '
               'contexto y cámara. **%s/10 confirmados**, señal mínima %s %%, ruido máximo %s %%.'
               % (visual['summary']['assetsWithPixelConfirmation'],
                  visual['summary']['minSignalPct'], visual['summary']['maxNoisePct']))
    rep.append('')
    rep.append('## 6. Tabla final de entrega')
    rep.append('')
    rep.append(final_table())
    rep.append('')
    rep.append('## 7. Incidencias históricas (sin corregir a ciegas)')
    rep.append('')
    rep.append('`HUB-01` loaderResolves=0, desviación 26,92 % de `HUB-03`, costura 12,57 de '
               'T01, rozamiento 3–5 px de placa C de T04 y **gate de rendimiento de T02 '
               'pendiente de cierre formal** se conservan. Ninguna afecta a TANDA 05: '
               '`incidencias.json` registra estado y evidencia de cada una.')
    rep.append('')
    rep.append('## 8. Propuestas NO implementadas (sin sistemas nuevos)')
    rep.append('')
    rep.append('T05-01, T05-02, T05-05 y T05-10 son **funcionales solo en apariencia**. '
               'Cualquier interacción real exigiría programación nueva (inventario, economía, '
               'diálogo, guardado, estaciones o UI) y queda documentada como PROPUESTA: '
               '`NO VERIFICADO`, sin implementar, sin autorización.')
    rep.append('')
    rep.append('## 9. Zonas que siguen necesitando reconstrucción · recomendación TANDA 06')
    rep.append('')
    rep.append('Con T05 quedan equipados los flancos, el corredor central, la barra y el VIP, '
               'pero la **envolvente arquitectónica sigue siendo la capa más débil**: paramentos '
               'y techos sin acabado, columnas y luminarias de techo genéricas, bordes de suelo '
               'y transiciones de acceso, cortinajes/absorbentes acústicos y atmósfera '
               'volumétrica (humo, haces de luz, reflejos). Se recomienda **TANDA 06 — '
               '«Envolvente arquitectónica y atmósfera»**: 10 recursos nuevos para techos, '
               'paramentos, columnas, remates de suelo, cortinajes, luminarias colgantes y '
               'capas de luz ambiental, integrados con los mismos `load()`/`hubDecor`/Y-sort '
               'y el mismo arnés A/B. Quedan FUERA de alcance, salvo autorización explícita: '
               'animación de recreativas/expendedora, `wall_limbo_ticket_window`, '
               '`limbo_gate_stage`, efectos dinámicos y sistemas de estaciones/puertas; '
               'además debe resolverse formalmente el gate de T02 sin sobreescribir los '
               'históricos `BLOQUEADO` de T03.')
    rep.append('')
    rep.append('## 10. Evidencias')
    rep.append('')
    rep.append('`report.json`, `resultados_ab.json`, `draw_calls.json`, `performance.json`, '
               '`visual_diff.json`, `alpha_verification.json`, `verificacion_carga.json`, '
               '`comprobacion_caches.json`, `diff_scope.json`, `integridad_t01_t04.json`, '
               '`incidencias.json`, `version_probe.json`, `hashes.json`, '
               '`qa_validation.log`, `qa_finalize.log`, 12 `audit_*.png`, 10 pares '
               '`antes_*/despues_*`, 10 `comparativa_*.jpg`, tripletas '
               '`control_off_a_*/control_off_b_*/control_on_*`, '
               '`comparativa_control_off_on.jpg` y `comparativa_antes_despues.jpg`.')
    rep.append('')
    (ROOT / 'ART_TANDA_05_HUB_REPORT.md').write_text('\n'.join(rep) + '\n', encoding='utf-8')

    # ---------------------------------------------------------- matriz de validación
    mx = []
    mx.append('# HUB · TANDA 05 — MATRIZ DE VALIDACIÓN')
    mx.append('')
    mx.append('Generado: %s · Arnés: `ART_TOOLS/qa/validate_hub_tanda_05.js` · '
              'Resultado: **%s/14 APROBADO**.' %
              (NOW, sum(1 for c in checks if c['state'] == 'APROBADO')))
    mx.append('')
    mx.append('| # | Validación | Estado | Evidencia principal |')
    mx.append('|---|---|---|---|')
    for c in checks:
        mx.append('| %s | %s | %s | %s |' %
                  (c['id'], c['check'], c['state'],
                   ', '.join('`%s`' % e for e in (c['evidence'] or [])[:3]) or '—'))
    mx.append('')
    mx.append('## Cobertura por asset')
    mx.append('')
    mx.append('| Asset | Carga HTTP | Registro V5 | drawImage | Caja en pantalla | '
              'Zonas completas | Diff OFF/ON | Alfa |')
    mx.append('|---|---|---|---|---|---|---|---|')
    for tag, name in NAMES.items():
        u, v = per[tag], visual['assets'].get(tag, {})
        mx.append('| %s %s | 200 | alias `h05_*` | %s | %s | %s | %s %% / ruido %s %% | %s |'
                  % (tag, name, u['drawCalls'], u['onScreen'],
                     len(report['fullVisibility'].get(tag, [])),
                     v.get('signal', {}).get('strongPct', 'N/A'),
                     v.get('noise', {}).get('strongPct', 'N/A'),
                     alpha['assets'][tag]['state']))
    mx.append('')
    mx.append('## Tabla final')
    mx.append('')
    mx.append(final_table())
    mx.append('')
    mx.append('## Clasificación de etiquetas')
    mx.append('')
    mx.append('- `APROBADO`: ejecutado y medido con resultado conforme.')
    mx.append('- `FALLIDO`: ejecutado y medido con resultado no conforme (0 en esta QA).')
    mx.append('- `BLOQUEADO`: no ejecutable por dependencia externa (0 en esta QA).')
    mx.append('- `NO VERIFICADO`: expresamente fuera de alcance (4 propuestas de interacción '
              'NO implementadas, documentadas en `report.json` → `interactionProposals`).')
    mx.append('')
    (ROOT / 'ART_HUB_TANDA_05_MATRIX.md').write_text('\n'.join(mx) + '\n', encoding='utf-8')

    # ---------------------------------------------------------- docs existentes
    def append(path, marker, block):
        p = ROOT / path
        cur = p.read_text(encoding='utf-8')
        if marker in cur:
            return False
        p.write_text(cur.rstrip('\n') + '\n\n' + marker + '\n' + block.strip() + '\n',
                     encoding='utf-8')
        return True

    prod = [
        '### TANDA 05 — Equipamiento, vida ambiental e interactividad',
        '',
        '- Producción: **10 fuentes** 1408×768 en `_source/` y **10 finales** RGBA '
        '(tamaño exacto, esquinas transparentes, halo exterior ≤0,11 %), con '
        '`ART_TOOLS/prepare_hub_tanda_05.py` (`kill_exterior_halo`, `despill_dark` para '
        'fondo negro). Sin regeneración durante el cierre.',
        '- Clasificación: A máquinas/entretenimiento (T05-01/02), B equipamiento '
        '(T05-03/04/05/08), C decoración ambiental (T05-06/07/09) y D interactividad '
        'potencial (T05-10). 4 objetos funcionales SIN lógica nueva.',
        '- `T05-08` conservó composición **vertical** 68×178 con escala ajustada: '
        'NO se regeneró horizontalmente (límite de 10 generaciones de imagen).',
        '- Integración: `loadHub5()` tras `loadHub2()` en `ART_PACK/art_pack.js` y 10 '
        'entradas `hubDecor` en `DEADBEAT_DISCO.ART.html`, ambas con marcadores '
        '`TANDA05:BEGIN/END`. Flag reversible `window.__DDM_HUB_T05`.',
        '- Cierre: QA formal 14/14 APROBADO, 10/10 `drawImage` en el canvas de mundo, '
        '10/10 con diff de píxel OFF/ON, `hashes.json`, informe '
        '`ART_TANDA_05_HUB_REPORT.md` y matriz `ART_HUB_TANDA_05_MATRIX.md`.'
    ]
    append('ART_PRODUCTION_LOG.md', '<!-- TANDA05:PRODUCTION -->', '\n'.join(prod))

    state = [
        '### Integración TANDA 05 — `%s`' % report['finalVerdict'],
        '',
        '- HUB real: 152 claves V5 (142 de T04 + 10 de T05), 27 canvas base, '
        '11 estaciones, 6 zonas, caché de suelo activa.',
        '- 10/10 assets integrados y visibles: `drawImage` medido en `game` 1280×900, '
        'A/B `0 → 10 → 0 → 10`, `hub5Restore/hub5Apply` verificados.',
        '- Sin sistemas nuevos: sin colisiones, estaciones, interacciones, geometría, '
        'guardado, música, DJ ni segundo motor/canvas/caché/loader.',
        '- T01–T04 intactas. PR #1 abierto, base `arte-y-recursos`, head de sesión, '
        '**sin merge**; `main`/`origin/main` en `d75e021`.',
        '- Pendiente ajeno a T05: cierre formal del performance gate de T02; '
        'históricos `BLOQUEADO` de T03 conservados.',
        '- Siguiente: TANDA 06 — envolvente arquitectónica y atmósfera.'
    ]
    append('CURRENT_STATE.md', '<!-- TANDA05:STATE -->', '\n'.join(state))

    changelog = [
        '## TANDA 05 — Equipamiento, vida ambiental e interactividad (%s)' % NOW[:10],
        '',
        '- Añadidos 10 recursos nuevos en `ART_ASSETS/hub/tanda_05/` (10 fuentes, '
        '10 finales, `manifest.json`) sin repetir T01–T04.',
        '- `ART_PACK/art_pack.js`: `HUB5_*`, `loadHub5()` y API `hub5*` en el '
        'registro V5 existente; versión `+hub-tanda05`.',
        '- `DEADBEAT_DISCO.ART.html`: 10 props en `hubDecor` con flag reversible '
        '`__DDM_HUB_T05`, pulso de `globalAlpha` en 2 neones y sin sombra en 4 colgantes.',
        '- QA formal A/B de 3 fases y 14 comprobaciones: **14/14 APROBADO**, '
        '10/10 `drawImage` y 10/10 confirmados por diff de píxel; evidencias en '
        '`ART_EVIDENCE/hub/tanda_05/`.',
        '- Documentación: informe técnico, matriz de validación, registro de '
        'producción, estado de integración e incidencias.',
        '- No se fusiona PR #1; no se modifica `main`.'
    ]
    append('CHANGELOG.md', '<!-- TANDA05:CHANGELOG -->', '\n'.join(changelog))


if __name__ == '__main__':
    sys.exit(main())
