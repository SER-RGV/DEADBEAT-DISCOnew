// Seed-0 native perimeter/socket/spawn probe for experimental 2.3.
// Debug navigation; data agreement is not a visual or full-movement proof.
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
 const p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];const expectedVersion=process.env.DD_DECK_REPAIR==='1'?'2.7.0':process.env.DD_CIRCLE_PROFILES==='1'?'2.6.0':process.env.DD_ROOM_SILHOUETTES==='1'?'2.5.0':process.env.DD_ROOM_VARIANTS==='1'?'2.4.0':'2.3.0';if(expectedVersion==='2.7.0')await p.addInitScript(()=>{window.__DD_PREFAB_DECK_REPAIR=true;});else if(expectedVersion==='2.6.0')await p.addInitScript(()=>{window.__DD_CIRCLE_ROOM_PROFILES=true;});else if(expectedVersion==='2.5.0')await p.addInitScript(()=>{window.__DD_ROOM_SILHOUETTES_V3=true;});else if(expectedVersion==='2.4.0')await p.addInitScript(()=>{window.__DD_ROOM_VARIANTS_V3=true;});else await p.addInitScript(()=>{window.__DD_UNIFIED_ROOM_GEOMETRY=true;});p.on('pageerror',e=>errors.push(e.message));
 let rooms=0,doors=0,spawns=0;const failures=[];
 try{
  await p.goto((process.argv[2]||'http://127.0.0.1:8000')+'/?roomDebug&roomSeed=0');await p.waitForFunction(()=>DD_BOOT?.getState().state==='MAIN_MENU');assert.equal(await p.evaluate(()=>DD_ROOM_GENERATION.version),expectedVersion);
  await p.evaluate(()=>{DD_HUB.enter();DD_HUB.exitToRun();});await p.waitForFunction(()=>__DD_BRIDGE.isRunning());
  for(let f=0;f<10;f++){
   await p.evaluate(i=>DMO.explore.debug({action:'goto',level:1+11*i}),f);
   const keys=await p.evaluate(()=>DD_ROOM_DEBUG.current().nodes.filter(n=>n.key!=='r0').map(n=>n.key));
   for(const key of keys){
    await p.evaluate(k=>DMO.explore.debug({action:'goto',key:k}),key);await p.waitForFunction(k=>DMO.explore.state().key===k,key);
    const r=await p.evaluate(()=>{
     const n=DD_ROOM_DEBUG.inspect().room,c=DD_ROOM_GENERATION.playableRoom(n),rect=__DD_BRIDGE.getSnapshot().roomRect,state=DMO.explore.state(),survey=__DD_BRIDGE.getSurvey();
     const pts=n.geometry.pts.map(([x,y])=>({x:rect.x+x*n.geometry.w,y:rect.y+y*n.geometry.h}));
     const close=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-5;
     const poly=state.shape.poly;
     return {key:n.key,geometry:JSON.stringify(n.geometry)===JSON.stringify(c.geometry),width:n.geometry.w===rect.w,height:n.geometry.h===rect.h,poly:poly.length===pts.length&&pts.every(q=>poly.some(p=>close(p,q))),
      doors:c.mesh.openings.map(o=>({ok:survey.doors.some(d=>d.to===o.to&&close({x:d.x,y:d.y},{x:rect.x+o.origin.x,y:rect.y+o.origin.y}))})),
      spawns:n.population.spawns.map(q=>{const x=rect.x+q.x*n.geometry.w,y=rect.y+q.y*n.geometry.h;return DMO.explore.contains(x,y,36)&&!DMO.layout.pointBlocked(x,y,36);})};
    });
    rooms++;doors+=r.doors.length;spawns+=r.spawns.length;
    if(!r.geometry||!r.width||!r.height||!r.poly||r.doors.some(v=>!v.ok)||r.spawns.some(v=>!v))failures.push({floor:f,...r});
   }
  }
  assert.equal(rooms,115);assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({seed:0,version:expectedVersion,rooms,doors,spawns,failures,errors,note:'Debug navigation; compares installed native polygon/socket centres and point probes. No visual screenshot inspection, continuous movement, natural combat or all-seed physical coverage.'},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
