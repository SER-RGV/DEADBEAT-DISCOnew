# FASE 1 · Pruebas automáticas y QA

Fecha de la ejecución que documenta este informe: **26 de noviembre de 2026**.
Rama: `arena/1f2ec2fb-deadbeat-disconew`, partiendo de `main` (`6087057`) más la
integración del PR #36 (necesaria para `src/room_generation/validate.js`).

## 1 · Qué se ha construido

| Pieza | Dónde | Qué hace |
|---|---|---|
| Arnés único | `tools/qa/run.js`, `tools/qa/run.sh` | sirve el repositorio, lanza suites, escribe `report.json` y devuelve código de salida |
| Navegador portable | `tools/qa/lib/chrome.js` | usa `@sparticuz/chromium` + sus librerías NSS; no requiere `npx playwright install` ni `apt` |
| Servidor estático | `tools/qa/lib/server.js` | HTTP real (MIME y `Range`), sin dependencias |
| Utilidades de juego | `tools/qa/lib/game.js` | estados de la FSM, entrada por el camino del jugador, sondas del motor |
| Resultados | `tools/qa/lib/harness.js` | PASS / FAIL / SKIP, capturas e informes |
| Suites | `tools/qa/e2e/01…10` | arranque, menú, HUB, diez plantas, partida real, guardado, teclado, semillas, visual, presupuestos |
| Regresión visual | `tools/qa/e2e/09_visual.spec.js`, `tools/qa/visual/` | referencias en el repositorio, umbral configurable, comparación dentro del navegador (sin dependencias de PNG) |
| Semillas | `tools/qa/e2e/08_semillas.spec.js` | 1.000 semillas × 10 plantas con `generate()`/`validate()` reales |
| Presupuestos | `tools/qa/e2e/10_presupuestos.spec.js`, `tools/qa/budgets.json` | peso de arranque real y cadencia de fotogramas |
| CI | `.github/workflows/qa.yml` | build reproducible + 4 trabajos de QA en paralelo, artefactos por trabajo |
| Inventario de suites | `tools/qa/README.md` | qué cubre cada suite, cuáles son históricas y cómo ejecutar todo |

Dependencias nuevas: `package.json` + `package-lock.json` con **versiones fijas**
(`playwright-core@1.49.1`, `@sparticuz/chromium@138.0.2`). El juego en sí no
cambia de dependencias: sigue siendo un único HTML.

## 2 · Cambios en el juego (alcance mínimo)

1. **H-E4 · el menú se anuncia como menú** (`src/dd_ui_system.js`): el contenedor
   `#dd-menu-nav` pasa a `role="menu"` con `aria-orientation="vertical"` y cada
   acción a `role="menuitem"`; la opción resaltada lleva `aria-current="true"`.
   Las flechas y Enter ya se comportaban así; ahora la semántica coincide con el
   comportamiento. Se cambió `<nav>` por `<div>` para no sobrescribir el rol del
   elemento nativo (un `nav` con `role="menu"` no es HTML/ARIA válido).
2. **H-F1 · contrato real de la FSM documentado** (`src/dd_boot.js`): el comentario
   de cabecera declaraba `BOOT → LOADING → INTRO → MAIN_MENU`, pero la apertura
   narrativa pertenece a «Nueva partida» desde el cambio de flujo, y
   `startIntro()` es código sin llamadas. No se ha reescrito el comportamiento
   (la intro sigue reproduciéndose al empezar partida, en
   `src/dd_ui_system.js`); se ha corregido la documentación y la prueba pasa a
   verificar el contrato vigente. **La decisión de que la intro no se reproduzca
   al arrancar es del proyecto, no de esta fase.**
3. `index.html` y `DEADBEAT_DISCO.html` se han regenerado con
   `tools/build_active_html.py`; el build es reproducible (comprobado y añadido
   como trabajo de CI).

Suite anterior actualizada: `tools/qa/test_accessibility_dodge.js` comprobaba el
árbol de accesibilidad con rol `navigation`; ahora acepta el rol `menu` del punto 1.

## 3 · Pruebas ejecutadas

### 3.a · Arnés nuevo (comando y resultado)

```bash
QA_OUT=docs/evidence/fase1/raw node tools/qa/run.js --all
# → 161 PASS · 0 FAIL · 1 SKIP · 768 s · node v22.22.3
```

| Suite | Resultado | Tiempo | Qué se verificó de verdad |
|---|---|---|---|
| `arranque` | 11 PASS · 0 FAIL | 22 s | HTTP 200, 0 errores de consola, 0 respuestas ≥ 400, carga 0→100 % en 10 pasos, sin watchdog, menú sin pulsación previa |
| `menu` | 12 PASS · 0 FAIL | 29 s | seis acciones con nombre accesible, `role="menu"`/`menuitem`, un `tabindex=0`, foco visible, flechas/Enter/Escape |
| `hub` | 11 PASS · 0 FAIL | 58 s | NUEVA PARTIDA por el camino del jugador, apertura saltada, Refugio activo y en pausa, caminar (49 px), 9 zonas y 16 estaciones, `dd_save_v1` |
| `plantas` | 65 PASS · 0 FAIL | 155 s | diez incursiones cortas: círculo correcto, rótulo de pista, vidas, director de combate vivo, telemetría legible |
| `partida` | 12 PASS · 0 FAIL | 115 s | teclado, ratón (apuntado de 0,000 a −0,387 rad), disparo sin errores, esquiva (69 px), daño 3→2 con HUD actualizado, ESC pausa/reanuda |
| `persistencia` | 12 PASS · 0 FAIL | 67 s | sin guardado no hay CONTINUAR; la ficha existe y sobrevive a la recarga; CONTINUAR en JUGAR restaura el Refugio y suma visita (1→2) |
| `teclado` | 9 PASS · 0 FAIL | 24 s | seis opciones alcanzables sin ratón, foco visible, foco atrapado en el submenú, retorno al menú |
| `semillas` | 9 PASS · 0 FAIL | 2 s | 1.000 semillas × 10 plantas = 10.000 planos, 0 fallos de `validate()`, 108 salas + núcleo, 216 salidas por semilla, determinismo |
| `visual` | 12 PASS · 0 FAIL | 176 s | 6 capturas contra referencias del repo en 1280×900, 1920×1080 y 390×844; diferencia máxima aceptada medida: 0,124 % (umbral 1,5 %) |
| `presupuestos` | 8 PASS · 1 SKIP | 118 s | arranque 5,59 MB / 250 recursos; cadencia de menú, Refugio y combate; ver tabla de métricas |

Métricas de la ejecución:

| Métrica | Valor |
|---|---|
| Peso de arranque | **5,59 MB** (HTML 5,59 MB + 250 recursos; el arte va en línea) |
| Arranque hasta menú | 6,6–6,9 s (render software) |
| Cadencia en menú | 3,79 fps (3 fotogramas; p50 264 ms, p95 5.572 ms) |
| Cadencia en Refugio | 12,29 fps (7 fotogramas; p50 81 ms) |
| Cadencia en combate | 1,58 fps (9 fotogramas; p50 633 ms) con 4 enemigos |
| Cinemática | **SKIP**: 2 fotogramas en la ventana, medición no fiable |
| Semillas | 10.000 planos validados en 2.019 ms; 109.000 salas; 216.000 enlaces |

La cadencia en este entorno es **una cota inferior** (SwiftShader, sin GPU) y
varía mucho entre ejecuciones: en dos mediciones del menú se observaron 0,27 fps
y 3,79 fps con la misma compilación. Por eso los límites de `budgets.json` son
suelos anti-regresión, no objetivos de juego, y las mediciones con menos de tres
fotogramas se informan como SKIP en lugar de darse por buenas.

### 3.b · Arnés anterior (`tools/fase01_qa`)

```bash
bash tools/fase01_qa/run.sh     # ejecutado con límite de 900 s
```

Se ejecutó y **no llegó a completarse** (el límite de tiempo cortó la suite
durante las pruebas del puente del motor). Resultados de la parte ejecutada:
mayoría de PASS y cuatro **FAIL reales**:

| Prueba | Resultado observado | Diagnóstico |
|---|---|---|
| G1 «NUEVA PARTIDA entra al juego» | `PLAYING` pero `running:false` tras 188 s | La ruta real tarda minutos en render software porque la apertura avanza por fotogramas. Es un problema de la prueba (espera fija), no del juego: `enterGame` del arnés nuevo entra en ~33 s saltando la apertura como un jugador |
| G2 «la música de menú se corta al jugar» | `true` (no se corta) | **Fallo real de audio** → Fase 2 |
| H-E4 «la navegación se anuncia como menú» | `role=null` | **Fallo real de accesibilidad**, corregido en esta fase y verificado por la suite `menu` |
| H-F1 «la secuencia es BOOT→LOADING→INTRO→MAIN_MENU» | sin `INTRO` | La expectativa era antigua: la intro pertenece a «Nueva partida». Documentado y verificado el contrato vigente |

La suite termina con `FATAL page.waitForTimeout: Target page, context or browser
has been closed` al agotarse el tiempo del proceso.

### 3.c · Build reproducible

```bash
python3 tools/build_active_html.py    # → 5.849.471 bytes
cmp index.html <copia previa>         # idéntico: el build sale de src/
```

Añadido como trabajo `build-reproducible` en `.github/workflows/qa.yml`.

## 4 · Fallos encontrados

Además de los cuatro del arnés anterior:

1. **G2 · la música del menú no se corta al entrar en partida.** Detectado por el
   arnés anterior. Es de audio: Fase 2.
2. **`refreshContinue()` es código muerto** (`src/dd_ui_system.js`): busca un
   botón `[data-action="continue"]` que el menú raíz nunca crea. CONTINUAR solo
   existe dentro de JUGAR, y así funciona. O se elimina o el menú raíz debe
   ofrecerlo; es una decisión de interfaz, no de esta fase. La suite
   `persistencia` comprueba el comportamiento real.
3. **Recuento de salidas del generador**: el encargo cita «223 salidas»; el
   generador de `src/room_generation` produce **216** (24 por planta × 9). La
   suite `semillas` fija 216 y deja la diferencia señalada, sin ajustar el código
   a ciegas.
4. **Defectos visuales** de las capturas (HUD recortado, rótulos cortados y
   solapes en 390×844): documentados con capturas en
   `docs/evidence/fase1/README.md`. Corresponden a las fases 4 y 5.
5. **El HUD del Refugio declara 9 zonas y 16 estaciones**, mientras la
   documentación de tandas anteriores habla de 6 y 11. La suite fija los valores
   medidos; conviene actualizar la documentación antigua.

## 5 · Pendiente o no verificado

- **No se ha ejecutado la CI en GitHub todavía**: el workflow está escrito y el
  mismo comando se ha ejecutado en local, pero la primera ejecución real en
  Actions se verá en el PR. Hasta entonces, «CI verde» no está verificado.
- **Ninguna suite anterior a esta fase se ha reejecutado entera** (salvo
  `tools/fase01_qa/run.sh`, truncada). El inventario de `tools/qa/README.md`
  describe su cobertura según cabecera y código, no por ejecución.
- **Audio**: solo estado lógico, sin sonido audible.
- **Mando físico**: no hay; se simula la API `Gamepad` en suites antiguas.
- **Fotogramas en hardware real**: no medidos. Todas las cifras son de render
  software y así se etiquetan en el informe y en `budgets.json`.
- **Cinemática**: cadencia no medida con fiabilidad (SKIP).
- **`docs/evidence/` está en `.gitignore`**: las capturas de esta fase se han
  añadido con `git add -f`. Si el proyecto prefiere no versionar evidencias, hay
  que decidir una ubicación alternativa.

## 6 · Cómo reproducirlo

```bash
npm ci                        # dependencias fijadas
bash tools/qa/run.sh --all    # todo
bash tools/qa/run.sh --only=plantas,semillas
node tools/qa/run.js --list
```
