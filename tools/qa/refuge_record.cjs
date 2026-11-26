const assert = require("node:assert/strict");
global.window = global;
const data = new Map();
global.localStorage = {
  getItem: (k) => data.get(k) ?? null,
  setItem: (k, v) => data.set(k, v),
};
require("../../src/dd_refuge_record");
const r = DD_REFUGE_RECORD;
for (const broken of [
  "{",
  "null",
  "[]",
  '{"v":1,"repairs":-9,"talks":{"bar":"9"},"found":{"groove":1}}',
]) {
  data.set(r.key, broken);
  r.load();
  assert.equal(r.repairs, 0);
  assert.equal(r.snapshot().talks.bar, 0);
  assert.deepEqual(r.snapshot().found, {});
}
r.repair();
assert.equal(r.repairs, 0);
r.talk("armorer");
r.repair();
assert.equal(r.repairs, 1);
r.repair();
assert.equal(r.repairs, 1);
assert(r.discover("groove"));
assert.equal(r.discover("groove"), "");
r.repair();
r.load();
assert.equal(r.repairs, 2);
r.outcome(false);
assert.equal(r.event("dj", { achievements: [] }), "loss");
r.load();
assert.notEqual(r.event("dj", { achievements: [] }), "loss");
r.discover("sleeve");
r.discover("plate");
assert(r.reveal());
r.repair();
assert.equal(r.repairs, 2);
r.repair({ history: [{ score: 2 }] });
r.load();
assert.equal(r.repairs, 3);
data.set(r.key, '{"v":2,"future":123}');
r.load();
r.talk("bar");
assert.equal(data.get(r.key), '{"v":2,"future":123}');
console.log(
  "PASS legacy/malformed/future saves, restoration gates, discovery and event idempotence",
);
