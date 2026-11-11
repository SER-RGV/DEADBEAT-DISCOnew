// 08C6: copia versionada de 08C5; una escena y cámaras compartidas. Y vertical, escenario hacia Z negativo.
// Un único conjunto de objetos, materiales y luces para todas las cámaras.
import * as THREE from '../node_modules/three/build/three.module.js';
import {GLTFExporter} from '../node_modules/three/examples/jsm/exporters/GLTFExporter.js';
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x070d18);scene.fog=new THREE.Fog(0x0a1020,30,80);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(2560,1440);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.querySelector('#viewport').append(renderer.domElement);
const mats={
 concrete:new THREE.MeshStandardMaterial({color:0x222a31,roughness:.84}), steel:new THREE.MeshStandardMaterial({color:0x42454b,metalness:.78,roughness:.4}), black:new THREE.MeshStandardMaterial({color:0x101820,metalness:.48,roughness:.5}),
 gold:new THREE.MeshStandardMaterial({color:0x90703a,metalness:.82,roughness:.32}),glass:new THREE.MeshStandardMaterial({color:0x153044,metalness:.45,roughness:.18}),floor:new THREE.MeshStandardMaterial({color:0x24323a,metalness:.36,roughness:.35}),
 cyan:new THREE.MeshStandardMaterial({color:0x1de4fa,emissive:0x00a0c5,emissiveIntensity:2.2}),pink:new THREE.MeshStandardMaterial({color:0xff40c8,emissive:0xbf0077,emissiveIntensity:2}),violet:new THREE.MeshStandardMaterial({color:0x9655ff,emissive:0x5514bc,emissiveIntensity:1.6}),warm:new THREE.MeshStandardMaterial({color:0xffca78,emissive:0xb2701b,emissiveIntensity:1.3})};
// Textura procedimental determinista: ninguna dependencia de archivos externos.
function texture(){let c=document.createElement('canvas');c.width=c.height=256;let g=c.getContext('2d'),seed=205;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);g.fillStyle='#777';g.fillRect(0,0,256,256);for(let i=0;i<16000;i++){let v=Math.floor(80+rnd()*80);g.fillStyle=`rgba(${v},${v},${v},${rnd()*.18})`;g.fillRect(rnd()*256,rnd()*256,1+rnd()*3,1+rnd()*2)}let t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(12,16);t.colorSpace=THREE.SRGBColorSpace;return t}
// Texturas procedimentales deterministas, generadas localmente: color y relieve sin imágenes externas.
function surface(kind){
 let c=document.createElement('canvas');c.width=c.height=512;let g=c.getContext('2d'),seed=kind==='steel'?303:kind==='floor'?149:401;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 g.fillStyle=kind==='steel'?'#aaa9a5':kind==='floor'?'#99999a':'#a7a4a0';g.fillRect(0,0,512,512);
 for(let i=0;i<24000;i++){let x=rnd()*512,y=rnd()*512,v=60+Math.floor(rnd()*170),a=rnd()*.18;g.fillStyle=`rgba(${v},${v},${v},${a})`;g.fillRect(x,y,kind==='steel'?1+rnd()*28:1+rnd()*4,kind==='steel'?.6:1+rnd()*3)}
 if(kind==='floor'){g.strokeStyle='#63666a';g.lineWidth=2;for(let y=0;y<=512;y+=128){g.beginPath();g.moveTo(0,y);g.lineTo(512,y);g.stroke()}for(let y=0;y<512;y+=128){let off=(y/128)%2?64:0;for(let x=off;x<=512;x+=128){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+128);g.stroke()}}}
 let t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='floor'?5:2,kind==='floor'?8:3);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const floorTex=surface('floor'),concreteTex=surface('concrete'),steelTex=surface('steel');
mats.floor.map=floorTex;mats.floor.bumpMap=floorTex;mats.floor.bumpScale=.055;mats.floor.roughness=.7;mats.floor.metalness=.18;
mats.concrete.map=concreteTex;mats.concrete.bumpMap=concreteTex;mats.concrete.bumpScale=.1;
mats.steel.map=steelTex;mats.steel.bumpMap=steelTex;mats.steel.bumpScale=.025;mats.steel.roughness=.64;mats.steel.metalness=.65;
mats.black.roughness=.66;mats.gold.roughness=.58;mats.glass.roughness=.32;
for(const m of [mats.cyan,mats.pink,mats.violet])m.emissiveIntensity=.85;
function box(name,x,y,z,w,h,d,mat){let o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.name=name;o.position.set(x,y,z);scene.add(o);return o}
function bar(name,a,b,width,mat){let p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),o=box(name,0,0,0,width,p.distanceTo(q),width,mat);o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),q.sub(p).normalize());return o}
function ring(name,x,z,r,w,mat){let o=new THREE.Mesh(new THREE.RingGeometry(r-w,r,96),mat);o.name=name;o.rotation.x=-Math.PI/2;o.position.set(x,.052,z);scene.add(o)}
function light(name,color,intensity,x,y,z,distance=0){let l=new THREE.PointLight(color,intensity,distance,2);l.name=name;l.position.set(x,y,z);scene.add(l)}
scene.add(new THREE.HemisphereLight(0x8697ae,0x292322,1.2));
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
light('Baño cian',0x32bacb,310,-7,8,1,26);light('Baño magenta',0xd02c78,310,7,8,1,26);light('Escenario cian',0x40a9c1,330,-4,7,-12,20);light('Escenario magenta',0xc73b7b,330,4,7,-12,20);light('Violeta trasera',0x7552c6,210,0,7,12,20);light('Ámbar',0xffc77f,230,0,9,-2,26);
// 08C6: detalles secundarios, fijos y visibles según oclusión real; no alteran la planta.
const trim=new THREE.MeshStandardMaterial({color:0x504735,metalness:.68,roughness:.7,map:steelTex,bumpMap:steelTex,bumpScale:.016});
const grille=new THREE.MeshStandardMaterial({color:0x20282e,metalness:.55,roughness:.8});
// Losetas de suelo y juntas. No añade un segundo aro ni cambia la geometría de pista.
for(let z=-14;z<=14;z+=2.8)box('Junta transversal pavimento',0,.035,z,16.8,.006,.026,mats.black);
for(let x of [-7,-5.6,-2.8,0,2.8,5.6,7])box('Junta longitudinal pavimento',x,.034,0,.022,.006,28.8,mats.black);
// Pórticos: bridas, chapas y remaches geométricos sobre los pilares existentes.
for(let side of [-1,1])for(let z of [-14,-7,0,7,14]){
 for(let y of [.22,4.3,8.9]){box('Placa pilar',side*9.2,y,z,.76,.17,.82,trim);for(let dx of [-.26,.26])for(let dz of [-.28,.28])box('Remache de placa',side*9.2+dx,y+.095,z+dz,.07,.04,.07,mats.gold)}
 box('Tirante de pared',side*13.65,3,z,.24,6,.24,mats.steel);
}
// Las barandas reciben travesaños y diagonales déco, en la misma geometría para todas las cámaras.
for(let side of [-1,1]){
 bar('Travesaño de baranda',[side*9.3,4.7,-15],[side*9.3,4.7,15],.055,mats.gold);
 for(let z=-14;z<14;z+=2)bar('Diagonal de baranda',[side*9.3,4.25,z],[side*9.3,5.2,z+2],.04,trim);
 for(let z of [-11,1,9]){
  for(let y=.5;y<=2.5;y+=.25)box('Panel rack',side*12-side*.72,y,z+.27,.035,.09,.45,grille);
  for(let y of [.8,1.4,2])box('Indicador rack',side*12-side*.75,y,z-.38,.04,.05,.07,mats.warm);
 }
}
for(let z of [-6,5]){
 // Bordes y cables estructurales de las pasarelas.
 for(let dz of [-.53,.53])bar('Larguero pasarela',[-10,9.72,z+dz],[10,9.72,z+dz],.09,trim);
 for(let x=-9;x<=9;x+=1.5)bar('Costilla pasarela',[x,9.72,z-.54],[x,9.72,z+.54],.06,mats.steel);
 for(let x of [-8,-4,0,4,8]){box('Aro de carcasa foco',x,8.59,z,.36,.05,.36,trim);bar('Cable foco',[x,9.03,z],[x+.4,9.65,z],.025,mats.black)}
}
// Frontal de escenario, nervios y maquinaria de audio.
for(let x=-7;x<=7;x+=1.4){box('Panel frontal escenario',x,.68,-10.98,1.25,.95,.035,mats.black);box('Ribete frontal escenario',x,1.19,-10.94,1.25,.045,.04,trim)}
for(let x of [-6.3,6.3]){
 for(let y of [1.9,2.9,3.9]){
  let rim=new THREE.Mesh(new THREE.TorusGeometry(.4,.035,8,24),trim);rim.position.set(x,y,-14.395);rim.name='Aro de altavoz';scene.add(rim);
  for(let d of [-.5,.5])box('Rejilla altavoz',x+d,y,-14.38,.025,.88,.025,grille);
 }
}
for(let x of [-.9,0,.9]){for(let dx of [-.16,0,.16])for(let dz of [-.1,.1])box('Mando consola',x+dx,2.99,-14.8+dz,.06,.05,.06,mats.warm);box('Pantalla consola',x,3.0,-14.67,.38,.045,.12,mats.cyan)}
// Equipo escénico y estructura secundaria: superficies negras, marcos y señal luminosa sin texto.
box('Pantalla central apagada',0,5.8,-17.82,4.6,2.8,.1,mats.glass);
for(let x of [-2.38,2.38])box('Marco lateral pantalla',x,5.8,-17.74,.12,3.1,.12,trim);
for(let y of [4.3,7.3])box('Marco horizontal pantalla',0,y,-17.74,4.85,.12,.12,trim);
for(let x of [-1.7,-1.1,-.55,0,.55,1.1,1.7])box('Barra luminosa abstracta',x,5.8,-17.7,.1,1.1+1.05*(1-Math.abs(x)/2),.035,x<0?mats.cyan:mats.violet);
for(let x of [-7.5,7.5]){
 box('Soporte técnico escenario',x,2.6,-16.5,.4,3.8,.4,mats.steel);
 for(let y of [1.2,2,2.8,3.6])box('Anclaje soporte escenario',x,y,-16.25,.55,.12,.12,trim);
}
for(let side of [-1,1])for(let z of [-13,-6,1,8,14]){
 box('Panel inferior industrial',side*13.95,2,z,.07,3.4,5.8,mats.black);
 for(let dz of [-2.5,0,2.5])box('Junta panel industrial',side*13.88,2,z+dz,.08,3.2,.06,trim);
 box('Canal de luz lateral',side*13.78,3.7,z,.08,.06,4.5,side<0?mats.cyan:mats.pink);
}
for(let x of [-8.2,8.2])box('Marcador luz suelo',x,.048,0,.045,.025,27.5,x<0?mats.cyan:mats.pink);
// Conos translúcidos fijos en escena: aproximación gráfica de haz, no dispersión volumétrica.
const shaftL=new THREE.MeshBasicMaterial({color:0x57cce4,transparent:true,opacity:.028,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
const shaftR=new THREE.MeshBasicMaterial({color:0xe75da8,transparent:true,opacity:.028,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
for(let x of [-5.8,5.8]){
 const h=8.1,mesh=new THREE.Mesh(new THREE.ConeGeometry(1.3,h,20,1,true),x<0?shaftL:shaftR);mesh.name='Haz estilizado anclado';mesh.position.set(x,4.8,-6);scene.add(mesh);
}
light('Relleno neutro cabina',0xf4d2a8,160,0,7,-10,16);
// Iluminación fija común. Un mapa de sombras 2048, no path tracing ni volumetría.
const key=new THREE.DirectionalLight(0xffd6a1,1.05);key.name='Luz clave de sombras';key.position.set(-8,11,7);key.target.position.set(0,0,-4);scene.add(key,key.target);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:.5,far:65});key.shadow.bias=-.00035;key.shadow.normalBias=.04;key.shadow.camera.updateProjectionMatrix();
// Pase de detalle: adiciones compartidas; no mueve ni reemplaza la arquitectura base.
// Pátina y variación determinista en revestimiento metálico y fábrica.
function patina(seed, metal){
 const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');
 const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 g.fillStyle=metal?'#a4a19c':'#b0a9a0';g.fillRect(0,0,1024,1024);
 for(let i=0;i<28000;i++){const v=Math.floor(50+rnd()*160);g.fillStyle=`rgba(${v},${Math.floor(v*.97)},${Math.floor(v*.91)},${.015+rnd()*.12})`;g.fillRect(rnd()*1024,rnd()*1024,metal?1+rnd()*55:1+rnd()*7,metal?.5+rnd()*1.5:1+rnd()*4)}
 for(let i=0;i<180;i++){const x=rnd()*1024,y=rnd()*1024;g.strokeStyle=`rgba(38,34,29,${rnd()*.14})`;g.lineWidth=.3+rnd()*1.4;g.beginPath();g.moveTo(x,y);g.lineTo(x+rnd()*30-15,y+rnd()*110);g.stroke()}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(metal?2:3,metal?3:4);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const stoneDetail=patina(98231,false),metalDetail=patina(77731,true);
mats.concrete.map=stoneDetail;mats.concrete.bumpMap=stoneDetail;mats.concrete.bumpScale=.09;
mats.steel.map=metalDetail;mats.steel.bumpMap=metalDetail;mats.steel.bumpScale=.018;
const agedBrass=new THREE.MeshStandardMaterial({color:0x6c5738,metalness:.72,roughness:.57,map:metalDetail,bumpMap:metalDetail,bumpScale:.014});
const panelMat=new THREE.MeshStandardMaterial({color:0x263039,metalness:.38,roughness:.77,map:stoneDetail,bumpMap:stoneDetail,bumpScale:.05});
const darkMetal=new THREE.MeshStandardMaterial({color:0x151c24,metalness:.62,roughness:.64,map:metalDetail});
// Zócalos, paneles rebajados y molduras de acero envejecido en la pared lateral.
for(const side of [-1,1]){
 box('Zócalo lateral',side*13.73,.5,0,.24,.95,35.5,darkMetal);
 box('Cornisa lateral inferior',side*13.72,3.95,0,.22,.12,35.5,agedBrass);
 box('Cornisa lateral superior',side*13.72,10.65,0,.22,.16,35.5,agedBrass);
 for(const z of [-14,-7,0,7,14]){
  box('Revestimiento pilar',side*9.2,6.7,z,.57,7.1,.62,panelMat);
  for(const dx of [-.21,-.105,0,.105,.21])box('Estría pilar',side*9.2+dx,6.7,z+.32,.026,6.7,.035,agedBrass);
  for(const y of [3.65,4.05,8.8,9.2]) box('Capitel escalonado',side*9.2,y,z,.82,.12,.82,agedBrass);
  for(const dz of [-2.6,2.6])box('Nervio mural',side*13.69,7.3,z+dz,.13,5.9,.12,agedBrass);
  // Motivo escalonado art déco montado en cada panel, compartido por cámaras.
  for(let i=0;i<4;i++){
   const zz=z-1.65+i*.38;
   bar('Abanico déco',[side*13.64,5.1,zz],[side*13.64,8.2-i*.25,z],.055,agedBrass);
   bar('Abanico déco',[side*13.64,5.1,z+1.65-i*.38],[side*13.64,8.2-i*.25,z],.055,agedBrass);
  }
 }
 // Paneles de acceso con marcos, sin texto ni iconografía añadida.
 for(const z of [-10,4,11]){
  box('Puerta técnica',side*13.62,1.65,z,.12,2.9,1.6,darkMetal);
  for(const dz of [-.84,.84])box('Jamba',side*13.5,1.7,z+dz,.16,3.2,.1,agedBrass);
  box('Dintel',side*13.5,3.25,z,.16,.1,1.76,agedBrass);
 }
}
// Frontal y cabina: paneles, pasos y equipamiento real compartidos.
for(let x=-6.5;x<=6.5;x+=1.3){
 box('Marco frontal cabina y tarima',x,.7,-10.91,1.15,.85,.035,panelMat);
 for(const y of [.32,1.08])box('Moldura tarima',x,y,-10.87,1.13,.025,.025,agedBrass);
}
for(let i=0;i<5;i++)box('Nariz escalón',0,(i+1)*.26+.015,-8.6-i*.48,4.5,.025,.055,agedBrass);
box('Frontal estriado cabina',0,2.05,-14.35,3.0,1.22,.09,panelMat);
for(let x=-1.35;x<=1.35;x+=.15)box('Estría cabina',x,2.05,-14.29,.024,1.05,.03,agedBrass);
for(let x of [-1.05,1.05]){
 const platter=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.025,32),darkMetal);platter.position.set(x,3.025,-14.87);platter.name='Plato consola';scene.add(platter);
 const disc=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.027,32),agedBrass);disc.position.set(x,3.04,-14.87);disc.name='Centro plato';scene.add(disc);
}
// Arco escalonado del escenario: perfil frontal, sin reconstruir la sala.
for(let i=0;i<4;i++){
 const x=7.0-i*.27,y=8.6-i*.26;
 for(const side of [-1,1]){
  bar('Arco escalonado escenario',[side*x,2,-17.60],[side*x,y-1.5,-17.60],.09,agedBrass);
  bar('Arco escalonado escenario',[side*x,y-1.5,-17.60],[side*(x-1.3),y,-17.60],.09,agedBrass);
 }
 bar('Dintel escalonado escenario',[-(x-1.3),y,-17.60],[x-1.3,y,-17.60],.09,agedBrass);
}
// Costillas del techo y luminarias indirectas. Objetos fijos, no pintura por plano.
for(const z of [-15,-11,-2,2,9,13,17]){
 bar('Costilla techo',[-13.5,11.25,z],[13.5,11.25,z],.17,darkMetal);
 for(const x of [-11,-7,7,11])box('Luz indirecta techo',x,11.12,z,2.2,.035,.08,mats.warm);
}
// Juntas metálicas de pista: diagonales discretas en los bordes, sin otro aro.
for(let z=-12;z<=12;z+=3)for(const side of [-1,1]){
 bar('Incrustación pista',[side*7.05,.052,z-.55],[side*7.85,.052,z],.035,agedBrass);
 bar('Incrustación pista',[side*7.85,.052,z],[side*7.05,.052,z+.55],.035,agedBrass);
}

scene.traverse(o=>{if(o.isMesh){o.castShadow=!['Junta transversal pavimento','Junta longitudinal pavimento','Único aro decorativo empotrado','Haz estilizado anclado'].includes(o.name);o.receiveShadow=true}});
// Convención: Three.js x transversal, y altura, z negativo hacia escenario; parámetros documentados.
const cameraDefs={BG04:{pos:[-8,3.0,14],target:[0,3,-12],fov:66},BG05:{pos:[0,10.6,17.6],target:[0,2.2,-3.5],fov:73},BG06:{pos:[0,2.7,8],target:[0,3.1,-14],fov:57}};
const cameras={};for(const [name,d] of Object.entries(cameraDefs)){let c=new THREE.PerspectiveCamera(d.fov,16/9,.1,200);c.name=name;c.position.set(...d.pos);c.lookAt(...d.target);c.updateMatrixWorld();cameras[name]=c;scene.add(c)}
const select=document.querySelector('#camera');const query=new URLSearchParams(location.search);if(cameras[query.get('camera')])select.value=query.get('camera');
function render(){renderer.render(scene,cameras[select.value]);document.querySelector('#camera-data').textContent=JSON.stringify(cameraDefs[select.value]);}
select.addEventListener('change',render);document.querySelector('#save').addEventListener('click',()=>{render();const a=document.createElement('a');a.download=select.value.toLowerCase()+'.png';a.href=renderer.domElement.toDataURL('image/png');a.click()});
document.querySelector('#save-glb').addEventListener('click',async()=>{const data=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true});const a=document.createElement('a');a.download='club_detallado.glb';const url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));a.href=url;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);});
render();window.__scene08c6={scene,cameras,cameraDefs,renderer,render,exportGLB:()=>new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true})};document.documentElement.dataset.ready='true';
