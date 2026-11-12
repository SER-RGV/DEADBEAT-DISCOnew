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
| 1 | Generar cada ilustración sobre croma verde liso, **pasando siempre una hoja de modelo como imagen de referencia** (sólo con texto el diseño se desvía) | generador de imágenes |
| 2 | Describir la tanda: maestro, lienzo, encaje, limpiezas y anclas | `docs/ART_REBUILD/batches/<TANDA>.json` |
| 3 | Medir el registro de cada fotograma (protagonista: hebilla, cinturón, suelo; enemigos: apoyo y altura de referencia) | `measure.py`, `measure.py --actor` |
| 4 | Croma → PNG final + maestro archivado + métricas de control | `batch.py process` |
| 5 | Revisar costuras, anclas y escala fuera del motor (segundos) | `preview_rig.py`, `preview_actors.py`, `sheet.py` |
| 6 | Alta aditiva en registro, manifiesto e inventario | `batch.py register` |
| 7 | Reconstruir el HTML activo | `python3 tools/build_active_html.py` |
| 8 | **Validar en el juego** | `probe_player.js`, `probe_enemies.js`, `probe_cinematic.js`, `capture_game.js` |
| 9 | Guardar evidencia y marcar como validado (clase E del inventario) | `batch.py mark`, `audit_report.py render` |

## Herramientas

### `artlib.py`
Biblioteca común: recorte de croma (`chroma_matte`), limpieza puntual (`erase_regions`),
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
| `fit` | encaje. Para personajes: `{"mode":"anchor","scale":s,"ax":x,"ay":y,"cx":…,"cy":…}` lleva el punto `(ax, ay)` del maestro a `(cx, cy)` del lienzo |
| `erase` | polígonos o `{"rect":[…]}` del maestro que se borran (p. ej. una sombra de suelo no pedida) |
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

### `preview_actors.py`
```
preview_actors.py <salida.jpg> [--batch …/R02_ENEMIGOS.json] [--zoom 1.6]
                  [--states walk,windup,attack,death] [--onion]
```
Apoya cada fotograma de enemigo en la línea de suelo con el círculo de colisión del
motor debajo y el protagonista al lado. Lee las alturas de `src/dd_world_renderer.js`
(no hay copia que se quede vieja). `--onion` superpone los estados alineados por el
apoyo: enseña cuánto se desplaza el cuerpo al cambiar de estado.

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

### `probe_cinematic.js`
Captura un fotograma por plano de la cinemática de entrada adelantando el reloj de
`DD_CINE` (≈40 s en total).

### `capture_game.js`
Recorrido general: Refugio, armería, mapa, salas con enemigos y jefes. `--circles=N`
entra en la sala 2 del círculo N (el motor reparte 11 salas por círculo); el círculo
real queda además en `capture_report.json`.

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
   figura **centrada** (`dd_work/raw/<TANDA>/_refs/`), y usarlo como referencia.
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

## Trampas conocidas

- **Varias imágenes de referencia** (diseño + estilo, tanda R03): la salida no sigue la
  proporción de la primera. De 7 pruebas, 5 tomaron la de la segunda imagen, 1 la de
  la primera y 1 volvió como hoja de tres vistas en 16:9. Dar las dos con la misma
  proporción y pedir «ONE single figure, not a model sheet, not a turnaround».
  La pose de la imagen de estilo puede colarse: usar como estilo una figura de pie.
- **Línea de suelo**: 6 de 8 salidas de R03 traen una raya fina bajo los pies pese a
  «no floor». Pedir también «no ground line» y borrarla con `erase`.

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
