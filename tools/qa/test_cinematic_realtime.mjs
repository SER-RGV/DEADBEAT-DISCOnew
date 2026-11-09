// Reproducción real: no llama DD_CINE.update ni manipula relojes.
// DD_QA_MODULES debe apuntar a un directorio con puppeteer-core y @sparticuz/chromium.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const requireQA = createRequire(path.join(process.env.DD_QA_MODULES || process.cwd(), 'package.json'));
const chromium = (await import(pathToFileURL(requireQA.resolve('@sparticuz/chromium')).href)).default;
const puppeteerModule = await import(pathToFileURL(requireQA.resolve('puppeteer-core')).href);
const puppeteer = puppeteerModule.default || puppeteerModule;

const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
const page=await browser.newPage(); await page.setViewport({width:640,height:360,deviceScaleFactor:1}); const faults=[];
page.on('pageerror',e=>faults.push({type:'pageerror',message:String(e)}));page.on('requestfailed',r=>faults.push({type:'request',url:r.url(),error:r.failure()?.errorText}));page.on('response',r=>{if(r.status()>=400)faults.push({type:'http',url:r.url(),status:r.status()})});
await page.evaluateOnNewDocument(()=>{
 let data=window.__cineRT={start:null,end:null,frames:[],shots:[],assetsAtStart:null,hubAtEnd:null,webgl:null}; let previous=-1, priorShot=0;
 function sample(now){const c=window.DD_CINE?.getState();if(c?.type==='intro'){
  if(data.start===null){data.start=now;data.assetsAtStart=window.DD_ASSETS?.stats();const gl=document.createElement('canvas').getContext('webgl');const ext=gl?.getExtension('WEBGL_debug_renderer_info');data.webgl=ext?{vendor:gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),renderer:gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}:null}
  if(previous>=0)data.frames.push(now-previous);previous=now;
  const t=c.elapsed;const shot=t<3.5?1:t<7?2:t<10?3:t<13.5?4:t<17.5?5:t<21?6:t<24.5?7:t<28.5?8:t<32?9:10;
  if(shot!==priorShot){data.shots.push({shot,wallMs:now-data.start,elapsed:t});priorShot=shot;console.log('SHOT',shot,'wall',Math.round(now-data.start),'elapsed',t)}
 }else if(data.start!==null&&data.end===null){data.end=now;data.hubAtEnd=window.DD_HUB?.getState();console.log('INTRO_COMPLETE',Math.round(data.end-data.start));}
 if(data.end===null)requestAnimationFrame(sample);
 } requestAnimationFrame(sample);
});
page.on('console',m=>{let text=m.text();if(text.startsWith('SHOT')||text.startsWith('INTRO_COMPLETE'))console.log(text)});
await page.goto(process.env.DD_QA_URL || 'http://127.0.0.1:8000/index.html',{waitUntil:'load',timeout:120000});
await page.waitForFunction(()=>window.__cineRT && window.__cineRT.end!==null,{timeout:900000,polling:1000});
const result=await page.evaluate(()=>({metrics:window.__cineRT,boot:window.DD_BOOT.getState(),hub:window.DD_HUB.getState()}));result.faults=faults;fs.writeFileSync(process.env.DD_QA_OUTPUT || '/tmp/deadbeat-cine-realtime.json',JSON.stringify(result,null,2));console.log('END',JSON.stringify({wallMs:result.metrics.end-result.metrics.start,frames:result.metrics.frames.length,webgl:result.metrics.webgl,hub:result.hub.active,errors:faults.length}));await browser.close();
