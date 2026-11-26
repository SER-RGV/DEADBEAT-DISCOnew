# MODIFICACIÓN PRIORITARIA — Corrección de legibilidad y reconstrucción espacial del HUB (A–F)

**Fecha:** 2026-11-04 · **Rama:** `arena/109fe45c-deadbeat-disconew` · **PR #1:** `OPEN`, sin merge · `main` intacta
**Estado:** `AUTORIZADA E IMPLEMENTADA · QA 18/18 APROBADO · 0 FALLIDO`
**Decisión del usuario:** alcance **A–F completos**, en orden y con parada si aparece un problema crítico; **TANDA 09 desactivada** durante la corrección (`window.__DDM_HUB_T09 = false`), sin ampliar rutinas NPC.

> Parte de la auditoría `ART_AUDITORIA_LEGIBILIDAD_HUB.md` y de la propuesta `ART_PROPUESTA_CORRECCION_PRECIPICIO.md`. La propuesta se entregó **antes de modificar** porque el acceso `lift` no estaba físicamente conectado a la grieta; el usuario la autorizó y se ejecutó en este commit.

---

## 1. Principio rector cumplido

**No se ha añadido nada.** Cero assets nuevos, cero props nuevos, cero sistemas nuevos, cero cambios de cámara global, motor, Director, combate, progresión ni audio. `ART_PACK/art_pack.js` está **sin cambios** (SHA-256 `330c9f46…e9fadf8869e914921c5`). La transición sigue siendo `startCampaignFromHub(0)` + T07/T08: **sin segunda transición, sin puerta nueva y sin cambio de progresión**.

| Protección | Resultado |
|---|---|
| `DEADBEAT_DISCO.ART.html` | **585 inserciones, 0 eliminaciones** (`git diff --numstat`) |
| `ART_PACK/art_pack.js` | diff vacío |
| Assets / props / estaciones / zonas | 0 nuevos · 62 props · 11 estaciones · 6 zonas |
| Cámara / audio / progresión | sin tocar (`cameraTouched:false`, `audioTouched:false`, `progressionTouched:false`) |
| T01–T08 | conservados; los nuevos envoltorios delegan íntegramente cuando el flag está en `false` |

---

## 2. Mecanismo reversible

- **Flag:** `window.__DDM_HUB_LEGIBILIDAD`. Tras la autorización queda **`true` por defecto** (la corrección se ve al entrar). Con **`false` desde el arranque**, el HUB es el publicado en `3a22d5b`: 0 dibujos, 0 clips, 0 props ocultos, atmósfera original (`opacity ''`, `grade 1`, `grain 0.016`), `drawCutaway` con su trayectoria original.
- **API:** `window.DMO_HUB_LEGIBILIDAD.state() / .audit() / .debug() / .setEnabled(v) / .install() / .clipCutaway() / .hideBanner() / .hideSign()`.
- **Restauración en caliente:** guarda `style.opacity`, `CFG.grade/grain`, `prop.hidden` y el `liftSign` real; `setEnabled(false)` devuelve `hidden 9 → 0` y restaura la atmósfera. Verificado en `ab_restaurado_*` y en `qa_matrix.json` Q07.
- **Inserciones (4, 0 eliminaciones)**, aplicadas por `ART_TOOLS/apply_hub_legibilidad.py` con `--restore` byte a byte (SHA-256 de la base `3e82dc77…9011`):
  1. módulo `ART_TOOLS/hub_legibilidad_block.js` tras `TANDA09:END (módulo)`;
  2. apertura del gancho de clip en T08 `drawCutaway()`;
  3. cierre de ese gancho;
  4. `LEG.install()` tras `T09.install()` en `buildHubSpace()`.
- El módulo se inserta **dentro** de `initDmoHubV35()` para envolver funciones ya existentes de ese mismo ámbito (`drawHubFloorLayer`, `drawPixelNeonBanner`, `drawDiegeticSign`, `zf`, `Tf`) sin `eval` y sin reescribir el motor. Compatible con `__DDM_HUB_T07`, `__DDM_HUB_T08`, `__DDM_HUB_T09` y `Yc.reduced`.

---

## 3. Alcance ejecutado

### A · P1/P2 — Niebla y redundancia (medido en la prueba previa, ahora aplicado)
| # | Cambio | Valor |
|---|---|---|
| A1 | `#ilt-atmos-bloom` `style.opacity` | `1.00 → 0.30` |
| A2 | `#ilt-atmos-vig` `style.opacity` | `1.00 → 0.45` |
| A3 | `DMO_ATMOS.config.grade / grain` | `1.0→0.35` / `0.016→0.006` |
| A4 | 9 props REDUNDANTES/MAL UBICADOS | `prop.hidden = true` (**ninguno eliminado**) |

`CFG.bloom = 1.0` sigue siendo sólo interruptor; lo que se corrige es la **opacidad CSS real** del overlay `screen`, que era la fuente del velo (+14 de luminancia sin detalle). No se ha creado niebla nueva.

### B · P1 — Saturación del suelo y una etiqueta por POI
- **B1** Velo de jerarquía aplicado **sólo a la capa de suelo** (Wf, antes de props/NPC/jugador): degradado sur `y1080→1585` y degradados laterales O/E. El medallón, los anillos y el neón quedan intactos.
- **B2** La franja `y>1470` deja de mostrar el patrón: el labio rocoso y la boca oscura sustituyen al suelo continuo.
- **B3** Se retira el rótulo pasivo «ZONA B / CABINA · VIRGILIO» cuando el jugador no está cerca (conservando el prompt `[E/A]`) y se oculta el banner «▼ CÍRCULOS · DESCENSO ▼». Ningún asset se borra: son decisiones de visibilidad reversibles.

### C · P3 — Orientación y perspectiva (sin mover la cámara ni estirar ilustraciones)
- **C1/C3** Sombras de contacto bajo cabina DJ, mostrador arsenal, barra, sofás VIP, altares arcade y espejo de los sellos; elDJ queda anclado al muro norte y los muebles dejan de flotar.
- **C2** El gran abanico dorado del arsenal se **atenúa por oclusión local** y se ancla al mostrador. **No se reescala el asset T04** para no modificar T01–08 ni estirar la ilustración; queda documentado como corrección parcial.
- **C4** La línea magenta recta del sur desaparece: **1089 → 0 píxeles magenta** en la franja `y=725..750`, y vuelve a **1117** al desactivar el flag. Se sustituye por un **labio rocoso irregular** con sombra de caída y estratos.
- **C5** Los 2 props T06 en `y=1540` (bajo el acantilado) están entre los 9 ocultados.

### D · P4 — El acantilado como geografía real
| # | Resultado |
|---|---|
| D1 | **El terreno termina**: boca oscura irregular que corta el patrón de suelo y el borde neón. |
| D2 | **El borde empieza**: labio irregular `jag(x)` con filo iluminado, sombra proyectada y 4 estratos; grosor legible. |
| D3 | **Profundidad**: se refuerzan `h07_apertura_profundidad`, el estrato y la luz cálida de `(1250,1630)` ya existentes en T07; los 5 planos T08 siguen siendo la profundidad. |
| D4 | `hub_abyss_stair_crack` deja de ser un decal aislado: su borde inferior conecta con la boca; el hueco se reabre **por encima del labio** (`mouthCut`) para que no quede tapado. |
| D5 | **Recorrido**: escalera de caracol descendente dentro de la abertura, con el mismo lenguaje que el fallback v7.7 (escalones oscuros con filo cian), dibujada hacia la luz inferior. |
| D6 | Acento cian continuo desde la pista hasta la boca, reutilizando el color de `lift`; sin flechas ni HUD nuevo. |

### E · P5 — Conexión con la transición existente
- **E1** `clipCutaway()` recorta T08 con la **posición en pantalla de la boca**, derivada de la cámara real (`q.cm`) y de `shaftOpen`. La ventana **crece desde el hueco**, no debajo de un suelo intacto. Con `false`, T08 usa su trayectoria original.
- **E2** `startCampaignFromHub(0)` **sin cambios**: `TRANSITION` → `winH 84→374` → `CAMPAIGN_ROOM`, 0 `pageerror`.
- **E3** El radio lógico `lift` (1250,1365,r142) **no se toca**; no hay puerta nueva.
- **E4** El cartel «GRIETA DE DESCENSO» se repinta sobre el labio con sus argumentos reales del motor (prompt, color, estado «cerca»), y se omite durante la cinemática para no alterar la transición.

### F · Jerarquía visual
Primer plano (jugador/suelo) → plano principal (medallón, neón, NPC, POI) → plano exterior (arquitectura y labio) → plano profundo (boca, escalera, abismo). Medido como **separación de planos** (luminancia del plano principal − plano profundo): en `sur` **19,49 → 25,86** y en `borde` **17,95 → 23,65** (+33 % y +32 %).

---

## 4. Orden de capas (hallazgo técnico)

La corrección de geografía tuvo que dividirse en dos pasos porque el borde neón recto de la arquitectura se dibuja **después** de `drawHubFloorLayer()`:

- **Wf** (`worldCorrection`, transform de mundo real): velo, sombras de contacto, acento cian, `chasm` completo (por debajo de props y del jugador).
- **zf** (`screenCorrection`, matriz de mundo capturada en Wf ese mismo fotograma): `lip` + `mouthCut` + repintado del cartel. Queda **encima** del borde neón y del cutaway T08, pero **debajo** del HUD de V3.5.
- `clipCutaway` actúa dentro de `drawCutaway()` antes del `fillRect` de fondo.

`zf` trabaja en espacio de pantalla (identidad), por lo que se guarda `g.getTransform()` en Wf; con `false` no se ejecuta ninguno de los tres.

---

## 5. Métricas (`ART_EVIDENCE/hub/correccion/metricas.json`)

A/B **en la misma página y sin recarga**, recorte `(120,150)-(1160,780)`:

| Zona | Δ media | Δ contraste | Δ bordes | Δ oscuro % | separación planos |
|---|---:|---:|---:|---:|---|
| centro | −8,70 | −0,47 | +0,77 | +7,50 | 21,48 → 22,26 |
| norte | −7,60 | +0,20 | +1,17 | +6,21 | — |
| nw | −11,92 | −0,62 | +0,58 | +10,20 | — |
| este | −10,29 | −0,86 | −0,38 | +9,25 | — |
| sur | −12,86 | −1,99 | −4,87 | +10,15 | **19,49 → 25,86** |
| borde | −13,50 | −2,49 | −4,26 | +10,86 | **17,95 → 23,65** |

**Lectura honesta:** en `sur`/`borde` bajan el contraste global y la energía de borde porque el patrón art-déco denso y la línea neón se sustituyen por una masa oscura de abismo. Es el efecto buscado: la figura/fondo se separa más (separación de planos +32…33 %) y el acceso deja de competir con la decoración. El centro y el norte mantienen o mejoran bordes.

**C4 (borde recto):** `antes 1089 → después 0 → restaurado 1117` píxeles magenta (reducción 100 %, reversible).

`metricas.json` es la fuente autoritativa de estas cifras: se calcula sobre las capturas JPEG concretas guardadas en esta carpeta. Al regenerar capturas, la compresión JPEG y el fotograma exacto pueden mover los decimales unas pocas unidades (p. ej. el recuento magenta oscila en torno a 1100 px en OFF, 0 px en ON, ~1120 px al restaurar); el orden de magnitud y la conclusión —línea recta eliminada por completo y reversible— se mantienen en todas las ejecuciones.

---

## 6. QA (`ART_EVIDENCE/hub/correccion/qa_matrix.json`)

**18 APROBADO / 0 FALLIDO / 0 BLOQUEADO / 0 NO VERIFICADO** en la matriz automática. Incluye: 0 `pageerror` en 5 contextos, 4 envoltorios, dibujos de mundo y pantalla, clips del cutaway, flag OFF desde arranque con 0 dibujos/0 clips/0 props ocultos y atmósfera original, reversibilidad en caliente 9→0, 62 props y 11 estaciones intactos, T07/T08 activos, 0 errores internos, `startCampaignFromHub(0)=true`, llegada a `CAMPAIGN_ROOM`, `winH` creciendo >300, 16 capturas de barrido, 12 comparativas A/B, ausencia de cambios en cámara/progresión/audio y **compatibilidad con T09 activa** (10 NPC, 10 wrappers, 4 posturas, 0 errores en ambos módulos; `compatibilidad_t09_legibilidad.jpg`).

La decisión del usuario de **dejar T09 desactivada** se aplica a toda la auditoría y a esta fase de corrección: todos los arneses fijan `__DDM_HUB_T09 = false` desde `addInitScript`. El juego publicado **no modifica T09** (su flag sigue disponible y por defecto activo); la compatibilidad con ambos módulos activos se verificó por separado precisamente para no dejar una regresión sin detectar. No se han ampliado rutinas ni recursos de NPC.

**Criterio visual de aprobación** (inspección de `sweep_*`, `ab_despues_borde.jpg`, `descenso_0500.jpg` y `comparativa_antes_despues.png`):

| # | Criterio | Resultado |
|---|---|---|
| 1 | Se reconoce una **discoteca** | **APROBADO** — medallón, anillos, cabina, neón intactos |
| 2 | Se reconoce que está **sobre un acantilado** | **APROBADO** — labio irregular con grosor, sombra y estratos |
| 3 | **Precipicio junto a la zona habitable** | **APROBADO** — el patrón de suelo termina en la boca |
| 4 | La **grieta es la entrada** a las profundidades | **APROBADO** — boca oscura unida al decal, escalera descendente, cartel sobre el labio |
| 5 | El **descenso conduce al infierno inferior** | **APROBADO** — `descenso_0500.jpg` muestra el cutaway naciendo del hueco, luz cálida inferior y 5 planos T08 |

**NO VERIFICADO (honesto, no automatizable aquí):** prueba con personas que entren por primera vez **sin documentación**; vídeo continuo; mando físico; audio audible/latencia; coste real de fotograma y rendimiento sostenido >100 s; regresión formal en hardware real. Se mantienen los `NO VERIFICADO` heredados de T02/T03/T07/T08/T09.

---

## 7. Límites y trabajo no hecho (declarado)

- **C2 queda parcial**: el abanico del arsenal se atenúa y se ancla, pero **no se reescala** su asset T04. Reescalarlo exigiría tocar una ilustración de T01–08; se prefirió la protección.
- C1/C3 se resuelven con **sombras de contacto aditivas**, no con rotación, estirado ni cambio de escala de sprites.
- La boca y la escalera son **dibujo procedural mínimo** con los colores y la geometría ya existentes; no son assets nuevos, pero siguen siendo estilizadas y algo geométricas.
- No se han generado recursos, no se han ampliado rutinas de NPC, **no se ha tocado el código de T09** (sólo se aisló con su flag en los arneses de QA) y no se ha añadido contenido para ocultar problemas de composición.
- `main`/`origin/main` siguen en `d75e021`; PR #1 sigue `OPEN` sin merge.

---

## 8. Archivos y evidencias

**Código:** `ART_TOOLS/hub_legibilidad_block.js`, `ART_TOOLS/apply_hub_legibilidad.py` (`--apply|--check|--restore`), `ART_TOOLS/finalize_hub_legibilidad.py`, `ART_TOOLS/qa/hub_legibilidad_correccion_qa.js`, `ART_TOOLS/qa/hub_legibilidad_metricas.py`.

**Evidencias** `ART_EVIDENCE/hub/correccion/`: 16 `sweep_*.jpg` · 6 `ab_antes_*.jpg` · 6 `ab_despues_*.jpg` · 2 `ab_restaurado_*.jpg` · `flag_off_boot_borde.jpg` · `compatibilidad_t09_legibilidad.jpg` · 8 `descenso_*.jpg` + `descenso_00_antes.jpg` · `comparativa_antes_despues.png` · `report.json` · `qa_matrix.json` · `metricas.json` · `hashes.json`.

**Documentos:** este informe, `ART_AUDITORIA_LEGIBILIDAD_HUB.md` (§10), `ART_PROPUESTA_CORRECCION_PRECIPICIO.md` (estado actualizado), `CURRENT_STATE.md`, `CHANGELOG.md`, `ART_PRODUCTION_LOG.md`.
