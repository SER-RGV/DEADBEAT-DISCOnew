# TANDA 09 · Fase 1 — Diseño de rutinas y matriz de asignación

**Fecha:** 2026-11-04 · **Estado:** `ENTREGADA · PENDIENTE DE AUTORIZACIÓN PARA FASE 2`
**Base:** auditoría Fase 0 (`ART_TANDA_09_FASE0_INVENTARIO.md`, `ART_EVIDENCE/hub/tanda_09/audit_npc.json`)
**Principio:** cada NPC tiene una razón reconocible para estar donde está. **No todos bailan, no todos caminan, no todos reaccionan y nadie cambia de actividad al mismo tiempo.**

> Esta fase **no modifica el código**. Se presenta la matriz antes de la implementación, según el plan de ejecución. No se han generado recursos ni se ha creado `ART_ASSETS/hub/tanda_09/`.

---

## 1. Qué se puede implementar realmente con los recursos actuales

| Capacidad | Disponible | Cómo se usa en T09 |
|---|---|---|
| 10 props NPC con `hubDraw` vivo, accesibles por `DMO_LAYOUT.propObjects()` | SÍ | Se **envuelve** su pintor; no se crea ningún prop nuevo |
| 5 sprites V5 de pie (2 variantes de bailarín) | SÍ | Igual que hoy; sin frames nuevos |
| `flip` horizontal, `lean`, `bounce`, `rotate`, `alpha` | SÍ | Orientación, postura, intensidad, gestos |
| 4 índices de `stepIdx` sobre el reloj artístico `zz()` | SÍ | Se conserva **el mismo reloj** para no reiniciar animaciones |
| Sombras elípticas, `Wb` glow, puntos de conversación (sin texto) | SÍ | Sin cambios |
| Ciclo común `Tf(dt)` del motor | SÍ | **Un único** acumulador para los 10 NPC |
| `Yc.reduced`, `hub.ambientFrozenAt` | SÍ | Congela toda variación nueva |
| Máquina de estados de actividades | **NO** | T09 aporta la capa fina de estados |
| Sistema de patrulla / rutas | **NO** | No se crea; se conserva el seno ±62 u |
| Sprites sentados / usar máquina / saludo | **NO** | No se inventan; ver carencias |

**Decisión arquitectónica:** T09 es una **capa de rutinas sobre los mismos props y el mismo renderer** (`addHubCustomProp → Lc → Y-sort`), no un sistema de NPC paralelo. Reutiliza el sistema de actividades de T07 como **actividad base** y sólo añade estados, duraciones, pausas y variación. No hay nuevos NPC, props, canvas, loader, assets, intervalos, rAF, cámara, audio, colisiones ni progresión.

---

## 2. Esquema de estados (adaptado a la arquitectura real)

Un único registro **preasignado por NPC** (10 objetos, cero `allocations` por fotograma):

```
{ id, baseAct, anchor{x,y}, zone, seed,
  state,          // ACTIVE | PAUSE | SHIFT | OBSERVE | RESUME
  tLeft,          // segundos restantes, decrementados por el dt COMPARTIDO
  durAct, durPause,
  intensity, targetIntensity,   // multiplicador de bounce/lean/velocidad de frame
  facing, targetFacing,         // flip; se interpola, nunca se invierte en 1 frame
  dx, dy, tdx, tdy,            // offset acotado; easing smoothstep; vuelta al anchor
  holdOffset,     // congela el frame SIN reiniciar phase
  transitionT, eventId }
```

**Transiciones permitidas:** `ACTIVE → PAUSE → ACTIVE`, `ACTIVE → SHIFT → ACTIVE`, `ACTIVE → OBSERVE → ACTIVE`, `ACTIVE → RESUME → ACTIVE` (tras un acontecimiento).

**Continuidad de animación (punto crítico):** `stepIdx` se calcula **siempre** con el mismo reloj artístico `zz()`; durante una pausa se usa `zz() − holdOffset` y al reanudar `holdOffset` decae a 0 en ~0,5 s. Así el frame se detiene y se recupera **sin reiniciar `phase`**, sin salto de sprite y sin salto de posición. Todas las transiciones (intensidad, orientación, offset) se suavizan en 0,35–0,55 s.

**Relojes:** un solo `T09.clock += dt` desde **un** hook `Tf(dt)` encadenado tras T08. Sin `setInterval`, `setTimeout`, `requestAnimationFrame` ni temporizadores por NPC. Variaciones deterministas por `seed` (sin `Math.random`).

---

## 3. Matriz de asignación (10 NPC)

`ART_EVIDENCE/hub/tanda_09/matriz_rutinas.json` es la versión legible por máquina. Duraciones en segundos; `Δ` = desplazamiento máximo en unidades de mundo; `peso` = intensidad de la reacción conservada.

| ID | Zona | Actividad base | Ciclo de estados | Act / Pausa | Intensidad | Δ | Reacción | Razón de estar ahí |
|---|---|---|---|---|---|---|---|---|
| `hub_ambient_dancer_nw` | A | `dance` | ACTIVE → **PAUSE** → ACTIVE | 7,5 / 1,4 | .70–1.10 | 0 | no | Veterano de la pista NW: baila casi siempre, descansa breve |
| `hub_ambient_dancer_ne` | A | `dance` | ACTIVE → **PAUSE** → ACTIVE | 9,2 / 2,1 | .60–1.15 | 0 | no | Desfase y pausa más larga que NW → sin sincronía artificial |
| `hub_ambient_dancer_sw` | A/F | `dance` | ACTIVE → **OBSERVE** → ACTIVE | 6,8 / 1,8 | .55–.95 | 0 | no | Se gira a mirar las máquinas del arcade; deja de bailar un rato |
| `hub_ambient_clubber_bar` | E | `dance` | ACTIVE → **WAIT** → ACTIVE | 8,4 / 2,6 | .45–.90 | 0 | no | En la barra: baila bajo, espera quieta, gira al mostrador |
| `t07_danza_01` | A | `dance` | ACTIVE → PAUSE / **SHIFT** → ACTIVE | 5,6 / 1,2 | .75–1.20 | ≤18 | sí (.90) | El más enérgico; cambia de intensidad y se aparta un paso |
| `t07_danza_02` | A | `dance` | ACTIVE → PAUSE / **SHIFT** → ACTIVE | 7,1 / 1,7 | .70–1.10 | ≤18 | sí (.55) | Pausas desincronizadas con `danza_01` |
| `t07_charla_01` | E | `talk` | ACTIVE → **PAUSE** → ACTIVE (gestos alternos) | 6,2 / 2,2 | .40–.75 | 0 | sí (.45) | Orientado a `charla_02`; la conversación puede terminar |
| `t07_charla_02` | E | `talk` | ACTIVE → **PAUSE** → ACTIVE (desfase) | 8,0 / 1,9 | .35–.70 | 0 | sí (.25) | Responde tarde; apenas mira al jugador |
| `t07_descanso` | E | `rest` | ACTIVE → **POSTURE** → ACTIVE | 11,0 / 3,0 | .25–.45 | 0 | **no** | **DE PIE** junto al mostrador; sólo cambia de inclinación y respiración |
| `t07_recorrido` | D/A | `walk` | ACTIVE → PAUSE / **OBSERVE** → ACTIVE | 9,5 / 2,4 | .55–.95 | ≤25 | sí (.35) | Conserva su ruta seno ±62 u; a veces se detiene a observar |

**`narr_cliente000` queda INTOCABLE** (NPC de historia con estación y diálogo; modificarlo alteraría `NARR`/`storyState`).

### Cumplimiento del principio de comportamiento

| Requisito | Resultado en la matriz |
|---|---|
| No todos bailan | 4 NPC en `talk`/`rest`/`walk` permanente; 2 dancers (`sw`, `clubber_bar`) pasan parte del tiempo en `OBSERVE`/`WAIT` |
| No todos caminan | **8 de 10 con Δ = 0**; sólo `t07_danza_01/02` (≤18 u) y `t07_recorrido` (≤25 u) |
| No todos reaccionan | **5 de 10 sin reacción** (4 dancers + `rest`); las 5 reacciones T07 se conservan con peso 0,25–0,90 |
| No todos cambian a la vez | 10 pares `durAct/durPause` distintos + `seed` por índice; ningún reinicio global |
| Determinista y sencillo | Tablas fijas, `seed`, sin IA generativa, sin decisiones complejas, sin cambios en Director |

---

## 4. Reacciones al jugador

Se **conservan** las 5 reacciones existentes de T07 (`react = clamp((185−dist)/85)` → `flip` + `lean` + `bounce`), con un **peso individual** para que no todos miren con la misma fuerza. `rest` sigue excluido; los 4 `ambientDancers` y `narr_cliente000` siguen sin reaccionar.

Mejora de naturalidad prevista (sólo con recursos existentes):
- Interrupción breve de la actividad al acercarse (0,3–0,6 s) y **reanudación por `RESUME`** sin reinicio de animación.
- Giro hacia el jugador interpolado, no instantáneo.
- Dejar libre el paso: los offsets `dx/dy` se anulan si el jugador está a <70 u, sin cambiar colisiones.

**No se añaden** diálogos, misiones, recompensas, interacciones ni cambios en el control del jugador.

---

## 5. Acontecimientos ambientales (Fase 4)

`round-robin` determinista, **uno simultáneo como máximo**, separación mínima **25 s**, duración **3,0–5,5 s**, sólo con `HUB / EXPLORATION`, sin modal, sin `transitionLock`, sin llegada T07, sin descenso y sin `Yc.reduced`. Todos reversibles y sin efecto en progresión.

| Evento | NPC | Duración | Lectura visual |
|---|---|---|---|
| `conversation_ends` | `t07_charla_01/02` | 4,0 s | Uno deja de gesticular; el otro mantiene un gesto; vuelven al `talk` |
| `group_start` | `hub_ambient_dancer_nw`, `t07_danza_01` | 4,5 s | Un bailarín en pausa reanuda con intensidad 1,20 |
| `arcade_watch` | `hub_ambient_dancer_sw` | 5,0 s | Se gira al oeste y reduce el baile: mira las máquinas |
| `bar_shift` | `hub_ambient_clubber_bar` | 3,5 s | Gira al mostrador y se detiene |
| `two_positions` | `hub_ambient_dancer_ne`, `t07_danza_02` | 5,5 s | Dos NPC intercambian un offset ≤18 u y vuelven a su anclaje |
| `cliff_watch` | `t07_recorrido` | 4,5 s | Detiene el recorrido y se orienta al sur (grieta); luego reanuda |
| `posture_change` | `t07_descanso` | 3,0 s | Cambio de inclinación/alpha, **sin sprite sentado** |

---

## 6. Identidad por zona (adaptada al mapa real)

| Zona | Identidad buscada | Cómo se consigue con comportamiento | NPC |
|---|---|---|---|
| A · Plaza / pista | Energía y actividad con pausas | 6 NPC, intensidades .55–1.20, pausas desincronizadas, ningún reinicio global | 6 |
| B · Cabina norte | Foco musical / llegada | **Quietud deliberada**: ningún NPC ambiental nuevo; la actividad se concentra en A | 0 |
| C · Grieta sur | Contemplación y tensión | Sin NPC permanente; sólo `cliff_watch` raro desde el corredor | 0 |
| D · Arsenal oeste | Tránsito y curiosidad | Único recorrido existente, con pausas y deriva corta | 1 |
| E · Barra este | Conversación, espera y descanso | 2 `talk` desincronizados + `WAIT` + `rest` de pie, casi sin movimiento | 4 |
| F · Arcade / Espejo | Curiosidad y entretenimiento | `hub_ambient_dancer_sw` orientado a las máquinas; sin interacción nueva | 0 |
| Anillo / corredores | Tránsito | Se conserva la ruta seno ±62 u; no se crea patrulla | 1 |

Sin cambios de arquitectura, mobiliario, cámara ni composición: la identidad viene **sólo del comportamiento**.

---

## 7. Integración prevista (Fase 2/3, NO ejecutada aún)

| Punto | Acción |
|---|---|
| `DEADBEAT_DISCO.ART.html` L7892 | Módulo `T09` **tras** `/* === TANDA08:END (módulo) */`, dentro de `initDmoHubV35()` (ámbito con `g`, `Yc`, `Z`, `Tf`, `hub`, `floorDropAnim`) |
| `DEADBEAT_DISCO.ART.html` L8869 | `T09.install();` **tras** `T08.install();` en `buildHubSpace()`, con marcadores `TANDA09:BEGIN/END` |
| Diff esperado | **2 inserciones, 0 eliminaciones.** T01–08 intactas |
| `ART_PACK/art_pack.js` | **SIN CAMBIOS**: T09 no añade assets, loader ni versión nueva |
| Acceso a props | `window.DMO_LAYOUT.propObjects()` → se guardan los 10 `hubDraw` originales y se envuelven |
| Render | Mismo `hubCustom → Lc → Y-sort`, mismos sprites V5, mismas sombras y glow |
| `ART_ASSETS/hub/tanda_09/` | **NO se crea**: no hay recursos nuevos justificados |

**Flag reversible `window.__DDM_HUB_T09`:**
- `false` en el arranque → `install()` no monta nada (cero código T09 ejecutado).
- `false` en caliente → cada wrapper delega **íntegramente** en el `hubDraw` original de T01–T08; las actividades, reacciones y animaciones vuelven al estado anterior.
- `true` de nuevo → reanuda desde los anclajes y la actividad base, sin residuos.
- API de QA: `window.DMO_HUB_T09.state()`, `.audit()`, `.setEnabled(v)`.

---

## 8. Rendimiento y estabilidad (diseño)

- 10 registros preasignados; **1** acumulador; **0** props nuevos, **0** canvas, **0** intervalos por NPC, **0** `allocations` por fotograma.
- `update()` sale temprano si `!inHub`, `location ≠ HUB/TRANSITION`, modal abierto, `transitionLock` o `Yc.reduced`. No se actualizan rutinas invisibles.
- No se cambia la frecuencia global del motor ni la respuesta del jugador.
- Sin `Math.random`, sin acumulación de temporizadores, sin estados huérfanos.
- Compatibilidad con T07 (`__DDM_HUB_T07`) y T08 (`__DDM_HUB_T08`): si cualquiera está en `false`, T09 no interviene en los props afectados.

---

## 9. Carencias documentadas (propuestas SIN generar)

| Carencia | Propuesta |
|---|---|
| No existe animación de **sentado** | 1 sprite sentado para `t07_descanso`. **No se generará sin autorización expresa.** Mientras tanto, permanece de pie con cambios de postura |
| No existe animación de **usar/mirar arcade** | Zona F se resuelve con orientación + pausa; propuesta futura de 1 frame «observando máquina» |
| No existe animación de **saludo** | Se reutiliza `lean` + `flip` |
| No existe **patrulla** | No se crea; se conserva la ruta seno ±62 u |
| Zonas B y F sin NPC ambiental | No se añaden NPC nuevos en esta tanda |
| `narr_cliente000` | Queda intacto por su vinculación narrativa |

---

## 10. Validación prevista (Fase 5, NO ejecutada aún)

16 comprobaciones sobre varios **ciclos completos** (mínimo 3 ciclos por NPC, no un único cambio de animación): presencia de los 11 NPC, 6 actores T07, 4 dancers intactos, actividades asignadas, variación entre personajes, pausas, continuidad de frames, ausencia de saltos de posición y de movimientos erráticos, solapamientos, accesos/estaciones libres, reacciones, compatibilidad con el movimiento del jugador, `Yc.reduced`, rendimiento, regresión T01–08 y A/B con `__DDM_HUB_T09`. Clasificación `APROBADO / FALLIDO / BLOQUEADO / NO VERIFICADO`.

---

## 11. Puerta de entrada a la Fase 2

**No se ha modificado el código.** La auditoría F0 (14 APROBADO / 0 FALLIDO / 4 BLOQUEADO / 2 NO VERIFICADO, 0 errores críticos) y esta matriz F1 son los entregables previos a la implementación.

Se solicita autorización para pasar a la **Fase 2 (implementación de la capa de rutinas en el HTML activo)** y continuar con Fases 3–5. Si se prefiere ajustar primero alguna asignación, duración, acontecimiento o el tratamiento de las zonas B/F, se corrige la matriz antes de tocar el juego.
