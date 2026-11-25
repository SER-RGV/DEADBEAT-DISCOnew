// Offline projection of the same floor assembler used by the HTML build.
const fs = require("node:fs"),
  path = require("node:path");
const dir = path.resolve(__dirname, "../../src/room_generation");
const api = Function(
  "prefabCatalog",
  [
    "seed",
    "rooms",
    "population",
    "floor",
    "validate",
    "architecture",
    "prefabs",
  ]
    .map((n) => fs.readFileSync(path.join(dir, n + ".js"), "utf8"))
    .join("\n") + ";return {generate,bindPrefabs,instantiatePrefab}",
)(require(path.join(dir, "prefabs/catalog.json")));
module.exports = api;
if (require.main === module) {
  const [seed = "0", floor = "0", key] = process.argv.slice(2),
    p = api.bindPrefabs(api.generate(Number(seed), Number(floor)));
  const n = p.nodes.find((n) => n.key === (key || p.nodes[0].key));
  if (!n) throw Error("Unknown node");
  console.log(JSON.stringify(api.instantiatePrefab(n), null, 2));
}
