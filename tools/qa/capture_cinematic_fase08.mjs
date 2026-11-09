// Capturas estáticas de la preview. Avanza el reloj de forma artificial: NO mide rendimiento.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const requireQA = createRequire(path.join(process.env.DD_QA_MODULES || process.cwd(), 'package.json'));
const puppeteer = (await import(pathToFileURL(requireQA.resolve('puppeteer-core')).href)).default;
const chromium = (await import(pathToFileURL(requireQA.resolve('@sparticuz/chromium')).href)).default;
const browser = await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
try {
 const page=await browser.newPage();await page.setViewport({width:1280,height:900,deviceScaleFactor:1});
 // Congela el bucle de preview durante las capturas; el avance manual abajo
 // es solo para encuadres estáticos, nunca una medición de rendimiento.
 await page.evaluateOnNewDocument(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>{if(!window.__captureFrozen)cb(t)});});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto((process.env.DD_QA_URL || 'http://127.0.0.1:8000')+'/assets/cinematics/preview/player.html',{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.DD_CINE?.getState()?.type==='intro',{timeout:60000});
 await page.evaluate(()=>{window.__captureFrozen=true});
 await new Promise(resolve=>setTimeout(resolve,200));
 const out='assets/cinematics/evidence/pr17/phase08';fs.mkdirSync(out,{recursive:true});
 const times=[1.5,5,8.5,11.5,15.5,19,23,26,30,33];
 for (const [i,t] of times.entries()) {
   const elapsed = await page.evaluate(t=>{while(window.DD_CINE.getState() && window.DD_CINE.getState().elapsed<t) window.DD_CINE.update(.05);const c=document.querySelector('canvas');window.DD_CINE.renderOverlay(c.getContext('2d'),c.width,c.height);return window.DD_CINE.getState()?.elapsed},t);
   if(elapsed == null || elapsed < t || elapsed > t + .1) throw new Error(`Tiempo incorrecto: ${elapsed} para ${t}`);
   await page.$eval('#stage',el=>{el.style.scrollMargin='0'});
   await (await page.$('#stage')).screenshot({path:`${out}/shot-${String(i+1).padStart(2,'0')}.png`});
   console.log(`shot ${i+1}: requested ${t}s, captured ${elapsed}s`);
 }
 if(errors.length) throw Error(JSON.stringify(errors));
} finally {await browser.close();}
