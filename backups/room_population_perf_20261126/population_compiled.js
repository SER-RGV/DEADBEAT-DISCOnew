// Experimental, version-gated population adapter; legacy plans remain unchanged.
// Coordinates in the public population remain normalized; collision tests use
// world units. Native runtime collision/spawn filters remain authoritative.
function populationCompiledSafe(x, y, radius, geometry, mesh) {
  if (![x, y, radius, geometry.w, geometry.h].every(Number.isFinite) || radius < 0) return false;
  const px = x * geometry.w, py = y * geometry.h, pts = geometry.pts;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const ax = pts[j][0] * geometry.w, ay = pts[j][1] * geometry.h;
    const bx = pts[i][0] * geometry.w, by = pts[i][1] * geometry.h;
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    if (!len2) return false;
    if ((ay > py) !== (by > py) && px < ax + (py - ay) * dx / dy) inside = !inside;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    if (Math.hypot(px - ax - t * dx, py - ay - t * dy) < radius) return false;
  }
  if (!inside) return false;
  for (const p of mesh.placements) {
    if (!p.solid) continue;
    const c = p.collider, dx = px - p.anchor.x, dy = py - p.anchor.y;
    const cs = Math.cos(c.angle || 0), sn = Math.sin(c.angle || 0);
    const lx = dx * cs + dy * sn, ly = -dx * sn + dy * cs;
    let distance;
    if (c.kind === 'circle') distance = Math.hypot(lx, ly) - c.r;
    else if (c.kind === 'capsule') distance = Math.hypot(Math.max(0, Math.abs(lx) - c.halfLength), ly) - c.r;
    else if (c.kind === 'rect') {
      // Native ec() expands each half-extent by the radius (square corners).
      if (Math.abs(lx) < c.w / 2 + radius && Math.abs(ly) < c.h / 2 + radius) return false;
      continue;
    }
    else throw Error('unsupported prefab collider: ' + c.kind);
    if (distance < radius) return false;
  }
  // Conservative doorway exclusion; runtime also checks its own gap geometry.
  for (const o of mesh.openings)
    if (Math.hypot(px - o.origin.x, py - o.origin.y) < o.useRadius + radius) return false;
  return true;
}
function adaptPopulationCompiled(population, compiled) {
  const {geometry, mesh} = compiled;
  function safe(p, radius, offsets = [0]) {
    return offsets.every(dx => populationCompiledSafe(p.x + dx / geometry.w, p.y, radius, geometry, mesh));
  }
  function relocate(p, radius, offsets) {
    if (safe(p, radius, offsets)) return {...p};
    let best = null, bestDist = Infinity;
    // Deterministic fixed grid, selected nearest to the original proposal.
    for (let y = 0.05; y < 1; y += 0.025) for (let x = 0.05; x < 1; x += 0.025) {
      const d = ((x - p.x) * geometry.w) ** 2 + ((y - p.y) * geometry.h) ** 2;
      if (d < bestDist && safe({x, y}, radius, offsets)) {best = {x, y}; bestDist = d;}
    }
    if (!best) throw Error('no safe candidate for compiled prefab');
    return {...p, ...best};
  }
  return {
    ...population,
    // Props are not installed for prefab rooms; leave these legacy proposals intact.
    props: population.props.map(p => ({...p})),
    spawns: population.spawns.map(p => relocate(p, 36, [0])),
    // Native reward code may place rewards at -80, 0 and +80 px.
    reward: relocate(population.reward, 36, [-80, 0, 80]),
  };
}
function validatePopulationCompiled(population, compiled) {
  const {geometry, mesh} = compiled;
  for (const p of population.spawns)
    if (!populationCompiledSafe(p.x, p.y, 36, geometry, mesh))
      throw Error('unsafe compiled spawn');
  for (const dx of [-80, 0, 80])
    if (!populationCompiledSafe(population.reward.x + dx / geometry.w, population.reward.y, 36, geometry, mesh))
      throw Error('unsafe compiled reward');
  return population;
}
if (typeof module !== 'undefined' && module.exports)
  module.exports = { populationCompiledSafe, adaptPopulationCompiled, validatePopulationCompiled };
