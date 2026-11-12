# DEADBEAT DISCO — Fase 06: reconstrucción técnica del protagonista

- **Fecha:** 2026-11-12 · **Rama:** `arena/1a801cc0-deadbeat-disconew`
- **Estado:** auditoría y especificación aprobadas. Decisiones cerradas: sin sombrero en Refugio y combate, perfil puro a la derecha, reflejo horizontal provisional, IDLE de 4 fotogramas. Muestra IDLE y visor: `05_MUESTRA_IDLE.md`.
- **Canon visual:** `assets/cinematics/restart/character_master/protagonist_master_approved.png` (SHA-256 `43d9e58f…004e5d`, verificado al empezar y al terminar). Ficha del diseño: `03_PERSONAJE_MAESTRO.md`.
- **Canon narrativo:** «Sus tatuajes representan los caminos que la canción eliminó». Sin significados añadidos.

| Parte | Estado |
|---|---|
| A. Auditoría técnica del motor y de los sprites | **Terminada** |
| B. Especificación anatómica | **Terminada** (medidas aproximadas sobre la lámina) |
| C. Vistas y orientaciones | **Diseñada**; requiere dos decisiones tuyas |
| D. Matriz de animaciones | **Diseñada** |
| E. Reglas de continuidad | **Terminadas** |
| F. Arquitectura de recursos | **Diseñada** |
| G. Muestra IDLE y visor | **Producida** (ver `05_MUESTRA_IDLE.md`). No supera la continuidad de tatuajes; pendiente de evaluación |

Evidencia gráfica: `evidencia_produccion/hoja_vistas_proporciones.jpg` y `evidencia_produccion/sprites_antiguos_contrato.jpg`.

---

## A. Auditoría técnica

### A.1 Dónde vive el código

- `index.html` y `DEADBEAT_DISCO.html` son un build **generado** por `tools/build_active_html.py` a partir de `backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html` más los módulos de `src/`.
- El motor original está minificado dentro de ese HTML. El script de build le inyecta un «puente» que sustituye la función de dibujo del jugador (`Pf`) por una llamada a `DD_WORLD.drawProtagonist`.

| Pieza | Archivo | Función |
|---|---|---|
| Registro y carga | `src/dd_asset_registry.js` (`MANIFEST`, `preloadAll`, `get`) | Un `Image()` por recurso, 269 entradas, URL con `?v=` de caché |
| Dibujo | `src/dd_world_renderer.js` l. 446–775 (`resolvePlayerPose`, `drawProtagonist`, `getPlayerWeaponMount`) | Elige fotogramas y los pinta en Canvas 2D |
| Máquina de estados | motor, objeto `pAnim` (`window.DMO.playerAnim`) | Decide estado, pose de torso, pose de piernas y fase de zancada |
| Puente y arma | `tools/build_active_html.py` l. 264–322 | Llama a `drawProtagonist` y coloca el arma en la mano |
| Refugio | `src/dd_hub_system.js` l. 238–256 y 389 | Mueve al jugador y escribe la pose directamente en `pAnim` |
| Cinemática | `src/dd_cinematic_camera.js` l. 393–399 | Usa `hero_idle_00`, `hero_shoot_00`, `hero_walk_00…03` |
| Precarga de la intro | `src/dd_boot.js` l. 304 | Lista de identificadores que espera antes de la intro |
| Línea de producción | `tools/art_master/` (`batch.py`, `measure.py`, `preview_rig.py`, `probe_player.js`) | Croma → PNG, anclas, alta en registro, sonda en el juego |

### A.2 Los sprites actuales

La tanda `R01_PROTAGONISTA` tiene **27 PNG**: 22 ilustraciones únicas, 2 alias de cinemática y 3 capas derivadas. Todos son RGBA con transparencia, mirando a la derecha.

| Grupo | Identificadores | Lienzo | Uso |
|---|---|---|---|
| Reposo | `player_idle_00` | 288×512 | Refugio y cinemáticas (sin arma) |
| Piernas de caminata | `player_walk_00…03` | 336×512 | Mitad inferior en combate |
| Caminata de cuerpo entero | `hero_walk_00…03` | 288×512 | Refugio y cinemática (brazos al costado) |
| Puntería horizontal | `player_shoot_00`, `player_fire2`, `player_firehip` | 288 / 384 / 288 ×512 | Guardia, fusil a dos manos, arma pesada desde la cadera |
| Puntería arriba | `player_aim_up_01…03` | 288×512 | Elevación ≥19°, ≥47°, ≥72° |
| Puntería abajo | `player_aim_down_01…03` | 288×512 | Elevación <−15°, <−41°, <−70° |
| Daño | `player_hurt_00` | 288×512 | Golpe y aturdimiento |
| Habilidad | `player_boost_00` | 512×512 | Impulso y bomba |
| Esquiva | `player_roll_00` | 384×384 | Voltereta |
| Muerte | `player_death_00` | 640×320 | Derribo |
| Alias de cinemática | `hero_idle_00`, `hero_shoot_00` | 288×512 | Copias de reposo y guardia |
| Capas derivadas | `player_firehip_arms`, `player_aim_down_02_arms`, `player_aim_down_03_arms` | 288×512 | Puños que quedan por debajo del corte de cintura |

- **Figura en reposo:** 461 px de alto dentro del lienzo de 512 (cabeza en y=44, suelas en y=504).
- **Diseño:** el anterior. Sin sombrero, chaleco de cuello alto, vaquero recto, tatuajes genéricos. Se conservan intactos.

### A.3 Contrato de lienzo y anclajes

| Dato | Valor | Dónde está |
|---|---|---|
| Alto dibujado del lienzo | `PLAYER_BASE_H = 104` px de mundo (voltereta 84, derribo 56) | `dd_world_renderer.js` |
| Línea de suelo | borde inferior del lienzo en `y + 16`; suelas en `y + 14` | `PLAYER_FOOT_Y`, `PLAYER_GROUND_Y` |
| Eje horizontal | centro del lienzo = eje del torso; el ancho puede variar por pose | comentario del contrato |
| Ancla de cinturón | `anchors.belt`, fracción del alto (0,49–0,53; admite 0,2–0,8) | manifiesto, por fotograma |
| Ancla de mano | `anchors.hand = [u, v]`; sin ancla, la pose no lleva arma | manifiesto, por fotograma |
| Escala en el Refugio | 1,16 | `dd_hub_system.js` l. 396 |
| Zoom de cámara | 1,16 (entre 1,06 y 1,34) | motor, `N.zoom` |
| Densidad de píxel | hasta 2,5 | puente, `ensureNativeDprCanvas` |

**Tamaño real en pantalla.** La figura mide unos 94 px de mundo: alrededor de 109 px CSS en combate y hasta ~310 px físicos en una pantalla de alta densidad. Los 461 texeles del sprite cubren ese máximo sin ampliar.

### A.4 Hitbox

- Círculo de radio **14 px** centrado en `(x, y)` del jugador (`ye.r = 14`), apoyado en el suelo.
- No depende del sprite: cambiar el arte no cambia la colisión.
- Las balas del jugador salen a la altura del «hombro» del motor (`y − 56`). El ancla de mano debe quedar cerca de esa altura en las poses de puntería horizontal.

### A.5 Estados y animación

El motor tiene 17 estados con prioridad, pero **solo 12 poses dibujadas**, y casi todo el movimiento es procedural.

| Estado del motor | Prioridad | Cuándo | Qué dibuja |
|---|---|---|---|
| `death` | 100 | fin de partida | `player_death` |
| `dodge` | 90 | `rollT > 0` (0,32 s) | `player_roll` girando una vuelta cada 0,32 s |
| `stun` / `hurt` | 85 / 80 | aturdido (0,32 s) o recién golpeado (~0,6 s) | `player_hit`; piernas de caminata si se mueve |
| `ability` | 70 | bomba o impulso (0,34 s) | `player_boost` |
| `melee`, `charged`, `shoot`, `reload`, `weaponSwitch`, `interact`, `victory`, `aim` | 75–30 | acciones de arma | torso de puntería; piernas de caminata si se mueve |
| `run` | 20 | velocidad > 135 px/s | igual que `walk`, zancada más rápida |
| `walk` | 15 | velocidad > 8 px/s | torso de puntería + `player_walk0…3` |
| `idle` | 10 | parado | `player_idle`; con arma, torso de puntería |

- **Única animación por fotogramas:** la caminata, 4 fotogramas. Ritmo = velocidad × 0,062, entre 4,5 y 14,5 fotogramas/s (12,4 a la velocidad base de 200 px/s). Hacia atrás recorre los fotogramas al revés. En el Refugio el ritmo es fijo, 9,5/s.
- **Respiración:** desplazamiento vertical senoidal, ciclo de 2,24 s, 0,55 px en combate y 1,1 px en el Refugio.
- **Inclinación:** giro de hasta ±0,085 rad según la velocidad lateral.
- **Corte de cintura:** al caminar armado se pinta la mitad inferior de un fotograma y la superior de otro, casadas por el ancla de cinturón.
- **Disparo cargado:** existe como estado (arcos y bastones) pero no tiene sprite propio; usa la guardia.
- **Correr:** no tiene sprites propios.
- `squashX` / `squashY` se calculan en el motor pero el renderizador actual no los usa.

### A.6 Orientación

- El motor apunta en 360°, pero el personaje es **una sola vista lateral mirando a la derecha**.
- Mirar a la izquierda es un **reflejo horizontal** (`ctx.scale(-1, 1)` cuando el coseno del ángulo de puntería es negativo).
- Apuntar arriba o abajo cambia el torso entre 7 sectores de elevación, con 3° de histéresis.
- No existen vistas frontal, trasera ni diagonales en el juego.

### A.7 Atlas y manifiestos

- No hay atlas para el protagonista: cada fotograma es un PNG suelto.
- Manifiesto vigente: la constante `MANIFEST` de `src/dd_asset_registry.js`, reflejada en `assets/manifest.json` y en `docs/ART_REBUILD/MASTER_INVENTORY.json`.
- Las altas se hacen solo con `tools/art_master/batch.py register`.

### A.8 Limitaciones reales

1. Un fotograma por pose: el renderizador no sabe reproducir secuencias, salvo la caminata.
2. El reflejo horizontal invierte todo lo asimétrico del personaje.
3. El corte de cintura exige que nada del torso cuelgue por debajo del cinturón, salvo con capa derivada.
4. `measure.py` localiza la hebilla con una plantilla del cinturón antiguo; habrá que darle una nueva.
5. El personaje no se puede sustituir por partes: torso y piernas de dos diseños distintos se mezclarían en la caminata.

---

## B. Especificación anatómica

Medidas tomadas sobre la vista frontal de la lámina, con rejilla. Son aproximadas (±0,01 de la altura). Hoja: `evidencia_produccion/hoja_vistas_proporciones.jpg`.

### B.1 Anatomía

Fracción de la altura total, de la copa del sombrero (0) a las suelas (1).

| Referencia | Fracción |
|---|---|
| Copa del sombrero | 0,000 |
| Ala del sombrero | 0,049 |
| Mentón | 0,125 |
| Hombros | 0,172 |
| Codos | 0,335 |
| Cinturón, borde inferior | 0,444 |
| Muñecas | 0,471 |
| Entrepierna | 0,490 |
| Punta de los dedos | 0,572 |
| Rodillas | 0,708 |
| Caña de la bota | 0,831 |
| Suelas | 1,000 |

- **Cabeza:** pequeña respecto al cuerpo. La altura sin sombrero equivale a entre 9 y 10 cabezas; la coronilla queda oculta por el sombrero, así que la cifra es estimada. (La ficha anterior decía «7,5»; era un cálculo a ojo erróneo y queda corregido.)
- **Hombros:** 0,26 de la altura total de ancho.
- **Brazos:** de hombro a punta de dedos, 0,40. Brazo y antebrazo casi iguales.
- **Piernas:** de entrepierna a suelas, 0,51.
- **Manos:** 0,10 de largo. **Pies:** botas de 0,19 de largo en perfil.
- **Torso en perfil:** 0,155 de fondo.
- **Centro de gravedad:** sobre el eje vertical que pasa por la hebilla, a la altura de la pelvis (≈0,47).

### B.2 Silueta exterior

- Ala del sombrero: 0,18 de ancho; más estrecha que los hombros, pero sobresale por delante de la cara en perfil.
- Postura base: pies separados 0,41 de borde a borde; brazos despegados del torso.
- Lectura a distancia: sombrero, hombros anchos, cintura estrecha, pantalón voluminoso, botas grandes.

### B.3 Vestuario

- Chaleco abierto: el bajo cae a la altura del cinturón o ligeramente por debajo (≈0,45–0,47). **Cruza la línea del corte de cintura.**
- Pantalón cargo: ancho, con bolsillos laterales a la altura del muslo; se recoge sobre la caña de la bota.
- Cadena de cartera: cuelga del cinturón hasta medio muslo.
- Dos cadenas al cuello con placa, hasta el esternón.
- Muñequeras negras en ambas muñecas.

### B.4 Tatuajes

Inventario y forma: `03_PERSONAJE_MAESTRO.md`. Distribución sobre el cuerpo, en fracción de la altura:

| Tatuaje | Zona | Altura aproximada |
|---|---|---|
| Ankh | Lateral del cuello | 0,13–0,16 |
| Sigilo geométrico | Hombro | 0,18–0,26 |
| Lobo | Antebrazo alto | 0,34–0,41 |
| Patrón orgánico | Antebrazo | 0,36–0,46 |
| Sigilo circular | Dorso de la mano | 0,49–0,53 |
| Símbolos de los dedos | Dedos | 0,53–0,56 |

- Qué brazo lleva cada motivo **sigue pendiente**. No se asigna aquí.
- **Legibilidad en juego:** con la figura a ~109 px CSS, el brazo mide unos 6 px de ancho. Los tatuajes se leerán como masas de tinta con la silueta correcta, no como dibujos reconocibles. El detalle completo solo es visible en retratos, cinemáticas y menús.

### B.5 Elementos animables

| Elemento | Movimiento |
|---|---|
| Ala del sombrero | Rígida; acompaña a la cabeza |
| Mechones bajo el ala | Secundario leve |
| Faldones del chaleco | Secundario al caminar, girar y esquivar |
| Cadenas del cuello y placa | Péndulo corto |
| Cadena de cartera | Péndulo largo |
| Pantalón cargo | Pliegues en la zancada |
| Tatuajes | Ninguno propio: se deforman con el brazo |

### B.6 Hitbox de gameplay

- No cambia: círculo de radio 14 px en los pies.
- El sombrero, los hombros y el pantalón más anchos **no** amplían la colisión.
- En el lienzo: la figura sin sombrero conserva los 461 px actuales; la copa añade unos 12 px (cabeza hacia y≈32) y cabe en el margen superior de 44 px.
- El cinturón del diseño nuevo queda algo más alto: ancla `belt` ≈ 0,47 en lugar de 0,49. El motor lo admite sin cambios.

---

## C. Vistas y orientaciones

| Vista | ¿La usa el motor? | Fuente en la lámina | Fiabilidad |
|---|---|---|---|
| Lateral derecha | **Sí, es la única** | «PERFIL D.» | Alta |
| Lateral izquierda | Sí, por reflejo | «PERFIL I.» existe, pero el motor no la usaría | Ver conflicto |
| Tres cuartos | No en juego; útil en retratos y cinemática | «3/4» | Alta |
| Frontal | No en juego; menú y cinemática | «FRONTAL» | Alta |
| Trasera | No en juego; cinemática | «TRASERA» | Alta |
| Diagonales de movimiento | **No existen en el motor** | — | No se proponen: exigirían un sistema nuevo |

**Conflicto del reflejo.** La lámina dibuja los dos perfiles distintos: el sigilo circular de la mano y el del hombro se leen en «PERFIL I.», y el otro costado muestra otros motivos. El motor, al reflejar, enseña el mismo costado hacia ambos lados. Hay dos salidas:

- **Opción 1 — Mantener el reflejo.** Cero cambios de código, 22 ilustraciones. Los detalles asimétricos (ankh, zorro del pecho, cadena de cartera, tatuajes de cada brazo) cambian de lado al girar. Es lo que ya ocurre con los sprites actuales.
- **Opción 2 — Dos juegos, derecha e izquierda.** Fiel a la lámina. Duplica el arte (44 ilustraciones) y requiere un cambio pequeño en `resolvePlayerPose` para elegir el juego en vez de reflejar. Depende de cerrar antes qué brazo es cuál.

Recomiendo la opción 1 para la muestra IDLE y decidir la 2 después de verla a escala real, porque a ese tamaño los tatuajes no se distinguen.

**Incertidumbres de reconstrucción:**

- Los sprites actuales no son un perfil puro: están girados un poco hacia la cámara. La lámina no tiene esa vista mirando a la derecha. Un perfil puro («PERFIL D.») es reconstruible sin inventar nada; un tres cuartos a la derecha habría que construirlo.
- Las poses de puntería hacia arriba levantan los brazos por delante del ala del sombrero. La lámina no muestra cómo se resuelve.
- La cabeza sin sombrero no aparece en la lámina.

---

## D. Sistema de animaciones

Dos niveles. El primero no toca el código; el segundo sí, y no se implementa sin autorización.

### D.1 Nivel 1 — Paridad con el motor actual

Mismos identificadores y mismo número de fotogramas que hoy, con el diseño nuevo. La animación la sigue poniendo el motor.

| Animación | Fotogramas | Tiempo | Loop | Poses clave y requisitos |
|---|---|---|---|---|
| IDLE | 1 | respiración procedural, ciclo 2,24 s | Sí | De pie, peso repartido, brazos sueltos, manos vacías |
| CAMINAR (piernas) | 4 | 81–222 ms por fotograma según velocidad | Sí | Contacto, paso, contacto contrario, paso. Torso en guardia, sin manos bajo el cinturón |
| CAMINAR (cuerpo entero) | 4 | 105 ms en el Refugio | Sí | Mismas fases con braceo. Sin arma |
| CORRER | 0 propios | usa CAMINAR a más ritmo | Sí | — |
| DISPARAR | 9 torsos (3 horizontales + 6 de elevación) + 3 capas | cambio instantáneo por ángulo | — | Misma pelvis y mismas piernas en todos; solo cambian torso y brazos |
| DISPARO CARGADO | 0 propios | usa la guardia | — | — |
| HABILIDAD | 1 | 0,34 s | No | Zancada de impulso, torso adelantado |
| DAÑO | 1 | ~0,6 s golpe; 0,32 s aturdido | No | Retroceso del torso, cabeza hacia atrás |
| ESQUIVA | 1 | 0,32 s, gira una vuelta | No | Cuerpo recogido en bola |
| MUERTE | 1 | estática | No | Tendido en el suelo |

Total: **22 ilustraciones**, las mismas que hoy.

### D.2 Nivel 2 — Ampliación propuesta

Requiere añadir al renderizador un selector de fotograma por tiempo (unas 30 líneas en `resolvePlayerPose`, leyendo los datos del manifiesto). No duplica la máquina de estados: `pAnim` ya entrega `stateTime`, `stridePhase` y `breathePhase`.

| Animación | Fotogramas | Duración | Loop | Anticipación → acción → recuperación | Transiciones |
|---|---|---|---|---|---|
| IDLE | 4 | 2,24 s (560 ms c/u) | Sí | Neutro → inspiración → pecho alto → espiración | A cualquiera, sin espera |
| CAMINAR | 6 | 0,48–0,60 s | Sí | Contacto, bajada, paso, subida ×2 pies | Desde IDLE por el fotograma de paso |
| CORRER | 6 | 0,36–0,42 s | Sí | Zancada más larga, torso inclinado, fase de vuelo | Desde CAMINAR al superar 135 px/s |
| DISPARAR | +1 retroceso por torso horizontal | 60–80 ms | No | Sin anticipación (respuesta inmediata) → retroceso → vuelta a guardia | Vuelve a la guardia |
| DISPARO CARGADO | 3 | sigue la carga (0–1) | Mantiene el último | Tensar → mantener → soltar | Solo arcos y bastones |
| HABILIDAD | 4 | 0,34 s (60/80/120/80 ms) | No | Recoger → impulso → extensión → asentar | Interrumpe todo salvo daño y esquiva |
| DAÑO | 3 | 0,30 s (60/120/120 ms) | No | Impacto → retroceso máximo → recuperación | Interrumpe la acción de arma |
| ESQUIVA | 1 (se mantiene el giro) | 0,32 s | No | — | — |
| MUERTE | 5 | 0,9 s y queda el último | No | Golpe → rodillas → caída → rebote → reposo | Final |

Total orientativo: **unas 45 ilustraciones** con reflejo, el doble sin él.

**Contra la rigidez y el deslizamiento:**

- Los pies en contacto deben coincidir con el avance: a 200 px/s y ciclo de 0,5 s, cada paso cubre 50 px de mundo.
- Todos los fotogramas de una animación comparten escala, línea de suelo y eje de torso, medidos con `measure.py`.
- Ninguna pose cambia la altura de la figura salvo por flexión real de rodillas.

---

## E. Reglas de continuidad visual

| Elemento | Regla |
|---|---|
| Rostro | Mismos rasgos y proporciones en todos los fotogramas: ojo ámbar, barba de dos días, media sonrisa salvo en daño y muerte |
| Pelo | Mismo volumen y largo; los mechones pueden oscilar, no cambiar de número ni de forma |
| Sombrero | Misma geometría de copa y ala; fijo a la cabeza; gira con ella. Solo se separa donde esté aprobado |
| Vestuario | Misma construcción en todos los estados: chaleco abierto, camiseta de tirantes, cargo, botas, muñequeras, tres cadenas |
| Tatuajes | Cada motivo en su zona anatómica. Se pintan en la propia ilustración del brazo, nunca como capa pegada; giran, se acortan y se ocultan con el brazo |
| Anatomía | Longitudes de hueso constantes entre poses; comprobación superponiendo fotogramas por el ancla de cinturón |
| Iluminación | Contraluz magenta por la espalda y cian por el frente, igual que el contrato actual de los sprites; no cambia entre fotogramas |
| Contornos | Tinta negra de grosor constante a la escala del lienzo (2–3 texeles en 512 de alto) |
| Paleta | Las cinco muestras de la lámina más negro; sin colores nuevos |

Control por fotograma: superposición con el anterior («papel cebolla»), revisión sobre fondo claro y oscuro, y comparación con el recorte correspondiente de la lámina.

---

## F. Arquitectura de producción

Se reutiliza la línea existente (`tools/art_master/`) y el registro actual. No se crea ningún controlador nuevo.

| Aspecto | Propuesta |
|---|---|
| Tanda | `R05_PROTAGONISTA_MAESTRO`, descrita en `docs/ART_REBUILD/batches/R05_PROTAGONISTA_MAESTRO.json` |
| Maestros | `ART_ASSETS/rebuild_masters/R05_PROTAGONISTA_MAESTRO/*.webp` |
| PNG finales | `assets/characters/protagonist_master/` (carpeta nueva; `assets/characters/player_*` no se toca) |
| Nombres | `pm_<animación>_<nn>.png`: `pm_idle_00`, `pm_walk_00`, `pm_aim_up_01`… Capas: sufijo `_arms`. Si se aprueba la opción 2: sufijo `_l` |
| Formato | PNG RGBA de 8 bits, fondo transparente, figura mirando a la derecha |
| Lienzo | El actual: 512 de alto, 288 de ancho base (más ancho si la pose lo pide), suelas en y=504, eje de torso centrado |
| Atlas | Ninguno. El motor carga PNG sueltos y no hay motivo de rendimiento para cambiarlo |
| Manifiesto | Entradas en `MANIFEST` con `batch.py register`, con los campos que ya existen |
| Anclajes | `anchors.belt` y `anchors.hand`, medidos sobre el maestro |
| Metadatos nuevos | Solo para el nivel 2: `anim: { set, frame, ms, loop }` por entrada. El motor actual los ignora |
| Variantes | Campo `variant` (`hat` / `nohat`) si se confirma que hacen falta dos cabezas |

**Conexión con el motor, en dos pasos:**

1. **Muestra (fase G).** Los fotogramas `pm_idle_*` no se registran en el juego. El visor carga el `dd_world_renderer.js` real y le entrega esos PNG, de modo que los pinta la misma función `drawProtagonist` que usa el juego. Falta comprobar que el módulo se puede cargar aislado; si no, lo diré.
2. **Sustitución (fase futura, no autorizada).** Cuando el juego completo de 22 esté aprobado, se cambia la ruta `src` de los identificadores `player_*` y `hero_*` en el manifiesto, todos a la vez. El código no cambia y los archivos antiguos permanecen en su carpeta.

**Dependencias que tocará la sustitución:** `MANIFEST` y `ASSET_CACHE_VERSION`, `assets/manifest.json`, `MASTER_INVENTORY.json`, la lista de precarga de `dd_boot.js` (mismos identificadores, sin cambio), la cinemática (`hero_*`) y la plantilla de hebilla de `measure.py`.

---

## Riesgos técnicos

| Riesgo | Efecto | Mitigación |
|---|---|---|
| El generador de imágenes varía el diseño entre fotogramas | Rostro, sombrero o tatuajes distintos de una pose a otra | Referencia de imagen obligatoria (lámina y fotograma clave); medir y descartar; si persiste, quedarse en el nivel 1 |
| Chaleco por debajo del cinturón | Costura visible en el corte de cintura al caminar armado | Capa derivada de faldones, como las `_arms` actuales, o faldones solo en la mitad inferior |
| Sombrero y brazos en puntería alta | Brazos que tapan o atraviesan el ala | Definir la pose con un boceto antes de producir los tres torsos |
| Reflejo horizontal | Asimetrías cambian de lado | Decisión de la sección C |
| Tatuajes ilegibles a escala de juego | Parecen manchas | Priorizar silueta y masa de tinta; el detalle va en retratos |
| Sustitución parcial | Mezcla de dos diseños en el corte de cintura | Sustituir el juego completo de una vez |
| Sombrero con o sin él en el juego | Rehacer cabezas | Decisión pendiente (ver abajo) |

---

## G. Prueba propuesta (no ejecutada)

- **Animación:** IDLE sin arma, mirando a la derecha.
- **Contenido:** 4 fotogramas de respiración (`pm_idle_00…03`), 560 ms cada uno, ciclo de 2,24 s igual al del motor. `pm_idle_00` cumple además el contrato del nivel 1.
- **Producción:** croma verde → `batch.py process` → PNG 288×512 con anclas medidas.
- **Visor independiente:** `assets/cinematics/preview/protagonist_anim_test.html`, sin dependencias. Reproducir, pausar, fotograma anterior y siguiente, velocidad, ampliar, ajustar, fondo transparente o de contraste, dimensiones y milisegundos por fotograma. Vista adicional a escala real de juego.
- **Comprobaciones:** fidelidad por zonas contra la lámina; proporciones contra la tabla B.1; transparencia y halos; anclas; deriva entre fotogramas; prueba de animación en navegador (no solo capturas); consola sin errores; tiempo de dibujo.
- **Criterio de fallo declarado:** si los cuatro fotogramas no mantienen el mismo personaje, la muestra se entrega como fallida y se propone IDLE de un fotograma con la respiración del motor.

## Plan de integración

1. Aprobación de este documento y de las decisiones pendientes.
2. Muestra IDLE y visor (fase G).
3. Tras aprobar la muestra: caminata de cuerpo entero, después familia de puntería, después daño, habilidad, esquiva y muerte.
4. Validación de cada grupo con `preview_rig.py` y `probe_player.js`.
5. Sustitución en el manifiesto de una sola vez, build y QA en el juego.
6. Nivel 2, solo si se autoriza el cambio en el renderizador.

## Pruebas realizadas en esta entrega

- Huella SHA-256 de la lámina maestra: coincide antes y después.
- Lectura del código real de carga, dibujo, estados, Refugio, cinemática y puente.
- Medición de los 27 PNG (tamaño, modo, caja de la figura) y lectura de sus anclas en el manifiesto.
- Medición de proporciones sobre la lámina con rejilla.
- Comprobación de que no hay cambios en `src/`, `assets/characters/`, `index.html` ni en la lámina.

No se ha ejecutado ninguna prueba de animación ni de renderizado: no hay nada nuevo que renderizar todavía.
