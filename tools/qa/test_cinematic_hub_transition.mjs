// Reproducción real de intro a HUB. No adelanta ni controla el reloj.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';import path from 'node:path';
const requireQA=createRequire(path.join(process.env.DD_QA_MODULES||process.cwd(),'package.json'));
const puppeteer=(await import(pathToFileURL(requireQA.resolve('puppeteer-core')).href)).default;
const chromium=(await import(pathToFileURL(requireQA.resolve('@sparticuz/chromium')).href)).default;
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
try {
 const page=await browser.newPage();await page.setViewport({width:960,height:540,deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto((process.env.DD_QA_URL||'http://127.0.0.1:8000')+'/index.html',{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.DD_CINE?.getState()?.type==='intro',{timeout:30000});
 await page.evaluate(()=>{const hub=window.DD_HUB;window.__hubEntries=0;window.DD_HUB={...hub,enter(...args){window.__hubEntries++;return hub.enter(...args)}}});
 await page.waitForFunction(()=>window.DD_CINE?.getState()?.elapsed>=32.3 && window.DD_HUB?.isActive(),{timeout:90000});
 const atFade=await page.evaluate(()=>({cine:DD_CINE.getState(),hub:DD_HUB.getState(),blocking:DD_CINE.isBlocking(),entries:window.__hubEntries,visible:getComputedStyle(document.querySelector('#dd-dialogue-box')).visibility}));
 if(!atFade.blocking||atFade.entries!==1||atFade.visible!=='hidden')throw Error('Inicio de fundido inválido: '+JSON.stringify(atFade));
 await page.keyboard.down('KeyD');
 await page.waitForFunction(()=>window.DD_CINE?.getState()?.elapsed>=33,{timeout:15000});
 await page.keyboard.up('KeyD');
 const blocked=await page.evaluate(()=>DD_HUB.getState());
 if(blocked.x!==atFade.hub.x||blocked.y!==atFade.hub.y)throw Error('Movimiento durante intro: '+JSON.stringify({atFade,blocked}));
 fs.mkdirSync('assets/cinematics/evidence/pr17/phase08',{recursive:true});
 await page.screenshot({path:'assets/cinematics/evidence/pr17/phase08/hub-crossfade-real.png'});
 await page.waitForFunction(()=>window.DD_BOOT?.getState().state==='PLAYING'&&!window.DD_CINE?.isBlocking(),{timeout:30000});
 const completed=await page.evaluate(()=>({boot:DD_BOOT.getState(),hub:DD_HUB.getState(),entries:window.__hubEntries,dialogue:{hidden:document.querySelector('#dd-dialogue-box').classList.contains('dd-hidden'),visibility:getComputedStyle(document.querySelector('#dd-dialogue-box')).visibility,speaker:document.querySelector('#dd-dj-speaker')?.textContent}}));
 if(completed.entries!==1||completed.boot.introEndedBy!=='complete'||completed.dialogue.hidden||completed.dialogue.visibility==='hidden'||errors.length)throw Error('Final inválido: '+JSON.stringify({completed,errors}));
 await page.keyboard.down('KeyD');
 try{await page.waitForFunction(x=>DD_HUB.getState().x>x+5,{timeout:30000},completed.hub.x)}finally{await page.keyboard.up('KeyD')}
 const moved=await page.evaluate(()=>DD_HUB.getState());
 await page.screenshot({path:'assets/cinematics/evidence/pr17/phase08/hub-complete-real.png'});
 console.log(JSON.stringify({atFade,blocked,completed,moved,errors}));
} finally {await browser.close()}
