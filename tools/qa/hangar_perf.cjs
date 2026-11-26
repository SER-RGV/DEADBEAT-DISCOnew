const assert = require("node:assert/strict"),
  fs = require("node:fs");
const factory = Function(
  fs.readFileSync(
    require.resolve("../../src/room_generation/pilot_perf.js"),
    "utf8",
  ) + ";return createPilotPerf",
)();
let block = null;
const p = factory(
  () => block,
  () => ({ seed: 0 }),
);
p.start();
let t = 0;
for (let i = 0; i <= 100; i++) {
  t += i;
  p.frame(t, true, i, 0, 12, 8);
}
p.stop();
const s = p.report();
assert.equal(s.all.p95Ms, 95);
assert.equal(s.all.meanMs, 50.5);
assert.equal(s.all.maxMs, 100);
assert.deepEqual(s.raveDenseMoving, s.all);
p.start();
p.frame(0, false, 0, 0, 0, 0);
p.frame(20, true, 1, 0, 20, 9);
p.frame(51, true, 1, 0, 20, 9);
p.frame(80, true, 2, 0, 20, 9);
block = "hidden";
p.frame(10000, true, 3, 0, 20, 9);
assert.equal(p.report().all.count, 3);
assert.equal(p.report().rave.count, 2);
assert.equal(p.report().raveDenseMoving.count, 1);
assert.equal(p.report().reason, "hidden");
assert.throws(() => p.start());
p.reset();
assert.equal(p.report().all.count, 0);
console.log(
  "PASS unclamped intervals, nearest-rank, endpoints, movement, visibility, reset",
);
