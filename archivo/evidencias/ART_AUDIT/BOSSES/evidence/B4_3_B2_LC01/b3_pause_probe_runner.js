#!/usr/bin/env node
'use strict';

// Narrow diagnostic copy: reproduce B3's pause/menu setup, then test the same
// one-tick burst fixture before and after dismissing a visible pause overlay.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium: playwright } = require('playwright-core');
const chromiumPackage = require('@sparticuz/chromium');
const chromium = chromiumPackage.default;
const root = process.cwd();
const outDir = path.join(root, 'ART_AUDIT/BOSSES/evidence/B4_3_B2_LC01/b3_pause_probe');
const url = process.env.DMO_B3_URL || 'http://127.0.0.1:4176/DEADBEAT_DISCO.ART.html';

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const pkg = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..');
  await chromiumPackage.inflate(path.join(pkg, 'bin/al2023.tar.br'));
  chromiumPackage.setupLambdaEnvironment(path.join(os.tmpdir(), 'al2023', 'lib'));
  const browser = await playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const pageErrors = [], localFailures = [];
  page.on('pageerror', e => pageErrors.push(String(e.stack || e)));
  page.on('response', r => { if (r.status() >= 400 && !new URL(r.url()).pathname.startsWith('/cdn-cgi/')) localFailures.push({ status: r.status(), url: r.url() }); });
  try {
    const response = await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => window.DMO_ART_TEST && window.DMO_BOSS_ANIMATION_FSM && window.DMO.debug, { timeout: 60000 });
    await page.mouse.click(640, 450);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    await page.keyboard.down('Escape');
    await page.waitForTimeout(2800);
    await page.keyboard.up('Escape');
    await page.waitForTimeout(500);
    await page.evaluate(() => window.DMO_ART_TEST.gotoCircle(4, true));
    await page.keyboard.down('Escape');
    await page.waitForTimeout(1800);
    await page.keyboard.up('Escape');
    await page.waitForTimeout(300);

    const uiBefore = await page.evaluate(() => {
      const pause = document.querySelector('#pause-overlay');
      const overlay = document.querySelector('#overlay');
      return {
        pauseVisibleClass: !!pause?.classList.contains('visible'),
        pauseAriaHidden: pause?.getAttribute('aria-hidden') ?? null,
        pauseComputedDisplay: pause ? getComputedStyle(pause).display : null,
        pauseText: pause?.innerText ?? null,
        resumeButtonText: document.querySelector('#resume-btn')?.innerText ?? null,
        visibleBodyHasResume: document.body.innerText.toUpperCase().includes('REANUDAR'),
        menuOverlayHidden: !!overlay?.classList.contains('hidden'),
        activeElement: document.activeElement?.id || document.activeElement?.tagName || null,
        game: window.DMO.debug.state(),
        gameRead: window.DMO.read()
      };
    });
    const tickOnce = async () => page.evaluate(() => {
      const boss = window.__b3ProbeBoss || window.DMO_ART_TEST.spawnBoss();
      window.__b3ProbeBoss = boss;
      Object.assign(boss, { phase: 'ranged', phaseTimer: 100, sweep: null,
        patterns72: ['burst'], patternIndex71: 0, pattern71: '', patternWarn71: 0,
        patternShot71: 0, patternStep71: 0, patternExec71: 0, attackTimer: .001 });
      const phaseTimerBefore = boss.phaseTimer;
      window.DMO.debug.tick(.05, 1);
      const fsm = window.DMO.combatArt.bossAnimation(boss);
      return { resident: boss.resident, phase: boss.phase, phaseTimerBefore,
        phaseTimerAfter: boss.phaseTimer, pattern: boss.pattern71, warn: boss.patternWarn71,
        fsm: fsm.state, overlayHidden: document.querySelector('#overlay')?.classList.contains('hidden') || false,
        game: window.DMO.debug.state(), gameRead: window.DMO.read() };
    });
    const tickWhileCurrentUI = await tickOnce();

    // Match the pause-safe runner's conditional key path, and record whether the
    // condition existed so the result is diagnostic rather than inferred.
    const conditionalFired = await page.evaluate(() => document.body.innerText.toUpperCase().includes('REANUDAR'));
    if (conditionalFired) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }
    const uiAfterResumeInput = await page.evaluate(() => {
      const pause = document.querySelector('#pause-overlay');
      return { pauseVisibleClass: !!pause?.classList.contains('visible'),
        pauseAriaHidden: pause?.getAttribute('aria-hidden') ?? null,
        pauseComputedDisplay: pause ? getComputedStyle(pause).display : null,
        visibleBodyHasResume: document.body.innerText.toUpperCase().includes('REANUDAR'),
        game: window.DMO.debug.state(), gameRead: window.DMO.read() };
    });
    const tickAfterResumeInput = await tickOnce();
    const report = {
      test: 'B3 Chromium pause-state probe: canonical setup and single real-scheduler tick before/after conditional Escape',
      status: 'DIAGNOSTIC_COMPLETE', httpStatus: response.status(), url,
      uiBefore, tickWhileCurrentUI, conditionalResumeBranchFired: conditionalFired,
      uiAfterResumeInput, tickAfterResumeInput, pageErrors, localFailures,
      interpretation: 'Compare pause-overlay visibility, phaseTimer progression, and pattern selection across the two identical scheduler fixtures. This probe does not change production code or the canonical runner.'
    };
    fs.writeFileSync(path.join(outDir, 'pause_probe.json'), JSON.stringify(report, null, 2) + '\n');
    assert.equal(pageErrors.length, 0, JSON.stringify(pageErrors));
    assert.equal(localFailures.length, 0, JSON.stringify(localFailures));
    console.log(JSON.stringify({ status: report.status, pauseBefore: uiBefore.pauseVisibleClass,
      pausedFlagBefore: uiBefore.gameRead?.paused, resumeBranchFired: conditionalFired,
      patternBefore: tickWhileCurrentUI.pattern, phaseTimerBefore: tickWhileCurrentUI.phaseTimerBefore,
      phaseTimerAfter: tickWhileCurrentUI.phaseTimerAfter, pausedFlagAfter: uiAfterResumeInput.gameRead?.paused,
      pauseAfter: uiAfterResumeInput.pauseVisibleClass, patternAfter: tickAfterResumeInput.pattern,
      phaseTimerAfterResume: tickAfterResumeInput.phaseTimerAfter, pageErrors, localFailures }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
