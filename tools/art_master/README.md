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
| 3 | Medir el registro de cada fotograma (hebilla, cinturón, suelo) | `measure.py` |
| 4 | Croma → PNG final + maestro archivado + métricas de control | `batch.py process` |
| 5 | Revisar costuras y anclas fuera del motor (segundos) | `preview_rig.py` |
| 6 | Alta aditiva en registro, manifiesto e inventario | `batch.py register` |
| 7 | Reconstruir el HTML activo | `python3 tools/build_active_html.py` |
| 8 | **Validar en el juego** | `probe_player.js`, `probe_cinematic.js`, `capture_game.js` |
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
| `anchors_raw` | `belt_y` (borde inferior del cinturón) y `hand` (`[x, y]` del agarre) en píxeles del maestro; se guardan normalizados en `entries[id].anchors` |

### `measure.py`
Busca la hebilla del cinturón por correlación de plantilla y devuelve `ax`, `belt_y` y
`ay` para el JSON de la tanda. Un `score` por debajo de ~0,45 significa que la hebilla
está tapada: medir a mano sobre una rejilla.

### `preview_rig.py`
Monta piernas + torso + capa de puños + arma con Pillow, igual que
`DD_WORLD.drawProtagonist`, para un barrido de elevaciones. Es una ayuda rápida; la
tabla de sectores es una copia de `PLAYER_AIM_SECTORS` y la validación que cuenta es la
del juego.

### `probe_player.js`
Abre el `index.html` real y recorta al protagonista en cada estado (Refugio, barrido de
elevación con cada arma, caminar apuntando, daño, impulso, voltereta, derribo).
Tarda ~5 min con tres armas: lanzarlo en segundo plano.

### `probe_cinematic.js`
Captura un fotograma por plano de la cinemática de entrada adelantando el reloj de
`DD_CINE` (≈40 s en total).

### `capture_game.js`
Recorrido general: Refugio, armería, mapa, salas con enemigos y jefes. El parámetro
`--circles` no garantiza el círculo pedido (ver comentario en el código): el círculo
real queda en `capture_report.json`.

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

## Trampas conocidas

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
