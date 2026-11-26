// Compare full versioned plans against the immediate pre-optimization build.
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const count=Number(process.argv[3]||1000);assert(Number.isInteger(count)&&count>0);
 const base=process.argv[2]||'http://127.0.0.1:8000';
 const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
 try{
  const old=await b.newPage(),now=await b.newPage();
  await old.route('**/?roomDebug',r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(path.resolve(__dirname,'../../backups/room_population_precompute_20261126/index.html'))}));
  await old.goto(base+'/?roomDebug',{waitUntil:'domcontentloaded'});await now.goto(base+'/?roomDebug',{waitUntil:'domcontentloaded'});
  assert.equal(await now.evaluate(()=>DD_ROOM_GENERATION.version),'2.0.0');
  async function hash(page,version){return page.evaluate(async ({count,version})=>{let parts=[];for(let f=0;f<10;f++)for(let seed=0;seed<count;seed++)parts.push(JSON.stringify(DD_ROOM_GENERATION.generate(seed,f,version)));const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(parts.join('\n')));return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');},{count,version});}
  const hashes={};for(const version of ['2.0.0','2.1.0','2.2.0','2.3.0']){const before=await hash(old,version),after=await hash(now,version);assert.equal(after,before,version+' changed');hashes[version]=after;}
  console.log(JSON.stringify({seedsPerFloor:count,mapsPerVersion:count*10,defaultVersion:'2.0.0',unchanged:true,hashes,note:'Full serialized plans against prior build; does not establish native movement, rendering or frame time.'},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
