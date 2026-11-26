// Version-gated topology: two square cycles plus terminal branches.
// All transforms are seeded; the floor-9 boss retains legacy level 100.
function topologyPrototype(seed, floor) {
  if (!Number.isInteger(floor) || floor < 0 || floor > 9) throw RangeError('floor must be 0…9');
  const layout = {
    0:[0,0], 1:[1,0], 2:[1,1], 3:[0,1], 4:[2,0], 5:[2,1],
    6:[2,2], 7:[-1,1], 8:[0,2], 9:[3,0], 10:[3,1], 11:[-1,0],
  };
  const edges = [[0,1],[1,2],[2,3],[3,0],[1,4],[4,5],[5,2],[5,6],[5,10]];
  const rng = stream(seed, floor, 'topology-v3-prototype');
  if (floor !== 9) {
    // Optional leaves change graph incidence, not only rotation or mirroring.
    const alternateSecret = rng() < 0.5, alternateSuper = rng() < 0.5;
    if (alternateSecret) layout[7] = [0,-1];
    if (alternateSuper) layout[8] = [1,2];
    edges.push([alternateSecret ? 0 : 3,7],[alternateSuper ? 2 : 3,8],[4,9],[0,11]);
  }
  const rotation = Math.floor(rng() * 4), mirror = rng() < 0.5;
  function transform(v) {
    let [x,y] = v;
    if (mirror) x = -x;
    for (let i = 0; i < rotation; i++) [x,y] = [-y,x];
    return [x,y];
  }
  let plan;
  if (floor !== 9) {
    // Legacy generation is deterministic and supplies geometry and population.
    plan = generate(seed, floor);
  } else {
    const types = ['start','combat','challenge','event','combat','elite','rest'];
    const locals = [0,1,2,3,4,5,6,10];
    const nodes = locals.map((local,i) => {
      // Keep the final boss at index 99 / level 100 for native boss/victory.
      // Other rooms use unique indexes >=100 and enter via their explicit key.
      const index = local===10 ? 99 : 100+i, type = local===10 ? 'boss' : types[local];
      const geometry = room(seed, floor, local, type);
      geometry.index = index;
      return {key:'r'+index,index,local,floor,x:0,y:0,type,shop:false,links:[],geometry,population:populate(seed,floor,local,type)};
    });
    plan = {seed:seed>>>0,floor,nodes,bounds:null};
  }
  for (const n of plan.nodes) {
    [n.x,n.y] = transform(layout[n.local]);
    n.links = [];
  }
  const byLocal = new Map(plan.nodes.map(n => [n.local,n]));
  for (const [u,v] of edges) {
    const a=byLocal.get(u), b=byLocal.get(v);
    if (!a || !b) throw Error('missing prototype room');
    const i=axes.findIndex(([x,y]) => a.x+x===b.x && a.y+y===b.y);
    if (i<0) throw Error('non-cardinal prototype link');
    a.links.push({side:axes[i][2],to:b.key});
    b.links.push({side:axes[(i+2)%4][2],to:a.key});
  }
  const start=byLocal.get(0), seen=new Map([[start.key,0]]), queue=[start];
  for (const n of queue) for (const l of n.links) {
    const next=plan.nodes.find(v => v.key===l.to);
    if (!seen.has(next.key)) {seen.set(next.key,seen.get(n.key)+1);queue.push(next);}
  }
  for (const n of plan.nodes) {
    n.depth=seen.get(n.key);
    n.waveScale=n.type==='challenge' ? 1.12+Math.min(0.16,n.depth*0.02+floor*0.01) : 1;
  }
  const xs=plan.nodes.map(n=>n.x), ys=plan.nodes.map(n=>n.y);
  plan.bounds={minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
  plan.version='2.2.0-prototype';
  return validateTopologyV3(plan);
}
function validateTopologyV3(plan) {
  const nodes=plan.nodes, byKey=new Map(nodes.map(n=>[n.key,n]));
  const fail=message=>{throw Error(`RG3 ${plan.seed}/${plan.floor}: ${message}`);};
  if (nodes.length !== (plan.floor===9 ? 8 : 12) || byKey.size!==nodes.length ||
      new Set(nodes.map(n=>n.index)).size!==nodes.length ||
      new Set(nodes.map(n=>`${n.x},${n.y}`)).size!==nodes.length) fail('duplicate or missing room');
  for(const n of nodes) {
    if(new Set(n.links.map(l=>l.side)).size!==n.links.length)fail('shared door');
    for(const l of n.links) {
      const dst=byKey.get(l.to), i=axes.findIndex(a=>a[2]===l.side);
      if(!dst || i<0 || n.x+axes[i][0]!==dst.x || n.y+axes[i][1]!==dst.y ||
         !dst.links.some(back=>back.to===n.key && back.side===axes[(i+2)%4][2])) fail('broken link');
    }
  }
  const start=nodes.find(n=>n.type==='start'),boss=nodes.find(n=>n.type==='boss'),elite=nodes.find(n=>n.type==='elite');
  if(!start||!boss||!elite)fail('missing mandatory type');
  const walk=(initial,allowed)=>{
    const depths=new Map([[initial.key,0]]),q=[initial];
    for(const n of q) for(const l of n.links){const dst=byKey.get(l.to);if(allowed(dst)&&!depths.has(dst.key)){depths.set(dst.key,depths.get(n.key)+1);q.push(dst);}}
    return depths;
  };
  const required=nodes.filter(n=>!['secret','supersecret','shop'].includes(n.type));
  const requiredKeys=new Set(required.map(n=>n.key));
  const reachable=walk(start,n=>requiredKeys.has(n.key));
  if(reachable.size!==required.length||!reachable.has(boss.key))fail('unreachable mandatory room');
  const core=required.filter(n=>n.type!=='boss'),coreKeys=new Set(core.map(n=>n.key));
  const coreEdges=core.reduce((sum,n)=>sum+n.links.filter(l=>coreKeys.has(l.to)).length,0)/2;
  if(walk(start,n=>coreKeys.has(n.key)).size!==core.length || coreEdges-core.length+1<2)fail('insufficient independent cycles');
  const near=walk(elite,()=>true);
  if(!nodes.some(n=>['rest','treasure','shop','special'].includes(n.type) && near.get(n.key)<=2))fail('elite without nearby reward');
  if(plan.floor===9 && (start.key!=='r100'||boss.key!=='r99'||boss.index!==99))fail('invalid nucleus identity');
  return plan;
}
