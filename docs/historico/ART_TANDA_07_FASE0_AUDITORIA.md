# TANDA 07 · FASE 0 — AUDITORÍA DEL JUEGO REAL

**Título de la tanda:** *El umbral del infierno*
**Estado:** FASE 0 cerrada · **sin errores críticos** · FASE 1 (composición geográfica) entregada en `ART_TANDA_07_FASE1_GEOGRAFIA.md`
**Fecha:** 2026-11-04 · **Rama:** `arena/109fe45c-deadbeat-disconew` · **HEAD:** `28ee7db0276ba6197b9553346fc131b36b83f0c5`
**Alcance estricto de esta entrega:** SOLO LECTURA sobre el juego real + documentación + arneses de QA. **No se han generado assets, no se ha modificado `DEADBEAT_DISCO.ART.html`, `ART_PACK/art_pack.js`, cámara, colisiones, audio, NPC, estaciones ni transiciones.** No existe `ART_ASSETS/hub/tanda_07/`.

---

## 0. Preflight (verificado antes de tocar nada)

| Elemento | Resultado |
|---|---|
| Rama activa | `arena/109fe45c-deadbeat-disconew` |
| HEAD / `origin/arena/...` | `28ee7db0276ba6197b9553346fc131b36b83f0c5` |
| Worktree al inicio | limpio |
| PR #1 | `OPEN`, `mergedAt=null`, base `arte-y-recursos`, `headRefOid=28ee7db…`, sin checks |
| `main` / `origin/main` | `d75e021fb13418bf49d5853c1a9583e7d11b90f2` (intacta) |
| HTML activo | `DEADBEAT_DISCO.ART.html` (13.389.425 B / 19.946 líneas). `v9_t3_fase1b_cache_probe.html` es copia/probe, **no activo** |
| TANDAS 01–06 | presentes: assets 21/20/21/22/0/21; evidencias 47/74/83/119/109; informes y matrices localizados; T04 es integración de render (0 assets por diseño) |
| Preview | `http://127.0.0.1:8123/` → HTTP 200, servidor de la sesión activo |
| Tooling | `/tmp/qatools/node_modules/playwright-core`, Chromium 131 en `/tmp/chromium`, `/tmp/chromelibs/lib` |

---

## 1. Evidencias generadas (31 ficheros, ~12 MB)

Directorio: `ART_EVIDENCE/hub/tanda_07/`

| Tipo | Ficheros | Contenido |
|---|---|---|
| Runtime / APIs | `audit_runtime.json`, `audit_deep.json`, `audit_systems.json`, `audit_geo.json`, `audit_input.json`, `audit_move.json` | globals, 27 canvas, 162 V5, 11 estaciones, 6 zonas, cámara, CINE, música, floorDrop, gamepad sintético, movimiento, FPS |
| Capturas base | `audit_00_portada.png`, `audit_01_hub_centro.png`, `audit_02_grieta_sur.png`, `audit_03_selector_descenso.png` | portada, HUB centro, grieta sur, modal de selección de círculo |
| Intro real (sin skip) | `audit_intro_1_1_1_portada.jpg` … `audit_intro_5_2_3_tarjeta.jpg` (5) | planos `1.1_portada`, `1.2_pista`, `1.3_barra`, `2.2_llamada`, `2.3_tarjeta` |
| Descenso real | `audit_descenso_1.jpg` … `audit_descenso_6.jpg` (6) | `approach → descent (stairP .20/.63) → skyfall/arrival → control recuperado` |
| Geografía / cámara | `audit_geo_0_1250_975.jpg` … `audit_geo_7_1800_1500.jpg` (8) | 8 posiciones de cámara, incluido el límite sur |
| Matrices legibles | `fase0_matriz.json`, `fase1_geografia.json` | clasificación y cotas consumibles por fases posteriores |

Arneses reproducibles (copiados de `/tmp/t7`, **no son código del juego**): `ART_TOOLS/qa/hub_tanda_07_audit_{runtime,deep,systems,geo,input,move}.js` — los 6 pasan `node --check`. Se ejecutan contra el preview `:8123` con Chromium 131 y `LD_LIBRARY_PATH=/tmp/chromelibs/lib`.

---

## 2. Mapa de sistemas real (descubierto, no presupuesto)

| Sistema / API | Ubicación | Responsabilidad real | Estado medido |
|---|---|---|---|
| `window.DMO` | HTML L1404+ | fachada: `camera`, `gameState`, `playerAnim`, `gamepad`, `layout`, `semi2d`, `floorDrop`, `descentFusion`, `hub`, `location`, `perf`, `diag`, `debug`, `menu54`, `assets`, `djDirector` | presente |
| `DMO_HUB` | L12059 | `state/saveState/reloadSave/stations/canEnterCircle/missingRequirement/canReturnToHubNow/openStation/closeModal/startCampaignFromHub/returnToHubFromMilestone/audit` | `inHub:true`, `location:"HUB"`, `mode:"EXPLORATION"`, `transitionLock:false`, `modalOpen:false` |
| `DMO_CINE` | L10916–11990 | motor ligero de cinemáticas: `play/skip/abort/scenes/state/shotList`; por plano `enter/update/until/camera/pose/world/draw` | 1 escena `intro_turno_001`, 12 planos, 44,6 s nominales, `skipHold=0.6 s` |
| `DMO_STORY` | — | `npcs/flags/introSeen/conversation/stations/advance` | `introSeen=false`, NPCs `virgilio, caronte, mudo, cliente000, arcade`, `flags={}` |
| `DMO_MUSIC` | L12997+ | **director único**: `state/audit/keepAlive/cineBegin/cineEnd/cineFilter/cineGain/cineMotif/cineSting/onStairStep/onStairDescentStart/onFreefallStart/onGirderPass` | `HUB/hub_afterparty/114 BPM`, `ctx:running`, `sequencers:1`, `wired:true`, 0 errores |
| `floorDropAnim` / `DMO_FLOOR_ANIM` | L5112–5702 | `beginPlunge/beginSkyfall/beginStairArrival/update/drawFloorWorldFX/drawAerialWorldFX/drawScreenFX/drawLiftShaft`, timelines `cinematic/intense/arcade/reduced`, 10 perfiles | `idle`, `toFloor 1`, `totalSteps 8`, `DA 2.22`, `OA 0.58` |
| `DMO.descentFusion` | — | catálogo de círculos, arquitectura, reglas | `audit().ok=true`: 9 círculos + núcleo, 100 salas, 17 perfiles, 91 geometrías únicas, 0 dependencias de red |
| `DMO_ATMOS` | L19853+ | bloom / vignette / grain / grade sobre canvas `#game` | `ready:true`, `enabled:true`, `autoDegradeFps=26`, `overlayDiv=3` |
| `DMO_SEMI2D` | — | escala de profundidad por Y | `WORLD_TOP=455`, `WORLD_BOTTOM=1415`, `scale(300)=0.804`, `scale(1500)=1.174`; **los props `hubCustom` usan escala uniforme 1.0** (medido en T06) |
| `DMO_LAYOUT` | — | `report/props/metrics`: 9 islas, `freeRatio 0.961`, `venueProps 15→41`, `props()=56` | `valid:true`, 0 violaciones |
| `DMO_ART_PACK` | `ART_PACK/art_pack.js` | `HUB1..HUB6_ASSETS`, `loadHub6()` tras `loadHub5()`, APIs `hubN*`, `+hub-tanda06` | `status:"applied"`, **162 claves V5** |
| `DMO.gamepad` | — | `state/telemetry`, deadzones `.18/.22`, trigger `.35`, menú | `supported:true`, `active` conmuta teclado↔mando |
| `DMO_DUNGEON` | — | mazmorra de campaña (fuera del HUB) | `audit().ok=true`, 12 salas, 0 errores, `bossDistance=5` medido ya dentro del HUB; **no se modifica en T07** |

**No hay** canvas nuevo, motor nuevo ni cámara nueva en T01–06: todo se integró por hooks y props del renderer existente.

---

## 3. Mapa de cámara, movimiento y geometría (MEDIDO en Chromium)

| Magnitud | Valor |
|---|---|
| Transformación | `translate(640,450) → scale(0,9375) → translate(-B,-L)`; `a=d=0,9375`, `b=c=0` (sin rotación ni cizalla) |
| Zoom | `0,9375`; `viewW=1365`, `viewH=960`; `lead={x:0,y:10}` |
| Mundo | `2500 × 1850` |
| Octógono `THE LAST AFTERPARTY` | `Ps=(290,265,1920,1320)`, `cut=210`; vértices `(500,265) (2000,265) (2210,475) (2210,1375) (2000,1585) (500,1585) (290,1375) (290,475)` |
| Cámara al arrancar | `(1250, 975)` → mundo visible `y 495…1455` |
| Límites REALES con teclado | `x ∈ [883, 1617]`, `y ∈ [655, 1195]` (`audit_move.json`: `s` → 1195, `w` → 658→655, `a` → x 883, `d` → x 1245) |
| Límite sur con `debug.teleport` forzado | `y=1210` (artefacto de QA; `officialUntainted:false`) |
| **Banda sur visible en juego normal** | con `y=1195`, mundo visible `y 715…1675` → **solo `y 1585…1675` (90 u ≈ 84 px de pantalla) queda por debajo del borde sur del octógono** |
| Suelo cacheado | `hubCachedFloorCv` 1920×1320 dibujado en `(290,265)` → cubre `y 265…1585`; **todo `y>1585` queda FUERA de la caché** |
| Recorte | `Ls(g); g.clip()` dentro de `drawHubFloorLayer()`, con `g.save()/g.restore()` equilibrados → el clip **no se filtra** a hooks posteriores |
| `semi2d` en props HUB | `depthScaleForHubCustom = 1.0` (uniforme) |
| Colisiones | `buildPolygonEdgesAndBoundary()` crea 8 aristas `solid:true, tall:true`; el jugador **no puede caminar más allá de `y=1585`** |
| Movimiento | `pa` (teclado WASD) + `Mu`/`Qr` (mando). Verificado: `s` desplaza cámara 975→1195, `w` 1195→655, `a`/`d` mueven X |

**Consecuencia de diseño crítica:** el abismo no puede construirse como una gran imagen estática debajo del HUB, porque la cámara real solo deja ver ~84 px. La profundidad debe repartirse entre (a) un **labio/borde legible dentro del suelo transitable** (`y 1470…1585`), (b) **estratos en capas** en la banda de 84 px y (c) la **transición de descenso** (`floorDropAnim`), que sí sustituye el mundo y permite parallax vertical real.

---

## 4. Mapa de render

| Capa / hook | Función real | Uso en T01–06 |
|---|---|---|
| `Tf(dt)` | update por frame, encadenado no destructivamente (`prevTfV32 → V34 → V35 → V37 → music`) | `pAnim.update`, `djDirector.tick`, `floorDropAnim.update`, `cineTick`, `updateHubSystems` |
| `Qf()` | cámara / pose previa al render | `cinePreRender()` fija `B`, `L`, `N.zoom` por plano |
| `Wf()` | capa de SUELO del mundo | `drawHubFloorLayer()` (caché + panos T04 + medallón + props), `floorDropAnim.drawFloorWorldFX()` |
| `Ph()` | capa AÉREA del mundo | `drawHubAerialLayer()`, `floorDropAnim.drawAerialWorldFX()` |
| `zf()` | capa de PANTALLA / HUD | `drawHubScreenLayer()`, `syncHubHudAndTouchInteract()`, `floorDropAnim.drawScreenFX()` |
| `Lc` / `sortY` | renderer de props con Y-sort ascendente | `hubDecor → addHubCustomProp`, `solid:false`, `tall:false`, `sortY=dc.y` |
| `drawAtlasSpriteOrFallback` | atlas `d.rects` + `__DDM_GET_V5` | frames `*_step0..3` y V5 |
| Canvas | `#game` 1280×900, `#minimap` 176×126; 27 canvas en DOM | sin canvas alternativo |
| rAF | `requestAnimationFrame(frame)` del motor + el de `DMO_ATMOS` (post-proceso) | **no crear un tercer bucle** |

**Flags A/B existentes:** `window.__DDM_HUB_T04`, `__DDM_HUB_T05`, `__DDM_HUB_T06` → patrón a replicar con `__DDM_HUB_T07`.

---

## 5. Mapa de animación

| Mecanismo | Detalle real |
|---|---|
| Reloj | `Z` (segundos globales del HUB) y `performance.now()` para pulsos de decoración; `hub.ambientFrozenAt` congela durante CINE |
| `DMO.playerAnim` | state machine: `transitionTo/update/step/renderNow/getStateSnapshot`; `stridePhase%4`, `walkFrame`, `upperPose/lowerPose`, `switchT/interactT/reloadT/chargeT`, `bobY`, `turnLean`. Medido `idle↔aim` con transiciones a `t=0.1/0.45/3.2/7.8` |
| Frames de NPC | `dancer_step0..3` (atlas) con fallback al sprite base; `stepIdx = Math.floor(t*rate*2 + phase) & 3` |
| Bailarines de la intro | `INTRO_FIGURANTS` (16) + `drawFigurant(ctx,f,t,frozenT,bpm)`: `rate=bpm/60` (`INTRO_PARTY_BPM=126`), `bounce=abs(sin(...))*2.5`, `lean=sin(...)*0.055`, `drift` para `cross`, V5 `hub_clubber_dancer_a/b` a 76×98, `hub_bouncer_npc` para `security` |
| Bailarines del HUB | `hub.ambientDancers`: 4 entradas con `phase` individual `(0, 1.7, 3.1, 2.4)`, `flip`, `stepIdx=Math.floor(zz*5.6+phase)&3`, `bounce` ±2,5 px, sombra elíptica y V5 `hub_clubber_dancer_a/b` a `ch=96` |
| Decoración animada | `dc.pulse` → `globalAlpha *= 0.82+0.18*sin(performance.now()/520 + pulse)`; `Wb()` halos; `introDressClub()` con `beatPh=(t*BPM/60)%1` y 26 partículas |
| Accesibilidad | `Yc.reduced` congela step, bounce, lean, drift y fija pulsos a 0,5–0,7 |
| CSS | único `@keyframes` relevante: `hubConvBlink` (cursor de conversación). **La animación de NPC es Canvas, no CSS** |

**Conclusión:** el mecanismo a reutilizar es *frames por `Z`/beat + fase individual + fallback*, con `Yc.reduced`. No hace falta un sistema de animación nuevo. **No se declara ninguna animación «verificada» por haber cargado sprites**: en Fase 0 solo se ha verificado el mecanismo y su estado; la comprobación de frames efectivamente reproducidos queda para Fase 3/5.

---

## 6. Mapa NPC y estaciones

`DMO_HUB.stations()` → **11 estaciones / 6 zonas** (`audit_geo.json`):

| id | zona | x, y | r | etiqueta |
|---|---|---|---|---|
| `lift` | C | 1250, 1365 | 142 | GRIETA DE DESCENSO · ELEGIR CÍRCULO DE DESCENSO |
| `dj` | B | 1250, 525 | 132 | CABINA · VIRGILIO |
| `arsenal` | D | 705, 855 | 136 | ARSENAL DE CARONTE |
| `bar` | E | 1790, 855 | 136 | BARRA «EL ÚLTIMO TRAGO» |
| `arcade` | F | 655, 1135 | 124 | RINCÓN ARCADE |
| `seals` | F | 1845, 1135 | 124 | ESPEJO DE LOS SELLOS |
| `dancer_0..3` | A | 1030/1470/1015/1965, 785/785/1085/918 | 64 | CLIENTE DEL REFUGIO · CRUZAR DOS PALABRAS |
| `cliente000` | A | 785, 600 | 110 | EL CLIENTE 000 |

- `hub.ambientDancers`: `hub_ambient_dancer_nw (1030,785,phase 0)`, `_ne (1470,785,1.7,flip)`, `_sw (1015,1085,3.1)`, `hub_ambient_clubber_bar (1965,918,2.4,flip)`. **Permanecen en su zona**; no son ambulantes.
- `narr_cliente000` (L10795): prop `solid:false, tall:true, sortY:578` con `breathe=sin(Z*1.6)*1.5`, V5 `hub_cliente000_npc` (96×232) y `wall_neon_club_crest`; variante con tarjeta si `st.has("traidor")`.
- V5 de persona con tamaños naturales: `hub_cliente000_npc 96×232`, `hub_clubber_dancer_a 109×232`, `_b 131×232`, `hub_bartender_npc 95×232`, `hub_bouncer_npc 101×232`.
- **Pivote real:** todos se dibujan con `y` = línea de pies (`drawImage(im, x-dw/2, y-dh-bounce, dw, dh)`), sombra elíptica en `(x,y)`, y `sortY=y` (o `y+13` en los pilones de `lift`). No hay hitboxes de NPC: `solid:false`.
- `hub_bartender_npc` / `hub_bouncer_npc` hoy **solo se usan en la intro** (`drawFigurant`), no en el HUB jugable.
- **Pendiente para Fase 3:** inventario completo de frames/direcciones/pivote/hitbox/escala por NPC y verificación de reproducción real (variación de frame entre capturas), reacción al jugador y desincronización. No se ha hecho todavía.

---

## 7. Mapa de transiciones, estados y accesos

**Llegada (primera partida).** `NARR_onRunStart()` → `cinePlay("intro_turno_001")` solo si `!introSeen` y sin progreso previo. 12 planos: `1.1_portada 2.8`, `1.2_pista 4.6`, `1.3_barra 3.4`, `2.1_averia 4.8`, `2.2_llamada 3.0`, `2.3_tarjeta 5.4`, `2.4_firma 2.4`, `3.1_reaccion 3.2`, `3.2_grietas 3.2`, `3.3_acerca 3.6`, `4_caida until`, `5_llegada 2.4`. `cineTick` anula `pa/Mu/Qr` y `hub.transitionLock=true`; `CINE_SKIP_HOLD=0.6 s` con Escape/mando. `4_caida` usa `floorDropAnim.hubIntroMode`, `beginPlunge(INTRO_LIFT_DOOR,0,0)` → `beginSkyfall` → spawn `ic(1250,965)`. `5_llegada` reduce zoom de `1.7·base` a `base` y muestra «COTA -01». Medido en sesión real: `plays=1, skips=1, completes=0, lastReason="skip"`, `intro_party@126 → hub_afterparty@114`.

**Llegadas repetidas.** `returnToHubFromMilestone()` → `commitMilestoneReturnToHub()` → `floorDropAnim.beginStairArrival(..., {direction:"up", toHub:true, kind:"milestone-to-hub", endX:1250, endY:965})`. Música `forceKey(HUB_KEY,114)`. **No se repite la cinemática larga**; la intro ya está marcada `introSeen`.

**Descenso.** Modal de `lift` → `startCampaignFromHub(0)` → `beginPlunge(hub.liftDoorDesc, -1, 0, {kind:"hub-to-campaign", endX:1250, endY:925})` → `commitHubToCampaignLoad()` → `beginStairArrival()` → `CAMPAIGN_ROOM`. `hub.location` pasa `HUB → TRANSITION → CAMPAIGN_ROOM`.

**Descenso REAL ejecutado y medido en esta Fase 0** (`audit_systems.json` + `audit_descenso_*.jpg`, `startCampaignFromHub(0)=true`):

| Muestra | `floorDropAnim` | `hub.location` | `transitionLock` | `DMO_MUSIC` |
|---|---|---|---|---|
| 1 | `plunge/approach` | `TRANSITION` | true | `DESCENT` |
| 2 | `plunge/descent`, `stairP .20` | `TRANSITION` | true | `DESCENT` |
| 3 | `plunge/descent`, `stairP .63`, `keySwitched:true` | `TRANSITION` | true | `DESCENT` |
| 4 | `skyfall/arrival`, `revealed:true` | `CAMPAIGN_ROOM` | true | `DESCENT` |
| 5–6 | `idle/idle`, `active:false` | `CAMPAIGN_ROOM` | **false** | `EXPLORATION` |

→ **El descenso completo funciona, llega al Círculo I · LIMBO (118 BPM) y devuelve el control sin pantalla negra**. `audit_descenso_4.jpg` muestra la sala inferior; `audit_descenso_3.jpg` muestra la grieta y el hueco de la escalera antes del salto. No hay aún continuidad *geográfica* HUB→abismo: el mundo se sustituye por la sala de campaña.

**Estados.** `MENU → HUB → DESCENT → EXPLORATION` (`DMO_MUSIC.resolveState`); `DMO_HUB`: `inHub`, `location` (`HUB/TRANSITION/CAMPAIGN_ROOM`), `mode` (`EXPLORATION/MENU`), `transitionLock`, `modalOpen`, `invasion`, `unlockedCircles:[0]`.

**Accesos.** 9 círculos + núcleo desde el modal (`canEnterCircle(0)=true`, II–IX y Núcleo bloqueados); `canReturnToHubNow()` con `extractionBeacon`; tecla `[E]` en estaciones; mando Xbox con menú `gamepad.state().menu`.

---

## 8. Mapa de audio (sin sistema paralelo)

- **Un único grafo/sequencer:** `DMO_MUSIC` (`sequencers:1`, `singleSequencer:true`, `wired:true`, `graphFallback:false`, `voices.load 0.03→0.08`, `errors:[]`, `ctx:"running"`).
- Perfiles: `hub_afterparty 114`, `hub_invasion`, `intro_party 126`, 9 círculos, `nucleo`, `void`, `inferno`. Transiciones por `forceKey/rampFilter/rampTrans/cineGain/cineFilter`, no por capas nuevas.
- Eventos medidos en la intro (`DMO_MUSIC.events()`): `intro_party@126`, `cineBegin`, `sting:esclusa/paper/crack/call/write`, lowpass insertado a `t=0.05`, `hub_afterparty@114` al terminar.
- En el descenso medido: `DESCENT` con `descent.id=1`, `from=hub_afterparty`, `to=0`, `keySwitched:true`, `revealed:true`; vuelta a `EXPLORATION` al aterrizar.
- Hooks disponibles para Fase 4: `onStairStep`, `onStairDescentStart`, `onFreefallStart`, `onGirderPass`, `onFloor`; perfiles por círculo con `rootHz/secondaryCol/sparkCol`.
- `localStorage dmo_muted_v1`; SFX por `di()` / `playFloorDropSfx()` sobre el mismo grafo.
- **Restricción:** no sustituir composiciones, no añadir bucles constantes (viento/ruido profundo) que saturen la mezcla; cualquier presencia sonora del abismo debe ser un evento amortiguado y de baja ganancia dentro de este director.

---

## 9. Separación obligatoria de capas (para Fases 2–5)

| # | Capa | Depende de | No debe mezclarse con |
|---|---|---|---|
| 1 | **Decoración estática geográfica** (labio, estratos, pared rocosa, abertura) | coordenadas mundo, `Wf`, `solid:false` | tiempo, NPC, progresión |
| 2 | **Animación ambiental** (brasas, luz de profundidad, polvo, pulso) | `Z`, `bpm`, `Yc.reduced` | lógica de estaciones, colisiones |
| 3 | **Animación NPC** (bailar, conversar, descansar, recorrido corto, reacción) | frames `_step0..3` + `phase` individual | transiciones, cámara |
| 4 | **Transición de entrada** (exterior infernal → HUB) | `DMO_CINE` / `beginSkyfall` `toHub` | inventario, círculos |
| 5 | **Transición de descenso** (HUB → zona inferior) | `floorDropAnim` + `lift` + `DMO_MUSIC` | modo de juego, guardado |

**Regla transversal:** no mezclar progresión (`unlockedCircles`, guardianes), ubicación (`HUB/TRANSITION/CAMPAIGN_ROOM`) y modo de juego (`EXPLORATION/MENU`).

---

## 10. Diagnóstico técnico (hallazgos)

| # | Hallazgo | Evidencia | Impacto en T07 |
|---|---|---|---|
| D1 | El HUB es un **octógono cerrado y simétrico** con paredes `solid:true` en las 8 aristas; fuera de él se dibuja un suelo oscuro genérico, no un vacío | `audit_geo_4_1250_1580.jpg`, `buildHubSpace()` | El «acantilado» no existe hoy: hay que **construirlo** sin tocar colisiones |
| D2 | La grieta es un **decal localizado** (`hub_abyss_stair_crack` 320×175 → 330 px en `(1250,1436-sh)`) con rayos cian y fallback procedural `hubSpiralCrackFallback` | L7784–7876, `audit_02_grieta_sur.png` | Es «una línea negra sobre el suelo»: falta borde, pared rocosa, abertura y profundidades diferenciadas |
| D3 | La cámara **se satura en `y=1195`**; solo ~84 px de pantalla quedan por debajo de `y=1585` | `audit_move.json`, `audit_geo.json` | La profundidad se percibe por **revelación progresiva** al caminar al sur + capas + transición de descenso; no por un gran fondo estático |
| D4 | `y=975` (centro) **no ve el borde sur**: mundo visible `495…1455` | `audit_geo_0_1250_975.jpg` | Apoya el contraste rector: arriba normalidad, abajo peligro que se descubre al acercarse |
| D5 | T06 ya ocupa la envolvente **norte** (`y 180…330`, `x 500…1955`) y los **paramentos laterales** (`x 277…384` / `2129…2212`, `y 400…1540`) | `ART_EVIDENCE/hub/tanda_06/composicion.json` | La geografía infernal nueva debe ir al **sur (`y>1470`)** para no pisar T01–06; solo se permite continuidad de arista en `y 1540…1675` |
| D6 | El suelo cacheado 1920×1320 termina en `y=1585` y el clip `Ls(g)` se restaura correctamente | L9395, L9530 | Existe un punto de inserción limpio para dibujar el abismo **fuera del clip** con un hook `Wf` encadenado, sin nueva caché |
| D7 | La arquitectura de hooks (`Tf/Qf/Wf/Ph/zf`) es **encadenada y no destructiva** desde v3.2/v3.4/v3.5/v3.7 | L3851, 6787, 10113, 11935 | T07 debe añadir hooks del mismo modo, con flag A/B, y **no** un rAF/canvas/audio paralelo |
| D8 | Existe un mecanismo de animación por frames con fases individuales y `Yc.reduced`, usado por 4 bailarines del HUB y 16 figurantes de intro | L7950–8010, L11253, L11318 | Fase 3 puede dar actividades variadas **reutilizándolo**, sin IA, sin reinicios al cambiar cámara |
| D9 | La llegada actual es una cinemática **larga (44,6 s) pero única y saltable**; las llegadas repetidas ya son una transición corta `toHub` | `audit_intro_*.jpg`, `cineState`, `returnToHubFromMilestone` | Fase 2 debe **acortar/reutilizar**, no crear otra cinemática larga ni bloquear controles |
| D10 | El descenso real **ya funciona de extremo a extremo** y devuelve el control; pero sustituye el mundo por la sala de campaña sin continuidad visual del acantilado | `audit_descenso_*.jpg`, `audit_systems.json` | Fase 4 debe añadir continuidad (partículas/luz/parallax) **sobre `floorDropAnim`**, sin pantalla negra |
| D11 | `DMO_MUSIC` es un único director con eventos de descenso ya cableados; `DMO_ATMOS` degrada automáticamente a `bloomEvery=3` | `audit_input.json`, `DMO_ATMOS.audit()` | Audio y post-proceso se reutilizan; presupuesto de partículas debe ser moderado |
| D12 | Gamepad Xbox (sintético `mapping:standard`) conecta, conmuta `active:"gamepad"`, aplica deadzone (`axes[1]=0.9 → move.y=0.878`) y registra telemetría | `audit_input.json` | Teclado y mando deben seguir funcionando en llegada y descenso; `cineTick` los anula solo mientras dura la escena |

---

## 11. Matriz de verificación FASE 0

`APROBADO / FALLIDO / BLOQUEADO / NO VERIFICADO`. La versión legible por máquina está en `ART_EVIDENCE/hub/tanda_07/fase0_matriz.json`.

| ID | Comprobación | Clasificación | Evidencia |
|---|---|---|---|
| F0-01 | Rama, HEAD, worktree, PR #1 abierto sin merge, `main` intacta | **APROBADO** | preflight / `gh pr view 1` |
| F0-02 | TANDAS 01–06 presentes y no modificadas | **APROBADO** | preflight, `git status` |
| F0-03 | HTML activo identificado; 162 claves V5; 27 canvas; `art_pack.js` aplicado | **APROBADO** | `audit_runtime.json` |
| F0-04 | 0 `pageerror`; 2 `404` externos `/cdn-cgi/challenge-platform/` preexistentes | **APROBADO** | `audit_input.json`, `audit_deep.json` |
| F0-05 | Boot real portada → HUB (`click + Enter + Escape`), 6 zonas / 11 estaciones | **APROBADO** | `audit_runtime.json`, `audit_deep.json` |
| F0-06 | Cámara `.9375`, sin rotación/cizalla, `viewW/H`, Y-sort, escala uniforme en `hubCustom` | **APROBADO** | T06 `camera_audit.json` + `audit_geo.json` |
| F0-07 | Límites de cámara y movimiento con teclado (WASD) | **APROBADO** | `audit_move.json` |
| F0-08 | Geometría del octógono, caché de suelo y clip restaurado | **APROBADO** | L7499, L9395, L9530 |
| F0-09 | Sistemas de grieta, `hubDecor`, `ambientDancers`, `pAnim`, hooks de render | **APROBADO** | inspección L5112/7950/10916/10113 |
| F0-10 | Intro real: 12 planos, skip, eventos musicales, 5 capturas de planos | **APROBADO** | `audit_intro_*.jpg`, `audit_systems.json` |
| F0-11 | Descenso real completo, llegada al Círculo I y control recuperado | **APROBADO** | `audit_systems.json`, `audit_descenso_*.jpg` |
| F0-12 | Audio: único sequencer, estados `HUB/DESCENT/EXPLORATION`, `ctx:running`, 0 errores | **APROBADO** | `audit_input.json`, `audit_systems.json` |
| F0-13 | Mando Xbox (sintético estándar): conexión, deadzone, conmutación, telemetría | **APROBADO** | `audit_input.json` |
| F0-14 | Post-proceso `DMO_ATMOS` y FPS base headless (36 / 36 / 39 tras calentar) | **APROBADO** | `audit_input.json`, `audit_geo.json` |
| F0-15 | Capturas de grieta sur y modal de selección de círculo | **APROBADO** | `audit_02_grieta_sur.png`, `audit_03_selector_descenso.png` |
| F0-16 | **No** se han generado assets ni modificado sistemas | **APROBADO** | `git status --short` (solo `?? ART_EVIDENCE/hub/tanda_07/` y `ART_TOOLS/qa/`) |
| F0-17 | Animaciones NPC **reproducidas** frame a frame, variación y desincronización | **NO VERIFICADO** (Fase 3/5) | solo mecanismo y carga auditatados |
| F0-18 | Reacción al jugador, recorridos y actividades reconocibles | **NO VERIFICADO** (Fase 3/5) | — |
| F0-19 | Llegada breve y repetible (sin intro larga) | **NO VERIFICADO** (Fase 2/5) | intro única + skip observados |
| F0-20 | Continuidad visual HUB → zona inferior con partículas/luces/profundidad | **NO VERIFICADO** (Fase 4/5) | descenso funcional pero sin continuidad geográfica |
| F0-21 | Mando Xbox **físico**, salida de audio audible, vídeo | **BLOQUEADO** | entorno headless sin dispositivo ni captura de audio; vídeo diferido a Fase 5 |
| F0-22 | Regresión formal QA T01–06 reejecutada y rendimiento con assets T07 | **NO VERIFICADO** (Fase 5) | preflight confirma presencia, no reejecución |
| F0-23 | Círculos II–IX / Núcleo y `returnToHubFromMilestone()` completo | **NO VERIFICADO** (Fase 5) | `canEnterCircle(0)` y catálogo auditados |

**Nota de trazabilidad (no es una prueba):** una primera ejecución del arnés no completó el arranque (se quedó en `MENU`) y reportó `DMO_DUNGEON.audit().ok=false`. Se repitió con el boot completo `click + Enter + Escape`; el `audit_systems.json` definitivo da `ok=true`, 12 salas y 0 errores. Las 5 capturas `*_x.jpg` de esa ejecución fallida se eliminaron del directorio de evidencias.

**FALLIDOS: 0.** Los `NO VERIFICADO` son objetivos de validación de fases posteriores, no defectos de la arquitectura. **No hay errores críticos que impidan pasar a la Fase 1.**

**Fuera de alcance (heredado, no se reabre):** el gate de rendimiento pendiente de TANDA 02 y los 8 `BLOQUEADO` históricos de TANDA 03. T07 no los modifica ni los reclasifica.

---

## 12. Dependencias y restricciones de integración (heredadas del usuario)

1. No reescribir el motor, no sustituir sistemas funcionales, no crear sistemas paralelos, **no modificar la cámara global** ni usarla para compensar assets.
2. Respetar orientación (caras SUR/ESTE/OESTE visibles), planos, escala uniforme 1.0 en `hubCustom`, Y-sort, oclusión y relación suelo/paredes.
3. `solid:false` / `tall:false` en toda decoración nueva; `sortY` coherente con la línea de pies; sin colisiones involuntarias.
4. No mezclar progresión, ubicación y modo de juego; no duplicar escenas ni recargas; no bloquear controles; mantener teclado y mando Xbox.
5. No modificar sin autorización: combate, armas, sinergias, enemigos, jefes, Director, progresión, economía, guardado, inventario, estaciones, balance, generación de niveles, cámara global, diálogos/misiones, personajes ni diseños aprobados.
6. Audio: sin composiciones nuevas en paralelo ni efectos constantes que saturen.
7. Nuevos sprites **solo si faltan animaciones**: estilo ilustrado, pivote de pies, transparencia limpia, sin pixel art, sin halos, sin deformaciones; no generar frames que el motor no pueda reproducir.
8. No declarar animaciones verificadas por solo cargar sprites.
9. Capturas y vídeos cuando sea posible; clasificar siempre `APROBADO/FALLIDO/BLOQUEADO/NO VERIFICADO`.
10. Publicar solo en `arena/109fe45c-deadbeat-disconew`, PR #1 abierto sin merge, `main` intacta.

---

## 13. Conclusión

La arquitectura real **ya contiene todos los puntos de integración** que exige la TANDA 07: hooks de render encadenados, un mecanismo de animación por frames con fases, un motor de cinemáticas saltable, un sistema de descenso completo con eventos musicales, y un único director de audio. El problema no es de motor, sino de **geografía y lectura visual**: hoy el HUB es una sala cerrada con un decal de grieta y un fondo oscuro genérico más allá del borde sur.

La Fase 1 traduce este diagnóstico a un plano de cotas medido con la cámara real. **No se ha generado ningún asset ni se ha modificado ningún sistema** a la espera de que el diagnóstico y la propuesta de integración sean revisados.
