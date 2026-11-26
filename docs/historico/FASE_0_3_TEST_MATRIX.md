# Matriz de pruebas — Fase 0.3 (QA funcional de la build original)

Fecha: 2026-11-02. Rama: `arena/b89cd6bc-deadbeat-disco`. Build: `v9_t3_fase1b_cache_probe.html` (SHA-256 `b2ef4ad8…d4a`, sin modificar).
Entorno: Chromium Headless 153.0.8010.0 + playwright-core 1.64.1, servidor HTTP local `127.0.0.1:8123`, contextos aislados. Detalle completo en `FASE_0_3_EVIDENCE/ENVIRONMENT.md`.

**Estados:** `SUPERADA` (ejecutada y cumple) · `FALLIDA` (ejecutada y presenta fallo) · `PARCIAL` (funciona con limitaciones) · `PENDIENTE` (no ejecutada) · `BLOQUEADA` (imposible por limitación externa).
**Regla aplicada:** ningún `SUPERADA` se ha otorgado por inspección de código; solo por ejecución en navegador.

> **Actualización Fase 0.3.1 (2026-11-02):** las filas V-05 y V-07 siguientes son el **histórico** de Fase 0.3. La **sección 6** registra las nuevas ejecuciones reales que rectifican la interpretación de `balas:0` y del estado `TRANSITION`. No se borra ningún resultado previo.

## Resumen

| ID | Ámbito | Estado | Reproducibilidad | Incidencias |
|---|---|---|---|---|
| V-01 | Arranque | **PARCIAL** | 3/3 sesiones | INC-003 (P3, externo) |
| V-02 | Assets | **PARCIAL** | 3/3 sesiones | INC-004 (P3) |
| V-03 | Canvas y renderizado | **PARCIAL** | 3/3 sesiones | INC-004, INC-006 (P3) |
| V-04 | Movimiento | **PARCIAL** | 2/2 sesiones con `px/py` | — |
| V-05 | Combate | **PARCIAL** (subprueba «disparo primario» **FALLIDA** en este entorno) | 2/2 sesiones limpias | **INC-001 (P1)** |
| V-06 | Generación de habitaciones | **PARCIAL** | 2/2 sesiones | INC-007 (P3, observación) |
| V-07 | Transiciones y progresión | **PARCIAL** | 3/3 (1 con bloqueo) | INC-002 (P2) |
| V-08 | Guardado y recuperación | **PARCIAL** | 2/2 sesiones | — |
| V-09 | Audio | **PARCIAL** | 3/3 sesiones | Limitación de entorno |
| V-10 | Gamepad | **BLOQUEADA** | n/a | Sin dispositivo físico |
| V-11 | Scripts residuales Cloudflare | **SUPERADA** | 3/3 cargas | INC-003 (P3) |

Totales: **1 SUPERADA · 8 PARCIAL · 0 FALLIDA global · 1 BLOQUEADA · 0 PENDIENTE pura** (hay subpruebas pendientes detalladas más abajo). **0 pruebas declaradas superadas sin ejecución.**

---

## V-01 — Arranque · **PARCIAL**

- **Entorno:** Chromium 153 headless, 1280×900, HTTP local, contexto aislado.
- **Procedimiento:** `page.goto(..., waitUntil:'load')` + espera de 2–4 s; listeners de consola, `pageerror`, `request`/`requestfailed`/`response`, `crash`; inspección de `readyState`, portada, globales, canvas.
- **Resultado observado:** carga completa en **17.429 ms**, `document.readyState=complete`, portada «PULSA PARA ENTRAR AL CLUB» visible, menú INICIAR/CONTINUAR/… operativo por teclado, **41 globales** del motor inicializados, `DMO.read().running=false` antes de iniciar y `true` tras `ENTER`, **0 `pageerror`**, **0 crashes**, **0 bloqueos**. Errores de consola: **2** («Failed to load resource: 404»), ambos de los scripts Cloudflare.
- **Evidencia:** `01_boot_cover.png`, `02_menu_active.png`, `log_console_network_boot.json`, `log_hub_start_audio.json`.
- **Errores de consola:** 2×404 externos; **0 errores JavaScript del juego**.
- **Reproducibilidad:** 3/3 sesiones (discover, stage_b/c, stage_i/k/l). Tras recarga se duplican a 4 (2 por carga).
- **Clasificación:** PARCIAL porque el criterio «recursos que no cargan» registra 2 recursos fallidos, aunque son externos al juego y se tratan en V-11/INC-003. El arranque del juego en sí cumple.

## V-02 — Assets · **PARCIAL**

- **Procedimiento:** inspección en vivo de `document.images`, `document.fonts`, bundles `window.__T3B_IMAGES` / `__ILT_DATA` / `__HD_DATA`, `DMO_ILT.audit()`, y comprobación **visual en capturas** de que arte, HUD, medallón, estaciones y sprite del jugador se dibujan.
- **Resultado observado:** `#ddc-img` `complete=true`, `naturalWidth=1672`, `naturalHeight=941`; `document.fonts.status='loaded'`, `check('16px "Pixelify Sans"')=true`; `DMO_ILT.audit()` → `total:11, loaded:11, errors:0`; bundles presentes con 10 / 11 / 163 entradas. Las capturas muestran texturas, props, personajes y tipografía pixel-art renderizados. **Defecto:** múltiples glifos se dibujan como cuadros vacíos («□□□□□□□» en «EL REFUGIO RECUERDA», «□ PROGRESO □», «salas 1/11» en algún rótulo).
- **Evidencia:** `03_hub_render.png`, `05_hub_glyph_defect.png`, `06_campaign_room_limbo.png`, `log_console_network_boot.json`.
- **Errores de consola:** solo los 2×404 externos; sin errores de decodificación de imagen ni de fuente.
- **Reproducibilidad:** 3/3 sesiones.
- **Clasificación:** PARCIAL (carga correcta, defecto visual P3 INC-004).

## V-03 — Canvas y renderizado · **PARCIAL**

- **Procedimiento:** enumeración de `<canvas>` en DOM vivo, dimensiones/rect/estilos, `getImageData` y checksums antes/después de interacciones, redimensionado con `setViewportSize`, capturas.
- **Resultado observado:** **27 `<canvas>`** en ejecución (los 4 del HTML: `game`, `minimap`, `menu-canvas54`, `ddc-fx`, más dinámicos, `ilt-atmos-bloom`, `ilt-atmos-vig`, `v32-preview-canvas`). `#game` pasa de 480×640 (HTML) a **1280×900**, luego **800×600** y **900×700** siguiendo al viewport; `#minimap` 176×126 internos escalado por CSS. Checksums de `#game` y `#minimap` cambian entre capturas → renderizado activo; primer muestreo de `getImageData`: 4096/4096 píxeles no nulos. HUD, minimapa, menús y overlays visibles. Sin errores de renderizado en consola. **Defectos:** glifos «□» (INC-004) y panel de arma solapando la etiqueta «CLIENTE 000» (INC-006, `03_hub_render.png`).
- **Evidencia:** `03_hub_render.png`, `07_combat_state.png`, `08_resized_800x600.png`, `log_console_network_boot.json`, `log_combat_rooms_resize.json`.
- **Errores de consola:** solo 2×404 externos.
- **Reproducibilidad:** 3/3 sesiones; resize verificado en 2 viewports distintos.
- **Clasificación:** PARCIAL por defectos visuales P3, sin fallo funcional del lienzo.

## V-04 — Movimiento · **PARCIAL**

- **Procedimiento:** `page.keyboard.down/up` con `W/A/S/D` y combinaciones; medición con `DMO.debug.state().px/py` (coordenadas vivas) y con `DMO.read()`; comprobación de que los eventos llegan (listener en `document_start`).
- **Resultado observado:** eventos `keydown` reales registrados. Con `px/py`: `A` → Δx −21, `S` → Δy +29, `D` → Δx +25, `W` → Δ(0,0) en la posición de prueba (bloqueo por colisión/límite o estado de transición). En otra sesión, `D` 900 ms desplazó x 1250→1746 e y 1120→890. Diagonal `W+D` ejecutada en `stage_d` (desplazamiento neto acumulado 1250,1120 → 1746,890). `ESPACIO` (esquiva) y `Q` (bomba) responden. `DMO.gamepad.state().active` alterna `keyboard`/`mouse` según el input.
- **Evidencia:** `log_combat_rooms_resize.json`, `log_hub_start_audio.json`, `log_event_listeners.json`, `07_combat_state.png`.
- **Errores de consola:** solo 2×404 externos.
- **Reproducibilidad:** 2/2 sesiones con medición de coordenadas vivas.
- **No verificado:** las 4 direcciones en posición sin obstáculos, diagonales normalizadas, colisiones sistemáticas, límites de habitación y bloqueos del personaje → **subpruebas PENDIENTES** (`MANUAL_PROCEDURE.md`).
- **Clasificación:** PARCIAL.

## V-05 — Combate · **PARCIAL** (disparo primario: **FALLIDA** en este entorno)

- **Procedimiento:** entrada a `CAMPAIGN_ROOM`, generación de un enemigo con los ganchos de QA del propio juego (`DMO.debug.on/forceWave/spawnEnemyAt`), ratón real (`pointermove` + `pointerdown` + `mouseup`) sobre `#game`, muestreo de `balas`, `balasArr`, `enemies`, `fire`, `kills`, `score`; control positivo con `Q` (bomba), `ESPACIO` y `killAll()`; inspección de listeners con CDP.
- **Resultado observado (2 sesiones limpias, `location=CAMPAIGN_ROOM`, `enemies=1`):**
  - Disparo sostenido 1,4–3 s: **`balas:0`, `balasArr:[]`, `fire:false`, `kills:0`, `score:0`, `enemies:1`**.
  - CDP `DOMDebugger.getEventListeners`: `pointerdown`/`pointermove`/`pointerup` en `#game`, y `pointerdown`×2, `mousedown`×1, `mouseup`×1, `click`×2 en `window`. La traza de eventos confirma `pointerdown` real sobre `#game` (clientX/Y 760,420) pero **no aparece el `mousedown` de compatibilidad**.
  - `Q` → **`kills:1`, `score:28`, `enemies:0`**; `killAll()` → `true`. Por tanto el sistema de bajas, puntuación y habilidades funciona.
- **Evidencia:** `07_combat_state.png`, `log_combat_rooms_resize.json`, `log_campaign_progression.json`, `log_event_listeners.json`, `log_circle_api.json`, `log_shooting_sweep.json` (barrida en `TRANSITION`, **no válida**, conservada por transparencia).
- **Errores de consola:** solo 2×404 externos; 0 `pageerror`.
- **Reproducibilidad:** 2/2 sesiones válidas (`stage_i`, `stage_k`); síntoma también en `stage_h`.
- **Clasificación:** PARCIAL global; subprueba «disparo/proyectiles» **FALLIDA en este entorno** → **INC-001 (P1)**, con hipótesis basada en evidencia (supresión del `mousedown` de compatibilidad por `preventDefault()` en `pointerdown` en Chromium 153) **pendiente de confirmación en navegador GUI**.
- **Pendiente:** impacto, daño, hitboxes, recarga, cadencia, cambio de arma, respuesta sonora, y confirmación del disparo en otro navegador.

## V-06 — Generación de habitaciones · **PARCIAL**

- **Procedimiento:** `DMO_DUNGEON.state()` / `audit()` en vivo antes y después de iniciar campaña; navegación con `DMO.debug.exploreNext()`; captura de la sala.
- **Resultado observado:** grafo generado con **12 nodos**, `seed` no nulo, `bossDistance:5` (y 6 en otra semilla), `role:'start'`; `audit()` → `ok:true, errors:[], rooms:12, bossDistance:5`. Tras la transición: `current:'r0'`, `visited:1`, `secured:1`. Tres `exploreNext()` consecutivos → `r0→r1→r2→r3`, `visited:1→4`. La captura `06`/`07` muestra sala «CÍRCULO I · LIMBO», «salas 1/11», paredes, puertas, escalera/ascensor, props y el panel «ARQUITECTURA ARQ100 … OK … errores 0». Antes de generar, `audit()` devuelve `ok:false, errors:['tipos obligatorios','tipos duplicados']` (estado pre-inicialización, INC-007).
- **Evidencia:** `06_campaign_room_limbo.png`, `07_combat_state.png`, `log_campaign_progression.json`, `log_combat_rooms_resize.json`, `log_skip_transition.json`.
- **Errores de consola:** solo 2×404 externos.
- **Reproducibilidad:** 2/2 sesiones.
- **No verificado:** recorrido a pie, accesibilidad de rutas, colisiones de muros/puertas, elementos superpuestos y coherencia espacial completa → **PENDIENTE**.
- **Clasificación:** PARCIAL.

## V-07 — Transiciones y progresión · **PARCIAL**

- **Procedimiento:** clic en compuerta → `ENTER` en INICIAR → **mantener ESC** para omitir cinemática → `startCampaignFromHub(0)` → sondeo de `DMO_HUB.state()` cada segundo.
- **Resultado observado:** compuerta y menú funcionan; la cinemática `intro_turno_001` se omite **manteniendo** ESC (`skips:1`, `skipHold:0.62`, `transitionLock:false`); las pulsaciones sueltas de `ENTER` **no** la omiten (comportamiento coherente con el rótulo «MANTÉN»). `startCampaignFromHub(0)` devuelve `true`; en `stage_i` tras ~13 s → `location:'CAMPAIGN_ROOM'`, `inHub:false`, `transitionsCompleted:1`, `transitionErrors:0`, zona «VESTÍBULO DE TURNOS · ENTRADA SEGURA». En `stage_l` y `stage_m` el estado permaneció **`TRANSITION` durante >35 s / toda la sesión**, con `transitionLock:true` y `transitionsCompleted:0`; en `stage_l` pasó a `CAMPAIGN_ROOM` tras `forceWave()`/`spawnEnemyAt()`.
- **Evidencia:** `04_intro_cinematic.png`, `06_campaign_room_limbo.png`, `log_skip_transition.json`, `log_campaign_progression.json`, `log_event_listeners.json`, `log_shooting_sweep.json`.
- **Errores de consola:** solo 2×404 externos; 0 `transitionErrors`.
- **Reproducibilidad:** transición correcta 1/3; bloqueo observado 2/3 → **INC-002 (P2)**.
- **No verificado:** jefes, eventos de progresión, continuidad del estado del jugador entre círculos → **PENDIENTE**.
- **Clasificación:** PARCIAL.

## V-08 — Guardado y recuperación · **PARCIAL**

- **Procedimiento:** contextos aislados (sin perfil de usuario), volcado de `localStorage` antes/después de `page.reload()`, click en `#audio-btn`, y un segundo contexto con `localStorage`/`sessionStorage` lanzando `SecurityError` (condición **inyectada y documentada**, no verificada como efectiva).
- **Resultado observado:** claves escritas: `dmo_hub_v1`, `dmo_progression_v87`, `dmodisco_a11y_v1`, `dmodisco_muted_v1`. `dmo_hub_v1` **idéntico antes y después de recargar** (`hubVisits:1`, `milestones:['first_hub_visit']`, `story.introSeen:true`, `updatedAt` invariable). `DMO_HUB.state().saveWrites` 0→3, `storageAvailable:true`. En el contexto con la condición inyectada: `readyState=complete`, `running=true` tras `ENTER`, `location:'HUB'`, **0 `pageerror`** — pero también **`lsProbe:"object"`, `storageAvailable:true`, `saveWrites:1`**, es decir, **la inyección no se mantuvo y el caso de almacenamiento realmente no disponible NO queda probado**. La existencia de un *shim* en memoria (bloque 1 del HTML) es una hipótesis no confirmada por esta medición. No se sobrescribió ningún dato de usuario.
- **Evidencia:** `09_no_storage_boot.png`, `10_after_reload.png`, `log_audio_save_storage.json`, `log_campaign_progression.json`.
- **Errores de consola:** 2×404 externos en ambos contextos.
- **Reproducibilidad:** 2/2 sesiones.
- **No verificado:** monedas/CR, logros, configuración avanzada y recuperación de partida en curso; **comportamiento con almacenamiento bloqueado de verdad** (configuración real del navegador), que requiere repetir la prueba → **PENDIENTE**.
- **Clasificación:** PARCIAL.

## V-09 — Audio · **PARCIAL**

- **Procedimiento:** envoltorio observador de `AudioContext` (solo lectura de `.state`), gesto de usuario real (clic/`ENTER`), `DMO_MUSIC.audit()`, click en `#audio-btn`, lectura de `dmodisco_muted_v1`.
- **Resultado observado:** `AudioContext` disponible; `state=null` antes del gesto y **`running`** tras él; `DMO_MUSIC.audit()` → `ok:true, version:'3.8.0-music', singleSequencer:true, contextState:'running', filterInserted:true, hubProfileRegistered:true, invasionProfileRegistered:true, circleProfilesIntact:true, leitmotivIntact:true, errors:0`. El botón de audio escribe `dmodisco_muted_v1: null → "1"`. La portada muestra «MUSICA ON / INFERNO DROP · 150 BPM».
- **Evidencia:** `02_menu_active.png`, `log_hub_start_audio.json`, `log_audio_save_storage.json`, `log_campaign_progression.json`.
- **Errores de consola:** solo 2×404 externos; sin errores de autoplay ni de WebAudio.
- **Limitación del entorno:** Chromium headless lanzado por Playwright incluye `--mute-audio` y no hay dispositivo de salida: **no se puede verificar la señal audible**, ni los cambios de tema HUB→COMBATE→BOSS ni los efectos. Esto es un fallo del entorno, no del juego, y se distingue explícitamente.
- **Reproducibilidad:** 3/3 sesiones.
- **Clasificación:** PARCIAL.

## V-10 — Gamepad · **BLOQUEADA**

- **Procedimiento:** `navigator.getGamepads()`, `DMO.gamepad.state()`, CDP `DOMDebugger.getEventListeners(window)`.
- **Resultado observado:** `navigator.getGamepads()` → `[]` en todas las sesiones; `DMO.gamepad.state()` → `supported:true, connected:false, index:null, name:'', active:'keyboard'|'mouse', fire:false`. Existen listeners `gamepadconnected` y `gamepaddisconnected` en `window` (1 cada uno), por lo que el código de detección está presente, pero **no hay mando físico** en el entorno.
- **Evidencia:** `log_event_listeners.json`, `log_console_network_boot.json`, `log_hub_start_audio.json`.
- **Errores de consola:** solo 2×404 externos.
- **Clasificación:** **BLOQUEADA**. Subpruebas (detección, movimiento, disparo, habilidades, navegación de menús, desconexión/reconexión) → **PENDIENTES**, procedimiento en `MANUAL_PROCEDURE.md`. No se ha simulado ningún mando.

## V-11 — Scripts residuales de Cloudflare · **SUPERADA**

- **Procedimiento:** sin eliminar ni modificar los scripts; captura de `request`/`response`/`requestfailed`, consola, recuento de `iframe`, y comparación del arranque y de la carga de assets.
- **Resultado observado:** en cada carga se realizan exactamente **2 peticiones** a `http://127.0.0.1:8123/cdn-cgi/challenge-platform/scripts/jsd/main.js?ray=a54578e76f52d872` y `?ray=a545cfe0d8d4c69e`, ambas con **HTTP 404** (`requestfailed: net::ERR_ABORTED`), generando **2 errores de consola** y **2 iframes ocultos 1×1**. El HTML principal carga 200 con 13.380.910 bytes. **0 `pageerror`, 0 crashes**; la portada, el motor (41 globales), las imágenes Base64, la fuente y los canvas se inicializan correctamente. Los errores son **externos al juego** (recurso de hosting ausente en el servidor local) y no afectan al arranque ni a los recursos del juego.
- **Evidencia:** `01_boot_cover.png`, `log_console_network_boot.json`, `log_campaign_progression.json` (4 errores tras recarga = 2 por carga).
- **Reproducibilidad:** 3/3 cargas (y 2 cargas adicionales tras reload).
- **Clasificación:** SUPERADA como investigación; se registra **INC-003 (P3)**. Scripts **no eliminados**.

---

## Comprobaciones estáticas (NO son pruebas de navegador)

Ejecutadas en la Fase 0.2 y reutilizadas solo como contexto; **no se contabilizan como pruebas funcionales**:

| Comprobación | Resultado |
|---|---|
| SHA-256 de original, backup y blob Git de `main` | Coincidentes (`b2ef4ad8…`) antes y después de la Fase 0.3 |
| Lectura UTF-8 completa de 13.380.910 bytes / 19.835 líneas | Correcta |
| Recorrido HTML con `HTMLParser` | 31/31 `<style>`, 12/12 `<script>`, 4 `<canvas>` en el documento fuente |
| Compilación de 10 bloques JS ejecutables (`vm.Script`) | Sin errores de sintaxis |
| JSON del manifiesto embebido | Válido |
| 300 URIs Base64 | 300/300 decodifican (181 PNG, 118 WebP, 1 TTF; 8.178.730 B) |
| Igualdad `HANGELOG.md` ↔ `CHANGELOG.md` | Idénticos |

## Subpruebas pendientes (resumen)

V-04 (colisiones/límites/diagonales) · V-05 (confirmación del disparo en GUI, impacto, daño, hitboxes, recarga, cambio de arma, respuesta sonora) · V-06 (recorrido a pie, accesibilidad, superposiciones) · V-07 (jefes, eventos, continuidad entre círculos) · V-08 (CR, logros, configuración, partida en curso) · V-09 (salida audible, cambios de tema, efectos) · V-10 (todas) · V-11 (confirmación CSP/CORS en GUI). Procedimiento en `FASE_0_3_EVIDENCE/MANUAL_PROCEDURE.md`.

## Notas de rigor / falsos positivos descartados

1. `canEnterCircle()` y `startCampaignFromHub()` **sin argumento** devuelven `false` y «BLOQUEADO · Derrota primero a EL RESIDENTE…»: era un error del procedimiento de prueba. Con `(0)` → `true` y `missingRequirement(0)=''`. **No es un bug de progresión.**
2. `balas:0` durante `location:'TRANSITION'`: el combate está desactivado en transición; esas barridas (`stage_m`) **no se usan** para valorar V-05.
3. `DMO_DUNGEON.audit()` `ok:false` antes de generar: estado pre-inicialización; tras generar `ok:true`.
4. `enemies:0` en el Refugio: zona segura por diseño.
5. `DMO.read()` devuelve una instantánea con retardo; se sustituyó por `DMO.debug.state().px/py` para medir movimiento. Artefacto de instrumentación, no del juego.

---

# 6. Fase 0.3.1 — Pruebas de confirmación (ejecución real)

Entorno: Chromium Headless 153.0.8010.0 / playwright-core 1.64.1, HTTP local, contextos aislados. **Sin GUI** (sin `DISPLAY`, sin Xvfb/Xorg/weston, sin paquete instalable): no se han realizado pruebas manuales ni simulaciones. Evidencia completa en `FASE_0_3_1_EVIDENCE/`.

## 6.1 Corrección de instrumentación que afecta a V-05

`DMO.debug.state().balas` / `balasArr` y `DMO.testStats().balas` = `Ia.length` (**proyectiles enemigos**). El array de proyectiles del **jugador** es `wa`, y su contador es `DMO.testStats().shotsFired`. Por tanto `balas:0` **no era evidencia de ausencia de disparo**. El overlay del propio juego («balas 0») usa la misma métrica de enemigos. Método nuevo: observador de `Array.prototype.push` sobre la firma `{weaponSerial, accuracyCohort}` para verificar que el proyectil entra en `wa`, se mueve y expira.

## 6.2 Pruebas ejecutadas

| ID | Prueba | Procedimiento | Resultado observado | Evidencia | Errores consola | Reproducibilidad | Estado |
|---|---|---|---|---|---|---|---|
| T-031-01 | Disparo primario con ratón | 10 intentos independientes (`mousemove` + `mousedown` 450 ms + `mouseup`) en 10 posiciones, con `transitionLock:false` y 1 enemigo | **5/10 generaron proyectil del jugador**: `ΔshotsFired=1`, `Δwa.push=1`; `wa.length` 1→4; proyectiles con `x` y `life` crecientes y expiración | `inc001_session.json`, `02_inc001_mouse_attempts.png` | 2×404 externos | 5/10 en una sesión; 4/4 con frames forzados | **SUPERADA** (generación + entrada en el mundo) / **PARCIAL** (cadencia en headless) |
| T-031-02 | Control alternativo | 10 intentos con `DMO.debug.setInput({fire:true})` 450 ms | 1/10 generó proyectil; 6 intentos con `Δframes=0` no ejecutaron ningún tick; con `debug.tick(0.016,60)` → 4 disparos en un bloque | `inc001_session.json`, `03_inc001_alt_attempts.png` | 2×404 externos | 1/10 + 4/4 con ticks | **PARCIAL** (limitado por frames, no por input) |
| T-031-03 | Eventos de entrada | Listeners en captura y burbuja sobre `window` | `pointerdown` real en `#game`, `pointerType:'mouse'`, `defaultPrevented:true` en burbuja; **no** hay `mousedown`; aun así se dispara | `inc001_session.json` | — | 10/10 intentos | **SUPERADA** (descarta la hipótesis de `mousedown`) |
| T-031-04 | Comparación con `Q` | `page.keyboard.press('q')` | `kills 0→1`, `score 0→28`, sin cambiar `shotsFired` | `inc001_session.json`, `04_inc001_after_Q.png` | 2×404 externos | coincide con Fase 0.3 (3/3) | **SUPERADA** |
| T-031-05 | Transición HUB→Círculo I, ejecución 1 | Contexto nuevo, sondeo 500 ms hasta `tc=1` | 54.358 ms; `CAMPAIGN_ROOM`, `inHub:false`, `transitionLock:false`, `tc:1`, `te:0`, `floorDrop idle`, `r0` visited/secured 1, 12 nodos, zona de destino; disparo posterior +1 proyectil | `inc002_three_runs.json`, `05_run1_hub.png`, `06_run1_transition.png`, `07_run1_final.png` | 2×404 externos, 0 `pageerror` | 1/1 | **SUPERADA** |
| T-031-06 | Transición, ejecución 2 | ídem, contexto nuevo | 51.924 ms; mismo estado final; disparo +1 proyectil | `inc002_three_runs.json`, `05_run2_hub.png`, `06_run2_transition.png`, `07_run2_final.png` | 2×404 externos, 0 `pageerror` | 1/1 | **SUPERADA** |
| T-031-07 | Transición, ejecución 3 | ídem, contexto nuevo | 53.056 ms; mismo estado final; disparo +1 proyectil | `inc002_three_runs.json`, `05_run3_hub.png`, `06_run3_transition.png`, `07_run3_final.png` | 2×404 externos, 0 `pageerror` | 1/1 | **SUPERADA** |
| T-031-08 | Aislamiento de frames | `DMO.debug.tick(0.016,30)` cada 500 ms desde el inicio | Transición completada en **4.655 ms** (~11× más rápido), `tc:1`, movimiento +21 px, disparo +1 | `inc002_three_runs.json`, `05_run4_hub.png`, `07_run4_final.png` | 2×404 externos, 0 `pageerror` | 1/1 | **SUPERADA** |
| T-031-09 | Recuperación de control tras transición natural | `d` 1.200 ms; `d` + 90 ticks; ratón 700 ms; `Q` | `px 1250→1275` (+25), `px 1275→1583` (+308 con ticks), `shotsFired 0→1` con proyectil en `wa`, `kills +1`, `score +28` | `control_supplement.json`, `08_control_arrival.png`, `09_control_after_actions.png` | 2×404 externos, 0 `pageerror` | 1/1 | **SUPERADA** |
| T-031-10 | Confirmación en navegador GUI | Requiere display, audio y/o mando | **No ejecutada**: entorno sin GUI ni Xvfb | `GUI_MANUAL_CHECK.md` | — | n/a | **PENDIENTE** |

## 6.3 Efecto sobre la matriz histórica

| Fila Fase 0.3 | Situación tras 0.3.1 |
|---|---|
| V-05 «disparo primario FALLIDA en este entorno» | **Rectificada**: el fallo era de métrica y de estado (`TRANSITION`). El disparo primario genera proyectiles que entran en `wa`. La fila se conserva como histórico |
| V-07 «bloqueo `TRANSITION` >35 s» | **Rectificada**: 3/3 transiciones completan (~52–54 s en headless) con `tc:1` y control recuperado. El sondeo de Fase 0.3 se abandonó a los 20/35/5 s. La fila se conserva como histórico |
| V-10 Gamepad | Sigue **BLOQUEADA** (sin mando físico) |
| V-09 Audio | Sigue **PARCIAL** (sin salida audible) |
| V-11 / INC-003…INC-007 | Sin cambios |

## 6.4 Distinción obligatoria

- **Pruebas reales:** T-031-01…T-031-09 (todas con ejecución en Chromium y evidencia).
- **Análisis estático (no prueba):** lectura de `wd()`, del hook V35 «Peaceful Hub & Transition Combat Lock», de `isFloorDropLockingControls()` y de `floorDropAnim.onArrivalComplete`; se usó **sólo para decidir qué medir**, nunca para declarar `SUPERADA` (`TOOLING.md`).
- **Pendientes:** T-031-10 y las subpruebas listadas en la sección «Subpruebas pendientes» de este documento.
