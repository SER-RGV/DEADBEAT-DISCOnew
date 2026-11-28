// 2.5 experiment: a real inset changes the perimeter on a wall with no socket
// or furniture anchor. Even slots keep 2.4 proportions; odd slots add an inset.
// Socket edges, furniture and art are inherited unchanged. Applied at generation,
// never in the frame loop. This module does not modify 2.4 or previous plans.
const silhouetteInsetEdges = {
  'nave-quebrada': 'alcoveN',
  'palco-profundo': 'alcoveN',
  'pasillo-servicio': 'cornerNW',
  'arena-octogono': 'returnNE',
  'camarote': 'returnSW',
};
function bindSilhouetteVariants(plan) {
  bindPrefabVariants(plan);
  for (const node of plan.nodes) {
    if (node.floor === 0 && node.key === 'r0') continue;
    const baseId = node.prefab.template;
    const match = /^(.*)--proporcion-(\d+)$/.exec(baseId);
    if (!match) throw Error('invalid proportion variant');
    const slot = Number(match[2]);
    if (!(slot % 2)) continue;
    const id = baseId + '--entrante';
    if (!prefabCatalog.templates[id]) {
      const spec = prefabCatalog.templates[baseId], edgeId = silhouetteInsetEdges[match[1]];
      if (!spec || !edgeId || Object.values(spec.sockets).includes(edgeId) || spec.placements.some(p=>p.edge===edgeId))
        throw Error('unsafe inset edge: ' + edgeId);
      const index = spec.perimeter.findIndex(p=>p[0]===edgeId);
      if (index<0) throw Error('missing inset edge');
      const [,, , height] = spec.perimeter[index], [id0,x0,y0] = spec.perimeter[index];
      const [,x1,y1] = spec.perimeter[(index+1)%spec.perimeter.length];
      const dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy),depth=140;
      if (len<190) throw Error('inset wall too short');
      // Clockwise perimeter: left normal points into the walkable polygon.
      const nx=-dy/len*depth,ny=dx/len*depth;
      const a={x:x0+dx*.2,y:y0+dy*.2},b={x:x0+dx*.8,y:y0+dy*.8};
      const additions=[
        [id0+'-entrante-a',a.x,a.y,height],
        [id0+'-entrante-b',a.x+nx,a.y+ny,height],
        [id0+'-entrante-c',b.x+nx,b.y+ny,height],
        [id0+'-entrante-d',b.x,b.y,height],
      ];
      const perimeter=spec.perimeter.map(p=>[...p]);perimeter.splice(index+1,0,...additions);
      prefabCatalog.templates[id]={...spec,perimeter};
    }
    node.prefab={...node.prefab,template:id};
  }
  return plan;
}
