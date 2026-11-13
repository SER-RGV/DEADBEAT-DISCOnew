"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "ART_PACK", "art_pack.js"), "utf8");
const match = source.match(/function entry\(m\)\s*\{[\s\S]*?\n  \}/);
assert.ok(match, "ART_PACK debe exponer la función entry(m) en su implementación");

const context = { BASE: "ART_ASSETS/tanda_01/" };
vm.createContext(context);
vm.runInContext("(" + match[0] + ")", context);
const entry = context.entry;

const custom = entry({
  id: "hub-floor",
  path: "ART_ASSETS/hub/tanda_01/hub_01_suelo_central.png",
  base: "ART_ASSETS/tanda_01/",
  file: "floor_01_neon_dancefloor.png",
  loader: "T3B",
  pivot: "tile",
  w: 512,
  h: 512
});
assert.equal(custom.file, "ART_ASSETS/hub/tanda_01/hub_01_suelo_central.png",
  "La ruta personalizada debe tener prioridad sobre base + file");

const based = entry({
  id: "boss",
  base: "ART_ASSETS/bosses/tanda_01/",
  file: "boss.png",
  loader: "ILT",
  pivot: "center",
  w: 400,
  h: 386
});
assert.equal(based.file, "ART_ASSETS/bosses/tanda_01/boss.png",
  "Las entradas con base deben respetar su directorio");

const standard = entry({
  id: "floor",
  file: "floor.png",
  loader: "T3B",
  pivot: "tile",
  w: 512,
  h: 512
});
assert.equal(standard.file, "ART_ASSETS/tanda_01/floor.png",
  "Las entradas estándar deben usar BASE");

assert.equal(custom.id, "hub-floor");
assert.deepEqual(Array.from(custom.expected), [512, 512]);
console.log("PASS ART_PACK: ruta personalizada, base y ruta estándar");
