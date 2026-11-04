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
 * HUB · TANDA 01 (reconstruccion de escenarios) amplia ESTE MISMO paquete con
 * 10 assets: el suelo entra por el slot T3B que ya pinta el HUB, el panel de
 * pared por la familia modular T02 y los otros 8 por el registro V5 que
 * consumen los pintores reales del HUB. No hay segundo loader, segundo canvas
 * ni segundo <script>; no se toca geometria, colisiones, puertas ni logica.
 * Las dimensiones son las medidas en runtime (ver manifest.json de la tanda).
 *
 * HUB · TANDA 03 amplia ESTE MISMO paquete con un bloque HUB3_* independiente:
 * 8 unidades de produccion / 13 PNG finales, cargados con load() y registrados
 * en el MISMO window.__DDM_V5_IMG. La integracion de RENDER queda BLOQUEADA
 * en las 8 unidades: 7 no tienen slot de dibujo y el pintor del canvas del
 * MENU (4 drawImage de 108x68) pertenece a un renderer inactivo en este build
 * (D-07). Los 13 PNG se cargan y registran en el V5 real, pero
 * registro != integracion. No se inventa un pintor, un segundo motor ni se
 * modifica el HTML. Ver ART_HUB_TANDA_03_AUDIT.md.
 *
 * Expone window.DMO_ART_PACK.state() / .integrity() / .architecture() / .hub()
 * / .hub2() / .hub3() para QA.
 * ==========================================================================*/
(function () {
  'use strict';

  var BASE = 'ART_ASSETS/tanda_01/';
  var BASE2 = 'ART_ASSETS/tanda_02/';
  var BASEH = 'ART_ASSETS/hub/tanda_01/';

  /* id, archivo, dimensiones esperadas, loader, pivote, alfa */
  var MANIFEST = [
    { id: 't3b_material_00',          file: 'floor_00_obsidian_vein.png',   w: 512, h: 512, loader: 'T3B',  slot: 0, pivot: 'tile',          alpha: false },
    /* HUB-01 · Suelo central. La build activa pinta el HUB con
       __DDM_PAINT_MATERIAL(c,1,...) -> __T3B_IMAGES[1]. Se sirve ese MISMO
       slot con el nuevo tile; el PNG de la Tanda 01 sigue en el repositorio. */
    { id: 't3b_material_01',          file: 'floor_01_neon_dancefloor.png', w: 512, h: 512, loader: 'T3B',  slot: 1, pivot: 'tile',          alpha: false,
      path: BASEH + 'hub_01_suelo_central.png', hubId: 'HUB-01' },
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
    /* HUB-03 · Paredes arquitectonicas. Se mantiene la clave, el pintor y
       las dimensiones del modulo recto; solo cambia la ilustracion servida. */
    { id: 'A01', name: 'wall_straight',       file: 'wall_straight.png',       slot: 'wall_stained_glass_arch',      w: 120, h: 176, alias: 't02_A01_wall_straight',       pivot: 'bottom-center',
      path: BASEH + 'hub_03_paredes.png', hubId: 'HUB-03' },
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

  /* -------------------------------------------------------------------------
   * HUB · TANDA 01 — 10 assets, una sola familia visual.
   * 'slots' son las claves EXACTAS que los pintores del HUB consultan en
   * window.__DDM_V5_IMG / __DDM_GET_V5 (medido con la sonda de runtime).
   * HUB-01 y HUB-03 no se cargan aqui: entran por los manifest de T01/T02
   * (arriba) para que no existan dos integraciones compitiendo por un slot.
   * -----------------------------------------------------------------------*/
  var HUB_ASSETS = [
    { id: 'HUB-01', file: 'hub_01_suelo_central.png',          w: 512, h: 512, loader: 'T3B', slots: ['t3b_material_01'],
      pivot: 'tile',          alpha: false, managedBy: 'MANIFEST/T01',
      classification: 'Arquitectónico / Funcional',
      role: 'Superficie principal del HUB (patrón repeat 512x512).' },
    { id: 'HUB-02', file: 'hub_02_pista_central.png',           w: 760, h: 430, loader: 'V5',  slots: ['hub_pista_medallion'],
      pivot: 'center',        alpha: true,  managedBy: 'HUB',
      classification: 'Decorativo',
      role: 'Alfombra / medallón de identidad de la pista central.' },
    { id: 'HUB-03', file: 'hub_03_paredes.png',                 w: 120, h: 176, loader: 'V5',  slots: ['wall_stained_glass_arch'],
      pivot: 'bottom-center', alpha: true,  managedBy: 'ARCHITECTURE/T02',
      classification: 'Arquitectónico',
      role: 'Panel de muro modular: delimita y da profundidad al perímetro.' },
    { id: 'HUB-04', file: 'hub_04_cabina_dj.png',               w: 720, h: 392, loader: 'V5',  slots: ['hub_dj_shrine'],
      pivot: 'bottom-center', alpha: true,  managedBy: 'HUB',
      classification: 'Interactivo',
      role: 'Cabina del DJ, elemento protagonista (estación dj).' },
    { id: 'HUB-05', file: 'hub_05_barra_bebidas.png',           w: 380, h: 313, loader: 'V5',  slots: ['hub_bar_shrine'],
      pivot: 'bottom-center', alpha: true,  managedBy: 'HUB',
      classification: 'Interactivo',
      role: 'Barra «EL ÚLTIMO TRAGO», zona diferenciada (estación bar).' },
    { id: 'HUB-06', file: 'hub_06_columnas.png',                w: 76,  h: 148, loader: 'V5',  slots: ['club_speaker_tower_prop'],
      pivot: 'bottom-center', alpha: true,  managedBy: 'HUB',
      classification: 'Arquitectónico',
      role: 'Columnas estructurales / torres acústicas: ritmo y volumen.' },
    { id: 'HUB-07', file: 'hub_07_sofas_asientos.png',          w: 224, h: 172, loader: 'V5',
      slots: ['hub_vip_booth_nw', 'hub_vip_booth_ne'],
      pivot: 'bottom-center', alpha: true,  managedBy: 'HUB',
      classification: 'Decorativo',
      role: 'Sofás VIP: zona de descanso en ambas alcobas norte (un PNG, dos slots).' },
    { id: 'HUB-08', file: 'hub_08_luminarias_neones.png',       w: 67,  h: 152, loader: 'V5',  slots: ['hub_disco_chandelier'],
      pivot: 'top-center',    alpha: true,  managedBy: 'HUB',
      classification: 'Funcional / Decorativo',
      role: 'Luminaria colgante de neón: iluminación ambiental sobre la pista.' },
    { id: 'HUB-09', file: 'hub_09_puertas_accesos.png',         w: 320, h: 175, loader: 'V5',  slots: ['hub_abyss_stair_crack'],
      pivot: 'center',        alpha: true,  managedBy: 'HUB',
      classification: 'Interactivo / Funcional',
      role: 'Portal de descenso: acceso a otras zonas. No toca Ot.openT.' },
    { id: 'HUB-10', file: 'hub_10_decoracion_ambiental.png',    w: 167, h: 136, loader: 'V5',  slots: ['hub_trophy_board_prop'],
      pivot: 'center',        alpha: true,  managedBy: 'HUB',
      classification: 'Decorativo',
      role: 'Tablón de trofeos / muro de la vergüenza: humor negro y personalidad.' }
  ];

  var HUB_IMAGES = {};             /* Image decodificados por id HUB-xx */
  var HUB_ORIGINALS = {};          /* imagen/URL previa de cada slot, preservada */
  var hubApplied = false;

  var ORIGINALS = {};              /* recursos V5 previos, preservados */
  var ARCH_IMAGES = {};            /* Image ya decodificados, por id */
  var archApplied = false;

  var st = {
    version: 'fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02+hub-tanda03+hub-tanda05+hub-tanda06+hub-tanda07',
    status: 'pending',
    startedAt: Date.now(),
    appliedAt: null,
    base: BASE,
    assets: [],
    errors: []
  };

  function entry(m) {
    return {
      id: m.id, file: m.path || BASE + m.file, loader: m.loader, pivot: m.pivot,
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
    } else if (/^P\d\d$/.test(where)) {
      /* FASE D mantiene su propia traza: un fallo del protagonista no debe
         reclasificar el estado ya verificado de T01/T02. */
      if (!st.playerErrors) st.playerErrors = [];
      st.playerErrors.push(msg);
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
    if (m.hubId) {
      HUB_ORIGINALS[m.id] = arr[m.slot];       /* T01 anterior, conservado */
      HUB_IMAGES[m.hubId] = im;
      try { im.__hubTanda01 = m.hubId; } catch (_) {}
    }
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
    if (m.hubId && api.images && api.images[m.slot]) {
      try { api.images[m.slot].__hubTanda01 = m.hubId; } catch (_) {}
    }
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
      if (m.hubId) {
        HUB_IMAGES[m.hubId] = im;
        try { im.__hubTanda01 = m.hubId; } catch (_) {}
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
      var rec = { id: m.id, file: m.path || BASE2 + m.file, expected: [m.w, m.h],
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

  /* HUB · Tanda 03: se arranca en el PRIMER instante del boot (no al final
     de la cadena), porque el canvas del MENU se construye una sola vez. Si
     run() se invoca sincronicamente durante la evaluacion de este script,
     HUB3_ASSETS aun no esta inicializado: se reagenda un tick, sin crear
     ningun cargador nuevo (sigue siendo load()). */
  function startHub3() {
    if (!HUB3_ASSETS || !HUB3_ASSETS.length) { setTimeout(startHub3, 0); return; }
    loadHub3(function (k) { st.hub3Boot = { registered: k, at: Date.now() }; });
  }

  function run() {
    if (st.status !== 'pending') return;
    st.status = 'applying';
    st.appliedAt = Date.now();
    startHub3();
    var pending = MANIFEST.length;
    MANIFEST.forEach(function (m, i) {
      var rec = st.assets[i];
      load(rec.file, rec, function (im) {
        if (im) {
          try { APPLY[m.loader](m, rec, im); }
          catch (e) { err(m.id, e); }
        }
        if (--pending === 0) {
          /* La cadena T01/T02/HUB-01/HUB-02 no se altera y no espera a HUB3:
             startHub3() ya lanzo esa carga en el primer instante del boot. */
          /* Tanda 01 cerrada; se amplia el MISMO registro con la familia
             modular. Los errores de T02 no cambian el estado de T01. */
          loadArchitecture(function (n) {
            st.architecture = {
              version: 'fase1-tanda02', count: ARCHITECTURE.length,
              applied: n, enabled: archApplied,
              appliedAt: Date.now(), loader: '__DDM_V5_IMG -> __DDM_GET_V5'
            };
            /* HUB · Tanda 01: se cargan DESPUES de T01/T02 en el mismo
               mecanismo. Un fallo del HUB no reclasifica el estado ya
               verificado de las tandas anteriores. */
            loadHub(function (k) {
              /* HUB · Tanda 02: se cargan DESPUES de la Tanda 01 en el mismo
                 registro. Un fallo suyo no reclasifica el estado ya verificado
                 de T01/T02/T03/HUB-01. */
              loadHub2(function (m) {
                /* TANDA05:BEGIN · mismo load(), encadenado tras HUB-02 */
                loadHub5(function (k5) {
                  /* TANDA06:BEGIN · mismo load(), encadenado tras TANDA 05 */
                  loadHub6(function (k6) {
                    /* TANDA07:BEGIN · mismo load(), encadenado tras TANDA 06 */
                    loadHub7(function (k7) {
                      st.status = (st.errors.length || (st.archErrors || []).length ||
                                   (st.hubErrors || []).length || (st.hub2Errors || []).length ||
                                   (st.hub3Errors || []).length || (st.hub5Errors || []).length ||
                                   (st.hub6Errors || []).length || (st.hub7Errors || []).length)
                        ? 'applied-with-errors' : 'applied';
                      st.finishedAt = Date.now();
                    });
                    /* TANDA07:END */
                  });
                  /* TANDA06:END */
                });
                /* TANDA05:END */
              });
            });
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
        file: m.path || BASE2 + m.file, expected: [m.w, m.h], pivot: m.pivot,
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

  /* ======================================================================
   * HUB · TANDA 01 — aplicacion sobre el registro V5 existente.
   * No se crea un loader nuevo: se usa load() (new Image) y se escriben las
   * claves que los pintores del HUB ya consultan. Se preserva la imagen
   * anterior de cada slot y se invalidan las dos caches existentes del motor
   * (__DDM_V5_MED_NO_SKULL y DMO_INFERNAL_ART.invalidate).
   * ====================================================================*/

  function hubErr(where, e) {
    var msg = where + ': ' + (e && (e.message || e.type) || String(e));
    if (!st.hubErrors) st.hubErrors = [];
    st.hubErrors.push(msg);
    try { console.warn('[ART_PACK/HUB] ' + msg); } catch (_) {}
  }

  function hubInvalidate() {
    /* Cache del medallón: el motor la construye una sola vez en
       drawHubFloorLayer(). Se limpia para que recomponga con HUB-02. */
    try { window.__DDM_V5_MED_NO_SKULL = null; } catch (_) {}
    /* Invalidación de sala/caché de arte que YA usa __T3B.reload(). */
    try {
      if (window.DMO_INFERNAL_ART &&
          typeof window.DMO_INFERNAL_ART.invalidate === 'function') {
        window.DMO_INFERNAL_ART.invalidate();
      }
    } catch (e) { hubErr('invalidate', e); }
  }

  function applyHub() {
    var reg = window.__DDM_V5_IMG;
    if (!reg) { hubErr('HUB', '__DDM_V5_IMG no disponible'); return 0; }
    var n = 0;
    HUB_ASSETS.forEach(function (a) {
      if (a.managedBy !== 'HUB') return;      /* HUB-01 / HUB-03 ya aplicados */
      var im = HUB_IMAGES[a.id];
      if (!im) return;
      try { im.__hubTanda01 = a.id; } catch (_) {}
      a.slots.forEach(function (slot) {
        if (!Object.prototype.hasOwnProperty.call(HUB_ORIGINALS, slot)) {
          HUB_ORIGINALS[slot] = reg[slot];
        }
        reg[slot] = im;                       /* pintor real del HUB */
        reg['h01_' + a.id.toLowerCase().replace('-', '_')] = im; /* alias trazable */
        n++;
      });
    });
    hubApplied = (n === 9);   /* 8 assets: HUB-07 ocupa 2 slots */
    hubInvalidate();
    st.hub = {
      version: 'hub-tanda01', count: HUB_ASSETS.length,
      slotsApplied: n, enabled: hubApplied,
      loader: '__T3B_IMAGES[1] + __T3B.reload(1) / __DDM_V5_IMG[slot]',
      appliedAt: Date.now()
    };
    return n;
  }

  function restoreHub() {
    var reg = window.__DDM_V5_IMG;
    var n = 0;
    if (reg) {
      HUB_ASSETS.forEach(function (a) {
        if (a.managedBy !== 'HUB') return;
        a.slots.forEach(function (slot) {
          if (!Object.prototype.hasOwnProperty.call(HUB_ORIGINALS, slot)) return;
          reg[slot] = HUB_ORIGINALS[slot];
          delete reg['h01_' + a.id.toLowerCase().replace('-', '_')];
          n++;
        });
      });
    }
    /* HUB-01 vuelve al tile de la Tanda 01 por el mismo loader T3B. */
    try {
      if (Object.prototype.hasOwnProperty.call(HUB_ORIGINALS, 't3b_material_01') &&
          window.__T3B_IMAGES && window.__T3B && typeof window.__T3B.reload === 'function') {
        window.__T3B_IMAGES[1] = HUB_ORIGINALS['t3b_material_01'];
        window.__T3B.reload(1, 0);
      }
    } catch (e) { hubErr('HUB-01 restore', e); }
    hubApplied = false;
    if (st.hub) { st.hub.enabled = false; st.hub.slotsApplied = 0; }
    hubInvalidate();
    return n;
  }

  function loadHub(done) {
    var pending = 0, list = HUB_ASSETS.filter(function (a) { return a.managedBy === 'HUB'; });
    pending = list.length;
    list.forEach(function (a) {
      var rec = { id: a.id, file: BASEH + a.file, expected: [a.w, a.h],
                  loaded: false, natural: null, exactSize: false };
      load(rec.file, rec, function (im) {
        if (im) {
          HUB_IMAGES[a.id] = im;
          if (!rec.exactSize) hubErr(a.id, 'dimensiones inesperadas ' + rec.natural);
        }
        if (--pending === 0) done(applyHub());
      });
    });
  }

  /* Solo lectura: comprueba el registro VIVO, dimensiones, alpha esperado y
     conservación del recurso anterior. No dibuja nada. */
  function hub() {
    var reg = window.__DDM_V5_IMG || {};
    var get = window.__DDM_GET_V5;
    var t3b = window.__T3B;
    var assets = HUB_ASSETS.map(function (a) {
      var im = HUB_IMAGES[a.id] || null;
      var live = false, viaLoader = 0, slotsLive = 0;
      if (a.id === 'HUB-01') {
        var url = window.__T3B_IMAGES && window.__T3B_IMAGES[1];
        var im3 = t3b && t3b.images && t3b.images[1];
        live = url === BASEH + a.file && !!im3 && !!im3.complete &&
               im3.naturalWidth === a.w && im3.naturalHeight === a.h &&
               t3b.enabled === true;
        slotsLive = live ? 1 : 0;
      } else {
        a.slots.forEach(function (slot) {
          if (im && reg[slot] === im) slotsLive++;
          try {
            if (typeof get === 'function' && get(slot) === im) viaLoader++;
          } catch (_) {}
        });
        live = slotsLive === a.slots.length;
      }
      return {
        id: a.id, file: BASEH + a.file, loader: a.loader, managedBy: a.managedBy,
        slots: a.slots.slice(), slotsLive: slotsLive, loaderResolves: viaLoader,
        classification: a.classification, role: a.role, pivot: a.pivot,
        alpha: a.alpha, expected: [a.w, a.h],
        natural: im ? [im.naturalWidth, im.naturalHeight] : null,
        exactSize: !!im && im.naturalWidth === a.w && im.naturalHeight === a.h,
        loaded: !!im, live: live,
        /* HUB-03 entra por el manifest de Tanda 02: su original lo guarda
           applyArch() en ORIGINALS, no en HUB_ORIGINALS. Se consulta el mapa
           que corresponde a su gestor para no falsear el informe. */
        originalsPreserved: a.id === 'HUB-01'
          ? Object.prototype.hasOwnProperty.call(HUB_ORIGINALS, 't3b_material_01')
          : a.managedBy === 'ARCHITECTURE/T02'
            ? a.slots.every(function (s) {
                return Object.prototype.hasOwnProperty.call(ORIGINALS, s) &&
                       ORIGINALS[s] !== im;
              })
            : a.slots.every(function (s) {
                return Object.prototype.hasOwnProperty.call(HUB_ORIGINALS, s) &&
                       HUB_ORIGINALS[s] !== im;
              })
      };
    });
    return {
      version: 'hub-tanda01', count: HUB_ASSETS.length,
      enabled: hubApplied, applied: assets.filter(function (a) { return a.live; }).length,
      slotsApplied: st.hub ? st.hub.slotsApplied : 0,
      errors: (st.hubErrors || []).slice(),
      assets: assets,
      note: 'Todos los slots son consumidos por los pintores reales del HUB; '
          + 'geometria, colisiones, sortY, puertas y camara permanecen en el motor.'
    };
  }

  function hubTag() {
    /* Etiqueta de solo lectura para contar drawImage() en QA. */
    HUB_ASSETS.forEach(function (a) {
      var im = HUB_IMAGES[a.id];
      if (im) { try { im.__hubTanda01 = a.id; } catch (_) {} }
    });
    try {
      if (window.__T3B && window.__T3B.images[1]) {
        window.__T3B.images[1].__hubTanda01 = 'HUB-01';
      }
    } catch (_) {}
    return HUB_ASSETS.length;
  }

  /* ======================================================================
   * HUB · TANDA 02 — segunda expansion visual del escenario.
   * ----------------------------------------------------------------------
   * Diez slots que el pintor REAL del HUB ya dibuja/consulta (medidos en
   * ART_EVIDENCE/hub/tanda_02/audit_runtime.json). Entran por el MISMO
   * registro __DDM_V5_IMG y el MISMO load() que la Tanda 01; no hay segundo
   * motor, ni canvas nuevo, ni cambios de geometria, colisiones, sortY,
   * estaciones, puertas, musica o camara.
   *
   * Los mapas son INDEPENDIENTES de HUB_ASSETS/HUB_IMAGES/HUB_ORIGINALS:
   * restoreHub2() no puede deshacer la Tanda 01 y viceversa.
   * ====================================================================*/

  var BASEH2 = 'ART_ASSETS/hub/tanda_02/';
  var HUB2_ASSETS = [
    { id: 'T02-01', file: 'hub_t02_01_arcade.png',          w: 264, h: 239, slots: ['hub_arcade_shrine'],
      pivot: 'bottom-center', classification: 'Interactivo / Mobiliario secundario',
      role: 'Banco de recreativas del Rincon Arcade (zona F1).', cached: false },
    { id: 'T02-02', file: 'hub_t02_02_arsenal.png',         w: 360, h: 253, slots: ['hub_arsenal_shrine'],
      pivot: 'bottom-center', classification: 'Interactivo / Mobiliario funcional',
      role: 'Mostrador del Arsenal de Caronte (zona D).', cached: false },
    { id: 'T02-03', file: 'hub_t02_03_seals.png',           w: 244, h: 237, slots: ['hub_seals_shrine'],
      pivot: 'bottom-center', classification: 'Interactivo / Objeto narrativo',
      role: 'Espejo de los Sellos (zona F2).', cached: false },
    { id: 'T02-04', file: 'hub_t02_04_vending.png',         w: 100, h: 152, slots: ['club_vending_machine_prop'],
      pivot: 'bottom-center', classification: 'Decorativo / Equipamiento de discoteca',
      role: 'Maquina expendedora del lado este.', cached: false },
    { id: 'T02-05', file: 'hub_t02_05_cooler.png',          w: 61,  h: 136, slots: ['club_water_cooler_prop'],
      pivot: 'bottom-center', classification: 'Decorativo / Objeto narrativo',
      role: 'Dispensador de agua del lado oeste.', cached: false },
    { id: 'T02-06', file: 'hub_t02_06_bench.png',           w: 256, h: 198, slots: ['limbo_bench_prop'],
      pivot: 'bottom-center', classification: 'Decorativo / Mobiliario secundario',
      role: 'Bancos gemelos junto al descenso.', cached: false },
    { id: 'T02-07', file: 'hub_t02_07_planter.png',         w: 96,  h: 108, slots: ['club_neon_planter_prop'],
      pivot: 'bottom-center', classification: 'Decorativo / Variante visual',
      role: 'Cuatro jardineras fijas del HUB.', cached: false },
    { id: 'T02-08', file: 'hub_t02_08_liftpad.png',         w: 198, h: 104, slots: ['descent_abyssal_lift_pad'],
      pivot: 'center', classification: 'Funcional / Interactivo',
      role: 'Plataforma de descenso y puertas de sala.', cached: false },
    { id: 'T02-09', file: 'hub_t02_09_ceiling_fixture.png', w: 148, h: 38,  slots: ['wall_ceiling_neon_fixture'],
      pivot: 'center', classification: 'Arquitectonico / Iluminacion',
      role: 'Barra de neon horizontal de techo/muro (capa de pared en cache).', cached: true },
    { id: 'T02-10', file: 'hub_t02_10_sconce.png',          w: 48,  h: 60,  slots: ['club_wall_sconce_side'],
      pivot: 'center', classification: 'Arquitectonico / Senalizacion luminosa',
      role: 'Apliques laterales de pared (capa de aristas en cache).', cached: true }
  ];
  var HUB2_IMAGES = {};              /* Image ya decodificados, por id */
  var HUB2_ORIGINALS = {};           /* imagen previa de cada slot, preservada */
  var hub2Applied = false;

  function hub2Err(where, e) {
    var msg = where + ': ' + (e && (e.message || e.type) || String(e));
    if (!st.hub2Errors) st.hub2Errors = [];
    st.hub2Errors.push(msg);
    try { console.warn('[ART_PACK/HUB2] ' + msg); } catch (_) {}
  }

  function hub2Invalidate() {
    /* Los dos slots de capa cacheada (T02-09/T02-10) se pintan una sola vez
       al construir los lienzos de pared. Se usa la API de invalidacion que
       YA emplea __T3B.reload(): DMO_INFERNAL_ART.invalidate() limpia la clave
       de la cache de sala y el motor la recompone con las imagenes nuevas.
       No se anyade ningun lienzo ni se cambia el render. */
    try {
      if (window.DMO_INFERNAL_ART &&
          typeof window.DMO_INFERNAL_ART.invalidate === 'function') {
        window.DMO_INFERNAL_ART.invalidate();
      }
    } catch (e) { hub2Err('invalidate', e); }
    try { window.__DDM_V5_MED_NO_SKULL = null; } catch (_) {}
    try {
      /* API visual existente: incrementa __T3B.revision y fuerza reconstruir
         los lienzos cacheados de suelo/pared. No afecta a logica ni a HUB-01. */
      if (window.__T3B && typeof window.__T3B.setEnabled === 'function') {
        window.__T3B.setEnabled(true);
      }
    } catch (e) { hub2Err('setEnabled', e); }
  }

  function applyHub2() {
    var reg = window.__DDM_V5_IMG;
    if (!reg) { hub2Err('HUB2', '__DDM_V5_IMG no disponible'); return 0; }
    var n = 0;
    HUB2_ASSETS.forEach(function (a) {
      var im = HUB2_IMAGES[a.id];
      if (!im) return;
      try { im.__hubTanda02 = a.id; } catch (_) {}
      a.slots.forEach(function (slot) {
        if (!Object.prototype.hasOwnProperty.call(HUB2_ORIGINALS, slot)) {
          HUB2_ORIGINALS[slot] = reg[slot];   /* recurso anterior, conservado */
        }
        reg[slot] = im;                       /* pintor real del HUB */
        reg['h02_' + a.id.toLowerCase().replace(/-/g, '_')] = im; /* alias trazable */
        n++;
      });
    });
    hub2Applied = (n === HUB2_ASSETS.length);
    hub2Invalidate();
    st.hub2 = {
      version: 'hub-tanda02', count: HUB2_ASSETS.length,
      slotsApplied: n, enabled: hub2Applied,
      loader: '__DDM_V5_IMG[slot] -> __DDM_GET_V5(slot)',
      appliedAt: Date.now()
    };
    return n;
  }

  function restoreHub2() {
    var reg = window.__DDM_V5_IMG, n = 0;
    if (reg) {
      HUB2_ASSETS.forEach(function (a) {
        a.slots.forEach(function (slot) {
          if (!Object.prototype.hasOwnProperty.call(HUB2_ORIGINALS, slot)) return;
          reg[slot] = HUB2_ORIGINALS[slot];
          delete reg['h02_' + a.id.toLowerCase().replace(/-/g, '_')];
          n++;
        });
      });
    }
    hub2Applied = false;
    if (st.hub2) { st.hub2.enabled = false; st.hub2.slotsApplied = 0; }
    hub2Invalidate();
    return n;
  }

  function loadHub2(done) {
    var pending = HUB2_ASSETS.length;
    HUB2_ASSETS.forEach(function (a) {
      var rec = { id: a.id, file: BASEH2 + a.file, expected: [a.w, a.h],
                  loaded: false, natural: null, exactSize: false };
      load(rec.file, rec, function (im) {
        if (im) {
          HUB2_IMAGES[a.id] = im;
          if (!rec.exactSize) hub2Err(a.id, 'dimensiones inesperadas ' + rec.natural);
        } else {
          hub2Err(a.id, 'no se pudo decodificar ' + rec.file);
        }
        if (--pending === 0) done(applyHub2());
      });
    });
  }

  /* Solo lectura: estado VIVO del registro, sin dibujar nada. */
  function hub2() {
    var reg = window.__DDM_V5_IMG || {}, get = window.__DDM_GET_V5;
    var assets = HUB2_ASSETS.map(function (a) {
      var im = HUB2_IMAGES[a.id] || null;
      var live = false, viaLoader = 0, slotsLive = 0;
      a.slots.forEach(function (slot) {
        if (im && reg[slot] === im) slotsLive++;
        try { if (typeof get === 'function' && get(slot) === im) viaLoader++; } catch (_) {}
      });
      live = slotsLive === a.slots.length;
      return {
        id: a.id, file: BASEH2 + a.file, loader: 'V5',
        slots: a.slots.slice(), slotsLive: slotsLive, loaderResolves: viaLoader,
        classification: a.classification, role: a.role, pivot: a.pivot,
        cachedLayer: a.cached, expected: [a.w, a.h],
        natural: im ? [im.naturalWidth, im.naturalHeight] : null,
        exactSize: !!im && im.naturalWidth === a.w && im.naturalHeight === a.h,
        loaded: !!im, live: live,
        originalsPreserved: a.slots.every(function (s) {
          return Object.prototype.hasOwnProperty.call(HUB2_ORIGINALS, s) &&
                 HUB2_ORIGINALS[s] !== im;
        })
      };
    });
    return {
      version: 'hub-tanda02', count: HUB2_ASSETS.length,
      enabled: hub2Applied, applied: assets.filter(function (a) { return a.live; }).length,
      slotsApplied: st.hub2 ? st.hub2.slotsApplied : 0,
      errors: (st.hub2Errors || []).slice(), assets: assets,
      note: 'Solo se sustituye el Image de slots que el motor ya dibuja; '
          + 'geometria, colisiones, sortY, puertas, estaciones y camara permanecen en el motor.'
    };
  }

  function hub2Tag() {
    HUB2_ASSETS.forEach(function (a) {
      var im = HUB2_IMAGES[a.id];
      if (im) { try { im.__hubTanda02 = a.id; } catch (_) {} }
    });
    return HUB2_ASSETS.length;
  }

  /* restore()/apply() existen para QA A/B con la MISMA build y los MISMOS
     parametros. No forman parte del render del juego. */
  function restore() { return restoreArch(); }
  function apply() { return archApplied ? ARCHITECTURE.length : applyArch(); }
  function hubRestore() { return restoreHub(); }
  function hubApply() { return hubApplied ? 9 : applyHub(); }
  function hub2Restore() { return restoreHub2(); }
  function hub2Apply() { return hub2Applied ? HUB2_ASSETS.length : applyHub2(); }

  /* ========================================================================
   * HUB · TANDA 03 — RECONSTRUCCION DE ENTORNO (bloque INDEPENDIENTE HUB3_*)
   * ------------------------------------------------------------------------
   * MISMO registro window.__DDM_V5_IMG, MISMO load(), MISMA invalidacion de
   * caches. No hay segundo motor, canvas superpuesto, HUB estatico, cache
   * nueva, loader paralelo ni registro de imagenes duplicado. Los mapas son
   * independientes de los mapas HUB y HUB2: restoreHub3() no puede deshacer
   * T01/T02 ni restoreHub()/restoreHub2() pueden deshacer T03.
   *
   * AUDITORIA (ART_HUB_TANDA_03_AUDIT.md): las 8 unidades se producen, se
   * cargan con load() y se registran en el MISMO registro V5 con alias h03_*.
   * La INTEGRACION DE RENDER esta BLOQUEADA en las 8: 7 (4 suelos, 2
   * variantes, sistema de 6 senales) no tienen NINGUN slot de dibujo, y
   * T03-07 (`hub_vip_booth_lounge`) tiene un pintor en el CODIGO del canvas
   * del MENU (4 drawImage de 108x68) cuyo renderer NO esta activo en el build
   * en ejecucion (D-07: 0 dibujos medidos en 5 arranques). El loader y la
   * clave V5 si son reales y se verifican. REGISTRO != INTEGRACION.
   * Integrarlos exigiria editar el HTML activo o inventar un pintor nuevo;
   * ambas cosas estan prohibidas. HTML INTACTO.
   *
   * El menu se cachea una sola vez: `d.menu` se reconstruye cuando djReady
   * pasa a true. Por eso startHub3() arranca la carga en el PRIMER instante
   * del boot, no al final de la cadena. Aun asi no hay garantia de que el
   * renderer de pixeles llegue a ejecutarse; la visibilidad en produccion
   * queda clasificada NO VERIFICADO. No se cambia una linea del render.
   * ======================================================================*/

  var BASEH3 = 'ART_ASSETS/hub/tanda_03/';
  var HUB3_ASSETS = [
    { id: 'T03-01', unit: 'HUB_FLOOR_PATCH_O', file: '01_floor_patch_o/final/hub_floor_patch_o.png',
      w: 580, h: 430, alias: 'h03_floor_patch_o', slots: [], drawSlot: null, blocked: true,
      classification: 'Arquitectonico / Suelo (Familia A)', orientation: 'OESTE',
      worldBox: [290, 720, 580, 430] },
    { id: 'T03-02', unit: 'HUB_FLOOR_PATCH_E', file: '02_floor_patch_e/final/hub_floor_patch_e.png',
      w: 580, h: 430, alias: 'h03_floor_patch_e', slots: [], drawSlot: null, blocked: true,
      classification: 'Arquitectonico / Suelo (Familia A)', orientation: 'ESTE',
      worldBox: [1630, 720, 580, 430] },
    { id: 'T03-03', unit: 'HUB_FLOOR_PATCH_S_CRACK', file: '03_floor_patch_s_crack/final/hub_floor_patch_s_crack.png',
      w: 760, h: 329, alias: 'h03_floor_patch_s_crack', slots: [], drawSlot: null, blocked: true,
      classification: 'Arquitectonico / Suelo (Familia A)', orientation: 'SUR',
      worldBox: [870, 1256, 760, 329] },
    { id: 'T03-04', unit: 'HUB_FLOOR_NORTH_DJ', file: '04_floor_north_dj/final/hub_floor_north_dj.png',
      w: 760, h: 224, alias: 'h03_floor_north_dj', slots: [], drawSlot: null, blocked: true,
      classification: 'Arquitectonico / Suelo (Familia A)', orientation: 'NORTE',
      worldBox: [870, 265, 760, 224] },
    { id: 'T03-05', unit: 'HUB_PLANTER_VARIANT_02', file: '05_planter_variant_02/final/hub_planter_variant_02.png',
      w: 96, h: 108, alias: 'h03_planter_variant_02', slots: [], drawSlot: null, blocked: true,
      classification: 'Mobiliario / Variante (Familia B)' },
    { id: 'T03-06', unit: 'HUB_BENCH_VARIANT_02', file: '06_bench_variant_02/final/hub_bench_variant_02.png',
      w: 256, h: 198, alias: 'h03_bench_variant_02', slots: [], drawSlot: null, blocked: true,
      classification: 'Mobiliario / Variante (Familia B)' },
    { id: 'T03-07', unit: 'HUB_VIP_BOOTH_LOUNGE', file: '07_vip_booth_lounge/final/hub_vip_booth_lounge.png',
      w: 216, h: 136, alias: 'h03_vip_booth_lounge', slots: ['hub_vip_booth_lounge'],
      drawSlot: 'hub_vip_booth_lounge', blocked: true, rendererInactive: true,
      classification: 'Espacio VIP / Setpiece de MENU (Familia C)',
      note: '4 drawImage(vb,32,284,108,68) en el canvas del menu; 0 dibujos en el HUB.' },
    { id: 'T03-08-A', unit: 'HUB_ZONE_SIGNAGE/A', file: '08_zone_signage/final/hub_zone_signage_a_pista.png',
      w: 192, h: 128, alias: 'h03_zone_signage_a', slots: [], drawSlot: null, blocked: true,
      classification: 'Senaletica diegetica / Sistema (Familia D)' },
    { id: 'T03-08-B', unit: 'HUB_ZONE_SIGNAGE/B', file: '08_zone_signage/final/hub_zone_signage_b_cabina_dj.png',
      w: 192, h: 128, alias: 'h03_zone_signage_b', slots: [], drawSlot: null, blocked: true,
      classification: 'Senaletica diegetica / Sistema (Familia D)' },
    { id: 'T03-08-C', unit: 'HUB_ZONE_SIGNAGE/C', file: '08_zone_signage/final/hub_zone_signage_c_descenso.png',
      w: 192, h: 128, alias: 'h03_zone_signage_c', slots: [], drawSlot: null, blocked: true,
      classification: 'Senaletica diegetica / Sistema (Familia D)' },
    { id: 'T03-08-D', unit: 'HUB_ZONE_SIGNAGE/D', file: '08_zone_signage/final/hub_zone_signage_d_arsenal.png',
      w: 192, h: 128, alias: 'h03_zone_signage_d', slots: [], drawSlot: null, blocked: true,
      classification: 'Senaletica diegetica / Sistema (Familia D)' },
    { id: 'T03-08-E', unit: 'HUB_ZONE_SIGNAGE/E', file: '08_zone_signage/final/hub_zone_signage_e_barra.png',
      w: 192, h: 128, alias: 'h03_zone_signage_e', slots: [], drawSlot: null, blocked: true,
      classification: 'Senaletica diegetica / Sistema (Familia D)' },
    { id: 'T03-08-F', unit: 'HUB_ZONE_SIGNAGE/F', file: '08_zone_signage/final/hub_zone_signage_f_arcade.png',
      w: 192, h: 128, alias: 'h03_zone_signage_f', slots: [], drawSlot: null, blocked: true,
      classification: 'Senaletica diegetica / Sistema (Familia D)' }
  ];
  var HUB3_IMAGES = {};
  var HUB3_ORIGINALS = {};
  var hub3Applied = false;

  function hub3Err(where, e) {
    var msg = where + ': ' + (e && (e.message || e.type) || String(e));
    if (!st.hub3Errors) st.hub3Errors = [];
    st.hub3Errors.push(msg);
    try { console.warn('[ART_PACK/HUB3] ' + msg); } catch (_) {}
  }

  function hub3Invalidate() {
    /* APIs de invalidacion YA existentes (identicas a hub2Invalidate). Ningun
       asset HUB3 se pinta en las dos capas cacheadas del HUB: se conservan
       intactas y solo se fuerza su recomposicion para que la composicion de
       las dos capas siga siendo la del motor. El canvas del MENU no expone
       invalidacion publica; por eso HUB3 se registra ANTES de que se construya. */
    try {
      if (window.DMO_INFERNAL_ART &&
          typeof window.DMO_INFERNAL_ART.invalidate === 'function') {
        window.DMO_INFERNAL_ART.invalidate();
      }
    } catch (e) { hub3Err('invalidate', e); }
    try { window.__DDM_V5_MED_NO_SKULL = null; } catch (_) {}
    try {
      if (window.__T3B && typeof window.__T3B.setEnabled === 'function') {
        window.__T3B.setEnabled(true);
      }
    } catch (e) { hub3Err('setEnabled', e); }
  }

  function applyHub3() {
    var reg = window.__DDM_V5_IMG;
    if (!reg) { hub3Err('HUB3', '__DDM_V5_IMG no disponible'); return 0; }
    var n = 0, slotsRegistered = 0;
    HUB3_ASSETS.forEach(function (a) {
      var im = HUB3_IMAGES[a.id];
      if (!im) return;
      try { im.__hubTanda03 = a.id; } catch (_) {}
      if (!Object.prototype.hasOwnProperty.call(HUB3_ORIGINALS, a.alias)) {
        HUB3_ORIGINALS[a.alias] = reg[a.alias];
      }
      reg[a.alias] = im;                 /* clave trazable, sin registro nuevo */
      a.slots.forEach(function (slot) {  /* UNICO slot con pintor real: menu */
        if (!Object.prototype.hasOwnProperty.call(HUB3_ORIGINALS, slot)) {
          HUB3_ORIGINALS[slot] = reg[slot];
        }
        reg[slot] = im;
        slotsRegistered++;
      });
      n++;
    });
    hub3Applied = (n === HUB3_ASSETS.length);
    hub3Invalidate();
    st.hub3 = {
      version: 'hub-tanda03', count: HUB3_ASSETS.length,
      productionUnits: 8, files: HUB3_ASSETS.length,
      registered: n, registeredDrawSlots: slotsRegistered,
      verifiedDraws: 0,
      blocked: HUB3_ASSETS.length,
      enabled: hub3Applied,
      loader: 'load() -> __DDM_V5_IMG[alias h03_*] y __DDM_GET_V5(hub_vip_booth_lounge)',
      note: '13/13 PNG cargados y registrados. Integracion de RENDER BLOQUEADA '
          + 'en las 8 unidades: 7 sin slot y el pintor del MENU inactivo (D-07). '
          + '0 drawImage verificados en produccion. HTML intacto.',
      appliedAt: Date.now()
    };
    return n;
  }

  function restoreHub3() {
    var reg = window.__DDM_V5_IMG, n = 0;
    if (reg) {
      HUB3_ASSETS.forEach(function (a) {
        if (!Object.prototype.hasOwnProperty.call(HUB3_ORIGINALS, a.alias)) return;
        reg[a.alias] = HUB3_ORIGINALS[a.alias];
        if (reg[a.alias] === undefined) delete reg[a.alias];
        a.slots.forEach(function (slot) {
          if (!Object.prototype.hasOwnProperty.call(HUB3_ORIGINALS, slot)) return;
          reg[slot] = HUB3_ORIGINALS[slot];
          if (reg[slot] === undefined) delete reg[slot];
        });
        n++;
      });
    }
    hub3Applied = false;
    if (st.hub3) { st.hub3.enabled = false; st.hub3.registered = 0; st.hub3.registeredDrawSlots = 0; }
    hub3Invalidate();
    return n;
  }

  function loadHub3(done) {
    var pending = HUB3_ASSETS.length;
    HUB3_ASSETS.forEach(function (a) {
      var rec = { id: a.id, file: BASEH3 + a.file, expected: [a.w, a.h],
                  loaded: false, natural: null, exactSize: false };
      load(rec.file, rec, function (im) {
        if (im) {
          HUB3_IMAGES[a.id] = im;
          if (!rec.exactSize) hub3Err(a.id, 'dimensiones inesperadas ' + rec.natural);
        } else {
          hub3Err(a.id, 'no se pudo decodificar ' + rec.file);
        }
        if (--pending === 0) done(applyHub3());
      });
    });
  }

  /* Solo lectura: estado VIVO del registro, sin dibujar nada. */
  function hub3() {
    var reg = window.__DDM_V5_IMG || {}, get = window.__DDM_GET_V5;
    var assets = HUB3_ASSETS.map(function (a) {
      var im = HUB3_IMAGES[a.id] || null;
      var viaLoader = 0, slotsLive = 0;
      a.slots.forEach(function (slot) {
        if (im && reg[slot] === im) slotsLive++;
        try { if (typeof get === 'function' && get(slot) === im) viaLoader++; } catch (_) {}
      });
      return {
        id: a.id, unit: a.unit, file: BASEH3 + a.file,
        alias: a.alias, aliasLive: !!(im && reg[a.alias] === im),
        slots: a.slots.slice(), slotsLive: slotsLive, loaderResolves: viaLoader,
        drawSlot: a.drawSlot, blocked: true,
        visibleInGame: false,
        rendererInactiveD07: !a.blocked,
        classification: a.classification, orientation: a.orientation || null,
        worldBox: a.worldBox || null, expected: [a.w, a.h],
        natural: im ? [im.naturalWidth, im.naturalHeight] : null,
        exactSize: !!im && im.naturalWidth === a.w && im.naturalHeight === a.h,
        loaded: !!im, registered: !!(im && reg[a.alias] === im),
        originalsPreserved: Object.prototype.hasOwnProperty.call(HUB3_ORIGINALS, a.alias) &&
                            HUB3_ORIGINALS[a.alias] !== im
      };
    });
    return {
      version: 'hub-tanda03', count: HUB3_ASSETS.length,
      productionUnits: 8, enabled: hub3Applied,
      registered: assets.filter(function (a) { return a.registered; }).length,
      loaded: assets.filter(function (a) { return a.loaded; }).length,
      exactSize: assets.filter(function (a) { return a.exactSize; }).length,
      blocked: assets.filter(function (a) { return a.blocked; }).length,
      verifiedDraws: 0,
      registeredDrawSlots: assets.filter(function (a) { return a.slotsLive > 0; }).length,
      errors: (st.hub3Errors || []).slice(), assets: assets,
      note: '13/13 PNG registrados; 8/8 unidades BLOQUEADAS para render. '
          + 'El unico pintor del codigo (MENU) no esta activo en el build (D-07): '
          + '0 drawImage medidos. No se inventa render nuevo ni se toca el HTML.'
    };
  }

  function hub3Tag() {
    HUB3_ASSETS.forEach(function (a) {
      var im = HUB3_IMAGES[a.id];
      if (im) { try { im.__hubTanda03 = a.id; } catch (_) {} }
    });
    return HUB3_ASSETS.length;
  }
  function hub3Restore() { return restoreHub3(); }
  function hub3Apply() { return hub3Applied ? HUB3_ASSETS.length : applyHub3(); }

  /* ======================================================================
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
    { id: 'T05-01', unit: 'garra_del_limbo', file: '01_garra_del_limbo/final/hub_t05_01_garra_del_limbo.png', w: 147, h: 280, alias: 'h05_garra_del_limbo',
      x: 455, y: 1310, worldH: 180, category: 'A · Máquinas y entretenimiento' },
    { id: 'T05-02', unit: 'banco_del_olvido', file: '02_banco_del_olvido/final/hub_t05_02_banco_del_olvido.png', w: 133, h: 240, alias: 'h05_banco_del_olvido',
      x: 2040, y: 1160, worldH: 150, category: 'A/D · Máquinas y terminales' },
    { id: 'T05-03', unit: 'subwoofer_stack', file: '03_subwoofer_stack/final/hub_t05_03_subwoofer_stack.png', w: 253, h: 160, alias: 'h05_subwoofer_stack',
      x: 905, y: 430, worldH: 120, category: 'B · Equipamiento de discoteca' },
    { id: 'T05-04', unit: 'video_wall', file: '04_video_wall/final/hub_t05_04_video_wall.png', w: 249, h: 144, alias: 'h05_video_wall',
      x: 1560, y: 360, worldH: 110, category: 'B/C · Equipamiento audiovisual y decoración' },
    { id: 'T05-05', unit: 'consola_auxiliar', file: '05_consola_aux/final/hub_t05_05_consola_aux.png', w: 150, h: 140, alias: 'h05_consola_aux',
      x: 1560, y: 520, worldH: 70, category: 'B · Equipamiento de discoteca' },
    { id: 'T05-06', unit: 'neon_ultimo_trago', file: '06_neon_ultimo_trago/final/hub_t05_06_neon_ultimo_trago.png', w: 201, h: 192, alias: 'h05_neon_ultimo_trago',
      x: 1910, y: 640, worldH: 96, category: 'C · Decoración ambiental' },
    { id: 'T05-07', unit: 'cartel_ultima_sesion', file: '07_cartel_ultima_sesion/final/hub_t05_07_cartel_ultima_sesion.png', w: 196, h: 130, alias: 'h05_cartel_ultima_sesion',
      x: 600, y: 760, worldH: 120, category: 'C · Decoración ambiental / objeto narrativo' },
    { id: 'T05-08', unit: 'line_array_colgante', file: '08_line_array/final/hub_t05_08_line_array.png', w: 68, h: 178, alias: 'h05_line_array',
      x: 1250, y: 720, worldH: 170, category: 'B/C · Equipamiento / elemento colgante' },
    { id: 'T05-09', unit: 'cordon_vip', file: '09_cordon_vip/final/hub_t05_09_cordon_vip.png', w: 128, h: 120, alias: 'h05_cordon_vip',
      x: 930, y: 560, worldH: 80, category: 'C/D · Decoración y circulación' },
    { id: 'T05-10', unit: 'confesionario_neon', file: '10_confesionario/final/hub_t05_10_confesionario.png', w: 158, h: 260, alias: 'h05_confesionario',
      x: 1715, y: 700, worldH: 150, category: 'A/D · Dispositivo del universo / interactividad potencial' },
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

  /* === TANDA06:BEGIN · HUB6_* (mismo load(), mismo registro V5) =============
     Envolvente arquitectónica T06. Se encadena tras loadHub5() usando el MISMO
     cargador load() y el MISMO registro window.__DDM_V5_IMG. restoreHub6()
     solo deshace TANDA 06; no afecta a T01/T02/T03/T04/T05.
     ======================================================================*/
  var BASEH6 = 'ART_ASSETS/hub/tanda_06/';
  var HUB6_ASSETS = [
    { id: 'T06-01', unit: 'paramento_norte_oeste', file: '01_paramento_norte_o/final/hub_t06_01_paramento_norte_o.png', w: 391, h: 162, alias: 'h06_paramento_norte_o',
      x: 681, y: 330, worldH: 150, category: 'A · Envolvente / paramentos' },
    { id: 'T06-02', unit: 'paramento_norte_central', file: '02_paramento_norte_c/final/hub_t06_02_paramento_norte_c.png', w: 544, h: 162, alias: 'h06_paramento_norte_c',
      x: 1114, y: 330, worldH: 150, category: 'A · Envolvente / paramentos' },
    { id: 'T06-03', unit: 'paramento_norte_este', file: '03_paramento_norte_e/final/hub_t06_03_paramento_norte_e.png', w: 529, h: 162, alias: 'h06_paramento_norte_e',
      x: 1611, y: 330, worldH: 150, category: 'A · Envolvente / paramentos' },
    { id: 'T06-04', unit: 'machon_esquina_noroeste', file: '04_machon_esquina_no/final/hub_t06_04_machon_esquina_no.png', w: 138, h: 162, alias: 'h06_machon_esquina_no',
      x: 600, y: 330, worldH: 150, category: 'B · Esquinas / uniones' },
    { id: 'T06-05', unit: 'machon_esquina_noreste', file: '05_machon_esquina_ne/final/hub_t06_05_machon_esquina_ne.png', w: 120, h: 162, alias: 'h06_machon_esquina_ne',
      x: 1900, y: 330, worldH: 150, category: 'B · Esquinas / uniones' },
    { id: 'T06-06', unit: 'paramento_oeste', file: '06_paramento_oeste/final/hub_t06_06_paramento_oeste.png', w: 110, h: 392, alias: 'h06_paramento_oeste',
      x: 330, y: 1160, worldH: 380, category: 'A · Envolvente / paramentos' },
    { id: 'T06-07', unit: 'paramento_este', file: '07_paramento_este/final/hub_t06_07_paramento_este.png', w: 86, h: 392, alias: 'h06_paramento_este',
      x: 2170, y: 1160, worldH: 380, category: 'A · Envolvente / paramentos' },
    { id: 'T06-08', unit: 'viga_caseton_techo', file: '08_viga_caseton_techo/final/hub_t06_08_viga_caseton_techo.png', w: 587, h: 102, alias: 'h06_viga_caseton_techo',
      x: 1250, y: 330, worldH: 90, category: 'C · Techos y elementos superiores' },
    { id: 'T06-09', unit: 'cortinaje_acustico', file: '09_cortinaje_acustico/final/hub_t06_09_cortinaje_acustico.png', w: 101, h: 242, alias: 'h06_cortinaje_acustico',
      x: 1865, y: 430, worldH: 230, category: 'C · Techos, cortinajes y remates' },
    { id: 'T06-10', unit: 'zocalo_remate_suelo', file: '10_zocalo_remate_suelo/final/hub_t06_10_zocalo_remate_suelo.png', w: 428, h: 48, alias: 'h06_zocalo_remate_suelo',
      x: 1250, y: 340, worldH: 36, category: 'E · Remates y transiciones' },
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


  /* === TANDA07:BEGIN · HUB7_* (mismo load(), mismo registro V5) =============
     «El umbral del infierno». 6 assets: 4 texturas RGBA de geografía y 2
     placas JPEG de llegada/descenso. Se encadena tras loadHub6(). No hay
     segundo loader, segundo canvas ni cambio de cámara/audio. */
  var BASEH7 = 'ART_ASSETS/hub/tanda_07/';
  var HUB7_ASSETS = [
    { id: 'T07-01', unit: 'labio_acantilado', file: '01_labio/final/hub_t07_01_labio.png', w: 1500, h: 115, alias: 'h07_labio_acantilado', worldH: 115, category: 'COTA -01 · labio' },
    { id: 'T07-02', unit: 'estrato_rococo', file: '02_estrato/final/hub_t07_02_estrato.png', w: 2100, h: 110, alias: 'h07_estrato_rococo', worldH: 110, category: 'COTA -02 · pared rocosa' },
    { id: 'T07-03', unit: 'apertura_profundidad', file: '03_apertura/final/hub_t07_03_apertura.png', w: 420, h: 260, alias: 'h07_apertura_profundidad', worldH: 260, category: 'COTA -02/-03 · abertura' },
    { id: 'T07-04', unit: 'exterior_infernal', file: '04_exterior/final/hub_t07_04_exterior.jpg', w: 1280, h: 720, alias: 'h07_exterior_infernal', worldH: 0, category: 'Fase 2 · llegada' },
    { id: 'T07-05', unit: 'pozo_capas', file: '05_pozo/final/hub_t07_05_pozo.png', w: 512, h: 1024, alias: 'h07_pozo_capas', worldH: 0, category: 'Fase 4 · descenso' },
    { id: 'T07-06', unit: 'panorama_acantilado', file: '06_panorama/final/hub_t07_06_panorama.jpg', w: 1280, h: 720, alias: 'h07_panorama_acantilado', worldH: 0, category: 'Fase 2 · placa intermedia' }
  ];
  var HUB7_IMAGES = {};
  var HUB7_ORIGINALS = {};
  var hub7Applied = false;

  function hub7Err(where, e) {
    var msg = where + ': ' + (e && (e.message || e.type) || String(e));
    if (!st.hub7Errors) st.hub7Errors = [];
    st.hub7Errors.push(msg);
    try { console.warn('[ART_PACK/HUB7] ' + msg); } catch (_) {}
  }
  function hub7Invalidate() {
    try {
      if (window.DMO_INFERNAL_ART && typeof window.DMO_INFERNAL_ART.invalidate === 'function') {
        window.DMO_INFERNAL_ART.invalidate();
      }
    } catch (e) { hub7Err('invalidate', e); }
    try {
      if (window.__T3B && typeof window.__T3B.setEnabled === 'function') window.__T3B.setEnabled(true);
    } catch (e) { hub7Err('setEnabled', e); }
  }
  function applyHub7() {
    var reg = window.__DDM_V5_IMG;
    if (!reg) { hub7Err('HUB7', '__DDM_V5_IMG no disponible'); return 0; }
    var n = 0;
    HUB7_ASSETS.forEach(function (a) {
      var im = HUB7_IMAGES[a.id];
      if (!im) return;
      try { im.__hubTanda07 = a.id; } catch (_) {}
      if (!Object.prototype.hasOwnProperty.call(HUB7_ORIGINALS, a.alias)) HUB7_ORIGINALS[a.alias] = reg[a.alias];
      reg[a.alias] = im; n++;
    });
    hub7Applied = (n === HUB7_ASSETS.length);
    hub7Invalidate();
    st.hub7 = {
      version: 'hub-tanda07', count: HUB7_ASSETS.length,
      productionUnits: HUB7_ASSETS.length, files: HUB7_ASSETS.length,
      registered: n, enabled: hub7Applied,
      loader: 'load() -> __DDM_V5_IMG[alias h07_*]',
      renderer: 'DEADBEAT_DISCO.ART.html :: hooks Wf/Ph/zf (T07)',
      flag: 'window.__DDM_HUB_T07 !== false',
      note: '6/6 assets T07 en el MISMO registro V5 y MISMO load(). '
          + 'Sin segundo motor, canvas, cámara ni audio.',
      appliedAt: Date.now()
    };
    return n;
  }
  function restoreHub7() {
    var reg = window.__DDM_V5_IMG, n = 0;
    if (reg) {
      HUB7_ASSETS.forEach(function (a) {
        if (!Object.prototype.hasOwnProperty.call(HUB7_ORIGINALS, a.alias)) return;
        reg[a.alias] = HUB7_ORIGINALS[a.alias];
        if (reg[a.alias] === undefined) delete reg[a.alias];
        n++;
      });
    }
    hub7Applied = false;
    if (st.hub7) { st.hub7.enabled = false; st.hub7.registered = 0; }
    hub7Invalidate();
    return n;
  }
  function loadHub7(done) {
    var pending = HUB7_ASSETS.length;
    HUB7_ASSETS.forEach(function (a) {
      var rec = { id: a.id, file: BASEH7 + a.file, expected: [a.w, a.h],
                  loaded: false, natural: null, exactSize: false };
      load(rec.file, rec, function (im) {
        if (im) {
          HUB7_IMAGES[a.id] = im;
          if (!rec.exactSize) hub7Err(a.id, 'dimensiones inesperadas ' + rec.natural);
        } else hub7Err(a.id, 'no se pudo decodificar ' + rec.file);
        if (--pending === 0) done(applyHub7());
      });
    });
  }
  function hub7() {
    var reg = window.__DDM_V5_IMG || {}, get = window.__DDM_GET_V5;
    var list = HUB7_ASSETS.map(function (a) {
      var im = HUB7_IMAGES[a.id] || null;
      var resolves = 0;
      try { if (typeof get === 'function' && get(a.alias) === im) resolves = 1; } catch (_) {}
      return {
        id: a.id, unit: a.unit, file: BASEH7 + a.file, alias: a.alias,
        aliasLive: !!(im && reg[a.alias] === im), loaderResolves: resolves,
        expected: [a.w, a.h], natural: im ? [im.naturalWidth, im.naturalHeight] : null,
        exactSize: !!im && im.naturalWidth === a.w && im.naturalHeight === a.h,
        loaded: !!im, registered: !!(im && reg[a.alias] === im)
      };
    });
    return {
      version: 'hub-tanda07', count: HUB7_ASSETS.length,
      productionUnits: HUB7_ASSETS.length, enabled: hub7Applied,
      registered: list.filter(function (a) { return a.registered; }).length,
      loaded: list.filter(function (a) { return a.loaded; }).length,
      exactSize: list.filter(function (a) { return a.exactSize; }).length,
      errors: (st.hub7Errors || []).slice(), assets: list,
      note: '6/6 PNG/JPG de TANDA 07 en el MISMO registro V5 y MISMO load().'
    };
  }
  function hub7Tag() {
    HUB7_ASSETS.forEach(function (a) {
      var im = HUB7_IMAGES[a.id];
      if (im) { try { im.__hubTanda07 = a.id; } catch (_) {} }
    });
    return HUB7_ASSETS.length;
  }
  function hub7Restore() { return restoreHub7(); }
  function hub7Apply() { return hub7Applied ? HUB7_ASSETS.length : applyHub7(); }
  /* === TANDA07:END · HUB7_* ================================================ */

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

  /* ======================================================================
   * TANDA 03 · FASE D — PROTAGONISTA NUEVO (8 estados)
   * ----------------------------------------------------------------------
   * No hay un segundo cargador, ni un segundo render, ni un segundo
   * <script>. Se usa el MISMO registro que ensureHdImg() ya consulta
   * (window.__HD_ASSETS.images) y el MISMO Pf() del modulo v3.2.
   *
   * IMPORTANTE: todo el juego vive en un unico <script> IIFE con
   * "use strict", por lo que Pf / it / ANATOMY_SPINE NO son globales.
   * El unico punto de enganche publico del protagonista es
   * window.DMO.playerAnim (w.playerAnim = pAnim). Se conecta ahi con
   * setters sobre las propiedades que pAnim.update()/transitionTo()
   * escriben en cada tick: state, waistSplitActive, stridePhase y
   * walkFrame. No se reimplementa Pf ni se crea un gestor paralelo.
   *
   * Cada clave de PLAYER_ASSET_MAP recibe un canvas derivado de los PNG de
   * FASE C, reescalado al formato nativo del motor: 96 px de alto, ancho
   * 2*ANATOMY_SPINE[key].spineX para que dx = -spineX*scaleY deje el
   * centro del personaje en el origen, y el pie en footGroundY. La
   * muerte usa el 95x29 que el propio Pf() espera para un cuerpo caido.
   *
   * Hoy hay 1 frame por estado: presentacion estatica sincronizada con
   * el estado del motor. SEQUENCES es un ARRAY por estado y los setters
   * de stridePhase/walkFrame ya notifican cada tick: incorporar
   * secuencias animadas despues solo exige poblar el array y que
   * resolveFrame() elija el indice por fase. La integracion NO se rehace.
   *
   * No se tocan mecanicas, controles, armas, colisiones, IA, Director,
   * economia, progresion, guardado, salas, HUD ni transiciones. El unico
   * flag que se fija es pAnim.waistSplitActive (flag VISUAL de Pf):
   * el waist-split parte el sprite en y=53 y aplica clearRect a
   * coordenadas del arte pixel de 96px, ademas de tener su propia cache
   * de piernas con el sprite antiguo. Se usa la rama "Full-body
   * spine-aligned pose" del propio Pf().
   * ==================================================================== */
  var BASE3 = 'ART_ASSETS/tanda_03/fase_c/';
  var P3_W = 560, P3_H = 1130, P3_GROUND = 1130, P3_CX = 280;

  /* Orden de integracion: IDLE -> CAMINAR -> CORRER -> DISPARAR ->
     DISPARO_CARGADO -> HABILIDAD -> DANO -> MUERTE. sw/sh son la silueta
     medida en el manifest de FASE C; se usan solo para el escalado. */
  var P3_ASSETS = [
    { name: 'IDLE',             file: 'IDLE.png',             state: 'idle',    p: 10,  sw: 257, sh: 1128 },
    { name: 'CAMINAR',          file: 'CAMINAR.png',          state: 'walk',    p: 15,  sw: 319, sh: 1125 },
    { name: 'CORRER',           file: 'CORRER.png',           state: 'run',     p: 20,  sw: 268, sh: 1127 },
    { name: 'DISPARAR',         file: 'DISPARAR.png',         state: 'shoot',   p: 60,  sw: 427, sh: 1124 },
    { name: 'DISPARO_CARGADO',  file: 'DISPARO_CARGADO.png',  state: 'charged', p: 65,  sw: 455, sh: 1125 },
    { name: 'HABILIDAD',        file: 'HABILIDAD.png',        state: 'ability', p: 70,  sw: 256, sh: 1129 },
    { name: 'DANO',             file: 'DANO.png',             state: 'hurt',    p: 80,  sw: 262, sh: 1126 },
    { name: 'MUERTE',           file: 'MUERTE.png',           state: 'death',   p: 100, sw: 558, sh: 181 }
  ];

  /* Estado real del motor (STATE_PRIORITIES / DMO.playerAnim.state) ->
     secuencia. Los estados sin asset propio reutilizan el mas cercano;
     ninguno queda sin imagen, incluidos fire2/firehip que la build traia
     sin __HD_DATA y caian al render pixel antiguo. */
  var STATE_SEQUENCE = {
    idle: 'IDLE', walk: 'CAMINAR', run: 'CORRER',
    shoot: 'DISPARAR', aim: 'DISPARAR', charged: 'DISPARO_CARGADO',
    melee: 'DISPARAR', reload: 'DISPARAR', weaponSwitch: 'IDLE',
    ability: 'HABILIDAD', hurt: 'DANO', stun: 'DANO',
    dodge: 'CORRER', victory: 'IDLE', interact: 'IDLE',
    death: 'MUERTE'
  };

  /* Claves EXACTAS de PLAYER_ASSET_MAP + spineX de ANATOMY_SPINE. */
  var P3_POSES = [
    { key: 'player_idle',    path: 'player/player_idle_00.png',    spineX: 17.2, W: 34.4, H: 96 },
    { key: 'player_walk0',   path: 'player/player_walk_00.png',    spineX: 22.8, W: 45.6, H: 96 },
    { key: 'player_walk1',   path: 'player/player_walk_01.png',    spineX: 20.0, W: 40.0, H: 96 },
    { key: 'player_walk2',   path: 'player/player_walk_02.png',    spineX: 23.0, W: 46.0, H: 96 },
    { key: 'player_walk3',   path: 'player/player_walk_03.png',    spineX: 18.6, W: 37.2, H: 96 },
    { key: 'player_fire',    path: 'player/player_shoot_00.png',   spineX: 27.0, W: 54.0, H: 96 },
    { key: 'player_fire2',   path: 'player/player_fire2.png',      spineX: 43.3, W: 86.6, H: 96 },
    { key: 'player_firehip', path: 'player/player_firehip.png',    spineX: 27.0, W: 54.0, H: 96 },
    { key: 'player_hit',     path: 'player/player_hurt_00.png',    spineX: 28.5, W: 57.0, H: 96 },
    { key: 'player_roll',    path: 'player/player_roll_00.png',    spineX: 33.0, W: 66.0, H: 96 },
    { key: 'player_death',   path: 'player/player_death_00.png',   spineX: 48.0, W: 95.0, H: 29 },
    { key: 'player_boost',   path: 'player/player_boost_00.png',   spineX: 39.5, W: 79.0, H: 96 }
  ];

  /* Mano dominante real de cada asset, medida sobre el lienzo 560x1130 de
     FASE C (centro del cluster de piel mas a la derecha; CORRER corregido a
     mano porque su puño queda por debajo del hombro). Es la referencia
     anatomica del arte NUEVO, no del sprite pixel de 96px. */
  var P3_HAND_PX = {
    IDLE: [391, 597], CAMINAR: [422, 590], CORRER: [385, 430],
    DISPARAR: [472, 299], DISPARO_CARGADO: [487, 333],
    HABILIDAD: [388, 227], DANO: [355, 497], MUERTE: [300, 1050]
  };
  /* FASE D.2 · Mano de APOYO medida sobre el mismo lienzo 560x1130 de
     FASE C, con cuadricula de verificacion (la primera pasada automatica
     marcaba el hombro; estos son los extremos reales del brazo contrario,
     comprobados visualmente sobre los 8 PNG). MUERTE es inerte: el motor
     no dibuja arma en death/roll (noWeapon). */
  var P3_HANDSUP_PX = {
    IDLE: [165, 655], CAMINAR: [190, 640], CORRER: [340, 500],
    DISPARAR: [400, 370], DISPARO_CARGADO: [385, 365],
    HABILIDAD: [390, 640], DANO: [320, 490], MUERTE: [220, 1020]
  };
  /* Secuencia por defecto de cada clave del motor, para calibrar las poses
     que aun no han pasado por el render de este tick. */
  var P3_POSE_SEQ = {
    player_idle: 'IDLE', player_walk0: 'CAMINAR', player_walk1: 'CAMINAR',
    player_walk2: 'CAMINAR', player_walk3: 'CAMINAR',
    player_fire: 'DISPARAR', player_fire2: 'DISPARO_CARGADO',
    player_firehip: 'DISPARAR', player_hit: 'DANO',
    player_roll: 'CORRER', player_death: 'MUERTE', player_boost: 'HABILIDAD'
  };

  var P3_BY_NAME = {}, P3_POSE_BY_KEY = {}, P3_HAND_ARRAYS = {};
  P3_ASSETS.forEach(function (a) { P3_BY_NAME[a.name] = a; });
  P3_POSES.forEach(function (p) { P3_POSE_BY_KEY[p.key] = p; });
  var P3_IMAGES = {};       /* nombre -> Image 560x1130 de FASE C */
  var P3_CANVAS = {};       /* poseKey -> canvas derivado, mismo registro */
  var P3_ORIGINALS = {};    /* imagen previa, conservada para QA A/B */
  var P3_SEQUENCES = {};    /* estado de diseno -> [nombres de frame] */
  var p3Current = null, p3Ready = false, p3Hooked = false, p3Anim = null;

  function p3Register() {
    var reg = window.__HD_ASSETS && window.__HD_ASSETS.images;
    if (!reg) return false;
    P3_POSES.forEach(function (p) {
      var cnv = document.createElement('canvas');
      cnv.width = Math.round(p.W);
      cnv.height = p.H;
      /* El render lee naturalWidth/naturalHeight/complete. Un canvas es
         drawable; estos getters lo hacen indistinguible de un Image para
         ensureHdImg(), getCleanWalkLower() y g.drawImage(). */
      Object.defineProperty(cnv, 'naturalWidth',
        { configurable: true, get: function () { return cnv.width; } });
      Object.defineProperty(cnv, 'naturalHeight',
        { configurable: true, get: function () { return cnv.height; } });
      Object.defineProperty(cnv, 'complete',
        { configurable: true, get: function () { return p3Ready; } });
      P3_CANVAS[p.key] = cnv;
      if (Object.prototype.hasOwnProperty.call(reg, p.key)) {
        P3_ORIGINALS[p.key] = reg[p.key];
      }
      reg[p.key] = cnv;                 /* MISMO registro que ensureHdImg */
      if (window.__HD_EXTRA) window.__HD_EXTRA[p.path] = cnv;
    });
    return true;
  }

  /* Pinta el frame activo en los 12 canvas. f = min(W/sw, H/sh) conserva
     el aspecto SIEMPRE; dx centra el cuerpo y dy deja el pie en el borde
     inferior del canvas, que es el footGroundY del motor. */
  function p3Draw(name) {
    var im = P3_IMAGES[name], a = P3_BY_NAME[name];
    if (!im || !a) return;
    P3_POSES.forEach(function (p) {
      var cnv = P3_CANVAS[p.key];
      if (!cnv) return;
      var ctx = cnv.getContext('2d');
      ctx.clearRect(0, 0, cnv.width, cnv.height);
      var f = Math.min(cnv.width / a.sw, cnv.height / a.sh);
      var dx = cnv.width / 2 - P3_CX * f;
      var dy = cnv.height - P3_GROUND * f;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(im, dx, dy, P3_W * f, P3_H * f);
    });
    /* FASE D.2 · Mano de APOYO en la referencia anatomica real.
       El render de armas articula el antebrazo de apoyo recortando
       hdImages.player_fire2 en (sx=55, sy=20, sw=29, sh=10) y lo estira
       hasta ov.sup (it(), getOrientedWeaponDrawable). Con el arte FASE C
       escalado por p3Draw, esa region cae fuera del personaje: el brazo
       salia vacio. Se rellena SOLO esa ventana con el antebrazo/mano de
       apoyo medido en el PNG original, en el MISMO registro de imagenes,
       usando las mismas coordenadas del lienzo 560x1130. No se crea otro
       asset, ni otro registro, ni otra transformacion. */
    var supCnv = P3_CANVAS.player_fire2, sup = P3_HANDSUP_PX[name];
    if (supCnv && sup && im) {
      var sx = Math.max(0, Math.min(P3_W - 60, sup[0] - 30));
      var sy = Math.max(0, Math.min(P3_H - 22, sup[1] - 11));
      supCnv.getContext('2d').drawImage(im, sx, sy, 60, 22, 55, 20, 29, 10);
    }
  }

  /* Arquitectura de secuencias: hoy devuelve el unico frame. Cuando un
     estado tenga N fotogramas, basta con poblar SEQUENCES[name] y elegir
     aqui el indice por stridePhase / stateTime / walkFrame; los setters
     ya notifican cada tick, asi que no hay que rehacer la integracion. */
  function p3Resolve(name, pa) {
    var seq = P3_SEQUENCES[name] || P3_SEQUENCES.IDLE || ['IDLE'];
    var idx = 0;
    /* if (seq.length > 1) idx = Math.floor(((pa && pa.stridePhase) || 0) * seq.length) % seq.length; */
    return seq[idx];
  }

  /* FASE D.2 · Convierte CUALQUIER punto medido del asset FASE C
     (mano dominante o mano de apoyo) a coordenadas NATIVAS del motor:
     mismas f, dx y dy que p3Draw, incluido el redondeo del ancho del
     canvas. Una sola transformacion para las dos manos: no hay una
     segunda fuente de verdad geometrica. */
  function p3HandPoint(kind, name, key) {
    var p = P3_POSE_BY_KEY[key], a = P3_BY_NAME[name];
    var table = kind === 'sup' ? P3_HANDSUP_PX : P3_HAND_PX;
    var h = table[name];
    if (!p || !a || !h) return null;
    var W = Math.round(p.W), H = p.H;
    var f = Math.min(W / a.sw, H / a.sh);
    var dx = W / 2 - P3_CX * f;
    var dy = H - P3_GROUND * f;
    return [+(dx + h[0] * f).toFixed(2), +(dy + h[1] * f).toFixed(2)];
  }
  function p3HandDom(name, key) { return p3HandPoint('dom', name, key); }
  function p3HandSup(name, key) { return p3HandPoint('sup', name, key); }

  /* Separacion real entre las dos manos del arte nuevo, en px nativos.
     El agarre secundario del arma se dibuja en it() a
     (r.hd.sup - r.hd.grip) * len * 95 px de la empuñadura; weaponRig.table()
     expone grip/support/lenFrac, asi que la comparacion se hace contra la
     fuente REAL del motor, no contra valores copiados. */
  function p3SupportGap(name, key) {
    var d = p3HandDom(name, key), s = p3HandSup(name, key);
    if (!d || !s) return null;
    return +Math.hypot(d[0] - s[0], d[1] - s[1]).toFixed(2);
  }

  function p3SupportAudit(weaponId) {
    var rig = window.DMO && window.DMO.weaponRig, pa = p3Anim;
    if (!rig || !pa || typeof rig.table !== 'function') return null;
    var name = p3Resolve(STATE_SEQUENCE[pa.state] || 'IDLE', pa);
    var key = pa.upperPose || 'player_idle';
    var gap = p3SupportGap(name, key);
    if (gap === null) return null;
    var t = null;
    try { t = rig.table().filter(function (x) { return x.id === weaponId; })[0]; }
    catch (e) { return null; }
    if (!t || t.support === null) return { weapon: weaponId, twoHanded: false,
      handDom: p3HandDom(name, key), handSup: p3HandSup(name, key),
      spriteGapPx: gap };
    /* lenFrac del arma * canonH(95) convierte la fraccion a px del render */
    var weaponGap = +((t.support - t.grip) * t.lenFrac * 95).toFixed(2);
    return { weapon: weaponId, twoHanded: true,
      handDom: p3HandDom(name, key), handSup: p3HandSup(name, key),
      spriteGapPx: gap, weaponGripGapPx: weaponGap,
      deviationPx: +(weaponGap - gap).toFixed(2),
      source: 'weaponRig.table().support/grip/lenFrac' };
  }

  /* FASE D.2 · Precaptura de las 12 referencias anatomicas VIVAS.
     pAnim.renderNow() ejecuta el Pf() real con la pose que le indiquemos;
     al terminar, gripCheck().manoNativa apunta al handDom de ESA pose
     (ut._hnNative = handFrame.anat.handDom). Se hace una sola vez, durante
     el arranque, restaurando upperPose/forcedState al salir: no se fuerza
     ningun estado visible ni se altera la maquina de estados.
     Sin esto, un cambio de pose dejaba un frame con la calibracion de la
     pose anterior (defecto de FASE D.1). */
  function p3CaptureAnatomy() {
    var rig = window.DMO && window.DMO.weaponRig, pa = p3Anim;
    if (!rig || !pa || typeof pa.renderNow !== 'function' ||
        typeof rig.gripCheck !== 'function') return 0;
    var savedPose = pa.upperPose, savedState = pa.state,
        savedForced = pa.forcedState, savedAim = pa.forcedAimAngle;
    var n = 0;
    try {
      P3_POSES.forEach(function (p) {
        try {
          pa.upperPose = p.key;
          pa.renderNow();
          var g = rig.gripCheck();
          if (g && g.ok && Array.isArray(g.manoNativa)) {
            P3_HAND_ARRAYS[p.key] = g.manoNativa; n++;
          }
        } catch (e) { /* pose no dibujable en este contexto: se omite */ }
      });
    } finally {
      pa.upperPose = savedPose;
      pa.state = savedState;
      pa.forcedState = savedForced;
      pa.forcedAimAngle = savedAim;
    }
    return n;
  }

  /* Recalibra ANATOMY_SPINE[pose].handDom SIN tocar el HTML ni el IIFE.
     DMO.weaponRig.gripCheck() devuelve en `manoNativa` la REFERENCIA viva
     al array handDom de la pose (ut._hnNative = handFrame.anat.handDom).
     D.2: la pose ACTIVA se toma de pAnim.upperPose (ya actualizado por
     update() en este mismo tick), NO de g.pose, que es el frame anterior.
     Asi desaparece el frame desfasado en las transiciones rapidas.
     No se cambia aimAngle, ni ut.muzzleWorld, ni estadisticas. */
  function p3CalibrateHand() {
    var rig = window.DMO && window.DMO.weaponRig, pa = p3Anim;
    if (!rig || typeof rig.gripCheck !== 'function' || !pa) return 0;
    var g = null;
    try { g = rig.gripCheck(); } catch (e) { g = null; }
    if (g && g.ok && Array.isArray(g.manoNativa) && g.pose) {
      if (!P3_HAND_ARRAYS[g.pose]) P3_HAND_ARRAYS[g.pose] = g.manoNativa;
    }
    var name = p3Resolve(STATE_SEQUENCE[pa.state] || 'IDLE', pa);
    var active = pa.upperPose || 'player_idle';
    var n = 0;
    Object.keys(P3_HAND_ARRAYS).forEach(function (k) {
      var seq = (k === active) ? name : (P3_POSE_SEQ[k] || name);
      var hd = p3HandDom(seq, k), arr = P3_HAND_ARRAYS[k];
      if (!hd || !arr) return;
      arr[0] = hd[0]; arr[1] = hd[1]; n++;
    });
    return n;
  }

  function p3Select() {
    var pa = p3Anim;
    if (!pa) return;
    var name = p3Resolve(STATE_SEQUENCE[pa.state] || 'IDLE', pa);
    if (name !== p3Current) { p3Draw(name); p3Current = name; }
    p3CalibrateHand();
  }

  /* Enganche minimo sobre el unico objeto publico del protagonista.
     state / stridePhase / walkFrame: pAnim los escribe en cada tick, asi
     que el selector queda sincronizado con el estado del motor.
     waistSplitActive: flag unicamente VISUAL de Pf(); se recalcula en
     cada tick y aqui se fija a false para usar la rama full-body. */
  function p3HookAnim(pa) {
    function notify(prop, forceValue) {
      var v = pa[prop];
      Object.defineProperty(pa, prop, {
        configurable: true, enumerable: true,
        get: function () { return v; },
        set: function (n) {
          v = (forceValue === undefined) ? n : forceValue;
          if (p3Ready) { try { p3Select(); } catch (e) {} }
        }
      });
    }
    notify('state');
    /* D.2: update() escribe upperPose DESPUES de state. Sin este setter,
       el cambio de estado recalibraba con la pose del frame anterior y
       dejaba un frame con el handDom viejo (salto del arma). Escuchando
       upperPose la calibracion ocurre en el mismo tick, sin retardos ni
       suavizados artificiales. */
    notify('upperPose');
    notify('stridePhase');
    notify('walkFrame');
    notify('waistSplitActive', false);
    pa.waistSplitActive = false;
    p3Hooked = true;
  }

  function p3Activate() {
    var reg = window.__HD_ASSETS && window.__HD_ASSETS.images;
    var pa = window.DMO && window.DMO.playerAnim;
    if (!reg || !pa) return false;
    if (!p3Register()) return false;
    p3Anim = pa;
    p3Ready = true;
    p3Draw('IDLE');
    p3Current = 'IDLE';
    if (!p3Hooked) p3HookAnim(pa);
    /* D.2: capturar las 12 referencias vivas ANTES del primer tick evita
       el frame desfasado de D.1 en cualquier transicion. */
    var captured = p3CaptureAnatomy();
    p3Select();
    st.player = {
      version: 'tanda03-faseD.2', ready: true, appliedAt: Date.now(),
      anatomyCaptured: captured,
      assets: P3_ASSETS.length, poses: P3_POSES.length,
      sequenceSlots: Object.keys(P3_SEQUENCES).length,
      loader: 'window.__HD_ASSETS.images[PLAYER_ASSET_MAP] -> ensureHdImg() -> Pf()',
      hook: 'window.DMO.playerAnim: state / upperPose / stridePhase / walkFrame / waistSplitActive'
    };
    return true;
  }

  function p3Boot() {
    var pending = P3_ASSETS.length;
    P3_ASSETS.forEach(function (a, i) {
      var rec = { id: 'P' + (i < 9 ? '0' : '') + (i + 1),
                  file: BASE3 + a.file, expected: [P3_W, P3_H],
                  loaded: false, natural: null, exactSize: false };
      load(rec.file, rec, function (im) {
        if (im) {
          P3_IMAGES[a.name] = im;
          P3_SEQUENCES[a.name] = [a.name];   /* 1 frame; ampliable a N */
        }
        if (--pending === 0) {
          if (!p3Activate()) err('P00', 'no se pudo activar el protagonista');
        }
      });
    });
  }

  var p3Tries = 0;
  (function p3Poll() {
    if (window.__HD_ASSETS && window.__HD_ASSETS.images &&
        window.DMO && window.DMO.playerAnim) { p3Boot(); return; }
    if (++p3Tries > 200) {
      err('P00', 'DMO.playerAnim no disponible tras 10 s');
      return;
    }
    setTimeout(p3Poll, 50);
  })();

  /* QA tecnica breve + A/B sin recargar. No forma parte del render. */
  function player() {
    var pa = p3Anim || (window.DMO && window.DMO.playerAnim);
    var reg = window.__HD_ASSETS && window.__HD_ASSETS.images;
    return {
      version: 'tanda03-faseD.2',
      ready: p3Ready, hooked: p3Hooked,
      engineState: pa ? pa.state : null,
      sequence: STATE_SEQUENCE[pa ? pa.state : 'idle'] || 'IDLE',
      frame: p3Current,
      waistSplitActive: pa ? pa.waistSplitActive : null,
      sequences: Object.keys(P3_SEQUENCES).map(function (k) {
        return { state: k, frames: P3_SEQUENCES[k].slice() };
      }),
      poses: P3_POSES.map(function (p) {
        var cnv = P3_CANVAS[p.key];
        return { key: p.key, expected: [Math.round(p.W), p.H],
                 natural: cnv ? [cnv.width, cnv.height] : null,
                 registered: !!reg && reg[p.key] === cnv,
                 complete: cnv ? cnv.complete : false };
      }),
      originalsPreserved: Object.keys(P3_ORIGINALS).length,
      handCalibration: {
        via: 'DMO.weaponRig.gripCheck().manoNativa -> ANATOMY_SPINE[pose].handDom',
        posesCaptured: Object.keys(P3_HAND_ARRAYS).length,
        sync: 'pAnim.upperPose del tick actual (sin frame desfasado)',
        active: (function () {
          var pa = p3Anim;
          if (!pa) return null;
          var name = p3Resolve(STATE_SEQUENCE[pa.state] || 'IDLE', pa);
          var key = pa.upperPose || 'player_idle';
          var wid = (window.DMO && window.DMO.weaponRig &&
                     window.DMO.weaponRig.info) ?
                     (function () { try { return window.DMO.weaponRig.info().equipped; }
                       catch (e) { return null; } })() : null;
          return { state: pa.state, pose: key, sequence: name,
                   handDom: p3HandDom(name, key),
                   handSup: p3HandSup(name, key),
                   support: wid ? p3SupportAudit(wid) : null };
        })()
      },
      errors: (st.playerErrors || []).slice(),
      note: 'Un frame por estado. aimAngle, facingLeft, armas it(back/front), '
          + 'footGroundY, sombra y orden de profundidad permanecen en Pf().',
      limitations: 'ANATOMY_SPINE[].handSup no tiene ningun consumo en el '
          + 'HTML activo (0 referencias fuera de su declaracion) y no es '
          + 'alcanzable sin modificar el HTML, prohibido en esta fase. La '
          + 'referencia anatomica real que SI controla este pack es '
          + 'hdImages.player_fire2: el render de armas recorta de ella el '
          + 'antebrazo de apoyo en (55,20,29,10) hasta ov.sup; D.2 la '
          + 'rellena con la mano medida en FASE C (282/290 px con alfa) '
          + 'sin segundo registro ni asset nuevo. En este build ese '
          + 'recorte no se ejecuta (0 drawImage de 9 args): la mano de '
          + 'apoyo visible es la procedural de it() desde r.hd.sup. '
          + 'Desviacion medida en DISPARAR (manos juntas) frente al agarre '
          + 'secundario de armas 2M: 14.77-16.90 px; no corregible sin '
          + 'regenerar PNG o tocar arsenal/HTML. pAnim.update() solo emite '
          + 'player_fire / player_firehip: player_fire2 no se activa como '
          + 'upperPose. death/dodge no dibujan arma.'
    };
  }

  function playerRestore() {
    var reg = window.__HD_ASSETS && window.__HD_ASSETS.images;
    if (!reg) return 0;
    var n = 0;
    P3_POSES.forEach(function (p) {
      if (Object.prototype.hasOwnProperty.call(P3_ORIGINALS, p.key)) {
        reg[p.key] = P3_ORIGINALS[p.key]; n++;
      }
    });
    return n;
  }

  function playerApply() {
    var reg = window.__HD_ASSETS && window.__HD_ASSETS.images;
    if (!reg) return 0;
    var n = 0;
    P3_POSES.forEach(function (p) {
      if (P3_CANVAS[p.key]) { reg[p.key] = P3_CANVAS[p.key]; n++; }
    });
    return n;
  }

  window.DMO_ART_PACK = Object.freeze({
    state: state, integrity: integrity, architecture: architecture,
    restore: restore, apply: apply,
    hub: hub, hubManifest: function () { return JSON.parse(JSON.stringify(HUB_ASSETS)); },
    hubRestore: hubRestore, hubApply: hubApply, hubTag: hubTag,
    hub2: hub2, hub2Manifest: function () { return JSON.parse(JSON.stringify(HUB2_ASSETS)); },
    hub2Restore: hub2Restore, hub2Apply: hub2Apply, hub2Tag: hub2Tag,
    hub3: hub3, hub3Manifest: function () { return JSON.parse(JSON.stringify(HUB3_ASSETS)); },
    hub3Restore: hub3Restore, hub3Apply: hub3Apply, hub3Tag: hub3Tag,
    hub5: hub5, hub5Manifest: function () { return JSON.parse(JSON.stringify(HUB5_ASSETS)); },
    hub5Restore: hub5Restore, hub5Apply: hub5Apply, hub5Tag: hub5Tag,
    hub6: hub6, hub6Manifest: function () { return JSON.parse(JSON.stringify(HUB6_ASSETS)); },
    hub6Restore: hub6Restore, hub6Apply: hub6Apply, hub6Tag: hub6Tag,
    hub7: hub7, hub7Manifest: function () { return JSON.parse(JSON.stringify(HUB7_ASSETS)); },
    hub7Restore: hub7Restore, hub7Apply: hub7Apply, hub7Tag: hub7Tag,
    player: player, playerRestore: playerRestore, playerApply: playerApply,
    manifest: function () { return JSON.parse(JSON.stringify(MANIFEST)); },
    architectureManifest: function () { return JSON.parse(JSON.stringify(ARCHITECTURE)); }
  });
})();
