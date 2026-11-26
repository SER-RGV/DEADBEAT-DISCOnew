// Static shell is baked once. Destructible pieces always read the live native prop.
window.DD_PREFAB_WORLD = (() => {
  const images = {},
    pivots = PREFAB_PIVOTS;
  let loading = false,
    revision = 0;
  function load() {
    if (loading) return;
    loading = true;
    for (const id of Object.keys(pivots))
      for (const suffix of id.endsWith("intacto") || id.endsWith("roto")
        ? ["", "-sombra"]
        : [""]) {
        const im = new Image();
        im.onload = () => {
          images[id + suffix] = im;
          revision++;
        };
        im.src = "assets/prefabs/club/" + id + suffix + ".png";
      }
  }
  function poly(g, pts) {
    g.beginPath();
    pts.forEach(({ x, y }, i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
  }
  function paint(g, id, pts, color) {
    poly(g, pts);
    g.fillStyle = color;
    if (images[id]) {
      const pat = g.createPattern(images[id], "repeat");
      pat.setTransform(new DOMMatrix().scale(0.5));
      g.fillStyle = pat;
    }
    g.fill();
  }
  function sprite(g, id, x, y, pivot = id) {
    const im = images[id];
    if (!im) return false;
    const [px, py] = pivots[pivot];
    g.drawImage(im, x - px / 2, y - py / 2, im.width / 2, im.height / 2);
    return true;
  }
  // Load only the active circle's material; invalidate the room bake on arrival.
  const circleFloors = ['floor_00_limbo_marble', 'floor_01_lust_dancefloor', 'floor_02_gula_terracotta', 'floor_03_greed_slate_gold', 'floor_04_wrath_burgundy', 'floor_05_pride_obsidian_gold', 'floor_06_violence_ash_slabs', 'floor_07_envy_travertine', 'floor_08_ice_abyssal', 'floor_09_core_cosmic_vein'];
  const requested = new Set();
  function shell(g, w, h, r, mesh, clip, floor) {
    load();
    g.save();
    // Rooms narrower than the viewport leave bare canvas at the edges, so the
    // void carries the circle's own stone, dimmed, under a vignette: it reads as
    // floor falling off into the dark instead of a hole in the frame.
    g.fillStyle = "#08070d";
    g.fillRect(0, 0, w, h);
    const stone = circleFloors[floor];
    if (stone) {
      if (!requested.has(stone)) {
        requested.add(stone);
        const im = new Image();
        im.onload = () => {
          images[stone] = im;
          revision++;
        };
        im.src = "assets/floors/" + stone + ".png";
      }
      if (images[stone]) {
        const pat = g.createPattern(images[stone], "repeat");
        pat.setTransform(new DOMMatrix().scale(0.5));
        g.save();
        g.globalAlpha = 0.11;
        g.fillStyle = pat;
        g.fillRect(0, 0, w, h);
        g.restore();
      }
    }
    const vig = g.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.3,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.72,
    );
    vig.addColorStop(0, "rgba(8,7,13,0)");
    vig.addColorStop(1, "rgba(4,3,8,0.9)");
    g.fillStyle = vig;
    g.fillRect(0, 0, w, h);
    g.save();
    clip(g);
    g.clip();
    g.translate(r.x, r.y);
    const bounds = [
      { x: 0, y: 0 },
      { x: r.w, y: 0 },
      { x: r.w, y: r.h },
      { x: 0, y: r.h },
    ];
    paint(g, "suelo", bounds, "#2c2831");
    if (stone) {
      if (images[stone]) {
        g.globalAlpha = 0.55;
        paint(g, stone, bounds, "#292432");
        // Tint the circle's stone toward the room base so no circle reads as a
        // light slab next to the rest, and the hosts keep their contrast.
        g.globalAlpha = 0.44;
        g.fillStyle = "#221d29";
        g.fillRect(0, 0, r.w, r.h);
        g.globalAlpha = 1;
      }
    }
    g.restore();
    g.translate(r.x, r.y);
    for (const o of mesh.openings) {
      const view = { left: "E", right: "W", top: "S", bottom: "N" }[o.side];
      if (!sprite(g, "umbral-" + view, o.origin.x, o.origin.y))
        paint(g, "", o.threshold, "#56505c");
    }
    for (const d of mesh.decks) {
      const tile = (id, x, y, w, h, col) => {
        if (images[id]) g.drawImage(images[id], x, y, w, h);
        else {
          g.fillStyle = col;
          g.fillRect(x, y, w, h);
        }
      };
      // Terrain is optical, not an additional movement level. Keep the near lip at
      // the native world position, so reticles and hostile warnings stay grounded.
      tile("tarima", d.x, d.y - d.rise, d.w, d.h, "#4f4452");
      for (const t of d.treads) {
        tile("pisada-" + d.steps, t.x, t.y - t.z, t.w, t.h, "#63545c");
        tile("contrahuella", t.x, t.y - t.z + t.h, t.w, t.riser, "#352e37");
      }
    }
    for (const wall of mesh.walls) {
      const up = (p) => ({ x: p.x, y: p.y - wall.height });
      for (let i = 0; i < 4; i++) {
        const a = wall.cap[i],
          b = wall.cap[(i + 1) % 4];
        paint(g, "cara", [a, b, up(b), up(a)], "#463d48");
      }
      paint(g, "tapa", wall.cap.map(up), "#39353f");
    }
    const backing = mesh.walls.find((w) => w.segment === "balcony");
    if (backing) {
      const [a, b] = backing.face;
      sprite(g, "difusor-S", a.x + (b.x - a.x) * 0.72, a.y - 4);
    }
    const deck = mesh.decks[0];
    sprite(
      g,
      "canal-cabina",
      deck.x + deck.w * 0.72,
      deck.y + deck.h * 0.8 - deck.rise,
    );
    for (const o of mesh.openings) {
      const view = { left: "E", right: "W", top: "S", bottom: "N" }[o.side];
      o.jambs.forEach((j, i) => {
        sprite(
          g,
          `jamba-${view}-${i}`,
          j.reduce((s, p) => s + p.x / 4, 0),
          j.reduce((s, p) => s + p.y / 4, 0),
        );
      });
    }
    g.restore();
  }
  function prop(g, obj, mesh) {
    const p = mesh.placements.find((p) => p.id === obj.prefabId);
    if (!p) return false;
    const id = `${p.asset}-${p.view}-${obj.broken ? "roto" : "intacto"}`;
    sprite(g, id + "-sombra", obj.x, obj.y - p.elevation, id);
    return sprite(g, id, obj.x, obj.y - p.elevation);
  }
  return {
    shell,
    prop,
    get revision() {
      return revision;
    },
  };
})();
