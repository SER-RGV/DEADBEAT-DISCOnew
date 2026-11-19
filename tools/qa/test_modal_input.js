/* Isolated debug run to verify HD modal input ownership, with simulated Xbox. */
const {chromium}=require('playwright-core'),assert=require('assert'),fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8080',delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8'),anchor='    const ddOriginalEndRun = fp;';assert.equal(html.split(anchor).length,2);
 const body=html.replace(anchor,anchor+`\n    window.__QA_INPUT = function(){ return {rollT:ye.rollT, cooldown:ye.rollCD, bombs:Tr, x:ye.x, y:ye.y}; };\n    window.__QA_NATIVE_CHOICE = function(){ fr('qa:native-choice'); return et(true); };`);
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720}});await ctx.addInitScript(()=>{window.__pad={connected:true,id:'Xbox QA',index:0,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[window.__pad];window.__setPad=(i,on)=>window.__pad.buttons[i]={pressed:on,value:on?1:0};});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const pad=async i=>{await p.evaluate(i=>__setPad(i,true),i);await delay(150);await p.evaluate(i=>__setPad(i,false),i);await delay(350)};
 try{
 await p.route('**/index.html',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body}));await p.goto(base+'/index.html');
 await p.waitForFunction(()=>window.DD_BOOT&&(DD_BOOT.getState().waitingGesture||DD_BOOT.getState().state==='INTRO'),null,{timeout:30000});await p.keyboard.press('KeyX');await p.waitForFunction(()=>DD_OPENING?.isActive());await delay(700);await p.keyboard.press('Space');await p.waitForFunction(()=>DD_BOOT.getState().state==='MAIN_MENU');
 await p.evaluate(()=>DD_UI.triggerMenuAction('new'));await delay(800);await p.keyboard.press('Space');await p.waitForFunction(()=>DD_HUB.isActive());await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>__DD_BRIDGE.isRunning());await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});
 await p.evaluate(()=>DD_UI.openMap());await p.waitForSelector('#dd-map-modal:not(.dd-hidden)');const before=await p.evaluate(()=>__QA_INPUT());
 assert(await p.evaluate(()=>document.querySelector('#dd-hud').inert),'HUD fuera de la navegación mientras el modal está abierto');
 await p.keyboard.press('q');await delay(200);assert.equal((await p.evaluate(()=>__QA_INPUT())).bombs,before.bombs,'Q no gasta bomba detrás del mapa');
 await pad(4);assert.equal((await p.evaluate(()=>__QA_INPUT())).bombs,before.bombs,'LB no gasta bomba detrás del mapa');
 await pad(1);await p.waitForSelector('#dd-map-modal:not(.dd-hidden)',{state:'hidden'});assert.equal((await p.evaluate(()=>__QA_INPUT())).cooldown,0,'B cierra mapa sin esquivar');
 console.log('PASS mapa: teclas de combate bloqueadas y B de mando no esquiva');
 assert(!(await p.evaluate(()=>document.querySelector('#dd-hud').inert)),'HUD restaurado');
 await p.waitForTimeout(500);await p.keyboard.press('q');await p.waitForFunction(n=>__QA_INPUT().bombs===n-1,before.bombs,{timeout:3000});console.log('PASS bomba de teclado funciona tras cerrar');
 await p.evaluate(()=>DD_UI.openShop());await p.waitForSelector('#dd-shop-modal:not(.dd-hidden)');
 await p.keyboard.press('Enter');await p.waitForSelector('#dd-shop-modal:not(.dd-hidden)',{state:'hidden'});console.log('PASS botón del modal conserva activación nativa por Enter');
 await p.evaluate(()=>DD_UI.openMap());assert(await p.evaluate(()=>__QA_NATIVE_CHOICE()));await p.waitForSelector('#shot-choice-overlay.visible');
 await p.waitForSelector('#dd-map-modal:not(.dd-hidden)',{state:'hidden'});
 assert(await p.evaluate(()=>document.querySelector('#shot-choice-overlay').contains(document.activeElement)),'foco retenido en diálogo nativo');
 await p.keyboard.press('Enter');await p.waitForSelector('#shot-choice-overlay.visible',{state:'hidden'});
 console.log('PASS diálogo nativo prioritario sin pérdida de foco');
 assert.deepEqual(errors,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
