/* Cosmetic portrait integration. The protagonist dialogue is a test fixture. */
const {chromium}=require('playwright-core'),assert=require('assert'),fs=require('fs');
const base=process.argv[2]||'http://localhost:8081',out=process.argv[3];
(async()=>{const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});try{
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU'&&DD_APPEARANCE.outfitReady('streetart'),null,{timeout:30000});
 const ids=['original','rapture','shadow','apocalypse','gunslinger','fightclub','kitchenriot','streetart'];
 const sources=[];
 for(const id of ids){
  await p.waitForFunction(id=>id==='original'||DD_APPEARANCE.outfitReady(id),id,{timeout:30000});
  const result=await p.evaluate(id=>{const ok=DD_APPEARANCE.equip(id),hud=document.querySelector('#dd-hud-portrait'),dialogue=document.querySelector('#dd-player-dialogue-portrait');return {ok,src:hud.getAttribute('src'),dialogue:dialogue.getAttribute('src')};},id);
  assert(result.ok,id);assert(result.src,id);assert.equal(result.src,result.dialogue,id);assert(result.src.startsWith('data:image/png'),id);sources.push(result.src);
 }
 assert.equal(new Set(sources).size,ids.length,'each look has its own portrait');
 await p.evaluate(()=>DD_UI.refreshAssets());assert.equal(await p.locator('#dd-hud-portrait').getAttribute('src'),sources[7],'asset refresh retains selection');
 // Migración de IDs antiguos: 'painter' → 'streetart' al sincronizar.
 await p.evaluate(()=>{localStorage.setItem(DD_APPEARANCE.key,'painter');DD_APPEARANCE.sync()});
 assert.equal(await p.evaluate(()=>DD_APPEARANCE.current().id),'streetart','legacy id migrates');
 // 'diver' → 'original' al equipar (equip migra también).
 await p.evaluate(()=>DD_APPEARANCE.equip('diver'));
 assert.equal(await p.evaluate(()=>DD_APPEARANCE.current().id),'original','legacy equip migrates');
 await p.evaluate(()=>DD_APPEARANCE.equip('shadow'));await p.reload();await p.waitForFunction(()=>DD_BOOT?.getState().state==='MAIN_MENU'&&DD_APPEARANCE.outfitReady('shadow'),null,{timeout:30000});
 await p.waitForFunction(()=>document.querySelector('#dd-hud-portrait').getAttribute('src')===DD_APPEARANCE.hudPreview('shadow'));
 assert.equal(await p.evaluate(()=>DD_APPEARANCE.current().id),'shadow');
 await p.locator('[data-action=play]').click();await p.locator('#dd-scene-new').click();await p.waitForFunction(()=>DD_OPENING.getState()?.type==='intro');await p.evaluate(()=>DD_OPENING.debugSeek(31.9,false));await p.waitForFunction(()=>DD_OPENING.getState()?.type==='descent');await p.evaluate(()=>DD_OPENING.debugSeek(4.55,false));await p.waitForFunction(()=>DD_HUB.isActive());
 await p.waitForTimeout(400);await p.evaluate(()=>DD_UI.showDialogue('PROTAGONISTA','Prueba de retrato del protagonista.',8));
 assert(await p.locator('#dd-player-portrait-wrap').isVisible());assert(await p.locator('#dd-tempo-portrait-wrap').isHidden());
 assert.equal(await p.locator('#dd-player-dialogue-portrait').getAttribute('src'),await p.locator('#dd-hud-portrait').getAttribute('src'));
 if(out){fs.mkdirSync(out,{recursive:true});await p.screenshot({path:out+'/hud-dialogo-shadow.png'});}
 await p.evaluate(()=>DD_APPEARANCE.equip('fightclub'));assert.equal(await p.locator('#dd-player-dialogue-portrait').getAttribute('src'),await p.locator('#dd-hud-portrait').getAttribute('src'));
 await p.evaluate(()=>DD_UI.showDialogue('TEMPO','Mensaje de Tempo',5));assert(await p.locator('#dd-tempo-portrait-wrap').isVisible());assert(await p.locator('#dd-player-portrait-wrap').isHidden());
 await p.evaluate(()=>DD_UI.showDialogue('DJ VIRGILIO','Mensaje de otro personaje',5));assert(await p.locator('#dd-tempo-portrait-wrap').isHidden());assert(await p.locator('#dd-player-portrait-wrap').isHidden());
 await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>DD_CINE.getState()?.type==='circle');await p.keyboard.press('Space');await p.waitForFunction(()=>__DD_BRIDGE.isRunning());await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});await p.waitForTimeout(400);
 assert.equal(await p.locator('#dd-hud-portrait').getAttribute('src'),await p.evaluate(()=>DD_APPEARANCE.hudPreview('fightclub')));
 if(out)await p.screenshot({path:out+'/hud-combate-fightclub.png'});
 await p.evaluate(()=>{localStorage.setItem('dmodisco_best_round_v1','0');DD_APPEARANCE.sync()});assert.equal(await p.evaluate(()=>DD_APPEARANCE.current().id),'fightclub');assert.equal(await p.locator('#dd-hud-portrait').getAttribute('src'),await p.evaluate(()=>DD_APPEARANCE.hudPreview('fightclub')));
 assert.deepEqual(errors,[]);console.log('PASS 8 atuendos, retrato HUD y diálogo identificado, migración de IDs antiguos, persistencia, refresco de recursos y emisores ajenos; diálogo de prueba');await ctx.close();
 }finally{await browser.close()}})().catch(e=>{console.error('FAIL',e);process.exit(1)});
