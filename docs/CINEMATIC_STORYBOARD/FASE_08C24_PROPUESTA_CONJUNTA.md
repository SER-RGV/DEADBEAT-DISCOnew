# Fase 08C2.4 · Desarrollo visual de la propuesta conjunta

**Propuesta C en revisión humana; NO aprobada.** Se presenta una dirección conceptual para tres vistas del mismo club, no fondos finales ni modificación del modelo vigente. La continuidad de los recursos anteriores sigue sin validación. [Abrir galería local](FASE_08C24_GALERIA_PROPUESTA.html) · [Alternativas 08C2.3](FASE_08C23_ALTERNATIVAS.html).

## Auditoría de partida

Antes de editar: rama `arena/826fce00-deadbeat-disconew`, HEAD `ed3b8c3`, árbol limpio y PR #17 abierto/borrador. Se revisaron informe y galería 08C2.3, originales históricos BG04–BG06 en `assets/cinematics/backgrounds/final/cine_bg*/cine_bg*.png`, maestros propuestos 08C en `definitive/scene_*/master.png`, variantes 08C1 en `continuity_08c1/`, modelo `spatial_08c2/plan.json`, calibración `calibration_bg04.json`, modelo archivado 08C2 y hipótesis `spatial_08c22/comparison.json`. También se comprobó la asignación de los diez planos en `assets/cinematics/manifest.json` y los límites de implementación documentados. La galería etiqueta cada familia; `final` y `definitive` no implican aprobación.

El original histórico BG04 presenta suelo con motivo circular y vista lateral; los originales BG05/06 también muestran círculos, con escenarios distintos y ornamentos ajenos a la dirección actual. En la comparación más reciente, BG04 08C muestra banda longitudinal parcialmente ocluida, BG05/06 08C1 un gran círculo. Las imágenes no establecen función del círculo ni geometría oculta. Las decisiones de esta propuesta son diseño nuevo, no reconstrucción certificada ni corrección factual de las referencias.

La calibración BG04 de 08C2.1 usa ocho correspondencias subjetivas y se aproxima a un límite; 08C2.2 ajustó cuatro marcas para las cámaras bajas con FOV al límite de 120°. Ninguno prueba arquitectura real. Se preservan los modelos y cámaras existentes; las vistas de esta página usan una geometría conceptual distinta e independiente, no reemplazan ni aprueban el plano anterior.

## Identidad espacial propuesta

**Elección del suelo:** una superficie continua y plana para baile y circulación, con una banda longitudinal hacia escenario y un aro más pequeño integrado como gráfica decorativa. Se elige por lectura de profundidad en la vista elevada y reconocimiento en las vistas bajas, tomando intenciones de ambas referencias sin afirmar que ninguna sea el trazado correcto. El aro no es plataforma, apertura, mecanismo ni descenso; su función propuesta es exclusivamente visual. La pista no queda delimitada funcionalmente por el aro. Material propuesto: hormigón oscuro pulido con inserciones de metal dorado envejecido, reflejo controlado y buena lectura del pie; no se está produciendo el material.

- **Nave:** volumen longitudinal monumental, ritmo repetido de columnas metálicas/hormigón y pórticos estructurales de influencia gótica y déco, no decoración de catedral genérica. La cámara alta mira desde galería posterior hacia el escenario; las cámaras bajas miran en la misma dirección.
- **Escenario:** tarima transversal al fondo; escalera frontal única centrada, con cambio de nivel claro; cabina DJ centrada detrás de ella. La posición de cabina es una propuesta: en BG04 no se distingue con certeza. Motivo angular luminoso del escenario como acento, no logo ni símbolo oficial.
- **Sonido y luz:** pareja de torres a ambos lados del escenario y pareja suspendida lateral dentro de la nave; haces magenta y cian desde lados opuestos, líneas violeta, acentos dorados cálidos moderados. El diagrama es solo emplazamiento conceptual; no verifica fijaciones o tecnología física.
- **Columnas, balcones y público:** dos series de columnas y balcones laterales continuos, con barandilla posterior elevada. Se plantean grupos a ambos lados de la pista, dejando circulación y lectura central; marcas abstractas no son personajes ni coreografía. Oclusión, densidad y momento temporal siguen abiertos.
- **Materialidad:** metal, hormigón y cristal, formas geométricas funcionales y detalles déco; contraste y profundidad propios de club nocturno indie premium. Evitar gárgolas, estatuas medievales genéricas, calaveras, rosetones gratuitos y símbolos inventados. Sin inventar elementos narrativos.

## Distribución y vistas compartidas

La galería contiene planta y tres perspectivas generadas a partir de **la misma lista de segmentos 3D conceptuales**. Unidades arbitrarias para comparar relaciones, no metros ni cotas de producción: eje x transversal, y hacia escenario y z vertical. Nave x10–90/y8–98; zona de baile x24–76/y22–72; banda x42–58; aro centro (50,46), radio 10; escenario x29–71/y76–91/z0–4; escalera x44–56/y68–76; cabina x45–55/y83–86/z4–8. Torres x31–36 y 64–69/y80–85; colgados x20–25 y 74–79/y39–44. Columnas repetidas y galerías laterales comparten esos ejes. Las cifras son diseño hipotético para poder proyectar, no medidas derivadas de imágenes ni nueva versión del modelo 08C2.1.

| Vista conceptual | Cámara propuesta posición → objetivo, FOV horizontal | Función y lectura |
|---|---|---|
| BG04 | (50,10,25) → (50,79,13), 100° | Establecimiento elevado: baranda próxima, secuencia de crujías, eje de suelo y escenario lejano. Más centrada que BG04 08C; no reproduce exactamente esa imagen. |
| BG05 | (50,19,8) → (50,82,13), 95° | Vista baja de pista hacia escalera y cabina; público como marcadores laterales. Debe permitir leer actividad sin afirmar cómo se anima. |
| BG06 | (50,28,7) → (50,83,13), 90° | Más cerca, mirando al mismo escenario; reserva 2D para personaje y logo. Son cajas gráficas, no posición/escala física del sprite. |

Las tres usan los mismos objetos, incluido el público de muestra, sin modificar la geometría por encuadre. Líneas posteriores se ven a través de otras porque **no se calculan superficies ni oclusiones**. El diagrama de planta marca direcciones de mirada, no campos de visión ni recorrido. Las reservas 2D de BG06 son intenciones editoriales y pueden tapar líneas; no son pruebas de oclusión. No se ha construido un modelo de producción ni se ha comprobado una trayectoria continua entre cámaras.

## Comparación con versiones previas

| Elemento | Fuentes originales y propuestas anteriores | Cambio conceptual propuesto |
|---|---|---|
| Suelo | Originales con círculo; BG04 08C longitudinal; BG05/06 08C1 gran motivo circular. | Franja longitudinal y aro menor dentro de una superficie continua; no extrapolación de partes ocultas. |
| Escenario / escalera | Posición, ancho y perspectiva varían; cabina BG04 no identificable. | Una tarima, una escalera y cabina central compartidas entre tres cámaras. |
| Sonido / arquitectura | Columnas y balcones similares, pero correspondencia de módulos y crujías incierta. | Repetición fija de estructura, torres y colgados; traducir a metal/hormigón/cristal y reducir ornamento eclesiástico. |
| Público / iluminación | 04 y 05 muestran público en distintas zonas; 06 vacío de público de suelo; luz varía. | Distribución conceptual lateral común y fuentes cian/magenta/violeta con dorado; momento real y oclusión sin resolver. |
| Personaje / logo | BG06 08C1 deja espacio pero no prueba integración. | Reservas 2D en BG06; prueba con recursos oficiales aún pendiente. |

## Relación con los diez planos

| Plano | Propuesta de continuidad / límite |
|---|---|
| 01 Ciudad | Conservar lectura urbana y materiales de club; no afirmar llegada física del protagonista desde fuera. |
| 02 Fachada | Continuidad de paleta y metal industrial; correspondencia con interior aún por diseñar. |
| 03 Umbral | El corredor debe conectar con la nave conceptual; geometría de transición no demostrada. |
| 04 Protagonista caminando | Corredor legible y suelo de apoyo para el walk oficial; perspectiva y pivote por probar. |
| 05 Corredor y señal Refugio | Prever ubicación de señal legible sin inventar conexión física ni cambiar HUB; su diseño y colocación aún pendientes. |
| 06 Primera visión de la nave / BG04 | La vista alta revela una sola pista y escenario; en la implementación actual este plano no dibuja protagonista. |
| 07 Pista / acontecimiento sonoro / BG05 | Misma zona y tarima a nivel bajo; público y lectura del acontecimiento requieren validación; no se ha creado audio. |
| 08 Reacción / BG06 | Reserva de composición sin pose inventada; en implementación actual hay espera, no apuntado validado. |
| 09 Logo oficial | Reserva superior separada del motivo de escenario; comprobar con el logo oficial y sprite reales. |
| 10 Señal Refugio y transición HUB | Reservar legibilidad y probar continuidad con el HUB real; actualmente hay fundido, no descenso ni apertura física. |

La reserva podría permitir estudiar la composición con sprites oficiales sin redibujarlos, pero **no demuestra perspectiva correcta**: faltan escala, orientación, anclaje de pies, oclusión y encuadre reales. `player_idle_00` y `player_walk_03` presentan problemas de alfa, `walk_02` difiere en vestuario y los grounded no reparan alfa. No se inventan poses, anatomía, ropa ni tatuajes; no usar fogonazo de disparo como pose de apuntado. No se ha colocado un sprite ni probado el logo.

## Criterios de revisión y limitaciones

- **¿Parece el mismo club?** Los tres diagramas comparten geometría y puntos de referencia; esto evidencia consistencia esquemática, no demuestra identidad artística en fondos acabados.
- **¿Distribución clara?** Planta y vistas muestran eje, aro gráfico, circulación lateral y escenario; anchos y conexiones son provisionales y no verifican circulación real.
- **¿Pista y escenario coherentes?** En el esquema la superficie conduce a la escalera y tarima fijas. Falta validar escala, oclusión y el diseño completo desde las tres cámaras.
- **¿Identidad reconocible?** El vocabulario propuesto está especificado, pero el alambre sin materiales no permite valorar acabado indie premium ni equilibrio gótico-industrial; aprobación artística pendiente.
- **¿Protagonista sin falsear perspectiva?** No demostrado: las reservas no son un sprite ni miden contacto con suelo. Se requiere prueba real con recursos oficiales sin alterar.
- **¿Funciona para diez planos?** Hay un plan de correspondencia, no prueba de montaje: faltan conexión del corredor, señal, continuidad temporal, logo, transición al HUB, capas auténticas y ensayos en juego. Los PNG previos son planos; no se deben inventar transparencias ni simular paralaje.

## Recomendación y decisión

Solicitar revisión humana de la propuesta C, especialmente tamaño y papel decorativo del aro, intensidad industrial frente al gótico y conservación de la composición de BG04. Si se aprueba expresamente, una fase posterior podría desarrollar planta versionada, superficies/oclusiones y pruebas de sprites y logo oficiales; no se autoriza aún producir o integrar fondos. Se conservan todos los originales y fases previas.

## QA realizado

- Inspección visual de los originales y propuestas y de captura completa de la nueva galería. Las perspectivas son alambre conceptual, no evaluación del acabado artístico.
- Chromium headless con y sin JavaScript: seis imágenes decodificadas y cuatro SVG accesibles, sin errores de página, red ni HTTP. Se comprobaron rutas locales existentes y ausencia de dependencias externas.
- `python3 tools/qa/test_cinematic_08c22.py`: OK, integridad de modelo/planta/alzados y referencias principales y reproducción de hipótesis previas en directorio temporal.
- Git partió limpio y, antes de añadir los dos entregables, no mostró ningún archivo rastreado modificado: originales históricos, propuestas, modelo/cámaras y producción siguen idénticos al commit inicial. `git diff --check` sin errores. No se ejecutó integración ni prueba en juego.
