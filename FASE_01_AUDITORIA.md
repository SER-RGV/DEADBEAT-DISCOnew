# FASE 01 · BLOQUE 01 — AUDITORÍA E INVENTARIO

**Fecha:** 2026-11-07
**Rama:** `arena/0b7be6f7-deadbeat-disconew` (parte de `main` @ `0bd6a546b7420fd82decf53c24b805f8c8307afa`)
**Árbol de trabajo al inicio:** limpio (`nothing to commit, working tree clean`).
**Método:** lectura estática del repositorio + ejecución real en Chromium 131 (`@sparticuz/chromium` 131.0.1 + `playwright-core` 1.49) servido en `http://127.0.0.1:8123`. Todas las cifras de esta auditoría están medidas, no estimadas.

---

## 0. Resumen ejecutivo (lo que cambia el plan)

| # | Hallazgo | Consecuencia para la Fase 01 |
|---|---|---|
| H1 | **El HTML ejecutable real es `index.html`** (y su gemelo byte a byte `DEADBEAT_DISCO.html`), **generado** por `tools/build_active_html.py` desde `backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html` + `src/dd_rebuild_ui.css` + 5 módulos `src/dd_*.js`. | Toda modificación va en `src/*` y se propaga regenerando. No se edita `index.html` a mano. |
| H2 | `DEADBEAT_DISCO.ART.html` (13,49 MB) **no es la build publicada**. Es la build de I+D artística con pixel-art/HUB-tandas, **sin** el sistema de menú HD (`#dd-main-menu`), **sin** `DMO_HUB` real y **sin** los módulos `src/*`. | No es la superficie de la Fase 01. Se conserva intacta. |
| H3 | GitHub Pages sirve `main` en `/` → `index.html`. | `index.html` es lo que el usuario ve. Es la superficie a corregir. |
| H4 | **No existe pantalla de carga con identidad.** `#boot-screen` es un panel técnico de la v2.46 (grid cian, sigilo rombo, `DMO_BOOT46`). Además nace en `class="done"` en el artefacto y **se elimina del DOM a los ~650 ms**; el código de `DMO_BOOT46` sigue vivo pero huérfano. | Reconstrucción completa (BLOQUE 03). |
| H5 | **No hay menú de intro.** `DD_CINE.playIntro()` existe pero **solo se invoca desde un botón** (`data-action="hub"`). El arranque va directo a MAIN_MENU. | Se implementa BOOT→LOADING→INTRO→MAIN_MENU (BLOQUE 04). |
| H6 | **Hay dos menús superpuestos.** El menú HD (`#dd-main-menu`, `z:9500`) sustituye al cover legado `#ddc-cover` (`z:2147483000`) que queda en `display:none` por CSS, pero **su motor de audio y su motor de teclado siguen construidos y escuchando**. | Propiedad de audio y de input única por estado (BLOQUE 07). |
| H7 | El botón de opciones actual **saca al usuario del menú** (`hideMainMenu()` + muestra `#overlay` legado): no vuelve al menú. | Submenús reales con retorno (BLOQUE 06). |
| H8 | La ilustración de menú del artefacto (`ddc-img` → `assets/ui/menu_main_backdrop.png`) **ya trae el logotipo, los botones y el marco horneados en píxeles**. El menú HD dibuja encima un logotipo y unos botones vivos → **doble logotipo / doble botón fantasma** visibles en la esquina superior izquierda. | El fondo debe separarse en capas: arte limpio + logotipo + UI viva. Reconstrucción de asset (BLOQUE 02). |
| H9 | Los 300 recursos embebidos decodifican; los 225 del manifiesto externo existen (0 rutas rotas, 10,86 MB). | No hay rotura de carga que justifique regenerar el arte base. La reconstrucción se limita a lo que la composición exige. |
| H10 | El entorno de QA no trae navegador ni permite descargarlo de los CDN de Playwright; **sí** funciona Chromium de `@sparticuz/chromium` con `LD_LIBRARY_PATH` a las libs NSS de Amazon Linux 2023. | Se documenta el procedimiento exacto para que las pruebas sean reproducibles. |

---

## 1. Estado inicial del repositorio

```
rama         arena/0b7be6f7-deadbeat-disconew
HEAD         0bd6a546b7420fd82decf53c24b805f8c8307afa  (main, merge PR #8)
commits      1 (historial aplastado en la importación del repo)
working tree limpio
tamaño       2,2 GB · 2.198 archivos
```

Archivos que gobiernan el arranque real:

| Archivo | Tamaño | Papel |
|---|---|---|
| `index.html` | 5.234.728 B | **Build publicada** (single-file). 9.200 líneas, CSS y JS inline. |
| `DEADBEAT_DISCO.html` | 5.234.728 B | Copia byte a byte de `index.html` (`md5 41fce97f…`). |
| `src/dd_rebuild_ui.css` | 799 líneas | CSS del menú HD, HUD, modales, cinemática. Se inlinea en `index.html`. |
| `src/dd_asset_registry.js` | 122 líneas | `window.DD_ASSETS`: manifiesto de 225 recursos + precarga. |
| `src/dd_world_renderer.js` | 762 líneas | Render isométrico del mundo. **Fuera del alcance de la Fase 01.** |
| `src/dd_hub_system.js` | 468 líneas | HUB jugable. **Fuera del alcance.** Solo se conecta. |
| `src/dd_cinematic_camera.js` | 464 líneas | `window.DD_CINE`: 7 cinemáticas + cámara. Aquí vive `playIntro`. |
| `src/dd_ui_system.js` | 767 líneas | `window.DD_UI`: menú principal, HUD, tienda, mapa, mando. |
| `tools/build_active_html.py` | 26 KB | Genera `index.html` y `DEADBEAT_DISCO.html`. Idempotente, con aserciones anti-duplicado. |
| `assets/manifest.json` | 225 entradas | Registro real de recursos (id, ruta, w, h, alpha, pivote, sha16). |

`DEADBEAT_DISCO.ART.html` (13,49 MB, 21.922 líneas) es la build de I+D artística (Tandas HUB 01–09). **No contiene** `#dd-main-menu`, `DD_UI`, `DD_ASSETS` ni los módulos: su menú es el `#ddc-cover` legado y su lógica de HUB es otra. Se **conserva sin tocar** como histórico.

---

## 2. Sistemas existentes (auditoría técnica)

| # | Sistema | Dónde | Estado real medido |
|---|---|---|---|
| 1 | HTML ejecutable | `index.html` (= `DEADBEAT_DISCO.html`) | ✅ funciona, 0 `pageerror` en 6 arranques |
| 2 | Motor de render | `<canvas id="game" 480×640>` escalado por `__DD_BRIDGE` a DPR nativo | ✅ vivo |
| 3 | Sistema de estados | **No hay FSM**. El "estado" es implícito: `body.booting`, `#boot-screen` presente/ausente, `#dd-main-menu` visible + `DD_UI.menuVisible`, `DD_CINE.activeSeq`, `DD_HUB.state.active`, `__DD_BRIDGE.getSnapshot().running`, `#overlay` visible. | ⚠️ disperso; se necesita una FSM explícita que **orqueste**, sin duplicar los subsistemas |
| 4 | Escenas | `src/dd_world_renderer.js` + `__DD_BRIDGE` (salas `r0…r89`) | ✅ vivo |
| 5 | Gestión de assets | `window.DD_ASSETS` (225 entradas, precarga por `Image`) + `__T3B_IMAGES`, `__ILT_DATA`, `__HD_DATA`, `DDM_V5_ASSET_DATA` (300 data-URIs inline) | ✅ vivo |
| 6 | Animaciones | rAF del canvas + CSS (`dd_rebuild_ui.css`) + `DD_CINE` (cámara y secuencias) | ✅ vivo |
| 7 | Audio | **Dos motores**: (a) `DMO_MUSIC` del juego (§29) y (b) `DDC_COVER.music` — un **motor WebAudio completo** (secuenciador a 150 BPM, sintetizadores, reverb por convolución, sidechain) dentro del IIFE del cover legado. | ⚠️ (b) es el que corresponde al MENÚ; (a) al GAME. Hoy conviven sin árbitro |
| 8 | Guardado | `localStorage`. Partida **no** persistida a media tirada (declarado por el propio juego en el panel "CONTINUAR": *«El club no guarda partidas a medias»*). Persisten: `dmodisco_best_v5`, `dmodisco_best_round_v1`, `dmodisco_best_combo_v216`, `dmodisco_currency_v1`, `dmodisco_upgrades_v1`, `dmodisco_ach_v1`, `dmodisco_hist_v3`, `dmodisco_muted_v1`, `dmodisco_vol_v1`, `dmodisco_a11y_v1`, `dmodisco_weapon_prestige_v1`, `dmo_secret_route_v32`, `dmo_victories_v214`, `dmo_roll_v271`. | ✅ real |
| 9 | Entrada | Teclado/ratón (motor), `DD_UI` (flechas + Enter + Esc + H/I/M + gamepad), `DD_CINE` (Space/Esc/Enter para saltar), cover legado con listener de captura en `window`, y un **KEYBOARD TAKEOVER GUARD** del puente HD | ⚠️ 5 consumidores; se necesita arbitraje por estado |
| 10 | Resolución / cámara | `__DD_BRIDGE` escala el canvas a DPR nativo; `DD_CINE.getCamera()`; CSS sin transformaciones de layout | ✅ vivo |
| 11 | Menú actual | `#dd-main-menu` (`src/dd_ui_system.js`): fondo `menu_main_backdrop`, logo `logo_deadbeat_graffiti`, 5 botones (`hub`, `play`, `shop`, `map`, `options`), footer. Sin intro, sin créditos, sin selección de partida, sin navegación de teclado dentro del menú (solo gamepad), sin hover→selección por teclado coherente. | ⚠️ incompleto |
| 12 | Recursos gráficos | ver §4 | ✅ íntegros |

### 2.1 Flujo de arranque **real** medido hoy

```
t=0      HTML 5,2 MB · 300 data-URI · 4 canvas
t≈650 ms DD_ASSETS, DD_HUB, DD_CINE, DD_UI definidos
t≈780 ms `#boot-screen` recibe .done y se BORRA del DOM a ~1,3 s
t≈1,2 s  load · DMO_BOOT46.windowReady()
t≈1,2 s  #dd-main-menu visible directo  ← NO HAY INTRO
         #ddc-cover display:none (pero su audio y su teclado vivos)
```

Consecuencias verificadas: no hay estado LOADING perceptible, no hay INTRO de arranque y el primer elemento con foco no está definido.

### 2.2 Defectos de dirección de arte detectados en runtime

1. **Doble logotipo**: la ilustración de fondo ya contiene el logotipo pintado (arriba a la izquierda) y el menú HD pinta encima `logo_deadbeat_graffiti`. En 1280×720 y 1600×900 se ven las dos marcas a la vez.
2. **Botones fantasma**: el arte de fondo contiene la columna de botones del menú antiguo (INICIAR / CONTINUAR / …); se transparentan detrás de los botones vivos.
3. **Composición desequilibrada**: el protagonista (mitad derecha) queda correctamente visible, pero la columna de botones vivos no coincide con la del arte → doble jerarquía.
4. **Textos en mayúsculas con `letter-spacing`** en tipografía de sistema: legible pero no "de videojuego".

Estos cuatro puntos son los que justifican la reconstrucción de assets del BLOQUE 02: **no** se regenera el arte del protagonista ni el logotipo (identidad aprobada), se **separan capas** para que la UI viva no compita con la UI horneada.

---

## 3. Inventario de assets relevantes para la Fase 01

Medido con Pillow. `sha16` = primeros 16 hex de SHA-256.

### 3.1 Logotipos e identidad

| Asset | Ruta | Dim | Formato | Uso actual | Calidad | Integración | Decisión |
|---|---|---|---|---|---|---|---|
| Logotipo graffiti | `assets/logos/logo_deadbeat_graffiti.png` | 1024×682 | PNG P (sin alpha) | `<img id="dd-menu-logo-img">` y `DD_CINE` intro | Alta, **fondo horneado** (no transparente) | ✅ | **CONSERVAR** + derivar versión recortada/transparente |
| Emblema zorro | `assets/logos/emblem_fox_crown.png` | 512×512 | PNG P | `boot-sigil`, marcador de cine | Alta | ✅ | **CONSERVAR** |
| Lámina de logotipo | `assets/references/REF_02_logotipo_graffiti.png` | 1536×1024 | PNG RGB | referencia | Alta | referencia | **CONSERVAR** como referencia |
| Ilustración menú (con UI horneada) | `assets/ui/menu_main_backdrop.png` (= `ddc-img`) | 1280×720 | PNG P | fondo del menú | Alta pero **contiene logotipo + botones** | ❌ compone mal | **RECONSTRUIR** capa limpia (ver §5) |
| Banner protagonista | `assets/references/REF_04_banner_protagonista.png` | 823×212 | PNG RGBA | referencia | Alta | referencia | **CONSERVAR** |
| Master sheet UI | `assets/references/REF_05_master_sheet_assets_ui_hub.png` | 1536×559 | PNG RGBA | referencia | Alta | referencia | **CONSERVAR** |

### 3.2 Protagonista

| Asset | Ruta | Dim | Uso actual | Calidad | Integración | Decisión |
|---|---|---|---|---|---|---|
| idle | `assets/characters/player_idle_00.png` | 224×320 | mundo | Alta | ✅ | CONSERVAR |
| walk 00–03 | `assets/characters/player_walk_0*.png` | 224×320 | mundo | Alta | ✅ | CONSERVAR |
| shoot | `assets/characters/player_shoot_00.png` | 240×320 | mundo | Alta | ✅ | CONSERVAR |
| roll | `assets/characters/player_roll_00.png` | 256×288 | mundo | Alta | ✅ | CONSERVAR |
| hurt / death / boost / fire2 / firehip | `assets/characters/player_*.png` | 160–288 | mundo | Alta | ✅ | CONSERVAR |

**No se reconstruye el protagonista.** La ilustración de menú ya lo muestra con las proporciones y el vestuario aprobados (chaleco con zorro coronado, tatuajes de calavera, pantalón negro, zapatillas). Cualquier regeneración sería una interpretación nueva de una referencia cerrada. Se documenta esta decisión en §5.

### 3.3 Fondos, cinemáticas y UI

| Asset | Ruta | Dim | Uso | Decisión |
|---|---|---|---|---|
| Panorama club infernal | `assets/cinematics/cine_intro_club_panorama.png` | 1280×720 | `#ddc-bg`, intro | **CONSERVAR** (base de la pantalla de carga) |
| Cine círculos 00–09 | `assets/cinematics/cine_circle_*.png` | 960×540 | `DD_CINE.playCircleDescent` | CONSERVAR |
| Retrato HUD | `assets/ui/hud_portrait_protagonist.png` | 256×256 | HUD | CONSERVAR |
| Retrato DJ | `assets/ui/dialogue_portrait_dj.png` | 512×512 | diálogo | CONSERVAR |
| Torre | `assets/ui/map_infernal_tower.png` | 640×640 | mapa | CONSERVAR |
| Moneda | `assets/ui/hud_credit_coin.png` | 128×128 | HUD | CONSERVAR |
| Emblema tienda | `assets/ui/ui_shop_emblem.png` | 320×160 | tienda | CONSERVAR |

### 3.4 Tipografía

| Recurso | Formato | Licencia | Uso | Decisión |
|---|---|---|---|---|
| **DDPixel** = *Pixelify Sans* | TTF embebido (`@font-face`, data-URI) | **SIL OFL 1.1** (texto completo embebido en `<script id="pixel-font-license">`) | `font-family:DDPixel` | **CONSERVAR** y usar como display del menú |

### 3.5 Audio

| Recurso | Naturaleza | Uso | Decisión |
|---|---|---|---|
| `DDC_COVER.music` | Sintetizador WebAudio procedural (150 BPM, 2 osciladores por voz, convolución de 2,4 s, sidechain, secciones intro/build/drop/break) | Música del menú | **CONSERVAR** — es la banda sonora existente; se le da propiedad por estado |
| `DMO_MUSIC` | Gestor musical del juego (HUB/DESCENT/COMBAT/BOSS) | Música de partida | **CONSERVAR** — no se toca |
| Efectos de UI | `DDC_COVER` sintetiza blips (`M.ui('move'|'ok'|'back')`) | navegación | CONSERVAR y reutilizar |

**No existe ningún archivo de audio en el repositorio.** Todo el audio es procedural. No se sustituye.

---

## 4. Recursos dañados / incompletos / duplicados

| Id | Recurso | Problema | Evidencia | Acción |
|---|---|---|---|---|
| D-01 | `assets/ui/menu_main_backdrop.png` | Contiene logotipo y botones horneados → doble render con la UI viva | captura 1280×720 y 1600×900 | **RECONSTRUIR** capa limpia |
| D-02 | `#boot-screen` | `DMO_BOOT46` sigue emitiendo progreso pero el DOM ya no existe (`t.parentNode.removeChild(t)` a 650 ms) | código + runtime | **RECONSTRUIR** |
| D-03 | `DEADBEAT_DISCO.ART.html` | Build paralela de I+D que no es la publicada; riesgo de confusión operativa | comparación `grep` (0 `dd-main-menu`) | **CONSERVAR** + marcar como histórica en `CURRENT_STATE.md` |
| D-04 | `DDC_COVER` (cover legado) | 45 KB de JS minificado con motor de audio y listener de captura de teclado activos bajo un menú que nunca se muestra | runtime | **NO ELIMINAR** (contrato del motor para `start`), **silenciar y desarmar** desde la FSM |
| D-05 | `bosses/_source/*.png.png` | Doble extensión en 11 archivos | `find` | **NO TOCAR** (fuera de alcance) |
| D-06 | `backups/*.html` | 23 MB versionados | `du` | **NO TOCAR** |
| D-07 | `docs/ART_REBUILD/` | vacío salvo estructura | `ls` | **NO TOCAR** |

---

## 5. Plan de reconstrucción de assets (alcance cerrado)

Solo se produce lo que la composición exige, respetando las referencias aprobadas:

| # | Recurso nuevo | Método | Motivo |
|---|---|---|---|
| A1 | `menu_composition_clean` — la ilustración de menú **sin** logotipo ni botones horneados, en 2560×1440 | Reconstrucción determinista por capas a partir del arte aprobado (`menu_main_backdrop` a 1280×720 → escalado controlado + parcheado de la zona horneada con contenido coherente del propio arte) | D-01/H8 |
| A2 | `logo_deadbeat_layers` — logotipo recortado a su caja real, con transparencia y sin halo | Extracción determinista del logotipo existente | permite escala y animación sin caja negra |
| A3 | `emblem_fox_crown_glow` — emblema con halo de neón para LOADING | Derivado del emblema aprobado | pantalla de carga propia |
| A4 | Set de 4 iconos de estado del menú (32×32, 2 colores) | Dibujados a partir de la paleta de la biblia (`#ff2d7a`, `#22d3ee`, `#0a0c12`) | selección/deshabilitado legibles |

**No se generan**: protagonista, logotipo nuevo, ilustración nueva, retratos, ni ningún asset de HUB/combate (fuera de alcance).

---

## 6. Restricciones que la implementación debe respetar

1. No se edita `index.html` a mano: se edita `src/*` y se regenera con `tools/build_active_html.py` (conserva las aserciones anti-duplicado).
2. No se cambia el motor, ni el combate, ni el HUB, ni la generación procedural, ni el Director.
3. `DDC_COVER` debe seguir existiendo (es el dueño legado de `#start-btn` y de la música del menú) pero nunca debe pintar ni capturar teclado.
4. `DD_CINE.playIntro` se reutiliza como INTRO canónica; no se implementa una segunda cinemática.
5. La música del menú es la de `DDC_COVER.music`; la de partida es la de `DMO_MUSIC`. La FSM arbitra; no se crea un tercer motor.
6. El guardado es de "meta-progreso", no de partidas a medias. `CONTINUAR` y `SELECCIÓN DE PARTIDA` deben decirlo sin inventar slots.
