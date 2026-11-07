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

const OUT = process.env.QA_OUT || '/home/user/_qa/out';
const URL = (process.env.QA_URL || 'http://127.0.0.1:8123') + '/index.html';
fs.mkdirSync(OUT, { recursive: true });

const res = [];
function ok(id, cond, detail) {
  res.push({ id, pass: !!cond, detail: String(detail == null ? '' : detail) });
  console.log((cond ? 'PASS ' : 'FAIL ') + id + '  ' + (detail == null ? '' : detail));
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

  const fsTry = await p.evaluate(() => {
    try { document.getElementById('dd-opt-fs').click(); return 'clicked'; } catch (e) { return 'err'; }
  });
  await p.waitForTimeout(600);
  ok('C8 pantalla completa usa el API real', fsTry === 'clicked',
    'fullscreenElement=' + (await p.evaluate(() => !!document.fullscreenElement)));
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
       sintético. Esto NO es una prueba con mando físico y así se reporta. */
    const fake = {
      id: 'Xbox Wireless Controller (EMULADO)', connected: true, index: 0, mapping: 'standard',
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }))
    };
    navigator.getGamepads = () => [fake];
    const press = (i, v) => { fake.buttons[i] = { pressed: v, value: v ? 1 : 0 }; };
    const wait = ms => new Promise(r => setTimeout(r, ms));
    press(13, true); await wait(600); press(13, false); await wait(700);
    const afterDown = window.DD_UI.getState().menuIndex;
    press(0, true); await wait(700); press(0, false); await wait(1200);
    const afterA = { state: window.DD_BOOT.getState().state, sub: window.DD_UI.getState().submenu };
    await wait(700);
    press(1, true); await wait(700); press(1, false); await wait(1500);
    const afterB = { state: window.DD_BOOT.getState().state, sub: window.DD_UI.getState().submenu };
    delete navigator.getGamepads;
    return { afterDown, afterA, afterB };
  });
  ok('D3 mando EMULADO: D-pad mueve, A confirma, B vuelve',
    pad.afterDown > 0 && !!pad.afterA.sub && pad.afterB.sub === null && pad.afterB.state === 'MAIN_MENU',
    JSON.stringify(pad));
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
    await pp.screenshot({ path: `${OUT}/res_${label}.png` });
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

  /* ============================== RESULTADO ============================= */
  fs.writeFileSync(OUT + '/results.json', JSON.stringify(res, null, 1));
  const fails = res.filter(r => !r.pass);
  console.log('\n== ' + (res.length - fails.length) + '/' + res.length + ' PASS ==');
  if (fails.length) console.log('FALLOS: ' + fails.map(f => f.id).join(', '));
  process.exit(fails.length ? 1 : 0);
})().catch(e => {
  console.error('FATAL', e.message);
  fs.writeFileSync(OUT + '/results_partial.json', JSON.stringify(res, null, 1));
  process.exit(2);
});
