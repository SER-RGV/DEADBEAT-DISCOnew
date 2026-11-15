# 02 — Enemigos y encuentros

## 1. Objetivo

Hacer que cada enemigo aporte una decisión táctica distinta y que cada encuentro combine amenazas de forma legible.

No se propone añadir más inteligencia al Director ni sustituir la IA existente. El trabajo es de diseño de roles, composición, telegráficos, ritmo y validación.

## 2. Familias visuales verificadas

`docs/ART_REBUILD/batches/R02_ENEMIGOS.json` define seis familias con cuatro estados visuales (caminar/reposo, aviso, ataque y muerte), 24 ilustraciones entregadas.

| Familia de recurso | Identidad visual | Tipo interno indicado por R02 | Alto mundo registrado |
|---|---|---|---:|
| `security` | Seguridad antidisturbios | `dancer` en círculo I; guardianes/minijefes por defecto | 94 |
| `dancer` | Bailarina no-muerta | `dancer` desde círculo II | 90 |
| `fanatic` | Sprinter/corredor | `sprinter` | 80 |
| `chef` | Tanque/bruto | `tank`; minijefe en círculo III | 106 |
| `drone` | Tirador/pistolero | `speaker`, mantiene distancia y dispara | 90 |
| `elite` | Mascota del club | Marca élite aplicada a tipos existentes | 100 |

Los valores son los `world_h` del manifiesto artístico; no equivalen a hitboxes ni a tamaños finales de render.

La misma ficha R02 aclara que los nombres internos conservan compatibilidad con el motor y que la identidad visual no siempre coincide con el nombre del tipo de IA. No renombrar IDs por estética.

## 3. Roles de combate

Propuesta de lectura funcional, a validar contra el comportamiento real:

| Rol | Pregunta que plantea | Contrajuego esperado |
|---|---|---|
| Perseguidor | ¿Puedes mantener distancia? | Movimiento, control de espacio y foco |
| Sprinter | ¿Reaccionas al aviso rápido? | Esquiva lateral y priorización |
| Tanque | ¿Puedes gestionar una amenaza resistente? | Foco sostenido, distancia y control |
| Tirador | ¿Puedes romper línea de tiro? | Cobertura, presión y flanqueo |
| Guardián | ¿Puedes atravesar una zona protegida? | Separar, rodear o eliminar apoyo |
| Élite | ¿Puedes responder a una variante con más presión? | Identificar rasgo especial y priorizar |

No asignar automáticamente habilidades nuevas a cada rol. Primero documentar las diferencias que el motor ya implementa.

## 4. Contrato de legibilidad

Todo ataque dañino debe tener:
- Señal visual previa coherente con el tiempo de reacción.
- Dirección, área o trayectoria legible.
- Ventana de ejecución identificable.
- Resultado visual claro.
- Oportunidad de respuesta que dependa de habilidad, no de adivinación.

Los fotogramas `windup` de R02 deben conservar el mismo anclaje de pies que `walk`; la muerte mantiene el pie plantado. El motor apoya las entidades mediante pivotes/anclajes. No cambiar esos contratos para mejorar una pose.

## 5. Encuentros: composición antes que cantidad

Diseñar encuentros por capas:

1. Amenaza primaria: enseña qué exige el encuentro.
2. Amenaza secundaria: obliga a cambiar de posición o prioridad.
3. Presión de apoyo: añade complejidad solo cuando el jugador ya entiende la primaria.
4. Ventana de resolución: permite eliminar una amenaza y recuperar control.

Evitar:
- Combinar varios ataques de área sin espacio de escape.
- Apilar tiradores detrás de obstáculos que no permiten contraataque.
- Añadir tanques y sprinters en pasillos que anulan la movilidad.
- Spawns a distancia de contacto o fuera de cámara sin aviso.
- Añadir enemigos solo para aumentar HP total.
- Repetir la misma composición en habitaciones consecutivas.

## 6. Jefes existentes y patrones documentados

R03 registra once jefes visuales (10 residentes más Arquitecto). A fecha del checkpoint del 12 de noviembre, R03 tenía 15 de 42 ilustraciones integradas y vistas en juego; faltaban 27 estados de ataque, vulnerable y muerte. El arte de los estados no debe confundirse con la implementación de patrones.

La matriz B4 documenta diez encuentros y estos patrones:
- `fan`
- `ring`
- `spiral`
- `burst`
- `summon`
- `sweep`
- Zonas `fire` / `elec`

La matriz distingue expresamente patrón disponible, seleccionado, intento de emisión, proyectil aceptado e impacto. Un contador de solicitudes no demuestra que todos los proyectiles se hayan emitido ni que hayan impactado.

Perfiles B4:
- Andén: hunter; fan → burst → ring.
- Magneta: hunter; burst → fan → ring.
- Bufé: pulse; ring → spiral → burst.
- Cajero: hunter; ring → fan → spiral.
- Pogo: sweeper; burst → fan → spiral.
- Oficiante: pulse; summon → ring → spiral.
- Matarife: sweeper; spiral → burst → fan.
- Imitador: hunter; fan → ring → burst.
- Traidor: sweeper; ring → burst → spiral.
- Núcleo Final: final/sweeper; fan → ring → burst → spiral; summon condicional.

Esta es la configuración documentada en B4, no una garantía de que cada ciclo natural completo se haya jugado. El informe indica que la muestra usó escenarios controlados, teleport-inyección del jugador y god mode; no certifica una partida humana completa.

## 7. Método de diseño de encuentros

Para cada sala registrar:

- ID de sala y etapa de progresión.
- Jugador: vida, movilidad y arsenal esperado (extraído de datos reales).
- Familias permitidas.
- Número y simultaneidad de enemigos.
- Rol primario y secundario.
- Spawn inicial y refuerzos.
- Separación mínima y máxima.
- Tiempo de aviso de cada patrón.
- Proyectiles esperados y zonas de daño.
- Cobertura y rutas de salida.
- Duración objetivo como hipótesis, luego medida.
- Recompensa y recuperación posterior.
- Evidencia de al menos una ejecución completa.

Usar un presupuesto de amenaza normalizado para comparar encuentros, pero no fijar puntos o límites hasta extraer HP, daño, velocidad, cadencia, número de adds y scheduler actuales.

## 8. Progresión y variedad

La progresión debe enseñar antes de combinar:
- Presentar un rol en un contexto favorable.
- Repetirlo con una geometría distinta.
- Combinarlo con un rol que lo complemente.
- Introducir una variante o élite.
- Exigir dominio en el encuentro de jefe.

La dificultad no debe subir solo aumentando vida o número de enemigos. Debe crecer mediante decisiones espaciales, prioridad de objetivos y coordinación de patrones.

## 9. Criterios de aceptación

- Cada familia tiene un rol que el jugador puede reconocer.
- Cada patrón tiene señal y contrajuego.
- Ningún encuentro depende de daño inevitable.
- El spawn respeta límites y distancia al jugador.
- Las zonas de fuego/electricidad se comunican claramente.
- Los jefes mantienen identidad y patrones diferenciados.
- Los contadores de QA distinguen intentos, emisiones, aceptaciones e impactos.
- Los encuentros se prueban completos, no solo forzando estados.
- Las capturas permiten evaluar legibilidad a escala real.

## 10. Pendientes de extracción

1. Tabla completa de tipos de enemigo del motor y sus estadísticas.
2. Reglas exactas de spawn y caps globales.
3. Perfiles de élite y modificadores reales.
4. Matriz de dificultad por etapa.
5. Ejecuciones naturales de jefes de principio a fin.
6. Medición de tiempo de reacción y espacio de evasión en la nueva escala.
