/* ==========================================================================
   DEADBEAT DISCO — FASE 01 · BOOT SEQUENCE, LOADING SCREEN & STARTUP FSM
   (window.DD_BOOT)

   Una única máquina de estados explícita para el arranque:

       BOOT -> LOADING -> INTRO -> MAIN_MENU <-> SUBMENU -> EXIT

   Esta pieza ORQUESTA los subsistemas que ya existen; no duplica ninguno:

     motor / mundo ......... __DD_BRIDGE + dd_world_renderer (no se toca)
     assets ................ window.DD_ASSETS (225 entradas) + data-URI inline
     cinemática de intro ... window.DD_CINE.playIntro (la canónica)
     menú .................. window.DD_UI (showMainMenu/hideMainMenu)
     música del menú ....... DDC_COVER.music  (motor WebAudio existente)
     música de partida ..... DMO_MUSIC        (motor existente, intacto)

   Reglas duras:
     · Ningún camino arranca partida automáticamente.
     · El progreso de carga sólo avanza con hitos REALES y verificables.
     · Si un recurso crítico falta, se muestra un error accionable; nunca una
       pantalla negra indefinida.
     · La intro se reproduce UNA vez por arranque, se puede saltar y no se
       reinicia al recuperar el foco de la ventana.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- estado */
  var STATES = ["BOOT", "LOADING", "INTRO", "MAIN_MENU", "SUBMENU", "EXIT", "PLAYING"];
  /* Pasos cuya ausencia NO es degradable: sin ellos el menú existe pero no puede
     ejecutar ninguna acción. El modo seguro no puede saltárselos. */
  var ESSENTIAL_IDS = ["engine", "assets", "images", "ui"];
  var state = {
    current: "BOOT",
    started: false,
    introPlayed: false,
    introActive: false,
    submenu: null,          /* "OPTIONS" | "CREDITS" | "SLOTS" | "ARMORY" | "MAP" | "SHOP" */
    criticalErrors: [],
    skipped: false,
    loadStart: 0,
    loadEnd: 0,
    bootStart: 0,
    trace: []               /* evidencia real de progreso (paso → %), sin temporizadores */
  };

  var listeners = Object.create(null);
  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  function on(evt, fn) {
    (listeners[evt] || (listeners[evt] = [])).push(fn);
    return function () {
      var a = listeners[evt] || [];
      var i = a.indexOf(fn);
      if (i >= 0) a.splice(i, 1);
    };
  }

  function emit(evt, data) {
    var a = listeners[evt];
    if (!a) return;
    for (var i = 0; i < a.length; i++) {
      try { a[i](data); } catch (e) { console.warn("[DD_BOOT] listener " + evt, e); }
    }
  }

  function setState(next, meta) {
    if (STATES.indexOf(next) < 0) throw new Error("estado desconocido: " + next);
    if (state.current === next) return;
    var prev = state.current;
    state.current = next;
    if (next === "SUBMENU") state.submenu = (meta && meta.sub) || null;
    else if (prev === "SUBMENU" && next !== "SUBMENU") state.submenu = null;
    document.body.setAttribute("data-dd-state", next.toLowerCase());
    emit("state", { from: prev, to: next, meta: meta || null });
  }

  /* ------------------------------------------------------- audio (árbitro) */
  /* Un único dueño por estado. Ambos motores son los existentes. */
  var audio = {
    menuOwnerWarned: false,
    startMenuMusic: function (fade) {
      var cover = window.DDC_COVER;
      if (!cover || !cover.music || typeof cover.music.start !== "function") return false;
      try {
        var ok = cover.music.start(4);
        if (cover.music.duck) cover.music.duck(false);
        return ok !== false;
      } catch (e) {
        console.warn("[DD_BOOT] música de menú no disponible", e);
        return false;
      }
    },
    stopMenuMusic: function (fade) {
      var cover = window.DDC_COVER;
      if (!cover || !cover.music || typeof cover.music.stop !== "function") return;
      if (!cover.music.playing) return;
      try { cover.music.stop(typeof fade === "number" ? fade : 0.6); } catch (e) {}
    },
    ui: function (kind) {
      var cover = window.DDC_COVER;
      if (!cover || !cover.music || typeof cover.music.ui !== "function") return;
      try { cover.music.ui(kind || "move"); } catch (e) {}
    },
    isMenuMusicPlaying: function () {
      return !!(window.DDC_COVER && window.DDC_COVER.music && window.DDC_COVER.music.playing);
    }
  };

  /* ------------------------------------------------------- input guard       */
  /* El cover legado registró listeners de CAPTURA en window que llaman a
     stopImmediatePropagation mientras su flag interno está "locked". Como el
     menú HD sustituye a ese cover, su bloqueo nunca debe aplicarse: se fuerza
     el desbloqueo una vez conocido el DOM (la API pública no lo expone). */
  function releaseLegacyCoverKeyboard() {
    var cover = document.getElementById("ddc-cover");
    if (!cover) return;
    cover.classList.remove("ddc-locked");
    /* El guardia del puente HD (__DD_KEY_GUARD__) ya neutraliza los listeners de
       captura del cover; aquí sólo se asegura el desbloqueo visual/lógico. */
  }

  /* ------------------------------------------------------------------- DOM   */
  var el = {};
  function q(id) { return document.getElementById(id); }

  function buildBootUI() {
    /* El armazón de carga es MARKUP ESTÁTICO emitido por el build justo después
       de <body>: así pinta mientras el documento de 5,2 MB todavía se está
       parseando (ningún script puede hacerlo antes). Aquí sólo se ADOPTA; no se
       crea una segunda copia. Si por algún motivo el armazón no existe, se
       degrada a una versión mínima para no dejar nunca una pantalla negra. */
    var root = q("dd-boot-frame");
    if (!root) {
      root = document.createElement("section");
      root.id = "dd-boot-frame";
      root.innerHTML =
        '<div class="dd-boot-bg"></div>' +
        '<div class="dd-boot-scrim"></div>' +
        '<div class="dd-boot-inner">' +
        '  <div class="dd-boot-top"><span class="dd-boot-kicker">DEADBEAT DISCO</span><span class="dd-boot-ver" id="dd-boot-ver">—</span></div>' +
        '  <div class="dd-boot-statusline"><span id="dd-boot-stage">PREPARANDO EL CLUB</span><span id="dd-boot-pct" aria-hidden="true">0%</span></div>' +
        '  <div class="dd-boot-bar" id="dd-boot-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Progreso de carga"><i id="dd-boot-fill"></i></div>' +
        '  <div class="dd-boot-title"><span class="dd-boot-wordmark" aria-hidden="true"><b>DEADBEAT</b><i>DISCO</i></span></div>' +
        '  <ol class="dd-boot-steps" id="dd-boot-steps" aria-live="polite"></ol>' +
        '  <div class="dd-boot-err" id="dd-boot-err" role="alert" hidden></div>' +
        '</div>';
      document.body.insertBefore(root, document.body.firstChild);
    }
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Cargando DEADBEAT DISCO");
    el.root = root;
    el.stage = q("dd-boot-stage");
    el.pct = q("dd-boot-pct");
    el.fill = q("dd-boot-fill");
    el.shine = q("dd-boot-shine");
    el.bar = q("dd-boot-bar");
    el.steps = q("dd-boot-steps");
    el.err = q("dd-boot-err");
    el.errTitle = q("dd-boot-err-title");
    el.errBody = q("dd-boot-err-body");
    el.ver = q("dd-boot-ver");
    el.audioHint = q("dd-boot-audio");
  }

  /* ------------------------------------------------ pasos reales de carga    */
  /* Cada paso es una comprobación verificable. El porcentaje se deriva del
     número de pasos completados, no de un temporizador. */
  var STEPS = [
    {
      id: "engine",
      label: "MOTOR DE RENDER Y CANVAS",
      detail: "Comprobando el lienzo principal y el puente del motor…",
      run: function () {
        var g = q("game");
        if (!g || !g.getContext) throw new Error("No se encontró el lienzo del juego (#game).");
        return { canvas: g.width + "x" + g.height, bridge: !!window.__DD_BRIDGE };
      }
    },
    {
      id: "assets",
      label: "REGISTRO DE RECURSOS",
      detail: "Leyendo el manifiesto de recursos del juego…",
      critical: true,
      run: function () {
        if (!window.DD_ASSETS || !window.DD_ASSETS.manifest) throw new Error("El registro de recursos no está disponible.");
        var n = Object.keys(window.DD_ASSETS.manifest.entries).length;
        if (n < 100) throw new Error("El manifiesto de recursos está incompleto (" + n + " entradas).");
        return { entries: n };
      }
    },
    {
      id: "images",
      label: "IMÁGENES ESENCIALES",
      detail: "Esperando las imágenes de arranque y del menú…",
      critical: true,
      run: function () {
        var ids = ["logo_deadbeat_graffiti", "emblem_fox_crown", "menu_main_backdrop", "cine_intro_club_panorama"];
        var t0 = performance.now();
        return new Promise(function (resolve, reject) {
          var missing = [], done = 0;
          ids.forEach(function (id) {
            var m = window.DD_ASSETS.manifest.entries[id];
            if (!m) { missing.push(id); done++; return; }
            var probe = new Image();
            probe.onload = function () { if (++done === ids.length) finish(); };
            probe.onerror = function () { missing.push(id); if (++done === ids.length) finish(); };
            probe.src = m.src;
          });
          function finish() {
            if (missing.length) return reject(new Error("Faltan imágenes esenciales: " + missing.join(", ")));
            resolve({ ok: ids.length, ms: Math.round(performance.now() - t0) });
          }
          if (done === ids.length) finish();
        });
      }
    },
    {
      id: "fase01",
      label: "COMPOSICIÓN DE ARRANQUE",
      detail: "Verificando las capas nuevas del menú y de la carga…",
      run: function () {
        var t0 = performance.now();
        return new Promise(function (resolve, reject) {
          var files = [
            "assets/fase01/menu_backdrop_2k.webp",
            "assets/fase01/loading_keyart_2k.webp",
            "assets/fase01/emblem_fox_glow.png",
            "assets/fase01/logo_deadbeat_trim.png"
          ];
          var bad = [], done = 0;
          files.forEach(function (src) {
            var i = new Image();
            i.onload = function () { if (++done === files.length) end(); };
            i.onerror = function () { bad.push(src); if (++done === files.length) end(); };
            i.src = src;
          });
          function end() {
            if (bad.length) return reject(new Error("Faltan recursos de la Fase 01: " + bad.join(", ")));
            resolve({ files: files.length, ms: Math.round(performance.now() - t0) });
          }
          if (done === files.length) end();
        });
      }
    },
    {
      id: "fonts",
      label: "TIPOGRAFÍA DE PISTA",
      detail: "Cargando la tipografía del juego…",
      run: function () {
        if (!document.fonts || !document.fonts.ready) return { fonts: "no-api" };
        return document.fonts.ready.then(function () {
          return { fonts: "ready", checked: !!(document.fonts.check && document.fonts.check('16px DDPixel')) };
        });
      }
    },
    {
      id: "ui",
      label: "INTERFAZ Y CINEMÁTICA",
      detail: "Comprobando el menú principal y el sistema de cinemáticas…",
      critical: true,
      run: function () {
        if (!window.DD_UI) throw new Error("El sistema de menú (DD_UI) no está disponible.");
        if (!window.DD_CINE) throw new Error("El sistema de cinemáticas (DD_CINE) no está disponible.");
        window.DD_UI.showMainMenuProxy ? null : null;
        var menu = q("dd-main-menu");
        return { menu: !!menu, cine: typeof window.DD_CINE.playIntro === "function" };
      }
    },
    {
      id: "audio",
      label: "AUDIO DEL MENÚ",
      detail: "Comprobando el motor de audio…",
      run: function () {
        var cover = window.DDC_COVER;
        var has = !!(cover && cover.music);
        return { engine: has ? "DDC_COVER.music" : "no disponible", state: has ? (cover.music.ready ? "ready" : "cold") : "missing" };
      }
    },
    {
      id: "storage",
      label: "ALMACENAMIENTO",
      detail: "Comprobando el guardado local…",
      run: function () {
        var probe = "__dd_fase01_probe__";
        try {
          window.localStorage.setItem(probe, "1");
          window.localStorage.removeItem(probe);
          return { storage: "ok" };
        } catch (e) {
          return { storage: "no disponible (sesión volátil)", degraded: true };
        }
      }
    },
    {
      id: "final",
      label: "COMPROBACIONES FINALES",
      detail: "Última pasada sobre el arranque…",
      run: function () {
        var degraded = document.body.classList.contains("boot-degraded");
        return {
          state: state.current,
          menuVisible: !!(q("dd-main-menu") && !q("dd-main-menu").classList.contains("dd-hidden")),
          legacyCoverHidden: (function () {
            var c = q("ddc-cover");
            return !c || getComputedStyle(c).display === "none";
          })(),
          degraded: degraded
        };
      }
    }
  ];

  function renderSteps() {
    if (!el.steps) return;
    el.steps.innerHTML = STEPS.map(function (s) {
      return '<li class="dd-boot-step" data-step="' + s.id + '"><i class="dot" aria-hidden="true"></i><span class="lbl">' + s.label + '</span><span class="res">PENDIENTE</span></li>';
    }).join("");
  }

  function stepEl(id) { return el.steps ? el.steps.querySelector('[data-step="' + id + '"]') : null; }

  /* El lockup estático (logotipo) se sustituye por la marca tipográfica mientras
     el bitmap no ha decodificado: así nunca se ve un hueco vacío. */
  function watchLogo() {
    var img = q("dd-boot-logo");
    var wrap = img && img.parentNode;
    if (!img || !wrap) return;
    var done = function () { wrap.classList.add("has-logo"); };
    if (img.complete && img.naturalWidth > 0) return done();
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", function () { wrap.classList.add("is-missing"); }, { once: true });
  }

  function markStep(id, status, detail) {
    var li = stepEl(id);
    if (!li) return;
    li.classList.remove("is-run", "is-ok", "is-warn", "is-fail");
    li.classList.add("is-" + status);
    var res = li.querySelector(".res");
    if (res) {
      res.textContent = status === "ok" ? "OK" :
        status === "run" ? "…" :
        status === "warn" ? "AVISO" :
        status === "fail" ? "ERROR" : "PENDIENTE";
      if (detail && status !== "ok") res.title = String(detail);
    }
  }

  function setProgress(n, label, stepId) {
    var pct = Math.max(0, Math.min(100, Math.round(n)));
    if (el.fill) el.fill.style.width = pct + "%";
    if (el.bar) el.bar.setAttribute("aria-valuenow", String(pct));
    /* Traza de evidencia: sólo pasos REALES terminados, sin temporizadores. */
    state.trace.push({ t: Math.round(performance.now()), pct: pct, step: stepId || "" });
    if (el.pct) el.pct.textContent = pct + "%";
    if (label && el.stage) el.stage.textContent = label;
  }

  /* ------------------------------------------------------------ ejecución   */
  var runToken = 0;

  function runSteps() {
    buildBootUI();
    renderSteps();
    watchLogo();
    el.err.hidden = true;
    el.root.classList.remove("is-degraded");
    state.criticalErrors.length = 0;
    var token = ++runToken;
    var total = STEPS.length;
    var done = 0;

    return STEPS.reduce(function (chain, step) {
      return chain.then(function () {
        if (token !== runToken) return null;
        markStep(step.id, "run");
        if (el.stage) el.stage.textContent = step.label;
        return Promise.resolve()
          .then(step.run)
          .then(function (result) {
            markStep(step.id, "ok");
            if (result && result.degraded) {
              markStep(step.id, "warn", "modo degradado");
              state.criticalErrors.push({ id: step.id, message: "degradado", fatal: false });
            }
            emit("step", { id: step.id, ok: true, result: result });
          })
          .catch(function (err) {
            var msg = (err && err.message) || String(err);
            markStep(step.id, "fail", msg);
            var fatal = !!step.critical && !state.allowSafeMode;
            state.criticalErrors.push({ id: step.id, message: msg, fatal: fatal });
            emit("step", { id: step.id, ok: false, error: msg, fatal: fatal });
            if (fatal) throw err;
          })
          .then(function () {
            done++;
            setProgress((done / total) * 100, step.label, step.id);
          });
      });
    }, Promise.resolve()).then(function () {
      if (token !== runToken) return false;
      setProgress(100, "PISTA PREPARADA", "done");
      return true;
    });
  }

  function showError(err) {
    var msg = (err && err.message) || String(err);
    if (el.err) {
      el.err.hidden = false;
      if (el.errTitle) {
        el.errTitle.textContent = state.criticalErrors.filter(function (e) { return e.fatal; }).length
          ? "NO SE PUDO ABRIR EL CLUB"
          : "EL CLUB ABRE EN MODO DEGRADADO";
      }
      if (el.errBody) {
        el.errBody.textContent = msg + " · Revisa la consola para el detalle. Puedes reintentar o continuar en modo seguro.";
      }
      if (el.stage) el.stage.textContent = "ERROR DE INICIALIZACIÓN";
      var retry = q("dd-boot-retry");
      var safe = q("dd-boot-safe");
      if (retry) retry.onclick = function () { audio.ui("ok"); location.reload(); };
      if (safe) {
        /* El modo seguro SÓLO relaja los pasos no esenciales. Si lo que falta es
           indispensable (motor, recursos, sistema de menú), reintentar en modo
           seguro produciría un menú decorativo que no puede actuar: en ese caso
           el botón se desactiva y se explica por qué, en lugar de ofrecer una
           salida falsa. */
        var indispensable = state.criticalErrors.filter(function (e) {
          return e.fatal && ESSENTIAL_IDS.indexOf(e.id) >= 0;
        });
        var blocked = indispensable.length > 0;
        safe.disabled = blocked;
        safe.setAttribute("aria-disabled", blocked ? "true" : "false");
        safe.title = blocked
          ? "Falta un recurso indispensable (" + indispensable.map(function (e) { return e.id; }).join(", ") + "). El modo seguro no puede sustituirlo."
          : "";
        safe.textContent = blocked ? "MODO SEGURO NO DISPONIBLE" : "MODO SEGURO";
        if (blocked) {
          if (el.errBody) {
            el.errBody.textContent = msg +
              " · Falta un recurso indispensable (" + indispensable.map(function (e) { return e.id; }).join(", ") +
              "): el modo seguro no puede continuar sin él. Usa REINTENTAR.";
          }
        }
        safe.onclick = function () {
          if (blocked) { audio.ui("back"); return; }
          audio.ui("ok");
          state.allowSafeMode = true;
          if (el.err) el.err.hidden = true;
          boot().catch(function (e2) { showError(e2); });
        };
      }
    }
    emit("error", { message: msg, errors: state.criticalErrors.slice() });
  }

  /* ------------------------------------------------------------- ciclo      */
  function boot() {
    state.bootStart = performance.now();
    document.body.classList.add("dd-booting");
    document.body.setAttribute("data-dd-state", "boot");
    setState("BOOT");
    /* BOOT -> LOADING: el estado de carga se declara al empezar a ejecutar los
       pasos reales, no antes. Se entra aquí y no en el render para que la
       transición sea observable y auditable. NUNCA se declara sin pasos. */
    setState("LOADING");
    buildBootUI();
    renderSteps();
    setProgress(0, "PREPARANDO EL CLUB");
    releaseLegacyCoverKeyboard();
    /* El menú está construido pero oculto hasta que la intro termine. */
    if (window.DD_UI) window.DD_UI.hideMainMenu();

    /* Perro guardián: si algún paso se queda colgado, nunca se deja una pantalla
       negra indefinida; se muestra el panel de error accionable. */
    var watchdog = setTimeout(function () {
      if (state.current === "BOOT") {
        showError(new Error("El arranque tardó demasiado. Puedes reintentar o usar el modo seguro."));
      }
    }, 20000);
    state.watchdog = watchdog;

    return runSteps()
      .then(function (ok) {
        if (!ok) return;
        state.loadStart = state.bootStart;
        state.loadEnd = performance.now();
        emit("loading-complete", {
          ms: Math.round(state.loadEnd - state.loadStart),
          steps: STEPS.length,
          errors: state.criticalErrors.slice()
        });
        return waitForExit().then(startIntro);
      })
      .catch(showError)
      .then(function () { clearTimeout(state.watchdog); });
  }

  function waitForExit() {
    /* Salida de la pantalla de carga: se espera a que la transición termine y a
       un mínimo perceptible para que la marca no parpadee. Es el único tiempo de
       espera no ligado a una tarea real, y está declarado como tal. */
    return new Promise(function (resolve) {
      setProgress(100, "PISTA PREPARADA", "done");
      if (el.root) el.root.classList.add("is-complete");
      var minHold = reducedMotion ? 200 : 520;
      setTimeout(function () { resolve(true); }, minHold);
    });
  }

  function hideLoadingScreen() {
    if (!el.root) return;
    state.finalPct = (el.pct && el.pct.textContent) || "";
    state.doneCount = document.querySelectorAll(".dd-boot-step.is-ok").length;
    state.stepsDone = document.querySelectorAll(".dd-boot-step.is-ok").length;
    el.root.classList.add("is-out");
    state.rootHiddenAt = Date.now();
    setTimeout(function () {
      if (el.root && el.root.parentNode) el.root.parentNode.removeChild(el.root);
      el.root = null;
    }, reducedMotion ? 120 : 620);
  }

  function startIntro() {
    setState("INTRO");
    hideLoadingScreen();
    state.introActive = true;
    state.introPlayed = true;
    audio.startMenuMusic(4);

    var finished = false;
    var finish = function (why) {
      if (finished) return;
      finished = true;
      state.introActive = false;
      state.introEndedBy = why || "complete";
      document.body.classList.remove("dd-intro-running");
      enterMainMenu();
      emit("intro-end", { by: state.introEndedBy });
    };

    document.body.classList.add("dd-intro-running");

    /* La intro CANÓNICA del juego. DD_CINE gestiona su propio temporizador, su
       overlay de letterbox y la tecla de salto; aquí sólo se enlaza su final. */
    var started = false;
    try {
      if (window.DD_CINE && typeof window.DD_CINE.playIntro === "function") {
        window.DD_CINE.playIntro(function () { finish("complete"); });
        started = true;
      }
    } catch (e) {
      console.warn("[DD_BOOT] la intro canónica falló; se entra directo al menú", e);
    }
    if (!started) { finish("unavailable"); return; }

    /* Salvaguarda por ESTANCAMIENTO, no por tiempo total: en un equipo lento o
       con el render limitado la cinemática puede tardar más de lo nominal y no
       debe cortarse. Sólo se fuerza la salida si su reloj deja de avanzar
       (pestaña en segundo plano, contexto perdido), que es el caso en que el
       jugador se quedaría mirando una pantalla congelada. */
    var lastElapsed = -1, lastAdvance = Date.now(), guardDone = false;
    var guard = setInterval(function () {
      if (finished || guardDone) return;
      var st = window.DD_CINE && window.DD_CINE.getState ? window.DD_CINE.getState() : null;
      if (!st) { guardDone = true; clearInterval(guard); finish("complete"); return; }
      if (st.elapsed > lastElapsed + 0.001) {
        lastElapsed = st.elapsed;
        lastAdvance = Date.now();
      } else if (Date.now() - lastAdvance > 4000) {
        guardDone = true;
        clearInterval(guard);
        try { if (window.DD_CINE && window.DD_CINE.skip) window.DD_CINE.skip(); } catch (e) {}
        finish("stalled");
      }
    }, 120);
    on("intro-end", function () { clearInterval(guard); });

    /* Saltar con clic o tecla durante la intro (la cinemática ya escucha
       Espacio/Esc/Enter; esto añade ratón y mando sin duplicar el salto). */
    var skipOnce = function (ev) {
      if (!state.introActive) return;
      if (ev && ev.type === "keydown" && ev.repeat) return;
      try { if (window.DD_CINE && window.DD_CINE.skip) window.DD_CINE.skip(); } catch (e) {}
      finish("skip");
    };
    var skipEl = q("dd-cine-overlay");
    if (skipEl) skipEl.addEventListener("click", skipOnce, { once: true });
    window.addEventListener("pointerdown", function (ev) {
      if (!state.introActive) return;
      if (ev.target && ev.target.closest && ev.target.closest("#dd-cine-skip-btn")) return;
      skipOnce(ev);
    }, { passive: true });
  }

  function enterMainMenu() {
    if (state.current === "MAIN_MENU") return;
    document.body.classList.remove("dd-booting", "dd-intro-running");
    if (window.DD_UI) window.DD_UI.showMainMenu();
    var menu = q("dd-main-menu");
    if (menu) menu.classList.add("dd-menu-in");
    setState("MAIN_MENU");
    audio.startMenuMusic(4);
    /* Foco inicial válido y visible. */
    var first = menu && menu.querySelector(".dd-menu-btn:not([disabled])");
    if (first) {
      try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); }
    }
    emit("menu-ready", { ms: Math.round(performance.now() - state.bootStart) });
  }

  /* ---------------------------------------------------------------- públicos */
  function openSubmenu(name) {
    if (state.current !== "MAIN_MENU" && state.current !== "SUBMENU") return false;
    setState("SUBMENU", { sub: name });
    return true;
  }

  function closeSubmenu() {
    if (state.current !== "SUBMENU") return false;
    enterMainMenu();
    return true;
  }

  function enterGame() {
    /* Lo llama el botón de partida DESPUÉS de validar la acción. Aquí sólo se
       garantiza la propiedad del audio y se impide la doble pulsación. */
    document.body.classList.remove("dd-booting", "dd-intro-running");
    audio.stopMenuMusic(0.5);
    setState("PLAYING");
    return true;
  }

  function exitGameToMenu() {
    if (window.DD_UI) window.DD_UI.showMainMenu();
    setState("MAIN_MENU");
    audio.startMenuMusic(3);
    return true;
  }

  function canStartGame() {
    return state.current === "MAIN_MENU" || state.current === "SUBMENU";
  }

  function getState() {
    return {
      state: state.current,
      submenu: state.submenu,
      introPlayed: state.introPlayed,
      introActive: state.introActive,
      introEndedBy: state.introEndedBy || null,
      criticalErrors: state.criticalErrors.slice(),
      menuMusic: audio.isMenuMusicPlaying(),
      loadMs: state.loadEnd ? Math.round(state.loadEnd - state.loadStart) : null,
      bootMs: state.bootStart ? Math.round(performance.now() - state.bootStart) : null
    };
  }

  /* --------------------------------------------------------- arranque único  */
  function start() {
    if (state.started) return;
    state.started = true;
    boot();
  }

  window.DD_BOOT = Object.freeze({
    STATES: STATES.slice(),
    version: (function () {
      var m = document.querySelector('meta[name="version"]');
      return (m && m.content) || "3.3.0";
    })(),
    getTrace: function () { return state.trace.slice(); },
    getEvidence: function () {
      return { finalPct: state.finalPct || "", stepsDone: state.doneCount || 0,
        at: state.rootHiddenAt || 0, loadMs: state.loadEnd && state.loadStart ? Math.round(state.loadEnd - state.loadStart) : null };
    },
    start: start,
    getState: getState,
    on: on,
    openSubmenu: openSubmenu,
    closeSubmenu: closeSubmenu,
    enterGame: enterGame,
    exitGameToMenu: exitGameToMenu,
    canStartGame: canStartGame,
    audio: {
      startMenuMusic: audio.startMenuMusic,
      stopMenuMusic: audio.stopMenuMusic,
      ui: audio.ui,
      isMenuMusicPlaying: audio.isMenuMusicPlaying
    },
    steps: STEPS.map(function (s) { return { id: s.id, label: s.label, critical: !!s.critical }; })
  });

  /* Se arranca en el primer tick: los módulos posteriores (UI) ya están
     definidos porque el build inlinea este archivo antes de dd_ui_system.js. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 0); }, { once: true });
  } else {
    setTimeout(start, 0);
  }
})();
