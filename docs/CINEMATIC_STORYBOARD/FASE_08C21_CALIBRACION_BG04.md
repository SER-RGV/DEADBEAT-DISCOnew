# Fase 08C.2.1 — Calibración del plano maestro frente a BG04

**Resultado: calibración parcial, no fotogramétrica ni aprobada.** El modelo existente se ha revisado para aproximarse a la referencia; no reconstruye exactamente su perspectiva. La [galería actualizada](FASE_08C2_GALERIA_PLANO.html) muestra BG04 con marcas superpuestas y, por separado, el original sin deformar junto a la proyección. BG04 no se ha alterado: SHA-256 `9c1c9358acaca94abea7c7eb20c6e505e2605a884f8d18a99e8d3383ec74bba3`.

El plano vigente está en `assets/cinematics/spatial_08c2/plan.json`. La versión previa y sus cinco SVG se conservan en `assets/cinematics/spatial_08c2/archive_08c2/`; el informe 08C.2 se ha señalado como histórico. Las unidades de los tres ejes siguen siendo proporciones 0–100, **no medidas del juego**. La franja, las cotas, el recuento de módulos, el público y la cámara son hipótesis de trabajo.

## Elementos de BG04 identificados

La galería dibuja marcas numeradas en una capa de interfaz, no sobre los píxeles del PNG. Coordenadas aproximadas sobre la imagen de 1376×768; no son coordenadas 3D. La marca 6 indica expresamente una inferencia.

| Nº | Elemento y evidencia visible | Qué no se puede verificar solo con la imagen | Confianza de la lectura |
|---|---|---|---|
| 1 | Área de baile debajo y delante del escenario, parcialmente tapada por barandilla y público. | Contorno completo y dimensiones físicas. | Media para su existencia; baja para límites. |
| 2 | Banda longitudinal decorativa en el suelo, con subdivisiones y motivos curvos. | Trazado exacto de motivos bajo oclusiones, si se repiten o cómo empalman. | Media. |
| 3 | Tarima elevada en cabecera, con frente ancho. | Profundidad y cota exacta. | Media. |
| 4 | Escalera centrada delante del escenario. | Recuento exacto de peldaños y huellas, por escala y luz. | Media para posición; baja para número. |
| 5 | Torres de altavoces a ambos lados del motivo central del escenario. | Posiciones de profundidad, separación y tamaño reales. | Media. |
| 6 | Posible zona de cabina en el centro del escenario. | No se distingue una cabina ni se identifica visualmente a Tempo: su ubicación es inferida. | Baja. |
| 7 | Galerías y barandillas laterales, además de barandilla cercana en primer plano. | Altura física, ancho y planta de las galerías. | Alta para existencia; baja para cotas. |
| 8 | Columnas y crujías repetidas a ambos lados. | Número completo y separación constante. | Media. |
| 9 | Siluetas de público en la pista. | Número, poses, distribución completa y posiciones exactas. | Media. |
| 10 | Bóvedas de nervios apuntados. | Altura, sección exacta y posición real de los arcos ocultos. | Alta para existencia; baja para altura. |
| 11 | Luminarias colgantes, una cercana y otra al fondo. | Tamaños físicos y anclajes. | Media. |
| 12 | Arreglos de altavoces colgados izquierda/derecha; aparecen más unidades en profundidad. | Su distancia 3D y orientación exactas. | Alta para existencia; baja para coordenadas. |
| 13 | Esquina visible de la barandilla delantera. | Planta real, altura del observador y forma completa del balcón. | Media-baja. |

## Correcciones del plano proporcional

| Aspecto | Antes 08C.2 | Revisión | Confianza y decisión pendiente |
|---|---|---|---|
| Suelo | Gran círculo concéntrico fijo. | Se retira; pista x=22–78/y=20–70 con franja x=40–60, subdivisiones y tres pequeños medallones **hipotéticos**. | Media en dirección longitudinal, baja en ornamentación y límites. Diseñar el motivo real a partir de BG04 antes de producción. |
| Escenario | x=26–74, y=76–91, z=5. | x=30–70, y=76–91, z=4; cabina hipotética x=45–55, y=83–86, z=4–8. | Media-baja para anchura relativa; baja para profundidad, altura y cabina. Aprobar después de modelado/arte. |
| Escalera | Centrada x=43–57, y=66–76, cinco peldaños hasta z=5. | Misma posición general y cinco peldaños **estimados**, altura hasta z=4. | Media para centralidad, baja para recuento y dimensiones; revisar con arte. |
| Altavoces de escenario | x=28–33 y 67–72, y=80–85, z=5–21. | x=31–35 y 65–69, y=80–85, z=4–19; separación entre centros 34. | Media-baja para simetría, baja para distancias y altura. |
| Altavoces suspendidos | No modelados. | Dos volúmenes aproximados: izq. x=22–26/y=32–38 y der. x=68–72/y=32–38, ambos z=29–41. | Media para existencia, baja para coordenadas; BG04 muestra más que estos dos. Necesitan calibración adicional. |
| Nave / balcones / columnas | Nave x=10–90/y=5–95, balcones z=22, columnas hasta z=38, clave z=60. | Se conservan como hipótesis, no porque estén verificadas. La barandilla cercana ahora tiene un quiebro en planta (20,18)–(50,12)–(80,18), z=25. | Baja para proporciones, cotas y barandilla; la imagen solo prueba relaciones visuales. Aprobar geometría y soporte. |
| Público | Doce marcas fijas laterales, altura 4,5. | Conservadas como muestra compartida para las cámaras, no como trazado real de BG04. | Baja: la referencia tiene más siluetas y ocupa el centro. Definir coreografía y oclusiones. |
| Lámparas / bóvedas | Dos posiciones de lámparas y perfil simétrico esquemático. | Se mantienen como estimaciones. | Baja para medidas, media para existencia; falta contraste de crujías y escala. |
| Descenso futuro | Reserva en x=44–56/y=50–60. | Conservada como espacio de estudio, sin agujero ni plataforma. | Baja: no se ve en BG04; sujeto a decisión arquitectónica posterior. |

Los dos conjuntos de altavoces suspendidos se añadieron a la misma geometría que se proyecta para las tres cámaras. Las líneas son alambre sin superficies ni oclusión: ver un elemento detrás de otro en el esquema no demuestra que sea visible en la escena real.

## Cámara BG04 y ajuste reproducible

Anterior: posición `(50,6,30)`, objetivo `(50,78,23)`, FOV horizontal `110°`. Propuesta calibrada: **posición `(49,13; 8,89; 27,41)`**, objetivo `(34,34; 80; 22,70)` y FOV horizontal **116,73°**, en la convención del plano. El desplazamiento angular busca que el escenario aparezca a la derecha del centro, como en la imagen. El FOV amplio y la posición de cámara no son mediciones físicas: se acercan a una solución posible y requieren revisión; `y=8,89` está cerca del límite superior de búsqueda `9`.

`assets/cinematics/spatial_08c2/calibration_bg04.json` registra **ocho marcas 2D elegidas manualmente**, sus puntos 3D supuestos, pesos y límites. `python3 tools/calibrate_cinematic_bg04.py` ejecuta una búsqueda determinista por puntos y refinamiento, sin dependencias de optimización externas. Se ajustan esquinas aproximadas de escenario, pie de escalera, motivo del fondo, quiebro de barandilla, dirección de fuga estimada y dos altavoces suspendidos. El punto de fuga se aproxima alrededor de `(850,420)` píxeles, con incertidumbre alta: los arcos y la imagen ilustrada no garantizan una única perspectiva.

Para las seis marcas que también existían en la hipótesis anterior, la suma ponderada de errores cuadrados en coordenadas normalizadas pasa de **0,096213 a 0,020752**; con las ocho marcas nuevas la suma es **0,029601**. Son costes de ajuste a marcas subjetivas, no porcentaje de exactitud ni validación independiente. Los errores conservan signo: modelo menos marca, referidos al ancho/alto de la imagen.

| Marca | Desfase horizontal | Desfase vertical | Lectura |
|---|---:|---:|---|
| Escenario, borde izquierdo | −7,14 % | +1,38 % | El modelo sigue más a la izquierda. |
| Escenario, borde derecho | −4,14 % | +1,53 % | Ancho y pendiente no coinciden exactamente. |
| Pie de escalera | −5,07 % | +3,82 % | Todavía desplazado y más bajo. |
| Motivo del escenario | −6,33 % | −6,02 % | Centro y escala no casan. |
| Esquina de barandilla | −0,61 % | −0,56 % | Coincide aproximadamente con una marca, no con la forma completa. |
| Fuga longitudinal estimada | −5,35 % | −8,26 % | Diferencia significativa; marca y modelo de lente son inciertos. |
| Altavoz suspendido izquierdo | +7,61 % | +3,19 % | El volumen esquemático sigue demasiado a la derecha. |
| Altavoz suspendido derecho | +4,16 % | −1,78 % | Sigue desplazado; falta ajustar profundidad/forma. |

Los porcentajes no prueban correspondencia de líneas o detalles entre puntos. Es posible reducir el error de unas marcas empeorando las otras; no se han forzado perspectiva, proporciones ni fondo para ocultar discrepancias. No debe usarse este ajuste como certificación de arquitectura exacta.

## BG05 y BG06 después de la revisión

Las dos proyecciones se regeneraron con **el mismo modelo revisado**; las cámaras anteriores se conservan porque sus encuadres esquemáticos muestran pista y escenario, y la caja de prueba de personaje de BG06 sigue dentro del marco. BG05: `(50,19,8)` → `(50,82,17)`, FOV 100°. BG06: `(50,31,6)` → `(50,84,14)`, FOV 90°. Sus coordenadas son propuestas, no cámaras del juego. La reserva 2D del logo y la caja de personaje son guías; no se ha insertado el sprite ni el logo oficial.

La geometría fija de escenario, escaleras, torres y marcadores de público es idéntica en las tres proyecciones; pueden quedar fuera del encuadre o ser ocultados en una futura representación con superficies. **Los fondos existentes no están alineados al modelo:** BG05/BG06 siguen mostrando un gran círculo que contradice el suelo longitudinal de BG04; difieren cantidad/disposición del público, detalles de la cabina, escalera y altavoces. En el alambre BG06 la caja de personaje coincide visualmente con líneas de escalera; no demuestra legibilidad ni oclusión correcta del sprite. Corregir los fondos o ajustar la cámara se deja para una fase de producción, tras aprobación, no cambiando los elementos por plano.

## Decisiones pendientes y verificaciones

1. Aprobar una planta real de referencia para suelo, escenario, cabina de Tempo y altavoces, y contrastar proporciones y enfoque con dirección de arte. El actual es un compromiso con residuales visibles.
2. Determinar número y posiciones de crujías, arreglos suspendidos, luminarias, público y altura de balcones. Confirmar la relación con el acceso y con la zona reservada al descenso.
3. Probar BG05/BG06 con superficies, oclusiones y sprite/logo oficiales; producir fondos y capas auténticas solo después de aprobación. No se han generado nuevos fondos, capas ficticias ni sprites.
4. Los tests comprueban datos, proyección compartida, SHA de BG04, reproducción del ajuste y carga de galería; no acreditan canon, coincidencia fotográfica, rendimiento ni integración. El manifiesto de producción, controlador, HUB e imágenes previas permanecen intactos; PR #17 sigue abierto.
