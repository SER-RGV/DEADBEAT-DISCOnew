#!/usr/bin/env node
/* FASE 2 · Sondas estáticas y lógicas de los cuatro hallazgos
   (ACC-2, ACC-3, TXT-4, TXT-8). Sin navegador: ejercita el código real
   extraído de src/dd_ui_system.js y verifica el build generado.
   Uso: node tools/qa/probe_fase2.js
   Salida: una línea PASS/FAIL por comprobación; exit 1 si falla alguna. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');

let failures = 0;
function check(name, cond) {
  const ok = !!cond;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name);
  if (!ok) failures += 1;
}

/* ---------- 1) Extraer el bloque FASE 2 de src y evaluarlo ---------- */
const srcPath = path.join(ROOT, 'src/dd_ui_system.js');
const src = fs.readFileSync(srcPath, 'utf8');
const startMark = '/* ============ FASE 2';
const endMark = '/* ================================ F. TICK';
const start = src.indexOf(startMark);
const end = src.indexOf(endMark);
check('bloque FASE 2 localizado en src/dd_ui_system.js', start > 0 && end > start);
const block = src.slice(start, end);
const sandbox = { window: {} };
vm.runInNewContext(block + '\n;window.__DD_FASE2__ = window.DD_FASE2;', sandbox);
const DD = sandbox.window.__DD_FASE2__;
check('window.DD_FASE2 expuesto con las utilidades', !!DD && typeof DD.bossChamberBanner === 'function' && typeof DD.drawMinimapEmptyState === 'function');

/* ---------- 2) TXT-8 · bossChamberBanner ---------- */
const bc = DD.bossChamberBanner;
check('jefe I LIMBO → CÁMARA DEL PORTERO', bc('CÁMARA DEL RESIDENTE · CÍRCULO I · LIMBO', 0, true) === 'CÁMARA DEL PORTERO · CÍRCULO I · LIMBO');
check('jefe II (residente gemelo) → CAMARA DE MAGNETA', bc('CÁMARA DEL RESIDENTE II · CÍRCULO II · LUJURIA', 1, true) === 'CÁMARA DE MAGNETA · CÍRCULO II · LUJURIA');
check('jefe III GULA → CÁMARA DEL BUFÉ', bc('CÁMARA DEL RESIDENTE · CÍRCULO III · GULA', 2, true) === 'CÁMARA DEL BUFÉ · CÍRCULO III · GULA');
check('jefe VIII FRAUDE → CÁMARA DEL IMITADOR', bc('CÁMARA DEL RESIDENTE · CÍRCULO VIII · FRAUDE', 7, true) === 'CÁMARA DEL IMITADOR · CÍRCULO VIII · FRAUDE');
check('jefe IX TRAICIÓN → CÁMARA DEL TRAIDOR', bc('CÁMARA DEL RESIDENTE · CÍRCULO IX · TRAICIÓN', 8, true) === 'CÁMARA DEL TRAIDOR · CÍRCULO IX · TRAICIÓN');
check('núcleo → NÚCLEO FINAL · LA ÚLTIMA CANCIÓN', bc('CÁMARA DEL RESIDENTE · NÚCLEO FINAL', 9, true) === 'NÚCLEO FINAL · LA ÚLTIMA CANCIÓN');
check('fuera de rango (99) se clampa al núcleo', bc('CÁMARA DEL RESIDENTE · NÚCLEO FINAL', 99, true) === 'NÚCLEO FINAL · LA ÚLTIMA CANCIÓN');
check('no-jefe: banner intacto', bc('SALA DEL TORNO · CÍRCULO I · LIMBO', 0, false) === 'SALA DEL TORNO · CÍRCULO I · LIMBO');
check('bossActive sin banner (null) no inventa', bc(null, 0, true) === null);
check('círculo no numérico no inventa', bc('CÁMARA DEL RESIDENTE · X', NaN, true) === 'CÁMARA DEL RESIDENTE · X');
check('banner ya correcto no se degrada', bc('CÁMARA DEL PORTERO · CÍRCULO I · LIMBO', 0, true) === 'CÁMARA DEL PORTERO · CÍRCULO I · LIMBO');

/* ---------- 3) TXT-4 · drawMinimapEmptyState (contexto grabador) ---------- */
const calls = [];
function rec(name) {
  return function () {
    calls.push([name].concat(Array.prototype.slice.call(arguments)));
    if (name === 'createRadialGradient') return gradient;
  };
}
const gradient = { addColorStop(offset, color) { calls.push(['addColorStop', offset, color]); } };
const ctx = {
  createRadialGradient: rec('createRadialGradient'),
  fillRect: rec('fillRect'),
  clearRect: rec('clearRect'),
  beginPath: rec('beginPath'),
  arc: rec('arc'),
  stroke: rec('stroke'),
  strokeRect: rec('strokeRect'),
  moveTo: rec('moveTo'),
  lineTo: rec('lineTo'),
  closePath: rec('closePath'),
  fillText: rec('fillText'),
  fillStyle: '', strokeStyle: '', lineWidth: 0, textAlign: '', lineJoin: ''
};
let fontLog = [];
Object.defineProperty(ctx, 'font', {
  get: () => fontLog._current || '',
  set: v => { fontLog._current = v; fontLog.push(v); }
});
DD.drawMinimapEmptyState(ctx, 196, 132);
const texts = calls.filter(c => c[0] === 'fillText').map(c => c[1]);
check('estado vacío rotula SIN INCURSIÓN', texts.indexOf('SIN INCURSIÓN') !== -1);
check('estado vacío rotula el motivo (EL DESCENSO REVELA EL MAPA)', texts.indexOf('EL DESCENSO REVELA EL MAPA') !== -1);
check('estado vacío dibuja glifo de torre (1 moveTo + 11 lineTo)', calls.filter(c => c[0] === 'moveTo').length === 1 && calls.filter(c => c[0] === 'lineTo').length === 11);
check('estado vacío dibuja anillos de radar (arc = 2)', calls.filter(c => c[0] === 'arc').length === 2);
const fontSizes = fontLog.map(f => parseFloat((String(f).match(/(\d+(?:\.\d+)?)px/) || [])[1])).filter(n => !isNaN(n));
check('piso TXT-1 respetado en canvas (todas las fuentes ≥ 12 px)', fontSizes.length > 0 && fontSizes.every(n => n >= 12));
check('texto centrado', ctx.textAlign === 'center');

/* ---------- 4) ACC-2 · CSS de la portada + aplicación sobre <body> ---------- */
const css = fs.readFileSync(path.join(ROOT, 'src/dd_rebuild_ui.css'), 'utf8');
check('kill-switch body.dd-no-flash .dd-menu-vig::after', /body\.dd-no-flash\s+#dd-main-menu\.dd-rs\s+\.dd-menu-vig::after\s*\{[^}]*animation:\s*none\s*!important/.test(css));
check('kill-switch body.dd-no-flash .dd-menu-beat-light', /body\.dd-no-flash\s+#dd-main-menu\.dd-rs\s+\.dd-menu-beat-light\s*\{[^}]*animation:\s*none\s*!important/.test(css));

/* ---------- 5) Build generado ---------- */
const htmlPath = path.join(ROOT, 'index.html');
const twinPath = path.join(ROOT, 'DEADBEAT_DISCO.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const twin = fs.readFileSync(twinPath, 'utf8');
check('index.html ≡ DEADBEAT_DISCO.html (byte a byte)', html === twin);
check('build lleva la regla ACC-2 (vig::after)', html.indexOf('body.dd-no-flash #dd-main-menu.dd-rs .dd-menu-vig::after') !== -1);
check('build lleva la regla ACC-2 (beat-light)', html.indexOf('body.dd-no-flash #dd-main-menu.dd-rs .dd-menu-beat-light') !== -1);
check('build lleva .dd-minimap-box.is-empty (TXT-4)', html.indexOf('.dd-minimap-box.is-empty') !== -1);
check('build lleva el estado vacío de canvas (TXT-4)', html.indexOf('EL DESCENSO REVELA EL MAPA') !== -1);
check('build lleva BOSS_CHAMBERS / bossChamberBanner (TXT-8)', html.indexOf('BOSS_CHAMBERS') !== -1 && html.indexOf('bossChamberBanner') !== -1);
check('build lleva la regla ACC-3 (text-fill-color: currentColor)', html.indexOf('-webkit-text-fill-color: currentColor') !== -1);
check('build lleva la sección ACCESIBILIDAD con DESTELLOS DE PANTALLA', html.indexOf('DESTELLOS DE PANTALLA') !== -1 && html.indexOf('id="dd-opt-flash"') !== -1);
check('build lleva SACUDIDA DE CÁMARA', html.indexOf('SACUDIDA DE CÁMARA') !== -1 && html.indexOf('id="dd-opt-shake"') !== -1);
check('build lleva applyA11yFlashClass (definición + usos)', (html.match(/applyA11yFlashClass/g) || []).length >= 4);
check('build lleva is-empty aplicado por JS', html.indexOf('classList.add("is-empty")') !== -1);

/* ---------- 6) Scripts inline del build: parseo ---------- */
const scriptRe = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
let m, inlineIndex = 0, parseFailures = [];
while ((m = scriptRe.exec(html)) !== null) {
  inlineIndex += 1;
  const attrs = m[1] || '';
  if (/type\s*=\s*("|')text\/plain/i.test(attrs)) continue; // licencia de fuente, no JS
  const code = m[2];
  if (!code.trim()) continue;
  try {
    new vm.Script(code, { filename: 'inline-' + inlineIndex + '.js' });
  } catch (e) {
    parseFailures.push('script inline #' + inlineIndex + ': ' + e.message);
  }
}
check('los scripts inline del build parsean (' + inlineIndex + ' revisados)', parseFailures.length === 0);
parseFailures.forEach(f => console.log('      ' + f));

/* ---------- 7) CSS: llaves balanceadas ---------- */
const open = (css.match(/\{/g) || []).length;
const close = (css.match(/\}/g) || []).length;
check('CSS con llaves balanceadas (' + open + '/' + close + ')', open === close);

/* ---------- Resumen ---------- */
console.log('');
if (failures) {
  console.log('FASE 2 · ' + failures + ' comprobación(es) FALLIDA(S)');
  process.exit(1);
}
console.log('FASE 2 · todas las comprobaciones en verde');
