
  /* === TANDA08:BEGIN · HUB8_* (mismo load(), mismo registro V5) =============
     «El abismo vivo». 10 assets RGBA para los 5 planos del cutaway APROBADO
     en la prueba de composición. Se encadena tras loadHub7(). No hay segundo
     loader, canvas, cámara, audio ni temporizador.
     Reversible: window.__DDM_HUB_T08 = false retira render y animación. */
  var BASEH8 = 'ART_ASSETS/hub/tanda_08/';
  var HUB8_ASSETS = [
    { id: 'T08-01', unit: 'pared_cercana_izq',      file: '01_pared_izq/final/hub_t08_01_pared_izq.png',       w: 900,  h: 300, alias: 'h08_pared_cercana_izq',       plane: 'P1', category: 'P1 · pared próxima izquierda' },
    { id: 'T08-02', unit: 'pared_cercana_der',      file: '02_pared_der/final/hub_t08_02_pared_der.png',       w: 900,  h: 300, alias: 'h08_pared_cercana_der',       plane: 'P1', category: 'P1 · pared próxima derecha' },
    { id: 'T08-03', unit: 'estrato_medio',          file: '03_estrato/final/hub_t08_03_estrato.png',           w: 1600, h: 220, alias: 'h08_estrato_medio',           plane: 'P2', category: 'P2 · estrato geológico' },
    { id: 'T08-04', unit: 'columna_natural',        file: '04_columna/final/hub_t08_04_columna.png',           w: 300,  h: 460, alias: 'h08_columna_natural',         plane: 'P2', category: 'P2 · columna de basalto' },
    { id: 'T08-05', unit: 'plataforma_suspendida',  file: '05_plataforma/final/hub_t08_05_plataforma.png',     w: 700,  h: 260, alias: 'h08_plataforma_suspendida',   plane: 'P3', category: 'P3 · plataforma suspendida' },
    { id: 'T08-06', unit: 'pared_lejana',           file: '06_pared_lejana/final/hub_t08_06_pared_lejana.png', w: 1600, h: 180, alias: 'h08_pared_lejana',            plane: 'P4', category: 'P4 · pared lejana' },
    { id: 'T08-07', unit: 'rocas_suspendidas',      file: '07_rocas/final/hub_t08_07_rocas.png',               w: 900,  h: 260, alias: 'h08_rocas_suspendidas',       plane: 'P3', category: 'P3 · rocas flotantes' },
    { id: 'T08-08', unit: 'cavidades_lejanas',      file: '08_cavidades/final/hub_t08_08_cavidades.png',       w: 1600, h: 160, alias: 'h08_cavidades_lejanas',       plane: 'P4', category: 'P4 · cavidades lejanas' },
    { id: 'T08-09', unit: 'luces_abismo',           file: '09_luces/final/hub_t08_09_luces.png',               w: 1200, h: 200, alias: 'h08_luces_abismo',            plane: 'P5', category: 'P5 · fuentes de luz infernal' },
    { id: 'T08-10', unit: 'humo_infernal',          file: '10_humo/final/hub_t08_10_humo.png',                 w: 360,  h: 640, alias: 'h08_humo_infernal',           plane: 'A', category: 'Ambiente · humo infernal' }
  ];
  var HUB8_IMAGES = {};
  var HUB8_ORIGINALS = {};
  var hub8Applied = false;

  function hub8Err(where, e) {
    var msg = where + ': ' + (e && (e.message || e.type) || String(e));
    if (!st.hub8Errors) st.hub8Errors = [];
    st.hub8Errors.push(msg);
    try { console.warn('[ART_PACK/HUB8] ' + msg); } catch (_) {}
  }
  function hub8Invalidate() {
    try {
      if (window.DMO_INFERNAL_ART && typeof window.DMO_INFERNAL_ART.invalidate === 'function') {
        window.DMO_INFERNAL_ART.invalidate();
      }
    } catch (e) { hub8Err('invalidate', e); }
    try {
      if (window.__T3B && typeof window.__T3B.setEnabled === 'function') window.__T3B.setEnabled(true);
    } catch (e) { hub8Err('setEnabled', e); }
  }
  function applyHub8() {
    var reg = window.__DDM_V5_IMG;
    if (!reg) { hub8Err('HUB8', '__DDM_V5_IMG no disponible'); return 0; }
    var n = 0;
    HUB8_ASSETS.forEach(function (a) {
      var im = HUB8_IMAGES[a.id];
      if (!im) return;
      try { im.__hubTanda08 = a.id; } catch (_) {}
      if (!Object.prototype.hasOwnProperty.call(HUB8_ORIGINALS, a.alias)) HUB8_ORIGINALS[a.alias] = reg[a.alias];
      reg[a.alias] = im; n++;
    });
    hub8Applied = (n === HUB8_ASSETS.length);
    hub8Invalidate();
    st.hub8 = {
      version: 'hub-tanda08', count: HUB8_ASSETS.length,
      productionUnits: HUB8_ASSETS.length, files: HUB8_ASSETS.length,
      registered: n, enabled: hub8Applied,
      loader: 'load() -> __DDM_V5_IMG[alias h08_*]',
      renderer: 'DEADBEAT_DISCO.ART.html :: hooks zf/Tf (T08)',
      flag: 'window.__DDM_HUB_T08 !== false',
      note: '10/10 assets T08 en el MISMO registro V5 y MISMO load(). '
          + 'Cutaway en espacio de pantalla, sin cámara/canvas/audio nuevos.',
      appliedAt: Date.now()
    };
    return n;
  }
  function restoreHub8() {
    var reg = window.__DDM_V5_IMG, n = 0;
    if (reg) {
      HUB8_ASSETS.forEach(function (a) {
        if (!Object.prototype.hasOwnProperty.call(HUB8_ORIGINALS, a.alias)) return;
        reg[a.alias] = HUB8_ORIGINALS[a.alias];
        if (reg[a.alias] === undefined) delete reg[a.alias];
        n++;
      });
    }
    hub8Applied = false;
    if (st.hub8) { st.hub8.enabled = false; st.hub8.registered = 0; }
    hub8Invalidate();
    return n;
  }
  function loadHub8(done) {
    var pending = HUB8_ASSETS.length;
    HUB8_ASSETS.forEach(function (a) {
      var rec = { id: a.id, file: BASEH8 + a.file, expected: [a.w, a.h],
                  loaded: false, natural: null, exactSize: false };
      load(rec.file, rec, function (im) {
        if (im) {
          HUB8_IMAGES[a.id] = im;
          if (!rec.exactSize) hub8Err(a.id, 'dimensiones inesperadas ' + rec.natural);
        } else hub8Err(a.id, 'no se pudo decodificar ' + rec.file);
        if (--pending === 0) done(applyHub8());
      });
    });
  }
  function hub8() {
    var reg = window.__DDM_V5_IMG || {}, get = window.__DDM_GET_V5;
    var list = HUB8_ASSETS.map(function (a) {
      var im = HUB8_IMAGES[a.id] || null;
      var resolves = 0;
      try { if (typeof get === 'function' && get(a.alias) === im) resolves = 1; } catch (_) {}
      return {
        id: a.id, unit: a.unit, file: BASEH8 + a.file, alias: a.alias, plane: a.plane,
        category: a.category, aliasLive: !!(im && reg[a.alias] === im), loaderResolves: resolves,
        expected: [a.w, a.h], natural: im ? [im.naturalWidth, im.naturalHeight] : null,
        exactSize: !!im && im.naturalWidth === a.w && im.naturalHeight === a.h,
        loaded: !!im, registered: !!(im && reg[a.alias] === im)
      };
    });
    return {
      version: 'hub-tanda08', count: HUB8_ASSETS.length,
      productionUnits: HUB8_ASSETS.length, enabled: hub8Applied,
      registered: list.filter(function (a) { return a.registered; }).length,
      loaded: list.filter(function (a) { return a.loaded; }).length,
      exactSize: list.filter(function (a) { return a.exactSize; }).length,
      errors: (st.hub8Errors || []).slice(), assets: list,
      note: '10/10 PNG de TANDA 08 en el MISMO registro V5 y MISMO load().'
    };
  }
  function hub8Tag() {
    HUB8_ASSETS.forEach(function (a) {
      var im = HUB8_IMAGES[a.id];
      if (im) { try { im.__hubTanda08 = a.id; } catch (_) {} }
    });
    return HUB8_ASSETS.length;
  }
  function hub8Restore() { return restoreHub8(); }
  function hub8Apply() { return hub8Applied ? HUB8_ASSETS.length : applyHub8(); }
  /* === TANDA08:END · HUB8_* ================================================ */
