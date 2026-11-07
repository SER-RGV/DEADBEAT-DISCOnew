const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const OUT = '/home/user/DEADBEAT-DISCOnew/ART_EVIDENCE/hub/tanda_07';
(async () => {
  const b = await chromium.launch({
    executablePath: '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader',
           '--disable-background-networking','--disable-logging','--log-level=3'] });
  const c = await b.newContext({ viewport: { width:1280, height:900 }, deviceScaleFactor:1 });
  const p = await c.newPage();
  const errs=[], http=[];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type()==='error') errs.push('console:'+m.text().slice(0,180)); });
  p.on('response', r => { if (r.status()>=400) http.push(r.status()+' '+r.url()); });
  await p.goto('http://127.0.0.1:8123/', { waitUntil:'load', timeout:180000 });
  await p.waitForFunction(() => { try { return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status); } catch(e){return false;} }, { timeout:90000 });
  const t0=Date.now();
  const boot = await p.evaluate(() => ({ state: window.DMO_HUB.state(), cine: window.DMO_CINE ? Object.keys(window.DMO_CINE) : null }));
  await p.mouse.click(640,450); await p.waitForTimeout(600);
  await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  await p.keyboard.down('Escape'); await p.waitForTimeout(2800); await p.keyboard.up('Escape');
  await p.waitForTimeout(900);
  const probe = await p.evaluate(() => {
    const W=window, safe=f=>{try{const v=f();return v===undefined?null:v}catch(e){return 'ERR:'+e.message}};
    const apiNames=Object.keys(W).filter(k=>/^(DMO|DDM|T3B|__DDM|__T3B|Qf|CINE|hub)/i.test(k)).sort();
    const describe=o=>{ if(!o||typeof o!=='object')return typeof o; const r={}; for(const k of Object.keys(o).sort()){ let t; try{t=typeof o[k]}catch(e){t='?'} r[k]=t; } return r; };
    const r={};
    r.globals=apiNames.map(k=>({name:k, type:typeof W[k], keys:(typeof W[k]==='object'||typeof W[k]==='function')?describe(W[k]):null}));
    r.DMO=safe(()=>describe(W.DMO));
    r.camera=safe(()=>W.DMO.camera());
    r.debug=safe(()=>describe(W.DMO.debug));
    r.testStats=safe(()=>W.DMO.testStats());
    r.hubState=safe(()=>W.DMO_HUB.state());
    r.hubAPI=safe(()=>describe(W.DMO_HUB));
    r.hubAudit=safe(()=>W.DMO_HUB.audit());
    r.stations=safe(()=>W.DMO_HUB.stations());
    r.cine=safe(()=>W.DMO_CINE&&W.DMO_CINE.state?W.DMO_CINE.state():describe(W.DMO_CINE));
    r.cineAPI=safe(()=>describe(W.DMO_CINE));
    r.music=safe(()=>W.DMO_MUSIC&&W.DMO_MUSIC.state?W.DMO_MUSIC.state():describe(W.DMO_MUSIC));
    r.musicAPI=safe(()=>describe(W.DMO_MUSIC));
    r.floorAnim=safe(()=>describe(W.DMO_FLOOR_ANIM));
    r.floor=safe(()=>describe(W.DMO_FLOOR));
    r.atmos=safe(()=>describe(W.DMO_ATMOS));
    r.infernal=safe(()=>describe(W.DMO_INFERNAL_ART));
    r.artPack=safe(()=>W.DMO_ART_PACK.state());
    r.artPackAPI=safe(()=>describe(W.DMO_ART_PACK));
    r.dungeon=safe(()=>W.DMO_DUNGEON.state());
    r.dungeonAPI=safe(()=>describe(W.DMO_DUNGEON));
    r.prog=safe(()=>W.DMO_PROG&&W.DMO_PROG.state?W.DMO_PROG.state():null);
    r.layout=safe(()=>describe(W.DMO_LAYOUT));
    r.story=safe(()=>describe(W.DMO_STORY));
    r.boots=safe(()=>describe(W.DMO_BOOT46));
    r.canvas=[...document.querySelectorAll('canvas')].map(e=>({id:e.id,cls:e.className,w:e.width,h:e.height}));
    r.v5Keys=safe(()=>Object.keys(W.__DDM_V5_IMG||{}).length);
    r.v5Names=safe(()=>Object.keys(W.__DDM_V5_IMG||{}).filter(k=>/dancer|clubber|npc|cliente|griet|chasm|abyss|cliff|stair|lift|pad|portal|rock|smoke|ember/i.test(k)).sort());
    r.ambientDancers=safe(()=>W.DMO_HUB&&W.DMO_HUB.state&&W.DMO_HUB.state().ambientDancers);
    return r;
  });
  fs.mkdirSync(OUT,{recursive:true});
  fs.writeFileSync(OUT+'/audit_runtime.json', JSON.stringify({generatedAt:new Date().toISOString(),
    loadMs:Date.now()-t0, boot, probe, pageErrors:errs, httpErrors:http},null,2)+'\n');
  console.log('globals',probe.globals.length,'pageErrors',errs.length,'canvas',probe.canvas.length);
  console.log('hubState keys',Object.keys(probe.hubState||{}).length,'stations',(probe.stations||[]).length);
  await c.close(); await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
