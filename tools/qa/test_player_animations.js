/* Actual player animation state integration. Test-only hook and debug resources
   in an isolated browser context; production physics and saves are unchanged. */
const {chromium}=require('playwright-core'),assert=require('assert'),fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8080',delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8'),anchor='    const ddOriginalEndRun = fp;';assert.equal(html.split(anchor).length,2);
 const body=html.replace(anchor,anchor+`\n    window.__QA_PLAYER_ANIM = {
      counts: function(bomb,boost){fr('qa:player-anim');Tr=bomb;Sr=boost;Cr=false;w.playerAnim.abilityT=0;},
      ability: function(){return {bombs:Tr, boosts:Sr, active:Cr, time:w.playerAnim.abilityT, kind:w.playerAnim.abilityKind, state:w.playerAnim.state};},
      key: function(code,key){window.dispatchEvent(new KeyboardEvent('keydown',{code:code,key:key,bubbles:true}));return this.ability();},
      hit: function(shields,invulnerable){fr('qa:player-hit');Ee=shields;ke=invulnerable?0.8:0;Cr=false;ye.rollT=0;w.playerAnim.hurtT=0;const before={hp:ve,shield:Ee};wp('qa',ye.x+30,ye.y);w.playerAnim.step(1/60);return {before:before,hp:ve,shield:Ee,anim:w.playerAnim.getStateSnapshot()};},
      invulnerabilityOnly: function(){fr('qa:player-hit');w.playerAnim.hurtT=0;ke=1;w.playerAnim.step(1/60);return w.playerAnim.getStateSnapshot();},
      fatalHit: function(){fr('qa:player-hit');ve=1;Ee=0;ke=0;Cr=false;ye.rollT=0;wp('qa',ye.x+30,ye.y);w.playerAnim.step(1/60);return {hp:ve,anim:w.playerAnim.getStateSnapshot()};}
    };`);
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 try{
 await p.route('**/index.html',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body}));await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT&&DD_BOOT.getState().state==='MAIN_MENU',null,{timeout:30000});await p.evaluate(()=>DD_UI.triggerMenuAction('new'));await p.waitForFunction(()=>DD_OPENING.getState()?.type==='intro');await p.evaluate(()=>DD_OPENING.debugSeek(31.9,false));await p.waitForFunction(()=>DD_OPENING.getState()?.type==='descent');await p.evaluate(()=>DD_OPENING.debugSeek(4.55,false));await p.waitForFunction(()=>DD_HUB.isActive());await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>__DD_BRIDGE.isRunning());await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});
 for(const [code,key,type] of [['KeyQ','q','bomb'],['ShiftLeft','Shift','boost']]){
  const empty=await p.evaluate(({code,key})=>{__QA_PLAYER_ANIM.counts(0,0);return __QA_PLAYER_ANIM.key(code,key)},{code,key});assert.equal(empty.time,0,`${type}: sin pose al no tener cargas`);assert.equal(empty.bombs,0);assert.equal(empty.boosts,0);
  const valid=await p.evaluate(({code,key})=>{__QA_PLAYER_ANIM.counts(1,1);return __QA_PLAYER_ANIM.key(code,key)},{code,key});assert.equal(valid.kind,type);assert(valid.time>0,`${type}: pose al gastar carga`);assert.equal(type==='bomb'?valid.bombs:valid.boosts,0);
  await delay(500);
 }
 console.log('PASS bomba y boost: sin animación en intento rechazado, pose al consumir carga real');
 await p.evaluate(()=>__DD_BRIDGE.testStep({},160));
 const walk=await p.evaluate(()=>{__DD_BRIDGE.testStep({right:true,aim:0},35);return DMO.playerAnim.getStateSnapshot()});
 assert(walk.speed>8,'movimiento del motor');assert(walk.waistSplitActive);assert(/^player_walk[0-3]$/.test(walk.lowerPose));
 const shooting=await p.evaluate(()=>{__DD_BRIDGE.testStep({right:true,fire:true,aim:0},10);return DMO.playerAnim.getStateSnapshot()});
 assert.equal(shooting.state,'shoot');assert(shooting.waistSplitActive);assert(/^player_walk[0-3]$/.test(shooting.lowerPose));
 console.log('PASS caminar y disparar en movimiento: poses superior e inferior reales');
 const mounts=await p.evaluate(()=>{const a=DMO.playerAnim;return [0,Math.PI].map(v=>DD_WORLD.getPlayerWeaponMount(a,v,1))});
 assert(mounts.every(Boolean));assert(Math.abs(mounts[0].x+mounts[1].x)<0.01);assert(Math.abs(mounts[0].y-mounts[1].y)<0.01);
 console.log('PASS arma sigue el ancla de mano y se refleja al apuntar a ambos lados');
 await p.evaluate(()=>__DD_BRIDGE.testStep({},90));
 const noHit=await p.evaluate(()=>__QA_PLAYER_ANIM.invulnerabilityOnly());assert.notEqual(noHit.state,'hurt','invulnerabilidad sin impacto no es daño');
 const blocked=await p.evaluate(()=>__QA_PLAYER_ANIM.hit(1,true));assert.equal(blocked.shield,1);assert.equal(blocked.hp,blocked.before.hp);assert.notEqual(blocked.anim.state,'hurt','impacto rechazado no activa pose');
 const shield=await p.evaluate(()=>__QA_PLAYER_ANIM.hit(1,false));assert.equal(shield.shield,0);assert.equal(shield.hp,shield.before.hp);assert.equal(shield.anim.state,'hurt');assert.equal(shield.anim.upperPose,'player_hit');
 await p.evaluate(()=>__DD_BRIDGE.testStep({},90));
 const hurt=await p.evaluate(()=>{DMO.playtest.hurt(1);__DD_BRIDGE.testStep({},1);return {anim:DMO.playerAnim.getStateSnapshot(),snap:__DD_BRIDGE.getSnapshot()}});
 assert.equal(hurt.anim.state,'hurt');assert.equal(hurt.anim.upperPose,'player_hit');assert(hurt.snap.hp<hurt.snap.maxHp);
 await p.evaluate(()=>__DD_BRIDGE.testStep({},30));assert.notEqual(await p.evaluate(()=>DMO.playerAnim.getStateSnapshot().state),'hurt','reacción termina');
 console.log('PASS impacto de escudo y vida, invulnerabilidad sin impacto y rechazo; reacción temporal');
 const fatal=await p.evaluate(()=>__QA_PLAYER_ANIM.fatalHit());assert.equal(fatal.hp,0);assert.equal(fatal.anim.state,'death');assert.equal(fatal.anim.upperPose,'player_death');console.log('PASS muerte tiene prioridad sobre impacto');
 assert.deepEqual(errors,[]);console.log('PASS sin errores de navegador');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
