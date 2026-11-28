"""RG2 migration: build-time adapters for the protected native engine and its HUD facade."""
from pathlib import Path
import json


def migrate(html, root):
    def replace(anchor, new):
        nonlocal html
        if html.count(anchor) != 1:
            raise ValueError(f"Unexpected engine revision: {anchor}")
        html = html.replace(anchor, new, 1)

    # Replace whole legacy graph/shell functions in the protected monolith. Keep
    # its collision solver, world-to-wall door projection and encounter controllers.
    rg_dir = Path(root) / "src/room_generation"
    rg_source = "\n".join((rg_dir / name).read_text() for name in ("seed.js", "rooms.js", "population.js", "floor.js", "validate.js", "debug.js", "architecture.js", "pilot_perf.js", "prefabs.js", "playable.js", "population_compiled.js", "topology_v3.js", "prefab_variants.js"))
    rg_source = "const prefabCatalog=" + json.dumps(json.loads((rg_dir / "prefabs/catalog.json").read_text()), separators=(",", ":")) + ";\n" + rg_source
    start, end = html.index("function rg(e)"), html.index("function lg(e)")
    html = html[:start] + "function ng(index,shop,install){const f=Xe(index+1),n=ug(f).nodes.find(n=>shop?n.shop:n.index===index&&!n.shop);const draft=roomGeneration.playableRoom(n);if(install)nativePrefab=draft;return draft?([\"2.3.0\",\"2.4.0\"].includes(roomGeneration.version)?{...draft.geometry}:draft.geometry):{...n.geometry};}" + html[end:]
    start,end = html.index("function ug(e)"),html.index("function pg()")
    html = html[:start] + "function ug(f){if(!Ot.graphs.has(f))Ot.graphs.set(f,roomGeneration.generate(Yo.seed,f));return Ot.graphs.get(f);}" + html[end:]
    # Os(0) runs during engine initialization; initialize the module before it.
    replace('<head>', '<head><script>window.DD_ROOM_GENERATION=(()=>{'+rg_source+''';
const legacyVersion="2.0.0", adaptedVersion="2.1.0", topologyVersion="2.2.0", unifiedVersion="2.3.0", variantsVersion="2.4.0";
// Keep a saved layout on its original generator, including old saves lacking a version.
// This is latched at boot, not toggled during a run.
let savedVersion=null;
try { const raw=localStorage.getItem("dmo_floor_v32"); if(raw){const saved=JSON.parse(raw); if(saved && saved.v===1) savedVersion=saved.generatorVersion || legacyVersion;} } catch(e) {}
if(savedVersion && ![legacyVersion,adaptedVersion,topologyVersion,unifiedVersion,variantsVersion].includes(savedVersion)) throw Error("Unsupported room generator version: "+savedVersion);
const selectedVersion=savedVersion || (window.__DD_ROOM_VARIANTS_V3===true ? variantsVersion : window.__DD_UNIFIED_ROOM_GEOMETRY===true ? unifiedVersion : window.__DD_ROOM_TOPOLOGY_V3===true ? topologyVersion : window.__DD_ROOM_SPAWN_GUARDS===true ? adaptedVersion : legacyVersion);
function generateVersioned(s,f,version=selectedVersion){
  if(![legacyVersion,adaptedVersion,topologyVersion,unifiedVersion,variantsVersion].includes(version)) throw Error("Unsupported room generator version: "+version);
  const plan=bindPrefabs([topologyVersion,unifiedVersion,variantsVersion].includes(version) ? topologyPrototype(s,f) : generate(s,f));
  if(version===variantsVersion) bindPrefabVariants(plan);
  if(version!==legacyVersion){
    for(const node of plan.nodes){
      const compiled=playableRoom(node);if(!compiled)continue;
      node.population=adaptPopulationCompiled(node.population,compiled);validatePopulationCompiled(node.population,compiled);
      if([unifiedVersion,variantsVersion].includes(version)) node.geometry=compiled.geometry;
    }
    plan.version=version;
  }
  return plan;
}
return Object.freeze({version:selectedVersion,topologyEnabled:[topologyVersion,unifiedVersion,variantsVersion].includes(selectedVersion),playableRoom,generate:generateVersioned,hangarShell:(key,edges,doors)=>compileArchitecture({key,edges,doors,props:[],spawns:[]}),...(new URLSearchParams(location.search).has("roomDebug")?{visualize,compileArchitecture,createPilotPerf,instantiatePrefab}:{})});})();</script>''')
    replace('function Os(e){','let nativePrefab=null;const roomGeneration=window.DD_ROOM_GENERATION;function Os(e){')
    replace('ng=function(e,a){const t=NA(e,a),','ng=function(e,a,install){const t=NA(e,a,install),')
    replace('function Um(){const e={made:0','function Um(){if(nativePrefab)return 0;const e={made:0')
    replace('const a=ng(e,Ot.enabled&&fg());','const a=ng(e,Ot.enabled&&fg(),true);')
    replace('function cg(e,a){','function cg(e,a){if(nativePrefab){const edge=Rs.edges[nativePrefab.sockets[e]],wallX=edge.a.x+edge.dx/2,wallY=edge.a.y+edge.dy/2;return {side:e,edge,wallX,wallY,x:wallX+edge.nx*(a||0),y:wallY+edge.ny*(a||0),nx:edge.nx,ny:edge.ny,tx:edge.dx/edge.len,ty:edge.dy/edge.len};}')
    replace('r&&!t&&Wo>=3&&(Gr.encoreOffer||Math.random()<.24)', 'r&&!t&&Wo>=3&&(Gr.encoreOffer||o.type==="event")')
    replace('gg()&&function(){if(!Ot.enabled)', 'r&&["treasure","secret","supersecret","special"].includes(o.type)&&Qh(Wo,o.type==="supersecret"?"reserve":"route"),gg()&&function(){if(!Ot.enabled)')
    replace('function Mg(e){', 'function mandatoryClear(boss){return ug(Ot.floor).nodes.filter(n=>!n.shop&&!["secret","supersecret"].includes(n.type)&&(boss||n.local!==10)).every(hg)}function allMandatoryClearedV3(){for(let f=0;f<=9;f++){if(!ug(f).nodes.filter(n=>!n.shop&&!["secret","supersecret"].includes(n.type)&&!(f===9&&n.type==="boss")).every(hg))return false;}return true}function Mg(e){')
    replace('un.roundsCompleted>=He.finalRound-1', '(roomGeneration.topologyEnabled?allMandatoryClearedV3():un.roundsCompleted>=He.finalRound-1)')
    replace('e.lift?mg()===Ge:!e.final||mg()>=10', 'e.lift?mandatoryClear(true):!e.final||mandatoryClear(false)')
    replace('if(!Bt.unlockRooms&&mg()!==Ge||Ot.floor>=9)', 'if(!Bt.unlockRooms&&!mandatoryClear(true)||Ot.floor>=9)')
    # The 2.2 núcleo starts at r100; the final boss remains r99 / level 100.
    replace('Ot.key="r"+(Ot.floor>=9?qe:Ot.floor*Ge)', 'Ot.key="r"+(Ot.floor>=9&&roomGeneration.topologyEnabled?100:Ot.floor>=9?qe:Ot.floor*Ge)')
    replace('vg("r"+(Ot.floor>=9?qe:Ot.floor*Ge),null,!0)', 'vg("r"+(Ot.floor>=9&&roomGeneration.topologyEnabled?100:Ot.floor>=9?qe:Ot.floor*Ge),null,!0)')
    # Levels above 100 are ordinary núcleo rooms in 2.2, not final-boss rewards.
    assert html.count('Wo>=100') == 2
    html = html.replace('Wo>=100', '(roomGeneration.topologyEnabled?_e(Wo):Wo>=100)')
    replace('despeja las otras 10 salas','despeja las salas principales')
    replace('completa las 11 salas del círculo','completa la ruta principal')
    replace('function pg(){','if(new URLSearchParams(location.search).has("roomDebug"))window.DD_ROOM_DEBUG={prefab:(key=Ot.key)=>roomGeneration.instantiatePrefab(ug(Ot.floor).nodes.find(n=>n.key===key)),architecture:()=>roomGeneration.compileArchitecture({key:Ot.key,edges:Rs.edges,doors:Ot.doors,props:tc,spawns:pg().population.spawns.map(p=>({x:Ps.x+p.x*Ps.w,y:Ps.y+p.y*Ps.h}))}),generate:roomGeneration.generate,current:()=>structuredClone(ug(Ot.floor)),inspect:()=>({room:structuredClone(pg()),doors:Ot.doors.map(({side,x,y,to})=>({side,x,y,to})),obstacles:Ac.props(),spawns:Ac.spawnProbePoints()}),map:()=>console.table(ug(Ot.floor).nodes.map(({key,type,x,y,links})=>({key,type,x,y,doors:links.map(l=>l.side+":"+l.to).join(" ")})))};function pg(){')
    # Preserve external venue dressing, collider construction and flood-fill
    # validation; replace the floor-prop proposal/remix/rescue pipeline itself.
    start=html.index("for(const e of function(){const e=Uo(),a=function(e){void 0===e&&(e=4095)")
    end=html.index("},validate:m,selfTest:",start)
    html=html[:start]+'''const node=pg();if(nativePrefab){tc.length=0;for(const p of nativePrefab.mesh.placements){const c=p.collider,prop=mc({name:p.id,style:({monitor:'speaker',mesa:'table',sofa:'sofa',puesto:'counter',panel:'rig'})[p.asset],kind:c.kind,w:c.w,h:c.h,r:c.r,d:2*(c.halfLength||0),a:c.angle,rot:c.angle,x:Ps.x+p.anchor.x,y:Ps.y+p.anchor.y,onFloor:true,tall:p.solid&&!p.destructible,solid:p.solid,stage:'prefab'});prop.prefabId=p.id;prop.sortY=Ps.y+p.sortY;tc.push(prop);}t=true;try{Um()}catch(e){}return m();}for(const p of node.population.props){const def=Go[p.kind];const prop=mc({...def,name:node.geometry.label+" · "+p.kind,onFloor:true,x:Ps.x+p.x*Ps.w,y:Ps.y+p.y*Ps.h,seed:a+s,stage:def.tall?undefined:"movable"});if(y(prop)){tc.push(prop);s++;}}let check=m();while(!check.valid&&s>0){tc.pop();s--;check=m();}i=check.remix=node.type;t=true;try{Um()}catch(e){}return check'''+html[end:]
    for tail in [',qs(),Pg();try{window.__PW77&&window.__PW77.applyLayout()}catch(e){}',',qs();try{window.__PW77&&window.__PW77.applyLayout()}catch(e){}']:
        assert tail in html
        html=html.replace(tail,';')
    for first,last in [('function Pg(){','function Ig(){'),('function qs(){','w.roomGeometryAudit=Bs')]:
        a,b=html.index(first),html.index(last);html=html[:a]+html[b:]
    replace('function iu(e,a,t,o){','''function roomCast(distance){const n=pg(),sites=n.population.spawns;for(let k=0;k<sites.length;k++){const p=sites[(k+Ko+Ta.length)%sites.length],x=Ps.x+p.x*Ps.w,y=Ps.y+p.y*Ps.h;if(js(x,y,36)&&!nc(x,y,36)&&!jc.inGap(x,y,36)&&Math.hypot(x-ye.x,y-ye.y)>distance&&Ta.every(t=>Math.hypot(t.x-x,t.y-y)>t.r+38))return {x,y};}return null;}function iu(e,a,t,o){''')
    replace('const s=t||Uc(260),c=Math.log1p', 'const s=t||roomCast(260);if(!s)return false;const c=Math.log1p')
    replace('const e=Uc(320),a=Math.round','const e=roomCast(320);if(!e)return null;const a=Math.round')
    replace('e.shop||Array.isArray(un.completedRoomIds72)', 'e.shop||(["rest","treasure","special"].includes(e.type)&&Ot.visited.has(e.key))||Array.isArray(un.completedRoomIds72)')
    replace('function Xm(e){return!!Ot.visited.has(e.key)||','function Xm(e){return!!Ot.visited.has(e.key)||!["secret","supersecret"].includes(e.type)&&')
    replace('label:t.shop?"TIENDA · LA CABINA"','label:["secret","supersecret"].includes(t.type)&&!Ot.visited.has(t.key)?"PASO DE SERVICIO":t.shop?"TIENDA · LA CABINA"')
    replace('seed:1e9*Math.random()|0,lastAmmoDrop:0','seed:roomRunSeed(),lastAmmoDrop:0')
    replace('function rp(){','function roomRunSeed(){const q=new URLSearchParams(location.search),v=q.get("roomSeed");return q.has("roomDebug")&&v!==null&&/^\\d+$/.test(v)?Number(v)>>>0:crypto.getRandomValues(new Uint32Array(1))[0];}function rp(){')
    replace('STATE.seed = (seed | 0) || mintSeed();','STATE.seed = seed == null ? mintSeed() : seed >>> 0; visitedCells = {}; typeCursor = 0;')
    replace('var payload = { v: 1, seed: STATE.seed','var payload = { v: 1, generatorVersion: root.DD_ROOM_GENERATION.version, seed: STATE.seed')
    replace('if (!nodes) nodes = internalNodes(circleIndex, rng);','if (!nodes) nodes = root.DD_ROOM_GENERATION.generate(STATE.seed, circleIndex).nodes;')
    a,b=html.index('  function internalNodes('),html.index('  function generateLayout(');html=html[:a]+html[b:]
    a,b=html.index('    // Tesoro: hoja más lejana'),html.index('    if (treasure && !treasure.role)');html=html[:a]+"    treasure=cells.find(c=>c.local===6 && !(circleIndex===9 && root.DD_ROOM_GENERATION.topologyEnabled));\n"+html[b:]
    replace('layout.cols = 5; layout.rows = 5;', 'layout.cols=Math.max(...nodes.map(n=>n.x))-Math.min(...nodes.map(n=>n.x))+1;layout.rows=Math.max(...nodes.map(n=>n.y))-Math.min(...nodes.map(n=>n.y))+1;')
    # The legacy cartography deliberately saves no cells for the old single-room
    # nucleus. Version 2.2 needs the actual graph persisted and displayed instead.
    replace('if (circle >= 9) {', 'if (circle >= 9 && !root.DD_ROOM_GENERATION.topologyEnabled) {')
    replace('if (room.biomes.indexOf(circleIndex) === -1) continue;', 'if (room.biomes.indexOf(circleIndex === 9 && root.DD_ROOM_GENERATION.topologyEnabled ? 8 : circleIndex) === -1) continue;')
    replace('generate:roomGeneration.generate,current:', 'show:(seed=Yo.seed,floor=Ot.floor)=>roomGeneration.visualize(roomGeneration.generate(seed,floor),Ot.key),generate:roomGeneration.generate,current:')
    replace('spawns:Ac.spawnProbePoints()', 'spawns:pg().population.spawns.map(p=>({x:Ps.x+p.x*Ps.w,y:Ps.y+p.y*Ps.h}))')
    replace('const o=-Math.PI/2+.9*(a-1),r={x:Rs.cx+145*Math.cos(o),y:Rs.cy+145*Math.sin(o)}','const p=pg().population.reward,r={x:Ps.x+p.x*Ps.w+80*(a-1),y:Ps.y+p.y*Ps.h}')
    replace('const c=ar&&ar.countMult||1;if(Jo=', 'const c=(ar&&ar.countMult||1)*pg().waveScale;if(Jo=')
    # Drop the two unused shell libraries. Native material presets are still used.
    for first,last in [(',Is=[{id:"wide"',',Rs={'),(',Ft=[{id:"l-wing"',',Qt={')]:
        a,b=html.index(first),html.index(last,html.index(first));html=html[:a]+html[b:]
    replace('version:"2.72.0",profiles:Is.length+Ft.length','version:"2.0.0",profiles:5')
    replace('return cell.room.name;', 'return cell.generationLabel || cell.room.name;')
    replace('isShop: !!n.shop,','generationType:n.type, generationLabel:n.geometry?.label, isShop: !!n.shop,')
    replace('var seen = !!visitedCells[c.key];','var seen = !!visitedCells[c.key]; if (!seen && ["secret","supersecret"].includes(c.generationType)) continue;')
    # Scenic furniture remains visible, but may not claim an enemy landing pad.
    replace('function qm(e,a,t){','function qm(e,a,t){if(pg().population.spawns.some(p=>Math.hypot(e.x-Ps.x-p.x*Ps.w,e.y-Ps.y-p.y*Ps.h)<e.br+48))return "spawn";')
    replace('function Dh(e,a){','function Dh(e,a){if(a==="reserve")return e>=78?4:3;')
    # Retire PW77's old placement mutator, retaining its separate art plans.
    a,b=html.index('applyLayout:function(){const e=function()'),html.index('ensurePlan:s,',html.index('applyLayout:function(){const e=function()'));html=html[:a]+html[b:]
    return html
