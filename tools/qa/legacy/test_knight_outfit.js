/* End-to-end cosmetic test with all outfits available for preview. */
const {chromium}=require('playwright-core'), assert=require('assert'), fs=require('fs');
const base=process.argv[2]||'http://localhost:8081', out=process.argv[3];
(async()=>{const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});try{
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU' && DD_APPEARANCE.knightReady(),null,{timeout:30000});
 await p.locator('[data-action=customize]').click();await p.waitForSelector('[data-look=knight]');assert(await p.locator('[data-look=knight]').isEnabled());
 await p.locator('[data-look=knight]:not(:disabled)').click();assert.equal(await p.locator('[data-look=knight]').getAttribute('aria-pressed'),'true');
 if(out){fs.mkdirSync(out,{recursive:true});await p.waitForTimeout(900);await p.screenshot({path:out+'/camerino-caballero.png'});}
 await p.reload();await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU'&&DD_APPEARANCE.knightReady(),null,{timeout:30000});assert.equal(await p.evaluate(()=>DD_APPEARANCE.current().id),'knight');
 const poses=await p.evaluate(()=>{
  const states=[['idle','player_idle','player_idle',false,false],['walk','player_idle','player_walk1',true,false],['aim','player_fire','player_idle',false,true],['move-aim','player_fire','player_walk1',true,true],['hurt','player_hit','player_idle',false,true],['roll','player_roll','player_idle',false,false],['death','player_death','player_idle',false,false]];
  return states.map(([n,u,l,split,armed])=>{const a={upperPose:u,lowerPose:l,waistSplitActive:split};const pose=DD_WORLD.resolvePlayerPose(a,0,armed);const mount=DD_WORLD.getPlayerWeaponMount(a,0,1);return {n,upper:pose.upperImg.src,lower:pose.lowerImg.src,split:pose.split,hand:pose.hand,mount};});
 });
 for(const pose of poses)assert(pose.upper.includes('/outfits/caballero/'),pose.n);assert(poses.find(x=>x.n==='move-aim').split);assert(poses.find(x=>x.n==='aim').mount);assert(!poses.find(x=>x.n==='roll').hand);
 await p.locator('[data-action=play]').click();await p.locator('#dd-scene-new').click();await p.waitForFunction(()=>DD_OPENING.getState()?.type==='intro');await p.evaluate(()=>DD_OPENING.debugSeek(31.9,false));await p.waitForFunction(()=>DD_OPENING.getState()?.type==='descent');await p.evaluate(()=>DD_OPENING.debugSeek(4.55,false));await p.waitForFunction(()=>DD_HUB.isActive());
 if(out){await p.waitForTimeout(500);await p.screenshot({path:out+'/refugio-caballero.png'});}await p.keyboard.down('d');await p.waitForTimeout(700);if(out)await p.screenshot({path:out+'/refugio-caballero-andando.png'});await p.keyboard.up('d');
 await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>DD_CINE.getState()?.type==='circle');await p.keyboard.press('Space');await p.waitForFunction(()=>__DD_BRIDGE.isRunning());await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});await p.waitForTimeout(500);
 if(out)await p.screenshot({path:out+'/combate-caballero.png'});
 await p.evaluate(()=>__DD_BRIDGE.testStep({right:true,fire:true,aim:0},20));assert(await p.evaluate(()=>DMO.playerAnim.getStateSnapshot().waistSplitActive));if(out)await p.screenshot({path:out+'/combate-caballero-movimiento.png'});
 assert.deepEqual(errors,[]);console.log('PASS disponibilidad de prueba, selección, persistencia, imágenes en poses y Refugio');await ctx.close();
 }finally{await browser.close()}})().catch(e=>{console.error('FAIL',e);process.exit(1)});
