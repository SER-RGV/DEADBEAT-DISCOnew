/* Auditoría de la conexión grieta → descenso (SOLO LECTURA del motor).
 * Dispara la transición existente startCampaignFromHub(0) y captura fases.
 * Salida: ART_EVIDENCE/hub/legibilidad/descenso_*.jpg + auditoria_descenso.json
 */
const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '../../ART_EVIDENCE/hub/legibilidad');
(async () => {
  const b = await chromium.launch({ executablePath:'/tmp/chromium', headless:true,
    env:{...process.env, LD_LIBRARY_PATH:'/tmp/chromelibs/lib:/tmp'},
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader','--disable-background-networking'] });
  const c = await b.newContext({ viewport:{width:1280,height:900} });
  await c.addInitScript(() => { window.__DDM_HUB_T09 = false; });
  const p = await c.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html',{waitUntil:'load',timeout:180000});
  await p.waitForFunction(()=>{try{return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status);}catch(e){return false;}},{timeout:90000});
  await p.mouse.click(640,450); await p.waitForTimeout(400);
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.keyboard.down('Escape'); await p.waitForTimeout(1400); await p.keyboard.up('Escape');
  await p.waitForFunction(()=>{try{return window.DMO_HUB.state().inHub;}catch(e){return false;}},{timeout:30000});
  await p.waitForTimeout(1700);
  await p.evaluate(()=>window.DMO.debug.teleport(1250,1300));
  await p.waitForTimeout(350);
  await p.screenshot({path:path.join(OUT,'descenso_00_antes.jpg'),type:'jpeg',quality:88});
  const before = await p.evaluate(()=>({
    hub:window.DMO_HUB.state(), t07:window.DMO_HUB_T07.state(), t08:window.DMO_HUB_T08.state(),
    cam:window.DMO.camera(), api:typeof window.DMO_HUB.startCampaignFromHub }));
  const started = await p.evaluate(()=>{ try { return !!window.DMO_HUB.startCampaignFromHub(0); } catch(e){ return String(e); } });
  const marks = [250,500,900,1400,2000,2800,3600,4600];
  const shots = [];
  let prev = 0;
  for (const ms of marks) {
    await p.waitForTimeout(ms - prev); prev = ms;
    const f = 'descenso_' + String(ms).padStart(4,'0') + '.jpg';
    await p.screenshot({path:path.join(OUT,f),type:'jpeg',quality:88});
    const st = await p.evaluate(()=>({
      hub:window.DMO_HUB.state(), t07:window.DMO_HUB_T07.state(),
      t08:window.DMO_HUB_T08.state(), cam:window.DMO.camera() }));
    shots.push({ ms, file:f,
      location:st.hub.location, mode:st.hub.mode, transitionLock:st.hub.transitionLock,
      t07descent:st.t07.descent, t08: { visible:st.t08.visible, expand:st.t08.expand,
        winTop:st.t08.winTop, winH:st.t08.winH, descentP:st.t08.descentP },
      cam:st.cam });
  }
  const out = { generatedAt:new Date().toISOString(), pageerrors:errs, started,
    before:{ hub:before.hub, t07arrival:before.t07.arrival, t08:before.t08, cam:before.cam, api:before.api },
    shots };
  fs.writeFileSync(path.join(OUT,'auditoria_descenso.json'),JSON.stringify(out,null,2)+'\n');
  console.log('startCampaignFromHub(0) ->',started,'| pageerrors',errs.length);
  shots.forEach(s=>console.log(' ',s.ms+'ms',s.location,s.mode,'lock',s.transitionLock,
    't07frames',s.t07descent.frames,'t08vis',s.t08.visible,'winH',s.t08.winH,'expand',s.t08.expand,
    'cam',s.cam.x,s.cam.y));
  await c.close(); await b.close();
})().catch(e=>{console.error('FATAL',e);process.exit(2);});
