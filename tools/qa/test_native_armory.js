/* Real engine shop flow with debug travel/pickups. Requires playwright-core,
   Chromium, HTTP server. Debug calls mark this run unofficial. */
const {chromium}=require('playwright-core');
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const BASE=process.argv[2]||'http://localhost:8080';
const OUT=process.argv[3];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  if (OUT) fs.mkdirSync(OUT,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await browser.newContext({viewport:{width:1280,height:720}});
  await ctx.addInitScript(() => {
    window.__pad = {connected:true,id:'Xbox QA',index:0,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
    navigator.getGamepads=()=>[window.__pad];
    window.__setPad=(i,on)=>{window.__pad.buttons[i]={pressed:on,value:on?1:0};};
  });
  const p=await ctx.newPage(),errors=[];
  const pad=async i=>{await p.evaluate(i=>window.__setPad(i,true),i);await delay(160);await p.evaluate(i=>window.__setPad(i,false),i);await delay(300)};
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try {
    await p.goto(BASE+'/index.html');
    await p.waitForFunction(()=>window.DD_BOOT&&(window.DD_BOOT.getState().waitingGesture||window.DD_BOOT.getState().state==='INTRO'),null,{timeout:30000});
    await p.keyboard.press('KeyX');await p.waitForFunction(()=>window.DD_OPENING?.isActive());
    await delay(700);await p.keyboard.press('Space');await p.waitForFunction(()=>window.DD_BOOT.getState().state==='MAIN_MENU');
    await p.evaluate(()=>window.DD_UI.triggerMenuAction('new'));await delay(800);await p.keyboard.press('Space');
    await p.waitForFunction(()=>window.DD_HUB.isActive(),null,{timeout:15000});
    await p.evaluate(()=>window.DD_HUB.exitToRun());await p.waitForFunction(()=>window.__DD_BRIDGE.isRunning(),null,{timeout:15000});
    await p.evaluate(()=>{window.DMO.debug.exploreNoEnemies(true);window.DMO.debug.holdSpawns(true)});
    const goto=await p.evaluate(()=>{const n=window.DMO.explore.state().nodes.find(n=>n.shop); return n&&window.DMO.explore.debug({action:'goto',key:n.key});});
    assert(goto && goto.shop, 'tienda encontrada en grafo real');
    await p.evaluate(()=>window.DD_CINE&&window.DD_CINE.skip());await delay(700);
    let stock=await p.evaluate(()=>window.DMO.explore.state().stock);
    assert(stock.length>=2,'stock real');
    // El inventario es aleatorio. Reunir créditos de depuración suficientes
    // para el primer artículo y cualquiera de los restantes, sin alterar los
    // precios del motor ni depender de una selección concreta de stock.
    const needed=stock[0].cost+Math.max(...stock.slice(1).map(item=>item.cost));
    for(let i=0;i<100 && (await p.evaluate(()=>window.__DD_BRIDGE.getSnapshot().credits))<needed;i++){
      await p.evaluate(()=>window.DMO.playtest.pickup('credits',1)); await delay(75);
    }
    assert((await p.evaluate(()=>window.__DD_BRIDGE.getSnapshot().credits))>=needed,'créditos debug suficientes para dos artículos');
    const interact=async (item)=>{
      await p.evaluate(s=>window.DMO.explore.debug({action:'position',x:s.x,y:s.y+30}),item);
      await delay(250); await p.keyboard.press('KeyE');
      await p.waitForSelector('#shot-choice-overlay.visible',{timeout:5000});
      assert((await p.locator('#shot-choice-title').innerText()).includes('CONFIRMAR COMPRA'));
    };
    const before=await p.evaluate(()=>window.__DD_BRIDGE.getSnapshot());
    await interact(stock[0]);
    for(const [w,h] of [[1920,1080],[1600,900],[1366,768],[1280,720]]) {
      await p.setViewportSize({width:w,height:h}); await delay(100);
      for(const selector of ['#shot-choice-title','#shot-choice-options button:first-child','#shot-choice-options button:last-child']) {
        const box=await p.locator(selector).boundingBox();
        assert(box && box.x>=0 && box.y>=0 && box.x+box.width<=w+1 && box.y+box.height<=h+1,selector+' '+w+'x'+h);
      }
      if (OUT && w===1280) await p.screenshot({path:path.join(OUT,'confirmacion-tienda-1280x720.png')});
    }
    assert(!(await p.locator('#dd-hud').isVisible()), 'HUD oculto durante elección');
    console.log('PASS confirmación de compra en cuatro resoluciones');
    assert.equal((await p.evaluate(()=>window.__DD_BRIDGE.getSnapshot())).credits,before.credits,'sin cobro antes de confirmar');
    await pad(0);await p.waitForSelector('#shot-choice-overlay.visible',{state:'hidden', timeout:5000});
    let bought=await p.evaluate(()=>window.__DD_BRIDGE.getSnapshot());
    assert.equal(bought.credits,before.credits-stock[0].cost);assert(bought.owned.includes(stock[0].id));
    console.log('PASS compra original con A simulado: se cobra exactamente el precio tras confirmar');
    await p.evaluate(()=>window.DD_UI.openShop());
    await p.locator('[data-w=m1911]').click();
    assert(await p.locator('#dd-shop-equip').isEnabled());
    await p.locator('#dd-shop-equip').click();
    const switched=await p.evaluate(()=>window.__DD_BRIDGE.getSnapshot());
    assert.equal(switched.weapon,'m1911'); assert.equal(switched.credits,bought.credits);
    assert.deepEqual(switched.owned,bought.owned);
    await p.locator('#dd-shop-close').click();
    bought=switched;
    console.log('PASS equipar arma ya adquirida sin modificar créditos ni inventario');
    stock=await p.evaluate(()=>window.DMO.explore.state().stock);
    const next=stock.find(x=>!x.sold&&x.id!==stock[0].id);
    assert(next && bought.credits>=next.cost,'segundo stock asequible');
    await interact(next);
    await p.locator('#shot-choice-options button').first().click();
    assert((await p.locator('#shot-choice-title').innerText()).includes('ELIGE QUÉ SALE'));
    const pending=await p.evaluate(()=>window.__DD_BRIDGE.getSnapshot());
    assert.equal(pending.credits,bought.credits);assert.deepEqual(pending.owned,bought.owned);
    // Last option goes back rather than selecting a replacement; no charge.
    await p.locator('#shot-choice-options button').last().click();
    assert((await p.locator('#shot-choice-title').innerText()).includes('CONFIRMAR COMPRA'));
    const afterBack=await p.evaluate(()=>window.__DD_BRIDGE.getSnapshot());
    assert.equal(afterBack.credits,bought.credits);assert.deepEqual(afterBack.owned,bought.owned);
    // Confirm once more, select one of the existing slots, then verify transaction.
    await p.locator('#shot-choice-options button').first().click();
    await p.locator('#shot-choice-options button').first().click();
    await p.waitForSelector('#shot-choice-overlay.visible',{state:'hidden'});
    const replaced=await p.evaluate(()=>window.__DD_BRIDGE.getSnapshot());
    assert.equal(replaced.credits,bought.credits-next.cost);assert(replaced.owned.includes(next.id));assert.equal(replaced.owned.length,2);
    console.log('PASS reemplazo: sin cobro antes de elegir; se cobra una sola vez al confirmar');
    assert.deepEqual(errors,[]); console.log('PASS sin excepciones ni errores de consola');
  }finally{await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
