/* ==========================================================================
   DEADBEAT DISCO — PLAYABLE ISOMETRIC REFUGIO / HUB (window.DD_HUB)
   Faithful playable reconstruction of REF_05 -> REFUGIO / HUB with full
   keyboard, mouse & Xbox gamepad navigation, NPCs, stations & Descent Pad.
   ========================================================================== */
(function () {
  "use strict";

  const HUB_BOUNDS = { x: 130, y: 145, w: 1560, h: 950 };
  const DESCENT = { x: 910, y: 875 };
  const state = {
    active: false,
    px: 910,
    py: 700,
    vx: 0,
    vy: 0,
    aimAngle: -Math.PI / 4,
    time: 0,
    lastTs: 0,
    keys: Object.create(null),
    nearStation: null,
    interactCooldown: 0,
    roomCache: null,
    roomCacheStamp: ""
  };

  /* Protagonista en el Refugio: el IDLE 07B aprobado, sin sombrero (lo perdió en
     el descenso). Se carga aquí, directamente, sin tocar el registro de recursos
     ni el pintor del motor. Es un único fotograma: se dibuja siempre entero, con
     escala uniforme y sin espejar (espejarlo cambiaría los tatuajes de brazo).
     Los sprites de combate no cambian: fuera del Refugio pinta el motor. */
  const REFUGE_IDLE = {
    src: "assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png",
    w: 288, h: 512,          /* tamaño del PNG */
    feetY: 505, midX: 140,   /* suela y eje del cuerpo dentro del PNG */
    bodyH: 462,              /* alto del dibujo (sin márgenes transparentes) */
    drawH: 134,              /* alto del cuerpo en unidades del Refugio (como la figura anterior y los personajes de la sala) */
    img: null, ok: false, failed: false, lastRect: null
  };
  function ensureRefugeIdle() {
    if (REFUGE_IDLE.img) return;
    const im = new Image();
    im.onload = function () { REFUGE_IDLE.ok = im.naturalWidth === REFUGE_IDLE.w && im.naturalHeight === REFUGE_IDLE.h; REFUGE_IDLE.failed = !REFUGE_IDLE.ok; };
    im.onerror = function () { REFUGE_IDLE.failed = true; };
    im.src = REFUGE_IDLE.src;
    REFUGE_IDLE.img = im;
  }
  function drawRefugeIdle(ctx) {
    ensureRefugeIdle();
    if (!REFUGE_IDLE.ok) return false;
    const k = REFUGE_IDLE.drawH / REFUGE_IDLE.bodyH;
    const moving = Math.hypot(state.vx, state.vy) > 12;
    /* Sólo traslación: respiración de menos de un píxel parado, paso corto al andar. */
    const bob = moving ? -Math.abs(Math.sin(state.time * 9.5)) * 2.2 : Math.sin(state.time * 2.4) * 0.7;
    const dw = REFUGE_IDLE.w * k, dh = REFUGE_IDLE.h * k;
    const dx = state.px - REFUGE_IDLE.midX * k, dy = state.py + 16 - REFUGE_IDLE.feetY * k + bob;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(REFUGE_IDLE.img, dx, dy, dw, dh);
    ctx.restore();
    REFUGE_IDLE.lastRect = { x: +dx.toFixed(1), y: +dy.toFixed(1), w: +dw.toFixed(2), h: +dh.toFixed(2) };
    return true;
  }

  /* Refugio rediseñado (TR_W15 · 2026-11-15): reconstrucción arquitectónica y
     funcional por sectores, no un simple recolocado. Misma identidad aprobada
     (damero, mezzanine de 9 portales, paleta magenta/cian/violeta, neones).
       · E Barra Social (NO): backbar + barra + asientos altos.
       · E Escenario DJ Virgilio (NE): torre/subwoofer + DJ detrás de la cabina.
       · C Armería (O): rack de armas + stock + cofre + armero (estación propia).
       · A Mando (centro): Mesa Astral — estación "map" (Torre de los 9 Círculos).
       · D Laboratorio de la Torre (E): orbe Tesla + pedestal (decorado, sin sistema nuevo).
       · B Salón de descanso (SO): sofás enfrentados + mesa + candelabras + alfombra.
       · E Ocio (SE): arcades + vending + banquillo.
       · F Circulación: grieta de descenso (S-centro), spawn (910,700), pasillos
         naturales entre sectores; la Mesa Astral manda el eje visual. */
  /* dw = ancho de dibujo en world units (escala deliberada por activo,
     referencia: protagonista ~112 px de alto). Sin dw, drawProp deriva la
     escala del br de colisión (heurística heredada). */
  const HUB_PROPS = [
    // E · Barra Social (NO) — backbar apoyado en el muro norte (fuera de la
    //   banda de portales, que empieza en x≈616) y barra alineada con él
    { kind: "shelf", x: 235, y: 316, br: 44, dw: 150 },
    { kind: "shelf", x: 390, y: 316, br: 44, dw: 150 },
    { kind: "shelf", x: 545, y: 316, br: 44, dw: 150 },
    { kind: "barcounter", x: 400, y: 376, br: 64, dw: 250 },
    { kind: "cooler", x: 620, y: 432, br: 36, dw: 100 },
    { kind: "bench", x: 340, y: 452, br: 30, dw: 130 },
    { kind: "bench", x: 480, y: 452, br: 30, dw: 130 },
    // E · Escenario DJ Virgilio (NE) — los tres elementos sobre la misma
    //   línea del muro norte (y≈315-318), flanqueados por palmeras
    { kind: "speaker", x: 1185, y: 318, br: 36, dw: 96 },
    { kind: "djbooth", x: 1400, y: 315, br: 58, dw: 196 },
    { kind: "subwoofer", x: 1572, y: 318, br: 38, dw: 110 },
    { kind: "palm", x: 1100, y: 372, br: 36, dw: 150 },
    { kind: "palm", x: 1638, y: 372, br: 36, dw: 125 },
    // C · Armería (O) — todo contra el muro oeste, en columna bajo la barra
    { kind: "weaponrack", x: 235, y: 565, br: 62, dw: 228 },
    { kind: "shelf", x: 232, y: 690, br: 42, dw: 140 },
    { kind: "chest", x: 430, y: 622, br: 32, dw: 112 },
    { kind: "crate", x: 520, y: 628, br: 30, dw: 100 },
    // A · Centro de operaciones (mando) — Mesa Astral, eje del Refugio
    { kind: "astraltable", x: 905, y: 578, br: 78, dw: 235 },
    { kind: "candelabra", x: 742, y: 500, br: 22, dw: 92 },
    { kind: "candelabra", x: 1070, y: 500, br: 22, dw: 92 },
    // D · Ala experimental de la Torre (E) — exposición sobre su eje
    { kind: "teslaorb", x: 1520, y: 462, br: 56, dw: 150 },
    { kind: "pedestal", x: 1382, y: 505, br: 30, dw: 118 },
    // B · Salón de descanso (SO) — simétrico sobre la alfombra
    { kind: "sofa", x: 300, y: 865, br: 48, dw: 205 },
    { kind: "sofa", x: 505, y: 865, br: 48, dw: 205, flipX: true },
    { kind: "armchair", x: 205, y: 858, br: 32, dw: 124 },
    { kind: "armchair", x: 600, y: 858, br: 32, dw: 124, flipX: true },
    { kind: "bench", x: 402, y: 912, br: 28, dw: 128 },
    { kind: "neonflower", x: 402, y: 878, br: 14, dw: 78 },
    { kind: "plant", x: 185, y: 1010, br: 30, dw: 105 },
    // E · Ocio (SE) — fila alineada en el rincón (misma línea de apoyo)
    { kind: "arcade", x: 1305, y: 838, br: 38, dw: 150 },
    { kind: "arcade", x: 1435, y: 838, br: 38, dw: 150 },
    { kind: "vending", x: 1605, y: 830, br: 38, dw: 150 },
    { kind: "bench", x: 1458, y: 935, br: 30, dw: 132 }
  ];

  const STATIONS = [
    {
      id: "descent",
      label: "GRIETA DEL REFUGIO · INICIAR INCURSIÓN",
      prompt: "Pulsa [E] / (A) para lanzarte por la grieta · Círculo I · Lujuria",
      x: DESCENT.x,
      y: DESCENT.y,
      r: 110
    },
    {
      id: "armory",
      label: "ARMERÍA DEL REFUGIO · INVENTARIO Y TIENDA",
      prompt: "Pulsa [E] / (A) para abrir Armería (120 Armas)",
      x: 240,
      y: 615,
      r: 75
    },
    {
      id: "dj",
      label: "CABINA DE DJ VIRGILIO",
      prompt: "Pulsa [E] / (A) para hablar con DJ Virgilio",
      x: 1400,
      y: 330,
      r: 105
    },
    {
      id: "map",
      label: "MESA ASTRAL · MAPA DE PROGRESIÓN",
      prompt: "Pulsa [E] / (A) para inspeccionar la Torre de los 9 Círculos",
      x: 905,
      y: 585,
      r: 95
    },
    {
      id: "bar",
      label: "BARRA DEL REFUGIO · TEMPO EN LA RADIO",
      prompt: "Pulsa [E] / (A) para barra y consejo de la casa",
      x: 400,
      y: 415,
      r: 80
    },
    {
      id: "armorer",
      label: "ARMERO DEL REFUGIO · CONSEJO DE ARMAS",
      prompt: "Pulsa [E] / (A) para hablar con la armera",
      x: 378,
      y: 585,
      r: 70
    }
  ];

  const BAR_QUOTES = [
    "La brasa canta más fuerte cuanto más cerca del escenario. Si vienes de bajar, la casa siempre te sirve a tiempo.",
    "Whisky de turno, por cuenta de la casa. Nadie paga la primera ronda del descenso; el Cajero ni se entera de estas cosas.",
    "¿Primera vez en la Torre? Empieza por el Limbo y guarda el combo: el compás decide a quién se traga el piso.",
    "Sin prisa, nadie te espera. En el refugio no hay turnos ni cronómetro; sal cuando tu canción esté lista."
  ];
  const ARMORER_QUOTES = [
    "M1911, siempre cargada. Munición infinita, templador; lo que se agota es la paciencia del piso.",
    "Pasa por la Armería antes de bajar. Lo que compres aquí vuelve contigo; lo que olvides se queda bailando abajo.",
    "Cada arma tiene su carácter: la MAGNUM perdona poco, el UZI casi todo. Elige según tu compás.",
    "Si ves un Residente, no improvises. La Torre avisa siempre: el flash, el latido, el silencio antes del DROP. Ese silencio es tuyo."
  ];
  let barIdx = -1;
  let armorerIdx = -1;

  const DJ_QUOTES = [
    "Has llegado al Refugio. Aquí la canción no te alcanza. Elige un arma en la Armería antes de bajar.",
    "Nueve círculos, nueve residentes y el Núcleo latiendo al fondo. Si pierdes el compás, la pista te traga.",
    "¿Ves el zorro de neón en el muro? Mientras siga encendido, esta sala es tregua sagrada.",
    "Revisa tus créditos antes de asomarte a la grieta. El Cajero no perdona deudas en el tercer piso."
  ];
  let quoteIdx = 0;

  function enter() {
    ensureRefugeIdle();
    state.active = true;
    state.px = 910;
    state.py = 700;
    state.vx = 0;
    state.vy = 0;
    state.interactCooldown = 0.35;
    initAmbient();
    // Freeze the live run (if any) while the player walks the safe zone, so no
    // offscreen simulation can damage/kill the protagonist behind the HUB camera.
    if (window.__DD_BRIDGE && typeof window.__DD_BRIDGE.setPaused === "function") {
      window.__DD_BRIDGE.setPaused(true);
    }
    // TEMPO abre con una línea al azar (antes siempre la misma)
    quoteIdx = Math.floor(Math.random() * DJ_QUOTES.length);
    if (window.DD_UI) {
      window.DD_UI.hideMainMenu();
      window.DD_UI.showDialogue("TEMPO", DJ_QUOTES[quoteIdx], 5.2);
    }
    // Cama musical del Refugio (pista del club en fundido). Se agenda con
    // retraso: enterGame() para la música del menú al validar el arranque y
    // llegaría después que este enter().
    setTimeout(function () {
      if (!state.active) return;
      try {
        if (window.DD_BOOT && window.DD_BOOT.audio && typeof window.DD_BOOT.audio.startMenuMusic === "function") {
          window.DD_BOOT.audio.startMenuMusic(2.0);
        } else if (window.DDC_COVER && window.DDC_COVER.music && typeof window.DDC_COVER.music.start === "function") {
          window.DDC_COVER.music.start(4);
        }
      } catch (e) { /* sin audio: silencio, no rompe */ }
    }, 900);
  }

  function exitToRun() {
    if (!state.active) return;
    state.active = false;
    try {
      if (window.DD_BOOT && window.DD_BOOT.audio && typeof window.DD_BOOT.audio.stopMenuMusic === "function") {
        window.DD_BOOT.audio.stopMenuMusic(0.4);
      } else if (window.DDC_COVER && window.DDC_COVER.music && typeof window.DDC_COVER.music.stop === "function") {
        window.DDC_COVER.music.stop(0.4);
      }
    } catch (e) { /* sin audio */ }
    const triggerRun = function () {
      // rp() clears the pause flag on startRun; this covers the no-run case too.
      if (window.__DD_BRIDGE && typeof window.__DD_BRIDGE.setPaused === "function") {
        window.__DD_BRIDGE.setPaused(false);
      }
      const br = window.__DD_BRIDGE;
      if (br && typeof br.startRun === "function") {
        br.startRun();
      } else if (window.DDC_COVER && typeof window.DDC_COVER.start === "function") {
        // Legacy sanctioned entry: the ddc cover owns #start-btn while locked,
        // so route through its own exposed start() (unlocks keyboard too).
        window.DDC_COVER.start();
      } else {
        const startBtn = document.getElementById("start-btn");
        if (startBtn) { startBtn.disabled = false; startBtn.click(); }
      }
      if (window.DD_UI) {
        window.DD_UI.hideMainMenu();
      }
    };
    if (window.DD_CINE && typeof window.DD_CINE.playCircleDescent === "function") {
      window.DD_CINE.playCircleDescent(1, triggerRun);
    } else {
      triggerRun();
    }
  }

  function triggerStation(st) {
    if (!st || state.interactCooldown > 0) return;
    state.interactCooldown = 0.35;
    if (st.id === "descent") {
      exitToRun();
    } else if (st.id === "armory" && window.DD_UI) {
      window.DD_UI.openShop();
    } else if (st.id === "map" && window.DD_UI) {
      window.DD_UI.openMap();
    } else if (st.id === "dj" && window.DD_UI) {
      quoteIdx = (quoteIdx + 1) % DJ_QUOTES.length;
      window.DD_UI.showDialogue("TEMPO", DJ_QUOTES[quoteIdx], 5.5);
    } else if (st.id === "bar" && window.DD_UI) {
      barIdx = (barIdx + 1) % BAR_QUOTES.length;
      window.DD_UI.showDialogue("EL BARTENDER", BAR_QUOTES[barIdx], 5.6, "dialogue_portrait_bartender");
    } else if (st.id === "armorer" && window.DD_UI) {
      armorerIdx = (armorerIdx + 1) % ARMORER_QUOTES.length;
      window.DD_UI.showDialogue("LA ARMERA", ARMORER_QUOTES[armorerIdx], 5.6, "dialogue_portrait_armorer");
    }
  }

  function pollGamepad() {
    const out = { mx: 0, my: 0, ax: 0, ay: 0, interact: false };
    if (!navigator.getGamepads) return out;
    const pads = navigator.getGamepads();
    for (let i = 0; i < pads.length; i++) {
      const gp = pads[i];
      if (!gp || !gp.connected) continue;
      const lx = gp.axes[0] || 0;
      const ly = gp.axes[1] || 0;
      const rx = gp.axes[2] || 0;
      const ry = gp.axes[3] || 0;
      if (Math.hypot(lx, ly) > 0.18) { out.mx = lx; out.my = ly; }
      if (Math.hypot(rx, ry) > 0.22) { out.ax = rx; out.ay = ry; }
      if (gp.buttons[0] && gp.buttons[0].pressed) out.interact = true;
      break;
    }
    return out;
  }

  function update(dt) {
    if (!state.active) return;
    const cdt = Math.min(0.05, Math.max(0.001, dt || 0.016));
    state.time += cdt;
    updateAmbient(cdt);
    if (state.interactCooldown > 0) state.interactCooldown = Math.max(0, state.interactCooldown - cdt);

    // Pause HUB movement while modal or blocking cinematic is open
    if ((window.DD_UI && window.DD_UI.isModalOpen()) || (window.DD_CINE && window.DD_CINE.isBlocking())) {
      return;
    }

    let ix = 0, iy = 0;
    if (state.keys["KeyW"] || state.keys["ArrowUp"]) iy -= 1;
    if (state.keys["KeyS"] || state.keys["ArrowDown"]) iy += 1;
    if (state.keys["KeyA"] || state.keys["ArrowLeft"]) ix -= 1;
    if (state.keys["KeyD"] || state.keys["ArrowRight"]) ix += 1;

    const gp = pollGamepad();
    if (Math.hypot(gp.mx, gp.my) > 0.1) {
      ix = gp.mx;
      iy = gp.my;
    }
    const mag = Math.hypot(ix, iy);
    if (mag > 1) { ix /= mag; iy /= mag; }

    const speed = 285;
    state.vx = ix * speed;
    state.vy = iy * speed;
    let nx = state.px + state.vx * cdt;
    let ny = state.py + state.vy * cdt;

    // Room wall bounds
    const margin = 38;
    nx = Math.max(HUB_BOUNDS.x + margin, Math.min(HUB_BOUNDS.x + HUB_BOUNDS.w - margin, nx));
    ny = Math.max(HUB_BOUNDS.y + margin + 24, Math.min(HUB_BOUNDS.y + HUB_BOUNDS.h - margin, ny));

    // Furniture solid circle pushout
    for (let i = 0; i < HUB_PROPS.length; i++) {
      const p = HUB_PROPS[i];
      const minD = (p.br || 32) * 0.72 + 18;
      const dx = nx - p.x;
      const dy = ny - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.001 && d < minD) {
        nx = p.x + (dx / d) * minD;
        ny = p.y + (dy / d) * minD;
      }
    }
    state.px = nx;
    state.py = ny;

    if (Math.hypot(gp.ax, gp.ay) > 0.2) {
      state.aimAngle = Math.atan2(gp.ay, gp.ax);
    } else if (mag > 0.15) {
      state.aimAngle = Math.atan2(iy, ix);
    }

    // Drive organic player animation state machine so HUB walks/idles smoothly!
    if (window.DMO && window.DMO.playerAnim) {
      const pa = window.DMO.playerAnim;
      pa.speed = Math.hypot(state.vx, state.vy);
      pa.breathePhase += cdt * 2.8;
      if (pa.speed > 12) {
        pa.stridePhase += cdt * 9.5;
        pa.walkFrame = Math.floor(pa.stridePhase) % 4;
        pa.bobY = Math.sin(pa.stridePhase * Math.PI) * 2.4;
        pa.upperPose = "player_idle";
        pa.lowerPose = "player_walk" + pa.walkFrame;
        pa.waistSplitActive = true;
      } else {
        pa.bobY = Math.sin(pa.breathePhase) * 1.1;
        pa.upperPose = "player_idle";
        pa.lowerPose = "player_idle";
        pa.waistSplitActive = false;
      }
    }

    // Check nearest interactive station
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < STATIONS.length; i++) {
      const st = STATIONS[i];
      const d = Math.hypot(state.px - st.x, state.py - st.y);
      if (d <= st.r && d < bestDist) {
        best = st;
        bestDist = d;
      }
    }
    state.nearStation = best;

    if (gp.interact && best) {
      triggerStation(best);
    }
  }

  /* Reconstrucción total (FASE 2 · incremento 1): suelo damero del HUB y
     mezzanine decorativo con los 9 accesos. Reversible con
     window.__DD_HUB_REBUILD = false desde el arranque (suelo clásico, sin
     mezzanine). No hay estaciones ni lógica detrás de los portales. */
  const HUB_REBUILD = function () { return window.__DD_HUB_REBUILD !== false; };
  const MEZZ_PORTALS = [
    { name: "LUJURIA", neon: "#ff2d7a" },
    { name: "GULA", neon: "#f59e0b" },
    { name: "AVARICIA", neon: "#facc15" },
    { name: "IRA", neon: "#ef4444" },
    { name: "HEREJÍA", neon: "#a855f7" },
    { name: "VIOLENCIA", neon: "#fb7185" },
    { name: "FRAUDE", neon: "#22d3ee" },
    { name: "TRAICIÓN", neon: "#38bdf8" },
    { name: "NÚCLEO", neon: "#f8fafc" }
  ];
  function paintMezzanine(cctx) {
    if (!window.DD_ASSETS) return;
    const frame = window.DD_ASSETS.get("hub_portal_frame");
    if (!frame) return;
    // Banda de mezzanine: justo sobre el muro norte pero dentro de la vista
    // (el HUD tapa la zona y<170 en pantalla; el muro vive en y≈176..308).
    // Los arcos van ligeramente solapados por el mobiliario trasero, que se
    // dibuja después y les da profundidad de segunda planta.
    const w = 96, h = 118, gap = 18;
    const total = MEZZ_PORTALS.length * w + (MEZZ_PORTALS.length - 1) * gap;
    let x = ((cctx.canvas.width || 2240) - total) / 2;
    const y = 206;
    for (let i = 0; i < MEZZ_PORTALS.length; i++) {
      const p = MEZZ_PORTALS[i];
      const cx = x + w / 2;
      // Halo exterior del círculo (aditivo suave) + interior encendido
      if (window.DD_WORLD && typeof window.DD_WORLD.drawNeonGlow === "function") {
        window.DD_WORLD.drawNeonGlow(cctx, cx, y + 66, 84, p.neon, 0.4);
      }
      cctx.save();
      cctx.shadowColor = p.neon;
      cctx.shadowBlur = 26;
      cctx.drawImage(frame, x, y, w, h);
      cctx.restore();
      // Vano iluminado por dentro (el marco es opaco; el vano es casi negro,
      // así que una elipse aditiva encendida lee como interior del portal)
      cctx.save();
      cctx.globalCompositeOperation = "screen";
      const g = cctx.createRadialGradient(cx, y + 78, 2, cx, y + 78, 30);
      g.addColorStop(0, p.neon);
      g.addColorStop(1, "rgba(0,0,0,0)");
      cctx.globalAlpha = 0.9;
      cctx.fillStyle = g;
      cctx.beginPath();
      cctx.ellipse(cx, y + 82, 22, 46, 0, 0, Math.PI * 2);
      cctx.fill();
      cctx.restore();
      x += w + gap;
    }
  }

  /* Arquitectura interior del Refugio rediseñado (TR_W15): delimita sectores
     SIN levantar muros — la línea de visión se conserva (2.5D cenital).
     Todo se pinta una vez en la caché de la sala:
       · alfombra del Salón (violeta, SO) con doble ribete neón;
       · círculo rúnico de la Mesa Astral (A · Mando);
       · anillo achicharrado bajo la grieta (F · salida);
       · runner ámbar frente a la barra (E · Social);
       · charcos de luz de ambiente por sector (cálida/fría según función). */
  function hexA(hex, a) {
    const n = parseInt(String(hex).slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  function paintRefugeArchitecture(cctx) {
    if (!cctx) return;
    // — Charcos de luz: se dibujan por frame en render() (respiración
    //   lenta); aquí ya no se hornean en la caché.
    // — Runner ámbar frente a la barra (entre contrabarra y taburetes)
    const run = cctx.createLinearGradient(0, 400, 0, 450);
    run.addColorStop(0, "rgba(250, 204, 21, 0.0)");
    run.addColorStop(0.5, "rgba(250, 204, 21, 0.15)");
    run.addColorStop(1, "rgba(250, 204, 21, 0.0)");
    cctx.fillStyle = run;
    cctx.fillRect(262, 400, 300, 50);
    // — Alfombra del Salón (SO) con doble ribete neón
    const rug = { x: 182, y: 782, w: 470, h: 202 };
    const rg = cctx.createRadialGradient(rug.x + rug.w / 2, rug.y + rug.h / 2, 24, rug.x + rug.w / 2, rug.y + rug.h / 2, rug.w * 0.62);
    rg.addColorStop(0, "rgba(88, 28, 135, 0.82)");
    rg.addColorStop(0.72, "rgba(59, 7, 100, 0.74)");
    rg.addColorStop(1, "rgba(30, 6, 50, 0.0)");
    cctx.fillStyle = rg;
    cctx.fillRect(rug.x - 44, rug.y - 44, rug.w + 88, rug.h + 88);
    if (typeof cctx.roundRect === "function") {
      cctx.strokeStyle = "rgba(255, 45, 122, 0.62)";
      cctx.lineWidth = 3;
      cctx.beginPath(); cctx.roundRect(rug.x, rug.y, rug.w, rug.h, 24); cctx.stroke();
      cctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
      cctx.lineWidth = 1.5;
      cctx.beginPath(); cctx.roundRect(rug.x + 9, rug.y + 9, rug.w - 18, rug.h - 18, 18); cctx.stroke();
    }
    // — Círculo rúnico de la Mesa Astral (Mando): elipses + radios, violeta
    cctx.save();
    cctx.translate(905, 586);
    cctx.globalAlpha = 0.8;
    cctx.strokeStyle = "rgba(192, 132, 252, 0.5)";
    const rings = [122, 90, 56];
    for (let i = 0; i < rings.length; i++) {
      cctx.lineWidth = i === 0 ? 3 : 2;
      cctx.beginPath(); cctx.ellipse(0, 8, rings[i], rings[i] * 0.5, 0, 0, Math.PI * 2); cctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      cctx.beginPath();
      cctx.moveTo(Math.cos(a) * 60, 8 + Math.sin(a) * 30);
      cctx.lineTo(Math.cos(a) * 94, 8 + Math.sin(a) * 47);
      cctx.stroke();
    }
    cctx.restore();
    // — Anillo achicharrado bajo la grieta (salida F)
    cctx.save();
    cctx.translate(910, 880);
    cctx.scale(1, 0.52);
    const sc = cctx.createRadialGradient(0, 0, 12, 0, 0, 132);
    sc.addColorStop(0, "rgba(0, 0, 0, 0.58)");
    sc.addColorStop(0.55, "rgba(16, 5, 20, 0.4)");
    sc.addColorStop(1, "rgba(0, 0, 0, 0)");
    cctx.fillStyle = sc;
    cctx.fillRect(-132, -132, 264, 264);
    cctx.restore();
  }

  /* Ambiente vivo del Refugio (procedural, sin assets):
     · brasas cian/magenta/ámbar que ascienden de la grieta;
     · motas de polvo flotando en los charcos de luz (barra, Mesa Astral, salón).
     Se inicializan al entrar y se actualizan/dibujan por frame. */
  /* Charcos de luz por sector: cálida/fría según función. Base estática
     pintada antes por la caché; ahora se dibujan por frame con una
     respiración muy lenta (±18%) para que el Refugio no parezca una foto. */
  const LIGHT_POOLS = [
    { x: 400, y: 345, r: 170, color: "#f59e0b", a: 0.15, ph: 0.0, sp: 0.55 },  // barra · ámbar cálido
    { x: 1400, y: 292, r: 205, color: "#22d3ee", a: 0.13, ph: 1.1, sp: 0.7 },   // escenario DJ · cian frío
    { x: 240, y: 640, r: 165, color: "#fb7185", a: 0.12, ph: 2.2, sp: 0.62 },   // armería · brasa
    { x: 905, y: 580, r: 245, color: "#a855f7", a: 0.16, ph: 0.6, sp: 0.5 },    // mando · violeta arcano
    { x: 1500, y: 465, r: 160, color: "#8b5cf6", a: 0.19, ph: 1.7, sp: 1.15 },  // orbe Tesla · violeta eléctrico
    { x: 402, y: 852, r: 220, color: "#ff2d7a", a: 0.15, ph: 2.8, sp: 0.58 },   // salón · magenta sofá
    { x: 1460, y: 838, r: 178, color: "#22d3ee", a: 0.11, ph: 0.4, sp: 0.66 },  // ocio · cian arcade
    { x: 910, y: 880, r: 170, color: "#38bdf8", a: 0.12, ph: 1.9, sp: 0.9 }     // grieta · frío ascendente
  ];
  function drawLightPools(ctx, t) {
    for (let i = 0; i < LIGHT_POOLS.length; i++) {
      const p = LIGHT_POOLS[i];
      const a = p.a * (1 + 0.18 * Math.sin(t * p.sp + p.ph));
      const pg = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.r);
      pg.addColorStop(0, hexA(p.color, a));
      pg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pg;
      ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
  }

  const EMBER_N = 26;
  const MOTE_N = 24;
  function spawnEmber(q) {
    q.x = 845 + Math.random() * 130;
    q.y = 856 + Math.random() * 42;
    q.vy = -40 - Math.random() * 30;
    q.phase = Math.random() * Math.PI * 2;
    q.swayAmp = 7 + Math.random() * 11;
    q.life = 1.5 + Math.random() * 1.3;
    q.age = Math.random() * q.life; // fase desincronizada
    q.size = 1.7 + Math.random() * 2.4;
    q.hue = Math.random() < 0.42 ? "255,45,122" : (Math.random() < 0.5 ? "56,189,248" : "250,204,21");
    return q;
  }
  function spawnMote(q) {
    const pool = [[400, 345], [905, 580], [402, 880], [1400, 330]][(Math.random() * 4) | 0];
    q.cx = pool[0]; q.cy = pool[1];
    q.r = 24 + Math.random() * 96;
    q.a = Math.random() * Math.PI * 2;
    q.w = (Math.random() < 0.5 ? -1 : 1) * (0.05 + Math.random() * 0.085);
    q.size = 0.8 + Math.random() * 1.3;
    q.alpha = 0.05 + Math.random() * 0.075;
    return q;
  }
  function initAmbient() {
    if (!state.embers) {
      state.embers = [];
      for (let i = 0; i < EMBER_N; i++) state.embers.push(spawnEmber({}));
      state.motes = [];
      for (let i = 0; i < MOTE_N; i++) state.motes.push(spawnMote({}));
    }
  }
  function updateAmbient(cdt) {
    if (!state.embers) return;
    for (let i = 0; i < state.embers.length; i++) {
      const q = state.embers[i];
      q.age += cdt;
      q.y += q.vy * cdt;
      q.x += Math.sin((state.time + q.phase) * 2.1) * q.swayAmp * cdt;
      if (q.age >= q.life) spawnEmber(q);
    }
    for (let i = 0; i < state.motes.length; i++) {
      state.motes[i].a += state.motes[i].w * cdt;
    }
  }
  function drawAmbient(ctx) {
    if (!state.embers) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < state.embers.length; i++) {
      const q = state.embers[i];
      const t = q.age / q.life;
      const a = (1 - t) * 0.92;
      ctx.fillStyle = "rgba(" + q.hue + "," + a.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(0.4, q.size * (1 - t * 0.55)), 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < state.motes.length; i++) {
      const m = state.motes[i];
      const mx = m.cx + Math.cos(m.a) * m.r;
      const my = m.cy + Math.sin(m.a) * m.r * 0.62;
      ctx.fillStyle = "rgba(255, 240, 222," + m.alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(mx, my, m.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function ensureHubCache() {
    const stats = window.DD_ASSETS ? window.DD_ASSETS.stats() : { loaded: 0 };
    const stamp = String(stats.loaded) + (HUB_REBUILD() ? "|rebuild" : "|classic");
    if (state.roomCache && state.roomCacheStamp === stamp) return state.roomCache;

    const cnv = document.createElement("canvas");
    cnv.width = 2240;
    cnv.height = 1420;
    const cctx = cnv.getContext("2d");
    if (window.DD_WORLD) {
      if (HUB_REBUILD()) {
        window.DD_WORLD.buildHighResRoomCache(cctx, cnv.width, cnv.height, HUB_BOUNDS, 0, 777, null,
          { floorAsset: "hub_floor_main", vipInset: false });
        paintMezzanine(cctx);
        paintRefugeArchitecture(cctx);
      } else {
        window.DD_WORLD.buildHighResRoomCache(cctx, cnv.width, cnv.height, HUB_BOUNDS, 0, 777, null);
      }
    }
    state.roomCache = cnv;
    state.roomCacheStamp = stamp;
    return cnv;
  }

  function render(ctx, viewW, viewH) {
    if (!state.active || !window.DD_WORLD) return false;
    const W = window.DD_WORLD;
    W.setSmooth(ctx);

    ctx.fillStyle = "#05020a";
    ctx.fillRect(0, 0, viewW, viewH);

    // Smooth camera tracking protagonist inside Refugio.
    // Zoom keeps the clubroom filling the viewport (no black void bands at the edges)
    // and the protagonist clearly readable; camera is clamped to the room + wall band.
    // QA hook (development only): window.__DD_HUB_DEBUG_ZOOM renders the whole room
    // centred, e.g. 0.62 — used by the redesign captures; off by default.
    const dbgZoom = Number(window.__DD_HUB_DEBUG_ZOOM);
    const zoom = (dbgZoom && isFinite(dbgZoom) && dbgZoom > 0)
      ? dbgZoom
      : Math.min(1.6, Math.max(1.02, Math.min(viewW / 1150, viewH / 780)));
    let camX = state.px * 0.55 + (HUB_BOUNDS.x + HUB_BOUNDS.w * 0.5) * 0.45;
    let camY = state.py * 0.48 + (HUB_BOUNDS.y + HUB_BOUNDS.h * 0.42) * 0.52;
    if (dbgZoom && isFinite(dbgZoom) && dbgZoom > 0) {
      camX = HUB_BOUNDS.x + HUB_BOUNDS.w * 0.5;
      camY = HUB_BOUNDS.y + HUB_BOUNDS.h * 0.46;
    }
    const halfW = viewW * 0.5 / zoom;
    const halfH = viewH * 0.5 / zoom;
    const x0 = HUB_BOUNDS.x - 56, x1 = HUB_BOUNDS.x + HUB_BOUNDS.w + 56;
    const y0 = HUB_BOUNDS.y - 150, y1 = HUB_BOUNDS.y + HUB_BOUNDS.h + 56;
    camX = (halfW * 2 >= x1 - x0) ? (x0 + x1) * 0.5 : Math.max(x0 + halfW, Math.min(x1 - halfW, camX));
    camY = (halfH * 2 >= y1 - y0) ? (y0 + y1) * 0.5 : Math.max(y0 + halfH, Math.min(y1 - halfH, camY));

    ctx.save();
    ctx.translate(viewW * 0.5, viewH * 0.5);
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);

    const bg = ensureHubCache();
    ctx.drawImage(bg, 0, 0);
    drawLightPools(ctx, state.time);

    // Signature Neon Fox Mural on the east wall (ref R5). It lives mid-wall,
    // over the Torre lab wing, clear of the DJ stage silhouette.
    const foxSign = window.DD_ASSETS && window.DD_ASSETS.get("prop_hub_fox_neon");
    if (foxSign) {
      const fx = HUB_BOUNDS.x + HUB_BOUNDS.w - 118;
      const fy = HUB_BOUNDS.y + 300;
      W.drawNeonGlow(ctx, fx + 45, fy + 65, 185, "#ff2d7a", 0.36);
      ctx.drawImage(foxSign, fx, fy, 112, 148);
    }

    /* La grieta: ojo negro en la pista; el azul/magenta asciende de dentro.
       Es decoración de suelo: se dibuja antes de la y-sort para que el
       protagonista pise encima de los bordes. */
    W.drawDescentCrack(ctx, DESCENT, state.time);

    // Interactive station floor rings
    for (let i = 0; i < STATIONS.length; i++) {
      const st = STATIONS[i];
      const active = state.nearStation && state.nearStation.id === st.id;
      ctx.save();
      ctx.strokeStyle = active ? "#22d3ee" : "rgba(255, 45, 122, 0.38)";
      ctx.lineWidth = active ? 3 : 1.6;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(st.x, st.y + 12, st.r * 0.72, st.r * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Y-sorted render list: HUB props + NPCs + Protagonist
    const drawList = [];
    for (let i = 0; i < HUB_PROPS.length; i++) {
      const p = HUB_PROPS[i];
      drawList.push({ y: p.y, kind: "prop", obj: p });
    }
    drawList.push({ y: 305, kind: "npc", id: "npc_dj_booth_world", x: 1400, h: 132 });
    drawList.push({ y: 340, kind: "npc", id: "npc_bartender_hub", x: 400, h: 116 });
    drawList.push({ y: 600, kind: "npc", id: "npc_armorer_hub", x: 378, h: 118 });
    drawList.push({ y: state.py, kind: "player" });

    drawList.sort((a, b) => a.y - b.y);

    for (let i = 0; i < drawList.length; i++) {
      const item = drawList[i];
      if (item.kind === "prop") {
        W.drawProp(ctx, item.obj, state.time);
      } else if (item.kind === "npc") {
        const nim = (window.DD_ASSETS && window.DD_ASSETS.get(item.id)) ||
                    (item.id === "npc_dj_booth_world" && window.DD_ASSETS && window.DD_ASSETS.get("dialogue_portrait_dj"));
        if (nim) {
          const nh = item.h;
          const nw = nh * (nim.naturalWidth / Math.max(1, nim.naturalHeight));
          W.drawSoftShadow(ctx, item.x, item.y + 18, 28, 12, 0.55);
          ctx.drawImage(nim, item.x - nw / 2, item.y - nh + 22, nw, nh);
        }
      } else if (item.kind === "player") {
        const br = window.__DD_BRIDGE;
        // Ground spotlight pool + warm halo so the dark protagonist never merges
        // into the crimson VIP carpet or the pale checker floor.
        ctx.save();
        const spot = ctx.createRadialGradient(state.px, state.py + 12, 6, state.px, state.py + 12, 58);
        spot.addColorStop(0, "rgba(255, 236, 246, 0.5)");
        spot.addColorStop(1, "rgba(255, 236, 246, 0)");
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = spot;
        ctx.beginPath();
        ctx.ellipse(state.px, state.py + 12, 58, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        W.drawNeonGlow(ctx, state.px, state.py + 4, 78, "#ffe4f1", 0.34);
        const drewHi = drawRefugeIdle(ctx) || W.drawProtagonist(
          ctx,
          { x: state.px, y: state.py, aimAngle: state.aimAngle },
          window.DMO && window.DMO.playerAnim,
          null,
          0,
          0,
          1.16
        );
        if (!drewHi && br && typeof br.drawPlayerAt === "function") {
          br.drawPlayerAt(ctx, state.px, state.py, state.aimAngle);
        }
      }
    }

    drawAmbient(ctx);

    // Overhead Golden Chandeliers with warm volumetric glow (matching r5_refugio_hub.png)
    const chand = window.DD_ASSETS && window.DD_ASSETS.get("prop_chandelier_gold");
    const chandCoords = [[700, 225], [1130, 225]];
    for (let i = 0; i < chandCoords.length; i++) {
      const [cx, cy] = chandCoords[i];
      W.drawNeonGlow(ctx, cx, cy + 40, 190, "#facc15", 0.2);
      if (chand) {
        ctx.drawImage(chand, cx - 68, cy - 48, 136, 136);
      }
    }

    ctx.restore();

    // Floating interaction prompt at bottom-center when near a station
    if (state.nearStation) {
      ctx.save();
      const txt = state.nearStation.prompt;
      ctx.font = "700 14px Inter, Segoe UI, sans-serif";
      const tw = ctx.measureText(txt).width + 36;
      const bx = (viewW - tw) * 0.5;
      const by = viewH - 94;
      ctx.fillStyle = "rgba(9, 4, 18, 0.92)";
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.fillRect(bx, by, tw, 38);
      ctx.strokeRect(bx, by, tw, 38);
      ctx.fillStyle = "#f8fafc";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, viewW * 0.5, by + 19);
      ctx.restore();
    }
    return true;
  }

  window.addEventListener("keydown", function (ev) {
    state.keys[ev.code] = true;
    if (!state.active) return;
    if ((ev.code === "KeyE" || ev.code === "Enter") && state.nearStation) {
      ev.preventDefault();
      triggerStation(state.nearStation);
    }
  });
  window.addEventListener("keyup", function (ev) {
    state.keys[ev.code] = false;
  });

  window.DD_HUB = Object.freeze({
    isActive: function () { return state.active; },
    enter,
    exitToRun,
    update,
    render,
    getState: function () {
      return {
        active: state.active,
        x: Math.round(state.px),
        y: Math.round(state.py),
        nearStation: state.nearStation ? state.nearStation.id : null,
        bounds: HUB_BOUNDS,
        stations: STATIONS.map(s => s.id),
        protagonist: REFUGE_IDLE.ok ? "idle_07b" : "sprites_anteriores",
        protagonistSrc: REFUGE_IDLE.src,
        protagonistRect: REFUGE_IDLE.lastRect,
        protagonistAspect: REFUGE_IDLE.lastRect ? +(REFUGE_IDLE.lastRect.w / REFUGE_IDLE.lastRect.h).toFixed(4) : null
      };
    }
  });
})();
