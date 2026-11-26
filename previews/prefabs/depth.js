// Reproducible art probes only: no movement commands or changes to the room data.
function prefabDepthProbe(room, focus, u) {
  const deck = room.decks[0],
    prop = room.placements.find((p) => p.id === focus),
    gate = room.openings.find((o) => o.to === focus);
  let x, y;
  if (gate) {
    const distance = 165 - 138 * u;
    x = gate.origin.x + distance * gate.normal.x;
    y = gate.origin.y + distance * gate.normal.y;
  } else if (prop && prop.elevation === 0) {
    // Axis-aligned extents of the oriented floor footprint, not of its bitmap.
    const c = prop.collider,
      quarter = Math.abs(Math.sin(c.angle)) > 0.5;
    const a = c.kind === "rect" ? c.w / 2 : c.r + (c.halfLength || 0),
      b = c.kind === "rect" ? c.h / 2 : c.r;
    const w = (quarter ? b : a) + 17,
      h = (quarter ? a : b) + 17;
    const side = prop.normal.x < 0 ? -1 : 1,
      d = u * (2 * w + 2 * h);
    x = prop.anchor.x;
    y = prop.anchor.y;
    if (d <= w) {
      x += side * d;
      y -= h;
    } else if (d <= w + 2 * h) {
      x += side * w;
      y += d - w - h;
    } else {
      x += side * (2 * w + 2 * h - d);
      y += h;
    }
  } else {
    x = deck.x + deck.w * 0.68;
    y = deck.y + deck.h + deck.run + 38 - u * (deck.h + deck.run + 14);
  }
  const inside = (r) => x >= r.x && x <= r.x + r.w && y >= r.y && y < r.y + r.h;
  const level = inside(deck) ? deck.rise : deck.treads.find(inside)?.z || 0;
  return { x, y, level };
}
