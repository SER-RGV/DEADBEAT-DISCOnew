// Bind sockets only AFTER RG2 has finished routing. This companion plan is not
// a source of combat state or a replacement polygon for the convex native solver.
const prefabSides = ["top", "right", "bottom", "left"];
function bindPrefabs(plan) {
  const houses = ["nave-quebrada", "palco-profundo", "pasillo-servicio"],
    calm = ["shop", "rest", "special", "secret", "supersecret"],
    byType = { boss: "arena-octogono", challenge: "pasillo-servicio" };
  for (const n of plan.nodes) {
    const pick = stream(plan.seed, plan.floor, "prefab-v1:" + n.key);
    // Houses vary by purpose: the resident gets the octagon, service and calm
    // rooms get the long corridor and the small booth; the rest draw a house.
    const template =
      byType[n.type] ||
      (n.shop || calm.includes(n.type)
        ? "camarote"
        : houses[Math.floor(pick() * houses.length)]),
      connections = n.links.map(({ side, to }) => ({ side, to, lift: false }));
    if (n.local === 10 && !n.shop && plan.floor < 9) {
      const side = prefabSides.find(
        (s) => !connections.some((c) => c.side === s),
      );
      if (!side) throw Error("no lift socket");
      connections.push({ side, to: "floor" + (plan.floor + 1), lift: true });
    }
    n.prefab = { version: prefabCatalog.version, template, connections };
  }
  return plan;
}
function instantiatePrefab(node) {
  const spec = prefabCatalog.templates[node.prefab.template],
    loop = spec.perimeter;
  const edges = loop.map(([id, x, y, height], i) => {
    const [, u, v] = loop[(i + 1) % loop.length],
      dx = u - x,
      dy = v - y,
      len = Math.hypot(dx, dy);
    return {
      id,
      height,
      a: { x, y },
      dx,
      dy,
      len,
      nx: -dy / len,
      ny: dx / len,
    };
  });
  const edge = (id) => {
    const e = edges.find((e) => e.id === id);
    if (!e) throw Error("missing anchor " + id);
    return e;
  };
  const point = (e, t, inset) => ({
    x: e.a.x + t * e.dx + e.nx * inset,
    y: e.a.y + t * e.dy + e.ny * inset,
  });
  const doors = node.prefab.connections.map((d) => {
    const e = edge(spec.sockets[d.side]),
      p = point(e, 0.5, 0);
    return { ...d, wallX: p.x, wallY: p.y, edge: e };
  });
  const mesh = compileArchitecture({
    key: node.key,
    edges,
    doors,
    props: [],
    spawns: [],
  });
  const cardinal = [
    [0, 1, "S"],
    [-1, 0, "W"],
    [0, -1, "N"],
    [1, 0, "E"],
  ];
  const placements = spec.placements.map((p) => {
    const e = edge(p.edge),
      asset = prefabCatalog.assets[p.asset],
      anchor = point(e, p.t, p.inset);
    const front =
      p.facing === "inward"
        ? cardinal.find(([x, y]) => x === e.nx && y === e.ny)
        : cardinal.find((v) => v[2] === p.facing);
    if (!front) throw Error("mount needs an authored cardinal view: " + p.id);
    const [nx, ny, view] = front,
      foot = asset.footprint;
    const reach = foot.kind === "rect" ? foot.h / 2 : foot.r;
    const width =
      foot.kind === "rect" ? foot.w : 2 * (foot.r + (foot.halfLength || 0));
    const elevation =
      spec.decks.find(
        (d) =>
          anchor.x >= d.x &&
          anchor.x <= d.x + d.w &&
          anchor.y >= d.y &&
          anchor.y <= d.y + d.h,
      )?.rise || 0;
    return {
      id: p.id,
      asset: p.asset,
      anchor,
      segment: e.id,
      elevation,
      view,
      yaw:
        ((cardinal.indexOf(front) -
          cardinal.findIndex((v) => v[2] === asset.nativeFront) +
          4) %
          4) *
        90,
      normal: { x: nx, y: ny },
      // Use the view facing `view`, never rotate an upright painted bitmap.
      collider: { ...foot, angle: (cardinal.indexOf(front) * Math.PI) / 2 },
      solid: asset.solid,
      destructible: asset.destructible,
      artSize: {
        w: asset.sizePlayers[0] * prefabCatalog.playerArtWidth,
        h: asset.sizePlayers[1] * prefabCatalog.playerArtHeight,
      },
      shadow: { rx: width * 0.43, ry: reach * 0.55 },
      sortY: anchor.y + (ny ? reach : width / 2),
      frontBand: p.readingDepth
        ? {
            center: {
              x: anchor.x + nx * (reach + p.readingDepth / 2),
              y: anchor.y + ny * (reach + p.readingDepth / 2),
            },
            width,
            depth: p.readingDepth,
            normal: { x: nx, y: ny },
          }
        : null,
      action: null,
    };
  });
  return {
    key: node.key,
    template: node.prefab.template,
    walls: mesh.walls.map((w) => ({
      ...w,
      segment: edges[w.edge].id,
      height: edges[w.edge].height,
    })),
    openings: mesh.openings,
    placements,
    decks: spec.decks.map((d) => ({
      ...d,
      treads: Array.from({ length: d.steps }, (_, i) => ({
        x: d.x,
        y: d.y + d.h + (i * d.run) / d.steps,
        w: d.w,
        h: d.run / d.steps,
        z: d.rise * (1 - i / d.steps),
        riser: d.rise / d.steps,
      })),
    })),
    hazardSource: mesh.hazardSource,
  };
}
