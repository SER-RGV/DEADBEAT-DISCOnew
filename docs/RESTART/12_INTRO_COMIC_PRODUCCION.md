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

## 4. Pruebas

`tools/qa/test_restart_flow.js` sobre `index.html`: **65 de 65**
(`evidencia_intro_comic/qa_inicio.json`). Incluye la intro completa en tiempo real, las
dos fuentes cargadas, tabla de nueve pistas, que no se carga ninguna ilustración generada
del protagonista, menú con ratón, teclado y mando simulado, NUEVA PARTIDA, descenso,
Refugio, CONTINUAR, saltos, y 7 resoluciones (entre ellas 1280×720, 1920×1080 y 2560×1440).

Revisado a ojo en capturas del juego: los siete planos a 1280×720, 1024×768 y 3440×1440;
nueve plantas en el plano 03; ausencia de rótulos de la lámina en el plano 05.

`evidencia_intro_comic/reproduccion_completa_sin_sonido.mp4`: intro → menú → nueva
partida → descenso → Refugio. Está montado con fotogramas del juego tomados a 12 por
segundo: **no es una grabación de pantalla en tiempo real y no lleva sonido.**

### No probado

- Sonido audible y su sincronía percibida (sin salida de audio: sólo estado lógico y tabla de tiempos).
- Mando físico; Firefox y Safari; hardware real.

## 5. Limitaciones

1. `mc_03_nine`: las plantas 5, 6 y 7 son copias en espejo y oscurecidas de las plantas 1, 2 y 3. Son nueve, pero no nueve dibujos distintos.
2. Las botas (`op_05a_boots`) siguen siendo la ilustración anterior, con máquinas recreativas al fondo. No muestra tatuajes ni rostro.
3. El sombrero suelto (`op_hat.png`) es un recorte de una ilustración generada; sólo el sombrero.
4. En el plano 06 el personaje es un único fotograma estático (no hay animación de caída).
5. El Refugio sigue mostrando al protagonista con los sprites antiguos, con sombrero.
6. NUEVA PARTIDA sigue sin borrar el progreso permanente.
