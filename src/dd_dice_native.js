/* Inlined inside the engine closure. Keep minified engine names on this side. */
let ddRuneOffer = {};
let ddMovingThrow = false;
const ddDiceWorld = {
  rand: () => ue.rand(),
  thrown() {
    window.DD_COMBAT_FEEL.begin(window.DD_DICE.d);
    ddMovingThrow = Math.hypot(ye.vx, ye.vy) > 40;
    un.shotsFired++;
    if (ddMovingThrow) un.shotsMoving++;
    else un.shotsStill++;
  },
  confirmed() {
    un.shotsHit++;
    if (ddMovingThrow) un.hitsMoving++;
    else un.hitsStill++;
  },
  sound(hz) {
    const { d, catalog } = window.DD_DICE,
      c = catalog[d.id],
      cast = d.state === "RELEASE";
    di(
      hz / Math.sqrt(c.mass),
      cast ? 0.035 + d.charge * 0.07 : 0.045,
      d.id === 4 ? "square" : "triangle",
      d.id === 4 ? 0.022 : 0.045,
    );
    if (cast && d.charge >= 0.75) di(hz * 0.5, 0.09, "sine", 0.05);
  },
  readyTone(c){di(c.tone*.84,.065,c.id===4?"square":"triangle",.022);},
  signal(event, c) {
    const hz = c.tone;
    if (event === "wind") di(hz * 0.58, 0.08, "sine", 0.026);
    else if (event === "full") {
      di(hz, 0.08, "sine", 0.035);
      di(hz * 1.5, 0.12, "triangle", 0.028, 0.045);
    } else if (event === "flight") di(hz * 0.75, 0.07, "sine", 0.018);
    else if (event === "catch") di(hz * 1.25, 0.09, "sine", 0.038);
  },
  energy: () => {
    ye.rollCD = Math.max(0, ye.rollCD - 0.8);
  },
  cue: (line) => Es(line, 1.45),
  reach: () => (xl === "mouse" ? ye.diceReach : undefined),
  targets() {
    const list = Ta.filter((t) => t.hp > 0 && !t._ddaDead);
    if (ir && sr && sr.entrance <= 0) list.push(sr);
    if (_o?.type === "generators" && !_o.done)
      list.push(..._o.targets.filter((t) => !t.destroyed));
    return list;
  },
  tempo: () => 1 + (ua.fire || 0),
  push(t, d, power) {
    if (t === sr || !Ta.includes(t) || t.hp <= 0) return;
    const dx = t.x - d.x,
      dy = t.y - d.y,
      len = Math.hypot(dx, dy) || 1;
    const pos = ic(t.x + (power * dx) / len, t.y + (power * dy) / len, t.r);
    t.x = pos.x;
    t.y = pos.y;
  },
  visible(from, to) {
    return from === to || !rc(from.x, from.y, to.x, to.y, 3, false);
  },
  accent(t, recipe, hops, combo) {
    const cfg = DD_COMBAT_FEEL.config;
    Tp(
      t.x,
      t.y - 40,
      ["","I","II","III"][recipe[1]]+" · "+recipe[0].toUpperCase() + " · " + hops + "× " + window.DD_DICE_MOTION.chord(recipe[2]),
      "#baf9ff",
      16,
      true,
    );
    if (zi.flashAllowed() && Yc.tier > 0)
      vs(t.x, t.y, "#84e9e3", Math.min(cfg.particles, 2 + 2 * hops), 12);
    di(330 + 110 * hops, 0.09, "triangle", cfg.volume);
    if (jl && !ie && Xl.music) {
      const root = gi()[0];
      di(root * 4, 0.14, "sine", cfg.music, 0, Xl.music);
      di(
        root * (recipe[1] > 1 ? 6 : 5),
        0.17,
        "triangle",
        cfg.music,
        0.12,
        Xl.music,
      );
    }
  },
  hit(t, damage, type, rune, reaction = false, level=0) {
    const before = t.hp,
      boss = t === sr;
    const feedback = () => {
      if (t.kind !== "generator") {
        if (before > 0 && t.hp <= 0 && Z - ddLastKill > 0.18) {
          ddLastKill = Z;
          di(boss ? 110 : 165, 0.12, "triangle", DD_COMBAT_FEEL.config.volume);
        }
        const feel = window.DD_COMBAT_FEEL;
        feel.hit(t, before - Math.max(0, t.hp), reaction);
        if (
          !reaction &&
          before > t.hp &&
          feel.combo &&
          feel.combo % feel.config.comboStep === 0
        )
          Tp(t.x, t.y - 36, "COMPÁS ×" + feel.combo, "#fdd786", 14, true);
      }
      if (before > Math.max(0, t.hp) && window.DD_DICE.d.state === "RESOLVING")
        window.DD_DICE.d.blastHit = true;
      window.DD_DICE_FEEDBACK.impact(
        t,
        before - Math.max(0, t.hp),
        window.DD_DICE.d,
        type,
        boss,
        (rank) => {
          const hz = [440, 215, 90, 132][rank];
          di(
            hz,
            0.034 + 0.022 * rank,
            rank === 0 ? "square" : "triangle",
            rank === 0 ? 0.022 : 0.05,
          );
          if (rank === 3) di(990, 0.14, "sine", 0.055, 0.045);
        },level,
      );
    };
    damage = Math.min(58, damage * (1 + (ua.damage || 0)));
    if (t.kind === "generator") {
      As(t, damage);
      feedback();
      return;
    }
    const opts = {
      pure: rune === "perforación",
      profile: lu.profileOfTypes([type]),
      flash: 0.14,
    };
    if (t === sr) {
      lu.applyBoss(
        t,
        damage * (t.exposedT > 0 ? 1.5 : 1) * (t.addsAlive > 0 ? 0.65 : 1),
        opts,
      );
      feedback();
      if (t.hp <= 0) {
        Ep(t, false, "dice");
        Ss();
        if (t.final) uu();
        ir = false;
        sr = null;
        Ts(120);
        Cs(0.3);
      }
      return;
    }
    const index = Ta.indexOf(t);
    if (index < 0) return;
    lu.applyEnemy(t, damage * nu(t), opts);
    feedback();
    if (t.hp <= 0) {
      Ta.splice(index, 1);
      Ep(t, false, "dice");
      vs(t.x, t.y, t.color, 12, 18);
    }
  },
  collide(d) {
    function reflect(nx, ny, depth) {
      d.x += nx * depth;
      d.y += ny * depth;
      const inward = d.vx * nx + d.vy * ny;
      if (inward < 0) {
        if(inward < -90 && (d.wallAt==null || d.motionTime-d.wallAt>.11 || d.motionTime<d.wallAt)){d.wallAt=d.motionTime;di(175/Math.sqrt(window.DD_DICE.catalog[d.id].mass),.045,"triangle",.024);}
        d.vx -= 1.58 * inward * nx;
        d.vy -= 1.58 * inward * ny;
      }
    }
    for (const p of tc) {
      if (!p.solid || !p.onFloor || p.hidden) continue;
      const h = ec(p, d.x, d.y, 8);
      if (h) reflect(h.nx, h.ny, h.depth);
    }
    const oldX = d.x,
      oldY = d.y;
    Qs(d, 8);
    const dx = d.x - oldX,
      dy = d.y - oldY,
      len = Math.hypot(dx, dy);
    if (len) reflect(dx / len, dy / len, 0);
  },
  blast(d, r) {
    for (const p of tc)
      if (p.destructible && !p.broken && p.onFloor && ac(p, d.x, d.y) <= r)
        pc(p, "player");
    const color = window.DD_DICE.catalog[d.id].color;
    Ra.push({ x: d.x, y: d.y, maxR: r, life: 0, maxLife: 0.36, color });
    vs(d.x, d.y, color, 16, 22);
    const crit = d.id === 20 && d.face === 20,
      rune = d.runes[d.face];
    Tp(
      d.x,
      d.y - 22,
      (crit
        ? d.blastHit
          ? "CRÍTICO · 20"
          : "20 NATURAL"
        : `D${d.id} · ${d.face}`) + (rune ? " · " + rune.toUpperCase() : ""),
      crit ? "#ffe398" : color,
      crit ? 21 : 16,
      true,
    );
    if (d.shards.length) di(930, 0.055, "triangle", 0.035, 0.03);
    di(300 + d.face * 24, 0.14, "triangle", 0.07);
  },
};
// Installed only when the development inspector exists; production never wraps hit().
let ddMeter=null;
function ddInstallMeter(){
  const meter={hits:0,totalMs:0,maxMs:0},hit=ddDiceWorld.hit;
  ddDiceWorld.hit=function(...args){const start=performance.now();try{return hit.apply(this,args);}finally{const ms=performance.now()-start;meter.totalMs+=ms;meter.maxMs=Math.max(meter.maxMs,ms);meter.hits++;}};
  window.DD_COMBAT_FEEL.observeNative(()=>({...meter,particles:Sa.length,rings:Ra.length}));
  return meter;
}
let ddBeat = -1,
  ddLastAccent = -Infinity,
  ddLastKill = -Infinity,
  ddScope = -1;
function ddFeelBeat() {
  const step = Ci.active() ? Ci.stepIndex : Ul;
  if (step === ddBeat) return;
  ddBeat = step;
  const level = DD_COMBAT_FEEL.intensity;
  if (
    level < 2 ||
    !jl ||
    ie ||
    !Xl.music ||
    step % (level === 4 ? 4 : 8) !== 0 ||
    Z - ddLastAccent < 0.45
  )
    return;
  ddLastAccent = Z;
  di(
    gi()[0] * (ir ? 1 : 2),
    0.09,
    "sine",
    DD_COMBAT_FEEL.config.music,
    0,
    Xl.music,
  );
}
let ddTap = false;
function ddDiceTick(dt, held, auto) {
  if (Mr) return;
  if(!ddMeter && window.DD_COMBAT_FEEL.observeNative)ddMeter=ddInstallMeter();
  if (ddScope !== Ot.epoch) {
    ddScope = Ot.epoch;
    ddBeat = -1;
    ddLastAccent = ddLastKill = -Infinity;
    window.DD_DICE_FEEDBACK.reset();
  }
  window.DD_COMBAT_FEEL.tick(dt, Ot.epoch, Yo.seed);
  ddFeelBeat();
  const tap = ddTap;
  ddTap = false;
  window.DD_DICE.update(
    dt,
    ye,
    held || tap,
    (auto && !held) || (tap && !held),
    ddDiceWorld,
  );
}
function ddEtching(id) {
  let hash = 0;
  for (const ch of String(id))
    hash = (Math.imul(hash, 31) + ch.charCodeAt(0)) >>> 0;
  const d = window.DD_DICE.d,
    face = 1 + (hash % d.id),
    name =
      window.DD_DICE.catalog[d.id].compatible[
        Math.floor(hash / 17) % window.DD_DICE.catalog[d.id].compatible.length
      ];
  return {
    face,
    name,
    icon: `D${d.id}`,
    desc: `Grabar ${name} en la cara ${face}`,
    color: window.DD_DICE.catalog[d.id].color,
    next: `Sustituye: ${d.runes[face] || "normal"}`,
  };
}
function ddCancelPointer() {
  if (fa || ddTap) {
    ddTap = false;
    fa = false;
    window.DD_DICE?.cancelAim();
  }
}
