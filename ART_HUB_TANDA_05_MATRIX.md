# HUB · TANDA 05 — MATRIZ DE VALIDACIÓN

Generado: 2026-11-04T00:24:01.270076+00:00 · Arnés: `ART_TOOLS/qa/validate_hub_tanda_05.js` · Resultado: **14/14 APROBADO**.

| # | Validación | Estado | Evidencia principal |
|---|---|---|---|
| 1 | Carga de los diez assets: 10/10 PNG por HTTP 200, load() y registro V5 | APROBADO | `despues_runtime_full.json`, `antes_runtime.json`, `control_runtime.json` |
| 2 | Visibilidad: 10/10 drawImage medidos en el canvas de mundo, A/B 0→10→0→10 | APROBADO | `draw_calls.json`, `control_off_a_centro.png`, `control_on_centro.png` |
| 3 | Escala y dimensiones: aspecto nativo conservado, sin deformación | APROBADO | `ART_ASSETS/hub/tanda_05/manifest.json`, `despues_runtime_full.json`, `draw_calls.json` |
| 4 | Perspectiva isométrica: misma proyección, pivote y Y-sort que T01–T04 | APROBADO | `despues_runtime_full.json`, `despues_centro.jpg`, `ART_HUB_TANDA_05_MATRIX.md` |
| 5 | Transparencias y halos: alfa real, sin franja blanca ni halo exterior | APROBADO | `ART_ASSETS/hub/tanda_05/manifest.json`, `alpha_verification.json`, `control_on_centro.png` |
| 6 | Orden de capas y oclusión: Y-sort compartido, sin canvas nuevo ni sombra en colgantes | APROBADO | `despues_runtime_full.json`, `visual_diff.json`, `comparativa_control_off_on.jpg` |
| 7 | Movimiento del jugador: idéntico con el flag activado y desactivado | APROBADO | `despues_tras_movimiento.jpg`, `antes_tras_movimiento.jpg` |
| 8 | Colisiones: sin cambios de hitbox, auditoría del HUB idéntica en las 3 fases | APROBADO | `despues_runtime_full.json`, `control_runtime.json`, `antes_runtime.json` |
| 9 | Puertas: ciclo noche/ronda, sala real r23 y arquitectura intacta | APROBADO | `doors_closed.jpg`, `doors_open.jpg`, `despues_runtime_full.json` |
| 10 | Estaciones: 11 intactas, apertura y cierre de modal sin cambios | APROBADO | `estacion_bar.jpg`, `despues_runtime_full.json` |
| 11 | Interacciones existentes: campaña, disparo y transición sin regresión | APROBADO | `regresion_campaign.jpg`, `estacion_bar.jpg`, `diff_scope.json` |
| 12 | Regresión T01–T04: 10/10, 10/10, 13/13, 142 claves base y cachés intactas | APROBADO | `despues_runtime_full.json`, `comprobacion_caches.json`, `integridad_t01_t04.json` |
| 13 | Errores JavaScript y de carga: 0 errores JS, 0 404 locales, 0 errores de loader | APROBADO | `despues_runtime_full.json`, `control_runtime.json`, `antes_runtime.json` |
| 14 | Rendimiento: coste de render separado del coste de carga (sin cerrar el gate de T02) | APROBADO | `performance.json`, `resultados_ab.json` |

## Cobertura por asset

| Asset | Carga HTTP | Registro V5 | drawImage | Caja en pantalla | Zonas completas | Diff OFF/ON | Alfa |
|---|---|---|---|---|---|---|---|
| T05-01 Garra del Limbo | 200 | alias `h05_*` | 513 | 172 | 3 | 53.201 % / ruido 0.685 % | APROBADO |
| T05-02 Banco del Olvido | 200 | alias `h05_*` | 726 | 387 | 5 | 43.662 % / ruido 0.0 % | APROBADO |
| T05-03 Stack de Subwoofers | 200 | alias `h05_*` | 748 | 349 | 3 | 21.669 % / ruido 1.008 % | APROBADO |
| T05-04 Videowall | 200 | alias `h05_*` | 541 | 225 | 5 | 42.337 % / ruido 0.0 % | APROBADO |
| T05-05 Consola Auxiliar | 200 | alias `h05_*` | 755 | 748 | 5 | 31.516 % / ruido 0.0 % | APROBADO |
| T05-06 Neón Último Trago | 200 | alias `h05_*` | 705 | 643 | 5 | 26.257 % / ruido 1.392 % | APROBADO |
| T05-07 Cartel Última Sesión | 200 | alias `h05_*` | 530 | 501 | 3 | 29.78 % / ruido 0.22 % | APROBADO |
| T05-08 Line Array Colgante | 200 | alias `h05_*` | 889 | 876 | 8 | 11.094 % / ruido 0.619 % | APROBADO |
| T05-09 Cordón VIP | 200 | alias `h05_*` | 759 | 748 | 3 | 19.224 % / ruido 0.0 % | APROBADO |
| T05-10 Confesionario de Quejas | 200 | alias `h05_*` | 887 | 645 | 6 | 46.94 % / ruido 0.0 % | APROBADO |

## Tabla final

| Asset | Generado | Integrado | Visible | Validado |
|---|---|---|---|---|
| T05-01 Garra del Limbo | SÍ | SÍ (513 drawImage) | SÍ (172 en pantalla, 3 zonas completas) | APROBADO |
| T05-02 Banco del Olvido | SÍ | SÍ (726 drawImage) | SÍ (387 en pantalla, 5 zonas completas) | APROBADO |
| T05-03 Stack de Subwoofers | SÍ | SÍ (748 drawImage) | SÍ (349 en pantalla, 3 zonas completas) | APROBADO |
| T05-04 Videowall | SÍ | SÍ (541 drawImage) | SÍ (225 en pantalla, 5 zonas completas) | APROBADO |
| T05-05 Consola Auxiliar | SÍ | SÍ (755 drawImage) | SÍ (748 en pantalla, 5 zonas completas) | APROBADO |
| T05-06 Neón Último Trago | SÍ | SÍ (705 drawImage) | SÍ (643 en pantalla, 5 zonas completas) | APROBADO |
| T05-07 Cartel Última Sesión | SÍ | SÍ (530 drawImage) | SÍ (501 en pantalla, 3 zonas completas) | APROBADO |
| T05-08 Line Array Colgante | SÍ | SÍ (889 drawImage) | SÍ (876 en pantalla, 8 zonas completas) | APROBADO |
| T05-09 Cordón VIP | SÍ | SÍ (759 drawImage) | SÍ (748 en pantalla, 3 zonas completas) | APROBADO |
| T05-10 Confesionario de Quejas | SÍ | SÍ (887 drawImage) | SÍ (645 en pantalla, 6 zonas completas) | APROBADO |

## Clasificación de etiquetas

- `APROBADO`: ejecutado y medido con resultado conforme.
- `FALLIDO`: ejecutado y medido con resultado no conforme (0 en esta QA).
- `BLOQUEADO`: no ejecutable por dependencia externa (0 en esta QA).
- `NO VERIFICADO`: expresamente fuera de alcance (4 propuestas de interacción NO implementadas, documentadas en `report.json` → `interactionProposals`).
