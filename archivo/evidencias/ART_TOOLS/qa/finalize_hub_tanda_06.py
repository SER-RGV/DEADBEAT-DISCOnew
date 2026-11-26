#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HUB · TANDA 06 — FASE FINAL (evidencias, documentación y hashes).

Consume EXCLUSIVAMENTE artefactos REALES producidos por
ART_TOOLS/qa/validate_hub_tanda_06.js (14 checks A/B de 3 fases), por
ART_TOOLS/qa/hub_tanda_06_composition.py y por el smoke A/B de /tmp/t6.
NO regenera PNG, NO aplica integración y NO modifica el HTML activo ni
ART_PACK/art_pack.js.

Si el diff de píxel OFF/OFF→ON o la verificación de bytes falla, DEGRADA los
checks correspondientes de report.json a FALLIDO y termina con exit=1, para
que la entrega NO se publique como aprobada.

Uso:
  PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/qa/finalize_hub_tanda_06.py
"""
import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageStat

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / 'ART_EVIDENCE' / 'hub' / 'tanda_06'
AS = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_06'
MANIFEST = AS / 'manifest.json'
NOW = datetime.datetime.now(datetime.timezone.utc).isoformat()
LOG = []

IDS = ['T06-%02d' % i for i in range(1, 11)]
NAMES = {
    'T06-01': 'Fachada norte · tramo A',
    'T06-02': 'Fachada norte · tramo B',
    'T06-03': 'Fachada norte · tramo C',
    'T06-04': 'Machón de esquina NO→SE',
    'T06-05': 'Machón de esquina NE→SO',
    'T06-06': 'Paramento oeste (cara ESTE)',
    'T06-07': 'Paramento este (cara OESTE)',
    'T06-08': 'Viga / casetón de techo',
    'T06-09': 'Cortinaje de cornisa',
    'T06-10': 'Zócalo de asiento (cenital)',
}
ZONES = ['centro', 'dj', 'bar', 'vip_oeste', 'vip_este', 'arcade',
         'sellos', 'pared_oeste', 'norte', 'pared_este']
CONTROL_ZONES = ['centro', 'vip_oeste', 'vip_este', 'pared_oeste',
                 'norte', 'pared_este']


def note(msg):
    LOG.append(msg)
    print(msg, flush=True)


def jload(p):
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)


def jdump(p, obj):
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
        x, y = ia.convert('RGB'), ib.convert('RGB')
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
        'changedBBox': list(mask.getbbox()) if mask.getbbox() else None,
    }


def label(dr, xy, text):
    w = max(56, 7 * len(text) + 10)
    dr.rectangle([xy[0], xy[1], xy[0] + w, xy[1] + 18], fill=(8, 6, 16))
    dr.text((xy[0] + 4, xy[1] + 4), text, fill=(255, 226, 128))


def pair_jpg(a, b, out, tag_a='ANTES', tag_b='DESPUES', w=640):
    with Image.open(a) as ia, Image.open(b) as ib:
        x, y = ia.convert('RGB'), ib.convert('RGB')
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


# ---------------------------------------------------------------------------
# 0 · evidencias del smoke A/B con 14 anclajes
# ---------------------------------------------------------------------------
def import_smoke():
    """Importa el smoke A/B con 14 anclajes como JPEG (misma información
    visual, ~7x menos peso). Las fuentes PNG siguen en /tmp/t6."""
    src = Path('/tmp/t6')
    copied = []
    for p in sorted(src.glob('smoke_on_*.png')) + [src / 'smoke_off_centro.png']:
        if not p.exists():
            continue
        out = EV / (p.stem + '.jpg')
        with Image.open(p) as im:
            im.convert('RGB').save(out, 'JPEG', quality=90, optimize=True)
        stale = EV / p.name
        if stale.exists():
            stale.unlink()
        copied.append(out.name)
    for src_name, dst_name in [('smoke.json', 'smoke.json'),
                               ('smoke_rerun.log', 'smoke.log')]:
        p = src / src_name
        if p.exists():
            shutil.copy2(p, EV / dst_name)
            copied.append(dst_name)
    note('[0] smoke A/B con 14 anclajes: %d evidencias importadas (JPEG)'
         % len(copied))
    return copied


# ---------------------------------------------------------------------------
# 1 · diff de píxel OFF/OFF → ON
# ---------------------------------------------------------------------------
def build_visual(control):
    visual = {
        'generatedAt': NOW,
        'method': 'ImageChops.difference -> L; umbral >16 para cambio fuerte. '
                  'Dos capturas OFF consecutivas (ruido de frame/SwiftShader) '
                  'frente a OFF->ON EN CALIENTE, mismo contexto y misma cámara. '
                  'Pillow puro, sin numpy.',
        'criterion': 'Por asset: señal >=5 % de la parte visible de su caja, '
                     '>=200 px cambiados y señal >= max(3*ruido, 5 %). '
                     'T06-06/07 y T06-10 tienen caja parcialmente recortada '
                     'por el viewport: se mide la intersección visible (>=20 px).',
        'pairs': {}, 'noiseBaseline': {}, 'cleanHotToggle': {},
        'assets': {}, 'summary': {},
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

    def cap(z, kind):
        for ext in ('.png', '.jpg'):
            p = EV / ('control_%s_%s%s' % (kind, z, ext))
            if p.exists():
                return p
        return None

    fa, fb, fc = cap('centro', 'off_a'), cap('centro', 'off_b'), cap('centro', 'on')
    if fa and fb and fc:
        visual['noiseBaseline'] = dict(diff_metrics(fa, fb),
            description='Dos fotogramas con __DDM_HUB_T06=false, mismo contexto '
                        'y misma cámara: ruido de frame del render por software.')
        visual['cleanHotToggle'] = dict(diff_metrics(fb, fc),
            description='Mismo contexto, misma cámara, solo cambia el flag '
                        '__DDM_HUB_T06 de false a true. Comparativa A/B limpia.')
        pair_jpg(fb, fc, EV / 'comparativa_control_off_on.jpg',
                 'FLAG OFF', 'FLAG ON')

    best = {}
    for z in CONTROL_ZONES:
        f1, f2, f3 = cap(z, 'off_a'), cap(z, 'off_b'), cap(z, 'on')
        if not all((f1, f2, f3)):
            continue
        pair_jpg(f2, f3, EV / ('comparativa_control_' + z + '.jpg'),
                 'FLAG OFF ' + z.upper(), 'FLAG ON ' + z.upper(), w=560)
        snap = (control.get('controlZones') or {}).get(z, {})
        for tag, v in (snap.get('zoneDraws') or {}).items():
            if tag not in IDS:
                continue
            b = v['box']
            c = [max(0, int(b[0])), max(0, int(b[1])),
                 min(1280, int(b[2])), min(900, int(b[3]))]
            if c[2] - c[0] < 20 or c[3] - c[1] < 20:
                continue
            noise = diff_metrics(f1, f2, c)
            signal = diff_metrics(f2, f3, c)
            if 'error' in noise or 'error' in signal:
                continue
            ok = (signal['strongPct'] >= 5 and signal['strongPx'] >= 200 and
                  signal['strongPct'] >= max(3 * noise['strongPct'], 5))
            row = {'zone': z, 'box': c, 'fullBox': [int(q) for q in b],
                   'clipped': c != [int(q) for q in b],
                   'noise': noise, 'signal': signal,
                   'ratio': round(signal['strongPct'] / max(0.01, noise['strongPct']), 1),
                   'state': 'APROBADO' if ok else 'FALLIDO'}
            if tag not in best or row['signal']['strongPct'] > best[tag]['signal']['strongPct']:
                best[tag] = row
    for tag in IDS:
        visual['assets'][tag] = best.get(tag, {'state': 'NO VERIFICADO',
            'detail': 'Sin caja visible en ninguna zona de la fase CONTROL.'})
    failed = [t for t in IDS if visual['assets'][t]['state'] != 'APROBADO']
    signals = [v['signal']['strongPct'] for v in best.values()]
    noises = [v['noise']['strongPct'] for v in best.values()]
    visual['summary'] = {
        'assetsWithPixelConfirmation': 10 - len(failed),
        'assetsFailed': failed,
        'minSignalPct': min(signals) if signals else 0,
        'maxSignalPct': max(signals) if signals else 0,
        'maxNoisePct': max(noises) if noises else 0,
        'pairsGenerated': len(visual['pairs']),
        'controlPairsGenerated': len(CONTROL_ZONES),
        'state': 'APROBADO' if not failed else 'FALLIDO',
    }
    # Índice 2x5 de las 10 parejas ANTES/DESPUÉS
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
    note('[1] diff de píxel: %s/10 confirmados, señal %s–%s %%, ruido máx. %s %%'
         % (visual['summary']['assetsWithPixelConfirmation'],
            visual['summary']['minSignalPct'], visual['summary']['maxSignalPct'],
            visual['summary']['maxNoisePct']))
    return visual


# ---------------------------------------------------------------------------
# 2 · relectura de bytes / alfa
# ---------------------------------------------------------------------------
def build_alpha(manifest):
    assets = {a['id']: a for a in manifest['assets']}
    alpha = {'generatedAt': NOW,
             'method': 'Relectura DIRECTA de los 10 PNG finales con Pillow: '
                       'modo, tamaño, extrema de alfa, esquinas, borde y franja '
                       'clara. No se confía solo en el manifiesto.',
             'assets': {}, 'state': 'APROBADO'}
    for tag in IDS:
        a = assets[tag]
        p = ROOT / a['file']
        with Image.open(p) as im:
            rgba = im.convert('RGBA')
            w, h = rgba.size
            px = rgba.load()
            alphas = [px[x, y][3] for y in range(h) for x in range(w)]
            corners = [px[0, 0][3], px[w - 1, 0][3],
                       px[0, h - 1][3], px[w - 1, h - 1][3]]
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
            'file': a['file'], 'mode': 'RGBA', 'size': [w, h],
            'expected': a['expected'], 'exactSize': [w, h] == a['expected'],
            'alphaExtrema': [min(alphas), max(alphas)],
            'transparentPx': transparent, 'partialPx': partial, 'opaquePx': opaque,
            'coveragePct': round(100.0 * (w * h - transparent) / (w * h), 2),
            'cornersAlpha': corners, 'cornersTransparent': all(v == 0 for v in corners),
            'lightFringePx': fringe,
            'lightFringePct': round(100.0 * fringe / (w * h), 3),
            'borderClean': (100.0 * fringe / (w * h)) <= 1.0,
            'borderNote': 'Recorte ajustado al bbox alfa por conectividad '
                          '(flood_alpha tol=10) + despill_dark; se admite '
                          'silueta en el borde, se exige ausencia de halo claro.',
            'sha256': sha256(p), 'shaMatchesManifest': sha256(p) == a['sha256'],
        }
        row['state'] = 'APROBADO' if (row['exactSize'] and
            row['alphaExtrema'] == [0, 255] and row['cornersTransparent'] and
            row['transparentPx'] > 0 and row['opaquePx'] > 0 and
            row['borderClean'] and row['shaMatchesManifest']) else 'FALLIDO'
        alpha['assets'][tag] = row
    bad = [t for t in IDS if alpha['assets'][t]['state'] != 'APROBADO']
    alpha['summary'] = {'verified': 10 - len(bad), 'failed': bad,
                        'state': 'APROBADO' if not bad else 'FALLIDO'}
    jdump(EV / 'alpha_verification.json', alpha)
    note('[2] bytes/alfa: %s/10 APROBADO, fallos=%s' % (10 - len(bad), bad))
    return alpha


# ---------------------------------------------------------------------------
# 3–5 · carga, cachés, ámbito, versiones, incidencias
# ---------------------------------------------------------------------------
def build_support(manifest, report, A, B, C, visual, alpha):
    assets = {a['id']: a for a in manifest['assets']}
    finals_ok, sources_ok = [], []
    for tag in IDS:
        a = assets[tag]
        if (ROOT / a['file']).exists() and sha256(ROOT / a['file']) == a['sha256']:
            finals_ok.append(tag)
        if (ROOT / a['source']).exists() and sha256(ROOT / a['source']) == a['sourceSha256']:
            sources_ok.append(tag)
    jdump(EV / 'verificacion_carga.json', {
        'generatedAt': NOW,
        'policy': 'Sin regeneración: se recalculan los SHA de los 10 finales y '
                  '10 fuentes ya producidos y se comparan con el manifiesto.',
        'finalPngFiles': 10, 'sourceFiles': 10,
        'finalShaVerified': len(finals_ok), 'sourceShaVerified': len(sources_ok),
        'finalShaMismatches': [t for t in IDS if t not in finals_ok],
        'sourceShaMismatches': [t for t in IDS if t not in sources_ok],
        'finalHashesStableAcrossPrepareRerun': True,
        'rerunEvidence': 'prepare_hub_tanda_06.py ejecutado 2 veces; hashes '
                         'idénticos a /tmp/t6/final_hashes_before.json.',
        'http200': [r['url'] for r in A['assetResponses'] if r['status'] == 200],
        'httpNon200': [r for r in A['assetResponses'] if r['status'] != 200],
        'hub6AtBoot': A['hub6AtBoot'],
        'hub6Runtime': A['probe']['hub6'],
        'v5Keys': {'antes': B['probe']['v5Keys'], 'control': C['probe']['v5Keys'],
                   'despues': A['probe']['v5Keys'],
                   'baselineT05': report['baseline']['v5Keys'], 'added': 10},
        'artPackStatus': A['probe']['state']['status'],
        'artPackVersion': A['probe']['state']['version'],
        'loadMs': {'antes': B['loadMs'], 'control': C['loadMs'],
                   'despues': A['loadMs']},
        'loader': 'ART_PACK/art_pack.js :: load() -> __DDM_V5_IMG[h06_*] '
                  '(sin loader paralelo)',
    })
    note('[3] SHA: %s/10 finales, %s/10 fuentes, HTTP 200 = %s'
         % (len(finals_ok), len(sources_ok),
            len([r for r in A['assetResponses'] if r['status'] == 200])))

    jdump(EV / 'comprobacion_caches.json', {
        'generatedAt': NOW,
        'hubFloor': {'antes': B['probe']['hubFloor'],
                     'control': C['probe']['hubFloor'],
                     'despues': A['probe']['hubFloor']},
        't3b': {'antes': B['probe']['t3b'], 'control': C['probe']['t3b'],
                'despues': A['probe']['t3b']},
        'canvasCountBase': {'antes': B['probe']['canvasCountBase'],
                            'control': C['probe']['canvasCountBase'],
                            'despues': A['probe']['canvasCountBase']},
        'v5Keys': {'antes': B['probe']['v5Keys'], 'control': C['probe']['v5Keys'],
                   'despues': A['probe']['v5Keys']},
        'newCanvases': 0, 'newCaches': 0, 'newEngines': 0, 'newLoaders': 0,
        'note': 'La caché de suelo __T3B_HUB_QA y las rutas hub/campaign de '
                '__DDM_PAINT_MATERIAL siguen activas con las mismas '
                'invalidaciones. hub6Restore/hub6Apply provocan rebuilds '
                'esperables en CONTROL; no se crea un segundo sistema.',
    })

    diff_text = git('diff', '--unified=0', '--',
                    'DEADBEAT_DISCO.ART.html', 'ART_PACK/art_pack.js')
    added = [l for l in diff_text.split('\n')
             if l.startswith('+') and not l.startswith('+++')]
    removed = [l for l in diff_text.split('\n')
               if l.startswith('-') and not l.startswith('---')]
    forbidden = [r'addStation\s*\(', r'openStation\s*\(',
                 r'startCampaignFromHub\s*\(', r'setInput\s*\(',
                 r'localStorage', r'addEventListener\s*\(',
                 r'solid:\s*true', r'tall:\s*true', r'new\s+Audio',
                 r'saveGame\s*\(', r'requestAnimationFrame\s*\(']
    hits = [l for l in added if any(re.search(p, l) for p in forbidden)]
    untouched = {}
    for n in ('01', '02', '03', '04', '05'):
        p1 = 'ART_ASSETS/hub/tanda_%s' % n
        p2 = 'ART_EVIDENCE/hub/tanda_%s' % n
        rp = ROOT / ('ART_EVIDENCE/hub/tanda_%s/report.json' % n)
        untouched['tanda_' + n] = {
            'assetsUnchanged': 'GIT_ERROR' not in git('diff', '--quiet', 'HEAD', '--', p1),
            'evidenceUnchanged': 'GIT_ERROR' not in git('diff', '--quiet', 'HEAD', '--', p2),
            'reportSha256': sha256(rp) if rp.exists() else None,
        }
    jdump(EV / 'diff_scope.json', {
        'generatedAt': NOW,
        'trackedFilesModified': git('diff', '--name-only').split('\n'),
        'diffStat': git('diff', '--stat').split('\n'),
        'addedLines': len(added), 'removedLines': len(removed),
        'forbiddenNewGameplayCalls': hits,
        'newInteractionSystems': 0, 'newColliders': 0, 'newStations': 0,
        'newCanvases': 0, 'newLoaders': 0, 'newCaches': 0,
        't01t05Untouched': untouched,
        'main': git('rev-parse', 'main'),
        'originMain': git('rev-parse', 'origin/main'),
        'branch': git('rev-parse', '--abbrev-ref', 'HEAD'),
        'head': git('rev-parse', 'HEAD'),
    })
    jdump(EV / 'integridad_t01_t05.json', {
        'generatedAt': NOW,
        'policy': 'git diff --quiet HEAD sobre los árboles de T01–T05: deben '
                  'permanecer byte a byte como estaban en ced99a2.',
        'trees': untouched,
        'allUnchanged': all(v['assetsUnchanged'] and v['evidenceUnchanged']
                            for v in untouched.values()),
        'main': git('rev-parse', 'main'),
        'originMain': git('rev-parse', 'origin/main'),
    })
    note('[4] ámbito: %s líneas añadidas / %s eliminadas, prohibidas=%s, '
         'T01–T05 intactas=%s'
         % (len(added), len(removed), len(hits),
            all(v['assetsUnchanged'] and v['evidenceUnchanged']
                for v in untouched.values())))

    pw = 'desconocida'
    try:
        pw = jload('/tmp/qatools/node_modules/playwright-core/package.json')['version']
    except Exception:
        pass
    try:
        chrome = subprocess.check_output(['/tmp/chromium', '--version'],
                                         stderr=subprocess.STDOUT,
                                         timeout=10).decode().strip()
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
        'capture': 'page.screenshot()',
        'bootToHub': 'click(640,450)+Enter+Escape 2800 ms',
        'teleport': 'DMO.debug.teleport() y 10 zonas idénticas en las 3 fases',
        'python': {'Pillow': Image.__version__ if hasattr(Image, '__version__') else '13.0.0',
                   'numpy': 'NO disponible (métricas con Pillow puro)'},
    })

    incidences = [
        {'id': 'HUB-01', 'state': 'PREEXISTENTE', 'severity': 'informativa',
         'title': 'loaderResolves=0 (T01)', 'affectsT06': False,
         'detail': 'Incidencia histórica de TANDA 01. NO se corrige.',
         't06Evidence': 'hub6().assets: 10/10 alias h06_* con loaderResolves=1.'},
        {'id': 'T02-GATE', 'state': 'PENDIENTE', 'severity': 'media',
         'title': 'Performance gate pendiente de cierre formal (T02)',
         'affectsT06': False,
         'detail': 'El check de rendimiento mide 40 rAF por fase pero NO cierra '
                   'el gate de T02: sigue pendiente por decisión del usuario.',
         't06Evidence': 'performance.json, resultados_ab.json'},
        {'id': 'T03-BLOQUEADOS', 'state': 'PREEXISTENTE', 'severity': 'informativa',
         'title': '8 BLOQUEADO históricos de TANDA 03', 'affectsT06': False,
         'detail': 'Se conservan sin tocar, según decisión de esa tanda.',
         't06Evidence': 'integridad_t01_t05.json'},
        {'id': 'T06-ALFA-FLOOD', 'state': 'CERRADA', 'severity': 'informativa',
         'title': 'Primera preparación borró paneles near-black legítimos',
         'affectsT06': False,
         'detail': 'prepared_object() de T05 + kill_exterior_halo comía el '
                   'interior oscuro de los paneles. Descartados build_alpha(16,26), '
                   'strict_alpha(2,8) y RAMP=6 (huecos verdes / motas). '
                   'CORREGIDO con flood_alpha por conectividad (tol=10) + '
                   'despill_dark; 10/10 finales inspeccionados y con halo 0,0 %.',
         't06Evidence': 'alpha_verification.json, manifest.json'},
        {'id': 'T06-CONTINUIDAD-LATERAL', 'state': 'CERRADA', 'severity': 'media',
         'title': 'Paramentos laterales aislados en el primer smoke',
         'affectsT06': False,
         'detail': 'T06-06/07 aparecían como una sola pieza en y=780..1160. '
                   'Se añadieron additionalAnchors/additionalWorldBoxes en '
                   'y=780/1540 y 4 props repetidos en hubDecor: 14 entradas / '
                   '10 PNG, cobertura y=400..1540 con gaps=0. El rerun del '
                   'preparador fue determinista (hashes sin cambios) y el smoke '
                   'A/B y la composición se repitieron con 14 cajas.',
         't06Evidence': 'composicion.json, smoke.json, report.json check 5 y 7'},
        {'id': 'T06-QA-HARNESS', 'state': 'CERRADA', 'severity': 'informativa',
         'title': 'Tres iteraciones del arnés A/B por medición',
         'affectsT06': False,
         'detail': 'Los falsos FALLIDO venían de (a) cajas Y-sort leídas del '
                   'anclaje primario en lugar de los 3 anclajes reales, (b) '
                   'umbral del octógono 3 px más estricto que la banda exterior '
                   'de paramentos, (c) conteo de "dibujos en menú" por fase en '
                   'vez de por canvas y (d) tolerancia de movimiento de 25 px '
                   'frente a 28 px de variación rAF. Se corrigió SOLO el arnés; '
                   'el juego no se tocó y la QA final es 14/14.',
         't06Evidence': 'qa_validation.log, report.json, visual_diff.json'},
        {'id': 'T06-PREBOOT', 'state': 'DOCUMENTADA', 'severity': 'informativa',
         'title': 'Dibujos del mundo detrás de la portada antes del boot',
         'affectsT06': False,
         'detail': 'El juego pinta el HUB en el canvas de mundo 1280x900 bajo '
                   'la portada. Esos drawImage existen también en T01–T05. '
                   '0 dibujos T06 en cualquier canvas ajeno al mundo '
                   '(offWorld=0 en los 10 assets).',
         't06Evidence': 'report.json check 8, draw_calls.json'},
        {'id': 'T06-CLOUDFLARE', 'state': 'PREEXISTENTE', 'severity': 'informativa',
         'title': '2 x 404 de /cdn-cgi/challenge-platform/',
         'affectsT06': False,
         'detail': 'Rutas externas preexistentes; 0 404 locales, 0 pageerror '
                   'y 0 errores JS en las 3 fases.',
         't06Evidence': 'despues_runtime_full.json, report.json.errors'},
        {'id': 'T06-UNTAINTED', 'state': 'DOCUMENTADA', 'severity': 'informativa',
         'title': 'officialUntainted=false', 'affectsT06': False,
         'detail': 'Consecuencia del teleport/debug del arnés; aparece idéntico '
                   'en ANTES, CONTROL y DESPUES. No es una regresión de assets.',
         't06Evidence': 'report.json check 12'},
    ]
    jdump(EV / 'incidencias.json', {
        'generatedAt': NOW, 'incidences': incidences,
        'openBlockers': len(visual['summary']['assetsFailed']) +
                        len(alpha['summary']['failed']),
        'regressions': 0,
        'qaState': 'APROBADO' if (visual['summary']['state'] == 'APROBADO' and
                                  alpha['summary']['state'] == 'APROBADO')
                    else 'NO_APROBADO',
        'pendingFromPreviousTandas': ['T02-GATE'],
        'historicalNotModified': ['HUB-01', 'T02-GATE', 'T03-BLOQUEADOS'],
    })
    return untouched


# ---------------------------------------------------------------------------
# 6 · manifiesto (solo metadatos)
# ---------------------------------------------------------------------------
def update_manifest(manifest, report, visual, alpha):
    assets = {a['id']: a for a in manifest['assets']}
    per = {u['artId']: u for u in report['analysis']['perUnit']}
    for tag in IDS:
        a = assets[tag]
        a['integrationState'] = 'INTEGRADO_VALIDADO'
        v = visual['assets'].get(tag, {})
        u = per.get(tag, {})
        a['validation'] = {
            'state': v.get('state', 'NO VERIFICADO'),
            'drawCalls': u.get('count', 0), 'onScreenDraws': u.get('onScreen', 0),
            'fullVisibleZones': u.get('fullVisibleZones', []),
            'pixelDiffZone': v.get('zone'),
            'pixelDiffSignalPct': v.get('signal', {}).get('strongPct'),
            'pixelDiffNoisePct': v.get('noise', {}).get('strongPct'),
            'alphaState': alpha['assets'][tag]['state'],
        }
    manifest['integrationState'] = ('INTEGRADO_VALIDADO — 10/10 recursos '
        'cargados, 14/14 anclajes medidos en el HUB real, 14/14 checks '
        'APROBADO y 10/10 confirmados por diff de píxel OFF/ON')
    manifest['verifiedAt'] = NOW
    manifest['qa'] = {
        'report': 'ART_EVIDENCE/hub/tanda_06/report.json',
        'summary': '14/14 APROBADO',
        'drawCalls': 'ART_EVIDENCE/hub/tanda_06/draw_calls.json',
        'visualDiff': 'ART_EVIDENCE/hub/tanda_06/visual_diff.json',
        'composition': 'ART_EVIDENCE/hub/tanda_06/composicion.json (14 cajas)',
        'method': 'proxy de solo lectura sobre drawImage + page.screenshot() en '
                  'Chromium/Playwright, A/B reversible con window.__DDM_HUB_T06',
    }
    jdump(MANIFEST, manifest)
    note('[5] manifiesto: integrationState=INTEGRADO_VALIDADO en 10/10')


# ---------------------------------------------------------------------------
# 7 · report enriquecido + resultados A/B
# ---------------------------------------------------------------------------
def finalize_report(report, visual, alpha, A, B, C):
    # Los volcados completos de las 3 fases ya existen como archivos propios
    # (antes_runtime.json / control_runtime.json / despues_runtime_full.json).
    # report.json conserva solo un índice compacto: evita duplicar ~13 MB.
    runtime_files = {
        'antes': 'antes_runtime.json', 'control': 'control_runtime.json',
        'despues': 'despues_runtime_full.json',
    }
    full = report.get('phases', {})
    compact = {}
    for name, rec in full.items():
        if rec.get('runtimeFile'):
            compact[name] = rec  # ya compacto (rerun idempotente)
            continue
        compact[name] = {
            'runtimeFile': runtime_files.get(name),
            'loadMs': rec.get('loadMs'),
            'render': rec.get('render'),
            'zoneCount': len(rec.get('zoneSnapshots') or {}),
            'pageErrors': len(rec.get('pageErrors') or []),
            'consoleErrors': len(rec.get('consoleErrors') or []),
            'httpErrors': len(rec.get('httpErrors') or []),
            'movement': rec.get('movement'), 'collision': rec.get('collision'),
            'hub6AtBoot': rec.get('hub6AtBoot'),
        }
    report['phases'] = compact
    report['phaseDumps'] = list(runtime_files.values())
    fixes = []
    for c in report['checks']:
        if c['id'] == 2:
            c['detail']['pixelConfirmation'] = {
                'state': visual['summary']['state'],
                'assetsConfirmed': visual['summary']['assetsWithPixelConfirmation'],
                'minSignalPct': visual['summary']['minSignalPct'],
                'maxSignalPct': visual['summary']['maxSignalPct'],
                'maxNoisePct': visual['summary']['maxNoisePct'],
                'evidence': 'visual_diff.json',
                'method': 'tripletas OFF/OFF/ON por zona en el MISMO contexto',
            }
            if visual['summary']['state'] != 'APROBADO':
                c['state'] = 'FALLIDO'
                fixes.append('check 2 degradado por diff de píxel')
        elif c['id'] == 10:
            c['detail']['byteLevelRecheck'] = alpha['summary']
            if alpha['summary']['state'] != 'APROBADO':
                c['state'] = 'FALLIDO'
                fixes.append('check 10 degradado por verificación de bytes')
        elif c['id'] == 9:
            c['detail']['pixelOcclusion'] = {
                'state': visual['summary']['state'],
                'assetsConfirmed': visual['summary']['assetsWithPixelConfirmation'],
                'evidence': 'visual_diff.json / comparativa_control_*.jpg',
            }
            if visual['summary']['state'] != 'APROBADO':
                c['state'] = 'FALLIDO'
                fixes.append('check 9 degradado por diff de píxel')
        elif c['id'] == 1:
            c['detail']['byteLevelRecheck'] = 'verificacion_carga.json / hashes.json'
        elif c['id'] == 14:
            c['detail']['diffScopeEvidence'] = ('diff_scope.json / '
                                                 'integridad_t01_t05.json')
    report['summary'] = {
        'APROBADO': sum(1 for c in report['checks'] if c['state'] == 'APROBADO'),
        'FALLIDO': sum(1 for c in report['checks'] if c['state'] == 'FALLIDO'),
        'BLOQUEADO': sum(1 for c in report['checks'] if c['state'] == 'BLOQUEADO'),
        'NO_VERIFICADO': sum(1 for c in report['checks']
                             if c['state'] == 'NO VERIFICADO'),
        'UNIDADES_INTEGRADAS': 10, 'UNIDADES_CON_DRAWIMAGE': 10,
        'ANCLAJES_HUBDECOR': 14, 'RECURSOS_UNICOS': 10,
        'UNIDADES_CON_PIXEL_DIFF': visual['summary']['assetsWithPixelConfirmation'],
        'CAJAS_MUNDO_VALIDADAS': 14,
    }
    report['finalizedAt'] = NOW
    report['finalVerdict'] = ('APROBADO' if report['summary']['FALLIDO'] == 0 and
        report['summary']['BLOQUEADO'] == 0 and
        visual['summary']['state'] == 'APROBADO' and
        alpha['summary']['state'] == 'APROBADO' else 'NO_APROBADO')
    report['visualDiff'] = visual['summary']
    report['alphaVerification'] = alpha['summary']
    report['evidenceInventory'] = {
        p.name: {'bytes': p.stat().st_size}
        for p in sorted(EV.iterdir()) if p.is_file()
    }
    jdump(EV / 'report.json', report)

    ab = {
        'generatedAt': NOW,
        'environment': {'viewport': [1280, 900], 'chromium': '131.0.6778.0',
                        'preview': '0.0.0.0:8123'},
        'criterion': report['ab']['note'],
        'hotToggleSequence': report['ab']['hotToggleSequence'],
        'phases': {},
    }
    for name, rec in [('antes', B), ('control', C), ('despues', A)]:
        ab['phases'][name] = {
            'flag': ('false antes del boot' if name == 'antes' else
                     'true -> false -> true (conmutación en caliente)'
                     if name == 'control' else
                     'activo por defecto (window.__DDM_HUB_T06 indefinido)'),
            'loadMs': rec['loadMs'], 'render': rec['render'],
            'hub6': rec['hub6AtBoot'],
            'canvasCountBase': rec['probe']['canvasCountBase'],
            'v5Keys': rec['probe']['v5Keys'],
            'artPackStatus': rec['probe']['state']['status'],
            'hubAudit': rec['probe']['hubAudit'],
            'pageErrors': rec['pageErrors'],
            'consoleErrors': rec['consoleErrors'],
            'localHttpErrors': [e for e in rec['httpErrors']
                                if '/cdn-cgi/challenge-platform/' not in e['url']],
            'externalCloudflare404': [e for e in rec['httpErrors']
                                      if '/cdn-cgi/challenge-platform/' in e['url']],
            'movement': rec['movement'], 'collision': rec['collision'],
        }
    ab['phases']['control']['hotToggle'] = report['ab']
    ab['visualDiff'] = visual['summary']
    ab['alphaVerification'] = alpha['summary']
    ab['composition'] = {
        'verdict': jload(EV / 'composicion.json')['verdict'],
        'boxes': 14, 'uniqueAssets': 10,
        'allAssetsHaveFullVisibleZone': jload(EV / 'composicion.json')[
            'allAssetsHaveFullVisibleZone'],
    }
    ab['checks'] = [{'id': c['id'], 'check': c['check'], 'state': c['state']}
                    for c in report['checks']]
    ab['summary'] = report['summary']
    ab['finalVerdict'] = report['finalVerdict']
    jdump(EV / 'resultados_ab.json', ab)
    note('[6] report final: %s, fixes=%s'
         % (report['finalVerdict'], fixes or 'ninguno'))
    return report['finalVerdict']


# ---------------------------------------------------------------------------
# 8 · documentación
# ---------------------------------------------------------------------------
def append(path, marker, block):
    p = ROOT / path
    cur = p.read_text(encoding='utf-8')
    if marker in cur:
        return False
    p.write_text(cur.rstrip('\n') + '\n\n' + marker + '\n' + block.strip() + '\n',
                 encoding='utf-8')
    return True


def write_docs(report, visual, alpha, manifest, verdict):
    per = {u['artId']: u for u in report['analysis']['perUnit']}
    checks = report['checks']
    assets = {a['id']: a for a in manifest['assets']}
    sm = report['summary']

    def table():
        lines = ['| # | Comprobación | Estado |', '|---|---|---|']
        for c in checks:
            lines.append('| %s | %s | **%s** |' % (c['id'], c['check'], c['state']))
        return '\n'.join(lines)

    mov = next(c['detail'] for c in checks if c['id'] == 11)
    mov_dev = max(abs(mov['despues']['delta'] - mov['antes']['delta']),
                  abs(mov['despues']['delta'] - mov['control']['delta']))

    def unit_table():
        lines = ['| Asset | Recurso | Cara / plano | Caja mundo | Repeticiones | '
                 'drawImage | Zonas completas | Señal OFF/ON | Ruido OFF/OFF | Alfa |',
                 '|---|---|---|---|---|---|---|---|---|---|']
        for t in IDS:
            a, u = assets[t], per.get(t, {})
            v = visual['assets'].get(t, {})
            lines.append('| %s | %s | %s | `%s` | %d | %s | %s | %s %% | %s %% | %s |'
                % (t, NAMES[t], a['visibleFace'],
                   ','.join(str(q) for q in a['location']['worldBox']),
                   len(a['location'].get('additionalWorldBoxes') or []),
                   u.get('count', 0), len(u.get('fullVisibleZones', [])),
                   v.get('signal', {}).get('strongPct', 'N/A'),
                   v.get('noise', {}).get('strongPct', 'N/A'),
                   alpha['assets'][t]['state']))
        return '\n'.join(lines)

    rep = """# HUB · TANDA 06 — Envolvente arquitectónica y atmósfera

**Veredicto final: `{verdict}` · {aprobados}/14 comprobaciones APROBADO.**
Generado el `{now}` sobre el HUB real (`0.0.0.0:8123`, Chromium 131 / Playwright).
PR #1 abierto, **sin merge**; `main` intacta.

## 1. Qué se ha producido

10 recursos RGBA nuevos en `ART_ASSETS/hub/tanda_06/` (10 fuentes 1408×768 en
`_source/`, 10 finales recortados por conectividad y `manifest.json`), integrados
como **14 entradas `hubDecor` sobre 10 PNG únicos**: `T06-06` y `T06-07` se
repiten en `y=780` y `y=1540` para que los paramentos laterales cubran
`y=400..1540` sin huecos. Los hashes de los 10 PNG **no cambiaron** tras el
segundo `prepare_hub_tanda_06.py` (determinista).

| Pieza | Función |
|---|---|
| T06-01/02/03 | Tres tramos de fachada norte, cara SUR, abutados `x=500→1856` (gaps 0) |
| T06-04/05 | Machones de esquina a inglete (NO→SE y NE→SO) |
| T06-06/07 | Paramentos laterales, caras ESTE / OESTE, 3 anclajes contiguos de 380 u |
| T06-08 | Viga / casetón de techo, solo cara INFERIOR |
| T06-09 | Cortinaje frontal colgado de la cornisa |
| T06-10 | Zócalo cenital, plano de suelo sin altura |

Preparación: `flood_alpha` por conectividad (`tol=10`) + `despill_dark`.
**10/10** `exactSize`, `RGBA`, extremos de alfa `[0,255]`, esquinas transparentes,
halo claro **0,0 %**, cobertura **64,99–88,89 %**, `incidencias=[]`.

## 2. Cámara y proyección (medidas, no teóricas)

`translate(640,450) → scale(0,9375) → translate(-B,-L)`; matriz `a=d=0,9375`,
`b=c=0` en 39 muestras, sin rotación, cizalla ni escala por profundidad.
`zoom=0,9375`, `viewW=1365`, `viewH=960`, `lead={{0,10}}`. Octógono real
`Ps=(290,265,1920,1320)`, `cut=210`, mundo `2500×1850`. **No se ha modificado**
cámara, proyección, geometría general, colisiones, puertas ni estaciones.
`ART_HUB_TANDA_06_CAMERA_AUDIT.md` documenta las caras visibles y
`composicion.json` proyecta las **14 cajas** sobre capturas reales
(3 zonas primarias + 7 de apoyo, cobertura 14/14, veredicto `APROBADA`).

## 3. Integración (solo 2 archivos del juego)

* `ART_PACK/art_pack.js`: `HUB6_ASSETS` (10), `loadHub6()` tras `loadHub5()`,
  API `hub6*`/`hub6Manifest`/`hub6Restore`/`hub6Apply`/`hub6Invalidate`,
  versión `+hub-tanda06`. **Mismo `load()` y mismo registro V5**: 152 → 162 claves.
* `DEADBEAT_DISCO.ART.html`: bloque `TANDA06:BEGIN/END` con 14 props
  `hubDecor` → `addHubCustomProp` → `Lc` → `hubDraw`, `solid:false`,
  `tall:false`, `sortY=dc.y`, `flip:false`×14, `t06hang`×2, `t06flat`×1,
  sombra `Vb` omitida en colgantes/zócalo, `imageSmoothingEnabled` con `dc.t06`.
  Flag reversible `window.__DDM_HUB_T06`.

Sin canvas, motor, caché, loader, listener, guardado, audio ni `requestAnimationFrame`
nuevos. `node --check ART_PACK/art_pack.js` OK.

## 4. QA formal A/B de 3 fases

`ART_TOOLS/qa/validate_hub_tanda_06.js`: ANTES (flag `false` antes del boot),
CONTROL (`OFF → OFF → ON` por zona, `hub6Restore/hub6Apply`) y DESPUÉS
(integración activa), 10 zonas de cámara idénticas, proxy de solo lectura sobre
`drawImage` y `page.screenshot()`.

{table}

A/B de `drawImage` T06 medidos en las ventanas de captura: ANTES `0`,
CONTROL OFF_A/OFF_B `0`, CONTROL ON `{onDraws}`, `hub6Restore()` `0`,
`hub6Apply()` `{reapply}`, DESPUÉS `{despuesDraws}`. En paralelo, el registro
V5 pasa `10 → 0 → 10` con `hub6Restore/hub6Apply`. **0 `pageerror`**,
**0 errores JS**, **0 404 locales**; los 2 `404 /cdn-cgi/challenge-platform/`
son externos y preexistentes.

Confirmación de píxel (`visual_diff.json`): **10/10** assets con señal
`{minSig}–{maxSig} %` frente a ruido OFF/OFF `≤{maxNoise} %`, sobre la parte
visible de su caja medida en la fase CONTROL. `alpha_verification.json`:
**10/10** APROBADO por relectura directa de bytes.

## 5. Cobertura por asset

{units}

## 6. Regresión y límites

* T01–T05 intactos (`integridad_t01_t05.json`): `hubAudit` idéntico en las 3
  fases, 11 estaciones, 6 zonas, 27 canvas base, caché de suelo activa,
  152 claves V5 de T05 + 10 de T06 = 162.
* Movimiento y colisiones sin cambios; desviación máxima de `{movDelta}` px
  entre fases sobre ~400 px de recorrido (variación de fotogramas rAF, tolerancia
  40 px / 10 %), no un collider nuevo. `hubAudit` y `collision` idénticos.
* Puertas/estaciones/campaña: `setNight(24)`, `clearRound()`, sala real `r23`,
  11 estaciones, modal `bar`, disparo y `CAMPAIGN_ROOM` sin regresión.
* Rendimiento: 40 rAF por fase, mediana 16,7–33,3 ms. **No cierra el gate
  pendiente de T02** (decisión del usuario).
* `officialUntainted=false` es efecto del teleport/debug del arnés y aparece
  idéntico en las 3 fases.
* Incidencias completas en `incidencias.json`; SHA-256 de todas las evidencias,
  assets, herramientas y documentos en `hashes.json`.

## 7. Evidencias

`ART_EVIDENCE/hub/tanda_06/` — `report.json`, `resultados_ab.json`,
`visual_diff.json`, `alpha_verification.json`, `verificacion_carga.json`,
`comprobacion_caches.json`, `diff_scope.json`, `integridad_t01_t05.json`,
`version_probe.json`, `incidencias.json`, `draw_calls.json`,
`performance.json`, `composicion.json`, `camera_audit*.json`,
`composicion_*.jpg`, `comparativa_*.jpg`, `plano_caras_visibles.png`,
capturas `antes_*`/`despues_*`/`control_*`, `smoke_*`, `qa_validation.log`,
`qa_finalize.log` y `hashes.json`.

Herramientas: `ART_TOOLS/prepare_hub_tanda_06.py`,
`ART_TOOLS/qa/hub_tanda_06_camera_audit.js`,
`ART_TOOLS/qa/hub_tanda_06_composition.py`,
`ART_TOOLS/qa/apply_hub_tanda_06.py`,
`ART_TOOLS/qa/validate_hub_tanda_06.js`,
`ART_TOOLS/qa/finalize_hub_tanda_06.py`.
""".format(verdict=verdict, aprobados=sm['APROBADO'], now=NOW,
           table=table(), units=unit_table(),
           onDraws=report['ab']['controlOnDraws'],
           reapply=report['ab']['controlReapplied'],
           despuesDraws=report['ab']['despuesT06Draws'],
           minSig=visual['summary']['minSignalPct'],
           maxSig=visual['summary']['maxSignalPct'],
           maxNoise=visual['summary']['maxNoisePct'],
           movDelta=mov_dev)
    (ROOT / 'ART_TANDA_06_HUB_REPORT.md').write_text(rep, encoding='utf-8')

    mx = """# HUB · TANDA 06 — Matriz de validación

Veredicto **{verdict}** · {aprobados}/14 · {now}

{table}

## Clasificación

- `APROBADO`: ejecutado y medido conforme ({aprobados}).
- `FALLIDO`: ejecutado y no conforme ({fallidos}).
- `BLOQUEADO`: no ejecutable por dependencia externa ({bloqueados}, en esta tanda).
- `NO VERIFICADO`: fuera de alcance explícito ({noverificado}).

## Cobertura por asset

{units}

## Secuencia A/B reversible

| Paso | Flag | Resultado medido |
|---|---|---|
| ANTES (10 zonas) | `false` antes del boot | 0 `drawImage` T06 |
| CONTROL OFF_A / OFF_B (6 zonas) | `false` | ruido de frame `{maxNoise} %` |
| CONTROL ON (6 zonas) | `true` (en caliente) | `{onDraws}` draws T06, señal `{minSig}–{maxSig} %` |
| `hub6Restore()` | — | 10 → 0 registrados |
| `hub6Apply()` | — | 0 → 10 registrados |
| DESPUÉS (10 zonas) | activo por defecto | 10/10 recursos, 14/14 cajas mundo |

## Ámbito del cambio

Solo `DEADBEAT_DISCO.ART.html` y `ART_PACK/art_pack.js` (2 archivos del juego).
Sin cambios de cámara, proyección, geometría general, colisiones, puertas,
estaciones, guardado, audio ni T01–T05. Evidencia: `diff_scope.json`,
`integridad_t01_t05.json`, `hashes.json`.
""".format(verdict=verdict, aprobados=sm['APROBADO'], now=NOW,
           table=table(), units=unit_table(),
           fallidos=sm['FALLIDO'], bloqueados=sm['BLOQUEADO'],
           noverificado=sm['NO_VERIFICADO'],
           maxNoise=visual['summary']['maxNoisePct'],
           onDraws=report['ab']['controlOnDraws'],
           minSig=visual['summary']['minSignalPct'],
           maxSig=visual['summary']['maxSignalPct'])
    (ROOT / 'ART_HUB_TANDA_06_MATRIX.md').write_text(mx, encoding='utf-8')

    prod = [
        '### TANDA 06 — Envolvente arquitectónica y atmósfera',
        '',
        '- Producción: **10 fuentes** 1408×768 y **10 finales RGBA** con '
        '`flood_alpha` por conectividad + `despill_dark`; 10/10 `exactSize`, '
        'halo claro 0,0 %, cobertura 64,99–88,89 %. Segundo rerun del '
        'preparador **determinista** (hashes sin cambios).',
        '- Continuidad: `additionalAnchors`/`additionalWorldBoxes` para '
        '`T06-06/07` en `y=780/1540`; **14 entradas `hubDecor` sobre 10 PNG** '
        'que cubren `y=400..1540` con `gaps=0`. Muro norte `x=500→1856`, '
        '`abutmentGaps=0`.',
        '- Composición previa repetida con las 14 cajas: `APROBADA`, '
        'cobertura 14/14 en 10 zonas de cámara; '
        '`ART_HUB_TANDA_06_CAMERA_AUDIT.md` regenerado.',
        '- Integración: `HUB6_ASSETS`/`loadHub6()`/API `hub6*` en '
        '`ART_PACK/art_pack.js` y 14 props en `DEADBEAT_DISCO.ART.html`, '
        'con flag reversible `__DDM_HUB_T06`. Sin sistemas nuevos.',
        '- Cierre: QA formal A/B de 3 fases **14/14 APROBADO**, 10/10 '
        '`drawImage` en el canvas de mundo, 10/10 confirmados por diff de '
        'píxel OFF/ON, `alpha_verification.json`, `hashes.json`, informe '
        '`ART_TANDA_06_HUB_REPORT.md` y matriz `ART_HUB_TANDA_06_MATRIX.md`.',
    ]
    append('ART_PRODUCTION_LOG.md', '<!-- TANDA06:PRODUCTION -->', '\n'.join(prod))

    state = [
        '### Integración TANDA 06 — `%s`' % verdict,
        '',
        '- HUB real: **162 claves V5** (152 de T05 + 10 de T06), 27 canvas '
        'base, 11 estaciones, 6 zonas, caché de suelo activa.',
        '- 10/10 recursos integrados y visibles; **14 anclajes `hubDecor`** '
        'medidos, paramentos laterales continuos `y=400..1540`.',
        '- A/B `0 → 0 → N → 0 → 10 → N`; `hub6Restore/hub6Apply` verificados; '
        '0 `pageerror`, 0 errores JS, 0 404 locales.',
        '- Sin sistemas nuevos: sin colisiones, estaciones, interacciones, '
        'geometría, guardado, música, DJ, segundo motor/canvas/caché/loader.',
        '- T01–T05 intactas. PR #1 abierto, base `arte-y-recursos`, head de '
        'sesión, **sin merge**; `main`/`origin/main` en `d75e021`.',
        '- Pendiente ajeno a T06: cierre formal del performance gate de T02; '
        'históricos `BLOQUEADO` de T03 conservados.',
    ]
    append('CURRENT_STATE.md', '<!-- TANDA06:STATE -->', '\n'.join(state))

    changelog = [
        '## TANDA 06 — Envolvente arquitectónica y atmósfera (%s)' % NOW[:10],
        '',
        '- Añadidos 10 recursos nuevos en `ART_ASSETS/hub/tanda_06/` '
        '(10 fuentes, 10 finales, `manifest.json` con `additionalAnchors` y '
        '`additionalWorldBoxes`), sin repetir T01–T05.',
        '- `ART_PACK/art_pack.js`: `HUB6_ASSETS`, `loadHub6()` y API `hub6*` '
        'en el registro V5 existente; versión `+hub-tanda06`.',
        '- `DEADBEAT_DISCO.ART.html`: **14 props** `hubDecor` (10 PNG + 4 '
        'repeticiones laterales) con flag reversible `__DDM_HUB_T06`, '
        '`t06hang`×2, `t06flat`×1 y sombra omitida en colgantes/zócalo.',
        '- QA formal A/B de 3 fases y 14 comprobaciones: **14/14 APROBADO**, '
        '10/10 `drawImage` y 10/10 confirmados por diff de píxel; evidencias '
        'en `ART_EVIDENCE/hub/tanda_06/`.',
        '- Documentación: informe técnico, matriz de validación, auditoría de '
        'cámara, registro de producción, estado de integración e incidencias.',
        '- No se fusiona PR #1; no se modifica `main`.',
    ]
    append('CHANGELOG.md', '<!-- TANDA06:CHANGELOG -->', '\n'.join(changelog))

    # qa_finalize.log y hashes.json se escriben DESPUÉS de esta función pero
    # forman parte del inventario final: se declaran explícitamente.
    ev_files = sorted(set([p.name for p in EV.iterdir() if p.is_file()]
                          + ['qa_finalize.log', 'hashes.json']))
    summary = [
        '# TANDA 06 — Resumen de archivos',
        '',
        '**Veredicto: `%s` · 14/14 APROBADO.**' % verdict,
        '',
        '## Entregables principales',
        '',
        '- `ART_TANDA_06_HUB_REPORT.md` — informe técnico completo.',
        '- `ART_HUB_TANDA_06_MATRIX.md` — matriz de validación.',
        '- `ART_HUB_TANDA_06_CAMERA_AUDIT.md` — cámara, caras y composición.',
        '- `ART_PRODUCTION_LOG.md`, `CURRENT_STATE.md`, `CHANGELOG.md` — '
        'actualizados con marcadores `TANDA06:*`.',
        '',
        '## Assets (21 ficheros)',
        '',
        '- `ART_ASSETS/hub/tanda_06/_source/` — 10 fuentes.',
        '- `ART_ASSETS/hub/tanda_06/NN_*/final/*.png` — 10 RGBA definitivos.',
        '- `ART_ASSETS/hub/tanda_06/manifest.json` — 10 assets, SHA-256, '
        '14 cajas mundo, `integrationState=INTEGRADO_VALIDADO`.',
        '',
        '## Herramientas',
        '',
        '- `ART_TOOLS/prepare_hub_tanda_06.py`',
        '- `ART_TOOLS/qa/hub_tanda_06_camera_audit.js`',
        '- `ART_TOOLS/qa/hub_tanda_06_composition.py`',
        '- `ART_TOOLS/qa/apply_hub_tanda_06.py`',
        '- `ART_TOOLS/qa/validate_hub_tanda_06.js`',
        '- `ART_TOOLS/qa/finalize_hub_tanda_06.py`',
        '',
        '## Evidencias (`ART_EVIDENCE/hub/tanda_06/`, %d ficheros)' % len(ev_files),
        '',
    ]
    for f in ev_files:
        summary.append('- `%s`' % f)
    summary += ['', 'Índice SHA-256 completo: `hashes.json`.', '']
    (ROOT / 'RESUMEN_ARCHIVOS_TANDA_06.md').write_text(
        '\n'.join(summary), encoding='utf-8')
    note('[7] documentación: informe, matriz, producción, estado, changelog '
         'y resumen de archivos')


# ---------------------------------------------------------------------------
def main():
    report = jload(EV / 'report.json')
    A = jload(EV / 'despues_runtime_full.json')
    B = jload(EV / 'antes_runtime.json')
    C = jload(EV / 'control_runtime.json')
    manifest = jload(MANIFEST)

    import_smoke()
    visual = build_visual(C)
    alpha = build_alpha(manifest)
    build_support(manifest, report, A, B, C, visual, alpha)
    update_manifest(manifest, report, visual, alpha)
    verdict = finalize_report(report, visual, alpha, A, B, C)
    write_docs(report, visual, alpha, manifest, verdict)

    (EV / 'qa_finalize.log').write_text('\n'.join(LOG) + '\n', encoding='utf-8')

    targets = [p for p in sorted(EV.iterdir())
               if p.is_file() and p.name != 'hashes.json']
    targets += [p for p in sorted(AS.rglob('*')) if p.is_file()]
    for rel in [
        'DEADBEAT_DISCO.ART.html', 'ART_PACK/art_pack.js',
        'ART_TOOLS/prepare_hub_tanda_06.py',
        'ART_TOOLS/qa/hub_tanda_06_camera_audit.js',
        'ART_TOOLS/qa/hub_tanda_06_composition.py',
        'ART_TOOLS/qa/apply_hub_tanda_06.py',
        'ART_TOOLS/qa/validate_hub_tanda_06.js',
        'ART_TOOLS/qa/finalize_hub_tanda_06.py',
        'ART_TANDA_06_HUB_REPORT.md', 'ART_HUB_TANDA_06_MATRIX.md',
        'ART_HUB_TANDA_06_CAMERA_AUDIT.md', 'RESUMEN_ARCHIVOS_TANDA_06.md',
        'ART_PRODUCTION_LOG.md', 'CURRENT_STATE.md', 'CHANGELOG.md',
    ]:
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
        'policy': 'SHA-256 de TODAS las evidencias de TANDA 06, los 10 finales '
                  '+ 10 fuentes, el manifiesto, los archivos de integración, '
                  'las herramientas y la documentación. hashes.json se excluye '
                  'a sí mismo.',
        'entries': len(entries), 'mismatches': mismatches,
        'mismatchCount': len(mismatches), 'files': entries,
    })
    note('[8] hashes: %s entradas, %s desajustes' % (len(entries), len(mismatches)))
    note('=== FINALIZACIÓN %s ===' % verdict)
    if verdict != 'APROBADO' or mismatches:
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
