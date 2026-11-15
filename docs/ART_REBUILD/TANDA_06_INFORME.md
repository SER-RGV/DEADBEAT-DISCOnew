# TANDA 06 · OBJETOS (botín y reliquias) — informe de cierre

Fecha: 2026-11-15 · Rama `arena/e088e9d7-deadbeat-disconew` (PR #22) · Plan: [`PLAN_PRODUCCION_02-07.md`](PLAN_PRODUCCION_02-07.md) §3 fila 06.
Lote: [`batches/T06_OBJETOS.json`](batches/T06_OBJETOS.json) (20 assets, 3 turnos) · Evidencia: `evidence/T06_OBJETOS/` (00–12 + 3 informes de sonda) ·
Herramientas: `tools/art_master/batch.py`, `tools/art_master/probe_pickups.js`, gancho QA `__DD_BRIDGE.spawnPickupAt`, `DMO.rogue.debug`.

**Resultado: 20/20 ilustraciones producidas, procesadas (160×160 RGBA, pivot center), registradas (caché `20261115.26`) y
verificadas dentro de la build real (`index.html`)**: 12 botines en el suelo del motor y 8 reliquias en la tarjeta del cofre y
en la lista de pasivos de la pausa, con la reserva al glifo comprobada con un doble de `DD_ASSETS`.

## 1. Auditoría (lo que había al abrir la tanda)

- `assets/pickups/` tenía 20 PNG de estilo dispar (12 `pickup_*_00` + 8 `relic_*`), todos clasificados B/D en
  `AUDIT_INVENTORY.md`. `drawPickup` (`src/dd_world_renderer.js` l.1603–1639) consume `pickup_<tipo>_00` a 44 px × 1,15 con
  balanceo procedimental; **ningún código consumía `relic_*`**: el motor pinta las reliquias con glifos de texto en la tarjeta
  del cofre (`#shot-choice-overlay .shot-card50 .shot-icon`) y en la lista de pasivos de la pausa (`.rogue71-items`).
- El HUD reutilizaba `pickup_heart_00` / `pickup_shield_00` / `pickup_credits_00` como reserva de iconos (ver T07).

## 2. Lo que NO se produce

- No se crean objetos nuevos ni se toca la tabla `mu` (botín) ni `ho` (reliquias) del motor; no cambian efectos, precios ni
  probabilidades. La animación del botín (bob `sin(4.5t)·4`, halo `#22d3ee`) sigue siendo procedimental
  (`ANIMATION_CONTRACT.md` §pickups).

## 3. Producido e integrado (20/20)

| Turno | Assets | Integración | Evidencia |
|---|---|---|---|
| 1 | `pickup_ammo/boost/companion/credits/damageup/fireup/heart/mutation/shield_00` (9) | `drawPickup` (ids ya mapeados) | `00`–`03`, `t06_probe_turno1.json` |
| 2 | `pickup_bomb/speedup/turret_00` + `relic_needle/lowpass/magnet/pact/echo/coil/prism` (10) | `drawPickup` + parche `1f` del build (tarjeta del cofre y lista de pasivos) | `04`–`09`, `t06_probe_turno2.json` |
| 3 | `relic_tempo` (metrónomo negro lacado, aguja magenta) | parche `1f` (cofre + lista) | `10`–`12`, `t06_probe_turno3.json` |

- Maestros WebP en `ART_ASSETS/rebuild_masters/T06_OBJETOS/`; PNG finales en `assets/pickups/`; `manifest.entries[id]` con
  `art_revision: T06_OBJETOS`; clase **E** en el inventario.
- **Código (sólo presentación, sin mecánica):** `tools/build_active_html.py` bloque `1f` (dos sustituciones de una línea:
  si `DD_ASSETS.get("relic_<id>")` devuelve imagen, la tarjeta/lista muestran `<img class="dd-relic-icon">`; si no, conservan el
  glifo) + CSS `.dd-relic-icon`/`.dd-relic-icon-sm` en `src/dd_rebuild_ui.css`; gancho QA `__DD_BRIDGE.spawnPickupAt(type,x,y)`
  (misma función `nf()` del motor).

## 4. Pruebas y QA (turno 3 = cierre)

Sonda `probe_pickups.js` sobre `:8080/index.html` (Chromium headless, 1920×1080), informe `evidence/T06_OBJETOS/t06_probe_turno3.json`:

- **Botín en el suelo:** 11/11 tipos generados por `spawnPickupAt` visibles (`heart, shield, boost, credits, damageUp, fireUp,
  companion, mutation, bomb, speedUp, turret`), 0 errores de página.
- **Cofre real** (`DMO.rogue.debug chest/open`): la tarjeta de objeto muestra la ilustración `relic_<id>` (`has-relic-art`).
- **Lista de pasivos** (pausa) con los 6 pasivos concedidos (`tempo, needle, lowpass, magnet, pact, echo`): 6/6 con icono;
  `relic_tempo` (METRÓNOMO NEGRO) en primera posición.
- **Reserva al glifo:** con `window.DD_ASSETS` sustituido temporalmente por un doble que devuelve `null` para `relic_*`
  (el registro real está congelado con `Object.freeze`), la tarjeta del cofre vuelve a su glifo de texto y no inserta `<img>`
  (`fallbackGlyph.cards[*].art === false`, `stubApplied === true`, `restored === true`). Evidencia `12_relic_cofre_fallback_glifo.png`.
- **Referencias huérfanas:** comprobación automática (script en `PRODUCTION_LOG.md` §17): todos los `src` del manifiesto existen,
  todos los archivos de `assets/pickups/` y `assets/ui/` están registrados y el código no referencia ningún id `pickup_|relic_|hud_|ui_`
  inexistente. Ids registrados sin consumidor en código: `menu_main_backdrop`, `menu_main_backdrop_a`, `ui_shop_emblem`
  (heredados de tandas anteriores; el menú usa `mc_07_pit.jpg` por decisión de PROJECT RESTART). No pertenecen a T06.
- **Límites:** la sonda entra en la partida por el atajo de QA (`DD_HUB.enter()` + `exitToRun()` tras `DD_ASSETS`) y para la
  captura de pantalla completa oculta las capas del menú (`#dd-menu-backdrop`, `#dd-main-menu`), cosa que se anota en su
  informe; la tarjeta del cofre y la lista de pasivos se capturan como elementos DOM reales. El panel de arranque no se oculta
  nunca (ver `TANDA_07_INFORME.md` §4 para el diagnóstico de `#dd-boot-frame.is-failed`).

## 5. Lecciones de generación

- Los 20 prompts de la ficha funcionan a la primera con un solo objeto y croma limpio; el único fallo (`bomb`, turno 1) fue del
  servicio, no del prompt.
- `pickup_speedup_00` dispara `baked_checker_suspect` en el QC: falso positivo (zapatilla blanca/gris), comprobado sobre fondo
  claro y oscuro.
- `relic_needle` es la silueta más fina del lote: legible a 44 px por la diagonal y la punta cian; no reducirla más.
- Las reliquias no son botín de suelo: su integración real es la tarjeta del cofre y la lista de pasivos (parche `1f`), con
  reserva al glifo si falta el asset. **Toda integración nueva de un id debe sondearse por su consumidor real.**

## 6. Pendientes / decisiones por defecto

1. Los glifos de texto del motor siguen existiendo como reserva (no se eliminan): si un asset falla en carga, la tarjeta vuelve
   al glifo sin romper el flujo del cofre.
2. `pickup_credits_00`/`pickup_heart_00`/`pickup_shield_00` dejan de ser la imagen principal del HUD en T07 (ahora sólo reserva
   de `assetSrc`).
3. Con la colección de pasivos llena (6/6) el cofre no ofrece tarjeta de objeto: las sondas abren el cofre antes de conceder pasivos.
