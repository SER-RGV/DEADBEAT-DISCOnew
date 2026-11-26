# tools/perf — medición de rendimiento y auditoría visual

Arnés usado para el informe de rendimiento/calidad visual. Está aquí para que
las cifras se puedan **reproducir** y volver a medir tras cualquier cambio; no
forma parte del juego ni del build.

## Requisitos

- `playwright-core` y `@sparticuz/chromium` instalados fuera del repo (el
  sandbox no puede descargar Chromium con `npx playwright install`):

  ```bash
  mkdir -p /tmp/pwtest && cd /tmp/pwtest
  npm i playwright-core @sparticuz/chromium
  ```

- `lib.mjs` resuelve `playwright-core` desde la instalación local o `NODE_PATH`.
  Define `DD_CHROMIUM` con la ruta al navegador, sin editar los scripts.
  Para `final_review.js` hace falta además `puppeteer-core` y `@sparticuz/chromium`.
- En Linux sin libnspr4/libnss3 hace falta `LD_LIBRARY_PATH` con las librerías
  de `al2023` que trae @sparticuz.

## Servir el juego

```bash
python3 -m http.server 8123 --bind 0.0.0.0      # este repo (versión nueva)
python3 -m http.server 8124 --bind 0.0.0.0      # copia de la base, para el antes/después
```

El "antes" se saca de un commit concreto sin tocar el árbol de trabajo:

```bash
mkdir -p /tmp/basecopy && git archive <commit> index.html | tar -x -C /tmp/basecopy
ln -s "$PWD/assets" /tmp/basecopy/assets
```

## Scripts

| script | qué mide |
| --- | --- |
| `hubperf.mjs <url>` | arranque (pasos del FSM, ms hasta el menú), fotogramas del menú y del Refugio, long tasks, recuento de assets |
| `sweep.mjs` | auditoría visual del menú y del panel de opciones a 1024x600, 800x600, 1280x720, 1920x1080, 2560x1080 y 2560x1440: recortes, texto por debajo de 10 px y desbordes |
| `shopshot.mjs` | armería: número de tarjetas, nombres, precios, alturas y desbordes |
| `map3.mjs` | mapa de progresión: geometría de la ventana, del cuerpo y de las diez filas |
| `walkdraw.mjs` | qué sprites del protagonista se dibujan de verdad (envuelve `drawImage`) |
| `combat.mjs [url] [salida.json]` | recorre menú → descenso → Refugio → pad → `[E]` → partida y mide el compás de `requestAnimationFrame` en menú, Refugio y **combate**, más el reparto script/pintado de `long-animation-frame` |

### Por qué `combat.mjs` camina en bucle cerrado

El HUB avanza con `dt` acotado (`Math.min(0.05, dt)`). Sin GPU el navegador
baja a ~1–2 fps, así que una pulsación de tecla mueve pocos píxeles y las
retenciones «a ciegas» oscilan fuera del pad de descenso. El script lee `x/y`
en cada vuelta, corrige y camina hasta que `nearStation === "descent"`, con un
presupuesto de tiempo en vez de un número fijo de intentos. Por la misma razón
la espera tras `[E]` se hace contra `isRunning()` (motor en marcha) y no contra
el estado del FSM, que cambia antes de que el bucle corra.

## Nota sobre el entorno

El sandbox no tiene GPU: Chromium rasteriza con **SwiftShader (CPU) sobre 2
núcleos**. Los milisegundos absolutos de pintado **no** representan una GPU
real; lo que sí es válido es el reparto entre script y pintado
(`PerformanceObserver('long-animation-frame')`) y las comparaciones relativas
contra la copia del commit base.

## Integración posterior a #36 (2026-11-26)

- `boot_compare.mjs <url> [repeticiones=3]`: contextos nuevos, transferencias al
  menú y dos segundos después; informa por separado los bytes del HTML. Buffer
  Resource Timing ampliado a 5000 entradas para no truncar el total a 250.
- Los arneses navegan JUGAR → NUEVA PARTIDA y omiten la intro con teclado.
- `walk_to_station.cjs` lee el plano y las colisiones vivos: no presupone las
  coordenadas del HUB antiguo. Planifica una ruta y pulsa teclas, sin teletransporte.
- Armería, atlas, retratos y minimapa son los de #36. Las cifras históricas del
  informe de noviembre 19 no describen esta integración; ver docs/FASE_0.
- `sweep` y `map3` son sondas diagnósticas: exit 0 no significa cero recortes.
