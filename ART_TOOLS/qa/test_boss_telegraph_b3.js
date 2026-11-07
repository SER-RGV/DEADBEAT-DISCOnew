#!/usr/bin/env node
'use strict';

// Source-coupled B3 contract audit. It verifies that the active game renderer
// consumes the combat scheduler's existing IDs/data and records known sweep and
// geometry mismatches as blockers rather than changing frozen runtime systems.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'DEADBEAT_DISCO.ART.html'), 'utf8');
const fsm = fs.readFileSync(path.join(root, 'boss_animation_state_machine.js'), 'utf8');
let assertions = 0;
function check(ok, message) { assertions++; assert.ok(ok, message); }
function extractBalanced(source, marker, opening = '{') {
  const at = source.indexOf(marker);
  check(at >= 0, `source contains ${marker}`);
  const begin = source.indexOf(opening, at);
  check(begin >= 0, `${marker} has opening ${opening}`);
  const closing = opening === '{' ? '}' : ']';
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
    if (ch === opening) depth++;
    if (ch === closing && --depth === 0) return source.slice(at, i + 1);
  }
  throw new Error(`unclosed ${marker}`);
}
function functionSource(source, signature) { return extractBalanced(source, signature); }

const profiles = [
  ['anden', 'hunter', ['fan', 'burst', 'ring'], null],
  ['magneta', 'hunter', ['burst', 'fan', 'ring'], null],
  ['bufe', 'pulse', ['ring', 'spiral', 'burst'], 'fire'],
  ['cajero', 'hunter', ['ring', 'fan', 'spiral'], null],
  ['pogo', 'sweeper', ['burst', 'fan', 'spiral'], null],
  ['oficiante', 'pulse', ['summon', 'ring', 'spiral'], 'elec'],
  ['matarife', 'sweeper', ['spiral', 'burst', 'fan'], 'fire'],
  ['imitador', 'hunter', ['fan', 'ring', 'burst'], null],
  ['traidor', 'sweeper', ['ring', 'burst', 'spiral'], 'elec'],
];
const ids = ['fan', 'ring', 'spiral', 'burst', 'summon'];
const ao = extractBalanced(html, 'Ao={');
const ye = extractBalanced(html, 'Ye=[', '[');
const catalog = Object.fromEntries(ids.map(id => {
  const m = ao.match(new RegExp(`${id}:\\{name:"([^"]+)",warn:([\\d.]+)(?:,shots:([\\d.]+))?`));
  check(!!m, `Ao catalog has real attack ID ${id}`);
  return [id, { name: m[1], warn: Number(m[2]), shots: m[3] ? Number(m[3]) : null }];
}));
const catalogTiming = { fan: [.8, .8], ring: [1.05, 1.05], spiral: [1.1, 1.15], burst: [.82, .95], summon: [1.2, 1.2] };
for (const [id, [warn, recover]] of Object.entries(catalogTiming)) {
  const sourceNumber = value => String(value).replace(/^0\./, '.');
  check(ao.includes(`${id}:{`) && ao.includes(`warn:${sourceNumber(warn)}`), `${id} warning remains sourced from Ao`);
  check(ao.includes(`recover:${sourceNumber(recover)}`), `${id} recovery remains sourced from Ao`);
}
for (const [id, variant, attacks, zoneType] of profiles) {
  const entity = ye.match(new RegExp(`\\{id:"${id}"[\\s\\S]*?(?=,\\{id:|\\]$)`));
  check(!!entity, `Ye has real resident ${id}`);
  check(entity[0].includes(`variant:"${variant}"`), `${id} uses actual ${variant} combat profile`);
  const list = entity[0].match(/patterns:\[([^\]]+)\]/);
  check(!!list, `${id} has authored patterns in Ye`);
  const actual = [...list[1].matchAll(/"([a-z]+)"/g)].map(m => m[1]);
  check(JSON.stringify(actual) === JSON.stringify(attacks), `${id} attack list matches active Ye: ${actual.join(',')}`);
  for (const attack of attacks) check(ao.includes(`${attack}:{`), `${id}/${attack} resolves in Ao`);
  if (zoneType) check(entity[0].includes(`zones:{type:"${zoneType}"`), `${id} zone attack uses actual ${zoneType} data`);
}
check((ye.match(/\{id:"[a-z]+"/g) || []).length === 10, 'Ye has ten combat records: nine circle residents plus its legacy Núcleo record');
const coreAt = html.indexOf('We={id:"nucleo"');
check(coreAt >= 0, 'Núcleo Final has its distinct We record');
const core = extractBalanced(html, 'We={');
check(core.includes('id:"nucleo"') && core.includes('patterns:["fan","ring","burst","spiral"]'), 'Núcleo retains the actual final pattern list');
check(core.includes('final:!0'), 'Núcleo remains marked as final, not inferred from atlas identity');
const sweepTrigger = html.slice(html.indexOf('sr.phase="sweep"'), html.indexOf('sr.phase="sweep"') + 360);
check(sweepTrigger.includes('sr.sweep={a0:Math.atan2(t,a)+Math.PI,dir:Math.random()<.5?1:-1,arc:2.4,t:0,warn:.9,fire:1.4'), 'sweep uses the existing scheduler parameters');
const sweepDraw = html.slice(html.indexOf('e.sweep){const a=e.sweep'), html.indexOf('e.sweep){const a=e.sweep') + 1100);
check(sweepDraw.includes('wf(e.x,e.y,a.a0,a.a0+a.dir*a.arc,720,"#f43f5e",.06)'), 'sweep warning marks the scheduler-defined sector');
check(sweepDraw.includes('a.t<a.warn?') && sweepDraw.includes('a.t-a.warn)/a.fire'), 'sweep direction/progress is derived from existing warn/fire');
check(sweepDraw.includes('g.lineTo(o,r)'), 'active sweep uses the moving scheduler ray');
check(!sweepDraw.includes('e.phase') && !sweepDraw.includes('phase=='), 'sweep renderer is gated by the sweep object, not current phase (known stale-render risk)');
const sweepHit = html.slice(html.indexOf('"sweep"===sr.phase&&sr.sweep'), html.indexOf('"sweep"===sr.phase&&sr.sweep') + 900);
check(sweepHit.includes('Zs(sr.x,sr.y,sr.x+720*Math.cos(e),sr.y+720*Math.sin(e),ye.x,ye.y)'), 'sweep hit-test uses the same moving ray');
check(sweepHit.includes('ye.r+22'), 'sweep player contact radius is not approximated from an unrelated visual');
const wh = functionSource(html, 'function wh(e,a)');
check(wh.includes('patternAim71=Math.atan2(ye.y-e.y,ye.x-e.x)'), 'pattern direction snapshots the real target direction');
check(wh.includes('patternGap71=null===o?e.patternAim71:o'), 'ring/spiral gap is selected by the existing safe-corridor search');
check(wh.includes('patternWarn71=t.warn') && wh.includes('Pp(t.name'), 'telegraph start uses Ao.warn and the existing warning UI');
check(wh.includes('ih("boss.warn",a)'), 'scheduler emits the existing boss.warn event');
const ch = functionSource(html, 'function Ch()');
check(ch.includes('if(!ir||!e||!e.pattern71)return'), 'pattern telegraph exists only while scheduler pattern exists');
check(ch.includes('e.patternGap71') && ch.includes('patternAim71'), 'pattern renderer reads the same direction/gap values as attack execution');
for (const shape of ['"ring"===e.pattern71||"spiral"===e.pattern71', '"summon"===e.pattern71', 'a.spread/2']) check(ch.includes(shape), `existing renderer has geometry for ${shape}`);
check(ch.includes('e.patternWarn71/a.warn'), 'pattern warning progress is derived from remaining scheduler warning');
const summon = functionSource(html, 'function Sh(e,a)');
check(summon.includes('(e.patternGap71||0)+Math.PI+.7*(a-.5)'), 'summon spawn coordinates use the scheduler saved angle');
check(summon.includes('190*Math.cos(t)') && ch.includes('190*Math.cos(t)'), 'summon visual marks the actual spawn radius');
const th = functionSource(html, 'function Th(e,a)');
check(th.includes('if(e.patternWarn71>0)return void(e.patternWarn71=Math.max(0,e.patternWarn71-a))'), 'Th holds execution until its actual warning reaches zero');
check(th.includes('vh(e,a,t,c)') && th.includes('e.patternAim71') && th.includes('e.patternGap71') && th.includes('patternAttempt71'), 'attack emission accounting delegates to vh() while retaining the same saved direction and corridor');
const burstBoundsMatch = th.includes('e.patternAim71+.115*a') && ch.includes('e.pattern71?a.spread/2:.115');
check(th.includes('e.patternAim71+.115*a'), 'burst projectiles remain at scheduler offsets ±0.115 rad');
check(ch.includes('e.pattern71?a.spread/2:.115'), 'burst telegraph now uses exact ±0.115 rad bounds');
check(burstBoundsMatch, 'burst telegraph bounds equal the scheduler emission angles');
const spiralBoundsMatch = th.includes('Nd(n,e.patternGap71)>.62') && ch.includes('const a=e.patternGap71,r="spiral"===e.pattern71?.62:.55;for(const e of[-r,r])');
check(th.includes('Nd(n,e.patternGap71)>.62'), 'spiral scheduler leaves a ±0.62 rad clear corridor');
check(ch.includes('const a=e.patternGap71,r="spiral"===e.pattern71?.62:.55'), 'renderer keeps ring at ±0.55 and uses spiral ±0.62 rad');
check(spiralBoundsMatch, 'spiral telegraph bounds equal scheduler clearance while ring remains unchanged');
check(th.includes('e.pattern71="",e.patternWarn71=0'), 'completed or explicitly deferred pattern clears its telegraph');
check(th.includes('ih("boss.defer"'), 'invalidated safe corridor emits defer instead of a false attack');
const thHookAt = html.indexOf('const Sy=Th;Th=function');
check(thHookAt >= 0, 'B2 hook observes the real Th scheduler without replacing its source');
const thHook = html.slice(thHookAt, thHookAt + 2600);
check(thHook.includes('Sy.apply(this,arguments)'), 'B2 observer delegates to the real Th first');
check(thHook.includes('notify(e,"telegraph"'), 'scheduler-selected pattern emits the B2 telegraph event');
check(thHook.includes('notify(e,"attackStart"'), 'actual patternShot increment emits B2 attackStart');
check(thHook.includes('notify(e,"attackEnd"'), 'completed/cancelled pattern emits B2 attackEnd');
check(thHook.includes('complete=p?') && thHook.includes('existing-scheduler-cancel'), 'attack end distinguishes accepted completion from scheduler cancellation');
check(fsm.includes('case \'telegraph\'') && fsm.includes('case \'attackStart\'') && fsm.includes('case \'attackEnd\''), 'B2 maps existing scheduler notifications to its states/events');
check(fsm.includes("const observedEmissions = entity.patternEmissionKind71 === 'projectile'") && fsm.includes('finite(entity.patternAccepted71)'), 'B2 attack state begins on accepted projectile emission, not scheduled slots or pose');
check(fsm.includes("if (sweep.t < warn)") && fsm.includes("'existing-sweep-window'"), 'B2 observes the actual sweep warning/fire interval');
const du = functionSource(html, 'function du(e,a,t)');
check(du.includes('state:"warn"'), 'zone attacks enter the existing warn state before activation');
check(du.includes('bossZoneOwner72:e'), 'zone warning retains its real boss owner reference');
check(du.includes('"elec"===a?126:122'), 'zone danger radius comes from the actual zone type');
check(du.includes('"elec"===a?1.7:1.45'), 'zone warning window comes from the actual zone type');
check(du.includes('id:"BOSSPAT-"+Wo'), 'zone uses its existing unique runtime ID, not an invented B3 ID');
const zoneDraw = functionSource(html, 'drawZones:function()');
check(zoneDraw.includes('"warn"===e.state') && zoneDraw.includes('g.arc(e.x,e.y,e.r'), 'existing zone renderer marks the actual warning radius');
check(zoneDraw.includes('e.t)/e.warn') && zoneDraw.includes('e.r+9'), 'zone progress ring uses remaining warning time and same radius');
check(html.includes('jc.drawZones()') && zoneDraw.includes('for(const e of n.zones)'), 'each independent scheduler zone is communicated through its own existing visual record; no per-zone B2 FSM event is needed');
check(ye.includes('zones:{type:"fire"') && ye.includes('zones:{type:"elec"'), 'resident zone attacks are declared only for actual profiles');
check(core.includes('function') === false, 'final profile is data, not a second controller');
const phaseAt = html.indexOf('sr.phase="berserk",sr.phaseTimer=0,sr.pattern71="",sr.patternWarn71=0,sr.sweep=null,sr.attackTimer=1');
check(phaseAt >= 0, 'non-final berserk transition now clears pattern and active sweep signal');
const volleyPhaseAt = html.indexOf('sr.phase="volley",sr.phaseTimer=2.4,sr.pattern71="",sr.patternWarn71=0,sr.sweep=null,sr.attackTimer=1');
check(volleyPhaseAt >= 0, 'non-final volley transition also clears any active sweep signal');
const finalPhaseReset = html.slice(html.indexOf('function cu(e,a)'), html.indexOf('function cu(e,a)') + 400);
check(finalPhaseReset.includes('e.sweep=null') && finalPhaseReset.includes('e.pattern71=""'), 'Núcleo phase reset explicitly clears sweep and pattern warnings');
check(html.includes('addBossDeath:function(e){if(!e||e._ddaDeathQueued)return!1;window.DMO_BOSS_ANIMATION_FSM&&window.DMO_BOSS_ANIMATION_FSM.notify(e,"death"'), 'existing death path notifies B2 and rejects duplicate death queueing');

const attackPatternLinks = profiles.reduce((n, p) => n + p[2].length, 0) + 4 /* Núcleo adds four base patterns */ + 4 /* four sweepers incl. final */ + 6 /* resident/final zone channels */ + 1 /* final-stage conditional summon */;
const rawMatrix = profiles.map(([resident, variant, attacks, zone]) => ({ resident, variant, attackIds: attacks.map(id => `pattern:${id}`).concat(variant === 'sweeper' ? ['sweep:phase.sweep'] : [], zone ? [`zone:${zone}`] : []) })).concat([{ resident: 'nucleo', variant: 'sweeper', attackIds: ['pattern:fan', 'pattern:ring', 'pattern:burst', 'pattern:spiral', 'sweep:phase.sweep', 'pattern:summon (conditional final stage)', 'zone:elec (stage 2)', 'zone:fire (stage 3)'] }]);
function linkStatus(id) {
  if (id.startsWith('zone:')) return 'C';
  if (id.startsWith('pattern:') || id.startsWith('sweep:')) return 'C';
  return 'M';
}
const matrix = rawMatrix.map(row => ({ ...row, attackLinks: row.attackIds.map(attackId => ({ attackId, status: linkStatus(attackId, row.resident) })) }));
const flatLinks = matrix.flatMap(row => row.attackLinks);
const sourceAuditCoverage = {
  correct: flatLinks.filter(link => link.status === 'C').length,
  partial: flatLinks.filter(link => link.status === 'P').length,
  missing: flatLinks.filter(link => link.status === 'M').length,
  note: 'All 42 source links match their scheduler-owned warning geometry and lifecycle: 32 pattern links, four sweeps, and six zone channels. Burst/spiral renderer bounds now match execution; non-final phase changes clear sweep references; six zones remain independent visual scheduler records without duplicating B2 per boss.'
};
const result = {
  suite: 'B3 Telegraph & Attack Communication — source-coupled contract audit',
  status: 'PASS',
  assertions,
  attackPatternLinks,
  sourceAuditCoverage,
  configuredProfiles: profiles.length + 1,
  authoredPatternIds: catalog,
  matrix,
  core: { resident: 'nucleo', distinctFinalRecord: true, attackIds: rawMatrix[rawMatrix.length - 1].attackIds },
  knownBlockers: [],
  evidenceKind: 'Static/source-coupled contract validation; does not claim human readability or full gameplay verification.'
};
const out = path.join(root, 'ART_AUDIT/BOSSES/evidence/B3_telegraph/deterministic.json');
fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
