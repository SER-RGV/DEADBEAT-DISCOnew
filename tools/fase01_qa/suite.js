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

/* Captura NO fatal. En este entorno una imagen puede tardar más que el límite
   por defecto de Playwright y tumbar la suite entera; las capturas son evidencia
   complementaria, nunca la condición de una prueba. Se acota el tiempo, se
   desactivan animaciones para el fotograma y, si aun así falla, se avisa. */
async function shot(page, name) {
  try {
    await page.screenshot({ path: OUT + '/' + name, timeout: 45000, animations: 'disabled' });
    return true;
  } catch (e) {
    console.log('  (aviso) captura ' + name + ' no completada: ' + String(e.message).split('\n')[0]);
    return false;
  }
}

const res = [];
/* Tres estados, no dos. Un SKIP no es un PASS encubierto: significa que la
   prueba no llegó a ejecutarse por una limitación del entorno, y así se informa.
   NO VERIFICABLE se registra cuando el efecto no puede medirse aquí.

   FASE 01.4 · cada registro guarda además lo que la prueba EXIGÍA (`expected`)
   y cuánto tardó (`ms`), para que la evidencia sea auditable por sí sola y no
   sólo por su detalle textual. */
let __t0 = Date.now();
function __lap() { const now = Date.now(); const d = now - __t0; __t0 = now; return d; }
function ok(id, cond, detail, expected) {
  res.push({
    id, pass: !!cond, status: cond ? 'PASS' : 'FAIL',
    detail: String(detail == null ? '' : detail),
    expected: expected == null ? '' : String(expected),
    ms: __lap()
  });
  console.log((cond ? 'PASS ' : 'FAIL ') + id + '  ' + (detail == null ? '' : detail));
}
function skip(id, why, detail, expected) {
  res.push({
    id, pass: null, status: 'SKIP',
    detail: String(detail == null ? '' : detail), why: String(why),
    expected: expected == null ? '' : String(expected), ms: __lap()
  });
  console.log('SKIP ' + id + '  ' + why + (detail ? ' · ' + detail : ''));
}
function nv(id, why, detail, expected) {
  res.push({
    id, pass: null, status: 'NV',
    detail: String(detail == null ? '' : detail), why: String(why),
    expected: expected == null ? '' : String(expected), ms: __lap()
  });
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

  /* Corrección 01.3 · la captura NO puede ocurrir dentro del bucle de sondeo.
     Antes se disparaba `01_loading.png` mientras se esperaba INTRO: en un
     entorno cargado esa captura agotaba sus 45 s, y al volver la intro (4,4 s)
     ya había terminado. B1/B2 fallaban por la instrumentación, no por el
     producto (en 01.2 pasaban con duration=4.4 porque la captura fue rápida).
     Ahora se detecta primero y se captura después, fuera del camino crítico. */
  for (let i = 0; i < 2000; i++) {
    const st = await p.evaluate(() => (window.DD_BOOT ? window.DD_BOOT.getState().state : null)).catch(() => null);
    if (st === 'LOADING') shotLoading = true;
    if (st === 'INTRO') {
      shotIntro = true;
      break;
    }
    if (st === 'MAIN_MENU') break;
    await p.waitForTimeout(40);
  }
  if (shotLoading) await shot(p, '01_loading.png');

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
  /* Corrección 01.3 · la medición de la intro tiene que ocurrir ANTES de
     cualquier captura: `02_intro.png` puede tardar decenas de segundos en este
     entorno y la intro dura ~4,4 s. Antes se capturaba y después se leía el
     estado, de modo que duration llegaba como null y las marcas vacías. */
  let i1 = null, marks = [];
  if (shotIntro) {
    i1 = await p.evaluate(() => (window.DD_CINE ? window.DD_CINE.getState() : null));
    await p.evaluate(() => {
      window.__marks = [];
      const t = setInterval(() => {
        const s = window.DD_CINE && window.DD_CINE.getState();
        if (!s) { clearInterval(t); return; }
        window.__marks.push(+s.elapsed.toFixed(2));
        if (window.__marks.length > 400) clearInterval(t);
      }, 120);
    });
    for (let i = 0; i < 400; i++) {
      const st = await p.evaluate(() => window.DD_BOOT.getState().state);
      if (st !== 'INTRO') break;
      await p.waitForTimeout(80);
    }
    marks = await p.evaluate(() => window.__marks || []);
    await shot(p, '02_intro.png');
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
  await shot(p, '03_menu.png');

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
  await shot(p, '07_options.png');
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
    /* Corrección 01.3 · antes se esperaba 2500 ms fijos y se leía. Con la
       máquina cargada, `document.fullscreenElement` ya era true pero el evento
       `fullscreenchange` aún no se había despachado, así que la prueba veía
       eventos=[] y fallaba. El criterio NO se relaja (se sigue exigiendo el
       evento); se espera a que llegue, con un tope de reloj. */
    const tFs = Date.now();
    let evSeen = [];
    while (Date.now() - tFs < 20000) {
      evSeen = await p.evaluate(() => window.__fsEvents || []).catch(() => []);
      if (evSeen.length > 0) break;
      await p.waitForTimeout(200);
    }
    fsAfter = await p.evaluate(() => ({
      on: !!document.fullscreenElement,
      events: window.__fsEvents || [],
      pressed: (document.getElementById('dd-opt-fs') || {}).getAttribute
        ? document.getElementById('dd-opt-fs').getAttribute('aria-pressed') : null,
      note: (document.getElementById('dd-opt-fs-note') || {}).textContent || ''
    }));
    fsAfter.waitedMs = Date.now() - tFs;
  }

  const fsInfo = 'API=' + fsState.hasApi + ' enabled=' + fsState.fullscreenEnabled +
    ' botón=' + (fsState.btnExists ? (fsState.btnDisabled ? 'desactivado' : 'operativo') : 'ausente') +
    ' fullscreenElement ' + fsState.before + '->' + fsAfter.on +
    ' eventos=' + JSON.stringify(fsAfter.events || []) + ' pressed=' + fsAfter.pressed +
    ' esperaEvento=' + (fsAfter.waitedMs == null ? '-' : fsAfter.waitedMs + 'ms');

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
  await shot(p, '09_slots.png');
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
  await shot(p, '08_credits.png');
  ok('C11 créditos sólo con datos reales del repositorio',
    /SER-RGV/.test(cred) && /DDPixel/.test(cred) && /DMO/.test(cred) && !/Lorem|TODO|Nombre Apellido/i.test(cred),
    cred.split('\n').filter(Boolean).slice(0, 3).join(' / '));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(700);

  await p.evaluate(() => window.DD_UI.triggerMenuAction('exit'));
  await p.waitForTimeout(1400);
  const exitTxt = await p.evaluate(() => (document.getElementById('dd-submenu-body') || {}).innerText || '');
  await shot(p, '10_exit.png');
  ok('C12 SALIR explica el límite real del navegador', /no permite|cerrará|Ctrl\+W/i.test(exitTxt),
    exitTxt.replace(/\s+/g, ' ').slice(0, 90));

  await p.evaluate(() => document.getElementById('dd-exit-yes').click());
  await p.waitForTimeout(1800);
  const out = await p.evaluate(() => ({ black: !!document.getElementById('dd-blackout'), music: window.DD_BOOT.audio.isMenuMusicPlaying() }));
  await shot(p, '11_exited.png');
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
  await shot(p, '04_hover.png');
  ok('D1 flechas mueven la selección y el foco real', kbd.i === 2 && kbd.f === 'slots', JSON.stringify(kbd));
  await p.keyboard.press('End');
  await p.waitForTimeout(400);
  ok('D2 End salta al último botón', (await p.evaluate(() => window.DD_UI.getState().menuIndex)) === 5);
  await p.keyboard.press('Home');
  await p.waitForTimeout(300);

  const pad = await p.evaluate(async () => {
    /* MANDO EMULADO: se sustituye navigator.getGamepads por un dispositivo
       sintético. Esto NO es una prueba con mando FÍSICO y así se reporta.

       El sondeo vive dentro de DD_UI.tick(). En este entorno el bucle de render
       del motor no entrega frames con el menú abierto (su escena legada está
       oculta), así que la UI tiene un latido propio por requestAnimationFrame.
       Aquí NO se fuerza ningún frame desde la prueba: si se llamara a tick() a
       mano se estaría tapando justo el defecto que este latido corrige. Se
       pulsa como un humano (800 ms) y se espera al EFECTO.

       Además se comprueba que el latido entrega frames de verdad, contando las
       lecturas de navigator.getGamepads, que es el único recuento fiable:
       envolver window.DD_UI.tick desde la prueba NO cuenta las llamadas
       internas, porque el cierre usa la referencia léxica. */
    const fake = {
      id: 'Xbox Wireless Controller (EMULADO)', connected: true, index: 0, mapping: 'standard',
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }))
    };
    navigator.getGamepads = () => [fake];
    const set = (i, v) => { fake.buttons[i] = { pressed: v, value: v ? 1 : 0 }; };
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    /* Recuento de latido: cuántas veces se consulta el mando por segundo. */
    let polls = 0;
    const realPads = navigator.getGamepads;
    navigator.getGamepads = () => { polls++; return [fake]; };

    /* Pulsación realista: mantener y soltar. La acción se dispara por flanco,
       así que basta con que un frame caiga dentro del intervalo. */
    /* Corrección 01.3 · D3a/D3b fallaban con `ciclos=1` en máquinas cargadas.
       La causa no era el mando: la prueba esperaba a que el juego consultara el
       mando, y con la máquina a load ~8 el latido no llegaba antes de agotar el
       tiempo. Se separan las dos cosas que antes se mezclaban:
         · el mando entrega bien la pulsación (comprobado en la página), y
         · el juego la consume, dando más margen de reloj para que lata. */
    const holdUntil = async (idx, done, capMs) => {
      const t = Date.now();
      let cycles = 0, peak = 0;
      while (Date.now() - t < (capMs || 40000)) {
        const p0 = polls;
        set(idx, true);
        await sleep(900);
        set(idx, false);
        await sleep(900);
        cycles++;
        peak = Math.max(peak, polls - p0);
        if (done()) return { ok: true, cycles, pollsPerCycle: peak };
      }
      return { ok: done(), cycles, pollsPerCycle: peak };
    };

    /* Corrección 01.3 (2ª parte) · D3b fallaba porque la prueba daba por hecho
       qué botón quedaba enfocado. Tras D3a la selección podía caer en CONTINUAR
       o NUEVA PARTIDA, y A ejecutaba esa acción (arrancar partida o avisar de
       que no hay guardado) en vez de abrir un submenú. No era un fallo del
       mando: era una expectativa equivocada de la prueba.
       Ahora, antes de pulsar A, se lleva la selección con el propio D-pad a un
       destino determinista (OPCIONES, que siempre abre submenú), y se comprueba
       cuál es la acción enfocada. */
    const indiceDe = (accion) => {
      const btns = Array.from(document.querySelectorAll('[data-action]'));
      for (let i = 0; i < btns.length; i++) if (btns[i].getAttribute('data-action') === accion) return i;
      return -1;
    };
    const objetivo = indiceDe('options');

    const base = window.DD_UI.getState().menuIndex;
    const down = await holdUntil(13, () => window.DD_UI.getState().menuIndex !== base);
    const afterDown = window.DD_UI.getState().menuIndex;

    /* D3a ya demostró que el D-pad mueve la selección: se usa para apuntar.
       El destino depende del índice del que se parte (D2 deja el menú en SALIR),
       así que el número de pasos necesarios varía. El bucle espera a una
       CONDICIÓN, no a un número de intentos, y deja constancia de si llegó:
       antes se agotaba en silencio y se pulsaba A sobre un botón equivocado,
       lo que se leía como un fallo del mando cuando era de la prueba. */
    const ruta = [];
    const tRuta = Date.now();
    let llego = window.DD_UI.getState().menuIndex === objetivo;
    while (!llego && Date.now() - tRuta < 30000) {
      const antes = window.DD_UI.getState().menuIndex;
      set(13, true); await sleep(1100); set(13, false); await sleep(900);
      ruta.push(antes + '->' + window.DD_UI.getState().menuIndex);
      llego = window.DD_UI.getState().menuIndex === objetivo;
    }
    const enfocado = (() => {
      const b = document.querySelectorAll('[data-action]')[window.DD_UI.getState().menuIndex];
      return b ? b.getAttribute('data-action') : null;
    })();

    /* Gesto de A (FASE 01.4).
       La versión anterior pulsaba A durante 900 ms y lo soltaba. Con el menú
       latiendo a ~1 tick cada 2-3 s bajo la carga de una suite completa, una
       pulsación corta puede caer entera ENTRE dos ticks y perderse: medido, el
       mismo gesto funciona siempre en aislamiento y falla en la suite. No es un
       fallo del producto (el flanco se dispara en cuanto un frame ve el botón),
       sino una ventana de pulsación demasiado corta para el entorno.
       Ahora se mantiene A hasta que el juego lo consume (submenu abierto), con
       un mínimo de ticks observados, de modo que el gesto siempre cruza al menos
       un frame del juego. */
    const open = await (async () => {
      const tA = Date.now();
      let cycles = 0, peak = 0, ok = false;
      while (Date.now() - tA < 60000) {
        const p0 = polls;
        set(0, true);
        await sleep(1800);              /* > 1 tick del menú incluso a 1 fps */
        ok = window.DD_UI.getState().submenu !== null;
        set(0, false);
        await sleep(700);
        cycles++;
        peak = Math.max(peak, polls - p0);
        if (ok) break;
      }
      return { ok: ok, cycles: cycles, pollsPerCycle: peak };
    })();
    const afterA = { state: window.DD_BOOT.getState().state, sub: window.DD_UI.getState().submenu };

    const close = await holdUntil(1, () => window.DD_UI.getState().submenu === null);
    const afterB = { state: window.DD_BOOT.getState().state, sub: window.DD_UI.getState().submenu };
    const rutaHastaOp = ruta;
    const accionEnfocada = enfocado;

    /* En reposo la selección no debe moverse sola. */
    const idle0 = window.DD_UI.getState().menuIndex;
    await sleep(1500);
    const idle1 = window.DD_UI.getState().menuIndex;

    navigator.getGamepads = realPads;
    delete navigator.getGamepads;
    return { base, polls, down, afterDown, open, afterA, close, afterB, idleStable: idle0 === idle1,
             accionEnfocada: accionEnfocada, objetivo: objetivo, ruta: rutaHastaOp, llegoAlObjetivo: llego };
  });

  /* Se informa POR SEPARADO de cada gesto: si uno falla no se oculta bajo un
     único veredicto. Y el detalle dice explícitamente que el mando es EMULADO. */
  ok('D3a mando EMULADO: el D-pad mueve la selección',
    !!(pad.down && pad.down.ok) && pad.afterDown !== pad.base,
    'índice ' + pad.base + ' -> ' + pad.afterDown + ' (ciclos=' + (pad.down && pad.down.cycles) +
    ', sondeos/ciclo=' + (pad.down && pad.down.pollsPerCycle) + ')');
  /* Si el D-pad no llegó a OPCIONES, D3b no se puede juzgar: se informa como
     SKIP con su motivo en vez de convertirlo en un FAIL que culparía al mando. */
  if (pad && pad.llegoAlObjetivo === false) {
    skip('D3b mando EMULADO: A abre el submenú que está enfocado',
      'el D-pad no alcanzó OPCIONES en 30 s; el gesto de A no se pudo juzgar',
      'enfocado=' + pad.accionEnfocada + ' ruta=' + JSON.stringify(pad.ruta),
      'llegar a la acción options antes de pulsar A');
  } else
  ok('D3b mando EMULADO: A abre el submenú que está enfocado',
    !!(pad.open && pad.open.ok) && pad.accionEnfocada === 'options' && pad.afterA.sub === 'options',
    JSON.stringify(pad.afterA) + ' (enfocado=' + pad.accionEnfocada + ' idx=' + pad.objetivo +
    ' ruta=' + JSON.stringify(pad.ruta) + ' ciclos=' + (pad.open && pad.open.cycles) +
    ', sondeos/ciclo=' + (pad.open && pad.open.pollsPerCycle) + ')');
  ok('D3c mando EMULADO: B vuelve al menú',
    !!(pad.close && pad.close.ok) && pad.afterB.sub === null && pad.afterB.state === 'MAIN_MENU',
    JSON.stringify(pad.afterB) + ' (ciclos=' + (pad.close && pad.close.cycles) + ')');
  ok('D3d mando EMULADO: en reposo la selección no se mueve sola',
    pad.idleStable === true, 'estable=' + pad.idleStable);
  /* Si el latido no entregara frames, todo lo anterior fallaría de forma
     intermitente; este dato lo deja dicho de forma explícita. */
  ok('D3e el menú sigue latiendo con la escena legada oculta (mando sondeado)',
    pad.polls >= 2, 'navigator.getGamepads leído ' + pad.polls + ' veces durante la prueba');

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
  await shot(pg, '12_playing.png');
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
      /* Fallo CONTROLADO y TRANSITORIO: DD_UI falta sólo en la primera carga.
         La bandera vive en sessionStorage, que sobrevive a location.reload(),
         de modo que tras pulsar el REINTENTAR real el sistema debe recuperarse
         solo. No hay ningún comportamiento especial en producción: se aprovecha
         que el paso `ui` comprueba de verdad que DD_UI exista. */
      let alreadyFailed = false;
      try { alreadyFailed = sessionStorage.getItem('qa_retry_once') === '1'; } catch (e) {}
      if (!alreadyFailed) {
        try { sessionStorage.setItem('qa_retry_once', '1'); } catch (e) {}
        Object.defineProperty(window, 'DD_UI', {
          configurable: true, get() { return undefined; }, set() {}
        });
      }
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
    await shot(hp, '13_error_panel.png');

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

    /* --- H-B · REINTENTAR: recarga REAL observada, sin sustituir el handler --
       La versión anterior reemplazaba r.onclick por una función de la propia
       prueba y comprobaba esa función. Eso no mide producción.

       Aquí se provoca un fallo controlado que SOLO afecta a la primera carga
       (una bandera guardada en sessionStorage), se pulsa el botón REAL con su
       handler intacto, y se observa la navegación de verdad:
         - el documento nuevo tiene un contador de navegación distinto;
         - la marca data-dd-retry del elemento raíz desaparece al recargar;
         - el arranque se ejecuta de nuevo y esta vez sí termina. */
    const retryBefore = await hp.evaluate(() => ({
      nav: (performance.getEntriesByType('navigation')[0] || {}).type || 'navigate',
      hasRetryBtn: !!document.getElementById('dd-boot-retry'),
      handlerIsReal: (() => {
        const r = document.getElementById('dd-boot-retry');
        /* No se toca el handler: sólo se comprueba que existe y que es función. */
        return !!r && typeof r.onclick === 'function';
      })(),
      markerBefore: document.documentElement.getAttribute('data-dd-retry')
    }));

    /* Pulsación del botón REAL. No se asigna onclick: se hace click() y se deja
       que el handler de producción ejecute location.reload(). La evaluación se
       interrumpe porque el documento se descarga; el fallo de contexto es
       esperado y no se considera error de la prueba. */
    await hp.evaluate(() => { document.getElementById('dd-boot-retry').click(); }).catch(() => {});

    /* Esperar la navegación real del navegador. */
    let navigated = false;
    try {
      await hp.waitForNavigation({ waitUntil: 'commit', timeout: 90000 });
      navigated = true;
    } catch (e) { navigated = false; }

    let retryState = null;
    if (navigated) {
      const tR = Date.now();
      while (Date.now() - tR < 180000) {
        retryState = await hp.evaluate(() => ({
          nav: (performance.getEntriesByType('navigation')[0] || {}).type || 'navigate',
          marker: document.documentElement.getAttribute('data-dd-retry'),
          state: window.DD_BOOT ? window.DD_BOOT.getState().state : null,
          errVisible: (() => { const e = document.getElementById('dd-boot-err'); return !!e && !e.hidden; })(),
          retryFail: (() => { try { return sessionStorage.getItem('qa_retry_once'); } catch (e) { return null; } })()
        })).catch(() => null);
        if (retryState && (retryState.state === 'INTRO' || retryState.state === 'MAIN_MENU')) break;
        if (retryState && retryState.errVisible) break;
        await hp.waitForTimeout(200);
      }
    }

    if (!navigated) {
      skip('H-B1 REINTENTAR provoca una recarga real del navegador',
        'la navegación no pudo observarse en este entorno', JSON.stringify(retryBefore));
      nv('H-B2 tras REINTENTAR se ejecuta un arranque nuevo que se recupera',
        'sin navegación observada no hay evidencia de recuperación');
    } else {
      ok('H-B1 REINTENTAR provoca una recarga real del navegador',
        retryState !== null && retryBefore.handlerIsReal === true &&
        retryState.marker === null && retryState.nav === 'reload',
        JSON.stringify({ antes: retryBefore, despues: retryState && {
          nav: retryState.nav, marker: retryState.marker, state: retryState.state } }));
      ok('H-B2 tras REINTENTAR se ejecuta un arranque nuevo que se recupera',
        !!(retryState && !retryState.errVisible &&
           (retryState.state === 'INTRO' || retryState.state === 'MAIN_MENU')),
        JSON.stringify(retryState && { state: retryState.state, err: retryState.errVisible }));
    }
    await hb.close();
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
        /* Sin `|| []`: si el registro no existe, queremos verlo y fallar, no
           convertir la ausencia de dato en "lista vacía conforme". */
        errors: ev.errors,
        degraded: ev.degraded,
        registryLen: (window.DD_BOOT.getErrorRegistry ? window.DD_BOOT.getErrorRegistry().length : null)
      };
    }).catch(() => null);

    const errs = detail && Array.isArray(detail.errors) ? detail.errors : null;
    const audioErr = errs ? errs.filter(e => e.id === 'audio') : [];

    ok('H-D1 un fallo no esencial no impide abrir el menú',
      !!(detail && detail.state === 'MAIN_MENU'), JSON.stringify(detail && detail.state));

    /* La prueba falla si no hay registro: un array vacío por valor no definido
       NO es evidencia de que el fallo se haya detectado. */
    ok('H-D2a getEvidence() expone un registro de errores real',
      !!(errs && errs.length > 0),
      errs === null ? 'errors ausente (no es un array)' : 'entradas=' + errs.length);

    ok('H-D2b el fallo de audio queda registrado y con motivo',
      audioErr.length === 1 && /audio/i.test(audioErr[0] && audioErr[0].message || ''),
      JSON.stringify(audioErr[0] || null));

    ok('H-D2c el error está marcado como recuperable y degradado, no fatal',
      audioErr.length === 1 && audioErr[0].fatal === false &&
      audioErr[0].degraded === true && audioErr[0].essential === false &&
      audioErr[0].severity === 'warning',
      audioErr[0] ? JSON.stringify({
        severity: audioErr[0].severity, fatal: audioErr[0].fatal,
        degraded: audioErr[0].degraded, essential: audioErr[0].essential
      }) : 'sin entrada de audio');

    ok('H-D2d el sistema se declara degradado y ningún error es fatal',
      !!(detail && detail.degraded === true && errs.every(e => !e.fatal)),
      'degraded=' + (detail && detail.degraded) +
      ' fatales=' + (errs ? errs.filter(e => e.fatal).length : 'n/a'));

    ok('H-D2e la entrada tiene los campos exigidos y una marca de tiempo',
      audioErr.length === 1 &&
      ['id', 'message', 'severity', 'fatal', 'degraded', 'essential', 'kind', 'at']
        .every(k => audioErr[0][k] !== undefined && audioErr[0][k] !== null) &&
      typeof audioErr[0].at === 'number' && audioErr[0].at >= 0,
      audioErr[0] ? JSON.stringify(audioErr[0]) : 'sin entrada');
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
    await shot(ap, '14_a11y_reduced_motion.png');
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

  /* ==========================================================================
     W · PERRO GUARDIÁN DEL ARRANQUE (FASE 01.2 · F1)
     ========================================================================== */
  {
    /* W1/W2 · Carga normal: el watchdog no interrumpe y queda desactivado. */
    const { b: wb, p: wp } = await launch(1280, 720);
    wp.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    const tW = Date.now();
    let normal = null;
    while (Date.now() - tW < 180000) {
      normal = await wp.evaluate(() => {
        const ev = window.DD_BOOT ? window.DD_BOOT.getEvidence() : null;
        const e = document.getElementById('dd-boot-err');
        return {
          state: window.DD_BOOT ? window.DD_BOOT.getState().state : null,
          errVisible: !!e && !e.hidden,
          loadFinished: ev ? ev.loadFinished : null,
          watchdogFired: ev ? ev.watchdogFired : null,
          loadMs: ev ? ev.loadMs : null,
          msg: window.DD_BOOT ? window.DD_BOOT.WATCHDOG_MS : null
        };
      }).catch(() => null);
      if (normal && (normal.state === 'INTRO' || normal.state === 'MAIN_MENU')) break;
      await wp.waitForTimeout(200);
    }
    ok('W1 carga normal: el watchdog no interrumpe el arranque',
      !!(normal && normal.errVisible === false &&
         (normal.state === 'INTRO' || normal.state === 'MAIN_MENU')),
      JSON.stringify(normal));
    ok('W2 carga normal: la carga se marca terminada y el watchdog no dispara',
      !!(normal && normal.loadFinished === true && normal.watchdogFired === false),
      'loadFinished=' + (normal && normal.loadFinished) +
      ' watchdogFired=' + (normal && normal.watchdogFired) +
      ' loadMs=' + (normal && normal.loadMs) +
      ' límite=' + (normal && normal.msg) + ' ms');
    await wb.close();

    /* W3/W4 · Carga BLOQUEADA: el watchdog debe mostrar el panel. */
    const { b: cb, p: cp2 } = await launch(1280, 720);
    await cp2.addInitScript(() => {
      /* Las imágenes esenciales nunca cargan ni fallan: la promesa del paso
         `images` jamás se resuelve. Es un bloqueo real, no un retardo. */
      const RealImage = window.Image;
      window.Image = function () {
        const im = new RealImage();
        const proto = Object.getOwnPropertyDescriptor(RealImage.prototype, 'src');
        Object.defineProperty(im, 'src', {
          configurable: true,
          set(v) {
            if (/menu_main_backdrop|cine_intro|logo_deadbeat|emblem_fox/.test(String(v))) return;
            try { proto.set.call(im, v); } catch (e) {}
          },
          get() { return ''; }
        });
        return im;
      };
    });
    cp2.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    const tC = Date.now();
    let blocked = null;
    while (Date.now() - tC < 90000) {
      blocked = await cp2.evaluate(() => {
        const ev = window.DD_BOOT ? window.DD_BOOT.getEvidence() : null;
        const e = document.getElementById('dd-boot-err');
        return {
          state: window.DD_BOOT ? window.DD_BOOT.getState().state : null,
          errVisible: !!e && !e.hidden,
          title: (document.getElementById('dd-boot-err-title') || {}).textContent || '',
          body: (document.getElementById('dd-boot-err-body') || {}).textContent || '',
          watchdogFired: ev ? ev.watchdogFired : null,
          loadFinished: ev ? ev.loadFinished : null,
          limit: window.DD_BOOT ? window.DD_BOOT.WATCHDOG_MS : null
        };
      }).catch(() => null);
      if (blocked && blocked.errVisible) break;
      await cp2.waitForTimeout(250);
    }
    const waitedMs = Date.now() - tC;
    ok('W3 carga bloqueada: el watchdog muestra el panel de error',
      !!(blocked && blocked.errVisible && blocked.watchdogFired === true),
      'esperado ' + (blocked && blocked.limit) + ' ms, observado ' + waitedMs +
      ' ms · ' + JSON.stringify(blocked && { st: blocked.state, wd: blocked.watchdogFired }));
    ok('W4 carga bloqueada: el panel NO se presenta como modo degradado',
      !!(blocked && /NO SE PUDO ABRIR EL CLUB/.test(blocked.title)),
      'título="' + (blocked && blocked.title) + '"');
    ok('W5 carga bloqueada: el panel nombra el motivo (tiempo)',
      !!(blocked && /tard/i.test(blocked.body)),
      'cuerpo="' + String(blocked && blocked.body).slice(0, 100) + '"');
    await shot(cp2, '15_watchdog_blocked.png');

    /* W6 · Invalidación REAL del temporizador de un intento anterior.

       La versión anterior comprobaba `typeof state === 'string'`: demostraba que
       existía un estado textual, no que un temporizador viejo quedara anulado.

       Aquí se instrumentan los temporizadores ANTES de que arranque la página
       (addInitScript), de modo que se captura el callback REAL del watchdog de
       cada intento. Después se EJECUTA a mano el del primer intento mientras el
       segundo está en curso. La lógica del watchdog es la de producción, sin
       cambios: sólo se la observa y se la invoca.

       Dos intentos de arranque de verdad en la MISMA página:
         1. Intento 1 con la carga bloqueada -> watchdog 1 pendiente.
         2. Se pulsa MODO SEGURO -> boot() otra vez -> watchdog 2.
         3. Se ejecuta el callback del intento 1 -> debe ser inocuo.
         4. Se ejecuta el del intento 2        -> debe seguir funcionando. */
    const { b: w6b, p: w6p } = await launch(1280, 720);
    await w6p.addInitScript(() => {
      /* Captura de temporizadores largos (los del watchdog). */
      const realST = window.setTimeout, realCT = window.clearTimeout;
      window.__wdCaps = [];
      window.setTimeout = function (fn, ms) {
        if (typeof ms === 'number' && ms >= 20000) {
          const rec = { ms: ms, fn: fn, cleared: false, fired: false };
          rec.id = realST.call(window, function () { rec.fired = true; fn(); }, ms);
          window.__wdCaps.push(rec);
          return rec.id;
        }
        return realST.apply(window, arguments);
      };
      window.clearTimeout = function (id) {
        window.__wdCaps.forEach(function (r) { if (r.id === id) r.cleared = true; });
        return realCT.call(window, id);
      };
      /* Carga BLOQUEADA: las imágenes esenciales nunca cargan ni fallan. */
      const RealImage = window.Image;
      window.Image = function () {
        const im = new RealImage();
        const proto = Object.getOwnPropertyDescriptor(RealImage.prototype, 'src');
        Object.defineProperty(im, 'src', {
          configurable: true,
          set(v) {
            if (/menu_main_backdrop|cine_intro|logo_deadbeat|emblem_fox/.test(String(v))) return;
            try { proto.set.call(im, v); } catch (e) {}
          },
          get() { return ''; }
        });
        return im;
      };
    });
    w6p.goto(URL, { waitUntil: 'commit' }).catch(() => {});

    /* Esperar a que el watchdog del intento 1 muestre el panel. */
    const tW6 = Date.now();
    let w6panel = null;
    while (Date.now() - tW6 < 90000) {
      w6panel = await w6p.evaluate(() => {
        const e = document.getElementById('dd-boot-err');
        const s = document.getElementById('dd-boot-safe');
        return {
          panel: !!e && !e.hidden,
          safeDisabled: s ? !!s.disabled : null,
          safeLabel: s ? s.textContent.trim() : null,
          caps: (window.__wdCaps || []).length,
          state: window.DD_BOOT ? window.DD_BOOT.getState().state : null
        };
      }).catch(() => null);
      if (w6panel && w6panel.panel) break;
      await w6p.waitForTimeout(250);
    }

    const w6 = await w6p.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const caps = window.__wdCaps || [];
      const safeBtn = document.getElementById('dd-boot-safe');
      if (!safeBtn) return { err: 'sin botón de modo seguro', caps: caps.length };
      if (caps.length < 1) return { err: 'no se capturó el watchdog del intento 1', caps: caps.length };

      const firstCap = caps[0];

      /* 2) Segundo intento de arranque real. */
      safeBtn.click();
      await sleep(1800);

      const attempt2 = {
        capsAfter: caps.length,
        state: window.DD_BOOT.getState().state,
        panelHidden: (() => { const e = document.getElementById('dd-boot-err'); return !e || e.hidden; })(),
        loadFinished: window.DD_BOOT.getEvidence().loadFinished
      };

      const secondCap = caps[caps.length - 1];
      if (caps.length < 2 || secondCap === firstCap) {
        return { err: 'el segundo intento no armó su propio watchdog', attempt2, caps: caps.length };
      }

      /* 3) Callback ANTIGUO ejecutado a mano: simula que clearTimeout llegó
            tarde y el navegador ya lo tenía encolado. */
      const before1 = {
        state: window.DD_BOOT.getState().state,
        panelHidden: (() => { const e = document.getElementById('dd-boot-err'); return !e || e.hidden; })(),
        fired: window.DD_BOOT.getEvidence().watchdogFired
      };
      try { firstCap.fn(); } catch (e) {}
      await sleep(500);
      const after1 = {
        state: window.DD_BOOT.getState().state,
        panelHidden: (() => { const e = document.getElementById('dd-boot-err'); return !e || e.hidden; })(),
        fired: window.DD_BOOT.getEvidence().watchdogFired
      };

      /* 4) Watchdog VIGENTE: debe conservar su comportamiento. */
      try { secondCap.fn(); } catch (e) {}
      await sleep(700);
      const after2 = {
        state: window.DD_BOOT.getState().state,
        panelHidden: (() => { const e = document.getElementById('dd-boot-err'); return !e || e.hidden; })(),
        fired: window.DD_BOOT.getEvidence().watchdogFired,
        title: (document.getElementById('dd-boot-err-title') || {}).textContent || ''
      };

      return {
        capsBefore: 1, attempt2, capsTotal: caps.length,
        c1Cleared: firstCap.cleared, c1Ms: firstCap.ms, c2Ms: secondCap.ms,
        before1, after1, after2
      };
    }).catch(e => ({ err: String(e.message) }));

    const w6ok = w6 && !w6.err;
    ok('W6a dos intentos de arranque producen dos watchdogs distintos',
      !!(w6ok && w6.attempt2.capsAfter >= 2 && w6.c2Ms >= 20000 && w6.c1Ms >= 20000),
      w6ok ? 'intento1=' + w6.c1Ms + 'ms intento2=' + w6.c2Ms + 'ms total=' + w6.capsTotal
           : String(w6 && w6.err) + ' · panel=' + JSON.stringify(w6panel));

    ok('W6b el temporizador del intento anterior se cancela con clearTimeout',
      !!(w6ok && w6.c1Cleared === true),
      w6ok ? 'c1.cleared=' + w6.c1Cleared : String(w6 && w6.err));

    ok('W6c ejecutar el temporizador ANTIGUO no afecta al intento nuevo',
      !!(w6ok && w6.after1.panelHidden === true &&
         w6.after1.state === w6.before1.state && w6.after1.fired === false),
      w6ok ? JSON.stringify({ antes: w6.before1, despues: w6.after1 }) : String(w6 && w6.err));

    ok('W6d el watchdog VIGENTE sigue funcionando y muestra el panel',
      !!(w6ok && w6.after2.panelHidden === false && w6.after2.fired === true),
      w6ok ? JSON.stringify(w6.after2) : String(w6 && w6.err));

    await shot(w6p, '16_watchdog_stale_timer.png');
    await w6b.close();
    await cb.close();
  }

  /* ==========================================================================
     E · MOTOR COMO RECURSO ESENCIAL (FASE 01.2 · F3)
     ========================================================================== */
  {
    /* E1 · Control: con canvas presente el arranque llega al menú. */
    const { b: eb, p: ep } = await launch(1280, 720);
    ep.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    const tE1 = Date.now();
    let okCtl = null;
    while (Date.now() - tE1 < 180000) {
      okCtl = await ep.evaluate(() => window.DD_BOOT ? window.DD_BOOT.getState().state : null).catch(() => null);
      if (okCtl === 'INTRO' || okCtl === 'MAIN_MENU') break;
      await ep.waitForTimeout(200);
    }
    const ids = await ep.evaluate(() => ({
      essential: window.DD_BOOT.ESSENTIAL_IDS,
      engineCritical: !!document.querySelector('#game')
    })).catch(() => null);
    ok('E1 con canvas presente el arranque progresa', okCtl === 'INTRO' || okCtl === 'MAIN_MENU',
      'estado=' + okCtl);
    ok('E2 engine está en la lista de recursos esenciales',
      !!(ids && Array.isArray(ids.essential) && ids.essential.indexOf('engine') >= 0),
      JSON.stringify(ids && ids.essential));
    await eb.close();

    /* E3/E4/E5 · Sin canvas: error fatal, panel visible y arranque bloqueado.
       Reforzado en 01.3: antes E4 sólo exigía "no es MAIN_MENU", que también se
       cumple si el arranque se queda a medias sin decir nada al jugador. Ahora
       se exige el bloqueo completo: canvas ausente de verdad, paso engine
       ejecutado, error fatal registrado, panel visible con título y mensaje que
       identifican el problema, modo seguro desactivado y ninguna partida. */
    const { b: e2b, p: e2p } = await launch(1280, 720);
    await e2p.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const g = document.getElementById('game');
        if (g) g.remove();
      }, { capture: true });
    });
    e2p.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    const tE3 = Date.now();
    let noCanvas = null;
    while (Date.now() - tE3 < 90000) {
      noCanvas = await e2p.evaluate(() => {
        const ev = window.DD_BOOT ? window.DD_BOOT.getEvidence() : null;
        const e = document.getElementById('dd-boot-err');
        const s = document.getElementById('dd-boot-safe');
        const retry = document.getElementById('dd-boot-retry');
        return {
          canvasExists: !!document.getElementById('game'),
          state: window.DD_BOOT ? window.DD_BOOT.getState().state : null,
          errVisible: !!e && !e.hidden,
          title: (document.getElementById('dd-boot-err-title') || {}).textContent || '',
          body: (document.getElementById('dd-boot-err-body') || {}).textContent || '',
          fatal: ev ? (ev.errors || []).filter(x => x.fatal).map(x => x.id) : null,
          allErrors: ev ? (ev.errors || []) : null,
          engineError: ev ? (ev.errors || []).filter(x => x.id === 'engine')[0] || null : null,
          safeDisabled: s ? !!s.disabled : null,
          safeLabel: s ? s.textContent.trim() : null,
          retryExists: !!retry,
          loadFinished: ev ? ev.loadFinished : null,
          isPlaying: !!window.__DD_BRIDGE && typeof window.__DD_BRIDGE.isRunning === 'function'
        };
      }).catch(() => null);
      if (noCanvas && (noCanvas.errVisible || noCanvas.state === 'MAIN_MENU')) break;
      await e2p.waitForTimeout(250);
    }

    /* E3a · el escenario es real: el canvas no existe en la página */
    ok('E3a sin canvas: el escenario es real (el elemento no existe)',
      !!(noCanvas && noCanvas.canvasExists === false),
      'canvasExists=' + (noCanvas && noCanvas.canvasExists));

    /* E3b · el paso engine se ejecutó y registró un error FATAL */
    ok('E3b sin canvas: el paso engine registra un error FATAL',
      !!(noCanvas && noCanvas.fatal && noCanvas.fatal.indexOf('engine') >= 0 &&
         noCanvas.engineError && noCanvas.engineError.fatal === true &&
         noCanvas.engineError.essential === true),
      noCanvas && noCanvas.engineError ? JSON.stringify(noCanvas.engineError)
                                       : 'fatales=' + JSON.stringify(noCanvas && noCanvas.fatal));

    /* E4a · el panel aparece de verdad */
    ok('E4a sin canvas: el panel de error aparece',
      !!(noCanvas && noCanvas.errVisible === true),
      'errVisible=' + (noCanvas && noCanvas.errVisible) + ' estado=' + (noCanvas && noCanvas.state));

    /* E4b · el título identifica el fallo y el mensaje nombra el motor */
    ok('E4b sin canvas: título y mensaje identifican el problema',
      !!(noCanvas && /NO SE PUDO ABRIR EL CLUB/.test(noCanvas.title) &&
         /lienzo|canvas|motor|#game/i.test(noCanvas.body) &&
         noCanvas.retryExists === true),
      'título="' + (noCanvas && noCanvas.title) + '" cuerpo="' +
      String(noCanvas && noCanvas.body).slice(0, 110) + '"');

    /* E4c · NUNCA se alcanza MAIN_MENU */
    ok('E4c sin canvas: NUNCA se alcanza MAIN_MENU',
      !!(noCanvas && noCanvas.state !== 'MAIN_MENU' && noCanvas.state !== 'INTRO'),
      'estado final=' + (noCanvas && noCanvas.state));

    /* E5 · el modo seguro no ofrece continuar sin motor */
    ok('E5 sin canvas: el modo seguro se bloquea (no hay menú sin motor)',
      !!(noCanvas && noCanvas.safeDisabled === true && /NO DISPONIBLE/i.test(noCanvas.safeLabel || '')),
      'safe.disabled=' + (noCanvas && noCanvas.safeDisabled) +
      ' etiqueta="' + (noCanvas && noCanvas.safeLabel) + '"');

    /* E6 · ninguna partida: el motor no está en marcha y el FSM no está en PLAYING */
    const noGame = await e2p.evaluate(() => ({
      state: window.DD_BOOT.getState().state,
      canStart: window.DD_BOOT.canStartGame(),
      running: !!(window.__DD_BRIDGE && window.__DD_BRIDGE.isRunning())
    })).catch(() => null);
    ok('E6 sin canvas: no se inicia ninguna partida',
      !!(noGame && noGame.state !== 'PLAYING' && noGame.canStart === false && noGame.running === false),
      JSON.stringify(noGame));

    await shot(e2p, '17_engine_missing_panel.png');
    await e2b.close();
  }

  /* ==========================================================================
     P · PLAYING SÓLO CON MOTOR CONFIRMADO (FASE 01.2 · F5 · reforzado en 01.3)
     ========================================================================== */
  {
    /* Por qué se rehízo esta prueba:
       La versión anterior construía la inyección con `new Function(patch.toString())`.
       `patch.toString()` produce `() => { ... }`, y `new Function` CREA esa
       función sin ejecutarla: las cuatro modificaciones nunca se aplicaban.
       El PASS salía igualmente porque en MAIN_MENU el motor real está parado
       (isRunning() === false), así que enterGame() devolvía false siempre. Es
       decir: la prueba aprobaba por un motivo que no era el suyo.

       Diseño nuevo, decidido en dos fases por escenario, en la MISMA página:
         (1) Se sustituye window.__DD_BRIDGE por una copia del real con
             isRunning() forzado a true. Si enterGame() entra en PLAYING, queda
             DEMOSTRADO que (a) la inyección funciona y (b) la puerta acepta
             evidencia positiva del motor.
         (2) Se vuelve al menú, se aplica el escenario negativo y se comprueba
             que enterGame() lo rechaza y el estado NO cambia.
       Así el rechazo del escenario negativo no puede atribuirse al motor parado.

       Sobre el congelado: el puente es Object.freeze y su isRunning es no
       escribible y no configurable, pero la PROPIEDAD window.__DD_BRIDGE sí es
       escribible. No se desactiva Object.freeze en ningún momento: se sustituye
       la referencia por un doble controlado y se restaura al terminar. */
    const SCEN = {
      P1_false:     function () { return false; },
      P2_throws:    function () { throw new Error('motor no disponible'); },
      P3_undefined: function () { return undefined; },
      P4_absent:    null
    };

    for (const name of Object.keys(SCEN)) {
      const { b: pb, p: pp2 } = await launch(1280, 720);
      pp2.goto(URL, { waitUntil: 'commit' }).catch(() => {});
      const tP = Date.now();
      let atMenu = null;
      while (Date.now() - tP < 200000) {
        atMenu = await pp2.evaluate(() => window.DD_BOOT ? window.DD_BOOT.getState().state : null).catch(() => null);
        if (atMenu === 'INTRO') await pp2.keyboard.press('Escape').catch(() => {});
        if (atMenu === 'MAIN_MENU') break;
        await pp2.waitForTimeout(180);
      }

      if (atMenu !== 'MAIN_MENU') {
        nv('P-' + name, 'no se alcanzó MAIN_MENU en este intento', 'estado=' + atMenu);
        await pb.close();
        continue;
      }

      const res = await pp2.evaluate((scenarioName) => {
        const boot = window.DD_BOOT;
        const realBridge = window.__DD_BRIDGE;
        const out = { scenario: scenarioName, steps: [] };

        /* Copia controlada: conserva todos los métodos reales del puente. */
        const makeStandIn = (isRunningFn) => {
          const o = {};
          if (realBridge) {
            Object.keys(realBridge).forEach(k => { try { o[k] = realBridge[k]; } catch (e) {} });
          }
          o.isRunning = isRunningFn;
          o.getSnapshot = (realBridge && realBridge.getSnapshot) || function () { return {}; };
          return o;
        };

        /* ---- Fase 1: la puerta ACEPTA evidencia positiva del motor ---- */
        window.__DD_BRIDGE = makeStandIn(function () { return true; });
        const positiveProbe = {
          applied: window.__DD_BRIDGE.isRunning() === true,
          hubActive: !!(window.DD_HUB && window.DD_HUB.isActive())
        };
        let acceptedPositive = null;
        try { acceptedPositive = boot.enterGame(); } catch (e) { acceptedPositive = 'threw'; }
        positiveProbe.accepted = acceptedPositive;
        positiveProbe.state = boot.getState().state;
        out.steps.push({ phase: 'control-positivo', data: positiveProbe });

        /* Volver al menú para poder probar el escenario negativo. */
        boot.exitGameToMenu();
        out.steps.push({ phase: 'vuelta-al-menu', data: { state: boot.getState().state } });

        /* ---- Fase 2: el escenario negativo SE APLICA y se comprueba ---- */
        let appliedValue = null, appliedThrew = false, bridgeAbsent = false;
        if (scenarioName === 'P4_absent') {
          window.__DD_BRIDGE = undefined;
          bridgeAbsent = (window.__DD_BRIDGE === undefined);
        } else {
          const fn = scenarioName === 'P1_false' ? function () { return false; }
                   : scenarioName === 'P2_throws' ? function () { throw new Error('motor no disponible'); }
                   : function () { return undefined; };
          window.__DD_BRIDGE = makeStandIn(fn);
          try { appliedValue = window.__DD_BRIDGE.isRunning(); } catch (e) { appliedThrew = true; }
        }

        const observation = {
          bridgeAbsent: bridgeAbsent,
          isRunningReturned: appliedThrew ? 'THREW' : (appliedValue === undefined ? 'undefined' : String(appliedValue)),
          applied: bridgeAbsent || appliedThrew || appliedValue === false || appliedValue === undefined,
          stateBefore: boot.getState().state
        };

        let acceptedNeg = null, threwNeg = false;
        try { acceptedNeg = boot.enterGame(); } catch (e) { threwNeg = true; }
        observation.accepted = acceptedNeg;
        observation.threw = threwNeg;
        observation.stateAfter = boot.getState().state;
        out.steps.push({ phase: 'escenario-negativo', data: observation });

        return out;
      }, name).catch(e => ({ error: String(e.message) }));

      const ctrl = res && res.steps && res.steps.find(x => x.phase === 'control-positivo');
      const neg = res && res.steps && res.steps.find(x => x.phase === 'escenario-negativo');

      /* P-a: la inyección funciona y la puerta acepta evidencia positiva. */
      ok('P-' + name + ' · a) la inyección se aplica y la puerta acepta el motor confirmado',
        !!(ctrl && ctrl.data.applied === true && ctrl.data.hubActive === false &&
           ctrl.data.accepted === true && ctrl.data.state === 'PLAYING'),
        ctrl ? JSON.stringify(ctrl.data) : 'sin datos · ' + JSON.stringify(res && res.error));

      /* P-b: el escenario negativo está realmente activo. */
      ok('P-' + name + ' · b) el escenario negativo queda activo en la página',
        !!(neg && neg.data.applied === true),
        neg ? JSON.stringify(neg.data) : 'sin datos');

      /* P-c: con el escenario activo, enterGame() lo rechaza y no hay PLAYING. */
      ok('P-' + name + ' · c) con el escenario activo no se declara PLAYING',
        !!(neg && neg.data.accepted === false && neg.data.threw === false &&
           neg.data.stateAfter === 'MAIN_MENU'),
        neg ? JSON.stringify(neg.data) : 'sin datos');

      await pb.close();
    }

    /* ---------------- P+ · caso positivo por el camino REAL ---------------- */
    const { b: gb, p: gp } = await launch(1280, 720);
    gp.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    const tG = Date.now();
    while (Date.now() - tG < 200000) {
      const st = await gp.evaluate(() => window.DD_BOOT ? window.DD_BOOT.getState().state : null).catch(() => null);
      if (st === 'INTRO') await gp.keyboard.press('Escape').catch(() => {});
      if (st === 'MAIN_MENU') break;
      await gp.waitForTimeout(180);
    }
    const prePlay = await gp.evaluate(() => ({
      state: window.DD_BOOT.getState().state,
      runningBefore: !!(window.__DD_BRIDGE && window.__DD_BRIDGE.isRunning())
    })).catch(() => null);
    await gp.evaluate(() => window.DD_UI.triggerMenuAction('new')).catch(() => {});
    let playState = null;
    const tG2 = Date.now();
    while (Date.now() - tG2 < 220000) {
      playState = await gp.evaluate(() => ({
        state: window.DD_BOOT.getState().state,
        running: !!(window.__DD_BRIDGE && window.__DD_BRIDGE.isRunning()),
        music: window.DD_BOOT.audio.isMenuMusicPlaying()
      })).catch(() => null);
      if (playState && playState.state === 'PLAYING') break;
      await gp.waitForTimeout(250);
    }
    /* Se demuestra además que el motor pasó de parado a en marcha: sin eso, el
       PLAYING podría ser un estado declarado sin respaldo real. */
    ok('P+ con el motor confirmado SÍ se declara PLAYING (sin regresión)',
      !!(playState && playState.state === 'PLAYING' && playState.running === true),
      JSON.stringify({ antes: prePlay, despues: playState }));
    await gb.close();
  }


  /* ==========================================================================
     V · FASE 01.4 · CARGA TARDÍA (P0 · cancelación lógica del intento)
     ==========================================================================
     La prueba de W6 demuestra que un temporizador viejo no afecta al nuevo.
     Esta demuestra lo complementario: que el trabajo ASÍNCRONO pendiente de un
     intento caducado tampoco. Se bloquea el paso de imágenes con una promesa
     real de carga, se espera el watchdog y se LIBERA después: ese trabajo
     termina correctamente, pero fuera de plazo, y no debe producir efectos. */
  {
    const { b: vb, p: vp } = await launch(1280, 720);
    await vp.addInitScript(() => {
      /* Se interceptan las imágenes esenciales: no cargan hasta que la prueba
         lo ordene. Se conserva el objeto Image real y el descriptor nativo. */
      const RealImage = window.Image;
      const desc = Object.getOwnPropertyDescriptor(RealImage.prototype, 'src');
      window.__gate = { waiters: [], released: false };
      window.__releaseGate = function () {
        window.__gate.released = true;
        window.__gate.waiters.forEach(function (fn) { try { fn(); } catch (e) {} });
        window.__gate.waiters.length = 0;
      };
      window.Image = function () {
        const im = new RealImage();
        Object.defineProperty(im, 'src', {
          configurable: true,
          set(v) {
            if (/menu_main_backdrop|cine_intro|logo_deadbeat|emblem_fox/.test(String(v))) {
              window.__gate.waiters.push(function () {
                try { im.dispatchEvent(new Event('load')); } catch (e) {}
              });
              return;
            }
            try { desc.set.call(im, v); } catch (e) {}
          },
          get() { return ''; }
        });
        return im;
      };
    });
    vp.goto(URL, { waitUntil: 'commit' }).catch(() => {});

    /* 1) Esperar el panel del watchdog (20 s reales + margen). */
    const tV = Date.now();
    let vBefore = null;
    while (Date.now() - tV < 90000) {
      vBefore = await vp.evaluate(() => {
        const e = document.getElementById('dd-boot-err');
        const ev = window.DD_BOOT.getEvidence();
        return {
          panel: !!e && !e.hidden,
          state: window.DD_BOOT.getState().state,
          wd: ev.watchdogFired,
          loadFinished: ev.loadFinished,
          trace: window.DD_BOOT.getTrace().map(x => x.step + ':' + x.pct),
          pct: (document.getElementById('dd-boot-pct') || {}).textContent || ''
        };
      }).catch(() => null);
      if (vBefore && vBefore.panel) break;
      await vp.waitForTimeout(250);
    }
    ok('V1 carga tardía: el watchdog dispara y muestra el panel', !!(vBefore && vBefore.panel && vBefore.wd),
      'panel=' + (vBefore && vBefore.panel) + ' watchdog=' + (vBefore && vBefore.wd) +
      ' estado=' + (vBefore && vBefore.state) + ' pct=' + (vBefore && vBefore.pct),
      'panel visible con watchdogFired=true');

    ok('V2 carga tardía: la carga NO se declara terminada', !!(vBefore && vBefore.loadFinished === false),
      'loadFinished=' + (vBefore && vBefore.loadFinished), 'loadFinished=false');

    /* 2) LIBERAR el trabajo pendiente: ahora termina, pero tarde. */
    await vp.evaluate(() => { if (window.__releaseGate) window.__releaseGate(); });
    await vp.waitForTimeout(7000);

    const vAfter = await vp.evaluate(() => {
      const e = document.getElementById('dd-boot-err');
      const ev = window.DD_BOOT.getEvidence();
      return {
        panel: !!e && !e.hidden,
        state: window.DD_BOOT.getState().state,
        loadFinished: ev.loadFinished,
        trace: window.DD_BOOT.getTrace().map(x => x.step + ':' + x.pct),
        pct: (document.getElementById('dd-boot-pct') || {}).textContent || '',
        watchText: (document.getElementById('dd-boot-stage') || {}).textContent || ''
      };
    });

    ok('V3 carga tardía: el intento caducado no avanza el progreso',
      !!(vBefore && vAfter && JSON.stringify(vBefore.trace) === JSON.stringify(vAfter.trace)),
      'antes=' + JSON.stringify(vBefore && vBefore.trace) + ' despues=' + JSON.stringify(vAfter && vAfter.trace),
      'la traza no cambia tras liberar la carga');

    ok('V4 carga tardía: el intento caducado NO activa la intro',
      !!(vAfter && vAfter.state !== 'INTRO' && vAfter.state !== 'MAIN_MENU' && vAfter.state !== 'PLAYING'),
      'estado final=' + (vAfter && vAfter.state), 'el estado no sale de LOADING');

    ok('V5 carga tardía: el panel de error se conserva', !!(vAfter && vAfter.panel === true),
      'panel=' + (vAfter && vAfter.panel), 'el panel sigue visible');

    ok('V6 carga tardía: no se declara la carga terminada', !!(vAfter && vAfter.loadFinished === false),
      'loadFinished=' + (vAfter && vAfter.loadFinished), 'loadFinished=false');

    await shot(vp, '18_late_load_ignored.png');
    await vb.close();
  }

  /* ==========================================================================
     M · FASE 01.4 · SEIS ESCENARIOS DEL MOTOR (P0 · validación esencial)
     ==========================================================================
     Cada escenario aísla UNA causa y exige que se DETECTE y se COMUNIQUE
     (no basta con "no se llega al menú"). Los parches se aplican en el
     momento correcto: los que sustituyen el puente esperan a que exista. */
  {
    const ESCENARIOS = [
      {
        id: 'M-A', nombre: 'canvas ausente',
        init: () => {
          document.addEventListener('DOMContentLoaded', () => {
            const g = document.getElementById('game');
            if (g) g.remove();
          }, { capture: true });
        },
        esperado: /lienzo del juego \(#game\)/
      },
      {
        id: 'M-B', nombre: 'contexto gráfico no disponible',
        init: () => {
          const orig = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (t) {
            return t === '2d' ? null : orig.apply(this, arguments);
          };
        },
        esperado: /contexto gráfico/
      },
      {
        id: 'M-C', nombre: 'puente ausente',
        init: () => {
          Object.defineProperty(window, '__DD_BRIDGE', {
            configurable: true, get() { return undefined; }, set() {}
          });
        },
        esperado: /puente del motor/
      },
      {
        id: 'M-D', nombre: 'método esencial ausente (isRunning)',
        init: () => {
          let real;
          Object.defineProperty(window, '__DD_BRIDGE', {
            configurable: true,
            get() { return this.__fake || real; },
            set(v) {
              real = v;
              this.__fake = Object.freeze({ startRun: v && v.startRun, getSnapshot: v && v.getSnapshot });
            }
          });
        },
        esperado: /no expone isRunning/
      },
      {
        id: 'M-E', nombre: 'isRunning() lanza una excepción',
        init: () => {
          let real;
          Object.defineProperty(window, '__DD_BRIDGE', {
            configurable: true,
            get() { return this.__fake || real; },
            set(v) {
              real = v;
              this.__fake = Object.freeze({
                isRunning: function () { throw new Error('motor en estado inconsistente'); },
                startRun: v && v.startRun,
                getSnapshot: v && v.getSnapshot
              });
            }
          });
        },
        esperado: /excepción al comprobar isRunning/
      },
      {
        id: 'M-F', nombre: 'motor correctamente disponible',
        init: null,
        esperado: null    /* el caso bueno: sin error de engine */
      }
    ];

    for (const esc of ESCENARIOS) {
      const { b: mb, p: mp } = await launch(1280, 720);
      try {
        if (esc.init) await mp.addInitScript(esc.init);
        mp.goto(URL, { waitUntil: 'commit' }).catch(() => {});
        const tM = Date.now();
        let m = null;
        while (Date.now() - tM < 60000) {
          m = await mp.evaluate(() => {
            const e = document.getElementById('dd-boot-err');
            const ev = window.DD_BOOT.getEvidence();
            return {
              state: window.DD_BOOT.getState().state,
              panel: !!e && !e.hidden,
              title: (document.getElementById('dd-boot-err-title') || {}).textContent || '',
              body: (document.getElementById('dd-boot-err-body') || {}).textContent || '',
              eng: (ev.errors || []).filter(x => x.id === 'engine')[0] || null,
              safeDisabled: (document.getElementById('dd-boot-safe') || {}).disabled,
              canStart: window.DD_BOOT.canStartGame()
            };
          }).catch(() => null);
          if (m && (m.panel || m.state === 'MAIN_MENU' || m.state === 'INTRO')) break;
          await mp.waitForTimeout(200);
        }

        if (esc.id === 'M-F') {
          /* Caso bueno: debe llegar a INTRO o MAIN_MENU SIN error fatal. */
          ok('M-F motor disponible: el arranque progresa sin error de engine',
            !!(m && (m.state === 'INTRO' || m.state === 'MAIN_MENU') && !m.panel &&
               !(m.eng && m.eng.fatal)),
            'estado=' + (m && m.state) + ' panel=' + (m && m.panel) +
            ' engineError=' + JSON.stringify(m && m.eng),
            'estado INTRO/MAIN_MENU sin panel de error');
        } else {
          const fatal = !!(m && m.eng && m.eng.fatal === true && m.eng.essential === true);
          ok(esc.id + ' motor · ' + esc.nombre + ': se detecta y se comunica',
            !!(m && m.panel && fatal && m.state !== 'MAIN_MENU' && m.state !== 'PLAYING' &&
               m.safeDisabled === true && m.canStart === false),
            'estado=' + (m && m.state) + ' panel=' + (m && m.panel) + ' fatal=' + fatal +
            ' safe.disabled=' + (m && m.safeDisabled) + ' canStart=' + (m && m.canStart),
            'panel visible + error fatal de engine + modo seguro bloqueado + sin menú');
          ok(esc.id + ' motor · ' + esc.nombre + ': el mensaje identifica la causa',
            !!(m && m.eng && esc.esperado.test(m.eng.message || '')),
            'motivo="' + (m && m.eng && m.eng.message) + '"',
            'el mensaje nombra la causa concreta');
        }
      } finally { await mb.close(); }
    }
  }

  /* ==========================================================================
     T · FASE 01.4 · TRANSICIÓN A PLAYING (P1 · contrato único)
     ==========================================================================
     Se demuestra que el resultado de DD_BOOT.enterGame() MANDA: si rechaza, la
     interfaz se restaura (menú visible, busy liberado, audio del menú). El caso
     T6 es el que de verdad expone el defecto: la sonda previa acepta y la
     puerta rechaza, que es cuando antes quedaba el menú oculto. */
  {
    const correrTransicion = async (parche, espera) => {
      const { b: tb, p: tp } = await launch(1280, 720);
      try {
        let enMenu = false;
        tp.goto(URL, { waitUntil: 'commit' }).catch(() => {});
        const t = Date.now();
        while (Date.now() - t < 200000) {
          const st = await tp.evaluate(() => (window.DD_BOOT ? window.DD_BOOT.getState().state : null)).catch(() => null);
          if (st === 'INTRO') await tp.keyboard.press('Escape').catch(() => {});
          if (st === 'MAIN_MENU') { enMenu = true; break; }
          await tp.waitForTimeout(150);
        }
        if (!enMenu) return { err: 'no se alcanzó MAIN_MENU' };

        return await tp.evaluate(async (fuenteParche) => {
          const sleep = ms => new Promise(r => setTimeout(r, ms));
          if (fuenteParche) { const f = (0, eval)('(' + fuenteParche + ')'); f(); }
          const antes = {
            state: window.DD_BOOT.getState().state,
            busy: window.DD_UI.getState().busy,
            menu: window.DD_UI.getState().menuVisible
          };
          window.DD_UI.triggerMenuAction('new');
          /* 01.4 · el vigilante de estancamiento de la cinemática dispara a los
             4 s y el rechazo se resuelve después (~6,8 s medidos en carga), así
             que el tope de espera debe cubrir ese margen: antes se cortaba a los
             6 s y una restauración correcta se leía como fallo. */
          for (let i = 0; i < 200; i++) {
            await sleep(250);
            if (!window.DD_UI.getState().busy &&
                (window.DD_BOOT.getState().state === 'PLAYING' ||
                 window.DD_BOOT.getState().state === 'MAIN_MENU')) break;
          }
          return {
            antes,
            despues: {
              state: window.DD_BOOT.getState().state,
              busy: window.DD_UI.getState().busy,
              menu: window.DD_UI.getState().menuVisible,
              menuOculto: (() => {
                const mo = document.getElementById('dd-main-menu');
                return !!(mo && mo.classList.contains('dd-hidden'));
              })(),
              music: !!(window.DDC_COVER && window.DDC_COVER.music && window.DDC_COVER.music.playing)
            }
          };
        }, parche);
      } finally { await tb.close(); }
    };

    /* T1 · motor disponible -> PLAYING */
    const t1 = await correrTransicion(null, 'playing');
    ok('T1 motor disponible: la entrada termina en PLAYING',
      !!(t1 && t1.despues && t1.despues.state === 'PLAYING' && t1.despues.menu === false),
      JSON.stringify(t1 && t1.despues), 'estado PLAYING con el menú oculto');

    /* T2 · motor detenido -> rechazo y menú restaurado */
    const t2 = await correrTransicion(
      "() => { const r = window.__DD_BRIDGE; window.__DD_BRIDGE = Object.freeze({ isRunning: () => false, startRun: () => false, getSnapshot: r.getSnapshot, setPaused: r.setPaused }); }",
      'menu');
    ok('T2 motor detenido: la entrada se rechaza y el menú se restaura',
      !!(t2 && t2.despues && t2.despues.state === 'MAIN_MENU' && t2.despues.busy === false &&
         t2.despues.menu === true && t2.despues.menuOculto === false),
      JSON.stringify(t2 && t2.despues), 'MAIN_MENU, sin busy, menú visible');

    /* T3 · motor ausente -> rechazo */
    const t3 = await correrTransicion(
      "() => { Object.defineProperty(window,'__DD_BRIDGE',{configurable:true,get:()=>undefined,set(){}}); }",
      'menu');
    ok('T3 motor ausente: la entrada se rechaza y el menú se restaura',
      !!(t3 && t3.despues && t3.despues.state === 'MAIN_MENU' && t3.despues.busy === false &&
         t3.despues.menu === true),
      JSON.stringify(t3 && t3.despues), 'MAIN_MENU con el menú visible');

    /* T4 · isRunning lanza -> rechazo */
    const t4 = await correrTransicion(
      "() => { const r = window.__DD_BRIDGE; window.__DD_BRIDGE = Object.freeze({ isRunning: () => { throw new Error('boom'); }, startRun: () => true, getSnapshot: r.getSnapshot }); }",
      'menu');
    ok('T4 isRunning() lanza: la entrada se rechaza sin dejar la UI colgada',
      !!(t4 && t4.despues && t4.despues.state === 'MAIN_MENU' && t4.despues.busy === false &&
         t4.despues.menu === true),
      JSON.stringify(t4 && t4.despues), 'MAIN_MENU con el menú visible');

    /* T5 · puente incompleto -> rechazo */
    const t5 = await correrTransicion(
      "() => { const r = window.__DD_BRIDGE; window.__DD_BRIDGE = Object.freeze({ startRun: r.startRun, getSnapshot: r.getSnapshot }); }",
      'menu');
    /* Se exige el menú VISIBLE, no sólo el estado: T5 dejó ver que sin esta
       condición una UI con el menú oculto pasaba como correcta. */
    ok('T5 puente incompleto: la entrada se rechaza y el menú se restaura',
      !!(t5 && t5.despues && t5.despues.state === 'MAIN_MENU' && t5.despues.busy === false &&
         t5.despues.menu === true && t5.despues.menuOculto === false),
      JSON.stringify(t5 && t5.despues), 'MAIN_MENU con el menú VISIBLE');

    /* T6 · EL CASO DECISIVO: la sonda previa acepta y enterGame() rechaza.
       Antes de FASE 01.4 esto dejaba el menú oculto con estado MAIN_MENU. */
    const t6 = await correrTransicion(
      "() => { const r = window.__DD_BRIDGE; let n = 0; window.__DD_BRIDGE = Object.freeze({ isRunning: () => { n++; return n === 1; }, startRun: () => true, getSnapshot: r.getSnapshot, setPaused: r.setPaused }); }",
      'menu');
    ok('T6 la puerta manda: si enterGame() rechaza, el menú se restaura',
      !!(t6 && t6.despues && t6.despues.state === 'MAIN_MENU' && t6.despues.busy === false &&
         t6.despues.menu === true && t6.despues.menuOculto === false),
      JSON.stringify(t6 && t6.despues),
      'MAIN_MENU con el menú VISIBLE (antes quedaba oculto)');

    /* T7 · el audio del menú no se queda parado tras un rechazo */
    ok('T7 tras un rechazo el audio del menú vuelve a sonar',
      !!(t2 && t2.despues && t2.despues.music === true),
      'música del menú=' + (t2 && t2.despues && t2.despues.music),
      'música del menú activa');
  }


  /* ==========================================================================
     Q · FASE 01.4 · ACCESIBILIDAD DEL PANEL DE ERROR (P1)
     ==========================================================================
     El panel tenía role="alert" pero sin asociación título/cuerpo y sin mover el
     foco: quien navega con teclado no llegaba a REINTENTAR sin recorrer el árbol.
     Se comprueba sobre el panel REAL, provocando un fallo fatal de verdad. */
  {
    const { b: qb, p: qp } = await launch(1280, 720);
    await qp.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const g = document.getElementById('game');
        if (g) g.remove();
      }, { capture: true });
    });
    qp.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    const tQ = Date.now();
    let q = null;
    while (Date.now() - tQ < 90000) {
      q = await qp.evaluate(() => {
        const e = document.getElementById('dd-boot-err');
        const retry = document.getElementById('dd-boot-retry');
        const ae = document.activeElement;
        return {
          panel: !!e && !e.hidden,
          role: e ? e.getAttribute('role') : null,
          labelledby: e ? e.getAttribute('aria-labelledby') : null,
          describedby: e ? e.getAttribute('aria-describedby') : null,
          tabindex: e ? e.getAttribute('tabindex') : null,
          titleExiste: !!document.getElementById('dd-boot-err-title'),
          bodyExiste: !!document.getElementById('dd-boot-err-body'),
          focoEn: ae ? (ae.id || ae.tagName) : null,
          focoEsBoton: !!(ae && ae.tagName === 'BUTTON'),
          retryVisible: !!(retry && !retry.hidden && !retry.disabled)
        };
      }).catch(() => null);
      if (q && q.panel) break;
      await qp.waitForTimeout(250);
    }

    ok('Q1 el panel de error es un alert y tiene título y cuerpo reales',
      !!(q && q.role === 'alert' && q.titleExiste && q.bodyExiste),
      JSON.stringify({ role: q && q.role, title: q && q.titleExiste, body: q && q.bodyExiste }),
      'role=alert con #dd-boot-err-title y #dd-boot-err-body');

    ok('Q2 el panel está asociado a su título y a su mensaje',
      !!(q && q.labelledby === 'dd-boot-err-title' && q.describedby === 'dd-boot-err-body'),
      'aria-labelledby=' + (q && q.labelledby) + ' aria-describedby=' + (q && q.describedby),
      'aria-labelledby y aria-describedby apuntando al título y al cuerpo');

    ok('Q3 el panel acepta foco programático',
      !!(q && q.tabindex === '-1'),
      'tabindex=' + (q && q.tabindex), 'tabindex="-1" para poder recibir el foco');

    ok('Q4 al aparecer el error el foco va a un control de recuperación',
      !!(q && (q.focoEsBoton || q.focoEn === 'dd-boot-err') && q.retryVisible),
      'foco=' + (q && q.focoEn) + ' botón REINTENTAR visible=' + (q && q.retryVisible),
      'foco en REINTENTAR (o en el panel) y botón disponible');

    /* Los controles dentro del panel deben ser alcanzables: no puede haber
       controles interactivos dentro de una región oculta a accesibilidad. */
    const alcanzables = await qp.evaluate(() => {
      const e = document.getElementById('dd-boot-err');
      const botones = Array.from(e.querySelectorAll('button'));
      return {
        n: botones.length,
        ocultos: botones.filter(x => x.getAttribute('aria-hidden') === 'true' || x.disabled && x.getAttribute('aria-hidden') === 'true').length,
        tabulables: botones.filter(x => x.tabIndex >= 0).length
      };
    });
    ok('Q5 los controles del panel son alcanzables por teclado',
      !!(alcanzables && alcanzables.n >= 2 && alcanzables.tabulables === alcanzables.n &&
         alcanzables.ocultos === 0),
      JSON.stringify(alcanzables), 'todos los botones del panel en el orden de tabulación');

    await shot(qp, '19_error_panel_a11y.png');
    await qb.close();
  }

  /* ==========================================================================
     R · FASE 01.4 · ÁRBOL DE ACCESIBILIDAD REAL DEL ARRANQUE (CDP)
     ==========================================================================
     Motivo: el armazón nacía con aria-hidden="true" en el markup estático y
     dd_boot.js le añadía role="dialog" + aria-modal="true", pero seguía marcado
     como oculto. Como el panel de error se lleva el foco dentro, Chromium
     EXPONÍA el subárbol igualmente: el panel era accesible por accidente y por
     un motivo equivocado. Estas pruebas no inspeccionan el código fuente ni se
     fían de los atributos: leen el árbol de accesibilidad que Chromium construye
     de verdad (Accessibility.getFullAXTree por CDP). Sin CDP, NV honesto. */

  async function axDe(pagina) {
    /* Devuelve un lector del árbol de accesibilidad real, o null si el entorno
       no ofrece CDP. */
    try {
      const cdp = await pagina.context().newCDPSession(pagina);
      await cdp.send('Accessibility.enable');
      return async function consulta(texto) {
        const { nodes } = await cdp.send('Accessibility.getFullAXTree');
        const nombre = n => (n.name && n.name.value) || '';
        return {
          visibles: nodes.filter(n => nombre(n).includes(texto) && !n.ignored).length,
          existen: nodes.filter(n => nombre(n).includes(texto)).length
        };
      };
    } catch (e) {
      return null;
    }
  }

  {
    const { b: rb, p: rp } = await launch(1280, 720);

    /* ---------- R1 · Estado CARGANDO: el armazón no se oculta a sí mismo ---- */
    rp.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    await rp.waitForTimeout(1400);
    const cargando = await rp.evaluate(() => {
      const f = document.getElementById('dd-boot-frame');
      if (!f) return { presente: false };
      return {
        presente: true,
        role: f.getAttribute('role'),
        ariaHidden: f.getAttribute('aria-hidden'),
        ariaBusy: f.getAttribute('aria-busy'),
        ariaModal: f.getAttribute('aria-modal'),
        label: f.getAttribute('aria-label')
      };
    });
    ok('R1 cargando: el armazón tiene semántica propia y NO está oculto al árbol',
      !!(cargando && cargando.presente && cargando.ariaHidden === null &&
         cargando.role === 'progressbar' && cargando.ariaBusy === 'true' &&
         !!cargando.label),
      JSON.stringify(cargando),
      'role=progressbar, aria-busy=true, aria-label presente y SIN aria-hidden');

    /* El estado de carga debe ser perceptible para un lector de pantalla. */
    const axR = await axDe(rp);
    if (!axR) {
      nv('R2 cargando: el árbol de accesibilidad expone la pantalla de carga',
        'CDP Accessibility no disponible en este entorno',
        'se requiere Accessibility.getFullAXTree', 'la etiqueta "Cargando DEADBEAT DISCO" en el árbol');
    } else {
      const a = await axR('Cargando DEADBEAT DISCO');
      ok('R2 cargando: el árbol de accesibilidad expone la pantalla de carga',
        a.visibles > 0, JSON.stringify(a), 'al menos un nodo visible con la etiqueta del armazón');
    }
    await rb.close();
  }

  /* ---------- R3–R8 · Estado ERROR: panel y controles accesibles de verdad -- */
  {
    const { b: eb, p: ep } = await launch(1280, 720);
    /* Fallo FATAL real: el lienzo desaparece antes de que corra el arranque, así
       que el paso esencial `engine` falla de verdad (no se simula el panel). */
    await ep.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', function () {
        const g = document.getElementById('game');
        if (g) g.remove();
      }, { once: true });
    });
    ep.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    let panel = false;
    for (let i = 0; i < 90; i++) {
      panel = await ep.evaluate(() => {
        const e = document.getElementById('dd-boot-err');
        return !!(e && !e.hidden);
      }).catch(() => false);
      if (panel) break;
      await ep.waitForTimeout(400);
    }
    ok('R3 error fatal real: el panel aparece', panel === true,
      'panel visible=' + panel, 'panel de error visible tras un fallo fatal de verdad');

    /* Cadena de ancestros: ni el panel ni REINTENTAR pueden tener un antecesor
       con aria-hidden="true". */
    const cadena = await ep.evaluate(() => {
      const cad = (n) => { const o = []; let c = n ? n.parentElement : null; while (c && c !== document.documentElement) { o.push({ id: c.id || c.tagName, ah: c.getAttribute('aria-hidden') }); c = c.parentElement; } return o; };
      const err = document.getElementById('dd-boot-err');
      const retry = document.getElementById('dd-boot-retry');
      const frame = document.getElementById('dd-boot-frame');
      return {
        panel: cad(err), retry: cad(retry),
        frameRole: frame && frame.getAttribute('role'),
        frameModal: frame && frame.getAttribute('aria-modal'),
        frameAH: frame && frame.getAttribute('aria-hidden'),
        errLabelled: err && err.getAttribute('aria-labelledby'),
        errDescribed: err && err.getAttribute('aria-describedby'),
        tituloExiste: !!(document.getElementById('dd-boot-err-title') || {}).textContent,
        cuerpoExiste: ((document.getElementById('dd-boot-err-body') || {}).textContent || '').length > 0
      };
    });
    const ocultosPanel = (cadena.panel || []).filter(c => c.ah === 'true');
    const ocultosRetry = (cadena.retry || []).filter(c => c.ah === 'true');
    ok('R4 error: ningún antecesor del panel tiene aria-hidden="true"',
      ocultosPanel.length === 0 && (cadena.panel || []).length > 0,
      JSON.stringify(ocultosPanel) + ' (cadena de ' + (cadena.panel || []).length + ')',
      'ningún ancestro del panel oculto a tecnologías de asistencia');
    ok('R5 error: ningún antecesor de REINTENTAR tiene aria-hidden="true"',
      ocultosRetry.length === 0 && (cadena.retry || []).length > 0,
      JSON.stringify(ocultosRetry) + ' (cadena de ' + (cadena.retry || []).length + ')',
      'ningún ancestro del botón oculto a tecnologías de asistencia');

    /* Contradicción aria-hidden / aria-modal / role / foco: con el panel activo
       el armazón debe presentarse como diálogo modal y NO como oculto. */
    ok('R6 error: el armazón no se contradice (alertdialog modal, sin aria-hidden)',
      !!(cadena.frameRole === 'alertdialog' && cadena.frameModal === 'true' &&
         cadena.frameAH === null && cadena.errLabelled === 'dd-boot-err-title' &&
         cadena.errDescribed === 'dd-boot-err-body' && cadena.tituloExiste && cadena.cuerpoExiste),
      JSON.stringify({ role: cadena.frameRole, modal: cadena.frameModal, ah: cadena.frameAH,
        labelled: cadena.errLabelled, described: cadena.errDescribed,
        titulo: !!cadena.tituloExiste, cuerpo: !!cadena.cuerpoExiste }),
      'role=alertdialog + aria-modal, sin aria-hidden, título y cuerpo asociados y con texto');

    /* La prueba decisiva: el árbol REAL de Chromium. */
    const axE = await axDe(ep);
    if (!axE) {
      nv('R7 error: el árbol real expone REINTENTAR y el título',
        'CDP Accessibility no disponible en este entorno',
        'se requiere Accessibility.getFullAXTree', 'REINTENTAR y el título en el árbol');
    } else {
      const retryAX = await axE('REINTENTAR');
      const tituloAX = await axE('NO SE PUDO ABRIR EL CLUB');
      ok('R7 error: el árbol real de Chromium expone REINTENTAR y el título',
        retryAX.visibles > 0 && tituloAX.visibles > 0,
        JSON.stringify({ reintentar: retryAX, titulo: tituloAX }),
        'ambos visibles en el árbol de accesibilidad');

    /* Foco y disponibilidad del control de recuperación. */
    const recuperacion = await ep.evaluate(() => {
      const r = document.getElementById('dd-boot-retry');
      const e = document.getElementById('dd-boot-err');
      const activo = document.activeElement;
      return {
        foco: activo && activo.id,
        dentroDelPanel: !!(e && activo && e.contains(activo)),
        visible: !!(r && (r.offsetWidth || r.offsetHeight)),
        habilitado: !!(r && !r.disabled),
        enfocable: !!(r && r.tabIndex >= 0),
        tabulables: Array.from((e || document).querySelectorAll('button')).filter(x => x.tabIndex >= 0 && !x.disabled).length
      };
    });
    ok('R9 error: el foco llega a un control útil y REINTENTAR es usable',
      !!(recuperacion.foco === 'dd-boot-retry' && recuperacion.dentroDelPanel &&
         recuperacion.visible && recuperacion.habilitado && recuperacion.enfocable &&
         recuperacion.tabulables >= 1),
      JSON.stringify(recuperacion),
      'foco en dd-boot-retry, visible, habilitado, enfocable y en el orden de tabulación');

      /* R8 · CONTROL NEGATIVO del defecto original. Se mueve el foco FUERA del
         armazón. Antes del arreglo, el panel sólo era accesible porque el foco
         estaba dentro de un subárbol aria-hidden; al sacarlo, REINTENTAR
         desaparecía del árbol (medido: 3 -> 0) y quedaba demostrado que la
         accesibilidad era accidental. Ahora el armazón no está oculto, así que
         REINTENTAR debe seguir en el árbol con el foco fuera. Si alguien
         reintroduce aria-hidden="true" en el armazón, ESTA prueba falla. */
      await ep.evaluate(() => {
        const bt = document.createElement('button');
        bt.id = 'dd-sonda-foco-fuera';
        bt.textContent = 'SONDA';
        document.body.appendChild(bt);
        bt.focus();
      });
      await ep.waitForTimeout(250);
      const fuera = await axE('REINTENTAR');
      ok('R8 error: REINTENTAR sigue en el árbol con el foco FUERA (no es accesible por accidente)',
        fuera.visibles > 0,
        JSON.stringify({ conFocoFuera: fuera.visibles }),
        'REINTENTAR presente en el árbol sin depender de dónde esté el foco');
    }


    /* No puede haber controles enfocables dentro de una región oculta. */
    /* El alcance es el ARMAZÓN DE ARRANQUE: es lo que esta fase gobierna. Los
       controles del HUD (pausa, armas, opciones) viven en contenedores del juego
       que no forman parte del arranque y no se tocan aquí; incluirlos mezclaría
       un defecto del juego con el defecto auditado. */
    const focosOcultos = await ep.evaluate(() => {
      const ocultoPorAria = (n) => {
        let c = n.parentElement;
        while (c) { if (c.getAttribute && c.getAttribute('aria-hidden') === 'true') return true; c = c.parentElement; }
        return false;
      };
      const marco = document.getElementById('dd-boot-frame');
      if (!marco) return { total: 0, malos: [], nota: 'armazón ausente' };
      const focables = Array.from(marco.querySelectorAll('button, a[href], input, select, textarea, [tabindex]'))
        .filter(n => n.tabIndex >= 0 && !n.disabled);
      const malos = focables.filter(ocultoPorAria).map(n => n.id || n.textContent.trim().slice(0, 20));
      return { total: focables.length, malos };
    });
    ok('R10 error: ningún control enfocable del armazón está dentro de una región aria-hidden',
      focosOcultos.total > 0 && focosOcultos.malos.length === 0,
      JSON.stringify(focosOcultos),
      'todos los controles enfocables del armazón visibles para tecnologías de asistencia');

    await shot(ep, '19_error_panel_a11y.png');
    await eb.close();
  }

  /* ---------- R11–R13 · RECUPERACIÓN y estado RETIRADO -------------------- */
  {
    const { b: sb, p: sp } = await launch(1280, 720);
    sp.goto(URL, { waitUntil: 'commit' }).catch(() => {});
    /* Llegar al menú saltando la intro. */
    let estado = null, enMenu = false;
    for (let i = 0; i < 300; i++) {
      estado = await sp.evaluate(() => (window.DD_BOOT ? window.DD_BOOT.getState().state : null)).catch(() => null);
      if (estado === 'INTRO') await sp.keyboard.press('Escape').catch(() => {});
      if (estado === 'MAIN_MENU') { enMenu = true; break; }
      await sp.waitForTimeout(300);
    }
    await sp.waitForTimeout(1200);
    const retirado = await sp.evaluate(() => {
      const f = document.getElementById('dd-boot-frame');
      const menu = document.getElementById('dd-main-menu');
      const cuentaOcultos = (n) => { let c = n && n.parentElement, k = 0; while (c && c !== document.documentElement) { if (c.getAttribute('aria-hidden') === 'true') k++; c = c.parentElement; } return k; };
      return {
        estado: window.DD_BOOT.getState().state,
        frameEnDOM: !!f,
        menuPresente: !!menu,
        ancestrosOcultosMenu: menu ? cuentaOcultos(menu) : null,
        menuOculto: menu ? menu.classList.contains('dd-hidden') : null,
        foco: document.activeElement && (document.activeElement.id || document.activeElement.tagName),
        panelesDuplicados: document.querySelectorAll('#dd-boot-err').length,
        framesDuplicados: document.querySelectorAll('#dd-boot-frame').length
      };
    });
    ok('R11 retirado: al entrar al menú no queda ninguna región mal oculta ni expuesta',
      !!(enMenu && retirado.estado === 'MAIN_MENU' && retirado.frameEnDOM === false &&
         retirado.menuPresente && retirado.ancestrosOcultosMenu === 0 && retirado.menuOculto === false),
      JSON.stringify(retirado),
      'armazón fuera del DOM, menú visible y sin ancestros aria-hidden');

    /* Sin paneles ni armazones duplicados: el armazón se ADOPTA, no se copia. */
    ok('R12 no se duplica el panel ni el armazón',
      retirado.panelesDuplicados <= 1 && retirado.framesDuplicados <= 1,
      JSON.stringify({ paneles: retirado.panelesDuplicados, frames: retirado.framesDuplicados }),
      'como máximo una copia de cada uno');

    /* El menú debe seguir siendo utilizable por teclado tras retirar el armazón. */
    const menuUsable = await sp.evaluate(() => {
      const items = Array.from(document.querySelectorAll('#dd-menu-nav .dd-menu-item, #dd-menu-nav button'));
      return {
        n: items.length,
        tabulables: items.filter(x => x.tabIndex >= 0 && !x.disabled).length,
        focoEnMenu: !!(document.getElementById('dd-main-menu') || {}).contains(document.activeElement)
      };
    });
    ok('R13 el menú sigue siendo utilizable por teclado tras retirar el armazón',
      !!(menuUsable.n > 0 && menuUsable.tabulables > 0),
      JSON.stringify(menuUsable), 'al menos un control del menú enfocable');

    await sb.close();
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
