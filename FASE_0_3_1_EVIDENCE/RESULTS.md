# Resultados numéricos — Fase 0.3.1

Valores extraídos literalmente de `inc001_session.json`, `inc002_three_runs.json` y `control_supplement.json`.

## INC-001 · disparo primario (10 + 10 intentos)

Condición de partida: `location=CAMPAIGN_ROOM`, `inHub=false`, `transitionLock=false`, `transitionsCompleted=1`, `floorDrop idle`, 1 enemigo asistido vía `DMO.debug.spawnEnemyAt(1350,1000)`.

### Ratón real (`page.mouse.move/down/up`, 450 ms pulsado)

| # | Coordenada | `elementFromPoint` | Δ`shotsFired` | Δproyectiles en `wa` | Δframes | `wa.length` final | ¿`mousedown`? |
|---|---|---|---|---|---|---|---|
| 1 | 760,420 | game | 1 | 1 | 7 | 1 | no |
| 2 | 700,380 | game | 1 | 1 | 10 | 2 | no |
| 3 | 820,460 | game | 0 | 0 | 3 | 2 | no |
| 4 | 640,450 | game | 0 | 0 | 7 | 2 | no |
| 5 | 880,500 | game | 1 | 1 | 5 | 3 | no |
| 6 | 720,500 | game | 0 | 0 | 5 | 3 | no |
| 7 | 800,360 | game | 1 | 1 | 6 | 4 | no |
| 8 | 680,520 | game | 0 | 0 | 5 | 3 | no |
| 9 | 900,400 | game | 0 | 0 | 6 | 3 | no |
| 10 | 760,300 | game | 0 | 0 | 1 | 3 | no |

**Total: 5 disparos / 5 proyectiles creados e insertados en `wa`.** Los proyectiles se mueven entre capturas (ej. intento 1 `x=1378,y=822,life=0.12`; intento 6 el mismo proyectil aparece en `x=1874,y=930,life=0.78`) y desaparecen al expirar (`wa.length` 4→3). `shotsFired` final de la sesión: 9 (5 ratón + 1 alternativo + 4 por frames forzados; `bulletsCount=9`).

### Control alternativo (`DMO.debug.setInput({fire:true})`, 450 ms)

| # | Δ`shotsFired` | Δproyectiles | Δframes | `wa.length` |
|---|---|---|---|---|
| 1 | 0 | 0 | 0 | 0 |
| 2 | 1 | 1 | 7 | 1 |
| 3 | 0 | 0 | 0 | 1 |
| 4 | 0 | 0 | 0 | 1 |
| 5 | 0 | 0 | 4 | 1 |
| 6 | 0 | 0 | 11 | 1 |
| 7 | 0 | 0 | 0 | 1 |
| 8 | 0 | 0 | 7 | 0 |
| 9 | 0 | 0 | 0 | 0 |
| 10 | 0 | 0 | 0 | 0 |

**Total: 1 disparo.** Los intentos con `Δframes=0` no pudieron ejecutar ningún tick del bucle del juego.

### Comparación y aislamiento

| Prueba | Resultado |
|---|---|
| `Q` (bomba) | `kills 0→1`, `score 0→28` (control positivo, igual que Fase 0.3) |
| `setInput({fire:true})` + `DMO.debug.tick(0.016,60)` | `ΔshotsFired=4`, `Δproyectiles=4` — con frames suficientes el disparo es continuo |
| `pointerdown` en `#game` (fase burbuja) | `pointerType:'mouse'`, `defaultPrevented:true` — el juego llama a `preventDefault()` |
| `mousedown` de compatibilidad | **no se emite** (suprimido por `preventDefault()`), pero el juego **no lo necesita**: fija `fa=true` en el propio `pointerdown` |
| `transitionLock` durante los intentos | `false` en los 20 intentos |

## INC-002 · transición HUB → Círculo I (3 ejecuciones independientes)

| Ejecución | Carga (ms) | `startCampaignFromHub(0)` | Completada | Duración hasta `tc=1` | Errores de transición | `pageerror` | Sala cargada | Zona de destino | Control recuperado |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 13.365 | `true` | **SÍ** | 54.358 ms | 0 | 0 | `r0`, visited 1, secured 1, 12 nodos | VESTÍBULO DE TURNOS · ENTRADA SEGURA | disparo +1 proyectil |
| 2 | 22.170 | `true` | **SÍ** | 51.924 ms | 0 | 0 | `r0`, visited 1, secured 1, 12 nodos | VESTÍBULO DE TURNOS · ENTRADA SEGURA | disparo +1 proyectil |
| 3 | 20.502 | `true` | **SÍ** | 53.056 ms | 0 | 0 | `r0`, visited 1, secured 1, 12 nodos | VESTÍBULO DE TURNOS · ENTRADA SEGURA | disparo +1 proyectil |
| 4 (control, frames forzados) | 21.698 | `true` | **SÍ** | **4.655 ms** | 0 | 0 | `r0`, visited 1, secured 1, 12 nodos | VESTÍBULO DE TURNOS · ENTRADA SEGURA | movimiento +21 px, disparo +1 |

Secuencia de estados observada (ejecución 1; las otras dos son equivalentes):

| t (ms) | `location` | `inHub` | `transitionLock` | `transitionsCompleted` | `floorDrop.phase/stage` | `zone` |
|---|---|---|---|---|---|---|
| 510 | TRANSITION | true | true | 0 | `plunge/approach` | THE LAST AFTERPARTY · REFUGIO DEL CLUB |
| 7.640 | TRANSITION | true | true | 0 | `plunge/descent` | THE LAST AFTERPARTY · REFUGIO DEL CLUB |
| 52.835 | CAMPAIGN_ROOM | false | **true** | 0 | `impact/landing` | VESTÍBULO DE TURNOS · ENTRADA SEGURA |
| 54.358 | CAMPAIGN_ROOM | false | **false** | **1** | `idle/idle` | VESTÍBULO DE TURNOS · ENTRADA SEGURA |

> El cambio de `location` a los ~52 s **no es** la transición completada: `transitionLock` sigue `true` y `transitionsCompleted=0` hasta que `floorDrop.onArrivalComplete` termina. La Fase 0.3 abandonó el sondeo a los 20–35 s, antes de que concluyera.

## Comprobación suplementaria de control (transición natural de 57.158 ms)

| Acción | Resultado |
|---|---|
| `d` 1.200 ms + espera 1.600 ms | `px 1250 → 1275` (**+25**) |
| `d` + `debug.tick(0.016,90)` | `px 1275 → 1583` (**+308**) |
| Ratón 700 ms | `shotsFired 0→1`, proyectil en `wa` (`waLen=1`) |
| `Q` | `kills 0→1`, `score 0→28` |

## Errores registrados

En todas las sesiones: **2 errores de consola por carga** («Failed to load resource: 404» de los dos scripts `/cdn-cgi/challenge-platform/...`), **0 `pageerror`**, **0 crashes**, **0 `transitionErrors`**. Los 404 son externos al juego (V-11 / INC-003).
