// Headless generation-only A/B, not a frame-time or GPU benchmark.
const {chromium}=require('playwright-core');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
 try{
  const p=await b.newPage();await p.goto((process.argv[2]||'http://127.0.0.1:8000')+'/?roomDebug');
  const out=await p.evaluate(()=>{
   const times={'2.0.0':[],'2.1.0':[]};
   for(let i=0;i<1020;i++) for(const version of i%2?['2.0.0','2.1.0']:['2.1.0','2.0.0']){
    const seed=Math.floor(i/10)%100,floor=i%10,t=performance.now();
    DD_ROOM_GENERATION.generate(seed,floor,version);
    if(i>=20)times[version].push(performance.now()-t);
   }
   const stats=a=>{a.sort((x,y)=>x-y);return {mean:a.reduce((x,y)=>x+y,0)/a.length,p95:a[Math.floor(a.length*.95)],max:a[a.length-1]};};
   return {'2.0.0':stats(times['2.0.0']),'2.1.0':stats(times['2.1.0']),samplesPerVersion:1000,note:'Chromium headless, interleaved; generate and bind; adapted version additionally compiles prefabs and relocates points. 20 warmup pairs; timer resolution, seed distribution and machine load apply. Not frame time.'};
  });console.log(JSON.stringify(out,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
