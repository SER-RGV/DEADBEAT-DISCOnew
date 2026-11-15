# TOTAL ART REBUILD — Evidencia de QA real en navegador (2026-11-15)

**Entorno:** Chromium headless (Sparticuz build 153, vía `playwright-core` + `@sparticuz/chromium`, npm registry), viewport 1280×900, servidor estático 127.0.0.1:8123 sirviendo la raíz del repo. SwiftShader (WebGL CPU). El juego real es `index.html` (build activo), no una simulación ni una demo aparte.

**Resultado global (qa_run_report.json / qa_descent_report.json):**
- Arranque sin errores de página, sin 404 (favicon excluido), sin errores de consola.
- `DD_ASSETS.integrity()` → **pass: true, ok: 271/271, 0 errores** (las 271 entradas registradas decodifican con tamaño esperado).
- Flujo completo verificado en vivo: carga → intro (se salta con tecla) → menú → NUEVA PARTIDA → descenso → **Refugio (HUB) funcional** (estado `active`, estaciones vivas, `protagonist: idle_07b`) → andar → **pad de descenso ([E])** → **primera sala de combate (CÍRCULO I · LIMBO, Ronda 1) renderizada** con HUD intacto y enemigo-preview funcional.

| Captura | Contenido |
|---|---|
| `01_boot.png` | Pantalla de carga + logo (primera ejecución) |
| `02_menu.png` | Intro cómic v2 en reproducción (skippable), menú accesible tras salto |
| `03_refugio_hub.png` | **Refugio reconstruido (TR_T01):** nuevo suelo damero negro/granate/magenta + **mezzanine de los 9 círculos** (arco obsidiana + glow violeta/cian…) sobre el muro norte · sofás chaise magenta TR_T02 · IDLE 07B del protagonista · pad de descenso cian intacto · HUD RESTART intacto |
| `04_refugio_walk.png` | Ídem con el personaje desplazado (colisiones y cámara estables) |
| `05_descent_pad.png` | Jugador sobre el pad de descenso; prompt «Pulsa [E] / (A) para descender al Círculo I · Lujuria» (estación `descent` detectada) |
| `06_first_room.png` | Sala real de combate LIMBO (VESTÍBULO DE TURNOS, Ronda 1 · Oleada Estándar): room cache con `floor_00_limbo_marble`, muros góticos, cajas con sigilo magenta, HUD completo — prueba de que la transición HUB→combate funciona con el registry nuevo |

**Límites honestos de esta evidencia:**
- Muestra LIMBO (floor_00, no regenerado) — **no** hay captura del suelo Lujuria/Gula/… en sala real, porque llegar al Círculo II exige jugar varias pisos; los suelos nuevos están verificados a nivel de *carga* (271/271) y de *asset* (tiles 2×2 sin costuras), no de píxel en pantalla de combate.
- El mezzanine de portales es decorativo (sin estaciones ni progresión); sus extremos quedan parcialmente tapados por el HUD superior a esta resolución.
- Sin comparativa de rendimiento formal (30 s estables sin errores, no fps medido).
- El protagonista en combate usa los sprites del motor (sin cambios); IDLE 07B solo en el Refugio, como está diseñado.

**Reproducir:** `python3 -m http.server 8123 --bind 0.0.0.0` en la raíz del repo; `npm i playwright-core @sparticuz/chromium` fuera del repo; `node ART_TOOLS/qa/qa_flow.mjs` (y `qa_descent.mjs` para el descenso). Harness original ejecutado: `/tmp/qa_browser/*.mjs` (idénticos).

## Pasada TR_W1 (2026-11-15, tras TR_T04–T10)
Segunda generación clase B, misma ID/ruta: `floor_00_limbo_marble`, `wall_pillar_obsidian`,
`threshold_descent_pad`, `door_gothic_closed`, `door_gothic_open`.
- `06_first_room.png` demuestra el **suelo Limbo de mármol agrietado nuevo en sala de combate real** (VESTÍBULO DE TURNOS · Ronda 1).
- `05_descent_pad.png` demuestra el **pad de descenso cian nuevo bajo los pies del protagonista** en el Refugio.
- Integridad tras rebuild: **271/271 pass, 0 errores** (qa_run_report.json). QA headless: 0 pageErrors, 0 failedReqs, 0 console errors.
- **Rechazados y revertidos** (composición encuadrada al fondo, lienzo casi vacío): `wall_panel_gothic_niche`, `wall_panel_heavy_base`, `wall_panel_vip_window`, `wall_core_monolith`, `portal_avaricia_gold`. Requieren regeneración v2 con «panel en retrato llenando 95% del lienzo vertical». Siguen Pendiente en la matriz.

## Pasada TR_W1b (2026-11-15, segunda tanda W1)
Aprobados e integrados (mismos IDs/rutas, integridad navegador **271/271 pass**): `wall_panel_gothic_niche`, `wall_panel_vip_window`, `portal_avaricia_gold`, `portal_baroque_gold`, `floor_10_hub_checker` (damero mármol con reflejos magenta/cian, seamless).
**Rechazados y revertidos** (extracción sobre fondo negro destruye piedra oscura/violeta): `wall_panel_heavy_base`, `wall_core_monolith`, `door_arched_open`, `door_stained_closed`, `door_vip_crimson`.
→ Lección: los assets con mucha piedra negra/oscura se regeneran con **fondo verde chroma #00ff00** (rama dedicada del extractor). v3 pendiente.

## Pasada TR_W1c (2026-11-15, tercera tanda W1 — verde chroma #00ff00)
Regla aplicada: assets con piedra/obsidiana oscura se generan sobre **verde #00ff00**; el extractor usa su rama chroma y ya no destruye el sujeto.
- **Aprobados e integrados** (integridad navegador **271/271 pass**): `wall_panel_heavy_base` (V Herejía), `wall_core_monolith` (IX Núcleo), `door_arched_open`, `door_stained_closed`, `door_vip_crimson`, `wall_panel_tall_neon`, `prop_gilded_altar`, `prop_arcane_pedestal` (restos verdes despillados en postproceso), `floor_11_vip_velvet` (damasco VIP), `prop_gothic_statue`.
- `prop_gothic_statue`: la materia prima venía con sujeto pequeño en lienzo (contain fit → estampado diminuto). Se mantiene por ser mejor arte que el provisional; **pendiente v2 con encuadre de lienzo completo** (el modelo no respetó «fill the entire frame»).
- `prop_arcane_pedestal`: despillado con `green_excess = G - max(R,B) > 12` (568 px); runas cian intactas.
- Walls W1 (00–11): diseño en retrato verificado, extracción limpia sobre verde.
