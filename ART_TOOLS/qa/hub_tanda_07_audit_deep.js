const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const OUT = '/home/user/DEADBEAT-DISCOnew/ART_EVIDENCE/hub/tanda_07';
(async () => {
  const b = await chromium.launch({ executablePath:'/tmp/chromium', headless:true,
    env:{...process.env,LD_LIBRARY_PATH:'/tmp/chromelibs/lib:/tmp'},
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader',
          '--disable-background-networking','--disable-logging','--log-level=3']});
  const c = await b.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});
  const p = await c.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://127.0.0.1:8123/',{waitUntil:'load',timeout:180000});
  await p.waitForFunction(()=>{try{return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status)}catch(e){return false}},{timeout:90000});
  // Captura de la portada / intro en curso (sin saltar aún)
  await p.screenshot({path:OUT+'/audit_00_portada.png'});
  const intro = await p.evaluate(()=>{
    const W=window,s=f=>{try{return f()}catch(e){return 'ERR:'+e.message}};
    return {
      cineState:s(()=>W.DMO_CINE.state()),
      shotList:s(()=>W.DMO_CINE.shotList()),
      scenes:s(()=>W.DMO_CINE.scenes()),
      storyNpcs:s(()=>W.DMO_STORY.npcs()),
      storyStations:s(()=>W.DMO_STORY.stations()),
      storyFlags:s(()=>W.DMO_STORY.flags()),
      introSeen:s(()=>W.DMO_STORY.introSeen()),
      musicCineState:s(()=>W.DMO_MUSIC.cineState()),
      musicProfiles:s(()=>W.DMO_MUSIC.profiles()),
      musicAudit:s(()=>W.DMO_MUSIC.audit()),
      floorAnimState:s(()=>W.DMO_FLOOR_ANIM.state()),
      floorAnimTimelines:s(()=>W.DMO_FLOOR_ANIM.timelines()),
      floorAnimProfiles:s(()=>W.DMO_FLOOR_ANIM.profiles()),
      floorDrop:s(()=>W.DMO.floorDrop&&W.DMO.floorDrop.state?W.DMO.floorDrop.state():Object.keys(W.DMO.floorDrop||{})),
      descentFusion:s(()=>Object.keys(W.DMO.descentFusion||{})),
      atmosAudit:s(()=>W.DMO_ATMOS.audit()),
      atmosConfig:s(()=>W.DMO_ATMOS.config),
      infernalThemes:s(()=>W.DMO_INFERNAL_ART.themes()),
      infernalAudit:s(()=>W.DMO_INFERNAL_ART.audit()),
      semi2d:s(()=>Object.keys(W.DMO_SEMI2D||{})),
      playerAnim:s(()=>Object.keys(W.DMO.playerAnim||{})),
      hubObj:s(()=>Object.keys(W.DMO.hub||{})),
      location:s(()=>Object.keys(W.DMO.location||{})),
      gameState:s(()=>W.DMO.gameState),
      gamepad:s(()=>Object.keys(W.DMO.gamepad||{})),
      v5:s(()=>Object.keys(W.__DDM_V5_IMG||{}).map(k=>({k,natural:(()=>{const i=W.__DDM_V5_IMG[k];return i?[i.naturalWidth,i.naturalHeight]:null})()}))
          .filter(x=>/npc|dancer|clubber|abyss|chasm|cliff|stair|lift|portal|pit|crack|rock|smoke|ember|pad/i.test(x.k))),
    };
  });
  await p.mouse.click(640,450); await p.waitForTimeout(600);
  await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  await p.keyboard.down('Escape'); await p.waitForTimeout(2800); await p.keyboard.up('Escape'); await p.waitForTimeout(900);
  await p.screenshot({path:OUT+'/audit_01_hub_centro.png'});
  // Zona sur / grieta de descenso
  await p.evaluate(()=>{try{window.DMO.debug.teleport(1250,1290)}catch(e){};try{window.DMO.debug.tick(0.016,30)}catch(e){}});
  await p.waitForTimeout(850);
  await p.screenshot({path:OUT+'/audit_02_grieta_sur.png'});
  const lift = await p.evaluate(()=>{
    const W=window,s=f=>{try{return f()}catch(e){return 'ERR:'+e.message}};
    return {station:s(()=>W.DMO_HUB.stations().find(x=>x.id==='lift')),
      canEnter:s(()=>W.DMO_HUB.canEnterCircle(0)),
      missing:s(()=>W.DMO_HUB.missingRequirement(0)),
      camera:s(()=>W.DMO.camera()),
      hubState:s(()=>W.DMO_HUB.state()),
      audit:s(()=>W.DMO_HUB.audit())};
  });
  // Abrir selector de descenso (sin confirmar)
  const modal = await p.evaluate(()=>{try{return String(window.DMO_HUB.openStation('lift'))}catch(e){return 'ERR:'+e.message}});
  await p.waitForTimeout(500);
  await p.screenshot({path:OUT+'/audit_03_selector_descenso.png'});
  const modalState = await p.evaluate(()=>{try{return window.DMO_HUB.state()}catch(e){return 'ERR:'+e.message}});
  await p.evaluate(()=>{try{window.DMO_HUB.closeModal()}catch(e){}});
  fs.writeFileSync(OUT+'/audit_deep.json',JSON.stringify({generatedAt:new Date().toISOString(),intro,lift,modal,modalState,pageErrors:errs},null,2)+'\n');
  console.log('shots',(intro.shotList||[]).length,'v5 relevantes',(intro.v5||[]).length,'pageErrors',errs.length);
  await c.close(); await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
