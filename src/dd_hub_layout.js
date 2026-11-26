/* Greybox compilation. Author in floor-plan units; consumers use world space. */
window.DD_HUB_LAYOUT = (() => {
  const bounds = { x: 130, y: 145, w: 1560, h: 950 },
    radius = 18;
  const rect = (x, y, w, h) => ({ x: x + bounds.x, y: y + bounds.y, w, h });
  const right = (r) => r.x + r.w,
    bottom = (r) => r.y + r.h;
  const contains = (r, x, y) =>
    x >= r.x && x <= right(r) && y >= r.y && y <= bottom(r);
  const gate = rect(692, 0, 176, 84),
    lane = rect(50, 380, 530, 330);
  const walls = [
    { x: bounds.x - 24, y: bounds.y - 24, w: gate.x - bounds.x + 24, h: 24 },
    {
      x: right(gate),
      y: bounds.y - 24,
      w: right(bounds) - right(gate) + 24,
      h: 24,
    },
    rect(-24, 0, 24, bounds.h),
    rect(bounds.w, 0, 24, bounds.h),
    rect(-24, bounds.h, bounds.w + 48, 24),
  ];
  const jambs = [gate.x - 12, right(gate)].map((x) => ({
    x,
    y: gate.y,
    w: 12,
    h: gate.h,
  }));
  // Mounting on N fixes the facing; detached furniture explicitly specifies its front.
  const rows = [
    ["armory", "Dados", 120, 0, "N"],
    ["upgrades", "Mejoras", 365, 0, "N"],
    ["armorer", "Armera", 250, 220, "S"],
    ["practice", "Ensayo", 425, 395, "S"],
    ["workshop", "Taller", 230, 805, "E"],
    ["dj", "Tempo", 1090, 0, "N"],
    ["mix", "Mezcla", 1340, 0, "N"],
    ["bar", "Barra", 1030, 308, "S"],
    ["rest", "Lounge", 1350, 368, "W"],
    ["map", "Mesa Astral", 975, 556, "S"],
    ["ledger", "Hallazgos", 1170, 556, "S"],
    ["gallery", "Galería", 1370, 556, "S"],
    ["bedroom", "Habitación", 1000, 782, "S"],
    ["keepsake", "Recuerdos", 1320, 782, "S"],
    ["prepare", "Preparación", 465, 844, "E"],
  ];
  const stations = rows.map(([id, label, x, y, side]) => {
    const front = side === "N" ? "S" : side,
      base = rect(x, y, 116, 42),
      depth = 68;
    const area =
      front === "S"
        ? { ...base, y: bottom(base), h: depth }
        : front === "E"
          ? { ...base, x: right(base), w: depth }
          : { ...base, x: base.x - depth, w: depth };
    return { id, label, base, front, area };
  });
  stations.push({
    id: "descent",
    label: "Grieta del Refugio · Círculo I · Limbo",
    area: gate,
  });
  const solids = [
    ...jambs,
    ...stations.filter((s) => s.base).map((s) => s.base),
  ];
  function walkable(x, y) {
    return (
      x >= bounds.x + radius &&
      x <= right(bounds) - radius &&
      y >= bounds.y + radius &&
      y <= bottom(bounds) - radius &&
      solids.every(
        (r) =>
          Math.hypot(
            x - Math.max(r.x, Math.min(right(r), x)),
            y - Math.max(r.y, Math.min(bottom(r), y)),
          ) >= radius,
      )
    );
  }
  const targets = [455, 545, 635].map((y) => ({
    x: bounds.x + 90,
    y: bounds.y + y,
    r: 19,
  }));
  return {
    bounds,
    radius,
    spawn: { x: bounds.x + 780, y: bounds.y + 832 },
    gate,
    lane,
    walls,
    jambs,
    stations,
    solids,
    targets,
    contains,
    walkable,
  };
})();
