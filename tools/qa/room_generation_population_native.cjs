// Native runtime probe with the opt-in flag enabled before loading the game.
// Requires Playwright and Chromium. Debug navigation bypasses combat/progression.
const {chromium} = require('playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
 const p=await browser.newPage({viewport:{width:1280,height:800}}), errors=[];
 await p.addInitScript(()=>{window.__DD_ROOM_SPAWN_GUARDS=true;localStorage.removeItem('dmo_floor_v32');});
 p.on('pageerror',e=>errors.push(e.message));
 const result={seeds:[],rooms:0,spawns:0,blocked:0,outside:0,rewardBlocked:0,examples:[],errors,note:'Flag activo en runtime. Navegación con debug; checks nativos contains/pointBlocked, no prueba combate natural ni campaña.'};
 try {
  for(const seed of [0,1]) {
   await p.goto((process.argv[2]||'http://127.0.0.1:8000')+'/?roomDebug&roomSeed='+seed);
   await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU');
   if(await p.evaluate(()=>DD_ROOM_GENERATION.version)!=='2.1.0') throw Error('flag did not select 2.1.0');
   await p.evaluate(()=>{DD_HUB.enter();DD_HUB.exitToRun();});
   await p.waitForFunction(()=>__DD_BRIDGE.isRunning());
   result.seeds.push(seed);
   for(let floor=0;floor<10;floor++) {
    await p.evaluate(f=>DMO.explore.debug({action:'goto',level:1+11*f}),floor);
    const keys=await p.evaluate(()=>DD_ROOM_DEBUG.current().nodes.filter(n=>n.key!=='r0').map(n=>n.key));
    for(const key of keys) {
     await p.evaluate(k=>DMO.explore.debug({action:'goto',key:k}),key);
     await p.waitForFunction(k=>DMO.explore.state().key===k,key,{timeout:8000});
     const r=await p.evaluate(()=>{
      const node=DD_ROOM_DEBUG.inspect().room, c=DD_ROOM_GENERATION.playableRoom(node);
      const pop=node.population, rect=__DD_BRIDGE.getSnapshot().roomRect;
      const status=(x,y)=>({inside:DMO.explore.contains(x,y,36),blocked:DMO.layout.pointBlocked(x,y,36)});
      const spawns=pop.spawns.map(v=>{const x=rect.x+v.x*c.geometry.w,y=rect.y+v.y*c.geometry.h;return {x,y,...status(x,y)};});
      const rewards=[-80,0,80].map(dx=>status(rect.x+pop.reward.x*c.geometry.w+dx,rect.y+pop.reward.y*c.geometry.h));
      return {key:node.key,spawns,rewards,obstacles:DD_ROOM_DEBUG.inspect().obstacles};
     });
     result.rooms++;result.spawns+=r.spawns.length;
     for(const s of r.spawns){if(!s.inside)result.outside++;if(s.blocked)result.blocked++;}
     result.rewardBlocked+=r.rewards.filter(s=>!s.inside||s.blocked).length;
     if((r.spawns.some(s=>!s.inside||s.blocked)||r.rewards.some(s=>!s.inside||s.blocked))&&result.examples.length<15)result.examples.push({seed,floor,...r});
    }
   }
  }
  console.log(JSON.stringify(result,null,2));
  if(errors.length||result.outside||result.blocked||result.rewardBlocked||result.rooms!==216)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
