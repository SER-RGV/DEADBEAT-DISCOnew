// Traverse generated links; QA clear skips fighting, never unlockRooms/goto/nextFloor.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const p = await browser.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.argv[2] || "http://localhost:8000");
    await p.waitForFunction(
      () => window.DD_BOOT?.getState().state === "MAIN_MENU",
    );
    await p.evaluate(() => DD_UI.triggerMenuAction("new"));
    await p.waitForFunction(() => DD_OPENING.getState()?.type === "intro");
    const evidence = process.argv[3];
    if (evidence) {
      require('node:fs').mkdirSync(evidence,{recursive:true});
      for (const [index,t] of [2.8,7.6,13.5,17.9,22.4,27.2,30.6].entries()) {
        await p.evaluate(t=>DD_OPENING.debugSeek(t,true),t);
        await p.screenshot({path:`${evidence}/intro-${index+1}.jpg`,quality:82});
      }
    }
    await p.evaluate(() => DD_OPENING.debugSeek(31.9, false));
    await p.waitForFunction(() => DD_OPENING.getState()?.type === "descent");
    await p.evaluate(() => DD_OPENING.debugSeek(4.55, false));
    await p.waitForFunction(() => DD_HUB.isActive());
    async function inspect(hub) {
      await p.evaluate(() => DD_UI.openMap());
      const position = () =>
        p.evaluate((h) => {
          const s = h ? DD_HUB.getState() : __DD_BRIDGE.getSnapshot().player;
          return [s.x, s.y, h ? null : DMO.explore.state().key];
        }, hub);
      const start = await position();
      const story=p.locator('#dd-tower-story');
      const original=await story.evaluate(e=>e.outerHTML);
      assert.equal(await story.locator('li').count(),9);
      assert.match(await story.textContent(),/Pista 09 · El Núcleo/);
      const names = await p.evaluate(() =>
        DMO.circles.residents().map((r) => r.name),
      );
      for (let i = 0; i < 10; i++) {
        await p.locator(`[data-circle="${i}"]`).click();
        assert(
          (await p.locator("#dd-chart-detail").textContent()).includes(
            names[i],
          ),
        );
        assert.equal(await p.locator('#dd-sheet-place').textContent(),await p.evaluate(i=>__DD_BRIDGE.getCircles()[i].place,i));
        await p.waitForFunction(()=>{const im=document.querySelector('#dd-record-portrait');return !im.hidden && im.complete && im.naturalWidth>0;});
        assert.equal(await story.evaluate(e=>e.outerHTML),original);
        assert.equal(await p.locator('#dd-sheet-name').textContent(),await p.evaluate(i=>__DD_BRIDGE.getCircles()[i].name,i));
        if(hub && evidence)await p.screenshot({path:`${evidence}/registro-${String(i+1).padStart(2,'0')}.jpg`,quality:82});
        assert.deepEqual(await position(), start);
      }
      await p.keyboard.press("Escape");
      assert.deepEqual(await position(), start);
    }
    await inspect(true);
    await p.evaluate(() => DD_HUB.exitToRun());
    await p.waitForFunction(() => DD_CINE.isBlocking());
    await p.evaluate(() => DD_CINE.skip());
    await p.waitForFunction(() => __DD_BRIDGE.isRunning());
    await inspect(false);
    for (let f = 1; f <= 9; f++) {
      const stats = await p.evaluate(async (f) => {
        const state = () => DMO.explore.state(),
          act = (action, to) => DMO.explore.debug({ action, to });
        let known = new Set(),
          resident = "",
          crossings = 0,
          sealed = 0;
        while (crossings < 65) {
          const e = state(),
            s = __DD_BRIDGE.getSurvey();
          if (e.floor !== f) throw Error("wrong floor");
          const keys = new Set(s.nodes.map((n) => n.key));
          if ([...known].some((k) => !keys.has(k)))
            throw Error("discovery lost on revisit");
          known = keys;
          if (
            JSON.stringify([...keys].sort()) !==
            JSON.stringify(
              e.nodes
                .filter((n) => n.known)
                .map((n) => n.key)
                .sort(),
            )
          )
            throw Error("fog mismatch");
          if (
            !s.doors.every(
              (d, i) => d.open === e.doors[i].open && d.to === e.doors[i].to,
            )
          )
            throw Error("door mismatch");
          if (e.doors.some((d) => !d.open)) sealed++;
          const here = e.nodes.find((n) => n.key === e.key);
          if (DMO.circles.at(here.room).isResident)
            resident = DMO.circles.at(here.room).resident.name;
          if (!e.cleared) act("clear");
          const cleared = state();
          let dest;
          if (
            cleared.floorCompleted === 11 &&
            cleared.doors.some((d) => d.lift)
          ) {
            dest = cleared.doors.find((d) => d.lift).to;
          } else {
            // Shortest path to uncleared ordinary room, then resident, then lift.
            const goals = cleared.nodes.filter((n) => !n.shop && !n.cleared);
            const normal = goals.filter(
              (n) => !DMO.circles.at(n.room).isResident,
            );
            const targets = new Set(
              (normal.length ? normal : goals).map((n) => n.key),
            );
            const queue = [[here.key, null]],
              seen = new Set();
            for (let j = 0; j < queue.length; j++) {
              const [k, first] = queue[j];
              if (seen.has(k)) continue;
              seen.add(k);
              if (targets.has(k)) {
                dest = first;
                break;
              }
              const n = e.nodes.find((n) => n.key === k);
              for (const l of n.links) queue.push([l.to, first || l.to]);
            }
          }
          const door = cleared.doors.find((d) => d.to === dest);
          if (!door) throw Error("No generated door at " + e.key);
          const deadline = performance.now() + 6000;
          let after;
          do {
            const button = document.querySelector(
              "#risk-choice-overlay.visible button:not(:disabled),#shot-choice-overlay.visible button:not(:disabled)",
            );
            if (button) button.click();
            act("cross", dest);
            after = state();
            if (after.key !== e.key) break;
            await new Promise(requestAnimationFrame);
          } while (performance.now() < deadline);
          if (after.key === e.key)
            throw Error(
              "Cross refused " +
                e.key +
                " -> " +
                dest +
                " " +
                JSON.stringify([
                  after.floorCompleted,
                  after.doors,
                  __DD_BRIDGE.getSnapshot().dead,
                ]),
            );
          crossings++;
          if (after.floor !== f) {
            if (
              !resident ||
              after.floor !== f + 1 ||
              cleared.floorCompleted !== 11
            )
              throw Error("Incomplete floor");
            return { f, resident, crossings, sealed };
          }
        }
        throw Error("Cycle limit");
      }, f);
      console.log(stats);
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS 9 residents via generated doors; Nucleus reached; all 10 cards stationary at both scales",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
