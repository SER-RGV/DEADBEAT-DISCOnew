// Contact-sheet check: use the actual HD renderer on an isolated canvas.
const {chromium}=require('playwright-core');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
  try {
    const p=await browser.newPage();await p.goto(process.argv[2]||'http://localhost:8000');
    const families=['chef','dancer','drone','elite','fanatic','security'];
    await p.waitForFunction(fs=>window.DD_WORLD&&fs.every(f=>['walk','windup','attack','death'].every(s=>DD_ASSETS.get(`enemy_${f}_${s}`))),families);
    const result=await p.evaluate(fs=>{
      const c=document.createElement('canvas');c.width=c.height=240;const g=c.getContext('2d');
      const original=g.drawImage.bind(g);let expected,found;
      g.drawImage=(im,...args)=>{if(im===expected)found=true;original(im,...args);};
      for(const family of fs)for(const state of ['walk','windup','attack','death']){
        expected=DD_ASSETS.get(`enemy_${family}_${state}`);found=false;g.clearRect(0,0,240,240);
        const e={x:120,y:165,r:14};
        if(state==='death')DD_WORLD.drawEnemyDeath(g,{...e,ddFamily:family,age:.16,duration:.4},1);
        else DD_WORLD.drawEnemy(g,e,1,{family,state});
        if(!found)throw Error(`Fallback or missing frame: ${family}/${state}`);
      }
      return fs.length*4;
    },families);console.log('PASS: actual renderer drew all '+result+' expected enemy images');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
