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
