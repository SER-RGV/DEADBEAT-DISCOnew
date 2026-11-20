/* Visible controls help and options lifecycle, against the production build. */
const {chromium}=require('playwright-core');const assert=require('assert');const fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8080',out=process.argv[3],delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 if(out)fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720}});
 await ctx.addInitScript(()=>{const add=window.addEventListener,remove=window.removeEventListener,handlers=new Set();window.addEventListener=function(type,fn,opts){if(type==='resize')handlers.add(fn);return add.call(this,type,fn,opts)};window.removeEventListener=function(type,fn,opts){if(type==='resize')handlers.delete(fn);return remove.call(this,type,fn,opts)};window.__resizeCount=()=>handlers.size;});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 try{
 await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT&&(DD_BOOT.getState().waitingGesture||DD_BOOT.getState().state==='INTRO'),null,{timeout:30000});
 await p.keyboard.press('KeyX');await p.waitForFunction(()=>window.DD_OPENING?.isActive());await delay(700);await p.keyboard.press('Space');await p.waitForFunction(()=>DD_BOOT.getState().state==='MAIN_MENU');
 const baseline=await p.evaluate(()=>__resizeCount());
 for(let i=0;i<3;i++){
  await p.evaluate(()=>DD_UI.triggerMenuAction('options'));await p.waitForSelector('#dd-submenu.is-open');
  assert.equal(await p.evaluate(()=>__resizeCount()),baseline+1);
  const text=await p.locator('#dd-controls-keyboard').innerText();for(const s of ['ESPACIO','Q: bomba','MAYÚS: boost','Z: cambiar arma','I / M'])assert(text.includes(s),s);
  const pad=await p.locator('.dd-controls-copy').last().innerText();for(const s of ['RT: disparar','B: esquivar','LB: bomba','RB: boost','Y: cambiar arma'])assert(pad.includes(s),s);
  for(const [w,h] of [[1920,1080],[1600,900],[1366,768],[1280,720]]){
   await p.setViewportSize({width:w,height:h});await delay(100);
   const inside=await p.evaluate(()=>{const el=document.querySelector('#dd-controls-keyboard'),box=el.getBoundingClientRect(),parent=document.querySelector('#dd-submenu-body').getBoundingClientRect();return box.left>=parent.left-1&&box.right<=parent.right+1&&el.scrollWidth<=el.clientWidth+1});assert(inside,`help width ${w}x${h}`);
  }
  if(i===0&&out){await p.locator('#dd-controls-keyboard').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'controles-opciones-1280x720.png')});}
  await p.locator('#dd-submenu-back').click();await p.waitForSelector('#dd-submenu.is-open',{state:'hidden'});
  assert.equal(await p.evaluate(()=>__resizeCount()),baseline,'resize listener retirado');
 }
 assert.equal(await p.locator('#shot-choice-options').getAttribute('aria-label'),'Opciones disponibles');
 assert.deepEqual(errors,[]);console.log('PASS ayuda de controles, ancho en cuatro tamaños, tres aperturas sin listeners acumulados y etiqueta genérica; sin errores de navegador');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
