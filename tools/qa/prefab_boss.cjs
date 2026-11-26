// Boss rooms live in their own house (the octagon). Each circle gets a fresh
// page so one fight cannot contaminate the next: spawn the real boss, kill it
// through the bridge, and require the engine to book the room as cleared.
// Wave pacing, adds and phase behaviour are not simulated beyond the spawn.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const URL = process.argv[2] || "http://localhost:8000";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    fs.mkdirSync("ART_EVIDENCE/PREFABS_BOSS", { recursive: true });
    const seen = [];
    for (const floor of [0, 4, 9]) {
      const p = await browser.newPage({ viewport: { width: 1280, height: 800 } }),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(URL + "/?roomDebug&roomSeed=0");
      await p.waitForFunction(() => window.DD_BOOT?.getState().state === "MAIN_MENU");
      await p.evaluate(() => {
        DD_HUB.enter();
        DD_HUB.exitToRun();
      });
      await p.waitForFunction(() => __DD_BRIDGE.isRunning());
      await p.evaluate((f) => DMO.explore.debug({ action: "goto", level: 1 + 11 * f }), floor);
      const node = await p.evaluate(() => {
        const n = DD_ROOM_DEBUG.current().nodes.find((n) => n.type === "boss");
        return n && { key: n.key, template: n.prefab.template };
      });
      assert(node, "circle " + (floor + 1) + " has no boss room");
      assert.equal(node.template, "arena-octogono", "the boss room is not in the octagon house");
      await p.evaluate((k) => DMO.explore.debug({ action: "goto", key: k }), node.key);
      await p.waitForFunction(
        (k) => DMO.explore.state().key === k && DD_ROOM_DEBUG.prefab()?.walls.length > 0,
        node.key,
        { timeout: 8000 },
      );
      await p.evaluate(() => {
        DMO.debug.invuln(true);
        DMO.debug.boss();
      });
      try {
        await p.waitForFunction(() => __DD_BRIDGE.getBoss()?.active, null, { timeout: 20000 });
      } catch (e) {
        throw Error("circle " + (floor + 1) + " (" + node.key + "): boss did not activate");
      }
      const boss = await p.evaluate(() => __DD_BRIDGE.getBoss());
      assert(boss.maxHp > 0 && boss.name, "boss has no identity");
      // The boss must stand on the shell, not inside its authored furniture.
      assert(
        await p.evaluate((b) => DMO.explore.contains(b.x, b.y, b.r), boss),
        "boss spawned outside the octagon",
      );
      await p.screenshot({
        path: "ART_EVIDENCE/PREFABS_BOSS/circulo-" + (floor + 1) + ".jpg",
      });
      await p.evaluate(() => {
        DMO.debug.setBossHp(1);
        __DD_BRIDGE.killBoss();
      });
      try {
        await p.waitForFunction(() => !__DD_BRIDGE.getBoss()?.active, null, { timeout: 15000 });
      } catch (e) {
        throw Error("circle " + (floor + 1) + " (" + node.key + "): boss did not die");
      }
      if (floor < 9) {
        // Ordinary circles book the boss room once it falls.
        try {
          await p.waitForFunction(() => DMO.explore.state().completedRooms.length > 0, null, {
            timeout: 15000,
          });
        } catch (e) {
          throw Error("circle " + (floor + 1) + " (" + node.key + "): room never booked as cleared");
        }
      } else {
        // The núcleo closes the run instead of booking a room; the ending
        // sequence itself is out of scope here and is not asserted.
        assert.equal(boss.final, true, "the last boss is not flagged as final");
      }
      seen.push(boss.name + " (" + boss.maxHp + " hp)");
      assert.deepEqual(errors, []);
      await p.close();
    }
    console.log(
      "PASS boss fights in the octagon on circles 1, 5 and 10: " +
        seen.join(", ") +
        " (ending sequence not asserted)",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
