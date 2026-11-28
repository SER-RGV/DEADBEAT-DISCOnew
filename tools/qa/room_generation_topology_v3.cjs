// Offline prototype verification; no shipped build or engine transition coverage.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../../src/room_generation');
const catalog=require(path.join(dir,'prefabs/catalog.json'));
const api=Function('prefabCatalog',['seed','rooms','population','floor','validate','architecture','prefabs','playable','topology_v3'].map(n=>fs.readFileSync(path.join(dir,n+'.js'),'utf8')).join('\n')+';return {topologyPrototype,bindPrefabs,playableRoom,validate};')(catalog);
const count=Number(process.argv[2]||1000);assert(Number.isInteger(count)&&count>0);
let maps=0,rooms=0,skippedHangar=0;const degree={},cycles={},routeTypes={},placements={},graphSignatures={};
function bfs(nodes,from,allowed) {
 const m=new Map(nodes.map(n=>[n.key,n])),seen=new Map([[from.key,null]]),q=[from];
 for(const n of q)for(const l of n.links){const to=m.get(l.to);if(to&&allowed(to)&&!seen.has(to.key)){seen.set(to.key,n.key);q.push(to);}}
 return {m,seen};
}
for(let floor=0;floor<10;floor++)for(let seed=0;seed<count;seed++){
 const a=api.bindPrefabs(api.topologyPrototype(seed,floor));
 const b=api.bindPrefabs(api.topologyPrototype(seed,floor));
 assert.deepEqual(a,b,`nondeterministic ${floor}/${seed}`);
 if(floor<9)api.validate(a); // legacy cardinality validator excludes floor 9 prototype
 const nodes=a.nodes,m=new Map(nodes.map(n=>[n.key,n]));
 assert.equal(m.size,nodes.length);assert.equal(new Set(nodes.map(n=>n.index)).size,nodes.length);
 assert.equal(new Set(nodes.map(n=>n.x+','+n.y)).size,nodes.length);
 const deg=nodes.reduce((s,n)=>s+n.links.length,0), cycle=deg/2-nodes.length+1;
 const signature=nodes.flatMap(n=>n.links.filter(l=>n.local<m.get(l.to).local).map(l=>[n.local,m.get(l.to).local].join('-'))).sort().join(',');
 const signatures=graphSignatures[floor] ||= {};signatures[signature]=(signatures[signature]||0)+1;
 assert.equal(cycle,2);cycles[cycle]=(cycles[cycle]||0)+1;
 degree[(deg/nodes.length).toFixed(3)]=(degree[(deg/nodes.length).toFixed(3)]||0)+1;
 for(const n of nodes){assert.equal(new Set(n.links.map(l=>l.side)).size,n.links.length);
  for(const l of n.links){const v=m.get(l.to);assert(v&&v.links.some(z=>z.to===n.key));assert.equal(Math.abs(n.x-v.x)+Math.abs(n.y-v.y),1);}
  const c=api.playableRoom(n);if(c){assert.equal(c.mesh.openings.length,n.prefab.connections.length);placements[n.prefab.template]=(placements[n.prefab.template]||0)+1;rooms++;}else skippedHangar++;
 }
 const start=nodes.find(n=>n.type==='start'),boss=nodes.find(n=>n.type==='boss'),elite=nodes.find(n=>n.type==='elite');assert(start&&boss&&elite);
 const mandatory=bfs(nodes,start,n=>!['secret','supersecret','shop'].includes(n.type));
 assert(mandatory.seen.has(boss.key));assert.equal(mandatory.seen.size,nodes.filter(n=>!['secret','supersecret','shop'].includes(n.type)).length);
 const core=nodes.filter(n=>!['secret','supersecret','shop','boss'].includes(n.type)),coreKeys=new Set(core.map(n=>n.key));
 const coreReach=bfs(nodes,start,n=>coreKeys.has(n.key));
 const coreEdges=core.reduce((s,n)=>s+n.links.filter(l=>coreKeys.has(l.to)).length,0)/2;
 assert.equal(coreReach.seen.size,core.length);assert.equal(coreEdges-core.length+1,2,'cycles must not rely on secrets or boss');
 const route=[];for(let k=boss.key;k!==null;k=mandatory.seen.get(k))route.unshift(mandatory.m.get(k).type);
 assert.deepEqual(route,['start','combat','challenge','elite','boss']);
 const distances=new Map([[elite.key,0]]),q=[elite];for(const n of q)for(const l of n.links)if(!distances.has(l.to)){distances.set(l.to,distances.get(n.key)+1);q.push(m.get(l.to));}
 assert(nodes.some(n=>['rest','treasure','shop','special'].includes(n.type)&&distances.get(n.key)<=2));
 routeTypes[route.join('→')]=(routeTypes[route.join('→')]||0)+1;
 maps++;
}
console.log(JSON.stringify({seedsPerFloor:count,maps,compiledRooms:rooms,skippedHangar,cycles,degree,routeTypes,placements,graphSignatures,note:'Offline prototype with seeded branch selection and rotations/reflections. Graph signatures measure local-label incidence, not perceived variety. Does not test actual traversal, native spawn/doors, saving, or floor 9 compatibility with the live engine.'},null,2));
