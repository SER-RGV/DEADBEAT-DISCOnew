// Determinism and version pinning of the actual generated 2.2 build.
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
 const base=process.argv[2]||'http://127.0.0.1:8000',count=Number(process.argv[3]||1000);assert(Number.isInteger(count)&&count>0);
 const contexts=[];
 async function page(flag,prior){const c=await b.newContext();contexts.push(c);await c.addInitScript(v=>{window.__DD_ROOM_TOPOLOGY_V3=v;},flag);const p=await c.newPage();if(prior)await p.route('**/?roomDebug',r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(path.resolve(__dirname,'../../backups/room_topology_engine_20261126/index.html'))}));await p.goto(base+'/?roomDebug',{waitUntil:'domcontentloaded'});return p;}
 async function hash(p,version){return p.evaluate(async ({version,count})=>{const out=[];for(let f=0;f<10;f++)for(let s=0;s<count;s++)out.push(JSON.stringify(DD_ROOM_GENERATION.generate(s,f,version)));const a=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(out.join('\n')));return Array.from(new Uint8Array(a),x=>x.toString(16).padStart(2,'0')).join('');},{version,count});}
 try{
  const old=await page(false,true),off=await page(false,false),on=await page(true,false);
  assert.equal(await on.evaluate(()=>DD_ROOM_GENERATION.version),'2.2.0');
  const old20=await hash(old,'2.0.0'),new20=await hash(off,'2.0.0');assert.equal(old20,new20);
  const old21=await hash(old,'2.1.0'),new21=await hash(off,'2.1.0');assert.equal(old21,new21);
  const first=await hash(on,'2.2.0'),second=await hash(on,'2.2.0');assert.equal(first,second);
  const state=await on.evaluate(()=>{const r=DD_ROOM_GENERATION.generate(0,9);return {start:r.nodes.find(n=>n.type==='start').key,boss:r.nodes.find(n=>n.type==='boss').key,cycles:r.nodes.reduce((s,n)=>s+n.links.length,0)/2-r.nodes.length+1};});assert.deepEqual(state,{start:'r100',boss:'r99',cycles:2});
  for(const [version,expected] of [[undefined,'2.0.0'],['2.1.0','2.1.0'],['2.2.0','2.2.0']]){
   await on.evaluate(v=>localStorage.setItem('dmo_floor_v32',JSON.stringify({v:1,seed:0,floors:{},...(v?{generatorVersion:v}:{})})),version);
   await on.reload({waitUntil:'domcontentloaded'});assert.equal(await on.evaluate(()=>DD_ROOM_GENERATION.version),expected);
  }
  await off.evaluate(()=>localStorage.setItem('dmo_floor_v32',JSON.stringify({v:1,seed:0,floors:{},generatorVersion:'2.2.0'})));
  await off.reload({waitUntil:'domcontentloaded'});assert.equal(await off.evaluate(()=>DD_ROOM_GENERATION.version),'2.2.0');
  console.log(JSON.stringify({maps:count*10,legacyHash:old20,legacyUnchanged:old20===new20,adaptedHash:old21,adaptedUnchanged:old21===new21,topologyHash:first,topologyDeterministic:first===second,pinnedUnversioned:'2.0.0',pinned21:'2.1.0',pinned22:'2.2.0',pin22OverridesFlag:true,nucleus:state,note:'Hash comparisons of generated plans and version markers, not active-run save/resume or full engine progression.'},null,2));
 }finally{for(const c of contexts)await c.close();await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
