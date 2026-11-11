# Informe de dirección narrativa · Reconstrucción de la introducción

Motion comic de la introducción de DEADBEAT DISCO. Punto de partida: versión **0.2.1-preview**
(commit `57d33d9`). Este informe tiene dos partes:

- **Parte 1 · Análisis previo.** Escrita y guardada en el repositorio antes de tocar el guion, las
  composiciones o el motor.
- **Parte 2 · Resultado.** Se añade al terminar la implementación.

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
