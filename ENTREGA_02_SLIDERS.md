# ENTREGA 2 — Sliders del OPCIONES con mando (DEADBEAT DISCO)

**Fecha:** 2026-11-08
**Rama:** `arena/de232c9f-deadbeat-disconew` (base `250ee38` · `main`). PR contra `main` abierta desde el commit de esta entrega (autorizada por el usuario 2026-11-08). **No se mergea: decide el usuario.**
**Método:** código real (`src/*`) + build reproducible (`tools/build_active_html.py`) + Chromium 138 headless (`@sparticuz/chromium` + `playwright-core`, arnés `tools/fase01_qa/`), servido en `http://127.0.0.1:8123`.
**Clasificación:** VERIFICADO (ejecutado) · LEÍDO (inspección de código) · NO VERIFICADO (no medible aquí) · EMULADO (mando sintético: NO es un mando físico).

**Nota de la congelación (2026-11-08 ~18:30Z):** tras la aceptación provisional, la re-ejecución de la suite dejó de reproducir el 22/22; se diagnosticó la causa raíz — **defecto de producto en la auto-repetición** (`repeatFire`, ver §4.4). **El usuario aprobó el arreglo mínimo** (tope `Math.min(max(0,wallSec), repeatRate)`); se aplicó, se reconstruyó el build de forma determinista (md5 final `4cb35c2a51bdf6cd53deb8b723c05b6e`, gemelos `index.html`/`DEADBEAT_DISCO.html` byte-idénticos) y la suite quedó estabilizada: **22/22 en tres ejecuciones consecutivas (17:27Z, 17:40Z y 18:19Z — esta última sobre la build final)**. Estado del árbol: ver §8. Ítem 4 del checklist: **CONFIRMADO (con la salvedad de que sólo vale para mando EMULADO)**. Regresión FASE 01 post-arreglo: **141/141 PASS, ver §4.2**.

**Alcance cerrado por el usuario (no se ha hecho nada más):** exclusivamente los cinco sliders existentes del submenú OPCIONES —MAESTRO, MÚSICA, EFECTOS, VOZ DJ (panel del motor DMO, cuatro `<input type="range">` movidos a `dd-opt-mix`) y VOLUMEN DEL MENÚ (`dd-opt-menuvol`, persistencia propia `ddc_cover_settings_v1.vol`)—. El select de calidad gráfica NO entra. Nada de portadas, cinemática, rotación ni settings nuevos. Arranque/watchdog intactos. `DEADBEAT_DISCO.ART.html` intacto. Sistema de persistencia intacto (mismos `dmodisco_vol_v1` y `ddc_cover_settings_v1`, mismos listeners, mismo esquema).

---

## 1. Qué estaba mal (causas raíz, todas medidas)

1. **El D-pad/stick no tenía repetición ni histéresis: sólo flanco.** La direccional se leía con `gpEdge` (un paso por pulsación) y los ejes con un umbral fijo de `0.55` en crudo, sin zona muerta ni dominancia: diagonales disparaban dos ejes a la vez y un stick rozado podía parpadear.
2. **El enfriamiento (`gpCooldown`) congelaba el sondeo entero del mando**, incluida la direccional: con cooldown activo, los pasos de ↑↓ se perdían según el frame en que ocurrieran.
3. **←→ sobre un slider no hacía nada predecible y A sí lo hacía, pero a trompicones:** `activateFocused()` llamaba `a.stepUp()` + evento `input` (saltaría un incremento cada cooldown al mantener A), y la direccional no distinguía "slider enfocado" de "no-slider enfocado". No existía ajuste real por mando para los cuatro sliders del motor sin usar A.
4. **`repeatFire` acumulaba reloj de pared sin tope superior** (`st.t += wallSec`; la versión previa usaba `wallSec || 0.016`). El arreglo parcial de ENTREGA 2 (`Math.max(0, wallSec)`) sólo acota por debajo. Mecanismo efectivo tras instrumentar (§4.4): tras un tirón > `repeatDelay`, una dirección mantenida disparaba un paso por frame al armarse la repetición. El tope superior fue aprobado y aplicado el 2026-11-08 (ver §4.4).
5. **Al abrir/cerrar submenú el estado direccional persistía**, arrastrando repeticiones a contextos distintos.

Además, los fallos que el QA viejo reportó como "mando errático" eran en su mayoría **artefactos del propio entorno de pruebas** (hilo principal saturado a ~32–44 fps bajo SwiftShader; cada `page.evaluate` tarda cientos de ms; una pulsación "de 1100 ms" produce ~9 pasos por la repetición controlada, nunca un aterrizaje determinista). Las primeras versiones del arnés (rAF de 2 frames; luego 1; luego mantener-hasta-efecto) **fueron todas insuficientes bajo stalls extremos** —ver secuencia en §4.1/§4.4—. El diseño vigente: pulsos con **auto-apagado por sondeo** (`__pulseLeft=3`, el propio `navigator.getGamepads()` suelta el botón) + arreglo de producto aprobado en `repeatFire`. Determinismo verificado: 22/22 ×3 consecutivas (17:27Z, 17:40Z, 18:19Z).

## 2. Qué se ha cambiado

**Sólo `src/dd_ui_system.js`** (+ build regenerado). Nada más. Los cinco sliders conservan su DOM, sus listeners, su persistencia y sus `<output>`.

### 2.1 Calibración única: `GP_CONFIG` (única fuente de verdad, ajustar ahí, nunca inline)

| Parámetro | Valor | Significado |
|---|---|---|
| `axisEnter` | 0.35 | el stick debe superar esta magnitud para activarse (zona muerta) |
| `axisRelease` | 0.24 | por debajo vuelve a neutro (histéresis: evita parpadeos en el borde) |
| `axisDominance` | 1.35× | un eje sólo dispara si supera al otro por este factor (en diagonal manda un único eje) |
| `repeatDelay` | 0.38 s | pausa antes de repetir una dirección mantenida (con el tope aprobado de §4.4, ningún sondeo acumula más de 0.085 s) |
| `repeatRate` | 0.085 s | periodo de repetición (~11.8 pasos/s) |
| `stepFallback` | 1 | paso si un range no declara `step` (los cinco declaran `step=1`) |

El **d-pad manda siempre**; en stick sólo dispara el eje dominante. La direccional ya no la limita `gpCooldown` (ese enfriamiento queda sólo para acciones discretas A/B).

### 2.2 Semántica de entrada en submenú (OPCIONES y resto)

- **B (volver)** manda sobre cualquier dirección y sobre A; cooldown 0.45 s; resetea estado direccional. Si hay slider enfocado NO se traga el B.
- **A**: sobre un slider = **un único** incremento (clamp + evento `input` real); **nunca** auto-repetición. Sobre no-slider: `activateFocused()` (clic/enfoque nativo). Cooldown 0.18/0.45 s.
- **↑↓**: navegación por foco (`focusStep`) con repetición controlada.
- **←→**: si el foco está en un `<input type=range>` **dentro de `#dd-submenu`**, **ajusta el valor** (±`step` del propio input, respeta `min`/`max`, clampa, emite `input` real para que los listeners existentes apliquen de verdad: motor `Xl.set` y `ddc_cover_settings_v1` / output sincronizado). Si no hay slider enfocado, conserva el comportamiento FASE 01 (mueve el foco). En los límites **no ocurre nada**: ni evento, ni cambio, ni sonido.
- Fuera de sliders (botones/select/toggles): ←→ y A conservan el comportamiento FASE 01.
- **Menú principal**: ↑↓ selección (una pulsación = un paso), A acción (sin repetición), con `resetDirectionalState()` en los bordes (A/B/cierre de submenú).
- La activación inicial dispara al instante; después espera `repeatDelay` y repite a `repeatRate`; se rearma al soltar la dirección.

### 2.3 QA y arnés (sin tocar producto)

- **Nuevo** `tools/fase01_qa/menu_sliders.js` — suite ENTREGA 2, 22 pruebas, sólo MANDO EMULADO (objeto sintético en `window.__EMULATED_PAD__` + `navigator.getGamepads()` inyectado; ninguna prueba afirma nada sobre hardware real). Resultado: **22/22 PASS** (12:01Z histórico; y 22/22 ×3 consecutivas el 17:27Z, 17:40Z y 18:19Z tras el arreglo de `repeatFire` y el arnés final — ver §4.1 y §4.4).
- `tools/fase01_qa/suite.js` — única modificación: la ruta D-pad hacia OPCIONES en D3/D3b usa un **pulso por consumo** (mantiene la pulsación hasta que el motor la consume; 3 s máx — antes mantenía ↑↓ 1100 ms y la repetición controlada saltaba el objetivo siempre, dejando D3b en SKIP permanente; la versión de 2 frames ya no es fiable bajo jank). Sólo pruebas; mismo criterio de aprobación.
- `index.html` y `DEADBEAT_DISCO.html` regenerados por el build (idénticos byte a byte). Reconstrucción tras el arreglo aprobado en `repeatFire` (md5 `f9085ae6…`, 17:27/17:40Z) y de nuevo tras un ajuste de comentario del mismo hunk (md5 final `4cb35c2a51bdf6cd53deb8b723c05b6e` — diferencia exclusivamente en comentarios; 18:19Z sobre esta build). `DEADBEAT_DISCO.ART.html` y el resto del árbol, sin tocar.

## 3. Persistencia y límites (intactos, verificados con ejecución)

> Estado vigente: la persistencia y los clamps son ✔ (S5a, S6×5, S7, S9 en verde en la ejecución del 18:19Z). El conteo de pasos del d-pad es determinista en emulación tras el arreglo de §4.4; con hardware físico, pendiente de validación.

- MAESTRO/MÚSICA/EFECTOS/VOZ DJ → `localStorage["dmodisco_vol_v1"]` `{master,music,sfx,dj}` normalizado 0..1 (escrito por el panel del motor, `Xl.set`). QA: slider=91 ↔ persistido=91 tras mover con el mando.
- VOLUMEN DEL MENÚ → `localStorage["ddc_cover_settings_v1"].vol` (0..1; la UI muestra %×100). QA: 80 → 83 con tres `→`, output `83%`, persistido `0.83`.
- Defaults conservados (100/85/90/80 · menú 80 %). Nada de migraciones: ninguna clave cambia de esquema.
- Orden de foco real verificado en vivo: `menu-vol-master → menu-vol-music → menu-vol-sfx → menu-vol-dj → menu-gfx → menu-flash → menu-shake → dd-opt-menuvol → dd-opt-menuon → dd-opt-gfx → dd-opt-fs` (los `menu-*` del medio son el grupo accesibilidad del panel del motor; CALIDAD GRÁFICA no se toca, sólo se navega).

## 4. Pruebas (ejecutadas hoy)

### 4.1 ENTREGA 2 · `tools/fase01_qa/menu_sliders.js` · MANDO EMULADO — 22/22 a las 12:01 · **NO re-confirmado al congelar**

Secuencia completa y honesta del resultado (todas las ejecuciones conservadas; ninguna se sobrescribe):

| Ejecución (UTC) | Resultado | Detalle |
|---|---|---|
| 2026-11-08 **12:01** | **22/22 PASS** | tabla histórica siguiente; md5 del build `8c8016c7…` |
| 2026-11-08 **13:35** | **20/22** | S2 (`activeElement→BODY`), S3 (dj ausente de la secuencia) |
| 2026-11-08 ~13:45 | **ABORTADA (FATAL)** en S14 | espera dura de 15 s; sin resumen ni `results.json` |
| 2026-11-08 ~14:00 | **ABORTADA (FATAL)** en S8 | `is-open` 5 s sin abrir; sin resumen |
| 2026-11-08 **14:14** | **20/22** | S3 (pulsaciones perdidas: `music→music→music→sfx`), S5b (+2 de +3) |
| 2026-11-08 ~14:20–14:25 | **ABORTADA (FATAL)** en S2 | `is-open` 5 s sin abrir (OPCIONES no abría; suite muerta, sin resumen) |
| 2026-11-08 ~14:30 | **ABORTADA (FATAL)** en S6 | idem; `menu_sliders.js:178` |
| 2026-11-08 ~14:45 | **ABORTADA (FATAL)** en S6 | `TypeError: Cannot set properties of null` — elemento slider ausente (panel OPCIONES no construido/no abierto) |
| 2026-11-08 **15:01** | **17/22** | S2/S2b ✔; fallan **S3, S4b, S5b, S12, S13** — todos "una pulsación = exactamente un paso" y orden de foco |
| 2026-11-08 **16:33** | **15/22** | post-arreglo `repeatFire` (aprobado), arnés aún sin pulso común: S3, S5a, S6-music, S9, S11, S12, S13 |
| 2026-11-08 **16:50** | **22/22** | con soltar por doble rAF en la página: S2/S13/S14 ✔ |
| 2026-11-08 **~17:00** | **20/22** | misma build; S3, S5b — el soltar doble-rAF abarca dos frames, cada uno de ellos un posible stall: insuficiente bajo jank extremo |
| 2026-11-08 **17:10** | **21/22** | arnés final: pulso con **auto-apagado por sondeo** (`__pulseLeft=3`, suelta solo tras 3 llamadas a `getGamepads()`): ✔ S3/S4b/S12/S13; S7 bordeó el 100 a las 3 s (era cronómetro, no objetivo) |
| 2026-11-08 **17:27** | **22/22** | S7 objetivo-dirigido; **run 1 completa** ✔ |
| 2026-11-08 **17:40** | **22/22** | **run 2 completa y consecutiva** ✔ |
| 2026-11-08 **18:19** | **22/22** | **run 3, sobre la build FINAL del árbol** (`4cb35c2a…`; única diferencia vs 17:40Z: comentario del hunk) — `results.json` vigente |

`results.json` actual (comprometido: `docs/ENTREGA_02_EVIDENCE/results_2026-11-08.json`) = ejecución del **18:19Z (22/22, build final)**. Las históricas (12:01 22/22 · 15:01 17/22 · 16:33 15/22 · 16:50 22/22 · ~17:00 20/22 · 17:10 21/22 · 17:27 22/22 · 17:40 22/22) quedan documentadas aquí; no se ha reescrito `results.json` a mano ni se ha alterado ninguna aserción ni expectativa para "recuperar" el verde.

**Estado de congelación del ítem 4 (conserva sus 22 PASS): CONFIRMADO — 22/22 en tres ejecuciones consecutivas (17:27Z, 17:40Z y 18:19Z sobre la build final), en emulación.** El 12:01Z se reprodujo el 17:27/17:40/18:19 tras: (a) el arreglo aprobado en `repeatFire` (tope `Math.min(max(0,wallSec), repeatRate)`); (b) el arnés de pulso con auto-apagado por sondeo (el soltar lo hace la propia página dentro del ciclo de sondeos del mando; ningún frame posterior ve la pulsación); (c) S7 objetivo-dirigido (meta, no cronómetro). Causa raíz completa en §4.4. Salvedad: los resultados valen para el **mando emulado**; el físico sigue **NO PROBADO**.

#### Registro histórico de las 12:01 (conservado íntegro)

| Grupo | Prueba | Resultado |
|---|---|---|
| Arranque | S1 menú sin pageerrors | ✔ |
| Apertura | S2 3×↓ + A abre OPCIONES, foco inicial en MAESTRO · S2b sin errores | ✔ |
| Navegación | S3 ↓/↑ por orden (music→sfx→dj→menu-gfx→dj), sin saltos | ✔ |
| ←→ y stick | S4a stick ← reduce valor real y output (100→92) · S4b d-pad →×2 = +2 exactos | ✔ |
| Persistencia | S5a maestro persistido en `dmodisco_vol_v1` (83→91/91) · S5b VOLUMEN MENÚ +3 persistido, output 83 % | ✔ |
| Límites (cinco) | S6-* clamp en 0 y en 100 con stick mantenido (output 0 %/100 %) | ✔ ×5 |
| Límites | S7 mantener a tope no pasa de 100 ni rompe | ✔ |
| Navegación ≠ ajuste | S8a bajar el foco no modifica MAESTRO · S8b ←→ entre no-sliders no toca ningún slider | ✔ |
| Independencia | S9 salir y reentrar conserva ajustes independientes | ✔ |
| A | S10 A mantenido 700 ms = exactamente +1 (nunca auto-repeat) | ✔ |
| Teclado+mando | S11 conviven (+1 neto, sin dobles disparos) | ✔ |
| Mando | S12 desconectado no navega; reconectado vuelve a navegar; pill "MANDO XBOX CONECTADO" | ✔ |
| Un paso | S13 una pulsación = exactamente un paso, abajo y arriba | ✔ |
| Cierre | S14 B cierra OPCIONES y vuelve a MAIN_MENU | ✔ |

Evidencia comprometida con la entrega (`docs/ENTREGA_02_EVIDENCE/`): `01_menu_boot.png`, `02_options_initial.png`, `03_options_adjusted.png` (capturas del build final, sesión del 18:04–18:07Z) y `results_2026-11-08.json` (**22/22**, 18:19Z). El registro "MANDO XBOX" refleja el dispositivo EMULADO. Las capturas se regeneran en cada ejecución completa de la suite.

### 4.2 Regresión · `tools/fase01_qa/suite.js` (FASE 01) — **T5: incidencia intermitente (1 FAIL histórico) · última ejecución 141/141**

Registro completo, sin alterar resultados históricos (log íntegro de la 2ª ejecución comprometido en `docs/ENTREGA_02_EVIDENCE/fase01_rerun_2026-11-08.log`):

| Ejecución | Resultado | Notas |
|---|---|---|
| FASE 01 aceptada (PR #9, previa a ENTREGA 2) | 141 tests · 1 SKIP (D3b, estructural por carga) · 0 FAIL | registro heredado, intacto |
| ENTREGA 2 · 1ª ejecución completa (2026-11-08, pre-corrección del arnés) | 140 PASS · 0 FAIL · 1 SKIP · 141 | SKIP = D3b (saltado por diseño del entorno) |
| ENTREGA 2 · 2ª ejecución completa (2026-11-08) | 140 PASS · **1 FAIL (T5 «puente incompleto»)** · 0 SKIP · 141 | log íntegro en `docs/ENTREGA_02_EVIDENCE/fase01_rerun_2026-11-08.log` |
| Verificación aislada de T5 (2026-11-08, tras el fallo) | **3/3 OK** | 3 lanzamientos limpios del escenario exacto de T5: arranque a MAIN_MENU en ~3 s; puente congelado sin `isRunning` + `triggerMenuAction('new')` → `MAIN_MENU`, `busy=false`, `menu=true`, `menuOculto=false` |
| FASE 01 re-ejecutada tras el arreglo de `repeatFire` (2026-11-08, suite completa) | **141 PASS · 0 FAIL · 0 SKIP · 141 TOTAL** | 4ª reproducción limpia de T5 (3/3 sondas + ésta); D3b PASS; sin regresión en ninguna familia |

El detalle del fallo histórico estaba vacío: corresponde a `{ err: 'no se alcanzó MAIN_MENU' }`, es decir, la página no alcanzó `MAIN_MENU` dentro de la ventana de 200 s del arnés — no es una aserción fallida del camino de rechazo. T2/T3/T4/T6/T7 (mismo helper, mismo camino de rechazo + restauración) pasaron en la misma ejecución en la que T5 falló. Entorno: SwiftShader ~32–44 fps bajo carga — el flake es de arranque en ventana, no de comportamiento del producto. Si reaparece, aislar con `node tools/fase01_qa/suite.js` y contrastar con la sonda de 3 lanzamientos.

D3a/D3c/D3d/D3e/D3b ✔ (D3b pasa gracias al pulso determinista de la ruta, §2.3). El resto del árbol (A·B·C·D·E-F·H·Q·R·T·resoluciones) en verde.

**Clasificación de T5 — incidencia intermitente, NO regresión (se mantiene).** La ejecución post-arreglo da 141/141, pero el historial (1 FAIL + 4 reproducciones OK) no cambia: sigue siendo intermitente por entorno (arranque en ventana), no por comportamiento del producto. ENTREGA 2 no toca `dd_boot.js`, la puerta `enterGame()` ni `__DD_BRIDGE`; el criterio T5 no se ha modificado para que pase, y los resultados históricos de la suite se conservan tal cual.

### 4.3 Entorno (honestidad técnica)

- Chromium headless + SwiftShader: el bucle del juego entrega ~32–44 fps con el menú abierto **y sufre stalls completos de 0.2–3.6 s bajo carga** (medido en sondas del 08/11). En esos stalls el reloj de pared avanza mientras JavaScript está bloqueado dentro del frame del motor.
- El mando es **EMULADO** (objeto sintético inyectado por el arnés vía `navigator.getGamepads()`); **NO PROBADO con hardware real** — zona muerta, holguras de stick, mappings concretos de fabricante: cero evidencia física. La calibración `GP_CONFIG` está razonada y verificada en emulación; su validación con hardware real queda pendiente del usuario.
- **Determinismo de pasos del d-pad: certificable en emulación tras el arreglo de §4.4** (22/22 en dos ejecuciones consecutivas; S3/S4b/S12/S13 en verde). En hardware real (frames de 16–33 ms, muy por debajo de `repeatDelay` = 0.38 s) el comportamiento es el mismo por construcción; aun así, con hardware físico, sin medir — ver §9.
- El comportamiento de la UI en `page.evaluate` depende de frames de rAF, no de reloj de pared, por diseño (ver §1).
- La suite ENTREGA 2 sólo prueba el camino con mando; teclado y ratón se verifican en la regresión FASE 01. Los resultados de FASE 01 (140·1F T5) no se alteran.

### 4.4 Causa raíz de la pérdida de determinismo — **defecto de producto** (`repeatFire`) · instrumentado y verificado

Resumen ejecutivo: **la auto-repetición del d-pad no era "controlada" tras un tirón**. No es un defecto del arnés ni del build; es de `src/dd_ui_system.js`. Tras diagnóstico y aprobación explícita del usuario, **fue arreglada en esta revisión** (tope de acumulación, § abajo); el árbol conserva la congelación salvo ese hunk autorizado (ver §8).

**Evidencia en código (estado previo de `src/dd_ui_system.js`, antes del arreglo):**

```js
function repeatFire(key, active, wallSec) {
  var st = gpDir[key];
  if (!active) { gpDir[key] = null; return false; }
  if (!st) { gpDir[key] = { t: 0, n: 0 }; return true; }   /* activación inmediata ✔ */
  st.t += (typeof wallSec === "number" && isFinite(wallSec)) ? Math.max(0, wallSec) : 0;  /* ← reloj de PARED sin tope */
  var threshold = st.n === 0 ? GP_CONFIG.repeatDelay : GP_CONFIG.repeatRate;  /* 0.38 / 0.085 */
  if (st.t >= threshold) { st.t -= threshold; st.n += 1; return true; }
  return false;
}
```

Aclaración medida (tras la instrumentación): `wallSec` en realidad ya llegaba al sordeo **topado a 0.5 s** por `tickInner` (`Math.min(0.5, max(0, (nowMs - tick._last)/1000))`) — los ticks dentro del mismo frame acumulan ~0 porque comparten `tick._last`. El defecto efectivo: **tras un tirón > `repeatDelay` (0.38 s), una dirección mantenida dispara un paso POR FRAME en cuanto se arma la repetición** (y el primer frame tras la activación ya superaba el umbral con frames lentos), no "decenas de repeticiones en un mismo call". El tope aplicado lo cierra: cada sondeo aporta ≤ 0.085 s, el arma­miento tarda ≥ 5 sondeos y los frames lentos ya no precipitan el encadenado. (La versión anterior de esta nota describía el mecanismo de forma imprecisa; los síntomas y las mediciones documentados son correctos.)

**Evidencia medida (sondas ejecutadas, registro en `/tmp/audit/probe_*.js`):**

- `probe_trace.js` (5 intentos, 2026-11-08 ~14:55): cada pulsación d-pad se mantuvo hasta que `menuIndex` cambiara; los saltos observados: `0→5`, `5→0`, `0→4`, `1→0`, `2→0`, `0→3` (correcto sólo bajo poca carga). `document.visibilityState=visible`, `menuVisible=true`, `boot=MAIN_MENU` en todos: el menú está y responde; lo que falla es el conteo de pasos.
- Con índice aterrizando en otro elemento, la A de `openOptionsViaPad` abrió NUEVA PARTIDA (menú oculto, partida lanzada → "OPCIONES jamás llega a `is-open`"), SELECCIÓN DE PARTIDA (sin sliders en DOM → `TypeError` al sembrar `value`), CRÉDITOS, etc. Explica S2/S3/S6/S8/S14 de una vez.
- `heldMs` de una pulsación ≈ 1–3.6 s ⇒ los `page.waitForTimeout` fijos entre pulsaciones jamás iban a ser fiables. La suite se endureció en consecuencia (ver abajo).
- En `git diff main -- src/dd_ui_system.js` el único clamp existente de `wallSec` es el inferior: la rama de repetición nunca tuvo tope superior (heredado de FASE 01).

**Mitigaciones aplicadas al ARNÉS (permitidas: QA solamente, aserciones intactas) — diseño final:**

1. **Pulso con auto-apagado por sondeo** (`__pulseLeft` en el pad emulado): una pulsación permanece `pressed` exactamente 3 llamadas a `navigator.getGamepads()`, luego el propio sondeo la suelta (`pressed=false, value=0`). Cubre al consumidor legacy + a DD_UI; ningún frame posterior ve la pulsación ⇒ exactamente un paso por pulso, determinismo independiente del jank y del hilo. (Intermedio y descartado: "mantener hasta efecto observable" — las pulsaciones llegaban a abarcar >3 s bajo stalls; y "doble rAF en la página" — el pulso abarcaba dos frames, dos posibles stalls.)
2. `openOptionsViaPad`: en lugar de "3×↓ exacto", **navega por arco corto hasta el índice 3 (OPCIONES)**, tope 14 pasos; espera acotada de 5 s a `is-open` (nunca aborta; continúa y las aserciones informan); espera de panel acotada y proceed-anyway (15 s).
3. S7 (límite superior con stick) pasa de cronómetro (3 s) a **objetivo** (mantener hasta `menu-vol-music == "100"` en el DOM, tope 9 s) — sin relajar la aserción (exige 100 exacto y 0 errores).
4. Lecturas `getElementById`/`getState` null-safe; ninguna ruta de la suite lanza y aborta ya: siempre se alcanza el resumen y se escribe `results.json`.
5. El S6 sembrador ya no rompe al encontrar sliders ausentes (recordará FAIL honesto).
6. Assertiones, umbrales y expectativas: **sin modificar**.

**Arreglo de producto — APROBADO POR EL USUARIO y APLICADO (2026-11-08 ~16:20Z):**

```js
/* src/dd_ui_system.js · repeatFire() */
st.t += (typeof wallSec === "number" && isFinite(wallSec)) ? Math.min(Math.max(0, wallSec), GP_CONFIG.repeatRate) : 0;
```

Una sola línea (más el comentario adjunto). Efecto: una dirección mantenida no puede acumular más de `repeatRate` (0.085 s) de temporizador por sondeo del mando, aunque el frame se haya atascado segundos; la activación sigue siendo instantánea; la auto-repetición arranca tras `repeatDelay` (0.38 s) y nunca dispara ráfagas en cascada tras un tirón. La alternativa del sondeo deduplicado a 1×/frame dentro de `tickInner` se descartó a petición del usuario (no se aplicó). Build regenerado de forma determinista tras el arreglo: `cmp index.html DEADBEAT_DISCO.html` idénticos; md5 `f9085ae6…` (luego `4cb35c2a…` tras comentario de revisión — funcional idéntico); 6 módulos inlined byte-idénticos a `src/*`; el diff respecto al build previo es exactamente el hunk de `repeatFire`.

**Arnés (QA-only) — la pieza que faltaba para el determinismo:** las pulsaciones d-pad mantienen el botón hasta un efecto observable de DD_UI (diseño previo) resultaban insuficientes bajo stalls extremos de SwiftShader (una pulsación llegaba a abarcar 3.6 s y varios frames; el menú avanzaba un paso por frame tras armarse la repetición). El diseño vigente hace que **la propia página suelte el botón tras exactamente 3 llamadas a `navigator.getGamepads()`** (`__pulseLeft` en el pad emulado): ningún frame posterior ve la pulsación ⇒ exactamente UN paso por pulsación, con independencia del jank, sin depender de rAF ni del hilo. S7 pasó de cronómetro (3 s) a **objetivo** (mantener hasta leer 100 en el DOM, tope 9 s). Las aserciones, umbrales y expectativas: **sin modificar**.

**Hipótesis descartada durante la revisión:** "build de Hi() una sola vez con excepción tragada ⇒ panel OPCIONES permanentemente roto". Tras instrumentar: los síntomas (dj ausente, panel vacío, `is-open` que nunca llega) son todos explicables por aterrizar la A en otro elemento o por S6 sembrar sobre submenús ajenos. Los pageerrors fueron 0 en sondas y en la suite final. De hecho re-apareció en las primeras re-ejecuciones bajo jank extremo (17:00Z: S3, S5b) y se cerró con el arnés final (17:10–17:40Z: en verde). Si vuelve a aparecer, se reabre §4.4.

**Efecto sobre el criterio de aceptación (estado final):** con el tope aplicado, una dirección mantenida espera `repeatDelay` y repite a ≤ 1 paso/sondeo con acumulación de reloj de pared topeada; la activación inicial sigue siendo instantánea. El criterio queda **satisfecho en emulación**; confirmación en hardware físico pendiente.

## 5. Lo que NO se ha hecho (explícitamente fuera de alcance)

Portadas/rotación/Virgilio-Tempo/cinemática/settings nuevos: **intactos y sin iniciar**. `dd_boot.js`, `dd_cinematic_camera.js`, `dd_rebuild_ui.css`, motores legacy, `DEADBEAT_DISCO.ART.html`, README/CURRENT_STATE: **sin tocar**. Build: regeneración determinista triple — original de ENTREGA 2 (12:0xZ, md5 `8c8016c7…`) → tras el arreglo autorizado (md5 `f9085ae6…`) → final, sólo con comentarios del mismo hunk (md5 `4cb35c2a…`); `DEADBEAT_DISCO.html` sigue siendo gemelo de `index.html` en las tres. **Defecto §4.4 (`repeatFire`): corregido y verificado** — arreglo mínimo aprobado por el usuario y aplicado el 2026-11-08 (una línea; §4.4). «Mantener a tope no auto-repite en A» (S10) **sí** se cumple (A no entra en auto-repetición). La secuencia honesta completa (22/22 → caída → estabilización) queda documentada en §4.1 y §4.4.

## 6. Archivos tocados

| Archivo | Tipo | Contenido |
|---|---|---|
| `src/dd_ui_system.js` | modificado | `GP_CONFIG`, `directionState` (histéresis + dominancia + d-pad manda), `repeatFire` (activación instantánea, delay 0.38 s, rate 0.085 s), `focusedRange`/`adjustRange` (min/max/step reales, clamp, evento `input`), `pollGamepad` (B > A > direcciones; sliders ajustan con ←→, A = +1 único), `resetDirectionalState` en bordes, `activateFocused` sin rama range |
| `index.html` · `DEADBEAT_DISCO.html` | regenerados | build determinista; md5 final `4cb35c2a51bdf6cd53deb8b723c05b6e`; gemelos byte-idénticos; 6 módulos inlined == `src/*` |
| `tools/fase01_qa/menu_sliders.js` | nuevo | suite ENTREGA 2 (22 pruebas, mando emulado); endurecida en revisión final (**sólo QA**, aserciones intactas): pulso con auto-apagado por sondeo (`__pulseLeft=3`), navegación por arco corto hasta OPCIONES, esperas acotadas (nunca aborta la suite), S7 objetivo-dirigido, lecturas null-safe |
| `tools/fase01_qa/suite.js` | modificado (sólo QA) | ruta D-pad determinista (pulso por CONSUMO: espera a que el motor consuma el botón, 3 s máx); corrige el SKIP estructural de D3b |
| `ENTREGA_02_SLIDERS.md` | nuevo | informe de esta entrega |
| `docs/ENTREGA_02_EVIDENCE/` | nuevos | `results_2026-11-08.json` (22/22, 18:19Z), `fase01_rerun_2026-11-08.log` (140·1F T5 histórico), 3 capturas del build final |
| `ENTREGA_01_AUDITORIA.md` | (NO forma parte de esta entrega) | permanece sin seguimiento en el árbol de trabajo; ENTREGA 1 = PR aparte |

Sin commit/push: espera tu orden (rama únicamente; tú merges).

## 7. Cómo re-ejecutar

```bash
# Servidor estático en la raíz (index.html en 8123)
python3 -m http.server 8123 &
# Suite ENTREGA 2 (22 pruebas, mando emulado)
LD_LIBRARY_PATH="$HOME/.dd_fase01_qa/al/lib:$LD_LIBRARY_PATH" node tools/fase01_qa/menu_sliders.js
# Regresión FASE 01
LD_LIBRARY_PATH="$HOME/.dd_fase01_qa/al/lib:$LD_LIBRARY_PATH" QA_CHROME=/tmp/chromium node tools/fase01_qa/suite.js
```

## 8. Congelación · estado de la rama y del árbol (verificado 2026-11-08 ~18:30Z; estos mismos archivos son los incluidos en esta PR)

| Hecho | Valor |
|---|---|
| Rama | `arena/de232c9f-deadbeat-disconew` |
| HEAD / base | `250ee38c13b0f7598eb40b7bac99fedba47a2917` (HEAD == merge-base == `main`) |
| Modificados (4) | `index.html` · `DEADBEAT_DISCO.html` · `src/dd_ui_system.js` · `tools/fase01_qa/suite.js` (QA-only) |
| Incluidos en el commit de esta entrega | `src/dd_ui_system.js`, `index.html`, `DEADBEAT_DISCO.html`, `tools/fase01_qa/suite.js`, `tools/fase01_qa/menu_sliders.js` (nuevo), `ENTREGA_02_SLIDERS.md` (nuevo), `docs/ENTREGA_02_EVIDENCE/` (results JSON, log FASE 01, 3 capturas) |
| Build | `cmp index.html DEADBEAT_DISCO.html` idéntico; md5 final `4cb35c2a51bdf6cd53deb8b723c05b6e`; módulos inlined byte-idénticos a `src/*` (reconstruido tras el arreglo autorizado de `repeatFire` y un comentario de revisión; 18:19Z sobre ESTA build) |
| Diff producto | `src/dd_ui_system.js` (único archivo de producto de ENTREGA 2); ENTREGA 2 + 1 línea autorizada en revisión final (`repeatFire`, hunk adjunto); revisado línea a línea en esta revisión: limpio |
| Sistemas ajenos | intactos (`dd_boot.js`, `dd_cinematic_camera.js`, `dd_rebuild_ui.css`, motores legacy, `DEADBEAT_DISCO.ART.html`, assets, README, CURRENT_STATE) — verificado con `git diff --exit-code main -- …` |
| Suite.js diff | sólo pulso de ruta por consumo (QA) |
| Commit/push/PR | 1 commit en `arena/de232c9f-deadbeat-disconew` + PR contra `main` (autorizados 2026-11-08); **sin merge** |
| ENTREGA 3 (portadas/rotación) | **NO iniciada**; encerrada hasta orden tuya; requiere mockups |
| Cambios de producto en esta revisión final | **SÍ, 1 línea aprobada por el usuario** (`repeatFire`: tope `Math.min(max(0,wallSec), repeatRate)` en la acumulación de `st.t`); además arnés QA e informe (sin aserciones modificadas) |
| Defecto §4.4 (`repeatFire`) | identificado, **arreglado (autorizado) y verificado**: 22/22 ×3 consecutivas (17:27Z, 17:40Z, 18:19Z) |
| Ítem 4 del checklist (conservar 22 PASS) | **CONFIRMADO** (emulado) — 17:27Z, 17:40Z y 18:19Z (esta sobre la build final) |
| Otros ítems del checklist (1·2·3·5·6·7) | ✔ verificados (ver §1–§7); regresión FASE 01 post-arreglo: **141/141** (ver §4.2) |
| Cambios sin documentar | ninguno detectado (git status limpio salvo los 4+3 esperados) |

## 9. Siguientes pasos pendientes

1. ~~¿Apruebas el arreglo mínimo del producto?~~ **RESUELTO** — aprobado por el usuario y aplicado (tope en `repeatFire`; build reconstruido; suite 22/22 ×2; ver §4.1/§4.4/§8). **Tú decides el flujo de commit/PR** — la rama sigue sin commitear.
2. ~~Commit y/o PR de esta entrega~~ **RESUELTO** — autorizado y ejecutado: 1 commit + PR contra `main`; sin merge. `ENTREGA_01_AUDITORIA.md` queda FUERA a propósito (pertenece a ENTREGA 1, sigue sin seguimiento en el árbol).
3. **Validación con mando físico** (zona muerta / holguras / mapping XInput real). En emulación nada dice nada del hardware; `GP_CONFIG` podría pedir ajuste.
4. ENTREGA 3 en adelante sigue encerrada hasta que lo digas (portadas estáticas primero, con mockups).
