// Touch play on the new houses: real CDP touches on the mobile stick, one room
// per house. Asserts the stick moves the runner and that nothing throws; the
// layout itself is judged on the captured frames.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const ctx = await browser.newContext({
        viewport: { width: 390, height: 720 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      }),
      p = await ctx.newPage(),
      errors = [],
      cdp = await ctx.newCDPSession(p);
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto((process.argv[2] || "http://localhost:8000") + "/?roomDebug&roomSeed=0");
    await p.waitForFunction(() => window.DD_BOOT?.getState().state === "MAIN_MENU");
    await p.evaluate(() => {
      DD_HUB.enter();
      DD_HUB.exitToRun();
    });
    await p.waitForFunction(() => __DD_BRIDGE.isRunning());
    assert(
      await p.evaluate(() => document.documentElement.classList.contains("is-mobile")),
      "the page did not enter mobile mode",
    );
    assert(
      await p.evaluate(() => getComputedStyle(document.querySelector("#move-touch-zone")).display !== "none"),
      "the mobile move zone is hidden",
    );
    fs.mkdirSync("ART_EVIDENCE/PREFABS_TOUCH", { recursive: true });
    const done = new Set();
    for (let floor = 0; floor < 10 && done.size < 4; floor++) {
      await p.evaluate((f) => DMO.explore.debug({ action: "goto", level: 1 + 11 * f }), floor);
      const nodes = await p.evaluate(() =>
        DD_ROOM_DEBUG.current().nodes.map((n) => [n.key, n.type]),
      );
      for (const [key, type] of nodes) {
        if (key === "r0" || !["combat", "elite", "challenge", "boss"].includes(type)) continue;
        try {
          await p.evaluate((k) => DMO.explore.debug({ action: "goto", key: k }), key);
          await p.waitForFunction(
            (k) => DMO.explore.state().key === k && DD_ROOM_DEBUG.prefab()?.walls.length > 0,
            key,
            { timeout: 6000 },
          );
        } catch (e) {
          continue;
        }
        const house = await p.evaluate(() => DD_ROOM_DEBUG.prefab().template);
        if (done.has(house)) continue;
        const before = await p.evaluate(() => __DD_BRIDGE.getSnapshot().player);
        // Drag the left stick east with real touches.
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: 90, y: 620, id: 1 }],
        });
        for (let i = 1; i <= 10; i++) {
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x: 90 + i * 7, y: 620, id: 1 }],
          });
          await p.waitForTimeout(40);
        }
        await p.waitForTimeout(400);
        const after = await p.evaluate(() => __DD_BRIDGE.getSnapshot().player);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        assert(
          Math.abs(after.x - before.x) > 40,
          house + ": the stick did not move the runner",
        );
        // The runner must still be standing on the new shell, not pushed through it.
        const inside = await p.evaluate((pl) => DMO.explore.contains(pl.x, pl.y, 8), after);
        assert(inside, house + ": touch movement left the shell");
        await p.screenshot({ path: "ART_EVIDENCE/PREFABS_TOUCH/" + house + ".jpg" });
        done.add(house);
        console.log(house, "→", key, "moved", Math.round(after.x - before.x), "px");
        if (done.size === 4) break;
      }
    }
    assert.equal(done.size, 4, "only " + done.size + " houses reached over touch");
    assert.deepEqual(errors, []);
    console.log("PASS touch stick moves the runner inside the 4 combat houses at 390×720");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
