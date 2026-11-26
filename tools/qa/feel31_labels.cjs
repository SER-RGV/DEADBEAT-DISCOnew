// A dense burst may recycle spark marks, but must not erase the only readable loss.
const assert = require("node:assert/strict");
global.window = global;
require("../../src/dd_dice_feedback.js");
const fx = DD_DICE_FEEDBACK,
  d = { id: 6, x: 0, y: 0, castAngle: 0 };
let labels = [];
const g = new Proxy(
  { fillText: (text) => labels.push(text) },
  { get: (o, k) => o[k] || (() => {}) },
);
for (let i = 0; i < 30; i++)
  fx.impact({ x: i, y: 0, hp: 15 }, 2.4, d, "fisico", false, () => {});
fx.draw(g);
assert.deepEqual(labels, ["2.4"]);
fx.reset();
labels = [];
fx.draw(g);
assert.deepEqual(labels, []);
console.log(
  "PASS one retained damage label for 30 simultaneous hits; cleared on reset",
);
