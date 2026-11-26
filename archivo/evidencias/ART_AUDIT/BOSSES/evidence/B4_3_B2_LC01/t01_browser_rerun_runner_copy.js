/* BOSS-T01 browser QA: live loaders, stable IDs, state-cache hook and gameplay smoke.
 * Dependencies are intentionally external to the repository: playwright-core and
 * @sparticuz/chromium. The game is served over HTTP from repo root.
 * Usage: NODE_PATH=/path/to/node_modules node ART_TOOLS/qa/validate_boss_tanda_01.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium: playwright } = require('playwright-core');
const chromiumPackage = require('@sparticuz/chromium');
const chromium = chromiumPackage.default;

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'ART_AUDIT/BOSSES/evidence/B4_3_B2_LC01/t01_browser_rerun');
const GAME_URL = process.env.BOSS_QA_URL || 'http://127.0.0.1:4173/DEADBEAT_DISCO.ART.html';
const EXPECTED = {
  boss_01_djdoom: 'boss_art_boss_01_djdoom',
  boss_02_reinaespectro: 'boss_art_boss_02_reinaespectro',
  boss_03_reydisco: 'boss_art_boss_03_reydisco',
  boss_04_entidadvoraz: 'boss_art_boss_04_entidadvoraz',
  boss_05_fusioncosmica: 'boss_art_boss_05_fusioncosmica',
  boss_06_djabismo: 'boss_art_boss_06_djabismo',
  boss_07_altavoztitan: 'boss_art_boss_07_altavoztitan',
  boss_08_djcalavera: 'boss_art_boss_08_djcalavera',
  boss_09_nucleofinal: 'boss_art_boss_09_nucleofinal'
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const chromiumRoot = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..');
  await chromiumPackage.inflate(path.join(chromiumRoot, 'bin/al2023.tar.br'));
  chromiumPackage.setupLambdaEnvironment(path.join(require('os').tmpdir(), 'al2023', 'lib'));
  const browser = await playwright.launch({
    executablePath: await chromium.executablePath(),
    args: chromium.args,
    headless: true,
    defaultViewport: { width: 1440, height: 1000 }
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [], consoleErrors = [], failedResponses = [], ignoredResponses = [];
  page.on('pageerror', e => errors.push(String(e && e.stack || e)));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('response', res => {
    if (res.status() < 400) return;
    const row = { status: res.status(), url: res.url() };
    if (new URL(res.url()).pathname.startsWith('/cdn-cgi/')) ignoredResponses.push(row);
    else failedResponses.push(row);
  });

  const report = { url: GAME_URL, startedAt: new Date().toISOString(), checks: {}, errors, consoleErrors, failedResponses, ignoredResponses };
  try {
    const response = await page.goto(GAME_URL, { waitUntil: 'load', timeout: 180000 });
    report.httpStatus = response && response.status();
    await page.waitForFunction(() => {
      const s = window.DMO_ART_PACK && window.DMO_ART_PACK.state();
      return s && (s.status === 'applied' || s.status === 'applied-with-errors' || s.status === 'timeout');
    }, { timeout: 120000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'initial_screen.jpg'), type:'jpeg', quality:88, fullPage: false });

    const probe = await page.evaluate(() => {
      const W = window;
      const packState = W.DMO_ART_PACK && W.DMO_ART_PACK.state();
      const integrity = W.DMO_ART_PACK && W.DMO_ART_PACK.integrity();
      const ilt = W.DMO_ILT && W.DMO_ILT.audit();
      const manifest = W.DMO_ART_PACK && W.DMO_ART_PACK.manifest();
      const bossAssets = (manifest || []).filter(a => a.batch === 'BOSS-T01');
      const bossResults = bossAssets.filter(a => a.loader === 'ILT').map(a => {
        const image = W.DMO_ILT.images[a.id];
        return { bossId: a.bossId, key: a.id, ready: !!W.DMO_ILT.ready[a.id],
          loaded: !!(image && image.complete && image.naturalWidth),
          natural: image ? [image.naturalWidth, image.naturalHeight] : null,
          expected: [a.w, a.h], source: a.base + a.file };
      });
      const attack = bossAssets.find(a => a.cacheKey === 'boss_09_nucleofinal_attack1');
      const cachedAttack = attack && W.__HD_ASSETS && W.__HD_ASSETS.images && W.__HD_ASSETS.images[attack.cacheKey];
      const combatArt = W.DMO && W.DMO.combatArt;
      const nativeStateProbe = combatArt && typeof combatArt.bossState === 'function'
        ? ['boss_05_fusioncosmica','boss_06_djabismo','boss_07_altavoztitan','boss_08_djcalavera','boss_09_nucleofinal'].map(id => ({
            id, idle: combatArt.bossState({ artId: id, r: 34 }), hit: combatArt.bossState({ artId: id, r: 34, hitFlash: 0.2 })
          })) : null;
      return {
        packState, integrity, ilt, bossAssets: bossAssets.map(a => ({ id:a.id,bossId:a.bossId,loader:a.loader,file:a.file,cacheKey:a.cacheKey||null,expected:a.expected })),
        bossResults, bossMap: ilt && ilt.bossMap,
        residentKeys: ['boss_01_anden','boss_03_reydisco','boss_04_entidadvoraz'].map(k => ({key:k,ready:!!W.DMO_ILT.ready[k],natural:W.DMO_ILT.images[k]?[W.DMO_ILT.images[k].naturalWidth,W.DMO_ILT.images[k].naturalHeight]:null})),
        attackCache: attack ? { manifestFile:attack.file, hdData:W.__HD_DATA[attack.id], extra:!!(W.__HD_EXTRA&&W.__HD_EXTRA[attack.id]), cachePresent:!!cachedAttack, cacheComplete:!!(cachedAttack&&cachedAttack.complete), natural:cachedAttack?[cachedAttack.naturalWidth,cachedAttack.naturalHeight]:null } : null,
        nativeStateProbe,
        canvas: Array.from(document.querySelectorAll('canvas')).map(c => ({id:c.id,width:c.width,height:c.height,display:getComputedStyle(c).display})),
        gameApi: { combatArt:!!(W.DMO&&W.DMO.combatArt), artTest:!!W.DMO_ART_TEST, debug:!!(W.DMO&&W.DMO.debug), hub:!!W.DMO_HUB }
      };
    });
    report.probe = probe;

    const checks = {};
    checks.httpOk = report.httpStatus === 200;
    checks.packApplied = probe.packState && probe.packState.status === 'applied';
    checks.noPackErrors = !!(probe.packState && probe.packState.errors.length === 0);
    checks.integrityAllLive = !!(probe.integrity && probe.integrity.assets.every(a => a.live));
    checks.nineBossesLoaded = probe.bossResults.length === 9 && probe.bossResults.every(a => a.ready && a.loaded && JSON.stringify(a.natural) === JSON.stringify(a.expected));
    checks.stableBossMap = Object.entries(EXPECTED).every(([id,key]) => probe.bossMap && probe.bossMap[id] === key);
    checks.legacyResidentImagesPreserved = probe.residentKeys.length === 3 && probe.residentKeys.every(a => a.ready && a.natural && a.natural[0] > 0);
    checks.attackFrameCacheReplaced = !!(probe.attackCache && probe.attackCache.manifestFile === 'bosses/boss_09_nucleofinal_attack_01.png' && probe.attackCache.hdData === 'ART_ASSETS/bosses/tanda_01/' + probe.attackCache.manifestFile && probe.attackCache.extra && probe.attackCache.cachePresent && probe.attackCache.cacheComplete && JSON.stringify(probe.attackCache.natural) === JSON.stringify([160,106]));
    checks.hooksInstalled = !!(probe.ilt && probe.ilt.hooks && probe.ilt.hooks.boss && probe.ilt.bossMap);
    checks.noPageErrors = errors.length === 0;
    checks.noFailedResponses = failedResponses.length === 0;
    report.checks = checks;

    // Use the repository's QA navigation hook, then force a boss through the
    // existing boss constructor; no boss logic or production state is altered.
    await page.mouse.click(720, 500);
    await page.waitForTimeout(600);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    await page.keyboard.down('Escape');
    await page.waitForTimeout(2800);
    await page.keyboard.up('Escape');
    await page.waitForTimeout(700);
    await page.evaluate(() => window.DMO_ART_TEST.gotoCircle(0, true));
    await page.waitForTimeout(1800);
    const spawnedBoss = await page.evaluate(() => {
      const b = window.DMO_ART_TEST && window.DMO_ART_TEST.spawnBoss();
      if (b) window.__bossQATarget = b;
      return b ? { id:b.id, artId:b.artId, name:b.name, resident:b.resident,
        state:window.DMO.combatArt.bossState(b), x:b.x, y:b.y, r:b.r } : null;
    });
    await page.waitForTimeout(1200);
    const smoke = await page.evaluate(() => ({
      hub: window.DMO_HUB && window.DMO_HUB.state(),
      gameState: window.DMO && window.DMO.observe ? window.DMO.observe() : null,
      bossStats: window.DMO_ILT && window.DMO_ILT.audit().stats,
      bossStateApi: window.DMO && window.DMO.combatArt && window.DMO.combatArt.bossState
        ? ['boss_05_fusioncosmica','boss_06_djabismo','boss_07_altavoztitan','boss_08_djcalavera','boss_09_nucleofinal'].map(id => ({
            id, idle:window.DMO.combatArt.bossState({artId:id,r:34}),
            hit:window.DMO.combatArt.bossState({artId:id,r:34,hitFlash:0.2})
          })) : null
    }));
    report.spawnedBoss = spawnedBoss;
    report.smoke = smoke;
    report.checks.gameplayBossConstructed = !!(spawnedBoss && spawnedBoss.artId);
    report.checks.gameplayBossUsesIllustratedHook = !!(smoke.bossStats && smoke.bossStats.bossesDrawn > 0);
    report.checks.nativeStateApiAvailable = Array.isArray(smoke.bossStateApi) && smoke.bossStateApi.length === 5;

    // Freeze simulation, then exercise each real stable artId through the live
    // boss entity and the engine's own Of dispatch. Capture individual canvas
    // frames (not a collage) for scale/orientation review.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    const bossShots = path.join(OUT, 'boss_artid_dispatch');
    fs.mkdirSync(bossShots, { recursive: true });
    const visualSamples = [];
    async function sampleBoss(id, state) {
      const item = await page.evaluate(async ({ id, state }) => {
        const b = window.__bossQATarget;
        if (!b) return null;
        b.artId = id;
        b._ddaDead = false;
        b.hitFlash = state === 'hit' ? 0.2 : 0;
        b._ddaAttackT = state === 'attack' ? 0.5 : 0;
        b.phase = state === 'attack' ? 'sweep' : 'idle';
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const img = document.getElementById('game');
        const scaled = document.createElement('canvas'); scaled.width = 1200; scaled.height = Math.round(1200 * img.height / img.width);
        scaled.getContext('2d').drawImage(img,0,0,scaled.width,scaled.height);
        return { id, state:window.DMO.combatArt.bossState(b), dataUrl:scaled.toDataURL('image/jpeg',0.88),
          iltStats:window.DMO_ILT.audit().stats };
      }, { id, state });
      if (!item) return null;
      const name = id + '_' + state + '.jpg';
      fs.writeFileSync(path.join(bossShots, name), Buffer.from(item.dataUrl.split(',')[1], 'base64'));
      visualSamples.push({ id:item.id, state:item.state, file:'boss_artid_dispatch/' + name, iltStats:item.iltStats });
      return item;
    }
    for (const id of Object.keys(EXPECTED)) await sampleBoss(id, 'idle');
    const nativeStates = Object.keys(EXPECTED).filter(id => /^boss_0[5-9]_/.test(id));
    const fallbackStateSamples = [];
    for (const id of nativeStates) {
      const hit = await sampleBoss(id, 'hit');
      const attack = await sampleBoss(id, 'attack');
      fallbackStateSamples.push({ id, hitState:hit && hit.state, attackState:attack && attack.state });
    }
    const stateFrames = await page.evaluate(ids => ids.map(id => {
      const img = window.__HD_ASSETS && window.__HD_ASSETS.images;
      return { id, attack:!!(img&&img[id+'_attack']&&img[id+'_attack'].complete&&img[id+'_attack'].naturalWidth),
        attack1:!!(img&&img[id+'_attack1']&&img[id+'_attack1'].complete&&img[id+'_attack1'].naturalWidth),
        hit:!!(img&&img[id+'_hit']&&img[id+'_hit'].complete&&img[id+'_hit'].naturalWidth),
        death:!!(img&&img[id+'_death']&&img[id+'_death'].complete&&img[id+'_death'].naturalWidth) };
    }), nativeStates);
    report.visualSamples = visualSamples;
    report.nativeFallbackStateSamples = fallbackStateSamples;
    report.nativeStateFrameCache = stateFrames;
    report.checks.nineBossArtIdFramesCaptured = visualSamples.filter(x => x.state === 'idle').length === 9;
    report.checks.fiveNativeStateSetsLoaded = stateFrames.length === 5 && stateFrames.every(x => x.attack && x.attack1 && x.hit && x.death);
    report.checks.hitAndAttackStateDispatch = fallbackStateSamples.length === 5 && fallbackStateSamples.every(x => x.hitState === 'hit' && x.attackState === 'attack');
    try {
      const canvasJpeg = await page.evaluate(() => {
        const img=document.getElementById('game'), scaled=document.createElement('canvas');
        scaled.width=1200; scaled.height=Math.round(1200*img.height/img.width);
        scaled.getContext('2d').drawImage(img,0,0,scaled.width,scaled.height);
        return scaled.toDataURL('image/jpeg',0.88);
      });
      fs.writeFileSync(path.join(OUT, 'boss_gameplay_canvas.jpg'), Buffer.from(canvasJpeg.split(',')[1], 'base64'));
      report.canvasCapture = 'boss_gameplay_canvas.jpg';
    } catch (e) { report.canvasCaptureError = String(e && e.stack || e); }

    report.finishedAt = new Date().toISOString();
    report.pageErrorsAfterSmoke = errors.slice();
    fs.writeFileSync(path.join(OUT, 'qa_report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ checks: report.checks, errors: errors.length, failedResponses: failedResponses.length, output: OUT }, null, 2));
    if (Object.values(checks).some(v => v !== true)) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err && err.stack || err); process.exit(1); });
