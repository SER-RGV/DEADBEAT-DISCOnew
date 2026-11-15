#!/usr/bin/env node
"use strict";

/*
 * Regresión estática de las etiquetas de controles visibles del HUD.
 * Contrasta la etiqueta de bomba con el contrato del motor y evita
 * confundir la tecla de bomba con la esquiva.
 *
 * Uso: node tools/qa/test_hud_control_labels.js
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const uiPath = path.join(ROOT, "src", "dd_ui_system.js");
const builderPath = path.join(ROOT, "tools", "build_active_html.py");
const ui = fs.readFileSync(uiPath, "utf8");
const builder = fs.readFileSync(builderPath, "utf8");
const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok: !!ok, detail: detail || "" });
  console.log((ok ? "PASS " : "FAIL ") + name + (detail ? " · " + detail : ""));
}
function oneMatch(regex, label) {
  const found = ui.match(regex);
  if (!found) throw new Error("No se encuentra " + label + " en " + uiPath);
  return found[1];
}

try {
  const bombKey = oneMatch(/id="dd-skill-bomb-key">([^<]+)<\/span>/, "la etiqueta de bomba");
  const boostKey = oneMatch(/id="dd-skill-boost-key">([^<]+)<\/span>/, "la etiqueta de boost");
  const dodgeKey = oneMatch(/id="dd-skill-dodge"[^>]*>[\s\S]*?<span class="dd-skill-key">([^<]+)<\/span>/, "la etiqueta de esquiva");
  check("bomba muestra Q (tp del motor)", bombKey === "Q", bombKey);
  check("boost conserva SHIFT", boostKey === "SHIFT", boostKey);
  check("esquiva conserva ROLL", dodgeKey === "ROLL", dodgeKey);
  check("constructor integra dd_ui_system.js", builder.includes('"dd_ui_system.js"'));
  const failed = checks.filter((x) => !x.ok);
  console.log(JSON.stringify({ ok: failed.length === 0, passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
  process.exitCode = failed.length ? 1 : 0;
} catch (error) {
  console.error("HUD CONTROL LABEL TEST FAILED:", error.message);
  process.exitCode = 1;
}
