// Reopen Chromium against the same disposable profile; do not touch a user save.
const { chromium } = require("playwright-core"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  assert = require("node:assert/strict");
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dd-refuge-profile-"));
  let c;
  try {
    for (let launch = 0; launch < 2; launch++) {
      c = await chromium.launchPersistentContext(dir, {
        executablePath: process.env.DD_CHROMIUM,
        args: ["--no-sandbox", "--disable-gpu"],
      });
      const p = await c.newPage();
      await p.goto(process.argv[2] || "http://localhost:8000");
      await p.waitForFunction(() => window.DD_REFUGE_RECORD);
      if (!launch)
        await p.evaluate(() => {
          localStorage.setItem("dd_save_v1", '{"v":1,"visits":5}');
          DD_REFUGE_RECORD.talk("armorer");
          DD_REFUGE_RECORD.repair();
          for (const id of ["groove", "sleeve", "plate"])
            DD_REFUGE_RECORD.discover(id);
          DD_REFUGE_RECORD.reveal();
        });
      else {
        const data = await p.evaluate(() => [
          DD_REFUGE_RECORD.repairs,
          DD_REFUGE_RECORD.imprint,
          DD_REFUGE_RECORD.snapshot().talks.armorer,
          localStorage.getItem("dd_save_v1"),
        ]);
        assert.deepEqual(data, [1, true, 1, '{"v":1,"visits":5}']);
      }
      await c.close();
      c = null;
    }
    console.log(
      "PASS two Chromium launches, retained restoration, event, relationship and unchanged legacy save",
    );
  } finally {
    if (c) await c.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
