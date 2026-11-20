/* Isolated engine-choice integration; instrumented response never changes builds.
   Forced debug conditions do not prove a naturally completed encounter. */
const {chromium}=require('playwright-core');
const fs=require('fs'),path=require('path'),assert=require('assert');
const base=process.argv[2]||'http://localhost:8080',out=process.argv[3], delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 if(out)fs.mkdirSync(out,{recursive:true});
 const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8'),anchor='    const ddOriginalEndRun = fp;';
 assert.equal(html.split(anchor).length,2);
 const body=html.replace(anchor,anchor+`\n    window.__QA_CHOICE = {
      shot: function(){ fr('qa:shot-choice'); return et(true); },
      state: function(){ return {choices:Ka.choices, history:Ka.history.slice(), risk:ae, bombs:Tr}; },
      risk: function(){ fr('qa:risk-choice'); Gr.encoreOffer=true; const node=ug(Ot.floor).nodes.find(n=>!n.shop && n.index>=2 && !Ot.visited.has(n.key)); return node && vg(node.key,null,false); }
    };`);
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720}});
 await ctx.addInitScript(()=>{window.__pad={connected:true,id:'Xbox QA',index:0,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[window.__pad];window.__setPad=(i,on)=>window.__pad.buttons[i]={pressed:on,value:on?1:0};});
 const p=await ctx.newPage(), errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 const pad=async i=>{await p.evaluate(i=>window.__setPad(i,true),i);await delay(160);await p.evaluate(i=>window.__setPad(i,false),i);await delay(300)};
 const geometry=async selectors=>{for(const [w,h] of [[1920,1080],[1600,900],[1366,768],[1280,720]]){await p.setViewportSize({width:w,height:h});await delay(100);for(const s of selectors){const b=await p.locator(s).boundingBox();assert(b&&b.x>=-1&&b.y>=-1&&b.x+b.width<=w+1&&b.y+b.height<=h+1,s+' '+w+'x'+h);}}};
 try{
 await p.route('**/index.html',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body}));
 await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT&&(DD_BOOT.getState().waitingGesture||DD_BOOT.getState().state==='INTRO'),null,{timeout:30000});
 await p.keyboard.press('KeyX');await p.waitForFunction(()=>window.DD_OPENING?.isActive());await delay(700);await p.keyboard.press('Space');await p.waitForFunction(()=>DD_BOOT.getState().state==='MAIN_MENU');
 await p.evaluate(()=>DD_UI.triggerMenuAction('new'));await delay(800);await p.keyboard.press('Space');await p.waitForFunction(()=>DD_HUB.isActive());await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>__DD_BRIDGE.isRunning());
 await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});
 assert(await p.evaluate(()=>__QA_CHOICE.shot()));await p.waitForSelector('#shot-choice-overlay.visible');
 assert.equal(await p.locator('#shot-choice-options button').count(),3);assert(!(await p.locator('#dd-hud').isVisible()));
 await geometry(['#shot-choice-title','#shot-choice-options button:first-child','#shot-choice-options button:last-child']);
 if(out)await p.screenshot({path:path.join(out,'eleccion-disparo-1280x720.png')});
 assert.equal(await p.evaluate(()=>document.activeElement.id),await p.locator('#shot-choice-options button').first().getAttribute('id'));
 await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),await p.locator('#shot-choice-options button').last().getAttribute('id'));
 await p.keyboard.press('Enter');await p.waitForSelector('#shot-choice-overlay.visible',{state:'hidden'});
 let state=await p.evaluate(()=>__QA_CHOICE.state());assert.equal(state.choices,1);assert.equal(state.history.length,1);
 console.log('PASS variación de disparo: tres opciones, foco, teclado y una selección; geometría en cuatro tamaños');
 assert(await p.evaluate(()=>__QA_CHOICE.shot()));await p.waitForSelector('#shot-choice-overlay.visible');
 const first=await p.evaluate(()=>document.activeElement.id);await pad(15);
 assert.notEqual(await p.evaluate(()=>document.activeElement.id),first,'dirección de mando cambia selección');
 await pad(0);await p.waitForSelector('#shot-choice-overlay.visible',{state:'hidden'});
 state=await p.evaluate(()=>__QA_CHOICE.state());assert.equal(state.choices,2);assert.equal(state.history.length,2);
 console.log('PASS segunda variación con mando simulado: una selección');
 assert(await p.evaluate(()=>__QA_CHOICE.risk()));await p.waitForSelector('#risk-choice-overlay.visible',{timeout:5000});
 await geometry(['#risk-title','#safe-round-btn','#take-risk-btn']);assert(!(await p.locator('#dd-hud').isVisible()));
 if(out)await p.screenshot({path:path.join(out,'eleccion-riesgo-1280x720.png')});
 await p.locator('#safe-round-btn').click();await p.waitForSelector('#risk-choice-overlay.visible',{state:'hidden'});
 state=await p.evaluate(()=>__QA_CHOICE.state());assert.equal(state.risk,false);
 console.log('PASS riesgo: rechazar por ratón; geometría en cuatro tamaños');
 assert(await p.evaluate(()=>__QA_CHOICE.risk()));await p.waitForSelector('#risk-choice-overlay.visible');
 const before=await p.evaluate(()=>__QA_CHOICE.state());
 // Direction + A through engine's normal simulated Xbox input.
 await pad(13); await pad(0);await p.waitForSelector('#risk-choice-overlay.visible',{state:'hidden',timeout:5000});
 state=await p.evaluate(()=>__QA_CHOICE.state());assert.equal(state.risk,true);assert.equal(state.bombs,before.bombs+1);
 assert.deepEqual(errors,[]);console.log('PASS riesgo: aceptar con mando simulado y efecto original; sin errores de navegador');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
