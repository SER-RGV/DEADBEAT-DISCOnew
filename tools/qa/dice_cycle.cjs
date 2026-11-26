// node tools/qa/dice_cycle.cjs — no DOM, no third-party dependencies.
const assert = require("node:assert/strict");
const store = new Map();
global.localStorage = {
  getItem: (k) => store.get(k),
  setItem: (k, v) => store.set(k, v),
};
global.window = global;
require("../../src/dd_dice_geometry");
require("../../src/dd_dice_rules");
require("../../src/dd_dice");
for (const id of [6, 4, 8, 10, 12, 20]) {
  assert.equal(DD_DICE_GEOMETRY.m[id].f.length, id);
  // Independently place each labelled normal vertically (including all twenty).
  DD_DICE_GEOMETRY.m[id].f.forEach(({ n: [x, y, z] }, i) => {
    assert.equal(
      DD_DICE_GEOMETRY.top(
        id,
        Math.atan2(-z, y),
        Math.atan2(x, Math.hypot(y, z)),
      ),
      i + 1,
    );
  });
  const { d, save, equip, update } = DD_DICE;
  save.marks = 30;
  assert(equip(id));
  const p = { x: 0, y: 0, aimAngle: 0 },
    t = { x: 0, y: 0, r: 2000, hp: 500 };
  let blasts = 0,
    hits = 0;
  const w = {
    rand: () => 0.31,
    targets: () => [t],
    hit() {
      hits++;
    },
    collide() {},
    sound() {},
    blast() {
      blasts++;
      assert.equal(d.face, DD_DICE_GEOMETRY.top(id, d.a, d.b));
    },
  };
  let quick;
  for (const held of [1, 48]) {
    const states = new Set();
    for (let i = 0; i < held + 180; i++) {
      update(1 / 60, p, i < held, false, w);
      states.add(d.state);
      if (d.state === "RELEASE") {
        if (held === 1) quick = d.vx;
        else assert(d.vx > quick);
      }
      if (i > held) p.y += 1;
      assert(d.bounces <= 4 || d.state === "AIMING");
    }
    for (const st of [
      "AIMING",
      "RELEASE",
      "FLIGHT",
      "ROLLING",
      "RESOLVING",
      "RETURNING",
      "RECOVERED",
      "READY",
    ])
      assert(states.has(st));
    assert.equal(states.has("CHARGING"), held > 1);
    assert.equal(d.y, p.y - 1);
  }
  assert.equal(blasts, 2);
  assert.equal(hits, 4);
  assert.equal(JSON.parse(store.get("dd.dice.v1")).id, id);
  console.log("OK D" + id);
}
// Isolate rules from movement to place witnesses just outside the blast.
function resolveAt(id, face, rune, positions, rng = 0.25) {
  const d = {
    id,
    face,
    runes: { [face]: rune },
    a: 0,
    b: 0,
    x: 0,
    y: 0,
    z: 0,
    charge: 0,
    hits: new Set(),
    shards: [],
  };
  const targets = positions.map(([x, y]) => ({ x, y, r: 3, hp: 100 }));
  const damage = [],
    pushes = [];
  DD_DICE_RULES({
    d,
    catalog: DD_DICE.catalog,
    geo: DD_DICE_GEOMETRY,
    radius: () => 50,
    reward: () => {},
  }).resolve({
    rand: () => rng,
    targets: () => targets,
    hit: (t, n, type) => damage.push([targets.indexOf(t), n, type]),
    push: (t, _, n) => pushes.push(n),
    blast: () => {},
    energy: () => {},
  });
  return { damage, pushes, d, targets };
}
assert.equal(
  resolveAt(10, 3, "normal", [
    [70, 0],
    [0, 75],
  ]).damage.length,
  1,
); // on ray vs between rays
assert.equal(resolveAt(12, 1, "normal", [[10, 0]]).pushes[0], 23);
assert(
  resolveAt(20, 20, "normal", [[0, 0]]).damage[0][1] >
    10 * resolveAt(20, 1, "normal", [[0, 0]]).damage[0][1],
);
assert.equal(
  resolveAt(6, 2, "electricidad", [
    [20, 0],
    [70, 0],
    [120, 0],
  ]).damage.length,
  3,
);
assert.equal(resolveAt(6, 2, "hielo", [[0, 0]]).targets[0].freezeTimer, 1);
assert.equal(resolveAt(6, 2, "distorsión", [[10, 0]]).pushes[0], -19);
console.log("OK fragment rays, interruption, D20 tiers, chain, frost, pull");
