/* BOSS-T02 in-game frame-pacing/asset-footprint observation.
 * External deps: playwright-core + @sparticuz/chromium. The SwiftShader result
 * is diagnostic only; it is not a hardware-GPU pass/fail without a matched run.
 */
'use strict';
const fs=require('fs'),path=require('path'),os=require('os');
const {chromium:pw}=require('playwright-core');
const cp=require('@sparticuz/chromium'),chromium=cp.default;
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'ART_AUDIT/BOSSES/evidence/T02_browser/performance.json');
const URL=process.env.BOSS_QA_URL||'http://127.0.0.1:4173/DEADBEAT_DISCO.ART.html';
(async()=>{
 const pkg=path.resolve(path.dirname(require.resolve('@sparticuz/chromium')),'..');
 await cp.inflate(path.join(pkg,'bin/al2023.tar.br'));cp.setupLambdaEnvironment(path.join(os.tmpdir(),'al2023','lib'));
 const browser=await pw.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true,defaultViewport:{width:1440,height:1000}});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(String(e&&e.stack||e)));
 const out={url:URL,startedAt:new Date().toISOString(),environment:{browser:'Chromium via @sparticuz/chromium',renderer:'software/SwiftShader expected in this sandbox'},checks:{}};
 try{
  const response=await page.goto(URL,{waitUntil:'load',timeout:180000});out.httpStatus=response&&response.status();
  await page.waitForFunction(()=>{const s=window.DMO_ART_PACK&&window.DMO_ART_PACK.state();return s&&s.status==='applied';},{timeout:120000});
  await page.mouse.click(720,500);await page.waitForTimeout(600);await page.keyboard.press('Enter');await page.waitForTimeout(900);
  await page.keyboard.down('Escape');await page.waitForTimeout(2800);await page.keyboard.up('Escape');await page.waitForTimeout(700);
  await page.evaluate(()=>window.DMO_ART_TEST.gotoCircle(0,true));await page.waitForTimeout(1800);
  const boot=await page.evaluate(()=>{const b=window.DMO_ART_TEST.spawnBoss();if(b){window.__bossT02Perf=b;b.artId='boss_05_fusioncosmica';b._ddaAttackT=.5;b.phase='sweep';}
   const batch=window.DMO_ART_PACK.manifest().filter(x=>x.batch==='BOSS-T02');
   return{pack:window.DMO_ART_PACK.state().status,game:window.DMO.observe().hud,room:window.DMO_HUB.state().location,bossId:b&&b.artId,
    bossDraws:window.DMO_ILT.audit().stats.bossesDrawn,assets:batch.map(a=>({id:a.id,cacheKey:a.cacheKey,loaded:!!(window.__HD_ASSETS.images[a.cacheKey]&&window.__HD_ASSETS.images[a.cacheKey].complete&&window.__HD_ASSETS.images[a.cacheKey].naturalWidth)}))};});
  await page.waitForTimeout(1200);await page.keyboard.press('Escape');await page.waitForTimeout(250);
  const frame=await page.evaluate(()=>new Promise(resolve=>{const d=[];let prev=0,n=0;function tick(t){if(prev)d.push(t-prev);prev=t;if(++n<90){requestAnimationFrame(tick);return;}const a=d.slice().sort((x,y)=>x-y),sum=d.reduce((x,y)=>x+y,0),q=p=>a[Math.min(a.length-1,Math.floor(p*a.length))];resolve({samples:d.length,meanMs:+(sum/d.length).toFixed(2),medianMs:+q(.5).toFixed(2),p95Ms:+q(.95).toFixed(2),maxMs:+Math.max(...d).toFixed(2),framesOver50ms:d.filter(x=>x>50).length,approxFps:+(1000/(sum/d.length)).toFixed(1)});}requestAnimationFrame(tick);}));
  const asset=await page.evaluate(()=>{const a=window.DMO_ART_PACK.manifest().filter(x=>x.batch==='BOSS-T02');return{count:a.length,totalBytes:a.reduce((n,x)=>n+(window.__HD_EXTRA[x.id]&&window.__HD_EXTRA[x.id].complete?0:0),0),loaded:a.filter(x=>window.__HD_ASSETS.images[x.cacheKey]&&window.__HD_ASSETS.images[x.cacheKey].complete&&window.__HD_ASSETS.images[x.cacheKey].naturalWidth).length}});
  const {execFileSync}=require('child_process');asset.totalBytes=Number(execFileSync('python3',['-c',"from pathlib import Path;print(sum(p.stat().st_size for p in Path('ART_ASSETS/bosses/tanda_02').glob('*.png')))"] ,{cwd:ROOT,encoding:'utf8'}).trim());
  out.boot=boot;out.frame=frame;out.asset=asset;out.errors=errors;
  out.baseline={paired:false,reference:'T01 report measured ~1.7 FPS under the same software-rendered Chromium sandbox, but was not a paired A/B run',status:'INCONCLUSIVE'};
  out.checks.httpOk=out.httpStatus===200;out.checks.packApplied=boot.pack==='applied';out.checks.inGameRoom=boot.room==='CAMPAIGN_ROOM'&&boot.game&&boot.game.running;out.checks.allTenAssetsCached=asset.count===10&&asset.loaded===10;out.checks.noPageErrors=errors.length===0;
  out.performanceAssessment='The frame-pacing number is environment-limited by SwiftShader and has no matched baseline; report as inconclusive, not as a regression or acceptable real-GPU result.';
  out.finishedAt=new Date().toISOString();fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n');
  console.log(JSON.stringify({checks:out.checks,frame,asset,baseline:out.baseline,output:OUT},null,2));if(Object.values(out.checks).some(x=>x!==true))process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e&&e.stack||e);process.exit(1)});
