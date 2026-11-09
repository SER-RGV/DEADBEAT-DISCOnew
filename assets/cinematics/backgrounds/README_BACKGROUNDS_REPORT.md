# DEADBEAT DISCO — INFORME DE PRODUCCIÓN DE FONDOS ESCÉNICOS CINEMATOGRÁFICOS

**Proyecto:** DEADBEAT DISCO (PC / Consolas)  
**Módulo:** Arte Escénico para Introducción Cinematográfica (10 Planos / 35s)  
**Ubicación de recursos:** `assets/cinematics/backgrounds/`  
**Resolución estándar:** 1920 × 1080 (16:9 Anamórfico)  
**Manifiesto estructurado:** `assets/cinematics/backgrounds/manifest.json`  
**Lámina de comparación:** `assets/cinematics/backgrounds/FONDOS_CINEMATICOS_COMPARATIVA.png`  

---

## 1. RESUMEN DE ENTREGA

Se han producido los seis escenarios requeridos para la introducción cinematográfica completa, diseñados y ensamblados en capas independientes preparadas para paralaje 2.5D, travelling lateral, zooms y movimientos de cámara en Canvas 2D:

1. **`cine_bg01_city.png`** — Gran panorámica nocturna urbana brutalista (3 capas).
2. **`cine_bg02_club_exterior.png`** — Fachada exterior y portal monumental con reflejos (3 capas).
3. **`cine_bg03_entrance.png`** — Umbral y corredor interior con columnas y fugas lumínicas (3 capas).
4. **`cine_bg04_main_hall.png`** — Bóveda gótico-industrial de la nave principal con láseres y candelabros (3 capas).
5. **`cine_bg05_dancefloor.png`** — Pista de baile reactiva en perspectiva con torres de sonido y espacio central despejado (3 capas).
6. **`cine_bg06_hero.png`** — Composición heroica focal con contraluz y espacio reservado para el logotipo oficial (3 capas).

Todos los fondos y sus capas están libres de personajes generados, armas, HUD, textos inventados o logotipos falsos. El protagonista oficial (`player_idle_00`, `player_walk_00-03`, `player_shoot_00`) y el logotipo oficial (`assets/fase01/logo_deadbeat_trim.png`) se integran limpiamente en los espacios negativos diseñados sin oclusiones.

---

## 2. RELACIÓN Y CORRESPONDENCIA CON EL STORYBOARD

| Fondo Escénico | Archivo Maestro | Capas Disponibles | Planos del Storyboard | Función Narrativa y Cinemática |
|---|---|---|---|---|
| **BG01 — Ciudad Exterior** | `cine_bg01_city.png` | `layer_01_sky`<br>`layer_02_skyline`<br>`layer_03_fog_haze` | **Plano 01** *(EWS Urbano, 00:00 - 00:35)*<br>Transición a **Plano 02** | Establece la atmósfera nocturna y la escala opresiva brutalista de la metrópolis infernal. Permite Pan horizontal y Tilt Up en paralaje con niebla baja. |
| **BG02 — Fachada Club** | `cine_bg02_club_exterior.png` | `layer_01_wall`<br>`layer_02_portal`<br>`layer_03_ground` | **Plano 02** *(WS Fachada, 00:35 - 00:70)*<br>Inicio **Plano 03** *(Dolly In)* | Aproximación al portal gótico monumental. Marquesina superior reservada para proyectar el neón del motor. Suelo mojado con reflejos fucsia y cian. |
| **BG03 — Umbral y Corredor** | `cine_bg03_entrance.png` | `layer_01_back_corridor`<br>`layer_02_mid_columns`<br>`layer_03_foreground_pillars` | **Plano 03** *(CU Umbral)*<br>**Plano 04** *(MS Silueta)*<br>**Plano 05** *(Tracking Walk)* | Entrada física y desplazamiento lateral. Las columnas en primer plano generan oclusión rítmica periódica sobre el protagonista al caminar. Fuga de luz dorada. |
| **BG04 — Nave Principal** | `cine_bg04_main_hall.png` | `layer_01_cathedral_vault`<br>`layer_02_light_beams`<br>`layer_03_chandeliers_pillars` | **Plano 06** *(High Angle EWS, 01:75 - 02:10)* | Picado cenital que revela la majestuosidad de la sala. Candelabros góticos de oro y haces de luz volumétrica láser cruzando en diagonal. |
| **BG05 — Pista de Baile** | `cine_bg05_dancefloor.png` | `layer_01_floor_grid`<br>`layer_02_sound_towers`<br>`layer_03_ambient_glow` | **Plano 07** *(WS Dinámico, 02:10 - 02:45)*<br>Inicio **Plano 08** | La pista de baile responde al *DROP* musical. Suelo coherente con los materiales del juego (`floor_01_lust_dancefloor`). Espacio central libre para el avance del héroe. |
| **BG06 — Composición Heroica** | `cine_bg06_hero.png` | `layer_01_arena_bokeh`<br>`layer_02_hero_backlight`<br>`layer_03_framing` | **Plano 08** *(MCU Presentación)*<br>**Plano 09** *(Logo Oficial)*<br>**Plano 10** *(Transición Isométrica)* | Enfoque selectivo sobre el héroe (`player_shoot_00 windup`). Gran halo de contraluz (*rim light*). Espacio superior libre para el graffiti del logo. Transición directa al juego. |

---

## 3. CONTINUIDAD VISUAL Y RECORRIDO ARQUITECTÓNICO

El paquete asegura la continuidad de un único edificio coherente:
$$\text{CIUDAD (BG01)} \longrightarrow \text{FACHADA (BG02)} \longrightarrow \text{ENTRADA (BG03)} \longrightarrow \text{CORREDOR (BG03)} \longrightarrow \text{NAVE (BG04)} \longrightarrow \text{PISTA (BG05 / BG06)}$$

1. **Materiales:**
   - La piedra de obsidiana profunda (`#07020f` y `#120422`) se mantiene constante desde los contrafuertes exteriores hasta los pilares de la nave y los bordes de la pista.
   - El oro ornamental (`#ffe600`) aparece como acento sutil en las cresterías del portal exterior, los capiteles de las columnas, la fuga de luz del umbral y los candelabros de la nave.
2. **Iluminación:**
   - Neón fucsia/magenta (`#ff007f`) como luz clave (*key light*) del club.
   - Cian eléctrico (`#00f0ff`) como luz de relleno y contorno (*edge light*).
   - Haces láser violeta (`#9d00ff`) proyectados a través del humo y la bruma volumétrica.
3. **Escala y Geometría:**
   - Las proporciones de las arcadas apuntadas del portal en BG02 conectan con el marco del umbral en BG03 y las bóvedas de crucería en BG04.
   - La retícula geométrica del suelo en BG05 respeta las líneas de fuga que desembocan en el círculo de combate central de BG06, coincidente con la sala `r0` del motor jugable.

---

## 4. RELACIÓN CON LOS ASSETS OFICIALES DEL REPOSITORIO

### Recursos Oficiales de Referencia y Reutilización:
- **Suelos:** Coherencia de texturas con `assets/floors/floor_01_lust_dancefloor.png`, `floor_00_limbo_marble.png` y `floor_05_pride_obsidian_gold.png`.
- **Arquitectura:** Siluetas de muros y pilastras coherentes con `assets/walls/wall_pillar_obsidian.png`, `wall_panel_gothic_niche.png` y `wall_panel_tall_neon.png`.
- **Portales y Puertas:** Estructura de arcos basada en `assets/environments/door_arched_open.png` y `door_gothic_open.png`.
- **Accesorios de Escenario:** Lámparas doradas y torres de altavoces inspiradas en `assets/props/prop_chandelier_gold.png` y `prop_speaker_tower.png`.
- **Identidad Gráfica:** Proporciones y espacio negativo adaptados para la integración en motor de `assets/fase01/logo_deadbeat_trim.png` y `assets/logos/logo_deadbeat_graffiti.png`.

### Recursos Nuevos Producidos:
- 6 fondos maestros combinados a resolución completa 1920 × 1080 PNG 24-bit (`assets/cinematics/backgrounds/cine_bg01...` a `cine_bg06...`).
- 18 capas individuales organizadas en subdirectorios temáticos para paralaje 2.5D y control dinámico de opacidad/iluminación.
- Manifiesto JSON técnico estándar (`assets/cinematics/backgrounds/manifest.json`).
- Lámina visual de comparación de alta resolución (`assets/cinematics/backgrounds/FONDOS_CINEMATICOS_COMPARATIVA.png`).
