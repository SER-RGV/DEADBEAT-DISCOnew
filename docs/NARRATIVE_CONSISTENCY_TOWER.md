# Fase 12 · Una sección del relato, un registro de incursión

**Decisión autoral:** nueve pistas narrativas; diez registros operativos. Dos sistemas distintos, sin tabla de equivalencias. No hay una décima pista. La consulta no constituye un viaje, una revelación del soberano ni una elección de ruta.

## Origen y autoridad

La fase 11 daba a `circleInfo()` y a `DMO.circles.residents()` una sola lámina de aspecto histórico. Sus índices sí corresponden entre sí **dentro de la incursión**. No son una fuente de cosmología. La autoridad narrativa es la biblia vigente (`docs/LORE/BIBLIA_MAESTRA_UNIVERSO_v1.0.txt`, §§0.1–0.2, 5, 7–15), no sus copias históricas. Para lo que realmente ve el jugador manda `src/dd_opening.js` (SHOTS, FILES, cartelas, partitura y descenso), contrastado con `docs/RESTART/10_INTRO_COMIC_NARRACION.md` y `13_CIERRE_INTRO_REFUGIO_PERSISTENCIA.md`. El manifiesto de portada ya habla de nueve pistas; los rótulos del HUD y los estados del mapa nativo identifican el recorrido jugable. El antiguo fondo `op_02_tower.jpg` y la miniatura `map_infernal_tower` no son el plano 03 de la intro actual.

## Matriz de contradicciones

|Clase|Antes|Evidencia y problema|Resolución|Se conserva|
|---|---|---|---|---|
|Crítica de lectura|I–IX y FINAL compartían la lámina de descenso como niveles sucesivos.|Plano 03: «Nueve pistas. Una debajo de otra.» §5.1 y §15 incluyen el Núcleo **dentro** de las nueve.|Sección fija con nueve marcas sobre las mismas bandas del plano 03. Núcleo junto a 09; FINAL sólo en la columna operativa.|Diez botones originales y diez estados del motor.|
|Importante|La ficha del residente aparecía bajo un numeral de sección que cambiaba con la consulta.|§§7–15: los soberanos no son la lista de residentes del prototipo. En el último registro incluso coincide el nombre del residente con el del registro.|Dossier independiente «Sede de incursión / Residente de incursión». El Rey del Compás sólo se nombra en la sección narrativa.|Nombres, sedes, colores de estados y encuentros efectivos, incluido NÚCLEO FINAL.|
|Terminológica|LIMBO, IRA, etc. encabezaban un «Archivo de descenso» sin calificación.|§0.2 distingue nomenclatura jugable heredada de pistas; los subtítulos temáticos propuestos no son nombres definitivos.|Mantener nombres en el registro; numerar las pistas sin bautizarlas de nuevo.|Nomenclatura del juego, sin reescribir la biblia.|
|Visual|Maqueta de una torre exenta sobre el mueble y numeral tintado por el residente seleccionado.|El salón de estación crece hacia abajo. El contorno aislado sugería otro edificio, no un hecho canónico explícito.|La proyección y la lámina muestran el corte `mc_03_nine.jpg` completo; no hay haz o marca entre un residente y un piso.|Mueble físico, iluminación de proximidad, cristal y hierro del plano, marco industrial.|
|Presentación|Consulta, ubicación y relato competían en una única placa.|§5.2 distingue nivel, sala, acceso y refugio. No hay fuente que asigne el botón IX al soberano de la pista 09.|Relato fijo / índice / dossier. El plano de sala sólo vive en el dossier operativo. Sin flechas narrativas ni botones nuevos.|Selección, foco, puertas reales y localización.|

**Comprobación de identidades:** los soberanos narrativos son Véspera, Voraz, Áurea, Brama, el Obispo de la Nota Ausente, el Corazón Encadenado, el Crupier de las Mil Voces, Nix y el Rey del Compás. No se cargan en un array paralelo para indexarlos con fichas. La interfaz no asigna al Rey el sprite, color o función de ningún residente jugable. No se afirma que la torre causó la Primera Noche ni que abrió el suelo.

## Contraste con la secuencia ejecutada

|Plano / tiempo|Qué se conserva y qué implica para la mesa|
|---|---|
|1 · 0–4 s|Estación tras la guerra y posibilidad de reunirse; no se añade una cosmogonía.|
|2 · 4–9 s|Salón de baile bajo cristal y hierro, no un templo o un reino exterior.|
|3 · 9–14 s|La noche no termina; crecimiento hacia abajo. Fuente visual directa de la proyección; las nueve cotas toman los centros usados por `shotNine`.|
|4 · 14–19 s|Puertas que no llevan fuera y última nota que vuelve. No traducir ese montaje en conexiones cartográficas.|
|5 · 19–24 s|El protagonista ya está dentro y pisa fuera de compás. Ningún tatuaje se usa como sigilo de pista.|
|6 · 24–29 s|Comienza la caída. No atribuir agencia a la mesa.|
|7 · 29–32 s|Título sobre el pozo; no es una ficha del Núcleo. El descenso posterior (4,6 s) llega al Refugio, zona segura, no pista 01.|

Cartelas y diseño sonoro, no narrador hablado. No se modificaron planos, símbolos, voces, partitura ni la precisión pendiente de la cartela «desde cuándo» señalada en la documentación de la intro.

## Verificación y evidencias

- Build activa regenerada. `test_cartography_tour.cjs`: comprobó nueve marcas y el pie del Núcleo, seleccionó las diez fichas en Refugio y en incursión, verificó nombre operativo y residente, coordenadas y sala, y comparó **todo el DOM narrativo** antes y después de cada selección. No cambió. Llegada al Núcleo tras nueve cámaras y **199 cruces** por puertas generadas; `clear`/`cross` de QA, no nueve victorias manuales ni teletransporte.
- `test_map_atlas.cjs`: mesa física, seis accesos presentes, ratón, teclado, mando estándar simulado, cancelar/volver, foco, consulta, geometría y puertas. 45 intervalos rAF por software: mediana 50,0 ms, p95 83,4 ms. `test_minimap_engine.js`: coincidencia píxel a píxel y encuadre en cuatro resoluciones. `cmp` de las dos entradas y `git diff --check` pasaron.
- `ART_EVIDENCE/CARTOGRAFIA/fase12/`: `intro-1` a `intro-7` son capturas del juego con posicionamiento temporal de prueba; `registro-01` a `registro-10`, capturas individuales de consulta; `torre`, `refugio`, `sala`, `rutas`, `intro-atlas` y `antes-despues` (JPG). Revisadas visualmente la secuencia y la lectura del registro final: «Núcleo final» está en la ficha de incursión; «Pista 09 · El Núcleo» permanece en el relato.
- No se modificaron APIs, guardados ni progresión. La prueba comprueba persistencia del descubrimiento dentro de la incursión, no equivalencia de guardados entre versiones. Pendientes mando físico, GPU física y valoración de legibilidad en pantalla de mano real.

## Fase 13 · presentación sin correspondencias nuevas

El fotograma de reposo de cada residente procede del registro de arte existente y sólo aparece en su dossier de **incursión**, junto a la sede y al nombre que devuelve el motor. Ningún sprite aparece en la sección narrativa. La proyección sigue usando el plano 03 completo: varía la luz del proyector, no el contenido ni las cotas. La ficha operativa FINAL conserva su residente; la Pista 09 y el Rey del Compás siguen fijos en el relato.

Validación en la build regenerada: `test_cartography_tour.cjs` consultó los diez registros en Refugio e incursión; comprobó sedes, nombres, carga de los diez sprites, nueve marcas, DOM narrativo idéntico, sala y coordenadas sin cambios. Nueve cámaras y llegada al Núcleo mediante 190 cruces asistidos de QA, no combates manuales. Capturas individuales `ART_EVIDENCE/CARTOGRAFIA/fase13/registro-01.jpg` a `registro-10.jpg`. No se modificaron la intro, la biblia ni los catálogos de círculos y residentes. Detalles técnicos y límites en el apartado de fase 13 de `MAPS_HUB_NAVIGATION.md`.
