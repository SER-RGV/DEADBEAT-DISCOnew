# Revisión técnica previa a integración

- Fecha: 2026-11-13.
- Rama revisada: `chore/pre-merge-cleanup`.
- Commit revisado: `71ff072e17a106b922a89856da28c8ec22be29c5`.
- Base funcional: `arena/1a801cc0-deadbeat-disconew`.
- Alcance: inspección estática del árbol, fuentes, manifiestos, build, workflow y pruebas. No se modificó código de juego ni se ejecutó una partida.

## Dictamen

**NO LISTO PARA MERGE todavía.** Se detectó un defecto funcional concreto en el registro de recursos de arte y una carencia en la automatización de la rama de limpieza. El resto de comprobaciones estáticas realizadas no revela errores de sintaxis en los módulos principales ni referencias rotas en el manifiesto principal de assets.

## Hallazgos

### P1 — Ruta personalizada de un asset ignorada en ART_PACK

Archivo: `ART_PACK/art_pack.js`, líneas 183–184.

La función `entry(m)` declara dos veces las propiedades `id`, `file`, `loader` y `pivot`. La segunda declaración de `file` sobrescribe la primera, por lo que `m.path` nunca prevalece.

Caso confirmado:
- Ruta solicitada por la entrada `t3b_material_01`: `ART_ASSETS/hub/tanda_01/hub_01_suelo_central.png`.
- Ruta que resulta de la última propiedad: `ART_ASSETS/tanda_01/floor_01_neon_dancefloor.png`.
- Ambas rutas existen en el repositorio, por lo que el fallo puede pasar inadvertido como error de carga: se sirve una imagen distinta de la especificada para HUB-01.

**Corrección propuesta:** dejar una única propiedad `file` con precedencia explícita `m.path || (m.base || BASE) + m.file`; eliminar las propiedades duplicadas. Añadir una prueba unitaria que compruebe las tres variantes: `path`, `base` y `BASE`.

### P2 — Metadato de versión sobrescrito en ART_PACK

Archivo: `ART_PACK/art_pack.js`, líneas 171–172.

El objeto `st` declara dos veces `version`. La segunda cadena reemplaza el resumen acumulado de tandas por `fase1-tanda01+tanda02+boss-t01+boss-t02`. No cambia por sí sola el render, pero hace que el estado de diagnóstico informe una versión incompleta.

**Corrección propuesta:** conservar una sola versión acumulada y comprobar el valor de `DMO_ART_PACK.state()` en QA.

### P1 — El workflow no se ejecuta en la rama de limpieza

Archivo: `.github/workflows/rebuild-active-html.yml`.

El filtro de ramas incluye `main`, `fix/**` y `arena/**`, pero no `chore/**`. Por tanto, los pushes a `chore/pre-merge-cleanup` no disparan la reconstrucción. La rama actual no tiene una ejecución de Actions asociada a sus commits de limpieza.

**Corrección propuesta:** incluir `chore/**` si se quiere validar y regenerar HTML en esta rama, o añadir un workflow de validación independiente para ramas de limpieza. Mantener la reconstrucción y las pruebas separadas para que un cambio documental no regenere el juego innecesariamente.

### P2 — El workflow no ejecuta pruebas automatizadas

El único job reconstruye los HTML y los confirma si cambian. No ejecuta `tools/qa/test_restart_flow.js`, `tools/qa/final_review.js`, `tools/qa/selfcontained.js` ni otras pruebas.

**Corrección propuesta:** añadir un job de QA con dependencias y navegador fijados por versión. Publicar los resultados como artefactos y bloquear la integración cuando fallen.

### P2 — Las pruebas no tienen dependencias reproducibles declaradas

`tools/qa/test_restart_flow.js` requiere `playwright-core`, pero el repositorio no contiene `package.json` ni lockfile. El script documenta el uso de Chromium externo mediante `DD_CHROMIUM`, pero no fija la versión de Playwright ni proporciona una instalación reproducible desde el repositorio.

**Corrección propuesta:** declarar las dependencias de QA y sus versiones, junto con un comando único para instalar y ejecutar la suite. No introducir dependencias en el runtime del juego.

### P2 — Manifiesto de CINEMATIC_ASSETS apunta a maestros aún no presentes

`CINEMATIC_ASSETS/manifest.json` enumera seis rutas `master/*.png`; el árbol actual contiene los directorios con `.gitkeep`, pero no los seis PNG maestros. El README de esa carpeta explica que es material fuente editable y que los dibujos utilizados por el juego están en `assets/cinematics`.

Esto no demuestra un fallo de la cinemática activa, pero el manifiesto no representa archivos presentes. Debe etiquetarse explícitamente como plantilla/pendiente o completarse con los maestros reales antes de tratarlo como inventario de entrega.

## Comprobaciones realizadas

| Comprobación | Resultado |
|---|---|
| Árbol Git de la rama | 2.935 archivos |
| Módulos principales de `src/` | 7/7 compilan sintácticamente |
| Scripts QA seleccionados | 8/8 compilan sintácticamente tras retirar el shebang para la comprobación |
| `ART_PACK/art_pack.js` | Compila; revisión semántica detecta propiedades duplicadas |
| Registro principal `src/dd_asset_registry.js` | 269 entradas declaradas; 269 rutas locales comprobadas presentes |
| Manifiesto de fondos cinemáticos finales | JSON válido; 6 escenarios y sus archivos/capas presentes |
| Builds `index.html` y `DEADBEAT_DISCO.html` | Mismo blob Git, SHA `d41e614c70d7adb33e01284c221aad5a79e74e06`, 5.562.534 bytes |
| Enlaces Markdown de los índices principales | Sin destinos locales ausentes |
| Backup histórico | Presente e intacto |
| Evidencias canónicas | Presentes |
| Estado de checks del commit de limpieza | Sin checks publicados |

La compilación sintáctica con `new Function` no equivale a ejecutar los módulos en navegador. La comprobación de rutas del registro se refiere a las entradas del manifiesto principal; no demuestra que todos los recursos se decodifiquen ni que se dibujen correctamente.

## Automatización observada

La ejecución exitosa más reciente consultada fue la del workflow `Rebuild active game HTML` en la rama `arena/1a801cc0-deadbeat-disconew`, commit `572a704791b752ce0baef6f148e7905b3e082e3f`. Sus pasos ejecutados fueron checkout, setup Python, reconstrucción HTML y commit de los HTML generados. **No ejecutó la suite de QA.**

No se encontró una ejecución del workflow para `chore/pre-merge-cleanup`. El estado del commit revisado no tiene checks publicados.

## Pruebas que siguen pendientes

- Ejecutar `python tools/build_active_html.py` desde un checkout limpio de esta rama y comprobar que no produce cambios inesperados.
- Ejecutar la suite Playwright completa en Chromium fijado.
- Recorrer carga, intro, menú, Nueva partida, Refugio y Continuar.
- Verificar audio audible, mando físico y al menos un navegador/hardware real.
- Comparar capturas de la build regenerada con la build aprobada.
- Probar expresamente que HUB-01 carga el PNG esperado tras corregir `entry(m)`.

## Correcciones aplicadas en la rama de limpieza

- `ART_PACK/art_pack.js`: eliminadas las propiedades duplicadas; `file` respeta ahora `m.path`, después `m.base + m.file` y finalmente `BASE + m.file`. La versión de estado se ha unificado para incluir las tandas registradas.
- `tests/art_pack_entry.test.js`: prueba de regresión para las tres estrategias de resolución de rutas.
- `package.json`: dependencia de QA `playwright-core` fijada a `1.58.2` y comandos npm para ejecutar las pruebas.
- `.github/workflows/rebuild-active-html.yml`: incluye `chore/**` y `ART_PACK/**`; reconstruye HTML, instala Chromium, ejecuta la prueba de rutas y la regresión Playwright del flujo de inicio.
- `CINEMATIC_ASSETS/manifest.json`: no se inventaron ni generaron los seis maestros ausentes. El propio manifiesto ya los marca `PENDING_UPLOAD`; se conserva ese estado y no se consideran assets activos.

## Validación posterior pendiente

Los cambios se han guardado en la rama, pero todavía no se ha ejecutado GitHub Actions sobre el nuevo commit. La suite Playwright requiere que Actions termine. Si falla, se debe corregir antes de integrar. También siguen pendientes las pruebas de audio audible, mando físico y hardware real.

**No se modificaron el motor de juego, los sprites, los manifiestos activos de cinemática ni el contenido visual aprobado.**
