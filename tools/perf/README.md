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

- `lib.mjs` apunta a `/tmp/pwtest/node_modules`. Si se instala en otro sitio,
  se ajustan esas dos rutas de importación.
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

## Nota sobre el entorno

El sandbox no tiene GPU: Chromium rasteriza con **SwiftShader (CPU) sobre 2
núcleos**. Los milisegundos absolutos de pintado **no** representan una GPU
real; lo que sí es válido es el reparto entre script y pintado
(`PerformanceObserver('long-animation-frame')`) y las comparaciones relativas
contra la copia del commit base.
