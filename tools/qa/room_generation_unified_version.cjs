// 2.3 determinism, compiled perimeter consistency and 2.2 backward compatibility.
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
 const base=process.argv[2]||'http://127.0.0.1:8000',count=Number(process.argv[3]||1000);assert(Number.isInteger(count)&&count>0);
 try{
  const old=await b.newPage();await old.route('**/?roomDebug',r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(path.resolve(__dirname,'../../backups/room_unified_geometry_20261126/index.html'))}));
  await old.goto(base+'/?roomDebug',{waitUntil:'domcontentloaded'});
  const current=await b.newPage();await current.addInitScript(()=>{window.__DD_UNIFIED_ROOM_GEOMETRY=true;});await current.goto(base+'/?roomDebug',{waitUntil:'domcontentloaded'});
  assert.equal(await current.evaluate(()=>DD_ROOM_GENERATION.version),'2.3.0');
  async function hash(p,version){return p.evaluate(async ({count,version})=>{const parts=[];for(let f=0;f<10;f++)for(let s=0;s<count;s++)parts.push(JSON.stringify(DD_ROOM_GENERATION.generate(s,f,version)));const a=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(parts.join('\n')));return Array.from(new Uint8Array(a),x=>x.toString(16).padStart(2,'0')).join('');},{count,version});}
  const previous=await hash(old,'2.2.0'),legacy=await hash(current,'2.2.0');assert.equal(previous,legacy);
  const result=await current.evaluate(count=>{let maps=0,rooms=0,skipped=0,mismatches=0,changesOtherThanGeometry=0;
   for(let f=0;f<10;f++)for(let s=0;s<count;s++){
    const a=DD_ROOM_GENERATION.generate(s,f,'2.3.0'),again=DD_ROOM_GENERATION.generate(s,f,'2.3.0'),prior=DD_ROOM_GENERATION.generate(s,f,'2.2.0');
    if(JSON.stringify(a)!==JSON.stringify(again))throw Error('nondeterminism '+f+'/'+s);
    if(JSON.stringify(a.nodes.map(({geometry,...rest})=>rest))!==JSON.stringify(prior.nodes.map(({geometry,...rest})=>rest)))changesOtherThanGeometry++;
    for(const node of a.nodes){const c=DD_ROOM_GENERATION.playableRoom(node);if(!c){skipped++;continue;}rooms++;
     if(JSON.stringify(node.geometry)!==JSON.stringify(c.geometry))mismatches++;
     if(c.mesh.openings.length!==node.prefab.connections.length)throw Error('opening count');
    } maps++;
   }
   return {maps,rooms,skippedHangar:skipped,mismatches,changesOtherThanGeometry};
  },count);
  assert.equal(result.maps,count*10);assert.equal(result.mismatches,0);assert.equal(result.changesOtherThanGeometry,0);
  await current.evaluate(()=>localStorage.setItem('dmo_floor_v32',JSON.stringify({v:1,seed:0,floors:{},generatorVersion:'2.2.0'})));await current.reload({waitUntil:'domcontentloaded'});assert.equal(await current.evaluate(()=>DD_ROOM_GENERATION.version),'2.2.0');
  const off=await b.newPage();await off.goto(base+'/?roomDebug',{waitUntil:'domcontentloaded'});await off.evaluate(()=>localStorage.setItem('dmo_floor_v32',JSON.stringify({v:1,seed:0,floors:{},generatorVersion:'2.3.0'})));await off.reload({waitUntil:'domcontentloaded'});assert.equal(await off.evaluate(()=>DD_ROOM_GENERATION.version),'2.3.0');
  console.log(JSON.stringify({...result,version:'2.3.0',legacy22Hash:legacy,legacy22Unchanged:true,saved22Pins:'2.2.0',saved23OverridesFlag:true,note:'Plan vs compiled data, not a proof of native movement, all physical doors, or visual rendering.'},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
