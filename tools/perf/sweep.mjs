import { launch } from './lib.mjs';
const browser = await launch();
const out=[];
for (const [W,H] of [[1024,600],[800,600],[1280,720],[1920,1080],[2560,1080],[2560,1440]]) {
  const ctx=await browser.newContext({viewport:{width:W,height:H}});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,100)));
  await page.goto('http://127.0.0.1:8123/index.html',{waitUntil:'commit'});
  await page.waitForFunction(()=>window.DD_BOOT&&DD_BOOT.getEvidence().loadFinished,null,{timeout:60000});
  for(let i=0;i<250;i++){const st=await page.evaluate(()=>DD_BOOT.getState().state); if(st==='MAIN_MENU')break; await page.keyboard.press('Escape'); await page.waitForTimeout(90);}
  await page.waitForTimeout(700);
  const probe = async (root) => page.evaluate((root)=>{
    const r=document.querySelector(root); if(!r) return {missing:true};
    const rb=r.getBoundingClientRect();
    let clipped=0, small=0, overflow=0;
    r.querySelectorAll('*').forEach(e=>{
      const cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0) return;
      const b=e.getBoundingClientRect(); if(b.width<4||b.height<4) return;
      const t=(e.textContent||'').trim();
      if (b.bottom>rb.bottom+3 || b.top<rb.top-3) clipped++;
      if (t && e.children.length===0) { const fs=parseFloat(cs.fontSize); if(fs>0&&fs<10) small++; }
      if (e.scrollWidth>e.clientWidth+3 && cs.overflowX!=='visible' && t) overflow++;
    });
    return {clipped, small, overflow};
  }, root);
  const menu = await probe('#dd-main-menu');
  await page.evaluate(()=>document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="options"]').click());
  await page.waitForTimeout(1000);
  const opts = await probe('.dd-submenu-card');
  const optsBody = await page.evaluate(()=>{const b=document.getElementById('dd-submenu-body'); return b?[b.scrollHeight,b.clientHeight]:null;});
  await page.evaluate(()=>{const b=document.getElementById('dd-submenu-back'); b&&b.click();});
  await page.waitForTimeout(500);
  out.push({vp:`${W}x${H}`, menu, opts, optsFits: optsBody? optsBody[0]<=optsBody[1]+1 : null, errs});
  await ctx.close();
}
console.log(JSON.stringify(out,null,1));
await browser.close();
