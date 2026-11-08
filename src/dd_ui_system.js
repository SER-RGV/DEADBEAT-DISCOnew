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

  var CIRCLES_INFO = [
    { idx: 0, code: "REFUGIO", name: "Cola del Club · El Refugio", boss: "Andén · El Portero" },
    { idx: 1, code: "I", name: "Lujuria · Salón de los Deseos", boss: "Magneta · La Anfitriona" },
    { idx: 2, code: "II", name: "Gula · Banquete Interminable", boss: "Bufé · Anfitrión Sin Fondo" },
    { idx: 3, code: "III", name: "Avaricia · El Club VIP", boss: "El Cajero · Señor del VIP" },
    { idx: 4, code: "IV", name: "Ira · Pista de las Peleas", boss: "El Pogo · Demonio de la Fosa" },
    { idx: 5, code: "V", name: "Herejía · Catedral del Ruido", boss: "El Oficiante · Pontífice" },
    { idx: 6, code: "VI", name: "Violencia · El Matadero", boss: "El Matarife · Coloso" },
    { idx: 7, code: "VII", name: "Fraude · Club de los Espejos", boss: "El Imitador · Espejismo" },
    { idx: 8, code: "VIII", name: "Traición · La Última Sala", boss: "El Traidor · Monarca Glacial" },
    { idx: 9, code: "IX", name: "El Núcleo Final · Última Canción", boss: "El Núcleo / El Arquitecto" }
  ];

  var uiState = {
    initialized: false,
    menuVisible: true,
    menuIndex: 0,
    shopOpen: false,
    mapOpen: false,
    submenu: null,              /* OPCIONES / CRÉDITOS / PARTIDAS */
    submenuIndex: 0,
    busy: false,                /* anti doble pulsación */
    selectedCategory: "ALL",
    selectedWeaponId: "m1911",
    dialogueTimer: 0,
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
    { action: "new", icon: "new", label: "NUEVA PARTIDA", sub: "Desciende al Círculo I · Lujuria" },
    { action: "continue", icon: "cont", label: "CONTINUAR", sub: "Retoma tu último descenso registrado" },
    { action: "slots", icon: "load", label: "SELECCIONAR PARTIDA", sub: "Ranuras de guardado disponibles" },
    { action: "options", icon: "opts", label: "OPCIONES", sub: "Audio, vídeo, controles y accesibilidad" },
    { action: "credits", icon: "cred", label: "CRÉDITOS", sub: "Quién hizo latir esta pista" },
    { action: "exit", icon: null, label: "SALIR", sub: "Cerrar el club" }
  ];

  function buildMainMenu() {
    var menu = document.createElement("section");
    menu.id = "dd-main-menu";
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
      '<img id="dd-menu-backdrop" alt="" src="' + (assetSrc("menu_main_backdrop") || "assets/ui/menu_main_backdrop.png") + '">' +
      '<div class="dd-menu-atmos" aria-hidden="true"><i class="a1"></i><i class="a2"></i><i class="a3"></i></div>' +
      '<div class="dd-menu-vig" aria-hidden="true"></div>' +
      '<div class="dd-menu-left">' +
      '  <div class="dd-menu-brand">' +
      '    <img id="dd-menu-logo-img" class="dd-menu-logo" alt="DEADBEAT DISCO" src="' + (assetSrc("logo_deadbeat_graffiti") || "assets/logos/logo_deadbeat_graffiti.png") + '">' +
      '    <div class="dd-menu-tagline"><span>UN DESCENSO MUY BAILABLE</span><i aria-hidden="true"></i></div>' +
      '  </div>' +
      '  <nav class="dd-menu-nav" id="dd-menu-nav" role="menu" aria-label="Opciones del menú principal">' + nav + '</nav>' +
      '  <div class="dd-menu-footer">' +
      '    <span class="dd-pill" id="dd-gamepad-pill">TECLADO + RATÓN · MANDO XBOX</span>' +
      '    <span class="dd-menu-build" id="dd-menu-build">v3.3.0</span>' +
      '  </div>' +
      '</div>' +
      '<div class="dd-menu-side">' +
      '  <div class="dd-menu-badge"><img src="assets/fase01/emblem_fox_glow.png" alt=""></div>' +
      '  <div class="dd-menu-hint" id="dd-menu-hint">' +
      '    <span><kbd>↑</kbd><kbd>↓</kbd> NAVEGAR</span>' +
      '    <span><kbd>ENTER</kbd> ELEGIR</span>' +
      '    <span><kbd>ESC</kbd> ATRÁS</span>' +
      '    <span class="dd-gp"><kbd>A</kbd> ELEGIR · <kbd>B</kbd> ATRÁS</span>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(menu);

    menu.querySelectorAll(".dd-menu-btn").forEach(function (btn, idx) {
      btn.addEventListener("mouseenter", function () {
        if (uiState.busy) return;
        setMenuSelection(idx, false);
      });
      btn.addEventListener("focus", function () {
        if (uiState.busy) return;
        setMenuSelection(idx, false);
      });
      btn.addEventListener("click", function () {
        if (uiState.busy) return;
        setMenuSelection(idx, false);
        triggerMenuAction(btn.getAttribute("data-action"));
      });
    });

    var build = el("dd-menu-build");
    if (build) {
      var meta = document.querySelector('meta[name="version"]');
      build.textContent = "v" + ((meta && meta.content) || "3.3.0");
    }
    paintBtnIcons();
  }

  function paintBtnIcons() {
    var btns = document.querySelectorAll("#dd-menu-nav .dd-menu-btn");
    Array.prototype.forEach.call(btns, function (b) {
      var icon = b.querySelector(".dd-btn-icon");
      if (!icon) return;
      var action = b.getAttribute("data-action");
      var map = { new: "new", continue: "cont", slots: "load", options: "opts", credits: "cred" };
      var name = map[action];
      if (!name) { icon.style.backgroundImage = "none"; return; }
      /* Las dos variantes van cargadas para que el cambio de estado no parpadee. */
      if (!icon.dataset.ready) {
        icon.dataset.ready = "1";
        var pre = new Image();
        pre.src = "assets/fase01/menu_icon_" + name + "_sel.png";
      }
      icon.style.backgroundImage = 'url("assets/fase01/menu_icon_' + name + '_idle.png")';
    });
  }

  function menuButtons() {
    return document.querySelectorAll("#dd-menu-nav .dd-menu-btn");
  }

  function setMenuSelection(idx, withSfx) {
    var btns = menuButtons();
    if (!btns.length) return;
    var n = btns.length;
    uiState.menuIndex = ((idx % n) + n) % n;
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

    if (action === "new") return doNewGame();
    if (action === "continue") return doContinue();
    if (action === "slots") { sfx("ok"); return openSubmenu("partidas"); }
    if (action === "options") { sfx("ok"); return openSubmenu("options"); }
    if (action === "credits") { sfx("ok"); return openSubmenu("credits"); }
    if (action === "exit") { sfx("ok"); return doExit(); }
  }

  function doNewGame() {
    startRunWithDescent(1);
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

      /* PLAYING sólo si el motor está REALMENTE en marcha. Antes se declaraba
         siempre, incluso con startRun() devolviendo false: el jugador veía el
         estado de partida sobre un motor parado. Se comprueba el motor y se
         espera brevemente a que confirme, sin bloquear la UI para siempre. */
      var verify = function () {
        try {
          if (window.DD_HUB && window.DD_HUB.isActive()) return true;
          if (br && typeof br.isRunning === "function") return !!br.isRunning();
          if (br && typeof br.getSnapshot === "function") {
            var snap = br.getSnapshot();
            return !!(snap && (snap.running || snap.isRunning));
          }
        } catch (e) {}
        return false;
      };

      var confirm = function (t0) {
        if (verify()) {
          window.DD_BOOT.enterGame();
          uiState.busy = false;
          if (why !== "complete") console.warn("[DD_UI] descenso forzado:", why);
          return;
        }
        if (Date.now() - t0 < 3000) { setTimeout(function () { confirm(t0); }, 120); return; }
        /* El motor no arrancó: se devuelve al menú con un aviso honesto en vez
           de fingir una partida en curso. */
        uiState.busy = false;
        console.warn("[DD_UI] el motor no arrancó; se cancela la entrada en partida");
        if (window.DD_UI && typeof window.DD_UI.showMainMenu === "function") window.DD_UI.showMainMenu();
        if (window.DD_BOOT && typeof window.DD_BOOT.exitGameToMenu === "function") window.DD_BOOT.exitGameToMenu();
        if (typeof showDialogue === "function") {
          showDialogue("DJ VIRGILIO", "El descenso no arrancó. Prueba otra vez.", 5);
        }
      };
      confirm(Date.now());
    };

    var guard = null, lastElapsed = -1, lastAdvance = Date.now();
    if (window.DD_CINE && typeof window.DD_CINE.playCircleDescent === "function") {
      try {
        window.DD_CINE.playCircleDescent(circleIdx, function () { launch("complete"); });
      } catch (e) {
        launch("error");
        return;
      }
      guard = setInterval(function () {
        if (started) { clearInterval(guard); return; }
        var st = window.DD_CINE && window.DD_CINE.getState ? window.DD_CINE.getState() : null;
        if (!st) { launch("finished"); return; }
        if (st.elapsed > lastElapsed + 0.001) { lastElapsed = st.elapsed; lastAdvance = Date.now(); }
        else if (Date.now() - lastAdvance > 4000) launch("stalled");
      }, 150);
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
    var victories = storeNum("dmo_victories_v214", 0);
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

  function doContinue() {
    var p = readProgress();
    if (!p.hasProgress) {
      sfx("back");
      openSubmenu("partidas", { noSave: true });
      return;
    }
    sfx("ok");
    /* El motor no guarda partidas a medias (diseño declarado del propio juego):
       continuar = reanudar el descenso en el círculo más profundo alcanzado,
       conservando el meta-progreso real. */
    var idx = p.bestRound >= 100 ? 9 : Math.max(0, Math.min(8, Math.ceil(Math.max(1, p.bestRound) / 11) - 1));
    doStartAt(idx, "continue");
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
    options: { title: "OPCIONES", sub: "Ajustes del club · se recuerdan en este navegador" },
    credits: { title: "CRÉDITOS", sub: "La pista no se construyó sola" },
    partidas: { title: "SELECCIÓN DE PARTIDA", sub: "Estado persistente del club" },
    exit: { title: "SALIR DEL CLUB", sub: "Cerrar la sesión de juego" }
  };

  function submenuHost() {
    var host = el("dd-submenu");
    if (host) return host;
    host = document.createElement("section");
    host.id = "dd-submenu";
    host.className = "dd-submenu-wrap";
    host.setAttribute("role", "dialog");
    host.setAttribute("aria-modal", "true");
    host.setAttribute("aria-hidden", "true");
    host.innerHTML =
      '<div class="dd-submenu-card">' +
      '  <header class="dd-submenu-head">' +
      '    <div><span class="dd-submenu-kicker" id="dd-submenu-kicker">CLUB</span>' +
      '    <h2 id="dd-submenu-title">SUBMENÚ</h2>' +
      '    <p id="dd-submenu-sub"></p></div>' +
      '    <button type="button" class="dd-submenu-back" id="dd-submenu-back">◀ VOLVER <kbd>ESC</kbd></button>' +
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

  function openSubmenu(name, opts) {
    var host = submenuHost();
    uiState.submenu = name;
    uiState.submenuIndex = 0;
    var meta = SUBMENU_TITLES[name] || { title: name.toUpperCase(), sub: "" };
    el("dd-submenu-kicker").textContent = "DEADBEAT DISCO · " + String(name).toUpperCase();
    el("dd-submenu-title").textContent = meta.title;
    el("dd-submenu-sub").textContent = meta.sub;
    el("dd-submenu-foot").textContent = "↑↓ NAVEGAR · ENTER APLICAR · ESC VOLVER";
    var body = el("dd-submenu-body");
    body.innerHTML = "";

    if (name === "options") renderOptions(body);
    else if (name === "credits") renderCredits(body);
    else if (name === "partidas") renderSlots(body, opts || {});
    else if (name === "exit") renderExit(body, opts || {});

    host.classList.add("is-open");
    host.setAttribute("aria-hidden", "false");
    document.getElementById("dd-main-menu").classList.add("dd-behind");
    if (window.DD_BOOT && window.DD_BOOT.openSubmenu) window.DD_BOOT.openSubmenu(name.toUpperCase());
    var first = body.querySelector("button, input, select");
    if (first) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }, 30);
  }

  function closeSubmenu() {
    var host = el("dd-submenu");
    if (host) {
      host.classList.remove("is-open");
      host.setAttribute("aria-hidden", "true");
    }
    var menu = el("dd-main-menu");
    if (menu) menu.classList.remove("dd-behind");
    uiState.submenu = null;
    if (window.DD_BOOT && window.DD_BOOT.closeSubmenu) window.DD_BOOT.closeSubmenu();
    var btn = menu && menu.querySelector(".dd-menu-btn.dd-selected");
    if (btn) { try { btn.focus({ preventScroll: true }); } catch (e) { btn.focus(); } }
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

    body.innerHTML =
      '<div class="dd-opt-grid">' +
      '  <section class="dd-opt-col">' +
      '    <h3>MEZCLA DEL JUEGO</h3>' +
      '    <p class="dd-opt-note">Controla la música y los efectos de la partida (motor DMO).</p>' +
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
      '    <div class="dd-opt-row"><label for="dd-opt-keys">TECLADO</label><span class="dd-opt-fixed">WASD / FLECHAS · ENTER · ESC</span></div>' +
      '    <div class="dd-opt-row"><label for="dd-opt-pad">MANDO XBOX</label><span class="dd-opt-fixed" id="dd-opt-pad">COMPROBANDO…</span></div>' +
      '  </section>' +
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
      mixHost.innerHTML = '<p class="dd-opt-note">La mezcla del motor aún no está lista. Vuelve a abrir OPCIONES en unos segundos.</p>';
    }

    var resEl = el("dd-opt-res");
    function paintRes() {
      if (!resEl) return;
      resEl.textContent = "VENTANA " + window.innerWidth + "×" + window.innerHeight +
        " · ESCALA " + (window.devicePixelRatio || 1).toFixed(2) + "× · LIENZO " + (el("game") ? el("game").width + "×" + el("game").height : "—");
    }
    paintRes();
    window.addEventListener("resize", paintRes);

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
      '    <div><b>DEADBEAT DISCO</b><span>DESCENSO · MÚSICA · CAOS · REDENCIÓN</span></div>' +
      '  </div>' +
      '  <dl class="dd-cred-list">' +
      '    <div><dt>DIRECCIÓN Y PRODUCCIÓN</dt><dd>SER-RGV</dd></div>' +
      '    <div><dt>DISEÑO Y DESARROLLO</dt><dd>SER-RGV</dd></div>' +
      '    <div><dt>DIRECCIÓN DE ARTE Y RECURSOS</dt><dd>SER-RGV</dd></div>' +
      '    <div><dt>MOTOR</dt><dd>' + (engine ? "DMO " + esc(engine) : "DMO") + ' · render isométrico propio · sin dependencias externas</dd></div>' +
      '    <div><dt>TIPOGRAFÍA DE PISTA</dt><dd>DDPixel — fuente bitmap incluida en la propia build' + (fontOk ? " (cargada correctamente)" : "") + '</dd></div>' +
      '    <div><dt>MÚSICA Y AUDIO</dt><dd>Síntesis procedural WebAudio original del proyecto</dd></div>' +
      '    <div><dt>FASE 01 · MENÚ Y CINEMÁTICA</dt><dd>Integración sobre el motor existente (DD_BOOT · DD_UI · DD_CINE)</dd></div>' +
      '    <div><dt>VERSIÓN</dt><dd>v' + esc(version) + '</dd></div>' +
      '  </dl>' +
      '  <p class="dd-cred-note">Créditos construidos sólo con la información real del proyecto. ' +
      'No se listan personas ni colaboradores que no consten en el repositorio.</p>' +
      '</div>';
  }

  /* --------------------------- SELECCIÓN DE PARTIDA ----------------------- */
  function renderSlots(body, opts) {
    var p = readProgress();
    /* El motor no implementa ranuras múltiples: el estado persistente es único
       (meta-progreso + mejor descenso). Se muestra la verdad y se ofrece la
       acción más pequeña compatible: reanudar ese estado. */
    var circleIdx = p.bestRound >= 100 ? 9 : Math.max(0, Math.min(8, Math.ceil(Math.max(1, p.bestRound) / 11) - 1));
    var c = CIRCLES_INFO[circleIdx];

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
      '    <span>' + (p.hasProgress ? esc(c.name) : "Cada descenso empieza en el Círculo I · Lujuria") + '</span>' +
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
      '  <b>LIMITACIÓN REAL DEL SISTEMA DE GUARDADO</b>' +
      '  <p>El motor no guarda partidas a media incursión (así está diseñado: «el club no guarda partidas a medias»). ' +
      'Por eso no se muestran ranuras ficticias. Lo que persiste es el meta-progreso: mejor descenso, fichas, ' +
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
      '  <p class="dd-exit-q">¿Cerrar el club y salir a la calle?</p>' +
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
    var host = el("dd-submenu");
    if (host) { host.classList.remove("is-open"); host.setAttribute("aria-hidden", "true"); }
    var m = el("dd-main-menu");
    if (m) m.classList.remove("dd-behind");
    uiState.submenu = null;
    /* Invariante: el FSM no puede quedarse en SUBMENU sin submenú abierto.
       Sin esto, un cierre por esta vía dejaba el menú en SUBMENU con
       getState().submenu = null, y las acciones del menú dejaban de responder
       porque el sondeo del mando consulta uiState.submenu. Se sincroniza sólo
       si el menú sigue en pantalla, para no reabrirlo al ocultarse. */
    if (uiState.menuVisible && window.DD_BOOT &&
        window.DD_BOOT.getState && window.DD_BOOT.getState().state === "SUBMENU") {
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
      '      <div class="dd-hud-hearts" id="dd-hud-hearts"></div>' +
      '      <div class="dd-hud-badges">' +
      '        <span class="dd-badge-cr"><img id="dd-hud-coin-img" alt="" src="' + assetSrc("hud_credit_coin", "pickups/pickup_credits_00.png") + '"><b id="dd-hud-cr">0</b></span>' +
      '        <span class="dd-badge-nv" id="dd-hud-nv">NV. 1</span>' +
      '      </div>' +
      '    </div>' +
      '    <div class="dd-bar-track" title="Salud Vital"><div class="dd-bar-fill" id="dd-hud-hp-fill" style="width:100%"></div></div>' +
      '    <div class="dd-bar-track dd-bar-shield" title="Escudo / Pulso RAVE"><div class="dd-bar-fill" id="dd-hud-sh-fill" style="width:0%"></div></div>' +
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
      '  <div class="dd-minimap-box" id="dd-minimap-trigger" title="Abrir Mapa de Progresión [M]"><canvas id="dd-minimap-canvas" width="196" height="132"></canvas></div>' +
      '  <div class="dd-room-banner" id="dd-hud-room">EL REFUGIO · ZONA SEGURA</div>' +
      '  <div class="dd-quick-actions">' +
      '    <button type="button" class="dd-quick-btn" id="dd-btn-open-shop">[I] ARMERÍA</button>' +
      '    <button type="button" class="dd-quick-btn" id="dd-btn-open-map">[M] TORRE</button>' +
      '    <button type="button" class="dd-quick-btn" id="dd-btn-enter-hub">[H] REFUGIO</button>' +
      '  </div>' +
      '</div>' +
      '<div class="dd-hud-skills">' +
      '  <div class="dd-skill-card" id="dd-skill-bomb"><img id="dd-skill-bomb-img" alt="Bomba" src="' + assetSrc("hud_skill_bomb", "pickups/pickup_bomb_00.png") + '"><span class="dd-skill-count" id="dd-skill-bomb-cnt">1</span><span class="dd-skill-key" id="dd-skill-bomb-key">ESP</span></div>' +
      '  <div class="dd-skill-card" id="dd-skill-boost"><img id="dd-skill-boost-img" alt="Boost" src="' + assetSrc("hud_skill_boost", "pickups/pickup_boost_00.png") + '"><span class="dd-skill-count" id="dd-skill-boost-cnt">1</span><span class="dd-skill-key" id="dd-skill-boost-key">SHIFT</span></div>' +
      '  <div class="dd-skill-card" id="dd-skill-dodge"><img id="dd-skill-dodge-img" alt="Esquiva" src="' + assetSrc("hud_skill_dodge", "pickups/pickup_speedup_00.png") + '"><span class="dd-skill-key">ROLL</span></div>' +
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
    dlg.innerHTML =
      '<div class="dd-dj-portrait-wrap"><img id="dd-dj-portrait" alt="DJ Virgilio" src="' + assetSrc("dialogue_portrait_dj") + '"></div>' +
      '<div class="dd-dj-speech"><div class="dd-dj-speaker-tab" id="dd-dj-speaker">DJ VIRGILIO</div><div class="dd-dj-text" id="dd-dj-text"></div></div>';
    document.body.appendChild(dlg);
  }

  function buildModals() {
    var shop = document.createElement("div");
    shop.id = "dd-shop-modal";
    shop.className = "dd-modal-backdrop dd-hidden";
    shop.innerHTML =
      '<div class="dd-modal-window" role="dialog" aria-label="Inventario y Tienda de Armas">' +
      '  <div class="dd-modal-header">' +
      '    <span class="dd-modal-title">INVENTARIO / TIENDA · ARMERÍA INFERNAL</span>' +
      '    <div style="display:flex;align-items:center;gap:14px;">' +
      '      <span class="dd-badge-cr" style="font-size:14px;padding:4px 12px;">CRÉDITOS: <b id="dd-shop-credits">0</b></span>' +
      '      <button type="button" class="dd-close-btn" id="dd-shop-close">CERRAR [ESC]</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="dd-shop-body">' +
      '    <div style="display:flex;flex-direction:column;overflow:hidden;">' +
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
      '<div class="dd-modal-window" role="dialog" aria-label="Mapa de Progresión de los Nueve Círculos">' +
      '  <div class="dd-modal-header">' +
      '    <span class="dd-modal-title">MAPA DE PROGRESIÓN · DESCENSO POR LA TORRE</span>' +
      '    <button type="button" class="dd-close-btn" id="dd-map-close">CERRAR [ESC]</button>' +
      '  </div>' +
      '  <div class="dd-map-body">' +
      '    <div class="dd-tower-art-wrap"><img id="dd-map-tower-img" alt="Torre Infernal" src="' + assetSrc("map_infernal_tower") + '"></div>' +
      '    <div class="dd-circles-list" id="dd-circles-list"></div>' +
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
    buildModals();
    if (!el("dd-font-probe")) {
      var probe = document.createElement("span");
      probe.id = "dd-font-probe";
      probe.setAttribute("aria-hidden", "true");
      probe.textContent = "Deadbeat";
      probe.style.cssText = 'position:fixed;left:-9999px;top:0;font:16px "DDPixel";opacity:0;pointer-events:none';
      document.body.appendChild(probe);
    }
  }

  /* ============================ D. TIENDA / MAPA ========================== */
  function openShop() {
    buildDOM();
    uiState.mapOpen = false;
    uiState.shopOpen = true;
    el("dd-map-modal").classList.add("dd-hidden");
    el("dd-shop-modal").classList.remove("dd-hidden");
    renderShop();
  }

  function openMap() {
    buildDOM();
    uiState.shopOpen = false;
    uiState.mapOpen = true;
    el("dd-shop-modal").classList.add("dd-hidden");
    var modal = el("dd-map-modal");
    modal.classList.remove("dd-hidden");
    var br = window.__DD_BRIDGE;
    var snap = br ? br.getSnapshot() : { circle: 0, running: false };
    var activeCircle = (window.DD_HUB && window.DD_HUB.isActive()) ? 0 : (snap.circle || 0);
    var listEl = el("dd-circles-list");
    if (listEl) {
      listEl.innerHTML = CIRCLES_INFO.slice().reverse().map(function (c) {
        var cls = c.idx === activeCircle ? "current" : (c.idx < activeCircle ? "cleared" : "");
        var tag = c.idx === activeCircle ? "UBICACIÓN ACTUAL" : (c.idx < activeCircle ? "SUPERADO" : "BLOQUEADO");
        return '<div class="dd-circle-node ' + cls + '"><div>' +
          '<strong style="color:#ff2d7a;margin-right:8px;">[' + esc(c.code) + ']</strong><span>' + esc(c.name) + '</span>' +
          '<div style="font-size:11px;color:#94a3b8;margin-top:2px;">Residente: ' + esc(c.boss) + '</div></div>' +
          '<span style="font-size:11px;font-weight:800;">' + tag + '</span></div>';
      }).join("");
    }
  }

  function closeModals() {
    uiState.shopOpen = false;
    uiState.mapOpen = false;
    var s = el("dd-shop-modal");
    var m = el("dd-map-modal");
    if (s) s.classList.add("dd-hidden");
    if (m) m.classList.add("dd-hidden");
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
    var weapons = getCatalogWeapons();
    var cats = ["TODAS"];
    weapons.forEach(function (w) {
      var c = (w.category || "OTRAS").toUpperCase();
      if (cats.indexOf(c) < 0) cats.push(c);
    });
    var filters = el("dd-shop-filters");
    if (filters && !filters.dataset.built) {
      filters.dataset.built = "1";
      filters.innerHTML = cats.map(function (c) {
        return '<button type="button" class="dd-filter-chip' + (c === "TODAS" ? " active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
      }).join("");
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
      grid.innerHTML = '<p class="dd-opt-note">La armería está cargando desde el motor. Vuelve a abrirla en unos segundos.</p>';
    } else {
      grid.innerHTML = list.map(function (w) {
        var owned = snap.owned && snap.owned.indexOf(w.id) >= 0;
        var sel = w.id === uiState.selectedWeaponId;
        return '<button type="button" class="dd-weapon-card' + (sel ? " selected" : "") + (owned ? " equipped" : "") + '" data-w="' + esc(w.id) + '">' +
          '<img alt="" src="' + weaponImgSrc(w.id) + '">' +
          '<b>' + esc((w.name || w.id).toUpperCase()) + '</b>' +
          '<span>' + (owned ? "EN PROPIEDAD" : (w.price || 0) + " CR") + '</span>' +
          '</button>';
      }).join("");
      grid.onclick = function (ev) {
        var card = ev.target.closest(".dd-weapon-card");
        if (!card) return;
        uiState.selectedWeaponId = card.getAttribute("data-w");
        renderShop();
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
    host.innerHTML =
      '<div class="dd-inspector-preview"><img alt="" src="' + weaponImgSrc(wid) + '"></div>' +
      '<b class="dd-inspector-name">' + esc(String(wid).toUpperCase()) + '</b>' +
      '<div class="dd-inspector-stats">' +
      Object.keys(stats || {}).slice(0, 8).map(function (k) {
        var v = stats[k];
        return '<div class="dd-stat-row"><span>' + esc(k.toUpperCase()) + '</span>' +
          '<span class="dd-stat-meter"><b style="width:' + Math.max(6, Math.min(100, Number(v) || 0)) + '%"></b></span>' +
          '<span>' + esc(typeof v === "number" ? (Math.round(v * 100) / 100) : v) + '</span></div>';
      }).join("") +
      '</div>' +
      '<div class="dd-shop-actions"><button type="button" class="dd-action-btn primary" id="dd-shop-equip">' +
      (owned ? "EQUIPAR" : "COMPRAR") + '</button></div>';

    el("dd-shop-equip").addEventListener("click", function () {
      var snapNow = br ? br.getSnapshot() : null;
      if (!br) return;
      try { br.buyOrEquipWeapon(wid, !(snapNow && snapNow.running)); } catch (e) {}
      sfx("ok");
      renderShop();
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
      if (!uiState.menuVisible) return;
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

  function showDialogue(speaker, text, durationSec) {
    buildDOM();
    if (!text) return;
    var box = el("dd-dialogue-box");
    var spk = el("dd-dj-speaker");
    var txt = el("dd-dj-text");
    if (spk) spk.textContent = speaker || "DJ VIRGILIO";
    if (txt) txt.textContent = text;
    if (box) box.classList.remove("dd-hidden");
    uiState.dialogueTimer = durationSec || 4.2;
  }

  function refreshAssets() {
    buildDOM();
    var map = [
      ["dd-menu-backdrop", assetSrc("menu_main_backdrop") || "assets/ui/menu_main_backdrop.png"],
      ["dd-menu-logo-img", assetSrc("logo_deadbeat_graffiti") || "assets/logos/logo_deadbeat_graffiti.png"],
      ["dd-hud-portrait", assetSrc("hud_portrait_protagonist")],
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

  /* ------------------------- minimapa isométrico -------------------------- */
  function drawIsometricMinimap(snap) {
    var cnv = el("dd-minimap-canvas");
    if (!cnv) return;
    var ctx = cnv.getContext("2d");
    var w = cnv.width, h = cnv.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(6,3,12,0.86)";
    ctx.fillRect(0, 0, w, h);
    var rect = null;
    try {
      var br = window.__DD_BRIDGE;
      var info = br && br.getCanvasInfo ? br.getCanvasInfo() : null;
      if (info && info.world) rect = info.world;
    } catch (e) { rect = null; }
    if (!rect) {
      ctx.fillStyle = "rgba(148,163,184,0.5)";
      ctx.font = "600 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(snap && snap.running ? "SALA ACTUAL" : "SIN INCURSIÓN", w / 2, h / 2);
      return;
    }
    var scale = Math.min(w / rect.w, h / rect.h) * 0.92;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = "rgba(255,45,122,0.85)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-rect.w * scale / 2, -rect.h * scale / 2, rect.w * scale, rect.h * scale);
    if (snap && snap.player) {
      var px = (snap.player.x - rect.x - rect.w / 2) * scale;
      var py = (snap.player.y - rect.y - rect.h / 2) * scale;
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
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

    if (uiState.menuVisible && ((snap && snap.running) || inHub)) {
      hideMainMenu();
    }
    var hudEl = el("dd-hud");
    var cineBlocking = !!(window.DD_CINE && window.DD_CINE.isBlocking());
    if (hudEl) hudEl.classList.toggle("dd-hidden", uiState.menuVisible || cineBlocking);

    /* Mando: una sola lectura por frame para todo el árbol. */
    if (uiState.gpCooldown > 0) uiState.gpCooldown = Math.max(0, uiState.gpCooldown - wallSec);
    if (navigator.getGamepads && uiState.gpCooldown <= 0) pollGamepad(snap, inHub);

    if (snap && (!uiState.menuVisible)) updateHud(snap, inHub);

    var subs = el("subs");
    if (subs) {
      var txt = (subs.textContent || "").trim();
      if (txt && txt !== uiState.lastSubsText) {
        uiState.lastSubsText = txt;
        showDialogue("DJ VIRGILIO", txt, 4.0);
      }
    }
    if (uiState.dialogueTimer > 0) {
      uiState.dialogueTimer -= cdt;
      if (uiState.dialogueTimer <= 0) {
        var box = el("dd-dialogue-box");
        if (box) box.classList.add("dd-hidden");
      }
    }
  }

  /* Detección de flanco para el mando.
     Sin esto, mantener un botón pulsado lo repetía cada cooldown: al abrir un
     submenú con A, la misma pulsación seguía activa y elegía el primer elemento
     del submenú recién abierto. Ahora una pulsación produce una sola acción
     hasta que se suelta. Afecta a los seis botones del mando por igual. */
  var gpPrev = {};
  function gpEdge(gp, i, pressed) {
    var key = (gp.index === undefined ? 0 : gp.index) + ":" + i;
    var was = !!gpPrev[key];
    gpPrev[key] = !!pressed;
    return !!pressed && !was;
  }

  function pollGamepad(snap, inHub) {
    var pads = navigator.getGamepads();
    for (var i = 0; i < pads.length; i++) {
      var gp = pads[i];
      if (!gp || !gp.connected) continue;
      var pill = el("dd-gamepad-pill");
      if (pill && pill.textContent.indexOf("CONECTADO") < 0) {
        pill.textContent = "MANDO XBOX CONECTADO · " + String(gp.id || "GAMEPAD").slice(0, 22).toUpperCase();
      }
      var up = gpEdge(gp, 12, (gp.buttons[12] && gp.buttons[12].pressed) || (gp.axes[1] < -0.55));
      var down = gpEdge(gp, 13, (gp.buttons[13] && gp.buttons[13].pressed) || (gp.axes[1] > 0.55));
      var left = gpEdge(gp, 14, (gp.buttons[14] && gp.buttons[14].pressed) || (gp.axes[0] < -0.55));
      var right = gpEdge(gp, 15, (gp.buttons[15] && gp.buttons[15].pressed) || (gp.axes[0] > 0.55));
      var btnA = gpEdge(gp, 0, gp.buttons[0] && gp.buttons[0].pressed);
      var btnB = gpEdge(gp, 1, gp.buttons[1] && gp.buttons[1].pressed);

      if (uiState.submenu) {
        /* B (volver) manda sobre cualquier dirección y sobre A: si se pulsa
           volver, se vuelve aunque el stick esté ligeramente desplazado. */
        if (btnB) { sfx("back"); closeSubmenu(); uiState.gpCooldown = 0.45; }
        else if (up || left) { focusStep(-1); uiState.gpCooldown = 0.2; }
        else if (down || right) { focusStep(1); uiState.gpCooldown = 0.2; }
        else if (btnA) { activateFocused(); uiState.gpCooldown = 0.45; }
      } else if (uiState.menuVisible) {
        if (up) { setMenuSelection(uiState.menuIndex - 1); uiState.gpCooldown = 0.2; }
        else if (down) { setMenuSelection(uiState.menuIndex + 1); uiState.gpCooldown = 0.2; }
        else if (btnA) {
          var btns = menuButtons();
          if (btns[uiState.menuIndex]) triggerMenuAction(btns[uiState.menuIndex].getAttribute("data-action"));
          uiState.gpCooldown = 0.35;
        }
      } else if (uiState.shopOpen || uiState.mapOpen) {
        if (btnB) { closeModals(); uiState.gpCooldown = 0.25; }
      } else {
        if (btnB) { openMap(); uiState.gpCooldown = 0.3; }
      }
      break;
    }
  }

  function focusStep(dir) {
    var host = el("dd-submenu-body");
    if (!host) return;
    var items = Array.prototype.slice.call(host.querySelectorAll("button:not([disabled]), input, select"));
    if (!items.length) return;
    var i = items.indexOf(document.activeElement);
    i = i < 0 ? 0 : (i + dir + items.length) % items.length;
    try { items[i].focus({ preventScroll: true }); } catch (e) { items[i].focus(); }
    sfx("move");
  }

  function activateFocused() {
    var a = document.activeElement;
    if (!a) return;
    if (a.tagName === "INPUT" && a.type === "range") { a.stepUp && a.stepUp(); a.dispatchEvent(new Event("input", { bubbles: true })); return; }
    if (a.tagName === "SELECT") { return; }
    a.click();
  }

  function updateHud(snap, inHub) {
    var heartsEl = el("dd-hud-hearts");
    var fullSrc = assetSrc("hud_heart_full", "pickups/pickup_heart_00.png");
    var emptySrc = assetSrc("hud_heart_empty", "pickups/pickup_heart_00.png");
    var maxHearts = Math.max(3, Math.min(8, Math.round((snap.maxHp || 100) / 25)));
    var curHearts = Math.max(0, Math.ceil((snap.hp / Math.max(1, snap.maxHp)) * maxHearts));
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
    var shFill = el("dd-hud-sh-fill");
    var shPct = snap.shield > 0 ? Math.min(100, snap.shield) : Math.min(100, (snap.raveMeter || 0) * 100);
    if (shFill) shFill.style.width = shPct.toFixed(1) + "%";
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
    drawIsometricMinimap(snap);
  }

  /* ============================== G. TECLADO ============================== */
  window.addEventListener("keydown", function (ev) {
    if (ev.repeat) return;
    var k = ev.code;

    /* SUBCONTROL: un submenú abierto captura la navegación. */
    if (uiState.submenu) {
      if (k === "Escape") { ev.preventDefault(); closeSubmenu(); sfx("back"); return; }
      if (k === "ArrowDown") { ev.preventDefault(); focusStep(1); return; }
      if (k === "ArrowUp") { ev.preventDefault(); focusStep(-1); return; }
      if (k === "Enter" || k === "Space") {
        var a = document.activeElement;
        if (a && a.tagName === "BUTTON") { ev.preventDefault(); a.click(); return; }
      }
      if (k === "ArrowLeft" || k === "ArrowRight") return; /* deja a los sliders */
      return;
    }

    if (uiState.menuVisible) {
      if (k === "ArrowUp" || k === "KeyW") { ev.preventDefault(); setMenuSelection(uiState.menuIndex - 1); }
      else if (k === "ArrowDown" || k === "KeyS") { ev.preventDefault(); setMenuSelection(uiState.menuIndex + 1); }
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
    if (k === "KeyI") {
      uiState.shopOpen ? closeModals() : openShop();
    } else if (k === "KeyM") {
      uiState.mapOpen ? closeModals() : openMap();
    } else if (k === "KeyH" && !uiState.shopOpen && !uiState.mapOpen) {
      if (window.DD_HUB) {
        window.DD_HUB.isActive() ? window.DD_HUB.exitToRun() : window.DD_HUB.enter();
      }
    }
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
    showDialogue: showDialogue,
    refreshAssets: refreshAssets,
    tick: tick,
    openSubmenu: openSubmenu,
    closeSubmenu: closeSubmenu,
    triggerMenuAction: triggerMenuAction,
    readProgress: readProgress,
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
