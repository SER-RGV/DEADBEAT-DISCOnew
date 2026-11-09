"use strict";
// Pruebas unitarias del controlador; no sustituyen la reproducción visual en GPU.
const assert = require('assert');
const elements = {};
const element = () => ({classList:{add(){},remove(){}},addEventListener(){},textContent:'',style:{}});
global.document = {getElementById(id){return elements[id] ||= element()},createElement:element,body:{appendChild(){}}};
let active = false, entries = 0, completions = 0, reason = null;
const images = {};
global.window = {matchMedia:()=>({matches:false}),addEventListener(){},
  DD_HUB:{isActive:()=>active,enter(){entries++;active=true}},
  DD_ASSETS:{get(id){return images[id] ||= {id,naturalWidth:1376,naturalHeight:768}}}};
require('../../src/dd_cinematic_camera.js');
let drawn = [];
const gradient = {addColorStop(){}};
const ctx = {save(){},restore(){},fillRect(){},drawImage(i){drawn.push(i.id)},createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,beginPath(){},ellipse(){},fill(){},translate(){},rotate(){},scale(){},moveTo(){},lineTo(){},closePath(){}};
const advance = t => {while(window.DD_CINE.getState() && window.DD_CINE.getState().elapsed < t)window.DD_CINE.update(.05)};
for(const t of [1,5,8,11,15,19,23,26,30,33]) {
 active=false;entries=0;completions=0;
 window.DD_CINE.playIntro(r=>{completions++;reason=r});advance(t);
 window.DD_CINE.skip();window.DD_CINE.skip();
 assert.equal(entries,1,`skip at ${t}: hub entries`);assert.equal(completions,1,`skip at ${t}: completion count`);assert.equal(reason,"skip",`skip at ${t}: reason`);
}
active=false;entries=0;completions=0;
window.DD_CINE.playIntro(r=>{completions++;reason=r});advance(34.85);
window.DD_CINE.renderOverlay(ctx,960,540); // entrada anticipada del HUB en plano 10
assert.equal(entries,1);advance(35);
assert.equal(entries,1,'final no debe reentrar en un HUB ya activo');assert.equal(completions,1);assert.equal(reason,'complete');
for(const t of [26,30]) {active=false;window.DD_CINE.playIntro(()=>{});advance(t);drawn=[];window.DD_CINE.renderOverlay(ctx,960,540);assert(!drawn.includes('hero_shoot_00')&&!drawn.includes('player_shoot_00'),'fogonazo en pose de espera');if(t===30)assert(drawn.indexOf('hero_walk_00') > drawn.indexOf('logo_deadbeat_cinematic'), 'el protagonista debe quedar encima del fondo del título');window.DD_CINE.skip()}
console.log('OK: skip idempotente en diez planos, una entrada a HUB y sin fogonazo en planos 8/9');
