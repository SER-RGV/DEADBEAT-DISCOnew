// A/B/C generation timing only. No claim about frame time or GPU.
const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});try{
 const p=await b.newPage();await p.goto((process.argv[2]||'http://127.0.0.1:8000')+'/?roomDebug');
 const out=await p.evaluate(()=>{const versions=['2.0.0','2.1.0','2.2.0','2.3.0','2.4.0','2.5.0','2.6.0','2.7.0'],t=Object.fromEntries(versions.map(v=>[v,[]]));
  for(let i=0;i<1020;i++)for(let j=0;j<versions.length;j++){const v=versions[(i+j)%versions.length],a=performance.now();DD_ROOM_GENERATION.generate(Math.floor(i/10)%100,i%10,v);if(i>=20)t[v].push(performance.now()-a);}
  const stats=a=>{a.sort((x,y)=>x-y);return{mean:a.reduce((x,y)=>x+y,0)/a.length,p95:a[950],max:a[999]};};
  return {samplesPerVersion:1000,results:Object.fromEntries(versions.map(v=>[v,stats(t[v])])),note:'Chromium headless generation + bind; 2.1–2.7 also compile and adapt population. 20 warmup sets, 100 seeds over 10 floors. Machine and timer resolution apply; not frame time.'};
 });console.log(JSON.stringify(out,null,2));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
