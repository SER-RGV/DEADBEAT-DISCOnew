/* ==========================================================================
   DEADBEAT DISCO — APERTURA DEL JUEGO (window.DD_OPENING)

   Dos secuencias a pantalla completa, pintadas en un lienzo propio:

     · playIntro(onDone)    «La noche que vuelve» · 32 s · 7 planos · 120 BPM
     · playDescent(onDone)  descenso al Refugio   ·  7 s

   Por qué un lienzo propio y no DD_CINE: DD_CINE avanza dentro del bucle del
   motor (con el paso limitado a 50 ms), así que en un equipo lento la imagen
   se retrasa respecto al sonido. Aquí el reloj es el de pared y cada sonido se
   programa contra ese mismo reloj. DD_CINE sigue siendo el dueño de las
   secuencias de partida (salas, jefes, derrota, victoria) y no se toca.

   Este módulo no arranca partidas, no entra al Refugio y no decide estados:
   sólo reproduce y avisa al terminar. DD_BOOT y DD_UI deciden qué viene después.
   ========================================================================== */
(function () {
  "use strict";

  var BASE = "assets/cinematics/restart/opening/";
  var MASTER = "assets/cinematics/restart/character_master/";
  var FILES = {
    station: BASE + "mc_01_station.jpg",
    floor: BASE + "op_03_dancefloor.jpg",
    nine: BASE + "mc_03_nine.jpg",
    doors: BASE + "mc_04_doors.jpg",
    vinyl: BASE + "op_01_vinyl.jpg",
    smiles: BASE + "op_04b_smiles.jpg",
    hand: BASE + "op_04a_tempo_hand.jpg",
    boots: BASE + "op_05a_boots.jpg",
    pit: BASE + "mc_07_pit.jpg",
    hat: BASE + "op_hat.png",
    /* El protagonista sólo aparece con arte canónico: la lámina maestra y el IDLE aceptado. */
    master: MASTER + "protagonist_master_crop_hero.png",
    marm: MASTER + "protagonist_master_crop_arm_tattoos.png",
    mface: MASTER + "protagonist_master_crop_face.png",
    hero: "assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png",
    logo: "assets/logos/logo_deadbeat_graffiti.png"
  };

  /* Tabla de planos de la intro: [inicio, fin, nombre]. Es la única fuente de
     tiempos; la pintura, el sonido y las pruebas la leen de aquí. */
  var INTRO_DURATION = 32;
  var TITLE_AT = 29;
  var SHOTS = [
    { id: 1, from: 0, to: 4, name: "el mundo" },
    { id: 2, from: 4, to: 9, name: "la estacion" },
    { id: 3, from: 9, to: 14, name: "las nueve pistas" },
    { id: 4, from: 14, to: 19, name: "algo no funciona" },
    { id: 5, from: 19, to: 24, name: "el protagonista" },
    { id: 6, from: 24, to: 29, name: "el descenso" },
    { id: 7, from: 29, to: 32, name: "el comienzo" }
  ];
  /* NUEVA PARTIDA: el resto de la caída. Más corta que el plano 6 de la intro. */
  var DESCENT_DURATION = 4.6;
  var DESCENT_PHASES = [
    { id: 1, from: 0, to: 3.05, name: "pozo" },
    { id: 2, from: 3.05, to: 4.6, name: "llegada" }
  ];
  var BEAT = 0.5;

  var C = { ink: "#07030d", magenta: "#ff2d7a", cyan: "#22d3ee", yellow: "#facc15", bone: "#f4ecd8", violet: "#7c3aed" };

  var img = {};
  var preloadPromise = null;
  var cv = null, cx = null, hintEl = null, off = null, offCx = null;
  var seq = null;            /* { type, t, duration, onDone, last, raf, fired, title } */
  var reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  /* ------------------------------------------------------------ utilidades */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function rnd(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function settings() {
    var a = null, muted = false, vol = 0.8;
    try { a = JSON.parse(localStorage.getItem("dmodisco_a11y_v1") || "null"); } catch (e) {}
    try { muted = localStorage.getItem("dmodisco_muted_v1") === "1"; } catch (e) {}
    try {
      var s = JSON.parse(localStorage.getItem("ddc_cover_settings_v1") || "null");
      if (s && typeof s.vol === "number") vol = s.vol;
    } catch (e) {}
    return { flash: !(a && a.flash === false), shake: !(a && a.shake === false) && !reduced, muted: muted, vol: vol };
  }

  function preload() {
    if (preloadPromise) return preloadPromise;
    askFonts();
    var keys = Object.keys(FILES);
    preloadPromise = new Promise(function (resolve) {
      var left = keys.length, missing = [];
      keys.forEach(function (k) {
        var im = new Image();
        im.onload = function () { if (--left === 0) resolve({ total: keys.length, missing: missing }); };
        im.onerror = function () { missing.push(k); if (--left === 0) resolve({ total: keys.length, missing: missing }); };
        im.src = FILES[k];
        img[k] = im;
      });
    });
    return preloadPromise;
  }
  /* Rotulación: Barlow Condensed (cartelas) y Bangers (onomatopeyas), declaradas
     en el CSS del build. Se piden antes de pintar para que el primer rótulo no
     salga con la fuente de reserva. */
  var fontsAsked = false, fontsReady = false;
  function askFonts() {
    if (fontsAsked) return; fontsAsked = true;
    try {
      Promise.all([document.fonts.load('italic 700 40px "Barlow Condensed"'), document.fonts.load('400 40px "Bangers"')])
        .then(function (r) { fontsReady = r.every(function (x) { return x && x.length > 0; }); }, function () {});
    } catch (e) {}
  }
  function ok(im) { return !!(im && im.complete && im.naturalWidth > 0); }

  /* ----------------------------------------------------------------- lienzo */
  function ensureCanvas() {
    if (cv) return;
    cv = document.createElement("canvas");
    cv.id = "dd-opening";
    cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    cx = cv.getContext("2d");
    hintEl = document.createElement("div");
    hintEl.id = "dd-opening-hint";
    hintEl.textContent = "SALTAR";
    document.body.appendChild(hintEl);
    off = document.createElement("canvas");
    offCx = off.getContext("2d");
    window.addEventListener("resize", fit);
  }
  var W = 0, H = 0, DPR = 1;
  function fit() {
    if (!cv) return;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(320, window.innerWidth), h = Math.max(200, window.innerHeight);
    /* Tope de píxeles: en 4K el lienzo no supera 2560 de ancho. */
    var k = Math.min(1, 2560 / (w * DPR));
    DPR *= k;
    cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
    W = cv.width; H = cv.height;
  }

  /* Dibuja una imagen cubriendo el lienzo. fx, fy = punto de la imagen (0–1) que
     queda en el centro; zoom ≥ 1. Devuelve el mapeo imagen → pantalla. */
  function cover(im, fx, fy, zoom, alpha, dx, dy) {
    var m = { s: 1, x: 0, y: 0, w: W, h: H };
    if (!ok(im)) { fallback(); return m; }
    var s = Math.max(W / im.naturalWidth, H / im.naturalHeight) * (zoom || 1);
    var w = im.naturalWidth * s, h = im.naturalHeight * s;
    var x = W / 2 - w * fx, y = H / 2 - h * fy;
    x = clamp(x, W - w, 0); y = clamp(y, H - h, 0);
    x += dx || 0; y += dy || 0;
    if (alpha != null && alpha < 1) { cx.save(); cx.globalAlpha = alpha; cx.drawImage(im, x, y, w, h); cx.restore(); }
    else cx.drawImage(im, x, y, w, h);
    m.s = s; m.x = x; m.y = y; m.w = w; m.h = h;
    return m;
  }
  function fallback() {
    var g = cx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1a0626"); g.addColorStop(1, C.ink);
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  }
  /* Imagen vertical centrada con los bordes fundidos sobre una copia oscura de
     sí misma: evita ampliar 2,5× una lámina de 768 px de ancho. */
  function portrait(im, fy, widthFrac, dx, dy) {
    var m = { s: 1, x: 0, y: 0, w: W, h: H };
    cx.fillStyle = C.ink; cx.fillRect(0, 0, W, H);
    if (!ok(im)) { fallback(); return m; }
    cover(im, 0.5, fy, 1, 0.42);
    cx.fillStyle = "rgba(7,3,13,0.62)"; cx.fillRect(0, 0, W, H);
    var w = Math.max(W * widthFrac, H * 0.9 * im.naturalWidth / im.naturalHeight);
    var s = w / im.naturalWidth, h = im.naturalHeight * s;
    var x = (W - w) / 2 + (dx || 0), y = clamp(H / 2 - h * fy, H - h, 0) + (dy || 0);
    if (off.width !== W || off.height !== H) { off.width = W; off.height = H; }
    offCx.globalCompositeOperation = "source-over";
    offCx.clearRect(0, 0, W, H);
    offCx.drawImage(im, x, y, w, h);
    var g = offCx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.16, "#000"); g.addColorStop(0.84, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
    offCx.globalCompositeOperation = "destination-in";
    offCx.fillStyle = g; offCx.fillRect(0, 0, W, H);
    cx.drawImage(off, 0, 0);
    m.s = s; m.x = x; m.y = y; m.w = w; m.h = h;
    return m;
  }
  function tint(color, a) { if (a <= 0) return; cx.save(); cx.globalAlpha = clamp(a, 0, 1); cx.fillStyle = color; cx.fillRect(0, 0, W, H); cx.restore(); }
  function glow(x, y, r, color, a) {
    if (a <= 0 || r <= 0) return;
    cx.save(); cx.globalCompositeOperation = "lighter"; cx.globalAlpha = clamp(a, 0, 1);
    var g = cx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
    cx.fillStyle = g; cx.fillRect(x - r, y - r, r * 2, r * 2); cx.restore();
  }
  function vignette(a) {
    var g = cx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(3,1,8," + a + ")");
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  }
  /* Mancha de pintura: polígono irregular determinista con gotas. */
  function splat(x, y, r, color, seed, a) {
    if (r <= 0) return;
    cx.save(); cx.globalAlpha = a == null ? 1 : a; cx.fillStyle = color;
    cx.beginPath();
    var n = 22;
    for (var i = 0; i <= n; i++) {
      var an = (i / n) * Math.PI * 2;
      var rr = r * (0.62 + 0.55 * rnd(seed + (i % n) * 3.1) * (i % 2 ? 1 : 0.6));
      var px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr * 0.86;
      if (i === 0) cx.moveTo(px, py); else cx.lineTo(px, py);
    }
    cx.closePath(); cx.fill();
    for (var j = 0; j < 9; j++) {
      var a2 = rnd(seed + j * 7.7) * Math.PI * 2, d = r * (1.05 + rnd(seed + j * 1.3) * 0.9);
      cx.beginPath(); cx.arc(x + Math.cos(a2) * d, y + Math.sin(a2) * d * 0.86, r * (0.03 + rnd(seed + j) * 0.07), 0, Math.PI * 2); cx.fill();
    }
    cx.restore();
  }
  function bars() {
    /* Bandas de cine sin texto. Más finas en pantallas más anchas que 16:9. */
    var b = Math.round(H * clamp(0.5 - (W / 2.2) / (2 * H), 0.03, 0.065));
    cx.fillStyle = "#030108"; cx.fillRect(0, 0, W, b); cx.fillRect(0, H - b, W, b);
    return b;
  }
  function shakeOf(t, t0, dur, amp) {
    var s = settings();
    if (!s.shake || t < t0 || t > t0 + dur) return [0, 0];
    var k = 1 - (t - t0) / dur, a = amp * k * k * H / 1080;
    return [Math.sin(t * 91) * a, Math.cos(t * 77) * a];
  }
  function beatPulse(t) { var f = (t % BEAT) / BEAT; return Math.exp(-f * 6); }

  /* ============================================================ CÓMIC ANIMADO */
  /* Escenario 16:9 centrado: las viñetas y las cartelas se colocan en él para
     que la página se lea igual en 4:3, 16:9 y 21:9. Los fondos a página
     completa sí cubren todo el lienzo. */
  var SW = 0, SX = 0, U = 1;
  function stage() { SW = Math.min(W, H * 16 / 9 * 1.12); SX = (W - SW) / 2; U = Math.min(SW / 1920, H / 1080 * 1.12); }
  function X(f) { return SX + f * SW; }
  function Y(f) { return f * H; }
  var FONT_CAP = '"Barlow Condensed", "Arial Narrow", "Roboto Condensed", sans-serif';
  var FONT_SFX = '"Bangers", "Impact", "Haettenschweiler", "Arial Black", sans-serif';
  var dots = null;
  function halftone(x, y, w, h, a) {
    if (!dots) {
      var c = document.createElement("canvas"); c.width = c.height = 12;
      var d = c.getContext("2d"); d.fillStyle = "#07030d";
      d.beginPath(); d.arc(3, 3, 1.5, 0, 7); d.fill(); d.beginPath(); d.arc(9, 9, 1.5, 0, 7); d.fill();
      dots = cx.createPattern(c, "repeat");
    }
    cx.save(); cx.globalAlpha = a; cx.fillStyle = dots; cx.fillRect(x, y, w, h); cx.restore();
  }
  function pop(t, t0, dur) { return reduced ? (t >= t0 ? 1 : 0) : easeOut(seg(t, t0, t0 + (dur || 0.26))); }

  /* Viñeta: sombra, marco de tinta, filete hueso, imagen recortada y trama.
     src = [x0, y0, x1, y1] en fracciones de la imagen. o: rot, a, zoom, px, py. */
  function panel(im, src, x, y, w, h, o) {
    o = o || {};
    var a = o.a == null ? 1 : o.a; if (a <= 0 || w <= 2 || h <= 2) return;
    var b = Math.max(3, 11 * U) * (o.border == null ? 1 : o.border);
    cx.save(); cx.globalAlpha = a;
    cx.translate(x + w / 2, y + h / 2); if (o.rot) cx.rotate(o.rot);
    if (o.shadow !== false) { cx.fillStyle = "rgba(0,0,0,0.6)"; cx.fillRect(-w / 2 - b + 14 * U, -h / 2 - b + 16 * U, w + 2 * b, h + 2 * b); }
    cx.fillStyle = C.bone; cx.fillRect(-w / 2 - b - 2.5 * U, -h / 2 - b - 2.5 * U, w + 2 * b + 5 * U, h + 2 * b + 5 * U);
    cx.fillStyle = C.ink; cx.fillRect(-w / 2 - b, -h / 2 - b, w + 2 * b, h + 2 * b);
    cx.beginPath(); cx.rect(-w / 2, -h / 2, w, h); cx.clip();
    if (ok(im)) {
      var nw = im.naturalWidth, nh = im.naturalHeight;
      var s = Math.max(w / ((src[2] - src[0]) * nw), h / ((src[3] - src[1]) * nh)) * (o.zoom || 1);
      /* La ventana nunca sale del recorte pedido: lo que queda fuera de src no se enseña. */
      var fx = clamp((src[0] + src[2]) / 2 + (o.px || 0), src[0] + w / (2 * nw * s), src[2] - w / (2 * nw * s));
      var fy = clamp((src[1] + src[3]) / 2 + (o.py || 0), src[1] + h / (2 * nh * s), src[3] - h / (2 * nh * s));
      cx.drawImage(im, -fx * nw * s, -fy * nh * s, nw * s, nh * s);
    } else {
      var g = cx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, "#2a0a3a"); g.addColorStop(1, C.ink);
      cx.fillStyle = g; cx.fillRect(-w / 2, -h / 2, w, h);
    }
    if (o.tint) { cx.fillStyle = o.tint; cx.fillRect(-w / 2, -h / 2, w, h); }
    halftone(-w / 2, -h / 2, w, h, 0.22);
    cx.restore();
  }
  /* Viñeta que entra deslizándose desde (dx, dy) a compás y sale en tOut. */
  function slidePanel(t, t0, tOut, im, src, fx, fy, fw, fh, rot, dx, dy, o) {
    if (t < t0) return;
    var p = pop(t, t0, 0.3), q = tOut ? ease(seg(t, tOut, tOut + 0.3)) : 0;
    var k = (1 - p) + q * 1.2;
    o = o || {}; o.rot = rot + (1 - p) * 0.12 * (dx >= 0 ? 1 : -1); o.a = Math.min(1, p * 3) * (1 - q);
    panel(im, src, X(fx) + dx * SW * k, Y(fy) + dy * H * k, fw * SW, fh * H, o);
  }
  /* Cartela de narrador. Entra de golpe (escala) en t0 y se retira en tOut. */
  function caption(t, t0, tOut, text, fx, fy, size, bg, fg, rot) {
    if (t < t0 || (tOut && t > tOut + 0.2)) return;
    var p = pop(t, t0, 0.22), q = tOut ? seg(t, tOut, tOut + 0.2) : 0;
    var fs = Math.max(13, size * U), lines = text.split("\n"), pad = fs * 0.36, lh = fs * 1.06, w = 0, i;
    cx.save();
    cx.font = "italic 700 " + fs + "px " + FONT_CAP; cx.textBaseline = "top"; cx.textAlign = "left";
    for (i = 0; i < lines.length; i++) w = Math.max(w, cx.measureText(lines[i]).width);
    var bw = w + pad * 2.2, bh = lh * lines.length + pad * 1.5;
    var x = clamp(X(fx), 8 * U, W - bw - 14 * U), y = Y(fy);
    cx.globalAlpha = Math.min(1, p * 4) * (1 - q);
    cx.translate(x + bw / 2, y + bh / 2); cx.rotate((rot || 0) + (1 - p) * -0.08); var sc = 1 + 0.35 * (1 - p); cx.scale(sc, sc);
    cx.fillStyle = C.ink; cx.fillRect(-bw / 2 + 7 * U, -bh / 2 + 7 * U, bw, bh);
    cx.fillStyle = bg || C.yellow; cx.fillRect(-bw / 2, -bh / 2, bw, bh);
    cx.strokeStyle = C.ink; cx.lineWidth = Math.max(2, 4 * U); cx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    cx.fillStyle = fg || C.ink;
    for (i = 0; i < lines.length; i++) cx.fillText(lines[i], -bw / 2 + pad * 1.1, -bh / 2 + pad * 0.8 + i * lh);
    cx.restore();
  }
  /* Onomatopeya dibujada. */
  function sfxWord(t, t0, tOut, text, fx, fy, size, color, rot) {
    if (t < t0 || (tOut && t > tOut + 0.25)) return;
    var p = pop(t, t0, 0.2), q = tOut ? seg(t, tOut, tOut + 0.25) : 0, fs = size * U;
    cx.save();
    cx.translate(X(fx), Y(fy)); cx.rotate(rot + (reduced ? 0 : Math.sin(t * 40) * 0.012 * (1 - seg(t, t0, t0 + 0.6))));
    var sc = (1 + 0.9 * (1 - p)) * (1 + q * 0.3); cx.scale(sc, sc); cx.globalAlpha = Math.min(1, p * 4) * (1 - q);
    cx.font = "400 " + fs + "px " + FONT_SFX; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.lineJoin = "round";
    cx.lineWidth = fs * 0.16; cx.strokeStyle = C.ink; cx.fillStyle = C.ink;
    cx.strokeText(text, fs * 0.06, fs * 0.07); cx.strokeText(text, 0, 0);
    cx.fillStyle = color; cx.fillText(text, 0, 0);
    cx.restore();
  }
  /* Grieta que avanza: línea quebrada (fracciones del escenario) trazada hasta p. */
  function crack(pts, p, wd) {
    if (p <= 0) return;
    var n = pts.length - 1, upto = p * n, i;
    function path() {
      cx.beginPath(); cx.moveTo(X(pts[0][0]), Y(pts[0][1]));
      for (i = 1; i <= n; i++) {
        if (i <= upto) cx.lineTo(X(pts[i][0]), Y(pts[i][1]));
        else { var f = upto - (i - 1); if (f > 0) cx.lineTo(X(lerp(pts[i - 1][0], pts[i][0], f)), Y(lerp(pts[i - 1][1], pts[i][1], f))); break; }
      }
    }
    cx.save(); cx.lineJoin = "miter"; cx.lineCap = "round";
    cx.strokeStyle = C.ink; cx.lineWidth = (wd + 9) * U; path(); cx.stroke();
    cx.strokeStyle = C.bone; cx.lineWidth = wd * U; path(); cx.stroke();
    cx.restore();
  }
  /* Transición de tinta: p 0→0,5 cubre, 0,5→1 descubre. */
  function inkWipe(p, seed) {
    if (p <= 0 || p >= 1) return;
    var k = p < 0.5 ? p * 2 : (1 - p) * 2, R = Math.hypot(W, H) * 0.42;
    for (var i = 0; i < 7; i++) splat(W * (0.1 + 0.8 * rnd(seed + i * 2.3)), H * (0.15 + 0.7 * rnd(seed + i * 5.1)), R * k * (0.7 + 0.6 * rnd(seed + i)), C.ink, seed + i * 9, 1);
    if (k > 0.92) tint(C.ink, (k - 0.92) / 0.08);
  }
  function speedLines(fx, fy, a, seed) {
    if (reduced || a <= 0) return;
    var x0 = X(fx), y0 = Y(fy), R = Math.hypot(W, H);
    cx.save(); cx.globalAlpha = a; cx.fillStyle = C.ink;
    for (var i = 0; i < 46; i++) {
      var an = rnd(seed + i) * Math.PI * 2 + Math.floor(seq ? seq.t * 12 : 0) * 0.37, r0 = R * (0.3 + 0.16 * rnd(seed + i * 3.3)), wd = 0.006 + 0.016 * rnd(seed + i * 7.7);
      cx.beginPath(); cx.moveTo(x0 + Math.cos(an) * r0, y0 + Math.sin(an) * r0);
      cx.lineTo(x0 + Math.cos(an - wd) * R, y0 + Math.sin(an - wd) * R); cx.lineTo(x0 + Math.cos(an + wd) * R, y0 + Math.sin(an + wd) * R); cx.fill();
    }
    cx.restore();
  }
  function page(im, fx, fy, zoom, dx, dy, dark) {
    var m = cover(im, fx, fy, zoom, 1, dx, dy);
    if (dark) tint(C.ink, dark);
    halftone(0, 0, W, H, 0.13);
    return m;
  }
  function flash(t, t0, dur, color, a) { var st = settings(); if (st.flash && t >= t0 && t < t0 + dur) tint(color, a * (1 - (t - t0) / dur)); }

  /* ================================================================= INTRO */
  function logoBox() {
    /* Misma caja que usa el menú (CSS .dd-menu-logo): el título se queda donde
       luego está el logotipo del menú. */
    var w = Math.min(W * 0.3, H * 0.5), h = w * 682 / 1024;
    return { x: W * 0.04, y: H * 0.05, w: w, h: h };
  }

  function drawIntro(t) {
    var st = settings();
    stage();
    cx.fillStyle = C.ink; cx.fillRect(0, 0, W, H);
    if (t < 4) shotWorld(t);
    else if (t < 9) shotStation(t);
    else if (t < 14) shotNine(t);
    else if (t < 19) shotWrong(t, st);
    else if (t < 24) shotHero(t, st);
    else if (t < 29) shotFall(t, st);
    else shotTitle(t, st);
    /* Transiciones de tinta entre páginas. */
    inkWipe(seg(t, 8.7, 9.3), 3);
    inkWipe(seg(t, 18.75, 19.25), 11);
    if (t < 0.8) tint("#000", 1 - seg(t, 0.1, 0.8));
  }

  /* 01 · EL MUNDO — viñeta panorámica sobre negro que crece a página completa. */
  function shotWorld(t) {
    var g = ease(seg(t, 2.9, 3.9));                       /* la viñeta se expande */
    var push = ease(seg(t, 0, 4));
    var x = lerp(X(0.06), 0, g), y = lerp(Y(0.26), 0, g), w = lerp(SW * 0.88, W, g), h = lerp(H * 0.48, H, g);
    panel(img.station, [0, 0.12, 1, 0.95], x, y, w, h, { rot: lerp(-0.012, 0, g), zoom: lerp(1.0, 1.1, push) + g * g * 0.55, py: lerp(-0.04, 0.12, g), border: 1 - g, shadow: g < 0.5 });
    /* Luz que respira al compás lejano. */
    glow(x + w / 2, y + h * 0.62, h * 0.5, "rgba(250,204,21,0.5)", 0.10 + 0.10 * beatPulse(t));
    splat(X(0.09), Y(0.8), 58 * U * pop(t, 1.0) * (1 - g), C.magenta, 2, 1 - g);
    splat(X(0.93), Y(0.2), 44 * U * pop(t, 2.5) * (1 - g), C.cyan, 5, 1 - g);
    caption(t, 1.0, 3.2, "LA GUERRA HABÍA TERMINADO.", 0.08, 0.16, 58, C.yellow, C.ink, -0.035);
    caption(t, 2.5, 3.3, "ESA NOCHE, ALGUNOS PUDIERON\nREUNIRSE SIN MIEDO.", 0.6, 0.72, 48, C.bone, C.ink, 0.02);
  }

  /* 02 · LA ESTACIÓN — se cruza la puerta: página completa y viñetas de detalle. */
  function shotStation(t) {
    var p = seg(t, 4, 9), sh = shakeOf(t, 4, 0.3, 8);
    page(img.floor, 0.5, lerp(0.5, 0.36, ease(p)), lerp(1.22, 1.04, easeOut(seg(t, 4, 5.2))) + p * 0.05, sh[0], sh[1]);
    glow(W / 2, H * 0.3, H * 0.4, "rgba(255,45,122,0.6)", 0.10 + 0.18 * beatPulse(t));
    slidePanel(t, 4.5, 8.3, img.station, [0.2, 0.0, 0.8, 0.3], 0.62, 0.07, 0.33, 0.32, 0.05, 0.5, -0.3, { zoom: 1 + p * 0.1 });
    slidePanel(t, 5.0, 8.4, img.floor, [0.4, 0.3, 0.6, 0.62], 0.75, 0.36, 0.2, 0.34, -0.06, 0.5, 0.1, { zoom: 1.05 });
    slidePanel(t, 5.5, 8.5, img.floor, [0.05, 0.62, 0.5, 1.0], 0.04, 0.58, 0.3, 0.34, -0.045, -0.5, 0.2, { px: p * 0.04 });
    caption(t, 4.5, 6.6, "UNA VIEJA ESTACIÓN DE TREN.\nCRISTAL, HIERRO… Y UN BAILE.", 0.045, 0.07, 52, C.yellow, C.ink, -0.03);
    caption(t, 6.9, 8.6, "POR FIN, HABÍA QUIEN PODÍA\nIMAGINAR UN MAÑANA.", 0.5, 0.78, 50, C.bone, C.ink, 0.025);
    flash(t, 4, 0.22, C.yellow, 0.8);
  }

  /* 03 · LAS NUEVE PISTAS — corte del edificio; la cámara baja como una aguja por el surco. */
  var NINE_Y = [480, 590, 700, 810, 920, 1030, 1140, 1250, 1360], NINE_H = 1706, NINE_FLOOR = 110;
  function shotNine(t) {
    var im = img.nine;
    /* Encuadre: primero de cerca y bajando; al final se abre para ver las nueve. */
    var out = ease(seg(t, 12.2, 13.2));
    var ph = H * 0.96, pw = Math.min(SW * 0.36, ph * 0.5), px0 = W / 2 - pw / 2, py0 = H * 0.02;
    var travel = ease(seg(t, 9.3, 12.2));
    var cyImg = lerp(lerp(0.2, 0.74, travel), 0.5, out);
    cx.save(); cx.globalAlpha = 0.5;
    cover(im, 0.5, cyImg, 1.5); cx.restore(); tint(C.ink, 0.72);
    /* Viñeta central: se dibuja la lámina a mano para poder verla entera. */
    var b = 11 * U;
    cx.fillStyle = "rgba(0,0,0,0.6)"; cx.fillRect(px0 - b + 14 * U, py0 - b + 16 * U, pw + 2 * b, ph + 2 * b);
    cx.fillStyle = C.bone; cx.fillRect(px0 - b - 2.5 * U, py0 - b - 2.5 * U, pw + 2 * b + 5 * U, ph + 2 * b + 5 * U);
    cx.fillStyle = C.ink; cx.fillRect(px0 - b, py0 - b, pw + 2 * b, ph + 2 * b);
    var s = lerp(pw / 768 * 1.35, ph / NINE_H, out), iw = 768 * s, ih = NINE_H * s;
    var ix = px0 + pw / 2 - iw / 2, iy = clamp(py0 + ph / 2 - ih * cyImg, py0 + ph - ih, py0);
    cx.save(); cx.beginPath(); cx.rect(px0, py0, pw, ph); cx.clip();
    if (ok(im)) cx.drawImage(im, ix, iy, iw, ih); else fallback();
    halftone(px0, py0, pw, ph, 0.18);
    /* Nueve marcas de pintura, una por pista, al compás: se cuentan solas. */
    for (var i = 0; i < 9; i++) {
      var ti = 12.3 + i * 0.12, k = pop(t, ti, 0.18);
      if (k <= 0) continue;
      var fyc = iy + (NINE_Y[i] + NINE_FLOOR * 0.5) * s, pulse = 1 + 0.5 * Math.max(0, 1 - (t - ti) * 4);
      cx.fillStyle = C.yellow; cx.strokeStyle = C.ink; cx.lineWidth = Math.max(2, 3 * U);
      var mw = pw * 0.07 * k * pulse, mh = NINE_FLOOR * s * 0.34 * pulse;
      cx.beginPath(); cx.moveTo(px0 + pw * 0.015, fyc - mh / 2); cx.lineTo(px0 + pw * 0.015 + mw, fyc - mh * 0.3); cx.lineTo(px0 + pw * 0.015 + mw * 0.9, fyc + mh / 2); cx.lineTo(px0 + pw * 0.01, fyc + mh * 0.4); cx.closePath(); cx.fill(); cx.stroke();
    }
    cx.restore();
    /* Viñetas de detalle enlazadas al plano. */
    var det = [[10.0, 0, 0.04, 0.14, -0.06, -1], [10.5, 2, 0.7, 0.2, 0.05, 1], [11.0, 4, 0.05, 0.6, 0.04, -1], [11.5, 7, 0.7, 0.58, -0.05, 1]];
    for (var d = 0; d < det.length; d++) {
      var D = det[d], y0 = NINE_Y[D[1]] / NINE_H;
      slidePanel(t, D[0], 13.5, im, [0.14, y0, 0.86, y0 + NINE_FLOOR / NINE_H], D[2], D[3], 0.26, 0.16, D[4], D[5] * 0.4, 0, { zoom: 1.0 });
      var lk = pop(t, D[0] + 0.15, 0.2) * (1 - seg(t, 13.5, 13.7));
      if (lk > 0) {
        var ax = D[5] < 0 ? X(D[2] + 0.26) + 11 * U : X(D[2]) - 11 * U, ay = Y(D[3] + 0.08), bx = D[5] < 0 ? px0 : px0 + pw, by = iy + (NINE_Y[D[1]] + 55) * s;
        cx.save(); cx.globalAlpha = lk; cx.strokeStyle = C.ink; cx.lineWidth = 9 * U; cx.beginPath(); cx.moveTo(ax, ay); cx.lineTo(lerp(ax, bx, lk), lerp(ay, clamp(by, py0, py0 + ph), lk)); cx.stroke();
        cx.strokeStyle = C.yellow; cx.lineWidth = 4 * U; cx.stroke(); cx.restore();
      }
    }
    caption(t, 9.35, 11.4, "PERO LA NOCHE NO TERMINÓ.", 0.3, 0.035, 56, C.yellow, C.ink, -0.03);
    caption(t, 10.6, 12.3, "EL SALÓN CRECIÓ HACIA ABAJO.", 0.47, 0.45, 46, C.bone, C.ink, 0.03);
    caption(t, 12.4, 13.7, "NUEVE PISTAS.\nUNA DEBAJO DE OTRA.", 0.64, 0.84, 56, C.magenta, C.bone, -0.02);
  }

  /* 04 · ALGO NO FUNCIONA — la página se raja; viñetas torcidas; el compás se repite. */
  function shotWrong(t, st) {
    /* A los 17 s el compás salta: la imagen también repite el mismo instante. */
    var tv = t >= 17 && t < 18 ? 16.5 + ((t - 17) % 0.5) : t;
    var sh = shakeOf(t, 14, 0.4, 16), bp = st.shake ? beatPulse(t) * 5 * U : 0;
    var z = lerp(1.32, 1.04, easeOut(seg(t, 14, 14.5))) + seg(tv, 14, 19) * 0.06;
    page(img.doors, 0.5, 0.4, z, sh[0] + (t >= 17 && t < 18 ? Math.sin(t * 60) * 6 * U : 0), sh[1] + bp, 0.1);
    tint(C.magenta, 0.07 + 0.09 * beatPulse(t));
    slidePanel(t, 15.0, 18.6, img.vinyl, [0.3, 0.1, 1, 0.9], 0.035, 0.52, 0.31, 0.39, -0.085, -0.5, 0.2, { px: Math.sin(tv * 6) * 0.004 });
    slidePanel(t, 15.5, 18.65, img.smiles, [0, 0.05, 1, 0.75], 0.63, 0.07, 0.335, 0.36, 0.07, 0.5, -0.2, { zoom: 1 + seg(tv, 15.5, 19) * 0.12 });
    slidePanel(t, 16.0, 18.7, img.hand, [0, 0, 1, 1], 0.67, 0.53, 0.285, 0.37, -0.05, 0.5, 0.2, { zoom: 1.04 });
    var cp = seg(t, 14.6, 16.9);
    cp = Math.floor(cp * 7) / 7 + (cp * 7 % 1 > 0.7 ? 1 / 7 : 0);            /* avanza a tirones */
    crack([[0.525, -0.02], [0.5, 0.16], [0.54, 0.3], [0.485, 0.48], [0.52, 0.65], [0.47, 0.82], [0.5, 1.02]], Math.min(1, cp), 9);
    crack([[0.485, 0.48], [0.4, 0.52], [0.34, 0.49]], seg(t, 16.0, 16.4), 6);
    crack([[0.52, 0.65], [0.6, 0.68], [0.67, 0.65]], seg(t, 16.4, 16.8), 6);
    splat(X(0.365), Y(0.935), 66 * U * pop(t, 17.6), C.magenta, 9, 1);
    splat(X(0.615), Y(0.48), 46 * U * pop(t, 16.0), C.yellow, 4, 1);
    caption(t, 14.3, 16.2, "LAS PUERTAS YA NO LLEVAN FUERA.", 0.04, 0.055, 54, C.yellow, C.ink, -0.03);
    caption(t, 16.0, 17.6, "LA ÚLTIMA NOTA VUELVE\nANTES DE TERMINAR.", 0.33, 0.3, 46, C.bone, C.ink, 0.03);
    caption(t, 17.6, 18.7, "TODOS BAILAN.\nNADIE RECUERDA DESDE CUÁNDO.", 0.36, 0.81, 48, C.magenta, C.bone, -0.025);
    sfxWord(t, 17.0, 18.5, "CLAC", 0.27, 0.5, 170, C.yellow, -0.17);
    sfxWord(t, 17.5, 18.6, "TUM-TUM", 0.79, 0.47, 120, C.magenta, 0.1);
    flash(t, 14, 0.18, "#fff", 0.7); flash(t, 17, 0.1, "#fff", 0.45); flash(t, 17.5, 0.1, "#fff", 0.35);
  }

  /* 05 · EL PROTAGONISTA — la lámina maestra, sin redibujar. */
  function shotHero(t, st) {
    var late = 20.25;
    page(img.boots, 0.55, 0.6, 1.08 + seg(t, 19, 24) * 0.04, 0, 0, 0.55);
    /* Las botas: cada pisada es el bombo; la última llega tarde. */
    slidePanel(t, 19.0, 0, img.boots, [0.25, 0.05, 1, 1], 0.035, 0.09, 0.4, 0.4, -0.05, -0.5, 0, { py: 0, zoom: 1.02, px: 0 });
    if (t >= late) splat(X(0.33), Y(0.44), 62 * U * pop(t, late, 0.16), C.yellow, 7, 1);
    /* La lámina entra de un tirón y respira. */
    if (t >= 20.75) {
      var p = pop(t, 20.75, 0.28), w = SW * 0.5 + (W - SW) / 2 + 20 * U, x = W - w + (1 - p) * w, pain = t > 22.3 && !reduced ? Math.sin(t * 47) * 2.2 * U * seg(t, 22.3, 22.8) : 0;
      panel(img.master, [0.385, 0.0, 1.0, 0.86], x + pain, -12 * U, w, H + 24 * U, { zoom: 1 + seg(t, 20.75, 24) * 0.06, py: -0.5 });
      if (t > 22.3 && !reduced) {                         /* la torre intenta corregirlo */
        cx.save(); cx.globalCompositeOperation = "lighter"; cx.globalAlpha = 0.16 * seg(t, 22.3, 22.8) * (0.5 + 0.5 * Math.sin(t * 31));
        cx.fillStyle = C.cyan; cx.fillRect(x, H * (0.2 + 0.6 * rnd(Math.floor(t * 14))), w, 5 * U); cx.restore();
      }
    }
    slidePanel(t, 21.5, 0, img.marm, [0, 0.02, 1, 0.98], 0.07, 0.53, 0.165, 0.4, 0.06, -0.3, 0.3, { zoom: 1 + seg(t, 21.5, 24) * 0.05 });
    slidePanel(t, 22.0, 0, img.mface, [0.22, 0.05, 1, 0.95], 0.26, 0.57, 0.22, 0.3, -0.06, -0.3, 0.3, { zoom: 1.02 });
    caption(t, 19.4, 0, "UNO NO SIGUE EL COMPÁS.", 0.04, 0.035, 56, C.yellow, C.ink, -0.03);
    caption(t, 22.5, 0, "A ÉL, LA TORRE LE DUELE.", 0.56, 0.86, 58, C.magenta, C.bone, -0.03);
    sfxWord(t, late, 21.6, "TAC", 0.36, 0.34, 150, C.yellow, -0.2);
    flash(t, late, 0.12, "#fff", 0.6);
  }

  /* Pozo visto de lado: plataforma, cadenas y el IDLE aceptado (07B). Lo usan la
     intro (inicio de la caída) y NUEVA PARTIDA (el resto del descenso).
     scroll: avance por la torre (0–1); hatP: -1 sin sombrero, 0–1 desprendiéndose. */
  function shaftSide(t, scroll, speed, platFy, hatP, shx, shy) {
    cx.fillStyle = "#0b0416"; cx.fillRect(0, 0, W, H);
    if (ok(img.nine)) {
      var iw = Math.max(W * 0.74, H * 1.25), s = iw / 768, ih = NINE_H * s, ix = W / 2 - iw / 2;
      var iy = -lerp(380 * s, ih - H, clamp(scroll, 0, 1));
      cx.drawImage(img.nine, ix, iy, iw, ih);
      tint("rgba(7,3,13,1)", 0.38);
      halftone(0, 0, W, H, 0.16);
    }
    var gl = cx.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, "rgba(7,3,13,0.9)"); gl.addColorStop(0.22, "rgba(7,3,13,0)"); gl.addColorStop(0.78, "rgba(7,3,13,0)"); gl.addColorStop(1, "rgba(7,3,13,0.9)");
    cx.fillStyle = gl; cx.fillRect(0, 0, W, H);
    if (!reduced && speed > 0.05) {
      cx.save(); cx.globalAlpha = 0.5 * speed; cx.fillStyle = C.ink;
      for (var i = 0; i < 30; i++) {
        var sx = W * (0.08 + rnd(i * 1.9) * 0.84), sy = ((rnd(i) * H * 2 - t * H * 3.1) % (H * 1.4) + H * 1.4) % (H * 1.4) - H * 0.2, ww = (3 + 6 * rnd(i * 3)) * U;
        cx.fillRect(sx, sy, ww, H * 0.2 * speed);
        if (i % 3 === 0) { cx.fillStyle = C.bone; cx.fillRect(sx + ww, sy, Math.max(1, 1.5 * U), H * 0.14 * speed); cx.fillStyle = C.ink; }
      }
      /* Polvo y esquirlas que suben: es la torre la que pasa hacia arriba. */
      for (var q = 0; q < 26; q++) {
        var qx = W * (0.14 + rnd(q * 5.3 + 2) * 0.72), qv = 1.6 + rnd(q * 2.1) * 2.2;
        var qy = H * 1.1 - ((rnd(q * 9.7) * H * 1.3 + t * H * qv) % (H * 1.3));
        cx.globalAlpha = 0.75 * speed; cx.fillStyle = q % 4 === 0 ? C.magenta : (q % 4 === 1 ? C.cyan : C.bone);
        cx.fillRect(qx, qy, Math.max(1.5, (2 + 3 * rnd(q)) * U), (10 + 26 * rnd(q * 3)) * U * (0.4 + speed));
      }
      cx.restore();
    }
    /* La plataforma cuelga de cadenas: se balancea como un péndulo y da tirones.
       El personaje va rígido con ella (traslación, escala uniforme y un giro
       pequeño de todo el conjunto); su dibujo no se deforma. */
    var live = reduced ? 0 : speed;
    var sway = Math.sin(t * 2.3) * 0.05 * live + Math.sin(t * 7.1) * 0.01 * live;
    var jolt = Math.exp(-((t * 1.25) % 1) * 7) * live;                         /* tirón de cadena, periódico */
    var camZ = 1 + 0.035 * live + 0.012 * Math.sin(t * 3.1) * live;
    var pxm = W / 2 + (shx || 0) + Math.sin(t * 2.3) * W * 0.014 * live;
    var pym = H * platFy + (shy || 0) + Math.sin(t * 5) * H * 0.006 * live + jolt * H * 0.012, pr = H * 0.25;
    cx.save();
    cx.translate(pxm, -H * 0.5); cx.rotate(sway); cx.scale(camZ, camZ); cx.translate(-pxm, H * 0.5);
    for (var cI = -1; cI <= 1; cI += 2) {
      cx.strokeStyle = C.ink; cx.lineWidth = Math.max(4, 11 * U); cx.beginPath(); cx.moveTo(pxm + cI * pr * 0.92, pym); cx.lineTo(pxm + cI * pr * 0.62, -10); cx.stroke();
      cx.strokeStyle = "rgba(244,236,216,0.55)"; cx.lineWidth = Math.max(1.5, 4 * U); cx.setLineDash([14 * U, 10 * U]); cx.lineDashOffset = -t * 300 * U * speed; cx.stroke(); cx.setLineDash([]);
    }
    cx.fillStyle = C.ink; cx.beginPath(); cx.ellipse(pxm, pym + pr * 0.12, pr * 1.02, pr * 0.27, 0, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = "#2a1040"; cx.beginPath(); cx.ellipse(pxm, pym, pr, pr * 0.25, 0, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = C.magenta; cx.lineWidth = Math.max(2, 6 * U); cx.beginPath(); cx.ellipse(pxm, pym, pr * 0.94, pr * 0.225, 0, 0, Math.PI * 2); cx.stroke();
    cx.strokeStyle = C.ink; cx.lineWidth = Math.max(3, 8 * U); cx.beginPath(); cx.ellipse(pxm, pym, pr, pr * 0.25, 0, 0, Math.PI * 2); cx.stroke();
    /* En cada tirón los pies se despegan un instante de la plataforma. */
    var hh = H * 0.46, hw = hh * 288 / 512, hx = pxm - hw * 0.49, hy = pym - hh * (504 / 512) + pr * 0.02 - jolt * H * 0.016;
    if (ok(img.hero)) {
      if (live > 0.05) {                                                       /* estela: copias enteras, más arriba */
        for (var gI = 3; gI >= 1; gI--) { cx.globalAlpha = 0.2 * live * (4 - gI) / 3; cx.drawImage(img.hero, hx, hy - gI * H * 0.026 * live, hw, hh); }
        cx.globalAlpha = 1;
      }
      cx.drawImage(img.hero, hx, hy, hw, hh);
      if (live > 0.05) {                                                       /* trazos de viento a los lados del cuerpo */
        cx.strokeStyle = "rgba(244,236,216,0.8)"; cx.lineWidth = Math.max(1.5, 3 * U); cx.lineCap = "round";
        for (var wI = 0; wI < 8; wI++) {
          var wx = hx + hw * (wI % 2 ? 0.16 : 0.84) + (rnd(wI * 3.7) - 0.5) * hw * 0.3;
          var wy = hy + hh * (((rnd(wI * 1.3) - t * (2.2 + rnd(wI) * 1.5)) % 1 + 1) % 1), wl = hh * (0.05 + 0.07 * rnd(wI * 5.1)) * live;
          cx.globalAlpha = 0.7 * live; cx.beginPath(); cx.moveTo(wx, wy); cx.lineTo(wx, wy - wl); cx.stroke();
        }
        cx.globalAlpha = 1;
      }
    }
    if (hatP >= 0 && hatP < 1 && ok(img.hat)) {
      var hatW = hw * 0.62 * lerp(1, 0.8, hatP), hatH = hatW * img.hat.naturalHeight / img.hat.naturalWidth;
      cx.save();
      cx.translate(hx + hw * 0.5 + Math.sin(hatP * 5) * hw * 0.45 * hatP, hy + hh * 0.1 - H * 0.75 * Math.pow(hatP, 1.25));
      cx.rotate(reduced ? 0 : Math.sin(hatP * 4.2) * 0.5 + hatP * 1.0);
      cx.drawImage(img.hat, -hatW / 2, -hatH / 2, hatW, hatH);
      cx.restore();
    }
    cx.restore();
    return { x: pxm, y: pym, r: pr };
  }

  /* 06 · EL DESCENSO — el suelo se abre, empieza la caída y el sombrero se queda arriba. */
  var PIT = [0.52, 0.5], PIT_CAM = [0.44, 0.4];                                 /* centro del pozo en la lámina */
  function shotFall(t, st) {
    if (t < 25.5) {
      var sh = shakeOf(t, 24, 0.7, 20), sh2 = shakeOf(t, 25, 0.5, 26);
      page(img.boots, 0.6, 0.62, 1.12 + seg(t, 24, 25.5) * 0.1, sh[0] + sh2[0], sh[1] + sh2[1], 0.08);
      var boom = Math.exp(-(t - 24) * 1.4);
      var g = cx.createLinearGradient(0, H, 0, H * 0.4); g.addColorStop(0, "rgba(255,45,122," + (0.6 * boom) + ")"); g.addColorStop(1, "rgba(255,45,122,0)");
      cx.save(); cx.globalCompositeOperation = "lighter"; cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore();
      crack([[0.56, 1.02], [0.6, 0.86], [0.52, 0.76], [0.6, 0.66], [0.5, 0.58], [0.38, 0.62], [0.26, 0.55]], seg(t, 24.15, 25.0), 10);
      crack([[0.6, 0.86], [0.74, 0.82], [0.86, 0.88], [1.0, 0.8]], seg(t, 24.5, 25.1), 8);
      crack([[0.52, 0.76], [0.4, 0.84], [0.3, 0.8], [0.14, 0.9]], seg(t, 24.7, 25.3), 8);
      crack([[0.6, 0.66], [0.72, 0.6], [0.8, 0.64]], seg(t, 25.0, 25.4), 6);
      caption(t, 24.3, 25.35, "Y EL SUELO SE ABRE.", 0.04, 0.05, 58, C.yellow, C.ink, -0.03);
      sfxWord(t, 24.5, 25.4, "CRRRAC", 0.3, 0.36, 170, C.yellow, -0.1);
      flash(t, 24, 0.14, "#fff", 0.6);
    } else if (t < 27.5) {
      /* La página se parte en dos y deja ver el pozo de lado. */
      var u = t - 25.5, sp = clamp(u / 0.5, 0, 1), s3 = shakeOf(t, 25.5, 0.4, 14);
      var hatP = seg(u, 0.25, 2.3);
      shaftSide(t, 0.03 * u + 0.06 * u * u, sp, lerp(0.5, 0.72, easeOut(seg(u, 0, 0.7))), hatP, s3[0], s3[1]);
      speedLines(0.5, 0.45, 0.4 * sp, 31);
      var open = easeOut(seg(u, 0, 0.45));
      if (open < 1) {
        for (var k = -1; k <= 1; k += 2) {
          cx.save(); cx.beginPath();
          if (k < 0) { cx.moveTo(0, 0); cx.lineTo(W * 0.56, 0); cx.lineTo(W * 0.44, H); cx.lineTo(0, H); }
          else { cx.moveTo(W * 0.56, 0); cx.lineTo(W, 0); cx.lineTo(W, H); cx.lineTo(W * 0.44, H); }
          cx.closePath(); cx.translate(k * open * W * 0.6, k * open * H * 0.08); cx.clip();
          page(img.boots, 0.6, 0.62, 1.22, 0, 0, 0.08);
          cx.restore();
        }
      }
      sfxWord(t, 26.0, 27.3, "FSSSSH", 0.8, 0.82, 130, C.cyan, 0.12);
      flash(t, 25.5, 0.14, "#fff", 0.7);
    } else {
      /* Picado desde el borde: la plataforma se pierde abajo; el sombrero sube y cae junto al agujero. */
      var v = t - 27.5, back = ease(seg(v, 0.95, 1.5));
      var zoom = lerp(2.5, 1.0, back), fx = lerp(PIT_CAM[0], 0.5, back), fy = lerp(PIT_CAM[1], 0.5, back);
      var m = page(img.pit, fx, fy, zoom + (1 - back) * seg(v, 0, 1) * 0.12, 0, 0, 0);
      var pcx = m.x + m.w * PIT[0], pcy = m.y + m.h * PIT[1];
      var far = easeOut(seg(v, 0, 1.2)), pr = m.w * lerp(0.085, 0.012, far);
      cx.save(); cx.globalAlpha = 1 - seg(v, 0.9, 1.3);
      cx.fillStyle = C.ink; cx.beginPath(); cx.arc(pcx, pcy, pr * 1.15, 0, 7); cx.fill();
      cx.fillStyle = "#2a1040"; cx.beginPath(); cx.arc(pcx, pcy, pr, 0, 7); cx.fill();
      cx.strokeStyle = C.magenta; cx.lineWidth = Math.max(1.5, pr * 0.12); cx.beginPath(); cx.arc(pcx, pcy, pr * 0.9, 0, 7); cx.stroke();
      cx.fillStyle = C.ink; cx.beginPath(); cx.ellipse(pcx, pcy, pr * 0.2, pr * 0.3, 0, 0, 7); cx.fill();   /* él, ya sólo una mancha de tinta */
      cx.restore();
      speedLines((pcx - SX) / SW, pcy / H, 0.5 * (1 - back), 4);
      /* El sombrero vuela hacia el borde, donde la lámina ya lo tiene dibujado. */
      if (v < 1.12 && ok(img.hat)) {
        var hp = seg(v, 0, 1.12), hx = lerp(pcx, m.x + m.w * 0.77, Math.pow(hp, 1.6)), hy = lerp(pcy, m.y + m.h * 0.74, Math.pow(hp, 2.2)) - Math.sin(hp * Math.PI) * H * 0.2;
        var hw2 = m.w * lerp(0.03, 0.2, hp), hh2 = hw2 * img.hat.naturalHeight / img.hat.naturalWidth;
        cx.save(); cx.translate(hx, hy); cx.rotate(reduced ? 0 : hp * 7); cx.drawImage(img.hat, -hw2 / 2, -hh2 / 2, hw2, hh2); cx.restore();
      }
      flash(t, 27.5, 0.12, "#fff", 0.6); flash(t, 28.62, 0.14, C.yellow, 0.5);
    }
  }

  /* 07 · EL COMIENZO — el encuadre final es, exactamente, el fondo del menú. */
  function shotTitle(t, st) {
    var tq = t - 29, sh = shakeOf(t, 29, 0.5, 16);
    page(img.pit, 0.5, 0.5, 1, sh[0], sh[1], 0);
    var a = ease(seg(tq, 0.1, 1.6));
    var lg = cx.createLinearGradient(0, 0, W * 0.72, 0);
    lg.addColorStop(0, "rgba(5,2,10," + (0.94 * a) + ")"); lg.addColorStop(0.5, "rgba(5,2,10," + (0.72 * a) + ")"); lg.addColorStop(1, "rgba(5,2,10,0)");
    cx.fillStyle = lg; cx.fillRect(0, 0, W, H);
    var b = logoBox(), k = easeOut(seg(tq, 0, 0.35)), cxm = b.x + b.w / 2, cym = b.y + b.h / 2;
    splat(cxm, cym, b.w * 0.62 * k, C.magenta, 3, 0.5 * (1 - 0.6 * seg(tq, 0.5, 2)));
    splat(cxm + b.w * 0.34, cym + b.h * 0.3, b.w * 0.2 * k, C.yellow, 8, 0.7 * (1 - 0.7 * seg(tq, 0.5, 2)));
    if (ok(img.logo)) {
      var sc = reduced ? 1 : 1 + 0.6 * Math.pow(1 - seg(tq, 0, 0.35), 2);
      cx.save(); cx.globalAlpha = seg(tq, 0, 0.1);
      cx.drawImage(img.logo, cxm - b.w * sc / 2, cym - b.h * sc / 2, b.w * sc, b.h * sc);
      cx.restore();
    }
    var ta = ease(seg(tq, 0.9, 1.6));
    if (ta > 0) {
      cx.save(); cx.globalAlpha = ta; cx.fillStyle = C.bone;
      var fs = Math.max(11, b.w / 19), txt = "LA NOCHE QUE DEVORÓ EL AMANECER";
      cx.font = "italic 700 " + fs + "px " + FONT_CAP;
      var tw = cx.measureText(txt).width; if (tw > b.w) cx.font = "italic 700 " + (fs * b.w / tw) + "px " + FONT_CAP;
      cx.textAlign = "center"; cx.textBaseline = "top"; cx.shadowColor = "rgba(0,0,0,0.9)"; cx.shadowBlur = 10 * DPR;
      cx.fillText(txt, cxm, b.y + b.h + H * 0.012);
      cx.restore();
    }
    flash(t, 29, 0.1, "#fff", 0.6);
  }

  /* =============================================================== DESCENSO */
  /* NUEVA PARTIDA retoma la caída donde la intro la dejó: se entra por el pozo
     del menú y se llega al Refugio. Más corta que la de la intro y sin repetir
     sus planos (ni grietas ni sombrero). */
  function drawDescent(t) {
    var st = settings();
    stage();
    cx.fillStyle = C.ink; cx.fillRect(0, 0, W, H);
    if (t < 0.55) {
      /* Zambullida desde el encuadre del menú hacia el fondo del pozo. */
      var d = ease(seg(t, 0, 0.55));
      page(img.pit, lerp(0.5, PIT[0], d), lerp(0.5, PIT[1], d), 1 + d * d * 5, 0, 0, d * 0.5);
      speedLines(lerp(0.5, PIT[0], d), lerp(0.5, PIT[1], d), 0.6 * d, 9);
    } else {
      var u = t - 0.55;                                    /* 0 – 4,05 */
      var brake = seg(u, 2.2, 3.3), speed = 1 - ease(brake);
      var scroll = 0.3 + 0.2 * u - 0.09 * brake * brake * 1.1 + 0.0;
      var sh = shakeOf(t, 3.85, 0.5, 18);
      var arrive = ease(seg(u, 2.5, 3.3));
      shaftSide(t, Math.min(scroll, 0.86), speed, lerp(0.72, 0.8, arrive), -1, sh[0], sh[1]);
      speedLines(0.5, 0.45, 0.4 * speed, 31);
      if (arrive > 0) {                                    /* el suelo del Refugio sube a su encuentro */
        var fyy = lerp(H * 1.25, H * 0.8 + H * 0.25 * 0.2, arrive);
        var fg = cx.createLinearGradient(0, fyy, 0, H); fg.addColorStop(0, "#7a1f4a"); fg.addColorStop(1, "#2a0a24");
        cx.fillStyle = fg; cx.fillRect(0, fyy, W, H - fyy + 2);
        cx.fillStyle = C.ink; cx.fillRect(0, fyy - Math.max(3, 8 * U), W, Math.max(3, 8 * U));
        halftone(0, fyy, W, H - fyy, 0.2);
        glow(W / 2, fyy, H * 0.6, "rgba(255,45,122,0.7)", 0.3 * arrive);
      }
      sfxWord(t, 3.85, 4.4, "CLONK", 0.74, 0.6, 130, C.yellow, 0.1);
      flash(t, 3.85, 0.12, "#fff", 0.5);
    }
    inkWipe(seg(t, 0.3, 0.8), 5);
    /* Fundido de color hacia el Refugio. */
    if (t > 4.0) tint("#3a0d2c", ease(seg(t, 4.0, 4.55)));
  }

  /* ================================================================= SONIDO */
  var ac = null, master = null, musicBus = null, noiseBuf = null;
  /* Nivel de salida de la intro y del descenso (antes 0,5). Medido contra la
     música del menú: ver docs/RESTART/14. */
  var MASTER_LEVEL = 0.7;
  function audioReady() {
    var st = settings();
    if (st.muted) return false;
    try {
      if (!ac) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ac = new AC();
        /* Salida: ganancia → limitador → altavoces. La intro se ha subido para
           igualarla con la música del menú; el limitador sólo actúa en los picos
           (por encima de −3 dB) para que la subida no sature. */
        master = ac.createGain();
        var lim = ac.createDynamicsCompressor();
        lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
        master.connect(lim); lim.connect(ac.destination);
        var n = ac.sampleRate * 1.5; noiseBuf = ac.createBuffer(1, n, ac.sampleRate);
        var dta = noiseBuf.getChannelData(0);
        for (var i = 0; i < n; i++) dta[i] = Math.random() * 2 - 1;
      }
      if (ac.state === "suspended") ac.resume();
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setValueAtTime(MASTER_LEVEL * st.vol, ac.currentTime);
      return ac.state === "running";
    } catch (e) { return false; }
  }
  function newBus() {
    musicBus = ac.createBiquadFilter(); musicBus.type = "lowpass"; musicBus.frequency.value = 18000;
    var g = ac.createGain(); g.gain.value = 1; musicBus.connect(g); g.connect(master);
    musicBus._gain = g;
  }
  function tone(when, freq, dur, type, vol, dest, slideTo) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, when);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, when + dur);
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(dest || master); o.start(when); o.stop(when + dur + 0.05);
  }
  function noise(when, dur, vol, type, f0, f1, dest) {
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type; f.frequency.setValueAtTime(f0, when);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, when + dur);
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + Math.min(0.02, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    s.connect(f); f.connect(g); g.connect(dest || master); s.start(when); s.stop(when + dur + 0.05);
  }
  var S = {
    kick: function (w, v, d) { tone(w, 150, 0.32, "sine", v, d, 42); },
    snare: function (w, v, d) { noise(w, 0.2, v, "highpass", 1400, 0, d); tone(w, 210, 0.12, "triangle", v * 0.6, d, 120); },
    hat: function (w, v, d) { noise(w, 0.05, v, "highpass", 7000, 0, d); },
    bass: function (w, f, v, d) { tone(w, f, 0.22, "sawtooth", v, d); },
    lead: function (w, f, v, d) { tone(w, f, 0.3, "square", v, d); },
    crackle: function (w, v) { noise(w, 0.03, v, "bandpass", 2500 + Math.random() * 3000); },
    boom: function (w, v) { tone(w, 70, 1.8, "sine", v, null, 26); noise(w, 1.2, v * 0.5, "lowpass", 220, 60); },
    hit: function (w, v) { tone(w, 110, 1.4, "sine", v, null, 30); noise(w, 1.6, v * 0.7, "highpass", 900, 5000); tone(w, 440, 0.9, "sawtooth", v * 0.25, null, 220); },
    whoosh: function (w, dur, v, up) { noise(w, dur, v, "bandpass", up ? 200 : 3000, up ? 3000 : 200); },
    rumble: function (w, dur, v) { tone(w, 48, dur, "sawtooth", v, null, 40); noise(w, dur, v * 0.6, "lowpass", 160, 120); },
    screech: function (w, dur, v) { noise(w, dur, v, "bandpass", 900, 2600); tone(w, 600, dur, "sawtooth", v * 0.2, null, 1500); }
  };
  var BASS = [55, 55, 65.4, 55, 73.4, 55, 65.4, 82.4];
  var LEAD = [440, 523.3, 659.3, 523.3, 587.3, 440, 392, 523.3];

  /* Partitura de la intro como lista de sucesos [t, fn]. Se dispara contra el
     mismo reloj que la imagen: si la imagen se retrasa, el sonido también.
     Cada entrada de viñeta, cartela u onomatopeya tiene aquí su golpe. */
  function buildIntroScore() {
    var ev = [], tb;
    function at(t, fn) { ev.push({ t: t, fn: fn }); }
    function step(tt, n, tr, vol, full) {
      at(tt, function (w) {
        var k = Math.pow(2, -tr / 12);
        if (n % 2 === 0) S.kick(w, 0.75 * vol, musicBus); else S.hat(w, 0.16 * vol, musicBus);
        if (n % 4 === 2) S.snare(w, 0.28 * vol, musicBus);
        S.bass(w, BASS[n % 8] * k, 0.22 * vol, musicBus);
        if (n % 2 === 0) S.lead(w, LEAD[(n / 2) % 8] * k, 0.07 * vol, musicBus);
        if (full && n % 2 === 1) S.lead(w, LEAD[((n + 1) / 2) % 8] * k * 2, 0.04 * vol, musicBus);
      });
    }
    /* 01 · la orquesta suena lejos, detrás de los muros. */
    at(0, function (w) { musicBus.frequency.setValueAtTime(380, w); noise(w, 4.2, 0.10, "bandpass", 300, 520); });
    for (tb = 0.5; tb < 4; tb += BEAT / 2) step(tb, Math.round(tb / (BEAT / 2)), 0, 0.8, false);
    at(1.0, function (w) { S.boom(w, 0.5); });
    at(2.5, function (w) { S.boom(w, 0.45); });
    at(2.9, function (w) { S.whoosh(w, 1.0, 0.25, true); });
    /* 02 · se cruza la puerta: se abre el filtro. */
    at(3.98, function (w) { musicBus.frequency.setValueAtTime(380, w); musicBus.frequency.exponentialRampToValueAtTime(18000, w + 0.35); S.hit(w, 0.45); });
    for (tb = 4; tb < 9; tb += BEAT / 2) step(tb, Math.round(tb / (BEAT / 2)), 0, 1, false);
    [4.5, 5.0, 5.5, 6.9].forEach(function (x) { at(x, function (w) { S.snare(w, 0.5); S.whoosh(w, 0.18, 0.2, false); }); });
    at(8.7, function (w) { S.whoosh(w, 0.6, 0.35, false); });
    /* 03 · la misma melodía, un tono más abajo cada compás. */
    for (tb = 9; tb < 14; tb += BEAT / 2) step(tb, Math.round(tb / (BEAT / 2)), Math.floor((tb - 9) / 1) * 2, 1, false);
    at(9.3, function (w) { S.rumble(w, 4.6, 0.16); });
    [9.35, 10.6, 12.4].forEach(function (x) { at(x, function (w) { S.snare(w, 0.45); }); });
    [10.0, 10.5, 11.0, 11.5].forEach(function (x) { at(x, function (w) { S.whoosh(w, 0.18, 0.2, false); }); });
    for (var i = 0; i < 9; i++) (function (i) { at(12.3 + i * 0.12, function (w) { tone(w, 880 * Math.pow(2, -i / 12), 0.09, "square", 0.16); S.hat(w, 0.3); }); })(i);
    /* 04 · más agresiva; a los 17 s el compás se repite. */
    at(14, function (w) { S.hit(w, 0.7); });
    for (tb = 14; tb < 17; tb += BEAT / 2) step(tb, Math.round(tb / (BEAT / 2)), 0, 1.15, true);
    for (tb = 14.25; tb < 17; tb += BEAT) (function (tb) { at(tb, function (w) { S.snare(w, 0.22, musicBus); }); })(tb);
    [15.0, 15.5, 16.0].forEach(function (x) { at(x, function (w) { S.snare(w, 0.55); S.whoosh(w, 0.16, 0.25, false); }); });
    for (i = 0; i < 6; i++) (function (i) { at(14.7 + i * 0.36, function (w) { noise(w, 0.07, 0.3, "highpass", 2400); }); })(i);
    function stutter(t0) {
      at(t0, function (w) { noise(w, 0.03, 0.6, "bandpass", 3200); S.kick(w, 0.8, musicBus); S.bass(w, BASS[6], 0.24, musicBus); S.lead(w, LEAD[3], 0.1, musicBus); });
      at(t0 + 0.25, function (w) { S.hat(w, 0.18, musicBus); S.bass(w, BASS[7], 0.24, musicBus); });
    }
    stutter(17); stutter(17.5); stutter(18); stutter(18.5);
    at(18.75, function (w) { S.whoosh(w, 0.5, 0.35, false); });
    /* 05 · la música queda detrás de un filtro; las pisadas son el bombo. */
    at(19, function (w) { musicBus.frequency.setValueAtTime(18000, w); musicBus.frequency.exponentialRampToValueAtTime(420, w + 0.3); });
    for (tb = 19; tb < 20.2; tb += BEAT) (function (tb) {
      at(tb, function (w) { S.kick(w, 0.8, musicBus); noise(w, 0.08, 0.2, "lowpass", 500, 0, null); });
      at(tb + 0.25, function (w) { S.bass(w, BASS[Math.round(tb * 2) % 8], 0.2, musicBus); });
    })(tb);
    at(19.4, function (w) { S.snare(w, 0.35); });
    at(20.25, function (w) {                                  /* el paso fuera de tiempo: la música se corta */
      S.snare(w, 0.7); noise(w, 0.05, 0.5, "bandpass", 1500);
      musicBus._gain.gain.setValueAtTime(1, w); musicBus._gain.gain.linearRampToValueAtTime(0.0001, w + 0.03);
    });
    at(20.75, function (w) { S.whoosh(w, 0.25, 0.4, false); S.boom(w, 0.5); });
    [21.5, 22.0].forEach(function (x) { at(x, function (w) { S.snare(w, 0.4); }); });
    at(22.3, function (w) {                                   /* disonancia sostenida: la torre le duele */
      tone(w, 110, 1.75, "sawtooth", 0.10, null, 108); tone(w, 116.5, 1.75, "sawtooth", 0.10, null, 119); tone(w, 233, 1.7, "square", 0.03, null, 240);
    });
    at(22.5, function (w) { S.snare(w, 0.4); });
    /* 06 · el suelo se abre. */
    at(24, function (w) { S.boom(w, 1.0); });
    at(24.15, function (w) { S.rumble(w, 1.3, 0.2); });
    for (i = 0; i < 5; i++) (function (i) { at(24.5 + i * 0.2, function (w) { noise(w, 0.09, 0.35, "highpass", 1800 + i * 300); }); })(i);
    at(25.5, function (w) { S.boom(w, 1.0); S.whoosh(w, 0.9, 0.5, false); tone(w, 300, 1.2, "sine", 0.3, null, 60); });
    at(25.6, function (w) { S.rumble(w, 1.9, 0.22); });
    for (i = 0; i < 4; i++) (function (i) { at(26.0 + i * 0.4, function (w) { S.whoosh(w, 0.3, 0.16, i % 2 === 0); }); })(i);
    at(27.5, function (w) { S.snare(w, 0.6); S.whoosh(w, 1.0, 0.3, true); });
    at(28.62, function (w) { tone(w, 120, 0.25, "sine", 0.5, null, 60); noise(w, 0.12, 0.25, "lowpass", 700, 200); });
    /* 07 · título. */
    at(29, function (w) { S.hit(w, 0.9); });
    ev.sort(function (a, b) { return a.t - b.t; });
    return ev;
  }
  function buildDescentScore() {
    var ev = [];
    function at(t, fn) { ev.push({ t: t, fn: fn }); }
    at(0, function (w) { S.whoosh(w, 0.7, 0.5, false); tone(w, 300, 0.9, "sine", 0.3, null, 60); });
    at(0.5, function (w) { S.rumble(w, 2.4, 0.22); });
    for (var i = 0; i < 5; i++) (function (i) { at(0.7 + i * 0.42, function (w) { S.whoosh(w, 0.3, 0.14, i % 2 === 0); }); })(i);
    at(2.75, function (w) { S.screech(w, 1.0, 0.16); });
    at(3.85, function (w) { tone(w, 90, 0.5, "sine", 0.8, null, 36); noise(w, 0.3, 0.3, "lowpass", 400, 80); });
    ev.sort(function (a, b) { return a.t - b.t; });
    return ev;
  }
  function fireAudio() {
    if (!seq || !seq.score || !seq.audio) return;
    if (!ac || ac.state !== "running") { /* sin sonido disponible: se descartan los sucesos ya pasados */
      while (seq.cursor < seq.score.length && seq.score[seq.cursor].t <= seq.t) seq.cursor++;
      return;
    }
    var ahead = 0.12;
    while (seq.cursor < seq.score.length && seq.score[seq.cursor].t <= seq.t + ahead) {
      var e = seq.score[seq.cursor++];
      try { e.fn(ac.currentTime + Math.max(0.005, e.t - seq.t)); seq.fired++; } catch (err) {}
    }
  }
  function silence(fade) {
    if (!ac || !master) return;
    try {
      var n = ac.currentTime;
      master.gain.cancelScheduledValues(n);
      master.gain.setValueAtTime(master.gain.value, n);
      master.gain.linearRampToValueAtTime(0.0001, n + (fade || 0.15));
    } catch (e) {}
  }

  /* ============================================================ REPRODUCTOR */
  var padWas = false;
  function padPressed() {
    try {
      var pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (var i = 0; i < pads.length; i++) {
        var gp = pads[i];
        if (gp && gp.connected && gp.buttons && ((gp.buttons[0] && gp.buttons[0].pressed) || (gp.buttons[9] && gp.buttons[9].pressed))) return true;
      }
    } catch (e) {}
    return false;
  }

  function start(type, duration, onDone, opts) {
    if (seq) return false;
    ensureCanvas(); preload(); fit();
    seq = {
      type: type, t: 0, duration: duration, onDone: onDone, last: performance.now(), raf: 0,
      score: null, cursor: 0, fired: 0, audio: false, titleFired: false, opts: opts || {}, endedBy: null, frames: 0
    };
    seq.audio = audioReady();
    if (ac) { newBus(); seq.score = type === "intro" ? buildIntroScore() : buildDescentScore(); }
    padWas = padPressed();
    cv.classList.remove("is-out"); cv.classList.add("is-on");
    hintEl.classList.add("is-on");
    document.body.classList.add("dd-opening-on");
    document.body.setAttribute("data-dd-opening", type);
    seq.raf = requestAnimationFrame(frame);
    return true;
  }

  function frame(now) {
    if (!seq) return;
    var dt = (now - seq.last) / 1000; seq.last = now;
    if (!seq.frozen) seq.t += clamp(dt, 0, 0.25);
    seq.frames++;
    /* mando: A o Start, por flanco */
    var pd = padPressed();
    if (pd && !padWas && seq.t > 0.4) { padWas = pd; return finish("skip"); }
    padWas = pd;
    if (seq.t >= seq.duration) { paint(seq.duration - 0.001); return finish("complete"); }
    if (seq.type === "intro" && !seq.titleFired && seq.t >= TITLE_AT) {
      seq.titleFired = true;
      if (typeof seq.opts.onTitle === "function") { try { seq.opts.onTitle(); } catch (e) {} }
    }
    fireAudio();
    paint(seq.t);
    seq.raf = requestAnimationFrame(frame);
  }
  function paint(t) {
    try {
      cx.setTransform(1, 0, 0, 1, 0, 0);
      if (seq.type === "intro") drawIntro(t); else drawDescent(t);
    } catch (e) {
      if (!paint.warned) { paint.warned = true; console.warn("[DD_OPENING] error de pintura", e); }
    }
  }

  function finish(why) {
    if (!seq) return;
    var s = seq; seq = null;
    cancelAnimationFrame(s.raf);
    s.endedBy = why;
    lastEnd = { type: s.type, by: why, at: +s.t.toFixed(2), audioEvents: s.fired, frames: s.frames };
    /* El sonido de la secuencia nunca sobrevive a la secuencia. */
    silence(why === "complete" ? 0.6 : 0.15);
    hintEl.classList.remove("is-on");
    document.body.classList.remove("dd-opening-on");
    document.body.removeAttribute("data-dd-opening");
    /* Primero se avisa (el menú o el Refugio se colocan debajo) y después el
       lienzo se funde: nunca se pasa por negro. */
    if (typeof s.onDone === "function") { try { s.onDone(why); } catch (e) { console.warn("[DD_OPENING] onDone", e); } }
    cv.classList.add("is-out");
    setTimeout(function () { if (!seq && cv) cv.classList.remove("is-on", "is-out"); }, reduced ? 60 : 620);
  }
  var lastEnd = null;

  function skip() { if (seq && seq.t > 0.4) { finish("skip"); return true; } return false; }

  /* En document y no en window: el guardián de teclado del build anula los
     keydown de captura registrados sobre window. */
  document.addEventListener("keydown", function (ev) {
    if (!seq || ev.repeat) return;
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
    if (/^(F\d+|Tab|Shift.*|Control.*|Alt.*|Meta.*)$/.test(ev.code)) return;
    ev.preventDefault(); ev.stopPropagation();
    skip();
  }, true);
  window.addEventListener("pointerdown", function () { if (seq) skip(); }, true);

  window.DD_OPENING = Object.freeze({
    INTRO_DURATION: INTRO_DURATION,
    NINE_LEVELS: NINE_Y.length,
    TITLE_AT: TITLE_AT,
    fontsReady: function () { return fontsReady; },
    DESCENT_DURATION: DESCENT_DURATION,
    SHOTS: SHOTS.map(function (s) { return { id: s.id, from: s.from, to: s.to, name: s.name }; }),
    DESCENT_PHASES: DESCENT_PHASES.map(function (s) { return { id: s.id, from: s.from, to: s.to, name: s.name }; }),
    FILES: Object.keys(FILES).map(function (k) { return FILES[k]; }),
    preload: preload,
    playIntro: function (onDone, opts) { return start("intro", INTRO_DURATION, onDone, opts); },
    playDescent: function (onDone, opts) { return start("descent", DESCENT_DURATION, onDone, opts); },
    skip: skip,
    isActive: function () { return !!seq; },
    getState: function () {
      if (!seq) return null;
      var table = seq.type === "intro" ? SHOTS : DESCENT_PHASES, shot = table[table.length - 1].id;
      for (var i = 0; i < table.length; i++) if (seq.t >= table[i].from && seq.t < table[i].to) { shot = table[i].id; break; }
      return {
        type: seq.type, elapsed: +seq.t.toFixed(3), duration: seq.duration, shot: shot, frames: seq.frames,
        audio: !!(seq.audio && ac && ac.state === "running"), audioEvents: seq.fired, frozen: !!seq.frozen
      };
    },
    getLastEnd: function () { return lastEnd; },
    audioState: function () { return ac ? { state: ac.state, gain: master ? +master.gain.value.toFixed(4) : null } : null; },
    /* Sólo para pruebas y capturas: coloca el reloj y lo congela o lo suelta. */
    debugSeek: function (t, freeze) {
      if (!seq) return false;
      seq.t = clamp(t, 0, seq.duration - 0.01); seq.frozen = !!freeze;
      while (seq.score && seq.cursor < seq.score.length && seq.score[seq.cursor].t < seq.t) seq.cursor++;
      if (seq.type === "intro" && seq.t < 28) seq.titleFired = false;
      paint(seq.t);
      return true;
    }
  });
})();
