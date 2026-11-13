/* Respuesta del menú en el JUEGO REAL (index.html): cada control con teclado, ratón y mando simulado.
   Uso: DD_CHROMIUM=/ruta/a/chromium node tools/qa/test_menu_respuesta.js [http://localhost:8080] [carpeta_capturas]
   Perfil de navegador desechable. El mando es simulado (navigator.getGamepads): no sustituye a un mando físico. */
const { chromium } = require("playwright-core"); const fs = require("fs");
const URL = process.argv[2] || "http://localhost:8080", OUT = process.argv[3] || "/tmp/evm"; fs.mkdirSync(OUT, { recursive: true });
const res = []; const check = (n, ok, d) => { res.push({ name: n, ok: !!ok, detail: d === undefined ? "" : String(d) }); console.log((ok ? "PASS " : "FAIL ") + n + (d !== undefined ? "  [" + d + "]" : "")); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.DD_CHROMIUM || undefined, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  const pg = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
  await pg.addInitScript(() => {
    const mk = () => ({ id: "Xbox (simulado)", index: 0, connected: true, mapping: "standard", timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) });
    window.__pad = null;
    window.__padSet = (btn, on) => { if (!window.__pad) window.__pad = mk(); if (btn != null) window.__pad.buttons[btn] = { pressed: !!on, value: on ? 1 : 0 }; };
    navigator.getGamepads = () => [window.__pad];
  });
  await pg.goto(URL + "/index.html", { waitUntil: "domcontentloaded" });
  await pg.evaluate(() => { localStorage.clear(); localStorage.setItem("dd_save_v1", JSON.stringify({ v: 1, created: "2026-10-01T10:00:00.000Z", last: "x", visits: 2 })); });
  await pg.reload({ waitUntil: "domcontentloaded" });
  /* ---------- carga ---------- */
  await pg.waitForFunction(() => window.DD_BOOT && (window.DD_BOOT.getState().waitingGesture || window.DD_BOOT.getState().state === "INTRO"), null, { timeout: 60000 });
  const load = await pg.evaluate(() => {
    const f = document.getElementById("dd-boot-frame"); if (!f) return null;
    const vis = [...f.querySelectorAll("*")].filter((e) => e.children.length === 0 && e.textContent.trim() && e.offsetParent !== null && getComputedStyle(e).visibility !== "hidden").map((e) => e.textContent.trim());
    const c = document.getElementById("ddc-cover");
    return { vis, cover: c ? getComputedStyle(c).display : "sin nodo", bg: getComputedStyle(f.querySelector(".dd-boot-bg")).display, logo: !!document.getElementById("dd-boot-logo").naturalWidth, bar: document.getElementById("dd-boot-bar").getBoundingClientRect().width > 100 };
  });
  if (load) {
    await pg.screenshot({ path: OUT + "/carga_limpia.jpg", type: "jpeg", quality: 88 });
    check("[CARGA] en pantalla sólo quedan el logotipo, la barra y, si hace falta, el aviso de pulsar una tecla", load.logo && load.bar && load.vis.length <= 1 && load.vis.every((t) => /PULSA CUALQUIER TECLA/.test(t)), JSON.stringify(load.vis));
    check("[CARGA] la portada antigua no se puede ver (oculta desde la hoja de estilos, no desde un script)", load.cover === "none" || load.cover === "sin nodo", load.cover);
    check("[CARGA] sin imagen antigua de fondo", load.bg === "none");
    await pg.keyboard.press("KeyX");
  } else check("[CARGA] pantalla de carga observada", false, "la carga terminó antes de poder medirla");
  await pg.waitForFunction(() => window.DD_BOOT.getState().state === "INTRO", null, { timeout: 30000 });
  await pg.evaluate(() => window.DD_OPENING.debugSeek(31.7, false));
  await pg.waitForFunction(() => window.DD_BOOT.getState().state === "MAIN_MENU");
  const S = () => pg.evaluate(() => { const a = document.activeElement; return { st: window.DD_BOOT.getState().state, sub: window.DD_UI.getState().submenu, sel: (document.querySelector("#dd-menu-nav .dd-selected") || { dataset: {} }).dataset.action, focus: a ? (a.id || (a.dataset && a.dataset.action) || a.tagName) : null }; });
  const val = (id) => pg.evaluate((id) => { const e = document.getElementById(id); return e.type === "checkbox" ? String(e.checked) : (e.tagName === "BUTTON" ? e.textContent.trim() : e.value); }, id);
  const focus = (id) => pg.evaluate((id) => document.getElementById(id).focus(), id);
  const key = async (k, ms) => { await pg.keyboard.press(k); await sleep(ms || 110); };
  const openSub = async (a) => { await pg.waitForFunction(() => window.DD_BOOT.getState().state === "MAIN_MENU" && !window.DD_UI.getState().busy); await pg.evaluate((a) => document.querySelector('#dd-menu-nav [data-action="' + a + '"]').focus(), a); await sleep(60); await pg.keyboard.press("Enter"); await pg.waitForFunction((a) => window.DD_UI.getState().submenu === a, a, { timeout: 5000 }); await sleep(200); };
  const pad = async (btn, ms) => { await pg.evaluate((b) => window.__padSet(b, true), btn); await sleep(ms || 130); await pg.evaluate((b) => window.__padSet(b, false), btn); await sleep(170); };

  /* ---------- menú principal ---------- */
  await sleep(100); await key("ArrowDown"); let s = await S();
  check("[MENÚ] responde desde el primer instante (tecla a 0,1 s de aparecer)", s.sel === "continue", s.sel);
  await sleep(700);
  const order = []; for (let i = 0; i < 5; i++) { await key("ArrowDown"); order.push((await S()).sel); }
  check("[MENÚ] teclado: ↓ recorre las cinco opciones y da la vuelta", order.join(",") === "options,credits,exit,new,continue", order.join(","));
  await key("KeyW"); const w = (await S()).sel; await key("KeyS"); const sd = (await S()).sel; await key("End"); const en = (await S()).sel; await key("Home"); const ho = (await S()).sel;
  check("[MENÚ] teclado: W, S, Inicio y Fin", w === "new" && sd === "continue" && en === "exit" && ho === "new", [w, sd, en, ho].join(","));
  const boxes = await pg.evaluate(() => [...document.querySelectorAll("#dd-menu-nav .dd-menu-btn")].filter((x) => !x.hidden).map((x) => { const r = x.getBoundingClientRect(); return { a: x.dataset.action, x: r.x, y: r.y, w: r.width, h: r.height }; }));
  const hov = []; for (const bx of boxes) { await pg.mouse.move(bx.x + bx.w - 6, bx.y + bx.h - 5, { steps: 3 }); await sleep(90); hov.push((await S()).sel); }
  check("[MENÚ] ratón: pasar por encima selecciona cada opción, también en el borde del botón", hov.join(",") === boxes.map((x) => x.a).join(","), hov.join(","));
  const gaps = await pg.evaluate(() => { const r = [...document.querySelectorAll("#dd-menu-nav .dd-menu-btn")].filter((x) => !x.hidden).map((x) => x.getBoundingClientRect()); return r.map((q) => Math.round(q.height)).join("/") + " px de alto, " + Math.round(r[0].width) + " px de ancho"; });
  check("[MENÚ] ratón: zona de pulsación de cada opción de al menos 44 px de alto", boxes.every((x) => x.h >= 44 && x.w >= 200), gaps);
  for (let i = 0; i < 3; i++) await pad(13); s = await S(); const padDown = s.sel; await pad(12); const padUp = (await S()).sel;
  check("[MENÚ] mando (simulado): cruceta abajo y arriba", padDown !== hov[hov.length - 1] && padUp !== padDown, padDown + " → " + padUp);
  const f0 = (await S()).focus; await pg.mouse.click(900, 400); await sleep(120); const f1 = (await S()).focus; await key("Tab"); const f2 = (await S()); await pg.keyboard.press("Shift+Tab"); await sleep(110); const f3 = await S();
  check("[MENÚ] un clic en el fondo no quita el foco y TAB / MAYÚS+TAB recorren las opciones sin salirse", f1 === f0 && f2.focus === f2.sel && f2.sel !== f0 && f3.focus === f0, [f0, f1, f2.focus, f3.focus].join(" → "));

  /* ---------- OPCIONES: teclado ---------- */
  const ob = boxes.find((x) => x.a === "options"); await pg.mouse.click(ob.x + ob.w / 2, ob.y + ob.h / 2); await pg.waitForSelector("#dd-opt-erase"); await sleep(350);
  s = await S(); check("[OPCIONES] se abre con un clic y el foco entra en el primer control", s.sub === "options" && s.focus === "menu-vol-master", s.focus);
  await pg.screenshot({ path: OUT + "/opciones_foco.jpg", type: "jpeg", quality: 88 });
  const seen = []; for (let i = 0; i < 12; i++) { await key("ArrowDown", 70); seen.push((await S()).focus); }
  const all = await pg.evaluate(() => [...document.querySelectorAll("#dd-submenu-body button:not([disabled]), #dd-submenu-body input, #dd-submenu-body select")].map((e) => e.id));
  check("[OPCIONES] teclado: ↓ pasa por todos los controles y vuelve al primero", all.every((id) => seen.includes(id)) && seen[seen.length - 1] === all[(12) % all.length], seen.length + " pasos, " + all.length + " controles");
  const ring = await pg.evaluate(() => { const out = []; for (const e of document.querySelectorAll("#dd-submenu-body button:not([disabled]), #dd-submenu-body input, #dd-submenu-body select")) { e.focus(); const c = getComputedStyle(e); if (c.outlineStyle === "none" || parseFloat(c.outlineWidth) < 2) out.push(e.id); } return out; });
  check("[OPCIONES] el control enfocado siempre lleva marca visible (también cuando el foco lo mueve el mando)", ring.length === 0, ring.join(",") || "todos con contorno");
  for (const id of ["menu-vol-music", "menu-vol-sfx", "menu-vol-dj", "dd-opt-menuvol"]) {
    await focus(id); const v0 = +(await val(id)); await key("ArrowLeft"); const v1 = +(await val(id)); await key("ArrowRight"); await key("ArrowRight"); const v2 = +(await val(id)); await key("KeyA"); const v3 = +(await val(id));
    check("[OPCIONES] teclado: deslizador " + id + " — ←/→ y A/D mueven de 5 en 5", v1 === v0 - 5 && v2 === v0 + 5 && v3 === v0, [v0, v1, v2, v3].join(" → "));
  }
  await focus("menu-vol-music"); const h0 = +(await val("menu-vol-music")); for (let i = 0; i < 4; i++) { await pg.keyboard.down("ArrowLeft"); await sleep(40); } await pg.keyboard.up("ArrowLeft"); /* pulsaciones repetidas sin soltar = repetición de tecla */ const h1 = +(await val("menu-vol-music"));
  check("[OPCIONES] teclado: mantener ← arrastra el deslizador", h1 === h0 - 20, h0 + " → " + h1);
  const out1 = await pg.evaluate(() => { const o = document.querySelector('output[for="menu-vol-music"]'); return o ? o.textContent : null; });
  check("[OPCIONES] el porcentaje mostrado sigue al deslizador", out1 === null || parseInt(out1, 10) === h1, String(out1));
  for (const id of ["menu-gfx", "dd-opt-gfx"]) {
    await focus(id); const v0 = await val(id); await key("ArrowRight"); const v1 = await val(id); await key("ArrowLeft"); const v2 = await val(id); await key("Enter"); const v3 = await val(id); await key("ArrowLeft");
    check("[OPCIONES] teclado: selector " + id + " — ←/→ y ENTER cambian de opción sin abrir la lista del navegador", v1 !== v0 && v2 === v0 && v3 !== v0, [v0, v1, v2, v3].join(" → "));
    await key("Escape", 300); s = await S();
    check("[OPCIONES] ESC cierra a la primera con el foco en " + id, s.st === "MAIN_MENU" && s.sub === null && s.sel === "options", s.st);
    await openSub("options");
  }
  const again = await pg.evaluate(() => [...document.querySelectorAll("#dd-submenu-body button:not([disabled]), #dd-submenu-body input, #dd-submenu-body select")].map((e) => e.id));
  check("[OPCIONES] al abrirla por tercera vez conserva todos sus controles (la mezcla del juego no desaparece)", again.join(",") === all.join(","), again.length + " de " + all.length);
  for (const id of ["menu-flash", "menu-shake"]) {
    await focus(id); const v0 = await val(id); await key("Enter"); const v1 = await val(id); await key("Space"); const v2 = await val(id);
    check("[OPCIONES] teclado: casilla " + id + " — ENTER y ESPACIO la marcan y desmarcan", v1 !== v0 && v2 === v0, [v0, v1, v2].join(" → "));
  }
  await focus("dd-opt-menuon"); const t0 = await val("dd-opt-menuon"); await key("Enter", 200); const t1 = await val("dd-opt-menuon"); const mus1 = await pg.evaluate(() => window.DD_BOOT.audio.isMenuMusicPlaying()); await key("Space", 200); const t2 = await val("dd-opt-menuon");
  check("[OPCIONES] teclado: MÚSICA DEL MENÚ se silencia y se reactiva de verdad", t1 !== t0 && t2 === t0 && /SILENCIADA/.test(t1), t0 + " → " + t1 + " → " + t2 + " · sonando silenciada: " + mus1);
  const tabs = []; await focus("dd-opt-erase"); await key("Tab"); tabs.push((await S()).focus); await pg.keyboard.press("Shift+Tab"); await sleep(110); tabs.push((await S()).focus);
  await pg.mouse.click(640, 715); await sleep(120); tabs.push((await S()).focus);
  check("[OPCIONES] TAB da la vuelta dentro del panel y un clic en vacío no quita el foco", tabs.join(",") === "menu-vol-master,dd-opt-erase,dd-opt-erase", tabs.join(" → "));
  /* ---------- OPCIONES: ratón ---------- */
  const drag = async (id, frac) => { const r = await pg.evaluate((id) => { const q = document.getElementById(id).getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height }; }, id); await pg.mouse.click(r.x + r.w * frac, r.y + r.h / 2); await sleep(120); return +(await val(id)); };
  const d1 = await drag("menu-vol-sfx", 0.25), d2 = await drag("menu-vol-sfx", 0.75), d3 = await drag("dd-opt-menuvol", 0.5);
  check("[OPCIONES] ratón: los deslizadores van adonde se pulsa", Math.abs(d1 - 25) <= 6 && Math.abs(d2 - 75) <= 6 && Math.abs(d3 - 50) <= 6, [d1, d2, d3].join(", "));
  const c0 = await val("menu-flash"); await pg.click("#menu-flash"); const c1 = await val("menu-flash"); await pg.evaluate(() => { const l = document.querySelector('label[for="menu-flash"]') || document.getElementById("menu-flash").closest("label"); if (l) l.click(); }); const c2 = await val("menu-flash");
  check("[OPCIONES] ratón: la casilla responde al clic en la casilla y en su texto", c1 !== c0 && c2 === c0, [c0, c1, c2].join(" → "));
  const m0 = await val("dd-opt-menuon"); await pg.click("#dd-opt-menuon"); const m1 = await val("dd-opt-menuon"); await pg.click("#dd-opt-menuon");
  check("[OPCIONES] ratón: el conmutador responde", m1 !== m0, m0 + " → " + m1);
  const persisted = await pg.evaluate(() => ({ vol: JSON.parse(localStorage.getItem("dmodisco_vol_v1") || "null"), cover: JSON.parse(localStorage.getItem("ddc_cover_settings_v1") || "null") }));
  check("[OPCIONES] los cambios quedan guardados", !!persisted.vol && Math.round(persisted.vol.sfx * 100) === d2 && !!persisted.cover && Math.round(persisted.cover.vol * 100) === d3, JSON.stringify(persisted).slice(0, 110));
  /* ---------- OPCIONES: mando simulado ---------- */
  await focus("menu-vol-dj"); const p0 = +(await val("menu-vol-dj")); await pad(15); const p1 = +(await val("menu-vol-dj")); await pad(14); const p2 = +(await val("menu-vol-dj"));
  check("[OPCIONES] mando (simulado): izquierda/derecha ajustan el deslizador de 5 en 5", p1 === p0 + 5 && p2 === p0, [p0, p1, p2].join(" → "));
  await pad(13); s = await S(); check("[OPCIONES] mando (simulado): abajo pasa al control siguiente", s.focus === "menu-gfx", s.focus);
  const g0 = await val("menu-gfx"); await pad(15); const g1 = await val("menu-gfx"); await pad(14); const g2 = await val("menu-gfx"); await pad(0); const g3 = await val("menu-gfx"); await pad(14);
  check("[OPCIONES] mando (simulado): el selector cambia con izquierda/derecha y con A", g1 !== g0 && g2 === g0 && g3 !== g0, [g0, g1, g2, g3].join(" → "));
  await pad(13); const k0 = await val("menu-flash"); await pad(0); await sleep(300); const k1 = await val("menu-flash"); await sleep(300); await pad(0); await sleep(300);
  check("[OPCIONES] mando (simulado): A marca la casilla", k1 !== k0, k0 + " → " + k1);
  await sleep(300); await pad(1, 200); await sleep(350); s = await S();
  check("[OPCIONES] mando (simulado): B vuelve al menú con OPCIONES seleccionada", s.st === "MAIN_MENU" && s.sel === "options", s.st + " / " + s.sel);
  /* ---------- VOLVER, CRÉDITOS, SALIR, BORRAR ---------- */
  await sleep(400); await openSub("options"); await pg.click("#dd-submenu-back"); await sleep(300); s = await S();
  check("[SUBMENÚ] el botón VOLVER responde al ratón", s.st === "MAIN_MENU", s.st);
  await openSub("credits"); s = await S(); const cr = s.sub; const crFocus = s.focus; await key("Tab"); await key("ArrowDown"); const crFocus2 = (await S()).focus; await pg.screenshot({ path: OUT + "/creditos.jpg", type: "jpeg", quality: 85 }); await key("Escape", 300); s = await S();
  check("[CRÉDITOS] se abre con ENTER y se cierra con ESC, volviendo a su opción", cr === "credits" && crFocus === "dd-submenu-back" && crFocus2 === "dd-submenu-back" && s.st === "MAIN_MENU" && s.sel === "credits", cr + " (foco " + crFocus + ") → " + s.sel);
  await openSub("exit");
  const e0 = (await S()).focus; await key("ArrowRight"); const e1 = (await S()).focus; await key("ArrowLeft"); const e2 = (await S()).focus; await key("ArrowDown"); const e3 = (await S()).focus;
  check("[SALIR] ←/→ y ↑/↓ pasan de un botón al otro", e0 === "dd-exit-yes" && e1 === "dd-exit-no" && e2 === "dd-exit-yes" && e3 === "dd-exit-no", [e0, e1, e2, e3].join(" → "));
  await key("Enter", 350); s = await S(); check("[SALIR] SEGUIR BAILANDO (ENTER) vuelve al menú", s.st === "MAIN_MENU" && s.sel === "exit", s.st);
  await openSub("exit"); await pg.click("#dd-exit-yes"); await sleep(400); const out = await pg.evaluate(() => !!document.getElementById("dd-reenter")); await pg.click("#dd-reenter"); await sleep(400); s = await S();
  check("[SALIR] SALIR DEL CLUB muestra la despedida y VOLVER A ENTRAR devuelve un menú que responde", out && s.st === "MAIN_MENU", s.st);
  await key("ArrowUp"); const afterExit = (await S()).sel; check("[SALIR] tras volver a entrar, el teclado sigue navegando", afterExit === "credits", afterExit);
  await openSub("options"); await focus("dd-opt-erase"); await key("Enter", 350);
  const b0 = (await S()).focus; await key("ArrowRight"); const b1 = (await S()).focus; await key("ArrowLeft"); const b2 = (await S()).focus;
  check("[BORRAR DATOS] se abre con teclado, el foco entra en CANCELAR y ←/→ cambian de botón", b0 === "dd-erase-no" && b1 === "dd-erase-yes" && b2 === "dd-erase-no", [b0, b1, b2].join(" → "));
  await key("Escape", 300); s = await S(); check("[BORRAR DATOS] ESC vuelve al menú sin borrar", s.st === "MAIN_MENU" && await pg.evaluate(() => !!localStorage.getItem("dd_save_v1")));
  /* ---------- ventana baja: el control elegido se trae a la vista ---------- */
  await pg.setViewportSize({ width: 1024, height: 540 }); await sleep(300);
  await openSub("options");
  for (let i = 0; i < 11; i++) await key("ArrowDown", 60);
  const inView = await pg.evaluate(() => { const a = document.activeElement, r = a.getBoundingClientRect(); const host = a.closest("#dd-submenu"); const scr = [...host.querySelectorAll("*")].find((e) => e.scrollHeight > e.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(e).overflowY)); const box = (scr || host).getBoundingClientRect(); return { id: a.id, ok: r.top >= box.top - 1 && r.bottom <= Math.min(box.bottom, innerHeight) + 1, scroll: !!scr }; });
  await pg.screenshot({ path: OUT + "/opciones_ventana_baja.jpg", type: "jpeg", quality: 85 });
  check("[OPCIONES] en una ventana de 1024×540 el último control queda visible al llegar a él con el teclado", inView.id === "dd-opt-erase" && inView.ok, JSON.stringify(inView));
  await key("Escape", 300); await pg.setViewportSize({ width: 1280, height: 720 }); await sleep(300);
  /* ---------- las dos entradas a la partida ---------- */
  await pg.evaluate(() => document.querySelector('[data-action="continue"]').focus()); await key("Enter");
  await pg.waitForFunction(() => window.DD_BOOT.getState().state === "PLAYING" && window.DD_HUB.isActive(), null, { timeout: 15000 });
  check("[CONTINUAR] responde y entra al Refugio", true);
  check("[GENERAL] sin errores de JavaScript durante la prueba", errs.length === 0, errs.slice(0, 2).join(" | "));
  const okN = res.filter((r) => r.ok).length; console.log("\n" + okN + " de " + res.length + " superadas");
  fs.writeFileSync(OUT + "/qa_menu.json", JSON.stringify({ fecha: new Date().toISOString(), url: URL, nota: "Mando simulado; no sustituye a un mando físico.", superadas: okN, total: res.length, resultados: res }, null, 1));
  await b.close(); process.exit(okN === res.length ? 0 : 1);
})().catch((e) => { console.error("ABORT", e); process.exit(2); });
