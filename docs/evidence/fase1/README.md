# EVIDENCIAS · FASE 1 (pruebas automáticas y QA)

Capturas y datos de la ejecución completa del 26 de noviembre de 2026:

```bash
QA_OUT=docs/evidence/fase1/raw node tools/qa/run.js --all
# → 161 PASS · 0 FAIL · 1 SKIP · 768 s · node v22.22.3
```

- `report.json`: informe completo. Cada comprobación guarda qué se exigía, qué se
  observó, su duración y, si aplica, el motivo del SKIP.
- `capturas/`: JPEG reducidos (el PNG original se genera en cada ejecución y no se
  versiona).

| Archivo | Qué muestra |
|---|---|
| `01_arranque_menu.jpg` | menú recién arrancado, sin errores de consola |
| `02_menu_1280x900.jpg` | menú con la opción resaltada y el foco visible (suite `menu`) |
| `03_refugio_1280x900.jpg` | Refugio tras NUEVA PARTIDA: HUD, minimapa, estaciones, DJ |
| `04_planta_1_limbo.jpg` | Círculo I (LIMBO) en incursión corta |
| `05_nucleo_final.jpg` | NÚCLEO FINAL con su regla de tres fases |
| `06_partida_real.jpg` | partida con entrada real (teclado, ratón, esquiva, daño) |
| `07_persistencia.jpg` | estado tras recargar y restaurar la partida |
| `08_teclado.jpg` | menú recorrido solo con teclado |
| `09_menu_movil_390x844.jpg` | menú en 390×844 (referencia visual del repo) |
| `10_refugio_movil_390x844.jpg` | Refugio en 390×844 (referencia visual del repo) |

## Revisión visual de las capturas (26-11-2026)

Revisadas una a una. Lo que se ve, con lo bueno y lo que no:

**Correcto**: textos completos y legibles en 1280×900; contraste suficiente en el
menú; foco visible sobre «PERSONALIZAR»; rótulos de pista y BPM del núcleo
correctos; HUD, minimapa y estaciones presentes en el Refugio; diálogo del DJ sin
cortes en escritorio.

**Defectos observados (fuera del alcance de la Fase 1, anotados para las fases
4 y 5)**

1. **HUD recortado a 1280×900**: los tres iconos de habilidad/dados de la esquina
   inferior izquierda quedan cortados por el borde inferior (Refugio y pistas).
2. **Rótulo inferior cortado**: «VESTÍBULO DEL INFIERNO» se corta en el borde
   inferior a 1280×900.
3. **390×844 · HUD y minimapa se pisan**: la tarjeta del personaje con «ESC 0»
   queda tapada por el minimapa y por la píldora «EL REFUGIO · ZONA SEGURA».
4. **390×844 · menú**: la línea «LA NOCHE QUE DEVORÓ EL AMANECER» va sobre el
   fondo claro y pierde contraste; «NUEVE PISTAS ✦ UN ÚLTIMO BAILE» se parte en
   dos líneas y se solapa con la línea anterior.
5. **390×844 · diálogo del DJ**: la caja ocupa el ancho completo y tapa el
   escenario; el rótulo inferior vuelve a quedar cortado.

Ninguno de estos defectos rompe una prueba de la Fase 1: son de maquetación y
accesibilidad visual, y su sitio es la Fase 4 (controles, accesibilidad y juego
táctil) y la Fase 5 (rendimiento y calidad en móvil).
