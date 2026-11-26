function validate(plan) {
  const { nodes, floor } = plan,
    keys = new Map(nodes.map((n) => [n.key, n]));
  const fail = (msg) => {
    throw Error(`RG ${plan.seed}/${floor}: ${msg}`);
  };
  if (
    nodes.length !== (floor === 9 ? 1 : 12) ||
    keys.size !== nodes.length ||
    new Set(nodes.map((n) => `${n.x},${n.y}`)).size !== nodes.length
  )
    fail("duplicate or missing room");
  for (const n of nodes) {
    if (new Set(n.links.map((l) => l.side)).size !== n.links.length)
      fail("shared door");
    for (const l of n.links) {
      const dst = keys.get(l.to),
        i = axes.findIndex((a) => a[2] === l.side);
      if (
        !dst ||
        i < 0 ||
        dst.x !== n.x + axes[i][0] ||
        dst.y !== n.y + axes[i][1] ||
        !dst.links.some(
          (back) => back.to === n.key && back.side === axes[(i + 2) % 4][2],
        )
      )
        fail("broken link " + n.key);
    }
    const { w, h, pts } = n.geometry;
    for (const [x, y, rad] of [
      [0.5, 0.5, 36],
      ...[...n.population.spawns, n.population.reward].map((p) => [
        p.x,
        p.y,
        36,
      ]),
      ...n.population.props.map((p) => [p.x, p.y, 50]),
    ]) {
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i],
          b = pts[(i + 1) % pts.length],
          dx = (b[0] - a[0]) * w,
          dy = (b[1] - a[1]) * h;
        if (
          (dx * (y - a[1]) * h - dy * (x - a[0]) * w) / Math.hypot(dx, dy) <
          rad
        )
          fail("unsafe point " + n.key);
      }
    }
    for (const p of n.population.spawns)
      if (
        n.population.props.some(
          (v) => Math.hypot((v.x - p.x) * w, (v.y - p.y) * h) < 76,
        )
      )
        fail("spawn intersects cover");
  }
  for (const optional of [true, false]) {
    const allowed = nodes.filter(
        (n) => optional || !["secret", "supersecret", "shop"].includes(n.type),
      ),
      seen = new Set([nodes[0].key]),
      q = [nodes[0]];
    for (const n of q)
      for (const l of n.links) {
        const dst = keys.get(l.to);
        if (!seen.has(dst.key) && allowed.includes(dst)) {
          seen.add(dst.key);
          q.push(dst);
        }
      }
    if (seen.size !== allowed.length || !q.some((n) => n.type === "boss"))
      fail("unreachable");
  }
  return plan;
}
