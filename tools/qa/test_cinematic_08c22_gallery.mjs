import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const rq=createRequire(path.join(process.env.DD_QA_MODULES||process.cwd(),'package.json'));
const puppeteer=(await import(pathToFileURL(rq.resolve('puppeteer-core')).href)).default;
const chromium=(await import(pathToFileURL(rq.resolve('@sparticuz/chromium')).href)).default;
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure().errorText));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': '+r.status())});
 const base=process.env.DD_QA_URL||'http://127.0.0.1:8014';
 async function check(url){await page.goto(base+url,{waitUntil:'load',timeout:120000});return page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));return document.images.length})}
 let n=await check('/docs/CINEMATIC_STORYBOARD/FASE_08C22_GALERIA_CONTINUIDAD.html');
 await page.$eval('[data-range="bg05"]',el=>{el.value=30;el.dispatchEvent(new Event('input'))});
 if(await page.$eval('#bg05',el=>el.style.opacity)!=='0.3')throw Error('opacity');
 await page.select('select[data-id="bg05"]','hipotesis');await page.$eval('#bg05',el=>el.decode());
 if(!(await page.$eval('#bg05',el=>el.currentSrc.endsWith('bg05_hipotesis_transparente.svg'))))throw Error('camera');
 await page.setJavaScriptEnabled(false);const nojs=await check('/docs/CINEMATIC_STORYBOARD/FASE_08C22_GALERIA_CONTINUIDAD.html');await page.setJavaScriptEnabled(true);
 const old=await check('/docs/CINEMATIC_STORYBOARD/FASE_08C2_GALERIA_PLANO.html');
 if(n!==16||nojs!==n||old!==10||errors.length)throw Error(JSON.stringify({n,nojs,old,errors}));
 console.log(JSON.stringify({imagenes:n,sinJS:nojs,galeriaAnterior:old,controles:'OK',errors}));
}finally{await browser.close()}
