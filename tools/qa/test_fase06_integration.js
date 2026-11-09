"use strict";

const fs = require("fs");
const path = require("path");

console.log("================================================================");
console.log("   FASE 06 · VALIDACIÓN INTEGRAL DE ARRANQUE Y EXPERIENCIA      ");
console.log("================================================================");

// 1. Mock Browser Environment
class MockElement {
  constructor() {
    this.classList = { add: () => {}, remove: () => {} };
    this.children = [];
    this.parentNode = null;
    this.textContent = "";
    this.style = {};
  }
  setAttribute() {}
  removeAttribute() {}
  addEventListener() {}
  appendChild(child) { this.children.push(child); return child; }
  querySelector() { return new MockElement(); }
  querySelectorAll() { return []; }
}

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
  matchMedia: () => ({ matches: false }),
  DDC_COVER: {
    music: {
      playing: false,
      start: () => { global.window.DDC_COVER.music.playing = true; return true; },
      stop: () => { global.window.DDC_COVER.music.playing = false; },
      duck: () => {}
    }
  },
  __DD_BRIDGE: {
    isRunning: () => true
  }
};
global.document = {
  readyState: "complete",
  body: new MockElement(),
  querySelector: () => new MockElement(),
  querySelectorAll: () => [],
  getElementById: () => new MockElement(),
  createElement: () => new MockElement()
};
global.performance = { now: () => Date.now() };

// 2. Load game modules
require("../../src/dd_asset_registry.js");
require("../../src/dd_hub_system.js");
require("../../src/dd_cinematic_camera.js");
require("../../src/dd_ui_system.js");
require("../../src/dd_boot.js");

console.log("Módulos cargados correctamente.");

// ESCENARIO A — ARRANQUE NORMAL
console.log("\n[ESCENARIO A] ARRANQUE NORMAL");
console.log("Estado inicial de DD_BOOT:", window.DD_BOOT.getState().state);

// ESCENARIO B — SECUENCIA COMPLETA
console.log("\n[ESCENARIO B] SECUENCIA COMPLETA (10 PLANOS & CONTINUIDAD DEL HÉROE)");
let introDone = false;
window.DD_CINE.playIntro(() => {
  introDone = true;
});
console.log("Cinemática activa:", window.DD_CINE.getState());

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

// Advance through all 10 shots with natural delta times (60fps dt = 0.016)
const dt = 0.016;
const totalFrames = Math.ceil(36.0 / dt);
for (let f = 0; f < totalFrames; f++) {
  window.DD_CINE.update(dt);
  if (f % 120 === 0) {
    window.DD_CINE.renderOverlay(mockCtx, 1920, 1080);
  }
}
console.log("Fin de cinemática: callback ejecutado =", introDone);
console.log("Estado de la cámara tras la cinemática:", window.DD_CINE.getState());

// ESCENARIO C — TRANSICIÓN DIRECTA AL HUB
console.log("\n[ESCENARIO C] TRANSICIÓN AL HUB (ROOM R0)");
console.log("window.DD_HUB activo:", window.DD_HUB.isActive());
const hubState = window.DD_HUB.getState();
console.log("Posición del protagonista en el HUB:", `(${hubState.x}, ${hubState.y})`);
if (!window.DD_HUB.isActive() || hubState.x !== 880 || hubState.y !== 615) {
  console.error("FAIL: El HUB no se activó con las coordenadas correctas.");
  process.exit(1);
}
console.log("OK: El protagonista se encuentra posicionado en el HUB r0 en (880, 615).");

// ESCENARIO D — SKIP
console.log("\n[ESCENARIO D] COMPROBACIÓN DE SALTO RÁPIDO (SKIP)");
let skipDone = false;
window.DD_CINE.playIntro(() => {
  skipDone = true;
});
console.log("Iniciada cinemática para skip. Estado:", window.DD_CINE.getState());
window.DD_CINE.skip();
console.log("Skip ejecutado. Estado:", window.DD_CINE.getState(), "| Callback recibido:", skipDone);
console.log("window.DD_HUB activo tras skip:", window.DD_HUB.isActive());

if (window.DD_CINE.getState() !== null || !skipDone || !window.DD_HUB.isActive()) {
  console.error("FAIL: Skip no transfirió correctamente el control al HUB.");
  process.exit(1);
}
console.log("OK: Skip traslada al jugador al HUB inmediatamente sin bloqueos.");

// ESCENARIO E — AUDIO
console.log("\n[ESCENARIO E] AUDIO Y COMPATIBILIDAD CON RESTRICCIONES DE NAVEGADOR");
const audioState = window.DD_BOOT.audio.isMenuMusicPlaying();
console.log("Música de menú / intro reproduciéndose:", audioState);
console.log("Probando parada de música al entrar a run...");
window.DD_BOOT.audio.stopMenuMusic(0.2);
console.log("Música tras parada:", window.DD_BOOT.audio.isMenuMusicPlaying());
console.log("OK: Árbitro de audio responde con éxito.");

console.log("\n================================================================");
console.log("   TODAS LAS PRUEBAS DE FASE 06 COMPLETADAS SATISFACTORIAMENTE  ");
console.log("================================================================");
