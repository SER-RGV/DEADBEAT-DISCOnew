const assert = require("node:assert/strict"),
  fs = require("node:fs");
global.window = global;
Function(
  fs
    .readFileSync("src/dd_combat_feel.js", "utf8")
    .replace("false; /* DEV_BUILD */", "true;"),
)();
const f = DD_COMBAT_FEEL;
function trial(seed) {
  f.reset();
  f.tick(0, 1, seed);
  const targets = [0, 1, 2, 3, 4].map((x) => ({ x: x * 10, y: 0, hp: 50 })),
    added = [];
  const w = {
    targets: () => targets,
    visible: () => true,
    hit(t, n) {
      assert(n > 0 && n <= f.config.maxDamage);
      t.hp -= n;
      added.push(t.x);
      f.hit(t, n, true);
    },
    accent() {},
  };
  const d = { id: 6, face: 3, charge: 1, runes: { 3: "electricidad" } },
    c = { variantRune: "fuego", results: [3, 3, 3, 3, 3, 3] };
  f.begin();
  for (const t of targets) f.hit(t, 2, false);
  f.resolve(d, c, w);
  const n = added.length;
  f.resolve(d, c, w);
  assert.equal(added.length, n);
  assert(n <= 3);
  assert.equal(new Set(added).size, n);
  if (n) {
    f.begin();
    f.hit(targets[0], 2, false);
    f.resolve(d, c, w);
    assert.equal(f.inspect().events.at(-1).decision, "enfriamiento");
  }
  return [n, added];
}
let hits = 0;
for (let i = 0; i < 100; i++) {
  const a = trial(i);
  assert.deepEqual(trial(i), a);
  if (a[0]) hits++;
}
assert(hits > 0 && hits < 100);
f.tick(0.1, 2, 1);
assert.equal(f.combo, 0);
assert.deepEqual(f.inspect().events, []);
console.log(
  "Tier III:",
  hits,
  "/ 100 controlled rolls. Replay, duplicate resolution, cooldown, damage cap, cycle guard and room cleanup PASS",
);

assert.equal(
  f.modifier({ face: 2, runes: { 2: "fuego" } }, { variantRune: "fuego" }),
  1.05,
);
assert.equal(f.modifier({ face: 1, runes: {} }, { variantRune: "fuego" }), 1);
f.begin();
f.hit({ x: 0, y: 0, hp: 2 }, 1, false);
f.resolve(
  { id: 4, face: 1, charge: 0, runes: {} },
  { variantRune: "perforación" },
  {},
);
assert.equal(f.inspect().events.at(-1).decision, "sin combinación");
f.reset();
assert.equal(f.inspect().links, 0);
assert.equal(f.inspect().events.length, 0);
