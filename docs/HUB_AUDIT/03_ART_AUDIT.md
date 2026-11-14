# 03_ART_AUDIT.md — Auditoría gráfica y artística del Refugio

DEADBEAT DISCO · FASE 01 · Auditoría y rediseño del Refugio
Rama: `arena/8b71cc96-deadbeat-disconew` (desde `main` `2d1f6e8`)
Estado: **solo auditoría y propuesta** — sin modificaciones destructivas, sin rediseño visual, sin nuevos assets.

---

## 1. Referencia canónica del protagonista

| Campo | Valor |
|-------|-------|
| Archivo | `assets/cinematics/restart/character_master/protagonist_master_approved.png` |
| Dimensiones | 1672 × 941 px |
| SHA-256 | `43d9e58fcd1c9f9e04aabcc95da2194496a8aef765e2b9a56d34e75933004e5d` (verificado) |
| Estado | **APROBADO** — referencia canónica de anatomía, vestimenta, tatuajes, silueta, identidad y proporciones |

**No se debe modificar** nada de este diseño. Los recursos antiguos que no coincidan con este diseño se identifican y documentan, **no se sustituyen automáticamente**.

---

## 2. Clasificación de recursos del Refugio

Categorías utilizadas:
- **APROBADO**: coincide con la dirección artística actual y con la referencia canónica.
- **REUTILIZABLE**: válido con pequeños ajustes (escala, pivote, recorte).
- **OBSOLETO**: pertenece a una versión visual anterior; candidato a archivo, no a eliminación.
- **INCONSISTENTE**: rompe la coherencia visual (estilo, escala, proporciones).
- **FALTANTE**: recurso necesario que todavía no existe.
- **DUPLICADO**: recurso repetido o redundante.

### 2.1 Protagonista en el Refugio

| Recurso | Ruta | Dimensiones | Categoría | Comentario |
|---------|------|-------------|-----------|------------|
| Lámina maestra aprobada | `assets/cinematics/restart/character_master/protagonist_master_approved.png` | 1672 × 941 | **APROBADO** | Referencia canónica. No es el sprite que se renderiza en el HUB. |
| IDLE fidelidad v2 (usado en HUB) | `assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png` | 288 × 512 | **REUTILIZABLE / PENDIENTE** | Sprite usado por `DD_HUB` (`ensureRefugeIdle`). Pendiente de aprobación formal (batch `R05B_PROTAGONISTA_MAESTRO_FIDELIDAD`, v2). |
| IDLE v1 (comparación) | `assets/characters/protagonist_master/fidelidad/versiones/pm_idle_fid_00_v1.png` | 288 × 512 | **OBSOLETO** | Versión anterior de corrección, conservada como comparación. No usada en juego. |
| IDLE R05 (base) | `assets/characters/protagonist_master/pm_idle_00.png` | 288 × 512 | **REUTILIZABLE / PENDIENTE** | "aprobado técnicamente, conservado sin cambios" (batch `R05_PROTAGONISTA_MAESTRO`). Pendiente de registro en manifiesto. |
| IDLE experimento fallido (4 frames) | `assets/characters/protagonist_master/IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY/pm_idle_0[0-3].png` | 288 × 512 c/u | **OBSOLETO** | Experimento de tatuaje fallido. Continuidad rota de tatuajes. No usado en juego. |

**Observación crítica**: el sprite que se renderiza en el Refugio (`pm_idle_fid_00.png`, 288 × 512) no es la lámina maestra aprobada (1672 × 941). Es una lámina derivada a menor resolución. No se ha verificado visualmente que sus proporciones, tatuajes y silueta coincidan exactamente con el diseño aprobado 1672 × 941. **Esto debe confirmarse con comparación visual antes de cualquier cambio**; si no coinciden, se clasifica como INCONSISTENTE y se documenta (no se sustituye automáticamente).

### 2.2 NPCs

| Recurso | Ruta | Dimensiones | Categoría | Comentario |
|---------|------|-------------|-----------|------------|
| DJ Virgilio (mundo) | `assets/characters/npc_dj_booth_world.png` | 384 × 320 | **REUTILIZABLE** | TANDA_08. Usado en HUB con fallback a `dialogue_portrait_dj`. |
| Bartender HUB | `assets/characters/npc_bartender_hub.png` | 256 × 320 | **REUTILIZABLE** | TANDA_08. |
| Armero HUB | `assets/characters/npc_armorer_hub.png` | 256 × 320 | **REUTILIZABLE** | TANDA_08. |
| Retrato diálogo DJ | `assets/ui/dialogue_portrait_dj.png` | 512 × 512 | **REUTILIZABLE** | Fallback del DJ en HUB. TANDA_01. |

### 2.3 Arquitectura (suelos, muros, columnas, puertas)

| Recurso | Ruta | Dimensiones | Categoría | Comentario |
|---------|------|-------------|-----------|------------|
| Suelo Limbo/Mármol | `assets/floors/floor_00_limbo_marble.png` | 512 × 512 | **REUTILIZABLE** | TANDA_02. Patrón repetido (tile 256) en suelo del HUB. Sin alfa. Bordes igualados para repetición sin costura. |
| Suelo VIP Terciopelo | `assets/floors/floor_11_vip_velvet.png` | 512 × 512 | **REUTILIZABLE** | TANDA_03. Inset VIP 48%×44% si sala>760×560. |
| Plataforma de descenso | `assets/environments/threshold_descent_pad.png` | 512 × 320 | **APROBADO** | TANDA_01. "Plataforma Cian de Descenso HUB". Pivot center. |
| Muro gótico nicho | `assets/walls/wall_panel_gothic_niche.png` | 256 × 384 | **REUTILIZABLE** | TANDA_03. Muro norte en módulos 128, alto 132. |
| Pilastra obsidiana | `assets/walls/wall_pillar_obsidian.png` | 192 × 384 | **REUTILIZABLE** | TANDA_03. Cada 320px en muro norte. |

### 2.4 Mobiliario y equipamiento (props)

| Recurso | Ruta | Dimensiones | Categoría | Comentario |
|---------|------|-------------|-----------|------------|
| Mural Zorro Neón | `assets/props/prop_hub_fox_neon.png` | 384 × 512 | **APROBADO** | TANDA_01. Firma visual derecha del HUB ("exact match to r5_refugio_hub.png"). |
| Sofá negro | `assets/props/prop_sofa_black.png` | 384 × 256 | **REUTILIZABLE** | TANDA_06. |
| Sofá magenta | `assets/props/prop_sofa_magenta.png` | 384 × 256 | **REUTILIZABLE** | TANDA_01. Gemelo del negro en lounge VIP. |
| Butaca VIP | `assets/props/prop_armchair_vip.png` | 256 × 256 | **REUTILIZABLE** | TANDA_06. |
| Banco neón | `assets/props/prop_bench_neon.png` | 320 × 192 | **REUTILIZABLE** | TANDA_07. |
| Candelabro | `assets/props/prop_candelabra_floor.png` | 192 × 320 | **REUTILIZABLE** | TANDA_08. |
| Máquina expendedora | `assets/props/prop_vending_machine.png` | 256 × 352 | **REUTILIZABLE** | TANDA_07. |
| Arcade | `assets/props/prop_arcade_cabinet.png` | 256 × 352 | **REUTILIZABLE** | TANDA_07. |
| Cofre | `assets/props/prop_chest_closed.png` | 256 × 224 | **REUTILIZABLE** | TANDA_06. |
| Pedestal arcano | `assets/props/prop_arcane_pedestal.png` | 288 × 352 | **REUTILIZABLE** | TANDA_07. |
| Barra / botellas / nevera / parlante / subwoofer / cabina DJ / palma | varios (props) | 192–448 | **REUTILIZABLE** | TANDA_05/06/07/08. |
| Farol dorado | `assets/props/prop_chandelier_gold.png` | 320 × 320 | **REUTILIZABLE** | TANDA_05. Dos unidades en techo (650,215) y (1110,215). |

### 2.5 HUB Tanda 01 (ART_ASSETS/hub/tanda_01 / ART_PACK HUB-01..10)

| ID | Nombre | Dimensiones | Categoría | Rol |
|----|--------|-------------|-----------|-----|
| HUB-01 | suelo_central | 512 × 512 | REUTILIZABLE | Superficie principal, patrón repeat. |
| HUB-02 | pista_central | 760 × 430 | REUTILIZABLE | Medallón/alfombra pista central. |
| HUB-03 | paredes | 120 × 176 | REUTILIZABLE | Paredes modulares. |
| HUB-04 | cabina_dj | 720 × 392 | REUTILIZABLE | Cabina DJ. |
| HUB-05 | barra_bebidas | 380 × 313 | REUTILIZABLE | Barra. |
| HUB-06 | columnas | 76 × 148 | REUTILIZABLE | Columnas. |
| HUB-07 | sofas_asientos | 224 × 172 | REUTILIZABLE | Sofás. |
| HUB-08 | luminarias_neones | 67 × 152 | REUTILIZABLE | Luminarias. |
| HUB-09 | puertas_accesos | 320 × 175 | REUTILIZABLE | Puertas. |
| HUB-10 | decoracion_ambiental | 167 × 136 | REUTILIZABLE | Decoración. |

---

## 3. Calidad técnica (verificable desde manifiesto y dimensiones)

- **Protagonista HUB**: 288 × 512, pivote `bottom-center`, alfa true. Escala en mundo `drawH = 112` (cuerpo), `feetY = 505`, `midX = 140`. No espejado (espejar cambiaría tatuajes de brazo).
- **Suelo**: único recurso sin alfa del patrón (un tile alfa crearía huecos). Bordes igualados para repetición sin costura.
- **Pivotes**: la mayoría `center` o `bottom-center`; consistente con proyección isométrica.
- **Tandas**: recursos del HUB distribuidos en TANDA_01..TANDA_08; no hay evidencia de tanda faltante para los recursos usados.
- **Registrado vs no registrado**: `pm_idle_fid_00.png` y `pm_idle_00.png` tienen manifiestos de lote (`R05B...`, `R05...`) pero **no están registrados en `src/dd_asset_registry.js`**. El aprobado `protagonist_master_approved.png` tampoco aparece como entrada de HUB.

---

## 4. Problemas gráficos y artísticos detectados

1. **Protagonista del HUB no vinculado a la referencia aprobada**: el sprite renderizado (288 × 512) es distinto en escala a la lámina maestra aprobada (1672 × 941). Pendiente verificación visual de identidad (tatuajes, silueta, proporciones).
2. **Múltiples variantes del protagonista sin usar**: `pm_idle_fid_00_v1.png` y el experimento fallido de 4 frames ocupan espacio y generan confusión; deben documentarse como obsoletos, no eliminarse.
3. **Protagonista fuera del manifiesto de recursos**: no está en `src/dd_asset_registry.js`; se carga vía `new Image()` directo. Riesgo de inconsistencia entre manifiesto y render.
4. **Sin verificación visual de consistencia artística**: las clasificaciones arriba se basan en nombres, tandas y dimensiones. No se ha inspeccionado visualmente cada recurso para confirmar coherencia de estilo (art déco / industrial / decadente, sin saturación de neones genérica). Esto requiere revisión visual humana.
5. **Posible inconsistencia de escala de NPCs vs protagonista**: los NPCs (256–384 px) y el protagonista (288 × 512) se escalan a alturas de mundo distintas (102–118 vs 112); requiere verificación de que las siluetas sean legibles juntas.

---

## 5. Recursos que faltan (pendiente de confirmación en propuesta)

- Ningún recurso "faltante" bloqueante identificado aún para el HUB actual.
- Para la propuesta de rediseño (`06_PROPOSED_LAYOUT.md`) se podrá identificar necesidad de: señalización visual de la plataforma de descenso, iluminación diferencial, camino marcado. Estos son **propuestos**, no confirmados como faltantes hasta la aprobación del diseño.

---

## 6. Conclusión artística

Los recursos gráficos del Refugio son en su mayoría **reutilizables** y pertenecen a tandas coherentes (TANDA_01..08). El punto crítico es el protagonista: el sprite usado en el HUB debe confirmarse visualmente contra la referencia canónica aprobada (1672 × 941, SHA verificado). No se debe sustituir ningún recurso aprobado por placeholders ni por versiones no aprobadas. Los recursos obsoletos (experimento fallido, v1) se documentan y se conservan como referencia, no se eliminan.
