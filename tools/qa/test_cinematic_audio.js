"use strict";
// Test de secuencia de llamadas, no comprueba reproducción audible.
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('src/dd_cinematic_camera.js','utf8');
function make(music){const el={classList:{add(){},remove(){}},addEventListener(){},textContent:''};const window={matchMedia:()=>({matches:false}),addEventListener(){},DDC_COVER:music?{music}:null,DD_HUB:{isActive:()=>true,enter(){}}};vm.runInNewContext(src,{window,document:{getElementById:()=>el,createElement:()=>el,body:{appendChild(){}}},Math});return window.DD_CINE}
let calls=[];const cine=make({duck(v){calls.push(v)}});let done=0;
cine.playIntro(()=>done++);assert.deepEqual(calls,[true]);
function until(t){while(cine.getState()&&cine.getState().elapsed<t)cine.update(.05)}
until(7.1);assert.deepEqual(calls,[true,false]);until(24.6);assert.deepEqual(calls,[true,false,true]);until(28.6);assert.deepEqual(calls,[true,false,true,false]);until(32.1);assert.deepEqual(calls,[true,false,true,false,true]);until(35);assert.deepEqual(calls,[true,false,true,false,true,false]);assert.equal(done,1);
calls=[];cine.playIntro(()=>{});cine.skip();cine.skip();assert.deepEqual(calls,[true,false]);
calls=[];cine.playIntro(()=>{});cine.playIntro(()=>{});assert.deepEqual(calls,[true,false,true]);cine.skip();assert.deepEqual(calls,[true,false,true,false]);
const absent=make(null);absent.playIntro(()=>{});absent.update(.05);absent.skip();
const broken=make({duck(){throw Error('audio blocked')}});let completed=false;broken.playIntro(()=>{completed=true});broken.skip();assert(completed);
console.log('OK: atenuación por fases, restauración, skip y fallo opcional de audio');
