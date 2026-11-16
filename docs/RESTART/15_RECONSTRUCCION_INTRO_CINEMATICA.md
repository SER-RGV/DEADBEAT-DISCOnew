# 15 · Reconstrucción de la intro: «La noche que devoró el amanecer»

Fecha: 2026-11-16. Rama `arena/18fda02d-deadbeat-disconew`, sobre `2d1f6e8`.

Esta fase **sustituye por completo** la cinemática de apertura y su entrega al Refugio.
No toca menús, HUD, juego, combate, IA, armas, balance, economía, progresión, enemigos
ni el diseño del Refugio. El sistema de cinemáticas (`DD_OPENING`), el motor y los
controladores se conservan; la intro anterior queda íntegra en el historial de Git
(`2d1f6e8:src/dd_opening.js`) y la reconstrucción es reversible con ese único archivo.

---

## 1. Propuesta narrativa

La biblia de lore establece cinco hechos que la intro debe poder contar sin explicarlos:
el protagonista **ya está dentro** de la Torre; su existencia tiene que ver con decisiones
que la Torre descartó; está **fuera de compás**; la Torre **corrige su paso**; y el
**bucle es fundamental**. El Refugio es el destino, no una recompensa.

La versión anterior contaba eso en siete planos y 32 s, con dos defectos medidos en la
auditoría de partida: el séptimo plano era casi estático (2 de 9 muestras idénticas) y el
bucle se explicaba con cartelas en vez de con imagen. La propuesta nueva:

> La Torre es una pista que se repite. El protagonista es la nota que no encaja.
> La Torre intenta corregirlo. El suelo no lo sostiene. Cae, y abajo hay un lugar
> donde todavía se puede imaginar un mañana.

Cinco actos, **ocho planos, 42 s**, un solo protagonista, ninguna voz narradora nueva y
las dos cartelas aprobadas, literales.

| Acto | Tiempo | Idea | Lo que ve el jugador |
|---|---|---|---|
| **I · EL CICLO** | 0 – 8,5 s | La Torre existe y se repite | La sala de baile vacía, la Torre entera por dentro, nueve pistas |
| **II · EL DESAFINADO** | 8,5 – 21 s | Alguien no sigue el compás | El bucle de la pista y, por fin, él: botas, lámina maestra |
| **III · LA CORRECCIÓN** | 21 – 31 s | La Torre reacciona | Las miradas, las puertas que se pliegan, las grietas |
| **IV · EL DESCENSO** | 31 – 38 s | No hay suelo | El suelo se abre, el sombrero cae, el pozo |
| **V · EL REFUGIO** | 38 – 42 s | Hay un mañana | Título y encuadre exacto del menú |

### Canon respetado

- **Ya está dentro.** No hay ni un plano de exterior ni de llegada. La primera vez que se
  le ve, está de pie en la pista.
- **Decisiones descartadas.** No se dice de dónde viene ni por qué existe. «A él, la Torre
  le duele» es todo lo que se afirma: la Torre reacciona a su presencia, no lo expulsa.
- **Fuera de compás.** Cuatro pasos, el cuarto tarde (14,6 / 15,1 / 15,6 / **16,1**), y el
  mundo se detiene un instante en el cuarto. No se explica con palabras: se oye.
- **La corrección.** Arquitectura que se dobla, la misma página en bandas, grietas que se
  ramifican y puertas que ya no llevan a ninguna parte. El mecanismo **no** se explica.
- **El bucle.** El reloj no avanza: da un tirón, vuelve atrás y repite el mismo cuarto de
  vuelta tres veces; a la cuarta se salta un segundo y se queda clavado.
- **El Refugio.** Se llega desde arriba (plataforma de servicio), como manda el §5.3. La
  sala real toma el relevo en el mismo punto y con la misma luz.

### Lo que NO se ha hecho

- No se ha reintroducido a **DJ Virgilio** (hoy Tempo) como narrador ni como protagonista
  de ningún plano; el plato aparece una vez, como objeto del bucle, sin nombre ni rótulo.
- No se ha recuperado la **lectura de los nueve círculos**. La tabla de nueve pistas se
  cuenta con marcas y números romanos, sin interpretación.
- No se revela el **origen completo** del protagonista, ni **La Escucha**, ni la petición
  del anfitrión.
- No hay narrador ni diálogo nuevos. Todo el texto es rótulo de cómic, en español, y cada
  línea tiene su traza de canon en el §3.

---

## 2. Guion técnico

Tabla única de tiempos, exportada como `DD_OPENING.SHOTS_TABLE`. La pintura, el sonido y
las pruebas la leen de aquí: no hay tiempos duplicados en ningún otro sitio.

| # | In | Out | Nombre | Cámara | Sonido |
|---|---|---|---|---|---|
| 1 | 0,0 | 3,5 | La noche | Página de cómic que se abre (marco de viñeta) | Campanas lejanas, pad, latido |
| 2 | 3,5 | 8,5 | La torre | Plano general que empuja; tres viñetas de detalle encadenadas | Bajo de arranque, nueve pulsos |
| 3 | 8,5 | 14,0 | El bucle | Repetición literal: mismo encuadre, mismo empuje, cuatro vueltas | Motivo ×4, la cuarta rota |
| 4 | 14,0 | 21,0 | El desafinado | Botas en contrapicado y entrada de la lámina maestra | Pasos, el cuarto tarde; entra el tema |
| 5 | 21,0 | 26,0 | Los que miran | Página de puertas que se pliega | Parada de reloj, coro invertido |
| 6 | 26,0 | 31,0 | La corrección | Bandas repetidas, arquitectura doblada, grietas | Pulso corregido (×1,7), cortes |
| 7 | 31,0 | 35,5 | El suelo | Grietas → la página se parte → pozo de lado | Impacto grave, crujidos, caída |
| 8 | 35,5 | 42,0 | El refugio | Retroceso del pozo, título, encuadre de menú | Resolución, tema del menú |

Barridos de tinta **entre** planos, con el negro pleno encima del corte:
13,86–14,08 · 20,90–21,12 · 30,90–31,12 · 35,38–35,62.

### Movimiento de cámara por plano

1. **La noche** — encuadre fijo con deriva de 8 px; la página se abre con un *pop* de
   viñeta. Cian y magenta cruzan la sala de izquierda a derecha.
2. **La torre** — la Torre ocupa del 44 % al 30 % del ancho mientras el fondo retrocede;
   tres viñetas de detalle se enlazan con líneas de tinta; nueve marcas numeradas suben
   por el fuste y una línea cian señala la planta actual.
3. **El bucle** — dentro de cada vuelta la cámara empuja un 7 % y **vuelve a empezar**. La
   cuarta se queda congelada en el empuje: la cámara ya no puede volver a empezar. Este
   plano es el único que se repite a propósito, y se repite para que se vea el bucle.
4. **El desafinado** — empuje continuo y balanceo que crece hasta el paso tardío; la
   lámina maestra entra desde la derecha, luego el brazo tatuado y luego la cara.
5. **Los que miran** — la página se pliega en bandas horizontales; las miradas giran al
   unísono hacia él; a los 22,0 s el reloj se para.
6. **La corrección** — la misma página aparece repetida en bandas; la arquitectura se
   dobla; las grietas entran por el borde de la viñeta.
7. **El suelo** — temblor, grietas que se encuentran en el centro de la pista y la página
   se parte en dos dejando ver el pozo **de lado**.
8. **El refugio** — retroceso del pozo de 2,6× a 1,0×, el sombrero cae y el encuadre se
   queda en `mc_07_pit`. **Exactamente** en `mc_07_pit`: ver §7.1, donde se mide que el
   fondo del último fotograma y el fondo del menú coinciden **al píxel**.

---

## 3. Storyboard y reparto de planos

Hojas de contacto (una por acto) en `evidencia_cine_v2/`:

| Hoja | Archivo | Planos |
|---|---|---|
| Acto I | `acto_I.jpg` | 1 · la noche, 2 · la torre |
| Acto II | `acto_II_bucle.jpg` | 3 · el bucle |
| Acto III | `acto_III_desafinado.jpg` | 4 · el desafinado, 5 · los que miran |
| Acto III | `acto_III_correccion.jpg` | 6 · la corrección, 7 · el suelo |
| Acto IV–V | `acto_IV_V.jpg` | 7 · el suelo, 8 · el refugio |
| Barridos | `barridos_de_tinta.jpg` | las cuatro transiciones |
| Descenso | `descenso_llegada.jpg` | descenso completo (4,6 s) |
| Juego real | `real_plano_1…8_*.jpg`, `real_descenso_3s.jpg`, `real_hub_refugio.jpg` | capturas del `index.html` real |

### Traza de canon de cada rótulo

Todas las cartelas son rótulo de cómic. Ninguna es voz narradora; ninguna introduce
información que la biblia no sostenga.

| Tiempo | Rótulo | Traza |
|---|---|---|
| 0,75–2,15 | LA GUERRA HABÍA TERMINADO. | Contexto histórico de la biblia: la fiesta es lo que queda después. |
| 2,30–3,45 | **ESA NOCHE, ALGUNOS PUDIERON REUNIRSE SIN MIEDO.** | **Cartela aprobada, literal.** |
| 3,60–5,30 | PERO LA NOCHE NO TERMINÓ. | El bucle como hecho, no como explicación. |
| 5,60–7,00 | EL SALÓN CRECIÓ HACIA ABAJO. COMO UN SURCO EN UN DISCO. | §5.3: disco y Torre son una sola estructura. |
| 7,20–8,45 | NUEVE PISTAS. UNA DEBAJO DE OTRA. | Arquitectura de nueve plantas, sin interpretación simbólica. |
| 8,55–10,30 | LAS PUERTAS YA NO LLEVAN FUERA. | El encierro como estado, nunca como llegada. |
| 10,55–12,30 | EL TIEMPO SE PLEGÓ SOBRE SÍ MISMO. | El bucle; el reloj lo demuestra en pantalla. |
| 12,55–14,00 | TODOS BAILAN. NADIE RECUERDA DESDE CUÁNDO. | Repetición de las rutinas atrapadas. |
| 13,70–14,00 | LA ÚLTIMA NOTA VUELVE ANTES DE TERMINAR. | El bucle es musical: la nota final vuelve. |
| 14,30–16,55 | UNO NO SIGUE EL COMPÁS. | §5.4: el Desafinado. |
| 19,00–20,95 | A ÉL, LA TORRE LE DUELE. | Su existencia remite a decisiones descartadas: la Torre reacciona. |
| 21,30–22,90 | TODOS GIRAN LA CARA A LA VEZ. | La Torre lo detecta; el mundo se detiene. |
| 23,60–25,00 | NADIE RECUERDA CUÁNDO DEJÓ DE MIRARLO A ÉL. | La corrección empieza por la mirada. |
| 26,50–28,20 | LA TORRE INTENTA CORREGIRLO. | §5.4: la corrección. |
| 28,80–30,40 | ÉL NO CEDE. | No es un héroe convencional: resiste, no vence. |
| 31,25–32,50 | Y EL SUELO SE ABRE. | §5.3: golpe grave desde abajo, grietas. |
| 32,80–34,20 | NO HAY SUELO QUE LO SOSTENGA. | La caída es real, no una transición técnica. |
| 35,70–37,70 | LA TORRE YA NO PUEDE SOSTENERLO. | Cierre del acto IV. |
| 3,05–4,45 (descenso) | **POR FIN, HABÍA QUIEN PODÍA IMAGINAR UN MAÑANA.** | **Cartela aprobada, literal.** Se paga al llegar al Refugio. |

Las dos cartelas aprobadas aparecen **una vez cada una**, literales, con el mismo salto de
línea que la biblia.

---

## 4. Dirección musical

Todo el sonido es **procedimental** (WebAudio, `buildIntroScore()` / `buildDescentScore()`).
No hay samples ni música de terceros: seis osciladores y dos ruidos filtrados bastan.

| Acto | Material | Intención |
|---|---|---|
| I | Pad en re menor, campana lejana, latido a 120 BPM (`BEAT = 0,5 s`) | Orden, repetición, algo que ya estaba pasando |
| II (bucle) | Motivo de cuatro notas ×4; la cuarta pierde la última nota y el pulso se rompe | El bucle se oye antes de que se lea |
| II (desafinado) | Bajo de arranque 14,6–16,1; los cuatro pasos; el cuarto **tarde** | La anomalía entra en el compás |
| III | Parada de reloj a 22,0 s (corte seco + silencio de 0,3 s), coro invertido, pulso corregido ×1,7 | La Torre aprieta; el silencio es parte de la música |
| IV | Impacto grave 31,0 · crujidos 31,15–32,4 · caída 32,6 · sombrero 33,0 | La caída tiene peso, no es un *fade* |
| V | Acorde abierto, resolución 38,0; entra el tema del menú | Llegada; el jugador recupera el mando |

Silencios estratégicos: 16,1–16,35 (después del paso tardío), 22,0–22,3 (parada de reloj)
y 37,9–38,0 (un fotograma antes del título).

---

## 5. Recursos

### Reutilizados (13 láminas + sombrero + logotipo)

`mc_01_station.jpg`, `op_03_dancefloor.jpg`, `mc_03_nine.jpg`, `mc_04_doors.jpg`,
`op_01_vinyl.jpg`, `op_04b_smiles.jpg`, `op_04a_tempo_hand.jpg`, `op_05a_boots.jpg`,
`mc_07_pit.jpg`, `op_hat.png`, `logo_deadbeat_graffiti.png`, más los tres recortes de la
lámina maestra (`protagonist_master_crop_hero/arm_tattoos/face`) y el IDLE canónico
`pm_idle_fid_00.png`. **No se ha generado ni una ilustración nueva del personaje.**

### Nuevo (1)

`assets/cinematics/restart/opening/op_03_crowd_layer.png` — 1376×768, 30,4 % de cobertura,
2 366 466 B. No es una lámina nueva: es la multitud **recortada de la propia**
`op_03_dancefloor.jpg` por `tools/art_master/cinematic_crowd_layer.py` (máscara de
luminancia `LUM_MAX=64`, banda `BAND_TOP=0.46`, pluma `FEATHER=1.1`). Se usa como capa de
paralaje y como copias fantasma. Registrada en el manifiesto como `cine_op03_crowd_layer`
(sha16 `c102ac6fd9664c81`), así que el precargador del arranque la exige: si falta, el
arranque falla en vez de pintar un plano incompleto.

---

## 6. Implementación

- **Un solo archivo de producción**: `src/dd_opening.js`. Ni el motor, ni `dd_boot.js`, ni
  `dd_ui_system.js`, ni `dd_hub_system.js` se han tocado en esta fase.
- **API intacta**: `INTRO_DURATION, SHOTS, DESCENT_PHASES, FILES, preload, playIntro,
  playDescent, skip, isActive, getState, getLastEnd, audioState, debugSeek` siguen ahí con
  el mismo contrato. Se añade `SHOTS_TABLE` (id, nombre, entrada, salida).
- **Ciclo de reloj propio.** La intro y el descenso avanzan con su propio reloj y su propio
  `requestAnimationFrame`, no con el del juego: es lo que permite que una intro de 42 s no
  dependa del estado del HUB ni deje el mundo simulado corriendo detrás.
- **NUEVA PARTIDA no repite la intro.** `introPlayed` sigue gobernando el arranque; el
  descenso (`playDescent`) sólo se lanza desde el menú, y termina en `arriveAtRefuge(true)`.
- **Final exacto.** El último fotograma es `mc_07_pit` a 0,5 / 0,5 y zoom 1,0, el mismo
  encuadre que `menuBackdropSrc()`: el paso al menú no tiene salto.
- **Rendimiento**: 922 fotogramas pintados en 41,81 s de reloj real (≈22 fps de pintura en
  el banco de pruebas a 1280×720; el navegador real da 41,70 s de pared para 42 s de
  contenido, es decir, la animación no pierde tiempo).

---

## 7. Verificación

Todo lo que sigue se ha **ejecutado**. Lo que no se puede ejecutar aquí está dicho.

### Banco de pruebas propio (`work/tools/harness.js`, canvas real)

| Prueba | Resultado |
|---|---|
| Carga del módulo y de los 16 recursos | 16 cargados, **0 ausentes** |
| Los 8 planos entran en su tiempo | ✔ |
| Auditoría de movimiento (210 muestras cada 0,2 s) | **0 muestras congeladas** en los 8 planos |
| Planos repetidos | Sólo el plano 3, **a propósito** (es el bucle) |
| Barridos de tinta | 4, con el negro pleno sobre el corte |

### Navegador real (`work/tools/live.js`, Chromium + `index.html` construido)

| Prueba | Resultado |
|---|---|
| Carga del juego | ✔ sin panel de error |
| Pulsación → intro | ✔ estado `INTRO` |
| Intro completa | **41,695 s** de pared, `by: complete`, 0 errores de consola |
| Menú tras la intro | ✔ `MAIN_MENU` |
| NUEVA PARTIDA → descenso | ✔ 100 fotogramas, `by: complete` |
| Refugio | ✔ `DD_HUB` activo, `idle_07b`, plataforma, 4 estaciones |
| Errores de consola en todo el recorrido | **0** |
| Capturas | 8 planos + 11 fotogramas del descenso + Refugio |

### Auditoría de referencia (`work/tools/audit.js`, servidor + Chromium)

| Métrica | Antes (intro de 32 s) | Ahora (42 s) |
|---|---|---|
| Duración de pared | 31,74 s | **41,81 s** |
| Fotogramas pintados | 704 | **922** |
| Sucesos de audio | 148 | **161** |
| Planos con muestras idénticas | plano 7: 2 de 9 | **0 en los 8 planos** |
| Errores | 0 | **0** |
| Recursos en el manifiesto | 308 | **309** |

### 7.1 · Continuidad entre la cinemática y el menú (`work/tools/continuity.js`)

No basta con "el último plano se parece al fondo del menú". El menú real pinta esa misma
lámina con `object-fit: cover` **más** una animación de deriva (`rs-drift`, escala
1 → 1,04) con `transform-origin: 46% 43%`, y coloca el logotipo y el lema con un layout
propio (`min(30vw, 50vh)` con topes y puntos de ruptura). Todo eso se ha reproducido en el
canvas, con los mismos puntos de ruptura copiados del CSS.

La prueba congela la cinemática en el instante exacto de la entrega (41,97 s), deja
terminar el flujo de verdad, **aísla el fondo del menú** (oculta rótulos, desactiva
animación, filtro y transform, que en ese instante están en su fotograma 0) y mide el
desplazamiento por correlación cruzada 2D:

| Ventana | Desplazamiento del fondo | Diferencia de pantalla completa |
|---|---|---|
| 1280×720 (16:9) | **+0, +0 px** | 9,8 % (logotipo y botones) |
| 1920×1080 (16:9) | **+0, +0 px** | 9,1 % |
| 1024×768 (4:3) | **+0, +0 px** | 29,0 % (menú más ancho: 5 opciones) |
| 2560×1080 (21:9) | **+0, +0 px** | 6,5 % |
| 844×390 (móvil apaisado) | **+0, +0 px** | 36,4 % (sin lema, botones a ancho completo) |

Cero desplazamiento en las cinco ventanas. Lo que queda en la columna de la derecha es UI
nueva que aparece encima (logotipo, opciones, pie), no un salto de la imagen: medido sobre
el fondo aislado, los píxeles que difieren son 0 en las esquinas y el damero central.

Dos cosas que se descubrieron midiendo y que estaban mal:

1. **El logotipo no estaba donde el del menú.** Estaba 11 px a la izquierda y 2 px abajo, y
   el lema arrancaba 9 px a la izquierda. Ahora `logoBox()` copia las medidas del CSS
   —incluidos los `@media (max-aspect-ratio: 4/3)`, `(max-width: 900px)` y
   `(max-height: 560px)`— y el lema se centra en la **caja de marca**, no en el logotipo.
2. **El encuadre no era el del menú.** El canvas recortaba la lámina contra el borde; el
   menú la centra. Ahora el último plano se pinta con la regla del menú, redondeando el
   destino a píxeles enteros.

### QA de Playwright (`tools/qa/test_restart_flow.js`)

Actualizado a la tabla nueva (8 planos / 42 s, `12345678`, animación en los 8, capa de
multitud presente, búsqueda de fallo en el plano 3 y salto en 40,5). **No se ha podido
ejecutar aquí**: este entorno no tiene Playwright instalado y `npx playwright install
chromium` falla. Todo lo que ese archivo comprueba se ha verificado por otra vía con
Chromium real y se reporta arriba. Queda pendiente de ejecutarse en una máquina con
Playwright.

### Lo que no se puede comprobar aquí

- **Audio audible**. El banco y el navegador sin cabeza confirman que el contexto arranca y
  que se disparan 161 sucesos, pero no que suene bien por altavoces.
- **Nada de lo anterior en otras máquinas.** Aquí sí se ha probado la compatibilidad de
  resolución: 1280×720, 1920×1080, 1366×768, 1024×768, 800×600, 2560×1080, 844×390 y
  720×1280, ejecutando la intro y el descenso enteros en cada una (`work/tools/resolutions.js`)
  y la entrega al menú en cinco de ellas (`work/tools/continuity.js`). **Ninguna** produce
  fotogramas negros y en todas el fondo de la entrega coincide al píxel.
- **Mando físico** (se simula la API `Gamepad`).
- **Hardware real**. Los tiempos son de este entorno.

---

## 8. Antes y después

| | Intro anterior | Intro nueva |
|---|---|---|
| Duración | 32 s | 42 s |
| Planos | 7 | 8 |
| Actos | 3 implícitos | 5 explícitos |
| El bucle | Cartelas + página repetida | **El reloj no avanza**: cuatro vueltas medidas |
| La Torre | Fondo de una viñeta | **Plano propio** de 5 s con escala y detalle |
| El protagonista | Entraba tarde y pequeño | Botas → brazo → cara, tres escalas |
| La corrección | Una grieta | Bandas repetidas, arquitectura doblada, grietas ramificadas |
| La caída | Corte | Página que se parte + sombrero que cae |
| El final | Estático (2/9 muestras) | Empuje lento + ascuas + barrido de luz (**0/210 congeladas**) |
| Cartelas aprobadas | 1 de 2 | **2 de 2**, literales |
| Errores de consola | 0 | 0 |

---

## 9. Archivos

| Archivo | Estado |
|---|---|
| `src/dd_opening.js` | **Reconstruido** (intro + descenso + música) |
| `src/dd_asset_registry.js` | +1 entrada (`cine_op03_crowd_layer`) |
| `assets/cinematics/restart/opening/op_03_crowd_layer.png` | **Nuevo** (recorte, no ilustración) |
| `tools/art_master/cinematic_crowd_layer.py` | Nuevo (genera el recorte de forma reproducible) |
| `tools/qa/test_restart_flow.js` | Actualizado a 8 planos / 42 s |
| `index.html`, `DEADBEAT_DISCO.html` | Reconstruidos |
| `docs/RESTART/15_…` + `evidencia_cine_v2/` | Esta documentación y sus pruebas |

Nada de esto toca menús, HUD, juego, combate, IA, armas, balance, economía, progresión,
enemigos ni el diseño del Refugio. Para revertir: `git checkout 2d1f6e8 -- src/dd_opening.js
src/dd_asset_registry.js` y borrar el PNG nuevo.
