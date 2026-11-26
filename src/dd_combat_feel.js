/* Run-local. One equipped die; a successful engraved face can resonate with the
 * next throw. No extra equipment slot, currency, projectiles or damage solver. */
window.DD_COMBAT_FEEL = (() => {
  const config = Object.freeze({
    memory: 4,
    comboWindow: 2.8,
    comboStep: 5,
    charge: 0.75,
    cooldown: 1.6,
    window: 3,
    maxBursts: 3,
    maxDepth: 3,
    range: 148,
    maxDamage: 5,
    camera: 1,
    hold: 1,
    particles: 8,
    lifetime: 0.18,
    volume: 0.035,
    music: 0.018,
    resonance: 1.05,
    links: 8,
  });
  // Ordered by specificity. Only the first eligible recipe can consume a roll.
  const recipes = [
    [
      "Sobrecarga disco",
      3,
      ["fuego", "electricidad", "carga", "racha"],
      0.78,
      "electrico",
    ],
    ["Arco térmico", 2, ["fuego", "electricidad", "carga"], 0.85, "fuego"],
    ["Corte de retorno", 2, ["perforación", "rebote", "carga"], 0.85, "fisico"],
    ["Pulso tóxico", 2, ["veneno", "explosión", "grupo"], 0.85, "toxico"],
    ["Circuito cruzado", 1, ["fuego", "electricidad"], 0.95, "electrico"],
    ["Escarcha de veinte", 2, ["hielo", "crítico", "fortuna"], 1, "hielo"],
    ["Cristal de pista", 1, ["hielo", "carga"], 0.95, "hielo"],
    ["Contratiempo", 1, ["carga", "grupo"], 0.85, "fisico"],
    ["Eco de cara", 1, ["afinada", "carga"], 0.9, "fisico"],
  ];
  let serial = 0,
    cast = 0,
    seq = 0,
    seed,
    clock,
    combo,
    last,
    memory,
    expires,
    cd,
    bursts,
    seen,
    origin,
    resolved,
    tier,
    log,
    scope;
  const debug = false; /* DEV_BUILD */
  function event(kind, detail = {}, depth = 0) {
    if (debug) {
      if (log.length === 32) log.shift();
      log.push({ event: ++serial, chain: cast, depth, kind, ...detail });
    } else serial++;
  }
  const traces = Array.from({ length: config.links }, () => ({ end: 0 }));
  let cursor = 0;
  function trace(a, b, recipe) {
    const line = traces[cursor++ % traces.length];
    Object.assign(line, {
      x: a.x,
      y: a.y,
      u: b.x,
      v: b.y,
      color:
        recipe[4] === "toxico"
          ? "#adf394"
          : recipe[4] === "fuego"
            ? "#ffbb73"
            : "#94e5fa",
      end: clock + config.lifetime,
    });
  }
  function draw(g) {
    g.save();
    g.lineWidth = 1.6;
    for (const l of traces) {
      if (clock >= l.end) continue;
      g.strokeStyle = l.color;
      g.globalAlpha = (0.65 * (l.end - clock)) / config.lifetime;
      g.beginPath();
      g.moveTo(l.x, l.y);
      g.lineTo((l.x + l.u) / 2 + 3, (l.y + l.v) / 2 - 4);
      g.lineTo(l.u, l.v);
      g.stroke();
    }
    g.restore();
  }
  function modifier(d, c) {
    return d.runes[d.face] === c.variantRune ? config.resonance : 1;
  }
  function reset(newSeed = 0) {
    cursor = 0;
    for (const l of traces) l.end = 0;
    seed = newSeed >>> 0;
    clock = combo = seq = cast = tier = 0;
    last = cd = expires = -Infinity;
    memory = null;
    seen = new Set();
    origin = null;
    resolved = true;
    bursts = [];
    log = [];
    scope = null;
  }
  reset();
  function tick(dt, key, runSeed) {
    if (scope !== key) {
      reset(runSeed);
      scope = key;
    }
    clock += Math.min(0.1, Math.max(0, dt));
    if (clock - last > config.comboWindow) {
      combo = tier = 0;
    }
    while (bursts.length && clock - bursts[0] >= config.window) bursts.shift();
  }
  function begin(d) {
    seq++;
    cast = ++serial;
    resolved = false;
    seen.clear();
    origin = null;
    if(debug)event("lanzamiento",{die:d?.id,charge:d?.charge});
  }
  function hit(t, loss, isReaction) {
    if (!(loss > 0) || !cast) return;
    combo++;
    last = clock;
    if (!isReaction) {
      origin = t;
      seen.add(t);
    }
    tier = Math.max(tier, combo >= config.comboStep ? 2 : 1);
    event(t.hp <= 0 ? "baja" : "impacto", { combo }, isReaction ? 1 : 0);
  }
  function roll(id, face) {
    let x =
      seed ^ Math.imul(seq, 0x9e3779b1) ^ Math.imul(id * 32 + face, 0x85ebca6b);
    x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
    return ((x ^ (x >>> 15)) >>> 0) / 4294967296;
  }
  function resolve(d, c, w) {
    if (resolved) return;
    if(!origin){resolved=true;if(debug)event("cara",{die:d.id,face:d.face,decision:"sin impacto"});return;}
    resolved = true;
    const rune = d.runes[d.face],
      tags = new Set([c.variantRune, rune]);
    if (memory && clock <= expires) tags.add(memory);
    if (rune) {
      memory = rune;
      expires = clock + config.memory;
    }
    if (d.charge >= config.charge) tags.add("carga");
    if (rune === c.variantRune) tags.add("afinada");
    if (d.id === 20 && d.face === 20) tags.add("crítico");
    if (seen.size >= 2) tags.add("grupo");
    if (combo >= config.comboStep) tags.add("racha");
    const recipe = recipes.find((r) => r[2].every((t) => tags.has(t)));
    const reason = !recipe
      ? "sin combinación"
      : clock < cd
        ? "enfriamiento"
        : bursts.length >= config.maxBursts
          ? "presupuesto"
          : roll(d.id, d.face) >= recipe[3]
            ? "probabilidad"
            : null;
    event("cara", {
      die: d.id,
      face: d.face,
      tags: [...tags].filter(Boolean),
      decision: reason || recipe[0],
    });
    if (reason) return;
    let from = origin,
      hops = 0;
    const targets = w.targets(),
      used = new Set();
    for (
      let depth = 1;
      depth <= Math.min(recipe[1], config.maxDepth);
      depth++
    ) {
      let best = null,
        dist = config.range;
      for (const t of targets) {
        if (t.hp <= 0 || used.has(t) || t.kind === "generator") continue;
        const gap = Math.hypot(t.x - from.x, t.y - from.y);
        if (
          (t !== from || !best) &&
          gap < config.range &&
          (best === from || gap < dist) &&
          w.visible(from, t)
        ) {
          best = t;
          dist = gap;
        }
      }
      if (!best) break;
      used.add(best);
      w.hit(
        best,
        Math.min(config.maxDamage, c.results[d.face - 1] * 0.38) *
          0.72 ** (depth - 1),
        recipe[4],
        undefined,
        true,
        recipe[1],
      );
      trace(from, best, recipe);
      from = best;
      hops++;
      if(debug)event(recipe[0], { die: d.id,target:best.type||best.kind||"actor",x:best.x,y:best.y }, depth);
    }
    if (hops) {
      bursts.push(clock);
      cd = clock + config.cooldown;
      tier = recipe[1] === 3 ? 4 : 3;
      w.accent(from, recipe, hops, combo);
    } else event("rechazo", { decision: "sin objetivo visible" });
  }
  const api = {
    get retained(){return clock<expires?memory:null;},
    get seconds(){return Math.max(0,expires-clock);},
    hint(c) {
      const example=recipes.find(r=>r[1]===1 && r[2].includes(c.variantRune)) || recipes.find(r=>r[2].includes(c.variantRune)) || recipes.at(-1);
      return `Afinidad: ${c.variantRune}. Graba esa runa para reforzar su cara un ${Math.round((config.resonance-1)*100)} %. ${example[0]}: ${example[2].join(' + ')}. Una cara acertada conserva su elemento durante ${config.memory} s.`;
    },
    config,
    draw,
    modifier,
    reset,
    tick,
    begin,
    hit,
    resolve,
    get intensity() {
      return tier;
    },
    get combo() {
      return combo;
    },
  };
  let nativeStats;
  if(debug)api.observeNative=reader=>{nativeStats=reader;};
  if (debug)
    api.inspect = () => ({
      scope,native:nativeStats?.(),
      die:window.DD_DICE?.d.id,face:window.DD_DICE?.d.face,memory:api.retained,seconds:api.seconds, feedback:window.DD_DICE_FEEDBACK?.stats?.(),
      combo,
      tier,
      cast,
      links: traces.filter((l) => l.end > clock).length,
      remaining: Math.max(0, cd - clock),
      bursts: bursts.length,
      events: log.slice(),
    });
  return Object.freeze(api);
})();
