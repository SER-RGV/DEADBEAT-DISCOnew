# TANDA 07 · HUD — informe de cierre

Fecha: 2026-11-15 · Rama `arena/e088e9d7-deadbeat-disconew` (PR #22) · Plan: [`PLAN_PRODUCCION_02-07.md`](PLAN_PRODUCCION_02-07.md) §3 fila 07 ·
Guía visual: lámina `LAM_01` §07 («HUD, menús e iconografía»).
Lote: [`batches/T07_HUD.json`](batches/T07_HUD.json) (8 assets, 1 turno) · Evidencia: `evidence/T07_HUD/` (00–19 + informes de sonda) ·
Herramientas: `tools/art_master/batch.py`, **`probe_hud.js`** (nueva: ruta real de arranque), **`probe_boot_failure.js`** (nueva: diagnóstico
de `is-failed`), **`derive_hud_heart_empty.py`** (nueva).

**Resultado: 8/8 iconos producidos, registrados (caché `20261115.26`), integrados en el sistema de HUD existente y verificados en la
build real (`index.html`) entrando por la ruta real de un jugador** (carga → intro → menú → NUEVA PARTIDA → descenso → Refugio → incursión),
con el panel de arranque, el menú y las cinemáticas tal cual son: nada se oculta ni se salta por código. Sin cambios de comportamiento del HUD.

## 1. Inventario y auditoría (lo que había)

`assets/ui/` tenía 15 PNG; el HUD DOM (`src/dd_ui_system.js`) consume 7 ids de iconografía y la cámara cinematográfica 1:

| id | Consumidor real | Tamaño en pantalla | Estado previo |
|---|---|---|---|
| `hud_heart_full` / `hud_heart_empty` | `updateHud()` → `#dd-hud-hearts img.dd-heart-icon` (vacío con `opacity .28 + grayscale`) | 22×22 | B (estilo ajeno; `hud_heart_full` era en realidad un marco de minimapa reutilizado) |
| `hud_credit_coin` | `.dd-badge-cr img` | 16×16 | B |
| `hud_shield_badge` | **sin consumidor** (sólo reserva `pickup_shield_00`) | — | B |
| `hud_skill_bomb` / `hud_skill_boost` / `hud_skill_dodge` | `.dd-skill-card img` (tarjetas ESP / SHIFT / ROLL) | 44×44 | B (reserva a `pickup_*_00`) |
| `ui_victory_emblem` | `dd_cinematic_camera.js` l.946–953 (secuencia `victory`) | 280×210 | B |

No se tocan: retrato (`char_*`), `ui_defeat_emblem`, `ui_shop_emblem`, `hud_minimap_frame`, fondos de menú (fuera de la fila 07 del plan y sin
evidencia de defecto).

## 2. Producido (8 PNG RGBA, guía 07: contorno de tinta grueso, cel 2–3 tonos, filo blanco, neón sobre negro, sin marco ni halo)

| id | Lienzo | Diseño |
|---|---|---|
| `hud_heart_full` | 128² | corazón rosa `#ff2d7a` glossy, brillo blanco arriba-izquierda |
| `hud_heart_empty` | 128² | **v2 derivada** de la silueta exacta del lleno: aro rosa pálido + relleno carbón translúcido (`derive_hud_heart_empty.py`) |
| `hud_shield_badge` | 128² | escudo cian `#22d3ee` con filo blanco |
| `hud_credit_coin` | 128² | moneda de oro con calavera coronada (emblema del juego) |
| `hud_skill_bomb` | 160² | bomba negra con rejilla de altavoz violeta y mecha magenta |
| `hud_skill_boost` | 160² | hexágono cian con rayo magenta |
| `hud_skill_dodge` | 160² | flecha circular cian con estela magenta |
| `ui_victory_emblem` | 512×384 | corona de oro sobre el zorro rosa, laureles y bola de espejos; sin halo (lo pone el velo del motor) |

Crudos IA (croma `#00FF00`) → `batch.py process` (matte duro, `fit contain` margen 8/10, nitidez 25) → maestros WebP en
`ART_ASSETS/rebuild_masters/T07_HUD/` → `register` (382 assets, `ASSET_CACHE_VERSION 20261115.25` → `.26` tras la v2 del corazón vacío).
El crudo IA v1 del corazón vacío se conserva como `hud_heart_empty_ia_v1.png` (fuera del repo, en `dd_work/raw/T07_HUD/`).

## 3. Integración (sólo imágenes; sin rediseño ni cambio de comportamiento)

- 7 de los 8 ids ya los consumía el sistema por `assetSrc(id, reserva)`: al registrarlos, el HUD deja de usar las reservas `pickup_*_00`
  (comprobado en la sonda: los 7 `<img>` cargan desde `assets/ui/hud_*.png`, `naturalWidth > 0`).
- `hud_shield_badge` no tenía consumidor. Integración mínima en `src/dd_ui_system.js` `buildHud()`: la barra de escudo existente
  (`.dd-bar-track.dd-bar-shield`, `#dd-hud-sh-fill`) va ahora dentro de una fila `.dd-bar-row-shield` precedida del icono
  `<img id="dd-hud-shield-img" class="dd-hud-shield-icon">` (14 px, `object-fit: contain`, sombra cian), y `refreshAssets()` lo
  refresca con el resto. CSS en `src/dd_rebuild_ui.css` (dos reglas). Ninguna lógica de `updateHud()` cambia.
- `python3 tools/build_active_html.py` regenera `index.html` / `DEADBEAT_DISCO.html` (CSS y módulos inlineados).

## 4. QA del HUD (bloque 3)

### 4.1 Diagnóstico de `#dd-boot-frame.is-failed` (sin ocultarlo)

- **Qué es:** estado de arranque. `src/dd_boot.js` sólo añade `is-failed` desde `showError()` cuando (a) falla un paso imprescindible
  (`ESSENTIAL_IDS = engine, assets, ui`), (b) un paso supera su `timeoutMs` y es imprescindible, o (c) salta el perro guardián
  (`WATCHDOG_MS = 20000` desde `boot()`), que además invalida el intento (`runToken++`) para que la intro no arranque después del error.
  Los pasos opcionales que superan su tiempo (p. ej. `images`, 7000 ms) se registran como `optional-failure` **recuperable** y el
  arranque continúa. No es un problema de captura: la captura reproduce el DOM real.
- **Medido en esta tanda** (`DD_BOOT.getEvidence()/getErrorRegistry()/getTrace()`, informes `t07_boot_trace_720.json`,
  `t07_probe_hud_720.json`, `t07_boot_failure_diag_720.json`):
  - Ruta real a 1280×720: pasos `engine → … → done` en 6,6 s (`images` 5,0 s), **0 errores**, `is-complete → is-out → INTRO`.
  - Ruta real a 1920×1080: arranque completo en 24,8 s de reloj de página; `images` superó los 7000 ms → **1 error recuperable**
    (`images: optional-failure`), sin panel de error, intro y menú normales.
  - Ruta «por atajo» de las sondas anteriores (`DD_HUB.enter()` + `exitToRun()` nada más cargar `DD_ASSETS`, mientras `DD_BOOT` sigue
    con sus pasos), a 720p: `images` superó 7000 ms (error recuperable, `at: 9727 ms`), cadena de pasos de 14,5 s (frente a 6,6 s
    en la ruta real), sin llegar al perro guardián en esta ejecución.
- **Conclusión:** en headless con rasterizado por software (≈2 fps en el Refugio) los pasos con límite de tiempo están al borde;
  cualquier carga concurrente (forzar el Refugio y el bucle del juego durante el arranque, 1080p) alarga `images`/`fase01`/`opening`
  y puede llevar la cadena a los 20 s del perro guardián → `is-failed`. Es un **estado de arranque legítimo** del juego ante un
  entorno lento, no un defecto del arte ni de la captura. Regla adoptada: una ejecución con `is-failed` es una ejecución inválida
  que se repite; **no se oculta el panel**. `probe_hud.js` aborta con código 2 y guarda `boot_failed_<alto>.png` + registro si ocurre.

### 4.2 Evidencia visual (ruta real, Chromium headless, 0 errores de página)

Sonda `probe_hud.js` a **1280×720** (resolución de referencia de la evidencia; 15 capturas reales de página, 13 comprobaciones OK):

| # | Estado | Evidencia | Comprobación |
|---|---|---|---|
| 03 | Menú principal tras saltar la intro con una tecla real | `03_menu_principal_ruta_real_720.jpg` | `DD_BOOT.getState().state === MAIN_MENU` |
| 04–05 | Refugio: HUD completo y panel | `04_hud_refugio_completo_720.jpg`, `05_hud_refugio_panel_720.png` | corazones 3/3, CR 0, NV. 1, icono de escudo delante de la barra, 7/7 iconos desde `assets/ui/hud_*`, sin capas con `z-index ≥ 6200` sobre el HUD |
| 06–07 | Incursión normal (`hud.running`) | `06_hud_incursion_completo_720.jpg`, `07_hud_incursion_normal_panel_720.png` | hp 100 %, banner de sala |
| 08 | Daño real (`wp` del motor ×2) | `08_hud_incursion_dano_corazon_vacio_720.png`, `08b_zoom_corazones_x6.png` | corazones 2/3 → el vacío se ve como corazón hueco gris (v2) |
| 09 | Escudo (botín `shield` del motor) | `09_hud_incursion_escudo_720.png` | `snapshot.shield = 1` (ver hallazgo §5) |
| 10 | Habilidades cargadas (botín `bomb` + `boost`) | `10_hud_habilidades_cargadas_720.png` | bombas 4 · boosts 4, tarjetas activas |
| 11 | Bomba gastada con la tecla real | `11_hud_habilidades_bomba_gastada_720.png` | 5 × `Q` → bombas 0 y tarjeta `.dd-empty` (Espacio no gasta bomba: ver §5) |
| 12–13 | Jefe (`DMO.debug.boss`): presentación cinematográfica y barra superior `#dd-boss-hud` | `12_hud_jefe_presentacion_cine_720.jpg`, `13_hud_jefe_barra_superior_720.png` | barra visible (DJ DOOM) con la cinemática ya terminada |
| 14 | Emblema de victoria (`DD_CINE.playVictory`) | `14_emblema_victoria_cine_720.jpg` | `ui_victory_emblem` 512×384 dibujado a 280×210 sobre el velo |
| 15 | Corazón vacío v1 (IA) frente a v2 bajo el CSS real | `15_corazon_vacio_v1_vs_v2_bajo_css.png` | máximo 30/255 → 87/255 |

Escalado/legibilidad: los iconos del HUD son DOM con tamaño fijo en px (22 / 16 / 14 / 44) y `dpr 1`; en el Refugio a 1920×1080 los
tres primeros estados se capturaron igualmente (`t07_probe_hud_1080.json`, ver §6) y los tamaños CSS coinciden. `02_maqueta_escala_hud_x3.png`
muestra los 8 PNG a sus tamaños de consumo (×3) sobre el panel oscuro.

### 4.3 Limitaciones de la verificación headless (no se declaran aprobadas)

- Rendimiento: ≈2 fps a 720p y ≈1,7 fps a 1080p en software; cada captura real tarda 4–45 s. A 1920×1080 la primera ejecución
  completa cayó (`Target page… closed`) al entrar en la incursión; se repitió con `--mute-audio` (ver §6 para el resultado).
- Los estados que dependen de una partida jugada (subida de nivel, racha/rave, muerte real, victoria contra un jefe real) se han
  provocado con los ganchos del motor (`wp`, `nf`, `DMO.debug.boss`, `DD_CINE.playVictory`), no jugando; la pantalla de derrota
  (`ui_defeat_emblem`, no producida en esta tanda) no se ha capturado.
- La lista de pasivos de la pausa y el cofre se verificaron en T06 por el atajo de QA (ver `TANDA_06_INFORME.md` §4).

## 5. Hallazgos heredados (no se tocan en esta tanda; pendientes de decisión)

1. **Barra de escudo:** `updateHud()` calcula `shPct = Math.min(100, snap.shield)`, pero `snap.shield` es `Ee`, el número de cargas
   (0–3) del motor → con escudo la barra mide 1–3 %. Cuando no hay escudo muestra el medidor de rave (`raveMeter·100`). Propuesta:
   `snap.shield / 2 · 100` (tope del motor `Ee < 2 → Ee++`) o volver al contador numérico original; es un cambio de comportamiento y queda fuera del alcance.
2. **Etiqueta de la tarjeta de bomba:** dice `ESP`, pero el motor lanza la bomba con `Q` (`tp()`); `Espacio` es la esquiva (`zt.key`).
   Las etiquetas `SHIFT` (boost, `op()`) y `ROLL` son coherentes. Pendiente de decidir (texto de UI, no imagen).
3. Ids registrados sin consumidor: `menu_main_backdrop`, `menu_main_backdrop_a` (el menú usa `mc_07_pit.jpg` por decisión de PROJECT
   RESTART) y `ui_shop_emblem`.

## 6. Verificación a 1920×1080 (parcial: Refugio sí, incursión no)

Dos ejecuciones de `probe_hud.js` a 1920×1080 (la segunda con `--mute-audio`) llegaron por la ruta real hasta el Refugio y capturaron
el HUD (`16_menu_principal_ruta_real_1080.jpg`, `17_hud_refugio_completo_1080.jpg`, `18_hud_refugio_panel_1080.png`,
`19_hud_refugio_habilidades_1080.png`; registro `t07_probe_hud_1080_log.txt`, `t07_boot_trace_1080.json`): 7/7 iconos desde `assets/ui`,
tamaños CSS idénticos a 720p (22/16/14/44 px), ninguna capa sobre el HUD, 1,7 fps, capturas de 37–47 s. **En ambas la pestaña de
Chromium cayó al entrar en la incursión** (`Target page, context or browser has been closed`, sin error de página previo; sandbox de
2 CPU / 3,9 GB, `--single-process`), de modo que los estados de incursión (daño, escudo, habilidades, jefe, victoria) a 1080p **no
están verificados** en headless; están verificados a 1280×720. Como el HUD es DOM con tamaños fijos en px y no depende del lienzo,
no se espera diferencia, pero no se declara aprobado sin captura: queda como comprobación manual pendiente en un navegador real.

## 7. Contrato de los iconos del HUD

- Lienzos: 128² (corazones, escudo, moneda), 160² (habilidades), 512×384 (emblemas). RGBA, `pivot center`, `fit contain` margen 8/10,
  sin marco, sombra ni halo propios (los aporta el CSS/velo). Croma `#00FF00` en el crudo; maestro WebP en `rebuild_masters/T07_HUD/`.
- Los estados atenuados por CSS (corazón vacío, tarjeta `.dd-empty`) deben seguir legibles tras `opacity .28 + grayscale`: contorno claro.
- Estados derivados (vacío/apagado) se generan a partir del estado base con herramienta determinista para conservar la silueta.
