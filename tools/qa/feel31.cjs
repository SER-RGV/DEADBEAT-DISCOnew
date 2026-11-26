// Presentation-only crossover fixture. No A/B switch in the distributed game.
const { chromium } = require("playwright-core"),
  fs = require("node:fs"),
  { execFileSync } = require("node:child_process"),
  assert = require("node:assert/strict");
const clips = process.argv.includes("--clips"),
  soak = process.argv.includes("--soak");
const output = "ART_EVIDENCE/COMBAT_FEEL_31";
fs.mkdirSync(output, { recursive: true });
function previous(html) {
  for (const name of ["dd_dice_motion", "dd_dice_feedback"]) {
    const start = html.indexOf(`/* === INLINED FROM src/${name}.js`),
      a = html.indexOf("*/", start) + 2,
      b = html.indexOf("</script>", a);
    assert(start >= 0 && b > a);
    html =
      html.slice(0, a) +
      "\n" +
      execFileSync("git", ["show", `7f52e9e:src/${name}.js`], {
        encoding: "utf8",
      }) +
      "\n" +
      html.slice(b);
  }
  for (const [a, b] of [
    [
      '? 11 + (d.state === "CHARGING" ? 2*d.charge*Math.sqrt(c.mass) : 0)',
      "? 11",
    ],
    ["w.readyTone?.(c)", "void 0"],
    ["if(inward < -90", "if(false && inward < -90"],
    [
      '["","I","II","III"][recipe[1]]+" · "+recipe[0].toUpperCase() + " · " + hops + "× " + window.DD_DICE_MOTION.chord(recipe[2])',
      'recipe[0].toUpperCase()+" · "+hops+"×"',
    ],
  ]) {
    assert(html.includes(a), a);
    html = html.replace(a, b);
  }
  return html;
}
// Freeze B at the submitted 3.0 presentation, not the later label fix.
function baseB(h) {
  const marker = "    // Independent cursors in the same pool:";
  const a = h.indexOf(marker),
    b = h.indexOf("    if (rank >= 1", a);
  if (a < 0) return h;
  assert(b > a);
  return (
    h.slice(0, a) +
    `    p.label=now>=numberAt?(loss<.1?'<0.1':String(Math.round(loss*10)/10)):null;p.labelEnd=now+.4;if(p.label)numberAt=now+.11;\n` +
    h.slice(b)
  )
    .replace("g.fillStyle=p.labelColor;", "g.fillStyle=p.color;")
    .replace("p.labelX+10,p.labelY-10", "p.x+10,p.y-10");
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  try {
    const rows = [],
      base = process.argv[2] || "http://localhost:8000";
    for (const [i, id] of [4, 6, 8, 10, 12, 20].entries()) {
      const scenario = ["duo", "grupo", "jefe"][i % 3];
      if (soak && id !== 6) continue;
      if (clips && ![6, 20].includes(id)) continue;
      for (const condition of soak ? "C" : i % 2 ? "BA" : "AB") {
        const p = await browser.newPage({
            viewport: { width: 960, height: 600 },
          }),
          errors = [];
        p.on("pageerror", (e) => errors.push(e.message));
        await p.addInitScript(() => {
          let n = 9123;
          Math.random = () =>
            (n = (Math.imul(1664525, n) + 1013904223) >>> 0) / 4294967296;
          const orig = AudioNode.prototype.connect;
          AudioNode.prototype.connect = function (dest, ...args) {
            if (
              dest === this.context.destination &&
              window.wantPCM &&
              !this.__tapped
            ) {
              this.__tapped = true;
              const ctx = this.context,
                node = ctx.createScriptProcessor(4096, 1, 1);
              orig.call(this, node);
              orig.call(node, dest);
              node.onaudioprocess = (e) => {
                if (window.takeAudio) {
                  const samples = e.inputBuffer.getChannelData(0);
                  const track = window.recorded.get(ctx) || [];
                  track.push(new Float32Array(samples));
                  window.recorded.set(ctx, track);
                }
              };
            }
            return orig.call(this, dest, ...args);
          };
        });
        await p.route("**/?roomDebug*", async (r) => {
          const res = await r.fetch();
          let h = await res.text();
          if (condition === "A") h = previous(h);
          if (condition === "B") h = baseB(h);
          await r.fulfill({
            response: res,
            body: h.replace("false; /* DEV_BUILD */", "true;"),
          });
        });
        await p.addInitScript((enabled) => {
          window.wantPCM = enabled;
          window.recorded = new Map();
        }, clips);
        await p.goto(base + "/?roomDebug&roomSeed=53");
        await p.waitForFunction(
          () => window.DD_BOOT?.getState().state === "MAIN_MENU",
        );
        await p.mouse.click(10, 10);
        await p.evaluate(() => {
          DD_HUB.enter();
          DD_HUB.exitToRun();
        });
        await p.waitForFunction(() => __DD_BRIDGE.isRunning());
        const record = clips;
        const row = await p.evaluate(
          async ({ id, scenario, record, soak }) => {
            const br = __DD_BRIDGE;
            DD_DICE.save.marks = 40;
            DD_DICE.equip(id);
            DMO.debug.invuln();
            DMO.debug.holdSpawns(true);
            let spawned = 0;
            const player = br.getSnapshot().player;
            if (scenario === "jefe") {
              DMO.debug.boss();
              br.testStep({}, 150);
              const boss = br.getSnapshot().boss;
              br.debugPoseBoss({ hp: boss.maxHp * 0.38 });
            } else
              for (let j = 0; j < (scenario === "grupo" ? 30 : 2); j++)
                spawned += !!DMO.debug.spawnEnemyAt(
                  "tank",
                  player.x + 55 + (j % 6) * 21,
                  player.y + ((j % 5) - 2) * 14,
                  false,
                  false,
                );
            if (scenario !== "duo")
              for (let j = 1; j <= id; j++)
                DD_DICE.d.runes[j] = id === 8 ? "fuego" : "electricidad";
            const images = [],
              canvas = document.querySelector("#game");
            window.takeAudio = record;
            const frames = [],
              launchTicks = [],
              events = new Map(),
              phases = new Set();
            let peak = 0,
              peakMarks = 0,
              peakLinks = 0,
              peakDanger = 0;
            let last = await new Promise(requestAnimationFrame);
            const ticks = soak ? 960 : 96;
            for (let j = 0; j < ticks; j++) {
              let now = await new Promise(requestAnimationFrame);
              frames.push(now - last);
              last = now;
              if (soak && j > 0 && j % 96 === 0) {
                for (let k = 0; k < 12; k++)
                  spawned += !!DMO.debug.spawnEnemyAt(
                    "tank",
                    player.x + 50 + (k % 4) * 22,
                    player.y + ((k % 3) - 1) * 16,
                    false,
                    false,
                  );
              }
              const s = br.getSnapshot(),
                boss = s.boss;
              const aim = boss
                ? Math.atan2(boss.y - s.player.y, boss.x - s.player.x)
                : 0;
              br.testStep({ fire: j % 32 < 12, aim }, 4);
              if (record)
                images.push(canvas.toDataURL("image/jpeg", 0.78).split(",")[1]);
              const st = DD_COMBAT_FEEL.inspect();
              peak = Math.max(peak, st.native?.particles || 0);
              peakMarks = Math.max(peakMarks, st.feedback?.marks || 0);
              peakLinks = Math.max(peakLinks, st.links);
              peakDanger = Math.max(
                peakDanger,
                br.getActors().enemyBullets.length,
              );
              if (boss) {
                const probe = br.getBoss();
                phases.add(probe?.pattern || probe?.phase || boss.slug);
              }
              for (const e of st.events) {
                if (!events.has(e.event) && e.kind === "lanzamiento")
                  launchTicks.push(j);
                events.set(e.event, e);
              }
            }
            window.takeAudio = false;
            let pcm = null,
              rate = 0,
              audioPeak = 0;
            for (const [ctx, blocks] of window.recorded) {
              const floats = blocks.flatMap((b) => Array.from(b)),
                v = new Int16Array(floats.length);
              let pk = 0;
              for (let i = 0; i < v.length; i++) {
                pk = Math.max(pk, Math.abs(floats[i]));
                v[i] = Math.max(
                  -32768,
                  Math.min(32767, Math.round(floats[i] * 32767)),
                );
              }
              if (pk > audioPeak) {
                audioPeak = pk;
                rate = ctx.sampleRate;
                let str = "";
                const raw = new Uint8Array(v.buffer);
                for (let i = 0; i < raw.length; i += 8192)
                  str += String.fromCharCode(...raw.subarray(i, i + 8192));
                pcm = btoa(str);
              }
            }
            const ev = [...events.values()],
              arcs = ev.filter((e) => e.depth > 0 && e.die);
            return {
              id,
              scenario,
              spawned,
              frames: frames.length,
              fps:
                Math.round(
                  (100000 * frames.length) / frames.reduce((a, b) => a + b),
                ) / 100,
              delays: record ? [...frames] : null,
              cadenceRaf: launchTicks
                .slice(1)
                .map((t, i) => t - launchTicks[i]),
              p50: frames.sort((a, b) => a - b)[Math.floor(ticks * 0.5)],
              p95: frames[Math.floor(ticks * 0.95)],
              peakParticles: peak,
              peakMarks:
                typeof DD_DICE_FEEDBACK.stats === "function" ? peakMarks : null,
              peakLinks,
              peakDanger,
              phases: [...phases],
              launches: ev.filter((e) => e.kind === "lanzamiento").length,
              chains: new Set(arcs.map((e) => e.chain)).size,
              hits: DD_COMBAT_FEEL.inspect().native?.hits,
              rate,
              audioPeak,
              pcm,
              images,
            };
          },
          { id, scenario, record, soak },
        );
        if (record) {
          const tmp = fs.mkdtempSync("/tmp/dd31clip-"),
            list = [];
          row.images.forEach((v, i) => {
            fs.writeFileSync(tmp + "/" + i + ".jpg", Buffer.from(v, "base64"));
            list.push(
              `file '${i}.jpg'\nduration ${(row.delays[i + 1] || row.delays[i]) / 1000}`,
            );
          });
          fs.writeFileSync(tmp + "/frames.txt", list.join("\n"));
          const audio = [];
          if (row.pcm) {
            fs.writeFileSync(tmp + "/mix.pcm", Buffer.from(row.pcm, "base64"));
            audio.push(
              "-f",
              "s16le",
              "-ar",
              String(row.rate),
              "-ac",
              "1",
              "-i",
              tmp + "/mix.pcm",
            );
          }
          execFileSync(process.env.FFMPEG || "ffmpeg", [
            "-loglevel",
            "error",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            tmp + "/frames.txt",
            ...audio,
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "24",
            "-movflags",
            "+faststart",
            `${output}/${scenario}-${condition}.mp4`,
          ]);
          fs.rmSync(tmp, { recursive: true });
        }
        delete row.images;
        delete row.pcm;
        delete row.delays;
        assert.deepEqual(errors, []);
        rows.push({ condition, ...row });
        fs.writeFileSync(
          output +
            (clips ? "/clips.json" : soak ? "/soak.json" : "/repeat.json"),
          JSON.stringify(rows, null, 2),
        );
        console.log(condition, id, scenario, row.fps, row.launches, row.hits);
        await p.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
