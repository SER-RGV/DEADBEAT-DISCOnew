/* HUD versus engine state. Context-local hooks force HYPE/RAVE values and mark
   the run modified. Real shield pickup/damage use the engine debug API. */
const {chromium}=require('playwright-core'),assert=require('assert'),fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8080',out=process.argv[3],delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 if(out)fs.mkdirSync(out,{recursive:true});
 const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8'),anchor='    const ddOriginalEndRun = fp;';assert.equal(html.split(anchor).length,2);
 const body=html.replace(anchor,anchor+`\n    window.__QA_HYPE = function(hype,remaining,duration){ fr('qa:hud-vitals'); Re=hype; De=remaining; Oe=duration; Rl(); };`);
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720}});await ctx.addInitScript(()=>localStorage.setItem('dmodisco_upgrades_v1',JSON.stringify({life:1,bomb:0,boost:0})));
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 try{
 await p.route('**/index.html',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body}));await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT&&(DD_BOOT.getState().waitingGesture||DD_BOOT.getState().state==='INTRO'),null,{timeout:30000});await p.keyboard.press('KeyX');await p.waitForFunction(()=>DD_OPENING?.isActive());await delay(700);await p.keyboard.press('Space');await p.waitForFunction(()=>DD_BOOT.getState().state==='MAIN_MENU');
 await p.evaluate(()=>DD_UI.triggerMenuAction('new'));await delay(800);await p.keyboard.press('Space');await p.waitForFunction(()=>DD_HUB.isActive());await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>__DD_BRIDGE.isRunning());await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});
 await p.waitForFunction(()=>__DD_BRIDGE.getSnapshot().maxHp===4&&document.querySelectorAll('#dd-hud-hearts img').length===4);
 assert.equal(await p.locator('#dd-hud-hearts').getAttribute('aria-label'),'Vidas 4 de 4');
 await p.evaluate(()=>DMO.playtest.pickup('shield',1));await p.waitForFunction(()=>__DD_BRIDGE.getSnapshot().shield===1&&document.querySelector('#dd-hud-shield').textContent==='ESC 1');
 await p.evaluate(()=>__QA_HYPE(25,0,6));await p.waitForFunction(()=>document.querySelector('#dd-hud-hype-label').textContent==='HYPE 25%');
 assert.equal(await p.locator('#dd-hud-sh-fill').evaluate(e=>parseFloat(e.style.width)),25);assert.equal(await p.locator('#dd-hud-shield').getAttribute('aria-label'),'Escudos 1');
 console.log('PASS cuatro vidas de mejora, escudo recogido y HYPE 25% simultáneos');
 for(const [w,h] of [[1920,1080],[1600,900],[1366,768],[1280,720]]){await p.setViewportSize({width:w,height:h});await delay(150);for(const selector of ['.dd-hud-top-left','.dd-hud-top-right','.dd-hud-skills']){const b=await p.locator(selector).boundingBox();assert(b&&b.x>=0&&b.y>=0&&b.x+b.width<=w+1&&b.y+b.height<=h+1,selector+' '+w+'x'+h);}}
 if(out)await p.screenshot({path:path.join(out,'hud-vidas-escudo-hype-1280x720.png')});
 await p.evaluate(()=>DMO.playtest.hurt(1));await p.waitForFunction(()=>__DD_BRIDGE.getSnapshot().shield===0&&document.querySelector('#dd-hud-shield').textContent==='ESC 0');assert.equal(await p.locator('#dd-hud-hearts').getAttribute('aria-label'),'Vidas 4 de 4');
 await p.waitForTimeout(900);await p.evaluate(()=>DMO.playtest.hurt(1));await p.waitForFunction(()=>__DD_BRIDGE.getSnapshot().hp===3&&document.querySelector('#dd-hud-hearts').getAttribute('aria-label')==='Vidas 3 de 4');
 assert.equal(await p.locator('#dd-hud-hearts img').count(),4);assert.equal(await p.locator('#dd-hud-hp-fill').evaluate(e=>parseFloat(e.style.width)),75);
 console.log('PASS daño real: primero escudo, luego tres de cuatro vidas');
 await p.evaluate(()=>__QA_HYPE(25,3,6));await p.waitForFunction(()=>document.querySelector('#dd-hud-hype-label').textContent.startsWith('RAVE '));
 const values=await p.evaluate(()=>{const s=__DD_BRIDGE.getSnapshot();return {s,width:parseFloat(document.querySelector('#dd-hud-sh-fill').style.width),label:document.querySelector('#dd-hud-hype-label').textContent}});
 assert(values.s.rave>0&&values.s.raveDuration===6);assert(Math.abs(values.width-values.s.rave/values.s.raveDuration*100)<4,'barra RAVE sigue tiempo del motor');assert(values.label.includes(' s'));
 assert.deepEqual(errors,[]);console.log('PASS tiempo de RAVE y geometría HUD en cuatro tamaños; sin errores de navegador');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
