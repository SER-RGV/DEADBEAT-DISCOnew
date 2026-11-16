/* ==========================================================================
   Banco de pruebas del arranque (sólo herramienta de trabajo, no del build)

   Ejecuta el módulo REAL src/dd_opening.js sobre un navegador simulado mínimo
   con @napi-rs/canvas para poder:

     · capturar fotogramas de cualquier instante de la intro o del descenso
     · montar hojas de contacto de la secuencia
     · medir fotograma a fotograma lo que se pinta (planos repetidos, recursos
       ausentes, errores de pintura)

   Uso:
     node work/tools/harness.js stills intro 1.0,5.2,9.6
     node work/tools/harness.js stills descent 0.3,2.5
     node work/tools/harness.js sheet intro 0.5 1.5 2.5
     node work/tools/harness.js audit
   ========================================================================== */
const path = require('path');
const fs = require('fs');
const { createCanvas, Image, GlobalFonts, DOMMatrix, Path2D, loadImage } = require('/tmp/cvtest/node_modules/@napi-rs/canvas');

const ROOT = '/home/user/DEADBEAT-DISCOnew';
const OUT = path.join(ROOT, 'work', 'cine_frames');
fs.mkdirSync(OUT, { recursive: true });

GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/barlow-condensed-latin-700-italic.woff2'), 'Barlow Condensed');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/bangers-latin-400-normal.woff2'), 'Bangers');

const imgCache = new Map();
async function real(rel) {
  if (imgCache.has(rel)) return imgCache.get(rel);
  /* El registro añade ?v=<versión> a cada ruta; en disco el archivo no lleva query. */
  const clean = String(rel).split('?')[0];
  const p = path.join(ROOT, clean);
  const im = await loadImage(p);
  im.__real = p;
  imgCache.set(rel, im);
  return im;
}

/* ------------------------------------------------- navegador simulado ---- */
function makeSandbox(W, H, DPR) {
  const primary = createCanvas(W, H);
  const sb = { W, H, DPR, primary, canvases: [], listeners: Object.create(null), loaded: [], missing: [], store: Object.create(null) };
  const noopClassList = { add() {}, remove() {}, contains() { return false; }, toggle() {} };
  const ctx = primary.getContext('2d');

  const canvasEl = {
    id: 'dd-opening', width: W, height: H, style: {}, className: '',
    __canvasEl: primary,
    getContext() { return ctx; },
    setAttribute() {}, appendChild() {}, classList: noopClassList, addEventListener() {}
  };
  /* Canvas de trabajo que crea el propio módulo (halftone, etc.). */
  function mkCanvas() {
    const c = createCanvas(2, 2);
    const cc = c.getContext('2d');
    const base = cc.drawImage.bind(cc);
    cc.drawImage = function (img) {
      let t = img;
      if (t && t.__img) t = t.__img;
      if (t && !t) return;
      return base.apply(null, [t].concat([].slice.call(arguments, 1)));
    };
    const bp = cc.createPattern.bind(cc);
    cc.createPattern = function (img, rep) {
      let t = img; if (t && t.__img) t = t.__img;
      return bp(t, rep);
    };
    c.style = {}; c.classList = noopClassList; c.setAttribute = function () {}; c.appendChild = function () {};
    sb.canvases.push(c);
    return c;
  }
  function mkDiv() {
    return { style: {}, textContent: '', id: '', classList: noopClassList, setAttribute() {}, appendChild() {} };
  }
  const doc = {
    createElement: (tag) => (tag === 'canvas' ? mkCanvas() : mkDiv()),
    body: { appendChild() {}, classList: noopClassList, setAttribute() {}, removeAttribute() {} },
    addEventListener() {}, getElementById() { return null; },
    fonts: { load: () => Promise.resolve([{}]), check: () => true }
  };

  /* Imagen: subclase real de Image() cargada del disco (así el lienzo la
     acepta) y con la API DOM completa (complete / naturalWidth / onload). */
  function makeImage() {
    const im = new Image();
    let pending = '';
    Object.defineProperty(im, 'src', {
      get() { return pending; },
      set(v) {
        pending = v;
        im._src = v;
        real(v).then(function (r) {
          im.__w = r.width; im.__h = r.height;
          im.naturalWidth = r.width; im.naturalHeight = r.height;
          im.width = r.width; im.height = r.height;
          im.complete = true;
          im.__img = r;
          sb.loaded.push(v);
          if (im.onload) im.onload();
        }, function () {
          sb.missing.push(v);
          im.complete = false;
          if (im.onerror) im.onerror();
        });
      }
    });
    Object.defineProperty(im, 'naturalWidth', { get() { return im.__nw || 0; }, set(v) { im.__nw = v; }, configurable: true });
    Object.defineProperty(im, 'naturalHeight', { get() { return im.__nh || 0; }, set(v) { im.__nh = v; }, configurable: true });
    im.complete = false;
    /* El registro de recursos alterna al `fallback` con getAttribute/setAttribute. */
    im.__attrs = Object.create(null);
    im.getAttribute = function (k) { return k in im.__attrs ? im.__attrs[k] : null; };
    im.setAttribute = function (k, v) { im.__attrs[k] = String(v); };
    im.decoding = '';
    return im;
  }
  /* drawImage acepta estos objetos: se traducen a la imagen real. */
  const drawImageReal = ctx.drawImage.bind(ctx);


  sb.win = {
    innerWidth: W, innerHeight: H, devicePixelRatio: DPR,
    performance: { now: () => sb.now || 0 },
    AudioContext: undefined, webkitAudioContext: undefined,
    matchMedia: () => ({ matches: false }),
    _raf: [],
    requestAnimationFrame(f) { sb.win._raf.push(f); return sb.win._raf.length; },
    cancelAnimationFrame() {},
    addEventListener(t, f) { (sb.listeners[t] = sb.listeners[t] || []).push(f); },
    removeEventListener() {},
    localStorage: {
      getItem: (k) => (k in sb.store ? sb.store[k] : null),
      setItem: (k, v) => { sb.store[k] = String(v); },
      removeItem: (k) => { delete sb.store[k]; }
    },
    navigator: { getGamepads: () => [] }
  };
  sb.win.document = doc;
  sb.win.Image = makeImage;
  sb.doc = doc;
  sb.mkWorkCanvas = mkCanvas;
  sb.mkDiv = mkDiv;
  sb.canvasEl = canvasEl;
  sb.ctx = ctx;
  sb.main = function () { return sb.canvases[0] || primary; };
  return sb;
}

function loadModule(sb, opts) {
  const G = global;
  G.window = sb.win; G.document = sb.doc; G.Image = sb.win.Image;
  G.navigator = sb.win.navigator; G.localStorage = sb.win.localStorage;
  G.requestAnimationFrame = sb.win.requestAnimationFrame;
  G.cancelAnimationFrame = sb.win.cancelAnimationFrame;
  G.performance = sb.win.performance;
  G.setTimeout = setTimeout;
  const code = fs.readFileSync(path.join(ROOT, 'src', 'dd_opening.js'), 'utf8');
  /* globales para el script */
  G.DOMMatrix = DOMMatrix; G.Path2D = Path2D;
  /* El módulo hace document.createElement("canvas") y usa appendChild sobre body. */
  sb.doc.createElement = function (tag) {
    if (tag === 'canvas') return sb.mkWorkCanvas();
    return sb.mkDiv();
  };
  /* Devolvemos el lienzo principal cuando el módulo crea el suyo. */
  const fakeBody = { appendChild() {}, classList: sb.doc.body.classList, setAttribute() {}, removeAttribute() {} };
  sb.doc.body = fakeBody;
  /* El módulo pide el motor (DD_WORLD) para pintar el salón del Refugio; en el
     navegador real es global, aquí se carga en el mismo contexto. */
  if (opts && opts.withWorld) {
    /* El salón del Refugio sale del motor, y el motor lee los materiales del
       registro de recursos. Para que la hoja de contacto muestre el salón de
       VERDAD (y no un damero vacío), hay que cargar antes el registro. */
    const acode = fs.readFileSync(path.join(ROOT, 'src', 'dd_asset_registry.js'), 'utf8');
    const afn = new Function('window', 'document', 'Image', acode + '\n//# sourceURL=dd_asset_registry.js');
    afn(sb.win, sb.doc, sb.win.Image);
    sb.assets = sb.win.DD_ASSETS;
    const wcode = fs.readFileSync(path.join(ROOT, 'src', 'dd_world_renderer.js'), 'utf8');
    const wfn = new Function('window', 'document', wcode + '\n//# sourceURL=dd_world_renderer.js');
    wfn(sb.win, sb.doc);
    sb.world = sb.win.DD_WORLD;
    /* El HUB es la fuente de verdad del mobiliario y del encuadre. Sin él la
       llegada al Refugio se medía contra una sala vacía: los planos 13 y 14
       salían correctos y no se parecían al Refugio real. */
    try {
      const hcode = fs.readFileSync(path.join(ROOT, 'src', 'dd_hub_system.js'), 'utf8');
      const hfn = new Function('window', 'document', 'Image', hcode + '\n//# sourceURL=dd_hub_system.js');
      hfn(sb.win, sb.doc, sb.win.Image);
      sb.hub = sb.win.DD_HUB;
    } catch (e) { sb.hubError = String(e && e.message || e); }
  }
  const fn = new Function('window', 'document', 'Image', 'navigator', 'localStorage', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', code + '\n//# sourceURL=dd_opening.js');
  fn(sb.win, sb.doc, sb.win.Image, sb.win.navigator, sb.win.localStorage, sb.win.requestAnimationFrame, sb.win.cancelAnimationFrame, sb.win.performance);
  sb.op = sb.win.DD_OPENING;
  return sb.op;
}

function boot(opts) {
  opts = opts || {};
  const sb = makeSandbox(opts.w || 1280, opts.h || 720, opts.dpr || 1);
  loadModule(sb, opts);
  return sb;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Arranca una secuencia y deja la precarga lista. */
async function start(sb, kind, seek) {
  const ok = sb.op[kind === 'intro' ? 'playIntro' : 'playDescent'](function () {}, {});
  if (!ok) throw new Error('la secuencia no arrancó');
  /* Esperar a que estén TODOS los recursos. Con 700 ms fijos, en cuanto la
     cinemática pasó de 16 a 286 imágenes las primeras hojas salían negras.
     No basta un umbral fijo: el registro crece por tandas y 240 se alcanza
     mientras las últimas (hero, marm, back) siguen en vuelo. Se espera a que
     el contador se ESTABILICE, y después un margen. */
  let prev = -1, stable = 0;
  for (let i = 0; i < 200; i++) {
    await sleep(100);
    const n = sb.loaded.length;
    if (n === prev) { if (++stable >= 4) break; } else { stable = 0; prev = n; }
  }
  await sleep(300);
  sb.op.debugSeek(seek == null ? 0 : seek, true);
  await sleep(60);
  return sb;
}

function capture(sb, name, scale) {
  const src = sb.main();
  const k = scale || 1;
  const out = createCanvas(Math.round(src.width * k), Math.round(src.height * k));
  out.getContext('2d').drawImage(src, 0, 0, out.width, out.height);
  const file = path.join(OUT, name + '.jpg');
  fs.writeFileSync(file, out.toBuffer('image/jpeg', 84));
  return file;
}

function contact(sb, times, cols, name, scale) {
  const k = scale || 0.34;
  const mc = sb.main();
  const tw = Math.round(mc.width * k), th = Math.round(mc.height * k);
  const gap = 8, label = 20;
  const rows = Math.ceil(times.length / cols);
  const sheet = createCanvas(cols * (tw + gap) + gap, rows * (th + gap + label) + gap);
  const g = sheet.getContext('2d');
  g.fillStyle = '#111'; g.fillRect(0, 0, sheet.width, sheet.height);
  times.forEach(function (t, i) {
    sb.op.debugSeek(t, true);
    const x = gap + (i % cols) * (tw + gap), y = gap + Math.floor(i / cols) * (th + gap + label);
    g.drawImage(mc, x, y, tw, th);
    g.fillStyle = '#ffd400'; g.font = '14px sans-serif';
    g.fillText('t=' + Number(t).toFixed(2) + 's', x + 2, y + th + 15);
  });
  const file = path.join(OUT, name + '.jpg');
  fs.writeFileSync(file, sheet.toBuffer('image/jpeg', 84));
  return file;
}

module.exports = { boot, start, capture, contact, sleep, OUT, ROOT, makeSandbox };

/* ------------------------------------------------------------------ CLI -- */
if (require.main === module) {
  (async function () {
    const args = process.argv.slice(2);
    const cmd = args[0] || 'audit';
    const opt = {};
    args.filter((a) => /^--/.test(a)).forEach(function (a) {
      const m = a.match(/^--([^=]+)=(.*)$/); if (m) opt[m[1]] = m[2];
    });
    const plain = args.slice(1).filter((a) => !/^--/.test(a));
    const sb = boot({ w: +(opt.w || 1280), h: +(opt.h || 720), dpr: +(opt.dpr || 1), withWorld: !!opt.world });
    if (cmd === 'stills') {
      await start(sb, plain[0] === 'descent' ? 'descent' : 'intro', 0);
      const times = String(plain[1] || '1').split(',').map(Number);
      for (const t of times) {
        sb.op.debugSeek(t, true);
        console.log('fb', t, capture(sb, plain[0] + '_' + String(t).replace('.', '_'), +(opt.scale || 1)));
      }
    } else if (cmd === 'sheet') {
      const kind = /^(descent)/.test(plain[0]) ? 'descent' : 'intro';
      const times = plain.slice(1).filter((x) => !isNaN(+x)).map(Number);
      await start(sb, kind, 0);
      console.log('hoja', contact(sb, times, +(opt.cols || 4), (opt.name || kind + '_hoja'), +(opt.scale || 0.34)));
    } else if (cmd === 'audit') {
      await start(sb, 'intro', 0);
      const dur = sb.op.INTRO_DURATION;
      const rows = [];
      for (let t = 0; t < dur; t += 0.5) {
        sb.op.debugSeek(t, true);
        rows.push({ t: +t.toFixed(2), shot: sb.op.getState().shot });
      }
      console.log(JSON.stringify({ missing: sb.missing, loaded: sb.loaded.length, rows: rows.map((r) => r.t + ':' + r.shot).join(' ') }, null, 1));
    }
    console.log('cargadas', sb.loaded.length, '| ausentes', sb.missing.length);
    if (sb.missing.length) console.log('AUSENTES:', JSON.stringify(sb.missing));
  })();
}
