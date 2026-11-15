# FASE 08 · SCALE_AUDIT — Auditoría previa (etapa A, solo lectura)

Fecha: 2026-11-14 · Rama: `arena/e088e9d7-deadbeat-disconew` (la rama
`feature/phase-08-world-scale` no se puede crear en esta sesión; se trabaja en la
rama de sesión con commits por etapa y sin merge automático).

Todo lo que sigue se midió **antes de tocar código**: con `grep`/offsets sobre la
fuente del build (`backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html`,
5 001 390 B) y con la sonda headless `tools/world_scale/probe_scale.js` sobre la
build servida en `:8080`. Los offsets son posiciones de carácter en el ORIGINAL
(archivo minificado de una sola línea gigante).

## 1. Estado del repositorio

| Dato | Valor |
|---|---|
| `main` | `2d1f6e8` (nunca se escribe) |
| Rama de trabajo | `arena/e088e9d7-deadbeat-disconew`, HEAD `6a6b20b` al empezar la fase |
| HTML principal | `index.html` (= `DEADBEAT_DISCO.html`), **generado** por `python3 tools/build_active_html.py` a partir del ORIGINAL + módulos `src/` inlineados |
| Módulos inlineados (orden) | `dd_boot.js`, `dd_asset_registry.js`, `dd_world_renderer.js`, `dd_hub_system.js`, `dd_cinematic_camera.js`, `dd_opening.js`, `dd_ui_system.js` |
| Sin comitear al empezar | tanda de arte T06 (9 PNG + ficha) y la propia sonda |

## 2. Pipeline de dibujo (canvas)

* Canvas principal `h`/contexto `g`; `T()` (offset 2562162) fija
  `h.width = innerWidth·dpr`, `dpr = min(devicePixelRatio, 2)` y
  `g.setTransform(dpr,0,0,dpr,0,0)`. Variables de ventana: `y = innerWidth`,
  `x = innerHeight` (2561912).
* Mundo fijo `E = 2500`, `k = 1850` px (2562018). Fondo de sala cacheado en un
  canvas `m` de 2500×1850 por `qc()`; se repinta sólo al cambiar de sala.
* **Transformación mundo→pantalla** (render activo = `Qf` del build,
  `tools/build_active_html.py` l.≈805–815; equivalente al motor en 4009406):

  ```
  N.applied = N.zoom · (he < .999 ? 1.025 : 1) + (reduced ? 0 : .45·me)
  camX = B + cineCam.offX ; camY = L + cineCam.offY ; applied ·= cineCam.zoomMul
  g.translate(y/2, x/2); g.scale(applied, applied); g.translate(-camX, -camY); (+ sacudida pe)
  ```
  `he` = hit-stop, `me` = impulso de zoom (`Cs(e)` → `me = max(me, e)`),
  `cineCam` = `DD_CINE.getCamera()` (offX/offY/zoomMul; cámara cinemática que ya
  existía y se respeta).
* Orden de pintado (`renderQueue`, build l.≈905–945): suelo cacheado → atrezo
  alto (`prop`), enemigos, muertes de enemigo, jefe, muerte de jefe, torretas,
  pickups, objetivos y jugador, **ordenados por `y` de suelo** (`ddGroundY`);
  después balas, FX y HUD.
* HUD: DOM (`dd_ui_system.js`), independiente del canvas y de la cámara.
  Minimapa: canvas `#minimap` (`Zf`, 3280196) a escala `M.width/E`.
* HUB (Refugio): `dd_hub_system.js` l.341–356 tiene **su propia cámara**
  (no se toca). Cinemáticas: `dd_cinematic_camera.js` l.330–372 (offset y
  multiplicador de zoom, no se toca).

## 3. Cámara original (valores reales)

| Elemento | Valor | Dónde |
|---|---|---|
| Centro de cámara | `let B = 1250, L = 925` | 2563764 |
| Parámetros | `N = {zoom:1.16, base:1.16, min:1.06, max:1.34, lead:44, applied, look}` | 2563764 |
| **Reasignación en incursión** | `N.zoom=.8, N.base=.8, N.min=.68, N.max=1` ⇒ **el zoom efectivo de juego es 0,8 constante**; `N.base/min/max` no se leen en ningún otro sitio: **no existía zoom dinámico** | 4013153 |
| Seguimiento | dentro de `Tf` (3154062): `lead = min(N.lead, 14 + .16·|v|)`; `look` lerp `5.5·dt`; cámara lerp `7.5·dt` hacia `ye + look`; luego `Q()` | 3154062 |
| `Q()` | recorta `B/L` al mundo (o centra si el mundo cabe en pantalla) | 2563963 |
| Recolocaciones | `B = ye.x, L = ye.y` al reaparecer/teletransportar (3043447, 3324928, 3330077 + `Q()`, 3615396, 3693134) | |
| Ratón | `Gu`: mundo = `B + (clientX − y/2)/N.applied` (misma fórmula para `L`) | 2563764+ |
| Mando / táctil | `Mu` (3022552) y táctil (3031289): puntería por vector, no dependen de la cámara | |
| Campo visible a 1920×1080 | 2400 × 1350 px de mundo (toda la sala + vacío) | sonda |

**Diagnóstico:** a zoom 0,8 cualquier sala (≤ 1980×1480) cabe entera en 1080p
con 400–1000 px de negro alrededor; a 1280×720 el campo es 1600×900 px de
mundo, así que la *misma* sala se ve con figuras de 83 px en vez de 104·0,8 = 83…
es decir, el tamaño en pantalla de las figuras cambia con la resolución porque
el zoom no se adapta a la altura de la ventana. No hay zona muerta ni zona segura;
la anticipación es sólo por puntería (≤ 44 px).

## 4. Dimensiones reales de entidades (px de mundo)

| Entidad | Radio motor `r` (colisión) | Figura dibujada (alto) | Anclaje |
|---|---|---|---|
| Jugador `ye` | 14 (`{x:1250,y:925,r:14,speed:200}`, 2565951) | `PLAYER_BASE_H = 104` (`dd_world_renderer.js` l.492) | pies en `y` |
| Enemigos | security 12 · dancer 12 · fanatic 10 · chef 16 · drone 12 · elite 13,92 | `ENEMY_BASE.h`: 94 · 90 · 80 · 106 · 90 · 100; `enemyFigureHeight = h·clamp((r/r_base)^.75, .8, 2)` (l.875) | pies en `y + .65·r` (`ENEMY_FOOT_K`) |
| Minijefes | el motor sube `r` (p.ej. 26) | la misma fórmula ⇒ ×≈1,8 | ídem |
| Jefes | 34 (`BOSS_REF_R`) | `BOSS_BASE.h` 178–204 según residente (l.≈1340) | pies en `y + .8·r` |
| Pickups | – (recogida por distancia) | 44 px (cofre 82) en `drawPickup` (l.≈1600) | centro |
| Arma en mano | – | `ut.h = 95` (`DD_WEAPON_CANON_H`), `handLocal`, pivote −52,25 | montura del renderer |

A 1080p y zoom 0,8: jugador ≈ 83 px en pantalla, enemigo normal ≈ 72–75 px,
jefe ≈ 150 px, pickup 35 px. Captura: `BEFORE_AFTER/before/before_1920x1080_*.jpg`.

## 5. Salas y mundo

* Rect de sala `Ps` (2824886), siempre **centrada en el mundo**
  (`Os`: `Ps.x = (E − w)/2`, 2826590). 12 formas `Is[]` + compuestas `Ft[]`.
* `ng(index, shop)` (3317412): forma por ranura `[0,12,1,13,3,14,15,9,5,16,7][(slot+círculo)%11]`;
  ranura 5 → forma 6 (minijefe), ranura 10 → forma 3 (residente), nivel 99 → forma 3;
  tamaño base × (0,86–1,14) en ancho y × (0,88–1,12) en alto, múltiplos de 20;
  minijefe/jefe/final `≥ 1480×1040`; **tope `w∈[960,1980], h∈[700,1480]`**;
  entrada (ranura 0) `≥ 1600×820`; tienda fija 1040×780.
* Círculo = 11 salas (`Ge = 11`); `Je(level) = (level−1) % 11` → la **arena del
  residente es el nivel 11, 22, …** (ranura 10). Nivel 99 = final.
* Puertas: `fd(side, 70)` sobre el rect; muros: franja de 28 px (clamp del
  jugador). Validador de layout exige `w ≤ E && h ≤ k`.
* Salas visitadas por la sonda ANTES (niveles 1–6):
  `wide 1600×820`, `l-wing 1520×1180`, `beveled-tall 1140×1300`,
  `t-gallery 1580×1200`, `octagon 1360×920`, `wide-hex 1480×1040`.

## 6. Animaciones, HUD, assets

* Animaciones: hojas por familia resueltas por `dd_asset_registry.js`
  (382 entradas, `20261115.21`), seleccionadas por pose/dirección en el
  renderer; **el tamaño se decide en el dibujo** (figura → `drawImage` con alto
  = figura), no en los PNG ⇒ se puede escalar sin regenerar arte.
* HUD en DOM, minimapa en su canvas; ninguno lee `N.zoom`.
* Assets aprobados R01–R03, T04, T05 (105/105) → no se tocan.

## 7. Conclusiones de la auditoría

1. La escala "pequeña" no viene de los PNG sino del **zoom fijo 0,8** y de que
   las salas (960–1980 px) caben enteras en 2400×1350 px de campo.
2. No hay cámara dinámica que duplicar: hay un lerp de 8 líneas dentro de `Tf`.
   La Fase 08 lo sustituye por una llamada a un módulo que escribe las mismas
   variables (`B`, `L`, `N.zoom`, `N.look`), así que ratón, cinemática, HUB,
   minimapa y `DMO.camera()` siguen funcionando sin cambios.
3. Las colisiones viven en `r` (motor); las figuras en `*_BASE.h` (renderer).
   Están separadas ya: escalar el dibujo no toca ninguna hitbox.
4. El tamaño de sala se decide en un único punto (`ng`) con topes claros: ahí
   se puede aplicar un factor por función de sala sin romper el validador.
