// Experimental proportions, derived from authored prefabs without rotating sprites.
// The slot is unique within a floor; the seeded bit supplies two proportions per
// room role over different seeds. This changes dimensions/aspect ratio, not art.
function bindPrefabVariants(plan) {
  for (const node of plan.nodes) {
    // The hand-authored native Hangar remains unchanged.
    if (node.floor === 0 && node.key === 'r0') continue;
    if (!Number.isInteger(node.local) || node.local < 0 || node.local > 11)
      throw Error('invalid variant slot');
    const base = node.prefab.template;
    const bit = stream(plan.seed, plan.floor, 'prefab-proportions-v1:' + node.key)() < 0.5 ? 0 : 1;
    const slot = node.local * 2 + bit;
    const id = base + '--proporcion-' + slot;
    if (!prefabCatalog.templates[id]) {
      const source = prefabCatalog.templates[base];
      if (!source) throw Error('missing variant base: ' + base);
      const factor = 1 + slot * 0.012;
      prefabCatalog.templates[id] = {
        ...source,
        perimeter: source.perimeter.map(([edge, x, y, height]) => [edge, x * factor, y, height]),
        decks: source.decks.map(deck => ({...deck, x: deck.x * factor, w: deck.w * factor})),
        // Edges, inward offsets, art, pivots, footprints and facing are inherited.
        sockets: {...source.sockets},
        placements: source.placements.map(p => ({...p})),
      };
    }
    node.prefab = {...node.prefab, template: id};
  }
  return plan;
}
