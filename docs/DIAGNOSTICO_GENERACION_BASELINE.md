# Diagnóstico de generación de salas — línea base

Fecha: 2026-11-26. Checkout base `d02dd8dd30295adf5b8c64a866d6a055c58483a6`. Este documento es diagnóstico, no aprobación de cambios ni evidencia de juego completo.

## Alcance y reproducibilidad

`node tools/qa/room_generation_baseline.cjs 1000 > baseline.json` genera y compara por duplicado seeds 0…999 y pisos 0…9 (Node v22.22.3). Resultados por piso en `docs/DIAGNOSTICO_SALAS_EVIDENCIA/baseline.json`. `generate` incluye `validate`, luego se enlazan e instancian prefabs. No es una simulación del motor. `r0` de piso 0 no tiene prefab jugable y se excluye de los cálculos físicos de prefab. La prueba es determinista salvo tiempos de reloj; devuelve código de error si detecta excepciones, resultados distintos o un número incompleto de mapas. SHA-256 del script: `10cf38088ad8d436ad113d8247ff81bc0501e9e1eb6025733aadd1ee9f604509`.

Lectura íntegra de fase 0 completada: README y documentos raíz solicitados, `docs/README.md`, `src/README.md`, biblia vigente y referencia de `ART_REFERENCES`, los 11 archivos de `src/room_generation/` y su catálogo, los seis módulos de integración solicitados y los 103 archivos actuales de `tools/qa/`, incluida `legacy/` y los cuatro instrumentos diagnósticos nuevos. `CIRCLE_CONFIG` se revisó dentro del renderer. La referencia histórica difiere de la biblia vigente en la revisión de tatuajes y el enlace a la lámina maestra; la vigente prevalece. La lectura de un arnés no significa que se haya ejecutado: solo las pruebas identificadas más abajo se ejecutaron en esta sesión. La fase 2 de propuesta está documentada en `docs/PROPUESTA_GENERACION_FASE_2.md`; la fase 3 de implementación no se ha iniciado.

## Fase 0 — pipeline observado

| Etapa | Evidencia estática |
|---|---|
| Seed | `seed.js`: versión 2.0.0 y streams independientes por seed, piso y canal. Seed de incursión desde `crypto.getRandomValues`, excepto override de debug; no es azar no sembrado en el generador. |
| Plan | `floor.js`: nodos, enlaces, profundidades, `waveScale`; piso 9 es un único jefe. `validate.js` verifica unicidad, enlaces recíprocos, accesibilidad lógica con/sin secretos y tienda, margen de propuestas y distancia spawn-prop. |
| Geometría de plan | `rooms.js` genera dimensiones y puntos normalizados; `population.js` propone cuatro props, ocho candidatos de spawn y una posición de recompensa por sala. |
| Prefab | `bindPrefabs()` asigna casa y conexiones; `instantiatePrefab()` genera puertas, muros, mobiliario y tarimas. `playableRoom()` usa perímetro y dimensiones de `catalog.json` para geometría compilada; `r0` del piso 0 conserva piloto. Tarimas son visuales, no niveles de movimiento. |
| Instalación/colisión | `tools/room_generation_migration.py` inyecta el módulo al construir. `ng` entrega la geometría compilada a la instalación; `cg` usa el centro del socket; el adaptador transforma huellas prefab a props nativos. `roomCast` filtra candidatos usando geometría, colisión, huecos, distancia al jugador y otros enemigos. Si no encuentra candidato devuelve null; el adaptador no fuerza aparición. |
| Render | `tools/build_active_html.py` conecta `DD_PREFAB_WORLD.shell` y `prop` al render nativo, con caché e invalidación por revisión; `dd_prefab_world.js` dibuja muros, huecos, suelo, tarimas y sprites. Hay una cola de profundidad para props. No se ha verificado visualmente oclusión. |
| Debug | `debug.js` visualiza `node.geometry` y `population`, no el polígono compilado. `roomDebug` se ejercitó en Chromium mediante las pruebas indicadas más abajo. |
| HUB / dados | `dd_hub_layout.js` tiene plano y obstáculos propios; `dd_hub_system.js` integra entrada/salida. `dd_dice_rules.js` resuelve impacto, runas y recompensa; el adaptador de build reconecta botín y grabados. La persistencia se probó con los límites descritos abajo; no se verificó una partida completa ni interacción física de todos los objetos. |

**Duplicación de forma — MEDIDO/lectura:** `validate` y atlas del plan usan el polígono de `rooms.js`; instalación con prefab usa el de `catalog.json`, y el prefab compila su malla desde ese mismo catálogo. El comentario de `prefabs.js` que niega reemplazo del polígono no describe completamente el camino actual de `playableRoom`. 108.000/108.000 polilíneas compiladas difieren literalmente de las propuestas; esto no prueba que colisión y render activos diverjan. Las pruebas en ejecución descritas abajo comprueban casos acotados, no la equivalencia física y visual de todas las seeds.

**Contrato de arte:** la guía raíz describe un pipeline histórico; `CURRENT_STATE.md` y `docs/TOTAL_ART_REBUILD/03_ASSET_CONTRACT.md` registran un pipeline posterior con `DD_ASSETS`, 512² para suelos y pivote bottom-center de props. El renderer prefab existente también tiene su propio cargador `DD_PREFAB_WORLD`. Para recursos oscuros el requisito del encargo es croma verde `#00ff00`, no eliminación de negro. No se han inventariado nuevos assets ni rutas porque no se diseñan prefabs en este diagnóstico.

**Lore:** la biblia indica torre musical, pistas y deseos, no equivalencia automática con círculos infernales; sus nombres temáticos se declaran propuestas, y exige señales visuales equivalentes al audio. La correspondencia de sus nueve pistas con los índices activos 0–9 no está establecida aquí. No renombrar HUD.

## Fase 1 — resultados

### Variedad y tamaños

| Distribución de tipo | Salas |
|---|---:|
| combate | 18.000 |
| jefe | 10.000 |
| inicio, desafío, evento, élite, tesoro, secreta, supersecreta, tienda | 9.000 cada uno |
| descanso / especial | 5.956 / 3.044 |

| Base `geometry.base` del plan | Cantidad |
|---|---:|
| wide (incluye hall y service) | 27.198 |
| compact | 29.202 |
| tower | 33.600 |
| octagon | 19.000 |

| Prefab vinculado | Salas | Tamaño jugable compilado | Área libre muestreada aproximada, px² |
|---|---:|---:|---:|
| pasillo-servicio | 26.886 | 1.720 × 700 | 882.800 |
| palco-profundo | 18.062 | 1.210 × 855 | 782.000 |
| nave-quebrada | 18.052 | 1.210 × 770 | 722.800 |
| camarote | 36.000 | 1.080 × 1.000 | 841.600 |
| arena-octogono | 10.000 | 1.500 × 1.120 | 1.158.800 |

Las cantidades de prefab vinculado incluyen los 1.000 `r0` no compilados; el JSON da las cantidades de dimensiones efectivamente compiladas. El área libre es una muestra de centros en rejilla de 20 px con radio 18 contra polígono y sólidos de catálogo; no incluye props escénicos nativos, entidades ni accesibilidad desde una entrada. No equivale a cobertura ni a área alcanzable. La suma aproximada de huellas sólidas es ~1,24 % del área de los polígonos compilados en pisos 0–8: puede solaparse y no representa cobertura de línea de visión.

| Prefab | Área poligonal px² | Sólidos de catálogo | Destructibles | Suma de huellas / área |
|---|---:|---:|---:|---:|
| pasillo-servicio | 989.840 | 3 | 2 | 1,22 % |
| palco-profundo | 869.437,5 | 3 | 1 | 1,19 % |
| nave-quebrada | 808.775 | 3 | 2 | 1,49 % |
| camarote | 939.600 | 3 | 1 | 1,10 % |
| arena-octogono | 1.275.000 | 5 | 3 | 1,47 % |

**MEDIDO:** cuenta de sólidos de catálogo y suma geométrica de huellas (rectángulo, círculo o cápsula). Sirven como indicador de obstáculos potenciales, no certifican cobertura contra proyectiles ni línea de visión. La cobertura útil final es **NO VERIFICADA**.

Una segunda medida reproducible (`node tools/qa/room_generation_coverage.cjs`) usa rejilla de 20 px, radio 18 y hasta cuatro rayos cardinales de 400 px cada uno, con pasos de 5 px y extremos libres. Cuenta los rayos que cruzan huellas sólidas prefab (incluidas destructibles); excluye paredes de la trayectoria, mobiliario escénico y actores. Es un **proxy geométrico**, no una prueba de proyectiles ni de comportamiento enemigo:

| Prefab | Puntos libres elegibles | Puntos con al menos un rayo bloqueado | Rayos válidos bloqueados |
|---|---:|---:|---:|
| pasillo-servicio | 2.203 | 56 (2,54 %) | 56/4.410 (1,27 %) |
| palco-profundo | 1.955 | 76 (3,89 %) | 76/4.057 (1,87 %) |
| nave-quebrada | 1.807 | 57 (3,15 %) | 57/3.581 (1,59 %) |
| camarote | 2.104 | 74 (3,52 %) | 74/4.681 (1,58 %) |
| arena-octogono | 2.897 | 94 (3,24 %) | 94/6.917 (1,36 %) |

La muestra no dice qué porcentaje de combate ofrece cobertura útil; el JSON de evidencia incluye conteos y metodología.

Entropía Shannon global de tipos 3,495 bits; bases 1,971 bits; prefabs 2,201 bits. No es una medida de variedad visual percibida. Siete tipos (`challenge`, `boss`, `rest`, `special`, `secret`, `supersecret`, `shop`) reciben un solo prefab. En 7.472/9.000 pisos ordinarios hay al menos una pareja con el mismo prefab y los mismos lados de puerta, con ascensor distinguido: 12.620 parejas. Se excluye Hangar; esta firma no detecta necesariamente todas las equivalencias visuales.

### Topología y ritmo

| Métrica | Resultado |
|---|---:|
| Mapas / salas | 10.000 / 109.000 |
| Excepciones de generación/compilación; repeticiones diferentes | 0 / 0 |
| Pisos 0–8: ciclos / grado medio | 1 / 2,0 en todos |
| Piso 9 | un jefe; ciclos 0; grado 0 |
| Profundidad de jefe, pisos 0–8 | 3: 25; 4: 3.507; 5: 4.174; 6: 1.183; 7: 111 |
| Hojas, pisos 0–8 | 4: 1.814; 5: 5.323; 6: 1.802; 7: 61 |
| Élites sin `rest`, `treasure`, `shop` o `special` a ≤2 saltos | 2.132/9.000 |
| Camino mínimo al jefe que incluye élite | 5.420/9.000 |
| Predecesor directo del jefe: tesoro / descanso / especial / élite / combate / desafío | 3.484 / 2.464 / 1.229 / 1.593 / 227 / 3 |

La cercanía a respiro/recompensa es distancia no dirigida, no garantiza que se visite después de la élite. No hay una definición implementada de «escalada» para contabilizarla. El validador prueba conexión lógica sin secretos ni tienda; esto no valida desbloqueo, colisión o recorrido real. El piso 9 no puede cumplir dos ciclos si sigue siendo una sola sala. El usuario ha decidido incluirlo en el requisito; la propuesta de fase 2 contempla rediseñarlo sin alterar esta línea base histórica.

### Puertas, spawns y diferencias por piso

| Métrica | Resultado |
|---|---:|
| Aberturas compiladas en el centro de su borde | 222.392/222.392 |
| Distancia entre centros de aberturas de una sala | mín. 674,3; mediana 928,5; p95 1.720 px; incluye ascensores |
| Candidatos de spawn que incumplen aproximación de radio 36 contra perímetro prefab o sólidos de catálogo | 28.236/864.000 (pasillo: 26.548; palco: 1.688) |
| Salas sin ningún candidato geométricamente libre | 0/108.000 |

Los candidatos bloqueados son propuestas, no enemigos aparecidos dentro de colisionadores: el motor tiene un filtro posterior. No se comprueba distancia al jugador, hazards ni geometría escénica real en este cálculo. Tampoco demuestra que las puertas sean físicamente alcanzables.

| Piso | Mapas con firma prefab+puertas repetida / 1.000 | Élites sin recompensa próxima / 1.000 | Área poligonal media compilada, px² | Colocaciones prefab / millón px² |
|---:|---:|---:|---:|---:|
| 0 | 798 | 231 | 951.577 | 4,39 |
| 1 | 827 | 262 | 946.044 | 4,40 |
| 2 | 803 | 238 | 946.230 | 4,40 |
| 3 | 841 | 237 | 946.250 | 4,40 |
| 4 | 845 | 243 | 946.788 | 4,40 |
| 5 | 832 | 234 | 946.759 | 4,40 |
| 6 | 846 | 242 | 946.537 | 4,40 |
| 7 | 852 | 219 | 946.687 | 4,40 |
| 8 | 828 | 226 | 946.311 | 4,40 |
| 9 | 0 | no hay élite | 1.275.000 | 4,71 |

**INFERIDO:** no hay parámetro de composición por círculo en la selección de formas y prefabs; las pequeñas diferencias entre pisos 0–8 son compatibles con muestreo de streams diferentes, no prueban identidad. `CIRCLE_CONFIG` sí distingue recursos de suelo, pared y tonos; el suelo prefab también usa una lista por piso. La composición final y hazards por círculo no se han medido.

### Contraste de hipótesis

| Hipótesis | Estado |
|---|---|
| 12 nodos y un ciclo más árbol | Confirmada para pisos 0–8; piso 9 excepción. |
| Jefe en borde más profundo y secretos/tienda desde núcleo | Confirmada en código: se elige entre nodos expuestos más profundos antes de añadir hojas opcionales. |
| Cinco plantillas y dimensiones +0–140 | Confirmada; `geometry.base` agrupa hall y service bajo `wide`. Cuadrada usa h=w. |
| 28 % rectangular salvo élite/jefe | Confirmada como probabilidad en código; datos agregados: 25.122 rectángulos de 109.000 salas, no 28 % del total porque hay salas grandes excluidas. |
| Cinco prefabs, solo tres sorteados | Confirmada con matiz: tres casas para varios tipos; desafío, jefe y tipos tranquilos se asignan de forma fija. |
| Puertas en t=0,5 y ascensor primer lado libre | Confirmada en código y aberturas compiladas; falta ejecución física. |
| Dos formas distintas | Confirmada en datos; no se puede concluir que render y colisión activos diverjan. |
| Círculos no influyen en forma y composición | Confirmado para selección del generador inspeccionado; composición final en juego no verificada. |
| Falta regla explícita de ritmo | Confirmada para garantía de descanso posélite en el generador; 2.132 incumplimientos bajo definición de distancia indicada. |

### QA y rendimiento

| Comando | Estado | Alcance |
|---|---|---|
| `node tools/qa/room_generation_baseline.cjs 1000` | APROBADO para las comprobaciones descritas | 10.000 planes por duplicado; 108.000 prefabs compilados. No es QA física. |
| `node tools/qa/room_generation.cjs` | APROBADO | 1.030 planes, dos generaciones; guardas existentes. |
| `node tools/qa/prefab_floors.cjs` | APROBADO | 654 instancias, seis seeds, 60 pisos; 20 corredores conservadores de catálogo. |
| `room_generation_live.cjs` | APROBADO | Chromium headless: seeds 0 y 4294967295, sala inicial, dos puertas cada una y comprobaciones de arquitectura, spawns, guardado y regeneración. |
| `prefab_reach.cjs` | APROBADO | Seed 0: 108 salas compiladas, 223 salidas; muestreo en rejilla, radio 16, sin demostrar tránsito de todas las seeds ni enemigos. |
| `prefab_rollout.cjs` | APROBADO con observación | Seed 0: 108 salas; el linter genérico de mobiliario marca las 108. La prueba registra pero no falla por esa regla. |
| `prefab_progression.cjs` | APROBADO | Nueve descensos con despeje y salto asistidos por debug y reconstrucción de diez pisos tras recarga, no campaña jugada. |
| `room_generation_room_state.cjs` | APROBADO para revisita asistida | Seed 0: `r1` conserva despeje y tres puertas abiertas tras salir y volver; la secreta `r7` cambia de no visitada/no conocida a visitada/conocida y permanece visitada en la misma incursión. Después de recargar y empezar otra incursión desde el HUB se reinician esos estados, manteniendo seed 0 de debug. No prueba reanudar una incursión activa ni cofres saqueados. |
| `test_cartography_tour.cjs` | APROBADO | Nueve residentes mediante puertas generadas; despeje asistido por QA, no combate natural. |
| `prefab_perf.cjs` | APROBADO en su umbral relativo | Cinco salas, 60 fotogramas por muestra; GL por software: medias 29,1–35,5 ms con 0–4 enemigos; 34,2–38,1 ms con 27–28 enemigos. No predice GPU real. |
| `test_persistencia.js` | APROBADO con límites | Arnés actualizado al flujo de menú actual: 42/42. Prueba CONTINUAR, NUEVA PARTIDA y BORRAR DATOS con almacenamiento sembrado y perfil desechable. No verifica recuperación de cofres, puertas o secretos descubiertos; tres claves permanentes no estaban sembradas. Primera ejecución adaptada: 41/42 por límite de altura obsoleto del rectángulo; se ajustó a las constantes actuales de dibujo, sin modificar el juego. Evidencia: `docs/DIAGNOSTICO_SALAS_EVIDENCIA/persistencia.{log,json}`. |
| `test_menu_new_flow.js` | INESTABLE | Primera ejecución: normal PASS, movimiento reducido falló por eventos `requestfailed` de recursos; causa no confirmada. Segunda ejecución sin cambios: ambas variantes PASS. No se declara estable. |
| `room_generation_memory.cjs` | MEDIDO, no prueba de regresión | Seed 0, sala r1, 240 rAF en Chromium 158 headless: heap JS tras GC 9.215.928 → 9.800.240 B, Δ +584.312 B. El muestreador CDP de asignaciones, intervalo 8.192 B, estimó 60.414.824 B durante 8,35 s con 14 enemigos al final. Incluye actividad del juego y del propio arnés, no es conteo exacto por frame, pico de memoria ni prueba de fuga. |

El navegador se habilitó fuera del repositorio: paquetes `playwright-core` y `@sparticuz/chromium` en `/tmp/dd-qa-browser`, y bibliotecas NSS extraídas de `al2023.tar.br` incluido en el último paquete. Ejemplo de ejecución, tras servir la raíz en el puerto 8000: `NODE_PATH=/tmp/dd-qa-browser/node_modules LD_LIBRARY_PATH=/tmp/dd-qa-browser/al/lib DD_CHROMIUM=/tmp/chromium node tools/qa/prefab_reach.cjs http://127.0.0.1:8000`. `/tmp` es efímero y debe prepararse de nuevo en otro entorno.

En la última ejecución, generar+validar+vincular consumió media 0,194 ms y p95 0,288 ms por plan en este proceso Node; excluye segunda generación y compilación prefab. Es sensible a máquina y JIT. La medición puntual de heap y el perfil de asignaciones no establecen un presupuesto ni demuestran cero asignaciones por frame. Capturas y pruebas de GPU real, mando físico, audio, otros navegadores y campaña larga: **NO VERIFICADO**. El frame time medido es la línea base headless indicada arriba; sin A/B no puede declararse ausencia de regresión.

### Reparación del arnés de persistencia

Se guardó copia previa en `backups/room_diagnostic_20261126/test_persistencia.js` (SHA-256 `cb26fd6c25b1157deb6f6bdac7343b038aa1d5b8c273a01b187dc8f0f407de6e`). `tools/qa/test_persistencia.js` ahora espera el menú, accede a Nueva/Continuar desde Jugar, acelera intro y descenso con el mecanismo QA existente, y comprueba el tamaño de dibujo contra la escala actual 512 × 134 / 462. El chequeo del rectángulo no prueba ausencia de recorte visual. Restauración: copiar ese backup sobre el archivo de QA y comprobar su SHA-256. No se ha cambiado el juego ni regenerado builds.

No se han ejecutado todas las guardas de `tools/qa`; no se declara QA global verde. La fase 0 se cierra con la lectura indicada arriba. La fase 1 se cierra como diagnóstico de línea base con los límites físicos, visuales y de ejecución expresamente señalados; esos aspectos siguen sin verificar y no se presentan como aprobados.
