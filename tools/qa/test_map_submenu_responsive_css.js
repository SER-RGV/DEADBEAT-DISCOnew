#!/usr/bin/env node
"use strict";

/* Smoke test estático del mapa y submenús responsive. No sustituye Chromium. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const cssPath = path.resolve(__dirname, "../../src/dd_rebuild_ui.css");
const css = fs.readFileSync(cssPath, "utf8");
const checks = [
  ["breakpoint tablet", /@media\s*\(max-width:\s*760px\)/],
  ["breakpoint móvil estrecho", /@media\s*\(max-width:\s*420px\)/],
  ["breakpoint landscape bajo", /@media\s*\(max-height:\s*560px\)\s*and\s*\(max-width:\s*760px\)/],
  ["mapa en una columna", /\.dd-map-body\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s],
  ["arte de torre limitado", /\.dd-tower-art-wrap\s*\{[^}]*max-height:\s*20vh/s],
  ["lista de círculos flexible", /\.dd-circle-node\s*\{[^}]*gap:\s*10px/s],
  ["submenú dentro del viewport", /\.dd-submenu-card\s*\{[^}]*max-height:\s*96dvh/s],
  ["opciones en una columna", /\.dd-opt-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s],
  ["selects ajustados al ancho", /\.dd-opt-row select\s*\{[^}]*max-width:\s*48vw/s]
];
for (const [name, pattern] of checks) {
  assert.match(css, pattern, "Falta regla responsive: " + name);
  process.stdout.write("PASS " + name + "\n");
}
const source = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, "");
let depth = 0;
for (const char of source) {
  if (char === "{") depth++;
  if (char === "}") depth--;
  assert.ok(depth >= 0, "Llave CSS de cierre sin apertura");
}
assert.equal(depth, 0, "Las llaves CSS no están equilibradas");
process.stdout.write("PASS llaves CSS equilibradas\n");
process.stdout.write(JSON.stringify({ ok: true, passed: checks.length + 1 }, null, 2) + "\n");
