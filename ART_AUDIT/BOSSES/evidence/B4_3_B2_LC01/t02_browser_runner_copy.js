/* BOSS-T02 loader/cache/state QA in the live game. Requires an external
 * playwright-core + @sparticuz/chromium install and the repo HTTP server.
 */
'use strict';
const fs=require('fs'),path=require('path'),os=require('os');
const {chromium:pw}=require('playwright-core');
const cm=require('@sparticuz/chromium'),chromium=cm.default;
const ROOT=process.cwd(),OUT=path.join(ROOT,'ART_AUDIT/BOSSES/evidence/B4_3_B2_LC01/t02_browser');
const GAME_URL=process.env.BOSS_QA_URL||'http://127.0.0.1:4173/DEADBEAT_DISCO.ART.html';
const NATIVE=['boss_05_fusioncosmica','boss_06_djabismo','boss_07_altavoztitan'];
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});const pkg=path.resolve(path.dirname(require.resolve('@sparticuz/chromium')),'..');
 await cm.inflate(path.join(pkg,'bin/al2023.tar.br'));cm.setupLambdaEnvironment(path.join(os.tmpdir(),'al2023','lib'));
 const browser=await pw.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true,defaultViewport:{width:1440,height:1000}});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],bad=[];
 page.on('pageerror',e=>errors.push(String(e&&e.stack||e)));
 page.on('response',r=>{if(r.status()>=400&&!new URL(r.url()).pathname.startsWith('/cdn-cgi/'))bad.push({status:r.status(),url:r.url()});});
 const report={url:GAME_URL,startedAt:new Date().toISOString(),checks:{},errors,badResponses:bad};
 try{
  const response=await page.goto(GAME_URL,{waitUntil:'load',timeout:180000});report.httpStatus=response&&response.status();
  await page.waitForFunction(()=>{const s=window.DMO_ART_PACK&&window.DMO_ART_PACK.state();return s&&['applied','applied-with-errors','timeout'].includes(s.status);},{timeout:120000});
  const probe=await page.evaluate(ids=>{
   const W=window,manifest=W.DMO_ART_PACK.manifest(),batch=manifest.filter(a=>a.batch==='BOSS-T02'),integrity=W.DMO_ART_PACK.integrity();
   const assets=batch.map(a=>{const live=W.__HD_EXTRA&&W.__HD_EXTRA[a.id],cache=W.__HD_ASSETS&&W.__HD_ASSETS.images&&W.__HD_ASSETS.images[a.cacheKey];
    return{id:a.id,bossId:a.bossId,cacheKey:a.cacheKey,url:a.base+a.file,expected:[a.w,a.h],
      hdData:W.__HD_DATA[a.id],extraReady:!!(live&&live.complete&&live.naturalWidth),cacheReady:!!(cache&&cache.complete&&cache.naturalWidth),
      sameCache:live===cache,natural:cache?[cache.naturalWidth,cache.naturalHeight]:null};});
   const stateFixtures=ids.map(id=>({id,idle:W.DMO.combatArt.bossState({artId:id}),attack:W.DMO.combatArt.bossState({artId:id,_ddaAttackT:.5}),hit:W.DMO.combatArt.bossState({artId:id,hitFlash:.2}),death:W.DMO.combatArt.bossState({artId:id,_ddaDead:true})}));
   return{packVersion:W.DMO_ART_PACK.state().version,packState:W.DMO_ART_PACK.state().status,packErrors:W.DMO_ART_PACK.state().errors,integrity,assets,stateFixtures,
    gameApis:{ilt:!!W.DMO_ILT,hd:!!W.__HD_ASSETS,artTest:!!W.DMO_ART_TEST,combatArt:!!(W.DMO&&W.DMO.combatArt)}};
  },NATIVE);report.probe=probe;
  report.checks.httpOk=report.httpStatus===200;
  report.checks.packApplied=probe.packState==='applied'&&probe.packErrors.length===0;
  report.checks.runtimeVersionUpdated=probe.packVersion==='fase1-tanda01+tanda02+boss-t01+boss-t02';
  report.checks.tenAssetsInBatch=probe.assets.length===10;
  report.checks.integrityAllLive=probe.integrity.assets.every(a=>a.live);
  report.checks.tenHDImagesInExistingCaches=probe.assets.length===10&&probe.assets.every(a=>a.extraReady&&a.cacheReady&&a.sameCache&&a.hdData===a.url&&JSON.stringify(a.natural)===JSON.stringify(a.expected));
  report.checks.nativeStateTransitionsUnchanged=probe.stateFixtures.length===3&&probe.stateFixtures.every(x=>x.idle==='idle'&&x.attack==='attack'&&x.hit==='hit'&&x.death==='death');
  report.checks.noPageErrors=true;
  // Actual renderer smoke: spawn one engine entity, freeze simulation, then
  // temporarily assign the stable IDs/states. No persistent save/game changes.
  await page.mouse.click(720,500);await page.waitForTimeout(600);await page.keyboard.press('Enter');await page.waitForTimeout(900);
  await page.keyboard.down('Escape');await page.waitForTimeout(2800);await page.keyboard.up('Escape');await page.waitForTimeout(650);
  await page.evaluate(()=>window.DMO_ART_TEST.gotoCircle(0,true));await page.waitForTimeout(1800);
  const b=await page.evaluate(()=>{const x=window.DMO_ART_TEST.spawnBoss();if(x)window.__bossT02=x;return x?{resident:x.resident,artId:x.artId}:null;});report.spawnedEntity=b;
  await page.waitForTimeout(1200);
  const smoke=await page.evaluate(()=>({hub:window.DMO_HUB&&window.DMO_HUB.state(),gameState:window.DMO&&window.DMO.observe?window.DMO.observe():null,bossStats:window.DMO_ILT&&window.DMO_ILT.audit().stats}));report.smoke=smoke;
  report.checks.gameplayRoomActive=!!(smoke.hub&&!smoke.hub.inHub&&smoke.hub.location==='CAMPAIGN_ROOM'&&smoke.gameState&&smoke.gameState.hud&&smoke.gameState.hud.running);
  report.checks.illustratedBossHookActive=!!(smoke.bossStats&&smoke.bossStats.bossesDrawn>0);
  await page.keyboard.press('Escape');await page.waitForTimeout(250);
  const shots=path.join(OUT,'state_dispatch');fs.mkdirSync(shots,{recursive:true});report.visualSamples=[];
  async function capture(id,state){
   const r=await page.evaluate(async({id,state})=>{const b=window.__bossT02;if(!b)return null;b.artId=id;b._ddaDead=false;b.hitFlash=state==='hit'?.2:0;b._ddaAttackT=state==='attack'?.5:0;b.phase=state==='attack'?'sweep':'idle';
    const originalCombatArt=window.DMO.combatArt;if(state==='death')window.DMO.combatArt=Object.assign({},originalCombatArt,{bossState(candidate){return candidate===b?'death':originalCombatArt.bossState(candidate)}});
    const proto=CanvasRenderingContext2D.prototype;if(!window.__t02DrawWrapped){const original=proto.drawImage;proto.drawImage=function(image){const src=image&&(image.currentSrc||image.src);if(src&&src.includes('ART_ASSETS/bosses/tanda_02/'))window.__t02DrawSources.push(src);return original.apply(this,arguments)};window.__t02DrawWrapped=true}window.__t02DrawSources=[];
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const c=document.getElementById('game'),s=document.createElement('canvas');s.width=1200;s.height=Math.round(1200*c.height/c.width);s.getContext('2d').drawImage(c,0,0,s.width,s.height);
    const result={state:window.DMO.combatArt.bossState(b),data:s.toDataURL('image/jpeg',.88),drawSources:Array.from(new Set(window.__t02DrawSources))};window.DMO.combatArt=originalCombatArt;return result;},{id,state});
   if(!r)return null;const file=`${id}_${state}.jpg`;fs.writeFileSync(path.join(shots,file),Buffer.from(r.data.split(',')[1],'base64'));report.visualSamples.push({id,state:r.state,file:'state_dispatch/'+file,drawSources:r.drawSources});return r.state;
  }
  for(const id of NATIVE){for(const state of ['idle','attack','hit'])await capture(id,state);}
  for(const id of NATIVE)await capture(id,'death');
  report.checks.liveBossEntitySpawned=!!b;
  report.checks.twelveRuntimeStateSamples=report.visualSamples.length===12;
  report.checks.runtimeStatesMatchEngine=report.visualSamples.length===12&&report.visualSamples.every(x=>x.state===x.file.split('_').slice(-1)[0].replace('.jpg',''));
  const expectedDraw=(id,state)=>report.visualSamples.some(x=>x.id===id&&x.state===state&&x.drawSources.some(src=>src.includes('ART_ASSETS/bosses/tanda_02/'+id+'_'+state)));
  report.checks.attackAssetsActuallyDrawn=NATIVE.every(id=>expectedDraw(id,'attack'));
  report.checks.hitAssetsActuallyDrawn=['boss_05_fusioncosmica','boss_06_djabismo'].every(id=>expectedDraw(id,'hit'));
  report.checks.deathAssetsActuallyDrawn=['boss_05_fusioncosmica','boss_06_djabismo'].every(id=>expectedDraw(id,'death'));
  report.runtimeCaptureNote='Death state is supplied only to the frozen combatArt view object during the QA frame, without setting _ddaDead; the live renderer and existing death-cache branch draw the image, then the original API object is restored.';
  report.finishedAt=new Date().toISOString();report.checks.noPageErrors=errors.length===0;
  fs.writeFileSync(path.join(OUT,'qa_report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({checks:report.checks,errors:errors.length,badResponses:bad.length,output:OUT},null,2));
  if(Object.values(report.checks).some(v=>v!==true))process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e&&e.stack||e);process.exit(1)});
