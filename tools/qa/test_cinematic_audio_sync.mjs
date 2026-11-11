// Integración WebAudio real con visibilidad simulada. No verifica sonido audible.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const requireQA=createRequire(path.join(process.env.DD_QA_MODULES||process.cwd(),'package.json'));
const puppeteer=(await import(pathToFileURL(requireQA.resolve('puppeteer-core')).href)).default;
const chromium=(await import(pathToFileURL(requireQA.resolve('@sparticuz/chromium')).href)).default;
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox','--autoplay-policy=no-user-gesture-required']});
try {
 const page=await browser.newPage(); await page.setViewport({width:640,height:360});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.evaluateOnNewDocument(()=>{
  window.__pastAudioStarts=[];
  for(const ctor of [window.OscillatorNode,window.AudioBufferSourceNode]) {
   if(!ctor)continue;const start=ctor.prototype.start;
   ctor.prototype.start=function(when,...rest){
    if(Number.isFinite(when) && when<this.context.currentTime-.15)
     window.__pastAudioStarts.push({when,now:this.context.currentTime});
    return start.call(this,when,...rest);
   };
  }
 });
 await page.goto((process.env.DD_QA_URL||'http://127.0.0.1:8000')+'/index.html',{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.DD_CINE?.getState()?.type==='intro' && window.DDC_COVER?.music?.playing,{timeout:60000});
 await page.waitForFunction(()=>Number.isFinite(window.DDC_COVER.music.cinematicBeatPhase()),{timeout:15000});
 const before=await page.evaluate(()=>({audio:DDC_COVER.music.now(),cine:DD_CINE.getState().elapsed,phase:DDC_COVER.music.cinematicBeatPhase()}));
 // Bloquear el hilo realmente (no cambiar relojes) para comprobar pérdida de frames.
 await page.evaluate(()=>{const end=performance.now()+1800;while(performance.now()<end){} });
 await page.waitForFunction(t=>DD_CINE?.getState()?.elapsed>t+1.4,{},before.cine);
 const afterStall=await page.evaluate(()=>({audio:DDC_COVER.music.now(),cine:DD_CINE.getState().elapsed,pastStarts:window.__pastAudioStarts}));
 assert(Math.abs((afterStall.audio-before.audio)-(afterStall.cine-before.cine))<.5,'cine follows audio after real main-thread stall');
 assert.equal(afterStall.pastStarts.length,0,'scheduler must not replay stale notes');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 await page.waitForFunction(()=>DDC_COVER.music.cinematicBeatPhase()===null,{timeout:10000});
 const hidden1=await page.evaluate(()=>({audio:DDC_COVER.music.now(),cine:DD_CINE.getState().elapsed}));
 await new Promise(r=>setTimeout(r,1200));
 const hidden2=await page.evaluate(()=>({audio:DDC_COVER.music.now(),cine:DD_CINE.getState().elapsed}));
 assert(Math.abs(hidden2.audio-hidden1.audio)<.05,'AudioContext paused');
 assert(Math.abs(hidden2.cine-hidden1.cine)<.05,'cinematic clock paused');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});
 await page.waitForFunction(()=>Number.isFinite(DDC_COVER.music.cinematicBeatPhase()) && DDC_COVER.music.now()>0,{timeout:10000});
 const resumed=await page.evaluate(()=>({audio:DDC_COVER.music.now(),phase:DDC_COVER.music.cinematicBeatPhase()}));
 assert(resumed.phase>=0 && resumed.phase<1);
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>DD_HUB?.isActive()&&!DD_CINE?.isBlocking(),{timeout:30000});
 const after=await page.evaluate(()=>({playing:DDC_COVER.music.playing,phase:DDC_COVER.music.cinematicBeatPhase(),endedBy:DD_BOOT.getState().introEndedBy}));
 assert(after.playing && after.endedBy==='skip');assert.deepEqual(errors,[]);
 console.log(JSON.stringify({before,afterStall,hidden1,hidden2,resumed,after,errors,visibility:'simulada',audioAudible:'no comprobado'}));
} finally {await browser.close()}
