# Room Generation 2.0 · integración

## Qué se sustituyó y dónde

La fuente histórica del juego es un HTML protegido. El constructor produce `index.html` y `DEADBEAT_DISCO.html`; no se ha borrado ni editado el backup. La inspección identificó tres autoridades antiguas: `ug` expandía un árbol de nodos, `ng` elegía el polígono y `Ac.build` componía coberturas. La fachada `DMO_FLOOR` podía construir además un árbol de reserva. No había un archivo independiente que se pudiera eliminar sin llevarse el motor consigo.

En los **dos ejecutables generados** se han retirado los cuerpos de generación de `ug`/`ng`, la envolvente y bibliotecas de polígonos anteriores, el reparto/remix de obstáculos, los posprocesos `qs`/`Pg`, el mutador `applyLayout` y el árbol de reserva `internalNodes`. Se mantienen los nombres mínimos que llama el motor: `ug` obtiene la planta de RG2 y la cachea; `ng` entrega su geometría al constructor de colisiones. La bolsa gráfica se conserva para asociar el catálogo de arte y las variantes existentes, no para decidir dónde están las salas o cómo se conectan.

| Dependencia | Contrato conservado |
|---|---|
| Movimiento, cámara y dados | `Os` instala límites y aristas en `Ps`/`Rs`; se conserva la física y la proyección original a pantalla. |
| Puertas y transiciones | `cg` proyecta cada lado sobre una pared; `xg`, `vg`, `kg` y la secuencia de descenso operan con claves estables. La cámara del residente tiene una pared libre para el ascensor. |
| Población y colisiones | RG2 propone posiciones. `mc`/`gc`, la prueba de accesibilidad de `Ac`, el detector de huecos y las restricciones de distancia del director deciden si pueden usarse. Sin sitio seguro se aplaza la aparición, no se fuerza una posición. |
| Enemigos y jefes | Siguen vigentes el director, IA, minijefe del índice local 5, residente del 10 y Núcleo de la sala 100. Las oleadas de desafío se escalan según profundidad del grafo y planta, no por aumento de vida. |
| Recompensas y eventos | Las salas usan el cofre, el cobro único, los pactos y la tienda nativos. El reparto de terrenos no consume números de la simulación de combate. |
| HUD, atlas y guardado | Se conservan claves de sala, historial de visita, máscara de puertas, carga del formato v1 y guardado del Refugio. El registro de planta añade versión del generador y conserva la semilla, incluido el cero. Audio y controles no se reemplazan. |

## Plantas y contenido

Cada círculo ordinario conserva once índices de encuentro más una tienda. La entrada abre dos caminos alrededor de un circuito; las ramas crecen sobre su perímetro. El residente se conecta a una de las salas obligatorias expuestas de mayor distancia desde la entrada. La tienda y las dos salas ocultas son hojas: ni el residente ni el ascensor exigen visitarlas. El Núcleo permanece como planta final de una sola cámara.

| Sector | Función y finalización |
|---|---|
| Inicio / combate | Vestíbulo y pista; despejar la oleada. |
| Élite / jefe | Arena amplia para minijefe o residente; finalización nativa del encuentro. |
| Desafío | Sala estrecha o alargada, mayor presupuesto de oleada; despejar. |
| Evento | Oferta del DJ al entrar por primera vez; el jugador decide y juega el encuentro. |
| Tesoro | Almacén sin oleada, cofre opcional; basta visitarlo. |
| Tienda | Compra opcional en la cabina, sin bloqueo de puertas. |
| Secreta / supersecreta | Hojas fuera de la ruta obligatoria. El plano no muestra el nodo antes de visitarlo; el acceso físico se identifica como paso de servicio. Hay encuentro y cofre; la reserva usa un nivel superior de botín. No hay pared destructible falsa. |
| Descanso / especial | En el puesto de descanso se genera un salón seguro o, con probabilidad 1/3, un palco VIP seguro con recompensa. |

La geometría se compone de cinco plantillas de dimensiones (cuadrada, pista ancha, nave vertical, servicio estrecho y arena), cuatro familias de material existentes y esquinas recortables independientemente. Los perímetros son convexos; se reservan el centro y los corredores a las paredes para que las puertas no requieran atravesar una cobertura. No se ha añadido una segunda altura transitable: el motor de colisión es plano. La decoración utiliza las definiciones finales de escenario y objetos; no se introdujeron imágenes nuevas.

## Archivos

- **Creados:** `src/room_generation/{seed,rooms,population,floor,validate,debug}.js`; `tools/room_generation_migration.py`; `tools/qa/room_generation{,_live}.cjs`; este informe.
- **Modificados:** `tools/build_active_html.py`, `.github/workflows/rebuild-active-html.yml` y los dos HTML jugables.
- **Archivos eliminados:** ninguno. La retirada es de código incrustado en los artefactos activos, no de recursos ni copias históricas.

## Semillas y DEBUG

Una nueva incursión acuña una semilla uint32. Los canales de trazado, variante de palco, contorno, mobiliario y posiciones de aparición se derivan por separado. La firma de reproducción es **versión 2.0.0 + semilla + planta (0–9)**. Reproducir una planta no equivale a grabar una partida: decisiones del jugador, IA temporal y resultados de combate no forman parte de esa firma.

1. Construir: `python tools/build_active_html.py`. Servir el repositorio por HTTP.
2. Abrir `index.html?roomDebug&roomSeed=4294967295`, iniciar una incursión y abrir la consola.
3. `DD_ROOM_DEBUG.show()` dibuja la planta completa con conexiones, tipos, propuestas de mobiliario y posiciones de aparición. `show(123, 4)` dibuja la quinta planta de otra semilla **sin mover al jugador**.
4. `DD_ROOM_DEBUG.map()` lista lados y destinos; `inspect()` devuelve puerta física, obstáculos activos, puntos de aparición y reglas de la sala; `current()` copia el plan activo. `generate(123, 4)` reconstruye los datos para comparación. Sin `roomDebug` no se instala este inspector ni se habilita el visor.

## Resultados ejecutados

| Prueba | Resultado |
|---|---|
| `node tools/qa/room_generation.cjs` | **1.030 mapas, 11.227 salas.** 103 semillas × 10 plantas, generadas por duplicado. 103 distribuciones distintas en la primera planta, 12 tipos. Se comprobó conectividad con/sin hojas opcionales, acceso al jefe, enlaces recíprocos en lados correctos, ciclos, margen físico para población, claves únicas, rechazo de enlaces dañados y de plantas fuera de rango. Incluye 0, 2³¹−1, 2³¹ y 2³²−1. |
| Barrido adicional del validador puro | **25.000 plantas ordinarias** (`seed=Math.imul(i,2654435761)`, `floor=i%9`); ninguna excepción. No son simulaciones del motor. |
| `room_generation_live.cjs` en Chromium | Semillas 0 y 4294967295: semilla guardada exacta, plano activo igual a la regeneración, aparición natural de enemigos, cobertura presente, colisiones y posiciones válidas en el vestíbulo. Comprobado visor en DEBUG y ausente en modo normal. |
| `test_cartography_tour.cjs`, semilla 4294967295 | **198 cruces** (22, 23, 23, 20, 22, 25, 23, 18, 22), nueve residentes y llegada al Núcleo. Se usan puertas del motor, sin desbloqueo global ni salto de planta. La prueba despeja encuentros mediante QA: no representa nueve victorias manuales. |
| `dice_engine.cjs` / `refuge_restart.cjs` | Seis dados regresan a READY sin balas convencionales, jefe pierde salud en simulación nativa; un perfil real conserva progresión del Refugio entre dos lanzamientos de Chromium. |

Dos fallos detectados durante la integración se corrigieron antes del resultado anterior: el sistema ambiental añadía metadatos al objeto de geometría cacheado y el mobiliario escénico podía ocupar un punto de aparición. La prueba en navegador cubre ambos.

**Límites de validación:** no se jugaron las 1.030 plantas en navegador, no se certificó equilibrio de campaña ni se completó una planta entera sin asistencia QA. Los candidatos de población se comprueban al generar y se vuelven a comprobar contra entidades y huecos al aparecer. Los sistemas dinámicos conservan su azar de combate. No se probaron dispositivos físicos.
