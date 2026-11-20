/* Sondéo de rendimiento: incursión real con enemigos, entrada simulada y FPS.
   Uso: node tools/qa/perf_probe.js [url] [out_dir]  (requiere DD_CHROMIUM) */
const {chromium}=require('playwright-core'),fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8081',out=process.argv[3]||'docs/evidence/atuendos';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push('JS: '+e.message));
  p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await p.goto(base+'/index.html');
  await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU',null,{timeout:30000});
  await p.locator('[data-action=play]').click();await p.locator('#dd-scene-new').click();
  await p.waitForFunction(()=>DD_OPENING.getState()?.type==='intro');
  await p.evaluate(()=>DD_OPENING.debugSeek(31.9,false));
  await p.waitForFunction(()=>DD_OPENING.getState()?.type==='descent');
  await p.evaluate(()=>DD_OPENING.debugSeek(4.55,false));
  await p.waitForFunction(()=>DD_HUB.isActive());
  await p.evaluate(()=>DD_HUB.exitToRun());
  await p.waitForFunction(()=>DD_CINE.getState()?.type==='circle');
  await p.keyboard.press('Space');
  await p.waitForFunction(()=>__DD_BRIDGE.isRunning());
  // invulnerabilidad + ola de enemigos alrededor del jugador
  await p.evaluate(()=>{
    DMO.debug.invuln(true);
    const p=__DD_BRIDGE.getSnapshot().player;
    const types=['dancer','sprinter','tank','speaker','dancer','sprinter','tank','speaker','dancer','sprinter','tank','speaker'];
    for(let i=0;i<12;i++){
      const a=i/12*Math.PI*2;
      DMO.debug.spawnEnemyAt(types[i], p.x+Math.cos(a)*220, p.y+Math.sin(a)*220, false, false);
    }
    window.__perfDrive=setInterval(()=>{try{__DD_BRIDGE.testStep({right:true,fire:true,aim:0},2)}catch(e){}},50);
  });
  await p.waitForTimeout(2000);
  fs.mkdirSync(out,{recursive:true});
  await p.screenshot({path:path.join(out,'combate-turba-rendimiento.png')});
  // medir 300 frames de rAF durante el combate
  const stats=await p.evaluate(()=>new Promise(res=>{
    const d=[];let last=performance.now(),n=0;
    function tick(t){d.push(t-last);last=t;if(++n<300)requestAnimationFrame(tick);else{
      clearInterval(window.__perfDrive);
      const s=[...d].sort((a,b)=>a-b);
      const avg=d.reduce((a,b)=>a+b,0)/d.length;
      res({avgMs:+avg.toFixed(2),avgFps:+(1000/avg).toFixed(1),
           p50Fps:+(1000/s[150]).toFixed(1),p95Ms:+s[285].toFixed(2),
           maxMs:+s[s.length-1].toFixed(2),frames:d.length});
    }}
    requestAnimationFrame(tick);
  }));
  const enemies=await p.evaluate(()=>{try{return (__DD_BRIDGE.getSnapshot().enemies||[]).length}catch(e){return -1}});
  // base en calma: sin enemigos, mismas 300 muestras
  const calm=await p.evaluate(()=>new Promise(res=>{
    try{DMO.debug.killAll();window.__perfDrive=setInterval(()=>{try{__DD_BRIDGE.testStep({right:true,fire:true,aim:0},2)}catch(e){}},50);}catch(e){}
    const d=[];let last=performance.now(),n=0;
    function tick(t){d.push(t-last);last=t;if(++n<300)requestAnimationFrame(tick);else{
      clearInterval(window.__perfDrive);
      const avg=d.reduce((a,b)=>a+b,0)/d.length;
      res({avgMs:+avg.toFixed(2),avgFps:+(1000/avg).toFixed(1)});
    }}
    requestAnimationFrame(tick);
  }));
  console.log('PERF con_enemigos='+JSON.stringify(stats)+' en_calmo='+JSON.stringify(calm)+' enemies='+enemies);
  console.log(errors.length?('ERRORES '+errors.slice(0,5).join(' | ')):'SIN ERRORES JS NI HTTP');
 }finally{await browser.close();}
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
