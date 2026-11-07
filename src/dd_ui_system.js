/* ==========================================================================
   DEADBEAT DISCO — HIGH-FIDELITY REFERENCE UI SYSTEM (window.DD_UI)
   Implements Main Menu, Unified HUD + Isometric Minimap, 4-Col Armory/Shop,
   DJ Virgilio Dialogue Box & Infernal Tower Progression Map + Xbox Gamepad.
   ========================================================================== */
(function () {
  "use strict";

  const CIRCLES_INFO = [
    { idx: 0, code: "REFUGIO", name: "Cola del Club · El Refugio", boss: "Andén · El Portero" },
    { idx: 1, code: "I",       name: "Lujuria · Salón de los Deseos", boss: "Magneta · La Anfitriona" },
    { idx: 2, code: "II",      name: "Gula · Banquete Interminable", boss: "Bufé · Anfitrión Sin Fondo" },
    { idx: 3, code: "III",     name: "Avaricia · El Club VIP", boss: "El Cajero · Señor del VIP" },
    { idx: 4, code: "IV",      name: "Ira · Pista de las Peleas", boss: "El Pogo · Demonio de la Fosa" },
    { idx: 5, code: "V",       name: "Herejía · Catedral del Ruido", boss: "El Oficiante · Pontífice" },
    { idx: 6, code: "VI",      name: "Violencia · El Matadero", boss: "El Matarife · Coloso" },
    { idx: 7, code: "VII",     name: "Fraude · Club de los Espejos", boss: "El Imitador · Espejismo" },
    { idx: 8, code: "VIII",    name: "Traición · La Última Sala", boss: "El Traidor · Monarca Glacial" },
    { idx: 9, code: "IX",      name: "El Núcleo Final · Última Canción", boss: "El Núcleo / El Arquitecto" }
  ];

  const uiState = {
    initialized: false,
    menuVisible: true,
    menuIndex: 0,
    shopOpen: false,
    mapOpen: false,
    selectedCategory: "ALL",
    selectedWeaponId: "m1911",
    dialogueTimer: 0,
    lastSubsText: "",
    gpCooldown: 0
  };

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
    const id = "weapon_" + wid;
    if (window.DD_ASSETS && window.DD_ASSETS.manifest && window.DD_ASSETS.manifest.entries[id]) {
      return window.DD_ASSETS.manifest.entries[id].src;
    }
    const key = "weapons/weapon_" + wid + ".png";
    if (window.__HD_DATA && window.__HD_DATA[key]) {
      return window.__HD_DATA[key];
    }
    return "";
  }

  function buildDOM() {
    if (uiState.initialized) return;
    uiState.initialized = true;
    document.body.classList.add("dd-highres-edition");

    // Safety guard: even if src/dd_rebuild_ui.css was not served (partial or stale
    // deployment), the legacy ddc cover must never stack on top of the HD menu.
    if (!document.getElementById("dd-chrome-guard")) {
      const guard = document.createElement("style");
      guard.id = "dd-chrome-guard";
      guard.textContent = "html body.dd-highres-edition #ddc-cover{display:none!important}";
      document.head.appendChild(guard);
    }

    // 1. MAIN MENU
    const menu = document.createElement("section");
    menu.id = "dd-main-menu";
    menu.setAttribute("aria-label", "Menú Principal Deadbeat Disco");
    menu.innerHTML = `
      <img id="dd-menu-backdrop" alt="" src="${assetSrc("menu_main_backdrop") || "assets/references/REF_01_neon_fox_disco_muerto.png"}">
      <div id="dd-menu-vignette"></div>
      <div class="dd-menu-left">
        <div class="dd-menu-logo-wrap">
          <img id="dd-menu-logo-img" class="dd-menu-logo" alt="DEADBEAT DISCO" src="${assetSrc("logo_deadbeat_graffiti") || "assets/references/REF_02_logotipo_graffiti.png"}">
        </div>
        <nav class="dd-menu-nav" id="dd-menu-nav">
          <button type="button" class="dd-menu-btn dd-selected" data-action="hub">
            ENTRAR AL REFUGIO (HUB)
            <small>Cinemática de apertura + Zona segura interactiva</small>
          </button>
          <button type="button" class="dd-menu-btn" data-action="play">
            DESCENSO DIRECTO · JUGAR
            <small>Saltar directamente al combate en el Círculo I</small>
          </button>
          <button type="button" class="dd-menu-btn" data-action="shop">
            ARMERÍA · 120 ARMAS
            <small>Inspeccionar catálogo, estadísticas y equipo</small>
          </button>
          <button type="button" class="dd-menu-btn" data-action="map">
            MAPA DE PROGRESIÓN
            <small>Torre Infernal · Los 9 Círculos y el Núcleo</small>
          </button>
          <button type="button" class="dd-menu-btn" data-action="options">
            AJUSTES Y CONTROLES
            <small>Audio, accesibilidad y mando Xbox / Teclado</small>
          </button>
        </nav>
        <div class="dd-menu-footer">
          <span class="dd-pill" id="dd-gamepad-pill">TECLADO + RATÓN / MANDO XBOX LISTO</span>
          <span>EDICIÓN ILUSTRACIÓN HD · CERO PIXEL ART</span>
        </div>
      </div>
    `;
    document.body.appendChild(menu);

    menu.querySelectorAll(".dd-menu-btn").forEach((btn, idx) => {
      btn.addEventListener("mouseenter", () => setMenuSelection(idx));
      btn.addEventListener("click", () => triggerMenuAction(btn.getAttribute("data-action")));
    });

    // 2. UNIFIED IN-GAME HUD
    const hud = document.createElement("section");
    hud.id = "dd-hud";
    hud.className = "dd-hidden";
    hud.innerHTML = `
      <div class="dd-hud-top-left">
        <div class="dd-hud-portrait-frame">
          <img id="dd-hud-portrait" alt="Protagonista" src="${assetSrc("hud_portrait_protagonist")}">
        </div>
        <div class="dd-hud-vitals">
          <div class="dd-hud-hearts-row">
            <div class="dd-hud-hearts" id="dd-hud-hearts"></div>
            <div class="dd-hud-badges">
              <span class="dd-badge-cr"><img id="dd-hud-coin-img" alt="" src="${assetSrc("hud_credit_coin", "pickups/pickup_credits_00.png")}"><b id="dd-hud-cr">0</b></span>
              <span class="dd-badge-nv" id="dd-hud-nv">NV. 1</span>
            </div>
          </div>
          <div class="dd-bar-track" title="Salud Vital"><div class="dd-bar-fill" id="dd-hud-hp-fill" style="width:100%"></div></div>
          <div class="dd-bar-track dd-bar-shield" title="Escudo / Pulso RAVE"><div class="dd-bar-fill" id="dd-hud-sh-fill" style="width:0%"></div></div>
          <div class="dd-hud-weapon-strip">
            <span id="dd-hud-weapon-name">M1911 · ∞</span>
            <img id="dd-hud-weapon-img" class="dd-hud-weapon-thumb" alt="" src="${weaponImgSrc("m1911")}">
          </div>
        </div>
      </div>

      <div id="dd-boss-hud" class="dd-hidden">
        <div class="dd-boss-hud-title" id="dd-boss-name">RESIDENTE</div>
        <div class="dd-bar-track"><div class="dd-bar-fill" id="dd-boss-hp-fill" style="width:100%"></div></div>
      </div>

      <div class="dd-hud-top-right">
        <div class="dd-minimap-box" id="dd-minimap-trigger" title="Abrir Mapa de Progresión [M]">
          <canvas id="dd-minimap-canvas" width="196" height="132"></canvas>
        </div>
        <div class="dd-room-banner" id="dd-hud-room">EL REFUGIO · ZONA SEGURA</div>
        <div class="dd-quick-actions">
          <button type="button" class="dd-quick-btn" id="dd-btn-open-shop">[I] ARMERÍA</button>
          <button type="button" class="dd-quick-btn" id="dd-btn-open-map">[M] TORRE</button>
          <button type="button" class="dd-quick-btn" id="dd-btn-enter-hub">[H] REFUGIO</button>
        </div>
      </div>

      <div class="dd-hud-skills">
        <div class="dd-skill-card" id="dd-skill-bomb">
          <img id="dd-skill-bomb-img" alt="Bomba" src="${assetSrc("hud_skill_bomb", "pickups/pickup_bomb_00.png")}">
          <span class="dd-skill-count" id="dd-skill-bomb-cnt">1</span>
          <span class="dd-skill-key" id="dd-skill-bomb-key">ESP</span>
        </div>
        <div class="dd-skill-card" id="dd-skill-boost">
          <img id="dd-skill-boost-img" alt="Boost" src="${assetSrc("hud_skill_boost", "pickups/pickup_boost_00.png")}">
          <span class="dd-skill-count" id="dd-skill-boost-cnt">1</span>
          <span class="dd-skill-key" id="dd-skill-boost-key">SHIFT</span>
        </div>
        <div class="dd-skill-card" id="dd-skill-dodge">
          <img id="dd-skill-dodge-img" alt="Esquiva" src="${assetSrc("hud_skill_dodge", "pickups/pickup_speedup_00.png")}">
          <span class="dd-skill-key">ROLL</span>
        </div>
      </div>
    `;
    document.body.appendChild(hud);

    document.getElementById("dd-btn-open-shop").addEventListener("click", openShop);
    document.getElementById("dd-btn-open-map").addEventListener("click", openMap);
    document.getElementById("dd-minimap-trigger").addEventListener("click", openMap);
    document.getElementById("dd-btn-enter-hub").addEventListener("click", () => {
      if (window.DD_HUB) window.DD_HUB.enter();
    });

    // 3. DJ VIRGILIO DIALOGUE BOX
    const dlg = document.createElement("aside");
    dlg.id = "dd-dialogue-box";
    dlg.className = "dd-hidden";
    dlg.innerHTML = `
      <div class="dd-dj-portrait-wrap">
        <img id="dd-dj-portrait" alt="DJ Virgilio" src="${assetSrc("dialogue_portrait_dj")}">
      </div>
      <div class="dd-dj-speech">
        <div class="dd-dj-speaker-tab" id="dd-dj-speaker">DJ VIRGILIO</div>
        <div class="dd-dj-text" id="dd-dj-text"></div>
      </div>
    `;
    document.body.appendChild(dlg);

    // 4. SHOP / INVENTORY MODAL
    const shop = document.createElement("div");
    shop.id = "dd-shop-modal";
    shop.className = "dd-modal-backdrop dd-hidden";
    shop.innerHTML = `
      <div class="dd-modal-window" role="dialog" aria-label="Inventario y Tienda de Armas">
        <div class="dd-modal-header">
          <span class="dd-modal-title">INVENTARIO / TIENDA · ARMERÍA INFERNAL</span>
          <div style="display:flex;align-items:center;gap:14px;">
            <span class="dd-badge-cr" style="font-size:14px;padding:4px 12px;">CRÉDITOS: <b id="dd-shop-credits">0</b></span>
            <button type="button" class="dd-close-btn" id="dd-shop-close">CERRAR [ESC]</button>
          </div>
        </div>
        <div class="dd-shop-body">
          <div style="display:flex;flex-direction:column;overflow:hidden;">
            <div class="dd-shop-filters" id="dd-shop-filters"></div>
            <div class="dd-weapons-grid" id="dd-weapons-grid"></div>
          </div>
          <div class="dd-shop-inspector" id="dd-shop-inspector"></div>
        </div>
      </div>
    `;
    document.body.appendChild(shop);
    document.getElementById("dd-shop-close").addEventListener("click", closeModals);

    // 5. PROGRESSION TOWER MAP MODAL
    const mapModal = document.createElement("div");
    mapModal.id = "dd-map-modal";
    mapModal.className = "dd-modal-backdrop dd-hidden";
    mapModal.innerHTML = `
      <div class="dd-modal-window" role="dialog" aria-label="Mapa de Progresión de los Nueve Círculos">
        <div class="dd-modal-header">
          <span class="dd-modal-title">MAPA DE PROGRESIÓN · DESCENSO POR LA TORRE</span>
          <button type="button" class="dd-close-btn" id="dd-map-close">CERRAR [ESC]</button>
        </div>
        <div class="dd-map-body">
          <div class="dd-tower-art-wrap">
            <img id="dd-map-tower-img" alt="Torre Infernal" src="${assetSrc("map_infernal_tower")}">
          </div>
          <div class="dd-circles-list" id="dd-circles-list"></div>
        </div>
      </div>
    `;
    document.body.appendChild(mapModal);
    document.getElementById("dd-map-close").addEventListener("click", closeModals);
  }

  function setMenuSelection(idx) {
    const btns = document.querySelectorAll("#dd-menu-nav .dd-menu-btn");
    if (!btns.length) return;
    uiState.menuIndex = (idx + btns.length) % btns.length;
    btns.forEach((b, i) => b.classList.toggle("dd-selected", i === uiState.menuIndex));
  }

  function triggerMenuAction(action) {
    if (action === "hub") {
      hideMainMenu();
      if (window.DD_CINE) {
        window.DD_CINE.playIntro(() => {
          if (window.DD_HUB) window.DD_HUB.enter();
        });
      } else if (window.DD_HUB) {
        window.DD_HUB.enter();
      }
    } else if (action === "play") {
      hideMainMenu();
      if (window.DD_HUB && window.DD_HUB.isActive()) {
        window.DD_HUB.exitToRun();
      } else if (window.__DD_BRIDGE && typeof window.__DD_BRIDGE.startRun === "function") {
        window.__DD_BRIDGE.startRun();
      } else if (window.DDC_COVER && typeof window.DDC_COVER.start === "function") {
        window.DDC_COVER.start();
      } else {
        const startBtn = document.getElementById("start-btn");
        if (startBtn) startBtn.click();
      }
    } else if (action === "shop") {
      openShop();
    } else if (action === "map") {
      openMap();
    } else if (action === "options") {
      hideMainMenu();
      const ov = document.getElementById("overlay");
      if (ov) {
        ov.style.display = "flex";
        ov.classList.remove("hidden");
      }
    }
  }

  function showMainMenu() {
    buildDOM();
    uiState.menuVisible = true;
    const m = document.getElementById("dd-main-menu");
    if (m) m.classList.remove("dd-hidden");
    const h = document.getElementById("dd-hud");
    if (h) h.classList.add("dd-hidden");
  }

  function hideMainMenu() {
    uiState.menuVisible = false;
    const m = document.getElementById("dd-main-menu");
    if (m) m.classList.add("dd-hidden");
    const h = document.getElementById("dd-hud");
    if (h) h.classList.remove("dd-hidden");
  }

  function showDialogue(speaker, text, durationSec) {
    buildDOM();
    if (!text) return;
    const box = document.getElementById("dd-dialogue-box");
    const spk = document.getElementById("dd-dj-speaker");
    const txt = document.getElementById("dd-dj-text");
    if (spk) spk.textContent = speaker || "DJ VIRGILIO";
    if (txt) txt.textContent = text;
    if (box) box.classList.remove("dd-hidden");
    uiState.dialogueTimer = durationSec || 4.2;
  }

  function getCatalogWeapons() {
    const br = window.__DD_BRIDGE;
    if (br && typeof br.getWeaponsList === "function") {
      return br.getWeaponsList();
    }
    if (window.DMO && window.DMO.weaponRig && typeof window.DMO.weaponRig.catalog === "function") {
      return window.DMO.weaponRig.catalog();
    }
    return [];
  }

  function renderShop() {
    const br = window.__DD_BRIDGE;
    const snap = br ? br.getSnapshot() : { credits: 0, weapon: "m1911", owned: ["m1911"] };
    const list = getCatalogWeapons();
    const crEl = document.getElementById("dd-shop-credits");
    if (crEl) crEl.textContent = String(snap.credits || 0);

    // Build category chips
    const cats = ["ALL"];
    for (let i = 0; i < list.length; i++) {
      const f = list[i].family || "pistol";
      if (!cats.includes(f)) cats.push(f);
    }
    const filterWrap = document.getElementById("dd-shop-filters");
    if (filterWrap) {
      filterWrap.innerHTML = cats.map(c =>
        `<button type="button" class="dd-filter-chip ${uiState.selectedCategory === c ? "active" : ""}" data-cat="${c}">${c === "ALL" ? "TODAS (120)" : c}</button>`
      ).join("");
      filterWrap.querySelectorAll(".dd-filter-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          uiState.selectedCategory = btn.getAttribute("data-cat");
          renderShop();
        });
      });
    }

    const filtered = uiState.selectedCategory === "ALL"
      ? list
      : list.filter(w => (w.family || "pistol") === uiState.selectedCategory);

    if (!filtered.some(w => w.id === uiState.selectedWeaponId) && filtered.length) {
      uiState.selectedWeaponId = filtered[0].id;
    }

    const grid = document.getElementById("dd-weapons-grid");
    if (grid) {
      grid.innerHTML = filtered.map(w => {
        const isEq = w.id === snap.weapon;
        const isOwn = (snap.owned || []).includes(w.id);
        const sel = w.id === uiState.selectedWeaponId;
        const badge = isEq ? "EQUIPADA" : (isOwn ? "EN RESERVA" : ((w.cost || 120) + " CR"));
        return `
          <div class="dd-weapon-card ${sel ? "selected" : ""} ${isEq ? "equipped" : ""}" data-wid="${w.id}">
            <img alt="${w.name}" src="${weaponImgSrc(w.id)}">
            <div class="dd-weapon-card-name">${w.name}</div>
            <div class="dd-weapon-card-price">${badge}</div>
          </div>
        `;
      }).join("");
      grid.querySelectorAll(".dd-weapon-card").forEach(card => {
        card.addEventListener("click", () => {
          uiState.selectedWeaponId = card.getAttribute("data-wid");
          renderShop();
        });
      });
    }

    // Inspector panel
    const selW = list.find(w => w.id === uiState.selectedWeaponId) || list[0];
    const insp = document.getElementById("dd-shop-inspector");
    if (insp && selW) {
      const wStats = (br && br.getWeaponStats(selW.id)) || { damage: 30, fireRate: 5, speed: 520, pierce: 0, cost: 120, role: "Combate de club" };
      const dmgPct = Math.min(100, Math.round((wStats.damage || 25) / 1.4));
      const rofPct = Math.min(100, Math.round((wStats.fireRate || 4) * 7.5));
      const spdPct = Math.min(100, Math.round((wStats.speed || 480) / 11));
      const prcPct = Math.min(100, Math.max(12, ((wStats.pierce || 0) + (wStats.pellets || 1)) * 16));
      const isEq = selW.id === snap.weapon;
      const isOwn = (snap.owned || []).includes(selW.id);
      const cost = wStats.cost || 120;
      const canAfford = isOwn || (snap.credits >= cost) || !snap.running;

      insp.innerHTML = `
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="color:#22d3ee;font-size:11px;font-weight:800;text-transform:uppercase;">#${selW.n || 1} · ${selW.family || "ARSENAL"}</span>
            <span style="color:#facc15;font-size:12px;font-weight:800;">${isOwn ? "ADQUIRIDA" : (cost + " CR")}</span>
          </div>
          <div style="font-family:var(--dd-font-display);font-size:24px;letter-spacing:0.06em;color:#fff;margin-bottom:10px;">${selW.name}</div>
          <div class="dd-inspector-preview">
            <img alt="${selW.name}" src="${weaponImgSrc(selW.id)}">
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div class="dd-stat-row"><span>DAÑO</span><div class="dd-stat-meter"><b style="width:${dmgPct}%"></b></div><span>${Math.round(wStats.damage || 25)}</span></div>
          <div class="dd-stat-row"><span>CADENCIA</span><div class="dd-stat-meter"><b style="width:${rofPct}%"></b></div><span>${Number(wStats.fireRate || 4).toFixed(1)}/s</span></div>
          <div class="dd-stat-row"><span>VELOCIDAD</span><div class="dd-stat-meter"><b style="width:${spdPct}%"></b></div><span>${Math.round(wStats.speed || 480)}</span></div>
          <div class="dd-stat-row"><span>IMPACTO</span><div class="dd-stat-meter"><b style="width:${prcPct}%"></b></div><span>x${wStats.pellets || 1}</span></div>
          <p style="font-size:12px;color:#cbd5e1;line-height:1.4;margin:6px 0 0;">${wStats.trait || wStats.role || "Arma calibrada para los Nueve Círculos de Deadbeat Disco."}</p>
        </div>
        <div class="dd-shop-actions">
          <button type="button" class="dd-action-btn primary" id="dd-btn-buy-equip" ${isEq || !canAfford ? "disabled" : ""}>
            ${isEq ? "EQUIPADA ACTUALMENTE" : (isOwn || !snap.running ? "EQUIPAR ARMA" : "COMPRAR Y EQUIPAR (" + cost + " CR)")}
          </button>
        </div>
      `;
      const actBtn = document.getElementById("dd-btn-buy-equip");
      if (actBtn) {
        actBtn.addEventListener("click", () => {
          if (br) {
            br.buyOrEquipWeapon(selW.id, !snap.running);
            renderShop();
          }
        });
      }
    }
  }

  function openShop() {
    buildDOM();
    uiState.mapOpen = false;
    uiState.shopOpen = true;
    document.getElementById("dd-map-modal").classList.add("dd-hidden");
    document.getElementById("dd-shop-modal").classList.remove("dd-hidden");
    renderShop();
  }

  function openMap() {
    buildDOM();
    uiState.shopOpen = false;
    uiState.mapOpen = true;
    document.getElementById("dd-shop-modal").classList.add("dd-hidden");
    const modal = document.getElementById("dd-map-modal");
    modal.classList.remove("dd-hidden");

    const br = window.__DD_BRIDGE;
    const snap = br ? br.getSnapshot() : { circle: 0, running: false };
    const activeCircle = (window.DD_HUB && window.DD_HUB.isActive()) ? 0 : (snap.circle || 0);

    const listEl = document.getElementById("dd-circles-list");
    if (listEl) {
      listEl.innerHTML = CIRCLES_INFO.slice().reverse().map(c => {
        const cls = c.idx === activeCircle ? "current" : (c.idx < activeCircle ? "cleared" : "");
        const tag = c.idx === activeCircle ? "UBICACIÓN ACTUAL" : (c.idx < activeCircle ? "SUPERADO" : "BLOQUEADO");
        return `
          <div class="dd-circle-node ${cls}">
            <div>
              <strong style="color:#ff2d7a;margin-right:8px;">[${c.code}]</strong>
              <span>${c.name}</span>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Residente: ${c.boss}</div>
            </div>
            <span style="font-size:11px;font-weight:800;">${tag}</span>
          </div>
        `;
      }).join("");
    }
  }

  function closeModals() {
    uiState.shopOpen = false;
    uiState.mapOpen = false;
    const s = document.getElementById("dd-shop-modal");
    const m = document.getElementById("dd-map-modal");
    if (s) s.classList.add("dd-hidden");
    if (m) m.classList.add("dd-hidden");
  }

  function refreshAssets() {
    buildDOM();
    const map = [
      ["dd-menu-backdrop", assetSrc("menu_main_backdrop") || "assets/references/REF_01_neon_fox_disco_muerto.png"],
      ["dd-menu-logo-img", assetSrc("logo_deadbeat_graffiti") || "assets/references/REF_02_logotipo_graffiti.png"],
      ["dd-hud-portrait", assetSrc("hud_portrait_protagonist")],
      ["dd-hud-coin-img", assetSrc("hud_credit_coin", "pickups/pickup_credits_00.png")],
      ["dd-skill-bomb-img", assetSrc("hud_skill_bomb", "pickups/pickup_bomb_00.png")],
      ["dd-skill-boost-img", assetSrc("hud_skill_boost", "pickups/pickup_boost_00.png")],
      ["dd-skill-dodge-img", assetSrc("hud_skill_dodge", "pickups/pickup_speedup_00.png")],
      ["dd-dj-portrait", assetSrc("dialogue_portrait_dj")],
      ["dd-map-tower-img", assetSrc("map_infernal_tower")]
    ];
    for (let i = 0; i < map.length; i++) {
      const el = document.getElementById(map[i][0]);
      if (el && map[i][1]) el.src = map[i][1];
    }
  }

  function drawIsometricMinimap(snap) {
    const cnv = document.getElementById("dd-minimap-canvas");
    if (!cnv) return;
    const ctx = cnv.getContext("2d");
    const w = cnv.width;
    const h = cnv.height;
    ctx.clearRect(0, 0, w, h);

    const inHub = window.DD_HUB && window.DD_HUB.isActive();
    const rect = inHub ? window.DD_HUB.getState().bounds : (snap.roomRect || { x: 0, y: 0, w: 1200, h: 800 });
    const px = inHub ? window.DD_HUB.getState().x : (snap.player ? snap.player.x : rect.x + rect.w / 2);
    const py = inHub ? window.DD_HUB.getState().y : (snap.player ? snap.player.y : rect.y + rect.h / 2);

    ctx.save();
    ctx.translate(w * 0.5, h * 0.52);
    // Isometric projection tilt matching REF_05 minimap!
    ctx.scale(1, 0.58);
    ctx.rotate(Math.PI / 4);

    const scale = Math.min(86 / Math.max(200, rect.w), 86 / Math.max(200, rect.h));
    const hw = rect.w * scale * 0.5;
    const hh = rect.h * scale * 0.5;

    ctx.fillStyle = "rgba(26, 14, 46, 0.92)";
    ctx.strokeStyle = "#ff2d7a";
    ctx.lineWidth = 2.4;
    ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
    ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);

    // Doors / stations
    if (!inHub && snap.doors) {
      for (let i = 0; i < snap.doors.length; i++) {
        const d = snap.doors[i];
        const dx = (d.x - (rect.x + rect.w * 0.5)) * scale;
        const dy = (d.y - (rect.y + rect.h * 0.5)) * scale;
        ctx.fillStyle = d.open ? "#22d3ee" : "#facc15";
        ctx.fillRect(dx - 3.5, dy - 3.5, 7, 7);
      }
    }

    // Enemies
    if (!inHub && snap.enemies) {
      ctx.fillStyle = "#fb7185";
      for (let i = 0; i < snap.enemies.length; i++) {
        const e = snap.enemies[i];
        const ex = (e.x - (rect.x + rect.w * 0.5)) * scale;
        const ey = (e.y - (rect.y + rect.h * 0.5)) * scale;
        ctx.beginPath();
        ctx.arc(ex, ey, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player beacon
    const relX = (px - (rect.x + rect.w * 0.5)) * scale;
    const relY = (py - (rect.y + rect.h * 0.5)) * scale;
    ctx.fillStyle = "#22d3ee";
    ctx.beginPath();
    ctx.arc(relX, relY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function tick(dt) {
    buildDOM();
    const cdt = Math.min(0.05, Math.max(0.001, dt || 0.016));
    const br = window.__DD_BRIDGE;
    const snap = br ? br.getSnapshot() : null;
    const inHub = window.DD_HUB && window.DD_HUB.isActive();

    // Hide HUD cleanly during full-screen blocking cinematics or main menu
    if (uiState.menuVisible && ((snap && snap.running) || inHub)) {
      hideMainMenu();
    }
    const hudEl = document.getElementById("dd-hud");
    const cineBlocking = !!(window.DD_CINE && window.DD_CINE.isBlocking());
    if (hudEl) {
      hudEl.classList.toggle("dd-hidden", uiState.menuVisible || cineBlocking);
    }

    // Gamepad navigation for Main Menu & Modals
    if (uiState.gpCooldown > 0) uiState.gpCooldown = Math.max(0, uiState.gpCooldown - cdt);
    if (navigator.getGamepads && uiState.gpCooldown <= 0) {
      const pads = navigator.getGamepads();
      for (let i = 0; i < pads.length; i++) {
        const gp = pads[i];
        if (!gp || !gp.connected) continue;
        const pill = document.getElementById("dd-gamepad-pill");
        if (pill) pill.textContent = "MANDO XBOX CONECTADO · " + (gp.id || "GAMEPAD").slice(0, 22);

        const up = (gp.buttons[12] && gp.buttons[12].pressed) || (gp.axes[1] < -0.55);
        const down = (gp.buttons[13] && gp.buttons[13].pressed) || (gp.axes[1] > 0.55);
        const btnA = gp.buttons[0] && gp.buttons[0].pressed;
        const btnB = gp.buttons[1] && gp.buttons[1].pressed;
        const btnY = gp.buttons[3] && gp.buttons[3].pressed;
        const btnBack = gp.buttons[8] && gp.buttons[8].pressed;

        if (uiState.menuVisible) {
          if (up) { setMenuSelection(uiState.menuIndex - 1); uiState.gpCooldown = 0.2; }
          else if (down) { setMenuSelection(uiState.menuIndex + 1); uiState.gpCooldown = 0.2; }
          else if (btnA) {
            const btns = document.querySelectorAll("#dd-menu-nav .dd-menu-btn");
            if (btns[uiState.menuIndex]) triggerMenuAction(btns[uiState.menuIndex].getAttribute("data-action"));
            uiState.gpCooldown = 0.3;
          }
        } else if (uiState.shopOpen || uiState.mapOpen) {
          if (btnB) { closeModals(); uiState.gpCooldown = 0.25; }
        } else {
          if (btnY) { openShop(); uiState.gpCooldown = 0.3; }
          else if (btnBack) { openMap(); uiState.gpCooldown = 0.3; }
        }
        break;
      }
    }

    // Update HUD values from live engine snapshot
    if (snap && (!uiState.menuVisible)) {
      const heartsEl = document.getElementById("dd-hud-hearts");
      const fullSrc = assetSrc("hud_heart_full", "pickups/pickup_heart_00.png");
      const emptySrc = assetSrc("hud_heart_empty", "pickups/pickup_heart_00.png");
      const maxHearts = Math.max(3, Math.min(8, Math.round((snap.maxHp || 100) / 25)));
      const curHearts = Math.max(0, Math.ceil((snap.hp / Math.max(1, snap.maxHp)) * maxHearts));
      const hKey = curHearts + "/" + maxHearts + ":" + fullSrc;
      if (heartsEl && heartsEl.getAttribute("data-key") !== hKey) {
        heartsEl.setAttribute("data-key", hKey);
        let html = "";
        for (let i = 0; i < maxHearts; i++) {
          const on = i < curHearts;
          html += `<img class="dd-heart-icon" style="${on ? "" : "opacity:0.28;filter:grayscale(1);"}" alt="" src="${on ? fullSrc : emptySrc}">`;
        }
        heartsEl.innerHTML = html;
      }

      const hpFill = document.getElementById("dd-hud-hp-fill");
      if (hpFill) hpFill.style.width = Math.max(0, Math.min(100, (snap.hp / Math.max(1, snap.maxHp)) * 100)).toFixed(1) + "%";

      const shFill = document.getElementById("dd-hud-sh-fill");
      const shPct = snap.shield > 0 ? Math.min(100, snap.shield) : Math.min(100, (snap.raveMeter || 0) * 100);
      if (shFill) shFill.style.width = shPct.toFixed(1) + "%";

      const crEl = document.getElementById("dd-hud-cr");
      if (crEl) crEl.textContent = String(snap.credits || 0);

      const nvEl = document.getElementById("dd-hud-nv");
      if (nvEl) nvEl.textContent = "NV. " + (snap.level || 1);

      const wNameEl = document.getElementById("dd-hud-weapon-name");
      if (wNameEl) wNameEl.textContent = (snap.weaponName || "M1911").toUpperCase() + " · ∞";

      const wImgEl = document.getElementById("dd-hud-weapon-img");
      const wSrc = weaponImgSrc(snap.weapon || "m1911");
      if (wImgEl && wSrc && wImgEl.getAttribute("data-w") !== snap.weapon) {
        wImgEl.setAttribute("data-w", snap.weapon);
        wImgEl.src = wSrc;
      }

      const roomEl = document.getElementById("dd-hud-room");
      if (roomEl) {
        roomEl.textContent = inHub
          ? "EL REFUGIO · ZONA SEGURA"
          : (snap.roomBanner || ("CÍRCULO " + (snap.circle + 1)));
      }

      const bCnt = document.getElementById("dd-skill-bomb-cnt");
      if (bCnt) bCnt.textContent = String(snap.bombs || 0);
      const bCard = document.getElementById("dd-skill-bomb");
      if (bCard) bCard.classList.toggle("dd-empty", !(snap.bombs > 0));

      const sCnt = document.getElementById("dd-skill-boost-cnt");
      if (sCnt) sCnt.textContent = String(snap.boosts || 0);
      const sCard = document.getElementById("dd-skill-boost");
      if (sCard) sCard.classList.toggle("dd-empty", !(snap.boosts > 0));

      // Boss HUD
      const bossHud = document.getElementById("dd-boss-hud");
      if (bossHud) {
        if (!inHub && snap.bossActive && snap.boss) {
          bossHud.classList.remove("dd-hidden");
          document.getElementById("dd-boss-name").textContent = String(snap.boss.name || "RESIDENTE").toUpperCase();
          const bpct = Math.max(0, Math.min(100, ((snap.boss.hp || 0) / Math.max(1, snap.boss.maxHp || 1)) * 100));
          document.getElementById("dd-boss-hp-fill").style.width = bpct.toFixed(1) + "%";
        } else {
          bossHud.classList.add("dd-hidden");
        }
      }

      drawIsometricMinimap(snap);
    }

    // Mirror engine #subs DJ lines into high-res DJ Virgilio Dialogue Box
    const subs = document.getElementById("subs");
    if (subs) {
      const txt = (subs.textContent || "").trim();
      if (txt && txt !== uiState.lastSubsText) {
        uiState.lastSubsText = txt;
        showDialogue("DJ VIRGILIO", txt, 4.0);
      }
    }

    if (uiState.dialogueTimer > 0) {
      uiState.dialogueTimer -= cdt;
      if (uiState.dialogueTimer <= 0) {
        const box = document.getElementById("dd-dialogue-box");
        if (box) box.classList.add("dd-hidden");
      }
    }
  }

  window.addEventListener("keydown", function (ev) {
    if (uiState.menuVisible) {
      if (ev.code === "ArrowUp" || ev.code === "KeyW") { ev.preventDefault(); setMenuSelection(uiState.menuIndex - 1); }
      else if (ev.code === "ArrowDown" || ev.code === "KeyS") { ev.preventDefault(); setMenuSelection(uiState.menuIndex + 1); }
      else if (ev.code === "Enter" || ev.code === "Space") {
        ev.preventDefault();
        const btns = document.querySelectorAll("#dd-menu-nav .dd-menu-btn");
        if (btns[uiState.menuIndex]) triggerMenuAction(btns[uiState.menuIndex].getAttribute("data-action"));
      }
      return;
    }

    if (ev.code === "Escape" && (uiState.shopOpen || uiState.mapOpen)) {
      ev.preventDefault();
      closeModals();
      return;
    }
    if (ev.code === "KeyI") {
      uiState.shopOpen ? closeModals() : openShop();
    } else if (ev.code === "KeyM") {
      uiState.mapOpen ? closeModals() : openMap();
    } else if (ev.code === "KeyH" && !uiState.shopOpen && !uiState.mapOpen) {
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

  window.DD_UI = Object.freeze({
    showMainMenu,
    hideMainMenu,
    openShop,
    openMap,
    closeModals,
    showDialogue,
    refreshAssets,
    tick,
    isModalOpen: function () { return uiState.shopOpen || uiState.mapOpen; },
    getState: function () {
      return {
        menuVisible: uiState.menuVisible,
        shopOpen: uiState.shopOpen,
        mapOpen: uiState.mapOpen,
        selectedWeaponId: uiState.selectedWeaponId
      };
    }
  });
})();
