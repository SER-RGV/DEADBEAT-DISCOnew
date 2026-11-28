// Compatibility and persistence marker probe: baseline build vs flag-off build.
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
 const base=process.argv[2]||'http://127.0.0.1:8000';
 const count=Number(process.argv[3]||1000);
 assert(Number.isInteger(count)&&count>0);
 const pages=[];
 async function create(url,flag){const c=await browser.newContext();await c.addInitScript(v=>{window.__DD_ROOM_SPAWN_GUARDS=v;},flag);const p=await c.newPage();pages.push(c);await p.goto(url,{waitUntil:'domcontentloaded'});return p;}
 async function hash(p,version){return p.evaluate(async ({count,version})=>{let parts=[];for(let f=0;f<10;f++)for(let s=0;s<count;s++)parts.push(JSON.stringify(DD_ROOM_GENERATION.generate(s,f,version)));const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(parts.join('\n')));return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');},{count,version});}
 try{
  const old=await create(base+'/backups/room_population_20261126/index.html',false);
  const off=await create(base+'/?roomDebug',false);
  const a=await hash(old), b=await hash(off), explicit=await hash(off,'2.0.0');
  assert.equal(a,b);assert.equal(b,explicit);assert.equal(await off.evaluate(()=>DD_ROOM_GENERATION.version),'2.0.0');
  const on=await create(base+'/?roomDebug',true);
  assert.equal(await on.evaluate(()=>DD_ROOM_GENERATION.version),'2.1.0');
  assert.notEqual(JSON.stringify(await on.evaluate(()=>DD_ROOM_GENERATION.generate(0,0))),JSON.stringify(await off.evaluate(()=>DD_ROOM_GENERATION.generate(0,0))));
  await on.evaluate(()=>{DD_HUB.enter();DD_HUB.exitToRun();});
  await on.waitForFunction(()=>__DD_BRIDGE.isRunning());
  assert.equal(await on.evaluate(()=>JSON.parse(localStorage.getItem('dmo_floor_v32')).generatorVersion),'2.1.0');
  // An old unversioned save selects the old algorithm even with the flag set.
  await on.evaluate(()=>localStorage.setItem('dmo_floor_v32',JSON.stringify({v:1,seed:42,circle:0,floors:{}})));
  await on.reload({waitUntil:'domcontentloaded'});
  assert.equal(await on.evaluate(()=>DD_ROOM_GENERATION.version),'2.0.0');
  // A new marker pins its algorithm even when the opt-in flag is later disabled.
  await off.evaluate(()=>localStorage.setItem('dmo_floor_v32',JSON.stringify({v:1,generatorVersion:'2.1.0',seed:42,circle:0,floors:{}})));
  await off.reload({waitUntil:'domcontentloaded'});
  assert.equal(await off.evaluate(()=>DD_ROOM_GENERATION.version),'2.1.0');
  console.log(JSON.stringify({maps:count*10,baselineSHA256:a,flagOffSHA256:b,explicitLegacySHA256:explicit,flagOnVersion:'2.1.0',unversionedSave:'2.0.0',newSavePins:'2.1.0',savedMarker:'2.1.0',note:'Hash compares generated JSON for seeds 0..N-1 across all floors, not HTML bytes, render or full save/resume.'},null,2));
 }finally{for(const c of pages)await c.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
