# DEADBEAT DISCO · Fase 02 — control de calidad

**Base:** commit `4666077` (Original y Rapture ya aprobados).  
**Alcance:** seis nuevos showcases; sin cambios a Original/Rapture, lógica de selector, CSS, navegación, gameplay ni motor.

## Integración

El selector ya carga `assets/characters/outfits/<id>/showcase.png` por medio de `DD_APPEARANCE.preview()` en `src/dd_appearance.js`; `src/dd_ui_system.js` pasa la URL al pseudo-elemento de la vista. Se reemplazaron solamente los seis PNG correspondientes. No se creó un sistema paralelo.

Se equiparon sucesivamente los ocho IDs en Chromium. Cada showcase respondió **HTTP 200** y la pasada no produjo errores de página. Las capturas de esa comprobación están en `.cache/review/phase02/selector-<id>.png` durante esta sesión.

## Uniformidad de lienzo y escala

Los ocho archivos tienen lienzo transparente de **600 × 1075 px**. Los seis nuevos personajes ocupan `y=40..1048` (alto visible de 1008 px); Original ocupa `y=38..1050` y Rapture `y=43..1045`. Las seis nuevas ilustraciones, por tanto, comparten exactamente altura, posición de pies/silueta y márgenes entre sí; respecto a las dos referencias aprobadas, los márgenes visibles difieren como máximo 3 px.

## Revisión visual

- **Shadow:** capucha integrada puesta, sin sombrero; abrigo asimétrico, correas y botas completas.
- **Apocalypse:** armadura oscura asimétrica con hombrera grande y pinchos, placas agrietadas con luz magma, remaches de calavera, cadena y faldón andrajoso.
- **Gunslinger:** chaqueta western distinta de Original, cartuchera, bandolera, cinturones y botas; se rechazó una primera pasada demasiado parecida a Original y se rehízo antes de integrar.
- **Fight Club:** torso descubierto, shorts negros con vivo magenta, vendas en manos y tobillos/talones, pies descalzos y sin espinilleras.
- **Kitchen Riot:** chaqueta profesional clara con mangas remangadas, delantal y accesorios culinarios discretos.
- **Street Art:** chaqueta y pantalón utilitarios con pintura/graffiti de paleta neón, botes y pinceles sujetos al cinturón.
- Los tatuajes visibles se limitan a piel expuesta; no se aprecia tinta sobre prendas o protecciones. El sigilo del hombro queda cubierto donde corresponde. Se conservaron identidad facial, fedora salvo Shadow (capucha solamente), y acabado de cómic underground.
- Las ocho siluetas muestran cabeza/cobertura, ambos pies/calzado y cuerpo entero dentro del encuadre. Sin recorte visible ni deformación anatómica detectada en la comparación.

## Pruebas ejecutadas después de integrar los seis PNG

| Prueba | Resultado |
|---|---|
| `node tools/qa/test_outfit_preview.js http://localhost:8081 .cache/review/phase02/final-outfit-preview` | PASS — 8 atuendos, equipamiento, persistencia, Extras y teclado móvil |
| `node tools/qa/test_outfit_portraits.js http://localhost:8081 .cache/review/phase02/final-outfit-portraits` | PASS — 8 atuendos, retrato HUD, migración, persistencia y refresco de recursos |
| `node tools/qa/test_menu_visuals.js http://localhost:8081 .cache/review/phase02/final-menu-visuals` | PASS — carga, cinco escenas, ocho retratos, Extras y movimiento reducido |
| Revisión browser por ID | PASS — 8 recursos HTTP 200; cero errores de página |

## Artefactos

- Comparativa de los ocho showcases a escala uniforme: [fase02-ocho-showcases.png](fase02-ocho-showcases.png)
- Backups preintegración de los seis recursos: `assets/characters/outfits/concepts/archive/{shadow,apocalypse,gunslinger,fightclub,kitchenriot,streetart}-showcase-before-phase02.png`.
- Archivos modificados: `assets/characters/outfits/{shadow,apocalypse,gunslinger,fightclub,kitchenriot,streetart}/showcase.png`.

## Incidencias

La primera propuesta de Gunslinger heredaba demasiado la chaqueta biker de Original; se sustituyó por una chaqueta western oxblood con flecos antes del pase final de pruebas. No quedan incidencias visuales conocidas en estos seis showcases. Original y Rapture no se modificaron.
