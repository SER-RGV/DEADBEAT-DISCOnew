# 07_TRANSITION_DEPENDENCIES.md — Dependencias para el ciclo permanente

DEADBEAT DISCO · FASE 01 · Auditoría y rediseño del Refugio
Rama: `arena/8b71cc96-deadbeat-disconew` (desde `main` `2d1f6e8`)
Estado: **solo documentación de dependencias** — no implementar el ciclo completo todavía.

---

## 1. Ciclo objetivo (referencia)

```
MENÚ
  ↓
INTRODUCCIÓN (primera partida)
  ↓
REFUGIO
  ↓
PREPARACIÓN
  ↓
PLATAFORMA DE DESCENSO
  ↓
CINEMÁTICA DE TRANSICIÓN
  ↓
INCURSIÓN
  ↓
MUERTE O FINALIZACIÓN
  ↓
GUARDADO DE PROGRESO PERMANENTE
  ↓
REGRESO AL REFUGIO
  ↓
NUEVA PREPARACIÓN
```

---

## 2. Estado actual de cada eslabón (verificado en código)

| Eslabón | Implementación actual | Archivo / función |
|---------|----------------------|-------------------|
| MENÚ | `DD_BOOT` estado `MAIN_MENU` / `SUBMENU` | `src/dd_boot.js` |
| INTRODUCCIÓN | `DD_CINE.playIntro()` (35s, bloqueante, skippable) → al terminar llama `DD_HUB.enter()` | `src/dd_cinematic_camera.js:99` |
| REFUGIO | `DD_HUB.enter()` (pausa motor, diálogo TEMPO) | `src/dd_hub_system.js:138` |
| PREPARACIÓN | Estaciones Armería (`openShop`), Mapa (`openMap`), DJ (`showDialogue`) | `src/dd_ui_system.js` |
| PLATAFORMA DE DESCENSO | Estación "descent" (880,785) → `exitToRun()` | `src/dd_hub_system.js:157` |
| CINEMÁTICA DE TRANSICIÓN | `DD_CINE.playCircleDescent(1, triggerRun)` (2.9s, bloqueante, letterbox) | `src/dd_cinematic_camera.js` |
| INCURSIÓN | `__DD_BRIDGE.startRun()` (fallbacks `DDC_COVER.start()` / `#start-btn`) | puente del motor |
| MUERTE / FINALIZACIÓN | `DD_CINE.playDefeat()` / `playVictory()` | `src/dd_cinematic_camera.js` |
| GUARDADO PERMANENTE | `localStorage`: `writeSave/hasSave`, clave `SAVE_KEY`; fichas/mejoras/prestigio/logros/bests/historial/victorias/ruta secreta | `src/dd_ui_system.js` |
| REGRESO AL REFUGIO | No hay ruta de retorno automática implementada desde muerte/fin | — (dependencia pendiente) |
| NUEVA PREPARACIÓN | Tras retorno, jugador reaparece en spawn (880,615) al llamar `DD_HUB.enter()` | `src/dd_hub_system.js` |

---

## 3. Dependencias técnicas ya resueltas (funcionan)

| Dependencia | Cómo se resuelve actualmente |
|-------------|------------------------------|
| Intro → Refugio | `playIntro` onComplete llama `DD_HUB.enter()` |
| Refugio → Descenso | `exitToRun()` → `playCircleDescent(1, triggerRun)` → `startRun()` |
| Descenso → Incursión | `triggerRun()` ejecuta `__DD_BRIDGE.startRun()` con fallbacks |
| Pausa durante Refugio | `__DD_BRIDGE.setPaused(true)` en `enter()`; `setPaused(false)` en `exitToRun()` |
| Diálogo de bienvenida | `DD_UI.showDialogue("TEMPO", ...)` al entrar |
| Anti-stall en arranque | `startRunWithDescent` con guardias 4s / 15s y verificación `enterGame()===true` |
| Persistencia permanente | `localStorage` con `RUN dmo_floor_v32` y `PERMANENT` (fichas, mejoras, prestigio, logros, bests, historial, victorias, ruta secreta) |

---

## 4. Dependencias pendientes / problemas para el ciclo permanente

| # | Dependencia / problema | Estado | Impacto |
|---|------------------------|--------|---------|
| 1 | **Regreso al Refugio tras muerte/fin** | No implementado | La muerte no debe enviar automáticamente al menú principal. Falta una ruta `MUERTE/FIN → GUARDADO → REFUGIO` que llame `DD_HUB.enter()` tras guardar. |
| 2 | **Intro no repetirse innecesariamente** | Parcial | `playIntro` llama `DD_HUB.enter()` al terminar. Para partidas posteriores (no primera), se debería saltar la intro y entrar directo al Refugio. No hay evidencia de guardia "primera partida" verificada. |
| 3 | **Reinicio correcto de elementos temporales de incursión** | Parcial | `setPaused(true)` detiene la simulación en el Refugio, pero no hay evidencia de limpieza de estado de incursión (enemigos, proyectiles, progreso de piso) al volver. |
| 4 | **No duplicar partidas, estados ni sistemas de guardado** | Por verificar | `RUN dmo_floor_v32` vs `PERMANENT` deben mantenerse separados; no hay evidencia de conflictos, pero no se ha auditado el guardado completo. |
| 5 | **Transición coherente de retorno** | No implementado | Falta una cinemática o transición visual al volver al Refugio tras una incursión (simétrica al descenso). |
| 6 | **Estado del puente `__DD_BRIDGE` al entrar/salir** | Por verificar | `setPaused(true/false)` y `startRun()` dependen del puente; si el puente no está inicializado, hay fallbacks pero no se ha probado en todos los estados. |

---

## 5. Dependencias entre archivos (grafo simplificado)

```
DD_UI.arriveAtRefuge(isNew)
  └─► DD_HUB.enter() ──► __DD_BRIDGE.setPaused(true)
                         └─► DD_UI.hideMainMenu()
                         └─► DD_UI.showDialogue("TEMPO", ...)

DD_HUB.exitToRun()
  └─► __DD_BRIDGE.setPaused(false)
  └─► DD_CINE.playCircleDescent(1, triggerRun)
        └─► triggerRun() ──► __DD_BRIDGE.startRun()
                              (fallback DDC_COVER.start() / #start-btn)
        └─► DD_UI.hideMainMenu()

DD_CINE.playIntro() ──► (onComplete) DD_HUB.enter()

DD_CINE.playDefeat() / playVictory() ──► (pendiente: ruta a DD_HUB.enter() tras guardar)

Persistencia: DD_UI.writeSave / hasSave (localStorage, SAVE_KEY, RUN dmo_floor_v32, PERMANENT)
```

---

## 6. Reglas de diseño del ciclo (verificación pendiente)

| Regla | ¿Verificada en código? | Comentario |
|-------|------------------------|------------|
| Refugio como núcleo de la experiencia | Sí | `DD_HUB` es el punto de entrada/salida |
| Intro no repetirse innecesariamente | No confirmada | Falta guardia de primera partida |
| Progreso permanente conservado | Sí (parcial) | `localStorage PERMANENT` existe |
| Elementos temporales reiniciados | No confirmada | Falta evidencia de limpieza de incursión |
| Muerte no envía automáticamente al menú | No implementada | Falta ruta de retorno al Refugio |
| Retorno con transición coherente | No implementada | Falta cinemática de regreso |
| No duplicar partidas/estados/guardado | No verificada | Requiere auditoría de persistencia |

---

## 7. Riesgos de implementación del ciclo

1. **Muerte → menú principal por defecto**: si no se implementa la ruta de retorno, el jugador pierde el Refugio como núcleo tras una muerte.
2. **Intro repetida en cada partida**: afectaría la experiencia y el ritmo; requiere un guardia de "primera partida" en `DD_BOOT`/`DD_UI`.
3. **Estado de incursión no limpiado**: podría haber fugas de enemigos, proyectiles o progreso de piso al volver al Refugio.
4. **Acoplamiento a `__DD_BRIDGE`**: el ciclo depende del puente del motor para `startRun`, `setPaused` y `drawPlayerAt`; si el puente cambia, el ciclo se rompe.

---

## 8. Trabajo prioritario (antes de implementar el ciclo)

1. Implementar/verificar la **ruta de retorno al Refugio** tras muerte o finalización (llamar `DD_HUB.enter()` tras guardar).
2. Añadir el **guardia de primera partida** para no repetir la intro.
3. Verificar la **limpieza de estado temporal de incursión** al volver al Refugio.
4. Auditar que `RUN` y `PERMANENT` en `localStorage` no se dupliquen ni conflicten.
5. Diseñar la **transición de retorno** (cinemática o visual) simétrica al descenso.

Estos puntos se documentan aquí pero **no se implementan en esta fase** (FASE 01 = auditoría y propuesta).
