import { launch, enterHub } from './lib.mjs';
const browser = await launch();
for (const [W,H] of [[1024,600],[800,600],[1366,768],[2560,1080]]) {
  const ctx = await browser.newContext({viewport:{width:W,height:H}});
  const page = await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,150)));
  await page.goto('http://127.0.0.1:8123/index.html',{waitUntil:'commit'});
  await page.waitForFunction(()=>window.DD_BOOT&&DD_BOOT.getEvidence().loadFinished,null,{timeout:60000});
  for (let i=0;i<200;i++){const st=await page.evaluate(()=>DD_BOOT.getState().state); if(st==='MAIN_MENU')break; await page.keyboard.press('Escape'); await page.waitForTimeout(100);}
  await enterHub(page);
  for (let i=0;i<80;i++){ if(await page.evaluate(()=>!!(window.DD_HUB&&DD_HUB.isActive()))) break; await page.waitForTimeout(200); }
  await page.waitForTimeout(900);
  await page.evaluate(()=>document.getElementById('dd-btn-open-map').click());
  await page.waitForTimeout(700);
  const r = await page.evaluate(()=>{
    const q=s=>document.querySelector(s); const box=e=>{const b=e.getBoundingClientRect();return {t:Math.round(b.top),b:Math.round(b.bottom),w:Math.round(b.width),h:Math.round(b.height)};};
    const win=q('#dd-map-modal .dd-modal-window'), body=q('.dd-map-body'), list=q('.dd-circles-list'), rows=[...document.querySelectorAll('.dd-circle-node')];
    return {win:box(win), body:{...box(body),scroll:body.scrollHeight,client:body.clientHeight,st:Math.round(body.scrollTop)},
      list:{...box(list),scroll:list.scrollHeight}, rows:rows.length,
      lastRow: box(rows[rows.length-1]).b, winB: box(win).b};
  });
  r.vp=[W,H]; r.errs=errs;
  console.log(W+'x'+H, JSON.stringify(r));
  try { await page.screenshot({path:`/tmp/harness/map-${W}x${H}.png`, timeout:15000, animations:'disabled'}); } catch(e) { console.log('shot fail', W, H); }
  await ctx.close();
}
await browser.close();
