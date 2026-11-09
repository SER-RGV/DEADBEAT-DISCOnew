# Fase 07 · Protagonista y reproducción real · PR #17

## Estado: pendiente, PR en borrador

No se han redibujado ni sustituido los originales, ni modificado fondos, motor, cámara, carga o gameplay en esta fase. **No hay validación de fluidez a velocidad normal**, ni se han recuperado versiones íntegras de los dos sprites dañados. La solución temporal del PR sigue siendo temporal.

## Procedencia y comprobación de sprites

Los seis `assets/characters/player_*.png` corresponden byte por byte a los `assets/cinematics/characters/protagonist/hero_*.png`. Se compararon también sus blobs con el commit que los incorporó, `731f5bec2169`: son los mismos. Todos tienen canal alfa y transparencia en el perímetro; esto no implica que la silueta sea íntegra.

| Recurso oficial actual | Lienzo y caja visible (x, y, ancho, alto) | Resultado |
|---|---|---|
| `player_idle_00` | 224×320; 39,24,145,288 | Huecos de transparencia dentro de la figura; no se localizó una copia íntegra equivalente. |
| `player_walk_00` | 224×320; 38,24,147,288 | Visible y sin los huecos extensos detectados en 03. |
| `player_walk_01` | 224×320; 36,24,151,288 | Visible y sin los huecos extensos detectados en 03. |
| `player_walk_02` | 224×320; 37,24,150,288 | Visible; el vestuario difiere visualmente de los fotogramas 00 y 01. |
| `player_walk_03` | 224×320; 64,26,100,286 | Huecos de transparencia dentro de la figura; no se localizó una copia íntegra equivalente. |
| `player_shoot_00` | 240×320; 18,24,203,288 | Silueta visible. |

Las cuatro copias `hero_walk_*_grounded.png` conservan los píxeles originales y la escala, desplazados 8 px hacia abajo en su lienzo; sus cajas terminan en y=320. Ese ajuste no corrige la coherencia del vestuario ni la calidad del alfa. Se comparó el ciclo sobre los archivos y en la prueba previa de Chromium: la continuidad de cuatro fotogramas **no queda demostrada**. El motor conserva provisionalmente 00, 01, 02, 01 y usa 00 en lugar de idle para evitar figuras huecas. El plano 06 actualmente no dibuja al protagonista; no se ha alterado el guion para añadirlo.

Se inspeccionaron el historial de GitHub para esas rutas, los HTML históricos y `ART_ASSETS/tanda_03/fase_c/`. Los HTML históricos contienen el protagonista anterior con camisa azul, distinto del conjunto actual. Tanda 03 contiene poses de diseño `IDLE` y `CAMINAR` de 560×1130, pero su manifiesto especifica que son poses clave, no los cuatro fotogramas Tanda 09: no se han utilizado como sustitutos. Se necesitan las fuentes íntegras oficiales correspondientes a Tanda 09 `idle_00` y `walk_03` y una revisión de consistencia del ciclo.

## Reproducción completa sin avance artificial

- Chromium headless, viewport 640×360, DPR 1, sandbox Linux de 2 CPU, **sin `/dev/dri`**. WebGL informó `ANGLE ... SwiftShader Device (Subzero)`, es decir, renderizado por software, no GPU física.
- Se arrancó `index.html` desde el servidor local y se dejó ejecutar la intro hasta su final sin llamar a `DD_CINE.update()` desde la prueba ni manipular el reloj. La instrumentación observó `requestAnimationFrame`, estado de la cinemática y carga. La prueba anterior con avances programáticos es distinta y **no** sirve para medir tiempo real.
- Duración observada entre primer y último frame de intro: **162,69 s**, frente a 35 s nominales. El reloj cinematográfico limita cada `dt` a 0,05 s, por lo que una ejecución con cuadros lentos tarda más en completar la secuencia. No se cambió esa lógica.
- 1.588 intervalos `requestAnimationFrame`; media efectiva **9,76 FPS** (intervalos/tiempo total). Intervalos mediana 16,7 ms; p90 300 ms; p95 333,4 ms; p99 416,7 ms; máximo 850 ms. 529 intervalos superaron 50 ms y 5 superaron 500 ms; ninguno superó 1.000 ms. Son métricas de callbacks del navegador, no una medición de GPU ni de fotogramas presentados.
- Los diez planos se observaron en orden, la intro terminó y `DD_HUB.getState().active` fue `true`. No se registraron errores de página, peticiones fallidas ni HTTP ≥400. Al comienzo de la intro el registro informaba 260/260 recursos cargados y cero errores. Eso no demuestra ausencia de parpadeos visuales.
- La máquina virtual y SwiftShader no representan un navegador con GPU normal. La caída de rendimiento es real en este entorno; no permite determinar el rendimiento en hardware acelerado. No se ha verificado visualmente ausencia de parpadeos ni una animación fluida a velocidad normal.

Mediciones crudas: `assets/cinematics/evidence/pr17/phase07/realtime_metrics.json`. El observador reproducible es `tools/qa/test_cinematic_realtime.mjs`: servir la build en el puerto 8000, instalar `puppeteer-core` y `@sparticuz/chromium` fuera del repositorio y ejecutar con `DD_QA_MODULES` apuntando a ese directorio y las bibliotecas compartidas que requiera Chromium. Los resultados dependen del entorno y no deben interpretarse como un benchmark de GPU.

## Pruebas distintas de la reproducción real

Las pruebas automatizadas existentes de selección de maestros y de integración comprueban rutas, lógica y conexión al HUB con dobles; no miden el FPS. Las capturas anteriores del PR se tomaron en Chromium con el reloj avanzado manualmente; sirven para revisar los planos, no para validar duración o fluidez.

## Pendiente

1. Conseguir los archivos oficiales Tanda 09 íntegros de idle y walk 03, sin sobrescribir los dañados; verificar identidad, escala, pies, alfa y transición de los cuatro pasos.
2. Repetir la intro completa en un navegador con aceleración gráfica real, a una resolución objetivo, sin avance artificial, revisando visualmente carga, parpadeos, continuidad, transiciones y captura de métricas.
3. Mantener PR #17 en borrador hasta completar ambos puntos.
