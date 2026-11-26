# TANDA 07 · FASE 1 — COMPOSICIÓN GEOGRÁFICA E INTEGRACIÓN PROPUESTA

**Estado:** propuesta técnica y de dirección de arte **entregada, sin implementar**.
**Relación:** continúa `ART_TANDA_07_FASE0_AUDITORIA.md` (Fase 0 cerrada, 0 errores críticos).
**Regla vigente:** no se han generado assets ni modificado sistemas. Este documento es el diagnóstico + la propuesta de integración que el usuario pidió ver **antes** de producir nada.
**Datos medibles:** `ART_EVIDENCE/hub/tanda_07/fase1_geografia.json`.

---

## 1. Rector de dirección

> **Arriba:** música, NPC, luces, refugio, aparente normalidad.
> **Abajo:** oscuridad, profundidad, peligro, un infierno que continúa extendiéndose.

El HUB debe dejar de leerse como «una sala independiente en un escenario oscuro» y pasar a leerse como **una discoteca habitada construida en el labio de un acantilado**, con una grieta que baja hacia las profundidades. La cámara real ya proporciona el dispositivo narrativo sin tocarla:

| Posición del jugador | Cámara Y | Mundo visible en Y | Lectura |
|---|---|---|---|
| Plaza central (arranque) | `975` | `495 … 1455` | **Solo fiesta.** El borde sur (`1585`) no existe en pantalla |
| Aproximación a Zona C | `≈1100` | `620 … 1580` | Empieza a aparecer el labio rocoso |
| Junto a `lift` (máximo sur) | `1195` | `715 … 1675` | **Borde + 84 px de abismo.** Descubrimiento del peligro |
| Durante `floorDropAnim` | mundo sustituido | — | **Profundidad real** por parallax vertical |

Es decir: **la revelación es progresiva y caminable**, no una panorámica impuesta. No se modifica la cámara global ni se fuerza un zoom para «enseñar» el abismo.

---

## 2. Geometría medida (sin supuestos)

| Elemento | Mundo | Pantalla con cámara `(1250,1195)`, zoom `.9375` |
|---|---|---|
| Octógono transitable | `x 290…2210`, `y 265…1585`, `cut 210` | borde sur recto `x 500…2000` a `sy=815,6` |
| Borde sur (arista `solid:true`) | `y=1585`, `x 500…2000` | `sx −63…1343`, `sy 815,6` |
| Banda exterior visible | `y 1585…1675` (90 u) | `sy 815,6…900` → **≈84 px** |
| Decal de grieta existente (`hub_abyss_stair_crack`, 330×180) | `x 1085…1415`, `y 1255…1436` | `sx 485…795`, `sy 506…676` |
| Pilones / estación `lift` | `(1126,1365)` y `(1374,1365)`; estación `r=142` | `sy ≈609` |
| Envolvente T06 norte (NO TOCAR) | `y 180…330`, `x 500…1955` | fuera de vista al sur |
| Paramentos T06 laterales (NO TOCAR) | `x 277…384` / `2129…2212`, `y 400…1540` | continuidad permitida solo en `y 1540…1675` |
| Caché de suelo | `(290,265)` 1920×1320 → `y 265…1585` | termina exactamente en el borde |
| `semi2d` | `WORLD_TOP 455`, `WORLD_BOTTOM 1415` | props `hubCustom` a escala **1.0 uniforme** |

Fórmula usada para todo el plano: `sx = 640 + 0,9375·(wx − cx)`, `sy = 450 + 0,9375·(wy − cy)`.

---

## 3. Plano de cotas (la geografía propuesta)

```
        y 180  ┌────────────── ENVOLVENTE T06 (intacta) ──────────────┐   COTA +02 · exterior norte
        y 265  ╔═══════════ MURO NORTE / CABINA DJ / LUCES ═══════════╗   COTA  0 · refugio
               ║  ZONA B (DJ)   ZONA A (PISTA, NPC)   ZONA D/E/F      ║
        y 1255 ║        [decal grieta existente 1085..1415]            ║
        y 1365 ║        ESTACIÓN lift · GRIETA DE DESCENSO             ║
        y 1470 ║───────────── LABIO / PRE-BORDE ──────────────────────║   COTA −01 · transición suelo→borde
        y 1585 ╚══════════ ARISTA SUR (solid, NO se modifica) ════════╝
        y 1585 ┌────── CARA ROCOSA · estrato 1 (cerca, iluminado) ─────┐   COTA −02 · banda visible ≈84 px
        y 1620 ├────── CARA ROCOSA · estrato 2 (medio, penumbra) ──────┤
        y 1650 ├────── ABERTURA / luz de profundidad / brasas ─────────┤
        y 1675 └────── oscuridad que CONTINÚA (no se corta en negro) ──┘
        y>1675 ······· PROFUNDIDADES (solo visibles en transición) ······   COTA −03 · Fase 4
```

**Cinco elementos diferenciados** (el usuario exige que la grieta no sea «una línea negra»):

| # | Elemento | Cota / caja mundo | Cara | Capa | Estático / animado |
|---|---|---|---|---|---|
| G1 | **Superficie transitable** (suelo de la discoteca, ya existente) | `y 265…1470` | SUELO (cenital) | render actual | estático + pulsos T05/T06 |
| G2 | **Labio del acantilado** — relieve bajo, grietas de tensión, barandilla/línea de neón de seguridad, cambio de material | `x 500…2000`, `y 1470…1585` | SUELO → SUR (+Y) | 1 · decoración estática (`Wf`, `solid:false`, `sortY≈1500`) | estático; pulso muy leve en 2 |
| G3 | **Borde y pared rocosa** — tres estratos con iluminación decreciente, aristas irregulares, continuidad con los paramentos T06 en las esquinas | `y 1585…1675`, `x 200…2300` | SUR (+Y) + ingletes 45° | 1 · dibujado **fuera del clip** `Ls(g)` mediante hook `Wf` encadenado | estático; brasas/luz en 2 |
| G4 | **Abertura de la grieta** — conserva `hub_abyss_stair_crack` y lo conecta visualmente con el labio y con G3; escalera de caracol ya existente | `x 1085…1415`, `y 1255…1585` | SUELO → abertura | 1 + 2 (`Wb` de profundidad ya presente) | estático + glow desincronizado |
| G5 | **Profundidades** — capas de parallax, luz que se apaga, partículas descendentes/ascendentes, siluetas de roca a distintas distancias | `y > 1675` | vertical (transición) | 5 · `floorDropAnim.drawFloorWorldFX/drawAerialWorldFX/drawScreenFX` | animado solo durante el descenso |

**No se convierte el HUB en una cueva genérica:** el techo, los paramentos art-déco, el medallón, la cabina DJ y la pista siguen siendo los de T01–06. La roca aparece **solo al sur y solo por debajo de la línea de suelo**; arriba sigue habiendo neón, terciopelo y gente.

---

## 4. Coherencia con la cámara real (qué se ve en cada zona)

| Cámara | Mundo visible | Elementos visibles | Resultado buscado |
|---|---|---|---|
| `(1250, 975)` | `x 567…1933`, `y 495…1455` | G1 + grieta G4 (parte inferior) | Fiesta habitada; **nada de abismo** → normalidad |
| `(1250, 1100)` | `x 567…1933`, `y 620…1580` | G1 + G4 + primer tercio de G2 | El suelo «cambia de material» al acercarse |
| `(1250, 1195)` | `x 567…1933`, `y 715…1675` | G2 completo + G3 (84 px) + G4 | **Borde legible + profundidad insinuada** |
| `(883, 1195)` | `x 200…1566`, `y 715…1675` | G2/G3 oeste + inglete NO + paramento T06 | Continuidad lateral sin costuras |
| `(1617, 1195)` | `x 935…2300`, `y 715…1675` | G2/G3 este + inglete NE + paramento T06 | Continuidad lateral sin costuras |
| CINE `1.1_portada` | `zoom 1.0`, `(1250,900)` | G1 | La portada no se altera |
| CINE `3.2_grietas` | `y 1120→1240`, `zoom 1.05→0.92` | G2/G4 | Plano ya existente que **gana** contenido sin reescribirse |
| `floorDropAnim` | mundo de transición | G5 | Profundidad real sin cambiar la cámara global |

**Restricción de escala:** todos los elementos G2–G4 se dibujan a escala uniforme `1.0`, como el resto de `hubCustom` (T06 midió `depthScaleForHubCustom=1.0`). La sensación de profundidad se consigue por **oclusión, valor/luz, tamaño de estrato y parallax**, nunca por aplicar `DMO_SEMI2D.scaleFor()` a los props del HUB.

---

## 5. Entrada, zonas inferiores y «exterior infernal»

- **Exterior infernal = la propia geografía sur (G3/G5)**, no una escena nueva. Es el mismo sitio por el que se llega y al que se desciende: coherencia de lugar sin duplicar escenas ni recargas.
- **Entrada / llegada (Fase 2):** reutilizar `DMO_CINE` con un plano **breve (≈1,2–2,4 s)** y `floorDropAnim.beginSkyfall(..., toHub)` / `5_llegada` ya existente (`COTA -01`, zoom `1.7·base → base`). La intro larga de 44,6 s queda para la primera partida, saltable en 0,6 s; **las llegadas repetidas siguen siendo la transición corta `milestone-to-hub`**. Sin bloqueo de control más allá de la transición, sin cambio brusco de perspectiva, sin cinemática nueva larga.
- **Zonas inferiores (Fase 4):** `lift → startCampaignFromHub(n) → beginPlunge → commitHubToCampaignLoad → beginStairArrival → CAMPAIGN_ROOM`. Ya verificado de extremo a extremo para el Círculo I · LIMBO (118 BPM) en Fase 0. **No se crea una sala inferior nueva**: se conserva el catálogo de 9 círculos + núcleo de `DMO.descentFusion` y el modal de selección (`audit_03_selector_descenso.png`).
- **Separación estricta:** progresión (`unlockedCircles`, guardianes, sellos) ↔ ubicación (`HUB/TRANSITION/CAMPAIGN_ROOM`) ↔ modo de juego (`EXPLORATION/MENU`). La geografía no concede ni bloquea acceso; solo lo **representa**.

---

## 6. Separación de las cinco capas de trabajo

| Capa | Contenido | Punto de integración real | Independiente de |
|---|---|---|---|
| 1 · **Decoración estática** | G2 labio, G3 estratos, G4 abertura, continuidad de aristas | `hubDecor` (extensión aditiva, patrón T04/05/06) + un hook `Wf` encadenado que dibuje **después** de `g.restore()` de `drawHubFloorLayer()` para no ser recortado por `Ls(g)` | tiempo, NPC, progresión |
| 2 · **Animación ambiental** | brasas que suben, luz de profundidad, polvo, pulso de neón del borde, desprendimientos leves | `Ph` / `zf` y `Z` + `DMO_MUSIC.state().bpm` (fase individual por elemento, **no sincronizar todos**), con guarda `Yc.reduced` | colisiones, estaciones |
| 3 · **Animación NPC** | bailar / conversar / descansar / recorrido corto / reacción al jugador | `hub.ambientDancers` + `dancer_step0..3` / V5, `phase` y `rate` por NPC, `sortY` de pies. **Sin IA compleja, sin convertir a todos en ambulantes** | transiciones, cámara |
| 4 · **Transición de entrada** | exterior infernal → HUB, breve y repetible | `DMO_CINE` plano corto + `beginSkyfall(toHub)` + `DMO_MUSIC` (`cineGain/cineFilter/cineSting`) | inventario, círculos |
| 5 · **Transición de descenso** | HUB → grieta → zona inferior, continuidad y devolución de control | `floorDropAnim.beginPlunge` desde `lift` + `drawFloorWorldFX/drawAerialWorldFX/drawScreenFX` + `DMO_MUSIC.onStair*/onFreefallStart` + `DMO_ATMOS` | modo de juego, guardado |

**Prohibido:** nuevo `requestAnimationFrame`, nuevo canvas, nuevo sistema de audio, nueva cámara, nuevos colliders, nueva escena paralela, recargas innecesarias.

---

## 7. Propuesta de integración por subfase (sin ejecutar todavía)

| Subfase | Objetivo | Cambios mínimos previstos | Criterio de paso |
|---|---|---|---|
| **Fase 2 · Llegada** | Transición breve, elegante y repetible desde el exterior infernal | 1 plano CINE corto o reutilización de `5_llegada`; ajuste de `hubIntroMode`/`toHub`; como máximo 1–2 V5 nuevos **si** falta arte. Flag `__DDM_HUB_T07`. Sin tocar la cámara global | llega al HUB con control en ≤2,4 s, sin salto de perspectiva, repetible, teclado+mando OK, T01–06 intactos |
| **Fase 3 · NPC** | Vida reconocible, variada, desincronizada y estable | Extensión aditiva de `hub.ambientDancers`/props con matriz de actividades y `phase` propia; reacción por proximidad a la estación (sin IA). Solo generar sprites si faltan frames | ≥4 actividades distintas, ≥2 frames distintos capturados por NPC, sin saltos de pivote, sin colisiones, `Yc.reduced` congruente, sin reinicio al cambiar cámara |
| **Fase 4 · Descenso** | Continuidad HUB → grieta → zona inferior | Capas G5 sobre los hooks FX de `floorDropAnim` ya existentes; partículas/luz/profundidad; eventos de audio amortiguados del director único; ninguna pantalla negra | transición completa, llegada inferior funcional, control devuelto, música sin saturación, sin regresión de `startCampaignFromHub` |
| **Fase 5 · Integración** | Cierre y validación | QA Chromium/Playwright con A/B (`__DDM_HUB_T07`), capturas + vídeo si la herramienta lo permite, matriz `APROBADO/FALLIDO/BLOQUEADO/NO VERIFICADO`, regresión T01–06, rendimiento, docs, commit independiente y actualización del PR #1 **sin merge** | 0 errores críticos, 162 V5 + N nuevos, 11 estaciones, 6 zonas, `main` intacta |

**Orden de archivos previsto (aditivo, reversible):** `DEADBEAT_DISCO.ART.html` (hooks + entradas `hubDecor`), `ART_PACK/art_pack.js` (solo si hay V5 nuevos, patrón `HUB7_ASSETS`/`loadHub7()`), `ART_ASSETS/hub/tanda_07/` + `manifest.json`, `ART_TOOLS/` (preparación/QA), `ART_EVIDENCE/hub/tanda_07/` e informes raíz. **Commits independientes por subfase si el alcance lo justifica.**

---

## 8. Criterios de no regresión (T01–06)

- `hubDecor`: las 14 entradas T06 (+ repeticiones), 10 T05, 3 T04 y 10 base **permanecen con sus coordenadas, slots y flags**; T07 solo añade.
- `solid:false` / `tall:false`, `sortY` de pies, Y-sort ascendente, sin halos ni pixel art en el arte nuevo.
- V5: `162` claves de partida; cualquier alta se registra en el manifiesto V5 y se valida con `exactSize`/RGBA/halo (patrón T06).
- `DMO_HUB.audit()`: `ok=true`, 6 zonas, 11 estaciones; `canEnterCircle(0)=true`; modal de `lift` sin cambios funcionales.
- Cámara: `zoom .9375`, `a=d`, sin rotación/cizalla, límites `x[883,1617]`, `y[655,1195]`; **sin modificación** de `Q()`/`B`/`L`/`N.zoom` globales.
- Audio: `sequencers:1`, `wired:true`, `errors:[]`, sin bucles constantes nuevos.
- Entrada: WASD y mando Xbox (`mapping:standard`, deadzones intactos) siguen activos tras llegada y descenso.
- 0 `pageerror`; los 2 `404 /cdn-cgi/challenge-platform/` son externos y preexistentes.
- Rendimiento: base de referencia headless 36–39 fps con `DMO_ATMOS.degraded`; toda capa nueva debe poder desactivarse con el flag A/B para medir su coste.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación propuesta |
|---|---|
| El abismo dibujado en `y>1585` resulte recortado por `Ls(g)` | Insertar el hook **después** del `g.restore()` de `drawHubFloorLayer()`; verificar con captura A/B ON/OFF en `audit_geo_4` equivalente |
| Solo ~84 px disponibles → abismo «plano» o «cueva genérica» | Repartir la lectura: relieve G2 dentro del suelo (≈108 px), 3 estratos G3 (84 px) y profundidad G5 en la transición; degradado de luz, nunca un rectángulo negro |
| G2 oculte al jugador, la estación `lift` o el prompt `[E]` | Relieve **bajo**, `solid:false`, `sortY` estudiado contra `y` del jugador; mantener despejado `x 1085…1415, y 1255…1436` y el radio `r=142` |
| Pisar la envolvente T06 | Toda la geografía nueva al sur de `y=1470`; continuidad lateral solo en `y 1540…1675`, con los mismos ingletes de 45° |
| Actividades NPC que el motor no puede reproducir | Solo frames `*_step0..3`/V5 ya soportados; si falta algo, generar **solo** ese frame; verificar reproduciendo >1 frame, no cargando |
| Llegada que bloquee controles o repita la cinemática larga | Reutilizar `5_llegada`/`toHub`; `transitionLock` gestionado por el código existente; `≤2,4 s`; skip disponible |
| Saturación sonora (viento/ruido profundo constantes) | Eventos amortiguados de baja ganancia dentro de `DMO_MUSIC` (`cineFilter/cineGain/onStair*`), sin sistema paralelo |
| Coste de partículas con `DMO_ATMOS` ya degradado en headless | Presupuesto moderado, `Yc.reduced` y flag A/B para medir delta de FPS |
| Mezclar geografía con progresión | La geografía **no** cambia `unlockedCircles`, requisitos, modales ni `canReturnToHubNow()` |

---

## 10. Estado de entrega y punto de decisión

**Entregado ahora:** Fase 0 (auditoría con 31 evidencias y 6 arneses reproducibles) + Fase 1 (este plano de cotas, composición geográfica, separación de capas y propuesta de integración por subfases).

**No entregado / no ejecutado:** assets, sprites, cambios en `DEADBEAT_DISCO.ART.html` o `ART_PACK/art_pack.js`, cámara, colisiones, audio, NPC, transiciones, vídeo, regresión formal T01–06, Fases 2–5.

**Siguiente paso condicionado:** Fase 2 (llegada) **solo tras la autorización** del usuario sobre este diagnóstico y esta propuesta. No se ha creado `ART_ASSETS/hub/tanda_07/`.
