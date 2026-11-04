# PROPUESTA DE CORRECCIÓN — Legibilidad, precipicio y conexión grieta ↔ descenso

**Estado:** `PROPUESTA · NO IMPLEMENTADA · REQUIERE AUTORIZACIÓN`
**Fecha:** 2026-11-04 · **Juego sin modificar** (HTML con SHA-256 `3e82dc77…9011`, idéntico al publicado)

Se presenta **antes de modificar** porque la auditoría (`ART_AUDITORIA_LEGIBILIDAD_HUB.md`) confirmó que el acceso al descenso **no está físicamente conectado a la grieta**: `lift` es un radio lógico + HUD, la grieta es un decal sobre un suelo intacto y el cutaway T08 se abre como una ventana rectangular independiente.

---

## 0. Principio rector

**No se añade nada.** Se ordena, alinea y conecta lo que ya existe. Cero assets nuevos, cero props nuevos, cero sistemas nuevos, cero cambios de cámara, cero cambios de progresión, cero segunda transición.

La geografía del precipicio **ya existe** en T07 (`drawGeography()`, L7223–7261):

| Elemento | Asset / dibujo | Coordenadas mundo |
|---|---|---|
| Labio del acantilado | `h07_labio_acantilado` | (500, 1470) 1500 × 115 |
| Estrato rocoso | `h07_estrato_rococo` | (200, 1585) 2100 × 110 |
| **Abertura hacia las profundidades** | `h07_apertura_profundidad` | (1040, 1560) 420 × 260 |
| Luz de profundidad | gradiente radial | centro (1250, 1630) |
| Escalera de caracol | `hubSpiralCrackFallback()` / `hub_abyss_stair_crack` | (1250, ~1398) |
| Cutaway de 5 planos | T08 P1–P5 | espacio de pantalla |

**El problema es de alineación y de lectura, no de falta de contenido.**

---

## 1. Correcciones mínimas propuestas

### A · P1/P2 — Niebla y redundancia (YA PROBADAS, sin aplicar)

| # | Cambio | Valor | Justificación medida |
|---|---|---|---|
| A1 | `#ilt-atmos-bloom` `style.opacity` | `1.00 → 0.30` | −9,99 de luminancia media, +0,94 de borde; elimina el velo sin apagar el neón |
| A2 | `#ilt-atmos-vig` `style.opacity` | `1.00 → 0.45` | Evita que los bordes del escenario se cierren |
| A3 | `DMO_ATMOS.config.grade / grain` | `1.0→0.35` / `0.016→0.006` | Quita ruido sin información |
| A4 | Ocultar 9 props REDUNDANTES | `prop.hidden = true` | Repeticiones y solapes detectados; **ninguno se elimina** |

Resultado probado: 0 `pageerror`, 62 props intactos, reversibilidad 9 → 0 verificada.

### B · P1 — Saturación del patrón de suelo

| # | Cambio | Detalle |
|---|---|---|
| B1 | Atenuar el patrón dorado **fuera de la pista** | Multiplicador de contraste/alfa decreciente hacia el sur y los corredores, aplicado en el hook de suelo existente. La pista y el medallón quedan intactos. |
| B2 | Reservar la franja `y > 1470` | El patrón de suelo **deja de dibujarse** dentro de la abertura: es lo que hace que el terreno «termine». |
| B3 | Una etiqueta por POI | Desplazar el prompt de la grieta por encima de la abertura; retirar el solapamiento «DJ STAGE» / «CABINA · VIRGILIO». |

### C · P3 — Orientación y perspectiva (sin estirar ilustraciones)

| # | Elemento | Corrección mínima |
|---|---|---|
| C1 | Cabina / escenario DJ | Anclar al muro norte y añadir sombra de contacto; corregir escala. Sin rotación forzada ni estirado. |
| C2 | Abanico del arsenal | Reducir escala, anclar al mostrador, añadir oclusión. |
| C3 | Sofás VIP / altares arcade y sellos | Revisión individual de pivote con cámara real; corregir sólo lo confirmado. |
| C4 | Línea magenta recta del sur | Sustituir por el labio rocoso irregular ya existente (`h07_labio_acantilado`); el color pasa a ser acento, no borde. |
| C5 | 2 props T06 en y=1540 | Ocultar o reubicar por encima del labio. |

### D · P4 — El acantilado como geografía (punto fundamental)

| # | Cambio | Detalle |
|---|---|---|
| D1 | **Hacer visible el final del suelo** | Recortar/mascarar el patrón de suelo en la boca de la abertura (elipse irregular centrada en 1250, ~±190 × ±60 u), dejando ver el interior oscuro. Es el único cambio que crea «dónde termina el terreno». |
| D2 | **Labio con grosor** | Reutilizar `h07_labio_acantilado` con una sombra proyectada hacia el interior y un borde irregular (no recto). Da «dónde empieza el borde». |
| D3 | **Profundidad legible** | Reforzar `h07_apertura_profundidad` y la luz de (1250,1630) con el estrato ya existente; los 5 planos T08 siguen siendo la profundidad. |
| D4 | **Abertura de entrada** | Situar `hub_abyss_stair_crack` en la **boca** de la abertura (1250, ~1560) en lugar de (1250,1436) sobre el suelo. La grieta deja de ser un decal y pasa a ser el borde del hueco. |
| D5 | **Recorrido de descenso** | La escalera de caracol existente (`hubSpiralCrackFallback` / el propio asset de grieta) se dibuja **dentro** de la abertura, descendiendo hacia la luz inferior. |
| D6 | **Señal de recorrido** | Reutilizar el color cian de `lift` como acento continuo desde la pista hasta la boca (sin nuevas flechas ni HUD añadido). |

### E · P5 — Conexión con la transición existente (sin segunda transición)

| # | Cambio | Detalle |
|---|---|---|
| E1 | **Alinear el cutaway T08 con la abertura** | Calcular `winTop` a partir de la **posición en pantalla de la boca** (cámara real), en vez de una línea horizontal fija. La ventana crece **desde el hueco**, no debajo de un suelo intacto. |
| E2 | **Conservar `startCampaignFromHub(0)` intacta** | Ya verificada: `TRANSITION` → 94 fotogramas T07 → T08 `winH 84→374` → `CAMPAIGN_ROOM`. Sin cambios en progresión, `transitionLock`, audio ni cámara. |
| E3 | **No crear puerta nueva** | El radio `lift` (1250,1365,r142) se mantiene; sólo se desplaza su **centro visual** a la boca para que HUD y geografía coincidan. El radio lógico no se toca. |
| E4 | **Sin solapamiento HUD** | El prompt «GRIETA DE DESCENSO» se sitúa sobre el labio, no sobre el icono «III/DESCENSO». |

### F · Jerarquía visual resultante

| Plano | Contenido | Tratamiento |
|---|---|---|
| Primer plano | Jugador y superficie transitable | Máximo contraste; patrón atenuado alrededor |
| Plano principal | Discoteca, medallón, NPC, POI | Neón intacto, bloom 0,30 |
| Plano exterior | Arquitectura y **labio del acantilado** | Contraste medio, sombra de caída |
| Plano profundo | Grieta, abertura, abismo infernal | Contraste bajo, luz cálida inferior |

---

## 2. Mecanismo reversible

Un único módulo pequeño, inserciones mínimas, sin reescribir el motor:

- **Flag:** `window.__DDM_HUB_LEGIBILIDAD` (por defecto **`false`** hasta aprobación; con `false` el HUB es bit a bit el publicado en `3a22d5b`).
- **API de QA:** `window.DMO_HUB_LEGIBILIDAD.state()`, `.audit()`, `.setEnabled(v)`.
- **Restauración:** guarda `style.opacity`, `CFG.grade/grain`, `prop.hidden` y los parámetros de dibujo; al desactivar devuelve todo a su valor original. Verificado en la prueba (9 → 0 props ocultos).
- **Inserciones previstas:** 1 módulo tras `TANDA09:END (módulo)` dentro de `initDmoHubV35()` + 1 llamada en `buildHubSpace()`; enganche sobre los hooks `Wf`/`Tf` ya existentes, encadenado tras T09. **2 inserciones, 0 eliminaciones**, sin tocar `ART_PACK/art_pack.js`.
- **Compatibilidad:** respeta `__DDM_HUB_T07`, `__DDM_HUB_T08`, `__DDM_HUB_T09` y `Yc.reduced`. Si alguno está en `false`, no interviene en lo que ese flag protege.

---

## 3. Lo que NO se propone

- Ningún asset nuevo, sprite, mobiliario, arquitectura, puerta, NPC o sistema de decisión.
- Ninguna segunda transición ni cambio en `startCampaignFromHub`, `floorDropAnim`, progresión, Director, combate o audio.
- Ningún cambio de cámara global (prohibido expresamente).
- Ningún estirado de ilustraciones ni rotación forzada para «compensar».
- Ninguna eliminación de assets: sólo visibilidad reversible.
- Ninguna nueva niebla: la existente se **atenúa**.

---

## 4. Criterio de aprobación y plan de QA

Se repetirá el barrido de 16 posiciones y el A/B de capas con el flag OFF/ON, y se comprobará sin documentación:

1. Se reconoce una **discoteca** (medallón, pista, cabina).
2. Se reconoce que está **sobre un acantilado** (labio con grosor y sombra).
3. Se identifica el **precipicio junto a la zona habitable** (final del patrón de suelo).
4. Se entiende que la **grieta es la entrada** (abertura oscura con escalera descendente).
5. Se entiende que el **descenso va al infierno inferior** (luz cálida + 5 planos T08 naciendo del hueco).

Métricas: luminancia media, contraste, energía de borde, 0 `pageerror`, 62 props, 11 estaciones, 6 zonas, T01–08 audits `ok`, `startCampaignFromHub(0)` completando a `CAMPAIGN_ROOM`, flag OFF ≡ estado publicado. Clasificación `APROBADO / FALLIDO / BLOQUEADO / NO VERIFICADO`.

---

## 5. Orden de ejecución propuesto (sujeto a autorización)

1. A1–A4 (niebla y redundancia) + B1–B3 (saturación y etiquetas). **Prueba A/B y revisión.**
2. C1–C5 (orientación) con capturas individuales. **Si persiste un problema crítico, no se avanza.**
3. D1–D6 (precipicio geográfico). **Capturas desde el borde y desde la pista.**
4. E1–E4 (conexión con la transición existente). **Capturas de los 8 fotogramas de descenso.**
5. Cierre de evidencias, documentación, commit independiente, push a `arena/109fe45c-deadbeat-disconew` y PATCH del PR #1. Sin merge ni cambios en `main`.
6. Sólo entonces se reactivarían/valorarían las rutinas de T09 (ya publicadas y reversibles).

---

## 6. Decisión solicitada

Autoriza el alcance anterior, o indica qué apartados (A–F) quieres ajustar, reducir o posponer. **No se ha modificado el juego** mientras tanto: el HTML activo está restaurado y verificado por SHA-256, y el worktree sólo contiene documentos y evidencias de auditoría.
