# 08C4 · Rediseño arquitectónico y cinematográfico

**Estado: propuestas no aprobadas y no integradas.** Las vistas muestran una dirección industrial nueva, pero no se ha demostrado la continuidad geométrica ni se puede certificar aún el cumplimiento artístico. [Comparativa](COMPARATIVA_08C4.html) · [Planta conceptual](PLANTA_08C4.svg).

## Punto de partida y decisiones

Se partió de `78dede8`, rama limpia y PR #17 abierto/borrador. En 08C3 dominaban arcos de catedral, cortinas y espacio vacío; BG06 repetía demasiado BG04. En 08C4 la dirección pasa a una fábrica-teatro de club: estructura de acero, cerchas, balcones déco, paneles oscuros, equipamiento escénico y sonido con acentos dorados, cian, magenta y violeta. No se usa el color como prueba de continuidad.

Antes de generar se dibujó `PLANTA_08C4.svg`: escenario transversal al fondo con cabina central y escalera única; pista continua al centro; banda longitudinal con aro decorativo empotrado; torres junto al escenario y equipos suspendidos a los lados; balcones laterales y dos estructuras transversales superiores. Alturas relativas propuestas: suelo 0, escenario 1, balcones 4 y cerchas/pasarelas 7, **unidades arbitrarias, no metros**. Las cotas y recorridos son hipótesis, no arquitectura validada ni modificación del modelo 08C2.4. El aro no es plataforma, apertura o descenso. Frente a 08C2.4 se proponen más estructuras técnicas, menos carácter eclesiástico y nuevas cámaras: 04 oblicua desde atrás a la izquierda; 05 alta desde atrás; 06 baja sobre el eje más cerca de escenario.

Se generó primero BG05 usando la planta; BG04 y BG06 usaron la misma planta y BG05 como referencia. Son imágenes condicionadas por una referencia común, **no renders desde un modelo 3D único**. No puede afirmarse que cada objeto conserve posición o proporción real.

## Archivos entregados

| Recurso | Ruta | Formato y dimensiones reales |
|---|---|---|
| BG04 entrada | `assets/cinematics/backgrounds/proposals_08c4/bg04_entrada.png` | PNG RGB, **5472 × 3072 nativos**, relación 1,78125:1, no 16:9 exacto |
| BG05 general | `assets/cinematics/backgrounds/proposals_08c4/bg05_general.png` | PNG RGB, **2816 × 1584 nativos**, 16:9 |
| BG06 escenario | `assets/cinematics/backgrounds/proposals_08c4/bg06_escenario.png` | PNG RGB, **2784 × 1504 nativos**, relación 1,85106:1, no 16:9 exacto |
| Planta | `assets/cinematics/backgrounds/proposals_08c4/PLANTA_08C4.svg` | SVG conceptual 1100 × 780 |
| Comparativa | `assets/cinematics/backgrounds/proposals_08c4/COMPARATIVA_08C4.html` | HTML local, imágenes enlazadas sin deformar |

Las medidas son las de los archivos de salida de la herramienta, sin ampliación ni recorte posterior. No se generaron derivados 2560 × 1440: haría falta recorte o adaptación compositiva para lograr 16:9 exacto en BG04 y BG06; hacerlo ahora podría perder información importante. No se certifica detalle artístico por contar píxeles. Sin capas separadas ni paralaje auténtico.

## Revisión visual y límites reales

- **Cámaras:** BG04 aporta perspectiva oblicua y primer plano de estructura/baranda; BG05 muestra una planta general elevada; BG06 baja y se concentra más en escenario. Son más distinguibles que 08C3, aunque BG05 y BG06 siguen siendo frontales y la diferencia de profundidad es moderada.
- **Identidad:** predominan cerchas, metal, balcones, cabina y luces; desaparece la catedral ojival de 08C3. Hay más detalle técnico, pero el suelo sigue vacío y la sensación de fiesta/actividad puede requerir dirección artística adicional. No se añadió protagonista.
- **Continuidad:** banda, aro, cabina y escalera son reconocibles, pero la correspondencia física exacta de trusses, luces, torres y crujías es incierta. En BG06 aparece además un arco parcial en el borde inferior que puede leerse como un segundo motivo; no coincide inequívocamente con el aro único previsto en planta. BG04 parece mostrar un borde elevado/barandilla junto al suelo, relación con circulación pendiente. Cerchas visibles no prueban pasarelas transitables en cada imagen.
- **BG06:** hay pequeñas formas ambiguas junto a la cabina que podrían leerse como figuras o equipo; no se atribuyen a personajes oficiales y requieren corrección/revisión. No hay prueba de anclaje, perspectiva, escala o legibilidad con sprites oficiales ni logo; no usar estas imágenes como evidencia de integración.
- Son imágenes planas generadas, sin información real de oclusiones o zonas ocultas. No se han verificado movimiento, escenas completas, GPU ni resolución perceptual. El dibujo final, presencia de texto/marcas, identidad y continuidad requieren revisión humana detallada.

## Verificación técnica

Se comprueban dimensiones y formato de PNG y funcionamiento local de la comparativa; no son pruebas de canon o calidad. No se modificaron fondos 08C3, originales, código, manifiesto ni recursos de producción. PR #17 debe permanecer abierto en borrador. La decisión artística y cualquier integración quedan pendientes del usuario.

QA ejecutado: Pillow decodificó los tres PNG y comprobó formato, modo y dimensiones anteriores. Chromium headless cargó cuatro imágenes (tres PNG y la planta SVG) con y sin JavaScript, sin errores de página, red ni HTTP; se verificaron los enlaces locales y se inspeccionó una captura de la comparativa. Git partió limpio y no mostró modificaciones en archivos rastreados anteriores. Estos resultados no validan geometría ni aprobación artística.
