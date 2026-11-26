# DEADBEAT DISCO — AUDITORÍA DE SLOTS Y PROTOCOLO DE SEGURIDAD · TANDA 03

- **Fecha:** 2026-11-03 · **Rama:** `arena/109fe45c-deadbeat-disconew` · **Build:** `DEADBEAT_DISCO.ART.html`
- **Herramientas de auditoría (solo lectura):** `ART_TOOLS/qa/hub_tanda_03_audit.js`, `ART_TOOLS/qa/hub_tanda_03_slot_probe.js`, `/tmp/hub3_geom.js`.
- **Entorno medido:** Chromium **131.0.6778.0** (`browser.version()`), `playwright-core` **1.58.2**, SwiftShader por software, **1280×900**, `deviceScaleFactor=1`, servidor `0.0.0.0:8123` con `GET / → HTML` (HTTP 200).
- **Evidencias:** `ART_EVIDENCE/hub/tanda_03/audit_runtime.json`, `slot_probe.json`, `geometry_probe.json`, `audit_00_menu.png`, `probe_00_menu.png` y 10 `audit_<zona>.png`.

> **Conclusión adelantada (y discrepancia principal):** de los 8 objetivos de producción del apartado 2, **ninguno tiene integración de render verificable en el HUB**. Los 4 paños de suelo, las 2 variantes de mobiliario y las 6 señales de zona **no tienen ningún slot de dibujo ni clave V5 consultada**. `HUB_VIP_BOOTH_LOUNGE` sí tiene un pintor en el código, pero pertenece al canvas `d.menu` (768×500) del renderer de píxeles, que **no está activo en el build en ejecución**: 0 dibujos medidos en 5 arranques consecutivos (ver D‑07). Los 13 PNG se producen, se cargan con el loader real y se registran en `window.__DDM_V5_IMG`, pero **registro ≠ integración**. **El HTML no se ha modificado**; los 8 bloqueos se documentan en este informe y en el informe final.

---

## 1. Protocolo de seguridad — resultados reales

| # | Comprobación | Resultado |
|---|---|---|
| 1 | Rama / HEAD / remoto / worktree | `arena/109fe45c-deadbeat-disconew`, HEAD `888f3380cb9c63f818a770a404291045dc678eed`, `origin/...` = `888f338`, `git status --porcelain -uall` = **0 líneas** (limpio) |
| 2 | Rama de arte y recursos | Sesión fijada en la rama de trabajo; `arte-y-recursos` remota = `7653ce6` (solo `README.md`), `main`/`origin/main` = `d75e021`. PR #1 `OPEN`, `mergedAt=null`, head = rama de sesión, base = `arte-y-recursos`. Autorización de T01 vigente: commit/push en rama de sesión + PR sin merge. |
| 3 | Commit anterior y T01/T02 | `775926a` (T01) y `888f338` (T02) presentes. 21 archivos por tanda, 10 fuentes + 10 finales + `manifest.json`, `report.json` **12/12 APROBADO** en ambas. Sin archivos movidos ni renombrados. |
| 4 | HTML activo intacto | 19.838 líneas / **13.381.028 B**, SHA-256 `f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723`, `git diff HEAD -- DEADBEAT_DISCO.ART.html backups/` = vacío. Backup `v9_t3_fase1b_cache_probe.ORIGINAL.html` intacto. |
| 5 | Informes y manifiestos leídos | `ART_TANDA_01_HUB_REPORT.md`, `ART_TANDA_02_HUB_REPORT.md`, `ART_HUB_TANDA_02_AUDIT.md`, `ART_AUDIT/hub_tanda_02_needs_inventory.json`, ambos `manifest.json`, ambos `report.json`, `CHANGELOG.md`, `ART_PRODUCTION_LOG.md`, `ASSET_INVENTORY.md`, `CURRENT_STATE.md`, `VISUAL_QA_REPORT.md`. |
| 6 | `ART_PACK/art_pack.js` y pintor V5 | 1314 líneas, `node --check OK`, versión `fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02`. Bloque `HUB2_*` independiente, `run()` → T01 → arquitectura → HUB-T01 → HUB-T02. `__DDM_GET_V5(k)` devuelve `__DDM_V5_IMG[k]` si `complete && naturalWidth>0`. |
| 7 | Claves y slots de los diez objetivos | Ver §3. **128 claves V5 registradas**, **21 slots dibujados en el HUB** por fotograma; 0 claves de suelo/señalética/variantes. |

**No se ha hecho merge, no se ha cambiado de rama, no se ha sobrescrito ningún archivo, no se ha tocado `main` ni se ha limpiado ninguna evidencia o backup.**

---

## 2. Geometría real medida en runtime

| Elemento | Medición real | Fuente |
|---|---|---|
| Canvas de suelo cacheado | **1920 × 1320 px**, dibujado en mundo `(290, 265)` sin escala → rectángulo mundo `x 290…2210`, `y 265…1585` | `__T3B_HUB_QA.capture()` → cabecera PNG; `g.drawImage(hubCachedFloorCv, 290, 265)` |
| Estado de la caché de suelo | `revision=28`, `builds=1`, `draws=156…535`, `available=true` | `__T3B_HUB_QA.state()` |
| Centro del HUB / medallón | `cx=1250, cy=935`; escudo `hub_fox_crest_emblem` caja `[1060,823,380,225]`, natural 560×332 | `audit_runtime.json` |
| Cabina DJ | `hub_dj_shrine` caja `[1058,280,384,209]`, natural 720×392; estación B `(1250,525)` | idem |
| Grieta de descenso | `hub_abyss_stair_crack` caja `[1085,1256,330,180]`, natural 320×175; estación C `(1250,1365)` | idem |
| Alcobas VIP (T01) | `hub_vip_booth_nw/ne` cajas `[681,439,208,160]` / `[1611,439,208,160]`, natural 224×172 | idem |
| Crest de pared | `wall_neon_club_crest` caja `[761,398,48,48]`, natural 84×84 | idem |
| Tablón narrativo | `hub_trophy_board_prop` caja `[922,337,156,127]`, natural 167×136 | idem |
| `hubDecor` (10 props) | jardineras `(1005,702) (1495,702) (1005,1178) (1495,1178)` h=88; bancos `(1085,1252) (1415,1252)` h=74; altavoces `(985,502) (1515,502)` h=122; dispensador `(452,692)` h=104; expendedora `(2048,692)` h=118 | código HTML, array `hubDecor` |
| Estaciones (11) | lift C `(1250,1365)`, dj B `(1250,525)`, arsenal D `(705,855)`, bar E `(1790,855)`, arcade F `(655,1135)`, seals F `(1845,1135)`, 4 bailarines A, cliente000 A `(785,600)` | `DMO_HUB.stations()` |
| Zonas | **6** (`A` pista, `B` DJ, `C` descenso, `D` arsenal, `E` barra, `F` arcade/sellos) | `DMO_HUB.audit()` |
| Canvas del MENÚ | 768×500, construido **una sola vez** y cacheado en `d.menu`; invalidación `d.menu=null` cuando `djReady && !d._v5MenuBuilt` | código HTML |

**APIs expuestas (medidas):** `DMO_HUB` = `state, saveState, reloadSave, stations, canEnterCircle, missingRequirement, canReturnToHubNow, openStation, closeModal, startCampaignFromHub, returnToHubFromMilestone, debugSpawnBeacon, audit, version, saveKey`. `DMO_ART_PACK` = `state, integrity, architecture, restore, apply, hub*, hub2*, player*, manifest, architectureManifest`. `__T3B` = `enabled, revision, images, ready, errors, draws, version, setEnabled, state, roomCapture, reload, lastInvalidation`. `DMO_INFERNAL_ART` = `version, themes, invalidate, audit`. `__T3B_HUB_QA` = `state, capture`.

**NO son globales:** `Wf`, `Ph`, `zf`, `g`, `addHubCustomProp`, `hub`, `Ot` → `typeof === 'undefined'` en `window`. Por tanto **no existe ningún gancho público al pintor del HUB** desde `ART_PACK/art_pack.js`: `addHubCustomProp` y el array `hubDecor` son locales de un closure. La única vía para añadir nuevos dibujos al HUB es editar el HTML (prohibido sin autorización) o crear un sistema de render nuevo (prohibido explícitamente).

---

## 3. Verificación de los diez objetivos: claves, slots y pintores

Catálogo de claves consultadas por el pintor (extraído estáticamente y confirmado en runtime con `allGets`/`allFn`): **69 claves**, todas del tipo `hub_*`, `club_*`, `wall_*`, `campaign_*`, `floor_seal_*`, `*_prop`, `t02_A*`, etc. **No aparece** ninguna de `HUB_FLOOR_PATCH_*`, `HUB_FLOOR_NORTH_DJ`, `*_VARIANT_02`, `HUB_ZONE_SIGNAGE`, `floor_patch`, `zone_sign`, `zone_signage`, `signage`. Claves consultadas pero **ausentes** del registro: solo `floor_seal_limbo`, `floor_seal_lujuria`, `hub_vip_booth_lounge`.

| # | Objetivo | Orientación / ubicación real | Slot V5 | Pintor | Veredicto de integración |
|---|---|---|---|---|---|
| 1 | `HUB_FLOOR_PATCH_O` | **OESTE** (x 290…870, y 720…1150). El pliego dice «oriental», pero el informe T02 §11 y el código (`hub_decor_cooler_w` x=452) sitúan `O` al oeste. | **NO EXISTE** | **NO** | **BLOQUEADO** |
| 2 | `HUB_FLOOR_PATCH_E` | **ESTE** (x 1630…2210, y 720…1150). El pliego dice «oriental alternativo»; es el este, segundo paño del informe T02. | **NO EXISTE** | **NO** | **BLOQUEADO** |
| 3 | `HUB_FLOOR_PATCH_S_CRACK` | SUR tras la grieta (x 870…1630, y 1436…1585), continuidad con `hub_abyss_stair_crack` | **NO EXISTE** | **NO** | **BLOQUEADO** |
| 4 | `HUB_FLOOR_NORTH_DJ` | NORTE junto al DJ (x 870…1630, y 265…400), relación con `hub_dj_shrine` | **NO EXISTE** | **NO** | **BLOQUEADO** |
| 5 | `HUB_PLANTER_VARIANT_02` | 4 jardineras `hubDecor`, todas con el **mismo** slot `club_neon_planter_prop` (96×108, caja 78×88), 2 de ellas con `flip` | Solo 1 slot (T02) | Sí, pero uno solo | **BLOQUEADO** como variante diferenciada |
| 6 | `HUB_BENCH_VARIANT_02` | 2 bancos `hubDecor`, ambos con el **mismo** slot `limbo_bench_prop` (256×198, caja 96×74) | Solo 1 slot (T02) | Sí, pero uno solo | **BLOQUEADO** como variante diferenciada |
| 7 | `HUB_VIP_BOOTH_LOUNGE` | `gv("hub_vip_booth_lounge")` → `drawImage(vb, 32, 284, 108, 68)` y 3 réplicas espejo en el canvas del **MENÚ** | **SÍ**, clave ausente del registro | En el código, pero **renderer inactivo** (D‑07) | **BLOQUEADO** para render; registro V5 disponible |
| 8 | `HUB_ZONE_SIGNAGE` (6 variantes) | 6 zonas A–F. El único sistema de señales existente es `drawDiegeticSign()` (texto procedural de HUD, no un asset V5) y `wall_neon_club_crest` (84×84, 1 clave) | **NO EXISTEN 6 slots** | **NO** | **BLOQUEADO** |
| 9 | `wall_limbo_ticket_window` | Fuera de alcance por el apartado 6 | Existe (consultada 2×) | Existe | **NO IMPLEMENTAR** |
| 10 | `limbo_gate_stage` | Fuera de alcance por el apartado 6 | Existe | Existe | **NO IMPLEMENTAR** |

### Demostración empírica del único slot integrable

`ART_TOOLS/qa/hub_tanda_03_slot_probe.js` inyecta temporalmente un PNG transparente 1×1 en `__DDM_V5_IMG['hub_vip_booth_lounge']` **sin tocar ningún archivo** y mide:

```
vipRegistered: true
vipDrawsMenu : 4          vipBoxMenu: [32, 284, 108, 68]
vipFn        : 4          vipGets   : 2
vipDrawsHUB  : 0          hubDrawsTotal: 4390 (21 slots)
```

Es decir: **loader compatible = `__DDM_V5_IMG` / `__DDM_GET_V5`**, **pintor en el código = banner `pixel-club` del menú**, **composición por capas = 4 réplicas (2 lados × 2 filas) con `scale(-1,1)` para el lado derecho**, **caja de dibujo 108×68**, **0 dibujos en el HUB**. No es un elemento completo del HUB: es un setpiece de fondo del menú. Cualquier afirmación de «nuevo espacio VIP dentro del HUB» sería falsa.

**Rectificación posterior (D‑07, medición de producción):** esa sonda inyectaba la imagen **en el momento de crearse el registro**, antes que cualquier carga de red, y además usaba un PNG 1×1 transparente. Repetida con el bloque `HUB3_*` ya integrado dio **0 dibujos**; tres arranques más con el PNG real dieron **0 dibujos y 0 consultas `gv`** en dos de ellos y 2 consultas sin dibujo en el tercero. La conclusión original («INTEGRABLE») era optimista: el renderer que construye `d.menu` no se ejecuta de forma determinista en la pantalla de título del build activo, que usa el canvas ilustrado `menu-canvas54` (960×540). Se mantiene la evidencia estática del pintor, pero la visibilidad en producción se clasifica **NO VERIFICADO** y la integración de render **BLOQUEADO**.

---

## 4. Inventario de necesidades y clasificación

| Elemento | Clase | Situación real | Decisión |
|---|---|---|---|
| Suelo cacheado `hubCachedFloorCv` (1920×1320, T01 HUB-01) | 1 EXISTENTE Y CORRECTO | Se dibuja 156–535 veces; patrón `t3b_material_01` | **Conservar**. No se sustituye. |
| 21 slots dibujados en el HUB (8 de T01 + 10 de T02 + 3 legacy) | 1 | Vivos y verificados | **Conservar**. |
| Paños perimetrales O / E / S / N | 3 INCOMPLETO | Superficie sin identidad, **sin slot discreto**: son regiones del mismo canvas cacheado | Producir los 4 recursos; integración **BLOQUEADA** |
| `club_neon_planter_prop`, `limbo_bench_prop` | 2 EXISTENTE PERO MEJORABLE | Un solo slot por familia, 4 y 2 instancias respectivamente | Producir 2 variantes; integración **BLOQUEADA** sin segundo slot |
| `hub_vip_booth_lounge` | 4 AUSENTE (clave) / 5 no aplicable | Consultada por el pintor del menú, ausente del registro | **Integrar** en el registro V5; documentar que no es HUB |
| Señalética de 6 zonas | 4 AUSENTE | `drawDiegeticSign()` es HUD procedural; no hay slots V5 | Producir sistema de 6 variantes; integración **BLOQUEADA** |
| `wall_limbo_ticket_window`, `limbo_gate_stage` | 6 PENDIENTE DE VALIDACIÓN | Cachés de salas, pertenencia al HUB no confirmada | **No tocar** (apartado 6) |
| `hub_vip_booth_nw/ne`, `hub_dj_shrine`, medallón, grieta | 1 + 5 INTERACTIVO | Estaciones y geometría funcionales | **No modificar** |

---

## 5. Registro de discrepancias (protocolo apartado 1)

| ID | Discrepancia | Evidencia | Acción |
|---|---|---|---|
| D-01 | El pliego asume «slots» para los 4 suelos, 2 variantes y 6 señales; **no existen** en el registro V5 ni en los pintores. | `audit_runtime.json` (128 claves, 21 slots), `slot_probe.json` (`absentTargets` = 11/11), catálogo estático de 69 claves consultadas | **Detener la integración** de esos 9 objetivos; documentar BLOQUEADO. No se inventa pintor ni se modifica el HTML. |
| D-02 | `HUB_FLOOR_PATCH_O` se describe como «paño de suelo **oriental**» y `HUB_FLOOR_PATCH_E` como «oriental alternativo». El informe T02 §11 y el código sitúan **O = oeste** y **E = este**. | `hubDecor`: `cooler_w` x=452, `vending_e` x=2048; estaciones arsenal (705) / bar (1790) | Se corrige la orientación **mediante código** antes de producir, como exige el pliego: O = oeste, E = este. |
| D-03 | El pliego pide «exactamente 10 assets finales» pero el apartado 2 define **8 unidades de producción** (la 08 = 6 variantes) y el apartado 6 excluye los objetivos 9 y 10. La estructura de directorios propuesta tiene exactamente **8 carpetas** `01…08`. | Apartados 2, 4 y 6 del pliego | Se entregan **8 unidades / 13 PNG finales** (7 individuales + 6 señales). Se registra la inconsistencia numérica en lugar de inventar 2 assets. |
| D-04 | `hub_vip_booth_lounge` fue documentada en T02 como «sin pintor»; la auditoría T03 demuestra que **sí tiene pintor**, pero en el **MENÚ**, no en el HUB. | `slot_probe.json`: 4 dibujos en MENU, 0 en HUB | Integrar donde realmente se dibuja; no declarar «nuevo espacio VIP en el HUB». |
| D-05 | Los ganchos de render (`Wf`, `Ph`, `zf`, `g`, `addHubCustomProp`, `hub`, `Ot`) **no son globales**: no se puede añadir un draw al HUB desde `art_pack.js`. | `slot_probe.json → menu.globals` | Integrar solo vía `__DDM_V5_IMG`. Cualquier dibujo nuevo en el HUB exigiría editar el HTML → **se detiene y se solicita autorización** (no concedida en esta tanda). |
| D-06 | El canvas del menú se construye **una vez** y se cachea (`d.menu`). Registrar el slot después de esa construcción no lo muestra. | código HTML `d.menu || (d.menu = function(){...})` | `startHub3()` se lanza en el primer instante del boot (sin loader nuevo) para adelantar la carga; aun así no hay garantía, ver D-07. |
| D-07 | **El renderer que consume `hub_vip_booth_lounge` no está activo en el build en ejecución.** La pantalla de título usa el canvas ilustrado `menu-canvas54` (960×540); el canvas `d.menu` (768×500) del renderer de píxeles no se dibuja. En 5 arranques medidos: 0 `drawImage` del VIP real, 0–2 consultas `gv`; una única sonda histórica con inyección anticipada dio 4 dibujos. | `/tmp/hub3_vipcount.js` (3 arranques), `/tmp/hub3_slotprobe_copy.js` (repetición de `slot_probe.js` = 0 dibujos), `/tmp/hub3_canvases.js` (0 blits de canvas 768×500), `slot_probe.json` original (4 dibujos) | **No se declara integración de render.** El registro V5 y el loader sí son reales y se verifican; la visibilidad en producción queda `NO VERIFICADO`. No se fuerza el renderer, no se modifica el HTML y no se inventa un sistema de dibujo. |

---

## 6. Decisión de integración (sin modificar el HTML)

- Se crea un bloque **independiente `HUB3_*`** en `ART_PACK/art_pack.js`, respetando `HUB_*` (T01) y `HUB2_*` (T02), con el mismo registro `window.__DDM_V5_IMG`, el mismo `load()` y las mismas APIs de invalidación (`DMO_INFERNAL_ART.invalidate()`, `__T3B.setEnabled(true)`).
- **PRODUCIDOS, CARGADOS Y REGISTRADOS (8 unidades / 13 PNG):** todos entran por `load()` y el mismo `window.__DDM_V5_IMG`, con claves `h03_*` trazables (igual que `h01_*`/`h02_*`). Esto es verificable: 13/13 HTTP 200, 13/13 `exactSize`, 13/13 registrados, 0 errores.
- **INTEGRACIÓN DE RENDER: 8/8 BLOQUEADA.** 7 objetivos no tienen slot; el octavo tiene pintor en el código pero su renderer está inactivo (D‑07). Ninguno se dibuja en el HUB ni en la pantalla de título. Se marca `visibleInGame: false` y `integrationState: "BLOQUEADO"` en todos. **Registro ≠ integración**: así se declara en el manifiesto, en `report.json` y en el informe final.
- `hub3Invalidate()` usa las APIs existentes (`DMO_INFERNAL_ART.invalidate()`, `__T3B.setEnabled(true)`) para conservar la composición de las dos capas cacheadas; no introduce ningún lienzo nuevo. Se comprobó que tampoco es la causa de D‑07 (experimento sin invalidación: 0 dibujos).
- **NO se crea:** segundo motor, canvas superpuesto, HUB estático, nuevo sistema de cachés, loader paralelo ni registro de imágenes duplicado.
- **HTML activo:** intacto. No se ha solicitado ni ejecutado autorización para modificarlo.

---

## 7. Sistemas compartidos y límites

- 6 de los objetivos (suelos y señalética) afectarían a la **capa de suelo cacheada** (`__T3B_HUB_QA`, `builds=1`); las 2 variantes afectarían a `hubDecor`; la señalética afectaría a la capa aérea. Ninguna de esas capas expone un punto de inserción público → no se tocan.
- `CAMPAIGN_ROOM`, puertas (`Ot.openT`), 11 estaciones, 6 zonas, colisiones (`x=1795` contra la barra), movimiento, disparo, música, DJ, HUD, guardado y progresión **no se modifican**.
- No se implementan animaciones de recreativas/expendedora, efectos ambientales dinámicos ni `wall_limbo_ticket_window` / `limbo_gate_stage`.
- Las 10 recomendaciones de TANDA 02 **no se interpretan como 10 permisos**: solo se ejecutan los 8 objetivos del apartado 2 y se excluyen el 9 y el 10.

---

## 8. Criterio de finalización aplicado

> «TANDA 03 solo se considera completada cuando los diez objetivos están producidos, integrados **o sus bloqueos están explícitamente documentados**, y la validación real se ha ejecutado.»

Se producen los 8 objetivos en alcance (8 fuentes + 13 PNG finales), se cargan y registran en el registro V5 real, se documentan los **8 bloqueos de render** con evidencia de runtime y se ejecuta la QA A/B real. Los objetivos 9 y 10 quedan fuera de alcance por mandato del apartado 6. Cualquier resultado `APROBADO` se respalda con evidencia; los bloqueos se clasifican como `BLOQUEADO` y la visibilidad en producción como `NO VERIFICADO`, nunca como `APROBADO`. Para desbloquear la integración haría falta autorización explícita para un cambio mínimo y justificado del HTML activo (o una auditoría específica del renderer de píxeles), no un sistema de render nuevo.
