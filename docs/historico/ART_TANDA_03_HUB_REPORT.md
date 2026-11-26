# DEADBEAT DISCO — HUB · TANDA 03 · ENVIRONMENT RECONSTRUCTION
### Informe final de entrega · 2026-11-03

- **Rama:** `arena/109fe45c-deadbeat-disconew` · **PR #1** (base `arte-y-recursos`, sin merge).
- **Build activa:** `DEADBEAT_DISCO.ART.html` — **INTACTA** (13.381.028 B / 19.839 líneas, SHA-256 `f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723`).
- **Único archivo de código modificado:** `ART_PACK/art_pack.js` (bloque independiente `HUB3_*`).
- **Veredicto global:** **`BLOQUEADO` para la integración de render**, **`APROBADO` para producción + carga + QA A/B + regresión**, **`NO VERIFICADO` para visibilidad en producción**. Véase §10.

> **Lectura imprescindible antes de interpretar los 12/12:** el arnés aprueba la *producción, la carga, el registro, la medición de los bloqueos y la regresión*. **No aprueba que los 8 objetivos se vean en el juego**. Ninguno se dibuja. El protocolo apartado 1.6 obligaba a detenerse y registrar la discrepancia: se hizo en `ART_HUB_TANDA_03_AUDIT.md` (D‑01…D‑07) antes de producir, y el HTML no se ha tocado. No se confunde producción con integración, ni integración con validación.

---

## 1. Assets producidos

**8 unidades de producción / 13 PNG finales / 8 fuentes originales** en `ART_ASSETS/hub/tanda_03/`, con `manifest.json`. Cada unidad conserva `source/` (ilustración original íntegra) y `final/` (PNG RGBA preparado).

| ID | Unidad | Carpeta | Finales | Familia |
|---|---|---|---|---|
| T03-01 | `HUB_FLOOR_PATCH_O` | `01_floor_patch_o/` | 1 | A · suelos |
| T03-02 | `HUB_FLOOR_PATCH_E` | `02_floor_patch_e/` | 1 | A · suelos |
| T03-03 | `HUB_FLOOR_PATCH_S_CRACK` | `03_floor_patch_s_crack/` | 1 | A · suelos |
| T03-04 | `HUB_FLOOR_NORTH_DJ` | `04_floor_north_dj/` | 1 | A · suelos |
| T03-05 | `HUB_PLANTER_VARIANT_02` | `05_planter_variant_02/` | 1 | B · mobiliario |
| T03-06 | `HUB_BENCH_VARIANT_02` | `06_bench_variant_02/` | 1 | B · mobiliario |
| T03-07 | `HUB_VIP_BOOTH_LOUNGE` | `07_vip_booth_lounge/` | 1 | C · lounge |
| T03-08 | `HUB_ZONE_SIGNAGE` | `08_zone_signage/` | **6 variantes A–F** | D · señalética |

Los 4 suelos son **una misma familia material** (mármol obsidiana, latón envejecido, esmalte, neón magenta/cian), con composiciones distintas y justificadas: abanico radial (O), chevrones anidados (E), fisuras cian que continúan la grieta sin tocar su geometría (S), onda/ecualizador incrustado vinculado al DJ (N). No repiten la textura `floor_01_neon_dancefloor` de T01 ni los recursos de T02. Las 2 variantes de mobiliario comparten lenguaje ornamental con T02 pero diferencian silueta (urna acanalada alta frente a tina baja; respaldo en abanico nervado frente a banco liso), conservando anclaje `bottom-center` y dimensiones exactas de los slots de T02. La señalética es **un sistema**: 6 placas físicas de latón con cartela, mismo tipo, materiales, iluminación, jerarquía (numeral romano → filete de neón → rótulo) y escala, con identidad cromática por zona; no parecen UI flotante y no modifican navegación, puertas ni desbloqueo.

**Nota de alcance (D‑03):** el pliego pide «exactamente 10 assets» pero el apartado 2 define 8 unidades (la 08 son 6 variantes) y el apartado 6 excluye explícitamente `wall_limbo_ticket_window` y `limbo_gate_stage`. La estructura de directorios propuesta tiene exactamente 8 carpetas `01…08`. Se entregan 8 unidades / 13 PNG y se registra la inconsistencia numérica en lugar de inventar 2 recursos.

---

## 2. Dimensiones reales, transparencias y hashes

Todas las dimensiones del manifiesto están **medidas** (Pillow sobre el archivo final + geometría de runtime), nunca estimadas. `ART_EVIDENCE/hub/tanda_03/verificacion_carga.json`, `hashes.json`, `manifest.json`.

| Recurso | Dimensiones reales | RGBA / α | Halo blanco | Origen de la dimensión |
|---|---|---|---|---|
| `hub_floor_patch_o.png` | 580×430 | [0,255] | 0,01 % | rectángulo mundo medido `[290,720,580,430]` |
| `hub_floor_patch_e.png` | 580×430 | [0,255] | 0,11 % | `[1630,720,580,430]` |
| `hub_floor_patch_s_crack.png` | 760×329 | [0,255] | 0,00 % | caja grieta `[1085,1256,330,180]` → borde sur `y=1585` |
| `hub_floor_north_dj.png` | 760×224 | [0,255] | 0,00 % | borde suelo `y=265` + caja DJ `[1058,280,384,209]` |
| `hub_planter_variant_02.png` | 96×108 | [0,255] | 0,00 % | natural exacta de `club_neon_planter_prop` (T02) |
| `hub_bench_variant_02.png` | 256×198 | [0,255] | 0,01 % | natural exacta de `limbo_bench_prop` (T02) |
| `hub_vip_booth_lounge.png` | 216×136 | [0,255] | 0,00 % | caja real `108×68` ×2, aspecto 1,588 sin deformar |
| 6 × `hub_zone_signage_*.png` | 192×128 c/u | [0,255] | 0,06 % | **sin slot medido**: se declara explícitamente; tamaño real del archivo verificado |

- 13/13 `exactSize`, 13/13 esquinas transparentes, 13/13 `borderClean`, halo máximo **0,11 %**, `contain` + pivote sin deformación en los 13.
- Pipeline: `ART_TOOLS/prepare_hub_tanda_03.py` reutiliza `build_alpha()`/`crop_alpha()` de T01/T02 y añade **despill por des-premultiplicación** (`fg = (src − (1−a)·bg)/a`) más un flood‑fill del reflejo gris conectado al exterior, que conserva los brillos cálidos interiores del latón. Esto redujo el halo de ~11 % a ≤0,11 % y eliminó el fondo crema del banco.
- **152 hashes SHA‑256** en `hashes.json` (fuentes, finales, evidencias, T01/T02, HTML, JS, informes): **0 discrepancias** contra el manifiesto. Hay capturas individuales `asset_01…asset_13_*.png` y `hoja_recursos_tanda_03.jpg`. **Son evidencia del archivo final, no capturas in‑game** (los 8 objetivos están bloqueados para render).

---

## 3. Código modificado

**Solo `ART_PACK/art_pack.js`** (de 1314 → 1572 líneas, `node --check OK`). Se mantiene `window.__DDM_V5_IMG`, se reutiliza `load()`, se respeta íntegramente el bloque `HUB2_*` y se crea un bloque **independiente `HUB3_*`**: `HUB3_ASSETS` (13 entradas), `HUB3_IMAGES`, `HUB3_ORIGINALS`, `applyHub3()`, `restoreHub3()`, `loadHub3()`, `hub3()`, `hub3Tag()`, `hub3Invalidate()`, `startHub3()` y la API pública `hub3 / hub3Manifest / hub3Restore / hub3Apply / hub3Tag`.

- Versión: `fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02+hub-tanda03`.
- `hub3Invalidate()` usa las **APIs existentes** (`DMO_INFERNAL_ART.invalidate()`, `__DDM_V5_MED_NO_SKULL=null`, `__T3B.setEnabled(true)`) para conservar la composición de las **dos capas cacheadas**. Se comprobó con un experimento sin invalidación que no es la causa del bloqueo D‑07.
- `startHub3()` arranca la carga en el **primer instante del boot** (con guarda de inicialización, sin loader nuevo) porque el canvas del menú se construye una sola vez.
- **No se crea** segundo motor, canvas superpuesto, HUB estático alternativo, nuevo sistema de cachés, loader paralelo ni registro de imágenes duplicado. `restoreHub3()` no puede deshacer T01/T02 y viceversa.
- **HTML activo intacto**; no se ha solicitado ni ejecutado autorización para modificarlo. Backups intactos. `git diff HEAD -- DEADBEAT_DISCO.ART.html backups/` = vacío.

---

## 4. Conexiones con slots reales — `BLOQUEADO` (8/8)

`ART_HUB_TANDA_03_AUDIT.md` y `ART_EVIDENCE/hub/tanda_03/{audit_runtime,slot_probe,geometry_probe}.json`.

| Objetivo | Clave V5 | Slot de dibujo | Pintor | Estado |
|---|---|---|---|---|
| 4 suelos | no existe | **no existe** | no | **BLOQUEADO** |
| 2 variantes | `club_neon_planter_prop` / `limbo_bench_prop` (1 solo slot por familia, ya ocupado por T02) | no hay segundo slot | sí, pero único | **BLOQUEADO** |
| 6 señales | no existen 6 slots | **no existe** | no | **BLOQUEADO** |
| VIP lounge | `hub_vip_booth_lounge` | **sí, en el código**: `gv(...)` → 4 `drawImage(vb,32,284,108,68)` en `d.menu` 768×500 del MENÚ | renderer **inactivo** (D‑07) | **BLOQUEADO** |

Mediciones que sostienen el bloqueo:

- 128→142 claves V5, **21 slots dibujados en el HUB**, 69 claves consultadas por los pintores: **0** corresponden a suelos, variantes o señalética.
- `Wf / Ph / zf / g / addHubCustomProp / hub / Ot` son `undefined` globalmente: **no existe gancho público al pintor del HUB** desde `art_pack.js`.
- Canvas de suelo cacheado medido: **1920×1320**, dibujado en mundo `(290,265)`, `builds=1`. No hay punto de inserción para paños discretos.
- `hub_vip_booth_lounge`: **0 dibujos en el HUB** (`vipDrawsHUB=0`, 4390 dibujos totales). Una sonda controlada con inyección anticipada acreditó que el pintor del código dibuja 4 veces a 108×68 (`slot_probe.json`), pero **5 arranques con el PNG real dieron 0 `drawImage`** y 0–2 consultas `gv`; la pantalla de título usa el canvas ilustrado `menu-canvas54` (960×540) y el canvas de píxeles `d.menu` no se blita.
- Los 13 PNG sí entran por el loader real y quedan registrados (12 alias `h03_*` trazables + `hub_vip_booth_lounge`). **Registro ≠ integración.**

Nada de esto se ha «arreglado» inventando un pintor: el protocolo lo prohíbe expresamente. Para desbloquear haría falta autorización explícita para un cambio mínimo del HTML activo (o una auditoría específica del renderer de píxeles).

---

## 5. Pruebas ejecutadas

`ART_TOOLS/qa/validate_hub_tanda_03.js` — **mismo procedimiento A/B de TANDA 02**, 3 fases sobre la misma build, mismo servidor, misma cámara, mismo arnés de 12 comprobaciones sin relajar criterios.

- **Entorno medido** (`version_probe.json`): Chromium **131.0.6778.0**, `playwright-core` **1.58.2**, SwiftShader por software, **1280×900**, `deviceScaleFactor=1`, `GET /` HTTP 200, cámara por `DMO.debug.teleport(x,y)` en 10 zonas.
- Fases: `ANTES` = `hub3Restore()` en arranque (antes de construir el menú); `CONTROL` = `hub3Restore()` en caliente dentro del HUB; `DESPUÉS` = HUB3 aplicado por el arranque normal.
- **12/12 `APROBADO`** en `report.json` (resumen: `{"APROBADO":12, "BLOQUEADO_INTEGRACION":8, "NO_VERIFICADO_VISIBILIDAD":1}`).
- Comprobado: 13/13 HTTP 200, 13/13 cargados/registrados/`exactSize`, 0 errores JS, 0 `pageerror`, 0 404 locales (solo las 2 rutas `/cdn-cgi/challenge-platform/` externas y preexistentes), V5 completo, T01 **10/10**, T02 **10/10**, arquitectura **10/10**, T03‑FASE‑D **12 poses**, `CAMPAIGN_ROOM` sin errores.
- Gameplay sin cambios: movimiento (Δ comparable con tolerancia 25 px, también A↔C), colisión contra la barra (Δ idéntico, tolerancia 0,01 px), 6 zonas / 11 estaciones (`hubAudit` y `stations` idénticos en las 3 fases), `openStation('bar')`, transición `r23`, puertas cerradas/abiertas, disparo, `Ot.openT` intacto.
- Cachés: `__T3B_HUB_QA.available=true`, `builds≥1` en las 3 fases, canvases base idénticos, sin canvas nuevo del pack (`comprobacion_caches.json`). El canvas de retrato 72×72 lo crea el propio juego al abrir la estación.
- **Rendimiento antes/después** (`performance.json`, `resultados_ab.json`): se distingue **coste de carga** (13 PNG, una sola vez: `hub3.appliedAt − startedAt`) de **coste de render** (mediana de 40 `rAF` en el HUB, misma cámara: **16,7 ms** en ANTES/CONTROL/DESPUÉS). Las desviaciones de `p90` aparecen también entre ANTES y CONTROL y **no se atribuyen a los assets**; el entorno usa SwiftShader por software. No se modificó el arnés para aprobar artificialmente.

---

## 6. Comparativas visuales

- `ART_EVIDENCE/hub/tanda_03/comparativa_antes_despues.jpg` (6 pares: MENÚ, centro, DJ/norte, grieta/sur, barra/este, arsenal/oeste).
- `visual_diff.json`: **15 comparativas** con umbral 12/canal. Principales: menú A↔D **1,39 %**, HUB principal A↔D **1,22 %**, A↔C **3,87 %**, C↔D **3,53 %**, puertas cerradas↔abiertas **5,17 %**. Las diferencias de 1–4 % son ruido de fotograma/animación presentes también entre ANTES y CONTROL; **no se interpretan como cambios de arte**, porque ningún recurso T03 se dibuja.
- Capturas: `antes_00_menu.png`, `despues_00_menu.png`, `antes_01_hub.png`, `despues_01_hub.png`, `control_01_hub.png`, 10 zonas × ANTES/DESPUÉS, `doors_closed.png`, `doors_open.png`, `regresion_campaign.png`, `despues_tras_movimiento.png`, 10 `audit_<zona>.png`, 13 `asset_*.png`. **74 archivos / 79 MB** de evidencias.

---

## 7. Hashes, integridad y discrepancias

- HTML: `f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723` — **sin cambios** desde T02.
- `hashes.json`: 152 entradas, **0 discrepancias** con el manifiesto. T01 y T02 (21 archivos cada uno, 10 fuentes y 10 `exactSize` por tanda) intactos.
- Discrepancias registradas (`ART_HUB_TANDA_03_AUDIT.md` §5, `incidencias.json`):

| ID | Discrepancia | Resolución |
|---|---|---|
| D‑01 | No existen claves/slots/loader/pintor para 7 de los 8 objetivos | Detener integración, documentar BLOQUEADO |
| D‑02 | El pliego llama «oriental» a `HUB_FLOOR_PATCH_O` y «oriental alternativo» a `…_E` | Corregido **por código**: O = **OESTE** (`x 290…870`), E = **ESTE** (`x 1630…2210`) |
| D‑03 | «10 assets» frente a 8 unidades (1 sistema con 6 variantes) y 2 excluidos | 8 unidades / 13 PNG; inconsistencia registrada |
| D‑04 | T02 documentó el VIP «sin pintor»; sí lo tiene, pero en el MENÚ | Integrar donde se dibuja; nunca declarar «espacio VIP en el HUB» |
| D‑05 | Los ganchos del pintor del HUB no son globales | Solo vía `__DDM_V5_IMG`; sin sistema de render nuevo |
| D‑06 | `d.menu` se construye una vez y se cachea | `startHub3()` en el primer instante del boot |
| D‑07 | El renderer de píxeles que consume el VIP **no está activo** en el build | 0 dibujos en 5 arranques → visibilidad `NO VERIFICADO`, integración `BLOQUEADO` |

---

## 8. Incidencias

`ART_EVIDENCE/hub/tanda_03/incidencias.json`.

**Resueltas con medición, no a ciegas:**
1. Primer intento de informe falló (`preparation.expected` ausente en las 6 variantes): corregido en el generador y en el arnés; las 3 fases A/B se **repitieron por completo** (no se reconstruyó el informe sobre datos viejos).
2. Halo blanquecino en placas y banco (hasta 11 %): sustituido por despill de des‑premultiplicación + flood‑fill del reflejo exterior → ≤0,11 %.
3. Paño norte 04 salió frontal, con perspectiva dispar: regenerado en isométrico 2:1.
4. Archivo obsoleto `hub_zone_signage_e_último_trago.png`: eliminado por el propio generador (idempotencia; 13 finales exactos).
5. Rótulo «ZONA x» rozando el marco y texto sobre el borde inferior: recompuesta la cartela (numeral → filete → rótulo) dentro de la placa.

**Abiertas / documentadas:** 8 bloqueos de render, 1 visibilidad `NO VERIFICADO`, 2 × 404 Cloudflare externos preexistentes (0 locales, 0 `pageerror`), y `validation_error.json` conservado como evidencia de la incidencia 1 ya resuelta.

---

## 9. Git y PR

- Rama de trabajo: `arena/109fe45c-deadbeat-disconew`. T01 (`775926a`) y T02 (`888f338`) **conservadas íntegramente** en el mismo PR #1.
- PR #1 `OPEN`, `mergedAt=null`, head = rama de sesión, base `arte-y-recursos`; **sin merge**, `main`/`origin/main` en `d75e021` intactos.
- Commit independiente: `HUB TANDA 03 — Environment reconstruction`. Revisión previa de `git diff` y `git diff --check`, sin temporales, sin recursos anteriores alterados, HTML intacto.
- Publicación en la rama existente y actualización del PR **solo si conserva base/head**. No se declara publicado si el push falla. (Estado exacto de la entrega: §10 y `git log`/`gh pr view` al cierre.)

---

## 10. Veredicto y recomendaciones para TANDA 04

### `APROBADO`
- 8 unidades producidas (13 PNG finales + 8 fuentes), medidas, con SHA‑256 y transparencias verificadas.
- 13/13 cargados por `load()` y registrados en `window.__DDM_V5_IMG`; bloque `HUB3_*` independiente y APIs de invalidación existentes.
- QA A/B real **12/12**, regresión completa de T01/T02/V5/capas cacheadas/`CAMPAIGN_ROOM`/colisiones/puertas/estaciones/disparo/movimiento, 0 errores.
- HTML activo intacto; T01 y T02 íntegras; `main` intacta.

### `BLOQUEADO`
- **8/8 unidades sin integración de render**: 7 no tienen slot de dibujo y `HUB_VIP_BOOTH_LOUNGE` tiene un pintor cuyo renderer está inactivo (D‑07).
- No se ha modificado el HTML (no había autorización) y **no se ha inventado** un segundo motor, un canvas superpuesto, un HUB estático, cachés nuevas ni un loader paralelo.
- Fuera de alcance, sin tocar: `wall_limbo_ticket_window`, `limbo_gate_stage`, animaciones de recreativas/expendedora, efectos ambientales dinámicos, estaciones, puertas, colisiones, geometría, música, HUD, guardado y progresión.

### `NO VERIFICADO`
- Visibilidad en producción de `hub_vip_booth_lounge`: 0 `drawImage` medidos en 5 arranques con el PNG real. El pintor existe en el código (4 dibujos de 108×68 demostrados por sonda controlada), pero no se ejecuta en el build activo. **No se declara aprobado ningún resultado sin evidencia verificable.**

### Recomendaciones TANDA 04 (requieren autorización explícita)
1. **Auditoría del renderer de píxeles** (`d.menu`, `ip`, `document.fonts.ready`): determinar qué condición activa el canvas 768×500 y si puede invalidarse con una API pública existente. Es el camino más barato para desbloquear el VIP sin tocar gameplay.
2. **Autorización para un cambio mínimo del HTML**: añadir 4 `drawImage` de suelos sobre el canvas de suelo cacheado (`1920×1320` en `(290,265)`), usando `__DDM_GET_V5` y las APIs de invalidación ya existentes. Sin nuevo sistema de cachés.
3. **Segundo slot por familia de mobiliario** en `hubDecor` para que las variantes 02 puedan coexistir con T02 sin sustituirlo; requiere editar el HTML y demostrar que no cambia colisiones ni interacción.
4. **6 anclajes diegéticos de pared** para la señalética (A pista, B DJ, C descenso, D arsenal, E barra, F arcade), con `sortY` del motor y sin tocar navegación, puertas ni desbloqueo. Reutilizar las 6 placas ya producidas.
5. **No reinterpretar las 10 recomendaciones de T02 como 10 permisos**: `wall_limbo_ticket_window` y `limbo_gate_stage` siguen exigiendo auditoría específica de claves y cachés.
6. Si se autoriza el HTML, repetir **el mismo arnés A/B de 12 comprobaciones** con capturas ANTES/DESPUÉS y elevar el criterio de visibilidad a «≥1 `drawImage` medido por unidad», sin relajar ningún otro criterio.

---

**Criterio de finalización aplicado:** los objetivos están producidos **y sus bloqueos explícitamente documentados**, y la validación real se ha ejecutado. No se declara `APROBADO` la integración. Prioridad mantenida: consolidar el HUB real, preservar el motor y elevar la calidad sin alterar gameplay.
