// Nested timings under Node: inclusive wrapper timings, not additive or Chromium.
const fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../../src/room_generation'),catalog=require(path.join(dir,'prefabs/catalog.json'));
const src=['seed','rooms','population','floor','validate','architecture','prefabs','playable','population_compiled','topology_v3','prefab_variants','silhouette_variants','circle_profiles','deck_repair'].map(n=>fs.readFileSync(path.join(dir,n+'.js'),'utf8')).join('\n');
const api=Function('prefabCatalog','performance',src+`;let stats={architecture:0,instantiate:0,playable:0,rooms:0};let on=false;
const origA=compileArchitecture,origI=instantiatePrefab,origP=playableRoom;
compileArchitecture=function(...args){let t=performance.now();try{return origA(...args)}finally{if(on)stats.architecture+=performance.now()-t}};
instantiatePrefab=function(...args){let t=performance.now();try{return origI(...args)}finally{if(on)stats.instantiate+=performance.now()-t}};
playableRoom=function(...args){let t=performance.now();try{return origP(...args)}finally{if(on){stats.playable+=performance.now()-t;stats.rooms++}}};
return {measure(seed,f,record){const p=topologyPrototype(seed,f);repairCircleDecks(bindPrefabs(p));on=record;for(const n of p.nodes)playableRoom(n);on=false},stats};`)(catalog,performance);
const n=Number(process.argv[2]||2000);assert(Number.isInteger(n)&&n>0);
for(let i=0;i<n+100;i++)api.measure(Math.floor(i/10),i%10,i>=100);
console.log(JSON.stringify({samples:n,rooms:api.stats.rooms,inclusiveMsPerMap:{playable:api.stats.playable/n,instantiate:api.stats.instantiate/n,architecture:api.stats.architecture/n},note:'Nested inclusive timings; architecture is included in instantiate, which is included in playable. Includes timer/wrapper overhead. Node, one sequential run, not Chromium or heap.'},null,2));
