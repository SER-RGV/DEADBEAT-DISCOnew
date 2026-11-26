/* ==========================================================================
   Micro-arnés de resultados.

   Tres estados, no dos: PASS, FAIL y SKIP. Un SKIP significa «no se pudo
   ejecutar aquí» y nunca cuenta como aprobado; se informa con su motivo.
   El informe JSON guarda, por prueba, qué se exigía (`expected`), qué se
   observó (`detail`) y cuánto tardó, para que la evidencia se audite sola.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const OUT = process.env.QA_OUT || path.join(process.env.QA_WORK || require('os').homedir() + '/.dd_qa', 'out');

function createSuite(name) {
  const results = [];
  let t0 = Date.now();

  const push = (id, status, detail, expected, extra) => {
    const now = Date.now();
    const item = {
      id,
      status,
      pass: status === 'PASS' ? true : status === 'FAIL' ? false : null,
      detail: detail == null ? '' : String(detail),
      expected: expected == null ? '' : String(expected),
      ms: now - t0,
      ...(extra || {})
    };
    t0 = now;
    results.push(item);
    const tag = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : 'SKIP';
    console.log(tag + ' ' + id + (item.detail ? '  · ' + item.detail : '') + (status === 'SKIP' && item.why ? '  (' + item.why + ')' : ''));
    return item;
  };

  return {
    name,
    results,
    ok: (id, cond, detail, expected) => push(id, cond ? 'PASS' : 'FAIL', detail, expected),
    fail: (id, detail, expected) => push(id, 'FAIL', detail, expected),
    skip: (id, why, detail, expected) => push(id, 'SKIP', detail, expected, { why }),
    /* Captura no fatal: la imagen es evidencia complementaria, nunca la
       condición de una prueba. Con render software puede tardar. */
    shot: async (page, file) => {
      try {
        fs.mkdirSync(OUT, { recursive: true });
        await page.screenshot({ path: path.join(OUT, file), timeout: 60000, animations: 'disabled' });
        return true;
      } catch (e) {
        console.log('  (aviso) captura ' + file + ' no completada: ' + String(e.message).split('\n')[0]);
        return false;
      }
    },
    summary: () => ({
      suite: name,
      total: results.length,
      pass: results.filter((r) => r.status === 'PASS').length,
      fail: results.filter((r) => r.status === 'FAIL').length,
      skip: results.filter((r) => r.status === 'SKIP').length,
      ms: results.reduce((s, r) => s + r.ms, 0)
    })
  };
}

function writeReport(dir, fileName, payload) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, fileName);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return file;
}

/** Comprueba que un registro de errores del navegador solo tenga ruido conocido. */
function assertClean(suite, prefix, errors, allowed) {
  const allow = allowed || [];
  const real = errors.filter((e) => !allow.some((r) => r.test(e.text + ' ' + e.url)));
  suite.ok(
    prefix + ' sin errores de consola ni peticiones fallidas',
    real.length === 0,
    real.length ? JSON.stringify(real.slice(0, 5)) : '0 errores',
    '0 errores'
  );
  return real;
}

module.exports = { createSuite, writeReport, assertClean, OUT };
