const axes = [
  [1, 0, "right"],
  [0, 1, "bottom"],
  [-1, 0, "left"],
  [0, -1, "top"],
];
function generate(seed, floor) {
  if (!Number.isInteger(floor) || floor < 0 || floor > 9)
    throw RangeError("floor must be 0…9");
  const rng = stream(seed, floor, "routing"),
    nodes = [],
    occupied = new Set();
  function add(local, x, y, type) {
    const shop = type === "shop",
      index = floor === 9 ? 99 : floor * 11 + local;
    const n = {
      key: shop ? "s" + floor : "r" + index,
      index,
      local,
      floor,
      x,
      y,
      type,
      shop,
      links: [],
      geometry: room(seed, floor, local, type),
      population: populate(seed, floor, local, type),
    };
    occupied.add(`${x},${y}`);
    nodes.push(n);
    return n;
  }
  function link(a, b) {
    const i = axes.findIndex(([x, y]) => a.x + x === b.x && a.y + y === b.y);
    a.links.push({ side: axes[i][2], to: b.key });
    b.links.push({ side: axes[(i + 2) % 4][2], to: a.key });
  }
  const start = add(0, 0, 0, floor === 9 ? "boss" : "start");
  if (floor < 9) {
    // A guaranteed alternate path through the opening quartet. Grow the rest
    // from its live perimeter rather than retrying complete maps until one fits.
    const u = Math.floor(rng() * 4),
      v = (u + (rng() < 0.5 ? 1 : 3)) % 4,
      [x, y] = axes[u],
      [dx, dy] = axes[v];
    const a = add(1, x, y, "combat"),
      b = add(2, x + dx, y + dy, "challenge"),
      c = add(3, dx, dy, "event");
    link(start, a);
    link(a, b);
    link(b, c);
    link(c, start);
    function grow(local, type, parents) {
      const sites = parents
        .flatMap((n) => axes.map(([dx, dy]) => [n, n.x + dx, n.y + dy]))
        .filter(([, x, y]) => !occupied.has(`${x},${y}`));
      const [n, x, y] = pick(rng, sites);
      const next = add(local, x, y, type);
      link(n, next);
      return next;
    }
    grow(4, "combat", nodes.slice(1));
    grow(5, "elite", nodes.slice(2));
    grow(6, "treasure", nodes.slice(2));
    const core = nodes.slice();
    grow(
      9,
      pick(stream(seed, floor, "vip"), ["rest", "rest", "special"]),
      core,
    );
    // Attach the boss to the most distant exposed mandatory node (never behind a secret).
    const depth = new Map([[start.key, 0]]),
      queue = [start];
    for (const n of queue)
      for (const l of n.links)
        if (!depth.has(l.to)) {
          depth.set(l.to, depth.get(n.key) + 1);
          queue.push(nodes.find((p) => p.key === l.to));
        }
    const rim = nodes.filter((n) =>
      axes.some(([x, y]) => !occupied.has(`${n.x + x},${n.y + y}`)),
    );
    grow(
      10,
      "boss",
      rim.filter(
        (n) =>
          depth.get(n.key) === Math.max(...rim.map((p) => depth.get(p.key))),
      ),
    );
    grow(7, "secret", core);
    grow(8, "supersecret", core);
    grow(11, "shop", core);
  }
  const ordered = [start];
  start.depth = 0;
  for (const n of ordered)
    for (const l of n.links) {
      const dst = nodes.find((p) => p.key === l.to);
      if (dst.depth === undefined) {
        dst.depth = n.depth + 1;
        ordered.push(dst);
      }
    }
  for (const n of nodes)
    n.waveScale =
      n.type === "challenge"
        ? 1.12 + Math.min(0.16, n.depth * 0.02 + floor * 0.01)
        : 1;
  const xs = nodes.map((n) => n.x),
    ys = nodes.map((n) => n.y);
  return validate({
    version: VERSION,
    seed: seed >>> 0,
    floor,
    nodes,
    bounds: {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    },
  });
}
