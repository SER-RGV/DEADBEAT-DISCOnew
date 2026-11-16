# V3.0 · «La noche que devoró el amanecer»
## Guion cinematográfico y storyboard de catorce planos

Fecha: 2026-11-16. Rama `arena/18fda02d-deadbeat-disconew`, base estable `2739f59` (V2.2).

---

## 0 · Auditoría previa (FASE A)

### 0.1 · Lo que se conserva de la V2.2

| Elemento | Estado | Decisión V3.0 |
|---|---|---|
| `DD_OPENING` (lienzo propio, reloj propio, puntuación programada) | estable | **se conserva entero** |
| Integración real del Refugio (`buildHighResRoomCache`, `HUB_BOUNDS`, `hubCam()`, capas públicas del HUB) | verificada | **se reutiliza tal cual** |
| `roomProj()` — pies del héroe clavados en el suelo del salón | corregido | se conserva |
| Recuperación sin memorizar el error (si falta un material se reintenta) | implementada | se conserva |
| `shaftSide()` — el fuste de la Torre | verificado | se reutiliza para el descenso |
| 8 planos / 42 s / menú al final | contrato V2 | **sustituido** por 14 planos / 70 s / entrega directa al Refugio |

### 0.2 · Recursos disponibles (inventario real)

**Láminas reutilizables (14, todas ya en disco):**

| Archivo | Tamaño | Uso V3.0 |
|---|---|---|
| `mc_01_station.jpg` | 1376×768 | plano 01 — la estación convertida en salón |
| `op_03_dancefloor.jpg` | 1376×768 | planos 02, 04, 05 — la pista desde arriba |
| `op_03_crowd_layer.png` | 1376×768 | planos 01–05 — multitud recortada, capa de paralaje |
| `op_01_vinyl.jpg` | 1376×768 | plano 03 — el plato |
| `op_04a_tempo_hand.jpg` | 1376×768 | plano 03 — la mano de Tempo sobre el plato |
| `op_04b_smiles.jpg` | 1376×768 | plano 02 — la celebración, de cerca |
| `op_04c_vespera.jpg` | 1376×768 | plano 02 — figura en el balcón |
| `op_05a_boots.jpg` | 1376×582 | planos 05, 09 — los pies en la pista |
| `op_05b_back.jpg` | 768×1376 (vertical) | plano 06 — espalda, tatuajes, cadenas |
| `op_06_face.jpg` | 1376×768 | plano 06 — rostro y sombrero |
| `op_02_tower.jpg` | 768×1376 (vertical) | plano 08 — la arquitectura |
| `mc_03_nine.jpg` | 768×1706 (vertical) | planos 08, 12 — las nueve pistas |
| `mc_04_doors.jpg` | 1376×768 | plano 08 — las puertas |
| `mc_07_pit.jpg` | 1327×718 | planos 10, 11 — el pozo |

**Protagonista (diseño oficial, no se toca):**

| Archivo | Tamaño | Uso |
|---|---|---|
| `pm_idle_fid_00.png` | 288×512 | reposo |
| `hero_walk_00..03.png` | 288×512 | **ciclo de andar de 4 fotogramas** → animación real del paso |
| `hero_shoot_00.png` | 288×512 | gesto de tensión |
| `protagonist_master_crop_{hero,arm_tattoos,face}.png` | recortes de la lámina maestra | planos 06, 07 |

**Escenario real del Refugio:** `buildHighResRoomCache` + `HUB_BOUNDS` + `hubCam()` + zorro de neón + plataforma cian + 19 props (ya validado en V2.2).

### 0.3 · Lo que hay que producir de nuevo

1. **Nada de arte nuevo obligatorio.** La V3.0 se cuenta con las 14 láminas + los 6 fotogramas del protagonista + el escenario del motor.
2. **Animación real donde ahora hay desplazamiento de imagen**: ciclo de multitud (4 posiciones de baile), ciclo de andar del héroe (4 fotogramas ya disponibles), ropa y sombrero con retardo físico, partículas y escombros.
3. **Partitura nueva de 70 s** con los cinco actos (la actual dura 42 y está sincronizada a otra estructura).
4. **Contrato de entrega**: la intro termina en el Refugio, sin menú intermedio.

---

## 1 · CANON / PROPUESTA / LEGADO

Se respeta la biblia al pie de la letra. Lo que la biblia fija y la V3.0 **no** puede contradecir:

- **CANON:** el Desafinado ya existe dentro de la Torre; no llega de fuera; no tiene biografía previa; es el fragmento que Tempo no consiguió repetir; sus tatuajes son los caminos que la canción eliminó; Tempo recuerda todas las vueltas; la Escucha repite lo que recibe sin intención humana; la Torre se extiende hacia abajo; el Refugio es zona segura conectada a la Torre.
- **CANON:** el mecanismo lo abre la anomalía musical, pero **su causa última permanece desconocida** → nadie lo activa en pantalla.
- **PROPUESTA (biblia §5.3):** la secuencia grieta → mecanismo circular → pozo → plataforma de servicio → Refugio. La V3.0 la ejecuta tal cual.
- **LEGADO DE PROTOTIPO, prohibido:** ambientación infernal, «DJ Virgilio», los nueve círculos leídos, la Escucha con rostro o voluntad.

**Regla de rótulos (decisión del autor, 2026-11-16):** solo los **dos** aprobados, literales, una vez cada uno. Ningún texto explica el origen del protagonista. La historia se cuenta con imagen y sonido.

---

## 2 · ESTRUCTURA — 14 PLANOS, 5 ACTOS, 70 s

| Plano | t (s) | Acto | Nombre | Cámara | Acción | Sonido | Transición al siguiente |
|---|---|---|---|---|---|---|---|
| 01 | 0.0–4.0 | I | La celebración | Gran general + **travelling lateral** que atraviesa la multitud | La antigua estación, techos de cristal, lámparas, gente que por fin no teme | Charla, vasos, cuerdas cálidas, bombo suave a 100 BPM | El travelling empuja y **entra** en el plano siguiente |
| 02 | 4.0–9.0 | I | El último instante | **Dolly-in** sobre grupos + dos planos cercanos | Risa, alivio, una pareja, la figura del balcón | Melodía entra; la música crece | Corte al compás sobre el plato |
| 03 | 9.0–14.0 | I | Una canción más | **Cenital** sobre el plato + contrapicado de la mano | La última nota está por terminar. La mano de Tempo **enlaza otra canción** antes de que acabe. El disco **vuelve** al mismo surco | *Riser* cortado en seco → el mismo compás **reinicia** un tono más alto | El surco se repite → **fundido al mismo encuadre** del plano 04 |
| 04 | 14.0–18.0 | II | La repetición | **Encuadre y trayectoria IDÉNTICOS a los del plano 02**, tres veces | La multitud hace el mismo gesto; pequeñas variaciones (una cabeza, un vaso) | El bucle musical se cierra sobre sí mismo | Corte seco en el cuarto compás |
| 05 | 18.0–23.0 | II | El paso incorrecto | **Travelling bajo**, a ras de suelo, siguiendo pies | entre todos los pies que caen al compás, **uno cae tarde** | El bombo se desfasa 1/8 y **nadie lo corrige** | La cámara sube del suelo al torso |
| 06 | 23.0–28.0 | II | El que no se repite | **Órbita** alrededor del protagonista (3 cuartos) | Rostro, sombrero, tatuajes, manos: él introduce una variación; el fondo repite | Groove hipnótico con una nota que **no encaja** | Latigazo de cámara al techo |
| 07 | 28.0–33.0 | III | El error | **Contrapicado** desde el suelo; el mundo se **resitúa** a su alrededor | Los demás **recuperan** la secuencia anterior; él se mueve otra vez | Todo se cuantiza a la fuerza; un *stutter* | La luz cae al suelo |
| 08 | 33.0–38.0 | III | La Torre reacciona | **Cenital + paralaje 2.5D**; la arquitectura se multiplica | Puertas, luces y estructuras **repiten movimientos**; las nueve pistas se encienden una a una | Graves que suben desde abajo; metales | La cámara cae hacia el suelo |
| 09 | 38.0–43.0 | III | El golpe | **Descenso de cámara** hasta los pies | Un grave llega **de debajo del suelo**; grietas; el mecanismo circular empieza a girar | Sub-grave 30 Hz; piedra | El suelo gira → negro de 3 fotogramas → plano 10 |
| 10 | 43.0–48.0 | IV | La ruptura | **Cenital que se abre**: el suelo se retrae hacia los bordes | Él pierde el equilibrio; las losas se separan y caen | Silencio de 0,4 s y **impacto** | Cae fuera de cuadro |
| 11 | 48.0–54.0 | IV | La caída | **Cámara vertical** que cae con él, giro leve | Ropa, sombrero y cuerpo con retardo; escombros que suben | Viento, tela, escombros | La velocidad se **estabiliza** |
| 12 | 54.0–59.0 | IV | La Torre infinita | **Picado imposible**: balcones, pasarelas y luces de otras pistas | Profundidad que no termina; **una plataforma de servicio** lo recibe y sigue bajando | El viento se ordena; aparece un pulso | La plataforma se detiene |
| 13 | 59.0–64.0 | V | El aterrizaje | **La cámara del HUB**, llegando desde arriba | La plataforma llega al Refugio; él queda **apoyado en el suelo real** | La música resuelve al tema del Refugio | La cámara se asienta |
| 14 | 64.0–70.0 | V | El comienzo | **Encuadre real del HUB**, sin corte | El protagonista pasa al **idle del HUB**; el control es del jugador | Tema del Refugio establecido | **Sin menú**: `DD_HUB.enter()` |

### 2.1 · Los dos rótulos

| Plano | t | Texto |
|---|---|---|
| 01 | 0.9–3.4 | «ESA NOCHE, ALGUNOS PUDIERON REUNIRSE SIN MIEDO.» |
| 14 | 65.6–68.2 | «POR FIN, HABÍA QUIEN PODÍA IMAGINAR UN MAÑANA.» |

Ningún otro texto. Las onomatopeyas de cómic (`CRRRAC`, `FSSSSH`, `TAC`…) **se conservan**: son diseño gráfico de la identidad, no narración.

---

## 3 · DIRECCIÓN DE CÁMARA — regla de oro

> **Ningún plano avanza solo por mover la cámara.** Cada plano tiene un cambio de
> *estado de escena* además del movimiento: aparece algo, desaparece algo, alguien
> cambia de posición o el mundo se reordena.

| Plano | Movimiento | Cambio de escena (lo que impide confundirlos) |
|---|---|---|
| 01 | travelling lateral | entran y salen grupos por el marco |
| 02 | dolly-in | la expresión cambia; el brindis ocurre |
| 03 | cenital fijo + mano | **el disco se enlaza** (acontecimiento, no cámara) |
| 04 | idéntico al 02 | el bucle **se cierra**: el mismo gesto vuelve |
| 05 | travelling bajo | un pie **falla** el compás |
| 06 | órbita | él **varía** el gesto mientras el fondo repite |
| 07 | contrapicado | los otros **se reajustan** a la fuerza |
| 08 | cenital + paralaje | las puertas **se multiplican** |
| 09 | descenso a pies | **grietas nuevas** + mecanismo que gira |
| 10 | cenital que se abre | el suelo **desaparece** |
| 11 | vertical | el sombrero **se desprende** |
| 12 | picado | aparece la **plataforma** |
| 13 | cámara HUB | la plataforma **llega** y él toca suelo |
| 14 | HUB estable | el jugador **toma el control** |

---

## 4 · ANIMACIÓN (real, no desplazamiento)

1. **Multitud:** ciclo de 4 poses (balanceo, brazos arriba, giro, aplauso) sobre la capa recortada, con desfase por grupo. El plano 04 repite el ciclo **exacto**; el 07 lo repite **forzado** (más rápido, más rígido) para que se note la corrección.
2. **Protagonista:** ciclo de andar de **4 fotogramas reales** (`hero_walk_00..03`) para los pasos fuera de compás del plano 05 y la recuperación del 07; `idle` para los planos 06 y 14.
3. **Ropa y sombrero:** retardo físico (muelle amortiguado) respecto al cuerpo en la caída; el sombrero **se separa** en el plano 11.
4. **Partículas:** polvo del techo (08–09), escombros que **suben** durante la caída (11), ascuas en el Refugio (13–14).
5. **Iluminación reactiva:** las lámparas laten con el bombo; en el plano 07 la luz **se cuantiza** con el stutter; en el 09 todo se apaga salvo el mecanismo.

---

## 5 · DIRECCIÓN MUSICAL (70 s, original)

| Acto | t | Material | Función |
|---|---|---|---|
| I | 0–14 | Cuerdas cálidas + bombo a 100 BPM + charla. Melodía en La menor. | Celebración y repetición. En 9–14 el *riser* se **corta** y el compás reinicia idéntico, un tono arriba. |
| II | 14–28 | Groove hipnótico, mismo patrón del acto I **literalmente repetido**; una nota fuera de escala entra en 18 y **no se corrige**. | La irregularidad es la del protagonista. |
| III | 28–43 | Cuantización forzada (todo a 1/16), disonancias acumuladas, stutter, filtro cerrándose. En 38 el **sub-grave** de 30 Hz llega desde abajo. | Distorsión y tensión. |
| IV | 43–59 | 3 fotogramas de silencio → impacto → caída con viento y escombros; sin armonía, solo ruido organizado. En 54 entra un pulso grave regular. | Ruptura y profundidad. |
| V | 59–70 | El pulso grave se convierte en el **tema del Refugio**; la armonía resuelve en La mayor. Se entrega al tema real del menú/HUB. | Resolución e identidad sonora. |

Todo sintetizado con la API de audio existente (`S.kick/snare/hat/bass/boom/rumble/whoosh/screech/hit`, `tone`, `noise`). Sin material comercial.

---

## 6 · INTEGRACIÓN CON EL REFUGIO (obligatoria)

Igual que la V2.2, **sin duplicar geometría**:

```
DD_WORLD.buildHighResRoomCache(ctx, 1800, 1180, HUB_BOUNDS, 0, 777, null)   // una vez
hubCam()                                                                     // zoom y centro del HUB
DD_WORLD.drawNeonGlow / drawDescentPad / drawProp                            // capas públicas
roomProj()                                                                   // mundo → pantalla
```

- `dd_hub_system.js` y `dd_world_renderer.js`: **no se modifican**.
- Si falta un material: se reintenta al fotograma siguiente y se pinta con materiales sueltos (nunca caja negra).
- **Escala**: el héroe entra con escala cinematográfica (`0.42·H`) y en el plano 14 **converge** a la escala jugable del HUB (`REFUGE_IDLE.drawH = 112` unidades → `0.155·H`), con la misma línea de suelo. La convergencia es un *dolly* que se compensa con el crecimiento del héroe, de modo que su tamaño en pantalla **no salta**.
- **Entrada al juego** (decisión del autor): al terminar el plano 14 se llama a `DD_HUB.enter()` directamente, con el jugador en `px=880, py=615`. Sin menú intermedio, sin fundido a negro.

---

## 7 · CONTRATO TÉCNICO DE LA V3.0

| Constante | V2.2 | V3.0 |
|---|---|---|
| `INTRO_DURATION` | 42 | **70** |
| `TITLE_AT` | 38 | **64** (inicio del plano 14) |
| `SHOTS` | 8 | **14** |
| Fin de la intro | menú principal | **Refugio (PLAYING)** |
| `DESCENT_DURATION` | 4.6 (NUEVA PARTIDA) | 4.6 — **se conserva**, ahora es la re-entrada desde el menú |

**Reversión:** `2739f59:src/dd_opening.js` (V2.2 estable) + los 4 archivos de contrato que se tocan (`src/dd_boot.js`, `tools/qa/test_restart_flow.js`, `work/tools/*`). Documentada en `19_V30_REVERSION.md`.

---

## 8 · RIESGOS IDENTIFICADOS

1. **70 s de reloj real**: el arranque actual tarda ~41.8 s de reloj; con 70 habrá que medir de nuevo y el guard de estancamiento de `dd_boot.js` debe seguir funcionando (mide avance, no duración total: correcto).
2. **Catorce planos en un archivo de 2.100 líneas**: se añaden ~1.300. Riesgo de regresión en los planos que ya funcionan → se conservan las funciones existentes y se **remapean los tiempos**, no se reescriben a ciegas.
3. **Entrega directa al Refugio**: `dd_boot.js` hace `enterMainMenu()` al terminar. Hay que cambiar **solo** esa ruta cuando la intro venga del arranque, sin tocar menús ni UI.
4. **Escala cine → juego**: es el punto más delicado visualmente. Se valida con capturas del fotograma 64.0 y del primer fotograma del HUB.
5. **QA depende de 42 s / 8 planos** en `tools/qa/test_restart_flow.js`: hay que actualizar las tres aserciones.
