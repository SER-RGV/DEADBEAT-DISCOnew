# FASE 0 — PLAN TÉCNICO DE EJECUCIÓN
# DEADBEAT DISCO — Reconstrucción total del arte

**Fecha:** 2026-11-15 · **Rama:** `arena/7e0496dc-deadbeat-disconew` · Complementa `00_AUDIT_REPORT.md` y `01_REPLACEMENT_MATRIX.md`.

## 1. Estado actual (resumen honesto)

- Build activo: `index.html` ≡ `DEADBEAT_DISCO.html` (generado; workflow lo reconstruye). Motor legado minificado + `__DD_BRIDGE` + módulos `src/`. Canvas 2D.
- Integración gráfica vigente: **registry** (`src/dd_asset_registry.js`, 269/345) → **DD_WORLD** (render de habitaciones/props/puertas/entidades) y **DD_HUB** (Refugio jugable). `ART_PACK/art_pack.js` es del build congelado `.ART.html` y **no se usa**.
- Cobertura actual: suelos 12/12 registrados, muros 10/10, props 30, enemigos 24, jefes 42 (11 jefes), armas 16, efectos 22, HUD/menús RESTART aceptados por el autor, intro cómic v2 aprobada, IDLE del protagonista **pendiente de aprobación** (WALK/SHOOT sin producir).
- El HUB del build activo (Refugio) **no** refleja la lámina panorámica: faltan portales×9, escaleras/balcones, tienda, sala de máquinas, bar infernal, torre DJ, secretos.
- Ningún asset del proyecto está aún reconstruido *contra estas 12 láminas nuevas* (noviembre trabajó con REF_01..04 y tandas propias).

## 2. Problemas detectados (priorizados)

| ID | Problema | Impacto |
|---|---|---|
| P1 | Build divergente: hub reconstruido solo vive en `.ART.html` legado | El HUB «reconstruido» no existe para el jugador real |
| P2 | Rooms de campaña son genéricos AI 2026-11 + caché procedural, sin identidad de lámina por círculo más allá de piso/muro base | «No se parece a las referencias» en partida |
| P3 | HUB activo sin 9 accesos ni salas funcionales visibles | Objetivo nº1 del brief sin cubrir |
| P4 | Sin contrato técnico de asset verificado en estas láminas (paleta/pivote/tile) | Riesgo de drift visual entre tandas |
| P5 | Doble numeración círculos (láminas vs motor) mal entendida en el pasado | Errores de prompt/intención |
| P6 | QA sin navegador en este sandbox; arneses existen pero no ejecutables aquí | No se puede emitir «APROBADO» real todavía |
| P7 | PRs #22/#30 (escala de mundo) abiertas; posible choque de cámara/escala | Recapturar y re-anclar tras su merge |
| P8 | Pipeline ordena «≤10 assets por tanda» — debe respetarse o acordarse excepción | Riesgo de validación imposible |

## 3. Orden de ejecución (fases verificables)

> Regla dura: ninguna fase declara «hecho» sin verificación ejecutada; ninguna sustitución se borra hasta FASE 7. Commits pequeños por tanda (`art(hub): …`, `art(lujuria): …`…), push a la rama de sesión al cierre de cada tanda.

### FASE 0 — Auditoría ✅ (este documento + matriz)
**Entregable:** informe + matriz. Hecho.

### FASE 1 — Sistema visual (contrato técnico)
**Entregable:** `03_ASSET_CONTRACT.md` (escala, resolución, tile 512, pivotes bottom-center/center, paleta por círculo con hex de las láminas, materiales, luz NW + rim magenta/cian, bloom solo emisor, sin sombras horneadas, sin texto), esquema de manifiesto y checklist de validación (tamaño exacto, alpha, esquinas transparentes, halo ≤ 0,2 %, SHA-256), convención de carpetas dentro de la real (`assets/…`, sin carpetas redundantes). Pipeline: `generate_image` → postproceso (Python/PIL: recorte, despill, RGBA, tile seamless) → `assets/<familia>/…png` → `tools/asset_pipeline.py --rebuild-registry` → bump `?v=` → `node --check` del registry → build activo.

### FASE 2 — HUB
**Entregable:** HUB del build activo reconstruido a la lámina panorámica **sin romper estaciones/navegación/colisiones**:
1. Auditoría profunda de `src/dd_hub_system.js` (geometría, estaciones, hitboxes, NPCs, pad) → lista de anclajes.
2. Kit `hub_*` (para FASE 1 contract aprobado): pista central, 9 portales con marco de círculo, torre DJ, altavoces, balcones/escaleras, bar infernal, sala de máquinas, archivos, galería, tienda (refuerzo visual de `prop_*` existentes), pasadizo secreto.
3. Re-registro y wiring `DD_HUB`/`DD_WORLD`; A/B por flag reversible (`window.__DD_HUB_REBUILD`) siguiendo el patrón de tandas anteriores.
4. Validación: build + `node --check` + hashes + (si hay navegador) `tools/qa/test_restart_flow.js` + capturas ANTES/DESPUÉS. Sin navegador: documentar y dejar pendiente de captura real.

### FASE 3 — Círculos I, II, III (Lujuria, Gula, Avaricia)
Kit por círculo (clase B/C): floor rebuild, wall set (2 variantes), 2 props firma, 1 light haze, door variant; integración en `CIRCLE_CONFIG`; validación pipeline 3 veces para pulir el contrato. Validar que la sala de jefe (boss room) usa `boss_0X` (ya registrados) sin tocar lógica.

### FASE 4 — Círculos IV, V, VI (Ira, Herejía, Violencia)
Ídem.

### FASE 5 — Círculos VII, VIII, IX (Fraude, Traición, Núcleo)
Ídem + Núcleo final (boss `boss_09_nucleofinal`, `cine:nucleo`) y respeto estricto del registro canónico (00 §5).

### FASE 6 — Compartidos
Completar mobiliario/decoración/iluminación/VFX/enemies/bosses pendientes; props firma restantes; `light_haze_*`; variantes élite de la guía §02 si el motor las expone sin cambios de stats.

### FASE 7 — Sustitución definitiva
Retirar del registry los bitmaps con clase D verificada; regenerar atlas/manifests; bump `?v=`; grep de huérfanos; build activo; inventario final.

### FASE 8 — QA visual y técnico
Arranque sin errores, carga de recursos, ausencia de 404, escala/perspectiva/anclas/profundidad/oclusión del jugador, colisiones y hitboxes intactas, animaciones, puertas/transiciones, rendimiento (mediana frame), paridad de las 9 identidades, HUB funcional.
**Capturas obligatorias:** HUB; 1 sala por círculo; 1 arena de jefe; 1 sala con interactivos; 1 zona con iluminación/efectos; 1 escena jugador+enemigos.
**Dependencia:** navegador. En este sandbox no existe (verificado). Se documentará como pendiente; no se emitirán PASS ficticios.

## 4. Tamaños y formatos (resumen del contrato)

PNG RGBA salvo suelos (opaque tileable 512²) y cinemáticas (JPEG/WebP opaco). Props ≤ 1024²; muros 256×384; floors 512²; iconografía HUD vectorial/PNG nítido. Sin filtros de baja resolución; sin `image-rendering: pixelated` en código nuevo.

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| P22/#30 aterrizan y cambian cámara | No tocar `dd_cinematic_camera.js`; re-anclar props tras merge; A/B repetible |
| Assets AI con halos/fondos | Postproceso con despill + flood-fill (herramientas existentes `ART_TOOLS/prepare_*.py` como referencia de método, no de rutas) |
| 20 salas por lámina ≠ engine procgen | Componibles (suelo+muro+props+luz), no pantallas pegadas |
| Alcance > capacidad de una sesión | Entregas por tandas verificables; nada se declara terminado sin prueba |
| Pérdida de trabajo previo | `.ART.html`, ART_ASSETS, evidencias: **no se tocan**; backups intactos; clase D vacía hasta FASE 7 |
| «Ya funciona en mi máquina» | Build reproducible + hashes + arnés headless cuando exista navegador |

## 6. Pruebas necesarias (y quién puede ejecutarlas)

| Prueba | Herramienta | Estado en este sandbox |
|---|---|---|
| Build activo correcto | `python3 tools/build_active_html.py` | ✅ ejecutable |
| JS válido | `node --check` | ✅ ejecutable |
| Manifiesto/dimensiones/alpha/hashes | Python + PIL | ✅ ejecutable |
| Arranque sin errores / carga sin 404 / capturas | `tools/qa/*.js` + Chromium/playwright-core | ❌ sin navegador aquí; pendiente de sesión con navegador |
| Colisiones/hitboxes | `tools/qa/test_restart_flow.js` u homólogos | ❌ igual |
| Rendimiento | `performance.json` vía arnés | ❌ igual |

## 7. Definición de «terminado» (recordatorio del brief, aterrizada)

1. Láminas representadas (fidelidad razonada, no calco). 2. Assets individuales y reutilizables. 3. HUB reconstruido y funcional con sus estaciones reales. 4. Nueve pistas reconstruidas en la medida del alcance aprobado (fases 3–5). 5. Escenarios usan los gráficos nuevos en el build activo. 6. Provisionales sustituidos y verificados. 7. Jugador integrado sin tocar hitboxes. 8. Mecánicas/progresión intactas (diff de tests). 9. Manifests/atalas regenerados. 10. Juego ejecuta sin errores de recursos. 11. Capturas reales archivadas en `ART_EVIDENCE/`. 12. Documentación de continuación en `docs/TOTAL_ART_REBUILD/`.

## 8. Lo que NO se hará (restricciones absolutas confirmadas)

Ni reescritura del motor, ni cambios de mecánicas/stats/progresión/hitboxes/colisiones, ni escenas por imágenes planas, ni gráficos genéricos ignorantes de las láminas, ni dependencias nuevas sin justificación, ni duplicar registries, ni borrar sin dependencias, ni PASS declarados sin ejecución, ni merges a `main` desde esta rama.
