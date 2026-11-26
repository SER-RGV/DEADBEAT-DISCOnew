// Playable build contract, not a second generator fixture.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const base = process.argv[2] || "http://localhost:8000",
      p = await browser.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base);
    assert(
      await p.evaluate(
        () =>
          !window.DD_ROOM_DEBUG &&
          !DD_ROOM_GENERATION.visualize &&
          !DD_ROOM_GENERATION.compileArchitecture,
      ),
    );
    for (const seed of [0, 4294967295]) {
      await p.goto(base + "/?roomDebug&roomSeed=" + seed);
      await p.waitForFunction(
        () => window.DD_BOOT?.getState().state === "MAIN_MENU",
      );
      await p.evaluate(() => {
        DD_HUB.enter();
        DD_HUB.exitToRun();
      });
      await p.waitForFunction(() => __DD_BRIDGE.isRunning());
      const actual = await p.evaluate(() => {
        const d = DD_ROOM_DEBUG,
          plan = d.current(),
          n = d.inspect(),
          survey = __DD_BRIDGE.getSurvey();
        const arch = d.architecture();
        if (arch.openings.length !== survey.doors.length)
          throw Error("invented or missing opening");
        for (const g of arch.openings) {
          const door = survey.doors.find((v) => v.to === g.to),
            [a, b] = g.threshold;
          if (
            !door ||
            Math.hypot(door.x - g.origin.x, door.y - g.origin.y) > 1e-6 ||
            Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - 170) > 1e-6
          )
            throw Error("misaligned native portal");
          const spans = arch.walls.filter((w) => w.edge === g.edge),
            same = (p, q) => Math.hypot(p.x - q.x, p.y - q.y) < 1e-6;
          if (
            !spans.some((w) => same(w.face[1], a)) ||
            !spans.some((w) => same(w.face[0], b)) ||
            !same(g.jambs[0][1], a) ||
            !same(g.jambs[1][0], b)
          )
            throw Error("wall or jamb disconnected");
          if (
            !DMO.explore.contains(g.landing.x, g.landing.y, 18) ||
            DMO.layout.pointBlocked(g.landing.x, g.landing.y, 18)
          )
            throw Error("landing blocked");
        }
        const prefab=d.prefab();
        if(prefab.key!==n.room.key || prefab.openings.length!==survey.doors.length || !prefab.decks[0]?.treads.length)throw Error('prefab not assembled');
        d.show();
        const dialog = document.querySelector("dialog[open]");
        if (!dialog?.querySelector("canvas"))
          throw Error("debug atlas missing");
        dialog.close();
        const replay = d.generate(plan.seed, plan.floor);
        return {
          diff: plan.nodes.flatMap((n, i) =>
            Object.keys(n)
              .filter(
                (k) =>
                  JSON.stringify(n[k]) !== JSON.stringify(replay.nodes[i][k]),
              )
              .map((k) => n.key + ":" + k),
          ),
          architecture: n.room.geometry.base,
          wallSpans: arch.walls.length,
          seed: plan.seed,
          saved: JSON.parse(localStorage.getItem("dmo_floor_v32")).seed,
          repro: JSON.stringify(plan.nodes) === JSON.stringify(replay.nodes),
          props: survey.props.length,
          doors: n.doors.length,
          links: n.room.links.length,
          valid: DMO.layout.validate().valid,
          spawns: n.spawns.every(
            (p) =>
              DMO.explore.contains(p.x, p.y, 30) &&
              !DMO.layout.pointBlocked(p.x, p.y, 30),
          ),
        };
      });
      assert.equal(actual.seed, seed);
      assert.equal(actual.saved, seed);
      assert(actual.repro);
      assert.equal(actual.doors, actual.links);
      assert(actual.props > 0);
      assert(actual.valid);
      assert(actual.spawns);
      await p.waitForFunction(
        () => __DD_BRIDGE.getSurvey()?.enemies.length > 0,
      );
      console.log("Passed native floor", actual);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
