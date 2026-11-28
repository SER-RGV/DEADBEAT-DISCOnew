// Diagnostic only. Requires externally installed playwright-core and Chromium.
// NODE_PATH=... DD_CHROMIUM=... node tools/qa/room_generation_memory.cjs http://127.0.0.1:8000
const {chromium}=require('playwright-core');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu','--js-flags=--expose-gc']});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
    await page.goto((process.argv[2]||'http://127.0.0.1:8000')+'/?roomDebug&roomSeed=0');
    await page.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU');
    await page.evaluate(()=>{DD_HUB.enter();DD_HUB.exitToRun();});
    await page.waitForFunction(()=>__DD_BRIDGE.isRunning());
    await page.evaluate(()=>{DMO.debug.invuln(true);DMO.explore.debug({action:'goto',key:'r1'});});
    await page.waitForFunction(()=>DMO.explore.state().key==='r1');
    await page.waitForTimeout(4000);
    const cdp=await page.context().newCDPSession(page);
    await cdp.send('HeapProfiler.enable');
    await cdp.send('HeapProfiler.collectGarbage');
    const before=await cdp.send('Runtime.getHeapUsage');
    await cdp.send('HeapProfiler.startSampling',{samplingInterval:8192,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});
    const frames=await page.evaluate(()=>new Promise(resolve=>{let n=0,first,last;function frame(t){if(!n)first=t;last=t;if(++n===240)resolve({frames:n,elapsedMs:last-first,room:DMO.explore.state().key,enemyCount:__DD_BRIDGE.getSurvey().enemies.length});else requestAnimationFrame(frame);}requestAnimationFrame(frame);}));
    const sample=await cdp.send('HeapProfiler.stopSampling');
    await cdp.send('HeapProfiler.collectGarbage');
    const after=await cdp.send('Runtime.getHeapUsage');
    let sampledBytes=0;for(const s of sample.profile.samples)sampledBytes+=s.size;
    console.log(JSON.stringify({browser:browser.version(),frames,before,after,postGcUsedDifference:after.usedSize-before.usedSize,sampledBytes,samplingInterval:8192,sampleCount:sample.profile.samples.length,errors,note:'Sampling is approximate, includes the diagnostic requestAnimationFrame callback and browser/app activity; not an exact allocation count. Heap difference is not peak memory or a leak test; software GL, no GPU measurement.'},null,2));
    if(errors.length)process.exitCode=1;
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
