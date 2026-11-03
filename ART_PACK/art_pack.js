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
    player: player, playerRestore: playerRestore, playerApply: playerApply,
    manifest: function () { return JSON.parse(JSON.stringify(MANIFEST)); },
    architectureManifest: function () { return JSON.parse(JSON.stringify(ARCHITECTURE)); }
  });
})();
