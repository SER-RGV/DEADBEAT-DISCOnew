# TANDA 07 — «El umbral del infierno» · Informe de implementación (Fases 2–5)

**Fecha:** 2026-11-04 · **Rama:** `arena/109fe45c-deadbeat-disconew` · **PR #1:** `OPEN`, sin merge · **`main`:** `d75e021` intacta
**Resultado:** `INTEGRADO_VALIDADO` · QA **35/35 APROBADO** · 0 `pageerror`
**Documento principal de las fases previas:** `ART_TANDA_07_FASE0_AUDITORIA.md` y `ART_TANDA_07_FASE1_GEOGRAFIA.md` (commit `c6c1303`).

> El usuario respondió **«si»** a la autorización para pasar a la Fase 2 y empezar a generar assets y a tocar los sistemas. Este informe cubre exactamente ese trabajo: Fase 2 (llegada), Fase 3 (vida de NPC), Fase 4 (descenso) y Fase 5 (integración + QA).

---

## 1. Resumen ejecutivo

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Auditoría del juego real (23 filas, 16 APROBADO / 6 NO VERIFICADO / 1 BLOQUEADO) | Entregada en `c6c1303` |
| 1 | Composición geográfica, cotas, capas, riesgos, no regresión | Entregada en `c6c1303` |
| **2** | **Llegada breve desde el exterior infernal** + 6 assets de geografía/llegada/pozo | **Implementada** |
| **3** | **Vida de NPC**: 6 actores, 5 actividades, reacción al jugador, `Yc.reduced` | **Implementada** |
| **4** | **Descenso con continuidad visual** sobre `floorDropAnim` | **Implementada** |
| **5** | **Integración aditiva + QA A/B y regresión** | **35/35 APROBADO** |

Se mantiene **un único motor, un único canvas de juego, una única cámara, un único secuenciador de audio y una única cadena de `requestAnimationFrame`**. No se han modificado colisiones, estaciones, guardado, progresión, HUD ni geometría jugable. Todo lo nuevo se retira en caliente con `window.__DDM_HUB_T07 = false`.

---

## 2. Assets producidos (6 finales, 0 sprites de NPC nuevos)

`ART_ASSETS/hub/tanda_07/manifest.json` → `INTEGRADO_VALIDADO`, `allValid: true`, **6/6 SHA-256 verificados, 0 discrepancias**.

| ID | Alias V5 | Final | Medida | Cota / uso | Mundo |
|---|---|---|---|---|---|
| T07-01 | `h07_labio_acantilado` | `01_labio/final/hub_t07_01_labio.png` | 1500×115 RGBA | COTA −01 · labio | `[500,1470,1500,115]` |
| T07-02 | `h07_estrato_rococo` | `02_estrato/final/hub_t07_02_estrato.png` | 2100×110 RGBA | COTA −02 · pared rocosa | `[200,1585,2100,110]` |
| T07-03 | `h07_apertura_profundidad` | `03_apertura/final/hub_t07_03_apertura.png` | 420×260 RGBA | COTA −02/−03 · abertura | `[1040,1560,420,260]` |
| T07-04 | `h07_exterior_infernal` | `04_exterior/final/hub_t07_04_exterior.jpg` | 1280×720 JPEG opaco | Fase 2 · placa de llegada | pantalla |
| T07-05 | `h07_pozo_capas` | `05_pozo/final/hub_t07_05_pozo.png` | 512×1024 RGBA | Fase 4 · paredes del pozo | pantalla |
| T07-06 | `h07_panorama_acantilado` | `06_panorama/final/hub_t07_06_panorama.jpg` | 1280×720 JPEG opaco | Fase 2 · placa intermedia | pantalla |

Pipeline: `generate_image` → 8 fuentes → recortes (`(0,96,1584,400)` y `(0,100,1584,610)` para eliminar franja blanca / cielo) → `resize LANCZOS` a tamaño exacto → máscaras `top_corners` / `aperture` / `shaft` → despill oscuro → verificación de halos (<1 %) → `ART_TOOLS/prepare_hub_tanda_07.py`.

**Descartes documentados:** dos intentos de sprite «clubber sentada» salieron de pie y se eliminaron; la Fase 3 se resuelve con los 5 NPC V5 existentes (ver `ART_TANDA_07_FASE3_MATRIZ_NPC.md`). Se conservan 6 fuentes en `_source/` y 2 referencias V5 en `_refs/`.

---

## 3. Integración (patrón aditivo, sin sistemas nuevos)

### `ART_PACK/art_pack.js` · 94.095 → 100.474 B

- Bloque `TANDA07:BEGIN/END`: `HUB7_ASSETS` (6), `applyHub7()/restoreHub7()/loadHub7()/hub7()/hub7Tag()/hub7Restore()/hub7Apply()`.
- `loadHub7()` **encadenado tras `loadHub6()`** dentro del mismo boot; `st.status` suma `st.hub7Errors`.
- **El mismo `load()` y el mismo registro `window.__DDM_V5_IMG`**: 162 → **168 claves V5**, sin bajas. Sin loader paralelo.
- `st.version` += `+hub-tanda07`; API pública `hub7*`.
- `node --check` OK.

### `DEADBEAT_DISCO.ART.html` · 13.389.425 → 13.414.811 B

- Módulo `T07` dentro de `initDmoHubV35()` (estado, dibujo, actores, API `window.DMO_HUB_T07`).
- `buildHubSpace()`: `T07.installActors()` y `T07.installHooks()` **una sola vez**, junto al bucle `ambientDancers` existente.
- Cuatro enganches, **últimos de su cadena**:

| Hook | Contenido | Espacio |
|---|---|---|
| `Wf` | geografía: gradiente de vacío, estratos, abertura, labio, ingletes con T06, luz de profundidad | mundo |
| `Ph` | pulso de abertura, 26 brasas deterministas, 14 motas de polvo | mundo |
| `zf` | llegada / descenso **antes del HUD** (placas, luces, parallax del pozo, haz, gradientes) | pantalla |
| `Tf` | reloj real acumulado, llegada, muestras del descenso, sin bucle propio | estado |

**Corrección de integración:** un primer intento montó los enganches en el cierre exterior del script y produjo `ReferenceError: Wf is not defined`. Se movieron al ámbito de `initDmoHubV35` (donde TANDA 04/05/06 ya los encadenan), pero **ejecutados en tiempo de arranque** desde `buildHubSpace()`, de modo que quedan al final de las cadenas ya montadas. No se reescribió ninguna línea de TANDA 01–06.

**Audio: deliberadamente intacto.** `DMO_MUSIC.cineFilter`/`cineGain`/`cineSting` están protegidos por `M.cine`; habilitarlos exigiría `cineBegin()`, que fuerza un `forceKey()` inmediato y marca la música como cinemática. No se añadió ni un efecto constante, ni un segundo secuenciador, ni un filtro paralelo. La «presencia sonora» de la llegada se deja al director musical existente (`rampFilter(20000,0.4)` / `rampTrans(1,0.3)` al entrar en HUB). El descenso conserva su cadena original: `HUB → DESCENT`, `stairs:descenso hacia 0`, `limbo @118`, `LANDING → EXPLORATION`, con **1 secuenciador** en todo momento (`T07-13`, `T07-28`).

---

## 4. Fase 2 — Llegada breve desde el exterior infernal

- **Disparo:** cambio de `hub.location` `CAMPAIGN_ROOM`/`TRANSITION` (o primer arranque) → `HUB`, esperando a que termine la intro y a que `mode === 'EXPLORATION'`. Los modales de estación no cambian `hub.location`, así que **no** la disparan.
- **Duración:** 1,85 s (`0,95 s` con `Yc.reduced`), muy por debajo del límite de 2,4 s.
- **Composición:** placa `h07_exterior_infernal` con alfa decreciente, crossfade sutil con `h07_panorama_acantilado`, 5 luces de neón que se encienden, 20 brasas ascendentes y vela de viñeta que se retira. Sin texto, sin HUD nuevo, sin movimiento de cámara.
- **Control:** `hub.transitionLock` permanece `false`, `mode === 'EXPLORATION'`, `modalOpen === false` en los 8 fotogramas activos medidos (`T07-11`).
- **Repetibilidad:** auto al entrar, `replayArrival()` ×2 y de nuevo al regresar desde LIMBO (`plays 1 → 3 → 4`, `T07-09/23/30`).
- **Sin fotograma negro:** luminancia media 47,38 / 47,39 / 47,39 (`T07-12`).

## 5. Fase 3 — Vida de NPC

6 actores · 5 actividades (danza ×2, conversación ×2, descanso, recorrido) · 10 figuras totales contando los 4 `ambientDancers` intactos. `solid:false`, `tall:true`, Y-sort por línea de pies, `Yc.reduced` respetado, reacción al jugador a <185 u. **Sin sprites nuevos, sin IA, sin diálogos ni misiones.** Detalle completo en `ART_TANDA_07_FASE3_MATRIZ_NPC.md`.

Mediciones: frames `[0,1,2,3]` en danza y recorrido; patrulla de **120 px** con 29 posiciones distintas e inversión de `flip`; WASD avanza 192 px atravesando la zona de actores; 0 `pageerror`.

## 6. Fase 4 — Descenso con continuidad visual

- La geografía del umbral sigue dibujándose durante `TRANSITION` / `plunge` (el HUB continúa en pantalla) y se retira al cargar `CAMPAIGN_ROOM`.
- Capa de pantalla durante `plunge`/`skyfall`: `h07_pozo_capas` en parallax vertical con centro transparente, gradiente de profundidad, haz de luz que se estrecha y 18 desprendimientos ascendentes. **Ningún alfa opaco**: luminancia mínima **39,15** sobre 255 en 24 muestras (`T07-27`).
- Progreso tomado del objeto interno real (`floorDropAnim.stairProgress` / `shaftOpen` / `phase`), no del alias del API público: `maxStairP = 1`, fases `plunge → skyfall → impact`, etapas `descent → arrival → landing`.
- **86 fotogramas** de continuidad dibujados (`T07-26`); `startCampaignFromHub(0) === true`; destino `CAMPAIGN_ROOM / EXPLORATION`, `transitionLock:false`, zoom de vuelta a `0.9375`, `DMO_DUNGEON.audit().ok === true` (`T07-24/25/29`).
- El audio del descenso es **el que ya existía**; no se añadió nada.

## 7. Fase 5 — QA A/B y no regresión

Arnés: `ART_TOOLS/qa/validate_hub_tanda_07.js` (Chromium 131 + playwright-core, 1280×900, SwiftShader). Resultado: **`APROBADO` 35/35**, `qa_tanda07.json`.

| Bloque | Comprobaciones | Resultado |
|---|---|---|
| Boot / assets | `T07-01…08` | `applied`, 6/6 `loaded`+`exactSize`+`registered`, 6 alias, 168 V5, 27 canvas, T01–06 sin errores |
| Enganches | `T07-06B` | `Wf/Ph/zf/Tf` instalados al arrancar el HUB |
| Llegada | `T07-09…13`, `T07-23`, `T07-30` | auto, ≤2,4 s, sin bloqueo, sin negro, audio intacto, repetible ×3 |
| NPC | `T07-15…19`, `T07-34` | 6 actores / 5 actividades, frames, patrulla, reacción, WASD, movimiento reducido |
| A/B | `T07-20…22` | ON +20 dibujos / OFF +0; diff de franja sur **37,41**; estaciones y audio intactos |
| Descenso | `T07-24…29` | progresión real, 86 capas, sin negro, audio 1 secuenciador, LIMBO y control recuperado |
| Cierre | `T07-14`, `T07-31…33` | zoom `0.9375`, 6 zonas / 11 estaciones, 0 `pageerror`, 0 errores T07, sólo los 2 `404` externos preexistentes |

**A/B:** `window.__DDM_HUB_T07 = false` detiene por completo geografía, ambiental, llegada, descenso y actores; el diff de píxeles queda localizado en la franja sur (`t07_qa_03_AB_ON_sur.jpg` vs `t07_qa_04_AB_OFF_sur.jpg`). Sin segundo canvas/cámara/audio/motor: 27 canvas y 1 secuenciador antes y después.

Evidencias: `ART_EVIDENCE/hub/tanda_07/` — 31 ficheros de F0/F1 + `qa_tanda07.json`, `report.json`, `hashes.json` y 12 capturas `t07_qa_*.jpg`.

---

## 8. Límites y trabajo NO verificado (heredado de Fase 0, sin cambios)

| Ítem | Estado |
|---|---|
| Vídeo / captura en movimiento continuo | `BLOQUEADO` |
| Mando físico real (sólo gamepad sintético de F0) | `BLOQUEADO` |
| Audio **audible** (sólo estado del grafo/secuenciador y eventos) | `NO VERIFICADO` |
| Inventario completo de frames NPC originales | `NO VERIFICADO` |
| Regresión **formal completa** de TANDA 01–06 (aquí: smoke de carga, topología, WASD y audio) | `NO VERIFICADO` |
| Rendimiento sostenido en producción con los 6 assets T07 | `NO VERIFICADO` |
| Medición de latencia de llegada en hardware real | `NO VERIFICADO` |
| Cierre del performance gate de T02 y 8 `BLOQUEADO` históricos de T03 | Fuera de alcance, conservados |

`officialUntainted:false` aparece en el arnés por `DMO.debug.teleport` / `debugSpawnBeacon`; es un artefacto de QA, no del juego. Los dos `404` son los recursos externos `/cdn-cgi/challenge-platform/` preexistentes.

---

## 9. Estado Git y archivos

- Sin merge de PR #1; `main` y `origin/main` en `d75e021fb13418bf49d5853c1a9583e7d11b90f2`.
- Modificados: `DEADBEAT_DISCO.ART.html` (SHA `a757a49e…`), `ART_PACK/art_pack.js` (SHA `c5e5759b…`).
- Nuevos: `ART_ASSETS/hub/tanda_07/` (15 ficheros, 12,9 MB), `ART_TOOLS/prepare_hub_tanda_07.py`, `ART_TOOLS/qa/apply_hub_tanda_07.py`, `ART_TOOLS/qa/validate_hub_tanda_07.js`, `ART_TOOLS/qa/finalize_hub_tanda_07.py`, `ART_TANDA_07_FASE3_MATRIZ_NPC.md`, `ART_TANDA_07_REPORT.md`, evidencias y `report.json`/`hashes.json`.
- Backups de reversión: `/tmp/t7/DEADBEAT_DISCO.ART.html.PRE_T07`, `/tmp/t7/art_pack.js.PRE_T07`.

**Reversión rápida (sin tocar archivos):** `window.__DDM_HUB_T07 = false`.
