/* Isolated test-only access to the engine subtitle channel. No production hook. */
const {chromium}=require('playwright-core'),assert=require('assert'),fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8080',out=process.argv[3],delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 if(out)fs.mkdirSync(out,{recursive:true});
 const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8'),anchor='    const ddOriginalEndRun = fp;';assert.equal(html.split(anchor).length,2);
 const body=html.replace(anchor,anchor+`\n    window.__QA_SUB = {
      say: function(who,text,hold){fr('qa:subtitle'); Ml.reset(); return Ml.say(text,{who:who,hold:hold,key:'qa',prio:2});},
      dismiss: function(){Ml.dismiss('qa');}, reset: function(){Ml.reset();}, state: function(){return Ml.state();}
    };`);
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 try{
 await p.route('**/index.html',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body}));await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT&&(DD_BOOT.getState().waitingGesture||DD_BOOT.getState().state==='INTRO'),null,{timeout:30000});await p.keyboard.press('KeyX');await p.waitForFunction(()=>DD_OPENING?.isActive());await delay(700);await p.keyboard.press('Space');await p.waitForFunction(()=>DD_BOOT.getState().state==='MAIN_MENU');
 await p.evaluate(()=>DD_UI.triggerMenuAction('new'));await delay(800);await p.keyboard.press('Space');await p.waitForFunction(()=>DD_HUB.isActive());await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>__DD_BRIDGE.isRunning());await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});
 const who='LA CABINA · TIENDA',text='Compra opcional · las puertas están abiertas · no hay encuentro';
 assert(await p.evaluate(({who,text})=>__QA_SUB.say(who,text,9),{who,text}));await p.waitForFunction(t=>document.querySelector('#dd-dj-text').textContent===t,text);
 assert.equal(await p.locator('#dd-dj-speaker').innerText(),who);assert.equal(await p.locator('#dd-dj-text').innerText(),text);
 assert(await p.locator('.dd-dj-portrait-wrap').isHidden());assert.equal(await p.locator('#subs').getAttribute('aria-hidden'),'true');assert.equal(await p.locator('#dd-dialogue-box').getAttribute('role'),'status');
 for(const [w,h] of [[1920,1080],[1600,900],[1366,768],[1280,720]]){await p.setViewportSize({width:w,height:h});await delay(120);const b=await p.locator('#dd-dialogue-box').boundingBox();assert(b&&b.x>=0&&b.y>=0&&b.x+b.width<=w+1&&b.y+b.height<=h+1,`${w}x${h}`);}
 if(out)await p.screenshot({path:path.join(out,'subtitulo-tienda-1280x720.png')});
 await delay(4400);assert(await p.locator('#dd-dialogue-box').isVisible(),'respeta duración original superior a cuatro segundos');
 await p.keyboard.press('Escape');await p.waitForSelector('#pause-overlay.visible');assert(!(await p.locator('#dd-dialogue-box').isVisible()),'oculto tras pausa');await p.keyboard.press('Escape');await p.waitForSelector('#pause-overlay.visible',{state:'hidden'});assert(await p.locator('#dd-dialogue-box').isVisible(),'restaurado tras pausa');
 await p.evaluate(()=>__QA_SUB.dismiss());await p.waitForSelector('#dd-dialogue-box.dd-hidden',{state:'hidden'});
 assert(await p.evaluate(({who,text})=>__QA_SUB.say(who,text,2),{who,text}));await p.waitForSelector('#dd-dialogue-box:not(.dd-hidden)');assert.equal(await p.locator('#dd-dj-text').innerText(),text);
 await p.evaluate(()=>__QA_SUB.dismiss());await p.waitForSelector('#dd-dialogue-box:not(.dd-hidden)',{state:'hidden'});
 console.log('PASS texto y emisor separados, duración original, pausa y repetición tras cierre; geometría en cuatro tamaños');
 assert(await p.evaluate(()=>__QA_SUB.say('','Aviso sin emisor',2)));await p.waitForFunction(()=>document.querySelector('#dd-dj-text').textContent==='Aviso sin emisor');assert(await p.locator('#dd-dj-speaker').isHidden());assert(await p.locator('.dd-dj-portrait-wrap').isHidden());
 await p.evaluate(()=>__QA_SUB.dismiss());await p.waitForSelector('#dd-dialogue-box:not(.dd-hidden)',{state:'hidden'});
 const longText='Aviso extenso: '+('discotequeramenteinfernal'.repeat(7));
 assert(await p.evaluate(t=>__QA_SUB.say('DJ VIRGILIO',t,4),longText));await p.waitForFunction(t=>document.querySelector('#dd-dj-text').textContent===t,longText);
 assert(await p.locator('.dd-dj-portrait-wrap').isHidden(),'no se atribuye el retrato de Tempo a Virgilio');
 for(const [w,h] of [[1920,1080],[1600,900],[1366,768],[1280,720]]){await p.setViewportSize({width:w,height:h});await delay(120);const b=await p.locator('#dd-dialogue-box').boundingBox();assert(b&&b.x>=0&&b.y>=0&&b.x+b.width<=w+1&&b.y+b.height<=h+1,'texto largo '+w+'x'+h);assert(await p.locator('#dd-dj-text').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'texto largo sin desbordamiento horizontal');}
 await p.evaluate(()=>__QA_SUB.dismiss());await p.waitForSelector('#dd-dialogue-box:not(.dd-hidden)',{state:'hidden'});
 await p.waitForFunction(()=>!DD_CINE.getState(),null,{timeout:12000});
 await p.evaluate(()=>{__QA_SUB.reset();DD_UI.showDialogue('TEMPO','Mensaje propio del refugio',2)});await p.waitForSelector('#dd-dialogue-box:not(.dd-hidden)');assert(await p.locator('.dd-dj-portrait-wrap').isVisible());assert.equal(await p.locator('#dd-dj-speaker').innerText(),'TEMPO');
 await p.waitForSelector('#dd-dialogue-box:not(.dd-hidden)',{state:'hidden',timeout:8000});
 assert.deepEqual(errors,[]);console.log('PASS sin emisor inventado, canal directo y una sola región accesible; sin errores de navegador');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
