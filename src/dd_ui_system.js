/* ==========================================================================
   DEADBEAT DISCO — FASE 01 · MENÚ PRINCIPAL DEFINITIVO + SUBMENÚS
   (window.DD_UI, ampliación de la capa HD existente)

   Qué conserva: el HUD unificado, el minimapa isométrico, la armería/tienda,
   el mapa de la torre, el cuadro de diálogo del DJ y el mando. Nada de eso se
   reescribe aquí; esta pieza añade la capa de MENÚ y SUBMENÚS de la Fase 01 y
   arregla los enlaces que estaban rotos (OPCIONES salía del menú, no existían
   CRÉDITOS ni SELECCIÓN DE PARTIDA, el teclado no navegaba el menú…).

   Contrato de entrada: DD_BOOT es dueño de la FSM; este módulo NO cambia de
   estado por su cuenta, sólo pide transiciones.
   ========================================================================== */
(function () {
  "use strict";

  /* El Refugio no es el círculo I. Los nombres y el orden vienen del motor;
     mantener una tabla paralela desfasada rotulaba LIMBO como Refugio. */
  function circleInfo() {
    var br = window.__DD_BRIDGE;
    var list = br && br.getCircles ? br.getCircles() : [];
    var roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
    return list.map(function (c, i) {
      return { idx: i, code: c.final ? "FINAL" : (roman[i] || String(i + 1)), name: c.name, place: c.place || "" };
    });
  }

  var uiState = {
    initialized: false,
    menuVisible: true,
    menuIndex: 0,
    shopOpen: false,
    mapOpen: false,
    resultsOpen: false,
    resultsIndex: 0,
    submenu: null,              /* OPCIONES / CRÉDITOS / PARTIDAS */
    submenuIndex: 0,
    busy: false,                /* anti doble pulsación */
    selectedCategory: "TODAS",
    selectedWeaponId: "m1911",
    dialogueTimer: 0,
    dialogueSource: null,
    lastSubsText: "",
    gpCooldown: 0,
    kbCooldown: 0
  };

  /* ------------------------------------------------------------ utilidades */
  function assetSrc(id, fallbackDataKey) {
    if (window.DD_ASSETS && window.DD_ASSETS.manifest && window.DD_ASSETS.manifest.entries[id]) {
      return window.DD_ASSETS.manifest.entries[id].src;
    }
    if (fallbackDataKey && window.__HD_DATA && window.__HD_DATA[fallbackDataKey]) {
      return window.__HD_DATA[fallbackDataKey];
    }
    return "";
  }

  /* Backdrop del menú (ENTREGA 03.2). El asset A es la maestra aprobada; el PNG
     original sigue siendo la red de seguridad. DD_ASSETS llama a refreshAssets
     en CADA onload del precargador (decenas de veces durante el arranque), así
     que la señal de fallback debe ser sticky: una vez que el <img> cae al PNG,
     todos los refrescos posteriores conservan el PNG. Sin este estado, la
     última escritura ganaba y el fondo quedaba roto para siempre aunque el
     onerror inline hubiera actuado a tiempo. */
  function menuBackdropSrc() {
    /* PROJECT RESTART: el fondo del menú es el último plano de la intro. */
    return "assets/ui/scenes/portada_descenso.jpg";
  }

  function weaponImgSrc(wid) {
    var key = "weapon_" + wid;
    if (window.DD_ASSETS && window.DD_ASSETS.manifest && window.DD_ASSETS.manifest.entries[key]) {
      return window.DD_ASSETS.manifest.entries[key].src;
    }
    var k2 = "weapons/weapon_" + wid + ".png";
    if (window.__HD_DATA && window.__HD_DATA[k2]) return window.__HD_DATA[k2];
    return "";
  }

  function store(key, fallback) {
    try {
      var v = window.localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function storeNum(key, fallback) {
    var n = parseInt(store(key, ""), 10);
    return isFinite(n) ? n : fallback;
  }

  function storeJson(key) {
    try {
      var v = window.localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  }

  function el(id) { return document.getElementById(id); }

  function sfx(kind) {
    if (window.DD_BOOT && window.DD_BOOT.audio) window.DD_BOOT.audio.ui(kind);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ============================ A. MENÚ PRINCIPAL ========================= */
  var MENU_ITEMS = [
    { action: "play", label: "JUGAR", sub: "Nueva partida o continuar" },
    { action: "customize", label: "PERSONALIZAR", sub: "El camerino" },
    { action: "progression", label: "PROGRESIÓN", sub: "Tus registros" },
    { action: "options", label: "OPCIONES", sub: "Audio, vídeo y controles" },
    { action: "extras", label: "EXTRAS", sub: "Archivo del club" },
    { action: "exit", label: "SALIR", sub: "Apagar las luces" }
  ];

  /* ------------------------------ guardado -------------------------------- */
  /* El motor no guarda incursiones a medias. Lo que identifica una partida es
     esta ficha (creada al llegar al Refugio por primera vez) más el progreso
     permanente que el propio motor ya persiste. */
  var SAVE_KEY = "dd_save_v1";
  /* Reparto de lo que hay en localStorage. Es la única lista: la usan NUEVA
     PARTIDA, BORRAR DATOS y las pruebas.
     - RUN: estado de la partida en curso. NUEVA PARTIDA lo reinicia.
     - PERMANENT: desbloqueos, recursos, estadísticas e hitos. Sólo los toca
       BORRAR DATOS, con confirmación.
     - SETTINGS: ajustes. No los borra nadie. */
  var STORAGE = {
    RUN: [
      { key: "dd_save_v1", label: "Ficha de la partida actual" },
      { key: "dmo_floor_v32", label: "Planta generada de la última incursión" }
    ],
    PERMANENT: [
      { key: "dd_appearance_v1", label: "Aspecto seleccionado" },
      { key: "dmodisco_currency_v1", label: "Fichas" },
      { key: "dmodisco_upgrades_v1", label: "Mejoras compradas" },
      { key: "dmodisco_weapon_prestige_v1", label: "Prestigio de armas" },
      { key: "dmodisco_ach_v1", label: "Logros" },
      { key: "dmodisco_best_v5", label: "Mejor puntuación" },
      { key: "dmodisco_best_round_v1", label: "Sala más profunda" },
      { key: "dmodisco_best_combo_v216", label: "Mejor combo" },
      { key: "dmodisco_hist_v3", label: "Historial de incursiones" },
      { key: "dmo_victories_v214", label: "Victorias" },
      { key: "dmo_secret_route_v32", label: "Ruta secreta" }
    ],
    SETTINGS: [
      { key: "dmodisco_vol_v1", label: "Mezcla de sonido" },
      { key: "dmodisco_muted_v1", label: "Silencio" },
      { key: "ddc_cover_settings_v1", label: "Volumen del menú" },
      { key: "dmodisco_a11y_v1", label: "Vídeo y accesibilidad" },
      { key: "dmo_roll_v271", label: "Ajuste de la voltereta" }
    ]
  };
  function storageKeys(group) { return STORAGE[group].map(function (e) { return e.key; }); }
  /* NUEVA PARTIDA: sólo el estado de run que no es la ficha (la ficha se
     reescribe en writeSave). No toca nada de PERMANENT ni de SETTINGS. */
  function resetRunState() {
    var removed = [];
    STORAGE.RUN.forEach(function (e) {
      if (e.key === SAVE_KEY) return;
      try { if (window.localStorage.getItem(e.key) !== null) { window.localStorage.removeItem(e.key); removed.push(e.key); } } catch (err) {}
    });
    return removed;
  }
  /* BORRAR DATOS: partida y progreso permanente. Sólo se llama desde la
     confirmación explícita de OPCIONES. Devuelve las claves eliminadas. */
  function eraseAllProgress() {
    var removed = [];
    STORAGE.RUN.concat(STORAGE.PERMANENT).forEach(function (e) {
      try { if (window.localStorage.getItem(e.key) !== null) { window.localStorage.removeItem(e.key); removed.push(e.key); } } catch (err) {}
    });
    return removed;
  }
  function readSave() {
    var v = storeJson(SAVE_KEY);
    return v && typeof v === "object" && v.v === 1 ? v : null;
  }
  function writeSave(isNew) {
    var now = new Date().toISOString();
    var prev = readSave();
    /* Mismo formato (v: 1). `runs` es un campo añadido y opcional: cuenta las
       partidas empezadas en este navegador y sobrevive a NUEVA PARTIDA. */
    var rec = (!isNew && prev) ? prev : { v: 1, created: now, visits: 0, runs: ((prev && prev.runs) || (prev ? 1 : 0)) + 1 };
    rec.last = now;
    rec.visits = (rec.visits || 0) + 1;
    try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(rec)); return true; } catch (e) { return false; }
  }
  function hasSave() {
    return !!readSave() || readProgress().hasProgress;
  }
  /* CONTINUAR sólo existe en el menú cuando hay partida guardada. */
  function refreshContinue() {
    var btn = document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="continue"]');
    if (!btn) return;
    var on = hasSave();
    btn.hidden = !on;
    btn.disabled = !on;
    btn.setAttribute("aria-hidden", on ? "false" : "true");
    var btns = menuButtons();
    if (uiState.menuIndex >= btns.length) uiState.menuIndex = 0;
  }

  function buildMainMenu() {
    var menu = document.createElement("section");
    menu.id = "dd-main-menu";
    menu.className = "dd-rs";
    menu.setAttribute("aria-label", "Menú principal de DEADBEAT DISCO");

    var nav = MENU_ITEMS.map(function (it, i) {
      return '<button type="button" class="dd-menu-btn' + (i === 0 ? " dd-selected" : "") + '" ' +
        'data-action="' + it.action + '" data-index="' + i + '"' + (i === 0 ? ' tabindex="0"' : ' tabindex="-1"') + '>' +
        '<span class="dd-btn-icon" aria-hidden="true"></span>' +
        '<span class="dd-btn-text"><b>' + esc(it.label) + '</b><small>' + esc(it.sub) + '</small></span>' +
        '<span class="dd-btn-mark" aria-hidden="true"></span>' +
        '</button>';
    }).join("");

    menu.innerHTML =
      '<img id="dd-menu-backdrop" alt="" onerror="this.onerror=null;this.style.visibility=\'hidden\'" src="' + menuBackdropSrc() + '">' +
      '<div class="dd-menu-atmos" aria-hidden="true"><i class="a1"></i><i class="a2"></i><i class="a3"></i></div>' +
      '<div class="dd-menu-vig" aria-hidden="true"></div>' +
      '<div class="dd-menu-beat-light" aria-hidden="true"></div>' +
      '<div class="dd-menu-stage" aria-hidden="true"><div class="dd-menu-orbit"></div><div class="dd-menu-beam"></div><div class="dd-menu-eq"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="dd-menu-stage-label">LA TORRE TE ESPERA <span>✦</span> 09 CÍRCULOS</div></div>' +
      '<div class="dd-menu-left">' +
      '  <div class="dd-menu-brand">' +
      '    <img id="dd-menu-logo-img" class="dd-menu-logo" alt="DEADBEAT DISCO" src="' + (assetSrc("logo_deadbeat_graffiti") || "assets/logos/logo_deadbeat_graffiti.png") + '">' +
      '    <div class="dd-menu-tagline"><span>LA NOCHE QUE DEVORÓ EL AMANECER</span><i aria-hidden="true"></i></div>' +
      '    <p class="dd-cover-manifesto">NUEVE CÍRCULOS <span>✦</span> UN ÚLTIMO BAILE</p>' +
      '  </div>' +
      '  <nav class="dd-menu-nav" id="dd-menu-nav" aria-label="Opciones del menú principal">' + nav + '</nav>' +
      '  <div class="dd-menu-footer">' +
      '    <span class="dd-pill" id="dd-gamepad-pill">TECLADO · RATÓN · MANDO</span>' +
      '    <span class="dd-menu-build" id="dd-menu-build">v3.3.0</span>' +
      '  </div>' +
      '</div>' +
      '<div class="dd-menu-hint" id="dd-menu-hint">' +
      '  <span class="dd-kb"><kbd>W</kbd><kbd>S</kbd> MOVER</span>' +
      '  <span class="dd-kb"><kbd>ENTER</kbd> ELEGIR</span>' +
      '  <span class="dd-kb"><kbd>ESC</kbd> ATRÁS</span>' +
      '  <span class="dd-gp"><kbd>CRUCETA</kbd> MOVER</span>' +
      '  <span class="dd-gp"><kbd>A</kbd> ELEGIR</span>' +
      '  <span class="dd-gp"><kbd>B</kbd> ATRÁS</span>' +
      '</div>';
    document.body.appendChild(menu);

    menu.querySelectorAll(".dd-menu-btn").forEach(function (btn, idx) {
      /* Sólo un movimiento REAL del ratón cambia la selección. Con mouseenter, un
         cursor quieto sobre el menú le quitaba la selección al teclado o al mando
         cada vez que la pantalla se recomponía (por ejemplo al cerrar un submenú). */
      btn.addEventListener("mousemove", function (ev) {
        if (uiState.busy) return;
        if (ev.screenX === uiState.mouseX && ev.screenY === uiState.mouseY) return;
        uiState.mouseX = ev.screenX; uiState.mouseY = ev.screenY;
        if (!btn.classList.contains("dd-selected")) selectButton(btn);
      });
      btn.addEventListener("focus", function () {
        if (uiState.busy) return;
        selectButton(btn);
      });
      btn.addEventListener("click", function () {
        if (uiState.busy || btn.disabled) return;
        selectButton(btn);
        triggerMenuAction(btn.getAttribute("data-action"));
      });
    });

    var build = el("dd-menu-build");
    if (build) {
      var meta = document.querySelector('meta[name="version"]');
      build.textContent = "v" + ((meta && meta.content) || "3.3.0");
    }
    refreshContinue();
  }

  /* Los iconos genéricos de la FASE 01 ya no se usan: la marca de selección es
     un brochazo dibujado en CSS. Se conserva la función como no-op documentado
     porque refreshAssets la invoca. */
  function paintBtnIcons() {
    return;
  }
  /* Sólo los botones presentes: CONTINUAR oculto no cuenta para la navegación. */
  function menuButtons() {
    return document.querySelectorAll("#dd-menu-nav .dd-menu-btn:not([hidden])");
  }
  function selectButton(btn) {
    var i = Array.prototype.indexOf.call(menuButtons(), btn);
    if (i >= 0 && i !== uiState.menuIndex) setMenuSelection(i, false);
    else if (i >= 0) setMenuSelection(i, false);
  }

  function setMenuSelection(idx, withSfx) {
    var btns = menuButtons();
    if (!btns.length) return;
    var n = btns.length;
    uiState.menuIndex = ((idx % n) + n) % n;
    Array.prototype.forEach.call(document.querySelectorAll("#dd-menu-nav .dd-menu-btn[hidden]"), function (b) {
      b.classList.remove("dd-selected"); b.setAttribute("tabindex", "-1");
    });
    Array.prototype.forEach.call(btns, function (b, i) {
      var on = i === uiState.menuIndex;
      b.classList.toggle("dd-selected", on);
      b.setAttribute("tabindex", on ? "0" : "-1");
      if (on && document.activeElement !== b && withSfx !== "silent") {
        /* mantiene el foco real alineado con la selección: teclado y ratón
           comparten un único indicador */
        try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); }
      }
    });
    if (withSfx !== false) sfx("move");
  }

  /* ------------------------------- acciones ------------------------------- */
  function triggerMenuAction(action) {
    if (uiState.busy) return;
    var boot = window.DD_BOOT;
    if (!boot) return;
    if (!boot.canStartGame()) return;

    if (action === "play") { sfx("ok"); return openSubmenu("play"); }
    if (action === "customize" || action === "progression" || action === "extras") { sfx("ok"); return openSubmenu(action); }
    if (action === "new") return doNewGame();
    if (action === "continue") return doContinue();
    if (action === "options") { sfx("ok"); return openSubmenu("options"); }
    if (action === "credits") { sfx("ok"); return openSubmenu("credits"); }
    if (action === "exit") { sfx("ok"); return doExit(); }
  }

  function pressFx(action) {
    var btn = document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="' + action + '"]');
    if (!btn) return;
    btn.classList.add("dd-press");
    setTimeout(function () { btn.classList.remove("dd-press"); }, 420);
  }

  /* Entrada al Refugio. Única puerta para NUEVA PARTIDA y CONTINUAR.
     PLAYING sólo se declara si DD_BOOT.enterGame() lo acepta; si no, el menú
     vuelve y `busy` se libera siempre. */
  function arriveAtRefuge(isNew) {
    var entered = false;
    try {
      if (window.DD_HUB && typeof window.DD_HUB.enter === "function") window.DD_HUB.enter();
      entered = !!(window.DD_BOOT && window.DD_BOOT.enterGame() === true);
    } catch (e) { entered = false; console.warn("[DD_UI] no se pudo entrar al Refugio", e); }
    if (entered) {
      if (isNew) resetRunState();
      writeSave(isNew);
    } else {
      try {
        if (window.DD_BOOT) window.DD_BOOT.exitGameToMenu();
        else showMainMenu();
      } catch (e2) {}
    }
    uiState.busy = false;
    return entered;
  }

  /* NUEVA PARTIDA: intro → descenso → Refugio. Ambas secuencias se pueden
     saltar y CONTINUAR no las reproduce. El progreso permanente no se toca. */
  function doNewGame() {
    if (uiState.busy) return;
    uiState.busy = true;
    sfx("ok");
    pressFx("new");
    var op = window.DD_OPENING;
    var descentStarted = false;
    function descent() {
      if (descentStarted) return;
      descentStarted = true;
      var ok = false;
      try {
        if (op && typeof op.playDescent === "function") ok = op.playDescent(function () { arriveAtRefuge(true); }) !== false;
      } catch (e) { console.warn("[DD_UI] descenso no disponible", e); }
      if (!ok) arriveAtRefuge(true);
    }
    var started = false;
    if (window.DD_BOOT) window.DD_BOOT.audio.stopMenuMusic(0.3);
    try {
      if (op && typeof op.playIntro === "function") started = op.playIntro(descent) !== false;
    } catch (e) { console.warn("[DD_UI] intro no disponible", e); }
    if (!started) descent();
    // Se oculta detrás del lienzo; busy impide activaciones duplicadas.
    hideMainMenu({ keepState: true });
  }

  /* Arranque real de partida.
     - El estado PLAYING sólo se declara cuando el motor ha arrancado de verdad
       (nada de estados optimistas: si la cinemática no acaba, seguimos en menú).
     - La doble pulsación se bloquea con `busy` hasta que el motor confirma.
     - Salvaguarda por estancamiento: si el reloj de la cinemática deja de
       avanzar, se arranca igualmente en vez de dejar al jugador esperando. */
  function startRunWithDescent(circleIdx) {
    if (uiState.busy) return;
    uiState.busy = true;
    sfx("ok");
    hideMainMenu({ keepState: true });

    var started = false;
    var launch = function (why) {
      if (started) return;
      started = true;
      clearInterval(guard);
      var br = window.__DD_BRIDGE;
      var okRun = false;
      try {
        if (window.DD_HUB && window.DD_HUB.isActive()) { window.DD_HUB.exitToRun(); okRun = true; }
        else if (br && typeof br.startRun === "function") okRun = !!br.startRun();
      } catch (e) { okRun = false; }
      if (!okRun) {
        var sb = el("start-btn");
        if (sb) { try { sb.click(); } catch (e) {} }
      }

      /* CONTRATO ÚNICO DE ENTRADA (FASE 01.4 · P1).
         Antes había dos definiciones distintas de "el motor está en marcha":
         esta sonda (que además aceptaba getSnapshot().running) y la de
         DD_BOOT.enterGame() (que exige isRunning() === true). La UI podía
         considerar válido un motor que enterGame() rechazaba, y entonces se
         ocultaba el menú sin entrar en partida. Ahora la ÚNICA autoridad es
         DD_BOOT.enterGame(): la sonda previa se conserva sólo para esperar a que
         el motor arranque, y es igual de estricta que la puerta. */
      var verify = function () {
        try {
          if (window.DD_HUB && window.DD_HUB.isActive()) return true;
          if (br && typeof br.isRunning === "function") return br.isRunning() === true;
        } catch (e) {}
        return false;
      };

      /* Restauración de la interfaz si la entrada no se acepta. Usa try/finally
         para que `busy` NUNCA quede bloqueado, ni siquiera si algo lanza. */
      var restoreMenu = function (motivo) {
        try {
          console.warn("[DD_UI] entrada en partida rechazada:", motivo);
          /* El menú se vuelve a mostrar y el estado vuelve a MAIN_MENU.
             El audio del menú: se para primero (stopMenuMusic es idempotente y
             sale si no suena) y se reanuda después, para no arrancar una segunda
             instancia si enterGame() nunca llegó a pararlo. */
          if (window.DD_UI && typeof window.DD_UI.showMainMenu === "function") window.DD_UI.showMainMenu();
          if (window.DD_BOOT && typeof window.DD_BOOT.stopMenuMusic === "function") {
            window.DD_BOOT.stopMenuMusic(0.2);
          }
          if (window.DD_BOOT && typeof window.DD_BOOT.exitGameToMenu === "function") {
            window.DD_BOOT.exitGameToMenu();
          }
          if (typeof showDialogue === "function") {
            showDialogue("TEMPO", "El descenso no arrancó. Prueba otra vez.", 5);
          }
        } catch (e) {
          console.warn("[DD_UI] no se pudo restaurar el menú", e);
        } finally {
          uiState.busy = false;
        }
      };

      var confirm = function (t0) {
        if (verify()) {
          /* El resultado REAL manda: antes se llamaba a enterGame() y se seguía
             adelante sin mirar qué devolvía. Si rechaza, no hay partida. */
          var entered = false;
          try {
            entered = window.DD_BOOT.enterGame() === true;
          } catch (e) {
            entered = false;
          }
          if (entered) {
            uiState.busy = false;
            if (why !== "complete") console.warn("[DD_UI] descenso forzado:", why);
            return;
          }
          restoreMenu("enterGame() devolvió false");
          return;
        }
        if (Date.now() - t0 < 3000) { setTimeout(function () { confirm(t0); }, 120); return; }
        /* El motor no arrancó: se devuelve al menú con un aviso honesto en vez
           de fingir una partida en curso. */
        restoreMenu("el motor no confirmó isRunning() en 3000 ms");
      };
      confirm(Date.now());
    };

    /* lastElapsed arranca en -1 para que la PRIMERA lectura siempre cuente como
       avance. Eso estaba bien, pero provocaba que un reloj congelado en 0 se
       tomara por "avance" y reiniciara la cuenta: el estancamiento sólo se
       detectaba si la secuencia llegaba a moverse y luego se paraba. Con una
       cinemática que NUNCA avanza (motor parado) el vigilante no saltaba jamás.
       Se separa el instante de arranque del reloj de la secuencia. */
    var guard = null, lastElapsed = -1, lastAdvance = Date.now();
    if (window.DD_CINE && typeof window.DD_CINE.playCircleDescent === "function") {
      try {
        window.DD_CINE.playCircleDescent(circleIdx, function () { launch("complete"); });
      } catch (e) {
        launch("error");
        return;
      }
      /* Vigilancia de la transición (FASE 01.4 · P1).
         La cinemática avanza dentro del bucle del MOTOR: si el motor no arranca
         (startRun() devuelve false, puente incompleto, isRunning() lanza...), la
         secuencia nunca progresa ni llama a su callback, y `busy` quedaba
         bloqueado para siempre con el menú oculto — una transición sin dueño.
         La salvaguarda por estancamiento ya existía para el reloj; se añade un
         tope absoluto por si la secuencia ni siquiera llega a empezar. */
      var hardStop = setTimeout(function () {
        if (!started) launch("timeout-transicion");
      }, 15000);
      guard = setInterval(function () {
        if (started) { clearInterval(guard); clearTimeout(hardStop); return; }
        var st = window.DD_CINE && window.DD_CINE.getState ? window.DD_CINE.getState() : null;
        if (!st) { launch("finished"); return; }
        /* Sólo cuenta como avance un incremento REAL sobre una lectura previa
           válida. La primera lectura fija la referencia sin reiniciar el reloj
           de estancamiento, de modo que una secuencia congelada en 0 se detecta
           a los 4 s en vez de esperar indefinidamente. */
        if (lastElapsed < 0) {
          lastElapsed = st.elapsed;
          lastAdvance = Date.now();
        } else if (st.elapsed > lastElapsed + 0.001) {
          lastElapsed = st.elapsed;
          lastAdvance = Date.now();
        } else if (Date.now() - lastAdvance > 4000) {
          launch("stalled");
        }
      }, 150);
      /* Si launch() se ejecuta por cualquier vía, se liberan ambos vigilantes. */
      var launchOriginal = launch;
      launch = function (why) {
        try { clearInterval(guard); clearTimeout(hardStop); } catch (e) {}
        return launchOriginal(why);
      };
    } else {
      launch("no-cinematic");
    }
  }

  /* Datos reales de progreso que el juego persiste. */
  function readProgress() {
    var best = storeNum("dmodisco_best_v5", 0);
    var bestRound = storeNum("dmodisco_best_round_v1", 0);
    var hist = storeJson("dmodisco_hist_v3");
    var currency = storeNum("dmodisco_currency_v1", 0);
    var upgrades = storeJson("dmodisco_upgrades_v1") || {};
    var ach = storeJson("dmodisco_ach_v1") || {};
    var weaponsPrestige = storeJson("dmodisco_weapon_prestige_v1") || {};
    var victoryRecord = storeJson("dmo_victories_v214");
    var victories = victoryRecord && isFinite(Number(victoryRecord.count)) ? Math.max(0, Number(victoryRecord.count)) : 0;
    var rounds = Array.isArray(hist) ? hist : [];
    return {
      best: best,
      bestRound: bestRound,
      currency: currency,
      upgrades: upgrades,
      achievements: Object.keys(ach).filter(function (k) { return ach[k]; }),
      prestige: Object.keys(weaponsPrestige).length,
      victories: victories,
      history: rounds,
      hasProgress: !!(best || bestRound || rounds.length || currency || victories)
    };
  }

  /* CONTINUAR: vuelve al Refugio con el progreso guardado, sin repetir el
     descenso. Sólo es alcanzable cuando hay partida (el botón no existe si no). */
  function doContinue() {
    if (uiState.busy) return;
    if (!hasSave()) { sfx("back"); refreshContinue(); return; }
    uiState.busy = true;
    sfx("ok");
    pressFx("continue");
    hideMainMenu({ keepState: true });
    arriveAtRefuge(false);
  }

  function doStartAt(circleIdx, why) {
    startRunWithDescent(circleIdx || 0);
  }

  function doExit() {
    /* Un navegador no puede cerrar la pestaña que no abrió él. Se intenta lo que
       sí puede hacer y, si no es posible, se dice la verdad y se ofrece una
       alternativa real (volver al boot / recargar el club). */
    var p = readProgress();
    if (window.DD_BOOT && window.DD_BOOT.openSubmenu) window.DD_BOOT.openSubmenu("EXIT");
    openSubmenu("exit");
    return p;
  }

  /* ============================ B. SUBMENÚS =============================== */

  var SUBMENU_TITLES = {
    play: { title: "JUGAR", sub: "Elige cómo volver a la pista" },
    customize: { title: "PERSONALIZAR", sub: "El camerino del protagonista" },
    progression: { title: "PROGRESIÓN", sub: "Tu historia en la torre" },
    extras: { title: "EXTRAS", sub: "Archivo del club" },
    options: { title: "OPCIONES", sub: "Ajustes del club · se recuerdan en este navegador" },
    credits: { title: "CRÉDITOS", sub: "La pista no se construyó sola" },
    partidas: { title: "SELECCIÓN DE PARTIDA", sub: "Estado persistente del club" },
    exit: { title: "SALIR DEL CLUB", sub: "Cerrar la sesión de juego" },
    erase: { title: "BORRAR DATOS", sub: "Esta acción no se puede deshacer" }
  };

  function submenuHost() {
    var host = el("dd-submenu");
    if (host) return host;
    host = document.createElement("section");
    host.id = "dd-submenu";
    host.className = "dd-submenu-wrap";
    host.setAttribute("role", "dialog");
    host.setAttribute("aria-modal", "true");
    host.setAttribute("aria-labelledby", "dd-submenu-title");
    host.setAttribute("aria-hidden", "true");
    host.innerHTML =
      '<div class="dd-submenu-card">' +
      '  <header class="dd-submenu-head">' +
      '    <div><span class="dd-submenu-kicker" id="dd-submenu-kicker">CLUB</span>' +
      '    <h2 id="dd-submenu-title">SUBMENÚ</h2>' +
      '    <p id="dd-submenu-sub"></p></div>' +
      '    <button type="button" class="dd-submenu-back" id="dd-submenu-back">VOLVER <kbd>ESC</kbd></button>' +
      '  </header>' +
      '  <div class="dd-submenu-body" id="dd-submenu-body"></div>' +
      '  <footer class="dd-submenu-foot">' +
      '    <span id="dd-submenu-foot">↑↓ NAVEGAR · ENTER APLICAR · ESC VOLVER</span>' +
      '  </footer>' +
      '</div>';
    document.body.appendChild(host);
    el("dd-submenu-back").addEventListener("click", function () { closeSubmenu(); });
    return host;
  }

  // Travelling en primera persona entre fondos de las escenas existentes.
  // Es una transición visual, no una zona navegable ni otro gestor.
  var passageTimer = 0;
  var scenePassages = {
    main: "assets/cinematics/restart/opening/op_03_dancefloor.jpg",
    play: "assets/cinematics/restart/opening/op_03_dancefloor.jpg",
    customize: "assets/ui/scenes/customize.jpg", progression: "assets/ui/scenes/progression.jpg",
    options: "assets/ui/scenes/options.jpg", extras: "assets/ui/scenes/extras.jpg"
  };
  function scenePassage(from, to, returning) {
    if (!scenePassages[from] || !scenePassages[to] || from === to) return;
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    var layer = el("dd-scene-passage");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "dd-scene-passage";
      layer.setAttribute("aria-hidden", "true");
      layer.innerHTML = '<div class="dd-passage-from"></div><div class="dd-passage-to"></div><div class="dd-passage-light"></div><div class="dd-passage-shade"></div><div class="dd-passage-title"></div>';
      document.body.appendChild(layer);
    }
    clearTimeout(passageTimer);
    layer.className = "";
    layer.style.setProperty("--passage-from", 'url("' + scenePassages[from] + '")');
    layer.style.setProperty("--passage-to", 'url("' + scenePassages[to] + '")');
    layer.querySelector('.dd-passage-title').textContent = to === 'main' ? 'ENTRADA PRINCIPAL' : ((SUBMENU_TITLES[to] && SUBMENU_TITLES[to].title) || 'EL CLUB');
    void layer.offsetWidth; // Reinicia la animación si el jugador cambia rápidamente.
    layer.className = returning ? 'is-running is-returning' : 'is-running';
    passageTimer = setTimeout(function () { layer.className = ''; }, 2060);
  }
  function cancelScenePassage() {
    clearTimeout(passageTimer);
    var layer = el('dd-scene-passage');
    if (layer) layer.className = '';
  }

  function openSubmenu(name, opts) {
    var host = submenuHost();
    scenePassage(uiState.submenu || 'main', name, false);
    uiState.submenu = name;
    uiState.submenuIndex = 0;
    var meta = SUBMENU_TITLES[name] || { title: name.toUpperCase(), sub: "" };
    el("dd-submenu-kicker").textContent = "DEADBEAT DISCO · " + meta.title;
    el("dd-submenu-title").textContent = meta.title;
    el("dd-submenu-sub").textContent = meta.sub;
    el("dd-submenu-foot").textContent = name === "credits" ? "ESC VOLVER" : "FLECHAS NAVEGAR · ENTER APLICAR · ESC VOLVER";
    var body = el("dd-submenu-body");
    returnMixPanel();
    body.innerHTML = "";

    host.dataset.scene = name;
    if (name === "play") renderPlay(body);
    else if (name === "customize") renderCustomize(body);
    else if (name === "progression") renderProgression(body);
    else if (name === "extras") renderExtras(body);
    else if (name === "options") renderOptions(body);
    else if (name === "credits") renderCredits(body);
    else if (name === "partidas") renderSlots(body, opts || {});
    else if (name === "exit") renderExit(body, opts || {});
    else if (name === "erase") renderErase(body);

    host.classList.add("is-open");
    host.setAttribute("aria-hidden", "false");
    var mainMenu = document.getElementById("dd-main-menu");
    mainMenu.classList.add("dd-behind");
    mainMenu.inert = true;
    if (window.DD_BOOT && window.DD_BOOT.openSubmenu) window.DD_BOOT.openSubmenu(name.toUpperCase());
    var first = body.querySelector("[data-autofocus]") || body.querySelector("button, input, select") || el("dd-submenu-back");
    if (first) {
      var focusScene = function () {
        // Una transición rápida puede haber cerrado o reemplazado esta escena.
        if (uiState.submenu !== name || !host.classList.contains("is-open") || !first.isConnected) return;
        if (host.contains(document.activeElement)) return;
        try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); }
      };
      setTimeout(focusScene, 30);
      // Si la escena se reabre durante el fundido de salida, Chromium puede
      // rechazar el primer foco mientras actualiza visibility.
      setTimeout(focusScene, 200);
      setTimeout(focusScene, 550);
    }
  }

  function renderPlay(body) {
    body.innerHTML = '<div class="dd-scene-content"><p>Vuelve a la pista o comienza una nueva historia.</p>' +
      '<button class="dd-scene-action" id="dd-scene-new" data-autofocus>NUEVA PARTIDA</button>' +
      (hasSave() ? '<button class="dd-scene-action" id="dd-scene-continue">CONTINUAR</button>' : '<p class="dd-scene-note">CONTINUAR estará disponible después de llegar al Refugio.</p>') + '</div>';
    el("dd-scene-new").addEventListener("click", function () { closeSubmenu(true); doNewGame(); });
    var resume = el("dd-scene-continue");
    if (resume) resume.addEventListener("click", function () { closeSubmenu(true); doContinue(); });
  }

  function renderCustomize(body) {
    var api = window.DD_APPEARANCE;
    if (!api) { body.textContent = 'El camerino no está disponible.'; return; }
    api.sync();
    var list = api.list();
    var host = el('dd-submenu');
    host.style.setProperty('--dd-appearance-image', 'url("' + api.preview(api.current().id) + '")');
    body.innerHTML = '<div class="dd-scene-content"><h3>ASPECTOS</h3><p>Elige el aspecto de tu personaje.</p>' +
      '<p class="dd-scene-note">Todos los aspectos están disponibles para probar. Son cosméticos y no afectan a tus habilidades.</p>' +
      '<div class="dd-looks">' + list.map(function (s) {
        return '<button type="button" class="dd-look" data-look="' + esc(s.id) + '" ' + (!s.unlocked ? 'disabled ' : '') + 'aria-pressed="' + (s.selected ? 'true' : 'false') + '">' +
          '<span class="dd-look-swatch dd-look-swatch-' + esc(s.id) + '"></span><span><b>' + esc(s.name) + '</b><span class="dd-look-description">' + esc(s.description) + '</span><small>' + (s.selected ? 'EQUIPADO' : s.unlocked ? 'DISPONIBLE' : esc(s.requirement)) + '</small></span></button>';
      }).join('') + '</div><p id="dd-look-status" role="status" aria-live="polite"></p></div>';
    if (!host.dataset.lookReadyBound) {
      host.dataset.lookReadyBound = '1';
      window.addEventListener('dd-looks-ready', function () { host.style.setProperty('--dd-appearance-image', 'url("' + api.preview(api.current().id) + '")'); });
    }
    body.querySelectorAll('[data-look]').forEach(function(btn) {
      btn.addEventListener('click', function () {
        if (!api.equip(btn.dataset.look)) { el('dd-look-status').textContent = 'El aspecto aún se está cargando. Inténtalo de nuevo.'; return; }
        host.style.setProperty('--dd-appearance-image', 'url("' + api.preview(api.current().id) + '")');
        body.querySelectorAll('[data-look]').forEach(function(b) {
          var chosen = b.dataset.look === api.current().id;
          b.setAttribute('aria-pressed', chosen ? 'true' : 'false');
          if (!b.disabled) b.querySelector('small').textContent = chosen ? 'EQUIPADO' : 'DISPONIBLE';
        });
        el('dd-look-status').textContent = api.current().name + ' equipado';
        sfx('ok');
      });
    });
  }

  function renderProgression(body) {
    var p = readProgress();
    body.innerHTML = '<div class="dd-scene-content"><dl class="dd-scene-stats">' +
      [["MEJOR PUNTUACIÓN", p.best], ["SALA MÁS PROFUNDA", p.bestRound], ["FICHAS", p.currency], ["VICTORIAS", p.victories], ["LOGROS GUARDADOS", p.achievements.length], ["PARTIDAS REGISTRADAS", p.history.length]].map(function (v) { return '<div><dt>' + esc(v[0]) + '</dt><dd>' + esc(v[1]) + '</dd></div>'; }).join('') +
      '</dl><h3>DESBLOQUEOS Y LOGROS</h3><p>' + (p.achievements.length ? p.achievements.map(esc).join(' · ') : 'Todavía no hay logros guardados.') + '</p>' +
      '<p class="dd-scene-note">Sigue bajando para descubrir más de la torre.</p></div>';
  }

  function renderExtras(body) {
    renderCredits(body);
    var section = document.createElement("section");
    section.className = "dd-scene-extras";
    var looks = window.DD_APPEARANCE ? window.DD_APPEARANCE.list() : [];
    section.innerHTML = '<h3>ARCHIVO VISUAL</h3><p>Las imágenes del club.</p>' +
      '<div class="dd-scene-gallery"><img src="assets/cinematics/restart/opening/mc_03_nine.jpg" alt="Las nueve pistas"><img src="assets/cinematics/restart/opening/mc_04_doors.jpg" alt="Puertas del club"><img src="assets/cinematics/restart/opening/mc_07_pit.jpg" alt="El pozo de descenso"></div>' +
      '<h3>COLECCIÓN DE ASPECTOS</h3><div class="dd-extra-looks">' + looks.map(function(s) {
        return '<div><b>' + esc(s.name) + '</b><p class="dd-extra-look-description">' + esc(s.description) + '</p><small>' + (s.unlocked ? 'DISPONIBLE' : esc(s.requirement)) + '</small></div>';
      }).join('') + '</div>';
    body.insertBefore(section, body.firstChild);
  }

  /* El panel de mezcla es un nodo del motor que OPCIONES toma prestado. Debe
     volver a su sitio antes de vaciar el submenú: si no, al abrir OPCIONES por
     segunda vez se destruía y la mezcla del juego desaparecía hasta recargar. */
  var optionsResizeHandler = null;

  function returnMixPanel() {
    if (optionsResizeHandler) {
      window.removeEventListener("resize", optionsResizeHandler);
      optionsResizeHandler = null;
    }
    var mixSrc = el("audio-panel-menu-body");
    if (mixSrc && mixSrc._ddHome && mixSrc.parentNode !== mixSrc._ddHome) {
      try { mixSrc._ddHome.appendChild(mixSrc); } catch (e) {}
    }
  }

  function closeSubmenu(silentPassage) {
    if (silentPassage === true) cancelScenePassage();
    else if (uiState.submenu) scenePassage(uiState.submenu, 'main', true);
    resetDirectionalState();
    returnMixPanel();
    var host = el("dd-submenu");
    if (host) {
      host.classList.remove("is-open");
      host.setAttribute("aria-hidden", "true");
    }
    var menu = el("dd-main-menu");
    if (menu) { menu.classList.remove("dd-behind"); menu.inert = false; }
    uiState.submenu = null;
    if (window.DD_BOOT && window.DD_BOOT.closeSubmenu) window.DD_BOOT.closeSubmenu();
    var btn = menu && menu.querySelector(".dd-menu-btn.dd-selected");
    if (btn) { try { btn.focus({ preventScroll: true }); } catch (e) { btn.focus(); } }
  }

  /* Mezcla que se oye en el menú. MAESTRO y MÚSICA son del motor del juego, que
     en el menú está callado: sin esto, moverlos no cambiaba nada audible.
     La música del menú = VOLUMEN DEL MENÚ × MAESTRO × MÚSICA; los sonidos de
     interfaz y la intro obedecen a MAESTRO. */
  window.DD_MENU_MIX = function () {
    var m = storeJson("dmodisco_vol_v1") || {};
    var c = function (v, d) { v = +v; return isFinite(v) ? Math.max(0, Math.min(1, v)) : d; };
    var master = c(m.master, 1);
    /* 0,85 es el valor por defecto de MÚSICA: con él la música del menú queda a su nivel calibrado. */
    /* Igual con EFECTOS (0,9 por defecto) para los sonidos de interfaz. */
    return { master: master, music: Math.min(1.2, master * c(m.music, 0.85) / 0.85), ui: Math.min(1.2, master * c(m.sfx, 0.9) / 0.9) };
  };
  function applyMenuMix() {
    var cover = window.DDC_COVER;
    try { if (cover && cover.music && cover.music.setVol) cover.music.setVol(); } catch (e) {}
  }

  /* --------------------------------- OPCIONES ----------------------------- */
  var GFX_LEVELS = [["auto", "AUTOMÁTICO"], ["high", "ALTO"], ["med", "MEDIO"], ["low", "BAJO"]];

  function renderOptions(body) {
    var a11y = storeJson("dmodisco_a11y_v1") || { gfx: "auto", flash: true, shake: true };
    var muted = store("dmodisco_muted_v1", "0") === "1";
    var cover = window.DDC_COVER;
    var coverVol = 0.8;
    try {
      var s = JSON.parse(store("ddc_cover_settings_v1", "null"));
      if (s && typeof s.vol === "number") coverVol = s.vol;
    } catch (e) {}

    var snapshot = window.__DD_BRIDGE && window.__DD_BRIDGE.getSnapshot ? window.__DD_BRIDGE.getSnapshot() : null;
    var dodgeKey = { Space: "ESPACIO", KeyV: "V", AltLeft: "ALT IZQUIERDO" }[(snapshot && snapshot.rollKey) || "Space"] || "ESPACIO";
    body.innerHTML =
      '<div class="dd-opt-grid">' +
      '  <section class="dd-opt-col">' +
      '    <h3>MEZCLA DEL JUEGO</h3>' +
      '    <p class="dd-opt-note">MAESTRO, MÚSICA y EFECTOS se oyen también aquí, en el menú. VOZ DJ sólo suena durante la partida.</p>' +
      '    <div class="dd-mix" id="dd-opt-mix"></div>' +
      '  </section>' +
      '  <section class="dd-opt-col">' +
      '    <h3>MÚSICA DEL MENÚ</h3>' +
      '    <div class="dd-opt-row dd-opt-vol"><label for="dd-opt-menuvol">VOLUMEN DEL MENÚ</label>' +
      '      <input type="range" id="dd-opt-menuvol" min="0" max="100" step="1" value="' + Math.round(coverVol * 100) + '">' +
      '      <output id="dd-opt-menuvol-out">' + Math.round(coverVol * 100) + '%</output></div>' +
      '    <div class="dd-opt-row"><label for="dd-opt-menuon">MÚSICA DEL MENÚ</label>' +
      '      <button type="button" class="dd-toggle" id="dd-opt-menuon" aria-pressed="' + (muted ? "false" : "true") + '">' + (muted ? "SILENCIADA" : "ACTIVA") + '</button></div>' +
      '    <h3>VÍDEO</h3>' +
      '    <div class="dd-opt-row"><label for="dd-opt-gfx">CALIDAD GRÁFICA</label>' +
      '      <select id="dd-opt-gfx">' + GFX_LEVELS.map(function (g) {
        return '<option value="' + g[0] + '"' + (a11y.gfx === g[0] ? " selected" : "") + '>' + g[1] + '</option>';
      }).join("") + '</select></div>' +
      '    <div class="dd-opt-row"><label for="dd-opt-fs">PANTALLA COMPLETA</label>' +
      (function () {
        /* Honestidad del control: si el navegador no expone la API o el contexto
           la prohíbe, el botón se muestra desactivado en lugar de fingir que
           funciona. No se ofrece lo que no se puede cumplir. */
        var api = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
        var allowed = (typeof document.fullscreenEnabled === "boolean") ? document.fullscreenEnabled : api;
        if (!api || !allowed) {
          return '<button type="button" class="dd-toggle" id="dd-opt-fs" aria-pressed="false" aria-disabled="true" disabled title="' +
            (api ? "El navegador bloquea la pantalla completa en este contexto." : "Este navegador no expone la API de pantalla completa.") +
            '">NO DISPONIBLE</button>';
        }
        return '<button type="button" class="dd-toggle" id="dd-opt-fs" aria-pressed="' + (document.fullscreenElement ? "true" : "false") + '">' +
          (document.fullscreenElement ? "SÍ" : "NO") + '</button>';
      })() + '</div>' +
      '    <p class="dd-opt-note" id="dd-opt-res"></p>' +
      '    <h3>CONTROLES</h3>' +
      '    <div class="dd-opt-row"><span>MANDO XBOX</span><span class="dd-opt-fixed" id="dd-opt-pad">COMPROBANDO…</span></div>' +
      '    <p class="dd-opt-note dd-controls-copy" id="dd-controls-keyboard"><strong>TECLADO Y RATÓN</strong><br>WASD / FLECHAS: mover · RATÓN: apuntar y disparar<br>' +
      dodgeKey + ': esquivar · Q: bomba · MAYÚS: boost · E: interactuar · Z: cambiar arma<br>I / M: inventario y mapa · ESC: pausa</p>' +
      '    <p class="dd-opt-note dd-controls-copy"><strong>MANDO XBOX</strong><br>STICK IZQUIERDO: mover · STICK DERECHO: apuntar · RT: disparar<br>B: esquivar · LB: bomba · RB: boost · A: interactuar · Y: cambiar arma · VIEW: inventario y mapa · START: pausa</p>' +
      '  </section>' +
      '</div>' +
      '<div class="dd-opt-data">' +
      '  <h3>DATOS GUARDADOS</h3>' +
      '  <p class="dd-opt-note">NUEVA PARTIDA no borra tus fichas, mejoras, logros ni récords. Para eliminarlos hay que hacerlo aquí.</p>' +
      '  <button type="button" class="dd-btn-ghost" id="dd-opt-erase">BORRAR DATOS…</button>' +
      '</div>' +
      '<p class="dd-opt-note dd-opt-foot">Los cambios se aplican al instante y se guardan en este navegador. ' +
      'La sensibilidad del ratón la define el sistema operativo: el juego no la expone.</p>';

    /* Mezcla del juego: se reutiliza el compositor del motor (nada duplicado). */
    var mixHost = el("dd-opt-mix");
    var mixSrc = el("audio-panel-menu-body");
    if (mixSrc) {
      /* El panel del motor vive dentro de un <details> cerrado: sin abrirlo no
         tiene caja y los controles se verían a 0×0. Se abre (no se duplica). */
      var det = mixSrc.closest("details");
      if (det && !det.open) det.open = true;
      if (!mixSrc._ddHome) mixSrc._ddHome = mixSrc.parentNode;
      mixHost.appendChild(mixSrc);
      try { if (mixSrc._sync) mixSrc._sync(); } catch (e) {}
    } else if (mixHost) {
      mixHost.innerHTML = '<p class="dd-opt-note">La mezcla de sonido aún no está lista. Vuelve a abrir OPCIONES en unos segundos.</p>';
    }

    var eraseBtn = el("dd-opt-erase");
    if (eraseBtn) eraseBtn.addEventListener("click", function () {
      sfx("ok");
      closeSubmenu();            /* devuelve a su sitio el panel de mezcla del motor antes de cambiar de pantalla */
      openSubmenu("erase");
    });

    var resEl = el("dd-opt-res");
    function paintRes() {
      if (!resEl) return;
      resEl.textContent = "VENTANA " + window.innerWidth + "×" + window.innerHeight +
        " · ESCALA " + (window.devicePixelRatio || 1).toFixed(2) + "× · LIENZO " + (el("game") ? el("game").width + "×" + el("game").height : "—");
    }
    paintRes();
    if (optionsResizeHandler) window.removeEventListener("resize", optionsResizeHandler);
    optionsResizeHandler = paintRes;
    window.addEventListener("resize", optionsResizeHandler);

    /* Los deslizadores del motor guardan su valor al moverse; aquí se reaplica
       al instante sobre lo que suena en el menú. */
    if (mixHost && !mixHost._ddMixBound) {
      mixHost._ddMixBound = true;
      mixHost.addEventListener("input", function () { setTimeout(applyMenuMix, 0); });
      /* Al soltar un deslizador suena un toque de interfaz al nuevo volumen. */
      mixHost.addEventListener("change", function (ev) {
        setTimeout(function () { applyMenuMix(); if (ev.target && ev.target.type === "range") sfx("move"); }, 0);
      });
    }

    /* Volumen del menú (motor de la portada, con persistencia propia). */
    var mv = el("dd-opt-menuvol");
    if (mv) {
      mv.addEventListener("input", function () {
        var v = Number(mv.value) / 100;
        el("dd-opt-menuvol-out").textContent = mv.value + "%";
        try {
          var s = JSON.parse(store("ddc_cover_settings_v1", "null")) || {};
          s.vol = v;
          window.localStorage.setItem("ddc_cover_settings_v1", JSON.stringify(s));
          /* Se aplica al instante sobre el motor de música del menú. */
          if (cover && cover.music && typeof cover.music.setVol === "function") cover.music.setVol(v);
        } catch (e) {}
      });
    }

    var menuOn = el("dd-opt-menuon");
    if (menuOn) {
      menuOn.addEventListener("click", function () {
        var off = menuOn.getAttribute("aria-pressed") === "true";
        menuOn.setAttribute("aria-pressed", off ? "false" : "true");
        menuOn.textContent = off ? "SILENCIADA" : "ACTIVA";
        try { window.localStorage.setItem("dmodisco_muted_v1", off ? "1" : "0"); } catch (e) {}
        if (window.DD_BOOT) {
          if (off) window.DD_BOOT.audio.stopMenuMusic(0.3);
          else window.DD_BOOT.audio.startMenuMusic(4);
        }
        sfx("ok");
      });
    }

    var gfx = el("dd-opt-gfx");
    if (gfx) {
      gfx.addEventListener("change", function () {
        var api = window.DD_A11Y || null;
        var a = storeJson("dmodisco_a11y_v1") || { gfx: "auto", flash: true, shake: true };
        a.gfx = gfx.value;
        try { window.localStorage.setItem("dmodisco_a11y_v1", JSON.stringify(a)); } catch (e) {}
        /* El motor aplica el nivel desde su propio panel (una sola fuente de
         * verdad): se sincroniza su control y se dispara su handler. */
        var proxy = el("audio-panel-menu-body-gfx") || document.getElementById("audio-panel-menu-body-gfx");
        var internal = document.querySelector("#audio-panel-menu-body select");
        if (internal) {
          internal.value = gfx.value;
          internal.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (api && api.apply) api.apply();
        sfx("ok");
      });
    }

    var fs = el("dd-opt-fs");
    if (fs && !fs.disabled) {
      /* El estado del botón se sincroniza con el evento REAL del navegador, no
         con una suposición optimista: si la petición se rechaza, el botón queda
         como estaba y se explica el motivo. */
      var syncFs = function () {
        var on = !!document.fullscreenElement;
        fs.setAttribute("aria-pressed", on ? "true" : "false");
        fs.textContent = on ? "SÍ" : "NO";
        fs.title = "";
      };
      ["fullscreenchange", "webkitfullscreenchange"].forEach(function (ev) {
        document.addEventListener(ev, syncFs);
      });
      fs.addEventListener("click", function () {
        var want = !document.fullscreenElement;
        var done = function (err) {
          syncFs();
          if (err) {
            var note = el("dd-opt-fs-note");
            if (!note) {
              note = document.createElement("p");
              note.id = "dd-opt-fs-note";
              note.className = "dd-opt-note";
              if (fs.parentNode && fs.parentNode.parentNode) fs.parentNode.parentNode.appendChild(note);
            }
            note.textContent = "El navegador no concedió la pantalla completa (" +
              String((err && err.message) || err).slice(0, 90) + ").";
          }
        };
        try {
          if (want) {
            var r = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
            if (!r) return done(new Error("API no disponible"));
            var pr = r.call(document.documentElement);
            if (pr && typeof pr.then === "function") pr.then(function () { done(null); }, done);
            else setTimeout(function () { done(null); }, 150);
          } else {
            document.exitFullscreen().then(function () { done(null); }, done);
          }
        } catch (e) { done(e); }
        sfx("ok");
      });
    }

    function toggleA11y(key, btn) {
      var a = storeJson("dmodisco_a11y_v1") || { gfx: "auto", flash: true, shake: true };
      a[key] = !a[key];
      try { window.localStorage.setItem("dmodisco_a11y_v1", JSON.stringify(a)); } catch (e) {}
      btn.setAttribute("aria-pressed", a[key] ? "true" : "false");
      btn.textContent = a[key] ? "SÍ" : "NO";
      var internal = document.querySelector('#audio-panel-menu-body input[type="checkbox"]#' +
        (key === "flash" ? "audio-panel-menu-body-flash" : "audio-panel-menu-body-shake"));
      if (internal && internal.checked !== a[key]) internal.click();
      sfx("ok");
    }
    var fl = el("dd-opt-flash");
    if (fl) fl.addEventListener("click", function () { toggleA11y("flash", fl); });
    var sh = el("dd-opt-shake");
    if (sh) sh.addEventListener("click", function () { toggleA11y("shake", sh); });

    var pad = el("dd-opt-pad");
    if (pad) {
      var pads = navigator.getGamepads ? navigator.getGamepads() : [];
      var found = null;
      for (var i = 0; i < pads.length; i++) { if (pads[i] && pads[i].connected) { found = pads[i]; break; } }
      pad.textContent = found ? (found.id || "MANDO").slice(0, 40).toUpperCase() : "SIN MANDO DETECTADO";
    }
  }

  /* --------------------------------- CRÉDITOS ----------------------------- */
  function renderCredits(body) {
    /* Sólo nombres y atribuciones que existen de verdad en el repositorio:
       autoría del proyecto, tipografía y motor. No se inventa a nadie. */
    var meta = document.querySelector('meta[name="version"]');
    var version = (meta && meta.content) || "3.3.0";
    /* Versión del motor: se lee del propio runtime (window.DMO), no se escribe a mano. */
    var engine = (window.DMO && window.DMO.version) ? window.DMO.version : "";
    var fontEl = document.getElementById("dd-font-probe");
    var fontOk = !!(fontEl && document.fonts && document.fonts.check && document.fonts.check('16px "DDPixel"'));
    body.innerHTML =
      '<div class="dd-cred">' +
      '  <div class="dd-cred-hero">' +
      '    <img src="assets/fase01/emblem_fox_glow.png" alt="">' +
      '    <div><b>DEADBEAT DISCO</b><span>LA NOCHE QUE DEVORÓ EL AMANECER</span></div>' +
      '  </div>' +
      '  <dl class="dd-cred-list">' +
      '    <div><dt>DIRECCIÓN Y PRODUCCIÓN</dt><dd>SER-RGV</dd></div>' +
      '    <div><dt>DISEÑO Y DESARROLLO</dt><dd>SER-RGV</dd></div>' +
      '    <div><dt>DIRECCIÓN DE ARTE Y RECURSOS</dt><dd>SER-RGV</dd></div>' +
      '    <div><dt>VERSIÓN</dt><dd>v' + esc(version) + '</dd></div>' +
      '  </dl>' +
      '</div>';
  }

  /* --------------------------- SELECCIÓN DE PARTIDA ----------------------- */
  function renderSlots(body, opts) {
    var p = readProgress();
    /* El motor no implementa ranuras múltiples: el estado persistente es único
       (meta-progreso + mejor descenso). Se muestra la verdad y se ofrece la
       acción más pequeña compatible: reanudar ese estado. */
    var circleIdx = p.bestRound >= 100 ? 9 : Math.max(0, Math.min(8, Math.ceil(Math.max(1, p.bestRound) / 11) - 1));
    var c = circleInfo()[circleIdx] || { code: "—", name: "Datos del descenso no disponibles" };

    var rows = "";
    p.history.slice(0, 5).forEach(function (h, i) {
      rows += '<tr><td>' + (i + 1) + '</td><td>' + esc(h.round) + '</td><td>' + esc(h.kills) + '</td><td>' +
        Number(h.score || 0).toLocaleString("es-ES") + '</td><td>x' + esc(h.maxCombo) + '</td><td>' + esc(h.date || "—") + '</td></tr>';
    });

    body.innerHTML =
      '<div class="dd-slot' + (p.hasProgress ? "" : " is-empty") + '">' +
      '  <div class="dd-slot-head">' +
      '    <span class="dd-slot-tag">' + (opts.noSave ? "SIN PROGRESO GUARDADO" : "RANURA ACTIVA") + '</span>' +
      '    <b>' + (p.hasProgress ? "DESCENSO EN " + c.code : "SIN DESCENSOS REGISTRADOS") + '</b>' +
      '    <span>' + (p.hasProgress ? esc(c.name) : "Cada descenso empieza en el Círculo I · Limbo") + '</span>' +
      '  </div>' +
      '  <dl class="dd-slot-stats">' +
      '    <div><dt>SALA MÁS PROFUNDA</dt><dd>' + (p.bestRound || "—") + '</dd></div>' +
      '    <div><dt>MEJOR PUNTUACIÓN</dt><dd>' + (p.best || 0).toLocaleString("es-ES") + '</dd></div>' +
      '    <div><dt>FICHAS</dt><dd>' + p.currency + ' ✦</dd></div>' +
      '    <div><dt>VICTORIAS</dt><dd>' + p.victories + '</dd></div>' +
      '    <div><dt>MEJORAS PERMANENTES</dt><dd>' + Object.keys(p.upgrades).filter(function (k) { return p.upgrades[k]; }).length + '</dd></div>' +
      '    <div><dt>LOGROS</dt><dd>' + p.achievements.length + '</dd></div>' +
      '  </dl>' +
      '  <div class="dd-slot-actions">' +
      '    <button type="button" class="dd-btn-primary" id="dd-slot-resume"' + (p.hasProgress ? "" : " disabled") + '>' +
      (p.hasProgress ? "▶ REANUDAR DESCENSO" : "SIN PARTIDA QUE REANUDAR") + '</button>' +
      '    <button type="button" class="dd-btn-ghost" id="dd-slot-new">＋ NUEVA PARTIDA</button>' +
      '  </div>' +
      '</div>' +
      '<div class="dd-slot-note">' +
      '  <b>PROGRESO GUARDADO</b>' +
      '  <p>El club no guarda partidas a media incursión. ' +
      'Se conservan tu mejor descenso, fichas, ' +
      'mejoras permanentes, arsenal y logros.</p>' +
      '</div>' +
      (p.history.length
        ? '<div class="dd-slot-hist"><h3>ÚLTIMOS DESCENSOS</h3><table><thead><tr><th>#</th><th>SALA</th><th>BAJAS</th><th>PUNTOS</th><th>COMBO</th><th>FECHA</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<p class="dd-slot-note">Todavía no hay descensos en el historial.</p>');

    var resume = el("dd-slot-resume");
    if (resume) resume.addEventListener("click", function () {
      if (uiState.busy) return;
      closeSubmenuImmediate();
      doStartAt(circleIdx, "slot");
    });
    var nw = el("dd-slot-new");
    if (nw) nw.addEventListener("click", function () {
      if (uiState.busy) return;
      closeSubmenuImmediate();
      doNewGame();
    });
  }

  /* BORRAR DATOS: pantalla propia, con la lista de lo que se elimina y de lo que
     se conserva. El foco entra en CANCELAR; borrar exige ir al otro botón. */
  function describeStored(key) {
    var raw = store(key, null);
    if (raw === null) return null;
    if (key === "dmodisco_currency_v1") return String(parseInt(raw, 10) || 0);
    if (key === "dmodisco_best_combo_v216") return "x" + (parseInt(raw, 10) || 0);
    if (/^-?\d+$/.test(raw)) return String(parseInt(raw, 10));
    try {
      var v = JSON.parse(raw);
      if (key === "dmo_victories_v214" && v && typeof v.count === "number") return String(v.count);
      if (key === SAVE_KEY && v && v.created) return "creada el " + String(v.created).slice(0, 10);
      if (Array.isArray(v)) return v.length + (v.length === 1 ? " entrada" : " entradas");
      if (v && typeof v === "object") {
        var n = Object.keys(v).filter(function (k) { return v[k]; }).length;
        return key === "dmo_secret_route_v32" || key === "dmo_floor_v32" ? "guardada" : n + (n === 1 ? " elemento" : " elementos");
      }
    } catch (e) {}
    return "guardado";
  }
  function renderErase(body) {
    var doomed = STORAGE.RUN.concat(STORAGE.PERMANENT).map(function (e) { return { label: e.label, val: describeStored(e.key) }; });
    var present = doomed.filter(function (d) { return d.val !== null; });
    body.innerHTML =
      '<div class="dd-exit dd-erase">' +
      '  <p class="dd-exit-q">¿Borrar la partida y todo el progreso?</p>' +
      '  <p class="dd-exit-note">Se eliminará de este navegador, sin copia y sin vuelta atrás:</p>' +
      '  <dl class="dd-slot-stats" id="dd-erase-list">' +
      doomed.map(function (d) { return '<div' + (d.val === null ? ' class="is-empty"' : '') + '><dt>' + d.label.toUpperCase() + '</dt><dd>' + (d.val === null ? "—" : d.val) + '</dd></div>'; }).join("") +
      '  </dl>' +
      '  <p class="dd-exit-note" id="dd-erase-keep">Se conservan los ajustes: ' + STORAGE.SETTINGS.map(function (e) { return e.label.toLowerCase(); }).join(", ") + '.</p>' +
      '  <p class="dd-exit-note">' + (present.length ? 'Al terminar, el juego se recarga desde el principio.' : 'Ahora mismo no hay nada guardado que borrar.') + '</p>' +
      '  <div class="dd-slot-actions">' +
      '    <button type="button" class="dd-btn-ghost" id="dd-erase-no" data-autofocus>CANCELAR</button>' +
      '    <button type="button" class="dd-btn-primary dd-btn-danger" id="dd-erase-yes"' + (present.length ? '' : ' disabled') + '>SÍ, BORRAR TODO</button>' +
      '  </div>' +
      '</div>';
    el("dd-erase-no").addEventListener("click", function () { sfx("back"); closeSubmenu(); });
    el("dd-erase-yes").addEventListener("click", function () {
      if (!present.length) return;
      sfx("ok");
      var removed = eraseAllProgress();
      try { window.sessionStorage.setItem("dd_last_erase", JSON.stringify(removed)); } catch (e) {}
      /* El motor tiene el progreso también en memoria: se recarga para que no lo
         vuelva a escribir. */
      try { window.location.reload(); } catch (e2) { closeSubmenu(); refreshContinue(); }
    });
  }

  function renderExit(body, opts) {
    var p = readProgress();
    var canClose = false;
    try {
      /* Sólo las ventanas abiertas por script pueden cerrarse; en un navegador
         normal `window.close()` es un no-op. Se comprueba sin fingir. */
      canClose = (window.opener && !window.opener.closed) || (window.history.length <= 1 && /^(file:)$/.test(location.protocol));
    } catch (e) {}
    body.innerHTML =
      '<div class="dd-exit">' +
      '  <p class="dd-exit-q">¿Apagar las luces de la pista?</p>' +
      '  <p class="dd-exit-note">' + (canClose
        ? 'La ventana se cerrará si el navegador lo permite.'
        : 'El navegador no permite que una pestaña se cierre a sí misma. Se detendrá el audio y se mostrará la pantalla de despedida; puedes cerrar la pestaña con Ctrl+W.') + '</p>' +
      '  <dl class="dd-slot-stats">' +
      '    <div><dt>PROGRESO</dt><dd>' + (p.hasProgress ? "GUARDADO" : "SIN CAMBIOS") + '</dd></div>' +
      '    <div><dt>FICHAS</dt><dd>' + p.currency + ' ✦</dd></div>' +
      '  </dl>' +
      '  <div class="dd-slot-actions">' +
      '    <button type="button" class="dd-btn-primary" id="dd-exit-yes">SALIR DEL CLUB</button>' +
      '    <button type="button" class="dd-btn-ghost" id="dd-exit-no">SEGUIR BAILANDO</button>' +
      '  </div>' +
      '</div>';
    el("dd-exit-no").addEventListener("click", function () { sfx("back"); closeSubmenu(); });
    el("dd-exit-yes").addEventListener("click", function () {
      sfx("ok");
      if (window.DD_BOOT) window.DD_BOOT.audio.stopMenuMusic(0.25);
      document.body.classList.add("dd-exited");
      var host = el("dd-submenu");
      if (host) host.classList.remove("is-open");
      var bd = document.createElement("div");
      bd.id = "dd-blackout";
      bd.innerHTML = '<div class="dd-blackout-card">' +
        '<h2>HAS SALIDO DEL CLUB</h2>' +
        '<p>Gracias por bailar. La pista queda a oscuras.</p>' +
        '<button type="button" class="dd-btn-ghost" id="dd-reenter">VOLVER A ENTRAR</button>' +
        '</div>';
      document.body.appendChild(bd);
      el("dd-reenter").addEventListener("click", function () {
        bd.remove();
        document.body.classList.remove("dd-exited");
        closeSubmenu();
        if (window.DD_BOOT) window.DD_BOOT.audio.startMenuMusic(4);
        sfx("ok");
      });
      if (canClose) { try { window.close(); } catch (e) {} }
    });
  }

  function closeSubmenuImmediate() {
    returnMixPanel();
    var host = el("dd-submenu");
    if (host) { host.classList.remove("is-open"); host.setAttribute("aria-hidden", "true"); }
    var m = el("dd-main-menu");
    if (m) { m.classList.remove("dd-behind"); m.inert = false; }
    uiState.submenu = null;
    /* Invariante: el FSM no puede quedarse en SUBMENU sin submenú abierto.
       Si eso ocurre, el sondeo del mando deja de responder (consulta
       uiState.submenu) y la interfaz queda en un estado que ya no existe.
       Se corrige siempre que el FSM diga SUBMENU y aquí ya no haya submenú,
       sin importar si el menú se está ocultando o no: el dato de la UI es el
       que manda porque es el que se ve. */
    if (window.DD_BOOT && window.DD_BOOT.getState &&
        window.DD_BOOT.getState().state === "SUBMENU") {
      try { window.DD_BOOT.closeSubmenu(); } catch (e) {}
    }
  }

  /* ============================ C. HUD (sin cambios de lógica) ============ */
  function buildHud() {
    var hud = document.createElement("section");
    hud.id = "dd-hud";
    hud.className = "dd-hidden";
    hud.innerHTML =
      '<div class="dd-hud-top-left">' +
      '  <div class="dd-hud-portrait-frame"><img id="dd-hud-portrait" alt="Protagonista" src="' + assetSrc("hud_portrait_protagonist") + '"></div>' +
      '  <div class="dd-hud-vitals">' +
      '    <div class="dd-hud-hearts-row">' +
      '      <div class="dd-hud-hearts" id="dd-hud-hearts" role="img" aria-label="Vidas"></div>' +
      '      <div class="dd-hud-badges">' +
      '        <span class="dd-badge-shield" id="dd-hud-shield" role="img" aria-label="Escudos 0">ESC 0</span>' +
      '        <span class="dd-badge-cr"><img id="dd-hud-coin-img" alt="" src="' + assetSrc("hud_credit_coin", "pickups/pickup_credits_00.png") + '"><b id="dd-hud-cr">0</b></span>' +
      '        <span class="dd-badge-nv" id="dd-hud-nv">NV. 1</span>' +
      '      </div>' +
      '    </div>' +
      '    <div class="dd-bar-track" aria-hidden="true"><div class="dd-bar-fill" id="dd-hud-hp-fill" style="width:100%"></div></div>' +
      '    <div class="dd-hud-hype-label" id="dd-hud-hype-label">HYPE 0%</div>' +
      '    <div class="dd-bar-track dd-bar-shield" aria-hidden="true"><div class="dd-bar-fill" id="dd-hud-sh-fill" style="width:0%"></div></div>' +
      '    <div class="dd-hud-weapon-strip">' +
      '      <span id="dd-hud-weapon-name">M1911 · ∞</span>' +
      '      <img id="dd-hud-weapon-img" class="dd-hud-weapon-thumb" alt="" src="' + weaponImgSrc("m1911") + '">' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<div id="dd-boss-hud" class="dd-hidden">' +
      '  <div class="dd-boss-hud-title" id="dd-boss-name">RESIDENTE</div>' +
      '  <div class="dd-bar-track"><div class="dd-bar-fill" id="dd-boss-hp-fill" style="width:100%"></div></div>' +
      '</div>' +
      '<div class="dd-hud-top-right">' +
      '  <button type="button" class="dd-minimap-box" id="dd-minimap-trigger" aria-label="Abrir torre de progresión" title="Abrir torre de progresión"><canvas id="dd-minimap-canvas" width="196" height="132" aria-hidden="true"></canvas></button>' +
      '  <div class="dd-room-banner" id="dd-hud-room">EL REFUGIO · ZONA SEGURA</div>' +
      '  <div class="dd-quick-actions">' +
      '    <button type="button" class="dd-quick-btn" id="dd-btn-open-shop">ARMERÍA</button>' +
      '    <button type="button" class="dd-quick-btn" id="dd-btn-open-map">TORRE</button>' +
      '    <button type="button" class="dd-quick-btn" id="dd-btn-enter-hub">[H] REFUGIO</button>' +
      '  </div>' +
      '</div>' +
      '<div class="dd-hud-skills">' +
      '  <div class="dd-skill-card" id="dd-skill-bomb"><img id="dd-skill-bomb-img" alt="Bomba" src="' + assetSrc("hud_skill_bomb", "pickups/pickup_bomb_00.png") + '"><span class="dd-skill-count" id="dd-skill-bomb-cnt">1</span><span class="dd-skill-key" id="dd-skill-bomb-key">Q</span></div>' +
      '  <div class="dd-skill-card" id="dd-skill-boost"><img id="dd-skill-boost-img" alt="Boost" src="' + assetSrc("hud_skill_boost", "pickups/pickup_boost_00.png") + '"><span class="dd-skill-count" id="dd-skill-boost-cnt">1</span><span class="dd-skill-key" id="dd-skill-boost-key">SHIFT</span></div>' +
      '  <div class="dd-skill-card" id="dd-skill-dodge"><img id="dd-skill-dodge-img" alt="Esquiva" src="' + assetSrc("hud_skill_dodge", "pickups/pickup_speedup_00.png") + '"><span class="dd-skill-key" id="dd-skill-dodge-key">ESP</span></div>' +
      '</div>';
    document.body.appendChild(hud);

    el("dd-btn-open-shop").addEventListener("click", openShop);
    el("dd-btn-open-map").addEventListener("click", openMap);
    el("dd-minimap-trigger").addEventListener("click", openMap);
    el("dd-btn-enter-hub").addEventListener("click", function () {
      if (window.DD_HUB) window.DD_HUB.enter();
    });
  }

  function buildDialogue() {
    var dlg = document.createElement("aside");
    dlg.id = "dd-dialogue-box";
    dlg.className = "dd-hidden";
    dlg.setAttribute("role", "status");
    dlg.setAttribute("aria-live", "polite");
    dlg.innerHTML =
      '<div class="dd-dj-portrait-wrap" id="dd-tempo-portrait-wrap"><img id="dd-dj-portrait" alt="Tempo" src="' + assetSrc("dialogue_portrait_dj") + '"></div>' +
      '<div class="dd-player-portrait-wrap" id="dd-player-portrait-wrap" hidden><img id="dd-player-dialogue-portrait" alt="Protagonista"></div>' +
      '<div class="dd-dj-speech"><div class="dd-dj-speaker-tab" id="dd-dj-speaker">TEMPO</div><div class="dd-dj-text" id="dd-dj-text"></div></div>';
    document.body.appendChild(dlg);
    // El canal original sigue vivo para el motor, pero no debe anunciar el
    // mismo mensaje dos veces cuando su presentación HD está activa.
    var legacySubs = el("subs");
    if (legacySubs && document.body.classList.contains("dd-highres-edition")) legacySubs.setAttribute("aria-hidden", "true");
  }

  function buildModals() {
    var shop = document.createElement("div");
    shop.id = "dd-shop-modal";
    shop.className = "dd-modal-backdrop dd-hidden";
    shop.innerHTML =
      '<div class="dd-modal-window" role="dialog" aria-modal="true" aria-label="Inventario y Tienda de Armas">' +
      '  <div class="dd-modal-header">' +
      '    <span class="dd-modal-title">INVENTARIO / TIENDA · ARMERÍA INFERNAL</span>' +
      '    <div style="display:flex;align-items:center;gap:14px;">' +
      '      <span class="dd-badge-cr" style="font-size:14px;padding:4px 12px;">CRÉDITOS: <b id="dd-shop-credits">0</b></span>' +
      '      <button type="button" class="dd-close-btn" id="dd-shop-close">CERRAR [ESC]</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="dd-shop-body">' +
      '    <div style="display:flex;flex-direction:column;overflow:hidden;">' +
      '      <p class="dd-shop-context" id="dd-shop-context"></p>' +
      '      <div class="dd-shop-filters" id="dd-shop-filters"></div>' +
      '      <div class="dd-weapons-grid" id="dd-weapons-grid"></div>' +
      '    </div>' +
      '    <div class="dd-shop-inspector" id="dd-shop-inspector"></div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(shop);
    el("dd-shop-close").addEventListener("click", closeModals);

    var mapModal = document.createElement("div");
    mapModal.id = "dd-map-modal";
    mapModal.className = "dd-modal-backdrop dd-hidden";
    mapModal.innerHTML =
      '<div class="dd-modal-window" role="dialog" aria-modal="true" aria-label="Mapa de Progresión de los Nueve Círculos">' +
      '  <div class="dd-modal-header">' +
      '    <span class="dd-modal-title">MAPA DE PROGRESIÓN · DESCENSO POR LA TORRE</span>' +
      '    <button type="button" class="dd-close-btn" id="dd-map-close">CERRAR [ESC]</button>' +
      '  </div>' +
      '  <div class="dd-map-body">' +
      '    <div class="dd-tower-art-wrap"><img id="dd-map-tower-img" alt="Torre Infernal" src="' + assetSrc("map_infernal_tower") + '"></div>' +
      '    <div class="dd-circles-list" id="dd-circles-list" role="region" aria-label="Círculos de la torre, desplázate para ver todos" tabindex="0"></div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(mapModal);
    el("dd-map-close").addEventListener("click", closeModals);
  }

  function buildDOM() {
    if (uiState.initialized) return;
    uiState.initialized = true;
    document.body.classList.add("dd-highres-edition");

    if (!el("dd-chrome-guard")) {
      var guard = document.createElement("style");
      guard.id = "dd-chrome-guard";
      guard.textContent = "html body.dd-highres-edition #ddc-cover{display:none!important}";
      document.head.appendChild(guard);
    }
    buildMainMenu();
    buildHud();
    buildDialogue();
    window.addEventListener('dd-appearance-change', refreshAppearancePortraits);
    window.addEventListener('dd-looks-ready', refreshAppearancePortraits);
    refreshAppearancePortraits();
    buildModals();
    buildResults();
    if (!el("dd-font-probe")) {
      var probe = document.createElement("span");
      probe.id = "dd-font-probe";
      probe.setAttribute("aria-hidden", "true");
      probe.textContent = "Deadbeat";
      probe.style.cssText = 'position:fixed;left:-9999px;top:0;font:16px "DDPixel";opacity:0;pointer-events:none';
      document.body.appendChild(probe);
    }
  }

  /* Resultados usan exclusivamente los datos y el cierre de partida del motor.
     El resumen completo permanece disponible sin volver a calcular premios. */
  function buildResults() {
    var root = document.createElement("section");
    root.id = "dd-results";
    root.className = "dd-hidden";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "dd-results-title");
    root.innerHTML = '<div class="dd-results-card">' +
      '<div class="dd-results-kicker">DEADBEAT DISCO // FIN DE LA SESIÓN</div>' +
      '<h1 id="dd-results-title">FIN DEL DESCENSO</h1>' +
      '<p class="dd-results-lead" id="dd-results-lead"></p>' +
      '<dl class="dd-results-stats" id="dd-results-stats"></dl>' +
      '<details class="dd-results-details"><summary>Ver resumen completo</summary><pre id="dd-results-summary"></pre></details>' +
      '<div class="dd-results-actions"><button type="button" id="dd-results-retry">REINTENTAR</button>' +
      '<button type="button" id="dd-results-menu">MENÚ PRINCIPAL</button></div>' +
      '<p class="dd-results-hint">↑ ↓ SELECCIONAR · ENTER ELEGIR &nbsp; / &nbsp; CRUCETA + A</p>' +
      '<p id="dd-results-error" role="status"></p></div>';
    document.body.appendChild(root);
    el("dd-results-retry").addEventListener("click", retryResults);
    el("dd-results-menu").addEventListener("click", resultsToMenu);
    resultControls().forEach(function (control, i) {
      control.addEventListener("focus", function () {
        uiState.resultsIndex = i;
        resultControls().forEach(function (item) { item.classList.toggle("dd-selected", item === control); });
      });
    });
  }

  function resultControls() {
    var root = el("dd-results");
    return root ? [el("dd-results-retry"), el("dd-results-menu"), root.querySelector("summary")] : [];
  }

  function selectResult(index) {
    var controls = resultControls();
    uiState.resultsIndex = (index + controls.length) % controls.length;
    controls[uiState.resultsIndex].focus({ preventScroll: true });
    controls[uiState.resultsIndex].scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function showResults(result, summary) {
    buildDOM();
    closeModals();
    uiState.resultsOpen = true;
    uiState.resultsIndex = 0;
    var won = !!(result && result.won);
    var suppressed = !!(result && result.victorySuppressed);
    var modified = !!(result && result.tainted);
    el("dd-results-title").textContent = won ? "VICTORIA" : suppressed ? "FIN NO OFICIAL" : "FIN DEL DESCENSO";
    el("dd-results-lead").textContent = won ? "La última canción es tuya." :
      suppressed ? "Partida modificada · sin victoria ni recompensas oficiales." :
      modified ? "Partida modificada · sin récords ni recompensas oficiales." : "La pista espera tu regreso.";
    var stats = [];
    if (result) {
      [["SALA", "round"], ["PUNTUACIÓN", "score"], ["BAJAS", "kills"], ["TIEMPO", "t"]].forEach(function (pair) {
        var v = result[pair[1]];
        if (typeof v !== "number" || !isFinite(v)) return;
        stats.push('<div><dt>' + pair[0] + '</dt><dd>' + esc(pair[1] === "t" ? v.toFixed(1) + " s" : v.toLocaleString("es-ES")) + '</dd></div>');
      });
    }
    el("dd-results-stats").innerHTML = stats.join("");
    el("dd-results-summary").textContent = summary || "";
    el("dd-results").querySelector("details").open = false;
    el("dd-results-error").textContent = "";
    el("dd-results").classList.remove("dd-hidden");
    /* La navegación del motor considera #overlay visible como su menú activo.
       Si queda detrás de resultados, A puede accionar también JUGAR. Ocultarlo
       sólo después de mostrar la nueva pantalla evita dos dueños del mando. */
    var legacy = el("overlay");
    if (legacy) { legacy.classList.add("hidden"); legacy.setAttribute("aria-hidden", "true"); legacy.inert = true; }
    el("dd-hud").classList.add("dd-hidden");
    /* El motor acaba de detenerse. Una marca de latido reciente no debe dejar
       los primeros botones del mando sin leer durante un segundo. Si el motor
       sigue llamando a tick(), volverá a actualizarla y retirará este latido. */
    selfTick.lastEngineCall = 0;
    startSelfTick();
    selectResult(0);
  }

  function hideResults() {
    uiState.resultsOpen = false;
    el("dd-results").classList.add("dd-hidden");
    stopSelfTick();
  }

  function retryResults() {
    if (!uiState.resultsOpen) return;
    var br = window.__DD_BRIDGE;
    var ok = false;
    try { ok = !!(br && br.startRun && br.startRun()); } catch (e) { console.warn("[DD_UI] reintento", e); }
    if (!ok) { el("dd-results-error").textContent = "No se pudo iniciar la partida. Prueba de nuevo o vuelve al menú."; return; }
    hideResults();
    sfx("ok");
  }

  function resultsToMenu() {
    if (!uiState.resultsOpen) return;
    // El motor ya cerró la sesión. Ocultar su overlay evita que reaparezca
    // detrás del Refugio cuando se inicia otra partida desde el menú HD.
    var legacy = el("overlay");
    if (legacy) { legacy.classList.add("hidden"); legacy.setAttribute("aria-hidden", "true"); legacy.inert = true; }
    hideResults();
    if (window.DD_BOOT && window.DD_BOOT.exitGameToMenu) window.DD_BOOT.exitGameToMenu();
    else showMainMenu();
    sfx("back");
  }

  /* ============================ D. TIENDA / MAPA ========================== */
  var modalReturnFocus = null;
  function rememberModalFocus() {
    if (!uiState.shopOpen && !uiState.mapOpen) modalReturnFocus = document.activeElement;
  }
  function openShop() {
    buildDOM();
    rememberModalFocus();
    uiState.mapOpen = false;
    uiState.shopOpen = true;
    el("dd-map-modal").classList.add("dd-hidden");
    el("dd-shop-modal").classList.remove("dd-hidden");
    el("dd-hud").inert = true;
    renderShop();
    el("dd-shop-close").focus({ preventScroll: true });
  }

  function openMap() {
    buildDOM();
    rememberModalFocus();
    uiState.shopOpen = false;
    uiState.mapOpen = true;
    el("dd-shop-modal").classList.add("dd-hidden");
    var modal = el("dd-map-modal");
    modal.classList.remove("dd-hidden");
    el("dd-hud").inert = true;
    var br = window.__DD_BRIDGE;
    var snap = br ? br.getSnapshot() : { circle: 0, running: false };
    var inHub = !!(window.DD_HUB && window.DD_HUB.isActive());
    var activeCircle = !inHub && snap.running ? snap.circle : null;
    var listEl = el("dd-circles-list");
    if (listEl) {
      var circles = circleInfo();
      listEl.innerHTML = '<p class="dd-map-location">' + (inHub ? 'UBICACIÓN ACTUAL · REFUGIO' : 'TORRE · CÍRCULOS') +
        '<small> ↑↓ DESPLAZAR</small></p>' +
        (circles.length ? circles.slice().reverse().map(function (c) {
          var current = c.idx === activeCircle;
          return '<div class="dd-circle-node ' + (current ? 'current' : '') + '"><div>' +
            '<strong style="color:#ff2d7a;margin-right:8px;">[' + esc(c.code) + ']</strong><span>' + esc(c.name) + '</span>' +
            '<div style="font-size:11px;color:#94a3b8;margin-top:2px;">' + esc(c.place) + '</div></div>' +
            (current ? '<span style="font-size:11px;font-weight:800;">UBICACIÓN ACTUAL</span>' : '') + '</div>';
        }).join("") : '<p class="dd-opt-note">El mapa aún no está disponible.</p>');
      var currentNode = listEl.querySelector(".current");
      listEl.scrollTop = currentNode ? Math.max(0, currentNode.offsetTop - listEl.offsetTop - listEl.clientHeight / 2) : listEl.scrollHeight;
    }
    el("dd-map-close").focus({ preventScroll: true });
  }

  function modalFocusStep(dir) {
    var host = el(uiState.shopOpen ? "dd-shop-modal" : "dd-map-modal");
    if (!host) return;
    var items = Array.prototype.filter.call(host.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex=\"0\"]"), function (item) {
      return item.getClientRects().length > 0;
    });
    if (!items.length) return;
    var i = items.indexOf(document.activeElement);
    i = i < 0 ? (dir < 0 ? items.length - 1 : 0) : (i + dir + items.length) % items.length;
    items[i].focus({ preventScroll: true });
    items[i].scrollIntoView({ block: "nearest", inline: "nearest" });
    sfx("move");
  }

  function activateModalFocus() {
    var active = document.activeElement;
    var host = el(uiState.shopOpen ? "dd-shop-modal" : "dd-map-modal");
    if (!host || !active || !host.contains(active) || active.disabled) return;
    var weapon = active.getAttribute("data-w"), category = active.getAttribute("data-cat");
    active.click();
    // La armería vuelve a dibujar sus tarjetas al seleccionar. Recuperar el foco
    // por valor, sin usar selectores construidos con datos externos.
    if (uiState.shopOpen && (weapon || category)) {
      var nodes = host.querySelectorAll(weapon ? "[data-w]" : "[data-cat]");
      Array.prototype.some.call(nodes, function (node) {
        if (node.getAttribute(weapon ? "data-w" : "data-cat") !== (weapon || category)) return false;
        node.focus({ preventScroll: true });
        return true;
      });
    }
  }

  function closeModals(skipFocusRestore) {
    // Event listeners pass an Event, not this explicit internal flag.
    skipFocusRestore = skipFocusRestore === true;
    uiState.shopOpen = false;
    uiState.mapOpen = false;
    var s = el("dd-shop-modal");
    var m = el("dd-map-modal");
    if (s) s.classList.add("dd-hidden");
    if (m) m.classList.add("dd-hidden");
    var hud = el("dd-hud");
    if (hud) hud.inert = false;
    var target = modalReturnFocus;
    modalReturnFocus = null;
    if (!skipFocusRestore && target && target !== document.body && target.isConnected && target.getClientRects().length && target.focus) {
      target.focus({ preventScroll: true });
    }
  }

  /* ---- catálogo de la armería (mismo comportamiento que la versión previa) */
  function getCatalogWeapons() {
    var br = window.__DD_BRIDGE;
    var list = [];
    try { list = br && br.getWeaponsList ? br.getWeaponsList() : []; } catch (e) { list = []; }
    return Array.isArray(list) ? list : [];
  }

  function renderShop() {
    var grid = el("dd-weapons-grid");
    if (!grid) return;
    var br = window.__DD_BRIDGE;
    var snap = br ? br.getSnapshot() : { credits: 0, owned: [], running: false };
    var cred = el("dd-shop-credits");
    if (cred) cred.textContent = String(snap.credits || 0);
    var context = el("dd-shop-context");
    if (context) context.textContent = snap.running ? "PRECIOS DE LA INCURSIÓN · CRÉDITOS ACTUALES" : "REFUGIO · PRUEBA SIN COSTE · PRECIOS DE INCURSIÓN";
    var weapons = getCatalogWeapons();
    var cats = ["TODAS"];
    weapons.forEach(function (w) {
      var c = (w.category || "OTRAS").toUpperCase();
      if (cats.indexOf(c) < 0) cats.push(c);
    });
    var filters = el("dd-shop-filters");
    if (filters && filters.dataset.categories !== JSON.stringify(cats)) {
      filters.dataset.categories = JSON.stringify(cats);
      if (cats.indexOf(uiState.selectedCategory) < 0) uiState.selectedCategory = "TODAS";
      filters.innerHTML = cats.map(function (c) {
        return '<button type="button" class="dd-filter-chip' + (c === uiState.selectedCategory ? " active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
      }).join("");
    }
    if (filters && !filters.dataset.bound) {
      filters.dataset.bound = "1";
      filters.addEventListener("click", function (ev) {
        var b = ev.target.closest(".dd-filter-chip");
        if (!b) return;
        uiState.selectedCategory = b.getAttribute("data-cat");
        Array.prototype.forEach.call(filters.querySelectorAll(".dd-filter-chip"), function (x) {
          x.classList.toggle("active", x === b);
        });
        renderShop();
      });
    }

    var list = weapons.filter(function (w) {
      return uiState.selectedCategory === "TODAS" || (w.category || "OTRAS").toUpperCase() === uiState.selectedCategory;
    }).slice(0, 120);

    if (!list.length) {
      grid.innerHTML = '<p class="dd-opt-note">La armería está cargando. Vuelve a abrirla en unos segundos.</p>';
    } else {
      grid.innerHTML = list.map(function (w) {
        var owned = snap.owned && snap.owned.indexOf(w.id) >= 0;
        var sel = w.id === uiState.selectedWeaponId;
        return '<button type="button" class="dd-weapon-card' + (sel ? " selected" : "") + (owned ? " equipped" : "") + '" data-w="' + esc(w.id) + '">' +
          '<img alt="" src="' + weaponImgSrc(w.id) + '">' +
          '<b class="dd-weapon-card-name">' + esc((w.name || w.id).toUpperCase()) + '</b>' +
          '<span class="dd-weapon-card-price">' + (owned ? "EN PROPIEDAD" : (typeof w.price === "number" ? esc(w.price) + " CR" : "PRECIO NO DISPONIBLE")) + '</span>' +
          '</button>';
      }).join("");
      grid.onclick = function (ev) {
        var card = ev.target.closest(".dd-weapon-card");
        if (!card) return;
        var hadFocus = document.activeElement === card;
        uiState.selectedWeaponId = card.getAttribute("data-w");
        renderShop();
        if (hadFocus) {
          Array.prototype.some.call(grid.querySelectorAll("[data-w]"), function (item) {
            if (item.getAttribute("data-w") !== uiState.selectedWeaponId) return false;
            item.focus({ preventScroll: true });
            return true;
          });
        }
      };
    }
    renderInspector(snap);
  }

  function renderInspector(snap) {
    var host = el("dd-shop-inspector");
    if (!host) return;
    var br = window.__DD_BRIDGE;
    var wid = uiState.selectedWeaponId;
    var stats = null;
    try { stats = br && br.getWeaponStats ? br.getWeaponStats(wid) : null; } catch (e) { stats = null; }
    var owned = snap.owned && snap.owned.indexOf(wid) >= 0;
    var preview = !snap.running && !!(window.DD_HUB && window.DD_HUB.isActive());
    var unavailable = !owned && !preview;
    var metrics = [["DAÑO", "damage"], ["CADENCIA", "fireRate"], ["VELOCIDAD", "speed"], ["PROYECTILES", "pellets"], ["PERFORACIÓN", "pierce"]];
    host.innerHTML =
      '<div class="dd-inspector-preview"><img alt="" src="' + weaponImgSrc(wid) + '"></div>' +
      '<b class="dd-inspector-name">' + esc(String((stats && stats.name) || wid).toUpperCase()) + '</b>' +
      '<div class="dd-inspector-stats">' +
      metrics.map(function (pair) {
        var v = stats && stats[pair[1]];
        if (typeof v !== "number" || !isFinite(v)) return "";
        return '<div class="dd-stat-row"><span>' + pair[0] + '</span><b>' + esc(Math.round(v * 100) / 100) + '</b></div>';
      }).join("") +
      '</div>' +
      (preview && !owned ? '<p class="dd-shop-note">Prueba en el Refugio: el equipo se reinicia al comenzar una incursión.</p>' : '') +
      (unavailable ? '<p class="dd-shop-note">Consigue armas en las tiendas y recompensas de la incursión; allí se confirma cualquier reemplazo.</p>' : '') +
      '<div class="dd-shop-actions"><button type="button" class="dd-action-btn primary" id="dd-shop-equip"' + (unavailable ? ' disabled' : '') + '>' +
      (owned ? "EQUIPAR" : preview ? "PROBAR EN REFUGIO" : "DISPONIBLE EN INCURSIÓN") + '</button></div>' +
      '<p class="dd-shop-feedback" id="dd-shop-feedback" role="status" aria-live="polite"></p>';

    el("dd-shop-equip").addEventListener("click", function () {
      var snapNow = br ? br.getSnapshot() : null;
      if (!br) return;
      var ok = false;
      try { ok = !!br.buyOrEquipWeapon(wid, !(snapNow && snapNow.running)); } catch (e) { console.warn("[DD_UI] armería", e); }
      renderShop();
      var feedback = el("dd-shop-feedback");
      if (feedback) feedback.textContent = ok ? "Arma equipada." : "No se pudo equipar o adquirir el arma.";
      sfx(ok ? "ok" : "back");
      var button = el("dd-shop-equip");
      if (button) button.focus({ preventScroll: true });
    });
  }

  /* ============================ E. VISIBILIDAD ============================ */
  /* ---------------------------------------------------- latido propio -----
     El sondeo del mando y el reloj de la UI viven en tick(), que el motor llama
     desde su bucle de render. Pero ese bucle se retira cuando la escena legada
     (#overlay) está oculta, que es justo el caso en que ESTE menú es dueño de la
     pantalla. Resultado medido: 0 llamadas a tick() en 5 s con el menú abierto,
     y por tanto el mando inservible aunque la interfaz anuncie "A ELEGIR".

     Se añade un latido propio que sólo corre mientras el menú está visible y
     que se RETIRA en cuanto el motor vuelve a mandar frames: así no hay dos
     relojes a la vez ni trabajo duplicado. */
  var selfTick = { raf: 0, on: false };

  function engineIsTicking() {
    /* Si el motor llamó a tick() hace poco, no hace falta latido propio. */
    var now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    return !!(selfTick.lastEngineCall && (now - selfTick.lastEngineCall) < 1000);
  }

  function startSelfTick() {
    if (selfTick.on) return;
    if (typeof requestAnimationFrame !== "function") return;
    selfTick.on = true;
    var step = function () {
      if (!selfTick.on) return;
      selfTick.raf = requestAnimationFrame(step);
      /* Sólo late si nadie más lo hace y el menú sigue en pantalla. */
      if (!uiState.menuVisible && !uiState.resultsOpen) return;
      if (engineIsTicking()) return;
      try { tickInner(0.016); } catch (e) {}
    };
    selfTick.raf = requestAnimationFrame(step);
  }

  function stopSelfTick() {
    selfTick.on = false;
    if (selfTick.raf && typeof cancelAnimationFrame === "function") cancelAnimationFrame(selfTick.raf);
    selfTick.raf = 0;
  }

  function showMainMenu() {
    buildDOM();
    uiState.menuVisible = true;
    startSelfTick();
    /* Pausa la escena animada legada mientras este menú es dueño de la pantalla. */
    document.body.classList.add("dd-menu-owning");
    var m = el("dd-main-menu");
    if (m) { m.classList.remove("dd-hidden"); m.classList.add("dd-menu-in"); }
    var h = el("dd-hud");
    if (h) h.classList.add("dd-hidden");
    refreshContinue();
    setMenuSelection(uiState.menuIndex, false);
  }

  function hideMainMenu(opts) {
    uiState.menuVisible = false;
    stopSelfTick();
    document.body.classList.remove("dd-menu-owning");
    var m = el("dd-main-menu");
    if (m) m.classList.add("dd-hidden");
    var h = el("dd-hud");
    if (h) h.classList.remove("dd-hidden");
    if (!opts || !opts.keepState) {
      /* Al ocultarse el menú, cualquier submenú abierto queda clausurado. */
      closeSubmenuImmediate();
    }
  }

  function refreshAppearancePortraits() {
    var api = window.DD_APPEARANCE;
    var src = api && api.hudPreview ? api.hudPreview(api.current().id) : assetSrc('hud_portrait_protagonist');
    if (!src) return;
    ['dd-hud-portrait', 'dd-player-dialogue-portrait'].forEach(function(id) {
      var node = el(id);
      if (node && node.getAttribute('src') !== src) node.setAttribute('src', src);
    });
  }

  function showDialogue(speaker, text, durationSec, source) {
    buildDOM();
    if (!text) return;
    var box = el("dd-dialogue-box");
    var spk = el("dd-dj-speaker");
    var txt = el("dd-dj-text");
    var portrait = el("dd-tempo-portrait-wrap");
    var playerPortrait = el("dd-player-portrait-wrap");
    if (spk) { spk.textContent = speaker || ""; spk.hidden = !speaker; }
    // Sólo asignar retratos a emisores inequívocos, nunca a avisos o residentes.
    var name = String(speaker || '').trim().toUpperCase();
    var isTempo = name === "TEMPO";
    var isPlayer = name === "PROTAGONISTA" || name === "JUGADOR" || name === "PLAYER";
    if (portrait) portrait.hidden = !isTempo;
    if (playerPortrait) playerPortrait.hidden = !isPlayer;
    if (isPlayer) refreshAppearancePortraits();
    if (txt) txt.textContent = text;
    if (box) { box.classList.toggle("dd-dialogue-no-portrait", !isTempo && !isPlayer); box.classList.remove("dd-hidden"); }
    uiState.dialogueSource = source === "engine" ? "engine" : "direct";
    uiState.dialogueTimer = source === "engine" ? 0 : (durationSec || 4.2);
  }

  function refreshAssets() {
    buildDOM();
    var map = [
      ["dd-menu-backdrop", menuBackdropSrc()],
      ["dd-menu-logo-img", assetSrc("logo_deadbeat_graffiti") || "assets/logos/logo_deadbeat_graffiti.png"],
      ["dd-hud-coin-img", assetSrc("hud_credit_coin", "pickups/pickup_credits_00.png")],
      ["dd-skill-bomb-img", assetSrc("hud_skill_bomb", "pickups/pickup_bomb_00.png")],
      ["dd-skill-boost-img", assetSrc("hud_skill_boost", "pickups/pickup_boost_00.png")],
      ["dd-skill-dodge-img", assetSrc("hud_skill_dodge", "pickups/pickup_speedup_00.png")],
      ["dd-dj-portrait", assetSrc("dialogue_portrait_dj")],
      ["dd-map-tower-img", assetSrc("map_infernal_tower")]
    ];
    for (var i = 0; i < map.length; i++) {
      var node = el(map[i][0]);
      if (node && map[i][1]) node.src = map[i][1];
    }
  }

  /* El motor actualiza #minimap con su propio mapa y sus reglas de visibilidad.
     Reutilizar ese lienzo evita inventar geometría o revelar salas ocultas. */
  function drawMinimap(snap, inHub) {
    var cnv = el("dd-minimap-canvas");
    if (!cnv) return;
    var ctx = cnv.getContext("2d");
    var w = cnv.width, h = cnv.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#06030c";
    ctx.fillRect(0, 0, w, h);
    var original = el("minimap");
    if (!inHub && snap && snap.running && original && original.width && original.height) {
      var scale = Math.min(w / original.width, h / original.height);
      var dw = original.width * scale, dh = original.height * scale;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(original, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return;
    }
    ctx.fillStyle = "#a4b2c5";
    ctx.font = "600 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SIN INCURSIÓN", w / 2, h / 2);
  }

  /* ================================ F. TICK =============================== */
  /* tick() = entrada pública que usa el motor. tickInner() = el trabajo real,
     compartido por el motor y por el latido propio. */
  function tick(dt) {
    /* Marca de vida del motor: el latido propio la consulta para retirarse. */
    selfTick.lastEngineCall = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    return tickInner(dt);
  }

  function tickInner(dt) {
    buildDOM();
    var cdt = Math.min(0.05, Math.max(0.001, dt || 0.016));
    /* Los enfriamientos de entrada se miden con reloj de pared: si el render va
       a 4 fps, un contador por frame dejaría el mando inservible. */
    var nowMs = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    if (!tick._last) tick._last = nowMs;
    var wallSec = Math.min(0.5, Math.max(0, (nowMs - tick._last) / 1000));
    tick._last = nowMs;
    var br = window.__DD_BRIDGE;
    var snap = br ? br.getSnapshot() : null;
    var inHub = window.DD_HUB && window.DD_HUB.isActive();
    var beatLight = el('dd-main-menu') && el('dd-main-menu').querySelector('.dd-menu-beat-light');
    if (beatLight && uiState.menuVisible && !uiState.submenu) {
      var music = window.DDC_COVER && window.DDC_COVER.music;
      var phase = music && music.beatPhase;
      var motion = false;
      try { motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
      var a11y = storeJson('dmodisco_a11y_v1') || {};
      var on = !motion && a11y.flash !== false && typeof phase === 'number' && isFinite(phase);
      beatLight.style.opacity = on ? (0.035 + 0.15 * Math.exp(-phase * 4)).toFixed(3) : '0';
    }

    /* El menú se retira cuando hay partida REAL en curso (motor arrancado) o
       cuando el HUB toma el control.
       FASE 01.4 · excepción: si el menú acaba de RESTAURARSE tras un rechazo de
       entrada, el motor puede haber quedado en marcha pese a no haber partida
       jugable. Sin esta guarda, el siguiente tick volvía a ocultar el menú
       recién restaurado y el jugador quedaba en un estado sin menú y sin partida
       (medido: menú visible a los 6000 ms, oculto otra vez a los 6400 ms).
       La ventana es corta y sólo cubre el tick inmediato a la restauración. */
    /* FASE 01.4 · la condición era sólo `snap.running`, y eso es demasiado
       amplio: si el motor queda en marcha SIN que la entrada a partida se haya
       aceptado (rechazo de la puerta, puente incompleto), el siguiente tick
       ocultaba el menú recién restaurado y el jugador quedaba sin menú y sin
       partida. Medido: menú restaurado a los 6800 ms, oculto otra vez a los
       7600 ms. Ahora la autoridad es la PROPIEDAD de la partida: DD_BOOT está en
       PLAYING. Un motor corriendo en MAIN_MENU no es una partida. */
    var enPartida = false;
    try { enPartida = !!(window.DD_BOOT && window.DD_BOOT.getState().state === "PLAYING"); } catch (e) {}
    if (uiState.menuVisible && enPartida) {
      hideMainMenu();
    }
    // Si el motor presenta una elección o pausa mientras se consulta un panel
    // HD, el diálogo nativo tiene prioridad y conserva el foco que ya recibió.
    if ((uiState.shopOpen || uiState.mapOpen) &&
        document.querySelector("#shot-choice-overlay.visible, #risk-choice-overlay.visible, #pause-overlay.visible")) {
      closeModals(true);
    }
    var hudEl = el("dd-hud");
    var cineBlocking = !!(window.DD_CINE && window.DD_CINE.isBlocking());
    if (hudEl) hudEl.classList.toggle("dd-hidden", uiState.menuVisible || uiState.resultsOpen || cineBlocking);

    /* Mando: una sola lectura por frame para todo el árbol. El sondeo no se
       congela por gpCooldown: el enfriamiento sólo frena las acciones discretas
       (A/B) dentro de pollGamepad; la direccional se gestiona con repetición
       propia y necesita evaluar cada frame para el auto-repeat. */
    if (uiState.gpCooldown > 0) uiState.gpCooldown = Math.max(0, uiState.gpCooldown - wallSec);
    if (navigator.getGamepads) pollGamepad(snap, inHub, wallSec);

    if (snap && (!uiState.menuVisible)) updateHud(snap, inHub);

    var subs = el("subs");
    var showEngineSubs = subs && subs.classList.contains("show") && !inHub && !uiState.menuVisible && !uiState.resultsOpen;
    var whoNode = showEngineSubs && subs.querySelector(".subs-who");
    var textNode = showEngineSubs && subs.querySelector(".subs-text");
    var who = whoNode ? whoNode.textContent.trim() : "";
    var txt = textNode ? textNode.textContent.trim() : "";
    if (showEngineSubs && txt) {
      var signature = JSON.stringify([who, txt]);
      if (signature !== uiState.lastSubsText || uiState.dialogueSource !== "engine") {
        uiState.lastSubsText = signature;
        showDialogue(who, txt, 0, "engine");
      }
    } else {
      uiState.lastSubsText = "";
      if (uiState.dialogueSource === "engine") {
        el("dd-dialogue-box").classList.add("dd-hidden");
        uiState.dialogueSource = null;
      }
    }
    if (uiState.dialogueSource === "direct" && uiState.dialogueTimer > 0) {
      uiState.dialogueTimer -= cdt;
      if (uiState.dialogueTimer <= 0) {
        var box = el("dd-dialogue-box");
        if (box) box.classList.add("dd-hidden");
        uiState.dialogueSource = null;
      }
    }
  }

  /* ============ MANDO: configuración y estado persistente ============
     GP_CONFIG es la única fuente de verdad de la calibración (zona muerta,
     dominancia de ejes y auto-repetición). Ajustar aquí, nunca inline.
       - axisEnter / axisRelease: histéresis de la zona muerta. El stick debe
         superar axisEnter para activarse y caer por debajo de axisRelease para
         volver a neutro; el hueco entre ambos evita parpadeos en el borde y
         disparos dobles.
       - axisDominance: un eje sólo dispara si su magnitud supera a la del otro
         eje por este factor; en diagonales manda un único eje (nada de
         izquierda+arriba a la vez).
       - repeatDelay / repeatRate: repetición de direcciones mantenidas
         (d-pad o stick). La activación inicial dispara al instante; después
         espera repeatDelay y repite a repeatRate.
       - stepFallback: paso usado si un <input type=range> no declara step. */
  var GP_CONFIG = {
    axisEnter: 0.35,
    axisRelease: 0.24,
    axisDominance: 1.35,
    repeatDelay: 0.38,
    repeatRate: 0.085,
    stepFallback: 1
  };

  var gpAxis = { 0: { active: false }, 1: { active: false } };
  var gpDir = { up: null, down: null, left: null, right: null };

  function resetDirectionalState() {
    gpDir.up = gpDir.down = gpDir.left = gpDir.right = null;
    gpAxis[0].active = false;
    gpAxis[1].active = false;
  }

  function rawAxes(gp) {
    var a = gp.axes || [];
    var x = typeof a[0] === "number" && isFinite(a[0]) ? a[0] : 0;
    var y = typeof a[1] === "number" && isFinite(a[1]) ? a[1] : 0;
    return { x: x, y: y };
  }

  /* Dirección con histéresis por eje. La dominancia entre ejes se decide una
     vez por frame comparando magnitudes (ver directionState). */
  function hysteresisDir(idx, raw) {
    var mag = Math.abs(raw), st = gpAxis[idx];
    if (mag <= GP_CONFIG.axisRelease) { st.active = false; return 0; }
    if (st.active) return raw < 0 ? -1 : 1;
    if (mag >= GP_CONFIG.axisEnter) { st.active = true; return raw < 0 ? -1 : 1; }
    return 0;
  }

  /* Estado direccional de este frame. El d-pad manda siempre; en stick, sólo
     dispara el eje dominante. Devuelve cuatro booleanos. */
  function directionState(gp) {
    var ax = rawAxes(gp);
    var magX = Math.abs(ax.x), magY = Math.abs(ax.y);
    var domX = magX >= magY * GP_CONFIG.axisDominance;
    var domY = magY >= magX * GP_CONFIG.axisDominance;
    var axDir = domX ? hysteresisDir(0, ax.x) : 0;
    var ayDir = domY ? hysteresisDir(1, ax.y) : 0;
    var b = gp.buttons || [];
    var dUp = b[12] && b[12].pressed, dDown = b[13] && b[13].pressed;
    var dLeft = b[14] && b[14].pressed, dRight = b[15] && b[15].pressed;
    return {
      up: !!dUp || ayDir < 0,
      down: !!dDown || ayDir > 0,
      left: !!dLeft || axDir < 0,
      right: !!dRight || axDir > 0
    };
  }

  /* Auto-repetición controlada por dirección. Devuelve true en el frame en que
     debe dispararse la acción: inmediato al activar, tras repeatDelay empieza
     la repetición a repeatRate. Se rearma al soltar la dirección. */
  function repeatFire(key, active, wallSec) {
    var st = gpDir[key];
    if (!active) { gpDir[key] = null; return false; }
    if (!st) { gpDir[key] = { t: 0, n: 0 }; return true; }
    /* Tope por sondeo: una dirección mantenida no puede acumular más
       wallSec que repeatRate en UNA llamada, aunque el frame se haya
       atascado segundos enteros (p.ej. SwiftShader). Sin este tope, en
       cuanto se armaba la repetición cada frame lento (> repeatDelay)
       disparaba un paso extra. Aprobado por el usuario 2026-11-08. */
    st.t += (typeof wallSec === "number" && isFinite(wallSec)) ? Math.min(Math.max(0, wallSec), GP_CONFIG.repeatRate) : 0;
    var threshold = st.n === 0 ? GP_CONFIG.repeatDelay : GP_CONFIG.repeatRate;
    if (st.t >= threshold) { st.t -= threshold; st.n += 1; return true; }
    return false;
  }

  /* Range enfocado DENTRO del submenú (los cinco sliders del OPCIONES: cuatro
     del motor, uno del volumen del menú). Cualquier otro foco devuelve null. */
  function focusedRange() {
    var a = document.activeElement;
    if (a && a.tagName === "INPUT" && a.type === "range" && a.closest && a.closest("#dd-submenu")) return a;
    return null;
  }

  /* Ajuste REAL del slider: respeta min/max/step del propio <input> (los cinco
     declaran step=1), clampa a los límites y emite "input" para que los
     listeners existentes apliquen el cambio de verdad (motor Xl.set /
     ddc_cover_settings_v1) y actualicen el <output>. En el límite no hace nada
     (devuelve false, sin evento, sin cambio visual ni sonoro). */
  function adjustRange(input, dir, coarse) {
    var min = parseFloat(input.min); if (!isFinite(min)) min = 0;
    var max = parseFloat(input.max); if (!isFinite(max)) max = 100;
    var step = parseFloat(input.step); if (!(step > 0)) step = GP_CONFIG.stepFallback;
    /* Con flechas o cruceta el paso es de una vigésima parte del recorrido (5 %
       en los volúmenes): con el paso nativo de 1 hacían falta cien pulsaciones. */
    if (coarse) step = Math.max(step, Math.round((max - min) / 20 / step) * step);
    var v = parseFloat(input.value); if (!isFinite(v)) v = min;
    var next = Math.max(min, Math.min(max, Math.round((v + dir * step) * 1000) / 1000));
    if (next === v) return false;
    input.value = String(next);
    try {
      input.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (e) {
      var ev = document.createEvent("Event"); ev.initEvent("input", true, false);
      input.dispatchEvent(ev);
    }
    return true;
  }

  /* Detección de flanco para los botones discretos (A/B).
     Sin esto, mantener un botón pulsado lo repetía cada cooldown: al abrir un
     submenú con A, la misma pulsación seguía activa y elegía el primer elemento
     del submenú recién abierto. Una pulsación produce una sola acción hasta que
     se suelta. La direccional NO usa esto: usa repeatFire (repetición controlada). */
  var gpPrev = {};
  function gpEdge(gp, i, pressed) {
    var key = (gp.index === undefined ? 0 : gp.index) + ":" + i;
    var was = !!gpPrev[key];
    gpPrev[key] = !!pressed;
    return !!pressed && !was;
  }

  function pollGamepad(snap, inHub, wallSec) {
    var pads = navigator.getGamepads();
    for (var i = 0; i < pads.length; i++) {
      var gp = pads[i];
      if (!gp || !gp.connected) continue;
      var pill = el("dd-gamepad-pill");
      if (pill && pill.textContent.indexOf("CONECTADO") < 0) {
        pill.textContent = "MANDO XBOX CONECTADO · " + String(gp.id || "GAMEPAD").slice(0, 22).toUpperCase();
      }
      var dir = directionState(gp);
      var up = repeatFire("up", dir.up, wallSec);
      var down = repeatFire("down", dir.down, wallSec);
      var left = repeatFire("left", dir.left, wallSec);
      var right = repeatFire("right", dir.right, wallSec);
      var btnA = gpEdge(gp, 0, gp.buttons[0] && gp.buttons[0].pressed);
      var btnB = gpEdge(gp, 1, gp.buttons[1] && gp.buttons[1].pressed);
      if (up || down || left || right || btnA || btnB) document.body.classList.add("dd-input-pad");

      if (uiState.resultsOpen) {
        if (up || left) selectResult(uiState.resultsIndex - 1);
        else if (down || right) selectResult(uiState.resultsIndex + 1);
        else if (btnA && uiState.gpCooldown <= 0) {
          resultControls()[uiState.resultsIndex].click();
          uiState.gpCooldown = 0.45;
          resetDirectionalState();
        }
      } else if (uiState.submenu) {
        /* B (volver) manda sobre cualquier dirección y sobre A. */
        if (btnB) {
          if (uiState.gpCooldown <= 0) {
            sfx("back"); closeSubmenu(); uiState.gpCooldown = 0.45; resetDirectionalState();
          }
        } else if (btnA) {
          var rangeA = focusedRange();
          if (rangeA) {
            /* A sobre un slider = un único incremento (comportamiento FASE 01),
               con clamp y evento input real. Nunca en auto-repetición. */
            if (uiState.gpCooldown <= 0) {
              if (adjustRange(rangeA, 1)) sfx("move");
              uiState.gpCooldown = 0.18;
            }
          } else if (uiState.gpCooldown <= 0) {
            activateFocused(); uiState.gpCooldown = 0.45;
          }
        } else if (up) {
          focusStep(-1);
        } else if (down) {
          focusStep(1);
        } else if (left || right) {
          var range = focusedRange();
          if (range) {
            /* Slider enfocado: ←→ AJUSTAN el valor (nunca mueven el foco ni
               cambian nada en los límites). */
            if (adjustRange(range, left ? -1 : 1, true)) sfx("move");
          } else if (focusedInSubmenu() && focusedInSubmenu().tagName === "SELECT") {
            if (cycleSelect(focusedInSubmenu(), left ? -1 : 1)) sfx("move");
          } else {
            focusStep(left ? -1 : 1); /* fuera de sliders conserva FASE 01 */
          }
        }
      } else if (uiState.menuVisible) {
        if (up) { setMenuSelection(uiState.menuIndex - 1); }
        else if (down) { setMenuSelection(uiState.menuIndex + 1); }
        else if (btnA && uiState.gpCooldown <= 0) {
          var btns = menuButtons();
          if (btns[uiState.menuIndex]) triggerMenuAction(btns[uiState.menuIndex].getAttribute("data-action"));
          uiState.gpCooldown = 0.35; resetDirectionalState();
        }
      } else if (uiState.shopOpen || uiState.mapOpen) {
        var mapList = uiState.mapOpen ? el("dd-circles-list") : null;
        if (btnB && uiState.gpCooldown <= 0) { closeModals(); uiState.gpCooldown = 0.25; }
        else if (mapList && document.activeElement === mapList && (up || down)) {
          if (up && mapList.scrollTop <= 0) modalFocusStep(-1);
          else mapList.scrollTop += up ? -100 : 100;
        }
        else if (up || left) modalFocusStep(-1);
        else if (down || right) modalFocusStep(1);
        else if (btnA && uiState.gpCooldown <= 0) { activateModalFocus(); uiState.gpCooldown = 0.3; }
      }
      /* Fuera de los menús B pertenece al motor (esquiva). No abrir el mapa
         aquí: la misma pulsación también llega al control de combate. */
      break;
    }
  }

  /* Selector enfocado: cambia de opción sin abrir la lista nativa del navegador
     (que no se puede manejar con mando y tapa el menú). Da la vuelta en los extremos. */
  function cycleSelect(sel, dir) {
    var n = sel.options ? sel.options.length : 0;
    if (!n) return false;
    var i = (sel.selectedIndex + dir + n) % n, guard = 0;
    while (sel.options[i].disabled && guard++ < n) i = (i + dir + n) % n;
    if (i === sel.selectedIndex) return false;
    sel.selectedIndex = i;
    sel.dispatchEvent(new Event("input", { bubbles: true }));
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  function focusedInSubmenu() {
    var a = document.activeElement;
    return a && a.closest && a.closest("#dd-submenu") ? a : null;
  }

  function focusStep(dir) {
    var host = el("dd-submenu-body");
    if (!host) return;
    var items = Array.prototype.slice.call(host.querySelectorAll("button:not([disabled]), input, select"));
    /* Galerías y créditos largos también deben desplazarse con teclado y mando,
       aun cuando sólo tengan el botón VOLVER fuera del cuerpo. */
    if (!items.length && host.scrollHeight > host.clientHeight + 2) {
      host.scrollTop = Math.max(0, Math.min(host.scrollHeight - host.clientHeight, host.scrollTop + dir * 100));
      return;
    }
    if (!items.length && el("dd-submenu-back")) items = [el("dd-submenu-back")];
    if (!items.length) return;
    var i = items.indexOf(document.activeElement);
    i = i < 0 ? (dir < 0 ? items.length - 1 : 0) : (i + dir + items.length) % items.length;
    try { items[i].focus({ preventScroll: true }); } catch (e) { items[i].focus(); }
    /* En ventanas bajas el panel tiene desplazamiento: el control elegido se
       trae a la vista en vez de quedar seleccionado fuera de pantalla. */
    try { items[i].scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (e2) {}
    sfx("move");
  }

  function activateFocused() {
    var a = document.activeElement;
    if (!a) return;
    if (a.tagName === "INPUT" && a.type === "range") return; /* lo ajusta ←→ (adjustRange) */
    if (a.tagName === "SELECT") { if (cycleSelect(a, 1)) sfx("move"); return; }
    a.click();
  }

  function updateHud(snap, inHub) {
    var heartsEl = el("dd-hud-hearts");
    var fullSrc = assetSrc("hud_heart_full", "pickups/pickup_heart_00.png");
    var emptySrc = assetSrc("hud_heart_empty", "pickups/pickup_heart_00.png");
    // El motor expresa vida en unidades discretas, no en puntos sobre 100.
    var maxHearts = Math.max(0, Math.floor(snap.maxHp || 0));
    var curHearts = Math.max(0, Math.min(maxHearts, Math.ceil(snap.hp || 0)));
    if (heartsEl) heartsEl.setAttribute("aria-label", "Vidas " + curHearts + " de " + maxHearts);
    var hKey = curHearts + "/" + maxHearts + ":" + fullSrc;
    if (heartsEl && heartsEl.getAttribute("data-key") !== hKey) {
      heartsEl.setAttribute("data-key", hKey);
      var html = "";
      for (var i = 0; i < maxHearts; i++) {
        var on = i < curHearts;
        html += '<img class="dd-heart-icon" style="' + (on ? "" : "opacity:0.28;filter:grayscale(1);") + '" alt="" src="' + (on ? fullSrc : emptySrc) + '">';
      }
      heartsEl.innerHTML = html;
    }
    var hpFill = el("dd-hud-hp-fill");
    if (hpFill) hpFill.style.width = Math.max(0, Math.min(100, (snap.hp / Math.max(1, snap.maxHp)) * 100)).toFixed(1) + "%";
    var shieldEl = el("dd-hud-shield");
    if (shieldEl) {
      shieldEl.textContent = "ESC " + (snap.shield || 0);
      shieldEl.setAttribute("aria-label", "Escudos " + (snap.shield || 0));
    }
    // Igual que Rl() en el motor: HYPE ya está en escala 0–100; durante
    // RAVE la barra representa el tiempo restante respecto a su duración.
    var raveActive = snap.rave > 0;
    var hypePct = raveActive ? (snap.rave / Math.max(.01, snap.raveDuration)) * 100 : (snap.raveMeter || 0);
    hypePct = Math.max(0, Math.min(100, hypePct));
    var shFill = el("dd-hud-sh-fill");
    if (shFill) shFill.style.width = hypePct.toFixed(1) + "%";
    var hypeLabel = el("dd-hud-hype-label");
    if (hypeLabel) hypeLabel.textContent = raveActive ? "RAVE " + snap.rave.toFixed(1) + " s" : "HYPE " + Math.round(hypePct) + "%";
    var crEl = el("dd-hud-cr");
    if (crEl) crEl.textContent = String(snap.credits || 0);
    var nvEl = el("dd-hud-nv");
    if (nvEl) nvEl.textContent = "NV. " + (snap.level || 1);
    var wNameEl = el("dd-hud-weapon-name");
    if (wNameEl) wNameEl.textContent = (snap.weaponName || "M1911").toUpperCase() + " · ∞";
    var wImgEl = el("dd-hud-weapon-img");
    var wSrc = weaponImgSrc(snap.weapon || "m1911");
    if (wImgEl && wSrc && wImgEl.getAttribute("data-w") !== snap.weapon) {
      wImgEl.setAttribute("data-w", snap.weapon);
      wImgEl.src = wSrc;
    }
    var roomEl = el("dd-hud-room");
    if (roomEl) {
      roomEl.textContent = inHub ? "EL REFUGIO · ZONA SEGURA"
        : (snap.roomBanner || ("CÍRCULO " + (snap.circle + 1)));
    }
    var usingPad = document.body.classList.contains("dd-input-pad");
    var rollLabels = { Space: "ESP", KeyV: "V", AltLeft: "ALT" };
    [["dd-skill-bomb-key", usingPad ? "LB" : "Q"],
     ["dd-skill-boost-key", usingPad ? "RB" : "SHIFT"],
     ["dd-skill-dodge-key", usingPad ? "B" : (rollLabels[snap.rollKey] || "ESP")]].forEach(function (pair) {
      var node = el(pair[0]);
      if (node && node.textContent !== pair[1]) node.textContent = pair[1];
    });
    var bCnt = el("dd-skill-bomb-cnt");
    if (bCnt) bCnt.textContent = String(snap.bombs || 0);
    var bCard = el("dd-skill-bomb");
    if (bCard) bCard.classList.toggle("dd-empty", !(snap.bombs > 0));
    var sCnt = el("dd-skill-boost-cnt");
    if (sCnt) sCnt.textContent = String(snap.boosts || 0);
    var sCard = el("dd-skill-boost");
    if (sCard) sCard.classList.toggle("dd-empty", !(snap.boosts > 0));
    var bossHud = el("dd-boss-hud");
    if (bossHud) {
      if (!inHub && snap.bossActive && snap.boss) {
        bossHud.classList.remove("dd-hidden");
        el("dd-boss-name").textContent = String(snap.boss.name || "RESIDENTE").toUpperCase();
        var bpct = Math.max(0, Math.min(100, ((snap.boss.hp || 0) / Math.max(1, snap.boss.maxHp || 1)) * 100));
        el("dd-boss-hp-fill").style.width = bpct.toFixed(1) + "%";
      } else {
        bossHud.classList.add("dd-hidden");
      }
    }
    drawMinimap(snap, inHub);
  }

  /* ============================== G. TECLADO ============================== */
  /* El motor escucha Escape en window durante la fase de burbuja. Cerrar un
     modal HD antes de que llegue allí evita que la misma tecla abra la pausa. */
  document.addEventListener("keydown", function (ev) {
    if (uiState.resultsOpen && ev.code === "Tab") {
      ev.preventDefault();
      ev.stopPropagation();
      selectResult(uiState.resultsIndex + (ev.shiftKey ? -1 : 1));
      return;
    }
    if ((uiState.shopOpen || uiState.mapOpen) && ev.code === "Tab") {
      ev.preventDefault();
      ev.stopPropagation();
      modalFocusStep(ev.shiftKey ? -1 : 1);
      return;
    }
    if (!(uiState.shopOpen || uiState.mapOpen)) return;
    // El motor escucha en window: no dejar que la navegación del modal use
    // bombas, esquiva o interacción. Conservar el comportamiento nativo de
    // Enter/Espacio para botones y el desplazamiento de las listas.
    ev.stopPropagation();
    if (ev.code === "Escape") {
      ev.preventDefault();
      closeModals();
    } else if (window.DD_HUB && window.DD_HUB.isActive() && (ev.code === "KeyI" || ev.code === "KeyM")) {
      ev.preventDefault();
      if (ev.code === "KeyI") uiState.shopOpen ? closeModals() : openShop();
      else uiState.mapOpen ? closeModals() : openMap();
    }
  }, true);

  window.addEventListener("keydown", function (ev) {
    var k = ev.code;
    var isLeft = k === "ArrowLeft" || k === "KeyA", isRight = k === "ArrowRight" || k === "KeyD";
    /* La repetición de tecla sólo se admite para arrastrar un deslizador. */
    if (ev.repeat && !(uiState.submenu && (isLeft || isRight) && focusedRange())) return;
    document.body.classList.remove("dd-input-pad");

    if (uiState.resultsOpen) {
      if (k === "ArrowUp" || k === "ArrowLeft" || k === "ArrowDown" || k === "ArrowRight") {
        ev.preventDefault(); selectResult(uiState.resultsIndex + ((k === "ArrowUp" || k === "ArrowLeft") ? -1 : 1));
      }
      return;
    }

    /* SUBCONTROL: un submenú abierto captura la navegación. Todos los controles
       responden igual con teclado que con mando:
         ↑↓ / W S ......... control anterior / siguiente
         ←→ / A D ......... deslizador: ±5 % · selector: opción anterior / siguiente
                            botones: el de al lado
         ENTER / ESPACIO .. botón: pulsar · casilla: marcar · selector: siguiente
         ESC .............. volver */
    if (uiState.submenu) {
      var a = focusedInSubmenu();
      var tag = a ? a.tagName : "", type = a ? a.type : "";
      if (k === "Escape") { ev.preventDefault(); closeSubmenu(); sfx("back"); return; }
      /* TAB no sale nunca del panel: recorre los mismos controles que ↑↓. */
      if (k === "Tab") { ev.preventDefault(); focusStep(ev.shiftKey ? -1 : 1); return; }
      /* Si el foco se perdió (clic fuera, cambio de ventana), la primera tecla lo recupera. */
      if (!a && (isLeft || isRight || k === "Enter" || k === "Space")) { ev.preventDefault(); focusStep(1); return; }
      if (k === "ArrowDown" || k === "KeyS") { ev.preventDefault(); focusStep(1); return; }
      if (k === "ArrowUp" || k === "KeyW") { ev.preventDefault(); focusStep(-1); return; }
      if (tag === "INPUT" && type === "range") {
        if (isLeft || isRight) { ev.preventDefault(); if (adjustRange(a, isLeft ? -1 : 1, true)) sfx("move"); }
        return;
      }
      if (tag === "SELECT") {
        if (isLeft || isRight || k === "Enter" || k === "Space") {
          ev.preventDefault();
          if (cycleSelect(a, isLeft ? -1 : 1)) sfx("move");
        }
        return;
      }
      if (tag === "INPUT" && type === "checkbox") {
        if (k === "Enter" || k === "Space") { ev.preventDefault(); a.click(); sfx("ok"); }
        else if (isLeft || isRight) { ev.preventDefault(); focusStep(isLeft ? -1 : 1); }
        return;
      }
      if (k === "Enter" || k === "Space") {
        if (tag === "BUTTON") { ev.preventDefault(); a.click(); }
        return;
      }
      if (isLeft || isRight) { ev.preventDefault(); focusStep(isLeft ? -1 : 1); }
      return;
    }

    if (uiState.menuVisible) {
      if (k === "ArrowUp" || k === "KeyW") { ev.preventDefault(); setMenuSelection(uiState.menuIndex - 1); }
      else if (k === "ArrowDown" || k === "KeyS") { ev.preventDefault(); setMenuSelection(uiState.menuIndex + 1); }
      else if (k === "Tab") { ev.preventDefault(); setMenuSelection(uiState.menuIndex + (ev.shiftKey ? -1 : 1)); }
      else if (k === "Home") { ev.preventDefault(); setMenuSelection(0); }
      else if (k === "End") { ev.preventDefault(); setMenuSelection(menuButtons().length - 1); }
      else if (k === "Enter" || k === "Space") {
        ev.preventDefault();
        var btns = menuButtons();
        if (btns[uiState.menuIndex]) triggerMenuAction(btns[uiState.menuIndex].getAttribute("data-action"));
      }
      return;
    }

    if (k === "Escape" && (uiState.shopOpen || uiState.mapOpen)) {
      ev.preventDefault();
      closeModals();
      return;
    }
    /* En combate I/M pertenecen al inventario/pausa del motor. Abrir además
       nuestros paneles con el mismo evento apilaba dos interfaces y dejaba el
       motor pausado tras cerrar una de ellas. En el Refugio no hay partida
       activa y sí pueden funcionar como accesos rápidos a estos paneles. */
    var inHub = !!(window.DD_HUB && window.DD_HUB.isActive());
    if (k === "KeyI" && inHub) {
      uiState.shopOpen ? closeModals() : openShop();
    } else if (k === "KeyM" && inHub) {
      uiState.mapOpen ? closeModals() : openMap();
    } else if (k === "KeyH" && !uiState.shopOpen && !uiState.mapOpen) {
      if (window.DD_HUB) {
        window.DD_HUB.isActive() ? window.DD_HUB.exitToRun() : window.DD_HUB.enter();
      }
    }
  });

  /* Un clic en una zona vacía del menú o de un submenú no debe dejar el teclado
     sin destino: se impide que el navegador retire el foco del control actual. */
  document.addEventListener("mousedown", function (ev) {
    if (!uiState.menuVisible && !uiState.submenu) return;
    var t = ev.target;
    if (!t || !t.closest) return;
    if (!t.closest("#dd-main-menu, #dd-submenu")) return;
    if (t.closest("button, input, select, label, a")) return;
    ev.preventDefault();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildDOM);
  } else {
    buildDOM();
  }

  /* ============================== H. API ================================= */
  window.DD_UI = Object.freeze({
    showMainMenu: showMainMenu,
    hideMainMenu: hideMainMenu,
    openShop: openShop,
    openMap: openMap,
    closeModals: closeModals,
    showResults: showResults,
    showDialogue: showDialogue,
    refreshAssets: refreshAssets,
    tick: tick,
    openSubmenu: openSubmenu,
    closeSubmenu: closeSubmenu,
    triggerMenuAction: triggerMenuAction,
    readProgress: readProgress,
    hasSave: hasSave,
    readSave: readSave,
    STORAGE: STORAGE,
    storageKeys: storageKeys,
    isModalOpen: function () { return uiState.shopOpen || uiState.mapOpen || !!uiState.submenu; },
    getState: function () {
      return {
        menuVisible: uiState.menuVisible,
        shopOpen: uiState.shopOpen,
        mapOpen: uiState.mapOpen,
        submenu: uiState.submenu,
        menuIndex: uiState.menuIndex,
        busy: uiState.busy,
        selectedWeaponId: uiState.selectedWeaponId
      };
    }
  });
})();
