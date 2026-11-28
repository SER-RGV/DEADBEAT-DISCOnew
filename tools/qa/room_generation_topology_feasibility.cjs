// Counts existing adjacent mandatory-room pairs that could add one cycle.
// Diagnostic only: it does not modify or approve a new floor topology.
const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../../src/room_generation');
const {generate}=Function(['seed','rooms','population','floor','validate'].map(n=>fs.readFileSync(path.join(dir,n+'.js'),'utf8')).join('\n')+';return {generate};')();
const count=Number(process.argv[2]||1000);if(!Number.isInteger(count)||count<1)throw Error('positive integer required');
const excluded=new Set(['secret','supersecret','shop','boss']);
const floors=[];
for(let floor=0;floor<10;floor++){
 const stats={floor,maps:0,withCandidate:0,withoutCandidate:0,candidates:0};
 for(let seed=0;seed<count;seed++){
  const nodes=generate(seed,floor).nodes.filter(n=>!excluded.has(n.type));let candidates=0;
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
   const a=nodes[i],b=nodes[j];
   if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1&&!a.links.some(l=>l.to===b.key))candidates++;
  }
  stats.maps++;stats.candidates+=candidates;stats[candidates?'withCandidate':'withoutCandidate']++;
 }
 floors.push(stats);
}
console.log(JSON.stringify({seedsPerFloor:count,floors,note:'Only existing adjacent non-optional, non-boss nodes; no physical door, degree, rhythm, persistence or runtime check. Floor 9 currently has only a boss.'},null,2));
