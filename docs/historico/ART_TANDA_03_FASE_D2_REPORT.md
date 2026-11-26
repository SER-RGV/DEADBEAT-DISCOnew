# FASE D.2 · COMPATIBILIDAD ANATÓMICA Y COMBATE REAL

**Fecha:** 2026-11-03 · **Rama:** `arena/3f148aa7-deadbeat-disco` · **HEAD:** `897ff85dcbd937a9458d2300a5643de094374f27`
**Estado:** ENTREGADA — **VERIFICADO PARCIAL / NO VERIFICADO en los puntos indicados**. Sin commit ni push.
**Base:** FASE D (integración) + FASE D.1 (calibración `handDom`), ambas conservadas.

---

## 1. Objetivo y alcance

Completar la compatibilidad del nuevo protagonista FASE C con el sistema de armas y comprobarlo en combate real, **implementando correcciones**, no solo analizando. Se respetaron todas las restricciones: no se regeneraron sprites, no se duplicaron assets, no se modificó el HTML activo / probe / backup / TANDA 01 / TANDA 02, no se crearon loaders, overlays ni sistemas paralelos, no se tocaron mecánicas, estadísticas, hitboxes, `aimAngle`, `muzzleWorld`, colisiones ni lógica de disparo.

### 1.1 Archivos modificados

| Archivo | Tipo | Motivo |
|---|---|---|
| `ART_PACK/art_pack.js` | **código** (único archivo de lógica tocado) | Implementación D.2. **40.530 B / 852 líneas**, `node --check` OK, 0 caracteres CJK. |
| `ART_EVIDENCE/tanda_03/fase_d2_*.png` (17) | **evidencia** | Entregable exigido en el apartado 8: "Guarda capturas reales…". Capturas CDP crudas, sin composición. |
| `ART_TANDA_03_FASE_D2_REPORT.md` | **informe** | Entregable exigido en el apartado 8: "Actualiza el informe FASE D.2…". |

**Justificación previa** (requerida por la restricción de modificar únicamente `art_pack.js`): las capturas y este informe no son una dependencia técnica nueva del render, sino **entregables que el propio encargo ordena crear**. No se ha tocado ningún otro archivo de código, configuración o asset. Las composiciones auxiliares generadas para revisión (`/tmp/d2_armas_sheet.png`, `/tmp/d2_previas_sheet.png`, `/tmp/d2_workspace_sheet.png`, `/tmp/p3_hands_grid.png`, etc.) **quedan fuera del workspace y no se presentan como capturas de partida**.

---

## 2. Cambios implementados en `ART_PACK/art_pack.js`

1. **`P3_HANDSUP_PX`** — coordenadas de la mano de apoyo medidas manualmente sobre los 8 PNG originales FASE C (lienzo 560×1130), revisadas tras descartar una heurística de piel inválida:
   `IDLE [165,655]`, `CAMINAR [190,640]`, `CORRER [340,500]`, `DISPARAR [400,370]`, `DISPARO_CARGADO [385,365]`, `HABILIDAD [390,640]`, `DANO [320,490]`, `MUERTE [220,1020]` (aproximada; pose inerte).
2. **`p3HandPoint(kind,name,key)`** — generaliza la conversión de D.1 con la **misma** `f = min(W/a.sw, H/a.sh)`, `dx = W/2 − 280f`, `dy = H − 1130f` usada por `p3Draw`. `p3HandDom` y `p3HandSup` comparten esa única transformación; **no se reutiliza `handDom` para `handSup`** y no se inventan coordenadas.
3. **`p3SupportGap` / `p3SupportAudit(weaponId)`** — mide la separación real entre manos y la audita contra la fuente de verdad del arsenal `weaponRig.table().support / grip / lenFrac` (`weaponGripGapPx = (support − grip) · lenFrac · 95`). Sin segunda tabla de armas.
4. **`p3CaptureAnatomy()`** — captura las referencias vivas `gripCheck().manoNativa` para las 12 poses mediante `pa.upperPose` + `pa.renderNow()`, guardando/restaurando `upperPose`, `state`, `forcedState`, `forcedAimAngle`. Captura **10/12**: `player_roll` y `player_death` no devuelven `manoNativa` porque `Pf()` las marca `noWeapon` (no dibujan arma). No se fuerzan artificialmente.
5. **Corrección del frame desfasado** — `pAnim.update()` escribe `upperPose` **después** de `state`; el hook D.1 solo escuchaba `state`, por lo que la calibración se hacía con la pose del frame anterior. Se añadió `notify('upperPose')` a `p3HookAnim`, de modo que la recalibración ocurre **en el mismo tick**. Sin retardos ni suavizados: la respuesta de combate no cambia. Resultado medido: **0/34 muestras desfasadas** (ver §5).
6. **Calibración de la referencia anatómica real de `handSup`** — en `p3Draw`, la ventana `(55,20,29,10)` del canvas `hdImages.player_fire2` se rellena con el antebrazo/mano de apoyo medido en FASE C (`drawImage(im, sx, sy, 60, 22, 55, 20, 29, 10)`), **en el mismo registro de imágenes** que consume el motor. Antes, con el arte FASE C escalado por `p3Draw`, esa región caía fuera del personaje y quedaba vacía. Verificado: **282/290 píxeles con alfa**. No se crea asset nuevo, ni registro paralelo, ni transformación distinta.
7. **`p3CalibrateHand()`** usa `pa.upperPose` del tick actual en vez de `g.pose` para la pose activa.
8. **API** `player().handCalibration`: `sync`, `handSup`, `support` y `limitations` (texto exacto de las limitaciones halladas). `player().version` corregido a **`tanda03-faseD.2`** (antes devolvía `tanda03-faseD` de forma incoherente con `state().player.version`).

---

## 3. `handSup`: consumo real, medición y comprobación

### 3.1 Dónde consume el motor la mano de apoyo (localizado)

| Punto | Consumo | Alcanzable desde `art_pack.js` |
|---|---|---|
| `ANATOMY_SPINE[pose].handSup` (HTML @5905553–5906910) | **0 consumos** fuera de su declaración (búsqueda textual + profundidad 4 + escaneo del segmento `const pAnim`). `Pf()` v3.2 solo usa `spineX/waistX` y `handFrame.anat.handDom`. | **NO** — variable local del IIFE; mutarla exigiría modificar el HTML activo, prohibido. |
| `it()` @4209359 / `r.hd.sup` @4213625 | Mano de apoyo **procedural** del arma: `d = (sup − grip)·len − 4.5·pump`, `u = (supY − axis)·f`. Fuente: `weaponRig.table().support`. | Solo lectura. |
| `getOrientedWeaponDrawable` @5899280 y módulos @5930080 / @6025700 | **Brazo articulado recortado de `hdImages.player_fire2`** en `(sx=55, sy=20, sw=29, sh=10)` y estirado hasta `ov.sup`. | **SÍ** — `window.__HD_ASSETS.images` es el registro que este pack controla. |
| `gripCheck().manoNativa` | Es `ut._hnNative = handFrame.anat.handDom` (**mano dominante**, no apoyo). | Sí (D.1). |

**Decisión:** no se creó una segunda fuente de verdad ni se inventó un campo paralelo. Se actualizó **la referencia anatómica real que este pack posee y que el render de armas recorta** (`player_fire2`), con las coordenadas medidas y la transformación de `p3Draw`. El campo muerto `ANATOMY_SPINE[].handSup` **no se mutó**.

### 3.2 Medición → espacio nativo (valores reales de partida)

| Estado / frame | `handDom` | `handSup` | Separación sprite |
|---|---|---|---|
| IDLE (`player_idle`) | `[26.45, 50.64]` | `[7.21, 55.57]` | 19.86 px |
| CAMINAR (`player_walkN`) | `[39.12, 49.92]` | `[19.32, 54.19]` | 20.26 px |
| CORRER (`player_fire`, dodge `player_roll`) | `[35.94, 36.37]` / `[41.94, 36.37]` | `[32.11, 42.34]` / `[38.11, 42.34]` | 7.09 px |
| DISPARAR (`player_fire`) | `[43.40, 25.02]` | `[37.25, 31.09]` | **8.64 px** |
| DISPARO_CARGADO | `[44.66, 27.99]` | `[35.96, 30.72]` | 9.12 px |
| HABILIDAD (`player_boost`) | `[48.68, 19.22]` | `[48.85, 54.33]` | 35.11 px |
| DANO (`player_hit`) | `[34.89, 42.03]` | `[31.91, 41.44]` | 3.04 px |
| MUERTE (`player_death`) | `[50.70, 16.18]` | `[37.89, 11.38]` | 13.68 px |

`handDom` D.1 **conservado sin cambios** (no hubo medición reproducible que demostrara error). `gripCheck().desvDisenoPx = 0` con `m1911` en `player_fire`, confirmando que la mano dominante sigue calibrada.

### 3.3 Auditoría contra el agarre secundario del arsenal

`weaponGripGapPx = (support − grip) · lenFrac · 95`, desde `weaponRig.table()`:

| Arma | `grip` | `support` | `lenFrac` | Agarre arma | Separación sprite | **Desviación** |
|---|---|---|---|---|---|---|
| `m1911` (1M) | 0.22 | `null` | 0.36 | — | — | `twoHanded:false`, `desvDisenoPx:0` |
| `m16` (2M) | 0.32 | 0.64 | 0.80 | 24.32 px | 8.64 px | **15.68 px** |
| `c094_lanza` | 0.26 | 0.54 | 0.96 | 25.54 px | 8.64 px | **16.90 px** |
| `m60` | 0.36 | 0.64 | 0.88 | 23.41 px | 8.64 px | **14.77 px** |
| `mp40` (PNG HD) | 0.24 | 0.64 | 0.58 | 22.04 px | 19.86 px | 2.18 px |
| `winchester` (PNG HD) | 0.30 | 0.62 | 0.84 | 25.54 px | 19.86 px | 5.68 px |
| `c096_alabarda` (PNG HD) | 0.22 | 0.52 | 0.96 | 27.36 px | 19.86 px | 7.50 px |

**Hallazgo:** la desviación depende del estado. En IDLE/caminar (brazos caídos, manos separadas ≈20 px) el agarre secundario coincide con 2–8 px. En **DISPARAR** el arte FASE C tiene las manos juntas (8.64 px) mientras el arsenal espera 22–25 px → desviación de 14.77–16.90 px.

**NO CORREGIDO, con motivo:** cerrar esa diferencia exigiría (a) regenerar los 8 PNG FASE C con las manos separadas — prohibido, o (b) modificar `r.hd.sup` / los overrides del arsenal en caliente — `weaponRig.overrides.m16.sup = 0.433` no altera `table().support = 0.64` y el HTML está prohibido. Mover `P3_HANDSUP_PX['DISPARAR']` para cuadrar artificialmente sería **inventar coordenadas**, también prohibido. Se registra la medición exacta en `player().handCalibration.support` y en `limitations`. No afecta a `aimAngle`, `muzzleWorld`, proyectiles ni a la lógica de disparo.

### 3.4 Comprobación de la referencia actualizada

- **VERIFICADO:** canvas `player_fire2` 87×96; región `(55,20,29,10)` pasó de vacía a **282/290 px con alfa** (RGB medio 106.6), con el contenido del antebrazo FASE C.
- **VERIFICADO:** `player_fire2` puede resolverse como pose vía `renderNow()` (`gripCheck().pose = "player_fire2"`, `manoNativa [61.16, 27.99]`).
- **NO VERIFICADO:** el **consumo** de ese recorte en partida. Instrumentando `drawImage` de 9 argumentos desde el arranque, con `mp40`, `winchester` y `c096_alabarda` (PNG HD con `support`) se obtuvieron **0 recortes**: el módulo de brazo articulado no está activo en este build (`pAnim.update()` solo emite `player_fire` / `player_firehip`). La mano de apoyo visible en partida es la procedural de `it()`. La calibración queda aplicada en la referencia real, pero su efecto visual en este build **no puede afirmarse**.

---

## 4. Poses restantes

| Pose | Activación real del motor | Imagen usada | Transformación / agarre | Resultado |
|---|---|---|---|---|
| `player_walk0..3` | **SÍ**, como `lowerPose` durante `floorDrop` y movimiento real (`walkFrame` 0→3 observado en 4 capturas) | Asset CAMINAR/CORRER FASE C en el `upperPose` activo; `waistSplitActive=false` por diseño D (no hay sprites separados de cintura) | `p3Draw` con `f/dx/dy` comunes; `handDom` `[39.12,49.92]`, `handSup` `[19.32,54.19]` | **VERIFICADO**. No se fuerzan: el split está desactivado, por lo que el motor no dibuja estas poses como cuerpo completo; se comprueban en la referencia viva y en el `lowerPose` real. |
| `player_fire2` | **NO** en el build activo: `combatUpper = xt[curW] ? "player_firehip" : "player_fire"`; `forceState('charged')` produce `DISPARO_CARGADO` con `player_fire` | Se resolvió vía `renderNow()` (mecanismo propio del motor, sin estado visible forzado) | 87×96; `gripPose player_fire2`, `manoNativa [61.16,27.99]`; región de apoyo calibrada | **NO VERIFICADO como pose de partida**; sí verificada como referencia/resolución. Motivo: el selector activo no la emite. |
| `player_firehip` | **SÍ** con `m60` (arma de cadera, `xt['m60']=1`) tras `pAnim.update(0.016)`: `upperPose="player_firehip"`, `state="shoot"` | 54×96, asset DISPARAR | `handDom`/`handSup` de `DISPARAR`; `waistSplitActive=false` | **VERIFICADO** (activación y resolución). **NO VERIFICADA en captura de partida** por el error del juego base al cambiar de arma (§6.2). |
| `player_roll` | **SÍ**, `dodge` natural → `upper/lower player_roll`, frame CORRER | 66×96, asset CORRER | `handDom [41.94,36.37]`, `handSup [38.11,42.34]`, `noWeapon` (no dibuja arma) | **VERIFICADO** |

Poses ya verificadas y conservadas de D/D.1: `player_idle`, `player_fire`, `player_hit`, `player_death`, `player_boost`. **12/12 registros** presentes con dimensiones `(34,96) (46,96) (40,96) (46,96) (37,96) (54,96) (87,96) (54,96) (57,96) (66,96) (95,29) (79,96)`; harness `ready/hooked:true`, 8 secuencias × 1 frame, 0 errores P##/T01/T02, 10 originales preservados.

---

## 5. Transiciones y estabilidad

Secuencias ejecutadas en partida real: IDLE→CAMINAR→CORRER, CORRER→DISPARAR, DISPARAR→DISPARO_CARGADO, DISPARAR→HABILIDAD, cualquier→DAÑO, cualquier→MUERTE, además de DODGE y `floorDrop` completo.

- **Defecto reproducible y corregido:** un frame con la calibración de la pose anterior. Causa: `update()` asigna `upperPose` tras `state`. Corrección: setter `notify('upperPose')` (§2.5).
- **Medición posterior:** transiciones rápidas `idle→walk→run→shoot→charged→ability→hurt`, 34 muestras cada 28 ms, comparando `gripCheck().manoNativa` contra el valor esperado **para la pose que `gripCheck()` reporta** (no contra la pose del tick siguiente, que producía un falso positivo). Resultado: **0/34 muestras desfasadas**. Sin saltos del arma, sin referencias obsoletas, sin cambios bruscos de posición, sin desincronización estado/arma.
- **Sin retrasos artificiales ni suavizados**: solo se cambió el orden de notificación de la referencia viva.

---

## 6. Armas y combate real

### 6.1 VERIFICADO

- **1 mano (`m1911`)**: disparo normal, cargado, habilidad, movimiento con arma, daño y muerte. `gripCheck()` → `m1911 / PISTOLA / 1M / player_fire / manoNativa [43.4,25.02] / capa front / desvDisenoPx 0`. `weaponRig.selfTest ok:true`, `auditGrip {total:121, problemas:[]}`, `auditWeapons 120/120`, `statusPanel pass:true` (120 armas, 16 estados).
- **Orientación, rotación, continuidad del agarre y origen del disparo**: `aimAngle`, `facingLeft`, `muzzleWorld`, capa back/front, `footGroundY` y orden de profundidad **permanecen en `Pf()` / el motor original**; ningún cambio de D.2 los toca. 0 desvíos de diseño en `m1911`.
- **2 manos / lanza / cadera / armas HD**: auditoría geométrica contra `weaponRig.table()` (tabla §3.3), con `support`, `grip`, `lenFrac` y desviación calculados para `m16`, `c094_lanza`, `m60`, `mp40`, `winchester`, `c096_alabarda`, `c038_minigun`.
- **Recarga / cambio de arma**: `pAnim.triggerWeaponSwitch('m60','m1911')` ejecutado sin errores; el inventario real de la partida (`verifyContinuity().wallet.weapons`) es `["m1911"]`, por lo que **no había segunda arma disponible en el inventario**. Mecanismo de recarga: **NO VERIFICADO** (no se activó de forma natural ni por API disponible).

### 6.2 Bloqueo del juego base (NO atribuible a la integración)

Al cambiar de arma con `weaponRig.setWeapon()` / `equip()` durante el gameLoop aparece un error fatal del propio juego:

```
Cannot read properties of undefined (reading 'rank')   (fatal:true)
"La partida se ha detenido por un error"
```

**Prueba A/B decisiva** (misma secuencia, mismo Chromium/CDP):

| Variante | Resultado |
|---|---|
| CON `art_pack.js` + `setWeapon('m16')` | error `rank` |
| **SIN `art_pack.js`** (petición abortada) + `setWeapon('m16')` | **error `rank` idéntico** |
| CON `art_pack.js` + `equip('m16')` | error `rank` |
| CON `art_pack.js` + `organicDebug.selectWeapon('m16')` | sin error, pero **no cambia el arma** (`m1911`) |

Equipar antes de arrancar el Director no dispara el error, pero el juego **restaura `m1911`** al entrar en HUB/campaña. Conclusión: es un efecto de las APIs de depuración de armas fuera del flujo normal de inventario, **no una regresión de la integración visual**. Se descartaron 15 capturas contaminadas por ese overlay (y por la pantalla "FIN DEL DESCUENTO" de una primera pasada) y se repitió la partida completa sin cambio directo de arma.

**NO VERIFICADO por este motivo:** capturas de partida con arma de 2 manos, lanza, cadera/mano de apoyo en combate, y coincidencia visual del agarre secundario. No se simuló ningún resultado: las comprobaciones de esas armas son numéricas (`table()`) y de referencia anatómica, no capturas de partida.

---

## 7. Prueba funcional en partida (preview :8080 + Chromium/CDP)

Dos sesiones reales, `pageerror []` y `DMO.diag.errors []` en **todas** las muestras.

| Escenario | Resultado observado |
|---|---|
| HUB | `inHub:true`, `location HUB`, `IDLE / player_idle`, vidas 3, 0 errores |
| Entrada a campaña | `startCampaignFromHub(0) → true`, `inHub:false` |
| **`floorDrop` completo** | `active:true` en inicio y caída → `false` en entrada a sala; `verifyContinuity()` devuelve `running:true, dropActive:false, phase:"idle", floor:0, roomKey:"r0", player:{x:1250,y:863}, insideRoom:true, collides:false, zoomAtBase:true, zoom:0.8, hudZone:"VESTÍBULO DE TURNOS · ENTRADA SEGURA", hubLocation:"CAMPAIGN_ROOM", transitionLock:false, controlsLocked:false` + `wallet.weapons:["m1911"]` |
| Movimiento con enemigos vivos | 3 enemigos vivos (`spawnEnemyAt` ×3), `lowerPose player_walk0..3`, `CAMINAR / CORRER / DANO` |
| Disparo contra enemigos | `shoot / player_fire / DISPARAR`, `m1911`, `manoNativa [43.4,25.02]`, 0 desvío de diseño |
| Recibir daño | vidas **3 → 2 → 1 → 0** (daño de enemigos + `debug.hurt()`), `player_hit / DANO` |
| Muerte | `death / player_death / MUERTE`, 0 errores |
| Transiciones rápidas | 7 estados encadenados, 0 desfases, 0 errores |
| **Jefe** | `debug.advanceRound()` ×3 + `debug.boss()` → **`boss:true`, `bossInfo {phase:"chase", variant:"hunter", entrance:1.3, atk:2.05, hp:125, freeze:0}`, ronda 3**, captura real con barra de vida. **NO VERIFICADO** el combate prolongado contra el jefe: la captura es del instante de aparición en sala despejada. |
| Recarga / cambio natural de arma | **NO VERIFICADO** — no hay segunda arma en el inventario y el cambio directo dispara el error del §6.2. |

---

## 8. Evidencias (capturas auténticas CDP, sin composición)

Directorio `ART_EVIDENCE/tanda_03/`, 17 PNG crudos de `Page.captureScreenshot`:

| Archivo | Contenido |
|---|---|
| `fase_d2_01_HUB_real.png` | HUB real |
| `fase_d2_02_floorDrop_inicio.png` | inicio del `floorDrop` |
| `fase_d2_03_floorDrop_caida.png` | caída |
| `fase_d2_04_floorDrop_entrada.png` | entrada a sala |
| `fase_d2_05_enemigos_vivos.png` | 3 enemigos vivos + daño |
| `fase_d2_06_1mano_disparo.png` | arma 1M, disparo normal |
| `fase_d2_07_dano_real.png` | recibir daño (vidas 2→1) |
| `fase_d2_08_muerte.png` | muerte |
| `fase_d2_09_caminar_arma.png` | caminar con arma |
| `fase_d2_10_correr_arma.png` | correr con arma |
| `fase_d2_11_correr_disparar.png` | CORRER→DISPARAR |
| `fase_d2_12_cargado.png` | DISPARO_CARGADO |
| `fase_d2_13_habilidad.png` | HABILIDAD / `player_boost` |
| `fase_d2_14_dodge.png` | `player_roll` |
| `fase_d2_15_transiciones.png` | transiciones rápidas |
| `fase_d2_16_intento_jefe.png` | interludio previo al jefe (ronda 6) |
| `fase_d2_17_jefe.png` | **jefe activo** con barra de vida |

**NO VERIFICADO / NO PRESENTADO como captura de partida:** arma 2M, lanza, mano de apoyo en combate, recarga/cambio natural, combate prolongado con jefe. Motivo en §6.2 y §7. Las composiciones auxiliares (`fase_d_integracion_QA.png`, `fase_d1_estados_real.png`, `fase_d1_arma_antes_despues.png` de fases anteriores y las hojas `/tmp/*_sheet.png`) **no son capturas reales de partida** y no se usan como evidencia de juego.

---

## 9. Confirmación de preservación (reverificado tras todas las ediciones D.2)

| Comprobación | Resultado |
|---|---|
| Rama / HEAD | `arena/3f148aa7-deadbeat-disco` / `897ff85dcbd937a9458d2300a5643de094374f27` |
| `git status --short` | `M ART_PACK/art_pack.js` + 13 `??` (mismos conjuntos de fases anteriores) |
| `git diff --stat` de HTML, probe, backup, T01, T02, FASE C, informes A/B/C | **vacío** |
| `DEADBEAT_DISCO.ART.html` | SHA `f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723`, 13.381.028 B |
| probe + backup | SHA `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` (ambos) |
| `<script src="ART_PACK/art_pack.js">` | **1** única ocurrencia |
| 8 PNG FASE C | 8/8 presentes, sin regeneración; `manifest.json` 200 |
| HTTP | HTML 200, `art_pack.js` 200, manifest 200 |
| `node --check ART_PACK/art_pack.js` | OK · CJK: **0** |
| `__pycache__` | ninguno |
| commit / push | **ninguno** |

---

## 10. Cierre: VERIFICADO / NO VERIFICADO

### VERIFICADO
- `handDom` D.1 sigue funcionando (`desvDisenoPx 0`, 10 referencias vivas capturadas, `gripCheck` coherente).
- `handSup` **medida en los PNG originales, convertida al espacio nativo con la transformación de `p3Draw`, y aplicada a la referencia anatómica real que este pack controla** (`hdImages.player_fire2`, 282/290 px con alfa), sin segunda fuente de verdad, sin reutilizar `handDom` y sin inventar coordenadas. Auditada contra `weaponRig.table()` para 7 armas.
- `player_walk0..3` y `player_roll` con activación real; `player_firehip` activada con `m60`; `player_fire2` resuelta como referencia.
- Transiciones sin frames desfasados (**0/34**), sin saltos del arma ni desincronización, tras corregir el orden de `upperPose`.
- Arma 1M en combate real con orientación, agarre, capa y origen de disparo intactos; 0 desvío de diseño.
- Partida real: HUB, `floorDrop` completo con `verifyContinuity()`, 3 enemigos vivos, disparo, daño (3→0 vidas), muerte, jefe activo (`hunter`, hp 125), transiciones rápidas.
- **0 errores JavaScript nuevos** (`pageerror []`, `DMO.diag.errors []`); el error `rank` es del juego base y se reproduce **sin** `art_pack.js`.
- Preservación completa de HTML, probe, backup, T01, T02, FASE C e informes anteriores; hashes, HTTP, CJK y `node --check` correctos. Sin commit ni push.

### NO VERIFICADO (con motivo, sin simulación)
- **Coincidencia de `handSup` con la empuñadura/agarre secundario en DISPARAR**: desviación medida **14.77–16.90 px** para `m16`, `c094_lanza`, `m60`. No corregida: exigiría regenerar los PNG FASE C o modificar el arsenal/HTML, ambos prohibidos. No se falsearon coordenadas.
- **Consumo del brazo articulado `player_fire2` en este build**: 0 `drawImage` de 9 argumentos incluso con armas HD de dos manos; la mano de apoyo visible es la procedural de `it()`. La calibración está aplicada pero su efecto visual no puede afirmarse.
- **Mutación de `ANATOMY_SPINE[].handSup`**: campo sin consumos y no alcanzable sin modificar el HTML activo (prohibido).
- **Capturas de partida con arma 2M / lanza / cadera / mano de apoyo**: bloqueadas por el error fatal `rank` del juego base al usar `setWeapon`/`equip` (idéntico sin `art_pack.js`). Se descartaron las capturas contaminadas; no se presentan como reales.
- **`player_fire2` como pose de partida**: el selector activo `combatUpper` no la emite.
- **Recarga y cambio natural de arma**: sin segunda arma en el inventario (`wallet.weapons:["m1911"]`).
- **Combate prolongado contra el jefe**: solo se verificó su aparición/estado activo.
- **12/12 capturas anatómicas**: `player_roll` y `player_death` son `noWeapon` y no exponen `manoNativa` (10/12); no se forzaron.

**Conclusión:** FASE D.2 implementada y verificada en todo lo ejecutable dentro de las restricciones. El criterio de aceptación «`handSup` calibrada y comprobada para las armas que la utilizan» queda **parcialmente satisfecho**: calibración y auditoría completas, coincidencia geométrica del agarre secundario **no alcanzada** por incompatibilidad del arte FASE C con el arsenal, documentada con medición exacta y sin simulación.

**Sin commit ni push.**
