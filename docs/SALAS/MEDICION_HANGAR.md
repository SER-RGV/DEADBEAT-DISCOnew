# Hangar-16 · prueba de movimiento y presupuesto de fotograma

**Decisión actual: no ampliar todavía.** Hay un instrumento verificable, no una certificación de hardware ni una nueva escena de estrés. No se cambia el pase de peligros. La prueba de lectura y la de rendimiento se hacen por separado para que capturar vídeo no altere los tiempos.

## Medir una pasada

1. Abrir `/?roomDebug&roomSeed=0`. Descender y confirmar `DD_ROOM_DEBUG.pilot().active`. Usar el HUD normal, anotar CPU/GPU, sistema, Hz del monitor, alimentación, aceleración del navegador, zoom y resolución. Fijar la misma calidad, DPR, movimiento reducido y tamaño de ventana para las repeticiones. Calentar recursos durante al menos 10 s. No usar `testStep`, profiler, capturador de pantalla ni limitación artificial del procesador.
2. En consola ejecutar lo siguiente. Mantener la consola separada para que cerrarla no cambie el viewport. Desactivar también el auditor nativo si se había activado; el muestreador rechaza ambas superposiciones.

```js
DD_ROOM_DEBUG.pilotColliders(false);
DD_ROOM_DEBUG.perf.start({minEnemies:12, minProjectiles:8});
```

3. Jugar; no imprimir estadísticas cada fotograma. Al terminar, `DD_ROOM_DEBUG.perf.stop(); DD_ROOM_DEBUG.perf.report()`. En Chromium, `copy(JSON.stringify(DD_ROOM_DEBUG.perf.report()))` permite guardar el informe. `reset()` descarta los datos; `start()` inicia una ventana nueva. Guardar cada informe antes de repetir. Se detiene si detecta salida del piloto, pausa/modal, muerte, pestaña oculta, colisionadores o al llenar 18.000 intervalos. Si se redimensiona, cambia de calidad o pierde el foco, descartar la pasada. `reason` permite distinguir un cierre automático.

**Qué mide.** Tiempo de pared entre inicios consecutivos del render principal `Qf`, con su reloj existente, antes del límite de `dt` de la simulación. Incluye esperas y carga entre dibujos, no tiempos de presentación de la GPU. `all` cubre juego activo; `rave` exige RAVE en ambos extremos; `raveDenseMoving` exige además densidad en ambos extremos y desplazamiento del centro del jugador. Los contadores son entidades de sala (`Ta.length`) y proyectiles de las listas nativas enemiga y de arma (`Ia.length + wa.length`), no píxeles visibles, partículas ni el dado. Se puede llegar al umbral fuera de cámara. Los picos de dos contadores no prueban simultaneidad. Un grupo con `count:0` significa **sin muestra**, no 0 ms. `seconds` en grupos filtrados es tiempo acumulado, no necesariamente continuo.

Media aritmética, máximo y P95 empírico (`ceil(.95·n)`, rango desde 1) en ms. Sin truncar picos ni promediar FPS. Dos buffers tipados fijos (~158 KiB en debug); sin overlay, segundo rAF, consultas de GPU, escaneo de enemigos ni ordenación por frame. Solo se ordena en `report()`. En modo normal no hay API ni buffers. No se instrumentan fases: si falla el presupuesto, hacer una **pasada distinta** con el profiler y comparar CPU de caché, ordenación/dibujo, efectos y HUD; no mezclar sus muestras con las de aceptación.

## Lectura humana (pasada independiente)

- Moverse y apuntar con HUD completo. Recorrer el centro, bordear ambas jambas y pasar por delante y detrás de cobertura sólida; repetir tras rotura si está disponible. Alternar movimiento lateral y diagonal. No usar invulnerabilidad, teletransporte ni despeje forzado como prueba de jugador.
- Durante RAVE y densidad visible, pedir al jugador que indique **antes de la ejecución** el origen, la dirección o zona insegura y cuándo debe esquivar. Anotar por separado sprint coral (trazo), carga ámbar (línea ancha), altavoz turquesa (abanico), élite (rombo violeta) y barrido rojo (sector y flecha). Comprobar que el arco temporal avanza sin desaparecer tras sofá, muro, FX o HUD. Anotar si la línea termina en cobertura porque la trayectoria está bloqueada: no confundirlo con oclusión de pintura.
- Registrar por aviso escenario, distancia a la pantalla, solapamientos, identificación correcta/incorrecta y si había tiempo para responder. Anotar daño **sin usarlo como única prueba de lectura**. Repetir también a tamaño mínimo soportado y con movimiento reducido. El inspector `pilot()` permite contrastar temporizadores en otra pasada, sin superponer colores. Si un peligro no aparece naturalmente, marcar «sin exposición»; la [escena controlada existente](PILOTO_HANGAR.md) sirve para diagnóstico, no reemplaza la sesión humana.

## Umbral de decisión propuesto (fijarlo antes de medir)

- Por cada hardware objetivo, al menos tres pasadas independientes; cada una con ≥300 intervalos y ≥10 s **en `raveDenseMoving`**. Si el encuentro natural no lo permite, conservar los registros y declarar cobertura insuficiente, no rebajar umbrales después de ver los resultados. No promediar P95 entre pasadas.
- Para objetivo **60 FPS**, exigir P95 ≤18,4 ms en cada pasada (presupuesto 16,67 ms + 10 % de tolerancia). Si el producto admite un perfil independiente de 30 FPS, fijar previamente ≤36,7 ms solo para ese perfil. Investigar cualquier máximo >3 presupuestos durante un aviso y repetir; un pico reproducible que impida reaccionar bloquea la ampliación aunque el P95 pase.
- Exigir exposición identificable a los cinco avisos, al menos tres ejemplos por tipo entre pasadas, con movimiento y algunos solapamientos. Ningún aviso o temporizador debe quedar completamente tapado ni desaparecer sistemáticamente tras el mismo objeto. Una confusión repetida en dos exposiciones equiparables bloquea la aprobación: revisar contraste/forma/orden antes de añadir otra sala. Sin equipo objetivo o jugadores, estado **pendiente**, no aprobado.

## Verificación del instrumento

`node tools/qa/hangar_perf.cjs` prueba percentil, media, máximo, filtros, reinicio y exclusión de una discontinuidad con datos conocidos. `node tools/qa/hangar_perf_live.cjs http://localhost:8000` prueba la ruta real en Chromium, movimiento por teclado, rechazo/corte por colisionadores y ausencia de API en juego normal. En una pasada corta de humo en Chromium headless sin GPU, 1280×800, DPR 1, se registraron 86 intervalos: media 36,18 ms, P95 50,40 ms y máximo 81,40 ms. Pico de 2 enemigos, sin intervalos RAVE: **no es una medición de estrés ni evidencia de incumplimiento en hardware objetivo**.

**Serie por equipo:** [hoja operativa, plantilla y analizador offline](TRES_PASADAS.md).
