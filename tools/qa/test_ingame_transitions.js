/* Presentation integration; circle travel uses the engine debug API and marks
   the run modified. No game state is invented by the test. */
const {chromium}=require('playwright-core'),assert=require('assert'),fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8080',out=process.argv[3],delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 if(out)fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 try{
 await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT&&DD_BOOT.getState().state==='MAIN_MENU',null,{timeout:30000});
 await p.evaluate(()=>DD_UI.triggerMenuAction('new'));await p.waitForFunction(()=>DD_OPENING.getState()?.type==='intro');await p.evaluate(()=>DD_OPENING.debugSeek(31.9,false));await p.waitForFunction(()=>DD_OPENING.getState()?.type==='descent');await p.evaluate(()=>DD_OPENING.debugSeek(4.55,false));await p.waitForFunction(()=>DD_HUB.isActive());
 const circles=await p.evaluate(()=>__DD_BRIDGE.getCircles());assert.equal(circles[0].name,'LIMBO');assert.equal(circles[1].name,'LUJURIA');
 await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>DD_CINE.getState()?.type==='circle');let s=await p.evaluate(()=>DD_CINE.getState());
 assert.equal(s.title,'CÍRCULO I · LIMBO');assert.equal(s.circle,0);assert(s.blocking);assert.equal(await p.locator('#dd-cine-tag').innerText(),s.title);assert((await p.locator('#dd-cine-sub').innerText()).includes(String(circles[0].bpm)+' BPM'));
 assert.equal(await p.evaluate(()=>__DD_BRIDGE.isRunning()),false,'motor no arranca hasta completar descenso');
 await p.waitForFunction(()=>DD_CINE.getState()?.type==='circle'&&DD_CINE.getState().elapsed>=0.4,null,{timeout:5000});
 assert(!(await p.locator('#dd-dialogue-box').isVisible()),'subtítulo del Refugio oculto en la transición');
 if(out)await p.screenshot({path:path.join(out,'descenso-limbo-1280x720.png')});
 assert(await p.evaluate(()=>DD_CINE.isBlocking()),'descenso sigue activo antes de saltar');
 await p.keyboard.press('Space');
 await p.waitForFunction(()=>__DD_BRIDGE.isRunning());await delay(350);assert(!(await p.evaluate(()=>DD_CINE.isBlocking())));
 console.log('PASS descenso de Refugio a Limbo con nombre y BPM reales, omisión por teclado');
 await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});await p.waitForTimeout(500);
 assert(await p.evaluate(()=>DMO.debug.exploreGoTo(12)),'viaje debug a Lujuria');
 await p.waitForFunction(()=>{let s=DD_CINE.getState();return s&&s.type==='circle'&&s.circle===1},null,{timeout:10000});
 s=await p.evaluate(()=>DD_CINE.getState());assert.equal(s.title,'CÍRCULO II · LUJURIA');assert.equal(s.blocking,false);assert(!(await p.locator('#dd-hud').evaluate(e=>e.classList.contains('dd-hidden'))));
 if(out)await p.screenshot({path:path.join(out,'cambio-lujuria-1280x720.png')});
 const bombs=await p.evaluate(()=>__DD_BRIDGE.getSnapshot().bombs);await p.keyboard.press('q');await p.waitForFunction(b=>__DD_BRIDGE.getSnapshot().bombs===b-1,bombs,{timeout:5000});
 console.log('PASS cambio de círculo debug muestra Lujuria II sin bloquear HUD ni entrada del motor');
 await p.waitForFunction(()=>!DD_CINE.getState(),null,{timeout:12000});
 const titles=await p.evaluate(()=>__DD_BRIDGE.getCircles().map((c,i)=>{DD_CINE.playCircleDescent(i);const s=DD_CINE.getState();DD_CINE.skip();return {name:c.name,title:s.title,blocking:s.blocking}}));
 assert.equal(titles.length,10);for(const t of titles){assert(t.title.includes(t.name),t.name);assert.equal(t.blocking,false);}
 const reducedCtx=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce'});
 try {
   const reduced=await reducedCtx.newPage();await reduced.goto(base+'/index.html');await reduced.waitForFunction(()=>window.DD_CINE&&window.__DD_BRIDGE);
   const proof=await reduced.evaluate(()=>{let called=0;DD_CINE.playCircleDescent(0,()=>called++);const s=DD_CINE.getState();DD_CINE.skip();DD_CINE.skip();return {s,called};});
   assert(proof.s.blocking&&proof.s.duration<2.9&&proof.s.title.includes('LIMBO'));assert.equal(proof.called,1);
 } finally {await reducedCtx.close()}
 assert.deepEqual(errors,[]);console.log('PASS diez destinos, movimiento reducido y callback único; sin errores de navegador');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
