"use strict";
// Pulso visual desde el mezclador; no acredita audibilidad ni latencia física.
const assert=require('assert'),fs=require('fs'),vm=require('vm');
function zoom(phase){
 const el={classList:{add(){},remove(){}},addEventListener(){},textContent:''};
 const music={duck(){},cinematicBeatPhase(){return phase}};
 const window={matchMedia:()=>({matches:false}),addEventListener(){},DDC_COVER:{music}};
 const document={getElementById:()=>el,createElement:()=>el,body:{appendChild(){}},addEventListener(){}};
 vm.runInNewContext(fs.readFileSync('src/dd_cinematic_camera.js','utf8'),{window,document,Math});
 window.DD_CINE.playIntro(()=>{});for(let i=0;i<220;i++)window.DD_CINE.update(.05,null,.05);
 return window.DD_CINE.getCamera().targetZoomMul;
}
assert(zoom(0)>zoom(.5),'el pulso de cámara sigue la fase de audio');
assert(Number.isFinite(zoom(null)),'fallback sin audio');
console.log('OK: pulso visual usa fase del mezclador y tiene fallback silencioso');
