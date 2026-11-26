/* TANDA 09 · continuidad de animación a frecuencia de render.
 * Muestrea lastFrame de los 10 NPC a ~33 ms durante 6 s y comprueba que
 * NUNCA hay un salto >1 (módulo 4) ni un reinicio a 0 desde 2/3.
 * Salida: ART_EVIDENCE/hub/tanda_09/qa_frames_continuity.json
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
  const p = await c.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html',{waitUntil:'load',timeout:180000});
  await p.waitForFunction(()=>{try{return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status);}catch(e){return false;}},{timeout:90000});
  await p.mouse.click(640,450); await p.waitForTimeout(400);
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.keyboard.down('Escape'); await p.waitForTimeout(1400); await p.keyboard.up('Escape');
  await p.waitForFunction(()=>{try{return window.DMO_HUB.state().inHub;}catch(e){return false;}},{timeout:30000});
  await p.waitForTimeout(1600);
  const N = 180, rows = [];
  for (let i=0;i<N;i++) {
    rows.push(await p.evaluate(()=>window.__DDM_T09.S.records.map(r=>({
      id:r.id, f:r.lastFrame, x:r.lastX, st:r.state, hold:+r.holdOffset.toFixed(3) }))));
    await p.waitForTimeout(33);
  }
  const ids = rows[0].map(r=>r.id);
  const out = { generatedAt:new Date().toISOString(), samples:N, sampleMs:33, pageerrors:errs,
                perId:{}, verdict:'APROBADO' };
  ids.forEach((id,k)=>{
    const seq = rows.map(row=>row[k]);
    const dF=[], dX=[], bad=[];
    for(let j=1;j<seq.length;j++){
      const a=seq[j-1].f, z=seq[j].f;
      let d=Math.abs(z-a); if(d>2) d=4-d;
      dF.push(d);
      if(d>1) bad.push({j, from:a, to:z, prevState:seq[j-1].st, state:seq[j].st});
      dX.push(Math.abs(seq[j].x-seq[j-1].x));
    }
    const hist={}; dF.forEach(v=>hist[v]=(hist[v]||0)+1);
    out.perId[id]={ frameDeltaHist:hist, maxFrameDelta:Math.max(...dF),
                    jumps:bad.length, jumpExamples:bad.slice(0,5),
                    maxXDelta:Math.max(...dX),
                    frozenSamples:seq.filter(s=>s.st!=='ACTIVE').length,
                    holdMax:+Math.max(...seq.map(s=>s.hold)).toFixed(3) };
    if(bad.length) out.verdict='FALLIDO';
  });
  fs.writeFileSync(path.join(OUT,'qa_frames_continuity.json'), JSON.stringify(out,null,2)+'\n');
  console.log('veredicto', out.verdict, '| muestras', N, '| pageerrors', errs.length);
  Object.entries(out.perId).forEach(([k,v])=>console.log(' ',k,'hist',JSON.stringify(v.frameDeltaHist),'jumps',v.jumps,'maxX',v.maxXDelta));
  await c.close(); await b.close();
})().catch(e=>{console.error('FATAL',e);process.exit(2);});
