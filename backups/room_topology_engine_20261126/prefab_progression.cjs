// Descent through the real floor gate: every mandatory room is cleared so the
// lift opens, then `kg()` is invoked (the same function the lift door calls from
// `wg`). Verify the prefab shell on arrival, three times, then a reload.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict");
const URL = process.argv[2] || "http://localhost:8000";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const p = await browser.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    if (process.env.DD_POPULATION_GUARDS === "1")
      await p.addInitScript(() => { window.__DD_ROOM_SPAWN_GUARDS = true; });
    await p.goto(URL + "/?roomDebug&roomSeed=0");
    await p.waitForFunction(() => window.DD_BOOT?.getState().state === "MAIN_MENU");
    if (process.env.DD_POPULATION_GUARDS === "1")
      assert.equal(await p.evaluate(() => DD_ROOM_GENERATION.version), "2.1.0");
    const boot = async () => {
      await p.evaluate(() => {
        DD_HUB.enter();
        DD_HUB.exitToRun();
      });
      await p.waitForFunction(() => __DD_BRIDGE.isRunning());
    };
    await boot();
    const templates = [];
    // Full descent: every circle down to the núcleo.
    for (let floor = 1; floor <= 9; floor++) {
      const lift = await p.evaluate(() => {
        const n = DD_ROOM_DEBUG.current().nodes.find((n) => n.local === 10 && !n.shop);
        return n && n.key;
      });
      assert(lift, "floor " + floor + " has no lift room");
      await p.evaluate((key) => DMO.explore.debug({ action: "goto", key }), lift);
      await p.waitForFunction(
        (key) => DMO.explore.state().key === key && DD_ROOM_DEBUG.prefab()?.openings.length > 0,
        lift,
      );
      // The lift door must sit on the prefab socket, with a clear landing.
      const gate = await p.evaluate(() => {
        const rect = __DD_BRIDGE.getSnapshot().roomRect,
          o = DD_ROOM_DEBUG.prefab().openings.find((o) => o.lift),
          d = __DD_BRIDGE.getSurvey().doors.find((d) => d.lift);
        if (!o || !d) return null;
        const landing = { x: rect.x + o.landing.x, y: rect.y + o.landing.y };
        return {
          to: d.to,
          socket: o.side,
          aligned: Math.hypot(rect.x + o.origin.x - d.x, rect.y + o.origin.y - d.y) < 0.01,
          landingFree:
            DMO.explore.contains(landing.x, landing.y, 18) &&
            !DMO.layout.pointBlocked(landing.x, landing.y, 18),
        };
      });
      assert(gate, "no lift gate on floor " + floor);
      assert.equal(gate.to, "floor" + floor, "lift must point at the next circle");
      assert(gate.socket, "prefab has no lift socket");
      assert(gate.aligned, "lift door off its prefab opening");
      assert(gate.landingFree, "lift landing blocked on floor " + floor);
      // Clear the main route; the lift unlocks exactly as in normal play.
      for (const [key, type, shop] of await p.evaluate(() =>
        DD_ROOM_DEBUG.current().nodes.map((n) => [n.key, n.type, n.shop]),
      )) {
        if (shop || ["secret", "supersecret"].includes(type)) continue;
        await p.evaluate((k) => DMO.explore.debug({ action: "goto", key: k }), key);
        await p.waitForTimeout(280);
        await p.evaluate(() => DMO.explore.debug({ action: "clear" }));
        await p.waitForTimeout(180);
      }
      await p.evaluate((key) => DMO.explore.debug({ action: "goto", key }), lift);
      await p.waitForFunction(
        (key) => DMO.explore.state().key === key && __DD_BRIDGE.getSurvey().doors.some((d) => d.lift && d.open),
        lift,
        { timeout: 8000 },
      );
      await p.evaluate(() => DMO.explore.debug({ action: "nextFloor" }));
      // The núcleo is a dead end: it has walls and decks but no openings.
      await p.waitForFunction(
        (f) => DMO.explore.state().floor === f + 1 && DD_ROOM_DEBUG.prefab()?.walls.length > 0,
        floor,
        { timeout: 15000 },
      );
      templates.push(await p.evaluate(() => DD_ROOM_DEBUG.prefab().template));
      const roomy = await p.evaluate(() =>
        DD_ROOM_DEBUG.current().nodes.every((n) => n.prefab && n.prefab.template),
      );
      assert(roomy, "floor " + (floor + 1) + " has a node without a prefab");
    }
    assert.deepEqual(errors, []);
    // The circle you are on is not part of the save; the generated floors are.
    // Re-entering the same circles after a reload must rebuild identical art.
    const before = await p.evaluate(() =>
      Array.from({ length: 10 }, (_, i) => i).map((f) => {
        DMO.explore.debug({ action: "goto", level: 1 + 11 * f });
        return DD_ROOM_DEBUG.current().nodes.map((n) => n.key + ":" + n.prefab.template);
      }),
    );
    const seedSaved = await p.evaluate(() => JSON.parse(localStorage.getItem("dmo_floor_v32")).seed);
    await p.reload();
    await p.waitForFunction(() => window.DD_BOOT?.getState().state === "MAIN_MENU");
    await boot();
    const after = await p.evaluate(() =>
      Array.from({ length: 10 }, (_, i) => i).map((f) => {
        DMO.explore.debug({ action: "goto", level: 1 + 11 * f });
        return DD_ROOM_DEBUG.current().nodes.map((n) => n.key + ":" + n.prefab.template);
      }),
    );
    const seedAfter = await p.evaluate(() => JSON.parse(localStorage.getItem("dmo_floor_v32")).seed);
    assert.equal(seedAfter, seedSaved, "saved floor seed changed across reload");
    assert.deepEqual(after, before, "rebuilt floors lost their prefab assignment");
    console.log(
      "PASS 9 descents to the núcleo (" + templates.join(" → ") + "), identical rebuild of 10 floors after reload",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
