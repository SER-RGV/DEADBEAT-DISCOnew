# Animaciones y transiciones dentro de partida

## Primera entrega: descenso y cambio de círculo

### Auditoría y corrección

- El sistema activo es `DD_CINE` (`src/dd_cinematic_camera.js`), conectado al render del motor desde `tools/build_active_html.py`. Ya existían animaciones de cámara, sala, jefe, derrota, eventos y renderizadores de personajes/enemigos; no se creó un segundo gestor.
- El descenso desde Refugio seleccionaba el índice 1 (Lujuria) aunque el motor inicia en el índice 0 (Limbo). La tabla cinematográfica además tenía ordinales y BPM desfasados respecto a `Ue`. El modo `circle` no tenía composición propia en `renderOverlay`.
- El descenso del Refugio ahora usa el índice real de Limbo. Títulos, ubicaciones, BPM y color proceden de `__DD_BRIDGE.getCircles()`, sin modificar `Ue`. La nueva composición usa arte ya registrado cuando existe y un fondo de reserva; el inicio sigue esperando el callback del descenso y permite saltar.
- Los cambios automáticos de círculo durante la partida usan una tarjeta breve, sin bloquear entradas ni ocultar HUD. No se ha añadido una pausa ni cambiado duración, dificultad, IA o progresión del motor. Si el puente no está disponible se muestra «DESCENSO» como etiqueta neutra.
- Los subtítulos HD no se superponen a la banda de la cinemática. La preferencia de movimiento reducido acorta la duración de la secuencia.

### Pruebas

- `tools/qa/test_ingame_transitions.js`: **PASS** en Chromium 1280×720. Descenso de Refugio anuncia Limbo I y su BPM real, espera al motor y se salta con teclado; viaje debug a sala 12 muestra Lujuria II, con HUD visible y Q funcional durante la tarjeta. Se contrastan los títulos de los diez destinos con los datos del motor; con movimiento reducido se comprueba duración más corta y callback único al saltar. Sin errores de consola ni red. El viaje de sala usa depuración y marca la partida modificada: no sustituye un descenso natural por campaña completa.
- `DD_QUICK=1 tools/qa/test_ui_results.js`: **PASS** en una resolución. `tools/qa/test_cinematic_fase03.js`: **PASS** en su entorno simulado (intro cinemática anterior); `tools/qa/test_subtitles.js`: **PASS** tras aislar el mensaje directo de la cola del motor en la prueba.
- Capturas de prueba: [descenso a Limbo](evidence/ingame-animation/descenso-limbo-1280x720.png) y [cambio a Lujuria mediante depuración](evidence/ingame-animation/cambio-lujuria-1280x720.png).

### Alcance pendiente

Esta entrega no reconstruye todas las animaciones de protagonistas, enemigos o jefes ni valida todos los cambios de fase del combate. Tampoco acredita una campaña completa, mando físico, audio audible o todas las resoluciones. Los sistemas y poses existentes se conservan para una revisión posterior; no se considera que un sprite experimental archivado sea una animación aprobada.

## Segunda entrega: voltereta y estados de enemigos

- El renderizador calculaba el giro de la voltereta suponiendo siempre 0,32 s. Ahora utiliza `rollElapsed / (rollElapsed + rollT)`, datos reales de la esquiva activa, para completar una vuelta también con duraciones configuradas de 0,24 a 0,42 s. No se cambia duración, desplazamiento, invulnerabilidad ni ninguna otra regla del motor.
- `tools/qa/test_ingame_animation.js`: **PASS** en Chromium. Comprueba la rotación del renderizador real usando su imagen real sobre un canvas aislado a mitad de las tres duraciones (0,24 / 0,32 / 0,42 s) y activa la esquiva real del motor en ambos extremos con configuración de prueba. [Fotograma aislado a mitad de giro](evidence/ingame-animation/voltereta-media-vuelta.png).
- Se contrastan las familias de arte de cuatro clases usando vistas sintéticas, y se comprueba que los estados de aviso, ataque e impacto de actores generados mediante depuración llegan al puente del render. La primera sala remapea los tipos permitidos: se observó que cuatro solicitudes distintas generaban bailarines, por lo que no se presentan como cuatro enemigos reales diferentes. Las vistas sintéticas y poses forzadas no validan la IA ni todas las animaciones naturales.
- Regresiones posteriores: `test_ingame_transitions.js`, `test_accessibility_dodge.js` y `DD_QUICK=1 test_ui_results.js`: **PASS**, esta última a una resolución. Sin errores de navegador en los recorridos. Pendientes revisión visual de otros estados y jefes en combate real y mando físico.

## Tercera entrega: animaciones del jugador

- Auditoría del controlador de animación existente y sus poses del renderizador: reposo, caminar, puntería, disparo, impacto, habilidad y voltereta. Se mantienen los recursos y anclas existentes; el experimento 4F archivado no se ha incorporado al juego.
- Los wrappers de bomba y boost reproducían la pose de habilidad antes de comprobar si el motor aceptaba la acción. Ahora conservan el resultado del motor y sólo activan la pose cuando la carga correspondiente realmente disminuye. No cambia cuándo se puede usar una habilidad, sus efectos ni sus costes. La adaptación se aplica al generar las builds; el backup original permanece intacto.
- `tools/qa/test_player_animations.js`: **PASS** en contexto aislado con gancho de prueba y partida marcada modificada. Contrasta intentos con y sin cargas de bomba/boost, caminar y disparar en movimiento con poses reales del motor, ancla del arma reflejada en ambas direcciones y pose de daño tras `DMO.playtest.hurt`. Se usan pasos deterministas para movimiento; no equivale a una revisión visual de todas las combinaciones de armas o a una campaña natural.
- Regresiones `test_ingame_animation.js`, `DD_QUICK=1 test_ui_results.js` y `test_native_armory.js`: **PASS**, sin errores de navegador en esos recorridos. La prueba general rápida sólo cubre 1280×720; confirmación de tienda en cuatro tamaños. Las builds son idénticas.

## Cuarta entrega: reacción a impactos del jugador

- La pose de impacto dependía del temporizador de invulnerabilidad `ke`: éste también puede activarse sin daño al entrar en una sala y no cubría el escudo normal (0,6 s). Ahora una reacción visual breve de 0,16 s se activa cuando la función original de impacto realmente reduce vida o escudo. Los golpes rechazados no activan la reacción; la muerte conserva prioridad. El cálculo de daño, escudos, invulnerabilidad y devolución de la función original no se modifica.
- `tools/qa/test_player_animations.js`: **PASS** en Chromium; comprueba impacto con escudo, daño a vida, rechazo por invulnerabilidad, invulnerabilidad sin impacto, fin de la reacción y prioridad de muerte. Usa un gancho aislado de prueba y daño de playtest, no una campaña natural.
- Regresiones `test_ingame_animation.js`, `test_accessibility_dodge.js` y `DD_QUICK=1 test_ui_results.js`: **PASS**; esta última cubre una resolución. Sin errores de navegador en esos recorridos; las dos builds regeneradas son idénticas.

## Descenso al Refugio y caminata del protagonista

- En la cinemática de apertura y en el descenso de Nueva partida, el personaje ya no permanece completamente rígido: el torso se inclina como reacción al movimiento de la plataforma mientras las piernas se mantienen ancladas. Se trata de una articulación procedural de la ilustración 07B, no de una nueva animación dibujada fotograma a fotograma. Con movimiento reducido se omite la inclinación. [Captura del descenso](evidence/ingame-animation/descenso.png).
- En el Refugio se usan los cuatro fotogramas de caminata de cuerpo entero existentes mientras hay desplazamiento real; al detenerse vuelve al idle 07B. La caminata se refleja al moverse a la izquierda, lo que también refleja los tatuajes. Los fotogramas de caminata son de la serie anterior y no coinciden exactamente con el idle 07B: sigue pendiente un ciclo dibujado específicamente para ese diseño si se quiere continuidad perfecta. [Captura caminando](evidence/ingame-animation/refugio-caminando.png).
- `test_hub_descent_animation.js`: **PASS** para movimiento normal y reducido, articulación en el canvas real, varios fotogramas caminando, parada y cambio de dirección. `test_ingame_transitions.js` y `test_player_animations.js`: **PASS**. Las builds regeneradas son idénticas.
- `test_restart_flow.js` pasó las comprobaciones mostradas de intro, descenso, entrada y control del Refugio, pero la ejecución completa excedió el límite de tiempo; no se declara el conjunto completo como aprobado en esta ejecución. Mando físico y continuidad artística perfecta no comprobados.

## Caminata basada en el diseño 07B

Se sustituyen en el Refugio los fotogramas antiguos mencionados en la sección anterior por tres imágenes generadas tomando como referencia el idle 07B y las poses de caminata anteriores; se recortaron sobre transparencia y se alinearon a su tamaño y punto de apoyo. La secuencia usa las poses 0–1–2–1; por ello es un ciclo provisional de ida y vuelta, no una caminata dibujada con ambas zancadas completas. Los detalles del tatuaje y la ropa son aproximados y pueden variar entre poses; al caminar a la izquierda la imagen se refleja, incluidos los tatuajes. El descenso conserva su ilustración 07B y articulación procedural. No se modifican los sprites del combate. [Captura en Refugio](evidence/ingame-animation/refugio-caminata-07b.png).

Verificado en Chromium con `test_hub_descent_animation.js` (las tres imágenes cargadas, parada, cambio de dirección y movimiento reducido), `test_ingame_transitions.js` y `test_player_animations.js`: **PASS**. Las builds HTML son idénticas. Prueba visual en una resolución; no equivale a aprobación artística ni garantiza coincidencia exacta entre fotogramas.

### Revisión de la zancada contraria

Se intentó generar dos poses adicionales para cerrar el ciclo: la primera no invirtió claramente la zancada y la segunda presentó tres piernas. Se descartaron y no forman parte del juego; se mantiene el ciclo provisional 0–1–2–1. La prueba automatizada ahora comprueba además que el canvas dibuja realmente las tres imágenes nuevas, que los archivos son de 288×512, tienen transparencia y no conservan el fondo verde, y que el dibujado se refleja al caminar hacia la izquierda. **PASS** con movimiento normal y reducido. Sigue pendiente un ciclo completo coherente con zancadas alternas y continuidad exacta del tatuaje.

## Pose de espaldas durante el descenso

A petición del usuario se creó una ilustración nueva de cuerpo entero mirando hacia la torre, con postura heroica de espaldas, para el descenso de la intro y el descenso de Nueva partida. Se usa en la plataforma con la misma articulación procedural del torso; si no carga, se conserva el idle anterior como respaldo. El diseño es una interpretación generada de la vista trasera: los tatuajes y la ropa no deben considerarse idénticos al arte de perfil. No cambia el personaje del Refugio ni el combate. [Captura en escena](evidence/ingame-animation/descenso-de-espaldas.png).

`test_hub_descent_animation.js` comprueba que el canvas usa la imagen de espaldas y que el torso se articula con movimiento normal y queda quieto con movimiento reducido. La misma prueba comprueba la caminata en el Refugio; `test_ingame_transitions.js` verifica las transiciones de círculo. Ambas: **PASS**. Las builds HTML son idénticas. No se ha repetido la suite larga completa de arranque en esta entrega.

## Menú dinámico y cinemática al empezar

El arranque ahora termina directamente en el menú sin pulsación previa ni cinemática. «Nueva partida» reproduce la intro narrativa y, al terminar o saltarla, encadena automáticamente el descenso al Refugio. Ambas secuencias se pueden saltar por separado; «Continuar», Opciones y el arranque no las reproducen. Se mantiene el bloqueo de activaciones duplicadas. Si una secuencia no está disponible, se pasa a la siguiente o al Refugio. El audio del menú puede depender de la primera interacción del usuario por la política del navegador.

El menú conserva el arte y sus controles, y añade un anillo, haces y ecualizador decorativos. No capturan entrada y se detienen con `prefers-reduced-motion`; en pantallas estrechas se ocultan. [Captura del menú](evidence/ingame-animation/menu-animado.png).

`test_menu_new_flow.js`: **PASS** en Chromium con movimiento normal y reducido: menú sin gesto, Opciones sin intro, inicio nuevo, encadenamiento automático, doble activación, salto por teclado de ambas secuencias, guardado y Continuar sin cinemática. Se comprobó que Nueva partida queda dentro de la pantalla a 1280×720, 800×600 y 375×812. La secuencia de final automático se aceleró con `debugSeek`; no es una medición de duración completa. `test_hub_descent_animation.js`, `test_ingame_transitions.js`, `test_player_animations.js` y `DD_QUICK=1 test_ui_results.js`: **PASS**, esta última a una resolución. No se probó mando físico ni audio audible.

Las pruebas históricas que esperan INTRO al arrancar (en particular `test_restart_flow.js`) describen el flujo anterior y requieren adaptación; no se presentan como pasadas para este cambio. Algunas sondas antiguas también conservan ese supuesto.
