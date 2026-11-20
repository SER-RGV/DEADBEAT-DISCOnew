/* Synthetic victory integration test — NOT a playthrough.
   Intercepts only this isolated browser context's HTML and installs a test hook
   which sets round/final flags and calls the engine's existing pp() end path.
   Production build/files and real saves are never changed. */
const {chromium}=require('playwright-core');
const fs=require('fs'), path=require('path'), assert=require('assert');
const BASE=process.argv[2]||'http://localhost:8080', OUT=process.argv[3];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  if(OUT)fs.mkdirSync(OUT,{recursive:true});
  const original=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
  const anchor='    const ddOriginalEndRun = fp;';
  assert.equal(original.split(anchor).length,2,'test hook anchor is unique');
  const instrumented=original.replace(anchor,anchor+'\n    window.__UI_QA_FORCE_VICTORY = function (tainted) { if (!U) return false; Wo = 100; dr = true; if (tainted) fr("qa:forced-victory"); pp(); return true; };');
  const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await browser.newContext({viewport:{width:1280,height:720}}), errors=[];
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('requestfailed',r=>errors.push('request: '+r.url()));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await page.route('**/index.html',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:instrumented}));
  try{
    await page.goto(BASE+'/index.html');
    await page.waitForFunction(()=>window.DD_BOOT&&(window.DD_BOOT.getState().waitingGesture||window.DD_BOOT.getState().state==='INTRO'),null,{timeout:30000});
    await page.keyboard.press('KeyX');await page.waitForFunction(()=>window.DD_OPENING?.isActive());
    await delay(700);await page.keyboard.press('Space');await page.waitForFunction(()=>window.DD_BOOT.getState().state==='MAIN_MENU');
    await page.evaluate(()=>window.DD_UI.triggerMenuAction('new'));await delay(800);await page.keyboard.press('Space');
    await page.waitForFunction(()=>window.DD_HUB.isActive(),null,{timeout:15000});
    await page.evaluate(()=>window.DD_HUB.exitToRun());await page.waitForFunction(()=>window.__DD_BRIDGE.isRunning(),null,{timeout:15000});
    assert(await page.evaluate(()=>window.__UI_QA_FORCE_VICTORY(false)));
    await page.waitForSelector('#dd-results:not(.dd-hidden)');
    assert.equal(await page.locator('#dd-results-title').innerText(),'VICTORIA');
    assert((await page.locator('#dd-results-summary').textContent()).includes('VICTORIA'));
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dmo_victories_v214')).count),1);
    assert.equal(await page.locator('#dd-results-stats dd').first().innerText(),'100');
    assert(!(await page.locator('#dd-hud').isVisible()));
    if(OUT)await page.screenshot({path:path.join(OUT,'victoria-simulada-1280x720.png')});
    console.log('PASS victoria sintética: cierre del motor, datos y presentación');
    await page.locator('#dd-results-retry').click();
    await page.waitForFunction(()=>window.__DD_BRIDGE.isRunning());
    assert(await page.evaluate(()=>window.__UI_QA_FORCE_VICTORY(true)));
    await page.waitForSelector('#dd-results:not(.dd-hidden)');
    assert.equal(await page.locator('#dd-results-title').innerText(),'FIN NO OFICIAL');
    assert((await page.locator('#dd-results-lead').innerText()).includes('sin victoria'));
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dmo_victories_v214')).count),1);
    console.log('PASS victoria sintética modificada: no cuenta como victoria oficial');
    await page.locator('#dd-results-menu').click();
    await page.waitForFunction(()=>window.DD_BOOT.getState().state==='MAIN_MENU');
    assert.equal(await page.evaluate(()=>window.__DD_BRIDGE.isRunning()),false);
    assert(await page.locator('#dd-main-menu').isVisible());
    assert.deepEqual(errors,[]);
    console.log('PASS retorno al menú; sin errores de consola ni solicitudes fallidas');
  } finally {await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
