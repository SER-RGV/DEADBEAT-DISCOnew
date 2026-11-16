/* ==========================================================================
   DEADBEAT DISCO — APERTURA DEL JUEGO (window.DD_OPENING)

   Dos secuencias a pantalla completa, pintadas en un lienzo propio:

     · playIntro(onDone)    «EL BUCLE» · prólogo en cinco actos · 42 s
     · playDescent(onDone)  el resto del descenso al Refugio

   Por qué un lienzo propio y no DD_CINE: DD_CINE avanza dentro del bucle del
   motor (con el paso limitado a 50 ms), así que en un equipo lento la imagen
   se retrasa respecto al sonido. Aquí el reloj es el de pared y cada sonido se
   programa contra ese mismo reloj. DD_CINE sigue siendo el dueño de las
   secuencias de partida (salas, jefes, derrota, victoria) y no se toca.

   Este módulo no arranca partidas, no entra al Refugio y no decide estados:
   sólo reproduce y avisa al terminar. DD_BOOT y DD_UI deciden qué viene después.

   ── EL BUCLE (reconstrucción cinematográfica) ──────────────────────────────
   El prólogo cuenta UNA idea: la Torre repite la misma noche y el Desafinado
   es la única cosa que no encaja. Se cuenta con imagen y sonido, no con
   párrafos. Canon: docs/LORE/BIBLIA_MAESTRA_UNIVERSO_v1.0.txt (§2, §3, §4,
   §5.3) y docs/RESTART/10_INTRO_COMIC_NARRACION.md.

     ACTO I   EL CICLO      0 – 12 s   la noche, la pista, el reloj y las nueve
                                       pistas: cuatro repeticiones del MISMO
                                       medio compás (el bucle se ve, no se explica)
     ACTO II  EL DESAFINADO 12 – 22 s  alguien rompe la secuencia: un paso que
                                       llega tarde, un reloj que se salta un
                                       segundo, los bailarines que se giran
     ACTO III LA CORRECCIÓN 22 – 31 s  la Torre intenta corregirlo: la música se
                                       atasca, la arquitectura se multiplica,
                                       las grietas avanzan, él se dobla pero no cede
     ACTO IV  EL DESCENSO   31 – 38 s  las grietas abren el suelo, rueda el
                                       sombrero y cae por el pozo (la intro NO
                                       llega al fondo: eso es de NUEVA PARTIDA)
     ACTO V   EL REFUGIO    38 – 42 s  el título sobre el pozo y el encuadre
                                       exacto del menú

   NUEVA PARTIDA retoma el descenso dentro del pozo y entrega el control al
   Refugio (DD_HUB.enter()). Ningún plano se repite entre la intro y el descenso.
   ========================================================================== */
(function () {
  "use strict";

  var BASE = "assets/cinematics/restart/opening/";
  var MASTER = "assets/cinematics/restart/character_master/";
  var FILES = {
    station: BASE + "mc_01_station.jpg",
    floor: BASE + "op_03_dancefloor.jpg",
    /* Multitud recortada de la propia lámina de la pista (tools/art_master/
       cinematic_crowd_layer.py): capa de paralaje para ver el bucle. */
    crowd: BASE + "op_03_crowd_layer.png",
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
     tiempos; la pintura, el sonido y las pruebas la leen de aquí.
     Cinco actos, siete planos, ninguno repetido y ninguno que llegue al fondo
     del pozo (eso es de NUEVA PARTIDA: playDescent). */
  var INTRO_DURATION = 42;
  var TITLE_AT = 38;
  var SHOTS = [
    { id: 1, from: 0, to: 3.5, name: "la noche" },          /* ACTO I   · la noche original */
    { id: 2, from: 3.5, to: 8.5, name: "la torre" },        /* ACTO I   · el bucle tiene forma de torre */
    { id: 3, from: 8.5, to: 14, name: "el bucle" },         /* ACTO I   · cuatro repeticiones en la pista */
    { id: 4, from: 14, to: 21, name: "el desafinado" },     /* ACTO II  · el paso fuera de compás */
    { id: 5, from: 21, to: 26, name: "los que miran" },     /* ACTO II  · la Torre lo detecta */
    { id: 6, from: 26, to: 31, name: "la correccion" },     /* ACTO III · el mundo se dobla */
    { id: 7, from: 31, to: 35.5, name: "el suelo" },        /* ACTO III → IV · grietas y caída */
    { id: 8, from: 35.5, to: 42, name: "el refugio" }       /* ACTO IV → V · pozo, título, menú */
  ];
  /* NUEVA PARTIDA: el resto de la caída, ya dentro del pozo. No repite grietas
     ni sombrero: aquellos planos pertenecen a la intro. */
  var DESCENT_DURATION = 4.6;
  var DESCENT_PHASES = [
    { id: 1, from: 0, to: 3.05, name: "pozo" },
    { id: 2, from: 3.05, to: 4.6, name: "llegada" }
  ];
  var BEAT = 0.5;

  /* Los cuatro tiempos del bucle del ACTO I: el mismo medio compás, cuatro veces.
     El cuarto llega roto (el paso fuera de tiempo). */
  var LOOP_BEATS = [8.5, 10.5, 12.5, 13.75];
  /* Pistas de la torre: alto de la lámina y las nueve plantas (fracción de la
     altura de la imagen donde arranca cada pista). */
  var NINE_H = 1706;
  var NINE_Y = [480, 590, 700, 810, 920, 1030, 1140, 1250, 1360];

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
    /* El deslizador MAESTRO de OPCIONES manda también sobre la intro y el descenso. */
    try {
      var mx = JSON.parse(localStorage.getItem("dmodisco_vol_v1") || "null");
      if (mx && isFinite(+mx.master)) vol *= Math.max(0, Math.min(1, +mx.master));
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
  /* `center` (opcional): imita object-fit: cover + object-position: 50% 50%,
     que es como el menú pinta la misma lámina. Sin él, el encuadre se recorta
     contra un borde para que nunca quede hueco (comportamiento de los planos). */
  function cover(im, fx, fy, zoom, alpha, dx, dy, center) {
    var m = { s: 1, x: 0, y: 0, w: W, h: H };
    if (!ok(im)) { fallback(); return m; }
    var s = Math.max(W / im.naturalWidth, H / im.naturalHeight) * (zoom || 1);
    var w = im.naturalWidth * s, h = im.naturalHeight * s;
    var x = W / 2 - w * fx, y = H / 2 - h * fy;
    if (center) { x = (W - w) / 2; y = (H - h) / 2; }
    else { x = clamp(x, W - w, 0); y = clamp(y, H - h, 0); }
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
  var SW = 0, SX = 0, U = 1, SY = 0, SH = 0;
  /* Escenario seguro de la pintura. En 16:9 ocupa el lienzo entero; en 4:3 y
     21:9 deja bandas a los lados. `SY`/`SH` son la parte alta y baja que no
     usa el cómic: el título del final sí puede apoyarse ahí, porque el menú
     real no tiene escenario y se mide en píxeles de ventana. */
  function stage() {
    SW = Math.min(W, H * 16 / 9 * 1.12); SX = (W - SW) / 2; U = Math.min(SW / 1920, H / 1080 * 1.12);
    var contentH = Math.min(H, W * 9 / 16 / 1.12);
    SY = (H - contentH) / 2; SH = contentH;
  }
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
  /* Barrido de tinta ENTRE dos planos. Se piensa como dos filos: el de ataque
     avanza con la primera mitad (la tinta cubre) y el de cola avanza con la
     segunda (la tinta se retira por el lado contrario). En p = 0,5 el encuadre
     está cubierto del todo, que es exactamente el corte. El filo es irregular y
     va ribeteado de magenta, así que se lee como un brochazo de tinta. */
  function inkWipe(p, seed, dir) {
    if (p <= 0 || p >= 1) return;
    var d = dir == null ? (rnd(seed) > 0.5 ? 1 : -1) : dir;
    var n = 16, i, y, wob;
    var lead = lerp(-0.08, 1.08, ease(clamp(p / 0.5, 0, 1)));
    var tail = lerp(-0.08, 1.08, ease(clamp((p - 0.5) / 0.5, 0, 1)));
    if (lead <= tail + 0.001) return;
    /* en "espacio de barrido": 0 = borde de entrada, 1 = borde de salida */
    var xa = (d > 0 ? tail : 1 - tail) * W;
    var xb = (d > 0 ? lead : 1 - lead) * W;
    var x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
    /* el filo que manda (el de ataque) lleva el ribete */
    var fx = (d > 0 ? lead : 1 - lead) * W;
    cx.save();
    cx.beginPath();
    cx.moveTo(x0, 0);
    for (i = 0; i <= n; i++) { y = H * i / n; wob = (rnd(seed + i * 3.1) - 0.5) * W * 0.085; cx.lineTo(x1 + wob, y); }
    for (i = n; i >= 0; i--) { y = H * i / n; wob = (rnd(seed + 90 + i * 4.7) - 0.5) * W * 0.07; cx.lineTo(x0 + wob, y); }
    cx.closePath();
    var g = cx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, "#07030d"); g.addColorStop(0.88, "#0b0416"); g.addColorStop(1, "rgba(11,4,22,0.98)");
    cx.fillStyle = g; cx.fill();
    if (lead < 1) {                                    /* ribete sólo mientras entra */
      cx.strokeStyle = "rgba(255,45,122,0.5)"; cx.lineWidth = Math.max(2, 5 * U);
      cx.beginPath();
      for (i = 0; i <= n; i++) { y = H * i / n; wob = (rnd(seed + i * 3.1) - 0.5) * W * 0.085; if (i === 0) cx.moveTo(fx + wob, y); else cx.lineTo(fx + wob, y); }
      cx.stroke();
      cx.globalAlpha = 0.9;
      for (i = 0; i < 6; i++) {
        var sy = H * rnd(seed + 60 + i), sr = (3 + 14 * rnd(seed + 70 + i)) * U;
        cx.fillStyle = i % 2 ? C.magenta : "#07030d";
        cx.beginPath(); cx.arc(fx + (d > 0 ? 1 : -1) * sr * (1 + 2 * rnd(seed + i)), sy, sr, 0, 7); cx.fill();
      }
    }
    cx.restore();
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
  /* Como `cover`, pero dentro de un rectángulo (para las ventanas de detalle).
     La imagen llena el rectángulo entero y se recorta a su alrededor. */
  function coverIn(im, x, y, w, h, fx, fy, zoom, dark) {
    if (!ok(im)) { cx.save(); cx.fillStyle = "#0b0416"; cx.fillRect(x, y, w, h); cx.restore(); return; }
    var sc = Math.max(w / im.naturalWidth, h / im.naturalHeight) * (zoom || 1);
    var dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
    var dx = x + w / 2 - dw * fx, dy = y + h / 2 - dh * fy;
    cx.save();
    cx.beginPath(); cx.rect(x, y, w, h); cx.clip();
    cx.drawImage(im, dx, dy, dw, dh);
    if (dark) { cx.globalAlpha = dark; cx.fillStyle = C.ink; cx.fillRect(x, y, w, h); }
    cx.restore();
  }
  function page(im, fx, fy, zoom, dx, dy, dark) {
    var m = cover(im, fx, fy, zoom, 1, dx, dy);
    if (dark) tint(C.ink, dark);
    halftone(0, 0, W, H, 0.13);
    return m;
  }
  function flash(t, t0, dur, color, a) { var st = settings(); if (st.flash && t >= t0 && t < t0 + dur) tint(color, a * (1 - (t - t0) / dur)); }

  /* ─────────────────────────── primitivas de dirección (EL BUCLE) ───────────
     Ninguna dibuja personajes nuevos: trabajan con las láminas aprobadas, la
     tipografía del proyecto y geometría de tinta. */

  /* Página con encuadre controlado: centro (fx, fy) y zoom. Devuelve el mapeo
     imagen → pantalla, que es lo que permite anclar cosas al arte (la esfera,
     el reloj, la multitud). */
  function mapX(m, fx) { return m.x + m.w * fx; }
  function mapY(m, fy) { return m.y + m.h * fy; }
  function mapS(m, im) { return m.w / im.naturalWidth; }

  /* Multitud en paralaje: se dibuja la capa recortada de la lámina aprobada con
     un desplazamiento propio, de modo que los bailarines se mueven respecto a la
     arquitectura. off/scale vienen en fracciones del encuadre. */
  function crowdLayer(m, off, sc, a) {
    if (!ok(img.crowd) || !ok(img.floor)) return;
    var iw = m.w * (sc || 1), ih = m.h * (sc || 1);
    var x = m.x - (iw - m.w) / 2 + (off || 0) * m.w;
    var y = m.y - (ih - m.h) / 2;
    cx.save();
    cx.globalAlpha = a == null ? 1 : a;
    /* La capa ya está alineada con la lámina: se dibuja a su misma escala. */
    cx.drawImage(img.crowd, x, y, iw, ih);
    cx.restore();
  }

  /* Reloj de aguja sobre el reloj dibujado en la lámina (op_03_dancefloor).
     No cambia el arte: superpone dos agujas de tinta que giran. Puede atascarse
     (stuck 0–1) y saltar un segundo (skip): el tiempo que no avanza. */
  function clockHands(m, im, fx, fy, r, ang, alpha, stuck, skip) {
    if (alpha <= 0) return;
    var px = mapX(m, fx), py = mapY(m, fy), pr = r * m.w;
    cx.save();
    cx.globalAlpha = alpha;
    cx.translate(px, py); cx.rotate(ang);
    cx.strokeStyle = C.ink; cx.lineCap = "round";
    cx.lineWidth = Math.max(2, pr * 0.16); cx.beginPath(); cx.moveTo(0, pr * 0.1); cx.lineTo(0, -pr * 0.62); cx.stroke();
    cx.restore();
    cx.save();
    cx.globalAlpha = alpha;
    cx.translate(px, py); cx.rotate(ang / 12);
    cx.strokeStyle = C.ink; cx.lineCap = "round";
    cx.lineWidth = Math.max(1.5, pr * 0.1); cx.beginPath(); cx.moveTo(0, pr * 0.08); cx.lineTo(0, -pr * 0.36); cx.stroke();
    cx.fillStyle = C.ink; cx.beginPath(); cx.arc(0, 0, Math.max(1.5, pr * 0.07), 0, 7); cx.fill();
    cx.restore();
    /* El segundo que la Torre se salta: un destello de tinta sobre la esfera. */
    if (skip > 0) {
      cx.save(); cx.globalAlpha = skip * 0.85; cx.fillStyle = C.bone;
      cx.beginPath(); cx.arc(px, py, pr * 0.9, -1.2, 1.2); cx.lineTo(px, py); cx.fill(); cx.restore();
    }
    if (stuck > 0) {
      cx.save(); cx.globalAlpha = stuck * 0.35; cx.strokeStyle = C.cyan; cx.lineWidth = Math.max(1.5, pr * 0.1);
      cx.beginPath(); cx.arc(px, py, pr * 1.05, 0, 7); cx.stroke(); cx.restore();
    }
  }

  /* Siluetas de la multitud: cuadros de la lámina recortados en negro puro y
     repetidos en tres copias al mismo compás. No es dibujo nuevo: son píxeles
     de las siluetas ya aprobadas, reducidos a tinta. */
  function edgeInk(a, wd) {
    if (a <= 0) return;
    var e = Math.max(18, H * (wd || 0.16));
    var g = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, "rgba(7,3,13,0)"); g.addColorStop(1, "rgba(7,3,13," + a + ")");
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    return e;
  }

  /* Máscara dura de banda: deja ver sólo una franja vertical de lo ya pintado.
     Se usa para el «mismo instante» repetido en el bucle. */
  function bandWindow(fy0, fy1) {
    var y0 = Y(fy0), y1 = Y(fy1);
    cx.save(); cx.globalCompositeOperation = "destination-in";
    cx.fillStyle = "#000"; cx.fillRect(0, 0, W, y0); cx.fillRect(0, y1, W, H - y1);
    cx.restore();
  }

  /* Barrido de luz de la esfera: abanico de rayos que giran despacio. */
  function ballRays(px, py, r, t, a, hue) {
    if (a <= 0) return;
    cx.save(); cx.globalCompositeOperation = "lighter"; cx.globalAlpha = a;
    for (var i = 0; i < 9; i++) {
      var ang = t * 0.42 + i * 0.7;
      var lg = cx.createLinearGradient(px, py, px + Math.cos(ang) * r, py + Math.sin(ang) * r);
      lg.addColorStop(0, hue); lg.addColorStop(1, "rgba(0,0,0,0)");
      cx.fillStyle = lg;
      cx.beginPath(); cx.moveTo(px, py);
      cx.lineTo(px + Math.cos(ang - 0.07) * r, py + Math.sin(ang - 0.07) * r);
      cx.lineTo(px + Math.cos(ang + 0.07) * r, py + Math.sin(ang + 0.07) * r);
      cx.closePath(); cx.fill();
    }
    cx.restore();
  }

  /* Polvo suspendido: motas deterministas que suben. Se apaga con movimiento
     reducido. */
  function motes(t, n, a, seed) {
    if (reduced || a <= 0) return;
    cx.save(); cx.globalAlpha = a;
    for (var i = 0; i < n; i++) {
      var x = W * rnd(seed + i * 3.1), v = 0.35 + rnd(seed + i * 7.3) * 1.1;
      var y = H * 1.05 - ((rnd(seed + i * 1.7) * H * 1.2 + t * H * v * 0.09) % (H * 1.2));
      var r = Math.max(0.8, (1 + 2.4 * rnd(seed + i * 5.5)) * U);
      cx.fillStyle = i % 5 === 0 ? C.magenta : (i % 5 === 1 ? C.cyan : "rgba(244,236,216,0.85)");
      cx.beginPath(); cx.arc(x + Math.sin(t * 0.8 + i) * 6 * U, y, r, 0, 7); cx.fill();
    }
    cx.restore();
  }

  /* ================================================================= INTRO */
  /* Caja del logotipo, medida sobre el menú real en 1280×720, 1920×1080,
     1024×768, 2560×1080 y 844×390 (work/tools/continuity.js). El CSS del menú
     usa `width: min(30vw, 50vh)` con `min-width: 200px` y el logotipo se queda
     en 330 px a partir de 1280 de ancho, así que hay que respetar el tope.
     x = 4vw (el padding de .dd-menu-left), y = 5vh. */
  function logoBox() {
    /* .dd-menu-left deja 4vw de margen y 5vh arriba; .dd-menu-brand mide
       min(30vw, 50vh) con un mínimo de 200 px; el logotipo es el 100 % de esa
       caja pero con tope de 330 px. El lema, en cambio, se centra en la caja
       de marca, NO en el logotipo: por eso su centro va más a la derecha. */
    /* Mismas medidas y MISMOS puntos de ruptura que `dd_rebuild_ui.css`
       (›#dd-main-menu.dd-rs .dd-menu-brand). Si allí cambian, aquí también. */
    var brand = Math.max(Math.min(W * 0.30, H * 0.50), 200);
    if (H <= 560) brand = Math.min(W * 0.26, H * 0.40);            /* @media (max-height: 560px) */
    else if (W / H <= 4 / 3 || W <= 900) brand = Math.min(W * 0.46, H * 0.34);
    var w = Math.min(brand, 330);
    var h = w * 682 / 1024;
    /* La caja de marca empieza a 5vh del borde de la VENTANA, no del escenario:
       si el escenario tiene banda arriba, el título sube con ella. */
    return { x: W * 0.04, y: H * 0.05, w: w, h: h, brandX: W * 0.04, brandW: brand, baseY: H * 0.05, tag: H > 560 };
  }

  function drawIntro(t) {
    var st = settings();
    stage();
    cx.fillStyle = C.ink; cx.fillRect(0, 0, W, H);
    if (t < 3.5) shotNight(t);
    else if (t < 8.5) shotTower(t, st);
    else if (t < 14) shotLoop(t, st);
    else if (t < 21) shotOffbeat(t, st);
    else if (t < 26) shotWatched(t, st);
    else if (t < 31) shotCorrection(t, st);
    else if (t < 35.5) shotCracks(t, st);
    else shotFall(t, st);
    /* Transiciones de tinta entre actos. Ninguna tapa un plano en curso. */
    inkWipe(seg(t, 13.86, 14.08), 3, 1);
    inkWipe(seg(t, 20.90, 21.12), 11, -1);
    inkWipe(seg(t, 30.90, 31.12), 17, 1);
    inkWipe(seg(t, 35.38, 35.62), 23, -1);
    if (t < 0.8) tint("#000", 1 - seg(t, 0.1, 0.8));
  }

  /* ─────────────────────────── ACTO I · EL CICLO ───────────────────────────
     01 · LA NOCHE (0–3,5) — la fiesta del final de la guerra, entera, en una
     viñeta que se abre. El mundo está quieto y ordenado: todavía no hay nadie
     fuera de sitio. */
  function shotNight(t) {
    var g = ease(seg(t, 2.2, 3.4));
    var push = ease(seg(t, 0, 3.5));
    var x = lerp(X(0.06), 0, g), y = lerp(Y(0.26), 0, g), w = lerp(SW * 0.88, W, g), h = lerp(H * 0.48, H, g);
    panel(img.station, [0, 0.12, 1, 0.95], x, y, w, h, { rot: lerp(-0.012, 0, g), zoom: lerp(1.0, 1.08, push) + g * g * 0.5, py: lerp(-0.04, 0.12, g), border: 1 - g, shadow: g < 0.5 });
    glow(x + w / 2, y + h * 0.62, h * 0.5, "rgba(250,204,21,0.5)", 0.10 + 0.10 * beatPulse(t));
    splat(X(0.09), Y(0.8), 58 * U * pop(t, 0.8) * (1 - g), C.magenta, 2, 1 - g);
    splat(X(0.93), Y(0.2), 44 * U * pop(t, 2.1) * (1 - g), C.cyan, 5, 1 - g);
    ballRays(x + w * 0.5, y + h * 0.2, h * 0.55, t, 0.10 * (1 - 0.6 * g) + 0.05, "rgba(255,45,122,0.9)");
    motes(t, 24, 0.5, 5);
    /* Los rótulos aprobados se encadenan, no se pisan: uno entra cuando el
       anterior ya ha salido. */
    caption(t, 0.75, 2.15, "LA GUERRA HABÍA TERMINADO.", 0.08, 0.16, 58, C.yellow, C.ink, -0.035);
    caption(t, 2.3, 3.45, "ESA NOCHE, ALGUNOS PUDIERON\nREUNIRSE SIN MIEDO.", 0.58, 0.70, 48, C.bone, C.ink, 0.02);
  }

  /* 02 · LA TORRE (3,5–8,5) — la fiesta se hundió y creció hacia abajo: nueve
     pistas, una debajo de otra. La cámara baja por el hueco como una aguja por
     el surco de un disco. Cada planta repite la misma escena (los bailarines
     olvidan; el edificio no). Al final, la cámara se abre y las nueve pistas se
     leen de golpe. */
  function shotTower(t, st) {
    var im = img.nine;
    var down = ease(seg(t, 3.6, 7.3));                     /* recorrido por las plantas */
    var out = ease(seg(t, 7.2, 8.4));                      /* apertura final: las nueve */
    /* 1. La torre ocupa el centro del cuadro y la cámara la recorre de arriba
          abajo. No es una miniatura: es el edificio entero, a sangre. */
    var pw = lerp(SW * 0.44, SW * 0.30, out), ph = lerp(H * 1.02, H * 0.92, out);
    var px0 = W / 2 - pw / 2 - lerp(0, SW * 0.10, out), py0 = H * 0.5 - ph * 0.5;
    var b = 11 * U;
    /* Fondo: la misma lámina ampliada y oscurecida (paralaje de profundidad). */
    if (ok(im)) {
      var bgz = 1.7 + down * 0.12;
      cx.save(); cx.globalAlpha = 0.55; cover(im, 0.5, lerp(0.16, 0.78, down), bgz); cx.restore();
      tint(C.ink, 0.76);
    }
    cx.fillStyle = "rgba(0,0,0,0.6)"; cx.fillRect(px0 - b + 14 * U, py0 - b + 16 * U, pw + 2 * b, ph + 2 * b);
    cx.fillStyle = C.bone; cx.fillRect(px0 - b - 2.5 * U, py0 - b - 2.5 * U, pw + 2 * b + 5 * U, ph + 2 * b + 5 * U);
    cx.fillStyle = C.ink; cx.fillRect(px0 - b, py0 - b, pw + 2 * b, ph + 2 * b);
    /* El encuadre de la lámina: primero una planta, luego las nueve. */
    var sc = lerp(pw / 768 * 1.9, ph / NINE_H, out), iw = 768 * sc, ih = NINE_H * sc;
    var cyImg = lerp(lerp(0.10, 0.84, down), 0.5, out);
    var ix = px0 + pw / 2 - iw / 2;
    var iy = clamp(py0 + ph / 2 - ih * cyImg, py0 + ph - ih, py0);
    cx.save(); cx.beginPath(); cx.rect(px0, py0, pw, ph); cx.clip();
    if (ok(im)) cx.drawImage(im, ix, iy, iw, ih); else fallback();
    halftone(px0, py0, pw, ph, 0.18);
    /* Las nueve marcas: una por pista, cayendo al compás, numeradas. */
    for (var i = 0; i < 9; i++) {
      var ti = 3.9 + i * 0.34, k = pop(t, ti, 0.16);
      if (k <= 0) continue;
      var fy = iy + (NINE_Y[i] + 55) * sc, pulse = 1 + 0.45 * Math.max(0, 1 - (t - ti) * 4);
      cx.save();
      cx.fillStyle = i === 8 ? C.magenta : C.yellow;
      cx.strokeStyle = C.ink; cx.lineWidth = Math.max(2, 3 * U);
      var mw = pw * 0.085 * k * pulse, mh = 110 * sc * 0.4 * pulse;
      cx.beginPath(); cx.moveTo(ix + iw * 0.03, fy - mh / 2); cx.lineTo(ix + iw * 0.03 + mw, fy - mh * 0.3);
      cx.lineTo(ix + iw * 0.03 + mw * 0.9, fy + mh / 2); cx.lineTo(ix + iw * 0.03, fy + mh * 0.4); cx.closePath();
      cx.fill(); cx.stroke();
      cx.restore();
      /* Número de la pista, junto a su marca. */
      var rn = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
      cx.save(); cx.globalAlpha = 0.9 * k; cx.fillStyle = i === 8 ? C.bone : C.bone;
      cx.font = "italic 700 " + Math.max(9, 12 * U) + "px " + FONT_CAP;
      cx.textAlign = "left"; cx.textBaseline = "middle";
      cx.fillText(rn[i], ix + iw * 0.03 + mw + 5 * U, fy); cx.restore();
    }
    cx.restore();
    /* La línea de luz marca la planta por la que va la cámara (se ve bajar). */
    var hl = iy + lerp(560, 1410, down) * sc;
    if (out < 0.55) {
      cx.save(); cx.globalAlpha = 0.5 * (1 - out); cx.fillStyle = C.cyan;
      cx.fillRect(px0, hl, pw, Math.max(1.5, 2.5 * U)); cx.restore();
    }
    /* 2. Viñetas de detalle enganchadas a tres plantas: el mismo baile, otra
          pista. Se enlazan con un trazo a la planta correspondiente. */
    var det = [[4.5, 0, 0.055, 0.155, -1], [5.3, 3, 0.735, 0.20, 1], [6.1, 6, 0.06, 0.60, -1]];
    for (var d = 0; d < det.length; d++) {
      var D = det[d], y0 = NINE_Y[D[1]] / NINE_H, w2 = 0.24, h2 = 0.13;
      slidePanel(t, D[0], 8.5, im, [0.12, y0, 0.88, y0 + 110 / NINE_H], D[2], D[3], w2, h2, D[4] * 0.05, D[4] * 0.4, 0, { zoom: 1.0 });
      var lk = pop(t, D[0] + 0.2, 0.2) * (1 - seg(t, 8.5, 8.8));
      if (lk > 0) {
        var ax = D[4] < 0 ? X(D[2] + w2) + 11 * U : X(D[2]) - 11 * U, ay = Y(D[3] + h2 / 2);
        var bx = D[4] < 0 ? px0 : px0 + pw, by = iy + (NINE_Y[D[1]] + 55) * sc;
        cx.save(); cx.globalAlpha = lk; cx.strokeStyle = C.ink; cx.lineWidth = 9 * U;
        cx.beginPath(); cx.moveTo(ax, ay); cx.lineTo(lerp(ax, bx, lk), lerp(ay, clamp(by, py0, py0 + ph), lk)); cx.stroke();
        cx.strokeStyle = C.yellow; cx.lineWidth = 4 * U; cx.stroke(); cx.restore();
      }
    }
    motes(t, 18, 0.4, 12);
    caption(t, 3.6, 5.3, "PERO LA NOCHE NO TERMINÓ.", 0.04, 0.06, 54, C.yellow, C.ink, -0.03);
    caption(t, 5.6, 7.0, "EL SALÓN CRECIÓ HACIA ABAJO.\nCOMO UN SURCO EN UN DISCO.", 0.60, 0.05, 42, C.bone, C.ink, 0.02);
    caption(t, 7.2, 8.45, "NUEVE PISTAS.\nUNA DEBAJO DE OTRA.", 0.63, 0.78, 52, C.magenta, C.bone, -0.02);
    sfxWord(t, 8.05, 8.5, "FSSSH", 0.30, 0.90, 96, C.cyan, 0.08);
    flash(t, 3.5, 0.14, "#fff", 0.35);
  }

  /* 03 · EL BUCLE (8,5–14) — el corazón del prólogo.
     Cuatro repeticiones del MISMO medio compás, con el MISMO encuadre, el MISMO
     golpe y las MISMAS siluetas. La cuarta no llega: el reloj se salta un
     segundo, la música se atasca y la grieta aparece.

     Textos (uno por repetición, para que el bucle se LEA):
       1. «LAS PUERTAS YA NO LLEVAN FUERA.»    (§2.3)
       2. «EL TIEMPO SE PLEGÓ SOBRE SÍ MISMO.» (§2.3)
       3. «TODOS BAILAN. NADIE RECUERDA DESDE CUÁNDO.» (§3.2)
       4. «LA ÚLTIMA NOTA VUELVE ANTES DE TERMINAR.» (§3.1) ← aquí se rompe */
  function shotLoop(t, st) {
    var i = 0;
    while (i < LOOP_BEATS.length - 1 && t >= LOOP_BEATS[i + 1]) i++;
    var t0 = LOOP_BEATS[i], rep = i + 1;
    var u = t - t0;
    var last = rep === 4;
    var norm = last ? 1.25 : 2.0;                          /* la cuarta es más corta: se rompe */
    var frozen = last ? clamp((u - 0.95) / 0.5, 0, 1) : 0;
    var local = last ? Math.min(u, 0.95) : u;
    var beat = (local * 2) % 1;
    var kick = Math.exp(-beat * 5.5);

    /* Encuadre repetido: dentro de cada vuelta la cámara empuja un 6 % y vuelve
       a empezar. La cuarta se queda congelada en el empuje (la cámara ya no
       puede volver a empezar). */
    var prog = ease(local / norm);
    var zoom = 1.07 + 0.06 * prog + (st.shake ? 0.004 * kick : 0) + frozen * 0.02;
    if (reduced) zoom = 1.09;
    var m = page(img.floor, 0.5, 0.46, zoom, 0, frozen * -H * 0.004, 0.07 + 0.05 * kick);

    /* ── MONTAJE DE LA REPETICIÓN ─────────────────────────────────────────────
       Cada vuelta repite el encuadre general, pero entra por una ventana de
       detalle DISTINTA: el reloj, las manos, el plato. Son los mismos tres
       gestos siempre, en el mismo orden, con el mismo tamaño. Que se repitan es
       la información: el jugador ve que el mundo está atrapado. En la cuarta
       vuelta la ventana se congela con el resto.
       Las esquinas salen del reparto 0/1/2 → no cambia entre vueltas. */
    if (!reduced) {
      var winPos = [[0.055, 0.085], [0.735, 0.115], [0.075, 0.615]][i % 3];
      var wIn = last ? (1 - frozen * 0.85) : ease(seg(u, 0.08, 0.34));
      if (wIn > 0.02) {
        var ww = SW * 0.235 * wIn, wh = H * 0.30 * wIn;
        var wx = X(winPos[0]) + (1 - wIn) * -14 * U, wy = Y(winPos[1]) + (1 - wIn) * 26 * U;
        var detail = [img.floor, img.hand, img.vinyl][i % 3];
        cx.save();
        cx.beginPath(); cx.rect(wx, wy, ww, wh); cx.clip();
        /* el detalle se pinta DENTRO de la ventana: mismo gesto, mismo tamaño,
           en el mismo sitio, cada vuelta */
        coverIn(detail, wx, wy, ww, wh, 0.5, 0.5, (i % 3 === 0 ? 2.4 : 1.06) + prog * 0.05, 0.12);
        cx.restore();
        cx.save();
        cx.strokeStyle = C.ink; cx.lineWidth = Math.max(4, 9 * U);
        cx.strokeRect(wx, wy, ww, wh);
        cx.strokeStyle = last ? C.magenta : C.bone; cx.lineWidth = Math.max(1.5, 3 * U);
        cx.strokeRect(wx, wy, ww, wh);
        cx.restore();
      }
    }

    /* La multitud, en paralaje: en cada vuelta vuelve a su posición de salida. */
    var off = reduced ? 0 : Math.sin(local * 1.7) * 0.006 - prog * 0.008;
    crowdLayer(m, off, 1 + 0.03 * prog, 1);

    /* Esfera: el mismo abanico de luz, girando al mismo ritmo cada vuelta. */
    var ballX = mapX(m, 0.494), ballY = mapY(m, 0.115), ballR = m.w * 0.5;
    ballRays(ballX, ballY, ballR, (i % 2) * 0.9 + local * 0.85, 0.15 + 0.08 * kick, "rgba(255,45,122,0.85)");
    glow(ballX, ballY, m.w * 0.16, "rgba(255,120,200,0.9)", 0.14 + 0.12 * kick);

    /* El reloj: las agujas DE VERDAD no avanzan. Dan un tirón, vuelven atrás y
       repiten el mismo cuarto de vuelta en cada repetición. En la cuarta, se
       saltan un segundo (destello) y se quedan clavadas. */
    var ang = -Math.PI / 2 + 0.42 + ease(local / norm) * 0.30;
    if (!last && u > norm - 0.12) ang -= ease((u - (norm - 0.12)) / 0.12) * 0.30;   /* vuelve al inicio */
    if (last) ang = -Math.PI / 2 + 0.42 + ease(clamp(local / 0.95, 0, 1)) * 0.30 - frozen * 0.55;
    var skipFlash = last ? Math.max(0, 1 - Math.abs(u - 1.05) * 6) : 0;
    clockHands(m, img.floor, 0.4988, 0.4240, 0.039, ang, 0.92, last ? frozen : 0, skipFlash);

    /* Reinicio: un latido de tinta y todo vuelve a su sitio. */
    if (!last && u < 0.12) tint(C.ink, 0.5 * (1 - u / 0.12));
    flash(t, t0, 0.09, "#fff", 0.22);

    /* Copias fantasma de la multitud: el mismo gesto, tres veces, cada vez más
       lejos. Se ven a partir de la segunda vuelta. */
    if (rep >= 2 && !reduced && ok(img.crowd)) {
      for (var g2 = 3; g2 >= 1; g2--) {
        var a2 = (0.055 * rep - g2 * 0.014) * (1 - frozen * 0.8);
        if (a2 <= 0) continue;
        cx.save(); cx.globalAlpha = a2;
        var k2 = 1 + g2 * 0.03;
        cx.drawImage(img.crowd, m.x - (m.w * k2 - m.w) / 2, m.y - (m.h * k2 - m.h) / 2, m.w * k2, m.h * k2);
        cx.restore();
      }
    }

    /* Marcas de las nueve pistas + números romanos (se cuentan solas). */
    var rn = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
    for (var k = 0; k < 9; k++) {
      var tk = t0 + 0.10 + k * 0.055, kk = pop(t, tk, 0.14);
      if (kk <= 0) continue;
      var gx = X(0.055), gy = Y(0.285 + k * 0.058), gw = 0.024 * SW * kk;
      cx.save(); cx.globalAlpha = 0.9;
      cx.fillStyle = last ? C.magenta : C.yellow;
      cx.strokeStyle = C.ink; cx.lineWidth = Math.max(2, 3 * U);
      cx.beginPath(); cx.moveTo(gx, gy - gw * 0.4); cx.lineTo(gx + gw, gy - gw * 0.12);
      cx.lineTo(gx + gw * 0.86, gy + gw * 0.4); cx.lineTo(gx, gy + gw * 0.26); cx.closePath();
      cx.fill(); cx.stroke();
      cx.restore();
      if (rep >= 2) {
        cx.save(); cx.globalAlpha = 0.8 * kk; cx.fillStyle = C.bone;
        cx.font = "italic 700 " + Math.max(9, 12 * U) + "px " + FONT_CAP;
        cx.textAlign = "left"; cx.textBaseline = "middle";
        cx.fillText(rn[k], X(0.088), gy); cx.restore();
      }
    }

    /* Cartela de cada repetición. */
    if (rep === 1) { caption(t, 8.55, 10.3, "LAS PUERTAS YA NO LLEVAN FUERA.", 0.52, 0.845, 50, C.bone, C.ink, 0.02); sfxWord(t, 8.52, 9.0, "TUM", 0.5, 0.145, 88, C.bone, -0.04); }
    if (rep === 2) { caption(t, 10.55, 12.3, "EL TIEMPO SE PLEGÓ SOBRE SÍ MISMO.", 0.44, 0.845, 48, C.magenta, C.bone, -0.02); sfxWord(t, 10.52, 11.0, "TUM", 0.5, 0.145, 88, C.bone, -0.04); }
    if (rep === 3) { caption(t, 12.55, 14.0, "TODOS BAILAN.\nNADIE RECUERDA DESDE CUÁNDO.", 0.42, 0.80, 48, C.bone, C.ink, 0.025); sfxWord(t, 12.52, 13.0, "TUM", 0.5, 0.145, 88, C.bone, -0.04); }
    if (rep === 4) {
      caption(t, 13.7, 14.0, "LA ÚLTIMA NOTA VUELVE\nANTES DE TERMINAR.", 0.46 + frozen * 0.01, 0.76, 50, C.yellow, C.ink, -0.03 + frozen * 0.03);
      if (frozen > 0.4) caption(t, 13.7 + frozen * 0.08, 14.0, "LA ÚLTIMA NOTA VUELVE\nANTES DE TERMINAR.", 0.472 + frozen * 0.012, 0.766, 50, C.magenta, C.bone, -0.03 + frozen * 0.03);
      sfxWord(t, 13.75, 14.05, "CLAC", 0.24, 0.40, 150, C.yellow, -0.17);
      sfxWord(t, 13.9, 14.05, "TUM-TUM", 0.76, 0.34, 112, C.magenta, 0.1);
    }

    /* La grieta de la cuarta vuelta: empieza aquí y no parará hasta el acto IV. */
    crack([[0.50, 0.30], [0.485, 0.45], [0.515, 0.58], [0.492, 0.72], [0.505, 0.9]], seg(t, 13.9, 14.1), 7);
    if (st.shake && last) {
      var sk = shakeOf(t, 13.75, 0.35, 6);
      cx.save(); cx.globalAlpha = 0.1 * frozen; cx.fillStyle = C.cyan; cx.fillRect(sk[0], H * 0.4, W, 3 * U); cx.restore();
    }
    flash(t, 13.75, 0.12, "#fff", 0.4);
    motes(t, 26, 0.45, 9 + i);
  }

  /* ────────────────────────── ACTO II · EL DESAFINADO ───────────────────────
     04 · EL DESAFINADO (14–21) — el mundo sigue girando y alguien llega cuando
     la música ya ha pasado de largo. Las botas son el bombo: tres pisadas a
     compás y la cuarta tarde; la música se corta en seco. Después entra él, y
     la página entera se desalinea a su paso. */
  function shotOffbeat(t, st) {
    /* La página de las botas nunca se queda quieta: empuje continuo y un
       balanceo de cámara que crece hasta el paso tardío. */
    var pushO = seg(t, 14, 21);
    /* balanceo de cámara al ritmo de la música: la página de las botas respira
       con el compás en vez de deslizarse rígida. */
    var bobO = beatPulse(t) * 5 * U;
    /* una tercera componente lenta, sin periodo común con el compás, para que
       nunca coincidan dos fotogramas iguales */
    var slowO = Math.sin(t * 0.37) * 9 * U;
    page(img.boots, 0.55, 0.6, 1.06 + pushO * 0.16 + Math.sin(t * 0.29) * 0.004,
      Math.sin(t * 1.3) * 7 * U + slowO, Math.cos(t * 1.1) * 5 * U - bobO, 0.5);
    var steps = [14.6, 15.1, 15.6, 16.1];                  /* cuatro pasos; el cuarto tarde */
    /* Tres pasos en compás y el cuarto TARDE. El cuarto no se queda quieto: abre
       un pulso de tinta sobre la pista y el mundo se descuadra un instante —
       es la primera consecuencia visible de que él va por libre. */
    for (var i = 0; i < steps.length; i++) {
      var p = pop(t, steps[i], 0.13);
      if (p <= 0) continue;
      var px = X(0.20 + i * 0.145) + (i === 3 ? 0.02 * SW : 0), py = Y(0.74 - i * 0.012);
      splat(px, py, (i === 3 ? 58 : 42) * U * p, i === 3 ? C.magenta : C.yellow, 20 + i, 0.95);
      if (i === 3) { sfxWord(t, 16.1, 16.8, "TAC", 0.46, 0.30, 152, C.yellow, -0.2); flash(t, 16.1, 0.12, "#fff", 0.55); }
    }
    if (t >= 16.1 && t < 17.6) {
      var late = seg(t, 16.1, 17.4);
      /* el golpe se propaga por el damero en anillos que se suceden */
      for (var ri = 0; ri < 3; ri++) {
        var rp = clamp((late - ri * 0.11) / 0.62, 0, 1);
        if (rp <= 0 || rp >= 1) continue;
        cx.save(); cx.globalAlpha = 0.55 * (1 - rp);
        cx.strokeStyle = ri === 0 ? C.yellow : C.magenta; cx.lineWidth = Math.max(2, 4 * U * (1 - rp));
        cx.beginPath(); cx.ellipse(X(0.62), Y(0.78), SW * 0.10 * rp + 6, H * 0.035 * rp + 4, 0, 0, Math.PI * 2); cx.stroke();
        cx.restore();
      }
      /* y la pista se descuadra: las losas se separan en diagonal */
      if (!reduced) {
        var skew = Math.sin(late * Math.PI) * W * 0.012;
        cx.save(); cx.globalAlpha = 0.5 * Math.sin(late * Math.PI);
        cx.strokeStyle = C.cyan; cx.lineWidth = Math.max(1.5, 2.5 * U);
        for (var sv = 0; sv < 5; sv++) {
          cx.beginPath();
          cx.moveTo(X(0.30 + sv * 0.12) + skew, Y(0.80));
          cx.lineTo(X(0.30 + sv * 0.12) - skew, Y(0.96));
          cx.stroke();
        }
        cx.restore();
      }
    }
    slidePanel(t, 14.1, 0, img.boots, [0.25, 0.05, 1, 1], 0.035, 0.09, 0.4, 0.4, -0.05, -0.5, 0, { py: 0, zoom: 1.02, px: 0 });
    caption(t, 14.3, 16.55, "UNO NO SIGUE EL COMPÁS.", 0.04, 0.035, 56, C.yellow, C.ink, -0.03);

    /* A los 18,2 s entra la lámina maestra: el protagonista, de frente, y detrás
       el mundo que se dobla a su alrededor. */
    if (t >= 18.2) {
      var q = pop(t, 18.2, 0.3), w = SW * 0.5 + (W - SW) / 2 + 20 * U, x = W - w + (1 - q) * w;
      panel(img.master, [0.385, 0.0, 1.0, 0.86], x, -12 * U, w, H + 24 * U, { zoom: 1 + seg(t, 18.2, 21) * 0.07, py: -0.5 });
      if (!reduced) {
        cx.save(); cx.globalCompositeOperation = "lighter"; cx.globalAlpha = 0.13 * seg(t, 18.8, 19.4) * (0.5 + 0.5 * Math.sin(t * 27));
        cx.fillStyle = C.cyan; cx.fillRect(x, H * (0.2 + 0.6 * rnd(Math.floor(t * 13))), w, 5 * U); cx.restore();
      }
    }
    slidePanel(t, 19.2, 0, img.marm, [0, 0.02, 1, 0.98], 0.07, 0.53, 0.165, 0.4, 0.06, -0.3, 0.3, { zoom: 1 + seg(t, 19.2, 21) * 0.06 });
    slidePanel(t, 19.7, 0, img.mface, [0.22, 0.05, 1, 0.95], 0.26, 0.57, 0.22, 0.3, -0.06, -0.3, 0.3, { zoom: 1.02 });
    caption(t, 19.0, 20.95, "A ÉL, LA TORRE LE DUELE.", 0.50, 0.885, 58, C.magenta, C.bone, -0.03);
    motes(t, 20, 0.35, 21);
  }

  /* 05 · LOS QUE MIRAN (21–26) — la Torre lo detecta. Los invitados se giran a
     la vez y sus ojos se encienden; el reloj se para de golpe; las puertas dan
     a la misma pista (no hay salida) y el vaso cae al mismo compás. */
  function shotWatched(t, st) {
    var sh = shakeOf(t, 21, 0.4, 16), bp = st.shake ? beatPulse(t) * 5 * U : 0;
    var z = lerp(1.30, 1.05, easeOut(seg(t, 21, 21.6))) + seg(t, 21, 26) * 0.08;
    var m = page(img.doors, 0.5, 0.42, z, sh[0], sh[1] + bp, 0.1);
    tint(C.magenta, 0.05 + 0.10 * beatPulse(t));

    var eyes = [[0.055, 0.40], [0.115, 0.42], [0.20, 0.40], [0.295, 0.41],
                [0.70, 0.40], [0.80, 0.41], [0.885, 0.40], [0.945, 0.43]];
    var turn = ease(seg(t, 21.35, 22.2));
    for (var i = 0; i < eyes.length; i++) {
      var ex = mapX(m, eyes[i][0]), ey = mapY(m, eyes[i][1]);
      var fl = 0.55 + 0.45 * Math.sin(t * 7 + i * 1.3);
      glow(ex, ey, m.w * 0.026, i % 2 ? "rgba(250,204,21,0.95)" : "rgba(34,211,238,0.95)", turn * 0.9 * fl);
    }
    var stopped = seg(t, 22, 22.4);
    clockHands(m, img.doors, 0.5143, 0.2108, 0.030, -Math.PI / 2 + 0.9 + seg(t, 21, 22) * 0.28, 0.92, stopped, 0);

    slidePanel(t, 22.0, 25.7, img.vinyl, [0.3, 0.1, 1, 0.9], 0.035, 0.55, 0.31, 0.39, -0.085, -0.5, 0.2, { px: Math.sin(t * 6) * 0.004 });
    slidePanel(t, 22.5, 25.75, img.smiles, [0, 0.05, 1, 0.75], 0.63, 0.07, 0.335, 0.36, 0.07, 0.5, -0.2, { zoom: 1 + seg(t, 22.5, 26) * 0.12 });
    slidePanel(t, 23.2, 25.8, img.hand, [0, 0, 1, 1], 0.67, 0.53, 0.285, 0.37, -0.05, 0.5, 0.2, { zoom: 1.04 });

    var cp = seg(t, 21.2, 25.2);
    cp = Math.floor(cp * 7) / 7 + (cp * 7 % 1 > 0.7 ? 1 / 7 : 0);
    crack([[0.525, -0.02], [0.5, 0.16], [0.54, 0.3], [0.485, 0.48], [0.52, 0.65], [0.47, 0.82], [0.5, 1.02]], Math.min(1, cp), 9);
    crack([[0.485, 0.48], [0.4, 0.52], [0.34, 0.49]], seg(t, 22.2, 22.6), 6);
    crack([[0.52, 0.65], [0.6, 0.68], [0.67, 0.65]], seg(t, 22.9, 23.3), 6);

    caption(t, 21.3, 22.9, "TODOS GIRAN LA CARA A LA VEZ.", 0.04, 0.055, 52, C.bone, C.ink, -0.03);
    caption(t, 23.6, 25.0, "NADIE RECUERDA CUÁNDO\nDEJÓ DE MIRARLO A ÉL.", 0.36, 0.81, 48, C.magenta, C.bone, -0.025);
    sfxWord(t, 22.0, 23.2, "CLAC", 0.27, 0.5, 160, C.yellow, -0.17);
    sfxWord(t, 24.2, 25.3, "TUM-TUM", 0.79, 0.47, 112, C.magenta, 0.1);
    flash(t, 21, 0.18, "#fff", 0.7); flash(t, 22.0, 0.1, "#fff", 0.45);
    motes(t, 16, 0.3, 33);
  }

  /* ─────────────────────── ACTO III · LA CORRECCIÓN ─────────────────────────
     06 · LA CORRECCIÓN (26–31) — la Torre intenta corregirlo: la misma página
     se repite en bandas, la arquitectura se multiplica y las grietas se
     ramifican. Él se dobla, no se deforma y no cede. */
  function shotCorrection(t, st) {
    var sh = shakeOf(t, 26, 1.4, 14), bp = st.shake ? beatPulse(t * 1.7) * 7 * U : 0;
    var z = 1.12 + seg(t, 26, 31) * 0.1;
    page(img.doors, 0.5, 0.42, z, sh[0] + bp, sh[1] * 0.6, 0.14);

    if (!reduced) {
      for (var b = 0; b < 3; b++) {
        var a = 0.19 - b * 0.05;
        if (a <= 0) continue;
        var fy0 = 0.30 + b * 0.055, fy1 = fy0 + 0.09;
        var dy = Math.sin(t * 3.1 + b * 1.9) * H * 0.006 * (b + 1) + (1 - seg(t, 26.2, 26.9)) * H * 0.05 * (b + 1);
        cx.save();
        cx.beginPath(); cx.rect(0, Y(fy0) + dy, W, (fy1 - fy0) * H); cx.clip();
        cx.globalAlpha = a;
        page(img.doors, 0.5, 0.42, z * (1.02 + b * 0.01), sh[0] + 26 * U * (b + 1), 0, 0);
        cx.restore();
      }
    }
    tint(C.magenta, 0.06 + 0.10 * beatPulse(t * 1.7));
    edgeInk(0.5 + 0.25 * seg(t, 26, 31), 0.14);

    crack([[0.06, 0.98], [0.18, 0.92], [0.3, 0.95], [0.42, 0.88], [0.5, 0.9]], seg(t, 26.1, 28.4), 7);
    crack([[0.94, 0.97], [0.84, 0.9], [0.72, 0.93], [0.62, 0.86], [0.52, 0.89]], seg(t, 26.6, 29.2), 7);
    crack([[0.5, 0.9], [0.56, 0.78], [0.5, 0.68], [0.58, 0.6], [0.52, 0.5]], seg(t, 27.2, 29.8), 9);

    if (t >= 27.4) {
      var p = pop(t, 27.4, 0.24), pain = (t > 28.4 && !reduced) ? Math.sin(t * 47) * 2.4 * U * seg(t, 28.4, 29) : 0;
      var w = SW * 0.46 + (W - SW) / 2 + 20 * U, x = W - w - (1 - p) * w * 0.4;
      panel(img.master, [0.42, 0.0, 1.0, 0.9], x + pain, -14 * U, w, H + 26 * U, { zoom: 1 + seg(t, 27.4, 31) * 0.08, py: -0.5 });
      if (!reduced) {
        cx.save(); cx.globalAlpha = 0.5 * seg(t, 28.0, 28.6);
        cx.strokeStyle = C.cyan; cx.lineWidth = Math.max(1, 2 * U);
        for (var l = 0; l < 6; l++) {
          var ly = Y(0.2 + l * 0.11), ph2 = Math.sin(t * 6 + l) * 0.5 + 0.5;
          cx.beginPath(); cx.moveTo(x - W * 0.03 * ph2, ly); cx.lineTo(x - W * 0.12 * ph2, ly + 8 * U); cx.stroke();
        }
        cx.restore();
      }
    }
    slidePanel(t, 28.6, 0, img.mface, [0.22, 0.05, 1, 0.95], 0.06, 0.62, 0.19, 0.26, -0.055, -0.3, 0.3, { zoom: 1.03 });
    caption(t, 26.5, 28.2, "LA TORRE INTENTA CORREGIRLO.", 0.035, 0.045, 54, C.yellow, C.ink, -0.03);
    caption(t, 28.8, 30.4, "ÉL NO CEDE.", 0.60, 0.90, 60, C.magenta, C.bone, -0.03);
    sfxWord(t, 27.2, 28.6, "CRRRJ", 0.28, 0.68, 140, C.cyan, 0.12);
    flash(t, 26, 0.16, "#fff", 0.55); flash(t, 28.5, 0.12, C.magenta, 0.3);
    motes(t, 22, 0.4, 44);
  }

  /* 07 · EL SUELO (31–35,5) — las grietas se encuentran en el centro de la
     pista. La lámina se abre de verdad: el mundo se parte y aparece el pozo. */
  function shotCracks(t, st) {
    if (t < 32.6) {
      /* ── el suelo se rompe EN PANTALLA ────────────────────────────────────
         Tres fases encadenadas, no un zoom: (1) el damero se agrieta y las
         grietas se ramifican, (2) la losa se hunde por sectores —cada uno cae
         con su propio retardo—, (3) por los huecos se ve el foso, cada vez más. */
      var sh = shakeOf(t, 31, 0.8, 20), sh2 = shakeOf(t, 32, 0.5, 26);
      var push = 1.12 + seg(t, 31, 32.6) * 0.12;
      page(img.boots, 0.6, 0.62, push, sh[0] + sh2[0], sh[1] + sh2[1], 0.08);

      /* (1) grietas que se abren paso desde el centro de la pista */
      var boom = Math.exp(-(t - 31) * 1.4);
      var g = cx.createLinearGradient(0, H, 0, H * 0.4);
      g.addColorStop(0, "rgba(255,45,122," + (0.6 * boom) + ")"); g.addColorStop(1, "rgba(255,45,122,0)");
      cx.save(); cx.globalCompositeOperation = "lighter"; cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore();
      crack([[0.56, 1.02], [0.6, 0.86], [0.52, 0.76], [0.6, 0.66], [0.5, 0.58], [0.38, 0.62], [0.26, 0.55]], seg(t, 31.15, 32.1), 10);
      crack([[0.6, 0.86], [0.74, 0.82], [0.86, 0.88], [1.0, 0.8]], seg(t, 31.5, 32.2), 8);
      crack([[0.52, 0.76], [0.4, 0.84], [0.3, 0.8], [0.14, 0.9]], seg(t, 31.7, 32.4), 8);
      crack([[0.5, 0.58], [0.44, 0.44], [0.5, 0.34], [0.42, 0.24]], seg(t, 31.9, 32.5), 7);

      /* (2) la losa se hunde por sectores: cada trozo cae con su retardo y deja
             ver el foso por el hueco. El agujero crece desde el centro. */
      var hole = ease(seg(t, 31.85, 32.6));
      if (hole > 0) {
        var hx = W * 0.53, hy = H * 0.60;
        cx.save();
        cx.beginPath();
        /* contorno irregular: no es un círculo, es un desgarrón */
        for (var a = 0; a <= 26; a++) {
          var ang = (a / 26) * Math.PI * 2;
          var rr = 1 + (rnd(a * 4.1) - 0.5) * 0.26;
          var rx = (W * 0.30 * hole + 4) * rr, ry = (H * 0.20 * hole + 3) * rr;
          var pxA = hx + Math.cos(ang) * rx, pyA = hy + Math.sin(ang) * ry * 0.86;
          if (a === 0) cx.moveTo(pxA, pyA); else cx.lineTo(pxA, pyA);
        }
        cx.closePath();
        /* dentro del hueco: el foso, oscuro, con sus luces subiendo */
        var hg = cx.createLinearGradient(0, hy - H * 0.2, 0, hy + H * 0.25);
        hg.addColorStop(0, "#05020a"); hg.addColorStop(0.6, "#120726"); hg.addColorStop(1, "#2a1040");
        cx.fillStyle = hg; cx.fill();
        cx.save(); cx.clip();
        for (var lz = 0; lz < 7; lz++) {
          var lv = ((t * 0.55 + rnd(lz * 3.7)) % 1);
          cx.globalAlpha = 0.5 * (1 - lv);
          cx.fillStyle = lz % 3 === 0 ? C.magenta : (lz % 3 === 1 ? C.cyan : C.yellow);
          cx.fillRect(hx - W * 0.2 + rnd(lz * 1.3) * W * 0.4, hy + H * 0.2 - lv * H * 0.42, Math.max(2, 3 * U), H * 0.12);
        }
        cx.restore();
        /* filo del desgarrón: tinta gruesa y un ribete encendido */
        cx.strokeStyle = C.ink; cx.lineWidth = Math.max(5, 12 * U); cx.stroke();
        cx.strokeStyle = "rgba(255,45,122,0.75)"; cx.lineWidth = Math.max(1.5, 3 * U); cx.stroke();
        cx.restore();
        /* losas que se desprenderán: se marcan un instante antes de caer */
        if (hole > 0.35) {
          for (var sl = 0; sl < 5; sl++) {
            var sp2 = seg(t, 31.95 + sl * 0.09, 32.6);
            if (sp2 <= 0) continue;
            var sx2 = hx + (rnd(sl * 7.1) - 0.5) * W * 0.5, sy2 = hy + (rnd(sl * 3.3) - 0.5) * H * 0.26;
            cx.save(); cx.globalAlpha = 0.9; cx.translate(sx2, sy2 + sp2 * sp2 * H * 0.30); cx.rotate((rnd(sl * 5.5) - 0.5) * sp2 * 0.7);
            cx.fillStyle = "#1a0f2c"; cx.fillRect(-W * 0.035, -H * 0.02, W * 0.07, H * 0.04);
            cx.strokeStyle = C.magenta; cx.lineWidth = Math.max(1.5, 2.5 * U); cx.strokeRect(-W * 0.035, -H * 0.02, W * 0.07, H * 0.04);
            cx.restore();
          }
        }
      }

      caption(t, 31.25, 32.5, "Y EL SUELO SE ABRE.", 0.04, 0.05, 58, C.yellow, C.ink, -0.03);
      sfxWord(t, 31.5, 32.5, "CRRRAC", 0.3, 0.36, 168, C.yellow, -0.1);
      flash(t, 31, 0.14, "#fff", 0.6);
      motes(t, 30, 0.5, 55);
    } else {
      /* ── la caída ─────────────────────────────────────────────────────────
         Ya no hay página ni giro: el personaje cae DENTRO del foso y el foso
         asciende. La cámara casi no se mueve (8 % en todo el tramo); lo que se
         mueve es la Torre. */
      var u = t - 32.6;
      var speed = clamp(0.55 + u * 0.42, 0.55, 1);
      var scroll = clamp(0.06 + u * 0.135, 0.06, 0.36);
      var s3 = shakeOf(t, 32.6, 0.35, 14);
      /* el sombrero cae junto a él, no en otro plano: se le escapa de la mano */
      var hatP = seg(u, 0.15, 1.75);
      shaftSide(t, scroll, speed, null, hatP, s3[0], s3[1], { mode: "fall" });
      speedLines(0.5, 0.42, 0.55 * speed, 31);
      caption(t, 32.8, 34.2, "NO HAY SUELO QUE LO SOSTENGA.", 0.05, 0.06, 52, C.bone, C.ink, -0.03);
      sfxWord(t, 33.0, 34.2, "FSSSSH", 0.80, 0.80, 126, C.cyan, 0.12);
      flash(t, 32.6, 0.14, "#fff", 0.7);
      motes(t, 30, 0.5, 55);
    }
  }


  /* ─────────────────────── ACTO IV · EL DESCENSO ───────────────────────────
     08 · EL REFUGIO (35,5–42) — picado desde el borde del pozo, caída, título
     y encuadre EXACTO del menú (mc_07_pit). El pozo es el umbral del Refugio:
     el jugador ya está donde NUEVA PARTIDA lo va a recoger. */
  /* ─────────────────────────── ACTO V · EL REFUGIO ───────────────────────────
     35,5 → 42. Ya no es "el túnel y luego el título": es la LLEGADA. El foso se
     abre por abajo, la plataforma de servicio aparece para recibirlo, su sombra
     entra en el salón que ya conocemos —lámina de suelo, alfombra, zócalo,
     zorro de neón y plataforma cian, que es el punto exacto por donde NUEVA
     PARTIDA lo recogerá— y sólo entonces entra el título, con el Refugio todavía
     debajo. El último fotograma sigue siendo, al píxel, el del menú.

     Geometría del Refugio: la misma que `DD_HUB` en su primer fotograma
     (HUB_BOUNDS 260·210·1240·760, cámara con el jugador en 880·615, zoom
     min(1,6, max(1,02, min(W/1150, H/780))), plataforma en 880·785). */
  var HUBG = { x: 260, y: 210, w: 1240, h: 760, hx: 880, hy: 615, padY: 785 };

  function hubCam() {
    var zoom = Math.min(1.6, Math.max(1.02, Math.min(W / 1150, H / 780)));
    var camX = HUBG.hx * 0.55 + (HUBG.x + HUBG.w * 0.5) * 0.45;
    var camY = HUBG.hy * 0.48 + (HUBG.y + HUBG.h * 0.42) * 0.52;
    var halfW = W * 0.5 / zoom, halfH = H * 0.5 / zoom;
    var x0 = HUBG.x - 56, x1 = HUBG.x + HUBG.w + 56;
    var y0 = HUBG.y - 150, y1 = HUBG.y + HUBG.h + 56;
    camX = (halfW * 2 >= x1 - x0) ? (x0 + x1) * 0.5 : Math.max(x0 + halfW, Math.min(x1 - halfW, camX));
    camY = (halfH * 2 >= y1 - y0) ? (y0 + y1) * 0.5 : Math.max(y0 + halfH, Math.min(y1 - halfH, camY));
    return { zoom: zoom, camX: camX, camY: camY };
  }

  /* El salón del Refugio, pintado a mano con la identidad del cómic pero con
     los elementos que son SUYOS: damero en fuga, alfombra central, butacas,
     lámparas colgantes, zorro de neón en el muro y plataforma cian de bajada.
     Punto de vista alto, como el del HUB, para que se reconozca al instante.
     No se usa la caché del motor a propósito: depende de props que el
     precargador no garantiza cuando arranca la cinemática. */
  function refugeRoom(a, drop, push, pan) {
    push = push == null ? 1 : push; pan = pan || 0;
    var hor = H * 0.455;                                   /* línea de horizonte */
    var vpx = W * 0.5;
    cx.fillStyle = "#0a0414"; cx.fillRect(0, 0, W, H);
    /* empuje y deriva del salón: la cámara acompaña, no se queda clavada */
    cx.save();
    cx.translate(W * 0.5 + pan * W, H * 0.52);
    cx.scale(push, push);
    cx.translate(-W * 0.5, -H * 0.52);

    /* ── muro del fondo con arcos ── */
    var wg = cx.createLinearGradient(0, 0, 0, hor);
    wg.addColorStop(0, "#0b0418"); wg.addColorStop(0.55, "#1d0d31"); wg.addColorStop(1, "#2e1340");
    cx.fillStyle = wg; cx.fillRect(0, 0, W, hor + 2);
    for (var ar = 0; ar < 5; ar++) {
      var ax = W * (0.10 + ar * 0.20), aw = W * 0.055, ah = H * 0.20, ay = hor - ah - H * 0.06;
      cx.save();
      cx.beginPath();
      cx.moveTo(ax - aw, hor - H * 0.02);
      cx.lineTo(ax - aw, ay + aw * 0.9);
      cx.arc(ax, ay + aw * 0.9, aw, Math.PI, 0);
      cx.lineTo(ax + aw, hor - H * 0.02);
      cx.closePath();
      var ag = cx.createLinearGradient(0, ay, 0, hor);
      ag.addColorStop(0, ar % 2 ? "rgba(34,211,238,0.30)" : "rgba(255,45,122,0.30)");
      ag.addColorStop(1, "rgba(10,4,20,0.9)");
      cx.fillStyle = ag; cx.fill();
      cx.strokeStyle = C.ink; cx.lineWidth = Math.max(3, 6 * U); cx.stroke();
      cx.strokeStyle = ar % 2 ? "rgba(34,211,238,0.85)" : "rgba(255,45,122,0.85)";
      cx.lineWidth = Math.max(1.5, 2.5 * U); cx.stroke();
      cx.restore();
    }
    /* zócalo */
    cx.fillStyle = "#07030d"; cx.fillRect(0, hor - H * 0.025, W, H * 0.025);
    cx.fillStyle = "rgba(250,204,21,0.55)"; cx.fillRect(0, hor - H * 0.028, W, Math.max(1.5, 2.5 * U));

    /* ── lámparas colgantes: rombos de neón, como en el salón real ── */
    for (var lp = 0; lp < 4; lp++) {
      var lx = W * (0.17 + lp * 0.22), ly = H * (0.10 + (lp % 2) * 0.035), lr = H * 0.028;
      cy_line(lx, 0, lx, ly - lr);
      var lgl = cx.createRadialGradient(lx, ly, 2, lx, ly, lr * 5);
      lgl.addColorStop(0, "rgba(255,45,122,0.42)"); lgl.addColorStop(1, "rgba(255,45,122,0)");
      cx.fillStyle = lgl; cx.fillRect(lx - lr * 5, ly - lr * 5, lr * 10, lr * 10);
      cx.save(); cx.translate(lx, ly); cx.rotate(Math.PI / 4);
      cx.strokeStyle = C.magenta; cx.lineWidth = Math.max(2, 3.5 * U);
      cx.strokeRect(-lr * 0.7, -lr * 0.7, lr * 1.4, lr * 1.4);
      cx.restore();
    }

    /* ── suelo: damero en fuga hacia el punto de fuga ── */
    var fg = cx.createLinearGradient(0, hor, 0, H);
    fg.addColorStop(0, "#2a1236"); fg.addColorStop(0.5, "#3d1638"); fg.addColorStop(1, "#1d0820");
    cx.fillStyle = fg; cx.fillRect(0, hor, W, H - hor);
    var rows = 12;
    for (var r = 0; r < rows; r++) {
      var t0 = r / rows, t1 = (r + 1) / rows;
      var y0 = hor + (H - hor) * Math.pow(t0, 2.1), y1 = hor + (H - hor) * Math.pow(t1, 2.1);
      var spread0 = Math.pow(t0, 2.1), spread1 = Math.pow(t1, 2.1);
      var cols = 4 + r;
      for (var c2 = 0; c2 < cols; c2++) {
        if ((r + c2) % 2) continue;
        var c0 = c2 / cols, c1 = (c2 + 1) / cols;
        var xa0 = vpx + (c0 - 0.5) * W * (0.55 + spread0 * 2.1);
        var xb0 = vpx + (c1 - 0.5) * W * (0.55 + spread0 * 2.1);
        var xa1 = vpx + (c0 - 0.5) * W * (0.55 + spread1 * 2.1);
        var xb1 = vpx + (c1 - 0.5) * W * (0.55 + spread1 * 2.1);
        cx.beginPath(); cx.moveTo(xa0, y0); cx.lineTo(xb0, y0); cx.lineTo(xb1, y1); cx.lineTo(xa1, y1); cx.closePath();
        cx.fillStyle = "rgba(244,236,216," + (0.045 + 0.035 * (1 - r / rows)) + ")";
        cx.fill();
      }
    }

    /* ── alfombra central en fuga ── */
    var rt = 0.30, rb = 0.98;
    var ry0 = hor + (H - hor) * Math.pow(rt, 2.1), ry1 = hor + (H - hor) * Math.pow(rb, 2.1);
    var rw0 = W * 0.16, rw1 = W * 0.62;
    cx.save();
    cx.beginPath();
    cx.moveTo(vpx - rw0 / 2, ry0); cx.lineTo(vpx + rw0 / 2, ry0);
    cx.lineTo(vpx + rw1 / 2, ry1); cx.lineTo(vpx - rw1 / 2, ry1); cx.closePath();
    var rgd = cx.createLinearGradient(0, ry0, 0, ry1);
    rgd.addColorStop(0, "#4d1330"); rgd.addColorStop(0.5, "#7d1f45"); rgd.addColorStop(1, "#3a0d26");
    cx.fillStyle = rgd; cx.fill();
    cx.strokeStyle = C.ink; cx.lineWidth = Math.max(4, 9 * U); cx.stroke();
    cx.strokeStyle = "rgba(255,45,122,0.7)"; cx.lineWidth = Math.max(1.5, 3 * U); cx.stroke();
    /* cenefa y rombos del dibujo de la alfombra */
    cx.clip();
    cx.strokeStyle = "rgba(244,236,216,0.18)"; cx.lineWidth = Math.max(1, 2 * U);
    for (var dz = 0; dz < 5; dz++) {
      var dz0 = ry0 + (ry1 - ry0) * (dz / 5), dz1 = ry0 + (ry1 - ry0) * ((dz + 1) / 5);
      var hw0 = lerp(rw0, rw1, dz / 5) * 0.34;
      cx.beginPath(); cx.moveTo(vpx, dz0); cx.lineTo(vpx + hw0, (dz0 + dz1) / 2); cx.lineTo(vpx, dz1); cx.lineTo(vpx - hw0, (dz0 + dz1) / 2); cx.closePath(); cx.stroke();
    }
    cx.restore();

    /* ── butacas rojas a los lados ── */
    for (var ch2 = 0; ch2 < 4; ch2++) {
      var side = ch2 < 2 ? -1 : 1;
      var chx = vpx + side * W * (ch2 % 2 ? 0.335 : 0.215);
      var chy = hor + (H - hor) * (ch2 % 2 ? 0.42 : 0.30);
      var chw = W * (ch2 % 2 ? 0.058 : 0.046), chh = H * (ch2 % 2 ? 0.085 : 0.068);
      cx.save();
      /* respaldo alto */
      cx.fillStyle = "#2f0817"; cx.fillRect(chx - chw / 2, chy - chh, chw, chh * 0.82);
      cx.strokeStyle = "rgba(255,45,122,0.5)"; cx.lineWidth = Math.max(1.2, 2 * U);
      cx.strokeRect(chx - chw / 2, chy - chh, chw, chh * 0.82);
      /* asiento */
      cx.fillStyle = "#470d22"; cx.fillRect(chx - chw * 0.62, chy - chh * 0.16, chw * 1.24, chh * 0.2);
      cx.strokeStyle = C.ink; cx.lineWidth = Math.max(1.5, 2.5 * U); cx.strokeRect(chx - chw * 0.62, chy - chh * 0.16, chw * 1.24, chh * 0.2);
      /* patas */
      cx.strokeStyle = "rgba(7,3,13,0.95)"; cx.lineWidth = Math.max(1.5, 2.5 * U);
      cx.beginPath(); cx.moveTo(chx - chw * 0.45, chy + chh * 0.04); cx.lineTo(chx - chw * 0.52, chy + chh * 0.3);
      cx.moveTo(chx + chw * 0.45, chy + chh * 0.04); cx.lineTo(chx + chw * 0.52, chy + chh * 0.3); cx.stroke();
      cx.restore();
    }

    /* ── zorro de neón en el muro derecho ── */
    var fxx = W * 0.885, fyy = hor - H * 0.16;
    var fgl = cx.createRadialGradient(fxx, fyy + H * 0.05, 8, fxx, fyy + H * 0.05, H * 0.24);
    fgl.addColorStop(0, "rgba(255,45,122,0.42)"); fgl.addColorStop(1, "rgba(255,45,122,0)");
    cx.fillStyle = fgl; cx.fillRect(fxx - H * 0.28, fyy - H * 0.2, H * 0.56, H * 0.56);
    cx.save(); cx.strokeStyle = C.magenta; cx.lineWidth = Math.max(2.5, 5 * U);
    var fk = H * 0.075;
    cx.beginPath();
    cx.moveTo(fxx - fk * 0.55, fyy + fk * 0.42); cx.lineTo(fxx - fk * 0.32, fyy - fk * 0.12);
    cx.lineTo(fxx - fk * 0.1, fyy + fk * 0.34); cx.lineTo(fxx + fk * 0.14, fyy - fk * 0.12);
    cx.lineTo(fxx + fk * 0.38, fyy + fk * 0.42); cx.lineTo(fxx, fyy + fk * 1.15);
    cx.closePath(); cx.stroke(); cx.restore();

    /* ── plataforma de descenso cian, delante ── */
    var padX = W * 0.5, padY = H * 0.905, padR = W * 0.075;
    var pgl = cx.createRadialGradient(padX, padY, 4, padX, padY, padR * 2.6);
    pgl.addColorStop(0, "rgba(34,211,238,0.55)"); pgl.addColorStop(1, "rgba(34,211,238,0)");
    cx.fillStyle = pgl; cx.fillRect(padX - padR * 2.6, padY - padR * 2.6, padR * 5.2, padR * 5.2);
    cx.save();
    cx.strokeStyle = C.cyan; cx.lineWidth = Math.max(2.5, 4.5 * U);
    cx.beginPath(); cx.ellipse(padX, padY, padR, padR * 0.32, 0, 0, Math.PI * 2); cx.stroke();
    cx.strokeStyle = "rgba(34,211,238,0.45)"; cx.lineWidth = Math.max(1.2, 2.2 * U);
    cx.beginPath(); cx.ellipse(padX, padY, padR * 1.5, padR * 0.48, 0, 0, Math.PI * 2); cx.stroke();
    cx.restore();

    /* ── luz del salón ── */
    var sgl = cx.createLinearGradient(0, 0, W * 0.66, 0);
    sgl.addColorStop(0, "rgba(5,2,10," + (0.9 * a) + ")"); sgl.addColorStop(0.5, "rgba(5,2,10," + (0.42 * a) + ")"); sgl.addColorStop(1, "rgba(5,2,10,0)");
    cx.fillStyle = sgl; cx.fillRect(0, 0, W, H);
    var bgl = cx.createLinearGradient(0, H * 0.7, 0, H);
    bgl.addColorStop(0, "rgba(5,2,10,0)"); bgl.addColorStop(1, "rgba(5,2,10," + (0.55 * a) + ")");
    cx.fillStyle = bgl; cx.fillRect(0, H * 0.7, W, H * 0.3);
    cx.restore();
    halftone(0, 0, W, H, 0.09);
    /* las coordenadas que devuelve ya llevan el empuje aplicado */
    var toS = function (x, y) {
      return { x: (x - W * 0.5) * push + W * 0.5 + pan * W, y: (y - H * 0.52) * push + H * 0.52 };
    };
    var pd2 = toS(padX, padY);
    return { padX: pd2.x, padY: pd2.y, floorY: (padY - H * 0.105 - H * 0.52) * push + H * 0.52, vpx: vpx };
  }

  function cy_line(x0, y0, x1, y1) {
    cx.save(); cx.strokeStyle = "rgba(7,3,13,0.9)"; cx.lineWidth = Math.max(1, 1.6 * U);
    cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke(); cx.restore();
  }

  function shotFall(t, st) {
    if (t < 38) {
      var v = t - 35.5;
      /* el foso se abre por abajo: la cámara sube con él mientras cae */
      var open = ease(seg(v, 0.25, 1.55));
      var camK = ease(seg(v, 0.55, 2.6));
      var drop = (1 - ease(seg(v, 0.5, 2.4))) * H * 0.06;
      if (open < 1) {
        /* todavía dentro del foso: cae y abajo empieza a verse la luz del salón */
        shaftSide(t, 0.30 + v * 0.10, 1 - ease(seg(v, 0.9, 1.7)), null, -1, 0, 0, { mode: "fall" });
        var gOpen = cx.createLinearGradient(0, H, 0, H * (1 - 0.55 * open));
        gOpen.addColorStop(0, "rgba(255,45,122," + (0.55 * open) + ")"); gOpen.addColorStop(1, "rgba(255,45,122,0)");
        cx.save(); cx.globalCompositeOperation = "lighter"; cx.fillStyle = gOpen; cx.fillRect(0, 0, W, H); cx.restore();
      } else {
        /* ya en el salón: entra desde arriba y se queda plantado delante de la
           plataforma de bajada, que es donde NUEVA PARTIDA lo recogerá */
        var rPush = 1 + ease(seg(v, 0.5, 2.6)) * 0.05;
        var rPan = Math.sin(clamp(v, 0, 2.6) * 1.1) * 0.012;
        var room = refugeRoom(1, drop, rPush, rPan);
        var land = ease(seg(v, 0.95, 1.75));
        var feetY = room.floorY, shY = feetY - (1 - land) * H * 0.28;
        cx.save();
        cx.globalAlpha = 0.55;
        cx.fillStyle = C.ink; cx.beginPath();
        cx.ellipse(room.padX - walk * W * 0.045, shY, W * (0.045 + 0.02 * (1 - land)), H * (0.013 + 0.005 * (1 - land)), 0, 0, Math.PI * 2); cx.fill();
        cx.restore();
        /* el héroe entra en escena desde arriba y se queda plantado en el salón.
           Los pies, EXACTAMENTE en la línea de suelo del HUB (0,563 de alto). */
        if (ok(img.hero)) {
          var hh = H * 0.40, hw = hh * 288 / 512;
          cx.save();
          cx.globalAlpha = land;
          cx.drawImage(img.hero, room.padX - hw * 0.49 - walk * W * 0.045,
            feetY - hh - (1 - land) * H * 0.40 - stepBob, hw, hh);
          cx.restore();
        }
        /* Después de tocar suelo la escena SIGUE: da dos pasos hacia la sala
           (el mismo recurso del HUB: el fotograma se desplaza con un rebote),
           cae polvo del boquete por el que ha entrado y las lámparas laten.
           Sin esto, del 37,3 al 40,5 sólo se movería la cámara. */
        var walk = seg(v, 1.8, 2.55);              /* dos pasos, hasta el título */
        var stepBob = Math.abs(Math.sin(walk * Math.PI * 2)) * H * 0.008;
        if (!reduced) {
          /* polvo y ascuas cayendo del boquete */
          for (var pd = 0; pd < 16; pd++) {
            var pv2 = ((v * 0.30 + rnd(pd * 2.7)) % 1);
            cx.save(); cx.globalAlpha = 0.55 * (1 - pv2) * seg(v, 1.0, 1.4);
            cx.fillStyle = pd % 3 === 0 ? C.magenta : (pd % 3 === 1 ? C.bone : C.cyan);
            cx.beginPath();
            cx.arc(W * (0.3 + rnd(pd * 3.1) * 0.4) + Math.sin(v * 2.2 + pd) * 10 * U,
              H * (0.02 + pv2 * 0.62), Math.max(1, 2.4 * U * (1 - pv2 * 0.5)), 0, 7);
            cx.fill(); cx.restore();
          }
        }
        /* polvo del aterrizaje */
        if (!reduced && land > 0 && land < 1) {
          for (var d = 0; d < 12; d++) {
            var dv = (1 - land) * 1.2;
            cx.save(); cx.globalAlpha = 0.5 * (1 - land);
            cx.fillStyle = d % 2 ? C.bone : C.magenta;
            cx.beginPath(); cx.arc(room.padX + (rnd(d * 3.1) - 0.5) * W * 0.16 * (1 - land + 0.3) / dv * 0.4,
              room.floorY + (rnd(d * 1.7) - 0.5) * H * 0.03, Math.max(1, (3 + 8 * rnd(d)) * U * (1 - land)), 0, 7);
            cx.fill(); cx.restore();
          }
        }
        speedLines(0.5, 0.5, 0.28 * (1 - land), 41);
      }
      caption(t, 35.7, 37.7, "LA TORRE YA NO PUEDE SOSTENERLO.", 0.045, 0.05, 54, C.bone, C.ink, -0.03);
      flash(t, 35.5, 0.12, "#fff", 0.6);
    } else {
      shotTitle(t, st);
    }
  }

  /* El título ya no tapa el Refugio: entra SOBRE él, con el salón todavía
     detrás y el héroe plantado en la plataforma. Los últimos 1,5 s se pintan
     con la geometría exacta del menú (misma lámina, mismo encuadre, misma
     sombra) para que el relevo no se note. */
  function shotTitle(t, st) {
    var tq = t - TITLE_AT, sh = shakeOf(t, TITLE_AT, 0.5, 16);
    /* 38 → 40,5: el salón del Refugio, vivo (respira la luz del zorro). */
    var toMenu = ease(seg(tq, 2.2, 3.1));                    /* 40,5 → 41,4 fundido al menú */
    if (toMenu < 1) {
      var roomA = 1 - toMenu;                       /* se va con el fundido */
      var room2 = refugeRoom(roomA, 0, 1.05 + easeOut(seg(tq, 0, 2.5)) * 0.03, Math.sin(tq * 0.7) * 0.008);
      if (ok(img.hero)) {
        var hh2 = H * 0.40, hw2 = hh2 * 288 / 512;
        var idle = reduced ? 0 : Math.sin(tq * 1.9) * H * 0.004;   /* respira */
        cx.save(); cx.globalAlpha = roomA;
        cx.drawImage(img.hero, room2.padX - hw2 * 0.49 - W * 0.045, room2.floorY - hh2 - idle, hw2, hh2);
        cx.restore();
      }
      if (!reduced) {
        /* el salón sigue vivo: lámparas que laten y ascuas que se apagan */
        for (var lb = 0; lb < 4; lb++) {
          var lbx = W * (0.17 + lb * 0.22), lby = H * (0.10 + (lb % 2) * 0.035);
          var pulseL = 0.5 + 0.5 * Math.sin(tq * 2.4 + lb * 1.3);
          cx.save(); cx.globalAlpha = 0.10 + 0.16 * pulseL;
          var lgg = cx.createRadialGradient(lbx, lby, 2, lbx, lby, H * 0.12);
          lgg.addColorStop(0, "rgba(255,45,122,0.9)"); lgg.addColorStop(1, "rgba(255,45,122,0)");
          cx.fillStyle = lgg; cx.fillRect(lbx - H * 0.12, lby - H * 0.12, H * 0.24, H * 0.24); cx.restore();
        }
        for (var em = 0; em < 10; em++) {
          var ev3 = (tq * 0.18 + rnd(em * 4.3)) % 1;
          cx.save(); cx.globalAlpha = 0.4 * (1 - ev3);
          cx.fillStyle = em % 2 ? C.magenta : C.yellow;
          cx.beginPath(); cx.arc(W * (0.34 + rnd(em * 1.7) * 0.32) + Math.sin(tq * 1.5 + em) * 8 * U,
            H * (0.5 - ev3 * 0.44), Math.max(1, 2 * U * (1 - ev3 * 0.6)), 0, 7); cx.fill(); cx.restore();
        }
      }
      if (!reduced) {
        /* la respiración del neón: dos latidos lentos, no un fundido muerto */
        var breath = 0.12 + 0.10 * (0.5 + 0.5 * Math.sin(tq * 2.4));
        var bg2 = cx.createRadialGradient(W * 0.82, H * 0.34, 8, W * 0.82, H * 0.34, H * 0.5);
        bg2.addColorStop(0, "rgba(255,45,122," + breath + ")"); bg2.addColorStop(1, "rgba(255,45,122,0)");
        cx.fillStyle = bg2; cx.fillRect(0, 0, W, H);
      }
    }
    if (toMenu > 0) {
      /* el encuadre del menú, con la regla exacta del menú */
      var sB = Math.max(W / img.pit.naturalWidth, H / img.pit.naturalHeight) * 1;
      var bw = img.pit.naturalWidth * sB, bh = img.pit.naturalHeight * sB;
      var ox = W * 0.46, oy = H * 0.43;
      cx.save(); cx.globalAlpha = toMenu;
      cx.translate(ox, oy);
      cx.drawImage(img.pit, (W - bw) / 2 - ox + (sh[0] || 0), (H - bh) / 2 - oy + (sh[1] || 0), bw, bh);
      cx.restore();
    }
    /* las sombras del menú, desde el primer instante del título */
    var a = ease(seg(tq, 0.1, 1.6)) * (1 - 0.35 * (1 - toMenu));
    var side = cx.createLinearGradient(0, 0, W * 0.72, 0);
    side.addColorStop(0, "rgba(5,2,10," + (0.94 * a) + ")");
    side.addColorStop(0.36, "rgba(5,2,10," + (0.72 * a) + ")");
    side.addColorStop(0.72, "rgba(5,2,10,0)");
    cx.fillStyle = side; cx.fillRect(0, 0, W, H);
    var vert = cx.createLinearGradient(0, 0, 0, H);
    vert.addColorStop(0, "rgba(5,2,10," + (0.5 * a) + ")");
    vert.addColorStop(0.22, "rgba(5,2,10,0)");
    vert.addColorStop(0.72, "rgba(5,2,10,0)");
    vert.addColorStop(1, "rgba(5,2,10," + (0.78 * a) + ")");
    cx.fillStyle = vert; cx.fillRect(0, 0, W, H);

    var b = logoBox(), k = easeOut(seg(tq, 0, 0.35)), cxmB = b.x + b.w / 2, cymB = b.y + b.h / 2;
    splat(cxmB + b.w * 0.06, cymB + b.h * 0.05, b.w * 0.46 * k, C.magenta, 3, 0.20 * (1 - 0.7 * seg(tq, 0.5, 2)));
    splat(cxmB + b.w * 0.30, cymB + b.h * 0.28, b.w * 0.17 * k, C.yellow, 8, 0.45 * (1 - 0.7 * seg(tq, 0.5, 2)));
    if (ok(img.logo)) {
      var sc = reduced ? 1 : 1 + 0.6 * Math.pow(1 - seg(tq, 0, 0.35), 2);
      cx.save(); cx.globalAlpha = seg(tq, 0, 0.1);
      cx.drawImage(img.logo, cxmB - b.w * sc / 2, cymB - b.h * sc / 2, b.w * sc, b.h * sc);
      cx.restore();
    }
    var ta = ease(seg(tq, 0.9, 1.6));
    if (ta > 0 && b.tag) {
      cx.save(); cx.globalAlpha = ta; cx.fillStyle = C.bone;
      var fs = clamp(Math.min(W * 0.0158, H * 0.0263), 11, 28), txt = "LA NOCHE QUE DEVORÓ EL AMANECER";
      cx.font = "italic 800 " + fs + "px " + FONT_CAP;
      var track = fs * 0.02;
      var tw = cx.measureText(txt).width + track * (txt.length - 1);
      var tx = b.brandX + b.brandW / 2 - tw / 2, ty = b.y + b.h + H * 0.012;
      cx.textAlign = "left"; cx.textBaseline = "top"; cx.shadowColor = "rgba(0,0,0,0.9)"; cx.shadowBlur = 10 * DPR;
      for (var ci = 0; ci < txt.length; ci++) {
        var ch = txt.charAt(ci);
        cx.fillText(ch, tx, ty);
        tx += cx.measureText(ch).width + track;
      }
      cx.restore();
    }
    /* Barrido de luz sobre la lámina mientras el título está arriba: no cambia
       la composición, sólo la ilumina, y aterriza antes de 42,0 para que el
       relevo al menú siga siendo exacto. Evita un segundo de imagen muerta. */
    if (!reduced) {
      var swp = ease(seg(tq, 1.1, 3.1));
      if (swp > 0 && swp < 1) {
        cx.save(); cx.globalCompositeOperation = "lighter"; cx.globalAlpha = 0.10 * Math.sin(swp * Math.PI);
        var swx = W * (0.2 + swp * 0.9);
        var swg = cx.createLinearGradient(swx - W * 0.18, 0, swx + W * 0.18, 0);
        swg.addColorStop(0, "rgba(255,255,255,0)"); swg.addColorStop(0.5, "rgba(190,240,255,0.9)"); swg.addColorStop(1, "rgba(255,255,255,0)");
        cx.fillStyle = swg; cx.fillRect(swx - W * 0.2, 0, W * 0.4, H);
        cx.restore();
      }
    }
    /* Aliento final del pozo: un 1,5 % de luz que sube y baja. Invisible como
       gesto, suficiente para que el último segundo no sea una lámina quieta, y
       por debajo del umbral que el ojo lee como parpadeo. */
    if (!reduced) {
      var lastBreath = 0.5 + 0.5 * Math.sin(tq * 2.1);
      cx.save(); cx.globalCompositeOperation = "lighter"; cx.globalAlpha = 0.035 * lastBreath;
      var lbg = cx.createRadialGradient(W * 0.52, H * 0.52, H * 0.08, W * 0.52, H * 0.52, H * 0.62);
      lbg.addColorStop(0, "rgba(255,45,122,0.9)"); lbg.addColorStop(1, "rgba(255,45,122,0)");
      cx.fillStyle = lbg; cx.fillRect(0, 0, W, H); cx.restore();
    }
    /* Cartela aprobada nº2: se paga al entrar en el Refugio, no en el descenso. */
    caption(t, 38.45, 40.2, "POR FIN, HABÍA QUIEN PODÍA IMAGINAR UN MAÑANA.", 0.035, 0.845, 42, C.bone, C.ink, -0.02);
    flash(t, TITLE_AT, 0.08, "#fff", 0.3);
  }


  /* Pozo visto de lado: plataforma, cadenas y el IDLE aceptado (07B). Lo usan la
     intro (inicio de la caída) y NUEVA PARTIDA (el resto del descenso).
     scroll: avance por la torre (0–1); hatP: -1 sin sombrero, 0–1 desprendiéndose. */
  /* ──────────────────────── FOSO LATERAL (compartido) ───────────────────────
     Un solo pintor del foso para tres usos: el descenso de NUEVA PARTIDA
     (plataforma de servicio), la caída libre del acto IV y la llegada al
     Refugio. Todo lo que no es fondo es FIGURA: contenido desplazándose de abajo
     arriba mientras el personaje cae. El movimiento no es de cámara: es el
     mundo el que asciende.

     opts:
       scroll   qué tramo del foso se ve (0 arriba · 1 fondo)
       speed    0 quieto · 1 caída plena; gobierna estela, viento y polvo
       platFy   altura de la plataforma (0..1) o null si no hay plataforma
       hatP     progreso del sombrero que cae (0..1) o -1 para no dibujarlo
       shx/shy  sacudida
       mode     "platform" (descenso) | "fall" (caída) | "arrival" (aterrizaje)
       t        reloj local del movimiento continuo
       free     desplazamiento vertical propio (px) para la llegada
  */
  function shaftSide(t, scroll, speed, platFy, hatP, shx, shy, opts) {
    opts = opts || {};
    var mode = opts.mode || "platform";
    var free = opts.free || 0;
    /* ── fondo: las nueve plantas del foso, ascendiendo ── */
    cx.fillStyle = "#0b0416"; cx.fillRect(0, 0, W, H);
    if (ok(img.nine)) {
      var iw = Math.max(W * 0.74, H * 1.25), sc = iw / 768, ih = NINE_H * sc, ix = W / 2 - iw / 2;
      var iy = -lerp(380 * sc, ih - H, clamp(scroll, 0, 1)) + free * 0.45;
      cx.drawImage(img.nine, ix, iy, iw, ih);
      tint("rgba(7,3,13,1)", mode === "fall" ? 0.24 : 0.38);
      halftone(0, 0, W, H, 0.16);
      /* Vigas que cruzan el foso: se ven pasar a velocidad de caída. Da escala y
         continuidad (es la misma Torre de los planos 2 y 3) y evita que el
         descenso se lea como un simple desplazamiento del fondo. */
      if (!reduced) {
        cx.save();
        var beamN = 7;
        for (var bm = 0; bm < beamN; bm++) {
          var bv = ((rnd(bm * 7.3) + t * (0.30 + 0.42 * speed)) % 1);
          var by = H * (1.15 - bv * 1.3) + free * 0.7;
          var bwd = W * (0.62 + 0.34 * rnd(bm * 3.1)), bhh = Math.max(3, (9 + 10 * rnd(bm)) * U) * (0.6 + speed * 0.9);
          cx.globalAlpha = 0.5 + 0.3 * rnd(bm * 5.7);
          cx.fillStyle = "#120a20"; cx.fillRect(ix + (iw - bwd) / 2 + (rnd(bm * 2.9) - 0.5) * iw * 0.1, by, bwd, bhh);
          cx.fillStyle = bm % 3 === 0 ? "rgba(34,211,238,0.55)" : (bm % 3 === 1 ? "rgba(255,45,122,0.5)" : "rgba(250,204,21,0.4)");
          cx.fillRect(ix + (iw - bwd) / 2 + (rnd(bm * 2.9) - 0.5) * iw * 0.1, by + bhh - Math.max(1, 1.6 * U), bwd, Math.max(1, 1.6 * U));
        }
        cx.restore();
      }
    }
    /* Viñeteado lateral fijo. */
    var gl = cx.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, "rgba(7,3,13,0.9)"); gl.addColorStop(0.22, "rgba(7,3,13,0)"); gl.addColorStop(0.78, "rgba(7,3,13,0)"); gl.addColorStop(1, "rgba(7,3,13,0.9)");
    cx.fillStyle = gl; cx.fillRect(0, 0, W, H);

    /* ── estela y polvo: sólo si hay movimiento ── */
    if (!reduced && speed > 0.05) {
      cx.save(); cx.globalAlpha = 0.5 * speed; cx.fillStyle = C.ink;
      for (var i = 0; i < 30; i++) {
        var sx = W * (0.08 + rnd(i * 1.9) * 0.84), sy = ((rnd(i) * H * 2 - t * H * 3.1) % (H * 1.4) + H * 1.4) % (H * 1.4) - H * 0.2, ww = (3 + 6 * rnd(i * 3)) * U;
        cx.fillRect(sx, sy, ww, H * 0.2 * speed);
        if (i % 3 === 0) { cx.fillStyle = C.bone; cx.fillRect(sx + ww, sy, Math.max(1, 1.5 * U), H * 0.14 * speed); cx.fillStyle = C.ink; }
      }
      for (var q = 0; q < 26; q++) {
        var qx = W * (0.14 + rnd(q * 5.3 + 2) * 0.72), qv = 1.6 + rnd(q * 2.1) * 2.2;
        var qy = H * 1.1 - ((rnd(q * 9.7) * H * 1.3 + t * H * qv) % (H * 1.3));
        cx.globalAlpha = 0.75 * speed; cx.fillStyle = q % 4 === 0 ? C.magenta : (q % 4 === 1 ? C.cyan : C.bone);
        cx.fillRect(qx, qy, Math.max(1.5, (2 + 3 * rnd(q)) * U), (10 + 26 * rnd(q * 3)) * U * (0.4 + speed));
      }
      cx.restore();
    }

    if (mode === "fall") return fallFigure(t, speed, shx, shy, free);

    /* ── plataforma de servicio: cuelga de cadenas y se balancea ── */
    var live = reduced ? 0 : speed;
    var sway = Math.sin(t * 2.3) * 0.05 * live + Math.sin(t * 7.1) * 0.01 * live;
    var jolt = Math.exp(-((t * 1.25) % 1) * 7) * live;
    var camZ = 1 + 0.035 * live + 0.012 * Math.sin(t * 3.1) * live;
    var pxm = W / 2 + (shx || 0) + Math.sin(t * 2.3) * W * 0.014 * live;
    var pym = H * (platFy == null ? 0.72 : platFy) + (shy || 0) + free + Math.sin(t * 5) * H * 0.006 * live + jolt * H * 0.012, pr = H * 0.25;
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
    var hh = H * 0.46, hw = hh * 288 / 512, hx = pxm - hw * 0.49, hy = pym - hh * (504 / 512) + pr * 0.02 - jolt * H * 0.016;
    if (ok(img.hero)) {
      if (live > 0.05) {
        for (var gI = 3; gI >= 1; gI--) { cx.globalAlpha = 0.2 * live * (4 - gI) / 3; cx.drawImage(img.hero, hx, hy - gI * H * 0.026 * live, hw, hh); }
        cx.globalAlpha = 1;
      }
      cx.drawImage(img.hero, hx, hy, hw, hh);
      if (live > 0.05) {
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

  /* El protagonista EN EL AIRE. No hay plataforma: cae de espaldas, gira, la
     chaqueta y el pelo van por delante del cuerpo, y las estelas quedan encima.
     La pose no se deforma: se rota y se escala el dibujo entero. */
  function fallFigure(t, speed, shx, shy, free) {
    var hh = H * 0.5, hw = hh * 288 / 512;
    var cxB = W * 0.5 + (shx || 0) + Math.sin(t * 1.7) * W * 0.012;
    var cyB = H * 0.44 + (shy || 0) + free * 0.25 + Math.sin(t * 2.1) * H * 0.008;
    /* Gira de espaldas y fuera de eje: nunca se lee como si estuviera de pie. */
    var spin = reduced ? -0.28 : -0.30 + Math.sin(t * 1.15) * 0.20 + Math.sin(t * 2.6) * 0.06;
    /* Luz de contra: lo separa del foso, que es oscuro. */
    if (!reduced) {
      var rg = cx.createRadialGradient(cxB, cyB, hh * 0.1, cxB, cyB, hh * 0.62);
      rg.addColorStop(0, "rgba(255,45,122,0.22)"); rg.addColorStop(1, "rgba(255,45,122,0)");
      cx.fillStyle = rg; cx.fillRect(cxB - hh, cyB - hh, hh * 2, hh * 2);
    }
    if (ok(img.hero)) {
      /* estela: tres copias por encima, cada vez más tenues */
      for (var g = 3; g >= 1; g--) {
        cx.save(); cx.globalAlpha = 0.16 * speed * (4 - g) / 3;
        cx.translate(cxB, cyB - g * H * 0.05);
        cx.rotate(spin * (1 + g * 0.12));
        cx.drawImage(img.hero, -hw / 2, -hh / 2, hw, hh);
        cx.restore();
      }
      cx.save();
      cx.translate(cxB, cyB); cx.rotate(spin);
      cx.drawImage(img.hero, -hw / 2, -hh / 2, hw, hh);
      cx.restore();
      /* viento: trazos que suben pegados al cuerpo. Sin ellos la figura
         flotaría; con ellos se ve que es el aire el que la atraviesa. */
      if (!reduced) {
        cx.save(); cx.strokeStyle = "rgba(244,236,216,0.75)"; cx.lineCap = "round";
        for (var wf = 0; wf < 9; wf++) {
          var wx2 = cxB + (rnd(wf * 4.3) - 0.5) * hw * 2.1;
          var wy2 = cyB + ((rnd(wf * 1.7) - t * (1.5 + rnd(wf) * 1.4)) % 1 + 1) % 1 * hh * 1.5 - hh * 0.75;
          cx.globalAlpha = 0.55 * speed; cx.lineWidth = Math.max(1.2, 2.4 * U);
          cx.beginPath(); cx.moveTo(wx2, wy2); cx.lineTo(wx2, wy2 - hh * (0.10 + 0.10 * rnd(wf * 2.7))); cx.stroke();
        }
        cx.restore();
      }
      /* aro de compás roto: la única señal de que sigue fuera de tiempo al caer */
      if (!reduced) {
        cx.save(); cx.globalAlpha = 0.5 * speed; cx.strokeStyle = C.cyan; cx.lineWidth = Math.max(2, 3 * U);
        cx.setLineDash([26 * U, 18 * U]); cx.lineDashOffset = t * 120 * U;
        cx.beginPath(); cx.ellipse(cxB, cyB, hw * 1.25, hh * 0.66, spin * 0.5, 0, Math.PI * 2); cx.stroke();
        cx.setLineDash([]); cx.restore();
      }
    }
    return { x: cxB, y: cyB, r: hw * 0.5 };
  }


  /* 06 · EL DESCENSO — el suelo se abre, empieza la caída y el sombrero se queda arriba. */
  /* Centro del pozo y del encuadre de picado dentro de la lámina (mc_07_pit). */
  var PIT = [0.52, 0.5], PIT_CAM = [0.44, 0.4];

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
      var scroll = 0.3 + 0.2 * u - 0.09 * brake * brake * 1.1;
      var sh = shakeOf(t, 3.85, 0.5, 18);
      var arrive = ease(seg(u, 2.5, 3.3));
      shaftSide(t, Math.min(scroll, 0.86), speed, lerp(0.72, 0.8, arrive), -1, sh[0], sh[1]);
      speedLines(0.5, 0.45, 0.4 * speed, 31);
      if (arrive > 0) {
        /* El suelo del Refugio sube a su encuentro: damero cálido, filo de tinta
           y el zorro de neón que ya está encendido esperándolo. La sala real
           (DD_HUB) toma el relevo en el mismo punto y con la misma luz. */
        var fyy = lerp(H * 1.25, H * 0.80, arrive);
        var fg = cx.createLinearGradient(0, fyy, 0, H);
        fg.addColorStop(0, "#8a2452"); fg.addColorStop(0.35, "#5a1436"); fg.addColorStop(1, "#26081f");
        cx.fillStyle = fg; cx.fillRect(0, fyy, W, H - fyy + 2);
        /* Damero en perspectiva sobre el que aterriza la plataforma. */
        cx.save(); cx.beginPath(); cx.rect(0, fyy, W, H - fyy + 2); cx.clip();
        var rows = 9;
        for (var r2 = 0; r2 < rows; r2++) {
          var y0 = fyy + (H - fyy) * Math.pow(r2 / rows, 1.35);
          var y1 = fyy + (H - fyy) * Math.pow((r2 + 1) / rows, 1.35);
          var cols = 6 + r2 * 2, cw = W / cols, skew = (1 - arrive) * W * 0.2;
          for (var c2 = 0; c2 < cols; c2++) {
            if ((r2 + c2) % 2) continue;
            cx.fillStyle = "rgba(244,236,216," + (0.05 + 0.05 * arrive) + ")";
            cx.fillRect(c2 * cw - skew * 0.5 + Math.sin(t * 1.4 + r2) * 2 * U, y0, cw * 0.94, Math.max(1, y1 - y0));
          }
        }
        cx.restore();
        cx.fillStyle = C.ink; cx.fillRect(0, fyy - Math.max(3, 8 * U), W, Math.max(3, 8 * U));
        halftone(0, fyy, W, H - fyy, 0.2);
        glow(W / 2, fyy + (H - fyy) * 0.18, H * 0.62, "rgba(255,45,122,0.7)", 0.32 * arrive);
        /* Zorro de neón del Refugio: la misma silueta del muro del HUB, aquí
           sólo como señal luminosa en el fondo de la sala. */
        var foxA = ease(seg(u, 2.9, 3.6));
        if (foxA > 0) {
          var fxp = W * 0.80, fyp = fyy + (H - fyy) * 0.16;
          glow(fxp, fyp, H * 0.16, "rgba(255,45,122,0.95)", 0.30 * foxA);
          cx.save(); cx.globalAlpha = 0.85 * foxA; cx.strokeStyle = C.magenta; cx.lineWidth = Math.max(2, 3 * U);
          cx.beginPath();
          cx.moveTo(fxp - 16 * U, fyp - 10 * U); cx.lineTo(fxp - 6 * U, fyp - 16 * U); cx.lineTo(fxp, fyp - 6 * U);
          cx.lineTo(fxp + 6 * U, fyp - 16 * U); cx.lineTo(fxp + 16 * U, fyp - 10 * U); cx.lineTo(fxp, fyp + 14 * U);
          cx.closePath(); cx.stroke(); cx.restore();
        }
      }
      sfxWord(t, 3.85, 4.4, "CLONK", 0.74, 0.6, 130, C.yellow, 0.1);
      /* Segundo rótulo aprobado de la biblia: se paga aquí, cuando el Refugio
         ya está debajo y el jugador todavía no tiene el control. */
      caption(t, 3.05, 4.45, "POR FIN, HABÍA QUIEN PODÍA IMAGINAR UN MAÑANA.", 0.035, 0.585, 42, C.bone, C.ink, -0.02);
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
    /* Un paso de 120 ppm (medio segundo). tr = transposición en semitonos. */
    function step(tt, n, tr, vol, full, dest) {
      at(tt, function (w) {
        var k = Math.pow(2, -tr / 12);
        if (n % 2 === 0) S.kick(w, 0.75 * vol, dest || musicBus); else S.hat(w, 0.16 * vol, dest || musicBus);
        if (n % 4 === 2) S.snare(w, 0.28 * vol, dest || musicBus);
        S.bass(w, BASS[n % 8] * k, 0.22 * vol, dest || musicBus);
        if (n % 2 === 0) S.lead(w, LEAD[(n / 2) % 8] * k, 0.07 * vol, dest || musicBus);
        if (full && n % 2 === 1) S.lead(w, LEAD[((n + 1) / 2) % 8] * k * 2, 0.04 * vol, dest || musicBus);
      });
    }
    /* ── ACTO I · EL CICLO (0–14) ────────────────────────────────────────── */
    /* 01 La noche: la música suena lejos, detrás de los muros; el pulso sordo es
       un latido que ya estaba ahí antes de que hubiera nadie. */
    at(0, function (w) { musicBus.frequency.setValueAtTime(300, w); noise(w, 3.6, 0.10, "bandpass", 240, 460); });
    for (tb = 0.5; tb < 3.4; tb += BEAT / 2) step(tb, Math.round(tb / (BEAT / 2)), 0, 0.58, false);
    at(0.9, function (w) { S.boom(w, 0.5); });
    at(2.1, function (w) { S.boom(w, 0.42); });
    at(2.2, function (w) { S.whoosh(w, 1.0, 0.25, true); });

    /* 02 La torre: la cámara baja por las nueve plantas. El filtro se abre del
       todo y la música empieza a CRECER hacia abajo: cada planta es una nota
       descendente (una por semitono) y el sub-grave se hunde. */
    at(3.48, function (w) { musicBus.frequency.setValueAtTime(300, w); musicBus.frequency.exponentialRampToValueAtTime(18000, w + 0.4); S.hit(w, 0.4); });
    for (var i = 0; i < 9; i++) (function (i) {
      at(3.9 + i * 0.34, function (w) {
        tone(w, 660 * Math.pow(2, -i / 12), 0.14, "square", i === 8 ? 0.2 : 0.13);
        S.hat(w, 0.24);
        /* La misma escena, una planta más abajo: el mismo acorde de bajo. */
        S.bass(w, BASS[i % 8], 0.17, musicBus);
        if (i % 2 === 1) S.kick(w, 0.4, musicBus);
      });
    })(i);
    at(3.6, function (w) { S.rumble(w, 4.4, 0.16); });
    at(5.2, function (w) { S.snare(w, 0.34); });
    at(7.0, function (w) { S.snare(w, 0.34); });
    at(8.05, function (w) { S.whoosh(w, 0.5, 0.3, false); });
    at(8.2, function (w) { S.boom(w, 0.45); });

    /* 03 El bucle: EL MOTIVO. Cuatro repeticiones idénticas del mismo medio
       compás. El filtro queda fijo: la música deja de avanzar. En cada reinicio
       (8,5 / 10,5 / 12,5) hay el mismo tirón y la misma nota. En el CUARTO giro
       (13,75) el compás llega tarde, la música se atasca y la última nota queda
       colgada. */
    function loopBar(t0, vol, len, broken) {
      for (tb = t0; tb < t0 + len; tb += BEAT / 2) step(tb, Math.round(tb / (BEAT / 2)), 0, vol, false);
      at(t0, function (w) { S.whoosh(w, 0.2, 0.15, false); });
      at(t0 + 0.5, function (w) { S.snare(w, 0.2); });
      /* La nota que vuelve antes de terminar, siempre la misma. */
      at(t0 + 0.92, function (w) { tone(w, 470, 0.10, "square", 0.05); });
      if (broken) {
        at(t0 + 1.15, function (w) {
          noise(w, 0.03, 0.55, "bandpass", 3200); S.kick(w, 0.8); S.bass(w, BASS[6], 0.24); S.lead(w, LEAD[3], 0.1);
          musicBus._gain.gain.setValueAtTime(1, w);
          musicBus._gain.gain.linearRampToValueAtTime(0.0001, w + 0.05);
        });
        at(t0 + 1.3, function (w) { S.hat(w, 0.18); S.bass(w, BASS[7], 0.22); });
        at(t0 + 1.38, function (w) {
          musicBus._gain.gain.setValueAtTime(1, w);
          tone(w, 233, 1.4, "sawtooth", 0.08, null, 230);
        });
      }
    }
    loopBar(8.5, 1.0, 2.0, false);
    loopBar(10.5, 1.0, 2.0, false);
    loopBar(12.5, 1.04, 1.25, true);
    at(8.5, function (w) { musicBus.frequency.setValueAtTime(18000, w); });
    at(13.62, function (w) { S.whoosh(w, 0.5, 0.34, false); });

    /* ── ACTO II · EL DESAFINADO (14–26) ─────────────────────────────────── */
    /* 04 Las botas son el bombo: tres pasos en tiempo y el cuarto (16,1) tarde.
       La música se corta en seco. Después entra él y el filtro se queda bajo:
       el mundo sigue sonando pero ya no avanza. */
    at(14.0, function (w) { musicBus.frequency.setValueAtTime(18000, w); musicBus.frequency.exponentialRampToValueAtTime(520, w + 0.3); });
    [14.6, 15.1, 15.6, 16.1].forEach(function (x, idx) {
      at(x, function (w) {
        S.kick(w, idx === 3 ? 0.95 : 0.82, musicBus);
        noise(w, 0.09, 0.22, "lowpass", 520, 0, null);
        S.bass(w, BASS[idx * 2 % 8], 0.2, musicBus);
        if (idx === 3) {
          S.snare(w, 0.7); noise(w, 0.05, 0.5, "bandpass", 1500);
          musicBus._gain.gain.setValueAtTime(1, w); musicBus._gain.gain.linearRampToValueAtTime(0.0001, w + 0.03);
        }
      });
    });
    at(14.3, function (w) { S.snare(w, 0.32); });
    at(18.2, function (w) { S.whoosh(w, 0.28, 0.38, false); S.boom(w, 0.5); musicBus.frequency.setValueAtTime(520, w); musicBus.frequency.exponentialRampToValueAtTime(900, w + 0.4); });
    at(18.6, function (w) { tone(w, 110, 1.6, "sawtooth", 0.09, null, 108); tone(w, 116.5, 1.6, "sawtooth", 0.09, null, 119); });
    [19.2, 19.7, 20.3].forEach(function (x) { at(x, function (w) { S.snare(w, 0.36); S.hat(w, 0.18); }); });

    /* 05 Los que miran: el giro de todas las cabezas a la vez, el reloj parado. */
    at(21.0, function (w) { S.hit(w, 0.7); });
    for (tb = 21.0; tb < 25.2; tb += BEAT) (function (tb) { at(tb, function (w) { S.kick(w, 0.55); S.hat(w, 0.14); }); })(tb);
    at(21.35, function (w) { tone(w, 330, 1.4, "sine", 0.12, null, 660); });
    at(22.0, function (w) { S.snare(w, 0.55); noise(w, 0.04, 0.6, "highpass", 2600); musicBus._gain.gain.setValueAtTime(1, w); musicBus._gain.gain.linearRampToValueAtTime(0.0001, w + 0.04); });
    at(22.1, function (w) { musicBus._gain.gain.setValueAtTime(1, w); });
    [22.5, 23.2, 24.2].forEach(function (x) { at(x, function (w) { S.snare(w, 0.42); S.whoosh(w, 0.18, 0.2, false); }); });
    at(23.0, function (w) { S.rumble(w, 3.0, 0.16); });
    at(24.2, function (w) { S.boom(w, 0.45); });
    at(25.0, function (w) { S.whoosh(w, 0.5, 0.35, false); });

    /* ── ACTO III · LA CORRECCIÓN (26–35,5) ──────────────────────────────── */
    /* 06 La Torre intenta corregirlo: el mismo compás a 1,7×, disonancias
       acumuladas y el filtro cerrándose sobre él. */
    at(26.0, function (w) { S.hit(w, 0.8); musicBus.frequency.setValueAtTime(1500, w); });
    for (tb = 26; tb < 31; tb += BEAT / 3.4) (function (tb) {
      at(tb, function (w) {
        var n = Math.round(tb / (BEAT / 3.4));
        S.kick(w, n % 2 === 0 ? 0.7 : 0.38);
        if (n % 3 === 0) S.snare(w, 0.24);
        if (n % 2 === 1) S.hat(w, 0.13);
        if (n % 4 === 0) S.bass(w, BASS[(n / 4 | 0) % 8] * 0.5, 0.2);
      });
    })(tb);
    at(26.4, function (w) { tone(w, 110, 3.6, "sawtooth", 0.07, null, 104); tone(w, 233, 3.4, "square", 0.03, null, 246); });
    at(27.2, function (w) { S.screech(w, 0.9, 0.14); });
    at(28.4, function (w) { S.snare(w, 0.6); });
    at(28.8, function (w) { S.boom(w, 0.5); });
    at(29.8, function (w) { S.screech(w, 0.7, 0.12); });
    at(30.2, function (w) { musicBus.frequency.setValueAtTime(1500, w); musicBus.frequency.exponentialRampToValueAtTime(300, w + 0.5); });

    /* 07 El suelo: las grietas se encuentran, el mundo se parte y aparece el
       pozo. Sub-grave largo, piedra y el mecanismo que se abre (sin decir quién
       lo abre). */
    at(31.0, function (w) { S.boom(w, 1.0); });
    at(31.15, function (w) { S.rumble(w, 1.3, 0.2); });
    for (i = 0; i < 6; i++) (function (i) { at(31.5 + i * 0.18, function (w) { noise(w, 0.09, 0.35, "highpass", 1800 + i * 280); }); })(i);
    at(32.6, function (w) { S.boom(w, 1.0); S.whoosh(w, 0.9, 0.5, false); tone(w, 300, 1.2, "sine", 0.3, null, 60); });
    at(32.7, function (w) { S.rumble(w, 2.2, 0.22); });
    for (i = 0; i < 4; i++) (function (i) { at(33.0 + i * 0.4, function (w) { S.whoosh(w, 0.32, 0.16, i % 2 === 0); }); })(i);
    at(34.0, function (w) { tone(w, 55, 1.6, "sine", 0.2, null, 40); });

    /* ── ACTO IV · EL DESCENSO (35,5–38) ─────────────────────────────────── */
    at(35.5, function (w) { S.snare(w, 0.6); S.whoosh(w, 1.0, 0.3, true); });
    at(35.7, function (w) { S.rumble(w, 1.8, 0.2); });
    for (i = 0; i < 4; i++) (function (i) { at(36.0 + i * 0.42, function (w) { S.whoosh(w, 0.3, 0.14, i % 2 === 0); }); })(i);
    at(37.0, function (w) { S.whoosh(w, 1.2, 0.2, false); });

    /* ── ACTO V · EL REFUGIO (38–42) ─────────────────────────────────────── */
    /* Resolución: el pozo respira y el tema del menú entra con el título. */
    at(38.0, function (w) { S.hit(w, 0.9); tone(w, 220, 3.0, "sine", 0.14, null, 330); });
    at(39.4, function (w) { tone(w, 330, 2.2, "triangle", 0.07, null, 440); });
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
    /* Nueve pistas: la lámina de la torre tiene nueve plantas (dato de arte, no
       de la tabla de planos). Se conserva para las pruebas. */
    NINE_LEVELS: 9,
    SHOTS_TABLE: SHOTS.map(function (s) { return { id: s.id, from: s.from, to: s.to, name: s.name }; }),
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
