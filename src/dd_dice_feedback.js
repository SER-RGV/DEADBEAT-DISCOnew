/* Presentation clock only: never spends combat RNG or pauses simulation. */
window.DD_DICE_FEEDBACK = (() => {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const pool = Array.from({ length: 12 }, () => ({ end: 0 }));
  const ink = {
    fuego: "#ff9460",
    hielo: "#a2f6ff",
    electrico: "#fff48a",
    toxico: "#9af892",
    sombrio: "#d69aff",
    explosivo: "#ffbc73",
  };
  let now = 0,
    cursor = 0,
    actors = new WeakMap(),
    voicesAt = 0,
    voiceRank = 0,
    kickAt = -1,
    kick = 0,
    kx = 0,
    ky = 0, labelCursor=0, numberAt=0, voices=0;
  function reset() {
    now = cursor = voicesAt = voiceRank = kick = 0;
    labelCursor=numberAt=voices=0;
    kickAt = -1;
    actors = new WeakMap();
    for (const p of pool) {p.end=0;p.label=null;}
  }
  function tick(dt) {
    now += Math.min(0.1, Math.max(dt, 0));
  }
  function impact(target, loss, d, type, boss, emit, level=0) {
    if (!(loss > 0)) return;
    const critical = d.state === "RESOLVING" && d.id === 20 && d.face === 20;
    const rank = critical || level===3
      ? 3
      : level===2 || (d.charge>=.75 && loss>=5) || loss >= 9 || (target.hp <= 0 && (boss || target.elite || target.mini))
        ? 2
        : loss >= 3
          ? 1
          : 0;
    const dx = target.x - d.x,
      dy = target.y - d.y,
      len = Math.hypot(dx, dy),
      a = len > 1 ? Math.atan2(dy, dx) : d.castAngle;
    const ux = Math.cos(a),
      uy = Math.sin(a),
      power =
        [1.8, 4, 7, 9][rank] *
        (boss
          ? target.exposedT > 0
            ? 0.55
            : 0.27
          : target.type === "tank"
            ? 0.48
            : 1);
    // Latch the body, not health bars, floor markers or attack telegraphs.
    actors.set(target, {
      at: now,
      x: target.x,
      y: target.y,
      ux,
      uy,
      power,
      hold: (critical ? 0.032 : rank === 2 || boss ? 0.021 : 0)*(window.DD_COMBAT_FEEL?.config.hold??1),
    });
    const p = pool[cursor++ % pool.length];
    Object.assign(p, {
      x: target.x,
      y: target.y - (target.r || 12) * 0.6,
      a,
      rank,
      at: now,
      end: now + (window.DD_COMBAT_FEEL?.config.lifetime??.18) * (0.67 + rank*.14),
      color: critical ? "#ffe398" : ink[type] || "#ffd8bf",
    });
    // Independent cursors in the same pool: a burst can overwrite a spark,
    // not the number that was admitted for 400 ms. At most four are live.
    if(now>=numberAt){
      const slot=pool[labelCursor++ % 4];
      slot.label=loss<.1?'<0.1':String(Math.round(loss*10)/10);
      slot.labelEnd=now+.40;slot.labelColor=p.color;slot.labelX=p.x;slot.labelY=p.y;numberAt=now+.11;
    }
    if (rank >= 1 && (now - kickAt > 0.19 || (rank === 3 && kick < 2))) {
      kickAt = now;
      kick = [0, 0.65, 1.6, 2.5][rank];
      kx = ux;
      ky = uy;
    }
    // Dense AoE: play one accent, allow a stronger accent to supersede it.
    if (now >= voicesAt || rank > voiceRank) {
      voices++;emit(rank);
      voicesAt = now + 0.085;
      voiceRank = rank;
    }
  }
  function react(g, t) {
    const h = actors.get(t);
    if (!h || reduced?.matches) return;
    const age = now - h.at;
    if (age > 0.17) {
      actors.delete(t);
      return;
    }
    const fade = Math.max(0, 1 - Math.max(0, age - h.hold) / (0.17 - h.hold));
    const lag = (v) => Math.max(-4, Math.min(4, v)) * fade;
    g.translate(
      lag(h.x - t.x) + h.ux * h.power * fade * fade,
      lag(h.y - t.y) + h.uy * h.power * fade * fade,
    );
    g.scale(1 + 0.009 * h.power * fade, 1 - 0.007 * h.power * fade);
  }
  function poseClock(actor, time) {
    const h = actors.get(actor);
    if (!h || h.hold === 0 || reduced?.matches) return time;
    const age = now - h.at;
    if (age < 0 || age >= 0.17) return time;
    // Hold the struck actor’s procedural animation for the contact frame,
    // then catch its clock up. The AI and collision clocks are never changed.
    return (
      time - Math.min(age, h.hold) * Math.min(1, (0.17 - age) / (0.17 - h.hold))
    );
  }
  function camera(g) {
    const t = (now - kickAt) / 0.11;
    if (reduced?.matches || t >= 1 || t < 0) return;
    const v = (window.DD_COMBAT_FEEL?.config.camera??1) * kick * (1 - t) ** 2 * Math.cos(t * Math.PI * 2);
    g.translate(-kx * v, -ky * v);
  }
  function draw(g) {
    g.save();
    for (const p of pool) {
      if(p.label && now<p.labelEnd){const life=(p.labelEnd-now)/.4;g.globalAlpha=Math.min(1,life*2.5);g.fillStyle=p.labelColor;g.textAlign='center';g.font='bold 12px monospace';g.fillText(p.label,p.labelX+10,p.labelY-10-10*(1-life));}
      if (now >= p.end) continue;
      const t = (now - p.at) / (p.end - p.at),
        count = reduced?.matches ? 2 : 3 + 2 * p.rank;
      g.globalAlpha = 1 - t;
      g.strokeStyle = p.color;
      g.lineWidth = 1.8 - t;
      g.beginPath();
      for (let i = 0; i < count; i++) {
        const a = p.a + (i - (count - 1) / 2) * 0.72,
          r = 3 + t * (7 + p.rank * 4),
          x = Math.cos(a),
          y = Math.sin(a);
        g.moveTo(p.x + x * r, p.y + y * r);
        g.lineTo(p.x + x * (r + 4 + p.rank), p.y + y * (r + 4 + p.rank));
      }
      g.stroke();
      if (p.rank >= 2) {
        const r = 4 + t * (p.rank === 3 ? 19 : 12);
        g.beginPath();
        g.ellipse(p.x, p.y, r, r * 0.75, p.a, 0, Math.PI * 2);
        g.stroke();
      }
    }
    g.restore();
  }
  return { stats:()=>({marks:pool.filter(p=>now<p.end).length,impactAccents:voices}),reset, tick, impact, react, poseClock, camera, draw };
})();
