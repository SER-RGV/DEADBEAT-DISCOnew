// Legibility with the RAVE track saturated. The scene flashes, so a live
// sample is noise; the game is paused first (renderNow keeps the frame), which
// makes three samples agree to within a tenth of a point. Same two floor
// patches calm and at 99%+, comparing edge energy and mean brightness.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");

const SAMPLE = `(() => {
  const c = document.querySelector("canvas").getContext("2d");
  const stat = (x, y, w, h) => {
    const d = c.getImageData(x, y, w, h).data, lum = new Float32Array(w * h);
    let s = 0;
    for (let i = 0, k = 0; i < d.length; i += 4, k++) {
      lum[k] = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      s += lum[k];
    }
    let g = 0;
    for (let y2 = 0; y2 < h; y2++)
      for (let x2 = 1; x2 < w; x2++) g += Math.abs(lum[y2 * w + x2] - lum[y2 * w + x2 - 1]);
    return { g: g / (h * (w - 1)), m: s / (w * h) };
  };
  const w = innerWidth, h = innerHeight;
  return {
    runner: stat(w / 2 - 50, h / 2 - 80, 100, 160),
    floorA: stat(w / 2 + 200, h / 2 - 40, 110, 110),
    floorB: stat(w / 2 - 310, h / 2 - 40, 110, 110),
    meter: +document.querySelector("#dmo-hud-rave")?.getAttribute("aria-valuenow") || 0,
  };
})()`;

// Three paused samples, averaged; the spread is asserted so a moving frame
// cannot silently pass as a still one.
async function still(p) {
  const shots = [];
  for (let i = 0; i < 3; i++) {
    await p.evaluate(() => __DD_BRIDGE.renderNow());
    shots.push(await p.evaluate(SAMPLE));
  }
  for (const k of ["floorA", "floorB"]) {
    const spread = Math.max(...shots.map((s) => s[k].g)) - Math.min(...shots.map((s) => s[k].g));
    assert(spread < 0.6, "the paused frame is still moving (" + k + " spread " + spread.toFixed(2) + ")");
  }
  const avg = (k, f) => shots.reduce((a, s) => a + s[k][f], 0) / shots.length;
  return {
    floorA: { g: avg("floorA", "g"), m: avg("floorA", "m") },
    floorB: { g: avg("floorB", "g"), m: avg("floorB", "m") },
    runner: { g: avg("runner", "g"), m: avg("runner", "m") },
    meter: shots[2].meter,
  };
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    fs.mkdirSync("archivo/evidencias/ART_EVIDENCE/PREFABS_RAVE", { recursive: true });
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
    for (const [key, house] of [
      ["r1", "pasillo-servicio"],
      ["r3", "palco-profundo"],
      ["r4", "nave-quebrada"],
      ["r10", "arena-octogono"],
    ]) {
      await p.evaluate(() => DMO.debug.invuln(true));
      await p.evaluate((k) => DMO.explore.debug({ action: "goto", key: k }), key);
      await p.waitForFunction(
        (k) => DMO.explore.state().key === k && DD_ROOM_DEBUG.prefab()?.walls.length > 0,
        key,
        { timeout: 8000 },
      );
      await p.waitForTimeout(900);
      await p.evaluate(() => {
        const s = __DD_BRIDGE.getSnapshot();
        for (const [i, t] of ["sprinter", "tank", "speaker", "sprinter", "tank"].entries())
          DMO.debug.spawnEnemyAt(t, s.player.x - 160 + i * 100, s.player.y + (i % 2 ? 80 : -70), false, false);
      });
      await p.waitForTimeout(400);
      await p.evaluate(() => __DD_BRIDGE.setPaused(true));
      const calm = await still(p);
      await p.evaluate(() => __DD_BRIDGE.setPaused(false));
      // The meter decays outside live combat, so re-arm until it is pinned.
      let meter = 0;
      for (let i = 0; i < 40 && meter < 99; i++) {
        meter = await p.evaluate(() => {
          DMO.debug.rave();
          return +document.querySelector("#dmo-hud-rave").getAttribute("aria-valuenow");
        });
        await p.waitForTimeout(80);
      }
      await p.evaluate(() => __DD_BRIDGE.setPaused(true));
      const saturated = await still(p);
      await p.screenshot({ path: "archivo/evidencias/ART_EVIDENCE/PREFABS_RAVE/" + house + "-saturado.jpg" });
      await p.evaluate(() => __DD_BRIDGE.setPaused(false));
      assert(saturated.meter >= 97, house + ": the track only reached " + saturated.meter + "%");
      // The runner must carry more edges than bare floor; otherwise the sampled
      // patch is not where the camera keeps the player and the numbers mean nothing.
      assert(
        calm.runner.g > calm.floorA.g,
        house + ": runner patch has no more detail than the floor",
      );
      const keepA = saturated.floorA.g / calm.floorA.g,
        keepB = saturated.floorB.g / calm.floorB.g,
        shift = Math.max(
          Math.abs(saturated.floorA.m - calm.floorA.m),
          Math.abs(saturated.floorB.m - calm.floorB.m),
        );
      assert(
        Math.min(keepA, keepB) >= 0.65,
        house + ": floor detail fell to " + (Math.min(keepA, keepB) * 100).toFixed(0) + "%",
      );
      assert(shift <= 8, house + ": the floor brightness moved " + shift.toFixed(1) + "/255");
      console.log(
        house.padEnd(16),
        "track " + saturated.meter + "%",
        "edges " + calm.floorA.g.toFixed(2) + "→" + saturated.floorA.g.toFixed(2),
        "(" + (keepA * 100).toFixed(0) + "% / " + (keepB * 100).toFixed(0) + "%)",
        "brightness " + (-shift).toFixed(1) + "/255",
      );
    }
    assert.deepEqual(errors, []);
    console.log("PASS the floor keeps its detail and brightness with the RAVE track at 99%+ in the 4 combat houses");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
