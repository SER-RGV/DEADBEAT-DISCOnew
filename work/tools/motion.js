/* Auditoría de movimiento de la cinemática en el banco de pruebas:
   muestrea cada 0,2 s, mide diferencia entre muestras consecutivas y detecta
   tramos congelados y planos con poco cambio. Uso:
     node work/tools/motion.js [intro|descent] */
const H = require('./harness.js');
const fs = require('fs');

(async () => {
  const kind = process.argv[2] === 'descent' ? 'descent' : 'intro';
  /* con el motor y el registro de recursos: el acto V es el salón del juego,
     y sin ellos la prueba mediría otra película */
  const sb = H.boot({ w: 640, h: 360, withWorld: true });
  sb.op[kind === 'intro' ? 'playIntro' : 'playDescent'](() => {}, {});
  /* esperar de verdad a que estén todos los recursos: con 254 imágenes de por
     medio, 900 ms dan fotogramas a medio pintar y la muestra sale congelada
     sin que la película lo esté. Se mide la película, no la carga. */
  for (let i = 0; i < 80; i++) {
    await H.sleep(100);
    if (!sb.missing.length && sb.loaded.length >= 250) break;
  }
  await H.sleep(400);
  const dur = kind === 'intro' ? sb.op.INTRO_DURATION : sb.op.DESCENT_DURATION;
  const shots = kind === 'intro' ? sb.op.SHOTS : sb.op.DESCENT_PHASES;
  const cv = sb.main(), ctx = cv.getContext('2d');
  let prev = null;
  const rows = [];
  for (let t = 0; t < dur - 0.01; t += 0.2) {
    sb.op.debugSeek(t, true);
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let sig = 0, lum = 0, n = 0;
    for (let i = 0; i < d.length; i += 4 * 211) { sig += (d[i] * 7 + d[i + 1] * 11 + d[i + 2] * 13); lum += d[i] + d[i + 1] + d[i + 2]; n++; }
    /* la firma se guarda con decimales y se compara contra la anterior SIN
       redondear: redondear a entero hacía pasar por congelado un fotograma en
       el que cambia el 95 % de los píxeles (0,74 de diferencia media) */
    const row = { t: +t.toFixed(2), sig: +(sig / n).toFixed(3), lum: +(lum / n / 3).toFixed(2) };
    row.diff = prev == null ? null : Math.abs(row.sig - prev);
    prev = row.sig;
    const s = shots.filter((x) => t >= x.from && t < x.to)[0];
    row.shot = s ? s.id : shots.length;
    rows.push(row);
  }
  const out = {};
  rows.forEach((r) => {
    out[r.shot] = out[r.shot] || { n: 0, zero: 0, max: 0, sum: 0, min: 1e9 };
    if (r.diff == null) return;
    out[r.shot].n++;
    out[r.shot].sum += r.diff;
    out[r.shot].max = Math.max(out[r.shot].max, r.diff);
    out[r.shot].min = Math.min(out[r.shot].min, r.diff);
    if (r.diff < 0.02) out[r.shot].zero++;      /* congelado de verdad */
  });
  Object.keys(out).forEach((k) => { const o = out[k]; o.avg = +(o.sum / o.n).toFixed(1); });
  fs.writeFileSync('/home/user/DEADBEAT-DISCOnew/work/' + kind + '_motion.json', JSON.stringify({ dur, shots: out, rows }, null, 1));
  console.log(kind, 'duración', dur, 'muestras', rows.length);
  console.log('plano | muestras | congeladas | dif media | dif máx | dif mín');
  Object.keys(out).forEach((k) => {
    const o = out[k];
    console.log('  ' + k + '   |   ' + o.n + '   |   ' + o.zero + '   |   ' + o.avg + '   |   ' + (+o.max).toFixed(1) + '   |   ' + (+o.min).toFixed(2));
  });
  const frozen = rows.filter((r) => r.diff != null && r.diff < 0.02).map((r) => r.t);
  console.log('muestras congeladas:', frozen.length, frozen.slice(0, 20).join(' '));
})();
