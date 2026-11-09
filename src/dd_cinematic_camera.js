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
    // La intro tiene marcas de plano absolutas: acortarla la cortaría en el plano 05.
    // Mantener sus diez planos; el movimiento reducido sigue limitando la cámara.
    const durScale = reducedMotion && seq.type !== "intro" ? 0.45 : 1.0;
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

  function finishSeq(reason) {
    if (!activeSeq) return;
    const cb = activeSeq.onComplete;
    activeSeq = null;
    cam.targetOffX = 0;
    cam.targetOffY = 0;
    cam.targetZoomMul = 1;
    const dom = document.getElementById("dd-cine-overlay");
    if (dom) dom.classList.remove("active");
    if (typeof cb === "function") {
      try { cb(reason || "complete"); } catch (e) {}
    }
  }

  function skip() {
    if (activeSeq && activeSeq.skippable !== false) {
      finishSeq("skip");
    }
  }

  /* A. GAME INTRO SEQUENCE — presentación con sprites reales del protagonista */
  /* A. GAME INTRO SEQUENCE — Diez Planos Cinematográficos Completos (~35s)
     Sincronización rítmica 128 BPM (1 beat = 0.46875s).
     Transición continua 2.5D de los 6 fondos oficiales y entrega seamless al HUB. */
  function playIntro(onComplete) {
    startSeq({
      type: "intro",
      tag: "DEADBEAT DISCO · PRÓLOGO",
      subtitle: "DIEZ PLANOS · SEIS ESCENARIOS · DESCENSO AL CLUB",
      duration: 35.0,
      blocking: true,
      skippable: true,
      letterbox: true,
      onComplete: function (reason) {
        // Al terminar o saltar la intro, se asegura la transición y foco directo en el HUB real r0
        if (window.DD_HUB && typeof window.DD_HUB.enter === "function" &&
            !(typeof window.DD_HUB.isActive === "function" && window.DD_HUB.isActive())) {
          try { window.DD_HUB.enter(); } catch (e) {}
        }
        if (typeof onComplete === "function") {
          try { onComplete(reason); } catch (e) {}
        }
      }
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

  function update(dt, engineSnap, renderDt) {
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
      // Solo la intro usa el tiempo entre renders, no el dt de simulación.
      // Limitar pausas largas evita saltos grandes tras ocultar la pestaña.
      // Otros tipos conservan su reloj anterior y la cámara interpola con cdt.
      const introDt = Number.isFinite(renderDt) && renderDt >= 0
        ? Math.min(0.5, renderDt) : cdt;
      activeSeq.elapsed += activeSeq.type === "intro" ? introDt : cdt;
      const p = Math.min(1, activeSeq.elapsed / activeSeq.duration);

      if (activeSeq.type === "intro") {
        // Durante el plano final, el HUB real se dibuja bajo el fundido. Su
        // update ya respeta isBlocking(), así que no entrega control aún.
        if (activeSeq.elapsed >= 32 && !activeSeq.hubEntryAttempted && window.DD_HUB &&
            typeof window.DD_HUB.enter === "function") {
          activeSeq.hubEntryAttempted = true;
          if (!(typeof window.DD_HUB.isActive === "function" && window.DD_HUB.isActive())) {
            try { window.DD_HUB.enter(); } catch (e) {}
          }
        }
        // Sincronización rítmica con el reloj de 128 BPM (1 beat = 0.46875s)
        const bpmTime = activeSeq.elapsed;
        const beatFrac = (bpmTime % 0.46875) / 0.46875;
        const kickPulse = reducedMotion ? 0 : Math.exp(-beatFrac * 6.5);
        const t = activeSeq.elapsed;

        // Diez planos cinematográficos continuos (35s total)
        if (t < 3.5) {
          // PLANO 01 (00:00 - 00:35 · 3.5s) · Ciudad Exterior (EWS): Pan horizontal lento + Tilt Up suave
          const lp = t / 3.5;
          cam.targetOffX = (0.5 - lp) * (reducedMotion ? 20 : 55);
          cam.targetOffY = lp * (reducedMotion ? -8 : -22);
          cam.targetZoomMul = 1.0 + lp * (reducedMotion ? 0.015 : 0.04);
        } else if (t < 7.0) {
          // PLANO 02 (00:35 - 00:70 · 3.5s) · Fachada del Club (WS): Dolly In continuo hacia el portal
          const lp = (t - 3.5) / 3.5;
          cam.targetOffX = Math.sin(lp * Math.PI * 0.5) * 6;
          cam.targetOffY = lp * -14;
          cam.targetZoomMul = 1.02 + lp * (reducedMotion ? 0.04 : 0.12);
        } else if (t < 10.0) {
          // PLANO 03 (00:70 - 01:00 · 3.0s) · Umbral (CU / Dutch Angle): Foco en marco y fuga de luz
          const lp = (t - 7.0) / 3.0;
          cam.targetOffX = -18 + lp * 12;
          cam.targetOffY = 10 - lp * 8;
          cam.targetZoomMul = 1.15 + lp * 0.06;
        } else if (t < 13.5) {
          // PLANO 04 (01:00 - 01:35 · 3.5s) · Aparición del Protagonista (MS Contraluz): Contrapicado
          const lp = (t - 10.0) / 3.5;
          cam.targetOffX = Math.sin(lp * Math.PI) * 8;
          cam.targetOffY = 16 - lp * 10;
          cam.targetZoomMul = 1.12 - lp * 0.03 + kickPulse * (reducedMotion ? 0.005 : 0.018);
        } else if (t < 17.5) {
          // PLANO 05 (01:35 - 01:75 · 4.0s) · Tracking Lateral: Seguimiento de izquierda a derecha
          const lp = (t - 13.5) / 4.0;
          cam.targetOffX = (-0.5 + lp) * (reducedMotion ? 40 : 120);
          cam.targetOffY = Math.sin(lp * Math.PI * 2) * 6;
          cam.targetZoomMul = 1.08;
        } else if (t < 21.0) {
          // PLANO 06 (01:75 - 02:10 · 3.5s) · Gran Nave Principal (High Angle EWS): Grúa cenital
          const lp = (t - 17.5) / 3.5;
          cam.targetOffX = Math.sin(lp * Math.PI) * 12;
          cam.targetOffY = -28 + lp * 22;
          cam.targetZoomMul = 1.18 - lp * (reducedMotion ? 0.05 : 0.12);
        } else if (t < 24.5) {
          // PLANO 07 (02:10 - 02:45 · 3.5s) · Pista Principal (Dynamic WS · DROP): Retroceso y beat drop
          const lp = (t - 21.0) / 3.5;
          cam.targetOffX = 0;
          cam.targetOffY = lp * -18;
          cam.targetZoomMul = 1.05 + lp * 0.08 + kickPulse * (reducedMotion ? 0.01 : 0.035);
        } else if (t < 28.5) {
          // PLANO 08 (02:45 - 02:85 · 4.0s) · Presentación Heroica (MCU): Detención y micro-órbita
          const lp = (t - 24.5) / 4.0;
          cam.targetOffX = Math.sin(lp * Math.PI) * (reducedMotion ? 10 : 28);
          cam.targetOffY = -6 + Math.cos(lp * Math.PI) * 4;
          cam.targetZoomMul = 1.22 + Math.sin(lp * Math.PI * 0.5) * 0.06;
        } else if (t < 32.0) {
          // PLANO 09 (02:85 - 03:20 · 3.5s) · Identidad del Juego (Hero Shot): Logotipo oficial + camera shake
          const lp = (t - 28.5) / 3.5;
          const shake = (1 - lp) * (Math.random() - 0.5) * (reducedMotion ? 3 : 14);
          cam.targetOffX = shake;
          cam.targetOffY = -4 + shake * 0.6;
          cam.targetZoomMul = 1.18 + kickPulse * 0.04;
        } else {
          // PLANO 10 (03:20 - 03:55 · 3.5s) · Transición Seamless al Gameplay: Lerp suave hacia HUB / r0
          const lp = Math.min(1, (t - 32.0) / 3.0);
          const ease = lp * lp * (3 - 2 * lp);
          cam.targetOffX = (1 - ease) * cam.offX;
          cam.targetOffY = (1 - ease) * cam.offY;
          cam.targetZoomMul = 1.14 + (1.0 - 1.14) * ease;
        }
      } else if (activeSeq.type === "room") {
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
      // Fondo base de absorción de color infernal
      ctx.save();
      if (activeSeq.elapsed >= 32) {
        const transition = Math.min(1, (activeSeq.elapsed - 32) / 3);
        ctx.globalAlpha = 1 - transition * transition * (3 - 2 * transition);
      }
      ctx.fillStyle = "#06020c";
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.restore();

      const t = activeSeq.elapsed;
      const bpmTime = t;
      const beatFrac = (bpmTime % 0.46875) / 0.46875;
      const kickPulse = reducedMotion ? 0 : Math.exp(-beatFrac * 6.5);

      // Obtención modular de recursos con soporte de manifiesto central y fallback
      const getAsset = function (id) {
        if (!window.DD_ASSETS || typeof window.DD_ASSETS.get !== "function") return null;
        return window.DD_ASSETS.get(id);
      };
      // Personaje modular sustituible con fallback a sprites canónicos del motor
      // El idle original tiene partes opacas ausentes. Mantener el recurso intacto
      // y usar una pose oficial completa mientras no exista un idle restaurado.
      const pIdle = getAsset("hero_walk_00") || getAsset("player_walk_00") ||
        getAsset("hero_walk_01") || getAsset("player_walk_01") ||
        getAsset("hero_walk_02") || getAsset("player_walk_02");
      const pWalkFrames = [
        getAsset("hero_walk_00") || getAsset("player_walk_00"),
        getAsset("hero_walk_01") || getAsset("player_walk_01"),
        getAsset("hero_walk_02") || getAsset("player_walk_02"),
        // El fotograma 03 oficial también presenta huecos de alfa. No se altera:
        // se repite temporalmente el 01 para no mostrar un cuerpo transparente.
        getAsset("hero_walk_01") || getAsset("player_walk_01")
      ].filter(function (img) { return !!img && img.naturalWidth > 0; });

      // Selector de plano cinematográfico (1 al 10)
      let shotIdx = 1;
      let shotElapsed = t;
      let shotDur = 3.5;
      let shotProgress = 0;

      if (t < 3.5) {
        shotIdx = 1; shotElapsed = t; shotDur = 3.5;
      } else if (t < 7.0) {
        shotIdx = 2; shotElapsed = t - 3.5; shotDur = 3.5;
      } else if (t < 10.0) {
        shotIdx = 3; shotElapsed = t - 7.0; shotDur = 3.0;
      } else if (t < 13.5) {
        shotIdx = 4; shotElapsed = t - 10.0; shotDur = 3.5;
      } else if (t < 17.5) {
        shotIdx = 5; shotElapsed = t - 13.5; shotDur = 4.0;
      } else if (t < 21.0) {
        shotIdx = 6; shotElapsed = t - 17.5; shotDur = 3.5;
      } else if (t < 24.5) {
        shotIdx = 7; shotElapsed = t - 21.0; shotDur = 3.5;
      } else if (t < 28.5) {
        shotIdx = 8; shotElapsed = t - 24.5; shotDur = 4.0;
      } else if (t < 32.0) {
        shotIdx = 9; shotElapsed = t - 28.5; shotDur = 3.5;
      } else {
        shotIdx = 10; shotElapsed = t - 32.0; shotDur = 3.0;
      }
      shotProgress = Math.min(1, Math.max(0, shotElapsed / shotDur));

      // Actualizar subtítulo y tag en el overlay letterbox
      const tagEl = document.getElementById("dd-cine-tag");
      const subEl = document.getElementById("dd-cine-sub");
      if (tagEl && subEl) {
        // La intro no muestra anotaciones técnicas ni nomenclatura heredada.
        // La señal es texto de interfaz: no pretende ser un objeto del escenario.
        tagEl.textContent = "";
        subEl.textContent = shotIdx === 5 ? "REFUGIO →" :
          (shotIdx === 10 ? "REFUGIO · PREPÁRATE ANTES DE BAJAR" : "");
      }

      // Fijar la elección por plano evita cambiar de respaldo a maestro a mitad
      // de una toma si una descarga lenta termina durante su reproducción.
      if (!activeSeq.introMasterChoices) activeSeq.introMasterChoices = {};
      const hasMasterForShot = function (id) {
        const key = shotIdx + ":" + id;
        if (!(key in activeSeq.introMasterChoices)) {
          activeSeq.introMasterChoices[key] = !!getAsset(id);
        }
        return activeSeq.introMasterChoices[key];
      };

      // Helper para renderizar capas o fondo maestro con overscan y paralaje
      const drawLayer = function (assetId, parX, parY, zoom, alpha, blendMode) {
        const img = getAsset(assetId);
        if (!img || img.naturalWidth <= 0) return;
        ctx.save();
        if (blendMode) ctx.globalCompositeOperation = blendMode;
        ctx.globalAlpha *= Math.max(0, Math.min(1, alpha !== undefined ? alpha : 1.0));
        
        // Relación de aspecto 16:9 con overscan para soportar cámara
        const scale = Math.max(viewW / img.naturalWidth, viewH / img.naturalHeight) * (zoom || 1.0);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        // Limit the pan to available overscan, including narrow viewports.
        const dx = Math.min(0, Math.max(viewW - dw, (viewW - dw) * 0.5 + (parX || 0)));
        const dy = Math.min(0, Math.max(viewH - dh, (viewH - dh) * 0.5 + (parY || 0)));
        
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      };

      // RENDERIZADO ESPECÍFICO POR PLANO CON ACABADO PREMIUM FASE 05
      const dustImg = getAsset("effect_dust_particles");
      const flareImg = getAsset("effect_anamorphic_flare");
      const vignetteImg = getAsset("overlay_vignette_gothic");

      if (shotIdx === 1) {
        // PLANO 01 · CIUDAD EXTERIOR (cine_bg01_city)
        const sp = shotProgress;
        if (hasMasterForShot("cine_bg01_city")) {
        drawLayer("cine_bg01_city", (sp - 0.5) * 50, sp * -20, 1.06, 1.0);
        } else {
        drawLayer("cine_bg01_city_01_sky_moon_atmosphere", (sp - 0.5) * 15, sp * -8, 1.02, 1.0);
        drawLayer("cine_bg01_city_02_gothic_skyline_architecture", (sp - 0.5) * 45, sp * -18, 1.05, 1.0);
        drawLayer("cine_bg01_city_03_foreground_industrial_pipes", (sp - 0.5) * 95, sp * -28, 1.08, 1.0);
        if (!getAsset("cine_bg01_city_01_sky_moon_atmosphere")) {
          drawLayer("cine_bg01_city", (sp - 0.5) * 50, sp * -20, 1.04, 1.0);
        }
        }

        // Niebla volumétrica en capas con paralaje y dispersión de luz
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.22 + Math.sin(t * 1.5) * 0.05;
        const fogGrad = ctx.createLinearGradient(0, viewH * 0.52, 0, viewH);
        fogGrad.addColorStop(0, "rgba(0, 240, 255, 0.0)");
        fogGrad.addColorStop(0.6, "rgba(157, 0, 255, 0.25)");
        fogGrad.addColorStop(1, "rgba(255, 0, 127, 0.32)");
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, viewH * 0.48, viewW, viewH * 0.52);

        // Polvo ambiental flotante en el aire urbano
        if (dustImg && dustImg.naturalWidth > 0) {
          ctx.globalAlpha = 0.35;
          ctx.drawImage(dustImg, (sp - 0.5) * 30, Math.sin(t * 0.8) * 10, viewW, viewH);
        }
        ctx.restore();

      } else if (shotIdx === 2) {
        // PLANO 02 · FACHADA DEL CLUB (cine_bg02_club_exterior)
        const sp = shotProgress;
        const zoom = 1.0 + sp * 0.12;
        if (hasMasterForShot("cine_bg02_club_exterior")) {
        drawLayer("cine_bg02_club_exterior", 0, sp * -14, zoom * 1.05, 1.0);
        } else {
        drawLayer("cine_bg02_club_exterior_01_gothic_cathedral_facade", 0, sp * -15, zoom, 1.0);
        drawLayer("cine_bg02_club_exterior_02_portal_speakers_entrance", 0, sp * -12, zoom * 1.02, 1.0);
        drawLayer("cine_bg02_club_exterior_03_wet_pavement_reflections", 0, sp * -6, zoom * 1.05, 1.0);
        if (!getAsset("cine_bg02_club_exterior_01_gothic_cathedral_facade")) {
          drawLayer("cine_bg02_club_exterior", 0, sp * -14, zoom, 1.0);
        }
        }

        // Resplandor neón pulsante en el portal exterior con halos volumétricos
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.18 + kickPulse * 0.16;
        const neonGlow = ctx.createRadialGradient(viewW * 0.5, viewH * 0.45, 20, viewW * 0.5, viewH * 0.45, viewW * 0.45);
        neonGlow.addColorStop(0, "rgba(255, 0, 127, 0.5)");
        neonGlow.addColorStop(0.45, "rgba(0, 240, 255, 0.2)");
        neonGlow.addColorStop(1, "rgba(6, 2, 12, 0)");
        ctx.fillStyle = neonGlow;
        ctx.fillRect(0, 0, viewW, viewH);

        // Destello de lente anamórfico en el dintel del pórtico
        if (flareImg && flareImg.naturalWidth > 0 && kickPulse > 0.3) {
          ctx.globalAlpha = kickPulse * 0.38;
          ctx.drawImage(flareImg, 0, viewH * 0.42 - 64, viewW, 128);
        }
        ctx.restore();

      } else if (shotIdx === 3) {
        // PLANO 03 · UMBRAL (cine_bg03_entrance - CU Dutch Angle)
        const sp = shotProgress;
        ctx.save();
        ctx.translate(viewW * 0.5, viewH * 0.5);
        ctx.rotate((reducedMotion ? 0 : 0.025) * Math.sin(sp * Math.PI));
        ctx.translate(-viewW * 0.5, -viewH * 0.5);

        if (hasMasterForShot("cine_bg03_entrance")) {
        drawLayer("cine_bg03_entrance", (sp - 0.5) * 30, 0, 1.20 + sp * 0.05, 1.0);
        } else {
        drawLayer("cine_bg03_entrance_01_vaulted_hallway_depth", (sp - 0.5) * 20, 0, 1.15 + sp * 0.05, 1.0);
        drawLayer("cine_bg03_entrance_02_midground_columns_banners", (sp - 0.5) * 35, 0, 1.18 + sp * 0.06, 1.0);
        drawLayer("cine_bg03_entrance_03_foreground_pillars_occlusion", (sp - 0.5) * 60, 0, 1.22 + sp * 0.08, 1.0);
        if (!getAsset("cine_bg03_entrance_01_vaulted_hallway_depth")) {
          drawLayer("cine_bg03_entrance", (sp - 0.5) * 30, 0, 1.18, 1.0);
        }
        }
        ctx.restore();

        // Fuga de luz dorada cegadora desde la rendija con haces diagonales
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.22 + sp * 0.28;
        const flashGrad = ctx.createLinearGradient(viewW * 0.35, 0, viewW * 0.65, viewH);
        flashGrad.addColorStop(0, "rgba(255, 230, 0, 0.0)");
        flashGrad.addColorStop(0.48, "rgba(255, 230, 0, 0.55)");
        flashGrad.addColorStop(1, "rgba(255, 0, 127, 0.0)");
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, viewW, viewH);
        ctx.restore();

      } else if (shotIdx === 4) {
        // PLANO 04 · APARICIÓN DEL PROTAGONISTA (cine_bg03_entrance - Contraluz MS)
        const sp = shotProgress;
        if (hasMasterForShot("cine_bg03_entrance")) {
        drawLayer("cine_bg03_entrance", 0, 10 - sp * 10, 1.14, 1.0);
        } else {
          drawLayer("cine_bg03_entrance_01_vaulted_hallway_depth", 0, 10 - sp * 10, 1.12, 1.0);
          drawLayer("cine_bg03_entrance_02_midground_columns_banners", 0, 12 - sp * 12, 1.14, 1.0);
        }

        // Protagonista en silueta de contraluz avanzando con paso firme
        const frameIdx = Math.floor(t * 8.0) % (pWalkFrames.length || 1);
        const pImg = pWalkFrames[frameIdx] || pIdle;
        if (pImg && pImg.naturalWidth > 0) {
          const ph = Math.min(380, viewH * 0.44);
          const pw = ph * (pImg.naturalWidth / pImg.naturalHeight);
          const px = viewW * 0.5;
          const py = viewH * 0.78 - sp * 24;

          // Halo de contraluz volumétrico (Rim Light magenta profundo)
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          const rim = ctx.createRadialGradient(px, py - ph * 0.5, 10, px, py - ph * 0.5, ph * 0.7);
          rim.addColorStop(0, "rgba(255, 0, 127, 0.75)");
          rim.addColorStop(0.5, "rgba(255, 230, 0, 0.3)");
          rim.addColorStop(1, "rgba(6, 2, 12, 0)");
          ctx.fillStyle = rim;
          ctx.beginPath();
          ctx.ellipse(px, py - ph * 0.5, pw * 1.25, ph * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Sombra proyectada alargada hacia adelante
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = "rgba(4, 1, 8, 0.72)";
          ctx.beginPath();
          ctx.ellipse(px, py + 2, pw * 0.6, 16, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = "#ff007f";
          ctx.shadowBlur = 6;
          ctx.drawImage(pImg, px - pw * 0.5, py - ph, pw, ph);
          ctx.restore();
        }

        if (!hasMasterForShot("cine_bg03_entrance")) {
          drawLayer("cine_bg03_entrance_03_foreground_pillars_occlusion", 0, 0, 1.18, 1.0);
        }

      } else if (shotIdx === 5) {
        // PLANO 05 · CAMINATA CINEMATOGRÁFICA (cine_bg03_entrance - Tracking Lateral)
        const sp = shotProgress;
        const parBg = (sp - 0.5) * -120;
        const parMid = (sp - 0.5) * -220;
        const parFg = (sp - 0.5) * -420;

        if (hasMasterForShot("cine_bg03_entrance")) {
        drawLayer("cine_bg03_entrance", parBg, 0, 1.16, 1.0);
        } else {
          drawLayer("cine_bg03_entrance_01_vaulted_hallway_depth", parBg, 0, 1.08, 1.0);
          drawLayer("cine_bg03_entrance_02_midground_columns_banners", parMid, 0, 1.10, 1.0);
        }

        // Protagonista con desplazamiento físico real y alternancia fluida de pasos a 128 BPM
        const frameIdx = Math.floor(t * 8.5) % (pWalkFrames.length || 1);
        const pImg = pWalkFrames[frameIdx] || pIdle;
        if (pImg && pImg.naturalWidth > 0) {
          const ph = Math.min(360, viewH * 0.42);
          const pw = ph * (pImg.naturalWidth / pImg.naturalHeight);
          const px = viewW * (0.18 + sp * 0.64);
          const py = viewH * 0.82 + Math.sin(t * 17.0) * 2.5;

          ctx.save();
          // Sombra proyectada elíptica con gradiente de contacto
          ctx.fillStyle = "rgba(4, 1, 8, 0.72)";
          ctx.beginPath();
          ctx.ellipse(px, py - 4, pw * 0.48, 15, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = "#ff007f";
          ctx.shadowBlur = 6;
          ctx.drawImage(pImg, px - pw * 0.5, py - ph, pw, ph);
          ctx.restore();
        }

        if (!hasMasterForShot("cine_bg03_entrance")) {
          drawLayer("cine_bg03_entrance_03_foreground_pillars_occlusion", parFg, 0, 1.18, 1.0);
        }

      } else if (shotIdx === 6) {
        // PLANO 06 · GRAN NAVE PRINCIPAL (cine_bg04_main_hall - High Angle EWS)
        const sp = shotProgress;
        const grpY = -25 + sp * 22;
        if (hasMasterForShot("cine_bg04_main_hall")) {
        drawLayer("cine_bg04_main_hall", 0, grpY, 1.15 - sp * 0.08, 1.0);
        } else {
        drawLayer("cine_bg04_main_hall_01_cathedral_nave_vaults", 0, grpY * 0.5, 1.15 - sp * 0.08, 1.0);
        drawLayer("cine_bg04_main_hall_02_laser_beams_equalizer", Math.sin(t * 1.8) * 18, grpY * 0.8, 1.16 - sp * 0.08, 1.0);
        drawLayer("cine_bg04_main_hall_03_chandeliers_stage_framing", 0, grpY * 1.2, 1.18 - sp * 0.08, 1.0);
        if (!getAsset("cine_bg04_main_hall_01_cathedral_nave_vaults")) {
          drawLayer("cine_bg04_main_hall", 0, grpY, 1.12, 1.0);
        }
        }

        // Haces de luz láser volumétrica cruzados y oscilantes
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.32 + kickPulse * 0.18;
        const beamAngle = Math.sin(t * 2.2) * 140;
        const bGrad = ctx.createLinearGradient(viewW * 0.5, 0, viewW * 0.5 + beamAngle, viewH);
        bGrad.addColorStop(0, "rgba(255, 0, 127, 0.0)");
        bGrad.addColorStop(0.5, "rgba(0, 240, 255, 0.4)");
        bGrad.addColorStop(1, "rgba(157, 0, 255, 0.0)");
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.moveTo(viewW * 0.5 - 30, 0);
        ctx.lineTo(viewW * 0.5 + 30, 0);
        ctx.lineTo(viewW * 0.5 + beamAngle + 120, viewH);
        ctx.lineTo(viewW * 0.5 + beamAngle - 120, viewH);
        ctx.closePath();
        ctx.fill();

        // Láser secundario opuesto
        const bGrad2 = ctx.createLinearGradient(viewW * 0.5, 0, viewW * 0.5 - beamAngle * 0.8, viewH);
        bGrad2.addColorStop(0, "rgba(0, 240, 255, 0.0)");
        bGrad2.addColorStop(0.5, "rgba(255, 0, 127, 0.35)");
        bGrad2.addColorStop(1, "rgba(255, 230, 0, 0.0)");
        ctx.fillStyle = bGrad2;
        ctx.beginPath();
        ctx.moveTo(viewW * 0.5 - 20, 0);
        ctx.lineTo(viewW * 0.5 + 20, 0);
        ctx.lineTo(viewW * 0.5 - beamAngle * 0.8 + 100, viewH);
        ctx.lineTo(viewW * 0.5 - beamAngle * 0.8 - 100, viewH);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

      } else if (shotIdx === 7) {
        // PLANO 07 · PISTA PRINCIPAL (cine_bg05_dancefloor - Dynamic WS DROP)
        const sp = shotProgress;
        if (hasMasterForShot("cine_bg05_dancefloor")) {
        drawLayer("cine_bg05_dancefloor", 0, sp * -10, 1.06 + kickPulse * 0.03, 1.0);
        } else {
          drawLayer("cine_bg05_dancefloor_01_astrological_dancefloor_grid", 0, sp * -12, 1.04 + kickPulse * 0.02, 1.0);
          drawLayer("cine_bg05_dancefloor_02_sound_towers_dj_stage", 0, sp * -10, 1.06 + kickPulse * 0.03, 1.0);
        }

        // Protagonista avanzando hacia el centro de la pista pulsante
        const frameIdx = Math.floor(t * 8.5) % (pWalkFrames.length || 1);
        const pImg = sp > 0.78 ? pIdle : (pWalkFrames[frameIdx] || pIdle);
        if (pImg && pImg.naturalWidth > 0) {
          const ph = Math.min(340, viewH * 0.40);
          const pw = ph * (pImg.naturalWidth / pImg.naturalHeight);
          const px = viewW * 0.5;
          const py = viewH * 0.88 - Math.min(sp, 0.78) * 40;

          // Reflejo interactivo en la obsidiana pulida del suelo
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = 0.32 + kickPulse * 0.2;
          ctx.translate(px, py);
          ctx.scale(1, -0.42);
          ctx.drawImage(pImg, -pw * 0.5, 0, pw, ph);
          ctx.restore();

          // Sombra de contacto
          ctx.save();
          ctx.fillStyle = "rgba(4, 1, 8, 0.8)";
          ctx.beginPath();
          ctx.ellipse(px, py - 4, pw * 0.5, 14, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = 6;
          ctx.drawImage(pImg, px - pw * 0.5, py - ph, pw, ph);
          ctx.restore();
        }

        if (!hasMasterForShot("cine_bg05_dancefloor")) {
          drawLayer("cine_bg05_dancefloor_03_tables_foreground_ambient", 0, sp * -6, 1.10, 1.0);
        }

        // Estallido estroboscópico del DROP musical sincronizado a 128 BPM
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = kickPulse * 0.38;
        ctx.fillStyle = "#ff007f";
        ctx.fillRect(0, 0, viewW, viewH);

        if (flareImg && flareImg.naturalWidth > 0 && kickPulse > 0.4) {
          ctx.globalAlpha = kickPulse * 0.55;
          ctx.drawImage(flareImg, 0, viewH * 0.5 - 64, viewW, 128);
        }
        ctx.restore();

      } else if (shotIdx === 8) {
        // PLANO 08 · PRESENTACIÓN HEROICA (cine_bg06_hero - MCU Órbita)
        const sp = shotProgress;
        const orbX = Math.sin(sp * Math.PI) * 22;
        if (hasMasterForShot("cine_bg06_hero")) {
        drawLayer("cine_bg06_hero", orbX * 0.5, 0, 1.03, 1.0);
        } else {
          drawLayer("cine_bg06_hero_01_axial_portal_rosette", orbX * 0.5, 0, 1.20, 1.0);
          drawLayer("cine_bg06_hero_02_hero_rimlight_spotlight", orbX * 0.8, 0, 1.22 + kickPulse * 0.04, 1.0);
        }

        // Pose oficial provisional de espera: no hay desenfunde sin fogonazo.
        const pImg = pIdle; // shoot_00 contiene fogonazo: no simula apuntado.
        if (pImg && pImg.naturalWidth > 0) {
          const ph = Math.min(440, viewH * 0.52);
          const pw = ph * (pImg.naturalWidth / pImg.naturalHeight);
          const px = viewW * 0.5 + orbX;
          const py = viewH * 0.88;

          ctx.save();
          // Halo de contraluz volumétrico (Rim Light cenital dorado/fucsia)
          ctx.globalCompositeOperation = "screen";
          const rim = ctx.createRadialGradient(px, py - ph * 0.55, 12, px, py - ph * 0.55, ph * 0.72);
          rim.addColorStop(0, "rgba(255, 0, 127, 0.75)");
          rim.addColorStop(0.5, "rgba(0, 240, 255, 0.3)");
          rim.addColorStop(1, "rgba(6, 2, 12, 0)");
          ctx.fillStyle = rim;
          ctx.beginPath();
          ctx.ellipse(px, py - ph * 0.55, pw * 1.3, ph * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Sombra de contacto
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = "rgba(4, 1, 8, 0.55)";
          ctx.beginPath();
          ctx.ellipse(px, py - 4, pw * 0.38, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = "#ff007f";
          ctx.shadowBlur = 6;
          ctx.drawImage(pImg, px - pw * 0.5, py - ph, pw, ph);
          ctx.restore();
        }

        if (!hasMasterForShot("cine_bg06_hero")) {
          drawLayer("cine_bg06_hero_03_flanking_speakers_framing", orbX * 1.2, 0, 1.25, 1.0);
        }

      } else if (shotIdx === 9) {
        // PLANO 09 · IDENTIDAD DEL JUEGO (cine_bg06_hero - Logotipo Oficial)
        const sp = shotProgress;
        if (hasMasterForShot("cine_bg06_hero")) {
        drawLayer("cine_bg06_hero", 0, 0, 1.03, 1.0);
        } else {
          drawLayer("cine_bg06_hero_01_axial_portal_rosette", 0, 0, 1.18, 1.0);
          drawLayer("cine_bg06_hero_02_hero_rimlight_spotlight", 0, 0, 1.20, 1.0);
        }

        if (!hasMasterForShot("cine_bg06_hero")) {
          drawLayer("cine_bg06_hero_03_flanking_speakers_framing", 0, 0, 1.22, 1.0);
        }

        // LOGOTIPO MODULAR DEADBEAT DISCO (assets/cinematics/logos/logo_deadbeat_cinematic.png con fallback)
        const logoImg = getAsset("logo_deadbeat_cinematic") || getAsset("logo_deadbeat_trim") || getAsset("logo_deadbeat_graffiti");
        if (logoImg && logoImg.naturalWidth > 0) {
          const lw = Math.min(viewW * 0.58, 700);
          const lh = lw * (logoImg.naturalHeight / logoImg.naturalWidth);
          const lx = (viewW - lw) * 0.5;
          const ly = viewH * 0.06;

          ctx.save();
          const logoBackdrop = ctx.createRadialGradient(viewW * 0.5, ly + lh * 0.5, 0, viewW * 0.5, ly + lh * 0.5, lw * 0.55);
          logoBackdrop.addColorStop(0, "rgba(6, 2, 12, 0.94)");
          logoBackdrop.addColorStop(0.7, "rgba(6, 2, 12, 0.7)");
          logoBackdrop.addColorStop(1, "rgba(6, 2, 12, 0)");
          ctx.fillStyle = logoBackdrop;
          ctx.fillRect(0, 0, viewW, viewH);
          ctx.globalCompositeOperation = "source-over";
          ctx.shadowColor = "rgba(255, 0, 127, 0.4)";
          ctx.shadowBlur = 8;
          ctx.drawImage(logoImg, lx, ly, lw, lh);

          if (flareImg && flareImg.naturalWidth > 0 && kickPulse > 0.4) {
            ctx.globalAlpha = kickPulse * 0.65;
            ctx.drawImage(flareImg, 0, ly + lh * 0.5 - 64, viewW, 128);
          }
          ctx.restore();
        }

        // Protagonista visible al pie con la misma pose de espera.
        const pImg = pIdle; // Mantener continuidad sin aparentar un disparo.
        if (pImg && pImg.naturalWidth > 0) {
          const ph = Math.min(360, viewH * 0.42);
          const pw = ph * (pImg.naturalWidth / pImg.naturalHeight);
          const px = viewW * 0.5;
          const py = viewH * 0.92;
          ctx.save();
          ctx.shadowColor = "#ff007f";
          ctx.shadowBlur = 6;
          ctx.drawImage(pImg, px - pw * 0.5, py - ph, pw, ph);
          ctx.restore();
        }


      } else {
        // PLANO 10 · TRANSICIÓN AL JUEGO ISOMÉTRICO (Conexión directa con HUB / r0)
        const sp = shotProgress;
        const ease = sp * sp * (3 - 2 * sp);

        ctx.save();
        ctx.globalAlpha = Math.max(0, 1.0 - ease);
        drawLayer("cine_bg06_hero", 0, ease * 10, 1.03 - ease * 0.03, 1.0);

        if (pIdle && pIdle.naturalWidth > 0) {
          const ph = Math.min(320, viewH * 0.38) * (1.0 - ease * 0.15);
          const pw = ph * (pIdle.naturalWidth / pIdle.naturalHeight);
          const px = viewW * 0.5;
          const py = viewH * 0.92 - ease * 8;
          ctx.drawImage(pIdle, px - pw * 0.5, py - ph, pw, ph);
        }
        ctx.restore();

      }

      // Overlays cinematográficos globales: Viñeteado gótico y partículas
      if (vignetteImg && vignetteImg.naturalWidth > 0 && shotIdx < 10) {
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        ctx.globalAlpha = 0.65;
        ctx.drawImage(vignetteImg, 0, 0, viewW, viewH);
        ctx.restore();
      }

      ctx.restore();
      return;
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
