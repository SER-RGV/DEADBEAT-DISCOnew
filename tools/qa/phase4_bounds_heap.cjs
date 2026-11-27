// A/B generation + retained heap after GC, 2.7 original versus experimental combined search.
// Chromium headless; app activity and GC sampling can affect results.
const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu','--js-flags=--expose-gc']});
 const base=process.argv[2]||'http://127.0.0.1:8000',results={};
 try{
  for(const mode of ['original','optimized']){
   const p=await b.newPage();
   if(mode==='original')await p.route('**/?roomDebug',route=>route.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(path.resolve(__dirname,'../..',process.argv[3]||'backups/room_perf_distance_20261126/index.html'))}));
   await p.goto(base+'/?roomDebug');await p.waitForFunction(()=>DD_BOOT?.getState().state==='MAIN_MENU');await p.waitForTimeout(2000);
   const cdp=await p.context().newCDPSession(p);await cdp.send('HeapProfiler.collectGarbage');const before=await cdp.send('Runtime.getHeapUsage');
   const times=await p.evaluate(()=>{const samples=[];for(let i=0;i<1020;i++){const start=performance.now();DD_ROOM_GENERATION.generate(Math.floor(i/10)%100,i%10,'2.7.0');if(i>=20)samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);return {mean:samples.reduce((a,b)=>a+b,0)/samples.length,p95:samples[950],max:samples[999],count:samples.length};});
   await cdp.send('HeapProfiler.collectGarbage');const after=await cdp.send('Runtime.getHeapUsage');
   results[mode]={times,beforeUsed:before.usedSize,afterUsed:after.usedSize,retainedDifference:after.usedSize-before.usedSize};await p.close();
  }
  console.log(JSON.stringify({results,note:'Sequential headless page samples, 20 warmup maps and 1000 measured maps each (2.7). Post-GC heap deltas include app/browser activity and do not prove leak or total memory; no frame measurements.'},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
