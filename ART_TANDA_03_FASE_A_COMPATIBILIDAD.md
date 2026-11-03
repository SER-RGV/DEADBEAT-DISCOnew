# Tanda 03 · FASE A · Compatibilidad conceptual con el motor real

**Estado:** análisis estático. **No se ha modificado el render, el HTML ni ninguna mecánica.**
**Fuente:** `ART_AUDIT/player_render_audit.json` (auditoría estática de `DEADBEAT_DISCO.ART.html`, 13.381.028 B, SHA `f231cfc7…723`) + medición de los 4 PNG de `ART_ASSETS/tanda_03/`.
**Advertencia:** todo lo marcado **NO VERIFICADO** requiere ejecutar el juego real en fases posteriores; la existencia de PNG nunca se usa aquí como prueba de funcionamiento.

---

## 1. Corrección del diagnóstico previo

El protagonista **no** se dibuja solo de forma procedural por `aimAngle`. El pipeline es **híbrido**:

- fallback `Yb()` con atlas pixel legacy (`d.version='2.83.0-pixel'`, rects 48×56);
- módulo v3.2 *ORGANIC UPGRADE* `Pf()` con **10 sprites HD reales** `player/*.png` cargados por `ensureHdImg()` desde `window.__HD_DATA`, más `PLAYER_ASSET_MAP` (12 poses; faltan `player_fire2.png` y `player_firehip.png`);
- `ANATOMY_SPINE` para pivotes y manos, `waist-split` (piernas de `player_walk0..3` en `y=53..96` + torso del `upperPose` en `y=0..53`), `squashX/squashY`, `turnLean`, `bobY`, `deathT`;
- `DMO.playerAnim` / `pAnim` y `STATE_PRIORITIES` con 16 estados reales.

`playerSkinChanged:false` y `collisionContract:"original"` son **flags de `audit()`** del módulo `7.6.0-87-assets-complete`, no un gestor de skins ni una API de colisión. No existen `DMO_PLAYER`, `animFrame`, `frameT`, `spriteSheet` ni `PLAYER_SPRITE`: **no se inventan APIs y no se crea un segundo sistema de animación**.

---

## 2. Comparativa punto por punto

| Aspecto | Motor real (VERIFICADO estático) | Diseño maestro FASE A | Compatibilidad |
|---|---|---|---|
| **Escala** | `canonH = 95` px; `scaleY = 95/96 = 0,9896`; zoom de cámara ~1,16 → ~110 px en pantalla (estimación estática) | Lámina 364×1130 px, ilustración HD | **Conceptualmente compatible** por reescalado uniforme. **NO VERIFICADO en ejecución.** |
| **Dimensiones de representación** | idle 36×96, walk 54/46/55/42×96, shoot 56×96, hurt 52×96, roll 66×96, boost 74×96, death WebP dibujado 95×29 | 364×1130 (maestra), 363×1122, 233×1128, 367×1195 | A `96/1130 = 0,085`, la maestra daría **≈31 px de ancho**, dentro del slot idle de 36 px. Los slots de disparo/rodar/boost (56–74 px) dejan margen para brazos extendidos. **Riesgo:** a 31 px de ancho el detalle de los tatuajes ornamentales se pierde; requiere una versión simplificada, no un simple `resize`. **NO VERIFICADO.** |
| **Punto de apoyo de pies** | `footGroundY = 0,9*ye.r + pAnim.bobY = 12,6 + bobY`; `dy = -canonH + footGroundY`; pies en `footY = 95` (nativo 96) | Fila de apoyo `y=1125` de 1130 → 5 px del borde inferior | Al escalar, el apoyo queda a ~0,4 px del borde: **coherente con `footY=95`**. El pie retrasado está ligeramente más alto, coherente con 3/4 isométrica. **NO VERIFICADO en ejecución.** |
| **Pivote** | `g.translate(ye.x, ye.y)`; `dx = -ANATOMY_SPINE[pose].spineX * scaleY`; idle `spineX=17,2`, `waistX=17,4`; `handDom=[32,5,53]`, `handSup=[8,53]` | Pivote propuesto **bottom-center** (`x=w/2`, `y=h`), registrado en `manifest.json` | **Conflicto pendiente:** el motor pivotta por `spineX`, no por centro geométrico, y `organicHandFrame()` calcula `muzzleWorld` desde `handDom`. Un sprite de 31 px con las manos en otra posición obligaría a recalcular `ANATOMY_SPINE` por pose o a dibujar las poses con las manos en las coordenadas esperadas. **NO VERIFICADO. No se toca nada en FASE A.** |
| **Orientación** | `ye.aimAngle` **continuo** (81 refs); `facingLeft = Math.cos(aimA) < 0` → `g.scale(-1,1)`; el arma rota con `g.rotate(aimA)`. **No hay 8 orientaciones discretas**: solo 2 espejos | Maestra 3/4 sur-este + frontal 3/4 + perfil + posterior | **Incompatibilidad estructural con el objetivo final de 8 orientaciones.** Ver §3. **NO VERIFICADO.** |
| **Relación con armas** | Sistema **independiente**: `it("back")` / `it("front")`, `g.translate(0,-0,55*canonH)`, `g.rotate(aimA)`, `organicWeaponMetrics(wid,95)`, `organicHandFrame()`, `muzzleWorld`, `wo()` | Manos vacías, **ningún arma dibujada** en las 4 láminas | **Compatible**: el diseño respeta que el motor superpone el arma. **NO VERIFICADO** que las manos del nuevo diseño coincidan con `handDom/handSup` al escalar. |
| **Orden de profundidad** | El arma "back" se dibuja antes del sprite y la "front" después; el jugador se ordena por `sortY` dentro de `Qf()`/`Bg()` | Sin arma, sin sombra proyectada ni plano de suelo | **Compatible**: no se añade ningún elemento que altere el orden. **NO VERIFICADO en ejecución.** |
| **Cámara** | Isométrica, zoom ~1,16; `ye={x:1250,y:925,r:14,...}`; la arquitectura T01/T02 usa la misma cámara | Vista 3/4 isométrica sur-este con luz del noroeste | **Conceptualmente compatible** con suelos/muros/arquitectura nuevos. **NO VERIFICADO en ejecución**: no se ha abierto el juego ni se han tomado capturas en FASE A. |
| **Skins / sustitución** | `ensureHdImg(key,path)` lee `window.__HD_DATA[path]`; `__HD_GET(e)` consulta **primero** `window.__HD_EXTRA[e]` (misma interfaz que usó Tanda 01 para `weapons/weapon_m1911.png`); `hdImages[key]` es la caché | 4 láminas RGBA con alfa, sin fondo incrustado | **Existe una interfaz de sustitución real**, ver §3. **NO VERIFICADO** que baste para 8 orientaciones sin tocar `Pf()`. |

---

## 3. Estrategia de sustitución (conceptual, **no ejecutada**)

Orden de preferencia, de menor a mayor invasividad:

1. **Sustitución de bitmaps por la interfaz existente.** Poblar `window.__HD_DATA['player/player_*.png']` / `window.__HD_EXTRA[clave]` con los sprites derivados del diseño maestro, manteniendo `PLAYER_ASSET_MAP`, `ANATOMY_SPINE`, `pAnim` y `STATE_PRIORITIES` intactos. Es el mismo patrón ya validado en T01/T02. No crea loader, script, canvas ni sistema de animación nuevo. No cambia combate, controles, colisiones, HUD, IA, Director, progresión ni guardado.
2. **Selección de variante por ángulo.** Para las 8 orientaciones de la FASE B, el candidato conceptual es discretizar `aimAngle` continuo en 8 sectores y elegir la variante de sprite correspondiente **dentro del mismo `Pf()`**, conservando `facingLeft` y `g.rotate(aimA)` para el arma. Esto es **una decisión de selección de imagen, no un segundo controlador de animación**. Requiere validar en FASE D que no rompe `waist-split`, `bobY`, `squash`, `deathT` ni los afterimages de `floorDrop`.
3. **Recalibración de `ANATOMY_SPINE`.** Solo si las manos/pies del nuevo diseño no coinciden con `handDom`/`handSup`/`footY`. Debe hacerse por pose y sin tocar la lógica de disparo (`muzzleWorld` depende de esos valores).

**Límites que se respetan:** máximo **10 assets finales por tanda**; no se generan 8 orientaciones ni animaciones en FASE A; no se sustituye el controlador de animaciones; no se modifica `DEADBEAT_DISCO.ART.html`, su backup ni `main`; no se regeneran T01/T02.

**Riesgos abiertos (NO VERIFICADO):**
- legibilidad de tatuajes y mechones a 31–74 px de ancho;
- coincidencia de manos con `handDom=[32,5,53]` y del arma superpuesta;
- comportamiento de `waist-split` (`splitY=53`) con un torso y unas piernas rediseñados por separado;
- orden de profundidad real y `sortY` en salas con enemigos/proyectiles;
- paridad de escala con zoom de cámara y con el radio de colisión `ye.r=14`;
- impacto, muerte, mando y movimiento diagonal.

---

## 4. Separación estricta de evidencia

**VERIFICADO (estático / ficheros)**
- Integridad del HTML activo y del backup (SHA sin cambios).
- Existencia y dimensiones de los 10 slots HD y de los 12 mappings; 2 slots ausentes.
- Fórmulas de pivote, pies, escala, `waist-split` y prioridades de estado, leídas del HTML.
- Existencia de `__HD_DATA` / `__HD_EXTRA` como interfaz de sustitución.
- Las 4 láminas son RGBA con alfa 0–255, fondo eliminado, 0 halos, interior del personaje conservado (QA por puntos de control en `manifest.json`).
- El sprite idle actual (`player_idle_00.png`, 36×96) es un personaje de **camisa azul clara sin tatuajes visibles**: el rediseño es necesario, no un retoque.

**NO VERIFICADO (requiere juego real en fases posteriores)**
- Cualquier comportamiento en ejecución: escala en pantalla, pivote, apoyo de pies, orientación por movimiento, cambio de animación, continuidad de fotogramas, profundidad, armas, impactos, muerte, mando.
- Compatibilidad de las 8 orientaciones con un motor que solo tiene 2 espejos.
- Que `__HD_EXTRA` baste sin tocar `Pf()`.
- Rendimiento, capturas y logs de juego (no se han generado en FASE A).

---

**Conclusión:** el diseño maestro es **conceptualmente compatible** con la cámara isométrica, el sistema de armas independiente, el orden de profundidad y la interfaz de sustitución de bitmaps del motor. La **orientación en 8 direcciones** y la **coincidencia de manos/pivote** son los dos puntos que el diseño actual del motor no garantiza y que deberán resolverse, tras aprobación, en las FASES B–D sin crear un segundo sistema de animación ni alterar la lógica de combate.
