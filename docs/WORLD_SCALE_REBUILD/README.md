# FASE 08 — WORLD SCALE & PROPORTION REBUILD

Reconstrucción de la **escala del mundo** de DEADBEAT DISCO (jugador, enemigos,
jefes, objetos, salas) y de la **cámara** (seguimiento, zona segura,
anticipación, zoom adaptativo, límites de sala), sin tocar simulación,
colisiones, lore, progresión, Director ni los assets aprobados.

| | |
|---|---|
| Rama | `arena/e088e9d7-deadbeat-disconew` (la rama `feature/phase-08-world-scale` no puede crearse en esta sesión; se trabaja en la rama de sesión, commits por etapa, sin merge automático) |
| Interruptor | perfil `intermedia` por defecto; **`?scale=legacy`** (o `localStorage.dd_scale_profile="legacy"`) reproduce exactamente la build anterior |
| Pruebas | `node --test tests/world_scale/` (18/18) · sonda `node tools/world_scale/probe_scale.js <out> --tag=… --res=1920x1080` |
| Build | `python3 tools/build_active_html.py` (regenera `index.html` / `DEADBEAT_DISCO.html`) |

## Diagnóstico (resumen de `SCALE_AUDIT.md`)

El mundo se veía pequeño porque el motor fijaba **zoom 0,8 constante** en la
incursión (`N.zoom=.8` sobre un `N={zoom:1.16…}` inicial) y porque cualquier
sala (960–1980 × 700–1480 px) cabe entera en el campo de 2400×1350 px de
mundo que eso da a 1080p: 83 px de protagonista en pantalla, 150 px de jefe y
400–1000 px de negro alrededor. No existía zoom dinámico, zona muerta ni zona
segura; la anticipación era sólo de puntería (≤ 44 px) y el tamaño en pantalla
cambiaba con la resolución (campo 1600×900 a 720p).

## Qué se ha hecho

1. **`src/dd_world_scale.js` (`DD_SCALE`)** — perfil de escala *intermedia*
   (relativa a lo anterior): jugador ×1,18 · security 1,06 · dancer 1,04 ·
   fanatic 0,98 · drone 0,95 · chef 1,36 · élite 1,42 · minijefe ×1,12 extra ·
   jefes 1,28 (núcleo 1,22, traidor 1,24) · pickups 1,15 · salas entrada 1,10 /
   combate 1,18 / minijefe 1,28 / arena 1,40 (tienda 1,00) dentro de los topes
   del motor 1980×1480. Perfil `legacy` = todo ×1 y cámara nueva apagada.
2. **`src/dd_camera.js` (`DD_CAMERA`)** — cámara dinámica **sobre** la del motor:
   la función de seguimiento inline de `Tf` delega en `DD_CAMERA.step()` y
   vuelve a escribir `B`, `L`, `N.zoom`, `N.look`; `Qf`, `Q()`, ratón `Gu`,
   `DD_CINE`, HUB, minimapa y HUD no cambian. Zona muerta 3,5 %, zona segura
   36 %, anticipación por puntería + velocidad (tope 10 % del ancho), zoom
   calma 1,08 / combate 0,98 / multitud 0,88 / jefe ≥ 0,84 con histéresis
   0,035 y tasa ≤ 0,30/s, rango [0,80, 1,12], recorte a sala + franja de muro y
   al mundo, recolocación instantánea en cambio de sala/teletransporte, y
   zoom × `viewH/1080` ⇒ **mismo campo vertical (1000 px de mundo) a 1080p,
   900p y 720p**.
3. **Renderer** (`src/dd_world_renderer.js`): factores aplicados sólo a la
   altura de figura (enemigos, minijefes y sus muertes, jefes, pickups);
   jugador y arma en mano desde el puente (`ut.h` escalado sólo al dibujar).
4. **Salas**: `ng()` aplica `DD_SCALE.scaledRoomSize` por clase de sala
   (entrada / combate / tienda / minijefe / arena / final) y vuelve a acotar a
   los topes del motor.
5. **Colisiones**: ningún radio, alcance ni velocidad cambia (`COLLISION_AUDIT.md`).

## Resultado medido (1920×1080, mismo nivel, ver `QA_REPORT.md`)

| | ANTES (legacy) | DESPUÉS (intermedia) |
|---|---|---|
| Zoom en sala de combate | 0,800 fijo | 1,08 calma · 1,03 (14 enemigos) · 0,85 jefe |
| Campo visible | 2400×1350 px de mundo | 1778×1000 (calma) · 2265×1274 (jefe) |
| Protagonista en pantalla | 83 px | 133 px (calma) |
| Enemigo normal / tanque / élite | 75 / 85 / 80 px | 108 / 156 / 153 px |
| Residente en pantalla | 150–163 px | 193–213 px (zoom jefe) |
| Pickup | 35 px | 55 px |
| Sala de combate (l-wing) | 1580×1260 | 1620×1480 · 1800×1320 · 1980×1480 (según azar; tope 1480 alto) |
| Arena del residente (nivel 11) | 1480×1040 | 1980×1460 |
| Desfase jugador–cámara tras 240 cuadros corriendo | 271 px (sin seguir: la sala cabía) | 160 px (1080p) · 71 px (900p) · 12 px (720p), 0 inversiones de dirección |
| Coste por cuadro (headless, swiftshader, sólo comparativo) | render 1,4 ms · paso 10,3 ms | render 1,4–3,4 ms · paso 6,4–11,3 ms |

Capturas: `BEFORE_AFTER/compare_<situación>_1080.jpg` (ANTES | DESPUÉS) y
`BEFORE_AFTER/after/` para 1600×900 y 1280×720.

## Documentos

| Archivo | Contenido |
|---|---|
| `SCALE_AUDIT.md` | auditoría previa con valores reales y offsets |
| `SCALE_SPEC.md` | factores elegidos y desviaciones justificadas |
| `CAMERA_SPEC.md` | integración, reglas y parámetros de la cámara |
| `MAP_SCALE_SPEC.md` | clasificación de salas y ampliación por función |
| `ENTITY_SCALE_SPEC.md` | ganchos del renderer, anclajes, alturas efectivas |
| `COLLISION_AUDIT.md` | inventario de hitboxes/alcances y garantía de no-cambio |
| `QA_REPORT.md` | pruebas ejecutadas (y las no ejecutables), resultados, rendimiento |
| `IMPLEMENTATION_LOG.md` | etapas, archivos, arquitectura, decisiones, pendientes |
| `BEFORE_AFTER/` | capturas ANTES/DESPUÉS + `summary.json` con la telemetría |

## Pendientes conocidos

* Pruebas con mando: no ejecutables en este entorno (sin dispositivo). El
  código de mando no se ha tocado y no depende de la cámara.
* Ajuste fino con jugadores (zona segura / franja de muro / factor de jefes).
* Posible revisión de hitboxes por tipo: decisión de diseño aparte, nunca
  automática.
