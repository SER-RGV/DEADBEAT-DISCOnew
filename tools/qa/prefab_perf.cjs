// Frame pacing on the shipped scheduler, headless software GL (a lower bound).
const { chromium }=require('playwright-core'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});try{
 const p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.argv[2]||'http://localhost:8000')+'/?roomDebug&roomSeed=0');await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU');
 await p.evaluate(()=>{DD_HUB.enter();DD_HUB.exitToRun()});await p.waitForFunction(()=>__DD_BRIDGE.isRunning());await p.waitForTimeout(900);
 const out=[];
 for(const floor of [1,4]){
  await p.evaluate(f=>DMO.explore.debug({action:'goto',level:1+11*f}),floor);
  const keys=await p.evaluate(()=>{const n=DD_ROOM_DEBUG.current().nodes;return [n[1].key,n[5].key,(n.find(x=>x.shop)||n[7]).key]});
  for(const k of keys){
   await p.evaluate(k=>DMO.explore.debug({action:'goto',key:k}),k);
   await p.waitForFunction(k=>DMO.explore.state().key===k,k,{timeout:8000});
   await p.waitForTimeout(900);
   out.push(await p.evaluate(k=>new Promise(done=>{const d=[];let last=performance.now();function f(t){d.push(t-last);last=t;if(d.length<90)requestAnimationFrame(f);else{d.sort((a,b)=>a-b);done({key:k,enemies:__DD_BRIDGE.getSurvey().enemies.length,meanMs:+(d.reduce((a,b)=>a+b)/d.length).toFixed(1),p95Ms:+d[Math.floor(d.length*.95)].toFixed(1)});}}requestAnimationFrame(f);}),k));
  }
 }
 console.table(out);assert.deepEqual(errors,[]);console.log('PASS frame pacing sampled in 9 new rooms');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
