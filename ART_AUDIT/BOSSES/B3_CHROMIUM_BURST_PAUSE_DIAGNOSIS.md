# B3 Chromium — diagnóstico y corrección del fixture de burst

**Fecha:** 2026-11-07  
**Rama / HEAD:** `arena/179474d9-deadbeat-disconew` / `ebb5a27422f630c656539fe31ab2b566deedecd9`  
**Alcance:** diagnóstico de los dos fallos B3 Chromium canónicos durante la selección de `burst`. No se cambió producción ni el runner canónico; no se inicia B5/B6/BOSS-T03.

## Hallazgo

El runner B3 canónico no garantiza que la partida esté reanudada antes de llamar `DMO.debug.tick(.05, 1)`. En la secuencia de setup, la transición QA a `gotoCircle(4, true)` puede dejar abierto el panel real de pausa. En ese estado el juego informa `DMO.read().paused === true`; el tick QA no avanza la simulación ni el scheduler. La aserción posterior espera `burst`, pero observa patrón vacío, `warn=0` y FSM `OBSERVING`.

La reproducción emparejada en Chromium confirma la causalidad:

| Probe | Estado justo antes del tick | Resultado del mismo fixture/tick |
|---|---|---|
| Control no pausado | Panel oculto; `DMO.read().paused=false` | `phaseTimer` 100 → 99.95; `burst`, `warn=.82`, FSM `TELEGRAPH` |
| Reproducción pausada | `#pause-overlay.visible`; botón `REANUDAR` visible/focused; `DMO.read().paused=true` | `phaseTimer` permanece 100; patrón vacío, `warn=0`, FSM `OBSERVING` — mismo síntoma de la aserción canónica |
| Mismo probe después de Escape condicional | Overlay oculto; `DMO.read().paused=false` | El tick idéntico selecciona `burst`, `warn=.82`, FSM `TELEGRAPH` |

Prueba detallada y estados completos: `evidence/B4_3_B2_LC01/b3_pause_probe/repeated/probe_1.json` (control) y `probe_2.json` (pausa → Escape → selección). El resumen del runner está en `b3_pause_probe/repeated/runner_output_2.json`; no hubo errores de página ni fallos locales.

## Relación con los dos intentos canónicos

Los dos intentos canónicos archivados fallan exactamente en la selección de burst y muestran `phaseT=100`, `pattern=""`, `warn=0`, FSM `OBSERVING`. Esas salidas no guardaron `DMO.read().paused`, por lo que no se puede afirmar retrospectivamente que cada intento tuviera el overlay visible. Sí se reprodujo el mismo estado y firma de fallo al pausar, y al reanudar el mismo fixture pasó; el defecto del setup/fixture pausado explica la divergencia entre los intentos canónicos y el resultado pause-safe con alta confianza.

El pase pause-safe previo (`evidence/B4_3_B2_LC01/b3_browser_pause_safe/runner_output.json`) no registró si su condición de Escape se ejecutó. No se usa ese pase por sí solo como causalidad; la prueba emparejada nueva registra el overlay, el flag `paused` y el antes/después de Escape.

## Corrección de QA verificada

Tras la confirmación del usuario para continuar, se corrigió solo `ART_TOOLS/qa/test_boss_telegraph_browser_b3.js`. Antes de forzar burst/spiral, el runner ahora lee `DMO.read()` y la clase visible del diálogo real; si `paused` o el diálogo está activo, pulsa `#resume-btn` (con Escape como fallback), espera `!paused` y registra los estados previo/posterior. También falla con un snapshot explícito si la precondición de juego no queda reanudada. La salida puede aislarse mediante `DMO_B3_OUTDIR` para preservar evidencia anterior.

- **Runner fuente corregido, Chromium: PASS.** Burst (`warn=.82`, `TELEGRAPH`), spiral (`warn=1.1`, `TELEGRAPH`) y las aserciones existentes de cancelación de sweep/volley/berserk pasaron; 0 errores de página y 0 fallos locales. En esa ejecución el juego ya estaba no pausado, por lo que `resumeAction="none"`: `evidence/B4_3_B2_LC01/b3_browser_resumed_canonical/sweep_phase_cancellation.json`.
- **Rama de reanudación forzada: PASS.** Un copy diagnóstico aislado abrió el pause dialog deliberadamente; la guarda observó `paused=true`, pulsó `#resume-btn`, verificó `paused=false` y pasó el mismo suite completo: `evidence/B4_3_B2_LC01/b3_browser_forced_pause/sweep_phase_cancellation.json`. Este copy no modifica el runner canónico.
- Estas ejecuciones posteriores no borran ni reescriben los dos FAIL históricos del runner previo; se conservan en `evidence/B4_3_B2_LC01/b3_browser_canonical/attempts.json`.

No se tocó HTML, FSM B2, scheduler ni gameplay. Los pases se refieren al runner de QA y a sus fixtures controlados, no a playtest humano ni a cobertura natural completa.
