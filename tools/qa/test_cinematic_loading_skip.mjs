// Integración de skip solicitado durante una carga demorada, sin omitir el arranque esencial.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const requireQA=createRequire(path.join(process.env.DD_QA_MODULES||process.cwd(),'package.json'));
const puppeteer=(await import(pathToFileURL(requireQA.resolve('puppeteer-core')).href)).default;
const chromium=(await import(pathToFileURL(requireQA.resolve('@sparticuz/chromium')).href)).default;
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
try {
 for(const method of ['Escape','Space','click','none']) {
  const page=await browser.newPage();await page.setViewport({width:960,height:540});
  const errors=[];let delayed=0;
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setRequestInterception(true);
  page.on('request',req=>{
   if(req.url().includes('/assets/fase01/menu_backdrop_2k.webp')) {delayed++;setTimeout(()=>req.continue().catch(()=>{}),4000)}
   else req.continue().catch(()=>{});
  });
  await page.evaluateOnNewDocument(()=>{window.__introWasActive=false;function loop(){if(window.DD_CINE?.getState()?.type==='intro')window.__introWasActive=true;requestAnimationFrame(loop)}requestAnimationFrame(loop)});
  await page.goto((process.env.DD_QA_URL||'http://127.0.0.1:8000')+'/index.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.DD_BOOT?.getState().state==='LOADING',{timeout:15000});
  if(method==='click')await page.mouse.click(30,300);else if(method!=='none')await page.keyboard.press(method);
  if(method!=='none'){
   await page.waitForFunction(()=>window.DD_BOOT?.getState().introSkipQueued,{timeout:5000});
   const before=await page.evaluate(()=>({boot:DD_BOOT.getState(),hub:DD_HUB.isActive(),hint:document.querySelector('#dd-boot-hint')?.textContent}));
   if(before.hub||before.boot.state!=='LOADING')throw Error('HUB iniciado antes de terminar la carga: '+JSON.stringify(before));
   await page.waitForFunction(()=>window.DD_BOOT?.getState().state==='PLAYING'&&window.DD_HUB?.isActive(),{timeout:30000});
   const after=await page.evaluate(()=>({boot:DD_BOOT.getState(),hub:DD_HUB.getState(),cine:DD_CINE.getState(),introWasActive:window.__introWasActive}));
   if(after.boot.introEndedBy!=='skip'||after.cine||after.introWasActive||errors.length||!delayed)throw Error(JSON.stringify({method,delayed,before,after,errors}));
   console.log(JSON.stringify({method,delayed,queued:before.boot.introSkipQueued,hint:before.hint,endedBy:after.boot.introEndedBy,hub:after.hub.active,errors}));
  } else {
   await page.waitForFunction(()=>window.DD_CINE?.getState()?.type==='intro',{timeout:30000});
   if(!delayed||errors.length)throw Error(JSON.stringify({method,delayed,errors}));
   console.log(JSON.stringify({method,delayed,cine:await page.evaluate(()=>DD_CINE.getState()),errors}));
  }
  await page.close();
 }
 // Error esencial simulado: el salto no debe ocultar ni eludir el panel.
 const failure=await browser.newPage();await failure.setViewport({width:960,height:540});
 await failure.evaluateOnNewDocument(()=>Object.defineProperty(window,'__DD_BRIDGE',{configurable:true,get(){return null},set(){}}));
 await failure.goto((process.env.DD_QA_URL||'http://127.0.0.1:8000')+'/index.html',{waitUntil:'domcontentloaded',timeout:120000});
 await failure.waitForFunction(()=>{const e=document.querySelector('#dd-boot-err');return e && !e.hidden},{timeout:30000});
 await failure.keyboard.press('Escape');
 const blocked=await failure.evaluate(()=>({boot:DD_BOOT.getState(),hub:DD_HUB?.isActive(),errorVisible:!document.querySelector('#dd-boot-err').hidden}));
 if(!blocked.errorVisible||blocked.hub||blocked.boot.introSkipQueued||blocked.boot.state==='PLAYING')throw Error('El salto eludió un error esencial: '+JSON.stringify(blocked));
 console.log(JSON.stringify({method:'essential-failure',errorVisible:blocked.errorVisible,hub:blocked.hub,queued:blocked.boot.introSkipQueued,state:blocked.boot.state}));
 await failure.close();
} finally {await browser.close()}
