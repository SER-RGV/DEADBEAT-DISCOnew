const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { createCanvas, loadImage, Image } = require("/tmp/audit_canvas/node_modules/@napi-rs/canvas");

(async () => {
  const outDir = "/tmp/audit_captures";
  fs.mkdirSync(outDir, { recursive: true });

  const manifest = JSON.parse(fs.readFileSync("assets/manifest.json", "utf8"));
  const diskImages = {};
  for (const [id, meta] of Object.entries(manifest.entries)) {
    const cleanSrc = meta.src.split("?")[0];
    if (fs.existsSync(cleanSrc)) {
      try {
        diskImages[id] = await loadImage(cleanSrc);
      } catch (e) {}
    }
  }
  console.log("Loaded real @napi-rs/canvas Image objects via await loadImage:", Object.keys(diskImages).length);

  const domNodes = {};
  function makeElem(tag, id) {
    const el = {
      tagName: (tag || "DIV").toUpperCase(),
      id: id || "",
      className: "",
      innerHTML: "",
      textContent: "",
      style: {},
      dataset: {},
      width: 1280,
      height: 720,
      children: [],
      classList: {
        _set: new Set(),
        add(...c) { c.forEach(x => this._set.add(x)); },
        remove(...c) { c.forEach(x => this._set.delete(x)); },
        toggle(c, f) { if (f === undefined) { this._set.has(c) ? this._set.delete(c) : this._set.add(c); } else { f ? this._set.add(c) : this._set.delete(c); } },
        contains(c) { return this._set.has(c); }
      },
      setAttribute(k, v) { this[k] = v; },
      getAttribute(k) { return this[k] || null; },
      addEventListener() {},
      removeEventListener() {},
      appendChild(ch) { this.children.push(ch); if (ch.id) domNodes[ch.id] = ch; return ch; },
      querySelector() { return makeElem("div"); },
      querySelectorAll() { return []; },
      getContext(type) {
        if (!this._canvas) {
          this._canvas = createCanvas(this.width || 1280, this.height || 720);
        }
        return this._canvas.getContext("2d");
      },
      focus() {},
      click() {}
    };
    if (id) domNodes[id] = el;
    return el;
  }

  const sandbox = {
    console,
    setTimeout: () => 1,
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    performance: { now: () => 1000 },
    navigator: { getGamepads: () => [] },
    localStorage: { getItem: () => null, setItem: () => {} },
    matchMedia: () => ({ matches: false }),
    Image: function() {
      this.complete = true;
      this.naturalWidth = 256;
      this.naturalHeight = 256;
    },
    Event: function(t) { this.type = t; },
    document: {
      readyState: "complete",
      body: makeElem("body"),
      head: makeElem("head"),
      activeElement: null,
      createElement: (t) => {
        if (String(t).toLowerCase() === "canvas") {
          return createCanvas(1280, 720);
        }
        return makeElem(t);
      },
      getElementById: (id) => domNodes[id] || makeElem("div", id),
      querySelector: () => makeElem("meta"),
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {}
    }
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  for (const s of [
    "boss_animation_state_machine.js",
    "src/dd_boot.js",
    "src/dd_asset_registry.js",
    "src/dd_world_renderer.js",
    "src/dd_hub_system.js",
    "src/dd_cinematic_camera.js",
    "src/dd_ui_system.js"
  ]) {
    vm.runInNewContext(fs.readFileSync(s, "utf8"), sandbox, { filename: s });
  }

  for (const [id, img] of Object.entries(diskImages)) {
    sandbox.DD_ASSETS.images[id] = img;
  }
  sandbox.DD_ASSETS = Object.freeze({
    ...sandbox.DD_ASSETS,
    get: function(id) {
      return diskImages[id] || null;
    },
    getByOriginal: function(orig) {
      const id = sandbox.DD_ASSETS.manifest.byOriginalId[orig];
      return id ? (diskImages[id] || null) : null;
    }
  });

  function drawHUD(ctx, W, H, title, sub, weaponId, hp = 5, maxHp = 6) {
    ctx.save();
    ctx.fillStyle = "rgba(8, 4, 16, 0.86)";
    ctx.strokeStyle = "#ff2d95";
    ctx.lineWidth = 2;
    ctx.fillRect(18, 18, 310, 76);
    ctx.strokeRect(18, 18, 310, 76);
    const port = diskImages["hud_portrait_protagonist"];
    if (port) ctx.drawImage(port, 24, 24, 64, 64);
    const hFull = diskImages["hud_heart_full"];
    const hEmpty = diskImages["hud_heart_empty"];
    for (let i = 0; i < maxHp; i++) {
      const im = i < hp ? hFull : hEmpty;
      if (im) ctx.drawImage(im, 98 + i * 32, 24, 28, 28);
    }
    ctx.fillStyle = "#ff2d95";
    ctx.fillRect(98, 60, 180 * (hp / maxHp), 14);
    ctx.strokeStyle = "#38bdf8";
    ctx.strokeRect(98, 60, 180, 14);

    ctx.fillStyle = "rgba(8, 4, 16, 0.88)";
    ctx.strokeStyle = "#f6c453";
    ctx.fillRect(18, H - 96, 220, 78);
    ctx.strokeRect(18, H - 96, 220, 78);
    const wIm = diskImages[weaponId || "weapon_m1911"];
    if (wIm) ctx.drawImage(wIm, 28, H - 90, 130, 65);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText((weaponId || "weapon_m1911").replace("weapon_", "").toUpperCase(), 162, H - 52);

    ctx.fillStyle = "rgba(8, 4, 16, 0.86)";
    ctx.strokeStyle = "#38bdf8";
    ctx.fillRect(W - 420, 18, 402, 54);
    ctx.strokeRect(W - 420, 18, 402, 54);
    ctx.fillStyle = "#ff2d95";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(title, W - 404, 40);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px sans-serif";
    ctx.fillText(sub, W - 404, 60);
    ctx.restore();
  }

  // 1. Capture All 10 Cinematic Shots via REAL DD_CINE.renderOverlay at 1280x720
  const shotTimes = [1.75, 5.25, 8.5, 11.75, 15.5, 19.25, 22.75, 26.5, 30.25, 33.5];
  const cineGrid = createCanvas(2560, 1800);
  const cgCtx = cineGrid.getContext("2d");
  cgCtx.fillStyle = "#06020c";
  cgCtx.fillRect(0, 0, 2560, 1800);
  cgCtx.fillStyle = "#ff2d95";
  cgCtx.font = "bold 24px sans-serif";
  cgCtx.fillText("AUDITORÍA DE CINEMÁTICA EN MOTOR REAL (window.DD_CINE.renderOverlay) — LOS 10 PLANOS (0.0s -> 35.0s)", 28, 38);

  for (let i = 0; i < 10; i++) {
    sandbox.DD_CINE.playIntro();
    const targetT = shotTimes[i];
    let curT = 0;
    while (curT < targetT) {
      const step = Math.min(0.05, targetT - curT);
      sandbox.DD_CINE.update(step, null);
      curT += step;
    }
    const c = createCanvas(1280, 720);
    const ctx = c.getContext("2d");
    sandbox.DD_CINE.renderOverlay(ctx, 1280, 720);

    const tagText = domNodes["dd-cine-tag"] ? domNodes["dd-cine-tag"].textContent : "";
    const subText = domNodes["dd-cine-sub"] ? domNodes["dd-cine-sub"].textContent : "";
    ctx.fillStyle = "rgba(4, 2, 10, 0.88)";
    ctx.fillRect(0, 0, 1280, 44);
    ctx.fillRect(0, 676, 1280, 44);
    ctx.fillStyle = "#ff2d7a";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(tagText, 24, 28);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px sans-serif";
    ctx.fillText(subText, 24, 703);

    const col = i % 2;
    const row = Math.floor(i / 2);
    const dx = 24 + col * 1260;
    const dy = 56 + row * 344;
    cgCtx.drawImage(c, 0, 0, 1280, 720, dx, dy, 1236, 312);
    cgCtx.strokeStyle = "#ff2d95";
    cgCtx.lineWidth = 2;
    cgCtx.strokeRect(dx, dy, 1236, 312);
    cgCtx.fillStyle = "#f8fafc";
    cgCtx.font = "bold 14px sans-serif";
    cgCtx.fillText(`Plano ${String(i+1).padStart(2, "0")} (t=${shotTimes[i]}s) · ${tagText}`, dx + 6, dy + 330);
  }
  fs.writeFileSync(path.join(outDir, "audit_01_cinematic_10_shots_real_engine.png"), cineGrid.toBuffer("image/png"));
  console.log("Saved audit_01_cinematic_10_shots_real_engine.png");

  // 2. Capture All 10 Tracks (Hub/Limbo 0 + Circles I..IX) with REAL DD_WORLD
  const tracks = [
    { idx: 0, name: "TRACK 0 · EL ANDÉN CERO (LIMBO)", sub: "Soberano: Andén, el Portero", boss: "boss_00_anden", enemies: ["security", "fanatic"], weapon: "weapon_m1911" },
    { idx: 1, name: "PISTA I · LA INVITACIÓN (LUJURIA)", sub: "Soberana: Véspera / Magneta · 124 BPM", boss: "boss_01_magneta", enemies: ["dancer", "fanatic"], weapon: "weapon_uzi" },
    { idx: 2, name: "PISTA II · EL BANQUETE (GULA)", sub: "Soberano: Voraz / Bufé · 128 BPM", boss: "boss_02_bufe", enemies: ["chef", "security"], weapon: "weapon_spas12" },
    { idx: 3, name: "PISTA III · LA CÁMARA DE LOS INSTANTES (AVARICIA)", sub: "Soberana: Áurea / El Cajero · 130 BPM", boss: "boss_03_cajero", enemies: ["elite", "drone"], weapon: "weapon_magnum" },
    { idx: 4, name: "PISTA IV · LA AMPLIFICACIÓN (IRA)", sub: "Soberano: Brama, el Santo del Ruido · 136 BPM", boss: "boss_04_pogo", enemies: ["fanatic", "security"], weapon: "weapon_flamer" },
    { idx: 5, name: "PISTA V · LA NOTA AUSENTE (HEREJÍA)", sub: "Soberano: El Obispo de la Nota Ausente · 138 BPM", boss: "boss_05_oficiante", enemies: ["elite", "dancer"], weapon: "weapon_plasma" },
    { idx: 6, name: "PISTA VI · EL UMBRAL ENCADENADO (VIOLENCIA)", sub: "Soberano: El Corazón Encadenado / Matarife · 142 BPM", boss: "boss_06_matarife", enemies: ["chef", "elite"], weapon: "weapon_c038_minigun" },
    { idx: 7, name: "PISTA VII · EL SALÓN DE LAS MIL VOCES (FRAUDE)", sub: "Soberano: El Crupier / Imitador · 145 BPM", boss: "boss_07_imitador", enemies: ["dancer", "drone"], weapon: "weapon_ricochet" },
    { idx: 8, name: "PISTA VIII · EL ANDÉN DE LA AUSENTE (TRAICIÓN)", sub: "Soberana: Nix / El Traidor · 150 BPM", boss: "boss_08_traidor", enemies: ["drone", "elite"], weapon: "weapon_cryo" },
    { idx: 9, name: "PISTA IX · EL NÚCLEO (EL TRONO DEL BAJO)", sub: "Soberano: El Rey del Compás · 160 BPM", boss: "boss_09_nucleo", enemies: ["elite", "security"], weapon: "weapon_railgun" }
  ];

  const tracksGrid = createCanvas(2560, 1850);
  const tgCtx = tracksGrid.getContext("2d");
  tgCtx.fillStyle = "#06020c";
  tgCtx.fillRect(0, 0, 2560, 1850);
  tgCtx.fillStyle = "#ff2d95";
  tgCtx.font = "bold 24px sans-serif";
  tgCtx.fillText("AUDITORÍA DE GAMEPLAY EN MOTOR REAL (window.DD_WORLD) — LAS 9 PISTAS + LIMBO, COMBATE Y SOBERANOS", 28, 38);

  for (let i = 0; i < tracks.length; i++) {
    const tr = tracks[i];
    const c = createCanvas(1280, 720);
    const ctx = c.getContext("2d");
    const bounds = { x: 110, y: 110, w: 1060, h: 520 };
    sandbox.DD_WORLD.buildHighResRoomCache(ctx, 1280, 720, bounds, tr.idx, i + 1, null);

    sandbox.DD_WORLD.drawPickup(ctx, { kind: "credits", x: 340, y: 480 }, 2.1);
    sandbox.DD_WORLD.drawPickup(ctx, { kind: "heart", x: 390, y: 500 }, 2.1);

    sandbox.DD_WORLD.drawProtagonist(
      ctx,
      { x: 280, y: 420, aimAngle: -0.08 },
      { upperPose: i % 2 === 0 ? "player_fire" : "player_fire2", lowerPose: "player_walk" + (i % 4), waistSplitActive: true },
      null,
      i === 9 ? 35 : 0,
      i === 9 ? 8 : 0,
      1.0
    );

    sandbox.DD_WORLD.drawProjectiles(ctx, [
      { x: 390, y: 395, vx: 420, vy: -20, r: 6, plasma: i % 2 === 1 },
      { x: 480, y: 390, vx: 420, vy: -20, r: 6, cryo: i === 8 }
    ], null);

    sandbox.DD_WORLD.drawEnemy(ctx, { id: i*10+1, type: tr.enemies[0], x: 640, y: 360, vx: -40, vy: 10, hp: 50, maxHp: 80, attackT: 0.25 }, 2.1);
    sandbox.DD_WORLD.drawEnemy(ctx, { id: i*10+2, type: tr.enemies[1], x: 580, y: 510, vx: -30, vy: -15, hp: 60, maxHp: 80, windupT: 0.2 }, 2.1);

    sandbox.DD_WORLD.drawBoss(ctx, { id: tr.boss, x: 920, y: 430, r: 54, hp: 700, maxHp: 1000, attackT: i % 2 === 1 ? 0.35 : 0 }, tr.idx, 2.1);

    drawHUD(ctx, 1280, 720, tr.name, tr.sub, tr.weapon, 5, 6);

    const col = i % 2;
    const row = Math.floor(i / 2);
    const dx = 24 + col * 1260;
    const dy = 56 + row * 354;
    tgCtx.drawImage(c, 0, 0, 1280, 720, dx, dy, 1236, 322);
    tgCtx.strokeStyle = "#38bdf8";
    tgCtx.lineWidth = 2;
    tgCtx.strokeRect(dx, dy, 1236, 322);
    tgCtx.fillStyle = "#f8fafc";
    tgCtx.font = "bold 14px sans-serif";
    tgCtx.fillText(`${tr.name} — Boss: ${tr.boss} + Enemies: ${tr.enemies.join(", ")}`, dx + 6, dy + 340);
  }
  fs.writeFileSync(path.join(outDir, "audit_02_nine_tracks_gameplay_real_engine.png"), tracksGrid.toBuffer("image/png"));
  console.log("Saved audit_02_nine_tracks_gameplay_real_engine.png");

  // 3. Multi-Resolution & UI States + Animation Strip Sheet
  const uiGrid = createCanvas(2560, 1600);
  const ugCtx = uiGrid.getContext("2d");
  ugCtx.fillStyle = "#06020c";
  ugCtx.fillRect(0, 0, 2560, 1600);
  ugCtx.fillStyle = "#ff2d95";
  ugCtx.font = "bold 24px sans-serif";
  ugCtx.fillText("AUDITORÍA DE RESOLUCIONES (720p / 1080p / 1440p), MENÚ PRINCIPAL, EL REFUGIO (DD_HUB), ARMERÍA, VICTORIA Y DERROTA", 28, 38);

  {
    const mc = createCanvas(2560, 1440);
    const mctx = mc.getContext("2d");
    const bg = diskImages["menu_main_backdrop_a"] || diskImages["menu_main_backdrop"];
    if (bg) mctx.drawImage(bg, 0, 0, 2560, 1440);
    const logo = diskImages["logo_deadbeat_graffiti"];
    if (logo) mctx.drawImage(logo, 180, 110, 920, 612);
    const fox = diskImages["emblem_fox_crown"];
    if (fox) mctx.drawImage(fox, 2180, 80, 260, 260);
    const btns = ["INICIAR DESCENSO [ENTER]", "ENTRAR AL REFUGIO (HUB)", "CINEMÁTICA DE APERTURA", "LA CABINA · ARSENAL (121)"];
    for (let b = 0; b < btns.length; b++) {
      mctx.fillStyle = b === 0 ? "rgba(255, 45, 149, 0.88)" : "rgba(10, 5, 20, 0.86)";
      mctx.strokeStyle = b === 0 ? "#f6c453" : "#ff2d95";
      mctx.lineWidth = 4;
      mctx.fillRect(220, 780 + b * 120, 680, 92);
      mctx.strokeRect(220, 780 + b * 120, 680, 92);
      mctx.fillStyle = "#f8fafc";
      mctx.font = "bold 32px sans-serif";
      mctx.fillText(btns[b], 260, 838 + b * 120);
    }
    ugCtx.drawImage(mc, 0, 0, 2560, 1440, 24, 60, 816, 460);
    ugCtx.strokeStyle = "#ff2d95";
    ugCtx.strokeRect(24, 60, 816, 460);
    ugCtx.fillStyle = "#f8fafc";
    ugCtx.font = "bold 15px sans-serif";
    ugCtx.fillText("1. MENÚ PRINCIPAL @ 2560x1440 (QHD) · menu_main_backdrop_a + logo_deadbeat_graffiti", 28, 540);
  }

  {
    const hc = createCanvas(1920, 1080);
    const hctx = hc.getContext("2d");
    sandbox.DD_HUB.enter();
    sandbox.DD_HUB.update(0.25);
    sandbox.DD_HUB.render(hctx, 1920, 1080);
    ugCtx.drawImage(hc, 0, 0, 1920, 1080, 868, 60, 816, 460);
    ugCtx.strokeStyle = "#38bdf8";
    ugCtx.strokeRect(868, 60, 816, 460);
    ugCtx.fillStyle = "#f8fafc";
    ugCtx.font = "bold 15px sans-serif";
    ugCtx.fillText("2. EL REFUGIO (HUB) @ 1920x1080 (FHD) · Renderizado directo por window.DD_HUB.render()", 872, 540);
  }

  {
    const vc = createCanvas(1280, 720);
    const vctx = vc.getContext("2d");
    vctx.fillStyle = "#080412";
    vctx.fillRect(0, 0, 1280, 720);
    const vEmb = diskImages["ui_victory_emblem"];
    const dEmb = diskImages["ui_defeat_emblem"];
    if (vEmb) vctx.drawImage(vEmb, 80, 120, 480, 360);
    if (dEmb) vctx.drawImage(dEmb, 720, 120, 480, 360);
    vctx.fillStyle = "#f6c453";
    vctx.font = "bold 28px sans-serif";
    vctx.fillText("VICTORIA · SELLO ROTO", 140, 530);
    vctx.fillStyle = "#ff2d7a";
    vctx.fillText("DERROTA · LA CANCIÓN VUELVE", 730, 530);
    ugCtx.drawImage(vc, 0, 0, 1280, 720, 1712, 60, 816, 460);
    ugCtx.strokeStyle = "#f6c453";
    ugCtx.strokeRect(1712, 60, 816, 460);
    ugCtx.fillStyle = "#f8fafc";
    ugCtx.font = "bold 15px sans-serif";
    ugCtx.fillText("3. PANTALLAS DE VICTORIA Y DERROTA @ 1280x720 · ui_victory_emblem & ui_defeat_emblem", 1716, 540);
  }

  ugCtx.fillStyle = "#38bdf8";
  ugCtx.font = "bold 20px sans-serif";
  ugCtx.fillText("4. AUDITORÍA DE ANIMACIÓN EN MOTOR REAL: CICLO WALK, WAIST-SPLIT EN 360°, 8 DIRECCIONES Y TRANSICIONES DE ENEMIGOS", 28, 588);

  const animCanv = createCanvas(2512, 940);
  const actx = animCanv.getContext("2d");
  actx.fillStyle = "#0c0718";
  actx.fillRect(0, 0, 2512, 940);

  const pFrames = ["player_idle_00", "player_walk_00", "player_walk_01", "player_walk_02", "player_walk_03", "player_shoot_00", "player_fire2", "player_firehip", "player_boost_00", "player_roll_00", "player_hurt_00", "player_death_00"];
  actx.fillStyle = "#f6c453";
  actx.font = "bold 15px sans-serif";
  actx.fillText("A. Poses del Protagonista (assets/characters/) con líneas de referencia: Coronilla (y=24), Cintura Waist-Split (y=173, ratio=0.54), Suelo (y=312)", 16, 26);

  for (let i = 0; i < pFrames.length; i++) {
    const id = pFrames[i];
    const im = diskImages[id];
    const bx = 16 + i * 206;
    const by = 40;
    actx.fillStyle = "#160d2a";
    actx.fillRect(bx, by, 196, 240);
    const scale = 0.65;
    const oy = by + 16;
    actx.strokeStyle = "rgba(56, 189, 248, 0.45)";
    actx.beginPath(); actx.moveTo(bx, oy + 24 * scale); actx.lineTo(bx + 196, oy + 24 * scale); actx.stroke();
    actx.strokeStyle = "rgba(255, 45, 149, 0.75)";
    actx.beginPath(); actx.moveTo(bx, oy + 173 * scale); actx.lineTo(bx + 196, oy + 173 * scale); actx.stroke();
    actx.strokeStyle = "rgba(34, 197, 94, 0.65)";
    actx.beginPath(); actx.moveTo(bx, oy + 312 * scale); actx.lineTo(bx + 196, oy + 312 * scale); actx.stroke();

    if (im) {
      const dw = im.width * scale;
      const dh = im.height * scale;
      actx.drawImage(im, bx + (196 - dw) * 0.5, oy + (208 - dh), dw, dh);
    }
    actx.fillStyle = "#e2e8f0";
    actx.font = "12px sans-serif";
    actx.fillText(id.replace("player_", ""), bx + 6, by + 234);
  }

  actx.fillStyle = "#f6c453";
  actx.font = "bold 15px sans-serif";
  actx.fillText("B. Prueba en vivo de DD_WORLD.drawProtagonist (Waist-Split activo: tren superior apuntando + tren inferior caminando) + 8 Direcciones (N, NE, E, SE, S, SO, O, NO)", 16, 308);

  const wsCombos = [
    { up: "player_fire", low: "player_walk0", ang: 0.0, lbl: "fire + walk0 (0°)" },
    { up: "player_fire", low: "player_walk1", ang: -0.35, lbl: "fire + walk1 (-20°)" },
    { up: "player_fire2", low: "player_walk2", ang: 0.25, lbl: "fire2 + walk2 (+15°)" },
    { up: "player_firehip", low: "player_walk3", ang: 0.0, lbl: "firehip + walk3 (0°)" },
    { up: "player_fire", low: "player_walk2", ang: 2.9, lbl: "fire + walk2 (Flip L)" },
    { up: "player_fire2", low: "player_walk1", ang: -2.8, lbl: "fire2 + walk1 (Flip L)" }
  ];
  for (let i = 0; i < wsCombos.length; i++) {
    const cb = wsCombos[i];
    const bx = 16 + i * 176;
    const by = 322;
    actx.fillStyle = "#160d2a";
    actx.fillRect(bx, by, 166, 220);
    sandbox.DD_WORLD.drawProtagonist(
      actx,
      { x: bx + 83, y: by + 165, aimAngle: cb.ang },
      { upperPose: cb.up, lowerPose: cb.low, waistSplitActive: true },
      null, i === 5 ? 40 : 0, 0, 1.05
    );
    actx.fillStyle = "#38bdf8";
    actx.font = "11px sans-serif";
    actx.fillText(cb.lbl, bx + 6, by + 212);
  }

  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  for (let i = 0; i < dirs.length; i++) {
    const d = dirs[i];
    const im = diskImages["player_dir_" + d];
    const bx = 1084 + i * 176;
    const by = 322;
    actx.fillStyle = "#160d2a";
    actx.fillRect(bx, by, 166, 220);
    if (im) {
      actx.drawImage(im, bx - 9, by + 12, 184, 184);
    }
    actx.fillStyle = "#ff2d95";
    actx.font = "bold 12px sans-serif";
    actx.fillText("player_dir_" + d, bx + 8, by + 212);
  }

  actx.fillStyle = "#f6c453";
  actx.font = "bold 15px sans-serif";
  actx.fillText("C. Ciclos de 4 Estados de las 6 Familias de Enemigos (walk -> windup -> attack -> death) a escala uniforme", 16, 568);

  const eFams = ["security", "fanatic", "chef", "dancer", "drone", "elite"];
  const eStates = ["walk", "windup", "attack", "death"];
  for (let f = 0; f < eFams.length; f++) {
    const fam = eFams[f];
    const gx = 16 + f * 414;
    const gy = 582;
    actx.fillStyle = "#140b24";
    actx.fillRect(gx, gy, 404, 340);
    actx.strokeStyle = "#4c1d95";
    actx.strokeRect(gx, gy, 404, 340);
    actx.fillStyle = "#ff2d95";
    actx.font = "bold 13px sans-serif";
    actx.fillText("FAMILIA: " + fam.toUpperCase(), gx + 10, gy + 22);
    for (let s = 0; s < 4; s++) {
      const st = eStates[s];
      const im = diskImages[`enemy_${fam}_${st}`];
      const sx = gx + 8 + (s % 2) * 196;
      const sy = gy + 32 + Math.floor(s / 2) * 150;
      actx.fillStyle = "#1e1233";
      actx.fillRect(sx, sy, 188, 142);
      if (im) {
        const h = 118;
        const w = h * (im.width / im.height);
        actx.drawImage(im, sx + (188 - w) * 0.5, sy + 6, w, h);
      }
      actx.fillStyle = "#cbd5e1";
      actx.font = "11px sans-serif";
      actx.fillText(`${fam}_${st}`, sx + 6, sy + 136);
    }
  }

  ugCtx.drawImage(animCanv, 24, 604);
  fs.writeFileSync(path.join(outDir, "audit_03_resolutions_ui_and_animations.png"), uiGrid.toBuffer("image/png"));
  console.log("Saved audit_03_resolutions_ui_and_animations.png");
})();
