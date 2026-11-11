# Fase 08B — Inventario de recursos cinematográficos

**Estado: preparación; Fase 08 abierta y PR #17 en borrador.** Auditoría del árbol actual; no se han modificado imágenes, audio, manifiesto, motor, HUB ni progresión. La aprobación artística no se deduce de la existencia de archivos o de que carguen. [Galería comparativa original/reconstrucción](FASE_08B_GALERIA_FONDOS.html).

## Método y alcance

Se leyó `assets/cinematics/manifest.json` completo y se buscaron recursivamente cadenas de ruta `assets/`; se compararon `file`/`fallback` de las 34 entradas con `src/dd_asset_registry.js`. Con Pillow se decodificó cada imagen inventariada (en GIF, transparencia del primer fotograma; se indica el número de fotogramas), se midieron dimensiones, transparencia y bytes, y se compararon píxeles de sprites. Transparencia significa píxeles realmente menores de alfa 255, incluso si el PNG es RGB con `tRNS`; no demuestra que un recorte sea correcto. En Chromium headless/SwiftShader `tools/qa/test_cinematic_resource_inventory.mjs` decodificó las **65 rutas únicas** `file`, `fallback` y `thumbnail` y encontró disponibles los **34 IDs** del registro, sin errores de página. Es prueba técnica con recursos locales, no aprobación visual ni prueba de todos los fallbacks por conmutación.

Estados usados: **ORIGINAL CONSERVADO** = archivo previo preservado, no certificación de procedencia artística; **RECONSTRUCCIÓN** = composición nueva; **DERIVADO AJUSTADO** = transformación de existente; **CAPA INDEPENDIENTE** = archivo independiente técnicamente, no necesariamente compatible con la reconstrucción; **PROVISIONAL** = disponible pero no definitivo; **FALTANTE** = no localizado como recurso apropiado; **PENDIENTE DE APROBACIÓN** = requiere decisión artística/canónica. Los estados pueden coexistir.

## Diagnóstico ejecutivo

- Seis `rebuild_*.png`: **RECONSTRUCCIÓN / PROVISIONAL / PENDIENTE DE APROBACIÓN**, RGB opacos 1376×768, relación 43:24 (aprox. 16:9), sin capas genuinas. Son utilizables provisionalmente, pero inferiores al objetivo 2560×1440 (escalado horizontal 1,86×; 1,83× en vertical) y tienen poco margen para zoom/overscan. Para definitivos se requieren originales o reconstrucciones nuevas a resolución objetivo y capas auténticas; un reescalado no crea detalle.
- Los seis respaldos `cine_bgNN_*.png` en `final/` son **ORIGINAL CONSERVADO / PROVISIONAL / PENDIENTE DE APROBACIÓN**, composiciones completas RGB 2560×1440, pero incorporan marco, muestras de color y, en algunos, restos de rótulos; resolución nominal no equivale a arte limpio de producción. No se usan como capas frontales.
- 18 capas históricas 1920×1080 sí son archivos individuales y cargan; representan composiciones anteriores, en gran parte gráficos esquemáticos. **CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL**, no separaciones del `rebuild`. Una capa opaca puede ser una base; no demuestra recorte transparente ni paralaje del maestro. Se usan solo si falla el maestro. No hay paralaje real del arte reconstruido.
- Las imágenes `final/.../01_*.png`, etc., son otros recursos anteriores: algunas son opacas aunque el nombre sugiera capa; no se identifican como separaciones genuinas del `rebuild`. Los respaldos transparentes de 1×1 son marcadores, no contenido visual.

## Seis fondos: revisión visual y técnica

Comparación humana de los seis pares, a escala de visión general: mantienen arquitectura gótica, motivos dorados y presencia de altavoces, pero la reconstrucción reduce mucho el neón saturado y la energía de club de los originales. La continuidad espacial y el canon requieren validación de dirección: las vistas exteriores no implican que el protagonista venga de fuera. No se aprueba ningún diseño automáticamente.

| BG | Original de respaldo → reconstrucción actual | Revisión de dirección; necesidad |
|---|---|---|
| cine_bg01_city | `assets/cinematics/backgrounds/final/cine_bg01_city/cine_bg01_city.png` → `assets/cinematics/backgrounds/final/cine_bg01_city/rebuild_city.png` | Ciudad arquitectónica oscura con puentes y tuberías; se pierde el neón dominante y la lectura urbana/club del original. Confirmar identidad y ambigüedad interior/exterior; capas de cielo, masa urbana y primer término necesarias. |
| cine_bg02_club_exterior | `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/cine_bg02_club_exterior.png` → `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/rebuild_exterior.png` | Fachada monumental conserva arco/rosetón, pero la entrada perdió luz de club; es más parecida a una catedral y debe validarse la identidad de discoteca. Separar fachada, portal y pavimento cuando se diseñen. |
| cine_bg03_entrance | `assets/cinematics/backgrounds/final/cine_bg03_entrance/cine_bg03_entrance.png` → `assets/cinematics/backgrounds/final/cine_bg03_entrance/rebuild_entrance.png` | Corredor con bóvedas, altavoces y punto de fuga; próximo al ambiente gótico pero más oscuro y vacío. No contiene una señal REFUGIO física verificable: diseñar señal, profundidad y oclusión coherentes. |
| cine_bg04_main_hall | `assets/cinematics/backgrounds/final/cine_bg04_main_hall/cine_bg04_main_hall.png` → `assets/cinematics/backgrounds/final/cine_bg04_main_hall/rebuild_hall.png` | Vista elevada de gran nave y lámpara; conserva amplitud y arquitectura, pero la fiesta y el escenario son mucho menos legibles. Se requiere nave, escenario/luces y primer plano compatibles. |
| cine_bg05_dancefloor | `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/cine_bg05_dancefloor.png` → `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/rebuild_dancefloor.png` | Suelo circular y torres de sonido presentes; la composición reconstruida parece un salón vacío más que pista de fiesta. Necesita público/energía y representación legible de anomalía, sin capas fabricadas desde el maestro. |
| cine_bg06_hero | `assets/cinematics/backgrounds/final/cine_bg06_hero/cine_bg06_hero.png` → `assets/cinematics/backgrounds/final/cine_bg06_hero/rebuild_hero.png` | Rosetón y altavoces proporcionan un fondo para el protagonista, no personaje ni pose. Más sobrio que original; reservar espacio para protagonista y logo, validar continuidad con el descenso. |

### Estado de las capas declaradas por escena

Todas las rutas principales y secundarias enumeradas abajo existen y se decodificaron en navegador. Los `file` de las 18 entradas corresponden a capas históricas fuera de `final/`; el respaldo de la primera capa de cada escena es una imagen opaca 1920×1080 de `final/`, y el de las otras doce es un PNG totalmente transparente de 1×1: carga, pero no aporta contenido. Las capas 01 de BG02, BG05 y BG06 se declaran `alpha: true`, pero sus píxeles son totalmente opacos. Los modos pueden tener canal alfa sin usarlo. En la ruta de maestro normal, `active_layers` está vacío y las capas antiguas no se dibujan sobre él.

| Escena / ID | `file` y propiedades reales | `fallback` y propiedades reales | Estado |
|---|---|---|---|
| cine_bg01_city_01_sky_moon_atmosphere | `assets/cinematics/backgrounds/cine_bg01_city/layer_01_sky.png`<br>PNG 1920×1080; opaco; 15.107 B | `assets/cinematics/backgrounds/final/cine_bg01_city/01_sky_moon_atmosphere.png`<br>PNG 1920×1080; opaco; 2.620.376 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg01_city_02_gothic_skyline_architecture | `assets/cinematics/backgrounds/cine_bg01_city/layer_02_skyline.png`<br>PNG 1920×1080; transparencia 34.3%; parcial 0.1%; 92.747 B | `assets/cinematics/backgrounds/final/cine_bg01_city/fallback_transparent.png`<br>PNG 1×1; 100% transparente; 244 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg01_city_03_foreground_industrial_pipes | `assets/cinematics/backgrounds/cine_bg01_city/layer_03_fog_haze.png`<br>PNG 1920×1080; transparencia 66.7%; parcial 33.3%; 40.344 B | `assets/cinematics/backgrounds/final/cine_bg01_city/fallback_transparent.png`<br>PNG 1×1; 100% transparente; 244 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg02_club_exterior_01_gothic_cathedral_facade | `assets/cinematics/backgrounds/cine_bg02_club_exterior/layer_01_wall.png`<br>PNG 1920×1080; opaco; 21.485 B | `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/01_gothic_cathedral_facade.png`<br>PNG 1920×1080; opaco; 2.672.009 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg02_club_exterior_02_portal_speakers_entrance | `assets/cinematics/backgrounds/cine_bg02_club_exterior/layer_02_portal.png`<br>PNG 1920×1080; transparencia 81.5%; parcial 3.7%; 35.775 B | `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/fallback_transparent.png`<br>PNG 1×1; 100% transparente; 244 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg02_club_exterior_03_wet_pavement_reflections | `assets/cinematics/backgrounds/cine_bg02_club_exterior/layer_03_ground.png`<br>PNG 1920×1080; transparencia 77.8%; parcial 0.0%; 33.600 B | `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/fallback_transparent.png`<br>PNG 1×1; 100% transparente; 244 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg03_entrance_01_vaulted_hallway_depth | `assets/cinematics/backgrounds/cine_bg03_entrance/layer_01_back_corridor.png`<br>PNG 1920×1080; opaco; 65.697 B | `assets/cinematics/backgrounds/final/cine_bg03_entrance/01_vaulted_hallway_depth.png`<br>PNG 1920×1080; opaco; 2.655.434 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg03_entrance_02_midground_columns_banners | `assets/cinematics/backgrounds/cine_bg03_entrance/layer_02_mid_columns.png`<br>PNG 1920×1080; transparencia 89.4%; parcial 2.7%; 18.659 B | `assets/cinematics/backgrounds/final/cine_bg03_entrance/fallback_transparent.png`<br>PNG 1×1; 100% transparente; 244 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg03_entrance_03_foreground_pillars_occlusion | `assets/cinematics/backgrounds/cine_bg03_entrance/layer_03_foreground_pillars.png`<br>PNG 1920×1080; transparencia 81.0%; parcial 0.0%; 15.604 B | `assets/cinematics/backgrounds/final/cine_bg03_entrance/fallback_transparent.png`<br>PNG 1×1; 100% transparente; 244 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg04_main_hall_01_cathedral_nave_vaults | `assets/cinematics/backgrounds/cine_bg04_main_hall/layer_01_cathedral_vault.png`<br>PNG 1920×1080; opaco; 133.729 B | `assets/cinematics/backgrounds/final/cine_bg04_main_hall/01_cathedral_nave_vaults.png`<br>PNG 1920×1080; opaco; 2.693.718 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg04_main_hall_02_laser_beams_equalizer | `assets/cinematics/backgrounds/cine_bg04_main_hall/layer_02_light_beams.png`<br>PNG 1920×1080; transparencia 75.7%; parcial 24.1%; 91.901 B | `assets/cinematics/backgrounds/final/cine_bg04_main_hall/fallback_transparent.png`<br>PNG 1×1; 100% transparente; 244 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg04_main_hall_03_chandeliers_stage_framing | `assets/cinematics/backgrounds/cine_bg04_main_hall/layer_03_chandeliers_pillars.png`<br>PNG 1920×1080; transparencia 71.9%; parcial 3.9%; 75.482 B | `assets/cinematics/backgrounds/final/cine_bg04_main_hall/fallback_transparent.png`<br>PNG 1×1; 100% transparente; 244 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg05_dancefloor_01_astrological_dancefloor_grid | `assets/cinematics/backgrounds/cine_bg05_dancefloor/layer_01_floor_grid.png`<br>PNG 1920×1080; opaco; 156.661 B | `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/01_astrological_dancefloor_grid.png`<br>PNG 1920×1080; opaco; 2.755.408 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg05_dancefloor_02_sound_towers_dj_stage | `assets/cinematics/backgrounds/cine_bg05_dancefloor/layer_02_sound_towers.png`<br>PNG 1920×1080; transparencia 82.4%; parcial 0.0%; 57.056 B | `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/fallback_transparent.png`<br>PNG 1×1; 100% transparente; 244 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg05_dancefloor_03_tables_foreground_ambient | `assets/cinematics/backgrounds/cine_bg05_dancefloor/layer_03_ambient_glow.png`<br>PNG 1920×1080; transparencia 81.9%; parcial 18.1%; 82.851 B | `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/fallback_transparent.png`<br>PNG 1×1; 100% transparente; 244 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg06_hero_01_axial_portal_rosette | `assets/cinematics/backgrounds/cine_bg06_hero/layer_01_arena_bokeh.png`<br>PNG 1920×1080; opaco; 121.332 B | `assets/cinematics/backgrounds/final/cine_bg06_hero/01_axial_portal_rosette.png`<br>PNG 1920×1080; opaco; 2.487.316 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg06_hero_02_hero_rimlight_spotlight | `assets/cinematics/backgrounds/cine_bg06_hero/layer_02_hero_backlight.png`<br>PNG 1920×1080; transparencia 78.4%; parcial 21.1%; 164.617 B | `assets/cinematics/backgrounds/final/cine_bg06_hero/fallback_transparent.png`<br>PNG 1×1; 100% transparente; 244 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |
| cine_bg06_hero_03_flanking_speakers_framing | `assets/cinematics/backgrounds/cine_bg06_hero/layer_03_framing.png`<br>PNG 1920×1080; transparencia 67.5%; parcial 0.1%; 94.176 B | `assets/cinematics/backgrounds/final/cine_bg06_hero/fallback_transparent.png`<br>PNG 1×1; 100% transparente; 244 B | CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL |

## Protagonista

El inventario de bytes/dimensiones y transparencia de cada archivo aparece en el anexo. Los cinco originales son PNG 224×320 con transparencia. `hero_idle_00.png` y `hero_walk_00`–`03.png` son copias en píxeles de los `player_*` correspondientes (verificado con RGBA; no significa recuperación). Las cuatro variantes `grounded` conservan exactamente los píxeles mediante traslación de **8 px hacia abajo** dentro del lienzo: el límite inferior del alfa pasa de y=312 a y=320. **DERIVADO AJUSTADO / PROVISIONAL**; esto no repara transparencia, anatomía ni coherencia de vestuario. No se han recuperado fotogramas íntegros en este parche.

| Fotograma | Evaluación | Estado / acción |
|---|---|---|
| `player_idle_00` / `hero_idle_00` | Transparencias internas graves; no equivale a un reposo completo. | ORIGINAL CONSERVADO / FALTANTE: recuperar idle oficial íntegro. |
| `player_walk_00` y `hero_walk_00_grounded` | Figura visible íntegra para el paliativo actual. | ORIGINAL CONSERVADO / DERIVADO AJUSTADO / PROVISIONAL; validar continuidad del ciclo recuperado. |
| `player_walk_01` y `hero_walk_01_grounded` | Figura visible íntegra para el paliativo actual. | ORIGINAL CONSERVADO / DERIVADO AJUSTADO / PROVISIONAL; validar continuidad. |
| `player_walk_02` y `hero_walk_02_grounded` | Figura visible, pero vestuario/silueta difiere de 00/01. | ORIGINAL CONSERVADO / DERIVADO AJUSTADO / PROVISIONAL; recuperar versión oficial del mismo set o aprobar explícitamente la diferencia. |
| `player_walk_03` y `hero_walk_03_grounded` | Transparencia interna grave; trasladar lienzo conserva el defecto. | ORIGINAL CONSERVADO / DERIVADO AJUSTADO / FALTANTE: recuperar paso 03 íntegro y coherente. |

El ciclo provisional de intro usa 00/01/02/01; en el HUB existe un ajuste visual local autorizado, no una reparación de los originales. Para un ciclo sin saltos hace falta **idle íntegro, walk_03 íntegro y walk_02 correspondiente al mismo diseño** (o confirmación del responsable de arte); contrastar además 00/01 y los cuatro pivotes/dimensiones con el set oficial completo. No se ha localizado una pose oficial de apuntado sin fogonazo: **FALTANTE**; `hero_shoot_00` contiene fogonazo y no sirve para simularla. Recuperar solo si existe un original autorizado; no inventar pose.

## Audio narrativo

No se localizaron archivos `.wav`, `.mp3`, `.ogg`, `.m4a`, `.aac`, `.flac`, `.opus`, `.mid` ni `.midi` en el árbol de assets ni entre los archivos versionados; también se buscaron etiquetas `<audio` y `data:audio/` en el HTML legado sin coincidencias. Alcance: estas búsquedas no demuestran que no existan sonidos generados por código ni audio en otros formatos/externo. El código heredado `backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html` contiene sintetizador Web Audio (`DDC_COVER.music`, osciladores y eventos de UI); el juego tiene sistema sonoro propio. Son **ORIGINAL CONSERVADO / PROVISIONAL**, no una partitura narrativa identificada. La intro atenúa la música existente por tramos; no hay prueba de escucha, ni sincronización musical garantizada.

| Necesidad | Disponibilidad identificada | Estado / entrega requerida |
|---|---|---|
| Motivo musical introducción | Música de menú sintetizada existente, no motivo compuesto para la intro. | FALTANTE / PENDIENTE DE APROBACIÓN: tema o stems licenciados, mezcla y marcas temporales. |
| Repetición de última nota antes de completar la frase | No se identificó recurso ni evento narrativo específico. | FALTANTE: repetición y cola separables o integradas en partitura, con punto de entrada. |
| Anomalía musical | No se identificó nota o evento específico. | FALTANTE: variante desafinada/irregular y transición con referencia temporal. |
| Drop de pista | Existe pulso visual; no se ha identificado un drop sonoro narrativo sincronizado. | FALTANTE: golpe/transición musical con stems y referencia de sincronía. |
| Ruido seco fuera de plano | Hay sonidos de interfaz sintetizados, no se identificó ruido dramático correspondiente. | FALTANTE: efecto seco localizado y cola, con volumen/espacio autorizados. |
| Transición hacia Refugio | Atenuación provisional de música existente, no diseño sonoro de descenso/entrega. | FALTANTE: capas mecánicas/ambiente y resolución sonora coherente con HUB. |

No se añade música, efecto ni archivo ficticio. Entrega recomendada: archivos maestros sin pérdida y versiones de distribución, duración, licencia, puntos de sincronía, stems y nivel nominal; probar silencio/autoplay/skip sin impedir juego. La escucha y aprobación están pendientes.

## Descenso visual: recursos necesarios

`assets/environments/threshold_descent_pad.png` existe como elemento estático isométrico del juego (ver anexo; **ORIGINAL CONSERVADO / PENDIENTE DE APROBACIÓN**); por sí solo no es un mecanismo de apertura ni demuestra compatibilidad espacial y estilística con la cámara cinematográfica o con el HUB. La intro actual termina en un fundido al HUB real: no hay descenso físico representado.

**FALTANTE / PENDIENTE DE APROBACIÓN**, producciones independientes y coherentes entre sí:
1. Apertura de suelo de pista: borde fijo, secciones móviles/mascarillas, suelo interior y estados cerrado/abierto, con geometría/pivotes y continuidad con BG05.
2. Plataforma descendente: superficie, borde/estructura, anclaje del protagonista, partes que se ocultan delante/detrás y sombras; vista y escala acordes al trayecto. Decidir si se aprovecha el pad existente, sin alterar ese original.
3. Pozo vertical real: fondo profundo continuo con overscan y segmentos de arquitectura **distintos** para planos de profundidad; puertas, guías o vigas frontales con transparencias auténticas, no duplicación de un fondo plano ni alfa inventado.
4. Arranque y aterrizaje: elementos del borde superior, destino compatible con el Refugio real, oclusiones, luz/sombras y referencias de escala, eje, horizonte, altura y puntos de empalme entre cámara de pista, trayecto y HUB.
5. Guía de animación/cámara y tiempos: desplazamiento relativo de plataforma y capas, pruebas de oclusión y transición; validación de control bloqueado hasta entrega. Una panorámica de una imagen única no es un descenso físico.

## Manifiesto: errores y discrepancias

- **Rutas rotas: ninguna** entre las cadenas de ruta `assets/` encontradas en `manifest.json`; las 65 rutas únicas `file`/`fallback`/`thumbnail` se decodificaron por HTTP en Chromium. `$schema` es una URL de esquema, no ruta local y no se comprobó su disponibilidad de red. `file` y `fallback` coinciden con registro real para las 34 entradas. No se cambió el manifiesto.
- Tres capas 01 declaran `alpha: true` pero son visualmente opacas (BG02/BG05/BG06); la canalización tiene alfa pero todos los píxeles son 255. Los 12 respaldos transparentes de capa 02/03 son marcadores 1×1 y no recuperan arquitectura. Los respaldos de capa 01 son imágenes opacas antiguas, no recortes del rebuild.
- Los `time_range` `00:35`, `00:70` ... `03:50` **no son marcas mm:ss válidas** para una secuencia de 35 s; parecen representar décimas de segundo sin convención explícita. Las duraciones numéricas suman 35 s; la cámara usa límites numéricos propios, no esos textos.
- `characters` utiliza `hero_walk`, `hero_idle`, `hero_shoot` sin entradas homónimas en `assets`; `effects` enumera nombres conceptuales sin entradas homónimas (ver anexo). No son rutas de archivo y no se han tratado como 404; **PENDIENTE DE APROBACIÓN** como esquema/documentación. La cámara utiliza IDs concretos distintos; el manifiesto de planos no prueba que esos efectos o poses existan. En particular, 08/09 describen disparo/apuntado, mientras el render actual usa espera sin fogonazo.
- El nombre de archivo histórico `layer_03_fog_haze.png` se asigna al ID que describe tuberías; `layer_03_ambient_glow.png` al que describe mesas; nombres y semántica requieren revisión, no un cambio automático de ruta.

## Lista de producción / recuperación priorizada

1. **FALTANTE:** recuperar `player_idle_00` y `player_walk_03` íntegros de la serie oficial, con alfa correcto. **PENDIENTE DE APROBACIÓN:** recuperar `player_walk_02` del mismo vestuario o confirmar que el actual es correcto; validar 00/01 y ciclo/pivotes. Recuperar pose de apuntado sin disparo si existe y está autorizada.
2. **FALTANTE / PENDIENTE DE APROBACIÓN:** seis masters limpios BG01–BG06 a 2560×1440 o más, conservando identidad visual aprobada; cada entrega debe incluir composición de referencia, área segura y overscan. No tratar como final ninguno de los `rebuild` actuales.
3. **FALTANTE:** sets de capas genuinas compatibles por escena: BG01 cielo/ciudad/primer plano; BG02 fachada/portal/pavimento; BG03 fondo/columnas/primer plano más señal física; BG04 nave/escenario y luz/enmarque; BG05 base de pista/público y escenario/primer plano o efectos; BG06 arquitectura/iluminación/enmarque. Base opaca y elementos transparentes reales según función; fondos ocultos completos bajo oclusiones y prueba de composición.
4. **FALTANTE:** kit de descenso de los cinco puntos anteriores, incluyendo apertura, plataforma, pozo multicapa, empalme espacial y guía de cámara; aprobación antes de implementación.
5. **FALTANTE:** motivo, repetición de nota, anomalía, drop, ruido seco y transición hacia Refugio, con stems/timing y derechos documentados.
6. **PENDIENTE DE APROBACIÓN:** dirección comparada de fondos, paleta/legibilidad de club, letrero físico, terminología del HUB y coherencia canónica; auditar el logo y condiciones de entrega junto con dirección. Las discrepancias de esquema y metadatos deben resolverse en un cambio separado que no rompa rutas ni fallbacks.

## Anexo A — Rutas del manifiesto: imágenes y propiedades reales

Cada fila es una ruta única; los usos referencian `file`, `fallback` o `thumbnail`. Estado según uso: maestros reconstruidos = RECONSTRUCCIÓN / PROVISIONAL; originales de respaldo = ORIGINAL CONSERVADO / PROVISIONAL; capas históricas = CAPA INDEPENDIENTE / ORIGINAL CONSERVADO / PROVISIONAL; placeholders de 1×1 = PROVISIONAL; sprites y demás se detallan arriba. Todas las decisiones artísticas permanecen PENDIENTE DE APROBACIÓN.

| Ruta | Usos (ID/campo) | Formato, dimensiones, alfa real y bytes |
|---|---|---|
| `assets/characters/player_idle_00.png` | hero_idle_00/fallback | PNG 224×320; transparencia 91.0%; parcial 8.8%; 8.034 B |
| `assets/characters/player_shoot_00.png` | hero_shoot_00/fallback | PNG 240×320; transparencia 74.6%; parcial 24.5%; 11.255 B |
| `assets/cinematics/backgrounds/cine_bg01_city/layer_01_sky.png` | cine_bg01_city_01_sky_moon_atmosphere/file | PNG 1920×1080; opaco; 15.107 B |
| `assets/cinematics/backgrounds/cine_bg01_city/layer_02_skyline.png` | cine_bg01_city_02_gothic_skyline_architecture/file | PNG 1920×1080; transparencia 34.3%; parcial 0.1%; 92.747 B |
| `assets/cinematics/backgrounds/cine_bg01_city/layer_03_fog_haze.png` | cine_bg01_city_03_foreground_industrial_pipes/file | PNG 1920×1080; transparencia 66.7%; parcial 33.3%; 40.344 B |
| `assets/cinematics/backgrounds/cine_bg02_club_exterior/layer_01_wall.png` | cine_bg02_club_exterior_01_gothic_cathedral_facade/file | PNG 1920×1080; opaco; 21.485 B |
| `assets/cinematics/backgrounds/cine_bg02_club_exterior/layer_02_portal.png` | cine_bg02_club_exterior_02_portal_speakers_entrance/file | PNG 1920×1080; transparencia 81.5%; parcial 3.7%; 35.775 B |
| `assets/cinematics/backgrounds/cine_bg02_club_exterior/layer_03_ground.png` | cine_bg02_club_exterior_03_wet_pavement_reflections/file | PNG 1920×1080; transparencia 77.8%; parcial 0.0%; 33.600 B |
| `assets/cinematics/backgrounds/cine_bg03_entrance/layer_01_back_corridor.png` | cine_bg03_entrance_01_vaulted_hallway_depth/file | PNG 1920×1080; opaco; 65.697 B |
| `assets/cinematics/backgrounds/cine_bg03_entrance/layer_02_mid_columns.png` | cine_bg03_entrance_02_midground_columns_banners/file | PNG 1920×1080; transparencia 89.4%; parcial 2.7%; 18.659 B |
| `assets/cinematics/backgrounds/cine_bg03_entrance/layer_03_foreground_pillars.png` | cine_bg03_entrance_03_foreground_pillars_occlusion/file | PNG 1920×1080; transparencia 81.0%; parcial 0.0%; 15.604 B |
| `assets/cinematics/backgrounds/cine_bg04_main_hall/layer_01_cathedral_vault.png` | cine_bg04_main_hall_01_cathedral_nave_vaults/file | PNG 1920×1080; opaco; 133.729 B |
| `assets/cinematics/backgrounds/cine_bg04_main_hall/layer_02_light_beams.png` | cine_bg04_main_hall_02_laser_beams_equalizer/file | PNG 1920×1080; transparencia 75.7%; parcial 24.1%; 91.901 B |
| `assets/cinematics/backgrounds/cine_bg04_main_hall/layer_03_chandeliers_pillars.png` | cine_bg04_main_hall_03_chandeliers_stage_framing/file | PNG 1920×1080; transparencia 71.9%; parcial 3.9%; 75.482 B |
| `assets/cinematics/backgrounds/cine_bg05_dancefloor/layer_01_floor_grid.png` | cine_bg05_dancefloor_01_astrological_dancefloor_grid/file | PNG 1920×1080; opaco; 156.661 B |
| `assets/cinematics/backgrounds/cine_bg05_dancefloor/layer_02_sound_towers.png` | cine_bg05_dancefloor_02_sound_towers_dj_stage/file | PNG 1920×1080; transparencia 82.4%; parcial 0.0%; 57.056 B |
| `assets/cinematics/backgrounds/cine_bg05_dancefloor/layer_03_ambient_glow.png` | cine_bg05_dancefloor_03_tables_foreground_ambient/file | PNG 1920×1080; transparencia 81.9%; parcial 18.1%; 82.851 B |
| `assets/cinematics/backgrounds/cine_bg06_hero/layer_01_arena_bokeh.png` | cine_bg06_hero_01_axial_portal_rosette/file | PNG 1920×1080; opaco; 121.332 B |
| `assets/cinematics/backgrounds/cine_bg06_hero/layer_02_hero_backlight.png` | cine_bg06_hero_02_hero_rimlight_spotlight/file | PNG 1920×1080; transparencia 78.4%; parcial 21.1%; 164.617 B |
| `assets/cinematics/backgrounds/cine_bg06_hero/layer_03_framing.png` | cine_bg06_hero_03_flanking_speakers_framing/file | PNG 1920×1080; transparencia 67.5%; parcial 0.1%; 94.176 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/01_sky_moon_atmosphere.png` | cine_bg01_city_01_sky_moon_atmosphere/fallback | PNG 1920×1080; opaco; 2.620.376 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/cine_bg01_city.png` | cine_bg01_city/fallback | PNG 2560×1440; opaco; 4.140.564 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/fallback_transparent.png` | cine_bg01_city_02_gothic_skyline_architecture/fallback, cine_bg01_city_03_foreground_industrial_pipes/fallback | PNG 1×1; 100% transparente; 244 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/rebuild_city.png` | cine_bg01_city/file | PNG 1376×768; opaco; 2.425.837 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/01_gothic_cathedral_facade.png` | cine_bg02_club_exterior_01_gothic_cathedral_facade/fallback | PNG 1920×1080; opaco; 2.672.009 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/cine_bg02_club_exterior.png` | cine_bg02_club_exterior/fallback | PNG 2560×1440; opaco; 4.236.184 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/fallback_transparent.png` | cine_bg02_club_exterior_02_portal_speakers_entrance/fallback, cine_bg02_club_exterior_03_wet_pavement_reflections/fallback | PNG 1×1; 100% transparente; 244 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/rebuild_exterior.png` | cine_bg02_club_exterior/file | PNG 1376×768; opaco; 2.493.394 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/01_vaulted_hallway_depth.png` | cine_bg03_entrance_01_vaulted_hallway_depth/fallback | PNG 1920×1080; opaco; 2.655.434 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/cine_bg03_entrance.png` | cine_bg03_entrance/fallback | PNG 2560×1440; opaco; 4.211.523 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/fallback_transparent.png` | cine_bg03_entrance_02_midground_columns_banners/fallback, cine_bg03_entrance_03_foreground_pillars_occlusion/fallback | PNG 1×1; 100% transparente; 244 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/rebuild_entrance.png` | cine_bg03_entrance/file | PNG 1376×768; opaco; 2.430.258 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/01_cathedral_nave_vaults.png` | cine_bg04_main_hall_01_cathedral_nave_vaults/fallback | PNG 1920×1080; opaco; 2.693.718 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/cine_bg04_main_hall.png` | cine_bg04_main_hall/fallback | PNG 2560×1440; opaco; 4.266.607 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/fallback_transparent.png` | cine_bg04_main_hall_02_laser_beams_equalizer/fallback, cine_bg04_main_hall_03_chandeliers_stage_framing/fallback | PNG 1×1; 100% transparente; 244 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/rebuild_hall.png` | cine_bg04_main_hall/file | PNG 1376×768; opaco; 2.618.748 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/01_astrological_dancefloor_grid.png` | cine_bg05_dancefloor_01_astrological_dancefloor_grid/fallback | PNG 1920×1080; opaco; 2.755.408 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/cine_bg05_dancefloor.png` | cine_bg05_dancefloor/fallback | PNG 2560×1440; opaco; 4.384.380 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/fallback_transparent.png` | cine_bg05_dancefloor_02_sound_towers_dj_stage/fallback, cine_bg05_dancefloor_03_tables_foreground_ambient/fallback | PNG 1×1; 100% transparente; 244 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/rebuild_dancefloor.png` | cine_bg05_dancefloor/file | PNG 1376×768; opaco; 2.427.118 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/01_axial_portal_rosette.png` | cine_bg06_hero_01_axial_portal_rosette/fallback | PNG 1920×1080; opaco; 2.487.316 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/cine_bg06_hero.png` | cine_bg06_hero/fallback | PNG 2560×1440; opaco; 3.894.230 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/fallback_transparent.png` | cine_bg06_hero_02_hero_rimlight_spotlight/fallback, cine_bg06_hero_03_flanking_speakers_framing/fallback | PNG 1×1; 100% transparente; 244 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/rebuild_hero.png` | cine_bg06_hero/file | PNG 1376×768; opaco; 2.409.766 B |
| `assets/cinematics/characters/protagonist/hero_idle_00.png` | hero_idle_00/file | PNG 224×320; transparencia 91.0%; parcial 8.8%; 8.034 B |
| `assets/cinematics/characters/protagonist/hero_shoot_00.png` | hero_shoot_00/file | PNG 240×320; transparencia 74.6%; parcial 24.5%; 11.255 B |
| `assets/cinematics/characters/protagonist/hero_walk_00.png` | hero_walk_00/fallback | PNG 224×320; transparencia 76.9%; parcial 22.8%; 10.816 B |
| `assets/cinematics/characters/protagonist/hero_walk_00_grounded.png` | hero_walk_00/file | PNG 224×320; transparencia 76.9%; parcial 22.8%; 10.675 B |
| `assets/cinematics/characters/protagonist/hero_walk_01.png` | hero_walk_01/fallback | PNG 224×320; transparencia 75.6%; parcial 24.1%; 11.117 B |
| `assets/cinematics/characters/protagonist/hero_walk_01_grounded.png` | hero_walk_01/file | PNG 224×320; transparencia 75.6%; parcial 24.1%; 10.976 B |
| `assets/cinematics/characters/protagonist/hero_walk_02.png` | hero_walk_02/fallback | PNG 224×320; transparencia 75.3%; parcial 24.2%; 10.117 B |
| `assets/cinematics/characters/protagonist/hero_walk_02_grounded.png` | hero_walk_02/file | PNG 224×320; transparencia 75.3%; parcial 24.2%; 10.036 B |
| `assets/cinematics/characters/protagonist/hero_walk_03.png` | hero_walk_03/fallback | PNG 224×320; transparencia 91.6%; parcial 8.4%; 7.535 B |
| `assets/cinematics/characters/protagonist/hero_walk_03_grounded.png` | hero_walk_03/file | PNG 224×320; transparencia 91.6%; parcial 8.4%; 7.867 B |
| `assets/cinematics/effects/effect_anamorphic_flare.png` | effect_anamorphic_flare/file, effect_anamorphic_flare/fallback | PNG 1920×256; transparencia 80.6%; parcial 19.4%; 351.153 B |
| `assets/cinematics/effects/effect_dust_particles.png` | effect_dust_particles/file, effect_dust_particles/fallback | PNG 1920×1080; transparencia 99.9%; parcial 0.1%; 4.329 B |
| `assets/cinematics/logos/logo_deadbeat_cinematic.png` | logo_deadbeat_cinematic/fallback | PNG 756×630; transparencia 45.9%; parcial 26.5%; 175.249 B |
| `assets/cinematics/logos/logo_deadbeat_cinematic_framed.png` | logo_deadbeat_cinematic/file | PNG 1024×512; transparencia 71.1%; parcial 11.8%; 215.155 B |
| `assets/cinematics/overlays/overlay_vignette_gothic.png` | overlay_vignette_gothic/file, overlay_vignette_gothic/fallback | PNG 1920×1080; transparencia 0.0%; parcial 100.0%; 1.028.487 B |
| `assets/cinematics/thumbnails/thumb_cine_bg01_city_rebuild.jpg` | cine_bg01_city/thumbnail | JPEG 480×270; opaco; 41.161 B |
| `assets/cinematics/thumbnails/thumb_cine_bg02_club_exterior_rebuild.jpg` | cine_bg02_club_exterior/thumbnail | JPEG 480×270; opaco; 42.316 B |
| `assets/cinematics/thumbnails/thumb_cine_bg03_entrance_rebuild.jpg` | cine_bg03_entrance/thumbnail | JPEG 480×270; opaco; 35.903 B |
| `assets/cinematics/thumbnails/thumb_cine_bg04_main_hall_rebuild.jpg` | cine_bg04_main_hall/thumbnail | JPEG 480×270; opaco; 44.663 B |
| `assets/cinematics/thumbnails/thumb_cine_bg05_dancefloor_rebuild.jpg` | cine_bg05_dancefloor/thumbnail | JPEG 480×270; opaco; 39.472 B |
| `assets/cinematics/thumbnails/thumb_cine_bg06_hero_rebuild.jpg` | cine_bg06_hero/thumbnail | JPEG 480×270; opaco; 40.845 B |

## Anexo B — Archivos de los seis directorios `final/` y fondos históricos

Listado físico adicional, incluidos los no referenciados directamente en el manifiesto. `*_master.png` y `loop/` son composiciones/esquemas históricos, no maestros reconstruidos en capas; `*_loop.gif` es animación anterior no integrada como trayectoria multicapa. Los nombres de capas no certifican contenido o independencia: las que son opacas no son recortes transparentes. Estado general: ORIGINAL CONSERVADO / PROVISIONAL / PENDIENTE DE APROBACIÓN; `rebuild_*` = RECONSTRUCCIÓN / PROVISIONAL; `fallback_transparent` = PROVISIONAL.

| Ruta | Formato, dimensiones, alfa real y bytes |
|---|---|
| `assets/cinematics/backgrounds/cine_bg01_city.png` | PNG 2560×1440; opaco; 4.140.564 B |
| `assets/cinematics/backgrounds/cine_bg02_club_exterior.png` | PNG 2560×1440; opaco; 4.236.184 B |
| `assets/cinematics/backgrounds/cine_bg03_entrance.png` | PNG 2560×1440; opaco; 4.211.523 B |
| `assets/cinematics/backgrounds/cine_bg04_main_hall.png` | PNG 2560×1440; opaco; 4.266.607 B |
| `assets/cinematics/backgrounds/cine_bg05_dancefloor.png` | PNG 2560×1440; opaco; 4.384.380 B |
| `assets/cinematics/backgrounds/cine_bg06_hero.png` | PNG 2560×1440; opaco; 3.894.230 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/01_sky_atmosphere.png` | PNG 1920×1080; opaco; 15.134 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/01_sky_moon_atmosphere.png` | PNG 1920×1080; opaco; 2.620.376 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/02_gothic_skyline_architecture.png` | PNG 1920×1080; opaco; 3.108.799 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/02_skyline_architecture.png` | PNG 1920×1080; transparencia 30.2%; parcial 0.2%; 169.653 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/03_fog_industrial_cables.png` | PNG 1920×1080; transparencia 61.6%; parcial 26.6%; 103.595 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/03_foreground_industrial_pipes.png` | PNG 1920×1080; opaco; 3.108.799 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/cine_bg01_city.png` | PNG 2560×1440; opaco; 4.140.564 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/cine_bg01_city_loop.gif` | GIF 640×360 / 8 fotogramas; opaco; 260.958 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/cine_bg01_city_master.png` | PNG 1920×1080; opaco; 243.513 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/fallback_transparent.png` | PNG 1×1; 100% transparente; 244 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/loop/frame_00.png` | PNG 1920×1080; opaco; 251.761 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/loop/frame_01.png` | PNG 1920×1080; opaco; 252.053 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/loop/frame_02.png` | PNG 1920×1080; opaco; 251.805 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/loop/frame_03.png` | PNG 1920×1080; opaco; 251.909 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/loop/frame_04.png` | PNG 1920×1080; opaco; 245.938 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/loop/frame_05.png` | PNG 1920×1080; opaco; 252.690 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/loop/frame_06.png` | PNG 1920×1080; opaco; 252.465 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/loop/frame_07.png` | PNG 1920×1080; opaco; 251.814 B |
| `assets/cinematics/backgrounds/final/cine_bg01_city/rebuild_city.png` | PNG 1376×768; opaco; 2.425.837 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/01_gothic_cathedral_facade.png` | PNG 1920×1080; opaco; 2.672.009 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/02_portal_speakers_entrance.png` | PNG 1920×1080; opaco; 3.167.442 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/02_portal_speakers_marquee.png` | PNG 1920×1080; transparencia 71.7%; parcial 0.2%; 86.475 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/03_wet_ground_reflections.png` | PNG 1920×1080; transparencia 77.8%; parcial 0.0%; 38.546 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/03_wet_pavement_reflections.png` | PNG 1920×1080; opaco; 3.167.442 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/cine_bg02_club_exterior.png` | PNG 2560×1440; opaco; 4.236.184 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/cine_bg02_club_exterior_loop.gif` | GIF 640×360 / 8 fotogramas; opaco; 372.703 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/cine_bg02_club_exterior_master.png` | PNG 1920×1080; opaco; 156.012 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/fallback_transparent.png` | PNG 1×1; 100% transparente; 244 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/loop/frame_00.png` | PNG 1920×1080; opaco; 160.450 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/loop/frame_01.png` | PNG 1920×1080; opaco; 161.448 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/loop/frame_02.png` | PNG 1920×1080; opaco; 160.450 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/loop/frame_03.png` | PNG 1920×1080; opaco; 161.287 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/loop/frame_04.png` | PNG 1920×1080; opaco; 160.450 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/loop/frame_05.png` | PNG 1920×1080; opaco; 161.225 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/loop/frame_06.png` | PNG 1920×1080; opaco; 160.450 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/loop/frame_07.png` | PNG 1920×1080; opaco; 160.667 B |
| `assets/cinematics/backgrounds/final/cine_bg02_club_exterior/rebuild_exterior.png` | PNG 1376×768; opaco; 2.493.394 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/01_hallway_vault_focal_light.png` | PNG 1920×1080; opaco; 69.233 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/01_vaulted_hallway_depth.png` | PNG 1920×1080; opaco; 2.655.434 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/02_mid_columns_torches.png` | PNG 1920×1080; transparencia 90.7%; parcial 0.1%; 23.688 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/02_midground_columns_banners.png` | PNG 1920×1080; opaco; 3.151.602 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/03_foreground_pillars_occlusion.png` | PNG 1920×1080; opaco; 3.151.602 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/cine_bg03_entrance.png` | PNG 2560×1440; opaco; 4.211.523 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/cine_bg03_entrance_loop.gif` | GIF 640×360 / 8 fotogramas; opaco; 287.367 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/cine_bg03_entrance_master.png` | PNG 1920×1080; opaco; 65.420 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/fallback_transparent.png` | PNG 1×1; 100% transparente; 244 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/loop/frame_00.png` | PNG 1920×1080; opaco; 65.573 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/loop/frame_01.png` | PNG 1920×1080; opaco; 65.575 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/loop/frame_02.png` | PNG 1920×1080; opaco; 65.410 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/loop/frame_03.png` | PNG 1920×1080; opaco; 65.576 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/loop/frame_04.png` | PNG 1920×1080; opaco; 65.581 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/loop/frame_05.png` | PNG 1920×1080; opaco; 65.580 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/loop/frame_06.png` | PNG 1920×1080; opaco; 65.410 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/loop/frame_07.png` | PNG 1920×1080; opaco; 65.568 B |
| `assets/cinematics/backgrounds/final/cine_bg03_entrance/rebuild_entrance.png` | PNG 1376×768; opaco; 2.430.258 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/01_cathedral_nave_vaults.png` | PNG 1920×1080; opaco; 2.693.718 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/02_laser_beams_equalizer.png` | PNG 1920×1080; opaco; 3.186.251 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/02_laser_beams_volumetric.png` | PNG 1920×1080; transparencia 76.1%; parcial 23.5%; 94.136 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/03_chandeliers_gold_framing.png` | PNG 1920×1080; transparencia 68.7%; parcial 4.8%; 81.352 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/03_chandeliers_stage_framing.png` | PNG 1920×1080; opaco; 3.186.251 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/cine_bg04_main_hall.png` | PNG 2560×1440; opaco; 4.266.607 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/cine_bg04_main_hall_loop.gif` | GIF 640×360 / 8 fotogramas; opaco; 540.333 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/cine_bg04_main_hall_master.png` | PNG 1920×1080; opaco; 373.224 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/fallback_transparent.png` | PNG 1×1; 100% transparente; 244 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/loop/frame_00.png` | PNG 1920×1080; opaco; 473.117 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/loop/frame_01.png` | PNG 1920×1080; opaco; 482.825 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/loop/frame_02.png` | PNG 1920×1080; opaco; 504.784 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/loop/frame_03.png` | PNG 1920×1080; opaco; 457.101 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/loop/frame_04.png` | PNG 1920×1080; opaco; 515.927 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/loop/frame_05.png` | PNG 1920×1080; opaco; 525.712 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/loop/frame_06.png` | PNG 1920×1080; opaco; 515.927 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/loop/frame_07.png` | PNG 1920×1080; opaco; 503.955 B |
| `assets/cinematics/backgrounds/final/cine_bg04_main_hall/rebuild_hall.png` | PNG 1376×768; opaco; 2.618.748 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/01_astrological_dancefloor_grid.png` | PNG 1920×1080; opaco; 2.755.408 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/02_sound_towers_dj_booth.png` | PNG 1920×1080; transparencia 77.0%; parcial 2.4%; 57.703 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/02_sound_towers_dj_stage.png` | PNG 1920×1080; opaco; 3.255.783 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/03_fog_strobe_ambient_glow.png` | PNG 1920×1080; transparencia 82.2%; parcial 17.8%; 79.114 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/03_tables_foreground_ambient.png` | PNG 1920×1080; opaco; 3.255.783 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/cine_bg05_dancefloor.png` | PNG 2560×1440; opaco; 4.384.380 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/cine_bg05_dancefloor_loop.gif` | GIF 640×360 / 8 fotogramas; opaco; 270.020 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/cine_bg05_dancefloor_master.png` | PNG 1920×1080; opaco; 290.171 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/fallback_transparent.png` | PNG 1×1; 100% transparente; 244 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/loop/frame_00.png` | PNG 1920×1080; opaco; 297.827 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/loop/frame_01.png` | PNG 1920×1080; opaco; 304.573 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/loop/frame_02.png` | PNG 1920×1080; opaco; 311.281 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/loop/frame_03.png` | PNG 1920×1080; opaco; 313.349 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/loop/frame_04.png` | PNG 1920×1080; opaco; 314.609 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/loop/frame_05.png` | PNG 1920×1080; opaco; 313.113 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/loop/frame_06.png` | PNG 1920×1080; opaco; 304.547 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/loop/frame_07.png` | PNG 1920×1080; opaco; 297.115 B |
| `assets/cinematics/backgrounds/final/cine_bg05_dancefloor/rebuild_dancefloor.png` | PNG 1376×768; opaco; 2.427.118 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/01_axial_portal_rosette.png` | PNG 1920×1080; opaco; 2.487.316 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/01_axial_rosette_architecture.png` | PNG 1920×1080; opaco; 139.461 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/02_hero_rimlight_spotlight.png` | PNG 1920×1080; opaco; 2.945.238 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/03_flanking_speakers_framing.png` | PNG 1920×1080; opaco; 2.945.238 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/03_framing_columns_negative_space.png` | PNG 1920×1080; transparencia 65.3%; parcial 0.1%; 95.229 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/cine_bg06_hero.png` | PNG 2560×1440; opaco; 3.894.230 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/cine_bg06_hero_loop.gif` | GIF 640×360 / 8 fotogramas; opaco; 255.948 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/cine_bg06_hero_master.png` | PNG 1920×1080; opaco; 337.140 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/fallback_transparent.png` | PNG 1×1; 100% transparente; 244 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/loop/frame_00.png` | PNG 1920×1080; opaco; 341.329 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/loop/frame_01.png` | PNG 1920×1080; opaco; 341.934 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/loop/frame_02.png` | PNG 1920×1080; opaco; 339.411 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/loop/frame_03.png` | PNG 1920×1080; opaco; 337.747 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/loop/frame_04.png` | PNG 1920×1080; opaco; 339.411 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/loop/frame_05.png` | PNG 1920×1080; opaco; 339.232 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/loop/frame_06.png` | PNG 1920×1080; opaco; 341.329 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/loop/frame_07.png` | PNG 1920×1080; opaco; 337.709 B |
| `assets/cinematics/backgrounds/final/cine_bg06_hero/rebuild_hero.png` | PNG 1376×768; opaco; 2.409.766 B |

## Anexo C — Sprites, logo y recurso de plataforma

Los originales y derivados se conservan. Los logos se incluyen para identificar el recurso actual; el PNG reencuadrado es DERIVADO AJUSTADO / PROVISIONAL, no una nueva marca. La calidad/aprobación de todos estos elementos permanece PENDIENTE DE APROBACIÓN.

| Ruta | Formato, dimensiones, alfa real y bytes | Estado |
|---|---|---|
| `assets/characters/player_idle_00.png` | PNG 224×320; transparencia 91.0%; parcial 8.8%; 8.034 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/characters/player_walk_00.png` | PNG 224×320; transparencia 76.9%; parcial 22.8%; 10.816 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/characters/player_walk_01.png` | PNG 224×320; transparencia 75.6%; parcial 24.1%; 11.117 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/characters/player_walk_02.png` | PNG 224×320; transparencia 75.3%; parcial 24.2%; 10.117 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/characters/player_walk_03.png` | PNG 224×320; transparencia 91.6%; parcial 8.4%; 7.535 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/characters/player_shoot_00.png` | PNG 240×320; transparencia 74.6%; parcial 24.5%; 11.255 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/cinematics/characters/protagonist/hero_idle_00.png` | PNG 224×320; transparencia 91.0%; parcial 8.8%; 8.034 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/cinematics/characters/protagonist/hero_shoot_00.png` | PNG 240×320; transparencia 74.6%; parcial 24.5%; 11.255 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/cinematics/characters/protagonist/hero_walk_00.png` | PNG 224×320; transparencia 76.9%; parcial 22.8%; 10.816 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/cinematics/characters/protagonist/hero_walk_00_grounded.png` | PNG 224×320; transparencia 76.9%; parcial 22.8%; 10.675 B | DERIVADO AJUSTADO / PROVISIONAL |
| `assets/cinematics/characters/protagonist/hero_walk_01.png` | PNG 224×320; transparencia 75.6%; parcial 24.1%; 11.117 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/cinematics/characters/protagonist/hero_walk_01_grounded.png` | PNG 224×320; transparencia 75.6%; parcial 24.1%; 10.976 B | DERIVADO AJUSTADO / PROVISIONAL |
| `assets/cinematics/characters/protagonist/hero_walk_02.png` | PNG 224×320; transparencia 75.3%; parcial 24.2%; 10.117 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/cinematics/characters/protagonist/hero_walk_02_grounded.png` | PNG 224×320; transparencia 75.3%; parcial 24.2%; 10.036 B | DERIVADO AJUSTADO / PROVISIONAL |
| `assets/cinematics/characters/protagonist/hero_walk_03.png` | PNG 224×320; transparencia 91.6%; parcial 8.4%; 7.535 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/cinematics/characters/protagonist/hero_walk_03_grounded.png` | PNG 224×320; transparencia 91.6%; parcial 8.4%; 7.867 B | DERIVADO AJUSTADO / PROVISIONAL |
| `assets/cinematics/logos/logo_deadbeat_cinematic.png` | PNG 756×630; transparencia 45.9%; parcial 26.5%; 175.249 B | ORIGINAL CONSERVADO / PROVISIONAL |
| `assets/cinematics/logos/logo_deadbeat_cinematic_framed.png` | PNG 1024×512; transparencia 71.1%; parcial 11.8%; 215.155 B | DERIVADO AJUSTADO / PROVISIONAL |
| `assets/environments/threshold_descent_pad.png` | PNG 512×320; transparencia 57.5%; parcial 24.1%; 29.791 B | ORIGINAL CONSERVADO / PROVISIONAL |

## Anexo D — Referencias conceptuales no registradas

No son rutas; se listan para evitar confundir el storyboard con recursos disponibles.

- Plano 01: `effects`: `volumetric_fog_cyan_magenta`.
- Plano 02: `effects`: `neon_pulse_portal_magenta`.
- Plano 03: `effects`: `gold_light_leak_blinding`.
- Plano 04: `characters`: `hero_walk`.
- Plano 04: `effects`: `hero_rimlight_magenta`, `shadow_silhouette`.
- Plano 05: `characters`: `hero_walk`.
- Plano 05: `effects`: `pillar_rhythmic_occlusion`, `cast_shadow`.
- Plano 06: `effects`: `volumetric_lasers_cyan_magenta`.
- Plano 07: `characters`: `hero_walk`.
- Plano 07: `effects`: `obsidian_floor_reflection`, `drop_strobe_magenta`.
- Plano 08: `characters`: `hero_idle`, `hero_shoot`.
- Plano 08: `effects`: `hero_rimlight_overhead`, `weapon_windup`.
- Plano 09: `characters`: `hero_shoot`.
- Plano 09: `effects`: `neon_logo_glow_gold_magenta`, `kick_pulse`.
- Plano 10: `characters`: `hero_idle`.
- Plano 10: `effects`: `seamless_fade_to_gameplay`.
