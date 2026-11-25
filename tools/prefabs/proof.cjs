// Review sheet: no combat renderer or simulation. SVG in local world units.
const { generate, bindPrefabs, instantiatePrefab } = require("./inspect.cjs");
const catalog = require("../../src/room_generation/prefabs/catalog.json");
const [seed = 0, floor = 0, key] = process.argv.slice(2),
  plan = bindPrefabs(generate(+seed, +floor)),
  n = plan.nodes.find((n) => n.key === (key || plan.nodes[0].key));
if (!n) throw Error("Unknown node");
const m = instantiatePrefab(n),
  spec = catalog.templates[m.template];
const poly = (pts, color) =>
    `<polygon points="${pts.map((p) => p.x + "," + p.y).join(" ")}" fill="${color}"/>`,
  label = (x, y, s) => `<text x="${x}" y="${y}">${s}</text>`,
  rect = (x, y, w, h, c) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-85 -135 1410 1100" role="img"><title>${m.template} · ${m.key}</title>${rect(-85, -135, 1410, 1100, "#111018")}<g font-family="monospace" font-size="19" fill="#efdbc9">${label(-40, -91, `RG2   /   ${m.template}   /   ${m.key}   ·   planta ${floor}   ·   semilla ${seed}`)}`;
s += poly(
  spec.perimeter.map(([, x, y]) => ({ x, y })),
  "#292632",
);
for (const d of m.openings) s += poly(d.threshold, "#375657");
for (const w of m.walls) {
  const up = (p) => ({ x: p.x, y: p.y - w.height });
  s +=
    poly([...w.face, ...w.face.slice().reverse().map(up)], "#514251") +
    poly(w.cap.map(up), "#403c49");
}
for (const d of m.openings) {
  for (const j of d.jambs) s += poly(j, "#c0a388");
  s += label(d.landing.x - 15, d.landing.y, d.to);
}
for (const d of m.decks) {
  s += rect(d.x, d.y - d.rise, d.w, d.h, "#483d48");
  for (const t of d.treads)
    s +=
      rect(t.x + 4, t.y + 7, t.w, t.h + t.riser, "#1f1b23") +
      rect(t.x, t.y - t.z, t.w, t.h, "#74606a") +
      rect(t.x, t.y - t.z + t.h, t.w, t.riser, "#41373e");
}
for (const p of m.placements) {
  const { x, y } = p.anchor,
    c = p.collider,
    dy = y - p.elevation;
  s += `<ellipse cx="${x}" cy="${dy + 4}" rx="${p.shadow.rx}" ry="${p.shadow.ry}" fill="#141017"/>`;
  s += `<g transform="translate(${x} ${dy}) rotate(${p.yaw})">`;
  if (c.kind === "circle") s += `<circle r="${c.r}" fill="#8c7473"/>`;
  else if (c.kind === "rect")
    s += rect(-c.w / 2, -c.h / 2, c.w, c.h, "#876a70");
  else
    s += `<path d="M${-c.halfLength} 0H${c.halfLength}" stroke="#866477" stroke-width="${c.r * 2}" stroke-linecap="round"/>`;
  s += "</g>";
  s +=
    `<path d="M${x} ${dy}l${p.normal.x * 38} ${p.normal.y * 38}" stroke="#bbe0d7" stroke-width="4"/>` +
    label(x + 15, dy + 47, p.id + " / " + p.view);
}
console.log(s + "</g></svg>");
