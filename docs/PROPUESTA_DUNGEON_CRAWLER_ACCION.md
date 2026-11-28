# DEADBEAT DISCO · Propuesta de dirección: dungeon crawler de acción

**Estado:** propuesta conceptual para revisión; no autoriza implementación ni cambia el canon. Se apoya en una lectura focalizada del repositorio, no en una auditoría completa de todos los sistemas ni en nuevas pruebas de juego. La fase 4 anterior sigue cerrada administrativamente con sus pendientes y sin aprobación de QA: `docs/FASE_4_GENERACION_QA.md`.

## 1. Dirección

Conservar la acción en tiempo real, la energía rave y el potencial de armas y sinergias; pasar de una sucesión centrada en combates a **expediciones por la torre** donde explorar, descubrir, cumplir un objetivo y volver al Refugio tengan tanto sentido como vencer enemigos. La referencia a los primeros *Pokémon Mundo Misterioso* es su sensación de aventura, lugares y regreso, no una propuesta de copiar personajes, interfaz ni combate por turnos.

La biblia `docs/LORE/BIBLIA_MAESTRA_UNIVERSO_v1.0.txt` presenta al Desafinado, Tempo y una torre musical de pistas y deseos. El propio documento distingue canon, diseño y propuestas; sus nombres temáticos no se dan aquí por aprobados. Las magias descritas abajo son ideas de diseño, no canon ni funciones existentes.

## 2. Qué hay y qué implica

| Área | Hecho observado | Consecuencia para la propuesta |
|---|---|---|
| Espacios | `src/room_generation/` genera grafos de salas con puertas, geometría y población; `playable.js` compila prefabs y el Hangar inicial sigue un camino propio. La integración está en `tools/room_generation_migration.py`. | Hay base reutilizable, pero el grafo y las reglas centradas en tipos/encuentros necesitan rediseño para expediciones. No hay que asumir que ya existe un mundo continuo. |
| Motor | La integración conserva instalación nativa de geometría, colisión y transiciones; las tarimas son visuales, no otra altura transitable (`docs/ROOM_GENERATION_2.md`). | Prototipar con el motor y cámara actuales. Grandes espacios continuos, alturas jugables o streaming requieren investigación antes de prometerlos. |
| Refugio | `docs/REFUGIO/HUB_PERSISTENTE.md` describe estaciones, relaciones, archivo, acceso a incursión y progreso local. | Punto natural para preparar expediciones y entregar descubrimientos. No presupone que ya exista un sistema de misiones. |
| Dado y armas | `tools/build_active_html.py` sustituye el despachador de ataque por el dado; `docs/DICE_COMBAT.md` describe su control actual. La biblia define familias de armas y sinergias, pero diseño documentado no equivale a funcionamiento verificado en la build. | Antes de volver al ataque directo, auditar qué código y datos de armas, mejoras y rave siguen conectados; no prometer que basta con desactivar el dado. |
| Guardado y calidad | Versiones 2.0–2.8 y semillas existentes; 2.0 es el valor por defecto. El acta de fase 4 registra regresión de generación y pruebas pendientes. | Versión nueva y coexistencia/migración explícitas; no reescribir ni borrar guardados, ni tratar la nueva dirección como solución automática del rendimiento. |

## 3. Bucle propuesto

1. **Refugio:** hablar con Tempo o consultar una estación existente, elegir una expedición y preparar equipo.
2. **Entrada:** recibir una pista clara del objetivo y una región reconocible de la torre.
3. **Explorar:** recorrer espacios conectados, decidir entre ruta principal y desvíos, descubrir información y recursos; alternar combate con momentos de calma.
4. **Resolver:** cumplir el objetivo de la expedición y enfrentarse a un encuentro relevante cuando corresponda; no todos los espacios deben bloquearse hasta eliminar enemigos.
5. **Regresar:** entregar lo encontrado, abrir conversaciones o cambios persistentes y preparar la siguiente salida.

Son propuestas: duración, penalización por derrota, extracción, tipo de recompensas y libertad para regresar necesitan decisión y pruebas. Ejemplo ilustrativo, no contenido existente: investigar una señal, atravesar una zona de servicio, recuperar un registro y regresar con información que habilite una conversación en el Refugio.

## 4. Regenerar espacios sin tirar el motor

**Propuesta inicial:** conservar salas conectadas y transiciones nativas, pero generar primero una *intención de expedición* y después los espacios que la hacen jugable:

1. Objetivo y contexto narrativo elegibles de un conjunto diseñado.
2. Ruta principal legible con entrada, desarrollo y objetivo alcanzable; ramas opcionales con funciones identificables.
3. Selección de piezas espaciales compatibles: pasajes, intersecciones, estancias de exploración, arenas y zonas seguras. Cada pieza define entradas, salidas, tránsito y puntos de interés.
4. Población según función y ritmo: encuentros, obstáculos, recompensas e interacciones sin impedir el recorrido.
5. Validación del grafo y de la geometría física, con semilla y versión reproducibles.

Esto puede dar sensación de lugar sin afirmar que haya un mapa único continuo. Algunas piezas existentes podrían adaptarse, pero su idoneidad visual y jugable debe comprobarse; otras podrían necesitar creación nueva. Antes de producir cada prefab: enumerar assets existentes/faltantes y rutas reales, pivotes e integración; respetar tiles de 512, `DD_ASSETS` y el requisito de croma verde `#00ff00` para assets oscuros. No inventar recursos ni introducir un segundo canvas, cámara o loader.

**Identidad espacial:** cada pista debería transmitir su deseo y función con estructura, densidad, encuentros y detalles, además de color. Evitar que cada lugar sea la misma arena con otra textura. La diversidad perceptible requiere revisión visual y pruebas con jugadores, no solo firmas geométricas distintas.

## 5. Combate y fantasía

- **Ataque principal:** proponer un ataque directo sensible al arma equipada; apuntar y disparar/golpear sin exigir lanzar y recuperar el dado. Investigar y probar los sistemas reales antes de decidir restauración o sustitución.
- **Rave:** conservar su dinamismo y su identidad audiovisual. Cualquier efecto nuevo debe respetar su lógica y reloj actuales; verificar cómo interactúa con cada arma y habilidad.
- **Magias:** habilidades activas sobrenaturales con lectura clara, coste o enfriamiento explícito y espacio para combinaciones. Ejemplo propuesto: una marca aplicada por arma que una onda mágica consume para producir un efecto de área; durante rave podría variar su comportamiento. No es una mecánica implementada ni una decisión de balance.
- **Sinergias:** conectar arma, magia y objetos mediante efectos comprensibles, sin que una combinación obligatoria eclipse el combate base. Evitar convertir el azar en un requisito incómodo para cada ataque.
- **Dado:** retirar su obligatoriedad del ataque es una intención; si se conserva como objeto, habilidad opcional o elemento del mundo debe decidirse después de revisar sus dependencias y guardados. No borrar su código ni colección en esta propuesta.

## 6. Plan de trabajo propuesto y puertas de decisión

| Etapa | Entregable | Puerta antes de continuar |
|---|---|---|
| 0 · Inventario | Auditar ataque, armas, sinergias, rave, estados de misión, guardados, assets y limitaciones reales del motor. Recoger una línea base reproducible. | Confirmar qué funciona y qué se conserva; no inferir funcionamiento de la biblia. |
| 1 · Diseño | Definir bucle, derrota/retirada, alcance de espacios, estructura de misiones y controles. | Aprobación explícita del diseño. |
| 2 · Prototipo vertical | Una expedición pequeña: Refugio → ruta con exploración y combate → objetivo → regreso; una opción de ataque directo y una magia experimental. | Aprobar sensación de control, navegación y ritmo antes de extender. |
| 3 · Generación | Crear una versión nueva de planes y piezas con semillas reproducibles; validar rutas, puertas y puntos de interés. | Compatibilidad de guardados, rendimiento y pruebas nativas; coexistencia con generadores anteriores. |
| 4 · Contenido y QA | Ampliar pistas, armas, sinergias, narrativa y variedad de espacios gradualmente. | Campaña natural, persistencia, revisión visual y física y A/B representativo de generación, frames y memoria. |

Cada incremento de implementación necesitará un mecanismo de reversión verificable, cambios acotados y pruebas acordes con su alcance. No se modifica `index.html` ni `DEADBEAT_DISCO.html` a mano: son builds. Mantener PR en borrador y no fusionar sin autorización. Cualquier cambio de objetivo de fase 4 anterior deberá registrarse como decisión explícita, no presentarse como validación ya obtenida.

## 7. Riesgos abiertos

- La ruta/condiciones actuales de victoria y descenso están ligadas a nodos y despejes: una misión nueva podría romper progresión, recompensas o mapa si no se adapta y prueba.
- El guardado registra versiones de generador; regresar a un build anterior puede impedir cargar versiones nuevas. Diseñar compatibilidad antes de modificarlo.
- Más piezas, contenido y comprobaciones pueden agravar la regresión de generación ya medida. Medir desde el primer prototipo, incluidos tiempo de entrada, frames y memoria.
- No se ha verificado aún el estado funcional de todas las armas y sinergias históricas ni cómo conviven con el dado. Tampoco se ha diseñado el control final de las magias.
- Los nombres, encuentros y reglas narrativas nuevos requieren aprobación; mantener la biblia como referencia, distinguiendo lo implementado de lo propuesto.
