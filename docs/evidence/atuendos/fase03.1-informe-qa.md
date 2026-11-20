# DEADBEAT DISCO — FASE 03.1 · informe de QA visual

**Fecha registrada por el runner:** 2026-11-20 (UTC). El reloj del entorno adelantó cinco días respecto a la fecha de esta auditoría (2026-11-15 UTC); se conserva la marca temporal bruta del JSON y no se toma como fecha civil confiable.
**Base funcional:** estado FASE 03 sobre `44a709a`.
**Resultado:** bloqueo de navegador resuelto; matriz visual **8/8 PASS** en navegador automatizado. No se creó commit de cierre. No se modificaron sprites runtime, showcases, motor, combate, IA, HUD, selector, IDs ni contratos.

## 1. Diagnóstico del bloqueo

- El árbol del proyecto tiene `playwright-core@1.65.1`, pero no el paquete `playwright` ni un navegador gestionado. `~/.cache/ms-playwright` no existe; Playwright buscaba `chromium_headless_shell-1255` y no lo encontraba.
- El ejecutable previo `/tmp/chromium` existía, pero `ldd /tmp/chromium` reportaba ausentes `libnspr4.so`, `libnss3.so` y `libnssutil3.so`. No había otro Chrome/Chromium ni Firefox en las rutas comprobadas.
- El sistema es Debian 12. `sudo -n true` confirmó que el usuario puede elevar privilegios sin prompt, pero `apt-cache` no ofrecía paquetes/candidato para `libnspr4`/`libnss3` y la simulación `apt-get -s install libnspr4` terminaba en `Unable to locate package`. No se actualizaron índices ni se instalaron paquetes del sistema.
- El repositorio ya contiene el runner portable `tools/fase01_qa/run.sh`, que evita apt y fija versiones npm: `@sparticuz/chromium@138.0.2` y `playwright-core@1.49.1`.

## 2. Solución reproducible aplicada

Se ejecutó `QA_WORK="$HOME/.dd_fase01_qa" bash tools/fase01_qa/run.sh --setup-only`.

- npm instaló los dos paquetes fijados bajo `$HOME/.dd_fase01_qa`; el paquete de Chromium incluye el archivo `al2023.tar.br` con las bibliotecas NSS.
- El runner extrajo esas bibliotecas a `$HOME/.dd_fase01_qa/al/lib` y resolvió `/tmp/chromium` mediante `@sparticuz/chromium`.
- Al lanzar el binario con `LD_LIBRARY_PATH="$HOME/.dd_fase01_qa/al/lib:/tmp"`, Chromium arrancó. Su versión ejecutable observada fue `Chromium 153.0.8010.0` (UA: `HeadlessChrome/153.0.8010.0`). El paquete npm declara `138.0.2`; se registra expresamente esa diferencia entre versión del paquete y versión reportada por el binario. La pareja fijada se probó empíricamente con el flujo de QA y control CDP funcional.
- No se hizo instalación global ni cambio de archivos del juego. El directorio de dependencias queda fuera del repositorio.
- Runner de reproducción de esta matriz: `bash tools/qa/run_phase03_visual_matrix.sh`. Inicia el setup si falta, sirve el clon localmente y llama la prueba con la versión fijada de Playwright. La comprobación HTTP sólo prepara el servidor; los PASS siguientes proceden de Chromium real, ejecución de la app, render y captura visual.

## 3. Método y límites de la prueba

- Viewport: **1280×720**. La app abre su menú normal; se recorren y capturan los ocho looks en el selector. Después se inicia Nueva partida, se salta la intro con el hook debug ya usado por la suite del proyecto, se entra al HUB y se equipa/captura cada look. La partida se ejecuta en el motor real, en modo de exploración sin enemigos para que la matriz sea determinista.
- Se recorren estados del motor y se consulta `DD_WORLD.resolvePlayerPose()` para comprobar que la imagen devuelta proviene del directorio canónico del atuendo esperado. Correr se verifica por la transición real del motor a `run`; el contrato reutiliza la cadencia/ciclo de caminata.
- `DISPARO_CARGADO`: se equipa en el contexto aislado un arco por un hook de prueba y se mantiene la entrada real de disparo; el motor llega a `charged` con `chargeT >= 0.15`. La apariencia sigue usando `aim.png`, conforme al renderer actual.
- `HABILIDAD`: se activa boost con el evento de teclado real y una carga preparada por el hook aislado. Se verifica estado `ability` y la pose outfit seleccionada. Al estar armado, el renderer reutiliza `aim.png`.
- `DAÑO` y `MUERTE`: los hooks llaman a las rutas de impacto/muerte del motor en la partida activa. El impacto reduce vida; el golpe fatal lleva vida a cero y al estado `death`; el renderer resuelve `hurt.png` y `death.png` del atuendo correcto.
- Es una prueba visual de una partida activa y sus rutas reales de animación con ayudas de test aisladas, no una campaña natural ni una prueba de IA/enemigos. El screenshot de muerte muestra además la superposición de derrota, por lo que la comprobación del fotograma de muerte se confirma por el renderer/resolved path y no sólo inspeccionando esa pantalla cubierta.

## 4. Matriz resumida

Todas las filas de selector, showcase, HUB y partida activa pasan en el JSON de resultados (`fase03-capturas/phase03-visual-matrix.json`). Cada look obtuvo PASS para IDLE, CAMINAR, CORRER, DISPARAR, DISPARO CARGADO, HABILIDAD, DAÑO y MUERTE.

| ID | Selector/showcase | HUB/IDLE | CAMINAR | CORRER | DISPARAR | CARGADO | HABILIDAD | DAÑO | MUERTE |
|---|---|---|---|---|---|---|---|---|---|
| Original | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Rapture | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Shadow | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Apocalypse | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Gunslinger | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Fight Club | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Kitchen Riot | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Street Art | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

La prueba de ciclo de cada atuendo también confirma los cuatro índices de paso del motor como secuencia visual existente `idle → walk_a → idle → walk_a`. Las poses estándar conservan alfa y alineación vertical común (caja superior y baseline auditados: Y=43/505); roll/death respetan el margen de encaje de 8 px.

## 5. Inspección visual y defectos

Se inspeccionaron las hojas de capturas y el centro de los sprites in-game a escala de ejecución. El selector muestra el showcase aprobado correspondiente al look seleccionado; las capturas del HUB e incursión coinciden con el ID equipado. Los personajes mantienen altura/punto de apoyo y transparencia esperados; se distinguen las prendas aprobadas (Shadow con capucha, Apocalypse con armadura asimétrica, Fight Club sin calzado y con torso/vendas, etc.).

**Defectos encontrados que requiriesen corrección: ninguno.** No se regeneraron ni sobrescribieron los 48 sprites; el pipeline anterior ya había demostrado que son idénticos a las copias `phase03-before/`. Tampoco se tocaron los showcases.

Limitaciones observadas del contrato actual, no corregidas: no hay un dibujo runtime específico para `RUN`, `CHARGED` o `BOOST`; se reutiliza el ciclo de caminata y las poses `aim`/`idle` existentes. No se añade un contrato ni estado nuevo por la restricción de no tocar motor/arte innecesariamente.

## 6. Evidencias y pruebas

- Capturas JPEG 1280×720, por ID: `fase03-capturas/selector-<id>.jpg`, `hub-<id>.jpg`, `game-<id>.jpg`, `death-<id>.jpg`.
- Hojas comparativas de capturas reales: [`contact-selector.jpg`](fase03-capturas/contact-selector.jpg), [`contact-hub.jpg`](fase03-capturas/contact-hub.jpg), [`contact-game.jpg`](fase03-capturas/contact-game.jpg).
- Matriz completa por ID/estado, navegador, método y errores: [`phase03-visual-matrix.json`](fase03-capturas/phase03-visual-matrix.json). Errores de navegador/requests: `[]`.
- `bash tools/qa/run_phase03_visual_matrix.sh` — **PASS**, 8/8; ejecutado con `playwright-core@1.49.1` y Chromium de `@sparticuz/chromium@138.0.2` (UA reportado arriba).
- `LD_LIBRARY_PATH="$HOME/.dd_fase01_qa/al/lib:/tmp" DD_CHROMIUM=/tmp/chromium node tools/qa/test_outfit_preview.js http://127.0.0.1:8081 .cache/review/phase03/qa` — **PASS**, selector, persistencia y ocho apariencias. (Esta suite existente carga el `playwright-core@1.65.1` local.)
- `... node tools/qa/test_outfit_portraits.js ...` — **PASS**, ocho retratos, migración y emisores.
- `... node tools/qa/test_v2m_outfits.js http://127.0.0.1:8081` — **PASS**, ocho looks y estados in-game básicos con actor de prueba.
- `... node tools/qa/test_player_animations.js http://127.0.0.1:8081` — **PASS**, boost, movimiento/disparo, golpe, daño, muerte y anclas del juego.
- `.venv/bin/python tools/qa/validate_phase03_outfits.py` — **PASS**, 48 PNG, tamaños, alfa, caja/baseline/márgenes, backups y showcases sin cambios.

## 7. Pendiente y cierre

La recuperación de Playwright y la validación visual solicitada para FASE 03.1 están completas. Quedan fuera de esta prueba una campaña natural con IA activa, prueba de enemigos/armas en todas las combinaciones y captura visual aislada de cada frame de las animaciones; no se presentan como ejecutadas. No se creó commit de cierre de FASE 03. Las copias `phase03-before/` siguen conservadas.
