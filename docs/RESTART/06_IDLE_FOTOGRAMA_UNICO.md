# 06 · IDLE de fotograma único del protagonista

- **Fecha:** 2026-11-12
- **Estado:** arquitectura IDLE **aprobada** (un fotograma + respiración del motor); `pm_idle_00.png` aprobado técnicamente. **No registrado**, no sustituye al activo. La fidelidad de los tatuajes y las cadenas se trata en [`07_IDLE_FIDELIDAD.md`](07_IDLE_FIDELIDAD.md), pendiente de validación visual.
- **Sustituye a:** la muestra de cuatro fotogramas, archivada como `IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY` (informe: [`05_MUESTRA_IDLE.md`](05_MUESTRA_IDLE.md)).
- **Canon:** `assets/cinematics/restart/character_master/protagonist_master_approved.png` (sin cambios; SHA-256 `43d9e58f…004e5d` comprobado).
- No se ha empezado WALK, RUN, SHOOT ni ninguna otra animación.

## 1. Qué se entrega

| Elemento | Ruta |
|---|---|
| Fotograma | `assets/characters/protagonist_master/pm_idle_00.png` (288 × 512, RGBA, 91 966 B) |
| Manifiesto | `assets/characters/protagonist_master/pm_idle.manifest.json` (`label: IDLE_1F`) |
| Maestro | `ART_ASSETS/rebuild_masters/R05_PROTAGONISTA_MAESTRO/pm_idle_00.webp` |
| Tanda e informe del pipeline | `docs/ART_REBUILD/batches/R05_PROTAGONISTA_MAESTRO.json` y `.report.json` |
| Visor | `assets/cinematics/preview/protagonist_anim_test.html` (abre el fotograma único; `?set=4f` abre el experimento) |
| Comparación visual | `docs/RESTART/evidencia_idle_1f/comparacion_antiguo_nuevo_lamina_tatuajes.jpg` |
| QA del visor | `tools/qa/test_protagonist_anim_viewer.js` → `evidencia_idle_1f/qa_visor_idle.json` y capturas `idle1f_*.jpg` |
| Sonda en partida | `tools/qa/probe_idle_1f_in_game.js` → `evidencia_idle_1f/partida_sonda.json`, `partida_*.png`, `partida_refugio_control_vs_nuevo.jpg` |

## 2. Cómo se hizo el fotograma

Parte del fotograma 03 del experimento (el neutro). Una sola edición, limitada al chaleco: negro, abierto, con la tira de camiseta blanca. Comparado con el fotograma de partida, la caja de la figura y los pies son idénticos, y los píxeles cambiados se concentran en la franja del torso (6–10 %; menos del 0,2 % en el resto). Cara, pelo, ankh, brazo, tatuajes, muñequera, mano, pantalón y botas quedan como estaban.

Procesado con el pipeline existente (`batch.py process`): 1/1 correcto, sin avisos de control de calidad, sin halo verde, sin tocar bordes.

## 3. Respiración

El IDLE usa la respiración que el motor ya tiene: `pAnim.bobY = sin(fase) × amplitud`, con la fase avanzando a 2,8 rad/s (ciclo de 2,24 s). Amplitud ±1,1 px de mundo en el Refugio. No se ha escrito código de motor ni un controlador nuevo, y el renderizador no tiene líneas añadidas.

**Dos cosas que conviene saber:**

- El balanceo del motor desplaza **la figura entera**, botas incluidas (`translate(x, y + bobY)`). En el fotograma, pies y botas no cambian; en pantalla suben y bajan ±1,1 px con el resto del cuerpo, igual que el sprite actual. Que los pies queden clavados exigiría tocar el renderizador, y no se ha hecho.
- En combate, parado, el motor no dibuja el IDLE sino la pose de apuntar (`player_fire`). El IDLE se ve en el Refugio. El visor permite elegir la amplitud «combate» (±0,55 px) como referencia, pero ese caso no se da hoy en el juego con este sprite.

## 4. Requisitos del fotograma

| Requisito | Resultado |
|---|---|
| Perfil derecho | Cumple |
| Sin sombrero, pelo descubierto | Cumple (pelo oscuro despeinado con reflejos magenta) |
| Rostro estable | Cumple: un solo fotograma |
| Chaleco negro | Cumple. Ribete magenta y filo cian, secundarios |
| Camiseta blanca visible | Cumple, como tira estrecha: es lo que deja ver un perfil puro |
| Cadenas del cuello | **Parcial.** Se distingue la placa sobre la camiseta; las cadenas apenas se leen a este tamaño |
| Tatuajes sin alteraciones | Cumple respecto al fotograma de partida. **No** son todavía los de la lámina (ver §6) |
| Pies y botas inmóviles | Cumple en el recurso; ver la nota de §3 sobre el balanceo |
| Transparencia | Cumple: esquinas transparentes, figura sin tocar bordes |
| Anclajes compatibles | Cumple el contrato: suelas en y=504, figura de 462 px, eje centrado. Anclas `belt 0.511` y `hand [0.5796, 0.5767]` **estimadas** (el cinturón no se ve de perfil; no hay arma con la que comprobar la mano) |

## 5. QA

Ejecutado el 2026-11-12 con Chromium sin cabeza a 1920 × 1080.

### 5.1 Pruebas en el visor — 61/61 superadas

El visor carga el `src/dd_world_renderer.js` real y llama a `DD_WORLD.drawProtagonist`; no arranca el juego. 24 comprobaciones son del fotograma único y 37 del experimento archivado (incluida la que exige que se muestre rotulado como fallido).

| Aspecto | Medido |
|---|---|
| Dimensiones | 288 × 512 |
| Transparencia | esquinas transparentes; caja de la figura 89–43–190–504 |
| Línea de suelo | suelas en y=504, altura 462 px, igual que los sprites actuales |
| Respiración, amplitud | −1,100 … +1,100 px |
| Respiración, ciclo | 2 250 ms (motor: 2 244 ms); a 2×, 1 117 ms |
| Fotograma durante el ciclo | 315 muestras, siempre `pm_idle_00` |
| Recorrido de la cabeza a tamaño de juego | 2 px en pantalla (teórico 2,55) |
| Pausa | la respiración se detiene |
| **Tatuajes durante el ciclo** | 6 lecturas del lienzo completo repartidas en 2,2 s, **idénticas píxel a píxel** (sin balanceo) |
| Escala real de juego | figura de 106 px con zoom 1,16 |
| Reflejo | figura espejada por el motor; sin recurso duplicado |
| Rendimiento | 0,13 ms de dibujo por cuadro |
| Consola y red | 0 errores |

Sobre los tatuajes: con un solo mapa de bits no hay nada que pueda redibujarse entre cuadros; la prueba lo confirma. Con el balanceo activo la figura se desplaza fracciones de píxel y el navegador la remuestrea entera, así que los cuadros no son idénticos bit a bit, pero el dibujo es el mismo.

Visor de arte: 48/48, sin cambios.

### 5.2 Prueba dentro de una partida — limitada, con sustitución solo en el navegador de prueba

El recurso no está registrado, así que el juego no puede cargarlo por sí mismo. Para verlo en partida sin tocar ningún archivo, la sonda responde a la petición de `player_idle_00.png` con los bytes del fotograma nuevo, **únicamente dentro del navegador de la prueba**. Motor, registro, manifiesto, cámara y Refugio son los reales. Se hizo una pasada de control sin sustitución.

| Aspecto | Control (sprite actual) | Con el fotograma nuevo |
|---|---|---|
| Carga del juego | sin errores | sin errores, 0 respuestas HTTP ≥ 400 |
| Llegada al Refugio | sí | sí |
| Pose del motor | `player_idle` | `player_idle` |
| `bobY` leído del motor | entre −1,10 y +1,01 | oscila igual |
| Figura | de pie sobre su sombra | misma altura y misma línea de suelo |
| Mirando a la izquierda | espejado | espejado |

Captura: `evidencia_idle_1f/partida_refugio_control_vs_nuevo.jpg`.

**Límites de esta prueba:** las anclas que usó el motor son las del sprite antiguo, no las del manifiesto nuevo; solo cubre el Refugio en reposo; no se entró en una incursión; es una comprobación visual sobre capturas, sin medición de píxeles de la figura dentro de la escena. No equivale a una integración.

### 5.3 No verificado

Integración real (registro del recurso), anclas con arma, incursión, otros navegadores, mando, rendimiento en hardware real.

## 6. Desviaciones respecto a la lámina — para la próxima revisión de ilustración

La lámina es la autoridad. Estas diferencias quedan anotadas; no se han resuelto deformando tatuajes ni inventando motivos.

| N.º | Desviación | Estado en este fotograma |
|---|---|---|
| 1 | El sigilo del hombro debe conservar la estrella dentro del círculo | **Sin corregir.** En el fotograma el hombro lleva tinta abstracta; no se distingue ni círculo ni estrella |
| 2 | El lobo debe reconocerse como lobo | **Sin corregir.** El antebrazo lleva manchas que no se leen como lobo |
| 3 | El chaleco debe leerse negro, con magenta y cian secundarios | Corregido |
| 4 | Recuperar cadenas y camiseta blanca | Camiseta recuperada; de las cadenas solo se lee la placa |

Motivo de 1 y 2: a 462 px de figura el brazo mide unos 40 px de ancho, y el generador no traslada esos dos motivos desde la lámina (al darle el panel de tatuajes como referencia devolvió una copia del panel; descartado). Corregirlos pide trabajo de ilustración sobre el brazo.

Sigue abierta, sin inventar respuesta, la cuestión de qué brazo lleva cada tatuaje.

## 7. Estado del experimento de cuatro fotogramas

`IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY`. Conservado completo, sin borrar nada, y no se presenta como animación aprobada.

| Qué | Dónde |
|---|---|
| Cuatro PNG y manifiesto | `assets/characters/protagonist_master/IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY/` |
| Maestros webp | `ART_ASSETS/rebuild_masters/R05_PROTAGONISTA_MAESTRO/IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY/` |
| Evidencia, medidas, GIF y tanda | `docs/RESTART/evidencia_IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY/` |
| Informe | `docs/RESTART/05_MUESTRA_IDLE.md`, con el rótulo al principio |
| Visor | el mismo, con `?set=4f`: banda magenta con la etiqueta y el motivo del fallo |

## 8. Qué no se ha tocado

`src/`, los 22 sprites `player_*` y sus capas, `index.html`, `DEADBEAT_DISCO.html`, `assets/manifest.json`, el registro de recursos, el menú, la cinemática, el Refugio y la lámina maestra.

## 9. Siguiente paso

Arquitectura aprobada. Corrección de fidelidad entregada en `07_IDLE_FIDELIDAD.md`; parado hasta su validación visual.

Nota: desde esa entrega el QA del visor suma 74 comprobaciones (se añadieron 13 de la corrección) y sus capturas `fid_*.jpg` están en `evidencia_fidelidad/`.
