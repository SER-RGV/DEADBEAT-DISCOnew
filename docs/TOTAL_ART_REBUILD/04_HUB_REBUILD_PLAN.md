# FASE 2 — PLAN DEL HUB (build activo) · Incremento 1
**Rama:** `arena/7e0496dc-deadbeat-disconew` · **Fecha:** 2026-11-15 · Complementa 00–03.

## 1. Arquitectura real del Refugio (verificada en `src/dd_hub_system.js`)

- Sala única `HUB_BOUNDS {260,210,1240,760}`; cámara con zoom adaptativo; canvas de caché 1800×1180 (`ensureHubCache`).
- Fondo: `DD_WORLD.buildHighResRoomCache(ctx, 1800, 1180, HUB_BOUNDS, circleIdx=0, roomSeed=777)` → void gradient + suelo por patrón (`floor_00_limbo_marble`) + VIP rug velvet (idx 0) + AO + paredes (`wall_panel_gothic_niche` + `wall_pillar_obsidian`) + pilares.
- Props y NPCs Y-sorted; estaciones (`descent`, `armory`, `dj`, `map`) con anillos en suelo y prompt; colisiones circulares contra `HUB_PROPS[].br`.
- Protagonista: IDLE 07B (DD_HUB) — aprobado técnicamente; combate sigue con sprites del motor.

**Restricciones de no-ruptura:** estaciones (id/posición/radio), `HUB_BOUNDS`, colisiones de muebles, geometría de paredes y anclajes de props **no se mueven** en este incremento. El rediseño panorámico completo (accesos funcionales por círculo) queda para incrementos posteriores según la lámina; nunca cambia la regla de progresión (la incursión entra por `descent`).

## 2. Qué cambia en este incremento (mínimo viable, reversible)

| # | Asset | Tipo | Uso |
|---|---|---|---|
| 1 | `hub_floor_main` | C · 512² opaco seamless | Suelo del Refugio: damero negro/granate con filetes magenta (la lámina del hub). Se inyecta por nueva opción `opts.floorAsset` en `buildHighResRoomCache` (8º parámetro opcional; el bridge no lo usa y no cambia). Se desactiva el VIP rug velvet solo para el hub |
| 2 | `hub_portal_frame` | C · 256×384 RGBA | Arco de obsidiana gótico-tech. Se pinta 9 veces en la banda superior (mezzanine) sobre el void, una por círculo, con glow interior del color canónico de cada círculo (`CIRCLE_CONFIG[].neon`) vía `drawNeonGlow`. **Decorativo**: no es estación, no abre niveles, no toca progresión. Sin texto |

Flag de reversibilidad: `window.__DD_HUB_REBUILD !== false` (activo por defecto; `false` desde el arranque → mezzanine off y suelo clásico). Reversible en caliente: el stamp del caché no cambia con el flag → botón `rebuildHubCache` no expuesto; se documenta que el flag se lee al construir la caché (una vez por sesión activa del Refugio). Igual de simple y seguro que las tandas previas.

## 3. Qué NO se hace aquí (deliberadamente)

- No se mueven estaciones, colisiones ni límites; no se añaden portales jugables; no se toca `descent`.
- No se regenera `floor_00_limbo_marble` (lo usan las salas LIMBO de campaña) ni `prop_*` existentes (clase B en FASE 3+).
- No se renombra nada del HUD; no se toca `dd_ui_system.js`.

## 4. Verificación

- Build activo correcto (`tools/build_active_html.py`), `node --check` de los módulos fuente, registro regenerado (2 entradas nuevas; 269→271), hashes e informe de producción en `ART_TOOLS/prepare_tr_total_01.py`.
- **Pendiente declarado:** arranque real y captura A/B sin navegador en este sandbox (00 §8). No se declara «integrado visualmente».

## 5. Siguientes incrementos del HUB (FASE 2 completa)

- Kit `hub_*`: pista central (anillo + calavera emisor), portales funcionales (UI de selección de círculo con reglas de progresión intactas), torre DJ con sprites propios, balcones/escaleras, bar infernal, archivo, galería, máquinas, secretos — cada uno como asset clase C con su integración medida.
- NPC y estaciones: sin cambios funcionales; mejora de sprites (clase B) cuando se aprueben diseños.
