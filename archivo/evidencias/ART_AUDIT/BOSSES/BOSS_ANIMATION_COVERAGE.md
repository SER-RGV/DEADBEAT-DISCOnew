# DEADBEAT DISCO — Cobertura de animación B2

- **Cobertura de máquina/perfiles:** 10/10 perfiles declarados y 10/10 bosses de combate construidos en navegador (nueve residentes + Núcleo).
- **Cobertura de clips semánticos dedicados:** **PARCIAL**; la FSM no inventa frames.
- **Cobertura de legibilidad/playtest por boss:** **NO VERIFICADO**.

## Cobertura de perfiles de combate

Los perfiles se seleccionan desde `resident` (o `final` para el Núcleo), no desde nombre de atlas. La columna de key solo documenta el registro legacy que ya existe; no autoriza inferir un `artId` estable.

| Boss de combate | ID de perfil FSM | Registro legacy existente | `kind` | Fracción windup visual | Constructor/navegador | Clips dedicados para estados B2 |
|---|---|---|---|---:|---|---|
| Andén | `anden` | `resident_01_anden`, key `boss0` | hunter | 0,30 | Construido; ataque `fan` observado en `Th()` real | Ninguno nuevo; fallback existente |
| Magneta | `magneta` | `resident_02_magneta`, key `boss1` | hunter | 0,30 | Construido | Ninguno nuevo; fallback existente |
| Bufé | `bufe` | `resident_03_bufe`, key `boss2` | pulse | 0,36 | Construido | Ninguno nuevo; fallback existente |
| Cajero | `cajero` | `resident_04_cajero`, key `boss3` | hunter | 0,30 | Construido | Ninguno nuevo; fallback existente |
| Pogo | `pogo` | `resident_05_pogo`, key `boss4` | sweeper | 0,28 | Construido | Ninguno nuevo; fallback existente |
| Oficiante | `oficiante` | `resident_06_oficiante`, key `boss5` | pulse | 0,36 | Construido | Ninguno nuevo; fallback existente |
| Matarife | `matarife` | `resident_07_matarife`, key `boss6` | sweeper | 0,28 | Construido | Ninguno nuevo; fallback existente |
| Imitador | `imitador` | `resident_08_imitador`, key `boss7` | hunter | 0,30 | Construido | Ninguno nuevo; fallback existente |
| Traidor | `traidor` | `resident_09_traidor`, key `boss8` | sweeper | 0,28 | Construido | Ninguno nuevo; fallback existente |
| Núcleo Final | `nucleo` | `resident_nucleo`/`boss9`; perfil runtime final separado | final | 0,40 | Construido como encuentro 100 | Ninguno nuevo en B2; fallback y dispatch existente |

La integración browser cargó el runtime actual y ejecutó `DMO_ART_TEST.gotoCircle(c,true)` + el constructor real `su()` para `c=0…9`. El resultado está en `evidence/B2_animation/browser_integration.json`; los diez `resident`/perfiles coincidieron con la lista esperada. Es prueba de integración de constructores y selección de perfiles, no de que cada combate/pose sea legible.

## Inventario real de clips/fallbacks

| Estado semántico | Ruta de frames actual | Recurso dedicado B2 | Resultado de cobertura |
|---|---|---|---|
| IDLE / OBSERVING / MOVING | Cuatro frames de idle del atlas (`bossN_step0…step3`); movimiento añade transform Canvas leve. | No | Fallback existente compartido. |
| TELEGRAPH / WINDUP | Ciclo `attack` del atlas/dispatch y pulso/anillo procedural; warning textual/suelo original continúa activo. | No | Expresa anticipación sin un clip corporal dedicado. |
| ATTACK | Ciclo attack actual o dispatch HD estable cuando ya resuelve por su `artId` existente. | Parcial por ID estable; no se amplía B2 | La ventana lógica sigue atada a `Th()`/sweep, no al sprite. |
| ATTACK_RECOVERY | Frames idle existentes y pose procedural de recoil. | No | Mecanismo presente; no hay secuencia authored de recuperación. |
| DEFENDING | Frames idle + contorno procedural cuando `addsAlive` activa la mitigación actual. | No | Presentación del estado existente, no nueva defensa. |
| DAMAGED | Frame/fallback hit actual y recoil ligado a `hitFlash`. | Parcial por ID estable | No se creó clip nuevo. |
| STAGGER | Fallback hit solo si el host suministra `_ddaStaggerT`. | No | El motor auditado no emite stagger de boss. |
| PHASE_TRANSITION / ENRAGED | Fallback attack, pulso/anillo procedural; etapa/fase se lee del controlador actual. | No | Señal de presentación, no clip de transición dedicado. |
| DEATH | Colapso/fade/partículas actuales; frame/fallback de renderer existente. | Parcial por ID estable | Queue de muerte actual preservado. |

El registro de combate auditado define idle y attack como ciclos de los mismos cuatro frames del atlas (attack acelera el ciclo); hit utiliza recoil/flash y un frame existente; death usa colapso/fade/partículas. El diagnóstico histórico `dedicatedBossAttackHitDeathArt:false` sigue aplicando al atlas genérico. La FSM no añade archivo de animación ni nuevo atlas.

### T01/T02 y dominio de `artId`

T01/T02 cargan y despachan recursos HD en el dominio de IDs visuales estables. T02 tiene imágenes para estados de Boss 05 (attack/attack1/hit/death), Boss 06 (attack/attack1/hit/death) y Boss 07 (attack/attack1); T01 mantiene el master y frame de ataque de Núcleo que documenta su informe. Los validadores prueban ese dispatch con IDs estables explícitos.

El runtime de campaña también contiene perfiles `resident_01_…resident_09` y el Núcleo. B2 **no** crea una relación entre el elenco narrativo y nombres estables por compartir `bossN` o una posición de atlas; tampoco cambia `artId`, resolver ni assets T01/T02. Por tanto, esta tabla no cuenta los frames HD estables como cobertura dedicada de un residente salvo que el flujo ya haya seleccionado ese ID explícitamente.

## Evidencia por nivel

| Nivel | Comprobación | Alcance/resultado |
|---|---|---|
| Determinista | `test_boss_animation_fsm_b2.js`, 45 assertions | Grafo, prioridades, rutas principales, warnings/recovery existentes, interrupciones, robustez, perfiles, fallback y cleanup. No prueba legibilidad. |
| Integración Chromium | HTML de juego HTTP 200; `ART_PACK` aplicado; nueve residentes + Núcleo construidos; Andén ejecuta `fan` real | Observó `OBSERVING`, `MOVING`, `TELEGRAPH`, `WINDUP`, `ATTACK`; eventos `telegraph.start`, `attack.start`, `attack.end`, `recovery.start`; 0 errores de página y 0 respuestas fallidas de assets locales. Captura `gameplay/B2_live_attack.png`. |
| Regresión visual T01 | 17/17 checks finales | Recursos/dispatch y estados estables siguen pasando. No es playtest de AI ni certifica asignación residente↔artId. |
| Regresión visual T02 | 16/16 checks finales | Cache/assets/dispatch y estados T02 siguen pasando. No es prueba de calidad de animación B2. |
| Combate visual por jugador/bot | No ejecutado | La lectura del peligro, distancia de esquiva, accesibilidad y fairness quedan **NO VERIFICADO**. |
| GPU/performance | No ejecutado | Gate externo sigue **BLOQUEADO**; no se declara rendimiento. |

## Archivos de evidencia

- `deterministic.json`: resultado de 45 assertions.
- `browser_integration.json`: cobertura de diez constructores, muestra real de patrón y eventos, incidencias/respuestas y trazas.
- `gameplay/B2_initial_runtime.png`, `gameplay/B2_live_attack.png`: capturas separadas (no collage).
- `regression/T01/` y `regression/T02/`: informes actuales y capturas de los validadores existentes.
- `prechange_git.txt`, `prechange_source_sha256.txt`: HEAD/rama/worktree y hash de `DEADBEAT_DISCO.ART.html` antes de B2.
- `SHA256SUMS.txt`: hashes de artefactos de B2 y código actual (no incluye el propio manifest).
