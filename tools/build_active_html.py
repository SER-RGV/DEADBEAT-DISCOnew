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

# 1. Strip trailing Cloudflare challenge snippet at the very end of the file
cf_idx = html.rfind("<script>(function(){function c(){var b=a.contentDocument")
if cf_idx > len(html) - 2000:
    cf_end = html.find("</script>", cf_idx)
    if cf_end > cf_idx:
        html = html[:cf_idx] + html[cf_end + len("</script>"):]

# 1b. Nivel de la música del menú. El motor de la portada antigua (que sigue
#     siendo el que toca la música del menú) multiplica su volumen por 0,9; medido,
#     eso deja el menú unos 13 dB por encima de la intro. Se baja a 0,40 (−7 dB) y
#     la intro se sube en src/dd_opening.js. El control de volumen del usuario no
#     cambia de significado: sigue siendo un factor sobre este nivel.
_menu_gain_old = "function ne(){return x.muted?0:x.vol*(te?.32:1)*.9}"
# La música del menú obedece además a MAESTRO y MÚSICA de OPCIONES
# (window.DD_MENU_MIX, definido en src/dd_ui_system.js). Con la mezcla por defecto
# ese factor vale 1, así que el nivel calibrado (0,4) no cambia.
_menu_gain_new = "function ne(){return x.muted?0:x.vol*(te?.32:1)*.4*(window.DD_MENU_MIX?window.DD_MENU_MIX().music:1)}"
assert html.count(_menu_gain_old) == 1, "No se encuentra la ganancia de la música del menú"
html = html.replace(_menu_gain_old, _menu_gain_new, 1)

# 1c. El motor de la portada exponía setVol() SIN argumento (sólo reaplicaba su
#     valor interno): el deslizador VOLUMEN DEL MENÚ guardaba el número pero no
#     cambiaba lo que se oía hasta recargar. Ahora setVol(v) fija el volumen.
_setvol_old = "setVol:ie,"
_setvol_new = ('setVol:function(a){"number"==typeof a&&isFinite(a)&&(x.vol=Math.max(0,Math.min(1,a)),x.muted=!1),ie()},'
               'setMuted:function(a){x.muted=!!a,ie()},targetGain:function(){return ne()},')
assert html.count(_setvol_old) == 1, "No se encuentra setVol del motor de la portada"
html = html.replace(_setvol_old, _setvol_new, 1)
# Los sonidos de interfaz del menú también obedecen a MAESTRO y EFECTOS.
_ui_old = "a=y.currentTime+.005,t=x.vol"
_ui_new = "a=y.currentTime+.005,t=x.vol*(window.DD_MENU_MIX?window.DD_MENU_MIX().ui:1)"
assert html.count(_ui_old) == 1, "No se encuentra el volumen de los sonidos de interfaz"
html = html.replace(_ui_old, _ui_new, 1)

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

    // Capa de arma del protagonista.
    // El renderizador de armas del motor (it) espera exactamente lo que le daba
    // su propio Pf: el contexto trasladado al "hombro" (0, -0.55·canonH), girado
    // con el ángulo de puntería, y ut.handLocal = posición de la mano en ese
    // marco. Sin eso dibuja el arma en el origen del jugador (a la altura de las
    // rodillas), apuntando siempre a la derecha. DD_WORLD conoce el lienzo de
    // cada pose y dice dónde está la mano (getPlayerWeaponMount).
    const DD_WEAPON_CANON_H = 95;
    const DD_WEAPON_PIVOT_Y = -0.55 * DD_WEAPON_CANON_H;
    function ddIsLongGun(wid) {
      try {
        if (xt[wid]) return false; // pesadas: se disparan desde la cadera
        const a = pt(wid);
        return !!(a && a.hd && a.hd.sup && (a.hd.sup - a.hd.grip) * a.len * DD_WEAPON_CANON_H >= 10);
      } catch (e) { return false; }
    }

    Pf = function () {
      if (window.DD_WORLD && w.playerAnim) {
        const pA = w.playerAnim;
        const aimA = (pA.forcedAimAngle !== null && pA.forcedAimAngle !== undefined)
          ? pA.forcedAimAngle
          : ((ye && ye.aimAngle) || 0);
        pA.ddLongGun = ddIsLongGun((Yo && Yo.weapon) || "m1911");
        const mount = (typeof window.DD_WORLD.getPlayerWeaponMount === "function")
          ? window.DD_WORLD.getPlayerWeaponMount(pA, aimA, 1)
          : null;
        const weaponLayer = function (layer, customCtx) {
          const c = customCtx || g;
          const prevH = ut.h, prevHand = ut.handLocal, prevPose = ut.poseKey;
          c.save();
          try {
            if (mount) {
              const relY = mount.y - DD_WEAPON_PIVOT_Y;
              const cosA = Math.cos(aimA), sinA = Math.sin(aimA);
              ut.h = DD_WEAPON_CANON_H;
              ut.poseKey = pA.upperPose || "player_idle";
              ut.handLocal = [cosA * mount.x + sinA * relY, -sinA * mount.x + cosA * relY];
              c.translate(0, DD_WEAPON_PIVOT_Y);
              c.rotate(aimA);
            }
            return it(layer, c);
          } finally {
            c.restore();
            ut.h = prevH; ut.handLocal = prevHand; ut.poseKey = prevPose;
          }
        };
        const drew = window.DD_WORLD.drawProtagonist(
          g,
          ye,
          pA,
          weaponLayer,
          typeof Ee === "number" ? Ee : 0,
          typeof De === "number" ? De : 0
        );
        if (drew) return;
      }
      return origPf.apply(this, arguments);
    };

    /* ----------------------------------------------------------------------
       ENEMIGOS — el contrato de animación es el del motor, no uno inventado.
       El módulo de combate 2.86 del motor (objeto `f`) y su Rf original deciden:
         - familia de arte: élite → elite; guardián → security; sprinter →
           fanatic; tank → chef; speaker → drone; dancer → security en el
           círculo I y dancer en los demás; minijefe → chef (círculo III),
           elite (círculo VIII) o security;
         - estado: impacto (hitFlash) > aviso (st "windup", amago, mState
           "…Wind") > ataque (st "charge"/"dash", disparo recién hecho del
           tirador, bailarín en contacto) > caminar;
         - orientación: siempre de cara al jugador.
       La versión anterior de este puente miraba campos que el motor no tiene
       (attackT, windupT, hurtT, vx): sólo se veía el fotograma de caminar,
       siempre mirando a la derecha, y sprinter y tirador salían como guardias.
       DD_WORLD sólo dibuja; las reglas viven aquí, junto al motor.
       ---------------------------------------------------------------------- */
    function ddEnemyView(e) {
      const circle = currentCircle();
      let fam = e.elite ? "elite"
        : e.guardian ? "security"
        : e.type === "sprinter" ? "fanatic"
        : e.type === "tank" ? "chef"
        : e.type === "speaker" ? "drone"
        : e.type === "dancer" ? (circle === 0 ? "security" : "dancer")
        : "security";
      if (e.mini) fam = circle === 2 ? "chef" : circle === 7 ? "elite" : "security";
      let state = "walk";
      if (f.enemyState(e) === "hit") {
        state = "hit";
      } else if (e.st === "windup" || e.feinting || /Wind$/.test(e.mState || "")) {
        state = "windup";
      } else if (e.st === "charge" || e.st === "dash" || e.mState === "charge" ||
                 (e.type === "speaker" && e.st === "recover") ||
                 (e.type === "dancer" && e.slot && Math.hypot(ye.x - e.x, ye.y - e.y) < e.r + ye.r + 18)) {
        state = "attack";
      }
      return {
        family: fam,
        state: state,
        flip: ye.x < e.x,
        flash: e.hitFlash || 0,
        phase: (e.animT || 0) * (e.type === "tank" ? 1.2 : e.type === "sprinter" ? 3.4 : 2),
        marker: e.mini ? "mini" : e.elite ? "elite" : e.guardian ? "guardian" : null,
        hpAlways: !!(e.elite || e.mini || e.type === "tank"),
        frozen: e.freezeTimer > 0,
        objective: !!Cp(),
        circle: circle
      };
    }

    Rf = function (enemy) {
      const view = ddEnemyView(enemy);
      if (window.DD_WORLD && window.DD_WORLD.drawEnemy(g, enemy, Z, view)) {
        // Señal de variante elemental (placa, llama, hielo, rayo…): la pinta el
        // motor. Espera la altura del sprite medida desde y + 0.65·r.
        if (enemy.variant86 && enemy.variant86 !== "none") {
          try {
            const geo = window.DD_WORLD.enemyGeometry(enemy, view);
            lu.drawVariantCue(g, enemy, Math.max(20, enemy.y + 0.65 * enemy.r - geo.topY));
          } catch (err) { /* la señal es opcional: nunca debe romper el fotograma */ }
        }
        return;
      }
      return origRf.apply(this, arguments);
    };

    /* Orden de profundidad de la lista de dibujo (props altos, enemigos, jugador…).
       Se ordena por la LÍNEA DE APOYO en el suelo de cada cosa:
         enemigo / abatido  pies en y + 0.65·r   (DD_WORLD.ENEMY_FOOT_K)
         jugador            suelas en y + 14     (DD_WORLD.PLAYER_GROUND_Y)
         jefe / abatido     pies en y + 0.8·r    (DD_WORLD.BOSS_FOOT_K)
         prop alto          su sortY del motor   (borde delantero de su huella)
         resto              su y (las torretas se revisan en su tanda)
       Antes los actores entraban por el CENTRO de su círculo de colisión y los
       props por su borde delantero: con figuras de 80-100 px, un actor de pie
       junto a una caja, con los pies por delante de ella, se pintaba detrás.
       Sólo cambia QUIÉN TAPA A QUIÉN; posiciones y colisiones no se tocan. */
    function ddGroundY(kind, o) {
      const W = window.DD_WORLD || {};
      if (kind === "enemy" || kind === "enemyDeath") {
        return o.y + (typeof W.ENEMY_FOOT_K === "number" ? W.ENEMY_FOOT_K : 0.65) * (o.r || 12);
      }
      if (kind === "player") return o.y + (typeof W.PLAYER_GROUND_Y === "number" ? W.PLAYER_GROUND_Y : 14);
      if (kind === "boss" || kind === "bossDeath") {
        return o.y + (typeof W.BOSS_FOOT_K === "number" ? W.BOSS_FOOT_K : 0.8) * (o.r || 34);
      }
      return o.y;
    }

    /* Muerte de enemigos: el motor guarda un registro por abatido y lo dibujaba
       con el sprite pixel art heredado. Ahora lo dibuja DD_WORLD con el arte de
       la familia; el registro recuerda familia y dura un poco más (sólo visual:
       el enemigo ya salió de la lógica cuando se crea el registro). */
    const origAddEnemyDeath = f.addEnemyDeath;
    const origDrawEnemyDeath = f.drawEnemyDeath;
    f.addEnemyDeath = function (enemy) {
      let fam = null;
      try { fam = ddEnemyView(enemy).family; } catch (err) { fam = null; }
      const added = origAddEnemyDeath.apply(this, arguments);
      if (added && f.enemyDeaths.length) {
        const rec = f.enemyDeaths[f.enemyDeaths.length - 1];
        rec.ddFamily = fam || rec.key;
        rec.duration = 0.6;
      }
      return added;
    };
    f.drawEnemyDeath = function (rec) {
      if (window.DD_WORLD && window.DD_WORLD.drawEnemyDeath && window.DD_WORLD.drawEnemyDeath(g, rec, Z)) {
        return;
      }
      return origDrawEnemyDeath.apply(this, arguments);
    };

    /* ----------------------------------------------------------------------
       JEFES — mismas reglas que con los enemigos: el contrato es el del motor.
       El Bf del motor hace tres cosas: pinta un arco decorativo, pinta el sprite
       (Of) y pinta las SEÑALES DE JUEGO del combate: anillos de aparición, aro de
       ventana expuesta, arco de «esbirros vivos», aro de congelación, el sector
       de aviso y el rayo del barrido, y la barra de vida.
       La versión anterior de este puente sustituía Bf entero por un dibujo del
       sprite: ninguna de esas señales se veía (el barrido golpeaba con un rayo
       invisible), el jefe no encaraba al protagonista ni cambiaba de estado
       (leía attackT, castT, dashT, hurtT y vx, que el motor no tiene) y aparecía
       de golpe, sin la entrada del motor.
       Ahora: la figura la dibuja DD_WORLD con la vista de ddBossView y las
       señales del motor se pintan aquí con su misma geometría (son la verdad de
       las colisiones). El arco decorativo no se recupera.
         - quién es:  secretBoss → Arquitecto; final → Núcleo; `resident` del
                      motor; si no, el registro de arte del motor (f.bossProfile)
         - estado:    attack mientras el motor avisa o ejecuta un patrón
                      (pattern71), barre (phase "sweep") o acaba de cambiar de
                      fase (_ddaAttackT); recover en la ventana expuesta que sigue
                      (exposedT); si no, idle. f.bossState da "attack" durante
                      TODA la fase berserk (el último 35 % de la vida): con un
                      fotograma de ataque propio el jefe se pasaría el final del
                      combate congelado en esa pose, así que berserk se señala
                      aparte (aura roja, paso más vivo) y no fija el fotograma.
         - impacto:   destello sobre el fotograma que toque, sin cambiar de pose.
         - orientación: siempre de cara al protagonista.
       ---------------------------------------------------------------------- */
    const DD_BOSS_SLUG = {
      anden: "boss_00_anden", magneta: "boss_01_magneta", bufe: "boss_02_bufe", cajero: "boss_03_cajero",
      pogo: "boss_04_pogo", oficiante: "boss_05_oficiante", matarife: "boss_06_matarife", imitador: "boss_07_imitador",
      traidor: "boss_08_traidor", nucleo: "boss_09_nucleo", arquitecto: "boss_10_arquitecto"
    };
    const DD_BOSS_BY_KEY = ["boss_00_anden", "boss_01_magneta", "boss_02_bufe", "boss_03_cajero", "boss_04_pogo",
      "boss_05_oficiante", "boss_06_matarife", "boss_07_imitador", "boss_08_traidor", "boss_09_nucleo"];

    function ddBossSlug(e) {
      if (!e) return DD_BOSS_BY_KEY[currentCircle()];
      if (e.secretBoss || e.resident === "arquitecto") return DD_BOSS_SLUG.arquitecto;
      if (e.final) return DD_BOSS_SLUG.nucleo;
      if (e.resident && DD_BOSS_SLUG[e.resident]) return DD_BOSS_SLUG[e.resident];
      try {
        const prof = f.bossProfile(e);
        if (prof && prof.resident && DD_BOSS_SLUG[prof.resident]) return DD_BOSS_SLUG[prof.resident];
        const m = prof && /^boss(\d)$/.exec(prof.key || "");
        if (m) return DD_BOSS_BY_KEY[Number(m[1])];       // jefes sin residente: el motor les presta el sprite de ese índice
      } catch (err) { /* sin registro de arte: se decide por círculo */ }
      return DD_BOSS_BY_KEY[currentCircle()];
    }

    function ddBossView(e) {
      const casting = !!e.pattern71 || e.phase === "sweep" || (e._ddaAttackT || 0) > 0;
      const exposed = (e.exposedT || 0) > 0;
      return {
        slug: ddBossSlug(e),
        state: e._ddaDead ? "death" : casting ? "attack" : exposed ? "recover" : "idle",
        flip: ye.x < e.x,
        flash: e.hitFlash || 0,
        entrance: e.entrance > 0 ? Math.max(0, Math.min(1, 1 - e.entrance / 1.3)) : 1,
        frozen: e.freezeTimer > 0,
        berserk: !!e.berserk || e.phase === "berserk",
        exposed: exposed,
        color: e.color || null,
        circle: currentCircle()
      };
    }

    /* Señales de juego del jefe, con la geometría del motor (círculo de colisión en
       (x, y), radio r). `front` = mitad del aro que queda por delante de la figura:
       se pinta después de ella, para que el aro rodee los pies en vez de cruzarlos. */
    function ddBossRings(e, front) {
      if (!((e.exposedT > 0) || (e.addsAlive || 0) > 0 || e.freezeTimer > 0)) return;
      g.save();
      g.beginPath();
      if (front) g.rect(e.x - 4 * e.r, e.y, 8 * e.r, 4 * e.r);
      else g.rect(e.x - 4 * e.r, e.y - 4 * e.r, 8 * e.r, 4 * e.r);
      g.clip();
      if (e.freezeTimer > 0) {
        g.strokeStyle = "#67e8f9"; g.lineWidth = 3;
        g.beginPath(); g.arc(e.x, e.y, e.r + 8, 0, 2 * Math.PI); g.stroke();
      }
      if (e.exposedT > 0) {
        g.strokeStyle = "#67e8f9"; g.lineWidth = 4; g.globalAlpha = 0.6 + 0.4 * Math.sin(12 * Z);
        g.beginPath(); g.arc(e.x, e.y, e.r + 12, 0, 2 * Math.PI); g.stroke();
        g.globalAlpha = 1;
      }
      if ((e.addsAlive || 0) > 0) {
        g.strokeStyle = "#22d3ee"; g.lineWidth = 3; g.setLineDash([10, 8]); g.globalAlpha = 0.75;
        g.beginPath(); g.arc(e.x, e.y, e.r + 18 + 2 * Math.sin(5 * Z), 1.2 * Z, 1.2 * Z + 1.2 * Math.PI); g.stroke();
        g.setLineDash([]);
      }
      g.restore();
    }

    function ddBossFloorCues(e) {
      g.save();
      if (e.entrance > 0) {
        const a = 1 - e.entrance / 1.3;
        g.strokeStyle = "#fca5a5"; g.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          const o = (((a + i / 3) % 1) + 1) % 1;
          g.globalAlpha = 0.55 * (1 - o);
          g.beginPath(); g.arc(e.x, e.y, e.r * (0.7 + 2.4 * o), 0, 2 * Math.PI); g.stroke();
        }
        g.globalAlpha = 1;
      }
      if (e.sweep) {
        const sw = e.sweep;
        const ang = sw.a0 + sw.dir * Math.min(1, Math.max(0, (sw.t - sw.warn) / sw.fire)) * sw.arc;
        const ex = e.x + 720 * Math.cos(ang), ey = e.y + 720 * Math.sin(ang);
        g.save();
        g.lineCap = "round";
        if (sw.t < sw.warn) {
          wf(e.x, e.y, sw.a0, sw.a0 + sw.dir * sw.arc, 720, "#f43f5e", 0.06);
          g.globalAlpha = 0.4 + 0.25 * Math.sin(18 * Z);
          g.strokeStyle = "#fda4af"; g.lineWidth = 3; g.setLineDash([12, 10]);
        } else {
          g.globalAlpha = 0.35; g.strokeStyle = "#f43f5e"; g.lineWidth = 26;
          g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(ex, ey); g.stroke();
          g.globalAlpha = 0.95; g.strokeStyle = "#fecdd3"; g.lineWidth = 6;
        }
        g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(ex, ey); g.stroke();
        g.restore();
      }
      g.restore();
      ddBossRings(e, false);
    }

    Bf = function (boss) {
      const W = window.DD_WORLD;
      if (W && W.canDrawBoss) {
        const view = ddBossView(boss);
        if (W.canDrawBoss(view.slug)) {
          ddBossFloorCues(boss);
          W.drawBoss(g, boss, view, Z);
          ddBossRings(boss, true);
          return;
        }
      }
      return origBf.apply(this, arguments);
    };

    /* Muerte del jefe: igual que con los enemigos. El registro del motor recuerda
       quién era y hacia dónde miraba, y dura 1 s (sólo visual: el jefe ya salió de
       la lógica cuando se crea el registro). */
    const origAddBossDeath = f.addBossDeath;
    const origDrawBossDeath = f.drawBossDeath;
    f.addBossDeath = function (boss) {
      let view = null;
      try { view = ddBossView(boss); } catch (err) { view = null; }
      const added = origAddBossDeath.apply(this, arguments);
      if (added && f.bossDeaths.length) {
        const rec = f.bossDeaths[f.bossDeaths.length - 1];
        if (view) { rec.ddSlug = view.slug; rec.ddFlip = view.flip; }
        rec.duration = 1.0;
      }
      return added;
    };
    f.drawBossDeath = function (rec) {
      if (window.DD_WORLD && window.DD_WORLD.drawBossDeath && window.DD_WORLD.drawBossDeath(g, rec, Z)) {
        return;
      }
      return origDrawBossDeath.apply(this, arguments);
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
        // subtitle: el título que el motor da a cada residente («EL PORTERO», «LA ANFITRIONA»…).
        // Sin él, la tarjeta de presentación rotulaba a los once jefes con el mismo texto.
        boss: ir && sr ? { id: sr.id, name: sr.name, hp: sr.hp, maxHp: sr.maxHp, x: sr.x, y: sr.y, slug: ddBossSlug(sr),
          subtitle: String(sr.residentTitle || sr.variantLabel || ""), color: sr.residentColor72 || sr.color || "" } : null,
        player: ye ? { x: ye.x, y: ye.y, aimAngle: ye.aimAngle } : null,
        roomRect: Ps ? { x: Ps.x, y: Ps.y, w: Ps.w, h: Ps.h } : null,
        doors: Ot && Array.isArray(Ot.doors) ? Ot.doors.map(dr => ({ x: dr.x, y: dr.y, open: !!(dr.open || dr.unlocked) })) : [],
        enemies: Array.isArray(Ta) ? Ta.slice(0, 40).map(en => ({ x: en.x, y: en.y })) : []
      };
    }

    Qf = function () {
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastRenderNow) / 1000));
      lastRenderNow = now;

      jf();
      const dpr = ensureNativeDprCanvas();
      const snap = buildSnapshot();

      if (window.DD_HUB && window.DD_HUB.isActive()) {
        window.DD_HUB.update(dt);
        if (window.DD_CINE) window.DD_CINE.update(dt, snap);
        window.DD_HUB.render(g, y, x);
        if (window.DD_CINE) window.DD_CINE.renderOverlay(g, y, x);
        if (window.DD_UI) window.DD_UI.tick(dt);
        d.frames = (d.frames || 0) + 1;
        return;
      }

      if (window.DD_CINE) {
        window.DD_CINE.update(dt, snap);
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
          renderQueue.push({ y: ddGroundY("enemy", en), k: "enemy", o: en });
        }
      }
      for (const ed of f.enemyDeaths) {
        if (ed.x > cullL && ed.x < cullR && ed.y > cullT && ed.y < cullB) {
          renderQueue.push({ y: ddGroundY("enemyDeath", ed), k: "enemyDeath", o: ed });
        }
      }
      if (ir && sr && !sr._ddaDead) {
        renderQueue.push({ y: ddGroundY("boss", sr), k: "boss", o: sr });
      }
      for (const bd of f.bossDeaths) {
        renderQueue.push({ y: ddGroundY("bossDeath", bd), k: "bossDeath", o: bd });
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
      renderQueue.push({ y: ddGroundY("player", ye), k: "player", o: ye });
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
      /* QA: actores vivos con la vista de arte que el puente entrega a DD_WORLD
         (familia, estado, orientación) y los proyectiles. Sólo lectura. */
      getActors: function () {
        const out = { time: Z, circle: currentCircle(), player: null, enemies: [], deaths: [], bullets: [], enemyBullets: [] };
        if (ye) out.player = { x: ye.x, y: ye.y, r: ye.r, aim: ye.aimAngle };
        if (Array.isArray(Ta)) {
          for (const e of Ta.slice(0, 60)) {
            if (!e || e._ddaDead) continue;
            const v = ddEnemyView(e);
            out.enemies.push({
              x: e.x, y: e.y, r: e.r, type: e.type, elite: !!e.elite, mini: !!e.mini, guardian: !!e.guardian,
              st: e.st || null, mState: e.mState || null, hp: e.hp, maxHp: e.maxHp, variant: e.variant86 || null,
              family: v.family, state: v.state, flip: v.flip, flash: v.flash, marker: v.marker, frozen: v.frozen
            });
          }
        }
        for (const d of f.enemyDeaths) out.deaths.push({ x: d.x, y: d.y, r: d.r, family: d.ddFamily || d.key, age: d.age, duration: d.duration });
        if (Array.isArray(wa)) for (const b of wa.slice(0, 40)) out.bullets.push({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, r: b.r });
        if (Array.isArray(Ia)) for (const b of Ia.slice(0, 40)) out.enemyBullets.push({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, r: b.r });
        return out;
      },
      /* QA: fija el estado de IA de los enemigos vivos para poder fotografiar cada
         fotograma (aviso, ataque) sin esperar a que la IA lo elija. `st` nulo lo suelta. */
      debugPoseEnemies: function (st, opts) {
        opts = opts || {};
        let n = 0;
        if (Array.isArray(Ta)) {
          for (let i = 0; i < Ta.length; i++) {
            const e = Ta[i];
            if (!e || e._ddaDead) continue;
            if (opts.type && e.type !== opts.type) continue;
            if (typeof opts.index === "number" && opts.index !== i) continue;
            if (opts.assign && typeof opts.assign === "object") {
              // p. ej. { mini: true, r: 26 } para ver la escala y la marca de un minijefe
              for (const k of ["mini", "guardian", "guardRadius", "elite", "r", "freezeTimer", "feinting", "mState"]) {
                if (k in opts.assign) e[k] = opts.assign[k];
              }
            }
            if (st !== undefined) {
              e.st = st || null;
              // stT = tiempo que le queda al estado. Con 9 s la IA no lo suelta; con un
              // valor corto (opts.stT) el aro de aviso del motor se ve a medio llenar.
              // Con st = null también se respeta opts.stT: el minijefe no usa `st`
              // sino `mState`, y su reloj es el mismo stT.
              e.stT = typeof opts.stT === "number" ? opts.stT : (st ? 9 : 0);
            }
            if (opts.hit) f.damage(e, 0, 0.14);   // destello de impacto sin quitar vida
            n++;
          }
        }
        return n;
      },
      /* QA: el jefe activo con la vista de arte que el puente entrega a DD_WORLD, el
         fotograma que DD_WORLD resuelve para ella y los registros de muerte. Sólo lectura. */
      getBoss: function () {
        const W = window.DD_WORLD || {};
        const out = { active: !!(ir && sr), time: Z, circle: currentCircle(), deaths: [] };
        for (const d of f.bossDeaths) {
          const fr = d.ddSlug && W.resolveBossFrame ? W.resolveBossFrame(d.ddSlug, "death") : null;
          const gd = W.bossGeometry ? W.bossGeometry({ x: d.x, y: d.y, r: d.r }, { slug: d.ddSlug }) : null;
          out.deaths.push({ x: d.x, y: d.y, r: d.r, slug: d.ddSlug || null, flip: !!d.ddFlip, age: d.age, duration: d.duration,
            frame: fr ? fr.id : null, dedicated: fr ? fr.dedicated : null, figH: gd ? gd.figH : null, footY: gd ? gd.footY : null });
        }
        if (!out.active) return out;
        const v = ddBossView(sr);
        const fr = W.resolveBossFrame ? W.resolveBossFrame(v.slug, v.state) : null;
        const geo = W.bossGeometry ? W.bossGeometry(sr, v) : null;
        return Object.assign(out, {
          x: sr.x, y: sr.y, r: sr.r, hp: sr.hp, maxHp: sr.maxHp, name: sr.name || null, resident: sr.resident || null,
          final: !!sr.final, secret: !!sr.secretBoss, variant: sr.variant || null, phase: sr.phase || null,
          pattern: sr.pattern71 || null, patternWarn: sr.patternWarn71 || 0, entrance: sr.entrance || 0,
          exposedT: sr.exposedT || 0, addsAlive: sr.addsAlive || 0, sweep: sr.sweep ? { t: sr.sweep.t, warn: sr.sweep.warn, fire: sr.sweep.fire } : null,
          engineState: f.bossState(sr), view: v, frame: fr ? fr.id : null, dedicated: fr ? fr.dedicated : null, rev: fr ? fr.rev : null,
          figH: geo ? geo.figH : null, footY: geo ? geo.footY : null
        });
      },
      /* QA: fija campos del jefe activo para fotografiar cada estado y cada señal sin
         esperar a que la IA los elija (posición, aparición, patrón, barrido, vida…). */
      debugPoseBoss: function (o) {
        if (!(ir && sr) || !o) return false;
        for (const k of ["x", "y", "entrance", "hitFlash", "exposedT", "freezeTimer", "addsAlive", "addTimer", "pattern71", "patternWarn71",
          "phase", "phaseTimer", "attackTimer", "berserk", "_ddaAttackT", "hp", "sweep"]) {
          if (k in o) sr[k] = o[k];
        }
        return true;
      },
      /* QA: abate al jefe por la vía real del motor (Ep → registro de muerte), sin el
         cierre de sala ni el final de partida que encadena un disparo de verdad. */
      killBoss: function () {
        if (!(ir && sr)) return false;
        const b = sr;
        try { Ep(b, false, "qa:probe"); } catch (err) { return "error: " + err; }
        try { vs(b.x, b.y, b.color, 30, 40); } catch (err) { /* partículas opcionales */ }
        ir = false;
        sr = null;
        return true;
      },
      /* QA: repinta el fotograma actual sin avanzar la simulación. */
      renderNow: function () { Qf(); return true; },
      /* QA: props sólidos de la sala (posición, huella y clave de profundidad). */
      getProps: function () {
        const out = [];
        try {
          for (const pr of tc) {
            if (!pr || pr.hidden || !pr.onFloor) continue;
            out.push({ x: pr.x, y: pr.y, br: pr.br, footH: pr.footH, sortY: pr.sortY, tall: !!pr.tall, solid: pr.solid !== false, kind: pr.kind || null, style: pr.style || null, name: pr.name || null });
          }
        } catch (err) { /* sin sala activa */ }
        return out;
      },
      /* QA: abate a todos por la vía real del motor (deja registro de muerte). */
      killAllEnemies: function () {
        try { return !!(window.DMO && window.DMO.playtest && window.DMO.playtest.killAll()); } catch (err) { return false; }
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
      <span id="dd-boot-hint">CLIC · CUALQUIER TECLA · (A) PARA SALTAR</span>
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
    "dd_opening.js",
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
