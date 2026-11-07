# B4 — Matriz de combate de los diez encuentros

**Fuente estática:** `DEADBEAT_DISCO.ART.html` (`Ao`, `Ye`, `We`, `su()`, `Tf()`, `Th()`, `wh()`, `vh()`, `Sh()`, `du()`).  
**Fuente de escenarios:** `evidence/B4_combat/scenario_matrix.json`.  
**Importante:** “disponible”, “seleccionado”, “intento de emisión” y “proyectil aceptado/impacto” son estados distintos. El contador B4 es `patternShot71`; no prueba aceptación individual por `vh()` ni impacto.

## 1. Matriz estática y muestra de scheduler

Cada fixture duró 16 s simulados, tick de 50 ms, `Math.random` sustituido por PRNG con semilla por caso, `DMO.debug.invuln()` activo y enemigos ordinarios limpiados; los adds propios del boss permanecen bajo su scheduler. Las trayectorias de jugador son teleport-inyectadas, no inputs físicos. Los patrones listados en “seleccionados” son los que entraron a `pattern71` en esta ventana, no una lista de ataques completos.

| Encuentro | Arquetipo / orden configurado | Otros canales/configuración | Conducta simulada | Selecciones observadas (16 s) | Incrementos del contador de intentos | Fases observadas |
|---|---|---|---|---|---:|---|
| Andén | hunter · fan → burst → ring | Sin adds; aceleración gradual. | Quieto | fan → burst → ring → fan | 6 | ranged ↔ chase |
| Magneta | hunter · burst → fan → ring | 4 adds; velocidad adds ×1,22; blindaje con adds. | Órbita horaria | burst → fan → ring → burst | 8 | ranged ↔ chase |
| Bufé | pulse · ring → spiral → burst | 4 adds; fire cada 6,2 s, max 2. | Retirada | burst → ring → spiral → burst | 14 | chase ↔ ranged |
| Cajero | hunter · ring → fan → spiral | 3 adds; +22 créditos por baja de add. | Quieto | ring → fan → spiral → ring | 13 | ranged ↔ chase |
| Pogo | sweeper · burst → fan → spiral | 5 adds; sweep; aceleración limitada. | Órbita horaria | burst → fan → spiral | 14 | ranged → sweep → chase → ranged |
| Oficiante | pulse · summon → ring → spiral | 2 adds; elec cada 6,6 s, max 2. | Retirada | summon → ring → spiral → summon | 13 | chase ↔ ranged |
| Matarife | sweeper · spiral → burst → fan | 5 adds; fire cada 5,6 s, max 3; mayor carga base. | Quieto | spiral → burst → fan → spiral | 14 | ranged → sweep → chase → ranged |
| Imitador | hunter · fan → ring → burst | 4 adds; aceleración limitada. | Órbita horaria | fan → ring → burst → fan → ring | 6 | ranged ↔ chase |
| Traidor | sweeper · ring → burst → spiral | 3 adds; elec cada 6 s, max 2; aceleración limitada. | Retirada | ring → burst → spiral → burst | 11 | ranged → sweep → chase → ranged |
| Núcleo Final | final/sweeper · fan → ring → burst → spiral | 5 adds; etapas 1–3; etapa 2 elec, etapa 3 fire; summon condicional. | Quieto | fan → ring → burst → spiral | 6 | ranged → sweep → chase → ranged |

`Scheduler attempts` cuenta deltas de `patternShot71`, no unidades de proyectil ni impactos. Los casos terminaron con 4 vidas y god mode activo; página sin errores y respuestas locales fallidas: 0. B4 no fijó HP bajo, no activó volley/berserk por daño ni ejecutó un ciclo natural completo de cada jefe.

## 2. Catálogo: definido → disponible → seleccionado → ejecutado

| Ataque | Definición `Ao` / emisión | Regla de disponibilidad/ejecución | Límite de evidencia |
|---|---|---|---|
| `fan` | Aviso 0,80 s; 5 proyectiles; speed 245; spread total 0,64; recovery 0,80. | Todos los perfiles incluyen fan en orden propio o fallback; berserk puede subir a 7. Emite en una llamada; usa ángulo de mira capturado durante `wh()`. | B4 puede observar `patternShot71`; `vh()` puede rechazar enlaces individualmente y el contador no refleja esos rechazos. |
| `ring` | Aviso 1,05 s; hasta 18; speed 185; hueco 1,1 rad; recovery 1,05. | Selección se aplaza si `kh()` no devuelve corredor; se vuelve a validar el corredor tras el aviso. Dispara radialmente omitiendo hueco. | B3 valida el contrato geométrico; no se certificó escape humano en todas las salas. |
| `spiral` | Aviso 1,10 s; hasta 20; speed 180; paso angular 0,23 rad; 2 tiros cada 0,115 s; recovery 1,15. | Requiere corredor seguro también al ejecutar; omite enlaces dentro de ±0,62 rad del hueco. | `patternShot71` mide incrementos/solicitudes; no demuestra que todos los enlaces sobrevivieran a presupuesto/obstáculo. |
| `burst` | Aviso 0,82 s; 9 declarados; speed 265; 3 enlaces por paso ±0,115 rad cada 0,18 s; recovery 0,95. | Todos los perfiles pueden heredarlo o declararlo; berserk alterna con spiral. La mira queda fijada al aviso. | La matriz observa incrementos de patrón, no verificación por proyectil aceptado. |
| `summon` | Aviso 1,20 s; 2 solicitudes a `Sh()`; recovery 1,20. | Solo está en el orden del Oficiante y como selección condicional del Núcleo en etapas ≥2, cada quinta selección si queda capacidad. Respeta `addsMax`, `addsSpawned`, cap global, gap y distancia al jugador. | Es un intento de spawn; `Sh()` puede rechazarlo. La matriz observa que el patrón aparece, no garantiza dos adds por solicitud. |
| `sweep` | Aviso 0,90 s; arco 2,4 rad en 1,4 s; longitud de prueba 720 px; un hit; cola 0,30 s. | Se inicia al vencer la fase ranged de `sweeper` si no hay patrón activo; dirección aleatoria; retorna a chase. | En B4 se observó en Pogo, Matarife, Traidor y Núcleo; escenario no valida hitbox percibida. |
| Zonas fire/elec | Registros scheduler independientes con su radio, `warn`, duración y owner. | Update por `zonePattern.every/max`; global B1 fire≤3 / elec≤2; Núcleo etapas 2/3 usa esos caps. | No forman parte del cursor `patterns72`; B1 prueba límites. Comunicación humana bajo concurrencia no verificada. |

## 3. Orden disponible por encuentro

La configuración de cada residente reemplaza/restringe la lista fallback. Secuencia normal es cíclica (`patternIndex71 % patterns.length`), no aleatoria por ataque. Núcleo añade `summon` a cada quinta selección potencial en etapas 2/3 si `addsSpawned < addsMax`. Berserk normal fuerza burst/spiral alternos y omite el orden residente. Un rechazo de corredor puede consumir el cursor aunque no exista aviso (hallazgo B4-02).

| Orden | Perfil |
|---|---|
| fan → burst → ring | Andén |
| burst → fan → ring | Magneta |
| ring → spiral → burst | Bufé |
| ring → fan → spiral | Cajero |
| burst → fan → spiral | Pogo |
| summon → ring → spiral | Oficiante |
| spiral → burst → fan | Matarife |
| fan → ring → burst | Imitador |
| ring → burst → spiral | Traidor |
| fan → ring → burst → spiral | Núcleo Final; summon condicional añadido por selector |

## 4. Interpretación por encuentro

- **Hunter (Andén, Magneta, Cajero, Imitador):** movimiento de persecución/reposicionamiento y ciclo de patrón compartido; diferencias mayores residen en lista, adds, protección, escalado o economía. La muestra confirmó los órdenes declarados en las ventanas observadas, no igualdad de presión.
- **Pulse (Bufé, Oficiante):** distancia preferida de 310 px y alternancia chase/ranged; añaden fire/elec por scheduler separado. Oficiante incluye summon como primer patrón; Bufé no.
- **Sweeper (Pogo, Matarife, Traidor, Núcleo):** acceso a sweep durante la fase ranged; el orden de proyectiles sigue siendo el del perfil/fase. La matriz capturó sweep en las cuatro muestras.
- **Núcleo:** selección de sala final usa `We`; el registro homónimo de `Ye` no es la ruta de ronda 100. La matriz B4 solo observó etapa 1. Etapas 2/3, multiplicadores y zonas están definidos en fuente y cubiertos por regresiones/contratos previos; no se simuló cruce de vida en este probe.

## 5. Lo que la matriz no afirma

No es una comparación de dificultad, DPS efectivo, frecuencia de impactos, tasa de supervivencia, bloqueo de rutas, fairness ni legibilidad. El número de incrementos de `patternShot71` no es número de balas aceptadas. Los patrones seleccionados cerca del final de los 16 s pueden no haber terminado su aviso/ejecución antes del corte. Para resultados completos, consultar el JSON con eventos B2, posiciones, balas agregadas, fases y limitaciones.