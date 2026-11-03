# Comprobación manual pendiente (GUI) — Fase 0.3.1

El diagnóstico automatizado está cerrado. **No hay GUI en este entorno** (`DISPLAY` vacío, sin Xvfb/Xorg/weston ni paquete instalable), así que NO se han hecho pruebas manuales ni se han simulado. Quedan dos comprobaciones que sólo puede hacer una persona con un navegador de escritorio. Son breves y no bloquean el resto del proyecto.

## Preparación (2 minutos)

1. Abrir `v9_t3_fase1b_cache_probe.html` servido por HTTP local en un perfil limpio/incógnito (no tocar datos de usuario). No editar el HTML.
2. Anotar navegador + versión, SO y si hay audio y mando.
3. Abrir DevTools → Consola. Opcional: pegar el observador de `Array.prototype.push` de `TOOLING.md` para ver `shotsFired`/proyectiles, o usar simplemente `DMO.testStats().shotsFired` en consola.

## Secuencia de arranque ya verificada

`clic` en la portada → `ENTER` en INICIAR → **mantener `ESC` ~1 s** para omitir la cinemática → `DMO_HUB.startCampaignFromHub(0)` en consola (o bajar al Ascensor Sur y pulsar `E`).

## Comprobación 1 — INC-001 (disparo primario)

Esperar a que en consola `DMO_HUB.state()` devuelva `location:'CAMPAIGN_ROOM'`, `transitionLock:false`, `transitionsCompleted:1`. Entonces:

1. Anotar `DMO.testStats().shotsFired` (contador de disparos del **jugador**; **no** usar `DMO.debug.state().balas`, que mide proyectiles enemigos).
2. Apuntar con el ratón a un punto de la sala y **mantener clic izquierdo 3 s**.
3. Volver a leer `shotsFired` y observar en pantalla si salen proyectiles y si impactan/dañan al enemigo.
4. Repetir 3 veces en posiciones distintas. Confirmar que la cadencia es continua y que hay respuesta visual/sonora.

**Se confirma el buen funcionamiento** si `shotsFired` aumenta de forma sostenida y los proyectiles se ven en el mundo. **Se reabre INC-001** si, con `transitionLock:false` y frames normales (GUI), `shotsFired` no aumenta. Registrar también si `Q` sigue dando baja (+28).

## Comprobación 2 — INC-002 (duración real de la transición)

1. Con un cronómetro, medir desde `startCampaignFromHub(0)` hasta que `DMO_HUB.state()` muestre `location:'CAMPAIGN_ROOM'`, `transitionLock:false` y `transitionsCompleted:1`.
2. **No dar por terminada la transición al ver la animación del ascensor o al cambiar `location`**: en headless el cambio de ubicación llegó ~1,5 s antes de `tc=1`.
3. Verificar que el jugador puede moverse (`d` → `px` aumenta) y disparar (`shotsFired` aumenta).
4. Repetir 2 veces y anotar duración, `transitionErrors` y cualquier excepción en consola.

En headless la transición tardó **51,9 / 53,1 / 54,4 s** y con frames forzados **4,7 s**: la diferencia se atribuye a la inanición de `requestAnimationFrame` en SwiftShader. **Se reabre INC-002** si en GUI la transición sigue tardando decenas de segundos, queda en `TRANSITION` o `transitionLock` no vuelve a `false`.

## Comprobaciones complementarias (ya pendientes de Fase 0.3, no bloqueantes)

Audio audible y cambios de tema; mando físico (V-10); jefes/eventos; colisiones y recorrido a pie de salas; almacenamiento realmente bloqueado.

## Registro

Añadir una fila por ejecución en `VALIDATION_PLAN.md` (plantilla de la sección 3), actualizar `FASE_0_3_TEST_MATRIX.md` y `FASE_0_3_BUG_REGISTRY.md` con el resultado, y commitear **sólo documentación**. No corregir nada por intuición mientras INC-001/INC-002 no estén confirmadas.
