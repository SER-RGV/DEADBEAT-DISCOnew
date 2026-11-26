// Event-level checks without browser or timing dependencies.
const assert = require("node:assert/strict");
global.window = global;
require("../../src/dd_dice_feedback.js");
const fx = DD_DICE_FEEDBACK;
const ranks = [],
  sound = (n) => ranks.push(n),
  target = { x: 20, y: 1, hp: 100, r: 9 };
const d = { id: 20, face: 20, state: "FLIGHT", x: 2, y: 1, castAngle: 0 };
fx.impact(target, 0, d, "fisico", false, sound);
assert.deepEqual(ranks, []);
for (const loss of [1, 4, 11]) {
  fx.impact(target, loss, d, "fisico", false, sound);
  fx.tick(0.1);
}
d.state = "RESOLVING";
for (let i = 0; i < 90; i++) fx.impact(target, 17, d, "hielo", false, sound);
assert.deepEqual(ranks, [0, 1, 2, 3]);
fx.tick(0.016);
assert.equal(fx.poseClock(target, 5), 4.984);
let strokes = 0;
const g = new Proxy(
  {},
  { get: (_, k) => (k === "stroke" ? () => strokes++ : () => {}) },
);
fx.draw(g);
assert.equal(strokes, 24); // twelve slots, two strokes per critical
fx.tick(0.1);
fx.tick(0.1);
strokes = 0;
fx.draw(g);
assert.equal(strokes, 0);
assert.equal(fx.poseClock(target, 5), 5);
fx.reset();
console.log(
  "PASS actual damage tiers, no kinetic critical, sound budget, local pose hold, bounded + expired FX",
);
require("../../src/dd_dice_geometry");
require("../../src/dd_dice_rules");
require("../../src/dd_dice");
const signals = [],
  p = { x: 0, y: 0, aimAngle: 0 },
  w = {
    rand: () => 0.5,
    targets: () => [],
    collide() {},
    sound() {},
    blast() {},
    signal: (e) => signals.push(e),
  };
for (let n = 0; n < 200; n++) DD_DICE.update(1 / 60, p, true, false, w);
assert.deepEqual(signals, ["wind", "full"]);
DD_DICE.update(1 / 60, p, false, false, w);
assert.equal(DD_DICE.d.state, "RELEASE");
for (let n = 0; n < 200; n++) DD_DICE.update(1 / 60, p, false, false, w);
assert.deepEqual(signals, ["wind", "full", "flight", "catch"]);
DD_DICE.update(0.016, p, true, false, w);
DD_DICE.cancelAim();
DD_DICE.update(0.016, p, false, false, w);
assert.equal(DD_DICE.d.state, "READY");
console.log(
  "PASS transition cues occur exactly once; cancellation does not launch",
);
