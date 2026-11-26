/* DEADBEAT DISCO shared boss animation-state controller.
 * Visual-only: consumes the combat controller's existing signals and never
 * starts, cancels, delays, or modifies an attack, projectile, hitbox, or timer.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DMO_BOSS_ANIMATION_FSM = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STATES = Object.freeze([
    'IDLE', 'OBSERVING', 'MOVING', 'TELEGRAPH', 'WINDUP', 'ATTACK',
    'ATTACK_RECOVERY', 'DEFENDING', 'DAMAGED', 'STAGGER',
    'PHASE_TRANSITION', 'ENRAGED', 'DEATH'
  ]);

  // Higher numbers may visually preempt lower numbers. This does not interrupt
  // the combat scheduler; it only selects which existing visual fallback plays.
  const PRIORITY = Object.freeze({
    IDLE: 0, OBSERVING: 10, MOVING: 20, ENRAGED: 25, DEFENDING: 30,
    ATTACK_RECOVERY: 35, TELEGRAPH: 40, WINDUP: 50, ATTACK: 60,
    DAMAGED: 70, STAGGER: 80, PHASE_TRANSITION: 90, DEATH: 100
  });

  const RENDER_STATE = Object.freeze({
    IDLE: 'idle', OBSERVING: 'idle', MOVING: 'idle',
    TELEGRAPH: 'attack', WINDUP: 'attack', ATTACK: 'attack',
    ATTACK_RECOVERY: 'idle', DEFENDING: 'idle', DAMAGED: 'hit',
    STAGGER: 'hit', PHASE_TRANSITION: 'attack', ENRAGED: 'attack',
    DEATH: 'death'
  });

  const interruptible = state => state !== 'DEATH';
  const stateDef = (id, entry, exit, duration, animation, events) => Object.freeze({
    id, entry, exit, duration, priority: PRIORITY[id], interruptible: interruptible(id),
    animation, events: Object.freeze(events)
  });

  const DEFINITIONS = Object.freeze({
    IDLE: stateDef('IDLE', 'No active combat cue and no boss movement.', 'Combat/phase/damage/death signal, or encounter becomes active.', 'Until a higher-priority signal or encounter end.', 'Existing idle atlas cycle; no new clip.', ['state.enter', 'state.exit']),
    OBSERVING: stateDef('OBSERVING', 'Encounter active; waiting for movement or the current attack scheduler.', 'Movement, attack telegraph, defense, damage, phase change, or death.', 'Until an observed combat signal changes.', 'Existing idle atlas cycle; cue metadata may include player distance/direction.', ['state.enter', 'state.exit']),
    MOVING: stateDef('MOVING', 'Boss position changes beyond the sample threshold.', 'Movement stops or a higher-priority combat cue arrives.', 'While observed displacement continues.', 'Existing idle atlas cycle with a small non-authoritative lean; no locomotion clip.', ['state.enter', 'state.exit']),
    TELEGRAPH: stateDef('TELEGRAPH', 'Existing attack warning is active.', 'Warning reaches the profile-specific windup portion, attack starts, or scheduler cancels it.', 'The exact per-pattern Ao.warn / sweep.warn window.', 'Existing attack-cycle fallback plus existing warning UI.', ['telegraph.start', 'state.enter', 'state.exit']),
    WINDUP: stateDef('WINDUP', 'The attack warning enters its final profile-specific fraction.', 'Attack emits, is interrupted/cancelled, or a higher-priority event arrives.', 'Remainder of the existing attack warning; never adds combat time.', 'Existing attack-cycle fallback with a procedural anticipation pose.', ['windup.start', 'state.enter', 'state.exit']),
    ATTACK: stateDef('ATTACK', 'Existing Th() emits the selected pattern, or a sweep is in its active fire interval.', 'The pattern/sweep ends, is explicitly interrupted, or a higher-priority event arrives.', 'Exactly the scheduler activity; single-frame emissions retain only the existing 0.28 s visual cue.', 'Existing attack atlas/HD dispatch fallback; this state never creates damage.', ['attack.start', 'attack.end', 'attack.interrupted', 'state.enter', 'state.exit']),
    ATTACK_RECOVERY: stateDef('ATTACK_RECOVERY', 'Existing attack execution completed.', 'Ao[pattern].recover / sweep tail expires, or a higher-priority event arrives.', 'Per-pattern Ao.recover; sweep uses its existing 0.3 s tail.', 'Existing idle fallback with procedural recovery pose.', ['recovery.start', 'recovery.end', 'state.enter', 'state.exit']),
    DEFENDING: stateDef('DEFENDING', 'Adds currently provide the existing boss damage-reduction condition and boss is not exposed/attacking.', 'Adds are gone, vulnerability begins, or another cue arrives.', 'Derived from existing addsAlive/exposedT values.', 'Existing idle fallback; no new defense mechanic or hitbox.', ['state.enter', 'state.exit']),
    DAMAGED: stateDef('DAMAGED', 'Existing bossHit/hitFlash signal.', 'Existing hitFlash expires or a higher-priority event arrives.', 'Existing hitFlash duration; no added stun.', 'Existing hit frame/procedural recoil fallback.', ['damage', 'state.enter', 'state.exit']),
    STAGGER: stateDef('STAGGER', 'An explicit _ddaStaggerT signal, if a future/host controller provides one.', 'That explicit signal expires or a higher-priority event arrives.', 'Host-provided duration; no stagger mechanic is added by B2.', 'Existing hit fallback; no invented clip.', ['stagger', 'state.enter', 'state.exit']),
    PHASE_TRANSITION: stateDef('PHASE_TRANSITION', 'Existing finalStage or combat phase changes; reuses the controller cue window.', 'Existing visual cue expires or death arrives.', 'Existing 0.28 s combat-art cue (not a gameplay lockout).', 'Existing attack fallback and procedural transition pose.', ['phase.change', 'state.enter', 'state.exit']),
    ENRAGED: stateDef('ENRAGED', 'Existing berserk flag/phase or Núcleo stage 3.', 'Enrage ends, an attack/defense/damage/phase signal arrives, or death.', 'Derived from existing combat phase.', 'Existing attack-cycle fallback with a restrained procedural pulse.', ['state.enter', 'state.exit']),
    DEATH: stateDef('DEATH', 'Existing death flag / non-positive boss HP / death event.', 'Terminal for this entity; encounter reset creates a fresh record.', 'Existing boss death renderer lifetime.', 'Existing death fallback; no new clip.', ['death', 'state.enter'])
  });

  // Explicit legal graph. High-priority interrupts are legal only from listed
  // edges; DEATH is terminal. Recovery to a lower-priority state occurs only
  // when its existing timer/signal has completed.
  const ALL = STATES;
  const TRANSITIONS = Object.freeze({
    IDLE: ALL,
    OBSERVING: ALL,
    MOVING: ALL,
    TELEGRAPH: Object.freeze(['TELEGRAPH', 'WINDUP', 'ATTACK', 'ATTACK_RECOVERY', 'OBSERVING', 'MOVING', 'DEFENDING', 'ENRAGED', 'DAMAGED', 'STAGGER', 'PHASE_TRANSITION', 'DEATH']),
    WINDUP: Object.freeze(['WINDUP', 'ATTACK', 'ATTACK_RECOVERY', 'TELEGRAPH', 'OBSERVING', 'MOVING', 'DEFENDING', 'ENRAGED', 'DAMAGED', 'STAGGER', 'PHASE_TRANSITION', 'DEATH']),
    ATTACK: Object.freeze(['ATTACK', 'ATTACK_RECOVERY', 'TELEGRAPH', 'WINDUP', 'OBSERVING', 'MOVING', 'DEFENDING', 'ENRAGED', 'DAMAGED', 'STAGGER', 'PHASE_TRANSITION', 'DEATH']),
    ATTACK_RECOVERY: Object.freeze(['ATTACK_RECOVERY', 'TELEGRAPH', 'WINDUP', 'ATTACK', 'OBSERVING', 'MOVING', 'DEFENDING', 'ENRAGED', 'DAMAGED', 'STAGGER', 'PHASE_TRANSITION', 'DEATH']),
    DEFENDING: ALL,
    DAMAGED: ALL,
    STAGGER: ALL,
    PHASE_TRANSITION: Object.freeze(['PHASE_TRANSITION', 'TELEGRAPH', 'WINDUP', 'ATTACK', 'ATTACK_RECOVERY', 'OBSERVING', 'MOVING', 'DEFENDING', 'ENRAGED', 'DAMAGED', 'STAGGER', 'DEATH']),
    ENRAGED: ALL,
    DEATH: Object.freeze(['DEATH'])
  });

  // Keys are combat resident IDs, not atlas names or guessed artId mappings.
  // All profiles inherit actual warning/recovery values from the selected Ao
  // pattern. Fractions only split that existing warning into visual phases.
  const PROFILE_DATA = {
    anden:     { kind: 'hunter',  windupFraction: 0.30 },
    magneta:   { kind: 'hunter',  windupFraction: 0.30 },
    bufe:      { kind: 'pulse',   windupFraction: 0.36 },
    cajero:    { kind: 'hunter',  windupFraction: 0.30 },
    pogo:      { kind: 'sweeper', windupFraction: 0.28 },
    oficiante: { kind: 'pulse',   windupFraction: 0.36 },
    matarife:  { kind: 'sweeper', windupFraction: 0.28 },
    imitador:  { kind: 'hunter',  windupFraction: 0.30 },
    traidor:   { kind: 'sweeper', windupFraction: 0.28 },
    nucleo:    { kind: 'final',   windupFraction: 0.40 }
  };
  const PROFILES = Object.freeze(Object.fromEntries(Object.entries(PROFILE_DATA).map(([resident, profile]) => [resident, Object.freeze({
    resident, kind: profile.kind, windupFraction: profile.windupFraction,
    animationMap: Object.freeze(Object.assign({}, RENDER_STATE)),
    // No dedicated telegraph/windup/move/recovery/phase clips are registered.
    dedicatedClips: Object.freeze([]), fallback: 'existing-controller'
  })])));

  const GENERIC_PROFILE = Object.freeze({ resident: null, kind: 'generic', windupFraction: 0.30, animationMap: Object.freeze(Object.assign({}, RENDER_STATE)), dedicatedClips: Object.freeze([]), fallback: 'existing-controller' });
  let records = new WeakMap();
  let sequence = 0;
  const metrics = { updates: 0, transitions: 0, emittedEvents: 0, unknownStates: 0, profileFallbacks: 0 };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const finite = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
  const emissionCounts = detail => {
    const counts = {};
    for (const key of ['attempted', 'accepted', 'created']) {
      if (Number.isFinite(Number(detail && detail[key]))) counts[key] = Math.max(0, Math.floor(Number(detail[key])));
    }
    return counts;
  };

  function profileFor(entity) {
    if (!entity || typeof entity !== 'object') return GENERIC_PROFILE;
    const id = entity.final || entity.finalStage > 0 || entity.resident === 'nucleo' ? 'nucleo' : entity.resident;
    return PROFILES[id] || GENERIC_PROFILE;
  }

  function pushEvent(rec, type, detail = {}) {
    const event = { seq: ++sequence, t: +rec.totalTime.toFixed(4), type, state: rec.state, detail: Object.assign({}, detail) };
    rec.events.push(event);
    if (rec.events.length > 32) rec.events.shift();
    metrics.emittedEvents++;
    return event;
  }

  function beginRecovery(rec, pattern, duration) {
    rec.recoveryPattern = String(pattern || '') || null;
    const event = pushEvent(rec, 'recovery.start', { pattern: rec.recoveryPattern, duration });
    rec.recoveryStartSeq = event.seq;
  }

  function clearRecoveryIdentity(rec) {
    rec.recoveryPattern = null;
    rec.recoveryStartSeq = null;
  }

  function makeRecord(entity) {
    return {
      state: 'IDLE', previous: null, stateTime: 0, totalTime: 0,
      profile: profileFor(entity), pattern: '', patternWarn: 0, warningTotal: 0,
      attackActive: false, attackPulse: 0, lastExternalAttackPulse: 0, recovery: 0, recoveryTotal: 0,
      recoveryPattern: null, recoveryStartSeq: null, damage: 0, stagger: 0,
      phase: 0, phaseKey: '', death: false, x: finite(entity.x), y: finite(entity.y),
      dx: 0, dy: 0, speed: 0, distance: null, targetAngle: null,
      vulnerability: false, interrupted: false, events: [], pending: [],
      renderState: 'idle', frame: 0, lastKnownState: 'IDLE'
    };
  }

  function resolveState(candidate) {
    if (STATES.includes(candidate)) return candidate;
    metrics.unknownStates++;
    return 'IDLE';
  }

  function recordFor(entity) {
    let rec = records.get(entity);
    if (!rec) { rec = makeRecord(entity); records.set(entity, rec); }
    if (!STATES.includes(rec.state)) {
      pushEvent(rec, 'state.unknown', { received: String(rec.state) });
      rec.state = resolveState(rec.state); rec.stateTime = 0; rec.attackActive = false; rec.pattern = '';
    }
    return rec;
  }

  function notify(entity, name, detail = {}) {
    if (!entity || typeof entity !== 'object') return false;
    const rec = recordFor(entity);
    rec.pending.push({ name, detail: Object.assign({}, detail) });
    if (rec.pending.length > 24) rec.pending.shift();
    return true;
  }

  function applyPending(rec) {
    for (const evt of rec.pending.splice(0)) {
      const d = evt.detail || {};
      switch (evt.name) {
        case 'telegraph':
          rec.pattern = String(d.pattern || rec.pattern || '');
          rec.warningTotal = Math.max(0, finite(d.warn));
          rec.patternWarn = rec.warningTotal;
          rec.attackActive = false;
          rec.recovery = 0;
          clearRecoveryIdentity(rec);
          pushEvent(rec, 'telegraph.start', { pattern: rec.pattern, warn: rec.warningTotal });
          break;
        case 'attackStart':
          rec.pattern = String(d.pattern || rec.pattern || '');
          rec.attackActive = true;
          rec.attackPulse = Math.max(rec.attackPulse, Math.max(0, finite(d.poseDuration, 0.28)));
          rec.patternWarn = 0;
          pushEvent(rec, 'attack.start', Object.assign({ pattern: rec.pattern, source: d.source || 'scheduler' }, emissionCounts(d)));
          break;
        case 'attackEnd': {
          const wasActive = rec.attackActive;
          rec.attackActive = false;
          rec.patternWarn = 0;
          rec.interrupted = d.completed !== true && wasActive;
          rec.recovery = d.completed === true ? Math.max(0, finite(d.recover)) : 0;
          rec.recoveryTotal = rec.recovery;
          if (d.completed === true || wasActive) {
            pushEvent(rec, d.completed === true ? 'attack.end' : 'attack.interrupted', Object.assign({
              pattern: String(d.pattern || rec.pattern || ''), completed: d.completed === true,
              recover: rec.recovery, reason: d.reason || null
            }, emissionCounts(d)));
          }
          if (d.completed === true && rec.recovery > 0) beginRecovery(rec, d.pattern || rec.pattern, rec.recovery);
          else clearRecoveryIdentity(rec);
          rec.pattern = '';
          break;
        }
        case 'damage':
          rec.damage = Math.max(rec.damage, Math.max(0, finite(d.duration, 0.12)));
          pushEvent(rec, 'damage', { source: d.source || 'bossHit' });
          break;
        case 'stagger':
          rec.stagger = Math.max(rec.stagger, Math.max(0, finite(d.duration)));
          pushEvent(rec, 'stagger', { duration: rec.stagger, source: d.source || 'host' });
          break;
        case 'phase':
          rec.phase = Math.max(rec.phase, Math.max(0, finite(d.duration, 0.28)));
          rec.phaseKey = String(d.phase || d.stage || 'phase');
          if (rec.attackActive || rec.pattern) pushEvent(rec, 'attack.interrupted', { pattern: rec.pattern || null, reason: 'phase-transition' });
          rec.attackActive = false;
          rec.patternWarn = 0;
          rec.recovery = 0; rec.recoveryTotal = 0;
          clearRecoveryIdentity(rec);
          pushEvent(rec, 'phase.change', { phase: rec.phaseKey });
          break;
        case 'death':
          if (rec.attackActive || rec.pattern) pushEvent(rec, 'attack.interrupted', { pattern: rec.pattern || null, reason: 'death' });
          rec.attackActive = false; rec.patternWarn = 0; rec.recovery = 0;
          clearRecoveryIdentity(rec);
          rec.death = true;
          pushEvent(rec, 'death', { source: d.source || 'encounter' });
          break;
        case 'reset':
          break;
        default:
          pushEvent(rec, 'event.unknown', { name: String(evt.name) });
      }
    }
  }

  function transition(rec, next, detail = {}) {
    if (next === rec.state) return false;
    if (!STATES.includes(next) || !TRANSITIONS[rec.state] || !TRANSITIONS[rec.state].includes(next)) {
      pushEvent(rec, 'transition.rejected', { from: rec.state, to: String(next) });
      return false;
    }
    // Timed states leave only when their own condition expires. Higher-priority
    // interrupts are permitted by the explicit transition graph.
    if (PRIORITY[next] < PRIORITY[rec.state] && rec.state !== 'DEATH' && rec.stateTime > 0 &&
        ['PHASE_TRANSITION', 'STAGGER', 'DAMAGED'].includes(rec.state)) {
      const remaining = rec.state === 'PHASE_TRANSITION' ? rec.phase : rec.state === 'STAGGER' ? rec.stagger : rec.damage;
      if (remaining > 0) return false;
    }
    const from = rec.state;
    rec.previous = from;
    rec.state = next;
    rec.stateTime = 0;
    rec.lastKnownState = next;
    metrics.transitions++;
    pushEvent(rec, 'state.exit', { state: from, to: next });
    pushEvent(rec, 'state.enter', Object.assign({ from, to: next }, detail));
    return true;
  }

  function syncCombatSignals(entity, rec, context) {
    const patterns = context.patterns || Object.create(null);
    const sweep = entity.sweep;
    if (sweep && Number.isFinite(Number(sweep.t))) {
      const warn = Math.max(0, finite(sweep.warn, 0.9));
      const fire = Math.max(0, finite(sweep.fire, 1.4));
      if (sweep.t < warn) {
        rec.pattern = 'sweep'; rec.warningTotal = warn; rec.patternWarn = warn - sweep.t;
      } else if (sweep.t < warn + fire) {
        if (!rec.attackActive || rec.pattern !== 'sweep') {
          rec.attackActive = true; rec.pattern = 'sweep'; rec.attackPulse = Math.max(rec.attackPulse, 0.28);
          pushEvent(rec, 'attack.start', { pattern: 'sweep', source: 'existing-sweep-window' });
        }
        rec.patternWarn = 0;
      } else {
        const completed = rec.attackActive;
        const recovery = Math.max(0, warn + fire + 0.3 - sweep.t);
        if (completed) pushEvent(rec, 'attack.end', { pattern: 'sweep', completed: true, recover: recovery });
        rec.attackActive = false;
        rec.patternWarn = 0;
        rec.pattern = 'sweep';
        rec.recovery = recovery;
        rec.recoveryTotal = Math.max(rec.recoveryTotal, 0.3);
        if (completed && recovery > 0) beginRecovery(rec, 'sweep', recovery);
      }
    } else if (rec.pattern === 'sweep') {
      if (rec.attackActive) {
        rec.attackActive = false; rec.recovery = 0.3; rec.recoveryTotal = 0.3;
        pushEvent(rec, 'attack.end', { pattern: 'sweep', completed: true, recover: 0.3 });
        beginRecovery(rec, 'sweep', 0.3);
      }
      rec.pattern = ''; rec.patternWarn = 0;
    } else if (entity.pattern71) {
      const pattern = String(entity.pattern71);
      const warn = Math.max(0, finite(entity.patternWarn71));
      if (rec.pattern !== pattern) {
        rec.pattern = pattern; rec.warningTotal = Math.max(warn, finite(patterns[pattern] && patterns[pattern].warn));
        rec.attackActive = false;
        if (warn > 0) pushEvent(rec, 'telegraph.start', { pattern, warn: rec.warningTotal, source: 'observed-scheduler' });
      }
      rec.patternWarn = warn;
      const observedEmissions = entity.patternEmissionKind71 === 'projectile'
        ? finite(entity.patternAccepted71)
        : finite(entity.patternShot71);
      if (warn <= 0 && !rec.attackActive && observedEmissions > 0) {
        rec.attackActive = true; rec.attackPulse = Math.max(rec.attackPulse, 0.28);
        pushEvent(rec, 'attack.start', Object.assign({ pattern, source: 'observed-emission' }, entity.patternEmissionKind71 === 'projectile'
          ? emissionCounts({ attempted: entity.patternAttempt71, accepted: entity.patternAccepted71, created: entity.patternCreated71 })
          : {}));
      }
    }
    rec.vulnerability = finite(entity.exposedT) > 0;
    if (Number.isFinite(Number(entity.hitFlash))) rec.damage = Math.max(0, Number(entity.hitFlash));
    if (Number.isFinite(Number(entity._ddaAttackT))) {
      const pulse = Math.max(0, Number(entity._ddaAttackT));
      const warning = !!(entity.pattern71 && finite(entity.patternWarn71) > 0) || !!(entity.sweep && finite(entity.sweep.t) < finite(entity.sweep.warn, 0.9));
      if (warning) rec.attackPulse = 0;
      else if (pulse > 0) rec.attackPulse = Math.max(rec.attackPulse, pulse);
      else if (rec.lastExternalAttackPulse > 0 && !rec.attackActive && !entity.pattern71 && !entity.sweep) rec.attackPulse = 0;
      rec.lastExternalAttackPulse = pulse;
    }
    if (Number.isFinite(Number(entity._ddaStaggerT))) rec.stagger = Math.max(0, Number(entity._ddaStaggerT));
  }

  function choose(rec, entity, dt) {
    if (rec.death || entity._ddaDead || finite(entity.hp, 1) <= 0) return 'DEATH';
    if (rec.phase > 0) return 'PHASE_TRANSITION';
    if (rec.stagger > 0) return 'STAGGER';
    if (rec.damage > 0 || finite(entity.hitFlash) > 0) return 'DAMAGED';
    if (rec.attackActive || rec.attackPulse > 0) return 'ATTACK';
    if (rec.patternWarn > 0) {
      const fraction = clamp(rec.profile.windupFraction, 0, 0.9);
      return rec.patternWarn <= rec.warningTotal * fraction ? 'WINDUP' : 'TELEGRAPH';
    }
    if (rec.recovery > 0) return 'ATTACK_RECOVERY';
    if (finite(entity.addsAlive) > 0 && !rec.vulnerability) return 'DEFENDING';
    if (entity.berserk || entity.phase === 'berserk' || finite(entity.finalStage) >= 3) return 'ENRAGED';
    if (rec.speed > 0.5 || (dt > 0 && Math.hypot(rec.dx, rec.dy) > 0.5)) return 'MOVING';
    if (entity && (entity.phase === 'chase' || entity.phase === 'ranged' || entity.phase === 'volley' || entity.phase === 'sweep' || finite(entity.attackTimer) > 0 || entity.entrance > 0)) return 'OBSERVING';
    return 'IDLE';
  }

  function advance(entity, dt = 0, context = {}) {
    if (!entity || typeof entity !== 'object') return snapshot(null, null);
    const rec = recordFor(entity);
    const delta = clamp(finite(dt), 0, 0.25);
    metrics.updates++;
    applyPending(rec);
    if (delta > 0) {
      rec.totalTime += delta;
      rec.stateTime += delta;
      rec.attackPulse = Math.max(0, rec.attackPulse - delta);
      rec.damage = Math.max(0, rec.damage - delta);
      rec.stagger = Math.max(0, rec.stagger - delta);
      rec.phase = Math.max(0, rec.phase - delta);
      const priorRecovery = rec.recovery;
      rec.recovery = Math.max(0, rec.recovery - delta);
      if (priorRecovery > 0 && rec.recovery === 0) {
        const detail = { pattern: rec.recoveryPattern || null };
        if (Number.isInteger(rec.recoveryStartSeq)) detail.startSeq = rec.recoveryStartSeq;
        pushEvent(rec, 'recovery.end', detail);
        clearRecoveryIdentity(rec);
      }
      const x = finite(entity.x), y = finite(entity.y);
      rec.dx = x - rec.x; rec.dy = y - rec.y;
      rec.speed = Math.hypot(rec.dx, rec.dy) / delta;
      rec.x = x; rec.y = y;
      const player = context.player || (typeof context.playerX === 'number' && typeof context.playerY === 'number' ? { x: context.playerX, y: context.playerY } : null);
      if (player && Number.isFinite(player.x) && Number.isFinite(player.y)) {
        rec.distance = Math.hypot(player.x - x, player.y - y);
        rec.targetAngle = Math.atan2(player.y - y, player.x - x);
      }
    }
    syncCombatSignals(entity, rec, context);
    const desired = choose(rec, entity, delta);
    if (desired !== rec.state) transition(rec, desired, {
      pattern: rec.pattern || null, phase: rec.phaseKey || entity.phase || null
    });
    rec.renderState = RENDER_STATE[rec.state] || 'idle';
    rec.frame = rec.stateTime;
    return snapshot(entity, rec);
  }

  function snapshot(entity, rec) {
    if (!rec) return Object.freeze({ state: 'IDLE', previous: null, stateTime: 0, progress: 0, renderState: 'idle', pattern: null, distance: null, targetAngle: null, vulnerability: false, profile: GENERIC_PROFILE.resident });
    let progress = 0;
    if (rec.state === 'TELEGRAPH' || rec.state === 'WINDUP') progress = rec.warningTotal > 0 ? clamp(1 - rec.patternWarn / rec.warningTotal, 0, 1) : 1;
    else if (rec.state === 'ATTACK_RECOVERY') progress = rec.recoveryTotal > 0 ? clamp(1 - rec.recovery / rec.recoveryTotal, 0, 1) : 1;
    else if (rec.state === 'PHASE_TRANSITION') progress = clamp(1 - rec.phase / 0.28, 0, 1);
    return Object.freeze({
      state: rec.state, previous: rec.previous, stateTime: rec.stateTime, totalTime: rec.totalTime,
      progress, renderState: (rec.profile.animationMap && rec.profile.animationMap[rec.state]) || rec.renderState || RENDER_STATE[rec.state] || 'idle',
      pattern: rec.pattern || null, distance: rec.distance, targetAngle: rec.targetAngle,
      vulnerability: !!rec.vulnerability, interrupted: !!rec.interrupted,
      profile: rec.profile.resident || null, dx: rec.dx, dy: rec.dy,
      dedicatedClip: null, fallback: 'existing-controller'
    });
  }

  function update(entity, dt, context) { return advance(entity, dt, context); }
  function get(entity) {
    if (!entity || typeof entity !== 'object') return snapshot(null, null);
    const rec = recordFor(entity);
    return advance(entity, 0, {});
  }
  function reset(entity) {
    if (!entity || typeof entity !== 'object') return false;
    records.delete(entity);
    return true;
  }
  function clear() { records = new WeakMap(); }
  function drainEvents(entity) {
    if (!entity || typeof entity !== 'object') return [];
    const rec = recordFor(entity), out = rec.events.slice();
    rec.events.length = 0;
    return out;
  }
  function describe() {
    return {
      version: 'B2-FSM-1.0.0', states: STATES.slice(), priorities: Object.assign({}, PRIORITY),
      definitions: Object.fromEntries(STATES.map(state => [state, {
        entry: DEFINITIONS[state].entry, exit: DEFINITIONS[state].exit,
        duration: DEFINITIONS[state].duration, priority: DEFINITIONS[state].priority,
        interruptible: DEFINITIONS[state].interruptible, animation: DEFINITIONS[state].animation,
        events: DEFINITIONS[state].events.slice(), allowed: TRANSITIONS[state].slice()
      }])), profiles: Object.values(PROFILES).map(p => ({ resident: p.resident, kind: p.kind, windupFraction: p.windupFraction, animationMap: Object.assign({}, p.animationMap), dedicatedClips: p.dedicatedClips.slice(), fallback: p.fallback })),
      renderState: Object.assign({}, RENDER_STATE), metrics: Object.assign({}, metrics)
    };
  }
  function validate() {
    const errors = [];
    for (const state of STATES) {
      if (!DEFINITIONS[state]) errors.push('missing definition:' + state);
      if (!TRANSITIONS[state] || !TRANSITIONS[state].includes(state)) errors.push('missing self transition:' + state);
      for (const target of TRANSITIONS[state] || []) if (!STATES.includes(target)) errors.push('unknown destination:' + state + '->' + target);
      if (state === 'DEATH' && (TRANSITIONS[state].length !== 1 || TRANSITIONS[state][0] !== 'DEATH')) errors.push('death is not terminal');
    }
    for (const id of ['anden','magneta','bufe','cajero','pogo','oficiante','matarife','imitador','traidor','nucleo']) if (!PROFILES[id]) errors.push('missing profile:' + id);
    for (const state of STATES) if (!['idle','attack','hit','death'].includes(RENDER_STATE[state])) errors.push('invalid render fallback:' + state);
    return { pass: errors.length === 0, errors };
  }

  return Object.freeze({ version: 'B2-FSM-1.0.0', STATES, PRIORITY, DEFINITIONS, TRANSITIONS, PROFILES, RENDER_STATE, update, get, notify, reset, clear, drainEvents, describe, validate, resolveState, metrics });
});
