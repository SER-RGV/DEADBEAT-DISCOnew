# Auditoría de animación y AI de jefes

**Fecha:** 2026-11-04
**Alcance:** auditoría estática del motor actual en `DEADBEAT_DISCO.ART.html`, sus registros de animación y la evidencia de QA existente. No se cambió código de juego, resolver, balance ni recursos visuales.
**Conclusión:** el juego ya tiene un controlador de jefe compartido con patrones y diferencias de residente; no son nueve cerebros independientes. La animación tiene estados y dispatch funcionales, pero los clips específicos por ataque/golpe/muerte no están completos para todo el elenco. La relación entre nombres de residentes y los IDs visuales estables debe tratarse como una decisión de identidad pendiente, no inferirse del índice del atlas.

## Convención de estado

- **IMPLEMENTADO:** el comportamiento o recurso se encuentra expresamente en el código o en QA de integración.
- **PARCIAL:** existe el mecanismo, pero su cobertura o especificidad es limitada.
- **AUSENTE:** no se encontró una implementación correspondiente en las rutas inspeccionadas.
- **NO VERIFICADO:** la lectura estática/evidencia disponible no prueba el comportamiento en ejecución, la justicia o la calidad final.

## AI y comportamiento

| Área | Estado | Hallazgo comprobable |
|---|---|---|
| Selección de encuentros | **IMPLEMENTADO** | `su()` crea el jefe de ronda. La campaña tiene nueve círculos de 11 salas: las salas 11, 22…99 seleccionan los nueve residentes de círculo; la ronda 100 devuelve `We` (Núcleo Final) mediante `aa()`. El arreglo `Ye` también contiene un décimo registro `nucleo` duplicado en `We`; el selector final usa `We`, pero la duplicación de datos debe mantenerse visible al revisar arquitectura. |
| Cerebros distintos por residente | **PARCIAL** | `Ye` aporta datos diferentes (variante, velocidad/HP/ataque, orden de patrones, esbirros, zonas y escalado). El control activo se comparte en `Th()` y en el update de `sr`; las diferencias no son nueve implementaciones de AI independientes. |
| Arquetipos compartidos | **IMPLEMENTADO** | Variantes `hunter`, `pulse` y `sweeper`; el núcleo usa el controlador `final`. Controlan listas de patrones y el comportamiento de persecución/distancia. El constructor tiene valores fallback para encuentros genéricos/de prueba. |
| Movimiento y ciclo de combate | **IMPLEMENTADO** | Entrada con temporizador; fases `chase`, `ranged`, `volley`, `sweep` y `berserk`; el boss persigue o regula distancia según variante, genera esbirros y llama `Th()` para sus ataques. Los cambios de fase de los jefes normales son umbrales de vida compartidos, no árboles narrativos individuales. |
| Telegráficos y adaptación al escenario | **IMPLEMENTADO** | `wh()` anuncia el patrón antes de ejecutarlo. `kh()` busca un corredor candidato y `Eh()` comprueba límites, obstáculos/gaps y zonas activas; un patrón de anillo/espiral se aplaza si el corredor deja de ser seguro. Hay avisos de barrido y de zonas de suelo. |
| Máximo de zonas por perfil | **IMPLEMENTADO (B1)** | `du()` combina los límites globales por tipo (elec 2/fire 3) con `zonePattern.max` del owner exacto; los tipos no consumen capacidad entre sí. El Núcleo sin máximo específico conserva el fallback global. Pruebas B1 documentadas en `BOSS_PHASE_B_REPORT.md`; fairness sigue fuera de esta auditoría. |
| Fases del Núcleo Final | **IMPLEMENTADO** | `cu()` gestiona fases 1–3: fase 2 al cruzar aproximadamente 70% de vida y fase 3 al cruzar 35%. Fase 2 añade zonas eléctricas; fase 3 cambia a fuego y aumenta el multiplicador de ataque. No se propone añadir fases. |
| Combos propios de jefe | **AUSENTE** (como sistema de combos authored) | `patternIndex71` recorre la lista configurada y el Núcleo cambia patrones por fase. No se encontró un sistema general de cadenas/combo de jefe basado en reacción del jugador o en composición de ataques. Esto es distinto del combo del jugador. |
| AI/bot y justicia de encuentros | **NO VERIFICADO** | Los helpers de QA/`DMO_ART_TEST` pueden colocar o invocar bosses para capturas. Los informes T01/T02 verifican arte/render/loader, no decisiones de AI, evasión, tasas de impacto, bloqueo de rutas ni justicia. No se ejecutó bot ni prueba de juego controlada en esta auditoría. |

## Animación, estado y routing visual

| Área | Estado | Hallazgo comprobable |
|---|---|---|
| Estado semántico | **IMPLEMENTADO** | `DMO.combatArt.bossState()` distingue `idle`, `attack`, `hit` y `death`. `Of()` usa ese estado al dibujar; los telegráficos también muestran señales en el sprite. La condición de `attack` detecta señales internas de actividad, no una animación única para cada movimiento. |
| Atlas embebido | **IMPLEMENTADO** | El registro de residentes tiene perfiles `resident_01_anden`…`resident_09_traidor` y `resident_nucleo`, con claves de atlas `boss0`…`boss8` y `boss9`. Idle recorre cuatro frames; el estado attack vuelve a usar esos frames a mayor velocidad (`dedicatedFrames:false`). |
| Golpe/muerte del atlas | **PARCIAL** | Golpe usa recoil/flash procedural y un frame existente; muerte usa colapso/fade y partículas. `dedicatedBossAttackHitDeathArt:false` en el diagnóstico del registro indica que no hay clips dedicados completos en el atlas embebido. |
| Recursos HD y dispatch | **IMPLEMENTADO** para los recursos reportados; cobertura desigual | Los informes T01/T02 documentan masters/estados HD y dispatch en Canvas para IDs estables. T02 reporta diez imágenes añadidas a los IDs de Boss 05–07 y uso de estados nativos cuando falta arte T02. El informe certifica integración visual de sus estados comprobados, no AI ni balance. |
| Un clip/lectura visual distintiva por ataque | **PARCIAL** | `bossState` es de cuatro estados generales. El renderer puede alternar imágenes `_attack`/`_attack1` cuando existen; no codifica una pose distinta por `fan`, `ring`, `spiral`, `burst`, `summon`, barrido o fase. |
| Cobertura final de estados | **PARCIAL** | QA T01/T02 acredita los estados/recursos de las tandas descritas, pero T01 reporta cobertura ilustrada parcial y T02 sigue sin cierre por el gate de GPU separado. El atlas ofrece fallback. |

## Identidades: no confundir registro de combate y nombres visuales

El arreglo de combate `Ye` contiene los nueve residentes de círculo (Andén, Magneta, Bufé, Cajero, Pogo, Oficiante, Matarife, Imitador y Traidor) **más un décimo registro `nucleo`**. `We` vuelve a definir Núcleo Final; `aa(100)` selecciona `We`, no `Ye[9]`. Por tanto, el encuentro final está separado en el selector/runtime, pero el perfil de datos está duplicado en el código. El registro de animación contiene perfiles de residente con claves `boss0`…`boss8`, y Núcleo con `boss9`.

Hay además ocho perfiles visuales estables no finales (`boss_01_djdoom`…`boss_08_djcalavera`) y `boss_09_nucleofinal`. Los perfiles `boss_01`…`boss_08` comparten respectivamente claves `boss0`…`boss7` con residentes; el residente noveno usa `boss8`, que no tiene un perfil estable no-final equivalente en esa lista. El núcleo usa `boss9`. En consecuencia, **compartir una clave de atlas no demuestra que un residente sea ese personaje conceptual**.

`DMO.combatArt.bossId()` prioriza un `artId` reconocido explícito; en su defecto elige final/residente/nombre/círculo. El dispatch HD también reconoce primero un `artId` válido y usa `RESIDENT_TO_ATLAS_BOSS` como fallback legacy. Los informes T01/T02 explican que el resolver de HD se corrigió para dar prioridad a `artId` estable. Esta auditoría no modifica ni certifica una correspondencia diegética entre los dos elencos. Debe acordarse explícitamente antes de proponer reetiquetado o nueva identidad visual.

## Evidencia y límites

- `ART_AUDIT/BOSSES/BOSS-T01_REPORT.md`: QA visual/loader, 17 checks reportados; declara que no se reemplazó lógica de combate.
- `ART_AUDIT/BOSSES/BOSS-T02_REPORT.md`: QA de integración T02, 16 checks reportados, 12 estados capturados y regresión T01 17/17; no es prueba de AI.
- `ART_TOOLS/qa/validate_boss_tanda_01.js` y `validate_boss_tanda_02.js`: validadores de tanda visual.
- `ART_AUDIT/BOSSES/EXTERNAL_GPU_VALIDATION_REPORT.md`: gate de GPU real **BLOCKED**. SwiftShader no cuenta como evidencia de rendimiento GPU.

La inspección es estática y sobre el árbol de trabajo actual, que ya tenía cambios previos. No se ejecutaron pruebas nuevas ni se deduce que cada comportamiento está equilibrado por estar codificado.


> **Corte histórico de Phase A:** la inspección y el estado descritos arriba preceden a la autorización e implementación B2 del 2026-11-04. No describen el estado actual completo del árbol.

## Actualización B2 — 2026-11-04

Se implementó la máquina compartida en `boss_animation_state_machine.js`, integrada mínimamente al runtime existente de `DEADBEAT_DISCO.ART.html`. El informe `BOSS_B2_ANIMATION_REPORT.md` documenta arquitectura, prioridades y validación; `BOSS_ANIMATION_STATE_MACHINE.md`, `BOSS_ANIMATION_TRANSITIONS.md` y `BOSS_ANIMATION_COVERAGE.md` detallan contrato, grafo y cobertura.

La FSM extiende los cuatro estados generales del renderer heredado a 13 estados semánticos y preserva los recursos/fallbacks existentes. No completa los clips dedicados: esa cobertura continúa **PARCIAL**. La prueba determinista pasa 45 assertions; la integración Chromium observó todos los perfiles y el ciclo real de ataque de Andén hasta `recovery.start`; T01 pasa 17/17 y T02 16/16. Esto acredita la integración técnica, no una evaluación humana de legibilidad/fairness. Ese juicio y la calidad perceptual siguen **NO VERIFICADOS**; el gate GPU sigue **BLOQUEADO**.

B2 reutiliza las señales de warning/ataque/recovery y el tick del controlador existente: no implementa AI nueva, clips, patrones ni ajustes de balance. B3–B6 no se iniciaron.
