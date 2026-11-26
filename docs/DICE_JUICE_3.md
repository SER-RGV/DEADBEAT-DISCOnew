# Dados · Juice & Impact 3.0

[Secuencia capturada en el juego](../ART_EVIDENCE/DICE_JUICE/lanzamiento.jpg) · [Reglas y presupuesto de Combat Feel 2.0](COMBAT_FEEL_2.md)

## Preflight y contrato

Se inspeccionó el camino activo, no sólo el informe anterior: el adaptador inyectado por `build_active_html.py` entrega puntero/gatillo y apuntado a `ddDiceTick`; `DD_DICE.update` acumula la carga, libera, integra altura/velocidad y consulta `geo.top` para la cara. El contacto cinético **puede ocurrir antes** de resolver la cara: no se cambió ese orden. `dd_dice_rules` resuelve área, fragmentos y runas; el adaptador nativo aplica `lu.applyEnemy`/`applyBoss`. El observador recibe pérdida de salud posterior a mitigaciones. La reacción secundaria vuelve a ese mismo adaptador sin volver a tirar. `dd_dice_motion`, el renderer de actores y `dd_dice_feedback` son presentación; `di`, `Xl.music` y el acorde de `gi()` siguen siendo el único sistema de sonido. No se han añadido texturas, muestras, dependencias ni controles.

## Implementado

- **Carga:** el dado crece sólo en el dibujo y en proporción a masa y carga. Una base de esmalte gana luminosidad; dos marcas y un tono intermedio indican que se ha cruzado el umbral real del 75 %. La señal existente de carga completa sigue siendo distinta. Mantener pulsado no repite los tonos.
- **Salida:** la estela comienza en RELEASE, en el punto interpolado de la mano, no un frame después ni desde el suelo. Su orientación deriva de la velocidad; el hilo exterior adopta el color de la afinidad retenida. El retroceso y el gesto de recogida reutilizan la coreografía existente. No se mueve el origen físico para casar la animación.
- **Choques:** una reflexión real contra mobiliario o límite produce un golpe corto si la velocidad normal de entrada supera 90; hay una guarda de 110 ms contra repeticiones durante los subpasos. Se mantiene la elipse del rebote contra el suelo. Ningún efecto añade rebote, desplazamiento ni daño.
- **Impactos:** sólo se marca daño positivo. La etiqueta usa pérdida efectiva de salud limitada por la vida restante y muestra una décima (o `<0.1`); máximo una nueva etiqueta cada 110 ms, 400 ms de lectura, dentro del pool existente de 12 marcas. Impacto normal: marca corta y reacción de pose. Potente: daño alto, carga ≥75 % con pérdida ≥5 o nivel II. Extraordinario: crítico confirmado o reacción III. Los registros cinéticos no se convierten en críticos por mostrar una cara alta en vuelo. Los rangos intermedios conservan el flinch y el acento sonoro existentes. El hold es de pose local, no de simulación. El tanque y el jefe conservan su respuesta amortiguada; no se simula una rotura de escudo sin un evento real de rotura.
- **Resonancia:** el pequeño medallón junto al dado en mano indica la runa con símbolo y color; el arco se vacía con los cuatro segundos del reloj de combate. El retorno, la cara y el tipo de dado siguen siendo identificables sin leer un mensaje. Una reacción muestra nivel romano, nombre, número de blancos y símbolos de sus condiciones. Música, esquiva, cámara y preferencias de intensidad heredan los mecanismos de 2.0; no hay otra pista ni nuevos flashes de pantalla completa.

## Los seis dados

Datos del catálogo: masa / velocidad / giro / rebote / recuperación. Todos comparten tiempo y control de carga. La expansión de carga usa la raíz de la masa; la nota de salida y la de choque se ajustan a ese peso. El color base no queda sustituido por el color de memoria.

|Dado · afinidad|Parámetros|Lectura jugable y audiovisual|
|---|---|---|
|D4 The Shard · perforación|0,7 / 760 / 19 / 0,2 / 0,15|Paso cinético veloz; estela de una hoja, cierre en punta, ataque sonoro cuadrado.|
|D6 The House · fuego|1 / 530 / 13 / 0,36 / 0,27|Referencia de peso; anillo único de asentamiento y esmalte dorado.|
|D8 The Reaper · electricidad|0,85 / 600 / 16 / 0,49 / 0,24|Redirección nativa hacia otro blanco; el trazo de asentamiento une contactos reales.|
|D10 The Splitter · fragmentación|1 / 550 / 12 / 0,31 / 0,32|Los rayos representan fragmentos de resolución, no proyectiles extra; acento de fragmentación existente.|
|D12 The Hammer · explosión|1,8 / 420 / 9 / 0,25 / 0,42|Más expansión al cargar, choque grave, empuje nativo y tres anillos de asiento.|
|D20 The Gambler · fortuna|1,2 / 545 / 17 / 0,44 / 0,34|Sello estrellado y acento del veinte natural. Un veinte al aire no muestra pérdida de salud.|

## Prioridad y pruebas

Primera elegible, sin volver a tirar por otra si falla probabilidad: **Sobrecarga disco → Arco térmico → Corte de retorno → Pulso tóxico → Circuito cruzado → Escarcha de veinte → Cristal de pista → Contratiempo → Eco de cara**. Condiciones y probabilidades: tabla de 2.0. `juice_recipes.cjs` provocó cada receta por separado en el resolvedor de producción, con caras legales, incluidas memoria previa para Corte y cara 20 para Escarcha. No son nueve encuentros naturales en navegador.

|Escenario|Resultado observado|
|---|---|
|Controles / básico / carga / seis dados|`dice_cycle`, `dice_feedback` y `dice_engine` pasan; RT y stick simulados, cancelación de puntero, movimiento durante el lanzamiento, seis retornos a READY, sin balas. Secuencia de canvas: CHARGING, RELEASE, FLIGHT, RETURNING.|
|Recetas y límites|9/9; idempotencia y memoria caducada. `combat_feel.cjs`: 79 activaciones III en 100 semillas elegibles, reproducibles; enfriamiento, pérdida limitada y blancos únicos.|
|Grupos nativos con grabados sembrados|30 lanzamientos en tres incursiones: D6 **6 cadenas/12 saltos**, D8 **9/18**, D12 **5/6**. Profundidades 3/3/2. Tasas aproximadas por segundo de pasos de simulación solicitados: 0,22/0,33/0,18. Cero rechazos por enfriamiento **en este guion de lanzamientos espaciados**; la prueba rápida sí verifica el rechazo. No justifica cambiar los 1,6 s.|
|Jefe / cierre / reinicio|El jefe nativo pasó de 111 a 108,32 HP. El recorrido de Refugio pasó derrota, retorno y reapertura. No se verificaron visualmente todas las fases de todos los jefes.|
|Duración|Una hora del reloj del resolvedor, 60 ámbitos de sala y 1.560 activaciones. Sin combo o memoria heredados al cambiar de ámbito. No equivale a una hora de audio/renderizado ni a un perfil de heap.|

## Perfil medido, no certificación de FPS

`juice_profile.cjs`: Chromium sin GPU, 960×600, misma semilla de planta 53, 30 tanques generados, 120 intervalos rAF y el mismo guion. Incluye pasos de QA y capturas; la IA y el audio no son una reproducción bit a bit. Una muestra por versión, no un benchmark de consola.

| |FPS medios|Mediana frame|P95 frame|P95 llamada de feedback|Impactos|Arranques de oscilador (mezcla completa)|
|---|---:|---:|---:|---:|---:|---:|
|Antes|21,82|49,9 ms|83,2 ms|0,2 ms|30|211|
|Con nueva presentación|20,34|50,0 ms|83,4 ms|0,3 ms|29|216|

No se demuestra una mejora de rendimiento. Una pasada adicional de desarrollo midió 30 impactos nativos, **40,7 ms acumulados** incluyendo aplicación y feedback, **10,7 ms máximo**, pico observado de **282 partículas nativas**, 12 marcas y 0 enlaces en ese escenario sin grabados. El perfil cuenta osciladores iniciados, no volumen real, clipping o voces audibles simultáneas. No hay medición fiable de heap ni GPU física.

## Inspección y reproducción

`DD_FEEL_DEV=1 python tools/build_active_html.py` habilita `DD_COMBAT_FEEL.inspect()` en consola: dado, cara, runa retenida/segundos, racha, cooldown, últimos 32 eventos, condiciones, rechazo, blancos/posiciones, profundidad, marcas, enlaces y acentos de impacto. `native` muestra ocupación de partículas/anillos y tiempo acumulado/máximo de impacto desde que se instaló el medidor. En distribución no se instala la envoltura de tiempo ni se exporta el inspector. Para restaurar producción: `python tools/build_active_html.py`. Ambos HTML entregados son de producción.

Pruebas Node: `node tools/qa/juice_recipes.cjs`, `combat_feel.cjs`, `dice_cycle.cjs`, `dice_feedback.cjs` (todos bajo `tools/qa`). Con HTTP, Chromium y `playwright-core`: `node tools/qa/juice_profile.cjs http://localhost:8000 ruta/capturas`; añadir `DD_TELEMETRY=1` para instrumentar sólo la respuesta de la página de prueba. `combat_feel_live.cjs`, `dice_engine.cjs` y `refuge_walkthrough.cjs` usan el mismo servidor.

## Archivos y límites

**Modificados en 3.0:** `src/dd_dice.js`, `src/dd_dice_motion.js`, `src/dd_dice_feedback.js`, `src/dd_dice_native.js`, `src/dd_combat_feel.js`, `tools/qa/combat_feel_live.cjs`; regenerados `index.html` y `DEADBEAT_DISCO.html`. **Creados:** `tools/qa/juice_profile.cjs`, `tools/qa/juice_recipes.cjs`, este documento y `ART_EVIDENCE/DICE_JUICE/{antes,despues}/{13,16}.jpg`, `ART_EVIDENCE/DICE_JUICE/lanzamiento.jpg`. Ningún recurso eliminado.

**Lectura cualitativa:** en la secuencia capturada se distingue la carga junto a la mano del cuerpo que ya viaja; el área y la trayectoria no cambian para vender potencia. En la captura de grupo, los avisos nativos de RAVE siguen dominando sobre los detalles pequeños: no se alteró su jerarquía. Pendiente: prueba humana de diversión, legibilidad frente a patrones tardíos, mezcla escuchada en hardware, memoria de sesión larga y antes/después en GPU real. No se declara que una prueba de lógica resuelva estas preguntas.
