      /* === TANDA08:BEGIN · MÓDULO «EL ABISMO VIVO» ================================
         Fase 3 (integración) + Fase 4 (animación ambiental).
         La geometría es la APROBADA en composition_proof.json (16/16): cutaway
         en espacio de pantalla anclado al borde real y1585, 5 planos con
         parallax derivado de DMO.camera(), expansión gobernada por el
         shaftOpen REAL de floorDropAnim y retirada al cargar CAMPAIGN_ROOM.

         NO crea motor, canvas, cámara, sistema de audio, rAF, loader,
         colisiones, geometría transitable, puertas, estaciones ni progresión.
         Reutiliza: registro __DDM_V5_IMG, hooks zf/Tf ya encadenados, reloj
         Z / dt del motor, Yc.reduced y floorDropAnim.
         Reversible con window.__DDM_HUB_T08 = false (no afecta T01–T07).
         ===================================================================== */
      const T08 = (function () {
        const VER = '4.0.0-tanda08';
        const REF = { x: 1250, y: 1195 };
        const PLANES = [
          { id: 'P1_cercano',    d: 0.00, factor: 0.92, alpha: 0.98 },
          { id: 'P2_medio',      d: 0.26, factor: 0.66, alpha: 0.82 },
          { id: 'P3_intermedio', d: 0.52, factor: 0.40, alpha: 0.62 },
          { id: 'P4_lejano',     d: 0.76, factor: 0.20, alpha: 0.42 },
          { id: 'P5_fondo',      d: 0.94, factor: 0.08, alpha: 0.30 }
        ];
        const A = {
          paredIzq: 'h08_pared_cercana_izq', paredDer: 'h08_pared_cercana_der',
          estrato: 'h08_estrato_medio', columna: 'h08_columna_natural',
          plataforma: 'h08_plataforma_suspendida', paredLejana: 'h08_pared_lejana',
          rocas: 'h08_rocas_suspendidas', cavidades: 'h08_cavidades_lejanas',
          luces: 'h08_luces_abismo', humo: 'h08_humo_infernal'
        };
        const S = {
          version: VER, enabled: true, clock: 0, frames: 0, updates: 0,
          visible: false, winTop: 0, winH: 0, expand: 0, descentP: 0,
          draws: { bands: 0, objects: 0, smoke: 0, embers: 0, ash: 0, glows: 0 },
          errors: [], lastError: ''
        };
        /* --- Objetos PREASIGNADOS: cero allocations por fotograma ----------- */
        const EMB = [], ASH = [], SMOKE = [], FAR = [];
        for (let i = 0; i < 56; i++) EMB.push({
          seed: i, t: (i * 0.173) % 1, spd: 0.050 + (i % 7) * 0.013,
          lane: ((i * 97) % 1000) / 1000, band: i % 3,
          size: 1.1 + (i % 4) * 0.6, x: 0, y: 0, a: 0
        });
        for (let i = 0; i < 26; i++) ASH.push({
          t: (i * 0.211) % 1, lane: ((i * 173) % 1000) / 1000,
          drift: 0.35 + (i % 5) * 0.13, size: 0.8 + (i % 3) * 0.5,
          x: 0, y: 0, a: 0
        });
        for (let i = 0; i < 4; i++) SMOKE.push({
          lane: 0.16 + i * 0.22, scale: 0.72 + (i % 3) * 0.17,
          phase: i * 1.7, sway: 5 + i * 2, alpha: 0.13 + (i % 3) * 0.025
        });
        for (let i = 0; i < 3; i++) FAR.push({
          lane: 0.30 + i * 0.20, phase: i * 2.1, speed: 0.045 + i * 0.012
        });

        function note(e) {
          try {
            S.errors.push(String(e && (e.message || e) || e));
            if (S.errors.length > 24) S.errors.shift();
            S.lastError = S.errors[S.errors.length - 1];
          } catch (_) {}
        }
        function on() { return S.enabled && window.__DDM_HUB_T08 !== false; }
        function v5(k) {
          try { const im = window.__DDM_V5_IMG && window.__DDM_V5_IMG[k];
                return (im && im.complete && im.naturalWidth > 0) ? im : null; }
          catch (e) { return null; }
        }
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
          S.visible = Wh > 10 && T < H &&
                      (hubLoc() === 'HUB' || hubLoc() === 'TRANSITION');
          const boxes = PLANES.map(function (P) {
            const y = T + Wh * (0.06 + 0.88 * Math.pow(P.d, 0.78));
            const h = Math.max(6, Wh * (0.30 - 0.20 * P.d));
            const dx = -cm.zoom * (cm.x - REF.x) * P.factor;
            const w = W * (1.18 - 0.22 * P.d);
            return { id: P.id, d: P.d, factor: P.factor, alpha: P.alpha,
                     x: (W - w) * 0.5 + dx, y: y, w: w, h: h, dx: dx };
          });
          return { cm: cm, W: W, H: H, T: T, Wh: Wh, de: de, boxes: boxes };
        }
        /* El progreso del descenso es el REAL; el reloj ambiental usa el dt
           del motor (como T07), NO un temporizador independiente. */
        function update(dt) {
          S.updates++;
          S.clock += Math.max(0, Math.min(0.1, Number(dt) || 0.016));
          if (reduced()) return;
          const q = geom();
          if (!S.visible) return;             /* no se actualiza lo invisible */
          const den = 1 + q.de.p * 1.4;
          for (let i = 0; i < EMB.length; i++) {
            const e = EMB[i]; e.t += dt * e.spd * den;
            if (e.t > 1) e.t -= Math.floor(e.t);
          }
          for (let i = 0; i < ASH.length; i++) {
            const a = ASH[i]; a.t += dt * 0.021 * den;
            if (a.t > 1) a.t -= Math.floor(a.t);
          }
          for (let i = 0; i < FAR.length; i++) {
            FAR[i].phase += dt * FAR[i].speed;
          }
        }
        function band(key, b, hh, alpha, additive) {
          const im = v5(key); if (!im) return;
          const c = g;
          c.globalAlpha = alpha;
          if (additive) c.globalCompositeOperation = 'lighter';
          c.drawImage(im, b.x, b.y - hh * 0.22, b.w, hh);
          if (additive) c.globalCompositeOperation = 'source-over';
          c.globalAlpha = 1; S.draws.bands++;
        }
        function object(key, x, y, w, h, alpha, flip) {
          const im = v5(key); if (!im) return;
          const c = g;
          c.globalAlpha = alpha;
          if (flip) {
            c.save(); c.translate(x + w, y); c.scale(-1, 1);
            c.drawImage(im, 0, 0, w, h); c.restore();
          } else c.drawImage(im, x, y, w, h);
          c.globalAlpha = 1; S.draws.objects++;
        }
        function glow(x, y, r, rgb, a) {
          const c = g, lg = c.createRadialGradient(x, y, 1, x, y, r);
          lg.addColorStop(0, 'rgba(' + rgb + ',' + a.toFixed(3) + ')');
          lg.addColorStop(1, 'rgba(' + rgb + ',0)');
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = lg; c.fillRect(x - r, y - r, r * 2, r * 2);
          c.globalCompositeOperation = 'source-over';
          S.draws.glows++;
        }
        /* Resplandor DENTRO de la grieta: aditivo, no tapa el marco ni el
           panel III · DESCENSO (la elipse interior queda por encima de él). */
        function drawFissure() {
          const cm = cam();
          if (hubLoc() === 'CAMPAIGN_ROOM') return;
          const cx = 640 + cm.zoom * (1250 - cm.x);
          const cy = 450 + cm.zoom * (1342 - cm.y);
          const rx = 92 * cm.zoom, ry = 34 * cm.zoom;
          if (cy + ry < 0 || cy - ry > g.canvas.height) return;
          const c = g, t = reduced() ? 2.2 : zz();
          const pulse = reduced() ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.5 + 1.2);
          const de = descent();
          c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
          c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.clip();
          c.globalCompositeOperation = 'lighter';
          const lg = c.createRadialGradient(cx, cy + ry * 0.45, 2, cx, cy + ry * 0.45, rx * 1.15);
          lg.addColorStop(0, 'rgba(251,146,60,' + (0.17 + 0.09 * pulse + 0.12 * de.open).toFixed(3) + ')');
          lg.addColorStop(0.45, 'rgba(34,211,238,0.075)');
          lg.addColorStop(1, 'rgba(2,3,10,0)');
          c.fillStyle = lg; c.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
          /* Una banda diminuta de luces lejanas en el fondo del agujero: el
             interior deja de ser un negro plano y sugiere distancia real. */
          const lights = v5(A.luces);
          if (lights) {
            c.globalAlpha = 0.26 + 0.16 * de.open;
            c.drawImage(lights, cx - rx, cy + ry * 0.05, rx * 2, ry * 0.95);
            c.globalAlpha = 1;
          }
          c.globalCompositeOperation = 'source-over';
          c.restore();
          /* Brasas que emergen de la grieta: 5 puntos mínimos, mitad superior
             de la elipse (por encima del panel III · DESCENSO). */
          if (!reduced()) {
            c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
            c.beginPath(); c.ellipse(cx, cy - ry * 0.25, rx * 0.82, ry * 0.58, 0, 0, Math.PI * 2); c.clip();
            for (let i = 0; i < 5; i++) {
              const u = (t * (0.16 + i * 0.031) + i * 0.21) % 1;
              const ex = cx + Math.sin(t * 0.7 + i * 2.1 + de.open) * rx * 0.55 + (i - 2) * rx * 0.16;
              const ey = cy + ry * 0.34 - u * ry * 0.92;
              c.globalAlpha = (1 - u) * 0.34;
              c.fillStyle = i % 2 ? '#67e8f9' : '#fb923c';
              c.fillRect(Math.round(ex), Math.round(ey), 1.6, 2.8);
            }
            c.globalAlpha = 1; c.restore();
          }
        }
        function drawCutaway() {
          const q = geom();
          if (!S.visible) return;
          const c = g, W = q.W, H = q.H, T = q.T, Wh = q.Wh, B = q.boxes, de = q.de;
          const t = reduced() ? 2.2 : zz();
          c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
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

          /* --- P5 · fuentes de luz infernales al fondo ---------------------- */
          band(A.luces, B[4], Wh * 0.42, 0.34 + 0.44 * de.open, true);
          for (let i = 0; i < FAR.length; i++) {
            const f = FAR[i];
            const lx = W * f.lane + Math.sin(f.phase) * 16 * (1 - i * 0.2);
            const ly = H - 22 - (i % 2) * 12;
            glow(lx, ly, 10 + 15 * de.open, i === 1 ? '34,211,238' : '251,146,60',
                 0.10 + 0.13 * de.open);
          }
          /* --- P4 · pared lejana + cavidades (menor contraste) -------------- */
          const farBoost = 1 + de.open * 0.55;
          band(A.cavidades, B[3], Wh * 0.34, B[3].alpha * 0.82 * farBoost, false);
          band(A.paredLejana, { x: B[2].x, y: B[3].y - Wh * 0.13, w: B[2].w },
               Wh * 0.30, B[3].alpha * 0.78 * farBoost, false);
          /* --- P3 · rocas suspendidas + plataforma (con balanceo) ----------- */
          const sway = reduced() ? 0 : Math.sin(t * 0.22) * 5;
          const b3 = B[2];
          object(A.rocas, b3.x + b3.w * 0.08 + Math.sin(t * 0.11) * 4,
                 b3.y - Wh * 0.13, b3.w * 0.30, Wh * 0.34, b3.alpha * 0.9, false);
          object(A.rocas, b3.x + b3.w * 0.68 + Math.sin(t * 0.09 + 2) * 3,
                 b3.y - Wh * 0.09, b3.w * 0.20, Wh * 0.23, b3.alpha * 0.7, true);
          object(A.plataforma, b3.x + b3.w * 0.36 + sway, b3.y - Wh * 0.16,
                 b3.w * 0.32, Wh * 0.27, b3.alpha, false);
          /* --- P2 · estrato + columnas ------------------------------------- */
          band(A.estrato, B[1], Wh * 0.42, B[1].alpha, false);
          const b2 = B[1];
          object(A.columna, b2.x + b2.w * 0.19, b2.y - Wh * 0.10,
                 b2.w * 0.085, Wh * 0.46, b2.alpha * 0.92, false);
          object(A.columna, b2.x + b2.w * 0.76 + Math.sin(t * 0.13) * 3,
                 b2.y - Wh * 0.06, b2.w * 0.062, Wh * 0.34, b2.alpha * 0.78, true);
          /* --- humo infernal: corrientes lentas, densidad variable --------- */
          const hs = Wh * 0.56;
          for (let i = 0; i < SMOKE.length; i++) {
            const s = SMOKE[i];
            const im = v5(A.humo); if (!im) break;
            const drift = reduced() ? 0 : Math.sin(t * 0.17 + s.phase) * s.sway;
            const dens = s.alpha * (0.72 + 0.28 * Math.sin(t * 0.23 + s.phase)) * (1 + de.p * 0.35);
            c.globalAlpha = Math.max(0.04, dens);
            c.drawImage(im, W * s.lane + drift + B[3].dx * 0.5,
                        H - hs * s.scale - (reduced() ? 0 : (t * 5 * (i + 1)) % 14),
                        W * 0.16 * s.scale, hs * s.scale);
            c.globalAlpha = 1; S.draws.smoke++;
          }
          /* --- P1 · paredes próximas con máxima definición ------------------ */
          /* Las paredes se reservan los tercios laterales: el centro queda
             ABIERTO para que se lean las profundidades. Si cubrieran todo el
             ancho, el abismo parecería un suelo rocoso más. */
          const b1 = B[0], nw = W * 0.36, nh = Wh * 0.95;
          object(A.paredIzq, -34 + b1.dx * 0.25, T - 2, nw, nh, b1.alpha * 0.92, false);
          object(A.paredDer, W * 0.64 + b1.dx * 0.25, T - 2, nw, nh, b1.alpha * 0.92, true);
          /* Vacío central: oscurece el centro sin tapar los planos lejanos. */
          const vg = c.createLinearGradient(0, T, 0, H);
          vg.addColorStop(0, 'rgba(2,3,10,0)');
          vg.addColorStop(0.45, 'rgba(2,3,10,0.28)');
          vg.addColorStop(1, 'rgba(2,3,10,0.58)');
          c.save();
          c.beginPath();
          c.moveTo(W * 0.30, T); c.lineTo(W * 0.70, T);
          c.lineTo(W * 0.61, H); c.lineTo(W * 0.39, H);
          c.closePath(); c.clip();
          c.fillStyle = vg; c.fillRect(0, T, W, H - T);
          c.restore();
          /* --- luces profundas: laten SÓLO dentro del abismo --------------- */
          c.globalCompositeOperation = 'lighter';
          for (let k = 0; k < 7; k++) {
            const lx = W * (0.36 + (k * 0.137) % 0.30) + Math.sin(t * 0.08 + k) * 6;
            const ly = H - 16 - (k % 3) * 9;
            const rr = 11 + 17 * de.open + 4 * (reduced() ? 0.5 : Math.sin(t * 0.6));
            glow(lx, ly, rr, '251,146,60', 0.11 + 0.17 * de.open);
          }
          c.globalCompositeOperation = 'source-over';
          c.globalAlpha = 1;
          c.restore();
          S.frames++;
        }
        /* Brasas, ceniza y motas: confinadas al cutaway, lejos del jugador y
           de los NPC. Se dibujan antes del HUD (zf). */
        function drawAmbient() {
          const q = geom();
          if (!S.visible) return;
          const c = g, W = q.W, H = q.H, T = q.T, Wh = q.Wh, B = q.boxes, de = q.de;
          c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
          for (let i = 0; i < EMB.length; i++) {
            const e = EMB[i], b = B[e.band];
            const x = b.x + b.w * e.lane + Math.sin(S.clock * 0.7 + i) * (2 + e.band * 3);
            const y = H - e.t * Wh * (0.95 + 0.15 * de.open);
            e.x = x; e.y = y; e.a = Math.max(0, (1 - e.t) * (0.32 + 0.22 * de.open));
            if (y < T + 2 || y > H || x < 0 || x > W) continue;
            c.globalAlpha = e.a;
            c.fillStyle = i % 5 === 0 ? '#67e8f9' : (i % 3 === 0 ? '#f472b6' : '#fb923c');
            c.fillRect(Math.round(x), Math.round(y), e.size, e.size * 1.8);
            S.draws.embers++;
          }
          for (let i = 0; i < ASH.length; i++) {
            const a = ASH[i];
            const x = W * (0.20 + 0.60 * a.lane) + Math.sin(S.clock * a.drift + i) * 26;
            const y = T + Wh * (0.18 + 0.72 * a.t);
            a.x = x; a.y = y; a.a = 0.10 * (1 - a.t);
            if (y < T + 2 || y > H) continue;
            c.globalAlpha = a.a; c.fillStyle = '#c4b5fd';
            c.fillRect(Math.round(x), Math.round(y), a.size, a.size);
            S.draws.ash++;
          }
          c.globalAlpha = 1;
          c.restore();
        }
        let installed = false;
        function install() {
          if (installed) return false;
          installed = true;
          const safe = function (fn, tag) {
            try { fn(); } catch (e) { note(tag + ': ' + (e && e.message || e)); }
          };
          /* T08 se monta DESPUÉS de T07: prevZf es el wrapper de T07, de modo
             que el cutaway queda debajo de los overlays de descenso y del HUD. */
          const prevZf = zf;
          zf = function () {
            if (on()) {
              safe(drawFissure, 'zf/fissure');
              safe(drawCutaway, 'zf/cutaway');
              safe(drawAmbient, 'zf/ambient');
            }
            return prevZf.apply(this, arguments);
          };
          const prevTf = Tf;
          Tf = function (dt) {
            const r = prevTf.apply(this, arguments);
            if (on()) safe(function () { update(dt); }, 'Tf');
            return r;
          };
          return true;
        }
        function snapshot() {
          const q = geom();
          return JSON.parse(JSON.stringify({
            version: VER, enabled: S.enabled,
            flag: window.__DDM_HUB_T08 === false ? 'OFF' : 'ON',
            clock: +S.clock.toFixed(2), frames: S.frames, updates: S.updates,
            visible: S.visible, winTop: +S.winTop.toFixed(1), winH: +S.winH.toFixed(1),
            expand: +S.expand.toFixed(1), descentP: +S.descentP.toFixed(3),
            draws: S.draws, errors: S.errors.slice(), lastError: S.lastError,
            camera: { x: q.cm.x, y: q.cm.y, zoom: q.cm.zoom },
            assets: Object.keys(A).map(function (k) { return { key: k, alias: A[k], loaded: !!v5(A[k]) }; }),
            boxes: q.boxes.map(function (b) {
              return { id: b.id, d: b.d, factor: b.factor, x: +b.x.toFixed(1),
                       y: +b.y.toFixed(1), w: +b.w.toFixed(1), h: +b.h.toFixed(1),
                       dx: +b.dx.toFixed(1), alpha: b.alpha };
            }),
            embers: EMB.slice(0, 8).map(function (e) {
              return { x: +e.x.toFixed(1), y: +e.y.toFixed(1), t: +e.t.toFixed(3) };
            })
          }));
        }
        window.DMO_HUB_T08 = Object.freeze({
          state: snapshot, debug: snapshot,
          setEnabled: function (v) { S.enabled = !!v; return S.enabled; },
          planes: PLANES, aliases: A
        });
        return { install: install, state: snapshot };
      })();
      /* === TANDA08:END (módulo) ============================================== */
