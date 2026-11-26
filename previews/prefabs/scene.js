// Offline art proof: no engine, collision, save or combat hooks.
(async () => {
  const el = (id) => document.getElementById(id),
    canvas = el("scene"),
    g = canvas.getContext("2d"),
    base = "../../docs/SALAS/PREFABS/";
  async function json(url) {
    const r = await fetch(url);
    if (!r.ok) throw Error(url);
    return r.json();
  }
  const [rooms, arch, props] = await Promise.all([
    json("rooms.json"),
    json(base + "lote-01/kit.json"),
    json(base + "lote-02/kit.json"),
  ]);
  let room = rooms[0];
  const images = {},
    patterns = {};
  async function load(id, url) {
    const im = new Image();
    im.src = url;
    await im.decode();
    images[id] = im;
  }
  await Promise.all([
    load(
      "actor",
      "../../assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png",
    ),
    ...Object.entries(arch.assets).map(([id, a]) =>
      load(id, base + "lote-01/" + a.file),
    ),
    ...Object.entries(props.assets).flatMap(([id, a]) => [
      load(id, base + "lote-02/png/" + a.file),
      load(id + "-s", base + "lote-02/png/" + a.shadowFile),
    ]),
  ]);
  function poly(points) {
    g.beginPath();
    points.forEach(({ x, y }, i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
  }
  function material(id, points) {
    if (!patterns[id]) {
      const pat = g.createPattern(images[id], "repeat");
      pat.setTransform(new DOMMatrix().scale(0.5));
      patterns[id] = pat;
    }
    poly(points);
    g.fillStyle = patterns[id];
    g.fill();
  }
  function sprite(id, x, y, pivot) {
    const im = images[id];
    g.drawImage(
      im,
      x - pivot[0] / 2,
      y - pivot[1] / 2,
      im.width / 2,
      im.height / 2,
    );
  }
  function draw() {
    const W = canvas.clientWidth,
      H = canvas.clientHeight,
      ratio = Math.min(devicePixelRatio, 2);
    if (canvas.width !== Math.round(W * ratio))
      canvas.width = Math.round(W * ratio);
    if (canvas.height !== Math.round(H * ratio))
      canvas.height = Math.round(H * ratio);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    const focus = el("focus").value,
      deck = room.decks[0],
      item = room.placements.find((p) => p.id === focus),
      gate = room.openings.find((p) => p.to === focus);
    const camera = item
      ? { x: item.anchor.x, y: item.anchor.y - item.elevation - 30 }
      : gate
        ? gate.origin
        : focus === "deck"
          ? { x: deck.x + deck.w / 2, y: deck.y + deck.h / 2 }
          : null;
    const z = camera
      ? Math.min(W / 480, H / 310)
      : Math.min(W / 1380, H / 1040);
    g.setTransform(
      ratio * z,
      0,
      0,
      ratio * z,
      ratio * (W / 2 - z * (camera?.x ?? 605)),
      ratio * (H / 2 - z * (camera?.y ?? 386)),
    );
    material("suelo", room.outline);
    const queue = [];
    for (const w of room.walls) {
      const up = (p) => ({ x: p.x, y: p.y - w.height });
      poly([
        ...w.face,
        ...w.face
          .slice()
          .reverse()
          .map((p) => ({ x: p.x + w.height * 0.16, y: p.y + w.height * 0.25 })),
      ]);
      g.fillStyle = "#100c1640";
      g.fill();
      queue.push([
        Math.max(...w.face.map((p) => p.y)),
        () => {
          for (let i = 0; i < 4; i++) {
            const a = w.cap[i],
              b = w.cap[(i + 1) % 4];
            material("cara", [a, b, up(b), up(a)]);
          }
          material("tapa", w.cap.map(up));
        },
      ]);
    }
    for (const o of room.openings) {
      const view = { top: "S", bottom: "N", left: "E", right: "W" }[o.side],
        id = "umbral-" + view;
      sprite(id, o.origin.x, o.origin.y, arch.assets[id].pivotPx);
      o.jambs.forEach((j, i) => {
        const k = `jamba-${view}-${i}`,
          x = j.reduce((v, p) => v + p.x / 4, 0),
          y = j.reduce((v, p) => v + p.y / 4, 0);
        queue.push([
          Math.max(...j.map((p) => p.y)),
          () => sprite(k, x, y, arch.assets[k].pivotPx),
        ]);
      });
    }
    const d = deck;
    g.drawImage(images.cantoTarima, d.x, d.y + d.h - d.rise, d.w, d.rise);
    g.drawImage(images.tarima, d.x, d.y - d.rise, d.w, d.h);
    for (const t of d.treads) {
      g.drawImage(images["pisada-" + d.steps], t.x, t.y - t.z, t.w, t.h);
      g.drawImage(images.contrahuella, t.x, t.y - t.z + t.h, t.w, t.riser);
    }
    for (const p of room.placements) {
      const id = `${p.asset}-${p.view}-${el("broken").checked && p.destructible ? "roto" : "intacto"}`,
        pv = props.assets[id].pivotPx;
      queue.push([
        p.sortY,
        () => {
          sprite(id + "-s", p.anchor.x, p.anchor.y - p.elevation, pv);
          sprite(id, p.anchor.x, p.anchor.y - p.elevation, pv);
        },
      ]);
    }
    if (el("probe").checked) {
      const a = prefabDepthProbe(room, focus, Number(el("phase").value) / 100);
      queue.push([
        a.y,
        () => {
          g.fillStyle = "#120e18a0";
          g.beginPath();
          g.ellipse(a.x, a.y - a.level, 17, 6, 0, 0, Math.PI * 2);
          g.fill();
          const im = images.actor,
            scale = 96 / 462;
          g.drawImage(
            im,
            a.x - 140 * scale,
            a.y - a.level - 505 * scale,
            im.width * scale,
            im.height * scale,
          );
        },
      ]);
      el("height").textContent =
        `${el("phase").value}% · cota +${Math.round(a.level)} u`;
    } else el("height").textContent = "";
    queue.sort((a, b) => a[0] - b[0]).forEach((e) => e[1]());
    if (el("guides").checked) {
      g.lineWidth = 2 / z;
      g.font = `${13 / z}px monospace`;
      g.strokeStyle = "#9de0ca";
      g.fillStyle = "#def7df";
      for (const p of room.placements) {
        const { x, y } = p.anchor,
          sy = y - p.elevation;
        g.beginPath();
        g.arc(x, sy, 3 / z, 0, 7);
        g.fill();
        g.beginPath();
        g.moveTo(x, sy);
        g.lineTo(x + p.normal.x * 40, sy + p.normal.y * 40);
        g.stroke();
        g.fillText(p.id + " / " + p.view, x + 6, sy - 6);
      }
      for (const o of room.openings) {
        poly(o.threshold);
        g.stroke();
        g.fillText(o.to, o.landing.x, o.landing.y);
      }
    }
    el("status").textContent =
      `${room.key} · ${room.template}  /  ${d.steps} peldaños · cota +${d.rise}  /  ${room.openings.length} aberturas`;
  }
  let raf = 0,
    startTime = 0;
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    el("play").textContent = "Reproducir";
  }
  function tick(t) {
    el("phase").value = Math.min(100, Math.floor((t - startTime) / 60));
    draw();
    if (+el("phase").value < 100) raf = requestAnimationFrame(tick);
    else stop();
  }
  el("play").onclick = () => {
    if (raf) return stop();
    if (+el("phase").value === 100) el("phase").value = 0;
    startTime = performance.now() - 60 * +el("phase").value;
    el("play").textContent = "Pausar";
    raf = requestAnimationFrame(tick);
  };
  el("phase").oninput = () => {
    stop();
    draw();
  };
  el("probe").onchange = () => {
    stop();
    el("phase").disabled = el("play").disabled = !el("probe").checked;
    draw();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  function select(r) {
    stop();
    el("phase").value = 0;
    room = r;
    el("focus").replaceChildren(
      new Option("Planta completa", "all"),
      new Option("Tarima / escalera", "deck"),
      ...r.placements.map((p) => new Option(p.asset + " · " + p.view, p.id)),
      ...r.openings.map((d) => new Option("Umbral → " + d.to, d.to)),
    );
    for (const other of rooms)
      el(other.key).setAttribute("aria-pressed", other === r);
    draw();
  }
  rooms.forEach((r) => (el(r.key).onclick = () => select(r)));
  for (const id of ["focus", "guides", "broken"]) el(id).onchange = draw;
  el("focus").onchange = () => {
    stop();
    el("phase").value = 0;
    draw();
  };
  new ResizeObserver(draw).observe(canvas);
  select(room);
})().catch(
  (e) =>
    (document.getElementById("status").textContent =
      "No se pudo montar la sala: " + e.message),
);
