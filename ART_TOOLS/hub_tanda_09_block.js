/* === TANDA09:BEGIN · MÓDULO «EL HUB COMO LUGAR HABITADO» ======================
   Fase 2 · rutinas / Fase 3 · integración por zona / Fase 4 · acontecimientos.

   NO es un sistema de NPC paralelo:
     * mismos 10 props (4 ambientDancers T01 + 6 actores T07), mismos ids;
     * mismo registro addHubCustomProp -> Lc -> Y-sort, mismos sprites V5;
     * UN único acumulador dt desde UN hook Tf encadenado tras T08;
     * sin props nuevos, sin intervalos, sin rAF, sin canvas, sin colisiones,
       sin cámara, sin audio, sin Director, sin progresión, sin diálogos.

   Se envuelve prop.hubDraw guardando el original. Con
   window.__DDM_HUB_T09 === false (o movimiento reducido, o fuera del HUB)
   el wrapper DELEGA ÍNTEGRAMENTE en el pintor original de T01–T08:
   ni rutinas, ni acontecimientos, ni cambios de actividad.

   Continuidad: stepIdx usa SIEMPRE el mismo reloj artístico zz(); la pausa
   congela el frame con holdOffset (sin reiniciar phase) y lo recupera con
   suavizado. Orientación, intensidad y desplazamiento se interpolan.
   ========================================================================== */
const T09 = (function () {
  const VER = '4.0.0-tanda09';
  const ASSETS = [
    { slot: 't09_rest_seated', file: 'ART_ASSETS/hub/tanda_09/01_descanso/final/hub_t09_01_descanso.png' },
    { slot: 't09_observe',     file: 'ART_ASSETS/hub/tanda_09/02_observador/final/hub_t09_02_observador.png' },
    { slot: 't09_greeting',    file: 'ART_ASSETS/hub/tanda_09/03_gesto/final/hub_t09_03_gesto.png' },
    { slot: 't09_wait',        file: 'ART_ASSETS/hub/tanda_09/04_espera/final/hub_t09_04_espera.png' }
  ];
  const S = {
    version: VER, enabled: true, clock: 0, updates: 0, draws: 0, delegated: 0,
    wrapped: 0, installed: false, hooksInstalled: false, assetsRequested: false,
    records: [], assets: {}, errors: [], event: null, eventGap: 25,
    eventIndex: 0, eventsFired: 0, eventsCompleted: 0, lastError: '',
    counts: { pauses: 0, shifts: 0, observes: 0, greetings: 0, resumes: 0 }
  };

  /* --- definiciones: MISMOS 10 props de T01/T07 (narr_cliente000 excluido) --- */
  /* durAct/durPause en s · iMin/iMax intensidad · shift en u · react peso 0..1 */
  const DEFS = [
    { id:'hub_ambient_dancer_nw',  kind:'amb', zone:'A',   act:'dance', x:1030, y:785,  h:96,  dh:100, phase:0.0, rate:1.00, flip:false, col:'#ec4899', index:0,
      durAct:7.5, durPause:1.4, iMin:.70, iMax:1.10, shift:0,  react:0,    pauseAct:'PAUSE',   pose:null,             events:['group_start'] },
    { id:'hub_ambient_dancer_ne',  kind:'amb', zone:'A',   act:'dance', x:1470, y:785,  h:96,  dh:100, phase:1.7, rate:1.00, flip:true,  col:'#22d3ee', index:1,
      durAct:9.2, durPause:2.1, iMin:.60, iMax:1.15, shift:0,  react:0,    pauseAct:'PAUSE',   pose:null,             events:['two_positions'] },
    { id:'hub_ambient_dancer_sw',  kind:'amb', zone:'A/F', act:'dance', x:1015, y:1085, h:96,  dh:100, phase:3.1, rate:1.00, flip:false, col:'#a855f7', index:2,
      durAct:6.8, durPause:1.8, iMin:.55, iMax:.95,  shift:0,  react:0,    pauseAct:'OBSERVE', pose:'t09_observe',    events:['arcade_watch'] },
    { id:'hub_ambient_clubber_bar',kind:'amb', zone:'E',   act:'dance', x:1965, y:918,  h:96,  dh:98,  phase:2.4, rate:1.00, flip:true,  col:'#f472b6', index:3,
      durAct:8.4, durPause:2.6, iMin:.45, iMax:.90,  shift:0,  react:0,    pauseAct:'WAIT',    pose:'t09_wait',       events:['bar_shift'] },
    { id:'t07_danza_01',           kind:'t07', zone:'A',   act:'dance', x:1120, y:900,  h:96,  dh:0,   phase:0.35,rate:1.00, flip:false, col:'#ec4899', index:-1,
      durAct:5.6, durPause:1.2, iMin:.75, iMax:1.20, shift:18, react:.90,  pauseAct:'PAUSE',   pose:null,             events:['group_start'] },
    { id:'t07_danza_02',           kind:'t07', zone:'A',   act:'dance', x:1380, y:900,  h:96,  dh:0,   phase:2.15,rate:0.86, flip:true,  col:'#22d3ee', index:-1,
      durAct:7.1, durPause:1.7, iMin:.70, iMax:1.10, shift:18, react:.55,  pauseAct:'PAUSE',   pose:null,             events:['two_positions'] },
    { id:'t07_charla_01',          kind:'t07', zone:'E',   act:'talk',  x:1690, y:1010, h:92,  dh:0,   phase:0.80,rate:0.55, flip:false, col:'#f472b6', index:-1,
      durAct:6.2, durPause:2.2, iMin:.40, iMax:.75,  shift:0,  react:.45,  pauseAct:'PAUSE',   pose:null,             events:['conversation_ends'] },
    { id:'t07_charla_02',          kind:'t07', zone:'E',   act:'talk',  x:1780, y:1010, h:92,  dh:0,   phase:2.60,rate:0.48, flip:true,  col:'#67e8f9', index:-1,
      durAct:8.0, durPause:1.9, iMin:.35, iMax:.70,  shift:0,  react:.25,  pauseAct:'PAUSE',   pose:null,             events:['conversation_ends'] },
    { id:'t07_descanso',           kind:'t07', zone:'E',   act:'rest',  x:1910, y:900,  h:88,  dh:0,   phase:1.40,rate:0.30, flip:false, col:'#a855f7', index:-1,
      durAct:11.0,durPause:3.0, iMin:.25, iMax:.45,  shift:0,  react:0,    pauseAct:'POSTURE', pose:'t09_rest_seated',events:['posture_change'], basePose:'t09_rest_seated' },
    { id:'t07_recorrido',          kind:'t07', zone:'D/A', act:'walk',  x:900,  y:700,  h:94,  dh:0,   phase:3.30,rate:0.72, flip:false, col:'#fde047', index:-1,
      durAct:9.5, durPause:2.4, iMin:.55, iMax:.95,  shift:25, react:.35,  pauseAct:'OBSERVE', pose:'t09_observe',    events:['cliff_watch'], span:62 }
  ];

  /* --- acontecimientos: uno simultáneo, raros, breves, reversibles ---------- */
  const EVENTS = [
    { id:'conversation_ends', dur:4.0, npcs:['t07_charla_01','t07_charla_02'],
      ov:{ 't07_charla_01':{ i:.12, face:0, pose:null }, 't07_charla_02':{ i:.45, face:1, pose:'t09_greeting' } } },
    { id:'group_start', dur:4.5, npcs:['hub_ambient_dancer_nw','t07_danza_01'],
      ov:{ 'hub_ambient_dancer_nw':{ i:1.20, face:0, pose:null }, 't07_danza_01':{ i:1.20, face:1, pose:null } } },
    { id:'arcade_watch', dur:5.0, npcs:['hub_ambient_dancer_sw'],
      ov:{ 'hub_ambient_dancer_sw':{ i:.06, face:1, pose:'t09_observe' } } },
    { id:'bar_shift', dur:3.5, npcs:['hub_ambient_clubber_bar'],
      ov:{ 'hub_ambient_clubber_bar':{ i:.08, face:0, pose:'t09_wait' } } },
    { id:'two_positions', dur:5.5, npcs:['hub_ambient_dancer_ne','t07_danza_02'],
      ov:{ 'hub_ambient_dancer_ne':{ i:.85, face:0, pose:null, dx:-14 }, 't07_danza_02':{ i:.85, face:1, pose:null, dx:14 } } },
    { id:'cliff_watch', dur:4.5, npcs:['t07_recorrido'],
      ov:{ 't07_recorrido':{ i:.05, face:0, pose:'t09_observe' } } },
    { id:'posture_change', dur:3.0, npcs:['t07_descanso'],
      ov:{ 't07_descanso':{ i:.45, face:0, pose:'hub_bartender_npc' } } }
  ];

  function note(tag, e) {
    try {
      const m = tag + ': ' + String(e && (e.message || e) || e);
      S.errors.push(m); if (S.errors.length > 24) S.errors.shift();
      S.lastError = m;
    } catch (_) {}
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  /* variación DETERMINISTA: sin Math.random */
  function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function hs() { try { return window.DMO_HUB && window.DMO_HUB.state ? window.DMO_HUB.state() : null; } catch (e) { return null; } }
  function cineOn() { try { return !!(window.DMO_CINE && window.DMO_CINE.state && window.DMO_CINE.state().active); } catch (e) { return false; } }
  function reduced() { try { return !!Yc.reduced; } catch (e) { return false; } }
  function zz() { try { return (hub.ambientFrozenAt != null) ? hub.ambientFrozenAt : Z; } catch (e) { return Z; } }
  function t07clock() { try { return window.__DDM_T07.S.clock; } catch (e) { return S.clock; } }
  function v5(k) {
    try { const im = window.__DDM_V5_IMG && window.__DDM_V5_IMG[k];
          return (im && im.complete && im.naturalWidth > 0) ? im : null; } catch (e) { return null; }
  }
  function on() { return S.enabled && window.__DDM_HUB_T09 !== false && !reduced(); }
  function onFor(kind) { return on() && (kind !== 't07' || window.__DDM_HUB_T07 !== false); }
  function worldLive() {
    const q = hs();
    if (!q || !q.inHub) return false;
    if (q.location !== 'HUB' && q.location !== 'TRANSITION') return false;
    if (q.mode && q.mode !== 'EXPLORATION') return false;
    if (q.modalOpen) return false;
    if (q.transitionLock) return false;
    if (cineOn()) return false;
    try { if (floorDropAnim && floorDropAnim.active) return false; } catch (e) {}
    try { if (window.__DDM_T07.S.arrival.active) return false; } catch (e) {}
    return true;
  }
  function props() {
    /* IMPORTANTE: window.DMO_LAYOUT.propObjects() está envuelto en oA()/tA()
       y devuelve un CLON PROFUNDO. Para enganchar el pintor hay que usar el
       array REAL `tc` (el mismo que recorre el renderer Lc y que usa
       addHubCustomProp). Sólo lectura: no se añaden ni eliminan props. */
    try { if (typeof tc !== 'undefined' && Array.isArray(tc)) return tc; } catch (e) {}
    try {
      const f = window.DMO_LAYOUT && window.DMO_LAYOUT.propObjects;
      if (typeof f === 'function') { const a = f(); if (Array.isArray(a)) return a; }
    } catch (e) {}
    return [];
  }

  /* --- recursos: carga PEREZOSA (con flag=false en arranque no se pide nada) */
  function ensureAssets() {
    if (!on() || S.assetsRequested) return;
    S.assetsRequested = true;
    for (let i = 0; i < ASSETS.length; i++) {
      (function (a) {
        try {
          const im = new Image(); im.decoding = 'async';
          im.onload = function () {
            S.assets[a.slot] = im;
            try { if (window.__DDM_V5_IMG) window.__DDM_V5_IMG[a.slot] = im; } catch (e) {}
          };
          im.onerror = function () { note('asset', a.file); };
          im.src = a.file;
        } catch (e) { note('asset', e); }
      })(ASSETS[i]);
    }
  }
  function sprite(k) {
    if (!k) return null;
    const t = S.assets[k]; if (t && t.complete && t.naturalWidth > 0) return t;
    return v5(k);   /* fallback a los sprites V5 originales */
  }

  /* --- registros ---------------------------------------------------------- */
  function makeRecords() {
    S.records.length = 0;
    for (let i = 0; i < DEFS.length; i++) {
      const d = DEFS[i], seed = hash(i + 1.7);
      S.records.push({
        def: d, id: d.id, seed: seed, prop: null, orig: null,
        state: 'ACTIVE', tLeft: d.durAct * (0.72 + 0.5 * seed),
        cycles: 0, changes: 0,
        intensity: 1, tIntensity: 1,
        faceMix: d.flip ? 1 : 0, tFaceMix: d.flip ? 1 : 0,
        baseFace: d.flip ? 1 : 0,
        dx: 0, dy: 0, tdx: 0, tdy: 0,
        holdOffset: 0, tHold: 0, holdClock: 0, tClockHold: 0,
        freezeT: null, freezeC: null,
        pose: d.basePose || null, eventId: null,
        lastSprite: '', lastFrame: -1, lastX: d.x, lastReact: 0,
        lastIntensity: 1, lastState: 'ACTIVE'
      });
    }
  }

  /* --- máquina de estados (UN dt compartido) ------------------------------- */
  function enterState(r, state) {
    const d = r.def, n = r.cycles + r.seed * 10;
    r.state = state; r.changes++; r.lastState = state;
    if (state === 'ACTIVE') {
      r.tLeft = d.durAct * (0.72 + 0.56 * hash(n + 1));
      r.tIntensity = d.iMin + (d.iMax - d.iMin) * hash(n + 2);
      r.freezeT = null; r.freezeC = null;
      r.pose = d.basePose || null;
      r.tdx = 0; r.tdy = 0;
      /* alternancia compatible de orientación, nunca brusca */
      r.tFaceMix = (hash(n + 3) > 0.72) ? (d.flip ? 0 : 1) : (d.flip ? 1 : 0);
      r.baseFace = r.tFaceMix;
      /* los 3 actores con desplazamiento corto entran a veces en SHIFT */
      if (d.shift > 0 && hash(n + 4) > 0.62) {
        r.state = 'SHIFT'; r.lastState = 'SHIFT'; S.counts.shifts++;
        r.tLeft = 2.0 + 1.4 * hash(n + 5);
        r.tdx = (hash(n + 6) > 0.5 ? 1 : -1) * d.shift * (0.55 + 0.35 * hash(n + 7));
        r.tdy = (hash(n + 8) > 0.5 ? 1 : -1) * Math.min(8, d.shift * 0.35);
      }
    } else if (state === 'PAUSE' || state === 'WAIT' || state === 'OBSERVE' || state === 'POSTURE') {
      r.tLeft = d.durPause * (0.75 + 0.5 * hash(n + 9));
      r.tIntensity = (state === 'POSTURE') ? 0.55 : (state === 'OBSERVE' ? 0.05 : 0.12);
      r.freezeT = zz(); r.freezeC = t07clock();
      r.pose = d.pose;
      r.tdx = 0; r.tdy = 0;
      if (state === 'OBSERVE') { r.tFaceMix = d.flip ? 0 : 1; S.counts.observes++; }
      if (state === 'WAIT') r.tFaceMix = d.flip ? 0 : 1;
      r.baseFace = r.tFaceMix;
      S.counts.pauses++;
    } else if (state === 'RESUME') {
      r.tLeft = 0.55; r.tIntensity = d.iMin + (d.iMax - d.iMin) * 0.5;
      r.freezeT = null; r.freezeC = null; r.pose = d.basePose || null;
      r.tdx = 0; r.tdy = 0; S.counts.resumes++;
    }
  }

  function update(dt) {
    S.updates++;
    const raw = Number(dt) || 0.016;
    const step = clamp(raw, 0, 0.1);
    S.clock += step;
    /* Se reengancha sobre los props vivos antes de cualquier otra cosa. */
    if (on()) { try { wrapProps(); } catch (e) { note('wrap', e); } }
    if (!on() || !worldLive()) return;
    ensureAssets();
    const z = zz(), c = t07clock();
    const k = Math.min(1, step / 0.45);
    const kFace = Math.min(1, step / 0.22);
    const kHold = Math.min(1, step / 1.2);   /* recuperación lenta: sin saltos de frame */

    /* --- acontecimientos (uno a la vez, separación >= 25 s) ---------------- */
    if (S.event) {
      S.event.tLeft -= step;
      if (S.event.tLeft <= 0) { S.event = null; S.eventsCompleted++; S.eventGap = 25 + 4 * (S.eventIndex % 3); }
    } else {
      S.eventGap -= step;
      if (S.eventGap <= 0) {
        const ev = EVENTS[S.eventIndex % EVENTS.length];
        S.eventIndex++; S.eventsFired++;
        S.event = { id: ev.id, tLeft: ev.dur, dur: ev.dur, npcs: ev.npcs, ov: ev.ov };
      }
    }

    for (let i = 0; i < S.records.length; i++) {
      const r = S.records[i];
      /* transiciones suaves (sin reinicios ni saltos) */
      r.intensity += (r.tIntensity - r.intensity) * k;
      r.faceMix += (r.tFaceMix - r.faceMix) * kFace;
      r.dx += (r.tdx - r.dx) * k;
      r.dy += (r.tdy - r.dy) * k;
      r.tHold = (r.freezeT != null) ? Math.max(0, z - r.freezeT) : 0;
      r.tClockHold = (r.freezeC != null) ? Math.max(0, c - r.freezeC) : 0;
      /* Congelación EXACTA durante la pausa; al reanudar, el desfase decae
         lentamente (tEff recupera el reloj real SIN reiniciar phase y SIN
         saltar frames). Es una aceleración suave, no un corte. */
      if (r.freezeT != null) { r.holdOffset = r.tHold; r.holdClock = r.tClockHold; }
      else {
        r.holdOffset += (0 - r.holdOffset) * kHold;
        r.holdClock += (0 - r.holdClock) * kHold;
      }

      const ev = (S.event && S.event.npcs.indexOf(r.id) >= 0) ? S.event.ov[r.id] : null;
      if (ev) {
        if (r.eventId !== S.event.id) { r.eventId = S.event.id; }
        r.tIntensity = ev.i;
        r.tFaceMix = ev.face;
        r.pose = ev.pose;
        r.tdx = ev.dx || 0; r.tdy = 0;
        r.freezeT = (ev.i < 0.15) ? (r.freezeT != null ? r.freezeT : z) : null;
        r.freezeC = (ev.i < 0.15) ? (r.freezeC != null ? r.freezeC : c) : null;
      } else if (r.eventId) {
        r.eventId = null;
        enterState(r, 'RESUME');
      } else {
        r.tLeft -= step;
        if (r.tLeft <= 0) {
          if (r.state === 'ACTIVE' || r.state === 'SHIFT' || r.state === 'RESUME') {
            enterState(r, r.def.pauseAct);
          } else {
            r.cycles++;
            enterState(r, 'ACTIVE');
          }
        }
      }
      /* --- orientación guiada (UNA sola transición suave por cambio) --------
         Prioridad: reacción conservada de T07 > dirección del recorrido >
         orientación base del estado. Nunca se deja un valor intermedio
         sostenido: faceMix siempre converge a 0 o 1. */
      if (!ev) {
        let guided = -1;
        if (r.def.react > 0 && r.def.act !== 'rest') {
          const qx = (typeof ye !== 'undefined' && ye) ? ye.x : 1250;
          const qy = (typeof ye !== 'undefined' && ye) ? ye.y : 965;
          const ex = qx - (r.def.x + r.dx), ey = qy - (r.def.y + r.dy);
          const dist = Math.sqrt(ex * ex + ey * ey);
          const w = clamp((185 - dist) / 85, 0, 1) * r.def.react;
          if (w > 0.30) guided = ex < 0 ? 1 : 0;
          /* Dejar libre el paso: sin offset cuando el jugador está encima. */
          if (dist < 70) { r.tdx = 0; r.tdy = 0; }
        }
        if (guided < 0 && r.def.act === 'walk') {
          const ph = c * 1.35 * r.def.rate + r.def.phase;
          guided = Math.cos(ph) < 0 ? 1 : 0;
        }
        r.tFaceMix = guided >= 0 ? guided : r.baseFace;
      }
      r.lastIntensity = r.intensity;
    }
  }

  /* --- pintor: réplica del render existente + estados ---------------------- */
  function glow(ctx, x, y, radius, color) {
    try { if (typeof Wb === 'function') { Wb(ctx, x, y, radius, color, 0.16); return; } } catch (e) {}
    try {
      const gr = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gr.addColorStop(0, 'rgba(236,72,153,0.16)'); gr.addColorStop(1, 'rgba(236,72,153,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    } catch (e) {}
  }
  function baseV5(r, frame) {
    const d = r.def;
    if (d.act === 'rest') return v5('hub_bartender_npc') || v5('hub_cliente000_npc') || v5('hub_clubber_dancer_a');
    if (d.act === 'talk') return (d.flip ? v5('hub_clubber_dancer_b') : v5('hub_bouncer_npc')) || v5('hub_clubber_dancer_a');
    if (d.kind === 'amb') return v5((d.index % 2 === 0) ? 'hub_clubber_dancer_a' : 'hub_clubber_dancer_b');
    return (frame & 1) ? (v5('hub_clubber_dancer_b') || v5('hub_clubber_dancer_a'))
                       : (v5('hub_clubber_dancer_a') || v5('hub_clubber_dancer_b'));
  }
  function draw(ctx, r) {
    const d = r.def;
    const tEff = zz() - r.holdOffset;
    const cEff = t07clock() - r.holdClock;
    const I = clamp(r.intensity, 0, 1.3);
    const px = (typeof ye !== 'undefined' && ye) ? ye.x : 1250;
    const py = (typeof ye !== 'undefined' && ye) ? ye.y : 965;
    let x = d.x + r.dx, y = d.y + r.dy;
    let lean = 0, bounce = 0, frame = 0, alpha = d.act === 'rest' ? 0.86 : 0.98;
    let faceMix = r.faceMix;

    if (reduced()) { /* nunca debería llegar aquí: on() ya delega */ }
    if (d.act === 'dance') {
      frame = Math.floor(tEff * 5.6 * d.rate + d.phase) & 3;
      bounce = Math.round(Math.abs(Math.sin(tEff * 6.8 * d.rate + d.phase)) * (d.kind === 'amb' ? 2.5 : 3.2) * I);
      lean = Math.sin(tEff * 3.3 * d.rate + d.phase) * 0.065 * I;
      x += Math.sin(tEff * 1.1 * d.rate + d.phase) * 3.0 * I;
    } else if (d.act === 'talk') {
      lean = Math.sin(tEff * 1.5 * d.rate + d.phase) * 0.035 * I;
      bounce = Math.round(Math.sin(tEff * 2.2 * d.rate + d.phase) * 1.2 * I);
    } else if (d.act === 'rest') {
      lean = (0.085 + Math.sin(tEff * 0.55 * d.rate + d.phase) * 0.012) * I;
      bounce = Math.round(Math.sin(tEff * 1.1 * d.rate + d.phase) * 0.9 * I);
    } else if (d.act === 'walk') {
      const ph = cEff * 1.35 * d.rate + d.phase;
      x += Math.sin(ph) * (d.span || 62) * (0.35 + 0.65 * I);
      frame = Math.floor(tEff * 5.2 * d.rate + d.phase) & 3;
      bounce = Math.round(Math.abs(Math.sin(tEff * 6.2 * d.rate + d.phase)) * 2.2 * I);
    }

    /* Reacciones CONSERVADAS de T07, con peso individual. rest excluido. */
    let react = 0, pose = r.pose;
    if (d.react > 0 && d.act !== 'rest') {
      const dx = px - x, dy = py - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      react = clamp((185 - dist) / 85, 0, 1) * d.react;
      if (react > 0.02) {
        lean += react * 0.05 * (0.6 + 0.4 * Math.sin(tEff * 3.1 + d.phase));
        bounce += Math.round(react * 1.5);
        if (react > 0.70 && d.act === 'talk') { pose = 't09_greeting'; S.counts.greetings++; }
      }
    }
    let im = sprite(pose) || baseV5(r, frame);
    r.lastSprite = pose || (d.kind === 'amb' ? ((d.index % 2 === 0) ? 'hub_clubber_dancer_a' : 'hub_clubber_dancer_b') : 'v5-frame-' + frame);
    r.lastFrame = frame; r.lastX = Math.round(x); r.lastReact = +react.toFixed(3);

    ctx.save();
    ctx.imageSmoothingEnabled = d.kind === 't07';
    ctx.fillStyle = 'rgba(2,6,23,0.42)';
    ctx.beginPath(); ctx.ellipse(x, y, d.kind === 'amb' ? 16 : 15, d.kind === 'amb' ? 6.5 : 6, 0, 0, Math.PI * 2); ctx.fill();
    if (d.kind === 'amb') glow(ctx, x, y - 24, 44, (d.index % 2 === 0) ? '#ec4899' : '#22d3ee');
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x), Math.round(y + (d.kind === 'amb' ? 4 : 3) - bounce));
    ctx.rotate(lean);
    const sx = 1 - 2 * clamp(faceMix, 0, 1);
    if (Math.abs(sx) > 0.02) ctx.scale(sx, 1); else ctx.scale(0.02, 1);
    const hh = d.kind === 'amb' ? 96 : d.h;
    const ww = Math.round(hh * (im ? im.naturalWidth / im.naturalHeight : 0.47));
    if (im) ctx.drawImage(im, Math.round(-ww * 0.5), -hh, ww, hh);
    else { ctx.fillStyle = '#f43f5e'; ctx.fillRect(-14, -hh, 28, hh); }
    ctx.restore();

    /* puntos de conversación (sin texto, como T07) */
    if (d.act === 'talk' && !reduced() && I > 0.3) {
      const s = Math.floor(tEff * 2.4 * d.rate + d.phase) % 3;
      ctx.save(); ctx.globalAlpha = 0.65 * I; ctx.fillStyle = d.col;
      for (let q = 0; q < 3; q++) {
        ctx.beginPath();
        ctx.arc(x + (q - 1) * 7, y - hh - 12 - (s === q ? 3 : 0), 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    S.draws++;
  }

  /* --- instalación: envuelve los MISMOS props, guarda el original ---------- */
  function wrapProps() {
    /* ENGANCHE PEREZOSO: buildHubSpace() puede RECREAR el array de props
       después de T09.install(), así que se reengancha cada ciclo sobre los
       objetos VIVOS que el renderer Lc va a usar. Sin props nuevos. */
    const list = props(); let n = 0;
    for (let i = 0; i < DEFS.length; i++) {
      const r = S.records[i];
      let found = null;
      for (let j = 0; j < list.length; j++) {
        if (list[j] && list[j].id === r.id) { found = list[j]; break; }
      }
      if (!found) continue;
      if (found.__t09Wrapped && r.prop === found) { n++; continue; }
      const orig = found.__t09Wrapped ? found.__t09Orig : found.hubDraw;
      if (typeof orig !== 'function') continue;
      found.__t09Orig = orig;
      found.__t09Wrapped = true;
      r.prop = found; r.orig = orig;
      found.hubDraw = function (ctx, p) {
        if (!onFor(r.def.kind)) { S.delegated++; return orig.call(this, ctx, p); }
        try { draw(ctx, r); } catch (e) { note('draw/' + r.id, e); return orig.call(this, ctx, p); }
      };
      n++;
    }
    S.wrapped = n;
    return n;
  }
  function installHooks() {
    if (S.hooksInstalled) return false;
    S.hooksInstalled = true;
    const prevTf = Tf;
    Tf = function (dt) {
      const out = prevTf.apply(this, arguments);
      try { update(dt); } catch (e) { note('update', e); }
      return out;
    };
    return true;
  }
  function install() {
    if (!S.records.length) makeRecords();
    let n = 0;
    try { n = wrapProps(); } catch (e) { note('wrap', e); }
    try { installHooks(); } catch (e) { note('hooks', e); }
    S.installed = true;
    return n;
  }

  /* --- API de QA (sólo lectura + flag) ------------------------------------ */
  function snapshot() {
    return JSON.parse(JSON.stringify({
      version: VER, enabled: S.enabled,
      flag: window.__DDM_HUB_T09 === false ? 'OFF' : 'ON',
      clock: +S.clock.toFixed(2), updates: S.updates, draws: S.draws,
      delegated: S.delegated, wrapped: S.wrapped, installed: S.installed,
      hooksInstalled: S.hooksInstalled,
      worldLive: worldLive(), reduced: reduced(),
      event: S.event ? { id: S.event.id, tLeft: +S.event.tLeft.toFixed(2), npcs: S.event.npcs } : null,
      eventGap: +S.eventGap.toFixed(2), eventsFired: S.eventsFired,
      eventsCompleted: S.eventsCompleted, eventIndex: S.eventIndex,
      counts: S.counts,
      assets: ASSETS.map(function (a) { return { slot: a.slot, loaded: !!sprite(a.slot) && !!S.assets[a.slot] }; }),
      records: S.records.map(function (r) {
        return { id: r.id, zone: r.def.zone, act: r.def.act, state: r.state,
                 intensity: +r.intensity.toFixed(3), tIntensity: +r.tIntensity.toFixed(3),
                 faceMix: +r.faceMix.toFixed(3), dx: +r.dx.toFixed(2), dy: +r.dy.toFixed(2),
                 holdOffset: +r.holdOffset.toFixed(3), pose: r.pose, eventId: r.eventId,
                 cycles: r.cycles, changes: r.changes, lastFrame: r.lastFrame,
                 lastX: r.lastX, lastReact: r.lastReact, lastSprite: r.lastSprite };
      }),
      errors: S.errors.slice(), lastError: S.lastError,
      noNewProps: true, accumulators: 1, intervalsPerNPC: 0, newCanvases: 0
    }));
  }
  return { VER: VER, S: S, DEFS: DEFS, EVENTS: EVENTS, install: install,
           state: snapshot, wrapProps: wrapProps, draw: draw, update: update };
})();
window.__DDM_T09 = T09;
window.DMO_HUB_T09 = Object.freeze({
  version: T09.VER, state: T09.state, debug: T09.state,
  setEnabled: function (v) { T09.S.enabled = !!v; return T09.S.enabled; },
  events: function () { return T09.EVENTS.map(function (e) { return { id: e.id, dur: e.dur, npcs: e.npcs.slice() }; }); },
  audit: function () {
    const s = T09.state();
    return { ok: s.errors.length === 0 && s.wrapped === 10 && s.hooksInstalled,
             wrapped: s.wrapped, hooksInstalled: s.hooksInstalled,
             assetsLoaded: s.assets.filter(function (a) { return a.loaded; }).length,
             npcs: s.records.length, activities: s.records.reduce(function (m, r) {
               m[r.act] = (m[r.act] || 0) + 1; return m; }, {}),
             distinctDurations: new Set(T09.DEFS.map(function (d) { return d.durAct + '/' + d.durPause; })).size,
             events: T09.EVENTS.length, errors: s.errors.slice(),
             updates: s.updates, draws: s.draws, delegated: s.delegated };
  }
});
/* === TANDA09:END (módulo) ================================================== */
