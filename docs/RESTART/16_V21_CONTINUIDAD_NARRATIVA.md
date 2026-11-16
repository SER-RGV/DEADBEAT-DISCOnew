# 16 · V2.1 — Continuidad narrativa y descenso final

Fecha: 2026-11-16. Rama `arena/18fda02d-deadbeat-disconew`, sobre `f32fd47`.
Evidencia completa y capturas: `docs/RESTART/evidencia_cine_v21/`.

La V2.1 **parte de la intro de 42 s aprobada** y no la rehace. Toca un único archivo de
producción (`src/dd_opening.js`) más el HTML activo regenerado. No toca motor, renderer,
HUB, menús, HUD ni gameplay. Reversible: `git show f32fd47:src/dd_opening.js`.

## Qué corrige (y solo esto)

1. **Acto IV (31.0–35.5 s):** la rotura del suelo pasa de un zoom sobre imagen fija a una
   **rotura dibujada** (grietas progresivas, agujero poligonal de 26 lados, 5 losas), y la
   caída pasa a ser **el eje de la Torre el que asciende** (`shaftSide {mode:"fall"}`,
   scroll 0.06→0.36) con el sombrero desprendiéndose entre 33.0 y 34.35 s.
   → Cumple el criterio del brief: **evolución de escena, no movimiento de cámara**.
2. **Acto V (35.5–42 s):** el túnel **estalla y desaparece** en 35.5–38 s en vez de
   ocupar el desenlace; el Refugio entra completo y con **el protagonista de pie sobre el
   suelo** (`feetY = padY − 0.105H`), respirando, mientras la sala sigue viva (deriva,
   pulsos de lámpara, ascuas, barrido de luz, último aliento).
3. **Enlace al HUB:** la sala se **disuelve** con el menú real en vez de cortarse, y el
   flash del título baja de 0.6 a 0.3 de alfa. Medición: **+0,+0 px** en 5 formatos.
4. **Bucle (acto II):** ventana de detalle que rota por pasada (pista → manos → plato),
   con contenido real y congelación en la 4.ª pasada.

## Verificación

| Prueba | Resultado |
|---|---|
| `motion.js intro` (210 muestras, 0.2 s) | **0 muestras congeladas** (antes 7) |
| `audit.js` | 42.02 s · 630 frames · 161 eventos · **0 errores** · 309 assets |
| `live.js` (Chromium real) | 41.62 s · **0 errores** · HUB activo · `idle_07b` |
| `continuity.js` | **+0,+0 px** en 1280×720, 1920×1080, 1024×768, 2560×1080, 844×390 |

Hoja de contacto exigida (últimos 12 s a 0.5 s): `hoja_contacto_30-35.5.jpg` +
`hoja_contacto_36-41.5.jpg` en `evidencia_cine_v21/`.

## Criterios de aceptación

- [x] Rotura progresiva del suelo y comienzo de la caída visibles y con causa.
- [x] La Torre corrige al protagonista; no hay narrador ni explicación añadida.
- [x] Solo los dos rótulos aprobados, literales, una vez cada uno.
- [x] El túnel no absorbe el desenlace.
- [x] Presencia y espacio jugable en el Refugio; enlace exacto con el HUB.
- [x] Sin cambios en diseño del protagonista, assets aprobados, motor, HUD ni menús.
- [x] Ocho planos y duración de 42 s intactos.

## Pendientes

Los cuatro puntos de `evidencia_cine_v21/INFORME_V21.md` §7 (audio del *FSSSSH*,
posición de la ventana de 13.3 s en 4:3, rótulo en 844×390, y revisión del Refugio pintado
si cambia el renderer). Ninguno bloquea la entrega.
