const assert = require("node:assert/strict"),
  {
    generate,
    bindPrefabs,
    instantiatePrefab,
  } = require("../prefabs/inspect.cjs");
let count = 0;
const routed = new Set();
for (const seed of [0, 1, 2, 7, 51, 4294967295])
  for (let f = 0; f < 10; f++) {
    const plan = generate(seed, f),
      before = JSON.stringify(plan);
    bindPrefabs(plan);
    for (const n of plan.nodes) {
      const m = instantiatePrefab(n),
        lift = n.local === 10 && !n.shop && f < 9;
      assert.equal(m.openings.length, n.links.length + Number(lift));
      for (const g of m.openings) {
        const j = ["top", "right", "bottom", "left"].indexOf(g.side);
        if (!g.lift) {
          const dst = plan.nodes.find((v) => v.key === g.to);
          assert(
            dst.prefab.connections.some(
              (d) =>
                d.to === n.key &&
                d.side === ["bottom", "left", "top", "right"][j],
            ),
          );
        } else assert.equal(g.to, "floor" + (f + 1));
        assert.equal(
          Math.hypot(
            g.threshold[1].x - g.threshold[0].x,
            g.threshold[1].y - g.threshold[0].y,
          ),
          170,
        );
        // Validate the cardinal landing-to-centre corridors (conservative expanded AABBs).
        const k = m.template + g.side;
        if (!routed.has(k)) {
          routed.add(k);
          const poly =
            require("../../src/room_generation/prefabs/catalog.json").templates[
              m.template
            ].perimeter;
          // Corridors must reach this house's own centre, not a shared constant.
          const mid = {
            x: Math.max(...poly.map((p) => p[1])) / 2,
            y: Math.max(...poly.map((p) => p[2])) / 2,
          };
          const legs = [
            g.origin,
            g.landing,
            j % 2 ? { x: mid.x, y: g.landing.y } : { x: g.landing.x, y: mid.y },
            mid,
          ];
          for (let l = 1; l < legs.length; l++)
            for (let t = 0; t <= 1; t += 0.025) {
              const x = legs[l - 1].x + (legs[l].x - legs[l - 1].x) * t,
                y = legs[l - 1].y + (legs[l].y - legs[l - 1].y) * t;
              if (l === 1 && t < 0.15) continue;
              for (const dx of [-18, 18])
                for (const dy of [-18, 18]) {
                  let inside = false;
                  for (
                    let i = 0, j = poly.length - 1;
                    i < poly.length;
                    j = i++
                  ) {
                    const [, a, b] = poly[i],
                      [, c, d] = poly[j];
                    if (
                      b > y + dy !== d > y + dy &&
                      x + dx < ((c - a) * (y + dy - b)) / (d - b) + a
                    )
                      inside = !inside;
                  }
                  assert(inside, k);
                }
              for (const p of m.placements.filter((p) => p.solid)) {
                const r =
                  p.collider.rad ??
                  (p.collider.r || 0) + (p.collider.halfLength || 0);
                const br = Math.max(
                  r,
                  Math.hypot(p.collider.w || 0, p.collider.h || 0) / 2,
                );
                assert(Math.hypot(x - p.anchor.x, y - p.anchor.y) > br + 18, k);
              }
            }
        }
      }
      for (const p of m.placements) {
        assert(p.yaw % 90 === 0 && p.action === null);
        assert(p.artSize.h > 0 && Number.isFinite(p.sortY));
      }
      count++;
    }
    for (const n of plan.nodes) delete n.prefab;
    assert.equal(JSON.stringify(plan), before);
  }
const houses = Object.keys(
  require("../../src/room_generation/prefabs/catalog.json").templates,
).length;
// Every house must have all four approach corridors routed and clear.
assert.equal(routed.size, houses * 4);
console.log(
  "PASS",
  count,
  "prefab instances, 60 floors, reciprocal sockets, lift,",
  houses * 4,
  "clear approach corridors in",
  houses,
  "houses and unchanged RG2 payload",
);
