# archivo/

Material que el juego NO necesita para funcionar. Se conserva por historial y para futuras integraciones.

| Carpeta | Contenido |
|---|---|
| `assets_sin_usar/` | Imágenes producidas que ningún código del juego carga hoy. Misma estructura que `assets/`: para reactivar un archivo, muévelo a su ruta original (ver `INDICE.csv`). Incluye atuendos no integrados, conceptos, borradores de cinemáticas y miniaturas. |
| `evidencias/` | Capturas e informes de auditorías y pruebas antiguas (`ART_EVIDENCE`, `ART_AUDIT`, etc.). Los scripts de `tools/qa/` vuelven a crear `ART_EVIDENCE/` si se ejecutan. |
| `experimentos/` | `DEADBEAT_DISCO.ART.html`, `ART_PACK/`, la máquina de estados de jefes y una sonda de caché. No forman parte del juego activo; para ejecutarlos hay que devolverlos a la raíz. |

Regla: nada de aquí se carga desde `index.html`, `src/` ni el flujo de reconstrucción.
