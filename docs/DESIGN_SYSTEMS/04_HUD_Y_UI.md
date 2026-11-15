# 04 — HUD, menús e interfaz

## 1. Objetivo

Unificar la jerarquía de información sin reconstruir sistemas que ya existen. La interfaz debe comunicar combate, estado, progresión y opciones con rapidez, manteniendo compatibilidad con teclado, ratón y mando.

## 2. Base existente verificada

El encabezado de `src/dd_ui_system.js` indica que la capa existente conserva:
- HUD unificado.
- Minimap isométrico.
- Armería/tienda.
- Mapa de la torre.
- Diálogo del DJ.
- Soporte de mando.

El mismo módulo declara que `DD_BOOT` es propietario de la máquina de estados; `DD_UI` solicita transiciones y no debe cambiar de estado por su cuenta.

El menú actual incluye:
- Nueva partida.
- Continuar, cuando existe progreso.
- Opciones.
- Créditos.
- Salir.

`docs/RESTART/14_MENU_CARGA_Y_VOLUMEN.md` registra correcciones de foco, teclado, sliders, navegación y respuesta real de audio. Sus pruebas reportadas: menú 53/53, flujo de inicio 65/65 y persistencia 39/39. El informe también indica limitaciones: mando físico no probado, otros navegadores no probados y panel pequeño a 2560×1440.

## 3. Jerarquía del HUD en combate

Propuesta de prioridad:

1. **Supervivencia:** vida, daño recibido y estado crítico.
2. **Acción inmediata:** arma activa, munición/carga y recarga.
3. **Amenazas:** jefe, enemigos de alto riesgo y telegráficos.
4. **Orientación:** minimapa, objetivos y puertas.
5. **Progresión:** experiencia, recursos y mejoras.
6. **Contexto:** combo, puntuación y mensajes secundarios.

No todos los elementos deben estar visibles permanentemente. La información secundaria debe reducirse durante los momentos de máxima presión.

## 4. Reglas de presentación

- El protagonista, enemigos, proyectiles y telegráficos siempre tienen prioridad visual sobre decoración.
- No usar blanco puro ni verde como fondo de HUD; respetar la paleta de la biblia visual.
- El magenta/oro comunica interacción o énfasis; rojo/cian saturado se reserva para peligro según la biblia.
- Los textos deben conservar contraste y cobertura tipográfica.
- No usar emoji/dingbats como iconos críticos sin comprobar la fuente.
- Los avisos deben aparecer cerca de la zona relevante sin tapar el objetivo.
- El minimapa debe distinguir pared, puerta, jugador, enemigo importante y objetivo sin depender solo del color.
- Las barras de jefe deben incluir identidad, vida y estado de fase cuando el juego lo necesite.

## 5. Pantallas y navegación

Mantener una arquitectura de pantallas coherente:
- Menú principal.
- Nueva partida/continuar.
- Opciones.
- Créditos.
- Pausa.
- Refugio/estaciones.
- Armería/tienda.
- Mapa/progresión.
- Selección de mejora.
- Derrota/victoria.
- Confirmaciones destructivas.

Reglas:
- Una acción primaria por pantalla.
- Volver siempre disponible.
- Foco visible y estable.
- No perder selección al actualizar contenido.
- No borrar progreso sin confirmación.
- No duplicar controles o categorías si no existe una razón funcional.
- Mantener la máquina de estados en `DD_BOOT`.

## 6. Mando y accesibilidad

Teclado, ratón y mando deben ofrecer equivalencia funcional.

Pruebas obligatorias:
- Navegar menús completos con D-pad/stick.
- Confirmar y volver con botones asignados.
- Manejar sliders y selectores sin desplegables nativos inaccesibles.
- Reasignación/visualización de controles si el sistema actual lo soporta.
- Foco visible.
- Tamaño de texto y contraste.
- Reducir movimiento/flash cuando exista opción.
- No depender únicamente de color para comunicar estado.

No declarar mando físico aprobado con pruebas emuladas.

## 7. Incidencias y regresión

El registro histórico de Fase 0.3 documentó, entre otras observaciones:
- Glifos ausentes por cobertura de fuente.
- Intercepción del botón JUGAR por la imagen de portada.
- Solapamiento del panel de arma con una etiqueta del HUB.

El informe RESTART 14 posterior registra correcciones de menú y pruebas adicionales. Por tanto, estas observaciones deben usarse como casos de regresión, no etiquetarse automáticamente como defectos actuales.

Casos adicionales:
- **Armería vacía al abrir (defecto confirmado por inspección estática):** `uiState.selectedCategory` nace como `"ALL"` en `src/dd_ui_system.js`; `renderShop()` crea el filtro visible `"TODAS"` y solo muestra todos los registros cuando el estado es exactamente `"TODAS"`. La primera renderización puede filtrar todo fuera. El clic en `TODAS` actualiza el estado y vuelve a renderizar. Pendiente de reproducción runtime y corrección aislada.
- **Límite de presentación de la armería (confirmado estáticamente):** `renderShop()` aplica `.slice(0, 120)` a la lista filtrada. Si el catálogo runtime devuelve más de 120 registros, el excedente no se muestra en la tienda. Esto podría explicar una diferencia entre el catálogo y los elementos visibles, pero no confirma por sí solo la cifra de 121 armas. El exportador debe comparar IDs completos con tarjetas visibles.
- Minimap blanco.
- Panel de mejora que congela la partida.
- Diálogos pegados.
- HUD y diálogos superpuestos en pantallas finales.
- Controles de volumen que guardan un valor pero no afectan a la salida real.

## 8. Contrato de integración con FASE 08

La cámara dinámica no debe escalar ni desplazar el HUD.

- El HUD vive en coordenadas de pantalla.
- El mundo y el minimapa pueden compartir datos de mundo, pero no transformaciones visuales accidentalmente duplicadas.
- La posición de avisos de jefe debe considerar el viewport nuevo.
- La interfaz no debe tapar los bordes de escape o telegráficos.
- Las barras y paneles deben seguir siendo legibles en las resoluciones soportadas.
- La cámara no puede cambiar el tamaño de fuentes, botones ni zonas de interacción.

## 9. Criterios de aceptación

- Ningún solapamiento en resoluciones objetivo.
- Menú navegable sin ratón.
- Foco siempre visible.
- Controles de audio validados midiendo salida real y, finalmente, escuchados por una persona.
- HUD estable con zoom dinámico.
- Minimapa sincronizado con la posición real.
- Mensajes no bloquean el combate salvo decisión de diseño explícita.
- Pantallas de victoria/derrota no muestran paneles residuales.
- Sin pérdida de progreso accidental.
- Pruebas con mando físico pendientes hasta disponer de hardware.

## 10. Pendientes

1. Capturas actuales de HUD durante combate real.
2. Inventario de todos los paneles y overlays.
3. Medición de solapamientos a 1280×720, 1920×1080 y 2560×1440.
4. Auditoría del minimapa y su correspondencia con el grafo.
5. Prueba de mando físico.
6. Revisión de textos e iconos con fuentes reales.
