# B4.3 — B2-LC-01 Recovery Event Integrity Audit

**Fecha:** 2026-11-04  
**Rama / HEAD:** `arena/179474d9-deadbeat-disconew` / `ebb5a27422f630c656539fe31ab2b566deedecd9` (sin commit)  
**Clasificación:** causa raíz confirmada en metadatos/eventos de la FSM B2; la transición y el temporizador visual de recuperación sí avanzaban. No se encontró un fallo de scheduler, de hitbox ni de recuperación de combate.

## 1. Alcance y línea base

El análisis se hizo primero sobre el estado B4.2, antes de editar el FSM. Se leyeron los contratos B2/B3, informes B2, B3, B4.1-R1 y B4.2, el FSM ejecutable, los hooks de `Th()`/`Tf()` en el HTML activo y las trazas B4.2 de los cuatro bosses. La suite nueva de B2-LC-01 se ejecutó después contra una copia exacta del FSM pre-corrección y falló en los cuatro fixtures, antes de aplicar el cambio.

- FSM pre-corrección: SHA-256 `fdb726ef7d0116cd0ce38c14702b53ca9741b7c977e880156002ba7c410117ed`.
- HTML activo al inicio y después del cambio B4.3: SHA-256 `ac315b8a44b4104e6a6190bc1f006679180cb707edf3d51e7550e420c7ba0f8a` (sin cambio de B4.3).
- B2 canónica preexistente: 60 assertions; se mantuvo intacta.
- Evidencia de origen: `evidence/B4_2_post_R1/scenario_matrix.json`, `evidence/B4_2_post_R1/b2_lifecycle_reconciliation.json` y `B4_2_POST_R1_AUDIT.md`.
- Reproducción regression-first: `evidence/B4_3_B2_LC01/baseline/`; la salida registra **20 fallos** de asociación/omisión repartidos entre los cuatro perfiles.

No se asumió un identificador de ataque nuevo. Las claves `fan`, `burst`, `ring`, etc. son las claves reales de `Ao`/`pattern71`. En el contrato de auditoría B3, el ataque es `phase.sweep`; en el objeto del scheduler y en los eventos B2, la etiqueta efectiva es `phase: "sweep"` / `detail.pattern: "sweep"`. El objeto `entity.sweep` no contiene un `attackId` ni un ID de ciclo.

## 2. Productores, transmisión, estado y consumidor

1. **Patrones ordinarios:** el selector/`wh()` coloca la clave real en `pattern71`; `Th()` ejecuta el scheduler original y el wrapper B2 que lo llama observa sus entradas/salidas. Para proyectiles, el inicio depende de aceptación real; al limpiar el patrón transmite `attackEnd` con `pattern`, `completed` y `Ao[pattern].recover`.
2. **Sweep:** no pasa por el wrapper de `Th()`. El `Tf()` de juego crea `entity.sweep={a0,dir,arc,t,warn,fire,hitP}` con los valores existentes (`warn=.9`, `fire=1.4`, cola `.3`), lo avanza y lo elimina al completar la cola. El wrapper existente de `Tf()` llama el tick B2 antes del scheduler y notifica los cambios de fase después de este. `syncCombatSignals()` lee ese mismo objeto y sintetiza `attack.start`/`attack.end` al cruzar las ventanas.
3. **Eventos B2:** `pushEvent()` asigna un `seq` monotónico global y guarda eventos en el historial acotado por boss. Antes de B4.3, `recovery.start` de un patrón se emitía al aplicar `attackEnd`; el sweep normal asignaba `rec.recovery` al entrar en su cola, pero no emitía allí su inicio. `recovery.end` se emitía desde `advance()` cuando el mismo contador llegaba a cero.
4. **Identidad y reutilización:** el registro B2 solo mantenía `rec.pattern`, mutable para la señal más reciente, y un contador `rec.recovery`. No retenía la identidad que originó ese contador ni enlazaba el final con el evento de inicio. Al aparecer sweep, `rec.pattern` pasaba a `"sweep"` mientras el recovery anterior seguía contando.
5. **Consumo:** el renderer (`Of()`/`bossAnimation()`) consume la instantánea de estado semántico; el juego no consume en producción el historial de eventos. Los runners QA/B4 y las herramientas de auditoría lo leen mediante `drainEvents()`. Por eso la discrepancia era un defecto verificable del contrato/telemetría B2, no un fallo visual o de ejecución de combate observado.

## 3. Hallazgo de línea base por boss

`Attack ID` usa el ID de auditoría B3; `runtime pattern` es el dato literal que transportaba B2. `recovery.start` y `recovery.end` de la tabla son eventos del ciclo **del sweep** salvo que se indiquen como recuperación anterior. Las horas son segundos de las trazas B4.2 previas a la corrección.

| Boss ID / identidad | Patrón anterior y `recovery.start` real | Attack ID / patrón runtime | `attack.start` → `attack.end` del sweep | Recuperación anterior mal etiquetada | Sweep `recovery.start` | Sweep `recovery.end` (cola .3s) | FSM antes / durante / después |
|---|---|---|---:|---|---|---:|---|
| `pogo` | `fan`, 6.65s, `pattern:"fan"`, duración .80s | `phase.sweep` / `sweep` | 7.55 → 8.95s | 7.40s, salió como `pattern:"sweep"` | **Ausente** | 9.30s, `pattern:"sweep"` | Antes de aviso: `ATTACK`; aviso `TELEGRAPH → WINDUP`; fuego `ATTACK`; al `attack.end` entra `ATTACK_RECOVERY`; cola termina en `DEFENDING`. |
| `matarife` | `burst`, 8.30s, `pattern:"burst"`, duración .95s | `phase.sweep` / `sweep` | 9.20 → 10.60s | 9.20s, salió como `pattern:"sweep"` en el límite del inicio de fuego | **Ausente** | 10.95s, `pattern:"sweep"` | Antes de aviso: `ATTACK_RECOVERY`; aviso `TELEGRAPH → WINDUP`; fuego `ATTACK`; al final `ATTACK_RECOVERY`; cola termina en `DEFENDING`. |
| `traidor` | `burst`, 6.90s, `pattern:"burst"`, duración .95s | `phase.sweep` / `sweep` | 8.25 → 9.65s | 7.80s, salió como `pattern:"sweep"` | **Ausente** | 10.00s, `pattern:"sweep"` | Antes de aviso: `ATTACK_RECOVERY`; aviso `TELEGRAPH → WINDUP`; fuego `ATTACK`; al final `ATTACK_RECOVERY`; cola termina en `DEFENDING`. |
| `nucleo` (`resident:"nucleo"`, boss final) | `ring`, 6.20s, `pattern:"ring"`, duración 1.05s | `phase.sweep` / `sweep` | 7.10 → 8.50s | 7.20s, salió como `pattern:"sweep"` durante el fuego | **Ausente** | 8.85s, `pattern:"sweep"` | Antes de aviso: `ATTACK`; aviso `TELEGRAPH → WINDUP`; fuego `ATTACK`; al final `ATTACK_RECOVERY`; cola termina en `DEFENDING`. |

En la muestra anterior hubo una sola recuperación anterior mal etiquetada por boss, ninguna recuperación de sweep iniciada, y una terminación posterior de la cola por boss. No se observaron duplicados de `attack.start` ni de terminales de ataque. Las trazas fuente-acopladas guardadas están en `evidence/B4_3_B2_LC01/baseline_sweeper_event_traces.json`; el informe y JSON originales de B4.2 se preservan sin cambios.

## 4. Causa raíz verificada

La causa no era una conjetura basada solo en la forma de los eventos:

- Al empezar el sweep, `syncCombatSignals()` sustituía `rec.pattern` por `"sweep"` (línea 276 de la versión activa; el bloque correspondiente en la copia de línea base).
- El temporizador de recuperación del patrón anterior continuaba. Al expirar, `advance()` publicaba `recovery.end` usando el `rec.pattern` actual, no el que originó el timer; por eso cuatro finales del patrón previo aparecían como `sweep`.
- En el camino normal del sweep, al cruzar `warn + fire`, el código publicaba `attack.end`, bajaba `rec.attackActive` a `false` y asignaba el tiempo residual de la cola. La rama posterior al borrar `entity.sweep` solo publicaba `recovery.start` dentro de `if (rec.attackActive)`. Para entonces era `false`, de modo que el inicio normal se perdía, aunque `choose()` veía `rec.recovery > 0`, entraba en `ATTACK_RECOVERY` y `advance()` emitía después el final de la cola.

La regresión nueva reproduce ambos síntomas contra la copia baseline: **20 comprobaciones fallidas**, incluyendo las cuatro atribuciones incorrectas del recovery anterior, los cuatro inicios de sweep ausentes, los cuatro enlaces start/end de sweep y las verificaciones de ciclos consecutivos que dependían de esos enlaces. Salida: `evidence/B4_3_B2_LC01/baseline/regression_stderr.log`.

## 5. Resultado post-corrección y límites

La corrección conserva el scheduler, los valores `warn=.9`, `fire=1.4`, cola `.3`, duración/contador `rec.recovery`, prioridades y grafo FSM. No altera la selección, los proyectiles, hitboxes, daño, cooldowns, fases ni renderer. La FSM ahora conserva el patrón que abrió cada recuperación y enlaza el evento final al `seq` existente de `recovery.start`; no se agregó un `attackId` ficticio ni una FSM/scheduler paralela.

La suite determinista específica recorre Pogo, Matarife, Traidor y Núcleo, patrones consecutivos (incluida repetición de etiqueta), warning/fuego/cola, cancelación antes del fuego, interrupción en fuego, reset, duplicados y eventos residuales: **64/64 PASS** después del cambio; contra baseline falla antes de la corrección. El detalle de los `seq`, tiempos sintéticos y estados está en `evidence/B4_3_B2_LC01/regression_lc01_64.json`.

El resultado del Chromium B4 de diez perfiles y el estado de la matriz completa se registran en `B4_3_B2_LC01_TEST_REPORT.md`. Este audit no declara gameplay natural, fairness ni legibilidad humana: no se hizo playtest humano. Tampoco declara aprobación de B4 completo ni inicia B5/B6/BOSS-T03.
