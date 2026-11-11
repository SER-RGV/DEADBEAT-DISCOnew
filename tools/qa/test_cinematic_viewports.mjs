// Smoke de integración del juego real; no certifica composición de cada plano.
import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import path from 'node:path';import assert from 'node:assert/strict';
const requireQA=createRequire(path.join(process.env.DD_QA_MODULES||process.cwd(),'package.json'));
const puppeteer=(await import(pathToFileURL(requireQA.resolve('puppeteer-core')).href)).default;
const chromium=(await import(pathToFileURL(requireQA.resolve('@sparticuz/chromium')).href)).default;
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
try{
 for(const [width,height] of [[1920,1080],[1600,900],[1366,768],[1280,720]])for(const deviceScaleFactor of [1,2]){
  const page=await browser.newPage();await page.setViewport({width,height,deviceScaleFactor});const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto((process.env.DD_QA_URL||'http://127.0.0.1:8000')+'/index.html',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.DD_CINE?.getState()?.type==='intro',{timeout:60000});
  const result=await page.evaluate(()=>{const g=document.getElementById('game'),r=g.getBoundingClientRect(),button=document.getElementById('dd-cine-skip-btn'),b=button.getBoundingClientRect();return {canvas:[g.width,g.height],rect:[r.x,r.y,r.width,r.height],button:[b.x,b.y,b.width,b.height],dpr:devicePixelRatio}});
  assert(result.rect[2]>0&&result.rect[3]>0,'canvas visible');assert(result.button[2]>0&&result.button[3]>0,'skip visible');
  assert(result.button[0]>=0&&result.button[1]>=0&&result.button[0]+result.button[2]<=width+1&&result.button[1]+result.button[3]<=height+1,'skip dentro de viewport');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>DD_HUB?.isActive()&&!DD_CINE?.isBlocking(),{timeout:30000});assert.deepEqual(errors,[]);
  console.log(JSON.stringify({width,height,deviceScaleFactor,...result,errors}));await page.close();
 }
}finally{await browser.close()}
