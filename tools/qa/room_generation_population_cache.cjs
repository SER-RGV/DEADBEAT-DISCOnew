// Compare optimized adapter against its backed-up predecessor for 10 x N seeds.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname,'../..'), dir=path.join(root,'src/room_generation');
const old = require(path.join(root,process.argv[3] || 'backups/room_population_perf_20261126/population_compiled.js'));
const current = require(path.join(dir,'population_compiled.js'));
const catalog = require(path.join(dir,'prefabs/catalog.json'));
const api=Function('prefabCatalog',['seed','rooms','population','floor','validate','architecture','prefabs','playable','topology_v3'].map(n=>fs.readFileSync(path.join(dir,n+'.js'),'utf8')).join('\n')+';return {generate,topologyPrototype,bindPrefabs,playableRoom};')(catalog);
const n=Number(process.argv[2]||1000);assert(Number.isInteger(n)&&n>0);
const topology=process.argv[4]==='topology';
const digest=crypto.createHash('sha256');let maps=0,rooms=0;
for(let f=0;f<10;f++)for(let seed=0;seed<n;seed++){
 const plan=api.bindPrefabs(topology ? api.topologyPrototype(seed,f) : api.generate(seed,f));maps++;
 for(const node of plan.nodes){const compiled=api.playableRoom(node);if(!compiled)continue;
  const before=old.adaptPopulationCompiled(node.population,compiled);
  const after=current.adaptPopulationCompiled(node.population,compiled);
  assert.deepEqual(after,before,`changed seed ${seed} floor ${f} room ${node.key}`);
  digest.update(JSON.stringify(after)+'\n');rooms++;
 }
}
console.log(JSON.stringify({topology:topology?'2.2/2.3':'legacy',maps,rooms,unchanged:true,sha256:digest.digest('hex'),note:'Compares optimized and original population outputs only; no runtime, frame or heap measurement.'},null,2));
