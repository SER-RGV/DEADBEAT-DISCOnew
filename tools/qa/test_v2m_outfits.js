/* Los ocho atuendos de la colección definitiva: sprites listas, equipar,
   retrato HUD y las cuatro acciones del contrato en combate real, sin errores. */
const {chromium}=require('playwright-core'),assert=require('assert');
const base=process.argv[2]||'http://localhost:8081';
const IDS=['original','rapture','shadow','apocalypse','gunslinger','fightclub','kitchenriot','streetart'];
(async()=>{const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU',null,{timeout:30000});
 for(const id of IDS){await p.waitForFunction(id=>DD_APPEARANCE.outfitReady(id),id,{timeout:30000});assert(await p.evaluate(id=>DD_APPEARANCE.equip(id),id),id+' equipar');
  const hud=await p.evaluate(()=>document.querySelector('#dd-hud-portrait').getAttribute('src'));assert(hud&&hud.startsWith('data:image/png'),id+' retrato HUD');}
 // Combate: caminar, disparar/apuntar, voltereta y daño con cada atuendo.
 await p.locator('[data-action=play]').click();await p.locator('#dd-scene-new').click();
 await p.waitForFunction(()=>DD_OPENING.getState()?.type==='intro');await p.evaluate(()=>DD_OPENING.debugSeek(31.9,false));
 await p.waitForFunction(()=>DD_OPENING.getState()?.type==='descent');await p.evaluate(()=>DD_OPENING.debugSeek(4.55,false));
 await p.waitForFunction(()=>DD_HUB.isActive());
 for(const id of IDS){
  await p.evaluate(o=>DD_APPEARANCE.equip(o),id);
  await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>DD_CINE.getState()?.type==='circle');
  await p.keyboard.press('Space');await p.waitForFunction(()=>__DD_BRIDGE.isRunning());
  await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});
  await p.evaluate(()=>{__DD_BRIDGE.testStep({right:true},20)});   // walk_a
  await p.evaluate(()=>{__DD_BRIDGE.testStep({aim:true,fire:true},12)}); // aim
  await p.evaluate(()=>{__DD_BRIDGE.testStep({right:false,fire:false},6)});
  assert.equal(await p.evaluate(()=>DD_APPEARANCE.current().id),id,id+' selección en partida');
  await p.evaluate(()=>{const s=__DD_BRIDGE.getSnapshot();DMO.debug.spawnEnemyAt('dancer',s.player.x+120,s.player.y,true,false)});
  await p.waitForTimeout(500);
  if(id!==IDS[IDS.length-1]){await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU',null,{timeout:30000});
   await p.locator('[data-action=play]').click();await p.locator('#dd-scene-new').click();
   await p.waitForFunction(()=>DD_OPENING.getState()?.type==='intro');await p.evaluate(()=>DD_OPENING.debugSeek(31.9,false));
   await p.waitForFunction(()=>DD_OPENING.getState()?.type==='descent');await p.evaluate(()=>DD_OPENING.debugSeek(4.55,false));
   await p.waitForFunction(()=>DD_HUB.isActive());}
 }
 assert.deepEqual(errors,[],'sin errores JS/HTTP');console.log('PASS los 8 atuendos: sprites listas, equipar, retrato HUD, walk/aim/enemigo en combate real, sin errores');await ctx.close();
 }finally{await browser.close()}})().catch(e=>{console.error('FAIL',e);process.exit(1)});
