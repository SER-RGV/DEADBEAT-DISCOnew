// Captura y comprueba la sustitución visual temporal solo en HUB, sin adelantar tiempo.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';import path from 'node:path';
const rq=createRequire(path.join(process.env.DD_QA_MODULES||process.cwd(),'package.json'));
const puppeteer=(await import(pathToFileURL(rq.resolve('puppeteer-core')).href)).default;
const chromium=(await import(pathToFileURL(rq.resolve('@sparticuz/chromium')).href)).default;
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
try {
 const page=await browser.newPage();await page.setViewport({width:960,height:540,deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto((process.env.DD_QA_URL||'http://127.0.0.1:8000')+'/index.html',{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.DD_CINE?.getState()?.type==='intro',{timeout:60000});
 await page.evaluate(()=>{const w=window.DD_WORLD;window.__hubPoses=[];window.DD_WORLD={...w,drawProtagonist(...args){const a=args[2],raw=window.DMO?.playerAnim;window.__hubPoses.push({upper:a?.upperPose,lower:a?.lowerPose,split:a?.waistSplitActive,shared:a===raw,rawUpper:raw?.upperPose,rawLower:raw?.lowerPose,rawSplit:raw?.waistSplitActive});return w.drawProtagonist(...args)}}});
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>window.DD_HUB?.isActive()&&!window.DD_CINE?.isBlocking()&&window.__hubPoses.length>2,{timeout:30000});
 await page.waitForFunction(()=>window.__hubPoses.some(p=>!p.rawSplit&&p.upper==='player_walk0')&&!document.querySelector('#dd-boot-frame'),{timeout:30000});
 fs.mkdirSync('assets/cinematics/evidence/pr17/phase08',{recursive:true});
 await page.screenshot({path:'assets/cinematics/evidence/pr17/phase08/hub-idle-official-fallback.png'});
 const before=await page.evaluate(()=>DD_HUB.getState());
 await page.keyboard.down('KeyD');
 try{await page.waitForFunction(()=>window.__hubPoses.some(p=>p.rawLower==='player_walk3'&&p.rawSplit),{timeout:45000})}finally{await page.keyboard.up('KeyD')}
 const result=await page.evaluate(()=>({poses:window.__hubPoses,hub:DD_HUB.getState(),boot:DD_BOOT.getState()}));
 const bad=result.poses.filter(p=>p.shared||p.split||p.upper!==p.lower||!['player_walk0','player_walk1','player_walk2'].includes(p.upper)||
  (p.rawSplit&&p.rawLower==='player_walk3'&&p.upper!=='player_walk1')||(!p.rawSplit&&p.upper!=='player_walk0'));
 if(bad.length||errors.length||result.hub.x<=before.x||result.boot.state!=='PLAYING')throw Error(JSON.stringify({bad,errors,result}));
 console.log(JSON.stringify({samples:result.poses.length,idle:result.poses.find(p=>!p.rawSplit),fourthStep:result.poses.find(p=>p.rawSplit&&p.rawLower==='player_walk3'),moved:[before.x,result.hub.x],boot:result.boot.state,errors}));
} finally {await browser.close()}
