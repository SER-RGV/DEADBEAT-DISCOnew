# Procedimiento manual para completar las pruebas pendientes (Fase 0.3)

El entorno de esta fase ejecutó la batería posible en Chromium 153 **headless**. Quedan pruebas que requieren un navegador con interfaz gráfica, salida de audio, un mando físico o recorrido humano. Este documento permite completarlas sin modificar la build.

## Preparación (idéntica a la fase)

1. Trabajar en `arena/b89cd6bc-deadbeat-disco`; no tocar `main`.
2. Verificar la build: `sha256sum v9_t3_fase1b_cache_probe.html` debe ser `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a`.
3. Servir por HTTP con un **origen estable** (no `file://`), por ejemplo `python3 -m http.server 8123 --bind 0.0.0.0 --directory <repo>` y abrir `http://127.0.0.1:8123/v9_t3_fase1b_cache_probe.html`.
4. Usar un **perfil nuevo/incógnito** para no sobrescribir datos de usuario. Abrir DevTools: Consola + Network + Application → Local Storage.
5. Registrar navegador y versión, SO, resolución, si hay audio y modelo de mando.
6. Anotar cada resultado con la plantilla de `VALIDATION_PLAN.md`: ID, fecha, navegador, origen, resultado, evidencia, notas. No escribir `SUPERADA` sin evidencia.

## Secuencia de arranque comprobada (reproducible)

1. Cargar; esperar la portada («PULSA PARA ENTRAR AL CLUB»).
2. Clic o cualquier tecla para entrar al menú.
3. `ENTER` sobre **INICIAR**.
4. Aparece la cinemática de introducción. **Mantener pulsado ESC ~1 s** (o ENTER/B/START) para omitirla: las pulsaciones sueltas no la omiten. Verificar que desaparece el rótulo «MANTÉN ESC · ENTER · B / START PARA OMITIR».
5. En el Refugio, bajar al **Ascensor Sur** (zona inferior central) y pulsar `E`. Alternativa equivalente verificada: en consola `DMO_HUB.startCampaignFromHub(0)` (**con** el índice 0; sin argumento devuelve `false`).
6. Esperar a que `DMO_HUB.state().location` sea `CAMPAIGN_ROOM` y `transitionLock:false`. En esta fase tardó ~13 s en una sesión y >35 s en otras (INC-002): anotar el tiempo exacto.

## Pruebas pendientes

### V-04 — Movimiento y colisiones (completar)
Con `DMO.debug.state().px/py` (coordenadas vivas; `DMO.read()` va con retardo):
- Mantener `W`, `A`, `S`, `D` 1 s cada una y anotar Δx/Δy.
- Probar las 4 diagonales (`W+A`, `W+D`, `S+A`, `S+D`) y comprobar normalización de velocidad.
- Caminar contra cada muro/límite de sala y verificar que el personaje se detiene sin atravesar.
- Comprobar que no hay bloqueo permanente tras soltar teclas y que `ESPACIO` (esquiva) responde.
- Repetir en 3 salas distintas (`DMO.debug.exploreNext()` cambia `current` r0→r1→r2…).

### V-05 — Combate (prioridad: confirmar INC-001)
- En `CAMPAIGN_ROOM`, generar un enemigo: `DMO.debug.on(); DMO.debug.forceWave(); DMO.debug.spawnEnemyAt(1350,1000)`.
- Apuntar con el ratón al enemigo y mantener clic izquierdo 2–3 s. Observar en pantalla si aparecen proyectiles y en consola `DMO.debug.state().balas` / `balasArr`.
- **Repetir en un navegador con interfaz gráfica (Chrome/Firefox/Edge de escritorio) y, si es posible, con un navegador de versión distinta.** El síntoma observado en headless fue `balas:0`, `fire:false`, `kills:0` pese a `pointerdown`/`click` reales sobre `#game`; la hipótesis es que `preventDefault()` en `pointerdown` suprime el `mousedown` de compatibilidad que escucha el motor (`log_event_listeners.json`). Confirmar o descartar.
- Como control positivo: `Q` (bomba) debe matar al enemigo (`kills:1`, `score:28`, `enemies:0`) — comprobado en esta fase.
- Verificar impacto, daño recibido (`lives`), hitboxes, recarga/cadencia, cambio de arma, habilidades y respuesta visual/sonora.

### V-06 — Habitaciones (completar)
- Recorrer a pie las 11–12 salas del piso (`salas 1/11` en HUD) comprobando puertas, escaleras, colisiones, accesibilidad de rutas, elementos superpuestos y coherencia espacial.
- Registrar `DMO_DUNGEON.audit()` por sala (`ok`, `errors`, `rooms`, `bossDistance`) y `DMO_DUNGEON.state().current/visited/secured`.
- Verificar que el minimapa coincide con la sala visitada.

### V-07 — Transiciones y progresión (completar)
- Cambios de habitación, activación de puertas, transiciones entre zonas/círculos, eventos, **jefes** y continuidad del estado del jugador (vidas, arma, CR, fichas) tras cada transición.
- Medir el tiempo HUB→`CAMPAIGN_ROOM` y comprobar si se reproduce el bloqueo en `TRANSITION` (INC-002) en navegador GUI.
- Registrar `transitionsCompleted` y `transitionErrors` (`DMO_HUB.state()`).

### V-08 — Guardado (completar)
- Antes/después de recargar, volcar `localStorage` y comparar: `dmo_hub_v1`, `dmo_progression_v87`, `dmodisco_a11y_v1`, `dmodisco_muted_v1`. Ya verificado para esas claves.
- Falta: **monedas/CR, logros, configuración** y recuperación de una partida en curso (no solo del estado de portada).
- Repetir con almacenamiento bloqueado de verdad (configuración del navegador / modo incógnito restrictivo). **En la fase anterior se inyectó un getter lanzador de `SecurityError` pero la medición dio `localStorage` como `object`, `storageAvailable:true` y `saveWrites:1`**: la inyección no se mantuvo y el caso no quedó probado. Verificar explícitamente si el juego mantiene la sesión en memoria (la existencia de un *shim* es una hipótesis no confirmada).

### V-09 — Audio (completar)
- Con altavoces/auriculares y un **gesto de usuario real**, comprobar música de HUB, cambio de tema al entrar en campaña/combate/jefe, efectos de disparo/bomba/UI, volumen y silenciamiento.
- Verificar que `dmodisco_muted_v1` cambia y que el silenciamiento persiste tras recargar.
- Distinguir un bloqueo de autoplay del navegador (fallo externo) de un fallo del juego. En headless solo se pudo verificar `AudioContext.state='running'` y `DMO_MUSIC.audit().ok=true`.

### V-10 — Gamepad (BLOQUEADA en esta fase)
- Conectar un mando y pulsar un botón; comprobar `navigator.getGamepads()` no vacío y `DMO.gamepad.state().connected=true`.
- Probar movimiento con stick/D-Pad, disparo, habilidades, navegación de menús (A/B, `DD`/D-Pad), y **desconexión/reconexión** durante la partida.
- Registrar modelo de mando, navegador y si `DMO.gamepad.state().active` pasa a `gamepad`.

### V-11 — Scripts Cloudflare (confirmación opcional)
- Ya ejecutado en headless: 2 peticiones 404, 2 iframes, 2 errores de consola, 0 errores JS, sin impacto en arranque/assets.
- Repetir en GUI para descartar interferencias de CSP/CORS o de extensiones del navegador. **No eliminarlos todavía.**

## Cierre

Al terminar, añadir una fila por prueba en `VALIDATION_PLAN.md` con resultado y evidencia, actualizar `FASE_0_3_TEST_MATRIX.md` y `FASE_0_3_BUG_REGISTRY.md` (confirmar o descartar INC-001 e INC-002), y registrar los cambios en Git **sin modificar el HTML original**.
