# FASE 08 · IMPLEMENTATION_LOG

Rama: `arena/e088e9d7-deadbeat-disconew` (sustituye a `feature/phase-08-world-scale`,
que no puede crearse en esta sesión; comunicado). Sin merge automático.

## Etapas

| Etapa | Contenido | Estado |
|---|---|---|
| A · Auditoría | lectura del ORIGINAL, renderer, puente, HUB, cinemática; sonda ANTES 1080p; `SCALE_AUDIT.md` | **hecha** (2026-11-14) |
| B · Especificación | `SCALE_SPEC`, `CAMERA_SPEC`, `MAP_SCALE_SPEC`, `ENTITY_SCALE_SPEC`, `COLLISION_AUDIT`; perfil `intermedia` en `src/dd_world_scale.js` | **hecha** |
| C · Cámara | `src/dd_camera.js` + parche del seguimiento en `Tf` (bloque `1e(a)` del build) + accesor `__ddViewDims`; 18 pruebas Node | **hecha y probada** |
| D · Entidades | ganchos `scaleOf` en el renderer (enemigos, minijefes, muertes, jefes, pickups), jugador + arma en el puente | **hecha y probada en juego** (sonda) |
| E · Mapas | `scaledRoomSize` en `ng()` (bloque `1e(b)`), clasificación por ranura | **hecha y probada en juego** (sonda: tamaños por clase) |
| F · Colisiones | auditoría e inventario; comprobación de `r` y de `ut.h` en simulación | **hecha** (sin cambios de hitbox, por diseño) |
| G · QA | pruebas Node (18/18), sonda ANTES/legacy/DESPUÉS a 1920×1080, 1600×900, 1280×720, capturas de 6 situaciones, trayectoria de cámara, coste por cuadro | ver `QA_REPORT.md` |
| H · Entrega | esta carpeta, commit por etapa, PR | en curso |

## Archivos nuevos

| Archivo | Qué es |
|---|---|
| `src/dd_world_scale.js` | `window.DD_SCALE`: perfiles `legacy` / `intermedia`, selección por `?scale=` o `localStorage.dd_scale_profile`, API `player/pickup/mini/camera/roomMax/enemyScale/bossScale/roomClass/roomScale/scaledRoomSize/setProfile/describe`; `module.exports` para Node |
| `src/dd_camera.js` | `window.DD_CAMERA`: `step(dt, input)`, `worldToScreen/screenToWorld/zoomForViewport`, `clampCenterToBounds/roomBounds/computeZoomTarget`, `isActive/setEnabled/reset/config/debug` |
| `tests/world_scale/camera.test.mjs` | 18 pruebas `node --test` (mundo↔pantalla, seguimiento, anticipación, límites de zoom, histéresis, tasa de zoom, zona segura, pared, vibración, límites de sala, transición/teletransporte, inmutabilidad de la simulación, modo jefe, perfil intermedia, salas, perfil legacy) |
| `tools/world_scale/probe_scale.js` | sonda playwright: capturas `room_normal/room_crowd/corridor/boss_arena/transition/edge`, telemetría, trayectoria, coste por cuadro; args `--tag --res --levels --profile --url --dpr` (un navegador por resolución) |
| `docs/WORLD_SCALE_REBUILD/*` | esta documentación + `BEFORE_AFTER/` |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `tools/build_active_html.py` | `MODULE_ORDER` (+`dd_world_scale.js`, +`dd_camera.js` antes del renderer); bloque **`1e`**: (a) seguimiento de cámara → `DD_CAMERA.step` con vuelta a `B/L/N.zoom/N.look` + `Q()`, accesor `__ddViewDims`; (b) `scaledRoomSize` en `ng()`; bloque ARMAS: `getPlayerWeaponMount(pA, aimA, DD_SCALE.player)`, `ut.h = 95·escala` durante el dibujo, `drawProtagonist(..., escala)`; `addEnemyDeath` guarda `rec.mini` |
| `src/dd_world_renderer.js` | `scaleOf`, `enemyFigureHeight(family, r, mini)`, `enemyGeometry`, `drawEnemyDeath`, `bossFigureHeight`, `drawPickup`, export `__scaleDebug` |
| `index.html`, `DEADBEAT_DISCO.html` | regenerados por el build (5 668 749 B) |

Sin cambios: `backups/*.ORIGINAL.html`, `dd_hub_system.js`, `dd_cinematic_camera.js`,
`dd_ui_system.js`, `dd_asset_registry.js`, assets.

## Arquitectura resultante

```
DD_SCALE (perfil) ──► dd_world_renderer (alturas de figura, pickups)
        │           ──► puente/ARMAS (jugador + ut.h de dibujo)
        │           ──► ng() (tamaño de sala por clase)
        └──► DD_CAMERA.config()
DD_CAMERA.step() ◄── Tf (cada cuadro, antes de Qf) ──► B, L, N.zoom, N.look ──► Q()
                                                        └► Qf (transform) · Gu (ratón) · DMO.camera() · DD_CINE (offset/zoomMul encima)
```

## Decisiones registradas

* Perfil `legacy` como interruptor de compatibilidad (`?scale=legacy`): reproduce
  exactamente la build anterior (verificado con la sonda: zoom 0,800, figuras 104/94/…, trayectoria idéntica).
* Un navegador por resolución en la sonda (con `--single-process` cerrar un
  contexto tumbaba Chromium).
* La arena real del residente es el **nivel 11** (ranura 10), no el 10: la
  captura `boss_arena` de la primera pasada ANTES (nivel 10 + jefe forzado) se
  conserva sólo como referencia; la comparación válida es `legacy` vs `after`
  a nivel 11.
* El coste por cuadro se mide con `renderNow()`/`testStep()` en headless
  swiftshader: sirve para comparar ANTES/DESPUÉS, no son fps reales.

## Problemas encontrados

* `ReferenceError: Cannot access 'y' before initialization` al leer `y/x` dentro
  de `Tf` (TDZ por sombreado) → accesor `__ddViewDims` en ámbito superior.
* Primera versión de `scaledRoomSize` ya acotaba por eje; la "arena" medida a
  nivel 10 era una sala de combate con jefe forzado (ver arriba).

## Pendiente

* Pruebas con mando: **no ejecutables** en este entorno (sin dispositivo); el
  código de mando (`Mu`) no se ha tocado y no depende de la cámara.
* Ajuste fino de `roomMargin`/`safeFrac` con jugadores reales.
* Revisión de hitboxes por tipo (decisión de diseño separada; ver `COLLISION_AUDIT.md`).
