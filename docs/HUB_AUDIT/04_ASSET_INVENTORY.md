# 04_ASSET_INVENTORY.md — Inventario de assets del Refugio

DEADBEAT DISCO · FASE 01 · Auditoría y rediseño del Refugio
Rama: `arena/8b71cc96-deadbeat-disconew` (desde `main` `2d1f6e8`)
Estado: **solo auditoría y propuesta** — sin modificaciones destructivas, sin rediseño visual, sin nuevos assets.

---

## 1. Contexto del registro de recursos

- **`src/dd_asset_registry.js`** (autogenerado, 138 líneas): manifiesto `DD_ASSETS`, 269 registrados / 345 planificados.
- **`ART_PACK/art_pack.js`** (2211 líneas): paquete de arte con bloques HUB Tanda 01/02/03/05/06/07/08 y slots V5/T3B.
- **`ART_ASSETS/hub/tanda_01/`**: 10 assets de reconstrucción de escenarios HUB (tanda HUB-01), con manifiesto propio y medidas de drawImage en HUB real.

> Las clasificaciones (APROBADO / REUTILIZABLE / OBSOLETO / INCONSISTENTE / FALTANTE / DUPLICADO) se detallan en `03_ART_AUDIT.md`.

---

## 2. Assetes del protagonista (referencia y sprite del HUB)

| ID / nombre | Ruta | Dimensiones | Categoría | Estado de registro |
|-------------|------|-------------|-----------|--------------------|
| Lámina maestra aprobada (protagonista) | `assets/cinematics/restart/character_master/protagonist_master_approved.png` | 1672 × 941 | APROBADO (referencia canónica) | No es entrada de HUB en DD_ASSETS |
| IDLE fidelidad v2 (sprite HUB) | `assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png` | 288 × 512 | REUTILIZABLE / PENDIENTE | No registrado en DD_ASSETS (manifiesto R05B pendiente) |
| IDLE v1 (comparación) | `assets/characters/protagonist_master/fidelidad/versiones/pm_idle_fid_00_v1.png` | 288 × 512 | OBSOLETO | No registrado |
| IDLE R05 (base) | `assets/characters/protagonist_master/pm_idle_00.png` | 288 × 512 | REUTILIZABLE / PENDIENTE | No registrado en DD_ASSETS (manifiesto R05 pendiente) |
| IDLE experimento fallido (4 frames) | `assets/characters/protagonist_master/IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY/pm_idle_0[0-3].png` | 288 × 512 c/u | OBSOLETO | No registrado |

---

## 3. NPCs del Refugio

| ID | Ruta | Dimensiones | Tanda | Categoría |
|----|------|-------------|-------|-----------|
| `npc_dj_booth_world` | `assets/characters/npc_dj_booth_world.png` | 384 × 320 | TANDA_08 | REUTILIZABLE |
| `npc_bartender_hub` | `assets/characters/npc_bartender_hub.png` | 256 × 320 | TANDA_08 | REUTILIZABLE |
| `npc_armorer_hub` | `assets/characters/npc_armorer_hub.png` | 256 × 320 | TANDA_08 | REUTILIZABLE |
| `dialogue_portrait_dj` (fallback DJ) | `assets/ui/dialogue_portrait_dj.png` | 512 × 512 | TANDA_01 | REUTILIZABLE |

---

## 4. Arquitectura y entorno (suelos, muros, plataforma)

| ID | Ruta | Dimensiones | Tanda | Categoría |
|----|------|-------------|-------|-----------|
| `floor_00_limbo_marble` | `assets/floors/floor_00_limbo_marble.png` | 512 × 512 | TANDA_02 | REUTILIZABLE |
| `floor_11_vip_velvet` | `assets/floors/floor_11_vip_velvet.png` | 512 × 512 | TANDA_03 | REUTILIZABLE |
| `threshold_descent_pad` | `assets/environments/threshold_descent_pad.png` | 512 × 320 | TANDA_01 | APROBADO |
| `wall_panel_gothic_niche` | `assets/walls/wall_panel_gothic_niche.png` | 256 × 384 | TANDA_03 | REUTILIZABLE |
| `wall_pillar_obsidian` | `assets/walls/wall_pillar_obsidian.png` | 192 × 384 | TANDA_03 | REUTILIZABLE |

---

## 5. Props (mobiliario y decoración) usados en HUB_PROPS

| ID | Ruta | Dimensiones | Tanda | Categoría | Posición HUB (mundo) |
|----|------|-------------|-------|-----------|----------------------|
| `prop_bookshelf_hub` | `assets/props/prop_bookshelf_hub.png` | 320 × 384 | TANDA_08 | REUTILIZABLE | (430,245), (560,245) |
| `prop_bar_counter` | `assets/props/prop_bar_counter.png` | 416 × 256 | TANDA_08 | REUTILIZABLE | (740,278) |
| `prop_cooler_neon` | `assets/props/prop_cooler_neon.png` | 224 × 352 | TANDA_07 | REUTILIZABLE | (325,280) |
| `prop_speaker_tower` | `assets/props/prop_speaker_tower.png` | 224 × 384 | TANDA_06 | REUTILIZABLE | (1035,255) |
| `prop_dj_booth` | `assets/props/prop_dj_booth.png` | 448 × 288 | TANDA_07 | REUTILIZABLE | (1165,278) |
| `prop_subwoofer_cyan` | `assets/props/prop_subwoofer_cyan.png` | 256 × 352 | TANDA_06 | REUTILIZABLE | (1305,265) |
| `prop_neon_palm` | `assets/props/prop_neon_palm.png` | 320 × 384 | TANDA_05 | REUTILIZABLE | (1415,295) |
| `prop_sofa_black` / `prop_sofa_magenta` | `assets/props/prop_sofa_black.png`, `prop_sofa_magenta.png` | 384 × 256 c/u | TANDA_06 / TANDA_01 | REUTILIZABLE | (745,470), (1015,470) |
| `prop_bench_neon` | `assets/props/prop_bench_neon.png` | 320 × 192 | TANDA_07 | REUTILIZABLE | (880,488) |
| `prop_armchair_vip` | `assets/props/prop_armchair_vip.png` | 256 × 256 | TANDA_06 | REUTILIZABLE | (635,545), (1125,545) |
| `prop_candelabra_floor` | `assets/props/prop_candelabra_floor.png` | 192 × 320 | TANDA_08 | REUTILIZABLE | (675,410), (1085,410) |
| `prop_vending_machine` | `assets/props/prop_vending_machine.png` | 256 × 352 | TANDA_07 | REUTILIZABLE | (355,515) |
| `prop_arcade_cabinet` | `assets/props/prop_arcade_cabinet.png` | 256 × 352 | TANDA_07 | REUTILIZABLE | (355,655) |
| `prop_chest_closed` | `assets/props/prop_chest_closed.png` | 256 × 224 | TANDA_06 | REUTILIZABLE | (455,565) |
| `prop_arcane_pedestal` | `assets/props/prop_arcane_pedestal.png` | 288 × 352 | TANDA_07 | REUTILIZABLE | (1365,585) |
| `prop_potted_plant` | `assets/props/prop_potted_plant.png` | 256 × 320 | TANDA_06 | REUTILIZABLE | (1425,745), (335,845) |
| `prop_chandelier_gold` (faroles techo) | `assets/props/prop_chandelier_gold.png` | 320 × 320 | TANDA_05 | REUTILIZABLE | (650,215), (1110,215) |
| `prop_hub_fox_neon` (mural firma) | `assets/props/prop_hub_fox_neon.png` | 384 × 512 | TANDA_01 | APROBADO | (≈1382,360) |

Total props en `HUB_PROPS`: **22**.

---

## 6. HUB Tanda 01 (reconstrucción de escenarios, ART_ASSETS/hub/tanda_01)

| ID | Nombre | Archivo | Dimensiones | Loader | Slot | Rol |
|----|--------|---------|-------------|--------|------|-----|
| HUB-01 | suelo_central | `hub_01_suelo_central.png` | 512 × 512 | T3B | `t3b_material_01` | Superficie principal (patrón repeat) |
| HUB-02 | pista_central | `hub_02_pista_central.png` | 760 × 430 | V5 | `hub_pista_medallion` | Medallón/alfombra pista central |
| HUB-03 | paredes | `hub_03_paredes.png` | 120 × 176 | — | — | Paredes modulares |
| HUB-04 | cabina_dj | `hub_04_cabina_dj.png` | 720 × 392 | — | — | Cabina DJ |
| HUB-05 | barra_bebidas | `hub_05_barra_bebidas.png` | 380 × 313 | — | — | Barra |
| HUB-06 | columnas | `hub_06_columnas.png` | 76 × 148 | — | — | Columnas |
| HUB-07 | sofas_asientos | `hub_07_sofas_asientos.png` | 224 × 172 | — | — | Sofás |
| HUB-08 | luminarias_neones | `hub_08_luminarias_neones.png` | 67 × 152 | — | — | Luminarias |
| HUB-09 | puertas_accesos | `hub_09_puertas_accesos.png` | 320 × 175 | — | — | Puertas |
| HUB-10 | decoracion_ambiental | `hub_10_decoracion_ambiental.png` | 167 × 136 | — | — | Decoración ambiental |

Total tanda HUB-01: **10 assets**.

---

## 7. Capturas de referencia existentes (evidencia visual)

| Archivo | Dimensiones | Descripción |
|---------|-------------|-------------|
| `docs/ART_REBUILD/evidence/baseline/03_hub_refugio.png` | 1280 × 720 | Captura previa del Hub (línea base) |
| `docs/ART_REBUILD/evidence/tanda_23/03_hub_refugio.png` | 1280 × 720 | Captura previa del Hub (tanda 23) |
| `assets/references/REF_07_mapa_hub_refugio.png` | 1536 × 1024 | Mapa del Refugio / HUB (referencia visual) |
| `assets/references/REF_05_master_sheet_assets_ui_hub.png` | 1536 × 559 | Hoja maestra unificada (incluye interior del Refugio) |
| `assets/references/REF_06_guia_visual_maestra.png` | 1536 × 1024 | Guía visual maestra |

---

## 8. Resumen cuantitativo

| Concepto | Cantidad |
|----------|----------|
| Entradas totales en DD_ASSETS | 269 registrados / 345 planificados |
| Props en HUB_PROPS | 22 |
| Estaciones de interacción | 4 |
| NPCs en HUB | 3 (+ 1 fallback de retrato) |
| Variantes del protagonista (no usadas) | 4 (v1, experimento 4 frames, R05 base, fidelidad v2 usada) |
| Assets tanda HUB-01 | 10 |
| Capturas de referencia del Hub | 4 |

---

## 9. Observaciones de inventario

1. El protagonista usado en el HUB (`pm_idle_fid_00.png`) **no está registrado** en `src/dd_asset_registry.js` ni en el manifiesto activo; tiene manifiestos de lote pendientes de aprobación (`R05B`, `R05`).
2. Variantes obsoletas del protagonista (v1, experimento fallido) no están registradas y no se usan, pero existen en disco; deben conservarse como referencia, no eliminarse.
3. No se han detectado assets duplicados funcionales dentro de los activos realmente usados por el HUB, salvo las variantes del protagonista que no se renderizan.
4. No hay evidencia de assets "faltantes" bloqueantes para el HUB actual; los posibles faltantes (señalización, iluminación diferencial) son propuestas de diseño, no carencias del estado actual.
