// Observa llamadas reales al mezclador existente; no mide sonido audible.
import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import path from 'node:path';
const rq=createRequire(path.join(process.env.DD_QA_MODULES||process.cwd(),'package.json'));
const puppeteer=(await import(pathToFileURL(rq.resolve('puppeteer-core')).href)).default;
const chromium=(await import(pathToFileURL(rq.resolve('@sparticuz/chromium')).href)).default;
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
try {
 const url=(process.env.DD_QA_URL||'http://127.0.0.1:8000')+'/index.html';
 const page=await browser.newPage();await page.setViewport({width:640,height:360});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(url,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.DD_CINE?.getState()?.type==='intro',{timeout:60000});
 await page.evaluate(()=>{const m=window.DDC_COVER.music,fn=m.duck;window.__duckCalls=[];m.duck=function(v){window.__duckCalls.push({value:v,elapsed:window.DD_CINE?.getState()?.elapsed});return fn.call(this,v)}});
 await page.waitForFunction(()=>window.DD_CINE?.getState()?.elapsed>=25,{timeout:90000});
 await page.keyboard.press('Escape');await page.waitForFunction(()=>window.DD_HUB?.isActive()&&!window.DD_CINE?.isBlocking(),{timeout:30000});
 const result=await page.evaluate(()=>({calls:window.__duckCalls,boot:DD_BOOT.getState(),hub:DD_HUB.getState()}));
 if(result.calls.map(c=>c.value).join(',')!=='false,true,false'||result.boot.introEndedBy!=='skip'||errors.length)throw Error(JSON.stringify({result,errors}));
 console.log(JSON.stringify({scenario:'real-mixer',calls:result.calls,hub:result.hub.active,endedBy:result.boot.introEndedBy,errors}));await page.close();
 const silent=await browser.newPage();await silent.setViewport({width:640,height:360});const silentErrors=[];silent.on('pageerror',e=>silentErrors.push(String(e)));
 await silent.evaluateOnNewDocument(()=>{Object.defineProperty(window,'AudioContext',{configurable:true,value:undefined});Object.defineProperty(window,'webkitAudioContext',{configurable:true,value:undefined})});
 await silent.goto(url,{waitUntil:'load',timeout:120000});await silent.waitForFunction(()=>window.DD_CINE?.getState()?.type==='intro',{timeout:60000});await silent.keyboard.press('Escape');await silent.waitForFunction(()=>window.DD_HUB?.isActive()&&!window.DD_CINE?.isBlocking(),{timeout:30000});
 const s=await silent.evaluate(()=>({boot:DD_BOOT.getState(),hub:DD_HUB.getState()}));if(s.boot.introEndedBy!=='skip'||!s.hub.active||silentErrors.length)throw Error(JSON.stringify({s,silentErrors}));
 console.log(JSON.stringify({scenario:'no-AudioContext',hub:s.hub.active,endedBy:s.boot.introEndedBy,errors:silentErrors}));await silent.close();
}finally{await browser.close()}
