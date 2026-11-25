const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const page = await b.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const url =
      (process.argv[2] || "http://localhost:8000") +
      "/index.html?roomDebug&roomSeed=43";
    // Enable only the compiled-out inspector in the response for this test page.
    await page.route("**/index.html*", async (route) => {
      const res = await route.fetch();
      await route.fulfill({
        response: res,
        body: (await res.text()).replace("false; /* DEV_BUILD */", "true;"),
      });
    });
    const rows=[];for(const id of [6,8,12]){await page.goto(url);
    await page.waitForFunction(
      () => window.DD_BOOT?.getState().state === "MAIN_MENU",
    );
    await page.evaluate(() => {
      DD_HUB.enter();
      DD_HUB.exitToRun();
    });
    await page.waitForFunction(() => __DD_BRIDGE.isRunning());
    rows.push(await page.evaluate(id => {
      const br=__DD_BRIDGE;
        DMO.debug.invuln();
        DMO.debug.holdSpawns(true);
        DD_DICE.save.marks = 40;
        DD_DICE.equip(id);
        for (let i = 1; i <= id; i++)
          DD_DICE.d.runes[i] =
            id === 8 ? "fuego" : id === 12 ? "veneno" : "electricidad";
        const events = new Map();
        let ms = performance.now();
        for (let turn = 0; turn < 10; turn++) {
          const p = br.getSnapshot().player;
          for (const dx of [45, 90, 145, 210])
            DMO.debug.spawnEnemyAt("tank", p.x + dx, p.y, false, false);
          br.testStep({ aim: 0, fire: true }, 55);
          br.testStep({ aim: 0 }, 110);
          for (const e of DD_COMBAT_FEEL.inspect().events)
            events.set(e.event, e);
        }
        const ev = [...events.values()],
          arcs = ev.filter((e) => e.die && e.depth > 0);
        if (arcs.some((e) => e.die !== id))
          throw Error("Evento residual de otro dado");
        return {
          id,
          cooldownDenied:ev.filter(e=>e.decision==='enfriamiento').length,
          chainsPerSimSecond:+(new Set(arcs.map(e=>e.chain)).size/(10*165/60)).toFixed(2),
          chains: new Set(arcs.map((e) => e.chain)).size,
          hops: arcs.length,
          maxDepth: Math.max(0, ...arcs.map((e) => e.depth)),
          casts: ev.filter((e) => e.kind === "lanzamiento").length,
          ms: Math.round(performance.now() - ms),
          bullets: br.getActors().bullets.length,
        };
    },id));}
    console.table(rows);
    assert(rows.some((r) => r.hops > 0));
    assert(rows.every((r) => r.casts>0 && r.maxDepth <= 3 && r.bullets === 0));
    assert.deepEqual(errors, []);
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
