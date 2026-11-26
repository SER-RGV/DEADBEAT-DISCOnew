# FASE 1 · Biblioteca de prompts

**Versión:** 1.0.0 · **Generado:** 2026-11-26T03:37:44.025821Z

## Resumen

- Total de assets documentados: **277** (coincide con `assets/manifest.json`)
- Prompts existentes (de batches R01/R02/R03/R05/R05B): **66**
- Prompts generados desde plantilla v1: **211**
- Archivo maestro legible por herramientas: [`assets/prompts.json`](../../assets/prompts.json) (versión 1.0.0)

## Estructura

| Archivo | Categorías | Nº assets |
|---|---|---|
| [`01_personajes_y_npcs.md`](01_personajes_y_npcs.md) | Personajes, atuendos y NPCs | 31 |
| [`02_enemigos.md`](02_enemigos.md) | Enemigos | 24 |
| [`03_jefes.md`](03_jefes.md) | Jefes | 42 |
| [`04_entornos_suelos.md`](04_entornos_suelos.md) | Suelos, muros y entornos | 32 |
| [`05_props_pickups.md`](05_props_pickups.md) | Props y pickups | 54 |
| [`06_armas_efectos.md`](06_armas_efectos.md) | Armas y efectos | 38 |
| [`07_interfaz_logos.md`](07_interfaz_logos.md) | Interfaz y logos | 21 |
| [`08_cinematicas.md`](08_cinematicas.md) | Cinemáticas | 35 |

> Los bloques de estilo reutilizables y la paleta por círculo están en [`00_STYLE_TEMPLATE.md`](00_STYLE_TEMPLATE.md).

## Convenciones de ficha

Cada asset tiene:
- **ID manifest**, **nombre**, **función en el juego** (sistema/runtime que lo consume)
- **Dimensiones** y **pivote** exactos (según contrato de 03_ASSET_CONTRACT.md)
- **Vistas necesarias**: estados/cardinales (walk/windup/attack/death; intacto/roto; open/closed; etc.)
- **Paleta/círculo** al que pertenece (si aplica)
- **Reglas de silueta y legibilidad** específicas
- **Fondo**: verde croma #00ff00 (se elimina en postproceso) o transparente
- **Prompt positivo**, **prompt negativo** y **referencias/semilla**
