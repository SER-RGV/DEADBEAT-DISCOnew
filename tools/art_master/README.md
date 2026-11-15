# `tools/art_master/` — producción de arte por tandas (R01, R02, …)

Línea de producción que sustituye el arte del juego por ilustración digital siguiendo
las guías de `assets/references/` (REF_01…REF_16). Cada tanda se describe en un JSON
(`docs/ART_REBUILD/batches/<TANDA>.json`), se procesa con estas herramientas y **sólo se
da por hecha cuando se ha visto funcionando dentro del juego**.

> No usar `tools/asset_pipeline.py::rebuild_registry()`: reescribe el registro entero
> con una plantilla antigua y pierde las entradas de cinemática y el versionado de caché.

## Flujo de una tanda

| Paso | Qué se hace | Herramienta |
|---|---|---|
| 1 | Generar cada ilustración sobre croma verde liso, **pasando siempre una hoja de modelo como imagen de referencia** (sólo con texto el diseño se desvía). Para un fotograma de estado, la referencia es el reposo del personaje montado con `state_ref.py` | generador de imágenes, `state_ref.py` |
| 2 | Describir la tanda: maestro, lienzo, encaje, limpiezas y anclas | `docs/ART_REBUILD/batches/<TANDA>.json` |
| 3 | Medir el registro de cada fotograma (protagonista: hebilla, cinturón, suelo; enemigos: apoyo y altura de referencia; jefes: eje de apoyo a mano y escala K) | `measure.py`, `measure.py --actor`, `layout.py` |
| 4 | Croma → PNG final + maestro archivado + métricas de control | `batch.py process` |
| 5 | Revisar costuras, anclas y escala fuera del motor (segundos) | `preview_rig.py`, `preview_actors.py`, `sheet.py` |
| 6 | Alta aditiva en registro, manifiesto e inventario | `batch.py register` |
| 7 | Reconstruir el HTML activo | `python3 tools/build_active_html.py` |
| 8 | **Validar en el juego** | `probe_player.js`, `probe_enemies.js`, `probe_bosses.js`, `probe_rooms.js`, `probe_weapons.js`, `probe_pickups.js`, `probe_hud.js` (ruta real de arranque), `probe_projectiles.js` (T08, ruta real), `probe_boot_failure.js`, `probe_cinematic.js`, `capture_game.js` |
| 9 | Guardar evidencia y marcar como validado (clase E del inventario) | `batch.py mark`, `audit_report.py render` |

## Herramientas

### `artlib.py`
Biblioteca común: recorte de croma (`chroma_matte`), recorte por luminancia para efectos de luz
(`luma_matte`: crudo sobre negro puro → `alpha = max(R,G,B)` menos un suelo, color normalizado;
falla si el marco del crudo no es negro), limpieza puntual (`erase_regions`,
`remove_ground_line`, `fade_regions`, `mirror_half`; `apply_cleanup` las aplica en ese orden;
`mirror_half` simetriza un módulo de muro para que las copias contiguas encajen),
capas parciales de una misma ilustración (`keep_regions`), encaje al lienzo
(`fit_canvas`: `contain`, `figure`, `anchor`, `cover`, `stretch`), anclas normalizadas
(`canvas_anchors`), guardado de PNG y de maestros WebP, y métricas de control
(`qc_metrics`: fantasma, toca borde, damero horneado, vacío, derrame de verde).

### `batch.py`
```
batch.py process  <tanda.json> [--only id,id] [--raw DIR] [--no-sheet]
batch.py register <tanda.json> [--only id,id]
batch.py mark     <tanda.json> --evidence docs/ART_REBUILD/evidence/<TANDA>
batch.py audit    [--fix]
```
- **process** es determinista: con los mismos maestros produce PNG idénticos byte a byte.
  Busca el PNG croma en `DD_RAW_ROOT/<TANDA>/` (por defecto `/home/user/dd_work/raw`,
  fuera del repositorio) y, si no está, parte del **maestro archivado** en
  `ART_ASSETS/rebuild_masters/<TANDA>/<maestro>.webp` (cuadro completo ya recortado del
  croma: alfa idéntico, color con diferencia media ≈ 2/255). Un clon limpio del
  repositorio puede regenerar los PNG finales.
- **register** sólo toca la línea `const MANIFEST = {...}` de `src/dd_asset_registry.js`,
  `ASSET_CACHE_VERSION`, `assets/manifest.json` y `MASTER_INVENTORY.json`. Nunca borra
  entradas. Antes de añadir un id nuevo, comprobar que no existe ya en el registro.
- **audit** compara el registro con los archivos: existe, tamaño natural igual al
  registrado y `alpha` declarado igual a la transparencia real. `--fix` corrige el dato
  registrado, nunca la imagen.

Claves de cada asset del JSON de tanda:

| Clave | Uso |
|---|---|
| `id`, `raw`, `size`, `location` | identidad, maestro, lienzo final y ruta |
| `matte` | `hard`/`soft` (croma verde, por defecto), `none` (PNG opaco o ya transparente) o `luma` (efectos de luz generados sobre negro puro: la luminancia pasa a ser el alfa; `luma_floor` opcional, 0.035). Para sprites que el juego mezcla con `lighter` |
| `fit` | encaje. Para personajes: `{"mode":"anchor","scale":s,"ax":x,"ay":y,"cx":…,"cy":…}` lleva el punto `(ax, ay)` del maestro a `(cx, cy)` del lienzo |
| `erase` | polígonos o `{"rect":[…]}` del maestro que se borran (p. ej. una sombra de suelo no pedida) |
| `ground_line` | `true` (o parámetros: `{"max_thick":12, "search":0.14, "min_run":28, "min_cover":0.10}`) busca y borra la raya horizontal fina que el generador dibuja bajo los pies aunque se le pida «no floor». Sólo mira la franja inferior de la figura y sólo borra tramos finos y largos: una bota, un bajo de túnica o una peana no lo son. Nunca pinta |
| `fade` | `[{"rect":[x0,y0,x1,y1],"dir":"up"}]`: funde a transparente hacia un lado. Para cables o hilos que el dibujo lleva hasta el borde del lienzo: un corte recto con `erase` se ve |
| `layout` | sólo jefes: datos para `layout.py` (`unit_world`, `ax`, `ay`, `unit_rows`, `ref`, `k`), que calcula `size`, `fit` y `anchors_raw` |
| `keep` | polígonos del maestro que se conservan; el resto queda transparente (capas derivadas) |
| `overlay_of` | id del fotograma al que pertenece una capa derivada |
| `anchors_raw` | en píxeles del maestro; se guardan normalizados en `entries[id].anchors`. Protagonista: `belt_y` (borde inferior del cinturón) y `hand` (`[x, y]` del agarre). Enemigos: `foot` (`[x, y]` del punto de apoyo) y `unit_h` (alto de la figura de referencia de la familia) |

### `measure.py`
Busca la hebilla del cinturón por correlación de plantilla y devuelve `ax`, `belt_y` y
`ay` para el JSON de la tanda. Un `score` por debajo de ~0,45 significa que la hebilla
está tapada: medir a mano sobre una rejilla.

**Modo `--actor`** (enemigos y, más adelante, PNJ: figuras completas sin corte de cintura).
Todos los fotogramas de una familia comparten la escala de su `walk`:
```
cd /home/user/dd_work/raw
measure.py --actor R02_ENEMIGOS/enemy_security_*.png \
           --ref R02_ENEMIGOS/enemy_security_walk.png --unit-world 88 \
           [--ax ARCHIVO=X] [--rel ARCHIVO=K]
```
Devuelve por fotograma `scale`, lienzo (múltiplo de 16), `fit` y `anchors_raw.foot`.

- **`--ax ARCHIVO=X`** fija a mano el eje de apoyo. El automático (centroide del 60 %
  inferior de la figura) falla cuando el torso o las manos llegan al suelo (poses a
  cuatro patas) y en las caídas: el cuerpo «resbala» respecto al `walk`. En las muertes
  el generador deja plantado un pie donde estaba en el `walk`: se usa el eje del `walk`.
- **`--rel ARCHIVO=K`** declara que ese maestro está dibujado K veces el tamaño de la
  referencia. Hace falta siempre que al generador se le dio una referencia ampliada
  (ver «Generar una pose que no cabe»): el fotograma se coloca con `scale / K`.

Comprobar siempre el resultado con `preview_actors.py --onion`.

**Modo `--scale`** (estimar K por correlación de un rasgo rígido, con giro):
```
measure.py --scale R02_ENEMIGOS/enemy_chef_windup.png --ref R02_ENEMIGOS/enemy_chef_walk.png \
           --box 800,128,970,300 [--range 0.4,1.3] [--rot=-40,40] [--roi x0,y0,x1,y1]
```
Es una estimación: con `score` por debajo de ~0,45 no vale. En R02 no bastó (el
generador redibuja la cabeza con otra expresión) y K se midió por el **área de un rasgo
rígido de color propio** (botas, cabeza de peluche), que en los fotogramas de escala
conocida acierta con un 1–3 % de error, contrastada sobre rejilla.

### `layout.py`
```
layout.py docs/ART_REBUILD/batches/R03_JEFES.json [--only id,id] [--ppu 2.8] [--pad 8]
          [--raw DIR] [--write]
```
Jefes: cada figura tiene su propia silueta (capa, báculo, cuernos, tambor) y el eje de
apoyo automático no sirve en ninguna; se elige **a mano** sobre una hoja con rejilla y se
anota en `layout.ax`. Con eso y con la altura de mundo (`unit_world`) calcula el lienzo
(múltiplo de 16), el encaje y las anclas `foot` / `unit_h` de cada fotograma.
- Reposo: `{"unit_world": 196, "ax": 512}` (el alto de referencia es el de la figura,
  salvo que se dé `unit_rows: [y0, y1]`).
- Estado: `{"ref": "<id del reposo>", "ax": 600, "k": 0.861}`. `k` = cuánto mide la
  figura de este maestro respecto al reposo. Si el estado se generó dando como
  referencia el reposo pegado en un lienzo más ancho, `k = alto de la salida / alto de
  la referencia` (comprobado en 4 de 4 contra la altura de las figuras).
Sin `--write` sólo imprime la tabla.

### `state_ref.py`
```
state_ref.py docs/ART_REBUILD/batches/R03_JEFES.json [--only id,id] [--k 1.35] [--raw DIR] [--out DIR]
```
Monta la imagen de referencia para pedir un fotograma de estado: la figura de reposo,
**ya limpia** (mismas claves `erase`, `keep`, `ground_line` y `fade` que aplica
`batch.py process`), centrada en un lienzo croma `k` veces más ancho. Escribe
`<raw>/_refs/ref_<nombre>_wide.png`. Dos motivos:
- el generador conserva la proporción del lienzo y el tamaño de la figura de la
  referencia: una pose que no cabe se recorta o se pliega, no se dibuja más pequeña;
- hereda lo que la referencia traiga de más. Con el croma original como referencia, la
  línea de suelo pasó a 3 de 3 fotogramas de ataque.
El factor para la ficha del fotograma es `k` de `layout` = alto de la imagen generada /
alto de esta referencia.

### `preview_actors.py`
```
preview_actors.py <salida.jpg> [--batch …/R02_ENEMIGOS.json] [--zoom 1.6]
                  [--states walk,windup,attack,death] [--onion]
preview_actors.py <salida.jpg> --bosses [--only anden,pogo] [--states idle,attack] [--onion]
```
Apoya cada fotograma de enemigo (o de jefe, con `--bosses`) en la línea de suelo con el
círculo de colisión del motor debajo y el protagonista al lado. Lee las alturas de
`src/dd_world_renderer.js` (no hay copia que se quede vieja). `--onion` superpone los
estados alineados por el apoyo: enseña cuánto se desplaza el cuerpo al cambiar de estado.

### `sheet.py`
```
sheet.py <salida.jpg> <archivos…> [--cols 6] [--cell 220] [--crop ANCHOxALTO] [--zoom 1.0]
         [--label nombre|ruta|no] [--strip PREFIJO] [--bg oscuro|claro|ambos]
```
Hojas de contacto para revisar maestros, PNG finales (sobre fondo oscuro y claro, para
ver halos) y recortes de las sondas.

### `preview_rig.py`
Monta piernas + torso + capa de puños + arma con Pillow, igual que
`DD_WORLD.drawProtagonist`, para un barrido de elevaciones. Es una ayuda rápida; la
tabla de sectores es una copia de `PLAYER_AIM_SECTORS` y la validación que cuenta es la
del juego.

### `probe_player.js`
Abre el `index.html` real y recorta al protagonista en cada estado (Refugio, barrido de
elevación con cada arma, caminar apuntando, daño, impulso, voltereta, derribo).
Tarda ~5 min con tres armas: lanzarlo en segundo plano.

### `probe_enemies.js`
```
node tools/art_master/probe_enemies.js <salida> [--circles=1,2,5] [--box=200] [--colliders]
```
En cada círculo pedido crea un enemigo de cada tipo del motor, un élite, un minijefe y
un guardián, y recorta a cada uno en caminar, aviso, ataque, impacto y tres instantes
de la muerte. Guarda además el fotograma completo (`<c>_frame_walk.jpg`,
`<c>_frame_attack.jpg`) y la prueba de profundidad `<c>_depth.png` (tres enemigos
detrás, al lado y delante de un mueble alto). La familia y el estado que anota el
informe son los que el puente entrega al renderizador (`__DD_BRIDGE.getActors()`), no
una suposición de la sonda. ≈75 s por círculo: lanzarlo en segundo plano.

### `probe_bosses.js`
```
node tools/art_master/probe_bosses.js <salida> [--bosses=1,2,…,11] [--box=300] [--pass=full|intro]
```
Por cada jefe (1–9 = residentes de los círculos I–IX, 10 = Núcleo, 11 = Arquitecto) va a
su sala, lo invoca por la vía del motor y lo recorta en: aparición, reposo a ambos
lados del protagonista, persecución, aviso de patrón, ventana expuesta, impacto,
barrido (aviso y rayo), esbirros vivos, congelado, berserk, vida baja, delante y detrás
del protagonista, y la muerte (`death_frozen` = lo que queda detrás del panel de fin de
ronda; `death_a/b/c` = tres instantes del desplome). Guarda además los fotogramas
completos `_frame_intro` (tarjeta de presentación de `DD_CINE`), `_frame_idle`,
`_frame_attack`, `_frame_fired` y `_frame_sweep`. El informe anota el fotograma que el
puente entregó de verdad y si es propio del estado (`dedicated`) o el reposo con señal.
≈100 s por jefe: lanzarlo en segundo plano. `--pass=intro` se queda en la tarjeta de
presentación, la aparición y el reposo (≈45 s por jefe): sirve para revisar un cambio
que no toca el combate. Con un HTML anterior a R03 hace una pasada reducida (reposo y
patrón) que sirve de «antes».

Dos límites de lo que la sonda puede enseñar:
- Al morir el Núcleo o el Arquitecto, el motor abre la pantalla de fin de partida en el
  mismo fotograma y deja de simular: su registro de muerte no envejece (`death_a/b/c`
  salen iguales y sin `death_frozen`). En juego, esa pantalla tapa la escena.
- Los estados se fuerzan con `__DD_BRIDGE.debugPoseBoss`; el patrón y la muerte son
  los del motor. No sustituye a jugar un combate entero.

### `probe_rooms.js`
```
node tools/art_master/probe_rooms.js <salida> [--circles=1,…,9] [--rooms=2,10] [--box=280] [--dpr=2] [--hub=0|1] [--hubwalk=0|1] [--unlock=0|1] [--dom=0|1]
```
Sonda de **escenarios** (T04): entra en el Refugio por la misma puerta que NUEVA PARTIDA
(`DD_HUB.enter()`), guarda su lienzo, y después visita las salas pedidas de cada círculo
(nivel `(c−1)·11 + sala`). En cada sala guarda el cuadro completo con las puertas cerradas
(`_a_cerrada`), tras vaciarla (`_b_abierta`) y con el protagonista pegado al muro norte
(`_c_norte`: la franja de muro y su puerta entran en cámara), más el recorte de cada puerta
(`getSnapshot().doors`) y de la franja norte (`roomRect`). El paso «norte» **teletransporta**
(`DMO.debug.teleport`, probando varias x: en salas en L la franja sólo existe arriba) en vez de
andar. Después, para cada puerta especial (`kind` ≠ `room`: `shop`, `boss`, `lift`) teletransporta
al protagonista a 130 px de ella hacia dentro de la sala y guarda `_d_<kind>.jpg` +
`_d_doorN_<kind>_open.png`: así entran en cámara las puertas laterales e inferiores que en los
pasos a/b quedaban fuera (recorte negro). `probe_report.json` lleva errores de página y de red,
`roomRect`, puertas y posición final del protagonista. Las capturas se leen del `<canvas>` (la
captura de página tarda >8 s en este Chromium). Refugio solo: `--circles= --rooms=` (≈100 s).
Una sola instancia a la vez: dos sondas simultáneas acaban en `TimeoutError`.

### `probe_weapons.js`
```
node tools/art_master/probe_weapons.js <salida> --weapons=spas12,ak47,m60 [--poses=quieto,der,arriba,abajo,izq,camina] [--box=170] [--grip=1] [--dpr=2]
```
Entra en una incursión con la sala despejada, equipa cada arma con `__DD_BRIDGE.buyOrEquipWeapon(id, true)` y recorta al
protagonista con el arma dibujada por el motor en seis posturas (≈1 min por arma). Guarda por captura la telemetría
`__DD_BRIDGE.getWeaponTelemetry()` (`ut._gdb`: len/hgt en px, grip/axis/tip/sup, boca y apoyo locales, clase) y la
calibración vigente (`getWeaponCalibration`). Una sola instancia de Chromium; `--grip=1` dobla el tiempo.

### `weapon_cal.py`
```
python tools/art_master/weapon_cal.py assets/weapons/weapon_ak47.png --cls fusil --out /tmp/ak47_cal.png
```
Mide sobre el PNG final la empuñadura, el eje del cañón, la boca y la mano de apoyo (ver «Contrato de las armas»). La
usa `batch.py process` cuando la ficha lleva `"calibrate": {"cls": …}` y `batch.py calibrate --overlay DIR` para
revisar/repetir sin regenerar. Ajustes por arma en la propia clave `calibrate`: `hang:false` (culata clásica),
`grip`/`sup` (previos en fracción del ancho de la silueta), `grip_v` (altura explícita de la mano, fracción del alto del PNG; armas gordas), `tip` (boca explícita, fracción del ancho; p. ej. llama piloto pintada), `axis_v`, `axis_band` (fracción derecha donde se mide el cañón; estrechar si hay depósitos bajo él), `max_dev`, `spriteRot` (arcos).

### `probe_cinematic.js`
Captura un fotograma por plano de la cinemática de entrada adelantando el reloj de
`DD_CINE` (≈40 s en total).

### `capture_game.js`
Recorrido general: Refugio, armería, mapa, salas con enemigos y jefes. `--circles=N`
entra en la sala 2 del círculo N (el motor reparte 11 salas por círculo); el círculo
real queda además en `capture_report.json`.

### `probe_pickups.js`
```
LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts node tools/art_master/probe_pickups.js <salida> [--relics=tempo,needle,…]
```
Entra en una incursión con la sala despejada, deja los 11 tipos de botín del motor en el suelo con
`__DD_BRIDGE.spawnPickupAt(type, x, y)` (misma tabla `mu` y función `nf` que el botín real) y captura el lienzo
(`t06_ingame_*`). Después abre un cofre real (`DMO.rogue.debug({action:"chest"})` + `{action:"open"}`) y captura
las tarjetas (`t06_relic_chest_*`), concede 6 pasivos (`{action:"item", id}`) y captura la lista de la pausa
(`t06_relic_pause_*`; la sección se clona en un panel limpio porque en headless sale parcial). Deja
`t06_probe.json` con el resultado y los errores de página. Con `--relics=` se eligen los pasivos; antes del cofre
real prueba la **reserva al glifo** sustituyendo `window.DD_ASSETS` (congelado) por un doble que niega `relic_*`
(`fallbackGlyph` en el informe + `t06_relic_chest_fallback_glyph.png`). Entra por el atajo de QA y oculta las capas de
menú para la captura completa (lo anota en `hidden overlays`); el HUD se valida con `probe_hud.js`, que usa la ruta real.

### `probe_hud.js` (T07 · HUD por la ruta real)

```
LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts node tools/art_master/probe_hud.js <salida> [--w=1280 --h=720] [--shotTimeout=90000]
```

Recorre el arranque como un jugador (carga → gesto/intro saltada con una tecla real → menú → clic en NUEVA PARTIDA → descenso →
Refugio → `DD_HUB.exitToRun()`) y captura **la página tal cual** (DOM + lienzo; no oculta capas). Comprobaciones con evidencia
obligatoria (`checks[]` en `hud_probe.json`, volcado tras cada una): iconos cargados desde `assets/ui/hud_*`, tamaños CSS, capas con
`z-index ≥ #dd-hud`, estados Refugio / incursión / daño (`wp`) / escudo (botín) / habilidades cargadas y bomba gastada con `Q` / jefe
(`DMO.debug.boss`) / emblema de victoria (`DD_CINE.playVictory`). Si el arranque termina en `#dd-boot-frame.is-failed` **aborta con
código 2** y guarda `boot_failed_<alto>.png` + `DD_BOOT.getErrorRegistry()` en `hud_probe.json` (no se oculta el panel). Un solo
Chromium a la vez; a 1920×1080 las capturas tardan 40–50 s (`--shotTimeout=150000`) y la pestaña puede caer al entrar en la incursión.

### `probe_boot_failure.js` (diagnóstico de `is-failed`)

```
LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts node tools/art_master/probe_boot_failure.js <salida> [--w=1280 --h=720]
```

Reproduce la entrada «por atajo» de las sondas antiguas (`DD_HUB.enter()`/`exitToRun()` nada más cargar `DD_ASSETS`, con `DD_BOOT`
aún en marcha) y registra la línea temporal de clases de `#dd-boot-frame`, `DD_BOOT.getErrorRegistry()`, `getEvidence()` y `getTrace()`
en `boot_failure_<alto>.json`. Sirve para atribuir un `is-failed` a su paso (`images`/`fase01`/`opening` > `timeoutMs`, paso
imprescindible o perro guardián de 20 s) en lugar de suponerlo.

### `probe_projectiles.js` (T08 · proyectiles e impactos por la ruta real)
```
LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts node tools/art_master/probe_projectiles.js <salida> \
    [--types=slug,heavy,pellet,cryo,plasma,ricochet,lane,flame,rail,homing] [--dpr=1] [--box=520x200] [--bomb=1]
```
Misma ruta real que `probe_hud.js` (armazón → Espacio → intro → menú → NUEVA PARTIDA → Refugio → `exitToRun`);
después despeja la sala (`exploreNoEnemies`, `holdSpawns`, `killAll`), equipa un arma representativa de cada tipo de
proyectil del catálogo `ja` (`m1911 magnum spas12 cryo plasma ricochet trident flamer railgun raygun`) con
`buyOrEquipWeapon(id, true)` y dispara con el motor (`testStep({fire:true, aim})`): capturas `der_a/der_b`
(ráfaga a la derecha), `impacto` (pared derecha, chispas `Sa`), `izq` y `arriba`; con `--bomb=1` pulsa `Q` (tp) y
fotografía la explosión en cuatro instantes. `probe_report.json` guarda por captura las balas vivas por tipo
(`getActors().bullets[].projectile`), el nº de partículas `Sa` y la posición. ~165 s a 720p; lanzar con
`--mute-audio` ya incluido (sin él, el hilo de audio de Chromium se atasca y el navegador se cierra).

### `derive_hud_heart_empty.py` (T07 · estado derivado)

```
python3 tools/art_master/derive_hud_heart_empty.py [--full assets/ui/hud_heart_full.png] [--out /home/user/dd_work/raw/T07_HUD/hud_heart_empty.png] [--ring 11 --ink 3]
```

Deriva `hud_heart_empty` de la silueta exacta de `hud_heart_full` (aro rosa pálido + relleno carbón translúcido) para que siga
legible bajo el CSS del HUD (`opacity .28 + grayscale`). La ficha lo declara `matte none` + `fit stretch`; después
`batch.py process … --only hud_heart_empty --no-sheet` y `register --only`.

### `anim_contract.py`
```
python3 tools/art_master/anim_contract.py            # escribe docs/ART_REBUILD/ANIMATION_CONTRACT.json
python3 tools/art_master/anim_contract.py --check    # valida R1–R4 (salida 1 si falla)
```
Contrato de animación derivado del registro real: por entidad y estado, qué id dibuja el motor, cuántos fotogramas
tiene de verdad (uno, salvo `player_walk_00..03`), qué reloj lo mueve y qué anclas usa. Ejecutar tras cada
`register` que toque figuras. Explicación en `docs/ART_REBUILD/ANIMATION_CONTRACT.md`.

### `audit_report.py`
`init` clasifica todos los assets en la escala A–E; `render` escribe
`docs/ART_REBUILD/AUDIT_INVENTORY.md`.

## Contrato del protagonista (R01)

- Escala maestro → lienzo 0,493; lienzos de 512 px de alto; línea de suelo en `y = 504`;
  el eje de torso es el centro del lienzo. El ancho varía por pose.
- **Corte de cintura.** Las piernas se dibujan desde su cinturón hacia abajo y el torso
  desde arriba hasta el suyo, desplazado para que ambos cinturones coincidan
  (`anchors.belt`). Las poses con puños por debajo del cinturón llevan una capa
  derivada (`PLAYER_SPLIT_OVERLAY`).
- **Sectores de puntería.** Siete torsos según la elevación del ángulo de puntería
  (`PLAYER_AIM_SECTORS`); el arma gira de forma continua alrededor de `anchors.hand`.
- Las poses sin `anchors.hand` no llevan arma (voltereta, derribo, impulso).

## Generar una pose que no cabe en el lienzo de la referencia

La salida del generador mide siempre ~1,06 Mpx con la proporción de la imagen de
referencia. Si la pose pedida no cabe en ese lienzo a la misma escala (erguir a un
personaje encorvado, extender un brazo, caer hacia atrás), el generador **no reduce la
figura**: devuelve la pose de la referencia casi intacta o pliega los miembros para que
quepan. Así fallaron en R02 el aviso y el ataque del Tanque y el ataque de la Mascota.

1. Pegar el `walk` recortado sobre un lienzo de croma más alto o más ancho, con la
   figura **centrada** (`dd_work/raw/<TANDA>/_refs/`), y usarlo como referencia. Para
   ensanchar, `state_ref.py` lo hace con la figura ya limpia.
2. Pedir «ONE single character only… Replace the reference pose completely…»: dos de
   las seis salidas hechas con referencia ampliada trajeron la figura original **y** la
   nueva. En las dos la figura estaba descentrada; con seis muestras no es una prueba,
   pero centrarla no cuesta nada.
3. Medir la escala relativa K del resultado y pasarla con `--rel`.
4. Contar piernas y brazos, y comprobar hacia dónde mira: una caída «hacia atrás» puede
   salir mirando al lado contrario (se espeja el maestro) o con una pierna de más (se
   borra con `erase` siguiendo un contorno ya entintado; nunca se pinta nada nuevo).

## Contrato de los enemigos (R02)

Quién decide qué se dibuja: el **puente** (`ddEnemyView` en `tools/build_active_html.py`)
traduce cada enemigo del motor a `{familia, estado, orientación}` con las mismas reglas
que el motor original, y `DD_WORLD.drawEnemy` lo pinta.

| Tipo del motor | Familia (`enemy_<familia>_<estado>`) |
|---|---|
| élite (cualquier tipo) | `elite` |
| guardián (tirador con aura) | `security` |
| `sprinter` | `fanatic` |
| `tank` | `chef` |
| `speaker` | `drone` |
| `dancer` | `security` en el círculo I, `dancer` en los demás |
| minijefe | `chef` (círculo III), `elite` (círculo VIII), `security` en el resto |

- **Estados:** `walk` (también reposo), `windup` (aviso), `attack`, `death`. Prioridad:
  impacto > aviso > ataque > caminar. El impacto no tiene fotograma: es el `walk` con
  aplastamiento y destello. El enemigo mira siempre hacia el protagonista.
- **Anclas** (`entries[id].anchors`): `foot` = punto de apoyo (eje del cuerpo sobre la
  línea de suelo), `unit` = alto de la figura de referencia de la familia como fracción
  del alto del lienzo. El renderizador apoya `foot` en `(x, y + 0,65·r)` y escala para
  que la figura de referencia mida `ENEMY_BASE[familia].h × (r / r_base)^0,75` px de
  mundo. Así un ataque con el brazo extendido ocupa más lienzo sin que el cuerpo crezca.
- **Sin mezcla de revisiones.** Un fotograma de estado sólo se usa si su `rev` coincide
  con el del `walk` de su familia; si no, se dibuja el `walk` con una señal procedural.
  Mientras falte el `death` nuevo de una familia, su muerte es el `walk` desplomándose
  hacia atrás.
- **Muerte.** El fotograma `death` es una sola ilustración (el instante en que cae de
  espaldas); el renderizador lo muestra 0,6 s con destello, retroceso y fundido.
- **Halo de separación.** Detrás de cada fotograma se pinta su silueta en claro,
  difuminada (`ENEMY_HALO`, opacidad por familia en `ENEMY_BASE[familia].halo`): sin él
  las figuras negras se pierden sobre los suelos oscuros.
- **Señales sobre la cabeza** (barra de vida, marca de élite / guardián / minijefe,
  flecha de último enemigo). Se colocan sobre la altura de referencia de la figura y
  suben lo que el fotograma sobresalga de ella (`enemyContentTop` mide el borde
  superior real del dibujo): el Tanque con los puños en alto mide un 40 % más que
  caminando. Nunca bajan de la altura de referencia.
- **Profundidad.** El puente ordena por la línea de suelo (`ddGroundY`): enemigos en
  `y + 0,65·r`, protagonista en `y + 14`, muebles altos en su borde frontal.
- **Suelo.** `(x, y)` de una entidad es su círculo de colisión sobre el suelo. Las
  suelas del protagonista caen en `y + 14`; las balas se dibujan a la altura del cañón.

Ganchos de prueba del puente: `getActors()`, `getProps()`, `renderNow()`,
`killAllEnemies()` (abate por la vía real del motor, la única que deja registro de
muerte) y `debugPoseEnemies(st, {type, index, hit, stT, assign:{…}})`.

## Contrato de los jefes (R03)

El **puente** (`ddBossView` en `tools/build_active_html.py`) traduce el jefe del motor a
`{slug, estado, orientación, aparición, berserk}` y `DD_WORLD.drawBoss` lo pinta. Las
señales de juego del motor (anillos de aparición, arco de esbirros, aro de ventana
expuesta, sector y rayo del barrido) las vuelve a pintar el puente en torno a la figura:
el puente anterior sustituía el `Bf` del motor entero y **ninguna** llegaba a pantalla.

| Jefe del motor | `slug` (`<slug>_idle`, `_attack`, `_hit`, `_death`) |
|---|---|
| residente del círculo I…IX | `boss_00_anden`, `boss_01_magneta`, `boss_02_bufe`, `boss_03_cajero`, `boss_04_pogo`, `boss_05_oficiante`, `boss_06_matarife`, `boss_07_imitador`, `boss_08_traidor` |
| `final` (nivel 100) | `boss_09_nucleo` |
| `secretBoss` | `boss_10_arquitecto` (sólo `_idle` y `_attack`) |

- **Estados.** `attack` mientras hay un patrón en aviso o disparando (`pattern71`), en
  el barrido (`phase === "sweep"`) o durante `_ddaAttackT`; `recover` en la ventana
  expuesta (`exposedT > 0`); `idle` en el resto. **No** se usa `f.bossState()`: devuelve
  `attack` durante toda la fase berserk. El jefe mira siempre al protagonista (el arte
  mira a la derecha y se refleja).
- **Anclas** como los enemigos (`foot`, `unit`). El apoyo va en `(x, y + 0,8·r)` y la
  figura de referencia mide `BOSS_BASE[slug].h × (r / 34)^0,75` px de mundo (el
  protagonista mide 104).
- **Sin mezcla de revisiones.** Un fotograma de estado sólo se usa si tiene anclas y la
  misma `rev` que el reposo. Si falta, se dibuja el reposo con una señal procedimental
  (ataque: se inclina y se aplasta; ventana expuesta: se vence hacia atrás). El arte
  anterior (pixel art sin anclas) no se dibuja nunca junto al nuevo.
- **Impacto.** No cambia de fotograma: destello con tope 0,36 y caída cuadrática. Un
  arma automática reinicia `hitFlash` a cada bala; con caída lineal el jefe pasaba la
  pelea velado de blanco.
- **Berserk** (vida < 35 %): filo rojo que late alrededor de la figura y velo rojo
  suave; la barra de vida pasa a ámbar.
- **Barra de vida** por encima del tope real del dibujo (`enemyContentTop`), no en
  `y − r − 16`, que con figuras de 190 px cae a media altura del cuerpo.
- **Muerte.** El registro del motor dura 1 s y recuerda `ddSlug` y `ddFlip`. Con
  fotograma `death` se muestra ese; sin él, el reposo se hunde, se ensancha y se funde.
  El destello entra en rampa: el motor abre la elección de fin de ronda en el fotograma
  siguiente y congela la simulación, así que el primer instante puede quedarse en
  pantalla mientras el jugador elige.
- **Profundidad.** `ddGroundY`: jefe y registro de muerte en `y + 0,8·r`.
- **Tarjeta de presentación** (`DD_CINE.playBossIntro`). La instantánea del puente
  entrega `boss.slug`, `boss.subtitle` (el título del residente en el motor,
  `residentTitle`; si no tiene, `variantLabel`) y `boss.color`. La tarjeta dibuja
  `<slug>_idle` reflejado —el arte mira a la derecha y el retrato va a la derecha de la
  pantalla— sobre un velo oscuro. Sin `subtitle` los once jefes mostraban el mismo
  texto de respaldo.

Ganchos de prueba: `getBoss()`, `debugPoseBoss({x, y, entrance, hitFlash, exposedT,
freezeTimer, addsAlive, pattern71, patternWarn71, phase, phaseTimer, attackTimer,
berserk, _ddaAttackT, hp, sweep})` y `killBoss()` (abate por la vía real del motor).

## Contrato de los escenarios (T04)

- **Muros** (`CIRCLE_CONFIG.wall`): PNG **opaco** 384×576 (2:3), `alpha=false`, sin croma (`matte: none`,
  `fit: cover`), **simetrizado** con `mirror_half: left` (o `right` cuando la mitad derecha es la buena:
  `wall_panel_heavy_base`, `wall_greed_vault`) para que las copias contiguas encajen; media
  pilastra en cada borde y cornisa continua. El renderizador dibuja módulos de `132·w/h` px de ancho
  (88 px) y pilastras de `148·w/h` (74 px) cada 320 px: pedir formas legibles a 100 px.
- **Puertas** (`drawDoor`): croma `#00FF00`, 448×544 (jefe 448×576), escalón horizontal abajo; en pantalla
  136 px de ancho con el pie en la posición de la puerta (`-h·0.78`); en el muro sur se achatan a 0,82. La
  hoja abierta se genera como **edición** de la cerrada (mismo marco).
- **Clases de puerta** las decide el puente (`ddDoorState` en `build_active_html.py`): `room` (vidriera
  I–IV / gótica V–IX, cerrada o abierta), `shop` → `door_vip_crimson`, `boss` → `portal_baroque_gold`,
  `lift` (descenso) → `portal_avaricia_gold` + `threshold_descent_pad` 98 px hacia dentro de la sala.
- **Plataforma de descenso** (`drawDescentPad`): `threshold_descent_pad` 640×400 croma, `anchor: center`,
  vista cenital pronunciada (losa como rombo); 196 px en pantalla y también en el Refugio.
- **Neón del zorro** (`prop_hub_fox_neon`, 384×512): lo consume `DD_HUB` (`foxSign`) y la fachada del muro norte.
- QA: `probe_rooms.js … --hub=0` (el Refugio tumba a veces el Chromium de pruebas) y `--unlock=1`
  (por defecto) abre todas las puertas como el modo «SALAS ABIERTAS» del motor; los pasos `_d_` enseñan
  tienda, Residente y descenso aunque la sala sea en L o la puerta esté abajo o a un lado.

## Contrato de las armas (T05)

- **Lienzo** 320×160 RGBA, `fit contain` margen 6, arma horizontal, **boca/punta a la derecha**, empuñadura abajo a la
  izquierda; sin manos ni texto. El mismo PNG es el sprite en mano (`it` del módulo v3.2 vía el puente), el icono de la
  tienda (`wo`, 104 px), el HUD (56×26) y la armería (≤112 px).
- **En mano**: `wLen = len·95 px`, `wHgt = wLen·alto/ancho`; `drawImage(sprite, -grip·wLen, -gripY·wHgt)` tras colocar la
  mano; antebrazo de apoyo (recorte de `player_fire2`) en `(sup, supY)` salvo armas de cadera (`xt`: m60, minigun, LMG,
  pesado, BFG, mortero, rotatorio, artillería, dragón, director); fogonazo en `(tip, axis)`. Mirando a la izquierda el
  motor voltea en Y. Arcos: sprite tumbado (limbos izquierda–derecha, cuerda ABAJO) y `spriteRot = +π/2`.
- **Calibración medida, no a ojo**: `weapon_cal.py` → `report.anchors` → `register` → `manifest.entries[id].anchors` →
  puente `ddApplyWeaponCalibration` (`tools/build_active_html.py`) → `WEAPON_OVERRIDES[id]` y `dt[id].hd`.
  `oriented:true` anula `flipX/cropY/spriteRot/scabbardCropY` heredados del módulo v3.2. `len` no se cambia (alcance de
  juego) salvo `calibrate.len` explícito.
- **QA**: hoja `calibrate --overlay` (mano roja en la empuñadura, apoyo verde bajo el guardamanos, eje amarillo en el
  cañón, boca cian en el extremo) y `probe_weapons.js` en derecha/arriba/izquierda como mínimo; evidencias en
  `docs/ART_REBUILD/evidence/T05_ARMAS/`.

## Contrato de los objetos (T06)

- **Lienzo** 160×160 RGBA, objeto centrado (`fit contain`, margen 8), `pivot center`, sin suelo ni sombra; silueta
  legible a 44 px. Estilo cel 3–4 tonos, filo magenta a la izquierda y cian a la derecha, sin texto, marco ni halo
  (el halo, la sombra y la flotación los pone `drawPickup`).
- **Consumidores**: `pickup_*_00` → `DD_WORLD.drawPickup` (44 px × escala, flotación ±4 px, halo cian) y reserva
  de los iconos del HUD (`dd_ui_system.js`); `relic_*` → tarjetas del cofre (`#shot-choice-overlay .shot-icon`) y
  lista de pasivos de la pausa (`.rogue71-items`) mediante el bloque `1f` de `tools/build_active_html.py`
  (sustituye el glifo por la imagen si el id existe; si no, queda el glifo). Las reliquias no son botín de suelo.
- **QA**: `probe_pickups.js`; evidencias en `docs/ART_REBUILD/evidence/T06_OBJETOS/`.

## Contrato de los efectos (T08)

- **Crudos sobre negro puro** (#000) pedidos como «light effect, smooth glow», cabeza a la DERECHA y estela a la
  IZQUIERDA; `matte luma` convierte la luminancia en alfa (sin croma: el verde contamina los bordes de un brillo).
  Comprobar antes `borde max` del crudo (≤ 12/255); un marco gris hace fallar `luma_matte`.
- **Proyectiles** `proj_<tipo>` (tipos del catálogo del motor `ja[arma].projectile`: slug heavy pellet cryo plasma
  ricochet lane flame rail homing; `melee` no tiene sprite): `fit contain` margen 4, `pivot center`. Los dibuja
  `DD_WORLD.drawProjectiles` con mezcla `lighter`, rotados según la velocidad; longitud por tipo
  (`PROJECTILE_LEN`, heredada del trazado original `Tt()`), × radio lógico/5 acotado a [0,85, 1,5]; la cabeza del
  sprite cae sobre la posición lógica de la bala (`PROJECTILE_HEAD` 6 % por delante) y la estela detrás; alfa
  `1 − 0,45·vida`. Nada de esto toca la hitbox (`r`) ni la física.
- **Impactos** `vfx_impact_spark` / `vfx_impact_plasma` (160², `fit contain` margen 6): partículas `Sa` del motor
  (`vs(x, y, color, n)`: impactos de bala, muertes, bombas, rotura de atrezo, subidas de nivel). Cada partícula se
  tiñe con SU color (mezcla `color` sobre el sprite, caché por color), radio `max(10, r·4,2)` encogiendo al
  apagarse. Los dos sprites se alternan por índice.
- **Explosión** `vfx_explosion_inferno` (320²): la bomba (`tp`, tecla Q) avisa a `DD_WORLD.spawnExplosion(x, y)`
  (bloque `1g` de `tools/build_active_html.py`); `drawExplosions` la hace crecer de 120 a 320 px de mundo y la
  apaga en 0,56 s. Si el asset falta, no dibuja nada (sin reserva).
- **Sin consumidor** (no se producen, siguen en clase B): `vfx_muzzle_gold/plasma`, `vfx_shockwave_magenta`,
  `vfx_fire_plume`, `vfx_soul_flame`, `vfx_lightning_purple`, `vfx_smoke_cloud`.
- **QA**: `probe_projectiles.js`; evidencias en `docs/ART_REBUILD/evidence/T08_EFECTOS/`.

## Trampas conocidas

- **Escenarios:** `page.evaluate` con el Refugio activo ha cerrado el navegador varias veces (Chromium en
  un solo proceso con swiftshader); las sondas de salas van con `--hub=0`. Con las puertas abiertas, subir
  en línea recta hacia el muro norte mete al protagonista por la puerta (cambia de sala): la sonda busca
  antes una x alejada de las puertas del muro norte.

- **Varias imágenes de referencia** (diseño + estilo, tanda R03): la salida no sigue la
  proporción de la primera. De 7 pruebas, 5 tomaron la de la segunda imagen, 1 la de
  la primera y 1 volvió como hoja de tres vistas en 16:9. Dar las dos con la misma
  proporción y pedir «ONE single figure, not a model sheet, not a turnaround».
  La pose de la imagen de estilo puede colarse: usar como estilo una figura de pie.
- **Línea de suelo**: 6 de las 8 primeras salidas de R03 traen una raya fina bajo los
  pies pese a «no floor». Con una figura de estilo que no la tiene, 0 de 5; pero los
  fotogramas de estado la **heredan** de su referencia (3 de 3). Se quita con
  `"ground_line": true`.
- **Cables e hilos hasta el borde** (Magneta, Imitador): se funden con `fade`.
- **Cristal pintado de verde croma** (la puerta del horno del Bufé en ataque): el
  recorte lo vacía. Pedir cristal oscuro ahumado.
- **Muerte del jefe y fin de ronda.** Al morir el último enemigo de la sala el motor
  abre «VARÍA TU DISPARO» en el paso siguiente y deja de simular hasta que se elige.
  Una sonda que no pulse una opción se queda con el registro de muerte en su primer
  instante y con el siguiente jefe congelado (así salió la primera pasada de R03).

- El motor **sortea** qué enemigos nacen élite o guardián y `DMO_FLOOR.filterEnemyType`
  cambia el tipo pedido por uno que la sala permita. Una sonda que necesite un reparto
  fijo debe anular `currentCell.allowedEnemyTypes` al crear y fijar después los papeles
  (ver `probe_enemies.js`), y leer siempre el tipo real en `getActors()`.
- `DMO.debug.killAll()` vacía la sala sin dejar registro de muerte; para ver muertes hay
  que usar `__DD_BRIDGE.killAllEnemies()`. El registro dura 0,6 s y el juego sigue
  corriendo entre dos llamadas al navegador: los instantes se capturan en una sola.
- El minijefe se mueve con `mState` (`roam`, `ringWind`, `chargeWind`, `charge`), no con
  `st`: para posarlo, `assign: { mState: … }`.
- `DMO.debug.spawnEnemyAt(tipo, x, y, élite, esbirroDeJefe)`: el cuarto argumento fuerza
  élite.

- `DMO.debug.invuln()` deja al protagonista en pose de daño permanente. No usarlo en sondas.
- `__DD_BRIDGE.testStep()` y la captura deben ir en la **misma** llamada al navegador;
  si se separan, el bucle real vuelve a reposo antes de la foto.
- `page.screenshot` cuesta ~10 s por captura en Chromium sin GPU: leer el `<canvas>`.
- Los fotogramas de caminata de cuerpo entero (brazos caídos) no sirven como fuente de
  piernas: las manos quedan por debajo del cinturón. Se generan piernas con los brazos
  alzados y sin rodilla alta (el muslo no debe cruzar la cintura).

## Requisitos

- Python con Pillow, NumPy y SciPy (`/home/user/.venv/bin/python`).
- Navegador de pruebas en `/tmp/browser`, `/tmp/chromium` y `/tmp/al2023/lib`.
- Servidor estático en `:8080` sirviendo la raíz del repositorio.
