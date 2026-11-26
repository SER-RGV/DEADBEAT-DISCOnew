// Offline grid flood-fill for each distinct prefab+door configuration in the
// topology prototype. This is not a native movement or collision test.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../../src/room_generation');
const catalog=require(path.join(dir,'prefabs/catalog.json'));
const api=Function('prefabCatalog',['seed','rooms','population','floor','validate','architecture','prefabs','playable','topology_v3'].map(n=>fs.readFileSync(path.join(dir,n+'.js'),'utf8')).join('\n')+';return {topologyPrototype,bindPrefabs,playableRoom};')(catalog);
const n=Number(process.argv[2]||1000);assert(Number.isInteger(n)&&n>0);const configs=new Map();
for(let floor=0;floor<10;floor++)for(let seed=0;seed<n;seed++)for(const node of api.bindPrefabs(api.topologyPrototype(seed,floor)).nodes){
 const compiled=api.playableRoom(node);if(!compiled)continue;
 const signature=node.prefab.template+'|'+node.prefab.connections.map(c=>c.side+(c.lift?':lift':'')).sort().join(',');
 if(!configs.has(signature))configs.set(signature,compiled);
}
const step=25,radius=16;
function free(x,y,c){
 const {geometry:g,mesh}=c,p=g.pts;let inside=false;
 for(let i=0,j=p.length-1;i<p.length;j=i++){
  const ax=p[j][0]*g.w,ay=p[j][1]*g.h,bx=p[i][0]*g.w,by=p[i][1]*g.h,dx=bx-ax,dy=by-ay;
  if((ay>y)!==(by>y)&&x<ax+(y-ay)*dx/dy)inside=!inside;
  const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
  if(Math.hypot(x-ax-t*dx,y-ay-t*dy)<radius)return false;
 }
 if(!inside)return false;
 for(const p of mesh.placements){if(!p.solid)continue;const a=p.collider,dx=x-p.anchor.x,dy=y-p.anchor.y,co=Math.cos(a.angle||0),si=Math.sin(a.angle||0),lx=dx*co+dy*si,ly=-dx*si+dy*co;
  if(a.kind==='circle'&&Math.hypot(lx,ly)<a.r+radius)return false;
  if(a.kind==='capsule'&&Math.hypot(Math.max(0,Math.abs(lx)-a.halfLength),ly)<a.r+radius)return false;
  if(a.kind==='rect'&&Math.abs(lx)<a.w/2+radius&&Math.abs(ly)<a.h/2+radius)return false;
 }
 return true;
}
let doors=0,freePoints=0,reachable=0;
for(const [signature,c] of configs){
 const w=Math.ceil(c.geometry.w/step),h=Math.ceil(c.geometry.h/step),ok=new Uint8Array(w*h),seen=new Uint8Array(w*h);
 const x=i=>(i%w+.5)*step,y=i=>(Math.floor(i/w)+.5)*step;
 for(let i=0;i<ok.length;i++)if(free(x(i),y(i),c)){ok[i]=1;freePoints++;}
 function closest(target){let best=-1,dist=Infinity;for(let i=0;i<ok.length;i++)if(ok[i]){const d=Math.hypot(x(i)-target.x,y(i)-target.y);if(d<dist){dist=d;best=i;}}return {i:best,d:dist};}
 const start=closest({x:c.geometry.w/2,y:c.geometry.h/2});assert(start.i>=0&&start.d<=step*2,signature+': no centre sample');
 const queue=[start.i];seen[start.i]=1;
 for(let k=0;k<queue.length;k++){const i=queue[k],col=i%w,row=Math.floor(i/w);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const cx=col+dx,cy=row+dy;if(cx<0||cx>=w||cy<0||cy>=h)continue;const j=cy*w+cx;if(ok[j]&&!seen[j]){seen[j]=1;queue.push(j);}}}
 reachable+=queue.length;
 for(const d of c.mesh.openings){const target=closest(d.landing);assert(target.i>=0&&target.d<=step*2&&seen[target.i],signature+': no grid path to '+d.side);doors++;}
}
console.log(JSON.stringify({seedsPerFloor:n,maps:n*10,uniquePrefabDoorConfigs:configs.size,doorsTested:doors,freePoints,reachable,note:'25-unit grid, radius 16, perimeter and catalog solids. Compares prefab/door configurations only; ignores native scenic props, moving actors, precise movement, all continuous trajectories and Hangar.'},null,2));
