# 08_QA_REPORT.md — Informe de pruebas y validación del Refugio

DEADBEAT DISCO · FASE 01 · Auditoría y rediseño del Refugio
Rama: `arena/8b71cc96-deadbeat-disconew` (desde `main` `2d1f6e8`)
Estado: **solo planificación de pruebas** — **no se ha ejecutado el juego en este entorno**.

---

## 1. Limitación importante (leer primero)

No se ha podido ejecutar el juego (motor Canvas 2D con carga de imágenes y bucle de render) en el entorno de trabajo disponible, por lo que **ninguna prueba de esta sección ha sido ejecutada realmente**. Conforme a las reglas de trabajo:

- No se afirman pruebas pasadas sin ejecución real.
- No se simulan resultados.
- No se presentan capturas estáticas como prueba de fluidez.

Todas las pruebas abajo están **planificadas** con su procedimiento, resultado esperado y estado `NO EJECUTADO`. Deben ejecutarse en un entorno con servidor local (o navegador con acceso a `file://` permitido para imágenes) antes de dar por válida la fase.

---

## 2. Casos de prueba planificados

| ID | Prueba | Procedimiento | Resultado esperado | Estado | Evidencia |
|----|--------|---------------|--------------------|--------|-----------|
| QA-01 | Inicialización del Refugio | Cargar juego, llegar al Refugio (tras intro o menú) | `DD_HUB.isActive() === true`, protagonista en (880,615), diálogo TEMPO visible | NO EJECUTADO | — |
| QA-02 | Movimiento del protagonista | Teclas WASD / gamepad izquierdo | Protagonista se mueve a 285 u/s, respeta bounds (margen 38 / 62) | NO EJECUTADO | — |
| QA-03 | Colisiones con props | Acercarse a cada uno de los 22 props | Pushout circular (`br*0.72+18`), no atraviesa muebles | NO EJECUTADO | — |
| QA-04 | Colisiones con paredes/bounds | Intentar salir del rectángulo HUB_BOUNDS | Clamp en X 298–1462, Y 272–894 aprox. | NO EJECUTADO | — |
| QA-05 | Interacción con estaciones | Acercarse a cada estación (r 95–106), pulsar `[E]/(A)` | Prompt visible dentro del radio; estación responde (descenso, armería, mapa, DJ) | NO EJECUTADO | — |
| QA-06 | Cámara | Moverse por la sala | Zoom 1.02–1.6, cámara sigue protagonista con clamp, sin bandas negras | NO EJECUTADO | — |
| QA-07 | Orden de renderizado | Colocarse delante/detrás de props y NPCs | Y-sort correcto por coordenada Y; protagonista no queda incorrectamente oculto | NO EJECUTADO | — |
| QA-08 | Carga de recursos | Abrir consola del navegador | Sin errores 404 en imágenes del HUB; `pm_idle_fid_00.png` carga y mide 288×512 | NO EJECUTADO | — |
| QA-09 | Resoluciones diferentes | Redimensionar ventana / probar distintos tamaños | Zoom se adapta (`min(viewW/1150, viewH/780)`), sala se ve completa | NO EJECUTADO | — |
| QA-10 | Escalado del protagonista | Verificar sprite en pantalla | drawH 112 unidades, sin espejado, bob respiración ±0.7 / paso 2.2 | NO EJECUTADO | — |
| QA-11 | Ausencia de errores en consola | Jugar un ciclo completo | Sin mensajes de error ni advertencias no controladas | NO EJECUTADO | — |
| QA-12 | Imágenes rotas | Revisar carga de todos los assets del HUB | Sin imágenes rotas ni placeholders | NO EJECUTADO | — |
| QA-13 | Duplicaciones | Comparar assets cargados vs manifiesto | Sin duplicados funcionales; variantes del protagonista no usadas documentadas | NO EJECUTADO | — |
| QA-14 | Compatibilidad con estados | MENÚ → INTRO → REFUGIO → DESCENSO → INCURSIÓN | `DD_BOOT` y `DD_CINE` controlan el flujo; `setPaused(true/false)` funciona | NO EJECUTADO | — |

---

## 3. Pruebas específicas del ciclo permanente (pendiente de implementación)

| ID | Prueba | Resultado esperado | Estado |
|----|--------|-------------------|--------|
| QA-15 | Intro no repetirse en partidas posteriores | Guardia de primera partida salta la intro | NO EJECUTADO |
| QA-16 | Retorno al Refugio tras muerte/fin | `DD_HUB.enter()` tras guardar; no menú principal automático | NO EJECUTADO |
| QA-17 | Limpieza de estado de incursión al volver | Sin enemigos/proyectiles/progreso de piso residuales | NO EJECUTADO |
| QA-18 | No duplicar guardados RUN/PERMANENT | `localStorage` consistente | NO EJECUTADO |

---

## 4. Capturas requeridas (cuando se disponga de entorno de ejecución)

Archivarlas en `docs/HUB_AUDIT/capturas/` con resolución consistente (1280×720) y documentar condiciones (versión, rama, fecha):

1. Vista general del Refugio.
2. Vista desde la entrada/spawn.
3. Vista de la plataforma de descenso.
4. Vista de las estaciones (armería, mapa, DJ).
5. Vista del protagonista (idle y movimiento).
6. Vista de elementos arquitectónicos (muro norte, faroles, mural zorro).
7. Plano esquemático del escenario (ya en `05_CURRENT_LAYOUT.md` y `06_PROPOSED_LAYOUT.md`).
8. Comparación actual vs propuesta (solo tras aprobación del rediseño).

---

## 5. Registro de resultados (plantilla por turno de ejecución)

```
ID: QA-01
Prueba: Inicialización del Refugio
Resultado: [PASÓ / FALLÓ / NO EJECUTADO]
Evidencia: [captura / consola / log]
Problemas detectados: ...
Estado de resolución: [abierto / resuelto / pendiente]
```

> Este informe se completará con resultados reales una vez se ejecute el juego en un entorno válido. Hasta entonces, todos los estados son `NO EJECUTADO`.
