// Read-only RG2 baseline. Run: node tools/qa/room_generation_baseline.cjs [seeds]
// Timing is environmental; all other results are deterministic for a given checkout.
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '../..');
const dir = path.join(root, 'src/room_generation');
const catalog = require(path.join(dir, 'prefabs/catalog.json'));
const api = Function('prefabCatalog', ['seed','rooms','population','floor','validate','architecture','prefabs','playable'].map(n => fs.readFileSync(path.join(dir, n + '.js'), 'utf8')).join('\n') + ';return {generate,bindPrefabs,playableRoom};')(catalog);
const count = Number(process.argv[2] || 1000);
if (!Number.isInteger(count) || count < 1) throw Error('seeds must be a positive integer');
const inc = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const entropy = o => { const a = Object.values(o), sum = a.reduce((x,y)=>x+y,0); return -a.reduce((s,n)=>s+(n/sum)*Math.log2(n/sum),0); };
const percentile = (a, p) => a.slice().sort((x,y)=>x-y)[Math.ceil(a.length*p)-1];
const polygonArea = pts => Math.abs(pts.reduce((s,p,i) => {const q=pts[(i+1)%pts.length]; return s+p[0]*q[1]-q[0]*p[1];},0))/2;
const stats = a => ({min:a.reduce((x,y)=>Math.min(x,y),Infinity), mean:a.reduce((x,y)=>x+y,0)/a.length, p50:percentile(a,.5), p95:percentile(a,.95), max:a.reduce((x,y)=>Math.max(x,y),-Infinity)});
// Geometric approximation only: no native/scenic colliders or moving actors.
function freeAt(x,y,r,poly,placements) {
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const a=poly[j],b=poly[i],dx=b[0]-a[0],dy=b[1]-a[1];
    if ((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
    const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
    if(Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<r)return false;
  }
  if(!inside)return false;
  for(const p of placements) if(p.solid) {
    const c=p.collider,dx=x-p.anchor.x,dy=y-p.anchor.y,cs=Math.cos(c.angle||0),sn=Math.sin(c.angle||0),lx=dx*cs+dy*sn,ly=-dx*sn+dy*cs;
    if(c.kind==='circle'&&Math.hypot(lx,ly)<c.r+r)return false;
    if(c.kind==='capsule'&&Math.hypot(Math.max(0,Math.abs(lx)-c.halfLength),ly)<c.r+r)return false;
    if(c.kind==='rect'&&Math.hypot(Math.max(0,Math.abs(lx)-c.w/2),Math.max(0,Math.abs(ly)-c.h/2))<r)return false;
  }
  return true;
}
const freeCache={};
function sampleFree(template,w,h,poly,placements) {
  if(freeCache[template])return freeCache[template];
  const step=20,radius=18;let free=0,total=0;
  for(let y=step/2;y<h;y+=step)for(let x=step/2;x<w;x+=step){total++;if(freeAt(x,y,radius,poly,placements))free++;}
  return freeCache[template]={step,radius,freeSamples:free,totalSamples:total,freeAreaApprox:free*step*step};
}
const perFloor = Array.from({length:10}, (_,floor)=>({floor, maps:0, rooms:0, types:{}, shells:{}, prefabs:{}, cycles:{}, degree:{}, bossDepth:{}, deadEnds:{}, eliteRewardWithin2:0, eliteWithoutRewardWithin2:0, duplicatePrefabDoorPairs:0, prefabDoorPairMaps:0, areas:[], solidFootprintArea:0, placements:0}));
const all = { maps:0, rooms:0, types:{}, shells:{}, prefabs:{}, templatesByType:{}, sizeCounts:{}, rect:0, polygon:0, mismatch:0, nativeExceptions:[], generationExceptions:[], nondeterministic:[], pairsDoorDistances:[], connectionT:{}, timing:[], playableSkipped:0, candidateSpawns:0, candidateSpawnsBlocked:0, roomsWithoutSafeCandidate:0, spawnsByTemplate:{}, bossPredecessorTypes:{}, criticalPathThroughElite:0 };
for (let floor=0; floor<10; floor++) for (let seed=0; seed<count; seed++) {
  const f=perFloor[floor]; let plan;
  try {
    const start=performance.now(); plan=api.bindPrefabs(api.generate(seed,floor)); all.timing.push(performance.now()-start);
    if (JSON.stringify(plan)!==JSON.stringify(api.bindPrefabs(api.generate(seed,floor)))) all.nondeterministic.push([floor,seed]);
  } catch(e) { if(all.generationExceptions.length<20) all.generationExceptions.push({floor,seed,error:String(e)}); continue; }
  all.maps++; f.maps++; const nodes=plan.nodes, edges=nodes.reduce((s,n)=>s+n.links.length,0)/2;
  inc(f.cycles, edges-nodes.length+1); inc(f.degree,(2*edges/nodes.length).toFixed(3));
  const boss=nodes.find(n=>n.type==='boss'); inc(f.deadEnds,nodes.filter(n=>n.links.length===1).length); inc(f.bossDepth,boss.depth);
  if(floor<9){inc(all.bossPredecessorTypes,nodes.find(n=>n.key===boss.links[0].to).type);const seen=new Map([[nodes[0].key,null]]),q=[nodes[0]];for(const n of q)for(const l of n.links){const dst=nodes.find(x=>x.key===l.to);if(!seen.has(dst.key)&&!['secret','supersecret','shop'].includes(dst.type)){seen.set(dst.key,n.key);q.push(dst);}}let k=boss.key;while(k!=null){if(nodes.find(n=>n.key===k).type==='elite'){all.criticalPathThroughElite++;break;}k=seen.get(k)??null;}}
  const elite=nodes.find(n=>n.type==='elite');
  if (elite) { const seen=new Set([elite.key]), q=[[elite,0]]; let found=false;
    for (const [n,d] of q) { if(d && ['rest','treasure','shop','special'].includes(n.type)){found=true; break;} if(d===2)continue; for(const l of n.links){const next=nodes.find(x=>x.key===l.to); if(!seen.has(next.key)){seen.add(next.key);q.push([next,d+1]);}} }
    f[found?'eliteRewardWithin2':'eliteWithoutRewardWithin2']++;
  }
  const signatures={};
  for (const n of nodes) {
    all.rooms++; f.rooms++; inc(all.types,n.type); inc(f.types,n.type); inc(all.shells,n.geometry.base); inc(f.shells,n.geometry.base); inc(all.prefabs,n.prefab.template); inc(f.prefabs,n.prefab.template); inc(all.templatesByType[n.type] ||= {},n.prefab.template);
    inc(all,n.geometry.pts.length===4?'rect':'polygon');
    try {
      const r=api.playableRoom(n); if(!r){all.playableSkipped++;continue;}
      const sig=n.prefab.template+'|'+n.prefab.connections.map(c=>c.side+(c.lift?':lift':'')).sort().join(','); inc(signatures,sig);
      if (JSON.stringify(n.geometry.pts)!==JSON.stringify(r.geometry.pts)) all.mismatch++;
      const pts=r.geometry.pts.map(([x,y])=>[x*r.geometry.w,y*r.geometry.h]); const area=polygonArea(pts); f.areas.push(area); f.placements+=r.mesh.placements.length; inc(all.sizeCounts,`${r.geometry.w}x${r.geometry.h}`);
      sampleFree(n.prefab.template,r.geometry.w,r.geometry.h,pts,r.mesh.placements);
      let safe=0; const sp=all.spawnsByTemplate[n.prefab.template] ||= {total:0,blocked:0,roomsWithoutSafe:0};
      for(const p of n.population.spawns){const ok=freeAt(p.x*r.geometry.w,p.y*r.geometry.h,36,pts,r.mesh.placements);all.candidateSpawns++;sp.total++;if(ok)safe++;else{all.candidateSpawnsBlocked++;sp.blocked++;}}
      if(!safe){all.roomsWithoutSafeCandidate++;sp.roomsWithoutSafe++;}
      for(const p of r.mesh.placements) if(p.solid) {const c=p.collider; f.solidFootprintArea+=c.kind==='rect'?c.w*c.h:c.kind==='circle'?Math.PI*c.r*c.r:c.kind==='capsule'?Math.PI*c.r*c.r+4*c.r*(c.halfLength||0):0;}
      const openings=r.mesh.openings, perimeter=catalog.templates[n.prefab.template].perimeter; for(const o of openings) {const a=perimeter[o.edge],b=perimeter[(o.edge+1)%perimeter.length],dx=b[1]-a[1],dy=b[2]-a[2];inc(all.connectionT,(((o.origin.x-a[1])*dx+(o.origin.y-a[2])*dy)/(dx*dx+dy*dy)).toFixed(6));} for(let i=0;i<openings.length;i++)for(let j=i+1;j<openings.length;j++)all.pairsDoorDistances.push(Math.hypot(openings[i].origin.x-openings[j].origin.x,openings[i].origin.y-openings[j].origin.y));
    } catch(e){if(all.nativeExceptions.length<20)all.nativeExceptions.push({floor,seed,key:n.key,error:String(e)});}
  }
  const pairs=Object.values(signatures).reduce((s,n)=>s+n*(n-1)/2,0);f.duplicatePrefabDoorPairs+=pairs;if(pairs)f.prefabDoorPairMaps++;
}
for(const f of perFloor){const areaSum=f.areas.reduce((a,b)=>a+b,0);f.areaStats=f.areas.length?stats(f.areas):null; f.solidFootprintFractionApprox=areaSum?f.solidFootprintArea/areaSum:null;f.placementsPerMillionArea=areaSum?f.placements*1e6/areaSum:null;delete f.areas;}
all.entropyBits={types:entropy(all.types),shells:entropy(all.shells),prefabs:entropy(all.prefabs)};all.generationAndBindMs=stats(all.timing); delete all.timing; all.doorPairDistance=all.pairsDoorDistances.length?stats(all.pairsDoorDistances):null; delete all.pairsDoorDistances;
console.log(JSON.stringify({seeds:`0..${count-1}`,note:'Areas are polygon areas of compiled prefab shells; footprint sum may overlap. Free area is a 20px grid of centres with 18px clearance; spawns are checked at radius 36. These omit native/scenic additions and actors; neither tests reachability. Door distances include lifts. Timing includes generate, validate, bind; excludes duplicate generation and prefab compilation. Literal point mismatch does not establish runtime inconsistency.',all,perFloor,freeAreaByPrefab:freeCache},null,2));
if(all.maps!==count*10 || all.generationExceptions.length || all.nativeExceptions.length || all.nondeterministic.length) process.exitCode=1;
