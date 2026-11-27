// Populate the existing native room installer only for the commissioned rooms.
// The solver already supports concave Rs.poly (ig/js/Qs/sg); no extra physics.
const playableCache = new WeakMap();
function playableRoom(node) {
  // Retain the authored Hangar pilot rather than painting over its native mesh.
  if (node.floor === 0 && node.key === "r0") return null;
  if (playableCache.has(node)) return playableCache.get(node);
  const mesh = instantiatePrefab(node),
    spec = prefabCatalog.templates[node.prefab.template];
  const w = Math.max(...spec.perimeter.map((v) => v[1])),
    h = Math.max(...spec.perimeter.map((v) => v[2]));
  const sockets = Object.fromEntries(
    Object.entries(spec.sockets).map(([side, id]) => [
      side,
      spec.perimeter.findIndex((v) => v[0] === id),
    ]),
  );
  const compiled = {
    mesh,
    sockets,
    geometry: {
      ...node.geometry,
      w,
      h,
      pts: spec.perimeter.map(([, x, y]) => [x / w, y / h]),
      center: [0.5, 0.5],
    },
  };
  playableCache.set(node, compiled);
  return compiled;
}
