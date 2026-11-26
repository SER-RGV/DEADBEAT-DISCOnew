#!/usr/bin/env node
/* ==========================================================================
   Arnés único de QA · DEADBEAT DISCO

   Uso
     node tools/qa/run.js                 # suites rápidas (las de cada fase/PR)
     node tools/qa/run.js --all           # + visual, presupuestos y rendimiento
     node tools/qa/run.js --only=arranque,menu
     node tools/qa/run.js --list

   Se sirve el repositorio por HTTP una sola vez y cada suite abre su propio
   navegador: así una prueba no puede contaminar a la siguiente.

   Código de salida: 0 si no hay ningún FAIL (los SKIP se informan aparte),
   1 si alguna prueba falla, 2 si el entorno no está preparado.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const E2E = path.join(__dirname, 'e2e');
const OUT = process.env.QA_OUT || path.join(process.env.QA_WORK || require('os').homedir() + '/.dd_qa', 'out');

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const value = (f, d) => {
  const hit = args.find((a) => a.startsWith(f + '='));
  return hit ? hit.slice(f.length + 1) : d;
};

function loadSpecs() {
  if (!fs.existsSync(E2E)) return [];
  return fs.readdirSync(E2E)
    .filter((f) => f.endsWith('.spec.js'))
    .sort()
    .map((f) => {
      const spec = require(path.join(E2E, f));
      spec.file = f;
      return spec;
    });
}

function selectSpecs(specs) {
  const only = value('--only', '');
  if (only) {
    const want = only.split(',').map((s) => s.trim()).filter(Boolean);
    return specs.filter((s) => want.includes(s.id));
  }
  if (has('--all') || has('--ci')) return specs;
  return specs.filter((s) => !s.heavy);
}

(async () => {
  const specs = loadSpecs();
  if (has('--list')) {
    for (const s of specs) console.log((s.heavy ? '[pesada] ' : '[rápida] ') + s.id.padEnd(14) + ' ' + s.title);
    return;
  }

  const selected = selectSpecs(specs);
  if (!selected.length) {
    console.error('[qa] No hay suites que ejecutar. Revisa --only.');
    process.exit(2);
  }

  let server;
  try {
    server = await require('./lib/server.js').start(ROOT);
  } catch (e) {
    console.error('[qa] No se pudo servir el repositorio: ' + e.message);
    process.exit(2);
  }

  const started = Date.now();
  const report = { startedAt: new Date().toISOString(), node: process.version, url: server.url, suites: [] };
  console.log('\n=== QA DEADBEAT DISCO · ' + selected.length + ' suites · ' + server.url + ' ===\n');

  for (const spec of selected) {
    console.log('\n--- ' + spec.id + ' · ' + spec.title + ' ---');
    const suiteFactory = (name) => require('./lib/harness.js').createSuite(name || spec.id);
    const t0 = Date.now();
    const ctx = { baseUrl: server.url, suite: suiteFactory, repoRoot: ROOT, metrics: {} };
    let suite;
    try {
      suite = await spec.run(ctx);
    } catch (e) {
      suite = suiteFactory(spec.id);
      suite.fail(spec.id + ' ejecutada', 'excepción: ' + String(e && e.message || e).split('\n')[0], 'sin excepciones');
      suite.error = String(e && e.stack || e);
    }
    const summary = suite.summary();
    summary.wallMs = Date.now() - t0;
    summary.file = spec.file;
    report.suites.push({ ...summary, checks: suite.results, metrics: ctx.metrics, error: suite.error || null });
    console.log('→ ' + summary.pass + ' PASS · ' + summary.fail + ' FAIL · ' + summary.skip + ' SKIP · ' + Math.round(summary.wallMs / 1000) + ' s');
  }

  await server.close();

  const totals = report.suites.reduce((acc, s) => ({
    pass: acc.pass + s.pass, fail: acc.fail + s.fail, skip: acc.skip + s.skip, total: acc.total + s.total
  }), { pass: 0, fail: 0, skip: 0, total: 0 });
  report.totals = totals;
  report.wallMs = Date.now() - started;

  fs.mkdirSync(OUT, { recursive: true });
  const reportFile = path.join(OUT, 'report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  console.log('\n=== TOTAL · ' + totals.pass + ' PASS · ' + totals.fail + ' FAIL · ' + totals.skip + ' SKIP · ' +
    Math.round(report.wallMs / 1000) + ' s ===');
  console.log('Informe: ' + reportFile);
  if (totals.fail > 0) {
    console.log('\nFallos:');
    for (const s of report.suites) {
      for (const c of s.checks.filter((x) => x.status === 'FAIL')) {
        console.log('  · [' + s.suite + '] ' + c.id + ' — esperado: ' + c.expected + ' · observado: ' + c.detail);
      }
    }
  }
  process.exit(totals.fail > 0 ? 1 : 0);
})().catch((e) => {
  console.error('[qa] Error no controlado: ' + (e && e.stack || e));
  process.exit(2);
});
