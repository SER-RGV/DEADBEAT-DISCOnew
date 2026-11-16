# V2.1 — Continuidad narrativa y descenso final

**Base aprobada:** la intro de 42 s de la V2 (art direction aprobada). La V2.1 **no la rehace**:
solo corrige lo que impedía entender la historia y lo que impedía que el final funcionara.

Todo el trabajo está en `src/dd_opening.js` (+ el HTML activo regenerado).

---

## 1. Qué cuenta el bucle ahora (lectura en orden)

| Plano | t (s) | Qué ve el espectador | Función narrativa |
|---|---|---|---|
| 1 | 0.0–3.5 | Sala vacía, «LA GUERRA HABÍA TERMINADO.» | El orden anterior ya terminó. |
| 2 | 3.5–8.5 | Multitud que sube por la Torre; **ventana de detalle** que rota en cada pasada (pista / manos / plato) | **El bucle**: mismo gesto, mismos objetos, distinto índice. |
| 3 | 8.5–14 | El protagonista en la sala: «EL TIEMPO SE PIERDE SOBRE MÍ.» | Está fuera de compás. |
| 4 | 14–21 | El suelo: pasos y pies que **no** van al ritmo; «NADIE RECUERDA CUANDO DEJÓ DE MIRARLO A ÉL.» | Su anomalía, concreta y física. |
| 5 | 21–26 | Los que bailan no lo ven; «EL SALÓN CRECIÓ HACIA ARRIBA…» | La Torre funciona sin él. |
| 6 | 26–31 | Retratos del protagonista; «ÉL NO CEDE.» | La respuesta: no se ajusta. |
| 7 | 31–35.5 | **Rotura del suelo** (grietas 31.15→31.9, agujero 26-gono 31.85→32.6, 5 losas, «Y EL SUELO SE ABRE.», CRRRAC) y **caída real** (eje de la Torre recorriéndose, sombrero que cae, «NO HAY SUELO QUE LO SOSTENGA.») | **La Torre lo corrige.** |
| 8 | 35.5–42 | Estallido del túnel → **el Refugio real**: arcos, lámparas de neón, suelo en perspectiva, alfombra, sillas, zorro, plataforma cian. Él **está de pie sobre el suelo**. «LA TORRE YA NO PUEDE SOSTENERLO.» → «POR FIN, HABÍA QUIEN PODÍA IMAGINAR UN MAÑANA.» → menú real. | Llega, está, y el espacio es jugable. |

**La relación anomalía ↔ Torre ↔ corrección** se lee sin una línea de explicación:
plano 2 (bucle idéntico) → planos 3–4 (él no sigue el compás) → plano 7 (el suelo se abre
*debajo de él*, no encima) → plano 8 (cae **hacia arriba del árbol**, al Refugio).

---

## 2. Los dos cambios de la V2.1

### 2.1 Acto IV — el suelo se rompe y él cae de verdad (31.0–35.5)

Antes: la rotura era un zoom sobre una imagen fija y la caída se leía como paneo.
Ahora:

- **Grietas** que se dibujan progresivamente desde el pie (`cracks` 31.15 / 31.5 / 31.7 / 31.9).
- **Agujero poligonal de 26 lados** que crece de 0 a radio completo entre 31.85 y 32.6 —
  la ruptura *ocupa* el encuadre, no lo amplía.
- **5 losas** que se desprenden con rotación propia.
- **Caída real** (`shaftSide {mode:"fall"}`): el mundo sube por el eje de la Torre
  (scroll 0.06 → 0.36), el protagonista queda fijo en cuadro y el sombrero lo abandona
  entre 33.0 y 34.35 → **el movimiento es del decorado, no de la cámara**.
- Cumple el criterio del brief: *no confundir movimiento de cámara con evolución de escena*.
  Aquí hay **evolución**: aparece el agujero, se van las losas, el mundo asciende.

### 2.2 Acto V — el túnel ya no se lleva el desenlace (35.5–42)

Antes: el túnel ocupaba casi todo el final y el Refugio llegaba como una postal.
Ahora:

- El túnel **estalla y se va** en 35.5–38 (no se queda).
- 37.5–40.2: **Refugio real completo** (arcos, 4 lámparas de rombo, suelo de damero con
  escorzo `pow(t,2.1)`, alfombra, 4 sillas, zorro de neón, plataforma cian) con el
  protagonista **de pie sobre el suelo** (`feetY = padY − 0.105H`), respirando.
- 38–42: plano del título — la sala **sigue viva** (deriva, pulsos de lámpara, ascuas,
  barrido de luz, último aliento) y **se disuelve con el menú**, no se corta.
- El último fotograma de cine y el primer fotograma del HUB comparten geometría:
  **enlace a +0,+0 px** en los 5 formatos (ver §4).

---

## 3. Bucle — cómo se refuerza sin explicar

- La **ventana de detalle** del plano 2 rota por pasada: pista → manos → plato, y vuelve a
  empezar. Es el mismo instante repetido con otro índice: el espectador ve *el bucle*, no
  un montaje de recursos.
- La ventana **se congela** en la 4.ª pasada (`wIn = 1 − frozen*0.85`): el bucle no puede
  seguir repitiéndose para siempre porque **algo se ha roto**.
- Ningún diálogo nuevo, ningún narrador nuevo, ningún círculo leído. Solo los dos rótulos
  aprobados, una vez cada uno.

---

## 4. QA real (navegador, no harness)

| Prueba | Comando | Resultado |
|---|---|---|
| Movimiento por plano (210 muestras, 0.2 s) | `node work/tools/motion.js intro` | **muestras congeladas: 0** — dif. medias 166 / 111 / 280 / 140 / 114 / 111 / 253 / 217 |
| Bordes y errores | `node work/tools/audit.js` | intro **42.02 s**, 630 frames, 161 eventos de audio, **0 errores**, 309 assets |
| Arranque real (Chromium) | `node work/tools/live.js` | intro **41.62 s**, **0 errores**, HUB activo, protagonista `idle_07b` |
| Enlace cine → HUB | `node work/tools/continuity.js` | **+0, +0 px** en 1280×720, 1920×1080, 1024×768, 2560×1080 y 844×390 |

**Hoja de contacto exigida — últimos 12 s a 0.5 s:**
`hoja_contacto_30-35.5.jpg` (30.0 → 35.5) y `hoja_contacto_36-41.5.jpg` (36.0 → 41.5).

---

## 5. Capturas del enlace con el Refugio

- `enlace_refugio_real.jpg` — el Refugio **real** jugable (referencia autoritativa).
- `acto_V_refugio_plano_completo.jpg` — el cine, 39.6 s.
- `acto_V_llegada_titulo.jpg` — llegada + rótulo + disolución al menú (37.8 / 38.0 / 38.2 / 40.4 / 40.7 / 41.0).
- `acto_V_descenso_plano_completo.jpg`, `acto_V_tunel_estallido.jpg`, `acto_IV_caida_plano_completo.jpg`.
- `ocho_planos_juego_real.jpg` — los 8 planos capturados **en el navegador real**.

---

## 6. Antes / después

| | V2 (aprobada) | V2.1 |
|---|---|---|
| Rotura del suelo | zoom sobre imagen fija | grietas + agujero de 26 lados + 5 losas |
| Caída | paneo lateral | eje de la Torre recorriéndose, sombrero desprendido |
| Acto V | túnel dominante, Refugio como postal | túnel que estalla y se va; Refugio con presencia y espacio |
| Protagonista en el Refugio | flotando / ausente | **de pie sobre el suelo**, respirando |
| Fin | corte a menú | disolución limpia con el menú (sin flash blanco) |
| Ventanas de detalle del bucle | vacías | contenido real, ciclo fijo, congelación en 4.ª pasada |
| Muestras congeladas | 7 | **0** |

---

## 7. Pendientes (no bloquean)

1. El tema musical no está re-escrito: los 161 eventos de audio son los de la V2 y encajan,
   pero el *FSSSSH* de la caída podría acortarse 0.2 s para no pisar el estallido.
2. La ventana de detalle del plano 2 cae cerca del rótulo en 13.3 s en 4:3; conviene
   desplazarla 0.03 W a la izquierda solo en ese aspecto.
3. En `movil_844x390` el rótulo final ocupa el 37 % del alto (legible, pero justo).
4. El Refugio pintado a mano es una **aproximación** del real: no usa el renderer del motor.
   Es deliberado (el caché del motor no está listo en el arranque), pero si el renderer
   cambia, hay que revisar arcos y zorro.
