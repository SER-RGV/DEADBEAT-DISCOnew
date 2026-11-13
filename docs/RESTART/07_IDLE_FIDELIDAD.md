# 07 · IDLE de fotograma único — corrección de fidelidad

- **Fecha:** 2026-11-12
- **Estado:** superado por la FASE 07B ([`08_IDLE_FIDELIDAD_07B.md`](08_IDLE_FIDELIDAD_07B.md)). El fotograma descrito aquí es la **v1**, conservada en `assets/characters/protagonist_master/fidelidad/versiones/pm_idle_fid_00_v1.png`. Matiz posterior: esta v1 difiere del fotograma actual en 422 píxeles de alfa y alcanzó parte del frente del chaleco (ver §4 del informe 08).
- **Arquitectura IDLE:** aprobada (un fotograma + respiración procedural del motor). Ver [`06_IDLE_FOTOGRAMA_UNICO.md`](06_IDLE_FOTOGRAMA_UNICO.md).
- **Versión actual:** `assets/characters/protagonist_master/pm_idle_00.png`, aprobada técnicamente, **conservada sin cambios** (sha16 `a13a0917997e6447`, igual que antes).
- **Canon:** lámina maestra, sin cambios (SHA-256 `43d9e58f…004e5d` comprobado).

## 1. Qué se entrega

| Elemento | Ruta |
|---|---|
| Fotograma corregido | `assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png` (288 × 512, RGBA, 91 908 B) |
| Manifiesto | `assets/characters/protagonist_master/fidelidad/pm_idle_fid.manifest.json` (`label: IDLE_1F_FIDELIDAD`) |
| Maestro | `ART_ASSETS/rebuild_masters/R05B_PROTAGONISTA_MAESTRO_FIDELIDAD/pm_idle_fid_00.webp` |
| Tanda e informe | `docs/ART_REBUILD/batches/R05B_PROTAGONISTA_MAESTRO_FIDELIDAD.json` y `.report.json` |
| Visor | `assets/cinematics/preview/protagonist_anim_test.html?set=fid` |
| Comparación | `docs/RESTART/evidencia_fidelidad/comparacion_actual_corregido_lamina_tatuajes.jpg` |
| Detalle a resolución del maestro | `docs/RESTART/evidencia_fidelidad/detalle_maestro_vs_lamina.jpg` |
| Capturas del visor | `docs/RESTART/evidencia_fidelidad/fid_*.jpg` |

## 2. Cómo se hizo

1. Se recortó la zona del brazo y el pecho del maestro del fotograma actual y se amplió ×3.
2. Se editó ese recorte con dos referencias directas de la lámina: el panel HOMBRO (SIGILO GEOMÉTRICO) y el panel ANTEBRAZO (LOBO), tomados de `protagonist_master_crop_tattoo_details.png`. Instrucción: cambiar solo la tinta del brazo y las cadenas.
3. El resultado se devolvió a su tamaño, se alineó con el original (coincidencia de silueta 99,5 %) y se pegó **solo donde había cambiado** (brazo y cadenas), con máscara.

Consecuencia: el 94 % de los píxeles del PNG final es idéntico al fotograma actual. Los cambios quedan dentro de x 98–187, y 120–272 (brazo y pecho). Cabeza, pelo, ankh, chaleco, muñequera, mano, pantalón, botas y silueta no se han tocado; la caja de la figura es la misma (89–43–190–504).

No se han inventado motivos: los dos tatuajes proceden de los paneles de la lámina. El patrón orgánico del antebrazo, el sigilo de la mano y los símbolos de los dedos no se han modificado en esta pasada.

## 3. Resultado por corrección

| Corrección pedida | En el maestro (848 × 1264) | En el PNG de juego (288 × 512) | A tamaño de juego (figura ≈106 px) |
|---|---|---|---|
| Sigilo del hombro: estrella dentro del círculo | Se distingue con claridad: círculo, estrella de líneas rectas con puntos en los vértices, remate superior y trazos tribales alrededor | Se distingue el círculo con la estrella dentro al ampliar ×5; trazo fino | No se lee: queda como una mancha circular en el hombro |
| Antebrazo: lobo reconocible | Lobo aullando de perfil, hocico hacia arriba, ojo, oreja y pelaje, con el patrón de cheurones debajo | Se reconoce al ampliar ×5, con menos nitidez que el sigilo | No se lee: mancha oscura en el antebrazo |
| Cadenas del cuello sin ocultar la placa | Dos cadenas de eslabones visibles desde el cuello hasta la placa; placa entera | Las cadenas se ven como una línea punteada tenue; la placa sí | No se leen |
| Camiseta blanca y chaleco negro | Sin cambios | Sin cambios | Se leen |

### Diferencias que quedan respecto a la lámina

- **Estrella:** es una estrella geométrica dentro de un círculo, pero no reproduce línea por línea la de la lámina.
- **Lobo:** falta la hilera de eslabones que cierra el tatuaje por abajo en la lámina; el lobo es algo más pequeño en proporción al antebrazo.
- **Grosor de tinta:** el trazo es más fino que el de la lámina. Es el motivo de que en el PNG de 288 px los tatuajes pierdan fuerza.
- **Lado del brazo:** sigue sin decidirse qué brazo lleva cada tatuaje; aquí van los dos en el brazo visible, como en la vista PERFIL D.

### Límite de tamaño

En el PNG de juego el brazo mide unos 40 px de ancho y el círculo del sigilo unos 15 px. Ningún tatuaje puede leerse en detalle a la escala real de juego, con esta versión ni con otra. La corrección se aprecia en el maestro, en el visor ampliado y en cualquier uso del personaje a mayor tamaño.

## 4. Visor

`protagonist_anim_test.html` tiene ahora tres recursos: **ACTUAL · APROBADO TÉCNICAMENTE** (por defecto, sin cambios de comportamiento), **CORREGIDO · POR VALIDAR** (`?set=fid`) y **EXPERIMENTO 4F · FALLIDO** (`?set=4f`).

Con `?set=fid` se abre directamente la comparación:

- Fotograma actual y fotograma corregido, uno junto al otro, dibujados por el `DD_WORLD.drawProtagonist` real y con la respiración del motor.
- Panel lateral con los dos brazos ampliados ×5, la vista PERFIL D. de la lámina y el detalle de tatuajes de la lámina.
- Banda amarilla que lo rotula como pendiente de validación visual.

Botones nuevos: **ACTUAL JUNTO A CORREGIDO** y **LÁMINA Y TATUAJES**. También funcionan desde el fotograma actual, apagados al abrir. Con **SPRITE ANTIGUO** se ven los tres en fila.

## 5. QA

Ejecutado el 2026-11-12, Chromium sin cabeza, 1920 × 1080. **Todo son pruebas de visor; no se ha hecho ninguna prueba dentro de una partida con el fotograma corregido.**

- QA del visor: **74/74** (24 del fotograma actual, 13 de la corrección, 37 del experimento archivado).
- De la corrección: carga y rótulo de pendiente; 288 × 512, suelas en y=504, 462 px, esquinas transparentes; caja de la figura idéntica a la del actual; orden actual · corregido; panel con lámina y ampliaciones; los brazos ampliados difieren en un 13 % de píxeles; las dos figuras caben; respiración en marcha; fila de tres con el sprite antiguo; escala de juego 106 px; consola sin errores.
- Pipeline: 1/1 procesado, sin avisos, sin halo verde, sin tocar bordes.
- Visor de arte: 48/48.
- Sin cambios en `src/`, los 22 sprites, el registro, `index.html`, menú, cinemática, Refugio, la lámina ni `pm_idle_00.png`.

## 6. Qué necesito de la validación

1. Si la estrella en el círculo y el lobo se dan por válidos tal como están en el maestro.
2. Si las diferencias de §3 (estrella no idéntica, falta la hilera de eslabones, trazo fino) se aceptan o piden otra pasada.
3. Si se quiere una pasada para engrosar la tinta y que los tatuajes aguanten mejor a 288 px, sabiendo que a tamaño de juego seguirán sin leerse.

Parado hasta esa validación. No se ha registrado nada ni se ha empezado otra animación.
