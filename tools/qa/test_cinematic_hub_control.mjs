// Test de integración real: entrada al HUB tras skip, movimiento y fallo de recurso.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const requireQA=createRequire(path.join(process.env.DD_QA_MODULES||process.cwd(),'package.json'));
const puppeteer=(await import(pathToFileURL(requireQA.resolve('puppeteer-core')).href)).default;
const chromium=(await import(pathToFileURL(requireQA.resolve('@sparticuz/chromium')).href)).default;
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
try {
 for(const missingCity of [false,true]) {
  const page=await browser.newPage();await page.setViewport({width:960,height:540});
  const errors=[];let intercepted=0;
  page.on('pageerror',e=>errors.push(String(e)));
  if(missingCity){await page.setRequestInterception(true);page.on('request',request=>{
   if(request.url().includes('/cine_bg01_city/rebuild_city.png')){intercepted++;request.respond({status:404,contentType:'text/plain',body:'Missing test asset'});}
   else request.continue();
  });}
  await page.goto((process.env.DD_QA_URL||'http://127.0.0.1:8000')+'/index.html',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.DD_CINE?.getState()?.type==='intro',{timeout:60000});
  if(missingCity){const city=await page.evaluate(()=>{let im=DD_ASSETS.get('cine_bg01_city');return im?.currentSrc||null});
   if(!city || !city.includes('/cine_bg01_city/cine_bg01_city.png')) throw Error('El fallback no cargó: '+city);
   if(!intercepted) throw Error('No se interceptó la imagen');
  }
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>window.DD_HUB?.isActive()&&!window.DD_CINE?.isBlocking(),{timeout:30000});
  const before=await page.evaluate(()=>DD_HUB.getState());
  await page.keyboard.down('KeyD');
  try { await page.waitForFunction(x=>window.DD_HUB.getState().x>x+5,{timeout:30000},before.x); }
  finally {await page.keyboard.up('KeyD');}
  const after=await page.evaluate(()=>({hub:DD_HUB.getState(),boot:DD_BOOT.getState(),cine:DD_CINE.getState()}));
  if(errors.length||after.boot.state!=='PLAYING'||!after.hub.active)throw Error(JSON.stringify({missingCity,errors,after}));
  console.log(JSON.stringify({missingCity,intercepted,before:[before.x,before.y],after:[after.hub.x,after.hub.y],boot:after.boot.state,errors}));
  await page.close();
 }
} finally {await browser.close()}
