# Hangar-16 · hoja de campo por equipo (60 FPS)

El analizador se ejecuta **fuera del navegador**, después de jugar. No hay que instalar nada en el juego. Crear una carpeta por equipo y perfil (p. ej. `mediciones/portatil-A/`) y copiar allí la [plantilla revision.json](revision.json). Identificar equipo, pantalla/Hz, alimentación, aceleración, versión del juego y condiciones de prueba. No incluir guardados. Misma versión, perfil y tamaño en las tres pasadas; si cambian, iniciar otra carpeta.

### Tres capturas independientes

Para cada casilla **01 ☐ · 02 ☐ · 03 ☐**, arrancar una nueva pasada `/?roomDebug&roomSeed=0`, entrar en `r0` wide, calentar ≥10 s y confirmar HUD completo y `DD_ROOM_DEBUG.pilot().active`. Consola desacoplada, sin profiler, grabación ni overlays. Ejecutar:

```js
DD_ROOM_DEBUG.pilotColliders(false);
DD_ROOM_DEBUG.perf.start({minEnemies:12,minProjectiles:8});
```

Jugar en movimiento; no consultar `report()` durante la medición. Al acabar:

```js
DD_ROOM_DEBUG.perf.stop();
copy(JSON.stringify(DD_ROOM_DEBUG.perf.report(), null, 2)); // DevTools de Chromium
```

Pegar **el JSON íntegro** en `01.json`, `02.json` o `03.json` antes de reiniciar. En `notasPorPasada` anotar duración percibida de RAVE, recorrido, condiciones y anomalías. No copiar una captura en tres casillas. Conservar intentos interrumpidos/insuficientes como `01-intento-1.json`, por ejemplo. Se puede repetir por falta de exposición; no sustituir un fallo válido por la mejor repetición. Si se corrige algo, etiquetar una nueva serie completa.

```sh
node tools/diagnostics/hangar_review.cjs mediciones/portatil-A
```

Lee los tres ficheros, muestra intervalos, segundos, media, P95 y máximo **del subconjunto `raveDenseMoving`** y emite veredictos separados. No redondea antes de comparar. Cada casilla requiere ≥300 intervalos **y** ≥10 s; P95 ≤18,4 ms. Nunca se promedian los tres P95. `PENDIENTE` significa falta de exposición, evidencia o comparabilidad; `BLOQUEADO` indica un fallo observado. Una captura cortada por pausa, pestaña oculta o colliders no se usa para aprobar. Confirmar `mismoEquipoYPerfil` personalmente: comparar metadatos no identifica el hardware físico.

### Hoja visual independiente del cronómetro

Un observador puede tomar notas en papel durante las tres pasadas. Si hace falta vídeo, repetir el recorrido **sin usar su rendimiento**. En RAVE, con mando/teclado, HUD completo, colliders apagados y densidad visible, pasar por ambas jambas y por delante/detrás de cobertura intacta y rota. No inferir exposición de los picos de población. Identificar origen, dirección o zona insegura **antes** de la ejecución y seguir el temporizador sin perderlo.

| Clave en la plantilla | Qué debe distinguirse en movimiento |
|---|---|
| `sprint` | Trazo coral y anillo: distinguirlo del barrido rojo. |
| `carga` | Línea ancha ámbar y arco de tanque/minijefe junto a la jamba. |
| `altavoz` | Abanico turquesa: leer dirección y tiempo delante y detrás de cobertura. |
| `elite` | Rombo violeta y arco temporal; comprobar solapamiento con otra silueta. |
| `laser` | Sector rojo, flecha y avance temporal; comprobar extremo bajo HUD y durante FX. |

En cada fila de `revision.json` registrar número de ejemplos, pasadas y notas («02, jamba este, sofá intacto, arco desaparece al pasar detrás; reproducido en 03»). Usar `null` si no se pudo observar; no equivale a legible. Para aprobar: ≥3 ejemplos por tipo entre las pasadas, señal y temporizador legibles, sin oclusión reproducible. Marcar `condicionesVisualesConfirmadas:true` solo tras cubrir movimiento, HUD, RAVE, jambas, cobertura y solapamientos. **Un solo aviso con oclusión reproducible veta la serie**, incluso si faltan las otras dos pasadas o el P95 cumple.

### Si falla, revisar en este orden

1. **Condiciones y datos.** Confirmar alcance, duración densa, misma alimentación, frecuencia de pantalla, resolución/DPR, calidad y aceleración. Un máximo aislado no es P95; investigar si coincide con una pérdida de respuesta. Sin muestra suficiente no atribuir nada al renderizador.
2. **P95 alto en una pasada válida.** Conservarla. En una pasada diagnóstica separada, perfilar el hilo principal: primero reconstrucciones repetidas de caché al moverse/cruzar; luego coste de culling, orden Y y asignaciones/GC. Si CPU no explica el pico, contrastar composición, transparencias RAVE, fill rate y DPR. Cambiar una variable cada vez y repetir la serie original; no reducir población ni proyectiles para conseguir un aprobado.
3. **Fallo visual.** Aislar aviso, instante, posición y estado del mueble. En una repetición separada activar colliders para distinguir un corte legítimo por línea de visión de una oclusión dibujada. Apagarlos de nuevo. Revisar base/altura de la silueta, caché tras rotura/regreso, halo del fondo, FX y zona del HUD. Verificar que el pase nativo se ejecuta una sola vez; no duplicar el aviso, no desplazarlo ni modificar su temporizador. Revalidar el mismo punto en movimiento antes de considerar otra sala.
