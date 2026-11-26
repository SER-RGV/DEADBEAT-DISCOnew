// 2.2 runtime nucleus identity, door-gating and saved graph marker.
// Navigation and clearing use debug; this is not a natural campaign.
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
 const p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
 const expectedVersion=process.env.DD_UNIFIED_GEOMETRY==='1'?'2.3.0':'2.2.0';
 if(expectedVersion==='2.3.0')await p.addInitScript(()=>{window.__DD_UNIFIED_ROOM_GEOMETRY=true;});
 else await p.addInitScript(()=>{window.__DD_ROOM_TOPOLOGY_V3=true;});p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto((process.argv[2]||'http://127.0.0.1:8000')+'/?roomDebug&roomSeed=0');
  await p.waitForFunction(()=>DD_BOOT?.getState().state==='MAIN_MENU');
  assert.equal(await p.evaluate(()=>DD_ROOM_GENERATION.version),expectedVersion);
  await p.evaluate(()=>{DD_HUB.enter();DD_HUB.exitToRun();});await p.waitForFunction(()=>__DD_BRIDGE.isRunning());
  // Debug entry into floor 9, then move to the designated entrance.
  await p.evaluate(()=>DMO.explore.debug({action:'goto',level:100}));
  const graph=await p.evaluate(()=>DD_ROOM_DEBUG.current());assert.equal(graph.nodes.length,8);
  const start=graph.nodes.find(n=>n.type==='start'),boss=graph.nodes.find(n=>n.type==='boss');
  assert.equal(start.key,'r100');assert.equal(boss.key,'r99');assert.equal(boss.index,99);
  const go=async key=>{await p.evaluate(k=>DMO.explore.debug({action:'goto',key:k}),key);await p.waitForFunction(k=>DMO.explore.state().key===k,key);};
  await go(start.key);
  let arrival=await p.evaluate(()=>({key:DMO.explore.state().key,type:DD_ROOM_DEBUG.inspect().room.type,boss:!!__DD_BRIDGE.getBoss()?.active}));
  assert.deepEqual(arrival,{key:'r100',type:'start',boss:false});
  const identity=[];
  for(const node of graph.nodes.filter(n=>n.type!=='boss')){
   await go(node.key);
   const check=await p.evaluate(()=>({type:DD_ROOM_DEBUG.inspect().room.type,boss:!!__DD_BRIDGE.getBoss()?.active,circle:DMO.explore.debug({action:'circle'}).circle}));
   assert.equal(check.type,node.type);assert.equal(check.boss,false,node.key+' started a boss');assert.equal(check.circle,9);
   identity.push({key:node.key,type:node.type});
  }
  const elite=graph.nodes.find(n=>n.type==='elite');await go(elite.key);
  await p.evaluate(()=>DMO.explore.debug({action:'clear'}));
  await p.waitForTimeout(900);
  const sealed=await p.evaluate(k=>DMO.explore.state().doors.find(d=>d.to===k),boss.key);assert(sealed&&!sealed.open,'boss must be gated before mandatory rooms are cleared');
  // Visit and clear all nonboss rooms via debug, then approach boss through its actual gate.
  for(const n of graph.nodes.filter(n=>n.type!=='boss')){await go(n.key);await p.evaluate(()=>DMO.explore.debug({action:'clear'}));await p.waitForTimeout(150);}
  await go(elite.key);await p.waitForFunction(k=>DMO.explore.state().doors.some(d=>d.to===k&&d.open),boss.key,{timeout:8000});
  await p.evaluate(k=>DMO.explore.debug({action:'cross',to:k}),boss.key);await p.waitForFunction(k=>DMO.explore.state().key===k,boss.key);
  await p.evaluate(()=>{DMO.debug.invuln(true);DMO.debug.boss();});await p.waitForFunction(()=>__DD_BRIDGE.getBoss()?.active,null,{timeout:20000});
  const actualBoss=await p.evaluate(()=>__DD_BRIDGE.getBoss());assert.equal(actualBoss.final,true);assert(actualBoss.maxHp>0);
  const before=await p.evaluate(()=>({graph:DD_ROOM_DEBUG.current(),saved:JSON.parse(localStorage.getItem('dmo_floor_v32'))}));
  assert.equal(before.saved.generatorVersion,expectedVersion);assert.equal(before.saved.seed,0);
  const savedFloor=before.saved.floors['9'];assert(savedFloor,'missing saved nucleus');
  assert.equal(savedFloor.entry,start.key);assert.equal(savedFloor.boss,boss.key);assert.equal(savedFloor.cells.length,8);
  for(const node of graph.nodes){const cell=savedFloor.cells.find(c=>c.key===node.key);assert(cell,`missing ${node.key} in saved cartography`);assert.deepEqual(cell.links,node.links);}
  await p.reload();await p.waitForFunction(()=>DD_BOOT?.getState().state==='MAIN_MENU');assert.equal(await p.evaluate(()=>DD_ROOM_GENERATION.version),expectedVersion);
  await p.evaluate(()=>{DD_HUB.enter();DD_HUB.exitToRun();});await p.waitForFunction(()=>__DD_BRIDGE.isRunning());
  await p.evaluate(()=>DMO.explore.debug({action:'goto',level:100}));
  const after=await p.evaluate(()=>({graph:DD_ROOM_DEBUG.current(),saved:JSON.parse(localStorage.getItem('dmo_floor_v32'))}));
  assert.deepEqual(after.graph,before.graph);assert.deepEqual(after.saved.floors['9'],before.saved.floors['9']);assert.equal(after.saved.generatorVersion,expectedVersion);assert.equal(after.saved.seed,0);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({version:expectedVersion,seed:0,nucleusRooms:identity,bossKey:boss.key,bossName:actualBoss.name,final:actualBoss.final,gateInitiallyClosed:true,gateAfterClear:true,graphEqualAfterReload:true,saveVersion:after.saved.generatorVersion,errors,note:'Debug goto/clear, boss forced with debug. Saves graph marker/seed and checks rebuild after new run; does not demonstrate active-run resume, natural combat or final victory.'},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
