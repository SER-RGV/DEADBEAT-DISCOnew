# Informe de dirección narrativa · Reconstrucción de la introducción

Motion comic de la introducción de DEADBEAT DISCO. Punto de partida: versión **0.2.1-preview**
(commit `57d33d9`). Este informe tiene dos partes:

- **Parte 1 · Análisis previo.** Escrita y guardada en el repositorio antes de tocar el guion, las
  composiciones o el motor.
- **Parte 2 · Resultado.** Se añade al terminar la implementación.
- **Parte 3 · Versión 0.3.1.** Reordena la historia según la cronología de la biblia, cambia la
  llegada al Refugio, integra arte nuevo y revisa el rendimiento. Donde
  contradiga a las partes 1 y 2, vale la 3. Las partes 1 y 2 se conservan como historial de la 0.3.0.
- **Parte 4 · Versión 0.4.0.** Revisión del ritmo y del montaje: el protagonista pasa a ser el hilo
  visual de la secuencia. **Es la parte vigente**; las partes 1 a 3 quedan como historial.

---

# Parte 1 · Análisis previo a la implementación

## 1.1 Fuentes consultadas y autoridad

| Fuente | Para qué se ha usado |
|---|---|
| Encargo de dirección «Reconstrucción narrativa de la introducción» | Estructura de los diez planos y redacción de los textos. Prevalece sobre todo lo demás |
| `loreybibilia.txt` (Biblia Maestra v1.0, adjunta al encargo) | Canon: Primera Noche (§2), Tempo (§3), Desafinado (§4), torre y Refugio (§5), cronología (§38), reglas de coherencia (§39) |
| `data/guion.json` y `data/composicion.json` de la 0.2.1 | Qué hay hoy en cada plano |
| `evidence/` de la 0.2.1 | Aspecto actual de los diez planos |
| `assets/` del repositorio | Qué ilustraciones y personajes existen |
| Diálogos del juego (`src/dd_hub_system.js`, `index.html`) | Comprobar si alguna frase nueva existe ya en el juego |

La biblia no está en el repositorio y el Documento Maestro Consolidado tampoco: solo dispongo de lo
que la biblia recoge de él. En el juego no aparece ninguno de los términos Desafinado, Escucha o
Primera Noche; allí el personaje sigue llamándose «DJ Virgilio».

## 1.2 Por qué la versión actual no vale

La 0.2.1 cuenta la llegada de alguien desde fuera. Choca con la biblia en estos puntos:

| Plano actual | Qué muestra | Con qué choca |
|---|---|---|
| 01 El mundo | Una ciudad exterior, de noche | El protagonista no procede del exterior (§4.2, §39.1) |
| 02 El club | La fachada, vista desde la calle | Mismo motivo |
| 03 La entrada | «Bienvenido. Entrada libre; el guardarropa te cobra al salir.» | Lo trata como a un cliente que entra |
| 04 Aparición | El protagonista cruza el umbral | «No presentarlo como visitante que llega desde el exterior» (§4.4) |
| 05 Caminata | «Te guardaron sitio…» | Implica que alguien lo esperaba |
| 06 El interior | «Nueve círculos, nueve residentes…» | Nomenclatura retirada (§0.2, §39.12) |
| 07 La pista | «Si pierdes el compás, la pista te traga.» | No contradice el canon, pero forma parte de la misma visita |
| 08 Presentación | El protagonista habla: «Traigo percusión.» | El encargo pide que no hable en la introducción |
| 09 Identidad | Logotipo con la silueta armada | Sin conflicto; cambia de sitio |
| 10 Transición al juego | «Bienvenido al Refugio, cazador.» · «COLA DEL CLUB» | Lo llama «cazador» y presenta el Refugio como la cola de un local |

Además, todo el personaje aparece etiquetado como «DJ VIRGILIO»; la nomenclatura vigente es Tempo.

## 1.3 De los diez planos actuales a los diez nuevos

| N.º | Plano actual (0.2.1) | Plano nuevo | Qué se conserva | Qué cambia |
|---|---|---|---|---|
| 01 | El mundo · ciudad | **La Primera Noche** | Viñeta panorámica, revelado de lápiz a color, cartela de narrador | Ilustración, texto, se quita la cartela «PRÓLOGO» y los cuatro «DUM» |
| 02 | El club · fachada | **El último deseo** | Viñeta, entrada deslizada | Ilustración, texto: un solo bocadillo |
| 03 | La entrada · umbral | **La Escucha** | Viñeta vertical | La cámara baja bajo el suelo; ondas en lugar de puerta |
| 04 | Aparición · silueta | **La nota que no termina** | Viñeta, corte con destello | Tocadiscos y primer bucle en lugar del protagonista |
| 05 | Caminata · pasillo | **Solo una más** | Viñeta, bocadillo de Tempo | Tempo en la cabina; el color cambia de ámbar a neón |
| 06 | El interior · nueve círculos | **La torre** | La idea de nueve niveles que se encienden de arriba abajo | Los discos de colores pasan a ser nueve franjas de escenario; fuera «círculos» |
| 07 | La pista · drop | **La repetición** | Viñeta panorámica, ritmo por pulso | Montaje de repeticiones en lugar del drop |
| 08 | Presentación · «Traigo percusión.» | **El Desafinado** | Viñeta, parón del ritmo | Un paso fuera del compás y su corrección; el protagonista aún no existe |
| 09 | Identidad · logotipo | **El nacimiento** | Viñeta grande, líneas de impacto, sacudida | Los fragmentos forman al protagonista; el logotipo pasa al plano 10 |
| 10 | Transición · Refugio | **El Refugio** | Ilustración del Refugio, retrato de Tempo | Pasa de 3,75 s a 9,4 s; tres bocadillos, despertar, acceso al descenso y título |

## 1.4 Duración y reparto

Se mantienen los **45,000 s** (96 pulsos a 128 por minuto) y los diez planos. Cambia el reparto,
porque el plano 10 lleva ahora tres bocadillos (137 caracteres) y necesita más de 8 s para leerse a
ritmo cómodo.

| Plano | Pulsos | Segundos | Empieza en | Texto que debe leerse |
|---|---|---|---|---|
| 01 | 10 | 4,69 | 0,00 | 55 caracteres |
| 02 | 6 | 2,81 | 4,69 | 26 |
| 03 | 8 | 3,75 | 7,50 | 48 |
| 04 | 8 | 3,75 | 11,25 | 41 |
| 05 | 6 | 2,81 | 15,00 | 13 |
| 06 | 10 | 4,69 | 17,81 | 67 |
| 07 | 10 | 4,69 | 22,50 | 64 |
| 08 | 10 | 4,69 | 27,19 | 66 |
| 09 | 8 | 3,75 | 31,88 | 46 |
| 10 | 20 | 9,38 | 35,63 | 137 |

Todos los cortes caen en pulso. No hay motivo técnico para proponer otra duración.

## 1.5 Recursos disponibles para cada plano

No se genera ninguna imagen. Lo que existe en el repositorio:

| Necesidad | Recurso existente | Valoración |
|---|---|---|
| Estación reconvertida en sala de baile (P01, P02) | **No existe.** Lo más cercano: `cine_circle_08_traicion.png` (nave con bóveda de cristal y columnas) | **Falta.** Ver 1.6 |
| Invitados de la Primera Noche (P01, P02, P05, P07, P08) | `enemy_dancer_walk.png`, `enemy_dancer_windup.png` (los Bailarines: según la biblia §16.1, son los invitados) | Sirven **solo en silueta**. A color son enemigos deformados |
| El anfitrión (P02) | **No existe.** | **Falta.** Ver 1.6 |
| Subsuelo y la Escucha (P03) | No hace falta ilustración: la Escucha no tiene rostro. Ondas vectoriales sobre negro | Suficiente |
| Tocadiscos de Tempo (P04) | `prop_dj_booth.png` (cabina con dos platos, 448×288) | Sirve para la cabina. El plato en primer plano no existe |
| Tempo (P04, P05, P07, P10) | `dialogue_portrait_dj.png` (retrato) y `npc_dj_booth_world.png` (cuerpo entero) | Suficiente. Es el diseño actual del personaje |
| Sala de baile en neón (P05, P08) | `cine_bg05_dancefloor.png` | Suficiente |
| Las nueve pistas (P06, P07) | `cine_circle_01…09_*.png` | Sirven como franjas. Son arte heredado del prototipo, con nombres de archivo antiguos |
| Lugar del nacimiento (P09) | `cine_bg06_hero.png` | Suficiente |
| Protagonista oficial (P09, P10) | `hero_walk_01.png`, `hud_portrait_protagonist.png` (tatuaje visible), `player_death_00.png` (tumbado), `hero_idle_00.png` (figura a medio dibujar) | Suficiente para aparecer y despertar. No hay dibujo de «incorporándose» |
| Refugio (P10) | `cine_circle_00_hub.png` (960×540) | Suficiente, a baja resolución |
| Acceso al descenso (P10) | `threshold_descent_pad.png` | Suficiente como señal. No hay ilustración del pozo |
| Título (P10) | `logo_deadbeat_cinematic.png` | Suficiente |

## 1.6 Recursos que faltan y cómo propongo resolverlo

Tres cosas no existen. En las tres uso un sustituto hecho con recursos oficiales, lo marco en pantalla
con el sello «ARTE PROVISIONAL» y lo dejo anotado en `composicion.json`. Ninguno es una imagen nueva.

**1. La estación de la Primera Noche (planos 01 y 02).**
- *Qué falta:* una ilustración panorámica del interior de la estación reconvertida: columnas de
  hierro, techo de cristal, luz cálida, andenes o vías reconocibles, mesas y gente celebrando. Formato
  igual al de los fondos actuales (2560×1440, con margen de seguridad).
- *Sustituto:* `cine_circle_08_traicion.png` virado a ámbar. Es la única ilustración con bóveda de
  cristal y columnas. Al quitarle el azul deja de leerse como hielo.
- *Límites del sustituto:* es de piedra y no de hierro, conserva carámbanos, un trono al fondo y
  estatuas; no se ve nada ferroviario; mide 960×540 y se ve pixelada a pantalla completa. Además es
  el arte de la pista 08, así que usarla aquí puede confundir cuando el jugador llegue a ese nivel.
- *Descartado:* `cine_bg04_main_hall` y `cine_intro_club_panorama`. Son discotecas, con calaveras y
  cabina de neón; el encargo pide no sustituir la estación por una discoteca.

**2. El anfitrión (plano 02).**
- *Qué falta:* un dibujo del anfitrión de espaldas o a contraluz, sin rostro definido (más adelante
  es el Rey del Compás y la biblia dice que no tiene rostro fijo).
- *Sustituto:* la silueta en negro de `npc_bartender_hub.png` (un hombre que levanta una copa). En
  silueta no se reconoce al camarero y el gesto se lee como un brindis.
- *Límite:* es el dibujo de otro personaje. Solo vale en silueta.

**3. El tocadiscos en primer plano (plano 04).**
- *Qué falta:* una ilustración del plato de Tempo con la aguja, lo bastante grande para ver el salto.
- *Sustituto:* un disco dibujado con vectores (círculos y un brazo), con el mismo trazo de tinta que
  los bocadillos, sobre la cabina `prop_dj_booth.png`. Es un esquema, no una ilustración.

Lo que **no** hace falta encargar: la Escucha (no debe tener forma), los fragmentos descartados (son
esquirlas vectoriales) y el corte entre el plano 09 y el 10 (un destello, sin mostrar cómo llega).

## 1.7 Coherencia con la biblia: puntos que conviene que dirección conozca

La estructura del encargo respeta el canon. He encontrado cinco puntos donde la biblia dice algo
distinto o deja un hueco. En todos sigo el encargo, que prevalece, y lo dejo señalado.

1. **Orden de los hechos.** La cronología de la biblia (§38) pone el crecimiento del salón (6) y los
   deseos convertidos en leyes (7) *antes* de que Tempo detecte la nota (8) y enlace otra canción (9).
   El encargo pone primero a Tempo (planos 04 y 05) y después la torre (06 y 07). Como relato funciona
   mejor así, porque la decisión de Tempo parece la causa. Pero altera el orden canónico.
2. **«Solo una más.»** La biblia (§29, punto 5) reserva esa frase para la última grabación que el
   jugador encuentra: «no contiene una canción, sino a Tempo diciendo "solo una más"». Ponerla en el
   plano 05 la revela en el primer minuto y resta fuerza a ese hallazgo.
3. **Tempo en el Refugio desde el principio.** La biblia propone (§5.5) que el Refugio empiece oscuro
   y abandonado, y que Tempo aparezca «tras el primer jefe». El plano 10 lo muestra recibiendo al
   protagonista. La propia biblia dice también que «la bienvenida del Refugio debe identificarlo como
   Tempo» (§3.4), así que hay dos indicaciones que no encajan del todo.
4. **La llegada al Refugio.** La biblia propone (§5.3) que el suelo de la pista se abra y una
   plataforma baje al protagonista hasta el Refugio. El encargo lo sustituye: el Desafinado despierta
   directamente allí. Esa propuesta de la biblia queda sin uso.
5. **El nombre en pantalla.** La introducción dirá «TEMPO». El HUB sigue diciendo «DJ VIRGILIO» y no
   se toca en este trabajo. Hasta que se actualice, el jugador verá dos nombres seguidos.

## 1.8 Clasificación prevista de los textos

| Clase | Qué significa | Cómo se comprueba |
|---|---|---|
| **Literal** | Existe letra por letra en la biblia o en el juego | La cita debe estar en el archivo de origen |
| **Adaptado** | Redacción de dirección que reescribe un pasaje del canon | Se guarda el pasaje canónico; debe estar en el archivo de origen |
| **Nuevo propuesto** | No procede de ninguna fuente. Pendiente de aprobación documental | Lleva sello «PROPUESTA» |

Para que el validador pueda comprobar las citas hace falta el texto de la biblia en el repositorio.
No subo el documento completo (contiene los finales y los secretos de los soberanos, y nadie ha pedido
publicarlo): añado `fuentes/biblia_extractos.md` con los apartados que respaldan la introducción,
copiados sin cambios.

## 1.9 Plan de implementación

1. Guion nuevo en `data/guion.json`, con la clasificación de 1.8.
2. Composiciones nuevas en `data/composicion.json`: se conservan las cuatro láminas, el estilo de
   viñeta, las transiciones y el ritmo por pulso.
3. Ampliaciones del motor, las mínimas para contar la historia: virado de color por plano, siluetas
   de invitados, ondas, disco, franjas de niveles, montaje, fragmentos y cámara con puntos intermedios.
4. Validación, capturas, README y parte 2 de este informe.

---

# Parte 2 · Resultado

Versión resultante: **0.3.0-preview**. Diez planos, 96 pulsos a 128 por minuto, **45,000 s**.

**Cómo leer esta parte.** Cada afirmación lleva uno de estos tres grados:

- **Comprobado:** lo he ejecutado o lo he visto en una captura.
- **Medido en entorno limitado:** medido solo en el entorno de pruebas (Chromium sin interfaz, sin
  tarjeta gráfica, 2 núcleos). Vale como indicio, no como garantía.
- **Sin comprobar:** no lo he podido verificar. Está listado en 2.10.

## 2.1 Resumen de la nueva historia

Una guerra ha terminado y, en una estación de tren convertida en sala de baile, los supervivientes
celebran una noche sin miedo. Cuando la fiesta se acaba, el anfitrión pide que la noche no termine.
Bajo el salón hay algo que escucha y devuelve lo que recibe: devuelve el deseo. En el tocadiscos, la
última nota vuelve a sonar antes de acabar. Tempo, el DJ, lo nota; ve a los invitados y enlaza otra
canción: «Solo una más». El salón deja de tener salida y crece hacia abajo: nueve niveles bajo la
sala, las pistas, hasta el Núcleo. Los deseos se vuelven leyes y la noche empieza otra vez, y otra.
La torre corrige cada paso que se sale del compás, pero lo que descarta no desaparece: se acumula
hasta tomar forma. Esa forma es el protagonista. No ha entrado: ha nacido dentro. Despierta en el
Refugio, donde Tempo lo recibe, y a sus pies está la plataforma por la que se baja a la torre.

## 2.2 Tabla de cambios por plano

| Plano | Antes (0.2.1) | Ahora (0.3.0) | Empieza | Pulsos | Qué se ve |
|---|---|---|---|---|---|
| 01 | El mundo · ciudad | **La Primera Noche** | 0,00 s | 10 | Nave con bóveda de cristal virada a ámbar; invitados en silueta bailando y brindando |
| 02 | El club · fachada | **El último deseo** | 4,69 s | 6 | La luz se enfría (amanece), los invitados se paran; el anfitrión, en silueta, levanta la copa |
| 03 | La entrada | **La Escucha** | 7,50 s | 8 | Bajo el suelo del salón, una onda baja, rebota en una superficie curva y vuelve igual |
| 04 | Aparición del protagonista | **La nota que no termina** | 11,25 s | 8 | Disco, aguja y una nota que recorre su arco y vuelve a salir cinco veces; Tempo aparece al segundo salto |
| 05 | Caminata | **Solo una más** | 15,00 s | 6 | La cabina; la sala pasa de ámbar a neón y los invitados vuelven a bailar |
| 06 | El interior · nueve círculos | **La torre** | 17,81 s | 10 | Viñeta vertical: la cámara baja desde el salón por nueve franjas, una por pista, hasta el Núcleo |
| 07 | La pista · el drop | **La repetición** | 22,50 s | 10 | Cinco pistas, la misma figura, el mismo paso; corte, reinicio y rayas de tiza que cuentan las noches |
| 08 | Presentación · «Traigo percusión.» | **El Desafinado** | 27,19 s | 10 | Una figura da un paso a destiempo; un barrido la corrige; el gesto descartado queda fuera y se le suman más |
| 09 | Identidad · logotipo | **El nacimiento** | 31,88 s | 8 | Los fragmentos se juntan, forman un contorno y, de golpe, el protagonista; el barrido intenta corregirlo y se apaga |
| 10 | Transición al HUB | **El Refugio** | 35,63 s | 20 | El protagonista en el suelo; Tempo lo recibe; se levanta; la cámara baja a la plataforma y a las pistas de debajo; logotipo |

Se han retirado: la cartela «PRÓLOGO», las diez onomatopeyas anteriores, la megafonía, la frase del
protagonista, el rótulo de neón y los nueve discos de colores con los nombres de los círculos.

Se conserva de la dirección de arte aprobada: láminas con viñetas, revelado de lápiz a tinta y a
color, bocadillos y cajas de narrador, tipografías, paleta, tramas, transiciones (deslizar, latigazo,
paso de página, impacto), cámara por plano y ritmo por pulso.

**Cambios respecto al plan de la parte 1.** (a) Las láminas 2 y 4 son más altas, para dar a los
planos 06 y 10 una viñeta vertical por la que la cámara baja. (b) El fondo del plano 04 es un recorte
oscurecido de la cabina de `cine_bg05_dancefloor`, no `prop_dj_booth.png`, que a ese tamaño se veía
demasiado pixelado. (c) En el plano 05 Tempo aparece en un inserto de retrato sobre la cabina, como en la versión
aprobada; no hay un dibujo suyo pinchando. (d) En el plano 03 se ve arriba una franja del suelo del salón, para
que se entienda que estamos debajo.

## 2.3 Textos finales y clasificación

Los textos están en `data/guion.json`, separados del arte y editables desde la vista previa. Ninguno
está pintado en una imagen.

| Plano | Quién | Texto | Clase | Pasaje de la biblia que adapta |
|---|---|---|---|---|
| 01 | Narrador | «La guerra terminó. Por una noche, nadie tuvo que huir.» | Adaptado | §2.1 «La fiesta celebraba el final de una guerra. Durante unas horas, personas que habían vivido esperando la muerte pudieron reunirse sin miedo.» |
| 02 | Anfitrión | «Que esta noche no termine.» | Adaptado | §2.3 «Cuando la fiesta se acercaba a su final, el anfitrión pidió que aquella noche no terminase.» |
| 03 | Narrador | «Bajo el salón, algo escuchó.» | Adaptado | §2.2 «Bajo el salón dormía una presencia sin rostro llamada la Escucha.» |
| 03 | Narrador | «Y devolvió el deseo.» | Adaptado | §2.3 «La Escucha respondió repitiéndola.» |
| 04 | Narrador | «La última nota regresó antes de terminar.» | Adaptado | §3.1 «Tempo detectó el peligro antes que nadie: la última nota estaba regresando antes de haber terminado.» |
| 04 | Onomatopeya | «TAC» | **Nuevo propuesto** | Ninguno. Grafía del salto de la aguja |
| 05 | Tempo | «Solo una más.» | Adaptado | §3.1 «En cambio, enlazó otra canción. No lo hizo por crueldad. Vio a los invitados felices y pensó que unos minutos más no podían hacer daño.» |
| 06 | Narrador | «El salón dejó de tener salida.» | Adaptado | §2.3 «Las puertas dejaron de llevar al exterior.» |
| 06 | Narrador | «La noche empezó a crecer hacia abajo.» | Adaptado | §2.3 «El salón creció hacia abajo, como un surco que se hunde en un disco.» |
| 07 | Narrador | «Los deseos se convirtieron en leyes.» | Adaptado | §2.3 «Los deseos más intensos de los invitados se convirtieron en las leyes de cada pista.» |
| 07 | Narrador | «Y la noche volvió a empezar.» | Adaptado | §2.4 «La repetición no conserva la felicidad original. Conserva el instante anterior a la despedida y lo reproduce sin permitir que evolucione.» |
| 08 | Narrador | «La torre corregía cada variación.» | Adaptado | §4.1 «Durante la primera transición, alguien dio un paso fuera de tiempo. La torre corrigió el movimiento, pero descartó esa posibilidad.» |
| 08 | Narrador | «Pero algo quedó fuera del compás.» | Adaptado | §4.1 «Es el fragmento que Tempo no consiguió repetir.» |
| 09 | Narrador | «Lo que la torre rechazó terminó tomando forma.» | Adaptado | §4.1 «Tras innumerables repeticiones, todas las decisiones rechazadas se acumularon hasta formar una persona.» |
| 10 | Tempo | «Vaya. Este no estaba en la mezcla.» | **Nuevo propuesto** | Ninguno |
| 10 | Tempo | «No eres una visita. Eres lo que la torre no pudo corregir.» | **Nuevo propuesto** | Ninguno. Resume §4.2 y §4.3, pero la frase no existe |
| 10 | Tempo | «Bienvenido al Refugio. Tenemos mucho trabajo.» | **Nuevo propuesto** | Ninguno |

**Recuento: 0 literales, 13 adaptados, 4 nuevos propuestos.** Total, 17 piezas.

- **Literal: ninguno.** Ningún texto del encargo coincide letra por letra con la biblia, así que no
  he marcado ninguno como literal. `banco_de_alternativas` guarda nueve frases que sí son literales,
  por si dirección prefiere sustituir alguna.
- **Adaptado.** El texto es el del encargo, sin cambios. Cada pieza guarda el pasaje que adapta, y
  el validador comprueba que ese pasaje existe.
- **Nuevo propuesto.** En la vista previa llevan el sello «PROPUESTA». Tres son las frases de Tempo
  que el encargo ya marcaba como propuesta. La cuarta, «TAC», es mía.
- El protagonista no tiene ninguna intervención.

**Nota sobre las fuentes.** La biblia no está en el repositorio. Para que las citas se puedan
comprobar, he añadido `fuentes/biblia_extractos.md` con la copia literal de los apartados que
respaldan la intro (§2, §3.1, parte de §3.2 y §3.4, §4, §5.1 a §5.3, §38 y §39). He dejado fuera a
propósito la identidad posterior del anfitrión, los finales y los secretos de los soberanos. Si no
conviene tener esos extractos en el repositorio, se pueden retirar, pero entonces el validador no
podrá comprobar las citas.

## 2.4 Recursos reutilizados

Ningún archivo de arte se ha creado, copiado ni modificado. Todo se lee por ruta relativa.

| Recurso oficial | Dónde se usa | Cómo |
|---|---|---|
| `cine_circle_08_traicion.png` | 01, 02, 03, 06 | **Sustituto de la estación**, virado a ámbar desde la composición |
| `cine_bg05_dancefloor.png` | 04, 05, 07, 08 | Cabina y pista. En 04 y 05 empieza en ámbar; en 05 pasa a neón |
| `cine_bg06_hero.png` | 09 | Fondo del nacimiento |
| `cine_circle_00_hub.png` | 10 | El Refugio |
| `cine_circle_01` a `09` | 06, 07, 10 | Franjas de las pistas, sin nombre ni número |
| `hero_walk_01.png` | 09, 10 | El protagonista, tal cual |
| `player_death_00.png` | 10 | El protagonista en el suelo |
| `dialogue_portrait_dj.png` | 04, 05, 07, 10 | Retrato de Tempo en inserto |
| `npc_dj_booth_world.png` | 10 | Tempo de cuerpo entero en el Refugio |
| `threshold_descent_pad.png` | 10 | La plataforma de descenso |
| `logo_deadbeat_cinematic.png` | 10 | Título, integrado en la esquina sin cortar la escena |
| `enemy_dancer_walk.png` | 01, 02, 05, 07, 08 | **Solo como silueta**: invitados y bailarines |
| `npc_bartender_hub.png` | 01, 02, 05 | **Solo como silueta**: el anfitrión y algún invitado con copa |

Dibujo vectorial hecho por código, sin imagen: ondas, superficie de la Escucha, disco, brazo, nota,
rayas de tiza, barrido de corrección y fragmentos.

## 2.5 Recursos visuales que faltan

Los planos que usan un sustituto llevan en la vista previa el sello **«ARTE PROVISIONAL»** (planos
01, 02, 03, 04 y 06). Se oculta con `?sellos=0`.

| # | Qué falta | Planos | Qué hay ahora | Qué haría falta |
|---|---|---|---|---|
| 1 | **La estación de la Primera Noche** | 01, 02, 03, 06 | `cine_circle_08_traicion.png` en ámbar. Tiene bóveda de cristal y columnas, pero también carámbanos, un trono al fondo y estatuas; no hay andenes, vías ni reloj, y es de 960×540 | Panorámica a 2560×1440 con columnas de hierro, techo de cristal, andenes, luz cálida e invitados |
| 2 | **El anfitrión** | 02 | Silueta del NPC de la barra con la copa en alto | Figura de espaldas o a contraluz, sin rostro |
| 3 | **El tocadiscos de Tempo en primer plano** | 04 | Disco, brazo y nota vectoriales | Ilustración del plato y la aguja |
| 4 | **Los invitados** | 01, 02, 05, 07, 08 | Siluetas del sprite del Bailarín | Figuras de época para la Primera Noche |
| 5 | **El protagonista incorporándose** | 10 | Paso directo del dibujo tumbado al dibujo de pie | Uno o dos dibujos intermedios |
| 6 | **El pozo o acceso** | 06, 10 | Franjas de las pistas apiladas | Ilustración del corte vertical de la torre |

El más importante es el 1: afecta a cuatro planos y es lo primero que ve el jugador.

**No he generado ninguna imagen.** Propuesta para resolverlo: encargar primero la estación (1), con
el anfitrión integrado (2), y después el tocadiscos (3). Los demás pueden esperar.

## 2.6 Decisiones narrativas nuevas que quedan como propuesta

Ninguna de estas es canon. Están aplicadas en la vista previa para poder valorarlas.

1. **El Refugio como primer lugar estable donde la torre no logra corregirlo.** Es la lectura que
   pide el encargo. Se cuenta sin texto explicativo: en el plano 09 el barrido de corrección se
   apaga antes de alcanzarlo, y en el plano 10 despierta en un sitio sin estrobos ni temblores. No
   hay rescate, misión previa ni nadie que lo lleve.
2. **Las tres frases de Tempo del plano 10.**
3. **Tempo presente en el Refugio desde el primer momento.**
4. **La Escucha como superficie.** La biblia la llama «espejo acústico»; la he dibujado como una
   curva donde la onda rebota, sin rostro ni forma de ser vivo. La onda vuelve con el mismo color y
   el mismo ritmo.
5. **El barrido blanco como imagen de la corrección de la torre** (planos 08 y 09).
6. **El color cian para lo descartado**: el paso fuera de tiempo, los fragmentos y el contorno del
   protagonista antes de tener cuerpo.
7. **Las rayas de tiza** que cuentan las noches en el plano 07.
8. **El cambio de ámbar a neón** cuando Tempo enlaza la canción: la fiesta cálida se convierte en el
   club.
9. **La onomatopeya «TAC».**
10. **Las tres pistas visibles bajo la plataforma** en el último fotograma.

Siguen abiertos los cinco puntos de coherencia del apartado 1.7. No he resuelto ninguno por mi
cuenta: en todos se aplica el encargo.

## 2.7 Resultado del validador

`node assets/cinematics/motion_comic/validar_guion.mjs` · **Comprobado.**

```
Duración 45.000 s · 10 planos · 128 pulsos por minuto · 17 textos activos
Estados: Adaptado 13 · Nuevo propuesto 4
Citas: 22 de 22 encontradas en su archivo de origen.
Errores: 0
Avisos: 0
```

Las 22 citas son los 13 pasajes adaptados y las 9 frases del banco de alternativas.

- Texto más rápido: 17,0 caracteres por segundo, en el límite de lo cómodo (17) y por debajo del
  máximo (21). Es la última frase de Tempo.
- El validador conoce ahora los estados `literal`, `adaptado` y `propuesto`. Un texto adaptado o
  propuesto guarda en `fuente.fijado` la redacción exacta del encargo; si se retoca, pasa a BORRADOR.

**Límite del validador.** Comprueba que el pasaje citado existe y que el texto es el del encargo.
No puede comprobar que la adaptación sea fiel al pasaje: eso es un juicio de dirección.

## 2.8 Resultado de la reproducción

| Comprobación | Resultado | Grado |
|---|---|---|
| Reproducción completa de 0 a 45 s | Llega a 45,000 s | Comprobado |
| Errores de consola | 0 | Comprobado |
| Recursos fallidos (respuestas 400 o más) | 0 | Comprobado |
| Comprobaciones en pantalla del inspector (solapes, zona segura, tamaño de letra) | 0 errores, 0 avisos | Comprobado |
| Letra más pequeña en pantalla | 29 px a 1080p (mínimo 26), medida al entrar, a mitad y al salir de cada texto | Comprobado |
| Cada texto dentro del encuadre al entrar, a mitad y al salir | Los 16 textos de lectura, sí. De «TAC», la letra visible en cada golpe queda dentro; las de golpes anteriores, ya transparentes, asoman 19 px por arriba | Comprobado |
| Sincronía de los bocadillos | Cada uno entra después de que dé tiempo a leer el anterior | Comprobado por el validador |
| El protagonista aparece en el plano 09 | Contorno desde el pulso 1,4 y cuerpo en el pulso 4, con su dibujo oficial | Comprobado en captura |
| Transición al Refugio en el plano 10 | Suelo, Tempo, de pie, plataforma y pistas | Comprobado en captura |
| Fluidez | **Con parones en reproducción seguida.** Ver abajo | Medido en entorno limitado |

**Fluidez: no se puede afirmar que la reproducción sea fluida.** Hice dos medidas, sin el panel y a
1920×1080, y dan resultados distintos.

*Tramos cortos (2,6 s desde parado).* Aquí sí va bien, y sirvió para encontrar y arreglar un problema:

| Momento | Antes del arreglo | Después |
|---|---|---|
| 0,5 s (plano 01) | 13,8 fotogramas por segundo | 56,9 |
| 5 s (plano 02) | 25,8 | 60,4 |
| 8 s (plano 03) | 41,1 | 55,4 |
| 15,2 s (plano 05) | 28,1 | 60,0 |
| 23 s (plano 07) | 40,0 | 60,0 |
| 27,5 s (plano 08) | 19,2 | 53,8 |
| 32 s (plano 09) | 20,4 | 58,1 |
| 11,5 s, 18,3 s, 36 s y 41 s | 58 a 60 | no se volvieron a medir |

El arreglo: las siluetas llevaban un filtro de brillo por figura, que frenaba los planos con muchos
invitados. Lo sustituí por un canto de color sin desenfoque (una línea nítida en vez de un halo).

*Reproducción seguida.* Aquí va mal. Pasados entre 2 y 4 segundos de reproducción continua aparecen
parones de entre 0,6 y 2,5 s, más o menos uno por segundo, y ya no desaparecen:

- Intro completa, de 0 a 45 s: 184 fotogramas dibujados (unos 4 por segundo de media) y 22 parones.
  El peor, de 8,3 s, cayó en el segundo 32,7. No se repitió en tres pasadas posteriores de ese tramo,
  donde el más largo fue de 2,1 s.
- En dos pasadas del tramo de 30,5 a 38,5 s hubo un parón de unos 2 s hacia el segundo 34,2. En una
  tercera pasada, más corta (de 31,5 a 36,5 s), el parón más largo fue de 0,9 s.
  *(Corregido en la 0.3.1: la primera redacción decía «tres pasadas» con un parón de 2 s, y eran dos.)*
  Coincide con el nacimiento del protagonista (33,75 s), así que **en este entorno el destello del
  nacimiento se ve a saltos**.
- Los textos entran en su momento igualmente, porque la reproducción sigue el reloj real.

Lo que he podido averiguar sobre la causa:

- El código del cómic tarda 0,15 ms por fotograma y el navegador no registra ninguna tarea larga. El
  tiempo se pierde en el dibujo por software del navegador, no en el programa.
- La versión anterior (0.2.1) hace lo mismo en la misma prueba: en los primeros 12 s dibuja 146 y
  137 fotogramas en dos pasadas, y la 0.3.0 dibuja 146. No es un empeoramiento de esta versión.
- Probé a quitar por separado los filtros de color, las mezclas y las máscaras, y también `?ligero=1`.
  Los parones siguieron en los cuatro casos (`?ligero=1` dibujó más fotogramas, pero no los quitó).

**Conclusión:** en un entorno sin tarjeta gráfica la intro se ve a tirones, igual que la versión
anterior. No sé cómo irá en un equipo normal, y es lo primero que hay que mirar al abrirla.

### Las diez preguntas narrativas

Respondo qué muestra la intro para cada una. Que un jugador nuevo lo entienda **no está comprobado**:
no la ha visto nadie ajeno al proyecto.

| # | Pregunta | Dónde se responde |
|---|---|---|
| 1 | Una guerra terminó | Plano 01, texto |
| 2 | Qué pidió el anfitrión | Plano 02, bocadillo |
| 3 | Qué hace la Escucha | Plano 03: la onda baja y vuelve; «Y devolvió el deseo.» |
| 4 | Por qué Tempo prolongó la canción | Plano 05: los invitados se habían parado y vuelven a bailar. **Es la respuesta más débil**: el motivo (no querer que acabe) se deduce de la imagen, no se dice |
| 5 | Cómo nació la torre | Plano 06: el salón arriba y los niveles apareciendo debajo |
| 6 | Por qué existe el Desafinado | Planos 08 y 09: lo descartado se acumula y toma forma |
| 7 | No viene de fuera | Plano 09: se forma dentro. Plano 10: «No eres una visita.» |
| 8 | Por qué despierta en el Refugio | Planos 09 y 10. **Depende de la lectura propuesta** (2.6, punto 1) y se apoya solo en la imagen |
| 9 | El Refugio es donde empieza el juego | Plano 10: «Bienvenido al Refugio. Tenemos mucho trabajo.» |
| 10 | Se ve la dirección del descenso | Último fotograma: plataforma, línea hacia abajo y tres pistas debajo |

No se nombran los soberanos ni se revela ningún final. No aparecen «círculos», «infierno» ni
«DJ Virgilio». De los términos obligatorios, en los textos se leen *torre*, *Refugio* y *Tempo*; se
muestran sin nombrarse las *pistas*, los *niveles*, la *Escucha* y el *Núcleo*; y *Desafinado* es el
título del plano 08, no un texto en pantalla. No los he añadido a los textos para no cambiar la
redacción del encargo.

## 2.9 Archivos modificados y commit

Todo está en `assets/cinematics/motion_comic/`. No se ha tocado `main`, `src/`, el HUB ni ningún
archivo de arte. No hay pull request.

| Archivo | Cambio |
|---|---|
| `data/guion.json` | Guion nuevo completo (17 piezas), estados nuevos, personajes, banco de alternativas |
| `data/composicion.json` | Diez planos nuevos, cuatro láminas, recursos |
| `js/efectos.js` | **Nuevo.** Efectos narrativos: siluetas, ondas, disco, niveles, montaje, compás, fragmentos, barrido |
| `js/motor.js` | Virado de color por plano, cámara por puntos, sello de arte provisional, formación del personaje |
| `js/guion.js`, `validar_guion.mjs` | Estados `literal`, `adaptado` y `propuesto` |
| `js/textos.js`, `js/vista_previa.js`, `index.html`, `comic.css`, `vista_previa.css` | Sellos «PROPUESTA» y «ARTE PROVISIONAL», recuento por clase |
| `fuentes/biblia_extractos.md` | **Nuevo.** Extractos literales de la biblia |
| `evidence/` | 21 imágenes nuevas; se retiran las 17 de la historia anterior |
| `README.md` | Actualizado a la versión 0.3.0 |
| `INFORME_DIRECCION_NARRATIVA.md` | Este informe |

Commits en la rama `arena/94a36df1-deadbeat-disconew`:

- `0ffd4fc` · análisis previo (parte 1), antes de tocar nada.
- El commit de la implementación es el siguiente a `0ffd4fc` en la rama; su identificador figura en
  el mensaje de entrega, porque un commit no puede contener su propio identificador.

## 2.10 Lo que no está comprobado

- Que un espectador que no conoce el juego entienda la historia.
- La fluidez en un equipo con tarjeta gráfica. En el entorno de pruebas hay parones (2.8).
- El funcionamiento en Firefox, Safari y móvil.
- La intro con música y sonido reales: el repositorio no tiene, y la biblia deja la música de la
  cinemática sin confirmar (§42.10).
- Que la adaptación de cada texto sea fiel a su pasaje, más allá de que el pasaje exista.
- La integración en el juego. Esta vista previa sigue aislada, y el HUB sigue diciendo «DJ VIRGILIO».

---

# Parte 3 · Versión 0.3.1: orden de la biblia, descenso al Refugio y arte nuevo

Versión resultante: **0.3.1-preview**. Diez planos, 96 pulsos a 128 por minuto, **45,000 s**.
Punto de partida: la 0.3.0-preview (commit `b489d9f`). Esta parte es la vigente; las partes 1 y 2
describen la 0.3.0 y quedan como historial.

Los grados de certeza son los mismos de la parte 2: **comprobado** (lo he ejecutado o lo he visto en
una captura), **medido en entorno limitado** (solo en el entorno de pruebas, sin tarjeta gráfica) y
**sin comprobar** (listado en 3.11).

## 3.1 Qué cambia respecto a la 0.3.0

La 0.3.0 contaba la historia en un orden que no era el de la biblia, usaba una frase reservada para
el final del juego, ponía a Tempo en el Refugio antes de tiempo y hacía despertar allí al
protagonista sin mostrar cómo llega. La 0.3.1 corrige esas cuatro cosas a favor de la biblia:

| Punto | 0.3.0 | 0.3.1 | Base |
|---|---|---|---|
| Orden de los hechos | Tempo nota el bucle y enlaza otra canción antes de que nazca la torre | La torre nace primero; después Tempo nota el bucle y decide | Cronología §38, puntos 6 a 9 |
| «Solo una más.» | La decía Tempo en el plano 05 | No aparece. El validador da error si vuelve | La biblia la pone en «la última grabación», uno de los testimonios que encuentra el jugador |
| Tempo en el Refugio | Recibía al protagonista con tres frases | No aparece en el Refugio ni habla allí | §5.5: «Tras el primer jefe: Tempo aparece y comienza a conversar» (figura como cambio propuesto) |
| Llegada al Refugio | Despertaba allí | Baja en una plataforma de servicio desde la pista | §5.3 (propuesta de la propia biblia) |

Además:

- La estación, el anfitrión, los invitados, el tocadiscos y el pozo dejan de ser sustitutos hechos
  con arte de otros lugares: tienen ilustración propia (3.4).
- Los textos pasan de 17 a 14. Desaparecen las tres frases de Tempo en el Refugio, «Solo una más» y
  la cartela final; el plano 10 no tiene diálogo.
- Se revisó el rendimiento con una causa concreta en cada cambio (3.9).

## 3.2 La historia, plano a plano

| Plano | Empieza | Pulsos | Qué se ve | Cronología §38 |
|---|---|---|---|---|
| 01 La Primera Noche | 0,000 s | 10 | La estación convertida en sala de baile. Parejas, soldados, mesas con velas. No hay torre, ni neones, ni protagonista | 1 y 2 |
| 02 El último deseo | 4,688 s | 7 | La luz se enfría y los invitados dejan de bailar. El anfitrión, de espaldas y a contraluz, levanta la copa | 4 |
| 03 La Escucha | 7,969 s | 9 | La cámara baja bajo el salón. El deseo desciende como una onda; una superficie lo recibe y lo devuelve igual. No se ve a nadie | 3 y 5 |
| 04 El nacimiento de la torre | 12,188 s | 10 | Dos puertas se abren y detrás hay más salón. El suelo se hunde y la misma sala se repite hacia abajo, nueve veces, cada vez más oscura | 6 |
| 05 Los deseos se convierten en leyes | 16,875 s | 9 | Nueve viñetas con la misma sala. Una a una se convierten en las ilustraciones oficiales de las pistas. Dentro, todos siguen bailando | 7 |
| 06 La nota que no termina | 21,094 s | 7 | El tocadiscos desde arriba. La aguja salta al mismo surco cuatro veces y la nota vuelve a salir. Tempo, en un recuadro, lo nota | 8 |
| 07 La decisión de Tempo | 24,375 s | 9 | La sala apagada, los invitados quietos. Tempo los mira, pone otro disco y la luz vuelve | 9 |
| 08 La repetición | 28,594 s | 9 | Cinco pistas, la misma figura, el mismo paso. La noche se corta y vuelve a empezar. Rayas de tiza cuentan las vueltas; el color se gasta | 10 |
| 09 El Desafinado | 32,813 s | 10 | Una fila baila a compás; una figura da un paso a destiempo. La luz de la torre la corrige. Los descartes se juntan, toman contorno y, de golpe, cuerpo. La torre intenta corregirlo y no puede | 11 y 12 |
| 10 El descenso al Refugio | 37,500 s | 16 | La música se engancha, un golpe bajo el suelo, el círculo del centro se abre. Queda sobre la plataforma y baja junto a balcones y luces de otras pistas hasta el Refugio, a oscuras | 13 |

Dos cosas que conviene saber de esa tabla:

- El punto 10 de la cronología incluye «Tempo recuerda los nombres». La intro no lo muestra: el plano
  08 solo cuenta la repetición.
- Los planos 03 y 04 siguen el orden del relato (§2.2 y §2.3), no el número de la cronología: la
  Escucha «duerme» desde antes (punto 3), pero la intro la presenta cuando actúa.

**Comprobado:** los diez planos se han visto en capturas a 1920×1080 (`evidence/`). En ellas se ve lo
que describe la tabla. **Sin comprobar:** que un espectador nuevo lo entienda sin explicación.

## 3.3 Textos

14 piezas: 11 adaptadas y 3 propuestas. Ninguna es literal.

| Plano | Texto | Tipo | Estado | Pasaje que adapta |
|---|---|---|---|---|
| 01 | «La guerra terminó. Por una noche, nadie tuvo que huir.» | Narrador | Adaptado | §2.1 «La fiesta celebraba el final de una guerra. Durante unas horas, personas que habían vivido esperando la muerte pudieron reunirse sin miedo.» |
| 02 | «Que esta noche no termine.» | Bocadillo del anfitrión | Adaptado | §2.3 «…el anfitrión pidió que aquella noche no terminase.» |
| 03 | «Bajo el salón dormía algo que escuchaba.» | Narrador | Adaptado | §2.2 «Bajo el salón dormía una presencia sin rostro llamada la Escucha.» |
| 03 | «Y devolvió lo que recibió.» | Narrador | Adaptado | §2.3 «La Escucha respondió repitiéndola.» |
| 04 | «El salón dejó de tener salida.» | Narrador | Adaptado | §2.3 «Las puertas dejaron de llevar al exterior.» |
| 04 | «La noche empezó a crecer hacia abajo.» | Narrador | Adaptado | §2.3 «El salón creció hacia abajo, como un surco que se hunde en un disco.» |
| 05 | «Los deseos se convirtieron en leyes.» | Narrador | Adaptado | §2.3 «Los deseos más intensos de los invitados se convirtieron en las leyes de cada pista.» |
| 05 | «La despedida nunca llegó.» | Narrador | Adaptado | §2.4 «Conserva el instante anterior a la despedida y lo reproduce…» |
| 06 | «TAC» (cuatro veces) | Onomatopeya | **Propuesta** | Ninguno |
| 07 | «Los vi felices. Creí que unos minutos más no podían hacer daño.» | Voz de Tempo, con su nombre | **Propuesta** | Ninguno como cita. Ver abajo |
| 08 | «La noche volvió a empezar.» | Narrador | Adaptado | §2.3 «El tiempo se plegó sobre sí mismo.» |
| 08 | «La torre corregía cada variación.» | Narrador | Adaptado | §4.1 «…La torre corrigió el movimiento, pero descartó esa posibilidad…» |
| 09 | «Lo que la torre rechazó terminó tomando forma.» | Narrador | Adaptado | §4.1 «…todas las decisiones rechazadas se acumularon hasta formar una persona.» |
| 10 | «TAC» (dos veces) | Onomatopeya | **Propuesta** | Ninguno |

Sobre la frase de Tempo: la biblia lo cuenta en tercera persona (§3.1: «Vio a los invitados felices y
pensó que unos minutos más no podían hacer daño.»). La intro lo pasa a primera persona y lo pone en
su voz. Como eso es poner palabras en boca de un personaje, está marcada como propuesta y no como
adaptación. **No es canon hasta que dirección la apruebe.**

Lo que el validador puede y no puede decir de estos textos:

- **Comprobado:** las 20 citas (11 de textos y 9 del banco de alternativas) existen, letra por letra,
  en `fuentes/biblia_extractos.md`. Los extractos se copiaron de la biblia en la 0.3.0.
- **Sin comprobar:** que cada adaptación sea fiel al sentido de su pasaje. El validador no lo juzga.
  La más libre es «La noche volvió a empezar» sobre «El tiempo se plegó sobre sí mismo».

## 3.4 Arte

### Arte nuevo, sin aprobar

Ocho imágenes, todas en `arte_nuevo/`, **generadas por IA en esta sesión**. No son arte oficial y no
han pasado por dirección de arte. El detalle está en `arte_nuevo/MANIFIESTO.md`.

| Archivo | Tamaño real | Uso | Planos |
|---|---|---|---|
| `estacion_primera_noche.png` | 2560×1440 | Fondo de la Primera Noche; también la «sala repetida» de la torre | 01, 02, 03, 04, 05, 07 |
| `anfitrion_contraluz.png` | 463×1255 | El anfitrión, de espaldas | 02 |
| `invitados_pareja_a.png`, `invitados_pareja_b.png`, `invitado_soldado.png`, `invitada_copa.png` | entre 221×540 y 390×553 | Invitados en primer término | 01, 02, 05, 07 |
| `tocadiscos_tempo.png` | 1024×1024 | El tocadiscos visto desde arriba | 06, 07 |
| `pozo_torre.png` | 768×1376 | El pozo por el que baja la plataforma | 10 |

Límites que hay que conocer:

- **La estación no es nativa a 2560×1440.** La herramienta la entregó a 1376×768; se recortó y se
  amplió. A pantalla completa se ve bien en las capturas, pero no tiene el detalle de un dibujo hecho
  a ese tamaño.
- El pozo (768×1376) se estira a lo ancho de la viñeta. Pasa deprisa y en movimiento; en un fotograma
  parado se nota blando.
- Las siluetas se obtuvieron de imágenes en negro sobre blanco, convirtiendo el blanco en
  transparencia. No tienen detalle interior a propósito.
- El estilo de la estación se pidió tomando como referencia dos ilustraciones oficiales. Se parece,
  pero **no he comprobado con dirección de arte que encaje** con el resto del juego.
- De `generado/` solo quedan tres salidas originales (estación, anfitrión e invitados). Las del
  tocadiscos y el pozo se usan tal cual salieron, sin copia aparte.

Cada plano que usa algo de esa carpeta lleva el sello azul **«ARTE NUEVO · SIN APROBAR»**: planos 01,
02, 03, 04, 05, 06, 07 y 10. Ya no hay ningún plano con «ARTE PROVISIONAL».

### Arte oficial, sin modificar

| Recurso | Uso | Planos |
|---|---|---|
| `cine_circle_01…09_*.png` | Las nueve pistas del mosaico; cinco de ellas, las tiras de la repetición | 05, 08 |
| `cine_bg05_*`, `cine_bg06_*` | Fondo de la repetición; pista del Desafinado y del inicio del descenso | 08, 09, 10 |
| `cine_circle_00_hub.png` | El Refugio | 10 |
| `hero_walk_01.png` | El protagonista | 09, 10 |
| `enemy_dancer_walk.png` | Silueta de los bailarines idénticos | 08, 09 |
| `dialogue_portrait_dj.png` | Tempo, en recuadro | 06, 07 |
| `threshold_descent_pad.png` | La plataforma | 10 |
| Logotipo | Sello del título al final | 10 |

Ningún archivo original se ha modificado: se leen por ruta y se encuadran por código.

### Lo que sigue dibujado por código

Las ondas y la superficie de la Escucha, los marcos de las puertas, la nota y su trayectoria, las
rayas de tiza, los fragmentos, el destello, las líneas de velocidad, el iris del suelo, los carriles
y los neones que parpadean en el Refugio.

## 3.5 Decisiones de puesta en escena

- **La Escucha no tiene cuerpo** (plano 03). La biblia la llama «presencia sin rostro». Se muestra
  solo por lo que hace: recibe una onda y devuelve otra igual.
- **La torre es la misma sala repetida** (plano 04). No se enseña ninguna construcción ni a nadie
  construyendo: la imagen de la estación se repite hacia abajo y se oscurece.
- **Las pistas nacen iguales** (plano 05). Las nueve viñetas empiezan con la estación y cambian una a
  una. Así se ve que cada pista es el mismo salón, deformado.
- **Tempo no es un villano** (planos 06 y 07). Se le ve mirar a los invitados antes de poner el
  disco, y la luz vuelve cuando lo pone.
- **El protagonista no existe hasta el plano 09.** Antes solo hay siluetas sin rasgos. Su primer
  fotograma con el aspecto oficial es el del nacimiento (36,1 s).
- **El Refugio empieza a oscuras** (plano 10), con neones que fallan. El §5.5 lo describe al inicio
  como «oscuridad, neones parpadeantes y sensación de espacio abandonado». No hay nadie más.
- **Nadie explica el mecanismo.** El §5.3 prohíbe decir quién lo activa o que el protagonista venga
  de fuera. No hay texto en el descenso.

## 3.6 Coherencia con la biblia

**Resuelto en esta versión** (a favor de la biblia): el orden de los hechos, «Solo una más», Tempo en
el Refugio y la llegada en plataforma. Ver 3.1.

**Abierto, para decisión de dirección:**

1. **«Despierta» o «desciende».** La cronología (§38, punto 13) dice que el Desafinado «despierta en
   el Refugio». El §5.3, marcado en la biblia como «PROPUESTA NARRATIVA», describe el descenso en
   plataforma. La intro muestra el descenso, como pide el encargo. No son incompatibles, pero la
   intro no enseña ningún despertar.
2. **Dónde está el Refugio.** El §5.1 ordena el descenso así: Refugio, Acceso, Pista 01… Es decir,
   el Refugio queda por encima de las pistas. El §5.3 dice que al bajar hacia el Refugio se ven
   «luces de otras pistas a profundidades imposibles». La intro muestra lo que dice el §5.3 y no
   inventa una explicación. Si dirección prefiere otra lectura, hay que cambiar el plano 10.
3. **La pista de la que parte.** El §5.3 habla de «la pista principal» sin decir cuál. La intro usa
   la misma pista en la que nace (`cine_bg06`), para no cortar entre el plano 09 y el 10.
4. **La frase de Tempo** (3.3) y las dos onomatopeyas son propuestas.
5. **El nombre.** La intro dice «TEMPO»; el HUB del juego sigue diciendo «DJ VIRGILIO».
6. **Duración.** El motor del juego da 35,0 s a la intro (`src/dd_cinematic_camera.js`); este cómic
   dura 45 s. No se ha tocado el motor.
7. **Los extractos de la biblia** están copiados en `fuentes/`. Falta confirmar que pueden estar en
   el repositorio.

## 3.7 Cambios en el motor y en las herramientas

| Dónde | Qué |
|---|---|
| `js/motor.js` | Sellos de arte de dos tipos y varios por plano; arte de fondo opcional; personajes con trayectoria y ventana de aparición; el arte va en una caja que lleva el encuadre; velo de latido |
| `js/efectos.js` | Efectos nuevos: `puerta`, `mosaico`, `tocadiscos`, `descenso`. Ampliados: `luz` (velo plano, mezcla opcional), `niveles`, `compas`, `montaje` |
| `js/textos.js` | El sello de un narrador de varias cajas ya no queda tapado por las cajas |
| `js/vista_previa.js`, `index.html` | La pestaña Comprobaciones enumera los planos con arte nuevo o provisional |
| `comic.css` | Estilos de lo anterior; tramas y grano sin modos de mezcla; las rayas de tiza entran en su sitio |
| `validar_guion.mjs` | Comprobaciones 4 (recursos y sellos) y 5 (frases reservadas) |
| `data/guion.json`, `data/composicion.json` | Regenerados: 0.3.1-preview |

Dos defectos encontrados y corregidos al revisar las capturas:

- El sello «PROPUESTA» de la voz de Tempo quedaba detrás de sus propias cajas y no se veía.
- En el plano 08, cada raya de tiza aparecía desplazada a la derecha mientras entraba, porque crecía
  desde la esquina del dibujo y no desde su centro.

## 3.8 Resultado del validador

**Comprobado**, ejecutando `node assets/cinematics/motion_comic/validar_guion.mjs`:

```
Duración 45.000 s · 10 planos · 128 pulsos por minuto · 14 textos activos
Estados: Adaptado 11 · Nuevo propuesto 3
Citas: 20 de 20 encontradas en su archivo de origen.
Recursos: 25 comprobados en disco · 8 nuevos sin aprobar (estacion, tocadiscos, pozo, anfitrion, pareja_a, pareja_b, soldado, invitada).
Sellos de arte: 8 planos con «ARTE NUEVO · SIN APROBAR» (1, 2, 3, 4, 5, 6, 7, 10) · 0 con «ARTE PROVISIONAL».
Errores: 0
Avisos: 0
```

- Código de salida 0. Con un guion de prueba que contiene «Solo una más», da 1 error y código de
  salida 1.
- El texto más rápido se lee a 16,8 caracteres por segundo (cómodo hasta 17, máximo 21).
- La pestaña Comprobaciones de la vista previa da también 0 errores y 0 avisos, y mide la letra más
  pequeña en 30 px a 1080p (mínimo 26). Captura en `evidence/inspector_comprobaciones.jpg`.
- La comprobación automática de textos dentro de pantalla marca tres veces la onomatopeya del plano
  06. Es un falso positivo de la herramienta, que mide las repeticiones ya desvanecidas; en la
  captura del plano 06 el «TAC» está dentro de la viñeta.

Lo que el validador no cubre: no comprueba que el arte nuevo esté aprobado (solo que esté marcado),
ni que las adaptaciones sean fieles, ni nada que dependa del dibujo.

## 3.9 Reproducción y rendimiento

**Todo este apartado es «medido en entorno limitado».** Chromium sin interfaz, sin tarjeta gráfica,
2 núcleos, 1920×1080, sin panel. Cada cifra es de una sola pasada salvo que se diga otra cosa, y
varía de una pasada a otra. **No hay ninguna medida en un equipo real.**

*Recorrido completo.* **Comprobado:** la reproducción llega a 45,000 s sin errores de consola ni
archivos que falten, y cada cinco segundos de reloj la intro iba por su segundo, con menos de
0,2 s de diferencia. La excepción fue la marca de los 20 s, donde el último fotograma dibujado era el
del segundo 18,5: coincidió con uno de los parones del modo gráfico emulado, que es el que usa esta
prueba. A los 25 s ya iba por el 24,97.

*Reproducción seguida, composición por software.* Es el modo en que las cifras se repiten mejor.

| Tramo | 0.3.0 | 0.3.1 |
|---|---|---|
| 0 a 7 s | 55 fotogramas · 2,2 s perdidos · peor parón 0,25 s | 310 fotogramas · 0,8 s perdidos · peor parón 0,23 s |
| 27 a 34 s | 42 fotogramas · 5,1 s perdidos · peor parón 0,93 s | 221 fotogramas · 1,0 s perdidos · peor parón 0,21 s |

Los dos tramos no contienen los mismos planos en una versión y en otra, así que la comparación es
orientativa. La 0.3.1 entera, en cuatro tramos:

| Tramo | Fotogramas | Tiempo perdido en parones | Peor parón |
|---|---|---|---|
| 0 a 12 s | 423 | 0,96 s | 0,21 s |
| 12 a 24 s | 603 | 1,03 s | 0,27 s |
| 24 a 36 s | 389 | 1,94 s | 0,59 s (en el segundo 32,9) |
| 36 a 45 s | 487 | 0 s | ninguno |

En total, unos 1.900 fotogramas en 45 s (42 por segundo de media) y 3,9 s perdidos. **Los parones
que quedan caen en los cambios de plano**; el peor, en el paso del plano 08 al 09. El descenso al
Refugio no tuvo ninguno.

*Reproducción seguida, modo gráfico emulado del mismo entorno.* Sale peor y es muy irregular: en la
última pasada, 1.459 fotogramas y 16 s perdidos, con parones de hasta 3,2 s; en pasadas anteriores
del mismo código hubo parones de hasta 4,6 s en el descenso. La 0.3.0 dibujó 184 fotogramas y perdió
41 s en esa misma prueba. No lo considero una medida fiable de lo que pasará en un equipo real, ni
para bien ni para mal.

*Qué se cambió, y con qué efecto medido* (composición por software):

| Cambio | Efecto |
|---|---|
| Tramas de puntos y grano sin modos de mezcla; las capas del revelado dejan de componerse cuando no se ven | Es lo que más pesa en la diferencia entre la 0.3.0 y la 0.3.1 |
| El arte de fondo va en una caja que lleva el movimiento; el filtro de color queda en la imagen | 0 a 12 s: de unos 295 fotogramas a unos 360 |
| El latido de luz del fondo se da con un velo que cambia de opacidad, no cambiando el filtro en cada fotograma | 0 a 12 s: de unos 360 a unos 420. Plano 08 (3,4 s): de 36 a 61 |
| En el plano 08, el corte inclinado de cada tira se aplica al fondo, que no se mueve, y no a la tira con sus figuras | Plano 08 (3,4 s): de 61 a unos 85 |

*Coste visual de esos cambios.* **Comprobado** comparando capturas a 1920×1080, píxel a píxel:

- Tramas y grano: diferencia media de 1,3 a 2,2 niveles sobre 255; la imagen queda 0,8 niveles más
  oscura de media.
- Caja del arte: diferencia media de 0 a 0,17 niveles.
- Velo de latido: en un golpe de compás, 1,9 niveles de media (la imagen queda 0,9 niveles más
  clara); fuera del golpe, menos de 0,3.
- Corte de las tiras: ningún píxel cambia más de 1 nivel.

Son diferencias que no he sabido ver a ojo en las capturas. **Sin comprobar** que en movimiento, y
en una pantalla real, tampoco se noten.

*Lo que queda mal.* El plano 08 es el más pesado: unos 25 fotogramas por segundo en este entorno. El
paso del 08 al 09 concentra los parones más largos. No he encontrado una causa única para ese
cambio de plano.

## 3.10 Archivos y entrega

| Ruta | Estado |
|---|---|
| `arte_nuevo/` (8 imágenes, `MANIFIESTO.md`, `generado/` con 3 originales) | Nuevo |
| `data/guion.json`, `data/composicion.json` | Regenerados |
| `js/motor.js`, `js/efectos.js`, `js/textos.js`, `js/vista_previa.js`, `comic.css`, `index.html` | Modificados |
| `validar_guion.mjs` | Ampliado |
| `evidence/` | Sustituida entera: 25 fotogramas, 3 capturas del inspector, hoja de contacto y las secuencias del nacimiento y del descenso |
| `README.md`, este informe | Actualizados |

No se ha tocado nada fuera de `assets/cinematics/motion_comic/`. El identificador del commit figura
en el mensaje de entrega.

## 3.11 Lo que no está comprobado

- Que un espectador que no conoce el juego entienda la historia.
- La fluidez en un equipo con tarjeta gráfica, y el funcionamiento en Firefox, Safari y móvil. Todas
  las medidas son del entorno de pruebas.
- Que el arte nuevo encaje con la dirección de arte del juego. Nadie lo ha revisado.
- Que la adaptación de cada texto sea fiel a su pasaje.
- Que los cambios de rendimiento no se noten en movimiento: solo se compararon fotogramas parados.
- La intro con música y sonido reales. El repositorio no tiene, y los sonidos guía son sintetizados.
- La integración en el juego. La vista previa sigue aislada.
- No se ha vuelto a comparar esta versión con la biblia entera, solo con los apartados citados
  (§2, §3.1, §4.1, §5.1 a §5.5 y §38), y con la lista de testimonios donde aparece «solo una más».

---

# Parte 4 · Versión 0.4.0: ritmo, continuidad y protagonista

Punto de partida: la 0.3.1-preview (commit `0dd82f2`). Encargo: «Revisión narrativa y cinematográfica
de la introducción». Esta parte tiene dos mitades:

- **4.1 a 4.5 · Propuesta de montaje.** Escrita y guardada en el repositorio antes de tocar el guion,
  la composición o el motor.
- **4.6 en adelante · Resultado.** Se añade al terminar la implementación.

El encargo anterior («cierre narrativo 0.3.2») quedó interrumpido antes de modificar ningún archivo.
Sus decisiones siguen en pie y se aplican aquí: la frase de Tempo pasa a tercera persona, el arte
nuevo sigue sin aprobar, la ambigüedad sobre el lugar del Refugio queda documentada como pendiente y
las adaptaciones se revisan una a una (4.9).

## 4.1 Diagnóstico de la 0.3.1

Medido sobre la línea de tiempo de la 0.3.1 (45,000 s):

| Qué | Dato |
|---|---|
| Tiempo antes de que exista el protagonista | 36,1 s de 45 (el 80 %) |
| Tiempo con el protagonista en pantalla | 8,9 s, todos al final |
| Planos dedicados al origen de la fiesta y de la torre | 8 de 10 (37,5 s) |
| Textos antes de que aparezca | 13 de 14 |
| Tipos de encuadre | Casi todos generales. Dos recuadros de Tempo. Ningún primer plano, ningún plano desde el hombro, ninguno subjetivo |
| Tamaño del protagonista durante el descenso | Unos 110 px de alto en una imagen de 1080 |

Tres problemas, que son los del encargo:

1. **La fiesta tarda demasiado.** Cinco planos (21 s) cuentan la fiesta, el deseo, la Escucha, la
   torre y las pistas, y cada uno con uno o dos textos. Es un resumen de la biblia, no una escena.
2. **No hay a quién seguir.** Hasta el segundo 36 no hay un personaje. Los invitados, el anfitrión y
   Tempo aparecen y desaparecen; lo único que une los planos es el narrador.
3. **El final es otra cinemática.** El protagonista nace en un plano y en el siguiente ya es una
   figura pequeña en un plano general que baja. No se le ve reaccionar, no se ve lo que él ve, y el
   Refugio aparece como un decorado más.

Lo que sí funciona y se conserva: el orden de la cronología (§38), la Escucha sin cuerpo, la torre
como sala repetida, el mosaico de pistas, la secuencia del paso corregido y el descenso en tira
continua.

## 4.2 Propuesta de montaje

Se mantienen los **45,000 s** (96 pulsos a 128 por minuto). Los diez planos pasan a **quince**,
agrupados en los seis bloques del encargo. No se añade ningún texto y se retiran dos.

| Bloque | Plano | Empieza | Pulsos | Encuadre | Qué se ve | Función |
|---|---|---|---|---|---|---|
| 1 La última fiesta | 01 La Primera Noche | 0,000 s | 8 | General | La estación, la fiesta | Dónde estamos y qué se celebra |
| | 02 El paso | 3,750 s | 4 | Primer plano de pies | Parejas bailando, de cintura para abajo, todas a compás | La felicidad, de cerca. Planta el motivo de toda la intro: **el paso** |
| 2 El deseo y la Escucha | 03 El último deseo | 5,625 s | 5 | Medio, de espaldas | El anfitrión levanta la copa | Alguien pide que no termine |
| | 04 La Escucha | 7,969 s | 9 | General, en vertical | La onda baja, rebota y vuelve igual | Algo responde repitiendo |
| 3 La torre | 05 El nacimiento de la torre | 12,188 s | 7 | General, cámara que baja | Puertas que dan a más salón; la sala se repite hacia abajo | La fiesta queda encerrada y crece hacia abajo |
| | 06 Los deseos se convierten en leyes | 15,469 s | 6 | Mosaico de nueve viñetas | La misma sala se vuelve nueve lugares | Cada pista, un deseo |
| 4 Tempo | 07 La nota que no termina | 18,281 s | 5 | Detalle, desde arriba | La aguja salta; Tempo lo nota | La música no acaba |
| | 08 La decisión de Tempo | 20,625 s | 9 | Medio, con recuadros | Tempo mira a los invitados y pone otro disco. Al volver la música, **un invitado pisa a destiempo** y deja un rastro azul | Tempo lo hace por ellos. Primera anomalía, en el momento que dice la biblia (§4.1: «durante la primera transición») |
| 5 El Desafinado | 09 La repetición | 24,844 s | 6 | Montaje en tiras | La misma figura, el mismo paso. En cada vuelta queda un rastro azul más | Las repeticiones dejan restos |
| | 10 El paso fuera de tiempo | 27,656 s | 5 | Primer plano de pies | Una fila de pies a compás; uno pisa tarde. La luz de la torre lo corrige; el paso descartado se queda fuera | Qué es lo que la torre rechaza. Rima con el plano 02 |
| | 11 El Desafinado | 30,000 s | 9 | General y recuadro de detalle | Los descartes se juntan donde quedó el paso, toman contorno y cuerpo. Recuadro: hombro y tatuaje | El protagonista nace de lo descartado |
| 6 La ruptura y el descenso | 12 La anomalía | 34,219 s | 5 | **Desde el hombro** | Él, de espaldas en primer término; delante, la pista. La música se engancha y el círculo del suelo se agrieta | Él lo percibe. Desde aquí la cámara es suya |
| | 13 El mecanismo | 36,563 s | 4 | **Subjetivo** (lo que tiene delante) | El círculo gira y se abre; dentro aparece la plataforma | La estructura responde |
| | 14 El descenso | 38,438 s | 10 | General con recuadro cercano | Queda sobre la plataforma y baja. Recuadro con su rostro mientras pasan las luces. Llega, recupera el equilibrio y sale de la plataforma | Continuidad: pista, pozo y Refugio son el mismo edificio |
| | 15 El Refugio | 43,125 s | 4 | **Desde el hombro** | Él, de espaldas; delante, el Refugio, que se enciende a medias. Título | Ha llegado. Rima con el plano 12 |

Con este montaje el protagonista toma cuerpo en el segundo **32,1** (antes, 36,1) y tiene 12,9 s de
pantalla (antes, 8,9). Lo más importante no son esos cuatro segundos: es que el paso aparece en el
segundo 3,8 y el primer rastro en el 22,9, de modo que cuando nace ya llevamos media intro viéndolo
venir.

**Sobre la duración.** Los 45 s alcanzan, pero el bloque 6 queda justo: once acontecimientos en
10,8 s. Si la prueba de comprensión (4.12) muestra que el descenso o la llegada no se entienden,
propongo pasar a **104 pulsos = 48,750 s**, repartiendo los ocho pulsos nuevos así: plano 11 +1,
plano 12 +1, plano 13 +1, plano 14 +3, plano 15 +2. No lo aplico ahora porque no tengo ningún dato
que diga que hace falta, y alargar sin dato es justo lo que este encargo quiere corregir.

## 4.3 Cómo entra el protagonista

Un solo código visual para todo lo que tiene que ver con él antes de nacer: **la silueta en azul
claro con trama de puntos**, que la 0.3.1 ya usaba en el plano del nacimiento. Significa «lo que la
torre descartó».

| Fase | Planos | Qué se ve de él |
|---|---|---|
| 1. La fiesta | 01 a 07 | Nada suyo. Solo el motivo: pies que bailan a compás (02) |
| 2. Rastros | 08, 09, 10 | Un invitado que pisa tarde y deja un rastro azul (08). Un rastro más en cada repetición (09). El paso tardío, en primer plano, corregido y expulsado (10) |
| 3. El nacimiento | 11 | Los rastros se juntan en el sitio del paso expulsado, toman el contorno del dibujo oficial y, de golpe, cuerpo. Recuadro con el hombro y el tatuaje |
| 4. Toma el control | 12 a 15 | Dos planos desde su hombro, uno de lo que él ve, y el descenso con un recuadro cercano |

Antes del plano 11 no aparece ni su silueta ni su rostro: los rastros tienen la forma de los
invitados y de los bailarines, no la suya.

## 4.4 Recursos para ello

No se genera ni se retoca ninguna imagen. Todo sale de archivos que ya están en el repositorio:

| Recurso | Qué es | Uso nuevo |
|---|---|---|
| `assets/ui/hud_portrait_protagonist.png` (256×256, oficial) | Retrato del protagonista **de espaldas, por encima del hombro**, con el tatuaje y el rostro de perfil | Primer término de los planos 12 y 15 (desde el hombro) y recuadro de detalle del plano 11 |
| `hero_walk_01.png` (224×320, oficial) | El dibujo de cuerpo entero que ya se usaba | Igual que antes, y recortado de cintura para arriba en el recuadro del descenso |
| Siluetas de invitados (`arte_nuevo/`, sin aprobar) | Las de la 0.3.1 | Ampliadas y cortadas por la cintura para el primer plano de pies (02) |
| `enemy_dancer_walk.png` (oficial) | Silueta del Bailarín | Igual, ampliada, para el primer plano de pies (10) |

Límites que ya se conocen:

- **El retrato mide 256×256** y en los planos 12 y 15 se amplía unas tres veces. Va en primer
  término y a contraluz, donde un dibujo blando molesta menos, pero no es un dibujo hecho a ese
  tamaño.
- **No hay ningún dibujo del protagonista de espaldas de cuerpo entero, ni mirando hacia abajo, ni
  incorporándose.** El «plano subjetivo» (13) es un recorte de la misma ilustración de la pista, no
  una vista dibujada desde sus ojos: se lee como subjetivo por el corte desde el plano 12.
  «Recupera el equilibrio y sale de la plataforma» (14) se hace moviendo el dibujo entero, sin
  deformarlo.
- El retrato y el dibujo de cuerpo entero son dos ilustraciones oficiales distintas del mismo
  personaje, con diferencias de detalle (el chaleco, el tatuaje del hombro). No se corrigen.
- En los primeros planos de pies, el fondo es un recorte muy ampliado de la estación: queda blando,
  como un fondo desenfocado.

## 4.5 Textos

No se escribe ninguno nuevo. De 14 pasan a 12:

| Cambio | Texto | Motivo |
|---|---|---|
| Sustituido | «Los vi felices. Creí que unos minutos más no podían hacer daño.» → «Los vio felices. Pensó que unos minutos más no podían hacer daño.» | Decisión de dirección (encargo 0.3.2). Pasa de PROPUESTA a ADAPTADO: es casi el pasaje del §3.1. Deja de ser la voz de Tempo y pasa a ser narración |
| Retirado | «El salón dejó de tener salida.» | Las puertas ya lo enseñan |
| Retirado | «La despedida nunca llegó.» | Repite el deseo del anfitrión, y era una de las adaptaciones más libres |
| Movido | «La torre corregía cada variación.» | Del montaje de la repetición al primer plano del paso (10), donde se ve la corrección |

Quedan 10 adaptados y 2 propuestas (las onomatopeyas «TAC»).

**Consecuencia que hay que decidir:** al pasar la frase a narración desaparece el rótulo «TEMPO» que
la acompañaba, y con él el nombre del personaje: la intro ya no lo nombra. Mantener el rótulo sobre
una frase en tercera persona haría creer que Tempo habla de otro. Queda como pendiente (4.11).
