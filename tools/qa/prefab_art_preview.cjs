const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 850 } }),
      err = [];
    p.on("pageerror", (e) => err.push(e.message));
    await p.goto(
      (process.argv[2] || "http://localhost:8000") + "/previews/prefabs/",
    );
    await p.waitForFunction(() =>
      document.querySelector("#status").textContent.includes("7 peldaños"),
    );
    const pixels = () => p.locator("canvas").evaluate((c) => c.toDataURL());
    const intact = await pixels();
    await p.check("#broken");
    assert.notEqual(await pixels(), intact);
    await p.uncheck("#broken");
    assert.equal(await pixels(), intact);
    await p.check("#guides");
    if (process.argv[3]) await p.screenshot({ path: process.argv[3] });
    await p.click("#r2");
    assert.match(await p.locator("#status").innerText(), /5 peldaños/);
    await p.selectOption("#focus", "table01");
    await p.check("#broken");
    await p.selectOption("#focus", "deck");
    await p.check("#probe");
    await p.locator("#phase").fill("100");
    assert.match(await p.locator("#height").innerText(), /cota \+30 u/);
    await p.click("#r1");
    await p.selectOption("#focus", "deck");
    await p.click("#play");
    await p.waitForFunction(() => +document.querySelector("#phase").value > 2);
    await p.click("#play");
    await p.locator("#phase").fill("100");
    assert.match(await p.locator("#height").innerText(), /cota \+42 u/);
    if (process.argv[4]) await p.screenshot({ path: process.argv[4] });
    assert.equal(await p.evaluate(() => localStorage.length), 0);
    assert.deepEqual(err, []);
    console.log(
      "PASS native exports composed, pixel-changing reversible break, r2 deck/table focus, clean storage",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
