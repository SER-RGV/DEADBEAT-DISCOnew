// Diagnostic only: run the existing plan validator against compiled prefab geometry.
// Usage: node tools/qa/room_generation_compiled_validation.cjs [seeds]
// This does not change the game and is not a physical reachability test.
const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '../../src/room_generation');
const catalog = require(path.join(dir, 'prefabs/catalog.json'));
const { generate, bindPrefabs, playableRoom, validate } = Function('prefabCatalog',
  ['seed', 'rooms', 'population', 'floor', 'validate', 'architecture', 'prefabs', 'playable']
    .map(name => fs.readFileSync(path.join(dir, name + '.js'), 'utf8')).join('\n') +
    '\nreturn {generate,bindPrefabs,playableRoom,validate};')(catalog);
const count = Number(process.argv[2] || 1000);
if (!Number.isInteger(count) || count < 1) throw Error('seeds must be a positive integer');
const result = { seedsPerFloor: count, maps: 0, passed: 0, rejected: 0, reasons: {}, examples: [], note: 'Existing validator applied unchanged to compiled prefab polygons, preserving the Hangar pilot. Rejections are not evidence of actual spawn failures or unreachable doors.' };
for (let floor = 0; floor < 10; floor++) for (let seed = 0; seed < count; seed++) {
  const plan = bindPrefabs(generate(seed, floor));
  for (const n of plan.nodes) {
    const compiled = playableRoom(n);
    if (compiled) n.geometry = compiled.geometry;
  }
  result.maps++;
  try { validate(plan); result.passed++; }
  catch (e) {
    result.rejected++;
    const reason = String(e.message).replace(/^RG \d+\/\d+: /, '').replace(/ r\d+$/, '');
    result.reasons[reason] = (result.reasons[reason] || 0) + 1;
    if (result.examples.length < 10) result.examples.push({floor, seed, message: e.message});
  }
}
console.log(JSON.stringify(result, null, 2));
