# DEADBEAT DISCO — auditoría y reconstrucción UI/UX

## Cierre de implementación y validación disponible

La implementación de esta entrega queda cerrada en la rama actual, con las **limitaciones explícitas** que siguen. Las fases y el inventario históricos de abajo conservan sus hallazgos iniciales; si contienen pendientes ya resueltos o cifras anteriores, prevalece este resumen final. No se certifica una campaña completa ni compatibilidad con dispositivos que no estaban disponibles.

### Inventario final

| Superficie | Estado y decisión |
|---|---|
| Carga e intro | ACTUAL: flujo, salto y estados probados; se conservan los módulos existentes. |
| Menú, opciones, créditos y salida | ACTUAL: navegación, foco y ajustes integrados. Portada heredada DUPLICADA pero conservada por sus dependencias de audio y motor. |
| Refugio, selección y transición | ACTUAL: inicio y continuación probados; conserva los sistemas originales. |
| HUD y minimapa | ACTUAL: vidas, escudo, HYPE/RAVE y atajos reflejan el motor; minimapa reproduce su canvas. HUD legado DUPLICADO, conservado oculto. |
| Pausa y opciones del motor | ACTUALIZADA visualmente; controles y mezcla originales conservados. |
| Armería, inventario y mapa de torre | ACTUAL: catálogo y precios del motor; adquisiciones de incursión quedan en la tienda nativa con confirmación. Mapa usa círculos reales. |
| Elecciones de disparo y riesgo | ACTUALIZADAS visualmente y probadas con estados forzados; la activación natural durante una campaña queda sin verificar. |
| Diálogos y subtítulos | ACTUAL: refleja emisor, texto y duración del canal del motor; capa original conservada, sin doble anuncio en edición HD. |
| Derrota, GAME OVER y resultados | ACTUAL: flujo de cierre original y resumen real, reintento y menú. Paneles heredados DUPLICADOS conservados por dependencias. |
| Victoria | INCOMPLETO por validar en juego real: presentación y cierre probados con victoria sintética, no con jefe derrotado en campaña. |
| Mando físico, lector de pantalla y audio audible | INCOMPLETO por validar: se probaron mando simulado, árbol accesible del navegador y estados de audio, no los dispositivos ni la audición. |
| Interfaces inexistentes | No se inventó ninguna pantalla o indicador como sustituto de una mecánica ausente; no se declara AUSENTE una característica sólo por no estar expuesta en el puente. |

### Sistema visual y navegación

Se reutilizan los recursos y la identidad del proyecto: fondos oscuros, neón rosa/cian, tipografías existentes, foco de alto contraste, superficies y diálogos responsive. Las interfaces originales con dependencias se mantienen; no se añadieron dependencias de producción. La ruta verificada es `carga → intro → menú → Refugio → incursión → pausa/reanudar → derrota/rendición → resultados → reintentar o menú`; la presentación de victoria se comprobó por separado con estado sintético. En incursión se conservan las elecciones y tiendas originales; el mapa HD no sustituye el inventario nativo.

### Regresión final en Chromium

- `test_ui_results.js` **PASS completo**: tienda/mapa/HUD/pausa en 1920×1080, 1600×900, 1366×768 y 1280×720; resultados en esas resoluciones, 1024×768 y 2560×1080; muerte de playtest, rendición, reintento, retorno y nueva partida; mando simulado y sin errores de consola o peticiones fallidas.
- `test_restart_flow.js` **65/65 PASS**: carga, intro, salto, menú, opciones, refugio, persistencia, mando simulado y siete tamaños. Estados internos de audio probados; audio audible no verificado.
- `test_native_armory.js` **PASS dos ejecuciones posteriores**: compra, precio, selección de reemplazo y mando simulado. La primera ejecución final falló porque el test recolectaba una cantidad fija insuficiente ante stock aleatorio; se corrigió para obtener suficientes créditos debug según precios reales y se repitió dos veces. No se modificaron precios ni transacciones del motor.
- `test_victory_presentation.js`, `test_combat_choices.js`, `test_hud_vitals.js`, `test_minimap_engine.js`, `test_modal_input.js`, `test_accessibility_dodge.js`, `test_options_controls.js` y `test_subtitles.js`: **PASS**. Las pruebas que fuerzan estados o usan viaje/daño/recogidas de depuración están marcadas en sus archivos y se detallan en las fases siguientes; no equivalen a una victoria ni campaña natural.
- Ambas builds regeneradas e idénticas al cierre de UI: SHA-256 `d6fcab780f9a2001747db0e5ba736bcd52ed11159f7174deef835bfb0e9ea75f`. Los cambios posteriores de animaciones regeneran las builds; ver `docs/ANIMACIONES_INGAME.md`. `git diff --check` y comprobaciones de sintaxis ejecutadas sin errores.

### Evidencia y pendientes

[Antes de resultados](evidence/ui-rebuild/antes-resultados-1280x720.png) · [después](evidence/ui-rebuild/despues-resultados-1280x720.png) · [HUD](evidence/ui-rebuild/hud-vidas-escudo-hype-1280x720.png) · [pausa](evidence/ui-rebuild/pausa-1280x720.png) · [armería](evidence/ui-rebuild/armeria-1280x720.png) · [elección de combate](evidence/ui-rebuild/eleccion-disparo-1280x720.png) · [victoria simulada](evidence/ui-rebuild/victoria-simulada-1280x720.png). La carpeta `docs/evidence/ui-rebuild/` contiene el resto de capturas.

Pendiente fuera de este entorno: mando Xbox físico, lector de pantalla real y audio audible; campaña completa, muerte real del jefe final y victoria oficial natural. Las pruebas con depuración, ganchos temporales o mando simulado no prueban esos casos. Tampoco se afirma ausencia absoluta de regresiones del combate; se respetó el motor y se verificaron sólo los recorridos documentados.

### Archivos de la entrega

- `src/dd_ui_system.js`, `src/dd_rebuild_ui.css`: interfaz, estilos, HUD, resultados, controles y accesibilidad.
- `tools/build_active_html.py`, `index.html`, `DEADBEAT_DISCO.html`: integración con el motor y builds generadas.
- `tools/qa/test_restart_flow.js` y las pruebas `test_ui_results.js`, `test_native_armory.js`, `test_victory_presentation.js`, `test_combat_choices.js`, `test_hud_vitals.js`, `test_minimap_engine.js`, `test_modal_input.js`, `test_accessibility_dodge.js`, `test_options_controls.js`, `test_subtitles.js`.
- `tools/art_master/capture_game.js`, `tools/art_master/probe_player.js`: respetan la disponibilidad real de armas durante capturas.
- Este informe y `docs/evidence/ui-rebuild/`: auditoría y capturas comparativas.

---

## Decimotercera fase — subtítulos y avisos

- El canal HD ahora lee por separado `.subs-who` y `.subs-text` del canal original, sin concatenar palabras ni atribuir todos los avisos a Tempo. El retrato de Tempo sólo acompaña sus mensajes directos; otros emisores se presentan con su nombre real o sin emisor si el motor no lo proporciona.
- La visibilidad y duración de los mensajes del motor siguen a su clase `show`: no se impone un límite de cuatro segundos, no se vuelve a mostrar un texto retenido tras terminar y una aparición posterior idéntica puede mostrarse. Los mensajes directos de Refugio conservan su temporizador. Las capas de pausa, elección, mapa, tienda, resultados y menú ocultan temporalmente el subtítulo HD. El canal original se excluye del árbol accesible en edición HD y el nuevo es una región `status` para evitar doble anuncio. Esto no sustituye una prueba con lector de pantalla físico.
- `tools/qa/test_subtitles.js`: **PASS** con inyección limitada al contexto de prueba y partida modificada: emisor y cuerpo separados, aviso sin emisor, retrato correcto, duración mayor de cuatro segundos, pausa, descarte y repetición, canal directo y texto largo en cuatro tamaños. [Captura](evidence/ui-rebuild/subtitulo-tienda-1280x720.png). La prueba de minimapa verificó además la sincronización con el subtítulo real que el motor emite al entrar por depuración en una tienda.
- Regresiones de `DD_QUICK=1 test_ui_results.js`, `test_combat_choices.js` y `test_hud_vitals.js`: **PASS**, sin errores de navegador en esos recorridos. La suite general rápida usa una resolución; quedan pendientes lector de pantalla real, mando físico y campaña completa.

## Duodécima fase — minimapa del motor

- El minimapa HD ya no consulta el campo inexistente `getCanvasInfo().world` ni inventa un rectángulo para la sala. Copia el lienzo `#minimap` actualizado por `Zf()` en el propio render del motor, conservando su relación de aspecto y sin suavizado. Por ello mantiene los símbolos y las reglas de visibilidad originales, incluida la ocultación de salas no descubiertas. En el Refugio muestra «SIN INCURSIÓN» en lugar de reutilizar un mapa antiguo.
- El recuadro es ahora un botón accesible «Abrir torre de progresión», operable con Enter y con foco visible; al cerrar el panel se restaura el foco. No sustituye el mapa/inventario nativo ni cambia la exploración. [Captura](evidence/ui-rebuild/minimapa-motor-1280x720.png).
- `tools/qa/test_minimap_engine.js`: **PASS** en la build real: comparación de píxeles entre el canvas HD y una copia a escala del canvas original, tanto en la sala inicial como tras un viaje debug a la tienda (partida modificada); se verifica que el mapa cambia. Botón y geometría en 1920×1080, 1600×900, 1366×768 y 1280×720; Enter, Escape y retorno de foco. Sin errores de navegador. La comparación demuestra fidelidad a lo que el motor dibuja en esos estados, no cubre todas las plantas ni una campaña completa.
- Regresiones posteriores: `test_hud_vitals.js`, `DD_QUICK=1 test_ui_results.js`, `test_modal_input.js` y `test_accessibility_dodge.js` **PASS**. La suite general rápida sólo cubre una resolución. En la captura se detectó una posible concatenación del título y cuerpo del subtítulo heredado; queda pendiente revisarla separadamente.

## Undécima fase — vidas, escudo y HYPE/RAVE

- Se detectaron dos errores previos de interpretación: las vidas `ve/Me` del motor son unidades discretas (no puntos sobre cien), y `Re` es HYPE en escala 0–100. La antigua barra mezclaba HYPE y escudo, multiplicaba HYPE por 100 y mostraba un escudo como 1 %; además siempre dibujaba tres corazones incluso con la mejora de vida.
- El HUD presenta ahora un corazón por vida máxima real, indicador numérico de escudo independiente y barra/etiqueta HYPE. Durante RAVE muestra segundos restantes y la proporción respecto de `Oe`, igual que `Rl()` en el motor. El puente expone `raveDuration` de sólo lectura. No se han alterado las mecánicas. Las vidas y escudos tienen nombre accesible. [Captura](evidence/ui-rebuild/hud-vidas-escudo-hype-1280x720.png).
- `tools/qa/test_hud_vitals.js`: **PASS** en contexto aislado con mejora de vida y partida modificada: cuatro corazones, recogida debug de escudo, daño debug que consume escudo antes de vida, tres de cuatro corazones y barra al 75 %. HYPE al 25 % y RAVE se fuerzan mediante gancho de prueba temporal para contrastar escalas, no se presentan como una RAVE lograda jugando. Geometría del HUD comprobada en los cuatro tamaños solicitados. Sin errores de navegador.
- Regresiones en build actual: `DD_QUICK=1 test_ui_results.js`, `test_accessibility_dodge.js` y `test_modal_input.js`: **PASS**; la prueba general rápida usa una resolución. Builds idénticas. La revisión visual detectó además que el minimapa HD muestra el marcador «SALA ACTUAL»: consulta `getCanvasInfo().world`, campo que el puente no entrega. **Pendiente** integrar una representación auténtica del mapa del motor sin inventar la forma de la sala ni revelar información no visible.

## Décima fase — propiedad de entrada y foco modal

- Se reprodujo una interacción incorrecta en una partida aislada: con el mapa HD abierto, pulsar Q consumía una bomba en el motor. Los paneles HD de mapa/armería ahora interceptan la entrada de teclado antes del listener del motor, conservando la activación nativa de botones y los accesos I/M del Refugio. El puente suspende exclusivamente el sondeo de mando del motor mientras un modal HD está abierto, limpia su estado y exige volver a neutro al cerrarlo. Así B puede cerrar el panel sin esquivar a la vez. Esto **no pausa el combate**, no cambia acciones ni sus reglas fuera de los paneles y no pretende congelar el mundo.
- El menú principal queda `inert` durante un submenú; el HUD queda `inert` durante mapa/armería y se restaura al cerrar. Si una elección o pausa nativa aparece durante un panel HD, se cierra el panel HD sin robar el foco al diálogo nativo. No se ha añadido un gestor de diálogos nuevo.
- `tools/qa/test_modal_input.js`: **PASS** en contexto aislado con enemigos desactivados y mando simulado: Q/LB no gastan bombas tras el mapa, B lo cierra sin esquivar, Q vuelve a funcionar tras cerrar, Enter activa un botón del panel y una elección nativa forzada toma prioridad con foco correcto. Antes del ajuste se confirmó el consumo indebido con Q. Esta prueba no valida mando físico ni una campaña completa.
- Regresiones en build actual: `test_native_armory.js`, `test_combat_choices.js`, `test_accessibility_dodge.js`, `test_options_controls.js` y `DD_QUICK=1 test_ui_results.js`: **PASS**. La prueba de accesibilidad comprueba además que menú/HUD detrás del diálogo no aparecen en el árbol AX. Tienda nativa y elecciones se probaron geométricamente en cuatro tamaños; la suite rápida general sólo en uno. Sin errores de navegador en los recorridos. Persisten las limitaciones de lector de pantalla y mando físicos.

## Novena fase — configuraciones de esquiva y accesibilidad del navegador

- `tools/qa/test_accessibility_dodge.js`: **PASS** en Chromium a 1280×720. Inyecta un gancho sólo en la respuesta del contexto aislado para configurar las tres teclas admitidas por `_h` (Space, KeyV y AltLeft) y marca la partida como modificada. Para cada una se comprobó texto de ayuda, etiqueta HUD y ejecución efectiva de esquiva mediante la entrada original; se desactivaron enemigos para aislar la prueba. No valida una partida normal ni otras propiedades configurables de la esquiva.
- Se inspeccionó el árbol de accesibilidad de Chromium vía CDP: navegación principal, diálogo de Opciones y deslizador Maestro, diálogo/grupo/tres opciones de disparo, armería, mapa y resultados con botones nombrados. Se corrigió la navegación principal a `<nav>` nativo (contenía botones bajo un rol `menu` que esperaba elementos `menuitem`) y se vinculó el título al diálogo de Opciones. Sin errores de consola, excepciones ni solicitudes fallidas en el recorrido.
- `test_options_controls.js` volvió a pasar en cuatro tamaños; `DD_QUICK=1 test_ui_results.js` pasó en una resolución en la build actual. Las dos builds son idénticas.
- **No se pudo probar con lector de pantalla real ni mando Xbox físico:** este entorno no dispone de Orca, sintetizador de voz ni dispositivos `/dev/input`. El árbol AX no demuestra anuncios, orden de lectura ni experiencia real con tecnología asistiva; el mando simulado no demuestra compatibilidad física. Para cerrar estas pruebas, ejecutar el juego en un equipo del usuario con lector de pantalla activo y mando Xbox conectado: recorrer menú/opciones, diálogo de disparo, mapa, pausa y resultados; comprobar anuncio de nombre/estado/foco y acciones A/B/cruceta/Start, incluidos reintento y regreso. Registrar lector, navegador, sistema, mando y resultados.

## Octava fase — ayuda, accesibilidad y ciclo de opciones

- OPCIONES muestra ahora controles de teclado/ratón y Xbox contrastados con la ayuda que el motor genera en `El()`; la tecla de esquiva se obtiene del snapshot del motor. Se incluyeron Q para bomba, Shift para boost, E para interacción, Z para cambio de arma e I/M para mapa-inventario; mando con RT, B, LB, RB, A, Y, View y Start. Se mejoró el contraste del texto. [Captura](evidence/ui-rebuild/controles-opciones-1280x720.png).
- El HTML heredado tiene un texto inicial obsoleto que menciona espacio como bomba, pero el motor lo sustituye por `El()` al inicializar; la ayuda visible nueva no reutiliza esa cadena estática. No se alteraron las asignaciones del motor. La configuración de esquiva alternativa se lee del snapshot pero sólo se probó la predeterminada.
- El grupo accesible de elecciones se llama «Opciones disponibles», porque también se usa en tiendas y reemplazos, no sólo para tres variaciones. Se eliminó el listener de redimensionado de opciones al cerrar o cambiar de submenú para evitar acumulaciones.
- `tools/qa/test_options_controls.js`: **PASS** en la build generada: texto predeterminado, anchura a 1920×1080, 1600×900, 1366×768 y 1280×720, tres ciclos de apertura/cierre sin acumular listeners y etiqueta accesible. Sin errores de navegador. `test_combat_choices.js` volvió a pasar en la build actual. Esto no sustituye pruebas con lector de pantalla, mando físico o todas las opciones posibles.

## Séptima fase — elecciones de combate

- `tools/qa/test_combat_choices.js`: **PASS** sobre un contexto aislado con HTML instrumentado sólo en memoria. Se abren las opciones originales de variación mediante `et(true)` y las ofertas de riesgo entrando en salas no visitadas con `vg` y `encoreOffer` forzado. El modo de prueba marca la partida modificada y desactiva enemigos; no demuestra la aparición natural ni una ronda terminada sin depuración. No se han cambiado las reglas ni el código del motor.
- Variación: tres opciones reales, foco inicial y ciclo con Shift+Tab, selección con Enter, segunda elección con dirección/A de mando simulado y una sola actualización del historial por elección. Riesgo: rechazo por ratón y aceptación por dirección/A de mando simulado; se comprobó el estado real de riesgo y la bomba otorgada por el motor. HUD oculto en ambos diálogos.
- Se comprobaron límites de títulos y botones a 1920×1080, 1600×900, 1366×768 y 1280×720. Sin errores de consola, excepciones ni solicitudes fallidas en este recorrido. Capturas: [disparo](evidence/ui-rebuild/eleccion-disparo-1280x720.png) y [riesgo](evidence/ui-rebuild/eleccion-riesgo-1280x720.png).
- Pendientes: activación natural durante una campaña, otras consecuencias y variantes de elecciones, mando Xbox físico y revisión de pantallas a tamaños adicionales.

## Sexta fase — cierre de victoria y partidas modificadas

- Resultados distingue la victoria oficial, el final de una partida modificada y una victoria suprimida por modificación. Se usan los campos `won`, `tainted` y `victorySuppressed` que ya entrega el motor; el cierre, sus reglas y recompensas no se alteran.
- `tools/qa/test_victory_presentation.js`: **PASS** a 1280×720. En un contexto aislado de navegador intercepta temporalmente el HTML e instala un gancho de prueba que fuerza la sala 100 y la bandera del jefe final antes de llamar a `pp()`. El motor ejecuta su cierre `fp()`: se verificaron título, resumen y registro de victoria, ocultación del HUD, reintento, y que una segunda ejecución marcada modificada no incrementa el contador oficial, seguida del retorno al menú. Sin errores de consola, excepciones ni solicitudes fallidas. [Captura de victoria simulada](evidence/ui-rebuild/victoria-simulada-1280x720.png).
- Esta prueba **no** verifica el combate con el jefe final, la cadena de muerte real ni una campaña completada; la victoria oficial simulada se escribió únicamente en el almacenamiento efímero del contexto de prueba. No confundirla con una partida ganada sin depuración.
- `DD_QUICK=1 tools/qa/test_ui_results.js`: **PASS** en la build actual, incluido muerte modificada, reintento, rendición, retorno, mando simulado y nueva partida; sólo una resolución. Siguen pendientes elecciones de combate, mando físico, audio audible y campaña real.

## Quinta fase — compras y confirmación del motor

- Se eliminó el bypass del puente que descontaba créditos y reemplazaba directamente un arma durante una incursión. En partida el catálogo HD sólo permite equipar armas ya adquiridas; para las demás indica que deben conseguirse en las tiendas o recompensas del motor. La prueba gratuita sigue limitada al Refugio sin partida activa. El motor de compra, los precios, los límites y el diálogo de reemplazo no se modificaron.
- `tools/qa/test_native_armory.js` usa viaje y créditos de depuración sobre el juego real (partida no oficial): abre una tienda real, confirma una compra con A de mando simulado, comprueba cobro exacto y equipamiento, cambia a un arma ya adquirida sin modificar el saldo, vuelve atrás en la selección de reemplazo sin cobro y finalmente confirma otro reemplazo con un único cobro. OK; sin excepciones ni errores de consola. La confirmación se comprobó a 1920×1080, 1600×900, 1366×768 y 1280×720. [Captura](evidence/ui-rebuild/confirmacion-tienda-1280x720.png). No es una campaña completa ni una prueba con mando físico.
- `test_ui_results.js` comprobó que, con saldo suficiente e incluso solicitando `freePreview`, el puente no compra ni reemplaza fuera de la tienda. La ejecución completa tras el cambio de compra pasó; una ejecución posterior con cuatro resoluciones excedió el tiempo disponible tras el reintento. En la ejecución rápida posterior (1280×720) se detectó un retraso en el primer sondeo de mando al aparecer resultados: se corrigió y la prueba rápida completa pasó. Las comprobaciones de las cuatro resoluciones para la confirmación nativa corresponden a la build final; la prueba rápida de la interfaz no sustituye una repetición completa de todas las resoluciones en esa build.
- Los diálogos de elección del motor ocultan el HUD y comparten la tipografía de pausa/resultados. El foco y las transacciones del motor se conservan.
- Las herramientas de capturas de arte que antes forzaban armas no adquiridas mediante el puente ahora omiten esas capturas en vez de etiquetar erróneamente la imagen de otra arma. Esto limita sus capturas de armas no adquiridas; no se ha añadido una vía de adquisición de depuración nueva.

## Cuarta fase — armería y mapa

- El catálogo abría vacío porque el filtro inicial era `ALL` y la opción real era `TODAS`. Ahora muestra las armas desde la primera apertura, reconstruye las categorías si el catálogo aparece más tarde y toma familia, nombre y precio del catálogo real. La M1911 conserva precio cero; se han eliminado valores por defecto y barras de porcentaje sin escala que presentaban estadísticas engañosas. El inspector muestra valores numéricos disponibles y resultado de la acción. En el Refugio se explica que es una prueba sin coste que se reinicia al empezar una incursión.
- El mapa toma los nombres del motor: **Limbo es el círculo I**, el Refugio es un estado separado y el Núcleo es final, no círculo IX. Ya no afirma que niveles estén bloqueados o superados sin datos. La lista admite desplazamiento con teclado y mando simulado; los modales limitan Tab al panel, colocan y restauran el foco.
- En combate `I`/`M` se dejan al inventario/pausa original del motor, evitando abrir simultáneamente el mapa HD y la pausa; los accesos rápidos HD con esas teclas se mantienen en el Refugio. Se retiraron las etiquetas de atajo equívocas del HUD.
- Prueba `test_ui_results.js` en la build final: catálogo de 120 armas, precio cero y precio de Magnum, previsualización y reinicio de arma al entrar en partida, fallo de compra con créditos insuficientes sin cobro ni cambio de equipo, mapa en Refugio y Limbo, desplazamiento con mando simulado, `M` sin doble pantalla, y resto de flujo de resultados: OK. Se comprobaron los límites de armería y mapa a 1920×1080, 1600×900, 1366×768 y 1280×720. Sin excepciones ni peticiones fallidas en ese recorrido. Capturas: [armería](evidence/ui-rebuild/armeria-1280x720.png) y [torre](evidence/ui-rebuild/torre-refugio-1280x720.png).
- **Riesgo pendiente de economía:** el puente `buyOrEquipWeapon` ya existente efectúa adquisición/equipamiento directo y no sigue la interacción de tienda/confirmación de reemplazo original del motor. En esta fase **no se ha cambiado esa lógica** ni validado una compra con saldo suficiente; sólo se corrigieron los datos y mensajes presentados. Debe auditarse y acordarse una integración que respete reglas de la tienda y selección de reemplazo antes de afirmar que toda la economía está intacta. También falta probar mando físico y campaña completa.

## Tercera fase — pausa, foco y conflictos de entrada

- El fallo anterior de «entrada prematura» se investigó: el test tomaba la secuencia y el estado del Refugio en dos evaluaciones separadas; `finish()` puede ejecutarse entre ambas. La comprobación ahora toma una muestra atómica. La ejecución aislada posterior obtuvo **65/65**, incluida esa comprobación. Una ejecución concurrente con otra prueba pesada obtuvo 63/65 por dos límites de tiempo de descenso excedidos; se conserva como evidencia de sensibilidad a carga, no se relajaron los límites. La ejecución 65/65 precede a los últimos ajustes de foco y estilo de pausa.
- Escape sobre mapa o armería se captura antes del listener del motor: cierra el modal sin abrir la pausa con la misma pulsación. Resultados mantienen Tab/Shift+Tab dentro de sus tres controles.
- El overlay original se oculta en cuanto aparece resultados, para que A no active simultáneamente el botón de reintento heredado. La prueba comprueba que volver al menú con A deja el motor parado.
- La pausa usa tipografía coherente con resultados y oculta el HUD mientras está visible. Se oculta la insignia de depuración visual en la edición HD; las entradas F9/Alt+D no se modifican. [Captura de pausa](evidence/ui-rebuild/pausa-1280x720.png).
- `test_ui_results.js` se ejecutó sobre la build final: OK en inicio, HUD y daño, Escape del mapa sin pausa, mezcla de audio persistente, pausa/continuación por teclado y Start/A simulados, muerte mediante playtest, navegación y foco de resultados, reintento, retorno y nueva partida. Se comprobaron los límites de los tres bloques del HUD y los botones de pausa en 1920×1080, 1600×900, 1366×768 y 1280×720, y resultados en seis tamaños. Sin errores de consola o solicitudes fallidas en ese recorrido. La posición del mapa de la pausa y los demás contenidos desplazables aún requieren revisión visual en más ventanas y con mando real.

## Segunda fase — resultados e integración (actualización)

- El cierre original `fp()` sigue haciendo todos los cálculos y guardados; después se presenta `#dd-results` con sala, puntuación, bajas, tiempo y el resumen textual original. El reintento usa el arranque existente del puente; menú principal utiliza `DD_BOOT.exitGameToMenu()`. El HUD se oculta en resultados y el overlay anterior queda oculto al volver al menú. No se duplican los cálculos de la sesión.
- La pantalla permite ratón, teclado y mando simulado: selección, reintento, menú y apertura del resumen completo. Tiene foco visible y disposición adaptable. El tratamiento de victoria usa el mismo resultado del motor, pero **la victoria real no se ha alcanzado ni validado**.
- El HUD ya no identifica la bomba como ESP: usa Q; esquiva muestra ESP/V/ALT según la configuración real del motor. Con mando muestra LB/RB/B. `pollGamepad` permite recorrer y activar controles de armería y mapa, conservando el foco tras redibujar una tarjeta o filtro.
- [Antes](evidence/ui-rebuild/antes-resultados-1280x720.png) y [después](evidence/ui-rebuild/despues-resultados-1280x720.png): capturas reales a 1280×720 tras rendirse, respectivamente de la build del commit base y de la nueva. Las partidas y sus tiempos no son idénticos.

### Pruebas realizadas en navegador

Se instaló temporalmente `playwright-core` y Chromium en dependencias ignoradas (`node_modules`/`.cache`), sin añadir dependencias de producción. Chromium se ejecutó con bibliotecas de `@sparticuz/chromium`. Se sirvió la build real por HTTP.

- `tools/qa/test_ui_results.js`: OK. Cubre inicio, navegación/cierre de armería y mapa con mando simulado, HUD y actualización tras daño, pausa/reanudación, B sin apertura de mapa, muerte mediante `DMO.playtest.hurt` (partida marcada por el motor como modificada), resultados y resumen, reintento con teclado, rendición, resumen y regreso con mando simulado, y nueva partida. No se observaron errores de consola, excepciones ni peticiones fallidas en ese recorrido.
- Geometría de título, estadísticas y botones de resultados: OK a 1920×1080, 1600×900, 1366×768, 1280×720, 1024×768 y 2560×1080. Esto no equivale a comprobar todos los módulos en todas las resoluciones.
- `tools/qa/test_restart_flow.js`: 64/65 comprobaciones superadas. **Fallo:** «no se entra al Refugio antes de terminar la secuencia»; requiere investigación. El resto incluyó menú, opciones, intro, mando simulado, guardado y siete tamaños de ventana. Esa ejecución se hizo antes de la integración de resultados; no se debe asumir que cubra los cambios posteriores.
- Quedan sin validar: victoria real, mando físico Xbox, audio audible, compras/economía completas, transiciones y modales de combate en todas las condiciones, y ausencia de regresiones de juego en una campaña completa. La revisión integral de HUD y menús sigue pendiente.

Las secciones siguientes conservan el inventario y las limitaciones de la primera fase; donde contradigan esta actualización prevalece esta sección.

## Fuentes y arquitectura

- `tools/build_active_html.py` parte de `backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html`, inserta el puente al motor y embebe CSS/JS; genera `index.html` y `DEADBEAT_DISCO.html`, idénticos. No editar las builds a mano.
- `src/dd_boot.js`: estados BOOT, LOADING, INTRO, MAIN_MENU, SUBMENU, EXIT, PLAYING; `src/dd_opening.js`: intro; `src/dd_cinematic_camera.js`: cámara/transiciones; `src/dd_hub_system.js`: refugio y accesos; `src/dd_world_renderer.js`: mundo; `src/dd_asset_registry.js`: recursos.
- `src/dd_ui_system.js` y `src/dd_rebuild_ui.css`: menú, submenús, HUD, tienda/mapa y diálogos nuevos. El motor y varias interfaces originales siguen embebidos en la copia protegida. `ART_PACK`, `assets/ui`, `assets/fonts`, `assets/logos` y `ART_REFERENCES` contienen recursos y referencias; no se han borrado.
- La build original contiene numerosas capas CSS históricas y scripts minificados. Que exista un selector o un módulo no demuestra que esté visible o sea alcanzable en todos los estados.

## Inventario y clasificación preliminar

| Superficie | Implementación descubierta | Estado / trabajo restante |
|---|---|---|
| Carga e intro | `DD_BOOT`, `DD_OPENING` | ACTUAL; comprobar errores, omisión y accesibilidad. |
| Portada | `#dd-main-menu` en `DD_UI`; `#ddc-cover` heredada oculta en edición HD | ACTUAL / DUPLICADA: la portada antigua sigue siendo dependencia de audio y otros flujos; no eliminar. |
| Opciones, créditos, confirmaciones y salida | `#dd-submenu`, controles y almacenamiento en `DD_UI` | ACTUAL; verificar teclado, sliders, foco, mando y vuelta. |
| Refugio e inicio/continuar | `DD_UI`, `DD_BOOT`, `DD_HUB` y puente `__DD_BRIDGE` | ACTUAL; validar transiciones y guardados reales. |
| HUD | `#dd-hud`, `updateHud`, snapshot en `build_active_html.py`; HUD anterior oculto por CSS | ACTUAL / DUPLICADO: el snapshot proporciona salud/máximo, escudo/RAVE, créditos, nivel, bombas, boost, arma, sala, posición de enemigos y jefe. Comprobar etiquetas, escalado y valores reales; no se han añadido estadísticas. |
| Diálogo DJ | `#dd-dialogue-box`, temporizador de `DD_UI`; subtítulos heredados | ACTUAL / posible DUPLICADO: verificar qué capa se muestra en cada escena. |
| Armería y mapa | `#dd-shop-modal`, `#dd-map-modal`, puente de armas y sistema del refugio; interfaces del motor también existen | ACTUAL / posible DUPLICADO: revisar navegación completa, foco, compras y semántica del mapa. |
| Pausa y mezcla de audio | `#pause-overlay`, `#audio-panel`, controles originales del motor | OBSOLETO respecto al menú HD; primera armonización CSS aplicada, sin sustituir controles. Pendientes opciones completas, navegación y retorno al menú. |
| Elección de disparo y riesgo | `#shot-choice-overlay`, `#risk-choice-overlay`, controlados por el motor | OBSOLETO respecto al menú HD; primera armonización CSS aplicada. No cambiar elecciones ni reglas. |
| Derrota/victoria y resultados | `#overlay`, `#summary`, botón `#start-btn`; también existe panel de resultados `ddc` heredado con reintento, compartir, tienda y portada | OBSOLETO / DUPLICADO / integración INCOMPLETA por verificar: la edición HD oculta `#ddc-cover`; es necesario comprobar qué presentación realmente recibe el jugador y conectar resultados al menú actual sin romper los callbacks originales. No se ha implementado aquí el nuevo GAME OVER. |
| Ayuda | `#help-panel` heredado y controles expuestos en opciones | DUPLICADO / posible contenido desactualizado: hay textos históricos que discrepan; contrastar con el input real antes de corregir. |
| Inventario y mejoras | tienda, selección de disparo y elementos originales del motor | ACTUAL + heredado; diferenciar catálogo, progresión y equipamiento sin cambiar economía. |
| Feedback | `sfx`/audio de menú en `DD_UI`, mezcla original y subtítulos; estados visuales CSS | INCOMPLETO por validar en ejecución; comprobar niveles y modo silencioso. |
| Mando / teclado | listeners de `DD_UI`, entrada original y `pollGamepad` | INCOMPLETO: revisar propiedad de entrada en pausa, resultados y modales; pruebas con mando real pendientes. |

Las categorías son hipótesis derivadas de lectura estática, no un certificado de funcionamiento. No se declara ninguna mecánica ausente solo porque el puente no la exponga.

## Mapa de navegación identificado

`BOOT → LOADING → INTRO → MAIN_MENU ↔ SUBMENU`; nueva/continuar → transición → refugio → descenso/partida. Desde partida existen pausa, elección de disparo/riesgo y mapa/armería; al terminar el motor prepara resumen de derrota o victoria. **La transición desde ese resumen a reintento y menú HD debe verificarse**: el motor contiene rutas heredadas y la portada `ddc` está oculta. No se afirma que el flujo completo funcione.

## Primera fase implementada

- Tokens de superficie, acento, texto y foco en el CSS existente; tratamiento visual común para pausa, riesgo y elección de disparo, con controles originales y sus eventos intactos.
- Foco visible de alto contraste para controles nuevos y diálogos del motor; tamaño mínimo de botones en estos diálogos, padding seguro, desplazamiento vertical y reducción de movimiento para interfaces HD.
- Retirada de la apertura del mapa con B en el caso general de `pollGamepad`: B también está documentado como esquiva en combate. B sigue cerrando los modales propios. El acceso al mapa por teclado y el acceso del refugio permanecen. Verificar en ejecución el botón View del motor y la navegación de todos los modales.
- Builds regeneradas mediante el constructor. No se han tocado combate, IA, armas, economía, progresión, física ni generación. Esto es una descripción del alcance del diff, **no una garantía de ausencia de regresiones**.

## Verificaciones realizadas

- `python3 tools/build_active_html.py`: OK; segunda ejecución produce el mismo SHA-256 en ambas builds.
- `node --check src/dd_ui_system.js` y `python3 -m py_compile tools/build_active_html.py`: OK.
- Comprobación estática: ambas builds son idénticas e incluyen exactamente las fuentes CSS y JS; el caso general de B ya no llama a `openMap`.
- `node tools/qa/selfcontained.js`: NO ejecutable aquí: falta `puppeteer-core`. Tampoco se ha encontrado navegador Chromium/Firefox en el sistema. Esto no prueba que el juego funcione ni que carezca de errores JS en ejecución.

## Pendiente para terminar la entrega solicitada

1. Instalar un entorno QA con Chromium y `playwright-core`/`puppeteer-core`; ejecutar los scripts de `tools/qa` y registrar errores, consola, solicitudes y duplicación de eventos.
2. Probar carga → intro → menú → refugio → combate → pausa → reanudar → derrota/victoria → resultados → reintento y menú → nueva partida, incluyendo guardados y estado del HUD.
3. Reconstruir resultados y regreso al menú sobre el flujo real, sin duplicar gestores; confirmar estadísticas y callbacks del motor. Integrar opciones desde pausa si procede.
4. Resolver navegación de mando y teclado en tienda, mapa, pausa, elecciones y resultados; probar mando Xbox físico además de simulación. Comprobar que B esquiva y View abre el mapa apropiado.
5. Validar visualmente y con capturas antes/después a 1920×1080, 1600×900, 1366×768, 1280×720 y relaciones distintas; revisar solapamientos, contraste y movimiento reducido. No se generaron capturas en esta fase.
6. Revisar valores y atajos del HUD contra el motor, ayudas contradictorias, comportamiento responsive y audio; completar la unificación del resto de superficies.

Archivos modificados: `src/dd_rebuild_ui.css`, `src/dd_ui_system.js`, `index.html`, `DEADBEAT_DISCO.html` y este informe.
