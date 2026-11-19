import { launch } from './lib.mjs';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const browser = await launch();
const page = await (await browser.newContext({viewport:{width:1280,height:720}})).newPage();
await page.addInitScript(()=>{ window.__lt=[]; try{new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt.push(Math.round(e.duration)))).observe({entryTypes:['longtask']});}catch(e){} });
const sample=(n=24)=>page.evaluate((n)=>new Promise(r=>{const ts=[];let l=performance.now();function f(t){ts.push(t-l);l=t;ts.length<n?requestAnimationFrame(f):r(ts);}requestAnimationFrame(f);}),n);
const stat=a=>{const b=a.slice(1).sort((x,y)=>x-y);return {med:+b[Math.floor(b.length/2)].toFixed(1),p95:+b[Math.floor(b.length*0.95)].toFixed(1)};};
const t0=Date.now();
await page.goto(url,{waitUntil:'commit'});
await page.waitForFunction(()=>window.DD_BOOT&&DD_BOOT.getEvidence().loadFinished,null,{timeout:120000});
const boot = await page.evaluate(()=>({loadMs:Math.round(performance.now()), ev:DD_BOOT.getEvidence()}));
for(let i=0;i<250;i++){const st=await page.evaluate(()=>DD_BOOT.getState().state); if(st==='MAIN_MENU')break; await page.keyboard.press('Escape'); await page.waitForTimeout(100);}
const menuMs = Date.now()-t0;
await page.waitForTimeout(1200);
const menuFrames = stat(await sample(24));
await page.evaluate(()=>{document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="new"]').click();});
for(let i=0;i<100;i++){ if(await page.evaluate(()=>!!(window.DD_HUB&&DD_HUB.isActive()))) break; await page.waitForTimeout(200); }
await page.waitForTimeout(4000);
const hubFrames = stat(await sample(24));
const lt = await page.evaluate(()=>window.__lt.slice());
const assets = await page.evaluate(()=>DD_ASSETS.stats());
console.log(JSON.stringify({url, bootMs:boot.ev.loadFinished?Math.round(boot.ev.loadFinished):null, bootSteps:boot.ev.stepsDone, menuReachableMs:menuMs, menuFrames, hubFrames, longTasks:{n:lt.length, total:lt.reduce((a,b)=>a+b,0)}, assets:{registered:assets.registered,requested:assets.requested,errors:assets.errors}}));
await browser.close();
