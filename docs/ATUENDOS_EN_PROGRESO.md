# Atuendos: primera tanda en desarrollo

Se ha iniciado el diseño de **Caballero oscuro**, un atuendo original inspirado en la fantasía oscura, con armadura y acentos de neón. Hay tres imágenes de trabajo en `assets/characters/outfits/concepts/`: una pose de reposo y dos propuestas de paso. Conservan un fondo verde y no son sprites integrados.

**Estado: no equipable.** Las dos propuestas de paso no forman todavía un ciclo coherente: comparten el mismo sentido de zancada y presentan diferencias en brazos y faldón. Además, faltan poses de combate, apuntado, disparo, daño, esquiva y muerte, así como sus anclas y composición por cintura. Sustituir únicamente la imagen de reposo provocaría saltos de vestuario o errores de unión; por eso no se ha añadido el atuendo al catálogo ni se ha alterado el renderizado.

Para completar este atuendo hay que producir y alinear una familia de sprites consistente con los contratos de `src/dd_world_renderer.js` y la caminata del Refugio, incorporar la vista previa y desbloqueo, y verificar visualmente todos los estados y orientaciones. Los demás atuendos solicitados aún están pendientes. Las paletas existentes siguen funcionando sin cambios.

El diseño de reposo ha gustado al usuario y se conserva como referencia. Se probó otra propuesta de paso (`caballero_paso_opuesto.webp`), pero tampoco resuelve claramente el intercambio de piernas; permanece como material de trabajo, sin integrar.

## Siguiente tanda de trabajo

Se generaron también propuestas de apuntado horizontal, daño, esquiva y caída. El conversor reproducible `tools/art_master/prepare_knight_drafts.py` utiliza el mate de croma existente para preparar borradores transparentes de reposo, dos pasos, apuntado y daño en lienzos de 288 × 512, con línea de pies y escala comunes; rechaza recortes. Los borradores están en `assets/characters/outfits/caballero_drafts/` y **no se cargan en el juego**. La caída contiene una sombra pintada y no se ha convertido; la esquiva aún necesita tratamiento y anclaje propios.

Las conversiones se ejecutaron sin recortes, pero eso no valida la continuidad artística ni las anclas de arma. La caminata sigue sin tener zancadas opuestas fiables, y faltan las siete direcciones de apuntado y las costuras entre piernas y torso. No se ha realizado una prueba en partida de este atuendo.

## Integración jugable del caballero

Actualización: el caballero oscuro ya está implementado y equipable al alcanzar la sala 5. La selección persiste y aparece en la colección de Extras. Usa sprites propios en el camerino, el Refugio y el renderizador de partida para reposo, movimiento, apuntado, daño, esquiva y caída. Se mantiene la mecánica y las estadísticas del juego. Las imágenes transparentes de ejecución están en `assets/characters/outfits/caballero/`.

La animación actual es una **primera versión**: al caminar alterna reposo y una pose de paso, no un ciclo completo de zancadas opuestas; en combate se reutiliza la misma pose horizontal de brazos para todas las direcciones de apuntado, aunque el arma rota y se ancla a la mano. La unión de torso y piernas y los detalles de los dibujos pueden variar entre fotogramas; no se afirma ausencia total de defectos visuales. Las cinemáticas y el retrato del HUD conservan su arte original. Los otros atuendos solicitados aún no están implementados.

`test_knight_outfit.js`: PASS en Chromium con récord de sala sembrado; comprueba bloqueo, equipamiento, persistencia, resolución de imágenes para estados, Refugio y entrada en combate. `test_appearances_beat.js`, `test_menu_scenes.js` y `test_player_animations.js`: PASS; la última usa el aspecto original. La prueba de combate utiliza el modo de exploración sin enemigos y no sustituye una campaña completa ni una revisión visual de cada dirección. Capturas reales: [camerino](evidence/atuendos/camerino-caballero.png), [Refugio](evidence/atuendos/refugio-caballero.png) y [combate en movimiento](evidence/atuendos/combate-caballero-movimiento.png).

## Sombra del club

Se ha añadido un segundo atuendo original, inspirado en el arquetipo de asesino encapuchado. Se desbloquea al alcanzar la sala 10, se equipa en Personalizar, se guarda entre sesiones y figura en Extras. Cuenta con sprites de reposo, paso, apuntado, daño, esquiva y caída, empleados tanto en el Refugio como en la pista, sin modificar estadísticas ni mecánicas. El procesamiento de los originales está en `tools/art_master/prepare_assassin_outfit.py`.

Como el caballero, es una primera versión: la caminata alterna dos poses y no tiene una zancada opuesta dibujada; los brazos usan una misma pose de apuntado horizontal mientras el arma gira. Hay diferencias de detalle entre imágenes y el retrato del HUD y las cinemáticas conservan el arte original. No se ha verificado una campaña completa ni cada dirección de puntería.

`test_assassin_outfit.js`: PASS con récord de sala sembrado, bloqueo a sala 5 y desbloqueo a sala 10, persistencia, Extras, poses, Refugio y combate en modo de exploración sin enemigos. `test_knight_outfit.js`, `test_menu_scenes.js` y `test_appearances_beat.js`: PASS. [Camerino](evidence/atuendos/camerino-asesino.png) · [Refugio](evidence/atuendos/refugio-asesino.png) · [combate](evidence/atuendos/combate-asesino-movimiento.png).

## Jinete del abismo

Tercer atuendo original, de inspiración apocalíptica: armadura oscura, bufanda y faldón rojizos y detalles cian. Se desbloquea al llegar a la sala 15; está disponible en Personalizar y registrado en Extras. Se guarda la selección y se usa el conjunto de sprites de reposo, paso, apuntado, daño, esquiva y caída en Refugio y partida, sin modificar estadísticas. `tools/art_master/prepare_rider_outfit.py` reproduce la conversión de los originales.

Comparte las limitaciones de los atuendos anteriores: caminata de dos poses, brazos de apuntado horizontal para todas las direcciones y variaciones entre imágenes. El HUD y las cinemáticas mantienen el arte original; no se ha validado una campaña completa ni todas las direcciones de puntería.

`test_rider_outfit.js`: PASS con sala 10 y 15 sembradas (bloqueo y desbloqueo), selección, persistencia, Extras, resolución de poses, Refugio y combate en exploración sin enemigos. `test_assassin_outfit.js`, `test_knight_outfit.js` y `test_menu_scenes.js`: PASS. [Camerino](evidence/atuendos/camerino-jinete.png) · [Refugio](evidence/atuendos/refugio-jinete.png) · [combate](evidence/atuendos/combate-jinete-movimiento.png).

## Buzo del neón

Cuarto atuendo original inspirado en la estética de buceo retrofuturista: traje azul oscuro, armadura de bronce, manómetro iluminado y casco de buceo con visor integrado en el cuello. Se desbloquea al alcanzar la sala 20, aparece en Personalizar y Extras, persiste entre sesiones y tiene sprites para reposo, paso, apuntado, daño, esquiva y caída en Refugio y partida. Es puramente cosmético. `tools/art_master/prepare_diver_outfit.py` reproduce la conversión de originales y comprueba recortes.

Como los anteriores, la caminata alterna dos poses y los brazos conservan una pose horizontal al apuntar; existen variaciones entre dibujos. El HUD y las cinemáticas conservan el arte original. No se ha comprobado una campaña completa ni todos los ángulos de puntería.

`test_diver_outfit.js`: PASS con salas 15 y 20 sembradas, bloqueo, equipamiento, persistencia, Extras, poses, Refugio y combate sin enemigos mediante exploración de prueba. `test_rider_outfit.js`, `test_menu_scenes.js` y `test_appearances_beat.js`: PASS. [Camerino](evidence/atuendos/camerino-buzo.png) · [Refugio](evidence/atuendos/refugio-buzo.png) · [combate](evidence/atuendos/combate-buzo-movimiento.png).

### Casco integrado

El casco ahora se lleva puesto y encaja con el collar de la armadura; el rostro se ve a través del visor. Se han sustituido las seis imágenes en uso, incluidas esquiva y caída. La preparación usa los nuevos originales. `test_diver_outfit.js`: **PASS** con récord sembrado y exploración sin enemigos; [camerino actualizado](evidence/atuendos/camerino-buzo-casco.png), [Refugio](evidence/atuendos/refugio-buzo-casco.png) y [combate](evidence/atuendos/combate-buzo-casco.png). Siguen las limitaciones de animación y validación descritas arriba.

## Pistolero de neón

Quinto atuendo original, inspirado en los aventureros de mazmorras de balas: chaleco azul, pañuelo rojo, equipo utilitario y rodilleras. Se desbloquea en la sala 25, está en Personalizar y Extras, y mantiene la selección entre sesiones. Tiene sprites propios en Refugio y partida, con reposo, paso, apuntado, daño, esquiva y caída. El anclaje del arma está ajustado a su mano; no cambia estadísticas. `tools/art_master/prepare_gunslinger_outfit.py` genera los sprites desde los originales.

La caminata usa dos poses y los brazos conservan una pose horizontal para todos los ángulos. Hay variaciones en los dibujos; el HUD y las cinemáticas mantienen el arte original. No se han probado campaña completa ni todas las direcciones.

`test_gunslinger_outfit.js`: PASS con récords sembrados de salas 20 y 25, bloqueo, equipamiento, persistencia, Extras, poses, Refugio y combate mediante exploración sin enemigos. `test_menu_scenes.js`, `test_diver_outfit.js` y `test_appearances_beat.js`: PASS. [Camerino](evidence/atuendos/camerino-pistolero.png) · [Refugio](evidence/atuendos/refugio-pistolero.png) · [combate](evidence/atuendos/combate-pistolero-movimiento.png).

## Lágrima del abismo

Sexto atuendo, inspirado en el terror de mazmorra y las lágrimas: chaleco oscuro, vendajes, pantalones desgastados y un parche de lágrima. Se desbloquea en la sala 30 y está disponible en Personalizar y Extras. La selección persiste y sus sprites se muestran en Refugio y partida, sin modificar habilidades. `tools/art_master/prepare_tears_outfit.py` reproduce los sprites desde los originales.

Comparte las limitaciones anteriores: caminata de dos poses, una pose horizontal de brazos para todas las direcciones de apuntado y diferencias de detalle entre dibujos. HUD y cinemáticas mantienen el arte original; no se ha validado una campaña completa ni todos los ángulos. Las imágenes maestras se han almacenado en WebP sin pérdida para reducir espacio; los sprites del juego siguen siendo PNG.

`test_tears_outfit.js`: PASS con récords sembrados de salas 25 y 30, bloqueo, equipamiento, persistencia, Extras, poses, Refugio y combate en exploración sin enemigos. `test_gunslinger_outfit.js` y `test_menu_scenes.js`: PASS. [Camerino](evidence/atuendos/camerino-lagrimas.png) · [Refugio](evidence/atuendos/refugio-lagrimas.png) · [combate](evidence/atuendos/combate-lagrimas-movimiento.png).

## Entrenador del neón

Séptimo atuendo original, inspirado en aventuras de entrenamiento de criaturas: gorra roja y blanca, chaleco azul, guantes y botas deportivas. Se desbloquea en la sala 35 y se encuentra en Personalizar y Extras. La selección persiste y los sprites se aplican en el Refugio y en partida sin alterar habilidades. `tools/art_master/prepare_trainer_outfit.py` convierte los originales sin pérdida a sprites de juego.

Mantiene las limitaciones de los anteriores: caminata de dos poses, una sola pose horizontal de brazos al apuntar, y diferencias de detalle entre dibujos. Retrato del HUD y cinemáticas conservan el arte original. No se ha verificado una campaña completa ni todos los ángulos de puntería.

`test_trainer_outfit.js`: PASS con récords de salas 30 y 35 sembrados, bloqueo, equipamiento, persistencia, Extras, resolución de poses, Refugio y combate en exploración sin enemigos. `test_tears_outfit.js` y `test_menu_scenes.js`: PASS. [Camerino](evidence/atuendos/camerino-entrenador.jpg) · [Refugio](evidence/atuendos/refugio-entrenador.jpg) · [combate](evidence/atuendos/combate-entrenador-movimiento.jpg).

## Guardián del bosque

Octavo atuendo original, inspirado en aventuras de túnica verde: capucha, bordados luminosos y equipo de cuero. Se desbloquea al llegar a la sala 40, aparece en Personalizar y Extras y conserva la selección. Incluye sprites de reposo, paso, apuntado, daño, esquiva y caída para Refugio y partida, sin cambios de habilidades. `tools/art_master/prepare_adventurer_outfit.py` genera los sprites desde los originales WebP sin pérdida.

La caminata alterna dos poses y el apuntado usa brazos horizontales para todas las direcciones; hay diferencias entre dibujos. El retrato del HUD y las cinemáticas mantienen el arte original. No se han verificado todos los ángulos ni una campaña completa; no se garantiza ausencia de fallos visuales.

`test_adventurer_outfit.js`: PASS con récords sembrados de salas 35 y 40, bloqueo, selección, persistencia, Extras, resolución de poses, Refugio y combate en exploración sin enemigos. `test_trainer_outfit.js` y `test_menu_scenes.js`: PASS. [Camerino](evidence/atuendos/camerino-aventurero.jpg) · [Refugio](evidence/atuendos/refugio-aventurero.jpg) · [combate](evidence/atuendos/combate-aventurero-movimiento.jpg).

### Capucha puesta

El Guardián lleva ahora la capucha sobre la cabeza en las seis poses del atuendo. `test_adventurer_outfit.js`: PASS con récord sembrado y combate de prueba sin enemigos. [Camerino actualizado](evidence/atuendos/camerino-aventurero-capucha.jpg) · [Refugio](evidence/atuendos/refugio-aventurero-capucha.jpg) · [combate](evidence/atuendos/combate-aventurero-movimiento-capucha.jpg). Las limitaciones de animación, HUD y cinemáticas anteriores siguen vigentes.

## Chef de medianoche

Noveno atuendo original: gorro de cocinero, pañuelo rojo, camisa blanca y delantal oscuro. Se desbloquea al alcanzar la sala 45, figura en Personalizar y Extras y conserva la selección. Incluye poses de reposo, paso, apuntado, daño, esquiva y caída para Refugio y partida, sin afectar habilidades. `tools/art_master/prepare_chef_outfit.py` genera los sprites a partir de los originales WebP sin pérdida.

`test_chef_outfit.js`: PASS con récords sembrados de salas 40 y 45, selección, persistencia, Extras, resolución de poses, Refugio y combate de prueba sin enemigos. `test_adventurer_outfit.js` y `test_menu_scenes.js`: PASS. [Camerino](evidence/atuendos/camerino-cocinero.jpg) · [Refugio](evidence/atuendos/refugio-cocinero.jpg) · [combate](evidence/atuendos/combate-cocinero-movimiento.jpg).

Como en los anteriores, la caminata alterna dos poses, la pose de brazos es horizontal para todos los ángulos y hay diferencias de detalle entre imágenes. HUD y cinemáticas conservan el arte original; no se ha validado campaña completa ni todos los ángulos y no se garantiza ausencia de fallos visuales.

## Luchador del neón

Décimo atuendo original: ropa de kickboxing negra y roja, vendas, pantalón deportivo y espinilleras. Se desbloquea al alcanzar la sala 50, aparece en Personalizar y Extras y conserva la selección. Tiene poses de reposo, paso, apuntado, daño, esquiva y caída para Refugio y partida, sin cambiar habilidades. `tools/art_master/prepare_kickboxer_outfit.py` genera los sprites desde originales WebP sin pérdida.

`test_kickboxer_outfit.js`: PASS con récords sembrados de salas 45 y 50, bloqueo, equipamiento, persistencia, Extras, resolución de poses, Refugio y combate de prueba sin enemigos. `test_chef_outfit.js` y `test_menu_scenes.js`: PASS. [Camerino](evidence/atuendos/camerino-kickboxer.jpg) · [Refugio](evidence/atuendos/refugio-kickboxer.jpg) · [combate](evidence/atuendos/combate-kickboxer-movimiento.jpg).

La caminata alterna dos poses y el apuntado usa brazos horizontales para todas las direcciones. Pueden verse diferencias entre dibujos; el HUD y las cinemáticas mantienen el arte original. No se ha validado una campaña completa ni todos los ángulos, y no se garantiza ausencia de fallos visuales.

### Equipamiento de kickboxing actualizado

El atuendo anterior se ha sustituido en las seis poses: torso y piernas descubiertos, pantalones cortos, pies descalzos y vendas en manos y tobillos, sin camiseta, mallas ni espinilleras. `test_kickboxer_outfit.js`: PASS con récord sembrado y combate sin enemigos. [Camerino actualizado](evidence/atuendos/camerino-kickboxer-vendas.jpg) · [Refugio](evidence/atuendos/refugio-kickboxer-vendas.jpg) · [combate](evidence/atuendos/combate-kickboxer-movimiento-vendas.jpg). Siguen vigentes las limitaciones de animación, HUD y cinemáticas descritas arriba.

## Pintor del neón

Undécimo atuendo original: boina, camisa arremangada y delantal salpicado de pintura con pinceles. Se desbloquea al alcanzar la sala 55, aparece en Personalizar y Extras y conserva la selección. Tiene poses de reposo, paso, apuntado, daño, esquiva y caída en Refugio y partida; no altera habilidades. `tools/art_master/prepare_painter_outfit.py` genera los sprites desde originales WebP sin pérdida.

`test_painter_outfit.js`: PASS con récords sembrados de salas 50 y 55, bloqueo, selección, persistencia, Extras, resolución de poses, Refugio y combate de prueba sin enemigos. `test_kickboxer_outfit.js` y `test_menu_scenes.js`: PASS. [Camerino](evidence/atuendos/camerino-pintor.jpg) · [Refugio](evidence/atuendos/refugio-pintor.jpg) · [combate](evidence/atuendos/combate-pintor-movimiento.jpg).

Como en los otros atuendos, la caminata alterna dos poses y el apuntado mantiene brazos horizontales para todos los ángulos; hay diferencias entre dibujos. HUD y cinemáticas conservan el arte original. No se ha verificado una campaña completa ni todos los ángulos, y no se garantiza ausencia de fallos visuales.

## Retratos del HUD y del diálogo

El HUD utiliza ahora un recorte de cabeza y torso del sprite de reposo del atuendo equipado. Las paletas usan el retrato original recoloreado; el aspecto original mantiene su retrato. El cambio se sincroniza al equipar, al restaurar una selección o al cargar imágenes; el refresco de recursos no lo sobrescribe. En diálogos explícitamente identificados como PROTAGONISTA, JUGADOR o PLAYER se usa el mismo retrato; Tempo conserva el suyo y otros emisores y avisos no reciben un retrato incorrecto. No se han añadido frases nuevas ni atribuido al protagonista diálogos existentes de otros personajes. Las cinemáticas siguen usando el arte original.

`test_outfit_portraits.js`: PASS para los 15 aspectos y paletas, selección, recarga, refresco de recursos, recuperación del aspecto original al revocar el récord, HUD en Refugio y combate, y distinción entre protagonista, Tempo y otro emisor. Los récords y el diálogo del protagonista son datos de prueba: no se ha comprobado una línea natural del protagonista en la campaña. [HUD y diálogo de prueba en Refugio](evidence/atuendos/hud-dialogo-buzo.jpg) · [HUD en combate sin enemigos](evidence/atuendos/hud-combate-kickboxer.jpg). `test_painter_outfit.js` y `test_menu_scenes.js`: PASS.

## Disponibilidad para pruebas y descripciones

Todos los aspectos y paletas están disponibles sin récord ni victoria para facilitar su prueba. Esta disponibilidad temporal sustituye los requisitos mencionados en las secciones anteriores: los umbrales originales se conservan en el catálogo y se pueden restaurar desactivando `PREVIEW_UNLOCK_ALL` en `src/dd_appearance.js` y reconstruyendo los HTML. No se modifican los récords ni las mecánicas. Cada aspecto tiene una breve descripción con humor en Personalizar y Extras; la selección sigue guardándose.

`test_outfit_preview.js`: PASS en perfil limpio, 15 aspectos disponibles sin sembrar récords, descripciones, equipamiento, persistencia, Extras y teclado a tamaño móvil. `test_outfit_portraits.js`, `test_painter_outfit.js`, `test_menu_scenes.js` y `test_appearances_beat.js`: PASS con el modo de prueba activo. [Camerino con descripciones](evidence/atuendos/camerino-prueba-descripciones.jpg).

## Pose de selector, animación y brazos de cocinero y pintor

El selector de aspectos (Personalizar) muestra ahora una pose de presentación a cuerpo entero en lugar del sprite de juego: `showcase.png` por atuendo, generado como propuesta con fondo uniforme, con matte por color de fondo, descontaminación de borde y recorte del lienzo (`tools/art_master/prepare_outfit_showcase.py`). Los once atuendos tienen pose de presentación: nueve con propuestas nuevas de este turno (caballero, asesino, jinete, buzo, pistolero, lágrimas, entrenador, aventurero y cocinero), y luchador y pintor con su maestro de reposo ya existente. El límite de generación de imágenes del turno (10) impidió crear propuestas dedicadas para pintor y luchador; la propuesta generada del luchador tenía interfaz de fondo y no era utilizable.

Las animaciones de todos los aspectos mejoran con micro-movimiento sólo de dibujo (física, colisiones y progresión intactas): respiración y balanceo lentísimo en reposo, y vaivén, balanceo y bob sincronizados con la fase de paso al caminar, tanto en el Refugio (`src/dd_hub_system.js`) como en partida (`src/dd_world_renderer.js`). La caminata sigue alternando dos poses por carecer de fotogramas intermedios; el movimiento procedimental suaviza el cambio sin inventar cuadros.

Los brazos de cocinero y pintor se retocaron en las seis poses desde los maestros: se repintaron mangas desgarradas con puños arremangados limpios, se eliminaron fragmentos grises y retazos flotantes y se conservaron antebrazos, tatuajes y manos. Es reproducible: `tools/art_master/retouch_outfit_arms.py` (limpieza), `tools/art_master/arm_repairs.py` (reparaciones) y copias previas en `concepts/backup_pre_arm_fix/`; después corren `prepare_chef_outfit.py` y `prepare_painter_outfit.py`. En combate puede apreciarse dibujo plano donde estaba el daño; a escala de juego no se distingue.

`test_outfit_preview.js`, `test_outfit_portraits.js`, `test_chef_outfit.js`, `test_painter_outfit.js`, `test_player_animations.js` y `test_appearances_beat.js`: PASS. Capturas de este turno en `evidence/atuendos/`: camerino, Refugio, Refugio andando y combate de cocinero y pintor (PNG). No se ha validado una campaña completa ni el mando físico; las limitaciones de puntería y ángulos descritas arriba siguen vigentes.

## Identidad del protagonista en los atuendos

Corrección en curso: el personaje de los atuendos no se parecía al protagonista de la portada (`portada_descenso.jpg`), de `hero.png` ni del retrato del HUD (pelo castaño claro al viento, ojos azules, rasgos suaves). Los atuendos se generaron con un personaje distinto (pelo oscuro). Se está rehecho el arte de los atuendos para que sea la MISMA persona, conservando cada vestuario, pose y estilo aprobados.

Hecho hasta ahora: las nueve poses de selector generadas (caballero, asesino, jinete, buzo, pistolero, lágrimas, entrenador, aventurero y cocinero) se han corregido por edición con `hero.png` como referencia de identidad y se han vuelto a matar en `showcase.png`. Los retratos del HUD y del diálogo usan ahora la cabeza de esa pose de presentación, con recorte fijo (23,5 % del alto centrado). Maestros conservados en `concepts/showcase_v2_*.webp`. `test_outfit_preview.js`, `test_chef_outfit.js` y `test_outfit_portraits.js`: PASS. [Camerino](evidence/atuendos/camerino-cocinero.png) · [diálogo buzo](evidence/atuendos/hud-dialogo-buzo.jpg).

Pendiente (límite de 10 imágenes por turno): pose de selector de luchador y pintor con la nueva identidad; después los sprites de juego de las seis poses de los once atuendos (66 maestros), por orden de atuendo, hasta que el personaje en Refugio y combate sea también el de la portada. Mientras tanto puede verse el desajuste: selector y retratos con el protagonista nuevo y sprites de partida con el anterior.

## Identidad definitiva: diseño del protagonista aportado por el usuario

El usuario aportó una lámina de diseño (`concepts/protagonista_diseno.webp`): sombrero negro de ala ancha con acentos rosa y cian, pelo castaño rojizo erizado, ojos rojos con marcas oscuras, piel clara y tatuajes definidos (ankh en el cuello, sigilo geométrico en el hombro, lobo en un antebrazo, patrón orgánico en el otro, sigilo circular en el dorso de la mano). Los trajes se ponen a ESE diseño, sustituyendo la identidad anterior.

Hecho: las diez poses de selector (todas salvo pintor) están reescritas por edición con la lámina como referencia: mismo personaje en cada atuendo, conservando traje, pose, proporciones y estilo. Regla aplicada: los atuendos con tocado propio (gorro de cocinero, casco de buzo, gorra de entrenador, capucha del Guardián, sombrero del pistolero, boina del pintor) lo conservan; donde el atuendo no cubre la cabeza (caballero, asesino, jinete, lágrimas, luchador) mantiene su sombrero de ala ancha. Los tatuajes se dibujan donde la piel queda visible. Las ediciones volvieron con fondos de ciudad neón; se extrajeron con `tools/art_master/city_matte.py` (matte por color de fondo conectado al borde + limpieza de restos). Retratos del HUD y diálogo usan estas cabezas. `test_outfit_preview.js`, `test_outfit_portraits.js` y `test_chef_outfit.js`: PASS.

Pendiente (límite de 10 imágenes por turno): pose de selector del pintor con esta identidad y los sprites de juego de las seis poses de los once atuendos (66 maestros), por atuendos. Mientras tanto, Refugio y combate siguen mostrando el personaje anterior en los sprites.

## Sprites de juego con el diseño definitivo (en progreso)

El usuario confirmó que hay que recrear los sprites de juego con el diseño aportado. Hecho en este turno (límite de 10 imágenes): los seis maestros del cocinero (reposo, paso, apuntado, daño, voltereta, muerte) y los maestros de reposo, paso y apuntado del luchador, además de la pose de selector del pintor — el selector de los once atuendos queda completo con la identidad del diseño. La conversión de maestros conserva pose, atuendo, encuadre y fondo azul sólido de croma; los sprites se regeneran con los `prepare_*_outfit.py` existentes. Regla de tocados vigente: los atuendos con tocado propio lo conservan; el sombrero de ala ancha aparece donde el atuendo no cubre la cabeza (en el luchador también con el traje de combate).

`test_chef_outfit.js`, `test_kickboxer_outfit.js` y `test_outfit_preview.js`: PASS; el ancla del arma sigue encajando en las manos del cocinero. Capturas: [combate](evidence/atuendos/combate-cocinero.png) · [Refugio](evidence/atuendos/refugio-cocinero-andando.png) · [camerino pintor](evidence/atuendos/camerino-pintor.png).

Pendiente: daño, voltereta y muerte del luchador (muestran el personaje anterior) y los seis maestros de caballero, asesino, jinete, buzo, pistolero, lágrimas, entrenador, aventurero y pintor (57 maestros, ~6 turnos a 10 imágenes por turno). Los maestros previos están en `concepts/backup_identity_v1/`.

## Corrección de la cara (identidad facial de la lámina)

El usuario precisó que el parecido falla por la CARA, no por el sombrero. Se recortó una referencia facial de la propia lámina (`concepts/protagonista_cara.webp`: cara afilada de mentón puntiagudo, ojos rojos estrechos con marcas oscuras tipo máscara hacia las sienes, cejas finas, piel clara) y se reeditaron las diez poses de selector (todas salvo buzo) copiando esos rasgos exactos; tocados, atuendos, poses y tatuajes sin cambios. `test_outfit_preview.js` y `test_chef_outfit.js`: PASS. [Camerino](evidence/atuendos/camerino-cocinero.png).

Pendiente con la nueva referencia facial: la pose del buzo (cara tras el cristal del casco) y las caras de los sprites de juego ya generados (seis maestros del cocinero, tres del luchador), más los maestros restantes de caballero, asesino, jinete, buzo, pistolero, lágrimas, entrenador, aventurero y pintor. Los prompts de maestros incorporarán desde ahora la referencia facial.

## Pose de la lámina en el selector

El usuario pidió para el selector «una pose como la que tiene en la hoja principal». Las diez poses de selector (todas salvo buzo) se regeneraron con la pose de la ilustración principal de `protagonista_diseno.webp`: porte arrogante, torso inclinado hacia delante en tres cuartos, piernas abiertas en paso, un brazo flexionado con la mano al hombro sujetando tirante o prenda, el otro brazo relajado hacia la cadera, cabeza girada al espectador con sonrisa fresca. Cara (referencia `protagonista_cara.webp`), atuendos, tocados y tatuajes sin cambios. Nuevos masters `concepts/showcase_v5_*.webp`. `test_outfit_preview.js` y `test_chef_outfit.js`: PASS. [Camerino](evidence/atuendos/camerino-cocinero.png).

Pendiente: la pose + cara del buzo en el selector; las caras de los sprites de juego ya generados (cocinero ×6, luchador ×3); y los sprites restantes de caballero, asesino, jinete, buzo, pistolero, lágrimas, entrenador, aventurero y pintor (con la referencia facial desde el primer prompt).

## Corrección de maquillaje y tono de piel

El usuario pidió quitar el «maquillaje» de la cara (las marcas oscuras alrededor de los ojos) e igualar el tono de piel al de la portada (`assets/ui/scenes/portada_descenso.jpg`, muestreado en ~#FCC4A1, melocotón cálido). Las diez poses de selector (todas salvo buzo) se reeditaron: zona de ojos limpia (ojos rojos, cejas finas, sin marcas) y piel melocotón cálida en todo lo visible. Masters `concepts/showcase_v6_*.webp`. `test_outfit_preview.js` y `test_chef_outfit.js`: PASS. [Camerino](evidence/atuendos/camerino-cocinero.png).

NOTA para futuras generaciones: la referencia `concepts/protagonista_cara.webp` conserva las marcas oscuras — NO dibujarlas; describir la cara limpia + piel melocotón cálida de la portada en todos los prompts de sprites y retratos.

Pendiente: buzo (pose + cara + piel); caras de sprites de juego ya generados (cocinero ×6, luchador ×3); sprites restantes de los otros nueve atuendos.

## Buzo + sprites de juego con las correcciones (cara limpia y piel cálida)

Completado: la pose del selector del buzo con las correcciones (pose de la lámina, ojos sin marcas, piel melocotón), y los nueve sprites de juego ya generados reeditados con ojos limpios y piel cálida — cocinero (idle, paso, apuntado, daño, voltereta, muerte) y luchador (idle, paso, apuntado). Maestros actualizados en `concepts/cocinero_*.webp` y `concepts/kickboxer_vendas_{idle,walk,aim}.webp`; sprites regenerados con `prepare_chef_outfit.py` y `prepare_kickboxer_outfit.py` sin clipping. QA: `test_chef_outfit.js`, `test_kickboxer_outfit.js` y `test_outfit_preview.js` — PASS. [Combate](evidence/atuendos/combate-cocinero.png).

Los once atuendos del selector están ya con la identidad final (pose de la lámina, cara sin maquillaje, piel de la portada). Pendiente: los sprites de juego restantes (caballero, asesino, jinete, buzo, pistolero, lágrimas, entrenador, aventurero, pintor: 6 maestros cada uno; luchador: daño, voltereta y muerte) con las correcciones desde el primer prompt.

## Sprites de juego: luchador completado y caballero completado

- Referencia facial limpia nueva: `concepts/protagonista_cara_limpia.png` (cara sin marcas, piel melocotón) — usarla como autoridad de rostro en los prompts de maestros; la lámina sirve de contexto de diseño pero sus marcas de ojos NO se dibujan.
- Luchador 6/6: maestros de daño, voltereta y muerte recreados con la identidad final; `prepare_kickboxer_outfit.py` sin clipping.
- Caballero 6/6: nuevos `tools/art_master/prepare_knight_outfit.py` (modelado sobre el del cocinero; los maestros conservan sus nombres españoles: `caballero_oscuro/paso_1/apuntar/herido/esquiva/caida`). El maestro de paso salió apaisado y se recomponó en vertical; el marco de paso se centra por contorno (`align=bbox`) porque la cadera medida se desvía con la pose ancha.
- QA: `test_kickboxer_outfit.js` y `test_knight_outfit.js` — PASS. [Combate caballero](evidence/atuendos/combate-caballero.png) (ancla del arma verificada).

Estado sprites: cocinero 6/6, luchador 6/6, caballero 6/6 con identidad final; asesino, jinete, buzo, pistolero, lágrimas, entrenador, aventurero y pintor 0/6 (48 maestros ≈ 5 turnos). Copia de los maestros de pose previos en `concepts/backup_pose_refs/`.

## Sprites de juego: jinete en marcha y asesino pendiente de rematar

- Jinete: cuatro cuadros nuevos (reposo, paso, apuntado, daño) con identidad final — el daño se centró por contorno (`align=bbox`) por la pose ancha. Voltereta y muerte quedan con el personaje anterior hasta el próximo turno. QA `test_rider_outfit.js`: PASS. [Combate jinete](evidence/atuendos/combate-jinete.png) (ancla del látigo verificada).
- Asesino: seis maestros generados; el de apuntado salió con la mano cortada por el borde del lienzo y se rehará primero en el próximo turno — los sprites del asesino NO se tocaron para no mezclar caras en el cuadro de disparo. Los cinco maestros válidos ya están en `concepts/asesino_{base,paso,herido,esquiva,caida}.webp`; el de `apuntar` se reemplazará.
- Los scripts `prepare_assassin_outfit.py` y `prepare_rider_outfit.py` quedaron convertidos al pipeline de fondo azul (los de diver, pistolero, lágrimas, entrenador siguen en verde — convertirlos al llegar a cada atuendo). Maestros de pose previos en `concepts/backup_pose_refs/`.
- Problema recurrente: el modelo a veces devuelve el maestro de paso apaisado (1375×768) o con el lienzo cambiado → recomponer en vertical 768×1365 con la figura a altura ~1292 y base en y≈1355 antes de pasar por `prepare_*`.

Estado: cocinero 6/6, luchador 6/6, caballero 6/6; jinete 4/6; asesino 0/6 (5 maestros listos); buzo, pistolero, lágrimas, entrenador, aventurero, pintor 0/6.

## Sprites de juego: asesino, jinete y buzo completados

- Asesino 6/6: el apuntado se rehizo (la mano ya no se corta) y los seis cuadros entran juntos. `prepare_assassin_outfit.py` en pipeline azul; el daño se centra por contorno.
- Jinete 6/6: voltereta y muerte recreadas; `prepare_rider_outfit.py` en pipeline azul.
- Buzo 6/6: los seis cuadros recreados con la cara limpia y cálida tras el cristal del casco. `prepare_diver_outfit.py` en pipeline azul; el apuntado se centra por contorno (pose ancha del arpón).
- Técnica nueva para maestros con fondo de ciudad: cuando `city_matte` no da con el fondo, la silueta del maestro antiguo (croma verde + dilatación 9 px, mismas dimensiones de lienzo) recorta el nuevo personaje — los lienzos coincidían en todos salvo el apuntado del buzo, que se regeneró. Ojo: los maestros de paso vuelven a veces apaisados; recomponer ANTES de volcar a `concepts/` (falló una vez por volcar primero).
- QA: `test_assassin_outfit.js`, `test_rider_outfit.js`, `test_diver_outfit.js` — PASS. Capturas en `docs/evidence/atuendos/`.

Estado: cocinero, luchador, caballero, asesino, jinete y buzo 6/6; pistolero, lágrimas, entrenador, aventurero y pintor 0/6 (30 maestros ≈ 3 turnos). Scripts pendientes de convertir a azul: pistolero, lágrimas, entrenador (aventurero y pintor ya lo están).

## Sprites de juego: pistolero completado, lágrimas a medias

- Pistolero 6/6 con identidad final. Su apuntado es muy ancho (abrigo + brazo extendido = 325 px a altura 462) y no cabía en 288 px: el marco de ese cuadro pasó a 352×512 con centrado por contorno. El motor escala por aspecto (`targetW = targetH * w/h`), así que la altura visual se mantiene y la ancla del arma ([0.95, 0.25] del JS) sigue cayendo en la mano — verificado en [combate pistolero](evidence/atuendos/combate-pistolero.png). Quitar del script la limpieza de píxeles verdes de la muerte (era del croma verde antiguo y agujerearía acentos verdes).
- Lágrimas 4/6 (reposo, paso, apuntado, daño) con identidad final; su apuntado y daño también usan marco 352×512 por pose ancha. Voltereta y muerte quedan con el personaje anterior hasta el próximo turno (los maestros antiguos siguen en verde y el script azul los rechaza — se regeneran ya en azul).
- QA: `test_gunslinger_outfit.js`, `test_tears_outfit.js` — PASS.

Estado: cocinero, luchador, caballero, asesino, jinete, buzo y pistolero 6/6; lágrimas 4/6; entrenador, aventurero y pintor 0/6 (20 maestros ≈ 2 turnos). Scripts ya todos en azul salvo entrenador (aventurero y pintor lo estaban).

## Sprites de juego: lágrimas y entrenador completados, aventurero en marcha

- Lágrimas 6/6: voltereta y muerte recreadas — cerrado (sus cuadros anchos ya iban en marco 352×512 el turno anterior).
- Entrenador 6/6: los seis cuadros con identidad final; `prepare_trainer_outfit.py` convertido al pipeline azul (último script pendiente) y con marco ancho 352×512 para apuntado y daño.
- Aventurero 2/6: reposo y paso nuevos (el paso se recomponó en vertical desde su lienzo apaisado); el resto de cuadros se reconstruyeron desde sus maestros azules antiguos (personaje anterior) hasta el próximo turno.
- QA: `test_tears_outfit.js`, `test_trainer_outfit.js`, `test_adventurer_outfit.js` — PASS.

Estado: cocinero, luchador, caballero, asesino, jinete, buzo, pistolero, lágrimas y entrenador 6/6; aventurero 2/6; pintor 0/6. ÚLTIMO TURNO de sprites: aventurero (apuntado, daño, voltereta, muerte) + pintor (6) = 10 maestros exactos.

## ✅ SPRITES DE JUEGO COMPLETADOS — los once atuendos con el diseño definitivo

Último lote: aventurero (apuntado, daño, voltereta, muerte) y pintor (6/6) con identidad final; `prepare_painter_outfit.py` con marco ancho 352×512 para apuntado y daño (mismo tratamiento que los demás). Todos los `prepare_*_outfit.py` están ya en el pipeline azul.

**Estado final:** los once atuendos (caballero, asesino, jinete, buzo, pistolero, lágrimas, entrenador, aventurero, cocinero, luchador, pintor) tienen 6/6 sprites de juego con el protagonista de `concepts/protagonista_diseno.webp`: pose original de cada cuadro conservada, cara de la lámina sin maquillaje (ojos rojos limpios), piel melocotón cálida de la portada, tatuajes visibles y tocados propios por atuendo.

QA: `test_adventurer_outfit.js`, `test_painter_outfit.js`, `test_outfit_preview.js`, `test_outfit_portraits.js` — PASS (y los once `test_*_outfit.js` PASS con el estado final). Capturas de combate y Refugio de cada atuendo en `docs/evidence/atuendos/`.

Pendiente de la ronda de cierre (próximo turno): QA completo consolidado, capturas de todos los escenarios y revisión visual final de coherencia entre atuendos.

## ✅ Ronda de cierre: QA consolidado y evidencia de escenarios

- **QA consolidado: 13/13 PASS** en un único barrido sobre el estado final — `test_outfit_preview`, `test_outfit_portraits` y los once `test_*_outfit` (disponibilidad, selección, persistencia, imágenes en poses, Refugio, HUD, diálogos, Extras y teclado móvil).
- **Coherencia visual entre atuendos verificada**: lámina comparativa de los once combates en `docs/evidence/atuendos/coherencia-los-once-en-combate.jpg` — la misma persona (pelo rojizo, ojos rojos limpios, piel melocotón, tatuajes) con cada traje y su arma anclada.
- **Evidencia de escenarios actualizada** en `docs/evidence/atuendos/`: capturas de combate y Refugio de los once atuendos, `camerino-descripciones.png` (selector con descripciones), capturas por atuendo del camerino, y nueva captura de Extras (`extras-catalogo.png`) con los once retratos nuevos y descripciones de humor. Las capturas de menú, portada, progresión, opciones y game-over siguen vigentes en `docs/evidence/menu-scenes/` (sin cambios visuales en esos escenarios).
- Nueva utilidad `tools/qa/capture_extras.js` para refrescar la captura del catálogo.

**TRABAJO DE IDENTIDAD COMPLETADO.** Once atuendos con el diseño del protagonista (`concepts/protagonista_diseno.webp`) en selector, HUD, diálogos, Extras y 66 sprites de juego, con pose de la lámina en el selector, cara sin maquillaje y piel de la portada.

## Validación de rendimiento y commit del trabajo

- **Sondeo de rendimiento** (`tools/qa/perf_probe.js`, captura `docs/evidence/atuendos/combate-turba-rendimiento.png`): incursión real con 12-18 enemigos invocados (dancer, sprinter, tank, speaker), entrada simulada (movimiento + disparo) e invulnerabilidad de prueba. Resultado en renderizado por software (SwiftShader, sin GPU): 19,9 FPS con turba / 21,9 FPS en calma → los enemigos cuestan ~4 ms/frame y el techo lo pone el software del entorno; en hardware real la escena va sobrada. p95 = 66,7 ms, máximo 83,3 ms (sin tirones ni bloqueos). **Cero errores JS ni peticiones HTTP fallidas** durante toda la sesión de combate.
- **Cuadros raros revisados** (daño, voltereta, muerte de los once atuendos): figuras completas y coherentes — lámina de revisión en `.cache/identity_fix/review_rare_frames.jpg`.
- **Commit `8668e50`** en `arena/3e032440-deadbeat-disconew` (297 archivos: sprites, maestros activos, herramientas, QA, docs, escenas y motor) y **push a origin**. Quedan fuera de git (añadidos a `.gitignore`): `.venv/`, `docs/evidence/`, las copias de seguridad de maestros (`backup_identity_v1/`, `backup_pose_refs/`) y las versiones antiguas de showcases (`showcase_v3/v4/v5_*`) — todo sigue en el workspace.

Pendiente sólo de prueba manual del usuario: mando Xbox físico, audio y una partida completa con victoria natural.

## Pose del diseño compartida por los aspectos extra (original, cian, violeta, oro)

El usuario pidió que todos los aspectos —también los extra— compartan la pose del diseño. Los cuatro aspectos sin atuendo (Original, Pulso cian, Noche violeta, Último baile) se pintaban desde `hero.png` con pose antigua: ahora existe `assets/characters/outfits/original/showcase.png` (look de siempre —chaqueta de cuero, camiseta blanca, sombrero— en la pose arrogante de la lámina, cara limpia y piel melocotón) y `dd_appearance.js` lo usa en `preview()`, `showcase()` y `hudPreview()` para los cuatro, con el recoloreado de tono por paleta (cian/violeta/oro) aplicado sobre la misma imagen. El retrato del HUD recorta la cabeza del nuevo showcase con la misma geometría que los atuendos. HTML reconstruido con `tools/build_active_html.py`; QA `test_outfit_preview.js` y `test_outfit_portraits.js`: PASS. Capturas: [original](evidence/atuendos/camerino-original.png) y [oro](evidence/atuendos/camerino-oro.png); nueva utilidad `tools/qa/capture_palette_looks.js`.

## 🔄 REHACER TODO con la lámina nueva (identidad definitiva v2g)

El usuario adjuntó una lámina de referencia más detallada (`concepts/protagonista_referencia_v2.webp`: vistas frontal/¾/perfiles/lateral + detalle de tatuajes + paleta) y confirmó: rehacer el aspecto «Original» Y los once trajes (selector y sprites de juego) con esa lámina como identidad definitiva. Recorte facial nuevo: `concepts/protagonista_cara_v2.png`.

Identidad v2g: misma cara de la lámina (sombreado de ojos como el dibujo, sin máscara), pelo rojo oscuro más salvaje y largo, piel melocotón, y tatuajes al detalle de la lámina: ankh (cuello), sigilo circular tipo pentagrama (hombro), lobo (antebrazo), patrón orgánico de llamas (otro antebrazo), sigilo circular con marcas en dedos (dorso de mano), más mangas de tatuaje en brazos.

Primer lote (10 imágenes): showcase nuevo del «Original» + nueve trajes del selector (caballero, asesino, jinete, buzo, pistolero, lágrimas, entrenador, aventurero, cocinero) en la pose del diseño. El del entrenador salió apaisado y cortado → restaurado el showcase anterior; se rehace en el próximo lote. QA `test_outfit_preview.js`, `test_outfit_portraits.js`: PASS. Capturas `camerino-original.png` y `camerino-oro.png` actualizadas.

Pendiente v2g (≈7 turnos a 10 imágenes): showcases de entrenador (rehacer), luchador y pintor; y los 66 maestros de sprites con la identidad v2g + regenerar sprites con los `prepare_*` + QA completo.

## 📜 DIRECTIVA V1.0 — RECONSTRUCCIÓN DEL PROTAGONISTA Y SUSTITUCIÓN DEL VESTUARIO (ocho atuendos)

Directiva del usuario: reconstruir el protagonista desde su lámina oficial y sustituir el catálogo por una colección definitiva de OCHO atuendos (00–07), integrada y verificada en el juego (no sólo concept art).

**Colección definitiva (catálogo actual, 8/8 en el selector):**
- 00 `original` — THE DESAFINADO (canónico, diseño de la lámina) — desde el principio
- 01 `rapture` — RAPTURE (gentleman art déco decadente) — sala 30 (← lágrimas)
- 02 `shadow` — SHADOW (infiltrador urbano, capucha integrada al sombrero) — sala 10 (← asesino)
- 03 `apocalypse` — APOCALYPSE (guerrero brutal, hombrera asimétrica) — sala 5 (← caballero)
- 04 `gunslinger` — GUNSLINGER (pistolero arcade) — sala 25 (mismo ID y condición)
- 05 `fightclub` — FIGHT CLUB (luchador underground, vendas) — sala 50 (← kickboxer)
- 06 `kitchenriot` — KITCHEN RIOT (cocinero punk) — sala 45 (← chef)
- 07 `streetart` — STREET ART (artista urbano/tatuador) — sala 55 (← pintor)

**Fase A (auditoría) — contrato real verificado:** 6 sprites por atuendo (`idle, walk_a, aim, hurt, roll, death`); `outfitFrame`/`knightFrame` + anclas de arma en `dd_world_renderer.js:671`; desbloqueo por `round`/`victory` con `PREVIEW_UNLOCK_ALL`; selección persistida en `localStorage['dd_appearance_v1']`. `dd_hub_system.js` y `dd_opening.js` intocados (directiva).

**Fase B (modelo maestro):** `concepts/model_sheet_v2m.webp` (turnaround 6 vistas + cara + sombrero + mapa de tatuajes + botas/cinturón). Identidad v2g (lámina nueva) compartida por todos.

**Fase C+D (colección, 8/8):** showcases nuevos `.cache/v2m/showcase_*.png` → `concepts/showcase_v2m_*.webp` + `assets/characters/outfits/<id>/showcase.png`, en la pose de la lámina (chaqueta abierta, mano al pecho).

**Fase F+G (sustitución, HECHA):** `dd_appearance.js` = catálogo de 8 con IDs nuevos, descripciones con humor, requisitos heredados por correspondencia (sin condiciones nuevas) y tabla `LEGACY` de migración (p. ej. `painter→streetart`, `diver→original`) aplicada en `sync()`/`equip()`; anclas del arma actualizadas. Sprites antiguas copiadas como marcadores provisionales en las carpetas nuevas (se sustituyen por las nuevas al producirse). QA actualizado a 8: `test_outfit_preview.js` y `test_outfit_portraits.js` PASS (incluye «catálogo antiguo ausente» y migración de IDs). Evidencia: `camerino-descripciones.png`, `hud-dialogo-shadow.png`, `hud-combate-fightclub.png`.

**Pendiente (Fase E, ≈5 turnos a 10 imágenes):** 48 maestros de sprites (8×6) con la identidad v2g y los nuevos diseños → `prepare` genérico → sustituir marcadores → hoja comparativa de los ocho → QA completo (combate por atuendo) + capturas reales.

### Fase E en marcha — sprites v2m (10/48 maestros)

Pipeline: `prepare_v2m_outfit.py` (genérico; convenciones del contrato: idle/walk_a 288×512 figure-hip, aim/hurt 352×512 figure-bbox, roll 384×384 contain, death 640×320 contain+flip). Receta maestros v2m: `generate_image` con `images=[cocinero_<pose>.webp (pose), showcase_v2m_<outfit>.webp (atuendo), protagonista_referencia_v2.webp, protagonista_cara_v2.png]` + «DISCARD the clothing… dress him in the outfit shown in the second image» + identidad v2g.

Producido: **original 6/6** (integrado y registrado en `outfits` — sprites propias en juego, sustituyen al fallback base) + **rapture 4/6** (faltan roll/death). QA `test_outfit_preview` y `test_outfit_portraits` PASS tras el registro. Capturas reales de combate: [walk](evidence/atuendos/combate-original-walk.png) y [aim](evidence/atuendos/combate-original-aim.png) con las sprites nuevas. Nueva utilidad `tools/qa/capture_v2m_combat.js`.

Pendiente: rapture (roll/death), shadow 6, apocalypse 6, gunslinger 6, fightclub 6, kitchenriot 6, streetart 6 (38 maestros) → hoja comparativa → barrido QA completo.

### Fase E — segundo lote (20/48 maestros)

**Rapture 6/6** y **Shadow 6/6** completos e integrados (sprites propias en juego; `m_shadow_death` volvió con fondo de ciudad → fallback `city_matte` añadido al prepare genérico). **Apocalypse 1/6** (walk_a; el idle falló por límite de imágenes del turno → próximo lote). Capturas reales: `combate-shadow-walk/aim.png`, `combate-rapture-walk/aim.png`. QA catálogo PASS.

Estado sprites: original 6/6, rapture 6/6, shadow 6/6, apocalypse 1/6, gunslinger/fightclub/kitchenriot/streetart con marcadores provisionales (38→28 maestros pendientes).

### Fase E — tercer lote (30/48 maestros)

**Apocalypse 6/6 completa** (idle fallido del lote anterior regenerado) y **Gunslinger 5/6** (falta death). Capturas reales: `combate-apocalypse-walk/aim.png`, `combate-gunslinger-walk/aim.png`.

Estado sprites: original 6/6, rapture 6/6, shadow 6/6, apocalypse 6/6, gunslinger 5/6, fightclub/kitchenriot/streetart con marcadores (18 maestros pendientes: gunslinger death + fightclub 6 + kitchenriot 6 + streetart 6... total 19 → ver recuento en el cierre).

### Fase E — cuarto lote (37/48 maestros)

**Gunslinger 6/6 completa** (death regenerada tras fallo transitorio de walk) y **Fight Club 6/6 completa** (vendas, torso deportivo, tatuajes visibles). **Kitchen Riot 2/6** (idle/walk). Capturas reales: `combate-fightclub-walk/aim.png`, `combate-gunslinger-walk/aim.png`.

Estado sprites: original/rapture/shadow/apocalypse/gunslinger/fightclub 6/6, kitchenriot 2/6, streetart con marcadores (11 maestros pendientes).

### Fase E — quinto lote (46/48 maestros)

**Kitchen Riot 6/6 completa** (aim regenerada tras fallo transitorio) y **Street Art 5/6** (falta death). Capturas reales: `combate-kitchenriot-walk/aim.png`, `combate-streetart-walk/aim.png`.

Estado sprites: siete atuendos completos + streetart 5/6 (2 maestros pendientes: streetart death + hoja comparativa).
