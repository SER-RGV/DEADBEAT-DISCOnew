# Combat Feel 2.0 · integración y pruebas

## Implementado

**Una tirada, un equipo, un único camino de daño.** El protagonista conserva D4, D6, D8, D10, D12 y D20. No hay armas convencionales, una segunda ranura, una pantalla de tirada ni un nuevo guardado. Las identidades pasivas existentes (masa, alcance, penetración, fragmentación, retorno, empuje y tabla de caras) siguen donde estaban. Se añade afinidad: resolver una cara grabada con la runa propia del modelo multiplica por 1,05 el daño de esa resolución, no su daño base ni todas las tiradas. Dice Vault muestra la afinidad y un ejemplo de combinación.

### Arquitectura y puntos de conexión

| Archivo | Responsabilidad |
|---|---|
| Nuevo `src/dd_combat_feel.js` | Registro ordenado de recetas, configuración, observación de lanzamientos/daño, reloj de simulación, memoria de cara, combos, selección de blancos, presupuesto, trazas y diagnóstico compilable. Sin listeners, intervalos ni temporizadores de pared. |
| `src/dd_dice.js`, `src/dd_dice_rules.js` | Limpieza al equipar/reiniciar, multiplicador de afinidad y una resolución adicional después de los impactos normales, antes de la recompensa original. |
| `src/dd_dice_native.js` | Enlaza daño confirmado en salud, línea de visión, director de audio, nota musical actual, etiqueta flotante, bajas y partículas. Reacciones usan el mismo adaptador de impacto contra enemigos y jefes, sus mitigaciones y muertes. No alcanzan generadores. |
| `src/dd_dice_feedback.js` | Se conserva el pool original de doce impactos y la retención de la pose del blanco; se parametrizan duración, retención y patada de cámara. No se frena el reloj de IA ni el del jugador. |
| `src/dd_ui_system.js` | Texto informativo dentro del inspector existente del dado. |
| `tools/build_active_html.py`, ambos HTML activos | Orden de inclusión, llamadas de limpieza al terminar encuentro/incursión y renderizado que respeta opciones de flash/vibración. |
| Nuevos `tools/qa/combat_feel.cjs`, `tools/qa/combat_feel_live.cjs` | Contratos deterministas y ejercicio de encuentros en Chromium. |

Se reutilizan el control de carga/soltar, apuntado, colisiones, esquiva, superficies, tablas de caras y runas, FX de muerte, señales originales de daño del jugador, patrones de jefe y final de sala. No se han cambiado sus reglas. Esta integración no modifica el generador de salas ni escribe datos de Combat Feel en localStorage.

### Qué puede construir el jugador

En un impacto confirmado se combinan la afinidad del dado, la runa efectiva, la runa de la última cara acertada (4 s) y el estado de la acción. `carga` = al menos 75 %; `grupo` = dos blancos distintos; `racha` = cinco impactos con menos de 2,8 s entre ellos; `afinada` = cara grabada que coincide con la afinidad; `crítico` = veinte natural en resolución. No se cuentan disparos al aire.

| Nivel | Receta | Condición | Probabilidad por oportunidad elegible |
|---|---|---|---|
| I | Circuito cruzado | fuego + electricidad | 95 % |
| I | Cristal de pista | hielo + carga | 95 % |
| I | Contratiempo | carga + grupo | 85 % |
| I | Eco de cara | afinada + carga | 90 % |
| II | Arco térmico | fuego + electricidad + carga | 85 % |
| II | Corte de retorno | perforación + rebote + carga | 85 % |
| II | Pulso tóxico | veneno + explosión + grupo | 85 % |
| II | Escarcha de veinte | hielo + crítico + fortuna | 100 % |
| III | Sobrecarga disco | fuego + electricidad + carga + racha | 78 % |

El registro elige una receta por prioridad; no repite la selección con otra si falla la probabilidad. La tirada de activación usa semilla, número de lanzamiento, dado y cara, **sin consumir el azar del motor**. Los saltos aplican el tipo de daño de la receta por el adaptador nativo; no son proyectiles independientes ni nuevos estados persistentes. Máximo 1/2/3 blancos según nivel, sin repetir blanco, con línea de visión y radio 148. Daño secundario propuesto ≤5 antes de modificadores nativos, atenuado ×0,72 por salto. Enfriamiento compartido de 1,6 s y techo de tres activaciones en tres segundos. Los saltos no tiran nuevos dados, no generan sellos y no vuelven a entrar en el resolvedor.

### Presentación y configuración

Cuatro intensidades: normal, combo, sinergia, sobrecarga. Etiquetas de compás y de reacción, segmentos finos entre blancos, acento tonal y golpe de baja. El refuerzo musical toma el acorde vigente y los pasos del secuenciador, con una cadencia distinta en sobrecarga y un registro más grave ante jefe. Usa el bus de música existente; no reinicia pistas. Ocho trazas reutilizables como máximo; caída a calidad baja o movimiento reducido elimina las trazas adicionales sin cambiar daño ni blancos. Opciones → flashes/vibración y los volúmenes nativos gobiernan la presentación. `config` y las recetas de `dd_combat_feel.js` concentran los parámetros de autoría de la capa nueva.

**DEBUG de desarrollo:** `DD_FEEL_DEV=1 python tools/build_active_html.py`; en una incursión, `DD_COMBAT_FEEL.inspect()` devuelve los últimos 32 eventos, decisiones/rechazos, ID de cadena, profundidad, trazas, combo y enfriamiento. `DD_DICE.d` expone equipo, cara y runas. Para volver a distribución: `python tools/build_active_html.py`. En la compilación normal no se exporta `inspect` ni se conserva el historial; no existe un parámetro de URL para activarlo.

## Validado

- `combat_feel.cjs`: repetición sobre 100 semillas elegibles de nivel III, **79 activaciones**; misma semilla y acciones → mismo resultado. Comprobados límite de daño y profundidad, ausencia de impactos duplicados, enfriamiento, afinidad compatible/incompatible, rechazo sin combinación y limpieza.
- `combat_feel_live.cjs`: tres partidas independientes en Chromium, semilla de planta 43, grupos de tanques y grabados sembrados mediante QA. En la ejecución registrada: D6, **10 lanzamientos / 7 cadenas / 16 saltos**; D8, **10 / 10 / 20**; D12, **10 / 5 / 7**. Máximos de profundidad 3/3/2. Cero balas convencionales y cero excepciones de página. Son escenarios de estrés deliberadamente favorables, no frecuencias de campaña. La IA conserva su azar.
- `dice_cycle.cjs`, `dice_feedback.cjs`: los seis dados; fragmentos, cadena, hielo, tirón, cancelación, retención visual, expiración de FX y presupuesto sonoro.
- `dice_engine.cjs`: movimiento durante lanzamiento, entrada de mando simulada, regreso a READY de seis modelos; jefe nativo de 111 a 108,32 HP.
- `DD_QUICK=1 test_ui_results.js`: Vault, HUD, pausa/mezcla, daño, muerte, reintento y menú. Sin errores de consola/red. Los dos HTML finales son idénticos.

## Pendiente

Medir FPS y latencias comparables antes/después en hardware objetivo; evaluar a oído la mezcla, la legibilidad bajo proyectiles hostiles y el equilibrio durante campañas naturales. El playtest por lotes no es una medición de FPS. No se diseñaron animaciones nuevas para cada ataque de jefe o cada tipo de esquiva: esas señales siguen siendo nativas. El inspector es de consola, no un overlay en producción.

## Bloqueado

Ningún bloqueo de integración observado. No se certifican rendimiento en consola, mando físico ni satisfacción subjetiva a partir de pruebas de Chromium.
