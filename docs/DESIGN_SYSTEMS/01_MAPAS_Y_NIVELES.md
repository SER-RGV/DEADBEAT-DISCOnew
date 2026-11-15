# 01 — Diseño de mapas y niveles

## 1. Objetivo

Dar más amplitud y variedad táctica al mundo de DEADBEAT DISCO sin convertirlo en un conjunto de habitaciones vacías ni alterar su estructura híbrida.

El mapa debe producir decisiones espaciales: dónde entrar, qué zona controlar, cuándo cruzar, qué obstáculo aprovechar y cómo preparar un encuentro.

La ampliación de escala de la FASE 08 se considera una dependencia externa. Este documento define la composición y el uso del espacio, no cambia todavía las dimensiones del motor.

## 2. Base existente verificada

- El inventario técnico identifica `DMO_FLOOR`, `DMO_FLOOR_ANIM`, `DMO_LAYOUT` y `DMO_DUNGEON` como sistemas existentes.
- La auditoría de la mazmorra registra 12 nodos y, después de iniciar campaña, `DMO_DUNGEON.audit()` devuelve `ok:true`; el inicio de campaña registra `r0` como primera sala y `bossDistance:5`.
- El generador de salas contempla formas como octógonos, salas en L, catedrales, anillos y corredores.
- El proyecto mantiene un HUB/refugio con estaciones y zonas; su geometría no debe confundirse con la geometría de las salas de campaña.
- La estructura narrativa es híbrida. Los índices y nombres cromáticos que aparecen en código son identificadores de entorno y compatibilidad, no autorización para recuperar una cosmología de nueve círculos.

**No se ha reconstruido aquí el grafo completo de todas las rutas ni se han medido todas las dimensiones de campaña.** Deben extraerse del runtime y de los datos reales antes de fijar un mapa maestro definitivo.

## 3. Gramática espacial

Cada habitación debe tener una función primaria y, como máximo, una secundaria clara.

| Tipo de sala | Función primaria | Requisito espacial |
|---|---|---|
| Entrada segura | Orientar y preparar | Lectura inmediata de salidas y puntos de interés |
| Combate abierto | Movimiento y control de hordas | Espacio central libre y rutas periféricas |
| Combate con cobertura | Posicionamiento | Coberturas legibles, sin bloquear proyectiles injustamente |
| Corredor | Presión direccional | Anchura suficiente para esquivar y girar |
| Sala de flanqueo | Decisión de ruta | Dos recorridos con riesgos distintos |
| Sala de evento | Interacción o condición especial | Objetivo visible y área de combate delimitada |
| Sala de élite/minijefe | Prueba de dominio | Espacio para telegráficos y adds |
| Arena de jefe | Lectura de patrones | Perímetro claro, rutas de escape y centro de combate |
| Transición | Cambio de ritmo | No introducir combate durante locks de transición |
| Refugio | Gestión y descanso | Estaciones reconocibles y circulación sin obstáculos |

## 4. Estructura de una incursión

Propuesta de ritmo, compatible con el grafo existente:

1. **Preparación:** el jugador identifica objetivo, salidas y amenazas.
2. **Primer contacto:** encuentro de baja complejidad que presenta una familia o mecánica.
3. **Escalada:** se combinan roles ya conocidos, no se introducen todas las amenazas a la vez.
4. **Decisión espacial:** bifurcación, evento, riesgo/recompensa o cambio de geometría.
5. **Prueba de dominio:** élite, minijefe o encuentro de presión alta.
6. **Respiración:** transición o sala de recursos con menor carga.
7. **Encuentro mayor:** jefe o evento equivalente cuando la progresión real lo habilite.
8. **Resolución:** recompensa, desbloqueo y retorno al flujo de progresión.

Esto es una plantilla de ritmo, no un nuevo número obligatorio de habitaciones. Debe mapearse sobre el grafo real de 12 nodos y sus reglas.

## 5. Rutas y decisiones

Cada bifurcación debe ofrecer una diferencia comprensible, por ejemplo:

- Ruta corta: más presión o menos recursos.
- Ruta larga: más exposición, pero oportunidad de recompensa.
- Ruta técnica: geometría difícil, ventaja de posicionamiento.
- Ruta de evento: condición especial y recompensa explícita.

No crear bifurcaciones cosméticas que vuelvan al mismo punto sin impacto, salvo que su función sea deliberadamente narrativa.

La recompensa y el riesgo deben mostrarse antes de elegir; no usar daño inevitable como sorpresa.

## 6. Verticalidad mínima útil

La perspectiva es isométrica/2.5D. No se debe introducir una falsa verticalidad basada únicamente en decoración.

La verticalidad debe aportar al menos una de estas funciones:

- Oclusión y lectura de profundidad.
- Plataformas o desniveles que cambien rutas.
- Puentes, balcones o pasarelas con acceso real.
- Elementos superiores que alteren cobertura o línea de visión.
- Caídas/transiciones controladas, si ya están soportadas por el motor.

No añadir salto, gravedad, navegación multinivel ni nuevas físicas sin una fase técnica específica. Primero validar desniveles visuales y rutas en el sistema existente.

## 7. Escala y composición para FASE 08

La escala aprobada por el usuario es **intermedia**, con **cámara dinámica**.

Directrices:
- Ampliar solo las salas cuya función lo necesite.
- Aumentar el área útil, no solo el rectángulo decorativo.
- Mantener distancias de combate proporcionadas a velocidades y proyectiles reales.
- Dejar margen de encuadre para telegráficos y ataques de jefe.
- Mantener rutas de salida visibles desde la mayor parte de la arena.
- Evitar muebles, pilares y decoración que formen cuellos de botella involuntarios.
- No fijar multiplicadores absolutos hasta revisar el prototipo de Arena.

## 8. Plantilla de ficha por sala

Cada sala nueva o rediseñada debe documentar:

- ID estable y función.
- Bioma/tema visual (clave de paleta, no lore).
- Dimensiones mundo y área transitable.
- Entradas/salidas y conexión en el grafo.
- Obstáculos sólidos y decorativos.
- Zonas de spawn y límites de seguridad.
- Capacidad prevista de enemigos.
- Coberturas y líneas de tiro.
- Ruta primaria y alternativa.
- Encuentro asociado.
- Recompensa/condición.
- Cámara: encuadre mínimo y máximo esperado.
- Riesgos de oclusión y accesibilidad.
- Capturas y pruebas de navegación.

## 9. Criterios de aceptación

- Cada sala tiene una función distinguible.
- No hay spawn dentro de colisiones ni sobre el jugador.
- Todas las salidas son localizables y transitables.
- El espacio admite las hitboxes reales y los patrones de los enemigos.
- El jugador puede identificar rutas de escape.
- Las arenas de jefe no dependen de zoom extremo.
- Las salas mantienen identidad visual sin competir con personajes y proyectiles.
- La topología del grafo no se rompe al redimensionar.
- Se conserva el comportamiento del HUB y las transiciones.

## 10. Pendientes antes de producción

1. Exportar el grafo de campaña completo con IDs y conexiones.
2. Medir anchura/altura y área transitable por sala.
3. Identificar todas las salas con bloqueo, cuello de botella o espacio muerto.
4. Asociar cada encuentro a su sala real.
5. Comparar las medidas antes/después de FASE 08.
6. Probar rutas con mando físico cuando esté disponible.
