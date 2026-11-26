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
// Keep the original floating-point grid order exactly, with a tiny immutable
// axis table instead of retaining per-template/per-room candidate caches.
const populationCompiledAxis = [];
for (let v = 0.05; v < 1; v += 0.025) populationCompiledAxis.push(v);
Object.freeze(populationCompiledAxis);
function adaptPopulationCompiled(population, compiled) {
  const {geometry, mesh} = compiled;
  function safe(p, radius, offsets = [0]) {
    return offsets.every(dx => populationCompiledSafe(p.x + dx / geometry.w, p.y, radius, geometry, mesh));
  }
  function relocate(p, radius, offsets) {
    if (safe(p, radius, offsets)) return {...p};
    let best = null, bestDist = Infinity;
    const axis = populationCompiledAxis;
    const nearest = value => axis.reduce((best, v, i) => Math.abs(v - value) < Math.abs(axis[best] - value) ? i : best, 0);
    const cx = nearest(p.x), cy = nearest(p.y);
    // Find a nearby safe upper bound first; no candidate list survives this call.
    for (let ring = 0; ring < axis.length && !best; ring++) {
      for (let iy = Math.max(0, cy - ring); iy <= Math.min(axis.length - 1, cy + ring) && !best; iy++)
        for (let ix = Math.max(0, cx - ring); ix <= Math.min(axis.length - 1, cx + ring); ix++) {
          if (Math.max(Math.abs(ix - cx), Math.abs(iy - cy)) !== ring) continue;
          const x = axis[ix], y = axis[iy];
          if (safe({x, y}, radius, offsets)) {
            best = {x, y};
            bestDist = ((x - p.x) * geometry.w) ** 2 + ((y - p.y) * geometry.h) ** 2;
            break;
          }
        }
    }
    // Verify the true nearest point and preserve the original row-major tie.
    for (const y of axis) for (const x of axis) {
      const d = ((x - p.x) * geometry.w) ** 2 + ((y - p.y) * geometry.h) ** 2;
      if ((d < bestDist || (d === bestDist && best && (y < best.y || (y === best.y && x < best.x)))) && safe({x, y}, radius, offsets)) {
        best = {x, y}; bestDist = d;
      }
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
