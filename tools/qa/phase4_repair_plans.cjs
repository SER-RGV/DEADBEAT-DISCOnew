// 2.4 prototype data sweep: deterministic plans, population and compiled geometry.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'../../src/room_generation'),catalog=require(path.join(dir,'prefabs/catalog.json'));
const source=['seed','rooms','population','floor','validate','architecture','prefabs','playable','population_compiled','topology_v3','prefab_variants','silhouette_variants','circle_profiles','deck_repair'].map(n=>fs.readFileSync(path.join(dir,n+'.js'),'utf8')).join('\n');
const api=Function('prefabCatalog',source+';return {topologyPrototype,bindPrefabs,bindPrefabVariants,bindSilhouetteVariants,bindCircleProfiles,repairCircleDecks,playableRoom,adaptPopulationCompiled,validatePopulationCompiled};')(catalog);
const count=Number(process.argv[2]||1000);assert(Number.isInteger(count)&&count>0);
function build(seed,floor){const plan=api.repairCircleDecks(api.bindPrefabs(api.topologyPrototype(seed,floor)));for(const node of plan.nodes){const c=api.playableRoom(node);if(!c)continue;node.population=api.adaptPopulationCompiled(node.population,c);api.validatePopulationCompiled(node.population,c);node.geometry=c.geometry;}plan.version='2.7.0';return plan;}
let maps=0,rooms=0,skipped=0,spawns=0;const hash=crypto.createHash('sha256');
for(let floor=0;floor<10;floor++)for(let seed=0;seed<count;seed++){
 const a=build(seed,floor),b=build(seed,floor);assert.deepEqual(a,b,`nondeterministic ${floor}/${seed}`);
 for(const node of a.nodes){const c=api.playableRoom(node);if(!c){skipped++;continue;}rooms++;spawns+=node.population.spawns.length;assert.deepEqual(node.geometry,c.geometry);assert.equal(c.mesh.openings.length,node.prefab.connections.length);}
 hash.update(JSON.stringify(a)+'\n');maps++;
}
console.log(JSON.stringify({seedsPerFloor:count,maps,rooms,skippedHangar:skipped,spawns,sha256:hash.digest('hex'),note:'Prototype uses same functions as the build. Adaptation and validation share the predicate; does not replace native physics, visuals or full playthrough.'},null,2));
