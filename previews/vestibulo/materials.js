// Art bindings only. No positions or interaction triggers are authored here.
const ART = {
  floor: "floors/floor_05_pride_obsidian_gold",
  tile: "floors/floor_10_hub_checker",
  rug: "floors/floor_11_vip_velvet",
  wall: "walls/wall_panel_heavy_base",
  hero: "characters/protagonist_master/fidelidad/pm_idle_fid_00",
  tempo: "characters/npc_dj_booth_world",
  armera: "characters/npc_armorer_hub",
  bartender: "characters/npc_bartender_hub",
};
const furniture = {
  armory: "weapon_rack",
  upgrades: "bookshelf_hub",
  armorer: "chest_closed",
  practice: "bench_neon",
  workshop: "tesla_orb",
  dj: "dj_booth",
  mix: "speaker_tower",
  bar: "bar_counter",
  rest: "sofa_black",
  map: "astral_table",
  ledger: "bookshelf_hub",
  gallery: "arcade_cabinet",
  bedroom: "sofa_magenta",
  keepsake: "mirror_baroque",
  prepare: "tesla_orb",
};
for (const [id, name] of Object.entries(furniture))
  ART[id] = "props/prop_" + name;
// Asset-space 0° is the visible service face. Frontal plates stand upright;
// their horizontal baseline tilt (dy/dx) is removed, not a rotation of the actor.
const facePlate = {
  armory: 0,
  upgrades: -0.15,
  armorer: 0,
  practice: -0.14,
  dj: -0.1,
  mix: 0,
  bar: -0.08,
  rest: 0.12,
  map: 0,
  ledger: -0.15,
  gallery: 0.07,
  bedroom: -0.16,
  keepsake: -0.12,
  workshop: 0,
  prepare: 0,
};
const heading = {
  S: [0, 1, 0],
  W: [-1, 0, 90],
  N: [0, -1, 180],
  E: [1, 0, 270],
};

// Opaque bounds of the shipped plates; place visible feet, not transparent PNG margins.
const artBounds = {
  hero: [89, 43, 102, 462],
  tempo: [136, 24, 111, 288],
  armera: [60, 32, 143, 280],
  bartender: [71, 24, 113, 288],
  armory: [14, 233, 259, 141],
  upgrades: [44, 30, 231, 345],
  armorer: [13, 91, 230, 127],
  practice: [16, 36, 288, 151],
  workshop: [30, 28, 196, 345],
  dj: [22, 24, 403, 257],
  mix: [11, 41, 202, 333],
  bar: [21, 35, 374, 215],
  rest: [19, 80, 346, 170],
  map: [19, 74, 346, 207],
  ledger: [44, 30, 231, 345],
  gallery: [13, 40, 230, 303],
  bedroom: [28, 20, 327, 230],
  keepsake: [26, 28, 172, 346],
  prepare: [30, 28, 196, 345],
};
