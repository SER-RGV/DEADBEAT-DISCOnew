const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.url());
    });
    await p.goto(
      (process.argv[2] || "http://localhost:8000") + "/previews/vestibulo/",
    );
    await p.waitForFunction(() =>
      document.querySelector("#status").textContent.startsWith("Vista cenital"),
    );
    assert.equal(await p.locator("#station option").count(), 18);
    if (process.argv[3]) await p.screenshot({ path: process.argv[3] });
    await p.check("#fronts");
    await p.selectOption("#station", "dj");
    await p.check("#hud");
    await p.check("#rave");
    await p.click("#grey");
    assert.match(await p.locator("#dimensions").innerText(), /1560 × 950/);
    await p.click("#final");
    assert.match(await p.locator("#dimensions").innerText(), /3120 × 1900/);
    await p.click("#walk");
    await p.keyboard.down("KeyW");
    await p.waitForTimeout(200);
    await p.keyboard.up("KeyW");
    assert.equal(
      await p.evaluate(
        () =>
          !!window.__DD_BRIDGE || !!window.DD_HUB || localStorage.length !== 0,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS preview: assets, 16 cameras, both scales, walking input, HUD/light and no game/save",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
