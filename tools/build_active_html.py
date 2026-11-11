#!/usr/bin/env python3
"""
Builds active index.html and DEADBEAT_DISCO.html from the protected original backup:
- Strips the trailing Cloudflare challenge script (#33) so 0 404/network errors occur
- Injects src/dd_rebuild_ui.css in <head>
- Injects surgical window.__DD_BRIDGE inside Script #29's IIFE closure for native-DPR
  high-resolution world rendering, playable HUB, cinematic camera & unified UI
- Appends modular src/*.js scripts before </body>
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG_PATH = os.path.join(ROOT, "backups", "DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html")

with open(ORIG_PATH, "r", encoding="utf-8") as f:
    html = f.read()

# Exponer la fase del secuenciador existente de portada, sin crear otro audio.
# E es la hora del siguiente paso de 0,1 s y C su índice; cuatro pasos
# forman un pulso de 150 BPM. Si autoplay lo suspende, devolver null.
cover_clock_anchor = 'now:function(){return y?y.currentTime-(y.outputLatency||0):0},drain:function'
assert html.count(cover_clock_anchor) == 1, "Cover music clock anchor changed"
html = html.replace(cover_clock_anchor,
    'now:function(){return y?y.currentTime-(y.outputLatency||0):0},'
    'cinematicClock:function(){return y&&S&&y.state==="running"?y.currentTime:null},'
    'cinematicBeatPhase:function(){if(!y||!S||y.state!=="running")return null;'
    'var t=y.currentTime-(y.outputLatency||0)-(E-C*R);'
    'return ((t%(.4)+.4)%.4)/.4},drain:function', 1)

# Si el hilo principal se bloquea, no programar juntos todos los pasos que
# quedaron en el pasado: saltarlos manteniendo el índice y el compás reales.
cover_scheduler_anchor = 'function ae(){if(y&&S)for(var e=y.currentTime+.14;E<e;)ee(E),E+=R,++C%16==0&&L++}'
assert html.count(cover_scheduler_anchor) == 1, "Cover scheduler anchor changed"
html = html.replace(cover_scheduler_anchor,
    'function ae(){if(y&&S){var missed=Math.max(0,Math.floor((y.currentTime-E)/R));'
    'if(missed){E+=missed*R;L+=Math.floor((C+missed)/16)-Math.floor(C/16);C+=missed}'
    'for(var e=y.currentTime+.14;E<e;)ee(E),E+=R,++C%16==0&&L++}}', 1)

# 1. Strip trailing Cloudflare challenge snippet at the very end of the file
cf_idx = html.rfind("<script>(function(){function c(){var b=a.contentDocument")
if cf_idx > len(html) - 2000:
    cf_end = html.find("</script>", cf_idx)
    if cf_end > cf_idx:
        html = html[:cf_idx] + html[cf_end + len("</script>"):]

# 2. Inline the High-Res UI CSS into <head>.
#    index.html is the OFFICIAL SINGLE-FILE BUILD: it must keep working even when only
#    this file is deployed. src/dd_rebuild_ui.css remains the editable source of truth;
#    the build embeds its exact content at the same insertion point (end of <head>).
head_anchor = "</head>"
assert head_anchor in html, "Missing </head>"
with open(os.path.join(ROOT, "src", "dd_rebuild_ui.css"), "r", encoding="utf-8") as f:
    css_src = f.read()
assert "</style" not in css_src.lower(), "CSS must not contain </style sequences"
html = html.replace(
    head_anchor,
    "  <style>\n/* === INLINED FROM src/dd_rebuild_ui.css — regenerate via tools/build_active_html.py === */\n"
    + css_src
    + "\n  </style>\n</head>",
    1
)

# 3. Inject surgical __DD_BRIDGE inside Script #29 right after v3.2 organicDebugAPI
bridge_anchor = "w.organicDebug = organicDebugAPI;\n    window.DMO_ORGANIC_DEBUG = organicDebugAPI;\n  })();"
assert html.count(bridge_anchor) == 1, f"Expected 1 bridge_anchor, got {html.count(bridge_anchor)}"

bridge_js = r"""w.organicDebug = organicDebugAPI;
    window.DMO_ORGANIC_DEBUG = organicDebugAPI;
  })();

  /* ========================================================================
     DEADBEAT DISCO — HIGH-RESOLUTION RENDER & SYSTEM BRIDGE (__DD_BRIDGE)
     Preserves 100% of physics, combat, AI, Director, DJ, floorgen & saves
     while upgrading rendering to native-DPR digital illustration + HUB + UI.
     ======================================================================== */
  (function () {
    /* --------------------------------------------------------------------
       KEYBOARD TAKEOVER GUARD
       The legacy ddc cover registers window-capture keydown/keyup listeners
       that call stopImmediatePropagation() while its internal "locked" flag
       is on. That swallows every keystroke BEFORE the HD menu / HUB /
       cinematic systems can see them (dead WASD in the Refugio, dead menu
       navigation, dead skip key). While body.dd-highres-edition is set, the
       HD layer owns the keyboard and those capture-phase window listeners
       are neutralized. Engine input (bubble-phase) and every module listener
       keep working untouched; removing the body class restores 100% of the
       legacy behavior.

       Contract (verified by tools/qa/final_review.js, block A):
         - capture arrives as the boolean `true` OR as `{capture:true}`; both
           are guarded (the options object keeps `once`/`passive`/`signal`).
         - registering the same (type, listener, capture) twice stays a DOM
           no-op, so the guard can never deliver a listener twice.
         - removeEventListener(type, listener, capture) is symmetric: it
           detaches the wrapper the guard installed, so no listener is left
           impossible to remove. Unremovable wrappers used to leak and, in
           legacy mode, a leaked stopImmediatePropagation() listener killed
           every keystroke.
         - AbortSignal: `{capture, signal}` follows the browser. A signal
           aborted AFTER registration drops its registry entry, a signal
           already aborted BEFORE registration registers nothing at all (and
           leaves no phantom entry that would dedupe a later valid add), and
           re-registering the same callback after an abort works normally.
         - `once` drops its entry on first dispatch (also when the HD gate
           swallows that dispatch), so count() never keeps stale entries.
         - only window + capture + keydown/keyup is touched; bubble-phase
           engine input and element/document listeners are never wrapped.
         - installation is idempotent (window.__DD_KEY_GUARD__ marker).
       -------------------------------------------------------------------- */
    /* == DD_KEYBOARD_GUARD:BEGIN == */
    (function installKeyboardTakeoverGuard() {
      if (window.__DD_KEY_GUARD__) return;
      const HD_CLASS = "dd-highres-edition";
      const nativeAddEventListener = window.addEventListener;
      const nativeRemoveEventListener = window.removeEventListener;
      const registry = []; // { type, fn, wrapper, options }

      function isCaptureOption(opts) {
        if (opts === true) return true;
        if (opts && typeof opts === "object") return !!opts.capture;
        return false;
      }

      function needsGuard(target, type, fn, opts) {
        return target === window &&
          (type === "keydown" || type === "keyup") &&
          typeof fn === "function" &&
          isCaptureOption(opts);
      }

      function findIndex(type, fn) {
        for (let i = 0; i < registry.length; i++) {
          if (registry[i].type === type && registry[i].fn === fn) return i;
        }
        return -1;
      }

      // Removes ONE concrete entry (by identity) and unhooks its AbortSignal
      // listener, so a stale signal can never evict a later registration.
      function dropEntry(entry) {
        const i = registry.indexOf(entry);
        if (i >= 0) registry.splice(i, 1);
        if (entry.onAbort && entry.signal && typeof entry.signal.removeEventListener === "function") {
          entry.signal.removeEventListener("abort", entry.onAbort);
          entry.onAbort = null;
        }
      }

      function forget(type, fn) {
        const i = findIndex(type, fn);
        if (i >= 0) dropEntry(registry[i]);
      }

      window.addEventListener = function (type, fn, opts) {
        if (needsGuard(this, type, fn, opts)) {
          if (findIndex(type, fn) >= 0) return; // DOM semantics: duplicate = no-op
          const signal = (opts && typeof opts === "object" && opts.signal) || null;
          // Spec: an already-aborted signal registers nothing... and must not
          // leave a phantom entry that would block a later valid registration.
          if (signal && signal.aborted) return;
          const once = !!(opts && typeof opts === "object" && opts.once);
          const entry = { type: type, fn: fn, wrapper: null, options: opts, signal: signal, onAbort: null };
          entry.wrapper = function (ev) {
            if (once) dropEntry(entry);
            if (document.body && document.body.classList.contains(HD_CLASS)) return;
            return fn.call(this, ev);
          };
          if (signal && typeof signal.addEventListener === "function") {
            // The browser detaches the real listener on abort; the registry must
            // follow, or count() leaks and re-registration gets deduped away.
            entry.onAbort = function () { dropEntry(entry); };
            signal.addEventListener("abort", entry.onAbort, { once: true });
          }
          registry.push(entry);
          return nativeAddEventListener.call(this, type, entry.wrapper, opts);
        }
        return nativeAddEventListener.apply(this, arguments);
      };

      window.removeEventListener = function (type, fn, opts) {
        if (needsGuard(this, type, fn, opts)) {
          const i = findIndex(type, fn);
          if (i >= 0) {
            const entry = registry[i];
            dropEntry(entry);
            return nativeRemoveEventListener.call(this, type, entry.wrapper, entry.options);
          }
        }
        return nativeRemoveEventListener.apply(this, arguments);
      };

      window.__DD_KEY_GUARD__ = Object.freeze({
        installed: true,
        capturesLegacyKeyboard: function () {
          return !!(document.body && document.body.classList.contains(HD_CLASS));
        },
        count: function () { return registry.length; }
      });
    })();
    /* == DD_KEYBOARD_GUARD:END == */

    const origQc = qc;
    const origBg = Bg;
    const origWA = WA;
    const origLc = Lc;
    const origPf = Pf;
    const origRf = Rf;
    const origBf = Bf;
    const origLf = Lf;
    const origUf = Uf;
    const origTt = Tt;
    const origCp = cp;
    let roomCacheInvalid = true;
    let lastRenderNow = performance.now();

    function currentCircle() {
      try {
        return typeof Ot === "object" && typeof Ot.floor === "number"
          ? Math.max(0, Math.min(9, Ot.floor))
          : Math.max(0, Math.min(9, Xe((Yo ? Yo.room : 0) + 1)));
      } catch (e) {
        return 0;
      }
    }

    function ensureNativeDprCanvas() {
      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      const targetW = Math.max(1, Math.round(y * dpr));
      const targetH = Math.max(1, Math.round(x * dpr));
      if (h.width !== targetW || h.height !== targetH) {
        h.width = targetW;
        h.height = targetH;
      }
      if (d && d.screen && (d.screen.width !== targetW || d.screen.height !== targetH)) {
        d.screen.width = targetW;
        d.screen.height = targetH;
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.imageSmoothingEnabled = true;
      try { g.imageSmoothingQuality = "high"; } catch (e) {}
      return dpr;
    }

    qc = function () {
      if (window.DD_WORLD) {
        m.width = E;
        m.height = k;
        A.imageSmoothingEnabled = true;
        try { A.imageSmoothingQuality = "high"; } catch (e) {}
        d.lamps = [];
        window.DD_WORLD.buildHighResRoomCache(A, E, k, Ps, currentCircle(), Yo ? Yo.seed : 1, Ls);
        b = true;
        roomCacheInvalid = false;
        d.builds = (d.builds || 0) + 1;
        d.cacheKey = [Yo.room, Yo.seed, Rs.id, d.ready, window.DD_ASSETS ? window.DD_ASSETS.stats().loaded : 0].join("|");
        return;
      }
      return origQc.apply(this, arguments);
    };

    Bg = function (door) {
      if (window.DD_WORLD) {
        window.DD_WORLD.drawDoor(g, door, currentCircle(), Z);
        return;
      }
      return origBg.apply(this, arguments);
    };

    WA = function (door) {
      if (window.DD_WORLD) {
        window.DD_WORLD.drawDescentPad(g, door, Z);
        return;
      }
      return origWA.apply(this, arguments);
    };

    Lc = function (prop) {
      if (window.DD_WORLD && window.DD_WORLD.drawProp(g, prop, Z)) {
        return;
      }
      return origLc.apply(this, arguments);
    };

    Pf = function () {
      if (window.DD_WORLD && w.playerAnim) {
        const drew = window.DD_WORLD.drawProtagonist(
          g,
          ye,
          w.playerAnim,
          function (layer, customCtx) { return it(layer, customCtx); },
          typeof Ee === "number" ? Ee : 0,
          typeof De === "number" ? De : 0
        );
        if (drew) return;
      }
      return origPf.apply(this, arguments);
    };

    Rf = function (enemy) {
      if (window.DD_WORLD && window.DD_WORLD.drawEnemy(g, enemy, Z)) {
        return;
      }
      return origRf.apply(this, arguments);
    };

    Bf = function (boss) {
      if (window.DD_WORLD && window.DD_WORLD.drawBoss(g, boss, currentCircle(), Z)) {
        return;
      }
      return origBf.apply(this, arguments);
    };

    Lf = function (turret) {
      if (window.DD_WORLD && window.DD_WORLD.drawTurret(g, turret, Z)) {
        return;
      }
      return origLf.apply(this, arguments);
    };

    Uf = function (pickup) {
      if (window.DD_WORLD && window.DD_WORLD.drawPickup(g, pickup, Z)) {
        return;
      }
      return origUf.apply(this, arguments);
    };

    Tt = function () {
      if (window.DD_WORLD && window.DD_WORLD.drawProjectiles(g, wa, ja)) {
        return;
      }
      return origTt.apply(this, arguments);
    };

    function buildSnapshot() {
      const wid = (Yo && Yo.weapon) || "m1911";
      const wMeta = (ja && ja[wid]) || { name: "M1911" };
      const cIdx = currentCircle();
      const cDef = (Ue && Ue[cIdx]) || { name: "EL CLUB" };
      const rName = (window.DMO_FLOOR && window.DMO_FLOOR.hudRoomName && window.DMO_FLOOR.hudRoomName()) || "";
      return {
        running: !!U,
        paused: !!Y,
        dead: !!Mr,
        circle: cIdx,
        room: Yo ? Yo.room : 0,
        globalRoom: typeof Wo === "number" ? Wo : 1,
        roomName: rName || cDef.name,
        roomBanner: (rName ? rName + " · " : "") + (cIdx >= 9 ? "NÚCLEO FINAL" : ("CÍRCULO " + Ze(cIdx) + " · " + cDef.name)),
        hp: typeof ve === "number" ? ve : 100,
        maxHp: typeof Me === "number" ? Me : 100,
        shield: typeof Ee === "number" ? Ee : 0,
        rave: typeof De === "number" ? De : 0,
        raveMeter: typeof Re === "number" ? Re : 0,
        credits: Dt ? Dt.credits : 0,
        level: typeof tr === "number" ? tr : 1,
        bombs: typeof Tr === "number" ? Tr : 0,
        boosts: typeof Sr === "number" ? Sr : 0,
        weapon: wid,
        weaponName: wMeta.name || wid,
        owned: Dt && Array.isArray(Dt.owned) ? Dt.owned.slice() : [wid],
        bossActive: !!ir,
        boss: ir && sr ? { id: sr.id, name: sr.name, hp: sr.hp, maxHp: sr.maxHp, x: sr.x, y: sr.y } : null,
        player: ye ? { x: ye.x, y: ye.y, aimAngle: ye.aimAngle } : null,
        roomRect: Ps ? { x: Ps.x, y: Ps.y, w: Ps.w, h: Ps.h } : null,
        doors: Ot && Array.isArray(Ot.doors) ? Ot.doors.map(dr => ({ x: dr.x, y: dr.y, open: !!(dr.open || dr.unlocked) })) : [],
        enemies: Array.isArray(Ta) ? Ta.slice(0, 40).map(en => ({ x: en.x, y: en.y })) : []
      };
    }

    Qf = function () {
      const now = performance.now();
      const renderDt = Math.max(0, (now - lastRenderNow) / 1000);
      const dt = Math.min(0.05, Math.max(0.001, renderDt));
      lastRenderNow = now;

      jf();
      const dpr = ensureNativeDprCanvas();
      const snap = buildSnapshot();

      if (window.DD_HUB && window.DD_HUB.isActive()) {
        window.DD_HUB.update(dt);
        if (window.DD_CINE) window.DD_CINE.update(dt, snap, renderDt);
        window.DD_HUB.render(g, y, x);
        if (window.DD_CINE) window.DD_CINE.renderOverlay(g, y, x);
        if (window.DD_UI) window.DD_UI.tick(dt);
        d.frames = (d.frames || 0) + 1;
        return;
      }

      if (window.DD_CINE) {
        window.DD_CINE.update(dt, snap, renderDt);
      }
      const cineCam = window.DD_CINE ? window.DD_CINE.getCamera() : { offX: 0, offY: 0, zoomMul: 1 };

      g.save();
      g.fillStyle = "#04020a";
      g.fillRect(0, 0, y, x);

      const baseZoom = N.zoom * (he < 0.999 ? 1.025 : 1) + (Yc.reduced ? 0 : 0.45 * me);
      N.applied = baseZoom * (cineCam.zoomMul || 1);
      const camX = B + (cineCam.offX || 0);
      const camY = L + (cineCam.offY || 0);

      g.save();
      g.translate(y * 0.5, x * 0.5);
      g.scale(N.applied, N.applied);
      g.translate(-camX, -camY);

      if (pe > 0 && !Yc.reduced) {
        g.translate((2 * ue.rand() - 1) * pe * 0.5, (2 * ue.rand() - 1) * pe * 0.5);
      }

      const expectedCacheKey = [Yo.room, Yo.seed, Rs.id, d.ready, window.DD_ASSETS ? window.DD_ASSETS.stats().loaded : 0].join("|");
      if (!b || roomCacheInvalid || expectedCacheKey !== d.cacheKey) {
        qc();
      }
      g.drawImage(m, 0, 0);

      if (De > 0) {
        g.save();
        Ls(g);
        g.clip();
        g.globalAlpha = 0.14;
        g.fillStyle = "#ff2d7a";
        g.fillRect(Ps.x, Ps.y, Ps.w, Ps.h);
        g.restore();
      }

      jc.drawAmbient();
      jc.drawPreview();
      jc.drawZones();
      hs();
      Ff();
      Ch();
      Wf();

      if (Ot.enabled) {
        for (const dr of Ot.doors) {
          Bg(dr);
          if (dr.lift) WA(dr);
        }
        To();
        Og();
      }

      // Y-sorted entities
      const renderQueue = [];
      const cullL = camX - j() / 2 - 240;
      const cullR = camX + j() / 2 + 240;
      const cullT = camY - F() / 2 - 160;
      const cullB = camY + F() / 2 + 240;

      for (const pr of tc) {
        if (!pr.onFloor || pr.hidden) continue;
        if (pr.x + pr.br < cullL || pr.x - pr.br > cullR || pr.y + pr.br < cullT || pr.y - pr.br > cullB) continue;
        if (pr.tall) renderQueue.push({ y: pr.sortY, k: "prop", o: pr });
        else Lc(pr);
      }
      for (const en of Ta) {
        if (!en._ddaDead && en.x > cullL && en.x < cullR && en.y > cullT && en.y < cullB) {
          renderQueue.push({ y: en.y, k: "enemy", o: en });
        }
      }
      for (const ed of f.enemyDeaths) {
        if (ed.x > cullL && ed.x < cullR && ed.y > cullT && ed.y < cullB) {
          renderQueue.push({ y: ed.y, k: "enemyDeath", o: ed });
        }
      }
      if (ir && sr && !sr._ddaDead) {
        renderQueue.push({ y: sr.y, k: "boss", o: sr });
      }
      for (const bd of f.bossDeaths) {
        renderQueue.push({ y: bd.y, k: "bossDeath", o: bd });
      }
      for (const tu of Pa) renderQueue.push({ y: tu.y, k: "turret", o: tu });
      for (const pk of Ca) renderQueue.push({ y: pk.y, k: "pickup", o: pk });
      if (_o && !_o.done) {
        if (_o.type === "generators") {
          for (const tg of _o.targets) if (!tg.destroyed) renderQueue.push({ y: tg.y, k: "objective", o: tg });
        } else if (_o.type === "collect") {
          for (const ob of _o.orbs) if (!ob.collected) renderQueue.push({ y: ob.y, k: "objective", o: ob });
        }
      }
      renderQueue.push({ y: ye.y, k: "player", o: ye });
      renderQueue.sort((a, bItem) => a.y - bItem.y);

      for (const item of renderQueue) {
        if (item.k === "prop") Lc(item.o);
        else if (item.k === "enemy") Rf(item.o);
        else if (item.k === "enemyDeath") f.drawEnemyDeath(item.o);
        else if (item.k === "bossDeath") f.drawBossDeath(item.o);
        else if (item.k === "player") Pf();
        else if (item.k === "boss") Bf(item.o);
        else if (item.k === "turret") Lf(item.o);
        else if (item.k === "pickup") Uf(item.o);
        else bs(item.o);
      }

      Xu();
      Tt();
      rf();
      Vf();

      if (!(window.DD_WORLD && window.DD_WORLD.drawImpactParticles(g, Sa))) {
        for (const sp of Sa) {
          const al = Math.max(0, 1 - sp.life / sp.maxLife);
          g.globalAlpha = 0.7 * al;
          const sz = Math.max(4, Math.min(24, 2 * sp.r));
          Yb(g, "impact_" + Math.min(3, Math.floor((sp.life / sp.maxLife) * 4)), sp.x - sz / 2, sp.y - sz / 2, sz, sz);
        }
        g.globalAlpha = 1;
      }

      Kf();
      Xf();
      Ph();
      kp.draw();
      if (Bt.showColliders) Ym();

      g.restore(); // camera transform

      // Atmospheric nightclub radial vignette
      const vig = g.createRadialGradient(0.5 * y, 0.5 * x, 0.42 * Math.min(y, x), 0.5 * y, 0.5 * x, 0.74 * Math.max(y, x));
      vig.addColorStop(0, "rgba(4, 2, 10, 0)");
      vig.addColorStop(1, "rgba(4, 2, 10, 0.62)");
      g.fillStyle = vig;
      g.fillRect(0, 0, y, x);

      Zm();
      zf();
      if (c.mode !== "idle") XA();
      if (window.DD_CINE) window.DD_CINE.renderOverlay(g, y, x);
      g.restore();

      Zf(Ps.x, Ps.y, Ps.w, Ps.h);
      d.frames = (d.frames || 0) + 1;
      ly();
      if (window.DD_UI) window.DD_UI.tick(dt);
    };

    cp = function (ts) {
      if ((window.DD_HUB && window.DD_HUB.isActive()) || (window.DD_CINE && window.DD_CINE.getState())) {
        Qf();
        return;
      }
      ensureNativeDprCanvas();
      g.fillStyle = "#06030d";
      g.fillRect(0, 0, y, x);
      if (window.DD_UI) window.DD_UI.tick(0.016);
    };

    window.__DD_BRIDGE = Object.freeze({
      isRunning: function () { return !!U; },
      startRun: function () {
        if (!U) {
          try { if (Fn) Fn.disabled = false; } catch (e) {}
          try { kl(); } catch (e) {}
          rp();
        }
        return !!U;
      },
      getSnapshot: buildSnapshot,
      // Silent engine pause for the HUB safe zone: freezes Tf() simulation and
      // ducks the DJ while the player walks the Refugio, without opening the
      // legacy pause overlay. rp() (startRun) clears it on descent.
      setPaused: function (v) {
        try {
          if (v) { Y = !!U; }
          else { Y = false; }
        } catch (e) {}
        return !!Y;
      },
      isPaused: function () { return !!Y; },
      invalidateRoomCache: function () { roomCacheInvalid = true; b = false; },
      invalidateWeaponCache: function (wid) {
        // Trigger fresh lookup when new weapon illustration loads
        try {
          if (window.__HD_ASSETS && window.__HD_ASSETS.images && window.__HD_EXTRA) {
            const k = "weapons/weapon_" + wid + ".png";
            if (window.__HD_EXTRA[k]) window.__HD_ASSETS.images[k] = window.__HD_EXTRA[k];
          }
        } catch (e) {}
      },
      drawPlayerAt: function (targetCtx, px, py, aimAngle) {
        const prevX = ye.x, prevY = ye.y, prevA = ye.aimAngle, prevG = g;
        try {
          ye.x = px; ye.y = py; ye.aimAngle = aimAngle || 0; g = targetCtx;
          origPf();
        } finally {
          ye.x = prevX; ye.y = prevY; ye.aimAngle = prevA; g = prevG;
        }
      },
      getWeaponsList: function () {
        return (w.weaponRig && typeof w.weaponRig.catalog === "function") ? w.weaponRig.catalog() : [];
      },
      getWeaponStats: function (wid) {
        const meta = (ja && ja[wid]) || {};
        const traitObj = (typeof Ga === "function" && Ga(wid)) || {};
        return {
          id: wid,
          name: meta.name || wid,
          cost: meta.cost || 120,
          damage: meta.damage || 25,
          fireRate: meta.fireRate || 4,
          speed: meta.speed || 500,
          pellets: meta.pellets || 1,
          pierce: meta.pierce || 0,
          role: meta.role || "",
          trait: traitObj.trait || ""
        };
      },
      buyOrEquipWeapon: function (wid, freePreview) {
        if (!ja || !ja[wid]) return false;
        const alreadyOwned = Dt.owned.includes(wid);
        const cost = ja[wid].cost || 120;
        if (!alreadyOwned && !freePreview) {
          if (Dt.credits < cost) return false;
          Dt.credits -= cost;
        }
        if (!alreadyOwned && Dt.owned.length >= 2) {
          const curIdx = Dt.owned.indexOf(Yo.weapon);
          Dt.owned[curIdx >= 0 ? curIdx : 1] = wid;
        }
        return cd(wid, false);
      },
      getCanvasInfo: function () {
        return {
          cssWidth: y,
          cssHeight: x,
          bufferWidth: h.width,
          bufferHeight: h.height,
          dpr: window.devicePixelRatio || 1,
          smoothing: !!g.imageSmoothingEnabled
        };
      },
      testStep: function (inp, frames) {
        inp = inp || {};
        pa.up = !!inp.up;
        pa.down = !!inp.down;
        pa.left = !!inp.left;
        pa.right = !!inp.right;
        fa = !!inp.fire;
        Aa = !!inp.fire;
        if (inp.aim !== undefined && ye) ye.aimAngle = Number(inp.aim) || 0;
        const n = Math.max(1, Math.round(frames || 10));
        for (let i = 0; i < n && !Mr; i++) {
          Tf(1 / 60);
        }
        Qf();
        pa.up = pa.down = pa.left = pa.right = false;
        fa = Aa = false;
        return buildSnapshot();
      }
    });
  })();"""

html = html.replace(bridge_anchor, bridge_js, 1)

# 3.5 FASE 01 — Static boot shell.
#     The loading screen must paint while the 5.2 MB document is still parsing,
#     long before any module is executed. It is therefore emitted as literal markup
#     immediately after <body>; src/dd_boot.js adopts these nodes at run time (it
#     never creates a second copy) and fills in the real progress readouts.
BOOT_SHELL = """
<!-- FASE 01.4 · ACCESIBILIDAD: el armazón NO puede nacer con aria-hidden="true".
     Con ese atributo, Chromium expone igualmente el subárbol en cuanto
     dd_boot.js lleva el foco a REINTENTAR (medido: el nodo enfocado dentro de
     un aria-hidden no se marca ignored). El resultado era una contradicción:
     un <dialog aria-modal> oculto al árbol pero con el foco dentro. La
     semántica correcta la fija dd_boot.js por ESTADO: role="progressbar" +
     aria-busy mientras carga, role="alertdialog" cuando hay un error, y
     aria-hidden="true" sólo cuando el armazón deja de ser relevante. -->
<section id="dd-boot-frame" role="progressbar" aria-label="Cargando DEADBEAT DISCO" aria-busy="true">
  <div class="dd-boot-bg"></div>
  <div class="dd-boot-beams" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="dd-boot-grain" aria-hidden="true"></div>
  <div class="dd-boot-scan" aria-hidden="true"></div>
  <div class="dd-boot-scrim" aria-hidden="true"></div>
  <div class="dd-boot-frame-deco" aria-hidden="true"><span class="tl"></span><span class="tr"></span><span class="bl"></span><span class="br"></span></div>
  <div class="dd-boot-inner">
    <div class="dd-boot-top">
      <span class="dd-boot-kicker">DEADBEAT DISCO · SISTEMA DE PISTA</span>
      <span class="dd-boot-ver" id="dd-boot-ver">—</span>
    </div>
    <div class="dd-boot-title">
      <span class="dd-boot-wordmark" aria-hidden="true"><b>DEADBEAT</b><i>DISCO</i></span>
      <img id="dd-boot-logo" alt="DEADBEAT DISCO" src="assets/fase01/logo_deadbeat_trim.png">
    </div>
    <div class="dd-boot-divider"><img alt="" src="assets/fase01/brand_divider.png" width="1200" height="64"></div>
    <div class="dd-boot-statusline">
      <span id="dd-boot-stage">PREPARANDO EL CLUB</span>
      <span id="dd-boot-pct" aria-hidden="true">0%</span>
    </div>
    <div class="dd-boot-bar" id="dd-boot-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Progreso de carga de DEADBEAT DISCO">
      <i id="dd-boot-fill"></i><b id="dd-boot-shine"></b>
    </div>
    <ol class="dd-boot-steps" id="dd-boot-steps" aria-live="polite"></ol>
    <div class="dd-boot-err" id="dd-boot-err" role="alert" hidden>
      <strong id="dd-boot-err-title">NO SE PUDO ABRIR EL CLUB</strong>
      <p id="dd-boot-err-body"></p>
      <div class="dd-boot-err-actions">
        <button type="button" class="dd-boot-btn hot" id="dd-boot-retry">REINTENTAR</button>
        <button type="button" class="dd-boot-btn" id="dd-boot-safe">MODO SEGURO</button>
      </div>
    </div>
    <div class="dd-boot-foot">
      <span id="dd-boot-audio">PULSA UNA TECLA PARA HABILITAR EL AUDIO</span>
      <span id="dd-boot-hint" aria-live="polite">CLIC · ESPACIO · ESC PARA OMITIR LA INTRO</span>
    </div>
  </div>
</section>
"""
_body_open = "<body class=\"booting\">"
assert html.count(_body_open) == 1, "expected exactly one <body class=\"booting\">"
html = html.replace(_body_open, _body_open + BOOT_SHELL, 1)

# 4. Inline the modular scripts right before the FINAL </body> tag (never inside JS strings!).
#    Same single-file rule as the CSS step: the src/*.js files stay in the repo as the
#    editable source of truth, but the runtime must not depend on fetching them.
body_ridx = html.rfind("</body>")
assert body_ridx > len(html) - 100, f"Unexpected final </body> at {body_ridx}"
MODULE_ORDER = (
    # FASE 01: el arranque debe ejecutarse ANTES que dd_ui_system.js porque lo
    # orquesta (oculta el menú, corre la intro canónica y le da el foco).
    "dd_boot.js",
    "dd_asset_registry.js",
    "dd_world_renderer.js",
    "dd_hub_system.js",
    "dd_cinematic_camera.js",
    "dd_ui_system.js",
)
_parts = []
for fname in MODULE_ORDER:
    with open(os.path.join(ROOT, "src", fname), "r", encoding="utf-8") as f:
        js_src = f.read()
    assert "</script" not in js_src.lower(), f"{fname} must not contain </script sequences"
    _parts.append(
        "  <script>\n/* === INLINED FROM src/" + fname
        + " — regenerate via tools/build_active_html.py === */\n"
        + js_src
        + "\n  </script>"
    )
scripts_block = "\n".join(_parts) + "\n</body>"
html = html[:body_ridx] + scripts_block + html[body_ridx + len("</body>"):]

# 5. Post-build invariants: every inlined artefact must appear EXACTLY once, so a
#    regeneration can never accumulate duplicated modules (idempotency guard).
assert html.count("INLINED FROM src/dd_rebuild_ui.css") == 1, "CSS inlined more than once"
for fname in MODULE_ORDER:
    marker = "INLINED FROM src/" + fname
    assert html.count(marker) == 1, f"{fname} inlined {html.count(marker)} times (expected 1)"
assert html.count("== DD_KEYBOARD_GUARD:BEGIN ==") == 1, "keyboard guard BEGIN marker not unique"
assert html.count("== DD_KEYBOARD_GUARD:END ==") == 1, "keyboard guard END marker not unique"
assert html.count("window.__DD_KEY_GUARD__ = Object.freeze(") == 1, "keyboard guard installed twice"
assert "src/dd_rebuild_ui.css" in html  # provenance comment survives
for fname in MODULE_ORDER:
    assert "=== INLINED FROM src/" + fname in html, f"{fname} provenance comment missing"

for fname in ("index.html", "DEADBEAT_DISCO.html"):
    with open(os.path.join(ROOT, fname), "w", encoding="utf-8") as f:
        f.write(html)

print("Built index.html and DEADBEAT_DISCO.html cleanly. Size:", len(html), "bytes")
print("Inlined artifacts:", ", ".join(["src/dd_rebuild_ui.css"] + list(MODULE_ORDER)))
print("Keyboard guard:", "installed (1x)" if "DD_KEYBOARD_GUARD:BEGIN" in html else "MISSING")
