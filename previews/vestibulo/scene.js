function paintVestibule({g,L,B,images,patterns,relief,stations,material,player,k,all,W,z,$,cx,cy,t,drawPlayer}) {
  const rect = (r, col) => {
    g.fillStyle = col;
    g.fillRect(r.x, r.y, r.w, r.h);
  };
  function tile(r, id, sz) {
    const im = images[id];
    if (!im) return;
    const p = (patterns[id] ??= g.createPattern(im, "repeat"));
    g.save();
    g.translate(r.x, r.y);
    g.scale(sz / im.width, sz / im.width);
    g.fillStyle = p;
    g.fillRect(0, 0, (r.w * im.width) / sz, (r.h * im.width) / sz);
    g.restore();
  }
  function shadow(x, y, w, h) {
    g.fillStyle = "#090511a8";
    g.beginPath();
    g.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    g.fill();
  }
  function glow(x, y, r, color) {
    const p = g.createRadialGradient(x, y, 0, x, y, r);
    p.addColorStop(0, color);
    p.addColorStop(1, "transparent");
    g.fillStyle = p;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function sprite(id, x, y, w, maxH) {
    const im = images[id];
    if (!im) return;
    const [sx, sy, sw, sh] = artBounds[id] || [0, 0, im.width, im.height];
    const f = Math.min(w / sw, maxH / sh);
    g.drawImage(
      im,
      sx,
      sy,
      sw,
      sh,
      x - (sw * f) / 2,
      y - sh * f,
      sw * f,
      sh * f,
    );
  }
  function block(r, h, art) {
    rect({ ...r, y: r.y - h }, "#282838");
    rect({ x: r.x, y: r.y + r.h - h, w: r.w, h }, "#48414c");
    if (art) tile({ x: r.x, y: r.y + r.h - h, w: r.w, h }, "wall", 80);
    g.fillStyle = "#8b79824a";
    g.fillRect(r.x, r.y + r.h - h, r.w, 2);
  }
  function plaque(str, x, y, px, z, ink = "#e8e0ce") {
    g.save();
    g.translate(x, y);
    g.scale(1 / z, 1 / z);
    g.font = `bold ${px}px monospace`;
    g.textAlign = "center";
    const w = g.measureText(str).width + 10;
    g.fillStyle = "#110f18e8";
    g.fillRect(-w / 2, -px, w, px + 5);
    g.fillStyle = ink;
    g.fillText(str, 0, 0);
    g.restore();
  }
    const path = (pts) => {
      g.beginPath();
      pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
      g.closePath();
    };
    g.save();
    if (material) {
      path(L.outline);
      g.clip();
    }
    rect(B, "#23202c");
    if (material) {
      tile(B, "floor", 150);
      rect(B, "#09071499");

      // Broad landing tapers into the axial aisle; asymmetric branches are inlays, not steps to collide with.
      const surface = (pts, id) => {
        g.save();
        path(pts.map(([x, y]) => ({ x: B.x + x, y: B.y + y })));
        g.clip();
        tile(B, id, 92);
        rect(B, "#0b091a55");
        g.restore();
      };
      surface(
        [
          [705, 0],
          [855, 0],
          [836, 305],
          [920, 450],
          [875, 530],
          [828, 645],
          [859, 950],
          [673, 950],
          [718, 665],
          [681, 527],
          [626, 438],
          [715, 288],
        ],
        "rug",
      );
      surface(
        [
          [695, 431],
          [729, 526],
          [556, 547],
          [417, 613],
          [390, 551],
          [532, 477],
        ],
        "rug",
      );
      surface(
        [
          [819, 395],
          [859, 478],
          [1032, 365],
          [1210, 332],
          [1200, 296],
          [1020, 311],
        ],
        "rug",
      );
      tile(L.lane, "tile", 92);
    }
    rect(L.lane, material ? "#07191d9c" : "#22333a");
    if (material) {
      // Low-contrast inlays group the social stations without creating obstacles.
      for (const [id, col] of [
        ["bar", "#543343"],
        ["dj", "#383444"],
        ["map", "#393346"],
        ["armory", "#293c43"],
      ]) {
        const b = stations.get(id).base;
        const zone = {
          x: b.x - 26,
          y: b.y + 3,
          w: Math.min(410, B.x + B.w - b.x),
          h: 135,
        };
        glow(
          zone.x + zone.w * 0.35,
          zone.y + zone.h * 0.45,
          zone.w * 0.65,
          col + "ad",
        );
      }
      for (const [id, col] of [
        ["dj", "#ee40862e"],
        ["armory", "#2ec6b629"],
        ["map", "#c396503a"],
      ]) {
        const r = stations.get(id).base;
        glow(r.x + 54, r.y + 42, 240, col);
      }
      if ($("rave").checked) {
        g.globalAlpha = matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0.6
          : 0.62 + 0.19 * Math.sin(t * 0.0018);
        glow(cx, cy, 520, "#ff397e5e");
        g.globalAlpha = 1;
      }
    }
    g.restore();
    if (!material)
      for (const r of L.walls.slice(0, -1))
        block(r, material ? 32 : 12, material);
    const level = (x, y) => (material ? relief.elevation(x, y) : 0);
    if (material) {
      for (const w of L.walls) {
        const dx = w.h * 0.23,
          dy = w.h * 0.36;
        path([
          w.a,
          w.c,
          { x: w.c.x + dx, y: w.c.y + dy },
          { x: w.a.x + dx, y: w.a.y + dy },
        ]);
        g.fillStyle = "#06061165";
        g.fill();
      }
      for (const stage of relief.stages) relief.paint(g, stage);
    }
    g.save();
    g.translate(0, -level(L.gate.x, L.gate.y));
    rect(L.gate, "#3f2737");
    if (material)
      sprite(
        "crack",
        L.gate.x + L.gate.w / 2,
        L.gate.y + L.gate.h,
        L.gate.w,
        L.gate.h,
      );
    for (const r of L.jambs) block(r, material ? 35 : 12, material);
    g.restore();
    for (const target of L.targets) {
      g.strokeStyle = "#e3b776";
      g.lineWidth = 2;
      g.beginPath();
      if (material) {
        shadow(target.x, target.y, 9, 3);
        rect({ x: target.x - 2, y: target.y - 20, w: 4, h: 20 }, "#816b64");
        g.beginPath();
        g.ellipse(target.x, target.y - 24, 5, target.r, 0, 0, Math.PI * 2);
      } else g.arc(target.x, target.y, target.r, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      if (material)
        g.ellipse(target.x + 1, target.y - 24, 2, 5, 0, 0, Math.PI * 2);
      else g.arc(target.x, target.y, 5, 0, Math.PI * 2);
      g.stroke();
    }
    const queue = [];
    if (material)
      for (const w of L.walls) {
        queue.push([
          Math.max(w.a.y, w.c.y),
          () => {
            const up = (p) => ({ x: p.x, y: p.y - w.h });
            g.save();
            for (let i = 0; i < 4; i++) {
              const a = w.cap[i],
                b = w.cap[(i + 1) % 4];
              path([a, b, up(b), up(a)]);
              g.fillStyle = i % 2 ? "#332d38" : "#473b49";
              g.fill();
            }
            path([w.a, w.c, up(w.c), up(w.a)]);
            g.fillStyle = "#55404b";
            g.fill();
            g.save();
            g.clip();
            tile(
              {
                x: Math.min(w.a.x, w.c.x),
                y: Math.min(w.a.y, w.c.y) - w.h,
                w: Math.abs(w.c.x - w.a.x) || 13,
                h: w.h,
              },
              "wall",
              88,
            );
            g.restore();
            path(w.cap.map(up));
            g.fillStyle = "#37323e";
            g.fill();
            g.strokeStyle = "#8b7c794a";
            g.lineWidth = 1.5;
            g.stroke();
            g.restore();
          },
        ]);
      }

    for (const s of L.stations) {
      if (!s.base) continue;
      const b = s.base,
        a = s.area,
        mid = b.x + b.w / 2,
        feet = b.y + b.h;
      g.save();
      g.translate(0, -level(mid, feet));
      if (!material || $("foot").checked) rect(a, "#4fbbb644");
      if ($("foot").checked) {
        g.strokeStyle = "#f6c079";
        g.strokeRect(b.x, b.y, b.w, b.h);
      }
      g.restore();
      queue.push([
        feet,
        () => {
          g.save();
          g.translate(0, -level(mid, feet));
          shadow(mid, feet - 1, b.w * 0.46, 6);
          block(b, 7, false);
          if (material) {
            if (s.id === "dj" || s.id === "armorer" || s.id === "bar")
              sprite(
                { dj: "tempo", armorer: "armera", bar: "bartender" }[s.id],
                mid - 20,
                feet - 9,
                39,
                56,
              );
            const yaw = heading[s.front][2];
            if (yaw === 90) {
              // Authored profile: east backrest, west seat opening (never rotate a frontal sofa PNG).
              const cushion = (x, y, w, h, col) => {
                g.fillStyle = col;
                g.beginPath();
                g.roundRect(x, y, w, h, 4);
                g.fill();
                g.strokeStyle = "#9a717c";
                g.stroke();
              };
              cushion(b.x + 3, feet - 21, b.w - 6, 21, "#39222f");
              cushion(b.x + 4, feet - 28, b.w - 16, 18, "#754454");
              cushion(b.x + b.w - 18, feet - 43, 16, 39, "#422839");
            } else {
              // E-facing stations use a radial orb, with a real operating face on the east edge.
              g.save();
              g.translate(mid, feet);
              g.transform(1, -facePlate[s.id], 0, 1, 0, 0);
              sprite(
                s.id,
                0,
                0,
                b.w,
                ["mix", "gallery", "armory", "ledger"].includes(s.id) ? 62 : 45,
              );
              g.restore();
              if (yaw === 270) {
                rect(
                  { x: b.x + b.w - 12, y: feet - 17, w: 12, h: 13 },
                  "#574353",
                );
                rect({ x: b.x + b.w - 4, y: feet - 15, w: 4, h: 6 }, "#93d1c4");
              }
            }
          }
          g.fillStyle = s.front === "S" ? "#e8b1a2" : "#6cdccd";
          if (s.front === "S") g.fillRect(b.x + 6, feet - 2, b.w - 12, 2);
          else
            g.fillRect(
              s.front === "W" ? b.x : b.x + b.w - 2,
              b.y + 4,
              2,
              b.h - 8,
            );
          g.restore();
        },
      ]);
    }
    glow(player.x, player.y, 65 / k, "#e7c6a97a");
    if (all) plaque("▲ JUGADOR", player.x, player.y + 13, 9, z, "#b9edda");
    queue.push([
      player.y,
      () => {
        g.save();
        g.translate(0, -level(player.x, player.y));
        shadow(player.x, player.y, 19 / k, 6 / k);
        if (drawPlayer) drawPlayer();
        else if (images.hero) sprite("hero", player.x, player.y, 70 / k, 108 / k);
        else
          rect(
            { x: player.x - 5 / k, y: player.y - 22 / k, w: 10 / k, h: 22 / k },
            "#ddd",
          );
        g.restore();
      },
    ]);
    queue.sort((a, b) => a[0] - b[0]).forEach((e) => e[1]());
    if (material && $("fronts").checked) {
      function vector(x, y, f) {
        const [dx, dy] = heading[f];
        g.save();
        g.translate(x, y);
        g.rotate(Math.atan2(dy, dx));
        g.lineWidth = 2.5;
        g.strokeStyle = "#82ffee";
        g.fillStyle = "#82ffee";
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(25, 0);
        g.stroke();
        path([
          { x: 29, y: 0 },
          { x: 19, y: -5 },
          { x: 19, y: 5 },
        ]);
        g.fill();
        g.restore();
      }
      for (const s of L.stations) {
        if (!s.base) continue;
        const b = s.base,
          [dx, dy] = heading[s.front],
          x = b.x + b.w / 2,
          y = b.y + b.h / 2;
        vector(x + (dx * b.w) / 2, y + (dy * b.h) / 2 - level(x, y), s.front);
      }
      for(const id of ['dj','bar','armorer']){const b=stations.get(id).base;vector(b.x+b.w/2-20,b.y+b.h-9-level(b.x,b.y),'S');}
      vector(L.gate.x+L.gate.w/2,L.gate.y+L.gate.h-level(L.gate.x,L.gate.y),'S');
      for (const t of L.targets) vector(t.x + 4, t.y - 24, "E");
    }
    if (!material) block(L.walls.at(-1), 10, false);
    for (const s of L.stations) {
      const a = s.area;
      plaque(
        s.id === "descent"
          ? "GRIETA DEL REFUGIO · CÍRCULO I · LIMBO"
          : all && W < 620
            ? String(L.stations.indexOf(s) + 1).padStart(2, "0")
            : s.label,
        a.x + a.w / 2,
        a.y + a.h * 0.8 - level(a.x + a.w / 2, a.y + a.h * 0.8),
        all ? 11 : 13,
        z,
        s.id === "descent" ? "#ffc0b1" : undefined,
      );
    }
}
