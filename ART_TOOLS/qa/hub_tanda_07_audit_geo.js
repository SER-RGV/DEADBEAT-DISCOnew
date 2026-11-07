const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs=require('fs');
const OUT='/home/user/DEADBEAT-DISCOnew/ART_EVIDENCE/hub/tanda_07';
(async()=>{
 const b=await chromium.launch({executablePath:'/tmp/chromium',headless:true,
  env:{...process.env,LD_LIBRARY_PATH:'/tmp/chromelibs/lib:/tmp'},
  args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader',
        '--disable-background-networking','--disable-logging','--log-level=3']});
 const c=await b.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});
 const p=await c.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('http://127.0.0.1:8123/',{waitUntil:'load',timeout:180000});
 await p.waitForFunction(()=>{try{return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status)}catch(e){return false}},{timeout:90000});
 await p.mouse.click(640,450); await p.waitForTimeout(400);
 await p.keyboard.press('Enter'); await p.waitForTimeout(400);
 await p.keyboard.down('Escape'); await p.waitForTimeout(1300); await p.keyboard.up('Escape');
 await p.waitForFunction(()=>{try{return window.DMO_HUB.state().inHub}catch(e){return false}},{timeout:30000});
 await p.waitForTimeout(500);
 const samples=[];
 for (const [x,y] of [[1250,975],[1250,1290],[1250,1400],[1250,1500],[1250,1580],[1250,1700],[700,1500],[1800,1500]]) {
   const s=await p.evaluate(([x,y])=>{
     window.DMO.debug.teleport(x,y);
     window.DMO.debug.tick(0.016,20);
     const cam=window.DMO.camera();
     const pl=window.DMO_HUB.state();
     return {requested:[x,y],camera:cam,player:[window.DMO.layout?0:0],hub:{inHub:pl.inHub,location:pl.location}};
   },[x,y]);
   const f='audit_geo_'+samples.length+'_'+x+'_'+y+'.jpg';
   await p.screenshot({path:OUT+'/'+f,type:'jpeg',quality:82});
   samples.push({file:f,...s});
 }
 const extra=await p.evaluate(()=>{
   const W=window,q=()=>({});
   return {
     playerPos:(()=>{try{return window.DMO.diag?window.DMO.diag():null}catch(e){return 'ERR'}})(),
     atmos:W.DMO_ATMOS.audit(),
     perf:(function(){try{return typeof W.DMO.perf==="function"?W.DMO.perf():W.DMO.perf}catch(e){return null}})(),
     layoutPropsCount:(W.DMO_LAYOUT.props()||[]).length,
     layoutVenue:(()=>{try{return W.DMO_LAYOUT.report().venueProps}catch(e){return null}})(),
     stations:W.DMO_HUB.stations(),
     v5Count:(()=>{try{return Object.keys(W.__DDM_V5_IMG||{}).length}catch(e){return null}})(),
     cineShots:W.DMO_CINE.shotList(),
     floorProfiles:W.DMO_FLOOR_ANIM.profiles(),
   };
 });
 fs.writeFileSync(OUT+'/audit_geo.json',JSON.stringify({generatedAt:new Date().toISOString(),samples,extra,errs},null,2)+'\n');
 console.log('samples',samples.length,'errs',errs.length);
 for(const s of samples) console.log(s.requested,'cam',s.camera&&s.camera.x,s.camera&&s.camera.y,'file',s.file);
 await c.close(); await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
