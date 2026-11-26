const fs = require("node:fs"),
  assert = require("node:assert/strict");
global.window = {};
require("../../src/dd_hub_layout.js");
const old = window.DD_HUB_LAYOUT,
  L = Function(
    fs.readFileSync(
      require.resolve("../../previews/vestibulo/organic.js"),
      "utf8",
    ) + ";return organicVestibule;",
  )()(old);
assert.deepEqual(
  L.stations.map((s) => s.id),
  old.stations.map((s) => s.id),
);
assert.equal(L.stations.at(-1).area, L.gate);
assert(!L.fits(L.bounds.x + 20, L.bounds.y + 20, 9));
assert.equal(L.walls[0].c.x, L.gate.x);
assert.equal(L.walls[1].a.x, L.gate.x + L.gate.w);
const relief = Function(
  fs.readFileSync(
    require.resolve("../../previews/vestibulo/relief.js"),
    "utf8",
  ) + ";return previewRelief",
)()(L);
for (const stage of relief.stages) {
  const heights = new Set();
  for (let y = stage.y; y <= stage.y + stage.h + stage.run + 1; y++)
    heights.add(relief.elevation(stage.x + stage.w / 2, y));
  assert.equal(heights.size, stage.n + 1);
}
for (const s of L.stations.filter((s) => s.base)) {
  const a = s.area,
    b = s.base;
  assert(
    s.front === "S"
      ? a.y === b.y + b.h
      : s.front === "W"
        ? a.x + a.w === b.x
        : a.x === b.x + b.w,
  );
}
const seen = new Set(),
  found = new Set(),
  q = [L.spawn];
for (let i = 0; i < q.length; i++) {
  const { x, y } = q[i],
    key = `${x},${y}`;
  if (seen.has(key)) continue;
  seen.add(key);
  if (
    !L.fits(x, y, 9) ||
    L.solids.some(
      (r) =>
        Math.hypot(
          x - Math.max(r.x, Math.min(x, r.x + r.w)),
          y - Math.max(r.y, Math.min(y, r.y + r.h)),
        ) < 9,
    )
  )
    continue;
  for (const s of L.stations) if (L.contains(s.area, x, y)) found.add(s.id);
  for (const [dx, dy] of [
    [10, 0],
    [-10, 0],
    [0, 10],
    [0, -10],
  ])
    if (
      Math.abs(relief.elevation(x + dx, y + dy) - relief.elevation(x, y)) <= 6
    )
      q.push({ x: x + dx, y: y + dy });
}
assert.equal(found.size, 16);
console.log(
  "PASS polygon perimeter, north cut and 16 reachable station fronts",
);
