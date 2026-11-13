# Plan de validación en navegador — DEADBEAT DISCO (Fase 0.2)

**Estado global de la Fase 0.2 (histórico): TODAS LAS PRUEBAS PENDIENTES. NINGUNA EJECUTADA. NINGUNA SUPERADA.**
**Actualización 2026-11-02:** la batería se ejecutó parcialmente en la Fase 0.3. Ver **sección 5** y `FASE_0_3_TEST_MATRIX.md`; este documento conserva su redacción original como plan/estado de la Fase 0.2.

Este documento **prepara** la validación; no la realiza. Se ha comprobado que en el entorno de esta fase no hay navegador (Chromium/Firefox) ni librerías de automatización (Playwright, Puppeteer, Selenium), por lo que no es posible ejecutar aquí las pruebas. Solo se han realizado comprobaciones estáticas de archivo, que se enumeran aparte en `FASE_0_2_REPORT.md` y **no sustituyen** a estas pruebas.

## 0. Condiciones previas (a preparar antes de ejecutar)

| # | Requisito | Motivo |
|---|---|---|
| P-1 | Navegador de escritorio actualizado con DevTools (consola + pestaña Network) | Observar errores JS y peticiones de red |
| P-2 | Servir `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` desde un servidor HTTP estático local, con un **origen estable** y único durante toda la batería | `localStorage` está ligado al origen; el guardado no es fiable bajo `file://` o cambiando de puerto/dominio |
| P-3 | Perfil de navegador limpio o con `localStorage` vaciado antes de empezar | Evitar partidas previas que falseen «inicio» y «guardado» |
| P-4 | Consola abierta y captura de logs; registrar también errores no capturados | Evidencia verificable |
| P-5 | Salida de audio disponible y un **gesto del usuario** (clic/tecla) para desbloquear WebAudio | Los navegadores bloquean audio sin interacción |
| P-6 | Gamepad físico conectado (y/o emulador de mando) para V-10 | La prueba de mando requiere `navigator.getGamepads()` |
| P-7 | Copia de seguridad disponible (`backups/v9_t3_fase1b_cache_probe.ORIGINAL.html`, SHA-256 en `BACKUP_MANIFEST.md`) | No modificar el original; poder comparar/restaurar |
| P-8 | No editar el HTML durante las pruebas; cualquier cambio se hace en copia y tras nueva copia de seguridad | Reglas de la fase |

> Las pruebas se ejecutan **sobre el original sin modificar**. Si se decide retirar los scripts Cloudflare en una fase posterior, la batería debe repetirse con la copia modificada y comparar resultados; ver `CLOUDFLARE_SCRIPTS.md`.

## 1. Batería de pruebas

Cada fila: **PENDIENTE**. «Observación a registrar» es lo que hay que anotar, no un resultado esperado afirmado como conseguido.

| ID | Ámbito | Objetivo | Procedimiento propuesto | Observación / evidencia a registrar | Estado |
|---|---|---|---|---|---|
| V-01 | Inicio del juego | Comprobar que la build carga y llega a un estado interactivo | Abrir la URL del HTML en el servidor local; observar portada, botón de inicio y consola durante los primeros segundos | Errores JS en consola; estado de la portada; mensajes de arranque; tiempo hasta primer frame; captura de pantalla | **PENDIENTE** |
| V-02 | Carga de assets | Comprobar que los 300 recursos `data:` se resuelven | Inspeccionar Network (no debería haber peticiones de imágenes externas) y el estado de los bundles `window.__T3B_IMAGES`, `window.__ILT_DATA`, `window.__HD_DATA`, `DDM_V5_ASSET_DATA`; forzar la aparición de sprites de arma/jefe | Nº de entradas de cada bundle, imágenes rotas, errores de decodificación, peticiones externas inesperadas | **PENDIENTE** |
| V-03 | Canvas | Comprobar dimensiones y renderizado de los 4 canvas | Verificar en DOM `#game` (480×640), `#minimap` (88×66), `#menu-canvas54` (960×540), `#ddc-fx`; comprobar que no quedan en blanco tras iniciar | Valores de `width`/`height`, contenido dibujado, `getContext('2d')` disponible, capturas | **PENDIENTE** |
| V-04 | Movimiento | Comprobar control del protagonista | Iniciar partida; usar teclado y, si aplica, controles táctiles; recorrer una sala | Respuesta a ejes, colisiones con muros, cambios de animación, ausencia de bloqueos | **PENDIENTE** |
| V-05 | Combate | Comprobar disparo, enemigos y daño | En una sala con enemigos, disparar con arma inicial y con otra del arsenal; recibir daño | Aparición de proyectiles, impacto, HUD de vidas/escudo, muerte de enemigos, errores en consola | **PENDIENTE** |
| V-06 | Generación de habitaciones | Comprobar mazmorra, muros, puertas y minimapa | Avanzar por varias salas/círculos; observar minimapa y transiciones entre salas | Variedad/disposición de salas, puertas practicables, coherencia del minimapa, `dmo-rooms` | **PENDIENTE** |
| V-07 | Transiciones | Comprobar descensos, ascensor, HUB ↔ campaña y cinemáticas | Provocar un cambio de círculo y volver al refugio; repetir con `prefers-reduced-motion` si el navegador lo permite | Duración y fases de la transición, continuidad del estado, ausencia de teletransportes o cuelgues | **PENDIENTE** |
| V-08 | Guardado y recuperación | Comprobar persistencia entre recargas | Jugar, anotar estado, recargar la página en el **mismo origen**, comprobar recuperación; inspeccionar claves `dmo_hub_v1`, `dmo_progression_v87*`, `dmodisco_*` en DevTools | Contenido de las claves antes/después, estado recuperado, duplicados, comportamiento con `localStorage` bloqueado (*shim* del bloque 1) | **PENDIENTE** |
| V-09 | Audio | Comprobar música y efectos | Tras un gesto del usuario, verificar `AudioContext` activo, cambios de tema HUB → COMBAT → BOSS y efectos de UI; probar mute | Estado del contexto, ausencia de errores de autoplay, respuesta a `DDC_COVER`/volumen, silencio al mutear | **PENDIENTE** |
| V-10 | Gamepad | Comprobar mando y navegación de menús | Conectar mando, pulsar botones, mover D-Pad/sticks; navegar menús y jugar unos segundos | `navigator.getGamepads()` no vacío, foco de menús, respuesta de ejes/botones, botones A/B | **PENDIENTE** |

## 2. Prueba transversal de los scripts residuales (registro, no eliminación)

| ID | Objetivo | Observación a registrar | Estado |
|---|---|---|---|
| V-CF | Documentar el efecto real de los dos cargadores Cloudflare (bloques 11 y 12) al servir la build | Nº de `iframe` 1×1 creados, peticiones a `/cdn-cgi/challenge-platform/scripts/jsd/main.js`, códigos de respuesta, errores de consola/CSP, impacto en V-01…V-10 | **PENDIENTE** |

Esta observación es obligatoria antes de decidir su retirada. **En la Fase 0.2 no se eliminan.**

## 3. Cómo registrar los resultados

Plantilla a rellenar **solo cuando la prueba se ejecute realmente** (añadir una fila por ejecución, sin borrar el histórico):

| ID | Fecha | Navegador + versión | Origen (URL) | Resultado (SUPERADA / FALLIDA / PARCIAL / PENDIENTE / BLOQUEADA) | Evidencia (log/captura) | Notas |
|---|---|---|---|---|---|---|
| V-01 | 2026-11-02 | Chromium Headless 153.0.8010.0 | `http://127.0.0.1:8123/backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` | PARCIAL | `FASE_0_3_EVIDENCE/01_boot_cover.png`, `log_console_network_boot.json` | 17,4 s; 0 `pageerror`; 2×404 externos (INC-003) |
| V-02 | 2026-11-02 | Chromium Headless 153.0.8010.0 | ídem | PARCIAL | `03_hub_render.png`, `05_hub_glyph_defect.png` | Assets y fuente cargan; glifos «□» (INC-004) |
| V-03 | 2026-11-02 | Chromium Headless 153.0.8010.0 | ídem | PARCIAL | `08_resized_800x600.png`, `log_combat_rooms_resize.json` | 27 canvas; redimensionado real; solapamiento HUD (INC-006) |
| V-04 | 2026-11-02 | Chromium Headless 153.0.8010.0 | ídem | PARCIAL | `log_combat_rooms_resize.json`, `log_event_listeners.json` | `px/py` vivos; faltan colisiones/límites/diagonales |
| V-05 | 2026-11-02 | Chromium Headless 153.0.8010.0 | ídem | PARCIAL (disparo: FALLIDA en este entorno) | `07_combat_state.png`, `log_combat_rooms_resize.json` | INC-001 (P1): `balas:0` pese a `pointerdown` real; `Q` sí mata |
| V-06 | 2026-11-02 | Chromium Headless 153.0.8010.0 | ídem | PARCIAL | `06_campaign_room_limbo.png`, `log_campaign_progression.json` | 12 salas, `audit() ok:true`, r0→r3; falta recorrido a pie |
| V-07 | 2026-11-02 | Chromium Headless 153.0.8010.0 | ídem | PARCIAL | `log_skip_transition.json`, `log_event_listeners.json` | 1/3 completa; 2/3 bloqueo `TRANSITION` (INC-002) |
| V-08 | 2026-11-02 | Chromium Headless 153.0.8010.0 | ídem | PARCIAL | `10_after_reload.png`, `log_audio_save_storage.json` | 4 claves persisten; caso sin almacenamiento **no probado** |
| V-09 | 2026-11-02 | Chromium Headless 153.0.8010.0 | ídem | PARCIAL | `log_hub_start_audio.json`, `log_audio_save_storage.json` | `AudioContext.state=running`, mute; sin salida audible |
| V-10 | 2026-11-02 | Chromium Headless 153.0.8010.0 | ídem | BLOQUEADA | `log_event_listeners.json` | Sin mando físico (`getGamepads()=[]`) |
| V-CF / V-11 | 2026-11-02 | Chromium Headless 153.0.8010.0 | ídem | SUPERADA | `log_console_network_boot.json`, `01_boot_cover.png` | 2 iframes + 2×404 por carga; sin impacto en arranque; scripts **no eliminados** |

> Las filas anteriores son un **índice** de las ejecuciones de la Fase 0.3. El procedimiento completo, los resultados observados, los errores de consola y la reproducibilidad están en `FASE_0_3_TEST_MATRIX.md`; las incidencias en `FASE_0_3_BUG_REGISTRY.md`; las capturas y logs en `FASE_0_3_EVIDENCE/`.

Reglas de registro:

- Solo se escribe `SUPERADA` si se ha ejecutado el procedimiento y se dispone de la evidencia indicada.
- Un error de consola, una petición de red inesperada o un bloqueo se registran como incidencia, no se omiten.
- Si no se dispone de P-1…P-8, el resultado es `BLOQUEADA`, nunca `SUPERADA`.
- Los resultados y las incidencias se anotan además en `CHANGELOG.md` siguiendo su plantilla (fecha, versión, archivos, sistemas afectados, pruebas, resultado) **cuando se produzca una modificación**; en esta fase no se ha modificado el HTML, por lo que no hay resultados funcionales que registrar.

## 4. Cobertura exigida

| Ámbito solicitado | Prueba | Estado |
|---|---|---|
| Inicio del juego | V-01 | PENDIENTE |
| Carga de assets | V-02 | PENDIENTE |
| Canvas | V-03 | PENDIENTE |
| Movimiento | V-04 | PENDIENTE |
| Combate | V-05 | PENDIENTE |
| Generación de habitaciones | V-06 | PENDIENTE |
| Transiciones | V-07 | PENDIENTE |
| Guardado y recuperación | V-08 | PENDIENTE |
| Audio | V-09 | PENDIENTE |
| Gamepad | V-10 | PENDIENTE |
| Scripts residuales | V-CF | PENDIENTE |

**Total en la Fase 0.2: 0 ejecutadas, 11 pendientes.**

---

## 5. Actualización de la Fase 0.3 (2026-11-02)

Se obtuvo un navegador real (Chromium Headless 153.0.8010.0 + playwright-core 1.64.1, instalado **fuera del repositorio**) y se sirvió el HTML original sin modificar por HTTP local. Se ejecutaron las 11 pruebas en 13 sesiones con contextos aislados.

| Ámbito | Estado Fase 0.3 |
|---|---|
| V-01 Inicio | PARCIAL |
| V-02 Assets | PARCIAL |
| V-03 Canvas | PARCIAL |
| V-04 Movimiento | PARCIAL |
| V-05 Combate | PARCIAL (disparo primario FALLIDA en este entorno) |
| V-06 Habitaciones | PARCIAL |
| V-07 Transiciones | PARCIAL |
| V-08 Guardado | PARCIAL |
| V-09 Audio | PARCIAL |
| V-10 Gamepad | BLOQUEADA (sin dispositivo) |
| V-CF / V-11 Scripts Cloudflare | SUPERADA |

**1 SUPERADA · 8 PARCIAL · 1 BLOQUEADA.** Ninguna prueba se declara SUPERADA sin ejecución. Persisten subpruebas PENDIENTES (colisiones, impacto/daño/hitboxes/recarga, jefes/eventos, CR/logros, salida audible, mando y confirmación en navegador GUI); procedimiento en `FASE_0_3_EVIDENCE/MANUAL_PROCEDURE.md`.

El entorno de esta fase sí permitió ejecutar, por lo que **la limitación «sin navegador» de la Fase 0.2 queda superada**, pero aparecen otras: sin interfaz gráfica, sin GPU real, sin audio audible y sin mando. La regla P-1…P-8 se aplica **por prueba**: la falta de P-5/P-6 bloquea V-10 y limita V-09, pero no invalida las demás. Los hallazgos P1/P2 están pendientes de confirmación en navegador de escritorio. La build conserva su SHA-256 `b2ef4ad8…d4a`; no se ha corregido ningún error, ni se han eliminado los scripts Cloudflare.

Entregables: `FASE_0_3_QA_REPORT.md`, `FASE_0_3_TEST_MATRIX.md`, `FASE_0_3_BUG_REGISTRY.md`, `FASE_0_3_EVIDENCE/`.

### Actualización Fase 0.3.1 (2026-11-02)

Diagnóstico de confirmación ejecutado con instrumentación corregida: **INC-001 e INC-002 → `NO REPRODUCIDA`** (el disparo primario sí crea proyectiles en `wa`; la transición completa en 3/3 ejecuciones con control recuperado). El `balas:0` de la Fase 0.3 medía proyectiles **enemigos**. Sin GUI en el entorno, quedan dos comprobaciones manuales breves en `FASE_0_3_1_EVIDENCE/GUI_MANUAL_CHECK.md`. Resultados y evidencias en `FASE_0_3_1_EVIDENCE/`, `FASE_0_3_TEST_MATRIX.md` (sección 6), `FASE_0_3_BUG_REGISTRY.md` (sección Fase 0.3.1) y `FASE_0_3_QA_REPORT.md` (sección 10). **Sin correcciones; build intacta.**
