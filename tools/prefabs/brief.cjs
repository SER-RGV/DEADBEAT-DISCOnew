// Generate one independent art brief per placement/state, not an image atlas.
const { generate, bindPrefabs, instantiatePrefab } = require("./inspect.cjs"),
  c = require("../../src/room_generation/prefabs/catalog.json");
const [seed = 0, floor = 0, key] = process.argv.slice(2),
  plan = bindPrefabs(generate(+seed, +floor)),
  node = plan.nodes.find((n) => n.key === (key || plan.nodes[0].key));
if (!node) throw Error("Unknown node");
const room = instantiatePrefab(node);
const style =
  "Club subterráneo DEADBEAT DISCO, cámara 2.5D top-down fija, luz superior izquierda, valores oscuros, cantos neutros, sin halos de peligro, letras, perspectiva angular arbitraria ni sombra larga horneada.";
const brief = (id, p) => console.log(`\n### ${id}\n${style} ${p}`);
console.log(`# Orden de arte · ${room.template} / ${room.key}`);
brief(
  "suelo",
  "Textura continua repetible de losetas de club sin bordes, escalones ni accesos pintados. Recortar en el motor por el perímetro.",
);
brief(
  "muro · tapa / cara",
  "Dos materiales separados y repetibles: tapa de metal pavonado y frente acanalado. Extruir por altura de segmento. Sin vanos ficticios, pilares salientes ni luces intermitentes.",
);
brief(
  "jamba / umbral",
  "Jamba de 10 unidades, canto mate contrastado y umbral transitable de 170 × 86, sin hoja cerrada horneada. Aplicar en la base tangente/normal de cada enlace.",
);
for (const d of room.decks)
  brief(
    d.id,
    `Tarima y huella repetible con nariz clara y contrahuella oscura. ${d.w} × ${d.h} u, cota ${d.rise} u, ${d.steps} peldaños, avance total ${d.run} u, frente ${d.approach}. Sin escaleras pintadas en el suelo llano.`,
  );
for (const p of room.placements)
  for (const state of p.destructible ? ["intacto", "roto"] : ["intacto"])
    brief(
      `${p.id} / ${state}`,
      `${c.assets[p.asset].prompt} Entregar SOLO estado ${state}, fondo transparente, mismo lienzo y pivote que su pareja. Segmento ${p.segment}, frontal ${p.view}, giro de autoría ${p.yaw}° desde sur (rotar modelo antes de capturar, no bitmap). Tamaño visual ${p.artSize.w.toFixed(1)} × ${p.artSize.h.toFixed(1)} u respecto a jugador de 96 u de alto. Centro de base (${p.anchor.x}, ${p.anchor.y}), cota ${p.elevation}. Huella ${JSON.stringify(p.collider)}. Sombra de contacto en capa separada; sin decal interactivo.`,
    );
