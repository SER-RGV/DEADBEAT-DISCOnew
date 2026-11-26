/* MODIFICACIÓN PRIORITARIA · Auditoría visual del HUB T01–T08.
 * SÓLO LECTURA del juego (salvo toggles de capas ya existentes para A/B).
 * T09 se desactiva desde el arranque con su flag para aislar T01–T08.
 * Salida: ART_EVIDENCE/hub/legibilidad/ (+ JSON de inventario y A/B).
 */
const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '../../ART_EVIDENCE/hub/legibilidad');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';

const POS = [
  ['01_centro_spawn',1250,965], ['02_norte_cabina',1250,600], ['03_noroste_vip',820,640],
  ['04_noreste_vip',1680,640], ['05_oeste_arsenal',720,900], ['06_este_barra',1790,900],
  ['07_suroeste_arcade',700,1150], ['08_sureste_espejo',1820,1150],
  ['09_sur_pregrieta',1250,1250], ['10_borde_acantilado',1250,1420],
  ['11_borde_izq',900,1420], ['12_borde_der',1600,1420],
  ['13_pista_nw',1030,800], ['14_pista_se',1470,1080],
  ['15_corredor_oeste',900,700], ['16_corredor_este',1690,1010]
];
const AB_POS = [['centro',1250,965], ['sur',1250,1250], ['borde',1250,1420]];

async function boot(b, disableT09) {
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  if (disableT09) await c.addInitScript(() => { window.__DDM_HUB_T09 = false; });
  const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => { try { return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status); } catch(e){ return false; } }, { timeout: 90000 });
  await p.mouse.click(640,450); await p.waitForTimeout(400);
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.keyboard.down('Escape'); await p.waitForTimeout(1400); await p.keyboard.up('Escape');
  await p.waitForFunction(() => { try { return window.DMO_HUB.state().inHub; } catch(e){ return false; } }, { timeout: 30000 });
  await p.waitForTimeout(1900);
  return { c, p, errs };
}
const snap = p => p.evaluate(() => ({
  atmos: window.DMO_ATMOS.audit(),
  atmosCfg: JSON.parse(JSON.stringify(window.DMO_ATMOS.config)),
  t08: window.DMO_HUB_T08.state(),
  t07: window.DMO_HUB_T07.audit(),
  hub: window.DMO_HUB.audit(),
  hubState: window.DMO_HUB.state(),
  cam: window.DMO.camera()
}));
const domLayers = p => p.evaluate(() => {
  const out = [];
  document.querySelectorAll('canvas, [id*="atmos"], [class*="haze"], [class*="fog"], [class*="glow"], [id*="overlay"]').forEach(el => {
    const s = getComputedStyle(el);
    if (el.tagName === 'CANVAS' || /atmos|haze|fog|overlay|glow/i.test(el.id + ' ' + el.className)) {
      out.push({ tag: el.tagName, id: el.id, cls: String(el.className).slice(0,80),
        opacity: s.opacity, blend: s.mixBlendMode, z: s.zIndex, pos: s.position,
        display: s.display, w: el.width || null, h: el.height || null });
    }
  });
  return out;
});

(async () => {
  const b = await chromium.launch({ executablePath:'/tmp/chromium', headless:true,
    env:{...process.env, LD_LIBRARY_PATH:'/tmp/chromelibs/lib:/tmp'},
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader','--disable-background-networking'] });
  const { c, p, errs } = await boot(b, true);
  const R = { generatedAt:new Date().toISOString(), phase:'auditoría visual T01–T08 (T09 desactivada)', pageerrors:errs };

  /* ---------- inventario del HUB ---------- */
  R.inventory = await p.evaluate(() => {
    const o = {};
    const props = window.DMO_LAYOUT.props();
    o.props = props;
    const objs = window.DMO_LAYOUT.propObjects();
    o.propObjects = objs.map(q => ({ id:q.id, x:q.x, y:q.y, w:q.w, h:q.h, r:q.r,
      sortY:q.sortY, solid:q.solid, tall:q.tall, hubCustom:!!q.hubCustom,
      hasDraw:typeof q.hubDraw==='function' }));
    o.stations = window.DMO_HUB.stations();
    o.observe = window.DMO.observe();
    o.v5 = Object.keys(window.__DDM_V5_IMG||{}).length;
    o.canvasCount = document.querySelectorAll('canvas').length;
    return o;
  });
  R.domLayers = await domLayers(p);
  R.atmos = await snap(p);

  /* ---------- barrido de 16 posiciones ---------- */
  R.sweep = [];
  for (const [id,x,y] of POS) {
    await p.evaluate(([a,b2]) => window.DMO.debug.teleport(a,b2), [x,y]);
    await p.waitForTimeout(300);
    const f = 'sweep_' + id + '.jpg';
    await p.screenshot({ path: path.join(OUT,f), type:'jpeg', quality:88 });
    const st = await p.evaluate(() => ({ cam: window.DMO.camera(), t08: window.DMO_HUB_T08.state().visible }));
    R.sweep.push({ id, camera:[x,y], realCam:st.cam, t08Visible:st.t08, file:f });
  }

  /* ---------- A/B de capas de niebla ---------- */
  const VARIANTS = [
    ['base', () => {}],
    ['sin_atmos', () => { window.DMO_ATMOS.setEnabled(false); }],
    ['bloom_035', () => { const e=document.getElementById('ilt-atmos-bloom'); if(e) e.style.opacity='0.35'; }],
    ['vig_040', () => { const e=document.getElementById('ilt-atmos-vig'); if(e) e.style.opacity='0.40'; }],
    ['sin_grade_grano', () => { window.DMO_ATMOS.config.grade=0; window.DMO_ATMOS.config.grain=0; }],
    ['sin_T08', () => { window.__DDM_HUB_T08=false; }],
    ['combinado_legible', () => {
      window.DMO_ATMOS.setEnabled(true);
      const bl=document.getElementById('ilt-atmos-bloom'), vg=document.getElementById('ilt-atmos-vig');
      if(bl) bl.style.opacity='0.30'; if(vg) vg.style.opacity='0.45';
      window.DMO_ATMOS.config.grade=0.35; window.DMO_ATMOS.config.grain=0.006;
    }]
  ];
  R.ab = [];
  /* cada variante en un contexto nuevo para no arrastrar estado */
  for (const [variant, apply] of VARIANTS) {
    const cx = await b.newContext({ viewport:{width:1280,height:900} });
    await cx.addInitScript(() => { window.__DDM_HUB_T09 = false; });
    const pg = await cx.newPage();
    const er = []; pg.on('pageerror',e=>er.push(String(e)));
    await pg.goto(URL,{waitUntil:'load',timeout:180000});
    await pg.waitForFunction(()=>{try{return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status);}catch(e){return false;}},{timeout:90000});
    await pg.mouse.click(640,450); await pg.waitForTimeout(400);
    await pg.keyboard.press('Enter'); await pg.waitForTimeout(400);
    await pg.keyboard.down('Escape'); await pg.waitForTimeout(1400); await pg.keyboard.up('Escape');
    await pg.waitForFunction(()=>{try{return window.DMO_HUB.state().inHub;}catch(e){return false;}},{timeout:30000});
    await pg.waitForTimeout(1700);
    await pg.evaluate(apply);
    await pg.waitForTimeout(500);
    const files = [];
    for (const [nm,x,y] of AB_POS) {
      await pg.evaluate(([a,b2])=>window.DMO.debug.teleport(a,b2),[x,y]);
      await pg.waitForTimeout(300);
      const f = 'ab_' + variant + '_' + nm + '.jpg';
      await pg.screenshot({path:path.join(OUT,f),type:'jpeg',quality:90});
      files.push(f);
    }
    const st = await pg.evaluate(()=>({
      atmos:window.DMO_ATMOS.audit(),
      cfg:JSON.parse(JSON.stringify(window.DMO_ATMOS.config)),
      layers:(function(){const a=document.getElementById('ilt-atmos-bloom'),v=document.getElementById('ilt-atmos-vig');
        return {bloom:a?{opacity:getComputedStyle(a).opacity,display:getComputedStyle(a).display,blend:getComputedStyle(a).mixBlendMode}:null,
                vig:v?{opacity:getComputedStyle(v).opacity,display:getComputedStyle(v).display,blend:getComputedStyle(v).mixBlendMode}:null};})()
    }));
    R.ab.push({ variant, files, pageerrors:er, state:st });
    await cx.close();
  }

  /* ---------- geometría de la grieta y del descenso ---------- */
  R.descent = await p.evaluate(() => {
    const o = {};
    const st = window.DMO_HUB.stations().find(s=>s.id==='lift');
    o.liftStation = st;
    o.floorDrop = (function(){ try {
      const f=window.__DDM_T07 ? null : null; return null; } catch(e){ return null; } })();
    o.t07 = window.DMO_HUB_T07.state();
    o.hubState = window.DMO_HUB.state();
    o.propsSouth = window.DMO_LAYOUT.propObjects()
      .filter(q=>q.y>1200)
      .map(q=>({id:q.id,x:q.x,y:q.y,w:q.w,h:q.h,r:q.r,sortY:q.sortY,hubCustom:!!q.hubCustom}));
    o.v5Crack = (function(){ const i=window.__DDM_V5_IMG && window.__DDM_V5_IMG['hub_abyss_stair_crack'];
      return i?{w:i.naturalWidth,h:i.naturalHeight,complete:i.complete}:null; })();
    o.v5Abyss = Object.keys(window.__DDM_V5_IMG||{}).filter(k=>/abyss|grieta|crack|stair|precip|labio|pozo|borde/i.test(k));
    return o;
  });

  R.pageerrors = errs;
  fs.writeFileSync(path.join(OUT,'auditoria_legibilidad.json'), JSON.stringify(R,null,2)+'\n');
  console.log('sweep',R.sweep.length,'| A/B variantes',R.ab.length,'| props',R.inventory.propObjects.length);
  console.log('atmos',JSON.stringify(R.atmos.atmos.config),'degraded',R.atmos.atmos.degraded);
  console.log('DOM capas',R.domLayers.length,'| pageerrors',errs.length);
  console.log('lift',JSON.stringify(R.descent.liftStation));
  console.log('props sur',R.descent.propsSouth.length,'| v5 grieta',JSON.stringify(R.descent.v5Abyss));
  await c.close(); await b.close();
})().catch(e=>{console.error('FATAL',e);process.exit(2);});
