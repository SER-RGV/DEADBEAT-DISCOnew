"use strict";
// Test determinista de composición, no es una medición de fluidez.
const assert=require('assert');const fs=require('fs');const vm=require('vm');
const el={classList:{add(){},remove(){}},addEventListener(){},textContent:''};
const images={};const window={matchMedia:()=>({matches:false}),addEventListener(){},DD_ASSETS:{get(id){return images[id] ||= {id,naturalWidth:id.startsWith('hero_')?224:1376,naturalHeight:id.startsWith('hero_')?320:768}}},DD_HUB:{isActive:()=>true,enter(){}}};
vm.runInNewContext(fs.readFileSync('src/dd_cinematic_camera.js','utf8'),{window,document:{getElementById:()=>el,createElement:()=>el,body:{appendChild(){}}},Math});
let drawn=[];const stack=[];const gradient={addColorStop(){}};
const ctx={globalAlpha:1,save(){stack.push(this.globalAlpha)},restore(){this.globalAlpha=stack.pop()},fillRect(){},drawImage(img,...args){drawn.push({id:img.id,alpha:this.globalAlpha,args})},createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,beginPath(){},ellipse(){},fill(){},translate(){},rotate(){},scale(){},moveTo(){},lineTo(){},closePath(){}};
function frame(t){window.DD_CINE.playIntro(()=>{});while(window.DD_CINE.getState().elapsed<t)window.DD_CINE.update(.01);drawn=[];window.DD_CINE.renderOverlay(ctx,1280,720);return drawn.slice()}
const at30=frame(30),before=frame(31.95),after=frame(32.01);
const find=(items,id)=>items.find(i=>i.id===id);
assert(find(at30,'logo_deadbeat_cinematic').alpha>.99);
assert(find(before,'logo_deadbeat_cinematic').alpha<.03,'el logo se retira antes del corte');
assert(find(before,'overlay_vignette_gothic').alpha<.03,'la viñeta no desaparece de golpe');
assert(!find(after,'logo_deadbeat_cinematic'),'el logo no debe reaparecer');
const h0=find(before,'hero_walk_00').args[3],h1=find(after,'hero_walk_00').args[3];
assert(Math.abs(h0-h1)<1,`salto de escala: ${h0} vs ${h1}`);
console.log('OK: título y viñeta se desvanecen y la escala del héroe enlaza los planos 09 y 10');
