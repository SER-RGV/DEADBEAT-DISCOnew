const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const OUT = '/home/user/DEADBEAT-DISCOnew/ART_EVIDENCE/hub/tanda_07';
(async () => {
  const b = await chromium.launch({executablePath:'/tmp/chromium',headless:true,
    env:{...process.env,LD_LIBRARY_PATH:'/tmp/chromelibs/lib:/tmp'},
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader',
          '--disable-background-networking','--disable-logging','--log-level=3']});
  const c = await b.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});
  const p = await c.newPage();
  await p.goto('http://127.0.0.1:8123/',{waitUntil:'load',timeout:180000});
  await p.waitForFunction(()=>{try{return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status)}catch(e){return false}},{timeout:90000});
  // Arrancar partida: la intro se dispara al pulsar Enter
  await p.mouse.click(640,450); await p.waitForTimeout(600);
  await p.keyboard.press('Enter'); await p.waitForTimeout(700);
  // Intro: dejar correr la cinemática (sin skip) y muestrear planos
  const introShots=[];
  for (const ms of [1200, 4200, 4500, 6000, 7000]) {
    await p.waitForTimeout(ms);
    const st=await p.evaluate(()=>{try{return window.DMO_CINE.state()}catch(e){return null}});
    const f='audit_intro_'+String(introShots.length+1)+'_'+(st&&st.shot?st.shot.replace(/\./g,'_'):'x')+'.jpg';
    await p.screenshot({path:OUT+'/'+f,type:'jpeg',quality:82});
    introShots.push({file:f,shot:st&&st.shot,t:st&&st.t,active:st&&st.active});
  }
  // saltar intro y entrar al HUB (skipHold = 0.6 s)
  await p.keyboard.down('Escape'); await p.waitForTimeout(1400); await p.keyboard.up('Escape');
  await p.waitForTimeout(1200);
  await p.waitForFunction(()=>{try{return window.DMO_HUB.state().inHub && !window.DMO_CINE.state().active}catch(e){return false}},{timeout:30000});
  await p.waitForTimeout(600);
  const systems = await p.evaluate(()=>{
    const W=window,s=f=>{try{return f()}catch(e){return 'ERR:'+e.message}};
    return {
      layoutReport:s(()=>W.DMO_LAYOUT.report()),
      layoutProps:s(()=>{const q=W.DMO_LAYOUT.props();return Array.isArray(q)?q.slice(0,40):q}),
      layoutMetrics:s(()=>W.DMO_LAYOUT.metrics()),
      gamepad:s(()=>W.DMO.gamepad.state()),
      gamepadTelemetry:s(()=>W.DMO.gamepad.telemetry()),
      playerAnim:s(()=>W.DMO.playerAnim.getStateSnapshot()),
      semi2d:s(()=>({top:W.DMO_SEMI2D.WORLD_TOP,bottom:W.DMO_SEMI2D.WORLD_BOTTOM,
        s300:W.DMO_SEMI2D.scaleFor(300),s1500:W.DMO_SEMI2D.scaleFor(1500),
        debug:W.DMO_SEMI2D.isDebug&&W.DMO_SEMI2D.isDebug()})),
      roomGeometry:s(()=>W.DMO.roomGeometryAudit()),
      v88:s(()=>W.DMO_V88.layout),
      musicEvents:s(()=>W.DMO_MUSIC.events&&W.DMO_MUSIC.events()),
      descentFusion:s(()=>W.DMO.descentFusion.state()),
      descentAudit:s(()=>W.DMO.descentFusion.audit()),
      dungeonAudit:s(()=>W.DMO_DUNGEON.audit()),
      hubZones:s(()=>W.DMO_HUB.audit()),
      cineState:s(()=>W.DMO_CINE.state()),
      reduced:s(()=>W.Yc?W.Yc.reduced:null),
      muted:s(()=>{try{return localStorage.getItem('dmo_muted_v1')}catch(e){return null}}),
    };
  });
  // Descenso REAL: abrir y confirmar transición, muestrear estados + capturas
  const descent=[];
  const started=await p.evaluate(()=>{try{return window.DMO_HUB.startCampaignFromHub(0)}catch(e){return 'ERR:'+e.message}});
  for (const ms of [250, 700, 900, 900, 900, 900]) {
    await p.waitForTimeout(ms);
    const st=await p.evaluate(()=>{try{return {floor:window.DMO_FLOOR_ANIM.state(),hub:window.DMO_HUB.state(),music:window.DMO_MUSIC.state()}}catch(e){return {err:String(e)}}});
    const f='audit_descenso_'+String(descent.length+1)+'.jpg';
    await p.screenshot({path:OUT+'/'+f,type:'jpeg',quality:82});
    descent.push({file:f,phase:st.floor&&st.floor.phase,stage:st.floor&&st.floor.stage,
      active:st.floor&&st.floor.active,stairP:st.floor&&st.floor.stairP,
      particles:st.floor&&st.floor.particles,zoom:st.floor&&st.floor.zoom,
      location:st.hub&&st.hub.location,transitionLock:st.hub&&st.hub.transitionLock,
      music:st.music&&st.music.state,musicDescent:st.music&&st.music.descent});
  }
  fs.writeFileSync(OUT+'/audit_systems.json',JSON.stringify({generatedAt:new Date().toISOString(),
    introShots,systems,started,descent},null,2)+'\n');
  console.log('intro',introShots.length,'descent',descent.length,'started',started);
  console.log('layout props',Array.isArray(systems.layoutProps)?systems.layoutProps.length:'n/a');
  await c.close(); await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
