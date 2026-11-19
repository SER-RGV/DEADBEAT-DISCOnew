import { launch } from './lib.mjs';
const browser = await launch();
const page = await (await browser.newContext({viewport:{width:1280,height:720}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,150)));
await page.goto('http://127.0.0.1:8123/index.html',{waitUntil:'commit'});
await page.waitForFunction(()=>window.DD_BOOT&&DD_BOOT.getEvidence().loadFinished,null,{timeout:60000});
for(let i=0;i<250;i++){const st=await page.evaluate(()=>DD_BOOT.getState().state); if(st==='MAIN_MENU')break; await page.keyboard.press('Escape'); await page.waitForTimeout(100);}
await page.evaluate(()=>{document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="new"]').click();});
for(let i=0;i<100;i++){ if(await page.evaluate(()=>!!(window.DD_HUB&&DD_HUB.isActive()))) break; await page.waitForTimeout(200); }
await page.waitForTimeout(2000);
await page.evaluate(()=>document.getElementById('dd-btn-open-shop').click());
await page.waitForTimeout(1500);
const r = await page.evaluate(()=>{
  const cards=[...document.querySelectorAll('.dd-weapon-card')];
  const info = cards.slice(0,12).map(c=>({n:c.querySelector('.dd-weapon-card-name')?.textContent, p:c.querySelector('.dd-weapon-card-price')?.textContent, h:Math.round(c.getBoundingClientRect().height), nameOverflow: (()=>{const e=c.querySelector('.dd-weapon-card-name'); return e? e.scrollHeight>e.clientHeight+1: null;})()}));
  const grid=document.querySelector('#dd-weapons-grid')||document.querySelector('.dd-weapons-grid');
  return {count:cards.length, info, gridScroll: grid?[grid.scrollHeight,grid.clientHeight]:null};
});
console.log(JSON.stringify(r,null,1), errs);
await page.screenshot({path:'/tmp/harness/fix2-shop.png', timeout:45000}).catch(()=>console.log('shot timeout'));
await browser.close();
