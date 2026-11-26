// Headless software rendering A/B; seed 0/r1, debug navigation, held spawns.
// Not a real-GPU, campaign, or allocation-free proof.
const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu','--js-flags=--expose-gc']});
 const base=process.argv[2]||'http://127.0.0.1:8000',results={};
 try{
  for(const mode of ['original','optimized']){
   const p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   if(mode==='optimized')await p.addInitScript(()=>{window.__DD_CIRCLE_ROOM_PROFILES=true;});
   await p.goto(base+'/?roomDebug&roomSeed=0');await p.waitForFunction(()=>DD_BOOT?.getState().state==='MAIN_MENU');
   if(await p.evaluate(()=>DD_ROOM_GENERATION.version)!==(mode==='original'?'2.0.0':'2.6.0'))throw Error('incorrect mode');
   await p.evaluate(()=>{DD_HUB.enter();DD_HUB.exitToRun();});await p.waitForFunction(()=>__DD_BRIDGE.isRunning());
   await p.evaluate(()=>{DMO.debug.invuln(true);DMO.debug.holdSpawns(true);DMO.explore.debug({action:'goto',key:'r1'});});
   await p.waitForFunction(()=>DMO.explore.state().key==='r1');await p.waitForTimeout(3000);
   const cdp=await p.context().newCDPSession(p);await cdp.send('HeapProfiler.collectGarbage');const before=await cdp.send('Runtime.getHeapUsage');
   await cdp.send('HeapProfiler.startSampling',{samplingInterval:8192});
   const frames=await p.evaluate(()=>new Promise(resolve=>{const d=[];let prev;function f(t){if(prev!==undefined)d.push(t-prev);prev=t;if(d.length===240){d.sort((a,b)=>a-b);resolve({mean:d.reduce((a,b)=>a+b,0)/d.length,p95:d[228],max:d[239],count:d.length,enemies:__DD_BRIDGE.getSurvey().enemies.length});}else requestAnimationFrame(f);}requestAnimationFrame(f);}));
   const sample=await cdp.send('HeapProfiler.stopSampling');await cdp.send('HeapProfiler.collectGarbage');const after=await cdp.send('Runtime.getHeapUsage');
   results[mode]={frames,postGcDelta:after.usedSize-before.usedSize,sampledBytes:sample.profile.samples.reduce((s,x)=>s+x.size,0),errors};
   if(errors.length)throw Error(errors.join('\n'));await p.close();
  }
  console.log(JSON.stringify({results,note:'2.0 original versus 2.6 profiles, sequential Chromium headless software GL; one seed/room, spawns held, 240 rAF intervals. Sampling is approximate, includes app and QA activity; post-GC delta is not peak memory or leak proof.'},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
