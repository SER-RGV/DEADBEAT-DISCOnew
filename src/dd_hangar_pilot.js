/* Draw-only pilot. The native floor and door objects remain authoritative. */
window.DD_HANGAR_PILOT = (() => {
  const height = 26;
  function polygon(g, points, color, lift = 0) {
    g.fillStyle = color;
    g.beginPath();
    points.forEach((p, i) =>
      i ? g.lineTo(p.x, p.y - lift) : g.moveTo(p.x, p.y - lift),
    );
    g.closePath();
    g.fill();
  }
  function block(g, cap, h, color) {
    // Project the visible vertical faces, then the top. Shared plan vertices
    // keep mitres and jamb ends joined without a continuous backing wall.
    for (let i = 0; i < cap.length; i++) {
      const a = cap[i],
        b = cap[(i + 1) % cap.length];
      polygon(
        g,
        [a, b, { x: b.x, y: b.y - h }, { x: a.x, y: a.y - h }],
        "#34434b",
      );
    }
    polygon(g, cap, color, h);
  }
  function shell(g, mesh) {
    g.save();
    for (const d of mesh.openings) polygon(g, d.threshold, "#394046");
    const parts = mesh.walls.map((w) => ({
      cap: w.cap,
      h: height,
      color: "#1d2a32",
    }));
    for (const d of mesh.openings)
      for (const cap of d.jambs)
        parts.push({ cap, h: height + 3, color: "#5b6364" });
    parts
      .sort(
        (a, b) =>
          Math.max(...a.cap.map((p) => p.y)) -
          Math.max(...b.cap.map((p) => p.y)),
      )
      .forEach((p) => block(g, p.cap, p.h, p.color));
    g.restore();
  }
  function door(g, d, native, open, near) {
    g.save();
    const [a, b] = d.threshold;
    if (!open)
      block(
        g,
        [
          a,
          b,
          { x: b.x - d.normal.x * 7, y: b.y - d.normal.y * 7 },
          { x: a.x - d.normal.x * 7, y: a.y - d.normal.y * 7 },
        ],
        height,
        "#51555b",
      );
    const p = d.origin;
    g.textAlign = "center";
    g.font = "bold 11px monospace";
    g.fillStyle = "#e1dfd7";
    g.fillText(
      near ? (open ? "E / A · " + native.label : "SELLADA") : native.label,
      p.x + 42 * d.normal.x,
      p.y + 42 * d.normal.y,
      158,
    );
    g.restore();
  }
  return Object.freeze({ shell, door });
})();
