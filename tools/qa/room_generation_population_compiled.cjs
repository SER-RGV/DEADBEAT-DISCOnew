// Offline experiment; no runtime or save-format changes. Usage: node ... [seeds]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '../../src/room_generation');
const catalog = require(path.join(dir, 'prefabs/catalog.json'));
const {adaptPopulationCompiled, populationCompiledSafe, validatePopulationCompiled} = require(path.join(dir, 'population_compiled.js'));
const api = Function('prefabCatalog', ['seed','rooms','population','floor','validate','architecture','prefabs','playable'].map(n => fs.readFileSync(path.join(dir, n + '.js'), 'utf8')).join('\n') + ';return {generate,bindPrefabs,playableRoom};')(catalog);
const n = Number(process.argv[2] || 1000);
assert(Number.isInteger(n) && n > 0);
const shape = {w:100,h:100,pts:[[0,0],[1,0],[1,0.4],[0.4,0.4],[0.4,1],[0,1]]};
const empty = {placements:[],openings:[]};
assert(populationCompiledSafe(0.2,0.8,5,shape,empty));
assert(!populationCompiledSafe(0.8,0.8,5,shape,empty));
assert(!populationCompiledSafe(0.39,0.5,5,shape,empty));
assert(!populationCompiledSafe(NaN,0.5,5,shape,empty));
assert(!populationCompiledSafe(0.2,0.2,5,shape,{placements:[{solid:true,anchor:{x:20,y:20},collider:{kind:'circle',r:10}}],openings:[]}));
let maps=0, rooms=0, skipped=0, spawns=0, movedSpawns=0, movedRewards=0;
for(let floor=0; floor<10; floor++) for(let seed=0; seed<n; seed++) {
  const plan=api.bindPrefabs(api.generate(seed,floor)); maps++;
  for(const node of plan.nodes) {
    const c=api.playableRoom(node); if(!c){skipped++;continue;}
    const before=JSON.stringify(node.population);
    const out=adaptPopulationCompiled(node.population,c);
    assert.equal(JSON.stringify(node.population),before, 'adapter mutated original');
    assert.deepEqual(out,adaptPopulationCompiled(node.population,c), 'non-deterministic');
    assert.equal(out.spawns.length,node.population.spawns.length);
    assert.deepEqual(out.props,node.population.props);
    assert.equal(validatePopulationCompiled(out,c),out);
    assert.throws(() => validatePopulationCompiled({...out, spawns:[{x:-1,y:-1}]},c), /unsafe compiled spawn/);
    for(let i=0;i<out.spawns.length;i++) {
      const p=out.spawns[i]; assert(populationCompiledSafe(p.x,p.y,36,c.geometry,c.mesh));
      if(p.x!==node.population.spawns[i].x||p.y!==node.population.spawns[i].y)movedSpawns++;
      spawns++;
    }
    for(const dx of [-80,0,80]) assert(populationCompiledSafe(out.reward.x+dx/c.geometry.w,out.reward.y,36,c.geometry,c.mesh));
    if(out.reward.x!==node.population.reward.x||out.reward.y!==node.population.reward.y)movedRewards++;
    rooms++;
  }
}
console.log(JSON.stringify({seedsPerFloor:n,maps,rooms,skippedHangar:skipped,spawns,movedSpawns,movedRewards,failed:0,note:'Offline proxy using compiled perimeter, catalog solids and circular doorway exclusion. Does not test real engine colliders, moving actors, scenic props, path connectivity or actual spawned enemies. Legacy props are unchanged and unused in prefab rooms.'},null,2));
