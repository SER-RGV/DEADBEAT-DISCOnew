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
