# DEADBEAT DISCO

## Empieza aquí

Si acabas de abrir el proyecto, sigue este orden:

1. Lee este archivo para orientarte.
2. Entra en `src/` para ver el código del juego.
3. Entra en `assets/` para ver los recursos que usa el juego.
4. Consulta `CURRENT_STATE.md` para conocer el estado del proyecto.
5. Entra en `docs/` para encontrar diseño, lore, informes y evidencias.

## Mapa del proyecto

| Carpeta | Qué contiene |
|---|---|
| `src/` | Código del juego. |
| `assets/` | Dibujos, sonidos y recursos usados durante el juego. |
| `ART_ASSETS/` | Dibujos originales y materiales de arte. |
| `ART_PACK/` | Conexión e integración de los dibujos. |
| `ART_TOOLS/` | Herramientas para preparar y revisar imágenes. |
| `ART_AUDIT/` | Auditorías y pruebas técnicas de arte y jefes. |
| `ART_EVIDENCE/` | Capturas y resultados de pruebas de arte. |
| `ART_REFERENCES/` | Imágenes de referencia. |
| `CINEMATIC_ASSETS/` | Material fuente de las cinemáticas. |
| `docs/` | Documentación, informes y evidencias organizadas. |
| `tools/` | Herramientas generales y scripts del proyecto. |
| `backups/` | Copias de seguridad. No borrar como limpieza. |
| `.github/` | Automatizaciones de GitHub. |
| `FASE_0_3_EVIDENCE/` y `FASE_0_3_1_EVIDENCE/` | Evidencias de versiones anteriores. |

## Archivos importantes

- [Índice de documentación](docs/README.md)
- [Estado del proyecto](CURRENT_STATE.md)
- [Historial de cambios](CHANGELOG.md)
- [Inventario del proyecto](PROJECT_INVENTORY.md)
- [Plan de validación](VALIDATION_PLAN.md)

## Reglas para mantenerlo ordenado

- No cambies nombres de carpetas técnicas sin revisar imports, rutas, scripts y automatizaciones.
- No borres capturas, informes históricos ni copias de seguridad solo porque parezcan repetidos.
- Los archivos `index.html` y `DEADBEAT_DISCO.html` son iguales ahora, pero ambos los genera la automatización de construcción. **No borrar ninguno.**
- `index.html` y `DEADBEAT_DISCO.html` son builds generadas. Edita `src/` y usa `tools/build_active_html.py`.
- La build histórica se conserva como `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html`; no forma parte del arranque actual.
- [Índice de informes y auditorías](docs/REPORTS_INDEX.md): localiza los informes por tanda y tema.

Los nombres técnicos se conservan cuando otras partes del proyecto dependen de ellos. La explicación sencilla está aquí y en los README de las carpetas.
