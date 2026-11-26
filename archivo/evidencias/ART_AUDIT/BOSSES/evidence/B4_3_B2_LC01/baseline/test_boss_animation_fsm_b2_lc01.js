'use strict';

const assert = require('node:assert/strict');
const FSM = require('./boss_animation_state_machine.js');

const STEP = 0.05;
const fixtures = [
  { resident: 'pogo', previousPattern: 'fan', previousRecover: 0.8, delayToSweepWarn: 0, nextPattern: 'fan' },
  { resident: 'matarife', previousPattern: 'burst', previousRecover: 0.95, delayToSweepWarn: 0, nextPattern: 'fan' },
  { resident: 'traidor', previousPattern: 'burst', previousRecover: 0.95, delayToSweepWarn: 0.45, nextPattern: 'burst' },
  { resident: 'nucleo', previousPattern: 'ring', previousRecover: 1.05, delayToSweepWarn: 0.05, nextPattern: 'burst' }
];

let assertions = 0;
const failures = [];
function verify(value, label) {
  assertions++;
  if (!value) failures.push(label);
}
function makeBoss(resident) {
  return {
    resident, final: resident === 'nucleo', finalStage: resident === 'nucleo' ? 1 : 0,
    hp: 100, x: 100, y: 100, phase: 'idle', entrance: 0, attackTimer: 0,
    hitFlash: 0, addsAlive: 0, exposedT: 0, berserk: false,
    pattern71: '', patternWarn71: 0, patternShot71: 0, sweep: null
  };
}
function sample(entity, events, dt = 0) {
  const snapshot = FSM.update(entity, dt);
  events.push(...FSM.drainEvents(entity));
  return snapshot;
}
function completePattern(entity, events, pattern, recovery) {
  FSM.notify(entity, 'telegraph', { pattern, warn: 0.8 });
  const telegraph = sample(entity, events).state;
  FSM.notify(entity, 'attackStart', { pattern, poseDuration: 0 });
  const attack = sample(entity, events).state;
  FSM.notify(entity, 'attackEnd', { pattern, completed: true, recover: recovery });
  const recoveryState = sample(entity, events).state;
  return { telegraph, attack, recoveryState };
}
function ticks(entity, events, count) {
  for (let i = 0; i < count; i++) sample(entity, events, STEP);
}
function eventList(events, type, pattern) {
  return events.filter(event => event.type === type && event.detail.pattern === pattern);
}

const profileResults = [];
for (const fixture of fixtures) {
  const { resident, previousPattern, previousRecover, delayToSweepWarn, nextPattern } = fixture;
  const entity = makeBoss(resident);
  const events = [];
  const initial = FSM.get(entity);
  verify(initial.state === 'IDLE' && initial.profile === resident, `${resident}: correct fresh profile/state`);
  entity.phase = 'ranged';

  const prior = completePattern(entity, events, previousPattern, previousRecover);
  verify(prior.telegraph === 'TELEGRAPH' && prior.attack === 'ATTACK' && prior.recoveryState === 'ATTACK_RECOVERY',
    `${resident}: preceding ${previousPattern} traverses warning, attack, recovery`);
  for (let i = 0; i < Math.round(delayToSweepWarn / STEP); i++) sample(entity, events, STEP);

  entity.phase = 'sweep';
  entity.sweep = { a0: 0, dir: 1, arc: 2.4, t: 0, warn: 0.9, fire: 1.4, hitP: false };
  const sweepStates = new Set([sample(entity, events).state]);
  let guard = 0;
  while (entity.sweep.t <= 2.3 + 1e-9) {
    sweepStates.add(sample(entity, events, STEP).state);
    entity.sweep.t = Number((entity.sweep.t + STEP).toFixed(2));
    if (++guard > 55) throw new Error(`${resident}: sweep fire-window driver exceeded its deterministic bound`);
  }
  const sweepStartState = FSM.get(entity).state;
  let tailGuard = 0;
  while (entity.sweep.t < 2.6 - 1e-9) {
    sweepStates.add(sample(entity, events, STEP).state);
    entity.sweep.t = Number((entity.sweep.t + STEP).toFixed(2));
    if (++tailGuard > 12) throw new Error(`${resident}: sweep-tail driver exceeded its deterministic bound`);
  }
  entity.sweep = null;
  entity.phase = 'chase';
  const sweepTerminalState = sample(entity, events, STEP).state;
  sweepStates.add(sweepTerminalState);
  const previousStarts = eventList(events, 'recovery.start', previousPattern);
  const previousEnds = eventList(events, 'recovery.end', previousPattern);
  const sweepAttacks = events.filter(event => ['attack.start', 'attack.end', 'attack.interrupted'].includes(event.type)
    && event.detail.pattern === 'sweep');
  const sweepRecoveryStarts = eventList(events, 'recovery.start', 'sweep');
  const sweepRecoveryEnds = eventList(events, 'recovery.end', 'sweep');
  verify(previousStarts.length === 1, `${resident}: one ${previousPattern} recovery.start`);
  verify(previousEnds.length === 1 && previousEnds[0].detail.startSeq === previousStarts[0]?.seq,
    `${resident}: preceding ${previousPattern} recovery.end retains its start event identity`);
  verify(sweepStates.has('TELEGRAPH') && sweepStates.has('ATTACK') && sweepStates.has('ATTACK_RECOVERY'),
    `${resident}: phase.sweep traverses TELEGRAPH -> ATTACK -> ATTACK_RECOVERY`);
  verify(sweepAttacks.filter(event => event.type === 'attack.start').length === 1
      && sweepAttacks.filter(event => event.type === 'attack.end').length === 1
      && !sweepAttacks.some(event => event.type === 'attack.interrupted'),
    `${resident}: one normal phase.sweep attack start/end, no duplicate/interruption`);
  verify(sweepStartState === 'ATTACK_RECOVERY' && sweepRecoveryStarts.length === 1
      && Math.abs(sweepRecoveryStarts[0].detail.duration - 0.3) < 1e-9,
    `${resident}: completed sweep emits exactly one 0.3s recovery.start on ATTACK_RECOVERY entry`);
  verify(sweepRecoveryEnds.length === 1 && sweepRecoveryEnds[0].detail.startSeq === sweepRecoveryStarts[0]?.seq,
    `${resident}: phase.sweep recovery.end points to the same recovery.start event`);
  verify(sweepTerminalState !== 'ATTACK_RECOVERY' && events.filter(event => event.type === 'recovery.start').length === 2
      && events.filter(event => event.type === 'recovery.end').length === 2,
    `${resident}: predecessor and sweep each have one completed, non-duplicated recovery cycle`);

  const nextEventOffset = events.length;
  const next = completePattern(entity, events, nextPattern, 0.4);
  const nextEvents = events.slice(nextEventOffset);
  const nextStart = eventList(nextEvents, 'recovery.start', nextPattern);
  ticks(entity, events, 9);
  const nextEnd = eventList(events.slice(nextEventOffset), 'recovery.end', nextPattern);
  verify(next.telegraph === 'TELEGRAPH' && next.attack === 'ATTACK' && next.recoveryState === 'ATTACK_RECOVERY'
      && nextStart.length === 1 && nextEnd.length === 1 && nextEnd[0].detail.startSeq === nextStart[0].seq
      && nextStart[0].seq !== previousStarts[0].seq,
    `${resident}: consecutive ${nextPattern} cycle has its own paired recovery identity, including repeated pattern labels`);

  entity.phase = 'sweep';
  entity.sweep = { a0: 0, dir: -1, arc: 2.4, t: 0.1, warn: 0.9, fire: 1.4, hitP: false };
  const cancelOffset = events.length;
  const cancelStart = sample(entity, events).state;
  entity.sweep.t = 0.15;
  sample(entity, events);
  FSM.notify(entity, 'phase', { phase: 'volley', duration: 0.28 });
  entity.sweep = null;
  entity.phase = 'volley';
  const cancelEnd = sample(entity, events, STEP).state;
  const cancellationEvents = events.slice(cancelOffset);
  verify(cancelStart === 'TELEGRAPH' && cancelEnd === 'PHASE_TRANSITION'
      && !cancellationEvents.some(event => ['recovery.start', 'recovery.end'].includes(event.type)),
    `${resident}: pre-fire phase cancellation creates no false recovery events or residual sweep`);
  const cancelledSettleOffset = events.length;
  sample(entity, events, 0.3);
  verify(!FSM.get(entity).pattern && !events.slice(cancelledSettleOffset).some(event => ['recovery.start', 'recovery.end'].includes(event.type)),
    `${resident}: cancellation settles without stale recovery identity/events`);

  entity.phase = 'sweep';
  entity.sweep = { a0: 0, dir: 1, arc: 2.4, t: 1.0, warn: 0.9, fire: 1.4, hitP: false };
  const interruptOffset = events.length;
  const activeSweep = sample(entity, events).state;
  FSM.notify(entity, 'phase', { phase: 'berserk', duration: 0.28 });
  entity.sweep = null;
  entity.phase = 'berserk';
  const interruptedState = sample(entity, events, STEP).state;
  const interruptionEvents = events.slice(interruptOffset);
  verify(activeSweep === 'ATTACK' && interruptedState === 'PHASE_TRANSITION'
      && interruptionEvents.filter(event => event.type === 'attack.interrupted' && event.detail.reason === 'phase-transition').length === 1,
    `${resident}: mid-fire phase transition records exactly one existing attack.interrupted`);
  verify(!interruptionEvents.some(event => ['attack.end', 'recovery.start', 'recovery.end'].includes(event.type)),
    `${resident}: interrupted sweep has no false completion/recovery events`);
  const interruptedSettleOffset = events.length;
  sample(entity, events, 0.3);
  verify(!FSM.get(entity).pattern && !events.slice(interruptedSettleOffset).some(event => ['recovery.start', 'recovery.end'].includes(event.type)),
    `${resident}: interruption settles without stale recovery identity/events`);
  entity.phase = 'idle';
  verify(FSM.reset(entity) && FSM.get(entity).state === 'IDLE' && FSM.drainEvents(entity).length === 0,
    `${resident}: encounter reset discards all lifecycle state and queued events`);

  profileResults.push({
    resident, attackId: 'phase.sweep', runtimePatternLabel: 'sweep', previousPattern, nextPattern,
    initialState: initial.state,
    previousRecovery: { startSeq: previousStarts[0]?.seq, endPattern: previousEnds[0]?.detail.pattern, endStartSeq: previousEnds[0]?.detail.startSeq },
    sweep: {
      attackStarts: sweepAttacks.filter(event => event.type === 'attack.start').length,
      attackEnds: sweepAttacks.filter(event => event.type === 'attack.end').length,
      recoveryStarts: sweepRecoveryStarts.map(event => ({ seq: event.seq, pattern: event.detail.pattern, duration: event.detail.duration })),
      recoveryEnds: sweepRecoveryEnds.map(event => ({ pattern: event.detail.pattern, startSeq: event.detail.startSeq })),
      states: [...sweepStates], finalState: sweepTerminalState
    },
    consecutivePattern: nextPattern,
    consecutiveRecovery: { startSeq: nextStart[0]?.seq, endPattern: nextEnd[0]?.detail.pattern, endStartSeq: nextEnd[0]?.detail.startSeq },
    cancellation: 'pre-fire cancellation and mid-fire interruption; no recovery events',
    reset: 'clean'
  });
}

assert.deepEqual(failures, [], `B2-LC-01 regression failures (${failures.length}):\n- ${failures.join('\n- ')}`);
const report = {
  suite: 'B2-LC-01 deterministic sweep recovery event integrity',
  status: 'PASS', assertions, profileCount: profileResults.length,
  profiles: profileResults,
  deterministicOnly: true,
  combatTimingOrBehaviorChanged: false,
  note: 'Directly drives the existing B2 observer with scheduler-shaped sweep snapshots; it is not a natural-gameplay or human-playtest claim.'
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
