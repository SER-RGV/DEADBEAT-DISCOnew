# B4.1 — Informe de corrección y bloqueo de alcance

**Fecha:** 2026-11-04
**Estado:** **CORRECCIÓN BLOQUEADA — se requiere autorización para ampliar el límite B2.**
**Cambios de producción B4.1:** ninguno. `DEADBEAT_DISCO.ART.html` y `boss_animation_state_machine.js` conservan los SHA-256 del inicio de la revisión.

## Resultado de la reproducción

El riesgo R1 está confirmado en el scheduler real: `Th()` cuenta los intentos de disparo en `patternShot71` aunque cada llamada a `vh()` rechace el proyectil. El patrón puede terminar con el contador esperado y el puente B2 interpretar ese valor como una descarga emitida/completa, aunque no se haya creado ningún proyectil.

El defecto está en la frontera scheduler–FSM: `patternShot71` sirve simultáneamente como contador de avance/cadencia del scheduler y como señal consumida por la integración B2. Corregir solo la condición visual sin separar esas semánticas dejaría el estado de fin/cadencia incoherente; cambiar lo que B2 considera una emisión afecta su contrato.

## Decisión

No se modificó B2, el HTML activo, las cantidades de ataque ni la arquitectura. La instrucción vigente prohíbe tocar B2 sin autorización específica. Por ello R1 se clasifica **CONFIRMADO / BLOQUEADO**, no “corregido”, y B4.1 no se declara aprobado.

R2 (omisión del patrón que no tiene corredor) y R3 (gate de saturación con recuperación tras expirar la carga) se clasificaron intencionales y no requieren corrección. No se cambiaron B1, zonas, patrones, velocidades, daño, cooldowns, renderer, telegraph, `artId`, assets ni HUB.

## Autorización concreta necesaria

Autorizar, si se desea continuar, este alcance acotado:

1. Separar en el scheduler el **número de intentos** del **número de proyectiles aceptados por `vh()`**, manteniendo intacta la cantidad programada y la cadencia actual.
2. Ajustar únicamente la frontera de integración B2/FSM para que inicio/fin/completitud de ataques basados en proyectiles reflejen emisiones aceptadas (incluido el caso de cero aceptaciones y aceptación parcial). Mantener sin cambios la ruta de summon/hazards que no usa `vh()`.
3. Añadir regresiones: cero proyectiles aceptados; aceptación parcial; aceptación completa; fin/cooldown y limpieza; persistencia de las 51 aserciones B2 existentes.
4. No cambiar el grafo de estados, assets, perfiles, balance, límites B1 ni APIs no relacionadas.

Hasta recibir esa autorización no se hará el cambio ni se añadirá una prueba de regresión que deje el árbol de pruebas fallando contra el comportamiento actual.

## Criterio pendiente de cierre B4.1

B4.1 solo podrá aprobarse después de corregir R1 dentro del alcance autorizado, demostrar que las pruebas de regresión nuevas fallan antes/pasan después, y repetir las suites B1/B2/B3/T01/T02 y Chromium B4. Las pruebas de línea base ejecutadas durante esta investigación se detallan en `B4_1_TEST_REPORT.md`; no equivalen a una corrección aprobada.
