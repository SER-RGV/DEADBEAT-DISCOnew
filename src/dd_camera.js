/* ==========================================================================
   DEADBEAT DISCO — FASE 08 · CÁMARA DINÁMICA (window.DD_CAMERA)

   Sustituye SOLO la matemática de seguimiento del motor (la función inline que
   movía B/L hacia el jugador con N.look) por un seguimiento con zona segura,
   anticipación por puntería y velocidad, zoom adaptativo con histéresis y
   recorte a la sala. No es un segundo sistema de cámara:

     · El estado sigue siendo el del motor: B, L (centro de cámara en px de
       mundo) y N.zoom. El puente (tools/build_active_html.py) llama a step()
       dentro de la misma función del motor y vuelca el resultado en B, L,
       N.zoom y N.look; el dibujo (translate(y/2,x/2)·scale(N.applied)·
       translate(-B,-L)), el ratón (Gu) y DMO.camera() no cambian.
     · DD_CINE sigue sumando sus desplazamientos y zoomMul encima (cinemáticas).
     · El Refugio (DD_HUB) conserva su cámara propia.

   Nada de aquí toca coordenadas físicas, velocidades ni alcances: sólo lee
   posiciones y escribe la cámara. Es cargable en Node para las pruebas de
   tests/world_scale (module.exports).
   ========================================================================== */
(function (root) {
  "use strict";

  const DEFAULTS = {
    enabled: true, refH: 1080, zoomMin: 0.80, zoomMax: 1.12, calm: 1.08, combat: 0.98, crowd: 0.88, bossMin: 0.84,
    nearR: 900, hysteresis: 0.035, zoomTau: 0.9, zoomRate: 0.30, followTau: 0.17, leadTau: 0.28, leadAim: 44,
    leadVel: 0.22, leadMaxFrac: 0.10, deadzoneFrac: 0.035, safeFrac: 0.36,
    roomMargin: { top: 280, bottom: 220, left: 240, right: 240 }, bossBias: 0.22, bossPad: 120, snapDist: 600
  };

  function cfg() {
    const S = root.DD_SCALE;
    const c = S && S.camera ? S.camera : null;
    return Object.assign({}, DEFAULTS, c || {}, { enabled: !!(c && c.enabled) });
  }

  const st = {
    forcedEnabled: null,      // QA: true/false fuerza; null = según el perfil
    leadX: 0, leadY: 0,
    zoomTarget: null,         // objetivo comprometido (con histéresis)
    lastRoomKey: null,
    lastPx: null, lastPy: null,
    snaps: 0, steps: 0,
    mode: "calm", near: 0,
    lastOut: null
  };

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function smoothstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function expK(dt, tau) { return tau > 0 ? 1 - Math.exp(-Math.max(0, dt) / tau) : 1; }

  /* --- transformaciones (la misma fórmula que el motor: render y Gu) --- */
  function worldToScreen(wx, wy, cam) {
    const z = cam.zoom || 1;
    return { x: cam.viewW * 0.5 + (wx - cam.x) * z, y: cam.viewH * 0.5 + (wy - cam.y) * z };
  }
  function screenToWorld(sx, sy, cam) {
    const z = cam.zoom || 1;
    return { x: cam.x + (sx - cam.viewW * 0.5) / z, y: cam.y + (sy - cam.viewH * 0.5) / z };
  }

  /* zoom expresado a refH px de alto → zoom real para esta altura de ventana
     (campo visual vertical constante en px de mundo). */
  function zoomForViewport(z1080, viewH, refH) {
    const r = refH || 1080;
    return z1080 * (Math.max(200, viewH || r) / r);
  }

  /* --- recorte del centro de cámara a unos límites; si el límite es más
         estrecho que la vista en un eje, se centra en ese eje --- */
  function clampCenterToBounds(cx, cy, halfW, halfH, bounds) {
    const bw = bounds.x1 - bounds.x0, bh = bounds.y1 - bounds.y0;
    const x = (2 * halfW >= bw) ? (bounds.x0 + bounds.x1) * 0.5 : clamp(cx, bounds.x0 + halfW, bounds.x1 - halfW);
    const y = (2 * halfH >= bh) ? (bounds.y0 + bounds.y1) * 0.5 : clamp(cy, bounds.y0 + halfH, bounds.y1 - halfH);
    return { x: x, y: y };
  }

  function roomBounds(room, world, margin) {
    const m = margin || DEFAULTS.roomMargin;
    const W = world && world.w > 0 ? world.w : 2500, H = world && world.h > 0 ? world.h : 1850;
    if (!room || !(room.w > 0) || !(room.h > 0)) return { x0: 0, y0: 0, x1: W, y1: H };
    return {
      x0: Math.max(0, room.x - m.left), y0: Math.max(0, room.y - m.top),
      x1: Math.min(W, room.x + room.w + m.right), y1: Math.min(H, room.y + room.h + m.bottom)
    };
  }

  /* --- objetivo de zoom (a refH) según amenaza y jefe --- */
  function computeZoomTarget(c, info) {
    // info: {near, viewW, viewH, px, py, boss:{x,y,h}|null}
    let z;
    if (info.boss) {
      z = c.bossMin;
      // que jugador y jefe quepan a la vez en el 72 % de la pantalla
      const dx = Math.abs(info.boss.x - info.px) + 2 * c.bossPad;
      const dy = Math.abs(info.boss.y - info.py) + (info.boss.h || 240) + c.bossPad;
      const zs = zoomForViewport(1, info.viewH, c.refH); // factor de resolución
      const fitW = 0.72 * info.viewW / Math.max(1, dx) / zs;
      const fitH = 0.72 * info.viewH / Math.max(1, dy) / zs;
      z = Math.min(c.combat, Math.max(c.zoomMin, Math.min(z, fitW, fitH)));
      return { z: z, mode: "boss" };
    }
    const n = info.near | 0;
    if (n <= 0) return { z: c.calm, mode: "calm" };
    const t = smoothstep((n - 1) / 7);                 // 1 enemigo → combat · 8+ → crowd
    z = c.combat + (c.crowd - c.combat) * t;
    return { z: z, mode: n >= 8 ? "crowd" : "combat" };
  }

  function isActive() {
    if (st.forcedEnabled !== null) return st.forcedEnabled;
    return cfg().enabled;
  }

  /* --- paso de cámara. Devuelve {x, y, zoom, leadX, leadY}; no muta `input`. --- */
  function step(dt, input) {
    const c = cfg();
    dt = clamp(Number(dt) || 0, 0, 0.1);
    const viewW = input.viewW || 1920, viewH = input.viewH || 1080;
    const zs = zoomForViewport(1, viewH, c.refH);
    const px = input.px, py = input.py;
    const vx = input.vx || 0, vy = input.vy || 0;
    const room = input.room || null;
    const world = { w: input.worldW || 2500, h: input.worldH || 1850 };

    // amenaza: enemigos a menos de nearR del jugador
    let near = 0;
    const en = input.enemies;
    if (en && en.length) {
      const r2 = c.nearR * c.nearR;
      for (let i = 0; i < en.length; i++) {
        const e = en[i]; if (!e) continue;
        const dx = e.x - px, dy = e.y - py;
        if (dx * dx + dy * dy <= r2) near++;
      }
    }
    const boss = input.boss ? { x: input.boss.x, y: input.boss.y, h: input.boss.h || 240 } : null;

    // --- zoom ---
    const zt = computeZoomTarget(c, { near: near, viewW: viewW, viewH: viewH, px: px, py: py, boss: boss });
    const target1080 = clamp(zt.z, c.zoomMin, c.zoomMax);
    if (st.zoomTarget === null || Math.abs(target1080 - st.zoomTarget) > c.hysteresis || zt.mode !== st.mode) {
      st.zoomTarget = target1080;
    }
    st.mode = zt.mode; st.near = near;
    const zoomGoal = st.zoomTarget * zs;
    const z0 = (input.zoom > 0) ? input.zoom : zoomGoal;
    let zoom = z0;

    // --- detección de salto (cambio de sala / teletransporte / primer paso) ---
    const roomChanged = input.roomKey !== undefined && input.roomKey !== st.lastRoomKey;
    const jumped = st.lastPx !== null && Math.hypot(px - st.lastPx, py - st.lastPy) > c.snapDist;
    const snap = roomChanged || jumped || st.steps === 0 || !(input.camX === input.camX);
    st.lastRoomKey = input.roomKey; st.lastPx = px; st.lastPy = py; st.steps++;

    if (snap) {
      zoom = zoomGoal;
      st.leadX = 0; st.leadY = 0; st.snaps++;
    } else {
      zoom += (zoomGoal - zoom) * expK(dt, c.zoomTau);
      const maxStep = c.zoomRate * zs * dt;
      zoom = clamp(zoom, z0 - maxStep, z0 + maxStep);
    }
    zoom = clamp(zoom, c.zoomMin * zs, c.zoomMax * zs);

    const halfW = viewW * 0.5 / zoom, halfH = viewH * 0.5 / zoom;

    // --- anticipación: puntería (como el motor) + velocidad, con tope ---
    const speed = Math.hypot(vx, vy);
    const aimLead = Math.min(c.leadAim, 14 + 0.16 * speed);
    let lx = Math.cos(input.aim || 0) * aimLead + vx * c.leadVel;
    let ly = Math.sin(input.aim || 0) * aimLead * 0.7 + vy * c.leadVel;
    const leadMax = c.leadMaxFrac * 2 * halfW;
    const lm = Math.hypot(lx, ly);
    if (lm > leadMax) { lx *= leadMax / lm; ly *= leadMax / lm; }
    if (input.dying) { lx = st.leadX; ly = st.leadY; }
    const kl = snap ? 1 : expK(dt, c.leadTau);
    st.leadX += (lx - st.leadX) * kl; st.leadY += (ly - st.leadY) * kl;

    let tx = px + st.leadX, ty = py + st.leadY;
    if (boss) { tx += (boss.x - px) * c.bossBias; ty += (boss.y - py) * c.bossBias; }

    // --- zona muerta + suavizado ---
    let cx = snap ? tx : input.camX, cy = snap ? ty : input.camY;
    if (!snap) {
      const dzX = c.deadzoneFrac * 2 * halfW, dzY = c.deadzoneFrac * 2 * halfH;
      let dx = tx - cx, dy = ty - cy;
      dx = Math.abs(dx) <= dzX ? 0 : dx - Math.sign(dx) * dzX;
      dy = Math.abs(dy) <= dzY ? 0 : dy - Math.sign(dy) * dzY;
      const k = expK(dt, c.followTau);
      cx += dx * k; cy += dy * k;
    }

    // --- zona segura: el jugador nunca se acerca al borde ---
    const sx = c.safeFrac * halfW, sy = c.safeFrac * halfH;
    cx = clamp(cx, px - sx, px + sx);
    cy = clamp(cy, py - sy, py + sy);

    // --- recorte a la sala (con franja de muro) y al mundo ---
    const b = roomBounds(room, world, c.roomMargin);
    const cl = clampCenterToBounds(cx, cy, halfW, halfH, b);
    cx = cl.x; cy = cl.y;
    const wb = { x0: 0, y0: 0, x1: world.w, y1: world.h };
    const cw = clampCenterToBounds(cx, cy, halfW, halfH, wb);
    cx = cw.x; cy = cw.y;

    const out = { x: cx, y: cy, zoom: zoom, leadX: st.leadX, leadY: st.leadY, snap: snap, mode: st.mode, near: near, zoomTarget: zoomGoal };
    st.lastOut = out;
    return out;
  }

  function reset() {
    st.leadX = 0; st.leadY = 0; st.zoomTarget = null; st.lastRoomKey = null; st.lastPx = null; st.lastPy = null;
    st.snaps = 0; st.steps = 0; st.mode = "calm"; st.near = 0; st.lastOut = null;
  }

  const api = {
    isActive: isActive,
    setEnabled: function (v) { st.forcedEnabled = (v === null || v === undefined) ? null : !!v; return isActive(); },
    step: step,
    reset: reset,
    config: cfg,
    worldToScreen: worldToScreen,
    screenToWorld: screenToWorld,
    zoomForViewport: zoomForViewport,
    clampCenterToBounds: clampCenterToBounds,
    roomBounds: roomBounds,
    computeZoomTarget: computeZoomTarget,
    debug: function () {
      return { active: isActive(), mode: st.mode, near: st.near, zoomTarget: st.zoomTarget, lead: { x: +st.leadX.toFixed(1), y: +st.leadY.toFixed(1) },
        snaps: st.snaps, steps: st.steps, last: st.lastOut ? { x: Math.round(st.lastOut.x), y: Math.round(st.lastOut.y), zoom: +st.lastOut.zoom.toFixed(4), snap: st.lastOut.snap } : null };
    }
  };

  root.DD_CAMERA = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
