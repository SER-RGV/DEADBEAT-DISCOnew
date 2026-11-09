// Integración real con el HTML: omisión de la intro mediante entradas físicas de navegador.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const requireQA=createRequire(path.join(process.env.DD_QA_MODULES||process.cwd(),'package.json'));
const puppeteer=(await import(pathToFileURL(requireQA.resolve('puppeteer-core')).href)).default;
const chromium=(await import(pathToFileURL(requireQA.resolve('@sparticuz/chromium')).href)).default;
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
try {
 for(const method of ['Escape','Space','click']) {
  const page=await browser.newPage();await page.setViewport({width:1280,height:720});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto((process.env.DD_QA_URL||'http://127.0.0.1:8000')+'/index.html',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.DD_CINE?.getState()?.type==='intro',{timeout:60000});
  if(method==='click') await page.mouse.click(450,300); else await page.keyboard.press(method);
  await page.waitForFunction(()=>window.DD_HUB?.isActive() && !window.DD_CINE?.isBlocking(),{timeout:30000});
  const result=await page.evaluate(()=>({hub:DD_HUB.getState(),cine:DD_CINE.getState(),boot:DD_BOOT.getState()}));
  if(errors.length || !result.hub.active || result.boot.introEndedBy !== 'skip') throw Error(JSON.stringify({method,errors,result}));
  console.log(JSON.stringify({method,active:result.hub.active,endedBy:result.boot.introEndedBy,cine:result.cine,errors}));
  await page.close();
 }
} finally {await browser.close()}
