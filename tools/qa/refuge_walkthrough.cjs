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
    await p.goto(base+"/?roomDebug&roomSeed=53");
    await p.waitForFunction(
      () => window.DD_BOOT?.getState().state === "MAIN_MENU",
    );
    await p.evaluate(() => DD_UI.triggerMenuAction("new"));
    await p.waitForFunction(() => DD_OPENING.getState()?.type === "intro");
    await p.evaluate(() => DD_OPENING.debugSeek(31.95, false));
    await p.waitForFunction(() => DD_OPENING.getState()?.type === "descent");
    await p.evaluate(() => DD_OPENING.debugSeek(4.55, false));
    await p.waitForFunction(() => DD_HUB.isActive());
    const captureDir=process.env.DD_HUB_CAPTURES;
    const seenScenes=new Set();
    async function capture(name){if(!captureDir||seenScenes.has(name))return;seenScenes.add(name);fs.mkdirSync(captureDir,{recursive:true});await p.evaluate(()=>new Promise(requestAnimationFrame));await p.screenshot({path:`${captureDir}/${name}.jpg`,quality:85});}
    await capture('entrada');
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
          const clear=hub.walkable;
          for (let j = 0; j < queue.length && !end; j++) {
            const [a, b] = queue[j],
              x = origin[0] + grid * a,
              y = origin[1] + grid * b;
            if (Math.hypot(x - st.x, y - st.y) < 12) {
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
      await capture(id);
      if (mode === "keyboard") await p.keyboard.press("KeyE");
    }
    assert.equal(
      await p.evaluate(() => Object.keys(DD_HUB.layout().zones).length),
      9,
    );
    const protectedState=()=>p.evaluate(()=>JSON.stringify({snap:__DD_BRIDGE.getSnapshot(),dice:DD_DICE.d,save:DD_DICE.save,survey:__DD_BRIDGE.getSurvey(),credits:DD_UI.readProgress().currency}));
    const initial=await protectedState();
    await visit('practice');
    const hit=await p.evaluate(()=>{
      const {x,y}=DD_HUB.getState(),t=DD_HUB_LAYOUT.targets[0],d=Math.hypot(t.x-x,t.y-y);
      pad.axes[2]=(t.x-x)/d;pad.axes[3]=(t.y-y)/d;pad.buttons[7].pressed=true;
      for(let i=0;i<30;i++)DD_HUB.update(1/30);
      pad.buttons[7].pressed=false;pad.axes[2]=pad.axes[3]=0;
      pad.buttons[1].pressed=true;pad.axes[1]=1;DD_HUB.update(.04);
      const s=DD_HUB.getState();pad.buttons[1].pressed=false;pad.axes[1]=0;return {p:s.practice,dy:s.y-y};});
    assert(hit.p.hits>0&&hit.p.boost&&hit.dy>20,JSON.stringify(hit));
    await visit("mix");
    assert.equal(await p.evaluate(()=>DD_HUB.getState().practice),null);
    assert.equal(await protectedState(),initial,'practice mutated native state');
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
    await capture("restaurado");
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
    // Suspend a populated native room, not just an empty pre-run context.
    const live=()=>p.evaluate(()=>{const {paused,...snap}=__DD_BRIDGE.getSnapshot();return JSON.stringify({snap,room:__DD_BRIDGE.getSurvey(),plan:DD_ROOM_DEBUG.current(),dice:DD_DICE.d,save:DD_DICE.save,credits:DD_UI.readProgress().currency});});
    const beforeHub=await p.evaluate(()=>{const {paused,...snap}=__DD_BRIDGE.getSnapshot();const before=JSON.stringify({snap,room:__DD_BRIDGE.getSurvey(),plan:DD_ROOM_DEBUG.current(),dice:DD_DICE.d,save:DD_DICE.save,credits:DD_UI.readProgress().currency});DD_HUB.enter();return before;});
    await visit('practice');
    // Real browser mouse input through the DPR/CSS camera transform while paused.
    // Holding towards the empty lane must create a local projectile, not a native shot.
    await p.mouse.move(420,400);await p.mouse.down();
    await p.waitForFunction(()=>DD_HUB.getState().practice?.projectile);
    await p.mouse.up();
    await p.keyboard.down('KeyS');await p.keyboard.down('Space');
    await p.waitForFunction(()=>DD_HUB.getState().practice?.boost);
    await p.keyboard.up('Space');await p.keyboard.up('KeyS');
    assert(await p.evaluate(()=>__DD_BRIDGE.isPaused()));
    assert.equal(await live(),beforeHub,'populated native room changed during practice');
    await p.evaluate(()=>DD_HUB.exitToRun());
    assert.equal(await live(),beforeHub,'changed before native handoff');
    await p.evaluate(()=>DD_CINE.skip());
    await p.waitForFunction(()=>!__DD_BRIDGE.isPaused());
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
    await p.goto(base+"/?roomDebug&roomSeed=53");
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
