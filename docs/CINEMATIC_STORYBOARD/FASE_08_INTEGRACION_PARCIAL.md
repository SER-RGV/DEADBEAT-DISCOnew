# Fase 08 — integración parcial, no aceptación final

## Fuentes y alcance
Se consultaron los archivos adjuntos `lore.txt` y `DEADBEAT_DISCO_BIBLIA_MAESTRA_UNIVERSO_Y_PROGRESION_v1.0.md`, el storyboard `STORYBOARD_DIRECTOR_REPORT.md`, Fase 07, el manifiesto, preview, arranque, registro, cámara y HUB. Los documentos adjuntos no se incorporan al repositorio. La biblia distingue canon, diseño y propuesta; confirma que el Desafinado no viene del exterior y que DJ Virgilio es denominación heredada de Tempo.

## Cambios realizados
- `src/dd_cinematic_camera.js`: eliminadas las anotaciones técnicas y la referencia a ciudad infernal en los rótulos de intro; añadidos «REFUGIO →» en plano 05 y «REFUGIO · PREPÁRATE ANTES DE BAJAR» en plano 10 como texto del letterbox, no como señal integrada en la arquitectura. El protagonista se detiene al final del plano 07; los planos 08 y 09 usan el fotograma oficial de espera provisional en lugar de `shoot_00`, que contiene fogonazo. Esto no representa un apuntado.
- `src/dd_cinematic_camera.js` y `src/dd_boot.js`: comprueban si el HUB ya está activo antes de llamar a `enter()`, evitando reiniciar su posición o diálogo al finalizar tras la entrada anticipada del plano 10.
- `tools/qa/test_cinematic_fase08.js`: prueba unitaria de skip en los diez planos, idempotencia, entrada anticipada y ausencia de sprite de disparo en planos 08/09.
- `index.html` y `DEADBEAT_DISCO.html`: regenerados con `python3 tools/build_active_html.py`, no editados manualmente.

## Recursos y limitaciones pendientes
Los seis maestros existentes `rebuild_*.png` son 1376×768, no 2560×1440. Son imágenes planas: las capas históricas no son separaciones genuinas de estos maestros y no se superponen sobre ellos. La profundidad multicapa solicitada no está resuelta; no se ha fabricado mediante duplicación o transparencias inventadas. Los fondos y el manifiesto no se han modificado ni regenerado. La galería existente enlaza ahora a `assets/cinematics/preview/player.html`, reproductor independiente que reutiliza `DD_ASSETS` y `DD_CINE`. La preview no carga ni simula el HUB y no reproduce el audio del juego; al terminar muestra un mensaje. La carga tiene un límite de 15 s y puede saltarse. No es una validación de la transición real.

Los sprites oficiales `player_idle_00` y `player_walk_03` siguen con alfa defectuoso; se conserva el paliativo de Fase 07 (`walk_00` como reposo y repetición de `walk_01` como cuarto paso), que no es solución definitiva. La pose de apuntado sin disparo, la mirada y el mecanismo animado de apertura/descenso no tienen recursos oficiales comprobados. La secuencia no muestra la apertura circular del suelo ni una plataforma descendiendo. El fundido hacia el HUB real no demuestra continuidad espacial ni alineación perfecta de cámaras.

El audio existente de arranque invoca `DDC_COVER.music` con fallback sin bloqueo; no se ha implementado la partitura narrativa por planos, la anomalía musical, el ruido de peligro ni sus puntos de sincronización. La bienvenida real del HUB sigue nombrando a «DJ VIRGILIO» y usa terminología heredada; cambiarla infringiría la restricción explícita de no modificar el HUB. Tampoco se ha verificado una estación Archivo real. La señal en pantalla no prueba que la salida física exista ni que el protagonista la siga.

Antes del ajuste de reloj descrito al final, `DD_CINE.update` limitaba la intro a 0,05 s por render: Fase 07 tardó 162,69 s en SwiftShader. El nuevo reloj mejora la duración observada, no la fluidez ni el rendimiento GPU. Continúan pendientes sprites íntegros, calidad/continuidad de animación, audio, señal espacial y mecanismo, parallax auténtico, validación visual completa a 1920×1080, 1600×900 y 1280×720, y validación de rendimiento con GPU física. Las capturas de Fase 07 corresponden a la versión anterior. Las nuevas capturas de `assets/cinematics/evidence/pr17/phase08/shot-01.png` a `shot-10.png` se hicieron en la preview mediante avance artificial del reloj; muestran encuadres aproximados de esta versión, no prueban fluidez ni transición real al HUB.

## Pruebas ejecutadas
- `node --check src/dd_cinematic_camera.js` y `node --check src/dd_boot.js`: OK.
- `node tools/qa/test_cinematic_masters.js`: OK, maestros seleccionados en diez planos y fallbacks sin superponer capas antiguas a maestros.
- `node tools/qa/test_cinematic_fase03.js`: OK en arnés simulado; no demuestra movimiento suave ni continuidad visual.
- `node tools/qa/test_fase06_integration.js`: OK en arnés simulado; no demuestra audio real ni compatibilidad de autoplay en navegador.
- `node tools/qa/test_cinematic_fase08.js`: OK en arnés simulado; no verifica interacción física de ratón o teclado en navegador.
- `git diff --check`: OK.
- `tools/qa/test_cinematic_preview.mjs`: Chromium headless/SwiftShader, ventanas 1920×1080, 1600×900 y 1280×720; carga de 260/260 recursos, inicio, skip por botón y repetición, sin errores de página o respuestas HTTP fallidas. El canvas interno es 1280×720; esta prueba de humo no evalúa composición completa ni fluidez.
- `tools/qa/test_cinematic_fase08_browser.mjs`: en el HTML real con Chromium headless, Escape, espacio y clic terminan la intro con `DD_HUB.isActive()` verdadero y sin cinemática bloqueante; sin errores de página ni respuestas HTTP fallidas. No se ha comprobado interacción posterior ni el número de llamadas reales a `enter()` mediante instrumentación.
- `tools/qa/capture_cinematic_fase08.mjs`: diez capturas de preview a 1280×720 con reloj avanzado artificialmente. No miden duración, fluidez o transición al HUB.
- Se realizó después una prueba completa en navegador en tiempo real (ver secciones posteriores); sigue pendiente validación en GPU física.

**Estado:** implementación parcial; no se declara terminada ni se cumplen todavía los criterios de aceptación de la cinemática definitiva. PR #17 debe permanecer en borrador.

## Ejecución de la preview
Servir la raíz por HTTP y abrir `assets/cinematics/preview/player.html`; reproducir, saltar o reiniciar no inicia una run. La reproducción usa el límite de `dt` del motor real. La galería sigue disponible en `assets/cinematics/preview/index.html`.

## Continuación: movimiento reducido y reproducción real
- La intro mantiene ahora sus 35 segundos **nominales** en `prefers-reduced-motion`: previamente se acortaba a 15,75 s pero los límites de plano seguían fijos, por lo que terminaba durante el plano 05. Se anula el pulso de bombo visual con esa preferencia; no se certifica que todos los movimientos y efectos restantes satisfagan una norma de accesibilidad.
- Si no está disponible `hero_walk_00`, la pose provisional prueba los fotogramas oficiales 00, 01 y 02. No usa como fallback el idle con alfa dañado; si ninguno carga no dibuja el protagonista.
- `node tools/qa/test_cinematic_accessibility.js`: OK en arnés simulado para los diez planos con movimiento reducido y fallback sin idle dañado. Se regeneraron ambos HTML; las pruebas de maestros, Fase 03, Fase 06 y Fase 08 siguen pasando.
- Se ejecutó `tools/qa/test_cinematic_realtime.mjs` en el HTML real, sin adelantar el reloj, Chromium headless a 640×360 con ANGLE SwiftShader. Diez planos en orden, HUB activo en (880, 615), arranque `PLAYING`, sin errores de página o red; 260/260 recursos al comenzar. Duración real **169,793 s**, 1625 intervalos, **9,57 callbacks rAF/s**, mediana 16,7 ms, p95 333,4 ms, p99 416,6 ms, máximo 766,7 ms, 540 intervalos >50 ms. Datos en `assets/cinematics/evidence/pr17/phase08/realtime_metrics.json`. Este resultado confirma que **no se cumple el objetivo de 35 segundos en ese entorno**, no demuestra fluidez y no es una prueba de GPU física. Los tiempos de simulación siguen limitados por el `dt` del render y de la cinemática.
- Repetida la prueba de navegador del HTML real con Escape, espacio y clic: HUB activo, sin secuencia bloqueante y sin errores de página o respuestas HTTP fallidas. No certifica control del jugador ni continuidad visual.

## Continuación: reloj de la introducción

El render del juego limitaba su `dt` a 0,05 s y lo entregaba también a la intro. Ahora `tools/build_active_html.py` pasa por separado el tiempo transcurrido entre renders. Solo la intro lo utiliza, limitado a 0,5 s por actualización para acotar saltos tras una pausa; el HUB, la simulación, la interpolación de cámara y las demás cinemáticas conservan el `dt` anterior. La preview utiliza la misma vía. Si no se suministra el nuevo parámetro, se mantiene el comportamiento anterior. Intervalos superiores a 0,5 s siguen alargando la secuencia; el reloj no genera fotogramas intermedios ni arregla el rendimiento.

- `node tools/qa/test_cinematic_timing.js`: OK, reloj de intro, límite de pausas, fallback y conservación del reloj para otra cinemática.
- Reconstrucción de ambos HTML y pruebas unitarias de Fase 03, Fase 06, Fase 08, maestros y accesibilidad: OK.
- Reproducción real posterior al cambio con `tools/qa/test_cinematic_realtime.mjs` y Chromium headless/SwiftShader 640×360, sin avanzar el reloj: **35,465 s**, diez planos observados en orden, 260/260 recursos, HUB activo en (880, 615), estado PLAYING y sin errores de página o red. Datos completos: `assets/cinematics/evidence/pr17/phase08/realtime_after_clock.json`.
- Rendimiento de esa ejecución: 309 intervalos, **8,71 callbacks rAF/s**, mediana 16,7 ms, p95 366,7 ms, p99 466,6 ms, máximo 666,6 ms y 104 intervalos >50 ms. **La duración mejora; la fluidez no está validada y el renderizado sigue siendo lento en SwiftShader.** No es evidencia de GPU física ni comparación controlada de rendimiento.
- Repetidos los smoke tests de skip con Escape, espacio y clic en el HTML real y de inicio/skip/reinicio de la preview en tres tamaños: OK. No prueban toda la composición ni el control jugable posterior.

## Continuación: control y fallos de recursos

- `DD_CINE` propaga la causa de finalización (`complete` o `skip`) al callback de la intro; `DD_BOOT` registra correctamente un salto como `introEndedBy: skip` en lugar de marcarlo como reproducción completa. El guardián de estancamiento conserva la causa `stalled`. La entrada al HUB sigue protegida frente a duplicados. No se modificó la lógica jugable del HUB.
- `tools/qa/test_cinematic_fase08_browser.mjs`: Chromium headless/SwiftShader, HTML real; Escape, espacio y clic finalizaron con `introEndedBy: skip`, HUB activo y sin secuencia bloqueante ni errores de página/respuestas HTTP fallidas.
- `tools/qa/test_cinematic_hub_control.mjs`: HTML real, skip con Escape y pulsación real de D. El personaje se movió de (880, 615) a (892, 615), con estado PLAYING. En otra carga se interceptó deliberadamente `rebuild_city.png` con HTTP 404: el registro usó `cine_bg01_city.png`, la intro arrancó, el skip llegó al HUB y el personaje se movió de (880, 615) a (894, 615). Dos solicitudes interceptadas (registro y sonda de carga). No hubo errores de página; los 404 fueron deliberados. No se demuestra que todos los recursos o modos de fallo se recuperen, ni el control después de una reproducción natural completa.
- Pruebas unitarias Fase 03, Fase 06, Fase 08, timing, accesibilidad y maestros: OK; HTML regenerados mediante el build.

## Continuación: encuadre y capturas de los planos finales

- En `src/dd_cinematic_camera.js` se redujo el recorte del maestro de presentación en planos 08–10 para conservar suelo visible, y se ajustó la altura del personaje en el plano 10. En el plano 09 el sprite oficial se dibuja después del fondo y del logotipo, para evitar que el oscurecimiento del título apague al protagonista. Se redujo la sombra de contacto ya existente en el plano 08. No se ha modificado ni redibujado ningún sprite ni fondo.
- `tools/qa/capture_cinematic_fase08.mjs` congela el bucle de preview antes de avanzar manualmente el controlador y verifica el tiempo exacto antes de cada captura. Esto evita que la reproducción siga avanzando entre la selección y el guardado. Se regeneraron `shot-01.png` a `shot-10.png`. Son capturas estáticas, no mediciones de rendimiento ni imágenes de la transición al HUB real.
- `node tools/qa/test_cinematic_fase08.js`: OK, incluida la comprobación de orden del protagonista y título. Pasaron también las pruebas de maestros, timing y accesibilidad. El resultado visual se ha revisado en las capturas de 08–10; no se declara verificación de continuidad temporal o GPU.
- Continúan ausentes el mecanismo circular, el descenso representado, el apuntado sin fogonazo y el diseño sonoro narrativo. El fondo sigue siendo plano; este encuadre no se presenta como paralaje real.
