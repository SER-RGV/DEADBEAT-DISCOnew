/* ==========================================================================
   DEADBEAT DISCO — FASE 08 · PERFIL DE ESCALA DEL MUNDO (window.DD_SCALE)

   Una sola tabla con todos los factores de escala VISUAL y de GEOMETRÍA de
   salas que la fase 08 introduce. Quien la consume:

     · src/dd_world_renderer.js  → altura de figura del protagonista, enemigos,
                                   jefes y tamaño del botín (sólo dibujo).
     · tools/build_active_html.py → escala del arma en mano (ut.h), tamaño de
                                   sala en ng() (roomScale) y arranque de la
                                   cámara (src/dd_camera.js lee `camera`).

   Lo que NO toca: radios de colisión (ye.r, e.r, sr.r, balas), velocidades,
   alcances (reach/ft), radios de explosión ni distancias de interacción. Esos
   valores siguen siendo los del motor; ver docs/WORLD_SCALE_REBUILD/COLLISION_AUDIT.md.

   Perfiles:
     legacy      todo a 1 y cámara del motor (zoom fijo 0,8): la build anterior.
     intermedia  dirección aprobada (por defecto).
   Selección: ?scale=legacy|intermedia en la URL o localStorage "dd_scale_profile".
   ========================================================================== */
(function (root) {
  "use strict";

  const PROFILES = {
    legacy: {
      name: "legacy",
      player: 1,
      enemy: { security: 1, dancer: 1, fanatic: 1, drone: 1, chef: 1, elite: 1 },
      mini: 1,
      boss: 1,
      bossBySlug: {},
      pickup: 1,
      room: { entrance: 1, combat: 1, shop: 1, miniboss: 1, boss: 1, final: 1 },
      roomMax: { w: 1980, h: 1480 },
      camera: { enabled: false }
    },
    intermedia: {
      name: "intermedia",
      // ENTIDADES (factor sobre la altura de figura actual del renderizador; px de mundo)
      player: 1.18,                 // 104 → 123 px   (objetivo 1,15–1,25)
      enemy: {
        security: 1.06,             // guardia / bailarín del círculo I: normal   (0,95–1,15)
        dancer: 1.04,               // bailarín: normal                          (0,95–1,15)
        fanatic: 0.98,              // sprinter: rápido, agazapado               (0,85–1,05)
        drone: 0.95,                // tirador flotante: rápido                  (0,85–1,05)
        chef: 1.36,                 // tanque: pesado                            (1,35–1,60)
        elite: 1.42                 // élite                                      (1,40–1,80)
      },
      mini: 1.12,                   // minijefe: sobre el factor de su familia
      boss: 1.28,                   // residentes: 190 → ≈243 px ≈ 2,0× el protagonista nuevo
      bossBySlug: { boss_09_nucleo: 1.22, boss_08_traidor: 1.24 },   // los dos más altos, algo menos
      pickup: 1.15,                 // 44 → 51 px                                 (1,10–1,20)
      // SALAS (factor sobre el ancho/alto que decide ng() antes de sus topes)
      room: { entrance: 1.10, combat: 1.18, shop: 1.0, miniboss: 1.28, boss: 1.40, final: 1.40 },
      roomMax: { w: 1980, h: 1480 }, // topes del motor: la sala cabe en el mundo 2500×1850 con su franja de muro
      // CÁMARA (src/dd_camera.js)
      camera: {
        enabled: true,
        refH: 1080,                 // el zoom se expresa a 1080 px de alto; otras alturas conservan el campo vertical
        zoomMin: 0.80,              // nunca más lejos que la build anterior (0,8)
        zoomMax: 1.12,
        calm: 1.08,                 // sin enemigos cerca
        combat: 0.98,               // 1–3 enemigos a menos de 900 px
        crowd: 0.88,                // ≥ 8 enemigos a menos de 900 px
        bossMin: 0.84,              // encuentro con residente: nunca más cerca que esto
        nearR: 900,                 // radio de amenaza (px de mundo)
        hysteresis: 0.035,          // el objetivo sólo cambia si se mueve más que esto
        zoomTau: 0.9,               // s: constante de tiempo del zoom
        zoomRate: 0.30,             // 1/s: cambio máximo de zoom por segundo
        followTau: 0.17,            // s: seguimiento de posición
        leadTau: 0.28,              // s: suavizado de la anticipación
        leadAim: 44,                // px de mundo: anticipación máxima por puntería (como N.lead del motor)
        leadVel: 0.22,              // s: anticipación por velocidad (v · leadVel)
        leadMaxFrac: 0.10,          // tope de la anticipación total: fracción del ancho visible
        deadzoneFrac: 0.035,        // zona muerta: fracción del ancho/alto visible
        safeFrac: 0.36,             // el jugador nunca pasa de esta fracción del semiancho/semialto
        roomMargin: { top: 280, bottom: 220, left: 240, right: 240 },
        bossBias: 0.22,             // desplaza el encuadre hacia el jefe (fracción de la distancia)
        bossPad: 120,               // margen alrededor de jugador + jefe al ajustar el zoom
        snapDist: 600               // un salto mayor que esto (teletransporte, cambio de sala) recoloca la cámara
      }
    }
  };

  function detectProfileName() {
    let name = "";
    try {
      const q = (root.location && root.location.search) || "";
      const m = /[?&]scale=([a-z]+)/i.exec(q);
      if (m) name = m[1].toLowerCase();
    } catch (e) {}
    if (!name) {
      try { name = String(root.localStorage && root.localStorage.getItem("dd_scale_profile") || "").toLowerCase(); } catch (e) {}
    }
    return PROFILES[name] ? name : "intermedia";
  }

  let active = PROFILES[detectProfileName()];

  function roomClass(info) {
    info = info || {};
    if (info.shop) return "shop";
    if (info.final) return "final";
    if (info.boss) return (info.slot === 5) ? "miniboss" : "boss";
    if (info.first) return "entrance";
    return "combat";
  }

  const api = {
    profiles: PROFILES,
    get name() { return active.name; },
    get player() { return active.player; },
    get pickup() { return active.pickup; },
    get mini() { return active.mini; },
    get camera() { return active.camera; },
    get roomMax() { return active.roomMax; },
    setProfile: function (name) {
      if (!PROFILES[name]) return false;
      active = PROFILES[name];
      try { root.localStorage && root.localStorage.setItem("dd_scale_profile", name); } catch (e) {}
      return true;
    },
    enemyScale: function (family, mini) {
      const f = active.enemy[family];
      return (typeof f === "number" ? f : 1) * (mini ? active.mini : 1);
    },
    bossScale: function (slug) {
      const f = active.bossBySlug[slug];
      return typeof f === "number" ? f : active.boss;
    },
    roomClass: roomClass,
    /* Factor de tamaño de sala según su función. `info`: {index, slot (0..10 dentro
       del círculo), shop, boss (slot 5 ó 10 o sala final), first (slot 0), final}. */
    roomScale: function (info) {
      return active.room[roomClass(info)] || 1;
    },
    /* Aplica el factor y los topes del motor (múltiplos de 20 px, como ng()). */
    scaledRoomSize: function (w, h, info) {
      const sc = api.roomScale(info);
      const mx = active.roomMax;
      return {
        w: 20 * Math.round(Math.min(mx.w, w * sc) / 20),
        h: 20 * Math.round(Math.min(mx.h, h * sc) / 20),
        scale: sc, cls: roomClass(info)
      };
    },
    describe: function () {
      return {
        profile: active.name, player: active.player, enemy: Object.assign({}, active.enemy), mini: active.mini,
        boss: active.boss, bossBySlug: Object.assign({}, active.bossBySlug), pickup: active.pickup,
        room: Object.assign({}, active.room), cameraEnabled: !!active.camera.enabled
      };
    }
  };

  root.DD_SCALE = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
