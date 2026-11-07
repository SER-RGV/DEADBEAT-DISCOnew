# TANDA 08 · «El abismo vivo» — Fase 0 (auditoría global) + Fase 1 (diseño espacial)

**Fecha:** 2026-11-04 · **Rama:** `arena/109fe45c-deadbeat-disconew` · **HEAD de partida:** `3a8e58f`
**PR #1:** `OPEN`, head `3a8e58f`, base `arte-y-recursos`, sin merge · **`main`:** `d75e021` intacta
**Prueba de composición:** `ART_EVIDENCE/hub/tanda_08/composition_proof.json` — **16/16 APROBADA** (sin assets).

---

## 1. Preflight (antes de modificar nada)

| Comprobación | Resultado |
|---|---|
| Rama | `arena/109fe45c-deadbeat-disconew` (no se cambia) |
| HEAD | `3a8e58f1d30432352d2c924a711fcf47d7635fdb` |
| Worktree | limpio |
| PR #1 | `OPEN`, `headRefOid=3a8e58f`, `mergedAt=null`, base `arte-y-recursos` |
| T01–T07 | presentes: 21/21/22/0(83 ev.)/21/21/15 assets, todos con manifest salvo T04 (integración de render) |
| Marcadores HTML | `TANDA04/05/06/07:BEGIN/END` intactos |
| `main` / `origin/main` | `d75e021fb13418bf49d5853c1a9583e7d11b90f2` |
| Build activa | `DEADBEAT_DISCO.ART.html` 13.414.811 B / 20.427 líneas (SHA `a757a49e…`); `ART_PACK/art_pack.js` 100.474 B (SHA `c5e5759b…`) |
| Preview | `http://127.0.0.1:8123/` HTTP 200, sin reiniciar |

**El estado real coincide con el esperado.** No se ha modificado nada durante la auditoría.

---

## 2. Auditoría de sistemas (Fase 0)

Arneses: `ART_TOOLS/qa/hub_tanda_08_audit_global.js` → `ART_EVIDENCE/hub/tanda_08/audit_global.json` + 12 capturas.

| Sistema | Realidad medida |
|---|---|
| Motor / canvas | 27 canvas, **1** bucle `requestAnimationFrame` (`Tf(n)` → `Qf()`/`cp(e)`), 1 canvas de juego `#game` 1280×900 |
| Cámara | `DMO.camera()` = `{x,y,zoom .9375,viewW 1365,viewH 960,lead {0,10}}`; proyección `sx=640+zoom(wx-cx)`, `sy=450+zoom(wy-cy)`; límites teclado `x∈[883,1617]`, `y∈[655,1195]` |
| Registro V5 | 168 claves (`__DDM_V5_IMG`), `load()` único, `loadHub1…7()` encadenados en `art_pack.js` |
| Capas de dibujo | `Wf` (suelo mundo, con `Ls(g)`/`clip`), `Ph` (aéreo mundo), Y-sort `Lc(prop)`, `zf` (pantalla, antes del HUD) |
| Caché de suelo | 1920×1320 desde `(290,265)` → **`y_max = 1585`**. Todo lo que baje de 1585 queda fuera del clip |
| Superficie transitable | Octógono `y265…1585`; COTA 0 `y265…1470` (T01–T06); COTA −01 `y1470…1585` es el **labio** T07 |
| Acantilado T07 | `h07_labio_acantilado` `[500,1470,1500,115]`, `h07_estrato_rococo` `[200,1585,2100,110]`, `h07_apertura_profundidad` `[1040,1560,420,260]` |
| Grieta | decal V5 `hub_abyss_stair_crack` = `ART_ASSETS/hub/tanda_01/hub_09_puertas_accesos.png` (320×175 RGBA), dibujado 330 px en `x1085…1415, y1256…1436`. Interior negro opaco con halo cian; sobre él el panel `III · DESCENSO`. **Es el único «agujero» visible desde el centro del HUB** |
| Iluminación | `Wb()` (glow pixelado), gradientes radiales en `Wf/Ph/zf`, `DMO_ATMOS` (bloom/vignette/grain, overlays propios, `degraded:false` en esta sesión) |
| Partículas existentes | `pAnim.dustParticles` (polvo del jugador, sólo al moverse), `Wc.sparks` (armas), `wa` (trazadoras), `ambientDancers` (4 NPC) + 6 actores T07, brasas/polvo **procedurales** T07 (26 + 14, sin sistema de emisores) |
| Reloj | `Z` (reloj artístico), `Tf(dt)` acumula; `Yc.reduced` congela; `hub.ambientFrozenAt` para pausa |
| Descenso | `floorDropAnim` con `stairProgress`, `shaftOpen`, `phase` (plunge→skyfall→impact), `stage` (approach→descent→arrival→landing). **La cámara SUBE** (`y1195→1306→925`) y el zoom baja de 1,031 a 0,9375; NO se acerca al fondo |
| Audio | `DMO_MUSIC` 1 secuenciador, cadena `HUB→DESCENT→LANDING→EXPLORATION` intacta |

### Restricción geométrica decisiva

Con `y_cam=1195` y `zoom .9375` el mundo visible es `y715…1675`. Bajo el borde del acantilado (`y1585`, `sy≈816`) **solo quedan ≈84 px de pantalla**; con el labio incluido (`y1470`, `sy≈708`) ≈192 px. En el centro del HUB (`y_cam=985`) el borde cae en `sy≈1013`, **fuera de pantalla**. Y durante el descenso la cámara se aleja hacia el norte, así que **ningún plano en coordenadas mundo por debajo de y1675 llega a verse**.

➡️ Consecuencia de dirección de arte: la profundidad no puede resolverse apilando más imágenes en el mundo. Debe resolverse como un **cutaway en espacio de pantalla**, anclado al borde real del acantilado, con compresión por distancia, parallax derivado de la cámara existente y una **apertura gobernada por `shaftOpen`** durante el descenso. Esto es lo que se ha probado.

---

## 3. Mapa de profundidad del HUB (6 planos)

| # | Plano | Zona / anclaje | Estado T01–T07 | Factor parallax | Necesidad T08 |
|---|---|---|---|---|---|
| 1 | Superficie del HUB | octógono `y265…1470` | **RESUELTO** (T01–T06, 11 estaciones, 10 NPC) | 1.00 | Ninguna. Intocable |
| 2 | Bordes del acantilado | `y1470…1585` | **RESUELTO** (T07 labio + ingletes) | 0.92 | Continuidad: rocas próximas que arranquen del borde |
| 3 | Paredes rocosas próximas | `y1585…1675` ≈84 px | **PARCIAL** (T07 estrato: una sola banda plana) | 0.92 / 0.66 | **ALTA**: relieve, grietas, contraste, siluetas |
| 4 | Formaciones intermedias | dentro del cutaway, `d≈0.26…0.52` | **AUSENTE** | 0.66 / 0.40 | **ALTA**: columnas, plataformas, rocas suspendidas |
| 5 | Profundidades lejanas | `d≈0.76` | **AUSENTE** | 0.20 | **ALTA**: paredes lejanas, cavidades, bajo contraste |
| 6 | Fuentes de luz infernales | `d≈0.94`, fondo del cutaway | **AUSENTE** (T07 sólo un glow estático bajo la abertura) | 0.08 | **ALTA**: luces que interpreten la distancia |
| + | Grieta central | `x1085…1415, y1256…1436` | **PARCIAL**: agujero negro con halo cian | — | **MEDIA**: resplandor desde abajo + brasas emergentes, sin tapar el panel |
| + | Descenso | `floorDropAnim` | **RESUELTO** en T07 (pozo, haz, control) | — | **ALTA**: nuevas capas de profundidad al abrirse el pozo |

### Carencias priorizadas

1. **P1** — La grieta es un agujero oscuro sin lectura de distancia (crítico, visible desde el centro).
2. **P2** — Bajo el acantilado sólo hay una banda de roca y un fondo negro: no hay planos espaciales.
3. **P3** — No hay movimiento ambiental con sistema propio: T07 dibuja 26 brasas y 14 motas con bucles fijos, sin humo, sin corrientes, sin variación de densidad ligada al descenso.
4. **P4** — No hay parallax: todos los elementos van en coordenadas mundo 1:1, por lo que el fondo no «se queda atrás».
5. **P5** — El descenso muestra un pozo genérico; no aparecen nuevas capas a medida que avanza.

### Zonas ya suficientemente resueltas (no se tocan)

Octógono, medallón, cabina DJ, barras, arcade, arsenal, espejo de los sellos, paramentos T06 `y400…1540`, 10 props T05, 6 actores T07, llegada breve, Y-sort, colisiones, estaciones, audio.

---

## 4. Fase 1 — Diseño espacial

### Modelo de cutaway

```
edgeY = 450 + zoom*(1585 - cam.y)          // borde REAL de T07
expand = 260 * shaftOpen                   // progreso REAL del descenso
T  = edgeY - expand ;  Wh = H - T
y(d) = T + Wh*(0.06 + 0.88*d^0.78)        // compresión por distancia
h(d) = Wh*(0.30 - 0.20*d)
x-offset = -zoom*(cam.x - 1250)*factor(d) // parallax de la cámara EXISTENTE
```

Trapezoide convergente (`x 0…W` arriba → `0.34W…0.66W` abajo) recorta todos los planos: las paredes se pierden en la oscuridad. El cutaway se retira al cargar `CAMPAIGN_ROOM` para no tapar LIMBO.

| Plano | d | factor | alpha | Contenido |
|---|---|---|---|---|
| P1 cercano | 0.00 | 0.92 | 0.98 | Paredes próximas con máxima definición, grietas oro/naranja |
| P2 medio | 0.26 | 0.66 | 0.82 | Estrato geológico + columna natural |
| P3 intermedio | 0.52 | 0.40 | 0.62 | Plataforma suspendida + rocas flotantes |
| P4 lejano | 0.76 | 0.20 | 0.42 | Pared lejana + cavidades, bajo contraste |
| P5 fondo | 0.94 | 0.08 | 0.30 | Luces infernales diminutas |

Escala y contraste decrecientes; las luces del fondo crecen con `shaftOpen`, no con un temporizador nuevo.

### Prueba de composición (sin assets, en el juego real)

`ART_TOOLS/qa/composition_hub_tanda_08.py` inyecta `t08_composition_block.js` en una **copia temporal** del HTML (`t08_composition.html`, borrada al terminar); `t08_composition_probe.js` ejecuta 16 comprobaciones con Chromium 131.

**16/16 APROBADA · 0 `pageerror` · 168 V5 · 27 canvas (el prototipo no registra nada).**

| Métrica | Valor |
|---|---|
| Ventana en borde sur | `winTop 815,6`, `winH 84,4` |
| 5 planos | `y 820,7 / 846,7 / 865,3 / 880,6 / 891,4`, alturas `25,3→9,4`, alpha `0,98→0,30` |
| Ningún plano por encima del borde | Sí (no tapa superficie) |
| Parallax con Δcámara 734 u | `633 → 454 → 275 → 138 → 55 px` (monótono decreciente) |
| Centro del HUB | `winTop 1013,4` → cutaway oculto, sin intrusión |
| A/B localizado | diff de franja **20,62**, luminancia 48,65 / 48,91 |
| Brasas | `t` y posición cambian en 8/8 muestras, confinadas al abismo |
| Descenso | `expand 0→260`, `winH 84,4→373`, luminancia mínima **39,48** (sin negro) |
| `CAMPAIGN_ROOM` | cutaway retirado en 4/4 muestras |
| `Yc.reduced` | detectado, geometría estable, 0 errores |

Capturas: `composition_ON/OFF_*.png`, `composition_descenso_*.jpg`.

**Decisión:** la perspectiva y los planos funcionan en el juego real → se autoriza la Fase 2 (producción). Los 10 assets sustituirán los rectángulos procedurales **en las mismas cajas**, sin cambiar la geometría validada.

### Límites declarados de la composición

- En reposo en el centro del HUB el acantilado no entra en pantalla: es consecuencia de la cámara real, no de T08. La grieta central (resplandor + brasas) y la aproximación al borde sur son los dos puntos de lectura en juego normal; la inmensidad se revela durante el descenso.
- No se modifica la cámara global, no hay segundo sistema de cámara, no hay canvas nuevo. El parallax es **sólo aritmética de dibujo** sobre `DMO.camera()`.
