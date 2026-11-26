# DEADBEAT DISCO — Transiciones B2 de animación

**Fuente de verdad ejecutable:** `boss_animation_state_machine.js` (`DEFINITIONS`, `TRANSITIONS`, `PRIORITY`, `RENDER_STATE`). Este documento describe el contrato; si cambia una transición, actualizar la tabla y las pruebas deterministas.

## Transiciones válidas

`DEATH` es terminal. Para el resto, el código enumera explícitamente destinos permitidos en `TRANSITIONS`; la tabla abreviada siguiente detalla las rutas de combate principales y sus interrupciones.

| Desde | Hacia en flujo normal | Interrupciones permitidas | Condición que libera el estado |
|---|---|---|---|
| IDLE | OBSERVING, MOVING, TELEGRAPH, WINDUP, ATTACK, ATTACK_RECOVERY, DEFENDING, ENRAGED | DAMAGED, STAGGER, PHASE_TRANSITION, DEATH | Entra una señal derivada o termina el encuentro. |
| OBSERVING | MOVING, TELEGRAPH, WINDUP, ATTACK, ATTACK_RECOVERY, DEFENDING, ENRAGED, IDLE | DAMAGED, STAGGER, PHASE_TRANSITION, DEATH | Movimiento, scheduler, protección o fin de fase de observación. |
| MOVING | OBSERVING, TELEGRAPH, WINDUP, ATTACK, ATTACK_RECOVERY, DEFENDING, ENRAGED, IDLE | DAMAGED, STAGGER, PHASE_TRANSITION, DEATH | Cesa desplazamiento muestreado o llega otra señal. |
| TELEGRAPH | WINDUP → ATTACK; cancelación → OBSERVING/MOVING | DAMAGED, STAGGER, PHASE_TRANSITION, DEATH | Se agota la parte inicial del warning real o `Th()` cancela patrón. |
| WINDUP | ATTACK → ATTACK_RECOVERY; cancelación → OBSERVING/MOVING | DAMAGED, STAGGER, PHASE_TRANSITION, DEATH | Se agota la fracción final del warning; el scheduler emite el patrón. |
| ATTACK | ATTACK_RECOVERY; otro TELEGRAPH si la AI lo inicia | DAMAGED, STAGGER, PHASE_TRANSITION, DEATH | Termina actividad `pattern71`/sweep o el pulso visual existente. |
| ATTACK_RECOVERY | OBSERVING/MOVING/DEFENDING/ENRAGED/IDLE; nuevo TELEGRAPH | DAMAGED, STAGGER, PHASE_TRANSITION, DEATH | Expira `Ao.recover` o la cola del sweep. |
| DEFENDING / ENRAGED | OBSERVING/MOVING/TELEGRAPH/ATTACK/ATTACK_RECOVERY/IDLE | DAMAGED, STAGGER, PHASE_TRANSITION, DEATH | Cambian adds, exposición, fase berserk o actividad. |
| DAMAGED | Retorno al estado de combate que indiquen las señales todavía activas | STAGGER, PHASE_TRANSITION, DEATH | `hitFlash` existente llega a cero. Un warning/ataque aún activo puede retomarse visualmente. |
| STAGGER | Retorno al estado que indiquen las señales todavía activas | DAMAGED, PHASE_TRANSITION, DEATH | Termina `_ddaStaggerT` del host; B2 no crea stagger de combate. |
| PHASE_TRANSITION | Estado de combate derivado tras el pulso de presentación | DEATH | Termina el pulso visual de 0,28 s; no añade lockout. |
| DEATH | DEATH | Ninguna | Terminal para esa referencia; encuentro nuevo crea otra. |

Todas las parejas permitidas, incluidas rutas menos comunes, se encuentran en el objeto `TRANSITIONS` del módulo. `transition()` rechaza un destino no permitido y registra `transition.rejected`; `resolveState()` convierte estados desconocidos a `IDLE` para evitar bloqueos.

## Jerarquía de prioridad visual

| Orden | Estado | Prioridad numérica | Fundamento de interrupción auditado |
|---:|---|---:|---|
| 1 | DEATH | 100 | Muerte terminal del objeto y queue de muerte existente. |
| 2 | PHASE_TRANSITION | 90 | Cambio de etapa/volley/berserk actual; solo muerte lo desplaza. |
| 3 | STAGGER | 80 | Campo host opcional; no hay stagger activo en el boss actual. |
| 4 | DAMAGED | 70 | Evento `bossHit`/`hitFlash` existente. |
| 5 | ATTACK | 60 | Ejecución/ventana de fuego actual de `Th()` o sweep. |
| 6 | WINDUP | 50 | Última fracción del aviso actual. |
| 7 | TELEGRAPH | 40 | Aviso actual de `wh()`/sweep. |
| 8 | ATTACK_RECOVERY | 35 | Recovery del patrón ya ejecutado. |
| 9 | DEFENDING | 30 | Mitigación existente mientras hay adds y no existe vulnerabilidad. |
| 10 | ENRAGED | 25 | Flag/fase berserk o etapa 3 del Núcleo. |
| 11 | MOVING | 20 | Movimiento observado. |
| 12 | OBSERVING | 10 | Encuentro activo sin señal superior. |
| 13 | IDLE | 0 | Fallback sin combate activo. |

La propuesta original no incluía `ATTACK_RECOVERY` ni fijaba sitio para `ENRAGED`; se insertaron entre estados persistentes y señales transitorias con prioridad explícita. `ATTACK_RECOVERY` es menor que un nuevo aviso, de modo que una nueva decisión del scheduler se muestra inmediatamente. El orden solo resuelve **qué se dibuja**; no cancela ni difiere el patrón real.

## Interrupciones: lo que el motor hace y lo que la FSM solo expresa

- **Daño durante reposo/preparación/ataque:** el renderer pasa a DAMAGED por el `hitFlash` que ya produce `bossHit`. El FSM no limpia `pattern71`, no cancela proyectiles ni altera daño. Al acabar el flash, retorna al patrón/warning aún activo si lo hay.
- **Stagger durante ataque:** puede demostrarse con `notify('stagger')`/`_ddaStaggerT` del host; no existe un evento de stagger de boss en el runtime auditado. No se agrega estado de aturdimiento al combate.
- **Muerte durante cualquier estado:** el evento de death gana todas las prioridades y la referencia queda terminal; el renderer continúa usando el queue de muerte ya existente.
- **Cambio de fase:** el puente de `Tf` detecta volley/berserk y etapas del Núcleo. El pulso visual usa la ventana de arte existente, no cambia `phaseTimer`, `finalPatternTimer` ni `attackTimer`.
- **Ataque interrumpido por el motor:** `Th()` identifica que el patrón se limpió sin completar sus shots y registra `attack.interrupted`; si el motor ya entró a otra fase, el evento de fase tiene precedencia. Ningún mecanismo B2 reanuda la ejecución del patrón.

## Ventanas temporales

`TELEGRAPH` y `WINDUP` consumen conjuntamente el warning real: warning total × `windupFraction` del perfil determina la frontera visual, pero no cambia el total. La fracción restante, el instante de emisión y recovery siguen siendo los de `Ao`/`Th`. El sweep usa sus propiedades `warn`, `fire` y cola de 0,3 s del objeto de combate. Ver valores y patrones en `ATTACK_PATTERN_INVENTORY.md`.
