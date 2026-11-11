# PR 17 · QA de integración y bloqueos

Estado: **bloqueado**, no entrega artística final. 08C6 permanece en `assets/cinematics/spatial_08c6/` como propuesta no integrada; conserva escena y cámaras 08C5, pero sigue pareciendo una maqueta. El juego mantiene los fondos activos anteriores. No se han sustituido originales ni poses dañadas.

## Cambios comprobables

La intro pausa su reloj con la página oculta y descarta el primer delta al volver; el watchdog no interrumpe la pausa y reinicia su plazo al cambiar la visibilidad. Al terminar se retiran los escuchadores de salto y visibilidad. HTML generado con `python3 tools/build_active_html.py`. No se añade ninguna dependencia. La música WebAudio existente sigue siendo independiente del reloj de la intro: no se ha demostrado sincronización audible ni pausa de audio.

## Pruebas

- Chromium headless/SwiftShader, 640×360, sin manipulación temporal (`tools/qa/test_cinematic_realtime.mjs`): diez planos en orden, 35,932 s de pared, entrada al HUB, 260 recursos cargados de 260 registrados, cero errores HTTP, red o JavaScript. 466 callbacks observados, ~13/s, p95 316,6 ms, máximo 783,3 ms. Este resultado **no demuestra fluidez ni GPU física**; una ejecución anterior tardó 162,69 s bajo carga de software.
- HTML real: Escape, Espacio y clic salieron al HUB; salto durante carga y fallo esencial, transición y movimiento del HUB pasaron. Las pruebas de unidad verificaron idempotencia en diez planos, reloj, pausa simulada, selección de recursos y audio opcional. La pausa no se ha validado con cambio real de pestaña y audio audible.
- Mezclador real: se observaron llamadas de atenuación y salida al HUB; también pasó la prueba sin AudioContext. No se verificó sonido audible ni sincronización de música.
- Visor independiente: arranque, salto y reinicio sin errores a 1920×1080, 1600×900, 1366×768, 1280×720 (DPR 1) y 1280×720 (DPR 2). Canvas interno del visor 1280×720; no es una validación visual completa del juego ni de todos los planos en cada resolución.
- `node tools/qa/test_cinematic_gpu.mjs --help` describe la prueba reproducible en navegador visible con GPU; revisar también `chrome://gpu`, resultado y audio físicamente. Este entorno no tiene `/dev/dri`.

## Recursos pendientes

- Solicitar `player_idle_00.png` y `player_walk_03.png` oficiales íntegros, RGBA 224×320 con alfa limpio y anclaje consistente. La búsqueda de nombres en las 25 ramas remotas disponibles solo halló los mismos blobs dañados (y la variante grounded derivada); se conservan los fallbacks actuales.
- Terminar con calidad final los BG04–06 desde la escena compartida 08C5/08C6 sin alterar su geometría ni cámaras. Los renders 08C6 nativos 2560×1440 no están aprobados para integración.
- La búsqueda por extensiones `.wav`, `.ogg`, `.mp3`, `.m4a` en esas ramas no encontró archivos. Existe música sintetizada WebAudio; no se ha aportado una pista o referencia de sincronización específica para la intro.
- Confirmar rendimiento, escucha y sincronización con navegador y hardware reales antes de cerrar el PR. No sustituir esas pruebas con SwiftShader.
