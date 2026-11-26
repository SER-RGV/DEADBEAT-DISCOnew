# GUÍA DE SUSTITUCIÓN DE RECURSOS CINEMÁTICOS
## DEADBEAT DISCO · FASE 04: CINEMÁTICA MODULAR

Esta guía explica detalladamente cómo sustituir cualquier imagen, fondo, capa de paralaje 2.5D, logotipo o sprite de la cinemática de introducción de **DEADBEAT DISCO** directamente desde GitHub o tu explorador de archivos **sin tocar una sola línea de código**.

---

### 1. ESTRUCTURA DE CARPETAS ORGANIZADA

Todos los recursos de la cinemática se encuentran centralizados en:

```text
assets/
└── cinematics/
    ├── backgrounds/
    │   └── final/
    │       ├── cine_bg01_city/             # Plano 01: Metrópolis Brutalista
    │       ├── cine_bg02_club_exterior/    # Plano 02: Fachada Monumental Club
    │       ├── cine_bg03_entrance/         # Planos 03, 04, 05: Umbral y Corredor
    │       ├── cine_bg04_main_hall/        # Plano 06: Nave Catedralicia
    │       ├── cine_bg05_dancefloor/       # Plano 07: Pista de Baile Astrológica
    │       └── cine_bg06_hero/             # Planos 08, 09, 10: Rosetón y Presentación
    │
    ├── characters/
    │   └── protagonist/                    # Sprites y poses del protagonista
    │
    ├── foregrounds/                        # Elementos de primer plano adicionales
    ├── effects/                            # Sprites de efectos y destellos
    ├── overlays/                           # Gráficos y máscaras superpuestas
    ├── logos/                              # Logotipos cinemáticos oficiales
    ├── thumbnails/                         # Vistas previas para herramientas
    │
    ├── manifest.json                       # Manifiesto central editable
    ├── preview/index.html                  # Herramienta visual de previsualización
    └── README_ASSET_REPLACEMENT.md         # Esta documentación técnica
```

---

### 2. PROCEDIMIENTO PASO A PASO PARA SUSTITUIR UNA IMAGEN DESDE GITHUB

**Ejemplo: Cambiar el fondo del Plano 01 (La Metrópolis):**

1. Entra al repositorio en **GitHub**.
2. Navega a la carpeta correspondiente:  
   `assets/cinematics/backgrounds/final/cine_bg01_city/`
3. Localiza el archivo que deseas cambiar:  
   `cine_bg01_city.png`
4. Pulsa en **Add file** -> **Upload files** (o edita/sube vía Git en tu ordenador).
5. Arrastra tu nueva imagen asegurándote de que tenga **exactamente el mismo nombre**: `cine_bg01_city.png`.
6. Haz clic en **Commit changes**.
7. ¡Listo! La próxima vez que recargues el juego, el nuevo fondo aparecerá en el Plano 01. No necesitas editar JavaScript ni modificar la cámara.

---

### 3. TABLA DE CORRESPONDENCIA: PLANOS, IDENTIFICADORES Y RUTAS

| Plano | Nombre de Escena | Identificador | Archivo Principal | Capas 2.5D Disponibles | Resolución Recomendada |
|---|---|---|---|---|---|
| **01** | La Metrópolis Brutalista | `cine_bg01_city` | `backgrounds/final/cine_bg01_city/cine_bg01_city.png` | `01_sky_moon_atmosphere.png`<br>`02_gothic_skyline_architecture.png`<br>`03_foreground_industrial_pipes.png` | 2560x1440 (Master)<br>1920x1080 (Capas) |
| **02** | La Fachada Monumental | `cine_bg02_club_exterior` | `backgrounds/final/cine_bg02_club_exterior/cine_bg02_club_exterior.png` | `01_gothic_cathedral_facade.png`<br>`02_portal_speakers_entrance.png`<br>`03_wet_pavement_reflections.png` | 2560x1440 (Master)<br>1920x1080 (Capas) |
| **03** | El Umbral de Acceso | `cine_bg03_entrance` | `backgrounds/final/cine_bg03_entrance/cine_bg03_entrance.png` | `01_vaulted_hallway_depth.png`<br>`02_midground_columns_banners.png`<br>`03_foreground_pillars_occlusion.png` | 2560x1440 (Master)<br>1920x1080 (Capas) |
| **04** | Aparición del Protagonista | `cine_bg03_entrance`<br>`hero_walk_00-03` | `backgrounds/final/cine_bg03_entrance/cine_bg03_entrance.png`<br>`characters/protagonist/hero_walk_00.png` | Capas de Plano 03 con silueta contraluz | 2560x1440 (Fondo)<br>256x256 (Personaje) |
| **05** | Caminata y Corredor | `cine_bg03_entrance`<br>`hero_walk_00-03` | `backgrounds/final/cine_bg03_entrance/cine_bg03_entrance.png`<br>`characters/protagonist/hero_walk_*.png` | Capas con oclusión rítmica de columnas | 2560x1440 (Fondo)<br>256x256 (Personaje) |
| **06** | La Nave Catedralicia | `cine_bg04_main_hall` | `backgrounds/final/cine_bg04_main_hall/cine_bg04_main_hall.png` | `01_cathedral_nave_vaults.png`<br>`02_laser_beams_equalizer.png`<br>`03_chandeliers_stage_framing.png` | 2560x1440 (Master)<br>1920x1080 (Capas) |
| **07** | El Drop en la Pista | `cine_bg05_dancefloor`<br>`hero_walk_00-03` | `backgrounds/final/cine_bg05_dancefloor/cine_bg05_dancefloor.png` | `01_astrological_dancefloor_grid.png`<br>`02_sound_towers_dj_stage.png`<br>`03_tables_foreground_ambient.png` | 2560x1440 (Master)<br>1920x1080 (Capas) |
| **08** | Presentación Heroica | `cine_bg06_hero`<br>`hero_idle_00`<br>`hero_shoot_00` | `backgrounds/final/cine_bg06_hero/cine_bg06_hero.png`<br>`characters/protagonist/hero_idle_00.png` | `01_axial_portal_rosette.png`<br>`02_hero_rimlight_spotlight.png`<br>`03_flanking_speakers_framing.png` | 2560x1440 (Master)<br>256x256 (Personaje) |
| **09** | Logotipo Deadbeat Disco | `logo_deadbeat_cinematic` | `logos/logo_deadbeat_cinematic.png` | Rosetón de fondo + Resplandor de logotipo | 1024x512 (PNG Alpha) |
| **10** | Ingreso al Refugio (HUB) | `cine_bg06_hero`<br>`hero_idle_00` | Disolución seamless hacia Room `r0` (`window.DD_HUB`) | Conexión directa al motor | Dinámica |

---

### 4. RECOMENDACIONES TÉCNICAS (FORMATOS Y DIMENSIONES)

1. **Fondos Maestros:**
   - **Formato:** PNG o JPG (calidad > 85%).
   - **Resolución sugerida:** 2560x1440 (16:9).
   - **Adaptación automática:** El motor cinematográfico aplica escalado proporcional inteligente (*aspect fill con overscan*). Si utilizas una imagen de 1920x1080 o 3840x2160, el juego la encuadrará y centrará automáticamente sin deformarla ni estirarla.
2. **Capas de Paralaje 2.5D:**
   - **Formato:** PNG con canal alfa (transparencia obligatoria).
   - **Resolución sugerida:** 1920x1080.
3. **Logotipos:**
   - **Formato:** PNG con canal alfa transparente.
   - **Resolución sugerida:** 1024x512.
4. **Sprites del Protagonista:**
   - **Formato:** PNG con canal alfa transparente.
   - **Resolución sugerida:** 256x256 (con pivote centrado en los pies).

---

### 5. SISTEMA DE RESILdisplay Y FALLBACKS

- Si una imagen es borrada accidentalmente o falla su descarga por red, el sistema activa automáticamente su **fallback declarado en `manifest.json`**.
- Si una capa 2.5D falta, el plano utiliza inmediatamente el fondo maestro de resolución completa para evitar pantallas negras.
- Si un sprite modular falta, el juego utiliza el sprite canónico del motor (`player_idle_00`).

---

### 6. INVALIDACIÓN AUTOMÁTICA DE CACHÉ (GITHUB PAGES)

Para evitar que los navegadores retengan imágenes viejas en su memoria tras publicar una nueva versión:
- El registro de activos cuenta con una constante de versión: `ASSET_CACHE_VERSION`.
- Se añade automáticamente el sufijo de versión `?v=20261109.1` a las solicitudes de imagen de forma transparente.
- Si deseas forzar la recarga en todos los clientes tras sustituir múltiples archivos masivos, simplemente actualiza el campo `"asset_version"` en `assets/cinematics/manifest.json`.

---

### 7. HERRAMIENTA DE PREVISUALIZACIÓN

Se ha habilitado una herramienta visual ligera que lista todos los planos, muestra sus miniaturas y detalla los archivos editables:
- Ubicación: `assets/cinematics/preview/index.html`
- Para abrirla, simplemente ábrela con cualquier navegador web o desde el servidor local.
