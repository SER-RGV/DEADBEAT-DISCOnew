# B3 — Informe final de pruebas y evidencia

**B3 técnico: APROBADO.**
**Matriz estática:** **42 enlaces = 42 C + 0 P + 0 sin señal**. C describe coincidencia fuente/contrato; no certifica fairness ni legibilidad humanas.
**Fairness/legibilidad humana:** **NO VERIFICADAS**, porque no se realizó playtesting humano.

## Pruebas deterministas

| Prueba | Resultado | Detalle |
|---|---|---|
| B3 contrato fuente-acoplado | **PASS** | `node --check ART_TOOLS/qa/test_boss_telegraph_b3.js` y `node ART_TOOLS/qa/test_boss_telegraph_b3.js`; **156 aserciones**, 42 enlaces, 10 registros incluyendo el Núcleo final. La salida y matriz completa quedan en `evidence/B3_telegraph/deterministic.json`. |
| B2 FSM determinista | **PASS** | `node ART_TOOLS/qa/test_boss_animation_fsm_b2.js`; **51 aserciones**: se mantienen las 45 previas y se añaden 6 sobre interrupción por fase y cancelación/limpieza de sweep. 13 estados; FSM fuente intacta. Salida: `evidence/B2_animation/deterministic_after_b3_phase_cleanup.json`. |
| B1 `zones.max` | **PASS** | `node ART_TOOLS/qa/test_boss_zone_max_b1.js`; 13 escenarios originales y 13 comprobaciones adicionales. Incluye máximos por tipo/owner, purga real del boss, `clearZones`/huecos, reset de sala y serialización. Ningún valor `zones.max` modificado. |

## Integración Chromium y regresiones

| Prueba | Resultado | Evidencia |
|---|---|---|
| B3 patrones/cancelación de fase | **PASS**, HTTP 200 | `evidence/B3_telegraph/sweep_phase_cancellation.json`: scheduler real selecciona `burst` (`warn=.82`) y `spiral` (`warn=1.1`); ambos entran en `TELEGRAPH`. En Pogo se crean sweeps reales y las fases `volley` y `berserk` producen `sweep=null`, `attack.interrupted`/`phase.change`; tras berserk FSM termina en `ENRAGED`, sin TELEGRAPH residual. `pageErrors=[]`, `localFailures=[]`. |
| B3 capturas | **PASS como evidencia técnica** | Canvas del HTML activo, gameplay visible y renderer real: `evidence/B3_telegraph/burst_telegraph.png`, `spiral_telegraph.png`. Perfil/patrón fue seleccionado con inputs QA; no son playtest ni ciclos naturales. |
| BOSS-T01 | **PASS — 17/17** | `evidence/T01_browser/qa_report.json`; HTTP 200, cero page errors, cero failed responses; loaders/cachés/smoke pasan. Dos 404 externos de `/cdn-cgi/challenge-platform/scripts/jsd/main.js` aparecen como consoleErrors/ignoredResponses; no hubo fallos locales. |
| BOSS-T02 | **PASS — 16/16** | `evidence/T02_browser/qa_report.json`; HTTP 200, cero page errors y cero bad responses; 12 muestras y assets dibujados pasan. El script no instrumenta eventos `console`, así que no se afirma cero console errors por separado. |

**Errores runtime y recursos:** B3 registra dos mensajes de consola asociados a dos respuestas 404 externas de Cloudflare (`/cdn-cgi/challenge-platform/scripts/jsd/main.js`), registradas en `ignoredHostResponses`. No hubo errores de página ni recursos locales fallidos. T01 observa los mismos 404 externos; T02 no registra consola. El HTML activo en `http://127.0.0.1:4173/DEADBEAT_DISCO.ART.html` devolvió 200.

## Verificación fuente y limpieza

- `node --check` pasó en scripts B1/B2/B3/T01/T02 y `boss_animation_state_machine.js`; además, los **10 scripts JavaScript inline ejecutables** extraídos del HTML activo pasaron `node --check`.
- B3 determinista enumera por boss y ataque: 42 enlaces, todos `C`; no falta ningún patrón, sweep ni zona de la matriz.
- Geometría verificada contra el scheduler: `burst` ±0.115 rad y `spiral` corredor ±0.62 rad.
- Cambio de fase volley/berserk verificado en Chromium; test B1 determinista ejecuta las rutas reales de cleanup de zona y room reset.
- `git diff --check`: **PASS**; revisión de whitespace en informes B3 también pasó.
- SHA-256: HTML activo corregido `928a03a53399f808a9c557fe90fcc50b21ba2e2070100cdbf67e862bbe897339`; `boss_animation_state_machine.js` intacta `68910f296b3c736875c45317543ff431103a22bd0d5d9432151306c31b7f9261` (match baseline); test B1 intacto `4eff5e6d236e3493901e568c8ff189811651f8adb3ea27c0c754aa50a3e488e4` (match baseline); test B2 con seis aserciones nuevas `b2f24c4da5db2b85ba3e9ddcd3ed4cb66de84dfe51be121f978b3e80e611dda4`. `zones.max` y test B1 no cambiaron.

## Matriz final

| Boss ID | Attack IDs y clasificación | Total |
|---|---|---:|
| `anden` | `fan` C; `burst` C; `ring` C | 3/3 C |
| `magneta` | `burst` C; `fan` C; `ring` C | 3/3 C |
| `bufe` | `ring` C; `spiral` C; `burst` C; `zone:fire` C | 4/4 C |
| `cajero` | `ring` C; `fan` C; `spiral` C | 3/3 C |
| `pogo` | `burst` C; `fan` C; `spiral` C; `phase.sweep` C | 4/4 C |
| `oficiante` | `summon` C; `ring` C; `spiral` C; `zone:elec` C | 4/4 C |
| `matarife` | `spiral` C; `burst` C; `fan` C; `phase.sweep` C; `zone:fire` C | 5/5 C |
| `imitador` | `fan` C; `ring` C; `burst` C | 3/3 C |
| `traidor` | `ring` C; `burst` C; `spiral` C; `phase.sweep` C; `zone:elec` C | 5/5 C |
| `nucleo` | `fan` C; `ring` C; `burst` C; `spiral` C; `phase.sweep` C; `summon` C condicional; `zone:elec` C etapa 2; `zone:fire` C etapa 3 | 8/8 C |

## Límites de evidencia

- Los diez bosses no han tenido un ciclo natural completo verificado en Chromium. Hay evidencia natural previa de Andén `fan`; los patrones B3 corregidos y Pogo sweep fueron activados con inputs QA controlados.
- No hubo playtesting humano: fairness, legibilidad, anticipación percibida y lectura simultánea de zonas siguen **NO VERIFICADAS**.
- No se ejecutó benchmark GPU real; SwiftShader no se presentó como GPU.
- No se inició B4/B5/B6 ni BOSS-T03.
