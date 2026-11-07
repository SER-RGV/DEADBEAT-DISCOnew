/* ===========================================================================
   TANDA08:COMPOSITION:BEGIN — PROTOTIPO DE COMPOSICIÓN (sin assets)
   Se inyecta en una COPIA temporal del HTML (t08_composition.html).
   Valida: cutaway anclado al borde real, 5 planos de profundidad, parallax
   derivado de la cámara existente, expansión con shaftOpen real, resplandor
   aditivo dentro de la grieta y animación de brasas con objetos reutilizados.
   No registra nada en __DDM_V5_IMG; todo es procedural.
   Flag: window.__DDM_HUB_T08 = false → desactiva.
   =========================================================================== */
      const T08P = (function () {
        const REF = { x: 1250, y: 1195 };
        const PLANES = [
          { id: 'P1_cercano',   d: 0.00, factor: 0.92, alpha: 0.98 },
          { id: 'P2_medio',     d: 0.26, factor: 0.66, alpha: 0.82 },
          { id: 'P3_intermedio',d: 0.52, factor: 0.40, alpha: 0.62 },
          { id: 'P4_lejano',    d: 0.76, factor: 0.20, alpha: 0.42 },
          { id: 'P5_fondo',     d: 0.94, factor: 0.08, alpha: 0.30 }
        ];
        const S = { boxes: [], visible: false, winTop: 0, winH: 0, expand: 0,
                    descentP: 0, frames: 0, err: [], clock: 0 };
        /* Brasas PREASIGNADAS: ni un objeto nuevo por fotograma. */
        const EMB = [];
        for (let i = 0; i < 48; i++) {
          EMB.push({ seed: i, t: (i * 0.173) % 1, spd: 0.055 + (i % 7) * 0.013,
                     lane: (i * 97) % 1000 / 1000, from: i % 3,
                     size: 1.2 + (i % 4) * 0.65, x: 0, y: 0, a: 0 });
        }
        function on() { return window.__DDM_HUB_T08 !== false; }
        function cam() { try { return window.DMO.camera(); } catch (e) { return { x: 1250, y: 1195, zoom: 0.9375 }; } }
        function reduced() { try { return !!Yc.reduced; } catch (e) { return false; } }
        function zz() { try { return (hub.ambientFrozenAt != null) ? hub.ambientFrozenAt : Z; } catch (e) { return Z; } }
        function hubLoc() { try { return window.DMO_HUB.state().location; } catch (e) { return 'HUB'; } }
        function descent() {
          try {
            const f = floorDropAnim;
            if (!f || !f.active || hubLoc() === 'CAMPAIGN_ROOM') return { open: 0, p: 0 };
            return { open: Math.max(0, Math.min(1, Number(f.shaftOpen) || 0)),
                     p: Math.max(0, Math.min(1, Number(f.stairProgress) || 0)) };
          } catch (e) { return { open: 0, p: 0 }; }
        }
        function geom() {
          const cm = cam(), W = g.canvas ? g.canvas.width : 1280, H = g.canvas ? g.canvas.height : 900;
          const de = descent();
          const edge = 450 + cm.zoom * (1585 - cm.y);
          const expand = 260 * de.open;
          const T = edge - expand, Wh = H - T;
          S.winTop = T; S.winH = Wh; S.expand = expand; S.descentP = de.p;
          S.visible = Wh > 10 && T < H && (hubLoc() === 'HUB' || hubLoc() === 'TRANSITION');
          S.boxes = PLANES.map(function (P) {
            const y = T + Wh * (0.06 + 0.88 * Math.pow(P.d, 0.78));
            const h = Math.max(6, Wh * (0.30 - 0.20 * P.d));
            const dx = -cm.zoom * (cm.x - REF.x) * P.factor;
            const w = W * (1.18 - 0.22 * P.d);
            return { id: P.id, d: P.d, factor: P.factor, alpha: P.alpha,
                     x: (W - w) * 0.5 + dx, y: y, w: w, h: h, dx: dx };
          });
          return { cm: cm, W: W, H: H, T: T, Wh: Wh, de: de };
        }
        function update(dt) {
          S.clock += Math.max(0, Math.min(0.1, Number(dt) || 0.016));
          if (reduced()) return;
          const q = geom();
          if (!S.visible) return;              /* no se actualizan efectos invisibles */
          const den = 1 + q.de.p * 1.4;         /* densidad ligada al descenso real */
          for (let i = 0; i < EMB.length; i++) {
            const e = EMB[i];
            e.t += dt * e.spd * den;
            if (e.t > 1) e.t -= Math.floor(e.t);
          }
        }
        function drawCutaway() {
          if (!on()) return;
          const q = geom();
          if (!S.visible) return;
          const c = g, W = q.W, H = q.H, T = q.T;
          c.save();
          c.setTransform(1, 0, 0, 1, 0, 0);
          c.imageSmoothingEnabled = true;
          c.beginPath();
          c.moveTo(-40, T); c.lineTo(W + 40, T);
          c.lineTo(W * 0.66, H + 20); c.lineTo(W * 0.34, H + 20);
          c.closePath(); c.clip();
          const bg = c.createLinearGradient(0, T, 0, H);
          bg.addColorStop(0, 'rgba(9,6,20,0.94)');
          bg.addColorStop(0.6, 'rgba(4,5,16,0.97)');
          bg.addColorStop(1, 'rgba(2,3,10,0.99)');
          c.fillStyle = bg; c.fillRect(0, T, W, H - T);
          c.fillStyle = 'rgba(48,30,72,0.55)';
          c.beginPath(); c.moveTo(-40, T); c.lineTo(W * 0.19, T);
          c.lineTo(W * 0.34, H + 20); c.lineTo(-40, H + 20); c.closePath(); c.fill();
          c.beginPath(); c.moveTo(W * 0.81, T); c.lineTo(W + 40, T);
          c.lineTo(W + 40, H + 20); c.lineTo(W * 0.66, H + 20); c.closePath(); c.fill();
          const t = reduced() ? 2.2 : zz();
          S.boxes.forEach(function (b, i) {
            const P = PLANES[i];
            c.globalAlpha = P.alpha;
            c.fillStyle = ['#3b2352', '#2b2352', '#1e2748', '#16203c', '#101a30'][i];
            c.fillRect(b.x, b.y, b.w, b.h);
            const n = 9 - i * 2;
            for (let k = 0; k < n; k++) {
              const fx = b.x + (k + 0.5) * b.w / n + Math.sin(t * 0.16 + k + i) * (i + 1);
              const fw = b.w / n * (0.45 - 0.05 * i), fh = b.h * (0.55 - 0.06 * i);
              c.fillStyle = i < 2 ? '#0c0a18' : '#1e2748';
              c.globalAlpha = P.alpha * (0.55 - 0.07 * i);
              c.fillRect(fx - fw * 0.5, b.y + b.h - fh, fw, fh);
            }
            c.globalAlpha = P.alpha * (0.55 - 0.08 * i);
            c.strokeStyle = ['#fbbf24', '#fb923c', '#67e8f9', '#a855f7', '#f97316'][i];
            c.lineWidth = Math.max(0.6, 2.2 - i * 0.4);
            for (let k = 0; k < 3 + i; k++) {
              const gx = b.x + b.w * (0.12 + 0.76 * ((k * 0.37 + i * 0.19) % 1));
              c.beginPath(); c.moveTo(gx, b.y + b.h * 0.3);
              c.lineTo(gx + Math.sin(k + i) * 8, b.y + b.h * 0.95); c.stroke();
            }
          });
          c.globalCompositeOperation = 'lighter';
          const pulse = reduced() ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.6);
          for (let k = 0; k < 7; k++) {
            const lx = W * (0.36 + (k * 0.137) % 0.30) + Math.sin(t * 0.08 + k) * 6;
            const ly = H - 18 - (k % 3) * 9;
            const rr = 12 + 18 * q.de.open + 5 * pulse;
            const lg = c.createRadialGradient(lx, ly, 1, lx, ly, rr);
            lg.addColorStop(0, 'rgba(251,146,60,' + (0.14 + 0.20 * q.de.open).toFixed(3) + ')');
            lg.addColorStop(1, 'rgba(251,146,60,0)');
            c.globalAlpha = 1; c.fillStyle = lg;
            c.fillRect(lx - rr, ly - rr, rr * 2, rr * 2);
          }
          c.globalCompositeOperation = 'source-over';
          c.globalAlpha = 1;
          c.restore();
          S.frames++;
        }
        /* Resplandor DENTRO de la grieta: aditivo, no tapa el panel ni el marco. */
        function drawFissure() {
          if (!on()) return;
          const cm = cam(), q = geom();
          if (hubLoc() === 'CAMPAIGN_ROOM') return;
          const cx = 640 + cm.zoom * (1250 - cm.x);
          const cy = 450 + cm.zoom * (1342 - cm.y);
          const rx = 92 * cm.zoom, ry = 34 * cm.zoom;
          if (cy + ry < 0 || cy - ry > q.H) return;
          const c = g, t = reduced() ? 2.2 : zz();
          c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
          c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.clip();
          c.globalCompositeOperation = 'lighter';
          const pulse = reduced() ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.5 + 1.2);
          const lg = c.createRadialGradient(cx, cy + ry * 0.4, 2, cx, cy + ry * 0.4, rx * 1.1);
          lg.addColorStop(0, 'rgba(251,146,60,' + (0.16 + 0.08 * pulse).toFixed(3) + ')');
          lg.addColorStop(0.45, 'rgba(34,211,238,0.07)');
          lg.addColorStop(1, 'rgba(2,3,10,0)');
          c.fillStyle = lg; c.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
          c.globalCompositeOperation = 'source-over';
          c.restore();
        }
        /* Brasas: confinadas al cutaway y a la grieta, lejos del jugador/NPC. */
        function drawAmbient() {
          if (!on()) return;
          const q = geom();
          if (!S.visible) return;
          const c = g, W = q.W, H = q.H, T = q.T, Wh = q.Wh;
          c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
          for (let i = 0; i < EMB.length; i++) {
            const e = EMB[i];
            const band = e.from === 0 ? S.boxes[0] : S.boxes[1 + (i % 3)];
            const x = band.x + band.w * e.lane + Math.sin(S.clock * 0.7 + i) * (2 + e.from * 3);
            const y = H - e.t * Wh * (0.95 + 0.15 * q.de.open);
            e.x = x; e.y = y;
            e.a = Math.max(0, (1 - e.t) * (0.34 + 0.22 * q.de.open));
            if (y < T + 2 || y > H) continue;
            c.globalAlpha = e.a;
            c.fillStyle = i % 5 === 0 ? '#67e8f9' : (i % 3 === 0 ? '#f472b6' : '#fb923c');
            c.fillRect(Math.round(x), Math.round(y), e.size, e.size * 1.8);
          }
          c.globalAlpha = 1;
          c.restore();
        }
        let installed = false;
        function installHooks() {
          if (installed) return false;
          installed = true;
          const prevZf = zf;
          zf = function () {
            try { drawFissure(); drawCutaway(); drawAmbient(); } catch (e) { S.err.push(String(e)); }
            return prevZf.apply(this, arguments);
          };
          const prevTf = Tf;
          Tf = function (dt) {
            const r = prevTf.apply(this, arguments);
            try { update(dt); } catch (e) { S.err.push(String(e)); }
            return r;
          };
          return true;
        }
        function debug() {
          const q = geom();
          return { visible: S.visible, winTop: +S.winTop.toFixed(1), winH: +S.winH.toFixed(1),
                   expand: +S.expand.toFixed(1), descentP: +S.descentP.toFixed(3),
                   camera: { x: q.cm.x, y: q.cm.y, zoom: q.cm.zoom },
                   frames: S.frames, clock: +S.clock.toFixed(2), reduced: reduced(),
                   error: S.err.slice(-3),
                   embers: EMB.slice(0, 8).map(function (e) {
                     return { x: +e.x.toFixed(1), y: +e.y.toFixed(1), t: +e.t.toFixed(3), a: +e.a.toFixed(3) };
                   }),
                   boxes: S.boxes.map(function (b) {
                     return { id: b.id, d: b.d, factor: b.factor,
                              x: +b.x.toFixed(1), y: +b.y.toFixed(1),
                              w: +b.w.toFixed(1), h: +b.h.toFixed(1),
                              dx: +b.dx.toFixed(1), alpha: b.alpha };
                   }) };
        }
        window.__DDM_T08_COMPOSITION = Object.freeze({ debug: debug, installHooks: installHooks, planes: PLANES });
        return { installHooks: installHooks, debug: debug };
      })();
      /* ===========================================================================
         TANDA08:COMPOSITION:END
         =========================================================================== */
