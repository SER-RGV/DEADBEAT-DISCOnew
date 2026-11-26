const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs=require('fs');const OUT='/home/user/DEADBEAT-DISCOnew/ART_EVIDENCE/hub/tanda_07';
(async()=>{
 const b=await chromium.launch({executablePath:'/tmp/chromium',headless:true,
  env:{...process.env,LD_LIBRARY_PATH:'/tmp/chromelibs/lib:/tmp'},
  args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader','--disable-background-networking']});
 const c=await b.newContext({viewport:{width:1280,height:900}});const p=await c.newPage();
 await p.goto('http://127.0.0.1:8123/',{waitUntil:'load',timeout:180000});
 await p.waitForFunction(()=>{try{return window.DMO_ART_PACK.state().status==='applied'}catch(e){return false}},{timeout:90000});
 await p.mouse.click(640,450);await p.waitForTimeout(400);await p.keyboard.press('Enter');await p.waitForTimeout(400);
 await p.keyboard.down('Escape');await p.waitForTimeout(1300);await p.keyboard.up('Escape');
 await p.waitForFunction(()=>{try{return window.DMO_HUB.state().inHub}catch(e){return false}},{timeout:30000});
 await p.waitForTimeout(600);
 const setInputSrc=await p.evaluate(()=>String(window.DMO.debug.setInput));
 const r=[];
 r.push({k:'inicio',cam:await p.evaluate(()=>window.DMO.camera())});
 for(const k of ['s','ArrowDown','w','w','a','d']){
   await p.keyboard.down(k);await p.waitForTimeout(2200);await p.keyboard.up(k);await p.waitForTimeout(200);
   r.push({k,hold:'2.2s',cam:await p.evaluate(()=>window.DMO.camera()),hub:await p.evaluate(()=>window.DMO_HUB.state().location)});
 }
 fs.writeFileSync(OUT+'/audit_move.json',JSON.stringify({generatedAt:new Date().toISOString(),setInputSrc,r},null,2)+'\n');
 console.log(JSON.stringify(r.map(x=>({k:x.k,y:x.cam&&x.cam.y}))));
 console.log('setInput:',setInputSrc.slice(0,350));
 await c.close();await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
