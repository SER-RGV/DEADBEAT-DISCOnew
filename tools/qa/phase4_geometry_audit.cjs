// Independent geometry audit of 2.6 catalog configurations; no native physics.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../../src/room_generation'),catalog=require(path.join(dir,'prefabs/catalog.json'));
const src=['seed','rooms','population','floor','validate','architecture','prefabs','playable','topology_v3','prefab_variants','silhouette_variants','circle_profiles','deck_repair'].map(n=>fs.readFileSync(path.join(dir,n+'.js'),'utf8')).join('\n');
const api=Function('prefabCatalog',src+';return {topologyPrototype,bindPrefabs,bindCircleProfiles,repairCircleDecks,playableRoom};')(catalog);
const count=Number(process.argv[2]||1000),repair=process.argv[3]==='repair';assert(Number.isInteger(count)&&count>0);let configs=new Map(),maps=0,skipped=0;
for(let f=0;f<10;f++)for(let seed=0;seed<count;seed++){
 let base=api.bindPrefabs(api.topologyPrototype(seed,f));let plan=repair?api.repairCircleDecks(base):api.bindCircleProfiles(base);maps++;
 for(const node of plan.nodes){let compiled=api.playableRoom(node);if(!compiled){skipped++;continue;}let id=node.prefab.template+'|'+node.prefab.connections.map(x=>x.side+(x.lift?':lift':'')).sort().join(',');if(!configs.has(id))configs.set(id,compiled);}
}
function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
function on(a,b,p){const e=1e-7;return Math.abs(cross(a,b,p))<e&&p.x>=Math.min(a.x,b.x)-e&&p.x<=Math.max(a.x,b.x)+e&&p.y>=Math.min(a.y,b.y)-e&&p.y<=Math.max(a.y,b.y)+e;}
function intersect(a,b,c,d){let u=cross(a,b,c),v=cross(a,b,d),w=cross(c,d,a),z=cross(c,d,b);return (u*v<0&&w*z<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);}
function inside(p,pts){let yes=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){let a=pts[j],b=pts[i];if(on(a,b,p))return true;if((a.y>p.y)!==(b.y>p.y)&&p.x<a.x+(p.y-a.y)*(b.x-a.x)/(b.y-a.y))yes=!yes;}return yes;}
let self=[],bad=[],outsideAnchors=[],outsideLandings=[],outsideDecks=[],corners=0;
for(const [id,{geometry:g,mesh}] of configs){
 let pts=g.pts.map(([x,y])=>({x:x*g.w,y:y*g.h})),n=pts.length,area=0;for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n];area+=a.x*b.y-b.x*a.y;if(Math.hypot(a.x-b.x,a.y-b.y)<1e-6)bad.push({id,edge:i});for(let j=i+1;j<n;j++){if(j===i+1||i===0&&j===n-1)continue;if(intersect(a,b,pts[j],pts[(j+1)%n]))self.push({id,i,j});}}
 if(area<=0||!Number.isFinite(area))bad.push({id,area});
 for(const p of mesh.placements)if(!inside(p.anchor,pts))outsideAnchors.push({id,asset:p.asset,view:p.view,anchor:p.anchor});
 for(const o of mesh.openings)if(!inside(o.landing,pts))outsideLandings.push({id,side:o.side});
 for(const d of mesh.decks){for(const [x,y] of [[d.x,d.y],[d.x+d.w,d.y],[d.x,d.y+d.h],[d.x+d.w,d.y+d.h]]){corners++;if(!inside({x,y},pts))outsideDecks.push({id,deck:d.id,x,y});}}
}
console.log(JSON.stringify({version:repair?'2.7.0-prototype':'2.6.0',seedsPerFloor:count,maps,uniqueConfigs:configs.size,skippedHangar:skipped,selfIntersections:self.length,invalidPerimeters:bad.length,outsideAnchors:outsideAnchors.length,outsideLandings:outsideLandings.length,outsideDeckCorners:outsideDecks.length,deckCornersChecked:corners,examples:{self:self.slice(0,5),bad:bad.slice(0,5),outsideAnchors:outsideAnchors.slice(0,8),outsideLandings:outsideLandings.slice(0,5),outsideDecks:outsideDecks.slice(0,8)},note:'Independent point/polygon and segment audit of catalog data. Anchor and deck checks are optical/candidate checks, not full collider containment, reachability, native behavior or proof of a bug. Hangar excluded.'},null,2));
if(self.length||bad.length||outsideLandings.length||(repair&&outsideDecks.length))process.exitCode=1;
