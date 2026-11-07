const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs=require('fs');
const OUT='/home/user/DEADBEAT-DISCOnew/ART_EVIDENCE/hub/tanda_07';
(async()=>{
 const b=await chromium.launch({executablePath:'/tmp/chromium',headless:true,
  env:{...process.env,LD_LIBRARY_PATH:'/tmp/chromelibs/lib:/tmp'},
  args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader',
        '--disable-background-networking','--disable-logging','--log-level=3',
        '--autoplay-policy=no-user-gesture-required']});
 const c=await b.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});
 // Gamepad sintético (Xbox estándar) inyectado ANTES de cargar, sin tocar el juego
 await c.addInitScript(()=>{
   const pad={id:'Xbox Wireless Controller (synthetic QA)',index:0,connected:true,mapping:'standard',
     timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:function(){return [pad]}});
   window.__T7_SYNTH_PAD=pad;
 });
 const p=await c.newPage(); const errs=[]; const c404=[];
 p.on('pageerror',e=>errs.push(String(e)));
 p.on('response',r=>{if(r.status()===404)c404.push(r.url())});
 await p.goto('http://127.0.0.1:8123/',{waitUntil:'load',timeout:180000});
 await p.waitForFunction(()=>{try{return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status)}catch(e){return false}},{timeout:90000});
 const api=await p.evaluate(()=>({
   debugKeys:Object.keys(window.DMO.debug||{}),
   hubKeys:Object.keys(window.DMO_HUB||{}),
   gamepadKeys:Object.keys(window.DMO.gamepad||{}),
   musicKeys:Object.keys(window.DMO_MUSIC||{}),
 }));
 await p.mouse.click(640,450); await p.waitForTimeout(400);
 await p.keyboard.press('Enter'); await p.waitForTimeout(400);
 await p.keyboard.down('Escape'); await p.waitForTimeout(1300); await p.keyboard.up('Escape');
 await p.waitForFunction(()=>{try{return window.DMO_HUB.state().inHub}catch(e){return false}},{timeout:30000});
 await p.waitForTimeout(600);
 const before=await p.evaluate(()=>({cam:window.DMO.camera(),pad:window.DMO.gamepad.state(),
   audio:window.DMO_MUSIC.state(),atmos:window.DMO_ATMOS.audit()}));
 // Movimiento real con teclado hacia el sur (3 s) — la cámara sigue al jugador
 await p.evaluate(()=>window.DMO.debug.teleport(1250,1250));
 await p.keyboard.down('ArrowDown');
 const walk=[];
 for(let i=0;i<6;i++){await p.waitForTimeout(500);walk.push(await p.evaluate(()=>window.DMO.camera()));}
 await p.keyboard.up('ArrowDown');
 // Gamepad sintético: stick izquierdo abajo 1 s, botón A 0,4 s
 await p.evaluate(()=>{window.__T7_SYNTH_PAD.axes[1]=0.9;window.__T7_SYNTH_PAD.timestamp=performance.now()});
 await p.waitForTimeout(1000);
 const padMove=await p.evaluate(()=>({state:window.DMO.gamepad.state(),tel:window.DMO.gamepad.telemetry(),cam:window.DMO.camera()}));
 await p.evaluate(()=>{window.__T7_SYNTH_PAD.axes[1]=0;window.__T7_SYNTH_PAD.buttons[0]={pressed:true,value:1};window.__T7_SYNTH_PAD.timestamp=performance.now()});
 await p.waitForTimeout(450);
 const padBtn=await p.evaluate(()=>({state:window.DMO.gamepad.state(),tel:window.DMO.gamepad.telemetry()}));
 await p.evaluate(()=>{window.__T7_SYNTH_PAD.buttons[0]={pressed:false,value:0}});
 const after=await p.evaluate(()=>({cam:window.DMO.camera(),pad:window.DMO.gamepad.state(),
   audio:window.DMO_MUSIC.state(),atmos:window.DMO_ATMOS.audit(),perf:window.DMO.perf,
   hub:window.DMO_HUB.state()}));
 const fps=[];for(let i=0;i<3;i++){await p.waitForTimeout(1100);fps.push(await p.evaluate(()=>window.DMO_ATMOS.audit().fps))}
 fs.writeFileSync(OUT+'/audit_input.json',JSON.stringify({generatedAt:new Date().toISOString(),api,before,walk,padMove,padBtn,after,fps,errs,c404},null,2)+'\n');
 console.log('debugKeys',api.debugKeys.join(','));
 console.log('walk camY',walk.map(w=>w&&w.y));
 console.log('pad connected',after.pad.connected,'active',after.pad.active,'telEvents',padMove.tel.events.length);
 console.log('fps',fps,'errs',errs.length,'404',c404.length);
 await c.close(); await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
