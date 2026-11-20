# DEADBEAT DISCO — Menús escenificados

## Escenarios implementados

- [Menú principal — entrada del club](evidence/menu-scenes/01-menu.png): JUGAR, PERSONALIZAR, PROGRESIÓN, OPCIONES, EXTRAS y SALIR; el acceso a Nueva partida y Continuar está dentro de JUGAR. Nueva partida conserva la intro seguida del descenso; Continuar no las reproduce.
- [Personalizar — camerino](evidence/menu-scenes/02-personalizar.png): vista del diseño de referencia con sombrero. **No existe aún un sistema de cosméticos equipables:** la pantalla no simula selección ni cambia el personaje del juego.
- [Progresión — galería](evidence/menu-scenes/03-progresion.png): mejor puntuación, sala más profunda, fichas, victorias, logros e historial proceden de las claves persistidas existentes. El juego no expone un nivel ni XP de perfil persistentes; no se inventan.
- [Opciones — sala de control](evidence/menu-scenes/04-opciones.png): reutiliza el panel del motor y sus controles reales de audio, calidad, pantalla completa, accesibilidad y controles. La resolución se informa a partir de la ventana; el navegador no permite elegir arbitrariamente una resolución física de pantalla. La pantalla completa depende del permiso del navegador.
- [Extras — archivo](evidence/menu-scenes/05-extras.png): imágenes ya incluidas y créditos existentes, sin desbloqueos inventados. El contenido se desplaza también por teclado y mando.
- [Resultados — pista abandonada](evidence/menu-scenes/06-game-over.png): datos, reintento y vuelta al menú del motor original. La captura procede de daño de playtest y por eso indica partida modificada.

Los cinco fondos y el retrato son nuevas ilustraciones generadas para las escenas; el retrato se basa en la lámina maestra aprobada y no representa un nuevo aspecto equipable. Se mantiene el arte de partida sin cambios.

## Integración

Se amplía el gestor `DD_UI` existente: un solo contenedor de escena, gestión de foco y acciones existentes, reutilización del panel de mezcla, devolución de ese panel al salir de opciones, y retorno a la opción elegida. Los cambios visuales usan fundido, desenfoque, movimiento ambiental y entrada de contenido; se respetan las preferencias de movimiento reducido. No se añade navegación física ni se reinicia el motor al cambiar de sección. Los resultados usan el gestor existente y su resumen real.

## Validación

- `test_menu_scenes.js`: **PASS** en Chromium 1280×720; entradas y salidas de los cuatro apartados, selección al volver, un único contenedor, volumen y calidad persistidos, entrada a partida y fin de partida mediante playtest. Ratón y Escape verificados; A/B de mando **simulado** en Opciones. Botón de vuelta comprobado en 800×600 y 375×812. Sin errores de consola o peticiones fallidas en este recorrido.
- `test_menu_new_flow.js`: **PASS** con movimiento normal y reducido; menú directo, Nueva partida encadena intro y descenso, saltos y Continuar sin cinemática. Algunos tiempos se aceleran mediante `debugSeek`.
- `DD_QUICK=1 test_ui_results.js`: **PASS** a una resolución, con mando simulado y daño de playtest. `test_ingame_transitions.js`: **PASS**. Ambas builds HTML son idénticas.
- Pendiente: mando Xbox físico, comprobación auditiva real, pruebas exhaustivas de todos los controles/tamaños y perfilado de rendimiento. La calidad cosmética de las nuevas imágenes no equivale a aprobación artística ni completa el sistema de cosméticos. Pruebas históricas que asumían el menú anterior necesitan actualización.

## Suavizado de navegación y paneles

Las escenas realizan un fundido cruzado y una deriva corta de entrada/salida; los paneles de texto, estadísticas y resultados usan velos degradados parcialmente transparentes, con sombras de texto para mantener la lectura y dejar ver el escenario. En pantallas estrechas el velo vuelve a ser más oscuro para priorizar contraste. Con movimiento reducido se eliminan las transiciones añadidas. Se ha protegido el foco frente a entradas y salidas rápidas para evitar llevarlo a una escena ya descartada.

Capturas reales actualizadas: [personalización](evidence/menu-scenes/suavizado/02-personalizar.png), [progresión](evidence/menu-scenes/suavizado/03-progresion.png), [opciones](evidence/menu-scenes/suavizado/04-opciones.png), [extras](evidence/menu-scenes/suavizado/05-extras.png) y [resultados](evidence/menu-scenes/suavizado/06-game-over.png).

Validación en Chromium: `test_menu_scenes.js` **PASS**, incluido cambio rápido y recuperación del foco; `test_menu_new_flow.js` **PASS** con movimiento normal y reducido; `DD_QUICK=1 test_ui_results.js` **PASS** a una resolución. Sin errores de navegador en los recorridos. La lectura se revisó visualmente en las capturas, no se ha medido contraste de cada píxel ni probado con mando físico.

## Paso del protagonista entre escenas

Al abrir una escena o regresar, una viñeta muestra al protagonista cruzando el encuadre en sentidos opuestos, mientras se disuelve la estancia anterior y aparece la siguiente. Es una composición decorativa con desplazamiento y balanceo de una ilustración, **no una caminata dibujada fotograma a fotograma ni un mapa explorable**. No intercepta controles, se cancela al iniciar o continuar una partida y se omite con movimiento reducido. [Fotograma real de la transición](evidence/menu-scenes/paso-al-camerino.png).

`test_menu_passage.js`: **PASS** en Chromium; mide el desplazamiento en ambas direcciones, la limpieza de la viñeta, el destino, la selección al volver, la intro sin obstrucción y el modo de movimiento reducido. `test_menu_scenes.js`, `test_menu_new_flow.js` y `DD_QUICK=1 test_ui_results.js`: **PASS**, la última a una resolución. Mando físico no verificado.

## Travelling en primera persona

La transición anterior con el personaje cruzando pantalla ha sido sustituida por una cámara subjetiva: el escenario de origen se aproxima y se disuelve hacia el escenario de destino, que entra con un zoom y un cambio suave de luz. No se muestra al protagonista en la transición. Se trata de un travelling 2D simulado a partir de las ilustraciones existentes, no de un pasillo tridimensional real. Al volver se intercambian origen y destino. No captura entrada, se cancela al iniciar una partida y se omite con movimiento reducido. [Fotograma de llegada al camerino](evidence/menu-scenes/travelling-camerino.png).

`test_menu_passage.js`: **PASS**, comprueba los fondos reales de origen/destino, el cambio de escala de la cámara, la vuelta, la selección, la ausencia de personaje en la transición y la preferencia de movimiento reducido. `test_menu_scenes.js` y `test_menu_new_flow.js`: **PASS**. La ejecución rápida de `test_ui_results.js` excedió el límite de tiempo después de pasar las comprobaciones hasta foco en resultados; no se declara completa. No se ha probado mando físico ni medido rendimiento en dispositivos de gama baja.

## Portada: declaración de intenciones

La entrada al juego utiliza una nueva ilustración integrada: el protagonista de sombrero ante el portal gótico y la torre iluminada. La imagen se ha generado usando como referencias la lámina maestra y la entrada previa; no modifica los sprites de juego. La composición reserva una zona oscura para la navegación, añade el lema «NUEVE CÍRCULOS ✦ UN ÚLTIMO BAILE» y retira el ecualizador que cubría al protagonista. Se conserva el movimiento suave del fondo, desactivado con movimiento reducido. El travelling sigue usando la entrada sin personaje como plano subjetivo, para no colocar al protagonista delante de una cámara en primera persona. [Captura real de la portada](evidence/menu-scenes/portada-epica.png).

`test_menu_new_flow.js`: **PASS** en Chromium con movimiento normal y reducido; comprueba el flujo de partida y que las seis opciones caben en 1280×720, 800×600 y 375×812. `test_menu_passage.js`: **PASS**. `test_menu_scenes.js`: **PASS** en esta entrega antes de los últimos ajustes decorativos. No se ha verificado mando físico ni medido contraste exhaustivamente.

## Nueva portada: la discoteca y el descenso

Por indicación del usuario, la portada anterior de la torre ascendente se ha sustituido por una **composición nueva** inspirada en el storyboard de la intro: interior de la discoteca, pista resquebrajada y abertura que desciende, con el protagonista junto al borde. Se generó a partir de la referencia aportada y de la lámina maestra; no cambia los sprites de partida. El plano subjetivo del menú Jugar y el travelling desde/hacia el menú usan ahora la pista de baile existente de la intro, sin protagonista superpuesto, en lugar de la fachada anterior. [Captura real de la nueva portada](evidence/menu-scenes/portada-nuevo-descenso.png).

`test_menu_new_flow.js` y `test_menu_passage.js`: **PASS** con movimiento normal y reducido. Las seis opciones caben en los tres tamaños comprobados (1280×720, 800×600, 375×812). Las builds son idénticas. Se trata de una interpretación nueva del storyboard, no una copia literal de un fotograma.

## Pulso y colección de aspectos

La portada incorpora una luz que sigue la fase del secuenciador WebAudio de la música del **menú** (no un análisis de amplitud ni el audio independiente de la cinemática). Se desactiva con movimiento reducido, destellos desactivados o música silenciada. La intro ya emplea pulsos propios en su línea temporal. Se han retirado explicaciones técnicas de los textos visibles.

El camerino ofrece cuatro paletas cosméticas: Original, Pulso cian (sala 5), Noche violeta (sala 15) y Último baile (primera victoria). Se aplican a los acentos magenta del protagonista en el camerino, Refugio y pista, sin modificar habilidades; no son trajes nuevos dibujados. La selección persiste y Extras muestra las condiciones. [Captura del camerino](evidence/menu-scenes/camerino-pulso-cian.png).

`test_appearances_beat.js`: **PASS**, con récords y victoria sembrados, no obtenidos jugando; comprueba bloqueo, equipamiento, recarga, Extras y aplicación al render. `test_menu_scenes.js`, `test_menu_new_flow.js` y `test_menu_passage.js`: **PASS**; las dos últimas en movimiento normal y reducido. No se ha probado una victoria natural, el mando físico ni realizado perfilado de rendimiento.
