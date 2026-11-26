'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const FSM = require('../../boss_animation_state_machine.js');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'DEADBEAT_DISCO.ART.html'), 'utf8');

function boss(overrides = {}) {
  return Object.assign({
    resident: 'anden', final: false, finalStage: 0, hp: 100, x: 100, y: 100,
    phase: 'idle', entrance: 0, attackTimer: 0, hitFlash: 0, addsAlive: 0,
    exposedT: 0, berserk: false, pattern71: '', patternWarn71: 0,
    patternShot71: 0, sweep: null
  }, overrides);
}

let assertions = 0;
function check(value, message) { assert.ok(value, message); assertions++; }
function state(entity, dt = 0, context = {}) { return FSM.update(entity, dt, context).state; }

// A. Graph integrity and contract documentation.
check(FSM.validate().pass, 'state machine graph/profile validation');
check(FSM.STATES.length === 13, 'all 13 requested semantic states are present');
check(FSM.PRIORITY.DEATH > FSM.PRIORITY.PHASE_TRANSITION && FSM.PRIORITY.PHASE_TRANSITION > FSM.PRIORITY.STAGGER && FSM.PRIORITY.STAGGER > FSM.PRIORITY.DAMAGED && FSM.PRIORITY.DAMAGED > FSM.PRIORITY.ATTACK && FSM.PRIORITY.ATTACK > FSM.PRIORITY.WINDUP && FSM.PRIORITY.WINDUP > FSM.PRIORITY.TELEGRAPH, 'high-priority interrupt order');
check(FSM.TRANSITIONS.DEATH.length === 1 && FSM.TRANSITIONS.DEATH[0] === 'DEATH', 'death is terminal');

// B. Core attack lifecycle, using the scheduler's own warning and recovery durations.
{
  const e = boss({ phase: 'chase', pattern71: 'fan', patternWarn71: 0.8 });
  FSM.notify(e, 'telegraph', { pattern: 'fan', warn: 0.8 });
  check(state(e) === 'TELEGRAPH', 'IDLE/OBSERVING -> TELEGRAPH');
  e.patternWarn71 = 0.20;
  check(state(e) === 'WINDUP', 'TELEGRAPH -> WINDUP from profile fraction of actual warn remaining');
  FSM.notify(e, 'attackStart', { pattern: 'fan', poseDuration: 0.28 });
  e.patternWarn71 = 0;
  check(state(e) === 'ATTACK', 'WINDUP -> ATTACK only on scheduler emission event');
  e.pattern71 = ''; e.patternShot71 = 5;
  FSM.notify(e, 'attackEnd', { pattern: 'fan', completed: true, recover: 0.8 });
  check(state(e) === 'ATTACK', 'single-frame attack pose uses existing 0.28 second visual cue');
  state(e, 0.25);
  check(state(e, 0.04) === 'ATTACK_RECOVERY', 'ATTACK -> ATTACK_RECOVERY after emitted pose cue');
  check(state(e, 0.25) === 'ATTACK_RECOVERY' && state(e, 0.25) === 'ATTACK_RECOVERY' && state(e, 0.02) === 'OBSERVING', 'ATTACK_RECOVERY -> OBSERVING when Ao.recover expires');
}

// C. Interruptions and phase/damage priority.
{
  const e = boss({ phase: 'chase' });
  FSM.notify(e, 'telegraph', { pattern: 'ring', warn: 1.05 });
  check(state(e) === 'TELEGRAPH', 'damage test enters telegraph');
  FSM.notify(e, 'damage', { duration: 0.12, source: 'bossHit' }); e.hitFlash = 0.12;
  check(state(e) === 'DAMAGED', 'damage interrupts telegraph visually');
  e.hitFlash = 0;
  check(state(e, 0.13) === 'TELEGRAPH', 'damage state releases to the still-running scheduler warning without cancelling its timer');
}
{
  const e = boss({ phase: 'berserk' });
  FSM.notify(e, 'telegraph', { pattern: 'spiral', warn: 1.1 });
  e.pattern71 = 'spiral'; e.patternWarn71 = 0.1;
  check(state(e) === 'WINDUP', 'stagger test enters windup');
  FSM.notify(e, 'attackStart', { pattern: 'spiral', poseDuration: 0.28 });
  check(state(e) === 'ATTACK', 'stagger test enters attack');
  FSM.notify(e, 'stagger', { duration: 0.2, source: 'host-test' });
  check(state(e) === 'STAGGER', 'explicit stagger interrupts attack animation');
  check(state(e, 0.21) === 'ATTACK', 'stagger release resumes the still-active scheduler attack without cancelling it');
}
{
  const e = boss({ final: true, resident: 'nucleo', finalStage: 1 });
  FSM.notify(e, 'phase', { phase: 'nucleo-stage-2', duration: 0.28 });
  check(state(e) === 'PHASE_TRANSITION', 'phase transition state');
  e.finalStage = 2;
  FSM.notify(e, 'damage', { duration: 0.12 }); e.hitFlash = 0.12;
  check(state(e) === 'PHASE_TRANSITION', 'phase transition remains above damage in the accepted priority order');
  e.hp = 0; FSM.notify(e, 'death', { source: 'test' });
  check(state(e) === 'DEATH', 'death interrupts every transient state');
  FSM.notify(e, 'phase', { phase: 'late-event', duration: 1 });
  check(state(e) === 'DEATH', 'death cannot be interrupted or revived');
}

// D. Live signals: sweep timing, defense, enrage, movement and player context.
{
  const e = boss({ phase: 'sweep', sweep: { t: 0.1, warn: 0.9, fire: 1.4 } });
  check(state(e) === 'TELEGRAPH', 'sweep uses its real warning window');
  e.sweep.t = 1.0;
  check(state(e) === 'ATTACK', 'sweep attack state begins only at the existing fire window');
  e.sweep.t = 2.4;
  state(e, 0.25);
  check(state(e, 0.04) === 'ATTACK_RECOVERY', 'sweep recovery uses the existing 0.3 second tail');
}
{
  const e = boss({ phase: 'chase', addsAlive: 2 });
  check(state(e) === 'DEFENDING', 'defense state reflects existing addsAlive condition only');
  e.addsAlive = 0; e.berserk = true;
  check(state(e) === 'ENRAGED', 'existing berserk flag drives ENRAGED');
}
{
  const e = boss({ phase: 'chase', x: 10, y: 20 });
  state(e);
  e.x = 18; e.y = 24;
  const out = FSM.update(e, 0.1, { player: { x: 120, y: 80 } });
  check(out.state === 'MOVING' && out.distance > 0 && Number.isFinite(out.targetAngle), 'movement, player distance and direction context');
}

// D2. A real phase cancellation drops the scheduler sweep reference, retains the
// B2 phase-transition cue, emits one interruption, then returns to ENRAGED.
{
  const e = boss({ phase: 'sweep', sweep: { t: 0.1, warn: 0.9, fire: 1.4 } });
  check(state(e) === 'TELEGRAPH', 'phase-cancel fixture begins in the existing sweep warning');
  FSM.notify(e, 'phase', { phase: 'berserk', duration: 0.28 });
  e.phase = 'berserk'; e.sweep = null;
  check(state(e) === 'PHASE_TRANSITION', 'phase transition interrupts the sweep warning without changing FSM priorities');
  state(e, 0.25); // FSM update delta is capped at 0.25 s.
  check(state(e, 0.04) === 'ENRAGED', 'cleared sweep cannot resurrect TELEGRAPH after the phase cue expires');
  check(FSM.drainEvents(e).some(event => event.type === 'attack.interrupted' && event.detail.reason === 'phase-transition'), 'phase cancellation records the existing interruption event');
}

// E. Existing combat-art pulse remains compatible but never masks a live warning.
{
  const e = boss({ phase: 'chase', pattern71: 'fan', patternWarn71: 0.8, _ddaAttackT: 0.28 });
  FSM.notify(e, 'telegraph', { pattern: 'fan', warn: 0.8 });
  check(state(e) === 'TELEGRAPH', 'legacy 0.28 cue cannot overwrite the actual warning state');
  FSM.reset(e); e.pattern71 = ''; e.patternWarn71 = 0; e._ddaAttackT = 0.5;
  check(state(e) === 'ATTACK', 'existing renderer attack pulse maps to ATTACK');
  e._ddaAttackT = 0;
  check(state(e) === 'OBSERVING', 'cleared legacy pulse does not leave a locked attack state');
}

// F. Robustness, identity coverage, unknown events and cleanup.
{
  const ids = ['anden','magneta','bufe','cajero','pogo','oficiante','matarife','imitador','traidor','nucleo'];
  check(ids.every(id => FSM.PROFILES[id]), 'nine resident profiles plus separate Núcleo profile');
  check(Object.values(FSM.PROFILES).every(p => p.dedicatedClips.length === 0), 'no nonexistent clips invented');
  check(Object.values(FSM.PROFILES).every(p => Object.keys(p.animationMap).length === 13 && Object.values(p.animationMap).every(v => ['idle','attack','hit','death'].includes(v))), 'each combat identity has an explicit per-state renderer fallback map');
  check(FSM.get(boss({ resident: undefined, artId: 'boss_05_fusioncosmica' })).renderState === 'idle', 'stable artId without combat resident falls back generically without identity inference');
  check(FSM.RENDER_STATE.TELEGRAPH === 'attack' && FSM.RENDER_STATE.DAMAGED === 'hit' && FSM.RENDER_STATE.DEATH === 'death', 'semantic states fall back only to existing renderer states');
  const e = boss({ pattern71: 'pattern-that-does-not-exist', patternWarn71: 0 });
  FSM.notify(e, 'unrecognized-event', { value: 'test' });
  check(FSM.STATES.includes(state(e)) && FSM.resolveState('FUTURE_STATE') === 'IDLE', 'unknown event/state input falls back safely and does not lock the machine');
  const before = FSM.get(e).state;
  check(FSM.reset(e) && FSM.get(e).state !== 'DEATH', 'encounter reset discards per-entity state');
  FSM.clear();
  check(FSM.validate().pass && before !== undefined, 'global reference cleanup and validation remain available');
}

// F. Source-coupled integration guardrails: one existing controller, live events, no combat rewrites.
check(html.includes('<script src="boss_animation_state_machine.js"></script>'), 'shared FSM runtime is loaded before the embedded controller');
check(html.includes('window.DMO_BOSS_ANIMATION_FSM.update(sr,a,{patterns:Ao,player:{x:ye.x,y:ye.y}})'), 'FSM ticks from the existing combat-art tick with Ao/player context');
check(html.includes('bossAnimation:f.bossAnimation') && html.includes('animationMachine:window.DMO_BOSS_ANIMATION_FSM&&window.DMO_BOSS_ANIMATION_FSM.describe'), 'semantic state is exposed through the existing shared API');
check(html.includes('Th-projectile-or-hazard-emission') && html.includes('existing-scheduler-cancel'), 'attack start and cancellation events are tied to existing Th execution');
check(html.includes('source:"lu.applyBoss"') && html.includes('existing-boss-death-queue'), 'damage and death hooks use existing combat lifecycle');
check(html.includes('bossZoneOwner72:e'), 'B1 zones.max ownership code is retained');
check(html.includes('sr.phase="volley",sr.phaseTimer=2.4,sr.pattern71="",sr.patternWarn71=0,sr.sweep=null,sr.attackTimer=1'), 'real non-final volley branch clears a cancelled sweep reference');
check(html.includes('sr.phase="berserk",sr.phaseTimer=0,sr.pattern71="",sr.patternWarn71=0,sr.sweep=null,sr.attackTimer=1'), 'real non-final berserk branch clears a cancelled sweep reference');
check(!html.includes('DMO_BOSS_ANIMATION_FSM.update(sr,a)&&'), 'no second animation update loop');

// G. B4.1-R1: the B2 observer consumes accepted/created emission counts, never scheduler slots.
{
  const e = boss({ phase: 'ranged', pattern71: 'fan', patternWarn71: 0,
    patternEmissionKind71: 'projectile', patternAttempt71: 0, patternAccepted71: 0, patternCreated71: 0 });
  FSM.notify(e, 'telegraph', { pattern: 'fan', warn: 0.8 });
  state(e);
  e.patternAttempt71 = 5; e.patternAccepted71 = 2; e.patternCreated71 = 2;
  FSM.notify(e, 'attackStart', { pattern: 'fan', source: 'Th-accepted-projectile-emission',
    attempted: 5, accepted: 2, created: 2 });
  FSM.notify(e, 'attackEnd', { pattern: 'fan', completed: true, recover: 0.8,
    attempted: 5, accepted: 2, created: 2 });
  e.pattern71 = ''; // The real scheduler clears it in the same completion tick.
  state(e);
  const events = FSM.drainEvents(e);
  const start = events.find(event => event.type === 'attack.start');
  const end = events.find(event => event.type === 'attack.end');
  check(!!start && start.detail.attempted === 5 && start.detail.accepted === 2 && start.detail.created === 2,
    'B2 attack.start carries exact partial attempted/accepted/created values');
  check(!!end && end.detail.completed === true && end.detail.attempted === 5 && end.detail.accepted === 2 && end.detail.created === 2,
    'B2 partial-emission attack completes with scheduler and preserves accepted counts');
  check(!events.some(event => event.type === 'attack.interrupted')
      && events.filter(event => event.type === 'recovery.start').length === 1,
    'partial acceptance preserves the existing normal recovery lifecycle');
  check(events.filter(event => event.type === 'attack.start').length === 1 && !FSM.drainEvents(e).length,
    `one accepted-emission lifecycle creates one start and no duplicate pending event; events=${JSON.stringify(events)}`);
}
{
  const e = boss({ phase: 'ranged', pattern71: 'fan', patternWarn71: 0, patternShot71: 5,
    patternEmissionKind71: 'projectile', patternAttempt71: 5, patternAccepted71: 0, patternCreated71: 0 });
  const rejected = state(e);
  check(rejected !== 'ATTACK' && !FSM.drainEvents(e).some(event => event.type === 'attack.start'),
    'five scheduled slots with zero accepted projectiles do not start B2 ATTACK');
  e.patternAccepted71 = 2; e.patternCreated71 = 2;
  const accepted = state(e, 0.01);
  const events = FSM.drainEvents(e);
  check(accepted === 'ATTACK' && events.filter(event => event.type === 'attack.start').length === 1
      && events.some(event => event.type === 'attack.start' && event.detail.attempted === 5 && event.detail.accepted === 2),
    'observed-emission fallback starts only when accepted count becomes positive and reports that count');
}
{
  const e = boss({ phase: 'ranged', pattern71: 'fan', patternWarn71: 0,
    patternEmissionKind71: 'projectile', patternAttempt71: 0, patternAccepted71: 0, patternCreated71: 0 });
  FSM.notify(e, 'telegraph', { pattern: 'fan', warn: 0.8 }); state(e);
  FSM.notify(e, 'attackEnd', { pattern: 'fan', completed: false, reason: 'no-emission-attempts',
    attempted: 0, accepted: 0, created: 0 });
  e.pattern71 = '';
  const settled = state(e, 0.01), events = FSM.drainEvents(e);
  check(settled !== 'ATTACK' && settled !== 'ATTACK_RECOVERY' && !FSM.get(e).pattern,
    'zero-attempt cancellation clears telegraph state without a false attack');
  check(!events.some(event => ['attack.start', 'attack.end', 'attack.interrupted', 'recovery.start'].includes(event.type)),
    'zero-attempt cancellation drains without false attack or recovery events');
  FSM.reset(e);
  const restarted = FSM.get(e), restartEvents = FSM.drainEvents(e);
  check(!restarted.pattern && !restartEvents.some(event => ['attack.start', 'attack.end', 'attack.interrupted', 'recovery.start'].includes(event.type)),
    'encounter reset clears the B2 record without residual emission/cancellation signals');
}

const report = {
  suite: 'B2 shared boss animation state machine',
  version: FSM.version,
  status: 'PASS',
  assertions,
  stateCount: FSM.STATES.length,
  profileIds: Object.keys(FSM.PROFILES),
  deterministicOnly: true,
  gameplayFairnessValidated: false,
  note: 'Source-coupled/deterministic tests do not establish gameplay fairness or real-player readability.'
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
