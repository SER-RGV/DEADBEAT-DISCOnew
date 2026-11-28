// 2.7 fix: the booth deck's NE corner was outside the camarote perimeter.
// The original templates and old saved versions remain unchanged. Decks are
// optical, and their derived placement elevations are compiled after this step.
function repairCircleDecks(plan) {
  bindCircleProfiles(plan);
  for (const n of plan.nodes) {
    if (n.floor === 0 && n.key === 'r0') continue;
    const sourceId=n.prefab.template;
    if (!sourceId.startsWith('camarote--')) continue;
    const id=sourceId+'--tarima-interior';
    if (!prefabCatalog.templates[id]) {
      const source=prefabCatalog.templates[sourceId];
      if(!source||!source.decks.some(d=>d.id==='booth'))throw Error('missing booth deck');
      prefabCatalog.templates[id]={...source,decks:source.decks.map(d=>d.id==='booth'?{...d,y:190}:{...d})};
    }
    n.prefab={...n.prefab,template:id};
  }
  return plan;
}
