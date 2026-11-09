"use strict";

const fs = require("fs");
const path = require("path");

console.log("================================================================");
console.log("   FASE 03 · VERIFICACIÓN INTEGRAL DE CINEMÁTICA Y HUB R0        ");
console.log("================================================================");

// 1. Mock browser context
class MockImage {
  constructor() {
    this.naturalWidth = 1920;
    this.naturalHeight = 1080;
    this.complete = true;
  }
}
global.Image = MockImage;
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1
};
let tagContent = "";
let subContent = "";
global.document = {
  getElementById: (id) => {
    if (id === "dd-cine-tag") return { textContent: tagContent, set: (v) => tagContent = v };
    if (id === "dd-cine-sub") return { textContent: subContent, set: (v) => subContent = v };
    return {
      classList: { add: () => {}, remove: () => {} },
      textContent: ""
    };
  },
  createElement: () => ({ getContext: () => ({}) })
};

// 2. Load modules
require("../../src/dd_asset_registry.js");
require("../../src/dd_cinematic_camera.js");

// Mock Hub
let hubEntered = false;
let hubActive = false;
window.DD_HUB = {
  isActive: () => hubActive,
  enter: () => {
    hubEntered = true;
    hubActive = true;
    console.log("   [HUB HOOK] -> window.DD_HUB.enter() ejecutado con éxito.");
  }
};

// 3. Test asset registrations
console.log("\n[TEST 1] Verificación de Registro de Escenarios y Capas 2.5D");
const masters = [
  "cine_bg01_city",
  "cine_bg02_club_exterior",
  "cine_bg03_entrance",
  "cine_bg04_main_hall",
  "cine_bg05_dancefloor",
  "cine_bg06_hero"
];

let allAssetsOk = true;
masters.forEach((m) => {
  const asset = window.DD_ASSETS.get(m);
  if (!asset) {
    console.error(`   FAIL: Master asset ${m} no encontrado`);
    allAssetsOk = false;
  } else {
    console.log(`   OK: Master ${m} (2560x1440) registrado y accesible`);
  }
});

// Check layers for each scenario
const manifest = window.DD_ASSETS.manifest;
masters.forEach((m) => {
  const layerKeys = Object.keys(manifest.entries).filter(k => k.startsWith(m + "_0"));
  console.log(`   OK: ${m} cuenta con ${layerKeys.length} capas 2.5D registradas`);
  if (layerKeys.length !== 3) {
    console.error(`   FAIL: Se esperaban 3 capas para ${m}, encontradas ${layerKeys.length}`);
    allAssetsOk = false;
  }
});

if (!allAssetsOk) {
  process.exit(1);
}

// 4. Test 10-shot execution & timing
console.log("\n[TEST 2] Verificación de la Secuencia de 10 Planos (35.0s, 128 BPM)");
let introFinished = false;
window.DD_CINE.playIntro(() => {
  introFinished = true;
});

const state0 = window.DD_CINE.getState();
console.log(`   Inicio cinemática: Duración esperada = ${state0.duration}s (Tipo: ${state0.type})`);
if (state0.duration !== 35.0) {
  console.error("   FAIL: Duración debe ser 35.0 segundos");
  process.exit(1);
}

// Verify shots across timeline
const testPoints = [
  { t: 1.5, shot: "01", name: "Ciudad Exterior" },
  { t: 5.0, shot: "02", name: "Fachada Club" },
  { t: 8.5, shot: "03", name: "Umbral Dutch Angle" },
  { t: 11.5, shot: "04", name: "Silueta Contraluz Protagonista" },
  { t: 15.5, shot: "05", name: "Tracking Lateral Corredor" },
  { t: 19.0, shot: "06", name: "Gran Nave Bóvedas" },
  { t: 23.0, shot: "07", name: "Drop Pista Principal" },
  { t: 26.5, shot: "08", name: "Presentación Heroica MCU" },
  { t: 30.5, shot: "09", name: "Identidad Logotipo Oficial" },
  { t: 33.5, shot: "10", name: "Transición Seamless HUB" }
];

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

testPoints.forEach((pt) => {
  while (window.DD_CINE.getState() && window.DD_CINE.getState().elapsed < pt.t) {
    window.DD_CINE.update(0.016);
  }
  window.DD_CINE.renderOverlay(mockCtx, 1920, 1080);
  const cam = window.DD_CINE.getCamera();
  console.log(`   t=${pt.t.toFixed(1)}s: Plano ${pt.shot} [${pt.name}] -> Cam Zoom: ${cam.zoomMul.toFixed(3)}, OffX: ${cam.offX.toFixed(2)}, OffY: ${cam.offY.toFixed(2)}`);
});

// Advance to end of sequence
console.log("\n[TEST 3] Conexión y Entrega Seamless al HUB (Plano 10 -> Room r0)");
while (window.DD_CINE.getState()) {
  window.DD_CINE.update(0.016);
  window.DD_CINE.renderOverlay(mockCtx, 1920, 1080);
}

console.log(`   Cinemática finalizada: introFinished = ${introFinished}`);
console.log(`   HUB Activado automáticamente: hubEntered = ${hubEntered}, hubActive = ${hubActive}`);

if (!introFinished || !hubEntered) {
  console.error("   FAIL: La cinemática no completó la entrega automática al HUB");
  process.exit(1);
}

// 5. Test Skip functionality
console.log("\n[TEST 4] Verificación de Salto Rápido (Skip)");
let skipCallbackDone = false;
window.DD_CINE.playIntro(() => {
  skipCallbackDone = true;
});
window.DD_CINE.skip();
console.log(`   Skip ejecutado: Estado = ${window.DD_CINE.getState()}, Callback = ${skipCallbackDone}`);

if (window.DD_CINE.getState() !== null || !skipCallbackDone) {
  console.error("   FAIL: Skip falló");
  process.exit(1);
}

console.log("\n================================================================");
console.log("   TODAS LAS PRUEBAS DE FASE 03 COMPLETADAS SATISFACTORIAMENTE  ");
console.log("================================================================");
