// Debug-assisted 2.6 progression through the real final-victory branch.
// Instrumentation is injected into a disposable page only; this taints the run.
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.__DD_CIRCLE_ROOM_PROFILES=true;});
 await p.route('**/?roomDebug&roomSeed=0',async route=>{
  const response=await route.fetch();let html=await response.text();
  const marker='window.__DD_BRIDGE = Object.freeze({', victory='function pp(){';
  assert.equal(html.split(marker).length,2);assert.equal(html.split(victory).length,2);
  html=html.replace(marker,'window.__QA_V3=()=>({mandatory:allMandatoryClearedV3(),rounds:un.roundsCompleted,finalDown:dr,running:U,paused:Y,modal:W,choice:V,dead:Mr,queued:Jo-Ko,enemies:Ta.length,boss:ir,finishing:mo.finishing,pending:mo.pending.length,offer:!!mo.active});window.__QA_V3_finishWaves=()=>{Ko=Jo;Ta.length=0;Kr.length=0;Ia.length=0;Y=false;W=false;V=false;};'+marker);
  html=html.replace(victory,'function pp(){window.__QA_V3_victoryPath=true;');
  await route.fulfill({response,body:html});
 });
 try{
  await p.goto((process.argv[2]||'http://127.0.0.1:8000')+'/?roomDebug&roomSeed=0');
  await p.waitForFunction(()=>DD_BOOT?.getState().state==='MAIN_MENU');assert.equal(await p.evaluate(()=>DD_ROOM_GENERATION.version),'2.6.0');
  await p.evaluate(()=>{DD_HUB.enter();DD_HUB.exitToRun();});await p.waitForFunction(()=>__DD_BRIDGE.isRunning());
  await p.evaluate(()=>DMO.debug.invuln(true));
  assert.equal(await p.evaluate(()=>__QA_V3().mandatory),false,'fresh run must not satisfy final gate');
  for(let floor=0;floor<9;floor++){
   const nodes=await p.evaluate(()=>DD_ROOM_DEBUG.current().nodes.filter(n=>!n.shop&&!['secret','supersecret'].includes(n.type)).map(n=>n.key));
   for(const key of nodes){await p.evaluate(k=>DMO.explore.debug({action:'goto',key:k}),key);await p.waitForFunction(k=>DMO.explore.state().key===k,key);await p.evaluate(()=>DMO.explore.debug({action:'clear'}));await p.waitForTimeout(100);}
   const boss=await p.evaluate(()=>DD_ROOM_DEBUG.current().nodes.find(n=>n.type==='boss').key);
   await p.evaluate(k=>DMO.explore.debug({action:'goto',key:k}),boss);
   await p.waitForFunction(()=>DMO.explore.state().doors.some(d=>d.lift&&d.open),null,{timeout:8000});
   await p.evaluate(()=>DMO.explore.debug({action:'nextFloor'}));
   try {await p.waitForFunction(f=>DMO.explore.state().floor===f+2,floor,{timeout:15000});}
   catch(e){throw Error('floor '+floor+' transition failed: '+JSON.stringify(await p.evaluate(()=>({state:DMO.explore.state(),running:__DD_BRIDGE.isRunning(),qa:__QA_V3()})))+' '+e.message);}
  }
  assert.equal(await p.evaluate(()=>DMO.explore.state().key),'r100');
  const nodes=await p.evaluate(()=>DD_ROOM_DEBUG.current().nodes.filter(n=>n.type!=='boss').map(n=>n.key));
  for(const key of nodes){await p.evaluate(k=>DMO.explore.debug({action:'goto',key:k}),key);await p.waitForFunction(k=>DMO.explore.state().key===k,key);await p.evaluate(()=>DMO.explore.debug({action:'clear'}));await p.waitForTimeout(100);}
  const before=await p.evaluate(()=>__QA_V3());assert.equal(before.mandatory,true);assert(before.rounds<99,'test must exercise new rule, not legacy >=99 count');
  const elite=await p.evaluate(()=>DD_ROOM_DEBUG.current().nodes.find(n=>n.type==='elite').key);
  await p.evaluate(k=>DMO.explore.debug({action:'goto',key:k}),elite);
  await p.waitForFunction(()=>DMO.explore.state().doors.some(d=>d.to==='r99'&&d.open),null,{timeout:8000});
  // The separate live test exercises crossing; this harness uses debug goto.
  await p.evaluate(()=>DMO.explore.debug({action:'goto',key:'r99'}));await p.waitForFunction(()=>DMO.explore.state().key==='r99');
  await p.evaluate(()=>DMO.debug.boss());await p.waitForFunction(()=>__DD_BRIDGE.getBoss()?.active,null,{timeout:20000});
  const boss=await p.evaluate(()=>__DD_BRIDGE.getBoss());assert.equal(boss.final,true);
  await p.evaluate(()=>{__DD_BRIDGE.killBoss();__QA_V3_finishWaves();});
  // Final salvage/etching can present a real choice before pp(); select it.
  for(let i=0;i<30 && !await p.evaluate(()=>window.__QA_V3_victoryPath===true);i++){
    const choice=p.locator('#shot-choice-overlay.visible #shot-choice-options button').first();
    if(await choice.isVisible()) await choice.click();
    await p.waitForTimeout(500);
  }
  if(!await p.evaluate(()=>window.__QA_V3_victoryPath===true)) throw Error('victory path not reached: '+JSON.stringify(await p.evaluate(()=>__QA_V3())));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({mandatoryBeforeBoss:before.mandatory,roundsBeforeBoss:before.rounds,finalBoss:boss.name,enteredRealVictoryPath:true,errors,note:'Debug teleport, clear, forced boss, wave completion and test-only branch instrumentation. The run is tainted: this does not prove a natural campaign or recorded untainted victory.'},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
