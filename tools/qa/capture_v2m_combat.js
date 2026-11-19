/* Combate real con las sprites nuevas de un atuendo (walk + aim). Uso: node capture_v2m_combat.js <url> <salida> <outfit> */
const {chromium}=require('playwright-core'),fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8081',out=process.argv[3]||'docs/evidence/atuendos',outfit=process.argv[4]||'original';
(async()=>{const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage();
 await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU',null,{timeout:30000});
 await p.evaluate(o=>DD_APPEARANCE.equip(o),outfit);
 await p.locator('[data-action=play]').click();await p.locator('#dd-scene-new').click();
 await p.waitForFunction(()=>DD_OPENING.getState()?.type==='intro');await p.evaluate(()=>DD_OPENING.debugSeek(31.9,false));
 await p.waitForFunction(()=>DD_OPENING.getState()?.type==='descent');await p.evaluate(()=>DD_OPENING.debugSeek(4.55,false));
 await p.waitForFunction(()=>DD_HUB.isActive());
 await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>DD_CINE.getState()?.type==='circle');
 await p.keyboard.press('Space');await p.waitForFunction(()=>__DD_BRIDGE.isRunning());
 await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});
 await p.waitForTimeout(600);
 fs.mkdirSync(out,{recursive:true});
 await p.evaluate(()=>{__DD_BRIDGE.testStep({right:true},26)});
 await p.waitForTimeout(250);
 await p.screenshot({path:path.join(out,`combate-${outfit}-walk.png`)});
 await p.evaluate(()=>{__DD_BRIDGE.testStep({aim:true,fire:true},20)});
 await p.waitForTimeout(250);
 await p.screenshot({path:path.join(out,`combate-${outfit}-aim.png`)});
 console.log('PASS capturas de combate', outfit);
}finally{await browser.close();}})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
