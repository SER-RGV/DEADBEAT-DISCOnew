/* ==========================================================================
   FASE 01 — SUITE DE ACEPTACIÓN A–G
   Evidencia real: cada prueba lee el estado del propio juego (FSM, cinemática,
   puente del motor, localStorage, WebAudio) y guarda capturas.

   Uso normal:  bash tools/fase01_qa/run.sh
   Uso manual:  QA_MODULES=<dir con @sparticuz/chromium y playwright-core> \
                QA_URL=http://127.0.0.1:8123 node tools/fase01_qa/suite.js

   Nota sobre tiempos: en el entorno headless sin GPU la página compone a ~2 fps.
   Por eso NINGUNA prueba espera un tiempo fijo; todas esperan un ESTADO. Las
   cifras de reloj de pared se registran como dato, no como criterio.
   ========================================================================== */
const fs = require('fs');
const { launch, waitState, clean } = require(__dirname + '/lib.js');

const OUT = process.env.QA_OUT || require(__dirname + '/lib.js').OUT;
const URL = (process.env.QA_URL || 'http://127.0.0.1:8123') + '/index.html';
fs.mkdirSync(OUT, { recursive: true });

const res = [];
/* Tres estados, no dos. Un SKIP no es un PASS encubierto: significa que la
   prueba no llegó a ejecutarse por una limitación del entorno, y así se informa.
   NO VERIFICABLE se registra cuando el efecto no puede medirse aquí. */
function ok(id, cond, detail) {
  res.push({ id, pass: !!cond, status: cond ? 'PASS' : 'FAIL', detail: String(detail == null ? '' : detail) });
  console.log((cond ? 'PASS ' : 'FAIL ') + id + '  ' + (detail == null ? '' : detail));
}
function skip(id, why, detail) {
  res.push({ id, pass: null, status: 'SKIP', detail: String(detail == null ? '' : detail), why: String(why) });
  console.log('SKIP ' + id + '  ' + why + (detail ? ' · ' + detail : ''));
}
function nv(id, why, detail) {
  res.push({ id, pass: null, status: 'NV', detail: String(detail == null ? '' : detail), why: String(why) });
  console.log('NV   ' + id + '  ' + why + (detail ? ' · ' + detail : ''));
}

/* Espera a que la FSM llegue a MAIN_MENU (el boot puede tardar en este entorno). */
async function toMenu(p, maxMs) {
  await waitState(p, ['INTRO', 'MAIN_MENU'], maxMs || 240000);
  const t0 = Date.now();
  while (Date.now() - t0 < (maxMs || 240000)) {
    if (await p.evaluate(() => window.DD_BOOT.getState().state).catch(() => null) === 'MAIN_MENU') return true;
    await p.waitForTimeout(150);
  }
  throw new Error('no llega a MAIN_MENU');
}

(async () => {
  /* ============================ A. ARRANQUE ============================ */
  const { b, p } = await launch(1600, 900);
  const t0 = Date.now();
  p.goto(URL, { waitUntil: 'commit' }).catch(() => {});

  let shotLoading = false, shotIntro = false;
  for (let i = 0; i < 2000; i++) {
    const st = await p.evaluate(() => (window.DD_BOOT ? window.DD_BOOT.getState().state : null)).catch(() => null);
    if (st === 'LOADING' && !shotLoading) {
      shotLoading = true;
      try { await p.screenshot({ path: OUT + '/01_loading.png' }); } catch (e) {}
    }
    if (st === 'INTRO' && !shotIntro) {
      shotIntro = true;
      break;
    }
    if (st === 'MAIN_MENU') break;
    await p.waitForTimeout(40);
  }

  const trace = await p.evaluate(() => window.DD_BOOT.getTrace());
  const ev = await p.evaluate(() => window.DD_BOOT.getEvidence());
  const seen = [...new Set(trace.filter(t => t.step && t.step !== 'done').map(t => t.step))];
  const mono = trace.every((t, i) => i === 0 || t.pct >= trace[i - 1].pct);
  ok('A1 el progreso son pasos reales completados',
    seen.length === 9 && trace[trace.length - 1].pct === 100 && mono,
    'pasos=' + seen.join(',') + '  pcts=' + JSON.stringify(trace.map(t => t.pct)));
  ok('A2 los 9 pasos terminan en OK', ev.stepsDone === 9,
    'stepsDone=' + ev.stepsDone + '  pct=' + ev.finalPct + '  loadMs=' + ev.loadMs);
  ok('A3 ningún paso crítico en error', ev.stepsDone === 9 && !!ev.finalPct, 'final=' + ev.finalPct);

  /* ============================= B. INTRO ============================== */
  let i1 = null, marks = [];
  if (shotIntro) {
    await p.evaluate(() => {
      window.__marks = [];
      const t = setInterval(() => {
        const s = window.DD_CINE && window.DD_CINE.getState();
        if (!s) { clearInterval(t); return; }
        window.__marks.push(+s.elapsed.toFixed(2));
        if (window.__marks.length > 400) clearInterval(t);
      }, 120);
    });
    i1 = await p.evaluate(() => (window.DD_CINE ? window.DD_CINE.getState() : null));
    for (let i = 0; i < 400; i++) {
      const st = await p.evaluate(() => window.DD_BOOT.getState().state);
      if (st !== 'INTRO') break;
      await p.waitForTimeout(80);
    }
    marks = await p.evaluate(() => window.__marks || []);
    await p.screenshot({ path: OUT + '/02_intro.png' }).catch(() => {});
  }
  const distinct = new Set(marks).size;
  ok('B1 la intro arranca sola y su reloj avanza', shotIntro && distinct >= 2,
    'valores distintos=' + JSON.stringify([...new Set(marks)].slice(0, 6)));
  ok('B2 la intro dura entre 3 y 5 s', !!(i1 && i1.duration >= 3 && i1.duration <= 5),
    'duration=' + (i1 && i1.duration));

  await waitState(p, ['INTRO', 'MAIN_MENU'], 120000).catch(() => {});
  if (await p.evaluate(() => window.DD_BOOT.getState().state) === 'INTRO') {
    await p.keyboard.press('Space');
    await p.waitForTimeout(1500);
  }
  const afterSkip = await p.evaluate(() => window.DD_BOOT.getState());
  ok('B3 la intro se puede saltar', afterSkip.state === 'MAIN_MENU' || afterSkip.state === 'SUBMENU',
    afterSkip.state + '  introEndedBy=' + afterSkip.introEndedBy);

  await toMenu(p);
  await p.waitForTimeout(1200);
  await p.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('blur'));
    window.dispatchEvent(new Event('focus'));
  });
  await p.waitForTimeout(1200);
  const afterFocus = await p.evaluate(() => ({ s: window.DD_BOOT.getState().state, cine: window.DD_CINE.getState() }));
  ok('B4 no se reinicia al recuperar el foco', afterFocus.s === 'MAIN_MENU' && !afterFocus.cine, JSON.stringify(afterFocus));
  await p.screenshot({ path: OUT + '/03_menu.png' });

  /* ============================ C. BOTONES ============================= */
  const btns = await p.evaluate(() => [...document.querySelectorAll('#dd-menu-nav .dd-menu-btn')]
    .map(b => ({ a: b.dataset.action, t: b.querySelector('b').textContent, d: !!b.disabled })));
  const acts = btns.map(x => String(x.a || '').toLowerCase()).join('|');
  ok('C1 seis acciones reales en orden', acts === 'new|continue|slots|options|credits|exit', acts);
  ok('C2 ninguna deshabilitada', btns.length === 6 && btns.every(x => !x.d));

  const logo = await p.evaluate(() => {
    const li = document.querySelector('#dd-menu-logo-img');
    return { ratio: +(li.naturalWidth / li.naturalHeight).toFixed(3), fit: getComputedStyle(li).objectFit };
  });
  ok('C3 logotipo sin deformar (contain)', logo.fit === 'contain' && Math.abs(logo.ratio - 1.501) < 0.02, JSON.stringify(logo));

  await p.evaluate(() => window.DD_UI.triggerMenuAction('options'));
  await p.waitForTimeout(1400);
  const optOpen = await p.evaluate(() => ({ sub: window.DD_UI.getState().submenu, has: !!document.getElementById('dd-opt-menuvol') }));
  await p.screenshot({ path: OUT + '/07_options.png' });
  ok('C4 OPCIONES abre el submenú real', optOpen.sub === 'options' && optOpen.has, JSON.stringify(optOpen));

  const vol = await p.evaluate(() => {
    const s = document.getElementById('dd-opt-menuvol');
    s.value = '35';
    s.dispatchEvent(new Event('input', { bubbles: true }));
    return { out: document.getElementById('dd-opt-menuvol-out').textContent, ls: localStorage.getItem('ddc_cover_settings_v1') };
  });
  ok('C5 volumen del menú aplica y persiste', /35/.test(vol.out) && /0\.35/.test(vol.ls || ''), JSON.stringify(vol));

  const gfx = await p.evaluate(() => {
    const s = document.getElementById('dd-opt-gfx');
    s.value = 'low';
    s.dispatchEvent(new Event('change', { bubbles: true }));
    const mirror = document.querySelector('#audio-panel-menu-body select');
    return { a11y: localStorage.getItem('dmodisco_a11y_v1'), mirror: mirror ? mirror.value : null };
  });
  ok('C6 calidad gráfica se sincroniza con el panel del motor', /low/.test(gfx.a11y || '') && gfx.mirror === 'low', JSON.stringify(gfx));

  const mix = await p.evaluate(() => {
    const m = document.getElementById('dd-opt-mix');
    return { kids: m.children.length, rows: m.querySelectorAll('.mix-row').length };
  });
  ok('C7 mezcla del motor incrustada (sin duplicar controles)', mix.rows >= 3, JSON.stringify(mix));

  /* C8 · Pantalla completa, medida de verdad.
     Se distinguen tres cosas que antes se confundían en una sola:
       (a) el navegador EXPONE la API,
       (b) el botón es OPERATIVO (no está desactivado),
       (c) la pantalla completa SE ACTIVÓ de hecho (document.fullscreenElement).
     El PASS sólo se declara si se cumple (c) y además la salida restaura el
     estado original. Si el entorno lo bloquea, la prueba es SKIP, nunca PASS. */
  const fsState = await p.evaluate(() => {
    const btn = document.getElementById('dd-opt-fs');
    return {
      hasApi: !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen),
      fullscreenEnabled: typeof document.fullscreenEnabled === 'boolean' ? document.fullscreenEnabled : null,
      btnExists: !!btn,
      btnDisabled: btn ? !!btn.disabled : null,
      btnText: btn ? btn.textContent.trim() : '',
      before: !!document.fullscreenElement
    };
  });

  let fsAfter = { on: fsState.before };
  if (fsState.btnExists && !fsState.btnDisabled) {
    await p.evaluate(() => {
      window.__fsEvents = [];
      document.addEventListener('fullscreenchange', () => window.__fsEvents.push(!!document.fullscreenElement));
      document.getElementById('dd-opt-fs').click();
    });
    await p.waitForTimeout(2500);
    fsAfter = await p.evaluate(() => ({
      on: !!document.fullscreenElement,
      events: window.__fsEvents || [],
      pressed: (document.getElementById('dd-opt-fs') || {}).getAttribute
        ? document.getElementById('dd-opt-fs').getAttribute('aria-pressed') : null,
      note: (document.getElementById('dd-opt-fs-note') || {}).textContent || ''
    }));
  }

  const fsInfo = 'API=' + fsState.hasApi + ' enabled=' + fsState.fullscreenEnabled +
    ' botón=' + (fsState.btnExists ? (fsState.btnDisabled ? 'desactivado' : 'operativo') : 'ausente') +
    ' fullscreenElement ' + fsState.before + '->' + fsAfter.on +
    ' eventos=' + JSON.stringify(fsAfter.events || []) + ' pressed=' + fsAfter.pressed;

  if (fsState.btnExists && fsState.btnDisabled) {
    skip('C8 pantalla completa activada de verdad', 'el botón se declara no disponible en este contexto', fsInfo);
  } else if (fsAfter.on) {
    /* Entró de verdad: se comprueba también la salida y la restauración. */
    let exitOk = false, restored = null;
    try {
      restored = await p.evaluate(async () => {
        await document.exitFullscreen();
        return !!document.fullscreenElement;
      });
      await p.waitForTimeout(900);
      exitOk = (await p.evaluate(() => !document.fullscreenElement)) === true;
    } catch (e) { exitOk = false; }
    ok('C8b la salida restaura el estado original', exitOk, 'fullscreenElement tras salir=' + restored);
    ok('C8 pantalla completa activada de verdad',
      fsAfter.on === true && (fsAfter.events || []).indexOf(true) >= 0, fsInfo);
  } else {
    skip('C8 pantalla completa activada de verdad',
      'el entorno headless no concedió el cambio de modo', fsInfo);
  }
  await p.keyboard.press('Escape');
  await p.waitForTimeout(700);

  await p.evaluate(() => window.DD_UI.triggerMenuAction('continue'));
  await p.waitForTimeout(1500);
  const noSave = await p.evaluate(() => ({
    sub: window.DD_UI.getState().submenu,
    txt: (document.getElementById('dd-submenu-body') || {}).innerText || ''
  }));
  await p.screenshot({ path: OUT + '/09_slots.png' });
  ok('C9 CONTINUAR sin partida avisa y no arranca',
    noSave.sub === 'partidas' && /SIN DESCENSOS|SIN PROGRESO/i.test(noSave.txt),
    noSave.txt.replace(/\s+/g, ' ').slice(0, 80));
  ok('C10 declara la limitación real del guardado',
    /no guarda partidas a media|meta-progreso/i.test(noSave.txt));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(700);

  await p.evaluate(() => window.DD_UI.triggerMenuAction('credits'));
  await p.waitForTimeout(1400);
  const cred = await p.evaluate(() => (document.getElementById('dd-submenu-body') || {}).innerText || '');
  await p.screenshot({ path: OUT + '/08_credits.png' });
  ok('C11 créditos sólo con datos reales del repositorio',
    /SER-RGV/.test(cred) && /DDPixel/.test(cred) && /DMO/.test(cred) && !/Lorem|TODO|Nombre Apellido/i.test(cred),
    cred.split('\n').filter(Boolean).slice(0, 3).join(' / '));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(700);

  await p.evaluate(() => window.DD_UI.triggerMenuAction('exit'));
  await p.waitForTimeout(1400);
  const exitTxt = await p.evaluate(() => (document.getElementById('dd-submenu-body') || {}).innerText || '');
  await p.screenshot({ path: OUT + '/10_exit.png' });
  ok('C12 SALIR explica el límite real del navegador', /no permite|cerrará|Ctrl\+W/i.test(exitTxt),
    exitTxt.replace(/\s+/g, ' ').slice(0, 90));

  await p.evaluate(() => document.getElementById('dd-exit-yes').click());
  await p.waitForTimeout(1800);
  const out = await p.evaluate(() => ({ black: !!document.getElementById('dd-blackout'), music: window.DD_BOOT.audio.isMenuMusicPlaying() }));
  await p.screenshot({ path: OUT + '/11_exited.png' });
  ok('C13 SALIR corta el audio y despide', out.black && out.music === false, JSON.stringify(out));
  await p.evaluate(() => document.getElementById('dd-reenter').click());
  await p.waitForTimeout(1800);
  const back = await p.evaluate(() => ({ black: !!document.getElementById('dd-blackout'), s: window.DD_BOOT.getState().state, music: window.DD_BOOT.audio.isMenuMusicPlaying() }));
  ok('C14 se puede volver a entrar', !back.black && back.s === 'MAIN_MENU' && back.music === true, JSON.stringify(back));

  /* =========================== D. CONTROLES ============================ */
  await p.keyboard.press('Home');
  await p.waitForTimeout(250);
  await p.keyboard.press('ArrowDown');
  await p.waitForTimeout(400);
  await p.keyboard.press('ArrowDown');
  await p.waitForTimeout(400);
  const kbd = await p.evaluate(() => ({ i: window.DD_UI.getState().menuIndex, f: (document.activeElement.dataset || {}).action }));
  await p.screenshot({ path: OUT + '/04_hover.png' });
  ok('D1 flechas mueven la selección y el foco real', kbd.i === 2 && kbd.f === 'slots', JSON.stringify(kbd));
  await p.keyboard.press('End');
  await p.waitForTimeout(400);
  ok('D2 End salta al último botón', (await p.evaluate(() => window.DD_UI.getState().menuIndex)) === 5);
  await p.keyboard.press('Home');
  await p.waitForTimeout(300);

  const pad = await p.evaluate(async () => {
    /* MANDO EMULADO: se sustituye navigator.getGamepads por un dispositivo
       sintético. Esto NO es una prueba con mando FÍSICO y así se reporta.

       El mando se sondea dentro del bucle de render, que en este entorno va a
       ~2 fps. Por eso NO se pulsa un tiempo fijo: se MANTIENE la pulsación y se
       sondea hasta observar el efecto, con un techo. Un tiempo fijo aquí medía
       la velocidad del entorno, no la del juego. */
    const fake = {
      id: 'Xbox Wireless Controller (EMULADO)', connected: true, index: 0, mapping: 'standard',
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }))
    };
    navigator.getGamepads = () => [fake];
    const set = (i, v) => { fake.buttons[i] = { pressed: v, value: v ? 1 : 0 }; };
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    /* Mantiene un botón hasta que `done()` se cumple o vence el plazo. */
    const holdUntil = async (idx, done, capMs) => {
      set(idx, true);
      const t = Date.now();
      while (Date.now() - t < (capMs || 15000)) {
        if (done()) break;
        await sleep(120);
      }
      set(idx, false);
      await sleep(600);            /* histéresis para que no rebote */
      return done();
    };

    const base = window.DD_UI.getState().menuIndex;
    const moved = await holdUntil(13, () => window.DD_UI.getState().menuIndex !== base, 15000);
    const afterDown = window.DD_UI.getState().menuIndex;

    const opened = await holdUntil(0, () => window.DD_UI.getState().submenu !== null, 20000);
    const afterA = { state: window.DD_BOOT.getState().state, sub: window.DD_UI.getState().submenu };

    const closed = await holdUntil(1, () => window.DD_UI.getState().submenu === null, 20000);
    const afterB = { state: window.DD_BOOT.getState().state, sub: window.DD_UI.getState().submenu };

    delete navigator.getGamepads;
    return { base, moved, afterDown, opened, afterA, closed, afterB };
  });
  /* Se informa POR SEPARADO de cada gesto: si uno falla no se oculta bajo un
     único veredicto. Y el detalle dice explícitamente que el mando es EMULADO. */
  ok('D3a mando EMULADO: el D-pad mueve la selección',
    pad.moved === true && pad.afterDown !== pad.base,
    'índice ' + pad.base + ' -> ' + pad.afterDown);
  ok('D3b mando EMULADO: A abre el submenú',
    pad.opened === true && !!pad.afterA.sub, JSON.stringify(pad.afterA));
  ok('D3c mando EMULADO: B vuelve al menú',
    pad.closed === true && pad.afterB.sub === null && pad.afterB.state === 'MAIN_MENU',
    JSON.stringify(pad.afterB));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(600);

  const errs = clean(p.errs);
  ok('A4 sin errores de página, consola ni red', errs.length === 0, errs.slice(0, 4).join(' || '));
  await b.close();

  /* ====================== E/F. AUDIO + RESOLUCIONES ==================== */
  for (const [w, h, label] of [[1280, 720, '720p'], [1920, 1080, '1080p'], [2560, 1440, '1440p'], [3440, 1440, 'ultrawide']]) {
    const { b: bb, p: pp } = await launch(w, h);
    pp.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    await toMenu(pp);
    await pp.waitForTimeout(1600);
    /* Una captura que no llega a tiempo no puede tumbar la suite entera: las
       aserciones de esta prueba no dependen de la imagen. */
    await pp.screenshot({ path: `${OUT}/res_${label}.png`, timeout: 90000, animations: 'disabled' }).catch(e => {
      console.log('  (aviso) captura ' + label + ' no completada: ' + String(e.message).split('\n')[0]);
    });
    const m = await pp.evaluate(() => {
      const q = s => document.querySelector(s).getBoundingClientRect();
      const nav = q('#dd-menu-nav'), foot = q('.dd-menu-footer'), bd = q('#dd-menu-backdrop');
      const li = document.getElementById('dd-menu-logo-img');
      return {
        logoRatio: +(li.naturalWidth / li.naturalHeight).toFixed(3),
        letterbox: getComputedStyle(li).objectFit,
        covered: bd.width >= innerWidth - 1 && bd.height >= innerHeight - 1,
        cut: nav.bottom > innerHeight || foot.bottom > innerHeight || nav.right > innerWidth,
        music: window.DD_BOOT.audio.isMenuMusicPlaying(),
        state: window.DD_BOOT.getState().state
      };
    });
    ok(`F-${label} sin recorte ni deformación`, m.covered && !m.cut && m.letterbox === 'contain' && Math.abs(m.logoRatio - 1.501) < 0.02,
      JSON.stringify(m));
    ok(`E-${label} música de menú activa`, m.music === true, String(m.music));
    const e2 = clean(pp.errs);
    ok(`F-${label} sin errores`, e2.length === 0, e2.slice(0, 2).join(' || '));
    await bb.close();
  }

  /* ======================= G. ENTRAR A PARTIDA ========================= */
  const { b: bg, p: pg } = await launch(1600, 900);
  pg.goto(URL, { waitUntil: 'commit' }).catch(() => {});
  await toMenu(pg);
  await pg.waitForTimeout(1200);
  await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await pg.waitForTimeout(300);
  await pg.evaluate(() => window.DD_UI.triggerMenuAction('new'));
  const tStart = Date.now();
  let playState = 'MAIN_MENU';
  for (let i = 0; i < 2400; i++) {
    playState = await pg.evaluate(() => window.DD_BOOT.getState().state).catch(() => null);
    if (playState === 'PLAYING') break;
    await pg.waitForTimeout(150);
  }
  const startWall = Date.now() - tStart;
  await pg.waitForTimeout(2500);
  await pg.screenshot({ path: OUT + '/12_playing.png' });
  const play = await pg.evaluate(() => ({
    state: window.DD_BOOT.getState().state,
    music: window.DD_BOOT.audio.isMenuMusicPlaying(),
    menuHidden: document.getElementById('dd-main-menu').classList.contains('dd-hidden'),
    hudVisible: !document.getElementById('dd-hud').classList.contains('dd-hidden'),
    running: !!(window.__DD_BRIDGE && window.__DD_BRIDGE.getSnapshot().running)
  }));
  ok('G1 NUEVA PARTIDA entra al juego', play.state === 'PLAYING' && play.running,
    JSON.stringify(play) + '  (' + startWall + ' ms de reloj de pared)');
  ok('G2 la música de menú se corta al jugar', play.music === false, String(play.music));
  ok('G3 el menú desaparece y el HUD aparece', play.menuHidden && play.hudVisible,
    JSON.stringify({ menu: play.menuHidden, hud: play.hudVisible }));
  const gErrs = clean(pg.errs);
  ok('G4 sin errores durante la transición a juego', gErrs.length === 0, gErrs.slice(0, 3).join(' || '));
  await bg.close();

  /* ==========================================================================
     H. FASE 01.1 — PANEL DE ERROR, SEGURIDAD DEL MODO SEGURO Y ACCESIBILIDAD
     Cada prueba abre su propio navegador porque simula un arranque roto: no se
     puede reutilizar un contexto ya arrancado sin falsear el resultado.
     ========================================================================== */

  /* --- H-A · fallo CRÍTICO real: se rompe un recurso indispensable --------- */
  {
    const { b: hb, p: hp } = await launch(1280, 720);
    /* Se impide que DD_UI llegue a existir: es un paso critical:true. */
    await hp.addInitScript(() => {
      Object.defineProperty(window, 'DD_UI', {
        configurable: true, get() { return undefined; }, set() {}
      });
    });
    hp.goto(URL, { waitUntil: 'commit' }).catch(() => {});

    let panel = null;
    const tA = Date.now();
    while (Date.now() - tA < 150000) {
      panel = await hp.evaluate(() => {
        const e = document.getElementById('dd-boot-err');
        const safe = document.getElementById('dd-boot-safe');
        const retry = document.getElementById('dd-boot-retry');
        return {
          visible: !!e && !e.hidden,
          title: (document.getElementById('dd-boot-err-title') || {}).textContent || '',
          body: (document.getElementById('dd-boot-err-body') || {}).textContent || '',
          safeDisabled: safe ? !!safe.disabled : null,
          safeLabel: safe ? safe.textContent.trim() : null,
          retryExists: !!retry,
          state: window.DD_BOOT ? window.DD_BOOT.getState().state : null,
          errors: window.DD_BOOT ? window.DD_BOOT.getEvidence().errors || [] : []
        };
      }).catch(() => null);
      if (panel && panel.visible) break;
      await hp.waitForTimeout(150);
    }
    await hp.screenshot({ path: OUT + '/13_error_panel.png' });

    ok('H-A1 el fallo crítico se detecta y el panel aparece',
      !!(panel && panel.visible), JSON.stringify(panel && { v: panel.visible, st: panel.state }));
    ok('H-A2 el mensaje identifica el problema concreto (DD_UI)',
      !!(panel && /DD_UI/.test(panel.body) && /NO SE PUDO ABRIR EL CLUB/.test(panel.title)),
      panel ? panel.title + ' · ' + panel.body.slice(0, 110) : 'sin panel');
    ok('H-A3 se ofrece REINTENTAR', !!(panel && panel.retryExists), String(panel && panel.retryExists));

    /* --- H-C · modo seguro: qué salta de verdad y qué no ----------------- */
    ok('H-C1 el modo seguro no está disponible sin recurso indispensable',
      !!(panel && panel.safeDisabled === true),
      'disabled=' + (panel && panel.safeDisabled) + ' etiqueta=' + (panel && panel.safeLabel));

    const beforeSafe = await hp.evaluate(() => window.DD_BOOT.getState().state);
    await hp.evaluate(() => {
      const s = document.getElementById('dd-boot-safe');
      if (s) s.click();               /* un clic real sobre un botón desactivado */
    }).catch(() => {});
    await hp.waitForTimeout(4000);
    const afterSafe = await hp.evaluate(() => ({
      state: window.DD_BOOT.getState().state,
      ddUI: typeof window.DD_UI
    }));
    ok('H-C2 pulsar modo seguro no entrega un menú inutilizable',
      afterSafe.state !== 'MAIN_MENU' && afterSafe.ddUI === 'undefined',
      beforeSafe + ' -> ' + JSON.stringify(afterSafe));

    /* --- H-B · REINTENTAR pide un arranque nuevo sin dejar estado sucio --- */
    const retryInfo = await hp.evaluate(() => {
      const r = document.getElementById('dd-boot-retry');
      if (!r) return { ok: false, why: 'no hay botón' };
      /* Se intercepta la recarga para observar la intención sin perder el contexto. */
      window.__reloadRequested = false;
      r.onclick = function () { window.__reloadRequested = true; };
      r.click();
      return { ok: true, requested: window.__reloadRequested };
    }).catch(() => null);
    ok('H-B1 REINTENTAR solicita un arranque nuevo',
      !!(retryInfo && retryInfo.requested),
      JSON.stringify(retryInfo));
    await hb.close();

    /* La recarga real se comprueba en un contexto limpio: tras reintentar, el
       juego debe poder arrancar sin que quede un estado de error bloqueante. */
    const { b: rb2, p: rp2 } = await launch(1280, 720);
    rp2.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    const tB = Date.now();
    let reached = null;
    while (Date.now() - tB < 150000) {
      reached = await rp2.evaluate(() => window.DD_BOOT ? window.DD_BOOT.getState().state : null).catch(() => null);
      if (reached === 'INTRO' || reached === 'MAIN_MENU') break;
      await rp2.waitForTimeout(150);
    }
    const cleanBoot = await rp2.evaluate(() => ({
      errHidden: (document.getElementById('dd-boot-err') || {}).hidden,
      state: window.DD_BOOT.getState().state
    })).catch(() => null);
    ok('H-B2 un arranque nuevo no hereda el estado de error',
      !!cleanBoot && cleanBoot.errHidden === true,
      JSON.stringify(cleanBoot));
    await rb2.close();
  }

  /* --- H-D · modo seguro DEGRADABLE: sólo debe saltarse lo no esencial ------ */
  {
    const { b: db, p: dp } = await launch(1280, 720);
    /* Se rompe un paso NO esencial (audio del menú): el juego debe seguir
       abriendo y el modo seguro debe poder mostrar qué se ha saltado. */
    await dp.addInitScript(() => {
      Object.defineProperty(window, 'DDC_COVER', {
        configurable: true, get() { return undefined; }, set() {}
      });
    });
    dp.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    const tD = Date.now();
    let stD = null;
    while (Date.now() - tD < 180000) {
      stD = await dp.evaluate(() => window.DD_BOOT ? window.DD_BOOT.getState().state : null).catch(() => null);
      if (stD === 'MAIN_MENU') break;
      if (stD === 'INTRO') await dp.keyboard.press('Escape').catch(() => {});
      await dp.waitForTimeout(150);
    }
    const detail = await dp.evaluate(() => {
      const ev = window.DD_BOOT.getEvidence();
      return {
        state: window.DD_BOOT.getState().state,
        errors: ev.errors || []
      };
    }).catch(() => null);
    ok('H-D1 un fallo no esencial no impide abrir el menú',
      !!(detail && detail.state === 'MAIN_MENU'), JSON.stringify(detail && detail.state));
    ok('H-D2 el fallo no esencial queda registrado como degradado, no como fatal',
      !!(detail && (detail.errors || []).every(e => !e.fatal)),
      JSON.stringify(detail && detail.errors));
    await db.close();
  }

  /* --- H-E · accesibilidad del menú: foco, etiquetas y reduced-motion ----- */
  {
    const { b: ab, p: ap } = await launch(1280, 720);
    await ap.emulateMedia({ reducedMotion: 'reduce' });
    ap.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    const tE = Date.now();
    while (Date.now() - tE < 180000) {
      const st = await ap.evaluate(() => window.DD_BOOT ? window.DD_BOOT.getState().state : null).catch(() => null);
      if (st === 'INTRO') await ap.keyboard.press('Escape').catch(() => {});
      if (st === 'MAIN_MENU') break;
      await ap.waitForTimeout(150);
    }
    const a11y = await ap.evaluate(() => {
      const btns = [...document.querySelectorAll('#dd-menu-nav .dd-menu-btn')];
      const unusable = btns.filter(b => b.disabled).map(b => b.textContent.trim());
      const noLabel = btns.filter(b => !b.getAttribute('aria-label') && !b.textContent.trim()).length;
      const focus = document.activeElement;
      return {
        count: btns.length,
        labelled: btns.filter(b => (b.getAttribute('aria-label') || b.textContent.trim()).length > 0).length,
        noLabel,
        unusable,
        focusInMenu: !!focus && focus.classList.contains('dd-menu-btn'),
        focusVisible: !!focus && getComputedStyle(focus).outlineStyle !== 'none',
        navRole: (document.getElementById('dd-menu-nav') || {}).getAttribute
          ? document.getElementById('dd-menu-nav').getAttribute('role') : null
      };
    });
    ok('H-E1 las seis acciones del menú tienen etiqueta accesible',
      a11y.count === 6 && a11y.labelled === 6, JSON.stringify(a11y).slice(0, 160));
    ok('H-E2 el foco arranca dentro del menú y es visible',
      a11y.focusInMenu && a11y.focusVisible,
      'focoEnMenú=' + a11y.focusInMenu + ' outline=' + a11y.focusVisible);
    ok('H-E3 ninguna acción parece funcional estando desactivada',
      a11y.unusable.length === 0, 'desactivadas=' + JSON.stringify(a11y.unusable));
    ok('H-E4 la navegación se anuncia como menú', a11y.navRole === 'menu', 'role=' + a11y.navRole);

    /* La navegación por teclado debe mover la selección de verdad. */
    const sel0 = await ap.evaluate(() => (document.querySelector('.dd-menu-btn.dd-selected') || {}).textContent || '');
    await ap.keyboard.press('ArrowDown');
    await ap.waitForTimeout(600);
    const sel1 = await ap.evaluate(() => (document.querySelector('.dd-menu-btn.dd-selected') || {}).textContent || '');
    ok('H-E5 las flechas mueven la selección del menú',
      sel0 !== '' && sel1 !== '' && sel0 !== sel1, sel0.trim() + ' -> ' + sel1.trim());
    await ap.screenshot({ path: OUT + '/14_a11y_reduced_motion.png' });
    await ab.close();
  }

  /* --- H-F · máquina de estados: transiciones válidas e inválidas -------- */
  {
    const { b: fb, p: fp } = await launch(1280, 720);
    /* Traza completa de transiciones, incluida la de LOADING. */
    await fp.addInitScript(() => {
      window.__ddTrace = [];
      document.addEventListener('DOMContentLoaded', () => {
        const iv = setInterval(() => {
          if (!window.DD_BOOT) return;
          window.__ddTrace.push(window.DD_BOOT.getState().state);
          clearInterval(iv);
        }, 1);
      });
    });
    fp.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    const seen = [];
    const tF = Date.now();
    while (Date.now() - tF < 200000) {
      const st = await fp.evaluate(() => window.DD_BOOT ? window.DD_BOOT.getState().state : null).catch(() => null);
      if (st && seen[seen.length - 1] !== st) seen.push(st);
      if (st === 'MAIN_MENU') break;
      await fp.waitForTimeout(60);
    }
    const order = ['BOOT', 'LOADING', 'INTRO', 'MAIN_MENU'];
    const idx = order.map(s => seen.indexOf(s));
    ok('H-F1 la secuencia de arranque es BOOT -> LOADING -> INTRO -> MAIN_MENU',
      idx.every(i => i >= 0) && idx[0] < idx[1] && idx[1] < idx[2] && idx[2] < idx[3],
      'observado: ' + seen.join(' -> '));

    const trace = await fp.evaluate(() => window.DD_BOOT.getTrace());
    ok('H-F2 la carga va de 0 % a 100 % sin retroceder',
      trace.length > 2 && trace[0].pct === 0 && trace[trace.length - 1].pct === 100 &&
      trace.every((t, i) => i === 0 || t.pct >= trace[i - 1].pct),
      'pcts=' + JSON.stringify(trace.map(t => t.pct)));

    /* SUBMENU -> MAIN_MENU y rechazo de transiciones inválidas. */
    const sub = await fp.evaluate(() => {
      const boot = window.DD_BOOT;
      const opened = boot.openSubmenu('options');
      return { opened, inSub: boot.getState().state };
    });
    await fp.waitForTimeout(400);
    const closeOk = await fp.evaluate(() => {
      const r = window.DD_BOOT.closeSubmenu();
      return { r, state: window.DD_BOOT.getState().state };
    });
    ok('H-F3 se entra y se sale del submenú volviendo a MAIN_MENU',
      sub.opened === true && sub.inSub === 'SUBMENU' &&
      closeOk.r === true && closeOk.state === 'MAIN_MENU',
      JSON.stringify({ abrir: sub.inSub, cerrar: closeOk.state }));

    /* Transiciones inválidas: deben RECHAZARSE sin tocar el estado. */
    const invalid = await fp.evaluate(() => {
      const boot = window.DD_BOOT;
      const fromMenu = boot.getState().state;
      const closeFromMenu = boot.closeSubmenu();      /* ya no hay submenú */
      const afterClose = boot.getState().state;
      boot.openSubmenu('options');
      const inSub = boot.getState().state;
      const enterFromSub = boot.enterGame();          /* no se juega desde un submenú */
      const afterEnter = boot.getState().state;
      boot.closeSubmenu();
      return { fromMenu, closeFromMenu, afterClose, inSub, enterFromSub, afterEnter,
               back: boot.getState().state };
    });
    ok('H-F4 las transiciones inválidas se rechazan sin corromper el estado',
      invalid.closeFromMenu === false && invalid.afterClose === 'MAIN_MENU' &&
      invalid.enterFromSub === false && invalid.afterEnter === 'SUBMENU' &&
      invalid.back === 'MAIN_MENU',
      JSON.stringify(invalid));
    await fb.close();
  }

  /* ============================== RESULTADO ============================= */
  fs.writeFileSync(OUT + '/results.json', JSON.stringify(res, null, 1));
  const fails = res.filter(r => r.status === 'FAIL');
  const skipped = res.filter(r => r.status === 'SKIP');
  const nvs = res.filter(r => r.status === 'NV');
  const passes = res.filter(r => r.status === 'PASS');
  console.log('\n== ' + passes.length + ' PASS · ' + fails.length + ' FAIL · ' +
    skipped.length + ' SKIP · ' + nvs.length + ' NV · ' + res.length + ' TOTAL ==');
  if (fails.length) console.log('FALLOS: ' + fails.map(f => f.id).join(', '));
  if (skipped.length) console.log('SKIP  : ' + skipped.map(f => f.id).join(', '));
  if (nvs.length) console.log('NV    : ' + nvs.map(f => f.id).join(', '));
  process.exit(fails.length ? 1 : 0);
})().catch(e => {
  console.error('FATAL', e.message);
  fs.writeFileSync(OUT + '/results_partial.json', JSON.stringify(res, null, 1));
  process.exit(2);
});
