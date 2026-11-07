# VISUAL REFERENCE GUIDE — DEADBEAT DISCO

## Fuentes Artísticas Oficiales (Obligatorias)

| ID Referencia | Archivo en Repositorio | Resolución | Contenido Extraído |
|---|---|---|---|
| `REF_01` | `assets/references/REF_01_neon_fox_disco_muerto.png` | 1672×941 | Key art cinematográfico del club infernal, bola de espejos magenta, cabina DJ al fondo, estandartes del zorro coronado, protagonista tatuado sentado en escalinata neón, botellas y humo volumétrico cian/rosa. |
| `REF_02` | `assets/references/REF_02_logotipo_graffiti.png` | 1536×1024 | Logotipo maestro *DEADBEAT DISCO*: máscara geométrica de zorro crema-dorado con ojos magenta, corona fucsia de tres puntas, círculo-diana neón y lettering brush *DEADBEAT* (magenta) / *DISCO* (crema con goteos). |
| `REF_03` | `assets/references/REF_03_circulos_bosses_salas.png` | 736×645 | Franja superior: arquitectura y paleta de los 9 círculos (`I Lujuria`, `II Gula`, `III Avaricia`, `IV Ira`, `V Herejía`, `VI Violencia`, `VII Fraude`, `VIII Traición`, `IX Núcleo`). Franja central: diseños íntegros y siluetas de los Jefes `I–IX`. Franja inferior: 4 salas isométricas en juego con iluminación volumétrica. |
| `REF_04` | `assets/references/REF_04_banner_protagonista.png` | 823×212 | Identidad del protagonista de perfil tres cuartos fumando junto al ventanal sobre la pista: pelo negro despeinado en puntas, chaleco negro sin mangas con ribete carmesí, tatuajes densos en tinta negra en ambos brazos, guantes sin dedos, botas tácticas y lema *DESCENSO · MÚSICA · CAOS · REDENCIÓN*. |
| `REF_05` | `assets/references/REF_05_master_sheet_assets_ui_hub.png` | 1536×559 | Hoja maestra unificada: 12 materiales de suelo, 6 muros modulares góticos, 8 puertas/umbrales, 20+ props de club, catálogo de armas ilustradas, pickups/reliquias, efectos de disparo/impacto/habilidad, HUD unificado, Menú principal, Inventario/Tienda, Diálogo de DJ, Mapa de Progresión en torre e interior completo del *Refugio / HUB*. |

## Reglas Estrictas de Dirección Artística

1. **Cero Pixel Art:** Prohibido `imageSmoothingEnabled = false`, `image-rendering: pixelated`, escalado por vecino más próximo o bloques geométricos de relleno.
2. **Ilustración Digital con Tinta Oscura:** Contorno cerrado en tinta negra profunda (`#08040e`), volúmenes pintados con iluminación principal NO y luz de recorte (*rim light*) neón magenta (`#ff2d7a`), rosa (`#f472b6`), cian (`#22d3ee`) y oro (`#facc15`).
3. **Perspectiva Isométrica / 2.5D:** Suelos con profundidad y reflejos especulares, muros modulares con relieve arquitectónico, mobiliario en proyección 2:1 coherente con las salas de `REF_03` y `REF_05`.
4. **Transparencia Limpia:** Todo personaje, enemigo, jefe, arma, pickup, prop, puerta y efecto se entrega como PNG RGBA independiente sin dameros horneados ni halos de recorte.
