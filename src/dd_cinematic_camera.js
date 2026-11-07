/* ==========================================================================
   DEADBEAT DISCO — INTEGRATED CINEMATIC SYSTEM & CAMERA (window.DD_CINE)
   Implements Categories A..G (Intro, 7-Step Room Transition, Circle Descent,
   Boss Intro, Defeat, Victory, Special Events) + smooth camera pan/zoom.
   ========================================================================== */
(function () {
  "use strict";

  const CIRCLE_META = [
    { num: "0",   title: "EL REFUGIO · COLA DEL CLUB",   sub: "Tregua Sagrada · Zona Segura",           cine: "cine_circle_00_hub",      accent: "#ff2d7a" },
    { num: "I",   title: "CÍRCULO I · LUJURIA",          sub: "El Salón de los Deseos · 124 BPM",       cine: "cine_circle_01_lujuria",  accent: "#ff2d7a" },
    { num: "II",  title: "CÍRCULO II · GULA",            sub: "El Banquete Interminable · 128 BPM",     cine: "cine_circle_02_gula",     accent: "#f59e0b" },
    { num: "III", title: "CÍRCULO III · AVARICIA",       sub: "El Club VIP · 130 BPM",                  cine: "cine_circle_03_avaricia", accent: "#facc15" },
    { num: "IV",  title: "CÍRCULO IV · IRA",             sub: "La Pista de las Peleas · 136 BPM",       cine: "cine_circle_04_ira",      accent: "#ef4444" },
    { num: "V",   title: "CÍRCULO V · HEREJÍA",          sub: "La Catedral del Ruido · 138 BPM",        cine: "cine_circle_05_herejia",  accent: "#a855f7" },
    { num: "VI",  title: "CÍRCULO VI · VIOLENCIA",       sub: "El Matadero · 142 BPM",                  cine: "cine_circle_06_violencia",accent: "#fb7185" },
    { num: "VII", title: "CÍRCULO VII · FRAUDE",         sub: "El Club de los Espejos · 145 BPM",       cine: "cine_circle_07_fraude",   accent: "#22d3ee" },
    { num: "VIII",title: "CÍRCULO VIII · TRAICIÓN",      sub: "La Última Sala · 150 BPM",               cine: "cine_circle_08_traicion", accent: "#38bdf8" },
    { num: "IX",  title: "CÍRCULO IX · EL NÚCLEO FINAL", sub: "La Última Canción · 160 BPM",            cine: "cine_circle_09_nucleo",   accent: "#f8fafc" }
  ];

  let reducedMotion = false;
  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  const cam = {
    offX: 0,
    offY: 0,
    targetOffX: 0,
    targetOffY: 0,
    zoomMul: 1,
    targetZoomMul: 1
  };

  let activeSeq = null;
  const seen = {
    lastRoom: -1,
    lastCircle: -1,
    lastBossUid: "",
    wasDead: false,
    wasRave: false
  };

  function ensureLetterboxDOM() {
    let el = document.getElementById("dd-cine-overlay");
    if (el) return el;
    el = document.createElement("div");
    el.id = "dd-cine-overlay";
    el.innerHTML =
      '<div class="dd-letterbox-bar top"><span id="dd-cine-tag" style="color:#ff2d7a;font-weight:800;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">DEADBEAT DISCO</span><button class="dd-cine-skip" id="dd-cine-skip-btn" type="button">SALTAR [ESPACIO]</button></div>' +
      '<div class="dd-letterbox-bar bottom"><span id="dd-cine-sub" style="color:#cbd5e1;font-size:12px;letter-spacing:0.08em;"></span><span style="color:#22d3ee;font-size:11px;font-weight:700;">CINEMÁTICA EN TIEMPO REAL</span></div>';
    document.body.appendChild(el);
    document.getElementById("dd-cine-skip-btn").addEventListener("click", skip);
    return el;
  }

  function startSeq(seq) {
    const durScale = reducedMotion ? 0.45 : 1.0;
    seq.duration = Math.max(0.35, seq.duration * durScale);
    seq.elapsed = 0;
    activeSeq = seq;
    const dom = ensureLetterboxDOM();
    if (seq.letterbox !== false) {
      dom.classList.add("active");
      const tag = document.getElementById("dd-cine-tag");
      const sub = document.getElementById("dd-cine-sub");
      if (tag) tag.textContent = seq.tag || "DEADBEAT DISCO";
      if (sub) sub.textContent = seq.subtitle || "";
    } else {
      dom.classList.remove("active");
    }
  }

  function finishSeq() {
    if (!activeSeq) return;
    const cb = activeSeq.onComplete;
    activeSeq = null;
    cam.targetOffX = 0;
    cam.targetOffY = 0;
    cam.targetZoomMul = 1;
    const dom = document.getElementById("dd-cine-overlay");
    if (dom) dom.classList.remove("active");
    if (typeof cb === "function") {
      try { cb(); } catch (e) {}
    }
  }

  function skip() {
    if (activeSeq && activeSeq.skippable !== false) {
      finishSeq();
    }
  }

  /* A. GAME INTRO SEQUENCE */
  function playIntro(onComplete) {
    startSeq({
      type: "intro",
      tag: "PRÓLOGO · DESCENSO AL CLUB",
      subtitle: "DESCENSO · MÚSICA · CAOS · REDENCIÓN",
      duration: 4.4,
      blocking: true,
      skippable: true,
      letterbox: true,
      onComplete
    });
  }

  /* B. 7-STEP ROOM / PHASE TRANSITION */
  function playRoomTransition(roomIndex, roomTitle) {
    if (activeSeq && activeSeq.blocking) return;
    startSeq({
      type: "room",
      tag: roomTitle || ("SALA " + (roomIndex + 1)),
      subtitle: "Umbral cruzado · Reposicionando pista",
      roomTitle: roomTitle || ("SALA " + (roomIndex + 1)),
      duration: 1.15,
      blocking: false,
      skippable: true,
      letterbox: false
    });
  }

  /* C. CIRCLE DESCENT TRANSITION */
  function playCircleDescent(circleIdx, onComplete) {
    const meta = CIRCLE_META[Math.max(0, Math.min(9, circleIdx || 0))];
    startSeq({
      type: "circle",
      circleIdx: Math.max(0, Math.min(9, circleIdx || 0)),
      meta,
      tag: meta.title,
      subtitle: meta.sub,
      duration: 2.9,
      blocking: true,
      skippable: true,
      letterbox: true,
      onComplete
    });
  }

  /* D. BOSS INTRODUCTION */
  function playBossIntro(bossObj, circleIdx) {
    const slug = window.DD_WORLD ? window.DD_WORLD.resolveBossSlug(bossObj, circleIdx) : "boss_01_magneta";
    const bName = (bossObj && (bossObj.name || bossObj.title)) || "RESIDENTE DEL CÍRCULO";
    const bRule = (bossObj && (bossObj.rule || bossObj.subtitle)) || "Anfitrión de la Cámara · Duelo a Muerte";
    startSeq({
      type: "boss",
      boss: bossObj,
      slug,
      title: String(bName).toUpperCase(),
      subtitle: bRule,
      tag: "AMENAZA RESIDENTE · " + String(bName).toUpperCase(),
      duration: 2.5,
      blocking: false,
      skippable: true,
      letterbox: true
    });
  }

  /* E. DEATH / DEFEAT */
  function playDefeat() {
    startSeq({
      type: "defeat",
      tag: "SEÑAL PERDIDA · PISTA CERRADA",
      subtitle: "El bajo sigue sonando en la oscuridad...",
      duration: 2.1,
      blocking: false,
      skippable: true,
      letterbox: true
    });
  }

  /* F. VICTORY (BOSS / FINAL) */
  function playVictory(title, isFinal) {
    startSeq({
      type: "victory",
      isFinal: !!isFinal,
      title: title || (isFinal ? "REDENCIÓN EN EL NÚCLEO" : "RESIDENTE DERROTADO"),
      tag: isFinal ? "FINAL · LA ÚLTIMA CANCIÓN COMPLETADA" : "CÁMARA DESPEJADA",
      subtitle: isFinal ? "Has quebrado el bucle de los Nueve Círculos" : "Portal de descenso desbloqueado",
      duration: isFinal ? 4.2 : 2.2,
      blocking: false,
      skippable: true,
      letterbox: true
    });
  }

  /* G. SPECIAL EVENTS */
  function playSpecialEvent(title, subtitle) {
    if (activeSeq) return;
    startSeq({
      type: "special",
      title: title || "SOBRECARGA RAVE",
      subtitle: subtitle || "El DJ-Director altera el pulso de la sala",
      duration: 1.05,
      blocking: false,
      skippable: true,
      letterbox: false
    });
  }

  function update(dt, engineSnap) {
    const cdt = Math.min(0.05, Math.max(0.001, dt || 0.016));

    // Observe real engine events automatically
    if (engineSnap && engineSnap.running) {
      if (seen.lastCircle !== engineSnap.circle && engineSnap.circle >= 0) {
        const prevC = seen.lastCircle;
        seen.lastCircle = engineSnap.circle;
        seen.lastRoom = engineSnap.room;
        if (prevC !== -1 && engineSnap.circle !== prevC) {
          playCircleDescent(engineSnap.circle);
        }
      } else if (seen.lastRoom !== engineSnap.room && engineSnap.room >= 0) {
        const prevR = seen.lastRoom;
        seen.lastRoom = engineSnap.room;
        if (prevR !== -1) {
          playRoomTransition(engineSnap.room, engineSnap.roomName);
        }
      }

      if (engineSnap.bossActive && engineSnap.boss) {
        const uid = (engineSnap.boss.id || engineSnap.boss.name || "boss") + ":" + engineSnap.room;
        if (uid !== seen.lastBossUid) {
          seen.lastBossUid = uid;
          playBossIntro(engineSnap.boss, engineSnap.circle);
        }
      }

      if (engineSnap.dead && !seen.wasDead) {
        seen.wasDead = true;
        playDefeat();
      } else if (!engineSnap.dead) {
        seen.wasDead = false;
      }

      if (engineSnap.rave > 0 && !seen.wasRave) {
        seen.wasRave = true;
        playSpecialEvent("MODO RAVE ACTIVADO", "Cadencia y velocidad desatadas en toda la pista");
      } else if (!(engineSnap.rave > 0)) {
        seen.wasRave = false;
      }
    }

    // Advance active cinematic & compute camera targets
    if (activeSeq) {
      activeSeq.elapsed += cdt;
      const p = Math.min(1, activeSeq.elapsed / activeSeq.duration);

      if (activeSeq.type === "room") {
        // Smooth zoom-in through doorway then settle into new room
        cam.targetZoomMul = 1 + Math.sin(p * Math.PI) * (reducedMotion ? 0.04 : 0.12);
        cam.targetOffX = 0;
        cam.targetOffY = (1 - p) * -28;
      } else if (activeSeq.type === "boss" && activeSeq.boss && engineSnap && engineSnap.player) {
        const blend = p < 0.22 ? (p / 0.22) : (p > 0.78 ? (1 - p) / 0.22 : 1);
        const sm = 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, blend)));
        cam.targetOffX = ((activeSeq.boss.x || 0) - (engineSnap.player.x || 0)) * 0.65 * sm;
        cam.targetOffY = ((activeSeq.boss.y || 0) - (engineSnap.player.y || 0)) * 0.65 * sm;
        cam.targetZoomMul = 1 + 0.15 * sm;
      } else if (activeSeq.type === "defeat") {
        cam.targetZoomMul = 1 + 0.18 * p;
      } else {
        cam.targetOffX = 0;
        cam.targetOffY = 0;
        cam.targetZoomMul = 1;
      }

      if (activeSeq.elapsed >= activeSeq.duration) {
        finishSeq();
      }
    } else {
      cam.targetOffX = 0;
      cam.targetOffY = 0;
      cam.targetZoomMul = 1;
    }

    // Smooth critically-damped camera interpolation
    const k = Math.min(1, cdt * 9.5);
    cam.offX += (cam.targetOffX - cam.offX) * k;
    cam.offY += (cam.targetOffY - cam.offY) * k;
    cam.zoomMul += (cam.targetZoomMul - cam.zoomMul) * k;
  }

  function renderOverlay(ctx, viewW, viewH) {
    if (!activeSeq) return;
    const p = Math.max(0, Math.min(1, activeSeq.elapsed / activeSeq.duration));
    ctx.save();
    ctx.imageSmoothingEnabled = true;

    if (activeSeq.type === "intro") {
      ctx.fillStyle = "#06030d";
      ctx.fillRect(0, 0, viewW, viewH);

      const pano = (window.DD_ASSETS && window.DD_ASSETS.get("cine_intro_club_panorama")) ||
                   (window.DD_ASSETS && window.DD_ASSETS.get("menu_main_backdrop"));
      const logo = window.DD_ASSETS && window.DD_ASSETS.get("logo_deadbeat_graffiti");
      const emblem = window.DD_ASSETS && window.DD_ASSETS.get("emblem_fox_crown");

      if (pano) {
        const panScale = 1.04 + 0.06 * p;
        const dw = viewW * panScale;
        const dh = viewH * panScale;
        ctx.globalAlpha = Math.min(1, p * 2.2);
        ctx.drawImage(pano, (viewW - dw) * 0.5 - p * 24, (viewH - dh) * 0.5, dw, dh);
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(6, 3, 14, 0.48)";
      ctx.fillRect(0, 0, viewW, viewH);

      if (p < 0.52 && logo) {
        const lw = Math.min(460, viewW * 0.42);
        const lh = lw * (logo.naturalHeight / Math.max(1, logo.naturalWidth));
        ctx.drawImage(logo, (viewW - lw) * 0.5, (viewH - lh) * 0.44, lw, lh);
      } else if (emblem) {
        ctx.drawImage(emblem, viewW * 0.5 - 64, viewH * 0.28 - 64, 128, 128);
      }

      ctx.fillStyle = "#f8fafc";
      ctx.font = "900 28px Impact, Oswald, sans-serif";
      ctx.textAlign = "center";
      const caption = p < 0.35
        ? "LA MÚSICA NUNCA SE DETIENE EN LOS NUEVE CÍRCULOS"
        : (p < 0.72 ? "CADA PISO TIENE SU PROPIO RESIDENTE" : "BIENVENIDO AL REFUGIO · PREPARA EL DESCENSO");
      ctx.fillText(caption, viewW * 0.5, viewH * 0.76);
    } else if (activeSeq.type === "circle") {
      const fade = p < 0.15 ? (p / 0.15) : (p > 0.82 ? (1 - p) / 0.18 : 1);
      ctx.globalAlpha = Math.max(0, Math.min(1, fade));
      ctx.fillStyle = "rgba(5, 2, 11, 0.92)";
      ctx.fillRect(0, 0, viewW, viewH);

      const meta = activeSeq.meta;
      const backdrop = (window.DD_ASSETS && window.DD_ASSETS.get(meta.cine)) ||
                       (window.DD_ASSETS && window.DD_ASSETS.get("cine_intro_club_panorama"));
      const tower = window.DD_ASSETS && window.DD_ASSETS.get("map_infernal_tower");

      if (backdrop) {
        const s = 1.02 + 0.05 * p;
        ctx.globalAlpha = fade * 0.65;
        ctx.drawImage(backdrop, (viewW * (1 - s)) * 0.5, (viewH * (1 - s)) * 0.5, viewW * s, viewH * s);
      }
      ctx.globalAlpha = fade;
      if (tower) {
        const th = Math.min(340, viewH * 0.52);
        const tw = th * (tower.naturalWidth / Math.max(1, tower.naturalHeight));
        ctx.drawImage(tower, viewW * 0.18 - tw * 0.5, (viewH - th) * 0.5, tw, th);
      }

      ctx.textAlign = "left";
      ctx.fillStyle = meta.accent;
      ctx.font = "900 18px Inter, sans-serif";
      ctx.fillText("DESCENSO INFERNAL · CÍRCULO " + meta.num, viewW * 0.34, viewH * 0.44);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 44px Impact, Oswald, sans-serif";
      ctx.fillText(meta.title, viewW * 0.34, viewH * 0.53);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 18px Inter, sans-serif";
      ctx.fillText(meta.sub, viewW * 0.34, viewH * 0.60);
    } else if (activeSeq.type === "room") {
      // Crisp diagonal neon club wipe + room title card
      const wipe = Math.sin(p * Math.PI);
      ctx.globalAlpha = wipe * 0.38;
      const grad = ctx.createLinearGradient(0, 0, viewW, viewH);
      grad.addColorStop(0, "rgba(255, 45, 122, 0.55)");
      grad.addColorStop(0.5, "rgba(8, 4, 16, 0.85)");
      grad.addColorStop(1, "rgba(34, 211, 238, 0.45)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.globalAlpha = wipe;
      ctx.fillStyle = "rgba(8, 4, 16, 0.9)";
      ctx.strokeStyle = "#ff2d7a";
      ctx.lineWidth = 2;
      const cw = 380, ch = 54;
      ctx.fillRect((viewW - cw) * 0.5, viewH * 0.14, cw, ch);
      ctx.strokeRect((viewW - cw) * 0.5, viewH * 0.14, cw, ch);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 18px Impact, Oswald, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(activeSeq.roomTitle, viewW * 0.5, viewH * 0.14 + 34);
    } else if (activeSeq.type === "boss") {
      const alpha = p < 0.15 ? (p / 0.15) : (p > 0.85 ? (1 - p) / 0.15 : 1);
      ctx.globalAlpha = alpha;
      const bImg = window.DD_ASSETS && window.DD_ASSETS.get(activeSeq.slug + "_idle");
      if (bImg) {
        const bh = Math.min(340, viewH * 0.52);
        const bw = bh * (bImg.naturalWidth / Math.max(1, bImg.naturalHeight));
        ctx.drawImage(bImg, viewW * 0.74 - bw * 0.5, viewH * 0.52 - bh * 0.5, bw, bh);
      }
      ctx.fillStyle = "rgba(9, 4, 18, 0.92)";
      ctx.strokeStyle = "#ff2d7a";
      ctx.lineWidth = 3;
      ctx.fillRect(viewW * 0.08, viewH * 0.64, Math.min(540, viewW * 0.52), 104);
      ctx.strokeRect(viewW * 0.08, viewH * 0.64, Math.min(540, viewW * 0.52), 104);
      ctx.textAlign = "left";
      ctx.fillStyle = "#facc15";
      ctx.font = "900 32px Impact, Oswald, sans-serif";
      ctx.fillText(activeSeq.title, viewW * 0.10, viewH * 0.64 + 46);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 15px Inter, sans-serif";
      ctx.fillText(activeSeq.subtitle, viewW * 0.10, viewH * 0.64 + 78);
    } else if (activeSeq.type === "defeat" || activeSeq.type === "victory") {
      const isVic = activeSeq.type === "victory";
      const emb = window.DD_ASSETS && window.DD_ASSETS.get(isVic ? "ui_victory_emblem" : "ui_defeat_emblem");
      ctx.globalAlpha = Math.min(0.88, p * 1.4);
      ctx.fillStyle = isVic ? "rgba(12, 6, 24, 0.65)" : "rgba(18, 2, 10, 0.72)";
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.globalAlpha = 1;
      if (emb) {
        ctx.drawImage(emb, viewW * 0.5 - 140, viewH * 0.34 - 105, 280, 210);
      }
      ctx.textAlign = "center";
      ctx.fillStyle = isVic ? "#facc15" : "#ff2d7a";
      ctx.font = "900 40px Impact, Oswald, sans-serif";
      ctx.fillText(activeSeq.title || (isVic ? "VICTORIA" : "HAS CAÍDO EN LA PISTA"), viewW * 0.5, viewH * 0.64);
    } else if (activeSeq.type === "special") {
      const a = Math.sin(p * Math.PI);
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(12, 5, 24, 0.88)";
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.fillRect(viewW * 0.5 - 220, 86, 440, 56);
      ctx.strokeRect(viewW * 0.5 - 220, 86, 440, 56);
      ctx.textAlign = "center";
      ctx.fillStyle = "#22d3ee";
      ctx.font = "900 18px Impact, Oswald, sans-serif";
      ctx.fillText(activeSeq.title, viewW * 0.5, 112);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 12px Inter, sans-serif";
      ctx.fillText(activeSeq.subtitle, viewW * 0.5, 131);
    }

    ctx.restore();
  }

  window.addEventListener("keydown", function (ev) {
    if (!activeSeq) return;
    if (ev.code === "Space" || ev.code === "Escape" || ev.code === "Enter") {
      if (activeSeq.blocking) {
        ev.preventDefault();
        skip();
      }
    }
  });

  window.DD_CINE = Object.freeze({
    playIntro,
    playRoomTransition,
    playCircleDescent,
    playBossIntro,
    playDefeat,
    playVictory,
    playSpecialEvent,
    skip,
    update,
    renderOverlay,
    getCamera: function () { return cam; },
    isBlocking: function () { return !!(activeSeq && activeSeq.blocking); },
    getState: function () {
      return activeSeq ? { type: activeSeq.type, elapsed: +activeSeq.elapsed.toFixed(2), duration: +activeSeq.duration.toFixed(2) } : null;
    }
  });
})();
