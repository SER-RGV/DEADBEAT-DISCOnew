/* Copies only the engine's own minimap; debug navigation marks the run modified. */
const {chromium}=require('playwright-core'),assert=require('assert'),fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8080',out=process.argv[3],delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 if(out)fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 // Reconstruct the expected drawing from the current engine canvas, pixel by
 // pixel, not a guessed map. Read both canvases atomically in one evaluation.
 const compare=()=>p.evaluate(()=>{
  const source=document.querySelector('#minimap'),actual=document.querySelector('#dd-minimap-canvas');
  const reference=document.createElement('canvas');reference.width=actual.width;reference.height=actual.height;
  const c=reference.getContext('2d'),w=reference.width,h=reference.height; c.fillStyle='#06030c';c.fillRect(0,0,w,h);c.imageSmoothingEnabled=false;
  const s=Math.min(w/source.width,h/source.height),dw=source.width*s,dh=source.height*s;c.drawImage(source,(w-dw)/2,(h-dh)/2,dw,dh);
  const x=c.getImageData(0,0,w,h).data,y=actual.getContext('2d').getImageData(0,0,w,h).data;
  let diff=0,colors=new Set();for(let i=0;i<x.length;i+=4){if(x[i]!==y[i]||x[i+1]!==y[i+1]||x[i+2]!==y[i+2]||x[i+3]!==y[i+3])diff++;colors.add(`${x[i]},${x[i+1]},${x[i+2]}`)}return {diff,colors:colors.size,source:source.toDataURL()};
 });
 try{
 await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT&&(DD_BOOT.getState().waitingGesture||DD_BOOT.getState().state==='INTRO'),null,{timeout:30000});await p.keyboard.press('KeyX');await p.waitForFunction(()=>DD_OPENING?.isActive());await delay(700);await p.keyboard.press('Space');await p.waitForFunction(()=>DD_BOOT.getState().state==='MAIN_MENU');
 await p.evaluate(()=>DD_UI.triggerMenuAction('new'));await delay(800);await p.keyboard.press('Space');await p.waitForFunction(()=>DD_HUB.isActive());
 const hub=await p.locator('#dd-minimap-canvas').evaluate(e=>e.toDataURL());
 await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>__DD_BRIDGE.isRunning());await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});
 await p.waitForFunction(()=>!document.querySelector('#dd-hud').classList.contains('dd-hidden'));await delay(300);
 let first=await compare();assert.equal(first.diff,0,'HD coincide con el mapa del motor');assert(first.colors>3,'mapa no es un marcador vacío');assert.notEqual(await p.locator('#dd-minimap-canvas').evaluate(e=>e.toDataURL()),hub,'mapa de incursión distinto del refugio');
 console.log('PASS mapa HD reproduce píxel a píxel el canvas del motor, preservando su escala');
 const node=await p.evaluate(()=>DMO.explore.state().nodes.find(n=>n.shop));assert(node);await p.evaluate(k=>DMO.explore.debug({action:'goto',key:k}),node.key);await p.evaluate(()=>window.DD_CINE?.skip());
 await p.waitForFunction(()=>{const s=document.querySelector('#subs'),box=document.querySelector('#dd-dialogue-box');return s.classList.contains('show')&&!box.classList.contains('dd-hidden')&&document.querySelector('#dd-dj-speaker').textContent===s.querySelector('.subs-who').textContent&&document.querySelector('#dd-dj-text').textContent===s.querySelector('.subs-text').textContent},null,{timeout:5000});
 console.log('PASS subtítulo real de entrada refleja emisor y texto del canal original');
 await delay(800);
 const second=await compare();assert.equal(second.diff,0);assert.notEqual(second.source,first.source,'mapa real cambia al entrar en otra sala');
 for(const [w,h] of [[1920,1080],[1600,900],[1366,768],[1280,720]]){await p.setViewportSize({width:w,height:h});await delay(100);const b=await p.locator('#dd-minimap-trigger').boundingBox();assert(b&&b.x>=0&&b.y>=0&&b.x+b.width<=w+1&&b.y+b.height<=h+1,`${w}x${h}`);}
 if(out)await p.screenshot({path:path.join(out,'minimapa-motor-1280x720.png')});
 await p.locator('#dd-minimap-trigger').focus();assert.equal(await p.locator('#dd-minimap-trigger').getAttribute('aria-label'),'Abrir torre de progresión');await p.keyboard.press('Enter');await p.waitForSelector('#dd-map-modal:not(.dd-hidden)');await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'dd-minimap-trigger');
 assert.deepEqual(errors,[]);console.log('PASS actualización tras viaje debug, geometría en cuatro tamaños, teclado y foco restaurado; sin errores de navegador');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
