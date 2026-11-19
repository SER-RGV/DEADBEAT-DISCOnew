/* Animation integration. Isolated response exposes only test hooks and marks
   the run modified; debug enemy spawns do not prove natural combat coverage. */
const {chromium}=require('playwright-core'),assert=require('assert'),fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8080',out=process.argv[3],delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 if(out)fs.mkdirSync(out,{recursive:true});
 const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8'),anchor='    const ddOriginalEndRun = fp;';assert.equal(html.split(anchor).length,2);
 const body=html.replace(anchor,anchor+`\n    window.__QA_ANIM = { setRoll: function(d){fr('qa:roll-duration'); _h({duration:d});}, roll: function(){return {duration:zt.duration,remaining:ye.rollT,elapsed:ye.rollElapsed};}, view: function(enemy){fr('qa:enemy-view');return ddEnemyView(enemy);} };`);
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 try{
 await p.route('**/index.html',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body}));await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT&&DD_BOOT.getState().state==='MAIN_MENU',null,{timeout:30000});await p.evaluate(()=>DD_UI.triggerMenuAction('new'));await p.waitForFunction(()=>DD_OPENING.getState()?.type==='intro');await p.evaluate(()=>DD_OPENING.debugSeek(31.9,false));await p.waitForFunction(()=>DD_OPENING.getState()?.type==='descent');await p.evaluate(()=>DD_OPENING.debugSeek(4.55,false));await p.waitForFunction(()=>DD_HUB.isActive());await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>__DD_BRIDGE.isRunning());
 await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});
 await p.waitForFunction(()=>{const im=DD_ASSETS.get('player_roll_00');return im&&im.naturalWidth>0},null,{timeout:15000});
 // Uses the real renderer and image on an offscreen canvas; intercept only its
 // rotate call to assert phase, not an approximation of the sprite geometry.
 const rotations=await p.evaluate(()=>[.24,.32,.42].map(d=>{
   const cnv=document.createElement('canvas');cnv.width=300;cnv.height=300;const c=cnv.getContext('2d'),rot=[];const rotate=c.rotate.bind(c);c.rotate=a=>{rot.push(a);return rotate(a)};
   const ok=DD_WORLD.drawProtagonist(c,{x:150,y:170,aimAngle:0,rollDX:1,rollT:d/2,rollElapsed:d/2},{upperPose:'player_roll',lowerPose:'player_roll'},null,0,0,1);
   return {d,ok,rot,png:cnv.toDataURL('image/png')};
 }));
 for(const r of rotations){assert(r.ok);assert.equal(r.rot.length,1);assert(Math.abs(r.rot[0]-Math.PI)<1e-6,'media vuelta en duración '+r.d);}
 if(out)fs.writeFileSync(path.join(out,'voltereta-media-vuelta.png'),Buffer.from(rotations[2].png.split(',')[1],'base64'));
 for(const d of [.24,.42]){
   await p.evaluate(d=>__QA_ANIM.setRoll(d),d);await p.keyboard.press('Space');
   const r=await p.waitForFunction(()=>{const x=__QA_ANIM.roll();return x.remaining>0?x:null},null,{timeout:3000});const v=await r.jsonValue();assert(Math.abs(v.duration-d)<.001);assert(Math.abs(v.elapsed+v.remaining-d)<.02);
   await p.waitForFunction(()=>__QA_ANIM.roll().remaining===0);await delay(1050);
 }
 console.log('PASS giro del renderizador sigue la duración real para 0,24 / 0,32 / 0,42 s; esquiva de motor en extremos');
 const spawned=await p.evaluate(()=>{const s=__DD_BRIDGE.getSnapshot();return ['dancer','sprinter','tank','speaker'].map((type,i)=>({type,ok:DMO.debug.spawnEnemyAt(type,s.player.x+160+i*60,s.player.y-80,false,false)}));});assert(spawned.every(x=>x.ok),'enemigos debug generados');
 // La primera sala filtra las clases permitidas; no afirmar que spawnEnemyAt
 // garantice el tipo solicitado. El mapeo de familias se prueba con vistas
 // sintéticas y los estados de animación con los actores realmente generados.
 let actors=await p.evaluate(()=>__DD_BRIDGE.getActors());assert(actors.enemies.length>=4,'actores presentes');
 const families=await p.evaluate(()=>['dancer','sprinter','tank','speaker'].map(type=>__QA_ANIM.view({type,x:0,y:0,r:12,animT:1,hitFlash:0} ).family));
 assert.deepEqual(families,['security','fanatic','chef','drone']);
 for(const [pose,expected] of [['windup','windup'],['charge','attack']]){
   const states=await p.evaluate(pose=>{__DD_BRIDGE.debugPoseEnemies(pose);return __DD_BRIDGE.getActors().enemies.map(e=>e.state)},pose);assert(states.length>=4);assert(states.every(s=>s===expected),pose+' → '+expected+': '+states);
 }
 const hit=await p.evaluate(()=>{__DD_BRIDGE.debugPoseEnemies(null,{hit:true});return __DD_BRIDGE.getActors().enemies.map(e=>e.state)});assert(hit.length>=4&&hit.every(x=>x==='hit'),'impacto tiene prioridad');
 assert.deepEqual(errors,[]);console.log('PASS familias con vistas sintéticas y aviso/ataque/impacto con enemigos debug; sin errores de navegador');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
