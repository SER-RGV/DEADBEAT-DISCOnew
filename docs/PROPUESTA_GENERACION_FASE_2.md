# Fase 2 — propuesta de generación de salas

2026-11-26. Estado: **propuesta aprobada por el usuario; fase 3 en curso, población 2.1.0 integrada experimentalmente bajo flag; incremento 1 aún incompleto**. Línea base, metodología, comandos y limitaciones: [diagnóstico](DIAGNOSTICO_GENERACION_BASELINE.md). Fase 0 cerrada tras lectura; fase 1 cerrada como diagnóstico acotado, sin convertir sus aspectos no verificados en aprobados.

## Principios y compatibilidad

Cada incremento propuesto cabe en un PR revisable y se ejecutaría en orden. Los flags siguientes son nombres propuestos, por defecto `false`, configurados antes de construir un plan y no cambiados a mitad de incursión. Su disponibilidad efectiva en el runtime y en QA se comprobará antes de implementar; no se afirma que existan. Con todos apagados se exige comparación de los resultados y comportamiento con la versión previa y hashes/diffs de los artefactos pertinentes, excluyendo únicamente metadatos no deterministas documentados. Los builds se producen solo con `tools/build_active_html.py`, sin edición manual. Antes de cada incremento se documentan SHA-256 y copia/restore verificable de los archivos afectados; no se eliminan backups históricos.

Si un cambio altera el resultado de una seed, se incrementará `VERSION` desde 2.0.0 y se conservará el generador anterior seleccionable por versión. Antes de aplicar cambios se definirá y probará la migración de partidas existentes: identificar versión guardada, tratar guardados sin versión explícita como antiguos solo después de verificar su formato, y mantener la reconstrucción anterior para no reinterpretar semillas. Si no es posible recuperar una incursión activa, se indicará explícitamente y se preservarán los datos compatibles; no se promete reanudación inexistente. Nada usa `Math.random`.

## Incrementos propuestos

| Orden / problema medido | Mejora y archivos previstos | Flag reversible | Impacto / coste / riesgo | Métrica y prueba de aceptación propuesta |
|---|---|---|---|---|
| 1. Dos formas: 108.000/108.000 geometrías del plan y prefab difieren literalmente; no demuestra divergencia visual/física. | Definir el perímetro compilado de catálogo como fuente para validación, puertas, colisión y debug cuando hay prefab; conservar excepción piloto `r0`. Investigar adaptador y orden real antes de tocarlo. `src/room_generation/{playable,validate,debug,prefabs}.js`, `src/dd_prefab_world.js`, `tools/room_generation_migration.py` si procede. | `window.__DD_UNIFIED_ROOM_GEOMETRY` | Alto / alto / alto: validación y estados guardados. | Comparar coordenadas de perímetro/socket usadas por compilación, colisión y render; 0 huecos sin pareja, 0 puertas inalcanzables en barrido geométrico 10×1.000 y recorrido físico automatizado con alcance declarado; pruebas `prefab_reach.cjs`, `room_generation_live.cjs` y QA nueva. Una muestra física no certifica todas las seeds. |
| 2. Cada piso ordinario tiene 1 ciclo; el jefe no siempre dispone de escalada y 2.132 élites carecen de respiro cercano según proxy. | Añadir enlaces y reglas deterministas al grafo en los diez pisos, incluido un rediseño multisalón del piso 9; preservar conectividad sin secretos y definir una ruta principal verificable y una secuencia de dificultad de tipos antes del jefe. `src/room_generation/{floor,validate,seed}.js` y QA. | `window.__DD_ROOM_TOPOLOGY_V3` | Alto / alto / alto: progresión y migración. | En todos los pisos 0–9: ≥2 ciclos independientes, camino crítico accesible sin secretos, y distancia mínima no dirigida élite→respiro/recompensa ≤2; además probar una ruta jugable que efectivamente los visite y escalada definida antes del jefe. Medir grado medio y acordar su objetivo antes de usarlo como umbral. 10×1.000, determinismo y `prefab_progression.cjs`. La selección de entrada, transición al jefe y final de partida del piso 9 se verificará en runtime. |
| 3. Siete tipos tienen un único prefab; 7.472/9.000 pisos ordinarios repiten firma prefab+puertas. | Ampliar catálogo y asignación determinista con diversidad por piso, incluyendo una firma canónica de silueta y sockets; no confiar solo en IDs distintos. `src/room_generation/prefabs/catalog.json`, `prefabs.js`, `playable.js`, renderer y QA si es necesario. | `window.__DD_ROOM_VARIANTS_V3` | Alto / alto / alto: combinatoria de puertas, arte y colisión. | ≥2 variantes viables por tipo y ningún par por piso con la misma silueta canónica y configuración de puertas; definir tratamiento de rotaciones, ascensores, piloto y tipos únicos antes de medir. Barrido 10×1.000, prefab QA, puertas, spawns y capturas. Confirmar factibilidad combinatoria antes de crear variantes. |
| 4. En pisos 0–8 la selección de formas no depende del círculo; no se ha medido composición final. | Añadir perfiles deterministas de selección, composición y densidad compatibles con el arte existente. `src/room_generation/{floor,prefabs,population}.js`, catálogo y, solo si hace falta, `src/dd_world_renderer.js`. No renombrar HUD ni atribuir lore no confirmado. | `window.__DD_CIRCLE_ROOM_PROFILES` | Alto / medio-alto / medio-alto: legibilidad y repetición. | Definir y registrar para cada uno de los nueve pisos ordinarios distribuciones de siluetas, composición y densidad; demostrar diferencias cuantificadas por par de perfiles y revisar capturas por círculo y tipo. Acordar umbrales de separación antes de marcar éxito; no confundir cambios de color con diferencias espaciales. |
| 5. Hay propuestas de spawn bloqueadas en el proxy y faltan pruebas completas de persistencia y rendimiento A/B. | Reforzar validación de posiciones contra geometría final y ampliar arneses de regresión; no afirmar que esas propuestas sean spawns defectuosos. `src/room_generation/population.js`, adaptador solo si es necesario, `tools/qa/`. | `window.__DD_ROOM_SPAWN_GUARDS` para cambios de juego; pruebas sin flag | Medio-alto / medio / medio: densidad efectiva y coste. | 0 spawns efectivos en sólidos/huecos ni rutas críticas bloqueadas en alcance ejercitado; persistencia de visita, despeje y objetos realmente soportados; 10×1.000 sin errores/mapas inválidos. Comparar tiempos, frames, heap y asignaciones A/B con mismas seeds y entorno. |

Las rutas son previsiones, no una afirmación de que todas deban cambiar. Cada incremento deberá mostrar evidencia antes/después, copia/restore, flags apagados, y criterios de aceptación; actualizar `CURRENT_STATE.md`, `CHANGELOG.md` y el informe. Con la aprobación explícita ya recibida, se prepararán commits atómicos y un PR borrador desde la rama activa cuando haya un incremento verificable, sin fusionar.

## Diseño de variantes y contrato de arte

No se proponen todavía nombres de prefabs ni assets concretos: sería inventar disponibilidad sin un inventario por diseño. **Antes de implementar cada prefab**, su ficha debe listar IDs y rutas exactos existentes en `DD_ASSETS` o el catálogo vigente, assets faltantes, geometría, lados/socket admitidos, huellas, pivotes y forma de integración. Si falta un recurso, no se presupone que existe: se especificará su creación o una alternativa existente para aprobación. Mantener tiles de 512, pivotes, paleta por círculo, registro `DD_ASSETS` y croma verde `#00ff00` para assets oscuros; no crear otro canvas, loader ni cámara, ni cambiar IDs, carpetas técnicas o textos HUD.

## QA transversal y límites

Antes de cada PR: pruebas existentes relevantes y `node tools/qa/room_generation_baseline.cjs 1000`, adaptado para ambos modos; determinismo, conectividad sin secretos, ciclos, firma de silueta/puertas, coherencia de perímetro y colisión, accesibilidad de puertas, spawns y persistencia. Capturas A/B por círculo y tipo si hay navegador. Registrar comandos, seeds, versión, entorno, resultados y fallos. Comparar tiempo de generación y frame time, memoria y asignaciones con baseline equivalente; ninguna regresión ni nuevas asignaciones por frame es una condición a verificar mediante instrumentación adecuada, no una conclusión de la muestra actual. GPU real, mando, audio, otros navegadores y campaña larga permanecerán **NO VERIFICADOS** salvo prueba específica. El menú tuvo un fallo de recursos no reproducido y no se declara estable.

## Piso 9: decisión y diseño propuesto

El usuario ha decidido **incluir el piso 9 en el requisito de al menos dos ciclos**. La línea base de una sola sala de jefe no lo permite: la propuesta sustituye esa estructura, únicamente en el modo nuevo, por varias salas conectadas y una sala de jefe terminal. Es un cambio de diseño de progresión, no un resultado ya medido.

Prototipo topológico a validar: dos cuadrados adyacentes que comparten un lado (seis salas y siete enlaces), más una sala terminal de jefe conectada por un enlace a una sala del núcleo: siete salas, ocho enlaces y rango cíclico `E − V + 1 = 2`. Inicio y jefe serán distintos; los ciclos deben seguir disponibles sin atravesar salas secretas ni la sala de jefe. La disposición, tipos de salas, entrada, bloqueo y transición final se concretarán y probarán antes de implementarla. No se presume que el flujo actual acepte ese diseño.

**Riesgo observado:** `floor.js` y `rooms.js` asignan actualmente el índice 99 a todas las salas del piso 9, y `validate.js` exige exactamente una sala. El modo nuevo necesita IDs únicos y adaptación explícita de estas suposiciones, además de auditar consumidores, entrada desde el piso 8, derrota del jefe, guardado y reconstrucción. El generador antiguo y sus partidas conservan la estructura anterior con el flag apagado o versión histórica. Pruebas propuestas: 1.000 seeds del piso 9 dentro del barrido 10×1.000, conexiones recíprocas y dos ciclos sin secretos, acceso a jefe, transición 8→9, combate/final y guardado/reconstrucción; distinguir pruebas asistidas de una campaña real.

El usuario aprobó la fase 2; se inicia la fase 3. La inclusión del piso 9 queda incorporada al alcance, pero aún no está implementada.


## Inicio de fase 3 — comprobación previa del incremento 1

Antes de cambiar el generador se ejecutó `node tools/qa/room_generation_compiled_validation.cjs 1000 > docs/DIAGNOSTICO_SALAS_EVIDENCIA/validacion-geometria-compilada.json`. En 10.000 mapas, el validador actual aplicado sin cambios a la geometría compilada rechazó 9.000 por `unsafe point`; pasaron 1.000. Se mantiene la geometría piloto del Hangar. El validador termina en el primer error de cada mapa: no se conoce el total de puntos rechazados ni si cada rechazo corresponde a un fallo físico. Esta incompatibilidad impide sustituir el perímetro sin adaptar la comprobación y la población; en ese momento aún no se había modificado el juego. Script SHA-256 `6a3cfb3dc9e679f4322f6086bd72950a02e3b9a6e5ad2563d0a3f1d9368bd9f9`; JSON SHA-256 `c76fbb807eec5e388f7484f5852583e0e70dc905ad1abfcad517d056ac43c679`.

## Validación y población compiladas: implementación experimental

`src/room_generation/population_compiled.js` se integró experimentalmente en `tools/room_generation_migration.py`, solo para el modo de población 2.1.0. Esto no completa la unificación de toda la geometría ni sustituye el validador original del plan. La validación experimental usa pertenencia a polígono y distancia a segmentos (en vez de semiplanos convexos), huellas sólidas del catálogo y exclusión circular conservadora alrededor de puertas. Reubica candidatos de spawn no seguros en la posición segura más cercana de una rejilla fija y comprueba la recompensa en offsets −80, 0 y +80 px; conserva propuestas de props, que no se instalan para salas prefab. El Hangar piloto se excluye.

| Prueba | Resultado / límite |
|---|---|
| `node tools/qa/room_generation_population_compiled.cjs 1000` | 10.000 mapas, 108.000 salas y 864.000 candidatos; 54.455 candidatos reubicados, 0 recompensas reubicadas, sin excepciones. Compara dos ejecuciones y verifica que no se muten las propuestas; comprueba los resultados con el mismo predicado utilizado por el adaptador, no es una prueba independiente. |
| `node tools/qa/room_generation.cjs` | PASS: 1.030 mapas, comportamiento previo. |
| `node tools/qa/prefab_floors.cjs` | PASS: 654 instancias, 60 pisos, corredores de catálogo. |

El conteo de reubicaciones incluye el criterio adicional de proximidad a puertas y no es comparable directamente con los 28.236 candidatos bloqueados del proxy anterior. Los tres offsets de recompensa son una muestra, no una garantía sobre todos los objetos que pueda producir el motor. La comprobación nativa independiente de dos seeds se describe abajo; no verifica todas las seeds, enemigos móviles, accesibilidad o ausencia de solapamiento entre candidatos. El filtro nativo sigue siendo obligatorio. Faltan análisis de memoria y frame time A/B y cobertura física más amplia. El barrido de 10×1.000 de este arnés tarda ~29–33 s en este entorno e incluye repetición del adaptador y aserciones; no es tiempo de generación del juego.

SHA-256 de la versión previa del adaptador `7bfb71abe8ce9ddfd73cc036ef83a94f2bcf3edd0ac24782130235a0f6910696`; arnés `9260b038cee74bb538f6c28795bcb2848b3d343b9eff3b0cd4bcb24a7d3be6ea`; evidencia `f1a6f431005469b06c3daa4d4f6c2d9fbf9495ca6d667889a91388e2ba3497e5`. Se conservan informes y backups históricos; procedimiento de reversión abajo.


## Integración experimental 2.1.0 y contraste con el motor

La selección se fija al cargar la página. Sin guardado previo, `window.__DD_ROOM_SPAWN_GUARDS === true` antes del script de arranque selecciona 2.1.0; por defecto selecciona 2.0.0. Un guardado `dmo_floor_v32` válido con versión tiene prioridad sobre el flag para evitar reinterpretarlo: 2.1.0 permanece seleccionada aunque se quite el flag; un guardado sin versión se trata como 2.0.0 y bloquea la activación experimental para esa sesión. Las versiones desconocidas se rechazan. Para seleccionar el modo experimental se necesita un perfil de prueba sin ese guardado o uno ya marcado 2.1.0; no borrar datos reales sin consentimiento. Se conserva `generate(seed,floor,"2.0.0")` y el generador previo intacto; el guardado nuevo registra `generatorVersion`. Esto verifica el marcador y la reconstrucción asistida, **no** acredita reanudación de una incursión activa, que no está establecida en el juego.

Los builds de aquella integración se regeneraron con `python3 tools/build_active_html.py`; ambos tenían SHA-256 `ea6f6b13d46f0288f6ca20e71105abd32479075d166a4a2bb808d6d5ac46f678`. Tras las pruebas solo se corrigió un comentario del adaptador y se reconstruyeron los builds; no se repitieron las pruebas por ese cambio no ejecutable. La prueba con flag apagado y perfil vacío comparó JSON de 10.000 planes del HTML anterior y nuevo: ambos SHA-256 `cdabf7c55fef010c677898a9b24ef0980ac4762c7b846012183959f6f1ae70f7`; no significa que los HTML sean idénticos. La selección explícita 2.0.0 produce el mismo hash. En presencia de guardado 2.1.0, la prioridad de compatibilidad es una excepción explícita a la selección predeterminada por flag apagado.

| Prueba ejecutada | Resultado y límites |
|---|---|
| `room_generation_population_native.cjs` con flag activo, Chromium headless, seeds 0 y 1 | 216 salas, 1.728 candidatos: 0 fuera del perímetro nativo y 0 bloqueados por `DMO.layout.pointBlocked` con radio 36; 0 de 648 offsets de recompensa bloqueados. Navegación por debug; no verifica `roomCast`, combate natural o todas las seeds. Evidencia `poblacion-native-integrada.json`. |
| Prototipo inyectado previamente en navegador | Primer contraste detectó dos candidatos bloqueados por rectángulos nativos. `ec()` expande cada semieje por el radio, no redondea esquinas; se ajustó el predicado y se repitió el barrido y prueba nativa. |
| `DD_POPULATION_GUARDS=1 node tools/qa/prefab_progression.cjs ...` | PASS nueve descensos asistidos por despeje/salto debug y reconstrucción de diez pisos tras recarga; no campaña jugada. |
| `room_generation_population_version.cjs ... 1000` | PASS hash de 10.000 planes legacy; modo nuevo y prioridad de marcador/sin versión. No prueba recuperación de partida activa. |
| `room_generation_live.cjs` sin flag | PASS seeds 0 y 4294967295 en su alcance original. |
| `room_generation_population_perf.cjs` | Chromium headless, 1.000 muestras intercaladas por modo y 20 calentamientos: media/p95 2.0.0 = 0,224/0,300 ms; 2.1.0 = 1,948/6,700 ms. Medición de generación, no frames. **Hay regresión de tiempo de generación**, por lo que el modo sigue experimental y apagado por defecto; memoria y frame time A/B no verificados. |

Los comandos de navegador requieren `NODE_PATH=/tmp/dd-qa-browser/node_modules LD_LIBRARY_PATH=/tmp/dd-qa-browser/al/lib DD_CHROMIUM=/tmp/chromium` y un servidor HTTP; `/tmp` es efímero. Las pruebas nuevas se encuentran en `tools/qa/room_generation_population_{native,version,perf}.cjs`; los JSON y logs están en `docs/DIAGNOSTICO_SALAS_EVIDENCIA/`.

**Reversión:** `sha256sum -c backups/room_population_20261126/SHA256SUMS`; restaurar `tools/room_generation_migration.py` y `tools/qa/prefab_progression.cjs` desde sus copias homónimas de esa carpeta, ejecutar `python3 tools/build_active_html.py` y comprobar que ambos builds tengan SHA-256 `44cc3c3f761cd6b95431a78bffbad169437c57f68bb551c19c3cf71e620337dc`. Las copias originales de ambos builds se conservan también para cotejo. La restauración del código no debe reinterpretar guardados 2.1.0; realizarla solo en un perfil de prueba o tras resolver el tratamiento de esos guardados. No se borra ningún backup ni evidencia.


## Fase 3 en curso: optimización y límites de topología

Se optimizó la búsqueda del adaptador 2.1.0 dando prioridad a una cota cercana y verificando después toda la rejilla con el mismo desempate. Solo se conserva una tabla inmutable pequeña de coordenadas; no se instala ninguna función por frame ni se modifica la salida. `node tools/qa/room_generation_population_cache.cjs 1000` comparó contra la copia de la versión previa: **108.000 poblaciones idénticas** (SHA-256 concatenado `e0d4bff810d95565320e4f50932df45d8ee6225818e9841b3feda6686975be25`). La validación propia del adaptador volvió a pasar 864.000 candidatos y la prueba nativa volvió a pasar 1.728 candidatos en 216 salas, seeds 0 y 1. El hash legacy de 10.000 planes volvió a coincidir. `room_generation.cjs` y `prefab_floors.cjs` pasan. Los builds actuales tienen SHA-256 `f7f84d7b05a2d6d52e033bd13ce8e4bc77b09c1e01ac595bdb9f4952defcf421`.

| Medición experimental, Chromium headless | Original 2.1.0 | Búsqueda optimizada 2.1.0 | Límite |
|---|---:|---:|---|
| Generación secuencial, media / p95, 1.000 mapas | 2,162 / 6,800 ms | 1,666 / 7,400 ms | La media bajó en esta muestra; el p95 subió. No demuestra ausencia de regresión. |
| Heap usado, delta tras GC en esa muestra | +539.212 B | +534.864 B | Incluye actividad de la aplicación; no es pico ni prueba de fuga. |
| Frames r1, seed 0, enemigos detenidos, 240 intervalos, media / p95 | 30,90 / 33,40 ms | 30,62 / 33,40 ms | GL por software; una sala y seed. Sin GPU real ni combate. |
| Muestreo CDP en esos frames | 59.608 B | 126.388 B | Aproximación sujeta a muestreo; **no acredita cero asignaciones nuevas por frame**. |

El A/B 2.0.0 vs 2.1.0 optimizada sigue mostrando mayor coste de generación (media 0,283 vs 1,529 ms; p95 0,400 vs 6,900 ms). Se probó y descartó una caché de rejillas: su muestra retuvo más heap; la implementación actual no conserva esa caché. Una primera medición concurrente sufrió contención y un test de versión agotó su espera; ambos se repitieron en serie y el test pasó. Las mediciones y sus scripts están en `docs/DIAGNOSTICO_SALAS_EVIDENCIA/poblacion-{busqueda-ab,frames-ab,tiempo-optimizada,native-optimizada,version-optimizada}.json` y `tools/qa/room_generation_population_{cache_ab,frames_ab,perf,native,version}.cjs`. No se declara rendimiento global aprobado.

**Dos ciclos aún pendientes:** `node tools/qa/room_generation_topology_feasibility.cjs 1000` encontró un enlace adicional entre salas existentes obligatorias no-jefe en 6.268/9.000 pisos ordinarios; en 2.732 no había candidato bajo esa regla. No bastaría añadir una conexión sin rediseñar el grafo. En el piso 9 actual solo hay jefe. Además, el motor observado `Xe` limita los niveles a 100 y trata ≥100 como piso 9; `Je` mapea ese nivel a local 0, y `kg` entra por `r99`. Son dependencias concretas a adaptar y probar para poder tener varias salas con identidades distintas en piso 9 sin confundir progresión, colisión y persistencia. El diagnóstico no prueba que sean imposibles los dos ciclos, solo que requieren más cambios.

La fase 3 **no está completa**: faltan implementación y QA de topología de los diez pisos, ritmo, prefabs y perfiles de círculo; geometría única completa, pruebas de puertas/recorridos y validación de rendimiento y persistencia. No se ha abierto PR ni declarado aprobados esos objetivos. Copia previa a esta optimización y SHA-256: `backups/room_population_perf_20261126/`; restaurar el archivo `population_compiled.js` desde esa carpeta y reconstruir con `python3 tools/build_active_html.py`. Comprobar `sha256sum -c backups/room_population_perf_20261126/SHA256SUMS` y que los builds restaurados coincidan con `ea6f6b13d46f0288f6ca20e71105abd32479075d166a4a2bb808d6d5ac46f678`.


## Prototipo topológico: dos ciclos en los diez índices — estado anterior a la integración

En la prueba original `src/room_generation/topology_v3.js` era un generador **offline, no integrado en builds**; ese estado y los IDs indicados en esta sección son históricos y fueron sustituidos por la integración 2.2.0 descrita más abajo. Usa streams deterministas, dos cuadrados adyacentes y una rama de jefe; los pisos 0–8 seleccionan entre cuatro incidencias etiquetadas de hojas opcionales y las transforman mediante rotación/reflexión. Para piso 9 genera ocho salas, con `r99` como entrada y un jefe terminal separado. Estos IDs son una hipótesis de prototipo, no un contrato ya compatible con el motor. La secuencia mínima medida bajo la búsqueda del arnés es inicio → combate → desafío → élite → jefe; se propone como definición operativa de escalada de tipos, no garantiza percepción ni combate real. Cada élite tiene descanso/recompensa a ≤2 saltos no dirigidos, sin garantizar que se visite.

| Comando | Resultado | Límites |
|---|---|---|
| `node tools/qa/room_generation_topology_v3.cjs 1000` | 10.000 mapas deterministas, **2 ciclos por mapa**, también después de excluir secretos, tienda y jefe; 115.000 prefabs compilados, 1.000 Hangar excluidos. Grado medio 2,167 en pisos 0–8 y 2,250 en piso 9. Cuatro firmas etiquetadas por piso 0–8 y una en el piso 9. | El validador legacy se ejecuta en pisos 0–8; no admite la cardinalidad nueva del piso 9. Las firmas no prueban variedad perceptible; el esqueleto crítico es fijo. |
| `node tools/qa/room_generation_topology_reach.cjs 1000` | 51 combinaciones prefab/puertas, 100 desembarcos alcanzados en rejilla de 25 unidades y radio 16; 69.656/69.660 puntos libres conectados. | Proxy de catálogo, no física nativa, no cubre mobiliario escénico, actores, tránsito continuo ni Hangar. |

El motor actual usa `vg` para asignar `Wo = index + 1`; `_e(Wo)` identifica al jefe final exclusivamente con `Wo === 100`. Por tanto, asignar `r99` a la entrada y otros índices al jefe **no es seguro sin modificar y probar las decisiones de encuentro final**, además de `Xe`, `Je`, entrada `kg`, guardado y puerta final. En ese momento no se activó el prototipo: sus IDs habrían podido iniciar el jefe en la entrada o impedir el encuentro final. La integración posterior conserva el nivel 100 para el jefe, como se explica abajo. Falta implementar versionado/flag y migración para una topología real, probar físicamente el piso 9, diseñar variedad de prefabs/perfiles, ejecutar QA completo y medir rendimiento. La fase 3 continúa incompleta.

Reproducibilidad: SHA-256 del prototipo `00ed8536a69257200d126406fa0fed7fed75cca95aa1355a8080b19d4217cc7b`, arnés `68196e7f6c5a8292f0283e5408e32cce68b9685d5a4ca5f2cc51432f4179f498`, evidencia de grafo `cecbf0784f05794fcb0a99aaa359dbbce53538f2e6a5db42500e02fb34a9885e`. En ese momento eran archivos nuevos sin conexión al build; la copia histórica del prototipo se conserva en `backups/room_topology_engine_20261126/topology_v3.js`. Se conservan todas las evidencias y backups.


## Integración experimental de topología 2.2.0, progresión y guardado

Se integró el modo **2.2.0** bajo `window.__DD_ROOM_TOPOLOGY_V3`, por defecto apagado y capturado al iniciar la página. Incluye la adaptación de población 2.1.0 y mantiene versiones 2.0.0 y 2.1.0. Un guardado con versión prevalece sobre el flag: 2.2.0 se regenera como 2.2.0 incluso si el flag está apagado; un guardado v1 sin versión permanece en 2.0.0. No se debe borrar un guardado para cambiar de modo sin consentimiento.

En el piso 9 se asigna `r100` como entrada y `r99` como jefe final, preservando `Wo === 100` para el jefe. Las otras salas usan índices propios 100–106. La entrada de `kg()` cambia solo para 2.2.0 y las dos condiciones de recompensa que trataban cualquier `Wo >= 100` como jefe se restringen al jefe final en ese modo. El chequeo de victoria 2.2.0 requiere completar las salas obligatorias de los diez pisos sin obligar a visitar secretos o tienda, en vez de exigir 99 rondas; las versiones anteriores conservan el chequeo original. La cartografía 2.2.0 guarda las ocho celdas del núcleo, sus enlaces, entrada y jefe; el núcleo legacy sigue vacío. Hay validación lógica de identidades, puertas recíprocas, conectividad, ciclos del núcleo sin secretos/jefe y cercanía a recompensa. Los nuevos grafos no significan que los criterios de variedad espacial o percepción estén completados.

| Prueba | Resultado / alcance |
|---|---|
| `node tools/qa/room_generation_topology_v3.cjs 1000` | 10.000 grafos, dos ciclos sin secretos ni jefe en todos, 115.000 salas prefab compiladas y 1.000 Hangar excluidos; experimento de grafo, no campaña. |
| `node tools/qa/room_generation_topology_reach.cjs 1000` | 51 configuraciones de prefab/puertas, 100 desembarcos con camino en rejilla de catálogo; no física nativa. |
| `DD_TOPOLOGY_V3=1 node tools/qa/prefab_reach.cjs ...` | Chromium seed 0: 115 salas, 257 salidas alcanzables por muestreo de rejilla y comprobaciones nativas; no prueba todas las seeds ni tránsito natural. |
| `DD_TOPOLOGY_V3=1 node tools/qa/prefab_progression.cjs ...` | Nueve descensos asistidos por `goto`/`clear`, llegada a `r100` sin jefe activo y reconstrucción de diez pisos tras recarga. |
| `node tools/qa/room_generation_topology_live.cjs ...` | Seed 0: siete salas no-jefe del núcleo no disparan un jefe; puerta de `r99` cerrada antes y abierta tras despejar, cruce con debug, jefe final real activado con debug. Guarda ocho celdas y enlaces; seed, versión 2.2.0, grafo y cartografía reconstruidos idénticos tras recarga e inicio de otra incursión. No prueba reanudar una incursión activa. |
| `node tools/qa/room_generation_topology_victory.cjs ...` | Tras 88 rondas registradas mediante teletransporte y despejes debug, la condición de obligatorias pasó y se alcanzó la rama real de victoria tras forzar jefe, quitar oleadas y elegir la oferta final. El perfil es **tainted**; no demuestra campaña natural ni victoria no marcada/persistida. La condición era falsa al inicio. |
| `room_generation_topology_version.cjs ... 1000` | En la build anterior al ajuste final de cartografía/victoria: 10.000 planes 2.0.0 y 2.1.0 idénticos a la copia previa, y 10.000 planes 2.2.0 deterministas. Tras los ajustes finales se repitió con 1.000 planes y pasó; también se probaron prioridad de guardados sin versión, 2.1.0 y 2.2.0. |
| `room_generation_live.cjs`, `room_generation.cjs`, `prefab_floors.cjs` | PASS en su alcance original con modo legacy. |
| `room_generation_topology_perf.cjs ...` | Headless, 1.000 muestras/version: medias 2.0/2.1/2.2 = 0,240/1,183/1,415 ms; p95 = 0,300/4,100/5,300 ms. **Regresión de tiempo de generación**, no frame time. |

Los ensayos con navegador usaron Node y Chromium headless temporales fuera del repositorio, con `NODE_PATH=/tmp/dd-qa-browser/node_modules LD_LIBRARY_PATH=/tmp/dd-qa-browser/al/lib DD_CHROMIUM=/tmp/chromium` y servidor HTTP. Resultados y errores de intentos intermedios están en `docs/DIAGNOSTICO_SALAS_EVIDENCIA/topologia-*.log/json`. La prueba de victoria inicialmente encontró un supuesto incorrecto de numeración de piso y después una oferta modal pendiente; se corrigió el arnés y se conservan los límites del uso de debug. No se verificaron campaña natural, victoria no tainted, recuperación de estado de incursión, GPU física, mando ni audio.

Builds generados con `python3 tools/build_active_html.py`; SHA-256 de ambos `d9c3aab6db9a0c77ea6e77e1c778a29bbfbe2338278d7084ffc35e5c9f81cfb0`. Copias previas y manifiesto verificado: `backups/room_topology_engine_20261126/`. Para revertir este incremento, restaurar `tools/room_generation_migration.py`, `src/room_generation/topology_v3.js`, `tools/qa/prefab_progression.cjs` y `tools/qa/prefab_reach.cjs` desde esa carpeta, reconstruir y verificar SHA-256 `f7f84d7b05a2d6d52e033bd13ce8e4bc77b09c1e01ac595bdb9f4952defcf421`. Ejecutar antes `sha256sum -c backups/room_topology_engine_20261126/SHA256SUMS`. El motor previo no reconoce guardados 2.2.0: no revertir sobre datos reales 2.2.0 sin estrategia de migración o copia; no se borran datos ni backups.

La fase 3 continúa incompleta: faltan variedad de prefabs y perfiles por círculo, fuente única de geometría completa y QA/performance A/B más amplios. No se ha abierto PR ni se han declarado aprobados esos objetivos.

## Incremento experimental 2.3.0: geometría publicada

El flag `window.__DD_UNIFIED_ROOM_GEOMETRY=true` selecciona 2.3.0 al iniciar; por defecto sigue 2.0.0. La versión del guardado prevalece sobre cualquier flag. Sobre 2.2.0 se publica la geometría compilada del prefab en el plan, tras adaptar población; Hangar queda excluido. La geometría entregada al motor es una copia superficial para evitar que los metadatos de círculo muten el plan. No se han añadido prefabs ni assets.

| Comprobación | Medición y límite |
|---|---|
| `room_generation_unified_version.cjs ... 1000` | 10.000 mapas, 115.000 salas, 1.000 Hangar excluidos; cero discrepancias plan/compilado y cero cambios adicionales de nodos frente a 2.2. La repetición final, tras corregir la copia, cubrió 1.000 mapas y comprobó que guardados 2.2 y 2.3 prevalecen sobre el flag. |
| `room_generation_unified_native.cjs`, `DD_UNIFIED_GEOMETRY=1 prefab_reach.cjs` | Seed 0: 115 salas, 257 puertas y 920 spawns comprobados puntualmente; 257 salidas alcanzables en rejilla. No acredita movimiento continuo ni todas las seeds. |
| `DD_UNIFIED_GEOMETRY=1 prefab_progression.cjs` y `room_generation_topology_live.cjs` | Nueve descensos asistidos y reconstrucción tras reload; guardado del núcleo y grafo PASS. No acredita campaña natural ni reanudación de incursión activa. El primer intento de guardado falló por mutación de la geometría; se corrigió y se conserva el log inicial. |
| `room_generation_topology_perf.cjs` | Chromium headless, 1.000 muestras por versión: media/p95 en ms 2.0: 0,285/0,400; 2.1: 1,298/4,000; 2.2: 1,564/5,400; 2.3: 1,663/6,600. Generación y bind, no frame time. Hay regresión frente a 2.0. |

Evidencias `docs/DIAGNOSTICO_SALAS_EVIDENCIA/geometria-unificada-*`. La inspección de archivos encontró vistas intactas ausentes: pasillo-servicio `panel-N-intacto.png`, `sofa-S-intacto.png`; arena-octogono `mesa-S-intacto.png`, `sofa-N-intacto.png`, `mesa-W-intacto.png`; camarote `monitor-W-intacto.png`, `sofa-N-intacto.png`. El renderer recurre a representación nativa si falta un sprite; no se han comprobado visualmente ni completado sombras y variantes rotas. No se ha inventado arte ni sustituido vistas por otras orientaciones.

Builds mediante `python3 tools/build_active_html.py`; ambos SHA-256 `83eb5abf961a500b630877c258a5c8f4ac43455709989e31be4b9a26f00a80f4`. Para revertir el incremento: comprobar `sha256sum -c backups/room_unified_geometry_20261126/SHA256SUMS`, restaurar desde esa carpeta los archivos correspondientes y reconstruir con el script; verificar ambos builds con SHA-256 `d9c3aab6db9a0c77ea6e77e1c778a29bbfbe2338278d7084ffc35e5c9f81cfb0`. Apagar el flag solo revierte nuevas partidas sin marcador; un guardado 2.3 mantiene 2.3 y el código anterior no garantiza reconocerlo. Respaldar datos y diseñar migración antes de revertir con guardados reales; no borrarlos.

**Fase 3 no completada ni aprobada:** faltan al menos dos variantes por tipo, unicidad de silueta/puertas, diferenciación demostrada de los nueve círculos, validación visual, recorrido y combate naturales, y QA/performance completo. Los 10×1000 cubren generación/plan, no todas las condiciones físicas ni render. La regresión de generación impide habilitar el modo experimental por defecto.

## Seguimiento: variedad y ensayo de rendimiento

Se añadió `node tools/qa/room_generation_variety_audit.cjs 1000`: sobre el enlace 2.2/2.3, canonicaliza cada polígono del catálogo en unidades de mundo bajo rotaciones de 90°, reflexión, inversión y cambio de primer vértice, conjuntamente con orientación de puertas y distinción ascensor/puerta. No considera los destinos, mobiliario ni percepción visual; excluye el Hangar piloto. En 10.000 mapas, **7.516** contienen al menos una firma repetida entre las salas medidas. Por piso, repeticiones en 693/1000 (0), 861 (1), 871 (2), 852 (3), 849 (4), 836 (5), 852 (6), 842 (7), 860 (8), 0 (9); el piso 9 no incluye Hangar pero esto no demuestra variedad por tipo. El resultado y distribución por tipo están en `docs/DIAGNOSTICO_SALAS_EVIDENCIA/variedad-siluetas-23.json`. Solo una plantilla aparece para challenge, rest, boss, secret, supersecret, shop y special en esa muestra. Es un criterio más estricto que comparar IDs, pero no comprueba arte girado ni accesibilidad.

Se ensayó una poda por filas en la búsqueda de población sin cambiar el resultado: `room_generation_population_cache.cjs 1000 backups/room_population_rows_20261126/population_compiled.js` comparó 108.000 poblaciones iguales al código anterior. Sin embargo, A/B secuencial Chromium 2.1 de 1.000 muestras por variante dio media/p95 anterior 2,114/8,7 ms frente a ensayo 2,694/9,5 ms; medición ruidosa de generación/bind, no frames. **No se ha adoptado la optimización** y se ha reconstruido el código original; los dos builds recuperaron SHA-256 `83eb5abf961a500b630877c258a5c8f4ac43455709989e31be4b9a26f00a80f4`. Se conserva backup verificado `backups/room_population_rows_20261126/` y evidencia `poblacion-filas-*`. El arnés de igualdad permite elegir copia previa como tercer argumento; el A/B permite elegir HTML previo como segundo argumento tras la URL. Una ejecución de compatibilidad durante el ensayo cubrió 1.000 mapas; no convierte el ensayo descartado en solución del rendimiento.

El criterio de variedad sigue incumplido. Hay que diseñar e integrar variantes reales, validar sus assets existentes y colisiones y repetir el barrido, la inspección visual y el A/B; este diagnóstico no completa fase 3.

## Precalcular geometría de población por llamada

Se conserva una optimización sin cambiar la selección de puntos: `adaptPopulationCompiled` y su validación preparan por llamada los segmentos y senos/cosenos de colliders sólidos, reutilizándolos durante las comprobaciones. No hay caché global persistente ni se modifica el bucle de frame. El predicado público sin preparación sigue aceptando los mismos argumentos. Se mantiene el orden de operaciones y desempate de la búsqueda. El cambio no pretende resolver el coste de compilación de prefabs ni las condiciones pendientes de variedad.

| Comprobación | Resultado y alcance |
|---|---|
| `room_generation_population_cache.cjs 1000 backups/room_population_precompute_20261126/population_compiled.js` | 10.000 mapas legacy, 108.000 poblaciones idénticas al código anterior. |
| Mismo comando con cuarto argumento `topology` | 10.000 mapas topológicos 2.2/2.3, 115.000 poblaciones idénticas, Hangar excluido. Comparación del adaptador, no movimiento físico. |
| `room_generation_precompute_version.cjs ... 100` | 1.000 planes por versión 2.0–2.3 idénticos al build previo; flag apagado selecciona 2.0. Una ejecución de 1.000 seeds por piso superó el límite de 180 s sin resultado y **no se cuenta como PASS**. |
| `room_generation_unified_native.cjs`, `DD_UNIFIED_GEOMETRY=1 prefab_reach.cjs` | Seed 0: 115 salas, 257 puertas, 920 puntos de spawn y rejilla de acceso PASS; no prueba campaña natural ni todas las seeds. |
| `DD_UNIFIED_GEOMETRY=1 prefab_progression.cjs`, `room_generation.cjs`, `prefab_floors.cjs` | PASS en sus alcances: nueve descensos asistidos, 1.030 mapas legacy y 654 instancias respectivamente. |
| `room_generation_population_cache_ab.cjs ... backups/room_population_precompute_20261126/index.html` | 2.1 headless, 1.000 muestras secuenciales por variante: media/p95 anterior 2,608/9,9 ms, nuevo 1,667/7,0 ms. Muestra dependiente de máquina, orden y actividad del navegador; no prueba frame time ni memoria total. |
| `room_generation_topology_perf.cjs` | Nuevo build, 1.000 muestras por versión: 2.0 media/p95 0,304/0,4 ms; 2.3 1,686/6,2 ms. Sigue existiendo regresión de generación frente a 2.0. |

Evidencias `docs/DIAGNOSTICO_SALAS_EVIDENCIA/poblacion-precalculo-*`. Build producido exclusivamente con `python3 tools/build_active_html.py`, ambos SHA-256 `6bdceff062338aefc70b4a4fc307a0a403f69abfb6269bb1e2f090b3d6302a1b`. Para revertir, verificar `sha256sum -c backups/room_population_precompute_20261126/SHA256SUMS`, restaurar `population_compiled.js` desde ese backup a `src/room_generation/`, reconstruir y verificar ambos builds SHA-256 `83eb5abf961a500b630877c258a5c8f4ac43455709989e31be4b9a26f00a80f4`. No se altera el formato de guardado ni se eliminan datos.

**Fase 3 continúa incompleta:** faltan nuevas variantes y sus assets/colisiones, unicidad de siluetas y puertas, diferenciación demostrada de círculos, capturas y QA de campaña natural; los ensayos no prueban ausencia de regresión general de frames, memoria o generación.

## Variantes proporcionales experimentales 2.4.0

Implementadas en `src/room_generation/prefab_variants.js`, con `window.__DD_ROOM_VARIANTS_V3=true` antes del arranque; por defecto se mantiene 2.0.0 y la versión guardada prevalece. 2.4 deriva cada prefab compilado de una de las cinco plantillas existentes, estirando su eje X en un factor `1 + 0,012 × (2 × local + bit)`, donde el bit es determinista por seed/piso/sala. Los 24 slots producen factores entre 1 y 1,276; la asignación por `local` impide compartir factor dentro del piso, mientras el bit proporciona al menos dos proporciones por rol entre seeds. Perímetro, sockets y tarima se recalculan; mobiliario, collider, pivote, vista, elevación y arte siguen la plantilla. No se giran bitmaps, ni se crean sprites, ni se altera el Hangar piloto. El conjunto de plantillas derivadas se crea bajo demanda y se conserva en el catálogo en memoria, como máximo 24 por plantilla base; no es una asignación por frame. 2.4 publica geometría compilada y reutiliza la adaptación de población.

**Límite importante:** son variantes de proporciones de cinco diseños existentes, no siluetas artísticamente diseñadas de cero. Diferencias sucesivas pueden ser sutiles; no se ha demostrado que se perciban como habitaciones distintas. El test normaliza escala uniforme, giro/reflexión y orden/sentido del polígono, pero acepta diferencias de proporción; no evalúa percepción, composición ni Hangar. Por ello la unicidad matemática del barrido **no cierra** el criterio de variedad visual ni el de todas las salas incluido Hangar.

| Comprobación | Resultado / alcance |
|---|---|
| `node tools/qa/room_generation_variety_audit.cjs 1000 variants` | 10.000 mapas, cero firmas silueta/puertas repetidas entre salas compiladas, Hangar excluido; al menos dos IDs de proporción por tipo entre seeds. No prueba dos composiciones artísticas distintas por tipo. |
| `node tools/qa/room_generation_variants.cjs 1000` | 10.000 mapas, 115.000 salas, 920.000 candidatos, 1.000 Hangar excluidos, determinismo y coherencia plan/compilado; adaptación y validación comparten predicado. |
| `node tools/qa/room_generation_topology_reach.cjs 1000 variants` | 276 configuraciones de plantilla/puertas, 624 desembarcos alcanzados, rejilla paso 25 y radio 16; 401.518/401.577 puntos libres conectados. No demuestra tránsito continuo, actores o Hangar. |
| `DD_ROOM_VARIANTS=1 room_generation_unified_native.cjs` y `prefab_reach.cjs` | Seed 0 en navegador: 115 salas, 257 puertas, 920 puntos de spawn; puertas alcanzables en rejilla. No cubre todas las seeds ni combate. |
| `DD_ROOM_VARIANTS=1 prefab_progression.cjs`, `room_generation_topology_live.cjs` | Nueve descensos asistidos, núcleo con puerta de jefe y grafo/guardado reconstruidos tras reload; jefe forzado con debug. No prueba partida natural ni reanudación activa. |
| `room_generation_variants_version.cjs ... 100` | 1.000 planes por versión 2.0–2.3 iguales al build previo; 2.4 determinista en el mismo alcance; guardados 2.3 y 2.4 prevalecen sobre flag. |
| `room_generation_topology_perf.cjs` | Headless 1.000 muestras/version: 2.0 media/p95 0,266/0,300 ms; 2.3 1,373/5,700; 2.4 1,317/4,400. Sigue la regresión frente a 2.0; no mide frames ni memoria. |

### Recursos heredados y faltantes

Inventario completo de cada petición sprite, ruta exacta, existencia y pivote: `docs/DIAGNOSTICO_SALAS_EVIDENCIA/variantes-assets-24.json`, generado por `tools/qa/room_generation_variant_assets.cjs`. Las variantes comparten los mismos recursos que su base, sin IDs de arte nuevos. Los nombres que siguen son relativos a `assets/prefabs/club/`:

| Base | Vistas usadas | Archivos de vista o sombra faltantes |
|---|---|---|
| nave-quebrada | monitor-S, panel-E, mesa-N, sofa-W | Ninguno de los estados y sombras solicitados. |
| palco-profundo | monitor-S, panel-E, puesto-N, sofa-W | Ninguno de los estados y sombras solicitados. |
| pasillo-servicio | monitor-S, panel-N, mesa-N, sofa-S | `panel-N-intacto{,-sombra}.png`; `sofa-S-{intacto,roto}{,-sombra}.png`. |
| arena-octogono | monitor-S, panel-E, mesa-S, sofa-N, mesa-W | `{mesa-S,sofa-N,mesa-W}-{intacto,roto}{,-sombra}.png`. |
| camarote | monitor-W, panel-E, puesto-N, sofa-N | `monitor-W-intacto{,-sombra}.png`; `sofa-N-{intacto,roto}{,-sombra}.png`. |

Las llaves de la tabla denotan las combinaciones literales enumeradas en el JSON. Faltan también los pivotes correspondientes cuando se señala en el inventario. El renderer usa representación nativa si falta la imagen; no se han fabricado vistas de otra orientación ni inspeccionado visualmente las variantes. Materiales de suelo y carcasa permanecen inalterados.

Backups verificados con `sha256sum -c backups/room_variants_20261126/SHA256SUMS`. Para revertir: restaurar `tools/room_generation_migration.py` y los arneses respaldados desde esa carpeta, retirar del build el módulo nuevo restaurando la migración (se puede conservar `src/room_generation/prefab_variants.js`), ejecutar `python3 tools/build_active_html.py` y verificar ambos builds SHA-256 `6bdceff062338aefc70b4a4fc307a0a403f69abfb6269bb1e2f090b3d6302a1b`. Desactivar el flag solo afecta partidas sin marcador; el código anterior no reconoce guardados 2.4. Respaldar datos y establecer migración antes de revertirlos, nunca borrarlos. Build actual: ambos SHA-256 `ede03023444f2c69a4dd98c47b1e35eaaa2d9409d034193e4a17572e58e8d9bd`.

## Comprobación visual y vistas direccionales

### Perceptibilidad de las proporciones 2.4

Se capturaron dos pares en Chromium headless, 1280×800, con misma base de prefab, rol y lados de puerta. Se usa navegación debug, semillas distintas y no se iguala el estado de animación ni los destinos de las puertas:

| Par | Datos medidos | Observación visual |
|---|---|---|
| Entrada `r11`, semillas 1 y 2 | Pasillo-servicio, slots 0 y 1, anchos 1720 y 1740,64, altura 700; +1,2 % | La diferencia de proporción es **prácticamente imperceptible** en estas capturas. `docs/DIAGNOSTICO_SALAS_EVIDENCIA/variantes-visuales/{a,b}.png`. |
| Desafío `r13`, semillas 12 y 13 | Pasillo-servicio, slots 4 y 5, anchos 1802,56 y 1823,2, altura 700; +1,15 % relativo | También resulta **prácticamente imperceptible** en esta muestra; sí cambian animaciones y rótulos ajenos a la forma. `docs/DIAGNOSTICO_SALAS_EVIDENCIA/variantes-visuales-desafio/{a,b}.png`. |

Las capturas de entrada se tomaron antes de añadir vistas faltantes; las posteriores al arte están en `variantes-visuales-direccionales/`. Esto es una inspección de dos pares, no un estudio con jugadores ni una prueba de cada base, círculo o extremo de proporción. **La unicidad de firmas de 2.4 no demuestra variedad perceptible**, y no se considera cumplido ese criterio. `tools/qa/room_variants_visual.cjs` registra semillas, geometría y lados en `metadata.json`.

### Mobiliario: 10 vistas y 10 sombras

Se añadieron vistas cardinales propias, sin girar ni reflejar el bitmap existente: `panel-N-intacto`, `monitor-W-intacto`, `sofa-N-{intacto,roto}`, `sofa-S-{intacto,roto}`, `mesa-S-{intacto,roto}` y `mesa-W-{intacto,roto}`. Cada una incluye su PNG y `-sombra.png` en `assets/prefabs/club/`. Se heredan las sombras elípticas neutras y dimensiones/pivotes de la misma clase y estado; los estados rotos tienen dibujo propio bajo, sin colisiones nuevas. Dibujados proceduralmente mediante `tools/prefabs/directional-furniture.py`, siguiendo la paleta y formato del generador existente `furniture-art.py`, no con generación de imágenes ni sprites girados. Se dibuja directamente en RGBA transparente como el lote existente, sin extracción por croma ni verde visible: no se ha usado un fondo verde `#00ff00` como intermedio. No se modifica ningún tile de 512.

Los 10 pivotes se añadieron a `assets/prefabs/club/pivots.json`, que es el registro que ya usa el cargador `DD_PREFAB_WORLD` para este lote. **No se han registrado en `DD_ASSETS`**: los sprites de `assets/prefabs/club` existentes usan ese registro específico de pivotes y su cargador, no el manifiesto general. No se ha añadido otro cargador ni cambiado IDs existentes. El arte afecta también a versiones previas, que antes caían en representación nativa cuando faltaba la vista; no es una equivalencia visual con los flags apagados.

| Comprobación | Resultado y límite |
|---|---|
| `room_generation_variant_assets.cjs` | Ninguna ruta/pivote ausente en las vistas solicitadas por las cinco bases, incluyendo estados rotos y sombras. Inventario `variantes-assets-direccionales.json`. |
| `PYTHONPATH=/tmp/dd-pillow python3 tools/qa/room_directional_art_assets.py` | 10 sprites con dimensiones y pivotes iguales a sus referencias, canal alfa transparente, píxeles no vacíos y sin verde visible. No aprueba calidad artística. |
| `room_directional_art.cjs` | En Chromium seed 0, el cargador y renderer reales dibujaron las 10 vistas solicitadas, incluidos estados rotos, con píxeles visibles; cero errores de página o respuestas fallidas de assets de prefab observados. No demuestra rotura mediante combate natural ni calidad en todos los círculos. |
| `room_generation.cjs`, `prefab_floors.cjs` | PASS en sus alcances previos: 1.030 mapas y 654 instancias. |

El primer intento del arnés de render agotó la espera porque la sala piloto Hangar no activa el cargador de prefabs; tras entrar en una sala prefab el arnés pasó. No se ha ejecutado un estudio de legibilidad en GPU real ni en todos los círculos. Pillow se instaló temporalmente fuera del repo para el generador y QA, igual que requiere el generador de mobiliario existente; no se añadió dependencia al juego.

Reversión: comprobar `sha256sum -c backups/room_directional_art_20261126/SHA256SUMS`, respaldar cualquier edición posterior, restaurar `assets/prefabs/club/pivots.json` desde esa carpeta y reconstruir con `python3 tools/build_active_html.py`. Los nuevos PNG quedan inertes sin sus pivotes y pueden conservarse; no borrar capturas ni backups. El build previo debe recuperar SHA-256 `ede03023444f2c69a4dd98c47b1e35eaaa2d9409d034193e4a17572e58e8d9bd`. Build actual, ambos HTML: `95a3401de46a68fd3e0eca0250b21caf9e525586018c3cdc70dc682b7d82eecd`.

## Entrantes de silueta experimentales 2.5.0

`window.__DD_ROOM_SILHOUETTES_V3=true` selecciona 2.5.0 solo en arranque y si no hay versión guardada. Se conserva 2.0 por defecto y las versiones 2.0–2.4. Sobre las proporciones 2.4, los slots impares introducen un **entrante físico de 140 unidades** en un borde de la plantilla que no tiene socket ni ancla de mobiliario; los pares mantienen su perímetro previo. El perímetro, muros y población se compilan de nuevo. Los bordes elegidos son `alcoveN` en nave y palco, `cornerNW` en pasillo, `returnNE` en arena y `returnSW` en camarote. Se mantienen assets, vistas, pivotes, sombras y colliders de las plantillas; no se crea arte ni otro canvas. El Hangar piloto permanece excluido. Se cachean las plantillas en el catálogo durante la generación, no por frame.

En `siluetas-inset-25-visual/{a,b}.png`, el par de desafío `r13`, semillas 12 y 13, misma base y lados de puerta, **muestra un entrante visible** arriba a la izquierda en el slot 5. Parte queda bajo el HUD y las animaciones/destinos difieren; es una inspección de un par, no demuestra percepción en todos los cinco prefabs, salas o círculos ni la aprobación de jugadores. El criterio de identidad de nueve círculos aún no se ha implementado ni evaluado.

| Prueba | Resultado / límite |
|---|---|
| `room_generation_silhouette_audit.cjs 1000 variants` | 10.000 mapas, cero firmas forma/puertas repetidas entre compilados, Hangar excluido; compara polígonos normalizados, no variedad perceptiva de todas las salas. |
| `room_generation_silhouette_plans.cjs 1000` | 10.000 mapas, 115.000 salas, 920.000 candidatos, 1.000 Hangar excluidos; determinismo y perímetro compilado. Adaptador y validador comparten predicado. |
| `room_generation_silhouette_reach.cjs 1000 variants` | 276 configuraciones, 624 desembarcos accesibles en rejilla de paso 25/radio 16; 394.303/394.362 puntos libres conectados. No cubre movimiento continuo ni Hangar. |
| `DD_ROOM_SILHOUETTES=1 room_generation_unified_native.cjs` y `prefab_reach.cjs` | Seed 0: 115 salas, 257 puertas, 920 puntos de spawn comprobados y 257 salidas en rejilla. No prueba todas las seeds ni combate. |
| `DD_ROOM_SILHOUETTES=1 prefab_progression.cjs` y `room_generation_topology_live.cjs` | Nueve descensos asistidos; puerta del jefe y grafo/guardado reconstruidos. Debug; no campaña natural ni reanudación activa. |
| `room_generation_silhouette_version.cjs ... 100` | 1.000 planes por versión 2.0–2.4 idénticos al build anterior, 2.5 determinista en esa muestra y guardados 2.4/2.5 prevalecen sobre flag. |
| `room_generation_topology_perf.cjs` | Headless, 1.000 muestras/version: 2.0 media/p95 0,208/0,300 ms; 2.5 1,258/5,000 ms. Regresión frente a 2.0, sin prueba de frame o memoria. |

Evidencias `docs/DIAGNOSTICO_SALAS_EVIDENCIA/siluetas-inset-25-*`. Build generado por `python3 tools/build_active_html.py`; ambos SHA-256 `41a8a59653670bf8e4efe8d194537aa28c0a06365f88433c4c6db1b9e13ca228`. Reversión: `sha256sum -c backups/room_silhouette_20261126/SHA256SUMS`, restaurar migración y arneses respaldados, reconstruir y verificar ambos builds SHA-256 `95a3401de46a68fd3e0eca0250b21caf9e525586018c3cdc70dc682b7d82eecd`. La migración anterior no reconoce guardados 2.5: respaldar datos y diseñar migración antes de revertir, no borrarlos. Apagar el flag no altera guardados ya marcados 2.5.

**Fase 3 sigue abierta**: identidad diferenciada de los nueve círculos, evidencia visual por tipo/círculo, unicidad incluyendo Hangar, criterios completos de juego y rendimiento permanecen pendientes. No hay evidencia para afirmar ausencia de regresiones de frame/memoria ni campaña natural.

## Perfiles por círculo y comprobación del Hangar: 2.6.0 experimental

`window.__DD_CIRCLE_ROOM_PROFILES=true` selecciona 2.6.0 al arranque si no hay un guardado con versión. Se mantienen las versiones 2.0–2.5; la opción por defecto sigue siendo 2.0. En los pisos ordinarios 0–8 se asigna una mezcla fija de las bases existentes nave-quebrada, palco-profundo y pasillo-servicio a las salas locales 1–6, con orden barajado por stream determinista. Luego se aplican proporciones/entrantes 2.5. La densidad de mobiliario en esas seis salas es de 4, 3 o 2 elementos según el piso; se recortan las últimas propuestas **antes** de adaptar spawns. Entrada, Hangar, jefe y salas tranquilas conservan su asignación anterior. El núcleo piso 9 conserva la topología 2.5, con dos ciclos. No se crean assets nuevos, se usan las cinco plantillas y recursos/sombras del inventario de 2.4 y los sprites direccionales documentados arriba. No se cambia HUD ni se atribuyen nuevas historias al lore.

| Piso (índice) | Mezcla nave / palco / pasillo entre 6 salas | Muebles por sala de esas seis |
|---|---:|---:|
| 0 | 4 / 1 / 1 | 4 |
| 1 | 1 / 4 / 1 | 3 |
| 2 | 1 / 1 / 4 | 2 |
| 3 | 3 / 2 / 1 | 4 |
| 4 | 3 / 1 / 2 | 3 |
| 5 | 2 / 3 / 1 | 2 |
| 6 | 1 / 3 / 2 | 4 |
| 7 | 2 / 1 / 3 | 3 |
| 8 | 1 / 2 / 3 | 2 |

`room_circle_profiles.cjs 1000` confirma estas nueve distribuciones distintas sobre 6.000 salas por piso; detalle y conteos de referencia 2.0 en `circulos-26-perfiles.json`. La densidad cuenta todos los elementos del prefab, incluidos no sólidos, y **no mide densidad de enemigos**. Son perfiles cuantitativos de composición, no nueve conjuntos de arte o formas inéditos. En las 18 capturas de seed 0 (combate y desafío en cada piso) se aprecian materiales de suelo distintos y distintas composiciones; se siguen repitiendo las mismas familias arquitectónicas, algunos entrantes están bajo el HUD y no se ha demostrado que un jugador reconozca cada piso por forma y composición sin el suelo o el HUD. Se inspeccionaron las capturas, pero no se ha hecho una prueba ciega con jugadores ni capturas de todos los tipos y seeds. Ver `circulos-26-capturas/metadata.json`.

| Validación | Resultado y alcance |
|---|---|
| `room_generation_circle_audit.cjs 1000 variants` | 10.000 mapas: cero firmas repetidas entre todas las salas, **incluidos 1.000 Hangar**, normalizando escala uniforme, giro/reflejo y recorrido del polígono, con lados de puerta y ascensor. El Hangar se compara con su polígono del plan legacy. No mide percepción ni posiciones continuas de puertas. |
| `room_circle_hangar.cjs` | Seeds 0–9: polígono de plan y lados de puerta coinciden con la instalación nativa; no prueba físicamente todas las seeds ni accesibilidad. |
| `room_generation_circle_plans.cjs 1000` | 10.000 mapas deterministas, 115.000 salas prefab y 920.000 puntos, más 1.000 Hangar excluidos del adaptador. Adaptador y validador comparten predicado; no prueba física completa. |
| `room_generation_circle_reach.cjs 1000 variants` | 620 configuraciones y 1.552 desembarcos alcanzados en rejilla, 862.196/862.260 puntos libres conectados; Hangar no está incluido en esta prueba de rejilla, ni tránsito continuo o actores. |
| `DD_CIRCLE_PROFILES=1 room_generation_unified_native.cjs` y `prefab_reach.cjs` | Seed 0: 115 salas prefab, 257 puertas y 920 puntos probados; 257 salidas en rejilla. No todas las seeds ni el Hangar. |
| `DD_CIRCLE_PROFILES=1 prefab_progression.cjs`, `room_generation_topology_live.cjs`, `room_circle_victory.cjs` | Nueve descensos y núcleo asistidos; puerta final, 88 rondas debug y rama real de victoria alcanzada con jefe/oleadas forzados. Partida tainted; **no es campaña natural ni victoria no marcada**, ni prueba de reanudar incursión activa. |
| `room_generation_circle_version.cjs ... 100` | 1.000 planes por versión 2.0–2.5 idénticos al build anterior; 2.6 determinista y prioridad de guardados 2.5/2.6 en esa muestra. |
| `room_generation_topology_perf.cjs` | Chromium headless, 1.000 muestras/version: media/p95 de generación+bind 2.0 **0,193/0,300 ms**, 2.6 **1,281/5,000 ms**. Regresión; no activar por defecto. |
| `room_circle_frames_ab.cjs` | Seed 0/r1, sin enemigos y 240 intervalos rAF en software: 2.0 media/p95 **31,18/50 ms**, 2.6 **32,36/50 ms**; muestreo aproximado de asignaciones 161.168/169.076 B, delta heap post-GC 394.732/343.848 B. Una sala, ejecución secuencial; no establece ausencia de regresión, pico de memoria ni fuga, ni aplica a GPU física. |
| `room_generation.cjs`, `prefab_floors.cjs` | PASS en su alcance legacy (1.030 mapas, 654 instancias). |

Evidencia completa `docs/DIAGNOSTICO_SALAS_EVIDENCIA/circulos-26-*`. Builds solo con `python3 tools/build_active_html.py`: ambos SHA-256 `385c3ed19771c877e93e17b3cab965a682c830cb3e2e05deacbb478cf4bf3592`. Reversión: `sha256sum -c backups/room_circle_profiles_20261126/SHA256SUMS`, restaurar `tools/room_generation_migration.py` y arneses respaldados, reconstruir y verificar ambos builds SHA-256 `41a8a59653670bf8e4efe8d194537aa28c0a06365f88433c4c6db1b9e13ca228`. El código anterior no reconoce guardados 2.6; respaldar datos y planear migración antes de restaurar, sin borrarlos. El flag apagado no invalida un marcador 2.6 ya guardado.

**No se declara cerrada la fase 3:** faltan evidencia de identidad visual espacial perceptible para cada círculo, campaña natural, QA visual por todos los tipos y la condición de ausencia de regresión de generación, frames/memoria/asignaciones. La igualdad de firmas de Hangar se comprobó físicamente en diez seeds, no en todas.

## Inicio de fase 4: auditoría y corrección de tarimas 2.7

Se ha iniciado QA independiente, no cerrado ni aprobado; ver `docs/FASE_4_GENERACION_QA.md`. La auditoría detectó 40 esquinas de tarima fuera del perímetro entre 620 configuraciones 2.6. El modo 2.7 `window.__DD_PREFAB_DECK_REPAIR=true`, apagado por defecto, reposiciona la tarima óptica del camarote y deja 0 esquinas fuera en el mismo barrido. No altera versiones guardadas anteriores; pruebas de unicidad incl. Hangar, rejilla, navegador y compatibilidad descritas en el informe. Persisten regresión de generación, QA de campaña natural y reconocimiento perceptivo por círculo; la fase 3 continúa abierta.
