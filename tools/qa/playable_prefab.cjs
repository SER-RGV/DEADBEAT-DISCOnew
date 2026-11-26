const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const p = await b.newPage(),
      errors = [];
    p.on("pageerror", (e) => {
      console.error(e.stack);
      errors.push(e.message);
    }); // Private probe in the disposable test page, never in either shipped HTML.
    await p.route("**/index.html?*", async (route) => {
      const r = await route.fetch();
      const src = await r.text(),
        marker = "window.__DD_BRIDGE = Object.freeze({";
      assert(src.includes(marker));
      await route.fulfill({
        response: r,
        body: src.replace(
          marker,
          `window.hitPrefabForTest=()=>{const p=tc.find(o=>o.prefabId==='seat01');while(p&&!p.broken)fc(p,'player');};` +
            marker,
        ),
      });
    });
    await p.goto(
      (process.argv[2] || "http://localhost:8000") +
        "/index.html?roomSeed=0&roomDebug",
    );
    await p.waitForFunction(
      () => window.DD_BOOT?.getState().state === "MAIN_MENU",
    );
    await p.evaluate(() => {
      DD_HUB.enter();
      DD_HUB.exitToRun();
    });
    await p.waitForFunction(() => __DD_BRIDGE.isRunning());
    let hit = false;
    for (const key of ["r1", "r2", "r1"]) {
      await p.evaluate((key) => {
        DMO.explore.debug({ action: "clear" });
        DMO.explore.debug({ action: "cross", to: key });
      }, key);
      await p.waitForFunction((key) => DMO.explore.state().key === key, key);
      // Art streams in per image; wait for the bake to settle instead of a count.
      await p.waitForFunction(
        () =>
          new Promise((done) => {
            const before = DD_PREFAB_WORLD.revision;
            setTimeout(() => done(DD_PREFAB_WORLD.revision === before), 350);
          }),
        null,
        { timeout: 8000 },
      );
      if (key === "r2")
        await p.waitForFunction(
          () => __DD_BRIDGE.getSurvey().enemies.length > 0,
        );
      const r = await p.evaluate(() => {
        const s = __DD_BRIDGE.getSurvey(),
          m = DD_ROOM_DEBUG.prefab(),
          r = __DD_BRIDGE.getSnapshot().roomRect,
          objects = DMO.explore.debug({ action: "snapshot" }).props;
        return {
          key: s.key,
          shape: s.poly.length,
          // One native polygon point per prefab wall edge; openings split spans.
          edges: new Set(m.walls.map((w) => w.segment)).size,
          notch: DMO.explore.contains(r.x + 20, r.y + 20, 4),
          doors: s.doors.every((d) =>
            m.openings.some(
              (o) =>
                o.to === d.to &&
                Math.hypot(o.origin.x + r.x - d.x, o.origin.y + r.y - d.y) <
                  0.01,
            ),
          ),
          fixtures: objects
            .filter((p) => p.prefabId)
            .map((p) => [p.prefabId, p.solid, p.destructible, p.broken]),
          count: m.placements.length,
          spawns: s.enemies.length,
        };
      });
      console.log(r);
      assert(
        !r.notch && r.shape === r.edges && r.doors && r.fixtures.length === r.count,
      );
      if (key === "r1") {
        if (hit)
          assert.deepEqual(
            r.fixtures.find((p) => p[0] === "seat01"),
            ["seat01", false, true, true],
          );
        else {
          await p.evaluate(() => hitPrefabForTest());
          hit = true;
        }
      }
      if (process.argv[3] && key === "r2")
        await p.screenshot({ path: process.argv[3] });
    }
    assert.deepEqual(errors, []);
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
