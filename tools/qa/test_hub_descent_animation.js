/* Real canvas integration: approved idle, existing walk cycle and procedural
   descent torso. No test hooks are installed in the production scripts. */
const {chromium}=require('playwright-core'),assert=require('assert'),fs=require('fs');
const base=process.argv[2]||'http://localhost:8080',out=process.argv[3],delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 if(out)fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 for(const reduced of [false,true]){
  const ctx=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:reduced?'reduce':'no-preference'}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await p.addInitScript(()=>{const orig=CanvasRenderingContext2D.prototype.drawImage;window.__heroDraws=[];window.__walkDraws=[];CanvasRenderingContext2D.prototype.drawImage=function(im,...args){if(im&&im.src&&im.src.includes('/pm_descent_back.png'))window.__heroDraws.push({args:args.length,transform:[this.getTransform().a,this.getTransform().b,this.getTransform().c,this.getTransform().d]});if(im&&im.src&&im.src.includes('/pm_walk_'))window.__walkDraws.push({src:im.src,flip:this.getTransform().a<0});return orig.call(this,im,...args)}});
  await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT&&DD_BOOT.getState().state==='MAIN_MENU',null,{timeout:30000});await p.evaluate(()=>DD_UI.triggerMenuAction('new'));await p.waitForFunction(()=>DD_OPENING.getState()?.type==='intro');await p.evaluate(()=>DD_OPENING.debugSeek(31.9,false));await p.waitForFunction(()=>DD_OPENING.getState()?.type==='descent');
  const read=async(t)=>p.evaluate(t=>{window.__heroDraws=[];DD_OPENING.debugSeek(t,true);return window.__heroDraws},t);
  await p.evaluate(()=>DD_OPENING.preload());
  const a=await read(1.2),b=await read(1.7);let upperA=a.filter(d=>d.args===8).at(-1),upperB=b.filter(d=>d.args===8).at(-1);assert(upperA&&upperB,'torso y piernas dibujados por separado '+JSON.stringify({a,b}));
  const change=Math.abs(upperA.transform[1]-upperB.transform[1]);assert(reduced?change<0.00001:change>0.01,'torso '+(reduced?'quieto con movimiento reducido':'animado durante la caída')+' '+change);
  if(out&&!reduced)await p.screenshot({path:out+'/descenso.png'});
  await p.evaluate(()=>DD_OPENING.debugSeek(1.7,false));await p.waitForFunction(()=>DD_OPENING.getState().elapsed>.5);await p.keyboard.press('Space');await p.waitForFunction(()=>DD_HUB.isActive());await p.waitForFunction(()=>DD_HUB.getState().protagonist==='idle_07b');
  await p.keyboard.down('KeyD');const frames=new Set();for(let i=0;i<10;i++){await delay(80);const s=await p.evaluate(()=>DD_HUB.getState());if(s.walking&&s.protagonist.startsWith('pm_walk_'))frames.add(s.protagonist)}await p.keyboard.up('KeyD');assert(frames.size===3,'caminar muestra las tres imágenes nuevas: '+[...frames]);await p.waitForFunction(()=>!DD_HUB.getState().walking&&DD_HUB.getState().protagonist==='idle_07b');
  await p.waitForFunction(()=>new Set(window.__walkDraws.map(x=>x.src)).size===3);
  await p.keyboard.down('KeyA');await p.waitForFunction(()=>DD_HUB.getState().walking&&DD_HUB.getState().facingLeft);await p.waitForFunction(()=>window.__walkDraws.some(x=>x.flip));if(out&&!reduced)await p.screenshot({path:out+'/refugio-caminando.png'});await p.keyboard.up('KeyA');await p.waitForFunction(()=>!DD_HUB.getState().walking);
  const assets=await p.evaluate(async()=>Promise.all([0,1,2].map(i=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const data=x.getImageData(0,0,c.width,c.height).data;let green=0,solid=0;for(let n=0;n<data.length;n+=4)if(data[n+3]>200){solid++;if(data[n+1]>180&&data[n+1]>data[n]*2&&data[n+1]>data[n+2]*2)green++}resolve({w:im.width,h:im.height,corner:data[3],solid,green})};im.onerror=reject;im.src='assets/characters/protagonist_master/walk/pm_walk_0'+i+'.png'}))));
  for(const im of assets){assert.equal(im.w,288);assert.equal(im.h,512);assert.equal(im.corner,0);assert(im.solid>10000);assert(im.green/im.solid<0.001,'sin fondo verde');}
  assert.deepEqual(errors,[]);console.log('PASS descenso '+(reduced?'reducido':'normal')+', tres fotogramas dibujados y recortados, caminar y parar en Refugio, inversión al caminar a la izquierda');await ctx.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
