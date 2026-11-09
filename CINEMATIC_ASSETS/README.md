# Biblioteca de recursos cinematográficos — DEADBEAT DISCO

Esta carpeta es el **archivo maestro e independiente de los recursos visuales de la cinemática**. Permite revisar, sustituir o revertir cada imagen individualmente sin regenerar toda la secuencia.

## Estructura

Cada escena dispone de tres ubicaciones:

- `master/`: imagen final completa.
- `layers/`: capas de profundidad/paralaje (fondo, plano medio, primer plano y oclusiones).
- `elements/`: elementos gráficos independientes sustituibles (decoración, luces, arquitectura o efectos prerenderizados).

| ID | Carpeta | Uso |
|---|---|---|
| BG01 | `scenes/BG01_CITY/` | Ciudad exterior |
| BG02 | `scenes/BG02_CLUB_EXTERIOR/` | Fachada del club |
| BG03 | `scenes/BG03_ENTRANCE/` | Vestíbulo y corredor |
| BG04 | `scenes/BG04_MAIN_HALL/` | Gran nave principal |
| BG05 | `scenes/BG05_DANCEFLOOR/` | Pista principal |
| BG06 | `scenes/BG06_HERO/` | Escenario heroico |

## Convención de nombres

- Masters: `BG01_CITY_MASTER.png`, `BG02_CLUB_EXTERIOR_MASTER.png`, etc.
- Capas: `BG01_CITY_LAYER_01_BACKGROUND.png`, `BG01_CITY_LAYER_02_MIDGROUND.png`, `BG01_CITY_LAYER_03_FOREGROUND.png`.
- Elementos: `BG01_CITY_ELEMENT_<DESCRIPCION>.png`.

Usa PNG con transparencia para capas y elementos que necesiten alfa. Conserva la resolución y no aplanes las capas.

## Sustituir una imagen individualmente

1. Abre la carpeta de la escena.
2. Sustituye solo el archivo correspondiente, conservando nombre y extensión.
3. Si cambias el nombre o añades una capa, actualiza `manifest.json`.
4. No sustituyas el master ni otras capas cuando solo quieras cambiar un elemento.
5. Comprueba la cinemática antes de aprobar el cambio.

Git conserva el historial de versiones: cada sustitución queda registrada y puede revertirse.

## Separación respecto al motor

Esta biblioteca es la fuente central de arte editable. No contiene lógica de juego. La implementación cinematográfica deberá cargar desde aquí o documentar claramente la ruta de runtime que utilice estos mismos archivos.

No borres ni sobrescribas assets originales de otras carpetas.

## Estado inicial

Esta estructura y su manifiesto preparan los espacios de sustitución. Los PNG maestros y las capas deben copiarse aquí desde el espacio de trabajo que contiene la producción artística. No se crean imágenes ficticias ni se consideran presentes hasta que estén subidas físicamente al repositorio.
