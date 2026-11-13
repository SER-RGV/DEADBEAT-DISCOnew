/* QA del inicio del juego sobre el JUEGO REAL (index.html), no sobre un visor:
     carga → pulsación → intro (32 s, 7 planos) → menú → nueva partida → descenso (4,6 s) → Refugio
   Uso:  DD_CHROMIUM=/ruta/a/chromium node tools/qa/test_restart_flow.js [http://localhost:8080] [carpeta_capturas]
   Requiere playwright-core y un servidor estático en la raíz del repositorio.
   Lo que NO puede comprobar: sonido audible (sólo el estado lógico del audio), mando físico
   (se simula la API Gamepad) y rendimiento en hardware real. */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");
const BASE = process.argv[2] || "http://localhost:8080";
const OUT = process.argv[3] || null;
const URL = BASE + "/index.html";
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail: detail == null ? "" : String(detail) }); console.log((ok ? "PASS " : "FAIL ") + name + (detail != null && detail !== "" ? "  · " + detail : "")); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  if (OUT) fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM || undefined, headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
    env: { ...process.env }
  });
  const errors = [];
  const watch = (pg, tag) => {
    pg.on("pageerror", (e) => errors.push(tag + " pageerror: " + e.message));
    pg.on("console", (m) => { if ((m.type() === "error" || m.type() === "warning") && !/willReadFrequently/.test(m.text())) errors.push(tag + " " + m.type() + ": " + m.text().slice(0, 200)); });
    pg.on("requestfailed", (r) => errors.push(tag + " requestfailed: " + r.url()));
    pg.on("response", (r) => { if (r.status() >= 400) errors.push(tag + " " + r.status() + " " + r.url()); });
  };
  const PAD = () => {
    window.__pad = null;
    const mk = () => ({ connected: true, id: "Xbox QA (simulado)", index: 0, mapping: "standard", timestamp: performance.now(), axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) });
    window.__padSet = (btn, on) => { if (!window.__pad) window.__pad = mk(); if (btn != null) window.__pad.buttons[btn] = { pressed: !!on, value: on ? 1 : 0 }; };
    navigator.getGamepads = () => [window.__pad];
    /* Chromium automatizado se declara «ya activado» nada más cargar. Un jugador real llega sin
       ninguna pulsación: aquí se reproduce esa situación hasta la primera tecla, clic o botón. */
    if (!/[?&]activado=1/.test(location.search)) {
      let act = false;
      ["keydown", "pointerdown", "mousedown"].forEach((t) => window.addEventListener(t, () => { act = true; }, true));
      try { Object.defineProperty(navigator, "userActivation", { configurable: true, get: () => ({ hasBeenActive: act, isActive: act }) }); } catch (e) {}
    }
  };
  const newPage = async (tag, w, h, opts) => {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: w || 1280, height: h || 720 } }, opts || {}));
    await ctx.addInitScript(PAD);
    const pg = await ctx.newPage(); watch(pg, tag);
    return pg;
  };
  const boot = (pg) => pg.evaluate(() => window.DD_BOOT.getState());
  const op = (pg) => pg.evaluate(() => window.DD_OPENING.getState());
  const shot = async (pg, name) => { if (OUT) await pg.screenshot({ path: path.join(OUT, name + ".jpg"), type: "jpeg", quality: 80 }); };
  const waitGate = (pg) => pg.waitForFunction(() => window.DD_BOOT && (window.DD_BOOT.getState().waitingGesture || window.DD_BOOT.getState().state === "INTRO"), null, { timeout: 60000 });
  const waitState = (pg, s, t) => pg.waitForFunction((s) => window.DD_BOOT.getState().state === s, s, { timeout: t || 15000 });
  const toIntro = async (pg) => { await pg.goto(URL, { waitUntil: "domcontentloaded" }); await waitGate(pg); await pg.keyboard.press("KeyX"); await pg.waitForFunction(() => window.DD_OPENING.isActive(), null, { timeout: 10000 }); };
  const toMenu = async (pg) => { await toIntro(pg); await sleep(600); await pg.keyboard.press("Space"); await waitState(pg, "MAIN_MENU"); await sleep(900); };
  const canvasSum = (pg) => pg.evaluate(() => { const c = document.getElementById("dd-opening"); const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 397) s += d[i]; return s; });
  const menuInfo = (pg) => pg.evaluate(() => {
    const all = [...document.querySelectorAll("#dd-menu-nav .dd-menu-btn")];
    const vis = all.filter((b) => !b.hidden && getComputedStyle(b).display !== "none");
    const sel = all.filter((b) => b.classList.contains("dd-selected"));
    return {
      actions: vis.map((b) => b.dataset.action), labels: vis.map((b) => b.querySelector("b").textContent),
      selected: sel.map((b) => b.dataset.action), focus: document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.action : null,
      ui: window.DD_UI.getState(), state: window.DD_BOOT.getState()
    };
  });

  /* ================= 1. CARGA Y PUERTA DE PULSACIÓN ================= */
  const pg = await newPage("flujo");
  const resp = await pg.goto(URL, { waitUntil: "domcontentloaded" });
  await waitGate(pg);
  let b = await boot(pg);
  const gateText = await pg.evaluate(() => (document.getElementById("dd-boot-stage") || {}).textContent);
  check("[CARGA] index.html responde 200 y la carga termina sin errores críticos", resp.status() === 200 && b.criticalErrors.length === 0, "carga " + b.loadMs + " ms");
  check("[CARGA] sin pulsación previa, la carga espera una tecla (el navegador bloquearía el sonido)", b.waitingGesture === true && b.state === "LOADING" && /PULSA CUALQUIER TECLA/.test(gateText), gateText);
  await shot(pg, "00_carga_espera_pulsacion");
  await sleep(1500);
  b = await boot(pg);
  check("[CARGA] la intro no empieza sola mientras espera", b.state === "LOADING" && !(await pg.evaluate(() => window.DD_OPENING.isActive())));
  const steps = await pg.evaluate(() => window.DD_BOOT.steps.map((s) => s.id));
  check("[CARGA] la carga incluye el paso de los planos de la introducción", steps.includes("opening"), steps.join(", "));

  /* ================= 2. INTRO COMPLETA EN TIEMPO REAL ================= */
  await pg.keyboard.press("KeyX");
  await pg.waitForFunction(() => window.DD_OPENING.isActive(), null, { timeout: 10000 });
  const t0 = Date.now();
  b = await boot(pg);
  check("[INTRO] una pulsación arranca la intro; estado INTRO", b.state === "INTRO" && b.introActive);
  const table = await pg.evaluate(() => ({ shots: window.DD_OPENING.SHOTS, dur: window.DD_OPENING.INTRO_DURATION, files: window.DD_OPENING.FILES }));
  check("[INTRO] tabla de planos: 7 planos contiguos que suman 32 s", table.shots.length === 7 && table.dur === 32 && table.shots[0].from === 0 && table.shots[6].to === 32 && table.shots.every((s, i) => i === 0 || s.from === table.shots[i - 1].to), table.shots.map((s) => s.id + ":" + s.from + "–" + s.to).join(" "));
  const seen = [], moving = {}, musicAt = {}, audioAt = [];
  let hubDuring = false, menuDuring = false, lastShot = 0, captured = {};
  while (true) {
    const s = await op(pg);
    if (!s) break;
    if (s.shot !== lastShot) { seen.push({ shot: s.shot, at: s.elapsed }); lastShot = s.shot; }
    const mid = (table.shots[s.shot - 1].from + table.shots[s.shot - 1].to) / 2;
    if (!captured[s.shot] && s.elapsed >= mid - 0.6) {
      captured[s.shot] = true;
      const a = await canvasSum(pg); await sleep(260); const c = await canvasSum(pg);
      moving[s.shot] = a !== c;
      await shot(pg, "intro_plano_" + s.shot + "_" + table.shots[s.shot - 1].name.replace(/ /g, "_"));
    }
    const st = await pg.evaluate(() => { const o = window.DD_OPENING.getState(); return { shot: o ? o.shot : 7, hub: window.DD_HUB.isActive(), menu: window.DD_UI.getState().menuVisible, music: window.DD_BOOT.getState().menuMusic, state: window.DD_BOOT.getState().state }; });
    if (st.hub) hubDuring = true;
    if (st.menu && st.state === "INTRO") menuDuring = true;
    musicAt[st.shot] = musicAt[st.shot] || st.music;   /* plano y música leídos en el mismo instante */
    audioAt.push([s.elapsed, s.audio, s.audioEvents]);
    await sleep(240);
  }
  const wall = (Date.now() - t0) / 1000;
  await waitState(pg, "MAIN_MENU");
  const end = await pg.evaluate(() => window.DD_OPENING.getLastEnd());
  check("[INTRO] dura 32 s de reloj real (±1,5 s)", Math.abs(wall - 32) <= 1.5 && end.by === "complete", wall.toFixed(2) + " s, fin: " + end.by + ", " + end.frames + " fotogramas");
  const comic = await pg.evaluate(() => ({ fonts: window.DD_OPENING.fontsReady(), cap: document.fonts.check('italic 700 40px "Barlow Condensed"'), sfx: document.fonts.check('400 40px "Bangers"'), nine: window.DD_OPENING.NINE_LEVELS, files: window.DD_OPENING.FILES }));
  check("[RÓTULOS] las dos fuentes definitivas están cargadas en el juego (Barlow Condensed y Bangers)", comic.fonts && comic.cap && comic.sfx);
  check("[PLANO 3] la tabla del corte tiene exactamente nueve pistas", comic.nine === 9, comic.nine + " (la lámina se revisa además a ojo en la captura)");
  check("[PROTAGONISTA] sólo se cargan la lámina maestra y el IDLE 07B; ninguna ilustración generada del personaje", comic.files.filter((f) => /character_master|pm_idle_fid_00/.test(f)).length === 4 && !comic.files.some((f) => /op_05b_back|op_06_face|mc_06_fall/.test(f)), comic.files.length + " archivos");
  check("[INTRO] los 7 planos se ven en orden", seen.map((s) => s.shot).join("") === "1234567", seen.map((s) => s.shot + "@" + s.at.toFixed(1)).join(" "));
  check("[INTRO] cada plano entra en su tiempo (±0,5 s)", seen.every((s) => Math.abs(s.at - table.shots[s.shot - 1].from) <= 0.5), seen.map((s) => (s.at - table.shots[s.shot - 1].from).toFixed(2)).join(" "));
  check("[INTRO] ANIM los 7 planos se mueven (dos fotogramas distintos a 260 ms)", [1, 2, 3, 4, 5, 6, 7].every((i) => moving[i] === true), JSON.stringify(moving));
  check("[INTRO] no entra al Refugio ni muestra el menú durante la intro", !hubDuring && !menuDuring);
  const audioOn = audioAt.filter((a) => a[1]).length / audioAt.length;
  check("[AUDIO] el sonido de la intro está activo (contexto de audio en marcha) y dispara sucesos", audioOn > 0.9 && end.audioEvents > 100, Math.round(audioOn * 100) + " % de las muestras, " + end.audioEvents + " sucesos");
  check("[AUDIO] el tema del menú NO suena en los planos 1–6 y arranca en el plano 7", [1, 2, 3, 4, 5, 6].every((i) => !musicAt[i]) && musicAt[7] === true, JSON.stringify(musicAt));
  await sleep(1100);
  const aud = await pg.evaluate(() => ({ op: window.DD_OPENING.audioState(), music: window.DD_BOOT.getState().menuMusic, canvas: getComputedStyle(document.getElementById("dd-opening")).display }));
  check("[AUDIO] al terminar, el sonido de la intro queda a cero y sólo suena el tema del menú", aud.op && aud.op.gain <= 0.001 && aud.music === true, "ganancia " + (aud.op && aud.op.gain));
  check("[INTRO] el lienzo de la intro se retira al terminar", aud.canvas === "none");
  const tech = await pg.evaluate(() => {
    const o = document.getElementById("dd-cine-overlay"), pill = document.getElementById("dmo-v32-toggle-pill");
    return { cine: !!(o && o.classList.contains("active")), pill: pill ? getComputedStyle(pill).display : "ausente", hint: document.getElementById("dd-opening-hint").textContent };
  });
  check("[INTRO] sin rótulos técnicos: bandas de DD_CINE inactivas, botón de depuración oculto, único texto «SALTAR»", !tech.cine && (tech.pill === "none" || tech.pill === "ausente") && tech.hint === "SALTAR", JSON.stringify(tech));

  /* ================= 3. MENÚ ================= */
  let m = await menuInfo(pg);
  await shot(pg, "menu_sin_partida_1280x720");
  check("[MENÚ] la intro termina en el menú principal (estado MAIN_MENU, menú visible)", m.state.state === "MAIN_MENU" && m.ui.menuVisible && !m.ui.busy);
  check("[MENÚ] sin partida guardada: NUEVA PARTIDA, OPCIONES, CRÉDITOS, SALIR (CONTINUAR no existe)", m.actions.join(",") === "new,options,credits,exit", m.labels.join(" · "));
  check("[MENÚ] una sola opción seleccionada y con el foco", m.selected.length === 1 && m.selected[0] === "new" && m.focus === "new", "sel " + m.selected + ", foco " + m.focus);
  const look = await pg.evaluate(() => {
    const logo = document.getElementById("dd-menu-logo-img"), bd = document.getElementById("dd-menu-backdrop");
    const sel = document.querySelector("#dd-menu-nav .dd-selected"), idle = document.querySelector('#dd-menu-nav [data-action="options"]');
    return { logo: logo.currentSrc || logo.src, logoOk: logo.naturalWidth, bd: bd.currentSrc || bd.src, bdOk: bd.naturalWidth,
      selBrush: getComputedStyle(sel, "::before").transform, idleBrush: getComputedStyle(idle, "::before").transform,
      selColor: getComputedStyle(sel).color, idleColor: getComputedStyle(idle).color };
  });
  check("[MENÚ] usa el logotipo oficial y el último plano de la intro como fondo", /logos\/logo_deadbeat_graffiti\.png$/.test(look.logo) && look.logoOk > 0 && /opening\/mc_07_pit\.jpg$/.test(look.bd) && look.bdOk > 0, look.logo.split("/").pop() + " · " + look.bd.split("/").pop());
  check("[MENÚ] estado de selección distinto por forma (brochazo) y color", look.selBrush !== look.idleBrush && look.selColor !== look.idleColor, "texto " + look.selColor + " / " + look.idleColor);

  /* teclado */
  const order = [];
  for (let i = 0; i < 4; i++) { await pg.keyboard.press("ArrowDown"); await sleep(60); order.push((await menuInfo(pg)).selected[0]); }
  check("[TECLADO] ↓ recorre las opciones y da la vuelta", order.join(",") === "options,credits,exit,new", order.join(" → "));
  await pg.keyboard.press("ArrowUp"); await sleep(60); const up1 = (await menuInfo(pg)).selected[0];
  await pg.keyboard.press("KeyS"); await sleep(60); const s1 = (await menuInfo(pg)).selected[0];
  await pg.keyboard.press("KeyW"); await sleep(60); const w1 = (await menuInfo(pg)).selected[0];
  await pg.keyboard.press("Home"); await sleep(60); const h1 = await menuInfo(pg);
  check("[TECLADO] ↑, W, S e Inicio funcionan; el foco sigue a la selección", up1 === "exit" && s1 === "new" && w1 === "exit" && h1.selected[0] === "new" && h1.focus === "new", [up1, s1, w1, h1.selected[0]].join(" → "));
  /* ratón */
  await pg.hover('#dd-menu-nav [data-action="credits"]'); await sleep(80);
  m = await menuInfo(pg);
  check("[RATÓN] pasar el cursor selecciona (mismo indicador que el teclado)", m.selected.join() === "credits" && m.focus === "credits");
  await pg.click('#dd-menu-nav [data-action="credits"]'); await sleep(350);
  m = await menuInfo(pg);
  const credTxt = await pg.evaluate(() => document.getElementById("dd-submenu-body").textContent);
  check("[CRÉDITOS] el clic abre los créditos (estado SUBMENU) con contenido", m.state.state === "SUBMENU" && m.ui.submenu === "credits" && /SER-RGV/.test(credTxt));
  await shot(pg, "menu_creditos");
  await pg.keyboard.press("Escape"); await sleep(300);
  m = await menuInfo(pg);
  check("[CRÉDITOS] Esc vuelve al menú con la misma opción seleccionada", m.state.state === "MAIN_MENU" && !m.ui.submenu && m.selected.join() === "credits");

  /* opciones */
  await pg.keyboard.press("ArrowUp"); await sleep(60); await pg.keyboard.press("Enter"); await sleep(400);
  m = await menuInfo(pg);
  check("[OPCIONES] Enter abre OPCIONES", m.state.state === "SUBMENU" && m.ui.submenu === "options");
  const opt0 = await pg.evaluate(() => ({ vol: document.getElementById("dd-opt-menuvol").value, flash: (document.getElementById("dd-opt-flash") || {}).textContent || null,
    ids: [...document.querySelectorAll("#dd-submenu-body button, #dd-submenu-body input, #dd-submenu-body select")].map((e) => e.id || e.tagName).slice(0, 30) }));
  await pg.evaluate(() => { const v = document.getElementById("dd-opt-menuvol"); v.value = "35"; v.dispatchEvent(new Event("input", { bubbles: true })); });
  const toggles = await pg.evaluate(() => [...document.querySelectorAll("#dd-submenu-body .dd-toggle:not([disabled])")].map((e) => e.id));
  const a11yBefore = await pg.evaluate(() => localStorage.getItem("dmodisco_a11y_v1"));
  const flashId = await pg.evaluate(() => { const c = document.querySelector('#dd-opt-mix input[type="checkbox"]'); if (!c) return null; c.click(); return c.id || "casilla"; });
  await sleep(200);
  await pg.click("#dd-opt-menuon"); await sleep(250);
  const musicOff = (await boot(pg)).menuMusic;
  await pg.click("#dd-opt-menuon"); await sleep(400);
  const musicOn = (await boot(pg)).menuMusic;
  const optSaved = await pg.evaluate(() => ({ cover: localStorage.getItem("ddc_cover_settings_v1"), a11y: localStorage.getItem("dmodisco_a11y_v1"), muted: localStorage.getItem("dmodisco_muted_v1") }));
  check("[OPCIONES] el volumen del menú se guarda al moverlo", /"vol":0\.35/.test(optSaved.cover || ""), optSaved.cover);
  check("[OPCIONES] el interruptor de destellos cambia y se guarda", !!flashId && optSaved.a11y !== a11yBefore, (a11yBefore || "—") + " → " + optSaved.a11y);
  check("[OPCIONES][AUDIO] silenciar la música del menú la para; reactivarla la arranca", musicOff === false && musicOn === true && optSaved.muted === "0");
  await shot(pg, "menu_opciones");
  /* mando dentro de opciones: B vuelve */
  await pg.evaluate(() => window.__padSet(1, true)); await sleep(250); await pg.evaluate(() => window.__padSet(1, false)); await sleep(350);
  m = await menuInfo(pg);
  check("[MANDO] B cierra el submenú y vuelve al menú", m.state.state === "MAIN_MENU" && !m.ui.submenu);

  /* mando en el menú */
  await sleep(500);
  await pg.keyboard.press("Home"); await sleep(80);
  await pg.evaluate(() => window.__padSet(13, true)); await sleep(160); await pg.evaluate(() => window.__padSet(13, false)); await sleep(160);
  const g1 = (await menuInfo(pg)).selected[0];
  await pg.evaluate(() => window.__padSet(12, true)); await sleep(160); await pg.evaluate(() => window.__padSet(12, false)); await sleep(160);
  const g2 = (await menuInfo(pg)).selected[0];
  const padHint = await pg.evaluate(() => ({ cls: document.body.classList.contains("dd-input-pad"), gp: getComputedStyle(document.querySelector("#dd-menu-hint .dd-gp")).display, kb: getComputedStyle(document.querySelector("#dd-menu-hint .dd-kb")).display }));
  check("[MANDO] la cruceta mueve la selección (abajo y arriba)", g1 === "options" && g2 === "new", g1 + " → " + g2);
  check("[MANDO] la ayuda de controles cambia a la del mando", padHint.cls && padHint.gp !== "none" && padHint.kb === "none", JSON.stringify(padHint));
  await shot(pg, "menu_con_mando");
  for (let i = 0; i < 3; i++) { await pg.evaluate(() => window.__padSet(13, true)); await sleep(160); await pg.evaluate(() => window.__padSet(13, false)); await sleep(160); }
  await pg.evaluate(() => window.__padSet(0, true)); await sleep(200); await pg.evaluate(() => window.__padSet(0, false)); await sleep(400);
  m = await menuInfo(pg);
  check("[MANDO][SALIR] A sobre SALIR abre el diálogo de salida", m.ui.submenu === "exit", "submenú " + m.ui.submenu);
  await pg.click("#dd-exit-no"); await sleep(300);
  m = await menuInfo(pg);
  check("[SALIR] «Seguir bailando» vuelve al menú", m.state.state === "MAIN_MENU" && !m.ui.submenu);
  await pg.keyboard.press("Enter"); await sleep(350);
  await pg.click("#dd-exit-yes"); await sleep(700);
  const out = await pg.evaluate(() => ({ black: !!document.getElementById("dd-blackout"), music: window.DD_BOOT.getState().menuMusic, hub: window.DD_HUB.isActive() }));
  check("[SALIR][AUDIO] salir muestra la despedida y para la música; no arranca partida", out.black && out.music === false && !out.hub);
  await shot(pg, "menu_salir_despedida");
  await pg.click("#dd-reenter"); await sleep(500);
  m = await menuInfo(pg);
  check("[SALIR] «Volver a entrar» restaura el menú y su música", m.state.state === "MAIN_MENU" && m.state.menuMusic === true && m.ui.menuVisible);
  const pressState = await pg.evaluate(() => { const bt = document.querySelector('#dd-menu-nav [data-action="options"]'); const a = getComputedStyle(bt, "::before").backgroundColor; bt.classList.add("dd-press"); const c = getComputedStyle(bt, "::before").backgroundColor; bt.classList.remove("dd-press"); return [a, c]; });
  check("[MENÚ] estado de pulsación distinto del de reposo", pressState[0] !== pressState[1], pressState.join(" → "));

  /* ================= 4. NUEVA PARTIDA → DESCENSO → REFUGIO ================= */
  await pg.keyboard.press("Home"); await sleep(100);
  const tD = Date.now();
  await pg.keyboard.press("Enter"); await pg.keyboard.press("Enter");
  await pg.evaluate(() => { window.DD_UI.triggerMenuAction("new"); window.DD_UI.triggerMenuAction("continue"); });
  await sleep(500);
  let d = await op(pg);
  b = await boot(pg);
  check("[NUEVA] NUEVA PARTIDA arranca el descenso; cuatro activaciones seguidas producen una sola secuencia", d && d.type === "descent" && d.elapsed < 1.2 && b.state === "MAIN_MENU", d ? "descenso en " + d.elapsed.toFixed(2) + " s" : "sin secuencia");
  const phases = [], dMoving = {}; let lastP = 0, hubEarly = false, musicDesc = null; const capD = {};
  const dt = await pg.evaluate(() => window.DD_OPENING.DESCENT_PHASES);
  while (true) {
    const s = await op(pg);
    if (!s) break;
    if (s.shot !== lastP) { phases.push({ p: s.shot, at: s.elapsed }); lastP = s.shot; }
    const st = await pg.evaluate(() => ({ hub: window.DD_HUB.isActive(), state: window.DD_BOOT.getState().state, music: window.DD_BOOT.getState().menuMusic, menu: window.DD_UI.getState().menuVisible }));
    if (st.hub || st.state === "PLAYING") hubEarly = true;
    if (s.elapsed > 2.5) musicDesc = st.music;
    const mid = (dt[s.shot - 1].from + dt[s.shot - 1].to) / 2;
    if (!capD[s.shot] && s.elapsed >= mid - 0.2) {
      capD[s.shot] = true;
      const a = await canvasSum(pg); await sleep(200); const c = await canvasSum(pg); dMoving[s.shot] = a !== c;
      await shot(pg, "descenso_" + s.shot + "_" + dt[s.shot - 1].name);
    }
    await sleep(150);
  }
  const wallD = (Date.now() - tD) / 1000;
  await waitState(pg, "PLAYING", 8000);
  const endD = await pg.evaluate(() => window.DD_OPENING.getLastEnd());
  check("[DESCENSO] dura 4,6 s de reloj real (±0,8 s) y es más corto que el plano 6 de la intro", Math.abs(wallD - 4.6) <= 0.8 && endD.type === "descent" && endD.by === "complete", wallD.toFixed(2) + " s");
  check("[DESCENSO] dos fases en orden: pozo, llegada (sin repetir grietas ni sombrero)", phases.map((p) => p.p).join("") === "12", phases.map((p) => p.p + "@" + p.at.toFixed(1)).join(" "));
  check("[DESCENSO] ANIM las dos fases se mueven", dMoving[1] && dMoving[2], JSON.stringify(dMoving));
  check("[DESCENSO] no se entra al Refugio antes de terminar la secuencia", !hubEarly);
  check("[DESCENSO][AUDIO] la música del menú se apaga durante el descenso", musicDesc === false);
  await sleep(1600);
  const ref = await pg.evaluate(() => ({
    state: window.DD_BOOT.getState(), hub: window.DD_HUB.isActive(), hubSt: window.DD_HUB.getState ? window.DD_HUB.getState() : null,
    menu: getComputedStyle(document.getElementById("dd-main-menu")).display, canvas: getComputedStyle(document.getElementById("dd-opening")).display,
    hud: !document.getElementById("dd-hud").classList.contains("dd-hidden"), save: localStorage.getItem("dd_save_v1"),
    speaker: document.getElementById("dd-dj-speaker").textContent, text: document.getElementById("dd-dj-text").textContent,
    op: window.DD_OPENING.audioState(), ui: window.DD_UI.getState()
  }));
  await shot(pg, "refugio_llegada");
  check("[REFUGIO] el descenso desemboca en el Refugio: estado PLAYING, Refugio activo, menú y lienzo retirados, HUD visible", ref.state.state === "PLAYING" && ref.hub && ref.menu === "none" && ref.canvas === "none" && ref.hud && !ref.ui.busy, JSON.stringify(ref.hubSt).slice(0, 120));
  check("[REFUGIO][AUDIO] en el Refugio no suena la música del menú ni la del descenso", ref.state.menuMusic === false && ref.op.gain <= 0.001);
  check("[REFUGIO] la bienvenida es de Tempo y sin nomenclatura descartada", ref.speaker === "TEMPO" && !/cazador|Lujuria|Virgilio|[Cc]írculo/.test(ref.text), ref.speaker + ": " + ref.text);
  check("[GUARDADO] llegar al Refugio crea la ficha de partida", /"v":1/.test(ref.save || "") && /"visits":1/.test(ref.save || ""), ref.save);
  /* el Refugio es jugable: el personaje se mueve */
  const p0 = await pg.evaluate(() => window.DD_HUB.getState());
  await pg.keyboard.down("KeyD"); await sleep(700); await pg.keyboard.up("KeyD"); await sleep(150);
  const p1 = await pg.evaluate(() => window.DD_HUB.getState());
  check("[REFUGIO] el control se entrega: el personaje se mueve con el teclado", JSON.stringify(p0) !== JSON.stringify(p1), JSON.stringify(p0).slice(0, 70) + " → " + JSON.stringify(p1).slice(0, 70));
  await sleep(1200);
  b = await boot(pg);
  check("[REFUGIO] el estado se mantiene estable (sigue en PLAYING, sin menú)", b.state === "PLAYING" && !(await pg.evaluate(() => window.DD_UI.getState().menuVisible)));

  /* ================= 5. CONTINUAR CON PARTIDA GUARDADA Y PERSISTENCIA ================= */
  await pg.reload({ waitUntil: "domcontentloaded" });
  await waitGate(pg); await pg.keyboard.press("KeyX");
  await pg.waitForFunction(() => window.DD_OPENING.isActive(), null, { timeout: 10000 });
  await sleep(700); await pg.keyboard.press("Space");
  await waitState(pg, "MAIN_MENU"); await sleep(900);
  m = await menuInfo(pg);
  await shot(pg, "menu_con_partida_1280x720");
  check("[CONTINUAR] con partida guardada aparece CONTINUAR en segundo lugar", m.actions.join(",") === "new,continue,options,credits,exit", m.labels.join(" · "));
  const persisted = await pg.evaluate(() => ({ cover: localStorage.getItem("ddc_cover_settings_v1"), a11y: localStorage.getItem("dmodisco_a11y_v1") }));
  await pg.evaluate(() => window.DD_UI.openSubmenu("options")); await sleep(300);
  const volShown = await pg.evaluate(() => document.getElementById("dd-opt-menuvol").value);
  await pg.keyboard.press("Escape"); await sleep(300);
  check("[OPCIONES] las opciones persisten tras recargar (volumen 35 % y destellos)", /"vol":0\.35/.test(persisted.cover || "") && persisted.a11y === optSaved.a11y && volShown === "35", "volumen mostrado " + volShown + " %");
  await pg.keyboard.press("Home"); await sleep(60); await pg.keyboard.press("ArrowDown"); await sleep(80);
  const selC = (await menuInfo(pg)).selected[0];
  const tC = Date.now();
  await pg.keyboard.press("Enter");
  await waitState(pg, "PLAYING", 5000);
  const cont = await pg.evaluate(() => ({ hub: window.DD_HUB.isActive(), last: window.DD_OPENING.getLastEnd(), save: JSON.parse(localStorage.getItem("dd_save_v1")), music: window.DD_BOOT.getState().menuMusic, menu: window.DD_UI.getState().menuVisible }));
  check("[CONTINUAR] lleva directamente al Refugio, sin repetir el descenso", selC === "continue" && cont.hub && cont.last.type === "intro" && !cont.menu, ((Date.now() - tC) / 1000).toFixed(2) + " s");
  check("[CONTINUAR][GUARDADO] conserva la ficha (misma fecha de creación, visita 2) y para la música del menú", cont.save.visits === 2 && cont.save.created !== cont.save.last && cont.music === false, JSON.stringify(cont.save));
  await pg.context().close();

  /* ================= 6. SALTO DE LA INTRO EN CADA PLANO ================= */
  const skipRes = [];
  for (let i = 1; i <= 7; i++) {
    const p = await newPage("salto" + i);
    await toIntro(p);
    await p.evaluate((t) => window.DD_OPENING.debugSeek(t, false), table.shots[i - 1].from + 1.2);
    await sleep(350);
    const before = await op(p);
    if (i % 3 === 0) await p.mouse.click(640, 360);
    else if (i % 3 === 1) await p.keyboard.press("Space");
    else { await p.evaluate(() => window.__padSet(9, true)); await sleep(150); await p.evaluate(() => window.__padSet(9, false)); }
    await waitState(p, "MAIN_MENU", 6000).catch(() => {});
    await sleep(900);
    const r = await p.evaluate(() => ({ s: window.DD_BOOT.getState(), end: window.DD_OPENING.getLastEnd(), hub: window.DD_HUB.isActive(), menu: window.DD_UI.getState().menuVisible, gain: window.DD_OPENING.audioState().gain, active: window.DD_OPENING.isActive() }));
    skipRes.push({ plano: i, via: ["clic", "Espacio", "Start"][i % 3], en: before && before.shot, ok: r.s.state === "MAIN_MENU" && r.end.by === "skip" && !r.hub && r.menu && r.s.menuMusic === true && r.gain <= 0.001 && !r.active });
    await p.context().close();
  }
  check("[SALTO] la intro se puede saltar en los 7 planos (Espacio, clic y Start) y siempre acaba en el menú con su música", skipRes.every((r) => r.ok && r.en === r.plano), skipRes.map((r) => r.plano + ":" + r.via + (r.ok ? "✓" : "✗")).join(" "));

  /* ================= 7. TRES VUELTAS: SALTO DEL DESCENSO Y ESTADOS ================= */
  const p3 = await newPage("vueltas");
  const laps = [];
  for (let i = 0; i < 3; i++) {
    await p3.evaluate(() => { try { localStorage.removeItem("dd_save_v1"); } catch (e) {} }).catch(() => {});
    await toMenu(p3);
    await p3.keyboard.press("Home"); await p3.keyboard.press("Enter");
    await p3.waitForFunction(() => window.DD_OPENING.isActive(), null, { timeout: 5000 });
    await sleep([600, 1700, 3300][i]);
    const at = await op(p3);
    if (i === 1) { await p3.evaluate(() => window.__padSet(0, true)); await sleep(150); await p3.evaluate(() => window.__padSet(0, false)); } else await p3.keyboard.press("Space");
    await waitState(p3, "PLAYING", 6000).catch(() => {});
    await sleep(900);
    const r = await p3.evaluate(() => ({ s: window.DD_BOOT.getState(), hub: window.DD_HUB.isActive(), end: window.DD_OPENING.getLastEnd(), busy: window.DD_UI.getState().busy, gain: window.DD_OPENING.audioState().gain, canvas: getComputedStyle(document.getElementById("dd-opening")).display }));
    laps.push({ fase: at && at.shot, ok: r.s.state === "PLAYING" && r.hub && r.end.type === "descent" && r.end.by === "skip" && !r.busy && r.s.menuMusic === false && r.gain <= 0.001 });
    if (i === 2) { await sleep(700); laps.canvas = await p3.evaluate(() => getComputedStyle(document.getElementById("dd-opening")).display); }
  }
  check("[VUELTAS] tres recorridos completos seguidos; el descenso saltado en cada fase llega igual al Refugio", laps.every((l) => l.ok) && laps.map((l) => l.fase).join("") === "112" && laps.canvas === "none", laps.map((l) => "fase " + l.fase + (l.ok ? "✓" : "✗")).join(" "));
  await p3.context().close();

  /* ================= 8. RESOLUCIONES ================= */
  const sizes = [[1024, 768], [1280, 720], [1366, 768], [1920, 1080], [2560, 1080], [2560, 1440], [3440, 1440]];
  const resOut = [];
  for (const [w, h] of sizes) {
    const p = await newPage("res" + w, w, h);
    await toIntro(p);
    await p.evaluate(() => window.DD_OPENING.debugSeek(12, true)); await sleep(250);
    const cv = await p.evaluate(() => { const c = document.getElementById("dd-opening"), r = c.getBoundingClientRect(); return { w: c.width, h: c.height, cw: r.width, ch: r.height, ar: c.width / c.height }; });
    if (w === 3440 || w === 1024) await shot(p, "intro_plano_3_" + w + "x" + h);
    await p.evaluate(() => window.DD_OPENING.debugSeek(0.5, false)); await sleep(500);
    await p.keyboard.press("Space"); await waitState(p, "MAIN_MENU"); await sleep(900);
    const lay = await p.evaluate(() => {
      const W = innerWidth, H = innerHeight, R = (e) => e.getBoundingClientRect();
      const btns = [...document.querySelectorAll("#dd-menu-nav .dd-menu-btn:not([hidden])")].map(R);
      const logo = R(document.getElementById("dd-menu-logo-img")), hint = R(document.getElementById("dd-menu-hint")), bd = R(document.getElementById("dd-menu-backdrop"));
      const inside = (r) => r.left >= 0 && r.top >= 0 && r.right <= W + 0.5 && r.bottom <= H + 0.5 && r.width > 0 && r.height > 0;
      const overlap = btns.some((a, i) => btns.some((c, j) => j > i && a.bottom > c.top + 1 && a.top < c.bottom - 1));
      return { btnsIn: btns.every(inside), logoIn: inside(logo), hintIn: inside(hint), overlap, navBottom: Math.max(...btns.map((r) => r.bottom)), hintTop: hint.top, logoBottom: logo.bottom, navTop: btns[0].top,
        bdCovers: bd.width >= W - 1 && bd.height >= H - 1, minBtnH: Math.min(...btns.map((r) => r.height)), scroll: document.documentElement.scrollWidth > W + 1 };
    });
    const okLay = lay.btnsIn && lay.logoIn && lay.hintIn && !lay.overlap && lay.navBottom <= lay.hintTop && lay.logoBottom <= lay.navTop && lay.bdCovers && !lay.scroll;
    const okCv = Math.abs(cv.ar - w / h) < 0.01 && Math.abs(cv.cw - w) < 1 && Math.abs(cv.ch - h) < 1;
    resOut.push({ w, h, ok: okLay && okCv, lay, cv });
    await shot(p, "menu_" + w + "x" + h);
    await p.context().close();
  }
  check("[ESCALADO] menú en 7 resoluciones (4:3 a 21:9): todo dentro de la ventana, sin solapes ni desbordes, fondo a pantalla completa", resOut.every((r) => r.ok), resOut.map((r) => r.w + "×" + r.h + (r.ok ? "✓" : "✗")).join(" "));
  check("[ESCALADO] el lienzo de la intro ocupa la ventana con su misma proporción (sin estirar)", resOut.every((r) => Math.abs(r.cv.ar - r.w / r.h) < 0.01), resOut.map((r) => r.cv.w + "×" + r.cv.h).join(" "));
  const bad = resOut.filter((r) => !r.ok); if (bad.length) console.log(JSON.stringify(bad, null, 1));

  /* ================= 9. MOVIMIENTO REDUCIDO, SILENCIO Y RECURSO AUSENTE ================= */
  const pr = await newPage("reducido", 1280, 720, { reducedMotion: "reduce" });
  await toIntro(pr);
  await pr.evaluate(() => window.DD_OPENING.debugSeek(17.2, true)); await sleep(200);
  await shot(pr, "intro_movimiento_reducido_plano4");
  await pr.evaluate(() => window.DD_OPENING.debugSeek(30.5, false));
  await waitState(pr, "MAIN_MENU", 8000); await sleep(400);
  const rr = await pr.evaluate(() => ({ s: window.DD_BOOT.getState().state, by: window.DD_OPENING.getLastEnd().by }));
  check("[ACCESIBILIDAD] con movimiento reducido la intro se reproduce y termina en el menú", rr.s === "MAIN_MENU" && rr.by === "complete");
  await pr.context().close();

  const pm = await newPage("silencio");
  await pm.addInitScript(() => { try { localStorage.setItem("dmodisco_muted_v1", "1"); } catch (e) {} });
  await toIntro(pm); await sleep(1500);
  const ms = await pm.evaluate(() => ({ op: window.DD_OPENING.getState(), ctx: window.DD_OPENING.audioState() }));
  await pm.evaluate(() => window.DD_OPENING.debugSeek(28.5, false)); await sleep(900);
  const ms2 = await boot(pm);
  check("[AUDIO] con el audio silenciado en opciones, la intro no crea sonido", ms.op.audio === false && ms.op.audioEvents === 0 && ms.ctx === null, "música del menú en el título: " + ms2.menuMusic);
  await pm.context().close();

  const pf = await newPage("ausente");
  const ignore = errors.length;
  await pf.route("**/op_03_dancefloor.jpg", (r) => r.abort());
  await pf.goto(URL, { waitUntil: "domcontentloaded" });
  await pf.waitForFunction(() => window.DD_BOOT && (window.DD_BOOT.getState().waitingGesture || window.DD_BOOT.getState().state === "INTRO" || !document.getElementById("dd-boot-err").hidden), null, { timeout: 60000 });
  const errPanel = await pf.evaluate(() => !document.getElementById("dd-boot-err").hidden);
  let fb = { s: "error", by: null, px: 0 };
  if (!errPanel) {
    await pf.keyboard.press("KeyX"); await pf.waitForFunction(() => window.DD_OPENING.isActive(), null, { timeout: 8000 });
    await pf.evaluate(() => window.DD_OPENING.debugSeek(6, true)); await sleep(250);
    const px = await canvasSum(pf);
    await shot(pf, "intro_plano_2_sin_imagen_reserva");
    await pf.evaluate(() => window.DD_OPENING.debugSeek(31.2, false));
    await waitState(pf, "MAIN_MENU", 8000);
    fb = await pf.evaluate(() => ({ s: window.DD_BOOT.getState().state, by: window.DD_OPENING.getLastEnd().by })); fb.px = px;
  }
  errors.length = ignore;   /* los fallos de red de esta prueba son provocados */
  check("[ROBUSTEZ] si falta una imagen de la intro, el plano usa un fondo de reserva y el flujo llega al menú", !errPanel && fb.s === "MAIN_MENU" && fb.px > 0, errPanel ? "panel de error" : "fin: " + fb.by);
  await pf.context().close();

  /* ================= 10. CONSOLA ================= */
  check("[CONSOLA] cero errores, avisos, peticiones fallidas y respuestas ≥400 en todo el recorrido", errors.length === 0, errors.slice(0, 6).join(" | "));

  await browser.close();
  const pass = results.filter((r) => r.ok).length;
  console.log("\n" + pass + " de " + results.length + " superadas");
  if (OUT) {
    fs.writeFileSync(path.join(OUT, "qa_inicio.json"), JSON.stringify({ fecha: new Date().toISOString(), url: URL, superadas: pass, total: results.length, resultados: results, resoluciones: resOut.map((r) => ({ w: r.w, h: r.h, ok: r.ok })), saltos: skipRes }, null, 1));
  }
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error("ERROR", e); process.exit(2); });
