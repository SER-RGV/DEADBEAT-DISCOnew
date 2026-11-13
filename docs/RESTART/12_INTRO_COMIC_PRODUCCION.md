# 12 · Intro en cómic animado — producción

Fecha: 2026-11-13. Sustituye a la intro del documento `09`. El storyboard v1 (`11`) queda
como histórico; el vigente es `storyboard_intro/storyboard_v2_motor.jpg`, hecho con
fotogramas del juego real.

## 1. Correcciones pedidas

| Punto | Hecho |
|---|---|
| Sin ciudad en el plano 01 | Lámina nueva `mc_01_station`: la estación sola sobre negro. |
| Plano 03: nueve pistas, sin rótulos | Lámina `mc_03_nine` **compuesta** a partir de la torre ya aprobada (`op_02_tower`): nueve plantas exactas, sin texto. La generada con rótulos «LEVEL» queda archivada como `mc_03_nine_descartada_rotulos`. |
| Plano 05: lámina maestra sin rótulo | Se dibuja `protagonist_master_crop_hero.png` tal cual, con un recorte que deja fuera el rótulo. Los dos detalles (brazo y rostro) también salen de la lámina. |
| Plano 06: protagonista canónico | La ilustración generada `mc_06_fall` **no se usa**. El personaje es el IDLE 07B aceptado, visto de lado; en el picado final es sólo una mancha de tinta. |
| Fuentes definitivas | Barlow Condensed 700 cursiva (cartelas y menú) y Bangers (onomatopeyas). SIL OFL 1.1; archivos y licencias en `assets/fonts/`. Declaradas en el CSS del build y cargadas antes del primer rótulo. |
| Descenso repartido | La intro enseña grietas, inicio de la caída y sombrero, y corta al título. NUEVA PARTIDA entra por el pozo del menú y completa la caída en 4,6 s (antes 7 s), sin grietas ni sombrero. |
| Fondo del menú | `mc_07_pit`: el pozo y el sombrero en el borde, con la zona oscura a la izquierda para logotipo y opciones. |

## 2. La secuencia (32 s, 120 ppm)

| Plano | Tiempo | Qué ocurre | Recursos de cómic |
|---|---|---|---|
| 01 El mundo | 0–4 | Viñeta panorámica de la estación; crece hasta llenar la pantalla | viñeta que se expande, cartelas, manchas |
| 02 La estación | 4–9 | Se cruza la puerta; página completa del salón | tres viñetas que caen a compás |
| 03 Las nueve pistas | 9–14 | Corte del edificio; la cámara baja y luego se abre; nueve marcas, una por pista | travelling vertical, viñetas enlazadas con trazos |
| 04 Algo no funciona | 14–19 | La puerta da a la misma pista; la página se raja; a los 17 s imagen y música repiten el mismo medio compás | grieta, viñetas torcidas, CLAC, TUM-TUM |
| 05 El protagonista | 19–24 | Pisadas a compás, una llega tarde y la música se corta; entra la lámina maestra | TAC, mancha, página partida |
| 06 El descenso | 24–29 | Grietas; la página se parte; caída de lado y el sombrero se desprende; picado desde el borde | CRRRAC, FSSSSH, líneas de velocidad |
| 07 El comienzo | 29–32 | Logotipo oficial sobre el pozo; el encuadre es el del menú | estampado con mancha de tinta |

Transiciones de tinta en 8,7–9,3 s y 18,75–19,25 s. Cada viñeta, cartela y onomatopeya
tiene su golpe en la partitura (misma tabla de tiempos para imagen y sonido).

## 3. Archivos

**Nuevos:** `assets/cinematics/restart/opening/mc_01_station.jpg`, `mc_03_nine.jpg`,
`mc_04_doors.jpg`, `mc_07_pit.jpg`; `assets/fonts/` (2 fuentes + 2 licencias);
maestros en `ART_ASSETS/rebuild_masters/R07_COMIC/`; `docs/RESTART/evidencia_intro_comic/`.

**Modificados:** `src/dd_opening.js` (planos, descenso, partitura, rotulación),
`src/dd_ui_system.js` (una línea: fondo del menú), `src/dd_rebuild_ui.css` (fuentes),
`tools/qa/test_restart_flow.js`, `index.html` y `DEADBEAT_DISCO.html` (regenerados).

**Sin tocar:** motor, registro de recursos, `dd_world_renderer.js`, `dd_boot.js`,
`dd_hub_system.js`, lámina maestra, IDLE 07B, sprites `player_*`.

**Ya no se cargan** (se conservan): `op_02_tower`, `op_04c_vespera`, `op_05b_back`,
`op_06_face`.

## 4. Pruebas, sonido y limitaciones

Actualizado en `13_CIERRE_INTRO_REFUGIO_PERSISTENCIA.md` (2026-11-13): cartelas revisadas,
caída del plano 06 con más movimiento, IDLE 07B en el Refugio, persistencia, medición del
sonido y vídeo en tiempo real con audio. Las cifras y limitaciones vigentes están allí.

Nota que se mantiene sobre el plano 03: `mc_03_nine` muestra nueve posiciones, pero las
plantas 5, 6 y 7 son **variaciones** (en espejo y oscurecidas) de las plantas 1, 2 y 3, no
ilustraciones independientes. Dirección ha decidido no bloquear el cierre por ello.
