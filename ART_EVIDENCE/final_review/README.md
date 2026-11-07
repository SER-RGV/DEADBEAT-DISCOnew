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
| `03_final_regression.json` | ejecución final (incluye comprobación anti-fuga del registro) | Evidencia canónica de la build que se propone mergear |
| `selfcontained.json` | `tools/qa/selfcontained.js` | Autocontención de CSS/JS: sirviendo **solo** `index.html` (resto 404) la build arranca y entra al HUB, 0 peticiones a `src/`, 0 peticiones externas, 0 `pageerror` |
| `step_1_menu.png` … `step_3_run.png` | capturas del arnés | Menú HD, HUB jugable y partida tras el descenso, en la misma sesión |

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
  `navigator.getGamepads` (`hub.emulated-gamepad-move`).
- **No hay GUI real**; todo es headless. Las capturas son `page.screenshot()` del
  canvas/DOM reales, sin composición adicional.
- El rendimiento (FPS, rAF) en SwiftShader **no** es comparable a hardware real:
  el movimiento por `dt` aparece ralentizado y las cifras de desplazamiento no
  deben leerse como velocidad de juego.
