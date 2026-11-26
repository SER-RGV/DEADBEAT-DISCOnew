#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HUB · TANDA 05 — integración mínima, localizada y REVERSIBLE.

Dos archivos, ningún motor nuevo:

  ART_PACK/art_pack.js
    · bloque HUB5_* independiente: 10 PNG en el MISMO registro
      window.__DDM_V5_IMG con el MISMO load() y las MISMAS invalidaciones.
    · loadHub5() se encadena DESPUÉS de loadHub2() en run().
    · API de solo lectura hub5/hub5Restore/hub5Apply/hub5Tag/hub5Manifest.
    · versión de state() ampliada con +hub-tanda05.

  DEADBEAT_DISCO.ART.html
    · 10 entradas nuevas en el array REAL hubDecor (renderer
      addHubCustomProp -> Lc, solid:false, tall:false, Y-sort por sortY).
    · flag window.__DDM_HUB_T05 !== false para la comparativa A/B.
    · pulso ambiental con globalAlpha del ctx YA existente (sin sistema de
      animación nuevo) y sin sombra de suelo en los 4 objetos colgantes.
    · imageSmoothingEnabled para arte pintado (T04/T05).

El manifiesto es la ÚNICA fuente de verdad: rutas, tamaños y anclajes se
leen de ART_ASSETS/hub/tanda_05/manifest.json. No se tocan gameplay,
colisiones, geometría, puertas, estaciones, música, DJ, HUD, guardado,
progresión, inventario, economía ni combate.

Uso:
  python3 ART_TOOLS/qa/apply_hub_tanda_05.py
  python3 ART_TOOLS/qa/apply_hub_tanda_05.py --restore
"""
from __future__ import annotations

import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HTML = ROOT / 'DEADBEAT_DISCO.ART.html'
JS = ROOT / 'ART_PACK' / 'art_pack.js'
MANIFEST = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_05' / 'manifest.json'
BACKUP = Path('/tmp/t5')

HANGING = {'T05-04', 'T05-06', 'T05-07', 'T05-08'}


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def js_assets(assets) -> str:
    lines = []
    for a in assets:
        lines.append(
            "    { id: '%s', unit: '%s', file: '%s', w: %d, h: %d, alias: '%s',\n"
            "      x: %d, y: %d, worldH: %d, category: '%s' }," %
            (a['id'], a['name'],
             a['file'].replace('ART_ASSETS/hub/tanda_05/', ''),
             a['width'], a['height'], a['alias'],
             a['anchor']['x'], a['anchor']['y'], a['anchor']['worldH'],
             a['category'].replace("'", '')))
    return '\n'.join(lines)


def html_decor(assets) -> str:
    lines = []
    for i, a in enumerate(assets, 1):
        an = a['anchor']
        bits = ['id: "hub_decor_t05_%02d"' % i, 'slot: "%s"' % a['alias'],
                'x: %d' % an['x'], 'y: %d' % an['y'], 'h: %d' % an['worldH'],
                'flip: %s' % ('true' if an['flip'] else 'false'),
                't05: "%s"' % a['id']]
        if an['pulse'] is not None:
            bits.append('pulse: %s' % an['pulse'])
        if a['id'] in HANGING:
            bits.append('t05hang: true')
        lines.append('          { ' + ', '.join(bits) + ' }' +
                     (',' if i < len(assets) else ''))
    return '\n'.join(lines)


HUB5_BLOCK = '''  /* ======================================================================
   * HUB · TANDA 05 — EQUIPAMIENTO, VIDA AMBIENTAL E INTERACTIVIDAD
   * ----------------------------------------------------------------------
   * 10 assets NUEVos registrados en el MISMO window.__DDM_V5_IMG con el
   * MISMO load() y las MISMAS APIs de invalidacion (DMO_INFERNAL_ART,
   * __DDM_V5_MED_NO_SKULL, __T3B.setEnabled). No hay segundo registro,
   * segundo loader, canvas alternativo, cache nueva ni sistema de dibujo
   * independiente. El render se conecta en el HTML activo a traves del
   * array YA existente hubDecor -> addHubCustomProp -> Lc.
   *
   * T05 NO crea interacciones: 4 objetos son FUNCIONALES (apariencia de
   * uso) y su sistema de interaccion queda documentado como PROPUESTA.
   * restoreHub5() solo deshace TANDA 05; no afecta a T01/T02/T03/T04.
   * ====================================================================*/

  var BASEH5 = 'ART_ASSETS/hub/tanda_05/';
  var HUB5_ASSETS = [
__ASSETS__
  ];
  var HUB5_IMAGES = {};
  var HUB5_ORIGINALS = {};
  var hub5Applied = false;

  function hub5Err(where, e) {
    var msg = where + ': ' + (e && (e.message || e.type) || String(e));
    if (!st.hub5Errors) st.hub5Errors = [];
    st.hub5Errors.push(msg);
    try { console.warn('[ART_PACK/HUB5] ' + msg); } catch (_) {}
  }

  function hub5Invalidate() {
    try {
      if (window.DMO_INFERNAL_ART &&
          typeof window.DMO_INFERNAL_ART.invalidate === 'function') {
        window.DMO_INFERNAL_ART.invalidate();
      }
    } catch (e) { hub5Err('invalidate', e); }
    try { window.__DDM_V5_MED_NO_SKULL = null; } catch (_) {}
    try {
      if (window.__T3B && typeof window.__T3B.setEnabled === 'function') {
        window.__T3B.setEnabled(true);
      }
    } catch (e) { hub5Err('setEnabled', e); }
  }

  function applyHub5() {
    var reg = window.__DDM_V5_IMG;
    if (!reg) { hub5Err('HUB5', '__DDM_V5_IMG no disponible'); return 0; }
    var n = 0;
    HUB5_ASSETS.forEach(function (a) {
      var im = HUB5_IMAGES[a.id];
      if (!im) return;
      try { im.__hubTanda05 = a.id; } catch (_) {}
      if (!Object.prototype.hasOwnProperty.call(HUB5_ORIGINALS, a.alias)) {
        HUB5_ORIGINALS[a.alias] = reg[a.alias];
      }
      reg[a.alias] = im;
      n++;
    });
    hub5Applied = (n === HUB5_ASSETS.length);
    hub5Invalidate();
    st.hub5 = {
      version: 'hub-tanda05', count: HUB5_ASSETS.length,
      productionUnits: HUB5_ASSETS.length, files: HUB5_ASSETS.length,
      registered: n, enabled: hub5Applied,
      loader: 'load() -> __DDM_V5_IMG[alias h05_*]',
      renderer: 'DEADBEAT_DISCO.ART.html :: hubDecor -> addHubCustomProp -> Lc',
      flag: 'window.__DDM_HUB_T05 !== false',
      note: '10/10 PNG cargados y registrados. Integracion de render en el '
          + 'HUB real por los pintores existentes. Sin segundo motor.',
      appliedAt: Date.now()
    };
    return n;
  }

  function restoreHub5() {
    var reg = window.__DDM_V5_IMG, n = 0;
    if (reg) {
      HUB5_ASSETS.forEach(function (a) {
        if (!Object.prototype.hasOwnProperty.call(HUB5_ORIGINALS, a.alias)) return;
        reg[a.alias] = HUB5_ORIGINALS[a.alias];
        if (reg[a.alias] === undefined) delete reg[a.alias];
        n++;
      });
    }
    hub5Applied = false;
    if (st.hub5) { st.hub5.enabled = false; st.hub5.registered = 0; }
    hub5Invalidate();
    return n;
  }

  function loadHub5(done) {
    var pending = HUB5_ASSETS.length;
    HUB5_ASSETS.forEach(function (a) {
      var rec = { id: a.id, file: BASEH5 + a.file, expected: [a.w, a.h],
                  loaded: false, natural: null, exactSize: false };
      load(rec.file, rec, function (im) {
        if (im) {
          HUB5_IMAGES[a.id] = im;
          if (!rec.exactSize) hub5Err(a.id, 'dimensiones inesperadas ' + rec.natural);
        } else {
          hub5Err(a.id, 'no se pudo decodificar ' + rec.file);
        }
        if (--pending === 0) done(applyHub5());
      });
    });
  }

  function hub5() {
    var reg = window.__DDM_V5_IMG || {}, get = window.__DDM_GET_V5;
    var assets = HUB5_ASSETS.map(function (a) {
      var im = HUB5_IMAGES[a.id] || null;
      var resolves = 0;
      try { if (typeof get === 'function' && get(a.alias) === im) resolves = 1; } catch (_) {}
      return {
        id: a.id, unit: a.unit, file: BASEH5 + a.file, alias: a.alias,
        aliasLive: !!(im && reg[a.alias] === im), loaderResolves: resolves,
        expected: [a.w, a.h], natural: im ? [im.naturalWidth, im.naturalHeight] : null,
        exactSize: !!im && im.naturalWidth === a.w && im.naturalHeight === a.h,
        loaded: !!im, registered: !!(im && reg[a.alias] === im),
        worldBox: [a.x - (Math.round(a.worldH * a.w / a.h) >> 1),
                   a.y - a.worldH, Math.round(a.worldH * a.w / a.h), a.worldH],
        originalsPreserved: Object.prototype.hasOwnProperty.call(HUB5_ORIGINALS, a.alias) &&
                            HUB5_ORIGINALS[a.alias] !== im
      };
    });
    return {
      version: 'hub-tanda05', count: HUB5_ASSETS.length,
      productionUnits: HUB5_ASSETS.length, enabled: hub5Applied,
      registered: assets.filter(function (a) { return a.registered; }).length,
      loaded: assets.filter(function (a) { return a.loaded; }).length,
      exactSize: assets.filter(function (a) { return a.exactSize; }).length,
      errors: (st.hub5Errors || []).slice(), assets: assets,
      note: '10/10 PNG de TANDA 05 en el MISMO registro V5 y MISMO load(). '
          + 'El render se mide en el HUB con drawImage por unidad.'
    };
  }

  function hub5Tag() {
    HUB5_ASSETS.forEach(function (a) {
      var im = HUB5_IMAGES[a.id];
      if (im) { try { im.__hubTanda05 = a.id; } catch (_) {} }
    });
    return HUB5_ASSETS.length;
  }
  function hub5Restore() { return restoreHub5(); }
  function hub5Apply() { return hub5Applied ? HUB5_ASSETS.length : applyHub5(); }

'''


def build_pairs(assets):
    js_pairs = []
    html_pairs = []

    # --- JS 1: versión de state() ---
    js_pairs.append((
        "    version: 'fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02+hub-tanda03',",
        "    version: 'fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02+hub-tanda03+hub-tanda05',"))

    # --- JS 2: cadena de carga ---
    old_chain = """              loadHub2(function (m) {
                st.status = (st.errors.length || (st.archErrors || []).length ||
                             (st.hubErrors || []).length || (st.hub2Errors || []).length ||
                             (st.hub3Errors || []).length)
                  ? 'applied-with-errors' : 'applied';
                st.finishedAt = Date.now();
              });"""
    new_chain = """              loadHub2(function (m) {
                /* TANDA05:BEGIN · mismo load(), encadenado tras HUB-02 */
                loadHub5(function (k5) {
                  st.status = (st.errors.length || (st.archErrors || []).length ||
                               (st.hubErrors || []).length || (st.hub2Errors || []).length ||
                               (st.hub3Errors || []).length || (st.hub5Errors || []).length)
                    ? 'applied-with-errors' : 'applied';
                  st.finishedAt = Date.now();
                });
                /* TANDA05:END */
              });"""
    js_pairs.append((old_chain, new_chain))

    # --- JS 3: bloque HUB5 tras hub3Apply() ---
    anchor_js = "  function hub3Apply() { return hub3Applied ? HUB3_ASSETS.length : applyHub3(); }\n\n"
    block = HUB5_BLOCK.replace('__ASSETS__', js_assets(assets))
    js_pairs.append((anchor_js, anchor_js + block))

    # --- JS 4: API pública ---
    old_api = """    hub3: hub3, hub3Manifest: function () { return JSON.parse(JSON.stringify(HUB3_ASSETS)); },
    hub3Restore: hub3Restore, hub3Apply: hub3Apply, hub3Tag: hub3Tag,"""
    new_api = """    hub3: hub3, hub3Manifest: function () { return JSON.parse(JSON.stringify(HUB3_ASSETS)); },
    hub3Restore: hub3Restore, hub3Apply: hub3Apply, hub3Tag: hub3Tag,
    hub5: hub5, hub5Manifest: function () { return JSON.parse(JSON.stringify(HUB5_ASSETS)); },
    hub5Restore: hub5Restore, hub5Apply: hub5Apply, hub5Tag: hub5Tag,"""
    js_pairs.append((old_api, new_api))

    # --- HTML 1: 10 entradas en hubDecor ---
    old_decor = """          { id: \"hub_decor_vip_lounge\",  slot: \"h03_vip_booth_lounge\",   x: 785, y: 760, h: 136, flip: false, t04: \"T03-07\" }
          /* === TANDA04:END === */
        ];"""
    new_decor = """          { id: \"hub_decor_vip_lounge\",  slot: \"h03_vip_booth_lounge\",   x: 785, y: 760, h: 136, flip: false, t04: \"T03-07\" },
          /* === TANDA05:BEGIN · 10 props nuevos en el array REAL hubDecor ===
             Renderer existente addHubCustomProp -> Lc (Y-sort, solid:false,
             tall:false). Coordenadas y alturas derivadas de la auditoría del
             HUB real. Flag reversible window.__DDM_HUB_T05. Sin colisiones,
             sin geometría nueva, sin sistemas de interacción. */
__DECOR__
          /* === TANDA05:END === */
        ];""".replace('__DECOR__', html_decor(assets))
    html_pairs.append((old_decor, new_decor))

    # --- HTML 2: guard del flag ---
    old_guard = """              /* TANDA04:BEGIN · reversibilidad A/B sin reconstruir el motor */
              if (dc.t04 && window.__DDM_HUB_T04 === false) return;
              /* TANDA04:END */
              const im = V5D(dc.slot);"""
    new_guard = """              /* TANDA04:BEGIN · reversibilidad A/B sin reconstruir el motor */
              if (dc.t04 && window.__DDM_HUB_T04 === false) return;
              /* TANDA04:END */
              /* TANDA05:BEGIN · reversibilidad A/B de TANDA 05 */
              if (dc.t05 && window.__DDM_HUB_T05 === false) return;
              /* TANDA05:END */
              const im = V5D(dc.slot);"""
    html_pairs.append((old_guard, new_guard))

    # --- HTML 3: suavizado, pulso y sombra ---
    old_draw = """              ctx.save(); ctx.imageSmoothingEnabled = !!dc.t04; /* TANDA04: arte pintado, no pixel art */
              const dh = dc.h, dw = Math.round(dh * im.naturalWidth / im.naturalHeight);
              Vb(ctx, p.x, p.y + 4, Math.round(dw * 0.8), 10);"""
    new_draw = """              ctx.save(); ctx.imageSmoothingEnabled = !!(dc.t04 || dc.t05); /* TANDA04/05: arte pintado, no pixel art */
              /* TANDA05:BEGIN · pulso ambiental sobre el ctx existente (sin sistema nuevo) */
              if (dc.pulse) ctx.globalAlpha *= 0.82 + 0.18 * Math.sin(performance.now() / 520 + dc.pulse);
              /* TANDA05:END */
              const dh = dc.h, dw = Math.round(dh * im.naturalWidth / im.naturalHeight);
              if (!dc.t05hang) Vb(ctx, p.x, p.y + 4, Math.round(dw * 0.8), 10); /* TANDA05: sin sombra en objetos colgantes */
"""
    html_pairs.append((old_draw.rstrip('\n'), new_draw.rstrip('\n')))
    return js_pairs, html_pairs


def main():
    assets = json.loads(MANIFEST.read_text(encoding='utf-8'))['assets']
    assert len(assets) == 10, 'se esperan 10 assets'
    js_pairs, html_pairs = build_pairs(assets)
    restore = '--restore' in sys.argv
    BACKUP.mkdir(parents=True, exist_ok=True)
    js, html = JS.read_text(encoding='utf-8'), HTML.read_text(encoding='utf-8')

    if not restore:
        if 'var HUB5_ASSETS' in js or 'TANDA05:BEGIN' in html:
            print('Ya integrado: no se reaplica (idempotente).')
            return
        (BACKUP / 'art_pack.PRE_T05.js').write_text(js, encoding='utf-8')
        (BACKUP / 'DEADBEAT_DISCO.ART.PRE_T05.html').write_text(html, encoding='utf-8')
        print('Backup:', BACKUP / 'art_pack.PRE_T05.js', BACKUP / 'DEADBEAT_DISCO.ART.PRE_T05.html')
        pairs = [(JS, js, js_pairs, 'art_pack.js'), (HTML, html, html_pairs, 'HTML')]
    else:
        pairs = [(JS, js, [(b, a) for a, b in js_pairs], 'art_pack.js (restore)'),
                 (HTML, html, [(b, a) for a, b in html_pairs], 'HTML (restore)')]

    for path, text, plist, label in pairs:
        for old, new in plist:
            count = text.count(old)
            if count != 1:
                raise SystemExit('ERROR %s: ancla encontrada %d veces (esperada 1):\n%s' %
                                 (label, count, old[:180]))
            text = text.replace(old, new, 1)
        path.write_text(text, encoding='utf-8')
        print(label, 'OK', len(text), 'chars', sha(path))
    print('Marcadores HTML:', html.count('TANDA05:BEGIN'), '/', html.count('TANDA05:END'))
    print('HUB5_ASSETS:', JS.read_text(encoding='utf-8').count('var HUB5_ASSETS'))


if __name__ == '__main__':
    main()
