# V3.0 · «LA NOCHE QUE DEVORÓ EL AMANECER» — entrega

Cinemática de apertura reconstruida: **70 s, 14 planos, 5 actos**, sobre el
sistema cinemático existente y con el Refugio REAL del motor como destino.

- Rama: `arena/18fda02d-deadbeat-disconew`
- Punto estable anterior (rollback): **`2739f59`** — V2.2
- Contrato: `INTRO_DURATION = 70`, `TITLE_AT = 64`, `SHOTS.length = 14`

---

## 1 · Qué cambia para el jugador

| Antes (V2.2) | Ahora (V3.0) |
|---|---|
| 42 s · 8 planos | **70 s · 14 planos · 5 actos** |
| Terminaba en el **menú principal** | Termina **entregando el control en el Refugio** |
| El menú arrancaba su música en el plano del título | La partitura sigue hasta la entrega; el menú queda para la vuelta |
| El cierre se oscurecía | El cierre **no tapa**: el lienzo se retira sobre el Refugio ya vivo |

No hay menú intermedio ni pantalla negra antes de entregar el control.

## 2 · Los cinco actos

| Acto | Planos | Tiempo | Qué pasa |
|---|---|---|---|
| **I** La celebración | 01–03 | 0:00–0:14 | La estación es un salón de baile. Se baila el final de una guerra. En 03 el compás se corta y **Tempo encola otra canción**: el bucle nace y **se oye** nacer. |
| **II** El Desafinado | 04–06 | 0:14–0:28 | El mismo movimiento de multitud, **encuadre y recorrido idénticos**, cuatro veces. Él camina fuera de patrón. Órbita sobre su cara y sus tatuajes. |
| **III** La corrección | 07–09 | 0:28–0:43 | La escena intenta recuperar la secuencia anterior y **cuantiza** a la fuerza. Puertas, luces y estructuras repiten la corrección. Un grave sube desde debajo del suelo; grietas y mecanismo circular. |
| **IV** El descenso | 10–12 | 0:43–0:59 | El suelo se retrae, él pierde el pie. Cámara vertical de seguimiento con escombros que ascienden. Balcones y plantas imposibles; una plataforma de servicio lo recoge y sigue bajando. |
| **V** El Refugio | 13–14 | 0:59–1:10 | La plataforma llega, él se deja caer y queda tumbado. La cámara converge al encuadre REAL del Refugio, se incorpora y **recibe el control**. |

## 3 · Rótulos

Sólo dos, literales, una vez cada uno. Las otras ocho cartelas se han eliminado.

| Plano | Tiempo | Texto |
|---|---|---|
| 01 | 0,90 – 3,40 s | ESA NOCHE, ALGUNOS PUDIERON REUNIRSE SIN MIEDO. |
| 14 | 65,60 – 68,20 s | POR FIN, HABÍA QUIEN PODÍA IMAGINAR UN MAÑANA. |

Las onomatopeyas de cómic (CLIC, CRRRJ, KRAAK, FSSSHH, BRUUM) se conservan:
son parte de la identidad gráfica, no narración.

## 4 · Integración con el Refugio real (§7)

Regla cumplida: **no se modifica `dd_hub_system.js` ni el motor**, y no se
duplica geometría del Refugio.

- El salón de los planos 13–14 sale de `DD_WORLD.buildHighResRoomCache`,
  la misma caché de alta resolución del motor, con `HUB_BOUNDS` y `hubCam()`.
- Encima se dibujan las capas públicas del HUB: neón del zorro
  (`drawNeonGlow`), plataforma cian (`drawDescentPad`) y mobiliario
  (`drawProp` sobre `HUB_PROPS_CINE`).
- Si un recurso falta, **no se memoriza el fallo**: `engineRoom()` devuelve
  `null` y se repinta con los materiales sueltos; se reintenta el siguiente
  fotograma.
- **Registro corregido**: `roomProj()` ahora acepta el zoom vivo. Antes el salón
  se pintaba a `zoom × zoomK` y el protagonista a `zoom × 1`, de modo que ambos
  se desregistraban y él flotaba. Es un defecto medido, no estimado.
- **Convergencia exacta**: al final del plano 14 `zoomK = 1,00` y el héroe mide
  los 124,12 px del sprite del HUB a 720p. El último fotograma cinemático y el
  primero jugable son el mismo encuadre.

## 5 · Entrega del control

`DD_BOOT.startIntro().finish()` llama a `enterRefugeFromIntro()`, que entra por
la **misma puerta** que NUEVA PARTIDA (`DD_HUB.enter()` + `DD_BOOT.enterGame()`).
Devuelve `true` sólo si el HUB confirma `isActive()`; si no, cae al menú. Nunca
se declara `PLAYING` sobre un motor sin confirmar.

Verificado en navegador real: `state = PLAYING`, HUB activo en **880, 615**,
`menuVisible = false`, sprite `idle_07b`.

## 6 · Partitura

Original, sintetizada con la API de audio del juego, 300 eventos programados
contra el reloj de la cinemática.

- **I** cuerdas cálidas + bombo a 100 ppm; en 12,35 el «riser» **se corta en
  seco** y en 12,45 el compás **reinicia idéntico**.
- **II** el patrón del acto I repetido literalmente; en 18,05 entra un **sib**
  (466,2 Hz) fuera de escala que **no se corrige**.
- **III** cuantización forzada a 1,7×, disonancias, el filtro se cierra; en 38,0
  un sub-grave de 30 Hz llega **desde abajo**.
- **IV** tres fotogramas de silencio → impacto; la caída es viento y escombros,
  sin armonía.
- **V** el pulso grave se convierte en el tema del Refugio y **resuelve en mayor**
  (277,2 en lugar de 261,6).

## 7 · Qué se ha tocado

| Archivo | Cambio |
|---|---|
| `src/dd_opening.js` | motor de animación V3, 14 planos, partitura de 70 s, `FILES` (+4 placas), `roomProj` con zoom, barridos y cierre corregidos, 9 funciones muertas y 21 cartelas eliminadas |
| `src/dd_boot.js` | `enterRefugeFromIntro()`; `finish()` entrega al Refugio; `onTitle` ya no arranca música de menú |
| `tools/qa/test_restart_flow.js` | aserciones 14 planos / 70 s; placas canónicas admitidas |
| `work/tools/harness.js` | carga `dd_hub_system.js`; espera a que el precargador se estabilice |
| `work/tools/{audit,live,continuity}.js` | la entrega se comprueba contra el Refugio, no contra el menú |
| `docs/RESTART/18_V30_STORYBOARD.md` | guion y storyboard de los 14 planos |
| `index.html`, `DEADBEAT_DISCO.html` | reconstruidos |

**No se ha tocado**: combate, IA, armas, balance, economía, progresión, HUD,
menús, diseño del Refugio ni sistemas de juego. `DESCENT_DURATION = 4,6` sigue
igual (NUEVA PARTIDA → pozo → llegada).

## 8 · Pruebas ejecutadas

Todas en **navegador real con los recursos del juego cargados**.

| Prueba | Comando | Resultado |
|---|---|---|
| Congelados | `node work/tools/motion.js intro` | 350 muestras · **0 congeladas** en los 14 planos |
| Auditoría completa | `LD_LIBRARY_PATH=… node work/tools/audit.js` | **69,53 s**, 14/14 planos, entrega `PLAYING` en 880,615, **0 errores** |
| Flujo en vivo | `… node work/tools/live.js` | **69,70 s**, entrega verificada, **0 errores de consola** |
| Continuidad | `… node work/tools/continuity.js` | 5 relaciones de aspecto, **0 errores** |
| Fotogramas negros | barrido a 0,05 s de 0 a 70 s | **0** salvo la entrada desde negro (0–0,30 s, intencionada) |
| Descenso | auditoría | 4,60 s, `complete` |

Relaciones de aspecto cubiertas por la prueba de continuidad: 16:9 1280×720,
16:9 1920×1080, 4:3 1024×768, 21:9 2560×1080, móvil 844×390.

### Pruebas pendientes (declaradas, no ejecutadas)

- `tools/qa/test_restart_flow.js` completo: necesita un servidor estático y
  Playwright; las aserciones están actualizadas pero **no se ha corrido en esta
  sesión**. Es la primera que hay que lanzar antes de fusionar.
- Escucha subjetiva de la partitura en hardware real (auriculares/altavoces).
- Reproducción en Safari y Firefox (probado en Chromium headless).

## 9 · Rollback

```bash
git checkout 2739f59 -- src/dd_opening.js src/dd_boot.js \
  tools/qa/test_restart_flow.js index.html DEADBEAT_DISCO.html
python3 tools/build_active_html.py
```

`2739f59` es V2.2 y está intacto: 42 s, 8 planos, desenlace en el menú. La rama
no reescribe historia, así que el rollback es un `checkout` de archivos, no un
`revert`.

## 10 · Evidencia

En `docs/RESTART/evidencia_cine_v30/`:

- `v3_14shots.jpg` — los 14 planos, uno por plano.
- `v3_final_stretch.jpg` — tramo final 56–70 s cada 0,5 s.
- `v3_wipes.jpg` — los cuatro barridos de acto y el cierre.
- `v3_s06b.jpg` — el plano 06 (cara, tatuajes, él quieto).
- `handover_pair.jpg` — último fotograma cinemático vs. Refugio real (V3.0
  contra V3.0: es la continuidad de la entrega, no la comparación de versiones).
- `comparativa_v22_v30.jpg` — **entregable 10**: V2.2 frente a V3.0, ocho
  momentos del relato en dos columnas. Las dos versiones se renderizan en el
  mismo banco, con el mismo registro de recursos y la misma máquina; lo único
  que cambia es el módulo de la cinemática (V2.2 = `2739f59`, extraído a un
  archivo temporal para no tocar el árbol). V2.2 carga 286 recursos y V3.0 290,
  ninguno ausente. Generado con `work/tools/compare_v22_v30.js`.
- `entrega_refugio_real.jpg` — la entrega en el navegador real, con HUD y Tempo.
- `auditoria.json`, `informe_navegador.json`, `continuidad_entrega.json`,
  `movimiento_intro.json` — informes de las cuatro pruebas.

## 11 · Los 12 entregables de la directiva, uno a uno

Recuento verificado contra el repositorio, no de memoria. Se indica **dónde**
está cada uno; los que no tienen archivo propio, con qué se cubren.

| # | Entregable | Dónde | Estado |
|---|---|---|---|
| 1 | Guion V3.0 | `18_V30_STORYBOARD.md` §1 (cinco actos, 14 planos, CANON/PROPUESTA/LEGADO) | hecho |
| 2 | Storyboard de los 14 planos | `18_V30_STORYBOARD.md` + `evidencia_cine_v30/v3_14shots.jpg` | hecho |
| 3 | Hoja de contacto completa | `v3_14shots.jpg`, `v3_final_stretch.jpg` (56–70 s cada 0,5 s), `v3_wipes.jpg` | hecho |
| 4 | Inventario de recursos reutilizados | `18_V30_STORYBOARD.md` §0.2 (14 láminas + 6 fotogramas del protagonista + escenario del motor) | hecho |
| 5 | Inventario de recursos nuevos | `18_V30_STORYBOARD.md` §0.3: **ninguno**. No se generó arte nuevo; se usan láminas canónicas ya en disco | hecho |
| 6 | Secuencia implementada | `src/dd_opening.js` (14 planos, 70 s) | hecho |
| 7 | Música y efectos | `19_V30_ENTREGA.md` §6 (partitura de 70 s, 300 eventos sincronizados) | hecho |
| 8 | Integración con el Refugio real | `19_V30_ENTREGA.md` §4 + `entrega_refugio_real.jpg`, `handover_pair.jpg` | hecho |
| 9 | Informe de QA | `19_V30_ENTREGA.md` §8 + `auditoria.json`, `informe_navegador.json`, `movimiento_intro.json`; batería `69/69` | hecho |
| 10 | Capturas comparativas V2.2 vs V3.0 | **`comparativa_v22_v30.jpg`** — ocho momentos, dos columnas, mismo banco y mismo registro de recursos | hecho (añadido en esta revisión) |
| 11 | Documentación técnica | `18_V30_STORYBOARD.md`, este documento, `19_V30_REVERSION.md` | hecho |
| 12 | Instrucciones de rollback | `19_V30_REVERSION.md` (rollback a `2739f59` verificado: 42 s / 8 planos) | hecho |

**Corrección de una afirmación anterior.** El comentario del PR decía que los 12
estaban cubiertos *antes* de comprobarlo. Al comprobarlo, el nº10 no lo estaba:
`handover_pair.jpg` es V3.0 contra V3.0 (último fotograma frente al Refugio), no
una comparación de versiones. Se ha generado `comparativa_v22_v30.jpg` para
cubrirlo de verdad, con las dos versiones renderizadas en el mismo banco.
