# DEADBEAT DISCO — Revisión final previa a merge

**Fecha:** 2026-11-07 · **Rama:** `arena/4753409a-deadbeat-disconew` · **Base:** `19e38ad1f32e713acfde92a3d3e894cf883cdd5b`
(`arena/14b148dc-deadbeat-disconew`) · **Destino de la PR:** `main` (sin merge).

**Commits de código y build:**
`d12d8476708e491eb234341d25e53bf2a64f6d4a` (guard: capture por objeto, duplicados,
retirada) y `90440fbd8441efc36043179c05060eff7b3cdfee` (guard: AbortSignal).
**Commit del informe:** el que encabeza esta PR (se indica en el cuerpo de la PR).

No se ha reconstruido ni rediseñado nada: el cambio de código se limita al
KEYBOARD TAKEOVER GUARD del puente HD, tal y como pedía el punto 1, y el resto
del trabajo es build reproducible, pruebas y evidencia.

---

## 1. Resumen ejecutivo

| Área | Resultado |
|---|---|
| Keyboard Takeover Guard | **4 incumplimientos de contrato** corregidos: capture por objeto, duplicados, listeners imposibles de retirar y **fugas de registro con `AbortSignal`**. Todos eran **latentes**: el código actual no los disparaba. |
| Build | Reproducible byte a byte desde el backup protegido; `index.html` ≡ `DEADBEAT_DISCO.html`; sin duplicación de módulos; CSS y JS autocontenidos. |
| Assets | 227 rutas referenciadas, **227 presentes** (14 directorios, 14,09 MB). Ninguna imagen sustituida ni regenerada. |
| Regresión | Guard **30/30**, integración con el motor **4/4**, flujo completo **16/16**, **0 `pageerror`**, 0 errores HTTP. |
| Git | `main` intacta, sin merge, push solo a la rama de la PR. |
| **Veredicto** | **APROBAR el merge** (con los riesgos de la §7 documentados). |

Dato clave para la decisión: **el flujo completo ya pasaba 16/16 antes de las
correcciones**. Los defectos del guard no rompían la partida hoy; rompían su
*contrato* y habrían aparecido en cuanto alguien registrase un listener de
captura con objeto de opciones, lo registrase dos veces, intentase retirarlo o
usase `AbortSignal`. Por eso las correcciones son de endurecimiento, no parches
de urgencia. Ningún registro del juego usa hoy `signal` (auditado), así que la
fuga de la §2.5 también era latente.

---

## 2. Keyboard Takeover Guard (punto 1)

### 2.1 Qué hay instalado

El puente HD inyecta en el `<script>` #29 del backup un guard que sustituye
`window.addEventListener`. Su misión: mientras `body.dd-highres-edition` está
activo, neutralizar los listeners de **captura** de `window` para
`keydown`/`keyup` que registra el cover heredado `ddc`, que llaman a
`stopImmediatePropagation()` con su flag interno bloqueado y se comen **todo**
el teclado antes de que el menú HD, el HUB o la cinemática lo vean.

Auditoría estática del build (script de conteo con paréntesis balanceados, no
`grep`):

| Métrica | Valor |
|---|---|
| Listeners de teclado en el build | 11 |
| De ellos, en fase de captura | 3 (`document` + los 2 del cover en `window`) |
| Registrados con `{capture:true}` (objeto) | 0 |
| Llamadas a `removeEventListener` en el código del juego | **0** (solo existen dentro del guard) |
| Listeners de captura en los 5 módulos `src/dd_*.js` | 0 |
| Input del motor (WASD/disparo) | fase de burbuja, nunca envuelto |

Conclusión de partida: el guard **acertaba con el único caso que hoy existe**
(`capture === true` booleano) y los tres huecos restantes eran latentes.

### 2.2 Defectos encontrados (evidencia antes/después)

Arnés unitario que **extrae literalmente** el guard de `index.html` y lo evalúa
en una página sin el cover, para medir el contrato sin interferencias
(`tools/qa/final_review.js`, bloque A). Evidencia:
`ART_EVIDENCE/final_review/01_before_guard_fix.json` vs `03_final_regression.json`.

| # | Defecto | Antes | Después |
|---|---|---|---|
| D1 | `capture` por objeto `{capture:true}` no se neutralizaba | `B…` **FAIL**, `hits=1` en modo HD (el secuestro heredado seguía vivo) | **PASS**, `hits=0` |
| D2 | Registro duplicado de la misma función | `C…` **FAIL**, `hits=2` (entrega doble) | **PASS**, `hits=1` |
| D3 | `removeEventListener` no se parcheaba → wrapper irretirable | `A3`/`B3` **FAIL**; peor: un listener filtrado seguía vivo y **mataba todas las teclas** (`F…` **FAIL**, `hits=0`) | **PASS** (`A3`, `B3`, `F`, `C2`), registro de vuelta a la línea base |
| D4 | Sin marcador de estado ni idempotencia | `guard.exposes-state` **FAIL** (`undefined`) | **PASS**; reinstalar el fragmento es inerte (`G`) |
| D5 | Sin soporte de `AbortSignal` → **entradas fantasma**, fuga sin cota y **re-registro bloqueado para siempre** | `H2`, `H3`, `H3b`, `H4`, `H7`, `H7b` **FAIL** (hasta `count()=30` tras 30 ciclos) | **PASS** (detalle en §2.5) |

Resultado del bloque A (D1–D4): **9/17 antes → 17/17 después**.
Añadiendo el bloque H de `AbortSignal` (§2.5): **24/30 antes → 30/30 después**.

### 2.3 Corrección aplicada (quirúrgica, en el generador)

`tools/build_active_html.py`, bloque `DD_KEYBOARD_GUARD:BEGIN/END`:

- se acepta `true` **y** `{capture:true}` como captura, conservando
  `once`/`passive`/`signal` del objeto de opciones;
- registro interno `(type, fn) → wrapper`: el alta duplicada es un no-op (como
  la especificación DOM) y el **baja es simétrica** mediante
  `removeEventListener` parcheado con la misma firma;
- `once` se respeta y limpia el registro;
- el parche es **idempotente** (`window.__DD_KEY_GUARD__`) y expone
  `count()` / `capturesLegacyKeyboard()` para poder auditar fugas;
- condición de actuación **sin cambios**: `this === window` + `keydown|keyup` +
  captura. No se toca la burbuja del motor, ni listeners de elementos o de
  `document`.

### 2.4 Comportamiento original conservado al desactivar HD

Comprobado contra el motor real (`03_final_regression.json`, bloque B):

| Comprobación | Resultado |
|---|---|
| `B1` HD activo: el cover ya no traga el `keydown` | `marks=["bubble"]`, `defaultPrevented=false` |
| `B2` HD desactivado: secuestro heredado restaurado | `marks=[]`, `defaultPrevented=true` — idéntico al comportamiento original |
| `B4` registro del guard en la build real | `count=2` (los dos listeners del cover), `neutralized=true` |
| Anti-fuga tras el flujo completo (2 descensos) | `count=2` — sin fugas |

---

### 2.5 AbortSignal (revisión solicitada)

Cuando el navegador retira un listener por `AbortSignal`, el registro interno
del guard no se enteraba: la entrada se quedaba para siempre. Dos consecuencias,
una de ellas **funcional**:

1. `count()` filtraba entradas obsoletas (fuga sin cota: 30 ciclos → 30 entradas).
2. La comprobación de duplicado (`findIndex(type, fn) >= 0`) trataba el callback
   como «ya registrado» y devolvía sin registrar nada: **esa función ya no se
   podía volver a añadir nunca**.
3. Un `AbortSignal` ya abortado antes del registro creaba una entrada fantasma
   aunque el navegador no registraba nada — y, por el punto 2, bloqueaba
   cualquier alta posterior válida.

Evidencia medida sobre el build anterior (`eaf607c5…c09b`, guard 24/30) y sobre
el build corregido (`483fc9c9…953c`, guard 30/30) — ficheros
`04_signal_before_fix.json` y `05_final_regression.json`:

| Caso solicitado | Comprobación | **Antes** | **Después** |
|---|---|---|---|
| 1. Registro con `{capture, signal}` | `H1` | PASS (`count 0→1`, compuerta HD respetada) | PASS (`count 0→1`, `entregasEnHD=0`, `entregasFueraHD=1`) |
| 2. `signal` **ya abortado** antes del registro | `H3` / `H3b` | **FAIL**: `count=1` fantasma y el alta válida posterior **no entrega** (`entregas=0`) | PASS: `entregas=0`, `count=0`; el alta posterior entrega (`entregas=1`, `count=1`) |
| 3. `signal` abortado **después** del registro | `H2` | **FAIL**: `count tras abort=1` | PASS: `count tras abort=0`, `entregas=1` |
| 4. Re-registrar la misma función tras el abort | `H4` / `H4b` / `H4c` | **FAIL**: deduplicado, `entregas=1` (no llega a 2) | PASS: `count=1`, `entregas=2`; retirada manual `count=0`; abort posterior a la retirada `count=0` |
| 5. Registro con `once` | `H5` / `H5b` | PASS (`entregas=1`, `count=0`) | PASS (`entregas=1`, `count=0`; con HD activo: `entregas=0` y entrada retirada) |
| 6. Retirada manual tras registrar con opciones | `H6` | PASS (`entregas=0`, `count=0`) | PASS (`entregas=0`, `count tras retirar=0`, `count tras abort=0`) |
| 7. Ausencia de entradas obsoletas en `count()` | `H7` / `H7b` | **FAIL**: `count=30` tras 30 ciclos registro/abort | PASS: `count=0` (base 0) y vuelta a la línea base |

Resumen: **3 de los 7 casos estaban rotos** (2, 3 y 4), el 7 era su síntoma
acumulado, y los casos 1, 5 y 6 ya funcionaban correctamente.

Corrección aplicada (12 líneas netas, **todo dentro del guard**, sin tocar su
condición de actuación `window` + captura + `keydown`/`keyup`):

- `dropEntry(entry)` retira la entrada **concreta por identidad** y desengancha
  su hook de `abort`, para que una señal vieja no pueda desalojar un registro
  nuevo del mismo callback;
- señal ya abortada al registrar: **no se registra nada** ni se crea entrada
  (semántica del navegador), así que tampoco bloquea altas futuras;
- señal válida: se engancha `"abort"` con `{ once: true }`, que retira la
  entrada del registro;
- `once` y la retirada manual usan `dropEntry`, incluido el desenganche del hook.

Nota de alcance: **ningún registro del juego usa hoy `signal`** (auditoría del
build: 0 llamadas con `signal` fuera del propio guard), por lo que D5 era
latente, igual que D1–D3. No se ha añadido ninguna función nueva a la API del
guard: siguen siendo `installed`, `capturesLegacyKeyboard()` y `count()`.

## 3. Build (punto 2)

Generador oficial ejecutado **desde el backup protegido**
`backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html`:

| Comprobación | Resultado |
|---|---|
| Hash del backup antes y después del build | `1fd4bc59b6db149bcc58622a3079ef0ebbce276eb6b38b7126d2d56aa999f53e` (5.006.181 B) — **intacto** |
| `index.html` ≡ `DEADBEAT_DISCO.html` | **Idénticos**, `483fc9c9675d05dddae7ad9e2fd278a3448fcd5e127f2419d6ad2a338696553c` (5.234.728 B) |
| Regeneración repetida | **Byte a byte idéntica** (hasta 4 ejecuciones, mismo SHA-256, también tras el arreglo de `AbortSignal`) |
| Duplicación de módulos | Cada artefacto inlineado aparece **exactamente 1 vez**: `dd_rebuild_ui.css`, `dd_asset_registry.js`, `dd_world_renderer.js`, `dd_hub_system.js`, `dd_cinematic_camera.js`, `dd_ui_system.js`. El generador **aborta** si alguno aparece ≠1 vez o si el guard no queda instalado exactamente una vez. |
| Diff respecto al build anterior | Solo el bloque del guard (líneas ~5899-5990); nada antes del guard cambia, ni CSS, ni módulos, ni HTML del motor |
| Builds de referencia | `cc3bf39b…dcd5` (5.230.025 B, base de la primera revisión) · `eaf607c5…c09b` (5.232.970 B, guard D1–D4) · **`483fc9c9…953c` (5.234.728 B, final con D5)** |
| Original protegido v9 | `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` — sin tocar |
| Backup pre-reparación | `d87e2bd9ecba06812a521518ced1749575443f1db0fb5c5e2433576feb80d7f4` — sin tocar |

> Nota: el generador imprime `Size: 5229274` = **caracteres**; el fichero en
> disco son 5.234.728 **bytes** UTF-8. No es una discrepancia.

### Autocontención en CSS y JavaScript

| Comprobación | Resultado |
|---|---|
| `<script src="…">` en la build | **0** |
| `<link rel="stylesheet">` / `@import` | **0** / **0** |
| Bloques `<style>` / `<script>` inline | 24 / 11 |
| Prueba «solo `index.html`» (`selfcontained.json`): se sirve **únicamente** el HTML y todo lo demás responde 404 | Arranca, menú HD visible (5 botones), **HUB entra**; **0 peticiones a `src/` o `ART_PACK/`**, **0 peticiones externas** (las 40 restantes son `data:` embebidos); **0 `pageerror`** con 232 imágenes 404 (degradan al dibujo procedural) |

Conclusión: **CSS y JavaScript son autocontenidos**. El único arte que se pide
por red es `assets/` (ver §4).

---

## 4. Assets (punto 3)

| Comprobación | Resultado |
|---|---|
| Rutas `assets/…` distintas referenciadas en la build | **227** |
| Presentes en disco | **227/227** (0 ausentes) |
| Entradas del manifiesto `src/dd_asset_registry.js` | 225/225 presentes |
| Extra (fallbacks de referencia) | `assets/references/REF_01…png`, `REF_02…png` |
| Peso total | **14,09 MB** |
| `file://` (doble clic, mismo directorio) | **225/225 assets cargados, 0 errores**, menú visible, guard instalado |
| Imágenes sustituidas o regeneradas | **Ninguna** (`git status` no toca `assets/`, `ART_ASSETS/`, `ART_PACK/`) |

### Rutas que deben publicarse junto a `index.html`

Se debe desplegar el árbol `assets/` completo, con estas 14 carpetas (227
ficheros, 14,09 MB):

```
assets/bosses/        42 ficheros
assets/props/         30
assets/enemies/       24
assets/effects/       20
assets/pickups/       20
assets/characters/    16
assets/weapons/       16
assets/ui/            14
assets/floors/        12
assets/cinematics/    11
assets/walls/         10
assets/environments/   8
assets/logos/          2
assets/references/     2
```

Si se publica `index.html` sin `assets/`, la build **arranca y juega** (probado
en `selfcontained.json`) pero pierde toda la ilustración HD y cae al dibujo
procedural del motor: es un despliegue incorrecto, no un fallo de arranque.

---

## 5. Regresión (punto 4)

Entorno: **Chromium headless 153.0.8010.0**, 1440×900, SwiftShader. Arnés
`tools/qa/final_review.js`; evidencia canónica
`ART_EVIDENCE/final_review/03_final_regression.json`.

### 5.1 Flujo completo (16/16, 0 `pageerror`, 0 errores HTTP)

Re-ejecutado **después** del arreglo de `AbortSignal`: guard **30/30**,
integración **4/4**, flujo **16/16** (evidencia `05_final_regression.json`).

| Paso | Resultado medido |
|---|---|
| `menu.visible` | `display=flex`, 5 botones, `hd=true`, cover heredado `display=none` |
| `menu.keyboard-nav` | `hub -> play` (las flechas **sí** llegan al menú HD) |
| `menu.enter-hub + cinematic` | cinemática `intro`, duración 4,4 s |
| `cinematic.skip -> HUB` | `hubActive=true`, cinemática cerrada |
| `hub.no-run => engine not paused` | `paused=false`, `running=false` (no se inventa una pausa sin partida) |
| `hub.keyboard-move` | `x: 880 -> 951` (WASD real, no sintético) |
| `hub.emulated-gamepad-move` | `x: 951 -> 966` con **mando emulado** |
| `hub.walk-to-descent-pad` | `nearStation="descent"` en `(880, 701)` |
| `hub.descent-interact [E]` | HUB inactivo, cinemática `circle` (2,9 s) |
| `descent.cinematic -> run` | `running=true`, `room=0`, cinemática cerrada |
| **`run.pause released after descent`** | **`paused=false`**, `snapshot.paused=false`, `running=true` |
| `run.keyboard-move` | el protagonista se desplaza (`delta=10,7` px con rAF limitado) |
| `run.simulated frames + fire` | 40 frames simulados, 1 enemigo, **no muere**, `hp=3` |
| `run.re-enter HUB` | `paused=true` con la partida viva (congelada, no se muere detrás de la cámara) |
| **`second descent releases pause`** | **`pausedAfter=false`**, `running=true` |
| `run.stable after descent` | `paused=false`, `running=true`, sin muerte, **registro del guard = 2 (sin fugas)** |

### 5.2 Partida normal después de salir del HUB

Verificado dos veces (primera salida y segunda salida tras re-entrar al HUB):
`running=true`, `paused=false`, movimiento con WASD, disparo y simulación de
frames, HUD y minimapa activos, 0 excepciones. Capturas reales en
`ART_EVIDENCE/final_review/step_1_menu.png`, `step_2_hub.png`, `step_3_run.png`.

### 5.3 Pausa del motor

La pausa que pone el HUB (`__DD_BRIDGE.setPaused(true)`) se libera en
`DD_HUB.exitToRun → triggerRun → setPaused(false) → startRun()`. Comprobado:
- entrar al HUB **sin** partida viva → `paused=false` (no queda pausa pegada);
- entrar al HUB **con** partida viva → `paused=true`;
- descender → `paused=false` en las dos salidas consecutivas.

### 5.4 Mando

**Mando EMULADO** sustituyendo `navigator.getGamepads` (ejes + botón A). El HUB
responde y el `[E]`/`(A)` de estación no se ha validado con hardware.
**No se declara probado un mando físico.**

---

### 5.5 Clasificación de las pruebas

| Tipo | Qué entra aquí | Evidencia |
|---|---|---|
| **Automatizado** (aserciones, navegador real headless) | Guard 30/30 (bloques A–H, incluidos los 7 casos de `AbortSignal`); integración con el motor 4/4; flujo 16/16 con teclado real, cinemática, HUB, descenso y pausa; autocontención CSS/JS; `file://` con 225/225 assets | `01`–`05_*.json`, `selfcontained.json` |
| **Emulado** | **Mando**: `navigator.getGamepads` sustituido por un pad sintético (ejes + botón A). Botón A de estación no ejercitado. | `05_final_regression.json` → `hub.emulated-gamepad-move`, nota `"mando EMULADO"` |
| **Pendiente de hardware físico** | Mando físico real; GUI real (aquí solo headless); audio audible; rendimiento/FPS y rAF en hardware (SwiftShader no es representativo); comportamiento con DPR real ≠ 1 | — (no cubierto) |

## 6. Archivos modificados y añadidos

### 6.1 Diff completo de la PR contra `main` (23 ficheros)

La PR parte de `19e38ad` (commit de la sesión anterior, **todavía no presente en
`main`**), por lo que su diff contra `main` incluye **dos grupos**:

**(a) Heredado de `19e38ad` — 10 ficheros** (build reparada, HUB y controles;
revisado aquí pero no modificado en esta revisión salvo por el guard):

`BACKUP_MANIFEST.md` · `CHANGELOG.md` · `index.html` · `DEADBEAT_DISCO.html` ·
`backups/index_PRE-HUBFIX_2026-11-07.html` · `src/dd_hub_system.js` ·
`src/dd_rebuild_ui.css` · `src/dd_ui_system.js` · `src/dd_world_renderer.js` ·
`tools/build_active_html.py`

**(b) De esta revisión — 16 ficheros** (detalle abajo). `index.html`,
`DEADBEAT_DISCO.html` y `tools/build_active_html.py` aparecen en **ambos**
grupos, por lo que los subtotales no suman el total.

### 6.2 Commit `d12d8476708e491eb234341d25e53bf2a64f6d4a`

| Fichero | Cambio | Δ |
|---|---|---|
| `tools/build_active_html.py` | guard endurecido + invariantes de build | +98 / −10 |
| `index.html` | build regenerada (`eaf607c5…c09b`) | +83 / −10 |
| `DEADBEAT_DISCO.html` | idéntica a `index.html` | +83 / −10 |
| `tools/qa/final_review.js` | **nuevo** arnés guard + integración + flujo | nuevo |
| `tools/qa/selfcontained.js` | **nuevo** arnés de autocontención y `file://` | nuevo |
| `ART_EVIDENCE/final_review/` | **nuevo**: 4 JSON, 3 capturas (5,0 MB), README | nuevo |

### 6.3 Commit `90440fbd8441efc36043179c05060eff7b3cdfee` (AbortSignal)

| Fichero | Cambio | Δ |
|---|---|---|
| `tools/build_active_html.py` | `dropEntry`, señal ya abortada, hook `"abort"`, contrato en el comentario | +35 / −6 |
| `index.html` | build `483fc9c9…953c` | +35 / −6 |
| `DEADBEAT_DISCO.html` | idéntica a `index.html` | +35 / −6 |
| `tools/qa/final_review.js` | bloque H: 13 comprobaciones de `AbortSignal` | +114 / −1 |
| `ART_EVIDENCE/final_review/04_signal_before_fix.json` | **nuevo**: guard 24/30 antes del arreglo | nuevo |

### 6.4 Commit del informe

`REVISION_FINAL_PRE_MERGE.md` (actualizado) · `ART_EVIDENCE/final_review/05_final_regression.json`
(**nuevo**: guard 30/30) · `selfcontained.json` y capturas `step_1…3` regeneradas
sobre el build final · `README.md` de la evidencia.

Sin cambios en `src/`, `src/dd_rebuild_ui.css`, `assets/`, `ART_ASSETS/`,
`ART_PACK/`, backups ni documentación histórica.

---

## 7. Riesgos pendientes y no verificados

| # | Riesgo | Impacto | Estado |
|---|---|---|---|
| R1 | **Sin GUI ni mando físico**: todo headless y con mando emulado | Medio | No verificado |
| R2 | Rendimiento en SwiftShader no representativo (rAF limitado; el desplazamiento por `dt` sale ralentizado) | Medio | No verificado en hardware |
| R3 | `assets/` es obligatorio en el despliegue (14 carpetas, 227 ficheros, 14,09 MB) | Alto si se olvida | Documentado en §4 |
| R4 | `ART_PACK/art_pack.js` (Tandas 01/02) **no** forma parte de la build oficial: 18 assets del pack no los usa `index.html` | Bajo (divergencia preexistente, no introducida aquí) | Registrado |
| R5 | `fetch("/__dev_ping?…")` del motor heredado: solo se ejecuta dentro de la rutina de auditoría v3.2, no en el arranque | Bajo | Preexistente |
| R6 | **Invariante nuevo**: cualquier listener de captura `keydown`/`keyup` en `window` quedará neutralizado en modo HD, por diseño | Bajo | Documentado en el guard |
| R7 | El guard actúa solo si `this === window` (igual que antes): un alias (`const ae = window.addEventListener; ae(…, true)`) no se envuelve | Bajo | 0 casos en el código (auditado) |
| R8 | `setPaused(true)` sin partida viva es un no-op (`Y = !!U`), por diseño | Bajo | Verificado |
| R9 | INC-001/INC-002 y el resto del histórico siguen como estaban; no se han reabierto ni re-litigado | — | Fuera de alcance |
| R10 | El generador sigue eliminando el script de Cloudflare del final del fichero | Bajo | Preexistente, verificado (0 errores de red) |

---

## 8. Git

- Rama de trabajo: `arena/4753409a-deadbeat-disconew`. **`main` intacta**
  (`62912c45bb1f98007fc36865beb20c8e87c049ae` = `origin/main`; ni commits, ni
  push directo, ni merge).
- `main` **no contiene** `19e38ad1f32e713acfde92a3d3e894cf883cdd5b`: la PR
  arrastra ese commit heredado (10 ficheros) además de los de esta revisión.
  El clon de trabajo es *shallow* (graft en `19e38ad` y `62912c4`), por lo que
  `git merge-base` local no resuelve; la ascendencia real es
  `19e38ad → 62912c4 (main)`.
- PR abierta hacia `main`, **sin merge**.
- Commits de esta revisión:
  - `d12d8476708e491eb234341d25e53bf2a64f6d4a` — guard D1–D4, build, arneses, evidencia.
  - `90440fbd8441efc36043179c05060eff7b3cdfee` — guard D5 (`AbortSignal`), build, bloque H.
  - el commit de este informe (hash en el cuerpo de la PR).
- Build que se propone desplegar: `index.html` =
  `483fc9c9675d05dddae7ad9e2fd278a3448fcd5e127f2419d6ad2a338696553c`.

---

## 9. Recomendación final

**APROBAR el merge** (sin bloquearlo).

Evidencias concretas que lo sostienen:

1. La build es **reproducible byte a byte** desde el backup protegido
   (`1fd4bc59…f53e` intacto) y `index.html` ≡ `DEADBEAT_DISCO.html`
   (`eaf607c5…c09b`); regenerar no duplica módulos y el generador ahora lo
   comprueba por sí mismo.
2. CSS y JS son **autocontenidos**: sirviendo solo `index.html` (todo lo demás
   404) arranca y entra al HUB con **0 peticiones a `src/` y 0 externas**.
3. Los **227** recursos de `assets/` están presentes (0 ausentes) y **ninguna
   imagen se ha sustituido**.
4. Flujo completo **16/16** con menú, cinemática, HUB, teclado, mando emulado,
   descenso, partida normal, re-entrada al HUB y segundo descenso; **pausa
   liberada** en ambos descensos y **0 `pageerror`**.
5. El guard pasa de **24/30 a 30/30**: se cierran los cuatro huecos de contrato
   (capture por objeto, duplicados, listeners irretirables y `AbortSignal`)
   **sin cambiar** el comportamiento heredado cuando se desactiva el modo HD
   (`B2`), y con los 7 casos de `AbortSignal` verificados uno a uno (§2.5).

Condiciones que acompaño a la aprobación (ninguna bloqueante):

- **Publicar `assets/` junto a `index.html`** (§4); sin ello no hay arte HD.
- **No revertir los marcadores `DD_KEYBOARD_GUARD:BEGIN/END`**: los usa el
  arnés para probar exactamente el código que se envía.
- Antes de anunciar la versión, repetir la pasada en **hardware real con GUI y
  mando físico** (R1/R2), que es lo único que aquí no se puede firmar.
