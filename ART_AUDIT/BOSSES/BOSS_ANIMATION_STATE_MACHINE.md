# DEADBEAT DISCO — Máquina compartida de estados de animación B2

- **Versión:** `B2-FSM-1.0.0`
- **Resultado técnico:** **APROBADO** en suite determinista y smoke/integración Chromium. La cobertura de clips dedicados y la legibilidad humana siguen parciales/no verificadas; ver `BOSS_B2_ANIMATION_REPORT.md`.

## Propósito y límites

La FSM vive en el módulo compartido `boss_animation_state_machine.js`, cargado por el HTML antes del runtime embebido. El juego conserva el único controlador/scheduler de combate existente (`Tf`/`Th`/`wh` y `Ao`); la FSM observa sus señales y solo selecciona presentación. No programa ataques, no escribe temporizadores de combate y no altera daño, proyectiles, hitboxes, cadencia, fases, cooldowns, patrón ni zonas.

Hay un registro débil (`WeakMap`) por objeto boss, no nueve controladores ni un segundo loop. Los diez perfiles se seleccionan por `resident` canónico; el Núcleo usa `final`/`resident:nucleo`. No se elige perfil comparando nombres de atlas o inventando una relación residente↔`artId`.

## Estados y contrato

`STATES` contiene: `IDLE`, `OBSERVING`, `MOVING`, `TELEGRAPH`, `WINDUP`, `ATTACK`, `ATTACK_RECOVERY`, `DEFENDING`, `DAMAGED`, `STAGGER`, `PHASE_TRANSITION`, `ENRAGED`, `DEATH`.

Cada entrada en `DEFINITIONS` del módulo documenta condición de entrada/salida, duración/fin, prioridad, interrupción, fallback visual y eventos. `TRANSITIONS` enumera los destinos legales; `DEATH` es terminal. Una transición rechazada se registra y no bloquea el scheduler. `resolveState()` convierte una etiqueta desconocida a `IDLE` como fallback seguro.

| Estado | Entrada/fin observados | Prioridad | Interrupción visual | Presentación existente |
|---|---|---:|---|---|
| IDLE | Sin actividad; termina al aparecer señal de combate o entrar en encuentro. | 0 | Sí | Ciclo idle del atlas. |
| OBSERVING | Encuentro activo esperando movimiento/acción; termina al cambiar la señal derivada. | 10 | Sí | Ciclo idle; conserva distancia/dirección del jugador como contexto. |
| MOVING | Desplazamiento muestreado del objeto > umbral; termina al dejar de moverse o llegar señal superior. | 20 | Sí | Ciclo idle y desplazamiento procedural muy leve. |
| ENRAGED | `berserk`, fase berserk o Núcleo en etapa 3; persiste mientras exista esa condición. | 25 | Sí | Ciclo attack existente con la condición del motor. |
| DEFENDING | `addsAlive > 0` y el boss no está expuesto ni atacando; sale al cambiar esos campos. | 30 | Sí | Ciclo idle + contorno procedural; solo representa la mitigación existente por esbirros. |
| ATTACK_RECOVERY | `Th()` completó ataque; sale al expirar `Ao[pattern].recover`; sweep usa su cola existente de 0,3 s. | 35 | Sí | Fallback idle + pose de recuperación procedural. |
| TELEGRAPH | `patternWarn71` / aviso de sweep positivo; termina en la fracción de windup configurada o al empezar/cancelarse. | 40 | Sí | Fallback attack, pulso procedural y aviso original `Pp()`. |
| WINDUP | Fracción final del warning existente; termina exactamente al empezar/cancelarse el ataque. | 50 | Sí | Fallback attack, compresión procedural y warning original. |
| ATTACK | Emisión real detectada en `Th()` (`patternShot71` avanza), patrón activo o sweep en ventana de fuego. | 60 | Sí | Dispatch attack existente; una emisión de un frame conserva solo el pulso visual existente de 0,28 s. |
| DAMAGED | `bossHit` / `hitFlash`; termina cuando expira el mismo `hitFlash`. | 70 | Sí | Fallback hit y recoil original. |
| STAGGER | Solo señal explícita `_ddaStaggerT` de un host; el motor auditado no tiene stagger de boss activo. | 80 | Sí | Fallback hit; no añade aturdimiento de combate. |
| PHASE_TRANSITION | Cambio real a volley/berserk o cambio de `finalStage`; usa el pulso visual existente de 0,28 s. | 90 | Sí, solo muerte la supera | Fallback attack y anillo procedural. |
| DEATH | `_ddaDead`, HP no positivo o evento de death existente; terminal por entidad. | 100 | No | Renderer de muerte existente. |

El orden respeta la propuesta de prioridad para las señales presentes y añade `ATTACK_RECOVERY`/`ENRAGED` con precedencia explícita. `PHASE_TRANSITION` es la prioridad visual de B2, pero no pausa ni reemplaza un ataque del scheduler. Daño, fase y muerte pueden cambiar la pose aunque el objeto conserve su patrón de combate.

## Perfiles, identidad y clips

El módulo declara perfiles para los nueve `resident` de círculo y uno separado para `nucleo`. Cada perfil expone `kind`, `windupFraction`, mapa semántico→renderer legado y lista `dedicatedClips`. La diferencia temporal de anticipación es por arquetipo ya configurado (`hunter` 0,30; `pulse` 0,36; `sweeper` 0,28; `final` 0,40); la **duración absoluta siempre deriva del ataque real**, no de un timer universal.

Cada perfil tiene un mapa explícito a los cuatro render states que ya existen (`idle`, `attack`, `hit`, `death`). Los perfiles B2 no declaran clips dedicados nuevos: `dedicatedClips=[]`. Los cues proceduralmente dibujados (escala/traslación/anillo) son transforms Canvas sobre el sprite actual, no assets ni clips.

Las claves `boss0`…`boss8`/`boss9` y los registros de `artId` estable se mantienen intactos. Los frames T01/T02 para IDs estables siguen en sus dispatch actuales; no se hace un mapping nuevo de residentes usando el índice del atlas. La cobertura por recurso real está en `BOSS_ANIMATION_COVERAGE.md`.

## Integración y eventos

- `Tf` llama `FSM.update(sr, dt, {patterns: Ao, player})` desde el tick compartido ya existente.
- El wrapper existente de `Th()` informa `TELEGRAPH` cuando `wh()` armó el patrón; informa `ATTACK` al avanzar `patternShot71`; informa fin/interrupción cuando el scheduler limpia el patrón. No invoca `vh()` ni cambia `Ao`.
- El mismo límite de update reconoce cambios a volley/berserk y etapas del Núcleo para `PHASE_TRANSITION`.
- `lu.applyBoss()` ya llama `f.bossHit()`; esa ruta ahora informa `DAMAGED`. El queue de muerte existente informa `DEATH`.
- `su()` reinicia el registro para una entidad nueva. `WeakMap` no retiene bosses muertos; `reset(entity)` y `clear()` están disponibles para limpiar explícitamente.
- El API compartido `DMO.combatArt.bossAnimation(entity)` expone el estado semántico; `bossState(entity)` conserva su contrato legado de `idle/attack/hit/death` para T01/T02 y renderers actuales.

Los eventos de `describe()` incluyen transiciones, warning, inicio/fin/interrupción de ataque, recovery, daño, stagger, fase y muerte. El historial es acotado (32 eventos por boss) y no conserva referencias fuera del `WeakMap`.

## Duraciones sincronizadas

- `TELEGRAPH` + `WINDUP` particionan el warning del `Ao[pattern].warn` que ya consume `Th()`. Valores actuales en el inventario: fan 0,80 s; ring 1,05 s; spiral 1,10 s; burst 0,82 s; summon 1,20 s. No se cambian.
- El ataque comienza por la emisión existente observada en `Th()`; no por una pose.
- `ATTACK_RECOVERY` recibe `Ao[pattern].recover`, no una duración B2 universal. El sweep conserva warn 0,90 s, fuego 1,40 s y cola 0,30 s existente.
- El pulso de pose único de 0,28 s y `hitFlash` se reutilizan de los hooks existentes. El tiempo de recovery de combate del scheduler no se modifica.

La máquina solo expresa lo que ya sucede: no crea hitboxes, no prolonga ataque lógico y no dispara proyectiles.
