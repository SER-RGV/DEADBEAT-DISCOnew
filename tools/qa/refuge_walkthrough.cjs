// Discrete route planning for test inputs only. No coordinate setter or travel command.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const base = process.argv[2] || "http://localhost:8000",
      out = process.argv[3];
    if (out) fs.mkdirSync(out, { recursive: true });
    const ctx = await browser.newContext(),
      errors = [];
    await ctx.addInitScript(() => {
      if (!localStorage.getItem("qa-seeded")) {
        localStorage.setItem("dmodisco_currency_v1", "200");
        localStorage.setItem("dmodisco_hist_v3",JSON.stringify([{round:3,kills:8,score:200,maxCombo:2,date:"QA"}]));
        localStorage.setItem("qa-seeded", "1");
      }
      window.pad = {
        connected: true,
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          value: 0,
        })),
      };
      navigator.getGamepads = () => [pad];
    });
    ctx.on("page", page=>page.on("console", m=>{if(m.type()==="error")errors.push(m.text());}));
    let p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base);
    await p.waitForFunction(
      () => window.DD_BOOT?.getState().state === "MAIN_MENU",
    );
    await p.evaluate(() => DD_UI.triggerMenuAction("new"));
    await p.waitForFunction(() => DD_OPENING.getState()?.type === "intro");
    await p.evaluate(() => DD_OPENING.debugSeek(31.95, false));
    await p.waitForFunction(() => DD_OPENING.getState()?.type === "descent");
    await p.evaluate(() => DD_OPENING.debugSeek(4.55, false));
    await p.waitForFunction(() => DD_HUB.isActive());
    async function visit(id, mode = "keyboard") {
      await p.evaluate(
        ([id, mode]) => {
          const hub = DD_HUB,
            layout = hub.layout(),
            st = layout.stations.find((s) => s.id === id),
            grid = 16,
            start = hub.getState();
          const origin = [start.x, start.y],
            queue = [[0, 0]],
            parent = new Map([["0,0", null]]);
          let end;
          const clear = (x, y) =>
            x >= 170 &&
            x <= 1650 &&
            y >= 209 &&
            y <= 1056 &&
            layout.obstacles.every(
              (o) => Math.hypot(x - o.x, y - o.y) > o.r + 2,
            );
          for (let j = 0; j < queue.length && !end; j++) {
            const [a, b] = queue[j],
              x = origin[0] + grid * a,
              y = origin[1] + grid * b;
            if (Math.hypot(x - st.x, y - st.y) < st.r - 4) {
              end = [a, b];
              break;
            }
            for (const [u, v] of [
              [0, 1],
              [0, -1],
              [1, 0],
              [-1, 0],
            ]) {
              const k = [a + u, b + v];
              if (parent.has(String(k)) || !clear(x + u * grid, y + v * grid))
                continue;
              parent.set(String(k), [a, b]);
              queue.push(k);
            }
          }
          if (!end) throw Error("no path " + id);
          const path = [];
          for (let k = end; k; k = parent.get(String(k))) path.unshift(k);
          for (const [a, b] of path.slice(1)) {
            const x = origin[0] + grid * a,
              y = origin[1] + grid * b;
            for (let i = 0; i < 12; i++) {
              const s = hub.getState(),
                dx = x - s.x,
                dy = y - s.y,
                dist = Math.hypot(dx, dy);
              if (dist < 1.5) break;
              pad.axes[0] = dx / dist;
              pad.axes[1] = dy / dist;
              hub.update(Math.min(0.03, dist / 285));
            }
          }
          pad.axes[0] = pad.axes[1] = 0;
          for (let i = 0; i < 10; i++) hub.update(0.05);
          if (hub.getState().nearStation !== id)
            throw Error(id + " missed: " + JSON.stringify(hub.getState()));
          if (mode === "pad") {
            pad.buttons[0].pressed = true;
            for (let i = 0; i < 15; i++) hub.update(0.04);
            pad.buttons[0].pressed = false;
            hub.update(0.016);
          }
        },
        [id, mode],
      );
      if (mode === "keyboard") await p.keyboard.press("KeyE");
    }
    assert.equal(
      await p.evaluate(() => Object.keys(DD_HUB.layout().zones).length),
      9,
    );
    await visit("mix");
    await p.getByRole("button", { name: "Bajar música" }).click();
    assert.equal(
      await p.evaluate(
        () => JSON.parse(localStorage.getItem("dmodisco_vol_v1")).music,
      ),
      0.8,
    );
    await p.locator("#dd-refuge-kit button").last().click();
    for (const id of [
      "dj",
      "bar",
      "armorer",
      "workshop",
      "bedroom",
      "keepsake",
      "rest",
      "workshop",
      "rest",
      "gallery",
      "ledger",
      "workshop",
      "practice",
      "prepare",
      "upgrades",
    ])
      await visit(id, id === "armorer" ? "pad" : "keyboard");
    for (const width of [390, 1280]) {
      await p.setViewportSize({ width, height: 720 });
      const box = await p.locator("#dd-refuge-kit").boundingBox();
      assert(box && box.x >= 0 && box.x + box.width <= width + 1);
    }
    await p.locator("#dd-refuge-kit button:not([disabled])").first().click();
    assert.equal(await p.evaluate(() => DD_UI.readProgress().currency), 50);
    await p.locator("#dd-refuge-kit button").last().click();
    let rec = await p.evaluate(() => DD_REFUGE_RECORD.snapshot());
    assert.equal(rec.repairs, 3);
    assert.equal(rec.keepsake, "sleeve");
    assert.equal(rec.talks.armorer, 1);
    assert.equal(Object.keys(rec.found).length, 3);
    assert.equal(rec.quiet, true);
    assert.equal(rec.imprint, true);
    // Contextual one-shot greetings have priority over optional conversation branches.
    for(let i=0;i<7 && !await p.locator('#dd-refuge-kit[open]').count();i++)await visit('dj');
    await p.getByRole('button',{name:'Preguntar por la cabina'}).click();assert(await p.evaluate(()=>DD_REFUGE_RECORD.snapshot().events['dj:craft']));
    await visit("armory");
    await p.waitForFunction(() => DD_UI.getState().shopOpen);
    await p.evaluate(() => DD_UI.closeModals());
    await visit("map");
    await p.waitForFunction(() => DD_UI.getState().mapOpen);
    await p.evaluate(() => DD_UI.closeModals());
    const painted = await p.evaluate(() => {
      const g = document.createElement("canvas").getContext("2d"),
        draw = g.drawImage.bind(g),
        ids = new Set();
      g.canvas.width = 1280;
      g.canvas.height = 720;
      g.drawImage = (im, ...args) => {
        for (const id of [
          "prop_sigil_poster",
          "prop_hub_fox_neon",
          "prop_subwoofer_cyan",
        ])
          if (im === DD_ASSETS.get(id)) ids.add(id);
        draw(im, ...args);
      };
      DD_HUB.render(g, 1280, 720);
      return [...ids];
    });
    assert(painted.includes("prop_sigil_poster"));
    assert(painted.includes("prop_hub_fox_neon"));
    if (out)
      await p.screenshot({
        path: out + "/refugio-restaurado.jpg",
        quality: 87,
      });
    await visit("descent");
    await p.waitForFunction(() => DD_CINE.isBlocking());
    await p.evaluate(() => DD_CINE.skip());
    await p.waitForFunction(() => __DD_BRIDGE.isRunning());
    assert.equal(await p.evaluate(()=>__DD_BRIDGE.getSnapshot().maxHp),4);
    await p.evaluate(() => DMO.playtest.hurt(99));
    await p.waitForSelector("#dd-results-refuge:visible");
    await p.click("#dd-results-refuge");
    await p.waitForFunction(() => DD_HUB.isActive());
    const before = await p.evaluate(() => DD_HUB.getState().x);
    await p.keyboard.down("KeyD");
    await p.waitForFunction((x) => DD_HUB.getState().x > x + 3, before);
    await p.keyboard.up("KeyD");
    await p.close();
    p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base);
    await p.waitForFunction(
      () => window.DD_BOOT?.getState().state === "MAIN_MENU",
    );
    await p.evaluate(() => DD_UI.triggerMenuAction("continue"));
    await p.waitForFunction(() => DD_HUB.isActive());
    assert.deepEqual(
      await p.evaluate(() => DD_REFUGE_RECORD.snapshot().found),
      rec.found,
    );
    assert.equal(await p.evaluate(() => DD_REFUGE_RECORD.repairs), 3);
    assert.equal(await p.evaluate(() => DD_UI.readProgress().currency), 50);
    assert.deepEqual(errors, []);
    console.log(
      "PASS 9 walkable sectors, 16 stations, held A, native purchase, restored record on reopen, defeat → refuge",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
