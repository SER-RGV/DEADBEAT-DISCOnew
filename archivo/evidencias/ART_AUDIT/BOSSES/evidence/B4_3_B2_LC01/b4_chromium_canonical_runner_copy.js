/* B4 combat-behavior probe: real active HTML, existing boss scheduler, scripted player paths.
 * This is a deterministic simulation fixture, not a human playtest or fairness test.
 * It records selector state, scheduler emission counters and aggregate projectile counts
 * separately; aggregate projectile changes are not attributed to a boss attack unless
 * the scheduler's own patternShot71 also advances in that sample.
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium: playwright } = require('playwright-core');
const chromiumPackage = require('@sparticuz/chromium');
const chromium = chromiumPackage.default;
const root = process.cwd();
const outDir = path.join(root, 'ART_AUDIT/BOSSES/evidence/B4_3_B2_LC01/b4_chromium_canonical');
const url = process.env.DMO_B4_URL || 'http://127.0.0.1:4176/DEADBEAT_DISCO.ART.html';
const residents = [
  ['anden', 0], ['magneta', 1], ['bufe', 2], ['cajero', 3], ['pogo', 4],
  ['oficiante', 5], ['matarife', 6], ['imitador', 7], ['traidor', 8], ['nucleo', 9]
];
const styles = ['stationary', 'orbit-clockwise', 'retreat'];

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const pkg = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..');
  await chromiumPackage.inflate(path.join(pkg, 'bin/al2023.tar.br'));
  chromiumPackage.setupLambdaEnvironment(path.join(os.tmpdir(), 'al2023', 'lib'));
  const browser = await playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args, headless: true });
  const cases = [];
  const pageErrors = [], consoleErrors = [], localFailures = [], ignoredHostResponses = [];
  let currentResident = 'startup';
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => pageErrors.push({ resident: currentResident, error: String(e.stack || e) }));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push({ resident: currentResident, error: msg.text() }); });
  page.on('response', r => {
    if (r.status() < 400) return;
    const row = { resident: currentResident, status: r.status(), url: r.url() };
    if (new URL(r.url()).pathname.startsWith('/cdn-cgi/')) ignoredHostResponses.push(row);
    else localFailures.push(row);
  });

  try {
    for (let index = 0; index < residents.length; index++) {
      const [expectedResident, circle] = residents[index];
      const behavior = styles[index % styles.length];
      currentResident = expectedResident;
      const response = await page.goto(url, { waitUntil: 'load', timeout: 180000 });
      assert.equal(response.status(), 200, `${expectedResident}: active HTML must load`);
      await page.waitForFunction(() => window.DMO_ART_TEST && window.DMO && window.DMO.debug && window.DMO_BOSS_ANIMATION_FSM, { timeout: 60000 });
      await page.mouse.click(640, 450);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.keyboard.down('Escape');
      await page.waitForTimeout(2400);
      await page.keyboard.up('Escape');
      await page.waitForTimeout(250);
      await page.evaluate(c => window.DMO_ART_TEST.gotoCircle(c, true), circle);
      await page.keyboard.down('Escape');
      await page.waitForTimeout(1900);
      await page.keyboard.up('Escape');
      await page.waitForTimeout(250);

      const sample = await page.evaluate(({ expectedResident, behavior, seed }) => {
        // Fix Math.random for the scripted simulation (phase timers, sweep direction,
        // and incidental spawns); the normal run is not claimed to be a seeded playthrough.
        let rng = seed >>> 0;
        Math.random = () => {
          rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
          return rng / 4294967296;
        };
        const boss = window.DMO_ART_TEST.spawnBoss();
        if (!boss) return { error: 'spawnBoss returned null' };
        window.__b4ProbeBoss = boss;
        const identity = { resident: boss.resident, variant: boss.variant, final: !!boss.final,
          initialPhase: boss.phase, patterns: (boss.patterns72 || []).slice(),
          configuredAdds: boss.addsMax, configuredZones: boss.zonePattern || null };
        if (boss.resident !== expectedResident) return { error: 'unexpected resident selection', identity };

        window.DMO.debug.setInput({ fire: false });
        if (!window.DMO.debug.state().invuln) window.DMO.debug.invuln();
        window.DMO.debug.clearRound(); // isolate the real boss update from pre-boss wave enemies
        const start = { x: window.DMO.debug.state().px, y: window.DMO.debug.state().py };
        const trace = { selections: [], schedulerEmissionAttempts: [], phaseChanges: [], projectileCounts: [],
          addCounts: [], samples: 0, durationSeconds: 16, behavior };
        let previousPattern = boss.pattern71 || '';
        let previousShot = Number(boss.patternShot71) || 0;
        let previousPhase = boss.phase;
        let previousBullets = window.DMO.debug.state().balas;
        let angle = Math.atan2(start.y - boss.y, start.x - boss.x);
        const radius = 230;
        const dt = 0.05;
        const steps = Math.round(trace.durationSeconds / dt);
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

        for (let step = 0; step < steps; step++) {
          const time = (step + 1) * dt;
          if (behavior === 'orbit-clockwise') {
            angle += 0.025;
            window.DMO_ART_TEST.teleport(boss.x + Math.cos(angle) * radius, boss.y + Math.sin(angle) * radius);
          } else if (behavior === 'retreat') {
            const state = window.DMO.debug.state();
            const dx = state.px - boss.x, dy = state.py - boss.y;
            const distance = Math.hypot(dx, dy) || 1;
            window.DMO_ART_TEST.teleport(
              clamp(state.px + dx / distance * 8, 80, 2480),
              clamp(state.py + dy / distance * 8, 80, 1840)
            );
          }
          window.DMO.debug.tick(dt, 1);
          const state = window.DMO.debug.state();
          const pattern = boss.pattern71 || '';
          const shot = Number(boss.patternShot71) || 0;
          const executedPattern = pattern || previousPattern;
          if (pattern && pattern !== previousPattern) {
            trace.selections.push({ t: +time.toFixed(2), pattern,
              warningRemaining: +Number(boss.patternWarn71 || 0).toFixed(2),
              selectorIndex: Number(boss.patternIndex71) || 0 });
          }
          if (executedPattern && shot > previousShot) {
            trace.schedulerEmissionAttempts.push({ t: +time.toFixed(2), pattern: executedPattern,
              counterBefore: previousShot, counterAfter: shot,
              aggregateBulletCountBefore: previousBullets, aggregateBulletCountAfter: state.balas,
              aggregateBulletDelta: state.balas - previousBullets,
              addsSpawned: boss.addsSpawned,
              attribution: 'patternShot71 advances on scheduler emission attempts; aggregate hostile bullet count is not source-attributed and can also fall as older bullets expire' });
          }
          if (boss.phase !== previousPhase) trace.phaseChanges.push({ t: +time.toFixed(2), from: previousPhase, to: boss.phase });
          if (step % 40 === 0) trace.projectileCounts.push({ t: +time.toFixed(2), hostile: state.balas, activePatterns: !!pattern });
          if (step % 80 === 0) trace.addCounts.push({ t: +time.toFixed(2), spawned: boss.addsSpawned, alive: boss.addsAlive });
          previousPattern = pattern;
          previousShot = shot;
          previousPhase = boss.phase;
          previousBullets = state.balas;
          trace.samples++;
        }
        const animationEvents = window.DMO_BOSS_ANIMATION_FSM.drainEvents(boss);
        return { identity, behavior, start, end: { x: window.DMO.debug.state().px, y: window.DMO.debug.state().py },
          trace, animationEvents: animationEvents.map(e => ({ type: e.type, detail: e.detail || null })),
          state: window.DMO.debug.state(), reproducibility: { MathRandomSeed: seed, stepSeconds: dt, scriptedSteps: steps } };
      }, { expectedResident, behavior, seed: 0xB400 + index });

      assert.ok(!sample.error, `${expectedResident}: ${JSON.stringify(sample)}`);
      assert.ok(sample.trace.samples === 320, `${expectedResident}: exactly 320 scripted ticks`);
      assert.ok(sample.state.lives > 0 && sample.state.invuln, `${expectedResident}: invulnerability fixture must remain active through the full simulation`);
      assert.ok(sample.trace.selections.length > 0, `${expectedResident}: real scheduler should select at least one pattern`);
      cases.push(sample);
    }

    assert.equal(pageErrors.length, 0, JSON.stringify(pageErrors));
    assert.equal(localFailures.length, 0, JSON.stringify(localFailures));
    const report = {
      test: 'B4 active-HTML combat scheduler scenarios', status: 'PASS', url,
      source: 'DEADBEAT_DISCO.ART.html: su(), Tf()/boss update, Th(), wh(), vh(), Sh(), du(); browser renders actual active game runtime',
      modes: 'stationary, scripted clockwise orbit, scripted retreat; 10 real profile selections, styles rotated across the roster',
      executionDefinition: 'selected=pattern71 becomes active; scheduler-emission-attempt=patternShot71 advances; aggregate bullet deltas are reported separately and are not treated as boss-attributed hits',
      limitations: [
        'These are scripted browser simulations, not observed human matches, bot AI, fairness, fun, or readability tests.',
        'Scripted coordinates are teleport-injected at fixed steps, not physical keyboard movement.',
        'The game runtime and scheduler are real, but encounter conditions are a QA fixture: debug.clearRound removes ordinary wave enemies, boss adds remain scheduler-controlled, and debug.invuln protects the player. Seeded Math.random replaces normal randomness.',
        'No per-pattern persistent counter exists; patternShot71 is an attempt counter and aggregate projectile count is not source-attributed.'
      ],
      cases, pageErrors, consoleErrors, localFailures, ignoredHostResponses,
      humanPlaytest: false, fairnessVerified: false, allTenNaturalCyclesVerified: false
    };
    fs.writeFileSync(path.join(outDir, 'scenario_matrix.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status, cases: cases.map(c => ({ resident: c.identity.resident,
      variant: c.identity.variant, behavior: c.behavior, selected: c.trace.selections.map(s => s.pattern),
      schedulerEmissionAttempts: c.trace.schedulerEmissionAttempts.length, phases: c.trace.phaseChanges.map(p => p.to),
      hostileProjectilesEnd: c.state.balas })), pageErrors, localFailures, ignoredHostResponses }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
