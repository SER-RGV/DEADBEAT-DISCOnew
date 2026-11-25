// A detached, read-only atlas: no input listeners or tick hooks in production.
function visualize(plan, activeKey) {
  const dialog = document.createElement("dialog"),
    canvas = document.createElement("canvas"),
    g = canvas.getContext("2d");
  const { minX, maxX, minY, maxY } = plan.bounds,
    step = 110;
  canvas.width = (maxX - minX + 1) * step;
  canvas.height = (maxY - minY + 1) * step;
  canvas.style = "max-width:85vw;max-height:72vh;object-fit:contain";
  g.fillStyle = "#160e20";
  g.fillRect(0, 0, canvas.width, canvas.height);
  for (const n of plan.nodes) {
    const x = (n.x - minX + 0.5) * step,
      y = (n.y - minY + 0.5) * step;
    for (const l of n.links) {
      const [dx, dy] = axes.find((a) => a[2] === l.side);
      g.strokeStyle = "#ffcd60";
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + dx * 55, y + dy * 55);
      g.stroke();
    }
  }
  for (const n of plan.nodes) {
    const x = (n.x - minX + 0.5) * step,
      y = (n.y - minY + 0.5) * step;
    const px = (v) => x + (v - 0.5) * 80,
      py = (v) => y + (v - 0.5) * 60;
    g.beginPath();
    n.geometry.pts.forEach(([a, b], i) =>
      i ? g.lineTo(px(a), py(b)) : g.moveTo(px(a), py(b)),
    );
    g.closePath();
    g.fillStyle = n.key === activeKey ? "#764370" : "#43365c";
    g.fill();
    for (const [points, color] of [
      [n.population.props, "#dba06e"],
      [n.population.spawns, "#74e4ed"],
    ]) {
      g.fillStyle = color;
      points.forEach((p) => g.fillRect(px(p.x) - 2, py(p.y) - 2, 4, 4));
    }
    g.fillStyle = "white";
    g.textAlign = "center";
    g.fillText(n.type, x, y + 3);
  }
  const text = document.createElement("p");
  text.textContent = `RG ${plan.version} · ${plan.seed} · planta ${plan.floor + 1} · cian: candidatos de aparición · cobre: decoración propuesta`;
  const close = document.createElement("button");
  close.textContent = "Cerrar";
  close.onclick = () => dialog.close();
  dialog.onclose = () => dialog.remove();
  dialog.append(text, canvas, close);
  document.body.append(dialog);
  dialog.showModal();
}
