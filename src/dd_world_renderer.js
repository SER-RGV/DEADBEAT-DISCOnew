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
    const wallH = 148;
    const modW = 128;

    // North wall backdrop band above ry
    const nwGrad = ctx.createLinearGradient(0, ry - wallH, 0, ry + 8);
    nwGrad.addColorStop(0, "#070310");
    nwGrad.addColorStop(0.85, "#120922");
    nwGrad.addColorStop(1, "#05020a");
    ctx.fillStyle = nwGrad;
    ctx.fillRect(rx - 18, ry - wallH, rw + 36, wallH + 8);

    if (wallImg) {
      for (let wx = rx; wx < rx + rw; wx += modW) {
        const segW = Math.min(modW, rx + rw - wx);
        ctx.drawImage(wallImg, 0, 0, wallImg.naturalWidth * (segW / modW), wallImg.naturalHeight, wx, ry - wallH + 4, segW, wallH);
      }
    } else {
      // Clean dark-ink architectural arches even before Tanda 03 lands
      ctx.strokeStyle = cfg.neon;
      ctx.lineWidth = 2;
      for (let wx = rx + 16; wx < rx + rw - 48; wx += 128) {
        ctx.fillStyle = "rgba(8, 4, 16, 0.92)";
        ctx.fillRect(wx, ry - wallH + 18, 96, wallH - 24);
        ctx.strokeRect(wx, ry - wallH + 18, 96, wallH - 24);
      }
    }

    // Architectural pilasters every 384px + room corners
    if (pillarImg) {
      for (let px = rx - 16; px <= rx + rw - 16; px += 384) {
        ctx.drawImage(pillarImg, px, ry - wallH - 8, 52, wallH + 18);
      }
      ctx.drawImage(pillarImg, rx + rw - 36, ry - wallH - 8, 52, wallH + 18);
    }

    // Signature neon wall emblem at upper facade flanks
    if (foxNeonImg && rw >= 900) {
      ctx.drawImage(foxNeonImg, rx + 96, ry - wallH + 12, 84, 112);
      ctx.drawImage(foxNeonImg, rx + rw - 180, ry - wallH + 12, 84, 112);
      drawNeonGlow(ctx, rx + 138, ry - wallH + 68, 120, "#ff2d7a", 0.24);
      drawNeonGlow(ctx, rx + rw - 138, ry - wallH + 68, 120, "#ff2d7a", 0.24);
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

  function drawProtagonist(ctx, player, pAnim, drawWeaponLayerFn, shieldVal, raveTimer) {
    if (!player) return false;
    const upperId = PLAYER_POSE_TO_ID[(pAnim && pAnim.upperPose) || "player_idle"] || "player_idle_00";
    const lowerId = PLAYER_POSE_TO_ID[(pAnim && pAnim.lowerPose) || "player_idle"] || "player_idle_00";
    const upperImg = window.DD_ASSETS && window.DD_ASSETS.get(upperId);
    const lowerImg = (window.DD_ASSETS && window.DD_ASSETS.get(lowerId)) || upperImg;
    if (!upperImg) return false; // Falls back cleanly to v3.2 Pf until Tanda 09 lands!

    setSmooth(ctx);
    const px = player.x;
    const py = player.y;
    const aimA = (pAnim && pAnim.forcedAimAngle !== null && pAnim.forcedAimAngle !== undefined)
      ? pAnim.forcedAimAngle
      : (player.aimAngle || 0);
    const facingLeft = Math.cos(aimA) < 0;
    const bobY = (pAnim && pAnim.bobY) || 0;
    const lean = (pAnim && pAnim.turnLean) || 0;

    drawSoftShadow(ctx, px, py + 28, 34, 14, 0.62);
    if (raveTimer > 0) {
      drawNeonGlow(ctx, px, py - 18, 78, "#ff2d7a", 0.35);
    }

    ctx.save();
    ctx.translate(px, py + bobY);

    if (typeof drawWeaponLayerFn === "function") {
      ctx.save();
      drawWeaponLayerFn("back", ctx);
      ctx.restore();
    }

    ctx.save();
    if (facingLeft) ctx.scale(-1, 1);
    ctx.rotate(lean * (facingLeft ? -0.55 : 0.55));

    const targetH = upperId === "player_death_00" ? 56 : (upperId === "player_roll_00" ? 84 : 104);
    const targetW = targetH * (upperImg.naturalWidth / Math.max(1, upperImg.naturalHeight));
    const drawX = -targetW * 0.5;
    const drawY = -targetH + 32;

    if (pAnim && pAnim.waistSplitActive && lowerImg && lowerImg !== upperImg) {
      const splitRatio = 0.54;
      // Draw animated legs (bottom 46%)
      ctx.drawImage(
        lowerImg,
        0, lowerImg.naturalHeight * splitRatio, lowerImg.naturalWidth, lowerImg.naturalHeight * (1 - splitRatio),
        drawX, drawY + targetH * splitRatio, targetW, targetH * (1 - splitRatio)
      );
      // Draw aiming/firing upper torso (top 56% with 2% overlap seam)
      ctx.drawImage(
        upperImg,
        0, 0, upperImg.naturalWidth, upperImg.naturalHeight * (splitRatio + 0.02),
        drawX, drawY, targetW, targetH * (splitRatio + 0.02)
      );
    } else {
      ctx.drawImage(upperImg, drawX, drawY, targetW, targetH);
    }
    ctx.restore();

    if (typeof drawWeaponLayerFn === "function") {
      ctx.save();
      drawWeaponLayerFn("front", ctx);
      ctx.restore();
    }

    if (shieldVal > 0) {
      ctx.strokeStyle = "rgba(34, 211, 238, 0.62)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, -14, 34, 48, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
    return true;
  }

  function resolveEnemyFamily(e) {
    const raw = String((e && (e.artFamily || e.family || e.type || e.kind)) || "").toLowerCase();
    if (raw.includes("chef") || raw.includes("tank") || raw.includes("brute") || raw.includes("gula")) return "chef";
    if (raw.includes("fanatic") || raw.includes("rush") || raw.includes("runner") || raw.includes("cult")) return "fanatic";
    if (raw.includes("dancer") || raw.includes("lust") || raw.includes("siren") || raw.includes("assassin")) return "dancer";
    if (raw.includes("drone") || raw.includes("turret") || raw.includes("fly") || raw.includes("ranged")) return "drone";
    if (raw.includes("elite") || raw.includes("guard") || raw.includes("royal") || (e && e.elite)) return "elite";
    return "security";
  }

  function drawEnemy(ctx, enemy, timeSec) {
    if (!enemy) return false;
    const fam = resolveEnemyFamily(enemy);
    let state = "walk";
    if (enemy.attackT > 0 || enemy.firingT > 0) state = "attack";
    else if (enemy.windupT > 0 || enemy.telegraphT > 0) state = "windup";
    else if (enemy.hurtT > 0.05) state = "death";

    const im =
      (window.DD_ASSETS && window.DD_ASSETS.get("enemy_" + fam + "_" + state)) ||
      (window.DD_ASSETS && window.DD_ASSETS.get("enemy_" + fam + "_walk"));
    if (!im) return false;

    setSmooth(ctx);
    const r = Math.max(18, Number(enemy.r || 24));
    const h = Math.max(78, r * 3.8);
    const w = h * (im.naturalWidth / Math.max(1, im.naturalHeight));
    const spd = Math.hypot(enemy.vx || 0, enemy.vy || 0);
    const strideBob = spd > 10 ? Math.sin((timeSec || 0) * 12 + (enemy.id || 0)) * 3.5 : Math.sin((timeSec || 0) * 3.2) * 1.4;
    const strideTilt = spd > 10 ? Math.cos((timeSec || 0) * 12 + (enemy.id || 0)) * 0.055 : 0;
    const facingLeft = (enemy.vx || 0) < -4 || (enemy.facing && enemy.facing < 0);

    drawSoftShadow(ctx, enemy.x, enemy.y + r * 0.85, r * 1.25, r * 0.52, 0.55);

    ctx.save();
    ctx.translate(enemy.x, enemy.y + strideBob);
    if (facingLeft) ctx.scale(-1, 1);
    ctx.rotate(strideTilt);
    ctx.drawImage(im, -w / 2, -h + r * 0.9, w, h);
    ctx.restore();

    // Crisp enemy HP micro-bar when damaged
    if (enemy.hp < enemy.maxHp && enemy.hp > 0) {
      const pct = Math.max(0, Math.min(1, enemy.hp / Math.max(1, enemy.maxHp)));
      const bw = 42;
      ctx.fillStyle = "rgba(5, 2, 10, 0.85)";
      ctx.fillRect(enemy.x - bw / 2, enemy.y - h + r * 0.65, bw, 5);
      ctx.fillStyle = "#ff2d7a";
      ctx.fillRect(enemy.x - bw / 2 + 1, enemy.y - h + r * 0.65 + 1, (bw - 2) * pct, 3);
    }
    return true;
  }

  function resolveBossSlug(boss, circleIdx) {
    const raw = String((boss && (boss.id || boss.name || boss.key)) || "").toLowerCase();
    if (raw.includes("arquitecto") || raw.includes("secret")) return "boss_10_arquitecto";
    if (raw.includes("nucleo") || raw.includes("final")) return "boss_09_nucleo";
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

  function drawBoss(ctx, boss, circleIdx, timeSec) {
    if (!boss) return false;
    const slug = resolveBossSlug(boss, circleIdx);
    let state = "idle";
    if (boss.hurtT > 0.06) state = "hit";
    else if (boss.attackT > 0 || boss.castT > 0 || boss.dashT > 0 || boss.phaseT > 0) state = "attack";

    const im =
      (window.DD_ASSETS && window.DD_ASSETS.get(slug + "_" + state)) ||
      (window.DD_ASSETS && window.DD_ASSETS.get(slug + "_idle"));
    if (!im) return false;

    setSmooth(ctx);
    const r = Math.max(38, Number(boss.r || 52));
    const h = Math.max(176, r * 3.45);
    const w = h * (im.naturalWidth / Math.max(1, im.naturalHeight));
    const hover = Math.sin((timeSec || 0) * 2.8) * 4.5;
    const facingLeft = (boss.vx || 0) < -8;

    drawNeonGlow(ctx, boss.x, boss.y - h * 0.32, r * 2.5, "#ff2d7a", 0.28);
    drawSoftShadow(ctx, boss.x, boss.y + r * 0.78, r * 1.45, r * 0.56, 0.68);

    ctx.save();
    ctx.translate(boss.x, boss.y + hover);
    if (facingLeft) ctx.scale(-1, 1);
    ctx.drawImage(im, -w / 2, -h + r * 0.82, w, h);
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
      ctx.save();
      ctx.translate(b.x, b.y);
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
    drawEnemy,
    drawBoss,
    drawPickup,
    drawTurret,
    drawProjectiles,
    drawImpactParticles,
    resolveBossSlug
  });
})();
