// Versioned build compatibility, opt-in and save precedence for 2.4.
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const count=Number(process.argv[3]||100);assert(Number.isInteger(count)&&count>0);const base=process.argv[2]||'http://127.0.0.1:8000';
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
 try{
  const old=await browser.newPage(),now=await browser.newPage(),on=await browser.newPage();
  await old.route('**/?roomDebug',r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(path.resolve(__dirname,'../../backups/room_variants_20261126/index.html'))}));
  await old.goto(base+'/?roomDebug',{waitUntil:'domcontentloaded'});await now.goto(base+'/?roomDebug',{waitUntil:'domcontentloaded'});
  await on.addInitScript(()=>{window.__DD_ROOM_VARIANTS_V3=true;});await on.goto(base+'/?roomDebug',{waitUntil:'domcontentloaded'});
  assert.equal(await now.evaluate(()=>DD_ROOM_GENERATION.version),'2.0.0');assert.equal(await on.evaluate(()=>DD_ROOM_GENERATION.version),'2.4.0');
  async function hash(page,version){return page.evaluate(async ({count,version})=>{let data=[];for(let floor=0;floor<10;floor++)for(let seed=0;seed<count;seed++)data.push(JSON.stringify(DD_ROOM_GENERATION.generate(seed,floor,version)));const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data.join('\n')));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');},{count,version});}
  const hashes={};for(const version of ['2.0.0','2.1.0','2.2.0','2.3.0']){let a=await hash(old,version),b=await hash(now,version);assert.equal(a,b,version);hashes[version]=b;}
  const h1=await hash(now,'2.4.0'),h2=await hash(now,'2.4.0');assert.equal(h1,h2);hashes['2.4.0']=h1;
  await on.evaluate(()=>localStorage.setItem('dmo_floor_v32',JSON.stringify({v:1,seed:0,floors:{},generatorVersion:'2.3.0'})));await on.reload({waitUntil:'domcontentloaded'});assert.equal(await on.evaluate(()=>DD_ROOM_GENERATION.version),'2.3.0');
  await now.evaluate(()=>localStorage.setItem('dmo_floor_v32',JSON.stringify({v:1,seed:0,floors:{},generatorVersion:'2.4.0'})));await now.reload({waitUntil:'domcontentloaded'});assert.equal(await now.evaluate(()=>DD_ROOM_GENERATION.version),'2.4.0');
  console.log(JSON.stringify({seedsPerFloor:count,mapsPerVersion:count*10,legacyPlansUnchanged:true,variantsDeterministic:true,default:'2.0.0',flag:'2.4.0',saved23OverridesFlag:true,saved24OverridesFlag:true,hashes,note:'Plan hash and save marker tests, not active-run resume or native movement.'},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
