# HUB · TANDA 06 — FASE 1 · AUDITORÍA DE CÁMARA Y PERSPECTIVA REAL

Fuente de verdad: `DEADBEAT_DISCO.ART.html` y medición en vivo con Chromium/Playwright
(`ART_TOOLS/qa/hub_tanda_06_camera_audit.js` → `camera_audit_runtime.json`).
**No se ha modificado ningún archivo del juego durante esta fase.**

## 1. Proyección medida (no teórica)

| Concepto | Valor real |
|---|---|
| Transformación de cámara | `translate(y/2,x/2) → scale(N.applied) → translate(-B,-L)` |
| Matriz `getTransform()` en `drawImage` | `a=d=0,9375`, `b=c=0` en las 6 zonas |
| Mundo → pantalla | `sx = 0,9375·(x−B)+640`; `sy = 0,9375·(y−L)+450` |
| Rotación / cizalla / escala por profundidad de cámara | **ninguna** |
| Zoom | `0,9375` uniforme; `viewW=1365`, `viewH=960` a 1280×900 |
| Eje +X | derecha en pantalla, sin foreshortening |
| Eje +Y | abajo en pantalla = **más cerca** (profundidad creciente) |
| Altura vertical | se pinta hacia **−Y de pantalla** (billboard), no por transform |
| `DMO.camera()` | `x=B, y=L, zoom, viewW, viewH, lead={0,10}` |
| Límites de cámara medidos | `B∈[883,1617]`, `L≥655` (`lead +10`) |
| Y-sort | cola `sort(y ascendente)`; `hubCustom.sortY = dc.y` (T05/T06) |
| `DMO_SEMI2D.scaleFor(y)` | 0,804 (y=300) → 1,174 (y=1500): **solo props procedurales**; `hubCustom` (`Lc → hubDraw`) no recibe esa escala |

Conclusión: la cámara es **ortográfica oblicua 2.5D de escala uniforme**. La ilusión
isométrica la aportan los sprites y el suelo pintado, **no una proyección isométrica
matemática**. Por tanto no se impone una isometría distinta: las fachadas se construyen
alineadas a los ejes X/Y reales, con coronación (cara superior) y zócalo (plano de suelo)
para dar volumen sin deformar. Aplicar `scaleFor(y)` a la envolvente rompería la
continuidad entre tramos contiguos, por lo que **se descarta deliberadamente**.

## 2. Geometría, límites y capas existentes

* `buildHubSpace()` fija `Ps = (290,265,1920,1320)` y el octógono con `cut=210`:
  `(500,265) (2000,265) (2210,475) (2210,1375) (2000,1585) (500,1585) (290,1375) (290,475)`.
  Mundo `E=2500, k=1850`. `Ls(g)` recorta el suelo a ese polígono; la capa de props
  **no** está recortada, por lo que las fachadas pueden ocupar la franja perimetral.
* Caché de suelo `hubCachedFloorCv` 1920×1320 dibujada en `(290,265)`; centro `(1250,935)`;
  se invalida por `window.__T3B.revision`. Contiene la pasarela norte
  `(180,12,1560,56)` → mundo `(470,277)…(2030,333)` y la plataforma DJ
  `(680,60,560,195)` → mundo `(970,325)…(1530,520)`.
* `Lc()` delega en `prop.hubDraw(g,prop)` cuando `prop.hubCustom` (mecanismo T01–T05).
  `addHubCustomProp` define `sortY = cfg.sortY ?? y + …`, `solid:false`.
* El pintor de muros con `rotate(atan2(dy,dx))`, `_b()`, `wall_stained_glass_arch`,
  `wall_ceiling_neon_fixture` y `club_wall_sconce_side` pertenece al **generador de salas
  de campaña** (`Zb`/`$b`/`Ob`). En el HUB solo queda el suelo cacheado y un ribete de
  `Rs.edges`: **no existen paredes verticales en el HUB**. T06 cubre esa carencia sin
  tocar ese sistema.

## 3. Caras y planos visibles desde la cámara

| Plano | Cara visible | Cara oculta | Tratamiento T06 |
|---|---|---|---|
| Muro norte (`y≈180…330`, `x=500…2000`) | **SUR (+Y)**, hacia el interior; corona superior | cara norte, trasera | fachada frontal + banda de coronación iluminada arriba |
| Muro oeste (`x≈290`, `y=780…1160`) | **ESTE (+X)** | cara oeste | fachada estrecha con capa superior hacia −X, luz rasante |
| Muro este (`x≈2210`) | **OESTE (−X)** | cara este | simétrico, capa superior hacia +X |
| Machones de esquina | inglete a 45° hacia el interior | arista exterior | unión diagonal sobre el paramento norte |
| Viga / casetón de techo | **cara inferior** y canto frontal | cara superior | vigas vistas, focos integrados, sin volumen dinámico |
| Cortinaje | frontal colgada de la cornisa | trasera | pliegues, anclaje superior, sin sombra de suelo |
| Zócalo | cenital | — | plano de suelo, sin altura, asienta la fachada |

No se dibuja ninguna pared "frontal sobre el suelo" en el centro de la sala: todas las
fachadas se anclan a la línea de base del perímetro real, con `sortY` coherente para que
el jugador y los props cercanos las ocluyan correctamente.

## 4. Prueba de composición en tres zonas (antes de producir)

`ART_TOOLS/qa/hub_tanda_06_composition.py` proyecta las **14 cajas mundo** (10
recursos + 4 repeticiones de los paramentos laterales `T06-06/07` en `y=780/1540`)
sobre capturas reales usando la matriz medida. Salidas `composicion_norte.jpg`,
`composicion_pared_oeste.jpg`, `composicion_pared_este.jpg`,
`plano_caras_visibles.png`, `composicion.json`.

| Zona | Cámara medida | Qué se comprueba |
|---|---|---|
| A · NORTE / DJ | `(1250,655)` | tres tramos de muro norte, continuidad de cornisa, viga, zócalo, cara SUR |
| B · OESTE / ARSENAL | `(883,975)` | paramento oeste, cara ESTE, escala y anclaje al límite `x=290` |
| C · ESTE / BARRA VIP | `(1617,975)` | paramento este, cara OESTE, simetría de coronación y luz |

Zonas de apoyo para cobertura: `vip_oeste (883,655)`, `vip_este (1617,655)`,
`centro (1250,945)`, `dj (1273,655)`, `bar (1617,923)`, `arcade (883,1195)` y
`sellos (1617,1195)` (estas cuatro últimas medidas por el arnés A/B de QA).
`composicion.json` incluye, para cada una de las 14 cajas, su `worldBox`,
`screenBox` y las zonas donde la caja completa cae dentro del viewport.
**Cobertura 14/14 con al menos una zona completa** (ver `coverage`).

Veredicto de la fase: **`APROBADA`**. No se modifica cámara, proyección, geometría
general, colisiones, puertas ni estaciones. Se autoriza pasar a producción de los 10
recursos con las orientaciones documentadas en `composicion.json`.
