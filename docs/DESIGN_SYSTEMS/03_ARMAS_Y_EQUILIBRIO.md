# 03 — Auditoría de armas y equilibrio

## 1. Objetivo

Construir una fuente única, verificable y completa para el arsenal; después evaluar el equilibrio con datos y pruebas. No se cambiarán daños, cadencias, precios ni rarezas por intuición.

## 2. Discrepancias documentales detectadas

El inventario técnico del proyecto registra:
- Arsenal declarado como 120 armas.
- Un manifiesto embebido que describe 121 armas HD.
- Datos HD con 163 imágenes (162 PNG y 1 WebP), que no equivalen necesariamente a 163 armas.
- Recursos y claves visibles como `m1911`, `c003_laser`, `c005_needler`, `c007_magnum`, `c008_silenciada`, `c009_desert_eagle`, `c010_explosiva`, `c011_de_veneno`, `c012_de_hielo`, `c013_escopeta`, `c015_escopeta_automatica`, `magnum`, `olympia`, `plasma`, `ricochet` y `uzi`.

Esto no permite afirmar todavía cuál es el inventario jugable exacto. La primera tarea es extraer el catálogo real del registro y del código activo, resolver aliases y duplicados y fijar una única cifra respaldada por IDs estables.

## 3. Campos obligatorios por arma

| Campo | Definición |
|---|---|
| ID estable | Identificador usado por el motor |
| Nombre | Nombre mostrado al jugador |
| Familia | Categoría funcional derivada de su comportamiento real |
| Daño base | Daño por impacto/proyectil |
| Cadencia | Disparos por segundo o intervalo |
| Proyectiles | Número por disparo |
| Dispersión | Ángulo o distribución |
| Recarga | Tiempo y condición |
| Cargador/reserva | Capacidad real |
| Alcance | Distancia efectiva |
| Velocidad | Velocidad del proyectil |
| Penetración/ricochet | Reglas efectivas |
| Estado/elemento | Veneno, hielo u otros, solo si existe |
| Área | Radio y daño de explosión, si aplica |
| Coste | Precio/desbloqueo real |
| Rareza | Nivel de acceso real |
| Fuente visual | Asset/manifest |
| Uso | Jugador, enemigo o ambos |
| Evidencia | Prueba y versión de datos |

No rellenar campos desconocidos con valores inventados. Usar `UNKNOWN` o `NOT_APPLICABLE` y documentar la fuente.

## 4. Métricas derivadas

Calcular con la implementación real:

- DPS sostenido, considerando recargas.
- Daño de ráfaga.
- Daño por cargador.
- Tiempo para eliminar objetivos de referencia.
- Eficacia contra un objetivo único.
- Eficacia contra grupos.
- Capacidad de control y ralentización.
- Fiabilidad a distintas distancias.
- Coste por daño o por baja, si la economía lo permite.
- Riesgo de auto-daño.
- Dependencia de precisión y movilidad.

Separar el daño teórico del daño realmente aplicado: proyectiles bloqueados, perdidos, rechazados por límites o fuera de alcance no cuentan como impactos.

## 5. Matriz de función

Cada arma debe tener:
- Un uso principal.
- Un punto fuerte claro.
- Una limitación legible.
- Un contexto donde destaca.
- Un contexto donde no es la mejor elección.

No todas las armas deben maximizar DPS. Debe existir diversidad entre ráfaga, control, alcance, área, precisión y economía de munición, siempre que esos comportamientos estén soportados por el juego actual.

## 6. Método de balance

**Paso 1 — Inventario:** extraer todas las definiciones, aliases, imágenes, precios y desbloqueos.

**Paso 2 — Integridad:** comprobar que cada arma seleccionable tiene definición, icono/asset, comportamiento y categoría válidos.

**Paso 3 — Baseline:** ejecutar escenarios repetibles contra objetivos de referencia, con distancia, vida, armadura y movimiento controlados.

**Paso 4 — Comparación:** medir DPS real, tiempo de baja, gasto de munición, precisión, daño perdido y supervivencia.

**Paso 5 — Diagnóstico:** identificar dominancia, armas inútiles, solapamientos funcionales y huecos de rol.

**Paso 6 — Propuesta:** recomendar cambios mínimos y explicar el efecto esperado.

**Paso 7 — Prueba A/B:** comparar baseline y candidato con los mismos escenarios y semillas.

**Paso 8 — Regresión:** comprobar tienda, inventario, selección, guardado, HUD, proyectiles y mandos.

## 7. Reglas de decisión

- No nerfear una arma solo porque su DPS teórico sea alto; comprobar el coste, alcance, precisión y disponibilidad.
- No buffear una arma solo porque se usa poco; revisar si su rol es situacional o si existe un bug.
- No modificar varias estadísticas a la vez si impide atribuir el resultado.
- No equilibrar contra un único enemigo.
- No convertir todas las armas en variantes del mismo DPS.
- No cambiar IDs estables ni claves de assets para corregir nombres.
- Mantener el historial de valores anterior y nuevo.

## 8. Entregables de auditoría

Crear una tabla exportable con:
- Catálogo completo y conteo validado.
- Campos fuente y valores extraídos.
- Métricas derivadas.
- Estado de asset/integración.
- Duplicados y aliases.
- Armas sin función clara.
- Armas dominantes o débiles según escenarios.
- Recomendación y nivel de confianza.

## 9. Criterios de aceptación

- Un solo catálogo autoritativo.
- Conteo explicado y reproducible.
- Todas las armas seleccionables tienen definición válida.
- Los cálculos usan valores del motor.
- DPS sostenido y daño de ráfaga se distinguen.
- Resultados reproducibles.
- Toda modificación tiene prueba A/B y regresión.
- Ningún balance se declara cerrado solo por inspección estática.

## 10. Pendientes críticos

- Extraer las definiciones de armas del HTML/código activo.
- Resolver 120 frente a 121.
- Separar armas de jugador, armas enemigas y recursos visuales.
- Identificar estadísticas y fórmulas reales.
- Verificar categorías de tienda y filtro `ALL`.
- Obtener baseline de combate en runtime.


## 11. Auditoría del árbol de assets (main)

La inspección del árbol de GitHub en `main` encuentra **16 archivos PNG** bajo `assets/weapons/`:

- `weapon_c003_laser.png`
- `weapon_c005_needler.png`
- `weapon_c007_magnum.png`
- `weapon_c008_silenciada.png`
- `weapon_c009_desert_eagle.png`
- `weapon_c010_explosiva.png`
- `weapon_c011_de_veneno.png`
- `weapon_c012_de_hielo.png`
- `weapon_c013_escopeta.png`
- `weapon_c015_escopeta_automatica.png`
- `weapon_m1911.png`
- `weapon_magnum.png`
- `weapon_olympia.png`
- `weapon_plasma.png`
- `weapon_ricochet.png`
- `weapon_uzi.png`

Este recuento describe únicamente ese directorio: no demuestra que el juego tenga 16 armas, ni que las imágenes sean el inventario completo. El manifiesto embebido y los datos HD mencionados en el inventario general pueden vivir en otras rutas o dentro del HTML.

**Bloqueo de extracción:** el HTML activo `DEADBEAT_DISCO.ART.html` tiene 13.490.978 bytes y está minificado en una línea. La lectura disponible del archivo devuelve contenido vacío, incluso al pedir codificación base64; no se ha podido inspeccionar de forma fiable su tabla de definiciones. No se inventa una cifra ni se extraen estadísticas por inferencia.

**Siguiente paso técnico:** obtener el HTML o su fuente desde un checkout local/entorno que pueda leer archivos grandes; localizar la definición autoritativa del catálogo, exportarla a JSON y contrastar:
1. IDs de armas seleccionables.
2. Alias y duplicados.
3. Assets de icono/sprite.
4. Estadísticas y fórmulas de daño.
5. Precio, rareza y desbloqueos.
6. Referencias desde tienda, HUD, guardado y lógica de disparo.

Hasta completar ese paso, la discrepancia 120/121 sigue abierta y no se modifica el balance.
