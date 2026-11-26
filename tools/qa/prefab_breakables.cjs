// Destructible furniture inside the new houses. The catalogue marks tables and
// sofas breakable, so the runtime must register them, stop colliding once they
// fall, and repaint the broken plate. The repaint is checked on pixels, not
// trusted from the flag.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");

// Freeze the frame, keep the pixels in the page, then compare after the break.
// A fixed patch assumes the camera follows the runner, which fails in rooms
// smaller than the viewport (the camarote), so the whole canvas is compared.
const FREEZE = `(() => { __DD_BRIDGE.renderNow(); const c = document.querySelector("canvas").getContext("2d");
  window.__QA_PIX = c.getImageData(0, 0, c.canvas.width, c.canvas.height).data.slice(); return true; })()`;
const DIFF = `(() => { const c = document.querySelector("canvas").getContext("2d");
  const W = c.canvas.width, H = c.canvas.height;
  const d = c.getImageData(0, 0, W, H).data, b = window.__QA_PIX;
  let hit = 0, sum = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2],
      k = 0.2126 * b[i] + 0.7152 * b[i + 1] + 0.0722 * b[i + 2];
    const dd = Math.abs(l - k);
    sum += dd;
    if (dd > 8) {
      hit++;
      const px = (i / 4) % W, py = Math.floor(i / 4 / W);
      if (px < x0) x0 = px;
      if (px > x1) x1 = px;
      if (py < y0) y0 = py;
      if (py > y1) y1 = py;
    }
  }
  // A subtle plate (the sofa keeps its frame) changes few pixels but over a
  // prop-sized box; noise would smear across the whole canvas instead.
  return { changed: hit, mean: sum / (d.length / 4), bw: x1 - x0, bh: y1 - y0,
    share: hit / (W * H) }; })()`;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    fs.mkdirSync("archivo/evidencias/ART_EVIDENCE/PREFABS_BREAK", { recursive: true });
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
    await p.evaluate(() => {
      DMO.debug.invuln(true);
      DMO.debug.heal();
    });
    const done = [];
    for (const key of ["r1", "r4", "r9"]) {
      await p.evaluate((k) => DMO.explore.debug({ action: "goto", key: k }), key);
      await p.waitForFunction(
        (k) => DMO.explore.state().key === k && DD_ROOM_DEBUG.prefab()?.walls.length > 0,
        key,
        { timeout: 8000 },
      );
      await p.waitForTimeout(900);
      const hp = await p.evaluate(() => DMO.debug.propsHp());
      assert(hp.length, key + ": the new house registers no destructible furniture");
      const target = hp[0];
      assert(target.maxHp > 0, key + ": " + target.name + " has no health");
      // Stand just below the piece so the camera keeps it on screen.
      await p.evaluate(
        ({ x, y }) => DMO.debug.teleport(x, y + 90),
        { x: target.x, y: target.y },
      );
      await p.waitForTimeout(700);
      await p.screenshot({ path: "archivo/evidencias/ART_EVIDENCE/PREFABS_BREAK/" + key + "-intacto.jpg" });
      await p.evaluate(() => __DD_BRIDGE.setPaused(true));
      await p.evaluate(FREEZE);
      await p.evaluate(() => __DD_BRIDGE.setPaused(false));
      const wasSolid = await p.evaluate(
          (n) => __DD_BRIDGE.getProps().find((q) => q.name === n)?.solid,
          target.name,
        );
      assert.equal(wasSolid, true, key + ": " + target.name + " was not solid before breaking");
      const broke = await p.evaluate(
        ({ x, y }) => DMO.debug.breakPropNear(x, y),
        { x: target.x, y: target.y },
      );
      assert.equal(broke, true, key + ": breakPropNear refused " + target.name);
      await p.waitForTimeout(700);
      await p.evaluate(() => __DD_BRIDGE.setPaused(true));
      const diff = await p.evaluate(DIFF);
      const now = await p.evaluate(
          (n) => ({
            hp: DMO.debug.propsHp().find((q) => q.name === n),
            solid: __DD_BRIDGE.getProps().find((q) => q.name === n)?.solid,
          }),
          target.name,
        );
      assert(now.hp?.broken, key + ": " + target.name + " did not stay broken");
      assert.equal(now.solid, false, key + ": " + target.name + " still blocks after breaking");
      assert(diff.changed > 150, key + ": only " + diff.changed + " pixels changed when " + target.name + " broke");
      assert(diff.bw >= 30 && diff.bh >= 20, key + ": the change is not prop sized (" + diff.bw + "x" + diff.bh + ")");
      assert(diff.share < 0.2, key + ": " + (diff.share * 100).toFixed(0) + "% of the frame changed, that is not one piece");
      await p.screenshot({ path: "archivo/evidencias/ART_EVIDENCE/PREFABS_BREAK/" + key + "-roto.jpg" });
      await p.evaluate(() => __DD_BRIDGE.setPaused(false));
      done.push(key + " " + target.name + " (" + diff.changed + " px in " + diff.bw + "x" + diff.bh + ")");
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS destructible furniture breaks and stops blocking in the new houses: " + done.join(", "),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
