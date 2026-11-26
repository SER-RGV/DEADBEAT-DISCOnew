# Tanda 03 · FASE A · Ficha de identidad visual del protagonista

**Estado:** diseño maestro generado, **pendiente de aprobación explícita**.
**Fecha:** 2026-11-03 · **Rama:** `arena/3f148aa7-deadbeat-disco`.
**Referencia maestra no opcional:** `ART_REFERENCES/REF_04_protagonista_banner.png` (823×212 RGBA, copia de `/tmp/arena-coding-uploads/hyug.png`).
**Alcance:** material de diseño y comprobación. **NO son sprites finales**, no hay 8 orientaciones jugables, no hay animaciones, no hay spritesheet y no hay integración en el HTML.

---

## 1. Entregables visuales

| Archivo | Vista | Tamaño RGBA | Uso |
|---|---|---|---|
| `ART_ASSETS/tanda_03/master_full_body.png` | 3/4 isométrica sur-este, cuerpo entero | 364×1130 | **Imagen maestra** de identidad |
| `ART_ASSETS/tanda_03/view_front.png` | frontal isométrica | 363×1122 | Comprobación de identidad de frente |
| `ART_ASSETS/tanda_03/view_side.png` | perfil 90° | 233×1128 | Resolución de volumen y profundidad |
| `ART_ASSETS/tanda_03/view_back.png` | posterior | 367×1195 | Resolución de cabello, espalda y tatuajes |
| `ART_ASSETS/tanda_03/manifest.json` | — | — | Metadatos, alfa, pivote propuesto, QA y SHA-256 |

Fuentes RGB originales en `ART_ASSETS/tanda_03/_source/`. Preparación reproducible: `ART_TOOLS/prepare_tanda_03.py`; calibración: `ART_TOOLS/qa/calibrate_tanda_03_alpha.py`.

> `ART_ASSETS/tanda_03/_source/DISCARDED_turnaround_draft.png` es un **borrador descartado**: la primera generación devolvió un turnaround de 7 figuras en lugar de una imagen maestra única. Se conserva solo como referencia de identidad para la regeneración; **no es entregable**.

---

## 2. Rasgos invariables (deben repetirse en las 8 orientaciones y en las 8 animaciones)

| # | Rasgo | Especificación congelada |
|---|---|---|
| R1 | **Cabello** | Negro, muy voluminoso y despeinado, mechones irregulares hacia arriba y hacia los lados, silueta ancha y asimétrica, sin recogido ni accesorio. Es el rasgo más reconocible. |
| R2 | **Rostro** | Proporciones realistas: ojos alineados, nariz y boca de escala humana, mandíbula definida, sin ojos desproporcionados ni rasgos anime/fantasía. Mirada lateral despreocupada y desafiante. |
| R3 | **Complexión** | Delgada y estilizada, hombros estrechos, cintura marcada, brazos y piernas largos y anatómicamente diferenciados. Sin musculatura exagerada. |
| R4 | **Camiseta** | Negra, **sin mangas** (tank top), cuello redondo, brazos completamente descubiertos, sin estampado, logotipo ni bolsillo. |
| R5 | **Tatuajes** | Ornamentales de tinta oscura con motivos circulares, florales y paisley, cubriendo **ambos** brazos: hombro/parte superior del brazo y antebrazo hasta la muñeca. Mismo patrón en todas las vistas; en la posterior continúan rodeando el brazo. |
| R6 | **Pantalón** | Negro recto, tiro normal, costura lateral con ribete magenta muy fino, sin roturas ni bolsillos decorativos inventados. |
| R7 | **Calzado** | Botines/tobilleras negros lisos, **sin cordones visibles**, suela discreta. Se corrigió una primera versión de la vista lateral que traía botas de cordones. |
| R8 | **Manos** | Vacías, dedos relajados, preparadas para que el motor superponga el arma. **Ningún arma dibujada**. |
| R9 | **Actitud** | De pie, postura neutral de videojuego, centro de gravedad equilibrado, hombros sueltos, brazos separados del torso y piernas separadas; despreocupada y desafiante. |
| R10 | **Luz** | Magenta en el borde izquierdo y cian en el derecho sobre materiales oscuros, luz principal del noroeste, sombras controladas, sin halo. |
| R11 | **Contorno** | Línea de tinta oscura cerrada, limpia, sin pixel art, sin dithering, sin ruido artificial, sin degradado de fondo incrustado. |

**Exclusiones verificadas en las 4 láminas:** sin logotipo, sin zorro coronado, sin textos, sin multitud, sin escenario de club, sin lámparas/neones, sin silla ni postura sentada, sin armas, sin armadura, sin accesorios inventados, sin elementos de ciencia ficción o fantasía, sin armadura de placas, sin capa, sin guantes, sin gafas, sin joyas añadidas.

---

## 3. Proporciones medidas (sobre `master_full_body.png`)

Datos objetivos del canal alfa, no estimaciones: alto 1130 px, ancho 364 px, **ratio alto/ancho 3,10**. La vista lateral es 4,84 por su perfil estrecho; la posterior 3,26.

| Altura relativa | Ancho de silueta | Lectura anatómica |
|---|---|---|
| 0,06 | 187 px | cabello voluminoso |
| 0,15 | 193 px | cabello + rostro |
| 0,25 | 195 px | cuello y hombros |
| 0,35 | 271 px | hombros + brazos iniciando separación |
| 0,45 | 316 px | brazos separados del torso, tatuajes visibles |
| 0,55 | 334 px | caderas y manos, anchura máxima |
| 0,70 | 207 px | piernas separadas |
| 0,85 | 229 px | tobillos y botas |
| 0,97 | 218 px | apoyo de los pies |

La **fila de apoyo** es `y = 1125` de 1130 (margen inferior de 5 px). El apoyo real recae en el pie adelantado, con un rango estrecho de x; el pie retrasado queda unos píxeles más arriba, coherente con la vista 3/4 isométrica.

**VERIFICADO:** cuerpo entero resuelto de la coronilla a la suela, brazos y piernas separados, silueta legible, mismo patrón de anchuras en maestra y frontal (variación ≤ 3 px por banda).
**NO VERIFICADO:** número de "cabezas" de altura como canon anatómico (la ilustración es estilizada, no una planta de proporción académica); comportamiento de estas proporciones al reducir a 96 px de alto.

---

## 4. Color e iluminación

**Dominante:** negros profundos. Más del 69 % de los píxeles visibles están a distancia ≤ 38 de `#0a0c12` / `#191a25` / `#2d0619` (los tres son casi indistinguibles en una ilustración con volumen, por lo que el porcentaje se solapa).

**Acentos medidos** (media de píxeles con tinte, no hex literal):

| Familia | Media medida | Hex de biblia | Píxeles a distancia ≤ 70 del hex |
|---|---|---|---|
| Magenta | `#733859` aprox. | `#ff2d95` | 0,02–0,22 % |
| Cian | `#608d87` aprox. | `#38bdf8` | 0,00–0,05 % |
| Violeta | presente en sombras | `#c084fc` | 0,01–0,04 % |
| Oro | **ausente** | `#facc15` | 0,00 % |

> **Desviación detectada, registrada para la aprobación:** las láminas respetan la dirección "negros profundos + luz magenta/cian controlada + oro solo secundario", pero los acentos son **versiones desaturadas** de los hex exactos de la biblia visual, no los valores literales `#ff2d95` / `#38bdf8` / `#c084fc`. Distancia mínima medida al magenta: 49–62; al cian: 61–81; al oro: 81–84. Es una decisión de ilustración con volumen (un rim con el hex puro saturaría el borde). **NO VERIFICADO** que esta interpretación satisfaga el requisito de "paleta exacta"; queda explícitamente sujeta al criterio de aprobación. Si se exige literalidad, la corrección se aplicaría en una pasada de color posterior, no en esta fase.

---

## 5. Coherencia entre vistas

- **VERIFICADO:** mismo cabello, mismo tank top, mismos tatuajes ornamentales en ambos brazos, mismo pantalón con ribete, mismas botas lisas sin cordones, misma complexión y misma luz magenta/cian en maestra, frontal, lateral y posterior. La vista posterior resuelve la nuca, los omóplatos, los bolsillos traseros y la continuación de los tatuajes.
- **VERIFICADO:** ancho de silueta de maestra (364 px) y frontal (363 px) prácticamente idéntico; la lateral (233 px) es coherente con un perfil; la posterior (367 px) con la espalda.
- **Matización honesta:** `view_front.png` es una **frontal isométrica** (3/4 mirando al espectador), admitida por el pliego, y resulta **casi coincidente con la maestra** en ángulo y pose. Sirve como comprobación de identidad, **no como un ángulo de cámara nuevo**. Un intento de forzar una frontal recta a 0° fue rechazado por el generador, que mantuvo el 3/4. Las diferencias reales de perspectiva se producirán en la FASE B (8 orientaciones), no aquí.
- **NO VERIFICADO:** identidad al reducir a 36–74 px de ancho / 96 px de alto, que es la resolución real de los slots HD del motor.

---

## 6. Criterio de aprobación (evaluación propia, no sustituye al usuario)

| Criterio | Resultado |
|---|---|
| Reconocible como el personaje de la referencia | **SÍ** en las 4 láminas: cabello, tank top, tatuajes, complexión y actitud |
| Cuerpo entero resuelto | **SÍ**, coronilla a suela, postura neutral de pie |
| Tatuajes / vestuario coherentes | **SÍ**, con corrección del calzado en la lateral |
| Silueta funcional en isométrica | **SÍ** conceptualmente; **NO VERIFICADO en ejecución** |
| Compatible conceptualmente con el motor | **Análisis en** `ART_TANDA_03_FASE_A_COMPATIBILIDAD.md`; integración **NO VERIFICADA** |
| Misma identidad en todas las vistas | **SÍ**, con la matización del ángulo frontal |

**Esta fase se detiene aquí.** No se han generado las 8 orientaciones jugables, ni las 8 familias de animación, ni el spritesheet definitivo, ni se ha modificado el render, el HTML, las mecánicas ni los documentos de producción (`ART_BIBLE.md`, `ART_PRODUCTION_LOG.md`, `README.md`).
