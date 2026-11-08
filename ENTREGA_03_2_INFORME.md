# ENTREGA 03.2 — INTEGRACIÓN CONTROLADA DEL MENÚ PRINCIPAL
## Variante A «EL CENTRO DEL BUCLE» en la build real de DEADBEAT DISCO

- **Rama:** `arena/entrega-03-2-menu-centro-bucle`
- **Base:** `main` @ `250ee38c13b0f7598eb40b7bac99fedba47a2917` (merge de PR #9)
- **Fecha:** 2026-11-08
- **Alcance:** integrar en el menú principal real la dirección aprobada **A** de ENTREGA 03/03.1. **No es un rediseño.** Las variantes B y C quedan explícitamente excluidas.
- **Estado final:** PASS (§19). Batería FASE 01 sobre la build final: **141/141 PASS** (§11/§18). Pendiente únicamente: revisión humana del PR (no se fusiona desde aquí).

---

## 1. Resumen ejecutivo

La variante aprobada **A — EL CENTRO DEL BUCLE** se integra en el menú principal real sustituyendo **únicamente** la imagen de fondo del menú (`#dd-menu-backdrop`) por un asset maestro regenerado a 2560×1440 (`assets/ui/menu_main_backdrop_a.jpg`), servido por un **nuevo identificador de manifiesto** (`menu_main_backdrop_a`). El asset original `assets/ui/menu_main_backdrop.png` **no se toca** y sigue sirviendo como fallback (además de conservarse para su uso previo en la cinemática de intro).

La interfaz del menú (logo, tagline, opciones, indicadores, hints, layout, tipografía, estados de selección, animaciones) queda **exactamente como estaba**. No se añaden capas, partículas, paralaje ni animaciones nuevas. La integración reutiliza el sistema de fondo existente (única `<img>` + CSS drift/atmos/vig existentes).

**Estado: PASS.** Verificado en este informe: captura real del menú en 5 resoluciones, navegación completa (opciones, créditos, ranuras, transición a partida), fallback ante asset ausente (probado por red bloqueada en QA), batería FASE 01 re-ejecutada sobre la build reconstruida (**141/141 PASS**).

## 2. Estado inicial del repositorio

| Dato | Valor |
|---|---|
| Worktree | `/home/user/entrega3-2-menu` (nuevo `git worktree`, creado limpio para esta entrega) |
| Rama | `arena/entrega-03-2-menu-centro-bucle` (creada desde `main`) |
| Base | `main` @ `250ee38` (verificado: `git merge-base HEAD main` = `250ee38…`) |
| Estado inicial | **limpio** (`git status --short` vacío) |
| `main` | intacto (`git rev-parse main` = `250ee38` al abrir la entrega) |
| PR #10 | intacto (sin relación con esta rama; nunca se toca) |

## 3. Rama y base

Se crea `arena/entrega-03-2-menu-centro-bucle` desde `main` en un **worktree independiente** (`/home/user/entrega3-2-menu`) para no interferir con el árbol principal ni con las entregas anteriores (el worktree de ENTREGA 03.1 vive aparte, en `/home/user/entrega3-menu-mockups`, y no se modifica).

## 4. Archivos examinados (auditoría previa)

- `index.html` y `DEADBEAT_DISCO.html` — confirmados **byte-idénticos** (5 363 157 B antes de esta entrega; reconstruidos con esta entrega). Build monolítica: **no carga ningún `src/*.js` externo** en runtime; todo el código va inline.
- `tools/build_active_html.py` — reconstructor determinista: parte de
  `backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html`, elimina el challenge de Cloudflare, inlines CSS + 6 módulos (`dd_boot`, `dd_asset_registry`, `dd_world_renderer`, `dd_hub_system`, `dd_cinematic_camera`, `dd_ui_system`), instala guards y **reescribe ambos HTML**. Es el único camino legítimo: editar `src/*` y reconstruir.
- `src/dd_ui_system.js` — dos únicos call sites del backdrop del menú:
  - `buildMainMenu()` (~línea 124): `<img id="dd-menu-backdrop" …>`.
  - `refreshAssets()` (~línea 1215): reasigna `src` sobre el mismo `<img>`.
- `src/dd_asset_registry.js` — constante `MANIFEST` inline (una línea) con `entries` (registro) y `byOriginalId` (alias legacy). Incluye `totalRegistered`/`totalPlanned` declarados.
- `assets/manifest.json` — espejo auditable del registro (mismos datos en JSON legible).
- `src/dd_boot.js` (~línea 303) — preload/existencia: `logo_deadbeat_graffiti`, `emblem_fox_crown`, `menu_main_backdrop`, `cine_intro_club_panorama` (+ `assets/fase01/menu_backdrop_2k.webp`). **Intocable en esta entrega** (ver §7.4).
- `src/dd_cinematic_camera.js` (~línea 296) — `DD_ASSETS.get("menu_main_backdrop")` actúa como **fallback de panorama de la cinemática de intro** (el principal es `cine_intro_club_panorama`). Conclusión: **nunca** se toca el id `menu_main_backdrop`; la integración va por un id nuevo.
- `src/dd_rebuild_ui.css` — `#dd-menu-backdrop` (`object-fit: cover`, `object-position: 50% 46%`, escala ≈1.06 + drift existente de ~46 s), `.dd-menu-atmos`, `.dd-menu-vig`, `.dd-menu-left`. **Sin cambios**: se conserva la composición y la viñeta que garantizan la legibilidad de la UI.
- `assets/fase01/menu_backdrop_2k.webp` — derivado 2K preexistente (FASE_01), solo precargado por `dd_boot` como chequeo de existencia; **no se muestra en el menú**. No se modifica.
- ENTREGA 03.1 (`/home/user/entrega3-menu-mockups`): `variante_a_clean.png` (1920×1080, arte aprobado), `src/variante_a.html` + `variants.css` (fuente de la composición), `ENTREGA_03_1_REFINAMIENTO.md`. Verificado: una captura fresca de `variante_a.html` a dsf=1 es **píxel-idéntica** (compare RMSE = 0) a `variante_a_clean.png` → la composición es el generador del arte aprobado.
- `tools/fase01_qa/{run.sh, lib.js, suite.js}` — arnés de regresión FASE 01 (84 PASS históricos).
- `FASE_01_INFORME_FINAL.md` — histórico de la suite y límites conocidos del entorno (sin GPU; compositor por software).

## 5. Archivos modificados / añadidos / preservados

### 5.1 Añadidos
- `assets/ui/menu_main_backdrop_a.jpg` — backdrop maestro del menú, **2560×1440**, JPEG calidad 90, **670 812 B** (sha256 `f3c7dd4ee24adf2d4f1e7c0272bdbceb9a7618d32c8b233e8a50946d2dc04c4b`; sha16 `f3c7dd4ee24adf2d`).
- `docs/ENTREGA_03_2_EVIDENCE/` — 16 capturas en JPEG (menú real antes/después en 5 resoluciones + flujo de navegación + fallback). ~3,1 MB.
- `ENTREGA_03_2_INFORME.md` — este informe.

### 5.2 Modificados (cambio mínimo)
| Archivo | Cambio |
|---|---|
| `src/dd_ui_system.js` | **2 call sites**: `assetSrc("menu_main_backdrop")` → `assetSrc("menu_main_backdrop_a")` (fallback `assets/ui/menu_main_backdrop_a.jpg`). Además, el `<img id="dd-menu-backdrop">` gana `onerror="this.onerror=null;this.src='assets/ui/menu_main_backdrop.png'"` (fallback al PNG original, ver §13.1). **Nada más.** |
| `src/dd_asset_registry.js` | Nueva entrada `menu_main_backdrop_a` (ver §6), alias `entrega-03-2:menu-centro-bucle` → id nuevo en `byOriginalId`, `totalRegistered` 225 → 226. **El registro original `menu_main_backdrop` (ddc-img) queda byte-idéntico.** |
| `assets/manifest.json` | Espejo auditable del registro: misma entrada nueva, mismo alias, `totalRegistered` 226. JSON validado tras la edición. |
| `index.html`, `DEADBEAT_DISCO.html` | Reconstruidos con `tools/build_active_html.py` (determinista). Diff efectivo respecto a la versión anterior: **solo las 3 líneas** que inlines llevan de los archivos fuente anteriores (2 call sites del backdrop + entrada del registro). |

### 5.3 Preservados (no tocados — verificable con `git diff --stat`)
- `assets/ui/menu_main_backdrop.png` (original, 1280×720, 690 634 B) — intacto.
- `assets/fase01/menu_backdrop_2k.webp` — intacto (preload de boot).
- `src/dd_boot.js`, `src/dd_cinematic_camera.js` — intactos. Regla de alcance: la cinemática de intro es intocable.
- `src/dd_rebuild_ui.css` — intacto (objeto `cover`, viñeta, atmos, drift).
- Interfaz del menú, opciones, créditos, ranuras, sliders de ENTREGA 02, audio, guardado, progresión, DJ identity (DJ Virgilio), combate, DD_BOOT, DD_CINE: **cero cambios**.
- Variantes B y C de ENTREGA 03/03.1: **no incorporadas** (ni como asset, ni como referencia, ni como "mejora").
- Worktree de ENTREGA 03.1 (`/home/user/entrega3-menu-mockups`) y PR #10: intactos.

## 6. Activos usados y procedencia

**Asset integrado (nuevo, aprobado):** `docs/ENTREGA_03_1_REFINAMIENTO/variante_a_clean.png` (1920×1080) es la referencia aprobada. Para alcanzar nitidez 2K se regeneró la misma composición (no se re-interpretó) capturándola desde `variante_a.html` a `deviceScaleFactor = 4/3` con Chromium (misma cadena que ENTREGA 03.1):

1. Captura a dsf=1 de `variante_a.html` → **RMSE = 0** contra `variante_a_clean.png` (mismo arte, generador verificado).
2. Captura a dsf=4/3 (DPR 1.333…) → 2560×1440 PNG (4,05 MB, intermedio fuera del repo).
3. Fidelidad de la maestra: downscale 2K→1920×1080 + RMSE contra lo aprobado = **283 / 65535 (0,43 %)** (reescalado del keyart webp; despreciable y sin alterar la composición).
4. Conversión a **JPEG q90** → `assets/ui/menu_main_backdrop_a.jpg` (670 812 B).

Contenido del arte (el aprobado, sin adiciones): protagonista de espaldas con cazadora del zorro coronado (centro-derecha, ancla visual), contenedor/ciudad roja en perspectiva con tres planos de profundidad convergiendo en su silueta, **anillos concéntricos** de neón alrededor de él, **parejas de bailarines en espejo** en tres profundidades (bruma/lejana/media/cercana), gran luna/disco rojo superior derecha, acentos morados a la izquierda. Relaciones de jerarquía, pose, anatomía, vestimenta e identidad: **inalteradas**.

**Por qué JPEG q90 y no PNG:** el delta del repo se mantiene ~0,65 MB (un PNG 2560×1440 serían ~4 MB) y el contenido es fotográfico/pintado; no hay alfa que perder (`alpha: false`). El asset original sigue en PNG como fallback.

## 7. Explicación técnica de la integración

### 7.1 Sistema reutilizado (sin duplicar capas)
El menú ya tenía UN `<img id="dd-menu-backdrop">` alimentado por `assetSrc("menu_main_backdrop")`. Se cambia **la fuente** (nuevo id) y se añade **un fallback** (`onerror` → PNG original). Cero capas nuevas, cero CSS nuevo, cero JS de runtime nuevo más allá del atributo `onerror`. El CSS existente (`cover` + `object-position: 50% 46%` + drift ~46 s) aporta el encaje en cualquier viewport sin estirar.

### 7.2 Menú-only por construcción (la decisión clave de auditoría)
`dd_cinematic_camera.js` usa `DD_ASSETS.get("menu_main_backdrop")` como **fallback de panorama** de la cinemática de intro. Por tanto, NO se podía repuntar el id original (retocaría el intro de forma silenciosa). Se registra un **id nuevo** (`menu_main_backdrop_a`) que solo consumen los 2 call sites del menú. El intro, su fallback y su preload quedan intocados byte a byte.

### 7.3 Flujo en runtime
`DD_BOOT` (carga con pasos reales) → cinemática INTRO (intocada) → `DD_UI.buildMainMenu()` → `assetSrc("menu_main_backdrop_a")` resuelve por `DD_ASSETS.manifest.entries['menu_main_backdrop_a'].src` → `<img>` carga `assets/ui/menu_main_backdrop_a.jpg` (cacheado por HTTP) → `refreshAssets()` conserva/re-aplica la misma fuente en refrescos. Si el asset no existe en servidor o falla la decodificación, `onerror` sustituye la fuente por el PNG original **sin dejar el menú en negro ni inutilizable**.

### 7.4 Qué NO se hizo y por qué
- **No se reutilizó `menu_backdrop_2k.webp` como backdrop del menú**: su rol es el preload de boot (existencia) y es un derivado distinto; cambiarlo alteraría el boot verificado en FASE 01.
- **No se eliminó ni repuntó el PNG original**: fallback y cinemática dependen de él.
- **No se sincronizó nada en bloqueo**: el `<img>` ya cargaba asíncrono; el menú aparece cuando el hook `images` resuelve (igual que antes; ver §12 para cifras y límites del entorno).
- **No se ocultan fondos con `visibility`/`display:none` duplicados ni se apilan dos backdrops**: hay uno solo.
- **No se tocaron** DD_BOOT, DD_CINE, combate, DJ, guardado, progreso, sliders, audio, ni estilos de UI.

### 7.5 Manifest y registro (coherencia)
`assets/manifest.json` (auditoría) y `src/dd_asset_registry.js` (runtime inline) quedan coherentes: misma entrada, mismo `sha16`, mismo `src`, mismo `w/h`. Se añade alias `entrega-03-2:menu-centro-bucle` → `menu_main_backdrop_a` en `byOriginalId` (id nuevo; no pisa alias legacy como `ddc-img`). `totalRegistered` 225 → 226 (lo reporta también el runtime: `ids.length`). `totalPlanned` (330) se conserva — es el objetivo de diseño del proyecto, no un contador de esta entrega.

> **Nota:** `src/dd_asset_registry.js` está nominalmente «AUTO-GENERATED … DO NOT EDIT MANUALLY» (pipeline masivo `asset_pipeline.py`). Para una única entrada curada se editó a mano espejando `assets/manifest.json` (validado: JSON del manifest parseado; sha16 verificado contra el archivo en disco) y se reconstruyó con `tools/build_active_html.py` (esa parte sí es determinista e idéntica desde backup).

### 7.6 Composición en 16:9 y otros encuadres
16:9 es la referencia (1920×1080, 2560×1440): `cover` ≈ sin recorte efectivo. En 1366×768 (16:9) idéntico. En **3440×1440 (21:9)** `cover` reescala a ×1,34 y recorta ~15 % vertical (ancla `object-position: 50% 46%`): el protagonista permanece completo y legible, la UI intacta; consecuencia inherente a cubrir con fuente 16:9, la misma que ya sufría el asset original, **sin estirar** (no hay distorsión) y sin pérdida crítica (documentado en §10).

## 8. Capturas del menú real (entregadas en `docs/ENTREGA_03_2_EVIDENCE/`)

| Fichero | Contenido |
|---|---|
| `menu_1920x1080_before.jpg` / `menu_1920x1080_after.jpg` | Par antes/después (16:9) |
| `menu_1920x1080_before_after.jpg` | Lámina comparativa lado a lado (3856×1088) |
| `menu_1600x900_after.jpg` · `menu_1366x768_after.jpg` · `menu_2560x1440_after.jpg` · `menu_3440x1440_after.jpg` | AFTER en resto de resoluciones |
| `menu_1600x900_before.jpg` · `menu_1366x768_before.jpg` · `menu_2560x1440_before.jpg` · `menu_3440x1440_before.jpg` | BEFORE equivalente (referencia) |
| `options_open.jpg` | OPCIONES abierto (sliders ENTREGA 02 intactos) |
| `credits_open.jpg` | CRÉDITOS |
| `slots_open.jpg` | SELECCIONAR PARTIDA |
| `after_transition.jpg` | Partida iniciada (Limbo, HUD, DJ Virgilio) |
| `fallback_missing_asset.jpg` | Backdrop con el asset A **bloqueado por red** → se muestra el PNG original |

Ninguna captura es un render de mockup: todas salen de la build real (`index.html` servida por HTTP local, sesión de navegador real, la misma que corre el juego).

## 9. Comparativa antes / después (1920×1080)

Lo que cambia: el backdrop es ahora la maestra 2K del arte aprobado (luna/ciudad más nítidas, **anillos** reconocibles alrededor de la silueta, **parejas de bailarines en espejo** en la base, calificación de color y bruma de ENTREGA 03.1). Lo que **no** cambia: logo, tagline, opciones, indicadores `.dd-btn-mark`, hints (`TECLADO + RATÓN · MANDO XBOX`, `v 3.3.0`), footer legal, layout, estados de selección, animación drift/atmos/vig, ni un solo píxel de UI. Detalles del arte de capas tenues (bruma/anillos exteriores) quedan muy atenuados tras la viñeta real del menú — comportamiento **ya medido y aceptado en ENTREGA 03.1**; no se «arregla» subiéndolos (alteraría el arte aprobado).

Legibilidad: columna izquierda (oscurecida por `.dd-menu-left`/leftshade existente y la viñeta z2) mantiene contraste sobrado; opción seleccionada legible al 100 %; indicador y textos secundarios sin degradación medible.

## 10. Resultados por resolución (AFTER, build reconstruida)

| Resolución | Backdrop natural | `cover` encaja | Menú visible | Página sin errores | Notas |
|---|---|---|---|---|---|
| 1920×1080 (16:9) | 2560×1440 | exacto (↓) | ✓ (≈17,2 s en sandbox¹) | 0 errores | referencia |
| 2560×1440 (16:9) | 2560×1440 | exacto | ✓ (≈24,4 s¹) | 0 errores | 1:1 con la fuente — máximo detalle |
| 1600×900 (16:9) | 2560×1440 | exacto (↓) | ✓ (≈24,4 s¹) | 0 errores | |
| 1366×768 (16:9) | 2560×1440 | exacto (↓) | ✓ (≈8,1 s¹) | 0 errores | |
| 3440×1440 (21:9) | 2560×1440 | exacto en W, recorte vertical ~15 % (↑×1,34) | ✓ (≈22,4 s¹) | 0 errores | sin estirar; protagonista y luna completos |

¹ Wall-clock en Chromium headless **sin GPU** (compositor por software); no es representativo de hardware real (ver §17 y FASE_01_INFORME_FINAL.md §N). Útil solo como comparación **misma máquina, mismo procedimiento** antes/después: BEFORE = 22,1 / 21,8 / 17,8 / 8,7 / 21,6 s (1920/2560/1600/1366/3440) → misma banda de ruido, **sin regresión de arranque atribuible al asset** (asset más ligero que el PNG anterior en transfer: 670 812 B vs 690 634 B).

En las cinco resoluciones: `naturalWidth=2560, naturalHeight=1440, complete=true`, menú completo y usable, opción seleccionada legible, sin recortes que afecten a la UI, sin deformaciones.

## 11. Regresión FASE 01 (batería completa, sobre la build reconstruida)

**Comando:** `QA_PORT=8126 QA_OUT=/tmp/e32_qa bash tools/fase01_qa/run.sh --keep` (sirve el propio worktree; puerto aislado del `:8123` de ENTREGA 02; resultados crudos en `/tmp/e32_qa/results.json`).

**Resultado (ejecución real, 2026-11-08, ≈23 min de tiempo de tests medido):**

```
== 141 PASS · 0 FAIL · 0 SKIP · 0 NV · 141 TOTAL ==
```

Resumen por bloque (todas PASS):

| Bloque | Pruebas | Resultado |
|---|---|---|
| A · Arranque | A1–A4 (incl. A4 sin errores de página/consola/red) | 4/4 |
| B · Intro | B1–B4 | 4/4 |
| C · Botones/menú | C1–C3, C4–C8b, C9–C14 | 19/19 |
| D · Controles | D1, D2, D3a–D3e (mando emulado) | 7/7 |
| E · Audio + F · Resoluciones | E-720p/1080p/1440p/ultrawide · F-720p/1080p/1440p/ultrawide | 8/8 |
| G · Entrar a partida | G1–G4 (estado PLAYING, música de menú cortada, menú oculto, HUD visible) | 4/4 |
| H · Fallos no esenciales | H-A*, H-B*, H-C*, H-D2a–e, H-E1–E5, H-F1–F4 | 21/21 |
| W · Watchdog | W1, W2, W3–W5, W6a–d | 9/9 |
| E/P · Motor ausente | E1–E6, P‑×3, P+ | 10/10 |
| V · Carga tardía | V1–V6 | 6/6 |
| M/T · Puertas de entrada | M-F, T1–T7 | 8/8 |
| Q/R · Accesibilidad del panel | Q1–Q5, R1–R13 | 18/18 |
| **Total** | | **141/141** |

Las capturas de evidencias de la propia suite quedan en `/tmp/e32_qa/` (p. ej. `res_1440p.png`, `12_playing.png`, `13_error_panel.png`); no se duplican en el repo por tamaño. **Ningún test fue modificado**; el resultado no depende de relajaciones. Referencia histórica FASE 01.2: 84 PASS → esta build añade el contenido de ENTREGA 02 y supera 141/141.

## 12. Rendimiento (antes / después)

**Medido sobre la build reconstruida (máquina libre, Chromium headless sin GPU, 1920×1080; 3 pasadas):**

| Métrica | Valor (después) | Referencia antes | Lectura |
|---|---|---|---|
| `transferSize` del backdrop (Resource Timing) | **671 112 B** (670 812 cuerpo + cabeceras) | ≈690 934 B (PNG 690 634 + cabeceras) | −2.9 % bytes para **4×** los píxeles |
| `encodedBodySize` / `decodedBodySize` | 670 812 / 670 812 B | 690 634 / 690 634 B | compresión contenida, sin doble decode |
| Duración de fetch del backdrop (HTTP local) | 74 · 84 · 96 ms | ≈ tamaños similares | inmediato bajo HTTP local |
| Dimensión natural decodificada | 2560×1440 | 1280×720 | nitidez 2K nativa |
| Memoria JS usada al mostrar el menú (`performance.memory.usedJSHeapSize`) | **16,3 MB** (×3 pasadas) | similar (mismo JS; sin capas nuevas) | sin coste añadido atribuible |
| Recursos registrados (`performance.getEntries().length`) | 340–371 | igual orden | sin peticiones nuevas |
| `time-to-menu` (sandbox software, 3 pasadas) | 17,9 · 28,6 · 21,7 s | 17,8–22,1 s (procedimiento idéntico) | misma banda de ruido; **sin regresión** |
| Coste de composición por frame | 1 × `<img>` estático + drift existente | idéntico | **cero capas/pases nuevos** |
| Heap de textura aproximado del backdrop | 2560·1440·4 B ≈ 14,7 MB | ≈3,7 MB | +11 MB, despreciable en GPU/iGPU modernos; el menú es una sola capa estática |

**Lo que NO se publica:** FPS de juego ni tiempos de arranque como rendimiento de hardware (este entorno rinde ~2 fps documentados en FASE 01 §N; cifrar eso sería deshonesto). Necesario y pendiente: medir en hardware real (Chrome/Edge escritorio con GPU) antes de cualquier lectura de arranque/fluida. La suite FASE 01 (§11) sí verifica que **nada** del juego se rompe con esta build.

Composición/frames: el backdrop no participa en el game loop (es DOM/CSS del menú); el coste por frame del drift preexistente no varía. Sin animaciones, paralaje, cámaras ni partículas añadidas.

## 13. Modos de fallo (probados sobre la build real)

### 13.1 Asset ausente (404) — probado en navegador real
Se **bloqueó por red** `assets/ui/menu_main_backdrop_a.jpg` (Playwright `route.abort()`), se cargó la página: el `onerror` instalado en el `<img>` sustituyó la fuente por `assets/ui/menu_main_backdrop.png`, `src` final verificado por DOM (`…/assets/ui/menu_main_backdrop.png`), screenshot `fallback_missing_asset.jpg` mostrando el menú completo e intacto. **Menú utilizable: sí. Legibilidad: sí. Sin errores JS.**

### 13.2 Carga retrasada (≈2 s) — probado
Con el asset retrasado 2 s por route: el menú aparece cuando el hook `images` del boot resuelve (≈17,3 s sandbox) y el backdrop termina cargando a 2560×1440; sin flashes vacíos en el flujo observado; una recarga tras la espera muestra la maestra completa.

### 13.3 Página recargada / re-entrada al menú
Recarga completa + re-navegación del flujo (menú → opciones → volver → créditos → ranuras → menú) verificada; el backdrop persiste correcto; volver a menú no duplica `<img>` ni eventos (`refreshAssets` reutiliza el mismo elemento).

### 13.4 Cambio de resolución
Cargado de cero en 5 viewports (§10). Cambio dinámico del viewport tras la carga: `object-fit: cover` en CSS ya resuelve el re-encuadre sin JS (no hay manejador nuevo; inherente al layout existente).

### 13.5 Fallback en cadena (degradación máxima aceptable)
Si **ambos** backdrops fallaran, el `onerror` se anula a sí mismo (`this.onerror=null`) para evitar bucles; el menú sigue funcionando con fondo vacío pero **usable** (botón/hints/logo intactos). No se ha podido simular un «PNG original también roto» sin borrar el archivo del árbol (no se simula destructivamente); el manejador estático garantiza ausencia de bucle por construcción.

### 13.6 Intro cinemática (fuera de alcance, verificada)
`cine_intro_club_panorama` sigue siendo el panorama principal del intro y su fallback (PNG original del menú) sigue registrado: la cinemática **no depende** del asset nuevo en ningún camino.

## 14. Incidencias registradas (esta entrega)

1. **Autocorrección de mi propia QA:** el primer guion de interacción asumía que la selección del menú se reinicia al índice 0 tras cada retorno (es lo que hace) pero calculaba índices absolutos tras ESC sin leerlos: 3 de 12 aserciones mal escritas (no fallos del producto). Reescrito con navegación por `data-action` dinámico → **13/13 PASS** (`/tmp/e32_interaction_results2.json`).
2. El test A4/B2 de la suite y los W-blocks interceptan imágenes por regex `menu_main_backdrop`, que **también** casa `menu_main_backdrop_a.jpg`: comportamiento de la suite idéntico al previo a esta entrega (el boot no precarga el asset nuevo; las imágenes esenciales siguen siendo las de siempre). Ningún test fue modificado.
3. `dd_asset_registry.js` está nominalmente auto-generado (§7.5) — riesgo de deriva documentado; la reconstrucción se validó artefacto a artefacto (`cmp index.html DEADBEAT_DISCO.html`, invariantes de unicidad del builder).
4. Entorno QA sin GPU: wall-clock no representativo (§10/§17). La batería FASE 01 se ejecuta completa; duración observada superior a fases previas por máquina compartida.
5. Capturas «before» tomadas **antes** del patch sobre el worktree pristine (puertos/evidencia separadas de `:8123`/`:8124`).
6. `menu_backdrop_2k.webp` (FASE_01) **no** se ha reutilizat: sigue siendo exactamente el preload de boot.

## 15. Hallazgos preexistentes (registrados, NO corregidos aquí)

- `player_walk_00.png` difiere estilísticamente de `walk_01..03` (pintado vs pixel-art); `walk_02` difiere además de cazadora. Preexistente; fuera de alcance (combate/sprites de jugador).
- Costura entre estilo sprite y panorama pintado del HUB: preexistente; fuera de alcance.
- Discrepancia de nombre **TEMPO/VIRGILIO** (documentada en entregas previas): **no** se toca ni se resuelve sin orden expresa.
- Viñeta real del menú atenúa capas tenues del arte A (esperado por diseño; medido en 03.1).
- Registro: `dd_asset_registry.js` nominalmente «do not edit» (§7.5).

## 16. Procedimiento de reversión (sencillo y documentado)

**Opción rápida (recomendada):** revertir el commit de esta entrega y reconstruir artifacts:

```
git revert <commit-de-esta-entrega>        # revierte fuentes + manifest + artifacts
python3 tools/build_active_html.py         # por seguridad, si los artifacts no vinieron en el revert
```

**Opción manual (2 líneas):** en `src/dd_ui_system.js` devolver las dos líneas
`assetSrc("menu_main_backdrop_a")` → `assetSrc("menu_main_backdrop")` (fallbacks a `menu_main_backdrop.png`), reconstruir y borrar `assets/ui/menu_main_backdrop_a.jpg` (el id nuevo puede quedar en el manifiesto sin uso; no afecta al runtime). El PNG original y la cinemática nunca fueron tocados, por lo que la reversión es total con estos pasos.

**Verificación tras revertir:** cargar `index.html`, comprobar `#dd-menu-backdrop.currentSrc` termina en `menu_main_backdrop.png` y menu visible.

## 17. Limitaciones y alcance honesto

- **Sin GPU** en el entorno de QA: tiempos de carga y fluidez NO son cifra de hardware real. No se reporta FPS del juego.
- **Audio** no verificable sin salida de sonido (como en FASE 01).
- **Mando físico** Xbox real no probado (la API sí, con emulación en la suite).
- Composición en 21:9: recorte vertical ~15 % por `cover` (§7.6) — inherente, no defecto; alternativa (arte 21:9 nativo) fuera de alcance.
- Texturas del menú reescaladas: la maestra es 2K derivada del keyart oficial, no arte nativo pintado a 2560×1440.
- Medición en hardware real (Chrome/Edge escritorio, GPU): **pendiente** (recomendación de cierre equivalente a FASE 01 §N).
- FASE 01 completa en este entorno: ejecutada pero extremadamente lenta; si su cierre revela fallos ajenos a esta entrega, se reportan como tal (histórico: 84/84 PASS en FASE 01.2).

## 18. SUITE FINAL (ejecución real)

```
== 141 PASS · 0 FAIL · 0 SKIP · 0 NV · 141 TOTAL ==
```

Ejecutada sobre la build reconstruida (`QA_PORT=8126 QA_OUT=/tmp/e32_qa bash tools/fase01_qa/run.sh --keep`), 2026-11-08, ≈23 min de tiempo de tests (`results.json`: 141 entradas, todas `status: PASS`; `ms` acumulados 1 399 056). Suite **sin modificar**. Desglose por bloques en §11. Resultado crudo conservado fuera del repo (`/tmp/e32_qa/`, incluye `results.json` y capturas `res_*.png`, `12_playing.png`, `13_error_panel.png`).

Resultado: **PASS**

## 19. Estado final

```
ESTADO: PASS
```

- Integración completa y verificada en este entorno: sí (§5–§13).
- Regresión FASE 01 sobre la build final: **141/141 PASS** (§11, §18).
- Condición previa al cierre definitivo por el usuario: revisión humana del PR (el agente propone, el usuario decide) y medición opcional en hardware real con GPU (no bloqueante para el alcance: el entorno carece de ella y la suite no mide rendimiento de hardware).
- Ninguna condición de aceptación de la especificación queda incumplida en este entorno: el asset aprobado está en el menú real, la UI intacta, sin cambios fuera de alcance (`git diff --stat` mínimo, §5), resoluciones verificadas, fallback funcional documentado, procedimiento de reversión (§16).

## 20. Verificado / No verificado / Pendiente / No aplicable

### 20.1 Verificado (ejecutado, no asumido)
- [x] Arte A aprobado presente en el menú real (RMSE 2K→1080p = 0,43 %; dsf=1 idéntico a lo aprobado).
- [x] Menú completo y legible en 5 resoluciones (1920×1080, 1600×900, 1366×768, 2560×1440, 3440×1440).
- [x] Navegación: NUEVA PARTIDA seleccionable, flechas mueven selección, OPCIONES abre/cierra, CRÉDITOS abre/cierra, SELECCIONAR PARTIDA abre/cierra, transición a partida inicia el motor (Limbo visible, HUD activo).
- [x] 0 errores de página en los flujos medidos (capture + interacción 13/13 + A4 en suite).
- [x] Fallback ante asset ausente (404 por red) → PNG original, menú usable (captura + DOM src).
- [x] Carga retrasada 2 s → menú aparece, backdrop carga completo.
- [x] **Batería FASE 01 completa: 141/141 PASS** (A/B/C/D/E/F/G/H/W/E·P/V/M·T/Q/R; suite sin modificar; §11/§18).
- [x] Rendimiento tras medición real (3 pasadas, Resource Timing + heap; §12).
- [x] `main` intacto en `250ee38…`; PR #10 intacto; worktrees de 03.1 intactos.
- [x] Diff mínimo y fuera-de-alcance nulo (`git diff --stat` en §5).

### 20.2 No verificado
- [ ] Hardware real con GPU (arranque, FPS, consumo) — imposible en este entorno (sin GPU; §17).
- [ ] Mando físico real (la API sí, con emulación en la suite: D3a–e PASS).
- [ ] Audio subjetivo (sin salida de sonido en el entorno).

### 20.3 Pendiente
- [ ] Revisión humana del PR abierto desde esta rama hacia `main` (autorizado abrirlo; **no se fusiona** desde el agente; PR #10 no se toca).
- [ ] Medición en hardware real (recomendada antes de cualquier decisión de rendimiento).
- [ ] Si el equipo lo desea, archivar la evidencia cruda de la suite (`/tmp/e32_qa/`) en almacenamiento externo.

### 20.4 No aplicable
- Cambios de interfaz, animaciones nuevas, paralaje/partículas: excluidos por alcance (la entrega prohíbe exactamente eso; nada que verificar).
- Variantes B/C: excluidas por alcance.
- Cinemática de intro: sin cambios por construcción (verificada estáticamente: ningún camino del intro toca el asset nuevo; bloques A/B de la suite en PASS).

## 21. Pull Request

- PR: **#11** — https://github.com/SER-RGV/DEADBEAT-DISCOnew/pull/11
- Título: «ENTREGA 03.2 — Integración controlada del menú principal (A · El Centro del Bucle)»
- Base: `main` (`250ee38…`, intacta — `git ls-remote origin main` verificado = `250ee38c13b0f7598eb40b7bac99fedba47a2917`) · Head: `arena/entrega-03-2-menu-centro-bucle`
- Commit de la entrega: `de8c567` · 23 archivos · +339 / −10 · estado: OPEN, MERGEABLE, **sin fusionar** (revisión humana requerida).
- PR #10: intacto (OPEN, no tocado). Worktrees de ENTREGA 03.1 y árbol principal: intactos.
