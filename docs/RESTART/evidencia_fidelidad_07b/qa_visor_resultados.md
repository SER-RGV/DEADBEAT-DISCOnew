# QA del visor — resultado de cada comprobación (FASE 07B)

Ejecutado el 2026-11-12 con Chromium sin cabeza a 1920 × 1080 contra `assets/cinematics/preview/protagonist_anim_test.html`. Todas son pruebas de visor; ninguna dentro de una partida.

**76/76 superadas.** `[1F]` = fotograma actual · `[FID]` = corrección · `[4F]` = experimento archivado.

| N.º | Resultado | Comprobación | Medido |
|---|---|---|---|
| 1 | PASA | [4F] ESTÁTICA la página carga y la muestra queda lista | HTTP 200, 4 fotogramas |
| 2 | PASA | [4F] 4F se presenta como experimento fallido, no como animación aprobada | IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY |
| 3 | PASA | [4F] ESTÁTICA los cuatro fotogramas miden 288 × 512 | [[288,512],[288,512],[288,512],[288,512]] |
| 4 | PASA | [4F] ESTÁTICA tiempos del manifiesto: 4 × 560 ms = 2,24 s | 560, 560, 560, 560 |
| 5 | PASA | [4F] ESTÁTICA usa el renderizador real del juego (src/dd_world_renderer.js), sin arrancar el juego | http://localhost:8080/src/dd_world_renderer.js |
| 6 | PASA | [4F] ESTÁTICA transparencia: las cuatro esquinas de cada PNG son transparentes | — |
| 7 | PASA | [4F] ESTÁTICA la figura no toca los bordes del lienzo | 89-43-190-505 / 89-43-190-504 / 89-43-190-504 / 89-43-190-504 |
| 8 | PASA | [4F] ESTÁTICA pies: misma línea de suelas en los cuatro (y=504 ± 1) | 505, 504, 504, 504 |
| 9 | PASA | [4F] ESTÁTICA misma altura de figura en los cuatro (± 1 px) | 463, 462, 462, 462 |
| 10 | PASA | [4F] ANIM los fotogramas avanzan en orden y en bucle | 0 → 1 → 2 → 3 → 0 → 1 → 2 |
| 11 | PASA | [4F] ANIM cada fotograma dura 560 ms (± 40 ms) | 567, 550, 567, 566, 550 ms |
| 12 | PASA | [4F] ANIM ciclo completo de 2,24 s (± 60 ms) | 2250 ms |
| 13 | PASA | [4F] ANIM el renderizador pinta cada cuadro sin fallos | 226 cuadros pintados |
| 14 | PASA | [4F] ANIM rendimiento: tiempo medio de dibujo por cuadro < 4 ms | 0.10 ms (Chromium sin GPU) |
| 15 | PASA | [4F] ANIM pausa: el fotograma no cambia | fotograma 3 durante 900 ms |
| 16 | PASA | [4F] fotograma siguiente | 3 → 4 |
| 17 | PASA | [4F] fotograma anterior (con vuelta) | → 2 |
| 18 | PASA | [4F] teclado: flechas | → 3 |
| 19 | PASA | [4F] ANIM reanudar con Espacio | fotograma 4 |
| 20 | PASA | [4F] ANIM velocidad 2×: 280 ms por fotograma (± 30 ms) | 267, 283, 283, 284, 284 ms |
| 21 | PASA | [4F] velocidad ¼× seleccionable | — |
| 22 | PASA | [4F] ajustar a pantalla: la figura cabe entera | 805 % · figura 750 de 885 px |
| 23 | PASA | [4F] ESTÁTICA fondo transparente: el lienzo no pinta fondo | — |
| 24 | PASA | [4F] ampliar | 1006 % |
| 25 | PASA | [4F] reducir | 644 % |
| 26 | PASA | [4F] tamaño de juego: zoom 1,16 y figura de ≈109 px | 106 px de alto |
| 27 | PASA | [4F] volver a ajustar | — |
| 28 | PASA | [4F] fondos de contraste seleccionables | — |
| 29 | PASA | [4F] ESTÁTICA reflejo del motor: la figura queda espejada | centro 0.4958 → 0.5036 |
| 30 | PASA | [4F] papel cebolla activable | — |
| 31 | PASA | [4F] ESTÁTICA comparación con el sprite antiguo: se dibujan dos figuras | 46899 frente a 19857 píxeles opacos |
| 32 | PASA | [4F] balanceo del motor activable con la animación en marcha | — |
| 33 | PASA | [4F] se adapta a 1280×720 | figura 302 de 386 px |
| 34 | PASA | [4F] se adapta a 1366×768 | figura 344 de 434 px |
| 35 | PASA | [4F] se adapta a 2560×1440 | figura 1056 de 1224 px |
| 36 | PASA | [4F] sin errores de consola ni peticiones fallidas | 0 errores |
| 37 | PASA | [1F] ESTÁTICA abre por defecto el IDLE de fotograma único | assets/characters/protagonist_master/pm_idle_00.png |
| 38 | PASA | [1F] ESTÁTICA sin controles que no aplican (anterior, siguiente, papel cebolla ocultos) | — |
| 39 | PASA | [1F] ESTÁTICA usa el renderizador real del juego, sin arrancar el juego | http://localhost:8080/src/dd_world_renderer.js |
| 40 | PASA | [1F] ESTÁTICA dimensiones: lienzo 288 × 512 | — |
| 41 | PASA | [1F] ESTÁTICA transparencia: esquinas transparentes y figura sin tocar bordes | 89-43-190-504 |
| 42 | PASA | [1F] ESTÁTICA línea de suelo: suelas en y=504 y figura de 462 px, como los sprites actuales | suelas y=504, alto 462 |
| 43 | PASA | [1F] ESTÁTICA respiración del Refugio activa al abrir (±1,1 px) | — |
| 44 | PASA | [1F] ANIM respiración: oscila entre −1,1 y +1,1 px de mundo | -1.100 … 1.100 |
| 45 | PASA | [1F] ANIM respiración: ciclo de 2,24 s (± 60 ms), el del motor | 2250 ms |
| 46 | PASA | [1F] ANIM el fotograma no cambia durante el ciclo | 315 muestras, siempre pm_idle_00 |
| 47 | PASA | [1F] ANIM a tamaño de juego la cabeza sube y baja ≈2,6 px (2 × 1,1 × 1,16) | 2 px de recorrido |
| 48 | PASA | [1F] ANIM pausa: la respiración se detiene | bobY 0.192 durante 700 ms |
| 49 | PASA | [1F] ANIM velocidad 2×: ciclo de 1,12 s (± 40 ms) | 1116 ms |
| 50 | PASA | [1F] respiración de combate seleccionable (±0,55 px) | — |
| 51 | PASA | [1F] ANIM tatuajes y figura sin cambios durante el ciclo: 6 lecturas del lienzo en 2,2 s, idénticas píxel a píxel | huella 1784910543 |
| 52 | PASA | [1F] ajustar a pantalla: la figura cabe entera | 836 % |
| 53 | PASA | [1F] ESTÁTICA fondo transparente: el lienzo no pinta fondo | — |
| 54 | PASA | [1F] ESTÁTICA escala real de juego: figura de ≈106 px con zoom 1,16 | 106 px |
| 55 | PASA | [1F] ESTÁTICA reflejo del motor: la figura queda espejada | 0.4952 → 0.5043 |
| 56 | PASA | [1F] ESTÁTICA comparación con el sprite antiguo y guías de anclaje | — |
| 57 | PASA | [1F] teclado: Espacio pausa; las flechas no hacen nada con un solo fotograma | — |
| 58 | PASA | [1F] rendimiento: tiempo medio de dibujo por cuadro < 4 ms | 0.18 ms |
| 59 | PASA | [1F] sin errores de consola ni peticiones fallidas | 0 errores |
| 60 | PASA | [FID] ESTÁTICA abre el fotograma corregido, rotulado como PENDIENTE DE APROBACIÓN | assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png |
| 61 | PASA | [FID] ESTÁTICA mismo contrato que el actual: 288 × 512, suelas y=504, 462 px, esquinas transparentes | 89-43-190-504 |
| 62 | PASA | [FID] ESTÁTICA misma silueta que el actual (caja de la figura idéntica) | 89-43-190-504 |
| 63 | PASA | [FID] ESTÁTICA comparación abierta: actual · corrección anterior · nueva corrección, en ese orden | pm_idle_00 · pm_idle_fid_00_v1 · pm_idle_fid_00 |
| 64 | PASA | [FID] ESTÁTICA la corrección anterior se conserva y tiene la misma silueta (caja idéntica) | assets/characters/protagonist_master/fidelidad/versiones/pm_idle_fid_00_v1.png |
| 65 | PASA | [FID] ESTÁTICA la nueva corrección difiere de la anterior en el brazo ampliado | 11 % de píxeles distintos |
| 66 | PASA | [FID] ESTÁTICA panel con la lámina (PERFIL D. y detalle de tatuajes) y los tres brazos ampliados | 83 %, 84 %, 84 %, 100 % |
| 67 | PASA | [FID] ESTÁTICA los brazos ampliados de actual y corregido difieren (hay corrección que ver) | 15 % de píxeles distintos |
| 68 | PASA | [FID] ESTÁTICA ajustar a pantalla: las tres figuras caben | 550 % |
| 69 | PASA | [FID] ANIM respiración del motor en marcha sobre las tres figuras | 1.00 → -0.29 |
| 70 | PASA | [FID] ESTÁTICA con el sprite antiguo: antiguo · actual · corrección anterior · nueva | player_idle_00 · pm_idle_00 · pm_idle_fid_00_v1 · pm_idle_fid_00 |
| 71 | PASA | [FID] los botones de comparación y de lámina se apagan | — |
| 72 | PASA | [FID] ESTÁTICA escala real de juego: figura de ≈106 px | 104 px |
| 73 | PASA | [FID] sin errores de consola ni peticiones fallidas | 0 errores |
| 74 | PASA | [FID] desde el fotograma actual: comparación apagada al abrir y disponible | pm_idle_00 · pm_idle_fid_00_v1 · pm_idle_fid_00 |
| 75 | PASA | [4F] mensaje claro si falta un fotograma | NO SE PUDO CARGAR LA MUESTRAFalta assets/characters/protagonist_master/IDLE_4F_E… |
| 76 | PASA | [4F] el juego original arranca y sigue usando el sprite antiguo | 0 errores · assets/characters/player_idle_00.png |
