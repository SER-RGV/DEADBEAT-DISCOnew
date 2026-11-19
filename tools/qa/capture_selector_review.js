/* Captura las pantallas de selección: camerino por atuendo + Extras. */
const {chromium}=require('playwright-core'),fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8081',out=process.argv[3]||'.cache/review/selector';
const IDS=['original','rapture','shadow','apocalypse','gunslinger','fightclub','kitchenriot','streetart'];
(async()=>{const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage();
 await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU',null,{timeout:30000});
 fs.mkdirSync(out,{recursive:true});
 await p.locator('[data-action=customize]').click();
 await p.waitForFunction(()=>DD_APPEARANCE.outfitReady('streetart'));
 for(const id of IDS){
  await p.locator(`[data-look=${id}]`).click();
  await p.waitForTimeout(700);
  await p.screenshot({path:path.join(out,`camerino-${id}.png`)});
  const hud=await p.evaluate(()=>document.querySelector('#dd-hud-portrait').getAttribute('src'));
  const b64=hud.replace(/^data:image\/png;base64,/,'');
  fs.writeFileSync(path.join(out,`hud-${id}.png`),Buffer.from(b64,'base64'));
 }
 await p.keyboard.press('Escape');
 await p.locator('[data-action=extras]').click();
 await p.waitForTimeout(900);
 await p.screenshot({path:path.join(out,'extras.png')});
 console.log('PASS capturas de selección guardadas');
}finally{await browser.close();}})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
