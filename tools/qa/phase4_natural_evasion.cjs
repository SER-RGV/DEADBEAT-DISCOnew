// Bounded automated natural-play attempt: real UI, keyboard and pointer only.
// Observes public read-only state; never uses debug, teleports, invulnerability,
// forced clears, direct hub/run entry, seeded runs or instrumentation injection.
const {chromium}=require('playwright-core'),fs=require('node:fs'),path=require('node:path');
(async()=>{const base=process.argv[2]||'http://127.0.0.1:8000',out=path.resolve(__dirname,'../../docs/DIAGNOSTICO_SALAS_EVIDENCIA/fase4-campana-natural-evasion');fs.mkdirSync(out,{recursive:true});const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']}),report={mode:'2.7.0',actions:'UI, keyboard, pointer only; no debug or taint overrides',steps:[],errors:[],visited:[],outcome:'incomplete'};
try{const p=await b.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript(()=>{window.__DD_PREFAB_DECK_REPAIR=true;});
try{
 await p.goto(base+'/index.html');await p.waitForFunction(()=>DD_BOOT?.getState().state==='MAIN_MENU',null,{timeout:30000});report.steps.push('menu');
 await p.locator('[data-action=play]').click();await p.locator('#dd-scene-new').click();await p.waitForFunction(()=>DD_OPENING.getState()?.type==='intro'&&DD_OPENING.getState().elapsed>.5,{},{timeout:15000});await p.keyboard.press('Space');await p.waitForFunction(()=>DD_OPENING.getState()?.type==='descent'&&DD_OPENING.getState().elapsed>.5,null,{timeout:15000});await p.keyboard.press('Space');await p.waitForFunction(()=>DD_HUB.isActive(),null,{timeout:15000});report.steps.push('hub via menu and cinematic skips');
 // Walk north towards the known gate using keyboard only; observation is read-only.
 await p.keyboard.down('KeyW');let near=null;for(let i=0;i<90;i++){await p.waitForTimeout(200);near=await p.evaluate(()=>DD_HUB.getState());if(near.nearStation==='descent')break;}await p.keyboard.up('KeyW');report.hub=near;if(near.nearStation!=='descent')throw Error('did not reach the descent by walking');
 await p.keyboard.press('KeyE');for(let i=0;i<30;i++){await p.waitForTimeout(300);if(await p.evaluate(()=>__DD_BRIDGE.isRunning()))break;if(await p.evaluate(()=>DD_CINE?.isBlocking()))await p.keyboard.press('Space');}
 await p.waitForFunction(()=>__DD_BRIDGE.isRunning(),null,{timeout:10000});report.steps.push('entered run using descent station');report.actualVersion=await p.evaluate(()=>DD_ROOM_GENERATION.version);
 await p.mouse.move(640,400);report.shots=0;report.bulletSamples=0;report.maxPlayerBullets=0;const start=Date.now();let previousKey=null,lastDump=null, tick=0, lastPosition=null,stuck=0, detour=0, side=1;report.cleared=[];report.detours=0;report.bombInputs=0;report.boostInputs=0;report.aimSamples=[];report.diceStates={};let lastBomb=-100,lastBoost=-100;
 while(Date.now()-start<240000){
  await p.waitForTimeout(150);tick++;const state=await p.evaluate(()=>({snapshot:__DD_BRIDGE.getSnapshot(),survey:__DD_BRIDGE.getSurvey(),actors:__DD_BRIDGE.getActors(),dice:{state:DD_DICE.d.state,wins:DD_DICE.d.wins,charge:DD_DICE.d.charge}}));lastDump=state;report.diceStates[state.dice.state]=(report.diceStates[state.dice.state]||0)+1;report.bulletSamples+=state.actors.bullets.length?1:0;report.maxPlayerBullets=Math.max(report.maxPlayerBullets,state.actors.bullets.length);if(!state.snapshot.running||state.snapshot.dead){report.outcome=state.snapshot.dead?'defeat':'run stopped';break;}
  const s=state.survey;if(!s)continue;for(const n of s.nodes)if(n.cleared&&!report.cleared.includes(s.floor+':'+n.key))report.cleared.push(s.floor+':'+n.key);if(s.key!==previousKey){report.visited.push({key:s.key,floor:s.floor,completed:s.completed,hp:state.snapshot.hp});previousKey=s.key;}
  if(s.enemies.length>=4&&state.snapshot.bombs>0&&state.dice.state==='READY'&&tick-lastBomb>60){await p.keyboard.press('KeyQ');lastBomb=tick;report.bombInputs++;}
  if(s.enemies.length>=4&&state.snapshot.boosts>0&&tick-lastBoost>80){await p.keyboard.press('Shift');lastBoost=tick;report.boostInputs++;}
  const target=s.enemies.map(e=>({p:e,d:Math.hypot(e.x-s.player.x,e.y-s.player.y)})).sort((a,b)=>a.d-b.d)[0];
  if(target && state.dice.state==='READY'){
    const dx=target.p.x-s.player.x,dy=target.p.y-s.player.y,len=Math.hypot(dx,dy)||1;
    const x=Math.max(10,Math.min(1270,640+dx/len*300)),y=Math.max(10,Math.min(790,400+dy/len*300));
    await p.mouse.move(x,y);await p.waitForTimeout(35);
    const observed=await p.evaluate(({x,y})=>({aim:__DD_BRIDGE.getActors().player.aim,element:document.elementFromPoint(x,y)?.id||document.elementFromPoint(x,y)?.tagName}),{x,y});
    let err=Math.atan2(Math.sin(observed.aim-Math.atan2(dy,dx)),Math.cos(observed.aim-Math.atan2(dy,dx)));
    await p.mouse.down();await p.waitForTimeout(100);const charge=await p.evaluate(()=>({state:DD_DICE.d.state,charge:DD_DICE.d.charge}));await p.mouse.up();await p.waitForTimeout(80);
    const after=await p.evaluate(()=>({state:DD_DICE.d.state,age:DD_DICE.d.age,wins:DD_DICE.d.wins}));report.aimSamples.push({errorRadians:err,dist:len,element:observed.element,charge,after});report.shots++;
  }
  const chosen=!target&&s.doors.filter(d=>d.open).sort((a,b)=>{const seen=x=>s.nodes.find(n=>n.key===x.to)?.visited?1:0;return seen(a)-seen(b)})[0];
  for(const k of ['KeyW','KeyS','KeyA','KeyD'])await p.keyboard.up(k);
  if(chosen){let dx=chosen.x-s.player.x,dy=chosen.y-s.player.y;
   if(lastPosition&&Math.hypot(s.player.x-lastPosition.x,s.player.y-lastPosition.y)<12)stuck++;else stuck=0;
   lastPosition={...s.player};if(stuck>=3&&!detour){detour=5;side=-side;stuck=0;report.detours++;}
   if(detour>0){const temp=dx;dx=-side*dy;dy=side*temp;detour--;}
   if(Math.abs(dx)>18)await p.keyboard.down(dx>0?'KeyD':'KeyA');if(Math.abs(dy)>18)await p.keyboard.down(dy>0?'KeyS':'KeyW');
   if(Math.hypot(chosen.x-s.player.x,chosen.y-s.player.y)<130)await p.keyboard.press('KeyE');
  }
  else if(target){
    const dx=target.p.x-s.player.x,dy=target.p.y-s.player.y,dist=target.d||1;
    const radial=dist<160?-1:dist>280?1:0, side=(Math.floor(tick/50)%2?1:-1);
    let mx=radial*dx/dist-side*dy/dist,my=radial*dy/dist+side*dx/dist;
    // Read-only observations for local steering; no collision injection.
    for(const e of s.enemies){const vx=s.player.x-e.x,vy=s.player.y-e.y,d=Math.hypot(vx,vy)||1;if(d<160){const w=(160-d)/80;mx+=vx/d*w;my+=vy/d*w;}}
    for(const v of state.actors.enemyBullets){const vx=s.player.x-v.x,vy=s.player.y-v.y,d=Math.hypot(vx,vy)||1;if(d<150){const w=(150-d)/55;mx+=vx/d*w;my+=vy/d*w;}}
    for(const q of s.props){const vx=s.player.x-q.x,vy=s.player.y-q.y,d=Math.hypot(vx,vy)||1;if(d<110){const w=(110-d)/90;mx+=vx/d*w;my+=vy/d*w;}}
    for(let i=0;i<s.poly.length;i++){const a=s.poly[i],b=s.poly[(i+1)%s.poly.length],ex=b.x-a.x,ey=b.y-a.y,l=ex*ex+ey*ey,t=Math.max(0,Math.min(1,((s.player.x-a.x)*ex+(s.player.y-a.y)*ey)/l)),vx=s.player.x-a.x-t*ex,vy=s.player.y-a.y-t*ey,d=Math.hypot(vx,vy)||1;if(d<150){const w=(150-d)/70;mx+=vx/d*w;my+=vy/d*w;}}
    if(Math.abs(mx)>.2)await p.keyboard.down(mx>0?'KeyD':'KeyA');if(Math.abs(my)>.2)await p.keyboard.down(my>0?'KeyS':'KeyW');
    if(tick%11===0&&(target.d<170||state.actors.enemyBullets.some(v=>Math.hypot(v.x-s.player.x,v.y-s.player.y)<130)))await p.keyboard.press('Space');
  }
  const button=p.locator('#shot-choice-overlay.visible #shot-choice-options button').first();if(await button.isVisible())await button.click();
 }
 await p.mouse.up();for(const k of ['KeyW','KeyS','KeyA','KeyD'])await p.keyboard.up(k);report.last=lastDump;report.elapsedSeconds=Math.round((Date.now()-start)/1000);await p.screenshot({path:path.join(out,'final.png')});
 if(report.outcome==='incomplete')report.outcome='time limit';
}catch(e){report.outcome='harness stopped';report.error=e.message;try{await p.screenshot({path:path.join(out,'stopped.png')});}catch{}}
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
