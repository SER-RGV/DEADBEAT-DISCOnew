# FASE 0 · Inventario maestro de assets

**Generado:** 2026-11-26 · **Rama:** `arena/09513f9b-deadbeat-disconew`

## 0. Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Ficheros en `assets/` | **942** |
| Entradas en `assets/manifest.json` | **277** registradas / **349** planificadas |
| Ficheros vigentes (en manifest + código) | **279** |
| Registrados sin referencia en código | **0** |
| Planificados sin archivo (huecos) | **105** |
| Archivos sin registro | **362** |
| Grupos de duplicados (hash idéntico) | **9** |
| Fuentes (woff2) | **4** |
| Material de referencia | **16** |
| Legado fase01 | **16** |
| Prefabs legacy | **37** |

## 1. Cobertura por categoría

| Categoría | Ficheros en disco | Vigentes (manifest+código) | Otros estados |
|---|---|---|---|
| `bosses` | 42 | 42 | 0 |
| `enemies` | 24 | 24 | 0 |
| `characters` | 448 | 25 | 423 |
| `ui` | 27 | 17 | 10 |
| `floors` | 13 | 13 | 0 |
| `walls` | 10 | 10 | 0 |
| `environments` | 9 | 9 | 0 |
| `cinematics` | 201 | 45 | 156 |
| `props` | 34 | 34 | 0 |
| `weapons` | 16 | 16 | 0 |
| `pickups` | 20 | 20 | 0 |
| `effects` | 20 | 20 | 0 |
| `logos` | 2 | 2 | 0 |
| `prefabs` | 37 | 0 | 37 |
| `fonts` | 4 | 2 | 2 |
| `fase01` | 16 | 0 | 16 |
| `references` | 16 | 0 | 16 |
| `(planned)` | 105 | 0 | 105 |
| `README.md` | 1 | 0 | 1 |
| `manifest.json` | 1 | 0 | 1 |
| `prompts.json` | 1 | 0 | 1 |

## 2. Distribución de estados

| Estado | Nº de ficheros |
|---|---|
| `producido-no-integrado` | 348 |
| `vigente` | 279 |
| `planificado-no-implementado` | 105 |
| `material-historico` | 75 |
| `frame-loop` | 48 |
| `material-produccion` | 39 |
| `sin-usar-build-activo` | 37 |
| `capa-alternativa` | 27 |
| `version-anterior` | 24 |
| `obsoleto-legacy` | 16 |
| `referencia` | 16 |
| `sin-registro` | 14 |
| `thumbnail-card` | 6 |
| `archivo-maestro` | 6 |
| `metadata` | 4 |
| `desconocido` | 3 |

## 3. Huecos: planificados sin materializar

Hay **105** entradas que aparecen en el manifest o en MASTER_INVENTORY pero cuyo archivo no existe o no está implementado:

| ID / nombre | Categoría | Detalle |
|---|---|---|
| `weapon_ak47` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c016_de_canon` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c017_de_fuego` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c019_electrica` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c021_doble` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c022_de_gancho` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c023_flechetes` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c024_incendiaria` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c028_famas` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c029_scar` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c030_g36` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c031_aug` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c033_pulsos` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c034_laser` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c036_bullpup` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c038_minigun` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c039_lmg_neon` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c040_pesado` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c041_lanzacohetes` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c042_lanzagranadas` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c044_bfg` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c045_mortero` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c046_rotatorio` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c048_artilleria` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c049_plasma_cutter` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c050_rayo_continuo` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c051_rayo_tesla` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c052_canon_plasma` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c053_particulas` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c054_haz_de_energia` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c055_rayo_cadenas` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c056_orbe_energia` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c058_canon_sonico` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c059_pistola_toxica` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c060_lanza_acido` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c061_fuego` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c062_hielo` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c063_electrica` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c064_veneno` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c065_nube_toxica` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c066_meteoritos` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c067_congelacios` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c068_relampagos` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c069_tormenta` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c070_arena` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c071_gravedad` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c072_vacio` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c073_gravity_gun` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c074_portal_gun` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| `weapon_c075_dron` | (planned) | ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest |
| … | … | +55 más (ver CSV) |

## 4. Archivos sin registro en manifest

Hay **362** ficheros en `assets/` que no están dados de alta en el manifest activo (pueden ser material de producción, atuendos sin integrar, capas de cinemática sin alta, o duplicados):

| Ruta | Tamaño KB | Dimensiones | Estado | Uso |
|---|---|---|---|---|
| `assets/characters/outfits/apocalypse/aim.png` | 159.1 | 352×512 | producido-no-integrado | atuendo outfits/apocalypse — no integrado en build activo |
| `assets/characters/outfits/apocalypse/death.png` | 209.2 | 640×320 | producido-no-integrado | atuendo outfits/apocalypse — no integrado en build activo |
| `assets/characters/outfits/apocalypse/hurt.png` | 170.5 | 352×512 | producido-no-integrado | atuendo outfits/apocalypse — no integrado en build activo |
| `assets/characters/outfits/apocalypse/idle.png` | 164.2 | 288×512 | producido-no-integrado | atuendo outfits/apocalypse — no integrado en build activo |
| `assets/characters/outfits/apocalypse/roll.png` | 146.8 | 384×384 | producido-no-integrado | atuendo outfits/apocalypse — no integrado en build activo |
| `assets/characters/outfits/apocalypse/showcase.png` | 577.2 | 600×1075 | producido-no-integrado | atuendo outfits/apocalypse — no integrado en build activo |
| `assets/characters/outfits/apocalypse/walk_a.png` | 160.1 | 288×512 | producido-no-integrado | atuendo outfits/apocalypse — no integrado en build activo |
| `assets/characters/outfits/asesino/aim.png` | 137.6 | 288×512 | producido-no-integrado | atuendo outfits/asesino — no integrado en build activo |
| `assets/characters/outfits/asesino/death.png` | 239.0 | 640×320 | producido-no-integrado | atuendo outfits/asesino — no integrado en build activo |
| `assets/characters/outfits/asesino/hurt.png` | 162.9 | 288×512 | producido-no-integrado | atuendo outfits/asesino — no integrado en build activo |
| `assets/characters/outfits/asesino/idle.png` | 140.1 | 288×512 | producido-no-integrado | atuendo outfits/asesino — no integrado en build activo |
| `assets/characters/outfits/asesino/roll.png` | 226.4 | 384×384 | producido-no-integrado | atuendo outfits/asesino — no integrado en build activo |
| `assets/characters/outfits/asesino/showcase.png` | 803.2 | 600×894 | producido-no-integrado | atuendo outfits/asesino — no integrado en build activo |
| `assets/characters/outfits/asesino/walk_a.png` | 149.8 | 288×512 | producido-no-integrado | atuendo outfits/asesino — no integrado en build activo |
| `assets/characters/outfits/aventurero/aim.png` | 120.7 | 288×512 | producido-no-integrado | atuendo outfits/aventurero — no integrado en build activo |
| `assets/characters/outfits/aventurero/death.png` | 187.6 | 640×320 | producido-no-integrado | atuendo outfits/aventurero — no integrado en build activo |
| `assets/characters/outfits/aventurero/hurt.png` | 122.1 | 288×512 | producido-no-integrado | atuendo outfits/aventurero — no integrado en build activo |
| `assets/characters/outfits/aventurero/idle.png` | 100.3 | 288×512 | producido-no-integrado | atuendo outfits/aventurero — no integrado en build activo |
| `assets/characters/outfits/aventurero/roll.png` | 190.4 | 384×384 | producido-no-integrado | atuendo outfits/aventurero — no integrado en build activo |
| `assets/characters/outfits/aventurero/showcase.png` | 899.2 | 600×1075 | producido-no-integrado | atuendo outfits/aventurero — no integrado en build activo |
| `assets/characters/outfits/aventurero/walk_a.png` | 130.6 | 288×512 | producido-no-integrado | atuendo outfits/aventurero — no integrado en build activo |
| `assets/characters/outfits/buzo/aim.png` | 129.6 | 288×512 | producido-no-integrado | atuendo outfits/buzo — no integrado en build activo |
| `assets/characters/outfits/buzo/death.png` | 233.7 | 640×320 | producido-no-integrado | atuendo outfits/buzo — no integrado en build activo |
| `assets/characters/outfits/buzo/hurt.png` | 154.7 | 288×512 | producido-no-integrado | atuendo outfits/buzo — no integrado en build activo |
| `assets/characters/outfits/buzo/idle.png` | 116.1 | 288×512 | producido-no-integrado | atuendo outfits/buzo — no integrado en build activo |
| `assets/characters/outfits/buzo/roll.png` | 139.7 | 384×384 | producido-no-integrado | atuendo outfits/buzo — no integrado en build activo |
| `assets/characters/outfits/buzo/showcase.png` | 782.6 | 600×894 | producido-no-integrado | atuendo outfits/buzo — no integrado en build activo |
| `assets/characters/outfits/buzo/walk_a.png` | 137.2 | 288×512 | producido-no-integrado | atuendo outfits/buzo — no integrado en build activo |
| `assets/characters/outfits/caballero/aim.png` | 140.3 | 288×512 | producido-no-integrado | atuendo outfits/caballero — no integrado en build activo |
| `assets/characters/outfits/caballero/death.png` | 214.2 | 640×320 | producido-no-integrado | atuendo outfits/caballero — no integrado en build activo |
| `assets/characters/outfits/caballero/hurt.png` | 150.0 | 288×512 | producido-no-integrado | atuendo outfits/caballero — no integrado en build activo |
| `assets/characters/outfits/caballero/idle.png` | 118.6 | 288×512 | producido-no-integrado | atuendo outfits/caballero — no integrado en build activo |
| `assets/characters/outfits/caballero/roll.png` | 238.4 | 384×384 | producido-no-integrado | atuendo outfits/caballero — no integrado en build activo |
| `assets/characters/outfits/caballero/showcase.png` | 1023.8 | 600×1075 | producido-no-integrado | atuendo outfits/caballero — no integrado en build activo |
| `assets/characters/outfits/caballero/walk_a.png` | 151.7 | 288×512 | producido-no-integrado | atuendo outfits/caballero — no integrado en build activo |
| `assets/characters/outfits/caballero/walk_b.png` | 147.0 | 288×512 | producido-no-integrado | atuendo outfits/caballero — no integrado en build activo |
| `assets/characters/outfits/cocinero/aim.png` | 96.4 | 288×512 | producido-no-integrado | atuendo outfits/cocinero — no integrado en build activo |
| `assets/characters/outfits/cocinero/death.png` | 175.5 | 640×320 | producido-no-integrado | atuendo outfits/cocinero — no integrado en build activo |
| `assets/characters/outfits/cocinero/hurt.png` | 113.9 | 288×512 | producido-no-integrado | atuendo outfits/cocinero — no integrado en build activo |
| `assets/characters/outfits/cocinero/idle.png` | 87.0 | 288×512 | producido-no-integrado | atuendo outfits/cocinero — no integrado en build activo |
| `assets/characters/outfits/cocinero/roll.png` | 178.2 | 384×384 | producido-no-integrado | atuendo outfits/cocinero — no integrado en build activo |
| `assets/characters/outfits/cocinero/showcase.png` | 851.5 | 600×1075 | producido-no-integrado | atuendo outfits/cocinero — no integrado en build activo |
| `assets/characters/outfits/cocinero/walk_a.png` | 104.6 | 288×512 | producido-no-integrado | atuendo outfits/cocinero — no integrado en build activo |
| `assets/characters/outfits/concepts/asesino_apuntar.webp` | 443.9 | 848×1264 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/asesino_base.webp` | 835.0 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/asesino_caida.webp` | 844.3 | 1376×768 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/asesino_esquiva.webp` | 866.8 | 1024×1024 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/asesino_herido.webp` | 596.7 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/asesino_idle.webp` | 933.3 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/asesino_paso.webp` | 517.0 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/aventurero_apuntar.webp` | 806.5 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/aventurero_azul.webp` | 755.1 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/aventurero_caida.webp` | 803.7 | 1440×720 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/aventurero_capucha_aim.webp` | 794.4 | 848×1264 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/aventurero_capucha_death.webp` | 815.2 | 1376×768 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/aventurero_capucha_hurt.webp` | 831.5 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/aventurero_capucha_idle.webp` | 738.6 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/aventurero_capucha_roll.webp` | 825.4 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/aventurero_capucha_walk.webp` | 446.4 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/aventurero_esquiva2.webp` | 835.4 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/aventurero_herido.webp` | 868.3 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/aventurero_paso.webp` | 700.3 | 1376×768 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_apuntar.webp` | 908.5 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_base.webp` | 880.3 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_caida.webp` | 737.9 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_casco_apuntar3.webp` | 895.3 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_casco_apuntar_final.webp` | 786.8 | 896×1200 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_casco_base.webp` | 420.4 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_casco_caida.webp` | 1006.9 | 1376×768 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_casco_esquiva.webp` | 886.5 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_casco_herido2.webp` | 499.2 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_casco_paso.webp` | 486.3 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_esquiva.webp` | 941.4 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_herido.webp` | 910.0 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/buzo_paso.webp` | 913.1 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/caballero_apuntar.webp` | 819.2 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/caballero_caida.webp` | 838.3 | 1440×720 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/caballero_esquiva.webp` | 852.2 | 1375×768 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/caballero_herido.webp` | 850.4 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| `assets/characters/outfits/concepts/caballero_oscuro.png` | 1046.9 | 768×1365 | producido-no-integrado | atuendo outfits/concepts — no integrado en build activo |
| … | … | … | … | +282 más (ver CSV) |

## 5. Duplicados (mismo hash SHA-256 en rutas distintas)

Se detectaron **9** grupos de contenido duplicado. Los más destacados:

| SHA16 | Nº copias | Rutas |
|---|---|---|
| `ccfcb2ffec1726ed` | 2 | `assets/characters/outfits/caballero/walk_b.png` · `assets/characters/outfits/caballero_drafts/walk_b.png` |
| `2a40347e18ff2f09` | 2 | `assets/cinematics/backgrounds/ESCENARIOS_DEFINITIVOS_COMPARATIVA.png` · `assets/cinematics/backgrounds/final/ESCENARIOS_DEFINITIVOS_COMPARATIVA.png` |
| `e61aea6e7776dabf` | 2 | `assets/cinematics/backgrounds/final/cine_bg01_city/02_gothic_skyline_architecture.png` · `assets/cinematics/backgrounds/final/cine_bg01_city/03_foreground_industrial_pipes.png` |
| `5d52c858c0315315` | 2 | `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/02_portal_speakers_entrance.png` · `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/03_wet_pavement_reflections.png` |
| `d8301a8268fdf453` | 2 | `assets/cinematics/backgrounds/final/cine_bg03_entrance/02_midground_columns_banners.png` · `assets/cinematics/backgrounds/final/cine_bg03_entrance/03_foreground_pillars_occlusion.png` |
| `35a4727710520c1f` | 2 | `assets/cinematics/backgrounds/final/cine_bg04_main_hall/02_laser_beams_equalizer.png` · `assets/cinematics/backgrounds/final/cine_bg04_main_hall/03_chandeliers_stage_framing.png` |
| `f11d493de83b27eb` | 2 | `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/02_sound_towers_dj_stage.png` · `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/03_tables_foreground_ambient.png` |
| `ba0a5e677583158e` | 2 | `assets/cinematics/backgrounds/final/cine_bg06_hero/02_hero_rimlight_spotlight.png` · `assets/cinematics/backgrounds/final/cine_bg06_hero/03_flanking_speakers_framing.png` |
| `d9ce9aa9033b8a96` | 2 | `assets/cinematics/logos/logo_deadbeat_cinematic.png` · `assets/fase01/logo_deadbeat_trim.png` |

## 6. Priorización por impacto visual vs esfuerzo

Orden sugerido para regeneración (FASE 3), de menor riesgo a mayor:

| Prioridad | Categoría | Nº vigentes | Notas de riesgo |
|---|---|---|---|
| P1 · UI y logos | `ui+logos` | 19 | Baja: pocos assets, alta visibilidad, sin hitboxes |
| P2 · Suelos, muros, entornos | `floors+walls+environments` | 32 | Media: tileables, afectan ambientación general; validar seamless |
| P3 · Props, prefabs, pickups | `props+pickups+prefabs` | 54 | Baja-Media: objetos estáticos, mismo pivote bottom-center |
| P4 · Armas y efectos | `weapons+effects` | 36 | Media: proyectiles y VFX no deben tapar amenazas; pixel-art actual podría conservarse |
| P5 · Enemigos | `enemies` | 24 | Alta: 6 familias × 4 estados; requieren anclas foot/unit y halo de separación |
| P6 · Jefes | `bosses` | 42 | Alta: 11 jefes × 4 estados (2 idle/attack para el secreto); anclas críticas para salud/barra vida |
| P7 · Protagonista (atuendos) | `characters` | 25 | Muy alta: no mezclar diseño antiguo con maestro; requiere aprobación del IDLE/WALK/SHOOT |
| P8 · Cinemáticas | `cinematics` | 45 | Media-Alta: fondos y capas de paralaje; 201 archivos incluyen versiones previas/final |

## 7. Hallazgos importantes

1. **Build activo vs legado ART_PACK**: El build activo usa `src/dd_asset_registry.js` (277 entradas). `DEADBEAT_DISCO.ART.html` y `ART_PACK/art_pack.js` son legado congelado y **no** reciben assets nuevos.
2. **BUG CONFIRMADO: capas de cinemática 02/03 son byte-identical en los 6 planos.** Los archivos `02_*` y `03_*` en cada `backgrounds/final/cine_bgXX/` tienen el mismo hash SHA-256 (son el mismo PNG guardado con dos nombres). Esto significa que la cinemática de intro está dibujando dos capas iguales para los planos 01–06, perdiendo la profundidad del paralax. Los 12 PNG afectados suman ~23 MB. Detalle:
   - bg01: `02_gothic_skyline_architecture.png` = `03_foreground_industrial_pipes.png` (1,9 MB)
   - bg02: `02_portal_speakers_entrance.png` = `03_wet_pavement_reflections.png` (1,9 MB)
   - bg03: `02_midground_columns_banners.png` = `03_foreground_pillars_occlusion.png` (1,9 MB)
   - bg04: `02_laser_beams_equalizer.png` = `03_chandeliers_stage_framing.png` (2,0 MB)
   - bg05: `02_sound_towers_dj_stage.png` = `03_tables_foreground_ambient.png` (2,0 MB)
   - bg06: `02_hero_rimlight_spotlight.png` = `03_flanking_speakers_framing.png` (1,8 MB)
   Además existen versiones alternativas más pequeñas (15–170 KB) con nombres parecidos (`02_skyline_architecture.png`, `03_fog_industrial_cables.png`, etc.) que podrían ser las capas correctas; requieren verificación visual.
3. **Discrepancia characters/ (448 vs 25 vigentes)**: La carpeta `assets/characters/` contiene atuendos (outfits/) con sus sprites PNG (aim/death/hurt/idle/roll/walk) y los WebP de concepto, además de múltiples versiones del protagonista maestro (fidelidad, IDLE_4F fallido, descent, walk/). Nada de esto está en el registry activo excepto los 25 sprites de la raíz (player_* + companion + NPCs).
4. **Cinematics (201 archivos)**: Estructura compleja con versiones superpuestas:
   - `cine_circle_*.png` y `cine_intro_club_panorama.png` en la raíz (11) — todos vigentes.
   - `backgrounds/final/cine_bgXX/cine_bgXX.png` (6 composiciones 2560×1440, vigentes).
   - `backgrounds/final/cine_bgXX/01_*_.._03_*` (18 capas de paralax 1920×1080, vigentes) — **pero 12 son duplicadas** (ver punto 2).
   - `backgrounds/final/cine_bgXX/loop/frame_*.png` (48 frames, 8 por plano) — no registrados; uso por verificar.
   - `backgrounds/final/*_master.png`, `card_bg0X.png`, `ESCENARIOS_*_COMPARATIVA.png` — material de producción, no usado por el juego.
   - `backgrounds/cine_bgXX/` (raíz, sin final/) — versiones anteriores, sustituidas por las de `final/`.
   - `backgrounds/cine_bgXX/layer_*.png` (18) — nombres legacy de capas (layer_01/02/03), sustituidos.
   - `characters/protagonist/hero_*` (6) y `effects/`, `overlays/`, `logos/` — sprites y overlays, todos vigentes.
   - `restart/` (25) — storyboards JPG y lámina maestra del protagonista (referencia de producción).
5. **Prefabs (37)**: Sistema legacy de prefabs de salas (club/) con piezas isométricas (suelo, tapa, jambas, mobiliario roto/intacto); no están en el manifest ni se referencian desde DD_WORLD. Pendientes de verificar si `src/dd_prefab_world.js` los carga por ruta directa.
6. **Protagonista en dos sitios**: `assets/characters/player_*.png` (diseño anterior, 22 sprites usados en combate) coexisten con `assets/characters/protagonist_master/` (diseño nuevo, IDLE 07B integrado solo en Refugio vía DD_HUB; los sprites WALK/SHOOT están producidos pero no integrados).
7. **Enemigos y jefes (24+42)**: Ya fueron regenerados en las tandas TR_W1–W12 (informe 2026-11-15); los PNG actuales son el rebuild painterly, no el pixel-art original. Todos vigentes (42+24).
8. **Huecos de planificación (105 IDs)**: `docs/ART_REBUILD/MASTER_INVENTORY.json` lista ~105 IDs no implementados, casi todos armas adicionales (weapon_c016–weapon_c075: unas 55 variantes extra). Estas armas no están en el build activo (el juego usa 16) y no se cargan en el motor; son un plan antiguo.
9. **Ficheros duplicados sin conflicto**: `caballero/walk_b.png` = `caballero_drafts/walk_b.png` (copia en carpeta de drafts); `ESCENARIOS_DEFINITIVOS_COMPARATIVA.png` duplicado entre backgrounds/ y backgrounds/final/; `logo_deadbeat_cinematic.png` (en cinematics/logos/) es idéntico a `fase01/logo_deadbeat_trim.png`.

## 8. Metodología

- Recorrido recursivo de `assets/` sin excluir subcarpetas.
- Dimensiones y canal alfa leídos con Pillow cuando está disponible.
- Hash SHA-256 completo por fichero (parcial en >20 MB).
- Referencias en código: búsqueda literal de IDs y rutas en `src/*.js` y `tools/build_active_html.py`.
- Cruce con `assets/manifest.json` (277 entradas) y `docs/ART_REBUILD/MASTER_INVENTORY.json` (planificación).
- **No se ha borrado ni modificado ningún fichero**; este informe es solo lectura.

## 9. Comprobaciones pendientes

- [ ] Verificar si `src/dd_prefab_world.js` carga los prefabs de `assets/prefabs/` por ruta directa sin pasar por el registry.
- [ ] Verificar si los HTML preview de `assets/cinematics/preview/` se usan en algún flujo.
- [ ] Confirmar que los sprites `hero_*` en `assets/cinematics/characters/protagonist/` son los que usa el motor de cinemática y no duplicados de `assets/characters/`.
- [ ] Medir tamaños totales de arranque (antes/después de la regeneración FASE 4).
- [ ] Revisar los subdirectorios `outfits/concepts/archive/` y `fidelidad/versiones/` — son histórico de producción de atuendos.

---

*Archivo CSV de detalle: [`00_INVENTARIO.csv`](00_INVENTARIO.csv) — 17 columnas, una fila por fichero.*
