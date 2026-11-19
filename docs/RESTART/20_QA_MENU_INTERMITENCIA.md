# 20 · QA de la navegación del menú: intermitencia medida y su causa

Documento de trabajo abierto. **No declara nada cerrado.** Su objetivo es que
quien siga con esto no repita la investigación desde cero.

Fecha: 2026-11-16 · Rama: `arena/18fda02d-deadbeat-disconew` · Cabecera medida:
`b3a9770`.

---

## 1 · Lo que se midió, sin interpretación

Batería completa (`tools/qa/test_restart_flow.js`), árbol **idéntico** a
`b3a9770`, cien por cien reproducible:

| Serie | Limpias (69/69) | Con algún fallo |
|---|---|---|
| 5 ejecuciones | 2 | 3 |
| 6 ejecuciones | 5 | 1 |
| 3 ejecuciones (registro anterior) | 3 | 0 |

Tasa agregada: **~1 de cada 5 ejecuciones** presenta un fallo, y el fallo cambia
de caso entre ejecución y ejecución. Las tres comprobaciones afectadas son
siempre las mismas tres, todas de interfaz:

- `[TECLADO] ↓ recorre las opciones y da la vuelta`
- `[TECLADO] ↑, W, S e Inicio funcionan; el foco sigue a la selección`
- `[RATÓN] pasar el cursor selecciona`
- `[VUELTAS] tres recorridos completos seguidos` (menos frecuente)

Ninguno de los fallos es visual, de audio, de entrega al Refugio ni de contenido:
son todos de **desplazamiento de la selección**.

**Corrección de una afirmación anterior.** El comentario del PR #32
(issuecomment-6924927111) dice «69 de 69 superadas, tres ejecuciones
consecutivas». Es cierto que esas tres salieron limpias, pero con tres muestras
la tasa de fallo real (~20 %) no se puede distinguir del azar. La muestra
insuficiente convertía una batería intermitente en una batería verde. Este
documento lo corrige.

---

## 2 · Causa del fallo de teclado, aislada

Con traza de `keydown` + `document.activeElement` + `menuIndex` en el instante
exacto del fallo se observaron **dos mecanismos distintos**, ambos reales:

### 2.1 · La tecla no llega al manejador del menú

Traza de una ejecución fallida (secuencia `↓↓↓↓ ↑ S W Inicio`):

```
ArrowDown  foco=options def=true
ArrowDown  foco=credits def=true
ArrowDown  foco=exit    def=true
ArrowDown  foco=new     def=true
ArrowUp    foco=exit    def=true
KeyS       foco=new     def=true
KeyW       foco=new     def=false   ← la tecla NO se atendió
Home       foco=new     def=true
```

El foco era el correcto, no hubo errores en consola y aun así
`preventDefault` no se ejecutó: **el manejador del menú no vio el evento**.

Comprobación directa: con el menú abierto se registran dos escuchas de
`keydown` en captura, una en `window` y otra en `document`. Al pulsar `Home`:

```
["doc:Home:false"]
```

La de `window` **no se ejecuta**. Hay un listener, registrado antes que los
módulos de este proyecto y en fase de captura sobre `window`, que corta la
propagación. Es el mismo mecanismo contra el que ya existe
`DD_KEYBOARD_GUARD` en `tools/build_active_html.py`: la guarda envuelve
`addEventListener` para neutralizar escuchas heredadas de la portada que llaman a
`stopImmediatePropagation()`. Funciona para todo lo registrado **después** de
ella; no puede neutralizar lo registrado **antes**, porque entonces ese código ya
estaba dentro de la página. Ese hueco es el que deja caer una tecla suelta.

### 2.2 · El foco se cae a `<body>`

En otra ejecución fallida la tecla sí llegó, pero lo hizo con
`foco=BODY` (`def=false`). Con `activeElement === body` el menú no recibe la
navegación. El origen es el `focus()` explícito de `setMenuSelection`:
re-enfocar un botón justo cuando acaba de recibir el foco por su cuenta lo deja
fuera del árbol de foco durante un turno.

---

## 3 · Lo que **sí** está resuelto y probado

Medido aparte, aislando el teclado (10 repeticiones por variante):

- Con el manejador **en el propio botón** (`btn.addEventListener("keydown")`) y
  una marca por evento para no ejecutar dos veces:
  **0 fallos de 10** en la secuencia completa del test. El mecanismo es correcto:
  un evento que empieza en el botón no puede ser cortado por nada registrado en
  `window` en captura.
- El producto **sin tocar** (`b3a9770`) falla ~1 de cada 6 en esa misma prueba
  aislada, con el mismo patrón de «una tecla suelta».

Es decir: **la solución está identificada y verificada en aislamiento**, pero
**no se ha integrado** porque al hacerlo hay que reconciliarla con el manejador
global (submenús, ratón, mando) y esa integración no se llegó a verificar en la
batería completa.

---

## 4 · Por qué no se ha integrado todavía

Al integrarlo se provocó una **doble ejecución** (`2,0,2,0…`): cada tecla la
atendían el botón y el manejador global. Se corrigió con marca por evento y la
prueba aislada pasó a 0/10, pero la batería completa siguió mostrando
intermitencia en otros dos puntos (`[RATÓN]` y `[VUELTAS]`), y se tomó la
decisión de **no dejar cambios de producto sin verificar en la batería**. El
árbol de `src/` quedó restaurado a `b3a9770`.

---

## 5 · Estado actual, sin adornos

- `src/` = `b3a9770`, sin cambios sin verificar.
- Batería: **intermitente, ~1 de cada 5 ejecuciones** con un fallo de interfaz.
- V3.0 (cinemática, entrega al Refugio, audio, 12 entregables): **sin relación
  con esta intermitencia**; ninguna de las tres comprobaciones afectadas toca la
  cinemática.
- Entregable 10 (`comparativa_v22_v30.jpg`): completo y verificado.

## 6 · Lo siguiente, concreto

1. Integrar el manejador en el botón con marca por evento y **excluir la
   navegación del menú del manejador global** mientras no haya submenú, para que
   no haya dos caminos.
2. Repetir el barrido de 10 ejecuciones y exigir **10/10**, no 3/3.
3. `[VUELTAS]`: antes de culpar al producto, comprobar si en las ejecuciones
   fallidas `getLastEnd().by` es `skip` o la tecla llegó tarde; el chequeo usa
   `sleep([600,1700,3300])` y luego espera `PLAYING`, así que un salto que llegue
   después de entregar el control deja `at.shot` en un plano posterior.
4. `[RATÓN]`: el `hover` por coordenadas depende del centro del botón en ese
   instante; medir `getBoundingClientRect` justo antes del `mouse.move` y
   reintentar una vez si la selección no cambió.
