# BOSS-T02 — puerta de rendimiento

**Resultado general: BLOQUEADO — sin GPU real accesible en este entorno.**  
**Estado de T02:** **INTEGRADO Y VERIFICADO, PERO NO CERRADO.**  
**No comenzar BOSS-T03.**

## Estados de aceptación

| Área | Estado | Evidencia |
|---|---|---|
| Integración de T02 | **APROBADO** — 16/16 checks | `../T02_browser/qa_report.json` |
| Regresión T01 | **APROBADO** — 17/17 checks | `../T01_browser/qa_report.json` |
| PNG, dimensiones y hashes | **APROBADO** — 10/10 | `ART_ASSETS/bosses/tanda_02/manifest.json`; hashes y dimensiones revalidados |
| Revisión visual en gameplay | **APROBADO** | `captures/` y `../T02_browser/state_dispatch/` |
| Prueba comparativa de rendimiento en GPU real | **BLOQUEADO** — 0 pasadas válidas | `environment.json`, `comparison.json` |
| FPS/frame times en GPU real, variabilidad y memoria de GPU | **NO VERIFICADO** | Requiere host con GPU física y matriz emparejada repetida |

## Diagnóstico de disponibilidad de GPU

Se verificó el entorno el 2026-11-03. El contenedor es un invitado KVM Linux con 2 vCPU visibles. No existe `/dev/dri`; `nvidia-smi`, `lspci`, `glxinfo`, `vulkaninfo` y `eglinfo` no están instalados. La prueba WebGL de Chromium reportó:

`ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`

Los argumentos del navegador incluyen explícitamente `--use-angle=swiftshader` y `--enable-unsafe-swiftshader`. Por tanto, **no se ejecutó ni se simula una comparación T01/T02 con GPU real**. No hay repetición por configuración ni análisis de variabilidad; tampoco se creó un gráfico de frame time, porque no existe una serie emparejada válida.

Configuración observada: Chromium Headless 153.0.8010.0, viewport 1440×1000, DPR 1. La configuración de CPU, memoria y renderer está en `environment.json`.

## Datos diagnósticos no válidos para el gate de GPU

Los resultados antiguos de SwiftShader se conservaron sin convertirlos en comparativa:

- T01: 1,7 FPS; media 589,8 ms; P95 800 ms; máximo 31.215,5 ms. 239 intervalos. Un solo run.
- T02: 1,7 FPS; media 576,57 ms; P95 833,4 ms; máximo 23.649,1 ms. 89 intervalos. Un solo run.
- Esas pasadas usaron scripts, cantidad de muestras y preparación de escena diferentes. No atribuir la diferencia ni los outliers a los assets; no comparar esos valores contra una futura GPU real.
- Copias intactas: `raw_noncomparable/`. Resumen formal: `comparison.json`.

Un sondeo separado de carga en el mismo entorno software confirma 10/10 imágenes completas, `Image.decode()` resuelto para todas y 0 recursos pendientes al observarlas. La promesa de `decode()` se midió después de que las imágenes ya estaban completas; sus 36 ms **no** son coste inicial de decodificación. Resource Timing arrojó 140–175,6 ms por solicitud T02, pero `transferSize` y tamaños de cuerpo no están expuestos en esas entradas; el payload comprimido del manifiesto es 3.254.718 bytes. Heap JS observado: 31,2 MB; no equivale a memoria GPU. Detalle: `resource_loading_swiftshader.json`.

El sondeo tuvo 0 errores de página y 0 respuestas fallidas locales; mostró 2 errores genéricos de consola tipo 404 sin URL capturada en esa sonda. No se atribuyen a T02 sin identificar el recurso. El QA de integración T02 y la regresión T01 continuaron sin errores de página ni respuestas locales fallidas.

La métrica anterior es el tiempo del loop de frames del juego ejecutado en SwiftShader: mezcla lógica, dibujo software y scheduling. No permite aislar coste de renderizado, coste de carga de imágenes o coste de gameplay. No se ha hecho optimización especulativa ni se ha modificado ningún asset o código de juego.

## Evidencias visuales

`captures/` contiene copias de capturas de gameplay ya revisadas (ataque Boss 05, muerte Boss 05, ataque Boss 07). No son capturas de una pasada de rendimiento. Las 12 capturas de estado de QA siguen en `../T02_browser/state_dispatch/`.

## Próximo paso requerido

Ejecutar T01/T02 en una máquina con aceleración de hardware y repetir varias pasadas por configuración, manteniendo el mismo navegador, GPU, resolución, cámara, sala, número de entidades, efectos, calentamiento y ventana de medición. Registrar FPS, media, P95/P99, memoria disponible, carga/decodificación de recursos, errores, y los datos brutos para variabilidad. Separar el coste de renderizado de carga y lógica con trazas/probes controlados. Solo entonces generar las gráficas comparativas y reevaluar el cierre.

## Paquete externo preparado (sin ejecutar)

Se prepararon el runbook Windows/Linux, el harness fail-closed, el contrato SHA-256 del snapshot, la validación de precondiciones A/B y los artefactos honestos de no-run. No se ejecutó ninguna matriz de rendimiento con GPU real. Véase `../../T02_EXTERNAL_GPU_RUNBOOK.md` y `external_gpu/README.md`. La precondición de escena/filtro en SwiftShader no es evidencia de rendimiento.

**Conclusión:** la integración y la regresión permanecen aprobadas. El gate de rendimiento no puede cerrarse aquí; T02 se conserva **INTEGRADO Y VERIFICADO, PERO NO CERRADO**.
