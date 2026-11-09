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
cine.update(.05,null,10);assert.equal(cine.getState().elapsed,.8,'long gaps capped');
cine.update(.05,null,NaN);assert.equal(cine.getState().elapsed,.85,'invalid raw delta falls back to simulation');
cine.skip();
cine.playRoomTransition(1,'');cine.update(.05,null,.3);assert.equal(cine.getState().elapsed,.05,'non-intro sequences remain on simulation dt');
cine.skip();
console.log('OK: reloj propio de intro, pausa limitada y otras cinemáticas sin cambios');
