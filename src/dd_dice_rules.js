/* One kinetic ledger per throw and one area ledger per resolution.
 * The adapter owns mutations of native enemies, bosses and objectives. */
window.DD_DICE_RULES = function ({ d, catalog, geo, radius, reward }) {
  function contact(w, t) {
    const c = catalog[d.id];
    if (d.hits.has(t)) return;
    d.hits.add(t);
    w.hit(
      t,
      c.mass *
        (1 + d.charge) *
        2 *
        (d.id === 8 ? 0.82 ** Math.min(4, d.hits.size - 1) : 1),
      "fisico",
    );
    if (d.id === 8 && d.hits.size < 4) {
      let next = null,
        dist = 170;
      for (const other of w.targets()) {
        const r = Math.hypot(other.x - d.x, other.y - d.y);
        if (!d.hits.has(other) && r < dist && r > 1) {
          next = other;
          dist = r;
        }
      }
      if (next) {
        const v = Math.hypot(d.vx, d.vy) * 0.82;
        d.vx = ((next.x - d.x) * v) / dist;
        d.vy = ((next.y - d.y) * v) / dist;
      }
    } else if (d.id !== 4) {
      d.vx *= 0.76;
      d.vy *= 0.76;
    }
  }
  function resolve(w) {
    d.state = "RESOLVING";
    d.timer = 0.16;
    const rune = d.runes[d.face],
      r = radius(),
      c = catalog[d.id];
    let dmg = c.results[d.face - 1] * (1 + d.charge * 0.8) * c.mass;
    dmg *= window.DD_COMBAT_FEEL?.modifier(d,c) ?? 1;
    if (rune === "fuego") dmg *= 1.85;
    if (rune === "hielo") dmg *= 1.35;
    if (rune === "sobrecarga") dmg *= 2.5;
    if (rune === "fortuna" && w.rand() < 0.5) dmg *= 2;
    if (rune === "maleficio") dmg *= 1.3;
    const type =
      {
        fuego: "fuego",
        hielo: "hielo",
        electricidad: "electrico",
        veneno: "toxico",
        maleficio: "sombrio",
        explosión: "explosivo",
      }[rune] || "fisico";
    let count = 0;
    const struck = new Set();
    let kills = 0;
    function strike(t, amount) {
      struck.add(t);
      w.hit(t, Math.min(58, amount), type, rune);
      if (d.id === 12 || rune === "distorsión")
        w.push?.(t, d, rune === "distorsión" ? -19 : 23);
      if (t.hp <= 0) kills++;
      count++;
    }
    const targets = w.targets();
    for (const t of targets) {
      if (Math.hypot(t.x - d.x, t.y - d.y) > r + (t.r || 10)) continue;
      strike(t, dmg);
      if (d.id === 12 || rune === "hielo")
        t.freezeTimer = Math.max(
          t.freezeTimer || 0,
          rune === "hielo" ? 1 : 0.25,
        );
    }
    if (d.id === 10 || rune === "fragmentación") {
      for (let i = 0; i < 6; i++) {
        const angle = d.a + (i * Math.PI) / 3,
          x = Math.cos(angle),
          y = Math.sin(angle);
        let closest = r * 1.9,
          hit = null;
        for (const t of targets) {
          if (struck.has(t)) continue;
          const dx = t.x - d.x,
            dy = t.y - d.y,
            along = dx * x + dy * y;
          if (
            along > 0 &&
            along < closest &&
            Math.abs(dx * y - dy * x) < (t.r || 10) + 5
          ) {
            closest = along;
            hit = t;
          }
        }
        d.shards.push([x * closest, y * closest]);
        if (hit) strike(hit, dmg * 0.55);
      }
    }
    if (["electricidad", "rebote", "eco"].includes(rune)) {
      let origin = d;
      for (let i = 0; i < (rune === "electricidad" ? 4 : 1); i++) {
        let next = null,
          dist = r * 1.6;
        for (const t of targets) {
          const gap = Math.hypot(t.x - origin.x, t.y - origin.y);
          if (!struck.has(t) && gap < dist) {
            next = t;
            dist = gap;
          }
        }
        if (!next) break;
        strike(next, dmg * 0.65 ** (i + 1));
        origin = next;
      }
    }
    const n = geo.m[d.id].f[d.face - 1].n;
    d.a = Math.atan2(-n[2], n[1]);
    d.b = Math.atan2(n[0], Math.hypot(n[1], n[2]));
    d.z = 0;
    if (
      kills >= 2 ||
      (d.id === 20 && d.face === 20) ||
      (d.id === 8 && d.hits.size >= 3)
    )
      w.cue?.(
        kills >= 2
          ? "TEMPO: ¡Barrido múltiple!"
          : d.id === 8
            ? "TEMPO: ¡Sigue esa cadena!"
            : "TEMPO: ¡Veinte natural!",
      );
    if(w.accent)window.DD_COMBAT_FEEL.resolve(d,c,w);
    w.blast(d, r);
    if (count || d.hits.size) {
      if (rune === "energía") w.energy();
      reward(w);
    }
  }
  return { contact, resolve };
};
