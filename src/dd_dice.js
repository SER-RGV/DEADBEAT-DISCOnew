/* Simulation uses arena pixels, seconds and a separate vertical coordinate. */
window.DD_DICE = (() => {
  const geo = window.DD_DICE_GEOMETRY,
    catalog = {},
    key = "dd.dice.v1";
  for (const [id, name, mass, speed, spin, bounce, recovery, color, cost] of [
    [6, "THE HOUSE", 1, 530, 13, 0.36, 0.27, "#ffd581", 0],
    [4, "THE SHARD", 0.7, 760, 19, 0.2, 0.15, "#91ffcd", 3],
    [8, "THE REAPER", 0.85, 600, 16, 0.49, 0.24, "#6ceaff", 7],
    [10, "THE SPLITTER", 1, 550, 12, 0.31, 0.32, "#ff7ebc", 12],
    [12, "THE HAMMER", 1.8, 420, 9, 0.25, 0.42, "#ff9b70", 18],
    [20, "THE GAMBLER", 1.2, 545, 17, 0.44, 0.34, "#c79aff", 25],
  ])
    catalog[id] = {
      id,
      name,
      mass,
      speed,
      spin,
      bounce,
      recovery,
      color,
      cost,
      geometry: geo.m[id],
      impulse: 140 / Math.sqrt(mass),
      friction: id === 6 ? 0.62 : Math.min(0.8, 0.62 / mass),
      tone: 240 + 25 * id,
      variantRune: {
        4: "perforación",
        6: "fuego",
        8: "electricidad",
        10: "fragmentación",
        12: "explosión",
        20: "fortuna",
      }[id],
      results: Array.from(
        { length: id },
        (_, i) =>
          (2.2 + ((6 * (i + 1)) / id) * 1.3) *
          (id !== 20 ? 1 : i === 19 ? 3 : i < 4 ? 0.32 : 1),
      ),
    };
  let save = { marks: 0, id: 6, etched: false };
  try {
    const p = JSON.parse(localStorage.getItem(key));
    if (p && Number.isSafeInteger(p.marks) && p.marks >= 0) {
      save.marks = p.marks;
      if (catalog[p.id]?.cost <= p.marks) save.id = Number(p.id);
      save.etched =
        p.etched === true && save.marks >= catalog[save.id].cost + 10;
    }
  } catch (_) {}
  function persist() {
    try {
      localStorage.setItem(key, JSON.stringify(save));
    } catch (_) {}
  }
  const d = {},
    runes = [
      "fuego",
      "hielo",
      "electricidad",
      "veneno",
      "perforación",
      "fragmentación",
      "explosión",
      "rebote",
      "energía",
      "maleficio",
      "eco",
      "distorsión",
      "sobrecarga",
      "fortuna",
    ];
  for (const c of Object.values(catalog)) {
    c.compatible = runes.filter(
      (r) =>
        c.id === 6 ||
        c.id === 20 ||
        !{ 4: ["rebote"], 8: ["perforación"], 10: ["eco"], 12: ["rebote"] }[
          c.id
        ].includes(r),
    );
  }
  function reset() {
    window.DD_DICE_FEEDBACK?.reset();
    window.DD_COMBAT_FEEL?.reset();
    Object.assign(d, {
      id: save.id,
      state: "READY",
      motionTime: 0,
      heldSpin: 0,
      catchT: 0,
      impactT: 0,
      castAngle: 0,
      face: 1,
      charge: 0,
      a: 0,
      b: 0,
      held: false,
      runes: save.etched ? { [save.id]: catalog[save.id].variantRune } : {},
      wins: 0,
      primed: false,
    });
  }
  reset();
  function radius() {
    return (
      (2.35 + ((6 * d.face) / d.id) * 0.44) *
      14 *
      (d.id === 12 ? 1.4 : 1) *
      (["hielo", "explosión", "distorsión"].includes(d.runes[d.face])
        ? 1.38
        : 1)
    );
  }
  function prime() {
    if (d.primed) return false;
    d.primed = true;
    return true;
  }
  function trajectory(charge, reach) {
    const c = catalog[d.id],
      max = c.speed * (0.75 + 0.7 * charge),
      arc = c.impulse + 65 * charge,
      flight = (arc + Math.sqrt(arc * arc + 2 * 820 * 16)) / 820,
      speed = Math.min(max, Math.max(42, reach ?? Infinity) / flight);
    return { arc, speed, range: speed * flight };
  }
  function launch(p, w) {
    if (d.primed) {
      d.charge = 1;
      d.primed = false;
    }
    const c = catalog[d.id],
      { arc, speed: v } = trajectory(d.charge, w.reach?.());
    Object.assign(d, {
      state: "RELEASE",
      blastHit: false,
      castAngle: p.aimAngle,
      heldSpin: 0,
      x: p.x,
      y: p.y,
      z: 16,
      vx: Math.cos(p.aimAngle) * v,
      vy: Math.sin(p.aimAngle) * v,
      vz: arc,
      age: 0,
      bounces: 0,
      hits: new Set(),
      shards: [],
      a: w.rand() * 6,
      b: w.rand() * 6,
      spin: c.spin * (0.6 + w.rand()),
      timer: 0,
    });
    w.thrown?.();
    w.sound(c.tone);
  }
  const { contact, resolve } = window.DD_DICE_RULES({
    d,
    catalog,
    geo,
    radius,
    reward(w) {
      w.confirmed?.();
      save.marks++;
      d.wins++;
      if (d.wins % 3 === 0) {
        const pool = catalog[d.id].compatible;
        d.runes[d.face] = pool[Math.floor(w.rand() * pool.length)];
        w.cue?.(`CARA ${d.face} · ${d.runes[d.face]}`);
      }
      persist();
    },
  });
  function update(dt, p, held, auto, w) {
    const c = catalog[d.id];
    dt = Math.min(0.1, Math.max(0, dt));
    window.DD_DICE_FEEDBACK?.tick(dt);
    d.motionTime += dt;
    if (d.state === "READY" || d.state === "AIMING" || d.state === "CHARGING")
      d.heldSpin =
        (d.heldSpin + dt * (0.65 + d.charge * 2)) % (2 * Math.PI * 5);
    d.catchT = Math.max(0, d.catchT - dt);
    d.impactT = Math.max(0, d.impactT - dt);
    if (d.state === "RECOVERED") {
      d.state = "READY";
      d.charge = 0;
    }
    if (d.state === "READY") {
      d.x = p.x;
      d.y = p.y;
      d.z = 20;
      if ((held && !d.held) || auto) {
        d.charge = 0;
        d.state = "AIMING";
      }
    }
    if (["AIMING", "CHARGING"].includes(d.state)) {
      d.x = p.x;
      d.y = p.y;
      const oldCharge = d.charge;
      d.charge = Math.min(1, d.charge + dt * (w.tempo?.() || 1));
      if (d.charge > 0.14) {
        if (d.state === "AIMING" && held) w.signal?.("wind", c);
        d.state = "CHARGING";
      }
      if(held && oldCharge<.75 && d.charge>=.75)w.readyTone?.(c);
      if (oldCharge < 1 && d.charge === 1 && held) w.signal?.("full", c);
      if (!held || auto) launch(p, w);
    } else if (d.state === "RELEASE") {
      d.state = "FLIGHT";
      w.signal?.("flight", c);
    } else if (d.state === "FLIGHT" || d.state === "ROLLING") {
      const available = w.targets();
      for (let left = dt; left > 1e-8;) {
        const h = Math.min(left, 1 / 120);
        left -= h;
        d.age += h;
        d.x += d.vx * h;
        d.y += d.vy * h;
        d.vz -= 820 * h;
        d.z += d.vz * h;
        d.a += d.spin * h;
        d.b += d.spin * 0.73 * h;
        w.collide(d);
        if (d.z <= 0) {
          d.z = 0;
          d.state = "ROLLING";
          if (d.vz < -32 && d.bounces < 4) {
            d.bounces++;
            d.impactX = d.x;
            d.impactY = d.y;
            d.impactT = 0.16;
            // Heavy floor impact shares the kinetic ledger with direct contacts.
            for (const t of available)
              if (
                !d.hits.has(t) &&
                Math.hypot(t.x - d.x, t.y - d.y) < (t.r || 10) + 26
              )
                contact(w, t);
            d.vz = -d.vz * c.bounce;
            d.vx *= c.friction;
            d.vy *= c.friction;
            d.spin *= 0.62;
            w.sound(140 + d.bounces * 24);
          } else {
            d.vz = 0;
            const k = Math.exp(-10 * h);
            d.vx *= k;
            d.vy *= k;
            d.spin *= k;
          }
        }
        if (d.z < 34)
          for (const t of available)
            if (
              !d.hits.has(t) &&
              Math.hypot(d.x - t.x, d.y - t.y) < (t.r || 12) + 12
            )
              contact(w, t);
        d.face = geo.top(d.id, d.a, d.b);
        if (
          d.age > 1.15 ||
          (d.state === "ROLLING" && d.z === 0 && Math.hypot(d.vx, d.vy) < 24)
        ) {
          resolve(w);
          break;
        }
      }
    } else if (d.state === "RESOLVING") {
      if ((d.timer -= dt) <= 0) {
        d.timer = (c.recovery * (1 + 0.45 * d.charge)) / (w.tempo?.() || 1);
        d.returnDuration = d.timer;
        d.state = "RETURNING";
      }
    } else if (d.state === "RETURNING") {
      const k = Math.min(1, dt / Math.max(dt, d.timer));
      d.x += (p.x - d.x) * k;
      d.y += (p.y - d.y) * k;
      d.z += (20 - d.z) * k;
      if ((d.timer -= dt) <= 0) {
        d.state = "RECOVERED";
        w.signal?.("catch", c);
        d.catchT = 0.18;
      }
    }
    d.held = held;
  }
  function draw(g, p, reach) {
    const c = catalog[d.id],
      near = ["READY", "CHARGING", "AIMING", "RECOVERED"].includes(d.state);
    g.save();
    g.translate(near ? p.x : d.x, near ? p.y : d.y);
    g.strokeStyle = c.color;
    if (near) {
      g.save();
      g.rotate(p.aimAngle);
      g.beginPath();
      g.moveTo(24, 0);
      g.lineTo(42 + d.charge * 25, 0);
      const range = trajectory(d.primed ? 1 : d.charge, reach).range;
      g.moveTo(range + 7, 0);
      g.arc(range, 0, 7, 0, Math.PI * 2);
      if (d.state === "CHARGING") {
        g.moveTo(range + 12, 0);
        g.arc(range, 0, 12, 0, d.charge * Math.PI * 2);
      }

      g.stroke();
      g.restore();
    } else if (d.state !== "RETURNING") {
      g.globalAlpha = 0.3;
      g.beginPath();
      g.arc(0, 0, radius(), 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 1;
    }
    if (d.state === "RESOLVING") {
      g.beginPath();
      const t = Math.min(1, 1 - d.timer / 0.16),
        tip = 0.26 + 0.74 * Math.sqrt(t);
      for (const [x, y] of d.shards) {
        g.moveTo(x * Math.max(0, tip - 0.32), y * Math.max(0, tip - 0.32));
        g.lineTo(x * tip, y * tip);
        g.fillStyle = c.color;
        g.fillRect(x * tip - 1.4, y * tip - 1.4, 2.8, 2.8);
      }
      g.stroke();
    }
    const motion = window.DD_DICE_MOTION,
      h = motion.hand(d, c, p);
    motion.accents(g, d, c, p, near, h, d.state === "RESOLVING" ? radius() : 0);
    let back =
      d.state === "RETURNING" ? Math.min(1, 1 - d.timer / d.returnDuration) : 0;
    const release = ["RELEASE", "FLIGHT"].includes(d.state)
      ? Math.max(0, 1 - d.age / 0.085)
      : 0;
    g.translate(
      near ? h.x : h.x * (release + back),
      near
        ? h.y
        : (-10 - d.z) * (1 - release - back) +
            h.y * (release + back) -
            Math.sin(Math.PI * back) * 18,
    );
    const spin = near ? d.heldSpin : 0;
    geo.draw(
      g,
      d.id,
      d.a + spin,
      d.b + spin * 0.4,
      near ? 11 + (d.state === "CHARGING" ? 2*d.charge*Math.sqrt(c.mass) : 0) : 17 - 6 * (release + back),
      c.color,
    );
    g.restore();
  }
  function offers(rand) {
    const pool = catalog[d.id].compatible.slice(),
      out = {};
    for (let i = 0; i < 3; i++) {
      const name = pool.splice(Math.floor(rand() * pool.length), 1)[0],
        face = 1 + Math.floor(rand() * d.id),
        key = `rune${i}`;
      out[key] = {
        name,
        face,
        color: catalog[d.id].color,
        icon: `D${d.id}`,
        desc: `Graba ${name} en la cara ${face}.`,
        next: () => `Actual: ${d.runes[face] || "normal"}`,
        max: Infinity,
      };
    }
    return out;
  }
  function cancelAim() {
    if (["AIMING", "CHARGING"].includes(d.state)) {
      d.state = "READY";
      d.charge = 0;
    }
    d.held = false;
  }
  return {
    catalog,
    runes,
    prime,
    d,
    save,
    offers,
    reset,
    cancelAim,
    update,
    draw,
    radius,
    equip(id, etched = false) {
      if (!catalog[id] || catalog[id].cost + (etched ? 10 : 0) > save.marks)
        return false;
      save.id = id;
      save.etched = etched;
      persist();
      reset();
      return true;
    },
  };
})();
