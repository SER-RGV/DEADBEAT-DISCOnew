#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DEADBEAT DISCO · HUB · TANDA 07 — integración real (Fases 2, 3 y 4).

Aplica 5 inserciones ADITIVAS y reversibles (C se monta desde B):

  HTML (DEADBEAT_DISCO.ART.html)
    A) Módulo T07 dentro de initDmoHubV35 (estado, funciones de dibujo,
       actores NPC y API de QA).
    B) Llamada T07.installActors() dentro de buildHubSpace(), junto al bucle
       de ambientDancers existente (mismo addHubCustomProp -> Lc -> Y-sort).
    C) Enganches Wf/Ph/zf/Tf montados en tiempo de arranque desde
       buildHubSpace() (mismo ámbito que TANDA 04-06; últimos de la cadena;
       no hay rAF/canvas/cámara/audio nuevos).

  ART_PACK/art_pack.js
    D) Bloque HUB7_* con el MISMO load() y el MISMO __DDM_V5_IMG.
    E) loadHub7() encadenado tras loadHub6() en el boot.
    F) st.version + API window.DMO_ART_PACK.hub7*.

Reglas: no se modifica ninguna línea de TANDA 01-06; no se cambia la cámara,
las colisiones, el audio, las estaciones, la progresión ni el modo de juego.
Flag A/B: window.__DDM_HUB_T07 = false desactiva TODO lo nuevo de T07.

Uso: python3 ART_TOOLS/qa/apply_hub_tanda_07.py
Backups: /tmp/t7/*.PRE_T07.*
"""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HTML = ROOT / 'DEADBEAT_DISCO.ART.html'
PACK = ROOT / 'ART_PACK' / 'art_pack.js'
BK = Path('/tmp/t7')
BK.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# A) Módulo T07 (se inserta justo después de abrir initDmoHubV35)
# ---------------------------------------------------------------------------
MODULE_JS = r'''
      /* === TANDA07:BEGIN · MÓDULO «EL UMBRAL DEL INFIERNO» =====================
         Fase 2 (llegada) · Fase 3 (vida NPC) · Fase 4 (descenso).
         NO crea motor, canvas, cámara, sistema de audio ni rAF nuevo.
         Solo reutiliza: addHubCustomProp -> Lc (Y-sort), los hooks Wf/Ph/zf/Tf
         ya encadenados, el reloj Z, Yc.reduced y los V5 existentes.
         Los 6 assets T07 entran por el MISMO registro __DDM_V5_IMG.
         Reversible con window.__DDM_HUB_T07 = false.
         ===================================================================== */
      const T07 = (function () {
        const VER = '3.9.0-tanda07';
        const S = {
          version: VER, enabled: true, clock: 0,
          arrival: { active: false, pending: false, t: 0, dur: 1.85, reason: '', plays: 0,
                     completes: 0, restored: true },
          descent: { active: false, frames: 0, completions: 0, samples: [],
                     lastKind: '' },
          actors: [], lastLocation: null,
          counts: { geography: 0, ambient: 0, screen: 0, descentScreen: 0, updates: 0 },
          errors: [], lastError: ''
        };
        function note(e) {
          try {
            S.errors.push(String(e && (e.message || e) || e));
            if (S.errors.length > 24) S.errors.shift();
            S.lastError = S.errors[S.errors.length - 1];
          } catch (_) {}
        }
        function on() { return S.enabled && window.__DDM_HUB_T07 !== false; }
        function hs() {
          try { return window.DMO_HUB && window.DMO_HUB.state ? window.DMO_HUB.state() : null; }
          catch (e) { return null; }
        }
        function cineOn() {
          try { return !!(window.DMO_CINE && window.DMO_CINE.state && window.DMO_CINE.state().active); }
          catch (e) { return false; }
        }
        function v5(k) {
          try { const im = window.__DDM_V5_IMG && window.__DDM_V5_IMG[k];
                return (im && im.complete && im.naturalWidth > 0) ? im : null; }
          catch (e) { return null; }
        }
        function inHubWorld() {
          const q = hs();
          if (!q) return false;
          return !!(q.inHub && (q.location === 'HUB' || q.location === 'TRANSITION'));
        }
        function reduced() { try { return !!Yc.reduced; } catch (e) { return false; } }
        function zz() { try { return (hub.ambientFrozenAt != null) ? hub.ambientFrozenAt : Z; } catch (e) { return Z; } }

        /* --- FASE 2 · llegada breve, repetible y SIN bloqueo de control ------ */
        function startArrival(reason) {
          if (!on()) return false;
          const q = hs();
          if (!q || !q.inHub || q.location !== 'HUB') return false;
          S.arrival.active = true;
          S.arrival.t = 0;
          S.arrival.dur = reduced() ? 0.95 : 1.85;
          S.arrival.reason = reason || 'manual';
          S.arrival.plays++;
          S.arrival.pending = false;
          S.arrival.restored = false;
          // NO se toca hub.transitionLock, ni pa/Mu/Qr, ni DMO_CINE, ni DMO_MUSIC.
          // El control sigue activo durante toda la transición.
          return true;
        }

        /* --- FASE 3 · actores NPC (5 actividades, sin IA) ------------------- */
        const ACTORS = [
          { id: 't07_danza_01',  act: 'dance', x: 1120, y: 900,  h: 96, phase: 0.35, rate: 1.00, flip: false, col: '#ec4899' },
          { id: 't07_danza_02',  act: 'dance', x: 1380, y: 900,  h: 96, phase: 2.15, rate: 0.86, flip: true,  col: '#22d3ee' },
          { id: 't07_charla_01', act: 'talk',  x: 1690, y: 1010, h: 92, phase: 0.80, rate: 0.55, flip: false, col: '#f472b6' },
          { id: 't07_charla_02', act: 'talk',  x: 1780, y: 1010, h: 92, phase: 2.60, rate: 0.48, flip: true,  col: '#67e8f9' },
          { id: 't07_descanso',  act: 'rest',  x: 1910, y: 900,  h: 88, phase: 1.40, rate: 0.30, flip: false, col: '#a855f7' },
          { id: 't07_recorrido', act: 'walk',  x: 900,  y: 700,  h: 94, phase: 3.30, rate: 0.72, flip: false, col: '#fde047', span: 62 }
        ];
        function spriteFor(a, frame) {
          if (a.act === 'rest') return v5('hub_bartender_npc') || v5('hub_cliente000_npc') || v5('hub_clubber_dancer_a');
          if (a.act === 'talk') return (a.flip ? v5('hub_clubber_dancer_b') : v5('hub_bouncer_npc')) || v5('hub_clubber_dancer_a');
          /* dance / walk: alterna los DOS V5 ya existentes, igual que
             drawFigurant() de la intro. stepIdx usa el MISMO mecanismo
             Math.floor(t*rate + phase) & 3 del HUB. */
          return (frame & 1) ? (v5('hub_clubber_dancer_b') || v5('hub_clubber_dancer_a'))
                             : (v5('hub_clubber_dancer_a') || v5('hub_clubber_dancer_b'));
        }
        function installActors() {
          if (!on()) return 0;
          S.actors.length = 0;
          for (let i = 0; i < ACTORS.length; i++) {
            const a = ACTORS[i];
            const rec = Object.assign({}, a, { lastFrame: 0, lastReact: 0, lastX: a.x, lastFlip: a.flip });
            S.actors.push(rec);
            (function (a, rec) {
              addHubCustomProp({
                id: a.id, kind: 'circle', x: a.x, y: a.y, r: 20,
                solid: false, tall: true, sortY: a.y + 2,
                hubDraw: function (ctx) {
                  if (window.__DDM_HUB_T07 === false) return;
                  const t = zz(), red = reduced();
                  const px = (typeof ye !== 'undefined' && ye) ? ye.x : 1250;
                  const py = (typeof ye !== 'undefined' && ye) ? ye.y : 965;
                  const dx = px - a.x, dy = py - a.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const react = red ? 0 : Math.max(0, Math.min(1, (185 - dist) / 85));
                  let x = a.x, y = a.y, flip = a.flip, lean = 0, bounce = 0, frame = 0, alpha = 0.98;
                  const rate = a.rate;
                  if (a.act === 'dance') {
                    frame = red ? 0 : (Math.floor(t * 5.6 * rate + a.phase) & 3);
                    bounce = red ? 0 : Math.round(Math.abs(Math.sin(t * 6.8 * rate + a.phase)) * 3.2);
                    lean = red ? 0 : Math.sin(t * 3.3 * rate + a.phase) * 0.065;
                    if (!red) x += Math.sin(t * 1.1 * rate + a.phase) * 3.0;
                  } else if (a.act === 'talk') {
                    lean = red ? 0 : Math.sin(t * 1.5 * rate + a.phase) * 0.035;
                    bounce = red ? 0 : Math.round(Math.sin(t * 2.2 * rate + a.phase) * 1.2);
                  } else if (a.act === 'rest') {
                    lean = red ? 0 : 0.085 + Math.sin(t * 0.55 * rate + a.phase) * 0.012;
                    bounce = red ? 0 : Math.round(Math.sin(t * 1.1 * rate + a.phase) * 0.9);
                    alpha = 0.86;
                  } else if (a.act === 'walk') {
                    /* Reloj real acumulado en update(dt): el reloj artístico Z
                       avanza demasiado despacio para un recorrido visible. */
                    const wt = red ? 0 : S.clock;
                    const ph = wt * 1.35 * rate + a.phase;
                    if (!red) x += Math.sin(ph) * (a.span || 60);
                    flip = red ? a.flip : (Math.cos(ph) < 0);
                    frame = red ? 0 : (Math.floor(t * 5.2 * rate + a.phase) & 3);
                    bounce = red ? 0 : Math.round(Math.abs(Math.sin(t * 6.2 * rate + a.phase)) * 2.2);
                  }
                  /* Reacción al jugador: gira + saludo leve. Sin IA, sin
                     máquina de estados, sin cambio de estación ni colisión. */
                  if (react > 0 && a.act !== 'rest') {
                    flip = dx < 0;
                    lean += react * 0.05 * (0.6 + 0.4 * Math.sin(t * 3.1 + a.phase));
                    bounce += Math.round(react * 1.5);
                  }
                  rec.lastFrame = frame;
                  rec.lastReact = +react.toFixed(3);
                  rec.lastX = Math.round(x);
                  rec.lastFlip = !!flip;
                  const im = spriteFor(a, frame);
                  ctx.save();
                  ctx.imageSmoothingEnabled = true;
                  ctx.fillStyle = 'rgba(2,6,23,0.42)';
                  ctx.beginPath(); ctx.ellipse(x, y, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
                  ctx.globalAlpha = alpha;
                  ctx.translate(Math.round(x), Math.round(y + 3 - bounce));
                  ctx.rotate(lean);
                  if (flip) ctx.scale(-1, 1);
                  const hh = a.h;
                  const ww = Math.round(hh * (im ? im.naturalWidth / im.naturalHeight : 0.47));
                  if (im) ctx.drawImage(im, Math.round(-ww * 0.5), -hh, ww, hh);
                  else { ctx.fillStyle = '#f43f5e'; ctx.fillRect(-14, -hh, 28, hh); }
                  ctx.restore();
                  /* Marcas de conversación (puntos, SIN texto/diálogo) */
                  if (a.act === 'talk' && !red) {
                    const s = Math.floor(t * 2.4 * rate + a.phase) % 3;
                    ctx.save(); ctx.globalAlpha = 0.65; ctx.fillStyle = a.col;
                    for (let k = 0; k < 3; k++) {
                      ctx.beginPath();
                      ctx.arc(x + (k - 1) * 7, y - a.h - 12 - (s === k ? 3 : 0), 1.8, 0, Math.PI * 2);
                      ctx.fill();
                    }
                    ctx.restore();
                  }
                }
              });
            })(a, rec);
          }
          return ACTORS.length;
        }

        /* --- FASE 2/4 · geografía estática (Wf, coordenadas MUNDO) ---------- */
        function drawGeography() {
          if (!on() || !inHubWorld()) return;
          const lab = v5('h07_labio_acantilado');
          const est = v5('h07_estrato_rococo');
          const ape = v5('h07_apertura_profundidad');
          if (!lab && !est && !ape) return;
          const c = g;
          c.save();
          c.imageSmoothingEnabled = true;
          /* 1) Se elimina el suelo genérico bajo el borde sur (y>1585 queda
                FUERA de la caché 1920x1320 y del clip Ls(g)). */
          const bg = c.createLinearGradient(0, 1580, 0, 1770);
          bg.addColorStop(0, 'rgba(10,7,20,0.72)');
          bg.addColorStop(0.45, 'rgba(5,4,12,0.93)');
          bg.addColorStop(1, '#010106');
          c.fillStyle = bg; c.fillRect(180, 1580, 2140, 190);
          /* 2) COTA -02 · pared rocosa por estratos */
          if (est) c.drawImage(est, 200, 1585, 2100, 110);
          /* 3) Abertura: la grieta continúa hacia las profundidades */
          if (ape) c.drawImage(ape, 1040, 1560, 420, 260);
          /* 4) COTA -01 · labio del acantilado sobre el suelo transitable */
          if (lab) c.drawImage(lab, 500, 1470, 1500, 115);
          /* 5) Ingletes de continuidad con los paramentos T06 (y=1540) */
          c.fillStyle = 'rgba(12,8,24,0.90)';
          c.beginPath();
          c.moveTo(290, 1540); c.lineTo(500, 1585); c.lineTo(500, 1680); c.lineTo(290, 1600);
          c.closePath(); c.fill();
          c.beginPath();
          c.moveTo(2210, 1540); c.lineTo(2000, 1585); c.lineTo(2000, 1680); c.lineTo(2210, 1600);
          c.closePath(); c.fill();
          /* 6) Luz estática de profundidad bajo la abertura */
          const gl = c.createRadialGradient(1250, 1630, 8, 1250, 1630, 190);
          gl.addColorStop(0, 'rgba(251,146,60,0.20)');
          gl.addColorStop(0.55, 'rgba(34,211,238,0.07)');
          gl.addColorStop(1, 'rgba(2,3,10,0)');
          c.fillStyle = gl; c.fillRect(1030, 1560, 440, 200);
          c.restore();
          S.counts.geography++;
        }

        /* --- FASE 2/4 · animación ambiental (Ph, coordenadas MUNDO) --------- */
        function drawAmbient() {
          if (!on()) return;
          const show = inHubWorld() || (typeof floorDropAnim !== 'undefined' && floorDropAnim && floorDropAnim.active);
          if (!show) return;
          const c = g, t = reduced() ? 4.2 : zz(), hubNow = inHubWorld();
          c.save();
          if (hubNow) {
            const pulse = 0.5 + 0.5 * Math.sin(t * 1.35 + 0.7);
            const gl = c.createRadialGradient(1250, 1620, 10, 1250, 1620, 210);
            gl.addColorStop(0, 'rgba(251,146,60,' + (0.10 + 0.06 * pulse).toFixed(3) + ')');
            gl.addColorStop(0.6, 'rgba(34,211,238,' + (0.04 + 0.03 * pulse).toFixed(3) + ')');
            gl.addColorStop(1, 'rgba(2,3,10,0)');
            c.fillStyle = gl; c.fillRect(1020, 1545, 460, 220);
            /* Brasas ascendentes: deterministas por índice, sin random/frame */
            for (let i = 0; i < 26; i++) {
              const sx = 320 + ((i * 149) % 1860);
              const speed = 14 + (i % 5) * 5;
              const sy = 1675 - ((t * speed + i * 37) % 145);
              const fade = Math.max(0, 1 - (1675 - sy) / 145);
              c.globalAlpha = (0.18 + 0.34 * fade) * (0.6 + 0.4 * Math.sin(t * 2 + i));
              c.fillStyle = (i % 3 === 0) ? '#67e8f9' : (i % 3 === 1 ? '#fb923c' : '#f472b6');
              const sz = 1.6 + (i % 3) * 0.7;
              c.fillRect(Math.round(sx), Math.round(sy), sz, sz * 1.7);
            }
            c.globalAlpha = 1;
            /* Polvo iluminado sobre el labio */
            for (let i = 0; i < 14; i++) {
              const sx = 560 + ((i * 211) % 1380) + Math.sin(t * 0.7 + i) * 9;
              const sy = 1480 + ((i * 53 + Math.sin(t * 0.9 + i) * 12) % 95);
              c.globalAlpha = 0.10 + 0.10 * (0.5 + 0.5 * Math.sin(t * 1.6 + i * 1.3));
              c.fillStyle = i % 2 ? '#fde047' : '#f472b6';
              c.fillRect(Math.round(sx), Math.round(sy), 2, 2);
            }
            c.globalAlpha = 1;
          }
          c.restore();
          S.counts.ambient++;
        }

        /* --- FASE 2/4 · pantalla (zf, ANTES del HUD; coords de PANTALLA) ----
           Se dibuja antes de prevZf para no tapar el HUD. Nunca pantalla
           negra: todos los alfas son parciales y el mundo sigue visible. */
        function drawScreen() {
          if (!on()) return;
          const c = g;
          const W = c.canvas ? c.canvas.width : 1280;
          const H = c.canvas ? c.canvas.height : 900;
          const a = S.arrival;
          const fd = (typeof floorDropAnim !== 'undefined') ? floorDropAnim : null;
          if (!a.active && !(fd && fd.active)) return;
          c.save();
          c.setTransform(1, 0, 0, 1, 0, 0);
          c.imageSmoothingEnabled = true;
          if (a.active) {
            const u = Math.max(0, Math.min(1, a.t / a.dur));
            const ext = v5('h07_exterior_infernal');
            const pan = v5('h07_panorama_acantilado');
            if (ext) { c.globalAlpha = 0.68 * Math.pow(1 - u, 1.35); c.drawImage(ext, 0, 0, W, H); }
            if (pan && u > 0.28 && u < 0.82) {
              c.globalAlpha = 0.30 * Math.sin(Math.PI * (u - 0.28) / 0.54);
              c.drawImage(pan, 0, 0, W, H);
            }
            /* Luces del club que se encienden progresivamente */
            c.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 5; i++) {
              const lx = W * (0.16 + i * 0.17), ly = H * (0.30 + (i % 2) * 0.16);
              const rr = 90 + (i % 3) * 55;
              const lg = c.createRadialGradient(lx, ly, 2, lx, ly, rr);
              lg.addColorStop(0, 'rgba(' + (i % 2 ? '34,211,238' : '244,114,182') + ',' + (0.10 * u).toFixed(3) + ')');
              lg.addColorStop(1, 'rgba(0,0,0,0)');
              c.fillStyle = lg; c.fillRect(lx - rr, ly - rr, rr * 2, rr * 2);
            }
            c.globalCompositeOperation = 'source-over';
            for (let i = 0; i < 20; i++) {
              const sx = (i * 137 + 41) % W;
              const sy = H - ((a.t * (36 + (i % 4) * 16) + i * 53) % (H * 0.8));
              c.globalAlpha = 0.30 * (1 - u);
              c.fillStyle = i % 3 ? '#fb923c' : '#67e8f9';
              c.fillRect(Math.round(sx), Math.round(sy), 2, 3);
            }
            c.globalAlpha = 0.42 * (1 - u);
            const vg = c.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, H * 0.78);
            vg.addColorStop(0, 'rgba(2,3,10,0)');
            vg.addColorStop(1, 'rgba(2,3,10,1)');
            c.fillStyle = vg; c.fillRect(0, 0, W, H);
            c.globalAlpha = 1;
          }
          if (fd && fd.active && (fd.phase === 'plunge' || fd.phase === 'skyfall')) {
            /* Progreso REAL: el API público expone stairP, pero el objeto
               interno guarda stairProgress / shaftOpen. Se toma el máximo
               para que el parallax avance en TODAS las fases. */
            const sp = Number(fd.stairProgress) || 0;
            const so = Number(fd.shaftOpen) || 0;
            const sky = (fd.phase === 'skyfall') ? 0.92 : 0;
            const p = Math.max(0, Math.min(1, Math.max(sp, so * 0.8, sky)));
            const shaft = v5('h07_pozo_capas');
            const t = reduced() ? 2.5 : zz();
            if (shaft) {
              const off = ((t * 26 + p * 210) % H);
              c.globalAlpha = 0.27 + 0.15 * p;
              c.drawImage(shaft, -W * 0.06, -off, W * 1.12, H * 1.35);
              c.drawImage(shaft, -W * 0.06, H - off, W * 1.12, H * 1.35);
            }
            c.globalAlpha = 1;
            const dg = c.createLinearGradient(0, 0, 0, H);
            dg.addColorStop(0, 'rgba(34,211,238,' + (0.05 + 0.04 * (1 - p)).toFixed(3) + ')');
            dg.addColorStop(0.5, 'rgba(8,6,20,0.06)');
            dg.addColorStop(1, 'rgba(1,2,8,' + (0.16 + 0.18 * p).toFixed(3) + ')');
            c.fillStyle = dg; c.fillRect(0, 0, W, H);
            /* Haz de luz que se estrecha al descender (continuidad arriba) */
            const beam = c.createLinearGradient(W * 0.5 - 120, 0, W * 0.5 + 120, 0);
            beam.addColorStop(0, 'rgba(34,211,238,0)');
            beam.addColorStop(0.5, 'rgba(103,232,249,' + (0.045 + 0.055 * (1 - p)).toFixed(3) + ')');
            beam.addColorStop(1, 'rgba(34,211,238,0)');
            c.fillStyle = beam; c.fillRect(W * 0.5 - 120, 0, 240, H * 0.62);
            for (let i = 0; i < 18; i++) {
              const sx = (i * 191 + 67) % W;
              const sy = H - ((t * (55 + (i % 5) * 22) + i * 71) % H);
              c.globalAlpha = 0.16 + 0.20 * p;
              c.fillStyle = i % 3 === 0 ? '#67e8f9' : '#fb923c';
              c.fillRect(Math.round(sx), Math.round(sy), 1.6, 5 + (i % 3) * 2);
            }
            c.globalAlpha = 1;
            S.counts.descentScreen++;
          }
          c.restore();
          S.counts.screen++;
        }

        /* --- Tf · estado (sin bucle propio) -------------------------------- */
        function update(dt) {
          S.counts.updates++;
          S.clock += Math.max(0, Math.min(0.1, Number(dt) || 0.016));
          const q = hs(), loc = q ? q.location : null;
          /* Sólo se considera «llegada» volver desde CAMPAIGN_ROOM / TRANSITION
             (o el primer arranque). Los modales de estación NO cambian
             hub.location, por lo que no disparan la transición. */
          if (loc && loc !== S.lastLocation) {
            if (loc === 'HUB' && (S.lastLocation === null ||
                S.lastLocation === 'CAMPAIGN_ROOM' || S.lastLocation === 'TRANSITION')) {
              S.arrival.pending = true;
            }
            S.lastLocation = loc;
          }
          /* Espera a que termine la intro y a que el control esté libre,
             sin imponer NINGÚN bloqueo por nuestra parte. */
          if (S.arrival.pending && q && q.inHub && q.location === 'HUB' &&
              q.mode === 'EXPLORATION' && !q.transitionLock && !cineOn()) {
            startArrival('hub-entry');
          }
          const a = S.arrival;
          if (a.active) {
            a.t += Math.max(0, Math.min(0.1, Number(dt) || 0.016));
            if (!a.restored && a.t > 0.25) a.restored = true;
            if (a.t >= a.dur) { a.active = false; a.completes++; a.t = a.dur; }
          }
          try {
            const fd = (typeof floorDropAnim !== 'undefined') ? floorDropAnim : null;
            const act = !!(fd && fd.active);
            if (act) {
              if (!S.descent.active) { S.descent.samples.length = 0; S.descent.frames = 0; }
              S.descent.active = true; S.descent.frames++;
              S.descent.lastKind = fd.transitionKind || '';
              if (S.descent.samples.length < 160) S.descent.samples.push({
                phase: fd.phase || '', stage: fd.stage || '',
                stairP: +(Number(fd.stairProgress) || 0).toFixed(3),
                shaftOpen: +(Number(fd.shaftOpen) || 0).toFixed(3),
                plungeOffsetY: +(Number(fd.plungeOffsetY) || 0).toFixed(1),
                toHub: !!fd.toHub, kind: fd.transitionKind || ''
              });
            } else if (S.descent.active) {
              S.descent.active = false; S.descent.completions++;
            }
          } catch (e) { note(e); }
        }

        /* --- Enganches: se instalan EN TIEMPO DE ARRANQUE desde
           buildHubSpace(), cuando TODAS las cadenas Wf/Ph/zf/Tf de
           TANDA 01-06, CINE, música y v3.5 ya están montadas. Así T07
           queda el ÚLTIMO de cada cadena sin reescribir el motor. */
        let hooksInstalled = false;
        function installHooks() {
          if (hooksInstalled) return false;
          hooksInstalled = true;
          const safe = function (fn, tag) {
            try { fn(); } catch (e) { note(tag + ': ' + (e && e.message || e)); }
          };
          const prevWf = Wf;
          Wf = function () {
            const r = prevWf.apply(this, arguments);
            safe(function () { drawGeography(); }, 'Wf');
            return r;
          };
          const prevPh = Ph;
          Ph = function () {
            const r = prevPh.apply(this, arguments);
            safe(function () { drawAmbient(); }, 'Ph');
            return r;
          };
          const prevZf = zf;
          zf = function () {
            safe(function () { drawScreen(); }, 'zf');
            return prevZf.apply(this, arguments);
          };
          const prevTf = Tf;
          Tf = function (dt) {
            const r = prevTf.apply(this, arguments);
            safe(function () { update(dt); }, 'Tf');
            return r;
          };
          return true;
        }

        function snapshot() {
          return JSON.parse(JSON.stringify({
            version: VER, enabled: S.enabled, clock: +S.clock.toFixed(2),
            flag: window.__DDM_HUB_T07 === false ? 'OFF' : 'ON',
            arrival: S.arrival,
            descent: { active: S.descent.active, frames: S.descent.frames,
                       completions: S.descent.completions,
                       lastKind: S.descent.lastKind, samples: S.descent.samples.slice(-32) },
            actors: S.actors,
            lastLocation: S.lastLocation, counts: S.counts,
            errors: S.errors.slice(), lastError: S.lastError,
            assets: ['h07_labio_acantilado', 'h07_estrato_rococo',
                     'h07_apertura_profundidad', 'h07_exterior_infernal',
                     'h07_pozo_capas', 'h07_panorama_acantilado']
                    .map(function (k) { return { slot: k, loaded: !!v5(k) }; }),
            audioTouched: false, cameraTouched: false, newCanvases: 0, newRAF: 0,
            hooksInstalled: hooksInstalled
          }));
        }
        return { VER: VER, S: S, on: on, note: note, startArrival: startArrival,
                 installActors: installActors, installHooks: installHooks,
                 drawGeography: drawGeography,
                 drawAmbient: drawAmbient, drawScreen: drawScreen,
                 update: update, snapshot: snapshot,
                 actors: function () { return S.actors.map(function (a) { return Object.assign({}, a); }); } };
      })();
      window.__DDM_T07 = T07;
      window.DMO_HUB_T07 = Object.freeze({
        version: T07.VER,
        state: function () { return T07.snapshot(); },
        actors: T07.actors,
        replayArrival: function () { return T07.startArrival('manual'); },
        setEnabled: function (v) { T07.S.enabled = !!v; return T07.S.enabled; },
        audit: function () {
          const s = T07.snapshot();
          return { ok: s.errors.length === 0 && s.assets.every(function (a) { return a.loaded; }),
                   assetsLoaded: s.assets.filter(function (a) { return a.loaded; }).length,
                   actors: s.actors.length, activities: s.actors.reduce(function (m, a) {
                     m[a.act] = (m[a.act] || 0) + 1; return m; }, {}),
                   errors: s.errors.slice(), counts: s.counts };
        }
      });
      /* === TANDA07:END (módulo) ============================================= */
'''

# ---------------------------------------------------------------------------
# B) installActors() dentro de buildHubSpace
# ---------------------------------------------------------------------------
ACTORS_CALL = r'''
        /* === TANDA07:BEGIN · FASE 3 · actores NPC =============================
           Mismo renderer: addHubCustomProp -> Lc -> Y-sort. solid:false,
           tall:true, sortY = línea de pies. No añade colisiones ni estaciones.
           Reversible con window.__DDM_HUB_T07 = false. */
        T07.installActors();
        /* Los enganches se montan aquí (tiempo de arranque, no de parseo):
           Wf/Ph/zf/Tf ya están en su cadena final. Una sola vez. */
        T07.installHooks();
        /* === TANDA07:END · FASE 3 ========================================== */
'''

# ---------------------------------------------------------------------------
# C) Sin inserción en el cierre exterior del script.
#    Los enganches se montan en TIEMPO DE ARRANQUE desde buildHubSpace(),
#    dentro del ámbito de initDmoHubV35 donde Wf/Ph/zf/Tf SÍ existen
#    (es el mismo ámbito que usan TANDA 04/05/06). Al ejecutarse tarde,
#    T07 queda el ÚLTIMO eslabón de las cuatro cadenas.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# D) Bloque HUB7 en art_pack.js
# ---------------------------------------------------------------------------
PACK_BLOCK = r'''
  /* === TANDA07:BEGIN · HUB7_* (mismo load(), mismo registro V5) =============
     «El umbral del infierno». 6 assets: 4 texturas RGBA de geografía y 2
     placas JPEG de llegada/descenso. Se encadena tras loadHub6(). No hay
     segundo loader, segundo canvas ni cambio de cámara/audio. */
  var BASEH7 = 'ART_ASSETS/hub/tanda_07/';
  var HUB7_ASSETS = [
    { id: 'T07-01', unit: 'labio_acantilado', file: '01_labio/final/hub_t07_01_labio.png', w: 1500, h: 115, alias: 'h07_labio_acantilado', worldH: 115, category: 'COTA -01 · labio' },
    { id: 'T07-02', unit: 'estrato_rococo', file: '02_estrato/final/hub_t07_02_estrato.png', w: 2100, h: 110, alias: 'h07_estrato_rococo', worldH: 110, category: 'COTA -02 · pared rocosa' },
    { id: 'T07-03', unit: 'apertura_profundidad', file: '03_apertura/final/hub_t07_03_apertura.png', w: 420, h: 260, alias: 'h07_apertura_profundidad', worldH: 260, category: 'COTA -02/-03 · abertura' },
    { id: 'T07-04', unit: 'exterior_infernal', file: '04_exterior/final/hub_t07_04_exterior.jpg', w: 1280, h: 720, alias: 'h07_exterior_infernal', worldH: 0, category: 'Fase 2 · llegada' },
    { id: 'T07-05', unit: 'pozo_capas', file: '05_pozo/final/hub_t07_05_pozo.png', w: 512, h: 1024, alias: 'h07_pozo_capas', worldH: 0, category: 'Fase 4 · descenso' },
    { id: 'T07-06', unit: 'panorama_acantilado', file: '06_panorama/final/hub_t07_06_panorama.jpg', w: 1280, h: 720, alias: 'h07_panorama_acantilado', worldH: 0, category: 'Fase 2 · placa intermedia' }
  ];
  var HUB7_IMAGES = {};
  var HUB7_ORIGINALS = {};
  var hub7Applied = false;

  function hub7Err(where, e) {
    var msg = where + ': ' + (e && (e.message || e.type) || String(e));
    if (!st.hub7Errors) st.hub7Errors = [];
    st.hub7Errors.push(msg);
    try { console.warn('[ART_PACK/HUB7] ' + msg); } catch (_) {}
  }
  function hub7Invalidate() {
    try {
      if (window.DMO_INFERNAL_ART && typeof window.DMO_INFERNAL_ART.invalidate === 'function') {
        window.DMO_INFERNAL_ART.invalidate();
      }
    } catch (e) { hub7Err('invalidate', e); }
    try {
      if (window.__T3B && typeof window.__T3B.setEnabled === 'function') window.__T3B.setEnabled(true);
    } catch (e) { hub7Err('setEnabled', e); }
  }
  function applyHub7() {
    var reg = window.__DDM_V5_IMG;
    if (!reg) { hub7Err('HUB7', '__DDM_V5_IMG no disponible'); return 0; }
    var n = 0;
    HUB7_ASSETS.forEach(function (a) {
      var im = HUB7_IMAGES[a.id];
      if (!im) return;
      try { im.__hubTanda07 = a.id; } catch (_) {}
      if (!Object.prototype.hasOwnProperty.call(HUB7_ORIGINALS, a.alias)) HUB7_ORIGINALS[a.alias] = reg[a.alias];
      reg[a.alias] = im; n++;
    });
    hub7Applied = (n === HUB7_ASSETS.length);
    hub7Invalidate();
    st.hub7 = {
      version: 'hub-tanda07', count: HUB7_ASSETS.length,
      productionUnits: HUB7_ASSETS.length, files: HUB7_ASSETS.length,
      registered: n, enabled: hub7Applied,
      loader: 'load() -> __DDM_V5_IMG[alias h07_*]',
      renderer: 'DEADBEAT_DISCO.ART.html :: hooks Wf/Ph/zf (T07)',
      flag: 'window.__DDM_HUB_T07 !== false',
      note: '6/6 assets T07 en el MISMO registro V5 y MISMO load(). '
          + 'Sin segundo motor, canvas, cámara ni audio.',
      appliedAt: Date.now()
    };
    return n;
  }
  function restoreHub7() {
    var reg = window.__DDM_V5_IMG, n = 0;
    if (reg) {
      HUB7_ASSETS.forEach(function (a) {
        if (!Object.prototype.hasOwnProperty.call(HUB7_ORIGINALS, a.alias)) return;
        reg[a.alias] = HUB7_ORIGINALS[a.alias];
        if (reg[a.alias] === undefined) delete reg[a.alias];
        n++;
      });
    }
    hub7Applied = false;
    if (st.hub7) { st.hub7.enabled = false; st.hub7.registered = 0; }
    hub7Invalidate();
    return n;
  }
  function loadHub7(done) {
    var pending = HUB7_ASSETS.length;
    HUB7_ASSETS.forEach(function (a) {
      var rec = { id: a.id, file: BASEH7 + a.file, expected: [a.w, a.h],
                  loaded: false, natural: null, exactSize: false };
      load(rec.file, rec, function (im) {
        if (im) {
          HUB7_IMAGES[a.id] = im;
          if (!rec.exactSize) hub7Err(a.id, 'dimensiones inesperadas ' + rec.natural);
        } else hub7Err(a.id, 'no se pudo decodificar ' + rec.file);
        if (--pending === 0) done(applyHub7());
      });
    });
  }
  function hub7() {
    var reg = window.__DDM_V5_IMG || {}, get = window.__DDM_GET_V5;
    var list = HUB7_ASSETS.map(function (a) {
      var im = HUB7_IMAGES[a.id] || null;
      var resolves = 0;
      try { if (typeof get === 'function' && get(a.alias) === im) resolves = 1; } catch (_) {}
      return {
        id: a.id, unit: a.unit, file: BASEH7 + a.file, alias: a.alias,
        aliasLive: !!(im && reg[a.alias] === im), loaderResolves: resolves,
        expected: [a.w, a.h], natural: im ? [im.naturalWidth, im.naturalHeight] : null,
        exactSize: !!im && im.naturalWidth === a.w && im.naturalHeight === a.h,
        loaded: !!im, registered: !!(im && reg[a.alias] === im)
      };
    });
    return {
      version: 'hub-tanda07', count: HUB7_ASSETS.length,
      productionUnits: HUB7_ASSETS.length, enabled: hub7Applied,
      registered: list.filter(function (a) { return a.registered; }).length,
      loaded: list.filter(function (a) { return a.loaded; }).length,
      exactSize: list.filter(function (a) { return a.exactSize; }).length,
      errors: (st.hub7Errors || []).slice(), assets: list,
      note: '6/6 PNG/JPG de TANDA 07 en el MISMO registro V5 y MISMO load().'
    };
  }
  function hub7Tag() {
    HUB7_ASSETS.forEach(function (a) {
      var im = HUB7_IMAGES[a.id];
      if (im) { try { im.__hubTanda07 = a.id; } catch (_) {} }
    });
    return HUB7_ASSETS.length;
  }
  function hub7Restore() { return restoreHub7(); }
  function hub7Apply() { return hub7Applied ? HUB7_ASSETS.length : applyHub7(); }
  /* === TANDA07:END · HUB7_* ================================================ */
'''


def replace_once(text: str, old: str, new: str, label: str) -> str:
    n = text.count(old)
    if n != 1:
        raise SystemExit('ANCLA ' + label + ': se esperaba 1 coincidencia, hay ' + str(n))
    return text.replace(old, new, 1)


def main() -> None:
    html = HTML.read_text(encoding='utf-8')
    pack = PACK.read_text(encoding='utf-8')
    if 'TANDA07:BEGIN' in html or 'TANDA07:BEGIN' in pack:
        raise SystemExit('TANDA 07 ya aplicada (marcadores presentes). No se re-aplica.')
    shutil.copy2(HTML, BK / 'DEADBEAT_DISCO.ART.html.PRE_T07')
    shutil.copy2(PACK, BK / 'art_pack.js.PRE_T07')

    # --- HTML: A) módulo ---------------------------------------------------
    anchor_a = '(function initDmoHubV35() {\n'
    html = replace_once(html, anchor_a, anchor_a + MODULE_JS, 'A/initDmoHubV35')

    # --- HTML: B) actores dentro de buildHubSpace --------------------------
    anchor_b = '        // Interactive Station Registry (all require explicit [E] / Button A!)\n'
    html = replace_once(html, anchor_b, ACTORS_CALL + '\n' + anchor_b, 'B/stations')

    # --- HTML: C) sin hooks en el cierre exterior ---------------------------
    # (los enganches se montan en tiempo de arranque desde buildHubSpace,
    #  dentro del ámbito donde Wf/Ph/zf/Tf existen; ver ACTORS_CALL)

    # --- PACK: D) bloque ---------------------------------------------------
    anchor_d = '  function hub6Tag() {\n'
    pack = replace_once(pack, anchor_d, PACK_BLOCK + '\n' + anchor_d, 'D/packBlock')

    # --- PACK: E) cadena de carga ------------------------------------------
    anchor_e = """                  loadHub6(function (k6) {
                    st.status = (st.errors.length || (st.archErrors || []).length ||
                                 (st.hubErrors || []).length || (st.hub2Errors || []).length ||
                                 (st.hub3Errors || []).length || (st.hub5Errors || []).length ||
                                 (st.hub6Errors || []).length)
                      ? 'applied-with-errors' : 'applied';
                    st.finishedAt = Date.now();
                  });
                  /* TANDA06:END */"""
    repl_e = """                  loadHub6(function (k6) {
                    /* TANDA07:BEGIN · mismo load(), encadenado tras TANDA 06 */
                    loadHub7(function (k7) {
                      st.status = (st.errors.length || (st.archErrors || []).length ||
                                   (st.hubErrors || []).length || (st.hub2Errors || []).length ||
                                   (st.hub3Errors || []).length || (st.hub5Errors || []).length ||
                                   (st.hub6Errors || []).length || (st.hub7Errors || []).length)
                        ? 'applied-with-errors' : 'applied';
                      st.finishedAt = Date.now();
                    });
                    /* TANDA07:END */
                  });
                  /* TANDA06:END */"""
    pack = replace_once(pack, anchor_e, repl_e, 'E/loadChain')

    # --- PACK: F) version + API --------------------------------------------
    anchor_f = "    version: 'fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02+hub-tanda03+hub-tanda05+hub-tanda06',"
    pack = replace_once(pack, anchor_f,
                        "    version: 'fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02+hub-tanda03+hub-tanda05+hub-tanda06+hub-tanda07',",
                        'F/version')
    anchor_g = "    hub6Restore: hub6Restore, hub6Apply: hub6Apply, hub6Tag: hub6Tag,\n"
    pack = replace_once(pack, anchor_g,
                        anchor_g + "    hub7: hub7, hub7Manifest: function () { return JSON.parse(JSON.stringify(HUB7_ASSETS)); },\n"
                        "    hub7Restore: hub7Restore, hub7Apply: hub7Apply, hub7Tag: hub7Tag,\n",
                        'F/api')

    HTML.write_text(html, encoding='utf-8')
    PACK.write_text(pack, encoding='utf-8')
    print('HTML:', len(html), 'bytes, +', len(html) - (BK / 'DEADBEAT_DISCO.ART.html.PRE_T07').stat().st_size)
    print('PACK:', len(pack), 'bytes, +', len(pack) - (BK / 'art_pack.js.PRE_T07').stat().st_size)
    print('Backups en', BK)
    print('OK: 5 inserciones aplicadas (A/B HTML, D/E/F PACK)')


if __name__ == '__main__':
    main()
