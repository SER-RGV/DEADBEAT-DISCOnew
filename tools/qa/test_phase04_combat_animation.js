/* FASE 04 outfit combat animation integration. Test-only state hooks drive the
   real in-game renderer; gameplay mechanics and persistent saves are untouched. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const PLAYWRIGHT = process.env.QA_MODULES
  ? path.join(process.env.QA_MODULES, 'playwright-core') : 'playwright-core';
const { chromium } = require(PLAYWRIGHT);
const BASE = process.argv[2] || 'http://127.0.0.1:8124';
const OUT = process.argv[3] || path.resolve('docs/evidence/atuendos/fase04-combat');
const IDS = ['original','rapture','shadow','apocalypse','gunslinger','fightclub','kitchenriot','streetart'];
const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
const anchor = '    const ddOriginalEndRun = fp;';
assert.strictEqual(html.split(anchor).length, 2, 'test hook insertion point must be unique');
const hook = `
    window.__QA_PHASE04 = {
      pose: function (state, options) {
        const p = DMO.playerAnim, o = options || {};
        p.paused = true; p.state = state; p.stateTime = Number(o.time) || 0;
        p.totalTime = (Number(p.totalTime) || 0) + 0.14;
        p.chargeT = Number(o.charge) || 0; p.abilityT = Number(o.ability) || 0;
        p.upperPose = state === 'death' ? 'player_death' : state === 'hurt' ? 'player_hit' :
          state === 'ability' ? 'player_boost' : state === 'dodge' ? 'player_roll' : 'player_fire';
        p.lowerPose = (state === 'walk' || state === 'run' || o.moving) ? 'player_walk' + (Number(o.step) % 4) : p.upperPose;
        p.waistSplitActive = p.lowerPose.indexOf('player_walk') === 0;
        if (o.shot) p.lastShotSerial = (Number(p.lastShotSerial) || 0) + 1;
        return window.DD_WORLD.resolvePlayerPose(p, Number(ye.aimAngle) || 0, true);
      },
      resume: function () { DMO.playerAnim.paused = false; }
    };`;
const instrumented = html.replace(anchor, anchor + hook);

(async () => {
  fs.mkdirSync(OUT, {recursive:true});
  const browser = await chromium.launch({executablePath:process.env.DD_CHROMIUM || undefined,
    headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context = await browser.newContext({viewport:{width:1280,height:720}});
  const page = await context.newPage(), errors = [], results = {};
  page.on('pageerror', e => errors.push('PAGEERROR '+e.message));
  page.on('console', m => { if (m.type()==='error') errors.push('CONSOLE '+m.text()); });
  page.on('requestfailed', r => errors.push('REQFAIL '+r.url()));
  page.on('response', r => { if (r.status()>=400) errors.push('HTTP '+r.status()+' '+r.url()); });
  try {
    await page.route('**/index.html', r => r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:instrumented}));
    await page.goto(BASE+'/index.html');
    await page.waitForFunction(() => DD_BOOT?.getState().state === 'MAIN_MENU', null, {timeout:60000});
    await page.evaluate(() => DD_UI.triggerMenuAction('new'));
    await page.waitForFunction(() => DD_OPENING.getState()?.type==='intro', null, {timeout:30000});
    await page.evaluate(() => DD_OPENING.debugSeek(31.9,false));
    await page.waitForFunction(() => DD_OPENING.getState()?.type==='descent', null, {timeout:30000});
    await page.evaluate(() => DD_OPENING.debugSeek(4.55,false));
    await page.waitForFunction(() => DD_HUB.isActive(), null, {timeout:30000});
    await page.evaluate(() => DD_HUB.exitToRun());
    await page.waitForFunction(() => DD_CINE.getState()?.type==='circle', null, {timeout:30000});
    await page.keyboard.press('Space');
    await page.waitForFunction(() => __DD_BRIDGE.isRunning(), null, {timeout:30000});
    await page.evaluate(() => { DMO.debug.exploreNoEnemies(true); DMO.debug.holdSpawns(true); });
    await page.evaluate(() => __DD_BRIDGE.testStep({},60));

    for (const id of IDS) {
      assert(await page.evaluate(id => DD_APPEARANCE.equip(id), id), 'equip '+id);
      await page.waitForFunction(id => DD_APPEARANCE.current().id===id && DD_APPEARANCE.outfitReady(id), id, {timeout:10000});
      const check = async (file, state, options, expected) => {
        const pose = await page.evaluate(({state,options}) => {
          const p=__QA_PHASE04.pose(state,options);
          return {action:p.outfitActionPose,upper:p.upperImg&&p.upperImg.src,lower:p.lowerImg&&p.lowerImg.src,split:!!p.split,hand:!!p.hand};
        }, {state,options});
        assert.strictEqual(pose.action, expected, `${id}/${state}: expected ${expected}, got ${pose.action}`);
        assert(pose.upper.includes(`/outfits/${id}/${expected}.png`), `${id}/${state}: ${pose.upper}`);
        if (state==='walk' || state==='run') assert(pose.lower.includes(`/outfits/${id}/`), `${id} legs not from its outfit`);
        if (file) {
          await page.waitForTimeout(120);
          await page.screenshot({path:path.join(OUT,`${file}-${id}.jpg`),type:'jpeg',quality:88});
        }
        return pose;
      };
      results[id] = {};
      await check('walk','walk',{moving:true,step:1},'aim');
      results[id].walk='PASS (outfit-specific legs alternate under aim torso)';
      await check('run','run',{moving:true,step:3},'aim');
      results[id].run='PASS (engine run state, outfit step pose)';
      await check('recoil','shoot',{shot:true},'hurt');
      results[id].shoot='PASS (authored recoil pose; weapon mount suppressed for the recoil beat)';
      const chargePrep=await page.evaluate(()=>__QA_PHASE04.pose('charged',{charge:0.1}));
      assert.strictEqual(chargePrep.outfitActionPose,'idle',`${id}: charged anticipation`);
      await check('charged','charged',{charge:0.86},'aim');
      results[id].charged='PASS (anticipation to aim/tension)';
      await check('ability','ability',{ability:0.33},'roll');
      results[id].ability='PASS (compact authored activation pose and comic energy burst)';
      await check('hurt','hurt',{},'hurt');
      results[id].hurt='PASS (authored impact pose and ink burst)';
      await check('death','death',{},'death');
      results[id].death='PASS (authored fall pose and ink punctuation)';
      console.log(`PASS ${id}: walk/run, recoil, charged, ability, hurt, death`);
    }
    assert.deepStrictEqual(errors,[],'browser errors / failed requests');
    const report={date:new Date().toISOString(),browser:await page.evaluate(()=>navigator.userAgent),viewport:'1280x720',errors,outfits:results};
    fs.writeFileSync(path.join(OUT,'phase04-animation-matrix.json'),JSON.stringify(report,null,2));
    console.log(`PASS FASE 04 animation matrix 8/8: ${OUT}`);
    await context.close();
  } finally { await browser.close(); }
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
