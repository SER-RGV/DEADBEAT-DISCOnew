# FASE 2 · AUDIO

Fecha: 2026-11-26 · Rama: `arena/1f2ec2fb-deadbeat-disconew`
Alcance: hacer que el juego **suene**, de forma coherente y medible, sin añadir
peso ni romper la cadencia. Sin ficheros de audio: todo el sonido es sintetizado.

---

## 1 · Veredicto en una tabla

| Medida | Antes | Después | Método |
|---|---|---|---|
| Música de partida (combate) | pico −68 dBFS y **1–3 notas/s** | pico **−9,6 dBFS**, RMS −33 dBFS y **9,5–12 notas/s** | registrador + decodificación (§2) |
| Portada / menú | pico −11 dBFS, RMS −27 dBFS | igual (−10,9 / −27,4) | idem |
| Refugio | idéntico al menú (pico −11 dBFS) | **targetGain ×0,32** (RMS −32,6 en local frente a −27,3 del menú) | suite `audio` |
| Silencio del menú en partida | el contexto seguía «running» | contexto **suspendido**, sin salida | suite `audio` |
| Mover el volumen del juego | **no cambiaba nada** | `music=0` baja la partida 10 dB (−8,1 → −19,8 dBFS) | `DD_MIX.set()` en caliente |
| Recortes al disparar | no medidos | **0** bloques recortados, pico ≤ −9 dBFS | suite `audio` |
| Peso del audio | 0 B | **0 B** (0 ficheros en `assets/`) | suite `audio` |
| Tamaño del build | 5.856.922 B | 5.859.989 B (**+3,0 KB, +0,05 %**) | `wc -c` |

Suite nueva: `tools/qa/e2e/11_audio.spec.js` → **15 PASS · 0 FAIL · 0 SKIP · 104–109 s**.
CI: run [`45778460895`](https://github.com/SER-RGV/DEADBEAT-DISCOnew/actions/runs/45778460895)
→ **7/7 trabajos en verde** (el trabajo de juego incluye ya la suite de audio).

---

## 2 · Cómo se mide (y cómo se midió mal)

Dos instrumentos, y el orden importa:

1. **Sonda de QA** (`tools/qa/lib/audio.js`): engancha cada `AudioContext` en
   serie antes de su `destination` con un `ScriptProcessorNode` y acumula pico,
   RMS, notas y recortes. Es la que corre en cada pasada del arnés.
   *Aviso*: el `ScriptProcessor` vive en el hilo principal; bajo carga pierde
   bloques, así que sus cifras sirven para comparar y para el contrato holgado
   (≥ −26 dBFS), no para décimas.
2. **Registrador** (`tools/qa/audio_capture.js`): graba la salida real de cada
   contexto con `MediaRecorder` sobre un `MediaStreamDestination` (hilo de audio,
   sin pérdidas) y decodifica lo grabado con `decodeAudioData` para calcular
   pico/RMS por tramo. Es el que decide las cifras de la tabla §1.
   Resultado: `docs/evidence/fase2/audio_measures.json`.

Errores de instrumentación corregidos por el camino (quedan anotados porque
costaron medidas falsas): analizador conectado en paralelo (medía silencio
siempre), identificador de contexto repetido (contaba 1,7 notas/s con la música
sonando), ventanas recolocadas hacia atrás cuando la pista ya había muerto (medía
la portada como si fuera la partida) y `localStorage` escrito antes de la primera
navegación (no se aplicaba).

---

## 3 · Inventario real de audio

Cuatro `AudioContext`, todos a 44,1 kHz, creados en momentos distintos:

| # | Quién lo crea | Para qué | Cadena |
|---|---|---|---|
| 0 | `DDC_COVER.music.start` → `V()` (`startMenuMusic`) | portada y **cama del Refugio** | gain (0,29 × vol × duck) → compresor (−15 dB, ratio 4) → delay 3·¹⁄₆₄ con realimentación 0,22 → destination |
| 1 | `src/dd_opening.js` → `audioReady()`/`start()` | apertura cinematográfica | `MASTER_LEVEL = 0,7` → limitador −3 dB → destination |
| 2 | `rp()` al arrancar la partida (`startRun`) | **música y efectos de partida** | mezclador → limitador −1,2 dB → gain de cadena → compresor (−15 dB) → destination |
| — | módulo DJ/generativo | setlist y comentarios | analizador `fftSize=256`, compresor −13 dB, `lowpass`, buses propios |

El **mezclador** (contexto 2) es el que interesa:

```
voces ─┬─ music (0,85) ─┐
       ├─ sfx   (0,90) ─┼─ master (1,0) ─ limitador −1,2 dB (ratio 20) ─ gain 2,4 ─ compresor −15 dB ─▶ destination
       └─ dj    (0,80) ─┘
```

Sus cuatro niveles se guardan en `dmodisco_vol_v1` y se pueden mover en caliente
con `DD_MIX.set(nombre, 0…1)`; `DD_MIX.vol` devuelve el estado. El build publica
`window.DD_MIX` a propósito: la QA audita los buses reales en vez de deducirlos.

---

## 4 · Los tres fallos encontrados

### 4.1 · La música de partida no sonaba: el reloj programaba 120 ms por delante

El planificador de la música (`Li()`) corría con `setInterval(…, 32)` y solo
programaba hasta `jl.currentTime + 0,12`. En cuanto el hilo principal se atasca
—render por software, equipos modestos— los turnos se pierden y el bucle
`if(ql < e - 2*ri)` **salta** los pasos perdidos en vez de recuperarlos: la
música se convierte en silencio con notas sueltas. Medido: pico −68 dBFS y
1–3 notas/s en combate frente a −11 dBFS y ~75 notas/s en la portada.

Arreglo (en `tools/build_active_html.py`, parche quirúrgico, nunca a mano sobre
el HTML generado):

- adelanto 0,12 s → **1,25 s**;
- reloj 32 ms → **140 ms** (menos despertares, misma música);
- gain de la cadena de partida 0,29 → **2,4** (antes el juego entero sonaba
  ~18 dB por debajo de su propia portada).

Coste: 0 B de peso (son tres constantes) y menos temporizadores que antes.

### 4.2 · El mezclador existía pero nadie lo atravesaba

El mezclador construía sus cuatro buses y su limitador, pero su API solo los
publicaba por `node(nombre)`. Todas las voces del motor escriben
`Xl.music || Fl`, `Xl.sfx || Fl`, `Xl.dj || Fl`: como `music`, `sfx` y `dj` **no
existían como propiedades**, la condición caía siempre al `Fl` directo. Efectos:
música, efectos y limitador fuera del circuito, y los volúmenes del juego sin
efecto. Comprobado en caliente: con `music = 0` la partida seguía sonando
exactamente igual (−9,6 dBFS).

Arreglo: publicar los buses como propiedades
(`get music(){return d.music}, …`). Ahora `music=0` baja la partida de −8,1 a
−19,8 dBFS y `dj=0` a −20,5 dBFS. **Límite conocido**: con `master = 0` todavía
sale audio a −18,8 dBFS, es decir, una parte del contenido de la partida sigue
sin pasar por el mezclador (subsistema de ambiente/DJ con buses propios). Está
medido y anotado en §7; arreglarlo exige tocar ese subsistema, no el mezclador.

### 4.3 · G2 · «la música del menú no se corta al entrar en partida»

Verdicto: **no es lo que parecía**. Con la medición delante:

- Al arrancar la partida el contexto de portada queda **suspendido** y no emite
  (comprobado: estado `suspended`, pico ≤ −60 dBFS en la ventana de partida).
- Lo que se veía en el Refugio **es una decisión del propio juego**:
  `src/dd_hub_system.js` arranca la pista del club como cama del Refugio, con un
  comentario que explica por qué se agenda con 900 ms de retraso (para no
  pisarse con `enterGame()`), y la estación «reproductor» la para y la reanuda a
  gusto del jugador (`record.quiet`).
- Lo que **sí** estaba mal: el Refugio sonaba exactamente igual que la portada
  (−11 dBFS en ambos), y la telemetría publicaba `menuMusic: true` sin decir a
  quién pertenecía, lo que convertía una decisión de ambiente en un falso fallo.

Arreglo: la cama del Refugio se marca con `duck` **antes** de arrancar
(×0,32 ≈ −10 dB; si se marca después, el fundido de arranque gana la carrera y
el Refugio vuelve al nivel de portada: medido). Telemetría nueva:
`DD_BOOT.getState().audioOwner` ∈ `menu · menu-silencio · intro · refugio ·
refugio-silencio · transicion · partida · silencio`. La suite `audio` comprueba las dos
cosas: que el motor atenúa (`targetGain` 0,1024 frente a 0,32, exacto) y que el
Refugio **no suena más alto que el menú** (RMS). La comparación de RMS «4 dB por
debajo» se retiró porque en el Refugio suenan a la vez los efectos de interfaz y
en CI daba media décima de diferencia; se mide lo que no puede fallar.

---

## 5 · Qué suena en cada estado

| Estado | Dueño (`audioOwner`) | Qué se oye |
|---|---|---|
| Portada / submenús | `menu` | pista del club completa (pico ≈ −11 dBFS) + sonidos de interfaz |
| Intro | `intro` | contexto propio de la apertura (limitador −3 dB) |
| Refugio | `refugio` | la misma pista como ambiente, atenuada ×0,32, más pasos, diálogo y estaciones |
| Partida | `partida` | música por pasos (batería, bajo, arpegios) + efectos de disparo, daño, combo, rave y jefe |
| Muerte / victoria | `partida` | golpe descendente + stinger; la música baja para dejar sitio |
| Sin partida ni menú | `transicion` / `silencio` | nada |

Catálogo de efectos del motor (funciones del script principal, todas con
presupuesto de voces `MAX: 64` y puerta `ci.gate`): `pi`/`fi` (impacto grave),
`hi`/`bi` (tic de interfaz), `mi` (arpegio de recompensa), `Ai` (golpe de muerte),
`xi` (stinger de victoria/derrota), `di`/`ui` (tono genérico con envolvente),
`Fi` (bombo), `Qi` (charles). Los accesorios del juego ya declaran su sonido por
nombre (`fireSizzle`, `iceCrash`, `electricZap`…); el motor los resuelve dentro
del mismo presupuesto.

---

## 6 · Reproducir

```bash
npm ci --no-audit --no-fund
python3 tools/build_active_html.py          # reconstruye index.html / DEADBEAT_DISCO.html
node tools/qa/run.js --only=audio           # contrato audible (15 pruebas, ~110 s)
node tools/qa/audio_capture.js              # medidas de referencia → docs/evidence/fase2/
node tools/qa/audio_capture.js --solo-efectos   # música a 0: aísla los efectos
```

La suite `audio` corre en la CI dentro del trabajo «HUB, diez plantas, partida
real, audio y guardado».

### 6.b · Dos pruebas frágiles encontradas por la propia CI

La primera pasada de CI con la suite de audio dio dos rojos que en local no
salían. Se corrigieron **bajando la fragilidad, no el listón**:

- `audio` · la comparación «RMS del Refugio 4 dB por debajo del menú» depende de
  cuántos efectos de interfaz caen en la ventana (CI: −30,2 frente a −30,1). Se
  sustituyó por dos garantías: el motor atenúa (exacto, `targetGain`) y el
  Refugio no suena más alto que el menú.
- `hub` · el movimiento con teclado midió 0 px en CI y 29 px en local con el
  mismo commit: el lienzo no tenía el foco. Ahora se pulsa el lienzo y se
  reintenta hasta tres veces, informando de los intentos.
- Se añadieron **anotaciones de GitHub** por fallo (`report-summary.js
  --annotations`): en este entorno los logs y los artefactos de Actions no se
  pueden descargar (EOF) y sin anotaciones un rojo de CI es un rojo mudo.

## 7 · Límites conocidos (medidos, no supuestos)

1. **`master = 0` no es silencio absoluto**: queda −18,8 dBFS de ambiente/DJ con
   buses propios (§4.2). Los volúmenes sí afectan a música y efectos.
2. **La sonda `ScriptProcessor` pierde bloques bajo carga**: sus cifras bailan
   ±5 dB entre pasadas. Para decisiones de ganancia se usa el registrador.
3. **La intro mantiene su contexto activo** después de terminar (en silencio):
   consume poco, pero no se suspende.
4. **No se guardan ficheros de audio como evidencia**: llevar el comprimido por
   el canal de `evaluate` llegaba corrupto (56 B). La evidencia son las medidas
   decodificadas (`docs/evidence/fase2/audio_measures.json`) y el informe de QA.
5. **Nada de esto se ha escuchado con oído humano**: son medidas de nivel,
   densidad de notas y recortes. El juicio estético queda pendiente.
