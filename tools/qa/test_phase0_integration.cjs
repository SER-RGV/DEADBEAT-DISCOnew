const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM,headless:true,args:['--no-sandbox','--disable-gpu']});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await page.goto((process.argv[2]||'http://localhost:8123')+'/index.html');
  await page.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU');
  for(const [width,height] of [[800,600],[1024,600],[1280,720],[1920,1080]]){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>DD_UI.triggerMenuAction('options'));
   await page.waitForSelector('#dd-submenu.is-open');
   const last=page.locator('#dd-submenu-body button').last();
   await last.scrollIntoViewIfNeeded();
   assert(await last.isVisible());
   assert(await last.evaluate(e=>{const b=e.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight+1}),'last options control reachable');
   assert.equal(await page.locator('#dd-submenu').evaluate(e=>getComputedStyle(e).colorScheme),'dark');
   await page.locator('#dd-submenu-back').click();
  }
  console.log('PASS options: last control reachable by scroll, dark native controls, four sizes');
  await (await import('../perf/lib.mjs')).enterHub(page);
  for(const [width,height] of [[800,600],[1024,600],[1280,720],[390,720]]){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>DD_UI.openMap());
   const last=page.locator('[data-circle]').last();
   await last.scrollIntoViewIfNeeded();
   await last.click();
   assert.equal(await last.getAttribute('aria-pressed'),'true');
   assert(await last.evaluate(e=>{const b=e.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight+1}),'last atlas row reachable');
   await page.locator('#dd-map-close').click();
  }
  console.log('PASS atlas: tenth row scrollable and selectable, including 390px');
  await page.setViewportSize({width:1280,height:720});
  await page.evaluate(()=>DD_UI.openShop());
  assert.equal(await page.locator('.dd-weapon-card').count(),6);
  const overflows=await page.locator('.dd-weapon-card-name').evaluateAll(nodes=>nodes.filter(e=>e.scrollHeight>e.clientHeight+1).length);
  assert.equal(overflows,0);
  await page.locator('#dd-shop-close').click();
  await page.evaluate(()=>DD_HUB.exitToRun());
  await page.waitForFunction(()=>__DD_BRIDGE.isRunning());
  await page.keyboard.press('Escape');
  await page.waitForSelector('#pause-overlay.visible');
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#dd-hud')).opacity)===0);
  const layers=await page.evaluate(()=>({pause:+getComputedStyle(document.querySelector('#pause-overlay')).zIndex,hud:+getComputedStyle(document.querySelector('#dd-hud')).zIndex,opacity:+getComputedStyle(document.querySelector('#dd-hud')).opacity}));
  assert(layers.pause>layers.hud);assert.equal(layers.opacity,0);
  console.log('PASS six Dice Vault cards without name clipping; pause above HUD and HUD withdrawn');
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
