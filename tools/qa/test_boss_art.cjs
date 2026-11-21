// Exercise production frame selection, including the intentional legacy fallback.
const {chromium}=require('playwright-core');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
  try {
    const p=await browser.newPage();await p.goto(process.argv[2]||'http://localhost:8000');
    await p.waitForFunction(()=>window.DD_WORLD && Object.keys(DD_ASSETS.manifest.entries).filter(k=>/^boss_\d\d_/.test(k)).every(k=>DD_ASSETS.get(k)?.naturalWidth));
    console.log(await p.evaluate(()=>{
      const art=DD_ASSETS.manifest.entries, ids=Object.keys(art).filter(k=>/^boss_\d\d_/.test(k));
      if(ids.length!==42)throw Error('Unexpected boss catalog: '+ids.length);
      const g=document.createElement('canvas').getContext('2d'),draw=g.drawImage.bind(g);
      let expected,seen,dedicated=0,fallback=0;
      g.drawImage=(im,...args)=>{if(im===expected)seen=true;draw(im,...args);};
      for(const idle of ids.filter(k=>k.endsWith('_idle'))){
        const slug=idle.slice(0,-5);
        for(const state of ['idle','attack','hit','death']){
          const key=slug+'_'+state, anchored=art[idle].anchors&&art[key]?.anchors&&art[key].rev===art[idle].rev;
          const id=anchored?key:idle;expected=DD_ASSETS.get(id);seen=false;
          const actor={x:100,y:100,r:24};
          if(state==='death')DD_WORLD.drawBossDeath(g,{...actor,ddSlug:slug,age:.25,duration:.5},1);
          else DD_WORLD.drawBoss(g,actor,{slug,state},1);
          if(!seen)throw Error('Expected '+id+' during '+state);
          if(key===id)dedicated++;else fallback++;
        }
      }
      return {loaded:ids.length,draws:dedicated+fallback,matchingPose:dedicated,legacyIdle:fallback};
    }));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
