"use strict";
// Solo unidades: no medir rendimiento con este test.
const assert = require('assert');
const el={classList:{add(){},remove(){}},addEventListener(){},textContent:''};
global.document={getElementById:()=>el,createElement:()=>el,body:{appendChild(){}}};
global.window={matchMedia:()=>({matches:false}),addEventListener(){},DD_HUB:{isActive:()=>false,enter(){}}};
require('../../src/dd_cinematic_camera.js');
const cine=window.DD_CINE;
cine.playIntro(()=>{});
cine.update(.05,null,.3);assert.equal(cine.getState().elapsed,.3,'intro uses uncapped render delta');
cine.update(.05,null,10);assert.equal(cine.getState().elapsed,10.3,'visible gaps use wall delta without audio');
cine.update(.05,null,NaN);assert.equal(cine.getState().elapsed,10.35,'invalid raw delta falls back to simulation');
cine.skip();
cine.playRoomTransition(1,'');cine.update(.05,null,.3);assert.equal(cine.getState().elapsed,.05,'non-intro sequences remain on simulation dt');
cine.skip();
console.log('OK: reloj propio de intro y otras cinemáticas sin cambios');
// Simular cambios de visibilidad sin adelantar el reloj del navegador.
let visibilityHandler;
global.document.addEventListener=(type,fn)=>{if(type==='visibilitychange') visibilityHandler=fn};
// Registrar listener con una instancia nueva.
delete require.cache[require.resolve('../../src/dd_cinematic_camera.js')];
require('../../src/dd_cinematic_camera.js');
const paused=window.DD_CINE;
paused.playIntro(()=>{});paused.update(.05,null,.2);
document.hidden=true;visibilityHandler();paused.update(.05,null,.5);
assert.equal(paused.getState().elapsed,.2,'hidden intro is paused');
document.hidden=false;visibilityHandler();paused.update(.05,null,.5);
assert.equal(paused.getState().elapsed,.2,'first resumed delta is discarded');
paused.update(.05,null,.1);assert.equal(paused.getState().elapsed,.3);paused.skip();
console.log('OK: pausa al ocultar y reanudación sin consumir tiempo oculto');
// Reloj de audio autoritativo mientras está disponible; cambio de fuente sin salto.
let audioTime=10; window.DDC_COVER={music:{duck(){},cinematicClock:()=>audioTime}};
paused.playIntro(()=>{});paused.update(.05,null,.1);audioTime=12;paused.update(.05,null,.1);
assert.equal(paused.getState().elapsed,2.1,'frame perdido sigue audio');
audioTime=null;paused.update(.05,null,.2);assert.equal(paused.getState().elapsed,2.3,'fallback sin audio');
audioTime=100;paused.update(.05,null,.1);assert.equal(paused.getState().elapsed,2.4,'activar audio no salta');
audioTime=100.4;paused.update(.05,null,.01);assert.equal(paused.getState().elapsed,2.8,'reloj de audio reanclado');
paused.skip();console.log('OK: audio maestro, frames perdidos y reanclaje al cambiar de fuente');
