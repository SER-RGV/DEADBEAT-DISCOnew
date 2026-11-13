# Inventario técnico histórico — DEADBEAT DISCO (Fase 0.2)

> **Documento de referencia histórica, no fotografía del repositorio actual.** Describe la build original analizada el 2026-11-02. Para el estado vigente consulta [CURRENT_STATE.md](CURRENT_STATE.md), el [inventario de archivos](docs/REPORTS_INDEX.md) y el [README](README.md). No extrapoles sus recuentos, versiones o conclusiones a las builds actuales.

- Fecha: 2026-11-02.
- Fuente: lectura íntegra de `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` (13.380.910 bytes, 19.835 líneas, SHA-256 `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a`) y de los 4 archivos de `main` en el commit `09df237d5f98de7aee8b0499648610acdf1bae71`.
- Método: análisis estático (lectura de bytes, recorrido con `HTMLParser`, conteo de etiquetas/globales/URIs, compilación de los bloques JS con `vm.Script`, decodificación Base64, validación del JSON, hashes Git).

## Leyenda de estado — lectura obligatoria

| Marca | Significado |
|---|---|
| **[IDENTIFICADO]** | Comprobado de forma estática sobre el archivo completo: existe, está medido y/o se ha verificado su sintaxis o integridad. |
| **[DECLARADO]** | Afirmado por comentarios, metadatos, manifiesto embebido o `CURRENT_STATE.md`. No verificado de forma independiente. |
| **[NO PROBADO]** | Requiere ejecución en navegador. **Sin resultado en esta fase.** |

**Ningún elemento de este inventario ha sido probado en ejecución.** La columna de estado indica solo qué se ha podido constatar leyendo el archivo. El plan para probarlos es `VALIDATION_PLAN.md`.

---

## 1. Sistemas existentes

Objetos globales `window.*` detectados en el HTML (nº de apariciones entre paréntesis). Todos **[IDENTIFICADO]** en cuanto a su presencia; su comportamiento **[NO PROBADO]** y, cuando procede, **[DECLARADO]** por las cabeceras de módulo.

| Sistema / global | Apariciones | Función según cabeceras y comentarios internos |
|---|---|---|
| `DMO_HUB` | 41 | Refugio «THE LAST AFTERPARTY», estaciones, residentes **[DECLARADO]** |
| `DMO_FLOOR`, `DMO_FLOOR_ANIM`, `DMO_LAYOUT`, `DMO_DUNGEON` | 19 / 19 / 2 / 6 | Generación de pisos, muros, puertas, escaleras/grieta, animación de suelo **[DECLARADO]** |
| `DMO_MUSIC` | 11 | Gestor musical centralizado, estados HUB/DESCENT/COMBAT/BOSS… **[DECLARADO]** |
| `DMO_PROG`, `DMO_PROG_TEST` | 2 / 1 | v8.7 «Progresión Viva»: pactos de cabina, rutas de incursión, frecuencias perdidas, ecos del refugio **[DECLARADO]** |
| `DMO_CINE`, `DMO_STORY`, `DMO_SEMI2D` | 1 / 1 / 1 | Cinemáticas (FLOORDROP v3.6), narrativa, fusión 2D/2.5D **[DECLARADO]** |
| `DMO_ATMOS` | 1 | ILT Atmosphere v9.2: bloom (screen) + viñeta, `state.version = "9.2.0-atmos"` **[IDENTIFICADO]** |
| `DDC_COVER` | 8 | Portada/intro, ajustes `ddc_cover_settings_v1` **[IDENTIFICADO]** |
| `DMO_BOOT46` | 10 | Arranque/comprobación de sistemas **[DECLARADO]** |
| `DMO_ILT`, `DMO_V88` | 1 / 1 | Módulos ILT v9.0 y rediseño v8.8 **[DECLARADO]** |
| `DMO_ART_DIRECTION`, `DMO_INFERNAL_ART`, `DMO_REFERENCE_ROOM_ASSETS`, `DMO_MASTER_RECONSTRUCTION`, `DDM_ART81`, `DDM_ART82`, `DDM_ART_V84`, `DDM_POLISH8`, `DDM_ASSET_PACK`, `DDM_SHOP_V85` | 1–5 | Dirección de arte, atlas y reconstrucción modular de assets **[DECLARADO]** |
| `PLAYER_ANIMATION_STATES`, `WEAPON_ANIMATION_STATES`, `ANIMATION_FRAME_DURATIONS`, `ACCESSORIES`, `ARTIFACTS`, `SYNERGIES` | 1–3 | Tablas de animación/equipamiento **[IDENTIFICADO]** como símbolos presentes |
| `DMO_ORGANIC_DEBUG`, `DMO_ART_TEST` | 1 | Ganchos de depuración/QA **[DECLARADO]** |

Cabeceras de módulo localizadas en el código: v3.2 Organic Upgrade, v3.5 Full Game Pixel-Art Unification, v3.6 DMO_MUSIC, v5.0 Full Visual & Modular Asset Reconstruction, v8.4 Master Art Direction, v8.7 Progresión Viva, ILT v9.0, ILT Atmosphere v9.2.

Metadatos `<meta>` **[IDENTIFICADO]**: `version=8.6.0-dungeon`, `art-build=8.3.0-gamefeel-rigfix`, `build=3.6.0-descent-music … base 2.89.0-armas120 · motor DMO 2.86.0/3.2.0-organic`, `dmo-rooms=1`, `charset=UTF-8`, viewport.

Contenido de juego **[DECLARADO]** por comentarios y manifiesto: nueve círculos + Núcleo Final, HUB, jefes 0-9, DJ-Director, arsenal de 120 armas (el manifiesto dice «121 HD weapons»), economía, logros, guardado. **Discrepancia documental no resuelta** entre 120 y 121 armas y entre las etiquetas de versión.

## 2. Módulos JavaScript

12 bloques `<script>`; 10 ejecutables, 2 de datos. Los 10 ejecutables **compilan sin error de sintaxis** con `vm.Script` (Node 22) **[IDENTIFICADO]**. Ninguno ha sido ejecutado **[NO PROBADO]**.

| # | Caracteres | Tipo / atributos | Contenido identificado |
|---|---|---|---|
| 1 | 735 | JS | Sonda de `localStorage` (`__dmo_visor_ls_probe__`) con *shim* en memoria si el almacenamiento falla |
| 2 | 4.337 | JS | *Polyfills* (`Array.prototype.at`, etc.) |
| 3 | 912.150 | JS | `window.__T3B_IMAGES` = array de 10 WebP Base64 |
| 4 | 1.765.165 | JS | `window.__ILT_DATA` = objeto de 11 PNG Base64 (jefes, p. ej. `boss_01_anden`) |
| 5 | 1.073.161 | JS | `window.__HD_DATA` = 163 imágenes (162 PNG + 1 WebP), claves tipo `weapons/weapon_c003_laser.png` |
| 6 | **8.552.970** | JS | Motor principal minificado; incluye `DDM_V5_ASSET_DATA` (111 imágenes: 103 WebP + 8 PNG) en la línea 13.168 (4.587.678 caracteres) |
| 7 | 4.396 | `text/plain`, `id=pixel-font-license` | Texto completo de la licencia SIL OFL 1.1 de Pixelify Sans (no es JS) |
| 8 | 45.559 | JS, `id=ddc-cover-js` | Lógica de portada/intro, WebAudio propio, navegación por foco |
| 9 | 7.322 | `application/json`, `id=ddm-continuation-manifest` | Manifiesto de continuación `7.15.0-complete`; **JSON válido** (no es JS) |
| 10 | 9.174 | JS | ILT Atmosphere v9.2, `window.DMO_ATMOS` |
| 11 | 1.097 | JS | Cargador de desafío Cloudflare (ray `a54578e76f52d872`) |
| 12 | 1.097 | JS | Cargador de desafío Cloudflare (ray `a545cfe0d8d4c69e`) |

Los bloques 11 y 12 son idénticos salvo `r`/`t`/`ray`. Ver `CLOUDFLARE_SCRIPTS.md`. **No se han eliminado** en esta fase.

## 3. Estructura CSS

31 bloques `<style>` con 31 cierres **[IDENTIFICADO]**. 1 `@font-face`, 18 declaraciones `image-rendering`, 28 llamadas `url()` (todas con `data:` o SVG inline). Sin `@import`, sin `<link>` externo.

| # | Caracteres | `id` del bloque | # | Caracteres | `id` del bloque |
|---|---|---|---|---|---|
| 1 | 14.289 | — | 17 | 8.016 | `dmo-compact-hud-css` |
| 2 | 2.901 | `dmo-semi2d-fusion` | 18 | 8.275 | `dmo-roguelite71-css` |
| 3 | 1.661 | `round-100-victory-ending` | 19 | 1.205 | `explore72-style` |
| 4 | 478 | `dmo-round-objectives` | 20 | 138.399 | `deadbeat-pixel-art-v282` |
| 5 | 10.280 | `dmo-ui-ux-v227` | 21 | 356 | `art-direction-283` |
| 6 | 10.052 | `dmo-ui-minimal-v228` | 22 | 430 | `visual-v285-css` |
| 7 | 554 | `dmo-dj-contracts-v229` | 23 | 22.214 | `ddc-cover-css` |
| 8 | 3.892 | `arcade-port` | 24 | 113 | `dmo-floordrop-v34-css` |
| 9 | 6.369 | `dmo-visual-v242` | 25 | 11.944 | `dmo-hub-v35-css` |
| 10 | 3.705 | `dmo-v245-mobile-comfort` | 26 | 2.294 | `dmo-d1-visual-v35-css` |
| 11 | 13.268 | `dmo-v246-command-ui` | 27 | 2.899 | `deadbeat-infernal-direction-v1` |
| 12 | 2.394 | `dmo-v248-mobile-simple` | 28 | 4.862 | `ddm-master-ui-v5` |
| 13 | 35.282 | `dmo-v249-neo-noir` | 29 | 3.005 | `deadbeat-v82-final-ui` |
| 14 | 218 | — | 30 | 5.219 | `prog87-style` |
| 15 | 830 | — | 31 | 6.744 | `ddc-v88-redesign` |
| 16 | 3.149 | — | | | |

Estructura general del documento **[IDENTIFICADO]**: 1 `<html>`, 1 `<head>`, 1 `<body>`, 8 `<meta>`, 269 atributos `id=` detectados en el texto del archivo, 9 etiquetas `<svg>` detectadas. El diseño responsive/adaptativo y los efectos visuales están **[DECLARADOS]** en el CSS pero **[NO PROBADOS]** en pantalla.

## 4. Canvas

4 elementos `<canvas>` reales **[IDENTIFICADO]**; su renderizado **[NO PROBADO]**:

| `id` | Atributos | Uso declarado |
|---|---|---|
| `game` | `width=480 height=640` | Lienzo principal del juego **[DECLARADO]** |
| `minimap` | `width=88 height=66`, `role=img`, etiqueta «Minimapa de la sala» | Minimapa **[DECLARADO]** |
| `menu-canvas54` | `width=960 height=540`, `aria-hidden` | Lienzo de menú **[DECLARADO]** |
| `ddc-fx` | `aria-hidden` | Efectos de portada **[DECLARADO]** |

1 elemento `<img id="ddc-img">` con WebP Base64 y texto alternativo **[IDENTIFICADO]**; 61 referencias a `getContext`, 120 a `canvas`, 3 a `devicePixelRatio`, 12 a `requestAnimationFrame` **[IDENTIFICADO]** como texto.

## 5. Assets integrados

300 URIs `data:…;base64,` **[IDENTIFICADO]**, **300/300 decodifican sin error** con validación estricta, 8.178.730 bytes binarios totales:

| Tipo | Cantidad | Bytes decodificados | Origen |
|---|---|---|---|
| `image/png` | 181 | 2.631.302 | bloques 4, 5, 6 + CSS |
| `image/webp` | 118 | 5.468.268 | bloques 3, 5, 6 + CSS |
| `font/ttf` | 1 | 79.160 | CSS (`@font-face`) |

Distribución por bloque: script 3 → 10 WebP; script 4 → 11 PNG; script 5 → 163 (162 PNG + 1 WebP); script 6 → 111 (103 WebP + 8 PNG); CSS → 4 WebP + 1 TTF. Existen además 3 `url(data:image/svg+xml,…)` inline (no Base64).

Manifiesto embebido `ddm-continuation-manifest` **[DECLARADO]**: 47/47 sets modulares pixel-art (Hub, Círculos I-IX, Núcleo Final), 100 slots V5, 165 sprites HD, 20/20 frames de jefe, `pendingSlots: []`, contratos intactos (`player_*`, 121 armas HD, físicas, colisiones, `Ot.doors`, posiciones de estaciones, combate, audio, guardados), estilo «16-bit cyber-gothic nightclub», croma `#00FF00`/`#FF00FF`, exportación WebP calidad 90. Estas cifras proceden del propio manifiesto y **no se han contrastado con los binarios uno a uno** más allá del recuento y la decodificación.

**No se ha regenerado, sustituido ni eliminado ningún asset** en esta fase.

## 6. Fuentes

- **Pixelify Sans** **[IDENTIFICADO]**: 1 `@font-face` con `data:font/ttf;base64,` (79.160 bytes).
- Licencia **[IDENTIFICADO]**: SIL Open Font License 1.1, texto completo en el bloque 7, «Copyright 2021 The Pixelify Sans Project Authors», referencias `https://github.com/eifetx/Pixelify-Sans` y `https://scripts.sil.org/OFL`.
- No hay otras fuentes ni `<link>` tipográficos. La aplicación visual de la fuente en pantalla está **[NO PROBADA]**.

## 7. Sistemas de guardado

54 referencias a `localStorage`, 4 a `sessionStorage`, 0 a `indexedDB` **[IDENTIFICADO]**. Claves literales relevantes:

| Clave | Ámbito declarado |
|---|---|
| `dmo_hub_v1` | Guardado principal del HUB **[DECLARADO]** |
| `dmo_progression_v87` / `dmo_progression_v87_session` | Persistencia separada de la progresión v8.7 **[DECLARADO]** |
| `ddc_cover_settings_v1` | Ajustes de portada (volumen, mute, fx, ui) **[IDENTIFICADO]** |
| `dmodisco_best_round_v1`, `dmodisco_best_v5`, `dmodisco_best_combo_v216`, `dmodisco_currency_v1`, `dmodisco_ach_v1` | Récords, economía, logros **[DECLARADO]** |
| `dmo_victories_v214`, `dmo_roll_v271` | Contadores **[DECLARADO]** |
| `__dmo_visor_ls_probe__` | Sonda temporal (se escribe y se borra) **[IDENTIFICADO]** |

El bloque 1 instala un *shim* en memoria si `localStorage` lanza excepción **[IDENTIFICADO]**. La persistencia efectiva, la carga de partidas antiguas y la ausencia de duplicados están **[NO PROBADAS]**. El guardado depende del origen del navegador: servir el HTML desde otro origen o desde `file://` puede cambiar su comportamiento **[NO PROBADO]**.

## 8. Dependencias

**Dependencias externas de juego: ninguna detectada** **[IDENTIFICADO]**: 0 `fetch`, 0 `XMLHttpRequest`, 0 `import()`, 0 `importScripts`, 0 `Worker`, 0 `WebSocket`, 0 `@import`, 0 `<link>`, 0 `<script src=…>` de juego. Las 6 URLs `http(s)://` del archivo son 4 espacios de nombres `http://www.w3.org/2000/svg` y 2 enlaces de licencia (Pixelify Sans / OFL), todos como texto.

APIs de navegador usadas **[IDENTIFICADO]** (recuentos de apariciones en el texto): `createElement` 211, `getContext` 61, `AudioContext` 5, `requestAnimationFrame` 12, `getGamepad` 7 / `Gamepad` 11, `matchMedia` 11, `devicePixelRatio` 3, `visibilitychange` 2, eventos `pointer*` 10, `requestFullscreen` 1, `performance.now` 46.

**Excepción — scripts residuales** **[IDENTIFICADO]**: los bloques 11 y 12 solicitan `/cdn-cgi/challenge-platform/scripts/jsd/main.js?ray=…` relativo al origen que sirva la página. Son inyección del hosting, no dependencia del juego; se documentan en `CLOUDFLARE_SCRIPTS.md` y **permanecen intactos**.

No hay `package.json`, `node_modules`, manifiesto de dependencias, CI/workflows ni releases en el repositorio **[IDENTIFICADO]**.

## 9. Limitaciones conocidas

1. **Sin validación en navegador** **[NO PROBADO]**: inicio, assets en pantalla, canvas, movimiento, combate, habitaciones, transiciones, guardado, audio y gamepad. `CURRENT_STATE.md` ya lo declaraba pendiente; sigue pendiente.
2. **Entorno sin navegador** en esta sesión (sin Chromium/Firefox/Playwright/Puppeteer/Selenium): impide ejecutar el plan de validación aquí **[IDENTIFICADO]**.
3. **Documentación históricamente mínima**: `README.md` era un título de 16 bytes (ampliado en Fase 0.2); `CHANGELOG.md` se llamaba `HANGELOG.md`; no hay LICENSE, `.gitignore`, tests ni CI **[IDENTIFICADO]**.
4. **Solo 4 archivos** en `main`. Los comentarios citan builds y documentos ausentes del repositorio (p. ej. `uploads/DEADBEAT_DISCO_v8_6_STAIRS_WALLS_DOORS.html`, `CHANGELOG_V8_4_ART.md`, `INFORME_D1`, `DEADBEAT_DISCO_MUSIC_DIRECTION.md`) **[IDENTIFICADO]**. No existe historial de versiones previas que recuperar dentro del repo.
5. **Versionado incoherente**: 120 vs 121 armas; `version=8.6.0-dungeon` frente a módulos v8.7/v8.8/v9.2; nombre de archivo `v9_t3_fase1b_cache_probe` **[IDENTIFICADO]**.
6. **Monolito de 13,38 MB** con una línea de 4.587.678 caracteres: diffs y revisiones manuales poco prácticos **[IDENTIFICADO]**.
7. **Dos cargadores Cloudflare duplicados** con *ray IDs* distintos, pese a comentarios internos (v3.1, v3.5, v8.8) que afirman haberlos eliminado **[IDENTIFICADO]**. Pueden generar peticiones de red y ruido en consola; efecto real en navegador **[NO PROBADO]**.
8. **Clon Git shallow**: 1 commit local de los 6 de `main` **[IDENTIFICADO]**. La consulta de protección de rama devolvió 403 con el token de integración (no afecta al push en rama de trabajo).
9. **Contratos no auditados**: la compatibilidad entre módulos aditivos y el motor, y la integridad funcional de sistemas, están **[NO PROBADOS]**. No se ha modificado ningún contrato en esta fase.

## 10. Separación explícita: identificado frente a no probado

| Ya identificado / verificado estáticamente | Todavía no probado (requiere navegador) |
|---|---|
| Existencia, tamaño y hash de la build y de su copia de seguridad | Que el juego arranque y muestre la portada |
| Estructura HTML: 31 `<style>`, 12 `<script>`, 4 `<canvas>`, 8 `<meta>` | Que los 300 assets se carguen y se dibujen sin errores |
| Sintaxis de los 10 bloques JS ejecutables | Que los 4 canvas rendericen contenido |
| Validez del JSON del manifiesto | Movimiento, colisiones y combate |
| Decodificación 300/300 de los Base64 | Generación de habitaciones y transiciones entre círculos |
| Inventario de globales, claves de guardado y APIs usadas | Guardado y recuperación de partida |
| Ausencia de dependencias de red para el juego | Audio (WebAudio requiere gesto del usuario) |
| Presencia, procedencia y contenido de los 2 scripts Cloudflare | Gamepad y controles táctiles/móviles |
| Permisos de escritura y limpieza del worktree | Efecto real de los scripts Cloudflare en cada origen |

Las comprobaciones de la columna izquierda son de archivo, **no** pruebas funcionales; no deben interpretarse como «pruebas superadas» del juego.
