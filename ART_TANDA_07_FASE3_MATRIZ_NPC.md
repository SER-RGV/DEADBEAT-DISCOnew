# TANDA 07 · FASE 3 — Matriz de vida de NPC

**Estado:** `IMPLEMENTADO_VALIDADO` · 2026-11-04 · rama `arena/109fe45c-deadbeat-disconew`
**Alcance:** vida de NPC en el HUB real, **sin IA, sin diálogos, sin misiones, sin colisiones, sin sprites nuevos**.
**Flag A/B:** `window.__DDM_HUB_T07 = false` retira los 6 actores (y todo lo demás de T07) sin recargar.

---

## 1. Decisión de producción: cero sprites nuevos

Se generaron y se **descartaron** dos pruebas de «clubber sentada» (`hub_t07_06_clubber_sentado*.png`): el generador devolvió figuras de pie/apoyadas pese al prompt. El preparador `ART_TOOLS/prepare_hub_tanda_07.py` las elimina y deja `npcSpritesGenerated: 0`.

Razón: el juego ya tiene un mecanismo probado para alternar frames de figurantes —`ambientDancers`/`drawFigurant` usan `Math.floor(t * 5.6 + phase) & 3` sobre `__DDM_V5_IMG`— y un registro V5 con 5 NPC ilustrados. La Fase 3 se resuelve **reutilizando** esos recursos en el mismo `addHubCustomProp → Lc → Y-sort`, que es exactamente el patrón de TANDA 04/05/06.

Sprites V5 reutilizados (extraídos en Fase 2 a `ART_ASSETS/hub/tanda_07/_refs/` para contraste):

| Sprite V5 | Tamaño | Uso en T07 |
|---|---|---|
| `hub_clubber_dancer_a` | 109×232 | danza / recorrido (frame par) |
| `hub_clubber_dancer_b` | 131×232 | danza / recorrido (frame impar) y charla B |
| `hub_bouncer_npc` | 101×232 | charla A |
| `hub_bartender_npc` | 95×232 | descanso (apoyado en barra) |
| `hub_cliente000_npc` | 96×232 | reserva / `fallback` |

Los 4 `hub.ambientDancers` originales (NW 1030,785 · NE 1470,785 · SW 1015,1085 · bar 1965,918) **no se tocan**: el HUB pasa a 10 figuras ambientales, 6 de ellas con actividades diferenciadas.

---

## 2. Matriz de actores

Todos: `solid:false`, `tall:true`, `sortY = y + 2` (línea de pies), `r:20`, sombra elíptica de pies, pivote inferior, `imageSmoothingEnabled`, sin colisiones ni estaciones.

| ID | Actividad | Mundo (x,y) | h | Sprite | Movimiento | Reacción al jugador |
|---|---|---|---|---|---|---|
| `t07_danza_01` | danza | 1120, 900 | 96 | `dancer_a/b` alternados | 4 frames @ `t·5.6`, bote ≤3 px, lean ±0,065 rad, deriva ±3 px | gira + saludo leve |
| `t07_danza_02` | danza | 1380, 900 | 96 | `dancer_a/b` alternados | idem, `phase 2.15`, `rate 0.86`, espejo inicial | gira + saludo leve |
| `t07_charla_01` | conversación | 1690, 1010 | 92 | `hub_bouncer_npc` | respiración lenta, lean ±0,035, bote ±1 px, **3 puntos** que se alternan (sin texto) | gira + saludo leve |
| `t07_charla_02` | conversación | 1780, 1010 | 92 | `hub_clubber_dancer_b` | idem desfasada `phase 2.60`, espejo | gira + saludo leve |
| `t07_descanso` | descanso | 1910, 900 | 88 | `hub_bartender_npc` | inclinación 0,085 rad casi estática, `alpha 0.86`, bote ≤1 px | **sin reacción** (descansa) |
| `t07_recorrido` | recorrido | 900 ± 62, 700 | 94 | `dancer_a/b` alternados | patrulla sinusoidal con reloj real acumulado, 4 frames, `flip` por inversión de marcha | gira + saludo leve |

### Reacción al jugador (sin IA)

```
dist   = hypot(ye.x - a.x, ye.y - a.y)
react  = clamp((185 - dist) / 85, 0, 1)
```

Si `react > 0` y la actividad no es `rest`: el actor se gira hacia el jugador (`flip = dx < 0`), incrementa levemente la inclinación y el bote. **No hay máquina de estados, ni pathfinding, ni cambio de estación, ni inventario de frames nuevo.** Con `Yc.reduced` la reacción es `0`.

### Movimiento reducido

`Yc.reduced` se respeta en los 6 actores: `frame = 0`, `bounce = 0`, `lean = 0`, `x` fijo, `flip` fijo, `react = 0`, sin puntos de conversación ni brasas. Verificado en un contexto Chromium con `reducedMotion:'reduce'` (QA `T07-34`).

---

## 3. Integración en el render existente

```
buildHubSpace()
  └─ T07.installActors()   // 6 × addHubCustomProp({ solid:false, tall:true, sortY, hubDraw })
  └─ T07.installHooks()    // una sola vez, en tiempo de arranque
```

`addHubCustomProp` empuja a `tc` (`onFloor:true`) y `Lc(prop)` llama a `prop.hubDraw(g, prop)` en coordenadas **mundo**. Es el mismo camino que usan los decorados de TANDA 04–06; no se crea un segundo pintor, canvas, cámara, `requestAnimationFrame` ni sistema de colisiones.

Los enganches `Wf/Ph/zf/Tf` se montan **desde `buildHubSpace()`**, no en el cierre exterior del script: en el ámbito de `initDmoHubV35` es donde `Wf/Ph/zf/Tf` existen (igual que TANDA 04/05/06), y al ejecutarse en tiempo de arranque quedan como **último eslabón** de cada cadena ya montada. Un primer intento de montarlos en el cierre exterior produjo `ReferenceError: Wf is not defined`; se corrigió sin tocar el motor.

---

## 4. Trazabilidad de verificación

| Métrica | Resultado | Prueba |
|---|---|---|
| Actores / actividades | 6 / 5 | `T07-15` |
| Frames alternados (danza y recorrido) | `[0,1,2,3]` en ambos | `T07-16` |
| Recorrido: posiciones distintas / span / `flip` | 29 / **120 px** / ambos valores | `T07-17` |
| Reacción cerca y ausencia en `rest` | `danza_01 r=1`, `descanso r=0` | `T07-18` |
| `solid:false` + WASD | cámara avanza 192 px con `d` | `T07-19` |
| Estaciones / zonas intactas | 11 / 6 | `T07-14`, `T07-22` |
| 0 `pageerror` | 0 | `T07-31` |
| Movimiento reducido | llegada 0,95 s, NPC congelados | `T07-34` |

Captura de contraste: `ART_EVIDENCE/hub/tanda_07/t07_qa_02_npc_centro.jpg`.
Informe completo: `ART_EVIDENCE/hub/tanda_07/qa_tanda07.json` (**35/35 APROBADO**).

---

## 5. Límites declarados

- No se ha inventariado el **repertorio completo de frames** de los sprites V5 originales; T07 alterna los dos `hub_clubber_dancer_*` que el juego ya alternaba.
- No hay vídeo continuo, mando físico ni audio audible verificados (heredado de Fase 0).
- No se añade diálogo, misión, interacción `[E]`, guardado ni progresión.
- `officialUntainted:false` aparece en QA por usar `DMO.debug.teleport` y `debugSpawnBeacon`; es un artefacto del arnés, no del juego.
