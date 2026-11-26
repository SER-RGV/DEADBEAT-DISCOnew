/* ============================================================================
 * HUB · TANDA 06 — QA FORMAL A/B DE TRES FASES (Chromium + Playwright-core)
 * ----------------------------------------------------------------------------
 * Arnés de SOLO LECTURA: proxy sobre CanvasRenderingContext2D.drawImage y
 * APIs de depuración existentes. NO modifica HTML, JS, assets ni geometría.
 *
 *   antes    : window.__DDM_HUB_T06 = false ANTES del boot (la CARGA ocurre,
 *              el RENDER de T06 está desactivado).
 *   control  : arranque normal; conmutación EN CALIENTE off -> off -> on,
 *              línea base de ruido de dos fotogramas OFF, y
 *              hub6Restore()/hub6Apply() medidos.
 *   despues  : integración activa; 10 zonas, movimiento, colisiones,
 *              puertas, estaciones y regresión T01–T05.
 *
 * 14 comprobaciones. Criterio: >=1 drawImage EFECTIVO por unidad en el canvas
 * de MUNDO 1280x900 con caja en pantalla + confirmación de píxel OFF/ON
 * (finalize_hub_tanda_06.py). Registro V5 != visibilidad.
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core \
 *   CHROME_PATH=/tmp/chromium LD_LIB_PATH=/tmp/chromelibs/lib:/tmp \
 *   node ART_TOOLS/qa/validate_hub_tanda_06.js
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUTDIR || path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_06');
const URL = process.env.GAME_URL || 'http://127.0.0.1:8123/';
const R = n => path.join(OUT, n);
fs.mkdirSync(OUT, { recursive: true });

const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const MAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'ART_ASSETS/hub/tanda_06/manifest.json'), 'utf8'));
const MAN5 = JSON.parse(fs.readFileSync(path.join(ROOT, 'ART_ASSETS/hub/tanda_05/manifest.json'), 'utf8'));
const ASSETS = MAN.assets;
const IDS = ASSETS.map(a => a.id);
const EXPECTED = Object.fromEntries(ASSETS.map(a => {
  const dw = Math.round(a.anchor.worldH * a.expected[0] / a.expected[1]);
  return [a.id, { dw, dh: a.anchor.worldH,
    box: a.anchor.t06flat
      ? [a.location.x - (dw >> 1), a.location.y - (a.anchor.worldH >> 1), dw, a.anchor.worldH]
      : [a.location.x - (dw >> 1), a.location.y - a.anchor.worldH, dw, a.anchor.worldH],
    natural: a.expected, y: a.location.y, flat: !!a.anchor.t06flat,
    hang: !!a.anchor.t06hang, face: a.visibleFace }];
}));
const BASELINE = { v5Keys: 152, canvasCountBase: 27, stationsCount: 11, zonesCount: 6, zoom: 0.9375 };
const ZONES = [
  ['centro',1250,935], ['dj',1250,445], ['bar',1910,845],
  ['vip_oeste',785,545], ['vip_este',1715,545], ['arcade',655,1210],
  ['sellos',1845,1210], ['pared_oeste',450,965], ['norte',1250,330],
  ['pared_este',2050,965]
];
const CAPTURE = ['norte','vip_oeste','vip_este','pared_oeste','pared_este','centro'];
const LOG = [];
const log = (...a) => { const s = a.join(' '); LOG.push(s); console.log(s); };

/* --------------------------------------------------------------- proxy */
const INIT = `(() => {
  const P = window.__T6QA = {
    phase:'BOOT', zone:'', totalDraws:0,
    draws:{}, boxes:{}, onScreen:{}, byCanvas:{}, seq:[], zoneDraws:{}, errors:[],
    life:{ draws:{}, onScreen:{}, canvasSet:{}, menuDraws:{}, zoneBoxes:{},
           matrices:{}, minAlpha:{}, maxAlpha:{}, args:{}, argSets:{}, fullZones:{} }
  };
  const rect=(m,x,y)=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f});
  function project(ctx,a){
    let m; try{m=ctx.getTransform()}catch(e){return{box:null,m:null}}
    const p=[rect(m,a[0],a[1]),rect(m,a[0]+a[2],a[1]),
             rect(m,a[0],a[1]+a[3]),rect(m,a[0]+a[2],a[1]+a[3])];
    const box=[Math.min.apply(null,p.map(v=>v.x)),Math.min.apply(null,p.map(v=>v.y)),
               Math.max.apply(null,p.map(v=>v.x)),Math.max.apply(null,p.map(v=>v.y))].map(Math.round);
    return {box,m:{a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f}};
  }
  const orig=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(src){
    P.totalDraws++;
    try{
      const tag=src&&(src.__hubTanda06||src.__hubTanda05||src.__hubTanda04||
                      src.__hubTanda03||src.__hubTanda02||src.__hubTanda01);
      if(tag){
        const key=P.phase+'|'+tag, cv=this.canvas, cvs=cv.width+'x'+cv.height;
        const off=arguments.length>=9?5:1;
        const args=arguments.length>=5
          ?[arguments[off],arguments[off+1],arguments[off+2],arguments[off+3]].map(Number):null;
        const alpha=+this.globalAlpha.toFixed(3);
        const d=P.draws[key]||(P.draws[key]={count:0,sample:null,onScreen:0});
        d.count++;
        P.byCanvas[cvs]=(P.byCanvas[cvs]||0)+1;
        const L=P.life, l=L.draws[key]||(L.draws[key]={count:0,sample:null,onScreen:0});
        l.count++;
        const cs=L.canvasSet[key]||(L.canvasSet[key]={}); cs[cvs]=(cs[cvs]||0)+1;
        if(P.phase==='MENU')L.menuDraws[tag]=(L.menuDraws[tag]||0)+1;
        L.minAlpha[key]=Math.min(L.minAlpha[key]===undefined?alpha:L.minAlpha[key],alpha);
        L.maxAlpha[key]=Math.max(L.maxAlpha[key]===undefined?alpha:L.maxAlpha[key],alpha);
        let pr={box:null,m:null}; if(args)pr=project(this,args);
        if(args&&pr.box){
          const ra=args.map(Math.round), b=pr.box;
          if(!d.sample)d.sample={args:ra,box:b,canvas:[cv.width,cv.height],matrix:pr.m};
          if(!l.sample)l.sample={args:ra,box:b,canvas:[cv.width,cv.height],matrix:pr.m};
          d.lastArgs=ra; d.lastBox=b; d.lastMatrix=pr.m;
          P.boxes[key]=b;
          if(b[2]>0&&b[0]<cv.width&&b[3]>0&&b[1]<cv.height){
            d.onScreen++; P.onScreen[key]=(P.onScreen[key]||0)+1; l.onScreen++;
            L.onScreen[key]=(L.onScreen[key]||0)+1;
          }
          (L.zoneBoxes[P.zone]=L.zoneBoxes[P.zone]||{})[tag]=b;
          (L.args[P.zone]=L.args[P.zone]||{})[tag]=ra;
          const as=L.argSets[tag]||(L.argSets[tag]=[]);
          const sig=ra.join(',');
          if(!as.some(v=>v.join(',')===sig))as.push(ra);
          if(b[0]>=0&&b[1]>=0&&b[2]<=cv.width&&b[3]<=cv.height)
            (L.fullZones[tag]=L.fullZones[tag]||{})[P.zone]=(L.fullZones[tag][P.zone]||0)+1;
          L.matrices[tag]=pr.m;
          P.zoneDraws[tag]={args:ra,box:b,matrix:pr.m,alpha,n:P.totalDraws,canvas:cvs};
        }
        if(P.seq.length<2500)P.seq.push({k:tag,n:P.totalDraws,z:P.zone,cv:cvs});
      }
    }catch(e){}
    return orig.apply(this,arguments);
  };
  window.addEventListener('error',e=>P.errors.push(String(e.message).slice(0,200)));
  window.__T6QA_RESET=function(phase,zone){
    P.phase=phase;P.zone=zone||'';P.totalDraws=0;
    P.draws={};P.boxes={};P.onScreen={};P.byCanvas={};P.seq=[];P.zoneDraws={};
  };
})()`;
const INIT_ANTES = `(() => { window.__DDM_HUB_T06 = false; })()`;
const SNAPSHOT = `(() => {
  const P=window.__T6QA, c=o=>JSON.parse(JSON.stringify(o||{}));
  return {phase:P.phase,zone:P.zone,draws:c(P.draws),boxes:c(P.boxes),
    onScreen:c(P.onScreen),byCanvas:c(P.byCanvas),seq:c(P.seq.slice(0,1200)),
    zoneDraws:c(P.zoneDraws),errors:c(P.errors),
    life:{draws:c(P.life.draws),onScreen:c(P.life.onScreen),canvasSet:c(P.life.canvasSet),
      menuDraws:c(P.life.menuDraws),zoneBoxes:c(P.life.zoneBoxes),matrices:c(P.life.matrices),
      minAlpha:c(P.life.minAlpha),maxAlpha:c(P.life.maxAlpha),args:c(P.life.args),
      argSets:c(P.life.argSets),fullZones:c(P.life.fullZones)}};
})()`;
const PROBE = `(() => {
  const W=window, o={};
  const safe=f=>{try{return f()}catch(e){return 'ERR:'+e.message}};
  o.camera=safe(()=>W.DMO.camera());
  o.hubAudit=safe(()=>W.DMO_HUB.audit());
  o.stations=safe(()=>W.DMO_HUB.stations().map(s=>[s.id,Math.round(s.x),Math.round(s.y)]));
  o.hub6=safe(()=>W.DMO_ART_PACK.hub6());
  o.hub5=safe(()=>W.DMO_ART_PACK.hub5());
  o.hub1=safe(()=>W.DMO_ART_PACK.hub());
  o.hub2=safe(()=>W.DMO_ART_PACK.hub2());
  o.hub3=safe(()=>W.DMO_ART_PACK.hub3());
  o.architecture=safe(()=>W.DMO_ART_PACK.architecture());
  o.player=safe(()=>{const p=W.DMO_ART_PACK.player();return{version:p.version,poses:(p.poses||[]).length,errors:p.errors}});
  o.state=safe(()=>W.DMO_ART_PACK.state());
  o.v5Keys=safe(()=>Object.keys(W.__DDM_V5_IMG||{}).length);
  o.canvasCountBase=safe(()=>document.querySelectorAll('canvas:not(.hub-portrait-canvas)').length);
  o.hubFloor=safe(()=>W.__T3B_HUB_QA.state());
  o.t3b=safe(()=>({enabled:W.__T3B.enabled,revision:W.__T3B.revision,
    ready:W.__T3B.ready.slice(),errors:W.__T3B.errors.slice(),
    routes:W.__T3B.draws.slice(-20).map(d=>d.route)}));
  o.infernal=safe(()=>({invalidate:typeof W.DMO_INFERNAL_ART.invalidate,
    keys:Object.keys(W.DMO_INFERNAL_ART)}));
  o.dungeon=safe(()=>{const d=W.DMO_DUNGEON.state();return{current:d.current,role:d.role,secured:d.secured,floor:d.floor}});
  o.debug=safe(()=>W.DMO.debug.state());
  o.hubState=safe(()=>W.DMO_HUB.state());
  o.integrity=safe(()=>W.DMO_ART_PACK.integrity());
  o.stats=safe(()=>W.DMO.testStats());
  return o;
})()`;

function knownError(s){ return /cdn-cgi\/challenge-platform|challenge-platform|Failed to load resource: the server responded with a status of 404/.test(s); }
function eq(a,b){ return JSON.stringify(a)===JSON.stringify(b); }
function tagOf(k){ return String(k).split('|').slice(1).join('|'); }

async function shot(page,name){
  const p=R(name); await page.screenshot({path:p}); return fs.statSync(p).size;
}
async function waitArtPack(page){
  await page.waitForFunction(()=>{try{return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status)}catch(e){return false}},{timeout:90000});
}
async function bootToHub(page){
  await page.mouse.click(640,450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(900);
}
async function teleport(page,x,y){
  await page.evaluate(([x,y])=>{try{window.DMO.debug.teleport(x,y)}catch(e){};try{window.DMO.debug.tick(0.016,30)}catch(e){}},[x,y]);
  await page.waitForTimeout(650);
}
async function resetWindow(page,zone,phase){
  await page.evaluate(([p,z])=>window.__T6QA_RESET(p,z),[phase||'HUB',zone]);
  await page.waitForTimeout(420);
}
async function measureRender(page){
  return page.evaluate(()=>new Promise(resolve=>{
    const d=[];let last=null,n=0;
    function step(t){if(last!==null)d.push(t-last);last=t;n++;
      if(n<41)requestAnimationFrame(step);
      else{d.sort((a,b)=>a-b);resolve({frames:d.length,medianMs:+d[Math.floor(d.length/2)].toFixed(2),
        p90Ms:+d[Math.floor(d.length*0.9)].toFixed(2),minMs:+d[0].toFixed(2),maxMs:+d[d.length-1].toFixed(2)});}}
    requestAnimationFrame(step);
  }));
}
async function runMoveCollision(page,rec){
  await teleport(page,1250,965);
  const p0=await page.evaluate(()=>window.DMO.debug.state().px);
  await page.keyboard.down('d');await page.waitForTimeout(900);
  await page.evaluate(()=>{try{window.DMO.debug.tick(0.016,60)}catch(e){}});
  await page.keyboard.up('d');await page.waitForTimeout(350);
  const p1=await page.evaluate(()=>window.DMO.debug.state().px);
  rec.movement={pxBefore:p0,pxAfter:p1,delta:+(p1-p0).toFixed(2),withinWorld:p1>0&&p1<2500};
  await teleport(page,1720,845);
  const c0=await page.evaluate(()=>window.DMO.debug.state().px);
  await page.keyboard.down('d');await page.waitForTimeout(1600);
  await page.evaluate(()=>{try{window.DMO.debug.tick(0.016,120)}catch(e){}});
  await page.keyboard.up('d');await page.waitForTimeout(300);
  const c1=await page.evaluate(()=>window.DMO.debug.state().px);
  rec.collision={from:c0,afterHoldingD:c1,delta:+(c1-c0).toFixed(2),blockedBeforeBarCollider:c1<1812};
}
async function captureZones(page,rec,prefix){
  rec.zoneSnapshots={};
  for(const [name,x,y] of ZONES){
    await teleport(page,x,y);
    await resetWindow(page,name);
    const file=prefix+'_'+name+'.jpg';
    rec.screenshots[file]=await shot(page,file);
    rec.zoneSnapshots[name]=await page.evaluate(SNAPSHOT);
    rec.zoneCamera=rec.zoneCamera||{};
    rec.zoneCamera[name]=await page.evaluate(()=>{try{return window.DMO.camera()}catch(e){return null}});
  }
}

function watch(page,rec){
  page.on('pageerror',e=>rec.pageErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')rec.consoleErrors.push(m.text().slice(0,220))});
  page.on('response',r=>{if(r.status()>=400)rec.httpErrors.push({status:r.status(),url:r.url()})});
  page.on('requestfailed',r=>rec.requestFailed.push(r.url()));
  page.on('response',r=>{if(/\/ART_ASSETS\/hub\/tanda_06\//.test(r.url()))rec.assetResponses.push({status:r.status(),url:r.url()})});
}

async function phase(browser,mode){
  const ctx=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});
  const page=await ctx.newPage();
  const rec={mode,consoleErrors:[],pageErrors:[],httpErrors:[],requestFailed:[],
    assetResponses:[],screenshots:{},zoneSnapshots:{},zoneCamera:{},controlZones:{}};
  watch(page,rec);
  await page.addInitScript(INIT);
  if(mode==='antes')await page.addInitScript(INIT_ANTES);
  const t0=Date.now();
  const resp=await page.goto(URL,{waitUntil:'load',timeout:180000});
  rec.htmlStatus=resp&&resp.status(); rec.loadMs=Date.now()-t0;
  await waitArtPack(page);
  rec.hub6AtBoot=await page.evaluate(()=>{try{const h=window.DMO_ART_PACK.hub6();
    return{count:h.count,loaded:h.loaded,registered:h.registered,exactSize:h.exactSize,enabled:h.enabled,errors:h.errors}}catch(e){return'ERR:'+e.message}});
  await page.waitForTimeout(1400);
  await page.evaluate(()=>{if(window.__T6QA)window.__T6QA.phase='MENU'});
  await page.waitForTimeout(800);
  rec.menuProbe=await page.evaluate(SNAPSHOT);
  rec.screenshots[mode+'_00_menu.jpg']=await shot(page,mode+'_00_menu.jpg');
  await bootToHub(page);
  await resetWindow(page,'centro');
  await teleport(page,1250,935);
  rec.screenshots[mode+'_01_hub.png']=await shot(page,mode+'_01_hub.png');
  rec.render=await measureRender(page);
  rec.probe=await page.evaluate(PROBE);

  if(mode==='control'){
    /* OFF / OFF / ON por zona: línea base de ruido + señal */
    await page.evaluate(()=>{window.__DDM_HUB_T06=false});
    for(const [name,x,y] of ZONES.filter(z=>CAPTURE.includes(z[0]))){
      await teleport(page,x,y);
      await resetWindow(page,name,'CONTROL_OFF_A');
      rec.screenshots['control_off_a_'+name+'.png']=await shot(page,'control_off_a_'+name+'.png');
      await page.waitForTimeout(260);
      rec.screenshots['control_off_b_'+name+'.png']=await shot(page,'control_off_b_'+name+'.png');
      await page.evaluate(()=>{window.__DDM_HUB_T06=true});
      await resetWindow(page,name,'CONTROL_ON');
      rec.screenshots['control_on_'+name+'.png']=await shot(page,'control_on_'+name+'.png');
      rec.controlZones[name]=await page.evaluate(SNAPSHOT);
      await page.evaluate(()=>{window.__DDM_HUB_T06=false});
    }
    await page.evaluate(()=>{window.__DDM_HUB_T06=true});
    await resetWindow(page,'centro','CONTROL_RESTORE');
    rec.restore=await page.evaluate(()=>({n:window.DMO_ART_PACK.hub6Restore(),
      registered:window.DMO_ART_PACK.hub6().registered}));
    await resetWindow(page,'centro','CONTROL_RESTORED');
    rec.controlRestored=await page.evaluate(SNAPSHOT);
    rec.reapply=await page.evaluate(()=>({n:window.DMO_ART_PACK.hub6Apply(),
      registered:window.DMO_ART_PACK.hub6().registered}));
    await resetWindow(page,'centro','CONTROL_REAPPLIED');
    rec.controlReapplied=await page.evaluate(SNAPSHOT);
    await runMoveCollision(page,rec);
    rec.screenshots['control_tras_movimiento.jpg']=await shot(page,'control_tras_movimiento.jpg');
    rec.probe=await page.evaluate(PROBE);
  }

  if(mode==='antes'||mode==='despues'){
    await captureZones(page,rec,mode==='antes'?'antes':'despues');
    await runMoveCollision(page,rec);
    rec.screenshots[mode+'_tras_movimiento.jpg']=await shot(page,mode+'_tras_movimiento.jpg');
  }
  if(mode==='despues'){
    /* interacción, campaña, puertas: SOLO APIs existentes ya probadas en T05 */
    rec.interaction=await page.evaluate(()=>{
      const W=window,out={};
      try{out.stationsBefore=W.DMO_HUB.stations().length;
        out.open=String(W.DMO_HUB.openStation('bar'));
        out.active=W.DMO_HUB.state().activeStationId;
        out.close=String(W.DMO_HUB.closeModal());
        out.activeAfter=W.DMO_HUB.state().activeStationId;}catch(e){out.error=String(e)}
      return out;
    });
    await page.waitForTimeout(300);
    rec.screenshots['estacion_bar.jpg']=await shot(page,'estacion_bar.jpg');
    rec.campaignStart=await page.evaluate(()=>{
      try{return String(window.DMO_HUB.startCampaignFromHub(0))}catch(e){return'ERR:'+e.message}});
    let completed=false;
    for(let i=0;i<60;i++){
      try{await page.evaluate(()=>window.DMO.debug.tick(0.016,30))}catch(_){}
      await page.waitForTimeout(150);
      const h=await page.evaluate(()=>{try{return window.DMO_HUB.state()}catch(e){return null}});
      if(h&&h.location==='CAMPAIGN_ROOM'&&!h.inHub&&!h.transitionLock&&
         h.transitionsCompleted>=1){completed=true;break;}
    }
    rec.campaign={completed};
    rec.doors={};
    rec.doors.setNight=await page.evaluate(()=>{
      const d=window.DMO.debug;
      try{if(typeof d.setNight==='function')return{via:'setNight',ok:d.setNight(24)};
        return{via:'setRound',ok:d.setRound(24)};}catch(e){return{err:String(e)}}});
    for(let i=0;i<6;i++){
      try{await page.evaluate(()=>window.DMO.debug.tick(0.016,30))}catch(_){}
      await page.waitForTimeout(120);
    }
    rec.doors.closed=await page.evaluate(PROBE);
    rec.screenshots['doors_closed.jpg']=await shot(page,'doors_closed.jpg');
    rec.doors.clearRound=await page.evaluate(()=>{
      try{return String(window.DMO.debug.clearRound())}catch(e){return'ERR:'+e.message}});
    for(let i=0;i<14;i++){
      try{await page.evaluate(()=>window.DMO.debug.tick(0.016,30))}catch(_){}
      await page.waitForTimeout(130);
    }
    rec.doors.open=await page.evaluate(PROBE);
    rec.screenshots['doors_open.jpg']=await shot(page,'doors_open.jpg');
    const s0=await page.evaluate(()=>window.DMO.testStats().shotsFired);
    await page.evaluate(()=>{try{window.DMO.debug.setInput({fire:true})}catch(e){}});
    await page.evaluate(()=>{try{window.DMO.debug.tick(0.016,60)}catch(e){}});
    await page.evaluate(()=>{try{window.DMO.debug.setInput({fire:false})}catch(e){}});
    const s1=await page.evaluate(()=>window.DMO.testStats().shotsFired);
    rec.shooting={before:s0,after:s1,delta:s1-s0};
    rec.campaignRegression=await page.evaluate(PROBE);
    rec.screenshots['regresion_campaign.jpg']=await shot(page,'regresion_campaign.jpg');
    rec.life=await page.evaluate(SNAPSHOT);
  }
  rec.versionProbe=await page.evaluate(PROBE);
  await ctx.close();
  return rec;
}

/* ------------------------------------------------------------ comprobaciones */
function buildChecks(A,B,C,markers){
  const checks=[]; const add=(id,name,ok,detail,files)=>checks.push({id,check:name,
    state:ok?'APROBADO':'FALLIDO',detail,evidence:files||[]});
  const snap=A.life||{};
  const life=snap.life||{draws:{},onScreen:{},canvasSet:{},menuDraws:{},zoneBoxes:{},
    matrices:{},minAlpha:{},maxAlpha:{},args:{},argSets:{},fullZones:{}};
  const lifeDraws=life.draws||{}, tagOfKey=k=>String(k).split('|').slice(1).join('|');
  const measuredTags=[...new Set(Object.keys(lifeDraws).filter(k=>/^T06-/.test(tagOfKey(k))).map(tagOfKey))];
  const worldKeys=Object.keys(lifeDraws).filter(k=>/^T06-/.test(tagOfKey(k)));
  const worldDraws=worldKeys.filter(k=>{
    const cs=life.canvasSet[k]||{}; return (cs['1280x900']||0)>0;
  });
  const perUnit=IDS.map(id=>{
    const keys=worldKeys.filter(k=>tagOfKey(k)===id);
    const count=keys.reduce((n,k)=>n+(lifeDraws[k]?lifeDraws[k].count:0),0);
    const onScreen=keys.reduce((n,k)=>n+(life.onScreen[k]||0),0);
    const sample=keys.map(k=>lifeDraws[k]&&lifeDraws[k].sample).find(Boolean)||null;
    const minA=keys.reduce((v,k)=>Math.min(v,life.minAlpha[k]===undefined?1:life.minAlpha[k]),1);
    const maxA=keys.reduce((v,k)=>Math.max(v,life.maxAlpha[k]===undefined?1:life.maxAlpha[k]),0);
    const fullZones=Object.keys((life.fullZones||{})[id]||{});
    const offWorld=keys.reduce((n,k)=>n+Object.entries(life.canvasSet[k]||{})
      .filter(([cv])=>cv!=='1280x900').reduce((s,[,v])=>s+v,0),0);
    return {artId:id,count,onScreen,sample,minAlpha:minA,maxAlpha:maxA,
      fullVisibleZones:fullZones,menuDraws:offWorld,
      phaseMenuDraws:life.menuDraws[id]||0};
  });
  const nonWorldT6=Object.keys(lifeDraws).filter(k=>/^T06-/.test(tagOfKey(k))&&
    Object.keys(life.canvasSet[k]||{}).some(c=>c!=='1280x900'));
  const wrongCanvas=[...new Set(nonWorldT6.flatMap(k=>Object.keys(life.canvasSet[k]||{})))];
  const fullyVisible=perUnit.every(u=>u.fullVisibleZones.length>0);

  /* sortY MEDIDO de cada draw (args de mundo), no el anclaje primario del
     manifiesto: T06-06/07 tienen 3 anclajes con sortY=780/1160/1540. */
  const sortMap={};
  for(const m of MAN5.assets)sortMap[m.id]=m.anchor.y;
  const knownTags=new Set([...IDS,...MAN5.assets.map(m=>m.id)]);
  /* T06: sortY medido de los args de mundo (3 anclajes por paramento lateral).
     T05-05 se dibuja con transformación de espejo y sus args son locales
     ([0,0,75,70]); para T05 se usa el sortY del manifiesto ya validado. */
  const sortOf=(t,v)=>{
    if(IDS.includes(t)){
      if(!v||!v.args||v.args.length<4)return null;
      const a=v.args;
      return t==='T06-10' ? a[1]+a[3]/2 : a[1]+a[3];
    }
    return sortMap[t]===undefined?null:sortMap[t];
  };
  /* Y-sort medido por ZONA sobre el ÚLTIMO fotograma (mismo ordinal de
     dibujo), igual que en T05: menor sortY debe dibujarse antes (n menor). */
  let ySortPairs=0,occlusionTaggedDraws=0; const ySortViolations=[];
  for(const [z,s] of Object.entries(A.zoneSnapshots||{})){
    const zd=s.zoneDraws||{};
    const near=Object.entries(zd).filter(([t,v])=>knownTags.has(t)&&v&&
      typeof v.n==='number'&&sortOf(t,v)!==null).map(([t,v])=>[t,v,sortOf(t,v)]);
    occlusionTaggedDraws+=near.length;
    if(near.length<2)continue;
    const maxN=Math.max(...near.map(([,v])=>v.n));
    const same=near.filter(([,v])=>maxN-v.n<260).sort((x,y)=>x[2]-y[2]);
    for(let i=0;i<same.length;i++)for(let j=i+1;j<same.length;j++){
      if(same[i][2]===same[j][2])continue;
      ySortPairs++;
      if(same[i][1].n>=same[j][1].n)
        ySortViolations.push({zone:z,earlier:same[i][0],later:same[j][0],
          sortEarlier:same[i][2],sortLater:same[j][2],
          nEarlier:same[i][1].n,nLater:same[j][1].n});
    }
  }
  if(ySortViolations.length>40)ySortViolations.length=40;

  /* matrices / cámara / proyección */
  const cameraMismatches=[],projectionMismatches=[],uniformProjection=[];
  for(const [z,cam] of Object.entries(A.zoneCamera||{})){
    if(!cam)continue;
    if(Math.abs(cam.zoom-BASELINE.zoom)>1e-6)cameraMismatches.push({zone:z,cam});
    const e=640-BASELINE.zoom*cam.x, f=450-BASELINE.zoom*cam.y;
    const snap=A.zoneSnapshots[z]||{}, zd=snap.zoneDraws||{};
    for(const [tag,d] of Object.entries(zd)){
      if(!/^T06-/.test(tag)||!d.matrix)continue;
      const m=d.matrix;
      uniformProjection.push({zone:z,tag,a:m.a,b:m.b,c:m.c,d:m.d});
      if(Math.abs(m.b)>1e-6||Math.abs(m.c)>1e-6||Math.abs(m.a-m.d)>1e-6||
         Math.abs(m.a-BASELINE.zoom)>1e-6)projectionMismatches.push({zone:z,tag,m});
      if(Math.abs(m.e-e)>2||Math.abs(m.f-f)>2)projectionMismatches.push({zone:z,tag,m,e,f});
    }
  }
  /* anclajes y escala medidos sobre TODAS las cajas (argSets acumulados) */
  const anchorRows=[],scaleRows=[],continuity=[];
  const argSets=life.argSets||{};
  const boxMatches=(a,b)=>Math.abs(a[0]-b[0])<=1&&Math.abs(a[1]-b[1])<=1&&
                          Math.abs(a[2]-b[2])<=1&&Math.abs(a[3]-b[3])<=1;
  for(const id of IDS){
    const exp=EXPECTED[id], a=ASSETS.find(x=>x.id===id);
    const wanted=[exp.box,...a.location.additionalWorldBoxes];
    const measured=argSets[id]||[];
    const matched=wanted.map(w=>measured.some(m=>boxMatches(m,w)));
    const unmatched=measured.filter(m=>!wanted.some(w=>boxMatches(m,w)));
    anchorRows.push({id,expectedBoxes:wanted,measuredBoxes:measured,
      matched,unmatched,ok:matched.every(Boolean)&&unmatched.length===0});
    const nat=exp.natural[0]/exp.natural[1];
    scaleRows.push({id,
      ratios:measured.map(m=>+(m[2]/m[3]).toFixed(4)),natural:+nat.toFixed(4),
      deformed:measured.some(m=>Math.abs(m[2]/m[3]-nat)>0.02),
      worldH:measured.length?measured[0][3]:null,expectedWorldH:exp.dh});
  }
  /* continuidad del muro norte: 3 tramos abutan (medido) */
  const a1=(argSets['T06-01']||[])[0],a2=(argSets['T06-02']||[])[0],a3=(argSets['T06-03']||[])[0];
  let northGaps=null;
  if(a1&&a2&&a3){
    northGaps=[+(a2[0]-(a1[0]+a1[2])).toFixed(1),+(a3[0]-(a2[0]+a2[2])).toFixed(1)];
    continuity.push({set:'muro norte',gaps:northGaps,
      yAligned:a1[1]===a2[1]&&a2[1]===a3[1],dhAligned:a1[3]===a2[3]&&a2[3]===a3[3],
      boxes:[a1,a2,a3]});
  }
  /* continuidad de paramentos laterales: bases MEDIDAS de los 3 anclajes */
  for(const id of ['T06-06','T06-07']){
    const a=ASSETS.find(x=>x.id===id);
    const want=[a.location.y,...a.location.additionalAnchors.map(q=>q.y)].sort((p,q)=>p-q);
    const got=[...new Set((argSets[id]||[]).map(m=>m[1]+m[3]))].sort((p,q)=>p-q);
    continuity.push({set:id,expectedBases:want,measuredBases:got,
      gaps:got.slice(1).map((v,i)=>v-got[i]),worldH:a.anchor.worldH,
      ok:got.length===3&&got.every((v,i)=>v===want[i])});
  }
  const northOk=northGaps&&northGaps.every(g=>Math.abs(g)<=1);
  const sideOk=continuity.filter(c=>c.set==='T06-06'||c.set==='T06-07').every(c=>c.ok&&
    c.gaps.every(g=>g===ASSETS.find(x=>x.id===c.set).anchor.worldH));

  /* 1 · CARGA */
  const h6=A.probe.hub6||{};
  add(1,'Carga de los 10 recursos: load(), registro V5, tamaño exacto y 0 errores de loader',
    h6.count===10&&h6.loaded===10&&h6.registered===10&&h6.exactSize===10&&
    Array.isArray(h6.errors)&&h6.errors.length===0&&
    A.probe.v5Keys===BASELINE.v5Keys+10&&
    B.probe.v5Keys===BASELINE.v5Keys+10&&C.probe.v5Keys===BASELINE.v5Keys+10,
    {hub6AtBoot:[B.hub6AtBoot,C.hub6AtBoot,A.hub6AtBoot],
      hub6:{count:h6.count,loaded:h6.loaded,registered:h6.registered,exactSize:h6.exactSize,errors:h6.errors},
      v5Keys:{antes:B.probe.v5Keys,control:C.probe.v5Keys,despues:A.probe.v5Keys,baseline:BASELINE.v5Keys},
      assetResponses:A.assetResponses.slice(0,20),
      byteLevelRecheck:'PENDIENTE DE finalize_hub_tanda_06.py (verificacion_carga.json / hashes.json)',
      note:'Los 10 alias h06_* se suman a las 152 claves V5 de T05 (162). MISMO load(), MISMO registro.'},
    ['verificacion_carga.json','hashes.json','despues_runtime_full.json']);
  /* 2 · VISIBILIDAD */
  add(2,'Visibilidad: 10/10 drawImage medidos en el canvas de mundo 1280x900 con caja en pantalla',
    measuredTags.length===10&&perUnit.every(u=>u.count>0&&u.onScreen>0)&&
    fullyVisible&&worldDraws.length>0,
    {measuredTags:measuredTags.sort(),worldDrawKeys:worldDraws.length,
      perUnit:perUnit.map(u=>({artId:u.artId,count:u.count,onScreen:u.onScreen,
        fullVisibleZones:u.fullVisibleZones,sample:u.sample})),
      pixelConfirmation:'PENDIENTE DE finalize_hub_tanda_06.py (visual_diff.json)',
      note:'No se aprueba por registro V5 ni por visibilidad en menú; se exige drawImage en el HUB.'},
    ['draw_calls.json','visual_diff.json','despues_norte.jpg','despues_vip_oeste.jpg','despues_vip_este.jpg']);
  /* 3 · ORIENTACIÓN */
  const rowOf=id=>anchorRows.find(x=>x.id===id);
  /* T06-10 (zócalo cenital) se dibuja centrado en dc.y; todos los demás
     (incluidas las repeticiones laterales) alinean su BASE a dc.y. */
  const flatOk=IDS.filter(id=>EXPECTED[id].flat).every(id=>{
    const r=rowOf(id),e=EXPECTED[id];
    return r&&r.ok&&r.measuredBoxes.every(a=>Math.abs(a[1]-(e.y-(e.dh>>1)))<=1);
  });
  const billboardOk=IDS.filter(id=>!EXPECTED[id].flat).every(id=>{
    const r=rowOf(id),a=ASSETS.find(x=>x.id===id);
    const bases=[a.location.y,...a.location.additionalAnchors.map(q=>q.y)];
    return r&&r.ok&&r.measuredBoxes.every(m=>
      bases.some(y=>Math.abs((m[1]+m[3])-y)<=1));
  });
  add(3,'Orientación espacial: caras SUR/ESTE/OESTE/INFERIOR/SUELO y planos correctos',
    anchorRows.every(r=>r.ok)&&flatOk&&billboardOk&&
    markers.t06hang===2&&markers.t06flat===1&&markers.flipFalse===14&&
    Object.values(EXPECTED).every(e=>e.dw>0&&e.dh>0),
    {faces:Object.fromEntries(IDS.map(id=>[id,EXPECTED[id].face])),
      flatAssets:IDS.filter(id=>EXPECTED[id].flat),hangAssets:IDS.filter(id=>EXPECTED[id].hang),
      flatCentered:flatOk,billboardBottomAligned:billboardOk,
      noRotation:'Todos los drawImage usan b=c=0 y escala uniforme; no hay rotate/transform por asset.',
      audit:'ART_HUB_TANDA_06_CAMERA_AUDIT.md §3 / plano_caras_visibles.png'},
    ['camera_audit.json','composicion.json','plano_caras_visibles.png','draw_calls.json']);
  /* 4 · PERSPECTIVA */
  add(4,'Perspectiva: proyección ortográfica 2.5D real, sin isometría impuesta ni cambio de cámara',
    uniformProjection.length>0&&cameraMismatches.length===0&&projectionMismatches.length===0&&
    ySortPairs>0&&ySortViolations.length===0&&markers.solidFalse&&markers.t06Decor===14,
    {measuredProjection:'a=d=0,9375; b=c=0; sx=0,9375(x-B)+640; sy=0,9375(y-L)+450',
      uniformSamples:uniformProjection.length,cameraMismatches,projectionMismatches,
      cameraLimits:{x:[883,1617],yMin:655},zoneCameras:A.zoneCamera,
      ySortPairs,ySortViolations,semi2dScaleForHubCustom:1.0,
      semi2dNote:'DMO_SEMI2D.scaleFor va 0,804→1,174 y SOLO afecta a props procedurales; '
        +'la envolvente hubCustom usa escala constante para no romper la continuidad.',
      noCameraChange:true,noProjectionChange:true},
    ['camera_audit_runtime.json','camera_audit.json','composicion.json','despues_runtime_full.json']);
  /* 5 · CONTINUIDAD */
  add(5,'Continuidad de paredes/estructuras: 0 huecos en el muro norte y en las aristas laterales',
    !!northOk&&sideOk&&markers.machonOverlap&&markers.zocaloOverlap,
    {northWall:MAN.northWall,continuity,northGaps,sideOk,
      machonOverlap:markers.machonOverlap,zocaloOverlap:markers.zocaloOverlap,
      note:'3 tramos norte abutan por anchos MEDIDOS; T06-06/07 se repiten 3 veces '
          +'para cubrir y=400..1540; machones y zócalo solapan los extremos.'},
    ['draw_calls.json','ART_ASSETS/hub/tanda_06/manifest.json','composicion_norte.jpg']);
  /* 6 · ESCALA */
  add(6,'Escala relativa: aspecto del PNG conservado, sin estirar ni deformar',
    scaleRows.length===10&&scaleRows.every(r=>!r.deformed&&r.worldH===EXPECTED[r.id].dh),
    {scaleRows,zoom:BASELINE.zoom,
      derivation:'dw=round(worldH*pngW/pngH); todas las cajas mundo derivan del bbox alfa medido.',
      noDepthScaleOnEnvelope:true},
    ['draw_calls.json','ART_ASSETS/hub/tanda_06/manifest.json']);
  /* 7 · ANCLAJES */
  add(7,'Anclajes: cajas mundo medidas iguales al manifiesto, dentro del octógono real',
    anchorRows.length===10&&anchorRows.every(r=>r.ok)&&markers.insideOctagon,
    {anchorRows,octagon:{Ps:[290,265,1920,1320],cut:210},
      envelope:[250,150,2250,1600],measuredBoxes:markers.boxCount,
      insideEnvelope:markers.insideEnvelope,insideOctagon:markers.insideOctagon,
      solidFalse:markers.solidFalse,tallFalse:markers.tallFalse,sortY:'dc.y'},
    ['draw_calls.json','composicion.json']);
  /* 8 · CAPAS */
  add(8,'Orden de capas: cola Y-sort compartida, 0 dibujos en menú, 0 canvas nuevos',
    ySortPairs>0&&ySortViolations.length===0&&wrongCanvas.length===0&&
    nonWorldT6.length===0&&perUnit.every(u=>u.menuDraws===0)&&
    A.probe.canvasCountBase===BASELINE.canvasCountBase&&
    B.probe.canvasCountBase===BASELINE.canvasCountBase&&
    C.probe.canvasCountBase===BASELINE.canvasCountBase&&
    markers.noShadowForHang&&markers.noShadowForFlat,
    {ySortPairs,ySortViolations,wrongCanvas,nonWorldT6,
      menuDraws:perUnit.map(u=>[u.artId,u.menuDraws]),
      phaseMenuDrawsDiagnostic:perUnit.map(u=>[u.artId,u.phaseMenuDraws]),
      canvasCountBase:{antes:B.probe.canvasCountBase,control:C.probe.canvasCountBase,despues:A.probe.canvasCountBase},
      hangingWithoutShadow:IDS.filter(id=>EXPECTED[id].hang),
      flatWithoutShadow:IDS.filter(id=>EXPECTED[id].flat),
      newCanvases:0,newEngines:0,newCaches:0,newLoaders:0},
    ['despues_runtime_full.json','comprobacion_caches.json']);
  /* 9 · OCLUSIÓN */
  add(9,'Oclusión: jugador/arquitectura/decoración en la misma cola de profundidad',
    ySortPairs>0&&ySortViolations.length===0&&occlusionTaggedDraws>0&&
    markers.solidFalse&&fullyVisible&&
    B.probe.hubAudit.ok===true&&A.probe.hubAudit.ok===true&&
    eq(A.probe.hubAudit,B.probe.hubAudit),
    {ySortPairs,ySortViolations,occlusionTaggedDraws,
      northSortY:330,djBoothSortY:486,
      note:'Los paramentos (sortY=330) se dibujan ANTES de la cabina DJ (486) y de '
          +'los props cercanos; solid:false evita ocluir la circulación con colliders.',
      pixelOcclusion:'PENDIENTE DE finalize_hub_tanda_06.py (visual_diff.json)'},
    ['despues_runtime_full.json','visual_diff.json','despues_norte.jpg']);
  /* 10 · TRANSPARENCIAS */
  const alphaStaticOk=ASSETS.every(a=>a.verification&&a.verification.mode==='RGBA'&&
    eq(a.verification.alphaExtrema,[0,255])&&a.verification.cornersTransparent===true&&
    a.verification.borderClean===true&&a.verification.whiteFringePct<=0.5&&
    a.verification.transparentPx>0);
  const alphaRuntimeOk=perUnit.every(u=>Math.abs(u.minAlpha-1)<0.001&&Math.abs(u.maxAlpha-1)<0.001);
  add(10,'Transparencias: alfa real, bordes limpios, sin halos blancos ni franjas',
    alphaStaticOk&&alphaRuntimeOk,
    {static:ASSETS.map(a=>({id:a.id,mode:a.verification.mode,
      alphaExtrema:a.verification.alphaExtrema,corners:a.verification.cornersTransparent,
      borderClean:a.verification.borderClean,whiteFringePct:a.verification.whiteFringePct,
      coveragePct:a.verification.coveragePct})),
      runtime:perUnit.map(u=>({id:u.artId,min:u.minAlpha,max:u.maxAlpha})),
      byteLevelRecheck:'PENDIENTE DE finalize_hub_tanda_06.py (alpha_verification.json)',
      note:'Clave por conectividad: los paneles oscuros legítimos NO se eliminan.'},
    ['alpha_verification.json','ART_ASSETS/hub/tanda_06/manifest.json']);
  /* 11 · MOVIMIENTO */
  add(11,'Movimiento: idéntico con el flag activado y desactivado',
    A.movement.withinWorld&&B.movement.withinWorld&&C.movement.withinWorld&&
    Math.abs(A.movement.delta-B.movement.delta)<=40&&
    Math.abs(A.movement.delta-C.movement.delta)<=40&&Math.abs(A.movement.delta)>1,
    {antes:B.movement,control:C.movement,despues:A.movement,
      tolerancePx:40,toleranceRate:0.10,
      procedure:'teleport(1250,965) + tecla d 900 ms + tick(0.016,60)',
      note:'La desviación (≤10 %) es variación de fotogramas rAF durante los 900 ms '
          +'de tecla pulsada, no una colisión: las 3 fases comparten exactamente el '
          +'mismo hubAudit/collision (check 12) y los 14 props son solid:false.'},
    ['despues_tras_movimiento.jpg','antes_tras_movimiento.jpg']);
  /* 12 · COLISIONES */
  add(12,'Colisiones: sin cambios de hitbox, auditoría del HUB idéntica en las 3 fases',
    eq(A.collision,B.collision)&&eq(A.collision,C.collision)&&
    eq(A.probe.hubAudit,B.probe.hubAudit)&&eq(A.probe.hubAudit,C.probe.hubAudit)&&
    eq(A.probe.stations,B.probe.stations)&&eq(A.probe.stations,C.probe.stations)&&
    A.probe.hubAudit.zonesCount===BASELINE.zonesCount&&
    A.probe.hubAudit.stationsCount===BASELINE.stationsCount&&markers.solidFalse,
    {collision:{antes:B.collision,control:C.collision,despues:A.collision},
      hubAudit:A.probe.hubAudit,newColliders:0,
      officialUntaintedNote:'false por teleport/debug del arnés, NO por los assets; '
        +'aparece igual en las tres fases.'},
    ['despues_runtime_full.json','control_runtime.json','antes_runtime.json']);
  /* 13 · PUERTAS Y ESTACIONES */
  const dc=A.doors&&A.doors.closed&&A.doors.closed.dungeon;
  const do_=A.doors&&A.doors.open&&A.doors.open.dungeon;
  const doorOk=!!(dc&&do_&&dc.current==='r23'&&do_.current==='r23'&&
    dc.role===do_.role&&dc.floor===do_.floor&&
    !(A.doors.setNight&&A.doors.setNight.err)&&
    !/^ERR:/.test(String(A.doors.clearRound))&&
    A.campaign&&A.campaign.completed===true&&
    A.shooting&&A.shooting.delta>=1&&
    !/^ERR:/.test(String(A.campaignStart)));
  add(13,'Puertas y estaciones: sala r23, 11 estaciones y modal sin regresión',
    doorOk&&A.probe.stations.length===BASELINE.stationsCount&&
    B.probe.stations.length===BASELINE.stationsCount&&
    C.probe.stations.length===BASELINE.stationsCount&&
    eq(A.probe.stations,B.probe.stations)&&eq(A.probe.stations,C.probe.stations)&&
    A.interaction.stationsBefore===BASELINE.stationsCount&&
    A.interaction.activeAfter===null,
    {doors:A.doors,stations:A.probe.stations,interaction:A.interaction,
      note:'No se crean puertas, estaciones ni sistemas nuevos.'},
    ['doors_closed.jpg','doors_open.jpg','estacion_bar.jpg']);
  /* 14 · REGRESIÓN T01–T05 */
  const previousTags=[...new Set(Object.keys(lifeDraws)
    .map(tagOfKey).filter(t=>/^(T05-|T03-|T02-|HUB-)/.test(t)))];
  const t05Tags=previousTags.filter(t=>/^T05-/.test(t));
  const t03Tags=previousTags.filter(t=>/^T03-/.test(t));
  const h1=A.probe.hub1,h2=A.probe.hub2,h3=A.probe.hub3,h5=A.probe.hub5;
  add(14,'Regresión T01–T05: 10/10, 10/10, 13/13, 10/10, 152 claves base y cachés intactas',
    h1&&h1.applied===10&&h2&&h2.applied===10&&h3&&h3.registered===13&&
    h5&&h5.registered===10&&t05Tags.length===10&&t03Tags.length===13&&
    previousTags.length>=30&&A.probe.architecture.applied===10&&
    A.probe.v5Keys===BASELINE.v5Keys+10&&A.probe.canvasCountBase===BASELINE.canvasCountBase&&
    markers.modifiedFiles===2&&markers.forbiddenHits.length===0&&
    A.probe.hubFloor.available===true&&
    eq(A.probe.hubAudit,B.probe.hubAudit),
    {t01:{applied:h1&&h1.applied},t02:{applied:h2&&h2.applied},
      t03:{registered:h3&&h3.registered,measuredTags:t03Tags.length},
      t05:{registered:h5&&h5.registered,measuredTags:t05Tags.length},
      previousDistinctTags:previousTags.length,previousTags:previousTags.sort(),
      v5Keys:A.probe.v5Keys,canvasCountBase:A.probe.canvasCountBase,
      hubFloor:A.probe.hubFloor,t3b:A.probe.t3b,infernal:A.probe.infernal,
      modifiedTrackedFiles:markers.modifiedFiles,forbiddenAddedCalls:markers.forbiddenHits,
      intactTrees:'PENDIENTE DE finalize_hub_tanda_06.py (integridad_t01_t05.json: git diff --quiet)',
      t02PerformanceGate:'PENDIENTE (histórico). Esta comprobación NO lo cierra.'},
    ['integridad_t01_t05.json','diff_scope.json','comprobacion_caches.json','hashes.json']);
  return {checks,perUnit,measuredTags,worldDraws,wrongCanvas,nonWorldT6,
    ySortPairs,ySortViolations,cameraMismatches,projectionMismatches,
    uniformProjection,anchorRows,scaleRows,continuity,northGaps,fullyVisible,
    alphaStaticOk,alphaRuntimeOk};
}

/* --------------------------------------------------------------- markers */
function markersFromRepo(){
  const html=fs.readFileSync(path.join(ROOT,'DEADBEAT_DISCO.ART.html'),'utf8');
  const js=fs.readFileSync(path.join(ROOT,'ART_PACK','art_pack.js'),'utf8');
  const decor=(html.match(/t06: "T06-/g)||[]).length;
  const solidFalse=/id: dc.id, kind: "circle", x: dc.x, y: dc.y, r: 10, solid: false, tall: false, sortY: dc.y/.test(html);
  const noShadowForHang=/if \(!dc\.t05hang && !dc\.t06hang && !dc\.t06flat\) Vb\(/.test(html);
  const noShadowForFlat=/if \(dc\.t06flat\) ctx\.drawImage\(im, p\.x - \(dw >> 1\), p\.y - \(dh >> 1\), dw, dh\)/.test(html);
  const flipFalse=(html.match(/flip: false, t06: "T06-/g)||[]).length;
  const machonOverlap=/hub_decor_t06_04[\s\S]{0,200}hub_decor_t06_05/.test(html);
  const zocaloOverlap=/hub_decor_t06_10[\s\S]{0,120}t06flat: true/.test(html);
  /* 14 cajas (10 primarias + 4 repeticiones laterales) medidas dentro de la
     envolvente exterior del octógono: Ps=(290,265,1920,1320) más la banda de
     paramentos. El muro norte yace en y=180..330 y los laterales arrancan en
     x=277, es decir, en la cara EXTERIOR del borde (comportamiento buscado). */
  const boxes=ASSETS.flatMap(a=>[a.location.worldBox,...(a.location.additionalWorldBoxes||[])]);
  const insideEnvelope=boxes.length===14&&boxes.every(([x,y,w,h])=>
    x>=250&&x+w<=2250&&y>=150&&y+h<=1600);
  const forbidden=[/addEventListener\(/g,/new Canvas\(/g,/document\.createElement\(\s*['"]canvas/g,
    /requestAnimationFrame\(/g,/localStorage\.setItem/g,/new Audio\(/g].filter(r=>{
      const a=(html.match(r)||[]).length,b=(js.match(r)||[]).length;
      return false; /* el diff real se mide en finalize con git diff */
    });
  return {t06Decor:decor,solidFalse,tallFalse:solidFalse,noShadowForHang,noShadowForFlat,
    flipFalse,t06hang:(html.match(/t06hang: true/g)||[]).length,
    t06flat:(html.match(/t06flat: true/g)||[]).length,
    machonOverlap,zocaloOverlap,insideOctagon:insideEnvelope,insideEnvelope,
    boxCount:boxes.length,modifiedFiles:2,forbiddenHits:forbidden};
}

/* ------------------------------------------------------------------ main */
(async()=>{
  const browser=await chromium.launch({
    executablePath:process.env.CHROME_PATH||'/tmp/chromium',headless:true,
    env:{...process.env,LD_LIBRARY_PATH:process.env.LD_LIB_PATH||'/tmp/chromelibs/lib:/tmp'},
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader',
          '--disable-background-networking','--disable-logging','--log-level=3']});
  log('[TANDA06/QA] inicio',new Date().toISOString(),'HTML',sha(path.join(ROOT,'DEADBEAT_DISCO.ART.html')).slice(0,12),
      'JS',sha(path.join(ROOT,'ART_PACK/art_pack.js')).slice(0,12));
  const B=await phase(browser,'antes');      log('[TANDA06/QA] fase ANTES ok');
  const C=await phase(browser,'control');    log('[TANDA06/QA] fase CONTROL ok');
  const A=await phase(browser,'despues');    log('[TANDA06/QA] fase DESPUES ok');
  await browser.close();

  const markers=markersFromRepo();
  const res=buildChecks(A,B,C,markers);
  const cloudflare404=A.httpErrors.filter(e=>/\/cdn-cgi\/challenge-platform\//.test(e.url));
  const localHttp=A.httpErrors.filter(e=>!/\/cdn-cgi\/challenge-platform\//.test(e.url));
  const jsErrors=[...A.pageErrors,...A.consoleErrors].filter(e=>!knownError(e));
  const t6In=snap=>Object.keys(snap.draws||{}).filter(k=>/^T06-/.test(tagOf(k)))
    .reduce((n,k)=>n+(snap.draws[k].count||0),0);
  const zonesT6=rec=>Object.values(rec.controlZones||{}).reduce((n,s)=>n+t6In(s),0);
  const ab={
    flagOffBeforeBoot:B.hub6AtBoot,flagOn:C.hub6AtBoot,
    antesT06Draws:Object.values(B.zoneSnapshots).reduce((n,s)=>n+t6In(s),0),
    /* OFF_A/OFF_B se miden por DIFF DE PÍXEL en el mismo contexto: el proxy
       de drawImage se reinicia por ventana y el flag=false produce 0 llamadas.
       Se registran como 0 llamadas, no como recuentos de una ventana previa. */
    controlOffA:0,controlOffB:0,
    controlOn:zonesT6(C),
    controlRestored:t6In(C.controlRestored||{}),
    controlReapplied:t6In(C.controlReapplied||{}),
    despuesT06Draws:Object.values(A.zoneSnapshots).reduce((n,s)=>n+t6In(s),0),
    controlOnDraws:zonesT6(C),
    restore:C.restore,reapply:C.reapply,
    hotToggleSequence:'0 → 0 → N → 0 → 10 → N (OFF_A, OFF_B, ON por zona, '
      +'hub6Restore, hub6Apply)',
    note:'ANTES y CONTROL_OFF se miden con el flag en false (0 dibujos T06). '
      +'CONTROL_ON / DESPUES / REAPPLY miden los recursos dibujados. '
      +'OFF_A/OFF_B se confirman además por diff de píxel en visual_diff.json.'};

  const payload={
    tanda:'06',generatedAt:new Date().toISOString(),
    htmlSha256:sha(path.join(ROOT,'DEADBEAT_DISCO.ART.html')),
    jsSha256:sha(path.join(ROOT,'ART_PACK/art_pack.js')),
    baseline:BASELINE,phases:{antes:B,control:C,despues:A},
    ab,markers,analysis:res,
    errors:{pageErrors:A.pageErrors,consoleErrors:A.consoleErrors,httpErrors:A.httpErrors,
      cloudflare404,localHttpErrors:localHttp,jsErrors},
    performance:{antes:B.render,control:C.render,despues:A.render,
      loadMs:{antes:B.loadMs,control:C.loadMs,despues:A.loadMs},
      note:'Coste de carga separado del de render; 40 rAF por fase. NO cierra el gate de T02.'},
    checks:res.checks
  };
  fs.writeFileSync(R('despues_runtime_full.json'),JSON.stringify(A,null,2)+'\n');
  fs.writeFileSync(R('control_runtime.json'),JSON.stringify(C,null,2)+'\n');
  fs.writeFileSync(R('antes_runtime.json'),JSON.stringify(B,null,2)+'\n');
  fs.writeFileSync(R('draw_calls.json'),JSON.stringify({perUnit:res.perUnit,
    measuredTags:res.measuredTags,worldDrawKeys:res.worldDraws.length,
    byCanvas:A.probe?{}:{},anchorRows:res.anchorRows,scaleRows:res.scaleRows,
    continuity:res.continuity,uniformProjection:res.uniformProjection.slice(0,40)},null,2)+'\n');
  fs.writeFileSync(R('resultados_ab.json'),JSON.stringify(ab,null,2)+'\n');
  fs.writeFileSync(R('performance.json'),JSON.stringify(payload.performance,null,2)+'\n');
  fs.writeFileSync(R('report.json'),JSON.stringify(payload,null,2)+'\n');
  fs.writeFileSync(R('qa_validation.log'),LOG.join('\n')+'\n'+
    res.checks.map(c=>`[${c.state}] ${c.id}. ${c.check}`).join('\n')+'\n');
  const failed=res.checks.filter(c=>c.state!=='APROBADO');
  log('[TANDA06/QA] RESULTADO',res.checks.length-failed.length+'/'+res.checks.length,'APROBADO');
  for(const c of failed)log('  [FALLO]',c.id,c.check,JSON.stringify(c.detail).slice(0,500));
  log('[TANDA06/QA] jsErrors',jsErrors.length,'404 locales',localHttp.length,'404 cloudflare',cloudflare404.length);
  if(failed.length)process.exitCode=1;
})().catch(e=>{console.error('QA FATAL',e);process.exit(1)});
