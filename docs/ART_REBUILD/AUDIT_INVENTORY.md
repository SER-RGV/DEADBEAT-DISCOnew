# Inventario de arte clasificado A–E

> Generado por `tools/art_master/audit_report.py render` a partir de `AUDIT_CLASSIFICATION.json` (2026-11-12T03:21:49Z). No editar a mano.

| Clase | Significado |
|---|---|
| **A** | Conservar: ilustración al nivel objetivo, sin defectos visibles. |
| **B** | Rehacer por estilo: funciona, pero es pixel art / paleta reducida o no sigue las guías de referencia. |
| **C** | Falta: no existe arte de la línea nueva; el juego muestra el sprite heredado del motor. |
| **D** | Defectuoso: defecto visible en el archivo (damero horneado, huecos, fotograma basura, identidad distinta, halo). |
| **E** | Rehecho: sustituido en esta reconstrucción y validado dentro del juego. |

## Resumen por familia

| Familia | Total | A | B | C | D | E |
|---|---:|---:|---:|---:|---:|---:|
| `characters` | 31 | 0 | 3 | 0 | 1 | 27 |
| `enemies` | 24 | 0 | 0 | 0 | 0 | 24 |
| `bosses` | 42 | 0 | 32 | 0 | 10 | 0 |
| `weapons` | 121 | 0 | 16 | 105 | 0 | 0 |
| `pickups` | 20 | 0 | 20 | 0 | 0 | 0 |
| `effects` | 22 | 2 | 20 | 0 | 0 | 0 |
| `props` | 30 | 0 | 30 | 0 | 0 | 0 |
| `floors` | 12 | 12 | 0 | 0 | 0 | 0 |
| `walls` | 10 | 0 | 9 | 0 | 1 | 0 |
| `environments` | 8 | 0 | 5 | 0 | 3 | 0 |
| `ui` | 15 | 7 | 7 | 0 | 1 | 0 |
| `logos` | 3 | 3 | 0 | 0 | 0 | 0 |
| `cinematics` | 35 | 0 | 11 | 0 | 24 | 0 |
| `overlays` | 1 | 1 | 0 | 0 | 0 | 0 |
| **Total** | **374** | **25** | **153** | **105** | **40** | **51** |

## `characters` (31)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `npc_dj_booth_world` | **D** | no coincide con el retrato dialogue_portrait_dj (otro personaje) | `R04_PNJ_Y_HUD` |
| `companion_drone_ally` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R04_PNJ_Y_HUD` |
| `npc_armorer_hub` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R04_PNJ_Y_HUD` |
| `npc_bartender_hub` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R04_PNJ_Y_HUD` |
| `hero_idle_00` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `hero_shoot_00` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `hero_walk_00` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `hero_walk_01` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `hero_walk_02` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `hero_walk_03` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_aim_down_01` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_aim_down_02` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_aim_down_02_arms` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_aim_down_03` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_aim_down_03_arms` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_aim_up_01` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_aim_up_02` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_aim_up_03` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_boost_00` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_death_00` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_fire2` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_firehip` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_firehip_arms` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_hurt_00` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_idle_00` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_roll_00` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_shoot_00` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_walk_00` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_walk_01` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_walk_02` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |
| `player_walk_03` | **E** | rehecho en la tanda R01_PROTAGONISTA y validado dentro del juego | `R01_PROTAGONISTA` |

## `enemies` (24)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `enemy_chef_attack` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_chef_death` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_chef_walk` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_chef_windup` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_dancer_attack` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_dancer_death` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_dancer_walk` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_dancer_windup` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_drone_attack` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_drone_death` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_drone_walk` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_drone_windup` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_elite_attack` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_elite_death` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_elite_walk` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_elite_windup` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_fanatic_attack` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_fanatic_death` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_fanatic_walk` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_fanatic_windup` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_security_attack` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_security_death` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_security_walk` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |
| `enemy_security_windup` | **E** | rehecho en la tanda R02_ENEMIGOS y validado dentro del juego | `R02_ENEMIGOS` |

## `bosses` (42)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `boss_02_bufe_hit` | **D** | identidad distinta de la del resto de fotogramas de su familia | `R03_JEFES` |
| `boss_03_cajero_attack` | **D** | fotograma basura: no representa al personaje de su familia | `R03_JEFES` |
| `boss_03_cajero_hit` | **D** | fotograma basura: no representa al personaje de su familia | `R03_JEFES` |
| `boss_04_pogo_attack` | **D** | damero de transparencia o huecos blancos horneados en la imagen | `R03_JEFES` |
| `boss_04_pogo_idle` | **D** | fotograma basura: no representa al personaje de su familia | `R03_JEFES` |
| `boss_05_oficiante_hit` | **D** | fotograma basura: no representa al personaje de su familia | `R03_JEFES` |
| `boss_06_matarife_attack` | **D** | damero de transparencia o huecos blancos horneados en la imagen | `R03_JEFES` |
| `boss_08_traidor_idle` | **D** | fotograma basura: no representa al personaje de su familia | `R03_JEFES` |
| `boss_09_nucleo_attack` | **D** | damero de transparencia o huecos blancos horneados en la imagen | `R03_JEFES` |
| `boss_09_nucleo_hit` | **D** | fotograma basura: no representa al personaje de su familia | `R03_JEFES` |
| `boss_00_anden_attack` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_00_anden_death` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_00_anden_hit` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_00_anden_idle` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_01_magneta_attack` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_01_magneta_death` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_01_magneta_hit` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_01_magneta_idle` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_02_bufe_attack` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_02_bufe_death` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_02_bufe_idle` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_03_cajero_death` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_03_cajero_idle` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_04_pogo_death` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_04_pogo_hit` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_05_oficiante_attack` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_05_oficiante_death` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_05_oficiante_idle` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_06_matarife_death` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_06_matarife_hit` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_06_matarife_idle` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_07_imitador_attack` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_07_imitador_death` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_07_imitador_hit` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_07_imitador_idle` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_08_traidor_attack` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_08_traidor_death` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_08_traidor_hit` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_09_nucleo_death` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_09_nucleo_idle` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_10_arquitecto_attack` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |
| `boss_10_arquitecto_idle` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R03_JEFES` |

## `weapons` (121)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `weapon_c003_laser` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_c005_needler` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_c007_magnum` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_c008_silenciada` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_c009_desert_eagle` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_c010_explosiva` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_c011_de_veneno` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_c012_de_hielo` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_c013_escopeta` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_c015_escopeta_automatica` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_m1911` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_magnum` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_olympia` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_plasma` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_ricochet` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |
| `weapon_uzi` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R05_ARMAS` |

**Clase C — 105 sin arte nuevo** (tanda `R05_ARMAS`): `weapon_c016_de_canon`, `weapon_c017_de_fuego`, `weapon_cryo`, `weapon_c019_electrica`, `weapon_spas12`, `weapon_c021_doble`, `weapon_c022_de_gancho`, `weapon_c023_flechetes`, `weapon_c024_incendiaria`, `weapon_thompson`, `weapon_ak47`, `weapon_m16`, `weapon_c028_famas`, `weapon_c029_scar`, `weapon_c030_g36`, `weapon_c031_aug`, `weapon_mp40`, `weapon_c033_pulsos`, `weapon_c034_laser`, `weapon_winchester`, `weapon_c036_bullpup`, `weapon_m60`, `weapon_c038_minigun`, `weapon_c039_lmg_neon`, `weapon_c040_pesado`, `weapon_c041_lanzacohetes`, `weapon_c042_lanzagranadas`, `weapon_railgun`, `weapon_c044_bfg`, `weapon_c045_mortero`, `weapon_c046_rotatorio`, `weapon_flamer`, `weapon_c048_artilleria`, `weapon_c049_plasma_cutter`, `weapon_c050_rayo_continuo`, `weapon_c051_rayo_tesla`, `weapon_c052_canon_plasma`, `weapon_c053_particulas`, `weapon_c054_haz_de_energia`, `weapon_c055_rayo_cadenas`, `weapon_c056_orbe_energia`, `weapon_trident`, `weapon_c058_canon_sonico`, `weapon_c059_pistola_toxica`, `weapon_c060_lanza_acido`, `weapon_c061_fuego`, `weapon_c062_hielo`, `weapon_c063_electrica`, `weapon_c064_veneno`, `weapon_c065_nube_toxica`, `weapon_c066_meteoritos`, `weapon_c067_congelacios`, `weapon_c068_relampagos`, `weapon_c069_tormenta`, `weapon_c070_arena`, `weapon_c071_gravedad`, `weapon_c072_vacio`, `weapon_c073_gravity_gun`, `weapon_c074_portal_gun`, `weapon_c075_dron`, `weapon_c076_torreta`, `weapon_c077_satelites`, `weapon_c078_mina`, `weapon_c079_trampa_laser`, `weapon_c080_ancla`, `weapon_c081_teletransportador`, `weapon_c082_generador_de_paredes`, `weapon_c083_clonador`, `weapon_c084_orbes_orbitales`, `weapon_c085_espada_laser`, `weapon_c086_katana`, `weapon_c087_hacha`, `weapon_c088_martillo`, `weapon_c089_guadana`, `weapon_c090_manoplas`, `weapon_c091_bate`, `weapon_c092_sierra_circular`, `weapon_c093_cadena`, `weapon_c094_lanza`, `weapon_c095_cuchillo`, `weapon_c096_alabarda`, `weapon_raygun`, `weapon_c098_thundergun`, `weapon_c099_wunderwaffe`, `weapon_c100_winter_u2019s_howl`, `weapon_c101_wave_gun`, `weapon_c102_baston_de_fuego`, `weapon_c103_baston_de_hielo`, `weapon_c104_baston_de_rayo`, `weapon_c105_baston_de_viento`, `weapon_c106_arco_ancestral`, `weapon_c107_arco_del_lobo`, `weapon_c108_arco_de_fuego`, `weapon_c109_arco_del_vacio`, `weapon_c110_arco_de_tormenta`, `weapon_c111_devoracaos`, `weapon_c112_harvester`, `weapon_c113_espada_de_energia`, `weapon_c114_espada_caos`, `weapon_c115_lanza_espectral`, `weapon_c116_orbe_del_abismo`, `weapon_c117_bomba_flotante`, `weapon_c118_summon_infernal`, `weapon_c119_dragon_espiritual`, `weapon_c120_director`

## `pickups` (20)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `pickup_ammo_00` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `pickup_bomb_00` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `pickup_boost_00` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `pickup_companion_00` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `pickup_credits_00` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `pickup_damageup_00` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `pickup_fireup_00` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `pickup_heart_00` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `pickup_mutation_00` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `pickup_shield_00` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `pickup_speedup_00` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `pickup_turret_00` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `relic_coil` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `relic_echo` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `relic_lowpass` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `relic_magnet` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `relic_needle` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `relic_pact` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `relic_prism` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |
| `relic_tempo` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R06_RECOGIBLES` |

## `effects` (22)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `proj_cryo` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `proj_flame` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `proj_heavy` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `proj_homing` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `proj_lane` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `proj_pellet` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `proj_plasma` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `proj_rail` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `proj_ricochet` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `proj_slug` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `vfx_explosion_inferno` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `vfx_fire_plume` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `vfx_impact_plasma` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `vfx_impact_spark` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `vfx_lightning_purple` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `vfx_muzzle_gold` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `vfx_muzzle_plasma` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `vfx_shockwave_magenta` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `vfx_smoke_cloud` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `vfx_soul_flame` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R07_EFECTOS` |
| `effect_anamorphic_flare` | **A** | ilustración sin defectos visibles | — |
| `effect_dust_particles` | **A** | ilustración sin defectos visibles | — |

## `props` (30)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `prop_arcade_cabinet` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_arcane_pedestal` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_armchair_vip` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_banquet_table` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_bar_bottles` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_bar_counter` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_barrel_infernal` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_bench_neon` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_bollard_pair` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_bookshelf_hub` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_candelabra_floor` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_chandelier_gold` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_chest_closed` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_chest_open` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_cooler_neon` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_crate_club` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_dj_booth` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_gilded_altar` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_gothic_statue` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_hub_fox_neon` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_mirror_baroque` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_neon_flower` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_neon_palm` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_potted_plant` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_sigil_poster` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_sofa_black` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_sofa_magenta` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_speaker_tower` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_subwoofer_cyan` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |
| `prop_vending_machine` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R08_MOBILIARIO` |

## `floors` (12)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `floor_00_limbo_marble` | **A** | ilustración sin defectos visibles | — |
| `floor_01_lust_dancefloor` | **A** | ilustración sin defectos visibles | — |
| `floor_02_gula_terracotta` | **A** | ilustración sin defectos visibles | — |
| `floor_03_greed_slate_gold` | **A** | ilustración sin defectos visibles | — |
| `floor_04_wrath_burgundy` | **A** | ilustración sin defectos visibles | — |
| `floor_05_pride_obsidian_gold` | **A** | ilustración sin defectos visibles | — |
| `floor_06_violence_ash_slabs` | **A** | ilustración sin defectos visibles | — |
| `floor_07_envy_travertine` | **A** | ilustración sin defectos visibles | — |
| `floor_08_ice_abyssal` | **A** | ilustración sin defectos visibles | — |
| `floor_09_core_cosmic_vein` | **A** | ilustración sin defectos visibles | — |
| `floor_10_hub_checker` | **A** | ilustración sin defectos visibles | — |
| `floor_11_vip_velvet` | **A** | ilustración sin defectos visibles | — |

## `walls` (10)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `wall_panel_gothic_niche` | **D** | damero de transparencia o huecos blancos horneados en la imagen | `R09_ARQUITECTURA` |
| `wall_core_monolith` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |
| `wall_gula_banquet` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |
| `wall_ice_glacier` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |
| `wall_panel_heavy_base` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |
| `wall_panel_neon_crown` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |
| `wall_panel_tall_neon` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |
| `wall_panel_vip_window` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |
| `wall_pillar_obsidian` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |
| `wall_wrath_furnace` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |

## `environments` (8)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `door_gothic_closed` | **D** | damero de transparencia o huecos blancos horneados en la imagen | `R09_ARQUITECTURA` |
| `door_gothic_open` | **D** | damero de transparencia o huecos blancos horneados en la imagen | `R09_ARQUITECTURA` |
| `portal_avaricia_gold` | **D** | halo / flecos claros alrededor de la silueta | `R09_ARQUITECTURA` |
| `door_arched_open` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |
| `door_stained_closed` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |
| `door_vip_crimson` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |
| `portal_baroque_gold` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |
| `threshold_descent_pad` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R09_ARQUITECTURA` |

## `ui` (15)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `ui_victory_emblem` | **D** | halo / flecos claros alrededor de la silueta | `R04_PNJ_Y_HUD` |
| `hud_credit_coin` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R04_PNJ_Y_HUD` |
| `hud_heart_empty` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R04_PNJ_Y_HUD` |
| `hud_heart_full` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R04_PNJ_Y_HUD` |
| `hud_shield_badge` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R04_PNJ_Y_HUD` |
| `hud_skill_bomb` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R04_PNJ_Y_HUD` |
| `hud_skill_boost` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R04_PNJ_Y_HUD` |
| `hud_skill_dodge` | **B** | pixel art de paleta reducida; no sigue el acabado de ilustración de las guías | `R04_PNJ_Y_HUD` |
| `dialogue_portrait_dj` | **A** | ilustración sin defectos visibles | — |
| `hud_portrait_protagonist` | **A** | ilustración sin defectos visibles | — |
| `map_infernal_tower` | **A** | ilustración sin defectos visibles | — |
| `menu_main_backdrop` | **A** | ilustración sin defectos visibles | — |
| `menu_main_backdrop_a` | **A** | ilustración sin defectos visibles | — |
| `ui_defeat_emblem` | **A** | ilustración sin defectos visibles | — |
| `ui_shop_emblem` | **A** | ilustración sin defectos visibles | — |

## `logos` (3)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `emblem_fox_crown` | **A** | ilustración sin defectos visibles | — |
| `logo_deadbeat_cinematic` | **A** | ilustración sin defectos visibles | — |
| `logo_deadbeat_graffiti` | **A** | ilustración sin defectos visibles | — |

## `cinematics` (35)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `cine_bg01_city` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg01_city_01_sky_moon_atmosphere` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg01_city_02_gothic_skyline_architecture` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg01_city_03_foreground_industrial_pipes` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg02_club_exterior` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg02_club_exterior_01_gothic_cathedral_facade` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg02_club_exterior_02_portal_speakers_entrance` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg02_club_exterior_03_wet_pavement_reflections` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg03_entrance` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg03_entrance_01_vaulted_hallway_depth` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg03_entrance_02_midground_columns_banners` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg03_entrance_03_foreground_pillars_occlusion` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg04_main_hall` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg04_main_hall_01_cathedral_nave_vaults` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg04_main_hall_02_laser_beams_equalizer` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg04_main_hall_03_chandeliers_stage_framing` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg05_dancefloor` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg05_dancefloor_01_astrological_dancefloor_grid` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg05_dancefloor_02_sound_towers_dj_stage` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg05_dancefloor_03_tables_foreground_ambient` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg06_hero` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg06_hero_01_axial_portal_rosette` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg06_hero_02_hero_rimlight_spotlight` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_bg06_hero_03_flanking_speakers_framing` | **D** | lámina con muestras de paleta, marco y restos de texto horneados en el borde superior; las capas 02/03 son cuadros 100 % opacos | `R10_CINEMATICA` |
| `cine_circle_00_hub` | **B** | tarjeta de 960×540 (1280×720 la de entrada) con acabado pixelado; se amplía a pantalla completa | `R10_CINEMATICA` |
| `cine_circle_01_lujuria` | **B** | tarjeta de 960×540 (1280×720 la de entrada) con acabado pixelado; se amplía a pantalla completa | `R10_CINEMATICA` |
| `cine_circle_02_gula` | **B** | tarjeta de 960×540 (1280×720 la de entrada) con acabado pixelado; se amplía a pantalla completa | `R10_CINEMATICA` |
| `cine_circle_03_avaricia` | **B** | tarjeta de 960×540 (1280×720 la de entrada) con acabado pixelado; se amplía a pantalla completa | `R10_CINEMATICA` |
| `cine_circle_04_ira` | **B** | tarjeta de 960×540 (1280×720 la de entrada) con acabado pixelado; se amplía a pantalla completa | `R10_CINEMATICA` |
| `cine_circle_05_herejia` | **B** | tarjeta de 960×540 (1280×720 la de entrada) con acabado pixelado; se amplía a pantalla completa | `R10_CINEMATICA` |
| `cine_circle_06_violencia` | **B** | tarjeta de 960×540 (1280×720 la de entrada) con acabado pixelado; se amplía a pantalla completa | `R10_CINEMATICA` |
| `cine_circle_07_fraude` | **B** | tarjeta de 960×540 (1280×720 la de entrada) con acabado pixelado; se amplía a pantalla completa | `R10_CINEMATICA` |
| `cine_circle_08_traicion` | **B** | tarjeta de 960×540 (1280×720 la de entrada) con acabado pixelado; se amplía a pantalla completa | `R10_CINEMATICA` |
| `cine_circle_09_nucleo` | **B** | tarjeta de 960×540 (1280×720 la de entrada) con acabado pixelado; se amplía a pantalla completa | `R10_CINEMATICA` |
| `cine_intro_club_panorama` | **B** | tarjeta de 960×540 (1280×720 la de entrada) con acabado pixelado; se amplía a pantalla completa | `R10_CINEMATICA` |

## `overlays` (1)

| ID | Clase | Motivo | Tanda |
|---|:---:|---|---|
| `overlay_vignette_gothic` | **A** | ilustración sin defectos visibles | — |

