/* ============================================================================
 * DEADBEAT DISCO · FASE 1 · TANDA 01 — PAQUETE DE ARTE (integración real)
 * ----------------------------------------------------------------------------
 * Este script NO crea un gestor de carga nuevo. Solo sustituye los objetos
 * Image / entradas de datos de los CUATRO registros que el juego ya utiliza:
 *
 *   window.__T3B_IMAGES[]        -> DMO_INFERNAL_ART.reload(i)  (suelos)
 *   window.__DDM_V5_IMG[key]     -> __DDM_GET_V5(key)           (decoración/HUB)
 *   window.DMO_ILT.images[key]   -> ILT.art(key)                (jefes/enemigos)
 *   window.__HD_DATA[key]        -> __HD_GET(key) / <img> HUB   (armas)
 *
 * No modifica mecánicas, estadísticas, IA, Director, generación de salas,
 * controles, audio ni guardado. No elimina ni añade sistemas. Las claves,
 * dimensiones y puntos de apoyo son los que el motor ya espera.
 *
 * TANDA 02 (arquitectura modular) amplia ESTE MISMO mecanismo: 10 PNG nuevos
 * se registran en window.__DDM_V5_IMG[slot] bajo las claves que ya consumen
 * el pintor de muros ($b / _b, paneles por edge) y el pintor de puertas (Bg).
 * No hay un segundo loader, ni un segundo <script>, ni un canvas superpuesto:
 * es el propio motor quien dibuja cada modulo con sus transform, sortY y
 * profundidad. Las imagenes previas de cada slot se conservan en ORIGINALS y
 * restore() permite capturar el "antes" sin recargar la pagina.
 *
 * Expone window.DMO_ART_PACK.state() / .integrity() / .architecture() para QA.
 * ==========================================================================*/
(function () {
  'use strict';

  var BASE = 'ART_ASSETS/tanda_01/';
  var BASE2 = 'ART_ASSETS/tanda_02/';

  /* id, archivo, dimensiones esperadas, loader, pivote, alfa */
  var MANIFEST = [
    { id: 't3b_material_00',          file: 'floor_00_obsidian_vein.png',   w: 512, h: 512, loader: 'T3B',  slot: 0, pivot: 'tile',          alpha: false },
    { id: 't3b_material_01',          file: 'floor_01_neon_dancefloor.png', w: 512, h: 512, loader: 'T3B',  slot: 1, pivot: 'tile',          alpha: false },
    { id: 't3b_material_02',          file: 'floor_02_gilded_mosaic.png',   w: 512, h: 512, loader: 'T3B',  slot: 2, pivot: 'tile',          alpha: false },
    { id: 'hub_fox_crest_emblem',     file: 'hub_fox_crest_emblem.png',     w: 560, h: 332, loader: 'V5',   pivot: 'center',        alpha: true },
    { id: 'decor_neon_rug',           file: 'decor_neon_rug.png',           w: 456, h: 243, loader: 'V5',   pivot: 'bottom-center', alpha: true },
    { id: 'decor_potted_palm',        file: 'decor_potted_palm.png',        w: 209, h: 147, loader: 'V5',   pivot: 'bottom-center', alpha: true },
    { id: 'boss_01_anden',            file: 'boss_01_anden.png',            w: 400, h: 386, loader: 'ILT',  pivot: 'bottom-center', alpha: true },
    { id: 'weapons/weapon_m1911.png', file: 'weapon_m1911.png',             w: 160, h: 87,  loader: 'HD',   pivot: 'center',        alpha: true }
  ];

  /* Tanda 02 · familia modular de arquitectura. Las claves 'slot' son las
     EXACTAS que el motor consulta con __DDM_GET_V5; 'alias' es la referencia
     nueva y trazable que tambien se registra en el mismo registro V5. */
  var ARCHITECTURE = [
    { id: 'A01', name: 'wall_straight',       file: 'wall_straight.png',       slot: 'wall_stained_glass_arch',      w: 120, h: 176, alias: 't02_A01_wall_straight',       pivot: 'bottom-center' },
    { id: 'A02', name: 'wall_corner_inner',   file: 'wall_corner_inner.png',   slot: 'wall_limbo_ticket_window',     w: 144, h: 144, alias: 't02_A02_wall_corner_inner',   pivot: 'bottom-center' },
    { id: 'A03', name: 'wall_corner_outer',   file: 'wall_corner_outer.png',   slot: 'wall_avaricia_vault_door',     w: 150, h: 86,  alias: 't02_A03_wall_corner_outer',   pivot: 'bottom-center' },
    { id: 'A04', name: 'wall_end_cap',        file: 'wall_end_cap.png',        slot: 'wall_traicion_glacier_panel',  w: 124, h: 64,  alias: 't02_A04_wall_end_cap',        pivot: 'bottom-center' },
    { id: 'A05', name: 'wall_pillar',         file: 'wall_pillar.png',         slot: 'nucleo_pillar_prop',           w: 204, h: 505, alias: 't02_A05_wall_pillar',         pivot: 'bottom-center' },
    { id: 'A06', name: 'door_closed',         file: 'door_closed.png',         slot: 'campaign_door_leaf',           w: 76,  h: 54,  alias: 't02_A06_door_closed',         pivot: 'center' },
    { id: 'A07', name: 'door_open',           file: 'door_open.png',           slot: 'campaign_door_side_leaf',      w: 52,  h: 136, alias: 't02_A07_door_open',           pivot: 'center' },
    { id: 'A08', name: 'doorway_frame',       file: 'doorway_frame.png',       slot: 'campaign_door_frame',          w: 196, h: 124, alias: 't02_A08_doorway_frame',       pivot: 'center' },
    { id: 'A09', name: 'threshold_entry',     file: 'threshold_entry.png',     slot: 'campaign_door_south_gate',     w: 196, h: 67,  alias: 't02_A09_threshold_entry',     pivot: 'center' },
    { id: 'A10', name: 'wall_neon_detail',    file: 'wall_neon_detail.png',    slot: 'wall_neon_club_crest',         w: 84,  h: 84,  alias: 't02_A10_wall_neon_detail',    pivot: 'center' }
  ];

  var ORIGINALS = {};              /* recursos V5 previos, preservados */
  var ARCH_IMAGES = {};            /* Image ya decodificados, por id */
  var archApplied = false;

  var st = {
    version: 'fase1-tanda01+tanda02',
    status: 'pending',
    startedAt: Date.now(),
    appliedAt: null,
    base: BASE,
    assets: [],
    errors: []
  };

  function entry(m) {
    return {
      id: m.id, file: BASE + m.file, loader: m.loader, pivot: m.pivot,
      alpha: m.alpha, expected: [m.w, m.h], natural: null,
      applied: false, loaded: false, exactSize: false, note: ''
    };
  }
  MANIFEST.forEach(function (m) { st.assets.push(entry(m)); });

  function err(where, e) {
    var msg = where + ': ' + (e && (e.message || e.type) || String(e));
    /* T02 mantiene su propia traza: un fallo de arquitectura no debe
       reclasificar el estado, ya verificado, de la Tanda 01. */
    if (/^A\d\d$/.test(where)) {
      if (!st.archErrors) st.archErrors = [];
      st.archErrors.push(msg);
    } else {
      st.errors.push(msg);
    }
    try { console.warn('[ART_PACK] ' + msg); } catch (_) {}
  }

  function load(url, rec, done) {
    var im = new Image();
    im.decoding = 'async';
    im.onload = function () {
      rec.loaded = true;
      rec.natural = [im.naturalWidth, im.naturalHeight];
      rec.exactSize = (im.naturalWidth === rec.expected[0] && im.naturalHeight === rec.expected[1]);
      if (!rec.exactSize) err(rec.id, 'dimensiones inesperadas ' + rec.natural.join('x'));
      done(im);
    };
    im.onerror = function () { err(rec.id, 'no se pudo decodificar ' + url); done(null); };
    im.src = url;
    return im;
  }

  /* ---------------------------------------------------------------- loaders */

  function applyT3B(m, rec, im) {
    var arr = window.__T3B_IMAGES;
    if (!arr || arr.length < 10) { err(m.id, '__T3B_IMAGES no disponible'); return; }
    arr[m.slot] = rec.file;
    /* La build trae el pintor candidato de materiales DESACTIVADO (cache probe).
       Se habilita el flag visual propio del motor; no afecta a lógica ni mecánicas. */
    var api = window.__T3B;
    if (!api || typeof api.reload !== 'function') { err(m.id, 'window.__T3B.reload no disponible'); return; }
    if (!api.enabled && typeof api.setEnabled === 'function') {
      try { api.setEnabled(true); st.t3bEnabled = true; }
      catch (e) { err(m.id, 'setEnabled: ' + e); }
    }
    api.reload(m.slot, 0);           /* loader existente: crea Image + invalida cache */
    rec.applied = true;
    rec.note = '__T3B_IMAGES[' + m.slot + '] + __T3B.reload() + setEnabled(true)';
  }

  function applyV5(m, rec, im) {
    var reg = window.__DDM_V5_IMG;
    if (!reg) { err(m.id, '__DDM_V5_IMG no disponible'); return; }
    reg[m.id] = im;                  /* __DDM_GET_V5(key) exige complete+naturalWidth */
    rec.applied = true;
    rec.note = '__DDM_V5_IMG[' + m.id + '] = Image';
  }

  function applyILT(m, rec, im) {
    var ILT = window.DMO_ILT;
    if (!ILT || !ILT.images || !ILT.ready || !ILT.meta) { err(m.id, 'DMO_ILT no disponible'); return; }
    ILT.images[m.id] = im;
    ILT.ready[m.id] = true;
    ILT.meta[m.id] = { w: im.naturalWidth, h: im.naturalHeight,
                       aspect: im.naturalWidth / Math.max(1, im.naturalHeight) };
    rec.applied = true;
    rec.note = 'DMO_ILT.images/ready/meta[' + m.id + ']';
    st.iltEnabled = !!ILT.enabled;
  }

  function applyHD(m, rec, im) {
    var data = window.__HD_DATA;
    if (!data) { err(m.id, '__HD_DATA no disponible'); return; }
    data[m.id] = rec.file;
    if (!window.__HD_EXTRA) window.__HD_EXTRA = {};
    window.__HD_EXTRA[m.id] = im;   /* __HD_GET(key) devuelve este Image */
    rec.applied = true;
    rec.note = '__HD_DATA[' + m.id + '] + __HD_EXTRA cache';
  }

  var APPLY = { T3B: applyT3B, V5: applyV5, ILT: applyILT, HD: applyHD };

  /* ------------------------------------------- Tanda 02 · mismo loader V5 */

  /* Un unico registro, un unico punto de lectura (__DDM_GET_V5). Se guarda la
     imagen previa de cada slot para conservar el recurso anterior y poder
     revertir sin recargar. No se crea ningun gestor de carga alternativo. */
  function applyArch() {
    var reg = window.__DDM_V5_IMG;
    if (!reg) { err('A00', '__DDM_V5_IMG no disponible'); return 0; }
    var n = 0;
    ARCHITECTURE.forEach(function (m) {
      var im = ARCH_IMAGES[m.id];
      if (!im) return;
      if (!Object.prototype.hasOwnProperty.call(ORIGINALS, m.slot)) {
        ORIGINALS[m.slot] = reg[m.slot];
      }
      reg[m.slot] = im;          /* el pintor real de muros/puertas lo consume */
      reg[m.alias] = im;         /* referencia nueva y trazable, mismo registro */
      n++;
    });
    archApplied = (n === ARCHITECTURE.length);
    if (st.architecture) {
      st.architecture.enabled = archApplied;
      st.architecture.applied = n;
    }
    return n;
  }

  function restoreArch() {
    var reg = window.__DDM_V5_IMG;
    if (!reg) return 0;
    var n = 0;
    ARCHITECTURE.forEach(function (m) {
      if (!Object.prototype.hasOwnProperty.call(ORIGINALS, m.slot)) return;
      reg[m.slot] = ORIGINALS[m.slot];
      delete reg[m.alias];
      n++;
    });
    archApplied = false;
    if (st.architecture) {
      st.architecture.enabled = false;
      st.architecture.applied = 0;
    }
    return n;
  }

  function loadArchitecture(done) {
    var pending = ARCHITECTURE.length;
    ARCHITECTURE.forEach(function (m) {
      var rec = { id: m.id, file: BASE2 + m.file, expected: [m.w, m.h],
                  loaded: false, natural: null, exactSize: false };
      load(rec.file, rec, function (im) {
        if (im) ARCH_IMAGES[m.id] = im;
        if (--pending === 0) done(applyArch());
      });
    });
  }

  /* ------------------------------------------------------------ arranque */

  function ready() {
    return !!(window.__T3B_IMAGES && window.__T3B &&
              window.__DDM_V5_IMG && window.DMO_ILT &&
              window.__HD_DATA && window.__HD_GET);
  }

  function run() {
    if (st.status !== 'pending') return;
    st.status = 'applying';
    st.appliedAt = Date.now();
    var pending = MANIFEST.length;
    MANIFEST.forEach(function (m, i) {
      var rec = st.assets[i];
      load(rec.file, rec, function (im) {
        if (im) {
          try { APPLY[m.loader](m, rec, im); }
          catch (e) { err(m.id, e); }
        }
        if (--pending === 0) {
          /* Tanda 01 cerrada; se amplia el MISMO registro con la familia
             modular. Los errores de T02 no cambian el estado de T01. */
          loadArchitecture(function (n) {
            st.architecture = {
              version: 'fase1-tanda02', count: ARCHITECTURE.length,
              applied: n, enabled: archApplied,
              appliedAt: Date.now(), loader: '__DDM_V5_IMG -> __DDM_GET_V5'
            };
            st.status = st.errors.length ? 'applied-with-errors' : 'applied';
            st.finishedAt = Date.now();
          });
        }
      });
    });
  }

  var tries = 0;
  (function poll() {
    if (ready()) { run(); return; }
    if (++tries > 200) {           /* ~10 s */
      st.status = 'timeout';
      err('boot', 'registros del juego no disponibles tras 10 s');
      return;
    }
    setTimeout(poll, 50);
  })();

  /* ------------------------------------------------------------- QA público */

  function state() {
    return JSON.parse(JSON.stringify(st));
  }

  function integrity() {
    var s = state();
    var out = { status: s.status, errors: s.errors.slice(), assets: [],
                registries: {}, checkedAt: Date.now() };
    out.registries.t3b = !!window.__T3B_IMAGES;
    out.registries.v5 = !!window.__DDM_V5_IMG;
    out.registries.ilt = !!window.DMO_ILT;
    out.registries.hd = !!window.__HD_DATA;
    s.assets.forEach(function (a) {
      var live = null;
      try {
        if (a.loader === 'T3B') live = window.__T3B_IMAGES[MANIFEST[s.assets.indexOf(a)].slot];
        else if (a.loader === 'V5') live = window.__DDM_V5_IMG[a.id];
        else if (a.loader === 'ILT') live = window.DMO_ILT.images[a.id];
        else if (a.loader === 'HD') live = window.__HD_DATA[a.id];
      } catch (_) {}
      var ok = false, dims = null;
      if (a.loader === 'T3B') {
        var im3 = window.__T3B && window.__T3B.images &&
                  window.__T3B.images[MANIFEST[s.assets.indexOf(a)].slot];
        ok = (live === a.file) && !!im3 && !!im3.complete &&
             im3.naturalWidth === a.expected[0] && im3.naturalHeight === a.expected[1];
        dims = im3 ? [im3.naturalWidth, im3.naturalHeight] : null;
      } else if (a.loader === 'HD') {
        var imh = window.__HD_EXTRA && window.__HD_EXTRA[a.id];
        ok = (live === a.file) && !!imh && !!imh.complete &&
             imh.naturalWidth === a.expected[0] && imh.naturalHeight === a.expected[1];
        dims = imh ? [imh.naturalWidth, imh.naturalHeight] : null;
      } else if (live) {
        ok = !!live.complete && live.naturalWidth > 0 &&
             live.naturalWidth === a.expected[0] && live.naturalHeight === a.expected[1];
        dims = [live.naturalWidth, live.naturalHeight];
      }
      out.assets.push({ id: a.id, loader: a.loader, applied: a.applied,
                        loaded: a.loaded, exactSize: a.exactSize,
                        live: ok, natural: dims || a.natural });
    });
    return out;
  }

  /* Comprobacion en vivo de la familia modular: registro, dimensiones,
     recursos anteriores conservados y estado de aplicacion. */
  function architecture() {
    var reg = window.__DDM_V5_IMG || {};
    var get = window.__DDM_GET_V5;
    var assets = ARCHITECTURE.map(function (m) {
      var live = reg[m.slot];
      var viaLoader = null;
      try { viaLoader = typeof get === 'function' ? get(m.slot) : null; } catch (_) {}
      var im = ARCH_IMAGES[m.id];
      return {
        id: m.id, name: m.name, slot: m.slot, alias: m.alias,
        file: BASE2 + m.file, expected: [m.w, m.h], pivot: m.pivot,
        loaded: !!im,
        natural: im ? [im.naturalWidth, im.naturalHeight] : null,
        exactSize: !!im && im.naturalWidth === m.w && im.naturalHeight === m.h,
        live: live === im,
        loaderResolves: viaLoader === im,
        aliasRegistered: reg[m.alias] === im,
        originalPreserved: Object.prototype.hasOwnProperty.call(ORIGINALS, m.slot) &&
                           ORIGINALS[m.slot] !== im
      };
    });
    return {
      version: 'fase1-tanda02',
      loader: 'window.__DDM_V5_IMG[slot] -> window.__DDM_GET_V5(slot)',
      enabled: archApplied,
      applied: assets.filter(function (a) { return a.live; }).length,
      count: assets.length,
      originalsPreserved: Object.keys(ORIGINALS).length,
      errors: (st.archErrors || []).slice(),
      assets: assets,
      /* solo lectura del estado del juego; NO se dibuja nada desde aqui */
      stateNote: 'El pintor real $b/_b (paneles por edge) y Bg (puertas) '
               + 'consultan estas claves; geometria, colisiones y sortY '
               + 'permanecen en el motor.'
    };
  }

  /* restore()/apply() existen para QA A/B con la MISMA build y los MISMOS
     parametros. No forman parte del render del juego. */
  function restore() { return restoreArch(); }
  function apply() { return archApplied ? ARCHITECTURE.length : applyArch(); }

  window.DMO_ART_PACK = Object.freeze({
    state: state, integrity: integrity, architecture: architecture,
    restore: restore, apply: apply,
    manifest: function () { return JSON.parse(JSON.stringify(MANIFEST)); },
    architectureManifest: function () { return JSON.parse(JSON.stringify(ARCHITECTURE)); }
  });
})();
