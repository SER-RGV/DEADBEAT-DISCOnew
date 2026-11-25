// RAVE legibility fixture: force the club's saturated state in one room per
// house and keep the frame as evidence. The assertion only covers that RAVE is
// live with hosts present; the warning-vs-floor reading is judged on the frames.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    fs.mkdirSync("ART_EVIDENCE/PREFABS_RAVE", { recursive: true });
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
    const done = new Set();
    for (let floor = 0; floor < 10 && done.size < 5; floor++) {
      await p.evaluate((f) => DMO.explore.debug({ action: "goto", level: 1 + 11 * f }), floor);
      const nodes = await p.evaluate(() =>
        DD_ROOM_DEBUG.current().nodes.map((n) => [n.key, n.type]),
      );
      // Safe rooms never hold a wave, so a RAVE frame there would be fiction.
      for (const [key, type] of nodes) {
        if (key === "r0" || !["combat", "elite", "challenge", "boss"].includes(type)) continue;
        try {
          await p.evaluate((k) => DMO.explore.debug({ action: "goto", key: k }), key);
          await p.waitForFunction(
            (k) => DMO.explore.state().key === k && DD_ROOM_DEBUG.prefab()?.openings.length > 0,
            key,
            { timeout: 6000 },
          );
        } catch (e) {
          // A boss room can hold the transition; move on and try the next one.
          continue;
        }
        const house = await p.evaluate(() => DD_ROOM_DEBUG.prefab().template);
        if (done.has(house)) continue;
        // Same fixture the Hangar pilot uses: five genuine warnings on screen,
        // a laser and RAVE on. This is debug staging, not gameplay.
        await p.evaluate(() => {
          const s = __DD_BRIDGE.getSnapshot();
          for (const [i, type] of ["sprinter", "tank", "speaker", "sprinter", "tank"].entries()) {
            DMO.debug.spawnEnemyAt(type, s.player.x - 160 + i * 100, s.player.y + (i % 2 ? 80 : -70), false, false);
            const e = __DD_BRIDGE.getSnapshot().enemies.at(-1);
            if (e) { e.st = "windup"; e.stT = 0.22; }
          }
          DMO.debug.rave();
          DMO.debug.laser();
        });
        await p.waitForTimeout(500);
        let state = null;
        // The meter drains outside live combat; re-arm and shoot the frame on a peak.
        for (let i = 0; i < 8 && !state?.rave; i++) {
          await p.evaluate(() => DMO.debug.rave());
          await p.waitForTimeout(180);
          state = await p.evaluate(() => ({
            rave: __DD_BRIDGE.getSnapshot().rave,
            enemies: __DD_BRIDGE.getSnapshot().enemies.length,
          }));
        }
        if (!state?.rave || state.enemies < 5) continue;
        await p.screenshot({ path: "ART_EVIDENCE/PREFABS_RAVE/" + house + ".jpg" });
        done.add(house);
        console.log(house, "→", key, "rave", state.rave.toFixed(2), "hosts", state.enemies);
        if (done.size === 4) break;
      }
    }
    assert.equal(done.size, 4, "only " + done.size + " combat houses reached");
    assert.deepEqual(errors, []);
    console.log("PASS RAVE forced with 5 staged warnings in the 4 combat houses (frames in ART_EVIDENCE/PREFABS_RAVE)");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
