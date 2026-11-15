# FASE 08 · CAMERA_SPEC — Cámara dinámica sobre la cámara existente

Módulo: `src/dd_camera.js` (`window.DD_CAMERA`, 237 l., cargable en Node).
Parámetros: bloque `camera` del perfil activo de `DD_SCALE`
(`src/dd_world_scale.js`), con `DEFAULTS` de respaldo en el propio módulo.

## 1. Integración (sin duplicar sistemas)

La función de seguimiento inline del motor (dentro de `Tf`, offset 3154062 del
ORIGINAL) se parchea en `tools/build_active_html.py` (bloque `1e`): si
`DD_CAMERA.isActive()`, llama a

```
DD_CAMERA.step(dt, { px, py, vx, vy, aim, camX:B, camY:L, zoom:N.zoom,
                     viewW, viewH, room:Ps, worldW:E, worldH:k,
                     enemies:Ta, boss:(ir&&sr)?sr:null, roomKey, running:U, dying:Mr })
```

y vuelca el resultado en **las mismas variables del motor**:
`B = c.x; L = c.y; N.zoom = c.zoom; N.look = (leadX, leadY); Q()`.
Todo lo demás (transformación en `Qf`, ratón `Gu`, `DMO.camera()`, cámara
cinemática `DD_CINE` que suma `offX/offY/zoomMul`, HUB con su propia cámara,
minimapa, HUD en DOM) sigue leyendo esas variables y **no cambia**.
Si el módulo no existe o el perfil es `legacy`, se ejecuta el código original.

Las dimensiones de ventana/mundo se leen por `window.__ddViewDims()` (accesor
de ámbito superior añadido junto a `j()`), porque dentro de `Tf` los nombres
`y`, `x`, `E`, `k` están sombreados por locales posteriores (TDZ).

**Separación cámara/simulación:** `step()` sólo lee la entrada (no la muta; hay
prueba con objetos congelados) y devuelve centro/zoom. No toca `ye`, `Ta`,
balas ni alcances. El ratón sigue convirtiendo pantalla→mundo con `B/L/N.applied`
después del paso de cámara del mismo cuadro, así que la puntería es coherente.

## 2. Comportamiento

| Bloque | Regla | Parámetros (perfil intermedia) |
|---|---|---|
| Zona muerta | el objetivo tiene que separarse > `deadzoneFrac·ancho visible` del centro antes de mover la cámara; el exceso se sigue con suavizado exponencial `followTau` | `deadzoneFrac .035`, `followTau .17 s` |
| Anticipación | puntería como el motor (`min(44, 14+.16·|v|)`, ×.7 en Y) **más** velocidad `·leadVel`, tope `leadMaxFrac·ancho visible`, suavizada con `leadTau`; congelada al morir | `leadVel .22`, `leadMaxFrac .10`, `leadTau .28 s` |
| Zona segura | el centro nunca se aleja del jugador más de `safeFrac·semiancho/semialto` ⇒ el jugador no pasa del 36 % hacia el borde (salvo pared, ver abajo) | `safeFrac .36` |
| Recorte a la sala | la vista no enseña más allá de la sala + franja de muro; si la sala es más pequeña que la vista en un eje, se centra en ese eje. Segundo recorte al mundo 2500×1850 | `roomMargin {top 280, bottom 220, left 240, right 240}` |
| Zoom adaptativo | objetivo por modo: calma / combate / multitud (interpolado con `smoothstep((n−1)/7)` sobre enemigos a < `nearR`) / jefe; sólo se adopta un objetivo nuevo si difiere > `hysteresis` o cambia el modo; se acerca con `zoomTau` y nunca más rápido que `zoomRate`/s | calm 1.08, combat .98, crowd .88, bossMin .84, rango [.80, 1.12], `nearR 900`, `hysteresis .035`, `zoomTau .9 s`, `zoomRate .30/s` |
| Modo jefe | zoom = min(combate, max(min, menor de: bossMin, zoom que encuadra jugador+jefe en el 72 % de la pantalla)); el centro se desplaza `bossBias` hacia el jefe | `bossBias .22`, `bossPad 120` |
| Resoluciones | todos los zooms se multiplican por `viewH/1080` ⇒ campo vertical constante (1000 px de mundo en calma) en 1080p/900p/720p | `refH 1080` |
| Transiciones | al cambiar `roomKey` (nivel + clave de sala + tamaño) o saltar > `snapDist`, la cámara se recoloca de golpe y resetea anticipación y zoom (sin barrido ni rebote) | `snapDist 600` |

Orden dentro de `step()`: zoom → detección de salto → anticipación → zona
muerta + suavizado → zona segura → recorte a sala → recorte a mundo.
La pared manda sobre la zona segura: pegado al muro el jugador puede
acercarse más al borde de pantalla, pero sigue dentro (prueba automatizada).

## 3. Utilidades

`worldToScreen(wx, wy, cam)`, `screenToWorld(sx, sy, cam)` (misma fórmula que
`Qf`/`Gu`: `view/2 + (w − cam)·zoom`), `zoomForViewport(z, viewH, refH)`,
`clampCenterToBounds`, `roomBounds`, `computeZoomTarget`, `config()`,
`setEnabled()`, `reset()`, `debug()` (modo, cercanos, objetivo, saltos, pasos).

## 4. Lo que NO hace

* No cambia coordenadas, velocidades, alcances ni colisiones.
* No reemplaza `Qf`, `Q()`, `Gu`, `DD_CINE` ni la cámara del HUB.
* No toca el HUD (DOM) ni el minimapa.
* No introduce dependencias.
