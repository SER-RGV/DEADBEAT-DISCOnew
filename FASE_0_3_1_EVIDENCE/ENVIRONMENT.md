# Entorno de ejecución — Fase 0.3.1

Fecha: 2026-11-02, 23:00–23:30 aprox. (hora local Europe/Madrid).

| Componente | Valor |
|---|---|
| SO | Debian GNU/Linux 12, glibc 2.36, kernel 6.1 |
| Node.js / npm | v22.22.3 / 10.9.8 |
| Navegador | Chromium Headless **153.0.8010.0** (`@sparticuz/chromium@153.0.0`, binario en `/tmp/chromium`) |
| Automatización | `playwright-core@1.64.1` en `/home/user/qa_tools/` (fuera del repo) |
| Servidor | `python3 -m http.server 8123 --bind 0.0.0.0 --directory /home/user/DEADBEAT_DISCO` (activo, HTTP 200, 13.380.910 bytes) |
| URL | `http://127.0.0.1:8123/v9_t3_fase1b_cache_probe.html` |
| Viewport | 1280×900 |
| Perfil | `browser.newContext()` por sesión, aislado, sin datos de usuario |
| Args | `--no-sandbox --disable-dev-shm-usage --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --autoplay-policy=no-user-gesture-required --font-render-hinting=none` + `LD_LIBRARY_PATH=/tmp/qa_libs/lib`, `FONTCONFIG_PATH=/tmp/fonts`, `HOME=/tmp` |
| Capturas | CDP `Page.captureScreenshot` (Playwright `page.screenshot` se bloquea con la animación continua) |
| Consola / Network | `console`, `pageerror`, `request`, `requestfailed`, `response`, `crash` |
| Introspección | CDP + APIs públicas del motor (`DMO.*`, `DMO_HUB`, `DMO_CINE`, `DMO.floorDrop`) |

## Capacidades y ausencias (comprobadas en esta fase)

| Capacidad | Estado | Comprobación |
|---|---|---|
| Ejecutar el HTML original por HTTP | SÍ | HTTP 200 con 13.380.910 bytes |
| Input real de teclado y ratón | SÍ | `page.keyboard` / `page.mouse`, eventos verificados en captura y burbuja |
| Consola, Network, excepciones | SÍ | 0 `pageerror` en todas las sesiones |
| Capturas reales | SÍ | 17 PNG en este directorio (1280×900, firmas PNG válidas) |
| CDP / listeners del DOM | SÍ | Usado en Fase 0.3; aquí se sustituye por observador de eventos en captura/burbuja |
| Instrumentación temporal en runtime | SÍ | `addInitScript` + `Array.prototype.push` + `DMO.debug.tick` |
| **Navegador Chromium con interfaz gráfica** | **NO** | `DISPLAY` vacío; sin `Xvfb`, `xvfb-run`, `Xorg`, `weston`, `chromium`, `google-chrome`, `firefox`; `apt-get -s install xvfb` → «Unable to locate package xvfb» y sin acceso a repositorios Debian |
| Salida de audio audible | NO | Headless + `--mute-audio` |
| Gamepad físico | NO | `navigator.getGamepads()=[]` |
| GPU real | NO | SwiftShader por software |

**Consecuencia:** no se han realizado pruebas manuales en GUI ni se han simulado. La confirmación en navegador de escritorio queda como comprobación manual pendiente (`GUI_MANUAL_CHECK.md`). El diagnóstico automatizado se ha completado con el mejor método disponible, conforme a la Fase 0.3.1.

## Integridad

| Momento | SHA-256 del HTML | SHA-256 del backup |
|---|---|---|
| Antes de Fase 0.3.1 | `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` | ídem |
| Después de todas las sesiones | `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` | ídem |

No se ha modificado el HTML, ni CSS/JS/assets, ni se han eliminado los scripts Cloudflare, ni se ha sobrescrito el backup, ni se ha alterado el historial de commits.
