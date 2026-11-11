// Escena de referencia editable: Y vertical, escenario hacia Z negativo.
// Un único conjunto de objetos, materiales y luces para todas las cámaras.
import * as THREE from './node_modules/three/build/three.module.js';
import {GLTFExporter} from './node_modules/three/examples/jsm/exporters/GLTFExporter.js';
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x070d18);scene.fog=new THREE.Fog(0x0a1020,30,80);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(2560,1440);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
document.querySelector('#viewport').append(renderer.domElement);
const mats={
 concrete:new THREE.MeshStandardMaterial({color:0x222a31,roughness:.84}), steel:new THREE.MeshStandardMaterial({color:0x42454b,metalness:.78,roughness:.4}), black:new THREE.MeshStandardMaterial({color:0x101820,metalness:.48,roughness:.5}),
 gold:new THREE.MeshStandardMaterial({color:0x90703a,metalness:.82,roughness:.32}),glass:new THREE.MeshStandardMaterial({color:0x153044,metalness:.45,roughness:.18}),floor:new THREE.MeshStandardMaterial({color:0x24323a,metalness:.36,roughness:.35}),
 cyan:new THREE.MeshStandardMaterial({color:0x1de4fa,emissive:0x00a0c5,emissiveIntensity:2.2}),pink:new THREE.MeshStandardMaterial({color:0xff40c8,emissive:0xbf0077,emissiveIntensity:2}),violet:new THREE.MeshStandardMaterial({color:0x9655ff,emissive:0x5514bc,emissiveIntensity:1.6}),warm:new THREE.MeshStandardMaterial({color:0xffca78,emissive:0xb2701b,emissiveIntensity:1.3})};
// Textura procedimental determinista: ninguna dependencia de archivos externos.
function texture(){let c=document.createElement('canvas');c.width=c.height=256;let g=c.getContext('2d'),seed=205;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);g.fillStyle='#777';g.fillRect(0,0,256,256);for(let i=0;i<16000;i++){let v=Math.floor(80+rnd()*80);g.fillStyle=`rgba(${v},${v},${v},${rnd()*.18})`;g.fillRect(rnd()*256,rnd()*256,1+rnd()*3,1+rnd()*2)}let t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(12,16);t.colorSpace=THREE.SRGBColorSpace;return t}
const tex=texture();mats.floor.map=tex;mats.concrete.map=tex;
function box(name,x,y,z,w,h,d,mat){let o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.name=name;o.position.set(x,y,z);scene.add(o);return o}
function bar(name,a,b,width,mat){let p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),o=box(name,0,0,0,width,p.distanceTo(q),width,mat);o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),q.sub(p).normalize());return o}
function ring(name,x,z,r,w,mat){let o=new THREE.Mesh(new THREE.RingGeometry(r-w,r,96),mat);o.name=name;o.rotation.x=-Math.PI/2;o.position.set(x,.052,z);scene.add(o)}
function light(name,color,intensity,x,y,z,distance=0){let l=new THREE.PointLight(color,intensity,distance,2);l.name=name;l.position.set(x,y,z);scene.add(l)}
scene.add(new THREE.HemisphereLight(0x7a93bb,0x17101e,1));
box('Suelo continuo',0,-.23,0,28,.46,36,mats.concrete);box('Pista principal',0,.01,0,17,.04,29,mats.floor);
box('Pared izquierda',-14.2,6,0,.4,12,36,mats.concrete);box('Pared derecha',14.2,6,0,.4,12,36,mats.concrete);box('Pared escenario',0,6,-18.2,28,12,.4,mats.black);
// Dos líneas longitudinales y un único aro; plano fijo sin mecanismo.
for(let x of [-4.3,4.3])for(let dx of [-.15,0,.15])box('Banda de latón',x+dx,.045,0,.055,.02,29,mats.gold);
ring('Único aro decorativo empotrado',0,1,2.25,.1,mats.gold);
box('Escenario',0,.65,-14,16,1.3,6,mats.steel);
for(let i=0;i<5;i++)box('Escalón central',0,(i+1)*.13,-8.84-i*.48,4.6,(i+1)*.26,.48,mats.steel);
box('Cabina DJ',0,2.03,-15,3.2,1.45,1.2,mats.black);box('Encimera DJ',0,2.8,-15,3.3,.1,1.3,mats.gold);
for(let x of [-.9,0,.9])box('Consola DJ',x,2.9,-14.8,.6,.14,.4,mats.steel);
// Paneles geométricos: no logotipo, no símbolos narrativos.
for(let x of [-5.5,-4.4,-3.3,3.3,4.4,5.5]){box('Panel escenario',x,5.4,-17.95,.72,6.4,.06,mats.glass);box('Luz vertical escenario',x,5.4,-17.9,.06,6.1,.04,x<0?mats.cyan:mats.pink)}
for(let x of [-7.3,7.3])box('Marco escenario',x,5.3,-17.85,.12,8,.08,mats.gold);
function speaker(x,y,z,s=1){box('Caja de altavoz',x,y,z,1.3*s,3.2*s,1.1*s,mats.black);for(let dy of [-1,0,1]){let mesh=new THREE.Mesh(new THREE.CylinderGeometry(.38*s,.38*s,.09*s,24),mats.steel);mesh.rotation.x=Math.PI/2;mesh.position.set(x,y+dy*s,z+.57*s);mesh.name='Cono altavoz';scene.add(mesh)}}
for(let x of [-6.3,6.3])speaker(x,2.9,-15);
for(let x of [-9.5,9.5])for(let z of [-6,5]){speaker(x,8.2,z,.85);bar('Suspensión altavoz',[x,9.6,z],[x,11.5,z],.09,mats.steel)}
for(let side of [-1,1]){
 box('Balcón lateral',side*11.6,4,0,4.6,.3,31,mats.steel);
 for(let z of [-14,-7,0,7,14]){box('Pilar industrial',side*9.2,5.9,z,.5,11.8,.55,mats.steel);box('Ménsula déco',side*9.2,9.8,z,.95,.16,.8,mats.gold);box('Panel cristal',side*13.95,6.8,z,.06,4.8,4.5,mats.glass);for(let dz of [-1.8,1.8])box('Ribete de panel',side*13.89,6.8,z+dz,.08,4.8,.07,mats.gold)}
 for(let z=-14;z<=14;z+=2)bar('Montante barandilla',[side*9.3,4.15,z],[side*9.3,5.25,z],.07,mats.gold);
 bar('Pasamanos balcón',[side*9.3,5.25,-15],[side*9.3,5.25,15],.1,mats.gold);
 for(let z of [-11,1,9]){box('Armario técnico',side*12,1.5,z,1.4,3,1.3,mats.black);for(let y of [.7,1,1.3,1.6,1.9,2.2,2.5])box('Piloto equipo',side*12-side*.72,y,z,.04,.05,.7,y<1.6?mats.cyan:mats.pink)}
 for(let i=0;i<12;i++)box('Escalera lateral',side*12,(i+1)*.165,14-i*.58,2.1,(i+1)*.33,.58,mats.steel);
}
for(let z of [-6,5]){
 box('Pasarela transversal',0,9.8,z,21,.16,1.1,mats.steel);
 for(let dz of [-.6,.6]){bar('Baranda pasarela',[-10,10.9,z+dz],[10,10.9,z+dz],.08,mats.gold);for(let x=-10;x<=10;x+=2)bar('Montante pasarela',[x,9.9,z+dz],[x,10.9,z+dz],.06,mats.steel)}
 for(let x=-10;x<10;x+=2)bar('Cercha diagonal',[x,9,z],[x+2,9.8,z],.09,mats.steel);bar('Cercha inferior',[-10,9,z],[10,9,z],.12,mats.steel);
 for(let x of [-8,-4,0,4,8]){box('Foco anclado',x,8.83,z,.45,.48,.45,mats.black);box('Lente foco',x,8.56,z,.25,.05,.25,x<0?mats.cyan:mats.pink)}
}
for(let x of [-10,0,10])bar('Viga longitudinal',[x,11.45,-17],[x,11.45,17],.2,mats.steel);
// Luces fijas de escena, compartidas por los tres encuadres.
light('Baño cian',0x00dfff,800,-7,8,1,26);light('Baño magenta',0xff149f,800,7,8,1,26);light('Escenario cian',0x20bbff,650,-4,7,-12,20);light('Escenario magenta',0xfa1786,650,4,7,-12,20);light('Violeta trasera',0x6739ff,450,0,7,12,20);light('Ámbar',0xffb45a,150,0,9,-2,26);
// Convención: Three.js x transversal, y altura, z negativo hacia escenario; parámetros documentados.
const cameraDefs={BG04:{pos:[-8,3.0,14],target:[0,3,-12],fov:66},BG05:{pos:[0,10.6,17.6],target:[0,2.2,-3.5],fov:73},BG06:{pos:[0,2.7,8],target:[0,3.1,-14],fov:57}};
const cameras={};for(const [name,d] of Object.entries(cameraDefs)){let c=new THREE.PerspectiveCamera(d.fov,16/9,.1,200);c.name=name;c.position.set(...d.pos);c.lookAt(...d.target);c.updateMatrixWorld();cameras[name]=c;scene.add(c)}
const select=document.querySelector('#camera');const query=new URLSearchParams(location.search);if(cameras[query.get('camera')])select.value=query.get('camera');
function render(){renderer.render(scene,cameras[select.value]);document.querySelector('#camera-data').textContent=JSON.stringify(cameraDefs[select.value]);}
select.addEventListener('change',render);document.querySelector('#save').addEventListener('click',()=>{render();const a=document.createElement('a');a.download=select.value.toLowerCase()+'.png';a.href=renderer.domElement.toDataURL('image/png');a.click()});
render();window.__scene08c5={scene,cameras,cameraDefs,renderer,render,exportGLB:()=>new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true})};document.documentElement.dataset.ready='true';
