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
  var FILES = {
    vinyl: BASE + "op_01_vinyl.jpg",
    tower: BASE + "op_02_tower.jpg",
    floor: BASE + "op_03_dancefloor.jpg",
    hand: BASE + "op_04a_tempo_hand.jpg",
    smiles: BASE + "op_04b_smiles.jpg",
    vespera: BASE + "op_04c_vespera.jpg",
    boots: BASE + "op_05a_boots.jpg",
    back: BASE + "op_05b_back.jpg",
    face: BASE + "op_06_face.jpg",
    hat: BASE + "op_hat.png",
    hero: "assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png",
    logo: "assets/logos/logo_deadbeat_graffiti.png"
  };

  /* Tabla de planos de la intro: [inicio, fin, nombre]. Es la única fuente de
     tiempos; la pintura, el sonido y las pruebas la leen de aquí. */
  var INTRO_DURATION = 32;
  var SHOTS = [
    { id: 1, from: 0, to: 4, name: "aguja" },
    { id: 2, from: 4, to: 9, name: "torre" },
    { id: 3, from: 9, to: 14, name: "pista" },
    { id: 4, from: 14, to: 18, name: "insertos" },
    { id: 5, from: 18, to: 23, name: "paso tarde" },
    { id: 6, from: 23, to: 28, name: "rostro" },
    { id: 7, from: 28, to: 32, name: "titulo" }
  ];
  var DESCENT_DURATION = 7;
  var DESCENT_PHASES = [
    { id: 1, from: 0, to: 2, name: "grietas" },
    { id: 2, from: 2, to: 5.2, name: "pozo" },
    { id: 3, from: 5.2, to: 7, name: "llegada" }
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

  /* ================================================================= INTRO */
  function logoBox() {
    /* Misma caja que usa el menú (CSS .dd-menu-logo): el título se queda donde
       luego está el logotipo del menú. */
    var w = Math.min(W * 0.3, H * 0.5), h = w * 682 / 1024;
    return { x: W * 0.04, y: H * 0.05, w: w, h: h };
  }

  function drawIntro(t) {
    var st = settings();
    cx.fillStyle = C.ink; cx.fillRect(0, 0, W, H);

    if (t < 4.6) shotVinyl(t);
    if (t >= 3.7 && t < 9.5) {
      /* Fundido por forma: la etiqueta del disco se abre en círculo a la torre. */
      var open = ease(seg(t, 3.7, 4.7));
      if (open < 1) {
        cx.save(); cx.beginPath();
        cx.arc(W * 0.36, H * 0.42, Math.hypot(W, H) * open, 0, Math.PI * 2); cx.clip();
        shotTower(t); cx.restore();
      } else shotTower(t);
    }
    if (t >= 9 && t < 14) { shotFloor(t); tint(C.ink, 1 - seg(t, 9, 9.5)); }
    if (t >= 14 && t < 18) shotInserts(t, st);
    if (t >= 18 && t < 23) shotStep(t, st);
    if (t >= 23) shotFaceAndTitle(t, st);

    vignette(0.5);
    bars();
    if (t < 1.2) tint("#000", 1 - seg(t, 0.1, 1.2));
  }

  function shotVinyl(t) {
    var p = seg(t, 0, 4.6);
    var m = cover(img.vinyl, lerp(0.5, 0.56, ease(p)), 0.5, lerp(1.0, 1.2, ease(p)));
    /* El surco gira: brillos que barren el disco alrededor de la etiqueta. */
    var ox = m.x + m.w * 0.21, oy = m.y + m.h * 0.42;
    cx.save(); cx.globalCompositeOperation = "lighter"; cx.lineCap = "round";
    for (var i = 0; i < 7; i++) {
      var r = m.w * (0.13 + i * 0.045), a0 = t * 2.6 + i * 0.9;
      cx.strokeStyle = i % 2 ? "rgba(34,211,238,0.30)" : "rgba(255,45,122,0.34)";
      cx.lineWidth = Math.max(1, m.w * 0.0016);
      cx.beginPath(); cx.ellipse(ox, oy, r, r * 0.62, -0.12, a0, a0 + 0.5); cx.stroke();
      cx.beginPath(); cx.ellipse(ox, oy, r, r * 0.62, -0.12, a0 + Math.PI, a0 + Math.PI + 0.35); cx.stroke();
    }
    cx.restore();
    glow(ox, oy, m.w * 0.16, "rgba(255,45,122,0.5)", 0.25 + 0.2 * (t > 1.5 ? beatPulse(t) : 0));
  }

  function shotTower(t) {
    var p = seg(t, 4, 9.2);
    var m = portrait(img.tower, lerp(0.14, 0.8, ease(p)), 0.62);
    /* Niebla en tres bandas que derivan a distinta velocidad. */
    for (var i = 0; i < 3; i++) {
      var gx = W * (0.2 + 0.3 * i) + Math.sin(t * (0.2 + i * 0.07) + i) * W * 0.12;
      glow(gx, H * (0.92 - i * 0.05), H * (0.55 + i * 0.1), "rgba(124,58,237,0.5)", 0.22 + 0.1 * p);
    }
    glow(W / 2, m.y + m.h * 0.07, m.w * 0.5, "rgba(255,45,122,0.6)", 0.3 * (1 - p));
    tint(C.magenta, 0.05 * beatPulse(t));
    if (t > 9) tint(C.ink, seg(t, 9, 9.5));
  }

  function beams(m, t, a) {
    var ox = m.x + m.w * 0.785, oy = m.y + m.h * 0.2;
    cx.save(); cx.globalCompositeOperation = "lighter";
    for (var i = 0; i < 5; i++) {
      var an = Math.PI / 2 + Math.sin(t * (0.5 + i * 0.13) + i * 1.7) * 0.9, wd = 0.07;
      var L = H * 1.3;
      var g = cx.createLinearGradient(ox, oy, ox + Math.cos(an) * L, oy + Math.sin(an) * L);
      var col = [C.magenta, C.cyan, C.yellow, C.violet, C.magenta][i];
      g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
      cx.globalAlpha = a; cx.fillStyle = g;
      cx.beginPath(); cx.moveTo(ox, oy);
      cx.lineTo(ox + Math.cos(an - wd) * L, oy + Math.sin(an - wd) * L);
      cx.lineTo(ox + Math.cos(an + wd) * L, oy + Math.sin(an + wd) * L);
      cx.closePath(); cx.fill();
    }
    cx.restore();
  }
  function shotFloor(t) {
    var p = seg(t, 9, 14), bp = beatPulse(t);
    var bob = reduced ? 0 : -bp * H * 0.004;
    var m = cover(img.floor, 0.5, lerp(0.5, 0.56, p), lerp(1.02, 1.16, ease(p)), 1, 0, bob);
    beams(m, t, 0.16);
    glow(m.x + m.w * 0.785, m.y + m.h * 0.2, H * 0.3, "rgba(255,255,255,0.8)", 0.25 + 0.3 * bp);
    for (var i = 0; i < 3; i++) glow(W * (0.25 + i * 0.25) + Math.sin(t * 0.3 + i * 2) * W * 0.1, H * 0.86, H * 0.5, "rgba(34,211,238,0.35)", 0.16);
    tint(C.magenta, 0.06 * bp);
  }

  function shotInserts(t, st) {
    /* El último compás se repite: la imagen salta atrás un tiempo, dos veces. */
    var jump = t >= 17 && !reduced;
    var tt = t >= 17 ? 16.5 + ((t - 17) % 0.5) : t;
    if (reduced && t >= 17) tt = t - 0.5;
    var bp = beatPulse(t);
    if (tt < 15) {
      var p = seg(tt, 14, 15);
      cover(img.hand, lerp(0.42, 0.36, p), 0.48, lerp(1.06, 1.16, easeOut(p)));
      glow(W * 0.3, H * 0.75, H * 0.5, "rgba(34,211,238,0.5)", 0.12 + 0.12 * bp);
    } else if (tt < 16) {
      var p2 = seg(tt, 15, 16);
      cover(img.smiles, 0.5, 0.36, lerp(1.1, 1.2, p2));
      tint(C.magenta, 0.08 * bp);
    } else {
      var p3 = seg(tt, 16, 17);
      var m = cover(img.vespera, 0.75, lerp(0.5, 0.42, ease(p3)), lerp(1.18, 1.34, ease(p3)));
      glow(m.x + m.w * 0.83, m.y + m.h * 0.3, H * 0.16, "rgba(250,204,21,0.8)", 0.18 + 0.14 * bp);
    }
    /* Corte al compás: un destello de pintura de dos fotogramas. */
    var since = Math.min(t - 14, Math.abs(t - 15), Math.abs(t - 16), jump ? (t - 17) % 0.5 : 9);
    if (t >= 15 && t < 15.07 || t >= 16 && t < 16.07 || (jump && since < 0.06)) {
      if (st.flash) tint(jump ? C.yellow : C.bone, jump ? 0.28 : 0.2);
    }
    if (jump) {
      var k = 1 - ((t - 17) % 0.5) / 0.5;
      splat(W * 0.12, H * 0.2, H * 0.09 * easeOut(1 - k), C.yellow, 5 + Math.floor((t - 17) / 0.5), 0.9 * k);
    }
  }

  function shotStep(t, st) {
    if (t < 20.8) {
      /* Pies que pisan a la vez; cada golpe sacude el encuadre. */
      var p = seg(t, 18, 20.8), bp = beatPulse(t);
      var jolt = st.shake ? bp * H * 0.006 : 0;
      var m = cover(img.boots, lerp(0.42, 0.5, p), 0.5, lerp(1.0, 1.08, p), 1, 0, jolt);
      tint(C.ink, 0.25 * (1 - bp));
      /* La bota que llega tarde: 20,25 s, fuera del compás. */
      var late = t - 20.25;
      if (late >= 0) {
        var k = easeOut(seg(late, 0, 0.3));
        splat(m.x + m.w * 0.5, m.y + m.h * 0.8, H * 0.13 * k, C.yellow, 11, 0.85 * (1 - seg(late, 0.2, 0.5)));
        if (st.flash && late < 0.07) tint(C.yellow, 0.25);
      }
      tint(C.ink, 1 - seg(t, 18, 18.25));
    } else {
      /* Subida por la figura: de las botas al sombrero. */
      var p2 = ease(seg(t, 20.8, 22.8));
      var m2 = portrait(img.back, lerp(0.9, 0.2, p2), 0.6);
      glow(W * 0.5, m2.y + m2.h * 0.3, H * 0.6, "rgba(255,45,122,0.4)", 0.14);
      tint(C.ink, 1 - seg(t, 20.8, 21.0));
    }
  }

  function shotFaceAndTitle(t, st) {
    var p = seg(t, 23, 28), q = seg(t, 28, 30.5);
    /* Plano 6: fija, con un acercamiento mínimo. Plano 7: se abre hasta la
       composición exacta del menú (zoom 1, centro 0,5 / 0,5). */
    var zoom = t < 28 ? lerp(1.0, 1.06, p) : lerp(1.06, 1.0, easeOut(q));
    var sh = shakeOf(t, 25, 0.9, 10), sh2 = shakeOf(t, 28, 0.5, 16);
    var m = cover(img.face, 0.5, 0.5, zoom, 1, sh[0] + sh2[0], sh[1] + sh2[1]);
    /* El golpe grave llega desde abajo. */
    var boom = t >= 25 ? Math.exp(-(t - 25) * 1.6) : 0;
    if (boom > 0.01) {
      var g = cx.createLinearGradient(0, H, 0, H * 0.45);
      g.addColorStop(0, "rgba(255,45,122," + (0.55 * boom) + ")"); g.addColorStop(1, "rgba(255,45,122,0)");
      cx.save(); cx.globalCompositeOperation = "lighter"; cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore();
    }
    if (t < 23.12) tint(C.ink, 1 - seg(t, 23, 23.12));

    if (t >= 28) {
      var tq = t - 28;
      /* Lado izquierdo en sombra, como en el menú. */
      var a = ease(seg(tq, 0.2, 2.2));
      var lg = cx.createLinearGradient(0, 0, W * 0.72, 0);
      lg.addColorStop(0, "rgba(5,2,10," + (0.94 * a) + ")"); lg.addColorStop(0.5, "rgba(5,2,10," + (0.72 * a) + ")"); lg.addColorStop(1, "rgba(5,2,10,0)");
      cx.fillStyle = lg; cx.fillRect(0, 0, W, H);
      /* Salpicadura y logotipo oficial. */
      var b = logoBox(), k = easeOut(seg(tq, 0, 0.35));
      var cxm = b.x + b.w / 2, cym = b.y + b.h / 2;
      splat(cxm, cym, b.w * 0.62 * k, C.magenta, 3, 0.5 * (1 - 0.45 * seg(tq, 0.5, 2)));
      splat(cxm + b.w * 0.34, cym + b.h * 0.3, b.w * 0.2 * k, C.yellow, 8, 0.7 * (1 - 0.5 * seg(tq, 0.5, 2)));
      if (ok(img.logo)) {
        var sc = reduced ? 1 : 1 + 0.5 * Math.pow(1 - seg(tq, 0, 0.4), 2);
        cx.save(); cx.globalAlpha = seg(tq, 0, 0.12);
        cx.drawImage(img.logo, cxm - b.w * sc / 2, cym - b.h * sc / 2, b.w * sc, b.h * sc);
        cx.restore();
      }
      var ta = ease(seg(tq, 1.0, 1.9));
      if (ta > 0) {
        cx.save(); cx.globalAlpha = ta; cx.fillStyle = C.bone;
        var fs = Math.max(11, b.w / 19);
        var ff = 'px "Barlow Condensed", "Oswald", "Roboto Condensed", "Arial Narrow", "Impact", "Haettenschweiler", sans-serif';
        cx.font = "italic 800 " + fs + ff;
        var tw = cx.measureText("LA NOCHE QUE DEVORÓ EL AMANECER").width;
        if (tw > b.w) cx.font = "italic 800 " + (fs * b.w / tw) + ff;
        cx.textAlign = "center"; cx.textBaseline = "top";
        cx.shadowColor = "rgba(0,0,0,0.9)"; cx.shadowBlur = 10 * DPR;
        cx.fillText("LA NOCHE QUE DEVORÓ EL AMANECER", cxm, b.y + b.h + H * 0.012);
        cx.restore();
      }
      if (st.flash && tq < 0.09) tint("#fff", 0.55 * (1 - tq / 0.09));
    }
  }

  /* =============================================================== DESCENSO */
  function drawDescent(t) {
    var st = settings();
    cx.fillStyle = C.ink; cx.fillRect(0, 0, W, H);
    if (t < 2) descentCracks(t, st); else descentShaft(t, st);
    vignette(0.55);
    bars();
    if (t < 0.35) tint(C.ink, 1 - t / 0.35);
    /* Fundido de color hacia el Refugio. */
    if (t > 6.15) tint("#3a0d2c", ease(seg(t, 6.15, 6.9)));
  }

  function descentCracks(t, st) {
    var p = seg(t, 0, 2);
    var s1 = shakeOf(t, 0, 0.7, 12), s2 = shakeOf(t, 1, 0.9, 20);
    var m = portrait(img.back, lerp(0.62, 0.84, ease(p)), 0.6, s1[0] + s2[0], s1[1] + s2[1]);
    var fx = m.x + m.w * 0.5, fy = m.y + m.h * 0.93;
    var R = m.w * lerp(0.2, 0.62, easeOut(p));
    cx.save(); cx.globalCompositeOperation = "lighter"; cx.lineCap = "round"; cx.lineJoin = "round";
    /* Mecanismo circular: anillo en perspectiva y dientes que giran. */
    cx.strokeStyle = "rgba(255,45,122,0.9)"; cx.lineWidth = Math.max(2, m.w * 0.008);
    cx.beginPath(); cx.ellipse(fx, fy, R, R * 0.3, 0, 0, Math.PI * 2); cx.stroke();
    cx.strokeStyle = "rgba(250,204,21,0.85)"; cx.lineWidth = Math.max(2, m.w * 0.005);
    for (var i = 0; i < 12; i++) {
      var an = i / 12 * Math.PI * 2 + t * 1.4, r1 = R * 0.74, r2 = R * lerp(0.74, 0.3, ease(p));
      cx.beginPath(); cx.moveTo(fx + Math.cos(an) * r1, fy + Math.sin(an) * r1 * 0.3);
      cx.lineTo(fx + Math.cos(an + 0.35) * r2, fy + Math.sin(an + 0.35) * r2 * 0.3); cx.stroke();
    }
    /* Grietas de luz que salen de debajo de las botas. */
    for (var c = 0; c < 9; c++) {
      var a0 = rnd(c * 3.3) * Math.PI * 2, len = m.w * (0.3 + rnd(c) * 0.7) * easeOut(seg(t, c * 0.08, 1.7));
      var x = fx, y = fy;
      cx.strokeStyle = c % 3 ? "rgba(255,45,122,0.95)" : "rgba(250,204,21,0.95)";
      cx.lineWidth = Math.max(1.5, m.w * (0.004 + rnd(c * 2) * 0.006));
      cx.beginPath(); cx.moveTo(x, y);
      for (var k = 1; k <= 6; k++) {
        var aa = a0 + (rnd(c * 10 + k) - 0.5) * 0.9;
        x += Math.cos(aa) * len / 6; y += Math.sin(aa) * len / 6 * 0.32; cx.lineTo(x, y);
      }
      cx.stroke();
    }
    cx.restore();
    glow(fx, fy, R * 1.5, "rgba(255,120,180,0.9)", 0.25 + 0.5 * p);
    if (st.flash && t > 1.86) tint(C.bone, seg(t, 1.86, 2) * 0.9);
  }

  /* Profundidad recorrida (en alturas de pantalla): acelera, cruza y frena. */
  function depthAt(t) {
    var u = clamp(t - 2, 0, 5);
    if (u < 0.5) return 1.6 * u * u;                       /* arranque */
    if (u < 3.2) return 0.4 + 1.6 * (u - 0.5);             /* velocidad de crucero */
    var b = Math.min(u - 3.2, 1.1);                        /* frenada */
    return 4.72 + 1.6 * b - (1.6 / 2.2) * b * b;
  }
  function descentShaft(t, st) {
    var d = depthAt(t), u = t - 2;
    var g = cx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1b0830"); g.addColorStop(0.5, "#0b0416"); g.addColorStop(1, "#05020a");
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    glow(W / 2, -H * 0.1 - d * H * 0.25, H * 0.7, "rgba(255,45,122,0.8)", 0.5 * (1 - seg(u, 0, 2.5)));

    /* Fondo del pozo: la propia lámina de la torre (sus plantas encendidas),
       en mosaico vertical y espejada a cada lado del hueco central. */
    if (ok(img.tower)) {
      var tw = W * 0.5, th = tw * 0.62 * img.tower.naturalHeight / img.tower.naturalWidth;
      var sy0 = img.tower.naturalHeight * 0.17, sh0 = img.tower.naturalHeight * 0.62;
      var sc0 = (d * H * 0.4) % th;
      cx.save(); cx.globalAlpha = 0.62;
      for (var ti = -1; ti < Math.ceil(H / th) + 1; ti++) {
        var ty = ti * th - sc0 + th;
        cx.drawImage(img.tower, 0, sy0, img.tower.naturalWidth, sh0, -tw * 0.42, ty - th, tw, th);
        cx.save(); cx.translate(W, 0); cx.scale(-1, 1);
        cx.drawImage(img.tower, 0, sy0, img.tower.naturalWidth, sh0, -tw * 0.42, ty - th * 1.5, tw, th);
        cx.restore();
      }
      cx.restore();
      var cg = cx.createLinearGradient(W * 0.22, 0, W * 0.78, 0);
      cg.addColorStop(0, "rgba(7,3,13,0)"); cg.addColorStop(0.3, "rgba(9,4,18,0.96)"); cg.addColorStop(0.7, "rgba(9,4,18,0.96)"); cg.addColorStop(1, "rgba(7,3,13,0)");
      cx.fillStyle = cg; cx.fillRect(0, 0, W, H);
    }
    /* Paredes cercanas en dos planos: balcones encendidos con barandilla y
       siluetas, y vigas. Todo sale de la misma semilla. */
    var layers = [{ par: 0.8, wall: 0.17, sc: 0.8, a: 0.9 }, { par: 1.25, wall: 0.085, sc: 1.15, a: 1 }];
    var cols = [C.magenta, C.cyan, C.yellow, C.violet];
    for (var li = 0; li < layers.length; li++) {
      var L = layers[li], fh = H * 0.46 * L.sc, scroll = d * H * L.par;
      var first = Math.floor(scroll / fh) - 1;
      cx.save(); cx.globalAlpha = L.a;
      for (var side = 0; side < 2; side++) {
        var wx = side ? W * (1 - L.wall) : 0, ww = W * L.wall;
        cx.fillStyle = li === 1 ? "#0a0512" : "#120820";
        cx.fillRect(wx, 0, ww, H);
        for (var f = first; f < first + Math.ceil(H / fh) + 3; f++) {
          var y = f * fh - scroll, sd = f * 13.7 + side * 5.1 + li * 31;
          var col = cols[Math.floor(rnd(sd) * 4)];
          var bw = ww * (0.5 + rnd(sd + 1) * 0.35), bh = fh * 0.42;
          var bx = side ? wx : wx + ww - bw, by = y + fh * 0.2;
          cx.fillStyle = col; cx.globalAlpha = L.a * (0.5 + 0.4 * rnd(sd + 2));
          cx.fillRect(bx, by, bw, bh);
          cx.globalAlpha = L.a;
          cx.fillStyle = "rgba(5,2,10,0.55)"; cx.fillRect(bx, by, bw, bh * 0.3);
          cx.strokeStyle = "#030108"; cx.lineWidth = Math.max(2, H * 0.005 * L.sc);
          cx.strokeRect(bx, by, bw, bh);
          /* siluetas y barandilla */
          cx.fillStyle = "#030108";
          for (var n = 0; n < 4; n++) {
            if (rnd(sd + n * 2.3) < 0.35) continue;
            var px = bx + bw * (0.12 + n * 0.24), ph = bh * (0.5 + rnd(sd + n) * 0.2);
            cx.fillRect(px - bh * 0.07, by + bh - ph, bh * 0.14, ph);
            cx.beginPath(); cx.arc(px, by + bh - ph, bh * 0.09, 0, Math.PI * 2); cx.fill();
          }
          cx.fillRect(bx, by + bh * 0.72, bw, Math.max(2, bh * 0.05));
          for (var r = 0; r < 9; r++) cx.fillRect(bx + bw * r / 9, by + bh * 0.72, Math.max(1.5, bw * 0.012), bh * 0.28);
          /* viga */
          cx.fillStyle = "#06030c"; cx.fillRect(wx, y + fh * 0.86, ww, fh * 0.07);
          cx.fillStyle = col; cx.globalAlpha = L.a * 0.5; cx.fillRect(wx, y + fh * 0.86, ww, Math.max(1, fh * 0.008)); cx.globalAlpha = L.a;
        }
        cx.fillStyle = "#030108"; cx.fillRect(side ? wx : wx + ww - Math.max(3, W * 0.004), 0, Math.max(3, W * 0.004), H);
      }
      cx.restore();
    }

    /* Suelo del Refugio que sube al encuentro de la plataforma. */
    var platY = H * 0.74;
    var arrive = seg(u, 3.2, 4.3);
    if (arrive > 0) {
      var fyy = lerp(H * 1.5, platY + H * 0.02, easeOut(arrive));
      var fg = cx.createLinearGradient(0, fyy, 0, H);
      fg.addColorStop(0, "#7a1f4a"); fg.addColorStop(1, "#2a0a24");
      cx.fillStyle = fg; cx.fillRect(0, fyy, W, H - fyy + 2);
      cx.fillStyle = "#030108"; cx.fillRect(0, fyy - Math.max(3, H * 0.006), W, Math.max(3, H * 0.006));
      glow(W / 2, fyy, H * 0.6, "rgba(255,45,122,0.7)", 0.3 * arrive);
    }

    /* Líneas de velocidad. */
    var speed = clamp((depthAt(t + 0.05) - d) / 0.08, 0, 1);
    if (!reduced && speed > 0.05) {
      cx.save(); cx.globalAlpha = 0.35 * speed; cx.strokeStyle = C.bone; cx.lineWidth = Math.max(1, H * 0.002);
      for (var s = 0; s < 26; s++) {
        var sx = W * (0.2 + rnd(s * 1.9) * 0.6), sy = ((rnd(s) * H * 2 - d * H * 2.4) % (H * 1.4) + H * 1.4) % (H * 1.4) - H * 0.2;
        cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(sx, sy + H * 0.14 * speed); cx.stroke();
      }
      cx.restore();
    }

    /* Plataforma de servicio con cadenas. */
    var sway = reduced ? 0 : Math.sin(t * 5) * H * 0.003 * speed;
    var sh = shakeOf(t, 6.1, 0.5, 14);
    var pxm = W / 2 + sh[0], pym = platY + sway + sh[1], pr = H * 0.26;
    cx.strokeStyle = "#030108"; cx.lineWidth = Math.max(3, H * 0.007);
    for (var cI = -1; cI <= 1; cI += 2) { cx.beginPath(); cx.moveTo(pxm + cI * pr * 0.92, pym); cx.lineTo(pxm + cI * pr * 0.7, -10); cx.stroke(); }
    cx.strokeStyle = "rgba(244,236,216,0.35)"; cx.lineWidth = Math.max(1, H * 0.002); cx.setLineDash([H * 0.012, H * 0.012]);
    for (var cJ = -1; cJ <= 1; cJ += 2) { cx.beginPath(); cx.moveTo(pxm + cJ * pr * 0.92, pym); cx.lineTo(pxm + cJ * pr * 0.7, -10); cx.stroke(); }
    cx.setLineDash([]);
    cx.fillStyle = "#030108"; cx.beginPath(); cx.ellipse(pxm, pym + pr * 0.1, pr, pr * 0.25, 0, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = "#241036"; cx.beginPath(); cx.ellipse(pxm, pym, pr, pr * 0.25, 0, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = C.magenta; cx.lineWidth = Math.max(2, H * 0.005);
    cx.beginPath(); cx.ellipse(pxm, pym, pr * 0.96, pr * 0.235, 0, 0, Math.PI * 2); cx.stroke();
    cx.strokeStyle = "#030108"; cx.lineWidth = Math.max(3, H * 0.006);
    cx.beginPath(); cx.ellipse(pxm, pym, pr, pr * 0.25, 0, 0, Math.PI * 2); cx.stroke();
    glow(pxm, pym, pr * 1.2, "rgba(255,45,122,0.6)", 0.22);

    /* El Desafinado, ya sin sombrero: el fotograma IDLE aceptado (07B). */
    var hh = H * 0.4, hw = hh * 288 / 512, feet = 504 / 512;
    var hx = pxm - hw * 0.49, hy = pym - hh * feet + pr * 0.02;
    if (ok(img.hero)) cx.drawImage(img.hero, hx, hy, hw, hh);
    /* El sombrero se desprende y se queda arriba. */
    var hatP = seg(u, 0, 2.4);
    if (hatP < 1 && ok(img.hat)) {
      var headX = hx + hw * 0.5, headY = hy + hh * 0.1;
      var hatW = hw * 0.62 * lerp(1, 0.75, hatP), hatH = hatW * img.hat.naturalHeight / img.hat.naturalWidth;
      var rise = H * 0.7 * Math.pow(hatP, 1.3);   /* se separa despacio: debe verse cómo se queda arriba */
      cx.save();
      cx.translate(headX + Math.sin(u * 3.1) * hw * 0.5 * hatP, headY - rise);
      cx.rotate(reduced ? 0 : Math.sin(u * 2.4) * 0.5 + hatP * 1.1);
      cx.drawImage(img.hat, -hatW / 2, -hatH / 2, hatW, hatH);
      cx.restore();
    }
    if (st.flash && u < 0.15) tint(C.bone, 0.9 * (1 - u / 0.15));
  }

  /* ================================================================= SONIDO */
  var ac = null, master = null, musicBus = null, noiseBuf = null;
  function audioReady() {
    var st = settings();
    if (st.muted) return false;
    try {
      if (!ac) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ac = new AC();
        master = ac.createGain(); master.connect(ac.destination);
        var n = ac.sampleRate * 1.5; noiseBuf = ac.createBuffer(1, n, ac.sampleRate);
        var dta = noiseBuf.getChannelData(0);
        for (var i = 0; i < n; i++) dta[i] = Math.random() * 2 - 1;
      }
      if (ac.state === "suspended") ac.resume();
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setValueAtTime(0.5 * st.vol, ac.currentTime);
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
     mismo reloj que la imagen: si la imagen se retrasa, el sonido también. */
  function buildIntroScore() {
    var ev = [], i, tb;
    function at(t, fn) { ev.push({ t: t, fn: fn }); }
    for (i = 0; i < 40; i++) at(0.15 + i * 0.22 + rnd(i) * 0.1, function (w) { S.crackle(w, 0.12); });
    at(0.05, function (w) { noise(w, 0.12, 0.3, "bandpass", 1800); });
    /* Bombo lejano que se acerca (1,5 – 9 s); entra el bajo (6 s). */
    for (tb = 1.5; tb < 9; tb += BEAT) (function (tb) {
      at(tb, function (w) { S.kick(w, lerp(0.12, 0.7, seg(tb, 1.5, 9)), musicBus); });
    })(tb);
    for (tb = 6; tb < 9; tb += BEAT / 2) (function (tb, n) {
      at(tb, function (w) { S.bass(w, BASS[n % 8], lerp(0.05, 0.22, seg(tb, 6, 9)), musicBus); });
    })(tb, Math.round((tb - 6) / (BEAT / 2)));
    /* Tema completo (9 – 17 s). */
    function bar(t0, len) {
      for (var s = 0; s < len / (BEAT / 2); s++) (function (tt, n) {
        at(tt, function (w) {
          if (n % 2 === 0) S.kick(w, 0.75, musicBus); else S.hat(w, 0.16, musicBus);
          if (n % 4 === 2) S.snare(w, 0.28, musicBus);
          S.bass(w, BASS[n % 8], 0.22, musicBus);
          if (n % 2 === 0) S.lead(w, LEAD[(n / 2) % 8], 0.07, musicBus);
        });
      })(t0 + s * (BEAT / 2), Math.round((t0 - 9) / (BEAT / 2)) + s);
    }
    bar(9, 8);
    /* La repetición: el último tiempo (16,5 – 17) suena dos veces más. */
    function stutter(t0) {
      at(t0, function (w) { S.kick(w, 0.75, musicBus); S.bass(w, BASS[6], 0.22, musicBus); S.lead(w, LEAD[3], 0.09, musicBus); });
      at(t0 + 0.25, function (w) { S.hat(w, 0.16, musicBus); S.bass(w, BASS[7], 0.22, musicBus); });
    }
    stutter(17); stutter(17.5);
    /* Plano 5: la música queda detrás de un filtro; los pasos son el bombo. */
    at(18, function (w) { musicBus.frequency.setValueAtTime(18000, w); musicBus.frequency.exponentialRampToValueAtTime(420, w + 0.4); });
    for (tb = 18; tb < 23; tb += BEAT) (function (tb) {
      at(tb, function (w) { S.kick(w, 0.8, musicBus); noise(w, 0.08, 0.2, "lowpass", 500, 0, null); });
      at(tb + 0.25, function (w) { S.bass(w, BASS[Math.round(tb * 2) % 8], 0.2, musicBus); });
    })(tb);
    at(20.25, function (w) { S.snare(w, 0.6); });              /* el paso fuera de tiempo */
    /* Plano 6: la música se corta en seco. */
    at(22.98, function (w) { musicBus._gain.gain.setValueAtTime(1, w); musicBus._gain.gain.linearRampToValueAtTime(0.0001, w + 0.03); });
    at(25, function (w) { S.boom(w, 0.9); });                  /* golpe grave desde abajo */
    at(28, function (w) { S.hit(w, 0.9); });                   /* golpe final: título */
    ev.sort(function (a, b) { return a.t - b.t; });
    return ev;
  }
  function buildDescentScore() {
    var ev = [];
    function at(t, fn) { ev.push({ t: t, fn: fn }); }
    at(0, function (w) { S.boom(w, 0.9); });
    at(1, function (w) { S.boom(w, 1.0); noise(w, 0.5, 0.3, "highpass", 2000, 600); });
    at(0.3, function (w) { S.rumble(w, 1.7, 0.18); });
    at(1.95, function (w) { S.whoosh(w, 0.9, 0.5, false); tone(w, 300, 1.2, "sine", 0.3, null, 60); });
    at(2.4, function (w) { S.rumble(w, 2.9, 0.22); });
    for (var i = 0; i < 6; i++) (function (i) { at(2.6 + i * 0.45, function (w) { S.whoosh(w, 0.3, 0.14, i % 2 === 0); }); })(i);
    at(5.2, function (w) { S.screech(w, 0.9, 0.16); });
    at(6.1, function (w) { tone(w, 90, 0.5, "sine", 0.8, null, 36); noise(w, 0.3, 0.3, "lowpass", 400, 80); });
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
    if (seq.type === "intro" && !seq.titleFired && seq.t >= 28) {
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
