/* FASE 03.1 visual matrix: eight canonical looks in selector, HUB and an
   active game. Test-only hooks are injected into the in-memory index response;
   production files and persistent player data are not modified. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const PLAYWRIGHT = process.env.QA_MODULES
  ? path.join(process.env.QA_MODULES, 'playwright-core')
  : 'playwright-core';
const { chromium } = require(PLAYWRIGHT);

const BASE = process.argv[2] || 'http://127.0.0.1:8081';
const OUT = process.argv[3] || path.resolve('.cache/review/phase03/visual-matrix');
const IDS = ['original', 'rapture', 'shadow', 'apocalypse', 'gunslinger', 'fightclub', 'kitchenriot', 'streetart'];
const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
const anchor = '    const ddOriginalEndRun = fp;';
assert.strictEqual(html.split(anchor).length, 2, 'test hook insertion point must be unique');
const isolatedTestHooks = `
    window.__QA_PHASE03 = {
      resolve: function (anim, armed) {
        const p = window.DD_WORLD.resolvePlayerPose(anim, 0, armed);
        return p && {upper:p.upperImg && p.upperImg.src, lower:p.lowerImg && p.lowerImg.src,
          split:!!p.split, outfit:!!p.outfit, moving:!!p.outfitMoving};
      },
      boost: function () {
        fr('qa:phase03-boost'); Tr = 0; Sr = 1; Cr = false; w.playerAnim.abilityT = 0;
        window.dispatchEvent(new KeyboardEvent('keydown', {code:'ShiftLeft', key:'Shift', bubbles:true}));
        return w.playerAnim.getStateSnapshot();
      },
      equipBow: function () {
        const id = 'c106_arco_ancestral';
        if (!Dt.owned.includes(id)) Dt.owned.push(id);
        return cd(id, false);
      },
      hit: function () {
        fr('qa:phase03-hit'); Ee = 0; ke = 0; Cr = false; ye.rollT = 0; w.playerAnim.hurtT = 0;
        const hp = ve; wp('qa', ye.x + 30, ye.y); w.playerAnim.step(1/60);
        return {hpBefore:hp, hp:ve, anim:w.playerAnim.getStateSnapshot()};
      },
      fatal: function () {
        fr('qa:phase03-fatal'); ve = 1; Ee = 0; ke = 0; Cr = false; ye.rollT = 0;
        wp('qa', ye.x + 30, ye.y); w.playerAnim.step(1/60);
        return {hp:ve, dead:Mr, anim:w.playerAnim.getStateSnapshot()};
      }
    };`;
const instrumented = html.replace(anchor, anchor + isolatedTestHooks);

function assertOutfitAsset(frameResult, id, pose) {
  assert(frameResult.upper && frameResult.upper.includes(`/outfits/${id}/${pose}.png`),
    `${id} expected ${pose}, got ${frameResult.upper}`);
}
async function enterHub(page) {
  await page.evaluate(() => DD_UI.triggerMenuAction('new'));
  await page.waitForFunction(() => DD_OPENING.getState()?.type === 'intro', null, {timeout:30000});
  await page.evaluate(() => DD_OPENING.debugSeek(31.9, false));
  await page.waitForFunction(() => DD_OPENING.getState()?.type === 'descent', null, {timeout:30000});
  await page.evaluate(() => DD_OPENING.debugSeek(4.55, false));
  await page.waitForFunction(() => DD_HUB.isActive(), null, {timeout:30000});
}
async function enterRun(page) {
  await page.waitForFunction(() => DD_HUB.isActive());
  await page.evaluate(() => DD_HUB.exitToRun());
  await page.waitForFunction(() => DD_CINE.getState()?.type === 'circle', null, {timeout:30000});
  await page.keyboard.press('Space');
  await page.waitForFunction(() => __DD_BRIDGE.isRunning(), null, {timeout:30000});
  await page.evaluate(() => { DMO.debug.exploreNoEnemies(true); DMO.debug.holdSpawns(true); });
}
async function fresh(page, id) {
  await page.goto(BASE + '/index.html');
  await page.waitForFunction(() => DD_BOOT?.getState().state === 'MAIN_MENU', null, {timeout:60000});
  await page.waitForFunction(id => DD_APPEARANCE.outfitReady(id), id, {timeout:30000});
  assert(await page.evaluate(id => DD_APPEARANCE.equip(id), id), `could not equip ${id}`);
  await enterHub(page);
  await enterRun(page);
}

(async () => {
  fs.mkdirSync(OUT, {recursive:true});
  const browser = await chromium.launch({executablePath:process.env.DD_CHROMIUM || undefined,
    headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context = await browser.newContext({viewport:{width:1280,height:720}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  page.on('requestfailed', r => errors.push('REQFAIL ' + r.url()));
  page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
  const results = {};
  try {
    await page.route('**/index.html', route => route.fulfill({status:200,
      contentType:'text/html; charset=utf-8', body:instrumented}));
    await page.goto(BASE + '/index.html');
    await page.waitForFunction(() => DD_BOOT?.getState().state === 'MAIN_MENU', null, {timeout:60000});
    await page.locator('[data-action=customize]').click();
    assert.strictEqual(await page.locator('[data-look]').count(), 8, 'selector should show eight looks');
    for (const id of IDS) {
      await page.waitForFunction(id => DD_APPEARANCE.outfitReady(id), id, {timeout:30000});
      await page.locator(`[data-look="${id}"]`).click();
      await page.waitForFunction(id => DD_APPEARANCE.current().id === id, id, {timeout:5000});
      assert(await page.evaluate(id => !!DD_APPEARANCE.showcase(id), id), `${id} showcase unavailable`);
      await page.screenshot({path:path.join(OUT, `selector-${id}.jpg`), type:'jpeg', quality:90});
      results[id] = {selector:'PASS', hub:'PENDING', gameplay:'PENDING', states:{}};
    }

    await page.keyboard.press('Escape');
    await page.locator('[data-action=play]').click();
    await page.locator('#dd-scene-new').click();
    await page.waitForFunction(() => DD_OPENING.getState()?.type === 'intro', null, {timeout:30000});
    await page.evaluate(() => DD_OPENING.debugSeek(31.9, false));
    await page.waitForFunction(() => DD_OPENING.getState()?.type === 'descent', null, {timeout:30000});
    await page.evaluate(() => DD_OPENING.debugSeek(4.55, false));
    await page.waitForFunction(() => DD_HUB.isActive(), null, {timeout:30000});
    for (const id of IDS) {
      assert(await page.evaluate(id => DD_APPEARANCE.equip(id), id), `HUB equip ${id}`);
      await page.waitForTimeout(350);
      const idle = await page.evaluate(() => {
        const pose = DD_WORLD.resolvePlayerPose({upperPose:'player_idle',lowerPose:'player_idle',waistSplitActive:false}, 0, false);
        return {current:DD_APPEARANCE.current().id, ready:DD_APPEARANCE.outfitReady(DD_APPEARANCE.current().id), image:pose && pose.upperImg.src};
      });
      assert.strictEqual(idle.current, id);
      assert(idle.ready, `${id} not ready in HUB`);
      assert(idle.image.includes(`/outfits/${id}/idle.png`), `${id} HUB idle mismatch: ${idle.image}`);
      await page.screenshot({path:path.join(OUT, `hub-${id}.jpg`), type:'jpeg', quality:90});
      results[id].hub = 'PASS';
      results[id].states.IDLE = 'PASS (HUB idle.png)';
    }

    // Enter one active match for Original; the remaining seven each start a
    // fresh, isolated match so real fatal-hit/death state can be tested.
    let runIds = [...IDS];
    for (let index=0; index<runIds.length; index++) {
      const id = runIds[index];
      if (index === 0) {
        await page.evaluate(id => DD_APPEARANCE.equip(id), id);
        await enterRun(page);
      } else {
        await fresh(page, id);
      }
      await page.evaluate(() => __DD_BRIDGE.testStep({}, 45));

      // Active gameplay capture and frame selection check for a real run state.
      await page.evaluate(({id}) => DD_APPEARANCE.equip(id), {id});
      await page.evaluate(() => __DD_BRIDGE.testStep({right:true}, 3));
      const walk = await page.evaluate(() => {
        const a = DMO.playerAnim.getStateSnapshot();
        return {anim:a, frame:__QA_PHASE03.resolve(a,true)};
      });
      assert.strictEqual(walk.anim.state, 'walk', `${id} walk state: ${walk.anim.state}`);
      assertOutfitAsset(walk.frame, id, 'aim');
      assert(walk.frame.lower.includes(`/outfits/${id}/`), `${id} walk legs not from outfit: ${walk.frame.lower}`);
      results[id].states.CAMINAR = 'PASS (motor walk; outfit aim + walk cycle)';
      await page.screenshot({path:path.join(OUT, `game-${id}.jpg`), type:'jpeg', quality:90});

      await page.evaluate(() => __DD_BRIDGE.testStep({}, 45));
      await page.evaluate(() => __DD_BRIDGE.testStep({right:true}, 18));
      const run = await page.evaluate(() => {
        const a=DMO.playerAnim.getStateSnapshot(); return {anim:a, frame:__QA_PHASE03.resolve(a,true)};
      });
      assert(run.anim.state === 'run' || run.anim.transitions.some(t => t.to === 'run'),
        `${id} run transition missing: ${JSON.stringify(run.anim)}`);
      assertOutfitAsset(run.frame,id,'aim');
      assert(run.frame.lower.includes(`/outfits/${id}/`), `${id} run legs not from outfit`);
      results[id].states.CORRER = 'PASS (motor run; shared outfit walk cadence)';
      const cycle = await page.evaluate(() => [0,1,2,3].map(step => {
        const a={upperPose:'player_fire',lowerPose:'player_walk'+step,waistSplitActive:true};
        const p=__QA_PHASE03.resolve(a,true); return p.lower;
      }));
      assert.deepStrictEqual(cycle.map(src => src.split('/').pop()),
        ['idle.png','walk_a.png','idle.png','walk_a.png'], `${id} walk/run outfit frame cycle`);
      results[id].states.CICLO_MOVIMIENTO = 'PASS (idle/walk_a alternation across four engine steps)';

      await page.evaluate(() => __DD_BRIDGE.testStep({}, 40));
      await page.evaluate(() => __DD_BRIDGE.testStep({right:true,fire:true,aim:0}, 12));
      const shoot = await page.evaluate(() => {
        const a=DMO.playerAnim.getStateSnapshot(); return {anim:a,frame:__QA_PHASE03.resolve(a,true)};
      });
      assert(shoot.anim.state === 'shoot' || shoot.anim.transitions.some(t => t.to === 'shoot'),
        `${id} shoot transition missing: ${JSON.stringify(shoot.anim)}`);
      assertOutfitAsset(shoot.frame,id,'aim');
      results[id].states.DISPARAR = 'PASS (motor shoot; outfit aim.png)';

      // Equip a real bow through a test-only isolated hook, then hold the real
      // engine fire input until its charged state is entered (chargeT >= 0.15).
      await page.evaluate(() => { DMO.playerAnim.forceState(null); __QA_PHASE03.equipBow(); });
      const charged = await page.evaluate(() => {
        __DD_BRIDGE.testStep({fire:true,aim:0}, 20);
        const a=DMO.playerAnim.getStateSnapshot(); return {anim:a,frame:__QA_PHASE03.resolve(a,true)};
      });
      assert.strictEqual(charged.anim.state,'charged',`${id} charged state ${charged.anim.state}`);
      assert(charged.anim.chargeT >= 0.15, `${id} chargeT ${charged.anim.chargeT}`);
      assertOutfitAsset(charged.frame,id,'aim');
      results[id].states.DISPARO_CARGADO = 'PASS (bow charge state; outfit aim.png)';

      // Let charge input release, then activate the engine's real boost path via
      // the test hook's isolated stock counter and keyboard event.
      await page.evaluate(() => __DD_BRIDGE.testStep({}, 35));
      const ability = await page.evaluate(() => {
        const before=DMO.playerAnim.getStateSnapshot();
        const after=__QA_PHASE03.boost(); __DD_BRIDGE.testStep({},1);
        return {before,after,anim:DMO.playerAnim.getStateSnapshot(),frame:__QA_PHASE03.resolve(DMO.playerAnim.getStateSnapshot(),true)};
      });
      assert.strictEqual(ability.anim.state,'ability',`${id} ability state ${ability.anim.state}`);
      assert.strictEqual(ability.anim.upperPose,'player_boost');
      assertOutfitAsset(ability.frame,id,'aim');
      results[id].states.HABILIDAD = 'PASS (real boost action; existing armed fallback aim.png)';

      await page.evaluate(() => __DD_BRIDGE.testStep({}, 35));
      const hurt = await page.evaluate(() => {
        const ret=__QA_PHASE03.hit(); __DD_BRIDGE.testStep({},1);
        const a=DMO.playerAnim.getStateSnapshot(); return {ret,anim:a,frame:__QA_PHASE03.resolve(a,true)};
      });
      assert.strictEqual(hurt.anim.state,'hurt',`${id} hurt state ${hurt.anim.state}`);
      assertOutfitAsset(hurt.frame,id,'hurt');
      results[id].states.DAÑO = 'PASS (real playtest damage; outfit hurt.png)';

      const death = await page.evaluate(() => {
        const ret=__QA_PHASE03.fatal();
        return {ret,frame:__QA_PHASE03.resolve(DMO.playerAnim.getStateSnapshot(),true)};
      });
      assert.strictEqual(death.ret.hp,0,`${id} fatal HP`);
      assert.strictEqual(death.ret.anim.state,'death',`${id} death state`);
      assert(death.ret.dead,`${id} game engine not dead`);
      assertOutfitAsset(death.frame,id,'death');
      await page.screenshot({path:path.join(OUT, `death-${id}.jpg`), type:'jpeg', quality:90});
      results[id].states.MUERTE = 'PASS (real fatal hit; outfit death.png)';
      results[id].gameplay = 'PASS';
      console.log(`PASS ${id}: selector + HUB + walk/run/shoot/charged/ability/hurt/death`);
    }
    assert.deepStrictEqual(errors, [], 'browser errors or failed requests');
    const report = {date:new Date().toISOString(), url:BASE, viewport:'1280x720', browser:await page.evaluate(()=>navigator.userAgent),
      method:'real application + active run; debug skip for intro; isolated test hooks for damage/death/boost; bow equipped by test-only hook',
      errors, outfits:results};
    fs.writeFileSync(path.join(OUT,'phase03-visual-matrix.json'), JSON.stringify(report,null,2));
    console.log(`PASS matrix 8/8. Screenshots and JSON: ${OUT}`);
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error('FAIL', error); process.exit(1); });
