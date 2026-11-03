# INFORME DE QA VISUAL Y TÉCNICO — FASE 1 · TANDA 01

> Clasificación obligatoria por comprobación: **VERIFICADA / PARCIALMENTE VERIFICADA / NO VERIFICADA / FALLIDA**.
> Se distingue explícticamente entre **resultados heredados** (ejecuciones anteriores a este cierre) y **comprobaciones nuevas** (validación limpia de este cierre).

## 1. Entorno y método

| Dato | Valor |
|---|---|
| Navegador | Chromium headless 153 (`@sparticuz/chromium 153.0.0` + `playwright-core 1.64.1`) |
| Render | SwiftShader por software, sin GPU ni `DISPLAY` |
| Resolución | 1280×900 |
| Servidor | `http://127.0.0.1:8123` (HTTP 200; build 13.381.028 B, paquete 9.213 B) |
| Capturas | `Page.captureScreenshot` por CDP (`shot()` de `/home/user/qa_tools/lib.js`); `page.screenshot` es inviable con animación continua |
| Builds comparadas | `v9_t3_fase1b_cache_probe.html` (**antes**) y `DEADBEAT_DISCO.ART.html` (**después**) |
| Secuencia | carga → HUB (clic/Enter/ESC 2,8 s) → `DMO_HUB.startCampaignFromHub(0)` → `r0` → movimiento `d` → disparo → captura |
| Instrumentación | solo lectura: parche de `Array.prototype.push` para detectar entradas en `wa` (proyectiles **del jugador**) y contador de rAF |

**No se han realizado pruebas manuales GUI** (entorno sin display). No se simulan capturas ni logs.

## 2. Validación limpia — COMPROBACIÓN NUEVA (este cierre)

Script: `ART_TOOLS/qa/validate_tanda_01.js`, ejecutado **sin `ROOM_CAPTURE`** (`roomCaptureEnabled:false` en ambas builds). Log: `ART_EVIDENCE/tanda_01/validation.json`. Ejecución completada con `exit_code 0`.

| Métrica | ANTES (original) | DESPUÉS (build con arte) |
|---|---|---|
| Carga HTTP+boot `loadMs` | 10.336 ms | 27.975 ms |
| Transición a campaña | `completed:true`, 9 polls, **3.090 ms** | `completed:true`, 8 polls, **40.551 ms** |
| `tick30Ms` (30 ticks de simulación) | 3,7 ms | 5,8 ms |
| `framesIn2s` / FPS medidos | 0 / 0 | 4 / 2 |
| `pageerror` | 0 | 0 |
| Errores de consola | 2 (404 Cloudflare) | 2 (404 Cloudflare) |
| HTTP ≥400 | 2× `/cdn-cgi/…/main.js?ray=…` | 2× `/cdn-cgi/…/main.js?ray=…` |
| Movimiento (`Δpx`) | **+252** | **+259** |
| Disparo (`ΔshotsFired`) | **+1** | **+1** |
| Proyectiles del jugador entrando en `wa` | **+1** | **+1** |
| `DMO_ILT.audit()` | 11/11 loaded, 0 errores | 11/11 loaded, 0 errores |
| `DMO_REFERENCE_ROOM_ASSETS.state()` | v5Ready 100/100, 0 errores | v5Ready 100/100, 0 errores |
| `__T3B.enabled` | `false` (pintor `original`) | `true` (pintor `candidate`) |
| `__T3B.draws` | `choice:'original'` | **`choice:'candidate'` con `src` de `ART_ASSETS/` en rutas `campaign` y `hub`** |
| `DMO_ART_PACK.integrity()` | no aplicable | **`status:applied`, 0 errores, 8/8 `applied/live/exactSize`=true** |

### Integridad de los 8 assets (lectura de los registros vivos, no solo del archivo)

| ID | applied | live | exactSize | natural |
|---|---|---|---|---|
| `t3b_material_00` | true | true | true | 512×512 |
| `t3b_material_01` | true | true | true | 512×512 |
| `t3b_material_02` | true | true | true | 512×512 |
| `hub_fox_crest_emblem` | true | true | true | 560×332 |
| `decor_neon_rug` | true | true | true | 456×243 |
| `decor_potted_palm` | true | true | true | 209×147 |
| `boss_01_anden` | true | true | true | 400×386 |
| `weapons/weapon_m1911.png` | true | true | true | 160×87 |

### Clasificación de la validación limpia

| Comprobación | Clasificación | Evidencia |
|---|---|---|
| 8 archivos existen, decodifican, dimensiones/alpha correctas | **VERIFICADA** | `manifest.json` + decodificación Pillow |
| Los 8 están registrados en los loaders reales del motor | **VERIFICADA** | `integrity()` 8/8, `__T3B.draws` `candidate`, ILT 11/11, V5 100/100 |
| Render en escenario (suelos HUB y `r0`, emblema) | **VERIFICADA** | capturas `despues_01_hub.png`, `despues_03_campaign.png` |
| Sin errores JS nuevos | **VERIFICADA** | 0 `pageerror`, 0 errores nuevos de consola, 2×404 esperados intactos |
| Movimiento, disparo y proyectil en `wa` conservados | **VERIFICADA** | +252/+259 px, +1/+1 disparo, +1/+1 proyectil |
| Transición HUB→`r0` completada con control recuperado | **VERIFICADA** | `completed:true` en ambas builds |
| Carga sin recursos faltantes | **VERIFICADA** | 0 errores en `__T3B.errors`, `ILT.errors`, `DDM_REF.errors`; sólo 2×404 externos |
| **Rendimiento comparable / sin degradación identificable** | **PARCIALMENTE VERIFICADA** | ver §4 |
| Pruebas manuales GUI | **NO VERIFICADA** | sin `DISPLAY` |
| Mando físico / gamepad | **NO VERIFICADA** | sin dispositivo |
| HUD en resoluciones adicionales | **NO VERIFICADA** | solo 1280×900 |
| Animación del protagonista fotograma a fotograma | **NO VERIFICADA** | fuera del alcance de la Tanda 01 |

## 3. Resultados HEREDADOS (ejecuciones anteriores, no nuevas)

Se conservan para trazabilidad; **no se presentan como resultados de la validación limpia**.

| Resultado heredado | Origen |
|---|---|
| 8/8 `applied/live/exactSize` en **3 ejecuciones**, orden normal e invertido | `validation_run1.json`, `validation_run2_roomcapture.json`, `validation_reverse.json` |
| Diferencia de píxeles antes/después: HUB **43,0 %**, campaña **70,0 %**, post-acciones 61,8 % | comparación Pillow sobre las 6 capturas 1280×900 |
| Movimiento +402 / +398 px; +3 disparos; 3 proyectiles en `wa` | `validation_run2_roomcapture.json` |
| Diferencia de carga correlacionada con el **orden de sesión**, no con el lote (invirtiendo el orden se invierte la diferencia) | `validation_reverse.json` |
| `tick(0.016,30)` = 4,0 / 3,5 / 4,5 ms con `__T3B.enabled` true / false / true | `perf_probe.json` |
| Transición completada en 7 polls con picos aislados de `evaluateMs` 590 ms | `transition_probe.json` |
| `__T3B.roomCapture()` tarda **47.516 ms** con texturas detalladas; sin esa llamada la campaña tarda **3.214 ms** | `roomcapture_probe.json` |
| 0 `pageerror`, 2 errores 404 Cloudflare, 0 `transitionErrors` | todos los logs |

## 4. Rendimiento: qué se puede y qué no se puede afirmar

**Observación honesta:** en la validación limpia los tiempos de la build con arte son peores (`loadMs` 27,9 s vs 10,3 s; transición 40,5 s vs 3,1 s) y el FPS medido es **0 en el original y 2 en la build con arte**. Ambos valores son **anómalos e incomparables**: `framesIn2s=0` en la build original demuestra **inanición de rAF en SwiftShader**, un comportamiento ya documentado en Fase 0.3.1 (transiciones naturales de 52–54 s frente a 4,7 s con frames forzados). No es una medida de rendimiento en hardware real.

Evidencia de aislamiento ya ejecutada:
- `perf_probe.json`: `tick30Ms` **3,5 ms con el pintor desactivado** y **4,0–4,5 ms con él activado** → coste del lote ≈ 0,5–1 ms por bloque de 30 ticks.
- `roomcapture_probe.json`: sin `__T3B.roomCapture()`, campaña **3.214 ms**; con ella, **23.807 ms** y 47,5 s de `toDataURL`. Es una función de **diagnóstico**, no se invoca en el juego.
- `transition_probe.json`: transición completada en 7 polls con `evaluateMs` mayoritariamente 4–20 ms y un pico aislado de 590 ms.
- `validation_reverse.json`: el tiempo de **carga** depende del orden de sesión.

**Conclusión:** no se ha identificado una degradación **atribuible al lote** en el coste de simulación; la variación de tiempo de transición/carga en headless está dominada por la inanición de rAF y por el coste de las capturas CDP sobre un canvas animado. **No se afirma paridad de FPS en hardware real** → `PARCIALMENTE VERIFICADA`. Para medirlo con garantías haría falta un entorno con GPU o GUI, que aquí no existe. No se ha modificado SwiftShader ni las condiciones de medición; la única exclusión documentada es `ROOM_CAPTURE`.

## 5. Revisión visual (capturas del juego real)

| Captura | Observación |
|---|---|
| `antes_01_hub.png` | Suelo procedural magenta tipo trama, escudo con laureles dorados en el medallón central |
| `despues_01_hub.png` | **Suelo de chevrones neón magenta/cian** y **emblema del zorro coronado** en el medallón; HUD y disposición de la sala sin cambios |
| `antes_03_campaign.png` | Suelo gris con motas procedurales en `r0` |
| `despues_03_campaign.png` | **Mármol negro con vetas magenta y oro**; anillo cian, jugador, props e indicadores intactos |
| `*_05_after_actions.png` | Tras movimiento y disparo, sin solapamientos ni recortes nuevos |

Decoración (`decor_neon_rug`, `decor_potted_palm`), jefe (`boss_01_anden`) y arma (`weapon_m1911`) están **integrados y cargados** (registros vivos, 8/8) pero su aparición en pantalla durante estas capturas concretas no se ha aislado visualmente → **PARCIALMENTE VERIFICADA** para esos tres. El emblema del zorro conserva un halo granate muy fino alrededor del neón, invisible sobre el fondo oscuro del HUB → **PARCIALMENTE VERIFICADA** (calidad de recorte), sin impacto funcional.

## 6. Protección de mecánicas y sistemas

**VERIFICADO (por ausencia de cambios en el diff de código y por regresión en runtime):** el paquete sólo toca 4 registros de imágenes y un flag visual. No se modifican movimiento, combate, disparo, habilidades, IA, Director, jefes, progresión, generación de salas, puertas, transiciones, inventario, armas, mejoras, puntuación, guardado, audio, controles, mando ni HUD. Los 2 scripts Cloudflare, 2 iframes y sus 2×404 permanecen intactos. `v9_t3_fase1b_cache_probe.html` y su backup conservan `b2ef4ad8…d4a`.

**INC‑001 e INC‑002** permanecen `NO REPRODUCIDAS`, abiertas hasta verificación GUI. No se corrigen por intuición.

## 7. Reconciliación de la métrica histórica 4/10 vs 5/10 (Fase 0.3.1)

Inspección de `FASE_0_3_1_EVIDENCE/inc001_session.json` (traza primaria) y de los informes:

| Valor | Dónde aparece | Qué mide | Condiciones |
|---|---|---|---|
| **5/10** | `FASE_0_3_TEST_MATRIX.md` T‑031‑01, `FASE_0_3_BUG_REGISTRY.md` §0.3.1, `FASE_0_3_QA_REPORT.md` §10.2 | Nº de intentos con ratón que «generaron proyectil» | Transcripción documental de la **misma** ejecución T‑031‑01 |
| **4/10** | `inc001_session.json` → `mouse[0..9].deltaShots = [1,1,0,0,1,0,1,0,0,0]` | `ΔshotsFired` por intento, corroborado con `Δbullets` y entradas en `wa` | 10 intentos `mousemove`+`mousedown` 450 ms+`mouseup`, sala `r0` lista, `transitionLock:false`, 1 enemigo, sin frames forzados |

**Son la misma ejecución, no dos pruebas distintas.** La traza es inequívoca y además cierra el balance global: 4 (ratón) + 1 (`alt[1]`, control alternativo) + 4 (`tickForced`, 60 ticks) = **`shotsFired=9`**, que coincide con `apiProbe.telemetryRun.shotsFired`. El «5/10» de los documentos es un **error de transcripción** (suma inconsistente: 5+1+4 = 10 ≠ 9); no procede de otra medición.

**Resultado que debe usarse como referencia: 4/10 intentos de ratón**, con la traza `inc001_session.json` como fuente primaria. Los documentos históricos **no se sobrescriben** (se conserva su texto); esta reconciliación queda registrada aquí y en `ART_PRODUCTION_LOG.md`. **Los estados de INC‑001 e INC‑002 no se modifican** por esta discrepancia: el hallazgo sustantivo (el disparo genera proyectiles que entran en `wa`) se mantiene en ambos recuentos.

## 8. Estado de cierre de la Tanda 01

| Condición | Estado |
|---|---|
| 8 recursos presentes y preparados | **VERIFICADA** |
| 8 recursos integrados en loaders reales | **VERIFICADA** (8/8 en la validación limpia) |
| Validación final ejecutada sin `ROOM_CAPTURE` | **VERIFICADA** (`validation.json`, `exit_code 0`) |
| Resultados documentados | **VERIFICADA** (este informe + `ART_PRODUCTION_LOG.md`) |
| Documentación artística escrita | **VERIFICADA** (6 documentos + documento maestro) |
| Original y backup intactos | **VERIFICADA** (SHA-256 en §9) |
| Diff revisado, commit y push | Ver informe de entrega de la sesión |
| Rendimiento comparable en hardware real | **NO VERIFICADA** (limitación de entorno) |
| Pruebas GUI / mando / resoluciones múltiples | **NO VERIFICADA** |

## 9. Hashes

| Archivo | SHA-256 |
|---|---|
| `v9_t3_fase1b_cache_probe.html` | `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` |
| `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` | `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` |
| `DEADBEAT_DISCO.ART.html` | `f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723` |

---

## 10. HUB · Tanda 01 (2026-11-03) — batería nueva e independiente

> No se reutilizan los resultados de la sección 1–9: esta batería se ejecutó completa y limpia sobre `DEADBEAT_DISCO.ART.html` con `ART_TOOLS/qa/validate_hub_tanda_01.js`. Clasificación: **APROBADO / FALLIDO / BLOQUEADO / NO VERIFICADO**.

| Dato | Valor |
|---|---|
| Navegador | Chromium 131.0.6778.0 headless + `playwright-core` 1.58.2 |
| Render / resolución | SwiftShader por software · 1280×900 |
| Servidor | `http.server 8123` sobre el workspace, `--bind 0.0.0.0` |
| Diseño | A/B en la misma build: `hubRestore()` = CONTROL, pack aplicado = DESPUÉS |

| # | Comprobación | Estado | Evidencia |
|---|---|---|---|
| 1 | Carga del HTML | APROBADO | HTTP 200, `loadMs=1265` |
| 2 | Carga de 10 assets | APROBADO | 10 HTTP 200, `10/10 loaded/exactSize/live` |
| 3 | Ausencia de errores JS | APROBADO | `pageErrors=0`; 2 404 Cloudflare externos documentados |
| 4 | Visibilidad real | APROBADO | `drawImage`/`createPattern` instrumentados, 10/10 |
| 5 | Perspectiva y escala | APROBADO | `contain` sin deformar; desviación motor registrada |
| 6 | Transparencias | APROBADO | 9 RGBA + 1 tile RGB opaco |
| 7 | Orden de capas | APROBADO | muros → suelo → medallón → props |
| 8 | Movimiento | APROBADO | Δx=405 con tecla `d` |
| 9 | Colisiones | APROBADO | barra bloquea en x=1795 igual que en CONTROL |
| 10 | Puertas | APROBADO | `r23`, `secured 0→1`, dos capturas |
| 11 | Interactivos | APROBADO | `openStation('bar')` → `active='bar'` |
| 12 | Regresión | APROBADO | T01 8/8, T02 10/10, T03 12 poses, V5 100/100, disparo 0→4 |

**Resumen: 12 APROBADO, 0 FALLIDO, 0 BLOQUEADO, 0 NO VERIFICADO en las pruebas.** La discrepancia de rama detectada para la entrega Git (ajena a la QA) se resolvió mediante autorización explícita del usuario: commit/push en la rama de sesión y PR hacia `arte-y-recursos`, sin merge.

Diferencias de píxel (`visual_diff.json`): ANTES↔DESPUÉS 61,95 %, CONTROL↔DESPUÉS 60,17 %, puertas cerradas↔abiertas 4,96 %. `report.json`, `hashes.json` y las 12 capturas están en `ART_EVIDENCE/hub/tanda_01/`. Detalle completo, errores encontrados y limitaciones: `ART_TANDA_01_HUB_REPORT.md`.

---

## 11. HUB · Tanda 02 (2026-11-03) — batería A/B nueva e independiente

> No se reutilizan los resultados de las secciones anteriores. Arnés: `ART_TOOLS/qa/validate_hub_tanda_02.js`. Clasificación: **APROBADO / FALLIDO / BLOQUEADO / NO VERIFICADO**.

| Dato | Valor |
|---|---|
| Navegador | Chromium 131.0.6778.0 headless + `playwright-core` 1.58.2 |
| Render / resolución | SwiftShader por software · 1280×900 |
| Servidor | `0.0.0.0:8123`, raíz → `DEADBEAT_DISCO.ART.html` (HTTP 200) |
| Diseño | **3 fases** sobre la misma build: ANTES = `hub2Restore()` antes de entrar; CONTROL = restore en caliente dentro del HUB; DESPUÉS = pack aplicado |
| Cámara | Capturas principales de las 3 fases en el mismo punto (`teleport 1250,935`); 10 zonas idénticas en ANTES y DESPUÉS |
| Instrumentación | solo lectura: `drawImage` / `createPattern` etiquetados, cajas de pantalla, orden de primera aparición, recuento de `<canvas>` |

| # | Comprobación | Estado | Evidencia |
|---|---|---|---|
| 1 | Carga del HTML y del art pack | APROBADO | HTTP 200, `loadMs=1426`, `status=applied`, `hub2AppliedAtBoot=10` |
| 2 | Carga e integración de 10 assets | APROBADO | 10 HTTP 200, `10/10 applied`, `exactSize`, `live`, `loaderResolves=1`, `originalsPreserved` |
| 3 | Ausencia de errores JavaScript | APROBADO | 0 `pageerror`, 0 errores locales; 2 404 Cloudflare preexistentes clasificados por ruta |
| 4 | Visibilidad real | APROBADO | 10/10 con `drawImage` real (20–2678 dibujos), 10/10 en pantalla |
| 5 | Perspectiva / escala / pivote | APROBADO | `contain` sin deformar, cajas del motor medidas por asset |
| 6 | Transparencias y bordes | APROBADO | 10/10 RGBA, esquinas limpias, halo ≤ 0,18 % |
| 7 | Profundidad / capas / sin canvas nuevo | APROBADO | secuencia T01 idéntica en 3 fases; canvases base 27/27/27 |
| 8 | Movimiento | APROBADO | `1250→1652` (Δ 402), mismo sentido en las 3 fases |
| 9 | Colisiones, zonas, estaciones | APROBADO | `hubAudit` y 11 estaciones idénticos; bloqueo x=1795 (Δ 75) con tolerancia 0,01 px |
| 10 | Transición y puertas | APROBADO | `r23`, `secured 0→1`, `doors_closed.png` / `doors_open.png` |
| 11 | Interactivos existentes | APROBADO | `openStation('bar') → active='bar' → closeModal()`; sin interacción nueva |
| 12 | Regresión + T01 + sala de campaña | APROBADO | T01 10/10, V5 100/100, T03 12 poses, disparo 0→4; `CAMPAIGN_ROOM` con `hub2Applied=10` y 0 errores |

**Resumen: 12 APROBADO, 0 FALLIDO, 0 BLOQUEADO, 0 NO VERIFICADO.**

**Incidencias reales investigadas (no ocultadas):** el primer arnés dio 9/12 por tres criterios propios erróneos (404 Cloudflare contados por host en vez de por ruta; suposición de que las capas cacheadas se dibujan después del suelo; igualdad exacta de Δ de movimiento en un bucle `rAF`), corregidos con mediciones y con una comprobación adicional de canvases. El canvas 28 de DESPUÉS es `canvas.hub-portrait-canvas` 72×72 creado por el modal `openStation('bar')` del propio juego (`canvas_probe.json`), no por el pack. Revisiones heredadas de T01 (`loaderResolves=0`, desviación 26,92 %, costura 12,57, 2 × 404) documentadas sin impacto y sin correcciones a ciegas.

Diferencias de píxel: `visual_diff.json` (15 comparativas, umbral 12/canal): principal ANTES↔DESPUÉS 9,84 %, CONTROL↔DESPUÉS 12,59 %, ANTES↔CONTROL 3,60 %, arsenal 11,26 %, arcade 8,15 %, descenso 8,30 %, puertas 5,38 %. ANTES↔CONTROL no es 0 % por la animación continua del HUB. Hoja visual lado a lado: `comparativa_antes_despues.jpg`. Logs completos: `antes_runtime.json`, `control_runtime.json`, `despues_runtime_full.json`. Hashes: `hashes.json`. Informe: `ART_TANDA_02_HUB_REPORT.md`.
