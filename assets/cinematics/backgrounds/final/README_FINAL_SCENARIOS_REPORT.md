# DEADBEAT DISCO — INFORME DE PRODUCCIÓN
## RECONSTRUCCIÓN DE ESCENARIOS CINEMATOGRÁFICOS DE ALTA CALIDAD

**Proyecto:** DEADBEAT DISCO (PC / Consolas)  
**Fase:** Arte Escénico 2.5D Definitivo con Animación Ambiental en Loop  
**Ubicación de recursos definitivos:** `assets/cinematics/backgrounds/final/`  
**Ubicación de respaldo de fase anterior:** `assets/cinematics/backgrounds/` (conservada intacta)  
**Resolución Master:** 1920 × 1080 (16:9 Anamórfico con overscan 2048 × 1152)  
**Manifiesto Técnico Maestro:** `assets/cinematics/backgrounds/final/manifest.json`  
**Lámina de Comparación:** `assets/cinematics/backgrounds/ESCENARIOS_DEFINITIVOS_COMPARATIVA.png`  

---

## 1. INCORPORACIÓN DE LAS REFERENCIAS VISUALES OBLIGATORIAS

Se han analizado en profundidad las dos referencias artísticas provistas (`Discoteca gótica neón bajo la lluvia-1.gif` y `Catedral Neón_ Pista de Baile Animada-2.gif`) y se han integrado sus lecciones visuales clave dentro del lenguaje canónico de DEADBEAT DISCO:

1. **Riqueza Arquitectónica Gótica Industrial:**
   - Sustitución de superficies planas por piedra de obsidiana labrada con arquivoltas góticas, pilastras fasciculadas, nervaduras de crucería y ventanales ojivales con tracerías de neón.
   - Bóvedas catedralicias monumentales y nichos con estatuas y antorchas.
2. **Equipamiento de Club Integrado:**
   - Torres de altavoces monumentales y subwoofers construidos en piedra oscura y hierro forjado enmarcando las arcadas.
   - Pantallas de ecualizador gráfico y vúmetros integrados en el triforio superior.
   - Lámparas de araña góticas de oro infernal suspendidas con bucles de chispas y calor.
3. **Iluminación Reactiva y Materiales Húmedos:**
   - Pavimento exterior con charcos y reflejos especulares de neón fucsia y cian (`BG02`).
   - Mosaico astronómico central de latón dorado pulido y obsidiana con reflejos reactivos al beat (`BG05` y `BG06`).
   - Haces láser volumétricos que cruzan diagonalmente la niebla baja de la sala (`BG04`).

---

## 2. ESTRUCTURA DE LOS SEIS ESCENARIOS DEFINITIVOS

Todos los escenarios están organizados en `assets/cinematics/backgrounds/final/cine_bg0X/`:
- **`cine_bg0X_master.png`:** Imagen combinada a resolución completa (1920 × 1080).
- **Capas `01_...`, `02_...`, `03_...`:** Elementos separados con transparencia alfa para paralaje 2.5D, travelling y oclusión de cámara.
- **`loop/frame_00.png` a `frame_07.png`:** Secuencia continua de 8 fotogramas en bucle ambiental sin saltos entre inicio y final.
- **`cine_bg0X_loop.gif`:** Bucle de previsualización animado continuo.

### BG01 — CIUDAD EXTERIOR BRUTALISTA (`cine_bg01_city`)
- **Composición:** Panorámica urbana nocturna opresiva con rascacielos gótico-industriales coronados por agujas y cables suspendidos.
- **Capas:** `01_sky_atmosphere.png` (cielo profundo) | `02_skyline_architecture.png` (edificios y ventanales) | `03_fog_industrial_cables.png` (tuberías, cables y bruma baja).
- **Animación en Loop:** Niebla volumétrica en desplazamiento continuo y balizas neón titilando.
- **Uso Storyboard:** Plano 01 (EWS Ciudad) y transición hacia Plano 02.

### BG02 — FACHADA MONUMENTAL DEADBEAT DISCO (`cine_bg02_club_exterior`)
- **Composición:** Catedral gótica de obsidiana con rosetón fucsia, portal triple de arquivoltas góticas, altavoces integrados y pavimento mojado con reflejos de lluvia. Marquesina superior central despejada para insertar el logotipo oficial.
- **Capas:** `01_gothic_cathedral_facade.png` | `02_portal_speakers_marquee.png` | `03_wet_ground_reflections.png`.
- **Animación en Loop:** Parpadeo analógico del rosetón y marquesina + ondulación de reflejos en los charcos.
- **Uso Storyboard:** Planos 02 y 03 (WS Fachada y Dolly In al umbral).

### BG03 — UMBRAL Y CORREDOR DE ACCESO (`cine_bg03_entrance`)
- **Composición:** Pasillo ceremonial en fuga con bóvedas apuntadas, estandartes heráldicos, hornacinas con antorchas neón, intensa fuga de luz dorada y magenta entreabierta, y columnas colosales en primer término.
- **Capas:** `01_hallway_vault_focal_light.png` | `02_mid_columns_torches.png` | `03_foreground_pillars_occlusion.png`.
- **Animación en Loop:** Resplandor pulsante de la fuga de luz del umbral y antorchas.
- **Uso Storyboard:** Planos 03 (CU Umbral), 04 (MS Silueta) y 05 (Tracking lateral continuo con oclusión rítmica realista).

### BG04 — NAVE PRINCIPAL Y BÓVEDA MONUMENTAL (`cine_bg04_main_hall`)
- **Composición:** Gran sala catedralicia de tres niveles con bóvedas de crucería, triforio con vúmetros de sonido, candelabros góticos de oro suspendidos y haces láser cruzados.
- **Capas:** `01_cathedral_nave_vaults.png` | `02_laser_beams_volumetric.png` | `03_chandeliers_gold_framing.png`.
- **Animación en Loop:** Barrido angular continuo de los láseres cian y fucsia atravesando la niebla en suspensión.
- **Uso Storyboard:** Plano 06 (High Angle EWS Interior y descenso hacia la pista).

### BG05 — PISTA DE BAILE DE OBSIDIANA Y ORO (`cine_bg05_dancefloor`)
- **Composición:** Pista central circular con mosaico astrológico infernal de latón dorado, retícula neón en perspectiva, torres monumentales de sonido y espacio central despejado para el protagonista.
- **Capas:** `01_astrological_dancefloor_grid.png` | `02_sound_towers_dj_booth.png` | `03_fog_strobe_ambient_glow.png`.
- **Animación en Loop:** Expansión concéntrica del pulso estroboscópico coordinado con el bombo (*kick drum*).
- **Uso Storyboard:** Plano 07 (WS Dinámico sincronizado con el *DROP* musical) e inicio del Plano 08.

### BG06 — ESCENARIO HEROICO E IDENTIDAD (`cine_bg06_hero`)
- **Composición:** Composición axial perfectamente simétrica pensada para la presentación del héroe. Gran rosetón de fondo que genera un potente halo de contraluz (*Rim Light*) que destaca su silueta sin competir con él. Pilastras laterales en penumbra y tercio superior libre para el graffiti del logotipo oficial.
- **Capas:** `01_axial_rosette_architecture.png` | `02_hero_rimlight_spotlight.png` | `03_framing_columns_negative_space.png`.
- **Animación en Loop:** Variación respiratoria suave de la intensidad del contraluz focal.
- **Uso Storyboard:** Planos 08 (MCU Presentación), 09 (Logotipo Oficial) y 10 (Transición *seamless* hacia la cámara isométrica jugable de la sala `r0`).

---

## 3. INTEGRACIÓN CON EL PROTAGONISTA Y ASSETS OFICIALES

- **Espacio de Acción Reservado:** Ningún elemento arquitectónico estorba el centro de la escena en BG03, BG05 o BG06, permitiendo que `player_idle_00`, `player_walk_00-03` y `player_shoot_00` se muevan con legibilidad absoluta.
- **Reserva de Identidad de Marca:** BG02 y BG06 disponen de espacio negativo superior calibrado para renderizar el logo oficial (`assets/fase01/logo_deadbeat_trim.png`).
- **Respeto Absoluto del Código y Gameplay:** No se ha modificado la lógica jugable, ni el HUB, ni la cámara isométrica, ni los scripts del juego.
- **Conservación de Versiones Anteriores:** Los fondos de la fase preliminar se mantienen en `assets/cinematics/backgrounds/` como respaldo técnico.
