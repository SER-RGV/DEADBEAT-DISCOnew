// Measure actual assigned room composition and installed catalog density by circle.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../../src/room_generation'),catalog=require(path.join(dir,'prefabs/catalog.json'));
const src=['seed','rooms','population','floor','validate','architecture','prefabs','playable','topology_v3','prefab_variants','silhouette_variants','circle_profiles'].map(n=>fs.readFileSync(path.join(dir,n+'.js'),'utf8')).join('\n');
const api=Function('prefabCatalog',src+';return {topologyPrototype,bindPrefabs,bindCircleProfiles,playableRoom};')(catalog);
const count=Number(process.argv[2]||1000);assert(Number.isInteger(count)&&count>0);
let floors=[];
for(let floor=0;floor<9;floor++){
 let baseCounts={},density=0,silhouetteInset=0,rooms=0,baselineCounts={};
 for(let seed=0;seed<count;seed++){
  const old=api.bindPrefabs(api.topologyPrototype(seed,floor));for(const n of old.nodes.filter(x=>x.local>=1&&x.local<=6)){baselineCounts[n.prefab.template]=(baselineCounts[n.prefab.template]||0)+1;}
  const plan=api.bindCircleProfiles(api.bindPrefabs(api.topologyPrototype(seed,floor)));
  for(const n of plan.nodes.filter(x=>x.local>=1&&x.local<=6)){
   let base=n.prefab.template.split('--')[0],c=api.playableRoom(n);assert(c);baseCounts[base]=(baseCounts[base]||0)+1;density+=c.mesh.placements.length;if(n.prefab.template.includes('--entrante'))silhouetteInset++;rooms++;
  }
 }
 floors.push({floor,seeds:count,rooms,baseCounts,baselineCounts,meanFurniture:density/rooms,insetFraction:silhouetteInset/rooms});
}
for(let i=0;i<9;i++)for(let j=i+1;j<9;j++){const a=floors[i],b=floors[j];assert.notDeepEqual(a.baseCounts,b.baseCounts,'same composition '+i+'/'+j);}
console.log(JSON.stringify({floors,distinctBaseDistributions:true,note:'Locals 1–6 per ordinary floor; floor 0 Hangar, start, boss and calm rooms excluded from the profile metric. Counts are configured and confirmed, not proof of player perception, visual contrast or combat pacing.'},null,2));
