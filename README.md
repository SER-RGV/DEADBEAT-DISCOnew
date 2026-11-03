# DEADBEAT_DISCO

Repositorio del proyecto **DEADBEAT DISCO**. La rama `main` es la fuente de verdad y no se modifica directamente: el trabajo se realiza en ramas independientes.

> Estado de esta fase (Fase 0.2): se ha estabilizado la documentación y protegido la build. **El juego no se ha ejecutado en navegador**; las funcionalidades descritas más abajo están *identificadas en el código y en los documentos del repositorio*, no validadas en runtime. Ver `VALIDATION_PLAN.md`.
>
> Actualización (Fase 0.3, 2026-11-02): **sí se ha ejecutado parcialmente en Chromium Headless 153**. La build arranca y llega a una sala de campaña, pero hay incidencias P1/P2 sin cerrar y pruebas bloqueadas (sin audio audible ni mando). El texto anterior se conserva como estado histórico de la Fase 0.2; el estado funcional vigente está en `FASE_0_3_QA_REPORT.md` y `FASE_0_3_TEST_MATRIX.md`. La build sigue intacta y sin correcciones.
>
> Actualización (Fase 0.3.1, 2026-11-02): con instrumentación corregida, **INC-001 (disparo) e INC-002 (transición) resultan `NO REPRODUCIDAS`**: el disparo genera proyectiles que entran en el mundo y la transición completa en 3/3 ejecuciones con control recuperado. Quedan abiertas hasta verificación en GUI (entorno sin display). Ver la sección 10 de `FASE_0_3_QA_REPORT.md`, la sección 6 de `FASE_0_3_TEST_MATRIX.md` y `FASE_0_3_1_EVIDENCE/`. **No se ha corregido nada.**

> Actualización (Fase 1 · Tanda 01, 2026-11-03): **reconstrucción artística real integrada**. Auditoría de 300 recursos embebidos (`ASSET_INVENTORY.md`, `ART_AUDIT/asset_inventory.json`); biblia visual (`ART_BIBLE.md`); 8 assets generados, preparados con alpha/dimensiones/pivote verificados e integrados en los 4 loaders existentes del motor (`ART_PACK/art_pack.js`). La **build activa es `DEADBEAT_DISCO.ART.html`**: copia byte-idéntica del original + un único `<script>`; el original y `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` conservan el SHA-256 `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a`. Validación limpia en Chromium headless ejecutada sin `ROOM_CAPTURE`: 8/8 íntegros, 0 `pageerror`, movimiento/disparo/proyectiles en `wa` conservados. Ver `VISUAL_QA_REPORT.md`, `ART_PRODUCTION_LOG.md`, `ASSET_REPLACEMENT_PLAN.md`, `ASSET_INTEGRATION_GUIDE.md` y `ART_EVIDENCE/tanda_01/`. **No se han modificado mecánicas, IA, Director, HUD, transiciones ni los scripts Cloudflare.** INC-001/INC-002 siguen `NO REPRODUCIDAS`. Limitaciones: entorno sin GUI, sin mando y con rAF/SwiftShader no comparable a hardware real; el rendimiento en hardware real queda `NO VERIFICADA`.

> Actualización (Fase 1 · Tanda 02, 2026-11-03): **arquitectura modular integrada y visible en partida**. 10 assets individuales generados y preparados (`ART_ASSETS/tanda_02/` con `_source/` y `manifest.json`) con las dimensiones reales de los slots V5, alfa verificado y pivote documentado. Se **amplió el loader existente** `ART_PACK/art_pack.js` (mismo `window.__DDM_V5_IMG` → `__DDM_GET_V5`), conservando los recursos previos y la Tanda 01: **el HTML activo `DEADBEAT_DISCO.ART.html` NO se ha modificado** y conserva `f231cfc7…723` / 13.381.028 B; original y backup siguen en `b2ef4ad8…d4a`. Los módulos los dibuja el propio pintor de muros (`$b`/`_b`, paneles por `edge`) y de puertas (`Bg`), sin canvas superpuesto, sin segundo loader y sin tocar geometría, colisiones ni lógica de apertura. Validación en Chromium/Playwright sobre el juego real: 10/10 íntegros, T01 8/8, V5 100/100, ILT 11/11, 0 `pageerror`, A/B en la misma build, salas reales `r0/r23/r34/r89`, puerta cerrada y abierta en `r23`, umbral y jugador en pantalla, regresión de movimiento/disparo sin cambios atribuibles. Ver `ART_TANDA_02_REPORT.md`, `ART_TANDA_02_MANIFEST.md`, `ART_TANDA_02_VISUAL_QA.md` y `ART_EVIDENCE/tanda_02/`. **Pendiente / NO VERIFICADO:** visibilidad aislada de A05 en el NÚCLEO (`setNight(100)` → `ok:false`), visibilidad aislada de A04/A06/A08/A10, rendimiento en hardware real (SwiftShader con rAF inanido) y pruebas con GUI/mando. DEF-001 (marco lateral original conservado, mezcla estilística en `r23`) queda registrado con evidencia y sin corrección improvisada.

## Contenido del repositorio

| Archivo | Descripción |
|---|---|
| `v9_t3_fase1b_cache_probe.html` | Build de referencia del juego, declarada en `CURRENT_STATE.md`. |
| `CURRENT_STATE.md` | Estado y pendientes declarados por el proyecto. |
| `CHANGELOG.md` | Registro de versiones (antes `HANGELOG.md`; renombrado en Fase 0.2 sin alterar su contenido). |
| `BACKUP_MANIFEST.md` | Copia de seguridad de la build y su SHA-256. |
| `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` | Copia idéntica de la build original. |
| `PROJECT_INVENTORY.md` | Inventario técnico de sistemas, módulos, CSS, canvas, assets y dependencias. |
| `VALIDATION_PLAN.md` | Plan de validación en navegador; su sección 5 registra las ejecuciones reales de la Fase 0.3. |
| `CLOUDFLARE_SCRIPTS.md` | Investigación de los dos scripts residuales de Cloudflare. |
| `FASE_0_2_REPORT.md` | Informe de entrega de la Fase 0.2. |
| `FASE_0_3_QA_REPORT.md` | Informe QA de validación funcional con ejecución real y decisión final. |
| `FASE_0_3_TEST_MATRIX.md` | Matriz V-01…V-11: procedimiento, resultado, evidencia, reproducibilidad, estado. |
| `FASE_0_3_BUG_REGISTRY.md` | Registro de incidencias P0–P3 y falsos positivos descartados. |
| `FASE_0_3_EVIDENCE/` | 10 capturas PNG, 10 logs JSON, entorno, índice, procedimiento manual y hashes. |
| `FASE_0_3_1_EVIDENCE/` | 17 capturas PNG, 4 trazas JSON, resultados numéricos, entorno, tooling, comprobación GUI pendiente, índice y hashes. |
| `ART_BIBLE.md` / `ASSET_INVENTORY.md` / `ASSET_REPLACEMENT_PLAN.md` / `ASSET_INTEGRATION_GUIDE.md` | Dirección artística, inventario de 300 recursos, plan de sustitución y guía de integración (Tanda 01). |
| `ART_PRODUCTION_LOG.md` / `VISUAL_QA_REPORT.md` | Registro de producción y QA visual de la Tanda 01. |
| `ART_PACK/art_pack.js` | Extensión de los loaders reales del motor: 8 assets T01 + 10 módulos T02 (único `<script>` de la build activa). |
| `ART_ASSETS/tanda_01/` · `ART_ASSETS/tanda_02/` | 8 assets T01 y 10 módulos T02, cada uno con fuentes `_source/` y `manifest.json`. |
| `ART_EVIDENCE/tanda_01/` · `ART_EVIDENCE/tanda_02/` | Capturas CDP y logs JSON de ambas tandas. |
| `ART_TANDA_02_REPORT.md` / `ART_TANDA_02_MANIFEST.md` / `ART_TANDA_02_VISUAL_QA.md` | Informe técnico, manifiesto y QA visual de la Tanda 02. |
| `ART_TOOLS/prepare_tanda_02.py` · `ART_TOOLS/qa/*tanda_02*` | Preparación reproducible, 3 validaciones Chromium, evidencia y cierre del manifiesto. |

## Build principal

- Archivo: `v9_t3_fase1b_cache_probe.html`.
- Tamaño: **13.380.910 bytes**, **19.835 líneas** (`CURRENT_STATE.md` coincide con la medición del archivo).
- SHA-256: `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a`.
- Formato: **un único archivo HTML autocontenido**. Contiene CSS integrado (31 bloques `<style>`), JavaScript integrado (12 bloques `<script>`) y recursos gráficos/fuente en Base64 (300 URIs `data:`).
- No existe sistema de compilación, `package.json`, ni dependencias externas declaradas. No hay `<link>` ni scripts remotos de juego.

El archivo conserva capas de versiones acumuladas: las cabeceras y metadatos internos mencionan v3.x, v5.0, v8.2, v8.4, v8.6, v8.7, v8.8, ILT v9.0 e ILT Atmosphere v9.2, con un manifiesto JSON `7.15.0-complete`. El nombre del archivo (`v9_t3_fase1b_cache_probe`) no coincide con una etiqueta de versión interna única. Estas denominaciones proceden de los propios comentarios/metadatos del HTML y **no implican que cada versión haya sido probada**.

## Sistemas identificados

Según los objetos globales `window.*`, las cabeceras de módulo y el manifiesto embebido en el HTML (todos **sin verificación en ejecución**): refugio/HUB, generación de pisos y mazmorra (muros, puertas, escaleras), HUD, sistema musical y cinemáticas de descenso, portada, progresión v8.7, atmósfera/bloom v9.2, atlas de assets, armas, jefes y guardado. La enumeración completa y su evidencia está en `PROJECT_INVENTORY.md`.

## Estado de verificación

`CURRENT_STATE.md` declara como pendientes: dependencias externas, integridad de los sistemas, funcionamiento completo del juego y compatibilidad de la build. En la Fase 0.2 se han ejecutado únicamente comprobaciones estáticas y de integridad de archivo (lectura completa del HTML, UTF-8, recorrido HTML, compilación de los bloques JS, decodificación de los 300 Base64, validez del JSON, coincidencia de hashes). **En la Fase 0.2 no se abrió el juego en ningún navegador**; ninguna prueba funcional se declaró superada en esa fase. En la Fase 0.3 sí hubo ejecución real parcial (ver el aviso al inicio y `FASE_0_3_QA_REPORT.md`); no por ello se declara la funcionalidad completa del juego.

## Reglas de trabajo

1. No modificar `main` directamente; usar una rama independiente.
2. Crear una copia de seguridad antes de cualquier modificación (regla de `CURRENT_STATE.md`; aplicada en `BACKUP_MANIFEST.md`).
3. No reconstruir el juego, no sustituir el HTML por una versión simplificada, no eliminar sistemas, no regenerar assets, no modificar mecánicas ni contratos de sistemas.
4. Registrar todos los cambios en Git. Los cambios de la Fase 0.2 se registran en los commits y en `FASE_0_2_REPORT.md`; `CHANGELOG.md` se ha conservado byte a byte durante el renombrado. Las modificaciones posteriores deben anotarse además en `CHANGELOG.md` siguiendo su plantilla (fecha, versión, archivos, sistemas afectados, pruebas, resultado).
