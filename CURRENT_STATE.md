# CURRENT STATE — DEADBEAT DISCO

## Estado vigente · 2026-11-26 · Generación de salas

- Fases 0 y 1 cerradas como lectura y diagnóstico acotado; propuesta de fase 2 aprobada. Piso 9 incluido en el objetivo de dos ciclos.
- Población compilada 2.1.0 integrada experimentalmente bajo `__DD_ROOM_SPAWN_GUARDS`; 10×1.000 mapas y 54.455 reubicaciones bajo su propio predicado. Motor nativo: 216 salas/1.728 candidatos sin bloqueos en dos seeds, con navegación debug; no prueba campaña completa.
- Fase 3 iniciada con una comprobación previa: el validador actual rechaza 9.000/10.000 mapas al sustituir su geometría por la compilada; no demuestra 9.000 fallos físicos. Builds regenerados; validación del plan aún usa geometría previa. Modo 2.1.0 presenta regresión de tiempo de generación y permanece experimental.
- Optimizada la búsqueda 2.1.0: 108.000 poblaciones idénticas al algoritmo previo; media A/B de generación menor en una muestra, p95 mayor y regresión frente a 2.0.0 aún presente. Topología y piso 9 multisalón integrados bajo flag; fase 3 incompleta.
- Topología 2.2.0 integrada experimentalmente bajo `__DD_ROOM_TOPOLOGY_V3`: dos ciclos en diez pisos; entrada del núcleo r100 y jefe r99/nivel 100. Guardado de ocho celdas, seed y versión verificado en recarga de nueva incursión; reanudar una activa no verificado. Progresión y victoria probadas con debug, no campaña natural.
- Detalles y límites: [propuesta](docs/PROPUESTA_GENERACION_FASE_2.md) y [línea base](docs/DIAGNOSTICO_GENERACION_BASELINE.md). Entradas posteriores se refieren a trabajos anteriores.


## Estado vigente · 2026-11-26 · Fase 0 integrada y validada

- #36 fusionado y #21 cerrado con autorización. #32 sigue abierto.
- Por autorización expresa, delta de #34 integrado en esta rama y #37 sobre main tras #36; #34 se conserva abierto/draft como referencia, sin escribir en su rama.
- Builds regenerados desde fuentes, copia en `backups/FASE_0_20261126_pre_PR34/`. Se conservan Dice Vault, atlas, minimapa, foco y retratos actuales.
- QA final: 30/30 guardas, 4/4 integración, 16/16 flujo; suites de resultados, HUD, minimapa, atlas, Refugio, controles, input modal, esquiva accesible y toque 390 px pasan.
- Tres arranques por variante: 115,470 → 29,569 MB hasta menú; 51,344 MB tras otros 2 s por carga P1. Mediana de menú 3072 → 2043 ms en Chromium headless sin GPU.
- Límite: avisos diagnósticos visuales, 108 dressing lint previos, GPU/mando/audio físicos y campaña larga no verificados. Fase 1 no iniciada; entrega de fase 0 pendiente de revisión/fusión de #37, no automática.
- Informe: [docs/FASE_0/INTEGRACION_PR34.md](docs/FASE_0/INTEGRACION_PR34.md). Las entradas siguientes son históricas.

## Estado vigente · 2026-11-26 · Fase 0 parcial

- Revisión independiente de #36 en `132d5a4`: 15/15 suites solicitadas y arranque MAIN_MENU pasan. Fusionado con autorización el 2026-11-26 (merge `29daef875fbe7e911f22de5c032d7753cf70aa57`). Hay 108 avisos de dressing lint por clasificar.
- #34 permanece draft: conflictos y rebase/mediciones pendientes después de integrar #36. #21 cerrado con autorización como superado; #32 continúa abierto hasta resolver conflictos y actualizar QA/descripción.
- Fase 1 no iniciada; fase 0 aún no terminada. Código y builds del juego sin cambios en esta rama.
- Informe y logs: [docs/FASE_0/REVISION.md](docs/FASE_0/REVISION.md). Las entradas siguientes son históricas y no sustituyen este estado.


## Build de referencia
v9_t3_fase1b_cache_probe.html

## Estado
- HTML recibido.
- Tamaño: 13.380.910 bytes.
- 19.835 líneas.
- CSS integrado.
- JavaScript integrado.
- Recursos gráficos Base64 detectados.

## Pendiente de verificar
- Dependencias externas.
- Integridad de los sistemas.
- Funcionamiento completo del juego.
- Compatibilidad de la build.

## Regla
Toda modificación debe partir de una copia de seguridad.

---

## Estado actual · 2026-11-03 (HUB · Tanda 01)

- Build activa en uso: `DEADBEAT_DISCO.ART.html` (13.381.028 B, 19.839 líneas), sin modificaciones. La regla de partir de copia de seguridad se respeta: `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` intacto.
- Tanda 03 `faseD.2` verificada en runtime antes de empezar; no se sustituyó el proyecto por una versión antigua.
- `ART_PACK/art_pack.js` ampliado con la integración HUB Tanda 01: 10/10 assets cargados y vivos (`hubPack applied 10/10`, `slotsApplied 9`, `errors []`).
- QA ejecutada con Chromium + Playwright: **12/12 APROBADO** (`ART_EVIDENCE/hub/tanda_01/report.json`), capturas ANTES/CONTROL/DESPUÉS y hashes.
- `main` y `origin/main` siguen en `d75e021`, intactos. La discrepancia de rama (`arte-y-recursos` solo tiene `README.md` en `origin`; sesión fijada en `arena/109fe45c-deadbeat-disconew`) fue resuelta por autorización explícita del usuario: commit/push en la rama de sesión y PR hacia `arte-y-recursos` **sin merge**. Ver `ART_TANDA_01_HUB_REPORT.md`, sección 9.

---

## Estado actual · 2026-11-03 (HUB · Tanda 02)

- Build activa: `DEADBEAT_DISCO.ART.html` (13.381.028 B, 19.839 líneas), **sin modificaciones**. `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` intacto.
- Preview: proceso Python en `0.0.0.0:8123`, raíz → HTML, verificado con HTTP 200 y runtime Chromium real; no se ha reiniciado ni reparado en esta tanda (ya estaba correcto).
- `ART_PACK/art_pack.js`: 1314 líneas, `node --check OK`, versión `fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02`. Incluye el bloque independiente `HUB2_*` con `applyHub2/restoreHub2/loadHub2/hub2/hub2Invalidate` y la API `hub2*`.
- Runtime: `hubPack applied 10/10` (T01) y `hub2Pack applied 10/10` (T02), `errors []`, `status=applied`; 0 `pageerror`.
- QA ejecutada: **12/12 `APROBADO`** (`ART_EVIDENCE/hub/tanda_02/report.json`), A/B de 3 fases con capturas ANTES/CONTROL/DESPUÉS en la misma cámara, `visual_diff.json`, `comparativa_antes_despues.jpg`, `hashes.json`, diagnóstico `canvas_probe.json` y regresión explícita en `CAMPAIGN_ROOM`.
- Sistemas: geometría, colisiones (bloqueo x=1795), 6 zonas, 11 estaciones, puertas `Ot.openT`, música, DJ, HUD, guardado, progresión, combate y V5 100/100 intactos. Sin segundo motor, sin canvas superpuesto, sin interacciones nuevas.
- Git: rama `arena/109fe45c-deadbeat-disconew`; PR #1 (T01) `OPEN` y **sin merge**; `main`/`origin/main` en `d75e021` intactos. Entrega T02 = commit + push en la rama de sesión y PR hacia `arte-y-recursos` **sin fusionar**.
- Documentos: `ART_TANDA_02_HUB_REPORT.md`, `ART_HUB_TANDA_02_AUDIT.md`, `ART_AUDIT/hub_tanda_02_needs_inventory.json`, `CHANGELOG.md`, `ART_PRODUCTION_LOG.md`, `ASSET_INVENTORY.md`, `VISUAL_QA_REPORT.md`.

---

## Estado actual · 2026-11-03 (HUB · Tanda 03)

- Build activa: `DEADBEAT_DISCO.ART.html` (13.381.028 B, 19.839 líneas, SHA-256 `f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723`), **sin modificaciones**. Backups intactos. Preview `0.0.0.0:8123` HTTP 200, sin reinicios.
- `ART_PACK/art_pack.js`: versión `fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02+hub-tanda03`, `node --check OK`, bloque independiente `HUB3_*` y API `hub3 / hub3Manifest / hub3Restore / hub3Apply / hub3Tag`. Mismo registro `__DDM_V5_IMG`, mismo `load()`, mismas APIs de invalidación, dos capas cacheadas conservadas. T01 y T02 intactas (10/10 + 10/10).
- Runtime medido: `status=applied`, **13/13 PNG T03 cargados, registrados y con tamaño exacto**, 0 errores; 142 claves V5, 21 slots dibujados en el HUB; canvases base idénticos en las 3 fases A/B.
- **Integración de render: 8/8 BLOQUEADA.** 7 objetivos sin slot de dibujo; `hub_vip_booth_lounge` con pintor en el código del MENÚ cuyo renderer de píxeles está inactivo en el build (0 `drawImage` en 5 arranques). Visibilidad en producción: **NO VERIFICADO**. No se ha modificado el HTML ni se ha inventado un sistema de render.
- QA: `ART_EVIDENCE/hub/tanda_03/report.json` — **12/12 APROBADO** del arnés A/B (Chromium 131.0.6778.0, playwright-core 1.58.2, 1280×900, SwiftShader), con `BLOQUEADO_INTEGRACION: 8` y `NO_VERIFICADO_VISIBILIDAD: 1`. 0 `pageerror`, 0 404 locales, regresión T01/T02/V5/capas/`CAMPAIGN_ROOM`/colisiones/puertas/estaciones/disparo/movimiento sin cambios. 74 evidencias / 79 MB.
- Documentos: `ART_TANDA_03_HUB_REPORT.md`, `ART_HUB_TANDA_03_AUDIT.md`, `CHANGELOG.md`, `ART_PRODUCTION_LOG.md`, `ASSET_INVENTORY.md`, `VISUAL_QA_REPORT.md`. Auditoría: D-01…D-07.
- Git: rama `arena/109fe45c-deadbeat-disconew`; PR #1 `OPEN` **sin merge**; `main`/`origin/main` en `d75e021` intactos. Commit independiente `HUB TANDA 03 — Environment reconstruction` y push a la rama de sesión.


---

## Estado actual · 2026-11-03 (HUB · Tanda 04) — VIGENTE

- **Build activa:** `DEADBEAT_DISCO.ART.html` (13.384.309 B, SHA-256 `f3f5e15d06492fb3b511b6c8d8f3c7d3be51f93332d6408d47a432ac744c9865`). Es la **primera tanda que modifica el HTML activo**, autorizada explícitamente y solo para conectar recursos a renderers existentes: 3 bloques `TANDA04:BEGIN/END`, `+59/-2` líneas. Copia de seguridad y reversión: `ART_TOOLS/qa/apply_hub_tanda_04_html.py --restore`.
- **`ART_PACK/art_pack.js`: SIN CAMBIOS** (SHA `1df28db436b629610ae47e9a5390e742f48928620d0bd19fa8b4cfdb86d8c8e1`). `__DDM_V5_IMG`, `load()`, `HUB3_*` / `HUB2_*` y las APIs de invalidación siguen igual. 142 claves V5. T01, T02 y T03 intactas; el histórico `ART_EVIDENCE/hub/tanda_03/report.json` NO se reescribe.
- **Integración de render: 13/13 `INTEGRADO`, 0 bloqueadas, 0 `NO_VERIFICADO`.** 4 suelos (`drawHubFloorLayer`/`Wf`), 2 variantes de mobiliario + VIP (`hubDecor` -> `addHubCustomProp`/`Lc`, `solid:false`) y 6 señales diegéticas (`drawHubAerialLayer`/`Ph`). El VIP NO usa el pintor del menú. Flag `__DDM_HUB_T04` activo por defecto y reversible en caliente.
- **Preview:** `python3` pid 4783 en `0.0.0.0:8123`, verificado HTTP 200 con el HTML actual; **no se ha reiniciado ni reparado** (ya estaba correcto).
- **QA:** `ART_EVIDENCE/hub/tanda_04/report.json` — **12/12 `APROBADO`**, `exit=0`, 3 fases A/B (1280x900, misma cámara, 10 zonas), `drawImage` medidos por unidad en el canvas de mundo del HUB, 0 errores JS, 0 404 locales, regresión completa T01/T02/V5/capas/`CAMPAIGN_ROOM`/colisiones/puertas/estaciones/disparo. Performance: mediana 16,7/16,8/16,7 ms, coste de carga separado. 83 evidencias / ~90 MB, 114 hashes / 0 discrepancias.
- **T01:** APROBADA. **T02:** integrada y verificada, **cierre pendiente de performance gate** (medido en T04, sin declararla cerrada). **T03:** producción/carga/QA aprobadas, render 8/8 bloqueado en su informe histórico, ahora resuelto por T04.
- **Git:** rama `arena/109fe45c-deadbeat-disconew`; PR #1 `OPEN`, base `arte-y-recursos`, head rama de sesión, **sin merge**; `main`/`origin/main` en `d75e021` intactos. Commit independiente `HUB TANDA 04 — Render integration`.
- **Documentos vigentes:** `ART_TANDA_04_HUB_REPORT.md`, `ART_HUB_TANDA_04_AUDIT.md`, `ART_HUB_TANDA_04_MATRIX.md` (estado `INTEGRADO`), `ART_PRODUCTION_LOG.md`, `CHANGELOG.md`.

<!-- TANDA05:STATE -->
### Integración TANDA 05 — `APROBADO`

- HUB real: 152 claves V5 (142 de T04 + 10 de T05), 27 canvas base, 11 estaciones, 6 zonas, caché de suelo activa.
- 10/10 assets integrados y visibles: `drawImage` medido en `game` 1280×900, A/B `0 → 10 → 0 → 10`, `hub5Restore/hub5Apply` verificados.
- Sin sistemas nuevos: sin colisiones, estaciones, interacciones, geometría, guardado, música, DJ ni segundo motor/canvas/caché/loader.
- T01–T04 intactas. PR #1 abierto, base `arte-y-recursos`, head de sesión, **sin merge**; `main`/`origin/main` en `d75e021`.
- Pendiente ajeno a T05: cierre formal del performance gate de T02; históricos `BLOQUEADO` de T03 conservados.
- Siguiente: TANDA 06 — envolvente arquitectónica y atmósfera.

<!-- TANDA06:STATE -->
### Integración TANDA 06 — `APROBADO`

- HUB real: **162 claves V5** (152 de T05 + 10 de T06), 27 canvas base, 11 estaciones, 6 zonas, caché de suelo activa.
- 10/10 recursos integrados y visibles; **14 anclajes `hubDecor`** medidos, paramentos laterales continuos `y=400..1540`.
- A/B `0 → 0 → N → 0 → 10 → N`; `hub6Restore/hub6Apply` verificados; 0 `pageerror`, 0 errores JS, 0 404 locales.
- Sin sistemas nuevos: sin colisiones, estaciones, interacciones, geometría, guardado, música, DJ, segundo motor/canvas/caché/loader.
- T01–T05 intactas. PR #1 abierto, base `arte-y-recursos`, head de sesión, **sin merge**; `main`/`origin/main` en `d75e021`.
- Pendiente ajeno a T06: cierre formal del performance gate de T02; históricos `BLOQUEADO` de T03 conservados.

<!-- TANDA07:STATE -->
### Integración TANDA 07 — `INTEGRADO_VALIDADO` (Fases 0–5)

- **Build activa:** `DEADBEAT_DISCO.ART.html` 13.414.811 B / 20.427 líneas (SHA `a757a49e5b623efeba14b27f115df33bf5bd86b4fca51bf81f876205f6dbabfb`); `ART_PACK/art_pack.js` 100.474 B / 2.042 líneas (SHA `c5e5759b31120aa66adca3ab50808046ec225d3415d1f133e0045da5a76e3579`). Backups `.PRE_T07` en `/tmp/t7/`.
- **HUB real:** 168 claves V5 (162 de T06 + 6 de T07), 27 canvas, 11 estaciones, 6 zonas, zoom `0.9375`, 1 secuenciador. Sin segundo motor/canvas/cámara/audio/colisiones.
- **6/6 assets T07** cargados, `exactSize`, registrados y dibujados; llegada 1,85 s sin bloqueo de control; 6 actores NPC / 5 actividades; descenso con continuidad visual y 0 fotogramas negros.
- **A/B:** `window.__DDM_HUB_T07 = false` retira todo lo nuevo; diff de franja sur 37,41 y `ON +20 / OFF +0` dibujos de geografía.
- **QA:** `ART_EVIDENCE/hub/tanda_07/qa_tanda07.json` — **35/35 APROBADO**, 0 `pageerror`, 0 errores T07, sólo los 2 `404` externos preexistentes. `report.json` y `hashes.json` (6/6, 0 discrepancias).
- **Audio:** intacto. No se usó `cineFilter`/`cineGain`/`cineSting` (detrás de `M.cine`); la cadena de descenso existente verificada por eventos.
- **T01–T06 intactas** (smoke de carga/topología; la regresión formal completa sigue `NO VERIFICADO`). PR #1 `OPEN`, base `arte-y-recursos`, **sin merge**; `main`/`origin/main` en `d75e021`.
- **Pendiente / bloqueado (heredado):** vídeo, mando físico, audio audible, inventario completo de frames NPC, rendimiento sostenido con T07, performance gate de T02 y 8 `BLOQUEADO` de T03.
- **Documentos vigentes:** `ART_TANDA_07_REPORT.md`, `ART_TANDA_07_FASE3_MATRIZ_NPC.md`, `ART_TANDA_07_FASE0_AUDITORIA.md`, `ART_TANDA_07_FASE1_GEOGRAFIA.md`.

<!-- TANDA08:STATE -->
### Integración TANDA 08 — `INTEGRADO_VALIDADO` (Fases 0–5)

- **Prueba de composición previa a producción:** 16/16 APROBADA en el juego real y sin assets (`ART_EVIDENCE/hub/tanda_08/composition_proof.json`). Restricción medida: con `zoom .9375` y límite sur `y=1195` sólo hay ~84 px bajo `y1585`, y la cámara SUBE durante el descenso → **cutaway en espacio de pantalla** anclado al borde, parallax sobre `DMO.camera()` y apertura con `shaftOpen`.
- **Build activa:** `DEADBEAT_DISCO.ART.html` 13.434.376 B / 20.803 líneas; `ART_PACK/art_pack.js` 108.072 B / 2.176 líneas. Versión `+hub-tanda08`. Backups `.PRE_T08` en `/tmp/t8/`. Diff del HTML: **2 inserciones, 0 eliminaciones** → T01–07 intactas.
- **HUB real:** 178 claves V5 (168 T01–07 + 10 T08), 27 canvas, 11 estaciones, 1 secuenciador, zoom `.9375` y límites de cámara sin tocar. 5 planos (`factor .92/.66/.40/.20/.08`), 56 brasas + 26 cenizas + 4 humos + 3 luces lejanas preasignados.
- **Descenso:** `expand = 260·shaftOpen`, ventana `84 → 374 px`, densidad con `stairProgress`, retirada en `CAMPAIGN_ROOM`, sin pantalla negra (lum. mín. 38,45). T07 `descentScreen` sigue activo.
- **Flag reversible:** `window.__DDM_HUB_T08 = false` detiene todos los dibujos T08 sin afectar T01–07; arranque con `false` ≡ T07 (diff 0,20).
- **QA:** `ART_EVIDENCE/hub/tanda_08/qa_tanda08.json` — **33 APROBADO / 0 FALLIDO / 4 NO VERIFICADO**, 0 `pageerror`, 10/10 SHA-256 sin discrepancias, `manifest.json` → `INTEGRADO_VALIDADO`.
- **Sin sistemas nuevos:** sin canvas, motor, cámara, loader, rAF, temporizador propio, audio, colisiones, geometría, estaciones, progresión, NPC, criaturas ni enemigos. Audio y lógica de llegada T07 intactos.
- **NO VERIFICADO:** vídeo continuo, mando físico, audio audible/latencia, rendimiento sostenido y regresión visual formal completa en hardware real; heredados: performance gate T02 y 8 `BLOQUEADO` T03.
- **Documentos vigentes:** `ART_TANDA_08_REPORT.md`, `ART_TANDA_08_FASE0_1_MAPA_Y_COMPOSICION.md`, `ART_EVIDENCE/hub/tanda_08/mapa_profundidad.json`.

<!-- TANDA09:STATE -->
### Integración TANDA 09 — `INTEGRADO_VALIDADO` (Fases 0–5)

- **Build activa:** `DEADBEAT_DISCO.ART.html` 13.460.630 B / 21.296 líneas (SHA `3e82dc77b9fd4c59d01e016628b204b1b07042c7f8f9085de3433141e5429011`); diff de T09 = **494 inserciones, 0 eliminaciones**. `ART_PACK/art_pack.js` 108.072 B **sin cambios** (SHA `330c9f46fd32e0f9782009252ea1380321e9e37a3e500e9fadf8869e914921c5`, versión `+hub-tanda08`).
- **HUB real:** 182 claves V5 (178 T01–08 + 4 alias `t09_*`), 27 canvas, 62 props, 11 estaciones, 6 zonas, 1 secuenciador, zoom `.9375`. Sin segundo motor, canvas, cámara, loader, rAF, temporizador por NPC, audio, colisiones, estaciones ni progresión.
- **NPC:** los 11 originales intactos (4 `ambientDancers` + 6 actores T07 + `narr_cliente000` intocable). 10 registros de rutina con 10 pares de duraciones distintos; 4 posturas estáticas nuevas con fallback a los sprites V5.
- **Arquitectura:** `DMO_LAYOUT.propObjects()` es un clon profundo → T09 engancha el array real `tc` con re-enganche perezoso en `Tf(dt)`. Un solo acumulador, `draws/updates = 10`, 0 `allocs` por frame.
- **Continuidad:** 0 saltos de frame a 33 ms en los 10 NPC; ΔX máximo 5 u a 33 ms y 26 u a 250 ms; orientación intermedia ≤10,5 % de muestras; 136 combinaciones de estado; máx. 4/10 cambios simultáneos.
- **Flag reversible:** `window.__DDM_HUB_T09 = false` → 260+ delegaciones al pintor original, 0 rutinas nuevas; al volver a `true` se reanuda. Con `false` **desde el arranque** (`qa_flag_boot.json`, APROBADO): 0 peticiones de los 4 PNG, `assetsRequested=false`, V5 = 178, `draws=0`; al activar, 4/4 sprites y rutinas activas. `reducedMotion` congela y delega (880 delegaciones).
- **QA:** `ART_EVIDENCE/hub/tanda_09/qa_matrix.json` — **16/16 APROBADO** en los puntos pedidos; matriz completa **16 APROBADO / 0 FALLIDO / 3 BLOQUEADO / 6 NO VERIFICADO**. 100 s / 400 muestras, 0 `pageerror`, 0 warnings, 39 evidencias, `hashes.json` con 17 ficheros, `manifest.json` → `INTEGRADO_VALIDADO`.
- **T01–08 intactas** (auditorías T07/T08/HUB `ok`, marcadores y pack sin tocar; A/B de flag). PR #1 `OPEN`, base `arte-y-recursos`, **sin merge**; `main`/`origin/main` en `d75e021`.
- **BLOQUEADO (diseño):** sin sistema de patrulla, sin NPC ambiental propio en B/F, `narr_cliente000` sin cambios.
- **NO VERIFICADO:** vídeo continuo, mando físico, audio audible/latencia, coste real de frame y rendimiento sostenido en hardware real, regresión visual/formal completa T01–07, sostenimiento >100 s; heredados: performance gate T02 y 8 `BLOQUEADO` de T03.
- **Documentos vigentes:** `ART_TANDA_09_REPORT.md`, `ART_TANDA_09_FASE0_INVENTARIO.md`, `ART_TANDA_09_FASE1_MATRIZ_RUTINAS.md`, `ART_TANDA_09_FASE2_RECURSOS.md`, `ART_EVIDENCE/hub/tanda_09/`.

---

## Estado actual · 2026-11-04 (MODIFICACIÓN PRIORITARIA · legibilidad y geografía del HUB)

- Prioridad vigente del usuario por encima de nuevas actividades NPC. La **TANDA 09 ya publicada** queda **desactivada** (`window.__DDM_HUB_T09 = false`) durante toda la corrección; no se amplían sus rutinas.
- Auditoría visual T01–T08 publicada en `56dfd85` (16 capturas de barrido, 21 A/B de capas, 12 de prueba, 9 de descenso, matriz de 79 incidencias). Diagnóstico: niebla por `opacity=1` del bloom `screen`, saturación por el patrón art-déco, línea magenta recta como falso borde y grieta decorativa desconectada del descenso.
- Propuesta entregada **antes de modificar** (`ART_PROPUESTA_CORRECCION_PRECIPICIO.md`); el usuario autorizó **A–F completos**.
- Implementación: módulo reversible `ART_TOOLS/hub_legibilidad_block.js` + `apply_hub_legibilidad.py` (`--apply/--check/--restore` con SHA-256 byte a byte). **4 inserciones, 0 eliminaciones** en `DEADBEAT_DISCO.ART.html`; `ART_PACK/art_pack.js` **sin cambios**. Flag `window.__DDM_HUB_LEGIBILIDAD` (`true` tras autorización, `false` = estado publicado). Sin assets, props, cámara, motor, Director, combate, progresión ni audio nuevos.
- Resultado medido: línea magenta recta **1089 → 0 px** (restaurado 1117), separación de planos en el borde **17,95 → 23,65**, 62 props / 11 estaciones intactos, `startCampaignFromHub(0)` sin cambios → `CAMPAIGN_ROOM`.
- QA `ART_EVIDENCE/hub/correccion/qa_matrix.json`: **18 APROBADO / 0 FALLIDO**, 0 `pageerror` en 5 contextos, reversibilidad en caliente verificada. Evidencias: 16 sweep, 12 A/B + 2 restaurado, 9 descenso, `flag_off_boot_borde.jpg`, `compatibilidad_t09_legibilidad.jpg`, `comparativa_antes_despues.png`, `report.json`, `qa_matrix.json`, `metricas.json`, `hashes.json` (46 ficheros).
- `main`/`origin/main` en `d75e021`, PR #1 `OPEN` sin merge. Informe: `ART_CORRECCION_LEGIBILIDAD_HUB.md`.

## Estado actual · 2026-11-12 (PROJECT RESTART · diseño del protagonista CERRADO)
- Modelo maestro oficial: `assets/cinematics/restart/character_master/protagonist_master_approved.png` (1672×941, SHA-256 `43d9e58fcd1c9f9e04aabcc95da2194496a8aef765e2b9a56d34e75933004e5d`). Congelado: no regenerar, redibujar ni sustituir.
- Ficha consolidada y reglas de producción: `docs/RESTART/03_PERSONAJE_MAESTRO.md`.
- Tatuajes: los de la lámina. Retirada la descripción «partitura incompleta» de la biblia (§4.1); versión anterior en `docs/LORE/historico/`.
- Los 22 sprites `assets/characters/player_*` son del **diseño anterior**; siguen intactos y en uso hasta una futura fase de reconstrucción de animaciones, que deberá partir de la lámina.
- V1 y V2 de la composición de intro: histórico, no canónicas. Logotipo oficial: `assets/logos/logo_deadbeat_graffiti.png` (el rótulo de la lámina no lo sustituye).
- Sin cambios en motor, cinemática activa, menú ni sprites.

## Estado actual · 2026-11-12 (PROJECT RESTART · protagonista: IDLE de fotograma único) — PENDIENTE DE APROBACIÓN
- El juego sigue usando los 22 sprites anteriores. Nada nuevo está registrado ni integrado.
- IDLE nuevo: un fotograma (`assets/characters/protagonist_master/pm_idle_00.png`) con la respiración procedural del motor. Informe: `docs/RESTART/06_IDLE_FOTOGRAMA_UNICO.md`.
- Muestra de 4 fotogramas: fallida por inconsistencia de tatuajes, archivada como `IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY`.
- Abierto para la revisión de ilustración: sigilo del hombro (estrella en círculo), lobo reconocible, cadenas.
- No iniciadas: WALK, RUN, SHOOT y el resto. Se espera la aprobación del IDLE.

## Estado actual · 2026-11-12 (PROJECT RESTART · protagonista: fidelidad del IDLE) — PENDIENTE DE VALIDACIÓN VISUAL
- Arquitectura IDLE aprobada: un fotograma + respiración procedural del motor. `pm_idle_00.png` aprobado técnicamente y conservado.
- Versión corregida (sigilo del hombro, lobo, cadenas): `assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png`. Informe: `docs/RESTART/07_IDLE_FIDELIDAD.md`.
- El juego sigue usando los 22 sprites anteriores. Nada registrado. Ninguna otra animación iniciada.

## Estado actual · 2026-11-12 (PROJECT RESTART · protagonista: FASE 07B) — PENDIENTE DE APROBACIÓN
- Corrección de fidelidad v2 del IDLE: tinta del hombro y del lobo tomada directamente de los paneles de la lámina; cadenas reforzadas. Informe: `docs/RESTART/08_IDLE_FIDELIDAD_07B.md`.
- Se conservan `pm_idle_00.png` (aprobado técnicamente) y la v1 de la corrección.
- El juego sigue usando los 22 sprites anteriores. Nada registrado. Ninguna otra animación iniciada.

---

## Estado actual · 2026-11-13 (PROJECT RESTART · inicio del juego)

- Build activa: `index.html` = `DEADBEAT_DISCO.html`, generadas por `tools/build_active_html.py`.
- Inicio: carga → intro en cómic animado (32 s) → menú → nueva partida → descenso (4,6 s) → Refugio.
- Protagonista: diseño cerrado. **IDLE 07B integrado en el Refugio** (un fotograma, sin animación de paso). En las incursiones siguen los sprites anteriores.
- Persistencia: NUEVA PARTIDA reinicia sólo el estado de run; CONTINUAR no reinicia nada; BORRAR DATOS es una acción aparte en OPCIONES, con confirmación.
- QA: `tools/qa/test_restart_flow.js` 65 de 65; `tools/qa/test_persistencia.js` 39 de 39.
- **Sonido: grabado y medido, NO ESCUCHADO NI VALIDADO.** Pendiente de escucha humana; hay un salto de volumen de unos 13 dB entre la intro y la música del menú por decidir.
- Storyboard vigente: v2 (`docs/RESTART/storyboard_intro/storyboard_v2_motor.jpg`); v1 es histórico.
- Pendiente: escucha; animaciones del protagonista (andar, combate); retrato del HUD; mando físico y otros navegadores.
- Detalle: `docs/RESTART/12_INTRO_COMIC_PRODUCCION.md` y `13_CIERRE_INTRO_REFUGIO_PERSISTENCIA.md`.

## 2026-11-13 · RESTART 14
Menú revisado control por control, pantalla de carga reducida a logotipo y barra, portada antigua oculta desde el primer fotograma, intro y música del menú igualadas en nivel medido (sin escuchar). Ver `docs/RESTART/14_MENU_CARGA_Y_VOLUMEN.md`.

## Estado actual · 2026-11-15 (RECONSTRUCCIÓN TOTAL · FASE 0–2 incremento 1)
- **FASE 0 auditoría completa** en `docs/TOTAL_ART_REBUILD/00_AUDIT_REPORT.md` (+ `01_REPLACEMENT_MATRIX.md`, `02_TECHNICAL_PLAN.md`, `03_ASSET_CONTRACT.md`): el build activo es `index.html` (generado desde backup + `src/`); `DEADBEAT_DISCO.ART.html`/`ART_PACK/` son legado congelado y no se usan; la vía de integración es el registry `DD_ASSETS` + `DD_WORLD`/`DD_HUB`. Numeración de círculos láminas vs motor registrada (se conserva la del motor; HUD sin renombrados).
- **Referencias** archivadas con SHA-256 en `ART_REFERENCES/2026-11-TOTAL/` (12 láminas + `loreybibilia.txt`).
- **FASE 1 contrato técnico** vigente (paleta/hex por círculo, tiles 512, pivotes, pipeline, checklist).
- **FASE 2 HUB incremento 1 (TR_T01):** 2 assets nuevos integrados en código (`hub_floor_main` suelo damero del Refugio; `hub_portal_frame` mezzanine decorativo de los 9 círculos sobre la pared superior, flag `__DD_HUB_REBUILD`). Build activo regenerado y verificado estáticamente (sin errores; 12/13 bloques JS parsean, 1 es licencia). Registro 271 entradas sin pérdida legacy (66/66 `anchors`/`rev`).
- **Límite honesto:** este sandbox **no tiene navegador** (Playwright/Chromium inalcanzables). No se ha ejecutado arranque ni capturas; **nada se declara APROBADO visualmente**. La verificación en navegador real queda pendiente (arneses `tools/qa/*.js` listos).
- PRs abiertas #22/#30 (escala de mundo): no interferidas; el arte nuevo no depende de su cámara.

## Estado actual · 2026-11-15 (TR_T04–T10 · QA real en navegador)
- **Suelos de los 9 círculos + muros clave regenerados** (clase B, mismos IDs): Lujuria/Gula/Avaricia/Ira/Herejía/Violencia/Fraude/Traición/Núcleo. Identidades cromáticas según láminas y `CIRCLE_CONFIG`.
- **Navegador real conseguido** vía `@sparticuz/chromium` (npm registry; los CDN de Playwright no son alcanzables). Evidencia en `ART_EVIDENCE/TOTAL_REBUILD/`: integridad 271/271, 0 errores, Refugio reconstruido capturado, pad de descenso funcional, primera sala de combate LIMBO correcta.
- **PR #31** en borrador con 6 commits (`1d22612…` + TR_T01…TR_T10). Sin merge. `main` intacta.
- **Pendiente:** captura in-situ de suelos II–IX (jugar pisos), paredes pendientes (heavy_base, panel_vip_window, core_monolith, dorado Avaricia), props firma por círculo, FX de fases de jefe, HUD definitivo, performance gate formal, aprobación de sprites WALK/SHOOT del protagonista.

## Estado actual · 2026-11-15 (TR_W1 — suelos/muros/entornos pasa 1)
- **Integrados y verificados en juego real:** `floor_00_limbo_marble` (mármol agrietado, visible en sala LIMBO de combate, captura 06), `threshold_descent_pad` (runas cian, visible en Refugio, captura 05), `wall_pillar_obsidian` (9/9 círculos), `door_gothic_closed/open` (círculos ≥ IV). Integridad navegador **271/271 pass**.
- **TR_W1b integrados (integridad navegador 271/271):** `wall_panel_gothic_niche`, `wall_panel_vip_window`, `portal_avaricia_gold`, `portal_baroque_gold`, `floor_10_hub_checker`.
- **Rechazados y revertidos** (extract_clean_rgba sobre fondo negro destruye piedra oscura): `wall_panel_heavy_base`, `wall_core_monolith`, `door_arched_open`, `door_stained_closed`, `door_vip_crimson` → v3 pendiente sobre **fondo verde chroma #00ff00**. Lección documentada en ART_EVIDENCE/TOTAL_REBUILD/README.md.
- Harness QA con timeout de screenshot 120 s (SwiftShader); QA PASS sin errores en hub y descenso.
- Pendiente mayor: props firma por círculo, FX de fases de jefe, captura de círculos II–IX in-situ, métricas de rendimiento, HUD definitivo. PR #31 borrador, sin merge.

## Estado actual · 2026-11-15 (TR_W1c — verde chroma)
- **Integrados (y cargados en navegador):** herejía `wall_panel_heavy_base`, Núcleo `wall_core_monolith`, puertas `door_arched_open`/`door_stained_closed`/`door_vip_crimson`, `wall_panel_tall_neon`, `prop_gilded_altar`, `prop_arcane_pedestal` (despillado), `floor_11_vip_velvet`, `prop_gothic_statue`.
- Regla de oro: assets oscuros sobre verde #00ff00 (borrador negro destruye piedra oscura). Documentado.
- Pendiente menor: statue v2 con lienzo completo; captura in-situ por círculo; FX de jefes; props firma por círculo; HUD definitivo. PR #31 borrador, sin merge.

## Estado actual · 2026-11-15 (TR_W2 — props del HUB)
- **Integrados y visibles en el Refugio (navegador, 271/271):** bar_counter, dj_booth, speaker_tower, subwoofer_cyan, candelabra_floor, sofa_black, bookshelf_hub, cooler_neon, gothic_statue (estampado por ancho). Captura: 03_refugio_hub.png.
- Pendiente v2: prop_chandelier_gold (rechazado W2), encuadre retrato para bookshelf/statue, captura in-situ de círculos II–IX, FX de jefes, HUD definitivo. PR #31 borrador, sin merge.

## Estado actual · 2026-11-15 (TR_W3)
- **Integrados:** arcade, vending, crate_club, armchair_vip, bench_neon, neon_palm, sigil_poster, bollard_pair, chest_closed (navegador 271/271, QA PASS). Mobiliario de sala prácticamente completo.
- **Rechazado 2ª vez:** prop_chandelier_gold (en mano provisional).
- Pendiente: FX de fases de jefe, captura in-situ Círculos II–IX, HUD definitivo, cinemáticas (cine_*), merge PR #31.

## Estado actual · 2026-11-15 (TR_W4)
- **Integrados:** últimos 5 props de sala/HUB, chandelier v3 (v3 tras 2 rechazos), familia enemiga **Security** completa (walk/windup/attack/death) — integridad navegador 271/271.
- **Los 271 assets del registry están regenerados o conservados legacy**; solo quedan por iterar en calidad/estilo si se decide (p.ej. unificar paleta Seguridad) y los bloques enormes: jefes, cinemáticas, HUD.
- Sigue pendiente: captura in-situ de Círculos II–IX, FX de fases de jefe, decisión de merge PR #31 (borrador).

## Estado actual · 2026-11-15 (TR_W5)
- **Integrados (navegador 271/271):** familias Dancer y Fanatic completas; chef walk/windup. Pendiente terminar Chef (attack/death), y Drone y Elite.
- QA PASS completo tras cada tanda. Regla de oro intacta: oscuros sobre verde #00ff00.
- Pendiente mayor: jefes 11×4 (+secreto), FX jefes, cinemáticas, HUD, captura in-situ II–IX, merge PR #31 (borrador).

## Estado actual · 2026-11-15 (TR_W6)
- **Integrados (navegador 271/271):** chef attack, familia Drone completa, Elite walk/attack/death.
- **Pendiente v2:** enemy_chef_death (moderación) y enemy_elite_windup (fondo oscuro ignorando instrucción verde; exigir verde explícito).
- Enemigos: 3 de 6 familias completas (Security, Dancer, Fanatic) + Drone completa; Chef y Elite casi completos.
- Pendiente mayor: jefes 11×4 (+secreto), FX jefes, cinemáticas, HUD, captura in-situ II–IX, merge PR #31 (borrador).

## Estado actual · 2026-11-15 (TR_W7)
- **Integrados (navegador 271/271):** jefe Andén (Limbo) y jefe Magneta (Lujuria) completos; chef_death y elite_windup v2 cerrados.
- Familias enemigas COMPLETAS: security, dancer, fanatic, drone; chef y elite completos (3→4+4).
- **Jefes restantes:** 02..10 (×4 estados) + boss_10_arquitecto (secreto, idle/attack) = 38 sprites pendientes.
- Pendiente mayor: FX jefes, cinemáticas, HUD definitivo, captura in-situ II–IX, merge PR #31 (borrador).

## Estado actual · 2026-11-15 (TR_W8)
- **Integrados (navegador 271/271):** Bufe (Gula) idle/attack/death, Cajero (Avaricia) completa, Pogo (Ira) idle/attack. Pendiente boss_02_bufe_hit v2.
- **Jefes integrados:** 00 Andén, 01 Magneta, 02 Bufe*, 03 Cajero, 04 Pogo* (*completa salvo bufe_hit). Quedan 05 Oficiante, 06 Matarife, 07 Imitador, 08 Traidor, 09 Núcleo, 10 Arquitecto (secreto).
- Pendiente mayor: FX jefes, cinemáticas, HUD definitivo, captura in-situ II–IX, merge PR #31 (borrador).

## Estado actual · 2026-11-15 (TR_W9)
- **Integrados (navegador 271/271):** Bufe hit v2, Pogo hit, Oficiante completa, Matarife idle/attack/hit. **Rechazado: pogo_death (pixel-art; provisional conservado, v2 pendiente).**
- **Jefes integrados (10 frames nuevos):** 00 Andén ✓(4) 01 Magneta ✓(4) 02 Bufe ✓(4) 03 Cajero ✓(4) 04 Pogo (3/4; falta death) 05 Oficiante ✓(4) 06 Matarife (3/4; falta death).
- Restan: 07 Imitador (Fraude) ×4, 08 Traidor (Traición) ×4, 09 Núcleo (Núcleo) ×4, 10 Arquitecto (secreto) ×2 = 14 sprites + pogo/matarife death v2.
- Pendiente mayor: FX jefes, cinemáticas, HUD definitivo, captura in-situ II–IX, merge PR #31 (borrador).

## Estado actual · 2026-11-15 (TR_W10)
- **Integrados (navegador 271/271):** pogo_death v2 painterly, Imitador COMPLETO, Traidor idle/attack/hit. **Matarife death v2 pendiente (moderación).**
- **Jefes integrados:** 00✓ 01✓ 02✓ 03✓ 04✓(4) 05✓ 06 Matarife (3/4) 07✓(4) 08 Traidor (3/4). **Restan:** 08_traidor_death, 09 Núcleo ×4, 10 Arquitecto (secreto) ×2, matarife_death v2 = 8 sprites.
- Pendiente mayor: FX jefes, cinemáticas, HUD definitivo, captura in-situ II–IX, merge PR #31 (borrador).

## Estado actual · 2026-11-15 (TR_W11)
- **Integrados (navegador 271/271):** Traidor death, Núcleo Final COMPLETO, Arquitecto idle/attack (attack aceptado en versión oscura; v2 = mimo blanco pendiente).
- **TODAS las familias de jefes integradas excepto** `boss_06_matarife_death` (3 intentos rechazados/bloqueados; provisional conservado).
- Jefes 00 Andén ✓, 01 Magneta ✓, 02 Bufe ✓, 03 Cajero ✓, 04 Pogo ✓, 05 Oficiante ✓, 06 Matarife (falta death), 07 Imitador ✓, 08 Traidor ✓, 09 Núcleo ✓, 10 Arquitecto ✓.
- Pendiente mayor: FX jefes, cinemáticas (~40 capas), HUD definitivo, captura in-situ II–IX, verificación de nombres de jefe contra datos canónicos del juego, merge PR #31 (borrador).

## Estado actual · 2026-11-15 (TR_W12)
- **Jefes COMPLETOS e integrados (navegador 271/271):** Andén ✓, Magneta ✓, Bufe ✓, Cajero ✓, Pogo ✓, Oficiante ✓, Matarife ✓, Imitador ✓, Traidor ✓, Núcleo ✓, Arquitecto ✓.
- Verificación de nombres canónicos hecha contra `src/dd_ui_system.js` (IDs en assets matchean; epítetos no usados en ficheros).
- Restante según matriz (~163 filas): VFX (~20), cine Circles (~20), jugador/héroe (~25), armas (~32), proyectiles (~20), reliquias (~16), pickups (~8), cine capas (~20), UI fin/tienda. Weapons/proyectiles son pixel-art 320x160 coherentes con el resto del juego — conversión masiva NO recomendada sin decisión del usuario.
- Pendiente mayor: FX jefes, cinemáticas, HUD, captura in-situ II–IX, merge PR #31 (borrador, NO tocar sin visto bueno).

## Estado actual · 2026-11-15 (auditoría pendientes)
- Auditoría: NO regenerar en masa; pendiente = lista de verificación in-situ. 9 filas matriz → «Verificado OK visual».
- Jerarquía de calidad: key art cine/backdrop = final; pixel art HUD/VFX/armas = coherente final; jefes/enemigos TR = integrado.
- Pendiente mayor sin cambios: FX jefes, captura in-situ II–IX (y sala I del descenso), merge PR #31 (borrador).

## Estado actual · 2026-11-15 (verificación in-situ Limbo)
- In-situ CONFIRMADO con arte TR: HUB, descenso, CÍRCULO I (Vestíbulo de Turnos), banner de jefe «DJ DOOM — CAZADOR» con sprite boss_00 regenerado. 0 errores JS.
- Capturas guardadas en ART_EVIDENCE/TOTAL_REBUILD/{05_descent_pad,07_lujuria_arena,08_lujuria_boss}.png.
- CÍRCULOS II–IX in-situ NO confirmados aún (partida dirigida larga); no forzar en headless.
- Matriz: 9 filas «Verificado OK visual 2026-11-15»; jefes TODOS integrados (clase B); PR #31 sigue BORRADOR (merge pendiente de visto bueno).

## Estado actual · 2026-11-15 (TR_W13)
- HUB reorientado: 5 assets planos frontales → 3/4 elevado (candelabro, pedestal, librería, botelleros, neón zorro). Captura `09_hub_w13.png`; QA 271/271; commits empujados a PR #31 (borrador).
- Sigue pendiente/decisión usuario: CÍRCULOS II–IX in-situ; `cine_bg01_city` inset; merge PR #31.

## Estado actual · 2026-11-15 (in-situ completo)
- Los 9 círculos + HUB verificados en navegador con arte TR; 0 errores JS. Límite actual: balance/combate no jugado exhaustivamente.
- Capturas: ART_EVIDENCE/TOTAL_REBUILD/{07,08,10_*,11_*,12_*}_*.png — todos los ambientes (Limbo, Gula, Avaricia, Ira, Herejía, Violencia, Fraude, Traición, Núcleo) + Jefe LIMBO (DJ DOOM) en banner + enemigos visibles (Traición).
- Pendiente: merge PR #31 (borrador) bajo visto bueno del responsable; opcional: FX jefes, HUD definitivo, limpieza de matriz (verificar «Pendiente» ↔ estado real).

## Estado actual · 2026-11-15 (TR_W14)
- Refugio ampliado (~1.3x ancho / ~1.25x alto) y decoración recompactada por zonas; salida sustituida por GRIETA DEL REFUGIO (ojo de pozo) con descenso verificado en navegador (0 errores, 272/272).
- Registry: 272 entradas (30 legacy); PR #31 con todos los círculos + jefe LIMBO verificados in-situ.
- Pendiente: merge PR #31 (visto bueno del responsable); opcional FX jefes/HUD definitivo; `cine_bg01_city` inset.

## Estado actual · 2026-11-15 (TR_W15 · REDISEÑO del Refugio)
- **Rediseño arquitectónico completo del Refugio** (encargo usuario 2026-11-15; tras auditoría `docs/REFUGIO/AUDIT_2026-11-15.md`). Sectores E/C/A/D/B/F con arquitectura pintada en cache (alfombra, círculo rúnico, scorch, runner, pools de luz). Identidad visual intacta; 0 sistemas nuevos inventados.
- Registry **275/275** (3 assets nuevos: `prop_weapon_rack`, `prop_astral_table`, `prop_tesla_orb`); IDs de estaciones conservados (`descent`/`armory`/`dj`/`map`); spawn (910,700) intacto; cámara reclampada (bounds sin cambios); hook QA `__DD_HUB_DEBUG_ZOOM`.
- Verificado in-situ en navegador: integridad **275/275**, 0 pageErrors; flujo grieta → cinemática → Limbo OK; capturas `15..22_*_w15.png`.
- Pendiente: merge PR #31 (borrador, bajo visto bueno del responsable); la performance headless SwiftShader es lenta (~8 fps) — en Chrome/GPU real no aplica; opcional: versión cenital «verdadera» de VR/AR no procede.

## Estado actual · 2026-11-15 (TR_W15b · refugio entre runs + escala)
- **«Sensación de refugio entre runs»** (encargo usuario): cama musical de club al entrar (stop al descender), bartender y armero con diálogo propio (TEMPO narra), TEMPO aleatorio al entrar, ambiente vivo (parpadeo de velas, 26 brasas sobre la grieta, 34 motas en charcos de luz).
- **Pase de escala de assets** (feedback «fallos de distribución de tamaños»): drawProp acepta `dw`; los 37 props del Refugio tienen escala deliberada (profe ~112 px de referencia); flower sobre la mesa, rack/palma dentro de la sala.
- Capturas `ART_EVIDENCE/TOTAL_REBUILD/23..28_*_w15b.png`; QA integrity **275/275**, 0 pageErrors; estaciones nuevas `bar` y `armorer` verificadas in-situ (near/prompt/diálogo).
- Pendientes documentados (ver docs/REFUGIO/REFUGIO_REDISENO_2026-11-15.md §TR_W15b): un solo retrato (TEMPO narra a bartender/armero), backbar denso contra el muro N, mezzanine parcialmente bajo el HUD, charcos estáticos, rendimiento SwiftShader ~8 fps en headless. Merge PR #31 sigue pendiente de visto bueno.

## Estado actual · 2026-11-15 (TR_W16 · cierre «fallos conocidos» del refugio)
- **Retratos propios**: `dialogue_portrait_bartender` y `dialogue_portrait_armorer` (tanda TR_T02, inventory 349) — registry **277/277**; `showDialogue` acepta `portraitId`; hablan «EL BARTENDER»/«LA ARMERA» en primera persona.
- **Backbar**: estanterías dw 150 y separadas (268/459/650); **charcos de luz vivos** (respiración ±18 % por sector, fuera de la caché); **mezzanine** bajado a y=206 y recortado a h=118 (solape residual con el HUD solo con jugador pegado al muro N; documentado).
- Verificado: integrity **277/277**, 0 pageErrors, 0 console errors; capturas `29..31_*_w16.png`.
- Persisten: grieta no es pozo 3D (documentado), SwiftShader headless ~8 fps (no aplica a Chrome real), mezzanine residual bajo HUD (inherente al layout actual). Merge PR #31 pendiente de visto bueno.

## Estado actual · 2026-11-15 (TR_W17 · distribución anclada a muros)
- Redistribución completa del Refugio anclada a muros/ejes (barra en muro N con backbar fuera de la banda de portales, armería en columna W, escenario alineado, salón simétrico, ocio en fila SE); pasillo SO→grieta despejado (el harness ya no se atasca).
- Verificado: integrity **277/277**, 0 pageErrors; capturas `32..35_*_w17.png`; informe §10 en REFUGIO_REDISENO_2026-11-15.md.
- Merge PR #31 pendiente de visto bueno del usuario.

## Estado actual · 2026-11-15 (TR_W18 · escala protagonista + limpieza)
- Protagonista del Refugio **134 px** (antes 112); NPCs al alza (DJ 132 / bar 116 / armera 118); collision intacta.
- Retirados bollardos del ala Tesla, 2 plantas sueltas, la palma solitaria del sur y el candelabro extra del salón; motas 34→24.
- QA: integrity **277/277**, 0 pageErrors; capturas `32..35_*_w17.png` regeneradas.
- Merge PR #31 pendiente de visto bueno del usuario.

## Estado actual · 2026-11-15 (TR_W19 · poda de props)
- Refugio podado de 37 → **26** props (backbar 3→2, palmeras del escenario fuera, arcade gemelo fuera, planta salón fuera, caja redundante fuera). Conservados: Mesa Astral/eje, barra, escenario, armería, salón, arcade+vending, Tesla, fox, portales.
- QA: integrity **277/277**, 0 pageErrors; capturas `32..35_*_w17.png` regeneradas.
- Merge PR #31 pendiente de visto bueno.

## Estado actual · 2026-11-15 (TR_W20 · portales fuera, barra integrada, una sola máquina)
- **Banda de 9 portales eliminada** (`paintMezzanine` y catálogo retirados; el muro norte ya luce solo sus nichos Góticos).
- **Barra integrada**: backbar continuo en la misma línea (estantería–estantería–nevera a y=330), mostrador pegado (y=362), taburetes alineados; el cooler deja de flotar en medio de la sala.
- **Máquina duplicada eliminada**: expendedor de elixires (prop_vending_machine) fuera; el rincón SE queda con arcade único + banco.
- QA: integrity **277/277**, 0 pageErrors, 0 console errors; capturas `32..35_*_w17.png` regeneradas.
- Merge PR #31 pendiente de visto bueno.

## Estado actual · 2026-11-26 · geometría experimental 2.3
- Fase 3 **incompleta**: 2.3 opt-in publica geometría compilada, excluye Hangar y respeta versión del guardado; por defecto continúa 2.0. Detalle, límites, assets ausentes y reversión en `docs/PROPUESTA_GENERACION_FASE_2.md`.
- Medido: 10.000 mapas/115.000 salas con coincidencia de geometría; seed 0 en navegador 257 puertas y 920 spawns puntualmente, nueve descensos asistidos. No prueba campaña natural, cobertura física de todas las seeds ni arte visual.
- Generación headless media/p95 2.0: 0,285/0,400 ms; 2.3: 1,663/6,600 ms. Regresión; no activar por defecto. Pendientes variedad, siluetas, identidad de círculos, assets y QA completo.

## Seguimiento · 2026-11-26 · variedad y rendimiento
- Auditoría de silueta y puertas canónicas 2.2/2.3: 7.516/10.000 mapas con al menos una repetición entre salas compiladas; Hangar excluido. Siete tipos cuentan con una sola plantilla en la muestra. Detalles en `docs/PROPUESTA_GENERACION_FASE_2.md`.
- Se descartó una optimización de búsqueda de población: resultados idénticos en 108.000 salas, pero A/B headless no mejoró el tiempo. Código y builds originales restaurados. Fase 3 sigue incompleta.

## Seguimiento · 2026-11-26 · precálculo de población
- Se reutilizan segmentos y trigonometría durante cada adaptación/validación, sin caché global ni cambios al bucle de frame. 108.000 poblaciones legacy y 115.000 topológicas idénticas a la copia anterior; 1.000 planes por versión 2.0–2.3 comparados en navegador.
- A/B secuencial 2.1 headless: media/p95 2,608/9,9 → 1,667/7,0 ms; 2.3 sigue más lento que 2.0 (1,686/6,2 frente a 0,304/0,4 ms en otro ensayo). Alcance, backup y reversión en `docs/PROPUESTA_GENERACION_FASE_2.md`. Fase 3 incompleta.

## Seguimiento · 2026-11-26 · variantes 2.4 opt-in
- `__DD_ROOM_VARIANTS_V3` activa 2.4.0: variantes de proporción heredadas de cinco prefabs, con bit de seed por rol. Flag apagado por defecto; guardados conservan su versión.
- 10.000 mapas: cero firmas repetidas entre salas compiladas, normalizando escala uniforme/giro/reflexión; Hangar excluido. Esto no demuestra diferencia visual perceptible ni dos diseños artísticos por tipo. 276 configuraciones y 624 salidas verificadas en rejilla; seed 0 comprobada puntualmente en motor.
- Faltan sprites direccionales y validación visual; regresión de generación frente a legacy. Fase 3 sigue incompleta. Inventario, pruebas, backup y reversión: `docs/PROPUESTA_GENERACION_FASE_2.md`.

## Seguimiento · 2026-11-26 · visibilidad y mobiliario direccional
- Dos pares de variantes proporcionales inspeccionados en navegador resultan prácticamente indistinguibles; no se cumple variedad perceptible. Capturas y límites en `docs/PROPUESTA_GENERACION_FASE_2.md`.
- Creadas diez vistas direccionales y diez sombras para las cinco bases; comprobados archivos, pivotes y dibujo por el renderer real en seed 0. No se han evaluado todos los círculos ni rotura en combate natural. El arte usa el cargador de pivotes de prefab existente, no `DD_ASSETS`.

## Seguimiento · 2026-11-26 · entrantes de silueta 2.5
- Flag opt-in `__DD_ROOM_SILHOUETTES_V3`: variantes con entrante real de 140 unidades, sin cambios de arte ni sockets; versiones previas preservadas. En un par de capturas del pasillo se aprecia un cambio de forma; no valida percepción de todos los tipos.
- Barrido 10.000 mapas: sin firmas duplicadas entre salas compiladas, Hangar excluido; 624 desembarcos accesibles en rejilla. Seed 0 comprobada en motor y progresión asistida. Tiempo headless medio/p95 2.0: 0,208/0,300 ms; 2.5: 1,258/5,000 ms.
- Fase 3 abierta: falta identidad por círculo, unicidad incluyendo Hangar y validación visual/juego/rendimiento integral. Evidencias y reversión en `docs/PROPUESTA_GENERACION_FASE_2.md`.

## Seguimiento · 2026-11-26 · perfiles de círculo 2.6
- `__DD_CIRCLE_ROOM_PROFILES` opt-in asigna nueve mezclas deterministas de tres plantillas y tres niveles de mobiliario; el núcleo mantiene topología 2.5. Nueve distribuciones distintas comprobadas en 1.000 seeds por piso, no nueve diseños artísticos nuevos.
- 10.000 mapas sin firma repetida incluyendo Hangar del plan; coincidencia nativa del Hangar en seeds 0–9. 18 capturas en dos tipos/círculo, nueve descensos y victoria asistida/tainted; no campaña natural.
- Headless generación media/p95 2.0 0,193/0,300 ms vs 2.6 1,281/5,000 ms; frame/heap muestreados solo una sala. Fase 3 continúa abierta. Informe, pruebas y reversión en `docs/PROPUESTA_GENERACION_FASE_2.md`.

## Seguimiento · 2026-11-26 · fase 4 iniciada, tarima 2.7
- Auditoría independiente encontró 40 esquinas de tarima camarote fuera del polígono entre 620 configuraciones 2.6. En 2.7 opt-in se reposiciona la tarima óptica; 0 esquinas fuera en el barrido equivalente. Guardados anteriores preservados.
- Fase 4 iniciada, no aprobada; fase 3 sigue abierta. Detalles, pruebas, límites y reversión en `docs/FASE_4_GENERACION_QA.md`.

### Seguimiento QA 2026-11-26
Intento natural 2.7 por controles: derrota en primera sala; no victoria ni campaña completa. Matriz asistida seed 0: 116 capturas/10 pisos, revisadas en hojas de contacto; arquitectura repetitiva y visibilidad limitada. Perfil y experimento de preparación compartida documentados en `docs/FASE_4_GENERACION_QA.md`; mejora no concluyente, revertida. Regresión de generación y QA integral siguen abiertas; default 2.0 intacto.

Continuación: segundo intento natural con esquiva terminó en derrota en r0. La optimización experimental de distancias redujo el tiempo frente a 2.7 en A/B, pero siguió lejos de 2.0 y se revirtió; datos y parche en informe de fase 4. Sin cambios activos en generación.

Continuación QA: búsqueda acotada combinada con distancias redujo 2.7 en A/B de 2,151 a 1,590 ms/mapa, pero 2.0 midió 0,268; revertida y guardada con SHA. Perfil anidado del compilador y comparación de 10.000 planes 2.7 en `docs/FASE_4_GENERACION_QA.md`. Regresión y campaña natural continúan pendientes.

Continuación: corregido piloto natural para pulsar y soltar ratón; una partida despejó r0 y terminó por tiempo, otra alcanzó r1 y fue derrotada. La prueba previa mantuvo el botón pulsado y tiene ese límite. Experimento de caché de aristas mostró mejora temporal pequeña y mayor delta post-GC, y se revirtió; sin cambios activos. Detalles y límites en `docs/FASE_4_GENERACION_QA.md`.

Continuación: 116 capturas canvas seed 1, 10 pisos, revisadas en hojas de contacto; persisten etiquetas dibujadas y recortes de cámara. Ocho capturas específicas de tarima y dos pares revisados; en tienda las tarjetas tapan parte de la escalera. Nuevo piloto natural con habilidades despejó r0 y cayó en r1. QA integral y regresión siguen abiertos; detalle en informe de fase 4.

Continuación: telemetría del dado confirma tiradas e impactos de área/contacto; piloto rápido despejó r0 y r1, llegó a r2 y murió. Corregida cobertura de A/B previos: 1.000 mediciones eran 100 pares seed/piso repetidos. Nuevo A/B con 1.000 pares distintos: 2.0 0,254 ms, 2.7 2,120 ms, experimento 1,674 ms media. Revertido; pendientes sin cambios. Véase informe de fase 4.

Continuación: piloto natural con evasión llegó a r2 y murió. Prototipo de borrador físico difiere compilación de salas: combinado media/p95 de generación 0,857/3,4 ms frente a 2.7 2,448/9,5 y 2.0 0,245/0,4 en un A/B; traslada coste a primera entrada y continúa por encima de legacy. Revertido; pruebas, parches y límites en informe de fase 4.

Continuación: medidos 100 planos retenidos y 12 salas con prototipo diferido. Dos fixtures inválidos revelaron errores diferidos; un prototipo con guardas anticipadas rechazó ambos y conservó 10.000 planes 2.7 muestreados, pero 0,902 ms/mapa frente a 0,196 de 2.0 en A/B. Sigue revertido; memoria/frames y límites en informe de fase 4.

### Incremento 2.8 opt-in: escalones (fase 4 sigue abierta)
Auditoría detectó 2.024 esquinas de escalón fuera en datos y 1.960 proyectadas en 2.7. `__DD_PREFAB_STAIR_REPAIR` deriva pasillo y arena, desplaza sus tarimas 60 unidades hacia dentro; en 2.8 quedan 0 esquinas fuera y 0 cruces estrictos en 620 configuraciones. 10.000 mapas deterministas, físicos comparados, seed 0 nativo y nueve descensos asistidos PASS; capturas antes/después revisadas. Default 2.0 y guardados anteriores prevalecen. Persisten regresión respecto a 2.0, campaña natural y QA visual integral; no se declara fase 4 terminada. Detalle, límites, assets y reversión en `docs/FASE_4_GENERACION_QA.md`.

Continuación QA 2.8: 792 esquinas de tarima proyectadas fuera del suelo; un muestreo geométrico encontró todas las 178.677 muestras fuera cubiertas por caras/tapas de muro dibujadas después, sin demostrar píxeles finales. Nuevo intento natural con interacción de recompensas terminó en r1. Ver informe de fase 4; no se modifica producto ni se cierra la fase.
