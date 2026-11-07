# Informe QA — Fase 0.3: validación funcional de la build original

- Fecha: 2026-11-02 (21:37–22:42 UTC).
- Repositorio: `SER-RGV/DEADBEAT_DISCO` · Rama de trabajo: `arena/b89cd6bc-deadbeat-disco` · `main` intacta.
- Build bajo prueba: `v9_t3_fase1b_cache_probe.html`, **sin modificar** (SHA-256 `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` antes y después).
- Rol: QA Lead / Technical Game Tester. **Prioridad: estado real, no apariencia de funcionamiento.**

> **Actualización Fase 0.3.1 (2026-11-02):** se ha completado el diagnóstico de confirmación de INC-001 e INC-002 con ejecución real e instrumentación corregida. **Ambas incidencias resultan `NO REPRODUCIDAS`** en el diagnóstico automatizado; las conclusiones de las secciones 4–8 relativas a «fallo del disparo» y «transición bloqueada» quedan **rectificadas** en la **sección 10**. El texto original se conserva íntegro como histórico. No se ha corregido nada.

---

## 1. Resumen ejecutivo

Se ha conseguido **ejecutar realmente la build en un navegador** (Chromium Headless 153 + Playwright), algo que el entorno no ofrecía inicialmente. Se sirvió el HTML original por HTTP local, con contextos aislados, y se recogieron consola, Network, capturas, estado vivo del motor y listeners del DOM a través de 13 sesiones de prueba.

**Conclusión:** la build **arranca y llega a una sala de campaña**, renderiza su arte, HUD y minimapa, genera la mazmorra, permite movimiento, guarda estado y ejecuta habilidades/bajas. **No se puede afirmar que sea plenamente jugable**: el disparo primario con ratón no produjo proyectiles en las dos sesiones válidas (P1 pendiente de confirmación en GUI), la transición HUB→círculo se bloqueó en `TRANSITION` en 2 de 3 sesiones (P2), y audio audible, gamepad, jefes y recorrido completo de salas no son verificables en este entorno.

**Ninguna prueba se declara superada sin ejecución.** **Ninguna corrección se ha realizado.**

---

## 2. Entorno de pruebas y limitaciones (documentadas)

Detalle completo en `FASE_0_3_EVIDENCE/ENVIRONMENT.md`.

| Apartado | Resultado |
|---|---|
| Navegadores disponibles al inicio | **Ninguno** en PATH ni en rutas habituales; sin Chromium, Firefox, Electron ni Xvfb |
| Playwright / Puppeteer / Selenium | **No instalados** al inicio (ni Node ni Python) |
| Solución (fuera del repo) | `npm install playwright-core@1.64.1 @sparticuz/chromium@153.0.0` en `/home/user/qa_tools/`; extracción manual de libs AL2023; primer arranque falló por `libnspr4.so`, resuelto con `LD_LIBRARY_PATH` |
| Navegador usado | Chromium **153.0.8010.0** headless (`HeadlessChrome/153.0.8010.0`), SwiftShader, sin display |
| Ejecución del HTML | **SÍ**, por `python3 -m http.server 8123 --bind 0.0.0.0` (origen HTTP estable, HTTP 200, 13.380.910 bytes) |
| Consola / Network / errores JS | **SÍ** (`console`, `pageerror`, `request`, `requestfailed`, `response`, `crash`) |
| Screenshots | **SÍ**. Playwright `page.screenshot` se bloqueó (`Timeout 30000ms` esperando estabilidad de la animación); se sustituyó por `Page.captureScreenshot` vía CDP. Todas las capturas son reales |
| Introspección en vivo | **SÍ**: `DMO.read()`, `DMO.debug.state()`, `DMO_HUB.state()`, `DMO_DUNGEON.state()/audit()`, `DMO_MUSIC.audit()`, `DDC_COVER.state()`, CDP `DOMDebugger.getEventListeners` |
| Input real | **SÍ**: teclado y ratón de Playwright; eventos verificados con listener en `document_start` |
| Audio | API y estado disponibles (`AudioContext.state='running'`), pero **salida audible NO verificable**: headless y `--mute-audio` de Playwright |
| Gamepad | **NO hay dispositivo físico**: `navigator.getGamepads()=[]`, `DMO.gamepad.state().connected=false`. V-10 BLOQUEADA |
| Perfil de usuario | **No se tocó**: cada sesión usa `browser.newContext()` aislado; los datos de `localStorage` son de prueba |
| Restricción de red del sandbox | Solo hosts permitidos; las peticiones `/cdn-cgi/...` se resolvieron contra el servidor local → 404 |

**Limitaciones que afectan a la validez:** una sola familia de navegador (Chromium 153), sin interfaz gráfica, sin GPU real, sin audio ni mando. Los hallazgos P1/P2 se registran como **pendientes de confirmación en navegador GUI**; no se presentan como fallos universales del juego. Procedimiento manual en `FASE_0_3_EVIDENCE/MANUAL_PROCEDURE.md`.

---

## 3. Metodología

1. Descubrimiento del entorno y obtención de un navegador real (sin tocar el repo).
2. Servidor HTTP sobre el archivo original, contextos aislados, instrumentación de solo lectura.
3. Batería V-01…V-11 con procedimientos de input real y medición de estado en vivo.
4. Registro de cada prueba con: ID, entorno, procedimiento, resultado observado, evidencia, errores de consola, reproducibilidad y clasificación (`FASE_0_3_TEST_MATRIX.md`).
5. Clasificación de incidencias P0–P3 con pasos de reproducción, esperado/observado, evidencia y causa solo cuando hay evidencia (`FASE_0_3_BUG_REGISTRY.md`).
6. Separación explícita entre **pruebas reales**, **análisis estático** (Fase 0.2, no contabilizado) y **pruebas pendientes/bloqueadas**.
7. Verificación final de que el HTML, su copia de seguridad y `main` siguen intactos.

**Sesiones ejecutadas:** `discover`, `stage_b`, `stage_c`, `stage_d`, `stage_e`, `stage_f`, `stage_g`, `stage_h`, `stage_i`, `stage_j`, `stage_k`, `stage_l`, `stage_m` (13 scripts; uno fallido por timeout de captura y repetido tras cambiar a CDP). Cada sesión carga el HTML de nuevo (~17 s) en un contexto limpio.

---

## 4. Resultados: qué funciona, qué funciona parcialmente, qué falla, qué no se puede probar

### Funciona (ejecución real confirmada)

- **Arranque:** 17,4 s hasta `readyState=complete`, portada y menú, 41 globales del motor, `0 pageerror`, `0 crashes`.
- **Portada/menú/cinemática:** compuerta, navegación por `ENTER`, omisión manteniendo `ESC` (`skips:1`).
- **Renderizado:** 27 canvas en ejecución, `#game` activo con píxeles dibujados, HUD, minimapa, overlays, arte pixel-art y props visibles; redimensionado a 800×600 y 900×700.
- **Assets y fuente:** `#ddc-img` 1672×941 cargada, Pixelify Sans cargada, `DMO_ILT.audit()` 11/11 sin errores, bundles Base64 presentes.
- **Movimiento:** eventos de teclado reales; desplazamientos medidos en `px/py` (`A` −21, `S` +29, `D` +25; en otra sesión `D` 1250→1746); esquiva/bomba responden.
- **Mazmorra:** grafo de 12 salas, `audit() ok:true`, `bossDistance:5`, navegación `r0→r1→r2→r3`, sala «CÍRCULO I · LIMBO» renderizada con «salas 1/11» y auditoría ARQ100 `OK / errores 0`.
- **Transición:** `startCampaignFromHub(0)=true`; en la sesión buena `location:'CAMPAIGN_ROOM'`, `transitionsCompleted:1`, `transitionErrors:0`.
- **Combate (parcial):** con ganchos de QA del propio juego, `spawnEnemyAt` crea enemigo; `Q` produce `kills:1, score:28, enemies:0`; `killAll()` funciona.
- **Guardado:** `dmo_hub_v1`, `dmo_progression_v87`, `dmodisco_a11y_v1`, `dmodisco_muted_v1` escritos y **idénticos tras recarga**; con una condición de almacenamiento inyectada, la build arrancó sin errores JS (aunque la inyección **no** se mantuvo, ver limitaciones).
- **Audio (motor):** `AudioContext.state='running'` tras gesto, `DMO_MUSIC.audit().ok=true`, `filterInserted=true`, persistencia del mute.
- **Scripts Cloudflare:** caracterizados sin eliminarlos (V-11 SUPERADA).

### Funciona parcialmente

| Sistema | Limitación observada |
|---|---|
| Movimiento | `W` no desplazó en la posición de prueba; colisiones, límites y diagonales no recorridos |
| Combate | Disparo primario sin proyectiles; impacto/daño/hitboxes/recarga/cambio de arma no verificados |
| Habitaciones | Generación y navegación por API verificadas; recorrido a pie, accesibilidad y superposiciones no |
| Transiciones | Correcta en 1/3 sesiones; bloqueo `TRANSITION` >35 s en 2/3; jefes y eventos no alcanzados |
| Guardado | Persistencia de HUB/progresión/ajustes verificada; CR, logros, partida en curso y almacenamiento realmente no disponible no |
| Audio | Estado del contexto y mute verificados; salida audible, temas y efectos no |
| Assets/HUD | Carga correcta pero con glifos «□» y solapamiento del panel de arma |

### Falla (en este entorno)

- **INC-001 (P1):** disparo primario con ratón → `balas:0`, `fire:false`, `kills:0` pese a `pointerdown` real sobre `#game` (2/2 sesiones válidas). Hipótesis con evidencia: supresión del `mousedown` de compatibilidad por `preventDefault()` en `pointerdown`; **pendiente de confirmación en GUI**.
- **INC-002 (P2):** transición HUB→Círculo I estancada en `TRANSITION` (2/3 sesiones), con input de combate desactivado.
- **INC-003/004/005/006/007 (P3):** 404 de Cloudflare, glifos ausentes, `#start-btn` interceptado, solapamiento de HUD, auditoría pre-init `ok:false`.

### No se puede probar en este entorno

- **V-10 Gamepad (BLOQUEADA):** sin mando físico.
- Salida de audio audible y cambios de tema/efectos (headless + `--mute-audio`).
- Jefes, eventos de progresión, continuidad entre círculos, recorrido humano de las 11–12 salas.
- **Comportamiento con almacenamiento realmente no disponible:** se inyectó un getter que lanza `SecurityError`, pero la medición devolvió `lsProbe:"object"`, `storageAvailable:true`, `saveWrites:1`. La inyección no se mantuvo; la hipótesis del *shim* en memoria (bloque 1) no queda demostrada y el caso se declara **no probado**, no como éxito. El nombre `09_no_storage_boot.png` se aclara en el índice de evidencias.
- Comportamiento en Firefox/Safari/Chrome de escritorio y en versiones de Chromium distintas.
- Efecto real de CSP/CORS sobre los scripts Cloudflare en un hosting con el endpoint presente.

### Descartado como falso positivo (rigor de QA)

`canEnterCircle()`/`startCampaignFromHub()` sin argumento → `false` era **error del procedimiento** (con `(0)` → `true`); `balas:0` en `TRANSITION` era combate desactivado; `DMO_DUNGEON.audit() ok:false` era estado pre-generación; `DMO.read()` con retardo era artefacto de instrumentación. Ninguno se ha registrado como bug del juego.

---

## 5. Estado de la batería

| ID | Prueba | Estado |
|---|---|---|
| V-01 | Arranque | PARCIAL |
| V-02 | Assets | PARCIAL |
| V-03 | Canvas y renderizado | PARCIAL |
| V-04 | Movimiento | PARCIAL |
| V-05 | Combate | PARCIAL (disparo: FALLIDA en este entorno) |
| V-06 | Generación de habitaciones | PARCIAL |
| V-07 | Transiciones y progresión | PARCIAL |
| V-08 | Guardado y recuperación | PARCIAL |
| V-09 | Audio | PARCIAL |
| V-10 | Gamepad | **BLOQUEADA** |
| V-11 | Scripts Cloudflare | **SUPERADA** |

**1 SUPERADA · 8 PARCIAL · 1 BLOQUEADA · 0 pruebas superadas sin ejecutar.** Detalle, evidencias y reproducibilidad: `FASE_0_3_TEST_MATRIX.md`.

---

## 6. Incidencias clasificadas

| ID | Prioridad | Resumen |
|---|---|---|
| INC-001 | **P1** | Disparo primario sin proyectiles (pendiente confirmación GUI) |
| INC-002 | **P2** | Transición bloqueada en `TRANSITION` >35 s |
| INC-003 | P3 | 2 scripts Cloudflare → 2 iframes + 2×404 + 2 errores de consola por carga |
| INC-004 | P3 | Glifos «□» por cobertura de fuente |
| INC-005 | P3 | `#start-btn` interceptado por `#ddc-img` |
| INC-006 | P3 | Panel de arma solapa «CLIENTE 000» |
| INC-007 | P3 | `dungeon.audit()` `ok:false` antes de generar (sin impacto funcional) |

**P0: ninguna.** Detalle completo con pasos, esperado/observado, evidencia y causa: `FASE_0_3_BUG_REGISTRY.md`.

---

## 7. Integridad de la build y del repositorio

| Comprobación | Resultado |
|---|---|
| SHA-256 del HTML antes / después de la fase | `b2ef4ad8…d4a` / `b2ef4ad8…d4a` (idéntico) |
| SHA-256 de la copia de seguridad (Fase 0.2) | `b2ef4ad8…d4a` |
| `git diff main HEAD -- v9_t3_fase1b_cache_probe.html` | Sin diferencias |
| Scripts Cloudflare | **No eliminados**; presentes y activos (2 peticiones por carga) |
| CSS / JS / assets / mecánicas / contratos | **Sin cambios** |
| Datos de usuario | No tocados (contextos aislados) |
| `main` | No modificada |
| Correcciones | **Ninguna** |

Las únicas escrituras en el workspace son los cuatro entregables de documentación y `FASE_0_3_EVIDENCE/`. Las herramientas de prueba viven fuera del repositorio (`/home/user/qa_tools/`, `/tmp/`).

---

## 8. Decisión final (respuestas solicitadas)

1. **¿La build arranca?** **Sí.** Carga completa en ~17,4 s, portada y menú operativos, motor inicializado (41 globales), 0 errores JavaScript y 0 cuelgues. Con 2 errores de consola externos (Cloudflare 404) que no impiden el arranque.
2. **¿Es jugable?** **Parcialmente, no se puede afirmar jugabilidad completa.** Se puede entrar al menú, al Refugio y a una sala del Círculo I, moverse, guardar y usar la bomba; pero el disparo primario no se reproduce en este entorno y numerosos sistemas (audio audible, mando, jefes, recorrido completo) no están validados.
3. **¿Qué sistemas funcionan?** Arranque, portada/menú, omisión de cinemática, renderizado Canvas/HUD/minimapa y redimensionado, carga de assets y fuente (con defecto de glifos), movimiento básico, generación y navegación de la mazmorra, transición HUB→campaña (cuando completa), bajas/puntuación por habilidad, guardado `localStorage`, inicialización de audio y mute, y caracterización de los scripts residuales.
4. **¿Qué sistemas funcionan parcialmente?** Movimiento (faltan colisiones/diagonales/límites), combate (disparo primario no confirmado; falta impacto/daño/hitboxes/recarga), habitaciones (falta recorrido a pie), transiciones (latencia/bloqueo; faltan jefes/eventos), guardado (faltan CR/logros/partida en curso), audio (falta salida audible y cambios de tema), assets/HUD (defectos visuales P3).
5. **¿Qué sistemas fallan?** En este entorno: **disparo primario** (INC-001, P1) y **transición HUB→círculo en 2/3 sesiones** (INC-002, P2). Además defectos P3: glifos «□», 404 de Cloudflare, botón JUGAR interceptado, solapamiento de HUD, auditoría pre-init.
6. **¿Qué incidencias son críticas?** **Ninguna P0** (no impide arrancar ni llegar a una sala). La más alta es **INC-001 (P1)**, seguida de **INC-002 (P2)**; ambas **pendientes de confirmación en navegador con interfaz gráfica** antes de considerarlas defectos definitivos del juego.
7. **¿Qué pruebas siguen pendientes?** V-10 completa (BLOQUEADA por falta de mando); subpruebas de V-04 (colisiones, límites, diagonales), V-05 (confirmación del disparo en GUI, impacto/daño/hitboxes/recarga/cambio de arma/respuesta sonora), V-06 (recorrido a pie, accesibilidad, superposiciones), V-07 (jefes, eventos, continuidad entre círculos), V-08 (CR, logros, configuración, partida en curso **y caso real de almacenamiento no disponible**), V-09 (salida audible, temas, efectos) y confirmación de V-11 en GUI. Procedimiento en `MANUAL_PROCEDURE.md`.
8. **¿Está preparada para comenzar la reconstrucción artística?** **No en sentido estricto.** El renderizado y los assets funcionan (base positiva), pero existen dos incidencias funcionales sin cerrar (P1 disparo, P2 transición), defectos visuales de tipografía/HUD, scripts residuales sin retirar y una batería de validación incompleta (audio, mando, jefes). Recomendación: cerrar/confirmar INC-001 e INC-002 y completar las pruebas manuales antes de tomar la build como baseline artístico. Si se decide avanzar, que sea **sobre copia y de forma no destructiva**, nunca sobre el original.

---

## 9. Criterio de cierre de la Fase 0.3

| Criterio | Cumplimiento |
|---|---|
| Se ha ejecutado la batería posible | **Sí**: 11 pruebas, 13 sesiones de navegador real; V-10 BLOQUEADA por hardware |
| Cada prueba tiene un resultado verificable | **Sí**: matriz con evidencia, consola, reproducibilidad y estado |
| Las limitaciones están documentadas | **Sí**: `ENVIRONMENT.md`, sección 2 y procedimiento manual |
| Las incidencias están clasificadas | **Sí**: 7 incidencias P1–P3, sin P0, con descartes documentados |
| Se conserva intacta la build original | **Sí**: hash idéntico antes/después, sin diff frente a `main` |
| Los documentos se guardan en la rama de trabajo | **Sí**: 3 informes + directorio de evidencias, commit en `arena/b89cd6bc-deadbeat-disco` |
| Diagnóstico + procedimiento manual si el entorno no permite ejecutar | **Sí**: aunque se ejecutó gran parte, se entrega `MANUAL_PROCEDURE.md` para lo pendiente |

**No se ha realizado ninguna corrección.** **No se ha avanzado a generación de assets.**

---

# 10. Fase 0.3.1 — Confirmación de incidencias y cierre operativo

Fecha: 2026-11-02. Rama: `arena/b89cd6bc-deadbeat-disco`. Build sin modificar (`b2ef4ad8…d4a`). Entregables de evidencia: `FASE_0_3_1_EVIDENCE/` (índice, hashes y 17 capturas reales).

## 10.1 Objetivo y método

No se repitió la batería V-01…V-11. Se ejecutó un diagnóstico dirigido a las dos incidencias heredadas:

| Elemento | Valor |
|---|---|
| Entorno | Chromium Headless 153.0.8010.0 + playwright-core 1.64.1, HTTP local `127.0.0.1:8123`, contextos aislados, SwiftShader |
| GUI | **NO disponible**: `DISPLAY` vacío, sin Xvfb/Xorg/weston, sin paquete `xvfb` instalable. **No se han hecho pruebas manuales ni se han simulado** |
| Ejecuciones | 1 sesión de descubrimiento de APIs, 1 sesión INC-001 (10 + 10 intentos), **3 ejecuciones independientes** INC-002 + 1 de control con frames forzados, 1 sesión suplementaria de control |
| Instrumentación | `addInitScript` fuera del repo: observador de `Array.prototype.push` sobre la firma de proyectiles del jugador (`wa`), eventos en captura/burbuja con `defaultPrevented`, contador de `requestAnimationFrame`, `DMO.testStats().shotsFired`, `DMO.floorDrop.state()`, `DMO.debug.setInput`, `DMO.debug.tick` |
| Errores | 2×404 de Cloudflare por carga; **0 `pageerror`**, 0 crashes, 0 `transitionErrors` en todas las sesiones |

**Corrección metodológica decisiva:** `DMO.debug.state().balas`, `balasArr` y `DMO.testStats().balas` miden `Ia`, el array de **proyectiles enemigos**. Los proyectiles del jugador se insertan en `wa` y su contador es `un.shotsFired` (`DMO.testStats().shotsFired`). El overlay del propio juego («balas 0») usa la misma métrica de enemigos. La Fase 0.3 interpretó `balas:0` como ausencia de disparo: era la métrica equivocada.

## 10.2 INC-001 — Disparo primario · **`NO REPRODUCIDA`**

- **Método:** carga limpia → portada → `ENTER` → `ESC` mantenido → `startCampaignFromHub(0)` → espera a `transitionLock:false` y `transitionsCompleted:1` → 1 enemigo asistido → **10 intentos independientes con ratón real** (450 ms pulsado, 10 posiciones distintas) + **10 intentos con el control alternativo** `DMO.debug.setInput({fire:true})` → comparación con `Q` → aislamiento con `debug.tick`.
- **Entorno:** Chromium Headless 153, 1280×900, HTTP local, sin GUI.
- **Nº de ejecuciones:** 20 intentos de disparo + 1 comparación `Q` + 1 prueba de frames forzados.
- **Resultados observados:**
  - Ratón: **5 de 10 intentos generaron 1 proyectil del jugador** (`ΔshotsFired=1`, `Δwa.push=1`). Los proyectiles **entraron en el mundo** (`wa.length` 1→4), se movieron (`x=1378→1874`, `life=0.12→0.78`) y expiraron.
  - Los otros 5 intentos tuvieron 1–7 frames de rAF en 450 ms; los intentos con `Δframes=0` no pudieron ejecutar ningún tick del bucle.
  - Control alternativo: 1 de 10 intentos generó proyectil; con `debug.tick(0.016,60)` y `fire:true`, **4 disparos en un solo bloque**. La canalización de disparo funciona cuando hay frames.
  - `Q`: `kills 0→1`, `score 0→28` (control positivo coherente con Fase 0.3).
  - `pointerdown` real sobre `#game` con `pointerType:'mouse'` y **`defaultPrevented:true`** en burbuja; **no se emite `mousedown`** de compatibilidad. El juego **no lo necesita**: fija `fa=true` dentro del propio manejador `pointerdown`. **La hipótesis de Fase 0.3 sobre supresión de `mousedown` queda refutada como causa.**
  - `transitionLock:false` en los 20 intentos. El bloqueo del hook V35 (`hub.transitionLock || isFloorDropLockingControls()`) explica los `balas:0` de `stage_j`/`stage_m` de Fase 0.3, que se midieron **en `TRANSITION`** (combate legítimamente desactivado).
- **Evidencia:** `inc001_session.json`, `01_inc001_room_ready.png`, `02_inc001_mouse_attempts.png`, `03_inc001_alt_attempts.png`, `04_inc001_after_Q.png`, `RESULTS.md`.
- **Limitaciones:** sin GUI no se puede verificar la cadencia/respuesta háptica y visual en un navegador de escritorio; la cadencia observada en headless es intermitente por inanición de `requestAnimationFrame` (0–10 frames por intento), no por el sistema de armas.
- **Conclusión:** el sistema de disparo primario **sí genera el proyectil y este entra en el mundo del juego**. La incidencia P1 **no se confirma**; el síntoma `balas:0` era un artefacto de medición, agravado por sesiones en estado `TRANSITION` y por la baja cadencia de frames en headless. No es exclusiva de headless, no está causada por el método de entrada y no está causada por el estado del jugador cuando la transición ha completado.
- **Siguiente acción concreta:** comprobación manual en GUI (`GUI_MANUAL_CHECK.md`, comprobación 1): mantener clic 3 s con `transitionLock:false` y verificar que `DMO.testStats().shotsFired` aumenta de forma sostenida. Hasta entonces la incidencia permanece **abierta** con estado `NO REPRODUCIDA`; **no se corrige nada**.

## 10.3 INC-002 — Transición HUB → Círculo I · **`NO REPRODUCIDA`**

- **Método:** tres contextos nuevos e independientes; en cada uno se registra estado inicial, acción `startCampaignFromHub(0)`, sondeos cada 500 ms de `DMO_HUB.state()`, `DMO_DUNGEON.state()`, `zone`, `DMO.floorDrop.state()`, frames, `shotsFired`, consola y excepciones; se comprueba llegada a destino **y recuperación del control** (movimiento + disparo). Cuarta ejecución de control con `debug.tick` para aislar la inanición de frames.
- **Entorno:** Chromium Headless 153, sin GUI, SwiftShader.
- **Nº de ejecuciones:** **3 independientes** (+1 de aislamiento +1 suplementaria).
- **Resultados observados:**

| Ejecución | Duración hasta `tc=1` | `location` final | `inHub` | `transitionLock` | `tc` / `te` | Sala | Zona | Control |
|---|---|---|---|---|---|---|---|---|
| 1 | 54.358 ms | CAMPAIGN_ROOM | false | **false** | 1 / 0 | `r0`, visited 1, secured 1, 12 nodos | VESTÍBULO DE TURNOS · ENTRADA SEGURA | disparo +1 proyectil |
| 2 | 51.924 ms | CAMPAIGN_ROOM | false | **false** | 1 / 0 | ídem | ídem | disparo +1 proyectil |
| 3 | 53.056 ms | CAMPAIGN_ROOM | false | **false** | 1 / 0 | ídem | ídem | disparo +1 proyectil |
| 4 (frames forzados) | **4.655 ms** | CAMPAIGN_ROOM | false | **false** | 1 / 0 | ídem | ídem | movimiento +21 px, disparo +1 |

Secuencia real (ej. 1): `TRANSITION / plunge:approach` → `TRANSITION / plunge:descent` (~7,6 s) → a los ~52,8 s `CAMPAIGN_ROOM / impact:landing` **pero `transitionLock:true` y `tc:0`** → a los ~54,4 s `idle/idle`, `transitionLock:false`, `tc:1`. **El cambio de `location` no es una transición completada**: el usuario advierte expresamente contra confundir la animación con el final, y aquí se comprueba con `floorDrop.phase/stage` y `transitionsCompleted`.
- **Comprobación suplementaria** (`control_supplement.json`, transición natural de 57.158 ms): `d` → `px 1250→1275` (**+25**), con frames forzados `px 1275→1583` (**+308**), ratón → `shotsFired 0→1` con proyectil en `wa`, `Q` → `kills +1`, `score +28`. **El jugador llega al destino y el juego recupera el control.**
- **Evidencia:** `inc002_three_runs.json`, `control_supplement.json`, `05_run*_hub.png`, `06_run*_transition.png`, `07_run*_final.png`, `08_control_arrival.png`, `09_control_after_actions.png`, `RESULTS.md`.
- **Limitaciones:** las tres ejecuciones tardan ~52–54 s, muy por encima de lo esperable en GUI. La cuarta con 30 ticks/500 ms tarda 4,7 s (≈11× más rápido), y `transitionErrors=0` en todas: la evidencia apunta a **inanición de `requestAnimationFrame` en headless/SwiftShader**, no a un bloqueo lógico. Sin GUI no se puede medir la duración real en escritorio.
- **Conclusión:** la transición **termina correctamente en 3/3 ejecuciones**, sin excepciones, con sala creada/cargada y control recuperado. El «bloqueo en `TRANSITION` >35 s» de Fase 0.3 fue un **sondeo abandonado antes de tiempo** (20 s / 35 s / 5 s) en un entorno donde la transición necesita ~52 s. La incidencia P2 **no se confirma**; sí se documenta una lentitud reproducible y dependiente del entorno.
- **Siguiente acción concreta:** comprobación manual en GUI (`GUI_MANUAL_CHECK.md`, comprobación 2): cronometrar hasta `tc=1` (no hasta el cambio de `location`) y verificar movimiento + disparo. Hasta entonces la incidencia permanece **abierta** con estado `NO REPRODUCIDA`.

## 10.4 Separación exigida: resultados / hipótesis / intervención humana

| Categoría | Contenido |
|---|---|
| **Resultados observados** | 5/10 proyectiles con ratón; 1/10 con control alternativo; 4/4 con frames forzados; `wa.push` y movimiento/expiración de proyectiles; 3/3 transiciones con `tc=1`, `transitionLock:false`, sala cargada y control recuperado; 0 `pageerror`; 0 `transitionErrors`; `pointerdown` con `prevented:true` y sin `mousedown` |
| **Hipótesis (no presentadas como hechos)** | La lentitud de la transición y la intermitencia del disparo se deben a la cadencia de `requestAnimationFrame` en Chromium Headless con SwiftShader; se apoya en la comparación 52–54 s frente a 4,7 s con ticks forzados, pero **no está confirmada en GUI** |
| **Requiere intervención humana** | Cadencia/respuesta del disparo en GUI; duración real de la transición en GUI; audio audible; mando físico; jefes/eventos; colisiones y recorrido a pie |
| **Hipótesis refutada** | «El disparo depende de un `mousedown` de compatibilidad suprimido por `preventDefault()`»: el juego fija `fa` en el propio `pointerdown` y dispara igualmente |

## 10.5 Decisión de cierre: **B**

**B — Una o ambas no reproducidas: Fase 0.3.1 cerrada con limitaciones documentadas; no corregir por intuición.** Se cierra además el diagnóstico automatizado con las comprobaciones manuales exactas e instrucciones breves de `GUI_MANUAL_CHECK.md` (elemento de la opción C), sin bloquear el resto del proyecto.

- **No se prepara Fase 0.4 para corregir INC-001/INC-002**: no hay ninguna incidencia P1/P2 confirmada que corregir, y corregir por intuición un sistema que funciona introduciría regresiones.
- **No existe incidencia P1 confirmada que impida una acción esencial del jugador**: el disparo primario está verificado en runtime. Al no poder confirmarse en GUI por falta de entorno, se deja constancia y **se permite continuar con tareas artísticas independientes**, manteniendo INC-001 e INC-002 **abiertas** hasta la verificación GUI.
- Las incidencias P3 (INC-003…INC-007) y las subpruebas pendientes de V-04…V-10 de Fase 0.3 **no cambian**.
- **No se ha modificado** el HTML, CSS, JS, assets, audio, mecánicas ni los scripts Cloudflare; no se ha sobrescrito el backup; no se ha alterado el historial; `main` intacta.

## 10.6 Resumen ejecutivo de cierre (respuestas actualizadas)

1. **¿Arranca?** Sí (sin cambios respecto a Fase 0.3).
2. **¿Jugable?** Sí en lo verificado hasta la primera sala de campaña, con movimiento, disparo primario, habilidad `Q` y guardado; persisten las subpruebas pendientes de Fase 0.3 (audio audible, mando, jefes, colisiones).
3. **Sistemas que funcionan:** se añade el **disparo primario con ratón** (proyectil creado e insertado en `wa`) y la **transición HUB→Círculo I completa** (3/3).
4. **Sistemas parciales:** cadencia en headless por inanición de frames; duración de la transición en headless; resto igual que Fase 0.3.
5. **Sistemas que fallan:** **ninguno de los dos atribuidos a INC-001/INC-002**. Quedan los defectos P3 y las limitaciones de entorno.
6. **Incidencias críticas:** **ninguna P0/P1/P2 confirmada**. INC-001 e INC-002 pasan a `NO REPRODUCIDA`, abiertas hasta GUI.
7. **Pruebas pendientes:** comprobaciones 1 y 2 de `GUI_MANUAL_CHECK.md`, más las ya listadas en Fase 0.3.
8. **¿Reconstrucción artística?** No bloqueada por una P1 confirmada; se autoriza avanzar en tareas artísticas independientes, con la verificación GUI pendiente y sin tocar la build.
