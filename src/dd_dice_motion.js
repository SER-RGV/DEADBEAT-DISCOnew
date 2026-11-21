/* Attack choreography in presentation space only. Time comes from the combat
 * tick: pause, hit-stop and slow motion also pause/slow these gestures. */
window.DD_DICE_MOTION = (() => {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const smooth = (x) => x * x * (3 - 2 * x);
  function gesture(d, c) {
    const wind = ["AIMING", "CHARGING"].includes(d.state)
      ? smooth(clamp(d.charge * 1.5))
      : 0;
    const follow = ["RELEASE", "FLIGHT", "ROLLING"].includes(d.state)
      ? (1 - smooth(clamp(d.age / (0.17 + 0.11 * c.mass)))) *
        (0.55 + 0.45 * d.charge)
      : 0;
    const catchBeat = d.catchT > 0 ? Math.sin((Math.PI * d.catchT) / 0.18) : 0;
    const strength = reduce?.matches ? 0.35 : 1;
    return {
      lean:
        strength *
        (-0.15 * wind + 0.2 * follow - 0.05 * catchBeat) *
        Math.sqrt(c.mass),
      squat: strength * (0.08 * wind + 0.035 * catchBeat),
      reach: 19 - 32 * wind + 16 * follow,
      lift: 29 + 12 * wind + 4 * follow,
      wind,
      follow,
    };
  }
  const grip = { player: null, x: 0, y: 0, stamp: -1 };
  function attach(player, x, y, stamp) {
    Object.assign(grip, { player, x, y, stamp });
  }
  function body(d, c, anim, left) {
    const pose = gesture(d, c),
      state = anim?.state,
      age = anim?.stateTime || 0;
    const land =
      anim?.prevState === "dodge" ? Math.sin(Math.PI * clamp(age / 0.135)) : 0;
    const hurt = state === "hurt" || state === "stun";
    const stride = clamp((anim?.speed || 0) / 240),
      dir = ((anim?.prevVx || 0) / 240) * (left ? -1 : 1);
    const pulse =
      d.state === "CHARGING"
        ? Math.sin(d.motionTime * 12) * 0.009 * d.charge
        : 0;
    const recoil =
      d.state === "FLIGHT"
        ? Math.sin(Math.PI * clamp((d.age - 0.07) / 0.17)) * 0.055 * d.charge
        : 0;
    const scale = reduce?.matches ? 0.3 : 1;
    return {
      lean:
        (hurt ? -0.08 * (1 - clamp(age / 0.16)) : pose.lean - recoil) +
        scale * 0.055 * clamp(Math.abs(dir)) * Math.sign(dir),
      squat:
        (hurt ? 0.035 : pose.squat) +
        scale *
          (0.085 * land +
            pulse +
            0.015 *
              stride *
              Math.abs(Math.sin((anim?.stridePhase || 0) * Math.PI))),
    };
  }
  function hand(d, c, p) {
    if (grip.player === p && grip.stamp === d.motionTime) return grip;
    const a = d.castAngle ?? p.aimAngle,
      pose = gesture(d, c),
      near = ["READY", "AIMING", "CHARGING", "RECOVERED"].includes(d.state);
    const dir = near || d.state === "RETURNING" ? p.aimAngle : a;
    return {
      x: Math.cos(dir) * pose.reach,
      y: Math.sin(dir) * pose.reach * 0.55 - pose.lift,
    };
  }
  // Dark keyline behind light enamel: the same mark survives marble and velvet.
  function inkStroke(g, color, width) {
    g.lineWidth = width + 2;
    g.strokeStyle = '#251c30';
    g.stroke();
    g.lineWidth = width;
    g.strokeStyle = color;
    g.stroke();
  }
  // Distinct settlement silhouettes; decorative only, no extra hit events.
  function seal(g, d, c, r) {
    const t = clamp(1 - d.timer / 0.16),
      n = d.id === 20 ? 10 : d.id;
    g.save();
    g.strokeStyle = c.color;
    g.globalAlpha = 0.82 * (1 - t);
    g.lineWidth = d.id === 12 ? 3 : 1.5;
    if (d.id === 12 || d.id === 6) {
      for (let i = 0; i < (d.id === 12 ? 3 : 1); i++) {
        const radial = (r * (0.18 + 0.77 * t)) / (1 + i * 0.42);
        g.beginPath();
        g.ellipse(0, 0, radial, radial * 0.68, 0, 0, Math.PI * 2);
        inkStroke(g, c.color, g.lineWidth);
      }
    } else if (d.id === 4) {
      g.rotate(d.castAngle);
      g.beginPath();
      g.moveTo(-12, 0);
      g.lineTo(0, -5 * (1 - t));
      g.lineTo(12 + t * r, 0);
      g.lineTo(0, 5 * (1 - t));
      g.closePath();
      inkStroke(g, c.color, g.lineWidth);
    } else if (d.id === 8 && d.hits.size) {
      // Connect only actors actually contacted; never imply another target was hit.
      let x = 0,
        y = 0;
      g.beginPath();
      g.moveTo(x, y);
      for (const target of d.hits) {
        const nx = target.x - d.x,
          ny = target.y - d.y;
        g.lineTo((x + nx) * 0.5 + 4, (y + ny) * 0.5 - 6);
        g.lineTo(nx, ny);
        x = nx;
        y = ny;
      }
      inkStroke(g, c.color, g.lineWidth);
    } else if (d.id === 20) {
      g.rotate(t * 0.3);
      g.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const a = (i * Math.PI) / n,
          len = r * (i % 2 ? 0.24 : 0.4 + t * 0.46);
        g[i ? "lineTo" : "moveTo"](Math.cos(a) * len, Math.sin(a) * len);
      }
      g.closePath();
      inkStroke(g, c.color, g.lineWidth);
    } // The Splitter already renders its real fragment rays.
    g.restore();
  }
  function accents(g, d, c, p, near, h, r) {
    if (reduce?.matches) return;
    if (d.state === "RESOLVING") seal(g, d, c, r);
    g.save();
    g.strokeStyle = c.color;
    g.lineCap = "round";
    if (d.state === "CHARGING") {
      g.translate(h.x, h.y);
      g.lineWidth = 1.4;
      g.globalAlpha = 0.35 + 0.5 * d.charge;
      for (let i = 0; i < 3; i++) {
        const angle = d.heldSpin * 3 + (i * 2 * Math.PI) / 3;
        g.beginPath();
        g.arc(0, 0, 12 + 5 * d.charge, angle, angle + 0.4 + d.charge * 0.55);
        inkStroke(g, c.color, 1.65);
        // The broad end of each engraving points around the die, not towards a target.
        const r = 12 + 5 * d.charge;
        g.beginPath();
        g.moveTo(Math.cos(angle)*r, Math.sin(angle)*r);
        g.lineTo(Math.cos(angle)*(r+2.4), Math.sin(angle)*(r+2.4));
        g.stroke();
      }
    } else if (d.state === "FLIGHT" || d.state === "ROLLING") {
      // Streaks follow actual velocity (including reversal and chained hits).
      const speed = Math.hypot(d.vx, d.vy);
      g.translate(0, -10 - d.z);
      g.rotate(Math.atan2(d.vy - d.vz, d.vx));
      const len = Math.min(53, speed * 0.055) * (1 + d.charge * 0.35);
      g.globalAlpha = Math.min(0.68, 0.35 + speed / 1300);
      for (let i = d.id === 4 ? 0 : -1; i <= (d.id === 4 ? 0 : 1); i++) {
        const tail = -8 - len / (1 + Math.abs(i));
        const half = (i === 0 ? Math.min(2, c.mass + .55) : .65);
        const base = i * (d.state === 'ROLLING' ? 3 : 5);
        g.beginPath();
        g.moveTo(-6, base-half);
        g.quadraticCurveTo(-12, base, tail, base+i);
        g.lineTo(-6, base+half);
        g.closePath();
        g.fillStyle = i === 0 ? c.color : '#f0d3ae';
        g.fill();
      }
    } else if (near && d.catchT > 0) {
      const t = 1 - d.catchT / 0.18;
      g.globalAlpha = 1 - t;
      g.beginPath();
      for (let i=0; i<4; i++) {
        const a=i*Math.PI/2+.15, radius=9+13*t;
        g.moveTo(h.x+radius*Math.cos(a),h.y+radius*Math.sin(a));
        g.arc(h.x,h.y,radius,a,a+1.15);
      }
      inkStroke(g, '#f2d9b5', 1.5);
    } else if (d.state === "RETURNING") {
      const dx = p.x + h.x - d.x,
        dy = p.y + h.y - d.y,
        t = clamp(1 - d.timer / d.returnDuration);
      g.globalAlpha = 0.5 * Math.sin(Math.PI * t);
      g.beginPath();
      g.moveTo(0, -10 - d.z);
      g.quadraticCurveTo(dx * 0.55, dy * 0.55 - 28, dx, dy);
      g.setLineDash([4,3]);
      inkStroke(g, c.color, 1.5);
    }
    g.restore();
    if (d.impactT > 0 && !near) {
      const t = 1 - d.impactT / 0.16;
      g.save();
      g.strokeStyle = c.color;
      g.globalAlpha = (1 - t) * 0.85;
      g.lineWidth = 2 * (1 - t) + 0.4;
      g.beginPath();
      g.ellipse(
        d.impactX - d.x,
        d.impactY - d.y,
        7 + 25 * t,
        3 + 10 * t,
        0,
        0,
        Math.PI * 2,
      );
      g.stroke();
      g.restore();
    }
  }
  return { gesture, body, attach, hand, accents };
})();
