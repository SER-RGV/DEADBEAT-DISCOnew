# TANDA EN CURSO: `R03_JEFES`

- **Contenido:** 10 jefes × 4 estados + Arquitecto × 2 = **42 ilustraciones**.
- **Hecho:** 15 de 42, integradas y vistas en juego. **Faltan 27** (tres turnos de
  generación a 10 por turno).
- **Commit de cierre previsto:** `feat(art): R03 jefes en ilustración, validados en juego`

## Estado

| | Ilustraciones | Detalle |
|---|---:|---|
| Integradas y vistas en juego | **15** | `idle` de los 11 jefes; `attack` de Andén, Magneta, Bufé y Pogo |
| Por generar | **27** | `attack` × 7 (Cajero, Oficiante, Matarife, Imitador, Traidor, Núcleo, Arquitecto) · `hit` × 10 · `death` × 10 |

**Los once jefes ya se ven ilustrados en combate.** Los 27 PNG antiguos en pixel art
siguen en `assets/bosses/`, pero el juego ya no los dibuja: no se mezclan revisiones.
Mientras un jefe no tenga un fotograma nuevo, se ve así:

| Estado | Con fotograma nuevo | Sin fotograma nuevo |
|---|---|---|
| Ataque | Fotograma `attack` (4 jefes) | `idle` algo inclinado + las señales del motor (anillo y sector de aviso) |
| Vulnerable tras un patrón | Fotograma `hit` (ninguno todavía) | `idle` + anillo de «expuesto» |
| Impacto de bala | Destello breve; nunca cambia de fotograma | igual |
| Muerte | Fotograma `death` (ninguno todavía) | El `idle` se hunde, se ensancha y se desvanece en 1 s |

El fotograma `hit` se usará en la ventana de vulnerabilidad que el motor abre después
de cada patrón (`exposedT`, daño × 1,5), no en cada bala: a la cadencia del
protagonista, un cambio de pose por impacto sería un parpadeo continuo.

## Qué se ha comprobado en juego y qué no

Sonda `tools/art_master/probe_bosses.js` sobre la compilación de este commit
(informe en [`evidence/R03/probe_bosses.json`](evidence/R03/probe_bosses.json)):

- Los **11 jefes**, cada uno invocado en su círculo (el Núcleo en el nivel 100, el
  Arquitecto por su encuentro secreto).
- **19 situaciones por jefe**: aparición, reposo mirando a cada lado, caminar, ataque,
  vulnerable, impacto, aviso y disparo del barrido, escudo de esbirros, congelado,
  furia, vida baja, detrás y delante del protagonista, y muerte en cuatro instantes.
- Tarjeta de presentación de los 11.
- **0 errores de página y 0 de red.** Cifras exactas de la última pasada en
  [`PRODUCTION_LOG.md`](PRODUCTION_LOG.md).

Lo que **no** cubre:

- Los estados se fuerzan con un gancho de QA que escribe los campos del motor (fase,
  temporizadores, vida). El patrón de disparo y la muerte sí son los del motor. **No
  se ha jugado un combate completo de principio a fin.**
- Etapas 2 y 3 del Núcleo, fases 2 y 3 del Arquitecto y la fase `volley`: sin capturar.
- **La muerte del Núcleo y la del Arquitecto no llegan a verse:** el motor abre la
  pantalla de fin de partida en el mismo fotograma en que mueren.
- En los otros nueve, el motor abre el panel «VARÍA TU DISPARO» un fotograma después
  de la muerte y detiene la simulación: el jefe queda de pie detrás del panel y se
  derrumba cuando el jugador elige. Es el comportamiento del motor; no se ha tocado.

## Defectos de código corregidos en esta tanda

Sin estas correcciones el arte nuevo se habría visto como el antiguo: una figura fija.

| Defecto | Causa | Corrección |
|---|---|---|
| El jefe se veía siempre en reposo y mirando a la derecha | `DD_WORLD.drawBoss` decidía el estado con campos que el motor no tiene (`attackT`, `castT`, `dashT`) y la orientación con `vx`, que tampoco existe | `ddBossView` traduce el estado real del motor y orienta al jefe hacia el protagonista |
| No se dibujaba nada de lo que el motor pinta junto al jefe: **el sector y el rayo del barrido**, la barra de vida, el anillo de vulnerable, el arco del escudo de esbirros, el anillo de congelación, los anillos de aparición ni el destello de impacto. El rayo del barrido hacía daño sin verse (deducido del código: en la compilación anterior no se capturó el barrido) | El puente sustituía entera la función del motor que dibuja al jefe; todo eso vive dentro de ella. (El aviso de los patrones sí se veía: lo pinta otra función) | `ddBossRings` y `ddBossFloorCues` reponen cada señal |
| La muerte del jefe la pintaba el motor con su sprite antiguo | No había versión nueva | `drawBossDeath`: registro de 1 s con la ilustración del jefe |
| Barra de vida | La del motor iba a 50 px sobre el centro de colisión: a media altura de una figura de 190 px | Se coloca sobre el borde superior real del dibujo; ámbar por debajo del 35 % |
| La furia (menos del 35 % de vida) no se distingue sobre suelos rojos | La señal del motor es un aura roja a ras de suelo | Además del aura, filo rojo pulsante alrededor de la figura |
| La tarjeta de presentación rotulaba a los once jefes con el mismo texto («Anfitrión de la Cámara · Duelo a Muerte») | La instantánea del motor no llevaba el título del residente y se usaba el texto de respaldo | Se pasa el título del motor: «EL PORTERO», «LA ANFITRIONA», «EL QUE COBRA LA ENTRADA»… |
| En esa tarjeta el retrato miraba fuera de la pantalla y quedaba plantado sobre el suelo de la sala, como un segundo jefe | Se pintaba la ilustración tal cual sobre la escena | Retrato reflejado hacia la sala, sobre un velo oscuro |

Evidencia: [`evidence/R03/`](evidence/R03/) (`00`–`01` antes, `04`–`14` cada jefe en
juego, `15`–`17` tarjeta antes y después).

## Quién es cada jefe (tres fuentes que no coinciden)

El motor, las guías visuales y la biblia de lore nombran y describen a los jefes de
forma distinta. Se documenta la correspondencia adoptada; **no se cambia ningún nombre
del juego**.

| Id del asset | Círculo y jefe según el motor (lo que el juego muestra) | Guía `REF_03` | Biblia de lore | Alto en el mundo |
|---|---|---|---|---:|
| `boss_00_anden` | I Limbo · ANDÉN, el Portero | — (no hay Limbo en la guía) | §17.1 El Portero sin Rostro (subjefe) | 196 |
| `boss_01_magneta` | II Lujuria · MAGNETA, la Anfitriona | I Lujuria | Véspera, la Última Invitación | 190 |
| `boss_02_bufe` | III Gula · BUFÉ, el Anfitrión sin Fondo | II Gula | Voraz, el Anfitrión Hueco | 178 |
| `boss_03_cajero` | IV Avaricia · EL CAJERO, el que cobra la entrada | III Avaricia | Áurea, la Coleccionista de Instantes | 190 |
| `boss_04_pogo` | V Ira · EL POGO, el que abre la pista | IV Ira | Brama, el Santo del Ruido | 186 |
| `boss_05_oficiante` | VI Herejía · EL OFICIANTE, el que oficia el ruido | V Herejía | El Obispo de la Nota Ausente | 194 |
| `boss_06_matarife` | VII Violencia · EL MATARIFE, el que despieza el set | VI Violencia | El Corazón Encadenado | 188 |
| `boss_07_imitador` | VIII Fraude · EL IMITADOR, el que duplica la pista | VII Fraude | El Crupier de las Mil Voces | 192 |
| `boss_08_traidor` | IX Traición · EL TRAIDOR, el último residente | VIII Traición | Nix, la Voz que Faltaba | 200 |
| `boss_09_nucleo` | Núcleo final · la Última Canción | IX Núcleo | El Rey del Compás | 204 |
| `boss_10_arquitecto` | Jefe secreto · el Arquitecto del Club (DJ-Director) | — | — | 192 (unos 209 con su radio de 38) |

El protagonista mide 104 px de mundo: los jefes van de 1,7 a 2 veces su altura.

## Decisiones tomadas por defecto (pendientes de confirmar)

Ninguna está respondida. Si alguna no es la deseada, conviene decirlo **antes** de
generar los 27 estados que faltan: todos salen del `idle` de su jefe.

1. **Aspecto.** Sigue la guía `REF_03`, emparejada con el jefe del motor por el tema
   del círculo (Lujuria, Gula, Avaricia…), no por el número: el motor tiene un círculo
   más (Limbo). Nombre, título y color son los del motor. De la biblia se toman los
   motivos compatibles (horno en el vientre del Bufé, amplificador entre las costillas
   del Pogo, mitra en forma de diapasón del Oficiante, tambor en el pecho del Matarife,
   máscaras del Imitador).
2. **El Cajero.** La guía y la biblia muestran a una mujer; el motor lo llama «EL
   CAJERO». Resuelto con una figura enmascarada de género ambiguo.
3. **El Núcleo.** La guía sólo muestra una esfera negra. Se ha dibujado un humanoide
   de teselas de espejo con esa esfera en el pecho (el cuerpo sale de la biblia, §15).
4. **El Arquitecto.** No tiene lámina. Diseñado a partir del sprite antiguo, con un
   compás de dibujo como cetro.
5. **El Traidor.** Lleva un báculo; la lámina muestra dos.
6. **Muerte del Núcleo.** Hoy no se ve (la pantalla final la tapa). Opciones: retrasar
   esa pantalla 1 s para que se vea el derrumbe, o dejarlo y no producir
   `boss_09_nucleo_death`. Por defecto no se toca el flujo del juego y esa ilustración
   queda la última de la lista.

## Incidencias del arte generado

Detalle por asset, con el texto de cada petición, en
[`batches/R03_JEFES.json`](batches/R03_JEFES.json).

| Jefe | Incidencia | Estado |
|---|---|---|
| Cajero | Salió dos veces caminando (copiaba la zancada de la imagen de estilo) | Rehecho de pie al tercer intento |
| Oficiante | Volvió como hoja de tres vistas | Rehecho a figura única |
| Magneta, Bufé, Pogo, Matarife y los `attack` de Magneta, Bufé y Pogo | Línea fina de suelo bajo los pies | Borrada al procesar (`ground_line`) |
| Magneta, Imitador | Cables e hilos que llegaban al borde superior | Fundidos al procesar (`fade`) |
| Bufé, `attack` | El cristal de la puerta del horno salió en verde croma y se recortó: queda el aro sin cristal | Se ve en juego; repetir si sobra una generación |
| Bufé, `idle` | Aviso automático de «posible damero horneado» | Revisado en juego: no se aprecia |
| Matarife | Vista frontal, no de tres cuartos | Aceptado |

## Plan de los 27 que faltan

Cada estado se genera con el `idle` del propio jefe como referencia, pegado en el
centro de un lienzo croma entre un 30 y un 40 % más ancho (`_refs/ref_<nn>_<nombre>_wide.png`;
hechos para 00, 01, 02 y 04, faltan los demás).

| Turno | Ilustraciones |
|---|---|
| 1 | `attack` de Cajero, Oficiante, Matarife, Imitador, Traidor, Núcleo y Arquitecto (7) + `hit` de Andén, Magneta y Bufé (3) |
| 2 | `hit` de Cajero a Núcleo (7) + `death` de Andén, Magneta y Bufé (3) |
| 3 | `death` de Cajero a Núcleo (7) + hasta 3 repeticiones |

Tras cada turno: `layout.py --write` → `batch.py process` → `batch.py register` →
compilar → `preview_actors.py --bosses` (escala y apoyo) → `probe_bosses.js` → evidencia
→ `batch.py mark`.

## Contrato de los jefes

Texto completo en [`tools/art_master/README.md`](../../tools/art_master/README.md),
apartado «Contrato de los jefes (R03)». Resumen:

| Dato | Valor |
|---|---|
| Ids | `boss_00_anden` … `boss_09_nucleo` × `idle`, `attack`, `hit`, `death`; `boss_10_arquitecto_idle`, `boss_10_arquitecto_attack` |
| Punto de apoyo | ancla `foot` en `(x, y + 0,8 · r)`; `r` = 34 (Arquitecto 38) |
| Alto de la figura | el de la tabla × `(r / 34)^0,75` |
| Orientación | el arte mira a la derecha; se refleja cuando el protagonista está a la izquierda |
| Fotograma de estado | sólo se usa si tiene anclas y la misma revisión que el `idle` |
| Muerte | registro de 1 s; sin fotograma `death`, derrumbe procedural del `idle` |

## Pendiente arrastrado

De R03 (jefes), visto en juego y sin corregir:

- El destello de impacto vela la figura en su pico.
- Los jefes sin `attack` propio apenas cambian de postura al atacar.
- Las balas de los patrones y el botín siguen en pixel art (tandas R07 y R06).
- Con el jefe final muerto, el HUD y el diálogo se ven por encima de la pantalla de
  fin de partida (visto una vez, bajo la sonda; sin comprobar jugando).

De R01 (protagonista):

- Las armas pesadas (m60, minigun, BFG…) mantienen la postura de cadera en todos los
  ángulos: el arma gira sobre los puños, los brazos no acompañan la elevación.
- Vista lateral única: `REF_06` pide 8 direcciones para el protagonista. Hoy el cuerpo
  sólo se refleja a izquierda y derecha, como en el motor original.
- Pose de daño con arma larga apuntando hacia abajo: el arma cruza hombro y cabeza.

De R02 (enemigos):

- Vistos en juego en los círculos I, II, III, V y VIII; faltan IV, VI, VII y IX.
- Un solo fotograma por estado: el cambio de caminar a aviso o a ataque no tiene
  intermedios (se nota sobre todo en el Tanque, que se yergue de golpe).
- Proporciones que el generador cambió entre fotogramas: cabeza del Tanque más pequeña
  en `windup` y `attack`; cabeza y torso del Sprinter un 15 % menores en `death`.
- Balas enemigas todavía en pixel art (van en R07).
