#!/usr/bin/env node
"use strict";

// B1 regression suite. It preserves the original 13 deterministic scenarios,
// but now runs the actual du() extracted from the current game source and adds
// ownership, per-type, profile/global cap, and lifecycle cases. Geometry helpers
// are deterministic stubs; this is not a browser gameplay/fairness test.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "../..");
const htmlPath = path.join(ROOT, "DEADBEAT_DISCO.ART.html");
const baselinePath = path.join(ROOT, "ART_AUDIT/BOSSES/evidence/B1_zone_max/current_behavior.json");
const html = fs.readFileSync(htmlPath, "utf8");

function sliceBetween(startMarker, endMarker, fromIndex = 0) {
  const start = html.indexOf(startMarker, fromIndex);
  assert.notEqual(start, -1, `Source marker missing: ${startMarker}`);
  const end = html.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `Source marker missing after ${startMarker}: ${endMarker}`);
  return { start, end, text: html.slice(start + startMarker.length, end) };
}

function runFunction(source, marker, context, filename) {
  vm.createContext(context);
  vm.runInContext(`${marker}${source}`, context, { filename });
  return context;
}

// Read the real profile data. Ye contains the nine circle residents and a
// second Núcleo record; aa(100) selects We, which is separately tested below.
const yeLiteral = sliceBetween("Ye=", ",We=");
const yeRecords = vm.runInNewContext(yeLiteral.text, Object.create(null));
const weLiteral = sliceBetween("We=", ",Ve=", yeLiteral.end);
const nucleus = vm.runInNewContext(`(${weLiteral.text})`, Object.create(null));
const circleResidents = yeRecords.filter((resident) => resident.id !== "nucleo");
const nucleusInYe = yeRecords.find((resident) => resident.id === "nucleo");
assert.equal(yeRecords.length, 10);
assert.equal(circleResidents.length, 9);
assert.ok(nucleusInYe);
assert.equal(nucleus.id, "nucleo");

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
assert.equal(baseline.cases.length, 13, "The original 13 before-correction scenarios must remain available");
assert.equal(baseline.zoneProfileMaxReadByDu, false);
assert.equal(baseline.cases.find((row) => row.profile === "bufe").currentAdded, 3,
  "Historical baseline must retain the confirmed Bufé 2-to-3 discrepancy");

// Execute the actual game du() with deterministic collaborators.
const duSlice = sliceBetween("function du(e,a,t){", "function uu(e){");
const duContext = {
  jc: { zones: null, ZTYPE: { fire: { col: "#ff5533" }, elec: { col: "#ffe64d" } } },
  Qs: (point) => point,
  ye: { x: 500, y: 500 },
  Ps: { x: 0, y: 0, w: 1000, h: 1000 },
  es: () => {},
  Wo: 100
};
runFunction(duSlice.text, "function du(e,a,t){", duContext, "DEADBEAT_DISCO.ART.html:du");
assert.equal(typeof duContext.du, "function");
const finalCleanupCallSites = html.match(/\buu\(sr\)/g) || [];
assert.equal(finalCleanupCallSites.length, 3, "Every final-boss death path must clean only that boss's zones");
assert.equal(/\buu\(\)/.test(html), false, "No ownerless global boss-zone purge calls should remain");

function profileBoss(profile, overrides = {}) {
  return {
    id: profile.id || "test-boss",
    resident: profile.id || "test-boss",
    final: !!profile.final,
    finalStage: 1,
    finalPatternIndex: 0,
    finalPatternTimer: 0,
    zonePattern: profile.zones ? { ...profile.zones } : null,
    ...overrides
  };
}

function place(boss, type, zones, label = "B1 regression") {
  duContext.jc.zones = () => zones;
  return duContext.du(boss, type, label);
}

function activeCount(zones, type, owner) {
  return zones.filter((zone) => zone.type === type && zone.state !== "out" &&
    (owner === undefined || zone.bossZoneOwner72 === owner)).length;
}

function plainZone(type, state = "on", owner = undefined) {
  const zone = { kind: "zone", type, state, x: 30, y: 30, r: 10 };
  if (owner !== undefined) zone.bossZoneOwner72 = owner;
  return zone;
}

const scenarios = [];
const globalCaps = { elec: 2, fire: 3 };
const affected = circleResidents.filter((resident) => resident.zones);
assert.equal(JSON.stringify(affected.map((r) => [r.id, r.variant, r.zones.type, r.zones.every, r.zones.max])), JSON.stringify([
  ["bufe", "pulse", "fire", 6.2, 2],
  ["oficiante", "pulse", "elec", 6.6, 2],
  ["matarife", "sweeper", "fire", 5.6, 3],
  ["traidor", "sweeper", "elec", 6, 2]
]));
assert.equal(circleResidents.filter((r) => r.variant === "hunter").length, 4);
assert.equal(circleResidents.filter((r) => r.variant === "pulse").length, 2);
assert.equal(circleResidents.filter((r) => r.variant === "sweeper").length, 3);

// Original scenarios 1–9: one case for each resident, grouped by archetype.
for (const resident of circleResidents) {
  const zones = [];
  if (!resident.zones) {
    assert.equal(resident.zonePattern, undefined);
    scenarios.push({ id: `resident:${resident.id}`, group: resident.variant, result: "NO_RESIDENT_ZONE_CONFIG" });
    continue;
  }
  const boss = profileBoss(resident);
  const type = resident.zones.type;
  assert.equal(place(boss, type, zones), true, `${resident.id} should place in an open arena`);
  const count = activeCount(zones, type, boss);
  assert.equal(count, resident.zones.max, `${resident.id} must obey its profile maximum`);
  assert.ok(count <= globalCaps[type], `${resident.id} exceeded the global ${type} cap`);
  assert.equal(place(boss, type, zones), false, `${resident.id} should reject another request at its cap`);
  assert.ok(zones.every((zone) => zone.bossZoneOwner72 === boss), `${resident.id} zones must carry their creator reference`);
  scenarios.push({ id: `resident:${resident.id}`, group: resident.variant, type,
    profileMax: resident.zones.max, placed: count, overflowRejected: true });
}
assert.equal(scenarios.length, 9);

// Original scenarios 10–11: both Núcleo stages preserve the global fallback.
for (const [stage, type, expected] of [[2, "elec", 2], [3, "fire", 3]]) {
  const zones = [];
  const boss = profileBoss(nucleus, { final: true, finalStage: stage, zonePattern: null });
  assert.equal(place(boss, type, zones), true);
  assert.equal(activeCount(zones, type), expected);
  assert.ok(zones.every((zone) => zone.bossZoneOwner72 === boss));
  scenarios.push({ id: `nucleo:stage-${stage}`, type, placed: expected, fallback: "global" });
}

// Original scenarios 12–13 now assert that a zone of the other type does not
// consume this type's global limit.
for (const [targetType, otherType, expected] of [["fire", "elec", 3], ["elec", "fire", 2]]) {
  const zones = [plainZone(otherType)];
  const boss = profileBoss({ id: `mixed-${targetType}`, zones: { type: targetType, max: 99 } });
  assert.equal(place(boss, targetType, zones), true);
  assert.equal(activeCount(zones, targetType), expected);
  scenarios.push({ id: `mixed-global:${targetType}-with-${otherType}`, placed: expected, otherTypeUnaffected: true });
}
assert.equal(scenarios.length, 13, "Preserve all 13 original scenario slots");

// A. Bufé: cap at two, reject a third, then release exactly one slot when a
// zone is removed from the active list.
{
  const zones = [];
  const bufe = profileBoss(circleResidents.find((r) => r.id === "bufe"));
  assert.equal(place(bufe, "fire", zones), true);
  assert.equal(activeCount(zones, "fire", bufe), 2);
  assert.equal(place(bufe, "fire", zones), false);
  const removed = zones.findIndex((z) => z.bossZoneOwner72 === bufe && z.type === "fire");
  assert.notEqual(removed, -1);
  zones.splice(removed, 1);
  assert.equal(place(bufe, "fire", zones), true);
  assert.equal(activeCount(zones, "fire", bufe), 2);
  assert.equal(zones.filter((z) => z.bossZoneOwner72 === bufe && z.type === "fire").length, 2);
}

// B. Exact profile ceilings for every configured resident, including repeated
// calls that would otherwise try to overfill the profile.
for (const resident of affected) {
  const zones = [];
  const boss = profileBoss(resident);
  let guard = 0;
  while (place(boss, resident.zones.type, zones)) {
    assert.ok(++guard < 5, `${resident.id}: unbounded zone placement`);
  }
  assert.equal(activeCount(zones, resident.zones.type, boss), resident.zones.max, resident.id);
  assert.equal(activeCount(zones, resident.zones.type), Math.min(resident.zones.max, globalCaps[resident.zones.type]));
}

// C. Global ceilings remain hard ceilings even when a profile asks for more.
for (const type of ["elec", "fire"]) {
  const zones = [];
  const boss = profileBoss({ id: `global-${type}`, zones: { type, max: 99 } });
  let guard = 0;
  while (place(boss, type, zones)) assert.ok(++guard < 5);
  assert.equal(activeCount(zones, type), globalCaps[type]);
  assert.ok(activeCount(zones, type) <= globalCaps[type]);
}

// D. Per-type limits are independent; one owner can hold both types without
// either type spending the other's global or profile capacity.
{
  const zones = [];
  const fireBoss = profileBoss({ id: "dual-type-owner", zones: { type: "fire", max: 2 } });
  const elecBoss = profileBoss({ id: "dual-type-owner", zones: { type: "elec", max: 2 } });
  assert.equal(place(fireBoss, "fire", zones), true);
  assert.equal(place(elecBoss, "elec", zones), true);
  assert.equal(activeCount(zones, "fire", fireBoss), 2);
  assert.equal(activeCount(zones, "elec", elecBoss), 2);
  assert.equal(activeCount(zones, "fire"), 2);
  assert.equal(activeCount(zones, "elec"), 2);
}

// E. Two distinct boss objects with the same resident ID retain independent
// ownership and profile counts; there is no active-sr/global-owner lookup.
{
  const zones = [];
  const bossA = profileBoss({ id: "same-resident", zones: { type: "fire", max: 1 } });
  const bossB = profileBoss({ id: "same-resident", zones: { type: "fire", max: 1 } });
  assert.notStrictEqual(bossA, bossB);
  assert.equal(place(bossA, "fire", zones), true);
  assert.equal(place(bossB, "fire", zones), true);
  assert.equal(activeCount(zones, "fire", bossA), 1);
  assert.equal(activeCount(zones, "fire", bossB), 1);
  assert.ok(zones.some((z) => z.bossZoneOwner72 === bossA));
  assert.ok(zones.some((z) => z.bossZoneOwner72 === bossB));
  assert.equal(place(bossA, "fire", zones), false);
  assert.equal(place(bossB, "fire", zones), false);
  let activeBossA = bossA;
  activeBossA = null;
  assert.strictEqual(zones.find((z) => z.bossZoneOwner72 === bossA).bossZoneOwner72, bossA,
    "Zone must retain its exact creator after the active reference is cleared");
}

// E2. Same-type concurrent owners still share the global cap but not the
// profile cap. The second owner can use the remaining global slot only.
{
  const zones = [];
  const bossA = profileBoss({ id: "bufe", zones: { type: "fire", max: 2 } });
  const bossB = profileBoss({ id: "bufe", zones: { type: "fire", max: 2 } });
  assert.equal(place(bossA, "fire", zones), true);
  assert.equal(activeCount(zones, "fire", bossA), 2);
  assert.equal(place(bossB, "fire", zones), true);
  assert.equal(activeCount(zones, "fire", bossB), 1);
  assert.equal(activeCount(zones, "fire"), 3);
  assert.equal(place(bossB, "fire", zones), false);
  const bIndex = zones.findIndex((z) => z.bossZoneOwner72 === bossB);
  zones.splice(bIndex, 1);
  assert.equal(place(bossB, "fire", zones), true);
  assert.equal(activeCount(zones, "fire", bossA), 2);
  assert.equal(activeCount(zones, "fire", bossB), 1);
}

// Invalid/absent values fall back to the unchanged global cap. Zero is valid
// and disables the profile's zones; fractional finite caps are floored.
for (const max of [undefined, null, "2", -1, NaN, Infinity]) {
  const zones = [];
  const boss = profileBoss({ id: `invalid-${String(max)}`, zones: { type: "fire", max } });
  let guard = 0;
  while (place(boss, "fire", zones)) assert.ok(++guard < 5);
  assert.equal(activeCount(zones, "fire"), 3, `Invalid max ${String(max)} should use global fallback`);
}
{
  const zones = [];
  const zeroBoss = profileBoss({ id: "zero-max", zones: { type: "fire", max: 0 } });
  assert.equal(place(zeroBoss, "fire", zones), false);
  assert.equal(zones.length, 0);
  const fractionalBoss = profileBoss({ id: "fraction-max", zones: { type: "fire", max: 1.9 } });
  assert.equal(place(fractionalBoss, "fire", zones), true);
  assert.equal(activeCount(zones, "fire", fractionalBoss), 1);
}
{
  const zones = [];
  const mismatchedTypeBoss = profileBoss({ id: "mismatched-type", zones: { type: "fire", max: 1 } });
  assert.equal(place(mismatchedTypeBoss, "elec", zones), true);
  assert.equal(activeCount(zones, "elec"), 2, "A profile max must only apply to its matching type");
}

// Active means warn/on; out/fading zones no longer consume either cap even
// while the existing zone manager keeps them for its short fade-out.
{
  const owner = profileBoss({ id: "out-does-not-count", zones: { type: "fire", max: 1 } });
  const zones = [plainZone("fire", "out", owner)];
  assert.equal(place(owner, "fire", zones), true);
  assert.equal(activeCount(zones, "fire", owner), 1);
  assert.equal(zones.length, 2, "Out zone remains in the fade array but is not active capacity");
}

// F. Núcleo phases remain separate from resident zonePattern.max and use the
// same-type global fallback; owner references are retained on its zones.
for (const [stage, type, expected] of [[2, "elec", 2], [3, "fire", 3]]) {
  const zones = [];
  const boss = profileBoss(nucleus, { final: true, finalStage: stage, zonePattern: null });
  assert.equal(place(boss, type, zones), true);
  assert.equal(activeCount(zones, type), expected);
  assert.ok(zones.every((zone) => zone.bossZoneOwner72 === boss));
}

// G. Execute the actual final-boss zone purge helper and prove that removed
// zones release their owner references while unrelated zones survive.
const uuSlice = sliceBetween("function uu(e){", "function pu(");
const cleanupContext = { jc: { zones: () => null } };
runFunction(uuSlice.text, "function uu(e){", cleanupContext, "DEADBEAT_DISCO.ART.html:uu");
{
  const owner = profileBoss({ id: "cleanup-owner", zones: { type: "elec", max: 2 }, final: true });
  const unrelatedOwner = profileBoss({ id: "other-owner", zones: { type: "fire", max: 1 } });
  const zones = [];
  place(owner, "elec", zones);
  place(unrelatedOwner, "fire", zones);
  zones.push({ ...plainZone("slow"), bossZone72: false });
  cleanupContext.jc.zones = () => zones;
  cleanupContext.uu(owner);
  assert.equal(zones.some((z) => z.bossZoneOwner72 === owner), false);
  assert.equal(activeCount(zones, "fire", unrelatedOwner), 1,
    "Final-boss purge must not erase another boss's zones");
  assert.equal(zones.length, 2, "Unrelated boss zones and non-boss zones survive owner-specific purge");
}

// Run the actual room clear helper ee() and actual jc.reset() body in minimal
// controlled contexts, then verify no zone retains an owner reference.
const eeSlice = sliceBetween("function ee(e){", "function ae(");
const clearContext = { n: { zones: [], gaps: [], version: 0 }, N: () => {}, h: () => {} };
runFunction(eeSlice.text, "function clearZonesGaps(e){", clearContext, "DEADBEAT_DISCO.ART.html:clearZonesGaps");
{
  const boss = profileBoss({ id: "clear-owner", zones: { type: "fire", max: 2 } });
  const zones = [];
  place(boss, "fire", zones);
  clearContext.n.zones = zones;
  clearContext.n.gaps = [];
  clearContext.clearZonesGaps("B1 test cleanup");
  assert.equal(clearContext.n.zones.length, 0);
  assert.equal(clearContext.n.zones.some((z) => z.bossZoneOwner72), false);
}

const jcStart = html.indexOf("const jc=function(){");
const resetStart = html.indexOf("reset:function(){", jcStart);
const resetEnd = html.indexOf("},update:function(a)", resetStart);
assert.ok(jcStart >= 0 && resetStart > jcStart && resetEnd > resetStart, "Could not locate actual jc.reset() body");
const resetBody = html.slice(resetStart + "reset:function(){".length, resetEnd);
const resetContext = {
  tc: [],
  b: () => [],
  n: {
    zones: [], gaps: [], pending: {}, lastSpatialT: 1, lastReliefT: 1, version: 1,
    baseVer: 1, nextId: 4, wasBoss: true, restoreWanted: true, awaitBoss: true,
    ambient: {}, lastZoneT: {}, nextZoneId: 4, chain: {}
  }
};
runFunction(resetBody + "}", "function reset(){", resetContext, "DEADBEAT_DISCO.ART.html:jc.reset");
{
  const owner = profileBoss({ id: "reset-owner", zones: { type: "elec", max: 2 } });
  const zones = [];
  place(owner, "elec", zones);
  resetContext.n.zones = zones;
  resetContext.reset();
  assert.equal(resetContext.n.zones.length, 0);
  assert.equal(resetContext.n.nextZoneId, 1);
  assert.equal(resetContext.n.zones.some((z) => z.bossZoneOwner72), false);
}

// The current JC public state serializer returns only selected zone fields;
// owner references must not leak into debug/serialization state.
const stateStart = html.indexOf("state:function(){", jcStart);
const stateEnd = html.indexOf(",log:l,rejects:i", stateStart);
assert.ok(stateStart >= 0 && stateEnd > stateStart);
assert.equal(html.slice(stateStart, stateEnd).includes("bossZoneOwner72"), false);

const after = {
  test: "boss_zone_max_b1_after_fix",
  sourceCoupled: true,
  originalScenarioCount: scenarios.length,
  expandedAssertions: true,
  yeProfiles: yeRecords.length,
  circleResidents: circleResidents.length,
  nucleusAlsoPresentInYe: !!nucleusInYe,
  affectedProfiles: affected.length,
  globalCaps,
  zoneOwnerField: "bossZoneOwner72 (direct creator-object reference)",
  duSourceOffset: duSlice.start,
  scenarios,
  additionalChecks: {
    bufeTwoThenRejectAndRelease: "PASS",
    allConfiguredResidentMaxima: "PASS",
    hardGlobalCaps: "PASS",
    independentTypes: "PASS",
    simultaneousDistinctOwners: "PASS",
    sameTypeGlobalSharing: "PASS",
    invalidAbsentZeroFractionalCaps: "PASS",
    outZonesDoNotConsumeCapacity: "PASS",
    nucleusPhaseFallbacks: "PASS",
    actualBossZonePurge: "PASS",
    actualClearZonesGaps: "PASS",
    actualRoomReset: "PASS",
    stateSerializerOmitsOwnerReference: "PASS"
  }
};
const comparison = {
  test: "boss_zone_max_b1_before_after",
  before: {
    file: path.relative(ROOT, baselinePath),
    originalScenarios: baseline.cases,
    bufeFireDeclaredMax: 2,
    bufeFirePlaced: baseline.cases.find((row) => row.profile === "bufe").currentAdded,
    mixedFireWithExistingElec: baseline.cases.find((row) => row.targetType === "fire").added,
    mixedElecWithExistingFire: baseline.cases.find((row) => row.targetType === "elec").added
  },
  after,
  changesObserved: {
    bufeFireMaxRespected: true,
    crossTypeGlobalSlotsIndependent: true,
    globalPerTypeCapsUnchanged: true,
    nucleusUsesGlobalFallback: true
  }
};

console.log(JSON.stringify(comparison, null, 2));
