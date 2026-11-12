# CURRENT STATE — DEADBEAT DISCO

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
