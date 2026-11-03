# Investigación: scripts residuales de Cloudflare (Fase 0.2)

**Conclusión operativa: NO SE HAN ELIMINADO.** Permanecen en `v9_t3_fase1b_cache_probe.html`, que conserva su SHA-256 `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a`.

## 1. Localización

| | Script 11 | Script 12 |
|---|---|---|
| Bloque `<script>` | nº 11 de 12 | nº 12 de 12 |
| Longitud | 1.097 caracteres | 1.097 caracteres |
| Offset en el archivo | 13.369.845 | 13.370.959 |
| Línea | 19.834 (cola del archivo) | 19.834 |
| Posición | justo antes de `</body></html>` | justo antes de `</body></html>` |
| `ray` / `__CF$cv$params.r` | `a54578e76f52d872` | `a545cfe0d8d4c69e` |
| `__CF$cv$params.t` (Base64) | `MTc5MzY0Njk3Mg==` → `1793646972` → **2026-11-02 19:16:12 UTC** | `MTc5MzY1MDUzNA==` → `1793650534` → **2026-11-02 20:15:34 UTC** |

Ambos bloques son **idénticos salvo tres sustituciones**: el valor `r`, el valor `t` y el parámetro `?ray=` de la URL. Difieren entre sí en 59 min 22 s. Las subidas del HTML a GitHub (`c6270aad` 21:12:43 UTC y `09df237` 21:14:23 UTC) son posteriores a ambas marcas.

## 2. Qué hacen exactamente (análisis estático del código)

Cada script, al ejecutarse:

1. Comprueba `document.body`; crea un `<iframe>` de 1×1 píxel, `position:absolute`, `visibility:hidden`, sin borde, y lo añade al `body`. → **2 iframes en total**.
2. Cuando el documento está listo (`DOMContentLoaded` o `onreadystatechange`, encadenando el manejador previo), obtiene `contentDocument` del iframe e inyecta en su `<head>` un `<script>` inline con `window.__CF$cv$params={r:…,t:…}`.
3. Ese script inline construye `o` a partir de `window.parent.location.origin` y solicita, mediante un `<script src>`, la URL relativa `/cdn-cgi/challenge-platform/scripts/jsd/main.js?ray=<ray>` resuelta contra dicho origen.
4. Si el origen no es válido (por ejemplo `file://`, donde `location.origin` es `"null"`), los `try/catch` dejan `o=''` y la URL relativa se resuelve contra el documento; la petición no encontrará el recurso.

**No contienen** referencias a ningún global del juego (`DMO_*`, `DDC_*`, `DDM_*`), ni acceso a canvas, ni escritura en `localStorage`, ni llamadas a la lógica de juego. Modifican el DOM (2 iframes + 2 scripts inline) y el manejador global `document.onreadystatechange` (lo encadenan, no lo sustituyen sin más).

## 3. Procedencia

**Inyección del servidor/hosting (Cloudflare Challenge Platform / JSD challenge), no código del proyecto.** Evidencias:

- La ruta `/cdn-cgi/challenge-platform/scripts/jsd/main.js` y el parámetro `window.__CF$cv$params` son propios del mecanismo de desafío de Cloudflare, que el *edge* añade al HTML servido.
- El propio archivo lo declara en comentarios internos:
  - v3.5, apartado P-1: «eliminado el script residual de Cloudflare del final del body».
  - v3.1, corrección P1: «eliminado el script residual de Cloudflare (jsd/main.js) que sobrevivía al final del body: **creaba un iframe invisible y pedía red en cada carga**».
  - Comentario junto al manifiesto: `<!-- Removed deployment-injected Cloudflare challenge loader; game remains self-contained. -->`.
  - **v8.8 (comentario duplicado dos veces)**: «eliminado: cargador de desafío Cloudflare (cdn-cgi/challenge-platform/scripts/jsd/main.js), **inyectado por el hosting; el juego no lo usa y no debe pedir red**».
- Los dos *ray IDs* y las dos marcas de tiempo distintas indican **dos capturas/descargas separadas** del HTML a través de un origen protegido por Cloudflare (~1 h de diferencia), acumulándose una inyección sobre la anterior. El nombre del archivo (`…cache_probe`) y el bloque 1 (sonda `__dmo_visor_ls_probe__` con *shim* de `localStorage`) apuntan a un proceso de captura/visor automatizado previo a la subida a GitHub.

**Lo que NO se puede determinar con la información del repositorio:** el dominio concreto que sirvió el HTML, si el desafío llegó a ejecutarse y si las dos copias proceden de la misma sesión de captura. El repo solo contiene el HTML resultante, sin logs del hosting. Esta afirmación se deja como hipótesis documentada, no como hecho probado.

## 4. Posibles efectos

| Efecto | Valoración |
|---|---|
| Peticiones de red en cada carga | 2 peticiones a `/cdn-cgi/challenge-platform/scripts/jsd/main.js?ray=…` relativo al origen que sirva la página. En GitHub Pages, en un servidor local o en `file://` no existe ese endpoint → 404 / error de red / ruido en consola. **[NO PROBADO en navegador]** |
| DOM | 2 iframes ocultos 1×1 y 2 scripts inline añadidos; pueden alterar recuentos de elementos o pruebas que inspeccionen `document.body`. **[NO PROBADO]** |
| Estado del juego | Ninguna escritura detectada en el código de los scripts. El juego no los usa, según los comentarios v8.8. **[IDENTIFICADO estáticamente; NO PROBADO en runtime]** |
| Seguridad / privacidad | Si la build se sirviera bajo un dominio con Cloudflare, el script cargado es *first-party* respecto a ese origen y podría ejecutar lógica de desafío/cookies. No se puede evaluar aquí su contenido (no está en el repo, y el acceso de red del entorno está restringido). **[NO PROBADO]** |
| CSP / CORS | Una política de contenido estricta bloquearía la inyección o generaría errores en consola. **[NO PROBADO]** |
| Rendimiento | Dos iframes y dos peticiones por carga; impacto previsiblemente mínimo, sin medición. **[NO PROBADO]** |
| Compatibilidad | El código usa `new URL(l.origin).origin`, `contentDocument` y `onreadystatechange`; bajo orígenes opacos puede lanzar excepciones capturadas. **[NO PROBADO]** |

## 5. Decisión de la Fase 0.2

- **No se eliminan, no se comentan, no se modifican.** Regla explícita de la fase y principio de no alterar la build original.
- Se registran aquí su localización, procedencia y efectos posibles.
- Se añade la observación **V-CF** al plan de validación (`VALIDATION_PLAN.md`) para medir su efecto real antes de cualquier decisión.
- Acción propuesta para una fase posterior (NO ejecutada): trabajar sobre una copia, retirar solo los dos bloques, recalcular el SHA-256, repetir la batería V-01…V-10 y comparar; registrar fecha, versión, archivos, sistemas afectados, pruebas y resultado en `CHANGELOG.md`.
- Referencia de integridad: la copia de seguridad `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` contiene estos dos scripts tal cual y permite restaurar o comparar (`BACKUP_MANIFEST.md`).
