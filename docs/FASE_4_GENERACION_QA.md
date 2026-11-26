# Fase 4 · QA de generación — en curso

2026-11-26. La fase 4 se ha iniciado, **no está aprobada ni terminada**. La fase 3 tampoco está cerrada: la identidad visual reconocible por círculo, la campaña natural y la ausencia de regresión de rendimiento siguen sin demostrarse. Metodología histórica y cambios: `docs/PROPUESTA_GENERACION_FASE_2.md`.

## Auditoría independiente de geometría

`node tools/qa/phase4_geometry_audit.cjs 1000` examinó 10.000 mapas 2.6, 620 configuraciones de prefab/puertas y 2.480 esquinas de tarima. Encontró 0 autointersecciones, 0 perímetros degenerados, 0 anclas y 0 desembarcos fuera, y **40 esquinas de tarima fuera del polígono** en configuraciones de camarote. Las cifras cuentan configuraciones únicas, no salas o semillas individuales. El Hangar se excluye de esta auditoría específica. La tarima es decorativa: los puntos fuera no prueban una colisión inválida ni un hueco físico.

Se corrigió experimentalmente en 2.7: se baja `y` de la tarima `booth` de 150 a 190 en plantillas derivadas de camarote, sin alterar plantillas previas, suelo, puertas ni colliders. `node tools/qa/phase4_geometry_audit.cjs 1000 repair` repitió 620 configuraciones y 2.480 esquinas: **0** fuera; 0 autointersecciones, perímetros inválidos, anclas o desembarcos fuera. Revisa esquinas de la tarima a nivel de datos, no cada píxel elevado ni el área completa de los escalones. Imágenes comparativas de seed 0/tienda `fase4-tarima-visual/` y metadatos; navegación debug, no compra natural. La captura muestra la tarima recolocada, pero el HUD tapa parte del rincón.

## Regresión y límites

| Prueba | Resultado | Alcance y límites |
|---|---|---|
| `phase4_repair_plans.cjs 1000` | 10.000 mapas deterministas, 115.000 salas prefab, 920.000 candidatos | 1.000 Hangar excluidos de adaptación; adaptador y validador comparten predicado. |
| `phase4_repair_uniqueness.cjs 1000 variants` | 0 mapas con firma repetida en 10.000, incluye 1.000 Hangar | Polígono del plan, normalización de rotación/reflejo/escala; no demuestra diversidad perceptible. |
| `phase4_repair_reach.cjs 1000 variants` | 620 configuraciones, 1.552 desembarcos alcanzados | Rejilla paso 25/radio 16, sin Hangar ni tránsito continuo. |
| `DD_DECK_REPAIR=1 room_generation_unified_native.cjs` y `prefab_reach.cjs` | Seed 0: 115 salas, 257 puertas y 920 puntos; 257 salidas en rejilla | No cubre todas las semillas ni combate natural. |
| `DD_DECK_REPAIR=1 prefab_progression.cjs` y `room_generation_topology_live.cjs` | Nueve descensos asistidos, puerta final y reconstrucción de guardado | Debug: no es campaña natural ni reanudación activa. |
| `phase4_repair_version.cjs ... 100` | 1.000 planes por versión 2.0–2.6 idénticos a la build previa; 2.7 determinista y guardados 2.6/2.7 prevalecen | Compara planes y marcador, no experiencia visual antigua o persistencia completa. |
| `room_generation_topology_perf.cjs` | Headless, 1.000 muestras/version: generación+bind 2.0 media/p95 0,195/0,300 ms, 2.7 1,328/5,900 ms | Persiste regresión frente a legacy; no es frame time ni memoria. |

Todas las evidencias `docs/DIAGNOSTICO_SALAS_EVIDENCIA/fase4-*`; resultados anteriores 2.6 de fotogramas, memoria, capturas y victoria asistida en `circulos-26-*`. Falta repetir una campaña natural/no tainted y medir frames, asignaciones y memoria en escenarios representativos con GPU real. Tampoco están validadas todas las seeds físicamente, capturas de todos los tipos/círculos, persistencia completa de objetos, ni identificación visual ciega. El barrido de 10×1.000 se refiere a datos/proxies, no garantiza 10.000 campañas jugables.

## Activación y reversión

`window.__DD_PREFAB_DECK_REPAIR=true` antes de arrancar activa 2.7.0 para nuevas partidas sin marcador; 2.0.0 sigue por defecto y el marcador del guardado prevalece. Builds por `python3 tools/build_active_html.py`; ambos SHA-256 `af9519a507ba73051dce990d46e6bf6181846784c3bb5fccb1afc8c6192d5c01`.

Revertir con `sha256sum -c backups/room_deck_repair_20261126/SHA256SUMS`, restaurar migración y arneses de ese backup, reconstruir y comprobar ambos builds SHA-256 `385c3ed19771c877e93e17b3cab965a682c830cb3e2e05deacbb478cf4bf3592`. El código anterior no reconoce guardados 2.7: respaldar datos y planificar migración, no borrarlos. Apagar el flag no cambia guardados ya marcados 2.7. Se preservan los logs históricos y backups.

## Seguimiento: campaña natural, matriz y perfil (2026-11-26)

| Ámbito | Resultado medido | Límite |
|---|---|---|
| Campaña natural | Entrada desde menú, cinemáticas saltadas con Espacio, recorrido del refugio con W y descenso con E; combate con ratón/teclado. Derrota en `r0`, piso 0, 0 HP, versión 2.7.0. | Bot sencillo, una partida, no prueba imposibilidad humana ni victoria. Sin goto, invulnerabilidad, limpieza, testStep ni entrada directa. `fase4-campana-natural/result.json` y captura. |
| Matriz visual | 116 capturas seed 0, diez pisos, todos los nodos de cada plano, 12 tipos presentes en el conjunto; cero pageerrors. Se revisaron las diez hojas de contacto. | Navegación debug, invulnerabilidad y spawns detenidos; no representa combate. Una seed, HUD y escala ocultan detalles. Formas y escaleras se repiten mucho, las texturas por círculo sí cambian; no acredita identidad arquitectónica distintiva ni ausencia de defectos en todos los píxeles. |
| Perfil Node | 2.000 mapas instrumentados: legacy 0,220 ms/mapa; topología 0,268, bind 0,038, compilación 0,371, adaptación 0,522, validación 0,174 ms/mapa. | Etapas secuenciales con instrumentación, no benchmark Chromium ni suma comparable directamente a legacy. `fase4-perfil-generacion.json`. |
| Experimento preparación compartida | 10.000 mapas, 115.000 salas, población idéntica; planes versiones 2.0–2.7 idénticos en 1.000 mapas/versión; guardados prevalecen en prueba de marcadores. Chromium A/B intercalado, 1.000 mapas: antes media/p95 2,493/10,4 ms; después 2,443/10,0 ms. | Diferencia pequeña frente al ruido; no resuelve regresión vs 2.0. **Experimento revertido**, patch guardado en backup. A/B en dos páginas, incluye bind y no mide frames/memoria. |

Reversión verificada: los dos builds vuelven a SHA-256 `af9519a507ba73051dce990d46e6bf6181846784c3bb5fccb1afc8c6192d5c01`; `sha256sum -c backups/room_perf_shared_20261126/SHA256SUMS` PASS. El parche experimental reproducible está en `backups/room_perf_shared_20261126/experiment.patch`; aplicarlo y reconstruir solo en entorno de prueba. **Pendientes**: victoria natural y recorrido completo, revisión detallada sin HUD/oclusiones y en más seeds, corrección real de la regresión y A/B de frame y memoria en juego representativo. No se habilita 2.7 por defecto ni se cierra fase 4.
