// Isolated HD rendering probe. Do not spawn conventional bullets in a Dice run.
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const {readdirSync}=require('node:fs');
const {resolve}=require('node:path');
(async()=>{
  const ids=readdirSync(resolve(__dirname,'../../assets/effects')).filter(n=>n.endsWith('.png')).map(n=>n.slice(0,-4));
  assert.equal(ids.length,20);
  const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
  try{
    const page=await browser.newPage();await page.goto(process.argv[2]||'http://localhost:8000');
    await page.waitForFunction(ids=>window.DD_WORLD&&ids.every(id=>DD_ASSETS.get(id)?.naturalWidth>0),ids);
    const log=await page.evaluate(ids=>{
      const c=document.createElement('canvas');c.width=192;c.height=128;const ctx=c.getContext('2d');const draw=ctx.drawImage.bind(ctx),calls=[];
      const images=new Map(ids.map(id=>[DD_ASSETS.get(id),id]));
      ctx.drawImage=(im,...args)=>{if(ctx.globalCompositeOperation!=='lighter')throw Error('Expected additive pass');calls.push(images.get(im));draw(im,...args);};
      const flags=[{}, {cryo:true},{flame:true},{rail:true},{bounces:1},{homing:true},{plasma:true},{heavy:true},{pellet:true}];
      for(const f of flags)DD_WORLD.drawProjectiles(ctx,[{x:65,y:62,vx:4,vy:-2,...f}]);
      DD_WORLD.drawImpactParticles(ctx,[5,8,20].map(r=>({x:95,y:65,r,life:.1,maxLife:.4})));
      return calls;
    },ids);
    assert.deepEqual(log,['proj_slug','proj_cryo','proj_flame','proj_rail','proj_ricochet','proj_homing','proj_plasma','proj_heavy','proj_pellet','vfx_impact_spark','vfx_impact_plasma','vfx_explosion_inferno']);
    console.log('PASS 20 textures loaded; 9 projectile and 3 impact additive blits verified');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
