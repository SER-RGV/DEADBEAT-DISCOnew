/* Ephemeral practice. No bridge, RNG, storage or references to combat entities. */
window.DD_HUB_RANGE = function (layout) {
  let session = null;
  return {
    enter() {
      session = {
        hits: 0,
        shot: null,
        cooldown: 0,
        boost: 0,
        recover: 0,
        flash: null,
      };
    },
    leave() {
      session = null;
    },
    get current() {
      return session;
    },
    step(dt, x, y, angle, fire, dash) {
      const s = session;
      if (!s) return 1;
      if (!layout.contains(layout.lane, x, y)) {
        session = null;
        return 1;
      }
      if (dash && s.recover <= 0) {
        s.boost = 0.13;
        s.recover = 0.65;
      }
      const speed = s.boost > 0 ? 2.6 : 1;
      s.boost -= dt;
      s.recover -= dt;
      s.cooldown -= dt;
      if (s.flash && (s.flash.time -= dt) <= 0) s.flash = null;
      if (fire && s.cooldown <= 0 && !s.shot) {
        s.shot = { x, y, dx: Math.cos(angle) * 620, dy: Math.sin(angle) * 620 };
        s.cooldown = 0.22;
      }
      const p = s.shot;
      if (!p) return speed;
      const dx = p.dx * dt,
        dy = p.dy * dt;
      for (const t of layout.targets) {
        const k = Math.max(
          0,
          Math.min(
            1,
            ((t.x - p.x) * dx + (t.y - p.y) * dy) / (dx * dx + dy * dy || 1),
          ),
        );
        if (Math.hypot(t.x - p.x - k * dx, t.y - p.y - k * dy) <= t.r + 4) {
          s.hits++;
          s.flash = { target: t, time: 0.18 };
          s.shot = null;
          return speed;
        }
      }
      p.x += dx;
      p.y += dy;
      if (!layout.contains(layout.lane, p.x, p.y)) s.shot = null;
      return speed;
    },
  };
};
