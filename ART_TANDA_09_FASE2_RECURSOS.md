# TANDA 09 · Fase 2 — Alcance exacto de los recursos nuevos autorizados

**Autorización del usuario (Fase 1):** genera recursos en `ART_ASSETS/hub/tanda_09/` para cubrir las carencias documentadas. Este documento concreta el alcance **antes de generar nada**, como se indicó en la opción aceptada.

**Lectura de la restricción previa:** «no inventes animaciones de sentado» se interpretó como *no fingir* una postura sentada reutilizando sprites de pie. La carencia se propuso como **1 sprite nuevo** y queda ahora autorizada. Los recursos son **posturas estáticas**, no hojas de frames ni animaciones nuevas: el movimiento sigue viniendo de `lean`/`bounce`/`flip`/`intensity` del sistema existente.

---

## 1. Principio de integración (prioridad a la reutilización)

- Los 5 sprites V5 de NPC siguen siendo la base de los 10 personajes.
- Los 4 nuevos sprites son **sustituciones opcionales de postura** en estados concretos (`PAUSE`, `OBSERVE`, `WAIT`, `gesture`, `rest`).
- Si un sprite nuevo no carga, o si `window.__DDM_HUB_T09 === false`, se usa **siempre** el sprite V5 original → comportamiento y aspecto idénticos a T08.
- No se modifica `ART_PACK/art_pack.js`: el módulo T09 carga sus 4 PNG con `new Image()` y los registra en `window.__DDM_V5_IMG` bajo alias `t09_*`. Cero cambios en T01–08.
- No se crean props, NPC, enemigos, IA, diálogos, interacciones, mobiliario ni arquitectura.

---

## 2. Lista cerrada de recursos (4)

| # | Archivo final | Alias V5 | Postura | NPC / estado que lo usa | Justificación |
|---|---|---|---|---|---|
| 1 | `01_descanso/final/hub_t09_01_descanso.png` | `t09_rest_seated` | Clubber **sentado/reclinado**, hombros caídos, mirada baja | `t07_descanso` · `rest` y `posture_change` | Carencia P3: era el único NPC de «descanso» y estaba de pie. Postura estática, sin animación de sentarse |
| 2 | `02_observador/final/hub_t09_02_observador.png` | `t09_observe` | De pie, brazos bajos, **cabeza girada** hacia un lado | `hub_ambient_dancer_sw` (arcade) y `t07_recorrido` (grieta) · `OBSERVE` | Carencia P4: permite «mirar las máquinas» y «contemplar la grieta» sin interacción nueva ni frames de uso |
| 3 | `03_gesto/final/hub_t09_03_gesto.png` | `t09_greeting` | De pie, **un brazo levantado** en gesto pequeño | `t07_charla_01/02` · `gesture` y reacción al jugador | Carencia P5: saludo comprensible sin texto, sin diálogo y sin nueva interacción |
| 4 | `04_espera/final/hub_t09_04_espera.png` | `t09_wait` | De pie, **brazos cruzados**, postura quieta | `hub_ambient_clubber_bar` · `WAIT` y `bar_shift` | Identidad de la barra: espera reconocible frente al baile continuo |

**Especificación técnica común:** PNG RGBA con alfa real, recorte centrado, **tamaño final 131 × 232 px** (mismo alto que `hub_clubber_dancer_b`), pivote en la línea de pies, sin sombra de suelo (la dibuja el motor), sin halo claro, sin texto, sin fondo. Paleta magenta/cian/violeta con rim light, estilo de ilustración 2D cel-shaded de los sprites V5 existentes. Se parte de `ART_ASSETS/hub/tanda_07/_refs/hub_clubber_dancer_a.png` como referencia de estilo.

**Proceso:** `generate_image` → `_source/` → `ART_TOOLS/prepare_hub_tanda_09.py` (croma, recorte, escala exacta, despill, verificación de alfa y SHA-256) → `final/` + `manifest.json`.

---

## 3. Lo que NO se genera

- Ningún NPC nuevo ni variante de personaje adicional (los 10 son los existentes).
- Ninguna hoja de frames ni animación de transición; no hay «sentarse», «levantarse» ni «usar máquina» animados.
- Ningún sprite de patrulla, enemigo, jefe, mobiliario, máquina arcade, arquitectura o fondo.
- Ningún cambio en cámara, audio, DJ, Director, progresión, combate o control.
- Ningún recurso en `ART_PACK/` ni cambio de versión del pack.

---

## 4. Trazabilidad y reversibilidad

`manifest.json` con estado `PREPARADO` → `INTEGRADO_VALIDADO` tras la QA, 4/4 SHA-256, y evidencias en `ART_EVIDENCE/hub/tanda_09/`. Con `__DDM_HUB_T09 = false` los alias `t09_*` pueden seguir registrados pero **no se dibujan**; el render delega en el `hubDraw` original de T01–T08.

---

## 5. Cobertura de carencias tras la generación

| Carencia | Antes | Después |
|---|---|---|
| P3 · sin animación de sentado | `BLOQUEADO` | `APROBADO` (postura estática nueva; no animación) |
| P4 · sin animación de usar/mirar arcade | `BLOQUEADO` | `APROBADO` parcial: postura de observación, **sin interacción** |
| P5 · sin animación de saludo | `BLOQUEADO` | `APROBADO` parcial: gesto estático, **sin diálogo** |
| P6 · sin patrulla | `BLOQUEADO` | permanece `BLOQUEADO` (no se crea sistema de rutas) |
| P7 · zonas B/F sin NPC propio | `BLOQUEADO` | permanece `BLOQUEADO` (no se añaden NPC) |
| P8/P9 · anclajes y NPC narrativo | Restricción | sin cambios |
