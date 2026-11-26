// Isolated browser fixture; temporary native closure probes are never shipped.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--disable-gpu", "--no-sandbox"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.route("**/index.html?*", async (route) => {
      const res = await route.fetch();
      let html = await res.text();
      const marker = "let hangar=null, pilotDoors=null, auditColliders=false;";
      assert(html.includes(marker));
      html = html.replace(
        marker,
        marker +
          `
window.fixture={paint:()=>Qf(),
 approach:(to)=>{const d=Ot.doors.find(d=>d.to===to);DMO.explore.debug({action:'position',x:d.wallX+52*d.nx,y:d.wallY+52*d.ny});const nearest=Tg()===d;
 // Use the real directional passage detector and its native open timer.
 for(let i=0;i<130&&Ot.key!==to;i++)Sg(1/60,-d.nx,-d.ny);return nearest&&Ot.key===to;},
 setup:()=>{
 const X=ye.x,Y=ye.y; for(const [i,style] of ['table','sofa'].entries())tc.push(mc({kind:'rect',style,name:'fixture-'+style,x:X+(i?94:-94),y:Y+44,w:78,h:36,onFloor:true}));
 return tc.slice(-2).map(o=>!!nc(o.x,o.y,1));},
 break:()=>{for(const o of tc.filter(o=>o.name.startsWith('fixture-')))while(!o.broken)fc(o,'player');},
 check:()=>tc.filter(o=>o.name.startsWith('fixture-')).map(o=>[o.name,o.broken,o.solid,!!nc(o.x,o.y,1)]),
 advanceWarnings:()=>{Ta.forEach(e=>e.stT*=.5);if(Zr)Zr.t=Zr.warn*.6;},
 warn:()=>{Ta.length=0;for(const [i,type] of ['sprinter','tank','speaker','sprinter','tank'].entries()){DMO.debug.spawnEnemyAt(type,ye.x-160+i*100,ye.y+(i%2?80:-70),false,false);const e=Ta.at(-1);e.type=type;e.st='windup';e.stT=.22;e.aimX=1;e.aimY=0;e.elite=i===3;if(i===4){e.mini=true;e.mState='chargeWind';}}DMO.debug.rave();DMO.debug.laser();},
 };`,
      );
      await route.fulfill({ response: res, body: html });
    });
    const base = process.argv[2] || "http://localhost:8000";
    for (const seed of [0, 4294967295]) {
      await p.goto(base + "/index.html?roomDebug&roomSeed=" + seed);
      await p.waitForFunction(
        () => window.DD_BOOT?.getState().state === "MAIN_MENU",
      );
      await p.evaluate(() => {
        DD_HUB.enter();
        DD_HUB.exitToRun();
      });
      await p.waitForFunction(() => __DD_BRIDGE.isRunning());
      await p.evaluate(() => fixture.paint());
      assert.equal(
        await p.evaluate(() => DD_ROOM_DEBUG.pilot().active),
        seed === 0,
      );
      if (seed) continue;
      const r = await p.evaluate(() => {
        DMO.debug.invuln();
        const before = fixture.setup();
        fixture.warn();
        fixture.paint();
        const hazards = DD_ROOM_DEBUG.pilot();
        fixture.advanceWarnings();
        fixture.paint();
        const later = DD_ROOM_DEBUG.pilot();
        const frame = document
          .querySelector("#game")
          .toDataURL("image/jpeg", 0.9);
        fixture.break();
        const broken = fixture.check();
        const a = DD_ROOM_DEBUG.architecture();
        const gate = a.openings[0];
        DMO.explore.debug({
          action: "position",
          x: gate.landing.x,
          y: gate.landing.y,
        });
        DD_ROOM_DEBUG.pilotColliders(true);
        fixture.paint();
        const cut = document
          .querySelector("#game")
          .toDataURL("image/jpeg", 0.9);
        DD_ROOM_DEBUG.pilotColliders(false);
        const action = (action, to) => DMO.explore.debug({ action, to });
        action("clear");
        if (!fixture.approach(a.openings[0].to))
          throw Error("native outward crossing failed");
        fixture.paint();
        const away = DD_ROOM_DEBUG.pilot();
        action("clear");
        if (!fixture.approach(a.key)) throw Error("return crossing failed");
        fixture.paint();
        return {
          before,
          broken,
          cut,
          later,
          restored: fixture.check(),
          hazards,
          away,
          back: DD_ROOM_DEBUG.pilot(),
          same:
            JSON.stringify(a.walls) ===
            JSON.stringify(DD_ROOM_DEBUG.architecture().walls),
          frame,
        };
      });
      assert.deepEqual(r.before, [true, true]);
      assert.deepEqual(r.broken, [
        ["fixture-table", true, false, false],
        ["fixture-sofa", true, false, false],
      ]);
      assert.deepEqual(r.broken, r.restored);
      assert(!r.away.active && r.back.active && r.same);
      assert(
        r.hazards.rave && r.hazards.warnings.length === 5 && r.hazards.laser,
      );
      assert.deepEqual(
        r.hazards.warnings.map((e) => e.type),
        ["sprinter", "tank", "speaker", "sprinter", "tank"],
      );
      assert(
        r.later.warnings.every((e) => e.remaining === 0.11) &&
          r.later.laser.elapsed > 0 &&
          r.later.warnings[4].mini,
      );
      assert(r.hazards.warnings[3].elite);
      if (process.argv[3]) {
        fs.mkdirSync(process.argv[3], { recursive: true });
        for (const name of ["frame", "cut"])
          fs.writeFileSync(
            `${process.argv[3]}/${name}.jpg`,
            Buffer.from(r[name].split(",")[1], "base64"),
          );
      }
      console.log(r.hazards, r.away.room, r.back.room);
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS pilot gating, native break + snapshot round trip, simultaneous RAVE warning fixture",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
