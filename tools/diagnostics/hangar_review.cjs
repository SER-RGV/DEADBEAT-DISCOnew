// Offline only. Read three ORIGINAL perf.report() exports and one human checklist.
const fs = require('node:fs');
const path = require('node:path');
const signals = ['sprint', 'carga', 'altavoz', 'elite', 'laser'];
const pending = 'PENDIENTE', pass = 'CUMPLE', fail = 'BLOQUEADO';
const positive = n => Number.isFinite(n) && n > 0;
function analyze(reports, sheet) {
  const rows = [0,1,2].map(i => {
    const r = reports[i], d = r?.raveDenseMoving, m = r?.meta;
    let reason = '';
    if (!r) reason = 'Falta el informe';
    else if (r.running !== false || !['manual','capacity'].includes(r.reason)) reason = `Captura no cerrada normalmente: ${r.reason}`;
    else if (m?.room !== 'r0' || m.seed !== 0 || r.minEnemies !== 12 || r.minProjectiles !== 8) reason = 'Sala, semilla o densidad incorrectas';
    else if (![m.viewport,m.canvas].every(a=>Array.isArray(a)&&a.length===2&&a.every(positive)) || !positive(m.dpr) || !Number.isFinite(m.tier) || !m.browser || typeof m.reducedMotion !== 'boolean') reason = 'Falta la configuración de captura';
    else if (!Number.isSafeInteger(d?.count) || d.count < 300 || !positive(d.seconds) || d.seconds < 10) reason = 'Muestra densa en movimiento insuficiente';
    else if (![d.p95Ms,d.meanMs,d.maxMs].every(positive) || d.maxMs < d.p95Ms) reason = 'Estadísticas incompletas';
    return {pasada:i+1, intervalos:d?.count, segundos:d?.seconds, mediaMs:d?.meanMs, p95Ms:d?.p95Ms, maxMs:d?.maxMs,
      estado:reason ? pending : d.p95Ms > 18.4 ? fail : pass, motivo:reason || (d.p95Ms > 18.4 ? 'P95 > 18,4 ms' : '')};
  });
  const settings = reports.filter(r=>r?.meta).map(({meta:m})=>JSON.stringify([m.viewport,m.canvas,m.dpr,m.tier,m.browser,m.reducedMotion]));
  const comparable = new Set(settings).size === 1 && sheet?.mismoEquipoYPerfil === true && !!sheet?.equipo?.trim();
  const visual = signals.map(aviso=>{
    const v=sheet?.avisos?.[aviso];
    return {aviso, ejemplos:v?.ejemplos, estado:v?.oclusionReproducible === true || v?.senalYTemporizadorLegibles === false ? fail :
      v?.oclusionReproducible === false && v?.senalYTemporizadorLegibles === true && Number.isSafeInteger(v.ejemplos) && v.ejemplos >= 3 ? pass : pending};
  });
  const result=list=>list.some(v=>v.estado===fail)?fail:list.every(v=>v.estado===pass)?pass:pending;
  const rendimiento=result([...rows,{estado:comparable?pass:pending}]);
  const lectura=result([...visual,{estado:sheet?.condicionesVisualesConfirmadas===true?pass:pending}]);
  return {rows, visual, comparable, rendimiento, lectura, decision:result([{estado:rendimiento},{estado:lectura}])};
}
if(require.main===module){try{
  const dir=process.argv[2];if(!dir)throw Error('Uso: node tools/diagnostics/hangar_review.cjs CARPETA_EQUIPO');
  const read=name=>{const f=path.join(dir,name);return fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):null;};
  const {rows,visual,...verdict}=analyze(['01','02','03'].map(n=>read(n+'.json')),read('revision.json'));
  console.table(rows);console.table(visual);console.log(verdict);
}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={analyze};
