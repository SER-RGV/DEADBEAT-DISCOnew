# FASE 08C2.2 · Validación de continuidad espacial

**Decisión: BLOQUEADA POR CONTINUIDAD VISUAL.** No hay evidencia suficiente para afirmar que BG04, BG05 y BG06 representen el mismo club sin cambios de diseño. El modelo es una hipótesis técnica común, no una reconstrucción demostrada. No se aprueba ningún fondo como definitivo. Aprobación artística pendiente.

## Alcance y fuentes

Se parte de 08C2.1 sin recalibrar BG04: `assets/cinematics/spatial_08c2/plan.json`, sus cinco SVG y `calibration_bg04.json` permanecen intactos, así como el archivo de 08C2. Las imágenes comparadas, sin editar, son BG04 `assets/cinematics/backgrounds/definitive/scene_04_main_hall/master.png` y BG05/BG06 `assets/cinematics/backgrounds/continuity_08c1/scene_05_dancefloor.png` y `scene_06_hero.png`; no son los masters 08C de esas dos escenas. La [galería independiente](FASE_08C22_GALERIA_CONTINUIDAD.html) muestra cada referencia, sus proyecciones, overlay ajustable, planta, alzados y matriz completa. Funciona localmente, sin servicios; sin JavaScript mantiene la comparación al 50 %.

## Matriz y evidencias

La matriz detallada está en la galería y en `assets/cinematics/spatial_08c22/matrix.json`, con localización, visibilidad por imagen, identificación, estado, confianza y falta de información. Resumen: suelo **contradicción** (confianza media); escenario, escalera, cabina, altavoces, galería posterior, público e iluminación **dudosos**; columnas, balcones y bóvedas **probables** a confianza media-baja. Ningún elemento se declara confirmado como idéntico en las tres imágenes. Esto no afirma que elementos no visibles hayan desaparecido físicamente.

En BG04 la pista queda parcialmente oculta por gente y barandilla frontal; se aprecia una composición longitudinal. BG05 y BG06 muestran un círculo grande en primer plano. No se puede demostrar que el círculo nunca exista en la zona oculta de BG04, pero la superficie visible y la composición representada difieren sustancialmente: cambiar cámara no modifica el dibujo del suelo. El círculo no es una plataforma funcional ni un descenso; la reserva del modelo no define mecanismo alguno.

El escenario de BG04 es asimétrico y distante; los otros son frontales y centrados. En BG05 se observa una figura tras la cabina y público a ambos lados de la pista, mientras BG06 presenta pista vacía y una cabina sin figura claramente identificable. Puede haber transcurso temporal: no se afirma contradicción física inevitable del público ni se inventa continuidad temporal. Pared posterior, motivo, escaleras, stacks, disposición del techo y lámparas presentan diferencias que requieren correspondencias adicionales. La barandilla posterior de BG04 podría quedar detrás o fuera de cuadro en BG05/06; no se exige verla. Las líneas del modelo no tienen oclusión y no demuestran qué se ve realmente.

## Cámaras y prueba de hipótesis

BG04 conserva posición (49.13, 8.89, 27.41), objetivo (34.34, 80, 22.7), FOV horizontal 116.73°. Es una vista elevada y oblicua, ajustada previamente a marcas subjetivas; sus residuales y límites constan en el informe 08C2.1. BG05 y BG06 son vistas frontales más bajas: cámaras vigentes respectivamente (50,19,8) → (50,82,17), 100°, y (50,31,6) → (50,84,14), 90°. Frente a BG05/06, la proyección vigente deja escenario/escalera y motivo en otras posiciones y tamaños; las diferencias de perspectiva pueden explicar parte del encuadre, no la sustitución del dibujo del suelo ni la identificación de arquitectura.

Se ensayaron **solo cámaras**, con geometría idéntica (595 segmentos) y sin modificar el plan. `tools/compare_cinematic_08c22.py` reproduce las hipótesis y las guarda en carpeta nueva. Usa cuatro marcas manuales por imagen (extremos supuestos del escenario, pie supuesto de escalera y centro supuesto del motivo), simetría forzada x=50, objetivo y=82 y límites explícitos en `anchors.json`; minimiza suma de errores cuadrados en coordenadas normalizadas con búsqueda aleatoria determinista y refinamiento local. No son correspondencias verificadas y el coste es in-sample, no una prueba independiente. La comparación es orientativa y no recupera dimensiones físicas. Sin optimización global garantizada.

| Cámara | Hipótesis posición → objetivo, FOV horizontal | Coste vigente → hipótesis |
|---|---|---|
| BG05 | (50,18.33,4) → (50,82,15.51), 120° | 0.026053 → 0.000548 |
| BG06 | (50,27.94,10.04) → (50,82,13.34), 120° | 0.053215 → 0.000091 |

Ambos FOV alcanzan el límite de búsqueda; BG05 alcanza también la altura mínima. Es señal de ajuste condicionado, no evidencia de cámara real. La caja orientativa de protagonista de BG06 cabe matemáticamente en el candidato; no prueba encaje del sprite oficial, tamaño artístico, oclusiones ni visibilidad real. No se usó un sprite ni se cambió su diseño. El coste favorece cuatro puntos seleccionados, no bóvedas, círculo, público, galería o iluminación. La geometría se mantiene sin cambios: no existe evidencia para alterarla de forma confiable. Las variantes no sustituyen ni aprueban las cámaras vigentes.

Los SVG transparentes eliminan solo el fondo sólido del wireframe y se superponen como herramienta de revisión, no son capas de producción. Imagen y proyección se muestran completas, con escala proporcional y sin deformación; sus proporciones 1376×768 y 960×540 difieren ligeramente, por lo que no hay registro píxel a píxel. La proyección es esquemática y contiene líneas sin oclusión.

## Verificación y limitaciones

- QA automatizado `python3 tools/qa/test_cinematic_08c22.py`: comprueba datos, integridad de fuentes y versión anterior, generación reproducible en directorio temporal, referencia común y enlaces locales. No valida canon, perspectiva artística ni correspondencias reales.
- QA de navegador `node tools/qa/test_cinematic_08c22_gallery.mjs`: carga y decodifica recursos locales, ejercita controles, comprueba también carga sin JS y galería previa. No sustituye revisión humana.
- Revisión visual del agente: examinadas referencias y wireframes; los hallazgos anteriores son juicios provisionales. **Validación artística humana pendiente**. No se dispone de geometría medida, cámaras originales, capas separadas o secuencia temporal; no pueden verificarse oclusiones físicas, continuidad exacta ni dimensiones reales.
- No se han cambiado imágenes, motor, manifiesto, sprites, calibración anterior ni producción. No se ha generado arte ni integrado fondos.

## Próximo paso

Revisión de dirección artística: decidir si BG04 manda y rediseñar/conseguir referencias compatibles para BG05/06, o aportar planta y correspondencias independientes que expliquen la discrepancia. Solo después validar visualmente las vistas y considerar cambios de geometría o fondos; conservar este bloqueo hasta entonces.

### Resultados ejecutados

QA Python: OK, hashes de modelo/planta/alzados y tres referencias, once filas de matriz y variantes regeneradas idénticas en directorio temporal. QA Chromium headless: 16 imágenes decodificadas con JS y 16 sin JS; control de opacidad y selector de cámara operativos; galería anterior con 10 imágenes; cero errores de página, red o HTTP. Estas comprobaciones solo acreditan comportamiento técnico en ese entorno. `git diff --check`: sin errores de formato.
