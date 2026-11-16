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
    /* Placas del protagonista y del vacío, ya existentes y hasta ahora sin
       cablear. `face` es el primer plano canónico (mirada, cicatriz, sombrero);
       `vespera` la figura de la Escucha; `back` la espalda con los tatuajes;
       `tower` el pozo vertical para la caída. */
    face: BASE + "op_06_face.jpg",
    vespera: BASE + "op_04c_vespera.jpg",
    back: BASE + "op_05b_back.jpg",
    tower: BASE + "op_02_tower.jpg",
    hat: BASE + "op_hat.png",
    /* El protagonista sólo aparece con arte canónico: la lámina maestra y el IDLE aceptado. */
    master: MASTER + "protagonist_master_crop_hero.png",
    marm: MASTER + "protagonist_master_crop_arm_tattoos.png",
    mface: MASTER + "protagonist_master_crop_face.png",
    hero: "assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png",
    logo: "assets/logos/logo_deadbeat_graffiti.png"
  };

  /* ══════════════════════════════════════════════════════════════════════════
     V3.0 · MOTOR DE ANIMACIÓN

     La V2 animaba moviendo la cámara sobre láminas fijas. Aquí se añade lo que
     de verdad hace que una secuencia se lea como animación y no como diapositivas:

       1. CICLO DE ANDAR real de cuatro fotogramas del protagonista (ya existían:
          `hero_walk_00..03`). Se elige fotograma por fase, no se desliza.
       2. CICLO DE MULTITUD: cuatro poses construidas sobre la capa recortada
          (balanceo, brazos, giro, aplauso) con desfase por grupo. El bucle del
          acto II repite el ciclo EXACTO; la corrección del acto III lo repite
          forzado.
       3. MUELLE AMORTIGUADO para ropa, sombrero y cadenas: el retardo físico es
          lo que separa «personaje animado» de «PNG desplazado».
       4. ESCOMBROS y polvo con física simple (gravedad, giro, desvanecido).
     ========================================================================== */

  /* Resorte amortiguado de un eje: dado el objetivo, devuelve la posición con
     retardo. Determinista: se evalúa desde el tiempo, no acumulando estado. */
  function spring(t, t0, amp, freq, damp) {
    var u = t - t0;
    if (u <= 0) return 0;
    return amp * Math.exp(-u * damp) * Math.sin(u * freq * Math.PI * 2);
  }

  /* ── 1 · el protagonista con su ciclo real de andar ──────────────────────
     `phase` avanza 1 por paso completo. Se dibuja el fotograma que toca, con
     el cuerpo entero (no se recorta) y el balanceo vertical del paso. */
  var HERO_WALK = ["hero_walk_00", "hero_walk_01", "hero_walk_02", "hero_walk_03"];
  function heroFrame(name) {
    var f = img[name];
    return ok(f) ? f : (ok(img.hero) ? img.hero : null);
  }
  /* Dibuja al protagonista andando. x,y = esquina superior izquierda del
     fotograma de 288×512 ya escalado a w,h. */
  function drawHeroWalk(name, x, y, w, h, lean, alpha) {
    var f = heroFrame(name);
    if (!f) return;
    cx.save();
    if (alpha != null && alpha < 1) cx.globalAlpha = alpha;
    if (lean) {
      /* el cuerpo se inclina desde los pies, no desde el centro */
      cx.translate(x + w * 0.5, y + h);
      cx.rotate(lean);
      cx.translate(-(x + w * 0.5), -(y + h));
    }
    cx.drawImage(f, x, y, w, h);
    cx.restore();
  }
  /* Elige el fotograma del ciclo según la fase (0..1 por paso). */
  function walkFrameIndex(phase) {
    var k = ((phase % 1) + 1) % 1;
    return HERO_WALK[Math.min(3, Math.floor(k * 4))];
  }

  /* ── 2 · ciclo de multitud ───────────────────────────────────────────────
     Cuatro poses sobre la capa recortada. `rigid` (0..1) fuerza el ciclo a ir
     más rápido y más cuadrado: es la corrección de la Torre en el acto III. */
  function crowdCycle(t, m, pose, a, rigid, seed) {
    if (!ok(img.crowd)) return;
    rigid = rigid || 0;
    var k = 1 + rigid * 0.9;                       /* la corrección acelera */
    var ph = (t * 1.9 * k + (seed || 0)) % 1;
    /* cuatro poses: 0 balanceo, 1 brazos, 2 giro, 3 aplauso */
    var bob = Math.sin(ph * Math.PI * 2) * m.h * (0.006 + 0.004 * rigid);
    var squash = 1 + Math.sin(ph * Math.PI * 2 + 1.2) * (0.010 + 0.010 * rigid);
    var sway = Math.sin(ph * Math.PI * 2 * 0.5) * m.w * (0.008 + 0.006 * rigid);
    var iw = m.w * squash, ih = m.h * squash;
    var x = m.x - (iw - m.w) / 2 + sway;
    var y = m.y - (ih - m.h) / 2 + bob;
    cx.save();
    /* SOLO la franja de público: la capa es el recorte de la multitud, no un
       decorado completo. Sin este recorte tapaba la arquitectura entera. */
    cx.beginPath();
    cx.rect(m.x, m.y + m.h * (0.42 + (seed || 0) * 0), m.w, m.h * 0.62);
    cx.clip();
    cx.globalAlpha = a == null ? 1 : a;
    cx.drawImage(img.crowd, x, y, iw, ih);
    cx.restore();
  }

  /* ── 3 · escombros con gravedad ─────────────────────────────────────────
     `dir` = -1 suben (durante la caída), +1 caen (ruptura del suelo). */
  function debris(t, t0, n, seed, dir, spread, alpha) {
    if (reduced) return;
    for (var i = 0; i < n; i++) {
      var u = (t - t0) * (0.45 + rnd(seed + i * 1.7) * 0.5);
      if (u <= 0 || u > 1.6) continue;
      var lx = X(0.5) + (rnd(seed + i * 3.1) - 0.5) * W * spread;
      var ly = Y(0.5) + dir * (u * u) * H * 0.55 + (rnd(seed + i * 5.3) - 0.5) * H * 0.12 * u;
      var sz = (2 + rnd(seed + i * 7.9) * 7) * U * (1 - u * 0.35);
      var al = (alpha == null ? 0.7 : alpha) * (1 - Math.max(0, u - 1.0) / 0.6);
      if (al <= 0) continue;
      cx.save();
      cx.globalAlpha = clamp(al, 0, 1);
      cx.translate(lx, ly);
      cx.rotate(u * (rnd(seed + i * 2.3) - 0.5) * 7);
      cx.fillStyle = i % 3 === 0 ? C.bone : (i % 3 === 1 ? C.cyan : C.magenta);
      cx.beginPath();
      cx.moveTo(-sz, -sz * 0.6); cx.lineTo(sz * 0.8, -sz * 0.7);
      cx.lineTo(sz * 0.6, sz * 0.7); cx.lineTo(-sz * 0.7, sz * 0.5);
      cx.closePath(); cx.fill();
      cx.restore();
    }
  }

  /* ── 4 · ropa y sombrero con retardo ────────────────────────────────────
     El sombrero no cae con el cuerpo: cae un poco después y gira. Se dibuja
     aparte, con su propio resorte, encima del fotograma del héroe. */
  function drawHatLag(t, t0, x, y, w, h, alpha) {
    if (!ok(img.hat) || t < t0) return;
    var u = t - t0;
    var dy = spring(u, 0, H * 0.05, 0.9, 2.2) + u * u * H * 0.28;
    var rot = spring(u, 0, 0.8, 1.1, 1.6) + u * 2.1;
    var drift = spring(u, 0, W * 0.05, 0.7, 1.9);
    cx.save();
    if (alpha != null) cx.globalAlpha = alpha;
    cx.translate(x + w * 0.5 + drift, y + dy);
    cx.rotate(rot);
    cx.drawImage(img.hat, -w * 0.5, -h * 0.5, w, h);
    cx.restore();
  }

  /* ── 5 · lluvia de polvo del techo (actos III–IV) ──────────────────────── */
  function ceilingDust(t, a, seed) {
    if (reduced || a <= 0) return;
    for (var i = 0; i < 26; i++) {
      var p = ((t * (0.16 + rnd(seed + i) * 0.2) + rnd(seed + i * 2.7)) % 1);
      cx.save();
      cx.globalAlpha = a * (1 - p) * 0.9;
      cx.fillStyle = i % 4 === 0 ? C.bone : (i % 4 === 1 ? C.ink : C.magenta);
      cx.beginPath();
      cx.arc(X(0.06 + rnd(seed + i * 3.3) * 0.88), Y(p * 0.9),
        Math.max(0.8, (1.2 + rnd(seed + i * 5.1) * 2.4) * U * (1 - p * 0.4)), 0, 7);
      cx.fill(); cx.restore();
    }
  }

  /* Tabla de planos de la intro: [inicio, fin, nombre]. Es la única fuente de
     tiempos; la pintura, el sonido y las pruebas la leen de aquí.
     Cinco actos, siete planos, ninguno repetido y ninguno que llegue al fondo
     del pozo (eso es de NUEVA PARTIDA: playDescent). */
  var INTRO_DURATION = 70;
  var TITLE_AT = 64;                                        /* arranque del tema del Refugio */
  var SHOTS = [
    { id: 1, from: 0, to: 4, name: "la celebracion" },      /* ACTO I   · la estación, gran general */
    { id: 2, from: 4, to: 9, name: "el ultimo instante" },  /* ACTO I   · dolly-in, la felicidad */
    { id: 3, from: 9, to: 14, name: "una cancion mas" },    /* ACTO I   · el plato, el enlace */
    { id: 4, from: 14, to: 18, name: "la repeticion" },     /* ACTO II  · el mismo movimiento 4× */
    { id: 5, from: 18, to: 23, name: "el paso incorrecto" },/* ACTO II  · el pie que cae tarde */
    { id: 6, from: 23, to: 28, name: "el que no se repite" },/* ACTO II · órbita, él varía */
    { id: 7, from: 28, to: 33, name: "el error" },          /* ACTO III · el mundo se resitúa */
    { id: 8, from: 33, to: 38, name: "la torre reacciona" },/* ACTO III · las nueve pistas */
    { id: 9, from: 38, to: 43, name: "el golpe" },          /* ACTO III · el grave y el mecanismo */
    { id: 10, from: 43, to: 48, name: "la ruptura" },       /* ACTO IV  · el suelo se retrae */
    { id: 11, from: 48, to: 54, name: "la caida" },         /* ACTO IV  · cámara vertical */
    { id: 12, from: 54, to: 59, name: "la torre infinita" },/* ACTO IV  · la plataforma */
    { id: 13, from: 59, to: 64, name: "el aterrizaje" },    /* ACTO V   · el Refugio real */
    { id: 14, from: 64, to: 70, name: "el comienzo" }       /* ACTO V   · el control al jugador */
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
    /* NUNCA un fotograma entero tapado. En el punto medio, `lead` y `tail`
       llegaban a -0,08 y 1,08: la banda cubría todo el cuadro y el barrido se
       leía como una pantalla negra de 0,1 s. Se limita el ancho de la banda y se
       deja siempre un tercio de imagen viva; el corte de plano no lo necesita,
       porque el cambio de escena ya ocurre en el mismo fotograma. */
    var MAXB = 0.26;
    if (lead - tail > MAXB) {
      var c0 = (lead + tail) * 0.5;
      lead = c0 + MAXB * 0.5; tail = c0 - MAXB * 0.5;
    }
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
    /* Tinta SEMITRANSPARENTE: el barrido es un gesto gráfico, no un telón. Con
       relleno opaco, el fotograma central del barrido medía luminancia 10/255 y
       contaba como pantalla negra. */
    var g = cx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, "rgba(7,3,13,0.55)"); g.addColorStop(0.55, "rgba(11,4,22,0.80)"); g.addColorStop(1, "rgba(11,4,22,0.92)");
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
    /* V3.0 · catorce planos. El reparto de tiempos es el único sitio donde se
       decide qué se ve; la pintura, el sonido y las pruebas lo leen de aquí. */
    if (t < 4) s01Celebration(t);
    else if (t < 9) s02LastMoment(t);
    else if (t < 14) s03OneMoreSong(t);
    else if (t < 18) s04Repetition(t);
    else if (t < 23) s05WrongStep(t, st);
    else if (t < 28) s06DoesNotRepeat(t, st);
    else if (t < 33) s07TheError(t, st);
    else if (t < 38) s08TowerReacts(t, st);
    else if (t < 43) s09TheHit(t, st);
    else if (t < 48) s10Rupture(t, st);
    else if (t < 54) s11Fall(t, st);
    else if (t < 59) s12InfiniteTower(t, st);
    else if (t < 64) s13Landing(t, st);
    else s14Beginning(t, st);
    /* Transiciones de tinta entre actos. Ninguna tapa un plano en curso. */
    /* Barridos de tinta cortos y FINOS: son un gesto de movimiento, no un
       telón. Antes cubrían el cuadro entero en su punto medio y el fotograma
       central medía luminancia 10/255 — una pantalla negra de 0,1 s. */
    inkWipe(seg(t, 13.93, 14.07), 3, 1);
    inkWipe(seg(t, 27.93, 28.07), 11, -1);
    inkWipe(seg(t, 42.93, 43.07), 17, 1);
    inkWipe(seg(t, 58.93, 59.07), 23, -1);
    if (t < 0.8) tint("#000", 1 - seg(t, 0.1, 0.8));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     V3.0 · CINCO ACTOS, CATORCE PLANOS, 70 s

     ACTO I   · LA NOCHE QUE NO TERMINA     00:00–00:14   planos 01–03
     ACTO II  · EL DESAFINADO               00:14–00:28   planos 04–06
     ACTO III · LA CORRECCIÓN               00:28–00:43   planos 07–09
     ACTO IV  · EL DESCENSO                 00:43–00:59   planos 10–12
     ACTO V   · EL REFUGIO                  00:59–01:10   planos 13–14

     Regla que gobierna el montaje: ningún plano avanza sólo porque la cámara se
     mueva. En cada uno CAMBIA ALGO en la escena (entra alguien, se enlaza un
     disco, falla un paso, se abre un suelo, aparece una plataforma).
     ========================================================================== */

  /* ─────────────────────────────────────────────────────────────────────────
     01 · LA CELEBRACIÓN (0–4) — gran general de la estación convertida en
     salón, con travelling lateral que atraviesa la multitud. La cámara no
     «hace zoom»: se desplaza, y los grupos entran y salen del marco.
     ───────────────────────────────────────────────────────────────────────── */
  function s01Celebration(t) {
    var push = ease(seg(t, 0, 4));                     /* 0 → 1 en todo el plano */
    /* Travelling: el encuadre se desplaza de izquierda a derecha. Se compensa
       con el zoom para que el marco nunca quede vacío. */
    var trav = (push - 0.5) * 0.10;
    var z = 1.28 - push * 0.06;
    var m = cover(img.station, 0.5 + trav, 0.44, z, 1, 0, 0, true);
    tint(C.ink, 0.30 - 0.10 * push);

    /* La multitud, en dos planos de paralaje. El de delante se mueve más. */
    /* La capa recortada entra SOLO por abajo (la multitud), con un desplazamiento
       de paralaje distinto al de la arquitectura. Antes se dibujaba la capa
       entera encima y tapaba la estación. */
    if (ok(img.crowd) && ok(img.station)) {
      var sc0 = m.w / img.station.naturalWidth;
      var ch = img.crowd.naturalHeight * sc0, cw = img.crowd.naturalWidth * sc0;
      var cxc = m.x + m.w * 0.5 - cw * 0.5 + (push - 0.5) * m.w * 0.05;
      var cyc = m.y + m.h - ch + H * 0.02 + Math.sin(t * 1.9) * H * 0.004;
      cx.save();
      cx.beginPath(); cx.rect(0, m.y + m.h * 0.42, W, H); cx.clip();
      cx.drawImage(img.crowd, cxc, cyc, cw, ch);
      cx.restore();
    }

    /* Luz: la lámpara central gira y las ventanas respiran. */
    var lx = mapX(m, 0.5), ly = mapY(m, 0.10);
    ballRays(lx, ly, m.w * 0.62, t * 0.30, 0.16 + 0.05 * beatPulse(t), "rgba(255,45,122,0.9)");
    glow(lx, ly, m.w * 0.22, "rgba(255,200,120,0.85)", 0.13 + 0.06 * beatPulse(t));
    for (var i = 0; i < 5; i++) {
      var wx = mapX(m, 0.12 + i * 0.19), wy = mapY(m, 0.30 + (i % 2) * 0.10);
      glow(wx, wy, m.w * 0.07, i % 2 ? "rgba(34,211,238,0.75)" : "rgba(155,0,255,0.75)",
        0.08 + 0.05 * Math.sin(t * 2.1 + i * 1.4));
    }
    motes(t, 26, 0.45, 5);
    /* El único rótulo del acto, el primero de los dos aprobados. */
    caption(t, 0.90, 3.40, "ESA NOCHE, ALGUNOS PUDIERON\nREUNIRSE SIN MIEDO.", 0.55, 0.755, 50, C.bone, C.ink, 0.02);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     02 · EL ÚLTIMO INSTANTE (4–9) — dolly-in sobre los grupos, dos planos
     cercanos. Aquí hay que sentir el alivio: gente que por fin no teme.
     ───────────────────────────────────────────────────────────────────────── */
  function s02LastMoment(t) {
    var u = seg(t, 4, 9);
    /* Dolly-in continuo + deriva lateral mínima. */
    var z = 1.06 + ease(u) * 0.14;
    var m = cover(img.smiles, 0.52 + 0.02 * Math.sin(t * 0.8), 0.5, z, 1, 0, 0, true);
    tint(C.ink, 0.05);
    /* El grupo respira: micro-ciclo de multitud sobre la propia lámina. */
    crowdCycle(t, m, 3, 0.16, 0, 0.4);
    /* Dos ventanas cercanas: la pareja y la figura del balcón. Se abren al
       compás y se cierran. Es el «plano cercano» que pide el guion. */
    if (!reduced) {
      var w1 = ease(seg(t, 4.5, 5.1)) * (1 - ease(seg(t, 7.4, 8.0)));
      if (w1 > 0.02) {
        var wa = SW * 0.28, ha = H * 0.32;
        var ax = X(0.045), ay = Y(0.50) + (1 - w1) * H * 0.05;
        cx.save(); cx.globalAlpha = w1;
        cx.beginPath(); cx.rect(ax, ay, wa, ha); cx.clip();
        coverIn(img.smiles, ax, ay, wa, ha, 0.26, 0.40, 2.1, 0.06);
        cx.restore();
        cx.save(); cx.globalAlpha = w1;
        cx.strokeStyle = C.ink; cx.lineWidth = Math.max(4, 9 * U); cx.strokeRect(ax, ay, wa, ha);
        cx.strokeStyle = C.bone; cx.lineWidth = Math.max(1.5, 3 * U); cx.strokeRect(ax, ay, wa, ha);
        cx.restore();
      }
      var w2 = ease(seg(t, 6.2, 6.8)) * (1 - ease(seg(t, 8.2, 8.7)));
      if (w2 > 0.02) {
        var wb = SW * 0.24, hb = H * 0.38;
        var bx = X(0.725), by = Y(0.17) + (1 - w2) * H * 0.05;
        cx.save(); cx.globalAlpha = w2;
        cx.beginPath(); cx.rect(bx, by, wb, hb); cx.clip();
        coverIn(img.vespera, bx, by, wb, hb, 0.52, 0.30, 1.45, 0.04);
        cx.restore();
        cx.save(); cx.globalAlpha = w2;
        cx.strokeStyle = C.ink; cx.lineWidth = Math.max(4, 9 * U); cx.strokeRect(bx, by, wb, hb);
        cx.strokeStyle = C.magenta; cx.lineWidth = Math.max(1.5, 3 * U); cx.strokeRect(bx, by, wb, hb);
        cx.restore();
      }
    }
    /* Confeti: partículas con gravedad, no un filtro. */
    if (!reduced) {
      for (var i = 0; i < 20; i++) {
        var p = ((t * 0.22 + rnd(i * 3.7)) % 1);
        var cxp = X(0.08 + rnd(i * 1.9) * 0.86), cyp = Y(p * 1.05);
        cx.save(); cx.globalAlpha = 0.55 * (1 - p * 0.5);
        cx.fillStyle = [C.magenta, C.cyan, C.yellow, C.bone][i % 4];
        cx.translate(cxp + Math.sin(t * 1.6 + i) * 12 * U, cyp);
        cx.rotate(t * 2 + i);
        cx.fillRect(-3 * U, -1.5 * U, 6 * U, 3 * U);
        cx.restore();
      }
    }
    motes(t, 20, 0.4, 11);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     03 · UNA CANCIÓN MÁS (9–14) — cenital sobre el plato y contrapicado de la
     mano de Tempo. ESTE es el primer indicio del bucle: la última nota está a
     punto de terminar y la mano enlaza otra canción ANTES del final.
     ───────────────────────────────────────────────────────────────────────── */
  function s03OneMoreSong(t) {
    var u = seg(t, 9, 14);
    /* El plato gira. Su velocidad NO es constante: al final del plano frena,
       porque la canción se está acabando. */
    var spin = u < 0.72 ? (t - 9) * 1.5 : (t - 9) * 1.5 - ease((u - 0.72) / 0.28) * 2.2;
    var m = cover(img.vinyl, 0.5, 0.5, 1.10 + ease(u) * 0.10, 1, 0, 0, true);
    tint(C.ink, 0.20);

    /* El disco, girando de verdad: se dibuja el plato con su propia rotación
       alrededor del eje, sobre la lámina. */
    var cxv = mapX(m, 0.47), cyv = mapY(m, 0.50), rv = m.w * 0.30;
    cx.save();
    cx.translate(cxv, cyv);
    cx.rotate(spin * 0.06);
    cx.globalAlpha = 0.22;
    cx.strokeStyle = C.bone; cx.lineWidth = Math.max(1, 1.6 * U);
    for (var k = 1; k <= 5; k++) {
      cx.beginPath(); cx.arc(0, 0, rv * (k / 5.6), 0, Math.PI * 2); cx.stroke();
    }
    /* una marca para que se VEA girar */
    cx.restore();
    cx.save();
    cx.translate(cxv, cyv); cx.rotate(spin * 0.06);
    cx.globalAlpha = 0.85; cx.fillStyle = C.magenta;
    cx.beginPath(); cx.arc(rv * 0.82, 0, Math.max(2, 3.5 * U), 0, Math.PI * 2); cx.fill();
    cx.restore();

    /* Brazo del plato: baja al final del plano = enlaza la siguiente canción. */
    var arm = ease(seg(t, 12.4, 13.1));
    if (!reduced) {
      cx.save();
      cx.translate(mapX(m, 0.70), mapY(m, 0.34));
      cx.rotate(0.42 - arm * 0.26);
      cx.strokeStyle = C.ink; cx.lineWidth = Math.max(6, 11 * U);
      cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(-m.w * 0.13, m.h * 0.20); cx.stroke();
      cx.strokeStyle = C.bone; cx.lineWidth = Math.max(2, 4.5 * U);
      cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(-m.w * 0.13, m.h * 0.20); cx.stroke();
      cx.restore();
    }

    /* Contrapicado de la mano: entra desde abajo y TOCA el disco. */
    if (!reduced) {
      var hp = ease(seg(t, 9.6, 10.6)) * (1 - ease(seg(t, 13.2, 13.9)));
      if (hp > 0.02) {
        var hw2 = SW * 0.34, hh2 = H * 0.44;
        var hx = X(0.60), hy = Y(0.44) + (1 - hp) * H * 0.20;
        cx.save(); cx.globalAlpha = 0.86 * hp;
        cx.beginPath(); cx.rect(hx, hy, hw2 * hp, hh2); cx.clip();
        coverIn(img.hand, hx, hy, hw2 * hp, hh2, 0.42, 0.5, 1.35, 0.06);
        cx.restore();
        cx.save(); cx.globalAlpha = 0.9 * hp;
        cx.strokeStyle = C.ink; cx.lineWidth = Math.max(4, 8 * U);
        cx.strokeRect(hx, hy, hw2 * hp, hh2); cx.restore();
      }
    }

    /* El «clic» del enlace: destello + onomatopeya, al final de la nota. */
    sfxWord(t, 12.35, 13.25, "CLIC", 0.20, 0.30, 120, C.yellow, -0.14);
    flash(t, 12.35, 0.10, "#fff", 0.30);
    if (t > 13.1 && !reduced) {
      /* el surco vuelve a empezar: un latido de tinta en el borde */
      tint(C.ink, 0.35 * (1 - seg(t, 13.1, 13.55)));
    }
    motes(t, 16, 0.35, 17);
  }




  /* ────────────────────────── ACTO II · EL DESAFINADO ───────────────────────
  /* ══════════════════ ACTO II · EL DESAFINADO (14–28) ═════════════════════ */

  /* El bucle de la multitud: cuatro compases idénticos. El encuadre y la
     trayectoria de cámara son EXACTAMENTE los del plano 02, para que el
     espectador reconozca la repetición sin que nadie se la explique. */
  var LOOP4 = [14.0, 15.0, 16.0, 17.0];
  function s04Repetition(t) {
    var i = 0;
    while (i < LOOP4.length - 1 && t >= LOOP4[i + 1]) i++;
    var t0 = LOOP4[i], u = t - t0;
    var last = i === 3;                                /* el cuarto se rompe */
    var norm = last ? 0.62 : 1.0;

    /* MISMO encuadre que el plano 02, misma apertura de dolly. Si cambiara,
       el bucle no se leería. */
    var loc = clamp(u / norm, 0, 1);
    var z = 1.06 + ease(loc) * 0.14 + (last ? 0.012 * Math.exp(-u * 6) : 0);
    var m = cover(img.smiles, 0.52 + 0.02 * Math.sin((t0 + loc) * 0.8), 0.5, z, 1, 0, 0, true);
    tint(C.ink, 0.05);

    /* La multitud repite el ciclo EXACTO: mismo desfase siempre. */
    crowdCycle(t0 + loc, m, 3, 0.16, 0, 0.4);

    /* Variaciones mínimas: cada vuelta deja una huella distinta. Es lo único
       que cambia, y por eso se nota que es el mismo instante. */
    var variance = [0, 1, 2, 3][i];
    if (!reduced) {
      var w1 = ease(seg(u, 0.1, 0.5)) * (1 - ease(seg(u, norm - 0.3, norm - 0.05)));
      if (w1 > 0.02) {
        var wa = SW * 0.28, ha = H * 0.32, ax = X(0.045), ay = Y(0.50);
        cx.save(); cx.globalAlpha = w1;
        cx.beginPath(); cx.rect(ax, ay, wa, ha); cx.clip();
        coverIn(img.smiles, ax, ay, wa, ha, 0.26, 0.40, 2.1, 0.06);
        cx.restore();
        cx.save(); cx.globalAlpha = w1;
        cx.strokeStyle = C.ink; cx.lineWidth = Math.max(4, 9 * U); cx.strokeRect(ax, ay, wa, ha);
        cx.strokeStyle = last ? C.magenta : C.bone; cx.lineWidth = Math.max(1.5, 3 * U);
        cx.strokeRect(ax, ay, wa, ha);
        cx.restore();
      }
      /* la huella de cada vuelta: una copia fantasma, cada vez más cerca */
      if (i > 0 && ok(img.crowd)) {
        cx.save(); cx.globalAlpha = 0.05 * i;
        cx.drawImage(img.crowd, m.x - m.w * 0.01 * i, m.y, m.w * (1 + 0.02 * i), m.h * (1 + 0.02 * i));
        cx.restore();
      }
    }

    /* Reinicio del compás: la cámara da un tirón de tinta y vuelve a empezar. */
    if (u < 0.10 && i > 0) tint(C.ink, 0.42 * (1 - u / 0.10));
    flash(t, t0, 0.07, "#fff", 0.16);

    /* El reloj de la pared: las agujas NO avanzan, dan tirones y vuelven. */
    if (!reduced) {
      var ang = -Math.PI / 2 + 0.3 + ease(loc) * 0.34;
      if (u > norm - 0.10) ang -= ease((u - (norm - 0.10)) / 0.10) * 0.34;
      clockHands(m, img.smiles, 0.512, 0.146, 0.026, ang, 0.55, last ? 1 : 0, 0);
    }
    /* La cuarta vuelta no termina: se queda colgada. */
    if (last) {
      var stuck = ease(seg(u, 0.3, norm));
      cx.save(); cx.globalAlpha = 0.30 * stuck;
      cx.fillStyle = C.ink; cx.fillRect(0, 0, W, H); cx.restore();
      sfxWord(t, t0 + 0.28, t0 + 0.62, "CLAC", 0.22, 0.36, 150, C.yellow, -0.17);
    }
    motes(t, 18, 0.35, 21 + i);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     05 · EL PASO INCORRECTO (18–23) — travelling bajo, a ras de suelo. Entre
     todos los pies que caen al compás, UNO cae tarde. Aquí aparece él por
     primera vez como acción, no como retrato.
     ───────────────────────────────────────────────────────────────────────── */
  function s05WrongStep(t, st) {
    var u = seg(t, 18, 23);
    /* Travelling bajo: el encuadre se desplaza sobre las botas. */
    var m = cover(img.boots, lerp(0.30, 0.68, ease(u)), 0.62, 1.16, 1, 0, 0);
    tint(C.ink, 0.16);

    /* Los pies de la multitud, al compás: cada grupo cae en su tiempo. */
    if (!reduced) {
      for (var i = 0; i < 6; i++) {
        var ph = ((t * 2 + i * 0.37) % 1);
        var fall = Math.exp(-ph * 7);
        var fx = X(0.08 + i * 0.15), fy = Y(0.88);
        cx.save(); cx.globalAlpha = 0.12 * fall;
        cx.fillStyle = i % 2 ? C.cyan : C.bone;
        cx.beginPath(); cx.ellipse(fx, fy, W * 0.03, H * 0.008, 0, 0, 7); cx.fill();
        cx.restore();
      }
    }

    /* EL PASO TARDE: el protagonista cruza el cuadro con su ciclo REAL de
       andar, fuera de compás.
       La lámina de las botas es un encuadre A RAS DE SUELO: los pies de la
       multitud caen en el 86 % del alto. Él camina sobre esa misma línea, y se
       dibuja más pequeño que las botas gigantes del primer plano porque está
       más lejos: es la profundidad la que lo hace legible. */
    var cross = ease(seg(t, 18.4, 22.2));
    var hx = X(0.10) + cross * SW * 0.72;
    var floorY = Y(0.865);                              /* el suelo de la lámina */
    var hh = H * 0.42, hw = hh * 288 / 512;
    var stepPhase = (t - 18.4) / 0.72;                  /* un paso cada 0,72 s */
    /* el retardo: el ciclo se queda atrás justo en los compases impares */
    var lag = Math.max(0, Math.sin((t - 18) * Math.PI / 1.0)) * 0.18;
    var frame = walkFrameIndex(stepPhase - lag);
    var bob = -Math.abs(Math.sin((stepPhase - lag) * Math.PI * 2)) * H * 0.010;
    /* su sombra, en el suelo de la lámina, para que no parezca pegado */
    cx.save(); cx.globalAlpha = 0.42;
    cx.fillStyle = C.ink;
    cx.beginPath(); cx.ellipse(hx, floorY + H * 0.004, hw * 0.34, H * 0.007, 0, 0, 7); cx.fill();
    cx.restore();
    drawHeroWalk(frame, hx - hw * 0.5, floorY - hh + bob, hw, hh,
      Math.sin((stepPhase - lag) * Math.PI * 2) * 0.018, 1);

    /* La marca del paso tardío: su huella se queda un instante en el suelo. */
    if (!reduced) {
      var lateMark = Math.max(0, 1 - Math.abs(((t - 18.4) % 0.72) - 0.10) * 5);
      cx.save(); cx.globalAlpha = 0.34 * lateMark;
      cx.fillStyle = C.magenta;
      cx.beginPath(); cx.ellipse(hx, floorY + H * 0.006, hw * 0.40, H * 0.006, 0, 0, 7); cx.fill();
      cx.restore();
    }

    sfxWord(t, 20.1, 20.7, "TAC", 0.62, 0.30, 140, C.yellow, -0.18);
    flash(t, 20.1, 0.09, "#fff", 0.28);
    /* El suelo se descuadra cuando él pasa: la consecuencia visible. */
    if (t > 20.1 && !reduced) {
      var sk = Math.sin(seg(t, 20.1, 21.2) * Math.PI) * W * 0.010;
      cx.save(); cx.globalAlpha = 0.45 * Math.sin(seg(t, 20.1, 21.2) * Math.PI);
      cx.strokeStyle = C.cyan; cx.lineWidth = Math.max(1.5, 2.5 * U);
      for (var v2 = 0; v2 < 5; v2++) {
        cx.beginPath();
        cx.moveTo(X(0.24 + v2 * 0.13) + sk, Y(0.80));
        cx.lineTo(X(0.24 + v2 * 0.13) - sk, Y(0.97));
        cx.stroke();
      }
      cx.restore();
    }
    debris(t, 20.15, 8, 71, 1, 0.30, 0.35);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     06 · EL QUE NO SE REPITE (23–28) — órbita alrededor de él. Rostro, tatuajes
     y manos en tres cuartos de vuelta. El fondo repite; él varía.
     ───────────────────────────────────────────────────────────────────────── */
  function s06DoesNotRepeat(t, st) {
    var u = seg(t, 23, 28);
    /* La órbita: el punto de vista gira 270°. En 2.5D se simula desplazando el
       eje de la lámina y cambiando qué recorte está delante. El mundo gira; él
       no. Ese contraste es todo el plano. */
    var ang = -0.6 + ease(u) * 1.5 * Math.PI;
    var orbX = Math.cos(ang) * 0.07, orbY = Math.sin(ang) * 0.025;

    var m = cover(img.floor, 0.5 + orbX, 0.42 + orbY, 1.30, 1, 0, 0, false);
    tint(C.ink, 0.22);
    crowdCycle(t, m, 1, 0.14, 0, 0.7);

    /* EL RETRATO. `op_06_face` es un primer plano apaisado: la cara ocupa el
       centro-derecha y el club sigue detrás. Entra como ventana que la órbita
       va descubriendo, no como panel estrecho. */
    var faceA = ease(seg(t, 23.3, 24.3));
    if (faceA > 0.02) {
      var fw = SW * 0.40, fh = fw * 768 / 1376;
      var fx = X(0.028) - (1 - faceA) * SW * 0.06 + orbX * SW * 0.08;
      var fy = Y(0.235) + orbY * H * 0.06;
      cx.save(); cx.globalAlpha = faceA;
      cx.beginPath(); cx.rect(fx, fy, fw, fh); cx.clip();
      coverIn(img.face, fx, fy, fw, fh, 0.46 - orbX * 0.3, 0.44, 1.10 + u * 0.10, 0.02);
      cx.restore();
      cx.save(); cx.globalAlpha = faceA;
      cx.strokeStyle = C.ink; cx.lineWidth = Math.max(4, 10 * U);
      cx.strokeRect(fx, fy, fw, fh);
      cx.strokeStyle = C.bone; cx.lineWidth = Math.max(1.5, 3 * U);
      cx.strokeRect(fx, fy, fw, fh);
      cx.restore();
    }

    /* LOS TATUAJES: `arm_tattoos` es vertical y entra por el lado opuesto, con
       la luz cian. Es la prueba de que no se repite. */
    var armA = ease(seg(t, 24.6, 25.6));
    if (armA > 0.02) {
      var ah = H * 0.46, aw = ah * 280 / 630;
      var ax2 = X(0.972) - aw + (1 - armA) * SW * 0.05;
      var ay2 = Y(0.545) - ah;
      cx.save(); cx.globalAlpha = armA * 0.96;
      cx.beginPath(); cx.rect(ax2, ay2, aw, ah); cx.clip();
      coverIn(img.marm, ax2, ay2, aw, ah, 0.50, 0.42, 1.04, 0.06);
      cx.restore();
      cx.save(); cx.globalAlpha = armA;
      cx.strokeStyle = C.ink; cx.lineWidth = Math.max(4, 10 * U);
      cx.strokeRect(ax2, ay2, aw, ah);
      cx.strokeStyle = C.cyan; cx.lineWidth = Math.max(1.5, 3 * U);
      cx.strokeRect(ax2, ay2, aw, ah);
      cx.restore();
    }

    /* Él, en el centro: la única pieza que no gira con el mundo. */
    var hxx, floorY2, hh, hw;
    if (ok(img.hero)) {
      hh = H * 0.46; hw = hh * 288 / 512;
      var breath = reduced ? 0 : Math.sin(t * 1.9) * H * 0.004;
      var lean = reduced ? 0 : Math.sin(t * 0.9) * 0.012;
      hxx = X(0.53) - hw * 0.5;
      floorY2 = Y(0.885);                 /* pisando la franja de público */
      var hyy = floorY2 - hh + breath;
      cx.save(); cx.globalAlpha = 0.42; cx.fillStyle = C.ink;
      cx.beginPath(); cx.ellipse(hxx + hw * 0.5, floorY2 + H * 0.004, hw * 0.32, H * 0.008, 0, 0, 7); cx.fill();
      cx.restore();
      drawHeroWalk("hero_walk_01", hxx, hyy, hw, hh, lean, 1);
      glow(hxx + hw * 0.5, hyy + hh * 0.30, hh * 0.46, "rgba(255,236,246,0.55)", 0.13);
    }

    /* El entorno repite, él varía: sus copias se quedan atrás. */
    if (!reduced && ok(img.hero)) {
      var ghost = Math.sin(u * Math.PI * 3) * 0.5 + 0.5;
      if (ghost > 0.32) {
        cx.save();
        for (var gi = 0; gi < 2; gi++) {
          cx.globalAlpha = (0.09 - gi * 0.04) * ghost;
          var hh3 = H * 0.46, hw3 = hh3 * 288 / 512;
          cx.drawImage(img.hero, hxx + hw * 0.5 - hw3 * 0.5 - SW * (0.05 + gi * 0.05) * ghost,
            floorY2 - hh3, hw3, hh3);
        }
        cx.restore();
      }
    }
    motes(t, 22, 0.4, 31);
  }




  /* ══════════════════ ACTO III · LA CORRECCIÓN (28–43) ════════════════════ */

  /* ─────────────────────────────────────────────────────────────────────────
     07 · EL ERROR (28–33) — contrapicado desde el suelo. Los demás intentan
     recuperar la secuencia anterior y él vuelve a moverse. La corrección se ve
     en la multitud: su ciclo se acelera y se cuadra a la fuerza.
     ───────────────────────────────────────────────────────────────────────── */
  function s07TheError(t, st) {
    var u = seg(t, 28, 33);
    var sh = shakeOf(t, 28, 1.2, 12);
    /* Contrapicado: el punto de vista está en el suelo, el mundo se alza. */
    var z = lerp(1.42, 1.26, easeOut(seg(t, 28, 28.7))) + u * 0.10;
    var m = cover(img.doors, 0.5, 0.72, z, 1, sh[0], sh[1], true);
    tint(C.magenta, 0.03 + 0.07 * beatPulse(t * 1.5));

    /* LA CORRECCIÓN: el ciclo de la multitud se acelera y se CUADRA. `rigid`
       crece con el plano: el gesto deja de ser orgánico y se vuelve mecánico. */
    var rigid = ease(seg(t, 28.4, 30.6));
    crowdCycle(t, m, 2, 0.26 + 0.08 * rigid, rigid, 0.2);
    /* Y las tres bandas repiten el mismo fragmento, cada vez más juntas. */
    if (!reduced) {
      for (var b = 0; b < 3; b++) {
        var a = (0.17 - b * 0.045) * (0.5 + 0.5 * rigid);
        if (a <= 0) continue;
        var fy0 = 0.26 + b * 0.10, fy1 = fy0 + 0.075;
        var dy = Math.sin(t * (2.2 + 2.4 * rigid) + b * 1.7) * H * 0.005 + (1 - seg(t, 28.1, 28.9)) * H * 0.06;
        cx.save();
        cx.beginPath(); cx.rect(0, Y(fy0) + dy, W, (fy1 - fy0) * H); cx.clip();
        cx.globalAlpha = a;
        cover(img.doors, 0.5, 0.72, z * (1.02 + b * 0.012), sh[0] + (20 + 10 * rigid) * U * (b + 1), 0, true);
        cx.restore();
      }
    }

    /* Él, otra vez fuera de secuencia: cruza hacia el otro lado, con su ciclo
       real, y su paso NO se acelera aunque el mundo sí. */
    var cross = ease(seg(t, 28.8, 31.6));
    var hh = H * 0.34, hw = hh * 288 / 512;
    /* Cruza por el HUECO de la puerta: es el único sitio del encuadre donde la
       silueta no queda tapada por los invitados del primer plano. */
    var hx = X(0.60) - cross * SW * 0.24;
    var stepPhase = (t - 28.8) / 0.80;                  /* más lento que el mundo */
    var frame = walkFrameIndex(stepPhase);
    var bob = -Math.abs(Math.sin(stepPhase * Math.PI * 2)) * H * 0.009;
    var footY = Y(0.845);                               /* sobre el umbral */
    /* su sombra, alargada por el contrapicado */
    cx.save(); cx.globalAlpha = 0.38;
    cx.fillStyle = C.ink;
    cx.beginPath(); cx.ellipse(hx, footY + H * 0.004, hw * 0.36, H * 0.009, 0, 0, 7); cx.fill();
    cx.restore();
    drawHeroWalk(frame, hx - hw * 0.5, footY - hh + bob, hw, hh,
      Math.sin(stepPhase * Math.PI * 2) * 0.015, 1);

    /* Las grietas que ya no pararán: nacen en el suelo y trepan por la pared. */
    crack([[0.04, 0.905], [0.16, 0.895], [0.27, 0.902], [0.38, 0.888]], seg(t, 28.1, 30.4), 6);
    crack([[0.96, 0.905], [0.85, 0.893], [0.74, 0.900], [0.63, 0.886]], seg(t, 28.6, 31.2), 6);
    crack([[0.50, 0.905], [0.53, 0.80], [0.48, 0.70], [0.54, 0.60], [0.50, 0.50]], seg(t, 29.2, 31.8), 7);

    sfxWord(t, 30.2, 31.4, "CRRRJ", 0.30, 0.32, 140, C.cyan, 0.12);
    flash(t, 28, 0.14, "#fff", 0.5);
    ceilingDust(t, 0.30 * seg(t, 29.4, 31), 41);
    debris(t, 30.2, 10, 73, 1, 0.34, 0.32);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     08 · LA TORRE REACCIONA (33–38) — cenital y paralaje 2.5D. Puertas, luces y
     estructuras REPITEN movimientos. Las nueve pistas se encienden una a una.
     La Torre no es un villano con cuerpo: es el edificio.
     ───────────────────────────────────────────────────────────────────────── */
  function s08TowerReacts(t, st) {
    var u = seg(t, 33, 38);
    /* La cámara se eleva: cenital progresivo sobre las nueve pistas. */
    var m = cover(img.nine, 0.5, lerp(0.30, 0.62, ease(u)), 1.55, 1, 0, 0, true);
    tint(C.ink, 0.46);

    /* Las nueve plantas se encienden en orden, cada una con su pulso. */
    var rn = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
    for (var i = 0; i < 9; i++) {
      var ti = 33.15 + i * 0.36, k = pop(t, ti, 0.20);
      if (k <= 0) continue;
      var fy = 0.13 + i * 0.093;
      var px = X(0.10), py = Y(fy);
      var pulse = 1 + 0.5 * Math.max(0, 1 - (t - ti) * 4);
      /* el suelo de cada pista se ilumina */
      glow(X(0.5), py, SW * (0.30 + 0.06 * Math.sin(t * 2.6 + i)), i === 8 ? "rgba(255,45,122,0.95)" : "rgba(34,211,238,0.75)",
        (0.10 + 0.06 * Math.sin(t * 3.4 + i * 1.1)) * k);
      /* y la marca de la pista */
      cx.save(); cx.globalAlpha = 0.95 * k;
      cx.fillStyle = i === 8 ? C.magenta : C.yellow;
      cx.strokeStyle = C.ink; cx.lineWidth = Math.max(2, 3 * U);
      var mw = SW * 0.05 * k * pulse, mh = H * 0.016 * k * pulse;
      cx.beginPath();
      cx.moveTo(px, py - mh * 0.5); cx.lineTo(px + mw, py - mh * 0.2);
      cx.lineTo(px + mw * 0.9, py + mh * 0.5); cx.lineTo(px, py + mh * 0.35);
      cx.closePath(); cx.fill(); cx.stroke();
      cx.font = "italic 700 " + Math.max(9, 13 * U) + "px " + FONT_CAP;
      cx.fillStyle = C.bone; cx.textAlign = "left"; cx.textBaseline = "middle";
      cx.fillText(rn[i], px + mw + 6 * U, py);
      cx.restore();
    }

    /* Las puertas repiten su apertura: dos batientes que abren y cierran al
       mismo compás, en tres profundidades distintas. */
    for (var d = 0; d < 3; d++) {
      var dph = ((t * 0.9 + d * 0.33) % 1);
      var open2 = Math.exp(-Math.pow((dph - 0.5) * 3.2, 2));
      var dx2 = X(0.22 + d * 0.28), dy2 = Y(0.44 + d * 0.05);
      cx.save(); cx.globalAlpha = 0.30 * open2;
      cx.fillStyle = C.cyan;
      cx.fillRect(dx2 - SW * 0.035 * open2, dy2, SW * 0.035 * open2, H * 0.16);
      cx.fillRect(dx2, dy2, SW * 0.035 * open2, H * 0.16);
      cx.restore();
    }

    /* Rejilla de corrección: la Torre midiendo el desvío. */
    if (!reduced) {
      cx.save(); cx.globalAlpha = 0.10 + 0.06 * Math.sin(t * 5);
      cx.strokeStyle = C.cyan; cx.lineWidth = Math.max(0.8, 1.2 * U);
      for (var gx = 0; gx < 14; gx++) {
        cx.beginPath();
        cx.moveTo(X(gx / 14), Y(0.05)); cx.lineTo(X(gx / 14), Y(0.95)); cx.stroke();
      }
      for (var gy = 0; gy < 9; gy++) {
        cx.beginPath();
        cx.moveTo(X(0.02), Y(gy / 9 * 0.9 + 0.05)); cx.lineTo(X(0.98), Y(gy / 9 * 0.9 + 0.05)); cx.stroke();
      }
      cx.restore();
    }
    sfxWord(t, 35.4, 36.6, "KRAAK", 0.68, 0.70, 130, C.cyan, -0.09);
    ceilingDust(t, 0.42, 43);
    flash(t, 33.0, 0.16, "#fff", 0.45);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     09 · EL GOLPE (38–43) — un grave llega DESDE DEBAJO del suelo y la cámara
     desciende hasta los pies del protagonista. Grietas y el mecanismo circular
     que empieza a girar. Nadie lo activa: la anomalía lo ha abierto.
     ───────────────────────────────────────────────────────────────────────── */
  function s09TheHit(t, st) {
    var u = seg(t, 38, 43);
    /* La cámara DESCIENDE: empieza a la altura del torso y acaba en el suelo. */
    var low = ease(seg(t, 38.3, 41.0));
    var sh = shakeOf(t, 38.0, 0.7, 18);
    var z = 1.10 + u * 0.16;
    /* el encuadre baja por la lámina: de la multitud a los pies */
    var m = cover(img.boots, 0.5, lerp(0.22, 0.72, low), z, 1, sh[0], sh[1], true);
    tint(C.ink, 0.30 + 0.20 * low);

    /* El sub-grave: cada golpe mueve el suelo un píxel y baja la luz. */
    var boom = Math.exp(-((t - 38.0) % 0.5) * 7);
    if (!reduced) {
      cx.save(); cx.globalAlpha = 0.16 * boom;
      cx.fillStyle = C.magenta; cx.fillRect(0, 0, W, H); cx.restore();
    }

    /* El mecanismo circular: un anillo que aparece en el suelo y EMPIEZA A
       GIRAR. Es la primera vez que se ve; no se explica qué es. */
    var ringP = ease(seg(t, 39.4, 41.2));
    if (ringP > 0.02) {
      var rcx = X(0.5), rcy = Y(0.80), rr = SW * 0.20 * ringP;
      cx.save();
      cx.translate(rcx, rcy);
      cx.scale(1, 0.34);                                  /* en escorzo: es suelo */
      cx.rotate(t * (0.6 + 1.4 * ringP));
      cx.globalAlpha = 0.85 * ringP;
      cx.strokeStyle = C.cyan; cx.lineWidth = Math.max(2.5, 5 * U);
      cx.beginPath(); cx.arc(0, 0, rr, 0, Math.PI * 2); cx.stroke();
      cx.strokeStyle = "rgba(34,211,238,0.5)"; cx.lineWidth = Math.max(1.2, 2.5 * U);
      for (var sp = 0; sp < 12; sp++) {
        var sa = sp / 12 * Math.PI * 2;
        cx.beginPath();
        cx.moveTo(Math.cos(sa) * rr * 0.62, Math.sin(sa) * rr * 0.62);
        cx.lineTo(Math.cos(sa) * rr, Math.sin(sa) * rr);
        cx.stroke();
      }
      cx.restore();
      glow(rcx, rcy, rr * 2.2, "rgba(34,211,238,0.9)", 0.16 * ringP);
    }

    /* Las grietas se encuentran en el centro de la pista. */
    crack([[0.50, 0.30], [0.485, 0.45], [0.515, 0.58], [0.492, 0.72], [0.505, 0.90]], seg(t, 38.3, 40.0), 8);
    crack([[0.505, 0.62], [0.42, 0.70], [0.33, 0.76]], seg(t, 39.0, 40.6), 7);
    crack([[0.512, 0.62], [0.60, 0.71], [0.69, 0.77]], seg(t, 39.4, 41.0), 7);

    /* Él, de pie sobre las grietas: no se mueve todavía. El susto es del mundo. */
    if (ok(img.hero)) {
      var hh = H * 0.40, hw = hh * 288 / 512;
      var tilt = reduced ? 0 : Math.sin(t * 3.1) * 0.008 * (1 - low * 0.5);
      drawHeroWalk("hero_walk_01", W * 0.5 - hw * 0.5, Y(0.905) - hh, hw, hh, tilt, 1);
    }
    sfxWord(t, 38.1, 39.3, "BRUUUM", 0.14, 0.42, 128, C.magenta, -0.06);
    debris(t, 39.6, 14, 77, 1, 0.30, 0.40);
    ceilingDust(t, 0.5, 47);
    flash(t, 38.0, 0.10, C.magenta, 0.35);
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

  /* ────────────────────────────────────────────────────────────────────────
     EL REFUGIO DE VERDAD, no una pintura del Refugio.

     El motor ya sabe pintar la sala del HUB: `DD_WORLD.buildHighResRoomCache`
     dibuja suelo en damero, mármol, alfombra VIP, muro gótico con hornacinas,
     pilastras y zócalo con EXACTAMENTE la geometría de `DD_HUB` (HUB_BOUNDS
     260·210·1240·760). Y en el arranque del juego ya están cargados los 270
     recursos, así que está disponible desde el primer fotograma.

     Usarlo aquí es lo que hace que el último plano de la cinemática sea el
     mismo salón que el jugador pisa un segundo después: no hay que parecerse
     al Refugio, es el Refugio. La caché se construye UNA vez y se reutiliza.

     Sobre esa base, la cámara es la misma que la del HUB (`hubCam`), y encima
     se añaden las tres cosas que el HUB pinta por su cuenta: el zorro de neón
     del muro derecho, la plataforma cian de descenso y los muebles de la sala.
     Nada de esto toca `dd_hub_system.js` ni el motor: se lee su misma API. */
  var roomCache = null;
  function engineRoom() {
    if (roomCache) return roomCache;
    var Wd = window.DD_WORLD, A = window.DD_ASSETS;
    if (!Wd || !Wd.buildHighResRoomCache || !A || !A.get) return null;
    /* Los materiales del salón tienen que estar ya dentro. Mientras no lo
       estén NO se memoriza el fallo: se vuelve a intentar en el fotograma
       siguiente, y el plano se pinta con los materiales sueltos (nunca una
       caja negra). Cuando el motor puede, la caché se construye UNA vez. */
    if (!ok(A.get("floor_10_hub_checker"))) return null;
    try {
      var cnv = document.createElement("canvas");
      cnv.width = 1800; cnv.height = 1180;
      Wd.buildHighResRoomCache(cnv.getContext("2d"), cnv.width, cnv.height, HUBG, 0, 777, null);
      roomCache = cnv;
    } catch (e) { roomCache = null; }
    return roomCache;
  }

  /* Cámara del HUB, ya resuelta (zoom + centro), aplicada al lienzo. */
  function roomCamera(zoomK, dx, dy) {
    var c = hubCam();
    var zoom = c.zoom * (zoomK == null ? 1 : zoomK);
    cx.save();
    cx.translate(W * 0.5 + (dx || 0), H * 0.5 + (dy || 0));
    cx.scale(zoom, zoom);
    cx.translate(-c.camX, -c.camY);
    return { zoom: zoom, camX: c.camX, camY: c.camY };
  }

  /* Pinta el salón del motor + sus tres capas propias, dentro de la cámara. */
  function drawEngineRoom(tv, a, zoomK, dx, dy) {
    var bg = engineRoom();
    var cam = roomCamera(zoomK, dx, dy);
    if (bg) {
      cx.drawImage(bg, 0, 0);
    } else {
      /* reserva: si el motor no está listo, el salón se pinta con sus propios
         materiales (nunca una caja negra) */
      var A = window.DD_ASSETS;
      var fl = A && A.get && A.get("floor_10_hub_checker");
      if (ok(fl)) {
        var pat = cx.createPattern(fl, "repeat");
        cx.fillStyle = pat; cx.fillRect(HUBG.x - 64, HUBG.y - 64, HUBG.w + 128, HUBG.h + 128);
        cx.fillStyle = "rgba(10,5,22,0.42)"; cx.fillRect(HUBG.x - 64, HUBG.y - 64, HUBG.w + 128, HUBG.h + 128);
      } else {
        cx.fillStyle = "#161022"; cx.fillRect(HUBG.x, HUBG.y, HUBG.w, HUBG.h);
      }
    }
    /* zorro de neón del muro derecho, con su halo (mismas coordenadas que el HUB) */
    var Wd = window.DD_WORLD, A2 = window.DD_ASSETS;
    var fox = A2 && A2.get && A2.get("prop_hub_fox_neon");
    if (ok(fox) && Wd && Wd.drawNeonGlow) {
      var fx = HUBG.x + HUBG.w - 118, fy = HUBG.y + 150;
      Wd.drawNeonGlow(cx, fx + 45, fy + 65, 185, "#ff2d7a", 0.36 + 0.10 * Math.sin(tv * 2.1));
      cx.drawImage(fox, fx, fy, 112, 148);
    }
    /* plataforma cian de descenso, donde el jugador reaparecerá */
    if (Wd && Wd.drawDescentPad) Wd.drawDescentPad(cx, { x: HUBG.hx, y: HUBG.padY }, tv);
    /* muebles de la sala: los del HUB, cada uno en su sitio.
       OJO: van DENTRO de la cámara, igual que en `DD_HUB.render`. */
    if (Wd && Wd.drawProp) {
      for (var i = 0; i < HUB_PROPS_CINE.length; i++) Wd.drawProp(cx, HUB_PROPS_CINE[i], tv);
    }
    cx.restore();
    /* viñeta y halftone, para que el plano siga siendo de la cinemática */
    var vg = cx.createRadialGradient(W * 0.5, H * 0.52, Math.min(W, H) * 0.34, W * 0.5, H * 0.52, Math.max(W, H) * 0.78);
    vg.addColorStop(0, "rgba(5,2,10,0)"); vg.addColorStop(1, "rgba(5,2,10," + (0.72 * a) + ")");
    cx.fillStyle = vg; cx.fillRect(0, 0, W, H);
    halftone(0, 0, W, H, 0.07);
    return cam;
  }

  /* Los muebles del HUB, copiados a propósito (no se importan desde el HUB para
     no acoplar la cinemática al sistema jugable). Son los mismos tipos, en las
     mismas coordenadas: butacas y mesa del centro, barra y estanterías arriba,
     armario de armas y arcade a la izquierda, pedestal de la Torre a la derecha. */
  var HUB_PROPS_CINE = [
    { kind: "shelf", x: 430, y: 245, br: 44 },
    { kind: "shelf", x: 560, y: 245, br: 44 },
    { kind: "barcounter", x: 740, y: 278, br: 56 },
    { kind: "cooler", x: 325, y: 280, br: 36 },
    { kind: "speaker", x: 1035, y: 255, br: 36 },
    { kind: "djbooth", x: 1165, y: 278, br: 58 },
    { kind: "sofa", x: 745, y: 470, br: 48 },
    { kind: "sofa", x: 1015, y: 470, br: 48, flipX: true },
    { kind: "bench", x: 880, y: 488, br: 34 },
    { kind: "armchair", x: 635, y: 545, br: 34 },
    { kind: "armchair", x: 1125, y: 545, br: 34, flipX: true },
    { kind: "candelabra", x: 675, y: 410, br: 24 },
    { kind: "candelabra", x: 1085, y: 410, br: 24 },
    { kind: "vending", x: 355, y: 515, br: 42 },
    { kind: "arcade", x: 355, y: 655, br: 40 },
    { kind: "chest", x: 455, y: 565, br: 34 },
    { kind: "pedestal", x: 1365, y: 585, br: 40 },
    { kind: "plant", x: 1425, y: 745, br: 32 },
    { kind: "plant", x: 335, y: 845, br: 32 }
  ];

  /* Paso de coordenadas del salón (mundo del HUB) a píxeles de pantalla.
     El protagonista se dibuja FUERA de la transformación de cámara: así su
     tamaño es el de la cinemática y no el de un prop del juego; pero sus pies
     se clavan en el suelo del salón usando exactamente esta proyección. */
  /* Proyección MUNDO → PANTALLA con el mismo zoom con el que se acaba de pintar
     el salón. Si se omite `zoomK` vale 1, pero entonces el HUB se dibuja a 1,00
     y el protagonista a 1,30: se desregistran y él flota. Siempre se pasa. */
  function roomProj(zoomK, dx, dy) {
    var c = hubCam();
    var s = c.zoom * (zoomK == null ? 1 : zoomK);
    return {
      zoom: s, camX: c.camX, camY: c.camY,
      x: function (wx) { return (wx - c.camX) * s + W * 0.5 + (dx || 0); },
      y: function (wy) { return (wy - c.camY) * s + H * 0.5 + (dy || 0); }
    };
  }

  function cy_line(x0, y0, x1, y1) {
    cx.save(); cx.strokeStyle = "rgba(7,3,13,0.9)"; cx.lineWidth = Math.max(1, 1.6 * U);
    cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke(); cx.restore();
  }

  /* ══════════════════ ACTO IV · EL DESCENSO (43–59) ═══════════════════════ */

  /* ─────────────────────────────────────────────────────────────────────────
     10 · LA RUPTURA (43–48) — cenital que se abre: el suelo se retrae hacia los
     bordes, las losas se separan y caen, y él pierde el equilibrio.
     ───────────────────────────────────────────────────────────────────────── */
  function s10Rupture(t, st) {
    var u = seg(t, 43, 48);
    /* El mecanismo ya gira: el suelo se retrae en anillos desde el centro. */
    var openS = ease(seg(t, 43.2, 46.0));
    var m = cover(img.pit, 0.5, 0.52, 1.02 + u * 0.10, 1, 0, 0, true);
    tint(C.ink, 0.18 + 0.30 * openS);

    /* Anillos del mecanismo, abriéndose en escorzo. */
    if (!reduced) {
      for (var r = 0; r < 4; r++) {
        var rp = clamp((openS - r * 0.14) / 0.7, 0, 1);
        if (rp <= 0 || rp >= 1) continue;
        cx.save();
        cx.translate(X(0.5), Y(0.60));
        cx.scale(1, 0.36);
        cx.globalAlpha = 0.55 * (1 - rp);
        cx.strokeStyle = r % 2 ? C.cyan : C.magenta;
        cx.lineWidth = Math.max(2, 4 * U * (1 - rp * 0.6));
        cx.beginPath(); cx.arc(0, 0, SW * 0.12 + SW * 0.30 * rp, 0, Math.PI * 2); cx.stroke();
        cx.restore();
      }
    }

    /* Las losas se separan: rectángulos que se alejan del centro y giran. */
    if (!reduced) {
      for (var sl = 0; sl < 10; sl++) {
        var sp = clamp((openS - rnd(sl * 3.1) * 0.25) / 0.75, 0, 1);
        if (sp <= 0) continue;
        var sa = rnd(sl * 5.7) * Math.PI * 2;
        var sdist = sp * SW * (0.28 + rnd(sl * 2.3) * 0.30);
        var sx = X(0.5) + Math.cos(sa) * sdist;
        var sy = Y(0.60) + Math.sin(sa) * sdist * 0.36 + sp * sp * H * 0.22;
        var sw = SW * (0.05 + rnd(sl * 7.1) * 0.05), shh = sw * 0.42;
        cx.save();
        cx.translate(sx, sy);
        cx.rotate(sp * (rnd(sl * 1.9) - 0.5) * 2.4);
        cx.globalAlpha = 0.92 * (1 - Math.max(0, sp - 0.7) / 0.3);
        cx.fillStyle = sl % 3 === 0 ? "#2a1830" : "#1b1024";
        cx.fillRect(-sw / 2, -shh / 2, sw, shh);
        cx.strokeStyle = C.ink; cx.lineWidth = Math.max(1.5, 2.5 * U);
        cx.strokeRect(-sw / 2, -shh / 2, sw, shh);
        cx.restore();
      }
    }

    /* Él pierde el equilibrio: se inclina hacia atrás y agita los brazos antes
       de caer. Se usa el fotograma de reposo con inclinación creciente. */
    if (ok(img.hero)) {
      var hh = H * 0.44 * (1 - openS * 0.18), hw = hh * 288 / 512;
      var tilt = ease(seg(t, 44.2, 46.4)) * (0.16 + Math.sin(t * 6) * 0.03) * (1 - ease(seg(t, 46.4, 47.4)));
      var slip = ease(seg(t, 45.6, 47.2));
      drawHeroWalk("hero_walk_02", W * 0.5 - hw * 0.5, Y(0.62) - hh * 0.5 + slip * H * 0.22, hw, hh, -tilt, 1 - slip * 0.5);
    }
    sfxWord(t, 43.3, 44.5, "CRRRAC", 0.20, 0.30, 132, C.yellow, -0.15);
    debris(t, 43.4, 18, 81, 1, 0.44, 0.50);
    ceilingDust(t, 0.42, 51);
    flash(t, 43.0, 0.12, "#fff", 0.4);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     11 · LA CAÍDA (48–54) — cámara vertical que cae con él. Ropa, sombrero y
     cuerpo con retardo real (resortes). Escombros que SUBEN.
     ───────────────────────────────────────────────────────────────────────── */
  function s11Fall(t, st) {
    var v = t - 48;
    /* La velocidad crece: el mundo sube cada vez más rápido. */
    var speed = ease(seg(v, 0.2, 5.2));
    var scroll = 0.04 + v * 0.055 + speed * 0.12;
    shaftSide(t, scroll, 0.55 + speed * 0.55, null, -1, 0, 0, { mode: "fall" });

    /* Él, de espaldas, cayendo: gira despacio. */
    if (ok(img.hero)) {
      var hh = H * 0.46, hw = hh * 288 / 512;
      var spin = v * 0.52;                                  /* gira al caer */
      var swayX = Math.sin(v * 1.4) * W * 0.03;
      cx.save();
      cx.translate(W * 0.5 + swayX, H * 0.48);
      cx.rotate(Math.sin(spin) * 0.25);
      /* ropa y cadenas: retardo respecto al cuerpo */
      var drag = spring(v, 0.1, H * 0.03, 0.7, 1.4);
      cx.drawImage(img.hero, -hw * 0.5, -hh * 0.42 + drag, hw, hh);
      cx.restore();
    }
    /* El sombrero se desprende y se queda atrás (va hacia arriba). */
    drawHatLag(t, 49.4, W * 0.5 - W * 0.05, H * 0.50, W * 0.10, W * 0.10, 0.95);

    /* Escombros que suben: la cámara cae más rápido que ellos. */
    debris(t, 48.2, 22, 91, -1, 0.50, 0.55);
    if (!reduced) {
      /* líneas de velocidad en los bordes */
      cx.save(); cx.globalAlpha = 0.30 * speed;
      cx.strokeStyle = C.bone; cx.lineWidth = Math.max(1, 2 * U);
      for (var i = 0; i < 14; i++) {
        var lx = W * (0.03 + rnd(i * 4.1) * 0.94);
        var ly = ((t * H * (1.4 + rnd(i) * 1.6) + rnd(i * 2.2) * H) % (H * 1.3)) - H * 0.15;
        cx.beginPath(); cx.moveTo(lx, ly); cx.lineTo(lx, ly + H * (0.06 + 0.10 * speed)); cx.stroke();
      }
      cx.restore();
    }
    /* El mundo se oscurece por los bordes: la caída se estrecha. */
    edgeInk(0.30 + 0.40 * speed, 0.22);
    sfxWord(t, 48.4, 49.2, "FSSSSH", 0.68, 0.36, 140, C.cyan, 0.10);
    flash(t, 48.0, 0.10, "#fff", 0.45);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     12 · LA TORRE INFINITA (54–59) — picado imposible: balcones, pasarelas y
     luces de otras pistas. Una plataforma de servicio lo recibe y sigue bajando.
     ───────────────────────────────────────────────────────────────────────── */
  function s12InfiniteTower(t, st) {
    var v = t - 54;
    var decel = ease(seg(v, 0, 3.0));                 /* la caída se frena */
    var scroll = 0.72 + v * 0.030 - decel * 0.02;
    shaftSide(t, scroll, 0.55 - decel * 0.40, 0.78, 0, 0, 0, { mode: "platform" });

    /* Balcones y pasarelas: la profundidad no termina. */
    if (!reduced) {
      for (var b = 0; b < 8; b++) {
        var bv = ((rnd(b * 6.1) + t * 0.10 * (1 - decel * 0.6)) % 1);
        var by = H * (1.1 - bv * 1.25);
        var bw = W * (0.30 + rnd(b * 2.7) * 0.44);
        var bx = W * (0.06 + rnd(b * 4.3) * 0.62);
        cx.save(); cx.globalAlpha = 0.35 + 0.30 * rnd(b * 8.1);
        cx.fillStyle = "#150c22";
        cx.fillRect(bx, by, bw, Math.max(3, 7 * U));
        /* luces de otra pista */
        cx.fillStyle = b % 3 === 0 ? "rgba(34,211,238,0.65)" : (b % 3 === 1 ? "rgba(255,45,122,0.6)" : "rgba(250,204,21,0.5)");
        cx.fillRect(bx, by, bw * (0.2 + rnd(b) * 0.5), Math.max(1.5, 2 * U));
        cx.restore();
      }
    }

    /* La plataforma de servicio: aparece desde abajo y lo recibe. No se explica
       quién la activa. */
    var plat = ease(seg(v, 1.4, 3.2));
    if (plat > 0.02) {
      var py = H * (1.25 - plat * 0.44);
      var pw = W * 0.46, ph = H * 0.055;
      cx.save();
      cx.globalAlpha = 0.96 * plat;
      /* el cuerpo de la plataforma */
      cx.fillStyle = "#1a1126"; cx.fillRect(W * 0.5 - pw / 2, py, pw, ph);
      cx.fillStyle = "#0d0716"; cx.fillRect(W * 0.5 - pw / 2, py + ph, pw, ph * 0.34);
      /* borde luminoso */
      cx.fillStyle = C.cyan; cx.fillRect(W * 0.5 - pw / 2, py, pw, Math.max(2, 3.5 * U));
      cx.fillStyle = "rgba(34,211,238,0.28)"; cx.fillRect(W * 0.5 - pw / 2, py + ph, pw, Math.max(1.5, 2 * U));
      /* rejilla del piso */
      cx.strokeStyle = "rgba(34,211,238,0.30)"; cx.lineWidth = Math.max(1, 1.6 * U);
      for (var k2 = 1; k2 < 7; k2++) {
        cx.beginPath();
        cx.moveTo(W * 0.5 - pw / 2 + pw * k2 / 7, py);
        cx.lineTo(W * 0.5 - pw / 2 + pw * k2 / 7, py + ph);
        cx.stroke();
      }
      cx.restore();
      glow(W * 0.5, py + ph * 0.5, pw * 0.75, "rgba(34,211,238,0.85)", 0.14 * plat);
    }

    /* Él, sobre la plataforma: los pies clavados en su superficie. */
    if (ok(img.hero) && plat > 0.02) {
      var py2 = H * (1.25 - plat * 0.44);
      var hh = H * 0.44, hw = hh * 288 / 512;
      var settle = ease(seg(v, 2.4, 3.6));
      var bob = reduced ? 0 : Math.sin((v - 1.4) * 6) * H * 0.006 * settle;
      drawHeroWalk(settle > 0.5 ? "hero_walk_02" : "hero_walk_01",
        W * 0.5 - hw * 0.5, py2 - hh + bob, hw, hh, 0, 1);
    }
    edgeInk(0.62 - decel * 0.22, 0.20);
    debris(t, 54.1, 12, 97, -1, 0.42, 0.35 * (1 - decel));
  }

  /* ══════════════════ ACTO V · EL REFUGIO (59–70) ══════════════════════════ */

  /* ─────────────────────────────────────────────────────────────────────────
     13 · EL ATERRIZAJE (59–64) — la plataforma llega al Refugio REAL. La cámara
     es la del HUB, llegando desde arriba y asentándose en su encuadre.
     ───────────────────────────────────────────────────────────────────────── */
  function s13Landing(t, st) {
    var v = t - 59;
    /* La cámara baja hasta el encuadre del HUB y se asienta. */
    var settle = ease(seg(v, 0, 3.4));
    var zoomK = 1.10 - 0.10 * settle;                  /* 1,10 → 1,00 = hubCam */
    var drop = (1 - settle) * H * 0.10;
    drawEngineRoom(t, 1, zoomK, Math.sin(v * 0.9) * 5 * U * (1 - settle), drop);

    var pr = roomProj(zoomK, Math.sin(v * 0.9) * 5 * U * (1 - settle), drop);
    var feetY = pr.y(HUBG.hy + 16);
    /* El protagonista llega CON la plataforma y toca suelo en 60.6. */
    var land = ease(seg(v, 0.9, 2.2));
    var hh = H * 0.40, hw = hh * 288 / 512;
    var heroX = pr.x(HUBG.hx - 110);
    /* la plataforma, bajando con él */
    if (land < 1) {
      var platY = feetY - (1 - land) * H * 0.30;
      var pw = W * 0.34, ph = H * 0.030;
      cx.save(); cx.globalAlpha = 0.9;
      cx.fillStyle = "#1a1126"; cx.fillRect(heroX - pw * 0.5, platY, pw, ph);
      cx.fillStyle = C.cyan; cx.fillRect(heroX - pw * 0.5, platY, pw, Math.max(2, 3.5 * U));
      cx.globalAlpha = 0.35 * (1 - land);
      glow(heroX, platY, pw * 0.6, "rgba(34,211,238,0.9)", 0.2);
      cx.restore();
    }
    /* sombra de contacto */
    cx.save(); cx.globalAlpha = 0.55 * land;
    cx.fillStyle = C.ink;
    cx.beginPath(); cx.ellipse(heroX, feetY - 2, W * (0.030 + 0.018 * (1 - land)), H * (0.010 + 0.005 * (1 - land)), 0, 0, 7); cx.fill();
    cx.restore();
    /* él: baja con su ciclo real, toca y se DEJA CAER hasta quedar tumbado.
       No hay sprite de suelo, así que el reposo se consigue girando la figura
       sobre su propio pie y aplastándola contra el suelo: se lee como un cuerpo
       que se abandona, no como una animación que falta. */
    if (ok(img.hero)) {
      var rest = ease(seg(v, 2.2, 4.1));               /* 61.2 → 63.1 */
      var bob = land < 1 ? -Math.abs(Math.sin(v * 5)) * H * 0.008 : (reduced ? 0 : Math.sin(v * 1.9) * H * 0.0035);
      if (rest < 0.02) {
        drawHeroWalk(land < 0.55 ? "hero_walk_03" : "hero_walk_02",
          heroX - hw * 0.49, feetY - hh - (1 - land) * H * 0.30 + bob, hw, hh, 0, 1);
      } else {
        cx.save();
        cx.translate(heroX, feetY);
        cx.rotate(-rest * 1.34);
        cx.scale(1, 1 - rest * 0.14);
        cx.drawImage(heroFrame("hero_walk_02"), -hw * 0.5, -hh + rest * hh * 0.074, hw, hh);
        cx.restore();
      }
    }
    /* polvo del aterrizaje */
    if (!reduced && land > 0 && land < 1) {
      for (var d = 0; d < 14; d++) {
        cx.save(); cx.globalAlpha = 0.45 * (1 - land);
        cx.fillStyle = d % 2 ? C.bone : C.magenta;
        cx.beginPath();
        cx.arc(heroX + (rnd(d * 3.1) - 0.5) * W * 0.16 * (1 - land + 0.4),
          feetY + (rnd(d * 1.7) - 0.5) * H * 0.02,
          Math.max(1, (3 + 8 * rnd(d)) * U * (1 - land)), 0, 7);
        cx.fill(); cx.restore();
      }
    }
    /* ascuas del salón */
    if (!reduced) {
      for (var em = 0; em < 12; em++) {
        var ev3 = ((v * 0.18 + rnd(em * 4.3)) % 1);
        cx.save(); cx.globalAlpha = 0.40 * (1 - ev3);
        cx.fillStyle = em % 2 ? C.magenta : C.yellow;
        cx.beginPath();
        cx.arc(W * (0.30 + rnd(em * 1.7) * 0.40) + Math.sin(v * 1.5 + em) * 8 * U,
          H * (0.62 - ev3 * 0.38), Math.max(1, 2 * U * (1 - ev3 * 0.6)), 0, 7);
        cx.fill(); cx.restore();
      }
    }
    flash(t, 59.0, 0.14, "#fff", 0.5);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     14 · EL COMIENZO (64–70) — el encuadre EXACTO del HUB. El protagonista pasa
     al idle del HUB y el control es del jugador. Sin menú, sin negro.
     La escala converge: cine (0,40·H) → juego (idle del HUB), compensada por un
     dolly que se abre, de modo que su tamaño en pantalla no salta.
     ───────────────────────────────────────────────────────────────────────── */
  function s14Beginning(t, st) {
    var v = t - 64;
    var u = seg(t, 64, 70);
    /* Convergencia de escala: el héroe se encoge hacia la escala jugable y la
       cámara se abre en la misma proporción. El resultado en pantalla es
       continuo; lo que cambia es el tamaño relativo al salón. */
    /* CONVERGENCIA EXACTA: al final del plano, `zoomK` vale 1,00 y el héroe mide
       lo mismo que el sprite del HUB. Así el último fotograma de la cinemática y
       el primero jugable son el MISMO encuadre: no hay salto de escala al
       entregar el control. Medido contra el HUB real (zoom 1,02 · cuerpo
       124,12 px a 720p), no estimado. */
    var conv = ease(seg(v, 0.2, 3.2));
    var zoomK = 1.00 + conv * 0.16;                    /* el dolly se abre */
    var breathe = 1 + Math.sin(t * 0.62) * 0.005;
    drawEngineRoom(t + 20, 1, zoomK * breathe, Math.sin(v * 0.8) * 4 * U, Math.sin(v * 0.6) * 2 * U);

    var pr = roomProj(zoomK * breathe, Math.sin(v * 0.8) * 4 * U, Math.sin(v * 0.6) * 2 * U);
    var feetY = pr.y(HUBG.hy + 16);
    /* Escala cinemática → escala jugable (drawH 112 sobre cuerpo 462). */
    var cineH = H * 0.46;
    /* tamaño REAL del sprite del HUB proyectado con la misma cámara */
    var playH = 124.12 * (H / 720) * (pr.zoom / 1.02);
    var hh = lerp(cineH, playH, conv);
    var hw = hh * 288 / 512;
    var heroX = pr.x(HUBG.hx - 110);
    var idle = reduced ? 0 : Math.sin(t * 1.9) * H * 0.0035;
    /* Arranca TUMBADO (continuidad con el plano 13) y se incorpora despacio,
       hasta quedar de pie en el mismo fotograma de reposo del juego. Cuando el
       jugador recibe el control, la silueta ya es la del HUB. */
    var up = ease(seg(v, 0.35, 2.9));
    if (up < 0.985) {
      cx.save();
      cx.translate(heroX, feetY);
      cx.rotate(-(1 - up) * 1.34);
      cx.scale(1, 1 - (1 - up) * 0.14);
      cx.drawImage(heroFrame("hero_walk_02"), -hw * 0.5, -hh + (1 - up) * hh * 0.074, hw, hh);
      cx.restore();
    } else {
      drawHeroWalk("hero_walk_02", heroX - hw * 0.49, feetY - hh - idle, hw, hh,
        reduced ? 0 : Math.sin(t * 0.8) * 0.006, 1);
    }
    /* sombra de contacto, a la escala del momento */
    cx.save(); cx.globalAlpha = 0.5;
    cx.fillStyle = C.ink;
    cx.beginPath(); cx.ellipse(heroX, feetY - 1, hw * 0.30, hh * 0.028, 0, 0, 7); cx.fill();
    cx.restore();
    /* ascuas + respiración del neón del zorro */
    if (!reduced) {
      for (var em = 0; em < 12; em++) {
        var ev3 = ((v * 0.16 + rnd(em * 4.3)) % 1);
        cx.save(); cx.globalAlpha = 0.40 * (1 - ev3);
        cx.fillStyle = em % 2 ? C.magenta : C.yellow;
        cx.beginPath();
        cx.arc(W * (0.32 + rnd(em * 1.7) * 0.36) + Math.sin(v * 1.4 + em) * 8 * U,
          H * (0.66 - ev3 * 0.40), Math.max(1, 2 * U * (1 - ev3 * 0.6)), 0, 7);
        cx.fill(); cx.restore();
      }
    }
    /* El segundo rótulo aprobado. */
    caption(t, 65.6, 68.2, "POR FIN, HABÍA QUIEN PODÍA IMAGINAR UN MAÑANA.", 0.030, 0.925, 34, C.bone, C.ink, -0.02);
    /* Los últimos 0,6 s: el lienzo de la cinemática se desvanece dejando ver el
       HUB real debajo. No hay menú ni pantalla negra. */
    /* Los últimos 0,55 s NO se cubren con negro: el lienzo se retira con una
       cortinilla de tinta que barre hacia arriba, y debajo está el HUB ya vivo.
       La transición la completa el CSS con `is-out` (opacidad del canvas), así
       que aquí no se pinta ningún velo opaco: cualquier relleno oscuro se leería
       como pantalla negra. */
    if (v > 5.35) {
      /* La entrega NO se tapa: el lienzo se retira con el `is-out` del CSS sobre
         el Refugio ya vivo. Aquí sólo sube una franja de tinta desde el pie,
         con degradado y techo del 46 % del alto, para que el último fotograma
         sea el salón con él de pie —nunca un fundido a negro. */
      var out = ease(seg(v, 5.35, 5.95));
      var top = Y(1) - out * H * 0.46;
      var gg = cx.createLinearGradient(0, top, 0, H);
      gg.addColorStop(0, "rgba(11,4,22,0)");
      gg.addColorStop(1, "rgba(11,4,22,0.86)");
      cx.save();
      cx.fillStyle = gg; cx.fillRect(0, top, W, H - top);
      cx.globalAlpha = 0.90;
      cx.fillStyle = C.yellow;
      cx.fillRect(0, top, W, Math.max(1.5, 2 * U));
      cx.restore();
    }
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
      /* V3.0: el segundo rótulo se ha movido a la INTRO (plano 14, 65,6–68,2 s).
         Aquí se retira para que no se lea dos veces en una misma partida: el
         descenso ya está contado por la propia intro, que es quien lo presenta. */
      flash(t, 3.85, 0.12, "#fff", 0.5);
    }
    inkWipe(seg(t, 0.3, 0.8), 5);
    /* Fundido de color hacia el Refugio. */
    if (t > 4.0) tint("#3a0d2c", ease(seg(t, 4.0, 4.55)));
  }

  /* ================================================================= SONIDO */
  var ac = null, master = null, musicBus = null, noiseBuf = null;
  var silenceTimer = 0;   /* ancla de silencio por reloj de PARED (ver silence) */
  var outLim = null;      /* limitador de salida: se desconecta para asegurar silencio */
  var outOn = false;      /* ¿el limitador está enchufado a los altavoces? */
  function outConnected() { return !!(outLim && outOn); }
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
        outLim = lim; outOn = true;
        var n = ac.sampleRate * 1.5; noiseBuf = ac.createBuffer(1, n, ac.sampleRate);
        var dta = noiseBuf.getChannelData(0);
        for (var i = 0; i < n; i++) dta[i] = Math.random() * 2 - 1;
      }
      if (ac.state === "suspended") ac.resume();
      /* Reabrir el bus cancela cualquier ancla de silencio pendiente: si no, el
         temporizador de `silence()` volvería a bajar el volumen de una secuencia
         que ya está sonando. También se reconecta la salida si `silence()` la
         había soltado. */
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = 0; }
      if (outLim) { try { outLim.connect(ac.destination); } catch (e0) {} }
      outOn = true;
      master.gain.cancelScheduledValues(0);
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
  /* ══════════════════════════════════════════════════════════════════════════
     PARTITURA V3.0 · 70 s, cinco actos

     Original, sintetizada entera con la API de audio del juego. Evoluciona con
     el montaje y cada acontecimiento visual importante tiene su golpe.

       I   (0–14)   celebración: cuerdas cálidas, bombo a 100 ppm, charla.
                    En 9–14 el «riser» se corta y el compás REINICIA igual.
       II  (14–28)  groove hipnótico: el patrón del acto I repetido literal.
                    En 18 entra una nota fuera de escala y NO se corrige.
       III (28–43)  cuantización forzada, disonancias, «stutter», filtro que
                    se cierra. En 38 el sub-grave llega desde abajo.
       IV  (43–59)  tres fotogramas de silencio → impacto → caída sin armonía.
                    En 54 aparece un pulso grave regular.
       V   (59–70)  el pulso se vuelve el tema del Refugio y resuelve en mayor.
     ========================================================================== */
  function buildIntroScore() {
    var ev = [], tb, i;
    function at(t, fn) { ev.push({ t: t, fn: fn }); }

    /* ── ACTO I · LA NOCHE QUE NO TERMINA (0–14) ─────────────────────────── */
    /* La fiesta se oye a través de los muros: filtro cerrado que se abre. */
    at(0, function (w) {
      musicBus.frequency.setValueAtTime(420, w);
      musicBus.frequency.exponentialRampToValueAtTime(9000, w + 3.6);
      noise(w, 4.0, 0.09, "bandpass", 220, 520);
    });
    /* Charla: murmullo de fondo, no melodía. */
    for (i = 0; i < 10; i++) {
      (function (i) {
        at(0.3 + i * 0.72, function (w) { noise(w, 0.22, 0.035, "bandpass", 700 + rnd(i * 3.1) * 900, 0); });
      })(i);
    }
    /* El pulso: 100 ppm = 0.6 s por negra. Cálido, no agresivo. */
    var B1 = 0.6;
    function warmBar(t0, bars, vol, trans) {
      for (var b = 0; b < bars; b++) {
        var t1 = t0 + b * B1 * 4;
        for (var n = 0; n < 8; n++) {
          (function (n, tt) {
            at(tt, function (w) {
              var k = Math.pow(2, -(trans || 0) / 12);
              if (n % 4 === 0) S.kick(w, 0.42 * vol, musicBus);
              if (n % 4 === 2) S.snare(w, 0.13 * vol, musicBus);
              if (n % 2 === 1) S.hat(w, 0.07 * vol, musicBus);
              /* cuerdas: acorde sostenido por compás, no arpegio */
              if (n === 0) {
                tone(w, 220 * k, B1 * 3.6, "triangle", 0.05 * vol, musicBus);
                tone(w, 277.2 * k, B1 * 3.6, "triangle", 0.035 * vol, musicBus);
                tone(w, 329.6 * k, B1 * 3.6, "triangle", 0.030 * vol, musicBus);
              }
            });
          })(n, t1 + n * B1 / 2);
        }
      }
    }
    warmBar(0.4, 4, 1.0, 0);            /* 0.4 → 10.0 */

    /* Melodía del acto I: entra en 4.4, crece, y se corta en 9. */
    var MEL = [440, 493.9, 554.4, 659.3, 587.3, 554.4, 493.9, 440];
    for (i = 0; i < 8; i++) {
      (function (i) {
        at(4.4 + i * 0.6, function (w) { S.lead(w, MEL[i], 0.10, musicBus); });
      })(i);
    }
    at(4.0, function (w) { S.whoosh(w, 0.8, 0.16, true); });
    /* 02 · el dolly-in: dos acentos suaves al abrir cada plano cercano. */
    at(4.9, function (w) { S.boom(w, 0.20); });
    at(6.6, function (w) { S.boom(w, 0.18); });
    at(8.2, function (w) { S.whoosh(w, 0.7, 0.20, false); });

    /* 03 · UNA CANCIÓN MÁS: el «riser» que se corta en seco y el compás que
       reinicia idéntico. Aquí nace el bucle, y se OYE nacer. */
    at(9.0, function (w) {
      musicBus.frequency.setValueAtTime(420, w);
      musicBus.frequency.exponentialRampToValueAtTime(14000, w + 3.2);
    });
    /* el plato girando: siseo rítmico */
    for (i = 0; i < 26; i++) {
      (function (i) {
        at(9.2 + i * 0.135, function (w) { S.crackle(w, 0.05 + 0.03 * Math.sin(i)); });
      })(i);
    }
    /* el corte: 12.35 s, la última nota NO termina */
    at(12.35, function (w) {
      S.snare(w, 0.55);
      noise(w, 0.05, 0.5, "highpass", 3000, 0);
      musicBus._gain.gain.setValueAtTime(1, w);
      musicBus._gain.gain.linearRampToValueAtTime(0.0001, w + 0.06);
    });
    /* y vuelve a empezar, EXACTAMENTE igual */
    at(12.45, function (w) {
      musicBus._gain.gain.setValueAtTime(1, w);
      musicBus.frequency.setValueAtTime(420, w);
      musicBus.frequency.exponentialRampToValueAtTime(9000, w + 1.4);
      S.kick(w, 0.55, musicBus);
      tone(w, 220, 0.9, "triangle", 0.05, musicBus);
    });

    /* ── ACTO II · EL DESAFINADO (14–28) ─────────────────────────────────── */
    /* El mismo patrón del acto I, repetido LITERALMENTE. Cuatro compases. */
    function loopBar4(t0, vol) {
      for (var n = 0; n < 8; n++) {
        (function (n, tt) {
          at(tt, function (w) {
            if (n % 4 === 0) S.kick(w, 0.48 * vol, musicBus);
            if (n % 4 === 2) S.snare(w, 0.16 * vol, musicBus);
            if (n % 2 === 1) S.hat(w, 0.09 * vol, musicBus);
            S.bass(w, BASS[n % 8], 0.13 * vol, musicBus);
          });
        })(n, t0 + n * 0.3);
      }
    }
    /* 04 · cuatro compases idénticos; el cuarto se rompe. */
    loopBar4(14.0, 1.0); loopBar4(14.0 + 1.2, 1.0);
    loopBar4(14.0 + 2.4, 1.0); loopBar4(14.0 + 3.6, 1.0);
    at(14.0, function (w) { S.whoosh(w, 0.25, 0.14, false); });
    at(15.2, function (w) { S.whoosh(w, 0.25, 0.14, false); });
    at(16.4, function (w) { S.whoosh(w, 0.25, 0.14, false); });
    /* el cuarto llega tarde y se queda colgado */
    at(17.28, function (w) { S.snare(w, 0.5); S.screech(w, 0.5, 0.10); });

    /* 05 · EL PASO INCORRECTO (18–23): el bombo se desfasa 1/8 y NADIE lo
       corrige. La nota fuera de escala entra en 18 y se queda. */
    for (tb = 18.0; tb < 23.0; tb += 0.3) {
      (function (tb) {
        at(tb, function (w) {
          var n = Math.round((tb - 18) / 0.3);
          if (n % 4 === 0) S.kick(w, 0.46, musicBus);
          if (n % 4 === 2) S.snare(w, 0.15, musicBus);
          S.hat(w, 0.08, musicBus);
          S.bass(w, BASS[n % 8], 0.12, musicBus);
        });
      })(tb);
    }
    /* la nota que no encaja: 466.2 Hz (sib) contra la escala en la menor */
    at(18.05, function (w) { tone(w, 466.2, 4.6, "square", 0.035, null, 466.2); });
    at(20.1, function (w) { S.kick(w, 0.7); S.boom(w, 0.35); });
    at(22.2, function (w) { S.whoosh(w, 0.6, 0.24, true); });

    /* 06 · EL QUE NO SE REPITE (23–28): órbita. El groove se queda, la disonancia
       crece, y un arpegio describe la vuelta de la cámara. */
    for (tb = 23.0; tb < 28.0; tb += 0.3) {
      (function (tb) {
        at(tb, function (w) {
          var n = Math.round((tb - 23) / 0.3);
          if (n % 4 === 0) S.kick(w, 0.42, musicBus);
          if (n % 4 === 2) S.snare(w, 0.14, musicBus);
          S.hat(w, 0.07, musicBus);
          if (n % 2 === 0) S.bass(w, BASS[(n / 2) % 8], 0.11, musicBus);
        });
      })(tb);
    }
    for (i = 0; i < 12; i++) {
      (function (i) {
        at(23.2 + i * 0.38, function (w) {
          tone(w, 440 * Math.pow(2, (i % 6) / 12), 0.16, "triangle", 0.045);
        });
      })(i);
    }
    at(23.05, function (w) { tone(w, 233.1, 4.8, "square", 0.022); });

    /* ── ACTO III · LA CORRECCIÓN (28–43) ────────────────────────────────── */
    /* 07 · EL ERROR: todo se CUANTIZA a la fuerza. El mismo compás, pero rígido
       y a 1,7×. La disonancia del acto II se convierte en acorde. */
    at(28.0, function (w) { S.hit(w, 0.75); musicBus.frequency.setValueAtTime(1600, w); });
    for (tb = 28.0; tb < 33.0; tb += BEAT / 3.4) {
      (function (tb) {
        at(tb, function (w) {
          var n = Math.round(tb / (BEAT / 3.4));
          S.kick(w, n % 2 === 0 ? 0.62 : 0.32, musicBus);
          if (n % 3 === 0) S.snare(w, 0.22, musicBus);
          if (n % 2 === 1) S.hat(w, 0.11, musicBus);
          if (n % 4 === 0) S.bass(w, BASS[(n / 4 | 0) % 8] * 0.5, 0.18, musicBus);
        });
      })(tb);
    }
    at(28.4, function (w) { tone(w, 110, 4.4, "sawtooth", 0.06, null, 104); tone(w, 466.2, 4.2, "square", 0.026); });
    at(30.2, function (w) { S.screech(w, 0.85, 0.13); });
    at(32.4, function (w) { S.boom(w, 0.45); });
    at(33.0, function (w) { S.hit(w, 0.7); });

    /* 08 · LA TORRE REACCIONA: las nueve pistas se encienden una a una, cada una
       con su nota. Es el mismo gesto de la V2 (una nota descendente por planta)
       pero ahora cuenta la corrección. */
    for (i = 0; i < 9; i++) {
      (function (i) {
        at(33.15 + i * 0.36, function (w) {
          tone(w, 660 * Math.pow(2, -i / 12), 0.16, "square", i === 8 ? 0.18 : 0.12);
          S.hat(w, 0.22);
          S.bass(w, BASS[i % 8], 0.16, musicBus);
          if (i % 2 === 1) S.kick(w, 0.36, musicBus);
        });
      })(i);
    }
    at(33.1, function (w) { S.rumble(w, 4.6, 0.15); });
    /* las puertas: el mismo batiente tres veces, en tres profundidades */
    at(34.0, function (w) { S.whoosh(w, 0.4, 0.20, false); });
    at(35.0, function (w) { S.whoosh(w, 0.4, 0.20, false); });
    at(36.0, function (w) { S.whoosh(w, 0.4, 0.20, false); });
    at(36.4, function (w) { S.screech(w, 0.7, 0.11); });

    /* 09 · EL GOLPE: el sub-grave llega DESDE DEBAJO. 30 Hz, y el mecanismo
       empieza a girar. */
    at(38.0, function (w) {
      tone(w, 30, 3.4, "sine", 0.55);
      noise(w, 2.2, 0.22, "lowpass", 90, 60);
      S.boom(w, 0.9);
    });
    at(38.3, function (w) { S.rumble(w, 3.0, 0.22); });
    /* el mecanismo: un anillo que gira, con su chirrido metálico repetido */
    for (i = 0; i < 10; i++) {
      (function (i) {
        at(39.4 + i * 0.18, function (w) { noise(w, 0.08, 0.10, "bandpass", 2200 + rnd(i) * 1600, 0); });
      })(i);
    }
    at(39.4, function (w) { tone(w, 82.4, 3.0, "sawtooth", 0.10, null, 61.7); });
    at(41.0, function (w) { S.screech(w, 0.8, 0.13); });

    /* ── ACTO IV · EL DESCENSO (43–59) ───────────────────────────────────── */
    /* 10 · LA RUPTURA: tres fotogramas de SILENCIO y luego el impacto. */
    at(43.0, function (w) {
      musicBus._gain.gain.setValueAtTime(1, w);
      musicBus._gain.gain.linearRampToValueAtTime(0.0001, w + 0.05);
    });
    at(43.05, function (w) {
      /* el silencio se consigue con el bus cerrado y nada más sonando */
    });
    at(43.5, function (w) {
      musicBus._gain.gain.setValueAtTime(1, w);
      S.boom(w, 1.0);
      S.hit(w, 0.8);
      noise(w, 1.6, 0.45, "lowpass", 400, 90);
    });
    /* las losas que caen: una por una */
    for (i = 0; i < 10; i++) {
      (function (i) {
        at(43.6 + i * 0.22 + rnd(i * 1.7) * 0.1, function (w) {
          noise(w, 0.14, 0.12 + 0.10 * rnd(i), "bandpass", 900 + rnd(i * 3.3) * 1500, 0);
        });
      })(i);
    }
    at(44.4, function (w) { S.rumble(w, 3.2, 0.24); });

    /* 11 · LA CAÍDA (48–54): sin armonía. Viento, tela y escombros. */
    at(48.0, function (w) {
      musicBus._gain.gain.setValueAtTime(1, w);
      S.whoosh(w, 1.4, 0.34, true);
      noise(w, 5.8, 0.16, "lowpass", 260, 120);
    });
    /* el viento sube: un soplido por segundo, cada vez más agudo */
    for (i = 0; i < 12; i++) {
      (function (i) {
        at(48.3 + i * 0.46, function (w) { S.whoosh(w, 0.36, 0.09 + 0.02 * i, true); });
      })(i);
    }
    /* el sombrero se desprende: 49.4 */
    at(49.4, function (w) { S.whoosh(w, 0.5, 0.16, false); });
    /* escombros que suben */
    for (i = 0; i < 8; i++) {
      (function (i) {
        at(48.6 + i * 0.66, function (w) { noise(w, 0.10, 0.09, "bandpass", 1400 + rnd(i * 2.1) * 2200, 0); });
      })(i);
    }

    /* 12 · LA TORRE INFINITA (54–59): el viento se ORDENA y aparece un pulso
       grave regular. Es la transición al Refugio. */
    at(54.0, function (w) { S.whoosh(w, 1.0, 0.22, false); S.rumble(w, 2.4, 0.14); });
    for (i = 0; i < 8; i++) {
      (function (i) {
        at(54.6 + i * 0.55, function (w) {
          S.kick(w, 0.30 + i * 0.02, musicBus);
          tone(w, 55 * Math.pow(2, (i % 4) / 12), 0.5, "triangle", 0.06, musicBus);
        });
      })(i);
    }
    /* la plataforma aparece: 55.4 */
    at(55.4, function (w) { S.boom(w, 0.35); S.whoosh(w, 0.9, 0.14, true); });

    /* ── ACTO V · EL REFUGIO (59–70) ─────────────────────────────────────── */
    /* 13 · EL ATERRIZAJE: el pulso grave se convierte en el tema del Refugio;
       la armonía resuelve en La MAYOR (tercera mayor: 277.2 en vez de 261.6). */
    at(59.0, function (w) {
      musicBus._gain.gain.setValueAtTime(1, w);
      musicBus.frequency.setValueAtTime(1800, w);
      S.hit(w, 0.45);
    });
    /* el tema: cuatro acordes, cálidos, en mayor */
    var REF = [[220, 277.2, 329.6], [246.9, 311.1, 370.0], [196, 246.9, 293.7], [220, 277.2, 329.6]];
    for (i = 0; i < 4; i++) {
      (function (i) {
        at(59.4 + i * 1.15, function (w) {
          var ch = REF[i];
          tone(w, ch[0], 1.5, "triangle", 0.055, musicBus);
          tone(w, ch[1], 1.5, "triangle", 0.042, musicBus);
          tone(w, ch[2], 1.5, "triangle", 0.036, musicBus);
          S.bass(w, ch[0] / 2, 0.13, musicBus);
        });
      })(i);
    }
    /* el aterrizaje: 60.6 (polvo y contacto) */
    at(60.6, function (w) { S.boom(w, 0.4); noise(w, 0.4, 0.16, "lowpass", 500, 160); });
    /* la plataforma se retira */
    at(61.8, function (w) { S.whoosh(w, 0.7, 0.12, false); });

    /* 14 · EL COMIENZO (64–70): el tema se establece y queda sonando hasta que
       el HUB toma el relevo. */
    at(64.0, function (w) {
      S.kick(w, 0.42, musicBus);
      tone(w, 220, 2.2, "triangle", 0.05, musicBus);
      tone(w, 277.2, 2.2, "triangle", 0.038, musicBus);
    });
    for (i = 0; i < 6; i++) {
      (function (i) {
        at(64.0 + i * 0.9, function (w) {
          if (i % 2 === 0) S.kick(w, 0.30, musicBus);
          S.hat(w, 0.06, musicBus);
        });
      })(i);
    }
    at(65.6, function (w) { tone(w, 329.6, 2.4, "triangle", 0.045, musicBus); });
    at(68.2, function (w) { tone(w, 440, 1.6, "triangle", 0.040, musicBus); });
    /* Cierre: el último acorde SE APAGA en vez de reabrir el bus. Antes, este
       evento ponía el filtro a 18 kHz en 69,0 s y el fundido final de `silence()`
       medía una apertura, no un cierre: la ganancia se quedaba congelada en
       0,26 y el tema seguía sonando encima del Refugio. */
    at(69.0, function (w) {
      musicBus.frequency.cancelScheduledValues(w);
      musicBus.frequency.setValueAtTime(musicBus.frequency.value || 18000, w);
      musicBus.frequency.exponentialRampToValueAtTime(420, w + 0.9);
      tone(w, 220, 0.8, "sine", 0.045);
    });

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
      /* `master.gain.value` es el valor YA aplicado; si había una automatización
         en curso devuelve el último punto, no el que suena. Eso dejaba el fundido
         a medias (0,22) y el tema seguía audible sobre el Refugio. Se cancela,
         se ancla explícitamente a 0 y se mantiene ahí: el silencio no es una
         rampa que pueda quedar sin terminar, es un estado. */
      var f = Math.max(0.05, fade || 0.15);
      /* Rampla exponencial hacia el suelo y ANCLA explícita al final. Sin el
         ancla, una rampa exponencial sólo se ACERCA a cero: medida en el
         navegador real se quedaba en 0,05 y el tema seguía audible bajo el
         Refugio. Con `setTargetAtTime` + `setValueAtTime(0)` el silencio es un
         estado garantizado, no una asíntota. */
      var from = Math.max(0.0002, master.gain.value);
      master.gain.cancelScheduledValues(n);
      master.gain.setValueAtTime(from, n);
      master.gain.exponentialRampToValueAtTime(0.0001, n + f);
      master.gain.setValueAtTime(0, n + f + 0.01);
      /* Red de seguridad por RELOJ DE PARED.
         `AudioParam.value` sólo avanza cuando avanza el reloj de audio, y ese
         reloj se atrasa cuando la pestaña va cargada (render de audio diferido).
         Medido en la batería de pruebas: el fundido se quedaba clavado en 0,0086
         indefinidamente aunque su automatización ya había terminado en el papel.
         En un equipo lento eso es sonido fantasma sobre el Refugio. Un ancla
         explícita a los `f + 0,15` s de reloj real garantiza el silencio pase lo
         que pase con el reloj de audio. El estado queda como un valor fijo, así
         que abrir de nuevo el bus (`master.gain.setValueAtTime` en ensure())
         sigue funcionando sin arrastrar nada. */
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = 0; }
      silenceTimer = setTimeout(function () {
        silenceTimer = 0;
        try {
          /* `cancelScheduledValues(0)`, NO `(currentTime)`: si el reloj de audio
             se atrasó, los eventos de la rampa están en el futuro y cancelar
             desde `currentTime` no los toca — la rampa seguiría por delante del
             ancla y el valor nunca llegaría a cero. */
          master.gain.cancelScheduledValues(0);
          master.gain.setValueAtTime(0, 0);
        } catch (e2) {}
        /* Y la garantía física: se SUELTA la salida.
           Ajustar una ganancia depende de que el hilo de audio avance; en una
           pestaña cargada ese hilo se atrasa y el valor medido se quedaba en
           0,003 durante segundos, con la partitura aún audible bajo el Refugio.
           Desconectar el limitador de los altavoces no depende de ningún reloj:
           si no hay arista en el grafo, no hay sonido. Volver a abrir el bus
           (`audioReady`) la reconecta. */
        if (outLim) { try { outLim.disconnect(); } catch (e3) {} outOn = false; }
      }, Math.round((f + 0.15) * 1000));
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
    hintEl.classList.remove("is-on");
    document.body.classList.remove("dd-opening-on");
    document.body.removeAttribute("data-dd-opening");
    /* Primero se avisa (el menú o el Refugio se colocan debajo) y después el
       lienzo se funde: nunca se pasa por negro. */
    if (typeof s.onDone === "function") { try { s.onDone(why); } catch (e) { console.warn("[DD_OPENING] onDone", e); } }
    /* DESPUÉS del relevo, no antes: el destino (menú o Refugio) puede tocar el
       audio al arrancar, y antes este fundido se lanzaba primero y quedaba
       reabierto a medias. El sonido de la secuencia nunca sobrevive a la
       secuencia, pero el silencio se aplica el último. */
    silence(why === "complete" ? 0.6 : 0.15);
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
    /* `gain` es la ganancia REALMENTE audible: si la salida está desconectada no
       sale nada, diga lo que diga el parámetro. `param` es el valor crudo de
       `master.gain` y se conserva para diagnóstico: con el hilo de audio atrasado
       se queda en el valor de la rampa aunque el grafo ya no llegue a los
       altavoces. Antes esta función devolvía sólo el parámetro y por eso la
       batería veía «0,003» en un estado que ya era silencio absoluto. */
    audioState: function () {
      if (!ac) return null;
      var g = master ? +master.gain.value.toFixed(4) : null;
      return { state: ac.state, connected: outConnected(), gain: outConnected() ? g : 0, param: g };
    },
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
