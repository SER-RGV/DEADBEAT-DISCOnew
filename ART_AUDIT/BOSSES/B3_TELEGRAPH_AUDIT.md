# B3 — Auditoría de telegraphs y ataques reales

**Estado de la auditoría de código:** **APROBADO**.
**Cierre técnico de B3:** **APROBADO** tras corregir las geometrías autorizadas de `burst`/`spiral` y limpiar `sweep` al cambiar de fase. Las seis zonas se comunican mediante sus objetos visuales independientes; no requieren evento B2 individual. Legibilidad/fairness humana sigue **NO VERIFICADA**.
**Rama/HEAD de inspección:** `arena/179474d9-deadbeat-disconew` / `ebb5a27422f630c656539fe31ab2b566deedecd9`.

## Método y límites

La fuente activa es `DEADBEAT_DISCO.ART.html`, con scheduler inline; el catálogo real es `Ao`, los residentes se declaran en `Ye` y Núcleo Final también tiene su registro distinto `We`. La fuente de ataques es `Th()`/`wh()` y la actualización de sweeps/zonas en `Tf()`/`du()`. La auditoría no asigna ataques ni identidades por el nombre del atlas.

B3 modificó únicamente dos consumidores visuales existentes en `DEADBEAT_DISCO.ART.html`: límites `Ch()` para `burst`/`spiral` y limpieza de `sr.sweep` en los dos umbrales no-finales de fase. No modificó `boss_animation_state_machine.js`, scheduler, patrones, combate ni balance. Los hashes de los ficheros congelados se verificaron tras las pruebas.

**Claves de la matriz:** `C` = señal estática alineada con el área/ventana del scheduler y los estados aplicables; `P` = parcial; `NV` = ciclo natural no reproducido en el navegador para ese jefe. Tras las correcciones, los 42 enlaces se clasifican `C`. Esto valida el contrato fuente, no la legibilidad humana.

## Catálogo común real

Los cinco `Attack ID` siguientes son exactamente las claves de `Ao`; sus tiempos se leen del scheduler, no se recalculan en B3.

| Attack ID real | Perfil del catálogo `Ao` | Inicio/anticipación | Ejecución y área/dirección | Recovery | Telegraph existente / FSM |
|---|---|---|---|---|---|
| `fan` | ABANICO DE BAJOS; `warn=.8`, `shots=5`, `speed=245`, `spread=.64`, `recover=.8` | `wh()` asigna `pattern71`, `patternAim71` hacia la posición del jugador y `patternWarn71=Ao.fan.warn`. | `Th()` emite los cinco proyectiles en el mismo ángulo base guardado, distribuidos por `spread`; `Ch()` marca tres rayos del cono. El área real posterior son proyectiles móviles, no un rectángulo persistente. | `Ao.fan.recover`; `pattern71` se limpia al completarse; los proyectiles conservan su vida propia. | Toast `Pp`, indicador `Ch`, notificaciones B2 `telegraph`/`attackStart`/`attackEnd`; `TELEGRAPH` → `WINDUP` → `ATTACK` → `ATTACK_RECOVERY`. |
| `ring` | ANILLO · BUSCA EL HUECO; `warn=1.05`, `shots=18`, `speed=185`, `gap=1.1`, `recover=1.05` | `wh()` guarda el corredor que devuelve `kh()`/`Eh()`. Si no hay corredor seguro, no inicia el patrón y emite `boss.defer`. | `Th()` emite un anillo radial omitiendo el sector angular `patternGap71`; `Ch()` dibuja anillo y marcas cian del mismo hueco. | `Ao.ring.recover`; luego el scheduler borra el warning; las balas continúan visibles y activas durante su vida. | Pp + anillo/corredor; evento B2 y estados de aviso/ejecución. Cancelar/defer cancela la señal al limpiar el patrón. |
| `spiral` | ESPIRAL DOBLE; `warn=1.1`, `shots=20`, `speed=180`, `step=.115`, `recover=1.15` | Usa el hueco calculado/guardado por `wh()`. | `Th()` emite dos brazos por pasos de `.115`, omitiendo tiros dentro de ±`.62` rad del corredor; `Ch()` marca ahora el hueco con límites ±`.62` rad, iguales al filtro de disparo de `Th()`. No es una zona circular de daño continuo. | `Ao.spiral.recover` después de los pasos de emisión. | Pp + marcas de corredor; telegraph B2 al comienzo y ataque en la primera emisión real. |
| `burst` | RÁFAGA · PASO LATERAL; `warn=.82`, `shots=9`, `speed=265`, `step=.18`, `recover=.95` | Dirección `patternAim71` fijada hacia el jugador al inicio de `wh()`. | `Th()` lanza tres proyectiles por pulso en offsets ±`.115` rad; `Ch()` marca ahora líneas en ±`.115` rad, iguales a los offsets de emisión de `Th()`. | `Ao.burst.recover` cuando concluyen los pasos. | Pp + rayos en `Ch`; transiciones B2 observan las emisiones, no la pose. |
| `summon` | INVOCACIÓN · ROMPE EL BLINDAJE; `warn=1.2`, `shots=2`, `recover=1.2` | Mismo arranque de patrón y warning `Ao`. | `Th()` invoca dos adds mediante `Sh()`. `Sh()` usa el mismo ángulo guardado y radio 190; `Ch()` dibuja los dos puntos/círculos de aparición. El marcador comunica la aparición, no los ataques futuros de los adds. | `Ao.summon.recover`; no se ha añadido un tiempo de ataque de los adds. | Pp + círculos de aparición; B2 detecta la ejecución cuando cambia `patternShot71`. |

### Sweep del perfil `sweeper`

No es una clave inventada de `Ao`: el ataque real se reconoce por `phase="sweep"` y `entity.sweep`. El scheduler crea el objeto con `a0`, `dir` (`±1`), `arc=2.4`, `warn=.9`, `fire=1.4`, `t=0`; el área se calcula como el rayo desde el centro del boss hasta 720 unidades. `Of()` dibuja el sector rojo de anticipación mediante `wf()` y el rayo móvil durante ejecución; el hit-check usa el mismo ángulo/segmento y radio de jugador `ye.r+22`. El intervalo de recuperación/cola existente es `.3` s. B2 observa la ventana `sweep.warn` y el comienzo real de `fire`.

**Causa raíz corregida:** los umbrales de vida asignaban `sr.phase="volley"` o `sr.phase="berserk"` y limpiaban el patrón común, pero no la referencia `sr.sweep`. La rama de update/hit-test solo avanza sweep mientras `phase==="sweep"`, mientras que `Of()` dibuja si existe `e.sweep`; por eso el objeto ya inactivo permanecía visible. Se añadió exclusivamente `sr.sweep=null` en ambos cambios no-finales, junto a la cancelación existente. No se cambió la FSM ni el procesamiento/daño. Chromium verificó en Pogo ambos cambios: `attack.interrupted`, `phase.change`, `sweep=null` inmediatamente y estado B2 `ENRAGED` después del pulso, sin `TELEGRAPH` residual. Evidencia: `evidence/B3_telegraph/sweep_phase_cancellation.json`. La transición de Núcleo ya limpiaba la referencia.

### Zonas persistentes de fuego/electricidad

`zonePattern` usa los datos reales del perfil y el scheduler `Tf()` llama `du()`. Cada zona obtiene el ID runtime `BOSSPAT-*` existente, tipo (`fire`/`elec`), posición, radio, `warn`, `life`, `state:"warn"` y referencia directa `bossZoneOwner72`. `jc.drawZones()` marca el mismo círculo y progreso de warning; el sistema existente lo convierte a `on` cuando termina el aviso. Valores del ataque de zonas del Núcleo: electro radio 126, aviso 1.7 s, vida 3.35 s; fuego radio 122, aviso 1.45 s, vida 3.55 s. Para residentes, las esperas/máximos son los del propio `Ye.zones`.

Auditoría previa de las seis zonas: cada instancia `BOSSPAT-*` se representa directamente desde el objeto del scheduler con su posición, radio y warning. B2 tiene una sola FSM por boss; notificar varias zonas concurrentes como `telegraph` sobrescribiría el patrón anterior y fingiría un ciclo serial. `ih("boss.warn")` es un registro `mo.log`, no un evento B2. No hace falta ampliar/reutilizar la FSM: zona fire/electric se clasifican `C` por su señal visual exacta y autónoma. Concurrencia humana sigue sin verificar. Decisión completa: `B3_ZONE_EVENT_DECISION.md`.

## Datos ausentes / límites explícitos por Attack ID

| Attack ID | Información no representada o límite de señal |
|---|---|
| `fan` | El warning comunica la envolvente angular; no predice trayectorias ni posiciones finales de proyectiles individuales después de la emisión. |
| `ring` | Tras comenzar la emisión, el peligro son proyectiles móviles; el anillo telegráfico no muestra su vida/impacto individual. |
| `spiral` | Corredor de ejecución y límites visuales ahora ±`.62` rad. La coincidencia es estática/Chromium; percepción humana no verificada. |
| `burst` | Límites de señal y emisión ahora ±`.115` rad. La coincidencia es estática/Chromium; percepción humana no verificada. |
| `summon` | Se comunica el spawn de los adds, no sus ataques posteriores ni sus respectivos ciclos. |
| `phase.sweep` | Los umbrales de volley/berserk limpian ahora el sweep no-final junto con el warning; test Chromium ejercita ambos cambios. |
| `zone:fire` / `zone:elec` | Área/warning se dibujan por cada objeto real; la FSM B2 individual por zona no es necesaria (ver `B3_ZONE_EVENT_DECISION.md`). Concurrencia y lectura humana no verificadas. |

## Inventario por jefe y por ataque

Hay **42 enlaces jefe–ataque** en el código fuente activo: 32 enlaces a claves de patrón (incluido summon condicional del Núcleo), 4 sweeps y 6 canales de zonas. **42 C, 0 P y 0 sin señal en auditoría estática**. Los estados C/P reflejan el contrato espacial/FSM de código, no percepción humana. Esto no quiere decir que 42 ciclos se hayan observado jugando: el navegador solo observó naturalmente el ciclo de Andén reutilizado de la evidencia B2; el test nuevo reprodujo un sweep/interrupt de Pogo con inputs QA controlados. El resto de ciclos reales queda **NV**.

| Boss ID real | Arquetipo | Attack ID real y estado de telegraph | Scheduler event / windup / ventana / recovery | Dirección / danger area | Estado B2 / validación específica |
|---|---|---|---|---|---|
| `anden` | `hunter` | `fan` C; `burst` C; `ring` C | `wh()` / Ao warn; emisión/fin observados en `Th()`; recovery de cada Ao. | `fan`/`burst`: aim snapshot; `ring`: gap seguro radial. | B2 identifica los tres patrones; `fan` se ejecutó naturalmente en Chromium con telegraph→attack→end→recovery (evidencia B2). `burst`/`ring` ciclos: NV. |
| `magneta` | `hunter` | `burst` C; `fan` C; `ring` C | `wh()`/`Th()`; Ao timing real. | Cono hacia target; hueco cian del anillo. | Constructor/perfil ya verificado en browser B2; ciclo de ataque de Magneta: NV. |
| `bufe` | `pulse` | `ring` C; `spiral` C; `burst` C; `zone:fire` C | `wh()`/`Th()` para patrones; `Tf()`/`du()` para zona (cada 6.2 s, max 2, `warn=1.45`, `life=3.55`). | Gap; brazos en torno al gap; cono; círculos de fuego de radio 122. | FSM B2 para patrones; zona se dibuja desde `jc` por instancia; no requiere evento individual B2. Ciclos reales: NV. |
| `cajero` | `hunter` | `ring` C; `fan` C; `spiral` C | `wh()`/`Th()`; Ao timing real. | Gap/corredor; aim; dos brazos y corredor. | Constructor B2 verificado; ciclos: NV. |
| `pogo` | `sweeper` | `burst` C; `fan` C; `spiral` C; `phase.sweep` C | `Th()` para patrones; transición ranged→sweep y sweep object en scheduler; `.9` warning, `1.4` fire, `.3` tail. | Conos, gap; barrido orientado por `a0/dir` sobre arco 2.4. | Chromium verifica cancelación por volley y berserk sin residuo; las capturas de patrón usan inputs QA. Ciclos naturales completos: NV. |
| `oficiante` | `pulse` | `summon` C; `ring` C; `spiral` C; `zone:elec` C | `wh()`/`Th()`; zona desde `Tf()`/`du()` (cada 6.6 s, max 2, `warn=1.7`, `life=3.35`). | Puntos de spawn a radio 190; hueco; dos brazos; círculos electro de radio 126. | FSM B2 para patrones; zona visual en `jc` por instancia. Ciclos: NV. |
| `matarife` | `sweeper` | `spiral` C; `burst` C; `fan` C; `phase.sweep` C; `zone:fire` C | Ao + sweep real; `zone:fire` cada 5.6 s, max 3. | Corredor, cono, arco dirigido; zonas circulares de fuego radio 122. | Limpieza sweep cubierta por el test de cambio de fase; zona comunicada por objeto visual independiente. Ciclos: NV. |
| `imitador` | `hunter` | `fan` C; `ring` C; `burst` C | `wh()`/`Th()`; Ao timing real. | Aim, gap, cono radial. | Constructor B2 verificado; ciclos: NV. |
| `traidor` | `sweeper` | `ring` C; `burst` C; `spiral` C; `phase.sweep` C; `zone:elec` C | Ao + sweep real; zona cada 6 s, max 2, `warn=1.7`, `life=3.35`. | Gap, cono, dos brazos, arco sweep; zonas electro radio 126. | Limpieza sweep cubierta por el test de cambio de fase; zona comunicada por objeto visual independiente. Ciclos: NV. |
| `nucleo` | `sweeper`, `final` distinto | `fan` C; `ring` C; `burst` C; `spiral` C; `phase.sweep` C; `summon` C condicional en etapa final; `zone:elec` C (etapa 2); `zone:fire` C (etapa 3) | Patrones por `Th()`; sweep por scheduler existente; etapa 2 genera zonas electro (cada 6.6 s) y etapa 3 fuego (cada 5.35 s). | Aim/gap/cono; arco sweep; celdas circulares dentro del cuarto. | `cu()` limpia sweep/aviso al cambiar etapa. FSM B2 para patrón/sweep; zonas con avisos visuales independientes. Todos sus ciclos reales: NV. |

### Conteo por clase

- **Correctos a nivel de contrato/código:** 42 (32 patrones, 4 sweeps y 6 canales de zona: fuente visual, área y lifecycle del scheduler coinciden). Solo el patrón `fan` de Andén tiene una ejecución natural observada en Chromium.
- **Parciales:** 0. Las 15 discrepancias de área (8 `burst`, 7 `spiral`) y los tres residuos sweep de residentes quedan corregidos y verificados por fuente/integración.
- **Sin señal conocida en el código:** 0 de los 42 enlaces. Esto es conteo de código, no calificación de lectura humana.
- **Ciclos naturales completos de los diez jefes validados:** 0/10 como conjunto; Andén tiene un ciclo natural individual y Pogo una reproducción controlada de cancelación. Los otros ciclos y secuencias quedan **NO VERIFICADOS**.

## Interrupciones, duplicados y residuos inspeccionados

| Escenario | Resultado observado en código/navegador | Estado |
|---|---|---|
| Defer de `ring`/`spiral` por corredor no seguro | `Th()` limpia `pattern71`/warning, reinicia el scheduler y emite `boss.defer`; B2 wrapper notifica `attackEnd(completed:false)`. | Correcto en inspección de fuente; reproducción browser específica: NV. |
| Fin de `fan`/`ring`/`spiral`/`burst`/`summon` | `Th()` termina al emitir sus shots/adds, limpia el patrón y aplica el recovery Ao real; B2 observa cambio y emite end/recovery. Proyectiles vivos conservan su propia representación visual hasta expirar. | Correcto en inspección; natural solo Andén `fan`. |
| Sweep con fire normal | B2 entra a ATTACK al cruzar `warn`; `Of()` interpola la misma dirección y scheduler ejecuta el mismo rayo. | Correcto antes de interrupción; full natural runs NV salvo probe de Pogo. |
| Pogo sweep interrumpido por volley/berserk | Los dos cambios limpian `sr.sweep`; Chromium observa `sweep=null`, `attack.interrupted`/`phase.change` y estado final correcto (`OBSERVING`/`ENRAGED`), sin residuo visual. | **Corregido; prueba Chromium B3 pasa en ambas transiciones.** |
| Núcleo cambia etapa | `cu()` limpia sweep y warning del ataque, usa su phase data existente. | Correcto en inspección de fuente; reproducción live NV. |
| Muerte del boss | El queue de muerte notifica B2 y el encounter quita `sr`/`ir`. Zonas residentes existentes pueden continuar hasta expiración porque siguen siendo peligros reales; final llama `uu()` para limpiar sus zonas de jefe. | Fuente inspeccionada; muerte durante todos los ataques: NV. |
| Concurrencia de varias zonas/patrones | Los records pueden coexistir en sus subsistemas; no hay test live de todos los cruces/contrastes. | **NO VERIFICADO** en gameplay. |

> Se conservan capturas B3 reales del canvas de gameplay para `burst` y `spiral` en `evidence/B3_telegraph/burst_telegraph.png` y `spiral_telegraph.png`. Son ejecuciones del scheduler con selección QA controlada, no playtests humanos ni ciclos naturales de los diez jefes.
