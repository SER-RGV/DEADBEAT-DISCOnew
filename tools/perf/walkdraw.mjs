import { launch } from './lib.mjs';
const browser = await launch();
const page = await (await browser.newContext({viewport:{width:1280,height:720}})).newPage();
await page.addInitScript(()=>{
  window.__drawn={};
  const origDrawImage = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function(img, ...rest){
    try { if (img && img.src) { const k=img.src.split('/').pop(); window.__drawn[k]=(window.__drawn[k]||0)+1; } } catch(e){}
    return origDrawImage.call(this, img, ...rest);
  };
});
await page.goto('http://127.0.0.1:8123/index.html',{waitUntil:'commit'});
await page.waitForFunction(()=>window.DD_BOOT&&DD_BOOT.getEvidence().loadFinished,null,{timeout:60000});
for(let i=0;i<250;i++){const st=await page.evaluate(()=>DD_BOOT.getState().state); if(st==='MAIN_MENU')break; await page.keyboard.press('Escape'); await page.waitForTimeout(100);}
await page.evaluate(()=>{document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="new"]').click();});
for(let i=0;i<100;i++){ if(await page.evaluate(()=>!!(window.DD_HUB&&DD_HUB.isActive()))) break; await page.waitForTimeout(200); }
await page.waitForTimeout(1500);
const hub = await page.evaluate(()=>({drawn:{...window.__drawn}, state:DD_HUB.getState()}));
// now descend into a real run to exercise walk frames
await page.evaluate(()=>{ window.__drawn={}; });
const key = async (code, ms) => { await page.keyboard.down(code); await page.waitForTimeout(ms); await page.keyboard.up(code); };
await key('KeyW', 900);
const afterWalk = await page.evaluate(()=>{const d={...window.__drawn}; const keys=Object.keys(d).filter(k=>/player_|hero_/.test(k)); return {playerFrames:keys.reduce((a,k)=>(a[k]=d[k],a),{}), hubY:DD_HUB.getState().y};});
console.log(JSON.stringify({hubPlayerDrawn: Object.keys(hub.drawn).filter(k=>/player_.*png/.test(k)), hubProtagonist: hub.state.protagonist, hubSrc: hub.state.protagonistSrc, afterWalk},null,1));
await browser.close();
