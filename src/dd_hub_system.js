/* ==========================================================================
   DEADBEAT DISCO — PLAYABLE ISOMETRIC REFUGIO / HUB (window.DD_HUB)
   Faithful playable reconstruction of REF_05 -> REFUGIO / HUB with full
   keyboard, mouse & Xbox gamepad navigation, NPCs, stations & Descent Pad.
   ========================================================================== */
(function () {
  "use strict";

  const HUB_BOUNDS = { x: 260, y: 210, w: 1240, h: 760 };
  const state = {
    active: false,
    px: 880,
    py: 615,
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

  // Layout faithfully matching REF_05 (r5_refugio_hub.png)
  const HUB_PROPS = [
    // Upper gothic liquor bookshelves & bar lounge
    { kind: "shelf", x: 430, y: 245, br: 44 },
    { kind: "shelf", x: 560, y: 245, br: 44 },
    { kind: "barcounter", x: 740, y: 278, br: 56 },
    { kind: "cooler", x: 325, y: 280, br: 36 },
    // DJ Virgilio Booth upper-right
    { kind: "speaker", x: 1035, y: 255, br: 36 },
    { kind: "djbooth", x: 1165, y: 278, br: 58 },
    { kind: "subwoofer", x: 1305, y: 265, br: 38 },
    { kind: "palm", x: 1415, y: 295, br: 38 },
    // Central VIP Velvet Sofa Lounge (exact twin magenta sofas + low candle table)
    { kind: "sofa", x: 745, y: 470, br: 48 },
    { kind: "sofa", x: 1015, y: 470, br: 48, flipX: true },
    { kind: "bench", x: 880, y: 488, br: 34 },
    { kind: "armchair", x: 635, y: 545, br: 34 },
    { kind: "armchair", x: 1125, y: 545, br: 34, flipX: true },
    { kind: "candelabra", x: 675, y: 410, br: 24 },
    { kind: "candelabra", x: 1085, y: 410, br: 24 },
    // Left Armory & Arcade Pact corner
    { kind: "vending", x: 355, y: 515, br: 42 },
    { kind: "arcade", x: 355, y: 655, br: 40 },
    { kind: "chest", x: 455, y: 565, br: 34 },
    // Right Tower Progression Pedestal & Lounge
    { kind: "pedestal", x: 1365, y: 585, br: 40 },
    { kind: "plant", x: 1425, y: 745, br: 32 },
    { kind: "plant", x: 335, y: 845, br: 32 }
  ];

  const STATIONS = [
    {
      id: "descent",
      label: "PLATAFORMA DE DESCENSO · INICIAR INCURSIÓN",
      prompt: "Pulsa [E] / (A) para descender al Círculo I · Lujuria",
      x: 880,
      y: 785,
      r: 96
    },
    {
      id: "armory",
      label: "ARMERÍA DEL REFUGIO · INVENTARIO Y TIENDA",
      prompt: "Pulsa [E] / (A) para abrir Armería (120 Armas)",
      x: 415,
      y: 535,
      r: 95
    },
    {
      id: "dj",
      label: "CABINA DE DJ VIRGILIO",
      prompt: "Pulsa [E] / (A) para hablar con DJ Virgilio",
      x: 1165,
      y: 335,
      r: 105
    },
    {
      id: "map",
      label: "MESA ASTRAL · MAPA DE PROGRESIÓN",
      prompt: "Pulsa [E] / (A) para inspeccionar la Torre de los 9 Círculos",
      x: 1345,
      y: 605,
      r: 95
    }
  ];

  const DJ_QUOTES = [
    "Bienvenido al Refugio, cazador. Ajusta tu hierro en la Armería; abajo en Lujuria el bajo rompe huesos.",
    "Nueve círculos, nueve residentes y el Núcleo latiendo al fondo. Si pierdes el compás, la pista te traga.",
    "¿Ves el zorro de neón en el muro? Mientras siga encendido, esta sala es tregua sagrada.",
    "Revisa tus créditos antes de saltar a la Plataforma Cian. El Cajero no perdona deudas en el tercer piso."
  ];
  let quoteIdx = 0;

  function enter() {
    state.active = true;
    state.px = 880;
    state.py = 615;
    state.vx = 0;
    state.vy = 0;
    state.interactCooldown = 0.35;
    // Freeze the live run (if any) while the player walks the safe zone, so no
    // offscreen simulation can damage/kill the protagonist behind the HUB camera.
    if (window.__DD_BRIDGE && typeof window.__DD_BRIDGE.setPaused === "function") {
      window.__DD_BRIDGE.setPaused(true);
    }
    if (window.DD_UI) {
      window.DD_UI.hideMainMenu();
      window.DD_UI.showDialogue("DJ VIRGILIO", DJ_QUOTES[0], 5.2);
    }
  }

  function exitToRun() {
    if (!state.active) return;
    state.active = false;
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
      window.DD_UI.showDialogue("DJ VIRGILIO", DJ_QUOTES[quoteIdx], 5.5);
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

  function ensureHubCache() {
    const stats = window.DD_ASSETS ? window.DD_ASSETS.stats() : { loaded: 0 };
    const stamp = String(stats.loaded);
    if (state.roomCache && state.roomCacheStamp === stamp) return state.roomCache;

    const cnv = document.createElement("canvas");
    cnv.width = 1800;
    cnv.height = 1180;
    const cctx = cnv.getContext("2d");
    if (window.DD_WORLD) {
      window.DD_WORLD.buildHighResRoomCache(cctx, cnv.width, cnv.height, HUB_BOUNDS, 0, 777, null);
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
    const zoom = Math.min(1.6, Math.max(1.02, Math.min(viewW / 1150, viewH / 780)));
    let camX = state.px * 0.55 + (HUB_BOUNDS.x + HUB_BOUNDS.w * 0.5) * 0.45;
    let camY = state.py * 0.48 + (HUB_BOUNDS.y + HUB_BOUNDS.h * 0.42) * 0.52;
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

    // Right-wall signature Neon Fox Mural (exact match to r5_refugio_hub.png!)
    const foxSign = window.DD_ASSETS && window.DD_ASSETS.get("prop_hub_fox_neon");
    if (foxSign) {
      const fx = HUB_BOUNDS.x + HUB_BOUNDS.w - 118;
      const fy = HUB_BOUNDS.y + 150;
      W.drawNeonGlow(ctx, fx + 45, fy + 65, 185, "#ff2d7a", 0.36);
      ctx.drawImage(foxSign, fx, fy, 112, 148);
    }

    // Central Glowing Cyan Descent Pad
    W.drawDescentPad(ctx, { x: 880, y: 785 }, state.time);

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
    drawList.push({ y: 268, kind: "npc", id: "npc_dj_booth_world", x: 1165, h: 118 });
    drawList.push({ y: 262, kind: "npc", id: "npc_bartender_hub", x: 740, h: 102 });
    drawList.push({ y: 505, kind: "npc", id: "npc_armorer_hub", x: 432, h: 104 });
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
        // Solo presentación del HUB: idle y walk03 oficiales tienen huecos de
        // alfa. Usar fotogramas completos 00/01/02/01, sin alterar el estado
        // compartido de animación ni los recursos originales. Paliativo hasta
        // recibir las imágenes íntegras de Tanda 09.
        const anim = window.DMO && window.DMO.playerAnim;
        const rawPose = anim && anim.waistSplitActive ? anim.lowerPose : "player_walk0";
        const safePose = rawPose === "player_walk1" || rawPose === "player_walk2"
          ? rawPose : (rawPose === "player_walk3" ? "player_walk1" : "player_walk0");
        const hubAnim = Object.assign({}, anim || {}, {
          upperPose: safePose,
          lowerPose: safePose,
          waistSplitActive: false
        });
        const drewHi = W.drawProtagonist(
          ctx,
          { x: state.px, y: state.py, aimAngle: state.aimAngle },
          hubAnim,
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

    // Overhead Golden Chandeliers with warm volumetric glow (matching r5_refugio_hub.png)
    const chand = window.DD_ASSETS && window.DD_ASSETS.get("prop_chandelier_gold");
    const chandCoords = [[650, 215], [1110, 215]];
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
        stations: STATIONS.map(s => s.id)
      };
    }
  });
})();
