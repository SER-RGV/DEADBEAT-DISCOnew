# 14 — Exportación runtime del catálogo de armas

**Estado:** exportador añadido; ejecución pendiente en un checkout local con Chromium.  
**Script:** `tools/qa/export_weapon_catalog.js`  
**Build objetivo:** `index.html` (build publicada de la FASE 01), no `DEADBEAT_DISCO.ART.html`.

## 1. Fuente de verdad

La armería de `src/dd_ui_system.js` consume el catálogo mediante:

- `window.__DD_BRIDGE.getWeaponsList()`
- `window.__DD_BRIDGE.getWeaponStats(id)`
- `window.__DD_BRIDGE.getSnapshot()`

El exportador lee esos métodos en el navegador. No intenta deducir armas a partir de PNG ni de las claves del bundle HD.

La armería se abre con `window.DD_UI.openShop()`. El script no pulsa botones de compra/equipamiento; no invoca `buyOrEquipWeapon()`, no cambia el arma seleccionada deliberadamente y no escribe en `localStorage`.

## 2. Requisitos y ejecución

Desde la raíz del repositorio:

```bash
npm install --no-save playwright-core
python3 -m http.server 8080
```

En otra terminal:

```bash
DD_CHROMIUM=/ruta/al/chromium node tools/qa/export_weapon_catalog.js http://localhost:8080 artifacts/weapon-catalog
```

En Windows PowerShell, define la variable de entorno antes de ejecutar Node:

```powershell
$env:DD_CHROMIUM = "C:\ruta\a\chrome.exe"
node tools/qa/export_weapon_catalog.js http://localhost:8080 artifacts/weapon-catalog
```

Si Playwright ya dispone de un Chromium compatible, se puede omitir `DD_CHROMIUM`.

## 3. Archivos producidos

| Archivo | Contenido |
|---|---|
| `weapon_catalog_raw.json` | Registro original de cada arma, estadísticas devueltas por el puente, recuentos, errores de navegador y referencias visuales |
| `weapon_catalog_normalized.csv` | Una fila por registro, con estadísticas serializadas y cobertura de assets |
| `weapon_asset_coverage.json` | Cruce de IDs jugables con manifest, `__HD_DATA` y tarjetas renderizadas |
| `weapon_catalog_audit.md` | Resumen legible de recuentos y discrepancias |

## 4. Qué comprueba

- Total de registros devueltos por el motor.
- IDs únicos y duplicados.
- Tarjetas realmente creadas en la armería.
- Estadísticas que devuelve `getWeaponStats(id)`.
- Coincidencias con `DD_ASSETS.manifest.entries`.
- Coincidencias con claves HD `weapons/weapon_*.png`.
- Recursos visuales sin registro jugable y registros sin recurso asociado.

El script captura errores JS y errores de consola. Un error de navegador no debe ocultarse: se conserva en el JSON bruto.

## 5. Límites

- El exportador todavía no se ha ejecutado en un navegador local; por tanto, no se declara validado ni se publica un recuento de armas.
- El CSV conserva el objeto de estadísticas como JSON serializado; no renombra ni interpreta unidades que el motor no documente.
- La cobertura visual compara IDs por las convenciones de clave que usa `weaponImgSrc()`. Si el motor utiliza alias, deben documentarse antes de clasificar el recurso como huérfano.
- El número de tarjetas visibles puede estar limitado por la paginación/filtro visual de la armería; el recuento completo se toma de `getWeaponsList()`, no del DOM.
- El script usa un contexto de navegador nuevo. No debe ejecutarse contra una sesión del usuario con datos importantes.

## 6. Criterio de cierre

La discrepancia histórica 120/121 solo se resolverá cuando el JSON bruto confirme el número de registros y de IDs únicos. Después se podrá construir el balance desde los datos de estadísticas reales. No se modificarán valores de combate en esta fase.
