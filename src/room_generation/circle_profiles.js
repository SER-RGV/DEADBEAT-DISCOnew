// 2.6 profiles: deterministic, measurable mix of the existing authored houses.
// For floors 0–8, locals 1–6 have fixed counts; their order is seed-shuffled.
// The Hangar, calm rooms and boss keep their existing base templates. This is a
// spatial profile, not a change to the HUD names, artwork or combat difficulty.
const circleProfileHouses = ['nave-quebrada','palco-profundo','pasillo-servicio'];
const circleProfileCounts = [
  [4,1,1], [1,4,1], [1,1,4],
  [3,2,1], [3,1,2], [2,3,1],
  [1,3,2], [2,1,3], [1,2,3],
];
function bindCircleProfiles(plan) {
  if (plan.floor < 9) {
    const counts=circleProfileCounts[plan.floor];
    if (!counts) throw Error('missing circle profile');
    const selection=counts.flatMap((n,i)=>Array(n).fill(circleProfileHouses[i]));
    const rng=stream(plan.seed,plan.floor,'circle-profile-v1');
    for(let i=selection.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[selection[i],selection[j]]=[selection[j],selection[i]];}
    for(let local=1;local<=6;local++){
      const n=plan.nodes.find(v=>v.local===local);if(!n)throw Error('missing profile room '+local);
      n.prefab={...n.prefab,template:selection[local-1]};
    }
  }
  bindSilhouetteVariants(plan);
  if(plan.floor>=9)return plan;
  // Three levels of density, removing only last authored furnishings for these
  // six rooms. Never remove solids after spawns are adapted: bind occurs first.
  const removed=plan.floor%3;
  if (!removed) return plan;
  for(const n of plan.nodes){
    if(n.local<1||n.local>6)continue;
    const base=n.prefab.template,id=base+'--densidad-'+removed;
    if(!prefabCatalog.templates[id]){
      const spec=prefabCatalog.templates[base];
      if(!spec||spec.placements.length<=removed)throw Error('invalid profile density');
      prefabCatalog.templates[id]={...spec,placements:spec.placements.slice(0,-removed)};
    }
    n.prefab={...n.prefab,template:id};
  }
  return plan;
}
