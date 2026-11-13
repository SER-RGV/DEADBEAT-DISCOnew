# 11 · Intro en cómic animado — auditoría, storyboard y prueba de estilo

Estado: **PREPRODUCCIÓN, PENDIENTE DE VALIDACIÓN.** El juego no se ha tocado: la intro que
se reproduce hoy sigue siendo la del documento `09`.

## 1. Auditoría de lo existente

| Recurso | Decisión |
|---|---|
| `src/dd_opening.js` (lienzo propio, reloj a 120 ppm, audio sintetizado, salto, precarga, fin en el menú) | **Se reutiliza** como reproductor. Se sustituye el contenido de los planos, no el sistema. Las pruebas de `tools/qa/test_restart_flow.js` siguen valiendo. |
| `src/dd_cinematic_camera.js` | No sirve para esto (mueve la cámara de la partida). No se toca. |
| Lámina maestra y sus recortes | **Base obligatoria del plano 05**, sin redibujar. |
| `opening/op_03_dancefloor`, `op_01_vinyl`, `op_04a_tempo_hand`, `op_04b_smiles`, `op_04c_vespera`, `op_05a_boots`, `op_06_face`, `op_02_tower` | Se reutilizan como página o como viñetas. |
| `assets/cinematics/cine_circle_*`, `cine_intro_club_panorama`, `backgrounds/cine_bg0*` | Descartados: otra dirección de arte y nombres de círculos. |
| Logotipo oficial | Plano 07. |

Ilustraciones nuevas de esta ronda (maestros en `ART_ASSETS/rebuild_masters/R07_COMIC/`):
`mc_01_world`, `mc_03_nine`, `mc_04_doors`, `mc_06_fall`, `mc_07_hat`.

## 2. Storyboard

`storyboard_intro/storyboard_hoja_completa.jpg` y un tablero por plano
(`storyboard_plano_01…07.jpg`) con imagen, movimiento, sonido y fuente.
Prueba de estilo a tamaño real: `storyboard_intro/prueba_estilo_plano_04.jpg`.

Son **maquetas fijas** compuestas con `tools/art_master/storyboard_intro.py`. Enseñan
composición, rotulación y lenguaje de cómic; no demuestran el movimiento.

| Plano | Tiempo | Recursos de cómic |
|---|---|---|
| 01 El mundo | 0–4 s | Viñeta panorámica que crece a pantalla completa; paralaje |
| 02 La estación | 4–9 s | Página completa + tres viñetas superpuestas que caen a compás |
| 03 Las nueve pistas | 9–14 s | Plano arquitectónico en corte; travelling vertical; viñetas enlazadas |
| 04 Algo no funciona | 14–19 s | Página que se raja; viñetas torcidas; onomatopeyas |
| 05 El protagonista | 19–24 s | Lámina maestra a toda página; detalles en viñeta; mancha de tinta |
| 06 El descenso | 24–29 s | Viñeta que se rompe; picado; líneas de velocidad; el sombrero tapa el encuadre |
| 07 El comienzo | 29–32 s | Estampado del logotipo; el encuadre final es el menú |

## 3. Defectos conocidos de las maquetas

- **Plano 03:** la ilustración tiene rótulos «LEVEL» dibujados y unas siete plantas, no
  nueve. Hay que rehacerla antes de producir.
- **Plano 05:** el recorte de la lámina arrastra un trozo del rótulo de la propia lámina
  (arriba a la izquierda). En producción se tapa con una viñeta o se reencuadra.
- **Plano 06:** el personaje es una ilustración generada a partir de la lámina; los
  tatuajes del brazo no son los canónicos. A ese tamaño apenas se leen, pero no es fiel.
- **Plano 01:** la ilustración trae su propio marco de papel; se recorta.
- Las cartelas usan Barlow Condensed y las onomatopeyas Bangers (licencia OFL). Aún no
  están incluidas en el juego; integrarlas exige añadirlas al build.

## 4. Cambio de estructura que implica el plano 06

Hoy el descenso se ve al pulsar NUEVA PARTIDA. Si la intro ya lo enseña, se repetiría.
Propuesta del storyboard: la intro muestra el **inicio** de la caída y el sombrero, y
corta al título; NUEVA PARTIDA retoma la caída (más corta) y llega al Refugio. El fondo del
menú pasaría a ser el pozo con el sombrero en el borde, en lugar del rostro.

## 5. Siguiente paso

Con el guion y el storyboard validados: rehacer la lámina del plano 03, producir la
secuencia en `dd_opening.js`, y repetir las pruebas en el juego real.
