# Índice de evidencias — Fase 0.3

Todas las capturas son **capturas reales del navegador Chromium 153** servidas desde `http://127.0.0.1:8123/v9_t3_fase1b_cache_probe.html`. Las `01`–`04` se obtuvieron con `page.screenshot()` de Playwright; el resto con `Page.captureScreenshot` vía CDP (Playwright se bloqueaba esperando estabilidad de la animación continua). Los `.json` son volcados sin editar de los listeners de consola/Network/estado. Los hashes de todos los archivos están en `EVIDENCE_HASHES.txt`.

## Capturas

| Archivo | Origen de la sesión | Qué muestra | Pruebas |
|---|---|---|---|
| `01_boot_cover.png` | `discover.js` | Carga inicial: portada con «PULSA PARA ENTRAR AL CLUB» y menú INICIAR/CONTINUAR/… | V-01, V-02, V-03 |
| `02_menu_active.png` | `stage_b.js` | Menú activo tras clic; «BIENVENIDO AL DEADBEAT DISCO», círculos I–IX, hints de teclado | V-01, V-03 |
| `03_hub_render.png` | `stage_c.js` | Refugio renderizado: suelo, medallón, estaciones, HUD, minimapa, panel de arma solapando «CLIENTE 000» | V-02, V-03, INC-006 |
| `04_intro_cinematic.png` | `stage_d.js` | Cinemática de introducción activa con «MANTÉN ESC · ENTER · B / START PARA OMITIR» y glifos «□» | V-01, V-07, INC-004 |
| `05_hub_glyph_defect.png` | `stage_i.js` | HUD del Refugio con «EL REFUGIO RECUERDA □□□□□□□» y «□ PROGRESO □» | INC-004 |
| `06_campaign_room_limbo.png` | `stage_h.js` | Sala real «CÍRCULO I · LIMBO», «salas 1/11», overlay de depuración del propio juego, auditoría ARQ100 `OK / errores 0` | V-06, V-07 |
| `07_combat_state.png` | `stage_k.js` | Sala de combate con enemigo forzado, `BALAS 0`, «RONDA 1 · OLEADA ESTÁNDAR», navegación de salas | V-05, V-06, INC-001 |
| `08_resized_800x600.png` | `stage_d.js` | Estado tras `setViewportSize(800,600)` | V-03 |
| `09_no_storage_boot.png` | `stage_j.js` | Arranque con una condición de almacenamiento **inyectada** (`SecurityError` en el getter). **Nombre engañoso:** el log midió `lsProbe:"object"`, `storageAvailable:true`, `saveWrites:1`, por lo que **no** acredita un entorno sin almacenamiento; solo documenta que la build arrancó en ese contexto | V-08 (limitación) |
| `10_after_reload.png` | `stage_i.js` | Estado tras `page.reload()` con claves de guardado conservadas | V-08 |

## Logs de ejecución

| Archivo | Sesión | Contenido |
|---|---|---|
| `log_console_network_boot.json` | `discover.js` | Carga (17.429 ms), 3 peticiones, 2×404, 0 `pageerror`, 2 iframes, 41 globales, canvas/imágenes/fuente/localStorage |
| `log_cover_click_interception.json` | `stage_b.js` | Intento de clic en `#start-btn`: `ddc-img` intercepta eventos de puntero (INC-005) |
| `log_hub_start_audio.json` | `stage_c.js` | Secuencia portada→HUB, `running:true`, `AudioContext.state=running`, HUD, checksums de canvas |
| `log_skip_transition.json` | `stage_g.js` | ESC mantenido → `skips:1`, `transitionLock:false`; `canEnterCircle()`/`startCampaignFromHub()` sin argumento |
| `log_circle_api.json` | `stage_h.js` | `canEnterCircle(0)=true`, `startCampaignFromHub(0)=true`, `missingRequirement(n)`; combate con `Q` → `kills:1, score:28` |
| `log_campaign_progression.json` | `stage_i.js` | `transitionsCompleted:1`, `CAMPAIGN_ROOM`, `dungeon.audit() ok:true`, `rooms:12`, persistencia de `dmo_hub_v1`, mute |
| `log_audio_save_storage.json` | `stage_j.js` | `dmodisco_muted_v1: null → "1"`, `DMO_MUSIC.audit() ok`, `dmo_hub_v1` idéntico antes/después de recarga, contexto con almacenamiento inyectado (bloque `B`: `lsProbe:"object"`, `storageAvailable:true`) |
| `log_combat_rooms_resize.json` | `stage_k.js` | Movimiento con `px/py`, `balas:0` durante disparo, `Q`→baja, `r0→r1→r2→r3`, resize 900×700 |
| `log_event_listeners.json` | `stage_l.js` | `DOMDebugger.getEventListeners`: `pointerdown` en `#game`/`window`, `mousedown` en `window`; traza de eventos reales |
| `log_shooting_sweep.json` | `stage_m.js` | Barrida de 6 formas de disparo **en estado `TRANSITION`** (enemigos 0): resultado no válido para V-05, se conserva por transparencia |

## Otros archivos

- `ENVIRONMENT.md` — versiones, capacidades, limitaciones, argumentos de navegador, integridad.
- `MANUAL_PROCEDURE.md` — procedimiento manual para completar las pruebas pendientes/bloqueadas.
- `EVIDENCE_INDEX.md` — este índice.
- `EVIDENCE_HASHES.txt` — SHA-256 de cada archivo de este directorio excepto él mismo (generado al final de la fase).

## Lo que NO hay en este directorio

- No hay capturas, logs ni resultados inventados.
- No hay capturas de audio (no se puede oír en headless), ni de gamepad (no hay dispositivo), ni de jefes (no se alcanzaron).
- No hay resultados «SUPERADA» sin ejecución: los estados están en `FASE_0_3_TEST_MATRIX.md`.
