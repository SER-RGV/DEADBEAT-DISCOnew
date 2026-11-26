# TANDA 09 — «El HUB como lugar habitado»

**Estado:** `COMPLETADA · INTEGRADO_VALIDADO` · **Fecha:** 2026-11-04
**Rama:** `arena/109fe45c-deadbeat-disconew` · **PR #1:** `OPEN`, base `arte-y-recursos`, **sin merge** · `main` intacta (`d75e021`)

---

## 1. Objetivo y resultado

Convertir el HUB en un lugar con **comunidad extraña que vive alrededor de la grieta**: cada NPC con una razón reconocible para estar donde está, identidad ambiental por zona y variación determinista. **No todos bailan, no todos caminan, no todos reaccionan y nadie cambia de actividad al mismo tiempo.**

Se reutilizan los **6 actores de T07**, los **4 `ambientDancers` originales** y el renderer existente. Se añade una **capa fina de rutinas**, no un sistema de NPC paralelo: mismos 10 props, mismo `addHubCustomProp → Lc → Y-sort`, mismos sprites V5, **un único** acumulador `Tf(dt)`.

---

## 2. Fases

| Fase | Entregable | Resultado |
|---|---|---|
| F0 | Auditoría real en Chromium | 20 filas: **14 APROBADO / 0 FALLIDO / 4 BLOQUEADO / 2 NO VERIFICADO**; 0 errores críticos |
| F1 | Matriz de asignación **presentada antes de modificar código** | `ART_TANDA_09_FASE1_MATRIZ_RUTINAS.md`, `matriz_rutinas.json`; autorizada por el usuario |
| F2 | Capa de rutinas + 4 posturas nuevas autorizadas | `ART_TOOLS/hub_tanda_09_block.js`; `ART_ASSETS/hub/tanda_09/` |
| F3 | Integración por zona A–F | 6 capturas por zona, 4 de postura, A/B de flag |
| F4 | 7 acontecimientos cotidianos | 3 disparados y completados en 100 s; breves, raros, reversibles |
| F5 | QA de 16 puntos durante varios ciclos | **16 APROBADO / 0 FALLIDO**, + 3 BLOQUEADO + 6 NO VERIFICADO |

---

## 3. F0 — Lo que se encontró realmente

- **11 props NPC** con `hubDraw` vivo: 4 `ambientDancers` T01, 6 actores T07 y `narr_cliente000` (narrativo, **intocable**).
- **62 props** totales, **11 estaciones**, **6 zonas oficiales A–F**, 178 claves V5, 27 canvas, 1 secuenciador.
- **5 sprites V5 de pie** (imagen única, 95–131 × 232), 2 variantes de bailarín alternadas por paridad, `flip` horizontal, pivote en la línea de pies.
- **No existía máquina de estados**: `act` era fijo desde `installActors()`. Medido en 24 muestras: `dance`/`walk` 4 frames y 21–22 cambios; `talk`/`rest` **1 frame y 0 cambios**; la actividad **nunca cambiaba**.
- **`patrol = 0`** en todo el HTML; único desplazamiento: seno ±62 u de `t07_recorrido`.
- Reacciones: `clamp((185−dist)/85)` en 5 actores T07; `rest` excluido; los 4 dancers y el NPC narrativo no reaccionan.
- **Zonas reales:** «Entrada», «Zona de descanso», «Corredores» y «Acantilado» **no son zonas formales**. B (cabina) y F (arcade/espejo) no tenían NPC ambiental propio.
- **Restricción crítica:** `dancer_0…3` se crean copiando `dc.x/dc.y` en `NARR_afterBuild()` → los anclajes de los 4 dancers son inmutables.
- **Descubrimiento técnico:** `window.DMO_LAYOUT.propObjects()` devuelve un **clon profundo** (`oA/tA`), sirve para inventario pero **no** para enganchar el pintor; hay que usar el array real `tc`.

Documentos: `ART_TANDA_09_FASE0_INVENTARIO.md`, `inventario_npc.json`, `mapa_zonas.json`, `matriz_auditoria.json`, `audit_npc.json` + 9 capturas.

---

## 4. F1 — Matriz de asignación (autorizada antes de tocar el juego)

Esquema `ACTIVE → PAUSE / SHIFT / OBSERVE / WAIT / POSTURE → RESUME → ACTIVE`, con **10 pares de duraciones distintos**, intensidades y pesos de reacción individuales, `seed` determinista (sin `Math.random`) y continuidad de frame por `holdOffset`.

| Zona | Identidad | NPC | Comportamiento |
|---|---|---|---|
| A · Plaza/pista | Energía con pausas desincronizadas | 6 | 7,5/9,2/6,8/5,6/7,1 s de actividad, pausas 1,2–2,1 s |
| B · Cabina norte | Quietud deliberada (sin NPC ambiental) | 0 | Foco musical y llegada |
| C · Grieta sur | Contemplación y tensión | 0 | Acontecimiento raro `cliff_watch` |
| D · Arsenal oeste | Tránsito y curiosidad | 1 | Ruta seno ±62 u conservada + pausas |
| E · Barra este | Conversación, espera y descanso | 4 | 2 `talk` desincronizados, `WAIT`, `rest` de pie/sentado |
| F · Arcade / Espejo | Curiosidad por orientación, sin interacción | 0 | `hub_ambient_dancer_sw` mira las máquinas |

**No todos reaccionan:** 5 de 10 sin reacción. **No todos caminan:** 8 de 10 con Δ = 0. **No todos bailan:** 4 con `talk`/`rest`/`walk` permanente y 2 dancers con estados de observación/espera.

---

## 5. F2/F3 — Implementación

**Inserciones en `DEADBEAT_DISCO.ART.html`:** **2 inserciones, 0 eliminaciones** (494 líneas). Módulo `T09` tras `TANDA08:END (módulo)` dentro de `initDmoHubV35()` y `T09.install();` tras `T08.install();` en `buildHubSpace()`. `ART_PACK/art_pack.js` **sin cambios** (versión `+hub-tanda08` intacta).

- HTML final: **13.460.630 B / 21.296 líneas**, SHA-256 `3e82dc77b9fd4c59d01e016628b204b1b07042c7f8f9085de3433141e5429011`.
- `ART_PACK/art_pack.js`: **108.072 B / 2.175 líneas**, SHA-256 `330c9f46fd32e0f9782009252ea1380321e9e37a3e500e9fadf8869e914921c5` (idéntico a T08).
- **Flag `window.__DDM_HUB_T09`**: con `false`, los 10 wrappers delegan íntegramente en el `hubDraw` original de T01–T08. Con movimiento reducido, fuera del HUB, con modal, con `transitionLock`, durante la llegada T07 o durante el descenso, no se actualizan rutinas. Arranque con `false` no carga ni registra los 4 sprites nuevos.
- **Re-enganche perezoso:** `buildHubSpace()` recrea el array de props, así que `wrapProps()` se ejecuta en el ciclo común sobre los objetos **vivos** de `tc` (no sobre el clon de `DMO_LAYOUT`). Cero props nuevos.
- **Continuidad:** el frame se congela de forma exacta (`holdOffset = zz − freezeT`) y recupera el reloj real en ~1,2 s sin reiniciar `phase`. Orientación, intensidad y desplazamiento se interpolan (0,22 s / 0,45 s).

### Recursos nuevos autorizados (4)

`ART_ASSETS/hub/tanda_09/manifest.json` → `INTEGRADO_VALIDADO`, 4/4 SHA-256, RGBA 131 × 232 con alfa real, croma verde eliminado, despill, esquinas transparentes y halo 0–0,65 %.

| Alias | Postura | Uso |
|---|---|---|
| `t09_rest_seated` | Sentado/reclinado | `t07_descanso` (carencia P3) |
| `t09_observe` | Cabeza girada, observando | `hub_ambient_dancer_sw` (arcade) y `t07_recorrido` (grieta) |
| `t09_greeting` | Gesto pequeño de saludo | `t07_charla_01/02` y reacción |
| `t09_wait` | Brazos cruzados, espera | `hub_ambient_clubber_bar` |

Son **posturas estáticas**, no hojas de frames ni animaciones de sentarse/usar máquina. Si no cargan o el flag está apagado, se usan los sprites V5 originales. V5 pasa de **178 → 182** claves.

---

## 6. F4 — Acontecimientos

7 definiciones (`conversation_ends`, `group_start`, `arcade_watch`, `bar_shift`, `two_positions`, `cliff_watch`, `posture_change`). **Uno simultáneo como máximo**, separación ≥ 25 s, duración 3,0–5,5 s, secuencia determinista, sin progresión ni mecánicas, todos reversibles por `RESUME`. En 100 s se dispararon y completaron 3 (`conversation_ends`, `group_start`, `arcade_watch`).

---

## 7. F5 — QA

`ART_EVIDENCE/hub/tanda_09/qa_matrix.json` — **100 s / 400 muestras a 250 ms** + **180 muestras a 33 ms** a frecuencia de render.

**16 puntos pedidos: 16 APROBADO / 0 FALLIDO / 0 BLOQUEADO / 0 NO VERIFICADO.**
Matriz completa (16 + 9): **16 APROBADO / 0 FALLIDO / 3 BLOQUEADO / 6 NO VERIFICADO**.

| # | Comprobación | Estado |
|---|---|---|
| T09-01 | 11 props NPC originales con `hubDraw` vivo | APROBADO |
| T09-02 | 6 actores T07 intactos (`dance2/talk2/rest1/walk1`) | APROBADO |
| T09-03 | 4 dancers intactos, estaciones sin desincronía | APROBADO |
| T09-04 | 10 rutinas, 10 pares de duraciones distintos | APROBADO |
| T09-05 | 136 combinaciones de estado; máx. 4/10 cambios simultáneos | APROBADO |
| T09-06 | Mínimo 7 ciclos por NPC; pausas y reanudaciones | APROBADO |
| T09-07 | 0 saltos de frame a 33 ms; congelación exacta | APROBADO |
| T09-08 | ΔX máximo 5 u a 33 ms / 26 u a 250 ms | APROBADO |
| T09-09 | Orientación intermedia ≤ 10,5 %; 0 `pageerror`/warning | APROBADO |
| T09-10 | Distancia mínima 57,9 u (preexistente, sin cambios) | APROBADO |
| T09-11 | 11 estaciones, 62 props, 0 colisiones nuevas | APROBADO |
| T09-12 | Reacciones conservadas y ponderadas; 5 sin reacción | APROBADO |
| T09-13 | Tecla D desplaza 110 u; 6 teleports sin perder `EXPLORATION` | APROBADO |
| T09-14 | `reducedMotion` estático, 880 delegaciones | APROBADO |
| T09-15 | `draws/updates = 10`, 27 canvas, 1 acumulador, 0 intervalos | APROBADO |
| T09-16 | Flag OFF/ON verificado; T01–08 y pack intactos | APROBADO |

**0 `pageerror` · 0 warnings · 0 errores T07/T08/T09 · 0 errores críticos.**

**Flag desde el arranque** (`qa_flag_boot.json`, `APROBADO`): con `__DDM_HUB_T09 = false` antes de cargar la página no se solicita **ninguno** de los 4 PNG (0 peticiones), `assetsRequested=false`, `assetsLoaded=0`, V5 se queda en 178, los 10 wrappers delegan 690 veces y `draws=0`; al activar el flag se cargan 4/4 y arrancan las rutinas. Con `reducedMotion` también se delega (880 veces) y los frames quedan estáticos.

### BLOQUEADO (de diseño, documentado)

- Sistema de patrulla / rutas nuevas (no se crea; se conserva el seno ±62 u).
- NPC ambiental propio en B y F (no se añaden NPC nuevos).
- `narr_cliente000` intacto por su vinculación narrativa.

### NO VERIFICADO (límites heredados y de entorno)

Vídeo continuo, mando físico, audio audible/latencia, coste real de frame y rendimiento sostenido en hardware real, regresión visual/formal completa T01–07 en hardware real, y sostenimiento más allá de 100 s / múltiples incursiones. Permanecen además el performance gate de T02 y los 8 `BLOQUEADO` de T03.

---

## 8. Incidencias resueltas

| ID | Incidencia | Resolución |
|---|---|---|
| I-01 | `DMO_LAYOUT.propObjects()` devuelve clon profundo; envolverlo no afecta al render | Enganche sobre el array real `tc` |
| I-02 | `buildHubSpace()` recrea props tras `install()` | Re-enganche perezoso en el ciclo común |
| I-03 | Orientación intermedia sostenida en el recorrido | Guiado en `update` con easing 0,22 s y convergencia 0/1 |
| I-04 | Recuperación brusca de frame tras pausa | Congelación exacta + decaimiento 1,2 s |

---

## 9. Cierre de evidencias

`ART_EVIDENCE/hub/tanda_09/` — **39 ficheros**: `report.json`, `qa_matrix.json`, `qa_tanda09.json`, `qa_frames_continuity.json`, `qa_flag_boot.json`, `estados_transiciones.json`, `comportamiento_por_zona.json`, `rendimiento.json`, `incidencias.json`, `hashes.json` (17 ficheros), inventario/mapa/matrices F0–F1, 9 capturas de auditoría, 6 por zona, 4 de postura, 2 A/B de flag, 2 de arranque con flag `false` y 1 de movimiento reducido.

Arnés reproducible: `ART_TOOLS/qa/hub_tanda_09_audit.js`, `validate_hub_tanda_09.js`, `hub_tanda_09_frames.js`, `hub_tanda_09_flag_boot.js`, `finalize_hub_tanda_09.py`; preparación `ART_TOOLS/prepare_hub_tanda_09.py`; aplicación `ART_TOOLS/apply_hub_tanda_09.py` (`--restore` verificado por SHA-256 exacto).

---

## 10. Publicación

`git diff --check` OK · revisión completa del diff (HTML: 494 inserciones, 0 eliminaciones) · T01–08 intactas · flag verificado OFF/ON · commit independiente en `arena/109fe45c-deadbeat-disconew` · push a la misma rama · PATCH del PR #1 · **sin merge** y sin tocar `main`.
