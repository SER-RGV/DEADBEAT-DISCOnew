# Evidencia · revisión final pre-merge (2026-11-07)

Todo lo de esta carpeta es **salida generada** por los arneses de `tools/qa/`.
No contiene capturas retocadas ni resultados escritos a mano.

## Entorno de ejecución

| Campo | Valor |
|---|---|
| Navegador | Chromium headless **153.0.8010.0** (`@sparticuz/chromium` + `puppeteer-core`) |
| Viewport | 1440 × 900, DPR 1 |
| Rasterizado | SwiftShader (sin GPU) — **no representativo** de hardware real |
| Servidor | `tools/qa/*.js` levantan un HTTP estático en `0.0.0.0` sobre el repo |
| Fecha | 2026-11-07 |

## Ficheros

| Fichero | Origen | Qué demuestra |
|---|---|---|
| `01_before_guard_fix.json` | `tools/qa/final_review.js` sobre el build `cc3bf39b…dcd5` | Estado **anterior** a la corrección: 8 comprobaciones del guard en fallo, flujo 16/16 en verde |
| `02_after_guard_fix.json` | mismo arnés sobre el build `eaf607c5…c09b` | Tras endurecer el guard: guard 17/17, flujo 16/16 |
| `03_final_regression.json` | ejecución sobre `eaf607c5…c09b` (guard D1–D4) | Flujo 16/16 con el guard anterior al soporte de `AbortSignal` |
| `04_signal_before_fix.json` | `final_review.js` sobre **`eaf607c5…c09b`** | **Antes** del arreglo de `AbortSignal`: guard **24/30**; fallan `H2`, `H3`, `H3b`, `H4`, `H7`, `H7b` |
| `05_final_regression.json` | `final_review.js` sobre **`483fc9c9…953c`** | **Evidencia canónica** de la build que se propone mergear: guard **30/30**, integración 4/4, flujo 16/16 |
| `selfcontained.json` | `tools/qa/selfcontained.js` | Autocontención de CSS/JS: sirviendo **solo** `index.html` (resto 404) la build arranca y entra al HUB, 0 peticiones a `src/`, 0 peticiones externas, 0 `pageerror` |
| `step_1_menu.png` … `step_3_run.png` | capturas del arnés (build final) | Menú HD, HUB jugable y partida tras el descenso, en la misma sesión |

## Bloques del arnés `final_review.js`

| Bloque | Contenido |
|---|---|
| A–G | contrato del guard: capture booleano, capture por objeto, duplicados, retirada simétrica, burbuja intacta, semántica heredada, reinstalación inerte |
| **H** | **`AbortSignal`**: registro `{capture, signal}`, señal ya abortada, abort posterior, re-registro tras abort, `once` (con y sin compuerta HD), retirada manual con opciones y 30 ciclos registro/abort sin entradas obsoletas en `count()` |
| integración | el cover heredado no secuestra en HD (`B1`) y vuelve a secuestrar al desactivar HD (`B2`), con el registro del guard estable (`B4`) |
| flujo | menú → cinemática → HUB (teclado y mando **emulado**) → descenso → partida normal → pausa liberada → segundo descenso |

## Reproducción

```bash
npm install puppeteer-core @sparticuz/chromium          # fuera del repo, p. ej. /tmp/bh
NODE_PATH=/ruta/node_modules node tools/qa/final_review.js --out ART_EVIDENCE/final_review
NODE_PATH=/ruta/node_modules node tools/qa/selfcontained.js --out ART_EVIDENCE/final_review
```

En Linux mínimo (bibliotecas NSS fuera del paquete) hay que aportar `libnspr4`,
`libnss3` y `libnssutil3` vía `LD_LIBRARY_PATH`; el paquete `@sparticuz/chromium`
las incluye en `bin/al2023.tar.br`.

Los arneses devuelven código de salida `0` solo si **todas** las comprobaciones
pasan (`verdict: "PASS"`).

## Límites de esta evidencia

- **No se ha probado un mando físico.** El mando está emulado sustituyendo
  `navigator.getGamepads` (`hub.emulated-gamepad-move`); el botón A de estación
  no se ha ejercitado.
- **No hay GUI real**; todo es headless. Las capturas son `page.screenshot()` del
  canvas/DOM reales, sin composición adicional.
- El rendimiento (FPS, rAF) en SwiftShader **no** es comparable a hardware real:
  el movimiento por `dt` aparece ralentizado y las cifras de desplazamiento no
  deben leerse como velocidad de juego.
