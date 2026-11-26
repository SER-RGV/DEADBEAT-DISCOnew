const assert=require('node:assert/strict'),{analyze}=require('../diagnostics/hangar_review.cjs');
const sheet=structuredClone(require('../../docs/SALAS/revision.json'));
const r={running:false,reason:'manual',meta:{room:'r0',seed:0,viewport:[1280,800],canvas:[1280,800],dpr:1,tier:1,browser:'QA',reducedMotion:false},minEnemies:12,minProjectiles:8,raveDenseMoving:{count:300,seconds:10,meanMs:100/3,p95Ms:18.4,maxMs:400}};
const run=(third=r)=>analyze([r,r,third],sheet);assert.equal(run().decision,'PENDIENTE');
Object.assign(sheet,{equipo:'fixture',mismoEquipoYPerfil:true,condicionesVisualesConfirmadas:true});for(const v of Object.values(sheet.avisos))Object.assign(v,{ejemplos:3,senalYTemporizadorLegibles:true,oclusionReproducible:false});
assert.equal(run().decision,'CUMPLE');for(const [k,n,expected] of [['count',299,'PENDIENTE'],['seconds',9.999,'PENDIENTE'],['p95Ms',18.40001,'BLOQUEADO']])assert.equal(run({...r,raveDenseMoving:{...r.raveDenseMoving,[k]:n}}).decision,expected);
assert.equal(run(null).decision,'PENDIENTE');assert.equal(run({...r,reason:'hidden'}).decision,'PENDIENTE');assert.equal(run({...r,meta:{...r.meta,dpr:2}}).decision,'PENDIENTE');sheet.avisos.laser.oclusionReproducible=true;assert.equal(run().decision,'BLOQUEADO');console.log('PASS límites inclusivos, tres pasadas, comparabilidad y veto visual independiente');
