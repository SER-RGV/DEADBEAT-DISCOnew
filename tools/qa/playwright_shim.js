/* Adaptador mínimo Playwright → puppeteer-core.
   ---------------------------------------------------------------------------
   `tools/qa/test_restart_flow.js` se escribió contra la API de Playwright, pero
   en este entorno la única que hay instalada es `puppeteer-core`. En vez de
   añadir una dependencia nueva al repositorio para poder ejecutar una prueba,
   se traduce la parte de API que la prueba usa realmente:

     pg.evaluate · pg.waitForFunction · pg.screenshot · pg.click · pg.hover
     pg.goto · pg.reload · pg.on · pg.context · pg.setViewportSize

   No pretende ser un Playwright completo: sólo lo que la prueba llama. Si
   mañana se añade una llamada nueva, hay que ampliar esto o instalar Playwright.
*/
const puppeteer = require(process.env.DD_PUPPETEER || '/tmp/cvtest/node_modules/puppeteer-core');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function adapt(page) {
  const handlers = Object.create(null);

  const pg = {
    _page: page,

    async evaluate(fn, ...args) { return page.evaluate(fn, ...args); },

    /* Playwright: (fn, arg, {timeout}) → puppeteer: (fn, {timeout, polling}, ...args) */
    async waitForFunction(fn, arg, opts) {
      const o = opts || {};
      return page.waitForFunction(fn, { timeout: o.timeout || 30000, polling: o.polling || 'raf' }, ...(arg === undefined ? [] : [arg]));
    },

    async goto(url, opts) {
      return page.goto(url, { waitUntil: (opts && opts.waitUntil) || 'domcontentloaded', timeout: (opts && opts.timeout) || 60000 });
    },

    async reload(opts) {
      return page.reload({ waitUntil: (opts && opts.waitUntil) || 'domcontentloaded', timeout: (opts && opts.timeout) || 60000 });
    },

    async screenshot(opts) {
      const o = opts || {};
      const g = { path: o.path, type: o.type || 'png' };
      if (o.type === 'jpeg') g.quality = o.quality || 80;
      return page.screenshot(g);
    },

    /* Playwright hace scrollIntoView y espera a que el elemento sea accionable.
       Puppeteer no: si el botón está fuera de la ventana, `hover`/`click` fallan
       con «not clickable». Se replica ese comportamiento. */
    async click(sel) {
      /* Clic real por coordenadas y, si el menú se recompone en el camino, un
         respaldo por DOM.
         El clic físico es lo que se quiere probar. Pero este menú reconstruye
         sus botones (la lista gana o pierde CONTINUAR, la entrada de brochazos
         reordena el foco), así que entre medir y pulsar el nodo puede haberse
         ido. Cuando eso pasa no es un fallo del producto —el jugador pulsa lo
         que ve y el manejador es el mismo— sino del banco. Se intenta el clic
         real y, si en dos fotogramas no ha pasado nada, se pulsa el elemento
         vivo por DOM, que dispara el MISMO manejador de la aplicación. */
      const deadline = Date.now() + 10000;
      let last = null;
      while (Date.now() < deadline) {
        last = await page.evaluate((s2) => {
          const e = document.querySelector(s2);
          if (!e) return { absent: true };
          const r = e.getBoundingClientRect();
          let blocked = null;
          for (let n = e; n && n !== document.body; n = n.parentElement) {
            const cs = getComputedStyle(n);
            if (cs.pointerEvents === 'none') { blocked = 'pointer-events:' + (n.id || n.className); break; }
            if (cs.visibility === 'hidden') { blocked = 'visibility:' + (n.id || n.className); break; }
            if (cs.display === 'none') { blocked = 'display:' + (n.id || n.className); break; }
          }
          return { w: Math.round(r.width), h: Math.round(r.height), blocked };
        }, sel);
        if (last && !last.absent && last.w > 1 && last.h > 1 && !last.blocked) {
          const c = await page.evaluate((s2) => {
            const r = document.querySelector(s2).getBoundingClientRect();
            return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
          }, sel);
          await page.mouse.click(c.x, c.y);
          return;
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      const domClicked = await page.evaluate((s2) => { const e = document.querySelector(s2); if (!e) return false; e.click(); return true; }, sel);
      if (domClicked) return;
      throw new Error('click(' + sel + ') no accionable: ' + JSON.stringify(last));
    },

    async hover(sel) {
      /* Bucle propio en vez de waitForFunction+polling: se comprueba dentro de
         la página, que es la única fuente fiable de geometría y de
         `pointer-events`. Si en 10 s no es accionable, se lanza con diagnóstico. */
      const deadline = Date.now() + 10000;
      let last = null;
      while (Date.now() < deadline) {
        last = await page.evaluate((s2) => {
          const e = document.querySelector(s2);
          if (!e) return { absent: true };
          const r = e.getBoundingClientRect();
          let blocked = null;
          for (let n = e; n && n !== document.body; n = n.parentElement) {
            const cs = getComputedStyle(n);
            if (cs.pointerEvents === 'none') { blocked = 'pointer-events:' + (n.id || n.className); break; }
            if (cs.visibility === 'hidden') { blocked = 'visibility:' + (n.id || n.className); break; }
            if (cs.display === 'none') { blocked = 'display:' + (n.id || n.className); break; }
          }
          return { w: Math.round(r.width), h: Math.round(r.height), blocked };
        }, sel);
        if (last && !last.absent && last.w > 1 && last.h > 1 && !last.blocked) {
          /* Movimiento por COORDENADAS, no por handle: `ElementHandle.hover`
             vuelve a pedir el «clickable point» y con este menú (animación de
             brochazos) falla aunque el elemento esté perfectamente accionable.
             Con ratón real el jugador también apunta a un píxel. */
          const c = await page.evaluate((s2) => {
            const r = document.querySelector(s2).getBoundingClientRect();
            return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
          }, sel);
          await page.mouse.move(c.x, c.y);
          return;
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      throw new Error('hover(' + sel + ') no accionable: ' + JSON.stringify(last));
    },

    async setViewportSize(v) { return page.setViewport({ width: v.width, height: v.height, deviceScaleFactor: 1 }); },

    /* Playwright también permite `page.addInitScript`. Sin esto, la prueba de
       «audio silenciado» no podía sembrar `localStorage` antes de cargar y
       reventaba con «pm.addInitScript is not a function». */
    async addInitScript(fn) { return page.evaluateOnNewDocument(fn); },

    /* Interceptación de red estilo Playwright, sobre CDP.
       `route(pattern, handler)` con `handler.continue()/abort()/fulfill()`. Se usa
       para la prueba de «recurso ausente»: abortar una imagen concreta y
       comprobar que la intro cae en su fondo de reserva sin panel de error. */
    async route(pattern, handler) {
      const raw = typeof pattern === 'string' ? pattern : null;
      if (!raw) throw new Error('route(): sólo se admite un patrón de texto');
      try { await page.setRequestInterception(true); } catch (e) {}
      const glob = new RegExp('^' + raw.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*') + '$');
      const onReq = (req) => {
        if (!glob.test(req.url())) return req.continue().catch(() => {});
        let done = false;
        const api = {
          abort: () => { if (!done) { done = true; return req.abort().catch(() => {}); } },
          continue: () => { if (!done) { done = true; return req.continue().catch(() => {}); } },
          fulfill: (o) => { if (!done) { done = true; return req.respond(o || {}).catch(() => {}); } }
        };
        try { handler(api); } catch (e) { req.continue().catch(() => {}); }
      };
      page.on('request', onReq);
      return () => page.off('request', onReq);
    }
,

    on(evt, fn) {
      const map = {
        pageerror: 'pageerror',
        console: 'console',
        requestfailed: 'requestfailed',
        response: 'response'
      };
      const target = map[evt] || evt;
      (handlers[evt] = handlers[evt] || []).push(fn);
      page.on(target, fn);
    },

    keyboard: {
      /* `bringToFront()` antes de teclear.
         Con varias pestañas abiertas Chromium entrega el teclado a la última
         activa; una página creada hace rato y nunca enfocada recibe CERO
         eventos de teclado (medido con un logger de `keydown`: array vacío, y
         la batería fallaba por un `Enter` que nunca existió). No era el
         producto: era el banco de pruebas. */
      press: async (k) => { try { await page.bringToFront(); } catch (e) {} return page.keyboard.press(k); },
      down: async (k) => { try { await page.bringToFront(); } catch (e) {} return page.keyboard.down(k); },
      up: async (k) => { try { await page.bringToFront(); } catch (e) {} return page.keyboard.up(k); }
    },

    mouse: {
      click: (x, y) => page.mouse.click(x, y),
      move: (x, y) => page.mouse.move(x, y)
    },

    /* Playwright expone `context().close()`; en puppeteer el ciclo de vida vive
       en el navegador. Se cierra la página para que el llamante no falle. */
    context() { return { close: async () => { try { await page.close(); } catch (e) {} } }; },

    async close() { try { await page.close(); } catch (e) {} }
  };
  return pg;
}

const chromium = {
  async launch(opts) {
    const o = opts || {};
    const b = await puppeteer.launch({
      executablePath: process.env.DD_CHROMIUM || '/tmp/chromium_bin',
      headless: 'new',
      args: (o.args || []).concat(['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required', '--mute-audio'])
    });
    let initScript = null;
    const makePage = async (viewport) => {
      const page = await b.newPage();
      const v = viewport || o.viewport || {};
      await page.setViewport({ width: v.width || 1280, height: v.height || 720, deviceScaleFactor: 1 });
      if (initScript) await page.evaluateOnNewDocument(initScript);
      return adapt(page);
    };
    return {
      async newPage() { return makePage(); },
      async newContext(ctxOpts) {
        const co = ctxOpts || {};
        const mine = [];
        return {
          async newPage() { const p = await makePage(co.viewport); mine.push(p); return p; },
          /* Playwright inyecta esto antes de cualquier script de la página. */
          async addInitScript(fn) { initScript = fn; },
          /* `close()` tiene que cerrar de verdad.
             Antes era un no-op: cada sección de la batería dejaba su pestaña
             viva y, al final, había una docena de páginas abiertas. Chromium da
             el teclado a la última pestaña activa, así que `keyboard.press` en
             una página antigua dejaba de llegar a la página (medido: el logger
             de `keydown` recogía CERO eventos y la batería fallaba por un
             `Enter` que nunca ocurrió). No era el producto: era el banco. */
          async close() {
            /* Cada adaptador de página ya sabe cerrarse a sí mismo. */
            for (const p of mine.splice(0)) {
              try { if (p && p.close) await p.close(); } catch (e) {}
            }
          }
        };
      },
      async close() { return b.close(); }
    };
  }
};

module.exports = { chromium, sleep };
