// Immediate prior build vs shared preparation; interleave same seed/floor per page.
const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu','--js-flags=--expose-gc']});try{
 const base=process.argv[2]||'http://127.0.0.1:8000',pages={before:await b.newPage(),after:await b.newPage()};
 await pages.before.route('**/?roomDebug',r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(path.resolve(__dirname,'../../backups/room_stair_repair_20261126/index.html'))}));
 for(const p of Object.values(pages))await p.goto(base+'/?roomDebug',{waitUntil:'domcontentloaded'});
 // Each evaluation runs a matched batch. Alternate order per 10-sample block.
 const times={legacy:[],before:[],after:[]};pages.legacy=pages.after;for(let block=0;block<110;block++)for(const name of (block%2?['after','before','legacy']:['legacy','before','after'])){
  const batch=await pages[name].evaluate(({block,name})=>{let a=[];for(let i=0;i<10;i++){let s=block,f=i,t=performance.now();DD_ROOM_GENERATION.generate(s,f,name==='legacy'?'2.0.0':name==='before'?'2.7.0':'2.8.0');if(block>=10)a.push(performance.now()-t);}return a;},{block,name});times[name].push(...batch);
 }
 const result={};for(const name of Object.keys(times)){const t=times[name].sort((a,b)=>a-b);assert.equal(t.length,1000);result[name]={mean:t.reduce((x,y)=>x+y,0)/t.length,p95:t[950],max:t[999],samples:t.length};}
 console.log(JSON.stringify({result,note:'Chromium headless, Matched unique seeds 10..109 for each floor (1000 distinct seed/floor pairs), 100 warmup maps/version, alternating version order; legacy and after share a page. Compares 2.0, 2.7 and 2.8; generation+bind, not frame/memory or GPU. Timer resolution/noise apply.'},null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
