/* Only Refuge-owned milestones. Native balances, run history, dice and outfits
 * remain authoritative in their own stores. Unknown save versions are read-only. */
window.DD_REFUGE_RECORD = (() => {
  "use strict";
  const key = "dd_refuge_record_v1";
  const npcs = ["dj", "bar", "armorer"];
  const finds = {
    sleeve: {
      zone: "bedroom",
      name: "Funda vacía",
      description: "El cartón conserva el surco de un disco.",
    },
    groove: {
      zone: "rest",
      name: "Surco de prueba",
      description: "Una marca de aguja bajo el brazo del sillón.",
    },
    plate: {
      zone: "gallery",
      name: "Placa de registro",
      description: "La primera placa del expositor lleva el sello del Refugio.",
    },
  };
  const count = (v) =>
    Number.isSafeInteger(v) && v >= 0 ? Math.min(v, 999999) : 0;
  let rec, locked;
  function load() {
    let raw = null;
    locked = false;
    try {
      raw = JSON.parse(localStorage.getItem(key));
    } catch (_) {}
    locked = !!raw && raw.v !== undefined && raw.v !== 1;
    const r = raw?.v === 1 ? raw : {};
    rec = {
      v: 1,
      talks: {},
      found: {},
      events: {},
      last: ["win", "loss"].includes(r.last) ? r.last : null,
      repairs: Math.min(3, count(r.repairs)),
      quiet: r.quiet === true,
    };
    for (const n of npcs) {
      rec.talks[n] = count(r.talks?.[n]);
      for (const event of ["loss", "win", "boss", "find", "repair", "craft", "memory"]) {
        const id = n + ":" + event;
        if (r.events?.[id] === true) rec.events[id] = true;
      }
    }
    for (const id of Object.keys(finds))
      if (r.found?.[id] === true) rec.found[id] = true;
    rec.imprint = Object.keys(rec.found).length === 3 && r.imprint === true;
    rec.keepsake = Object.hasOwn(rec.found, r.keepsake) ? r.keepsake : null;
  }
  function save() {
    if (!locked)
      try {
        localStorage.setItem(key, JSON.stringify(rec));
      } catch (_) {}
  }
  function discover(id) {
    if (!Object.hasOwn(finds, id) || rec.found[id]) return "";
    rec.found[id] = true;
    save();
    return "Hallazgo: " + finds[id].name + ". " + finds[id].description;
  }
  function talk(id) {
    if (!npcs.includes(id)) return 0;
    const n = rec.talks[id];
    rec.talks[id] = Math.min(999999, n + 1);
    save();
    return n;
  }
  function repair(progress = { history: [] }) {
    if (rec.repairs === 3)
      return "Restauración terminada: iluminación, reproductor y vitrina de la galería.";
    if (rec.repairs === 2 && (!rec.imprint || !progress.history.length))
      return "Vitrina de galería · Sin coste en fichas. Requiere el sello del archivo y una incursión registrada.";
    if (!rec.repairs && !rec.talks.armorer)
      return "Lámparas del salón · Sin coste en fichas. Antes, consulta a la Armera.";
    if (rec.repairs === 1 && !rec.found.groove)
      return "Reproductor · Sin coste en fichas. Falta examinar el sillón de descanso.";
    rec.repairs++;
    save();
    return rec.repairs === 1
      ? "Circuito restaurado: las lámparas del salón están encendidas."
      : rec.repairs === 2
        ? "Reproductor restaurado: puedes controlar la música desde el sillón."
        : "Vitrina restaurada. Los hitos de tus incursiones se exponen en la galería.";
  }
  function event(n, p) {
    if (!npcs.includes(n)) return null;
    const conditions = {
      win: rec.last === "win",
      loss: rec.last === "loss",
      boss: p.achievements.includes("first_boss"),
      find: Object.keys(rec.found).length === 3,
      repair: rec.repairs >= 2,
    };
    for (const [id, ready] of Object.entries(conditions))
      if (ready && !rec.events[n + ":" + id]) {
        rec.events[n + ":" + id] = true;
        save();
        return id;
      }
    return null;
  }
  load();
  return Object.freeze({
    key,
    load,
    discover,
    talk,
    repair,
    finds,
    event,
    topic(n,topic) {
      if(!npcs.includes(n)||!["craft","memory"].includes(topic))return;
      rec.events[n+":"+topic]=true;save();
    },
    displayNext() {
      const keys = Object.keys(finds).filter((k) => rec.found[k]);
      if (!keys.length) return null;
      rec.keepsake = keys[(keys.indexOf(rec.keepsake) + 1) % keys.length];
      save();
      return finds[rec.keepsake];
    },
    reveal() {
      if (rec.imprint || Object.keys(rec.found).length !== 3) return false;
      rec.imprint = true;
      save();
      return true;
    },
    get imprint() {
      return rec.imprint;
    },
    get keepsake() {
      return rec.keepsake;
    },
    outcome(won) {
      rec.last = won ? "win" : "loss";
      save();
    },
    get repairs() {
      return rec.repairs;
    },
    get quiet() {
      return rec.quiet;
    },
    toggle() {
      rec.quiet = !rec.quiet;
      save();
      return rec.quiet;
    },
    snapshot: () => JSON.parse(JSON.stringify(rec)),
  });
})();
