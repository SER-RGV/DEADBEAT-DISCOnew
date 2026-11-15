# DEADBEAT DISCO — Sistemas de diseño paralelos

**Rama:** `design/parallel-levels-enemies-balance-ui`  
**Base:** `main`  
**Alcance:** documentación y auditoría de diseño. No modifica el motor ni los datos de balance.

## Objetivo

Desarrollar en paralelo cuatro áreas que deben funcionar como un único sistema:

1. Diseño de mapas y niveles.
2. Enemigos y composición de encuentros.
3. Auditoría de armas, estadísticas y equilibrio.
4. HUD, menús e interfaz.

La FASE 08 de escala y cámara queda en manos de Arena. Esta rama define contratos de diseño y criterios de validación; no modifica `src/dd_world_renderer.js`, `src/dd_ui_system.js`, `src/dd_boot.js`, el HTML principal ni los manifiestos de assets.

## Fuentes revisadas en `main`

- `ART_BIBLE.md`: identidad visual, reglas de legibilidad, perspectiva, pivotes y canon narrativo.
- `CURRENT_STATE.md` y `PROJECT_INVENTORY.md`: estado e inventario técnico, con limitaciones de verificación.
- `docs/ART_REBUILD/CHECKPOINT.md`, `NEXT_BATCH.md` y `PRODUCTION_STATUS.json`: producción de protagonistas, enemigos y jefes.
- `docs/ART_REBUILD/batches/R02_ENEMIGOS.json`: seis familias visuales y sus escalas de mundo.
- `docs/ART_REBUILD/batches/R03_JEFES.json`: once jefes y estados artísticos.
- `ART_AUDIT/BOSSES/B4_BOSS_COMBAT_MATRIX.md`: perfiles y patrones de combate de diez encuentros.
- `ART_TANDA_08_FASE0_1_MAPA_Y_COMPOSICION.md` y `ART_HUB_TANDA_06_CAMERA_AUDIT.md`: geometría y cámara medidas del HUB.
- `src/dd_ui_system.js`, `src/dd_rebuild_ui.css`, `docs/RESTART/14_MENU_CARGA_Y_VOLUMEN.md`: contratos de UI y estado del menú.
- `FASE_0_3_BUG_REGISTRY.md`: incidencias históricas que deben permanecer en regresión, sin asumir que todas siguen abiertas.

## Decisiones cerradas que no se reabren

- Juego isométrico para PC y consola, estructura híbrida y modelo premium.
- Universo visual de discoteca oscura, decadente y extravagante; art-déco/gótico, negro profundo, magenta, cian y oro selectivo.
- Legibilidad de combate por encima del detalle decorativo.
- No reintroducir Dante, círculos del infierno ni estructura autobiográfica.
- Los nombres de temas/círculos existentes son claves internas de paleta y compatibilidad; no constituyen por sí mismos lore ni fijan el número de niveles.
- No crear un segundo motor, cámara, loader, gestor de UI o sistema de progresión.
- No cambiar mecánicas o estadísticas sin medir el comportamiento actual y aportar pruebas.

## Cómo leer los documentos

| Documento | Define |
|---|---|
| [01 — Mapas y niveles](01_MAPAS_Y_NIVELES.md) | Grafo, salas, ritmo espacial, rutas y verticalidad |
| [02 — Enemigos y encuentros](02_ENEMIGOS_Y_ENCUENTROS.md) | Roles, telegráficos, composición y jefes |
| [03 — Armas y equilibrio](03_ARMAS_Y_EQUILIBRIO.md) | Inventario, métricas, auditoría y método de balance |
| [04 — HUD y UI](04_HUD_Y_UI.md) | Jerarquía informativa, pantallas, controles y accesibilidad |
| [05 — Matriz de validación](05_MATRIZ_VALIDACION.md) | Pruebas cruzadas y criterios de aceptación |
| [06 — Mapa maestro, semilla A](06_MAPA_MAESTRO_SEMILLA_17677515.md) | Grafo y ficha de una semilla real |
| [07 — Plan espacial de 12 salas](07_PLAN_ESPACIAL_12_SALAS_V1.md) | Intención y geometría propuesta para cada nodo de la semilla A |
| [08 — Variabilidad topológica](08_VARIABILIDAD_TOPOLOGICA_Y_ARQUETIPOS.md) | Comparación de dos semillas y reglas de diseño adaptables |
| [09 — Blueprints espaciales](09_BLUEPRINTS_ESPACIALES_POR_TOPOLOGIA.md) | Plantillas reutilizables por grado, tipo y conexiones del nodo |
| [10 — Recetas de encuentros](10_RECETAS_ENCUENTROS_POR_GEOMETRIA.md) | Composiciones por rol, topología y patrones B4 |
| [11 — Prototipo de sonda runtime](../../tools/qa/audit_campaign_geometry.js) | Prototipo pendiente de adaptar y validar contra el flujo de la build objetivo |
| [12 — Auditoría de geometría runtime](12_AUDITORIA_GEOMETRIA_RUNTIME.md) | Hallazgos, evidencia disponible, límites y plan de extracción |
| [13 — Auditoría del arsenal y catálogo](13_AUDITORIA_DEL_ARSENAL_Y_CATALOGO.md) | Inventario gráfico, catálogo jugable, discrepancia 120/121 y protocolo de balance |
| [14 — Exportación runtime del catálogo](14_EXPORTACION_CATALOGO_ARMAS.md) | Requisitos, ejecución local, archivos de salida y límites del exportador |

## Estado y rigor

- **Verificado documentalmente:** dato presente en las fuentes listadas.
- **Propuesta:** decisión de diseño nueva que necesita validación.
- **Pendiente de extracción:** el dato existe o debería existir en el código, pero aún no se ha medido en esta auditoría.
- **No probado:** requiere ejecución real o hardware que no se ha usado.

Este paquete no declara que el juego esté balanceado ni que los sistemas estén implementados. Define qué auditar, qué diseñar y cómo demostrar que funciona.
