#!/usr/bin/env node
"use strict";

/*
 * Smoke test estático de las reglas responsive del HUD.
 * No sustituye una prueba visual en Chromium.
 *
 * Uso:
 *   node tools/qa/test_hud_responsive_css.js
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const cssPath = path.resolve(__dirname, "../../src/dd_rebuild_ui.css");
const css = fs.readFileSync(cssPath, "utf8");
const required = [
  ["breakpoint tablet", /@media\s*\(max-width:\s*900px\)/],
  ["breakpoint móvil", /@media\s*\(max-width:\s*600px\)/],
  ["breakpoint móvil estrecho", /@media\s*\(max-width:\s*420px\)/],
  ["landscape bajo", /@media\s*\(max-height:\s*560px\)\s*and\s*\(max-width:\s*760px\)/],
  ["reducir retrato", /\.dd-hud-portrait-frame\s*\{[^}]*width:\s*40px/s],
  ["reducir minimapa", /\.dd-minimap-box\s*\{[^}]*width:\s*116px/s],
  ["acciones rápidas flexibles", /\.dd-quick-actions\s*\{[^}]*flex-wrap:\s*wrap/s],
  ["habilidades adaptadas", /\.dd-skill-card\s*\{[^}]*width:\s*44px/s],
  ["HUD superior con ancho seguro", /\.dd-hud-top-left\s*\{[^}]*width:\s*calc\(100vw\s*-\s*16px\)/s]
];

let passed = 0;
for (const [name, pattern] of required) {
  assert.match(css, pattern, "Falta regla responsive: " + name);
  passed++;
  process.stdout.write("PASS " + name + "\n");
}

// Recuento de llaves ignorando comentarios y cadenas CSS sencillas.
const source = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, "");
let depth = 0;
for (const char of source) {
  if (char === "{") depth++;
  if (char === "}") depth--;
  assert.ok(depth >= 0, "Hay una llave de cierre sin apertura");
}
assert.equal(depth, 0, "Las llaves CSS no están equilibradas");
passed++;
process.stdout.write("PASS llaves CSS equilibradas\n");
process.stdout.write(JSON.stringify({ ok: true, passed, file: path.relative(process.cwd(), cssPath) }, null, 2) + "\n");
