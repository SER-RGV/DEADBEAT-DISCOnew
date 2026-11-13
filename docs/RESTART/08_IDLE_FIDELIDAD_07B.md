# 08 · FASE 07B — última corrección de fidelidad del IDLE

- **Fecha:** 2026-11-12
- **Estado:** `PENDIENTE DE APROBACIÓN`. No registrado, no sustituye al IDLE activo, ninguna otra animación iniciada.
- **Recurso:** `assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png` (v2), 288 × 512, RGBA, 91 586 B, SHA-256 `c17c4655…6dd4e280`.
- **Canon:** lámina maestra, sin cambios.
- Evidencia: `docs/RESTART/evidencia_fidelidad_07b/`.

## 1. Entregables

| N.º | Pedido | Dónde |
|---|---|---|
| 1 | PNG corregido | `assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png` |
| 2 | Manifiesto actualizado | `assets/characters/protagonist_master/fidelidad/pm_idle_fid.manifest.json` (`version: v2 (FASE 07B)`, con `previous` y `sources`) |
| 3 | Comparación actual / anterior / nueva / lámina | `01_comparacion_actual_anterior_nueva_lamina.jpg` y `02_brazo_png_x5_actual_anterior_nueva.jpg`; en vivo, el visor con `?set=fid` |
| 4 | Ampliación de hombro, lobo y cadenas | `03_hombro_lamina_vs_nueva_vs_anterior.jpg`, `04_lobo_lamina_vs_nueva_vs_anterior.jpg`, `05_cadenas_y_placa.jpg` |
| 5 | Superposición de zonas modificadas | `06_superposicion_zonas_modificadas.jpg` |
| 6 | Hashes de los originales | `hashes_y_diferencias.json` |
| 7 | QA del visor, comprobación por comprobación | `qa_visor_resultados.md` (tabla) y `qa_visor_idle.json` |

Versiones conservadas para comparar: `pm_idle_00.png` (actual, intacto) y `fidelidad/versiones/pm_idle_fid_00_v1.png` (corrección anterior, idéntica byte a byte a la entregada en la FASE 07), con su manifiesto y su maestro.

## 2. Método: la tinta sale de la lámina, no se redibuja

En la FASE 07 los tatuajes los dibujó el generador a partir de los paneles, y por eso la estrella no coincidía línea por línea. Esta vez no se ha dibujado ningún tatuaje:

1. **Brazo sin tinta.** Una edición del recorte del brazo que solo retira la tinta entre el hombro y la muñequera y refuerza las cadenas. Se pega con máscara únicamente sobre la piel del brazo y sobre las cadenas; la placa queda excluida de la máscara.
2. **Tinta de la lámina.** De `protagonist_master_crop_tattoo_details.png` se extrae la tinta de los paneles HOMBRO y ANTEBRAZO (LOBO) y se coloca sobre la piel con una transformación de escala y giro, sin deformar: hombro a escala 0,62 sin giro; lobo a escala 0,49 girado 28° para seguir el eje del antebrazo.
3. **Grosor.** Tras colocarla, el trazo se engrosa de forma moderada (mezcla del 50 % con una dilatación de 1 px en el hombro y del 15 % en el lobo, a resolución de maestro).

El guion exacto está en `evidencia_fidelidad_07b/compose_fid2.py`. Las hojas 03 y 04 muestran el panel de la lámina llevado a esa misma escala y giro junto al resultado, para comprobar la correspondencia a ojo.

## 3. Resultado por punto

| Punto | Resultado en el maestro (848 × 1264) |
|---|---|
| Estrella en el círculo | Es la del panel HOMBRO: misma geometría, proporciones y orientación, con el remate superior, los puntos de los vértices y los trazos y anillos de alrededor. Trazo más grueso que en la v1 |
| Lobo | Es el del panel ANTEBRAZO (LOBO): perfil aullando, ojo, pelaje, cheurones. **Recuperada la hilera de cuatro eslabones** que lo cierra por abajo |
| Grosor de tinta | Aumentado de forma moderada; las líneas de la estrella no se funden en el maestro |
| Cadenas | Dos cadenas de eslabones redondos hasta la placa, bastante más visibles. **Placa idéntica píxel a píxel** a la de la v1 en el maestro |
| Camiseta y chaleco | Chaleco sin cambios. La camiseta solo cambia donde las cadenas pasan por encima |

### Lo que conviene saber antes de aprobar

- **En el PNG de 288 px la v2 no se lee mejor que la v1.** La lámina tiene mucha tinta alrededor del sigilo y, al reducir, el hombro queda más denso y oscuro; la estrella dentro del círculo se distingue, pero menos limpia que en la v1. Se ve en `02_brazo_png_x5_actual_anterior_nueva.jpg`. La v2 gana en fidelidad a la lámina y en el recurso ampliado, que es lo que se pidió priorizar; la v1 es más nítida en pequeño.
- **La tinta del hombro se desvanece hacia el codo.** El panel de la lámina sigue con trazos hasta su borde inferior; ahí se ha aplicado un fundido para no dejar un corte recto. Esa franja inferior queda más suave que en la lámina.
- **El lobo es algo granulado** en el maestro: su pelaje en la lámina es gris sobre piel, y al separarlo de la piel pierde algo de limpieza.
- **El sombreado de la piel del brazo cambia** respecto a la v1 (procede del brazo sin tinta). El contorno y la silueta del brazo no cambian.
- **Sigue abierto** qué brazo lleva cada tatuaje; aquí van en el brazo visible, como en PERFIL D.
- A tamaño de juego (figura ≈106 px) los tatuajes no se leen en ninguna versión.

## 4. Zonas modificadas

Comparación de los PNG finales, píxel a píxel (`hashes_y_diferencias.json`):

| De → a | Píxeles distintos | Caja de los cambios | Canal alfa (silueta) |
|---|---|---|---|
| Corrección anterior → nueva | 2,99 % | x 108–184, y 134–268 | **0 píxeles distintos** |
| Actual → nueva | 6,01 % | x 98–187, y 120–272 | 422 píxeles distintos |

Los cambios de la anterior a la nueva forman tres manchas: el brazo (x 108–162), las cadenas sobre el pecho (x 162–182, y 142–181) y 11 píxeles en el punto donde la cadena llega a la placa.

Valores de píxel distintos por zona protegida:

| Zona | Anterior → nueva | Actual → nueva |
|---|---|---|
| Cabeza, rostro, pelo y ankh | 0 | 0 |
| Pantalón y botas | 0 | 0 |
| Mano y muñequera | 0 | 3 |
| Espalda del chaleco | 0 | 20 |

**Corrección a mi informe de la FASE 07.** Allí dije que la silueta y el chaleco no se habían tocado. Las medidas de hoy lo matizan: entre el fotograma actual y la corrección anterior hay 422 píxeles con el alfa distinto en el borde del pecho, y la edición de entonces alcanzó también parte del frente del chaleco (se ve en la mitad derecha de la hoja 06). La caja de la figura sí es idéntica. Esta fase no añade ninguna diferencia de silueta sobre la v1.

## 5. Originales intactos

Todos idénticos a los del commit anterior (`75cb357`):

| Archivo | SHA-256 (inicio) |
|---|---|
| `protagonist_master_approved.png` | `43d9e58fcd1c9f9e` |
| `protagonist_master_crop_tattoo_details.png` | `6774701d0fb2e7ae` |
| `protagonist_master/pm_idle_00.png` | `a13a0917997e6447` |
| `protagonist_master/pm_idle.manifest.json` | `4b4a67c0d69127c8` |
| `assets/characters/player_idle_00.png` | `a882c12896f62efe` |
| `assets/manifest.json` | `90c61583322c3d69` |
| `src/dd_world_renderer.js` | `c097926f3e137835` |
| `src/dd_asset_registry.js` | `af92171b2236ff4a` |

Los 21 archivos `assets/characters/player_*.png`: sin cambios (hash conjunto `0c50125d…`). `src/`, `index.html`, `DEADBEAT_DISCO.html` y el registro: sin cambios. Hashes completos en `hashes_y_diferencias.json`.

## 6. QA

Ejecutado el 2026-11-12, Chromium sin cabeza, 1920 × 1080. **Solo pruebas de visor; ninguna dentro de una partida.**

- QA del visor: **76/76**. La tabla con el resultado y la medida de cada comprobación está en `evidencia_fidelidad_07b/qa_visor_resultados.md`. De las 76, 15 son de la corrección: rótulo de pendiente, contrato de lienzo (288 × 512, suelas y=504, 462 px, esquinas transparentes), caja idéntica a la del actual y a la de la v1, fila actual · anterior · nueva, panel con lámina y tres ampliaciones, respiración en marcha, escala de juego, consola sin errores.
- Pipeline: 1/1 procesado, sin avisos.
- Visor de arte: 48/48.

El visor muestra ahora, con `?set=fid`, las tres versiones en fila (actual · corrección anterior · nueva corrección) y, en el panel, los tres brazos ampliados junto a la lámina.

## 7. Estado final

`PENDIENTE DE APROBACIÓN`. Nada registrado, IDLE activo sin sustituir, ninguna otra animación iniciada. A la espera de validación expresa.
