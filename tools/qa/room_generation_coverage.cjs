// Deterministic geometric cover proxy, not a projectile/LOS test in the native game.
const {generate,bindPrefabs,instantiatePrefab}=require('../prefabs/inspect.cjs');
const catalog=require('../../src/room_generation/prefabs/catalog.json');
const step=20, radius=18, maxDistance=400, rayStep=5;
function inside(poly,x,y) {let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[2]>y)!==(b[2]>y)&&x<(b[1]-a[1])*(y-a[2])/(b[2]-a[2])+a[1])yes=!yes;}return yes;}
function blocked(p,x,y,r=0){const c=p.collider,dx=x-p.anchor.x,dy=y-p.anchor.y,cs=Math.cos(c.angle||0),sn=Math.sin(c.angle||0),lx=dx*cs+dy*sn,ly=-dx*sn+dy*cs;if(c.kind==='circle')return Math.hypot(lx,ly)<c.r+r;if(c.kind==='capsule')return Math.hypot(Math.max(0,Math.abs(lx)-c.halfLength),ly)<c.r+r;if(c.kind==='rect')return Math.hypot(Math.max(0,Math.abs(lx)-c.w/2),Math.max(0,Math.abs(ly)-c.h/2))<r;return false;}
const found={};
for(let floor=0;floor<10&&Object.keys(found).length<5;floor++)for(let seed=0;seed<20&&Object.keys(found).length<5;seed++)for(const n of bindPrefabs(generate(seed,floor)).nodes)if(!found[n.prefab.template])found[n.prefab.template]=instantiatePrefab(n);
const output={};for(const [name,mesh] of Object.entries(found)){
 const poly=catalog.templates[name].perimeter,w=Math.max(...poly.map(v=>v[1])),h=Math.max(...poly.map(v=>v[2])),solid=mesh.placements.filter(p=>p.solid);let free=0,eligible=0,covered=0,obstructed=0,rays=0;
 for(let y=step/2;y<h;y+=step)for(let x=step/2;x<w;x+=step){if(!inside(poly,x,y)||solid.some(p=>blocked(p,x,y,radius)))continue;let nearWall=false;for(let i=0;i<poly.length;i++){let a=poly[i],b=poly[(i+1)%poly.length],dx=b[1]-a[1],dy=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[1])*dx+(y-a[2])*dy)/(dx*dx+dy*dy)));if(Math.hypot(x-a[1]-t*dx,y-a[2]-t*dy)<radius){nearWall=true;break}}if(nearWall)continue;free++;let eligibleHere=false,coveredHere=false;
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const ex=x+dx*maxDistance,ey=y+dy*maxDistance;if(!inside(poly,ex,ey)||solid.some(p=>blocked(p,ex,ey,radius)))continue;let hit=false,valid=true;for(let d=rayStep;d<maxDistance;d+=rayStep){let sx=x+dx*d,sy=y+dy*d;if(!inside(poly,sx,sy)){valid=false;break;}if(solid.some(p=>blocked(p,sx,sy)))hit=true;}if(!valid)continue;eligibleHere=true;rays++;if(hit){obstructed++;coveredHere=true;}}
 if(eligibleHere)eligible++;if(coveredHere)covered++;
 }
 output[name]={freeGridPoints:free,eligiblePoints:eligible,pointsWithAtLeastOneBlockedRay:covered,percentEligibleCovered:eligible?100*covered/eligible:0,validRays:rays,blockedRays:obstructed,percentRaysBlocked:rays?100*obstructed/rays:0};
}
console.log(JSON.stringify({method:{grid:step,playerRadius:radius,rayDistance:maxDistance,rayStep,angles:'four cardinal directions',obstacles:'solid prefab footprint, including destructible; excludes native scenery, doors, hazards and entities',meaning:'obstructed rays are a geometric proxy only, not verified native projectile cover'},templates:output},null,2));
