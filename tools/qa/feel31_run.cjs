// Unassisted damage/economy. Simple chase/strafe policy, no injected deaths,
// enemy spawning, invulnerability, equipment grants or room-clear commands.
const { chromium } = require("playwright-core"),
  fs = require("node:fs");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const p = await b.newPage();
    await p.goto(
      (process.argv[2] || "http://localhost:8000") + "/?roomDebug&roomSeed=53",
    );
    await p.waitForFunction(
      () => window.DD_BOOT?.getState().state === "MAIN_MENU",
    );
    await p.evaluate(() => {
      DD_HUB.enter();
      DD_HUB.exitToRun();
    });
    await p.waitForFunction(() => __DD_BRIDGE.isRunning());
    const result = await p.evaluate(async () => {
      const br = __DD_BRIDGE,
        rooms = new Set(),
        phases = new Set();
      let casts = 0,
        old,
        step = 0,
        min = Infinity;
      for (; step < 3000; step++) {
        const s = br.getSnapshot();
        if (
          s.dead ||
          !s.running ||
          document.querySelector("#dd-results-refuge")?.offsetWidth
        )
          break;
        const prompt = document.querySelector(
          "#shot-choice-overlay.visible button:not(:disabled), #risk-choice-overlay.visible button:not(:disabled)",
        );
        if (prompt) prompt.click();
        const survey = br.getSurvey();
        if (!survey) break;
        rooms.add(survey.key);
        min = Math.min(min, s.hp);
        const foes = survey.enemies.concat(survey.boss ? [survey.boss] : []);
        const point = s.player,
          dist = (t) => Math.hypot(t.x - point.x, t.y - point.y);
        const t = foes.sort((a, b) => dist(a) - dist(b))[0];
        let angle, move;
        if (t) {
          angle = Math.atan2(t.y - point.y, t.x - point.x);
          move =
            angle +
            (dist(t) < 115
              ? Math.PI * 0.8
              : dist(t) > 230
                ? 0
                : Math.PI * 0.48);
        } else {
          const door =
            survey.doors.find((v) => v.open && !rooms.has(v.to)) ||
            survey.doors.find((v) => v.open);
          move = door
            ? Math.atan2(door.y - point.y, door.x - point.x)
            : step / 20;
          angle = move;
        }
        const d = DD_DICE.d,
          state = d.state;
        phases.add(state);
        if (state === "RELEASE" && old !== state) casts++;
        old = state;
        const fire =
          !!t &&
          (state === "READY" ||
            state === "AIMING" ||
            (state === "CHARGING" && d.charge < 0.75));
        br.testStep(
          {
            fire,
            aim: angle,
            up: Math.sin(move) < -0.33,
            down: Math.sin(move) > 0.33,
            left: Math.cos(move) < -0.33,
            right: Math.cos(move) > 0.33,
          },
          4,
        );
        if (step % 100 === 99) await new Promise(requestAnimationFrame);
      }
      const s = br.getSnapshot();
      return {
        seed: 53,
        steps: step,
        simulatedSecondsRequested: (step * 4) / 60,
        rooms: [...rooms],
        minHp: min,
        finalHp: s.hp,
        dead: s.dead,
        running: s.running,
        results: !!document.querySelector("#dd-results-refuge")?.offsetWidth,
        marks: DD_DICE.save.marks,
        states: [...phases],
      };
    });
    fs.writeFileSync(
      "ART_EVIDENCE/COMBAT_FEEL_31/run.json",
      JSON.stringify(result, null, 2),
    );
    console.log(result);
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
