# Guía del repositorio — DEADBEAT DISCO

## Empieza aquí
1. [README principal](../README.md): orientación rápida.
2. [Estado actual](../CURRENT_STATE.md): qué está vigente y qué sigue pendiente.
3. [CHANGELOG](../CHANGELOG.md): cambios registrados.
4. [Biblia maestra del universo](LORE/BIBLIA_MAESTRA_UNIVERSO_v1.0.txt): canon narrativo.
5. [RESTART](RESTART/): reconstrucción visual del protagonista y la introducción.

## Carpetas principales
| Ruta | Contenido |
|---|---|
| `src/` | Código fuente modular del juego. |
| `assets/` | Recursos que carga el juego. |
| `ART_ASSETS/` | Fuentes y entregas de arte. |
| `ART_PACK/` | Registro e integración de recursos artísticos. |
| `ART_TOOLS/` | Herramientas específicas de arte. |
| `ART_AUDIT/` | Auditorías técnicas y visuales. |
| `ART_EVIDENCE/` | Capturas, mediciones y resultados de QA. |
| `ART_REFERENCES/` | Referencias visuales. |
| `CINEMATIC_ASSETS/` | Material fuente de cinemáticas. |
| `tools/` | Scripts de construcción, producción y QA. |
| `docs/` | Documentación del proyecto. |
| `backups/` | Copias preservadas; no borrar durante limpiezas rutinarias. |
| `.github/` | Workflows y configuración de GitHub. |

## Reglas de mantenimiento
- No renombrar rutas técnicas sin auditar imports, referencias, manifiestos y workflows.
- No eliminar fuentes originales, manifiestos, archivos de producción ni evidencia histórica por coincidencia de hash solamente.
- Los duplicados exactos solo se retiran cuando existe una copia canónica preservada y se ha comprobado que no hay dependencias.
- Las carpetas históricas se conservan; se identifican como históricas en sus índices.
- Los HTML de entrada son generados: modifica `src/` y reconstruye con `tools/build_active_html.py`.
- No declarar una prueba superada sin ejecución y evidencia reproducible.

## Limpieza aplicada en esta rama
- Retirada la carpeta heredada `artevi2/`: sus 35 archivos de evidencia eran idénticos byte a byte a los conservados en `ART_EVIDENCE/tanda_01/tanda_02/`. La copia canónica permanece intacta.
- Retirada la build raíz `v9_t3_fase1b_cache_probe.html`: era idéntica byte a byte a `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html`. La copia preservada permanece intacta.
- No se modificaron el motor, los assets activos, los manifiestos ni los datos de partida.
