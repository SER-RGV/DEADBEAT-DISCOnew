// Smoke test on the real scheduler. No extra engine steps, QA spawns or fake hazards.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const url = process.argv[2] || "http://localhost:8000";
    await page.goto(url);
    await page.waitForFunction(
      () => window.DD_BOOT?.getState().state === "MAIN_MENU",
    );
    assert(
      await page.evaluate(
        () => !window.DD_ROOM_DEBUG && !DD_ROOM_GENERATION.createPilotPerf,
      ),
    );
    await page.goto(url + "/?roomDebug&roomSeed=0");
    await page.waitForFunction(
      () => window.DD_BOOT?.getState().state === "MAIN_MENU",
    );
    await page.evaluate(() => {
      DD_HUB.enter();
      DD_HUB.exitToRun();
    });
    await page.waitForFunction(
      () => DD_ROOM_DEBUG.pilot().active && !DD_CINE.isBlocking(),
    );
    await page.evaluate(() => {
      DD_ROOM_DEBUG.pilotColliders(true);
      let refused = false;
      try {
        DD_ROOM_DEBUG.perf.start();
      } catch {
        refused = true;
      }
      DD_ROOM_DEBUG.pilotColliders(false);
      if (!refused) throw Error("collider capture allowed");
      DD_ROOM_DEBUG.perf.start();
    });
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(1500);
    await page.keyboard.up("KeyD");
    await page.keyboard.down("KeyA");
    await page.waitForTimeout(1500);
    await page.keyboard.up("KeyA");
    await page.evaluate(() => DD_ROOM_DEBUG.pilotColliders(true));
    await page.waitForFunction(() => !DD_ROOM_DEBUG.perf.report().running);
    const r = await page.evaluate(() => DD_ROOM_DEBUG.perf.report());
    assert.equal(r.reason, "colliders enabled");
    assert(r.all.count > 5 && r.all.p95Ms > 0);
    console.log(JSON.stringify(r));
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
