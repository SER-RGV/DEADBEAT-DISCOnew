# 10 — Recetas de encuentros por geometría y roles

**Estado:** propuesta de diseño; no cambia IA, Director, estadísticas ni spawns.  
**Fuentes:** R02 enemigos, R03 jefes, B4 matriz de combate y blueprints espaciales 09.  
**Propósito:** conectar el diseño de salas con los roles enemigos y las amenazas de jefe, sin inventar cantidades, cooldowns o capacidades que aún no se han extraído del motor.

## 1. Datos confirmados que condicionan el diseño

### Enemigos comunes — R02

R02 contiene seis familias y 24 assets (4 estados por familia: walk, windup, attack y death). Las alturas de referencia son valores artísticos de mundo, no hitboxes:

| Familia | Alto de referencia | Tipo/mapeo del motor | Función de diseño |
|---|---:|---|---|
| security | 94 | `dancer` en círculo I; guardianes/minijefes por defecto | Presión cercana / guardián |
| dancer | 90 | `dancer` desde círculo II | Perseguidor cercano |
| fanatic | 80 | `sprinter` | Presión rápida |
| chef | 106 | `tank`; minijefe en círculo III | Amenaza pesada |
| drone | 90 | `speaker`; mantiene distancia y dispara | Presión a distancia |
| elite | 100 | Marca élite aplicada a tipos existentes | Variante especial |

**Advertencias:**
- `security` y `dancer` son familias visuales distintas, pero pueden compartir el tipo interno `dancer` según el círculo. No se debe inferir su comportamiento solo por el nombre del asset.
- `elite` no es necesariamente una IA nueva: R02 la define como marca aplicada a tipos existentes.
- Los cuatro estados visuales no prueban que el motor use la misma duración para cada uno. La duración del windup y la ventana de daño siguen pendientes de extracción.

### Jefes — R03 y B4

- R03 contiene 11 reposos y cuatro ataques integrados: 15/42 ilustraciones. Faltan siete ataques, diez estados hit y diez death.
- Los estados sin ilustración R03 resuelven sobre el idle nuevo con señal procedimental; los PNG pixel art antiguos no se dibujan.
- B4 documenta diez encuentros y siete canales de amenaza: fan, ring, spiral, burst, summon, sweep y zonas fire/elec.
- En B4, aviso configurado: fan 0,80 s; burst 0,82 s; sweep 0,90 s; ring 1,05 s; spiral 1,10 s; summon 1,20 s. Son datos de patrones de jefe documentados en B4, no duraciones de enemigos comunes.
- B4 separa selección, intento de emisión, proyectil aceptado e impacto. No confundir contadores de intentos con daño aplicado.

## 2. Principios de composición

1. **Una pregunta táctica principal por encuentro.** La amenaza secundaria complica esa pregunta, no la sustituye.
2. **Presentar antes de combinar.** Un rol nuevo se introduce primero sin otra presión que impida leerlo.
3. **Una salida jugable siempre.** No bloquear todas las puertas ni todas las rutas de esquiva a la vez.
4. **El espacio tiene que justificar la composición.** No poner tiradores en una sala donde no exista línea de tiro ni sprinters en un cuello de botella sin espacio de reacción.
5. **La composición se selecciona por rol y etapa, no por ID de sala.**
6. **No sumar presión invisible.** Los spawns deben quedar dentro del campo legible o tener señal de entrada.
7. **No añadir inteligencia al Director.** Estas recetas son fixtures de diseño/QA que se asignan al sistema de encuentros actual.
8. **No fijar presupuestos numéricos aún.** Primero extraer HP, daño, velocidad, cadencias, caps, reglas de spawn y simultaneidad reales.

## 3. Recetas para salas comunes

Las recetas son patrones de composición, no órdenes para crear un nuevo scheduler. El número de enemigos, sus estadísticas y tiempos deben salir del runtime actual.

### E-01 — Presentación de perseguidor

- **Sala:** abierta, conector sencillo o entrada de combate.
- **Pregunta:** mantener distancia y orientar el movimiento.
- **Familia:** dancer o security según etapa y mapeo real del motor.
- **Secundarios:** ninguno durante la primera lectura.
- **No añadir:** drone ni zonas de daño simultáneas.
- **Criterio:** el jugador reconoce la aproximación, puede rodear y entiende el rango de contacto.

### E-02 — Prueba de reacción

- **Sala:** abierta, con rutas laterales.
- **Pregunta:** leer la señal de un sprinter y esquivar sin quedar encerrado.
- **Familia:** fanatic.
- **Secundarios:** perseguidor solo después de que el sprinter sea reconocible por separado.
- **No añadir:** obstáculos sólidos que corten el desplazamiento lateral.
- **Criterio:** la animación windup es visible y la evasión tiene margen real.

### E-03 — Control de línea de tiro

- **Sala:** cobertura ligera o espacio con rutas alternativas.
- **Pregunta:** romper línea de tiro o priorizar al tirador.
- **Familia:** drone.
- **Secundarios:** perseguidor en una segunda capa, no en el mismo instante de presentación.
- **No añadir:** cubrir al tirador con obstáculos que impidan responder.
- **Criterio:** existe una ruta para acercarse o interrumpir la presión a distancia.

### E-04 — Gestión de amenaza pesada

- **Sala:** abierta o arena compacta con perímetro transitable.
- **Pregunta:** controlar una amenaza resistente y leer su aviso.
- **Familia:** chef.
- **Secundarios:** solo después de medir el tiempo de resolución real del tanque.
- **No añadir:** pasillo estrecho, acumulación de props sólidos o spawns a la espalda sin aviso.
- **Criterio:** se puede esquivar y reposicionar; el tamaño visual no falsea la colisión.

### E-05 — Cambio de prioridad

- **Sala:** cruce o combate abierto.
- **Pregunta:** decidir entre amenaza cercana y presión a distancia.
- **Familias:** drone + dancer/security.
- **Condición:** usar solo después de presentar ambas familias por separado.
- **No añadir:** fanatic al mismo tiempo hasta medir la carga real.
- **Criterio:** el jugador puede identificar qué amenaza está forzando su posición y cambiar el foco.

### E-06 — Interrupción de movimiento

- **Sala:** abierta con obstáculos periféricos, nunca bloqueando la zona central.
- **Pregunta:** mantener movilidad bajo una amenaza rápida y otra de contacto.
- **Familias:** fanatic + dancer/security.
- **Condición:** el área útil debe admitir rutas de esquiva continuas.
- **No añadir:** drone en la misma primera versión.
- **Criterio:** el jugador dispone de más de una dirección de salida y no recibe daño inevitable por convergencia.

### E-07 — Prueba de resistencia

- **Sala:** abierta, con centro libre.
- **Pregunta:** administrar foco y munición contra una amenaza pesada.
- **Familia:** chef, eventualmente con una familia ya dominada.
- **Condición:** la amenaza secundaria no debe impedir leer el ataque del chef.
- **No añadir:** combinación con élite hasta medir la carga de ambas.
- **Criterio:** el combate exige decisión de foco, no simplemente aumentar HP total.

### E-08 — Variante élite

- **Sala:** arena o cruce amplio.
- **Pregunta:** reconocer un rasgo especial aplicado a una familia conocida.
- **Familia:** `elite` como marca sobre un tipo existente.
- **Condición:** documentar qué tipo base recibe la marca y qué estadísticas/estados cambian.
- **No asumir:** que la mascota tiene un patrón de IA independiente.
- **Criterio:** la señal visual de élite permite reconocer la prioridad sin confundir el tipo base.

## 4. Recetas por topología

| Geometría | Recetas recomendadas | Evitar |
|---|---|---|
| Umbral / start | E-01 en fase posterior, nunca durante orientación inicial | Emboscada inmediata, tres amenazas nuevas |
| Conector de grado 2 | E-01, E-02 o E-03 | Oleada que tape la salida |
| Cruce de grado 3+ | E-05 o E-06 después de introducir familias | Enemigos en cada puerta que bloqueen todas las salidas |
| Extremo de rama | E-02, E-04 o recompensa | Refuerzos que cierren el retorno |
| Servicio / tienda | Sin combate por defecto | Enemigos/spawns durante interacción sin regla explícita |
| Arena de jefe | Perfiles B4 por jefe | Añadir mobs comunes por rutina sin medir carga |

La geometría determina el espacio disponible; el rol del nodo determina la función de progresión; la receta determina la pregunta táctica. Son tres decisiones distintas.

## 5. Perfiles B4: uso de espacio y legibilidad

Los patrones B4 tienen necesidades geométricas diferentes:

| Patrón | Datos B4 | Necesidad espacial a comprobar |
|---|---|---|
| fan | 5 proyectiles, speed 245, spread total 0,64 rad | Leer el abanico y conservar una ruta de evasión |
| ring | hasta 18, speed 185, hueco 1,1 rad | Leer el hueco y validar el corredor seguro |
| spiral | hasta 20, speed 180, paso 0,23 rad, dos tiros cada 0,115 s | Espacio suficiente para seguir el hueco móvil |
| burst | 9 declarados, speed 265, tres enlaces por paso ±0,115 rad cada 0,18 s | Aviso y orientación de mira capturada |
| summon | dos solicitudes de spawn | Puntos de aparición válidos y no bloqueantes |
| sweep | arco 2,4 rad en 1,4 s, longitud de prueba 720 px, un hit | Espacio de escape lateral y lectura del barrido |
| fire/elec | zonas con scheduler separado | No superponer señales de área hasta verificar legibilidad |

Estos datos son parámetros de configuración/contrato documentados. No son medidas de daño ni prueban que cada proyectil sea aceptado o impacte.

## 6. Aplicación por perfil de jefe

| Jefe | Perfil B4 | Orden observado/configurado | Condición de arena |
|---|---|---|---|
| Andén | hunter | fan → burst → ring | Área abierta con espacio para abanicos y hueco radial |
| Magneta | hunter | burst → fan → ring | Añade 4 adds y blindaje con adds; comprobar que no bloqueen lectura |
| Bufé | pulse | ring → spiral → burst | Zonas fire; mantener rutas legibles durante retirada |
| Cajero | hunter | ring → fan → spiral | Añade 3 adds y recompensa de 22 créditos por baja de add; validar economía/telemetría |
| Pogo | sweeper | burst → fan → spiral | Sweep y 5 adds; perímetro lateral transitable |
| Oficiante | pulse | summon → ring → spiral | Zonas elec y 2 adds; distinguir invocación de amenaza activa |
| Matarife | sweeper | spiral → burst → fan | Fire y mayor carga base; evitar obstáculos centrales |
| Imitador | hunter | fan → ring → burst | Órbita y huecos de proyectil legibles |
| Traidor | sweeper | ring → burst → spiral | Elec y sweep; evitar superposición ilegible |
| Núcleo Final | final/sweeper | fan → ring → burst → spiral; summon condicional | Arena amplia; fases y zonas deben comunicarse por separado |

B4 se ejecutó con fixtures controlados de 16 s, god mode y trayectorias teleport-inyectadas. No equivale a una prueba humana completa ni certifica fairness. Núcleo solo observó etapa 1 en esa matriz; las etapas 2/3 no se consideran validadas por B4.

## 7. Dependencia de arte y HUD

- R02 dispone de walk, windup, attack y death para las seis familias.
- El HUD debe distinguir la amenaza activa, el área peligrosa y el objetivo prioritario sin cubrir el espacio de evasión.
- El indicador de zona fire/elec no debe depender solo del color.
- R03 tiene 15/42 estados integrados: los estados faltantes usan señal procedimental sobre idle nuevo. No se debe dar por terminada la animación visual de todos los jefes.
- Para cada patrón de jefe se necesita evidencia temporal: inicio de aviso, inicio de daño, fin de daño, proyectiles aceptados e impactos.

## 8. Datos que faltan antes de cuantificar

No se fijan cantidades de enemigos ni tiempos de ola porque aún falta extraer:
1. Estadísticas reales por tipo común.
2. Tiempo de windup y ventana de hit de cada ataque común.
3. Caps de enemigos y reglas de spawn.
4. Distancia mínima al jugador y a las puertas.
5. Frecuencia/orden real del scheduler de oleadas.
6. Multiplicadores de élite.
7. Estadísticas y cadencia reales de las armas del jugador.
8. Duración y densidad de patrones de jefe en ejecución natural.
9. Hitboxes, hurtboxes y radios efectivos tras FASE 08.

## 9. Plan de validación por receta

Para cada E-01…E-08:
- Fijar semilla, sala y equipo inicial.
- Guardar la composición y los parámetros reales usados.
- Registrar posición, vida y distancia de cada actor.
- Registrar señales, inicio/fin de windup, hitbox activa e impactos.
- Registrar proyectiles creados, aceptados, bloqueados y caducados.
- Repetir al menos con teclado y mando emulado.
- Capturar a 1280×720, 1600×900 y 1920×1080.
- Hacer una revisión humana de legibilidad antes de aceptar.

Para cada jefe:
- Ejecutar un combate completo sin teleport-inyección.
- Repetir con la cámara dinámica en zoom mínimo y máximo.
- Validar todas las rutas de evasión y cada fase.
- No declarar superado un patrón por el mero hecho de aparecer en un log.

## 10. Decisión

La primera tanda de encuentros debe usar E-01, E-02 y E-03 como presentación aislada de roles. Solo después se habilitan E-05/E-06 y variantes élite. E-04/E-07 sirven para validar la escala y el espacio necesario para la amenaza pesada.

No se cambia el Director ni se añade IA. Se documenta y prueba la composición usando las capacidades ya existentes.
