# INVENTARIO DE ASSETS — DEADBEAT DISCO (Fase 1)

> Auditoría completa de recursos **externos y embebidos** previa a cualquier sustitución.
> Datos máquina por recurso: `ART_AUDIT/asset_inventory.json` (300 filas, una por URI `data:`).
> Paletas del motor: `ART_AUDIT/circle_themes.json`. Muestras de las referencias: `ART_AUDIT/reference_palette.json`, `ART_AUDIT/reference_accents.json`.

## 1. Alcance y método

- Fuente: `v9_t3_fase1b_cache_probe.html`, 13.380.910 B, SHA-256 `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a`.
- Método: extracción de todas las URIs `data:` por bloque (`<script>` / `<style>`), resolución de la clave del objeto literal o del selector CSS, **decodificación real** con Pillow (dimensiones, modo, canal alfa, píxeles transparentes/parciales/opacos), SHA-256 del binario y conteo de referencias en código fuera de la propia definición.
- **No hay archivos externos de imagen**: 0 `fetch`/XHR/`import()`/`Worker`/`@import`/`<link>`. Todo el arte raster está embebido. La fuente tipográfica Pixelify Sans también lo está.

## 2. Resultado global

| Métrica | Valor |
|---|---|
| URIs `data:` totales | **300** |
| PNG | 181 |
| WebP | 118 |
| TTF (`@font-face`) | 1 |
| Errores de decodificación | **0** |
| Imágenes con transparencia real | **277** |
| Bloques `<script>` con datos | 4 |
| Bloques `<style>` con datos | 3 |

### Distribución por bundle / sistema de carga

| Bundle | Nº | Formato | Dimensiones típicas | Sistema de carga real | Consumidores |
|---|---|---|---|---|---|
| `window.__T3B_IMAGES[]` | 10 | WebP RGB 512×512 | 512×512 (tile) | `window.__T3B.reload(i)` → `new Image()` + `__DDM_PAINT_MATERIAL(ctx, idx, …)` | Pintor de suelos HUB (1920×1320) y campaña (2500×1850) |
| `window.__ILT_DATA{}` | 11 | PNG RGBA 400×386 … | 400×386, 384×384 | `DMO_ILT.images[key]` / `ready` / `meta`; `ILT.art(key)` | `SPRITE_MAP` (6 enemigos) y `BOSS_MAP` (jefes/residentes) |
| `window.__HD_DATA{}` | 163 | PNG RGBA | 160×39…160×87 (armas), 56×96 (jugador), pickups, bosses 05–09 | `window.__HD_GET(key)` → `__HD_EXTRA` cache; `new Image()` en `Pf`; `hdImages` en `ensureHdImg`; `<img>` en HUB/arsenal | Sprites de armas, jugador, pickups, jefes secretos, miniaturas del arsenal |
| `DDM_V5_ASSET_DATA{}` (inline) | 100 | WebP RGBA | 148×102 … 720×392 | `new Image()` → `window.__DDM_V5_IMG[key]`; lectura por `__DDM_GET_V5(key)` | Decoración HUB/campaña, puertas, escenarios, medallones, props |
| `INLINE_JS` (otros data URIs del script grande) | 13 | PNG / WebP | 384×384, variado | Asignaciones directas dentro del IIFE principal | Fondos y capas auxiliares (claves anónimas, inventariadas por offset) |
| `CSS` | 3 | WebP / TTF | 704×384, 860×104 | `background` / `background-image` / `src` del navegador | `#overlay`, `#game-title`, fuente Pixelify |
| Scripts Cloudflare | 2 scripts / 2 iframes | — | — | Intactos; 2×404 y 2 console errors por carga | **No eliminar ni modificar** |

### Otros hechos del análisis estático (Fase 0.1)

13.371.929 caracteres, 19.835 líneas, 12 `<script>` (10 compilan), 31 `<style>`, 4 canvas estáticos, 269 ids, 9 SVG.

## 3. Clasificación A–E

| Clase | Definición | Aplicación en esta auditoría |
|---|---|---|
| **A · CONSERVAR** | Correcto, integrado, sin motivo para cambiar | 286 recursos embebidos no seleccionados en la Tanda 01 (incluye 160 armas HD, 96 props V5, 7 materiales T3B, 10 ILT, CSS y fuente). **No se eliminan ni se sustituyen.** |
| **B · MEJORAR** | Integrado pero mejorable sin cambiar ID/dimensiones | Los 8 recursos objetivo de la Tanda 01 se tratan como **C** (sustitución controlada) porque se dispone de reemplazo de mayor coherencia con la biblia. |
| **C · SUSTITUIR** | Se sustituye el binario conservando clave, dimensiones, pivote y loader | `t3b_material_00/01/02`, `hub_fox_crest_emblem`, `decor_neon_rug`, `decor_potted_palm`, `boss_01_anden`, `weapons/weapon_m1911.png` (8) |
| **D · CREAR** | No existe y el motor lo necesita | Arquitectura modular, protagonista orientable, direcciones/animaciones faltantes, HUD y transiciones → **tandas futuras**. Registrado en `ASSET_REPLACEMENT_PLAN.md`. |
| **E · RETIRAR** | Solo si se demuestra obsolescencia **y** ausencia de dependencias | **Ningún recurso se retira.** Los 13 `INLINE_JS` anónimos tienen uso dentro del IIFE y no se ha demostrado su obsolescencia; no se eliminan por intuición. |

> «Existencia de archivo» ≠ «integración correcta». La integración se comprueba en runtime con `DMO_ART_PACK.integrity()` y `__T3B.draws` (ver `VISUAL_QA_REPORT.md`).

## 4. Dependencias asset ↔ código

| Recurso | Depende de | Si falta |
|---|---|---|
| Materiales T3B | `__T3B.enabled`, `api.images[i]`, `__DDM_PAINT_MATERIAL` | El pintor cae al `original` procedural (`choice:'original'`) |
| Sprites ILT | `DMO_ILT.ready[key]`, `meta[key].aspect`, `SPRITE_MAP`/`BOSS_MAP` | `ILT.art()` devuelve `null` → fallback de dibujo |
| Armas HD | `__HD_DATA[hdKey]`, `__HD_EXTRA`, `hdImages`, `hasSprite` | Miniatura del arsenal ausente; el arma sigue funcionando |
| Props V5 | `__DDM_V5_IMG[key]` con `complete && naturalWidth>0` | `__DDM_GET_V5()` devuelve `null` → se dibuja la forma procedural |
| CSS/fuente | Selectores `#overlay`, `#game-title`, `@font-face` | Degradación visual del menú, sin efecto en mecánicas |

**Conclusión:** los cuatro registros son sustituibles en caliente sin tocar geometría, colisiones, IA, Director, combate, guardado ni transiciones. Es la vía usada por `ART_PACK/art_pack.js`.

## 5. Per-asset (Tanda 01)

Datos completos — identificador, tipo, dimensiones, formato, transparencia, uso actual, referencias en código, sistema de carga, estado visual, estado funcional, dependencias, problemas y decisión — en `ART_ASSETS/tanda_01/manifest.json` y en `ART_PRODUCTION_LOG.md`. Resumen:

| ID | Tipo | Dimensiones | Formato | Alpha | Uso | Loader | Decisión |
|---|---|---|---|---|---|---|---|
| `t3b_material_00` | suelo | 512×512 | PNG RGB | no (opaco, correcto para tile) | campaña `r0` | `__T3B.reload(0)` | C |
| `t3b_material_01` | suelo | 512×512 | PNG RGB | no | HUB | `__T3B.reload(1)` | C |
| `t3b_material_02` | suelo | 512×512 | PNG RGB | no | salas doradas | `__T3B.reload(2)` | C |
| `hub_fox_crest_emblem` | emblema | 560×332 | PNG RGBA | sí | HUB, medallón central | `__DDM_V5_IMG` | C |
| `decor_neon_rug` | prop isométrico | 456×243 | PNG RGBA | sí | decoración | `__DDM_V5_IMG` | C |
| `decor_potted_palm` | prop | 209×147 | PNG RGBA | sí | decoración | `__DDM_V5_IMG` | C |
| `boss_01_anden` | jefe | 400×386 | PNG RGBA | sí | `BOSS_MAP` | `DMO_ILT.images` | C |
| `weapons/weapon_m1911.png` | arma | 160×87 | PNG RGBA | sí | arsenal / HUD | `__HD_DATA` + `__HD_EXTRA` | C |

Las dimensiones finales **son exactamente las del recurso original** para no alterar escala, patrones (`%512`), `meta.aspect` ni miniaturas. Pivotes: `tile` en suelos, `bottom-center` en props/jefe, `center` en emblema/arma.

## 6. Limitaciones de la auditoría

- Las 13 URIs `INLINE_JS` no tienen clave legible: se identifican por offset en el HTML y se conservan; su consumidor exacto no se ha mapeado uno a uno → **PARCIALMENTE VERIFICADO**.
- `codeRefs=0` en `__HD_DATA` y `__T3B_IMAGES` no significa «sin uso»: el código construye las claves dinámicamente (`"weapons/weapon_"+wid+".png"`) o accede por índice. Se verificó leyendo los consumidores, no solo contando literales.
- El estado visual de los 286 recursos no seleccionados se ha revisado por decodificación, **no** uno a uno en pantalla → **PARCIALMENTE VERIFICADO**.

---

## 7. HUB · Tanda 01 (añadido 2026-11-03)

Nueva familia externa de 10 PNG en `ART_ASSETS/hub/tanda_01/` con sus 10 fuentes en `_source/` y manifiesto máquina `manifest.json` (SHA-256, bytes, dimensiones, modo, alfa, cobertura, bordes, halo, slot, loader, clasificación, rol, caja de dibujo, anclaje y preparación). Se suma a las 300 URIs `data:` auditadas en las secciones anteriores; **no se eliminó ni sustituyó ningún recurso embebido**: los originales se conservan en `ORIGINALS` / `HUB_ORIGINALS` dentro de `ART_PACK/art_pack.js` y se pueden restaurar con `hubRestore()` / `restoreArch()`.

| ID | Final | Dimensiones | Modo | Slot | Clasificación |
|---|---|---|---|---|---|
| HUB-01 | `hub_01_suelo_central.png` | 512×512 | RGB | `t3b_material_01` | Arquitectónico / Funcional |
| HUB-02 | `hub_02_pista_central.png` | 760×430 | RGBA | `hub_pista_medallion` | Decorativo |
| HUB-03 | `hub_03_paredes.png` | 120×176 | RGBA | `wall_stained_glass_arch` | Arquitectónico |
| HUB-04 | `hub_04_cabina_dj.png` | 720×392 | RGBA | `hub_dj_shrine` | Interactivo |
| HUB-05 | `hub_05_barra_bebidas.png` | 380×313 | RGBA | `hub_bar_shrine` | Interactivo |
| HUB-06 | `hub_06_columnas.png` | 76×148 | RGBA | `club_speaker_tower_prop` | Arquitectónico |
| HUB-07 | `hub_07_sofas_asientos.png` | 224×172 | RGBA | `hub_vip_booth_nw` + `_ne` | Decorativo |
| HUB-08 | `hub_08_luminarias_neones.png` | 67×152 | RGBA | `hub_disco_chandelier` | Funcional / Decorativo |
| HUB-09 | `hub_09_puertas_accesos.png` | 320×175 | RGBA | `hub_abyss_stair_crack` | Interactivo / Funcional |
| HUB-10 | `hub_10_decoracion_ambiental.png` | 167×136 | RGBA | `hub_trophy_board_prop` | Decorativo |

Evidencias: `ART_EVIDENCE/hub/tanda_01/`. Informe: `ART_TANDA_01_HUB_REPORT.md`. Hashes del cambio: `ART_EVIDENCE/hub/tanda_01/hashes.json`.

---

## 8. HUB · Tanda 02 (añadido 2026-11-03)

Inventario de necesidades previo: `ART_AUDIT/hub_tanda_02_needs_inventory.json` (6 clases + `INTERACTIVO` superimpuesta). Auditoría visual: `ART_HUB_TANDA_02_AUDIT.md` con 10 capturas `audit_*.png` y `audit_runtime.json` (21 slots dibujados en el HUB, 118 claves V5, 6 zonas, 11 estaciones). Dimensiones **medidas** en el registro V5 del HUB, no estimadas.

| ID | Archivo final | Dimensiones | Modo | Slot V5 | Función / ubicación | Clase |
|---|---|---|---|---|---|---|
| T02-01 | `hub_t02_01_arcade.png` | 264×239 | RGBA | `hub_arcade_shrine` | Recreativas, zona F1 (655,1210) | 2 + 5 |
| T02-02 | `hub_t02_02_arsenal.png` | 360×253 | RGBA | `hub_arsenal_shrine` | Arsenal, zona D (590,845) | 2 + 5 |
| T02-03 | `hub_t02_03_seals.png` | 244×237 | RGBA | `hub_seals_shrine` | Espejo de Sellos, zona F2 (1845,1210) | 2 + 5 |
| T02-04 | `hub_t02_04_vending.png` | 100×152 | RGBA | `club_vending_machine_prop` | Expendedora este (2048,692), compartida | 2 |
| T02-05 | `hub_t02_05_cooler.png` | 61×136 | RGBA | `club_water_cooler_prop` | Dispensador oeste (452,692), compartida | 2 |
| T02-06 | `hub_t02_06_bench.png` | 256×198 | RGBA | `limbo_bench_prop` | Bancos del descenso (1037,1178) | 2 |
| T02-07 | `hub_t02_07_planter.png` | 96×108 | RGBA | `club_neon_planter_prop` | 4 jardineras (966,614), compartida | 2 |
| T02-08 | `hub_t02_08_liftpad.png` | 198×104 | RGBA | `descent_abyssal_lift_pad` | Plataforma de descenso, puertas de sala | 2 + 5 |
| T02-09 | `hub_t02_09_ceiling_fixture.png` | 148×38 | RGBA | `wall_ceiling_neon_fixture` | Neón horizontal de techo/muro, capa cacheada | 2 |
| T02-10 | `hub_t02_10_sconce.png` | 48×60 | RGBA | `club_wall_sconce_side` | Aplique lateral, capa de aristas cacheada | 2 |

Cada fila tiene en `ART_ASSETS/hub/tanda_02/manifest.json`: fuente original (`_source/`), SHA-256, caja medida, anclaje, pivote, escala, clasificación, rol, transparencia, bordes y halo. T02-04 documenta `sourceCrop=[510,0,925,768]` para aislar una expendedora sin modificar la fuente.

**Conservación:** los 10 assets, 10 fuentes, el manifiesto y las evidencias de la TANDA 01 permanecen intactos; no se movió ni renombró ningún archivo anterior. Integración en `ART_PACK/art_pack.js` (único archivo de código modificado). Evidencias: `ART_EVIDENCE/hub/tanda_02/`. Informe: `ART_TANDA_02_HUB_REPORT.md`. Hashes de la entrega: `ART_EVIDENCE/hub/tanda_02/hashes.json`.

---

## HUB · TANDA 03 — Inventario (8 unidades / 13 PNG finales)

Ruta: `ART_ASSETS/hub/tanda_03/<carpeta>/{source,final}/`. Manifiesto: `ART_ASSETS/hub/tanda_03/manifest.json` con dimensiones y SHA-256 **medidos**, clasificación, rol, rectángulo mundo, anclaje, pivote, escala, transparencia y **estado de integración**.

| ID | Unidad | Finales | Dimensiones reales | Slot / sistema | Estado |
|---|---|---|---|---|---|
| T03-01 | `HUB_FLOOR_PATCH_O` | `hub_floor_patch_o.png` | 580×430 | `__T3B_HUB_QA` suelo 1920×1320 en (290,265), caja `[290,720,580,430]` | BLOQUEADO (sin slot) |
| T03-02 | `HUB_FLOOR_PATCH_E` | `hub_floor_patch_e.png` | 580×430 | caja `[1630,720,580,430]` | BLOQUEADO (sin slot) |
| T03-03 | `HUB_FLOOR_PATCH_S_CRACK` | `hub_floor_patch_s_crack.png` | 760×329 | grieta `[1085,1256,330,180]`, borde sur 1585 | BLOQUEADO (sin slot) |
| T03-04 | `HUB_FLOOR_NORTH_DJ` | `hub_floor_north_dj.png` | 760×224 | DJ `[1058,280,384,209]` | BLOQUEADO (sin slot) |
| T03-05 | `HUB_PLANTER_VARIANT_02` | `hub_planter_variant_02.png` | 96×108 | natural de `club_neon_planter_prop` (T02) | BLOQUEADO (sin 2.º slot) |
| T03-06 | `HUB_BENCH_VARIANT_02` | `hub_bench_variant_02.png` | 256×198 | natural de `limbo_bench_prop` (T02) | BLOQUEADO (sin 2.º slot) |
| T03-07 | `HUB_VIP_BOOTH_LOUNGE` | `hub_vip_booth_lounge.png` | 216×136 | `hub_vip_booth_lounge`, caja real 108×68 ×4 en `d.menu` del MENÚ | BLOQUEADO (renderer inactivo, D-07) |
| T03-08 | `HUB_ZONE_SIGNAGE` | 6 × `hub_zone_signage_{a..f}_*.png` | 192×128 c/u | sin slot V5 declarado explícitamente | BLOQUEADO (sin slot) |

Todos se cargan con `load()` y se registran en `window.__DDM_V5_IMG` con alias `h03_*` trazables (más `hub_vip_booth_lounge`). **Registro ≠ integración**: 8/8 unidades están `BLOQUEADO` para render y `NO VERIFICADO` para visibilidad en producción. 13/13 `exactSize`, RGBA, esquinas transparentes, halo ≤ 0,11 %. Las 8 fuentes originales se conservan íntegras. Hashes de entrega: `ART_EVIDENCE/hub/tanda_03/hashes.json` (152 entradas, 0 discrepancias). Capturas individuales: `ART_EVIDENCE/hub/tanda_03/asset_01…13_*.png` y `hoja_recursos_tanda_03.jpg` (**evidencia de archivo, no in-game**).

**Conservación:** TANDA 01 y TANDA 02 (21 archivos por tanda, 10 fuentes y 10 finales cada una), HTML activo y backups intactos. Único archivo de código modificado: `ART_PACK/art_pack.js`.
