/* TANDA 09 · flag __DDM_HUB_T09 = false DESDE EL ARRANQUE.
 * Verifica que no se cargan sprites nuevos, que los wrappers deleguen en el
 * pintor original de T01–T08 y que al activar el flag se recupera T09.
 * Salida: ART_EVIDENCE/hub/tanda_09/qa_flag_boot.json
 */
const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '../../ART_EVIDENCE/hub/tanda_09');
(async () => {
  const b = await chromium.launch({ executablePath:'/tmp/chromium', headless:true,
    env:{...process.env, LD_LIBRARY_PATH:'/tmp/chromelibs/lib:/tmp'},
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader','--disable-background-networking'] });
  const c = await b.newContext({ viewport:{width:1280,height:900} });
  await c.addInitScript(() => { window.__DDM_HUB_T09 = false; });
  const p = await c.newPage();
  const errs=[], reqs=[];
  p.on('pageerror',e=>errs.push(String(e)));
  p.on('request',r=>{ if(/tanda_09/.test(r.url())) reqs.push(r.url()); });
  await p.goto('http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html',{waitUntil:'load',timeout:180000});
  await p.waitForFunction(()=>{try{return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status);}catch(e){return false;}},{timeout:90000});
  await p.mouse.click(640,450); await p.waitForTimeout(400);
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.keyboard.down('Escape'); await p.waitForTimeout(1400); await p.keyboard.up('Escape');
  await p.waitForFunction(()=>{try{return window.DMO_HUB.state().inHub;}catch(e){return false;}},{timeout:30000});
  await p.waitForTimeout(1800);
  const off = await p.evaluate(()=>({
    assetsRequested: window.__DDM_T09.S.assetsRequested,
    t09: window.DMO_HUB_T09.state(), audit: window.DMO_HUB_T09.audit(),
    v5: Object.keys(window.__DDM_V5_IMG||{}).length,
    t07: window.DMO_HUB_T07.audit(), hub: window.DMO_HUB.audit(),
    props: window.DMO_LAYOUT.propObjects().length }));
  await p.screenshot({path:path.join(OUT,'qa_flag_boot_off.jpg'),type:'jpeg',quality:86});
  const offReqs = reqs.length;   /* peticiones ANTES de activar el flag */
  await p.evaluate(()=>{ window.__DDM_HUB_T09 = true; });
  await p.waitForFunction(()=>{
    try { return window.DMO_HUB_T09.state().assets.every(a=>a.loaded); } catch(e){ return false; }
  },{timeout:20000});
  await p.waitForTimeout(900);
  const on = await p.evaluate(()=>({
    t09: window.DMO_HUB_T09.state(), audit: window.DMO_HUB_T09.audit(),
    v5: Object.keys(window.__DDM_V5_IMG||{}).length }));
  await p.screenshot({path:path.join(OUT,'qa_flag_boot_on.jpg'),type:'jpeg',quality:86});
  const out = {
    generatedAt:new Date().toISOString(), pageerrors:errs,
    offRequestsT09:offReqs, offRequestList:reqs.slice(0,offReqs),
    onRequestsT09:reqs.length - offReqs,
    off:{ flag:off.t09.flag, wrapped:off.t09.wrapped, hooks:off.t09.hooksInstalled,
          assetsRequested:off.assetsRequested, assetsLoaded:off.audit.assetsLoaded,
          assets:off.t09.assets, delegated:off.t09.delegated, draws:off.t09.draws,
          v5:off.v5, props:off.props, states:[...new Set(off.t09.records.map(r=>r.state))],
          t07ok:off.t07.ok, hubok:off.hub.ok, errors:off.t09.errors },
    on:{ flag:on.t09.flag, assetsLoaded:on.audit.assetsLoaded,
         delegated:on.t09.delegated, draws:on.t09.draws, v5:on.v5,
         auditOk:on.audit.ok, errors:on.t09.errors },
    verdict: (errs.length===0 && offReqs===0 && off.assetsRequested===false
              && off.t09.flag==='OFF' && off.audit.assetsLoaded===0
              && off.t09.delegated>0 && off.t09.draws===0 && off.v5===178
              && on.t09.flag==='ON' && on.audit.assetsLoaded===4 && on.t09.draws>0
              && on.audit.ok) ? 'APROBADO' : 'FALLIDO'
  };
  fs.writeFileSync(path.join(OUT,'qa_flag_boot.json'),JSON.stringify(out,null,2)+'\n');
  console.log('veredicto',out.verdict,'| OFF:',JSON.stringify(out.off),'| ON:',JSON.stringify(out.on));
  console.log('peticiones T09 con flag=false en arranque:',out.offRequestsT09,
              '| tras activar:',out.onRequestsT09,'| pageerrors',errs.length);
  await c.close(); await b.close();
  if(out.verdict!=='APROBADO') process.exit(3);
})().catch(e=>{console.error('FATAL',e);process.exit(2);});
