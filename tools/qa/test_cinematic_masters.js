"use strict";
const assert = require('assert');
const el = { classList: { add() {}, remove() {} }, addEventListener() {}, style: {}, textContent: '' };
global.document = { getElementById: () => el, createElement: () => el, body: { appendChild() {} } };
global.window = { matchMedia: () => ({ matches: false }), addEventListener() {}, DD_HUB: { enter() {}, isActive: () => true } };
let missing = null;
const images = Object.create(null);
window.DD_ASSETS = { get(id) {
  if (id === missing) return null;
  return images[id] ||= { id, naturalWidth: 1376, naturalHeight: 768 };
} };
require('../../src/dd_cinematic_camera.js');
let drawn = [];
const gradient = { addColorStop() {} };
const ctx = {
  globalAlpha: 1, save() {}, restore() {}, fillRect() {}, drawImage(img) { drawn.push(img.id); },
  createLinearGradient: () => gradient, createRadialGradient: () => gradient,
  beginPath() {}, ellipse() {}, fill() {}, translate() {}, rotate() {}, scale() {},
  moveTo() {}, lineTo() {}, closePath() {}
};
const cases = [
  [1.5, 'cine_bg01_city'], [5, 'cine_bg02_club_exterior'], [8.5, 'cine_bg03_entrance'],
  [11.5, 'cine_bg03_entrance'], [15.5, 'cine_bg03_entrance'], [19, 'cine_bg04_main_hall'],
  [23, 'cine_bg05_dancefloor'], [26, 'cine_bg06_hero'], [30, 'cine_bg06_hero'], [33, 'cine_bg06_hero']
];
for (const [time, master] of cases) {
  window.DD_CINE.playIntro(() => {});
  while (window.DD_CINE.getState().elapsed < time) window.DD_CINE.update(.05);
  drawn = []; window.DD_CINE.renderOverlay(ctx, 960, 540);
  assert(drawn.includes(master), `${time}: missing ${master}: ${drawn}`);
  assert(!drawn.some(id => id.startsWith(master + '_0')), `${time}: old layers drawn over master`);
}
// Missing master: legacy layers must still render; a late master must not pop in mid-shot.
missing = 'cine_bg03_entrance'; window.DD_CINE.playIntro(() => {});
while (window.DD_CINE.getState().elapsed < 11.5) window.DD_CINE.update(.05);
drawn = []; window.DD_CINE.renderOverlay(ctx, 960, 540);
assert(drawn.includes('cine_bg03_entrance_01_vaulted_hallway_depth'));
assert(drawn.includes('cine_bg03_entrance_03_foreground_pillars_occlusion'));
missing = null; drawn = []; window.DD_CINE.renderOverlay(ctx, 960, 540);
assert(!drawn.includes('cine_bg03_entrance'), 'master appeared halfway through shot');
console.log('OK: masters in ten shots, no duplicate layers, fallback and stable per-shot choice');
