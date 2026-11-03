# Entorno de pruebas — Fase 0.3 (registro real)

Fecha de ejecución: 2026-11-02, 21:37–22:42 UTC (22:37–23:42 CET).
Repositorio: `SER-RGV/DEADBEAT_DISCO`, rama `arena/b89cd6bc-deadbeat-disco`.
Build bajo prueba: `v9_t3_fase1b_cache_probe.html`, servida **sin modificar** por HTTP.

## Versiones registradas

| Componente | Versión / valor |
|---|---|
| SO | Debian GNU/Linux 12 (bookworm), glibc 2.36-9+deb12u14, kernel 6.1.158+ |
| Node.js | v22.22.3 |
| npm | 10.9.8 |
| Python | 3.11.2 |
| Navegador | **Chromium Headless 153.0.8010.0** (`HeadlessChrome/153.0.8010.0`) |
| Origen del binario | `@sparticuz/chromium@153.0.0` (npm), extraído a `/tmp/chromium` (209.022.176 B) |
| Librerías añadidas | `/tmp/qa_libs/lib` desde `al2023.tar.br` (NSS/nspr/expat); `LD_LIBRARY_PATH` ajustado; `FONTCONFIG_PATH=/tmp/fonts` |
| Automatización | `playwright-core@1.64.1` (npm) |
| Servidor HTTP | `python3 -m http.server 8123 --bind 0.0.0.0 --directory /home/user/DEADBEAT_DISCO` |
| URL de prueba | `http://127.0.0.1:8123/v9_t3_fase1b_cache_probe.html` (HTTP 200, 13.380.910 bytes) |
| Viewport | 1280×900 (base), 800×600 y 900×700 (pruebas de redimensionado) |
| Perfil | `browser.newContext()` por sesión: contexto aislado/incógnito, **sin datos de usuario** |

## Descubrimiento inicial (antes de instalar nada)

- Navegadores en PATH: **ninguno** (`chromium`, `google-chrome`, `firefox`, `phantomjs`, `electron`, `wkhtmltoimage`… ausentes).
- Playwright / Puppeteer / Selenium: **no instalados** (ni Node ni Python).
- Bibliotecas compartidas típicas de Chromium: inicialmente ausentes (`libnss3.so`, `libnspr4.so`, `libatk-1.0.so.0`, `libgbm.so.1`, `libasound.so.2`…).
- Sin `Xvfb`, sin `ffmpeg`, sin `br`.
- Conectividad permitida y comprobada: `registry.npmjs.org` 200, `pypi.org` 200, `github.com` 200.

**Solución aplicada (sin tocar el repositorio):** instalación de `playwright-core` y `@sparticuz/chromium` en `/home/user/qa_tools/` (fuera del repo), extracción manual de las bibliotecas AL2023 y arranque con `LD_LIBRARY_PATH`. Primer arranque falló por `libnspr4.so`; tras la extracción, `ldd /tmp/chromium` no reportó dependencias faltantes y el navegador arrancó.

## Capacidades realmente disponibles

| Capacidad | Estado | Cómo se usó |
|---|---|---|
| Ejecutar el HTML por HTTP (origen estable) | **SÍ** | Servidor python en `0.0.0.0:8123` |
| Consola y errores JS | **SÍ** | `page.on('console')`, `page.on('pageerror')` |
| Network (peticiones, fallos, códigos) | **SÍ** | `page.on('request')`, `requestfailed`, `response` |
| Screenshots | **SÍ** | `Page.captureScreenshot` vía CDP (Playwright `page.screenshot` se bloqueó en animación continua: `Timeout 30000ms exceeded`; se sustituyó por CDP) |
| Canvas 2D / WebAudio API / Gamepad API | **SÍ** (API presentes) | Verificado con `document.createElement('canvas').getContext('2d')`, `AudioContext`, `navigator.getGamepads` |
| Introspección del motor en vivo | **SÍ** | `DMO.read()`, `DMO.debug.state()`, `DMO_HUB.state()`, `DMO_DUNGEON.state()/audit()`, `DMO_MUSIC.audit()`, `DDC_COVER.state()` |
| Listeners del DOM | **SÍ** | CDP `DOMDebugger.getEventListeners` sobre `window`, `document`, `#game` |
| Input real (teclado/ratón) | **SÍ** | `page.keyboard.down/up/press`, `page.mouse.move/down/up/click` |
| Audio audible | **NO** | Chromium headless; Playwright añade `--mute-audio`. Solo se verifica estado de `AudioContext`, grafo y persistencia del mute |
| Gamepad físico | **NO** | `navigator.getGamepads()` devuelve `[]`; `DMO.gamepad.state().connected=false` → V-10 BLOQUEADA |
| Pantalla/GPU real | **NO** | SwiftShader por software (`--use-angle=swiftshader`), sin display ni Xvfb |

## Argumentos de navegador usados

`--no-sandbox --disable-dev-shm-usage --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --autoplay-policy=no-user-gesture-required --font-render-hinting=none`, más los que añade Playwright por defecto (entre ellos `--mute-audio`, `--headless`). **No** se usaron `--disable-web-security` ni `--single-process` (se excluyeron deliberadamente para no falsear CORS/aislamiento).

## Integridad de la build durante las pruebas

| Momento | SHA-256 |
|---|---|
| Antes de la Fase 0.3 | `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` |
| Después de todas las sesiones | `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` |
| Copia de seguridad Fase 0.2 | `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` |

No se ha editado el HTML, ni su CSS/JS/assets, ni se han eliminado los scripts de Cloudflare. Las únicas escrituras en el workspace son los documentos de entrega y este directorio de evidencias. Los datos de `localStorage` se generaron en contextos aislados de navegador y **no** provienen de ningún perfil de usuario.

## Nota sobre instrumentación

- Se inyectó un observador de `AudioContext` (`addInitScript`) que solo envuelve el constructor para leer `.state`; **no modifica la lógica del juego**.
- Para la prueba de «almacenamiento no disponible» se inyectó (`addInitScript`) un getter de `localStorage`/`sessionStorage` que lanza `SecurityError`. **La medición no confirma que la condición se mantuviera**: tras el arranque, `lsProbe:"object"`, `storageAvailable:true` y `saveWrites:1` (`log_audio_save_storage.json`, bloque `B`). Es decir, el acceso a `localStorage` volvió a ser un objeto y el juego escribió una clave. La hipótesis de que el bloque 1 del HTML sustituye el getter por un *shim* en memoria es **plausible pero no está demostrada por esta medición**; tampoco se descarta que la inyección fuera sobrescrita por el propio navegador o por otro bloque. En consecuencia, **el caso «almacenamiento realmente no disponible» NO se considera probado** y `09_no_storage_boot.png` (nombre heredado de la sesión) debe leerse como «arranque con condición de almacenamiento inyectada, no verificada». Es una condición de entorno inyectada y documentada, no un resultado simulado ni una conclusión funcional.
- `DMO.read()` devuelve una instantánea con retardo; para medir movimiento se usaron `DMO.debug.state().px/py` (coordenadas vivas). Esto se documenta para no confundir un artefacto de instrumentación con un fallo del juego.
