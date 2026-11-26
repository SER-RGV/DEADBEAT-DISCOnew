// Local design variant. The greybox and its persisted station identifiers stay untouched.
function organicVestibule(ref) {
  const b = ref.bounds,
    pt = ([x, y]) => ({ x: x + b.x, y: y + b.y });
  const outline = [
    [610, 0],
    [950, 0],
    [950, 76],
    [1390, 76],
    [1390, 166],
    [1510, 166],
    [1510, 332],
    [1430, 332],
    [1430, 440],
    [1560, 440],
    [1560, 680],
    [1460, 680],
    [1460, 830],
    [1310, 830],
    [1310, 885],
    [1010, 885],
    [1010, 820],
    [890, 820],
    [890, 950],
    [640, 950],
    [640, 875],
    [310, 875],
    [310, 770],
    [150, 770],
    [150, 678],
    [0, 678],
    [0, 365],
    [145, 365],
    [145, 286],
    [72, 286],
    [72, 95],
    [420, 95],
    [420, 156],
    [610, 156],
  ].map(pt);
  const gate = ref.gate,
    walls = [];
  const normals = outline.map((a, i) => {
    const c = outline[(i + 1) % outline.length];
    return { x: Math.sign(c.y - a.y) * 13, y: -Math.sign(c.x - a.x) * 13 };
  });
  const outer = outline.map((a, i) => {
    const p = normals[(i + outline.length - 1) % outline.length],
      n = normals[i];
    return { x: a.x + p.x + n.x, y: a.y + p.y + n.y };
  });
  outline.forEach((a, i) => {
    const j = (i + 1) % outline.length,
      c = outline[j],
      h =
        i === 0
          ? 64
          : a.y === b.y + 76
            ? 49
            : a.y >= b.y + 820
              ? 14
              : i % 3 === 0
                ? 31
                : 21;
    const segment = (a, c, oa, oc) =>
      walls.push({ a, c, h, cap: [a, c, oc, oa] });
    if (!i) {
      const l = { x: gate.x, y: a.y },
        r = { x: gate.x + gate.w, y: a.y };
      segment(a, l, outer[i], { x: l.x, y: l.y - 13 });
      segment(r, c, { x: r.x, y: r.y - 13 }, outer[j]);
    } else segment(a, c, outer[i], outer[j]);
  });
  // Dimensions are half-world units. A frontal sprite is authored facing south;
  // mount that asset against a north edge instead of rotating its vertical axis.
  const slots = {
    armory: [145, 95, 112, 22],
    upgrades: [328, 95, 56, 28],
    armorer: [235, 235, 82, 24],
    practice: [300, 397, 72, 24],
    workshop: [336, 725, 70, 30],
    dj: [1060, 76, 118, 34],
    mix: [1250, 76, 52, 25],
    bar: [1200, 236, 120, 28],
    rest: [1310, 505, 92, 32],
    map: [1010, 420, 90, 40],
    ledger: [1150, 559, 54, 24],
    gallery: [1454, 451, 48, 30],
    bedroom: [1080, 745, 98, 36],
    keepsake: [1260, 710, 60, 20],
    prepare: [478, 800, 62, 24],
  };
  const stations = ref.stations.map((s) => {
    if (!s.base) return { ...s, area: gate };
    const [x, y, w, h] = slots[s.id],
      base = { ...pt([x, y]), w, h };
    // North-wall mounts face the room. Radial workshop apparatus serves the east aisle;
    // the lounge opens west onto its approach, with its backrest to the east.
    const mount = walls.find(
      (w) =>
        w.a.y === base.y &&
        w.c.y === base.y &&
        w.a.x <= base.x &&
        w.c.x >= base.x + base.w,
    );
    // In this clockwise shell a rightward horizontal support has inward normal +Y.
    const front = mount
      ? "S"
      : ["workshop", "prepare"].includes(s.id)
        ? "E"
        : s.id === "rest"
          ? "W"
          : "S";
    return {
      ...s,
      base,
      front,
      area:
        front === "W"
          ? { ...base, x: base.x - 42, w: 42 }
          : front === "E"
            ? { ...base, x: base.x + w, w: 42 }
            : { ...base, y: base.y + h, h: 42 },
    };
  });
  function inside(x, y) {
    let hit = false;
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const a = outline[i],
        c = outline[j];
      if (
        a.y > y !== c.y > y &&
        x < ((c.x - a.x) * (y - a.y)) / (c.y - a.y) + a.x
      )
        hit = !hit;
    }
    return hit;
  }
  function fits(x, y, r) {
    return (
      inside(x, y) &&
      outline.every((a, i) => {
        const c = outline[(i + 1) % outline.length];
        return (
          Math.hypot(
            x - Math.max(Math.min(a.x, c.x), Math.min(Math.max(a.x, c.x), x)),
            y - Math.max(Math.min(a.y, c.y), Math.min(Math.max(a.y, c.y), y)),
          ) >= r
        );
      })
    );
  }
  return {
    ...ref,
    outline,
    walls,
    stations,
    fits,
    solids: [
      ...ref.jambs,
      ...stations.filter((s) => s.base).map((s) => s.base),
    ],
    lane: { ...pt([18, 375]), w: 426, h: 278 },
    targets: ref.targets.map((t) => ({ ...t, r: 13 })),
    spawn: pt([765, 895]),
  };
}
