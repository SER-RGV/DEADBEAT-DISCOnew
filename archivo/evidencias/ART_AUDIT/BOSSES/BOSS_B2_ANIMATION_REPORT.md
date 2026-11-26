# DEADBEAT DISCO — Informe B2: máquina compartida de animación de bosses

- **Fecha:** 2026-11-04
- **Estado técnico B2:** **APROBADO** para el controlador compartido, transiciones, sincronización con señales reales del scheduler, cobertura de perfiles, pruebas deterministas e integración/regresión de navegador.
- **Límite de la aprobación:** cobertura de clips dedicados sigue **PARCIAL**; legibilidad percibida y fairness con jugadores/bots **NO VERIFICADAS**. No se presenta el test de navegador como playtest humano. Gate GPU **BLOQUEADO** y separado.
- **Rama:** `arena/179474d9-deadbeat-disconew`; HEAD inicial: `ebb5a27422f630c656539fe31ab2b566deedecd9`. B2–B6 no se iniciaron antes de esta autorización; tras la entrega solo B2 queda modificada.

## Resumen

Se implementó una FSM semántica compartida de 13 estados, con perfiles para nueve residentes y Núcleo Final. El runtime usa la misma entidad `sr`, el mismo tick de animación y el scheduler `Tf`/`Th`/`wh`/`Ao`. La FSM lee los tiempos y señales de ataque reales; no decide cuándo atacar ni crea una animación que active hitboxes.

En la página de juego real se construyeron los diez perfiles y se observó al Andén recorrer `TELEGRAPH` → `WINDUP` → emisión `ATTACK` usando su patrón `fan` real. La traza registró `telegraph.start`, `attack.start`, `attack.end` y `recovery.start`. El harness detiene la captura al registrar el inicio de recovery; el final de `ATTACK_RECOVERY` se cubre además en la suite determinista. La captura es prueba de integración en Chromium, no de legibilidad humana.

## Implementación

### Arquitectura y prioridad

- Nuevo módulo compartido: `boss_animation_state_machine.js`. Su `WeakMap` guarda un registro de FSM por entidad; no hay nueve controladores ni un segundo game loop.
- Estados: `IDLE`, `OBSERVING`, `MOVING`, `TELEGRAPH`, `WINDUP`, `ATTACK`, `ATTACK_RECOVERY`, `DEFENDING`, `DAMAGED`, `STAGGER`, `PHASE_TRANSITION`, `ENRAGED`, `DEATH`.
- Prioridades implementadas: DEATH 100, PHASE_TRANSITION 90, STAGGER 80, DAMAGED 70, ATTACK 60, WINDUP 50, TELEGRAPH 40, ATTACK_RECOVERY 35, DEFENDING 30, ENRAGED 25, MOVING 20, OBSERVING 10, IDLE 0. La máquina usa grafo explícito de destinos; death es terminal y entradas desconocidas caen a IDLE.
- `ATTACK_RECOVERY` y `ENRAGED` reciben un lugar explícito que no estaba fijado por la propuesta inicial. Una transición con prioridad solo cambia la presentación; nunca cancela un ataque de gameplay.
- `STAGGER` acepta un dato host explícito pero el motor no contiene una mecánica/evento de stagger para bosses; no se ha añadido una.

### Anticipación y sincronización

- El warning absoluto viene de `Ao[pattern].warn`; el perfil del arquetipo solo parte esa misma ventana entre TELEGRAPH y WINDUP. Ratios hunter 0,30, pulse 0,36, sweeper 0,28, final 0,40. No se añade duración al warning ni se cambia el instante de ataque.
- `ATTACK` comienza al observar que `Th()` avanza `patternShot71` después del warning, o al entrar el sweep en su intervalo de fuego. El patrón fan real produjo la señal en la integración.
- `ATTACK_RECOVERY` lee `Ao[pattern].recover`; sweep conserva su cola de 0,30 s. El pulso visual de un ataque de un frame reutiliza el cue existente de 0,28 s.
- `DAMAGED` lee el `hitFlash` que ya escribe `f.bossHit()` por `lu.applyBoss`; `DEATH` entra desde el queue de muerte existente o HP/dead. `PHASE_TRANSITION` detecta cambios reales a volley/berserk y de etapa final.
- `DEFENDING` solo representa `addsAlive > 0` fuera de exposición/ataque, condición que ya activa mitigación; no añade una defensa.

### Recursos visuales

Los estados semánticos se mapean al renderer legado `idle/attack/hit/death`. La anticipación, windup, movimiento, recovery, defensa y fase usan transforms/anillos Canvas sobre frames ya existentes. No se añadieron assets, atlas o nombres de clip ficticios. Cobertura completa por residente y estado en `BOSS_ANIMATION_COVERAGE.md`.

### Cambio imprescindible en HTML

`DEADBEAT_DISCO.ART.html` contiene el juego y el controlador actual en un único script inline; no hay fuente modular paralela/bundle desde el que integrar esta función. Se añadió un `<script>` síncrono para el módulo compartido antes de ese runtime y se conectaron solo los hooks necesarios de tick, consulta/render, `Th`, `Tf`, `bossHit`, death y spawn/reset. No se modificó la resolución visual `artId`, ni se tocó el scheduler/función de ejecución `Th` aparte de observar sus entradas/salidas.

**Sin cambio de balance:** no se modificaron constantes `Ao`, patrones, proyectiles, hitboxes, daño, cooldowns, fase de combate, duración de hazards, `zones.max` B1, resolver, activos T01/T02, HUB, rendimiento GPU ni progresión.

## Pruebas y resultados

### Deterministas

`ART_TOOLS/qa/test_boss_animation_fsm_b2.js` pasa **45 assertions**, incluyendo grafo/prioridad, los 13 estados, ciclo de warning/windup/ataque/recovery, duración por dato `Ao`, daño, stagger host, muerte durante señales, transición de fase, sweep, defensa, enrage, movimiento/dirección/distancia, fallback de clips, artId sin perfil de residente, unknown state/event, reset/cleanup y guardrails source-coupled.

Comandos finales:

```sh
node --check boss_animation_state_machine.js
node --check ART_TOOLS/qa/test_boss_animation_fsm_b2.js
node ART_TOOLS/qa/test_boss_animation_fsm_b2.js
```

Además, se extrajeron y validaron con `node --check` los **10 scripts JavaScript inline** del HTML final (excluidos datos JSON y scripts externos). Los checks de sintaxis y la suite pasaron. Las pruebas T01/T02 posteriores cargaron el HTML final en navegador.

### Integración en navegador con juego real

- HTML HTTP 200; API compartida `DMO.combatArt` v2.87; `ART_PACK` en estado `applied`.
- Nueve residentes y Núcleo construidos desde el constructor del juego; todos eligieron el perfil correspondiente.
- En Andén, patrón real `fan` recorrió `OBSERVING/MOVING`, `TELEGRAPH`, `WINDUP` y `ATTACK`; `Th()` observó la emisión y emitió `recovery.start` según `Ao.recover`. Archivo: `evidence/B2_animation/browser_integration.json`.
- Cero excepciones de página y cero recursos locales fallidos. Persisten dos solicitudes 404 del cargador Cloudflare preexistente `/cdn-cgi/challenge-platform/scripts/jsd/main.js`; ambos validadores las clasifican/ignoran explícitamente. No son fallos de B2.
- Capturas: `gameplay/B2_initial_runtime.png` y `gameplay/B2_live_attack.png`.
- Esta evidencia es **integración real del HTML y un ciclo AI/ataque**, no navegación humana ni fairness. No se ensayaron visualmente todos los diez ciclos de ataque.

### Regresiones

- B1 `zones.max`: suite de regresión reejecutada y pasa (13 escenarios de referencia; assertions ampliadas, incluidas límites por perfil/global, liberación, Núcleo, limpieza y serialización).
- BOSS-T01: **17/17** checks finales; `hitAndAttackStateDispatch` incluido.
- BOSS-T02: **16/16** checks finales; assets, cache y dispatch se mantienen.
- Informes y capturas actuales se conservaron dentro de `evidence/B2_animation/regression/T01/` y `T02/`. No se escribieron encima los históricos B1/T01/T02.

## Incidencias y correcciones durante B2

| Incidencia observada | Corrección/resultado |
|---|---|
| La regresión T01 expuso que un objeto sintético con `artId` estable y sin `resident` no tenía mapa visual de perfil. | Se añadió fallback genérico explícito, sin inferir identidad por `artId`/atlas. T01 final pasa 17/17. |
| Primer trace de gameplay trató el pulso legado `_ddaAttackT=0.28` generado al iniciar el warning como ATTACK, ocultando el nuevo estado TELEGRAPH durante ese pulso. | La FSM ahora da precedencia al warning vivo y solo espejea el pulse para ventanas no telegráficas. El navegador final observó TELEGRAPH y WINDUP antes de la emisión ATTACK real. T01/T02 finales pasan. |
| T02 temporal se intentó una vez con una ruta `OUT` incorrecta fuera del repo. | Se corrigió únicamente el harness temporal; no alteró producto ni evidencia histórica. T02 final pasa. |
| Dos 404 de `/cdn-cgi/.../main.js` en consola. | Scripts de challenge heredados del HTML; los listeners los marcan como ignorados. No hubo errores JS ni fallos de assets locales. |

## Archivos modificados y evidencia

- `boss_animation_state_machine.js` — FSM compartida/runtime.
- `DEADBEAT_DISCO.ART.html` — carga e integración mínima de la FSM en el controlador/render existente.
- `ART_TOOLS/qa/test_boss_animation_fsm_b2.js` — 45 assertions deterministas.
- `ART_AUDIT/BOSSES/BOSS_B2_ANIMATION_REPORT.md` — este informe.
- `ART_AUDIT/BOSSES/BOSS_ANIMATION_STATE_MACHINE.md`.
- `ART_AUDIT/BOSSES/BOSS_ANIMATION_TRANSITIONS.md`.
- `ART_AUDIT/BOSSES/BOSS_ANIMATION_COVERAGE.md`.
- `ART_AUDIT/BOSSES/ANIMATION_AI_AUDIT.md`, `ATTACK_PATTERN_INVENTORY.md`, `BOSS_SYSTEMS_IMPLEMENTATION_PLAN.md` — actualización del estado/relación con B2 sin cambiar sus conclusiones históricas de combate.
- `ART_AUDIT/BOSSES/evidence/B2_animation/` — JSON, capturas, reportes/regresiones, prechange HEAD/worktree/hash y `SHA256SUMS.txt`.

Las modificaciones preexistentes vistas antes de B2 en `ART_BIBLE.md`, `ART_PACK/art_pack.js`, assets T01/E01 y auditorías E01/T03 se dejaron intactas. Se preservó la manifest B1. Como el HTML activo compartido cambia en B2, la entrada `DEADBEAT_DISCO.ART.html` de la manifest SHA histórica de B1 representa su contenido en el corte B1 y no se reescribió para hacerla coincidir con B2; el hash pre-B2 del archivo común queda documentado en `evidence/B2_animation/prechange_source_sha256.txt`.

## Estado final y límites

- **APROBADO:** integración de la FSM compartida, grafo y prioridades deterministas, sincronización con señales del scheduler real, constructor/perfil de 10 bosses, y regresiones T01/T02.
- **PARCIAL:** cobertura de clips dedicados/poses individuales. Los fallbacks están registrados; no se inventó ni reemplazó arte.
- **NO VERIFICADO:** lectura perceptual/fairness por jugadores o bots y recorrido real de todos los ciclos de ataque en cada boss.
- **BLOQUEADO (gate separado):** rendimiento GPU real; no se ejecutó benchmark ni se reclama aprobación por SwiftShader.

B2 termina aquí. **B3, B4, B5 y B6 no se iniciaron.**
