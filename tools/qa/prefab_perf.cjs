// Frame pacing on the shipped scheduler under headless software GL. That is a
// lower bound, never a real-GPU figure, so the bars are relative: houses must
// cost comparable frames at rest, and a crowded room may not cost far more than
// the same room empty. Absolute 60 fps claims are out of scope on llvmpipe.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict");

const sample = (p, key, frames) =>
  p.evaluate(
    ({ key, frames }) =>
      new Promise((done) => {
        const d = [];
        let last = performance.now();
        function f(t) {
          d.push(t - last);
          last = t;
          if (d.length < frames) return requestAnimationFrame(f);
          d.sort((a, b) => a - b);
          const s = __DD_BRIDGE.getSurvey();
          done({
            key,
            house: DD_ROOM_DEBUG.prefab()?.template || "piloto",
            enemies: s ? s.enemies.length : 0,
            meanMs: +(d.reduce((a, b) => a + b) / d.length).toFixed(1),
            p95Ms: +d[Math.floor(d.length * 0.95)].toFixed(1),
          });
        }
        requestAnimationFrame(f);
      }),
    { key, frames },
  );

const race = (promise, ms, label) =>
  Promise.race([promise, new Promise((r) => setTimeout(() => r({ skipped: label }), ms))]);

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const p = await browser.newPage({ viewport: { width: 1280, height: 800 } }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto((process.argv[2] || "http://localhost:8000") + "/?roomDebug&roomSeed=0");
    await p.waitForFunction(() => window.DD_BOOT?.getState().state === "MAIN_MENU");
    await p.evaluate(() => {
      DD_HUB.enter();
      DD_HUB.exitToRun();
    });
    await p.waitForFunction(() => __DD_BRIDGE.isRunning());
    // Without this the runner dies inside the crowd and the room empties.
    await p.evaluate(() => {
      DMO.debug.invuln(true);
      DMO.debug.heal();
    });
    await p.waitForTimeout(900);
    const calm = [],
      crowded = [];
    for (const key of ["r1", "r3", "r4", "r9", "r10"]) {
      await race(p.evaluate((k) => DMO.explore.debug({ action: "goto", key: k }), key), 20000, key);
      await p.waitForFunction((k) => DMO.explore.state().key === k, key, { timeout: 8000 });
      await p.waitForTimeout(800);
      const row = await race(sample(p, key, 60), 45000, key);
      assert(!row.skipped, key + ": no frames in 45 s");
      calm.push(row);
      // Combat houses only, and not the boss room: the octagon holds its own
      // adds until the resident spawns, so a staged crowd there reads as zero.
      if (!["r1", "r3", "r4"].includes(key)) continue;
      await p.evaluate(() => {
        const s = __DD_BRIDGE.getSnapshot();
        for (let i = 0; i < 25; i++)
          DMO.debug.spawnEnemyAt(
            ["sprinter", "tank", "speaker"][i % 3],
            s.player.x + Math.cos((i / 25) * 6.28) * (90 + (i % 4) * 40),
            s.player.y + Math.sin((i / 25) * 6.28) * (90 + (i % 4) * 40),
            false,
            false,
          );
      });
      await p.waitForTimeout(500);
      const busy = await race(sample(p, key, 45), 45000, key);
      assert(!busy.skipped, key + ": crowded sample never settled");
      assert(busy.enemies >= 20, key + ": only " + busy.enemies + " hosts staged");
      crowded.push(busy);
    }
    console.table(calm.concat(crowded));
    assert.deepEqual(errors, []);
    const means = calm.map((r) => r.meanMs),
      worst = Math.max(...means),
      best = Math.min(...means);
    assert(
      worst / best <= 3,
      "one house costs " + (worst / best).toFixed(1) + "x the cheapest (" + worst + " vs " + best + " ms)",
    );
    for (const c of crowded) {
      const base = calm.find((r) => r.key === c.key);
      assert(
        c.meanMs <= base.meanMs * 3,
        c.key + ": 25 hosts cost " + (c.meanMs / base.meanMs).toFixed(1) + "x the empty room",
      );
    }
    console.log(
      "PASS 5 rooms at rest " +
        best +
        "-" +
        worst +
        " ms mean; with 25 hosts " +
        Math.min(...crowded.map((r) => r.meanMs)) +
        "-" +
        Math.max(...crowded.map((r) => r.meanMs)) +
        " ms (software GL; no real-GPU figure)",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
