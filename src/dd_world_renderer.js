/* ==========================================================================
   DEADBEAT DISCO — HIGH-RESOLUTION 2.5D WORLD RENDERER (window.DD_WORLD)
   Replaces pixel-art blitting & procedural blockouts with native-DPR smooth
   digital illustration rendering across all Circles, Props, Characters & VFX.
   ========================================================================== */
(function () {
  "use strict";

  const CIRCLE_CONFIG = [
    { idx: 0, key: "limbo",    floor: "floor_00_limbo_marble",     wall: "wall_panel_gothic_niche", pillar: "wall_pillar_obsidian", neon: "#ff2d7a", sec: "#22d3ee", haze: "rgba(255,45,122,0.08)" },
    { idx: 1, key: "lust",     floor: "floor_01_lust_dancefloor",  wall: "wall_panel_neon_crown",   pillar: "wall_pillar_obsidian", neon: "#ff2d7a", sec: "#c026d3", haze: "rgba(255,45,122,0.13)" },
    { idx: 2, key: "gula",     floor: "floor_02_gula_terracotta",  wall: "wall_gula_banquet",       pillar: "wall_pillar_obsidian", neon: "#f59e0b", sec: "#ef4444", haze: "rgba(245,158,11,0.10)" },
    { idx: 3, key: "greed",    floor: "floor_03_greed_slate_gold", wall: "wall_gula_banquet",       pillar: "wall_pillar_obsidian", neon: "#facc15", sec: "#fb7185", haze: "rgba(250,204,21,0.10)" },
    { idx: 4, key: "wrath",    floor: "floor_04_wrath_burgundy",   wall: "wall_wrath_furnace",      pillar: "wall_pillar_obsidian", neon: "#ef4444", sec: "#f97316", haze: "rgba(239,68,68,0.12)" },
    { idx: 5, key: "pride",    floor: "floor_05_pride_obsidian_gold", wall: "wall_panel_heavy_base", pillar: "wall_pillar_obsidian", neon: "#a855f7", sec: "#facc15", haze: "rgba(168,85,247,0.11)" },
    { idx: 6, key: "violence", floor: "floor_06_violence_ash_slabs", wall: "wall_wrath_furnace",    pillar: "wall_pillar_obsidian", neon: "#fb7185", sec: "#94a3b8", haze: "rgba(251,113,133,0.09)" },
    { idx: 7, key: "envy",     floor: "floor_07_envy_travertine",  wall: "wall_panel_vip_window",   pillar: "wall_pillar_obsidian", neon: "#22d3ee", sec: "#ff2d7a", haze: "rgba(34,211,238,0.11)" },
    { idx: 8, key: "ice",      floor: "floor_08_ice_abyssal",      wall: "wall_ice_glacier",        pillar: "wall_pillar_obsidian", neon: "#38bdf8", sec: "#f43f5e", haze: "rgba(56,189,248,0.12)" },
    { idx: 9, key: "core",     floor: "floor_09_core_cosmic_vein", wall: "wall_core_monolith",      pillar: "wall_pillar_obsidian", neon: "#f8fafc", sec: "#ff2d7a", haze: "rgba(248,250,252,0.10)" }
  ];

  const PROP_KIND_TO_ASSET = {
    sofa: "prop_sofa_magenta",
    booth: "prop_sofa_black",
    lounge: "prop_sofa_magenta",
    armchair: "prop_armchair_vip",
    chair: "prop_armchair_vip",
    bench: "prop_bench_neon",
    lowtable: "prop_bench_neon",
    plant: "prop_potted_plant",
    planter: "prop_potted_plant",
    palm: "prop_neon_palm",
    speaker: "prop_speaker_tower",
    subwoofer: "prop_subwoofer_cyan",
    amp: "prop_subwoofer_cyan",
    arcade: "prop_arcade_cabinet",
    machine: "prop_arcade_cabinet",
    slot: "prop_arcade_cabinet",
    vending: "prop_vending_machine",
    dispenser: "prop_vending_machine",
    cooler: "prop_cooler_neon",
    fridge: "prop_cooler_neon",
    mirror: "prop_mirror_baroque",
    mirrorpanel: "prop_mirror_baroque",
    chest: "prop_chest_closed",
    poster: "prop_sigil_poster",
    frameunit: "prop_sigil_poster",
    banner: "prop_hub_fox_neon",
    bunny: "prop_neon_flower",
    lamp: "prop_candelabra_floor",
    candelabra: "prop_candelabra_floor",
    chandelier: "prop_chandelier_gold",
    crate: "prop_crate_club",
    cratestack: "prop_crate_club",
    barrel: "prop_barrel_infernal",
    keg: "prop_barrel_infernal",
    counter: "prop_bar_counter",
    barcounter: "prop_bar_counter",
    desk: "prop_bar_counter",
    table: "prop_banquet_table",
    tableRect: "prop_banquet_table",
    longtable: "prop_banquet_table",
    carvetable: "prop_banquet_table",
    djbooth: "prop_dj_booth",
    console: "prop_dj_booth",
    mixer: "prop_dj_booth",
    altartable: "prop_gilded_altar",
    altar: "prop_gilded_altar",
    fireplace: "prop_gilded_altar",
    plinth: "prop_gothic_statue",
    statue: "prop_gothic_statue",
    mannequin: "prop_gothic_statue",
    fountain: "prop_arcane_pedestal",
    pedestal: "prop_arcane_pedestal",
    pylon: "prop_arcane_pedestal",
    pillar: "wall_pillar_obsidian",
    column: "wall_pillar_obsidian",
    shelf: "prop_bookshelf_hub",
    rack: "prop_bookshelf_hub",
    bottles: "prop_bar_bottles",
    barrierunit: "prop_bollard_pair",
    queue: "prop_bollard_pair",
    stanchion: "prop_bollard_pair"
  };

  const BOSS_INDEX_TO_SLUG = [
    "boss_00_anden",
    "boss_01_magneta",
    "boss_02_bufe",
    "boss_03_cajero",
    "boss_04_pogo",
    "boss_05_oficiante",
    "boss_06_matarife",
    "boss_07_imitador",
    "boss_08_traidor",
    "boss_09_nucleo"
  ];

  const patternCache = Object.create(null);

  function getCircleCfg(circleIdx) {
    const idx = Math.max(0, Math.min(9, Number(circleIdx) || 0));
    return CIRCLE_CONFIG[idx];
  }

  function getFloorPattern(ctx, assetId) {
    const im = window.DD_ASSETS && window.DD_ASSETS.get(assetId);
    if (!im) return null;
    const key = assetId + ":" + im.naturalWidth;
    if (patternCache[key]) return patternCache[key];
    // Pre-scale 512px tile to crisp 256px world material tile
    const tileCnv = document.createElement("canvas");
    tileCnv.width = 256;
    tileCnv.height = 256;
    const tctx = tileCnv.getContext("2d");
    tctx.imageSmoothingEnabled = true;
    tctx.imageSmoothingQuality = "high";
    tctx.drawImage(im, 0, 0, 256, 256);
    const pat = ctx.createPattern(tileCnv, "repeat");
    if (pat) patternCache[key] = pat;
    return pat;
  }

  function setSmooth(ctx) {
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    try { ctx.imageSmoothingQuality = "high"; } catch (e) {}
  }

  function drawSoftShadow(ctx, cx, cy, rx, ry, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, Math.max(0.25, ry / Math.max(1, rx)));
    const g = ctx.createRadialGradient(0, 0, rx * 0.12, 0, 0, rx);
    g.addColorStop(0, "rgba(3, 1, 8, " + (alpha || 0.58) + ")");
    g.addColorStop(0.68, "rgba(5, 2, 12, " + ((alpha || 0.58) * 0.42) + ")");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawNeonGlow(ctx, cx, cy, radius, hexColor, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = alpha || 0.25;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
    g.addColorStop(0, hexColor);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------------------------------
     1. ROOM CACHE BUILDER (Replaces pixel-art `qc` / `Zb` / `$b`)
     ------------------------------------------------------------------------ */
  function buildHighResRoomCache(ctx, worldW, worldH, roomRect, circleIdx, roomSeed, clipRoomFn) {
    setSmooth(ctx);
    const cfg = getCircleCfg(circleIdx);

    // Deep atmospheric void outside room walls
    const voidGrad = ctx.createLinearGradient(0, 0, 0, worldH);
    voidGrad.addColorStop(0, "#05020a");
    voidGrad.addColorStop(0.5, "#090414");
    voidGrad.addColorStop(1, "#040208");
    ctx.fillStyle = voidGrad;
    ctx.fillRect(0, 0, worldW, worldH);

    const rx = roomRect.x;
    const ry = roomRect.y;
    const rw = roomRect.w;
    const rh = roomRect.h;

    // Clip to actual room shape (handles octagons, L-rooms, cathedrals, rings, corridors!)
    ctx.save();
    if (typeof clipRoomFn === "function") {
      clipRoomFn(ctx);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
    }

    // Fill with high-res seamless Circle floor material (fallback to limbo marble or rich dark-stone gradient while pending)
    const floorPat =
      getFloorPattern(ctx, cfg.floor) ||
      getFloorPattern(ctx, "floor_00_limbo_marble") ||
      getFloorPattern(ctx, "floor_10_hub_checker");

    if (floorPat) {
      ctx.fillStyle = floorPat;
      ctx.fillRect(rx - 64, ry - 64, rw + 128, rh + 128);
      // Nightclub moody lighting glaze so neon VFX, projectiles & characters pop with high contrast
      ctx.fillStyle = circleIdx === 0 ? "rgba(10, 5, 22, 0.42)" : "rgba(7, 3, 16, 0.24)";
      ctx.fillRect(rx - 64, ry - 64, rw + 128, rh + 128);
    } else {
      const fg = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
      fg.addColorStop(0, "#171126");
      fg.addColorStop(0.5, "#1f1533");
      fg.addColorStop(1, "#120c1e");
      ctx.fillStyle = fg;
      ctx.fillRect(rx, ry, rw, rh);
    }

    // VIP center rug / dancefloor inset accent for rich 2.5D spatial framing
    const insetW = Math.min(rw * 0.48, 680);
    const insetH = Math.min(rh * 0.44, 460);
    const cx = rx + rw * 0.5;
    const cy = ry + rh * 0.5;
    const vipPat = (circleIdx === 0 || circleIdx === 2 || circleIdx === 3)
      ? getFloorPattern(ctx, "floor_11_vip_velvet")
      : (circleIdx === 7 ? getFloorPattern(ctx, "floor_10_hub_checker") : null);
    if (vipPat && rw > 760 && rh > 560) {
      ctx.save();
      ctx.globalAlpha = 0.78;
      ctx.fillStyle = vipPat;
      ctx.fillRect(cx - insetW / 2, cy - insetH / 2, insetW, insetH);
      ctx.strokeStyle = cfg.neon;
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - insetW / 2, cy - insetH / 2, insetW, insetH);
      ctx.restore();
    }

    // Subtle 2.5D isometric perspective architectural bevel lines & ambient floor shading
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = "#05020a";
    ctx.lineWidth = 1.5;
    const step = 128;
    ctx.beginPath();
    for (let x = rx - rh; x < rx + rw + rh; x += step) {
      ctx.moveTo(x, ry);
      ctx.lineTo(x + rh * 0.5, ry + rh);
    }
    ctx.stroke();
    ctx.restore();

    // Specular neon floor reflection pools
    drawNeonGlow(ctx, cx, cy, Math.min(rw, rh) * 0.42, cfg.neon, 0.16);
    drawNeonGlow(ctx, rx + rw * 0.22, ry + rh * 0.28, 240, cfg.sec, 0.13);
    drawNeonGlow(ctx, rx + rw * 0.78, ry + rh * 0.72, 240, cfg.sec, 0.13);

    // Deep perimeter ambient occlusion shadow along walls
    const aoTop = ctx.createLinearGradient(0, ry, 0, ry + 115);
    aoTop.addColorStop(0, "rgba(4, 2, 10, 0.86)");
    aoTop.addColorStop(1, "rgba(4, 2, 10, 0)");
    ctx.fillStyle = aoTop;
    ctx.fillRect(rx, ry, rw, 115);

    const aoBot = ctx.createLinearGradient(0, ry + rh - 85, 0, ry + rh);
    aoBot.addColorStop(0, "rgba(4, 2, 10, 0)");
    aoBot.addColorStop(1, "rgba(4, 2, 10, 0.75)");
    ctx.fillStyle = aoBot;
    ctx.fillRect(rx, ry + rh - 85, rw, 85);

    ctx.restore(); // end floor clip

    // ----------------------------------------------------------------------
    // 2.5D MODULAR GOTHIC NORTH WALL FACADE + PILASTERS + PERIMETER MOLDING
    // ----------------------------------------------------------------------
    const wallImg =
      (window.DD_ASSETS && window.DD_ASSETS.get(cfg.wall)) ||
      (window.DD_ASSETS && window.DD_ASSETS.get("wall_panel_gothic_niche")) ||
      (window.DD_ASSETS && window.DD_ASSETS.get("wall_panel_neon_crown"));
    const pillarImg = window.DD_ASSETS && window.DD_ASSETS.get(cfg.pillar);
    const foxNeonImg = window.DD_ASSETS && window.DD_ASSETS.get("prop_hub_fox_neon");
    const wallH = 132;
    const wallTopY = ry - 34;
    const modW = 128;

    // 2.5D North wall elevation band visible inside top room perimeter
    const nwGrad = ctx.createLinearGradient(0, wallTopY, 0, wallTopY + wallH + 10);
    nwGrad.addColorStop(0, "#070310");
    nwGrad.addColorStop(0.85, "#120922");
    nwGrad.addColorStop(1, "rgba(5, 2, 10, 0.92)");
    ctx.fillStyle = nwGrad;
    ctx.fillRect(rx - 8, wallTopY, rw + 16, wallH + 6);

    if (wallImg) {
      for (let wx = rx; wx < rx + rw; wx += modW) {
        const segW = Math.min(modW, rx + rw - wx);
        ctx.drawImage(wallImg, 0, 0, wallImg.naturalWidth * (segW / modW), wallImg.naturalHeight, wx, wallTopY + 2, segW, wallH);
      }
    } else {
      ctx.strokeStyle = cfg.neon;
      ctx.lineWidth = 2;
      for (let wx = rx + 16; wx < rx + rw - 48; wx += 128) {
        ctx.fillStyle = "rgba(8, 4, 16, 0.92)";
        ctx.fillRect(wx, wallTopY + 14, 96, wallH - 20);
        ctx.strokeRect(wx, wallTopY + 14, 96, wallH - 20);
      }
    }

    // Architectural pilasters every 320px + room corners
    if (pillarImg) {
      for (let px = rx - 14; px <= rx + rw - 24; px += 320) {
        ctx.drawImage(pillarImg, px, wallTopY - 8, 56, wallH + 16);
      }
      ctx.drawImage(pillarImg, rx + rw - 38, wallTopY - 8, 56, wallH + 16);
    }

    // Signature neon wall emblem at upper facade flanks
    if (foxNeonImg && rw >= 900) {
      ctx.drawImage(foxNeonImg, rx + 96, wallTopY + 10, 82, 108);
      ctx.drawImage(foxNeonImg, rx + rw - 178, wallTopY + 10, 82, 108);
      drawNeonGlow(ctx, rx + 137, wallTopY + 64, 120, "#ff2d7a", 0.24);
      drawNeonGlow(ctx, rx + rw - 137, wallTopY + 64, 120, "#ff2d7a", 0.24);
    }

    // Crisp dark-ink + neon architectural rim around room boundary
    ctx.save();
    if (typeof clipRoomFn === "function") {
      clipRoomFn(ctx);
    } else {
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
    }
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#07030e";
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = cfg.neon;
    ctx.stroke();
    ctx.restore();
  }

  /* ------------------------------------------------------------------------
     2. DOORS, PORTALS & DESCENT PADS (Replaces procedural `Bg` & `WA`)
     ------------------------------------------------------------------------ */
  function drawDoor(ctx, door, circleIdx, timeSec) {
    if (!door) return;
    setSmooth(ctx);
    const open = !!door.open || !!door.unlocked;
    const isBoss = door.kind === "boss" || door.toType === "boss";
    const isShop = door.kind === "shop" || door.toType === "shop";
    const isTreasure = door.kind === "treasure" || door.kind === "elite";

    let assetId = open ? "door_arched_open" : "door_stained_closed";
    if (isBoss) assetId = "portal_baroque_gold";
    else if (isShop) assetId = "door_vip_crimson";
    else if (isTreasure) assetId = "portal_avaricia_gold";
    else if (circleIdx >= 4) assetId = open ? "door_gothic_open" : "door_gothic_closed";

    const im =
      (window.DD_ASSETS && window.DD_ASSETS.get(assetId)) ||
      (window.DD_ASSETS && window.DD_ASSETS.get("threshold_descent_pad"));

    const dx = door.x || 0;
    const dy = door.y || 0;
    const glowCol = isBoss ? "#facc15" : (open ? "#22d3ee" : "#ff2d7a");

    drawNeonGlow(ctx, dx, dy, open ? 135 : 85, glowCol, open ? 0.34 : 0.18);

    if (im) {
      const w = 136;
      const h = w * (im.naturalHeight / Math.max(1, im.naturalWidth));
      ctx.save();
      ctx.translate(dx, dy);
      if (door.side === "bottom" || door.dir === "S") {
        ctx.scale(1, 0.82);
      }
      ctx.drawImage(im, -w / 2, -h * 0.78, w, h);
      ctx.restore();
    } else {
      // Clean high-res vector archway fallback until Tanda 04 lands
      ctx.save();
      ctx.translate(dx, dy);
      ctx.fillStyle = "#090414";
      ctx.strokeStyle = glowCol;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-48, -88, 96, 98, [44, 44, 4, 4]);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (open) {
      // Animated volumetric invitation beam
      const pulse = 0.22 + 0.08 * Math.sin((timeSec || 0) * 4.2);
      drawNeonGlow(ctx, dx, dy + 14, 72, "#22d3ee", pulse);
    }
  }

  function drawDescentPad(ctx, pad, timeSec) {
    if (!pad) return;
    setSmooth(ctx);
    const px = pad.x || 0;
    const py = pad.y || 0;
    const im = window.DD_ASSETS && window.DD_ASSETS.get("threshold_descent_pad");
    const pulse = 0.28 + 0.1 * Math.sin((timeSec || 0) * 3.6);
    drawNeonGlow(ctx, px, py, 145, "#22d3ee", pulse);
    if (im) {
      const w = 196;
      const h = w * (im.naturalHeight / Math.max(1, im.naturalWidth));
      ctx.drawImage(im, px - w / 2, py - h / 2, w, h);
    }
  }

  /* ------------------------------------------------------------------------
     3. ISOMETRIC PROPS & FURNITURE (Replaces pixel/blockout `Lc`)
     ------------------------------------------------------------------------ */
  function drawProp(ctx, prop, timeSec) {
    if (!prop || prop.hidden) return false;
    setSmooth(ctx);
    const kind = String(prop.kind || prop.type || "crate");
    let assetId = PROP_KIND_TO_ASSET[kind] || "prop_crate_club";
    if (kind === "chest" && (prop.opened || prop.open)) {
      assetId = "prop_chest_open";
    }
    const im = window.DD_ASSETS && window.DD_ASSETS.get(assetId);
    if (!im) return false;

    const baseR = Math.max(24, Number(prop.br || prop.r || 38));
    const drawW = Math.max(64, Math.min(240, baseR * 2.55));
    const drawH = drawW * (im.naturalHeight / Math.max(1, im.naturalWidth));

    drawSoftShadow(ctx, prop.x, prop.y + baseR * 0.32, drawW * 0.44, drawW * 0.2, 0.56);

    ctx.save();
    ctx.translate(prop.x, prop.y);
    if (prop.hitT && prop.hitT > 0) {
      ctx.translate(Math.sin(prop.hitT * 50) * 3, 0);
    }
    if (prop.flipX) ctx.scale(-1, 1);
    ctx.drawImage(im, -drawW / 2, -drawH + baseR * 0.42, drawW, drawH);
    ctx.restore();

    if (assetId === "prop_neon_palm" || assetId === "prop_neon_flower" || assetId === "prop_hub_fox_neon") {
      drawNeonGlow(ctx, prop.x, prop.y - drawH * 0.45, drawW * 0.7, "#ff2d7a", 0.2);
    } else if (assetId === "prop_subwoofer_cyan" || assetId === "prop_cooler_neon" || assetId === "prop_arcade_cabinet") {
      drawNeonGlow(ctx, prop.x, prop.y - drawH * 0.35, drawW * 0.62, "#22d3ee", 0.16);
    }
    return true;
  }

  /* ------------------------------------------------------------------------
     4. PROTAGONIST, ENEMIES, BOSSES, PICKUPS & COMBAT VFX
     ------------------------------------------------------------------------ */
  const PLAYER_POSE_TO_ID = {
    player_idle: "player_idle_00",
    player_walk0: "player_walk_00",
    player_walk1: "player_walk_01",
    player_walk2: "player_walk_02",
    player_walk3: "player_walk_03",
    player_fire: "player_shoot_00",
    player_fire2: "player_fire2",
    player_firehip: "player_firehip",
    player_hit: "player_hurt_00",
    player_roll: "player_roll_00",
    player_death: "player_death_00",
    player_boost: "player_boost_00"
  };

  /* Contrato de lienzo del protagonista (tanda de arte R01, ilustración digital):
     - Todos los fotogramas "de pie" comparten escala, línea de suelo y eje de
       torso centrado en el lienzo; el ANCHO del lienzo puede variar por pose.
     - El lienzo completo se dibuja con PLAYER_BASE_H px de alto y su borde
       inferior cae en y + PLAYER_FOOT_Y (voltereta 84 px, derribo 56 px).
     - CONVENCIÓN DE SUELO (la del motor): el punto lógico (x, y) es el círculo
       de colisión apoyado en el suelo; los pies caen en y + r (r = 14). Con ella
       el arma queda a la altura del "hombro" del motor (y − 56), que es la altura
       a la que el motor eleva las balas del jugador (bala.rigH), los pies no
       pisan el muro inferior y el orden de profundidad coincide con el de los
       enemigos (pies en y + 0.65·r). La pasada HD anterior usaba y + 32: las
       balas salían 43 px por debajo del cañón.
     - Cada fotograma registra en el manifiesto (entries[id].anchors) dónde cae el
       borde inferior de SU cinturón (belt, fracción del alto) y, si lleva arma, la
       mano que la empuña (hand = [u, v]). Los mide tools/art_master/batch.py sobre
       el maestro; aquí sólo hay valores de reserva por si falta el dato.
     - Corte de cintura: las piernas se dibujan desde su cinturón hacia abajo y el
       torso desde arriba hasta el suyo, desplazado en vertical para que ambos
       cinturones coincidan. Manda la pelvis de las piernas: el torso sube y baja
       con la zancada y no hay escalón en la costura. */
  const PLAYER_BASE_H = 104;
  const PLAYER_ROLL_H = 84;
  const PLAYER_DEATH_H = 56;
  const PLAYER_FOOT_Y = 16;
  const PLAYER_GROUND_Y = 14;         // suelas: el lienzo deja ~8 texeles (1,6 px) bajo los pies
  const PLAYER_BELT_FALLBACK = 0.4914;
  const PLAYER_SEAM_OVERLAP = 0.004;

  /* Caminata de CUERPO ENTERO (brazos al costado). Se usa cuando el torso está en
     reposo y las piernas caminan (Refugio): cortar por la cintura una pose de
     reposo deja las manos partidas sobre unas piernas en marcha. Los fotogramas
     player_walk_0X son la fuente de PIERNAS del corte de cintura en combate
     (torso en guardia, sin manos por debajo del cinturón). */
  const HERO_WALK_IDS = ["hero_walk_00", "hero_walk_01", "hero_walk_02", "hero_walk_03"];

  /* Poses cuyo torso tiene antebrazos o puños POR DEBAJO del cinturón: el corte de
     cintura los perdería, así que se dibuja encima una capa derivada del mismo
     maestro que sólo contiene esas partes. */
  const PLAYER_SPLIT_OVERLAY = {
    player_firehip: "player_firehip_arms",
    player_aim_down_02: "player_aim_down_02_arms",
    player_aim_down_03: "player_aim_down_03_arms"
  };

  /* Sectores de puntería. El motor apunta en 360° pero el cuerpo es una vista lateral
     que sólo se refleja: con un único torso de brazos horizontales el arma se
     separaba de las manos en cuanto se apuntaba hacia arriba o hacia abajo. Hay un
     torso por sector de ELEVACIÓN (ángulo sobre la horizontal del lado al que mira,
     +90° = arriba, −90° = abajo); el arma sigue girando de forma continua alrededor
     de la mano de ese torso. `min` es la elevación mínima del sector, en grados. */
  const PLAYER_AIM_SECTORS = [
    { min: 72, id: "player_aim_up_03" },
    { min: 47, id: "player_aim_up_02" },
    { min: 19, id: "player_aim_up_01" },
    { min: -15, id: "player_shoot_00" },
    { min: -41, id: "player_aim_down_01" },
    { min: -70, id: "player_aim_down_02" },
    { min: -Infinity, id: "player_aim_down_03" }
  ];
  const PLAYER_AIM_LEVEL = 3;          // índice del sector horizontal
  const PLAYER_AIM_HYSTERESIS = 3;     // grados: evita parpadeo en la frontera entre sectores
  const PLAYER_AIM_LEGS = "player_shoot_00"; // piernas en parado de toda la familia de puntería
  let playerAimSector = PLAYER_AIM_LEVEL;

  function playerAimElevationDeg(aimA) {
    const a = Number(aimA) || 0;
    return Math.atan2(-Math.sin(a), Math.abs(Math.cos(a))) * 180 / Math.PI;
  }
  function playerAimSectorIndex(elDeg) {
    const n = PLAYER_AIM_SECTORS.length;
    const cur = playerAimSector;
    const lo = PLAYER_AIM_SECTORS[cur].min;                         // frontera inferior del sector actual
    const hi = cur > 0 ? PLAYER_AIM_SECTORS[cur - 1].min : Infinity; // frontera superior
    if (elDeg >= lo - PLAYER_AIM_HYSTERESIS && elDeg < hi + PLAYER_AIM_HYSTERESIS) return cur;
    let idx = n - 1;
    for (let i = 0; i < n; i++) {
      if (elDeg >= PLAYER_AIM_SECTORS[i].min) { idx = i; break; }
    }
    playerAimSector = idx;
    return idx;
  }

  /* Reserva de la mano que empuña el arma por pose (u: 0 izquierda → 1 derecha;
     v: 0 arriba → 1 abajo; sprite mirando a la derecha). El valor vigente es
     entries[id].anchors.hand. Las poses SIN ancla no llevan arma (voltereta,
     derribo e impulso: durante el impulso un arma larga tapaba la cara). */
  const PLAYER_HAND_FALLBACK = {
    player_idle_00: [0.678, 0.585],
    player_shoot_00: [0.889, 0.256],
    player_fire2: [0.65, 0.33],
    player_firehip: [0.834, 0.523],
    player_hurt_00: [0.589, 0.46],
    player_aim_up_01: [0.872, 0.114],
    player_aim_up_02: [0.764, 0.091],
    player_aim_up_03: [0.5, 0.063],
    player_aim_down_01: [0.868, 0.455],
    player_aim_down_02: [0.883, 0.576],
    player_aim_down_03: [0.688, 0.551]
  };

  function playerAnchors(id) {
    try {
      const m = window.DD_ASSETS && window.DD_ASSETS.manifest && window.DD_ASSETS.manifest.entries[id];
      return (m && m.anchors) || null;
    } catch (e) { return null; }
  }
  function playerBelt(id) {
    const a = playerAnchors(id);
    return (a && typeof a.belt === "number" && a.belt > 0.2 && a.belt < 0.8) ? a.belt : PLAYER_BELT_FALLBACK;
  }
  function playerHand(id) {
    const a = playerAnchors(id);
    if (a && Array.isArray(a.hand) && a.hand.length === 2) return a.hand;
    return PLAYER_HAND_FALLBACK[id] || null;
  }

  function playerAimAngle(player, pAnim) {
    return (pAnim && pAnim.forcedAimAngle !== null && pAnim.forcedAimAngle !== undefined)
      ? pAnim.forcedAimAngle
      : ((player && player.aimAngle) || 0);
  }

  /* Resuelve qué fotogramas se dibujan para el estado actual de la animación.
     `armed` = el jugador lleva arma a la vista (en sala; en el Refugio no). */
  function resolvePlayerPose(pAnim, aimA, armed) {
    const get = function (id) { return window.DD_ASSETS && window.DD_ASSETS.get(id); };
    let upperId = PLAYER_POSE_TO_ID[(pAnim && pAnim.upperPose) || "player_idle"] || "player_idle_00";
    let lowerId = PLAYER_POSE_TO_ID[(pAnim && pAnim.lowerPose) || "player_idle"] || "player_idle_00";
    const walking = !!(pAnim && pAnim.waistSplitActive) && /^player_walk_0[0-3]$/.test(lowerId);

    // Con el arma a la vista el personaje SIEMPRE apunta al cursor, también parado:
    // la pose de reposo (brazos caídos) queda para el Refugio y las cinemáticas.
    if (armed && upperId === "player_idle_00" && get("player_shoot_00")) upperId = "player_shoot_00";

    let aimFamily = false;
    if (upperId === "player_shoot_00") {
      aimFamily = true;
      const idx = playerAimSectorIndex(playerAimElevationDeg(aimA));
      const sectorId = PLAYER_AIM_SECTORS[idx].id;
      if (idx === PLAYER_AIM_LEVEL) {
        // Armas largas a dos manos: postura de fusil (brazo delantero extendido)
        // mientras se apunta en horizontal. `ddLongGun` lo marca el puente por arma.
        if (pAnim && pAnim.ddLongGun && get("player_fire2")) upperId = "player_fire2";
      } else if (get(sectorId)) {
        upperId = sectorId;
      }
    }

    let upperImg = get(upperId);
    if (!upperImg) return null;
    let lowerImg = null;
    let split = false;
    let fullWalk = false;

    if (walking) {
      lowerImg = get(lowerId);
      split = !!lowerImg && lowerImg !== upperImg;
    } else if (aimFamily && upperId !== PLAYER_AIM_LEGS) {
      // Parado: toda la familia de puntería comparte las piernas de la guardia
      // horizontal; al barrer el ángulo sólo cambian torso y brazos.
      lowerId = PLAYER_AIM_LEGS;
      lowerImg = get(lowerId);
      split = !!lowerImg;
    } else if (pAnim && pAnim.waistSplitActive) {
      lowerImg = get(lowerId);
      split = !!lowerImg && lowerImg !== upperImg;
    }
    if (!lowerImg) { lowerImg = upperImg; lowerId = upperId; split = false; }

    if (split && upperId === "player_idle_00") {
      const m = /^player_walk_0([0-3])$/.exec(lowerId);
      const full = m ? get(HERO_WALK_IDS[Number(m[1])]) : null;
      if (full) {
        upperImg = full;
        lowerImg = full;
        split = false;
        fullWalk = true;
      }
    }

    const pose = { upperId: upperId, lowerId: lowerId, upperImg: upperImg, lowerImg: lowerImg, split: split, fullWalk: fullWalk,
                   beltU: 0, beltL: 0, lift: 0, overlayImg: null, hand: fullWalk ? null : playerHand(upperId) };
    if (split) {
      pose.beltU = playerBelt(upperId);
      pose.beltL = playerBelt(lowerId);
      pose.lift = pose.beltL - pose.beltU; // fracción del alto: cuánto baja (+) o sube (−) el torso
      const ovId = PLAYER_SPLIT_OVERLAY[upperId];
      pose.overlayImg = ovId ? get(ovId) : null;
    }
    return pose;
  }

  /* Dónde se empuña el arma para la pose actual, en px locales al origen del
     jugador tras translate(x, y + bobY) y ya reflejado según la puntería.
     Devuelve null si la pose no lleva arma (voltereta, derribo, caminata de reposo). */
  function getPlayerWeaponMount(pAnim, aimAngle, scaleVal) {
    const scl = Number(scaleVal) > 0 ? Number(scaleVal) : 1;
    const aimA = Number(aimAngle) || 0;
    const pose = resolvePlayerPose(pAnim, aimA, true);
    if (!pose || !pose.hand) return null;
    const anchor = pose.hand;
    const img = pose.upperImg;
    const targetH = PLAYER_BASE_H * scl;
    const targetW = targetH * (img.naturalWidth / Math.max(1, img.naturalHeight));
    const facingLeft = Math.cos(aimA) < 0;
    return {
      pose: pose.upperId,
      x: (anchor[0] - 0.5) * targetW * (facingLeft ? -1 : 1),
      y: -targetH + PLAYER_FOOT_Y + (anchor[1] + pose.lift) * targetH
    };
  }

  function drawProtagonist(ctx, player, pAnim, drawWeaponLayerFn, shieldVal, raveTimer, scaleVal) {
    if (!player) return false;
    const scl = Number(scaleVal) > 0 ? Number(scaleVal) : 1;
    const aimA = playerAimAngle(player, pAnim);
    const armed = typeof drawWeaponLayerFn === "function";
    const pose = resolvePlayerPose(pAnim, aimA, armed);
    if (!pose) return false; // Falls back cleanly to the engine's own Pf

    const upperImg = pose.upperImg;
    const lowerImg = pose.lowerImg;
    const isDeath = pose.upperId === "player_death_00";
    const isRoll = pose.upperId === "player_roll_00";

    setSmooth(ctx);
    const px = player.x;
    const py = player.y;
    let facingLeft = Math.cos(aimA) < 0;
    if (isRoll && Math.abs(Number(player.rollDX) || 0) > 0.05) {
      facingLeft = player.rollDX < 0; // la voltereta mira hacia donde rueda
    }
    const bobY = (pAnim && pAnim.bobY) || 0;
    const lean = (pAnim && pAnim.turnLean) || 0;

    drawSoftShadow(ctx, px, py + (PLAYER_FOOT_Y - 3) * scl, (isDeath ? 46 : 34) * scl, 14 * scl, 0.62);
    if (raveTimer > 0) {
      drawNeonGlow(ctx, px, py - 34 * scl, 78, "#ff2d7a", 0.35);
    }

    ctx.save();
    ctx.translate(px, py + bobY);

    // Sin ancla de mano no hay arma: voltereta, derribo, impulso y caminata de reposo.
    const carriesWeapon = armed && !isDeath && !isRoll && !pose.fullWalk && !!pose.hand;
    if (carriesWeapon) {
      ctx.save();
      drawWeaponLayerFn("back", ctx);
      ctx.restore();
    }

    ctx.save();
    if (facingLeft) ctx.scale(-1, 1);

    const targetH = (isDeath ? PLAYER_DEATH_H : (isRoll ? PLAYER_ROLL_H : PLAYER_BASE_H)) * scl;
    const widthOf = function (img) {
      return targetH * (img.naturalWidth / Math.max(1, img.naturalHeight));
    };
    const drawY = -targetH + PLAYER_FOOT_Y;

    if (isRoll) {
      // Bola en voltereta: gira alrededor del centro del lienzo mientras dura la esquiva.
      const w = widthOf(upperImg);
      const el = Number(player.rollElapsed);
      const turns = (player.rollT > 0 && isFinite(el)) ? el / 0.32 : 0.08; // 0.32 s = duración de la esquiva del motor
      ctx.translate(0, drawY + targetH * 0.5);
      ctx.rotate(turns * Math.PI * 2);
      ctx.drawImage(upperImg, -w * 0.5, -targetH * 0.5, w, targetH);
    } else {
      if (!isDeath) ctx.rotate(lean * 0.55);
      if (pose.split) {
        // Cada mitad con SU ancho (los lienzos comparten eje de torso, no anchura)
        // y cortada por SU cinturón; el torso se desplaza para casar con la pelvis.
        const lw = widthOf(lowerImg);
        const uw = widthOf(upperImg);
        const lh = lowerImg.naturalHeight;
        const uh = upperImg.naturalHeight;
        const torsoY = drawY + pose.lift * targetH;
        const cutU = pose.beltU + PLAYER_SEAM_OVERLAP;
        ctx.drawImage(
          lowerImg,
          0, lh * pose.beltL, lowerImg.naturalWidth, lh * (1 - pose.beltL),
          -lw * 0.5, drawY + targetH * pose.beltL, lw, targetH * (1 - pose.beltL)
        );
        ctx.drawImage(
          upperImg,
          0, 0, upperImg.naturalWidth, uh * cutU,
          -uw * 0.5, torsoY, uw, targetH * cutU
        );
        if (pose.overlayImg) {
          const ow = widthOf(pose.overlayImg);
          ctx.drawImage(pose.overlayImg, -ow * 0.5, torsoY, ow, targetH);
        }
      } else {
        const w = widthOf(upperImg);
        ctx.drawImage(upperImg, -w * 0.5, drawY, w, targetH);
      }
    }
    ctx.restore();

    if (carriesWeapon) {
      ctx.save();
      drawWeaponLayerFn("front", ctx);
      ctx.restore();
    }

    if (shieldVal > 0 && !isDeath) {
      ctx.strokeStyle = "rgba(34, 211, 238, 0.62)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, -33 * scl, 34 * scl, 54 * scl, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
    return true;
  }

  /* ======================================================================
     ENEMIGOS (tanda de arte R02)

     Quién decide qué: el PUENTE (tools/build_active_html.py → ddEnemyView)
     aplica las reglas del propio motor y entrega una "vista" por enemigo:
       family  security | dancer | fanatic | chef | drone | elite
       state   walk | windup | attack | hit
       flip    true = mira a la izquierda (el motor los encara al jugador)
       flash   destello blanco de impacto (s)        phase  reloj de zancada
       marker  elite | guardian | mini | null        hpAlways, frozen, objective
     Este módulo sólo dibuja. Sin vista (llamadas antiguas) usa una estimación.

     Contrato de lienzo (entries[id].anchors, medido por tools/art_master):
       foot = [u, v]  punto de apoyo en el suelo (entre los pies)
       unit = fracción del alto del lienzo que mide la figura de referencia de
              la familia (la de `walk`, erguida). Los cuatro estados de una
              familia comparten escala, así que `unit × alto` es el mismo
              número de píxeles en todos: un ataque no "crece".
     El arte anterior no trae anclas: se dibuja con el contrato viejo
     (pivote abajo-centro, figura ≈ 86 % del lienzo).

     Nunca se mezclan dos generaciones de arte dentro de una familia: si el
     fotograma de un estado es de otra revisión que su `walk`, se usa `walk`
     con una señal procedimental (inclinación, destello, colapso).
     ====================================================================== */
  const ENEMY_BASE = {
    // h = alto de la figura (px de mundo) con el radio base r de su tipo en el motor
    // REF_06 dibuja a las familias humanoides a la altura del protagonista (≈ 90 px
    // de figura) y al Tanque igual de alto pero el doble de ancho.
    // halo = opacidad del halo de separación (ver ENEMY_HALO): más en las figuras
    // negras, que son las que se pierden sobre suelo oscuro; menos en las claras.
    security: { h: 94, r: 12, halo: 0.56 },
    dancer: { h: 90, r: 12, halo: 0.36 },
    fanatic: { h: 80, r: 10, halo: 0.5 },     // agazapado; erguido mediría como los demás
    chef: { h: 106, r: 16, halo: 0.32 },
    drone: { h: 90, r: 12, halo: 0.42 },
    elite: { h: 100, r: 13.92, halo: 0.36 }
  };
  /* Convención de suelo del motor: (x, y) es el círculo de colisión apoyado en el
     suelo y los pies caen en y + 0.65·r. Las balas del jugador vuelan a ras de
     suelo pero se dibujan 56 px más arriba (altura del arma): con esta regla y
     figuras de 80 px o más, el impacto se ve en el torso. */
  const ENEMY_FOOT_K = 0.65;
  const ENEMY_LEGACY_UNIT = 0.86;
  const ENEMY_LEGACY_FOOT = [0.5, 0.985];
  const ENEMY_STATE_ASSET = { walk: "walk", windup: "windup", attack: "attack", hit: "walk", death: "death" };
  const enemyMotion = (typeof WeakMap === "function") ? new WeakMap() : null;
  const enemyTintCache = (typeof Map === "function") ? new Map() : null;

  function enemyEntry(id) {
    try {
      return (window.DD_ASSETS && window.DD_ASSETS.manifest && window.DD_ASSETS.manifest.entries[id]) || null;
    } catch (e) { return null; }
  }

  function enemyFigureHeight(family, r) {
    const b = ENEMY_BASE[family] || ENEMY_BASE.security;
    const k = Math.pow(Math.max(0.5, Math.min(4, (Number(r) || b.r) / b.r)), 0.75);
    return b.h * Math.max(0.8, Math.min(2.0, k));
  }

  function enemyHaloAlpha(family) {
    const b = ENEMY_BASE[family];
    return (b && typeof b.halo === "number") ? b.halo : ENEMY_HALO.alpha;
  }

  /* Elige el fotograma de (familia, estado) sin mezclar revisiones de arte. */
  function resolveEnemyFrame(family, state) {
    if (!window.DD_ASSETS) return null;
    const walkId = "enemy_" + family + "_walk";
    const walkIm = window.DD_ASSETS.get(walkId);
    if (!walkIm) return null;
    const walkEntry = enemyEntry(walkId) || {};
    const wanted = ENEMY_STATE_ASSET[state] || "walk";
    let id = walkId;
    let im = walkIm;
    let entry = walkEntry;
    if (wanted !== "walk") {
      const sid = "enemy_" + family + "_" + wanted;
      const sim = window.DD_ASSETS.get(sid);
      const sentry = enemyEntry(sid) || {};
      if (sim && (sentry.rev || null) === (walkEntry.rev || null)) {
        id = sid; im = sim; entry = sentry;
      }
    }
    const an = entry.anchors || null;
    const foot = (an && Array.isArray(an.foot) && an.foot.length === 2) ? an.foot : ENEMY_LEGACY_FOOT;
    const unit = (an && typeof an.unit === "number" && an.unit > 0.1 && an.unit <= 1.5) ? an.unit : ENEMY_LEGACY_UNIT;
    return { id: id, im: im, foot: foot, unit: unit, dedicated: id !== walkId || wanted === "walk", rev: entry.rev || null };
  }

  /* Estimación para llamadas sin vista del puente (herramientas, pruebas). */
  function resolveEnemyFamily(e) {
    const raw = String((e && (e.artFamily || e.family || e.type || e.kind)) || "").toLowerCase();
    if (e && e.elite) return "elite";
    if (raw.includes("sprinter") || raw.includes("fanatic")) return "fanatic";
    if (raw.includes("tank") || raw.includes("chef")) return "chef";
    if (raw.includes("speaker") || raw.includes("drone") || raw.includes("ranged")) return "drone";
    if (raw.includes("dancer")) return "dancer";
    if (raw.includes("elite")) return "elite";
    return "security";
  }

  function enemyGeometry(enemy, view) {
    const family = (view && view.family) || resolveEnemyFamily(enemy);
    const r = Math.max(6, Number(enemy && enemy.r) || 12);
    const figH = enemyFigureHeight(family, r);
    const footY = (Number(enemy && enemy.y) || 0) + r * ENEMY_FOOT_K;
    return { family: family, r: r, figH: figH, footY: footY, topY: footY - figH };
  }

  function enemyWhiteSilhouette(im) {
    if (!enemyTintCache || !im || !im.naturalWidth) return null;
    const key = im.src || im;
    let cv = enemyTintCache.get(key);
    if (!cv) {
      cv = document.createElement("canvas");
      cv.width = im.naturalWidth;
      cv.height = im.naturalHeight;
      const c2 = cv.getContext("2d");
      c2.drawImage(im, 0, 0);
      c2.globalCompositeOperation = "source-in";
      c2.fillStyle = "#fff3dd";
      c2.fillRect(0, 0, cv.width, cv.height);
      enemyTintCache.set(key, cv);
    }
    return cv;
  }

  /* Silueta de un color cualquiera (el filo rojo del jefe en berserk). A media
     resolución: sólo se usa como velo, nunca como dibujo. */
  const enemyColorSilCache = (typeof Map === "function") ? new Map() : null;

  function enemyColorSilhouette(im, color) {
    if (!enemyColorSilCache || !im || !im.naturalWidth || !color) return null;
    const key = (im.src || "") + "|" + color;
    let cv = enemyColorSilCache.get(key);
    if (cv === undefined) {
      cv = null;
      try {
        cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(im.naturalWidth / 2));
        cv.height = Math.max(1, Math.round(im.naturalHeight / 2));
        const c2 = cv.getContext("2d");
        c2.drawImage(im, 0, 0, cv.width, cv.height);
        c2.globalCompositeOperation = "source-in";
        c2.fillStyle = color;
        c2.fillRect(0, 0, cv.width, cv.height);
      } catch (e) { cv = null; }
      enemyColorSilCache.set(key, cv);
    }
    return cv;
  }

  /* Halo de separación. Las figuras oscuras (Seguridad, Sprinter) se perdían sobre
     los suelos oscuros de los círculos II en adelante: sólo quedaba el filo de luz
     del propio dibujo, de menos de 1 px en pantalla. Detrás de cada fotograma se
     pinta su silueta en claro, difuminada unos 5 px de mundo; sobre suelo claro
     apenas se nota y sobre suelo oscuro recorta la figura.
     Se construye una vez por imagen, a media resolución, estampando la silueta en
     tres anillos (la suma da una caída casi lineal: no depende de ctx.filter, que
     no todos los navegadores aplican al lienzo). */
  const ENEMY_HALO = { color: "#f1e6ff", alpha: 0.45, pad: 28, rings: [8, 16, 24], dirs: 16, stamp: 0.09, res: 0.5 };
  const enemyHaloCache = (typeof Map === "function") ? new Map() : null;

  function enemyHalo(im) {
    if (!enemyHaloCache || !im || !im.naturalWidth) return null;
    const key = im.src || im;
    let cv = enemyHaloCache.get(key);
    if (cv === undefined) {
      cv = null;
      try {
        const H = ENEMY_HALO;
        const k = H.res;
        const w = Math.ceil((im.naturalWidth + 2 * H.pad) * k);
        const h = Math.ceil((im.naturalHeight + 2 * H.pad) * k);
        const sil = document.createElement("canvas");
        sil.width = w; sil.height = h;
        const c1 = sil.getContext("2d");
        c1.drawImage(im, H.pad * k, H.pad * k, im.naturalWidth * k, im.naturalHeight * k);
        c1.globalCompositeOperation = "source-in";
        c1.fillStyle = H.color;
        c1.fillRect(0, 0, w, h);
        cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const c2 = cv.getContext("2d");
        c2.globalAlpha = H.stamp;
        for (const ring of H.rings) {
          for (let i = 0; i < H.dirs; i++) {
            const a = (i / H.dirs) * Math.PI * 2;
            c2.drawImage(sil, Math.cos(a) * ring * k, Math.sin(a) * ring * k);
          }
        }
      } catch (e) { cv = null; }
      enemyHaloCache.set(key, cv);
    }
    return cv;
  }

  /* El mismo halo, teñido (se recolorea el ya construido: conserva su caída). */
  const enemyHaloTintCache = (typeof Map === "function") ? new Map() : null;

  function enemyHaloTinted(im, color) {
    if (!enemyHaloTintCache || !color) return null;
    const base = enemyHalo(im);
    if (!base) return null;
    const key = (im.src || "") + "|" + color;
    let cv = enemyHaloTintCache.get(key);
    if (cv === undefined) {
      cv = null;
      try {
        cv = document.createElement("canvas");
        cv.width = base.width; cv.height = base.height;
        const c2 = cv.getContext("2d");
        c2.drawImage(base, 0, 0);
        c2.globalCompositeOperation = "source-in";
        c2.fillStyle = color;
        c2.fillRect(0, 0, cv.width, cv.height);
      } catch (e) { cv = null; }
      enemyHaloTintCache.set(key, cv);
    }
    return cv;
  }

  /* Borde superior real del dibujo dentro del lienzo (fracción del alto, 0 = arriba).
     Sirve para colocar la barra de vida y la marca por encima de las poses que
     superan la altura de referencia (el Tanque con los puños en alto mide un 40 %
     más que caminando): antes le cruzaban la cara. Se mide una vez por imagen, a un
     cuarto de resolución. */
  const enemyTopCache = (typeof Map === "function") ? new Map() : null;

  function enemyContentTop(im) {
    if (!enemyTopCache || !im || !im.naturalWidth) return 0;
    const key = im.src || im;
    let top = enemyTopCache.get(key);
    if (top === undefined) {
      top = 0;
      try {
        const w = Math.max(1, Math.round(im.naturalWidth / 4));
        const h = Math.max(1, Math.round(im.naturalHeight / 4));
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const c2 = cv.getContext("2d", { willReadFrequently: true });
        c2.drawImage(im, 0, 0, w, h);
        const px = c2.getImageData(0, 0, w, h).data;
        scan: for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (px[(y * w + x) * 4 + 3] > 48) { top = y / h; break scan; }
          }
        }
      } catch (e) { top = 0; }
      enemyTopCache.set(key, top);
    }
    return top;
  }

  /* Dibuja un fotograma con su pie en (0, 0) del contexto actual.
     `rim` (opcional): { color, alpha, tint } añade un halo de ese color sobre el de
     separación y un velo del mismo color sobre la figura (jefe en berserk). */
  function blitEnemyFrame(ctx, frame, figH, flash, haloAlpha, flashCap, rim) {
    const im = frame.im;
    const scale = figH / (frame.unit * im.naturalHeight);
    const w = im.naturalWidth * scale;
    const h = im.naturalHeight * scale;
    const x = -frame.foot[0] * w;
    const y = -frame.foot[1] * h;
    const halo = enemyHalo(im);
    if (halo) {
      const pad = ENEMY_HALO.pad * scale;
      const prev = ctx.globalAlpha;
      ctx.globalAlpha = prev * (typeof haloAlpha === "number" ? haloAlpha : ENEMY_HALO.alpha);
      ctx.drawImage(halo, x - pad, y - pad, w + 2 * pad, h + 2 * pad);
      if (rim && rim.color && rim.alpha > 0) {
        const hc = enemyHaloTinted(im, rim.color);
        if (hc) {
          ctx.globalAlpha = prev * Math.min(1, rim.alpha);
          ctx.drawImage(hc, x - pad, y - pad, w + 2 * pad, h + 2 * pad);
        }
      }
      ctx.globalAlpha = prev;
    }
    ctx.drawImage(im, x, y, w, h);
    if (rim && rim.color && rim.tint > 0) {
      const veil = enemyColorSilhouette(im, rim.color);
      if (veil) {
        const prev = ctx.globalAlpha;
        ctx.globalAlpha = prev * Math.min(0.6, rim.tint);
        ctx.drawImage(veil, x, y, w, h);
        ctx.globalAlpha = prev;
      }
    }
    if (flash > 0) {
      const tint = enemyWhiteSilhouette(im);
      if (tint) {
        const prev = ctx.globalAlpha;
        ctx.globalAlpha = prev * Math.min(typeof flashCap === "number" ? flashCap : 0.68, 6 * flash);
        ctx.drawImage(tint, x, y, w, h);
        ctx.globalAlpha = prev;
      }
    }
    return { w: w, h: h };
  }

  function drawEnemy(ctx, enemy, timeSec, view) {
    if (!enemy) return false;
    const geo = enemyGeometry(enemy, view);
    let state = (view && view.state) || "walk";
    if (!view) {
      if (enemy.st === "windup" || enemy.feinting) state = "windup";
      else if (enemy.st === "charge" || enemy.st === "dash") state = "attack";
    }
    const frame = resolveEnemyFrame(geo.family, state);
    if (!frame) return false;

    setSmooth(ctx);
    const t = Number(timeSec) || 0;
    const flip = view ? !!view.flip : false;
    const flash = view ? Math.max(0, Number(view.flash) || 0) : Math.max(0, Number(enemy.hitFlash) || 0);
    const frozen = view ? !!view.frozen : (enemy.freezeTimer > 0);

    // Cuánto sobresale este fotograma de la altura de referencia (px de mundo). Las
    // señales (barra de vida, marca) suben eso mismo, a la vez que cambia la pose;
    // nunca bajan de la altura de referencia.
    const lift = Math.max(0, (frame.foot[1] - enemyContentTop(frame.im)) * geo.figH / frame.unit - geo.figH);
    geo.topY = geo.footY - geo.figH - lift;

    // Velocidad real (px/s) medida entre dibujos: la zancada sólo se marca si se mueve.
    let speed = 0;
    if (enemyMotion) {
      const m = enemyMotion.get(enemy);
      if (m && t > m.t) {
        const inst = Math.hypot(enemy.x - m.x, enemy.y - m.y) / Math.max(1e-3, t - m.t);
        speed = m.spd + (Math.min(600, inst) - m.spd) * 0.35;
      } else if (m) {
        speed = m.spd;
      }
      enemyMotion.set(enemy, { x: enemy.x, y: enemy.y, t: t, spd: speed });
    }
    const moving = !frozen && speed > 14;
    const phase = (view && typeof view.phase === "number") ? view.phase : t * 8;
    const cyc = phase * (Math.PI / 2);          // una zancada completa cada 4 unidades de fase
    const k = geo.figH / 88;

    let bob = 0, tilt = 0, sx = 1, sy = 1;
    if (state === "walk" || state === "hit") {
      if (moving) {
        bob = -Math.abs(Math.sin(cyc)) * 2.6 * k;
        tilt = Math.sin(cyc) * 0.035;
      } else if (!frozen) {
        sy = 1 + Math.sin(t * 2.6 + (enemy.x || 0) * 0.05) * 0.012;   // respiración
      }
    }
    if (!frame.dedicated) {
      // Sin fotograma propio del estado: señal procedimental sobre el de caminar.
      if (state === "windup") { tilt = -0.15; sx = 1.04; sy = 0.96; }
      else if (state === "attack") { tilt = 0.2; sx = 0.97; sy = 1.04; bob = -2 * k; }
    }
    if (state === "hit") {
      const n = Math.min(1, flash / 0.12);
      tilt -= 0.1 * n;
      sx *= 1 + 0.05 * n;
      sy *= 1 - 0.07 * n;
    }

    drawSoftShadow(ctx, enemy.x, geo.footY, Math.max(geo.r * 1.35, geo.figH * 0.2), Math.max(5, geo.r * 0.5), 0.5);

    ctx.save();
    ctx.translate(enemy.x, geo.footY + bob);
    if (flip) ctx.scale(-1, 1);
    if (tilt) ctx.rotate(tilt);
    if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
    blitEnemyFrame(ctx, frame, geo.figH, flash, enemyHaloAlpha(geo.family));
    ctx.restore();

    if (frozen) {
      ctx.save();
      ctx.strokeStyle = "rgba(145, 240, 255, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(enemy.x, geo.footY - geo.figH * 0.5, geo.figH * 0.3, geo.figH * 0.56, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#91f0ff";
      ctx.fill();
      ctx.restore();
    }

    drawEnemyOverlays(ctx, enemy, view, geo, t);
    return true;
  }

  /* Señales de juego que el motor dibujaba junto al sprite y que deben seguir
     viéndose: marca de élite / guardián / minijefe, barra de vida y flecha de
     "último enemigo". (La señal de variante elemental la pinta el motor.) */
  function drawEnemyOverlays(ctx, enemy, view, geo, t) {
    const top = geo.topY;
    const marker = view ? view.marker : (enemy.mini ? "mini" : enemy.elite ? "elite" : enemy.guardian ? "guardian" : null);
    const hpAlways = view ? !!view.hpAlways : !!(enemy.elite || enemy.mini || enemy.type === "tank");
    const maxHp = Math.max(1, Number(enemy.maxHp) || 1);
    const pct = Math.max(0, Math.min(1, (Number(enemy.hp) || 0) / maxHp));
    let y = top - 7;

    if ((pct < 0.999 || hpAlways) && pct > 0) {
      const bw = marker === "mini" ? 68 : 40;
      ctx.save();
      ctx.fillStyle = "rgba(5, 2, 10, 0.88)";
      ctx.fillRect(enemy.x - bw / 2 - 1.5, y - 1.5, bw + 3, 7);
      ctx.fillStyle = "#3b1d33";
      ctx.fillRect(enemy.x - bw / 2, y, bw, 4);
      ctx.fillStyle = pct > 0.4 ? "#ff2d7a" : "#ffb020";
      ctx.fillRect(enemy.x - bw / 2, y, bw * pct, 4);
      ctx.restore();
      y -= 9;
    }

    if (marker) {
      const col = marker === "guardian" ? "#aff3e7" : marker === "mini" ? "#ffb020" : "#f6ca72";
      const s = marker === "mini" ? 6.5 : 4.5;
      ctx.save();
      ctx.translate(enemy.x, y - s);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "rgba(5, 2, 10, 0.9)";
      ctx.fillRect(-s - 1.5, -s - 1.5, 2 * s + 3, 2 * s + 3);
      ctx.fillStyle = col;
      ctx.fillRect(-s, -s, 2 * s, 2 * s);
      ctx.fillStyle = "rgba(5, 2, 10, 0.9)";
      ctx.fillRect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7);
      ctx.restore();
      y -= 2 * s + 6;
    }

    if (view && view.objective) {
      const b = Math.sin((t || 0) * 6) * 2.5;
      ctx.save();
      ctx.fillStyle = "#f7d77f";
      ctx.strokeStyle = "rgba(5, 2, 10, 0.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(enemy.x, y + b);
      ctx.lineTo(enemy.x - 6, y - 10 + b);
      ctx.lineTo(enemy.x + 6, y - 10 + b);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  /* Muerte: el motor guarda un registro breve por enemigo abatido
     ({x, y, r, key = familia, flip, age, duration}). Con fotograma `death` de la
     misma revisión se muestra ese fotograma (destello, retroceso y fundido); sin
     él, el de caminar se desploma hacia atrás y se desvanece. */
  function drawEnemyDeath(ctx, rec, timeSec) {
    if (!rec) return false;
    const family = rec.ddFamily || rec.key || "security";
    const frame = resolveEnemyFrame(family, "death");
    if (!frame) return false;
    setSmooth(ctx);
    const dur = Math.max(0.05, Number(rec.duration) || 0.38);
    const a = Math.max(0, Math.min(1, (Number(rec.age) || 0) / dur));
    const r = Math.max(6, Number(rec.r) || 12);
    const figH = enemyFigureHeight(family, r);
    const footY = (Number(rec.y) || 0) + r * ENEMY_FOOT_K;
    const flip = !!rec.flip;
    const back = (flip ? 1 : -1) * 14 * (1 - Math.pow(1 - a, 2)) * (figH / 88);   // retroceso, alejándose del jugador
    const fade = a < 0.55 ? 1 : Math.max(0, 1 - (a - 0.55) / 0.45);
    const flash = a < 0.18 ? (0.18 - a) * 0.9 : 0;

    drawSoftShadow(ctx, rec.x + back, footY, Math.max(r * 1.35, figH * 0.2), Math.max(5, r * 0.5), 0.5 * fade);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(rec.x + back, footY);
    if (flip) ctx.scale(-1, 1);
    if (frame.dedicated) {
      blitEnemyFrame(ctx, frame, figH, flash, enemyHaloAlpha(family));
    } else {
      const fall = Math.min(1, a / 0.6);
      const ease = 1 - Math.pow(1 - fall, 3);
      ctx.rotate(-1.32 * ease);
      ctx.scale(1, 1 - 0.12 * ease);
      blitEnemyFrame(ctx, frame, figH, flash, enemyHaloAlpha(family));
    }
    ctx.restore();
    return true;
  }

  /* ======================================================================
     JEFES (R03)
     El puente (ddBossView, en tools/build_active_html.py) traduce el jefe del
     motor a una vista y este módulo sólo dibuja:
       slug      boss_00_anden … boss_10_arquitecto
       state     idle | attack | recover | death
                 attack  = el motor avisa o ejecuta un patrón, o barre
                 recover = ventana expuesta tras disparar (fotograma `hit` cuando
                           exista; hasta entonces, el reposo algo vencido)
       flip      true = mira a la izquierda (siempre encara al protagonista)
       flash     destello blanco de impacto (s): no cambia de fotograma — un arma
                 automática lo tendría parpadeando entre dos poses
       entrance  0 → 1 durante la aparición        frozen, berserk

     Contrato de lienzo: el de los enemigos (anchors.foot, anchors.unit). Cada
     jefe es su propia familia: su `idle` fija la escala y los demás estados la
     comparten. El apoyo cae en (x, y + 0,8·r), donde lo ponía el sprite heredado.

     Nunca se mezclan dos generaciones de arte: un `attack`, `hit` o `death` de
     otra revisión que el `idle` no se dibuja; el estado se resuelve sobre el
     `idle` con una señal procedimental (empuje, vencimiento, colapso).
     ====================================================================== */
  const BOSS_BASE = {
    // h = alto de la figura de referencia (el `idle`: del tocado a los pies) en px de
    // mundo con el radio 34 que el motor da a los residentes. Un minijefe mide hasta
    // 190 y el protagonista 104: el residente tiene que imponerse a los dos.
    // halo = opacidad del halo de separación (más en las figuras negras).
    boss_00_anden: { h: 196, halo: 0.46 },
    boss_01_magneta: { h: 190, halo: 0.36 },
    boss_02_bufe: { h: 178, halo: 0.3 },
    boss_03_cajero: { h: 190, halo: 0.36 },
    boss_04_pogo: { h: 186, halo: 0.42 },
    boss_05_oficiante: { h: 194, halo: 0.34 },
    boss_06_matarife: { h: 188, halo: 0.36 },
    boss_07_imitador: { h: 192, halo: 0.46 },
    boss_08_traidor: { h: 200, halo: 0.34 },
    boss_09_nucleo: { h: 204, halo: 0.3 },
    boss_10_arquitecto: { h: 192, halo: 0.42 }
  };
  const BOSS_REF_R = 34;
  const BOSS_FOOT_K = 0.8;
  const BOSS_LEGACY_UNIT = 0.9;
  const BOSS_LEGACY_FOOT = [0.5, 0.97];
  const BOSS_STATE_ASSET = { idle: "idle", attack: "attack", recover: "hit", hit: "hit", death: "death" };
  const BOSS_FLASH_CAP = 0.36;            // un jefe encaja disparos sin parar: que el dibujo siga viéndose
  const bossMotion = (typeof WeakMap === "function") ? new WeakMap() : null;

  function resolveBossSlug(boss, circleIdx) {
    const res = String((boss && boss.resident) || "").toLowerCase();
    if ((boss && boss.secretBoss) || res === "arquitecto") return "boss_10_arquitecto";
    if (boss && boss.final) return "boss_09_nucleo";
    const raw = (res + " " + String((boss && (boss.id || boss.name || boss.key)) || "")).toLowerCase();
    if (raw.includes("arquitecto") || raw.includes("secret")) return "boss_10_arquitecto";
    if (raw.includes("nucleo") || raw.includes("núcleo")) return "boss_09_nucleo";
    if (raw.includes("traidor")) return "boss_08_traidor";
    if (raw.includes("imitador")) return "boss_07_imitador";
    if (raw.includes("matarife")) return "boss_06_matarife";
    if (raw.includes("oficiante")) return "boss_05_oficiante";
    if (raw.includes("pogo")) return "boss_04_pogo";
    if (raw.includes("cajero")) return "boss_03_cajero";
    if (raw.includes("bufe") || raw.includes("bufé")) return "boss_02_bufe";
    if (raw.includes("magneta")) return "boss_01_magneta";
    if (raw.includes("anden") || raw.includes("andén")) return "boss_00_anden";
    return BOSS_INDEX_TO_SLUG[Math.max(0, Math.min(9, Number(circleIdx) || 0))];
  }

  /* Elige el fotograma de (jefe, estado) sin mezclar revisiones de arte. */
  function resolveBossFrame(slug, state) {
    if (!window.DD_ASSETS) return null;
    const idleId = slug + "_idle";
    const idleIm = window.DD_ASSETS.get(idleId);
    if (!idleIm) return null;
    const idleEntry = enemyEntry(idleId) || {};
    const wanted = BOSS_STATE_ASSET[state] || "idle";
    let id = idleId;
    let im = idleIm;
    let entry = idleEntry;
    // El arte anterior no trae anclas y cada estado tiene otro lienzo: con él sólo se
    // usa el reposo (el estado se marca con la señal procedimental).
    if (wanted !== "idle" && idleEntry.anchors) {
      const sid = slug + "_" + wanted;
      const sim = window.DD_ASSETS.get(sid);
      const sentry = enemyEntry(sid) || {};
      if (sim && sentry.anchors && (sentry.rev || null) === (idleEntry.rev || null)) {
        id = sid; im = sim; entry = sentry;
      }
    }
    const an = entry.anchors || null;
    const foot = (an && Array.isArray(an.foot) && an.foot.length === 2) ? an.foot : BOSS_LEGACY_FOOT;
    const unit = (an && typeof an.unit === "number" && an.unit > 0.1 && an.unit <= 1.5) ? an.unit : BOSS_LEGACY_UNIT;
    return { id: id, im: im, foot: foot, unit: unit, dedicated: id !== idleId || wanted === "idle", rev: entry.rev || null };
  }

  function bossFigureHeight(slug, r) {
    const b = BOSS_BASE[slug] || BOSS_BASE.boss_00_anden;
    const k = Math.pow(Math.max(0.6, Math.min(2, (Number(r) || BOSS_REF_R) / BOSS_REF_R)), 0.75);
    return b.h * k;
  }

  function bossHaloAlpha(slug) {
    const b = BOSS_BASE[slug];
    return (b && typeof b.halo === "number") ? b.halo : ENEMY_HALO.alpha;
  }

  function bossGeometry(boss, view) {
    const slug = (view && view.slug) || resolveBossSlug(boss, view && view.circle);
    const r = Math.max(16, Number(boss && boss.r) || BOSS_REF_R);
    const figH = bossFigureHeight(slug, r);
    const footY = (Number(boss && boss.y) || 0) + r * BOSS_FOOT_K;
    return { slug: slug, r: r, figH: figH, footY: footY, topY: footY - figH };
  }

  /* ¿Hay arte para este jefe? El puente lo pregunta antes de pintar sus señales de
     suelo: si no lo hay, deja todo el dibujo al motor. */
  function canDrawBoss(slug) {
    return !!resolveBossFrame(slug, "idle");
  }

  function drawBoss(ctx, boss, view, timeSec) {
    if (!boss) return false;
    // Llamadas antiguas: (ctx, boss, índiceDeCírculo, t).
    if (view == null || typeof view !== "object") view = { circle: Number(view) || 0 };
    const geo = bossGeometry(boss, view);
    const state = view.state || "idle";
    const frame = resolveBossFrame(geo.slug, state);
    if (!frame) return false;

    setSmooth(ctx);
    const t = Number(timeSec) || 0;
    const flip = !!view.flip;
    const flash = Math.max(0, Number(view.flash != null ? view.flash : boss.hitFlash) || 0);
    const frozen = view.frozen != null ? !!view.frozen : (boss.freezeTimer > 0);
    const berserk = !!view.berserk;
    const ent = view.entrance == null ? 1 : Math.max(0, Math.min(1, Number(view.entrance) || 0));
    const alpha = 0.25 + 0.75 * ent;                // la aparición del motor: se funde y crece
    const grow = 0.78 + 0.22 * ent;
    const k = geo.figH / 190;

    // Cuánto sobresale este fotograma de la altura de referencia: la barra de vida sube eso.
    const lift = Math.max(0, (frame.foot[1] - enemyContentTop(frame.im)) * geo.figH / frame.unit - geo.figH);
    geo.topY = geo.footY - (geo.figH + lift) * grow;

    // Velocidad real entre dibujos: el balanceo sólo se marca si se desplaza.
    let speed = 0;
    if (bossMotion) {
      const m = bossMotion.get(boss);
      if (m && t > m.t) {
        const inst = Math.hypot(boss.x - m.x, boss.y - m.y) / Math.max(1e-3, t - m.t);
        speed = m.spd + (Math.min(600, inst) - m.spd) * 0.35;
      } else if (m) {
        speed = m.spd;
      }
      bossMotion.set(boss, { x: boss.x, y: boss.y, t: t, spd: speed });
    }
    const moving = !frozen && ent >= 1 && speed > 12;

    let bob = 0, tilt = 0, sx = 1, sy = 1;
    if (!frozen) {
      if (state === "attack") {
        if (frame.dedicated) {
          sy = 1 + Math.sin(t * 11) * 0.006;                      // tensión contenida
        } else {
          tilt = 0.07; sx = 1.045; sy = 0.965; bob = -2 * k;      // la señal del motor: se adelanta y se aplasta
        }
      } else if (moving) {
        const cyc = t * (berserk ? 7.6 : 5.2);
        bob = -Math.abs(Math.sin(cyc)) * 2.4 * k;
        tilt = Math.sin(cyc) * 0.016;
      } else {
        sy = 1 + Math.sin(t * 2.1 + (boss.x || 0) * 0.01) * 0.009;   // respiración
      }
      if (state === "recover" && !frame.dedicated) {
        tilt -= 0.05; sx *= 1.02; sy *= 0.975;                    // vencido: acaba de vaciarse
      }
    }
    const n = Math.min(1, flash / 0.12);
    if (n > 0) {
      tilt -= 0.03 * n;
      sx *= 1 + 0.025 * n;
      sy *= 1 - 0.035 * n;
    }

    // Aura del color del residente (roja y pulsante en berserk) y sombra de apoyo.
    const auraColor = berserk ? "#ff3b2f" : (view.color || boss.color || "#ff2d7a");
    const auraAlpha = (berserk ? 0.2 + 0.08 * Math.sin(t * 9) : 0.13) * alpha;
    drawNeonGlow(ctx, boss.x, geo.footY - geo.figH * 0.42, geo.figH * 0.66, auraColor, auraAlpha);
    drawSoftShadow(ctx, boss.x, geo.footY, Math.max(geo.r * 1.5, geo.figH * 0.25) * grow, Math.max(8, geo.r * 0.5) * grow, 0.62 * alpha);

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(boss.x, geo.footY + bob);
    if (grow !== 1) ctx.scale(grow, grow);
    if (flip) ctx.scale(-1, 1);
    if (tilt) ctx.rotate(tilt);
    if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
    // Destello de impacto: tope bajo y caída cuadrática. Con un arma automática el
    // motor reinicia hitFlash a cada bala; con caída lineal el jefe pasaba la pelea
    // entera velado de blanco y no se veía el dibujo.
    const flashDraw = BOSS_FLASH_CAP * n * n / 6;
    // Berserk (vida < 35 %): filo rojo que late. El aura de suelo no basta: sobre la
    // alfombra roja del Limbo no se distinguía del reposo.
    const pulse = 0.5 + 0.5 * Math.sin(t * 9);
    const rim = berserk ? { color: "#ff2a1f", alpha: 0.62 + 0.38 * pulse, tint: 0.07 + 0.09 * pulse } : null;
    blitEnemyFrame(ctx, frame, geo.figH, flashDraw, bossHaloAlpha(geo.slug), BOSS_FLASH_CAP, rim);
    ctx.restore();

    if (frozen) {
      ctx.save();
      ctx.strokeStyle = "rgba(145, 240, 255, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(boss.x, geo.footY - geo.figH * 0.5, geo.figH * 0.32, geo.figH * 0.56, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = "#91f0ff";
      ctx.fill();
      ctx.restore();
    }

    drawBossOverlays(ctx, boss, geo, alpha);
    return true;
  }

  /* Barra de vida del jefe. El motor la pintaba en y − r − 16, que con una figura de
     190 px cae a media altura del cuerpo: aquí va por encima del tope real del dibujo. */
  function drawBossOverlays(ctx, boss, geo, alpha) {
    const maxHp = Math.max(1, Number(boss.maxHp) || 1);
    const pct = Math.max(0, Math.min(1, (Number(boss.hp) || 0) / maxHp));
    if (pct <= 0) return;
    const bw = Math.max(72, geo.r * 2.7);
    const y = geo.topY - 12;
    ctx.save();
    ctx.globalAlpha *= (typeof alpha === "number" ? alpha : 1);
    ctx.fillStyle = "rgba(5, 2, 10, 0.88)";
    ctx.fillRect(boss.x - bw / 2 - 2, y - 2, bw + 4, 10);
    ctx.fillStyle = "#3b1d33";
    ctx.fillRect(boss.x - bw / 2, y, bw, 6);
    ctx.fillStyle = pct > 0.35 ? "#ff2d7a" : "#ffb020";      // 35 %: ahí entra en berserk
    ctx.fillRect(boss.x - bw / 2, y, bw * pct, 6);
    ctx.restore();
  }

  /* Muerte del jefe. El motor guarda un registro ({x, y, r, age, duration}); el puente
     le añade ddSlug y ddFlip. Con fotograma `death` de la misma revisión se muestra
     ese fotograma (destello y fundido); sin él, el reposo se hunde y se ensancha —el
     mismo colapso que hacía el motor con su sprite— y se desvanece. */
  function drawBossDeath(ctx, rec, timeSec) {
    if (!rec || !rec.ddSlug) return false;
    const slug = rec.ddSlug;
    const frame = resolveBossFrame(slug, "death");
    if (!frame) return false;
    setSmooth(ctx);
    const dur = Math.max(0.05, Number(rec.duration) || 0.48);
    const a = Math.max(0, Math.min(1, (Number(rec.age) || 0) / dur));
    const r = Math.max(16, Number(rec.r) || BOSS_REF_R);
    const figH = bossFigureHeight(slug, r);
    const footY = (Number(rec.y) || 0) + r * BOSS_FOOT_K;
    const flip = !!rec.ddFlip;
    const fade = a < 0.6 ? 1 : Math.max(0, 1 - (a - 0.6) / 0.4);
    // El destello ENTRA en rampa (pico a los 60 ms) en vez de empezar en su máximo: el
    // motor abre la elección de fin de ronda en el fotograma siguiente a la muerte del
    // último enemigo y congela la simulación; si el jefe era el último, su registro
    // se queda en el primer instante hasta que el jugador elige. Con el pico en t = 0
    // quedaba una silueta blanca plantada detrás del panel.
    const fl = a < 0.06 ? a / 0.06 : Math.max(0, 1 - (a - 0.06) / 0.24);
    const flash = fl * 0.62 / 6;
    const back = (flip ? 1 : -1) * 10 * (1 - Math.pow(1 - a, 2)) * (figH / 190);   // retroceso, alejándose del protagonista

    drawNeonGlow(ctx, rec.x, footY - figH * 0.42, figH * (0.66 + 0.5 * a), rec.color || "#ff2d7a", 0.2 * fade);
    drawSoftShadow(ctx, rec.x + back, footY, Math.max(r * 1.5, figH * 0.25), Math.max(8, r * 0.5), 0.62 * fade);
    ctx.save();
    ctx.globalAlpha *= fade;
    ctx.translate(rec.x + back, footY);
    if (flip) ctx.scale(-1, 1);
    if (!frame.dedicated) {
      const fall = Math.max(0, (a - 0.04) / 0.96);
      const ease = 1 - Math.pow(1 - fall, 2);
      ctx.rotate(-0.09 * ease);
      ctx.scale(1 + 0.16 * ease, Math.max(0.24, 1 - 0.62 * ease));
    }
    blitEnemyFrame(ctx, frame, figH, flash, bossHaloAlpha(slug), 0.62);
    ctx.restore();
    return true;
  }

  function drawPickup(ctx, p, timeSec) {
    if (!p) return false;
    const kind = String(p.kind || p.type || p.id || "credits").toLowerCase();
    let id = "pickup_credits_00";
    if (kind.includes("heart") || kind.includes("heal") || kind.includes("hp")) id = "pickup_heart_00";
    else if (kind.includes("ammo")) id = "pickup_ammo_00";
    else if (kind.includes("bomb")) id = "pickup_bomb_00";
    else if (kind.includes("boost")) id = "pickup_boost_00";
    else if (kind.includes("shield")) id = "pickup_shield_00";
    else if (kind.includes("damage")) id = "pickup_damageup_00";
    else if (kind.includes("fire") || kind.includes("rate")) id = "pickup_fireup_00";
    else if (kind.includes("speed")) id = "pickup_speedup_00";
    else if (kind.includes("turret")) id = "pickup_turret_00";
    else if (kind.includes("companion")) id = "pickup_companion_00";
    else if (kind.includes("mutat")) id = "pickup_mutation_00";
    else if (kind.includes("needle")) id = "relic_needle";
    else if (kind.includes("lowpass")) id = "relic_lowpass";
    else if (kind.includes("magnet")) id = "relic_magnet";
    else if (kind.includes("pact")) id = "relic_pact";
    else if (kind.includes("echo")) id = "relic_echo";
    else if (kind.includes("coil")) id = "relic_coil";
    else if (kind.includes("prism")) id = "relic_prism";
    else if (kind.includes("tempo")) id = "relic_tempo";
    else if (kind.includes("chest")) id = p.opened ? "prop_chest_open" : "prop_chest_closed";

    const im = window.DD_ASSETS && window.DD_ASSETS.get(id);
    if (!im) return false;

    setSmooth(ctx);
    const bob = Math.sin((timeSec || 0) * 4.5 + (p.x || 0) * 0.03) * 4;
    const sz = kind.includes("chest") ? 82 : 44;
    drawSoftShadow(ctx, p.x, p.y + 14, sz * 0.42, sz * 0.18, 0.5);
    drawNeonGlow(ctx, p.x, p.y + bob, sz * 0.85, "#22d3ee", 0.22);
    ctx.drawImage(im, p.x - sz / 2, p.y - sz / 2 + bob, sz, sz);
    return true;
  }

  function drawTurret(ctx, turret, timeSec) {
    if (!turret) return false;
    const im = window.DD_ASSETS && window.DD_ASSETS.get("companion_drone_ally");
    if (!im) return false;
    setSmooth(ctx);
    const hover = Math.sin((timeSec || 0) * 5.2 + (turret.x || 0)) * 4;
    drawSoftShadow(ctx, turret.x, turret.y + 20, 22, 9, 0.48);
    drawNeonGlow(ctx, turret.x, turret.y - 8 + hover, 42, "#22d3ee", 0.25);
    ctx.drawImage(im, turret.x - 30, turret.y - 42 + hover, 60, 60);
    return true;
  }

  function drawProjectiles(ctx, bullets, weaponCatalog) {
    if (!bullets || !bullets.length) return false;
    const slugImg = window.DD_ASSETS && window.DD_ASSETS.get("proj_slug");
    if (!slugImg) return false; // Use legacy Tt until Tanda 19 lands

    setSmooth(ctx);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      const ang = Math.atan2(b.vy || 0, b.vx || 1);
      let pid = "proj_slug";
      if (b.cryo || b.freeze) pid = "proj_cryo";
      else if (b.flame || b.burn) pid = "proj_flame";
      else if (b.rail || b.beam) pid = "proj_rail";
      else if (b.bounces > 0) pid = "proj_ricochet";
      else if (b.homing) pid = "proj_homing";
      else if (b.plasma || b.energy) pid = "proj_plasma";
      else if (b.heavy) pid = "proj_heavy";
      else if (b.pellet) pid = "proj_pellet";

      const im = (window.DD_ASSETS && window.DD_ASSETS.get(pid)) || slugImg;
      const len = Math.max(28, Math.min(68, (b.r || 5) * 6.5));
      const h = len * (im.naturalHeight / Math.max(1, im.naturalWidth));
      // El motor guarda en cada bala la altura del arma que la disparó (rigH: 56 px,
      // 38 px las de cadera) y la dibuja elevada esa altura: la lógica vuela a ras
      // de suelo, la imagen a la altura del cañón.
      const lift = (typeof b.rigH === "number" && isFinite(b.rigH)) ? b.rigH : 0;
      ctx.save();
      ctx.translate(b.x, b.y - lift);
      ctx.rotate(ang);
      ctx.drawImage(im, -len * 0.65, -h * 0.5, len, h);
      ctx.restore();
    }
    ctx.restore();
    return true;
  }

  function drawImpactParticles(ctx, particles) {
    if (!particles || !particles.length) return false;
    const spark = window.DD_ASSETS && window.DD_ASSETS.get("vfx_impact_spark");
    const plasma = window.DD_ASSETS && window.DD_ASSETS.get("vfx_impact_plasma");
    const expl = window.DD_ASSETS && window.DD_ASSETS.get("vfx_explosion_inferno");
    if (!spark && !plasma && !expl) return false;

    setSmooth(ctx);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const t = Math.max(0, Math.min(1, 1 - (p.life || 0) / Math.max(0.001, p.maxLife || 0.3)));
      const rad = Math.max(14, (p.r || 8) * 3.4);
      const im = rad > 56 && expl ? expl : ((i & 1) && plasma ? plasma : (spark || plasma || expl));
      ctx.globalAlpha = 0.85 * t;
      ctx.drawImage(im, p.x - rad / 2, p.y - rad / 2, rad, rad);
    }
    ctx.restore();
    return true;
  }

  window.DD_WORLD = Object.freeze({
    getCircleCfg,
    setSmooth,
    drawSoftShadow,
    drawNeonGlow,
    buildHighResRoomCache,
    drawDoor,
    drawDescentPad,
    drawProp,
    drawProtagonist,
    getPlayerWeaponMount,
    resolvePlayerPose,
    drawEnemy,
    drawEnemyDeath,
    enemyGeometry,
    resolveEnemyFrame,
    // Línea de apoyo en el suelo respecto al punto lógico (la usa el orden de profundidad).
    ENEMY_FOOT_K,
    PLAYER_GROUND_Y,
    drawBoss,
    drawBossDeath,
    canDrawBoss,
    bossGeometry,
    resolveBossFrame,
    BOSS_FOOT_K,
    drawPickup,
    drawTurret,
    drawProjectiles,
    drawImpactParticles,
    resolveBossSlug
  });
})();
