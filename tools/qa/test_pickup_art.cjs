// Validate the real HD blit (including its display size), not pickup mechanics.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const ids = fs.readdirSync(path.join(__dirname, '../../assets/pickups')).filter(n => n.endsWith('.png')).sort().map(n => n.slice(0,-4));
  assert.equal(ids.length,20);
  const b = await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
  try {
    const p = await b.newPage();await p.goto(process.argv[2] || 'http://localhost:8000');
    await p.waitForFunction(ids => window.DD_WORLD && ids.every(id => DD_ASSETS.get(id)?.naturalWidth === 160), ids);
    const sheet = await p.evaluate(ids => {
      const c=document.createElement('canvas');c.width=560;c.height=128;
      const g=c.getContext('2d');g.fillStyle='#201b29';g.fillRect(0,0,c.width,c.height);
      const blit=g.drawImage.bind(g);let expected,ok;
      g.drawImage=(im,...args)=>{if(im===expected && args[2]===44 && args[3]===44)ok=true;blit(im,...args);};
      ids.forEach((id,i)=>{expected=DD_ASSETS.get(id);ok=false;
        DD_WORLD.drawPickup(g,{kind:id.split('_')[1],x:28+i%10*56,y:30+Math.floor(i/10)*64},0);
        if(!ok)throw Error('Missing or incorrect HD blit: '+id);
      });return c.toDataURL('image/png').split(',')[1];
    },ids);
    if(process.argv[3])fs.writeFileSync(process.argv[3],Buffer.from(sheet,'base64'));
    console.log('PASS 20 specific assets rendered at 44 × 44 by DD_WORLD.drawPickup');
  } finally {await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
