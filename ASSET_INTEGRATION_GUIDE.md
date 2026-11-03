# GUÍA DE INTEGRACIÓN DE ASSETS — DEADBEAT DISCO

> Cómo conectar un recurso nuevo **sin crear gestores nuevos y sin tocar mecánicas**.
> Implementación de referencia: `ART_PACK/art_pack.js` (Tanda 01). Preparación: `ART_TOOLS/prepare_tanda_01.py`.

## 1. Build activa

| Archivo | Rol |
|---|---|
| `v9_t3_fase1b_cache_probe.html` | **Original intacto**, SHA-256 `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` |
| `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` | Backup, mismo hash |
| `DEADBEAT_DISCO.ART.html` | **Build activa** = copia byte-idéntica del original + 118 B: un comentario y `<script src="ART_PACK/art_pack.js"></script>` antes del `</body>` real. 13.381.028 B, SHA-256 `f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723` |

Para regenerar la build activa de forma reproducible (solo si se pierde; **no** es necesario ahora):

```python
s = open('v9_t3_fase1b_cache_probe.html', encoding='utf-8').read()
head, tail = s.rsplit('</body>', 1)          # OJO: hay otro </body> dentro de un string de Cloudflare
out = head + '\n<!-- Fase 1 · Tanda 01 -->\n<script src="ART_PACK/art_pack.js"></script>\n</body>' + tail
open('DEADBEAT_DISCO.ART.html','w',encoding='utf-8').write(out)
```

Servidor: `python3 -m http.server 8123 --bind 0.0.0.0 --directory /home/user/DEADBEAT_DISCO`. Las rutas del paquete son relativas a la raíz; funcionan tanto en el preview como en local.

## 2. Los cuatro registros del motor (no inventar otros)

| Registro | Definido en | Loader existente | Cómo se sustituye | Verificación |
|---|---|---|---|---|
| `window.__T3B_IMAGES[0..9]` | script propio | `window.__T3B.reload(i, delay)` → `new Image()`, `api.images[i]`, `api.ready[i]`, `invalidate()`; consumo por `window.__DDM_PAINT_MATERIAL(ctx, idx, …)` | Asignar la URL al índice y llamar `reload(i, 0)`. **Activar antes** `window.__T3B.setEnabled(true)` (flag visual desactivado por ser *cache probe*) | `api.ready[i]`, `api.draws` con `choice:'candidate'` y `src` del asset, captura del suelo |
| `window.__DDM_V5_IMG[key]` | `DDM_V5_ASSET_DATA` → `new Image()` en bucle (`DMO_REF`) | `window.__DDM_GET_V5(key)` exige `complete && naturalWidth>0`; muchos consumidores leen directamente `__DDM_V5_IMG[key]` | `window.__DDM_V5_IMG[key] = imagenCargada` | `DMO_REFERENCE_ROOM_ASSETS.state().v5Ready`, captura HUB/sala |
| `window.DMO_ILT.images/ready/meta[key]` | `window.__ILT_DATA` → `DMO_ILT` | `ILT.art(key)` comprueba `ready[key]` y `img.complete && img.naturalWidth`; `SPRITE_MAP` / `BOSS_MAP` | Sustituir los tres: `images[key]`, `ready[key]=true`, `meta[key]={w,h,aspect}` | `DMO_ILT.audit()`, aparición del jefe/enemigo |
| `window.__HD_DATA[key]` | script propio | `window.__HD_GET(key)` con cache `__HD_EXTRA`; `hdImages` en `ensureHdImg`; `<img>` en arsenal; `Pf` para el jugador | `window.__HD_DATA[key] = url` **y** `window.__HD_EXTRA[key] = imagenCargada` (para invalidar la cache) | miniatura del arsenal, `hasSprite` |

**Prohibido:** crear un segundo `ImageLoader`, un `Map` paralelo de assets, un `fetch`/`import()` nuevo, o modificar las funciones de dibujo del motor.

## 3. Contrato que debe cumplir el asset

- **ID:** exactamente la clave que el motor ya usa (o el índice del array). No renombrar.
- **Dimensiones:** exactamente las del recurso original. Razones: el patrón T3B usa `%512`, `ILT.meta.aspect` se calcula de `naturalWidth/Height`, y las miniaturas HD tienen tamaño fijo.
- **Formato:** PNG o WebP que decodifique en Chromium. Los suelos son RGB opaco (un tile con alpha crearía huecos); props/personajes/armas son RGBA con alpha real.
- **Pivote:** `bottom-center` (personajes, props con apoyo), `center` (emblemas, armas, iconos), `tile` (materiales).
- **Fondo:** negro puro solo en la fuente generada; el PNG final debe tener alpha 0 en el fondo. Sin halos blancos, sin restos, sin sombras horneadas.
- **Bordes:** recorte al bounding box del contenido, sin cortar siluetas, con antialias suave del contorno.

### Preparación reproducible

`ART_TOOLS/prepare_tanda_01.py` implementa: inundación desde el borde sobre píxeles con `max(R,G,B) ≤ umbral` (conserva los negros **interiores** del objeto), eliminación de bolsas negras cerradas grandes (p. ej. el interior de un halo), desenfoque 0,6 px del canal alfa, recorte y escalado LANCZOS a las dimensiones destino con el pivote indicado. Umbral por asset (10 por defecto, 45 para el emblema por su glow). Las fuentes se conservan en `_source/`.

## 4. Arranque del paquete

`art_pack.js` es el último script del `<body>`. Espera con `setTimeout(…, 50)` hasta que existan los 4 registros (máx. ~10 s) y entonces, para cada asset, crea un `Image`, verifica `naturalWidth/Height` contra lo esperado y aplica el loader correspondiente. Expone:

```js
window.DMO_ART_PACK.state()      // estado, errores, por asset: applied/loaded/exactSize/natural
window.DMO_ART_PACK.integrity()  // vuelve a LEER los registros vivos y comprueba URL/Image/dimensiones
window.DMO_ART_PACK.manifest()   // lista de especificaciones
```

`integrity()` es la prueba de integración: no basta con que el archivo exista; comprueba que el registro del motor apunta al recurso nuevo y que está decodificado con las dimensiones correctas.

## 5. Cambio de código mínimo y su justificación

| Cambio | Justificación | Impacto |
|---|---|---|
| +1 `<script>` en la build activa | Única forma de cargar el paquete sin tocar el HTML original | Ninguno en lógica |
| `__T3B.setEnabled(true)` | El pintor candidato de materiales venía **desactivado** de fábrica (`cache probe`). Sin este flag, `__DDM_PAINT_MATERIAL` llama siempre al pintor procedural `original` y los materiales nuevos son invisibles | Solo visual; `setEnabled()` llama a `invalidate()` del módulo de arte |
| `__HD_EXTRA[key] = img` | `__HD_GET` cachea el `Image` antiguo; sin invalidarlo, la miniatura seguiría mostrando el recurso previo | Solo cache de imágenes |

**No se modifica:** movimiento, combate, disparo, habilidades, IA, Director, jefes, progresión, generación de salas, puertas, transiciones, inventario, armas, mejoras, puntuación, guardado, audio, controles, mando, HUD ni los 2 scripts Cloudflare.

## 6. Validación (comandos reales)

```bash
# servidor
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html

# validación antes/después, HUB -> campaña r0 -> regresión
QA_LIB=/home/user/qa_tools/lib timeout 900 node ART_TOOLS/qa/validate_tanda_01.js
REVERSE=1 QA_LIB=/home/user/qa_tools/lib timeout 900 node ART_TOOLS/qa/validate_tanda_01.js  # orden invertido
```

- **No pasar `ROOM_CAPTURE=1`**: activa `__T3B.roomCapture()` (`toDataURL` de un canvas grande), que tarda ~47,5 s con texturas detalladas en SwiftShader y **no representa el rendimiento del juego**.
- Las capturas se toman con `Page.captureScreenshot` por CDP (`shot()` de `/home/user/qa_tools/lib.js`); `page.screenshot` falla por animación continua.
- Métricas: `DMO.testStats().shotsFired` + entradas instrumentadas en `wa` (proyectiles **del jugador**). `bulletsCount`/`balas` = `Ia` (proyectiles **enemigos**), no usar para validar disparo.
- Entorno sin GUI: no hay pruebas manuales con display; todo es Chromium headless 153 con SwiftShader.
