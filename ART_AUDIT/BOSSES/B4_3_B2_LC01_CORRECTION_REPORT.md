# B4.3 — B2-LC-01 Correction Report

**Fecha:** 2026-11-04  
**Rama / HEAD:** `arena/179474d9-deadbeat-disconew` / `ebb5a27422f630c656539fe31ab2b566deedecd9` (sin commit)  
**Resultado:** corrección técnica de asociación de eventos aplicada al FSM B2; ningún cambio de scheduler o de combate.

## Defecto reproducido antes de cambiar producción

La prueba nueva `ART_TOOLS/qa/test_boss_animation_fsm_b2_lc01.js` se ejecutó primero contra una copia del FSM pre-corrección cuyo SHA-256 coincide con la referencia B4.2 `fdb726ef7d0116cd0ce38c14702b53ca9741b7c977e880156002ba7c410117ed`. El runner termina con exit 1 y **20 fallos** a través de Pogo, Matarife, Traidor y Núcleo: el `recovery.end` previo queda etiquetado `sweep`, no existe el `recovery.start` normal del sweep y no se pueden emparejar los finales con su inicio/ciclo. La copia baseline y su salida están en `evidence/B4_3_B2_LC01/baseline/`.

## Cambio mínimo aplicado

Solo se cambió `boss_animation_state_machine.js` (FSM B2) y se añadió el runner de regresión específico. El HTML activo conserva el hash previo; el scheduler y el wrapper `Th()` no se editaron.

1. `pushEvent()` (líneas 118–124) devuelve el mismo objeto de evento que acaba de publicar; conserva su `seq` global ya existente.
2. `beginRecovery()` guarda `recoveryPattern` —la etiqueta fuente de ese timer— y `recoveryStartSeq`, que referencia el `seq` ya asignado a `recovery.start`. No crea un ID artificial de ataque o ciclo.
3. La terminación ordinaria de patrón reutiliza la misma asociación con el `pattern` recibido por `attackEnd` (líneas 194–209). Cuando el recovery llega a cero, `recovery.end` usa la etiqueta capturada y añade `detail.startSeq` igual a `recovery.start.seq` (líneas 364–371), en vez de leer el `rec.pattern` mutable.
4. Al finalizar normalmente la ventana activa del sweep, la rama que ya asignaba el residual de la cola publica exactamente un `recovery.start` cuando `attackActive` pasa de true a false (líneas 283–293). La rama existente de desaparición del objeto también usa el helper si se alcanza por ese camino; la guarda `attackActive` evita duplicar el evento cuando el camino normal ya lo emitió.
5. Las rutas existentes que limpian un recovery (`telegraph`, ataque incompleto, cambio de fase o muerte) limpian también la referencia de asociación (líneas 178–185, 194–209, 220–235). No se emite un inicio falso por cancelación/interrupción.

Los eventos siguen usando `detail.pattern:"sweep"` —la etiqueta runtime preexistente que B3 cataloga como `phase.sweep`—. `recovery.end.detail.startSeq` enlaza con el `seq` del evento inicial; `recovery.start` no recibió otro ID nuevo.

## Invariantes y límites de alcance

- **Sin cambio de tiempo:** se conserva exactamente el valor residual de `max(0, warn + fire + 0.3 - sweep.t)`, el contador `rec.recovery`, el recovery por `Ao[pattern]`, la cola `.3` existente y el mismo punto de expiración. El nuevo helper solo guarda identidad/publica evento.
- **Sin cambio de estado general:** no se modificaron prioridades, transiciones, `choose()`, clips, renderer, patrones ni comportamiento de interrupción/cancelación del scheduler. La entrada/salida FSM de sweep permanece `TELEGRAPH → WINDUP → ATTACK → ATTACK_RECOVERY → estado derivado`; el evento se emite en el mismo update que ya fijaba la recuperación.
- **Sin cambios al HTML activo:** SHA-256 al inicio y al cierre `ac315b8a44b4104e6a6190bc1f006679180cb707edf3d51e7550e420c7ba0f8a`.
- Sin cambios a B1/`zones.max`, B3 telegraph/renderer, resolver `artId`, assets, HUB, tasas/cooldowns, daño, hitboxes, proyectiles, ni arquitectura del scheduler.
- El B2 canónico original permanece intacto en **60 assertions**; la regresión LC01 se mantiene separada.

## Verificación determinista post-corrección

- `node --check boss_animation_state_machine.js`: PASS.
- `node --check ART_TOOLS/qa/test_boss_animation_fsm_b2_lc01.js`: PASS.
- `node ART_TOOLS/qa/test_boss_animation_fsm_b2.js`: **60/60 PASS**.
- `node ART_TOOLS/qa/test_boss_animation_fsm_b2_lc01.js`: **64/64 PASS**, cuatro identidades (`pogo`, `matarife`, `traidor`, `nucleo`), secuencia consecutiva, mismo patrón repetido en casos, relación por `startSeq`, cancelación pre-fuego, interrupción durante fuego, reset limpio y sin duplicados/residuales.
- Evidencia por perfil post-corrección: `evidence/B4_3_B2_LC01/regression_lc01_64.json`.
- Evidencia regression-first: `evidence/B4_3_B2_LC01/baseline/regression_exit_status.txt` (1 esperado), `baseline/regression_stderr.log` (20 fallos), `baseline/boss_animation_state_machine.js` (hash de B4.2).

## Estado de regresiones y aprobación

El informe consolidado `B4_3_B2_LC01_TEST_REPORT.md` contiene los resultados de B1, B2, B3 determinista/Chromium, T01, T02, B4 diez perfiles y R1. B4 Chromium pasó 10 perfiles. Los dos FAIL históricos B3 se reprodujeron con la pausa activa; se corrigió solo el preflight del runner QA para comprobar/reanudar la pausa, y el runner fuente actualizado pasó Chromium; una copia con pausa forzada también verificó esa rama. Se preservan los FAIL previos. Un pase de B2-LC-01 **no cierra B4** ni autoriza fases posteriores. No se realizó validación humana ni se afirma fairness o legibilidad; tampoco se avanza a B5, B6 o BOSS-T03.
