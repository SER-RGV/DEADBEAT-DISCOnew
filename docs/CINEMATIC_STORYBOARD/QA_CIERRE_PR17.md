# PR 17 · QA de integración y bloqueos

Estado: **bloqueado**, no entrega artística final. La propuesta detallada está en `assets/cinematics/spatial_08c6/propuesta_detallada/`; el 08C6 anterior se conserva. Ninguna se integra en el juego sin aprobación expresa. Las nuevas imágenes mantienen aspecto de escena 3D simplificada y no se acreditan como acabado final. No se han sustituido originales ni poses dañadas.

## Cambios comprobables

La intro pausa su reloj con la página oculta y descarta el primer delta al volver; el watchdog no interrumpe la pausa y reinicia su plazo al cambiar la visibilidad. Al terminar se retiran los escuchadores de salto y visibilidad. HTML generado con `python3 tools/build_active_html.py`. No se añade ninguna dependencia.

El sintetizador existente de portada es **150 BPM**, no 128; su AudioContext se suspende y reanuda al cambiar la visibilidad. Cuando está en marcha, el tiempo de intro usa el reloj del mismo AudioContext y sus efectos rítmicos usan la fase musical. Si falta o autoplay lo bloquea, usa el tiempo de render; al cambiar de fuente se reancla sin saltar. La atenuación sigue las marcas de planos; skip y fin la restauran. El secuenciador existente descarta pasos ya atrasados tras un bloqueo del hilo en vez de dispararlos juntos. No se añaden sonidos ni otro secuenciador. No hay pista específica de intro ni marcas de sus secciones: los cortes no se afirman alineados a un drop; la latencia audible y el comportamiento en hardware real siguen sin validarse.

## Pruebas

- Chromium headless/SwiftShader, 640×360, sin manipulación temporal (`tools/qa/test_cinematic_realtime.mjs`): diez planos en orden, 35,932 s de pared, entrada al HUB, 260 recursos cargados de 260 registrados, cero errores HTTP, red o JavaScript. 466 callbacks observados, ~13/s, p95 316,6 ms, máximo 783,3 ms. Este resultado **no demuestra fluidez ni GPU física**; una ejecución anterior tardó 162,69 s bajo carga de software.
- HTML real: Escape, Espacio y clic salieron al HUB; salto durante carga y fallo esencial, transición y movimiento del HUB pasaron. Las pruebas de unidad verificaron idempotencia en diez planos, reloj, pausa simulada, selección de recursos y audio opcional. La pausa no se ha validado con cambio real de pestaña y audio audible.
- Mezclador real: se observaron llamadas de atenuación y salida al HUB; también pasó la prueba sin AudioContext. `test_cinematic_audio_sync.mjs` comprobó en WebAudio headless que el tiempo de audio y el cinematográfico permanecen inmóviles durante 1,2 s con visibilidad simulada, que reanudan y que skip no detiene la música del HUB. `test_cinematic_beat.js` comprueba uso de fase y fallback. No se verificó sonido audible ni latencia real.
- Visor independiente: arranque, salto y reinicio sin errores a 1920×1080, 1600×900, 1366×768, 1280×720 (DPR 1) y 1280×720 (DPR 2). Canvas interno del visor 1280×720; no es una validación visual completa del juego ni de todos los planos en cada resolución.
- `node tools/qa/test_cinematic_gpu.mjs --help` describe la prueba reproducible en navegador visible con GPU; revisar también `chrome://gpu`, resultado y audio físicamente. Este entorno no tiene `/dev/dri`.

## Recursos pendientes

- Solicitar `player_idle_00.png` y `player_walk_03.png` oficiales íntegros, RGBA 224×320 con alfa limpio y anclaje consistente. La búsqueda de nombres en las 25 ramas remotas disponibles solo halló los mismos blobs dañados (y la variante grounded derivada); se conservan los fallbacks actuales.
- Completar con calidad final y aprobar BG04–06 desde la escena compartida. `propuesta_detallada/galeria.html` muestra tres PNG nativos 2560×1440; `scene.js` y `index.html` son la fuente editable, `club_detallado.glb` una exportación. Se verificaron las 783 mallas anteriores con transformaciones intactas, 1166 mallas finales, tres cámaras idénticas y un solo aro; GLB reimportado con 1166 mallas y tres cámaras. El exportador advierte que omite luz hemisférica y puede alterar dirección de luces; el visor es la referencia. Sigue siendo una propuesta simplificada no aprobada.
- La búsqueda por extensiones `.wav`, `.ogg`, `.mp3`, `.m4a` en esas ramas no encontró archivos. Existe música sintetizada WebAudio; si se exige una banda sonora propia y sincronización narrativa exacta, entregar pista autorizada y sus marcas temporales (inicio, cambios y final). No se ha aportado esa pista.
- Confirmar rendimiento, escucha y sincronización con navegador y hardware reales antes de cerrar el PR. No sustituir esas pruebas con SwiftShader.

## Solicitud de entrega de sprites oficiales

Entregar `player_idle_00.png` y `player_walk_03.png`, PNG RGBA 224 × 320, alfa limpio, silueta completa y pies con el mismo anclaje, escala e identidad visual de la serie oficial. No se solicita redibujar una variante ni reconstruir alfa a partir de una imagen opaca. Hasta recibirlos, `walk_00` sustituye temporalmente el reposo y `walk_01` el cuarto paso; no son equivalentes aprobados.

## Protocolo reproducible GPU y escucha

1. En una máquina con GPU física, pantalla, altavoces o auriculares, servir la raíz: `python3 -m http.server 8000`. Instalar `puppeteer-core` en una carpeta externa (por ejemplo `npm install --prefix /ruta/qa puppeteer-core`). Comprobar en `chrome://gpu` que la aceleración está activa; guardar captura y datos de GPU, sistema y navegador.
2. Ejecutar `DD_CHROME_PATH=/ruta/chromium DD_QA_MODULES=/ruta/qa DD_QA_URL=http://127.0.0.1:8000/index.html DD_QA_OUTPUT=/ruta/qa/gpu.json node tools/qa/test_cinematic_gpu.mjs`. Mantener ventana visible, sin adelantar tiempo ni saltar; registrar duración, orden de los diez planos, errores, FPS y percentiles. Repetir a resoluciones necesarias mediante `DD_QA_WIDTH` y `DD_QA_HEIGHT`. Si el autoplay bloquea audio, este ensayo sigue siendo solo visual.
3. En una segunda carga manual, habilitar la reproducción automática de sonido para el sitio en la configuración del navegador y recargar; registrar si fue posible o si autoplay lo impidió. No pulsar durante la carga: esa interacción puede solicitar el salto. Escuchar sin auriculares desconectados: confirmar una única música, que sus pulsos coinciden con los efectos visibles, y observar las marcas de atenuación en los planos 1–2, 8 y 10. Grabar pantalla con audio del sistema, si las políticas del equipo lo permiten, para comparar pulsos y latencia; anotar dispositivo, captura y limitaciones.
4. Durante una tercera carga, ocultar la pestaña al menos cinco segundos y volver; comprobar que tanto imagen como música se detienen y reanudan, sin doble reproducción. Probar Escape, Espacio y clic en cargas separadas, y confirmar entrada y control del HUB y que la música no queda atenuada. Repetir con audio silenciado/autoplay bloqueado y verificar que no impide el juego.
5. Guardar capturas de los diez planos y métricas con fecha y configuración. Si se usa grabación, conservarla fuera de Git si es grande. Una captura no demuestra sonido, una prueba headless no lo certifica, y una prueba sin GPU física no certifica rendimiento gráfico.

Para regenerar la propuesta: `cd assets/cinematics/spatial_08c6 && npm ci && python3 -m http.server 8000`, abrir `/propuesta_detallada/index.html`, seleccionar cada cámara y guardar PNG o exportar GLB. Este proceso no modifica el manifiesto ni los fondos activos.

Tras conectar la fase de audio se repitió la reproducción completa sin adelanto en 640×360 con SwiftShader: 35,432 s, diez planos en orden, 260/260 recursos, HUB y cero errores observados; ~13,63 callbacks/s, p95 283,3 ms y máximo 733,3 ms. [Métricas crudas](../../assets/cinematics/evidence/pr17/phase08/realtime_audio_sync_swiftshader.json). No reemplaza la prueba con GPU física. Tras el cambio también pasaron los tres skips, salto durante carga y control del HUB.

## Actualización del reloj cinematográfico

Los inicios de planos (segundos desde el inicio) son **0, 3,5, 7, 10, 13,5, 17,5, 21, 24,5, 28,5 y 32**; fin en 35. Las etiquetas `time_range` del manifiesto se corrigieron a minutos y segundos reales. La música de portada tiene 150 BPM (0,4 s por pulso); las fases visuales siguen el secuenciador, pero las marcas no pretenden representar secciones musicales específicas ni todos los cortes caen en un pulso.

Prueba headless con audio habilitado: bloquear realmente el hilo principal 1,8 s mantuvo alineados el avance del reloj de audio y de la intro, sin llamadas observadas para reproducir notas con más de 150 ms de atraso. Visibilidad simulada durante 1,2 s congeló ambos relojes; el salto restauró el mezclador y dejó el HUB activo. No es una prueba audible ni de latencia de altavoces.

Reproducción sin adelanto tras el cambio, Chromium/SwiftShader 640×360: 35,032 s, diez planos en orden, 260/260 activos registrados cargados, HUB, sin fallos de red ni JavaScript, 471 callbacks (~13,44/s), p95 300 ms, máximo 666,6 ms. [Datos](../../assets/cinematics/evidence/pr17/phase08/realtime_audio_clock_swiftshader.json). No valida GPU física ni fluidez. Pasaron los tres skips y skip durante carga, idempotencia, fallbacks, transición y movimiento del HUB. `test_cinematic_viewports.mjs` arrancó el juego real a 1920×1080, 1600×900, 1366×768 y 1280×720, cada una con DPR 1 y 2, con lienzo y botón de salto visibles y sin errores; es un smoke test, no una revisión artística de los diez planos a cada resolución.

Se ensayaron mapas PBR CC0 en la escena existente: los reflejos y texturas cambiaron, pero el resultado seguía pareciendo una nave simplificada. No se conservaron los archivos experimentales ni se integraron como fondos definitivos; la propuesta anterior permanece intacta. La calidad artística requerida sigue sin lograrse y exige trabajo artístico adicional, además de aprobación. Este entorno carece tanto de `/dev/dri` como de `/dev/snd`; no se ha ejecutado prueba de GPU física ni escuchado el audio.
