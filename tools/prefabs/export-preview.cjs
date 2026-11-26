// Snapshot only the two commissioned rooms; regenerate after a catalog change.
const fs = require("node:fs"),
  path = require("node:path");
const { generate, bindPrefabs, instantiatePrefab } = require("./inspect.cjs");
const catalog = require("../../src/room_generation/prefabs/catalog.json");
const plan = bindPrefabs(generate(0, 0));
const rooms = ["r1", "r2"].map((key) => {
  const r = instantiatePrefab(plan.nodes.find((n) => n.key === key));
  return {
    ...r,
    outline: catalog.templates[r.template].perimeter.map(([, x, y]) => ({
      x,
      y,
    })),
  };
});
fs.writeFileSync(
  path.join(__dirname, "../../previews/prefabs/rooms.json"),
  JSON.stringify(rooms) + "\n",
);
