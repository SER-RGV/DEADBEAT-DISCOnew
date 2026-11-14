# 01_TECHNICAL_AUDIT.md — Auditoría técnica del Refugio / HUB

DEADBEAT DISCO · FASE 01 · Auditoría y rediseño del Refugio
Rama: `arena/8b71cc96-deadbeat-disconew` (desde `main` `2d1f6e8`)
Estado: **solo auditoría y propuesta** — sin modificaciones destructivas, sin rediseño visual, sin nuevos assets.

---

## 1. Resumen ejecutivo técnico

El Refugio (HUB) es un espacio de zona segura jugable implementado sobre Canvas 2D, con perspectiva isométrica y orden de dibujado tipo "painter's algorithm" (Y-sort). Es un sistema autocontenido en `window.DD_HUB` (`src/dd_hub_system.js`, 512 líneas) que se monta sobre el motor mundial `window.DD_WORLD` (`src/dd_world_renderer.js`) y se activa/desactiva desde el flujo de UI (`window.DD_UI`) y el arranque (`window.DD_BOOT`).

No es un nivel "construido" con mapa de tiles de colisión: es un rectángulo de mundo (`HUB_BOUNDS`) sobre el que se pinta un fondo pre-renderizado en un cache de alta resolución, se colocan props como círculos de colisión suave (pushout), se dibujan NPCs y el protagonista, y se superponen anillos de interacción de estaciones.

---

## 2. Arquitectura

### 2.1 Inicialización y activación

| Paso | Qué ocurre | Archivo / función |
|------|-----------|-------------------|
| Carga del asset del protagonista | Se crea `Image` para `pm_idle_fid_00.png` y se valida que las dimensiones naturales sean 288×512. | `ensureRefugeIdle()` (`dd_hub_system.js`) |
| Entrada al Refugio | `DD_HUB.enter()`: activa `state.active = true`, reubica al protagonista en spawn `(880, 615)`, detiene la simulación del juego vivo (`__DD_BRIDGE.setPaused(true)`), oculta el menú principal y abre un diálogo de bienvenida del DJ ("TEMPO", 5.2 s). | `dd_hub_system.js:138` |
| Salida hacia incursión | `DD_HUB.exitToRun()`: desactiva el HUB, reanuda el motor y lanza `DD_CINE.playCircleDescent(1, triggerRun)` → `__DD_BRIDGE.startRun()` (fallbacks `DDC_COVER.start()` / `#start-btn`). | `dd_hub_system.js:157` |

El HUB se activa desde `DD_UI.arriveAtRefuge(isNew)` (después de la intro cinemática) y desde `DD_BOOT.enterGame()`. El protagonista es controlado exclusivamente por `DD_HUB` dentro del Refugio; fuera, lo pinta el motor de combate (`DD_WORLD.drawProtagonist` / `__DD_BRIDGE.drawPlayerAt`).

### 2.2 Sistemas que intervienen

- **`window.DD_HUB`** (`src/dd_hub_system.js`): bounds, props, estaciones, movimiento (teclado/gamepad), colisión circular pushout, cámara, render del refugio, interacción `[E]/(A)`.
- **`window.DD_WORLD`** (`src/dd_world_renderer.js`): `buildHighResRoomCache`, `drawProp`, `drawDescentPad`, `drawProtagonist`, `drawSoftShadow`, `drawNeonGlow`, `setSmooth`, `PROP_KIND_TO_ASSET`, `CIRCLE_CONFIG`.
- **`window.DD_UI`** (`src/dd_ui_system.js`): `arriveAtRefuge`, `startRunWithDescent`, `openShop/openMap/showDialogue/isModalOpen`, persistencia.
- **`window.DD_BOOT`** (`src/dd_boot.js`): estados `BOOT/LOADING/INTRO/MAIN_MENU/SUBMENU/EXIT/PLAYING`, `enterGame/exitGameToMenu`.
- **`window.DD_CINE`** (`src/dd_cinematic_camera.js`): `playCircleDescent`, `playIntro`, `isBlocking` (secuencias de transición con letterbox).
- **`window.DD_ASSETS`** (`src/dd_asset_registry.js`): manifiesto autogenerado, 269 registrados / 345 planificados.
- **`window.__DD_BRIDGE`**: puente al motor de juego (pausa, `startRun`, `drawPlayerAt`).
- **`ART_PACK/art_pack.js`**: paquete de arte con bloques HUB Tanda 01/02/03/05/06/07/08 y slots V5/T3B.

### 2.3 Estados globales

- `state.active`: booleano que habilita/deshabilita movimiento, render e interacción del HUB.
- `DD_BOOT` estados `BOOT → LOADING → INTRO → MAIN_MENU → ... → PLAYING`. El HUB se pinta mientras el juego está en pausa (`setPaused(true)`), no como un estado de `DD_BOOT` propio.
- `DD_CINE` secuencias bloqueantes (`playIntro`, `playCircleDescent`) congelan el HUB mientras duran (`isBlocking()`).

### 2.4 Carga de recursos

El protagonista del Refugio (`pm_idle_fid_00.png`) se carga directamente mediante `new Image()` en `ensureRefugeIdle()`, **sin pasar por `DD_ASSETS` ni por el pintor del motor**. Los demás recursos (fondo de sala, props, NPCs, suelo, paredes) se obtienen de `window.DD_ASSETS.get(id)`. No hay evidencia de precarga explícita ni de descarga al salir del HUB.

---

## 3. Dimensiones (verificadas contra código)

### 3.1 Mundo y límites

| Magnitud | Valor | Unidad | Origen |
|----------|-------|--------|--------|
| `HUB_BOUNDS` | x:260, y:210, w:1240, h:760 | unidades de mundo | `dd_hub_system.js` |
| Mundo X | 260 → 1500 | unidades de mundo | `x + w` |
| Mundo Y | 210 → 970 | unidades de mundo | `y + h` |
| Spawn protagonista | 880, 615 | unidades de mundo | `dd_hub_system.js` |
| Velocidad de movimiento | 285 | unidades/segundo | `dd_hub_system.js` |
| Margen de paredes | 38 (X), 38+24 (Y arriba) | unidades de mundo | `dd_hub_system.js:update` |
| Área transitable efectiva (antes de pushout) | ~1164 × 684 | unidades de mundo | `(w-76) × (h-76)` aprox. |

### 3.2 Renderizado y cámara

| Magnitud | Valor | Unidad | Origen |
|----------|-------|--------|--------|
| Cache de sala (canvas offscreen) | 1800 × 1180 | píxeles de pantalla | `ensureHubCache` |
| Llamada al cache | `buildHighResRoomCache(cctx, 1800, 1180, HUB_BOUNDS, 0, 777, null)` | — | `dd_hub_system.js` |
| Círculo de sala | 0 (Limbo) | índice | `CIRCLE_CONFIG` |
| Semilla de sala | 777 | — | `dd_hub_system.js` |
| Zoom | `min(1.6, max(1.02, min(viewW/1150, viewH/780)))` | factor | `dd_hub_system.js:render` |
| Cámara X | `px*0.55 + centroX*0.45` | unidades de mundo | `dd_hub_system.js` |
| Cámara Y | `py*0.48 + centroY*0.52` | unidades de mundo | `dd_hub_system.js` |
| Clamp cámara | sala + banda 56 (X) / -150 arriba (Y) | unidades de mundo | `dd_hub_system.js` |

### 3.3 Escala de sprites

| Elemento | Tamaño imagen | Escala en mundo | Origen |
|----------|--------------|-----------------|--------|
| Protagonista (`pm_idle_fid_00.png`) | 288 × 512 px | `drawH = 112` unidades de mundo (cuerpo), `feetY = 505`, `midX = 140`, `bodyH = 462` | `dd_hub_system.js` |
| NPC DJ (`npc_dj_booth_world`) | 384 × 320 px | altura 118 unidades | `dd_hub_system.js` |
| NPC Bartender (`npc_bartender_hub`) | 256 × 320 px | altura 102 unidades | `dd_hub_system.js` |
| NPC Armero (`npc_armorer_hub`) | 256 × 320 px | altura 104 unidades | `dd_hub_system.js` |
| Props | 192–448 px | `drawW = clamp(br*2.55, 64, 240)` | `dd_world_renderer.js` |
| Suelo tile | `floor_00_limbo_marble` 512×512 → tile 256 | repeat | `dd_world_renderer.js` |
| Plataforma de descenso | `threshold_descent_pad` 512 × 320 | estación `descent` r=96 | `dd_asset_registry.js` |

### 3.4 Relación mundo ↔ pantalla

La cámara transforma unidades de mundo a pantalla con `ctx.scale(zoom, zoom)` y `ctx.translate(-camX, -camY)`. No hay conversión isométrica explícita en `DD_HUB` (los sprites ya vienen en proyección isométrica); el Y-sort se hace por coordenada Y de mundo.

### 3.5 Zonas de colisión

- **Paredes/bounds**: clamp rectangular con margen 38 (X) y 38+24 (Y arriba). No hay polígonos de pared; solo el rectángulo de bounds.
- **Props (muebles)**: colisión circular suave (pushout), radio efectivo `minD = (br * 0.72) + 18`, donde `br` es el radio base de cada prop (24–58). El jugador se desliza alrededor del mobiliario, no hay bloqueo duro.
- **Estaciones**: anillo elíptico de interacción `r * 0.72 × r * 0.34`; radio de activación `r` (95–106 unidades). Prompt `[E]/(A)` cuando el jugador está dentro de `r`.

---

## 4. Rendimiento (estimado desde código, no medido)

- **Sprites renderizados por frame**: fondo cacheado (1 imagen 1800×1180) + 22 props + 3 NPCs + 1 protagonista + 2 arañazos de neón (candelabros/lámparas) + 2 arañazos de farol dorado + anillos de 4 estaciones + spotlight + halo del jugador. Total aprox. 35–40 operaciones `drawImage` por frame.
- **Recursos cargados en HUB**: `pm_idle_fid_00.png` (288×512), fondo de sala (cache), props de `ART_PACK`/`DD_ASSETS`, NPCs, `prop_chandelier_gold`, `prop_hub_fox_neon`, `threshold_descent_pad`.
- **Imágenes duplicadas**: el protagonista existe en varias versiones (`pm_idle_00.png`, `pm_idle_fid_00.png`, `pm_idle_fid_00_v1.png`, `IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY/pm_idle_0[0-3].png`) — ver `03_ART_AUDIT.md` y `04_ASSET_INVENTORY.md`.
- **Orden de dibujado**: Y-sort sobre lista combinada de props + NPCs + jugador. El protagonista se pinta en su posición Y correcta (`state.py`), por lo que puede quedar por detrás o delante de props según su Y.
- **Elementos fuera del área visible**: el cache de sala se dibuja entero `(0,0)` sin recorte por viewport; el clamp de cámara evita mostrar fuera de la sala+banda, pero el fondo cache se dibuja completo.
- **Errores de carga conocidos potenciales**: `ensureRefugeIdle()` marca `failed = true` si la imagen no carga o si sus dimensiones naturales no son 288×512; en ese caso el protagonista no se dibuja en el HUB y cae a `W.drawProtagonist` (escala 1.16) y luego a `__DD_BRIDGE.drawPlayerAt`.

> **Nota de QA**: estos datos de rendimiento son estimaciones estáticas del código. No se ha ejecutado el juego para medir FPS, uso de memoria ni tiempos de carga (ver `08_QA_REPORT.md`).

---

## 5. Problemas técnicos detectados

1. **Protagonista fuera del registro de recursos**: `pm_idle_fid_00.png` se carga vía `new Image()` directo, no está en `src/dd_asset_registry.js`. Hay una entrada de manifiesto preparada (`R05B_PROTAGONISTA_MAESTRO_FIDELIDAD`, v2) pendiente de aprobación y no registrada. Riesgo de inconsistencia entre el manifiesto y lo que se renderiza.
2. **Doble camino de dibujo del protagonista**: `drawRefugeIdle` → `W.drawProtagonist` (escala 1.16) → `__DD_BRIDGE.drawPlayerAt`. Tres fallbacks encadenados sin una única fuente de verdad.
3. **Sin colisión de paredes real**: solo un clamp rectangular al bounds. Los props usan círculos de pushout; no hay polígonos de pared ni zonas bloqueadas arquitectónicas.
4. **Cache de sala invalidado solo por `DD_ASSETS.stats().loaded`**: si cambian recursos sin cambiar el contador de cargados, el cache no se refresca.
5. **Protagonista puede quedarse oculto tras props grandes** por Y-sort (no hay sistema de oclusión ni "corte" de pared delante del jugador).
6. **El HUB no es un estado de `DD_BOOT`**: vive como zona segura superpuesta sobre el juego en pausa. Esto simplifica la entrada/salida pero acopla el HUB al puente del motor (`__DD_BRIDGE`).

---

## 6. Conclusión técnica

El Refugio técnicamente funciona: inicializa, activa/desactiva, renderiza, gestiona movimiento, colisiones suaves, cámara con zoom adaptativo y estaciones de interacción. Su arquitectura es ligera y adecuada para una zona segura. Los puntos de riesgo son la gestión del protagonista fuera del manifiesto de assets, los múltiples fallbacks de dibujo y la ausencia de colisión arquitectónica real. Ninguno de estos bloquea la fase de auditoría; se documentan para la propuesta de rediseño (`06_PROPOSED_LAYOUT.md` y `07_TRANSITION_DEPENDENCIES.md`).
