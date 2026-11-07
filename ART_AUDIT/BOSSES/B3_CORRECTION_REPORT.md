# B3 — Informe de corrección y cierre técnico

**Estado final de B3:** **APROBADO** en contrato fuente, regresiones e integración Chromium.
**Legibilidad/fairness para jugadores:** **NO VERIFICADAS**; no se realizó playtesting humano.
**Rama:** `arena/179474d9-deadbeat-disconew`. No hubo commit, merge ni cambios a `main`/`origin/main`.

## Correcciones autorizadas aplicadas

### 1. Dispersión espacial: `burst` y `spiral`

Solo se cambió la función de señal visual existente `Ch()` en `DEADBEAT_DISCO.ART.html`; `Ao`, `wh()`, `Th()` y los patrones del scheduler no se modificaron.

- **`burst`:** `Ch()` marcaba ±0.23 rad, pero `Th()` emite los tres proyectiles en `patternAim71 ± 0.115` rad. Ahora las dos líneas exteriores usan **±0.115 rad**. Corregidos los **8 enlaces** que usan `burst`.
- **`spiral`:** `Th()` omite proyectiles dentro de ±0.62 rad del corredor. `Ch()` marcaba ±0.55 rad. Ahora los dos límites visuales usan **±0.62 rad**. Corregidos los **7 enlaces** que usan `spiral`.

La suite B3 verifica ambos valores del scheduler y los compara con el renderer. Chromium forzó cada patrón mediante el selector/scheduler real, observó el estado `TELEGRAPH` y guardó el canvas de gameplay:

- `evidence/B3_telegraph/burst_telegraph.png`
- `evidence/B3_telegraph/spiral_telegraph.png`

Los inputs de selección fueron de QA; son capturas reales del juego en ejecución, no ciclos naturales ni evidencia humana de legibilidad.

### 2. Sweep cancelado por cambio de fase

**Causa exacta:** el código de los umbrales de vida cambiaba `sr.phase` a `volley` o `berserk` y limpiaba `pattern71`/`patternWarn71`, pero omitía `sr.sweep`. El scheduler ya no avanzaba ni probaba el hit mientras la fase no fuera `sweep`; `Of()` seguía dibujando mientras persistiera el objeto. Se generaba, por tanto, una señal visual residual que ya no correspondía a una ejecución activa.

**Corrección limitada:** se añadió `sr.sweep=null` en los dos cambios no-finales (`volley` y `berserk`), junto a la limpieza existente. No se modificó `boss_animation_state_machine.js`, prioridades, transiciones, scheduler, hit-test, daño ni ventana de combate.

Chromium sobre Pogo verificó ambas transiciones: el sweep se crea con scheduler real; los cambios emiten los eventos B2 existentes de interrupción/fase, limpian la referencia inmediatamente y la FSM no vuelve a `TELEGRAPH` al acabar el pulso. En la transición final, el estado observado fue `ENRAGED`.

Evidencia: `evidence/B3_telegraph/sweep_phase_cancellation.json`.

### 3. Decisión sobre las seis zonas

La auditoría previa a tocar runtime quedó registrada en `B3_ZONE_EVENT_DECISION.md`. Cada zona ya es un objeto scheduler independiente `BOSSPAT-*` con posición, radio, tipo, owner y `warn`; `jc.drawZones()` muestra el warning y su progreso a partir del mismo objeto. No se necesita una notificación individual de FSM: B2 conserva una FSM por boss, así que varios `telegraph` de zonas concurrentes se sobrescribirían en lugar de representar las instancias en paralelo. El `ih("boss.warn")` existente es un registro `mo.log`, no un evento de FSM.

No se amplió B2 ni se añadieron eventos, IDs, timers o schedulers. Los seis enlaces de zona se clasifican `C` por su señal visual individual ya existente. La lectura humana de varias zonas concurrentes sigue sin probarse.

## Estado de la matriz

La prueba fuente-acoplada final enumeró **42 enlaces** —32 patrones, 4 sweeps y 6 canales de zona— y no encontró referencias faltantes: **42 C / 0 P / 0 sin señal**. C significa coincidencia de código/contrato, no que los 42 ciclos se hayan jugado naturalmente.

| Boss ID | Ataques/canales cubiertos | Estado |
|---|---|---|
| `anden` | `fan`, `burst`, `ring` | 3 C |
| `magneta` | `burst`, `fan`, `ring` | 3 C |
| `bufe` | `ring`, `spiral`, `burst`, `zone:fire` | 4 C |
| `cajero` | `ring`, `fan`, `spiral` | 3 C |
| `pogo` | `burst`, `fan`, `spiral`, `phase.sweep` | 4 C |
| `oficiante` | `summon`, `ring`, `spiral`, `zone:elec` | 4 C |
| `matarife` | `spiral`, `burst`, `fan`, `phase.sweep`, `zone:fire` | 5 C |
| `imitador` | `fan`, `ring`, `burst` | 3 C |
| `traidor` | `ring`, `burst`, `spiral`, `phase.sweep`, `zone:elec` | 5 C |
| `nucleo` | `fan`, `ring`, `burst`, `spiral`, `phase.sweep`, `summon` condicional, zonas `elec`/`fire` por etapa | 8 C |

## Validación ejecutada

| Suite | Resultado |
|---|---|
| B3 determinista, `test_boss_telegraph_b3.js` | **PASS — 156 aserciones**, 42 enlaces; 42 C, 0 P, 0 sin señal |
| B3 Chromium, `test_boss_telegraph_browser_b3.js` | **PASS — HTTP 200**; capturas reales `burst`/`spiral`; cancelación en `volley` y `berserk`; sweep eliminado; B2 termina en estado esperado; `pageErrors=[]`, `localFailures=[]` |
| B2 FSM determinista, `test_boss_animation_fsm_b2.js` | **PASS — 51 aserciones**: las 45 anteriores permanecen y se añadieron seis comprobaciones de fase/cancelación (cuatro de ciclo más dos de fuente para volley/berserk). FSM fuente intacta. |
| B1 `zones.max`, `test_boss_zone_max_b1.js` | **PASS** — 13 casos históricos y verificaciones ampliadas; purga de zonas, limpieza de huecos y reset de sala pasan. `zones.max` intacto. |
| BOSS-T01 browser, `validate_boss_tanda_01.js` | **PASS — 17/17**; sin errores de página ni recursos locales fallidos |
| BOSS-T02 browser, `validate_boss_tanda_02.js` | **PASS — 16/16**; sin errores de página ni respuestas locales fallidas |

**Consola/recursos:** Chromium B3 reportó dos mensajes de consola por 404 de `/cdn-cgi/challenge-platform/scripts/jsd/main.js`; ambas respuestas son externas del host local del probe y están identificadas en `ignoredHostResponses`. No hubo fallos de recursos locales. T01 reporta los mismos dos 404 externos y cero respuestas locales fallidas. T02 no instrumenta `console`; no se afirma cero console errors para ese script, pero sí cero page errors y respuestas malas. El test B3 recoge `consoleErrors`, `pageErrors` y respuestas por separado.

El HTML activo devolvió HTTP 200. Se ejecutaron `node --check` en las suites relevantes, hashes de fuentes congeladas y `git diff --check` al cierre.

## Límites del cierre

- No hay playtesting humano. **Legibilidad y fairness: NO VERIFICADAS.**
- No se observaron naturalmente todos los ciclos de los diez bosses. Las dos capturas geométricas usan selección QA; la reproducción de sweep también fija entradas QA.
- No se ejecutó benchmark GPU real ni se atribuyeron resultados de SwiftShader a GPU.
- La FSM B2 no se rediseñó ni se editó; únicamente se amplió su test para el nuevo caso de cambio de fase.
- B1, T01/T02, `zones.max`, `artId`, assets, HUB y balance no se modificaron.
- No se continúa a B4/B5/B6 ni BOSS-T03.
