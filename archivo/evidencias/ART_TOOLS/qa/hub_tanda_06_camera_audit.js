/* ============================================================================
 * HUB · TANDA 06 — FASE 1 · AUDITORÍA DE CÁMARA / PROYECCIÓN REAL
 * ----------------------------------------------------------------------------
 * Mide en el juego real (Chromium + Playwright-core):
 *   · matriz getTransform() de drawImage (cámara real, no isometría teórica)
 *   · DMO.camera() / DMO.semi2d (zoom, límites, escala por profundidad)
 *   · transform del suelo cacheado 1920x1320 en (290,265)
 *   · 4 capturas de zonas representativas para la prueba de composición
 * NO modifica el juego: proxy de solo lectura sobre drawImage.
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core CHROME_PATH=/tmp/chromium \
 *   LD_LIB_PATH=/tmp/chromelibs/lib:/tmp \
 *   node ART_TOOLS/qa/hub_tanda_06_camera_audit.js
 * ==========================================================================*/
const { chromium } = require(process.env.QA_LIB || 'playwright-core');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_06');
fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.GAME_URL || 'http://127.0.0.1:8123/';

const INIT = `(() => {
  const P = window.__CAM = { transforms: [], tagged: [], floor: [] };
  const orig = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src) {
    try {
      let m; try { m = this.getTransform(); } catch (e) { m = null; }
      if (m) {
        const t = [m.a,m.b,m.c,m.d,m.e,m.f].map(v=>+v.toFixed(5));
        const key = t.join(',');
        const rec = { t, canvas: [this.canvas.width,this.canvas.height],
                      args: [].slice.call(arguments,1,5).map(v=>Math.round(v)) };
        const tag = src && (src.__hubTanda05||src.__hubTanda04||src.__hubTanda03||
                            src.__hubTanda02||src.__hubTanda01);
        if (tag) P.tagged.push({tag,t,canvas:rec.canvas,args:rec.args});
        if (src && src.width===1920 && src.height===1320) P.floor.push(rec);
        if (P.transforms.length<40 && P.transforms.indexOf(key)<0) P.transforms.push(key);
      }
    } catch (e) {}
    return orig.apply(this, arguments);
  };
})()`;

const ZONES = [['norte',1250,330],['vip_oeste',785,545],['vip_este',1715,545],
               ['pared_oeste',450,965],['pared_este',2050,965],['centro',1250,935]];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIB_PATH || '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader',
           '--disable-background-networking','--disable-logging','--log-level=3']
  });
  const ctx = await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  const resp = await page.goto(URL,{waitUntil:'load',timeout:180000});
  await page.waitForFunction(()=>{
    try { return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status); }
    catch(e){ return false; }
  },{timeout:90000});
  await page.mouse.click(640,450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(900);

  const out = { generatedAt: new Date().toISOString(), url: URL,
    htmlStatus: resp && resp.status(), environment:{}, zones:{} };
  out.environment = await page.evaluate(()=>({
    innerWidth:innerWidth, innerHeight:innerHeight, dpr:devicePixelRatio,
    gameCanvas:[document.getElementById('game').width,document.getElementById('game').height],
    camera: window.DMO.camera ? window.DMO.camera() : null,
    semi2d: window.DMO_SEMI2D ? {
      worldTop:window.DMO_SEMI2D.WORLD_TOP, worldBottom:window.DMO_SEMI2D.WORLD_BOTTOM,
      scale300:window.DMO_SEMI2D.scaleFor(300), scale700:window.DMO_SEMI2D.scaleFor(700),
      scale1200:window.DMO_SEMI2D.scaleFor(1200), scale1500:window.DMO_SEMI2D.scaleFor(1500),
      depth300:window.DMO_SEMI2D.depthOf(300), depth1200:window.DMO_SEMI2D.depthOf(1200)
    } : null,
    hubAudit: window.DMO_HUB.audit(),
    hubState: { version:window.DMO_HUB.state().version, inHub:window.DMO_HUB.state().inHub,
                location:window.DMO_HUB.state().location }
  }));

  for (const [name,x,y] of ZONES) {
    await page.evaluate(([x,y])=>{
      try{ window.DMO.debug.teleport(x,y); }catch(e){}
      try{ window.DMO.debug.tick(0.016,30); }catch(e){}
    },[x,y]);
    await page.waitForTimeout(900);
    await page.evaluate(()=>{ window.__CAM.transforms=[]; window.__CAM.tagged=[]; window.__CAM.floor=[]; });
    await page.waitForTimeout(450);
    out.zones[name] = await page.evaluate(()=>({
      camera: window.DMO.camera(),
      transforms: window.__CAM.transforms.slice(0,12),
      floorTransforms: window.__CAM.floor.slice(0,3),
      taggedSample: window.__CAM.tagged.slice(0,6),
      taggedCanvas: [...new Set(window.__CAM.tagged.map(t=>t.canvas.join('x')))],
      debug: { px:window.DMO.debug.state().px, py:window.DMO.debug.state().py }
    }));
    await page.screenshot({path:path.join(OUT,'camera_audit_'+name+'.png')});
    console.log('[TANDA06/CAM]',name,JSON.stringify(out.zones[name].camera));
  }
  fs.writeFileSync(path.join(OUT,'camera_audit_runtime.json'),JSON.stringify(out,null,2)+'\n');
  await ctx.close(); await browser.close();
})().catch(e=>{ console.error('CAMERA AUDIT FAIL',e); process.exit(1); });
