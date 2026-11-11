# FASE 08C2.3 · Resolución de continuidad artística del club

**Resultado: RECOMENDACIÓN C — revisión conjunta, pendiente de aprobación humana.** Es una dirección conceptual, no una resolución ejecutada ni una aprobación de arte. La continuidad visual continúa bloqueada hasta que se elija una alternativa y se produzcan y revisen vistas compatibles. No generar ni integrar fondos definitivos antes de esa aprobación.

[Galería independiente y diagramas](FASE_08C23_ALTERNATIVAS.html) · [Matriz de evidencia 08C2.2](FASE_08C22_GALERIA_CONTINUIDAD.html) · [Informe 08C2.2](FASE_08C22_VALIDACION_CONTINUIDAD.md)

## 1. Estado inicial y auditoría

Antes de editar: rama `arena/826fce00-deadbeat-disconew`, árbol limpio, HEAD `7a1294c`; PR #17 abierto y en borrador. Se revisaron informes y galerías 08C, 08C1, 08C2, 08C2.1 y 08C2.2, el manifiesto y la correspondencia de diez planos, los seis originales y los seis maestros 08C, además de las cinco variantes 08C1. Los nombres de carpetas `final` y `definitive` no significan aprobación artística.

**Clasificación:** los seis `assets/cinematics/backgrounds/final/cine_bg*/cine_bg*.png` sin sufijo `_master` son originales de referencia históricos; en esas carpetas también hay rebuilds y capas históricas. Los seis `assets/cinematics/backgrounds/definitive/scene_*/master.png` son propuestas 08C planas, no definitivas; las cinco imágenes `assets/cinematics/backgrounds/continuity_08c1/scene_*.png` son variantes 08C1 provisionales. Para el diagnóstico actual se compara BG04 08C con BG05 y BG06 08C1, no con sus masters 08C. `spatial_08c2/plan.json` y SVG son modelo proporcional y proyecciones esquemáticas 08C2.1, no arte ni arquitectura medida; `archive_08c2/` conserva la versión original. `spatial_08c22/comparison.json` y SVG son hipótesis experimentales, no cámaras originales ni decisiones de arte. Los informes y galerías son documentación, no recursos de producción. La galería de esta fase enlaza las versiones específicas.

Las cámaras del archivo 08C2 eran BG04 (50,6,30) → (50,78,23), FOV 110°; BG05 (50,19,8) → (50,82,17), 100°; BG06 (50,31,6) → (50,84,14), 90°. En 08C2.1 BG04 se ajustó a (49.13,8.89,27.41) → (34.34,80,22.7), 116.73°; las otras se conservaron. Las hipótesis 08C2.2 llevan BG05 y BG06 a 120° de FOV, límite de búsqueda, y ajustan cuatro marcas interpretativas: disminuyen el error de esas marcas pero no demuestran el espacio, ni cambian el motivo del suelo. Ninguna cámara es medición de cámara real.

## 2. Diagnóstico visual: evidencia frente a interpretación

| Aspecto | BG04 · propuesta 08C | BG05 · variante 08C1 | BG06 · variante 08C1 | Lectura y cautela |
|---|---|---|---|---|
| Encuadre y profundidad | Vista elevada oblicua detrás de barandilla; escena al fondo, algo a la derecha. | Vista baja frontal simétrica, tarima centrada y suelo en primer término. | Vista baja frontal, tarima centrada, sin multitud de pista. | Distintas posiciones podrían explicar parte de tamaños y fugas; no hay correspondencias suficientes para reconstruirlas. |
| Superficie | Banda alargada de trazos curvos y geométricos, parcialmente tapada por público y barandilla. | Gran motivo de anillos y líneas curvas en el suelo, delante del escenario. | Motivo de anillos muy semejante en primer plano. | Hay diferencia de **representación visible**. No se conoce extensión real del dibujo BG04 bajo oclusión ni la función del círculo; no se deduce que sea pista, plataforma, mecanismo o apertura. |
| Escenario y escaleras | Tarima lejana elevada y escalera frontal; motivo angular cian. | Escalera y tarima centradas, motivo angular y figura tras cabina. | Escalera más pronunciada, tarima y motivo angular; rectángulo bajo ambiguo. | El parentesco visual es claro; proporciones y ubicación física no están verificadas. Cabina de BG04 no se identifica con seguridad. |
| Sonido y arquitectura | Stacks junto al escenario, arreglos suspendidos, balcones, columnas, bóvedas y baranda próxima. | Torres en extremos y escenario, arreglos altos, columnas y balcones; lámpara frontal. | Torres frontales y escenario, columnas y balcones; lámpara central y arreglos suspendidos no identificables. | Tipologías relacionadas; cantidad, fijaciones y correspondencia de crujías no demostradas. Ausencia en encuadre no es ausencia física. |
| Público / circulación | Siluetas en área central inferior, parcialmente ocultas; escala lejana. | Grupos laterales delimitan visualmente una franja central. | Pista representada vacía; siluetas en balcones. | Distribución cambia; momento, trayectorias y oclusiones son desconocidos. Espacio libre no prueba que haya una ruta funcional. |
| Materiales, luz, ornamento | Superficies oscuras, arcos y cortinas, dorados cálidos y haces cian/magenta. | Lenguaje similar; dorado en suelo y lámpara; focos cian/magenta. | Fábrica pétrea marcada, bandas cian/violeta y motivo luminoso; menos luz cálida. | Paleta común, pero detalle y dominancia medieval varían. Luces pueden cambiar con el tiempo; no está probado que sea el mismo montaje. |

### 3. Contradicciones confirmadas

En las **imágenes visibles**, BG04 enfatiza un trazado longitudinal; BG05/BG06 muestran un motivo circular grande. BG05 muestra figura tras la cabina y público de suelo; BG06 no los muestra en esa zona. Son diferencias comprobables de representación, no prueba de imposibilidad física absoluta: la oclusión, encuadre y el tiempo no están resueltos. El modelo esquemático longitudinal y las imágenes circulares tampoco representan el mismo diseño de suelo. En los masters 08C anteriores, el zorro generado de BG05 y el rosetón con calaveras de BG06 difieren del motivo angular; las variantes 08C1 los sustituyen, no corrigen todas las demás discrepancias.

### 4. Contradicciones probables

Diferencias de ancho/altura de escenario, escalera, profundidad, proporciones y composición de torres, cabina y crujías pueden implicar arquitectura incompatible, pero una imagen estilizada y cámaras no calibradas impiden probarlo. Los cambios de público e iluminación podrían ser temporales; no inventar un acontecimiento para explicarlos. Las fachadas y corredores 08C1 presentan aún un carácter catedralicio y una conexión con la nave no demostrada.

### 5. Imposible de determinar

Contorno completo y función del círculo, existencia de un círculo oculto en BG04, cotas reales, profundidad del escenario, planta detrás de cámara, identificación de cabina en BG04, posiciones exactas de DJ/público, anclajes de luces, continuidad temporal, conexión al Refugio y oclusiones físicas. Los PNG son composiciones planas sin capas auténticas; wireframes sin superficies no prueban visibilidad. No hay base para añadir descenso o plataforma. No se han ensayado sprites en estos fondos.

## 6. Tres alternativas conceptuales

En las tres: preservar arquitectura de club monumental gótico-industrial con art déco, metal/hormigón/cristal y acentos dorados envejecidos; neón magenta, cian y violeta; profundidad y actividad legible. Favorecer estructura, rigging, altavoces y materialidad industrial sobre imaginería eclesiástica. No introducir gárgolas, estatuas, calaveras, rosetones gratuitos, cabezas o símbolos no oficiales; usar únicamente el logo oficial donde corresponda. No inventar narración. Los diagramas son propuestas sin escala ni medidas, no geometría existente.

### A · BG04 como referencia — intervención media-alta

**Conservar:** lectura longitudinal, vista elevada y barandilla, escenario lejano, profundidad, grupos de público, altavoces suspendidos y acentos de luz de BG04. **Cambiar en una futura producción:** reinterpretar BG05/BG06 con el mismo trazado longitudinal, escenario/escalera, módulos de sonido y arquitectura desde cámaras bajas; mantener zona central legible. Círculo grande se retiraría o sustituiría por motivos subordinados compatibles, sin asumir su función actual. **Conflicto:** se pierde el motivo distintivo de BG05/06 y su encuadre simétrico puede necesitar ajuste. **Ventajas:** preserva la referencia calibrada y su escala de nave; menor revisión de BG04. **Riesgos:** BG04 es también provisional y parcialmente ocluido; su lectura no acredita las partes ocultas ni resuelve carácter catedralicio. Necesita diseñar detalles no observables y probar cámara y personaje; bajo impacto conceptual en modelo actual, sin aprobarlo.

### B · BG05/BG06 como referencia — intervención media-alta

**Conservar:** motivo circular visible como gráfica de superficie, cámaras frontales, zona central y motivo de escenario de variantes 08C1. **Cambiar:** reinterpretar BG04 para que la vista alta revele el mismo motivo, además de armonizar escenario, escalera, ubicación de torres, balcones y circulación; coordinar BG05 y BG06 entre sí. **Conflicto:** modifica el ancla visual y la calibración orientada a la banda longitudinal; no basta con atribuir la discrepancia a perspectiva. **Ventajas:** conserva continuidad gráfica más fuerte entre dos vistas y composición frontal. **Riesgos:** sacrificar composición previa de BG04 y reestudiar planta/cámara; el círculo no implica ninguna función mecánica. El conjunto sigue demasiado eclesiástico si no se revisan materiales y ornamentos.

### C · Revisión conjunta — intervención alta

**Conservar:** escala y barandilla de BG04 como intención, legibilidad frontal de BG05/06, escenario angular, escalera frontal, familias de sonido, columnas/balcones y luz de club; preservar los archivos originales. **Cambiar:** diseñar una planta común nueva y tres vistas a partir de una única disposición de escenario, escalera, altavoces, circulación y público; combinar eje longitudinal con un **motivo central de superficie a decidir** (en el esquema se muestra un disco reducido como ejemplo opcional, no como elemento existente ni aprobado). Alinear las vistas y reducir ornamentación medieval hacia industria/art déco. **Conflicto:** ninguna imagen conserva íntegro su diseño actual; la hipótesis combinada no queda probada por las referencias. **Ventajas:** resuelve de raíz trazado, conexiones y lenguaje material en vez de imponer una imagen incompleta; protege la legibilidad cinematográfica. **Riesgos:** mayor trabajo y revisión de las tres vistas; podría diluir la fuerza de BG04 o el círculo, y requiere nuevos conceptos y aprobación de cada cambio. No cambiar el modelo 08C2.1 en esta fase; cualquier nueva planta sería posterior y versionada.

## 7. Consecuencias sobre los diez planos

Impactos conceptuales futuros, no cambios ya realizados; los planos 01–03 se consideran de modo visual, sin contar que el protagonista llegue de fuera. La relación señal/HUB debe respetar el canon y la implementación real, no inventar recorrido o descenso.

| Plano | A · referencia BG04 | B · referencia BG05/06 | C · revisión conjunta |
|---|---|---|---|
| 01 Ciudad | Mantener composición; revisar vocabulario industrial respecto a BG04. | Mantener composición; reflejar lenguaje material de B sin introducir círculo narrativo. | Revisar lenguaje urbano si el nuevo club lo requiere; no implica cambiar evento. |
| 02 Fachada | Ajustar lectura industrial/portal para anticipar nave longitudinal. | Revisar enlace visual al interior circular, sin prometer correspondencia geométrica. | Coordinar fachada con nueva arquitectura; evitar rosetón y símbolos ajenos. |
| 03 Umbral | Conectar corredor con eje de BG04; mantener profundidad. | Comprobar transición al recinto de B sin forzar que el círculo se vea. | Determinar transición común de ancho y materiales hacia la nave. |
| 04 Caminando | Mantener espacio y suelo de apoyo para walk oficial; asegurar dirección del eje. | Misma prueba de apoyo; conectar orientación con B. | Reservar banda de movimiento y dirección coherente desde el corredor. |
| 05 Corredor / señal Refugio | Resolver ubicación legible de señal y conexión al eje; no desplazar HUB por hipótesis. | Igual, vinculando corredor con composición B. | Definir zona de señal coherente con acceso; no inventar ruta al HUB. |
| 06 Entrada a nave / BG04 | Conservar encuadre elevado y revisar lectura espacial. | Reinterpretar vista elevada para mostrar el motivo común; revalidar cámara. | Rediseñar parcialmente vista alta junto con vistas bajas. El guion implementado no dibuja protagonista aquí. |
| 07 Pista / acontecimiento sonoro | Reinterpretar BG05 con dibujo longitudinal y circulación clara. | Conservar motivo circular, coordinar escenario y grupos con BG06. | Reconstruir vista desde planta común; reservar público y lectura del acontecimiento sin inventar audio. |
| 08 Reacción | Reinterpretar BG06, reservar suelo y contraste para sprite existente. | Mantener encuadre frontal, comprobar escala y consistencia de suelo. | Componer desde planta común, con reserva y oclusión auténtica a definir. No inventar pose de apuntado. |
| 09 Logo oficial | Reservar área superior y protagonista, sin confundir motivo de escenario con logo. | Evitar que motivo y logo compitan; mismo requisito de sprite. | Diseñar espacio negativo desde el inicio; solo logo oficial. |
| 10 Señal Refugio / HUB | Comprobar señal y enlace de composición con HUB real; no dibujar descenso. | Igual, asegurando que círculo no se interprete como plataforma. | Coordinar señal, encuadre y fundido con HUB real; no diseñar mecánica. |

En las tres, la reserva de espacio hace **posible estudiar** la colocación con los sprites oficiales existentes, pero no certifica legibilidad, anclaje de pies, escala, orientación ni oclusión. `player_idle_00` y `player_walk_03` tienen alfa defectuoso; `walk_02` difiere en vestuario; derivados grounded no reparan el alfa. El plano 08 actual usa espera, no apuntado validado, y el plano 10 funde al HUB real sin descenso físico. No suplir esas carencias inventando poses ni usar fogonazo como apuntado. Las pruebas futuras deben usar exclusivamente recursos oficiales y el logo oficial, con revisión visual humana, sin prometer poses inexistentes.

## 8. Coste y riesgos comparados

| Criterio | A | B | C |
|---|---|---|---|
| Intervención conceptual | Media-alta: BG05/06 y enlaces. | Media-alta: BG04 y compatibilidad 05/06. | Alta: tres vistas y conexiones. |
| Modelo/cámaras futuras | Revisar vistas bajas; modelo previo como hipótesis, no garantía. | Replantear suelo y recalibrar vista alta en versión nueva tras aprobación. | Nuevo diseño común versionado y tres cámaras coherentes tras aprobación. |
| Valor preservado | Profundidad y composición de BG04. | Identidad gráfica y encuadres BG05/06. | Intenciones útiles de las tres, no sus píxeles. |
| Riesgo dominante | Heredar incertidumbre y estilo catedralicio de BG04. | Cambiar ancla y perder fuerza de vista elevada. | Mayor coste, riesgo de diseño nuevo sin criterios acordados. |

No se cuantifican horas: faltan especificaciones, capas reales, resolución final y aprobación. Para cualquier opción se necesitarían planificación de capas auténticas, zonas ocultas, overscan, prueba de sprites/logo y producción nativa suficiente; no escalar 1376×768 para simular 2560×1440. No se ha validado movimiento, GPU, audio ni composición de producción.

## 9–10. Recomendación y decisión pendiente

**Recomiendo C** porque ninguna vista acredita por sí sola la planta completa y las tres necesitan coordinación de escenario, sonido, arquitectura y legibilidad. C permite preservar la fuerza de la vista alta y la claridad de las bajas sin presentar como hecho que el círculo o la banda sean la solución correcta. Es la opción más costosa y depende de aceptar una intervención en BG04; si se prioriza preservar ese encuadre, A es la alternativa de menor ruptura con el ancla anterior. B es viable si se prefiere explícitamente conservar el motivo circular.

**Decisión humana pendiente:** elegir A, B o C, o rechazar las tres; definir el tratamiento de suelo, el grado de preservación de BG04, el escenario común y el balance gótico/industrial. Tras aprobación expresa únicamente, plantear una nueva planta versionada, comprobar tres cámaras y relaciones con los diez planos, y preparar pruebas con sprites y logo oficiales antes de proponer producción. Ninguna alternativa, imagen o recurso se aprueba automáticamente en este informe.

## Comprobaciones de esta fase

- Chromium headless en servidor local: 20 imágenes decodificadas, tres SVG conceptuales y seis filas comparativas; cero errores HTTP, de red o de página, tanto con JavaScript como sin él. Comprobación adicional: todos los enlaces y recursos son locales y existen. Captura de la galería revisada visualmente. No se necesita servicio externo para abrirla.
- QA no destructivo 08C2.2: comprobación satisfactoria de hashes de modelo, planta, alzados y tres referencias, matriz y reproducción de variantes en directorio temporal.
- `git diff --name-only` antes de añadir los entregables no mostró modificaciones de ningún archivo rastreado: originales, propuestas, modelo/cámaras y archivos de producción permanecen idénticos al commit inicial. `git diff --check` sin incidencias. Las pruebas de carga no equivalen a aprobación visual de la propuesta ni a una prueba en juego.
