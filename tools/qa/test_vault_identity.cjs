// Checks presentation without altering the model or navigation bindings.
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});try{
 const p=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('dmodisco_best_round_v1','10'));
 await p.goto(process.argv[2]||'http://localhost:8000');await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU');
 assert.equal(await p.locator('#dd-menu-nav button').count(),6);
 await p.waitForFunction(()=>!document.querySelector("#dd-boot-frame"));
 if(process.argv[3])await p.screenshot({path:process.argv[3]});
 const frames=await p.evaluate(()=>new Promise(done=>{const a=[];let last;function sample(t){if(last)a.push(t-last);last=t;if(a.length<120)requestAnimationFrame(sample);else done(a.sort((x,y)=>x-y));}requestAnimationFrame(sample);}));
 console.log(`Menu headless, 120 rAF intervals: median ${frames[60].toFixed(1)} ms; p95 ${frames[114].toFixed(1)} ms`);
 await p.locator('[data-action=customize]').click();await p.waitForFunction(()=>DD_UI.getState().submenu==='customize'&&!document.querySelector('#dd-scene-passage.is-running'));const card=id=>p.locator('[data-look="'+id+'"]');
 await card('rapture').focus();assert.equal(await p.locator('#dd-proof-name').textContent(),'Rapture');assert.match(await p.locator('#dd-proof-record').textContent(),/En prueba.*30/);
 assert.equal(await p.evaluate(()=>DD_APPEARANCE.current().id),'original');
 await card('shadow').focus();assert.match(await p.locator('#dd-proof-record').textContent(),/Hito cumplido.*10/);await p.keyboard.press('Enter');assert.equal(await card('shadow').getAttribute('aria-pressed'),'true');
 await p.reload();await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU');assert.equal(await p.evaluate(()=>localStorage.getItem('dd_appearance_v1')),'shadow');assert.deepEqual(errors,[]);console.log('PASS inspection without equipping; trial versus earned; explicit equip persists');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
