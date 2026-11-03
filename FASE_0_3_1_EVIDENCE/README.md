# Evidencias — Fase 0.3.1 (confirmación de incidencias)

Fecha: 2026-11-02. Rama: `arena/b89cd6bc-deadbeat-disco`. Build: `v9_t3_fase1b_cache_probe.html` **sin modificar** (SHA-256 `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a`).

Todas las capturas son `Page.captureScreenshot` vía CDP sobre Chromium Headless 153.0.8010.0 sirviendo el HTML original por `http://127.0.0.1:8123/`. Los `.json` son volcados sin editar de consola, Network, `pageerror` y estado del motor. **No hay resultados simulados ni capturas inventadas.**

## Índice de capturas

| Archivo | Sesión | Contenido observado |
|---|---|---|
| `01_inc001_room_ready.png` | INC-001 | Sala «CÍRCULO I · LIMBO / ENTRADA SEGURA» con transición completada, HUD, minimapa y overlay DMO-DEBUG |
| `02_inc001_mouse_attempts.png` | INC-001 | Tras los 10 intentos con ratón; el overlay del propio juego muestra «balas 0» (métrica de proyectiles **enemigos**), «salas 1/11» y «RONDA 1 · OLEADA ESTÁNDAR» |
| `03_inc001_alt_attempts.png` | INC-001 | Tras los 10 intentos con `DMO.debug.setInput({fire:true})` |
| `04_inc001_after_Q.png` | INC-001 | Tras la habilidad `Q` (control positivo: baja +28 puntos) |
| `05_run1_hub.png`, `05_run2_hub.png`, `05_run3_hub.png`, `05_run4_hub.png` | INC-002 | Refugio en el instante previo a `startCampaignFromHub(0)`, una por ejecución independiente |
| `06_run1_transition.png`, `06_run2_transition.png`, `06_run3_transition.png` | INC-002 | Animación de descenso en el ascensor a los ~10 s: **animación visual, transición aún NO completada** (`plunge/descent`, `transitionLock:true`) |
| `07_run1_final.png`, `07_run2_final.png`, `07_run3_final.png`, `07_run4_final.png` | INC-002 | Sala de destino tras completar la transición, con el control recuperado |
| `08_control_arrival.png` | Control suplementario | Llegada a `CAMPAIGN_ROOM` tras transición natural (~57 s) |
| `09_control_after_actions.png` | Control suplementario | Tras mover con `d`, disparar y usar `Q`; el overlay indica `x:1583`, sala 001/100 |

## Índice de trazas

| Archivo | Contenido |
|---|---|
| `discover_runtime_api.json` | Inventario de APIs reales (`DMO.debug`, `DMO_HUB`, `DMO.floorDrop`, `DMO_CINE.state().floorDrop`), traza de 45 s de una transición, y primer indicio de `CAMPAIGN_ROOM` con `transitionLock:true` |
| `inc001_session.json` | **Traza completa de INC-001**: espera a transición completada, 10 intentos de ratón, 10 intentos de control alternativo, comparación con `Q`, prueba de frames forzados, eventos (`pointerdown` con `prevented:true`, ausencia de `mousedown`), `wa.push` de cada proyectil y consola/Network |
| `inc002_three_runs.json` | **Tres ejecuciones independientes** de INC-002 (sondeos cada 500 ms: `hub`, `zone`, `dungeon`, `floorDrop.phase/stage`, frames, `shotsFired`, errores) + una cuarta de control con frames forzados |
| `control_supplement.json` | Comprobación de control recuperado tras transición natural: movimiento `d` (+25 px / +308 px con frames forzados), disparo (+1 proyectil) y `Q` (baja +28) |
| `RESULTS.md` | Tablas numéricas derivadas de los JSON (sin interpretación añadida) |
| `ENVIRONMENT.md` | Versiones, capacidades, ausencia de GUI/Xvfb, limitaciones |
| `TOOLING.md` | Scripts de diagnóstico (fuera del repo) y extracto de la instrumentación |
| `GUI_MANUAL_CHECK.md` | Comprobación manual pendiente y pasos breves |
| `EVIDENCE_HASHES.txt` | SHA-256 de cada archivo de este directorio (excepto él mismo) |
| `diag_*.js.txt` | Copias literales de los scripts de diagnóstico para reproducibilidad |

## Instrumentación temporal (no modifica la build)

Se inyectó con `page.addInitScript`, **en el navegador de pruebas**, antes de los scripts del juego:

1. Observador de `Array.prototype.push`: detecta objetos con `weaponSerial` + `accuracyCohort` (firma de los proyectiles **del jugador** creados en `wd()`), guarda una instantánea y conserva la referencia al array del mundo (`wa`). Permite comprobar que el proyectil entra en el mundo, se mueve (`x`, `y`, `life`) y expira.
2. Listeners en captura y burbuja de `pointerdown/pointerup/mousedown/mouseup/click/keydown/keyup`, con `target`, `pointerType` y `defaultPrevented`.
3. Contador de frames `requestAnimationFrame` propio (no se altera el bucle del juego).
4. Métricas del motor: `DMO.testStats().shotsFired/shotsHit`, `DMO.debug.state()`, `DMO_HUB.state()`, `DMO_DUNGEON.state()`, `DMO.floorDrop.state()`, `DMO_CINE.state()`, `DMO.gamepad.state()`.
5. `DMO.debug.setInput({fire:true|false})` como **control alternativo** del propio motor; `DMO.debug.tick(0.016, N)` para aislar la inanición de frames.

**Corrección metodológica clave:** `DMO.debug.state().balas` / `balasArr` y `DMO.testStats().balas` cuentan `Ia`, el array de **proyectiles enemigos**. Los proyectiles del jugador están en `wa` y su contador fiable es `un.shotsFired` (`DMO.testStats().shotsFired`). La Fase 0.3 interpretó `balas:0` como «no se dispara»; era la métrica equivocada. El HUD/overlay del propio juego («balas 0») usa la misma métrica de enemigos.

## Limitaciones

- **No hay navegador con interfaz gráfica**: sin `DISPLAY`, sin Xvfb/Xorg/weston, sin paquete `xvfb` instalable, sin mando físico ni salida de audio. No se han realizado pruebas manuales ni se han simulado.
- Solo Chromium Headless 153 con SwiftShader; la cadencia de `requestAnimationFrame` es muy irregular (0–10 frames por intento de 450–700 ms), lo que hace intermitente el disparo y alarga la transición. Se aísla con `debug.tick`.
- Los scripts `diag_*.js.txt` viven originalmente en `/home/user/qa_tools/` (fuera del repositorio).
- Los scripts Cloudflare siguen produciendo 2×404 y 2 errores de consola por carga; son externos y no se han eliminado.
