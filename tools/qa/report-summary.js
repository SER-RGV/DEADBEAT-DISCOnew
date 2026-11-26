#!/usr/bin/env node
/* ==========================================================================
   Resumen legible de un informe de QA.

   Pensado para la CI: escribe en la suma del paso (GITHUB_STEP_SUMMARY) o en un
   comentario del PR lo que ha fallado, sin obligar a abrir los artefactos.

     node tools/qa/report-summary.js <report.json> [--markdown]
     node tools/qa/report-summary.js <report.json> --annotations

   `--annotations` imprime una anotación de GitHub (`::error::`) por cada fallo.
   Existe porque en algunos entornos los logs y los artefactos de Actions no se
   pueden descargar (EOF) y las anotaciones sí se leen por la API: sin esto, un
   rojo en CI es un rojo mudo.

   Sin `--markdown` imprime texto plano. No falla nunca por un informe ausente:
   informa de que no lo hay y sale con 0, para no tapar el error real del paso.
   ========================================================================== */
'use strict';

const fs = require('fs');

const file = process.argv[2];
const markdown = process.argv.includes('--markdown');
const annotations = process.argv.includes('--annotations');

function plain(d) {
  const lines = [];
  lines.push('QA · ' + d.totals.pass + ' PASS · ' + d.totals.fail + ' FAIL · ' + d.totals.skip + ' SKIP · ' +
    Math.round((d.wallMs || 0) / 1000) + ' s · node ' + d.node);
  for (const s of d.suites) {
    lines.push('  ' + s.suite + ': ' + s.pass + '/' + s.fail + '/' + s.skip +
      ' (' + Math.round(s.wallMs / 1000) + ' s)');
    for (const c of s.checks) {
      if (c.status === 'FAIL') lines.push('    FAIL ' + c.id + ' — esperado: ' + c.expected + ' · observado: ' + c.detail);
      if (c.status === 'SKIP') lines.push('    SKIP ' + c.id + ' — ' + (c.why || '') + ' · ' + c.detail);
    }
  }
  return lines.join('\n');
}

function announce(d) {
  const lines = [];
  for (const s of d.suites) {
    for (const c of s.checks) {
      if (c.status === 'FAIL') {
        lines.push('::error title=QA ' + s.suite + '::' + c.id + ' · esperado: ' + c.expected + ' · observado: ' + c.detail);
      } else if (c.status === 'SKIP') {
        lines.push('::warning title=QA ' + s.suite + '::SKIP ' + c.id + ' · ' + (c.why || '') + ' · ' + c.detail);
      }
    }
  }
  if (!lines.length) lines.push('::notice::QA sin fallos');
  return lines.join('\n');
}

function md(d) {
  const lines = [];
  lines.push('### QA · ' + (d.totals.fail === 0 ? 'sin fallos' : d.totals.fail + ' fallos') +
    ' · ' + d.totals.pass + ' PASS · ' + d.totals.skip + ' SKIP · ' + Math.round((d.wallMs || 0) / 1000) + ' s');
  lines.push('');
  lines.push('| Suite | PASS | FAIL | SKIP | Tiempo |');
  lines.push('|---|---|---|---|---|');
  for (const s of d.suites) {
    lines.push('| `' + s.suite + '` | ' + s.pass + ' | ' + s.fail + ' | ' + s.skip + ' | ' + Math.round(s.wallMs / 1000) + ' s |');
  }
  const fails = d.suites.flatMap((s) => s.checks.filter((c) => c.status === 'FAIL').map((c) => ({ s: s.suite, c })));
  const skips = d.suites.flatMap((s) => s.checks.filter((c) => c.status === 'SKIP').map((c) => ({ s: s.suite, c })));
  if (fails.length) {
    lines.push('');
    lines.push('**Fallos**');
    for (const { s, c } of fails) {
      lines.push('- `' + s + '` · ' + c.id);
      lines.push('  - esperado: ' + (c.expected || '—'));
      lines.push('  - observado: ' + (c.detail || '—'));
    }
  }
  if (skips.length) {
    lines.push('');
    lines.push('**No verificable en este entorno**');
    for (const { s, c } of skips) lines.push('- `' + s + '` · ' + c.id + ' — ' + (c.why || '') + ' · ' + (c.detail || ''));
  }
  return lines.join('\n');
}

if (!file || !fs.existsSync(file)) {
  console.log('No hay informe de QA en esta ejecución (' + (file || 'sin ruta') + ').');
  process.exit(0);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.log('El informe de QA no se pudo leer: ' + e.message);
  process.exit(0);
}

console.log(annotations ? announce(data) : markdown ? md(data) : plain(data));
