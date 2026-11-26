# Informe de entrega — Fase 0.2: estabilización y preparación del repositorio

- Fecha: 2026-11-02 (Europe/Madrid).
- Repositorio: `SER-RGV/DEADBEAT_DISCO`.
- Regla de partida aplicada: **la copia de seguridad se creó y se registró en Git antes de cualquier otra modificación**.
- La build `v9_t3_fase1b_cache_probe.html` **no se ha modificado**: sigue con SHA-256 `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a`.
- **No se ha avanzado a generación de assets.**

---

## 1. Archivos modificados y creados

| Archivo | Acción | Detalle |
|---|---|---|
| `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` | **CREADO** | Copia byte a byte del HTML original (13.380.910 bytes). |
| `BACKUP_MANIFEST.md` | **CREADO** | Hash, tamaño, procedencia y regla de inmutabilidad de la copia. |
| `CHANGELOG.md` | **RENOMBRADO** desde `HANGELOG.md` | `git mv`; Git detecta renombrado al **100 %**. Contenido idéntico: blob `5cc5a8b74bae17e193e4efd2e611b70b66b17357`, SHA-256 `6ad2c5733d71c9743f31d8f48de9a4167b7cf5b7a94a694052e002641f702b2c`. No se le ha añadido ni quitado una línea. |
| `README.md` | **AMPLIADO** | 16 B → 3.986 B. Información real del repo, build, estado de verificación y reglas; sin características inventadas. |
| `PROJECT_INVENTORY.md` | **CREADO** | Inventario técnico con separación explícita identificado / declarado / no probado. |
| `VALIDATION_PLAN.md` | **CREADO** | Plan de 10 pruebas + observación transversal V-CF; todas pendientes. |
| `CLOUDFLARE_SCRIPTS.md` | **CREADO** | Investigación de los dos scripts residuales, sin eliminarlos. |
| `FASE_0_2_REPORT.md` | **CREADO** | Este informe. |
| `v9_t3_fase1b_cache_probe.html` | **SIN CAMBIOS** | No sustituido, no simplificado, sin eliminación de sistemas, sin regeneración de assets, sin cambios de mecánicas ni contratos. |
| `CURRENT_STATE.md` | **SIN CAMBIOS** | Se conserva tal cual. |

## 2. Rama utilizada

- Rama de trabajo: **`arena/b89cd6bc-deadbeat-disco`**, creada a partir de `main` en `09df237d5f98de7aee8b0499648610acdf1bae71`.
- **`main` no se ha modificado**: `origin/main` sigue en `09df237`. No se han hecho commits ni pushes a `main`.
- Permisos verificados (`gh api`): `push/admin/maintain = true`. La rama de trabajo se publica en `origin/arena/b89cd6bc-deadbeat-disco` al cierre de la fase.

## 3. Copia de seguridad y hash

| Campo | Valor |
|---|---|
| Copia | `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` |
| **SHA-256** | **`b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a`** |
| Tamaño / líneas | 13.380.910 bytes / 19.835 |
| Verificación | `cmp` idéntico; el SHA-256 coincide con el del original y con el del blob Git `dcc4cce0ffac2037ae4cb2f8fa94d8b31b47c197` de `main` |
| Original | No sobrescrito; hash sin cambios tras la fase |
| Commit de la copia | `9d08b469fa630c8d132475b50a955284a83fcc33` (primero de la fase) |

## 4. Inventario técnico

Documento completo: `PROJECT_INVENTORY.md`. Resumen de lo **identificado estáticamente**:

- 12 bloques `<script>` (10 ejecutables que compilan, 1 bloque `text/plain` de licencia, 1 manifiesto `application/json` válido), 31 bloques `<style>`, 4 `<canvas>` (`game`, `minimap`, `menu-canvas54`, `ddc-fx`), 8 `<meta>`, 269 atributos `id=`.
- **300** URIs Base64, todas decodificables: 181 PNG, 118 WebP, 1 TTF (8.178.730 bytes binarios). Bundles: `__T3B_IMAGES` (10), `__ILT_DATA` (11), `__HD_DATA` (163), `DDM_V5_ASSET_DATA` (111), más 5 en CSS.
- Fuente Pixelify Sans con licencia SIL OFL 1.1 embebida.
- Guardado: 54 referencias `localStorage` / 4 `sessionStorage`; claves `dmo_hub_v1`, `dmo_progression_v87*`, `dmodisco_*`, `ddc_cover_settings_v1`, sonda `__dmo_visor_ls_probe__`.
- Sistemas por globales `window.*`: `DMO_HUB`, `DMO_FLOOR*`, `DMO_DUNGEON`, `DMO_MUSIC`, `DMO_PROG`, `DMO_CINE`/`DMO_STORY`, `DMO_ATMOS`, `DDC_COVER`, `DMO_BOOT46`, `DMO_ILT`, `DMO_V88`, `DDM_*`, tablas de animación.
- Dependencias de juego: **ninguna externa** (0 `fetch`/XHR/`import`/Worker/WebSocket/`@import`/`<link>`). Solo APIs de navegador (Canvas 2D, WebAudio, rAF, Gamepad, `localStorage`). Excepción: los 2 cargadores Cloudflare.
- Marcas `[IDENTIFICADO]`, `[DECLARADO]` y `[NO PROBADO]` usadas de forma sistemática; sección 10 separa explícitamente ambos grupos.

## 5. Informe de problemas

| # | Problema | Impacto | Estado |
|---|---|---|---|
| I-1 | `CHANGELOG.md` no existía: el archivo se llamaba `HANGELOG.md` (el commit `0c20572e` dice «Create CHANGELOG.md» pero creó el nombre erróneo) | Documentación | **Corregido** por renombrado con contenido intacto |
| I-2 | `README.md` era solo un título de 16 bytes | Documentación | **Corregido** con información constatada |
| I-3 | Dos cargadores Cloudflare residuales (ray `a54578e7…` y `a545cfe0…`) al final del `body`, pese a comentarios v3.1/v3.5/v8.8 que afirman haberlos eliminado | Peticiones de red e iframes ocultos en cada carga; contradicción documental | **Investigado, NO eliminado** (regla de la fase); observación V-CF pendiente |
| I-4 | Versionado incoherente: 120 vs 121 armas; `version=8.6.0-dungeon` frente a módulos v8.7/v8.8/v9.2; nombre `v9_t3_fase1b_cache_probe` sin etiqueta interna equivalente | Trazabilidad | **Documentado**, sin resolver (requiere decisión del proyecto) |
| I-5 | El repositorio solo contiene 4 archivos; los comentarios citan builds y documentos ausentes (`uploads/…v8_6…html`, `CHANGELOG_V8_4_ART.md`, `INFORME_D1`, `*_MUSIC_DIRECTION.md`) | No se puede reconstruir el histórico técnico desde el repo | **Documentado** |
| I-6 | Monolito de 13,38 MB con una línea de 4.587.678 caracteres | Diffs y revisión manual poco prácticos | **Documentado**; mitigado con copia de seguridad |
| I-7 | Sin `LICENSE`, `.gitignore`, tests, CI/workflows, releases ni manifiesto de dependencias | Preparación del repo | **Documentado**; no se han añadido por no estar en el alcance de la fase |
| I-8 | Clon Git *shallow* (1 de 6 commits); consulta de protección de rama `403` con el token de integración | Historial local parcial; no se pueden inspeccionar reglas de protección | **Documentado**; no afecta al push en la rama de trabajo |
| I-9 | Sin navegador ni librerías de automatización en el entorno | Impide ejecutar la validación en esta fase | **Documentado**; plan preparado, 0 pruebas ejecutadas |
| I-10 | `CURRENT_STATE.md` declara pendientes dependencias externas, integridad de sistemas, funcionamiento completo y compatibilidad | Riesgo funcional no evaluado | **Sigue pendiente**; no se declara nada superado |

## 6. Pruebas ejecutadas y pendientes

### Ejecutadas (comprobaciones estáticas/de integridad de archivo — **no** son pruebas de navegador)

| Comprobación | Resultado |
|---|---|
| `cmp` original ↔ copia de seguridad | Idénticos byte a byte |
| SHA-256 de original, copia y blob Git de `main` | Los tres coinciden |
| Lectura completa y decodificación UTF-8 de 13.380.910 bytes | Correcta, sin NUL, cierre `</html>` presente |
| Recorrido completo del HTML con `HTMLParser` | Sin errores: 31/31 `<style>`, 12/12 `<script>`, 4 `<canvas>` |
| Compilación de los 10 bloques JS ejecutables (`vm.Script`, Node 22) | Sin errores de sintaxis |
| Validación del manifiesto `application/json` | JSON válido |
| Decodificación estricta de 300 URIs Base64 | 300/300 correctas |
| Igualdad de contenido `HANGELOG.md` ↔ `CHANGELOG.md` | Blob Git idéntico; Git detecta renombrado 100 % |
| Integridad del HTML tras la fase | SHA-256 sin cambios |
| Estado del worktree al cierre | Limpio |

### Pendientes (plan en `VALIDATION_PLAN.md`)

| ID | Prueba | Estado |
|---|---|---|
| V-01 | Inicio del juego | PENDIENTE |
| V-02 | Carga de assets | PENDIENTE |
| V-03 | Canvas | PENDIENTE |
| V-04 | Movimiento | PENDIENTE |
| V-05 | Combate | PENDIENTE |
| V-06 | Generación de habitaciones | PENDIENTE |
| V-07 | Transiciones | PENDIENTE |
| V-08 | Guardado y recuperación | PENDIENTE |
| V-09 | Audio | PENDIENTE |
| V-10 | Gamepad | PENDIENTE |
| V-CF | Efecto real de los scripts Cloudflare | PENDIENTE |

**Pruebas de navegador ejecutadas: 0. Pruebas de navegador superadas: 0. Pendientes: 11.** No se declara ninguna prueba superada sin ejecutarla.

## 7. Commits realizados

| # | Hash | Contenido |
|---|---|---|
| 1 | `9d08b469fa630c8d132475b50a955284a83fcc33` | Copia de seguridad idéntica del HTML + `BACKUP_MANIFEST.md` con SHA-256 (ejecutado **antes** de cualquier otra modificación). |
| 2 | `d6675c6e2849e36b814dc02e07fdc801d7772a2e` | Renombrado `HANGELOG.md` → `CHANGELOG.md` (100 %), ampliación de `README.md`, creación de `PROJECT_INVENTORY.md`, `VALIDATION_PLAN.md` y `CLOUDFLARE_SCRIPTS.md`. |
| 3 | Este commit | Ajuste de precisión en `README.md` e informe de entrega `FASE_0_2_REPORT.md`. Su hash se indica en la respuesta de entrega y puede consultarse con `git log -1`. |

### Registro de cambios en el formato de la plantilla de `CHANGELOG.md`

- **Fecha:** 2026-11-02.
- **Versión:** Fase 0.2 (estabilización; la build del juego sigue siendo `v9_t3_fase1b_cache_probe.html` sin cambios).
- **Archivos modificados:** `HANGELOG.md` → `CHANGELOG.md` (solo nombre), `README.md`.
- **Archivos creados:** `BACKUP_MANIFEST.md`, `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html`, `PROJECT_INVENTORY.md`, `VALIDATION_PLAN.md`, `CLOUDFLARE_SCRIPTS.md`, `FASE_0_2_REPORT.md`.
- **Sistemas afectados:** **ninguno**. No se ha tocado el HTML: cero cambios en sistemas, mecánicas, contratos, assets o módulos.
- **Pruebas realizadas:** comprobaciones estáticas e integridad (tabla anterior); 0 pruebas de navegador.
- **Resultado:** repositorio estabilizado y build protegida; funcionalidad del juego **sin validar**.

> Nota: este registro se deja aquí y en los commits en lugar de añadirse a `CHANGELOG.md` porque la tarea 1 exige **conservar íntegramente su contenido** durante el renombrado. A partir de la siguiente modificación se usará la plantilla del propio `CHANGELOG.md`.
