// Review compiler. Native world coordinates, ordered convex shell, inward unit
// normals. No generator, input, caches or live collider mutations here.
function compileArchitecture({ key, edges, doors, props, spawns }) {
  const width = 170,
    jamb = 10,
    thickness = 24,
    depth = 86;
  const xy = (x, y) => ({ x, y }),
    openings = [],
    walls = [];
  const byEdge = edges.map(() => []);
  // Intersection of adjacent exterior offset lines: shared miter even on chamfers.
  const outer = edges.map((e, i) => {
    const p = edges[(i + edges.length - 1) % edges.length],
      k = thickness / (1 + p.nx * e.nx + p.ny * e.ny);
    if (!Number.isFinite(k)) throw Error("degenerate wall corner");
    return xy(e.a.x - k * (p.nx + e.nx), e.a.y - k * (p.ny + e.ny));
  });
  for (const d of doors) {
    const i = edges.indexOf(d.edge);
    if (i < 0) throw Error("door on stale shell: " + d.to);
    byEdge[i].push(d);
  }
  edges.forEach((e, i) => {
    const tx = e.dx / e.len,
      ty = e.dy / e.len;
    const point = (u, v) =>
      xy(e.a.x + tx * u + e.nx * v, e.a.y + ty * u + e.ny * v);
    const span = (a, b) => {
      if (b <= a) return;
      walls.push({
        edge: i,
        normal: xy(e.nx, e.ny),
        face: [point(a, 0), point(b, 0)],
        cap: [
          point(a, 0),
          point(b, 0),
          b === e.len ? outer[(i + 1) % edges.length] : point(b, -thickness),
          a === 0 ? outer[i] : point(a, -thickness),
        ],
      });
    };
    const cuts = byEdge[i]
      .map((d) => ({ d, u: (d.wallX - e.a.x) * tx + (d.wallY - e.a.y) * ty }))
      .sort((a, b) => a.u - b.u);
    let cursor = 0;
    for (const { d, u } of cuts) {
      const a = u - width / 2,
        b = u + width / 2;
      if (a - jamb < cursor + (cursor ? jamb : 0) || b + jamb > e.len)
        throw Error("portal or jamb does not fit: " + d.to);
      span(cursor, a);
      cursor = b;
      const strip = (l, r, v) => [
        point(l, 0),
        point(r, 0),
        point(r, v),
        point(l, v),
      ];
      openings.push({
        to: d.to,
        side: d.side,
        lift: !!d.lift,
        edge: i,
        origin: point(u, 0),
        normal: xy(e.nx, e.ny),
        tangent: xy(tx, ty),
        threshold: strip(a, b, depth),
        jambs: [strip(a - jamb, a, -thickness), strip(b, b + jamb, -thickness)],
        // Separate approach envelopes are deliberate native affordances, not extra doors.
        useRadius: 137,
        walkRadius: d.lift ? null : 86,
        landing: point(u, 150),
      });
    }
    span(cursor, e.len);
  });
  const fixtures = props.map((p) => ({
    name: p.name,
    style: p.style,
    anchor: xy(p.x, p.y),
    sortY: p.sortY,
    shape:
      p.kind === "rect"
        ? { kind: p.kind, w: p.w, h: p.h, angle: p.rot }
        : p.kind === "circle"
          ? { kind: p.kind, r: p.r }
          : { kind: p.kind, r: p.r, a: xy(p.ax, p.ay), b: xy(p.bx, p.by) },
    angle: p.kind === "rect" || p.kind === "circle" ? p.rot : p.capsA,
    solid: p.solid,
    tall: p.tall,
    onFloor: p.onFloor,
    broken: p.broken,
    destructible: p.destructible,
  }));
  return {
    key,
    walls,
    openings,
    fixtures,
    spawnCandidates: spawns.map((p) => xy(p.x, p.y)),
    hazardSource: "native-runtime",
  };
}
