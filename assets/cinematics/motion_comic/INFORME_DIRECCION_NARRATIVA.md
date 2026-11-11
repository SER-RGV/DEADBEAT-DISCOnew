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
  visual de la secuencia. Queda como historial de la 0.4.0.
- **Parte 5 · Versión 0.5.0 «La ciudad que no termina».** Reconstrucción completa: la historia sale del
  salón y se cuenta desde la ciudad. Sin protagonista, sin Refugio y sin HUB. **Es la parte vigente**;
  las partes 1 a 4 quedan como historial.

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
| Tiempo antes de que exista el protagonista | 35,8 s de 45 (el 80 %) |
| Tiempo con el protagonista en pantalla | 9,2 s, todos al final |
| Planos dedicados al origen de la fiesta y de la torre | 8 de 10 (37,5 s) |
| Textos antes de que aparezca | 13 de 14 |
| Tipos de encuadre | Casi todos generales. Dos recuadros de Tempo. Ningún primer plano, ningún plano desde el hombro, ninguno subjetivo |
| Tamaño del protagonista durante el descenso | Unos 250 px de alto en una imagen de 1080, sin ningún plano más cercano |

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

Con este montaje el protagonista toma cuerpo en el segundo **32,1** (antes, 35,8) y tiene 12,9 s de
pantalla (antes, 9,2). Lo más importante no son esos cuatro segundos: es que el paso aparece en el
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
una frase en tercera persona haría creer que Tempo habla de otro. Queda como pendiente (4.13).

---

## 4.6 Resultado: qué se hizo y en qué se aparta de la propuesta

La propuesta de 4.1 a 4.5 se guardó en el commit `ecb4272` antes de tocar el guion, la composición o
el motor. Lo implementado la sigue: quince planos, seis bloques, 45,000 s, los mismos pulsos por plano.
Cuatro diferencias:

| Propuesta | Lo que hay | Motivo |
|---|---|---|
| La propuesta guardada decía que en la 0.3.1 el protagonista nacía en el segundo 36,1, tenía 8,9 s de pantalla y medía 110 px durante el descenso | Eran **35,8 s**, **9,2 s** y **unos 250 px** (medido en el navegador) | Tres errores míos. Están corregidos en 4.1 y 4.2; el texto original queda en el commit `ecb4272`. El diagnóstico no cambia: llegaba tarde y nunca se le veía de cerca |
| Plano 10, «primer plano de pies» | **Plano corto, de cintura para abajo** | La silueta oficial del Bailarín es casi toda falda; los pies son pequeños. Más cerca solo se veía una mancha negra. Se ven la falda, las botas y el paso que se sale |
| Plano 14, «recuadro con su rostro mientras pasan las luces» | El recuadro enseña cabeza, hombro y brazo tatuado. Las luces pasan en el plano general, no dentro del recuadro | El recuadro es un recorte fijo del dibujo oficial |
| 4.2 decía que nacía en el segundo 32,1 | Toma cuerpo en el **31,9** | Ajuste de tiempos al montar |

La duración alternativa de 48,750 s (104 pulsos) **no se ha aplicado**. Sigue siendo mi recomendación
si la prueba de comprensión falla en el final: el plano 15 dura 1,9 s, que es poco para reconocer un
lugar nuevo.

## 4.7 Estructura y tiempos exactos

128 pulsos por minuto; un pulso son 0,46875 s; 96 pulsos; **45,000 s**.

| Bloque | Tiempo real | Referencia del encargo | Plano | De | A | Pulsos |
|---|---|---|---|---|---|---|
| 1 La última fiesta | 0,000 a 5,625 s | 0 a 6 | 01 La Primera Noche | 0,000 | 3,750 | 8 |
| | | | 02 El paso | 3,750 | 5,625 | 4 |
| 2 El deseo y la Escucha | 5,625 a 12,188 s | 6 a 12 | 03 El último deseo | 5,625 | 7,969 | 5 |
| | | | 04 La Escucha | 7,969 | 12,188 | 9 |
| 3 El nacimiento de la torre | 12,188 a 18,281 s | 12 a 18 | 05 El nacimiento de la torre | 12,188 | 15,469 | 7 |
| | | | 06 Los deseos se convierten en leyes | 15,469 | 18,281 | 6 |
| 4 Tempo y la repetición | 18,281 a 24,844 s | 18 a 25 | 07 La nota que no termina | 18,281 | 20,625 | 5 |
| | | | 08 La decisión de Tempo | 20,625 | 24,844 | 9 |
| 5 El nacimiento del Desafinado | 24,844 a 34,219 s | 25 a 34 | 09 La repetición | 24,844 | 27,656 | 6 |
| | | | 10 El paso fuera de tiempo | 27,656 | 30,000 | 5 |
| | | | 11 El Desafinado | 30,000 | 34,219 | 9 |
| 6 La ruptura y el descenso | 34,219 a 45,000 s | 34 a 45 | 12 La anomalía | 34,219 | 36,563 | 5 |
| | | | 13 El mecanismo | 36,563 | 38,438 | 4 |
| | | | 14 El descenso | 38,438 | 43,125 | 10 |
| | | | 15 El Refugio | 43,125 | 45,000 | 4 |

Ningún corte de bloque se aparta más de 0,4 s de la referencia del encargo.

Lo que ocurre dentro de los planos, en segundos de la línea de tiempo:

| Segundo | Qué pasa |
|---|---|
| 3,75 | Primer plano de pies: el paso, a compás |
| 22,97 | Con la nueva canción, una invitada pisa medio pulso tarde y deja un rastro azul |
| 23,91 | Vuelve al compás. El rastro se atenúa y se queda |
| 25,31 · 25,88 · 26,39 · 26,77 · 27,09 | Un rastro nuevo en cada tira del montaje |
| 28,13 | Plano corto: un bailarín pisa tarde y se sale de la fila |
| 29,1 | El barrido de la torre lo devuelve a su sitio. El descarte queda fuera |
| 30,09 a 31,36 | Los descartes se juntan alrededor |
| 31,08 | Empieza a verse su contorno |
| **31,88** | **Toma cuerpo** |
| 32,34 | Recuadro: hombro y tatuaje |
| 32,91 | La torre intenta corregirlo; el barrido se para antes de llegar |
| 34,22 | Desde su hombro. La música se engancha (34,59 y 34,88) y el suelo se agrieta |
| 36,75 a 37,73 | Lo que tiene delante: el círculo se abre. Plataforma desde 37,36 |
| 38,44 a 39,14 | Él, sobre la plataforma, quieto |
| 39,14 | Empieza a bajar |
| 39,89 a 40,64 | La cámara cerca; recuadro de detalle |
| 41,20 | El plano se abre: el pozo y, abajo, el Refugio |
| 41,95 | Llega. Se hunde un poco con la sacudida y se repone (hasta 42,21) |
| 42,33 a 42,98 | Sale de la plataforma |
| 43,13 | Desde su hombro, el Refugio. Se enciende a medias (43,27 a 44,25); título en 43,83 |

## 4.8 Cómo queda integrado el protagonista

| | 0.3.1 | 0.4.0 |
|---|---|---|
| Primera imagen del motivo (un paso de baile en primer plano) | No había | 3,75 s |
| Primera señal de que algo se sale del compás | 33,3 s | 22,97 s |
| Toma cuerpo | 35,84 s | 31,88 s |
| Tiempo desde que tiene cuerpo hasta el final | 9,16 s | 13,12 s |
| De ese tiempo, en pantalla | 9,16 s | 11,25 s (el plano 13 es lo que él ve) |
| Planos en los que aparece | 2 | 5 (11, 12, 14, 15 y, como mirada, 13) |
| Planos que lo anuncian antes de nacer | 0 | 4 (02, 08, 09, 10) |
| Tamaño en pantalla (medido a 1080p) | Unos 610 px al nacer; unos 250 en el descenso | Igual al nacer; en el descenso, 250 en general y 350 en el acercamiento, más el recuadro. En 12 y 15, un busto de unos 700 px |

Un solo código para lo que la torre descarta: la silueta azul claro con trama. Aparece cuatro veces
antes de que nazca y siempre significa lo mismo. Los rastros tienen la forma de los invitados y de los
bailarines; su silueta y su rostro no salen hasta el plano 11. Capturas:
`evidence/0.4.0/secuencia_protagonista.jpg`.

Lo que no puedo afirmar: que un espectador relacione el rastro azul de una invitada (plano 08) con el
protagonista. El enlace es el color y la repetición del gesto, no la forma. Es una de las cosas que
debe decir la prueba de comprensión.

## 4.9 Encuadres

| Encuadre que pedía el encargo | Dónde |
|---|---|
| General | 01, 04, 05, 11; 14 al principio y al final |
| Medio | 03 (anfitrión de espaldas), 08, 14 durante el acercamiento |
| Primer plano o plano corto (pies, tatuajes, siluetas) | **02** (pies de la fiesta), **10** (cintura para abajo, el paso), **11** (recuadro: hombro y tatuaje), **14** (recuadro: cabeza, hombro y brazo tatuado), 07 (detalle del tocadiscos) |
| Por encima del hombro | **12** (ante la pista) y **15** (ante el Refugio) |
| Subjetivo | **13** (el círculo del suelo que se abre). Es un recorte de la ilustración de la pista, no un dibujo hecho desde sus ojos |
| Lateral o de perfil | El protagonista está de perfil en 11 y 14; su rostro, de perfil, en 12 y 15 |
| Reflejos, sombras, siluetas incompletas | Los rastros azules de 08, 09 y 10; las piernas cortadas por la viñeta en 02 y 10 |
| Primeros planos de enlace | 02 con 10 (el mismo encuadre de pies, antes y después de la torre); 12 con 15 (el mismo encuadre desde el hombro, antes y después de bajar) |
| Planos de seguimiento en el descenso | 14: la tira de escenarios sube mientras él se queda en su sitio, y la cámara se acerca y lo acompaña |
| Transiciones con continuidad espacial | 10 a 11 (el descarte queda en el mismo punto de la pantalla donde luego nace); 12 a 13 a 14 (el mismo círculo del suelo, con las mismas grietas); 12 a 15 son la misma lámina: cada corte baja por la página |

## 4.10 El descenso y el Refugio

Los once puntos del encargo:

| | Punto | Plano | Segundo | Cómo se ve |
|---|---|---|---|---|
| 1 | Percibe la anomalía | 12 | 34,2 | Él en primer término, de espaldas. «TAC» dos veces. Se echa un poco atrás |
| 2 | La estructura responde | 12 | 34,9 | Sacudidas; el aro del suelo gira y aparecen grietas |
| 3 | El suelo se abre por el mecanismo ya establecido | 13 | 36,8 | El mismo círculo y el mismo efecto de la 0.3.1, ahora de cerca |
| 4 | Aparece la plataforma | 13 | 37,4 | Sube dentro del hueco (plataforma oficial del juego) |
| 5 | Queda sobre ella, de forma legible | 14 | 38,4 | Plano general, quieto 0,7 s antes de bajar |
| 6 | Desciende | 14 | 39,1 | La pista se va hacia arriba |
| 7 | Alternan planos cercanos y generales | 14 | 39,9 a 41,2 | General, acercamiento con recuadro, general |
| 8 | Se revela la profundidad de la torre | 14 | 39,6 a 41,9 | Balcones y luces de otras pistas a los lados; al abrirse el plano, el pozo sigue |
| 9 | Llega al Refugio | 14 | 41,95 | La plataforma frena; sacudida |
| 10 | Se incorpora o baja de la plataforma | 14 | 42,3 | Se repone y sale de ella andando |
| 11 | La imagen final reconoce el Refugio | 15 | 43,1 | Él de espaldas; delante, el Refugio (ilustración oficial), que gana luz. Título |

Lo que mejora respecto a la 0.3.1: antes todo esto era un solo plano general de 7,5 s con el
protagonista a unos 250 px de alto y sin ningún plano cercano. Ahora son cuatro planos con cuatro encuadres, dos de ellos desde su
hombro, y la última imagen es el Refugio visto con él.

Lo que no se ha hecho, y por qué:

- **No se ve cómo queda sobre la plataforma.** Entre el plano 13 (la plataforma sube, delante de él)
  y el 14 (él, encima) hay una elipsis. El hueco es más ancho que la plataforma y no hay ningún
  dibujo de él de espaldas de cuerpo entero ni caminando hacia el fondo. Hacerlo cruzar el vacío
  andando habría sido peor.
- **No se dice quién acciona el mecanismo.** No aparece nadie.
- **No aparece Tempo** ni ningún otro personaje en el Refugio, y no se añade ninguna estancia ni
  objeto: el plano 15 es la ilustración oficial sin retocar, con un velo oscuro que se levanta.
- **«Se incorpora»** se resuelve moviendo el dibujo entero (baja 13 px con la sacudida y vuelve). No se
  deforma ni se cambia de pose: los otros cuadros oficiales llevan otro vestuario.

## 4.11 Guion y recursos

**Textos.** De 14 a 12; ninguno nuevo. Detalle de los cambios en 4.5. Revisión, una a una, de las diez
adaptaciones. «Cercanía» es mi valoración, no una aprobación:

| Plano | Texto | Pasaje de la biblia | Cercanía |
|---|---|---|---|
| 01 | La guerra terminó. Por una noche, nadie tuvo que huir. | §2.1: «La fiesta celebraba el final de una guerra. Durante unas horas, personas que habían vivido esperando la muerte pudieron reunirse sin miedo.» | Media. «Huir» no está en la biblia: dice «esperando la muerte» |
| 03 | Que esta noche no termine. | §2.3: «el anfitrión pidió que aquella noche no terminase» | Alta. Pasa a estilo directo |
| 04 | Bajo el salón dormía algo que escuchaba. | §2.2: «Bajo el salón dormía una presencia sin rostro llamada la Escucha.» | Alta |
| 04 | Y devolvió lo que recibió. | §2.3: «La Escucha respondió repitiéndola.» | Alta |
| 05 | La noche empezó a crecer hacia abajo. | §2.3: «El salón creció hacia abajo, como un surco que se hunde en un disco.» | Media. La biblia dice «el salón», no «la noche» |
| 06 | Los deseos se convirtieron en leyes. | §2.3: «Los deseos más intensos de los invitados se convirtieron en las leyes de cada pista.» | Alta |
| 08 | Los vio felices. Pensó que unos minutos más no podían hacer daño. | §3.1: «Vio a los invitados felices y pensó que unos minutos más no podían hacer daño.» | Muy alta. Casi literal |
| 09 | La noche volvió a empezar. | §2.3: «El tiempo se plegó sobre sí mismo.» | **Baja.** Es la más libre de las diez: cuenta la consecuencia, no el pasaje |
| 10 | La torre corregía cada variación. | §4.1: «La torre corrigió el movimiento, pero descartó esa posibilidad.» | Media. Generaliza un hecho único |
| 11 | Lo que la torre rechazó terminó tomando forma. | §4.1: «todas las decisiones rechazadas se acumularon hasta formar una persona» | Alta |

Ninguna pasa a canon por tener cita: siguen siendo redacción de dirección. Las dos onomatopeyas
siguen siendo propuesta.

**Recursos.** Uno nuevo en la lista, y es oficial: `assets/ui/hud_portrait_protagonist.png`. No se ha
generado, copiado ni retocado ninguna imagen. `arte_nuevo/` no cambia: sigue sin aprobar y los planos
que lo usan llevan su sello (ahora nueve: 01 a 08 y 14).

Sobre el arte de la 0.3.1, para que conste aquí también: la estación se generó a 1376×768 y está
ampliada a 2560×1440; el pozo mide 768×1376 y se ajusta al ancho de la viñeta; las siluetas de los
invitados se obtuvieron de imágenes generadas. Ninguna tiene aprobación de dirección de arte. En los
planos 02 y 10 el fondo es un recorte muy ampliado y queda blando.

**Motor.** Cambios pequeños, todos opcionales para la composición:

| Archivo | Cambio |
|---|---|
| `js/efectos.js` | `figuras`: una figura puede ir medio pulso tarde y dejar rastro (`desliz`). `montaje`: rastros por tira (`ecos`). `descenso`: `iris.semilla`, para que las grietas sean las mismas en planos distintos |
| `js/motor.js` | Imagen con clase propia (`clase`). Recuadro que se retira (`sale`). Vaivén de caminar solo en un tramo (`anda`) |
| `comic.css` | Estilo del primer término a contraluz (`.mc-imagen.hombro`) |
| `js/guion.js`, `validar_guion.mjs`, `js/vista_previa.js` | El número de planos ya no está fijado en 10: se compara con `tempo.planos` del guion (15). Si el guion no lo declara, siguen siendo 10 |

## 4.12 Comprobaciones

Separo lo técnico de lo narrativo, como pide el encargo.

### Técnico

| Prueba | Resultado |
|---|---|
| `node assets/cinematics/motion_comic/validar_guion.mjs` | **0 errores, 0 avisos**, código de salida 0. 45,000 s, 15 planos, 12 textos (10 adaptados, 2 propuestas), 20 de 20 citas, 26 recursos, 9 planos con sello de arte nuevo |
| Reproducción completa en navegador (Chromium sin interfaz) | Llega a **45,000 s**. Sin errores de consola. Sin recursos fallidos. Comprobaciones de pantalla: 0 errores, 0 avisos |
| Textos en pantalla, al entrar, a la mitad y al salir | Los 12, visibles y dentro. Un aviso que es falso: la onomatopeya de varios golpes del plano 07 se mide en el momento en que cambia de sitio (ya ocurría en la 0.3.1) |
| Ritmo de lectura | El texto más rápido va a 16,8 caracteres por segundo (cómodo hasta 17) |
| Letra más pequeña | 30 px a 1080p (mínimo 26) |
| Prueba negativa: «Solo una más» en una copia temporal del guion | El validador da **2 errores** y sale con código 1 (frase reservada, y texto que ya no coincide con el fijado). El guion real no se tocó |
| Prueba negativa: guion que declara 10 planos | 1 error («Hay 15 planos; el guion declara 10»), código 1 |
| `node assets/cinematics/motion_comic/servir.mjs` | Funciona; todas las pruebas se han hecho contra él |
| Fluidez, composición por software | 1.863 fotogramas en 45 s; 2,5 s perdidos en 11 parones de 0,15 a 0,41 s. En la 0.3.1: unos 1.900 y 3,9 s. Con una variación de 10 a 30 % entre pasadas iguales, **solo indica que no ha empeorado** |
| Fluidez, modo gráfico emulado | Unos 300 fotogramas en 45 s. No es representativo de un equipo real, igual que en la 0.3.1 |

No se ha probado en un equipo con tarjeta gráfica, ni en Firefox, Safari o móvil.

### Narrativo

Lo que he comprobado yo, mirando las capturas a 1920×1080: que cada punto **está en pantalla**. No
que se entienda.

| Punto del encargo | ¿Está en pantalla? | Captura |
|---|---|---|
| La fiesta se entiende enseguida | Sí: estación, parejas, texto de la guerra en el primer segundo | `plano01_02.8s` |
| El protagonista deja señales antes de aparecer | Sí: 22,97 s, y cinco más entre 25,3 y 27,1 s | `plano08_23.4s`, `plano09_27.4s` |
| Su aparición sale de la repetición | Sí: nace en el punto exacto donde quedó el paso descartado | `plano10_29.9s`, `plano11_31.8s`, `plano11_32.3s` |
| Su diseño se reconoce | Sí: dibujo oficial de cuerpo entero, y recuadro con el tatuaje | `plano11_33.2s` |
| Tras nacer, guía la continuidad | Aparece en los cuatro planos siguientes o son su mirada | `secuencia_descenso.jpg` |
| Hay primeros planos, sobre el hombro y subjetivo | Sí (4.9) | `plano12_35.2s`, `plano13_37.6s` |
| El descenso tiene principio, desarrollo y llegada | Sí, con una elipsis entre 13 y 14 (4.10) | `secuencia_descenso.jpg` |
| El Refugio se reconoce como destino | Es la imagen final, con él delante. Dura 1,9 s | `plano15_44.8s` |
| No se revela información reservada | Ninguna frase reservada (lo comprueba el validador). Sin nombres de pistas ni de soberanos, sin Tempo en el Refugio | — |

**Prueba de comprensión: PENDIENTE. No se ha hecho.** No tengo a quién enseñársela. Hay que ponerla,
sin explicación previa, a alguien que no conozca el juego y preguntarle:

1. ¿Qué pasó en la fiesta?
2. ¿Qué le ocurrió al protagonista?
3. ¿De dónde salió?
4. ¿Adónde llegó al final?

El criterio del encargo es que responda a las cuatro sin leer nada aparte. Hasta entonces, «la
historia se entiende mejor» es una hipótesis de montaje, no un resultado.

## 4.13 Limitaciones y decisiones pendientes

Narrativas y de arte:

- **Comprensión sin comprobar** (4.12).
- **El nombre de Tempo ya no sale en pantalla.** Decidir si debe salir y cómo.
- **Elipsis entre los planos 13 y 14** (4.10).
- **El plano subjetivo es un recorte**, no una vista dibujada.
- **Dos dibujos oficiales del protagonista que no coinciden del todo.** El retrato (planos 11, 12 y 15)
  lleva cuello alto magenta y una calavera con rosa en el hombro; el de cuerpo entero (11 y 14) lleva
  otro chaleco y el tatuaje en el brazo. No se ha corregido ninguno. Alguien puede notarlo.
- **El retrato está ampliado** entre 3 y 3,4 veces. Se ve el píxel.
- **Escala en el Refugio.** En el plano 14 el protagonista es mucho más grande que los muebles de la
  ilustración. Ya pasaba en la 0.3.1.
- **Plano 02:** en el fondo ampliado se adivinan bailarines borrosos entre las piernas.
- **El plano 15 es corto** (1,9 s). Es el primer sitio donde pondría tiempo si se alarga a 48,750 s.
- **Los rastros tienen forma de invitado**, no de protagonista. Es deliberado, pero el enlace depende
  solo del color.
- **Dónde está el Refugio.** Sigue sin resolver: el apartado 5.3 de la biblia (propuesta) dice que al
  bajar se ven luces de otras pistas; el 5.1 pone el Refugio antes de la primera pista. La intro
  muestra el 5.3 y, debajo del Refugio, el pozo que sigue. No afirma que el Refugio esté bajo las
  nueve pistas. PENDIENTE de dirección.
- **La biblia dice que «despierta» en el Refugio** (§38, punto 13). Aquí llega de pie y sale de la
  plataforma, como pide este encargo. Si dirección prefiere que despierte, hace falta un dibujo que no
  existe.
- **El arte nuevo sigue sin aprobar.** Nada de esta versión lo cierra.
- **Sin sonido.** Los «TAC» y los pulsos son visuales.

Técnicas:

- Rendimiento sin medir en equipo real.
- Las teclas 1 a 9 y 0 solo saltan a los planos 1 a 10.
- La vista previa sigue sin integrarse en el juego, cuyo motor da 35 s a la intro.
- No he revisado punto por punto la lista de validación de 14 apartados del encargo 0.3.1; sigue como
  estaba.

## 4.14 Archivos

Todo dentro de `assets/cinematics/motion_comic/`. Nada fuera.

| Archivo | Cambio |
|---|---|
| `data/composicion.json` | Quince planos, cinco láminas, seis bloques. Versión 0.4.0-preview |
| `data/guion.json` | Doce textos; `tempo.planos`: 15. Versión 0.4.0-preview |
| `js/efectos.js`, `js/motor.js`, `comic.css` | Ver 4.11 |
| `js/guion.js`, `js/vista_previa.js`, `validar_guion.mjs` | Número de planos declarado por el guion |
| `README.md` | Puesto al día |
| `INFORME_DIRECCION_NARRATIVA.md` | Esta parte 4. Las partes 1 a 3 no se han reescrito; solo cambia la línea del índice que decía cuál era la vigente |
| `evidence/0.4.0/` | 43 imágenes nuevas. Las 31 de la 0.3.1 siguen en `evidence/` sin tocar |

Sin tocar: `arte_nuevo/`, `fuentes/`, `fonts/`, `servir.mjs`, `index.html`, `js/textos.js`,
`js/formas.js`, y todo lo que está fuera de esta carpeta.

---

# Parte 5 · Versión 0.5.0: «La ciudad que no termina»

Punto de partida: la 0.4.0-preview (commit `6dd62ae`). Encargo: «DEADBEAT DISCO — 0.5.0 · THE CITY
THAT NEVER ENDS», reconstrucción completa de la introducción.

Esta parte separa tres cosas, como pide el encargo:

- **Implementado:** lo que está en el repositorio y se ha comprobado (5.5 a 5.10).
- **Propuesto:** lo que la secuencia enseña sin respaldo en la biblia, marcado plano a plano como
  PROPUESTA VISUAL (5.6 y 5.8), y los textos de redacción nueva (5.7).
- **Pendiente:** lo que no se ha hecho o no se puede afirmar (5.11 y 5.12).

Las versiones anteriores no se han borrado ni reescrito. La 0.4.0 y la 0.3.1 siguen reproducibles
desde la misma vista previa (5.9).

## 5.1 Diagnóstico de la 0.4.0

Medido sobre la línea de tiempo y la composición de la 0.4.0 (45,000 s, 15 planos, 12 textos):

| Qué | Dato |
|---|---|
| Planos de exterior | Ninguno. No se ve la estación por fuera, ni una calle, ni una ciudad |
| Dónde ocurre la historia | Dentro del salón y de la torre, de principio a fin |
| Cómo se enseña que la torre crece | Con la sala repetida hacia abajo (plano 05) y un mosaico de nueve salas (plano 06): siempre desde dentro |
| Tiempo dedicado al protagonista, al descenso y al Refugio | 15,0 s de 45 (del segundo 30,0 al final): un tercio |
| Textos | 12 en 45 s |

Tres consecuencias:

1. **No hay escala.** Como todo ocurre dentro, la transformación afecta a una sala. Nada permite
   comparar el antes con el después, ni medir hasta dónde llega.
2. **No hay un lugar de partida.** La historia empieza ya dentro de la fiesta. No se ve que aquello
   fuera un sitio normal, en un mundo normal, antes de la noche.
3. **El último tercio es otra historia.** El protagonista, el descenso y el Refugio pertenecen a lo
   que viene después. El encargo 0.5.0 los saca de la introducción.

Lo que se conserva porque funcionaba: el orden de causas de la biblia (fiesta, deseo, Escucha, Tempo),
la Escucha sin cuerpo ni rostro, el tocadiscos y la nota que no termina, y el pozo de niveles.

## 5.2 Concepto

La cámara hace un solo viaje de ida y vuelta:

1. **Entra.** De la ciudad a la estación, de la fachada al salón, del salón a la persona que pide el
   deseo, y de ahí a lo que hay debajo.
2. **Sale.** El cambio empieza en el salón y la cámara retrocede con él: el salón, la fachada, la
   calle, los barrios, la ciudad entera, y un paso más atrás, donde la ciudad ya es solo un nivel.
3. **Vuelve a entrar, y cae.** Por la puerta, por el pozo, hasta mirar hacia abajo.

Los tres retrocesos usan los mismos encuadres que los tres avances: el plano 09 repite el encuadre
del 03 (el salón), el 10 el del 02 (la fachada) y el 12 el del 01 (la ciudad). Así el espectador
compara el mismo lugar antes y después sin que nadie se lo explique.

La transformación se cuenta **sin texto**: del segundo 23,9 al 41,3 (17,3 s, seis planos) no hay
ninguna palabra en pantalla.

No aparecen el protagonista, el Refugio ni el HUB, y ningún texto los menciona.

## 5.3 Tabla de recursos

Presentada a dirección antes de generar nada. «Calidad» describe el archivo, no lo aprueba.

| Escena | Recurso existente | Calidad | Reutilizable | Falta |
|---|---|---|---|---|
| 1 · La ciudad antes de la noche | Ninguno. `cine_bg01_city` es la ciudad ya transformada | — | No para el «antes» | **Una ciudad normal, con la estación encendida, en la composición de `cine_bg01_city`** |
| 1 · La estación por fuera | Ninguno. `cine_bg02_club_exterior` es la entrada ya transformada | — | No para el «antes» | **La fachada de la estación, en la composición de `cine_bg02_club_exterior`** |
| 2 · La Primera Noche | `arte_nuevo/estacion_primera_noche.png` y cuatro siluetas de invitados (0.3.1) | 2560×1440 ampliado desde 1376×768; sin aprobar | Sí | Nada |
| 3 · El deseo y la Escucha | `anfitrion_contraluz.png`, `tocadiscos_tempo.png` (0.3.1); retrato oficial `dialogue_portrait_dj.png`; ondas dibujadas por el motor | Sin aprobar lo nuevo; el retrato es oficial | Sí | Nada. El retrato oficial enseña a Tempo con su aspecto dentro de la torre |
| 4 · El salón, la fachada y la calle cambian | Oficiales `cine_bg05_dancefloor`, `cine_bg02_club_exterior`, `cine_bg01_city` | 2560×1440 con marco pintado; `cine_bg01_city` tiene poco detalle real y no admite recortes cerrados | Sí, como «después» | Los estados intermedios: se resuelven por código (revelado circular), sin dibujo nuevo |
| 5 · La ciudad devorada | Oficial `cine_bg01_city` | Igual | Sí | Una vista más amplia que la ciudad no existe: se resuelve repitiendo la ilustración oficial por código |
| 6 · Hacia dentro y hacia abajo | Oficiales `cine_bg02_club_exterior`, `cine_bg03_entrance`; `arte_nuevo/pozo_torre.png` (0.3.1) | El pozo mide 768×1376 y se amplía 2,6 veces; sin aprobar | Sí | **Una imagen final: la torre por dentro, mirando hacia abajo** |

Descartados a propósito: `cine_circle_00_hub` (es el Refugio), los fondos de menú y las referencias
`REF_01_*` (sale el protagonista), `cine_bg06_hero` y `map_infernal_tower.png` (no hacen falta).

## 5.4 Arte nuevo de esta versión

Con esa tabla se pidió autorización para tres imágenes y dirección respondió «Sí: 3 imágenes». Se
generaron **exactamente tres**, una vez cada una, y no se ha generado ninguna más.

| Archivo | Qué es | Referencia dada a la herramienta | Planos |
|---|---|---|---|
| `arte_nuevo/ciudad_antes_de_la_noche.png` | Ciudad industrial de noche; en el centro, la estación de hierro y cristal, encendida | Composición de `cine_bg01_city`; estilo de `estacion_primera_noche.png` | 01, 11, 12 |
| `arte_nuevo/estacion_fachada.png` | La entrada de la estación desde la calle, de frente | Composición de `cine_bg02_club_exterior` | 02, 10 |
| `arte_nuevo/corazon_torre.png` | La torre por dentro, en picado: anillos de niveles hasta un punto negro | Estilo de `pozo_torre.png` y de `cine_bg03_entrance` | 16 |

Las tres se generaron a 1376×768 y se ampliaron a 2560×1440; no son dibujos nativos a ese tamaño. La
salida sin retocar está en `arte_nuevo/generado/`. El origen, el tratamiento y las notas de revisión
están en `arte_nuevo/MANIFIESTO.md`.

**La autorización fue para generarlas y probarlas en el montaje. Ninguna ha sido revisada ni aprobada
por dirección de arte.** Todos los planos que las usan llevan el sello «ARTE NUEVO · SIN APROBAR».

Lo que conviene mirar al revisarlas:

- **Fachada:** los carteles de la pared llevan letras ilegibles, inventadas por la herramienta.
- **Ciudad:** se parece a la composición de `cine_bg01_city`, pero no coincide edificio por edificio.
  Por eso el paso de una a otra se hace con un círculo que avanza y no con un fundido, que dejaría ver
  el desajuste.
- **Corazón de la torre:** es de línea limpia, no de píxel marcado como los fondos oficiales.

## 5.5 Estructura y tiempos

128 pulsos por minuto; 1 pulso = 0,46875 s; **104 pulsos = 48,750 s** (26 compases de 4); 16 planos
en 6 bloques y 6 láminas (A a F).

La 0.4.0 duraba 45,000 s. El encargo pide no forzar la duración si perjudica la comprensión: los ocho
pulsos de más (3,75 s) están en los bloques 4 y 5, donde cada etapa del cambio necesita verse empezar
y terminar. La parte 4 ya contemplaba alargar la secuencia a 48,750 s (4.13).

| Bloque | Planos | Empieza | Dura | Pulsos |
|---|---|---|---|---|
| 1 · La ciudad | 01, 02 | 0,000 s | 6,094 s | 13 |
| 2 · La Primera Noche | 03, 04 | 6,094 s | 6,094 s | 13 |
| 3 · El deseo y la Escucha | 05 a 08 | 12,188 s | 11,719 s | 25 |
| 4 · La ciudad empieza a transformarse | 09 a 11 | 23,906 s | 8,438 s | 18 |
| 5 · La ciudad devorada | 12, 13 | 32,344 s | 7,031 s | 15 |
| 6 · El corazón de la torre | 14 a 16 | 39,375 s | 9,375 s | 20 |

| Plano | Empieza | Dura | Pulsos | Lámina | Entra por | Texto |
|---|---|---|---|---|---|---|
| 01 La ciudad | 0,000 s | 3,750 s | 8 | A | Inicio | «La guerra terminó.» |
| 02 La estación | 3,750 s | 2,344 s | 5 | A | Deslizamiento | — |
| 03 La Primera Noche | 6,094 s | 3,750 s | 8 | B | Destello | «Por una noche, pudieron reunirse sin miedo.» |
| 04 Los que sobrevivieron | 9,844 s | 2,344 s | 5 | B | Deslizamiento | — |
| 05 El deseo | 12,188 s | 2,344 s | 5 | C | Paso de página | «Que esta noche no termine.» |
| 06 La Escucha | 14,531 s | 4,219 s | 9 | C | Deslizamiento | «Bajo el salón dormía algo que escuchaba.» · «Y devolvió lo que recibió.» |
| 07 La nota que no termina | 18,750 s | 1,875 s | 4 | C | Deslizamiento | «TAC» |
| 08 Unos minutos más | 20,625 s | 3,281 s | 7 | C | Latigazo | «Pensó que unos minutos más no podían hacer daño.» |
| 09 El salón cambia | 23,906 s | 3,281 s | 7 | D | Paso de página | — |
| 10 Las puertas | 27,188 s | 2,344 s | 5 | D | Deslizamiento | — |
| 11 La calle | 29,531 s | 2,813 s | 6 | D | Deslizamiento | — |
| 12 Los barrios | 32,344 s | 3,750 s | 8 | E | Paso de página | — |
| 13 La ciudad devorada | 36,094 s | 3,281 s | 7 | E | Corte | — |
| 14 Hacia el centro | 39,375 s | 1,875 s | 4 | F | Paso de página | — |
| 15 Los niveles | 41,250 s | 3,750 s | 8 | F | Deslizamiento | «Y siguió creciendo hacia abajo.» · «Cada deseo se hizo ley.» |
| 16 El corazón de la torre | 45,000 s | 3,750 s | 8 | F | Impacto | — |

La pantalla queda en negro en el pulso 7 del plano 16 (48,281 s) y sigue en negro hasta el final.

## 5.6 Guion gráfico, plano a plano

La misma ficha está en `data/composicion.json` (campos `encuadre`, `movimiento`, `historia`,
`funcion`, `clasificacion` y `clasificacion_nota` de cada plano). En la vista previa, la clasificación
se lee junto al nombre del plano y la ficha aparece al pasar el ratón por encima.

| Plano | Encuadre y cámara | Qué se ve | Para qué está |
|---|---|---|---|
| 01 | Gran plano general. Avance lento hacia la estación | Una ciudad industrial de noche: fábricas, casas con pocas ventanas encendidas, un tren de vapor en el viaducto. En el centro, la estación, el único edificio lleno de luz | Situar la historia en un lugar reconocible y señalar la estación |
| 02 | General frontal. Avance hacia la puerta | La fachada: ladrillo, hierro, reloj, guirnaldas. Tras los cristales, parejas bailando | Llevar de la ciudad al interior y fijar la fachada que luego cambiará |
| 03 | General del interior. Avance muy leve | La estación convertida en salón: bóveda, columnas, reloj, mesas con velas, parejas y soldados | Decir qué se celebra |
| 04 | Plano medio de grupo. Deslizamiento lateral | La fiesta de cerca y a contraluz: una pareja, un soldado que brinda, otra pareja en un giro | Dar escala humana a la celebración |
| 05 | Plano medio, de espaldas. Avance leve | Las luces se enfrían. El anfitrión, sin rostro, levanta la copa y pide que la noche no termine | La causa |
| 06 | General en vertical. La cámara baja bajo el suelo | El deseo baja como una onda. Abajo no hay nadie: una superficie lo recibe y lo devuelve igual | La respuesta, sin inventar un ser |
| 07 | Detalle desde arriba | El tocadiscos. La aguja salta al mismo surco. Tempo lo nota | La música deja de avanzar |
| 08 | Plano medio con dos recuadros | Tempo mira a los invitados y enlaza otro disco. La sala se enciende otra vez | La segunda causa: alguien, por cariño, da cuerda a la repetición |
| 09 | El encuadre del 03, casi fijo | Del templete de la música sale un aro de luz que crece. Dentro, la estación ya es una pista de baile | Primer cambio visible, desde dentro |
| 10 | El encuadre del 02, alejándose un poco | El aro sale por la puerta y recorre la fachada: el ladrillo es piedra tallada, las ventanas son vidrieras | El cambio sale del salón |
| 11 | Conjunto de la estación y su calle. Retroceso corto | Donde estaba la estación hay una torre encendida. El aro alcanza las primeras casas | El cambio alcanza otros edificios |
| 12 | El encuadre del 01. Cámara fija; una sacudida en cada avance | El aro crece a golpes hasta cubrir la ciudad. Al terminar no queda nada de la ciudad de antes | El punto fuerte: se entiende la escala |
| 13 | Gran plano general que se abre en dos golpes | La cámara retrocede otra vez: a los lados y debajo aparece la misma ciudad, repetida, cada nivel más oscuro | La ciudad entera es una pieza de la torre |
| 14 | Frontal. Avance rápido | La puerta transformada. La cámara la atraviesa: detrás, un pasillo de arcos iguales | Pasar del exterior al interior |
| 15 | Corte vertical. La cámara baja y se acelera | El pozo: balcones y salas iguales, cada una con una luz distinta | Qué es la torre por dentro |
| 16 | Picado total. Avance al centro mientras la imagen gira | Los niveles son anillos, uno dentro de otro, hasta un punto negro. Corte a negro | La imagen final: una profundidad que no se explica |

## 5.7 Textos

Nueve piezas (la 0.4.0 tenía doce): ocho adaptadas de la biblia y una propuesta. Ninguna literal.

| Plano | Texto | Estado | Pasaje de la biblia que adapta |
|---|---|---|---|
| 01 | «La guerra terminó.» | Adaptado. Ya estaba en la 0.4.0 | §2.1 «La fiesta celebraba el final de una guerra.» |
| 03 | «Por una noche, pudieron reunirse sin miedo.» | Adaptado. **Redacción nueva** | §2.1 «Durante unas horas, personas que habían vivido esperando la muerte pudieron reunirse sin miedo.» |
| 05 | «Que esta noche no termine.» (anfitrión, sin nombre) | Adaptado. Ya estaba | §2.3 «…el anfitrión pidió que aquella noche no terminase.» |
| 06 | «Bajo el salón dormía algo que escuchaba.» | Adaptado. Ya estaba | §2.2 «Bajo el salón dormía una presencia sin rostro llamada la Escucha.» |
| 06 | «Y devolvió lo que recibió.» | Adaptado. Ya estaba | §2.3 «La Escucha respondió repitiéndola.» |
| 07 | «TAC» | **Propuesta** (onomatopeya). Lleva el sello «PROPUESTA» | Ninguno |
| 08 | «Pensó que unos minutos más no podían hacer daño.» | Adaptado. Ya estaba | §3.1 «Vio a los invitados felices y pensó que unos minutos más no podían hacer daño.» |
| 15 | «Y siguió creciendo hacia abajo.» | Adaptado. **Redacción nueva** | §2.3 «El salón creció hacia abajo, como un surco que se hunde en un disco.» |
| 15 | «Cada deseo se hizo ley.» | Adaptado. **Redacción nueva** | §2.3 «Los deseos más intensos de los invitados se convirtieron en las leyes de cada pista.» |

Las tres redacciones nuevas no añaden hechos: acortan un pasaje. Aun así no las ha visto dirección, y
el validador solo comprueba que el pasaje citado existe, no que la adaptación sea fiel. **Quedan
pendientes de visto bueno.**

Ningún texto habla de la ciudad. Todo lo que la secuencia cuenta sobre ella lo cuenta la imagen, y
está marcado como PROPUESTA VISUAL. No hay ninguna frase de lore nueva.

`banco_de_alternativas`, en el guion, guarda las citas literales sin colocar por si se prefiere
sustituir alguna adaptación.

## 5.8 Qué es canon y qué es propuesta

La biblia dice que el salón era una antigua estación de tren reconvertida, y que la torre conserva
rastros de la estación y del club. **No menciona ninguna ciudad, ni calles, ni barrios.** Tampoco dice
que el cambio saliera del edificio. Por tanto, toda la capa de la ciudad es una interpretación
cinematográfica del encargo, no un hecho de la biblia.

| Clasificación | Planos | Qué significa aquí |
|---|---|---|
| **CANON** | 03, 05, 06, 07, 08, 15 | Lo que el plano cuenta está en la biblia (§2.1, §2.2, §2.3, §3.1) |
| **DISEÑO DEFINIDO** | 04, 14 | Puesta en escena ya decidida en versiones anteriores, o hecha solo con arte oficial, que no añade hechos |
| **PROPUESTA VISUAL** | 01, 02, 09, 10, 11, 12, 13, 16 | Inferencia sin respaldo en la biblia, o arte nuevo que define cómo se ve algo. No es canon |

Lo que propone cada plano marcado:

- **01 y 02.** Cómo era la ciudad y cómo era la estación por fuera. Aprobar estas imágenes fija el
  aspecto del lugar antes de la Primera Noche: es una decisión narrativa, no solo de arte.
- **09.** Que el cambio avance como un aro desde la música. La biblia dice que la torre nace de la
  repetición; no dice cómo se vio.
- **10 y 11.** Que el cambio saliera a la calle y alcanzara otros edificios. La biblia solo dice que
  las puertas dejaron de llevar al exterior.
- **12 y 13.** La «ciudad devorada». Es el concepto del encargo; no tiene apoyo en la biblia. El plano
  13 no es un dibujo nuevo: es la ilustración oficial `cine_bg01_city` repetida por el motor.
- **16.** La vista en picado. La biblia dice que el salón creció hacia abajo «como un surco que se
  hunde en un disco»; el giro de la imagen sale de ahí. No se enseña ni se explica el fondo.

Reglas del encargo, comprobadas sobre el resultado:

| Regla | Cómo queda |
|---|---|
| La Escucha no es un antagonista | No tiene cuerpo, rostro ni voz. Es una superficie que devuelve la onda. El texto dice «devolvió lo que recibió» |
| No había torre ni núcleo antes de la fiesta | Bajo el salón solo hay oscuridad y la superficie que escucha. La torre aparece en el plano 11, después del deseo |
| Ni protagonista, ni Refugio, ni HUB | No aparecen en ninguna imagen ni en ningún texto. No se usa `cine_circle_00_hub` |
| Sin frases de lore nuevas | Ocho textos adaptan pasajes citados; el noveno es una onomatopeya |
| Sin frases reservadas | El validador las rechaza (5.10) |

## 5.9 Motor y herramientas

No se ha reconstruido nada que funcionara. Lo añadido:

| Añadido | Dónde | Para qué |
|---|---|---|
| Efecto `transforma` | `js/efectos.js`, `comic.css` | Revela una imagen «después» dentro de un círculo que crece, con un aro de luz en el borde. Admite encuadre propio. Planos 09, 10, 11, 12 y 14 |
| Efecto `repite` | `js/efectos.js`, `comic.css` | Repite una ilustración en casillas, con forjado entre filas, media casilla de desfase y oscurecido por nivel. Plano 13 |
| Curva por claves (`porClaves`) | `js/efectos.js` | Movimiento a golpes: el aro y los retrocesos avanzan con el pulso |
| `giro` del arte | `js/motor.js` | La ilustración gira mientras la cámara avanza. Plano 16 |
| `negro` del plano | `js/motor.js`, `comic.css` | Negro a pantalla completa, por encima del papel y de los sellos. Final del plano 16 |
| Duración declarada (`tempo.duracion_s`) | `js/vista_previa.js`, `js/guion.js`, `validar_guion.mjs` | La duración deja de ser un 45 fijo. Si el guion no la declara, vale 45 |
| Selector de versión | `index.html`, `js/vista_previa.js`, `data/versiones/` | Reproduce la 0.4.0 y la 0.3.1 con el motor actual. También `?version=0.4.0` |
| `--version <id>` | `validar_guion.mjs` | Valida una versión guardada |
| Ficha del plano | `js/vista_previa.js`, `js/guion.js` | Enseña la clasificación junto al nombre del plano. Si falta la clasificación o la ficha de un plano, es un error |
| Teclas | `js/vista_previa.js` | Con Mayús o Alt, los dígitos saltan a los planos 11 a 20 |

`data/versiones/0.4.0/` y `data/versiones/0.3.1/` son copias exactas de los datos de los commits
`6dd62ae` y `0dd82f2`. `data/versiones/0.5.0/` es copia de los datos vigentes, para que esta versión
siga disponible cuando haya otra.

## 5.10 Comprobaciones

Todo se ha medido en Chromium sin interfaz y sin aceleración gráfica, a 1920×1080, contra
`servir.mjs`.

### Técnico

| Prueba | Resultado |
|---|---|
| `node assets/cinematics/motion_comic/validar_guion.mjs` | **0 errores, 0 avisos**, código de salida 0. 48,750 s, 16 planos, 9 textos, 15 de 15 citas, 16 recursos (11 nuevos sin aprobar), 14 planos con sello de arte nuevo |
| El mismo con `--version 0.4.0` y `--version 0.3.1` | 0 errores y 0 avisos en las dos (45,000 s; 15 y 10 planos) |
| Reproducción completa a velocidad real | Llega a **48,750 s** en 48,91 s de reloj. 2.229 fotogramas. Sin errores de consola. Sin recursos fallidos. Comprobaciones de pantalla: 0 errores, 0 avisos |
| Reproducción con `?version=0.5.0`, `0.4.0` y `0.3.1` | Las tres llegan al final sin errores (48,75 s, 45 s y 45 s) |
| Textos, al entrar, a la mitad y al salir | Los 9, visibles y dentro de la imagen. 0 problemas |
| Ritmo de lectura | El más rápido va a 16,8 caracteres por segundo (cómodo hasta 17, máximo 21) |
| Letra más pequeña | 30 px a 1080p (mínimo 26) |
| Negro final | De 48,281 s al final cubre la pantalla entera. Al volver atrás, desaparece |
| Selector de versión | Lista las tres. Al elegir la 0.4.0 carga 15 planos y 45 s y lo rotula «versión anterior»; al volver, 16 planos y 48,75 s |
| Teclas | `7` va al plano 7; `0`, al 10; Alt+`3`, al 13; Alt+`6`, al 16; Mayús+`2`, al 12 |
| Fluidez | Dos pasadas: 2.194 fotogramas con 2,6 s perdidos en 10 parones, y 2.110 con 3,7 s en 16. El peor, de 0,60 a 0,64 s, al entrar el plano 03 (6,1 s); los demás, de 0,16 a 0,36 s, casi todos en cambios de plano |

Pruebas negativas, sobre una copia temporal (los datos reales no se tocaron). Todas salen con código 1:

| Cambio en la copia | Error que da el validador |
|---|---|
| «Solo una más.» como texto | Frase reservada; y el texto ya no coincide con el fijado |
| Duración declarada de 45 s | «La duración es 48.750 s y el guion declara 45.000 s» |
| Declarar 15 planos | «Hay 16 planos; el guion declara 15» |
| Quitar la clasificación del plano 11 | «Plano 11: falta la clasificación…» |
| Quitar el sello de arte del plano 01 | «Usa arte nuevo sin aprobar (ciudad_antes) y no lleva sello de arte» |

Sobre la fluidez: los parones varían mucho entre pasadas iguales y el equipo de prueba no tiene
tarjeta gráfica. Las cifras dicen que la secuencia llega al final a tiempo; **no dicen cómo se verá
en un equipo real.** No se ha probado en Firefox, Safari ni móvil.

### Narrativo

He mirado 47 capturas a 1920×1080 que cubren los 16 planos (`evidence/0.5.0/`). Lo que puedo afirmar
es que cada cosa **está en pantalla**; no que se entienda.

| Qué debe verse | ¿Está? | Captura |
|---|---|---|
| Un lugar normal antes de la noche | Sí: ciudad, tren, estación encendida | `plano01_00.6s`, `plano01_02.0s` |
| La fiesta y qué celebra | Sí: salón, parejas, soldado; dos textos | `plano03_07.5s`, `plano04_10.8s` |
| El deseo y quién lo pide | Sí | `plano05_13.2s` |
| Algo lo escucha y lo devuelve, sin ser un personaje | Sí: ondas y superficie; ningún cuerpo | `plano06_17.0s`, `plano06_18.4s` |
| La música se repite; Tempo la deja seguir | Sí | `plano07_20.4s`, `plano08_23.5s` |
| El cambio empieza en el salón | Sí | `plano09_25.4s` |
| El cambio sale y crece | Sí: fachada, calle, barrios | `secuencia_transformacion.jpg` |
| El mismo lugar, antes y después | Sí: tres parejas de encuadres iguales | `antes_y_despues_en_la_historia.jpg` |
| La ciudad es solo un nivel | Sí: la misma ciudad debajo, más oscura | `plano13_37.2s`, `plano13_39.1s` |
| La torre por dentro y hacia abajo | Sí | `secuencia_final.jpg` |
| No se explica el fondo | Sí: punto negro y corte a negro | `plano16_47.6s`, `plano16_48.5s` |

**Prueba de comprensión: PENDIENTE. No se ha hecho.** No tengo a quién enseñársela. Hay que ponerla,
sin explicación previa, a alguien que no conozca el juego y hacerle las cinco preguntas del encargo.
Hasta entonces, que la historia se entienda es una hipótesis de montaje, no un resultado.

## 5.11 Limitaciones y decisiones pendientes

Narrativas y de arte:

- **Comprensión sin comprobar** (5.10).
- **La ciudad no está en la biblia** (5.8). Si dirección acepta esta introducción, acepta que hubo una
  ciudad y que la torre la absorbió. Conviene decidirlo y, si procede, llevarlo a la biblia.
- **Todo el arte de `arte_nuevo/` sigue sin aprobar**: las ocho piezas de la 0.3.1 y las tres de esta
  versión. Catorce de los dieciséis planos dependen de él.
- **Tres textos de redacción nueva**, pendientes de visto bueno (5.7).
- **El nombre de Tempo no sale en pantalla.** Pendiente desde la 0.4.0.
- **El retrato de Tempo** de los planos 07 y 08 es el oficial del juego, con cascos y luces de neón.
  En la Primera Noche es un anacronismo. No existe un dibujo suyo de época y no se ha generado ninguno.
- **Plano 13.** La repetición es visible como repetición: es la misma ilustración, en espejo a los
  lados y desplazada debajo. Es deliberado, pero un dibujo propio lo haría mejor.
- **Planos 11 y 12.** La ciudad de antes y la de después no coinciden edificio por edificio (5.4).
- **Plano 14.** El pasillo que se ve tras la puerta es otra ilustración oficial, no el interior real
  de esa puerta.
- **Sin sonido.** No hay música ni efectos, y no se ha añadido ningún archivo de audio. El «TAC» y los
  pulsos son visuales. La claqueta de la vista previa es un sonido sintetizado de referencia, como en
  las versiones anteriores.

Técnicas:

- Rendimiento sin medir en un equipo real ni en otros navegadores.
- No hay exportación a vídeo.
- La vista previa no está integrada en el juego. No se ha tocado `src/` ni el HUB.
- La 0.4.0 y la 0.3.1 se reproducen con el motor actual, no con el de su commit. Llegan al final sin
  errores, pero no las he comparado fotograma a fotograma con sus capturas originales.

## 5.12 Archivos

Todo dentro de `assets/cinematics/motion_comic/`. Nada fuera.

| Archivo | Cambio |
|---|---|
| `data/composicion.json`, `data/guion.json` | Versión 0.5.0-preview: 16 planos, 6 bloques, 9 textos |
| `data/versiones/indice.json` | Nuevo: lista de versiones del selector |
| `data/versiones/0.5.0/`, `0.4.0/`, `0.3.1/` | Nuevos: datos de cada versión |
| `arte_nuevo/ciudad_antes_de_la_noche.png`, `estacion_fachada.png`, `corazon_torre.png` | Nuevos, sin aprobar |
| `arte_nuevo/generado/` | Tres salidas sin retocar, añadidas |
| `arte_nuevo/MANIFIESTO.md` | Sección de la 0.5.0 |
| `js/efectos.js`, `js/motor.js`, `js/guion.js`, `js/vista_previa.js`, `comic.css`, `vista_previa.css`, `index.html`, `validar_guion.mjs` | Ver 5.9 |
| `README.md` | Puesto al día |
| `INFORME_DIRECCION_NARRATIVA.md` | Esta parte 5. Las partes 1 a 4 no se han reescrito; solo cambia el índice del principio |
| `evidence/0.5.0/` | 59 imágenes nuevas. `evidence/0.4.0/` y `evidence/` siguen sin tocar |

Sin tocar: `fuentes/`, `fonts/`, `servir.mjs`, `js/textos.js`, `js/formas.js`, `js/util.js`,
`js/dom.js`, `INFORME_PULIDO_FASE2.md`, las ocho piezas de arte de la 0.3.1 y todo lo que está fuera
de esta carpeta.
