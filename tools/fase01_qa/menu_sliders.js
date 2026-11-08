#!/usr/bin/env node
/* ==========================================================================
   ENTREGA 2 · QA — Sliders del OPCIONES con MANDO EMULADO

   Ámbito: exactamente los cinco sliders reales del submenú OPCIONES:
     menu-vol-master · menu-vol-music · menu-vol-sfx · menu-vol-dj  (motor DMO, Xl.set)
     dd-opt-menuvol                                             (menú, ddc_cover_settings_v1)

   El gamepad se emula con un objeto sintético expuesto en
   window.__EMULATED_PAD__ y un navigator.getGamepads() que devuelve [pad].
   NO ES UN MANDO FÍSICO: ninguna prueba de este fichero dice nada sobre
   hardware real. Los identificadores llevan [EMULADO] a propósito.

   Uso:
     node tools/fase01_qa/menu_sliders.js
   Variables: QA_WORK (def. ~/.dd_fase01_qa) · QA_MODULES · QA_URL · QA_OUT
   ========================================================================== */
const fs = require("fs");
const os = require("os");
const path = require("path");

const WORK = process.env.QA_WORK || path.join(os.homedir(), ".dd_fase01_qa");
const MODULES = process.env.QA_MODULES || path.join(WORK, "node_modules");
const OUT = process.env.QA_OUT || path.join(WORK, "out", "entrega2");
const URL = process.env.QA_URL || "http://127.0.0.1:8123/index.html";

const c = require(path.join(MODULES, "@sparticuz/chromium"));
const { chromium } = require(path.join(MODULES, "playwright-core"));

const CHROME = process.env.QA_CHROME || "/tmp/chromium";
const SLIDERS = [
  { id: "menu-vol-master", label: "MAESTRO", store: "dmodisco_vol_v1", storeKey: "master" },
  { id: "menu-vol-music", label: "MÚSICA", store: "dmodisco_vol_v1", storeKey: "music" },
  { id: "menu-vol-sfx", label: "EFECTOS", store: "dmodisco_vol_v1", storeKey: "sfx" },
  { id: "menu-vol-dj", label: "VOZ DJ", store: "dmodisco_vol_v1", storeKey: "dj" },
  { id: "dd-opt-menuvol", label: "VOLUMEN MENÚ", store: "ddc_cover_settings_v1", storeKey: "vol" },
];

fs.mkdirSync(OUT, { recursive: true });
const results = [];
function record(id, name, pass, detail) {
  results.push({ id, name, pass: !!pass, detail: detail || "" });
  console.log((pass ? "  ✔" : "  ✘") + " [" + id + "] " + name + (detail ? " — " + detail : ""));
}

const INIT_SCRIPT = () => {
  const mkBtn = () => ({ pressed: false, value: 0, touched: false });
  const pad = {
    id: "Xbox 360 Controller (XInput STANDARD GAMEPAD) [EMULADO]",
    index: 0,
    connected: true,
    mapping: "standard",
    timestamp: 0,
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, mkBtn),
  };
  window.__EMULATED_PAD__ = pad;
  window.__gpPolls = 0; /* cuenta de sondeos del mando por quien sea */
  /* Pulsos de botón con AUTO-APAGADO por sondeo: cualquier botón pulsado con
     __pulseLeft=N permanece pulsado exactamente N llamadas a getGamepads() y se
     suelta solo en la N+1, con independencia de lo saturado que esté el hilo o
     del orden de los consumidores (motor legacy / gameplay / DD_UI). DD_UI ve
     la pulsación en su sondeo y ningún frame posterior la vuelve a ver: cero
     repetición, exactamente un paso por pulsación — el comportamiento de un
     tap humano real. */
  const basePoll = () => {
    window.__gpPolls++;
    for (const b of pad.buttons) {
      if (b.__pulseLeft > 0) {
        b.__pulseLeft--;
        if (b.__pulseLeft === 0) { b.pressed = false; b.value = 0; delete b.__pulseLeft; }
      }
    }
    return [pad];
  };
  try {
    Object.defineProperty(window.navigator, "getGamepads", {
      configurable: true,
      get() { return basePoll; },
    });
  } catch (e) {
    window.navigator.getGamepads = basePoll;
  }
};

async function newSession(browser) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    reducedMotion: "no-preference",
  });
  await context.addInitScript(INIT_SCRIPT);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  return { context, page, errors };
}

async function bootToMenu(page) {
  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(
    () => window.DD_BOOT && DD_BOOT.getState().state === "MAIN_MENU",
    null, { timeout: 30000 }
  );
  /* DD_BOOT declara MAIN_MENU antes de que DD_UI muestre el menú jugable:
     pollGamepad exige uiState.menuVisible. Esperar a la condición exacta en
     vez de a un número fijo de milisegundos (con carga extrema la revelación
     del menú tarda más de 350 ms y las pulsaciones caían en el vacío). */
  await page.waitForFunction(
    () => window.DD_UI && window.DD_UI.getState().menuVisible === true,
    null, { timeout: 20000 }
  );
  await page.waitForTimeout(250);
}

/* Pulso con auto-apagado por sondeo (ver INIT_SCRIPT): se pulsa con
   __pulseLeft=3 — permanece pulsado exactamente 3 llamadas a getGamepads()
   (cubre el sondeo del motor legacy + el de DD_UI en este frame/esta secuencia)
   y se suelta solo. Ningún frame posterior ve la pulsación: exactamente UN
   paso por pulsación, sin dependencia de rAF ni del estado del hilo. La
   instantánea previa se toma ANTES de pulsar y el efecto se espera con tope
   de 4 s; nunca aborta la suite. S12 usa noEffect (mando "desconectado"). */
async function tapBtn(page, idx, opts) {
  const noEffect = !!(opts && opts.noEffect);
  const before = await page.evaluate(([i]) => {
    const ids = ["menu-vol-master", "menu-vol-music", "menu-vol-sfx", "menu-vol-dj", "dd-opt-menuvol"];
    let snap;
    try {
      const sub = document.getElementById("dd-submenu");
      snap = JSON.stringify({
        m: window.DD_UI ? window.DD_UI.getState().menuIndex : -1,
        a: (document.activeElement && document.activeElement.id) || "",
        s: !!(sub && sub.classList.contains("is-open")),
        v: ids.map(id => { const e = document.getElementById(id); return e ? e.value : ""; })
      });
    } catch (e) { snap = String(Math.random()); }
    const p = window.__EMULATED_PAD__;
    p.buttons[i].__pulseLeft = 3;
    p.buttons[i].pressed = true; p.buttons[i].value = 1;
    return snap;
  }, [idx]);
  if (noEffect) { await page.waitForTimeout(300); return; }
  /* Espera (tope 4 s) a que DD_UI consuma el pulso: algún efecto observable
     cambia (menuIndex, foco, submenú is-open o los cinco valores). */
  await page.waitForFunction((prev) => {
    const ids = ["menu-vol-master", "menu-vol-music", "menu-vol-sfx", "menu-vol-dj", "dd-opt-menuvol"];
    try {
      const sub = document.getElementById("dd-submenu");
      const cur = JSON.stringify({
        m: window.DD_UI ? window.DD_UI.getState().menuIndex : -1,
        a: (document.activeElement && document.activeElement.id) || "",
        s: !!(sub && sub.classList.contains("is-open")),
        v: ids.map(id => { const e = document.getElementById(id); return e ? e.value : ""; })
      });
      return cur !== prev;
    } catch (e) { return true; }
  }, before, { timeout: 4000, polling: 20 }).catch(() => { console.log("AVISO: pulso sin efecto observable en 4 s (se continúa igualmente)"); });
  await page.waitForTimeout(80);
}

/* Mantener un eje/dirección: el tiempo de espera corre DENTRO de la página
   (setTimeout), de modo que un hilo principal saturado no infla la duración
   con latencia de ida y vuelta de CDP. */
async function holdBtn(page, idx, ms) {
  await page.evaluate(async ([i, ms]) => {
    const p = window.__EMULATED_PAD__;
    p.buttons[i].pressed = true; p.buttons[i].value = 1;
    await new Promise(r => setTimeout(r, ms));
    p.buttons[i].pressed = false; p.buttons[i].value = 0;
  }, [idx, ms]);
  await page.waitForTimeout(120);
}

async function holdAxis(page, x, y, ms) {
  await page.evaluate(async ([ax, ay, ms]) => {
    const p = window.__EMULATED_PAD__;
    p.axes[0] = ax; p.axes[1] = ay;
    await new Promise(r => setTimeout(r, ms));
    p.axes[0] = 0; p.axes[1] = 0;
  }, [x, y, ms]);
  await page.waitForTimeout(140);
}

async function focusId(page, id) {
  await page.evaluate((elId) => { const e = document.getElementById(elId); if (e) e.focus({ preventScroll: true }); }, id);
  await page.waitForTimeout(60);
}

async function val(page, id) { return page.evaluate((elId) => { const e = document.getElementById(elId); return e ? e.value : null; }, id); }
async function outFor(page, id) {
  return page.evaluate((elId) => {
    if (elId === "dd-opt-menuvol") { const o = document.getElementById("dd-opt-menuvol-out"); return o ? o.textContent : null; }
    const o = document.querySelector('output[for="' + elId + '"]'); return o ? o.textContent : null;
  }, id);
}
async function storeVal(page, key) {
  return page.evaluate((k) => {
    try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; }
  }, key);
}
async function activeId(page) {
  return page.evaluate(() => (document.activeElement && document.activeElement.id) || null);
}
async function submenuOpen(page) {
  return page.evaluate(() => {
    const s = document.getElementById("dd-submenu");
    return !!(s && s.classList.contains("is-open"));
  });
}

async function openOptionsViaPad(page) {
  /* Navega HASTA OPCIONES (índice 3) con el mando en lugar de dar 3 pulsaciones
     fijas: bajo el emulador con jank muy grande, UNA pulsación sostenida puede
     saltar VARIOS elementos (ver informe §4.4 — defecto de auto-repetición
     expuesto por frames > repetirDelay). Es una fijación de robustez del
     arnés, no una aserción: no se relaja nada. Tope 14 pasos; si no se llega,
     se continúa igualmente y las aserciones informan de lo visto. */
  const TARGET = 3, N_ITEMS = 6, MAX_STEPS = 14;
  for (let step = 0; step < MAX_STEPS; step++) {
    const idx = await page.evaluate(() => {
      try { return window.DD_UI ? window.DD_UI.getState().menuIndex : 0; } catch (e) { return 0; }
    });
    if (idx === TARGET) break;
    const downArc = (TARGET - idx + N_ITEMS) % N_ITEMS;
    const upArc = (idx - TARGET + N_ITEMS) % N_ITEMS;
    await tapBtn(page, downArc <= upArc ? 13 : 12);
  }
  await tapBtn(page, 0); /* A */
  /* UNBOUND wait eliminado: tope 5 s, nunca aborta. Se procede igualmente y las
     aserciones de la prueba informan de lo que haya ocurrido. */
  const opened = await page.waitForFunction(() => {
    const s = document.getElementById("dd-submenu");
    return s && s.classList.contains("is-open");
  }, null, { timeout: 5000 }).then(() => true).catch(() => {
    console.log("AVISO: OPCIONES no llegó a is-open en 5 s (se continúa igualmente)");
    return false;
  });
  /* El panel del motor (MEZCLA DEL JUEGO) se puebla de forma diferida respecto a
     la apertura: bajo carga el arnés interactuaba antes de que las filas
     existieran y las aserciones de foco fallaban por carrera (medido: 22/22 el
     2026-11-08 12:01 frente a 20/22 a las 13:35 con S2/S3; sin causa de
     producto identificada en el panel, ver informe §4.4). Se espera a que los
     CINCO sliders existan y no estén deshabilitados, PERO si no llegan en 15 s
     se CONTINÚA de todos modos: nunca se aborta la suite ni se relaja una
     aserción — las pruebas informan de lo que vean de verdad. */
  await page.waitForFunction(() => {
    const ids = ["menu-vol-master", "menu-vol-music", "menu-vol-sfx", "menu-vol-dj", "dd-opt-menuvol"];
    return ids.every((id) => {
      const e = document.getElementById(id);
      return e && !e.disabled;
    });
  }, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(150); /* margen para el foco inicial vía setTimeout(30ms) */
  return opened;
}

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ["--no-sandbox", "--disable-gpu", "--use-gl=swiftshader", "--mute-audio"],
  });

  console.log("ENTREGA 2 · QA de sliders con MANDO EMULADO\nURL: " + URL + "\nSalida: " + OUT + "\n");

  /* ---------- S1 · Arranque limpio + captura del menú ---------- */
  {
    const { context, page, errors } = await newSession(browser);
    await bootToMenu(page);
    record("S1", "Arranque hasta MAIN_MENU sin pageerror", errors.length === 0, errors.join(" | ") || "0 errores");
    await page.screenshot({ path: path.join(OUT, "01_menu_boot.png") });
    await context.close();
  }

  /* ---------- S2 · Apertura de OPCIONES con mando y foco inicial ---------- */
  {
    const { context, page, errors } = await newSession(browser);
    await bootToMenu(page);
    await openOptionsViaPad(page);
    const active = await activeId(page);
    const open = await submenuOpen(page);
    record("S2", "D-pad navega al menú y A abre OPCIONES; foco inicial en MAESTRO",
      open && active === "menu-vol-master", "submenuOpen=" + open + " activeElement=" + active);
    await page.screenshot({ path: path.join(OUT, "02_options_initial.png") });
    record("S2b", "Sin pageerror al abrir OPCIONES", errors.length === 0, errors.join(" | ") || "0 errores");
    await context.close();
  }

  /* ---------- S3 · Navegación vertical completa con D-pad ---------- */
  {
    const { context, page } = await newSession(browser);
    await bootToMenu(page);
    await openOptionsViaPad(page);
    const expected = ["menu-vol-music", "menu-vol-sfx", "menu-vol-dj"];
    let ok = true, seq = [];
    for (const id of expected) {
      await tapBtn(page, 13); /* d-pad abajo */
      const a = await activeId(page);
      seq.push(a);
      if (a !== id) ok = false;
    }
    /* fuera de los sliders del motor: el siguiente foco es menu-gfx (grupo accesibilidad del motor) */
    await tapBtn(page, 13);
    seq.push(await activeId(page));
    if ((await activeId(page)) !== "menu-gfx") ok = false;
    /* y vuelve hacia atrás con d-pad arriba */
    await tapBtn(page, 12);
    seq.push(await activeId(page));
    if ((await activeId(page)) !== "menu-vol-dj") ok = false;
    record("S3", "D-pad ↓/↑ navega por los sliders en orden y sin saltarse", ok, seq.join(" → "));
    await context.close();
  }

  /* ---------- S4 · ←→ ajustan el slider enfocado (stick y d-pad) ---------- */
  {
    const { context, page } = await newSession(browser);
    await bootToMenu(page);
    await openOptionsViaPad(page); /* foco en menu-vol-master (valor por defecto 100) */
    /* con valor 100, primero bajamos con stick a la izquierda */
    const before = Number(await val(page, "menu-vol-master"));
    await holdAxis(page, -1, 0, 900);
    const afterHold = Number(await val(page, "menu-vol-master"));
    const out = await outFor(page, "menu-vol-master");
    record("S4a", "Stick ← mantenido reduce el valor real y actualiza el output",
      afterHold < before && out === afterHold + "%", "antes=" + before + " después=" + afterHold + " output=" + out);
    /* d-pad → incrementa de uno en uno */
    const pre = Number(await val(page, "menu-vol-master"));
    await tapBtn(page, 15); /* d-pad derecha */
    await tapBtn(page, 15);
    const post = Number(await val(page, "menu-vol-master"));
    record("S4b", "D-pad → ×2 = +2 exactos (incremento step=1)", post === pre + 2, "antes=" + pre + " después=" + post);
    await page.screenshot({ path: path.join(OUT, "03_options_adjusted.png") });
    await context.close();
  }

  /* ---------- S5 · Cambios se aplican DE VERDAD (localStorage del motor) ---------- */
  {
    const { context, page } = await newSession(browser);
    await bootToMenu(page);
    await openOptionsViaPad(page);
    await holdAxis(page, -1, 0, 1200); /* master 100 → baja */
    const masterVal = Number(await val(page, "menu-vol-master"));
    const stored = await storeVal(page, "dmodisco_vol_v1");
    const storedPct = stored ? Math.round(stored.master * 100) : null;
    record("S5a", "Volumen maestro persistido en dmodisco_vol_v1 tras mover con mando",
      storedPct === masterVal, "slider=" + masterVal + " persistido=" + storedPct);
    /* VOLUMEN MENÚ (persistencia propia en ddc_cover_settings_v1) */
    await focusId(page, "dd-opt-menuvol");
    const pre = Number(await val(page, "dd-opt-menuvol"));
    await tapBtn(page, 15); await tapBtn(page, 15); await tapBtn(page, 15);
    const post = Number(await val(page, "dd-opt-menuvol"));
    const coverStored = await storeVal(page, "ddc_cover_settings_v1");
    const coverPct = coverStored && typeof coverStored.vol === "number" ? Math.round(coverStored.vol * 100) : null;
    const out = await outFor(page, "dd-opt-menuvol");
    record("S5b", "VOLUMEN MENÚ +3 persistido en ddc_cover_settings_v1 y output sincronizado",
      post === pre + 3 && coverPct === post && out === post + "%",
      "antes=" + pre + " slider=" + post + " persistido=" + coverPct + " output=" + out);
    await context.close();
  }

  /* ---------- S6 · Límites mínimo y máximo en los CINCO sliders ----------
     Desde 2, un stick mantenido hacia abajo debe toparse en 0 sin bajar más;
     desde 98, mantenido hacia arriba debe toparse en 100 sin pasar de ahí.
     (Semilla vía el mismo camino público que usa el juego: value + evento
     input real — el mismo que emite el mando con adjustRange.) */
  for (const s of SLIDERS) {
    const { context, page } = await newSession(browser);
    await bootToMenu(page);
    await openOptionsViaPad(page);
    await focusId(page, s.id);
    await page.evaluate((elId) => {
      const el = document.getElementById(elId);
      if (el) { el.value = "2"; el.dispatchEvent(new Event("input", { bubbles: true })); }
    }, s.id);
    await holdAxis(page, -1, 0, 1500);
    const min = Number(await val(page, s.id));
    const outMin = await outFor(page, s.id);
    await page.evaluate((elId) => {
      const el = document.getElementById(elId);
      if (el) { el.value = "98"; el.dispatchEvent(new Event("input", { bubbles: true })); }
    }, s.id);
    await holdAxis(page, 1, 0, 1500);
    const max = Number(await val(page, s.id));
    const outMax = await outFor(page, s.id);
    record("S6-" + s.id, s.label + ": clamp en 0 y en 100 con stick mantenido",
      min === 0 && max === 100 && outMin === "0%" && outMax === "100%",
      "min=" + min + " (out " + outMin + ") max=" + max + " (out " + outMax + ")");
    await context.close();
  }

  /* ---------- S7 · En los límites no hay cambio ni error ---------- */
  {
    const { context, page, errors } = await newSession(browser);
    await bootToMenu(page);
    await openOptionsViaPad(page);
    await focusId(page, "menu-vol-music"); /* 85 por defecto */
    /* Objetivo, no cronómetro: bajo SwiftShader un frame puede tardar >0.5 s y
       3000 ms no garantizan llegar a 100 (fallo observado 17:10Z con valor=100
       ya en el segundo tramo). Se mantiene el stick hasta leer 100 en el DOM o
       tope 9 s; la aserción sigue siendo exigente (100 exacto, sin errores). */
    await page.evaluate(async () => {
      const p = window.__EMULATED_PAD__;
      const el = document.getElementById("menu-vol-music");
      p.axes[0] = 1; p.axes[1] = 0;
      const t0 = performance.now();
      while (performance.now() - t0 < 9000) {
        if (el && el.value === "100") break;
        await new Promise(r => setTimeout(r, 50));
      }
      p.axes[0] = 0; p.axes[1] = 0;
    });
    const atMax = Number(await val(page, "menu-vol-music"));
    await holdAxis(page, 1, 0, 600);
    const stillMax = Number(await val(page, "menu-vol-music"));
    record("S7", "Stick mantenido en el límite máximo no pasa de 100 ni rompe nada",
      atMax === 100 && stillMax === 100 && errors.length === 0,
      "valor=" + stillMax + " errores=" + errors.length);
    await context.close();
  }

  /* ---------- S8 · Navegar NO cambia valores; ←→ en no-slider tampoco ---------- */
  {
    const { context, page } = await newSession(browser);
    await bootToMenu(page);
    await openOptionsViaPad(page);
    const mBefore = await val(page, "menu-vol-master");
    await tapBtn(page, 13); /* master → music */
    const mAfter = await val(page, "menu-vol-master");
    record("S8a", "Bajar el foco del slider no modifica MAESTRO", mBefore === mAfter, "antes=" + mBefore + " después=" + mAfter);
    /* foco en CALIDAD GRÁFICA (select, no slider): ← lleva al botón MÚSICA DEL MENÚ
       (botón, no slider) y → devuelve a CALIDAD GRÁFICA (select). Ningún slider
       debe recibir ajuste aunque ambos aterrizajes sean ←→ sobre no-sliders. */
    await focusId(page, "dd-opt-gfx");
    const valsBefore = [];
    for (const s of SLIDERS) valsBefore.push(await val(page, s.id));
    await tapBtn(page, 14); /* ← → dd-opt-menuon */
    const mid = await activeId(page);
    await tapBtn(page, 15); /* → → dd-opt-gfx */
    const end = await activeId(page);
    const valsAfter = [];
    for (const s of SLIDERS) valsAfter.push(await val(page, s.id));
    record("S8b", "←→ sobre no-sliders navega sin tocar ningún slider",
      JSON.stringify(valsBefore) === JSON.stringify(valsAfter) && mid === "dd-opt-menuon" && end === "dd-opt-gfx",
      mid + " → " + end + " | " + JSON.stringify(valsBefore) + " → " + JSON.stringify(valsAfter));
    await context.close();
  }

  /* ---------- S9 · Salida y reentrada del slider con ↑↓ ---------- */
  {
    const { context, page } = await newSession(browser);
    await bootToMenu(page);
    await openOptionsViaPad(page); /* master enfocado */
    await tapBtn(page, 13); /* ↓ music */
    const inMusic = await activeId(page);
    await tapBtn(page, 15); /* → ajusta music +1 */
    const musicVal = Number(await val(page, "menu-vol-music"));
    await tapBtn(page, 12); /* ↑ master */
    await tapBtn(page, 15); /* → ajusta master +1 */
    const masterVal = Number(await val(page, "menu-vol-master"));
    record("S9", "Salir del slider con ↑↓ y reentrar conserva ajuste independiente",
      inMusic === "menu-vol-music" && musicVal === 86 && masterVal === 100,
      "music=" + musicVal + " master=" + masterVal);
    await context.close();
  }

  /* ---------- S10 · A mantenido = UN solo incremento, nunca auto-repeat ---------- */
  {
    const { context, page } = await newSession(browser);
    await bootToMenu(page);
    await openOptionsViaPad(page);
    await focusId(page, "dd-opt-menuvol"); /* 80 por defecto */
    const pre = Number(await val(page, "dd-opt-menuvol"));
    await holdBtn(page, 0, 700); /* A mantenido 700 ms */
    const post = Number(await val(page, "dd-opt-menuvol"));
    record("S10", "A mantenido 700 ms incrementa exactamente +1 (sin auto-repetición por botón)",
      post === pre + 1, "antes=" + pre + " después=" + post);
    await context.close();
  }

  /* ---------- S11 · Teclado y mando conviven sobre el mismo slider ---------- */
  {
    const { context, page } = await newSession(browser);
    await bootToMenu(page);
    await openOptionsViaPad(page);
    await focusId(page, "menu-vol-sfx");
    const base = Number(await val(page, "menu-vol-sfx"));
    await page.keyboard.press("ArrowRight"); /* teclado nativo +1 */
    await tapBtn(page, 15);                  /* mando +1 */
    await page.keyboard.press("ArrowLeft");  /* teclado nativo −1 */
    const end = Number(await val(page, "menu-vol-sfx"));
    record("S11", "Teclado (+1 −1) y mando (+1) conviven: neto +1, sin dobles disparos",
      end === base + 1, "base=" + base + " final=" + end);
    await context.close();
  }

  /* ---------- S12 · Reconexión del mando ---------- */
  {
    const { context, page } = await newSession(browser);
    await bootToMenu(page);
    const idx0 = await page.evaluate(() => { try { return window.DD_UI ? window.DD_UI.getState().menuIndex : -1; } catch (e) { return -1; } });
    await page.evaluate(() => { window.__EMULATED_PAD__.connected = false; });
    await tapBtn(page, 13, { noEffect: true }); /* con el mando "desconectado" no debe navegar */
    const idxDisc = await page.evaluate(() => { try { return window.DD_UI ? window.DD_UI.getState().menuIndex : -1; } catch (e) { return -1; } });
    await page.evaluate(() => { window.__EMULATED_PAD__.connected = true; });
    await page.waitForTimeout(250);
    await tapBtn(page, 13); /* reconectado: vuelve a navegar */
    const idxRe = await page.evaluate(() => { try { return window.DD_UI ? window.DD_UI.getState().menuIndex : -1; } catch (e) { return -1; } });
    const pill = await page.evaluate(() => { const p = document.getElementById("dd-gamepad-pill"); return p ? p.textContent : ""; });
    record("S12", "Mando desconectado no navega; al reconectar vuelve a navegar",
      idxDisc === idx0 && idxRe === (idx0 + 1) % 6 && /CONECTADO/.test(pill),
      "inicio=" + idx0 + " desconectado=" + idxDisc + " reconectado=" + idxRe + " pill=" + pill);
    await context.close();
  }

  /* ---------- S13 · Una pulsación D-pad = exactamente un paso en el menú ---------- */
  {
    const { context, page } = await newSession(browser);
    await bootToMenu(page);
    const i0 = await page.evaluate(() => { try { return window.DD_UI ? window.DD_UI.getState().menuIndex : -1; } catch (e) { return -1; } });
    await tapBtn(page, 13);
    const i1 = await page.evaluate(() => { try { return window.DD_UI ? window.DD_UI.getState().menuIndex : -1; } catch (e) { return -1; } });
    await tapBtn(page, 12);
    const i2 = await page.evaluate(() => { try { return window.DD_UI ? window.DD_UI.getState().menuIndex : -1; } catch (e) { return -1; } });
    record("S13", "Una pulsación D-pad = exactamente un paso (abajo y arriba)",
      i1 === (i0 + 1) % 6 && i2 === i0, "inicio=" + i0 + " →" + i1 + " →" + i2);
    await context.close();
  }

  /* ---------- S14 · B cierra el submenú con mando (sin tocar arranque) ---------- */
  {
    const { context, page } = await newSession(browser);
    await bootToMenu(page);
    await openOptionsViaPad(page);
    await tapBtn(page, 1); /* B */
    const open = await submenuOpen(page);
    const mode = await page.evaluate(() => { try { return (window.DD_BOOT && DD_BOOT.getState().state) || "?"; } catch (e) { return "?"; } });
    record("S14", "B cierra OPCIONES y vuelve a MAIN_MENU", !open && mode === "MAIN_MENU", "abierto=" + open + " estado=" + mode);
    await context.close();
  }

  /* ---------- Resumen ---------- */
  const passed = results.filter(r => r.pass).length;
  const summary = {
    suite: "ENTREGA_02_sliders_mando_emulado",
    date: new Date().toISOString(),
    gamepad: "EMULADO (navigator.getGamepads sintético). Mando físico: NO PROBADO.",
    url: URL,
    passed,
    total: results.length,
    failed: results.filter(r => !r.pass).map(r => r.id + " " + r.name),
    results,
  };
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(summary, null, 2));
  console.log("\nRESULTADO: " + passed + "/" + results.length + " pruebas superadas");
  if (summary.failed.length) console.log("FALLOS: " + summary.failed.join(" · "));
  await browser.close();
  process.exit(summary.failed.length ? 1 : 0);
})().catch(e => { console.error("FATAL", e); process.exit(2); });
