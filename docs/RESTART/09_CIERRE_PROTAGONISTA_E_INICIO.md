# 09 · Cierre del protagonista e inicio del juego

Fecha: 2026-11-12 · Rama `arena/1a801cc0-deadbeat-disconew`

## 1. Protagonista

| Elemento | Estado |
|---|---|
| Diseño visual del protagonista | **CERRADO** |
| Lámina maestra `assets/cinematics/restart/character_master/protagonist_master_approved.png` | **CANÓNICA** |
| IDLE 07B `assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png` | **ACEPTADO COMO REFERENCIA** |
| Experimento de 4 fotogramas y versiones anteriores | **ARCHIVADOS** (se conservan) |
| Resto de animaciones (andar, correr, disparar…) | **PENDIENTES DE PRODUCCIÓN CUANDO SEAN NECESARIAS** |

Limitaciones aceptadas del IDLE 07B: tatuajes ilegibles a tamaño de combate, hombro denso,
lobo granulado, sombreado del brazo distinto del resto, fundido hacia el codo y cadenas
menos nítidas que en la lámina. No se reabre el diseño por diferencias cosméticas.

El IDLE 07B **no** está registrado como recurso activo ni integrado en la partida. El
Refugio y el combate siguen usando los 22 sprites `player_*` anteriores, sin modificar.

## 2. Inventario (estado encontrado)

- El flujo real era `carga → intro de 35 s → Refugio`: el menú principal nunca llegaba a verse
  y el Refugio sonaba con la música del menú.
- La intro mostraba rótulos técnicos, fondos pixel-art descartados y un botón de depuración.
- El menú tenía un fondo no canónico, «Seleccionar partida» sobrante, CONTINUAR siempre
  visible y textos del lore descartado («Círculo I · Lujuria», «DJ Virgilio»).
- NUEVA PARTIDA saltaba el Refugio.

**Reutilizado sin tocar:** motor, registro de recursos, `dd_world_renderer.js`,
`dd_cinematic_camera.js`, máquina de estados y carga de `DD_BOOT`, navegación, submenús,
opciones y lectura de mando de `DD_UI`, `DD_HUB.enter()`, logotipo oficial, audio sintetizado.

**Corregido:** `src/dd_boot.js` (intro, espera de pulsación, música del menú),
`src/dd_ui_system.js` (opciones del menú, guardado, nueva partida, continuar, textos),
`src/dd_hub_system.js` (sólo textos), `src/dd_rebuild_ui.css` (aspecto del menú),
`tools/build_active_html.py` (un módulo más en la lista).

**Creado:** `src/dd_opening.js`, `assets/cinematics/restart/opening/` (9 ilustraciones y el
sombrero), sus maestros en `ART_ASSETS/rebuild_masters/R06_INICIO/` y
`tools/qa/test_restart_flow.js`.

## 3. Flujo

```
carga → (pulsa una tecla) → intro «La noche que vuelve», 32 s → MENÚ
MENÚ → NUEVA PARTIDA → descenso, 7 s → Refugio
MENÚ → CONTINUAR (sólo con partida) → Refugio
```

### Intro (120 pulsaciones por minuto)

| Plano | Tiempo | Contenido |
|---|---|---|
| 1 | 0–4 s | La aguja cae sobre el vinilo |
| 2 | 4–9 s | La torre Deadbeat, cinco plantas encendidas |
| 3 | 9–14 s | La pista: todos bailan a la vez |
| 4 | 14–18 s | Insertos: la mano de Tempo, las sonrisas, Véspera. El compás se repite |
| 5 | 18–23 s | Unas botas que pisan tarde; la espalda del protagonista |
| 6 | 23–28 s | Su rostro. La música se corta |
| 7 | 28–32 s | Título con el logotipo oficial; el encuadre final es el fondo del menú |

La música del menú entra en el golpe del título (28 s) y el sonido propio de la intro se
apaga al terminar. Se puede saltar con cualquier tecla, clic o A/Start.

### Descenso

0–2 s el suelo se agrieta bajo sus botas · 2–5,2 s la plataforma baja por el pozo y **el
sombrero se desprende y se queda arriba** · 5,2–7 s frenada, impacto y fundido al Refugio.

### Guardado

Clave `dd_save_v1` (`{v, created, last, visits}`), escrita al llegar al Refugio. CONTINUAR
aparece si existe esa ficha o progreso permanente del motor.

## 4. Pruebas

`tools/qa/test_restart_flow.js`, sobre `index.html` (el juego real), Chromium sin interfaz:
**62 de 62**, repetido cuatro veces seguidas con el código final. Resultados en
`evidencia_inicio/qa_inicio.json`; capturas en la misma carpeta.

Cubre: espera de pulsación; intro completa en tiempo real (duración, orden y entrada de los
7 planos, movimiento en cada uno); estado del audio; menú con ratón, teclado y mando
simulado; opciones (guardado y persistencia tras recargar); créditos; salir; nueva partida
con activaciones repetidas; descenso en tiempo real; llegada al Refugio y entrega del
control; CONTINUAR con y sin partida; salto de la intro en los 7 planos y del descenso en
sus 3 fases; 7 resoluciones de 4:3 a 21:9; movimiento reducido; audio silenciado; imagen
ausente; consola.

Defectos que la prueba encontró y quedaron corregidos:
- las teclas no cerraban la espera de pulsación ni saltaban la intro (el guardián de
  teclado del build anula los `keydown` de captura sobre `window`);
- al cerrar un submenú la selección volvía a la primera opción;
- un ratón quieto sobre el menú le quitaba la selección al teclado.

### No probado

- **Sonido audible**: el entorno no tiene salida de audio; sólo se comprueba el estado
  lógico (contexto en marcha, sucesos disparados, ganancias).
- **Mando físico**: se simula la API Gamepad.
- Firefox, Safari y cualquier hardware real; rendimiento con GPU.
- Las pruebas anteriores del repositorio (`tools/qa/final_review.js` y similares) no se han
  vuelto a ejecutar; las que esperaban el flujo antiguo (intro → Refugio) fallarán.

## 5. Limitaciones conocidas

1. **El Refugio muestra al protagonista con los sprites antiguos** (con sombrero). El IDLE
   07B no se integra en la partida en esta fase, así que la continuidad «llega sin sombrero»
   se cumple en el descenso pero no en el Refugio.
2. **NUEVA PARTIDA no borra el progreso permanente** del motor (moneda, mejoras, logros):
   crea la ficha y lleva al Refugio. Borrarlo exige una confirmación que no se ha diseñado.
3. CONTINUAR vuelve al Refugio; el motor no guarda incursiones a medias.
4. `op_05b_back`: el emblema de la espalda es una corona y los tatuajes no son legibles.
   `op_05a_boots`: hay máquinas recreativas al fondo. Las ilustraciones son generadas y no
   reproducen los tatuajes canónicos trazo a trazo.
5. En el descenso el héroe es el IDLE 07B estático sobre un pozo sencillo; es el tramo
   visualmente más pobre de la secuencia.
6. En partida sigue visible el botón de depuración «VISOR & RIG v3.2 [F9]» (ya estaba; se
   oculta en carga, intro y menú).
7. La pantalla de carga conserva la lista de pasos técnicos que ya tenía.
