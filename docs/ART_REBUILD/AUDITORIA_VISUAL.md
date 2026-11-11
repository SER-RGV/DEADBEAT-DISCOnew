# Auditoría visual y plan de reconstrucción de arte

- **Fecha:** 2026-11-11 · **Rama:** `arena/662f0d27-deadbeat-disconew` · **Base:** `main` @ `2d9386f`
- **Inventario clasificado (374 assets):** [`AUDIT_INVENTORY.md`](AUDIT_INVENTORY.md) · datos en [`AUDIT_CLASSIFICATION.json`](AUDIT_CLASSIFICATION.json)
- **Evidencia en juego de la tanda R01:** [`evidence/R01/`](evidence/R01/)

## 1. Resultado en una tabla

| Clase | Significado | Assets |
|---|---|---:|
| **A** | Conservar: ilustración sin defectos | 25 |
| **B** | Rehacer por estilo: pixel art o acabado que no sigue las guías | 168 |
| **C** | Falta: el juego muestra el sprite heredado del motor | 105 |
| **D** | Defectuoso: defecto visible en el propio archivo | 49 |
| **E** | Rehecho y validado dentro del juego (tanda R01) | 27 |

Quedan **322 assets por producir** (B + C + D). El generador de imágenes admite
**10 ilustraciones por turno de trabajo**, así que la reconstrucción completa son del
orden de 30 turnos más; el orden propuesto está en el apartado 6.

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
| **Enemigos** (24) | B 15 · D 9 | Pixel art. Damero o huecos horneados en `enemy_dancer_attack`, `enemy_security_attack`, `enemy_fanatic_attack`. `enemy_elite_attack` no representa al personaje. Los cuatro fotogramas del chef y `enemy_security_windup` cambian de identidad. |
| **Jefes** (42) | B 32 · D 10 | Pixel art. Damero en `boss_04_pogo_attack`, `boss_06_matarife_attack`, `boss_09_nucleo_attack`. Fotogramas basura: `boss_03_cajero_hit`, `boss_03_cajero_attack`, `boss_05_oficiante_hit`, `boss_09_nucleo_hit`, `boss_04_pogo_idle`, `boss_08_traidor_idle`. Identidad distinta en `boss_02_bufe_hit`. |
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
| **R02** | Enemigos: 6 familias × 4 estados | 24 | Segundo elemento más visible; 9 defectuosos |
| **R03** | Jefes: 10 × 4 estados + Arquitecto × 2 | 42 | 10 defectuosos |
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

Conflictos de nomenclatura, sin resolver: la interfaz lista I Lujuria … IX Núcleo, el
motor rotula el índice 0 como «LIMBO»; las láminas de mapa traen dos mapas de Fraude y
Traición como IX; la biblia de lore usa otros nombres de soberanos que los residentes
del motor.

## 8. Lo que esta auditoría NO cubre todavía

- Menú principal dentro del juego (el fondo se revisó como archivo, no en pantalla).
- Combates de jefe y círculos IV–IX en juego; pantallas de victoria y derrota;
  cinemáticas de descenso y de jefe.
- Las 105 armas heredadas una a una (se sabe que se ven en pixel art, no cuáles fallan).
- La clasificación de enemigos, jefes, efectos y recogibles procede de hojas de
  contacto; los defectos listados son los vistos ahí.
- `capture_game.js --circles=N` no selecciona el círculo N (el motor usa su propia
  tabla); el círculo real de cada captura está en el informe.
