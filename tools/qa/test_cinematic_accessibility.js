"use strict";
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync('src/dd_cinematic_camera.js', 'utf8');
function setup(reduced, missing) {
 const el={classList:{add(){},remove(){}},addEventListener(){},textContent:''};
 const images={};let drawn=[];
 const window={matchMedia:()=>({matches:reduced}),addEventListener(){},DD_HUB:{enter(){},isActive:()=>true},DD_ASSETS:{get(id){return missing.has(id)?null:(images[id] ||= {id,naturalWidth:1376,naturalHeight:768})}}};
 const document={getElementById:()=>el,createElement:()=>el,body:{appendChild(){}}};
 vm.runInNewContext(source,{window,document,Math});
 const grad={addColorStop(){}};
 const ctx={save(){},restore(){},fillRect(){},drawImage(img){drawn.push(img.id)},createLinearGradient:()=>grad,createRadialGradient:()=>grad,beginPath(){},ellipse(){},fill(){},translate(){},rotate(){},scale(){},moveTo(){},lineTo(){},closePath(){}};
 return {cine:window.DD_CINE,ctx,drawn:()=>drawn,clear:()=>{drawn=[]}};
}
const test=setup(true,new Set());let completed=0;
test.cine.playIntro(()=>completed++);
assert.equal(test.cine.getState().duration,35,'reduced motion must preserve full intro');
for(const target of [1,5,8,11,15,19,23,26,30,33]) {
 while(test.cine.getState().elapsed<target)test.cine.update(.05);
 test.clear();test.cine.renderOverlay(test.ctx,960,540);
 assert(test.drawn().some(id=>id.startsWith('cine_bg')),'shot missing at '+target);
}
while(test.cine.getState())test.cine.update(.05);
assert.equal(completed,1);
const broken=setup(false,new Set(['hero_walk_00','player_walk_00']));
broken.cine.playIntro(()=>{});while(broken.cine.getState().elapsed<26)broken.cine.update(.05);
broken.cine.renderOverlay(broken.ctx,960,540);
assert(broken.drawn().includes('hero_walk_01'),'use intact alternate frame');
assert(!broken.drawn().includes('hero_idle_00')&&!broken.drawn().includes('player_idle_00'),'do not fall back to damaged idle');
const noFrames=setup(false,new Set(['hero_walk_00','player_walk_00','hero_walk_01','player_walk_01','hero_walk_02','player_walk_02']));
noFrames.cine.playIntro(()=>{});while(noFrames.cine.getState().elapsed<26)noFrames.cine.update(.05);
noFrames.cine.renderOverlay(noFrames.ctx,960,540);
assert(!noFrames.drawn().some(id=>/^(hero|player)_/.test(id)),'omit sprite instead of drawing damaged asset');
console.log('OK: intro completa con movimiento reducido y fallbacks de sprite sin idle dañado');
