# TANDA 08 · EFECTOS — informe de cierre

Fecha: 2026-11-15 · Rama `arena/e088e9d7-deadbeat-disconew` (PR #22) · Fuera del pack 02–07 (primera tanda del remanente de clase B) ·
Lote: [`batches/T08_EFECTOS.json`](batches/T08_EFECTOS.json) (13 assets, 2 turnos) · Evidencia: `evidence/T08_EFECTOS/` ·
Herramientas: `tools/art_master/batch.py` (**`matte luma`**, nuevo), **`probe_projectiles.js`** (nueva, ruta real de arranque).

**Resultado: 13/13 efectos producidos como pintura de luz (no pixel art), registrados (caché `20261115.28`) y verificados en la build
real a 720p: 10 proyectiles en vuelo (derecha, izquierda y arriba), impactos y la explosión de la bomba.** La tanda destapó y corrigió
un fallo de integración heredado (todas las balas se dibujaban con el mismo sprite) y dio consumidor real a la explosión. Sin cambios de
mecánica: radios, hitboxes, daño, cadencia y temporización intactos.

## 1. Inventario y auditoría (lo que había)

`assets/effects/` tenía 20 PNG de clase B (pixel art de la línea anterior, varios con fondo moteado horneado). Consumidores reales:

| id | Consumidor | Estado previo |
|---|---|---|
| `proj_slug/heavy/pellet/cryo/plasma/ricochet/lane/flame/rail/homing` | `DD_WORLD.drawProjectiles(g, wa, ja)` (sustituye al trazado original `Tt()` del motor) | B; **pero sólo se veían `proj_slug` y `proj_ricochet`** (ver §3.1) |
| `vfx_impact_spark`, `vfx_impact_plasma` | `DD_WORLD.drawImpactParticles(g, Sa)` | B; alternos por índice, color fijo |
| `vfx_explosion_inferno` | rama «`rad > 56`» de `drawImpactParticles` | **código muerto**: las partículas tienen `r` 2–4 → `rad` = 14 siempre |
| `vfx_muzzle_gold/plasma`, `vfx_shockwave_magenta`, `vfx_fire_plume`, `vfx_soul_flame`, `vfx_lightning_purple`, `vfx_smoke_cloud` | **ninguno** | B; quedan fuera (no se produce lo que no se ve) |

Las balas enemigas (`Ia`) y los patrones de jefe los pinta el motor con su propio trazado: fuera del alcance.

## 2. Producido (13 PNG RGBA)

Contrato: crudo generado sobre **negro puro** (#000) como «light effect, smooth glow», cabeza a la DERECHA y estela a la IZQUIERDA; recorte
con **`matte luma`** (`alpha = max(R,G,B)` menos un suelo de 0,035; color normalizado), de modo que la composición aditiva del juego
(`lighter`) reproduce el crudo exactamente. Los 13 crudos salieron limpios a la primera (borde negro ≤ 3/255); maestros en
`ART_ASSETS/rebuild_masters/T08_EFECTOS/`.

| id | Lienzo | Diseño |
|---|---|---|
| `proj_slug` | 160×96 | aguja trazadora amarillo-blanca, estela ámbar corta |
| `proj_heavy` | 192×96 | bala gorda dorada, punta blanca, estela gruesa con ondas de calor |
| `proj_pellet` | 128×96 | brasa naranja-roja redonda con chispas detrás |
| `proj_cryo` | 160×96 | esquirla de hielo facetada cian, cristales y escarcha detrás |
| `proj_plasma` | 224×96 | orbe magenta-violeta con cola sinuosa y filamentos |
| `proj_ricochet` | 192×96 | dardo esmeralda con estela en zigzag |
| `proj_lane` | 224×96 | haz cian recto y uniforme con núcleo blanco |
| `proj_flame` | 192×160 | lengua de fuego naranja-amarilla, sin humo |
| `proj_rail` | 256×96 | haz blanco-azul finísimo con arcos eléctricos |
| `proj_homing` | 192×96 | orbe violeta con doble hélice |
| `vfx_impact_spark` | 160² | estallido radial de chispas doradas con punto blanco |
| `vfx_impact_plasma` | 160² | bocanada magenta-violeta con núcleo blanco y filamentos |
| `vfx_explosion_inferno` | 320² | bola de fuego naranja-amarilla con anillo de choque, sin humo ni escombros |

Lámina antes/después: `evidence/T08_EFECTOS/00_proyectiles_antes_despues.jpg`.

## 3. Integración (`src/dd_world_renderer.js`, `tools/build_active_html.py`)

### 3.1 Proyectiles: selección por el tipo real de la bala

El motor etiqueta cada bala con `projectile50` = `ja[arma].projectile` ∈ {`slug heavy pellet cryo plasma ricochet lane flame rail homing
melee`}; las balas **no llevan** banderas `cryo/flame/rail/homing/plasma/heavy/pellet` (campos reales: `x y prevX71 prevY71 rigSeed rigH vx
vy r baseR50 color dmg life maxLife pierceLeft bounces weaponId weaponSerial projectile50 phase50 …`). `drawProjectiles` elegía por esas
banderas inexistentes, así que todo salía `proj_slug` (y `proj_ricochet` si `bounces > 0`). Ahora:

- `PROJECTILE_ASSET[b.projectile50]` (las banderas quedan como reserva para balas sin tipo).
- Longitud de la estela por tipo (`PROJECTILE_LEN`: slug 46 · heavy 62 · pellet 32 · cryo 46 · plasma 44 · ricochet 54 · lane 58 · flame 34 ·
  rail 112 · homing 50 px de mundo), heredada del trazado original `Tt()` (m1911 43, magnum 58, spas12 20, cryo 42, plasma 32, ricochet 55,
  trident 52, flamer 16, railgun 100, raygun 46), × `clamp(r/5, 0,85, 1,5)` para balas mejoradas.
- La **cabeza del sprite cae sobre la posición lógica** de la bala (`PROJECTILE_HEAD` = 6 % por delante) y la estela queda detrás, como la
  línea `prev → actual` original; antes el sprite se centraba al 65 %, adelantando la cabeza respecto a la hitbox.
- Desvanecimiento `alfa = 1 − 0,45·(vida/vidaMáx)` como el original; rotación por velocidad; `lighter`; elevación `rigH` (altura del cañón)
  sin cambios.

### 3.2 Impactos: partículas teñidas con su color

Las partículas `Sa` las emite una sola función del motor, `vs(x, y, color, n)`, para **todo**: impactos de bala (cian hielo `#a5f3fc`,
violeta plasma `#c084fc`, naranja fuego `#fb923c`), muertes (color del enemigo), bomba (`#f97316`, 70–90), subida de nivel, rotura de atrezo
(gris `#64748b`/`#94a3b8`)… El renderizador pintaba chispas naranja y magenta fijas. Ahora cada partícula tiñe el sprite con su color
(mezcla `color`, que conserva la luminancia —núcleo blanco— y toma el tono; luego `destination-in`; caché por `id|color`, ≤ 128 entradas),
radio `max(10, r·4,2)` que encoge al apagarse, alfa `0,9·t`. Spark y plasma siguen alternándose por índice. La rama muerta de la explosión
se retira.

### 3.3 Explosión: consumidor real para la bomba

`tp()` (tecla `Q`) sólo sacude la cámara, lanza el fogonazo, pone cámara lenta (`he = 0,25` durante `fe = 0,5 s`) y encola partículas. Bloque
**`1g`** de `tools/build_active_html.py`: una llamada `DD_WORLD.spawnExplosion(ye.x, ye.y − 22, 1, Z)` justo tras descontar la carga;
`drawExplosions(g, Z)` tras las partículas. La animación usa el **reloj de juego `Z`** (no el de pared): crece de 120 a 320 px de mundo y se
apaga en 0,56 s de juego, así respeta la cámara lenta de la bomba igual que las partículas (≈ 0,9 s de pared). Rotación aleatoria por
explosión, `lighter`; sin asset no dibuja nada. Accesor de QA `DD_WORLD.__explosions(t)`.

### 3.4 Puente de QA

`__DD_BRIDGE.getActors()` expone ahora `bullets[].projectile` y `weaponId` e `impacts` (nº de partículas `Sa`). Sólo lectura.

## 4. QA en la build real (`probe_projectiles.js`, 1280×720)

Ruta real de arranque (armazón → Espacio → intro → menú → NUEVA PARTIDA → Refugio → `exitToRun`), sala despejada (`exploreNoEnemies`,
`holdSpawns`, `killAll`), un arma representativa por tipo (`m1911 magnum spas12 cryo plasma ricochet trident flamer railgun raygun`) equipada
con `buyOrEquipWeapon(id, true)` y disparada con el motor (`testStep({fire:true, aim})`). La telemetría de cada captura confirma que
**todas las balas vivas llevan el tipo esperado** (`types: {<tipo>: n}`) y 0 errores de página.

| Evidencia | Qué muestra |
|---|---|
| `01_vuelo_derecha_720.jpg` | 10 tipos en vuelo hacia la derecha: sprite distinto por tipo, cabeza en la posición lógica |
| `02_vuelo_izquierda_720.jpg` | rotación 180° por velocidad |
| `03_vuelo_arriba_720.jpg` | rotación −90° |
| `04_impactos_720.jpg` | impactos contra atrezo/pared (chispas `Sa` teñidas con el color de cada partícula) |
| `05_bomba_720.jpg` | explosión de la bomba en 4 instantes (fotogramas 1, 6, 14 y 26 de juego) sobre las partículas naranjas |
| `t08_probe_projectiles_720.json` | telemetría completa (balas por tipo, partículas, explosiones vivas y su edad) |

**Nota de método (headless):** en el sandbox un ida y vuelta `page.evaluate` tarda ~0,6 s y la explosión dura 0,56 s, así que la primera
versión de la sonda (una captura por llamada tras `keyboard.down("KeyQ")`) nunca la veía aunque `spawnExplosion` sí se ejecutaba
(verificado con `__explosions()`: edad 34 ms justo tras la pulsación, lista vacía en la llamada siguiente). La secuencia de la bomba se hace
ahora en **una sola llamada** (pulsación sintética de `Q` → `testStep` → captura ×4), para que el bucle rAF de la página no consuma la
animación entre capturas. Esto también motivó el cambio al reloj de juego `Z` (§3.3), que es además lo correcto para la cámara lenta.

## 5. Observaciones y decisiones pendientes

- A 720p el motor juega con zoom 0,72–0,83 en la incursión: las balas se ven del mismo tamaño que las trazas originales (correcto respecto
  al diseño del motor), pero pequeñas. Si se prefieren proyectiles más grandes, es un número por tipo (`PROJECTILE_LEN`); no afecta a hitboxes.
- Las balas hacia la izquierda se dibujan rotadas 180° (el diseño asimétrico, p. ej. los brillos superiores de `proj_heavy`, queda boca
  abajo); imperceptible al tamaño real. Si se quisiera, bastaría voltear verticalmente cuando `|ang| > 90°`.
- Siete `vfx_*` siguen en clase B sin consumidor (ver §1). Darles uso (fogonazo de boca, onda expansiva, humo) sería trabajo de motor, no de
  arte; se dejan documentados.
- Hallazgos heredados de T07 §5 siguen pendientes de decisión (barra de escudo en %, tarjeta `ESP` de la bomba, ids sin consumidor).

## 6. Contrato de los efectos

Ver «Contrato de los efectos (T08)» en [`tools/art_master/README.md`](../../tools/art_master/README.md).
