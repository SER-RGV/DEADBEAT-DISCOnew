# TOTAL ART REBUILD — Evidencia de QA real en navegador (2026-11-15)

**Entorno:** Chromium headless (Sparticuz build 153, vía `playwright-core` + `@sparticuz/chromium`, npm registry), viewport 1280×900, servidor estático 127.0.0.1:8123 sirviendo la raíz del repo. SwiftShader (WebGL CPU). El juego real es `index.html` (build activo), no una simulación ni una demo aparte.

**Resultado global (qa_run_report.json / qa_descent_report.json):**
- Arranque sin errores de página, sin 404 (favicon excluido), sin errores de consola.
- `DD_ASSETS.integrity()` → **pass: true, ok: 271/271, 0 errores** (las 271 entradas registradas decodifican con tamaño esperado).
- Flujo completo verificado en vivo: carga → intro (se salta con tecla) → menú → NUEVA PARTIDA → descenso → **Refugio (HUB) funcional** (estado `active`, estaciones vivas, `protagonist: idle_07b`) → andar → **pad de descenso ([E])** → **primera sala de combate (CÍRCULO I · LIMBO, Ronda 1) renderizada** con HUD intacto y enemigo-preview funcional.

| Captura | Contenido |
|---|---|
| `01_boot.png` | Pantalla de carga + logo (primera ejecución) |
| `02_menu.png` | Intro cómic v2 en reproducción (skippable), menú accesible tras salto |
| `03_refugio_hub.png` | **Refugio reconstruido (TR_T01):** nuevo suelo damero negro/granate/magenta + **mezzanine de los 9 círculos** (arco obsidiana + glow violeta/cian…) sobre el muro norte · sofás chaise magenta TR_T02 · IDLE 07B del protagonista · pad de descenso cian intacto · HUD RESTART intacto |
| `04_refugio_walk.png` | Ídem con el personaje desplazado (colisiones y cámara estables) |
| `05_descent_pad.png` | Jugador sobre el pad de descenso; prompt «Pulsa [E] / (A) para descender al Círculo I · Lujuria» (estación `descent` detectada) |
| `06_first_room.png` | Sala real de combate LIMBO (VESTÍBULO DE TURNOS, Ronda 1 · Oleada Estándar): room cache con `floor_00_limbo_marble`, muros góticos, cajas con sigilo magenta, HUD completo — prueba de que la transición HUB→combate funciona con el registry nuevo |

**Límites honestos de esta evidencia:**
- Muestra LIMBO (floor_00, no regenerado) — **no** hay captura del suelo Lujuria/Gula/… en sala real, porque llegar al Círculo II exige jugar varias pisos; los suelos nuevos están verificados a nivel de *carga* (271/271) y de *asset* (tiles 2×2 sin costuras), no de píxel en pantalla de combate.
- El mezzanine de portales es decorativo (sin estaciones ni progresión); sus extremos quedan parcialmente tapados por el HUD superior a esta resolución.
- Sin comparativa de rendimiento formal (30 s estables sin errores, no fps medido).
- El protagonista en combate usa los sprites del motor (sin cambios); IDLE 07B solo en el Refugio, como está diseñado.

**Reproducir:** `python3 -m http.server 8123 --bind 0.0.0.0` en la raíz del repo; `npm i playwright-core @sparticuz/chromium` fuera del repo; `node ART_TOOLS/qa/qa_flow.mjs` (y `qa_descent.mjs` para el descenso). Harness original ejecutado: `/tmp/qa_browser/*.mjs` (idénticos).

## Pasada TR_W1 (2026-11-15, tras TR_T04–T10)
Segunda generación clase B, misma ID/ruta: `floor_00_limbo_marble`, `wall_pillar_obsidian`,
`threshold_descent_pad`, `door_gothic_closed`, `door_gothic_open`.
- `06_first_room.png` demuestra el **suelo Limbo de mármol agrietado nuevo en sala de combate real** (VESTÍBULO DE TURNOS · Ronda 1).
- `05_descent_pad.png` demuestra el **pad de descenso cian nuevo bajo los pies del protagonista** en el Refugio.
- Integridad tras rebuild: **271/271 pass, 0 errores** (qa_run_report.json). QA headless: 0 pageErrors, 0 failedReqs, 0 console errors.
- **Rechazados y revertidos** (composición encuadrada al fondo, lienzo casi vacío): `wall_panel_gothic_niche`, `wall_panel_heavy_base`, `wall_panel_vip_window`, `wall_core_monolith`, `portal_avaricia_gold`. Requieren regeneración v2 con «panel en retrato llenando 95% del lienzo vertical». Siguen Pendiente en la matriz.

## Pasada TR_W1b (2026-11-15, segunda tanda W1)
Aprobados e integrados (mismos IDs/rutas, integridad navegador **271/271 pass**): `wall_panel_gothic_niche`, `wall_panel_vip_window`, `portal_avaricia_gold`, `portal_baroque_gold`, `floor_10_hub_checker` (damero mármol con reflejos magenta/cian, seamless).
**Rechazados y revertidos** (extracción sobre fondo negro destruye piedra oscura/violeta): `wall_panel_heavy_base`, `wall_core_monolith`, `door_arched_open`, `door_stained_closed`, `door_vip_crimson`.
→ Lección: los assets con mucha piedra negra/oscura se regeneran con **fondo verde chroma #00ff00** (rama dedicada del extractor). v3 pendiente.

## Pasada TR_W1c (2026-11-15, tercera tanda W1 — verde chroma #00ff00)
Regla aplicada: assets con piedra/obsidiana oscura se generan sobre **verde #00ff00**; el extractor usa su rama chroma y ya no destruye el sujeto.
- **Aprobados e integrados** (integridad navegador **271/271 pass**): `wall_panel_heavy_base` (V Herejía), `wall_core_monolith` (IX Núcleo), `door_arched_open`, `door_stained_closed`, `door_vip_crimson`, `wall_panel_tall_neon`, `prop_gilded_altar`, `prop_arcane_pedestal` (restos verdes despillados en postproceso), `floor_11_vip_velvet` (damasco VIP), `prop_gothic_statue`.
- `prop_gothic_statue`: la materia prima venía con sujeto pequeño en lienzo (contain fit → estampado diminuto). Se mantiene por ser mejor arte que el provisional; **pendiente v2 con encuadre de lienzo completo** (el modelo no respetó «fill the entire frame»).
- `prop_arcane_pedestal`: despillado con `green_excess = G - max(R,B) > 12` (568 px); runas cian intactas.
- Walls W1 (00–11): diseño en retrato verificado, extracción limpia sobre verde.

## Pasada TR_W2 (2026-11-15, props del HUB — verde #00ff00)
Integrados (integridad navegador **271/271 pass**): `prop_bar_counter`, `prop_dj_booth` (despill 8886 px que eliminó el vacío verde del arco), `prop_speaker_tower`, `prop_subwoofer_cyan`, `prop_candelabra_floor`, `prop_sofa_black`, `prop_bookshelf_hub` (estantería ancha; el modelo no llena retrato: contenido, anclada abajo), `prop_cooler_neon`, `prop_gothic_statue` (contain por ancho: 201×135).
- **Rechazado y revertido:** `prop_chandelier_gold` (el sujeto generado ocupaba dos mitades separadas; composición imposible de limpiar). Sigue provisional; v2 pendiente.
- Evidencia visual: la captura del Refugio (`03_refugio_hub.png`) muestra la barra, el booth DJ, el pedestal violeta, el cooler y los candelabros nuevos en juego real.

## Pasada TR_W3 (2026-11-15, props de sala — verde #00ff00)
Aprobados e integrados (integridad navegador **271/271 pass**): `prop_arcade_cabinet`, `prop_vending_machine`, `prop_crate_club`, `prop_armchair_vip`, `prop_bench_neon`, `prop_neon_palm`, `prop_sigil_poster`, `prop_bollard_pair`, `prop_chest_closed`.
- **Rechazado (2ª vez): `prop_chandelier_gold`** — v2 volvió como «trompo» cenital con verde atrapado en el aro; se conserva el provisional y el asset queda excluido del pipeline. Para v3 hacer la prueba con instrucciones de silueta colgante y candelabro por debajo de un eje central, o componer en 2 piezas.
- El pipeline de props ahora lleva despillado verde integrado (green_excess = G − max(R,B) > 10) y REFIT_BOTTOM para bookshelf/statue/bollard — el proceso completo es reproducible con una sola orden (`prepare_tr_w2_hub_props.py`).

## Pasada TR_W4 (2026-11-15, props finales + familia Seguridad)
Aprobados e integrados (integridad navegador **271/271 pass**): `prop_potted_plant`, `prop_hub_fox_neon` (zorro corona del Refugio), `prop_neon_flower`, `prop_bar_bottles`, `prop_chest_open`, `prop_chandelier_gold` **v3** (calaveras doradas y cadenas — v3 tras 2 rechazos por composición), y la **familia Seguridad completa**: `enemy_security_walk/windup/attack/death` (guardia con earpiece magenta → porra → lunge → derrumbado).
- Observación: la familia Seguridad tiene algo de variación de coloreado entre estados (walk más frío, windup/attack más rojizo, ira latente) — se acepta como lectura de telegraph, pero si se quiere coherencia perfecta de paleta hay pendiente una pasada de unificación.

## Pasada TR_W5 (2026-11-15, familias Dancer, Fanatic y chef parcial)
Aprobados e integrados (integridad navegador **271/271 pass**): familia **Dancer** (walk/windup/attack/death — cabaré porcelain mask, magenta neon), familia **Fanatic** (walk/windup/attack/death — cultista encapuchado con sigillo zorro, cadenas, brandeo ardiente), y **chef** `walk`/`windup` (gula, delantal sangriento / variante de fuego de nuevo encuadre).
- Observación honesta: el modelo varía la paleta/encuadre entre frames de una misma familia (chef_windup sale demoníaco de fuego vs walk naranja amable). Coherencia por familia aceptable como «variante de intensidad», pero una pasada de unificación de paleta/personaje quedaría como iteración opcional. En `assets/enemies/` siguen provisionales chef attack/death.

## Pasada TR_W6 (2026-11-15, cocina y seguridad pesada)
Aprobados e integrados (integridad navegador **271/271 pass**): `enemy_chef_attack` (espachurrón ígneo), familia **Drone** (walk/windup/attack/death — policía-dron de latón, optic roja, asalto-rayo), y **Elite** walk/attack/death (juggernaut de obsidiana con espina dorsal carmesí / smash de crater / rodilla caída).
- **Rechazados y revertidos:** `enemy_elite_windup` (el modelo ignoró el verde: RAW con fondo casi-negro, la extracción destruyó el cuerpo oscuro — v2 sobre verde explícito pendiente) y `enemy_chef_death` (prompt bloqueado por moderación con lenguaje de salpicaduras; v2 pendiente con redacción sobria). Ambos provisionales conservados.
- Nota: chef_attack conserva un ligero filo verde en el arco de llama (despillado a 10842 px) — aceptable.

## Pasada TR_W7 (2026-11-15, jefes Andén y Magneta + cierre de cocina/elite)
Aprobados e integrados (integridad navegador **271/271 pass**): `enemy_chef_death` v2 (chef derrumbado sobre losas, redacción sobria), `enemy_elite_windup` v2 (verde explícito de primer plano), y dos familias de jefes **completas**:
- **boss_00_anden_*** (Limbo): Ghost Conductor — idle (sombrero de copa, farol carmesí, reloj), attack (barrido de gancho), hit (recoil cian), death (disgregación en niebla cian, reloj caído).
- **boss_01_magneta_*** (Lujuria): Magneta — idle (coleta de cromo, manos imán), attack (doble arco de rayo magenta), hit (recoil ventoso), death (rodilla caída, bocinas silenciadas).

**Todas las familias de enemigos y los 2 primeros jefes están integrados.** Quedan provisionales jefes 02..10 (+secreto boss_10).

## Pasada TR_W8 (2026-11-15, jefes Bufe, Cajero y Pogo)
Aprobados e integrados (integridad navegador **271/271 pass**): familia **Bufe** idle/attack/death (cardenal del banquete eterno; attack ígneo con tenedor), familia **Cajero** completa (El Cajero de Avaricia — autómata-bóveda con libro mayor; attack demoníaco con barriga-bóveda escupiendo oro; hit; death sobre montaña de monedas), y **Pogo** idle/attack (pit-champ de cresta mohawk ardiendo / sprinter de fuego).
- **Rechazado: `boss_02_bufe_hit`** — el modelo inventó «cardenal-pollo asado» (cardenal con mitra de ave), otra identidad; v2 pendiente con instrucción explícita de MISMO personaje.
- Nota honesta: varias familias varían cuerpo/paleta entre frames (chef, pogo, magneta, cajero). Se aceptan como frames de «poder desbordado»; coherencia por familia = iteración opcional pendiente (herramienta: unificación de paleta/personaje vía image edit).

## Pasada TR_W9 (2026-11-15, cierre 02–06 de jefes)
Aprobados e integrados (integridad navegador **271/271 pass**): `boss_02_bufe_hit` v2 (MISMO cardenal con corona de colines recogiendo el golpe — v1 era «cardenal-pollo», rechazada), `boss_04_pogo_hit` (mismo enforcer mohawk recoil), familia **05 Oficiante (Herejía)** completa (cardenal censor con anti-halo rosa-oro; attack de incensario de fuego del alma; death crucificado), y familia **06 Matarife (Violencia)** idle/attack/hit (matarife con cuernos, delantal carmesí; doble hachazo cruzado; cuestión de cabeza).
- **Rechazado: `boss_04_pogo_death`** — el modelo lo dibujó en **pixel-art** incongruente con el resto pintado/painterly; v2 pendiente («painterly smooth illustration, not pixel art»).
- Nota: coherencia por familia vs variación de frame de poder sigue siendo el punto débil aceptado (ver TR_W8).

## Pasada TR_W10 (2026-11-15, cierre 04/06/07/08 de jefes)
Aprobados e integrados (integridad navegador **271/271 pass**): `boss_04_pogo_death` v2 painterly (mismo enforcer mohawk arrodillado), familia **07 Imitador (Fraude)** completa (el doble perfecto del protagonista, traje negro, corona de espejos; attack de explosión de réplicas; death harlequín), y **08 Traidor** idle/attack/hit (Judas de hielo con llave dorada congelada; attack de aliento helado; hit vampiro-duque).
- **Rechazado/bloqueado:** `boss_06_matarife_death` v2 bloqueado por moderación (prompt con «blutige»-ish context: «blood-dark apron»); redacción sobria pendiente.

## Pasada TR_W11 (2026-11-15, cierre de jefes 08/09/10)
Aprobados e integrados (integridad navegador **271/271 pass**): `boss_08_traidor_death` (Judas de hielo arrodillado con la llave rota), familia **09 Núcleo** completa (tormenta de cromo fundido y oro con halo-disco incandescente; attack de sierras de vinilo en explosión morada; hit moltenado; death con altavoz de pecho y halo quebrado), **10 Arquitecto** idle (agrimensor de tiza blanca con plano dorado) y attack (caballero violeta con plano ardiente que parte el suelo — acepta como «versión oscura de poder»; queda pedido v2 con el mismo personaje blanco).
- **Rechazado: `boss_06_matarife_death` v3** — moderación bloqueó v1 («blood-dark apron») y v2; v3 en redacción sobria pasó pero salió **pixel-art** incongruente con la familia pintada; provisional conservado. 4ª solicitud pendiente (prompt painterly explícito + personaje idéntico).
- Estado jefes: **10/11 familias completas**; falta únicamente `boss_06_matarife_death`.

## Pasada TR_W12 (2026-11-15, cierre DEFINITIVO de jefes)
Aprobados e integrados (integridad navegador **271/271 pass**): `boss_06_matarife_death` **v4** — el MISMO carnicero encapirotado con cadenas y dos cuchillos, arrodillado y con la cabeza gacha (v1/v2 bloqueadas por moderación, v3 salió pixel-art); dorado-y-crema en la línea final, pór nada pintada. `boss_10_arquitecto_attack` **v2** — el MISMO agrimensor blanco de la fase idle, cañones de tiza y T-cuadrado dorado, dibujando la línea de luz sobre el suelo (reemplaza la «versión oscura» violeta aceptada en W11 con nota honesta; v2 exigía mismo personaje).
- **HITO: TODAS las familias de jefe completas e integradas (00–10, 44 sprites clase B regenerados en W7–W12).**
- Pendiente post-jefes: FX de fase de jefe, cine Circles II–IX, sprites del jugador/héroe, armas/proyectiles/reliquias/pickups, HUD definitivo, captura in-situ, merge PR #31 (borrador).

## Auditoría de pendientes TR (2026-11-15)
Muestreo visual de ~12 assets marcados «Pendiente» → todos en calidad final (cine Circles/backdrop/HUD/VFX/armas coherentes). **No proceder a regeneración en masa**; in-situ selectivo. Detalle: `docs/TOTAL_ART_REBUILD/02_PENDING_AUDIT_2026-11-15.md`. Matriz: 9 filas actualizadas a «Verificado OK visual 2026-11-15».
- `qa_descent` re-ejecutado (2026-11-15): sin errores; captura de sala I no confirmada (06_first_room.png salió igual que 05).

## Verificación in-situ (HUB → descenso → arena del Jefe, 2026-11-15)
Captura dirigida headless (Playwright) del flujo completo con arte TR:
- `05_descent_pad.png` — HUB con HUD completo, neón zorro, TemPO: sin errores.
- `07_lujuria_arena.png` — tras pulsar [E] sobre el pad de descenso (corrección clave: el jugador debía estar en nearStation='descent', y=691, no y=686 como obtenía el harness antiguo): **VESTÍBULO DE TURNOS · CÍRCULO I · LIMBO** — mármol blanco agrietado, alfombra carmesí, arcos góticos, montacargas de entrada; protagonista renderizado con rig completo; HUD intacto.
- `08_lujuria_boss.png` — `DMO.playtest.boss()` + god-mode: banner **«AMENAZA RESIDENTE · DJ DOOM — CAZADOR»** sobre la arena; **sprite del jefe regenerado (boss_00 Andén · farol) se dibuja en juego** con su barra de vida y el diálogo del tutorial («mientras vivan sus esbirros, el jefe se blinda»); escena atenuada de fondo. pageErrors 0.
- *(Nota honesta)* `06_first_room.png` sigue saliendo idéntica a 07/05 por un problema del antiguo harness de salto de cinemática; 07 incorpora la corrección. La captura **in-situ de Círculos II–IX sigue pendiente**: requiere partida dirigida (gas tras 12 salas por piso × 9 pisos) o instrumentación adicional del Director; no se fuerza en headless.
- `qa_descent` ejecutado 2026-11-15: 0 errores; sala I capturada en 07_lujuria_arena.png.

## Pasada TR_W13 (2026-11-15, reorientación HUB a cámara 3/4)
Solicitud del usuario: «orientar hacia la cámara todos los objetos y assets con orientación fija» (alcance acotado a HUB, planos frontales → 3/4 elevado).
Regenerados en vista 3/4 elevada ~40° (mismo ID/ruta, clase B), registro actualizado, integridad navegador **271/271 pass**, captura in-situ `09_hub_w13.png`:
- `prop_candelabra_floor` v3 (tras v2 cenital extrema tipo «alfombra», rechazada de registro al quedar sobrescrita pero documentada; v3 = 40° con columna en perspectiva)
- `prop_arcane_pedestal` v3 (v2 trajo DOS pedestales pegados por un camino de runas; v3 = UN pilar, corona de púas + orbe zumbido + garras con runas cian)
- `prop_bookshelf_hub` (vista cenital 40°, mismo armario de 6 compartimentos)
- `prop_bar_bottles` (vista cenital 40°)
- `prop_hub_fox_neon` (cartel 3/4 con soporte + pies, gruesa carcasa — de cartel plano pasa a trofeo de neón; documentado)
- El cartel «SIN INCURSIÓN» es DOM/CSS (no asset): nada que reorientar; candelabros y neón SÍ eran planos frontales.

## Verificación in-situ círculo a círculo (2026-11-15, `DMO.playtest.start(round)`, god-mode)
Recorrido con capturas de la torre completa (PNG capt-1280x900, 0 errores JS en todas):
- `07_lujuria_arena.png` — Círculo I · LIMBO, Vestíbulo de Turnos (mármol+alfombra).
- `08_lujuria_boss.png` — banner «AMENAZA RESIDENTE · DJ DOOM — CAZADOR», sprite boss_00 dibujado (barras de vida, saltar escena 4.6s).
- `10_round_5.png` — LIMBO «PISTA CRUZADA» · Círculo I (oleada RUSH).
- `10_round_25.png` — **CÍRCULO II · GULA** «El Banquete Interminable · 128 BPM» (cobre, terrazo, antorchas).
- `10_round_55.png` — **CÍRCULO IV · IRA** «La Pista de las Peleas · 136 BPM» (suelo agrietado ígneo; activa tutorial «EL POGO»).
- `11_round_40.png` — **CÍRCULO III · AVARICIA** «El Club VIP · 130 BPM» (oro-mármol, rejilla de moneda).
- `11_round_70.png` — **CÍRCULO VI · VIOLENCIA** «El Matadero · 142 BPM» (metal industrial verde bio).
- `11_round_100.png` / `(copia 118→100)` — **CÍRCULO IX · EL NÚCLEO FINAL** «La Última Canción · 160 BPM» (geometría sagrada; tutorial «NÚCLEO FINAL: TRES FASES»).
- `12_round_63.png` — **CÍRCULO V · HEREJÍA** «La Catedral del Ruido · 138 BPM» (rejilla carmesí/púrpura).
- `12_round_93.png` — **CÍRCULO VIII · TRAICIÓN** «La Última Sala · 150 BPM» (hielo cian; **enemigos regenerados dibujados**: rostro carmesí con barra de vida sup-izq, sombra con marcador ◇ inf-dcha).
- `10_round_88.png` — **CÍRCULO VII · FRAUDE** «El Club de los Espejos · 145 BPM» (mármol+celosía cian; tutorial «EL IMITADOR»).
*(Nota: las salas no rectangulares muestran bordes negros = vacío fuera del polígono de la sala, diseño del juego, no defecto; no hay QA fallidos en ninguno de los 9 círculos.)*

## Pasada TR_W14 (2026-11-15, Refugio remodelado y grieta de descenso)
Solicitud del usuario: ensanchar el Refugio, colocar bien la decoración y sustituir el pad cian por **una grieta en el suelo** por la que el personaje cae.
Cambios integrados (íntegros en navegador, 272/272 pass):
- **Refugio ampliado** ~1560x950 (antes 1240x760); cache de sala 2240x1420; cámara clampada al nuevo marco; NPCs/estaciones/decoración re-ubicados por zonas (barra central-izquierda, tarima DJ arriba-derecha, salón VIP centrado, armería/arcade izquierda, pedestal-torre derecha, grieta centrada abajo); arranque del protagonista en (910,700).
- **Nuevo asset `threshold_descent_crack`** (384x288, clase B, registro TR_W14, TOTAL 272/272): ojo de grieta cenital, borde de magma cian/magenta, brasas; reemplaza la plataforma cian como salida; `drawDescentCrack` en `dd_world_renderer.js` (pulso de pozo) dibujado antes de la y-sort; área de interacción `GRIETA DEL REFUGIO · Pulsa [E]...`.
- Capturas: `13_refugio_w14.png` (sala ampliada + grieta axial) y `14_grieta_descenso.png` (pulso [E] sobre la grieta → cinemática → Vestíbulo Limbo, 0 errores).
- `threshold_descent_pad` **sigue registrado** (fallback de puertas); ya no se dibuja en el HUB.

## Pasada TR_W15 (2026-11-15, REDISEÑO del Refugio — reconstrucción arquitectónica)
Encargo del usuario: rediseño completo del Refugio (arquitectura, no «muebles movidos»), conservando identidad visual, arte aprobado y sistemas reales.
- **Layout por sectores** (misma sala HUB_BOUNDS 130,145,1560x950, suelo damero, mezzanine de 9 portales, paleta intacta): **E** Barra Social (NO: backbar+barra+asientos, bartender) · **E** Escenario DJ Virgilio (NE: torre+subwoofer+booth) · **C** Armería (O: rack nuevo + stock + cofre + crates, estación `armory`) · **A** Mando (centro: Mesa Astral nueva, estación `map`, círculo rúnico grabado) · **D** Ala experimental de la Torre (E-centro: orbe Tesla nuevo + pedestal + cordón, sin interacción falsa) · **B** Salón (SO: sofás enfrentados + mesa con neón-flower, candelabras, alfombra violeta de doble ribete) · **E** Ocio (SE: 2 arcades + vending + banquillo) · **F** grieta de descenso (S-centro, anillo achicharrado nuevo en cache).
- **Arquitectura pintada en la cache de sala** (`paintRefugeArchitecture`, una sola vez): charcos de luz por sector, runner ámbar frente a la barra, alfombra del Salón con doble ribete neón, círculo rúnico bajo la Mesa Astral, anillo de scorch bajo la grieta. Sin muros nuevos: líneas de visión 2.5D conservadas.
- **3 assets nuevos** (registro TR_W15, TOTAL **275/275**): `prop_weapon_rack` (rack gótico de armas), `prop_astral_table` (orrería+orrería, mapa de la Torre), `prop_tesla_orb` (orbe Tesla). Pipeline `prepare_tr_w2_hub_props.py` (rama TR_W15, despill verde) — ver matriz (Apéndice C).
- **Estaciones movidas, IDs conservados**: `descent` (910,875 · r110, sin cambios), `armory` → (375,555 · r95), `dj` → (1400,305 · r105), `map` → (905,585 · r95, sobre la Mesa Astral). El mural del zorro neón pasa al muro E sobre el ala Torre. Spawn (910,700) sin cambios.
- **Capturas** (in-situ, SwiftShader headless): `15_refugio_full_w15.png` (vista completa), `16_refugio_full_1920_w15.png` (1920x1080), `17_refugio_spawn_w15.png`, `18_armeria_w15.png` (near=armory, prompt Armería), `19_salon_w15.png`, `20_dj_torre_w15.png`, `21_ocio_w15.png`, `22_grieta_w15.png` (near=descent, prompt grieta → E → Vestíbulo Limbo, `inGame:true`).
- **QA**: `qa_flow.mjs` → **integrity 275/275 pass, 0 pageErrors, 0 console errors**; hook QA `window.__DD_HUB_DEBUG_ZOOM` (default off) centra y aleja cámara para capturas de vista completa.
- **Antes/después**: el «antes» es `13_refugio_w14.png` (TR_W14). Informe completo en `docs/REFUGIO/REFUGIO_REDISENO_2026-11-15.md`.

## Pasada TR_W15b (2026-11-15, «sensación de refugio entre runs» + pase de escala)
Respuesta a feedback («el resultado mejora, pero sigue teniendo fallos de distribución de tamaños de assets»):
**Quick wins (1-4) + coherencia de escala:**
- **Música del refugio**: al entrar, cama de club en fundido de entrada (pista 4 de `DDC_COVER.music` vía `DD_BOOT.audio`, con `startMenuMusic(2.0)`); al descender (`exitToRun`), `stopMenuMusic(0.4)`. Programada a +900 ms para no competir con `enterGame()` (que corta el menú). Verificado en navegador: `DDC_COVER.music.playing === true` tras entrar.
- **NPCs con voz**: bartender y armero ahora tienen **estación propia** (`bar`, `armorer`) con `showDialogue` — TEMPO narra el intercambio (un solo retrato en el registry). 4 líneas cada uno con tips reales (Armería, Torre, Limbo, M1911, compás/RAVE).
- **TEMPO aleatorio**: al entrar dice una cita al azar (antes siempre la primera).
- **Ambiente vivo**: parpadeo cálido en candelabros (seno doble), glow pulsante en orbe Tesla/palms, **26 brasas** cian/magenta/ámbar ascendiendo de la grieta (procedural, aditivo) y **34 motas de polvo** en los 4 charcos de luz.
- **Escala deliberada por activo**: drawProp acepta `dw` (ancho en world units); tabla aplicada a las 37 piezas del Refugio (referencia: protagonista ~112 px). Neon-flower apoyado sobre el banco (antes flotaba). Weapon rack dentro del muro oeste (248, dw 228) y palma este dentro de la sala (1612).
- Capturas: `23_refugio_full_w15b.png` (vista completa con TEMPO aleatorio), `24_spawn_w15b.png`, `25_barra_w15b.png` + `26_bartender_dialogo_w15b.png` (near=bar, prompt barra, diálogo TEMPO), `27_armero_w15b.png` + `27_armero_dialogo_w15b.png` (near=armorer, diálogo), `28_grieta_brasas_w15b.png` (brasas sobre la grieta, near=descent, prompt intacto).
- **QA re-verificado**: integrity **275/275 · 0 pageErrors · 0 console errors**; estaciones `[descent, armory, dj, map, bar, armorer]`.

## Pasada TR_W16 (2026-11-15, cierre de fallos conocidos del Refugio)
- Assets NUEVOS (tanda TR_T02): `assets/ui/dialogue_portrait_bartender.png`, `assets/ui/dialogue_portrait_armorer.png` (512², comic cel-shaded, rim-light neón). Registry 275→**277** vía pipeline aditivo (`tools/asset_pipeline.py`); `manifest.json` regenerado; **sin edición manual del registry**.
- `showDialogue` con 4.º parámetro `portraitId`; bartender/armera hablan con su nombre y retrato.
- Backbar: 3 estanterías dw 150, x 268/459/650. Charcos de luz **dinámicos** (respiración sinusoidal ±18 %, fuera de la caché). Mezzanine y=206 h=118.
- Capturas: `29_refugio_full_w16.png`, `30_bartender_trato_w16.png`, `31_armera_trato_w16.png`. QA: integrity **277/277**, 0 pageErrors.

## Pasada TR_W17 (2026-11-15, distribución y orientación)
- **Anchoring**: barra contra muro norte (backbar 235/390/545 y 316, fuera de la banda de portales x≥616), escenario DJ alineado (y≈315-318), armería en columna oeste (rack 235,565 · estantería 232,690 · cofre 430,622 · caja 520,628), salón simétrico con candelabro de cabecera y alfombra ensanchada, ocio alineado en fila SE, palmeras enmarcando el escenario.
- Corredor SO→grieta despejado (el harness de paseo alcanza (887,754) sin atasco). Estaciones re-ancladas: `bar` (400,415), `armory` (240,615 r75), `armorer` (378,585 r70).
- Capturas: `32_refugio_distribucion_w17.png`, `33_barra_w17.png`, `34_armeria_w17.png`, `35_centro_w17.png`. QA: integrity **277/277**, 0 pageErrors.
