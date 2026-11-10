// Registro real, fallbacks y límite de precarga. No altera el reloj de cinemática.
import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import path from 'node:path';
const rq=createRequire(path.join(process.env.DD_QA_MODULES||process.cwd(),'package.json'));
const puppeteer=(await import(pathToFileURL(rq.resolve('puppeteer-core')).href)).default;
const chromium=(await import(pathToFileURL(rq.resolve('@sparticuz/chromium')).href)).default;
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
try {
 for(const scenario of ['normal','fallback','missing']) {
  const page=await browser.newPage();await page.setViewport({width:640,height:360});
  const errors=[];const count={master:0,fallback:0};page.on('pageerror',e=>errors.push(String(e)));
  await page.setRequestInterception(true);
  page.on('request',req=>{
   const url=req.url();const master=url.includes('/cine_bg01_city/rebuild_city.png');const fallback=url.includes('/cine_bg01_city/cine_bg01_city.png');
   if(master) count.master++;if(fallback)count.fallback++;
   if((master&&scenario!=='normal')||(fallback&&scenario==='missing'))req.respond({status:404,body:'deliberate missing image'}).catch(()=>{});
   else req.continue().catch(()=>{});
  });
  await page.goto((process.env.DD_QA_URL||'http://127.0.0.1:8000')+'/index.html',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.DD_CINE?.getState()?.type==='intro',{timeout:60000});
  const result=await page.evaluate(()=>({boot:DD_BOOT.getState(),evidence:DD_BOOT.getEvidence(),city:DD_ASSETS.get('cine_bg01_city')?.currentSrc||null}));
  const imageIssue=result.evidence.errors.find(x=>x.id==='images');
  if(count.master!==1||errors.length)throw Error(JSON.stringify({scenario,count,errors,result}));
  if(scenario==='normal'&&(!result.city?.includes('rebuild_city.png')||imageIssue))throw Error(JSON.stringify({scenario,result}));
  if(scenario==='fallback'&&(!result.city?.includes('/cine_bg01_city/cine_bg01_city.png')||imageIssue))throw Error(JSON.stringify({scenario,result}));
  if(scenario==='missing'&&(!imageIssue?.degraded||result.city))throw Error(JSON.stringify({scenario,result}));
  await page.keyboard.press('Escape');await page.waitForFunction(()=>window.DD_HUB?.isActive()&&!window.DD_CINE?.isBlocking(),{timeout:30000});
  console.log(JSON.stringify({scenario,count,city:result.city,imageIssue,hub:true,errors}));
  await page.close();
 }
} finally {await browser.close()}
