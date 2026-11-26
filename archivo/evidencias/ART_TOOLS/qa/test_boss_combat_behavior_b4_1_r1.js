#!/usr/bin/env node
'use strict';

// B4.1-R1 regression: execute the active HTML's real vh/wh/Th and the real B2
// Th observer in a controlled VM. Only floor/budget/acceptance dependencies are
// controlled; scheduler cadence, pattern counts and FSM implementation are real.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const FSM = require('../../boss_animation_state_machine.js');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'DEADBEAT_DISCO.ART.html'), 'utf8');
let assertions = 0;
function check(value, message) { assert.ok(value, message); assertions++; }
function balanced(source, marker, open = '{') {
  const at = source.indexOf(marker);
  assert.notEqual(at, -1, `missing source marker: ${marker}`);
  const begin = source.indexOf(open, at);
  const close = open === '{' ? '}' : ']';
  let depth = 0, quote = '', escaped = false;
  for (let i = begin; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === open) depth++;
    else if (ch === close && --depth === 0) return source.slice(at, i + 1);
  }
  throw new Error(`unclosed source marker: ${marker}`);
}
function functionSource(signature) { return balanced(html, signature); }

const aoSource = balanced(html, 'Ao={');
const vhSource = functionSource('function vh(e,a,t,o)');
const whSource = functionSource('function wh(e,a)');
const thSource = functionSource('function Th(e,a)');
const bridgeSource = balanced(html, 'Th=function(e,a)');
const ctx = {
  window: { DMO_BOSS_ANIMATION_FSM: FSM },
  Ao: vm.runInNewContext(`(${aoSource.slice(aoSource.indexOf('{'))})`),
  Ia: [],
  Gr: { budget: { projectiles: 36 } },
  yl: false, Zr: null, df: null, Da: [],
  ye: { x: 100, y: 100 },
  kp: { records: [], add(record) { this.records.push(record); } },
  events: [],
  emissionsBeforeRejection: 5,
  corridor: true,
  Mh: () => 60,
  js: () => true,
  nc: () => { ctx.vhCalls++; return ctx.vhCalls > ctx.emissionsBeforeRejection; },
  vhCalls: 0,
  kh: () => ctx.corridor ? Math.PI / 4 : null,
  Eh: () => ctx.corridor,
  Pp() {},
  ih: (kind, detail) => { ctx.events.push({ kind, detail }); },
  Nd(a, b) { let d = Math.abs(a - b) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); },
  Sh() { return false; },
  console
};
vm.createContext(ctx);
vm.runInContext(`${vhSource}\n${whSource}\n${thSource}`, ctx);
ctx.Sy = ctx.Th;
vm.runInContext(bridgeSource, ctx);

function makeBoss(pattern = 'fan') {
  FSM.clear();
  return {
    resident: 'pogo', variant: 'sweeper', variantAttack: 1, phase: 'ranged', entrance: 0,
    x: 400, y: 300, r: 34, hp: 100, maxHp: 100, attackTimer: 0.05,
    patterns72: [pattern], patternIndex71: 0, pattern71: '', patternWarn71: 0,
    patternShot71: 0, patternAttempt71: 0, patternAccepted71: 0, patternCreated71: 0,
    patternCompleted71: false, patternEmissionKind71: '', patternStep71: 0,
    patternExec71: 0, patternSpin71: 0, exposedT: 0, addsSpawned: 0, addsMax: 0
  };
}
function step(boss, dt = 0.05) {
  ctx.Th.call(ctx, boss, dt);
  if (boss._ddaAttackT > 0) boss._ddaAttackT = Math.max(0, boss._ddaAttackT - dt); // Tf()'s existing visual-pulse decay before the FSM update.
  return FSM.update(boss, dt, { patterns: ctx.Ao, player: ctx.ye });
}
function startAndWarn(boss) {
  const selected = step(boss);
  assert.equal(boss.pattern71, boss.patterns72[0], 'real selector wh() selects the fixture pattern');
  let warningTicks = 0;
  while (boss.patternWarn71 > 0 && warningTicks < 40) { step(boss); warningTicks++; }
  assert.equal(boss.patternWarn71, 0, 'real warning timer reaches zero before emission');
  return selected;
}
function emittedEvents(boss) { return FSM.drainEvents(boss).map(e => ({ type: e.type, detail: e.detail || {} })); }

// Rejection total: the real vh returns false for all five actual calls.
{
  const e = makeBoss('fan');
  ctx.Ia.length = 0; ctx.kp.records.length = 0; ctx.vhCalls = 0; ctx.emissionsBeforeRejection = 0;
  startAndWarn(e);
  const before = FSM.get(e).state;
  const emitted = step(e);
  const events = emittedEvents(e);
  check(e.patternAttempt71 === 5 && e.patternAccepted71 === 0 && e.patternCreated71 === 0, 'five rejected vh calls remain 5 attempted / 0 accepted / 0 created');
  check(ctx.Ia.length === 0, 'rejection creates no projectile in Ia');
  check(e.patternShot71 === 5 && e.patternCompleted71 === true && e.pattern71 === '', 'scheduler cadence/completion remains unchanged while counters report rejection');
  check(!['ATTACK', 'ATTACK_RECOVERY'].includes(before) && !['ATTACK', 'ATTACK_RECOVERY'].includes(emitted.state), `no false ATTACK or recovery transition on total rejection; before=${before}, after=${emitted.state}`);
  check(!events.some(x => ['attack.start', 'attack.end', 'attack.interrupted'].includes(x.type)), 'zero accepted shots produce no false execution/interruption event');
  check(!FSM.get(e).pattern && FSM.get(e).state === 'OBSERVING', 'rejected pattern clears the FSM warning state');
  check(!FSM.drainEvents(e).length, 'rejection leaves no residual/duplicate FSM events');
}

// Partial acceptance: two true vh returns create two bullets; the scheduler completed normally and the B2 event keeps the partial counts.
{
  const e = makeBoss('fan');
  ctx.Ia.length = 0; ctx.kp.records.length = 0; ctx.vhCalls = 0; ctx.emissionsBeforeRejection = 2;
  startAndWarn(e);
  step(e);
  const events = emittedEvents(e);
  const starts = events.filter(x => x.type === 'attack.start');
  const ends = events.filter(x => x.type === 'attack.interrupted' || x.type === 'attack.end');
  check(e.patternAttempt71 === 5 && e.patternAccepted71 === 2 && e.patternCreated71 === 2, 'partial case counts 5 attempts, 2 accepted, and 2 created');
  check(ctx.Ia.length === 2 && ctx.kp.records.length === 2, 'accepted count equals actual Ia projectile and dodge-record creation');
  check(starts.length === 1 && starts[0].detail.attempted === 5 && starts[0].detail.accepted === 2 && starts[0].detail.created === 2, 'one attack.start reports the actual partial emission counts');
  check(ends.length === 1 && ends[0].type === 'attack.end' && ends[0].detail.completed === true, 'partial acceptance completes when the existing scheduler completes normally');
  check(ends[0].detail.attempted === 5 && ends[0].detail.accepted === 2 && ends[0].detail.created === 2, 'attack end reports cumulative partial counts');
  check(events.filter(x => x.type === 'attack.interrupted').length === 0 && events.filter(x => x.type === 'recovery.start').length === 1, 'partial acceptance retains the existing normal recovery lifecycle');
  check(!FSM.drainEvents(e).length, 'partial acceptance leaves no pending or duplicate event');
}

// Full acceptance: five true vh returns create five actual projectiles, exactly one start and complete end.
{
  const e = makeBoss('fan');
  ctx.Ia.length = 0; ctx.kp.records.length = 0; ctx.vhCalls = 0; ctx.emissionsBeforeRejection = 5;
  startAndWarn(e);
  step(e);
  const events = emittedEvents(e);
  const starts = events.filter(x => x.type === 'attack.start');
  const ends = events.filter(x => x.type === 'attack.end');
  check(e.patternAttempt71 === 5 && e.patternAccepted71 === 5 && e.patternCreated71 === 5, 'full case counts 5 attempts / 5 accepted / 5 created');
  check(ctx.Ia.length === 5 && ctx.kp.records.length === 5, 'five accepted emissions create five projectiles and tracking records');
  check(starts.length === 1 && starts[0].detail.accepted === 5 && starts[0].detail.created === 5, 'full case emits exactly one start with five accepted/created');
  check(ends.length === 1 && ends[0].detail.completed === true && ends[0].detail.attempted === 5 && ends[0].detail.accepted === 5 && ends[0].detail.created === 5, 'full case reports one complete end with exact counts');
  check(events.filter(x => x.type === 'attack.interrupted').length === 0, 'full acceptance does not duplicate an interruption');
  check(events.filter(x => x.type === 'recovery.start').length === 1, 'full acceptance retains the existing single recovery signal');
  check(!FSM.drainEvents(e).length, 'full acceptance leaves no residual event');
}

// Zero actual attempts: a ring loses its safe corridor after the warning and is cancelled before any vh call.
{
  const e = makeBoss('ring');
  ctx.Ia.length = 0; ctx.vhCalls = 0; ctx.emissionsBeforeRejection = 18; ctx.corridor = true;
  startAndWarn(e);
  ctx.corridor = false;
  step(e);
  const events = emittedEvents(e);
  check(e.patternAttempt71 === 0 && e.patternAccepted71 === 0 && e.patternCreated71 === 0, 'corridor cancellation has 0 attempts / 0 accepted / 0 created');
  check(e.pattern71 === '' && e.patternCompleted71 === false && ctx.Ia.length === 0, 'cancelled ring does not execute or create projectiles');
  check(!events.some(x => ['attack.start', 'attack.end', 'attack.interrupted'].includes(x.type)), 'zero-attempt cancellation creates no attack event');
  check(!FSM.get(e).pattern && !FSM.drainEvents(e).length, 'cancellation clears B2 warning state and pending events');
  ctx.corridor = true;
}

// Recovery and restart: rejection does not poison later selection or a fresh encounter record.
{
  const e = makeBoss('fan');
  ctx.Ia.length = 0; ctx.vhCalls = 0; ctx.emissionsBeforeRejection = 0;
  startAndWarn(e); step(e); FSM.drainEvents(e);
  let ticks = 0;
  while (!e.pattern71 && ticks < 60) { step(e); ticks++; }
  check(!!e.pattern71 && e.patternAttempt71 === 0 && e.patternAccepted71 === 0 && e.patternCreated71 === 0, 'scheduler recovers after rejection and next wh() resets all emission counters');
  check(ticks <= 48, 'recovery occurs within the existing 2.3 s fan attack timer');
  const fresh = makeBoss('fan');
  ctx.Ia.length = 0; ctx.vhCalls = 0; ctx.emissionsBeforeRejection = 5;
  step(fresh);
  check(fresh.patternIndex71 === 1 && fresh.patternAttempt71 === 0 && fresh.patternAccepted71 === 0 && fresh.patternCreated71 === 0, 'fresh encounter has clean selector/emission state');
  check(FSM.get(fresh).state !== 'ATTACK' && !FSM.drainEvents(fresh).some(x => ['attack.start', 'attack.end', 'attack.interrupted'].includes(x.type)), 'restart has no stale attack signal');
}

// Source guardrails: the observer remains downstream of Th; attempted slots still drive pattern cadence.
check(thSource.includes('const emit=') && thSource.includes('vh(e,a,t,c)') && thSource.includes('patternAttempt71') && thSource.includes('patternAccepted71') && thSource.includes('patternCreated71'), 'real Th measures each vh result and actual Ia length delta');
check(thSource.includes('patternShot71+=3') && thSource.includes('patternShot71+=2') && thSource.includes('patternShot71=t.shots'), 'legacy pattern progress counters and authored cadence remain intact');
check(bridgeSource.includes('Sy.apply(this,arguments)') && bridgeSource.includes('Th-accepted-projectile-emission'), 'B2 remains an observer of the existing scheduler result');
check(bridgeSource.includes('accepted>0&&created===accepted') && bridgeSource.includes('patternCompleted71'), 'B2 completion requires normal schedule completion and at least one actually accepted/created projectile');
check(!bridgeSource.includes('patternShot71>=a.shots);s.notify(e,"attackEnd"'), 'projectile completion no longer uses scheduled slot count as proof of execution');

const report = {
  suite: 'B4.1 R1 actual source-coupled emission acceptance + B2 integration',
  status: 'PASS', assertions,
  source: 'vh(), wh(), Th(), and the actual Th B2 observer extracted verbatim from DEADBEAT_DISCO.ART.html; boss_animation_state_machine.js loaded directly.',
  scope: 'Acceptance/rejection geometry and projectile budget are controlled; all pattern data, scheduler cadence, vh() effects, FSM, and integration logic are actual source.',
  cases: ['5 rejected', '2/5 accepted', '5/5 accepted', '0-attempt corridor cancellation', 'recovery', 'fresh-encounter reset'],
  createdDefinition: 'patternCreated71 counts the real delta in Ia around vh(); current vh() returns true only after Ia.push and dodge tracking, so accepted===created for this implementation. Tests assert both independently.',
  gameplayFairnessValidated: false
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
