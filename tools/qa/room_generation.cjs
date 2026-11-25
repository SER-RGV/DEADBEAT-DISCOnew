const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const dir = path.resolve(__dirname, "../../src/room_generation");
const { generate, validate } = Function(
  ["seed", "rooms", "population", "floor", "validate"]
    .map((n) => fs.readFileSync(path.join(dir, n + ".js"), "utf8"))
    .join("\n") + ";return {generate,validate};",
)();
let maps = 0,
  rooms = 0;
const shapes = new Set(),
  types = new Set(),
  layouts = new Set();
for (const seed of [...Array(100).keys(), 2147483647, 2147483648, 4294967295])
  for (let f = 0; f <= 9; f++) {
    const plan = generate(seed, f);
    maps++;
    rooms += plan.nodes.length;
    assert.deepEqual(generate(seed, f), plan);
    if (!f) layouts.add(JSON.stringify(plan.nodes.map((n) => [n.x, n.y])));
    for (const n of plan.nodes) {
      types.add(n.type);
      shapes.add(n.geometry.base);
      if (n.type.includes("secret") || n.shop) assert.equal(n.links.length, 1);
    }
    if (f < 9) {
      assert.equal(plan.nodes.find((n) => n.type === "elite").local, 5);
      assert.equal(plan.nodes.find((n) => n.type === "boss").local, 10);
      assert(
        plan.nodes.reduce((sum, n) => sum + n.links.length, 0) >=
          plan.nodes.length * 2,
      );
    }
  }
assert.equal(types.size, 12);
assert(layouts.size >= 100);
assert.throws(() => generate(1, -1));
assert.throws(() => generate(1, 10));
const bad = generate(0, 0);
bad.nodes[0].links.pop();
assert.throws(() => validate(bad));
console.log({
  maps,
  rooms,
  distinctFirstFloors: layouts.size,
  types: types.size,
  templates: shapes.size,
});
