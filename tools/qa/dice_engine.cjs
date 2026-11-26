// Set DD_CHROMIUM to a Chromium executable; serve the repository over HTTP.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu", "--no-zygote"],
  });
  try {
    const p = await b.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.argv[2] || "http://localhost:8000", {
      waitUntil: "domcontentloaded",
    });
    await p.waitForFunction(() => window.__DD_BRIDGE && window.DD_DICE);
    await p.waitForFunction(
      () => window.DD_BOOT?.getState().state === "MAIN_MENU",
    );
    p.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text().slice(0, 300));
    });
    await p.evaluate(() => {
      DD_HUB.enter();
      DD_UI.openShop();
    });
    assert.equal(await p.locator("#dd-weapons-grid canvas").count(), 6);
    await p.locator('[data-w="6"]').click();
    await p.locator("#dd-shop-equip").click();
    await p.evaluate(() => {
      DD_UI.closeModals();
      DD_HUB.exitToRun();
    });
    await p.waitForFunction(() => __DD_BRIDGE.isRunning());
    await p.waitForFunction(() =>
      document.querySelector("#dd-hud-weapon-name")?.textContent.includes("D6"),
    );
    await p.evaluate(() => DMO.offerNow());
    await p.locator("#shot-choice-options button").first().click();
    assert.equal(
      await p.evaluate(() => Object.keys(DD_DICE.d.runes).length),
      1,
    );
    // Exercise the DOM pointer route, rather than just injecting native input flags.
    await p.dispatchEvent("#game", "pointerdown", {
      pointerType: "mouse",
      clientX: 700,
      clientY: 350,
    });
    await p.waitForFunction(() => DD_DICE.d.state === "CHARGING");
    await p.dispatchEvent("#game", "pointerup", { pointerType: "mouse" });
    await p.waitForFunction(() =>
      ["FLIGHT", "ROLLING"].includes(DD_DICE.d.state),
    );
    await p.keyboard.press("Space");
    const roll = await p.evaluate(() => DMO.playerAnim?.state);
    console.log("Animation after dodge input:", roll);
    await p.waitForFunction(() => DD_DICE.d.state === "READY");
    // Standard Gamepad API simulation (not a physical-controller test).
    await p.evaluate(() => {
      const pad = {
        id: "QA Xbox",
        mapping: "standard",
        connected: true,
        index: 0,
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          value: 0,
          pressed: false,
        })),
      };
      Object.defineProperty(navigator, "getGamepads", {
        configurable: true,
        value: () => [pad],
      });
      window.__qaPad = pad;
    });
    await p.evaluate(() => {
      __qaPad.axes = [0, 0, 0, -1];
      __qaPad.buttons[7] = { value: 1, pressed: true };
    });
    await p.waitForFunction(() => DD_DICE.d.state === "CHARGING");
    await p.evaluate(() => {
      __qaPad.buttons[7] = { value: 0, pressed: false };
    });
    await p.waitForFunction(() => DD_DICE.d.state === "FLIGHT");
    assert(
      Math.abs((await p.evaluate(() => DD_DICE.d.castAngle)) + Math.PI / 2) <
        0.01,
    );
    await p.waitForFunction(() => DD_DICE.d.state === "READY");
    await p.evaluate(() => {
      delete navigator.getGamepads;
      delete window.__qaPad;
    });
    await p.dispatchEvent("#game", "pointerdown", {
      pointerType: "mouse",
      clientX: 380,
      clientY: 230,
    });
    await p.waitForFunction(() => DD_DICE.d.state === "CHARGING");
    await p.dispatchEvent("#game", "pointercancel", { pointerType: "mouse" });
    assert.equal(await p.evaluate(() => DD_DICE.d.state), "READY");
    console.log(
      "PASS simulated RT / right-stick aim, release and return; pointer cancellation",
    );
    const reports = await p.evaluate(() => {
      const br = __DD_BRIDGE;
      br.startRun();
      DMO.debug.invuln();
      DMO.debug.holdSpawns(true);
      const rows = [];
      for (const id of [6, 4, 8, 10, 12, 20]) {
        DD_DICE.save.marks = 30;
        DD_DICE.equip(id);
        const player = br.getSnapshot().player;
        const spawned = DMO.debug.spawnEnemyAt(
          "dancer",
          player.x + 55,
          player.y,
          false,
          false,
        );
        const tick = (frames, inp) => br.testStep({ aim: 0, ...inp }, frames);
        tick(id === 6 ? 1 : 30, { fire: true });
        tick(1, {});
        const state = DD_DICE.d.state;
        const before = br.getSnapshot().player.y;
        tick(12, { down: true });
        const moved = br.getSnapshot().player.y !== before;
        tick(120, {});
        rows.push({
          id,
          spawned,
          state,
          moved,
          end: DD_DICE.d.state,
          hits: DD_DICE.d.hits?.size,
          face: DD_DICE.d.face,
          bullets: br.getActors().bullets.length,
        });
      }
      return rows;
    });
    console.table(reports);
    for (const row of reports) {
      assert.equal(row.end, "READY");
      assert.equal(row.state, "RELEASE");
      assert(row.moved);
      assert.equal(row.bullets, 0);
    }
    assert(reports.some((r) => r.hits));
    const bossCheck = await p.evaluate(() => {
      DMO.debug.boss();
      const br = __DD_BRIDGE;
      br.testStep({}, 150);
      const initial = br.getSnapshot().boss;
      if (!initial) throw Error("No boss spawned");
      const started = performance.now();
      let frames = 0;
      while (frames < 2400) {
        const { boss, player } = br.getSnapshot();
        if (!boss || boss.hp < initial.hp) break;
        const dx = boss.x - player.x,
          dy = boss.y - player.y,
          aim = Math.atan2(dy, dx),
          far = Math.hypot(dx, dy) > 140;
        const move = {
          right: far && dx > 20,
          left: far && dx < -20,
          up: far && dy < -20,
          down: far && dy > 20,
          aim,
        };
        br.testStep({ ...move, fire: true }, 6);
        br.testStep(move, 24);
        frames += 30;
      }
      return {
        initial: initial.hp,
        after: br.getSnapshot().boss?.hp || 0,
        frames,
        ms: Math.round(performance.now() - started),
      };
    });
    console.log(
      "Boss test (native simulation, one draw per batch):",
      bossCheck,
    );
    assert(bossCheck.after < bossCheck.initial);
    await p.reload({ waitUntil: "domcontentloaded" });
    assert.equal(await p.evaluate(() => DD_DICE.d.id), 20);
    assert.deepEqual(errors, []);
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
