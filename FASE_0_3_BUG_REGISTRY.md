# Registro de incidencias — Fase 0.3

Fecha: 2026-11-02. Build: `v9_t3_fase1b_cache_probe.html` (sin modificar, SHA-256 `b2ef4ad8…d4a`). Entorno: Chromium Headless 153.0.8010.0 / playwright-core 1.64.1 / HTTP local. **No se ha corregido ninguna incidencia** (regla de la fase).

**Prioridades:** P0 impide iniciar/jugar · P1 rompe sistemas fundamentales · P2 deteriora significativamente la experiencia · P3 defectos visuales o menores.

> **Actualización Fase 0.3.1 (2026-11-02):** INC-001 e INC-002 pasan a **`NO REPRODUCIDA`** tras diagnóstico automatizado con instrumentación corregida. Siguen **abiertas** hasta verificación en GUI. El registro original de ambas se conserva íntegro más abajo como histórico; la **sección «Fase 0.3.1»** al final contiene el nuevo estado, método, resultados y siguiente acción. No se ha corregido nada.

| ID | Prioridad | Título | Estado (Fase 0.3, histórico) | Reproducibilidad |
|---|---|---|---|---|
| INC-001 | **P1** | El disparo primario con ratón no genera proyectiles ni bajas | Abierta, pendiente de confirmación en GUI | 2/2 sesiones válidas |
| INC-002 | **P2** | La transición HUB → Círculo I puede quedar en `TRANSITION` >35 s | Abierta, pendiente de confirmación en GUI | 2/3 sesiones |
| INC-003 | P3 | Dos scripts Cloudflare: 2 iframes, 2 peticiones 404, 2 errores de consola por carga | Confirmada (externa), no corregir aún | 3/3 cargas |
| INC-004 | P3 | Glifos ausentes renderizados como cuadros «□» en HUD y rótulos | Confirmada | 3/3 sesiones |
| INC-005 | P3 | `#start-btn` («JUGAR») no recibe clics: lo intercepta `#ddc-img` | Confirmada | 1/1 intento documentado |
| INC-006 | P3 | Panel de arma del HUD solapa la etiqueta «CLIENTE 000» | Confirmada (visual) | 2/2 capturas del HUB |
| INC-007 | P3 | `DMO_DUNGEON.audit()` `ok:false` antes de generar el grafo | Confirmada (estado pre-init, sin impacto funcional) | 1/1 |

**P0: ninguna confirmada.** La build arranca, muestra portada y permite llegar al Refugio y a una sala de campaña.

---

## INC-001 — Disparo primario sin proyectiles · **P1**

- **Descripción:** en una sala de campaña con un enemigo presente, mantener el botón izquierdo del ratón sobre `#game` no crea proyectiles, no activa `fire` y no produce bajas. La bomba (`Q`) y `killAll()` sí funcionan.
- **Sistema afectado:** combate / input de ratón / sistema de armas (`M1911`).
- **Pasos para reproducir:**
  1. Servir el HTML por HTTP; entrar al club, `ENTER` en INICIAR, mantener `ESC` para omitir la cinemática.
  2. `DMO_HUB.startCampaignFromHub(0)`; esperar a `DMO_HUB.state().location === 'CAMPAIGN_ROOM'` y `transitionLock:false`.
  3. `DMO.debug.on(); DMO.debug.forceWave(); DMO.debug.spawnEnemyAt(1350,1000)` → `enemies:1`.
  4. `mousemove(760,420)` + `mousedown` mantenido 1,4–3 s; muestrear `DMO.debug.state().balas`, `balasArr`, `fire`, `DMO.read().kills/score`.
- **Resultado esperado:** proyectiles (`balas>0`), `fire=true` y, apuntando al enemigo, bajas/puntuación.
- **Resultado observado:** `balas:0`, `balasArr:[]`, `fire:false`, `kills:0`, `score:0`, `enemies:1` durante y después del disparo. Como control, `Q` produce `kills:1`, `score:28`, `enemies:0`.
- **Evidencia:** `FASE_0_3_EVIDENCE/07_combat_state.png`, `log_combat_rooms_resize.json`, `log_campaign_progression.json`, `log_event_listeners.json`, `log_circle_api.json`.
- **Posible causa (con evidencia, hipótesis no confirmada):** CDP `DOMDebugger.getEventListeners` muestra `pointerdown`/`pointermove`/`pointerup` en `#game` y **`mousedown` en `window`**; la traza de eventos registra un `pointerdown` real sobre `#game` (760,420) pero **ningún `mousedown` de compatibilidad**. En Chromium, `preventDefault()` sobre `pointerdown` suprime los eventos de ratón de compatibilidad. Si el disparo depende del `mousedown` de `window`, quedaría inactivo. Requiere confirmación en navegador con interfaz gráfica y en otro motor antes de atribuirlo al juego.
- **Limitación de la clasificación:** el entorno es headless con SwiftShader; no se descarta un artefacto de este navegador. Por eso se registra como P1 **pendiente de confirmación**, no como fallo definitivo del juego.
- **Acción propuesta (NO ejecutada):** repetir V-05 según `MANUAL_PROCEDURE.md`; si se confirma, investigar el enlace `pointerdown`/`mousedown` sin modificar mecánicas.

## INC-002 — Transición HUB → Círculo I bloqueada en `TRANSITION` · **P2**

- **Descripción:** tras iniciar el descenso, el estado del HUB permanece `location:'TRANSITION'`, `inHub:true`, `transitionLock:true`, `transitionsCompleted:0` durante más de 35 s (o toda la sesión), con el input de combate desactivado.
- **Sistema afectado:** progresión / máquina de estados del HUB / transiciones (`DMO_HUB`).
- **Pasos para reproducir:** arrancar, omitir cinemática con ESC mantenido, ejecutar `startCampaignFromHub(0)` y sondear `DMO_HUB.state()` cada segundo.
- **Resultado esperado:** `location:'CAMPAIGN_ROOM'`, `inHub:false`, `transitionLock:false`, `transitionsCompleted:1` en unos pocos segundos.
- **Resultado observado:** en `stage_i` se completó tras ~13 s con `transitionsCompleted:1, transitionErrors:0`; en `stage_l` permaneció en `TRANSITION` los 35 sondeos y solo pasó a `CAMPAIGN_ROOM` tras `forceWave()`/`spawnEnemyAt()`; en `stage_m` permaneció en `TRANSITION` toda la sesión (con `enemies:0` y sin disparo válido).
- **Evidencia:** `log_campaign_progression.json`, `log_event_listeners.json`, `log_shooting_sweep.json`, `log_skip_transition.json`, `04_intro_cinematic.png`.
- **Posible causa:** sin evidencia suficiente. Se observa correlación con la omisión de la cinemática y con la ausencia de estímulos de oleada; también puede deberse a la cadencia de `requestAnimationFrame` en headless. **No se atribuye a una línea de código concreta.**
- **Acción propuesta (NO ejecutada):** medir el tiempo de transición en navegador GUI y registrar `transitionErrors`.

## INC-003 — Scripts residuales de Cloudflare · **P3 (externa)**

- **Descripción:** los dos bloques inyectados al final del `body` crean 2 iframes ocultos y solicitan `/cdn-cgi/challenge-platform/scripts/jsd/main.js?ray=…`, que no existe en el servidor local → 2×404 y 2 errores de consola por carga.
- **Sistema afectado:** ninguno del juego; red/consola del documento.
- **Pasos para reproducir:** cargar el HTML por HTTP y observar Network/Console.
- **Resultado esperado:** sin peticiones externas (según los propios comentarios v8.8 del archivo: «el juego no lo usa y no debe pedir red»).
- **Resultado observado:** 2 peticiones 404, 2 iframes, 2 errores de consola; 0 `pageerror`, 0 crashes; arranque, assets, fuente y canvas correctos. Tras recargar se acumulan 4 errores (2 por carga).
- **Evidencia:** `log_console_network_boot.json`, `log_campaign_progression.json`, `01_boot_cover.png`; análisis de procedencia en `CLOUDFLARE_SCRIPTS.md` (Fase 0.2).
- **Causa:** inyección del hosting Cloudflare en dos capturas distintas (ray `a54578e7…` / `a545cfe0…`), no código del proyecto.
- **Acción:** **no eliminar todavía** (regla de la fase). Observación V-CF/V-11 ejecutada.

## INC-004 — Glifos ausentes («□□□») · **P3**

- **Descripción:** varios rótulos muestran cuadros vacíos en lugar de glifos: «EL REFUGIO RECUERDA □□□□□□□ 0/9», «□ PROGRESO □», «□ PROGRESO · J», «salas 1/11» en algún contexto, y «□□□□□» en la cinemática.
- **Sistema afectado:** tipografía / HUD / UI (`@font-face` Pixelify Sans embebida).
- **Pasos para reproducir:** cargar, entrar al club y observar la franja superior del HUB y el botón inferior izquierdo.
- **Resultado esperado:** caracteres legibles (probablemente iconos de sello/progreso).
- **Resultado observado:** cajas de «tofu». La fuente sí carga (`document.fonts.check('16px "Pixelify Sans"')=true`, `status:'loaded'`), por lo que el problema es de **cobertura de glifos**, no de carga de la fuente ni de decodificación Base64.
- **Evidencia:** `03_hub_render.png`, `04_intro_cinematic.png`, `05_hub_glyph_defect.png`, `06_campaign_room_limbo.png`, `07_combat_state.png`.
- **Posible causa (con evidencia):** la UI usa caracteres/emoji/dingbats no incluidos en el subconjunto de Pixelify Sans embebido y no hay fuente de reserva con esos glifos.
- **Reproducibilidad:** 3/3 sesiones y 5 capturas.

## INC-005 — `#start-btn` («JUGAR») inaccesible por puntero · **P3**

- **Descripción:** el botón existe, está visible y habilitado, pero un clic normal es interceptado por `<img id="ddc-img">` de la portada.
- **Sistema afectado:** portada / panel lateral de controles.
- **Pasos para reproducir:** tras desactivar la compuerta («PULSA PARA ENTRAR AL CLUB»), intentar `page.locator('#start-btn').click()` (o clic de usuario en su posición).
- **Resultado esperado:** el botón recibe el clic.
- **Resultado observado:** Playwright: *«`<img id="ddc-img">` … subtree intercepts pointer events»*, timeout de 8 s. El menú principal sigue siendo usable por teclado (`ENTER`).
- **Evidencia:** `log_cover_click_interception.json`, `02_menu_active.png`.
- **Posible causa:** orden de apilamiento / `pointer-events` de la imagen de portada sobre el panel lateral.
- **Nota:** no impide jugar (hay ruta por teclado y por `#ddc-gate`), de ahí P3.

## INC-006 — Solapamiento del panel de arma · **P3**

- **Descripción:** el panel negro «M1911 · ∞ / NV 1 · P0 · 0/12 · 1/2 armas / 0 CR / 0/6 ◇» se superpone a la etiqueta «CLIENTE 000» en la esquina superior izquierda del HUB.
- **Sistema afectado:** HUD.
- **Pasos para reproducir:** entrar al Refugio y observar la esquina superior izquierda.
- **Resultado esperado:** elementos del HUD sin solapamiento.
- **Resultado observado:** la etiqueta queda parcialmente cubierta.
- **Evidencia:** `03_hub_render.png`, `05_hub_glyph_defect.png`.
- **Posible causa:** posicionamiento absoluto del panel de arma con z-index superior; requiere revisión visual (no se ha medido el CSS en esta fase).

## INC-007 — Auditoría de mazmorra `ok:false` antes de generar · **P3 (observación)**

- **Descripción:** en el estado inicial (antes de `startCampaignFromHub`), `DMO_DUNGEON.audit()` devuelve `ok:false, errors:['tipos obligatorios','tipos duplicados'], rooms:12`. Tras iniciar campaña, `ok:true, errors:[], rooms:12, bossDistance:5`.
- **Sistema afectado:** generación de mazmorra (estado pre-inicialización).
- **Pasos para reproducir:** llamar `DMO_DUNGEON.audit()` inmediatamente tras la carga y de nuevo tras la transición.
- **Resultado esperado:** auditoría coherente con el estado real del grafo.
- **Resultado observado:** falso negativo transitorio; **no se observó ningún fallo funcional** asociado (la sala se genera y se navega correctamente).
- **Evidencia:** `log_skip_transition.json`, `log_campaign_progression.json`.
- **Clasificación:** P3 informativa; se registra para no confundirlo con un error de generación.

---

## Descartados (no son incidencias)

| Observación | Por qué se descarta |
|---|---|
| `canEnterCircle() = false` / `startCampaignFromHub() = false` con «BLOQUEADO · Derrota primero a EL RESIDENTE…» | Procedimiento de prueba incorrecto: la API requiere índice. `canEnterCircle(0)=true`, `missingRequirement(0)=''`, `startCampaignFromHub(0)=true`. `log_circle_api.json`. |
| `balas:0` / `enemies:0` durante `location:'TRANSITION'` | El combate está desactivado durante la transición; la barrida `stage_m` no es válida para V-05. |
| `DMO.read()` con valores que no cambian al pulsar teclas | Instantánea con retardo; `DMO.debug.state().px/py` confirma el movimiento. Artefacto de instrumentación. |
| `enemies:0` en «THE LAST AFTERPARTY · REFUGIO DEL CLUB» | Zona segura por diseño. |
| 2 errores 404 en consola | Externos (INC-003), no errores JavaScript del juego: 0 `pageerror` en todas las sesiones. |
| Ausencia de sonido | Limitación del entorno headless (`--mute-audio`), no fallo del juego: `AudioContext.state='running'`, `DMO_MUSIC.audit().ok=true`. |

## Sin corregir

Ninguna incidencia ha sido corregida, ningún script eliminado, ningún asset regenerado, ninguna mecánica modificada. El HTML original conserva su SHA-256. Las acciones propuestas quedan para fases posteriores, previa confirmación en navegador GUI.

---

# Fase 0.3.1 — Confirmación de incidencias (2026-11-02)

Estados aplicables: `CONFIRMADA` · `NO REPRODUCIDA` · `PENDIENTE`. Las dos incidencias heredadas **no se confirman**. Ninguna se corrige. Ambas permanecen **abiertas** hasta la comprobación manual en GUI (entorno sin `DISPLAY`/Xvfb). Evidencia: `FASE_0_3_1_EVIDENCE/`.

| ID | Prioridad heredada | Estado Fase 0.3.1 | Ejecuciones | Conclusión |
|---|---|---|---|---|
| INC-001 | P1 | **`NO REPRODUCIDA`** | 10 ratón + 10 alternativo + `Q` + ticks forzados | El disparo primario **sí** genera el proyectil y este entra en `wa` |
| INC-002 | P2 | **`NO REPRODUCIDA`** | **3 independientes** + 1 con frames forzados + 1 suplementaria | La transición **termina** en 3/3, con sala cargada y control recuperado |

## INC-001 — Estado `NO REPRODUCIDA`

- **Método de prueba:** sesión limpia en Chromium Headless 153; arranque completo; espera a `transitionLock:false` y `transitionsCompleted:1`; 1 enemigo asistido; **10 intentos independientes de ratón real** (450 ms, 10 posiciones) y **10 intentos con control alternativo** `DMO.debug.setInput({fire:true})`; comparación con `Q`; `DMO.debug.tick` para aislar frames. Instrumentación: observador de `wa.push` + `DMO.testStats().shotsFired` + eventos en captura/burbuja.
- **Entorno:** Chromium Headless 153.0.8010.0, playwright-core 1.64.1, HTTP local `127.0.0.1:8123`, 1280×900, SwiftShader, **sin GUI**.
- **Nº de ejecuciones:** 20 intentos de disparo, 1 comparación, 1 bloque de frames forzados.
- **Resultados:** 5/10 intentos con ratón → `ΔshotsFired=1` y `Δwa.push=1`; `wa.length` 1→4; proyectiles con `x`/`life` crecientes y expiración. 1/10 con control alternativo; 4 disparos en un bloque con 60 ticks. `Q` → `kills +1`, `score +28`. `pointerdown` real en `#game` con `defaultPrevented:true` y **sin** `mousedown` de compatibilidad, sin impacto en el disparo.
- **Causa del falso positivo (con evidencia):** (1) `balas`/`balasArr` miden `Ia` (**proyectiles enemigos**), no `wa`; (2) `stage_j`/`stage_m` de Fase 0.3 se midieron en `TRANSITION`, donde el hook V35 bloquea legítimamente `wd`; (3) inanición de `requestAnimationFrame` en headless (0–10 frames por intento) volvió intermitente la cadencia; (4) la hipótesis del `mousedown` suprimido queda **refutada**.
- **Evidencia:** `FASE_0_3_1_EVIDENCE/inc001_session.json`, `01`–`04_inc001_*.png`, `RESULTS.md`, `TOOLING.md`.
- **Limitaciones:** sin GUI no se verifican cadencia, respuesta visual/sonora ni comportamiento en otros motores; la incidencia permanece abierta con este estado hasta esa comprobación.
- **Conclusión:** **no reproducible** como fallo del sistema de disparo. No es exclusivo de headless, no lo causa el método de entrada ni el estado del jugador (con transición completada). Se documenta como **observación de entorno** la cadencia irregular en SwiftShader, no como defecto del juego.
- **Siguiente acción concreta:** `GUI_MANUAL_CHECK.md` → comprobación 1 (clic sostenido 3 s con `transitionLock:false`, verificar `shotsFired` creciente). Si en GUI no aumenta, reabrir como `CONFIRMADA` y entonces sí plantear corrección. **No corregir ahora.**

## INC-002 — Estado `NO REPRODUCIDA`

- **Método de prueba:** tres contextos nuevos e independientes; en cada uno: estado inicial (`HUB`, `transitionLock:false`), acción `startCampaignFromHub(0)`, sondeos cada 500 ms de `DMO_HUB.state()`, `DMO_DUNGEON.state()`, `zone`, `DMO.floorDrop.state()`, frames, `shotsFired`, consola y excepciones; verificación de llegada a destino **y** recuperación de control. Cuarta ejecución inyecta 30 ticks/500 ms para aislar frames.
- **Entorno:** ídem INC-001, sin GUI.
- **Nº de ejecuciones:** **3 independientes** (+1 aislamiento +1 suplementaria de control).
- **Resultados:** 54.358 / 51.924 / 53.056 ms hasta `transitionsCompleted=1`; en las tres `location='CAMPAIGN_ROOM'`, `inHub=false`, `transitionLock=false`, `transitionErrors=0`, `floorDrop idle`, sala `r0` (visited 1, secured 1, grafo de 12 nodos), zona «VESTÍBULO DE TURNOS · ENTRADA SEGURA», disparo posterior +1 proyectil y **0 `pageerror`**. Con frames forzados: 4.655 ms. Sesión suplementaria: `d` +25 px (+308 con ticks), disparo +1, `Q` +1 baja/+28.
- **No confusión animación/transición:** a los ~52,8 s `location` ya es `CAMPAIGN_ROOM` pero `transitionLock:true` y `tc:0` (`floorDrop impact/landing`); la transición **no está completada** hasta `idle/idle` con `tc:1`. La Fase 0.3 detuvo el sondeo a los 20/35/5 s, antes de la finalización.
- **Evidencia:** `inc002_three_runs.json`, `control_supplement.json`, `05`–`07_run*.png`, `08`–`09_control_*.png`, `RESULTS.md`.
- **Limitaciones:** duración de ~52–54 s en headless, atribuida (hipótesis con evidencia de la comparación 4,7 s con ticks) a la cadencia de `requestAnimationFrame` en SwiftShader; sin GUI no se mide la duración real de escritorio.
- **Conclusión:** la transición **no queda bloqueada**; termina correctamente y devuelve el control en 3/3. Incidencia **no reproducida**. La lentitud es una condición del entorno de pruebas, no un fallo lógico (`transitionErrors=0`, `floorDrop.onArrivalComplete` ejecutado).
- **Siguiente acción concreta:** `GUI_MANUAL_CHECK.md` → comprobación 2 (cronometrar hasta `tc=1`, no hasta el cambio de `location`, y verificar movimiento + disparo). Si en GUI persiste el bloqueo o la duración de decenas de segundos, reabrir como `CONFIRMADA`. **No corregir ahora.**

## Observaciones nuevas (no son incidencias del juego)

| ID | Observación | Clasificación |
|---|---|---|
| OBS-031-01 | `DMO.debug.state().balas` y el rótulo «BALAS» del HUD/overlay miden proyectiles **enemigos** (`Ia`); el contador del jugador es `DMO.testStats().shotsFired` / `wa`. Métrica engañosa para QA | Error de instrumentación de Fase 0.3, corregido documentalmente; **no se modifica el juego** |
| OBS-031-02 | En Chromium Headless con SwiftShader, `requestAnimationFrame` entrega 0–10 frames por ventana de 450–700 ms, haciendo intermitente el disparo y alargando la transición (~11×) | Limitación del entorno; **no** es un defecto confirmado de la build |
| OBS-031-03 | `preventDefault()` en `pointerdown` suprime el `mousedown` de compatibilidad, pero el juego fija `fa` en el propio `pointerdown` | Hipótesis de Fase 0.3 **refutada** |

## Estado global tras Fase 0.3.1

- **P0: ninguna. P1/P2 confirmadas: ninguna.** INC-001 e INC-002: `NO REPRODUCIDA`, abiertas hasta GUI.
- INC-003…INC-007 (P3): sin cambios, siguen confirmadas.
- Comprobación GUI de INC-001/INC-002: **`PENDIENTE`** por limitación del entorno (sin display/Xvfb), con instrucciones breves en `GUI_MANUAL_CHECK.md`.
- **Decisión de cierre: B** — Fase 0.3.1 cerrada con limitaciones documentadas; **no corregir por intuición**; no se prepara Fase 0.4 de corrección de estas incidencias; se permite avanzar con tareas artísticas independientes manteniendo las incidencias abiertas.
- **Sin correcciones:** HTML, CSS, JS, assets, audio, mecánicas, scripts Cloudflare, backup e historial intactos. `main` sin modificar.
