/* Independent viewport: only imports the immutable-by-convention floor description.
   Layout units are unchanged. World distances/fixtures scale by k; avatar radius,
   body size and walking velocity remain fixed in world units. */
(() => {
  "use strict";
  const grey = window.DD_HUB_LAYOUT,
    organic = organicVestibule(grey),
    relief = previewRelief(organic);
  let L = organic;
  const B = L.bounds,
    $ = (id) => document.getElementById(id),
    c = $("view"),
    g = c.getContext("2d");
  const images = {},
    patterns = {},
    keys = new Set(),
    player = { ...L.spawn };
  let k = 2,
    camera = "all",
    last = 0,
    failed = 0,
    remaining = 0,
    dirty = true;
  ART.crack = "environments/threshold_descent_crack";
  remaining = Object.keys(ART).length;
  for (const [id, src] of Object.entries(ART)) {
    const im = new Image();
    im.onload = () => {
      images[id] = im;
      remaining--;
      dirty = true;
    };
    im.onerror = () => {
      failed++;
      remaining--;
      dirty = true;
    };
    im.src = "../../assets/" + src + ".png";
  }
  let stations = new Map(L.stations.map((s) => [s.id, s]));
  for (const s of L.stations)
    $("station").add(
      new Option(
        String(L.stations.indexOf(s) + 1).padStart(2, "0") + " · " + s.label,
        s.id,
      ),
    );
  function mode(v) {
    k = v;
    L = v === 1 ? grey : organic;
    stations = new Map(L.stations.map((s) => [s.id, s]));
    $("grey").setAttribute("aria-pressed", k === 1);
    $("final").setAttribute("aria-pressed", k === 2);
    $("dimensions").textContent = `${B.w * k} × ${B.h * k} u · 16 estaciones`;
    if (!clear(player.x, player.y)) Object.assign(player, L.spawn);
    dirty = true;
  }
  function cam(id) {
    camera = id;
    $("station").value = id;
    $("scene").textContent =
      id === "all"
        ? "PLANTA GENERAL"
        : id === "walk"
          ? "RECORRIDO"
          : stations.get(id).label.toUpperCase();
    dirty = true;
  }
  $("grey").onclick = () => mode(1);
  $("final").onclick = () => mode(2);
  $("overview").onclick = () => cam("all");
  $("walk").onclick = () => {
    cam("walk");
    c.focus();
  };
  $("station").onchange = (e) => cam(e.target.value);
  for (const id of ["hud", "rave", "foot", "fronts"])
    $(id).onchange = () => {
      dirty = true;
      $("overlay").hidden = !$("hud").checked;
      $("mapHud").hidden = $("skills").hidden = !$("hud").checked;
    };
  const allowed = [
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "KeyA",
    "KeyD",
    "KeyW",
    "KeyS",
  ];
  function press(key) {
    keys.add(key);
    cam("walk");
  }
  c.onkeydown = (e) => {
    if (allowed.includes(e.code)) {
      e.preventDefault();
      press(e.code);
    }
  };
  window.onkeyup = (e) => keys.delete(e.code);
  window.onblur = () => keys.clear();
  c.onblur = () => keys.clear();
  for (const b of document.querySelectorAll("[data-key]")) {
    b.onpointerdown = (e) => {
      b.setPointerCapture(e.pointerId);
      press(b.dataset.key);
    };
    b.onlostpointercapture = () => keys.delete(b.dataset.key);
  }
  function clear(x, y) {
    const r = L.radius / k;
    if (x < B.x + r || y < B.y + r || x > B.x + B.w - r || y > B.y + B.h - r)
      return false;
    if (L.fits && !L.fits(x, y, r)) return false;
    return L.solids.every(
      (b) =>
        Math.hypot(
          x - Math.max(b.x, Math.min(b.x + b.w, x)),
          y - Math.max(b.y, Math.min(b.y + b.h, y)),
        ) >= r,
    );
  }
  function move(dt) {
    const held = (a, b) => +(keys.has(a) || keys.has(b));
    const dx = held("ArrowRight", "KeyD") - held("ArrowLeft", "KeyA"),
      dy = held("ArrowDown", "KeyS") - held("ArrowUp", "KeyW");
    const len = Math.hypot(dx, dy);
    if (!len) return;
    const d = (285 * dt) / k / len;
    // No side-entry onto a raised deck: each legal vertical increment is one riser.
    const reachable = (x, y) =>
      clear(x, y) &&
      (k === 1 ||
        Math.abs(
          relief.elevation(player.x, player.y) - relief.elevation(x, y),
        ) <= 6.001);
    if (reachable(player.x + d * dx, player.y)) player.x += d * dx;
    if (reachable(player.x, player.y + d * dy)) player.y += d * dy;
    dirty = true;
  }
  function draw(t) {
    const W = c.clientWidth,
      H = c.clientHeight;
    if (!W || !H) return;
    const dpi = Math.min(devicePixelRatio, 2);
    if (c.width !== Math.round(W * dpi) || c.height !== Math.round(H * dpi)) {
      c.width = Math.round(W * dpi);
      c.height = Math.round(H * dpi);
    }
    g.setTransform(dpi, 0, 0, dpi, 0, 0);
    g.fillStyle = "#100e18";
    g.fillRect(0, 0, W, H);
    const all = camera === "all",
      material = k === 2,
      st = stations.get(camera),
      z = all
        ? Math.min(W / (B.w + 100), H / (B.h + 155))
        : camera === "walk"
          ? k * Math.min(1, W / 820)
          : Math.min(W / 460, H / 300),
      focus = st ? st.base || st.area : null;
    const cx = all ? B.x + B.w / 2 : focus ? focus.x + focus.w / 2 : player.x,
      cy = all
        ? B.y + B.h / 2 - 32
        : focus
          ? focus.y + focus.h / 2 - 10
          : player.y;
    g.translate(W / 2, H / 2);
    g.scale(z, z);
    g.translate(-cx, -cy);
    paintVestibule({g,L,B,images,patterns,relief,stations,material,player,k,all,W,z,$,cx,cy,t});
    const near = L.stations.find((s) => L.contains(s.area, player.x, player.y));
    $("status").textContent = remaining
      ? `Cargando ${remaining} materiales…`
      : failed
        ? `${failed} recursos no disponibles`
        : near
          ? "Frente de atención · " + near.label
          : all
            ? "Vista cenital · 16 estaciones"
            : camera === "walk"
              ? "Recorrido local · velocidad 285 u/s"
              : "Inspección óptica · jugador sin desplazar";
  }
  new ResizeObserver(() => (dirty = true)).observe(c);
  mode(2);
  cam("all");
  function frame(t) {
    move(Math.min(0.035, (t - last) / 1000));
    last = t;
    if (dirty || $("rave").checked) {
      draw(t);
      dirty = false;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
