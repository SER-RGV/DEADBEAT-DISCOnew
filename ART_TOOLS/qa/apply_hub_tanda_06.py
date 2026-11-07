#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HUB · TANDA 06 · aplicación de integración MÍNIMA y REVERSIBLE.
==================================================================
Conecta los 10 PNG al registro V5 existente (load()) y al array real
`hubDecor -> addHubCustomProp -> Lc -> hubDraw` del HTML activo. No crea
canvas, loader, motor, caché ni sistema de dibujo nuevo; no toca cámara,
proyección, geometría general, colisiones, puertas, estaciones ni progresión.

Idempotente: si ya está aplicado, no vuelve a insertar. Backups en /tmp/t6.
Uso: python3 ART_TOOLS/qa/apply_hub_tanda_06.py
"""
from __future__ import annotations

import json, os, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HTML = ROOT / 'DEADBEAT_DISCO.ART.html'
JS = ROOT / 'ART_PACK' / 'art_pack.js'
MAN = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_06' / 'manifest.json'
TMP = Path('/tmp/t6')
TMP.mkdir(parents=True, exist_ok=True)

manifest = json.loads(MAN.read_text(encoding='utf-8'))
assets = manifest['assets']
assert len(assets) == 10, 'se requieren exactamente 10 assets'


def backup(p: Path, tag: str):
    dst = TMP / (p.name + '.PRE_T06.' + tag)
    if not dst.exists():
        shutil.copy2(p, dst)
    return dst


def js_asset_lines():
    out = []
    for a in assets:
        loc, anc = a['location'], a['anchor']
        out.append(
            "    { id: '%s', unit: '%s', file: '%s', w: %d, h: %d, alias: '%s',\n"
            "      x: %d, y: %d, worldH: %d, category: '%s' }," %
            (a['id'], a['name'], a['file'].replace('ART_ASSETS/hub/tanda_06/', ''),
             a['width'], a['height'], a['alias'],
             loc['x'], loc['y'], anc['worldH'], a['category'].replace("'", "\\'")))
    return '\n'.join(out)


JS_BLOCK = """
  /* === TANDA06:BEGIN · HUB6_* (mismo load(), mismo registro V5) =============
     Envolvente arquitectónica T06. Se encadena tras loadHub5() usando el MISMO
     cargador load() y el MISMO registro window.__DDM_V5_IMG. restoreHub6()
     solo deshace TANDA 06; no afecta a T01/T02/T03/T04/T05.
     ======================================================================*/
  var BASEH6 = 'ART_ASSETS/hub/tanda_06/';
  var HUB6_ASSETS = [
%s
  ];
  var HUB6_IMAGES = {};
  var HUB6_ORIGINALS = {};
  var hub6Applied = false;

  function hub6Err(where, e) {
    var msg = where + ': ' + (e && (e.message || e.type) || String(e));
    if (!st.hub6Errors) st.hub6Errors = [];
    st.hub6Errors.push(msg);
    try { console.warn('[ART_PACK/HUB6] ' + msg); } catch (_) {}
  }

  function hub6Invalidate() {
    try {
      if (window.DMO_INFERNAL_ART &&
          typeof window.DMO_INFERNAL_ART.invalidate === 'function') {
        window.DMO_INFERNAL_ART.invalidate();
      }
    } catch (e) { hub6Err('invalidate', e); }
    try { window.__DDM_V5_MED_NO_SKULL = null; } catch (_) {}
    try {
      if (window.__T3B && typeof window.__T3B.setEnabled === 'function') {
        window.__T3B.setEnabled(true);
      }
    } catch (e) { hub6Err('setEnabled', e); }
  }

  function applyHub6() {
    var reg = window.__DDM_V5_IMG;
    if (!reg) { hub6Err('HUB6', '__DDM_V5_IMG no disponible'); return 0; }
    var n = 0;
    HUB6_ASSETS.forEach(function (a) {
      var im = HUB6_IMAGES[a.id];
      if (!im) return;
      try { im.__hubTanda06 = a.id; } catch (_) {}
      if (!Object.prototype.hasOwnProperty.call(HUB6_ORIGINALS, a.alias)) {
        HUB6_ORIGINALS[a.alias] = reg[a.alias];
      }
      reg[a.alias] = im;
      n++;
    });
    hub6Applied = (n === HUB6_ASSETS.length);
    hub6Invalidate();
    st.hub6 = {
      version: 'hub-tanda06', count: HUB6_ASSETS.length,
      productionUnits: HUB6_ASSETS.length, files: HUB6_ASSETS.length,
      registered: n, enabled: hub6Applied,
      loader: 'load() -> __DDM_V5_IMG[alias h06_*]',
      renderer: 'DEADBEAT_DISCO.ART.html :: hubDecor -> addHubCustomProp -> Lc',
      flag: 'window.__DDM_HUB_T06 !== false',
      note: '10/10 PNG de envolvente cargados y registrados. Sin segundo motor, '
          + 'sin canvas adicional, sin cambio de camara ni proyeccion.',
      appliedAt: Date.now()
    };
    return n;
  }

  function restoreHub6() {
    var reg = window.__DDM_V5_IMG, n = 0;
    if (reg) {
      HUB6_ASSETS.forEach(function (a) {
        if (!Object.prototype.hasOwnProperty.call(HUB6_ORIGINALS, a.alias)) return;
        reg[a.alias] = HUB6_ORIGINALS[a.alias];
        if (reg[a.alias] === undefined) delete reg[a.alias];
        n++;
      });
    }
    hub6Applied = false;
    if (st.hub6) { st.hub6.enabled = false; st.hub6.registered = 0; }
    hub6Invalidate();
    return n;
  }

  function loadHub6(done) {
    var pending = HUB6_ASSETS.length;
    HUB6_ASSETS.forEach(function (a) {
      var rec = { id: a.id, file: BASEH6 + a.file, expected: [a.w, a.h],
                  loaded: false, natural: null, exactSize: false };
      load(rec.file, rec, function (im) {
        if (im) {
          HUB6_IMAGES[a.id] = im;
          if (!rec.exactSize) hub6Err(a.id, 'dimensiones inesperadas ' + rec.natural);
        } else {
          hub6Err(a.id, 'no se pudo decodificar ' + rec.file);
        }
        if (--pending === 0) done(applyHub6());
      });
    });
  }

  function hub6() {
    var reg = window.__DDM_V5_IMG || {}, get = window.__DDM_GET_V5;
    var list = HUB6_ASSETS.map(function (a) {
      var im = HUB6_IMAGES[a.id] || null;
      var resolves = 0;
      try { if (typeof get === 'function' && get(a.alias) === im) resolves = 1; } catch (_) {}
      return {
        id: a.id, unit: a.unit, file: BASEH6 + a.file, alias: a.alias,
        aliasLive: !!(im && reg[a.alias] === im), loaderResolves: resolves,
        expected: [a.w, a.h], natural: im ? [im.naturalWidth, im.naturalHeight] : null,
        exactSize: !!im && im.naturalWidth === a.w && im.naturalHeight === a.h,
        loaded: !!im, registered: !!(im && reg[a.alias] === im),
        worldBox: [a.x - (Math.round(a.worldH * a.w / a.h) >> 1),
                   a.y - a.worldH, Math.round(a.worldH * a.w / a.h), a.worldH],
        originalsPreserved: Object.prototype.hasOwnProperty.call(HUB6_ORIGINALS, a.alias) &&
                            HUB6_ORIGINALS[a.alias] !== im
      };
    });
    return {
      version: 'hub-tanda06', count: HUB6_ASSETS.length,
      productionUnits: HUB6_ASSETS.length, enabled: hub6Applied,
      registered: list.filter(function (a) { return a.registered; }).length,
      loaded: list.filter(function (a) { return a.loaded; }).length,
      exactSize: list.filter(function (a) { return a.exactSize; }).length,
      errors: (st.hub6Errors || []).slice(), assets: list,
      note: '10/10 PNG de TANDA 06 en el MISMO registro V5 y MISMO load().'
    };
  }

  function hub6Tag() {
    HUB6_ASSETS.forEach(function (a) {
      var im = HUB6_IMAGES[a.id];
      if (im) { try { im.__hubTanda06 = a.id; } catch (_) {} }
    });
    return HUB6_ASSETS.length;
  }
  function hub6Restore() { return restoreHub6(); }
  function hub6Apply() { return hub6Applied ? HUB6_ASSETS.length : applyHub6(); }
  /* === TANDA06:END ========================================================*/
""" % js_asset_lines()


def html_decor_lines():
    """10 recursos + 4 anclajes repetidos de los paramentos laterales.

    T06-06/07 se repiten en y=780 y y=1540 para que la arista real
    (y=475…1375) quede cubierta sin huecos; siguen siendo 10 PNG distintos.
    """
    rows = []
    for i, a in enumerate(assets):
        anc, loc = a['anchor'], a['location']
        extra = ''
        if anc['t06hang']:
            extra += ', t06hang: true'
        if anc['t06flat']:
            extra += ', t06flat: true'
        rows.append(
            '          { id: "hub_decor_t06_%02d", slot: "%s", x: %d, y: %d, '
            'h: %d, flip: false, t06: "%s"%s }' %
            (i + 1, a['alias'], loc['x'], loc['y'], anc['worldH'], a['id'], extra))
    for a in assets:
        if a['id'] not in ('T06-06', 'T06-07'):
            continue
        for j, q in enumerate(a['location']['additionalAnchors']):
            rows.append(
                '          { id: "hub_decor_%s_rep%d", slot: "%s", x: %d, y: %d, '
                'h: %d, flip: false, t06: "%s" }' %
                (a['id'].lower().replace('-', '_'), j + 1, a['alias'],
                 q['x'], q['y'], a['anchor']['worldH'], a['id']))
    return ',\n'.join(rows)


def apply_js():
    s = JS.read_text(encoding='utf-8')
    if 'TANDA06:BEGIN · HUB6_*' in s:
        print('JS: ya aplicado, sin cambios')
        return
    backup(JS, 'js')
    anchor = "  function hub5Apply() { return hub5Applied ? HUB5_ASSETS.length : applyHub5(); }\n"
    assert s.count(anchor) == 1, 'ancla HUB5 no encontrada'
    s = s.replace(anchor, anchor + JS_BLOCK, 1)

    old_ver = "fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02+hub-tanda03+hub-tanda05"
    assert s.count(old_ver) == 1
    s = s.replace(old_ver, old_ver + '+hub-tanda06', 1)

    old_chain = """                /* TANDA05:BEGIN · mismo load(), encadenado tras HUB-02 */
                loadHub5(function (k5) {
                  st.status = (st.errors.length || (st.archErrors || []).length ||
                               (st.hubErrors || []).length || (st.hub2Errors || []).length ||
                               (st.hub3Errors || []).length || (st.hub5Errors || []).length)
                    ? 'applied-with-errors' : 'applied';
                  st.finishedAt = Date.now();
                });
                /* TANDA05:END */"""
    assert s.count(old_chain) == 1, 'cadena loadHub5 no encontrada'
    new_chain = """                /* TANDA05:BEGIN · mismo load(), encadenado tras HUB-02 */
                loadHub5(function (k5) {
                  /* TANDA06:BEGIN · mismo load(), encadenado tras TANDA 05 */
                  loadHub6(function (k6) {
                    st.status = (st.errors.length || (st.archErrors || []).length ||
                                 (st.hubErrors || []).length || (st.hub2Errors || []).length ||
                                 (st.hub3Errors || []).length || (st.hub5Errors || []).length ||
                                 (st.hub6Errors || []).length)
                      ? 'applied-with-errors' : 'applied';
                    st.finishedAt = Date.now();
                  });
                  /* TANDA06:END */
                });
                /* TANDA05:END */"""
    s = s.replace(old_chain, new_chain, 1)

    old_exp = """    hub5: hub5, hub5Manifest: function () { return JSON.parse(JSON.stringify(HUB5_ASSETS)); },
    hub5Restore: hub5Restore, hub5Apply: hub5Apply, hub5Tag: hub5Tag,"""
    assert s.count(old_exp) == 1, 'exports HUB5 no encontrados'
    new_exp = old_exp + """
    hub6: hub6, hub6Manifest: function () { return JSON.parse(JSON.stringify(HUB6_ASSETS)); },
    hub6Restore: hub6Restore, hub6Apply: hub6Apply, hub6Tag: hub6Tag,"""
    s = s.replace(old_exp, new_exp, 1)
    JS.write_text(s, encoding='utf-8')
    print('JS: HUB6 insertado |', len(s), 'bytes')


def apply_html():
    s = HTML.read_text(encoding='utf-8')
    if 'TANDA06:BEGIN · 10 props de envolvente' in s:
        print('HTML: ya aplicado, sin cambios')
        return
    backup(HTML, 'html')
    last_t05 = '          { id: "hub_decor_t05_10", slot: "h05_confesionario", x: 1715, y: 700, h: 150, flip: false, t05: "T05-10" }\n          /* === TANDA05:END === */'
    assert s.count(last_t05) == 1, 'ultimo prop T05 no encontrado'
    new_decor = ('          { id: "hub_decor_t05_10", slot: "h05_confesionario", '
                 'x: 1715, y: 700, h: 150, flip: false, t05: "T05-10" },\n'
                 '          /* === TANDA05:END === */\n'
                 '          /* === TANDA06:BEGIN · 10 props de envolvente en el array REAL hubDecor ===\n'
                 '             Renderer existente addHubCustomProp -> Lc (Y-sort, solid:false, tall:false).\n'
                 '             Coordenadas/anchos MEDIDOS en manifest.json y composicion.json; caras\n'
                 '             visibles segun la auditoria de camara. t06hang = sin sombra de suelo\n'
                 '             (viga/cortinaje); t06flat = plano de suelo sin altura (zocalo).\n'
                 '             Flag reversible window.__DDM_HUB_T06. Sin colisiones ni geometria nueva. */\n'
                 + html_decor_lines() + '\n'
                 '          /* === TANDA06:END === */')
    s = s.replace(last_t05, new_decor, 1)

    flag_anchor = """              /* TANDA05:BEGIN · reversibilidad A/B de TANDA 05 */
              if (dc.t05 && window.__DDM_HUB_T05 === false) return;
              /* TANDA05:END */"""
    assert s.count(flag_anchor) == 1, 'flag T05 no encontrado'
    s = s.replace(flag_anchor, flag_anchor + """
              /* TANDA06:BEGIN · reversibilidad A/B de TANDA 06 */
              if (dc.t06 && window.__DDM_HUB_T06 === false) return;
              /* TANDA06:END */""", 1)

    old_smooth = '              ctx.save(); ctx.imageSmoothingEnabled = !!(dc.t04 || dc.t05); /* TANDA04/05: arte pintado, no pixel art */'
    assert s.count(old_smooth) == 1, 'imageSmoothing no encontrado'
    s = s.replace(old_smooth,
                  '              ctx.save(); ctx.imageSmoothingEnabled = !!(dc.t04 || dc.t05 || dc.t06); /* TANDA04/05/06: arte pintado, no pixel art */', 1)

    old_shadow = '              if (!dc.t05hang) Vb(ctx, p.x, p.y + 4, Math.round(dw * 0.8), 10); /* TANDA05: sin sombra en objetos colgantes */'
    assert s.count(old_shadow) == 1, 'sombra T05 no encontrada'
    s = s.replace(old_shadow,
                  '              if (!dc.t05hang && !dc.t06hang && !dc.t06flat) Vb(ctx, p.x, p.y + 4, Math.round(dw * 0.8), 10); /* TANDA05/06: sin sombra en colgantes ni plano de suelo */', 1)

    old_draw = """              if (dc.flip) { ctx.translate(p.x + (dw >> 1), p.y - dh); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, dw, dh); }
              else ctx.drawImage(im, p.x - (dw >> 1), p.y - dh, dw, dh);"""
    assert s.count(old_draw) == 1, 'drawImage de hubDraw no encontrado'
    new_draw = """              /* TANDA06:BEGIN · plano de SUELO: centrado en (x,y), sin altura ni sombra */
              if (dc.t06flat) ctx.drawImage(im, p.x - (dw >> 1), p.y - (dh >> 1), dw, dh);
              /* TANDA06:END */
              else if (dc.flip) { ctx.translate(p.x + (dw >> 1), p.y - dh); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, dw, dh); }
              else ctx.drawImage(im, p.x - (dw >> 1), p.y - dh, dw, dh);"""
    s = s.replace(old_draw, new_draw, 1)
    HTML.write_text(s, encoding='utf-8')
    print('HTML: 10 hubDecor + flag + t06hang/t06flat insertados |', len(s), 'bytes')


def verify():
    s_html = HTML.read_text(encoding='utf-8')
    s_js = JS.read_text(encoding='utf-8')
    checks = {
        'JS HUB6_BEGIN': s_js.count('TANDA06:BEGIN · HUB6_*'),
        'JS HUB6_END': s_js.count('TANDA06:END ===='),
        'JS loadHub6': s_js.count('loadHub6(function (k6)'),
        'JS exports': s_js.count('hub6Restore: hub6Restore'),
        'JS version': s_js.count('+hub-tanda06'),
        'HTML decor BEGIN': s_html.count('TANDA06:BEGIN · 10 props de envolvente'),
        'HTML decor END': s_html.count('/* === TANDA06:END === */'),
        'HTML t06 entries': s_html.count('t06: "T06-'),
        'HTML flag': s_html.count('dc.t06 && window.__DDM_HUB_T06 === false'),
        'HTML t06hang': s_html.count('t06hang: true'),
        'HTML t06flat': s_html.count('t06flat: true'),
        'HTML flat draw': s_html.count('if (dc.t06flat) ctx.drawImage'),
    }
    for k, v in checks.items():
        print('  %-22s %d' % (k, v))
    assert checks['JS HUB6_BEGIN'] == 1 and checks['JS loadHub6'] == 1
    assert checks['HTML t06 entries'] == 14, '10 recursos + 4 repeticiones laterales'
    assert checks['HTML flag'] == 1 and checks['HTML flat draw'] == 1
    assert checks['HTML t06hang'] == 2 and checks['HTML t06flat'] == 1
    uniq = set()
    for line in s_html.splitlines():
        if 't06: "T06-' in line:
            uniq.add(line.split('t06: "')[1].split('"')[0])
    print('  %-22s %d' % ('HTML ids unicos', len(uniq)))
    assert len(uniq) == 10, 'deben seguir siendo exactamente 10 recursos'
    print('VERIFICACION DE MARCADORES: OK')


if __name__ == '__main__':
    apply_js()
    apply_html()
    verify()
