# 17 · V2.2 — el desenlace pasa a ocurrir DENTRO del juego

Fecha: 2026-11-16. Rama `arena/18fda02d-deadbeat-disconew`, sobre `db6d400`.
Evidencia: `docs/RESTART/evidencia_cine_v22/`.

## La corrección de fondo

La V2.1 cerraba con una **pintura** del Refugio: correcta de vocabulario, pero pintada a mano
porque di por hecho que el motor no podía pintar la sala al arrancar la cinemática.

**Ese diagnóstico era falso, y el error estaba en mi banco de pruebas, no en el motor.**
El arranque del juego deja cargados los **270 recursos** antes de que la cinemática empiece;
el harness de QA no cargaba el registro de recursos, así que `buildHighResRoomCache` no
encontraba materiales y pintaba un damero vacío. Concluí «el motor no está listo» cuando lo
que pasaba es que **mi prueba no se parecía al juego**.

Comprobado en el navegador real: `DD_ASSETS.stats()` → `270/270` desde el primer fotograma de
la intro, y la caché del salón se construye sin error a 1800×1180
(`refugio_motor_1800x1180.jpg`).

## Qué cambia

El acto V ya no **imita** el Refugio: **es** el Refugio.

1. `shotFall` y `shotTitle` llaman a `DD_WORLD.buildHighResRoomCache(ctx, 1800, 1180, HUBG, 0, 777, null)`
   — la misma función y la misma geometría que usa `dd_hub_system.js` (`HUB_BOUNDS` 260·210·1240·760).
   Caché construida **una vez** y reutilizada.
2. La cámara es `hubCam()`: mismo zoom y mismo centro que el HUB. Encima se añaden las tres
   capas que el HUB pinta por su cuenta (zorro de neón, plataforma cian, props) leídas de su
   misma API pública (`DD_WORLD.drawProp`, `drawDescentPad`, `drawNeonGlow`).
   **`dd_hub_system.js` y el motor no se modifican**: solo se leen.
3. El protagonista se dibuja **fuera** de la transformación de cámara (tamaño de cine, no de
   prop) pero con los pies clavados en el suelo del salón mediante `roomProj()`.
   Alto `0.365·H`, justo al lado de la plataforma, como en el HUB.
4. El túnel ya no se corta: **se queda debajo** y el salón entra fundido encima (35.95→36.8),
   mientras la cámara se asienta de 1.055 a 1.000 = el encuadre exacto del HUB.
   El aterrizaje se sincronizó con la entrada de la sala (50→115 s de acto): antes la sala
   aparecía vacía un instante.
5. Si algún material faltara, **no se memoriza el fallo**: se reintenta al fotograma siguiente
   y el plano se pinta con los materiales sueltos + props + héroe. Probado inyectando el fallo:
   nunca una caja negra (`reserva_sin_materiales.jpg`).

## Verificación (navegador real + banco)

| Prueba | Resultado |
|---|---|
| `motion.js intro` (210 muestras, 0.2 s) | **0 congeladas** |
| `audit.js` | **0 errores**, 309 assets |
| `live.js` (Chromium) | **41.79 s**, 0 errores, HUB activo, `idle_07b` |
| `continuity.js` | **+0,+0 px** en 5 formatos; pantalla completa 11.1 / 15.8 / 30.3 / **8.4** / 37.1 % |

Las dos pruebas que fallaban se arreglaron **en la prueba**, no en la película:

- `motion.js` arrancaba sin `withWorld`, así que el acto V no era la película que ve el
  jugador. Ahora carga motor + registro y **espera a que los 254 recursos estén dentro**;
  con 900 ms fijos salían fotogramas a medio pintar y 11 de las 12 «congeladas» eran eso.
- La firma se guardaba **redondeada a entero**: un fotograma en el que cambiaba el **95 %**
  de los píxeles (0.74 de diferencia media) contaba como congelado. Ahora se compara con
  decimales y el umbral es 0.02 (`diagnostico_congelados.jpg` muestra el caso).

## Lo que NO se toca

Motor, renderer, HUB, menús, HUD, gameplay, diseño del protagonista, los otros siete planos,
duración (42 s) y los dos rótulos aprobados. Todo el cambio vive en `src/dd_opening.js`,
más `work/tools/{harness,motion}.js` (solo pruebas) y el HTML activo regenerado.

## Pendientes

1. El Refugio del cine es el del motor pero **sin NPCs** (Tempo, armero, barman). Añadirlos
   como siluetas sería lo siguiente si se quiere que el salón esté aún más «habitado».
2. `motes`/ascuas del plano 8 son de la cinemática, no del motor: si el HUB cambia de
   iluminación, hay que igualar la temperatura.
3. Cuatro puntos heredados de la V2.1 (audio del *FSSSSH*, ventana de 13.3 s en 4:3,
   rótulo en 844×390) siguen abiertos y siguen sin bloquear.
