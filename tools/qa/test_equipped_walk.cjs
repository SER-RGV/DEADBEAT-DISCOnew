// Check the frames actually painted in the Refuge, rather than the fallback pose names.
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});
  try {
    const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.addInitScript(()=>{
      const original=CanvasRenderingContext2D.prototype.drawImage;
      window.walkPaint=new Set();
      CanvasRenderingContext2D.prototype.drawImage=function(im,...args){
        if(window.DD_HUB?.isActive() && im.src?.includes('/outfits/') && DD_HUB.getState().walking){
          const [,id,file]=im.src.match(/\/outfits\/([^/]+)\/([^/?]+)/)||[];
          walkPaint.add(id+'/'+file);
        }
        return original.call(this,im,...args);
      };
    });
    await p.goto(process.argv[2]||'http://localhost:8000');await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU');
    await p.evaluate(()=>DD_UI.triggerMenuAction('new'));await p.waitForFunction(()=>DD_OPENING.getState()?.type==='intro');
    await p.evaluate(()=>DD_OPENING.debugSeek(31.9,false));await p.waitForFunction(()=>DD_OPENING.getState()?.type==='descent');
    await p.evaluate(()=>DD_OPENING.debugSeek(4.55,false));await p.waitForFunction(()=>DD_HUB.isActive());
    const ids=await p.evaluate(()=>DD_APPEARANCE.list().map(x=>x.id));assert.equal(ids.length,8);
    for(const [i,id] of ids.entries()){
      await p.waitForFunction(id=>DD_APPEARANCE.outfitReady(id),id);
      assert(await p.evaluate(id=>DD_APPEARANCE.equip(id),id));const key=i%2?'KeyA':'KeyD';
      await p.keyboard.down(key);await p.waitForFunction(id=>walkPaint.has(id+'/idle.png')&&walkPaint.has(id+'/walk_a.png'),id);await p.keyboard.up(key);
    }
    assert.deepEqual(errors,[]);console.log('PASS two equipped walking frames actually drawn for',ids.join(', '));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
