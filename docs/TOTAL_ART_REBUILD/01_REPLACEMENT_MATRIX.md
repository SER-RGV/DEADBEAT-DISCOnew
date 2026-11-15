# FASE 0/1 — MATRIZ DE SUSTITUCIÓN
# DEADBEAT DISCO — recurso actual → recurso nuevo → sistema → estado

**Fecha:** 2026-11-15 · **Rama:** `arena/7e0496dc-deadbeat-disconew`
**Regla rectora:** la sustitución se hace **sobre el build activo** (`index.html` generado + `src/` + `assets/`), nunca sobre `DEADBEAT_DISCO.ART.html`. Un recurso solo se considera sustituido cuando el juego lo está usando de verdad (verificación en `tools/qa/*.js` cuando haya navegador).

## 0. Clases de sustitución (convención del proyecto, respetada)

| Clase | Acción | IDs | Ejemplo |
|---|---|---|---|
| **A — Conservar** | El asset decodifica, está referenciado y cumple dirección → no se toca | mismo ID | `logo_deadbeat_graffiti`, `emblem_fox_crown` |
| **B — Mejorar (mismo ID)** | Mismo `id`/`originalId`/ruta; se regenera el PNG con fidelidad a las láminas; el registry no cambia (solo bump `?v=`) | mismo ID | `floor_01_lust_dancefloor`, `boss_02_bufe_*` |
| **C — Nuevo** | Recurso inexistente en el registry (kit del HUB, props firma por círculo, luces) → nuevo ID + registro + wiring en DD_WORLD/DD_HUB | nuevo ID | `hub_dancefloor_main`, `gula_hook_rack` |
| **D — Migrar/retirar** | Recurso que queda sin uso tras validada su sustitución → se retira del registry **después** de la verificación | ID marcado | se audita con `grep` antes de borrar nada |
| **E — Congelar** | Históricos/evidencia (`ART_ASSETS/`, `ART_EVIDENCE/`, builds congelados) | — | no se tocan |

## 1. Matriz por familias (visión de dirección)

| # | Recurso actual | Nuevo recurso (dirección de referencia) | Sistema afectado | Clase | Estado |
|---|---|---|---|---|---|
| 1 | Suelos provisionales (`floor_00..11`) | Suelos definitivos por círculo según láminas (Lujuria neon dancefloor magenta; Gula damero cárnico/terracota; Avaricia vetado dorado; Ira losa quebrada; Herejía obsidiana gótica; Violencia losas industriales tóxicas; Fraude travertino/espejos diamante; Traición abisal hielo; Núcleo obsidiana cósmica; Hub damero + moqueta VIP) | Escenarios (rooms) | B | Pendiente |
| 2 | Paredes provisionales (`wall_panel_*`, `wall_gula/wrath/ice/core_*`) | Muros definitivos por círculo (gótico-neón Lujuria, banquete Gula, mármol financiero Avaricia, furnace Ira, altares Herejía, industrial Violencia, galería Fraude, hielo roto Traición, monolito Núcleo) | Escenarios | B | Pendiente |
| 3 | Decoración genérica de sala (AO/void pintados en caché) | Kit de ambiente: haze por círculo, viñeta material, lámparas/diodos/glows con bloom solo emisor | Render (DD_WORLD room cache) | C | Pendiente |
| 4 | Puertas (`door_*`) y pad de descenso (`threshold_descent_pad`) | Puertas definitivas por círculo + pad Núcleo rediseñado (sin cambiar `door.kind`/lógica) | Escenarios / progreso | B | Pendiente |
| 5 | Mobiliario antiguo (`prop_sofa_*`, `prop_bar_counter`, `prop_banquet_table`, `prop_dj_booth`, lámparas, estatuas…) | Mobiliario nuevo con identidad por círculo (VIP Lujuria, banquillo Gula, banca financiera Avaricia, restos industriales Ira, confesonario Herejía, tanque Violencia, candelabro Fraude, altar Traición) | HUB y niveles | B + C | Pendiente |
| 6 | Iluminación antigua (gradientes planos, `drawNeonGlow` genérico) | Iluminación nueva: neones volumétricos por círculo integrados en room cache + overlays de emisor (sin simular toda la escena con una imagen) | Render | C | Pendiente |
| 7 | Props antiguos (30) | Props nuevos por lámina (espejos, arcón de vanidad, rack de carne, arcade, tragamonedas, altar, bidones, portales exclusivos X10) | Interacción / decoración | B + C | Pendiente |
| 8 | Gráficos de enemigos (24) | Enemigos definitivos por familia según «Guía visual neon» §02 (Seguridad, Bailarín, Sprinter, Tirador, Mascota, Tanque + variantes Élite/especiales: corrupto, blindado, ígneo, eléctrico, tóxico, neón) | Entidades | B | Pendiente |
| 9 | Gráficos de jefes (42 = 11 × 4 estados) | Jefes definitivos por círculo con iconografía de sus láminas; 3 fases (ejemplo Véspera F1/F2/F3 de la guía) como estados especiales si el motor los expone; sin tocar patrones ni stats | Jefes | B | Pendiente |
| 10 | Interfaz provisional (HUD retrato, menús) | HUD definitivo (chasis `#0a0c12`, magenta/oro, 5 corazones, retrato nuevo del maestro) | HUD / menús | B | Pendiente |
| 11 | HUB del build activo (Refugio salón único) | HUB reconstruido: pista central, portales de los 9 círculos, escaleras/balcones, tienda, sala de máquinas, archivos, torre DJ, bar infernal, sala de ensayo, galería, **conservando estaciones y navegación reales** | DD_HUB (Refugio) | C | Pendiente |
| 12 | Cinemáticas/menú | Acabados de menú y key art según guía §07 (sin reabrir lo aprobado en RESTART sin mandato) | Presentación | A (casi todo) | Conservar |
| 13 | Protagonista | 22 sprites actuales se sustituyen por sprites del diseño maestro **solo tras aprobación del IDLE y producción de WALK/SHOOT** (regla de no mezclar diseños) | Entidades | B (futuro) | Pendiente / bloqueado por aprobación |
| 14 | Mapa/torres/pantallas HUD (`map_infernal_tower`, iconos) | Iconografía definitiva según guía §07 (sistema) | UI | B | Pendiente |
| 15 | Fuentes/branding (`logo_*`, `emblem_*`) | **A — conservar** (identidad aprobada) | Marca | A | Conservado |

## 2. Dependencias previas a borrar cualquier cosa (checklist D)

1. `grep -r` del ID en `src/`, `tools/`, `assets/manifest.json`, `docs/`. 2. `grep` en `index.html` (build regenerable — nunca se edita a mano). 3. Verificar que el nuevo recurso decodifica (carga sin 404, `DD_ASSETS.get` ≠ null). 4. Verificar captura o diff antes/después. 5. Solo entonces retirar el bitmap viejo (hoy: ninguno se borra en esta fase; clase D queda **vacía** hasta FASE 7).

## 3. Apéndices — los 269 recursos registrados, uno a uno

Regla: misma tabla para todos; `ID regenerado` = clase B (mismo ID y ruta; PNG nuevo con fidelidad de lámina). Los recursos sin par en láminas se mejoran contra ART_BIBLE (familia, material, luz).

### Apéndice floors (12)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `floor_00_limbo_marble` | `floor_00_limbo_marble` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `floor_01_lust_dancefloor` | `floor_01_lust_dancefloor` regenerado TR_T02 (mismo ID) | Escenarios | Integrado (código) |
| `floor_02_gula_terracotta` | `floor_02_gula_terracotta` regenerado TR_T03 (mismo ID) | Escenarios | Integrado (código) |
| `floor_03_greed_slate_gold` | `floor_03_greed_slate_gold` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `floor_04_wrath_burgundy` | `floor_04_wrath_burgundy` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `floor_05_pride_obsidian_gold` | `floor_05_pride_obsidian_gold` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `floor_06_violence_ash_slabs` | `floor_06_violence_ash_slabs` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `floor_07_envy_travertine` | `floor_07_envy_travertine` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `floor_08_ice_abyssal` | `floor_08_ice_abyssal` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `floor_09_core_cosmic_vein` | `floor_09_core_cosmic_vein` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `floor_10_hub_checker` | `floor_10_hub_checker` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `floor_11_vip_velvet` | `floor_11_vip_velvet` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice walls (10)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `wall_core_monolith` | `wall_core_monolith` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `wall_gula_banquet` | `wall_gula_banquet` regenerado TR_T03 (mismo ID) | Escenarios | Integrado (código) |
| `wall_ice_glacier` | `wall_ice_glacier` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `wall_panel_gothic_niche` | `wall_panel_gothic_niche` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `wall_panel_heavy_base` | `wall_panel_heavy_base` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `wall_panel_neon_crown` | `wall_panel_neon_crown` regenerado TR_T02 (mismo ID) | Escenarios | Integrado (código) |
| `wall_panel_tall_neon` | `wall_panel_tall_neon` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `wall_panel_vip_window` | `wall_panel_vip_window` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `wall_pillar_obsidian` | `wall_pillar_obsidian` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `wall_wrath_furnace` | `wall_wrath_furnace` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice environments (8)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `door_arched_open` | `door_arched_open` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `door_gothic_closed` | `door_gothic_closed` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `door_gothic_open` | `door_gothic_open` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `door_stained_closed` | `door_stained_closed` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `door_vip_crimson` | `door_vip_crimson` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `portal_avaricia_gold` | `portal_avaricia_gold` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `portal_baroque_gold` | `portal_baroque_gold` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `threshold_descent_pad` | `threshold_descent_pad` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice props (30)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `prop_arcade_cabinet` | `prop_arcade_cabinet` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_arcane_pedestal` | `prop_arcane_pedestal` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_armchair_vip` | `prop_armchair_vip` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_banquet_table` | `prop_banquet_table` regenerado TR_T03 (mismo ID) | HUB y niveles | Integrado (código) |
| `prop_bar_bottles` | `prop_bar_bottles` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_bar_counter` | `prop_bar_counter` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_barrel_infernal` | `prop_barrel_infernal` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_bench_neon` | `prop_bench_neon` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_bollard_pair` | `prop_bollard_pair` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_bookshelf_hub` | `prop_bookshelf_hub` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_candelabra_floor` | `prop_candelabra_floor` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_chandelier_gold` | `prop_chandelier_gold` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_chest_closed` | `prop_chest_closed` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_chest_open` | `prop_chest_open` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_cooler_neon` | `prop_cooler_neon` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_crate_club` | `prop_crate_club` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_dj_booth` | `prop_dj_booth` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_gilded_altar` | `prop_gilded_altar` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_gothic_statue` | `prop_gothic_statue` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_hub_fox_neon` | `prop_hub_fox_neon` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_mirror_baroque` | `prop_mirror_baroque` regenerado TR_T02 (mismo ID) | HUB y niveles | Integrado (código) |
| `prop_neon_flower` | `prop_neon_flower` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_neon_palm` | `prop_neon_palm` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_potted_plant` | `prop_potted_plant` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_sigil_poster` | `prop_sigil_poster` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_sofa_black` | `prop_sofa_black` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_sofa_magenta` | `prop_sofa_magenta` regenerado TR_T02 (mismo ID) | HUB y niveles | Integrado (código) |
| `prop_speaker_tower` | `prop_speaker_tower` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_subwoofer_cyan` | `prop_subwoofer_cyan` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `prop_vending_machine` | `prop_vending_machine` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice characters (31)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `companion_drone_ally` | `companion_drone_ally` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hero_idle_00` | `hero_idle_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hero_shoot_00` | `hero_shoot_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hero_walk_00` | `hero_walk_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hero_walk_01` | `hero_walk_01` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hero_walk_02` | `hero_walk_02` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hero_walk_03` | `hero_walk_03` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `npc_armorer_hub` | `npc_armorer_hub` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `npc_bartender_hub` | `npc_bartender_hub` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `npc_dj_booth_world` | `npc_dj_booth_world` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_aim_down_01` | `player_aim_down_01` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_aim_down_02` | `player_aim_down_02` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_aim_down_02_arms` | `player_aim_down_02_arms` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_aim_down_03` | `player_aim_down_03` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_aim_down_03_arms` | `player_aim_down_03_arms` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_aim_up_01` | `player_aim_up_01` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_aim_up_02` | `player_aim_up_02` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_aim_up_03` | `player_aim_up_03` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_boost_00` | `player_boost_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_death_00` | `player_death_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_fire2` | `player_fire2` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_firehip` | `player_firehip` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_firehip_arms` | `player_firehip_arms` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_hurt_00` | `player_hurt_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_idle_00` | `player_idle_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_roll_00` | `player_roll_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_shoot_00` | `player_shoot_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_walk_00` | `player_walk_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_walk_01` | `player_walk_01` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_walk_02` | `player_walk_02` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `player_walk_03` | `player_walk_03` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice enemies (24)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `enemy_chef_attack` | `enemy_chef_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_chef_death` | `enemy_chef_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_chef_walk` | `enemy_chef_walk` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_chef_windup` | `enemy_chef_windup` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_dancer_attack` | `enemy_dancer_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_dancer_death` | `enemy_dancer_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_dancer_walk` | `enemy_dancer_walk` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_dancer_windup` | `enemy_dancer_windup` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_drone_attack` | `enemy_drone_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_drone_death` | `enemy_drone_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_drone_walk` | `enemy_drone_walk` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_drone_windup` | `enemy_drone_windup` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_elite_attack` | `enemy_elite_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_elite_death` | `enemy_elite_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_elite_walk` | `enemy_elite_walk` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_elite_windup` | `enemy_elite_windup` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_fanatic_attack` | `enemy_fanatic_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_fanatic_death` | `enemy_fanatic_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_fanatic_walk` | `enemy_fanatic_walk` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_fanatic_windup` | `enemy_fanatic_windup` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_security_attack` | `enemy_security_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_security_death` | `enemy_security_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_security_walk` | `enemy_security_walk` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `enemy_security_windup` | `enemy_security_windup` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice bosses (42)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `boss_00_anden_attack` | `boss_00_anden_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_00_anden_death` | `boss_00_anden_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_00_anden_hit` | `boss_00_anden_hit` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_00_anden_idle` | `boss_00_anden_idle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_01_magneta_attack` | `boss_01_magneta_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_01_magneta_death` | `boss_01_magneta_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_01_magneta_hit` | `boss_01_magneta_hit` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_01_magneta_idle` | `boss_01_magneta_idle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_02_bufe_attack` | `boss_02_bufe_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_02_bufe_death` | `boss_02_bufe_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_02_bufe_hit` | `boss_02_bufe_hit` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_02_bufe_idle` | `boss_02_bufe_idle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_03_cajero_attack` | `boss_03_cajero_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_03_cajero_death` | `boss_03_cajero_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_03_cajero_hit` | `boss_03_cajero_hit` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_03_cajero_idle` | `boss_03_cajero_idle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_04_pogo_attack` | `boss_04_pogo_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_04_pogo_death` | `boss_04_pogo_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_04_pogo_hit` | `boss_04_pogo_hit` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_04_pogo_idle` | `boss_04_pogo_idle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_05_oficiante_attack` | `boss_05_oficiante_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_05_oficiante_death` | `boss_05_oficiante_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_05_oficiante_hit` | `boss_05_oficiante_hit` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_05_oficiante_idle` | `boss_05_oficiante_idle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_06_matarife_attack` | `boss_06_matarife_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_06_matarife_death` | `boss_06_matarife_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_06_matarife_hit` | `boss_06_matarife_hit` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_06_matarife_idle` | `boss_06_matarife_idle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_07_imitador_attack` | `boss_07_imitador_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_07_imitador_death` | `boss_07_imitador_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_07_imitador_hit` | `boss_07_imitador_hit` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_07_imitador_idle` | `boss_07_imitador_idle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_08_traidor_attack` | `boss_08_traidor_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_08_traidor_death` | `boss_08_traidor_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_08_traidor_hit` | `boss_08_traidor_hit` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_08_traidor_idle` | `boss_08_traidor_idle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_09_nucleo_attack` | `boss_09_nucleo_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_09_nucleo_death` | `boss_09_nucleo_death` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_09_nucleo_hit` | `boss_09_nucleo_hit` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_09_nucleo_idle` | `boss_09_nucleo_idle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_10_arquitecto_attack` | `boss_10_arquitecto_attack` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `boss_10_arquitecto_idle` | `boss_10_arquitecto_idle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice weapons (16)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `weapon_c003_laser` | `weapon_c003_laser` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_c005_needler` | `weapon_c005_needler` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_c007_magnum` | `weapon_c007_magnum` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_c008_silenciada` | `weapon_c008_silenciada` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_c009_desert_eagle` | `weapon_c009_desert_eagle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_c010_explosiva` | `weapon_c010_explosiva` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_c011_de_veneno` | `weapon_c011_de_veneno` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_c012_de_hielo` | `weapon_c012_de_hielo` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_c013_escopeta` | `weapon_c013_escopeta` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_c015_escopeta_automatica` | `weapon_c015_escopeta_automatica` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_m1911` | `weapon_m1911` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_magnum` | `weapon_magnum` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_olympia` | `weapon_olympia` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_plasma` | `weapon_plasma` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_ricochet` | `weapon_ricochet` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `weapon_uzi` | `weapon_uzi` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice effects (22)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `effect_anamorphic_flare` | `effect_anamorphic_flare` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `effect_dust_particles` | `effect_dust_particles` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `proj_cryo` | `proj_cryo` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `proj_flame` | `proj_flame` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `proj_heavy` | `proj_heavy` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `proj_homing` | `proj_homing` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `proj_lane` | `proj_lane` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `proj_pellet` | `proj_pellet` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `proj_plasma` | `proj_plasma` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `proj_rail` | `proj_rail` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `proj_ricochet` | `proj_ricochet` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `proj_slug` | `proj_slug` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `vfx_explosion_inferno` | `vfx_explosion_inferno` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `vfx_fire_plume` | `vfx_fire_plume` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `vfx_impact_plasma` | `vfx_impact_plasma` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `vfx_impact_spark` | `vfx_impact_spark` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `vfx_lightning_purple` | `vfx_lightning_purple` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `vfx_muzzle_gold` | `vfx_muzzle_gold` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `vfx_muzzle_plasma` | `vfx_muzzle_plasma` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `vfx_shockwave_magenta` | `vfx_shockwave_magenta` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `vfx_smoke_cloud` | `vfx_smoke_cloud` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `vfx_soul_flame` | `vfx_soul_flame` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice pickups (20)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `pickup_ammo_00` | `pickup_ammo_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `pickup_bomb_00` | `pickup_bomb_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `pickup_boost_00` | `pickup_boost_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `pickup_companion_00` | `pickup_companion_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `pickup_credits_00` | `pickup_credits_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `pickup_damageup_00` | `pickup_damageup_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `pickup_fireup_00` | `pickup_fireup_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `pickup_heart_00` | `pickup_heart_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `pickup_mutation_00` | `pickup_mutation_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `pickup_shield_00` | `pickup_shield_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `pickup_speedup_00` | `pickup_speedup_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `pickup_turret_00` | `pickup_turret_00` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `relic_coil` | `relic_coil` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `relic_echo` | `relic_echo` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `relic_lowpass` | `relic_lowpass` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `relic_magnet` | `relic_magnet` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `relic_needle` | `relic_needle` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `relic_pact` | `relic_pact` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `relic_prism` | `relic_prism` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `relic_tempo` | `relic_tempo` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice ui (15)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `dialogue_portrait_dj` | `dialogue_portrait_dj` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hud_credit_coin` | `hud_credit_coin` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hud_heart_empty` | `hud_heart_empty` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hud_heart_full` | `hud_heart_full` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hud_portrait_protagonist` | `hud_portrait_protagonist` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hud_shield_badge` | `hud_shield_badge` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hud_skill_bomb` | `hud_skill_bomb` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hud_skill_boost` | `hud_skill_boost` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `hud_skill_dodge` | `hud_skill_dodge` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `map_infernal_tower` | `map_infernal_tower` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `menu_main_backdrop` | `menu_main_backdrop` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `menu_main_backdrop_a` | `menu_main_backdrop_a` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `ui_defeat_emblem` | `ui_defeat_emblem` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `ui_shop_emblem` | `ui_shop_emblem` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `ui_victory_emblem` | `ui_victory_emblem` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice logos (3)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `emblem_fox_crown` | `emblem_fox_crown` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `logo_deadbeat_cinematic` | `logo_deadbeat_cinematic` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `logo_deadbeat_graffiti` | `logo_deadbeat_graffiti` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice overlays (1)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `overlay_vignette_gothic` | `overlay_vignette_gothic` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice cinematics (35)

| Recurso actual (ID registrado) | Nuevo recurso propuesto | Sistema afectado | Estado |
|---|---|---|---|
| `cine_bg01_city` | `cine_bg01_city` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg01_city_01_sky_moon_atmosphere` | `cine_bg01_city_01_sky_moon_atmosphere` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg01_city_02_gothic_skyline_architecture` | `cine_bg01_city_02_gothic_skyline_architecture` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg01_city_03_foreground_industrial_pipes` | `cine_bg01_city_03_foreground_industrial_pipes` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg02_club_exterior` | `cine_bg02_club_exterior` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg02_club_exterior_01_gothic_cathedral_facade` | `cine_bg02_club_exterior_01_gothic_cathedral_facade` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg02_club_exterior_02_portal_speakers_entrance` | `cine_bg02_club_exterior_02_portal_speakers_entrance` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg02_club_exterior_03_wet_pavement_reflections` | `cine_bg02_club_exterior_03_wet_pavement_reflections` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg03_entrance` | `cine_bg03_entrance` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg03_entrance_01_vaulted_hallway_depth` | `cine_bg03_entrance_01_vaulted_hallway_depth` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg03_entrance_02_midground_columns_banners` | `cine_bg03_entrance_02_midground_columns_banners` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg03_entrance_03_foreground_pillars_occlusion` | `cine_bg03_entrance_03_foreground_pillars_occlusion` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg04_main_hall` | `cine_bg04_main_hall` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg04_main_hall_01_cathedral_nave_vaults` | `cine_bg04_main_hall_01_cathedral_nave_vaults` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg04_main_hall_02_laser_beams_equalizer` | `cine_bg04_main_hall_02_laser_beams_equalizer` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg04_main_hall_03_chandeliers_stage_framing` | `cine_bg04_main_hall_03_chandeliers_stage_framing` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg05_dancefloor` | `cine_bg05_dancefloor` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg05_dancefloor_01_astrological_dancefloor_grid` | `cine_bg05_dancefloor_01_astrological_dancefloor_grid` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg05_dancefloor_02_sound_towers_dj_stage` | `cine_bg05_dancefloor_02_sound_towers_dj_stage` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg05_dancefloor_03_tables_foreground_ambient` | `cine_bg05_dancefloor_03_tables_foreground_ambient` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg06_hero` | `cine_bg06_hero` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg06_hero_01_axial_portal_rosette` | `cine_bg06_hero_01_axial_portal_rosette` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg06_hero_02_hero_rimlight_spotlight` | `cine_bg06_hero_02_hero_rimlight_spotlight` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_bg06_hero_03_flanking_speakers_framing` | `cine_bg06_hero_03_flanking_speakers_framing` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_circle_00_hub` | `cine_circle_00_hub` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_circle_01_lujuria` | `cine_circle_01_lujuria` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_circle_02_gula` | `cine_circle_02_gula` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_circle_03_avaricia` | `cine_circle_03_avaricia` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_circle_04_ira` | `cine_circle_04_ira` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_circle_05_herejia` | `cine_circle_05_herejia` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_circle_06_violencia` | `cine_circle_06_violencia` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_circle_07_fraude` | `cine_circle_07_fraude` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_circle_08_traicion` | `cine_circle_08_traicion` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_circle_09_nucleo` | `cine_circle_09_nucleo` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |
| `cine_intro_club_panorama` | `cine_intro_club_panorama` regenerado (clase B, mismo ID/origen) | registry → DD_WORLD/DD_UI | Pendiente |

### Apéndice C — recursos NUEVOS a producir (clase C, sin ID previo)

| Nuevo ID propuesto | Contenido | Sistema | Estado |
|---|---|---|---|
| `hub_floor_main` | Suelo damero del HUB (negro/granate/magenta) — **entregado TR_T01** (integración en código; visibilidad pendiente de navegador) | DD_HUB / room cache limbo | Integrado (código) |
| `hub_portal_frame` | Arco obsidiana compartido por los 9 accesos (glow por círculo vía motor) — **entregado TR_T01** como mezzanine decorativo | DD_HUB (mezzanine) | Integrado (código) |
| `hub_dj_tower` · `hub_stair_balcony_*` · `hub_bar_infernal` · `hub_arcade_row` · `hub_machines_room` · `hub_archives` · `hub_gallery_frames` · `hub_secret_*` | Kit arquitectónico/mobiliario del HUB (torres de altavoces, balcones, bar, recreativas, archivo, galería, pasadizos secretos) | DD_HUB | Pendiente |
| `light_haze_{circle}` ×10 | Haz/niebla volumétrico emisor por círculo (sutil, ≤15 % superficie) | DD_WORLD room cache | Pendiente |
| `prop_{circle}_signature_*` | 2 props firma por círculo (espejos vanidad, ganchos carne, bóveda caja fuerte, chatarra Ira, confesionario, tanque tóxico, tragamonedas, cadenas hielo, monolito Núcleo…) | DD_WORLD props | Pendiente |
| `fx_boss_phase_{1,2,3}_a` | Auras de fase para jefes (guía §03 «Fases de jefe») | DD_WORLD VFX | Pendiente |
| `ui_hud_heart_*` · `ui_retrato_maestro` · `ui_menu_icon_*` | HUD/iconos definitivos | DD_UI / CSS | Pendiente |
| `enemy_*_elite_*` | Variantes élite/especiales de la guía §02 (corrupto, blindado, ígneo, eléctrico, tóxico, neón) | registry / DD_WORLD | Pendiente (según motor exponga variantes) |

### Apéndice D — material histórico (clase E, NO tocar)

`DEADBEAT_DISCO.ART.html`, `v9_t3_fase1b_cache_probe.html`, `ART_PACK/`, `ART_ASSETS/**`, `ART_EVIDENCE/**`, `ART_AUDIT/**`, `backups/**`, `docs/ART_REBUILD/**`, `assets/fase01/**`, `assets/references/**`, `assets/characters/protagonist_master/**` (hasta aprobación).
