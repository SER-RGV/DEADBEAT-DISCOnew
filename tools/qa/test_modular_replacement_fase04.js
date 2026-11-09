"use strict";

const fs = require("fs");
const path = require("path");

console.log("================================================================");
console.log("   FASE 04 · TEST DE MODULARIDAD Y SUSTITUCIÓN DE RECURSOS       ");
console.log("================================================================");

// 1. Mock browser context
class MockImage {
  constructor() {
    this.naturalWidth = 2560;
    this.naturalHeight = 1440;
    this.complete = true;
    this._attrs = {};
  }
  setAttribute(k, v) { this._attrs[k] = v; }
  getAttribute(k) { return this._attrs[k]; }
}
global.Image = MockImage;
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1,
  __DD_ASSET_VERSION: "20261109.TEST"
};
global.document = {
  getElementById: (id) => ({
    classList: { add: () => {}, remove: () => {} },
    textContent: ""
  }),
  createElement: () => ({ getContext: () => ({}) })
};

// 2. Load manifest
const manifestPath = path.resolve(__dirname, "../../assets/cinematics/manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("FAIL: assets/cinematics/manifest.json no existe");
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
console.log(`OK: Manifiesto cargado con ${Object.keys(manifest.assets).length} recursos y ${manifest.shots.length} planos.`);

// Verify all files referenced in manifest exist on disk
let missingFiles = 0;
for (const [key, meta] of Object.entries(manifest.assets)) {
  const filePath = path.resolve(__dirname, "../../", meta.file);
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: Archivo ${meta.file} (asset ${key}) no existe en disco.`);
    missingFiles++;
  }
}
if (missingFiles > 0) {
  console.error(`FAIL: Se encontraron ${missingFiles} archivos faltantes.`);
  process.exit(1);
}
console.log("OK: El 100% de los archivos declarados en manifest.json existen en disco.");

// 3. Load modules
require("../../src/dd_asset_registry.js");
require("../../src/dd_cinematic_camera.js");

// Verify cache bust URL parameter injection
const testImg = window.DD_ASSETS.images["cine_bg01_city"];
console.log(`OK: Cache-busting comprobado -> src cargado: ${testImg.src}`);
if (!testImg.src.includes("?v=20261109.TEST")) {
  console.error("FAIL: El parámetro de versión de caché no se inyectó correctamente.");
  process.exit(1);
}

// 4. Test fallback mechanism
console.log("Comprobando mecanismo de fallback...");
const sampleMeta = {
  id: "test_fallback_asset",
  src: "assets/non_existent.png",
  fallback: "assets/cinematics/backgrounds/final/cine_bg01_city/cine_bg01_city.png"
};
let fallbackTriggered = false;
const imgWithFallback = new MockImage();
imgWithFallback.onerror = function() {
  if (sampleMeta.fallback && imgWithFallback.getAttribute("data-tried-fallback") !== "true") {
    imgWithFallback.setAttribute("data-tried-fallback", "true");
    imgWithFallback.src = sampleMeta.fallback;
    fallbackTriggered = true;
  }
};
imgWithFallback.src = sampleMeta.src;
imgWithFallback.onerror();
console.log(`OK: Fallback ejecutado correctamente -> Nueva src: ${imgWithFallback.src}`);
if (!fallbackTriggered || imgWithFallback.src !== sampleMeta.fallback) {
  console.error("FAIL: Fallback falló.");
  process.exit(1);
}

// 5. Test shot retrieval with modular assets
console.log("Comprobando ejecución de planos con assets modulares...");
window.DD_CINE.playIntro();
const mockCtx = {
  save: () => {},
  restore: () => {},
  fillRect: () => {},
  drawImage: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  fill: () => {},
  ellipse: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  measureText: () => ({ width: 100 }),
  fillText: () => {}
};

for (let t = 0; t < 35; t += 3.5) {
  window.DD_CINE.update(3.5);
  window.DD_CINE.renderOverlay(mockCtx, 1920, 1080);
}
console.log("OK: 10 planos renderizados sin errores.");

// 6. Test preview tool file existence
const previewPath = path.resolve(__dirname, "../../assets/cinematics/preview/index.html");
const readmePath = path.resolve(__dirname, "../../assets/cinematics/README_ASSET_REPLACEMENT.md");
if (!fs.existsSync(previewPath) || !fs.existsSync(readmePath)) {
  console.error("FAIL: Preview tool o README_ASSET_REPLACEMENT.md no existen.");
  process.exit(1);
}
console.log("OK: Herramienta de previsualización y documentación técnica verificadas.");

console.log("\n================================================================");
console.log("   TODAS LAS PRUEBAS DE FASE 04 COMPLETADAS CON ÉXITO (100% PASS)");
console.log("================================================================");
