// North-rising stair flights. Ground coordinates never move; only their screen Y does.
function previewRelief(L) {
  const stage = (x, y, w, h, rise, n, run) => ({ x, y, w, h, rise, n, run });
  const booth = L.stations.find((s) => s.id === "dj").base,
    mix = L.stations.find((s) => s.id === "mix").base;
  const stages = [
    stage(L.gate.x, L.gate.y, L.gate.w, L.gate.h, 42, 7, 92),
    stage(booth.x - 22, booth.y, mix.x + mix.w - booth.x + 46, 100, 24, 4, 57),
  ];
  function elevation(x, y) {
    for (const s of stages) {
      if (x < s.x || x > s.x + s.w || y < s.y || y >= s.y + s.h + s.run)
        continue;
      if (y <= s.y + s.h) return s.rise;
      return (Math.ceil(s.n * (1 - (y - s.y - s.h) / s.run)) * s.rise) / s.n;
    }
    return 0;
  }
  function paint(g, s) {
    const top = s.y + s.h,
      step = s.run / s.n,
      r = s.rise / s.n;
    const box = (x, y, w, h, c) => {
      g.fillStyle = c;
      g.fillRect(x, y, w, h);
    };
    for(const f of [1,.7,.4])box(s.x+s.rise*.18*f,s.y+s.rise*.35*f,s.w,s.h+s.run,'#05040d32');
    box(s.x, s.y - s.rise, s.w, s.h, "#433749");
    for (let i = 0; i < s.n; i++) {
      const z = s.rise - i * r,
        y = top + i * step - z;
      const stone=g.createLinearGradient(s.x,y,s.x,y+step);stone.addColorStop(0,'#44353e');stone.addColorStop(.75,'#65535d');stone.addColorStop(1,'#80696c');
      box(s.x,y,s.w,step,stone);
      // Centre runner follows each tread; nosings remain continuous and legible.
      box(s.x+s.w*.35,y,s.w*.3,step,'#462437');
      for(const f of [.35,.65])box(s.x+s.w*f-1,y,2,step,'#9f7462');
      box(s.x, y + step, s.w, r + 0.3, "#282231");
      box(s.x + 2, y + step - 1.5, s.w - 4, 2, i % 2 ? "#b7907d" : "#e0b896");
      for (const x of [s.x, s.x + s.w - 4])
        box(x, y - 4, 4, step + r + 4, "#9c8276");
    }
    for (const x of [s.x + 2, s.x + s.w - 2]) {
      g.strokeStyle = "#d9b29a";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x, top - s.rise - 13);
      g.lineTo(x, top + s.run - 13);
      g.stroke();
      for (const f of [0, 0.5, 1])
        box(x - 1, top + f * s.run - (1 - f) * s.rise - 14, 2, 14, "#a99990");
    }
  }
  return { stages, elevation, paint };
}
