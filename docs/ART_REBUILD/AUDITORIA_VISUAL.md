# Auditoría visual y plan de reconstrucción de arte

- **Fecha:** 2026-11-11 (auditoría) · **actualizada 2026-11-12** (tanda R02; R03 en curso) · **Rama:** `arena/662f0d27-deadbeat-disconew` · **Base:** `main` @ `2d9386f`
- **Inventario clasificado (374 assets):** [`AUDIT_INVENTORY.md`](AUDIT_INVENTORY.md) · datos en [`AUDIT_CLASSIFICATION.json`](AUDIT_CLASSIFICATION.json)
- **Evidencia en juego:** [`evidence/R01/`](evidence/R01/) (protagonista) · [`evidence/R02/`](evidence/R02/) (enemigos) · [`evidence/R03/`](evidence/R03/) (jefes)

## 1. Resultado en una tabla

| Clase | Significado | Assets |
|---|---|---:|
| **A** | Conservar: ilustración sin defectos | 25 |
| **B** | Rehacer por estilo: pixel art o acabado que no sigue las guías | 141 |
| **C** | Falta: el juego muestra el sprite heredado del motor | 105 |
| **D** | Defectuoso: defecto visible en el propio archivo | 37 |
| **E** | Rehecho y validado dentro del juego (R01: 27 · R02: 24 · R03: 15) | 66 |

Quedan **283 assets por producir** (B + C + D). El generador de imágenes admite
**10 ilustraciones por turno de trabajo**, así que la reconstrucción completa son del
orden de 29 turnos más; el orden propuesto está en el apartado 6.

Estado a 2026-11-12: clasificación inicial A 25 · B 168 · C 105 · D 49 · E 27; la
tanda R02 ha pasado los 24 enemigos (15 de clase B y 9 de clase D) a la clase E, y la
R03, hasta ahora, 15 fotogramas de jefe (12 de clase B y 3 de clase D).

## 2. Método

1. Hojas de contacto de **todo** `assets/` por categoría (sobre fondo oscuro y claro, con
   tamaño real de cada archivo) para ver siluetas, halos y transparencias.
2. Capturas dentro del juego real (`index.html` servido en local, Chromium sin GPU):
   arranque, cinemática de entrada plano a plano, Refugio, armería, mapa, salas de los
   círculos I y III con enemigos, y primeros planos del protagonista en cada estado.
3. Comprobación estática del registro contra los archivos (`batch.py audit`).
4. Lectura del código que dibuja cada familia (`src/dd_world_renderer.js`,
   `src/dd_cinematic_camera.js`, puente de `tools/build_active_html.py`) para saber qué
   contrato de lienzo espera el juego.

## 3. Cómo llega el arte a la pantalla

- El motor base es el juego de pixel art original, con 161 sprites embebidos.
- `tools/build_active_html.py` sustituye sus funciones de dibujo por las de `DD_WORLD`,
  que piden cada imagen a `DD_ASSETS.get(id)`.
- **Si un id no está registrado, se dibuja el sprite heredado.** Por eso 105 de las 121
  armas se ven en pixel art antiguo aunque el resto del juego use arte nuevo.
- Añadir o sustituir un asset = PNG + entrada de registro + manifiesto + inventario
  (`batch.py register`) y reconstruir el HTML.

## 4. Hallazgos por familia

| Familia | Estado | Detalle |
|---|---|---|
| **Protagonista** | **E** (27) | Rehecho en R01. Antes: el reposo y uno de los cuatro pasos tenían la figura comida por la transparencia (9 % de cobertura del lienzo frente al 24 % de los otros pasos), así que en el Refugio se veía como un fantasma; en sala era un personaje de pixel art con otro diseño y el arma no quedaba en las manos. |
| **Enemigos** (24) | **E 24** | Rehechos en R02 (ver apartado 4 bis). Antes: pixel art; damero o huecos horneados en `enemy_dancer_attack`, `enemy_security_attack`, `enemy_fanatic_attack`; `enemy_elite_attack` no representaba al personaje; los cuatro fotogramas del chef y `enemy_security_windup` cambiaban de identidad. |
| **Jefes** (42) | **E 15** · B 20 · D 7 | R03 en curso (ver apartado 4 ter): rehechos el reposo de los 11 y el ataque de 4. Los 27 restantes siguen en pixel art en disco, pero el juego ya no los dibuja. De ellos tienen defecto en el archivo: damero en `boss_06_matarife_attack` y `boss_09_nucleo_attack`; fotogramas basura `boss_03_cajero_hit`, `boss_03_cajero_attack`, `boss_05_oficiante_hit`, `boss_09_nucleo_hit`; identidad distinta en `boss_02_bufe_hit`. |
| **Armas** (121) | B 16 · C 105 | 16 con arte de la línea anterior (pixel art); 105 sin arte nuevo. |
| **Recogibles y reliquias** (20) | B | Pixel art coherente entre sí. |
| **Proyectiles y efectos** (20) | B | Pixel art. |
| **Mobiliario** (30) | B | Pixel art detallado y coherente; prioridad baja. |
| **Suelos** (12) | **A** | Texturas ilustradas de 512 px, sin costuras visibles en juego. |
| **Muros** (10) | B 9 · D 1 | `wall_panel_gothic_niche` tiene huecos blancos horneados. |
| **Puertas y portales** (8) | B 5 · D 3 | `door_gothic_closed` (damero alrededor), `door_gothic_open` (huecos blancos), `portal_avaricia_gold` (halo punteado). |
| **PNJ del Refugio** (4) | B 3 · D 1 | `npc_dj_booth_world` no es el mismo personaje que el retrato `dialogue_portrait_dj`. |
| **Interfaz** (15) | A 7 · B 7 · D 1 | Se conservan retratos, fondo de menú, mapa de la torre y emblemas de tienda y derrota. Iconos de vida, escudo, habilidades y moneda en pixel art. `ui_victory_emblem` tiene halo claro. |
| **Logotipos** (3) | **A** | |
| **Cinemática** (35) | B 11 · D 24 | Ver apartado 5. |

## 4 bis. Enemigos (tanda R02): qué estaba roto además del arte

Al rehacer los enemigos aparecieron cuatro defectos de **código** que habrían hecho
inútil el arte nuevo. Están corregidos y comprobados en juego (`evidence/R02/`):

| Defecto | Causa | Corrección |
|---|---|---|
| Sólo se veía el fotograma de caminar, siempre mirando a la derecha | `DD_WORLD.drawEnemy` leía campos que el motor no tiene (`attackT`, `windupT`, `hurtT`, `vx`) | El puente traduce el estado real del motor (`ddEnemyView`: familia, estado, orientación hacia el protagonista) y se lo entrega al renderizador |
| Las balas salían unos 43 px por debajo del cañón y el protagonista «flotaba» sobre su círculo de colisión | El pase HD dibujaba los pies en `y + 32` y las balas a ras de suelo | Convención única: `(x, y)` es el círculo de colisión en el suelo; suelas en `y + 14`, balas a la altura del cañón |
| Una figura junto a una caja se dibujaba detrás de ella | Los actores se ordenaban por el centro del círculo y los muebles por su borde frontal | El puente ordena todo por la línea de apoyo (`ddGroundY`) |
| Los enemigos oscuros desaparecían sobre los suelos oscuros de los círculos II en adelante | El único separador era el filo de luz del dibujo, de menos de 1 px en pantalla | Halo claro difuminado detrás de cada figura, con opacidad por familia |

Las seis familias siguen la hoja `REF_06`: Seguridad (antidisturbios), Bailarina,
Sprinter, Tanque, Tirador y Mascota (élite). Tamaños: entre 80 y 106 px de mundo de
alto frente a los 104 del protagonista; el minijefe usa la familia que decide el motor
(Tanque en el círculo III, Mascota en el VIII, Seguridad en el resto) a mayor escala.

Limitaciones conocidas de R02:

- Un solo fotograma por estado: el paso de caminar a aviso o a ataque es un cambio de
  pose sin intermedios. Al Tanque se le nota más: pasa de andar sobre los nudillos a
  erguirse (de 106 a unos 146 px de alto con los puños alzados).
- La Mascota élite usa su zarpazo aunque el enemigo de base sea un tirador.
- Las balas enemigas siguen siendo las de pixel art del motor (tanda R07).

## 4 ter. Jefes (tanda R03, en curso): qué estaba roto además del arte

Igual que con los enemigos, el arte nuevo no se habría visto sin corregir el código.
Comprobado en juego con los once jefes (`evidence/R03/`):

| Defecto | Causa | Corrección |
|---|---|---|
| El jefe se veía siempre en reposo y mirando a la derecha | `DD_WORLD.drawBoss` leía campos que el motor no tiene (`attackT`, `castT`, `dashT`, `vx`) | El puente traduce el estado real (`ddBossView`) y orienta al jefe hacia el protagonista |
| No se dibujaba lo que el motor pinta junto al jefe: sector y rayo del barrido, barra de vida, anillo de vulnerable, arco del escudo de esbirros, congelación, anillos de aparición | El puente sustituía entera la función del motor que contiene esas señales | Se reponen una a una (`ddBossRings`, `ddBossFloorCues`) |
| La muerte la pintaba el motor con el sprite antiguo | No había versión nueva | Registro de 1 s con la ilustración (`drawBossDeath`) |
| La tarjeta de presentación decía lo mismo para los once jefes y el retrato miraba fuera de la pantalla | La instantánea del motor no llevaba el título del residente | Título del motor por jefe; retrato reflejado sobre velo oscuro |

Las figuras miden entre 178 y 204 px de mundo (el protagonista, 104) y se apoyan en
`(x, y + 0,8 · r)`. Correspondencia entre los jefes del motor, la guía `REF_03` y la
biblia de lore, y las decisiones de diseño tomadas por defecto: [`NEXT_BATCH.md`](NEXT_BATCH.md).

Limitaciones conocidas de R03 a día de hoy:

- Faltan 27 fotogramas (7 ataques, 10 de vulnerable, 10 muertes): esos estados se ven
  sobre el reposo, con las señales del motor y, en la muerte, un derrumbe procedural.
- Validado con la sonda, que fuerza cada estado; no se ha jugado un combate completo.
  Sin capturar: etapas 2 y 3 del Núcleo y del Arquitecto.
- Las balas de los patrones y el botín siguen en pixel art (tandas R07 y R06).

## 5. Cinemática de entrada

Dos defectos, uno corregido y otro pendiente de arte:

1. **El protagonista no aparecía en ningún plano** (corregido). Las capas registradas
   como «primer plano» de los seis fondos (`…_03_…`) son cuadros 100 % opacos, no capas
   con transparencia, y se pintaban por delante del héroe tapándolo entero. El registro
   las declaraba con alfa. Ahora `batch.py audit --fix` registra la verdad del archivo y
   `DD_CINE` no dibuja como primer plano una capa opaca. Evidencia:
   `evidence/R01/11_…` (antes) y `12_…`, `13_…` (después).
2. **Los seis fondos son láminas de presentación** (pendiente). Llevan horneadas
   muestras de paleta en las esquinas superiores, un marco y restos de texto («OR»,
   «AL»). En el juego quedan ocultas por la barra superior del formato panorámico, pero
   el arte no es utilizable sin esa barra. En las carpetas hay además un juego anterior
   de capas con transparencia real que el registro no usa.

Las 11 tarjetas de círculo (`cine_circle_XX`, 960×540) son pixel art ampliado a pantalla
completa.

## 6. Orden de producción propuesto

| Tanda | Contenido | Ilustraciones | Por qué en este orden |
|---|---|---:|---|
| **R01** ✔ | Protagonista | 22 | Es lo que más tiempo está en pantalla |
| **R02** ✔ | Enemigos: 6 familias × 4 estados | 24 | Hecha y validada en juego (círculos I, II, III, V y VIII) |
| **R03** ◐ | Jefes: 10 × 4 estados + Arquitecto × 2 | 42 | En curso: 15 integradas y vistas en juego, faltan 27 |
| **R04** | PNJ del Refugio, dron aliado, iconos de HUD, emblema de victoria | 12 | Coherencia del Refugio y del HUD con R01 |
| **R05** | Armas: 16 existentes + 105 que faltan | 121 | La familia más grande; hoy mezcla dos estilos |
| **R06** | Recogibles y reliquias | 20 | |
| **R07** | Proyectiles y efectos | 20 | |
| **R08** | Mobiliario | 30 | Coherente hoy; menor urgencia |
| **R09** | Muros, puertas, portales | 18 | 4 defectuosos |
| **R10** | Cinemática: 6 fondos con capas reales + 11 tarjetas | 17 + capas | |

## 7. Defectos del juego detectados (no son de arte; sin corregir)

| Defecto | Dónde |
|---|---|
| La rejilla de la armería se abre vacía («La armería está cargando…»); sólo se ve la ficha del arma equipada | `src/dd_ui_system.js` — el filtro usa `"TODAS"` y la selección `"ALL"`; las entradas traen `family`, no `category`/`price` |
| Título y cuerpo del diálogo salen pegados («RONDA 2 · OLEADA RUSHLlegan rápido…») | Caja de diálogo del HUD |
| El minimapa («SALA ACTUAL») aparece en blanco | HUD |
| El botón de depuración «VISOR & RIG v3.2 [F9]» es visible y pisa el rótulo de la cinemática | Esquina inferior derecha |
| El logotipo del plano 9 se funde con el fondo (mezcla `screen` sobre un fondo claro) | `src/dd_cinematic_camera.js` |
| Cajas sobredimensionadas en algunas salas | Mobiliario de sala |
| La muerte del jefe final y la del Arquitecto no se ven: la pantalla de fin de partida se abre en el mismo fotograma | Motor (flujo de fin de partida) |
| Al morir un residente, el panel «VARÍA TU DISPARO» se abre un fotograma después y detiene la simulación: el jefe sigue de pie detrás del panel y se derrumba cuando el jugador elige | Motor (panel de fin de ronda) |
| Con el jefe final muerto, el HUD y el diálogo se ven por encima de la pantalla de fin de partida (visto una vez, bajo la sonda; sin comprobar jugando) | Capas de `DD_UI` sobre el menú del motor |

Conflictos de nomenclatura, sin resolver: la interfaz lista I Lujuria … IX Núcleo, el
motor rotula el índice 0 como «LIMBO»; las láminas de mapa traen dos mapas de Fraude y
Traición como IX; la biblia de lore usa otros nombres de soberanos que los residentes
del motor.

## 8. Lo que esta auditoría NO cubre todavía

- Menú principal dentro del juego (el fondo se revisó como archivo, no en pantalla).
- Salas comunes de los círculos IV–IX en juego (las cámaras de sus jefes sí se han
  visto); pantallas de victoria y derrota; cinemáticas de descenso.
- Combates de jefe jugados de principio a fin: los once se han visto con la sonda, que
  fuerza cada estado.
- Las 105 armas heredadas una a una (se sabe que se ven en pixel art, no cuáles fallan).
- La clasificación de enemigos, jefes, efectos y recogibles procede de hojas de
  contacto; los defectos listados son los vistos ahí.
- Los enemigos se han visto en juego en los círculos I, II, III, V y VIII; faltan el
  IV, VI, VII y IX (mismos fotogramas, otros suelos).
