// Conservative physical footprint + door signature audit of the current 2.2/2.3 prefab binding.
// Rigid rotations/reflections, perimeter starting point and winding are normalized;
// lift and ordinary door sockets are distinguished. Hangar is excluded explicitly.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../../src/room_generation');
const catalog=require(path.join(dir,'prefabs/catalog.json'));
const api=Function('prefabCatalog',['seed','rooms','population','floor','validate','architecture','prefabs','playable','topology_v3','prefab_variants','silhouette_variants','circle_profiles','deck_repair'].map(n=>fs.readFileSync(path.join(dir,n+'.js'),'utf8')).join('\n')+';return {topologyPrototype,bindPrefabs,bindPrefabVariants,bindSilhouetteVariants,bindCircleProfiles,repairCircleDecks,playableRoom};')(catalog);
const count=Number(process.argv[2]||1000);assert(Number.isInteger(count)&&count>0);
const variants=process.argv[3]==='variants';
const dirs={top:[0,-1],right:[1,0],bottom:[0,1],left:[-1,0]};
function canonical(node){
 const hangar=node.floor===0&&node.key==='r0';
 const spec=hangar?{perimeter:node.geometry.pts.map(([x,y],i)=>['h'+i,x*node.geometry.w,y*node.geometry.h,0])}:catalog.templates[node.prefab.template], variants=[];
 for(let reflect=0;reflect<2;reflect++)for(let rot=0;rot<4;rot++){
  function transform(x,y){if(reflect)x=-x;for(let i=0;i<rot;i++)[x,y]=[-y,x];return [x,y];}
  const pts=spec.perimeter.map(([,x,y])=>transform(x,y));
  const minX=Math.min(...pts.map(p=>p[0])),minY=Math.min(...pts.map(p=>p[1]));
  // Variant audit also normalizes uniform scale: a larger copy alone is not
  // treated as a new silhouette. Six decimals absorb floating arithmetic noise.
  const scale=variants ? Math.max(...pts.map(([x,y])=>Math.max(x-minX,y-minY))) : 1;
  const fmt=v=>variants ? (v/scale).toFixed(6) : String(v);
  const points=pts.map(([x,y])=>`${fmt(x-minX)},${fmt(y-minY)}`), loops=[];
  for(const seq of [points,[...points].reverse()])for(let i=0;i<seq.length;i++)loops.push([...seq.slice(i),...seq.slice(0,i)].join(';'));
  loops.sort();
  const doors=node.prefab.connections.map(d=>{const [x,y]=transform(...dirs[d.side]);return `${x},${y},${d.lift?'lift':'door'}`;}).sort().join(';');
  variants.push(loops[0]+'|'+doors);
 }
 return variants.sort()[0];
}
const floors={},types={},pairs={};let total=0,duplicates=0,hangar=0;
for(let f=0;f<10;f++)for(let s=0;s<count;s++){
 const plan=api.bindPrefabs(api.topologyPrototype(s,f)),seen=new Map();if(variants)api.repairCircleDecks(plan);let has=false;
 for(const node of plan.nodes){
  if(!api.playableRoom(node))hangar++;
  (types[node.type] ||= new Set()).add(node.prefab.template);
  const key=canonical(node), prior=seen.get(key);
  if(prior){has=true;const pair=[prior.type,node.type].sort().join('+');pairs[pair]=(pairs[pair]||0)+1;}else seen.set(key,node);
 }
 total++;if(has)duplicates++;
 const result=floors[f] ||= {maps:0,withDuplicate:0};result.maps++;if(has)result.withDuplicate++;
}
if(variants){assert.equal(duplicates,0,'repeated footprint and door signature');for(const [type,set] of Object.entries(types))assert(set.size>=2,'insufficient variants for '+type);}
console.log(JSON.stringify({version:variants?'2.7.0-prototype':'2.2/2.3',seedsPerFloor:count,maps:total,mapsWithDuplicate:duplicates,includedHangar:hangar,floors,templatesByType:Object.fromEntries(Object.entries(types).map(([k,v])=>[k,[...v].sort()])),duplicatePairs:pairs,note:'Uses catalog perimeter, canonicalized under quarter-turns/reflections, loop start and winding, and door direction plus lift type. Variant mode also normalizes uniform scale to six decimals; aspect-ratio changes still count, not a measure of perceptual difference. Includes Hangar using its legacy plan perimeter; independently compare against native geometry. No visual inspection, pathfinding or guarantee of interchangeable rotated artwork. Multiple repeats count relative to first signature owner.'},null,2));
