/* BOSS-T01 rendering smoke under Chromium/SwiftShader; external deps only.
 * Usage: NODE_PATH=/path/to/node_modules node ART_TOOLS/qa/perf_boss_tanda_01.js
 */
'use strict';
const fs=require('fs'),path=require('path'),os=require('os');
const {chromium:playwright}=require('playwright-core');
const chromiumPackage=require('@sparticuz/chromium'),chromium=chromiumPackage.default;
const OUT=path.resolve(__dirname,'../../ART_AUDIT/BOSSES/evidence/T01_browser/performance.json');
const GAME_URL=process.env.BOSS_QA_URL||'http://127.0.0.1:4173/DEADBEAT_DISCO.ART.html';
(async()=>{
 const root=path.resolve(path.dirname(require.resolve('@sparticuz/chromium')),'..');
 await chromiumPackage.inflate(path.join(root,'bin/al2023.tar.br'));
 chromiumPackage.setupLambdaEnvironment(path.join(os.tmpdir(),'al2023','lib'));
 const browser=await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true,defaultViewport:{width:1440,height:1000}});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e&&e.stack||e)));
 const started=Date.now();
 try {
  await page.goto(GAME_URL,{waitUntil:'load',timeout:180000});
  await page.waitForFunction(()=>{const s=window.DMO_ART_PACK&&window.DMO_ART_PACK.state();return s&&s.status==='applied';},{timeout:120000});
  await page.mouse.click(720,500);await page.waitForTimeout(600);await page.keyboard.press('Enter');await page.waitForTimeout(900);
  await page.keyboard.down('Escape');await page.waitForTimeout(2800);await page.keyboard.up('Escape');await page.waitForTimeout(650);
  const boss=await page.evaluate(()=>window.DMO_ART_TEST&&window.DMO_ART_TEST.spawnBoss());
  const boot=await page.evaluate(()=>({pack:window.DMO_ART_PACK.state().status,bosses:window.DMO_ILT.audit().stats.bossesDrawn,
   bossId:window.DMO.combatArt&&window.DMO.combatArt.info().bossId,view:window.DMO.observe().view}));
  const frame=await page.evaluate(()=>new Promise(resolve=>{
   const d=[],n=240;let prev=0,count=0;
   function tick(t){if(prev)d.push(t-prev);prev=t;if(++count<n){requestAnimationFrame(tick);return;}
    const x=d.slice().sort((a,b)=>a-b),sum=d.reduce((a,b)=>a+b,0),p=q=>x[Math.min(x.length-1,Math.floor(q*x.length))];
    resolve({samples:d.length,meanMs:+(sum/d.length).toFixed(2),medianMs:+p(.5).toFixed(2),p95Ms:+p(.95).toFixed(2),maxMs:+Math.max(...d).toFixed(2),framesOver50ms:d.filter(v=>v>50).length,approxFps:+(1000/(sum/d.length)).toFixed(1)});
   } requestAnimationFrame(tick);
  }));
  const result={url:GAME_URL,elapsedMs:Date.now()-started,boot,bossConstructed:!!boss,frame,errors,
    note:'Post-change single-run smoke only; no matched pre-change browser baseline. Asset payload is measured from the local manifest on disk.'};
  const {execFileSync}=require('child_process');
  result.assetBytes=JSON.parse(execFileSync('python3',['-c',`import json, pathlib; m=json.load(open('ART_ASSETS/bosses/tanda_01/manifest.json')); print(sum(pathlib.Path(a['file']).stat().st_size for a in m['assets']))`],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'}));
  result.pass=errors.length===0&&frame.samples===239&&frame.p95Ms<80&&frame.approxFps>=20;
  fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
 } finally {await browser.close();}
})().catch(e=>{console.error(e&&e.stack||e);process.exit(1)});
