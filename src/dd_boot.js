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
  var ESSENTIAL_IDS = ["engine", "assets", "ui"];
  /* Límite del perro guardián del arranque. Se expone para poder probarlo sin
     esperar 20 s reales en cada ejecución. */
  var WATCHDOG_MS = 20000;
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
    trace: [],              /* evidencia real de progreso (paso → %), sin temporizadores */
    bootToken: 0,           /* identifica el intento de arranque en curso */
    watchdog: 0,
    watchdogFired: false,
    loadFinished: false,    /* la carga terminó: el watchdog ya no debe actuar */
    errorRegistry: []       /* registro CENTRALIZADO de errores del arranque */
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
    /* FASE 01.4 · ACCESIBILIDAD DEL ARMAZÓN (causa raíz corregida).
       Antes el armazón nacía con aria-hidden="true" y aquí se le añadía
       role="dialog" + aria-modal="true". Esa combinación es contradictoria: un
       diálogo modal oculto al árbol de accesibilidad no existe para un lector de
       pantalla, pero el foco SÍ se movía dentro (a REINTENTAR) y Chromium expone
       el nodo enfocado aunque esté en un subárbol aria-hidden (verificado: con
       el foco fuera, el mismo subárbol desaparece del árbol AX). Resultado: el
       panel de error quedaba accesible por accidente y de forma frágil, y la
       pantalla de carga no tenía semántica propia.
       Ahora la semántica se fija por ESTADO y de forma coherente:
         · cargando  -> role="progressbar" + aria-busy="true"   (region viva)
         · error     -> role="alertdialog" + aria-modal="true"  (hay que actuar)
         · retirado  -> aria-hidden="true" antes de salir del DOM
       El armazón visible NUNCA lleva aria-hidden: mientras se ve, su contenido
       (progreso, errores, botones) debe estar disponible para tecnologías de
       asistencia. */
    root.setAttribute("role", "progressbar");
    root.setAttribute("aria-label", "Cargando DEADBEAT DISCO");
    root.setAttribute("aria-busy", "true");
    root.removeAttribute("aria-hidden");
    root.removeAttribute("aria-modal");
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
      /* Recurso IMPRESCINDIBLE: sin lienzo no hay juego. Debe coincidir con
         ESSENTIAL_IDS; antes faltaba y la ausencia de canvas no era fatal. */
      critical: true,
      run: function () {
        /* VALIDACIÓN REAL DEL MOTOR (FASE 01.4 · P0).
           Antes sólo se comprobaba que #game existiera y que tuviera getContext;
           la presencia del puente se devolvía como DATO informativo, así que un
           arranque sin puente pasaba como correcto y luego la entrada en partida
           era imposible. Ahora se comprueba lo que el arranque necesita de verdad,
           usando SÓLO métodos que el puente expone (contrato real:
           isRunning / startRun / getSnapshot). */
        var g = q("game");
        if (!g) throw new Error("No se encontró el lienzo del juego (#game).");
        if (!g.getContext) throw new Error("El lienzo del juego (#game) no admite contexto gráfico.");

        /* Puente del motor: es el contrato real que usa la entrada en partida.
           Se comprueba ANTES que el contexto para que el diagnóstico sea exacto:
           si el motor no llegó a inicializarse (p. ej. porque no pudo crear su
           contexto), el puente tampoco existirá y el mensaje debe decir la causa
           real, no un síntoma derivado. */
        var br = window.__DD_BRIDGE;
        if (!br) {
          /* Distinguir las dos causas para que el mensaje sea útil. */
          var ctxProbe = null;
          try { ctxProbe = g.getContext("2d"); } catch (e) { ctxProbe = "threw"; }
          if (ctxProbe === null) {
            throw new Error("El lienzo del juego no pudo crear el contexto gráfico (2d): " +
              "por eso el motor no llegó a inicializarse.");
          }
          throw new Error("El puente del motor (__DD_BRIDGE) no está disponible.");
        }

        /* Métodos mínimos del contrato. Se comprueban ANTES de invocarlos. */
        if (typeof br.isRunning !== "function") {
          throw new Error("El puente del motor no expone isRunning(): no se puede confirmar una partida.");
        }
        if (typeof br.startRun !== "function") {
          throw new Error("El puente del motor no expone startRun(): no se puede iniciar una partida.");
        }

        /* Contexto gráfico REAL. En algunos entornos getContext("2d") devuelve
           null sin lanzar, así que la mera existencia del método no demuestra
           nada. Con el motor ya inicializado, se exige que el contexto pueda
           obtenerse; si no, sólo se tolera cuando el propio motor confirma que
           está en marcha (prueba viva de que el canvas es utilizable). */
        var ctx = null;
        try {
          ctx = g.getContext("2d");
        } catch (e) {
          throw new Error("No se pudo obtener el contexto gráfico del juego: " +
            ((e && e.message) || String(e)));
        }
        if (!ctx) {
          var running0 = false;
          try { running0 = br.isRunning() === true; } catch (e) { running0 = false; }
          var hub0 = !!(window.DD_HUB && window.DD_HUB.isActive());
          if (!running0 && !hub0) {
            throw new Error("El lienzo del juego no pudo crear el contexto gráfico (2d).");
          }
        }

        /* Sonda REAL del método de confirmación: debe poder invocarse. Una
           excepción aquí significa que el arranque no podrá verificar nunca el
           estado del motor, así que es fatal, no degradable. */
        var running = null;
        try {
          running = br.isRunning() === true;
        } catch (e) {
          throw new Error("El puente del motor lanzó una excepción al comprobar isRunning(): " +
            ((e && e.message) || String(e)));
        }

        return {
          canvas: g.width + "x" + g.height,
          context: ctx ? "ok" : "tomado por el motor",
          bridge: true,
          running: running
        };
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
      timeoutMs: 7000,
      label: "IMÁGENES ESENCIALES",
      detail: "Esperando las imágenes de arranque y del menú…",
      critical: true,
      run: function () {
        var ids = ["player_idle_00", "player_walk_00", "player_walk_01", "player_walk_02", "player_walk_03", "player_shoot_00", "logo_deadbeat_cinematic"];
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
      timeoutMs: 7000,
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
      id: "opening",
      timeoutMs: 9000,
      label: "INTRODUCCIÓN",
      detail: "Cargando los planos de la introducción y del descenso…",
      run: function () {
        if (!window.DD_OPENING) throw new Error("La introducción no está disponible.");
        var t0 = performance.now();
        return window.DD_OPENING.preload().then(function (r) {
          if (r.missing.length) throw new Error("Faltan planos de la introducción: " + r.missing.join(", "));
          return { files: r.total, ms: Math.round(performance.now() - t0) };
        });
      }
    },
    {
      id: "fonts",
      timeoutMs: 4000,
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
        /* Componente OPCIONAL: si falta, el juego sigue siendo funcional, pero
           debe quedar REGISTRADO como degradado con su motivo. Antes se
           devolvía "missing" sin marcar degraded, así que el fallo no aparecía
           en ningún registro y una prueba podía dar por bueno su detección. */
        if (!has) {
          return {
            engine: "no disponible",
            state: "missing",
            degraded: true,
            reason: "Motor de audio no disponible (DDC_COVER.music)."
          };
        }
        return { engine: "DDC_COVER.music", state: cover.music.ready ? "ready" : "cold" };
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

  /* --------------------------------------------------- registro de errores
     Único punto de entrada de los errores del arranque. Cada entrada declara
     explícitamente su gravedad, si es fatal, si degrada y cuándo ocurrió, de
     modo que cualquier consumidor (panel, modo seguro, QA) lea UNA sola verdad.
     `criticalErrors` se mantiene sincronizado por compatibilidad con el código
     existente, pero ya no es la fuente principal. */
  function recordError(stepId, message, opts) {
    var o = opts || {};
    var entry = {
      id: stepId,
      message: String(message == null ? "" : message),
      severity: o.fatal ? "fatal" : (o.degraded ? "warning" : "recoverable"),
      fatal: !!o.fatal,
      degraded: !!o.degraded,
      essential: !!o.essential,
      kind: o.kind || "unknown",
      at: Math.round(performance.now())
    };
    state.errorRegistry.push(entry);
    /* Vista compatible: {id, message, fatal} como antes. */
    state.criticalErrors.push({ id: entry.id, message: entry.message, fatal: entry.fatal });
    emit("boot-error", entry);
    return entry;
  }

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

  /* Los recursos de presentación no pueden bloquear el acceso al menú.
     Los pasos esenciales siguen siendo fatales y conservan su diagnóstico. */
  function runStepWithTimeout(step) {
    var timeoutMs = Number(step.timeoutMs) > 0 ? Number(step.timeoutMs) : 5000;
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timer = setTimeout(function () {
        finish(reject, new Error("La comprobación " + step.id + " superó " + timeoutMs + " ms."));
      }, timeoutMs);
      function finish(fn, value) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn(value);
      }
      Promise.resolve().then(step.run).then(
        function (value) { finish(resolve, value); },
        function (error) { finish(reject, error); }
      );
    });
  }

  function runSteps() {
    buildBootUI();
    renderSteps();
    watchLogo();
    el.err.hidden = true;
    el.root.classList.remove("is-degraded");
    state.criticalErrors.length = 0;
    state.errorRegistry.length = 0;
    state.loadFinished = false;
    state.watchdogFired = false;
    var token = ++runToken;
    var total = STEPS.length;
    var done = 0;

    return STEPS.reduce(function (chain, step) {
      return chain.then(function () {
        if (token !== runToken) return null;
        markStep(step.id, "run");
        if (el.stage) el.stage.textContent = step.label;
        return runStepWithTimeout(step)
          .then(function (result) {
            /* CANCELACIÓN LÓGICA (FASE 01.4 · P0).
               Comprobar el token SÓLO antes del paso no basta: si un paso queda
               pendiente y el watchdog dispara, al resolverse tarde se ejecutaría
               markStep/done++/setProgress sobre el intento NUEVO. Se comprueba
               también DESPUÉS del await: un intento caducado no escribe nada. */
            if (token !== runToken) return null;
            markStep(step.id, "ok");
            if (result && result.degraded) {
              markStep(step.id, "warn", "modo degradado");
              recordError(step.id, (result.reason || "degradado"), {
                essential: ESSENTIAL_IDS.indexOf(step.id) >= 0,
                fatal: false,
                degraded: true,
                kind: "degraded"
              });
            }
            emit("step", { id: step.id, ok: true, result: result });
          })
          .catch(function (err) {
            if (token !== runToken) return null;
            var msg = (err && err.message) || String(err);
            markStep(step.id, "fail", msg);
            /* La gravedad se decide por la clasificación del PASO, y la
               clasificación de "imprescindible" es UNA sola: ESSENTIAL_IDS.
               Antes se usaba sólo step.critical, de modo que engine (que estaba
               en ESSENTIAL_IDS pero no tenía critical) fallaba sin ser fatal. */
            var essential = ESSENTIAL_IDS.indexOf(step.id) >= 0;
            var fatal = essential && !state.allowSafeMode;
            recordError(step.id, msg, {
              essential: essential,
              fatal: fatal,
              degraded: false,
              kind: essential ? "essential-failure" : "optional-failure"
            });
            emit("step", { id: step.id, ok: false, error: msg, fatal: fatal });
            if (fatal) throw err;
          })
          .then(function () {
            if (token !== runToken) return null;
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
        /* El título debe decir la verdad. Un fallo fatal O un arranque que no
           llegó a completarse (perro guardián) NO es "modo degradado": antes,
           un timeout sin errores registrados mostraba "EL CLUB ABRE EN MODO
           DEGRADADO" sobre una carga bloqueada, que es lo contrario de lo que
           estaba pasando. */
        var blocked = state.criticalErrors.filter(function (e) { return e.fatal; }).length > 0 ||
                      state.watchdogFired ||
                      !state.loadFinished;
        el.errTitle.textContent = blocked
          ? "NO SE PUDO ABRIR EL CLUB"
          : "EL CLUB ABRE EN MODO DEGRADADO";
      }
      if (el.errBody) {
        el.errBody.textContent = msg + " · Revisa la consola para el detalle. Puedes reintentar o continuar en modo seguro.";
      }

      /* ACCESIBILIDAD (FASE 01.4). El panel tenía role="alert" pero el título y
         el cuerpo no estaban asociados programáticamente al diálogo, y el foco
         se quedaba donde estuviera (a menudo en <body>), de modo que quien navega
         con teclado o lector de pantalla no llegaba a los botones de recuperación
         sin recorrer todo el árbol. Se asocia y se mueve el foco al primer
         control útil. No cambia nada visual. */
      try {
        el.err.setAttribute("aria-labelledby", "dd-boot-err-title");
        if (document.getElementById("dd-boot-err-body")) {
          el.err.setAttribute("aria-describedby", "dd-boot-err-body");
        }
        if (el.err.getAttribute("aria-live") === null) el.err.setAttribute("aria-live", "assertive");
        if (!el.err.hasAttribute("tabindex")) el.err.setAttribute("tabindex", "-1");
        /* FASE 01.4 · el panel pasa a mandar: el armazón se declara alertdialog
           modal. NO se le quita aquí aria-hidden "por si acaso": hacerlo taparía
           la causa raíz. Si el armazón naciera oculto, esta limpieza dejaría el
           panel accesible sin haber corregido nada y la prueba R10 pasaría con
           el defecto presente (comprobado durante el desarrollo). El armazón no
           debe estar oculto nunca mientras se ve: eso se garantiza al adoptarlo
           (buildBootUI), no aquí. */
        if (el.root) {
          el.root.setAttribute("role", "alertdialog");
          el.root.setAttribute("aria-modal", "true");
          el.root.setAttribute("aria-label", "Error al abrir DEADBEAT DISCO");
          el.root.setAttribute("aria-busy", "false");
        }
      } catch (e) {}

      if (el.root) el.root.classList.add("is-failed");   /* vuelve a mostrar el diagnóstico */
      if (el.stage) el.stage.textContent = "ERROR DE INICIALIZACIÓN";
      var retry = q("dd-boot-retry");
      var safe = q("dd-boot-safe");
      if (retry) retry.onclick = function () {
        audio.ui("ok");
        /* Marca observable de que el REINTENTAR real se activó. Se escribe sólo
           para que la verificación pueda distinguir "el botón pidió recarga" de
           "el botón no hizo nada"; NO altera el comportamiento. La navegación la
           hace el navegador con location.reload(), como siempre. */
        try { document.documentElement.setAttribute("data-dd-retry", "1"); } catch (e) {}
        location.reload();
      };
      /* Foco al panel de error: primero el botón útil (REINTENTAR), y si no se
         puede, el propio panel. Se respeta el orden natural de tabulación. */
      try {
        var focusTarget = !!(retry && !retry.disabled) ? retry : el.err;
        if (focusTarget && typeof focusTarget.focus === "function") {
          try { focusTarget.focus({ preventScroll: true }); } catch (e) { focusTarget.focus(); }
        }
      } catch (e) {}

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

    /* Perro guardián del arranque.
       Vigila el estado REAL de carga (LOADING) y se identifica por token, no por
       estado: si se reintenta, el temporizador del intento anterior ya no puede
       disparar un error sobre el nuevo. Nunca actúa si la carga terminó, si el
       estado ya avanzó o si el panel de error ya está visible. */
    state.bootToken = (state.bootToken || 0) + 1;
    var bootToken = state.bootToken;
    clearTimeout(state.watchdog);
    state.watchdog = setTimeout(function () {
      if (bootToken !== state.bootToken) return;          /* intento caducado */
      if (state.loadFinished) return;                     /* ya cargó */
      if (state.current !== "LOADING" && state.current !== "BOOT") return;
      if (el.err && !el.err.hidden) return;               /* ya hay panel */
      /* CANCELACIÓN LÓGICA (FASE 01.4 · P0).
         Cancelar el temporizador no detiene el trabajo asíncrono que ya está en
         vuelo. Al dispararse, el intento se INVALIDA subiendo runToken: así los
         pasos pendientes dejan de escribir progreso y, sobre todo, la cadena de
         runSteps() ya no puede devolver `true` y arrancar la intro DESPUÉS de
         haber mostrado el error. */
      runToken++;
      state.watchdogFired = true;
      showError(new Error("El arranque tardó demasiado (" + WATCHDOG_MS + " ms). " +
        "Puedes reintentar o usar el modo seguro."));
    }, WATCHDOG_MS);
    state.watchdog = state.watchdog;

    return runSteps()
      .then(function (ok) {
        /* El intento debe seguir siendo el vigente: runSteps() devuelve false si
           fue invalidado por el watchdog. Doble cinturón con el token real de
           este boot(): si otro intento tomó el relevo, este no toca nada. */
        if (!ok) return;
        if (bootToken !== state.bootToken) return;
        state.loadFinished = true;          /* ya no hay nada que vigilar */
        clearTimeout(state.watchdog);
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
    /* Salida de la pantalla de carga. Dos esperas, las dos declaradas:
       1) un mínimo perceptible para que la marca no parpadee;
       2) si el navegador aún no ha recibido ninguna pulsación, se pide una. Sin
          ella el navegador bloquea el sonido y la intro empezaría muda. */
    return new Promise(function (resolve) {
      setProgress(100, "PISTA PREPARADA", "done");
      if (el.root) el.root.classList.add("is-complete");
      var minHold = reducedMotion ? 200 : 520;
      setTimeout(function () {
        var active = true;
        try { if (navigator.userActivation) active = navigator.userActivation.hasBeenActive; } catch (e) {}
        if (active) { resolve(true); return; }
        state.waitingGesture = true;
        if (el.root) el.root.classList.add("is-waiting");
        if (el.stage) el.stage.textContent = "PULSA CUALQUIER TECLA PARA EMPEZAR";
        var done = false, poll = 0;
        var go = function (ev) {
          if (done) return;
          if (ev && ev.type === "keydown" && /^(F\d+|Tab|Shift.*|Control.*|Alt.*|Meta.*)$/.test(ev.code || "")) return;
          done = true;
          state.waitingGesture = false;
          document.removeEventListener("keydown", go, true);
          window.removeEventListener("pointerdown", go, true);
          clearInterval(poll);
          if (el.root) el.root.classList.remove("is-waiting");
          resolve(true);
        };
        /* en document: el guardián de teclado del build anula los keydown de captura sobre window */
        document.addEventListener("keydown", go, true);
        window.addEventListener("pointerdown", go, true);
        poll = setInterval(function () {
          try {
            var pads = navigator.getGamepads ? navigator.getGamepads() : [];
            for (var i = 0; i < pads.length; i++) {
              var gp = pads[i];
              if (gp && gp.connected && gp.buttons.some(function (b) { return b && b.pressed; })) { go(null); return; }
            }
          } catch (e) {}
        }, 80);
      }, minHold);
    });
  }

  function hideLoadingScreen() {
    if (!el.root) return;
    state.finalPct = (el.pct && el.pct.textContent) || "";
    state.doneCount = document.querySelectorAll(".dd-boot-step.is-ok").length;
    state.stepsDone = document.querySelectorAll(".dd-boot-step.is-ok").length;
    /* FASE 01.4 · Estado RETIRADO. El armazón deja de ser relevante en cuanto
       arranca la intro o el menú, así que se oculta a tecnologías de asistencia
       ANTES de salir del DOM (la transición visual dura hasta 620 ms) y se
       devuelve el foco al documento si estaba dentro, para no dejar el foco
       atrapado en un subárbol que ya no debe anunciarse. */
    try {
      el.root.setAttribute("aria-hidden", "true");
      el.root.removeAttribute("aria-modal");
      el.root.setAttribute("aria-busy", "false");
      var dentro = document.activeElement;
      if (dentro && el.root.contains(dentro)) {
        if (dentro.blur) dentro.blur();
        if (document.body && document.body.focus) {
          try { document.body.setAttribute("tabindex", "-1"); } catch (e2) {}
          try { document.body.focus({ preventScroll: true }); } catch (e2) {}
        }
      }
    } catch (e) {}
    el.root.classList.add("is-out");
    state.rootHiddenAt = Date.now();
    setTimeout(function () {
      if (el.root && el.root.parentNode) el.root.parentNode.removeChild(el.root);
      el.root = null;
    }, reducedMotion ? 120 : 620);
  }

  function startIntro() {
    /* Última barrera (FASE 01.4 · P0): la intro no puede activarse si el panel
       de error está visible o si el intento quedó invalidado. Antes, una carga
       que terminaba tarde entraba a INTRO sobre un arranque ya fallido. */
    if (state.watchdogFired) return;
    if (el.err && !el.err.hidden) return;
    setState("INTRO");
    hideLoadingScreen();
    state.introActive = true;
    state.introPlayed = true;

    /* La intro termina SIEMPRE en el menú principal (completa, saltada, no
       disponible o estancada). Nunca arranca partida ni entra al Refugio. */
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

    /* «La noche que vuelve» (DD_OPENING): lienzo y reloj propios, sonido
       programado contra ese reloj. El tema del menú arranca en el golpe del
       título (plano 7), no antes. */
    var started = false;
    try {
      if (window.DD_OPENING && typeof window.DD_OPENING.playIntro === "function") {
        started = window.DD_OPENING.playIntro(function (why) { finish(why || "complete"); }, {
          onTitle: function () { audio.startMenuMusic(4); }
        }) !== false;
      }
    } catch (e) {
      console.warn("[DD_BOOT] la intro falló; se entra directo al menú", e);
    }
    if (!started) { finish("unavailable"); return; }

    /* Salvaguarda por ESTANCAMIENTO, no por tiempo total: sólo se fuerza la
       salida si el reloj de la intro deja de avanzar (pestaña en segundo plano,
       contexto perdido), que es cuando el jugador vería una imagen congelada. */
    var lastElapsed = -1, lastAdvance = Date.now();
    var guard = setInterval(function () {
      if (finished) { clearInterval(guard); return; }
      var st = window.DD_OPENING.getState();
      if (!st) { clearInterval(guard); finish("complete"); return; }
      if (st.frozen || st.elapsed > lastElapsed + 0.001) {
        lastElapsed = st.elapsed;
        lastAdvance = Date.now();
      } else if (Date.now() - lastAdvance > 4000 && !document.hidden) {
        clearInterval(guard);
        try { window.DD_OPENING.skip(); } catch (e) {}
        finish("stalled");
      }
    }, 120);
  }

  function enterMainMenu() {
    if (state.current === "MAIN_MENU") return;
    document.body.classList.remove("dd-booting", "dd-intro-running");
    if (window.DD_UI) window.DD_UI.showMainMenu();
    var menu = q("dd-main-menu");
    if (menu) menu.classList.add("dd-menu-in");
    setState("MAIN_MENU");
    if (!audio.isMenuMusicPlaying()) audio.startMenuMusic(4);
    /* Foco inicial válido y visible. */
    /* Al volver de un submenú se conserva la opción que estaba elegida. */
    var first = menu && (menu.querySelector(".dd-menu-btn.dd-selected:not([disabled]):not([hidden])") || menu.querySelector(".dd-menu-btn:not([disabled]):not([hidden])"));
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
       garantiza la propiedad del audio y se impide la doble pulsación.
       Sólo es válido desde el menú o un submenú: una partida no puede empezar
       durante el arranque ni desde la intro. Si la transición no procede, se
       rechaza sin tocar el estado (ningún estado a medias). */
    if (!canStartGame()) return false;
    /* Y sólo si el motor está realmente en marcha. Se comprueba aquí, no sólo en
       la UI, para que la garantía valga también para cualquier llamada directa
       al API: PLAYING no se declara nunca sobre un motor parado. */
    /* Sólo se acepta EVIDENCIA POSITIVA de que el motor está en marcha.
       Antes, si no había puente o no se podía consultar isRunning(), se daba por
       bueno ("else engineUp = true"): eso convertía la ignorancia en permiso y
       permitía declarar PLAYING sobre un motor que nadie había confirmado.
       Ahora la ausencia de señal es un NO. */
    var engineUp = false;
    try {
      if (window.DD_HUB && window.DD_HUB.isActive()) {
        engineUp = true;                                    /* HUB activo = motor vivo */
      } else if (window.__DD_BRIDGE && typeof window.__DD_BRIDGE.isRunning === "function") {
        engineUp = window.__DD_BRIDGE.isRunning() === true;  /* confirmación explícita */
      } else {
        engineUp = false;                                    /* desconocido => no */
      }
    } catch (e) { engineUp = false; }
    if (!engineUp) {
      /* Se deja constancia: no se entra en partida sin motor confirmado. */
      return false;
    }
    /* La entrada en partida CIERRA la transición que la trajo aquí (FASE 01.4).
       La cinemática de descenso queda activa cuando se entra a PLAYING: su
       bloqueo (\`DD_CINE.isBlocking()\`) hace que tickInner mantenga el HUD oculto
       durante el resto de la secuencia, y el jugador empezaba la partida sin HUD.
       Se cierra la secuencia (equivale a saltarla, que es lo que hace skip()) y
       se retira la clase de propiedad del menú. Antes de este cambio el estado
       era PLAYING con el HUD oculto; medido, no deducido. */
    document.body.classList.remove("dd-booting", "dd-intro-running", "dd-menu-owning");
    try {
      if (window.DD_CINE && typeof window.DD_CINE.isBlocking === "function" &&
          window.DD_CINE.isBlocking() && typeof window.DD_CINE.skip === "function") {
        window.DD_CINE.skip();
      }
    } catch (e) { console.warn("[DD_BOOT] no se pudo cerrar la transición", e); }
    audio.stopMenuMusic(0.5);
    setState("PLAYING");
    /* Si el HUD seguía oculto por el bloqueo de la cinemática, se restaura. */
    var hud = document.getElementById("dd-hud");
    if (hud) hud.classList.remove("dd-hidden");
    return true;
  }

  function exitGameToMenu() {
    if (window.DD_UI) window.DD_UI.showMainMenu();
    setState("MAIN_MENU");
    if (!audio.isMenuMusicPlaying()) audio.startMenuMusic(3);
    return true;
  }

  function canStartGame() {
    return state.current === "MAIN_MENU" || state.current === "SUBMENU" || state.current === "PLAYING";
  }

  function getState() {
    return {
      state: state.current,
      submenu: state.submenu,
      introPlayed: state.introPlayed,
      introActive: state.introActive,
      introEndedBy: state.introEndedBy || null,
      waitingGesture: !!state.waitingGesture,
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
      return {
        finalPct: state.finalPct || "",
        stepsDone: state.doneCount || 0,
        at: state.rootHiddenAt || 0,
        loadMs: state.loadEnd && state.loadStart ? Math.round(state.loadEnd - state.loadStart) : null,
        /* Registro real de errores del arranque. Antes NO se exponía, y las
           pruebas que lo consultaban recibían undefined -> [] y daban por bueno
           un "todo no fatal" que nunca se había comprobado. */
        errors: state.errorRegistry.slice(),
        degraded: state.errorRegistry.some(function (e) { return e.degraded; }),
        watchdogFired: !!state.watchdogFired,
        loadFinished: !!state.loadFinished
      };
    },
    start: start,
    getState: getState,
    on: on,
    openSubmenu: openSubmenu,
    closeSubmenu: closeSubmenu,
    enterGame: enterGame,
    exitGameToMenu: exitGameToMenu,
    canStartGame: canStartGame,
    ESSENTIAL_IDS: ESSENTIAL_IDS.slice(),
    WATCHDOG_MS: WATCHDOG_MS,
    getErrorRegistry: function () { return state.errorRegistry.slice(); },
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
