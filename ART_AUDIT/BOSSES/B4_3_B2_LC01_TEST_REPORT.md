# B4.3 — B2-LC-01 Informe consolidado de pruebas

**Fecha:** 2026-11-04  
**Rama / HEAD:** `arena/179474d9-deadbeat-disconew` / `ebb5a27422f630c656539fe31ab2b566deedecd9` (HEAD sin cambios; trabajo no commit)  
**Alcance:** integridad y asociación de eventos de recuperación B2 en el sweep para Pogo, Matarife, Traidor y Núcleo. El scheduler del sweep, el HTML activo y el comportamiento de combate quedan fuera del cambio.

## 1. Resultado ejecutivo

- **B2-LC-01: PASS, 64/64** tras la corrección; se verificó primero la reproducción con el FSM congelado pre-fix, que dio el **FAIL esperado de 20 comprobaciones**.
- La prueba confirma por los cuatro bosses una única pareja `recovery.start`/`recovery.end` por cola de sweep, con `recovery.end.detail.startSeq` igual al `seq` del inicio, patrón `sweep` y estados de salida limpios. La matriz conserva las secuencias/tiempos deterministas y la reconciliación del Chromium B4: `evidence/B4_3_B2_LC01/sweeper_final_matrix.json`.
- **B4 Chromium canónico: PASS, 10 perfiles**, 0 errores de página y 0 fallos locales. Los cuatro sweeper alcanzan la fase `sweep`. La historia de eventos del runner retiene los últimos 32; el enlace de fin a inicio está registrado en los cuatro perfiles, y los inicios están aún visibles en la ventana final de Pogo y Matarife. Para Traidor y Núcleo la ventana se truncó antes del inicio; el par completo sí queda afirmado por LC-01. Evidencia: `evidence/B4_3_B2_LC01/b4_chromium_canonical/scenario_matrix.json` y `evidence/B4_3_B2_LC01/postfix_b4_event_reconciliation.json`.
- La regresión B3 determinista y las pruebas originales B1/B2/R1/T02 pasaron; T01 pasó en la repetición secuencial. El B3 Chromium previo falló dos veces por una precondición de pausa no comprobada; un probe emparejado lo reprodujo. Se añadió una guarda solo al runner QA, y el runner fuente actualizado pasó B3 Chromium; una variante con pausa forzada también verificó que la rama de reanudación funciona. Los dos fallos históricos se conservan.
- Esto no equivale a aprobar B4 completo ni a validar gameplay natural, fairness o legibilidad humana. No se realizó playtest humano. No se inicia B5, B6 ni BOSS-T03.

## 2. Matriz de resultados

| Suite | Resultado observado | Detalle / limitación | Evidencia |
|---|---|---|---|
| B2-LC-01 contra FSM congelado pre-fix | **FAIL esperado: 20** | Regression-first, antes de tocar producción; fallaron las atribuciones/finales esperados en los cuatro fixtures. Exit 1 es intencional. | `evidence/B4_3_B2_LC01/baseline/regression_exit_status.txt`, `baseline/regression_stderr.log` |
| B1 — zonas/capacidad | **PASS: 13 checks** | 13 escenarios originales; 13 checks ampliados, todos PASS. | `evidence/B4_3_B2_LC01/regression_b1.json` |
| B2 canónica — FSM | **PASS: 60/60** | Suite previa intacta, reejecutada después del cambio. | `evidence/B4_3_B2_LC01/regression_b2_60.json` |
| B2-LC-01 — regresión nueva | **PASS: 64/64** | Pogo, Matarife, Traidor y Núcleo; asociación `startSeq`, secuencias repetidas, cancelación pre-fuego, interrupción durante fuego y reset limpio. | `evidence/B4_3_B2_LC01/regression_lc01_64.json` |
| B3 determinista | **PASS: 156/156** | Suite de telegraph/renderer existente. | `evidence/B4_3_B2_LC01/regression_b3_156.json` |
| B3 Chromium, runner previo a la guarda, intento 1 | **FAIL histórico** | El tick real único no seleccionó burst: Pogo siguió `ranged`, patrón vacío, `warn=0`, FSM `OBSERVING`; falló antes de las aserciones de patrón/render. | `evidence/B4_3_B2_LC01/b3_browser_canonical/attempts.json`, `runner_stderr.log` |
| B3 Chromium, runner previo a la guarda, intento 2 | **FAIL histórico** | Mismo punto de fallo; se conserva como segundo intento, no se sobrescribe ni se oculta. | `evidence/B4_3_B2_LC01/b3_browser_canonical/attempts.json`, `runner_stderr.log` |
| B3 Chromium — runner fuente tras guarda de pausa | **PASS** | Se lee `DMO.read()` y se reanuda explícitamente si hace falta antes del tick; burst y spiral seleccionados, cancelaciones existentes pasan; 0 errores de página/fallos locales. En este run `resumeAction=none`, porque ya estaba reanudado. | `evidence/B4_3_B2_LC01/b3_browser_resumed_canonical/sweep_phase_cancellation.json` |
| B3 Chromium — rama de reanudación forzada | **PASS** | Copy diagnóstico con pausa abierta deliberadamente; detectó `paused=true`, pulsó `#resume-btn`, comprobó `paused=false` y pasó toda la suite. | `evidence/B4_3_B2_LC01/b3_browser_forced_pause/sweep_phase_cancellation.json` |
| B3 Chromium — copia diagnóstica pause-safe | **PASS** | Copia separada del runner; burst y spiral, cancelaciones de sweep por volley/berserk, sin errores de página ni fallos locales. Su salida no registra si la rama condicional Escape se ejecutó; el probe emparejado separado sí muestra una reproducción pausada y que Escape restablece selección burst. No sustituye la suite canónica. | `evidence/B4_3_B2_LC01/b3_browser_pause_safe/runner_output.json`, `sweep_phase_cancellation.json`; `evidence/B4_3_B2_LC01/b3_pause_probe/repeated/probe_1.json`, `probe_2.json` |
| T01 Browser | **Rerun PASS: 17/17** | La ejecución inicial falló solo la muestra del frame idle de `boss_09_nucleofinal` (se capturó `attack`); el rerun secuencial pasó todos los checks. Se conservan ambas salidas. | `evidence/B4_3_B2_LC01/t01_browser/`, `t01_browser_rerun/` |
| T02 Browser | **PASS: 16/16** | Sin fallo local. | `evidence/B4_3_B2_LC01/t02_browser/qa_report.json` |
| R1 determinista | **PASS: 34/34** | Suite previa reejecutada. | `evidence/B4_3_B2_LC01/regression_r1_34.json` |
| B4 Chromium canónico | **PASS: 10 perfiles** | 0 `pageErrors`, 0 `localFailures`; 20 respuestas 404 del endpoint de challenge `/cdn-cgi/` quedan anotadas como ruido externo/ignorado por el runner. Se observan las transiciones de fase `sweep` para los cuatro sweeper. | `evidence/B4_3_B2_LC01/b4_chromium_canonical/scenario_matrix.json` |

**Diagnóstico y follow-up B3 Chromium:** un probe con la misma ruta comparó juego pausado/no pausado. Con `#pause-overlay` visible y `DMO.read().paused=true`, el tick dejó `phaseTimer=100`, patrón vacío y FSM `OBSERVING`; tras Escape, `paused=false` y el mismo tick seleccionó `burst` (`warn=.82`, `TELEGRAPH`). El control no pausado pasó. Esto identifica una precondición de pausa en el fixture, no un defecto del FSM B2. Los logs de los dos fallos originales no guardaron `paused`, así que no se confirma retrospectivamente el estado de cada uno. El runner fuente QA ahora comprueba/repara esa precondición y pasó Chromium; un copy con pausa forzada valida específicamente la rama `#resume-btn`. Se preservan los dos FAIL históricos y se registran por separado los PASS posteriores. Evidencia: `ART_AUDIT/BOSSES/B3_CHROMIUM_BURST_PAUSE_DIAGNOSIS.md`, `evidence/B4_3_B2_LC01/b3_pause_probe/repeated/`, `b3_browser_resumed_canonical/` y `b3_browser_forced_pause/`.

## 3. Reconciliación por sweeper

Las columnas «defecto B4.2» son tiempos de la captura previa al cambio; «LC-01» son tiempos deterministas sintéticos de la suite nueva, no marcas de reloj del Chromium. Los `startSeq` de la última columna pertenecen a la ejecución real B4 por perfil y son referencias guardadas en `recovery.end.detail.startSeq`.

| Boss | Ciclo previo mal atribuido en B4.2 | Sweep B4.2 | LC-01 tras corrección: `recovery.start → recovery.end` | Estado LC-01 | B4 Chromium actual |
|---|---|---|---|---|---|
| Pogo | `fan` inició 6.65s; su fin a 7.40s salió `pattern:"sweep"` | `attack.start` 7.55s → `attack.end` 8.95s; faltaba start de recovery; fin de cola 9.30s | `seq 20 @ 2.35s → seq 23 @ 2.65s`, `startSeq=20` | `TELEGRAPH → WINDUP → ATTACK → ATTACK_RECOVERY → OBSERVING` | fase sweep 6.65s; recovery start visible; fin refiere `startSeq=45` |
| Matarife | `burst` inició 8.30s; su fin a 9.20s salió `pattern:"sweep"` | `attack.start` 9.20s → `attack.end` 10.60s; faltaba start; fin de cola 10.95s | `seq 75 @ 2.35s → seq 78 @ 2.65s`, `startSeq=75` | Igual | fase sweep 8.30s; recovery start visible; fin refiere `startSeq=47` |
| Traidor | `burst` inició 6.90s; su fin a 7.80s salió `pattern:"sweep"` | `attack.start` 8.25s → `attack.end` 9.65s; faltaba start; fin de cola 10.00s | `seq 130 @ 2.80s → seq 133 @ 3.10s`, `startSeq=130` | Igual | fase sweep 6.90s; inicio fuera de la ventana final de 32 eventos; fin refiere `startSeq=49` |
| Núcleo | `ring` inició 6.20s; su fin a 7.20s salió `pattern:"sweep"` | `attack.start` 7.10s → `attack.end` 8.50s; faltaba start; fin de cola 8.85s | `seq 185 @ 2.40s → seq 188 @ 2.70s`, `startSeq=185` | Igual | fase sweep 6.20s; inicio fuera de la ventana final de 32 eventos; fin refiere `startSeq=47` |

La matriz detallada conserva también los `attack.start`/`attack.end` deterministas, los `seq` de los cuatro ciclos, las recuperaciones anteriores correctamente etiquetadas post-fix, los eventos B4 visibles y la salvedad del búfer limitado: `evidence/B4_3_B2_LC01/sweeper_final_matrix.json`. Las trazas vivas B4.2 originales permanecen en `evidence/B4_3_B2_LC01/baseline_sweeper_event_traces.json`.

## 4. Control de alcance y limitaciones

- El cambio de producción B4.3 se limita a la FSM B2 `boss_animation_state_machine.js`; se añadió `ART_TOOLS/qa/test_boss_animation_fsm_b2_lc01.js`. Como follow-up de diagnóstico, solo se endureció el preflight del runner QA B3 `ART_TOOLS/qa/test_boss_telegraph_browser_b3.js`. No se editó el HTML activo, renderer, ni scheduler de sweep.
- SHA-256 FSM congelada: `fdb726ef7d0116cd0ce38c14702b53ca9741b7c977e880156002ba7c410117ed`. SHA-256 FSM corregida: `01de7a1f5c142ddd52bac0b983a57c4826be82f1b9742feaf5e8698dd08e79f2`. SHA-256 HTML antes/después: `ac315b8a44b4104e6a6190bc1f006679180cb707edf3d51e7550e420c7ba0f8a` (idéntico).
- El primer runner B4 instrumentado fue abortado manualmente tras permanecer CPU-bound sin completar; **no se usa como resultado**. El resultado B4 reportado aquí procede exclusivamente del runner canónico de diez perfiles que terminó con exit 0.
- Los navegadores ejecutan escenarios QA con entradas/perfiles controlados; no representan cobertura natural completa de todos los ataques. Las pruebas no establecen legibilidad humana, fairness, ausencia de bugs en todo gameplay ni aprobación global de B4.
- Los dos FAIL históricos de B3 Chromium se conservan. El runner QA ahora chequea/reanuda el panel de pausa; el runner fuente actualizado pasó y una ejecución de copy valida la rama con pausa forzada. Esto corrige el setup de prueba, no el gameplay. No se atribuye causalidad a LC-01.
- No se amplía el alcance a B5, B6 o BOSS-T03.

## 5. Artefactos relacionados

- Auditoría de causa raíz y línea base: `ART_AUDIT/BOSSES/B4_3_B2_LC01_AUDIT.md`.
- Informe de corrección mínima: `ART_AUDIT/BOSSES/B4_3_B2_LC01_CORRECTION_REPORT.md`.
- Hashes/identidad de runners: `evidence/B4_3_B2_LC01/source_hashes.json`.
- Reconciliación B4 post-fix: `evidence/B4_3_B2_LC01/postfix_b4_event_reconciliation.json`.
- Diagnóstico B3 Chromium y ajuste de precondición del runner QA: `ART_AUDIT/BOSSES/B3_CHROMIUM_BURST_PAUSE_DIAGNOSIS.md`; el PASS del runner fuente actualizado y la rama forzada están en `evidence/B4_3_B2_LC01/b3_browser_resumed_canonical/` y `b3_browser_forced_pause/`.
- Lista completa de archivos del alcance/evidencia: `ART_AUDIT/BOSSES/B4_3_B2_LC01_FILE_LIST.txt` (132 rutas).

## 6. Verificación final del repositorio

- Rama: `arena/179474d9-deadbeat-disconew`; HEAD `ebb5a27422f630c656539fe31ab2b566deedecd9`; sin commit ni staging.
- `git diff --check`: PASS. `node --check boss_animation_state_machine.js`, `node --check ART_TOOLS/qa/test_boss_animation_fsm_b2_lc01.js` y `node --check ART_TOOLS/qa/test_boss_telegraph_browser_b3.js`: PASS.
- SHA-256 final FSM: `01de7a1f5c142ddd52bac0b983a57c4826be82f1b9742feaf5e8698dd08e79f2`. HTML activo: `ac315b8a44b4104e6a6190bc1f006679180cb707edf3d51e7550e420c7ba0f8a`, idéntico al hash guardado antes de la corrección B4.3.
- Los datos completos de hash/runner/check están en `evidence/B4_3_B2_LC01/source_hashes.json`. El worktree compartido conserva otros cambios del trabajo previo de arte/BOSS; no se limpió ni se incorporó ese trabajo al alcance B4.3.
