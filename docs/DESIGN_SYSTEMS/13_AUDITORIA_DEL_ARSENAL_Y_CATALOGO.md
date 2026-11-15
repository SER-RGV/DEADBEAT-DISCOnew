# 13 — Auditoría de arsenal: inventario, identidad y límites de balance

**Estado:** inventario documental parcial completado; catálogo funcional y estadísticas pendientes de extracción del runtime.  
**Base:** `main`, `ASSET_INVENTORY.md`, `PROJECT_INVENTORY.md`, contenido de `assets/weapons/` en la rama de diseño.  
**Regla:** no modificar daño, cadencia, alcance, dispersión, munición, rareza ni progresión mientras no exista una tabla de fuente de verdad contrastada.

## 1. Hallazgo principal

Hay tres inventarios distintos que no deben confundirse:

1. **Recursos raster embebidos:** `ASSET_INVENTORY.md` identifica 163 entradas en `window.__HD_DATA`, de las cuales 160 son imágenes HD. Incluye armas, jugador, pickups, jefes secretos y miniaturas del arsenal.
2. **Archivos externos visibles:** `assets/weapons/` contiene 16 PNG en el árbol revisado. Son recursos gráficos; su presencia no demuestra cuántas armas jugables existen.
3. **Catálogo jugable declarado:** `PROJECT_INVENTORY.md` recoge una discrepancia histórica entre 120 armas y 121 armas HD. El propio inventario advierte que esa cifra procede de comentarios/manifiesto y no de una extracción funcional independiente.

**Conclusión:** no hay base suficiente para afirmar que el juego tenga exactamente 16, 120 o 121 armas jugables. Los 16 PNG son un subconjunto de archivos externos; el bundle embebido contiene muchos más recursos y la cifra de catálogo sigue sin reconciliar.

## 2. Archivos externos observados

Los 16 nombres que aparecen en `assets/weapons/`:

| Archivo | Identidad sugerida por nombre | Evidencia |
|---|---|---|
| `weapon_c003_laser.png` | Láser | Archivo presente |
| `weapon_c005_needler.png` | Needler | Archivo presente |
| `weapon_c007_magnum.png` | Magnum | Archivo presente |
| `weapon_c008_silenciada.png` | Silenciada | Archivo presente |
| `weapon_c009_desert_eagle.png` | Desert Eagle | Archivo presente |
| `weapon_c010_explosiva.png` | Explosiva | Archivo presente |
| `weapon_c011_de_veneno.png` | Veneno | Archivo presente |
| `weapon_c012_de_hielo.png` | Hielo | Archivo presente |
| `weapon_c013_escopeta.png` | Escopeta | Archivo presente |
| `weapon_c015_escopeta_automatica.png` | Escopeta automática | Archivo presente |
| `weapon_m1911.png` | M1911 | Archivo presente |
| `weapon_magnum.png` | Magnum | Archivo presente |
| `weapon_olympia.png` | Olympia | Archivo presente |
| `weapon_plasma.png` | Plasma | Archivo presente |
| `weapon_ricochet.png` | Ricochet | Archivo presente |
| `weapon_uzi.png` | Uzi | Archivo presente |

La columna «identidad sugerida» deriva exclusivamente del nombre del archivo. No confirma que el código use esa misma etiqueta, ni que dos recursos con nombres parecidos sean armas distintas.

## 3. Loader y dependencias conocidas

Según `ASSET_INVENTORY.md`:

- Las imágenes HD se almacenan en `window.__HD_DATA`.
- El acceso se realiza mediante `window.__HD_GET(key)`, caché `__HD_EXTRA` y carga de imágenes con `new Image()`.
- Se mencionan `hdImages` y `ensureHdImg` como consumidores.
- Si falta un sprite HD, puede faltar la miniatura, pero el arma sigue funcionando.

El inventario advierte que buscar referencias literales no basta: las claves pueden construirse dinámicamente, por ejemplo con una concatenación del identificador de arma. Por tanto, una búsqueda de cadenas aisladas no constituye un catálogo completo.

El mismo documento registra que `weapons/weapon_m1911.png` fue uno de los ocho recursos clasificados para sustitución controlada en la Tanda 01. Eso acredita una decisión de asset, no un cambio de comportamiento del arma.

## 4. Qué falta para un catálogo funcional

Cada arma debe extraerse desde la estructura que realmente consume el motor, no inferirse del nombre de su PNG. El registro de auditoría debe incluir:

| Campo | Motivo |
|---|---|
| ID estable | Evitar duplicados y confusión entre alias |
| Nombre mostrado | Identidad en arsenal y HUD |
| Clase / familia | Comparar funciones equivalentes |
| Fuente de definición | Archivo, objeto o bloque runtime |
| Daño por impacto | Daño base y multiplicadores |
| Cadencia | Disparos por segundo o intervalo |
| Proyectiles por disparo | Separar daño de escopetas y ráfagas |
| Dispersión / precisión | Comparar daño efectivo, no solo nominal |
| Alcance / caída | Distinguir armas cortas y largas |
| Velocidad de proyectil | Tiempo de impacto y facilidad de acierto |
| Cargador / reserva | Economía de munición |
| Recarga | Ventanas de vulnerabilidad |
| Recarga especial / enfriamiento | Armas no balísticas |
| Coste / rareza / desbloqueo | Impacto en progresión |
| Efectos / estados | Veneno, hielo, explosión, rebote, etc. |
| Sinergias | Evitar dobles multiplicadores inadvertidos |
| Sprite / icono | Relación con recursos gráficos |
| Estado de prueba | No probado, medido o validado |

No todos los campos aplicarán a todas las armas. Los campos no aplicables deben registrarse como `N/A`, no rellenarse con valores inventados.

## 5. Protocolo para reconciliar 120 / 121

1. Identificar el objeto o función que enumera las armas disponibles en runtime.
2. Extraer todos los registros con su ID y nombre, sin filtrar por disponibilidad de sprite.
3. Contar IDs únicos y alias por separado.
4. Comparar el resultado con las claves de `__HD_DATA` y los archivos externos.
5. Identificar armas funcionales sin miniatura, miniaturas huérfanas y duplicados.
6. Comparar el recuento con los metadatos históricos (120 / 121) y documentar la causa exacta de la diferencia.
7. Guardar un JSON bruto de extracción y una tabla normalizada; no sobrescribir el origen.

**Criterio de cierre:** el total jugable debe derivarse de IDs únicos del catálogo runtime, con cada discrepancia explicada y trazable.

## 6. Protocolo de balance posterior

No balancear por DPS teórico aislado. Para cada arma y escenario medir:

- Daño efectivo por segundo sobre un objetivo estándar.
- Tiempo para eliminar enemigos de cada familia.
- Daño desperdiciado por sobre-matar.
- Tiempo de recarga y proporción del ciclo sin disparar.
- Precisión real y daño por proyectiles acertados.
- Rendimiento contra grupos y contra objetivo único.
- Consumo de munición y tiempo de reposición.
- Interacción con mejoras, rarezas y sinergias.
- Rendimiento por distancia y por geometría de sala.

Las pruebas deben usar el mismo enemigo, vida, distancia, duración, semilla y condiciones de mejoras. Registrar resultados por separado para daño base y daño con sinergias.

## 7. Bloqueos y límites

- El HTML principal contiene el motor y grandes bloques de datos embebidos; el acceso de lectura disponible en esta auditoría no ha permitido extraer el catálogo completo.
- Los 16 PNG externos no representan el inventario completo.
- Las 160 imágenes HD embebidas no equivalen necesariamente a 160 armas: el bundle también incluye jugador, pickups, jefes y miniaturas.
- La discrepancia 120/121 sigue abierta.
- No se han ejecutado pruebas de combate ni mediciones de DPS en esta tarea.

## 8. Próxima extracción requerida

En un checkout local de la build activa, localizar el catálogo consumido por el arsenal y exportarlo mediante una sonda temporal de solo lectura. La salida mínima será:

- `weapon_catalog_raw.json`: registros tal como existen en runtime.
- `weapon_catalog_normalized.csv`: una fila por ID jugable.
- `weapon_asset_coverage.json`: cobertura entre IDs y sprites.
- `weapon_catalog_audit.md`: discrepancias, alias, registros huérfanos y total único.

Hasta entonces, el documento 03 sigue siendo un método de auditoría y no una propuesta de cambios de estadísticas.
