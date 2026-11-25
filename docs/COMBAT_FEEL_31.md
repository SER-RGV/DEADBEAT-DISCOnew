# Combat Feel 3.1 · acta de aceptación

**Decisión: candidata para prueba con jugadores; no aprobada aún en satisfacción ni rendimiento físico.** Se conserva 3.0 con una corrección de lectura. No hay evidencia para cambiar estadísticas, cadencia o dificultad, ni para declarar un dado dominante.

## Comparación controlada

Chromium por software, motor nativo, semilla de sala 53. A reconstruye la presentación anterior con movimiento visual y feedback de `7f52e9e` y suprime señales nuevas seleccionadas; no es un binario histórico. B reproduce la presentación 3.0. Mismo escenario, entradas y dado dentro de cada pareja. Orden AB/BA alterno, 96 rAF por condición, cuatro pasos solicitados por rAF además del planificador. Esto permite comparar contactos y estados, **no** medir latencia de mando. Las escenas entre dados son distintas: no constituyen un ranking.

Segunda pasada sin grabación (`repeat.json`); tiempos en ms, siempre A → B:

|Dado / escena|Lanzamientos / impactos por variante|FPS|Mediana de frame|P95|Lectura de la prueba|
|---|---:|---|---|---|---|
|D4 / dúo|3 / 2|23,8 → 26,0|33,4 → 33,4|66,7 → 50,1|Dos contactos aislados; falta juzgar si el dado ligero se distingue al soltar.|
|D6 / grupo|4 / 30|19,5 → 20,7|50 → 50|116,7 → 83,3|Caso crítico de números reciclados. Una cadena A, ninguna B en esta repetición; no es equivalencia determinista.|
|D8 / jefe|3 / 6|14,4 → 15,7|66,7 → 66,6|100 → 99,9|Tres cadenas en ambos; comprobar si se entiende qué objetivo sigue al impacto.|
|D10 / dúo|3 / 2|24,2 → 22,2|33,4 → 49,9|50,1 → 66,8|Mismo conteo que D4; no demuestra que ambos se sientan iguales ni distintos.|
|D12 / grupo|4 / 30|20,9 → 19,4|50 → 50|83,4 → 83,4|Sin cadena en el fixture; impactos densos no equivalen a dominar la receta.|
|D20 / jefe|3 / 3|16,7 → 16,2|50 → 50,1|83,4 → 99,9|Conserva la fase a distancia además de los cinco patrones del D8; falta probar si el peso compensa la espera percibida.|

Primera pasada en `crossover.json`: mismos conteos de lanzamientos e impactos por pareja; intento de captura en D6/D20, por lo que no se deben promediar ambas pasadas. El signo del cambio de FPS no es estable. Jefe preparado al 38 %: volley, fan, berserk, spiral, burst; hasta 17 balas enemigas en la primera pasada. Son patrones reales en una fase preparada, no una victoria desde salud completa. Los rótulos de entrada y rave ocupan parte del campo en los clips: no hay prueba de que el jugador pueda seguir siempre el peligro bajo ellos.

## Qué se jugó y qué se corrigió

- Recorrido automático desde refugio sin otorgar equipo, generar enemigos ni forzar despejes: r0 → r1 → r2, 43 marcas, muerte a 0 HP tras 132,5 s de simulación solicitada. Pasó por apuntado, carga, suelta, vuelo, tirada, resolución, retorno y recuperación. Se detuvo al morir, no en la pantalla de resultados (`run.json`). No fue una sesión humana.
- En la prueba nativa se conservaron movimiento, esquiva, mando, contacto y daño al jefe (111 → 108,32), sin balas convencionales en la comprobación de dados. La cadencia programada habitual fue de 32 rAF entre sueltas; no revela cuándo una persona quiso volver a tirar.
- **Defecto reproducido:** 30 impactos simultáneos podían borrar el único número de daño antes de dibujarlo. En `src/dd_dice_feedback.js` el cursor del texto conserva posición, color y caducidad independientemente de la chispa, usando cuatro de los doce objetos existentes. La regresión exige conservar `2.4` y limpiar al reiniciar; pasa también la prueba de ocupación y expiración de FX. No se añadieron efectos ni se cambió el daño.
- Candidata bajo oleadas: 960 rAF, 138 impactos, 39 lanzamientos registrados, 3 cadenas; 26,46 FPS, mediana 33,4 ms, P95 50,1 ms. Picos de 280 partículas, 12 marcas y un enlace. Son contadores observados, no techo de reacciones simultáneas ni perfil de memoria/energía. Unos 36 s de reloj no certifican una sesión prolongada.
- Nueve recetas pasaron las comprobaciones de resolución y prioridad: Sobrecarga disco, Arco térmico, Corte de retorno, Pulso tóxico, Circuito cruzado, Escarcha de veinte, Cristal de pista, Contratiempo y Eco de cara. La ventana de memoria de 4 s, carga, racha, objetivos y desempate se prueban como reglas, no como conocimiento del jugador. En navegador, diez lanzamientos por D6/D8/D12 dieron 9/8/4 cadenas y 24/14/5 saltos. No todas las recetas fueron provocadas en una partida espontánea.

## Evidencia y escucha

[Grupo A](../ART_EVIDENCE/COMBAT_FEEL_31/grupo-A.mp4) · [Grupo B](../ART_EVIDENCE/COMBAT_FEEL_31/grupo-B.mp4) · [Jefe A](../ART_EVIDENCE/COMBAT_FEEL_31/jefe-A.mp4) · [Jefe B](../ART_EVIDENCE/COMBAT_FEEL_31/jefe-B.mp4). Son capturas anteriores a la corrección, no vídeo probatorio del arreglo. Los cuatro MP4 decodifican con audio: mezcla mono capturada, grupo −42,0/−41,9 LUFS y jefe −43,0/−43,6 LUFS, picos entre −22,9 y −17,1 dBFS. No hay saturación digital en estas muestras; no informan de enmascaramiento, volumen en altavoces ni fatiga tras media hora.

## Puerta de aceptación pendiente

Ocultar la variante, repartir AB/BA entre jugadores y repetir por dado el mismo encuentro y equipo. Sin explicar las pistas, pedir que señalen cuándo soltar, qué cara salió, cuánto daño entró y cuándo recuperaron control. Para cada receta, pedir predicción del objetivo y causa antes de repetir con una sola condición cambiada (memoria, carga, racha, blanco o prioridad). Registrar errores, peligro perdido, cancelaciones y preferencia por volver a tirar; permitir «sin diferencia». Contrastar identidades en la **misma** escena. Completar sesiones de al menos 30 min con auriculares y altavoces, telemetría de P95, memoria y máximos de reacciones concurrentes en hardware objetivo. Si hay conflicto, conservar primero el control y la lectura, no el espectáculo. Hasta entonces no hay aprobación perceptiva ni de optimización.
