# REGISTRO DE PRODUCCIÓN ARTÍSTICA — DEADBEAT DISCO

> Una entrada por tanda. Los resultados de QA con su clasificación están en `VISUAL_QA_REPORT.md`.
> Convención: `VERIFICADA` / `PARCIALMENTE VERIFICADA` / `NO VERIFICADA` / `FALLIDA` / `BLOQUEADA`.

---

## TANDA 01 — Suelos, identidad de club y primeras familias

**Objetivo:** validar el pipeline completo (referencias → generación → preparación técnica → integración en loaders reales → juego ejecutado → capturas) con un lote pequeño y de alto impacto, sin tocar mecánicas.

**Referencias usadas:** `ART_REFERENCES/REF_01_identidad_banner.png` (logotipo brush, máscara zorro/lobo coronada, protagonista sentado, tagline, luz cian/magenta), `REF_02_circulos_jefes_escenarios.png` (9 bandas de paleta, 9 jefes de silueta diferenciada, 4 ejemplos in-game isométricos), `REF_03_biblioteca_assets_ui.png` (10 materiales de suelo, muros modulares góticos, props, catálogo de armas, pickups, efectos, HUD, menús, HUB isométrico). Analizadas antes de generar. Muestras de color en `ART_AUDIT/reference_palette.json` y `reference_accents.json`.

**Lenguaje extraído:** pintura/cómic de tinta con contorno negro, magenta/oro/cian/rojo sobre negro, bloom controlado, luz volumétrica, negativo oscuro, siluetas limpias, ornamento art-déco/gótico, alto detalle con jerarquía de lectura, **sin pixel art**. Jerarquía de contradicciones aplicada según `ART_BIBLE.md` §1.

**Especificaciones comunes:** isométrica 2:1, luz NW, rim magenta/cian, contorno de tinta cerrado, sin sombras horneadas, sin fondos de croma en el archivo final, sin dithering/ruido/pixelado. Dimensiones **idénticas** a las del recurso sustituido. Pivotes documentados por asset.

### Assets producidos (8)

| ID | Archivo | Dimensiones | Formato | Alpha | Pivote | Loader | Objetivo |
|---|---|---|---|---|---|---|---|
| `t3b_material_00` | `floor_00_obsidian_vein.png` | 512×512 | PNG RGB | no | tile | `__T3B.reload(0)` | Mármol negro veteado magenta/oro para campaña |
| `t3b_material_01` | `floor_01_neon_dancefloor.png` | 512×512 | PNG RGB | no | tile | `__T3B.reload(1)` | Pista con chevrones neón magenta/cian para HUB |
| `t3b_material_02` | `floor_02_gilded_mosaic.png` | 512×512 | PNG RGB | no | tile | `__T3B.reload(2)` | Mosaico dorado art-déco |
| `hub_fox_crest_emblem` | `hub_fox_crest_emblem.png` | 560×332 | PNG RGBA | sí (127.328 px) | center | `__DDM_V5_IMG` | Emblema zorro coronado, ancla de identidad |
| `decor_neon_rug` | `decor_neon_rug.png` | 456×243 | PNG RGBA | sí (53.528 px) | bottom-center | `__DDM_V5_IMG` | Alfombra isométrica neón/oro |
| `decor_potted_palm` | `decor_potted_palm.png` | 209×147 | PNG RGBA | sí (19.224 px) | bottom-center | `__DDM_V5_IMG` | Palmera en macetero cromado |
| `boss_01_anden` | `boss_01_anden.png` | 400×386 | PNG RGBA | sí (119.329 px) | bottom-center | `DMO_ILT.images/ready/meta` | Residente alto, abrigo negro con piping oro, halo magenta |
| `weapons/weapon_m1911.png` | `weapon_m1911.png` | 160×87 | PNG RGBA | sí (8.699 px) | center | `__HD_DATA` + `__HD_EXTRA` | Arma inicial, acero negro con oro y magenta |

Manifiesto con SHA-256, bytes, origen y alpha por asset: `ART_ASSETS/tanda_01/manifest.json`. Fuentes originales conservadas en `ART_ASSETS/tanda_01/_source/`. Script de preparación reproducible: `ART_TOOLS/prepare_tanda_01.py`.

**Comprobaciones de archivo (ejecutadas):** 8/8 PNG decodifican, dimensiones exactas, canal alfa real en los 5 recortes, 0 px transparentes en los 3 tiles opacos, sin recortes de silueta ni halos (revisión visual sobre fondo magenta de contraste). → **VERIFICADA**.

### Integración

`ART_PACK/art_pack.js` sustituye entradas de los 4 registros existentes; `DEADBEAT_DISCO.ART.html` lo carga con un único `<script>`. Sin gestores nuevos, sin dependencias nuevas, sin cambios de lógica. Detalle y justificación del flag `__T3B.enabled` en `ASSET_INTEGRATION_GUIDE.md`.

**Resultado de integración:** `DMO_ART_PACK.integrity()` → 8/8 `applied=true`, `live=true`, `exactSize=true` en tres ejecuciones (orden normal e invertido). `__T3B.draws` registró `choice:'candidate'` con el `src` de los assets nuevos en las rutas `hub` y `campaign`. → **VERIFICADA**.

### Pruebas ejecutadas

| Prueba | Herramienta | Resultado | Clasificación |
|---|---|---|---|
| Carga HTTP de build y paquete | `curl` | 200 / 13.381.028 B y 200 / 9.213 B | VERIFICADA |
| Integridad de 8 assets en registros vivos | `DMO_ART_PACK.integrity()` | 8/8 en 3 ejecuciones | VERIFICADA |
| Render real de materiales | `__T3B.draws` + capturas | `choice:'candidate'`, suelos visibles en HUB y `r0` | VERIFICADA |
| Capturas antes/después del juego real | CDP `shot()` | 6 PNG 1280×900 + 4 `roomCapture`; diff HUB 43,0 %, campaña 70,0 % | VERIFICADA |
| Regresión movimiento | `DMO.debug.state().px` | +402 (original) / +398 (con arte) | VERIFICADA |
| Regresión disparo | `shotsFired` + `wa` instrumentado | +3 disparos y 3 proyectiles en `wa` en ambas builds | VERIFICADA |
| Errores JS | `pageerror` / consola | 0 `pageerror`; 2 console errors 404 de Cloudflare (esperados, intactos) | VERIFICADA |
| Transición HUB → campaña `r0` | `DMO_HUB.state()` | completada con `lock:false`, `tc≥1`, control recuperado en ambas builds | VERIFICADA |
| Rendimiento | `tick(0.016,30)`, rAF | ver `VISUAL_QA_REPORT.md` §4 | VERIFICADA / PARCIALMENTE VERIFICADA |
| Pruebas manuales con GUI | — | entorno sin `DISPLAY`; no ejecutadas | **NO VERIFICADA** |
| Mando físico / gamepad | — | sin dispositivo | **NO VERIFICADA** |
| Resoluciones adicionales de HUD | — | solo 1280×900 | **NO VERIFICADA** |

Evidencias: `ART_EVIDENCE/tanda_01/`. Logs: `validation_run1.json`, `validation_run2_roomcapture.json`, `validation.json` (validación limpia), `validation_reverse.json`, `perf_probe.json`, `transition_probe.json`, `roomcapture_probe.json`.

### Problemas / decisiones

1. **Pintor de materiales desactivado.** `window.__T3B.enabled=false` en la build original (*cache probe*). Sustituir `__T3B_IMAGES[i]` sin más no produce cambio visible. Resuelto con `setEnabled(true)`, flag exclusivamente visual. Documentado.
2. **Coste de diagnóstico.** `__T3B.roomCapture()` (`toDataURL` sobre canvas grande) tarda ~47,5 s con texturas detalladas en SwiftShader y distorsionaba los tiempos de transición (20–55 s). Aislado con `ART_TOOLS/qa/roomcapture_probe.js`: sin esa llamada la campaña completa en ~2,3–3,2 s. La validación limpia la excluye; no es una regresión del juego.
3. **Orden de sesión.** La diferencia de tiempo de carga (14–31 s) correlaciona con que la build se cargue en segundo lugar en el mismo navegador, no con el paquete de arte (comprobado invirtiendo el orden).
4. **Alfa sobre fondos negros.** Umbral de inundación por asset: 10 por defecto conserva los negros interiores (traje, acero, pelo); 45 para el emblema elimina su halo de glow. Las bolsas negras cerradas grandes (interior del halo del jefe) se eliminan por componente conexo ≥1500 px. Sin halos blancos.
5. **Emblema:** persiste un halo granate muy fino alrededor del neón; sobre el fondo oscuro del HUB no se aprecia. Registrado como **PARCIALMENTE VERIFICADO** (calidad de recorte), sin impacto funcional.

### Pendiente para tandas futuras

Direcciones/animaciones del protagonista no auditadas fotograma a fotograma · 7 materiales T3B restantes · arquitectura modular (prioridad 3) · 10 sprites ILT restantes · 162 armas HD · HUD/menús/transiciones · verificación GUI y en varias resoluciones · reconciliación 4/10 vs 5/10 de Fase 0.3.1 (ver `VISUAL_QA_REPORT.md` §7; no se alteran los estados de INC‑001/INC‑002).

---

## TANDA 02 — Arquitectura modular de la discoteca

**Objetivo:** primera familia modular completa (máximo 10 piezas) generada, preparada e integrada en el sistema real de construcción de habitaciones, visible en partida y sin romper mecánicas.

**Inspección previa:** HTML ejecutable real, `ART_PACK/art_pack.js`, `ART_ASSETS/tanda_01/manifest.json`, `ART_AUDIT/asset_inventory.json` (100 slots V5, 18 de arquitectura), pintor de muros `$b`/`_b` (`panelCount = round(edge.len/230)`), pintor de puertas `Bg` (`df/dl/sf/sl/sg/dg`, `Ot.openT`), `sortY`, `Ps`/`Rs`, colisiones y límites. Las dimensiones de los slots se midieron antes de generar: **no se forzó 512×512**.

**Generación:** 10 ilustraciones HD individuales en `ART_ASSETS/tanda_02/_source/`; 10 PNG finales con las dimensiones exactas de 10 slots V5 reales, alfa real, pivote documentado y recorte reproducible (`ART_TOOLS/prepare_tanda_02.py`). El fondo se detecta por mediana de esquinas: 9 negros y `threshold_entry.png` blanco. Sin lámina, spritesheet, halos ni sombras horneadas.

**Integración:** se **amplió el loader existente** en `ART_PACK/art_pack.js` (`ARCHITECTURE`, `applyArch()`, `restoreArch()`, `architecture()`), usando la misma `load()` y el mismo `window.__DDM_V5_IMG` → `__DDM_GET_V5`. Se conservan las 10 imágenes previas en `ORIGINALS`, se registran alias trazables y se mantiene Tanda 01 intacta (8/8). **El HTML activo no se modificó**: `DEADBEAT_DISCO.ART.html` conserva `f231cfc7…723`. Sin segundo `<script>`, sin gestor de carga nuevo, sin canvas superpuesto. Es el motor quien dibuja cada módulo con sus `transform`, `sortY` y profundidad.

**Adaptaciones documentadas:** el motor no tiene sprite de «puerta abierta» (anima la misma hoja con `Ot.openT`) → A07 adaptada a hoja lateral; no ensambla esquinas como piezas geométricas (muros por `edge` con paneles) → A02/A03/A04 son acabados de panel, no sustitutos de pared/colisión; `campaign_door_leaf` es una sola hoja duplicada y espejada → A06 recorta la media puerta; A09 usa `contain` para conservar el diamante 2:1.

| Comprobación | Método | Resultado | Clasificación |
|---|---|---|---|
| 10 PNG: existencia, decodificación, dimensiones, alfa, fuentes | Pillow / `logs/file_checks.json` | 10/10 en los 4 apartados | VERIFICADA |
| Carga sin recursos faltantes | Playwright `requests` / `response` | 10 peticiones, 0 errores HTTP de arte | VERIFICADA |
| Referencias válidas en vivo | `DMO_ART_PACK.architecture()` | 10/10 `live`, `loaderResolves`, `aliasRegistered`, `originalPreserved`, `errors:[]` | VERIFICADA |
| Recursos anteriores | `integrity()` / V5 / ILT | T01 8/8, V5 100/100, ILT 11/11, 10 originales preservados | VERIFICADA |
| A/B en la MISMA build | `restore()` / `apply()` | 10 → 0 → 10; 12.437 px (1,08 %) de cambio aislado | VERIFICADA |
| Salas reales | `DMO.debug.setNight(24/35/90)` | `r0 → r23 → r34 → r89`; `floor 1→3→4→9`; 10/10/29 enemigos | VERIFICADA |
| NÚCLEO / A05 | `setNight(100)` | `ok:false`, sin cambio de sala | **NO VERIFICADA** |
| Puerta cerrada / abierta | `r23` sin despejar / `clearRound()` | 11 enemigos `secured:0` → 0 enemigos `secured:1` | VERIFICADA en `r23`; NO VERIFICADA en `r0` (`start` ya abierta) |
| Umbral sin falso obstáculo | captura + bbox A/B `(461,770)-(641,831)` | diamante 2:1 enrasado, jugador visible | VERIFICADA |
| Movimiento | `DMO.debug.state().px` | +205 (original) / +252 (activa) / +320 (`r23`) | VERIFICADA |
| Disparo + proyectiles `wa` | ticks forzados, ON/OFF/ON | +4 disparos y +4 `wa` en las 3 condiciones y por las 2 vías de entrada | VERIFICADA |
| Errores JS nuevos | `pageerror` / consola | 0 `pageerror` en ambas; 2×404 Cloudflare en ambas | VERIFICADA |
| Rendimiento hardware real | `tick30Ms`, rAF | 2,6 → 2,9 ms; `framesIn2s 6 → 0` bajo SwiftShader | **NO VERIFICADA** |
| GUI / mando | — | entorno sin `DISPLAY` | **NO VERIFICADA** |

Evidencias: `ART_EVIDENCE/tanda_02/{before,after,modular_connections,doors,gameplay,logs}/` (35 archivos). Logs: `validation.json`, `extra.json`, `doors.json`, `file_checks.json`, `visual_diff.json`.

### Problemas / decisiones de la Tanda 02

1. **HTML intacto.** Al ampliar el pack ya cargado no hubo que insertar un segundo `<script>`: se evitó cualquier riesgo sobre la build protegida y su hash.
2. **`shotDelta = 0` en la corrida principal.** Aislado con `validate_tanda_02_extra.js`: con ticks forzados, el disparo da +4/+4 con T02 ON, OFF y ON de nuevo. Causa: inanición de `requestAnimationFrame` bajo SwiftShader (`framesIn2s = 0`), **no** regresión del lote.
3. **`r0` no sirve para puerta cerrada.** Es sala `start` sin encuentro y `vg()` entrega `Ot.openT = .8`. Se usó `r23` de combate para la verificación real.
4. **DEF-001 (mezcla estilística).** `campaign_door_side_frame` se conservó sin sustituir para no exceder 10 assets ni deformar un marco horizontal en un slot vertical 72×176. Registrado con `doors/closed_closeup.png`, sin corrección improvisada.
5. **DEF-002.** A07 muestra el hueco cian en `t=0` y oscuro en `t=1`: es la animación de la hoja, no un cambio de sprite. Lógica de apertura intacta.
6. **Recortes de evidencia reencuadrados.** La cámara cambia entre salas; las regiones se localizaron por diferencia de píxeles A/B, no por coordenadas inventadas.
7. **Continuidad.** Cornisa en fila 0 y zócalo en la última fila en A01–A04; A02/A03/A04 con bordes equivalentes. A01 es isométrico con cara lateral: la métrica de columnas de borde no aplica, se evaluó visualmente.

### Pendiente para tandas futuras

Visibilidad aislada de A04/A06/A08/A10 y de A05 en el NÚCLEO · corrección de DEF-001 si se autoriza un asset adicional · 7 materiales T3B restantes · 10 sprites ILT restantes · 162 armas HD · HUD/menús/transiciones · verificación GUI, mando y varias resoluciones · rendimiento en hardware real.


---

## HUB · TANDA 01 — Reconstrucción de escenarios (2026-11-03)

**Objetivo:** diez assets reales con una sola familia visual, integrados en el HUB de la build activa y verificados en juego ejecutado.

**Auditoría previa:** `DEADBEAT_DISCO.ART.html` (Tanda 03 `faseD.2` presente), `ART_PACK/art_pack.js`, `ART_AUDIT/asset_inventory.json`, `ART_BIBLE.md`, `ASSET_INVENTORY.md`, informes de Tandas 01/02/03 y medición en runtime de los `drawImage` del HUB. Dimensiones tomadas del inventario y de la sonda, no inventadas.

**Generación:** 10 fuentes en `ART_ASSETS/hub/tanda_01/_source/` (HUB-01 1024×1024 con fondo oscuro; HUB-02 1376×768; HUB-03…10 1408×768 con fondo blanco). Pipeline `ART_TOOLS/prepare_hub_tanda_01.py`: `contain` + pivote sin deformar, extracción por esquinas, descontaminación, compatibilidad con el filtro del medallón y corrección de costura para el tile. 10/10 dimensiones exactas, 9/9 RGBA con alfa y bordes limpios, halo residual ≤4,48 %.

**Integración:** `ART_PACK/art_pack.js`, reutilizando `__T3B_IMAGES[1]` (HUB-01), el manifiesto de Tanda 02 (HUB-03) y `__DDM_V5_IMG` para los otros ocho. `restoreHub()` permite A/B sin recargar. Sin canvas nuevo, sin HUB estático, sin cambios de motor.

**QA:** `ART_TOOLS/qa/validate_hub_tanda_01.js`, Chromium 131 + Playwright 1.58.2, 12 comprobaciones ejecutadas → **12/12 APROBADO**. Capturas ANTES/CONTROL/DESPUÉS, por zona, puertas y campaña; `report.json`, `visual_diff.json` (60,17 % de píxeles cambiados control↔después), `hashes.json`.

**Clasificación de esta tanda:** **VERIFICADA** en lo técnico y visual; entrega Git **APROBADA** por autorización del usuario (commit/push en la rama de sesión + PR hacia `arte-y-recursos`, sin merge). Ver `ART_TANDA_01_HUB_REPORT.md`, sección 9.

---

## HUB · TANDA 02 — Expansión visual y arquitectónica (2026-11-03)

**Objetivo:** completar la segunda capa de objetos del HUB sin repetir la TANDA 01, partiendo de una auditoría visual real y sin tocar sistemas.

**Auditoría previa:** `ART_TOOLS/qa/hub_tanda_02_audit.js` sobre Chromium 131 + Playwright, 10 zonas del HUB real, 21 slots dibujados por fotograma, 118 claves V5, 6 zonas y 11 estaciones. Inventario de necesidades con 6 clases (más `INTERACTIVO` superimpuesta) en `ART_AUDIT/hub_tanda_02_needs_inventory.json` y `ART_HUB_TANDA_02_AUDIT.md`. Se descartaron los slots con 0 dibujos y los paños de suelo sin función.

**Lenguaje:** continuidad estricta con T01 — art-déco nocturna, latón/terciopelo/cristal/esmalte, negro profundo, rosa eléctrico, cian, violeta y amarillo ácido, perspectiva isométrica, ilustración estilizada, sin pixel art ni assets genéricos.

**Assets producidos (10)**

| ID | Archivo | Dimensiones | Slot V5 | Rol | Clase |
|---|---|---|---|---|---|
| T02-01 | `hub_t02_01_arcade.png` | 264×239 | `hub_arcade_shrine` | Recreativas F1 | 2 + 5 |
| T02-02 | `hub_t02_02_arsenal.png` | 360×253 | `hub_arsenal_shrine` | Arsenal D | 2 + 5 |
| T02-03 | `hub_t02_03_seals.png` | 244×237 | `hub_seals_shrine` | Espejo de Sellos F2 | 2 + 5 |
| T02-04 | `hub_t02_04_vending.png` | 100×152 | `club_vending_machine_prop` | Expendedora este | 2 |
| T02-05 | `hub_t02_05_cooler.png` | 61×136 | `club_water_cooler_prop` | Dispensador oeste | 2 |
| T02-06 | `hub_t02_06_bench.png` | 256×198 | `limbo_bench_prop` | Bancos del descenso | 2 |
| T02-07 | `hub_t02_07_planter.png` | 96×108 | `club_neon_planter_prop` | 4 jardineras | 2 |
| T02-08 | `hub_t02_08_liftpad.png` | 198×104 | `descent_abyssal_lift_pad` | Plataforma de descenso | 2 + 5 |
| T02-09 | `hub_t02_09_ceiling_fixture.png` | 148×38 | `wall_ceiling_neon_fixture` | Neón de techo (caché) | 2 |
| T02-10 | `hub_t02_10_sconce.png` | 48×60 | `club_wall_sconce_side` | Aplique de pared (caché) | 2 |

Fuentes originales conservadas en `_source/`. T02-04 se aisló con `sourceCrop=[510,0,925,768]` sin alterar la fuente. Preparación `contain` sin deformación: 10/10 tamaño exacto, alfa, esquinas transparentes, bordes limpios y halo ≤ 0,18 %. `manifest.json` registra función, ubicación, caja medida, anclaje, pivote y SHA-256.

**Integración:** `ART_PACK/art_pack.js`, mismo registro `__DDM_V5_IMG` y mismo `load()`. `applyHub2()` / `restoreHub2()` independientes de T01, `hub2Invalidate()` para las capas cacheadas, `run()` encadena T01 → arquitectura → HUB-T01 → HUB-T02. Sin segundo motor, sin canvas nuevo, sin cambios de geometría, colisiones, puertas, estaciones, música, HUD ni guardado. Sin interacciones nuevas.

**Clasificación de esta tanda:** **VERIFICADA**. QA A/B en 3 fases, 12/12 `APROBADO` (`ART_EVIDENCE/hub/tanda_02/report.json`), 10/10 visibles, T01 10/10 intacta, regresión en sala `r23`/`CAMPAIGN_ROOM`, `visual_diff.json`, `comparativa_antes_despues.jpg`, `hashes.json`. Informe: `ART_TANDA_02_HUB_REPORT.md`.

---

## HUB · TANDA 03 — Environment reconstruction (2026-11-03)

**Clasificación: BLOQUEADA (integración de render) · VERIFICADA (producción, carga y QA A/B).**

- Dirección artística: art déco nocturno, elegancia decadente y discoteca grotesca; magenta/violeta/cian/negro/oro, contrastes fuertes, profundidad de materiales, ornamentación controlada, iluminación coherente. Sin pixel art, sin texturas genéricas, sin ruido excesivo, sin bordes verdes, sin halos artificiales ni efecto pegatina.
- 8 unidades / 13 PNG finales / 8 fuentes: 4 suelos (O abanico radial, E chevrones, S fisuras que continúan la grieta, N onda/ecualizador del DJ), 2 variantes de mobiliario (urna acanalada, banco con respaldo en abanico), 1 alcoba VIP y 1 sistema de 6 señales diegéticas (A pista, B DJ, C descenso, D arsenal, E barra, F arcade).
- Preparación reproducible con `build_alpha()`/`crop_alpha()` heredados y despill de des-premultiplicación nuevo. 13/13 tamaño exacto y RGBA, halo ≤ 0,11 %, `contain` sin deformar. Hash de cada fuente y cada final en `manifest.json` y `hashes.json`.
- Integración **solo de registro**: bloque `HUB3_*` en `ART_PACK/art_pack.js`, mismo `__DDM_V5_IMG`, mismo `load()`, mismas APIs de invalidación, dos capas cacheadas conservadas. HTML intacto.
- **Bloqueo documentado, no disfrazado**: 7 objetivos no tienen slot de dibujo y el octavo tiene un pintor en el código del MENÚ cuyo renderer no se ejecuta en el build (0 `drawImage` en 5 arranques). No se crea un sistema de render nuevo. Visibilidad en producción: `NO VERIFICADO`.
- QA A/B real 12/12, 74 evidencias, 152 hashes sin discrepancias. Regresión T01/T02/V5/`CAMPAIGN_ROOM` completa. Diferencias de píxel 1–4 % atribuibles a ruido de frame, presentes también A↔C; no se interpretan como cambio artístico.
- Informes: `ART_TANDA_03_HUB_REPORT.md`, `ART_HUB_TANDA_03_AUDIT.md`. Evidencias: `ART_EVIDENCE/hub/tanda_03/`.

---

## HUB · TANDA 04 — Render integration (2026-11-03)

**Clasificación: APROBADA · 13/13 unidades INTEGRADAS · 0 bloqueadas · QA A/B 12/12.**

- **Objetivo:** TANDA 04 NO produce assets nuevos; activa visualmente los 13 PNG finales de TANDA 03 en el HUB real. `registro != integracion`, `carga != visibilidad`, `visibilidad en menu != visibilidad en HUB`.
- **FASE 1 (auditoría):** `ART_HUB_TANDA_04_AUDIT.md` + `audit_runtime.json`. Causa medida del bloqueo de T03: `#overlay.hidden` envía el bucle a `Qf()` y la portada visible es `ddc-cover-js`; el pintor VIP del MENÚ dibuja en `#menu-canvas54`, no en el HUB, y **no es reutilizable**.
- **FASE 2 (matriz):** 13 filas, 4 suelos disjuntos, 6 anclajes de señalética derivados del `signY` real, 3 props `solid:false`. `matriz_integracion.json` pasa de `PENDIENTE` a **`INTEGRADO`** solo tras la QA.
- **FASE 3 (cambio mínimo):** **solo `DEADBEAT_DISCO.ART.html`**, `+59/-2` líneas, `+3.281 B`, SHA `f231cfc7...` -> `f3f5e15d...`. Tres bloques entre marcadores `TANDA04:BEGIN/END`: 3 entradas en `hubDecor` (T03-05/06/07 a `addHubCustomProp`/`Lc`), 4 `drawImage` en `drawHubFloorLayer()`/`Wf` y 6 en `drawHubAerialLayer()`/`Ph`. Flag reversible `window.__DDM_HUB_T04 !== false`. **`ART_PACK/art_pack.js` byte a byte idéntico**: se mantienen `__DDM_V5_IMG`, `load()`, `HUB3_*`, `HUB2_*` y todas las APIs de invalidación. Sin segundo motor, caché nueva, canvas alternativo ni loader paralelo. Sin cambios de gameplay, colisiones, geometría, puertas, estaciones, música, HUD, guardado, progresión ni IA.
- **FASE 4/5 (QA):** arnés `validate_hub_tanda_04.js`, 3 fases A/B a 1280x900 con la misma cámara y 10 zonas. **13/13 `drawImage` medidos en el canvas de mundo `1280x900`**, 0 en el MENÚ; ANTES `0`, CONTROL off `0`, CONTROL on `13`, `hub3Restore()` `0`, `hub3Apply()` `13`. 0 `pageerror`, 0 404 locales, T01 10/10, T02 10/10, 6 zonas, 11 estaciones, `CAMPAIGN_ROOM`, colisiones/puertas/disparo intactos, cachés de ambas capas activas, 27 canvas en las 3 fases.
- **Performance gate (pendiente de T02, medido aquí):** 40 rAF por fase, mediana `16,7 / 16,8 / 16,7 ms` (ratio `0,994`); coste de CARGA de los 13 PNG medido por separado de `load()`. Variaciones de frame atribuidas a SwiftShader con línea base `4,83 %` frente a `11,52 %` en la comparativa off/on en caliente. T02 sigue con **cierre pendiente de performance gate** según indicación del usuario.
- **FASE 6:** `ART_EVIDENCE/hub/tanda_04/`, 83 archivos / ~90 MB, 10 pares ANTES/DESPUÉS, 10 capturas del HUB real, `report.json`, `draw_calls.json`, `resultados_ab.json`, `visual_diff.json`, `verificacion_carga.json`, `comprobacion_caches.json`, `incidencias.json`, `version_probe.json` y `hashes.json` (114 / 0 discrepancias). T01/T02/T03 y el histórico `tanda_03/report.json` intactos.
- **FASE 7:** commit independiente `HUB TANDA 04 — Render integration` en la rama de sesión, push y PR #1 actualizado **sin merge**. `main`/`origin/main` intactos.
- **Informe:** `ART_TANDA_04_HUB_REPORT.md`. Auditoría/matriz: `ART_HUB_TANDA_04_AUDIT.md`, `ART_HUB_TANDA_04_MATRIX.md`.

---

## Historial de versiones

| Fecha | Entrada |
|---|---|
| 2026-11-03 | Tanda 01: auditoría de 300 recursos, 8 assets generados e integrados, validación y cierre documental |
| 2026-11-03 | Tanda 02: 10 módulos de arquitectura integrados en el loader V5 real, HTML intacto, QA en 4 salas reales y cierre documental |
| 2026-11-03 | HUB · Tanda 01: 10 assets, 10 fuentes, integración real en loaders existentes, QA 12/12 y cierre documental |
| 2026-11-03 | HUB · Tanda 02: auditoría de 21 slots, 10 assets nuevos, integración V5, QA A/B 12/12 y cierre documental |
| 2026-11-03 | HUB · Tanda 03: 8 unidades / 13 PNG, bloque HUB3_*, QA A/B 12/12, 8 bloqueos de render documentados y HTML intacto |
| 2026-11-03 | HUB · Tanda 04: render integration, 13/13 PNG dibujados en el HUB real, 3 bloques en el HTML, art_pack.js intacto, QA A/B 12/12 |

<!-- TANDA05:PRODUCTION -->
### TANDA 05 — Equipamiento, vida ambiental e interactividad

- Producción: **10 fuentes** 1408×768 en `_source/` y **10 finales** RGBA (tamaño exacto, esquinas transparentes, halo exterior ≤0,11 %), con `ART_TOOLS/prepare_hub_tanda_05.py` (`kill_exterior_halo`, `despill_dark` para fondo negro). Sin regeneración durante el cierre.
- Clasificación: A máquinas/entretenimiento (T05-01/02), B equipamiento (T05-03/04/05/08), C decoración ambiental (T05-06/07/09) y D interactividad potencial (T05-10). 4 objetos funcionales SIN lógica nueva.
- `T05-08` conservó composición **vertical** 68×178 con escala ajustada: NO se regeneró horizontalmente (límite de 10 generaciones de imagen).
- Integración: `loadHub5()` tras `loadHub2()` en `ART_PACK/art_pack.js` y 10 entradas `hubDecor` en `DEADBEAT_DISCO.ART.html`, ambas con marcadores `TANDA05:BEGIN/END`. Flag reversible `window.__DDM_HUB_T05`.
- Cierre: QA formal 14/14 APROBADO, 10/10 `drawImage` en el canvas de mundo, 10/10 con diff de píxel OFF/ON, `hashes.json`, informe `ART_TANDA_05_HUB_REPORT.md` y matriz `ART_HUB_TANDA_05_MATRIX.md`.

<!-- TANDA06:PRODUCTION -->
### TANDA 06 — Envolvente arquitectónica y atmósfera

- Producción: **10 fuentes** 1408×768 y **10 finales RGBA** con `flood_alpha` por conectividad + `despill_dark`; 10/10 `exactSize`, halo claro 0,0 %, cobertura 64,99–88,89 %. Segundo rerun del preparador **determinista** (hashes sin cambios).
- Continuidad: `additionalAnchors`/`additionalWorldBoxes` para `T06-06/07` en `y=780/1540`; **14 entradas `hubDecor` sobre 10 PNG** que cubren `y=400..1540` con `gaps=0`. Muro norte `x=500→1856`, `abutmentGaps=0`.
- Composición previa repetida con las 14 cajas: `APROBADA`, cobertura 14/14 en 10 zonas de cámara; `ART_HUB_TANDA_06_CAMERA_AUDIT.md` regenerado.
- Integración: `HUB6_ASSETS`/`loadHub6()`/API `hub6*` en `ART_PACK/art_pack.js` y 14 props en `DEADBEAT_DISCO.ART.html`, con flag reversible `__DDM_HUB_T06`. Sin sistemas nuevos.
- Cierre: QA formal A/B de 3 fases **14/14 APROBADO**, 10/10 `drawImage` en el canvas de mundo, 10/10 confirmados por diff de píxel OFF/ON, `alpha_verification.json`, `hashes.json`, informe `ART_TANDA_06_HUB_REPORT.md` y matriz `ART_HUB_TANDA_06_MATRIX.md`.

<!-- TANDA07:PRODUCTION -->
### TANDA 07 — El umbral del infierno (Fases 0–5)

- F0/F1: auditoría del juego real (23 filas, 16 APROBADO / 6 NO VERIFICADO / 1 BLOQUEADO) y composición geográfica entregadas **antes de producir assets**, en el commit `c6c1303`. Autorización del usuario: «si».
- Producción: **8 fuentes** `generate_image` → **6 finales** (4 RGBA con máscaras `top_corners`/`aperture`/`shaft` y 2 JPEG opacos) con `ART_TOOLS/prepare_hub_tanda_07.py`; 6/6 tamaño exacto, halo <1 %, `allValid:true`. **0 sprites de NPC nuevos**: dos pruebas de «clubber sentada» se descartaron y se reutilizan los 5 NPC V5 existentes.
- Integración: `HUB7_ASSETS`/`loadHub7()` tras `loadHub6()` en `ART_PACK/art_pack.js` (mismo `load()`, mismo `__DDM_V5_IMG`, **162 → 168 claves**); módulo `T07` en `initDmoHubV35` y enganches `Wf/Ph/zf/Tf` montados en tiempo de arranque desde `buildHubSpace()` en `DEADBEAT_DISCO.ART.html`. Flag reversible `window.__DDM_HUB_T07`.
- Fase 2: llegada breve 1,85 s (0,95 s con movimiento reducido), disparada al entrar al HUB, **sin `transitionLock`** y sin tocar audio. Fase 3: 6 actores / 5 actividades sobre `addHubCustomProp → Lc → Y-sort`. Fase 4: parallax del pozo + luz + brasas sobre `floorDropAnim`, sin fotograma negro (luminancia mínima 39,15).
- Audio **deliberadamente intacto**: `cineFilter`/`cineGain`/`cineSting` están detrás de `M.cine` y habilitarlos exigiría `cineBegin()` (`forceKey` inmediato). 1 secuenciador en todo momento.
- Cierre: QA formal A/B **35/35 APROBADO** (`ART_EVIDENCE/hub/tanda_07/qa_tanda07.json`), 6/6 SHA-256 sin discrepancias, `manifest.json` → `INTEGRADO_VALIDADO`, informe `ART_TANDA_07_REPORT.md` y matriz `ART_TANDA_07_FASE3_MATRIZ_NPC.md`. PR #1 abierto **sin merge**; `main` intacta.

<!-- TANDA08:PRODUCTION -->
### TANDA 08 — El abismo vivo (Fases 0–5)

- F0/F1 entregadas **antes de producir**: auditoría global (`audit_global.json`, 12 capturas), mapa de profundidad de 6 planos, carencias P1–P5 y prueba de composición **16/16 APROBADA** en copia temporal del HTML sin generar assets. Restricción decisiva: la cámara no desciende y bajo `y1585` sólo hay ~84 px.
- Producción: **10 fuentes** `generate_image` → **10 finales RGBA** con `ART_TOOLS/prepare_hub_tanda_08.py` (recorte automático por luminancia, `resize LANCZOS`, gradación de brillo/saturación por plano, máscaras `band`/`object`/`smoke`, despill oscuro). 10/10 `exactSize`, halo claro 0,0 %, `allValid:true`. Las dos paredes próximas son fuentes distintas. **0 sprites de NPC, 0 criaturas, 0 enemigos.**
- Integración: `HUB8_ASSETS`/`loadHub8()` tras `loadHub7()` en el **mismo `load()`** y registro `__DDM_V5_IMG` (**168 → 178**); módulo `T08` en `initDmoHubV35` y `T08.install()` en `buildHubSpace()` sobre los hooks `zf`/`Tf` existentes. Flag reversible `window.__DDM_HUB_T08`.
- Animación: brasas, humo, ceniza, luces lejanas y formaciones con balanceo, todo con objetos preasignados, `Yc.reduced`, `update()` que sale temprano si el cutaway es invisible y progreso real de `floorDropAnim`. Sin segundo temporizador.
- Cierre: QA formal A/B **33 APROBADO / 0 FALLIDO / 4 NO VERIFICADO** (`ART_TOOLS/qa/validate_hub_tanda_08.js`), 10/10 hashes, `manifest.json` → `INTEGRADO_VALIDADO`, informe `ART_TANDA_08_REPORT.md`, `mapa_profundidad.json` y 52 evidencias. PR #1 abierto **sin merge**; `main` intacta.

<!-- TANDA09:PRODUCTION -->
### TANDA 09 — El HUB como lugar habitado (Fases 0–5)

- F0/F1 entregadas y **autorizadas antes de modificar código**: inventario real de 11 props NPC (4 `ambientDancers` T01 + 6 actores T07 + `narr_cliente000`), 6 zonas oficiales A–F, 11 estaciones, 5 sprites V5 de pie, medición de 24 muestras que confirmó que la actividad **nunca cambiaba**, y matriz de 10 rutinas con duraciones/intensidades/reacciones distintas (`ART_TANDA_09_FASE0_INVENTARIO.md`, `ART_TANDA_09_FASE1_MATRIZ_RUTINAS.md`, commit `87ede45`).
- Descubrimiento de arquitectura: `DMO_LAYOUT.propObjects()` devuelve un **clon profundo** (`oA/tA`); el pintor debe engancharse sobre el array real `tc`. Además `buildHubSpace()` recrea los props, por lo que T09 usa **re-enganche perezoso** en el ciclo común.
- Producción autorizada: **4 fuentes** `generate_image` → **4 finales RGBA 131×232** con croma verde, despill, recorte y alfa real (`ART_TOOLS/prepare_hub_tanda_09.py`). 4/4 `exactSize`, esquinas transparentes, halo 0–0,65 %, 4/4 SHA-256. Son posturas estáticas (sentado, observar, gesto, espera), **no animaciones nuevas ni NPC nuevos**.
- Integración: módulo `T09` tras `TANDA08:END (módulo)` y `T09.install()` tras `T08.install()`; **2 inserciones, 0 eliminaciones** en `DEADBEAT_DISCO.ART.html`. **`ART_PACK/art_pack.js` SIN CAMBIOS** (versión `+hub-tanda08` intacta, 178 → 182 claves V5 por los 4 alias `t09_*` registrados en caliente). Sin loader, canvas, cámara, audio, colisiones, estaciones ni progresión nuevos.
- Rutinas: `ACTIVE → PAUSE/SHIFT/OBSERVE/WAIT/POSTURE → RESUME → ACTIVE` con **un único** acumulador `Tf(dt)`, `seed` determinista, congelación exacta de frame por `holdOffset` y recuperación en 1,2 s sin reiniciar `phase`. Reacciones T07 conservadas con pesos individuales; 5 de 10 NPC sin reacción, 8 de 10 sin desplazamiento.
- Acontecimientos: 7 definiciones, uno simultáneo, separación ≥25 s, 3,0–5,5 s, reversibles; 3 disparados y completados en 100 s.
- Cierre: QA **16/16 APROBADO** sobre 100 s / 400 muestras + 180 muestras a 33 ms (`ART_EVIDENCE/hub/tanda_09/qa_matrix.json`), matriz completa **16 APROBADO / 0 FALLIDO / 3 BLOQUEADO / 6 NO VERIFICADO**, 0 `pageerror`, 0 warnings, `manifest.json` → `INTEGRADO_VALIDADO`, informe `ART_TANDA_09_REPORT.md`.
- Flag reversible `window.__DDM_HUB_T09`: con `false` los 10 wrappers delegan en el `hubDraw` original de T01–T08 y no se cargan los sprites nuevos; verificado OFF → ON. Sin merge; `main` intacta.

<!-- MODIFICACION-PRIORITARIA:PRODUCTION -->
### MODIFICACIÓN PRIORITARIA — Legibilidad y reconstrucción espacial del HUB (A–F)

- **Prioridad del usuario por encima de T09**: no añadir contenido hasta resolver saturación, niebla, orientación y lectura espacial. T09 (ya publicada) se aísla con `__DDM_HUB_T09=false` en toda la auditoría y la corrección; **no se amplían rutinas NPC**.
- Auditoría (`56dfd85`): 16 posiciones de cámara real, 7 variantes A/B de capas × 3 posiciones, 8 fotogramas de descenso, **79 incidencias** (6 ESENCIAL / 21 FUNCIONAL / 29 AMBIENTAL / 8 REDUNDANTE / 8 MAL UBICADO / 7 PENDIENTE DE CORREGIR). Niebla localizada en `DMO_ATMOS` bloom `screen` con `style.opacity=1`; `CFG.bloom` es interruptor, no regulador. Humo/ceniza T08 es profundidad, no niebla.
- Bloqueo crítico documentado: `hub_abyss_stair_crack` era decal de 330 px sobre suelo intacto, T08 abría una ventana rectangular y `lift` (1250,1365,r142) era un radio lógico sin conexión física. Propuesta entregada **antes de modificar**.
- Autorización del usuario: **A–F completos** en orden, con parada ante problemas críticos, y **T09 desactivada**.
- Integración: módulo `LEG` dentro de `initDmoHubV35()` + **4 inserciones / 0 eliminaciones**; `apply_hub_legibilidad.py` con restauración byte a byte verificada por SHA-256. Flag `window.__DDM_HUB_LEGIBILIDAD` (`false` = estado publicado). **`ART_PACK/art_pack.js` intacto**, 0 assets nuevos, 0 props nuevos.
- Orden de capas descubierto y resuelto: el borde neón recto se dibuja **después** de `drawHubFloorLayer()`, por lo que el labio y la boca se pintan en `zf` con la matriz de mundo capturada en Wf; el `chasm` completo va en Wf por debajo de props y jugador. `clipCutaway()` usa `q.cm` y `shaftOpen` para que T08 crezca desde el hueco.
- Cierre: QA **18/18 APROBADO / 0 FALLIDO** (`ART_EVIDENCE/hub/correccion/qa_matrix.json`), 16 sweep + 12 A/B + 2 restaurado + flag OFF de arranque + compatibilidad T09 + 9 descenso + hoja comparativa, 0 `pageerror`, `startCampaignFromHub(0)` → `CAMPAIGN_ROOM`. Línea magenta recta **1089→0 px** (restaurada 1117), separación de planos en el borde **17,95→23,65**. Criterio visual de 5 puntos `APROBADO` por inspección; prueba con usuarios nuevos en `NO VERIFICADO`. Informe `ART_CORRECCION_LEGIBILIDAD_HUB.md`. PR #1 abierto **sin merge**; `main` intacta.
