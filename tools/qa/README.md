# PRUEBAS (QA) — DEADBEAT DISCO

Todo lo que hay que saber para probar el juego sin pensar: **un comando**, qué
cubre cada suite y qué está histórico.

## Un solo comando

```bash
bash tools/qa/run.sh            # suites rápidas (menú, HUD, teclado, semillas…)
bash tools/qa/run.sh --all      # + regresión visual y presupuestos
bash tools/qa/run.sh --only=arranque,plantas
bash tools/qa/run.sh --list     # ver qué hay
```

El script instala las dependencias fijadas (`npm ci`), resuelve Chromium y sirve
el repositorio por HTTP. No hace falta `npx playwright install` ni `apt`: el
navegador llega en el paquete `@sparticuz/chromium`, con sus librerías NSS
empaquetadas, y el arnés las extrae a `~/.dd_qa/`.

Requisitos: `node >= 20`, `tar`, ~1 GB libre. Sin GPU: el render es software.

### Variables útiles

| Variable | Para qué | Defecto |
|---|---|---|
| `QA_WORK` | directorio de trabajo (navegador, salida) | `~/.dd_qa` |
| `QA_OUT` | informes y capturas | `$QA_WORK/out` |
| `QA_ONLY` / `--only=` | elegir suites | todas las rápidas |
| `QA_STATE_TIMEOUT` | espera máxima por estado del juego (ms) | `180000` |
| `QA_SEEDS` | semillas a validar | `1000` |
| `QA_VISUAL_THRESHOLD` | % de píxeles distintos permitido | `1.5` |
| `QA_VISUAL_TOLERANCE` | diferencia por canal ignorada (0–255) | `24` |
| `QA_VISUAL_UPDATE=1` | regenerar referencias visuales | — |
| `QA_HEADED=1` | ver el navegador (depurar a mano) | — |

`node tools/qa/run.js` sale con **0** si no hay fallos, **1** si algo falla y
**2** si el entorno no está preparado. Cada ejecución escribe
`$QA_OUT/report.json` con el detalle de cada comprobación: qué se exigía, qué se
observó y cuánto tardó.

## Suites del arnés (Fase 1)

| Suite | Archivo | Qué cubre |
|---|---|---|
| `arranque` | `e2e/01_arranque.spec.js` | HTTP 200, 0 errores de consola, 0 respuestas ≥ 400, carga 0→100 %, sin watchdog, menú disponible sin pulsación previa, contrato real de la FSM |
| `menu` | `e2e/02_menu.spec.js` | seis acciones con nombre accesible, `role="menu"`/`menuitem`, un solo punto de tabulación, foco visible, flechas y Enter/Escape |
| `hub` | `e2e/03_hub.spec.js` | NUEVA PARTIDA por el camino del jugador, apertura saltada, Refugio activo y en pausa (zona segura), caminar, zonas y estaciones, ficha guardada |
| `plantas` | `e2e/04_plantas.spec.js` | una incursión corta por cada uno de los nueve círculos y el núcleo: círculo correcto, rótulo de la pista, vidas, director de combate vivo |
| `partida` | `e2e/05_partida.spec.js` | teclado, ratón (apuntar/disparar), esquiva, daño real y su reflejo en el HUD, pausa y reanudación con ESC |
| `persistencia` | `e2e/06_persistencia.spec.js` | ficha `dd_save_v1`, recarga del navegador, CONTINUAR dentro de JUGAR, restauración en el Refugio y suma de visitas |
| `teclado` | `e2e/07_teclado.spec.js` | recorrido de las seis opciones sin ratón, foco visible y sin fugas fuera del submenú |
| `semillas` | `e2e/08_semillas.spec.js` | 1.000 semillas × 10 plantas con `generate()` + `validate()` reales; 108 salas, núcleo de una sala, determinismo |
| `visual` | `e2e/09_visual.spec.js` | capturas en 1280×900, 1920×1080 y 390×844 comparadas con referencias del repo, umbral configurable |
| `presupuestos` | `e2e/10_presupuestos.spec.js` | MB de arranque reales y cadencia en menú, cinemática, Refugio y combate; límites en `budgets.json` |

El arnés compartido vive en `lib/`: `chrome.js` (navegador y librerías),
`server.js` (servidor estático con Range), `game.js` (estados, entrada al juego,
sondas del motor) y `harness.js` (PASS/FAIL/SKIP, capturas, informes).
`visual/compare.js` compara PNG dentro del navegador, sin dependencias.
Las referencias visuales están en `visual/baselines/` y se regeneran con
`npm run visual:refs` **revisando antes las capturas**.

## Suites anteriores (se conservan)

Se mantienen como histórico y como pruebas de detalle. Necesitan servidor HTTP y
`DD_CHROMIUM` (o `QA_CHROME`) apuntando a un binario:

```bash
bash tools/qa/run.sh --setup                       # deja el navegador listo
. ~/.bashrc 2>/dev/null; node -e "require('./tools/qa/lib/chrome.js').resolveChrome().then(console.log)"
# ejemplo:
DD_CHROMIUM=$(node -e "require('./tools/qa/lib/chrome.js').resolveChrome().then(p=>console.log(p))") \
  node tools/qa/refuge_walkthrough.cjs http://127.0.0.1:8123
```

Ninguna se ha reejecutado entera en la Fase 1 salvo donde se indica: las cifras
de esta fase salen del arnés nuevo y de `tools/fase01_qa/run.sh`.

### Refugio y HUB

| Archivo | Cobertura | Estado en Fase 1 |
|---|---|---|
| `refuge_walkthrough.cjs` | recorrido del Refugio con entradas simuladas, sin teletransporte | se conserva |
| `refuge_restart.cjs` | reapertura de Chromium con el mismo perfil desechable | se conserva |
| `refuge_record.cjs` | registro del Refugio (sin navegador) | se conserva |
| `vestibulo_organic.cjs`, `vestibulo_preview.cjs` | vestíbulo orgánico y su vista previa | vista previa = captura |
| `test_cartography_tour.cjs` | recorrido de enlaces generados de la cartografía | se conserva |

### Dados

| Archivo | Cobertura | Estado |
|---|---|---|
| `dice_cycle.cjs` | ciclo de dados sin DOM | node puro |
| `dice_engine.cjs` | motor de dados en el juego real | navegador |
| `dice_feedback.cjs` | eventos de presentación de los dados | node puro |

### Salas y prefabs

| Archivo | Cobertura | Estado |
|---|---|---|
| `room_generation.cjs` | 104 semillas × 10 plantas contra `generate()`/`validate()` | node puro, **cubierto ahora por `semillas`** |
| `room_generation_live.cjs` | contrato del build jugable | navegador |
| `prefab_floors.cjs` | catálogo de plantas (sin navegador) | node puro |
| `prefab_reach.cjs` | ¿se puede salir de cada sala? (relleno de rejilla) | navegador |
| `prefab_progression.cjs` | descenso por la puerta real del ascensor | navegador |
| `prefab_boss.cjs` | una página nueva por jefe | navegador |
| `prefab_rave.cjs`, `prefab_legibility.cjs` | legibilidad con RAVE saturado | navegador |
| `prefab_rollout.cjs` | instalación, puertas, decoración y cinturón hostil | navegador |
| `prefab_touch.cjs` | juego táctil con CDP reales en el joystick | navegador |
| `playable_prefab.cjs`, `prefab_art_preview.cjs` | prefab jugable y vista de arte | navegador / captura |

### Interface, menús y accesibilidad

| Archivo | Cobertura | Estado |
|---|---|---|
| `test_ui_results.js` | pantalla de resultados | navegador |
| `test_menu_new_flow.js` | Nueva partida → historia → descenso; Continuar los salta | navegador |
| `test_menu_passage.js`, `test_menu_scenes.js`, `test_menu_visuals.js`, `test_menu_respuesta.js` | transiciones, escenas y miniaturas del menú | navegador / captura |
| `test_options_controls.js` | ayuda de controles y ciclo de OPCIONES | navegador |
| `test_accessibility_dodge.js` | árbol de accesibilidad y esquiva configurable | navegador, **actualizada en Fase 1** (el menú pasó a `role="menu"`) |
| `test_subtitles.js` | canal de subtítulos | navegador |
| `test_hud_vitals.js` | HUD contra el estado del motor | navegador |
| `test_modal_input.js` | propiedad de la entrada en modales | navegador |
| `test_minimap_engine.js` | minimapa copiado del motor | navegador |

### Combate, animación y arte

| Archivo | Cobertura | Estado |
|---|---|---|
| `combat_feel.cjs`, `combat_feel_live.cjs` | sensación de combate (lógica / navegador) | mixto |
| `feel31*.cjs`, `juice_*.cjs` | sacudidas, etiquetas de daño y recetas de «jugo» | navegador / node |
| `hangar_perf.cjs`, `hangar_perf_live.cjs`, `hangar_pilot.cjs`, `hangar_review.cjs` | hangar: rendimiento y pilotaje | mixto |
| `test_ingame_animation.js`, `test_ingame_transitions.js`, `test_player_animations.js`, `test_protagonist_anim_viewer.js` | animación y transiciones en partida | navegador |
| `test_hub_descent_animation.js` | idle, caminar y descenso en el lienzo real | navegador |
| `test_phase03_visual_matrix.js`, `test_phase04_combat_animation.js`, `test_outfit_*.js`, `test_v2m_outfits.js` | matriz visual de atuendos y combate | navegador |
| `test_*_art.cjs`, `test_pickup_art.cjs`, `test_equipped_walk.cjs`, `test_vault_identity.cjs` | integración de arte HD por familia | navegador |
| `test_native_armory.js`, `test_combat_choices.js` | tienda nativa y elección de arma | navegador |
| `test_victory_presentation.js` | presentación de victoria | navegador |

### Rendimiento

| Archivo | Cobertura |
|---|---|
| `perf_probe.js` | incursión real con enemigos y FPS (captura) |
| `prefab_perf.cjs` | cadencia con render software (cota inferior) |
| `probe_idle_1f_in_game.js` | fotograma único del idle dentro de partida |

Los presupuestos automáticos de la Fase 1 están en `e2e/10_presupuestos.spec.js`
y `budgets.json`.

### Histórico y obsoleto

| Archivo | Motivo |
|---|---|
| `legacy/test_*_outfit.js` (12) | sustituidos por `test_v2m_outfits.js` y la matriz de la Fase 03 |
| `test_cinematic_fase03.js` | simulación con navegador *mock*, sin juego real |
| `test_fase06_integration.js` | simulación con navegador *mock* |
| `test_modular_replacement_fase04.js` | sustitución modular cerrada en fases anteriores |
| `final_review.js`, `selfcontained.js` | revisiones de entrega antiguas |
| `capture_*.js`, `juice_profile.cjs`, `prefab_art_preview.cjs` | generan capturas, no afirman nada |
| `mux_audio_video.py`, `build_phase04_contact_sheets.py`, `validate_phase03_outfits.py` | utilidades de entrega de fases anteriores |
| `run_phase03_visual_matrix.sh`, `run_phase04_visual_matrix.sh` | matrices de fases anteriores |

## Limitaciones conocidas (medidas, no supuestas)

- **Sin GPU**: el render es software (SwiftShader). Las cifras de cadencia son
  cotas inferiores y el presupuesto lo dice: sirven para detectar regresiones
  relativas, no para prometer fotogramas en un móvil.
- **La apertura avanza por fotogramas**: en software su reloj va a ~0,17×, por lo
  que un arranque con intro sin saltar puede tardar minutos. Las suites la saltan
  como un jugador (después del mínimo de 0,4 s que exige el propio juego).
- **Audio**: las suites comprueban estado lógico del audio, no sonido audible.
- **Mando**: se simula la API `Gamepad`; no hay mando físico.
- **Semillas**: el encargo cita 223 salidas; el generador de `src/room_generation`
  produce 216 (24 por planta × 9). La diferencia está señalada en el informe.
