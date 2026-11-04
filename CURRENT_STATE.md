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
