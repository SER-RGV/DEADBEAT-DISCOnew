// 2.8 opt-in: keep the decorative staircase within the floor perimeter.
// Derived templates only: previous versions and collision geometry remain intact.
function repairPrefabStairs(plan) {
  repairCircleDecks(plan);
  for (const node of plan.nodes) {
    if (node.floor === 0 && node.key === 'r0') continue;
    const base = node.prefab.template;
    const target = base.startsWith('pasillo-servicio--') ? 'pasarela' :
      base.startsWith('arena-octogono--') ? 'tarima' : null;
    if (!target) continue;
    const id = base + '--escalera-interior';
    if (!prefabCatalog.templates[id]) {
      const spec = prefabCatalog.templates[base];
      if (!spec || !spec.decks.some(d => d.id === target)) throw Error('missing staircase deck: ' + base);
      prefabCatalog.templates[id] = {...spec, decks: spec.decks.map(d => d.id === target ? {...d, y: d.y - 60} : {...d})};
    }
    node.prefab = {...node.prefab, template: id};
  }
  return plan;
}
