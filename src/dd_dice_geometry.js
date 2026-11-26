/* Convex hulls are built once, never during combat. Y is world up. */
window.DD_DICE_GEOMETRY = (() => {
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0),
    sub = (a, b) => a.map((x, i) => x - b[i]);
  const cross = ([x, y, z], [a, b, c]) => [
    y * c - z * b,
    z * a - x * c,
    x * b - y * a,
  ];
  const unit = (v) => v.map((x) => x / (Math.hypot(...v) || 1));
  function hull(v) {
    const faces = new Map();
    for (let i = 0; i < v.length; i++)
      for (let j = i + 1; j < v.length; j++)
        for (let k = j + 1; k < v.length; k++) {
          let n = unit(cross(sub(v[j], v[i]), sub(v[k], v[i])));
          if (dot(n, v[i]) < 0) n = n.map((x) => -x);
          const d = v.map((p) => dot(n, sub(p, v[i])));
          if (Math.max(...d) > 1e-6 || dot(n, v[i]) < 0.001) continue;
          const ids = v.map((_, i) => i).filter((i) => Math.abs(d[i]) < 1e-6),
            key = ids.join();
          if (faces.has(key)) continue;
          const u = unit(sub(v[j], v[i])),
            w = cross(n, u),
            c = n.map(
              (_, a) => ids.reduce((s, i) => s + v[i][a], 0) / ids.length,
            );
          const angle = (i) =>
            Math.atan2(dot(sub(v[i], c), w), dot(sub(v[i], c), u));
          faces.set(key, { n, ids: ids.sort((a, b) => angle(a) - angle(b)) });
        }
    return { v: v.map(unit), f: [...faces.values()] };
  }
  const cube = [],
    ico = [],
    axes = [],
    phi = (1 + Math.sqrt(5)) / 2;
  for (const a of [-1, 1]) {
    axes.push([a, 0, 0], [0, a, 0], [0, 0, a]);
    for (const b of [-1, 1]) {
      ico.push([0, a, b * phi], [a, b * phi, 0], [b * phi, 0, a]);
      for (const c of [-1, 1]) cube.push([a, b, c]);
    }
  }
  const m = {
    4: hull(cube.filter((v) => v.reduce((a, b) => a * b) === 1)),
    6: hull(cube),
    8: hull(axes),
    20: hull(ico),
  };
  m[12] = hull(m[20].f.map((f) => f.n));
  // Dual of a pentagonal antiprism: ten kite faces (not a bipyramid).
  const anti = hull(
    Array.from({ length: 10 }, (_, i) => [
      Math.cos((i * Math.PI) / 5),
      i % 2 ? 0.55 : -0.55,
      Math.sin((i * Math.PI) / 5),
    ]),
  );
  m[10] = hull(
    anti.f.map((f) => f.n.map((x) => x / dot(f.n, anti.v[f.ids[0]]))),
  );
  // Keep dual vertices at their original relative radii for the trapezohedron.
  const dual = anti.f.map((f) =>
    f.n.map((x) => x / dot(f.n, anti.v[f.ids[0]])),
  );
  const scale = Math.max(...dual.map((v) => Math.hypot(...v)));
  m[10].v = dual.map((v) => v.map((x) => x / scale));
  const normals = [
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, -1],
    [0, -1, 0],
  ];
  m[6].f = normals.map((n) => m[6].f.find((f) => dot(f.n, n) > 0.99));
  function rotate([x, y, z], a, b) {
    const h = y * Math.cos(a) - z * Math.sin(a),
      d = y * Math.sin(a) + z * Math.cos(a);
    return [
      x * Math.cos(b) - h * Math.sin(b),
      x * Math.sin(b) + h * Math.cos(b),
      d,
    ];
  }
  function top(id, a, b) {
    let best = -2,
      index = 0;
    // Dot product against inverse-rotated world up, shared by all faces.
    const x = Math.sin(b),
      y = Math.cos(a) * Math.cos(b),
      z = -Math.sin(a) * Math.cos(b);
    m[id].f.forEach(({ n }, i) => {
      const h = n[0] * x + n[1] * y + n[2] * z;
      if (h > best) {
        best = h;
        index = i;
      }
    });
    return index + 1;
  }
  // Enamel body hues follow the catalog trim; polygon normals still own visibility and rolls.
  const enamelHue = {4:160, 6:31, 8:196, 10:333, 12:16, 20:266};
  function draw(ctx, id, a, b, size, color) {
    const mesh = m[id],
      v = mesh.v.map((p) => rotate(p, a, b));
    const faces = mesh.f
      .map(({ n, ids }, i) => {
        const [, y, z] = rotate(n, a, b);
        return { ids, i, light: y * 0.8 + z * 0.6 };
      })
      .filter((f) => f.light > 0);
    ctx.save();
    ctx.scale(size, size);
    ctx.lineJoin = "round";
    ctx.lineWidth = 0.032;
    for (const { ids, i, light } of faces) {
      let cx = 0,
        cy = 0;
      const points = [];
      ctx.beginPath();
      ids.forEach((j, k) => {
        const [x, h, d] = v[j],
          y = d * 0.8 - h * 0.6;
        ctx[k ? "lineTo" : "moveTo"](x, y);
        points.push([x,y]);
        cx += x;
        cy += y;
      });
      ctx.closePath();
      const shade = ctx.createLinearGradient(-.65,-.85,.55,.9);
      shade.addColorStop(0, `hsl(${enamelHue[id]} 35% ${15+light*28}%)`);
      shade.addColorStop(1, `hsl(${enamelHue[id]} 30% ${6+light*17}%)`);
      ctx.fillStyle = shade;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.stroke();
      cx /= ids.length; cy /= ids.length;
      // Inset tooling uses projected face space; it cannot leak across an edge.
      if (light > .27 && size >= 18) {
        ctx.beginPath();
        points.forEach(([x,y],k)=>ctx[k ? 'lineTo':'moveTo'](cx+(x-cx)*.83,cy+(y-cy)*.83));
        ctx.closePath();ctx.strokeStyle = 'rgba(255,229,195,.37)';ctx.lineWidth=.012;ctx.stroke();
        ctx.lineWidth=.032;
      }
      if (light > 0.44) {
        ctx.fillStyle = "#fff2ce";
        // Fit the label's bounding circle inside the nearest edge, including two digits.
        const clearance = Math.min(...points.map(([x,y],k)=>{
          const [nx,ny]=points[(k+1)%points.length];
          return Math.abs((nx-x)*(cy-y)-(ny-y)*(cx-x))/Math.max(1e-6,Math.hypot(nx-x,ny-y));
        }));
        const font = Math.min(.46, clearance * (i>=9 ? 1.16 : 1.5));
        ctx.font = `bold ${font}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(i + 1, cx, cy);
      }
    }
    ctx.restore();
  }
  return { m, top, draw };
})();
