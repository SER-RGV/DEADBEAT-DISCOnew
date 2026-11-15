# TANDA 05 · ARMAS — informe de cierre

Fecha: 2026-11-15 · Rama `arena/e088e9d7-deadbeat-disconew` · Plan: [`PLAN_PRODUCCION_02-07.md`](PLAN_PRODUCCION_02-07.md) §3 fila 05.
Lote: [`batches/T05_ARMAS.json`](batches/T05_ARMAS.json) (105 assets, 11 turnos, 16 lecciones) · Evidencia:
`evidence/T05_ARMAS/` (00–43, con 16 informes de sonda) · Herramientas: `tools/art_master/weapon_cal.py`,
`batch.py calibrate`, `tools/art_master/probe_weapons.js`.

**Resultado: 105/105 sprites producidos, registrados, calibrados con medida y verificados en la mano del
protagonista sobre la build real (`index.html`).** Catálogo completo en `43_catalogo_105_sprites.jpg`.

## 1. Auditoría (lo que había al abrir la tanda)

- El motor (módulo v3.2 `it`) ya dibujaba las 120 armas del catálogo (`wt`) en la mano, en la tienda (`wo`), en el
  HUD y en la armería a partir de `__HD_GET("weapons/weapon_<id>.png")`: 16 con PNG propio en `assets/weapons/`
  (clase B, calibración manual en `WEAPON_OVERRIDES`) y **104 con un WebP embebido de baja resolución** en
  `__HD_DATA` (160×31…160×80, estilos dispares, varios con la cuerda del arco al lado contrario).
- La calibración de cada arma (`hd.grip/gripY/axis/tip/sup/supY`) estaba escrita a mano para el sprite embebido:
  al cambiar el PNG dejaba de valer. **Decisión:** medirla sobre el PNG final en vez de tabularla a ojo.
- `00_calibracion_medida_vs_manual_16_existentes.jpg`: el medidor reproduce la calibración manual de las 16 B
  (desvío sólo en `magnum`/`olympia`, que se mantienen con sus valores manuales).

## 2. Lo que NO se produce (no existe en el motor; no se inventa)

- No se crean armas nuevas ni se tocan `ja`/`dt`/`za`/`wt`; las 16 B existentes no se regeneran.
- Fogonazos, cuerda y flecha de los arcos, estela de los cortes y la mano de apoyo son procedurales del motor y
  siguen siéndolo: el PNG lleva sólo el arma.
- Munición/proyectiles y botín quedan para las tandas 06–07 (pendiente arrastrado de R03).

## 3. Producido e integrado (105 sprites; T05 queda en 105/105)

| Familia (catálogo) | Armas | Turnos | Notas de calibración |
|---|---|---|---|
| Escopetas 16–24 + cryo | 10 | 1–2 | culata clásica → `hang:false`, grip ≈ .30; SPAS-12 pistolete al extremo → grip .10 |
| Subfusiles/fusiles 25–36 (thompson, mp40, ak47, m16, famas, scar, g36, aug, pulsos, winchester, bullpup) | 12 | 2–3 | mp40 grip .08; pulsos/bullpup de serie |
| Pesadas 37–48 (m60, minigun, lmg_neon, pesado, lanzacohetes, lanzagranadas, railgun, bfg, mortero, rotatorio, flamer, artillería) | 12 | 3–6 | cuerpos gordos → `grip` + `grip_v` .62–.78 y `sup` relativo; flamer `tip .91`; cadera (`xt`) sin antebrazo |
| Energía 49–60 | 12 | 5–7 | pistola tesla/plasma `grip_v`; rayo en cadena `tip .92`; `compact` anula `sup` |
| Elementales 61–72 | 12 | 7–9 | lanzadores de tubo `grip_v .72–.74`; nube tóxica `tip .86`; incendiaria `axis_band .12` |
| Especiales 73–84 | 12 | 9–11 | dispositivos tipo pistola grande: pistolete tapado → `grip`/`grip_v`; torreta `tip .93`; satélites `tip .82` |
| Cuerpo a cuerpo 85–96 | 12 | 10–12 | espadas/katana/bate a una mano; hacha/martillo/guadaña con `sup` en el asta; manoplas `grip .09 grip_v .74`; cadena `sup None` |
| Míticas 97–120 (raygun, thundergun, wunderwaffe, Winter's Howl, wave gun, bastones 102–105, arcos 106–110, Devoracaos, Harvester, espadas 113–114, lanza espectral, orbe, bomba flotante, summon, dragón, Director) | 23 | 12–14 | bastones `grip_v = axis + .08`; **arcos: contrato propio 320×80** (§8); espadones `grip` empuñadura + `sup` guarda; cadera 119/120 |

Todos con maestro WebP en `ART_ASSETS/rebuild_masters/T05_ARMAS/`, PNG final en `assets/weapons/weapon_<id>.png`,
`manifest.entries[id].anchors` medidos y clase **E** en el inventario (`AUDIT_INVENTORY.md`: A 25 · B 107 · C 0 ·
D 26 · E 224). Registro final: **382 assets, `ASSET_CACHE_VERSION 20261115.21`**, `batch.py audit` sin incidencias.

### Código (sólo medición, puente y QA; sin cambios de mecánica)

- `tools/art_master/weapon_cal.py` (nuevo): mide sobre el PNG final el eje del cañón (banda derecha de la silueta),
  la boca, la empuñadura (prior por clase + detección del tramo colgante «hang») y la mano de apoyo; hints por arma
  `hang, grip, grip_v, sup, sup_v, tip, axis_v, axis_band, max_dev, spriteRot, len`; genera la hoja `--overlay`.
- `tools/art_master/batch.py`: `process` mide y guarda `anchors` en el report; `calibrate [--only] [--overlay DIR]`
  re-mide sin reprocesar; `register` vuelca `anchors` al manifiesto (`oriented`, `spriteRot`, `len`).
- `tools/build_active_html.py` bloque `1d. ARMAS (T05)`: `ddApplyWeaponCalibration` (manifest.anchors →
  `WEAPON_OVERRIDES[id]` y `dt[id].hd`; `oriented:true` anula `flipX/cropY/spriteRot/scabbardCropY` heredados),
  `ddIsLongGun` (pose `player_fire2` cuando `(sup−grip)·len·95 ≥ 10` y no es de cadera), puente `Pf` →
  `DD_WORLD.getPlayerWeaponMount` + `ut.handLocal` dentro de `weaponLayer`; ganchos QA `__DD_BRIDGE.getWeaponCalibration /
  applyWeaponCalibration / getWeaponTelemetry / setDebugGrip / buyOrEquipWeapon / invalidateWeaponCache / getWeaponsList`;
  `window.__DD_WEAPON_OVERRIDES` y `__DD_WEAPON_CANVAS_CACHE` expuestos.
- `tools/art_master/probe_weapons.js` (nuevo): equipa cada arma en la build real y captura reposo / derecha / arriba /
  abajo / izquierda / caminando, con telemetría `ut._gdb` en `probe_report.json`.

## 4. Pruebas y QA

- Por turno: hoja de crudos (`sheet.py`) → `process` → `calibrate --overlay` (revisión visual de mano/apoyo/eje en
  los 105) → `register` → `build_active_html.py` → sonda en Chromium headless → recorte ×2 de las poses der / arriba /
  izq → `mark` → `audit` → `audit_report.py render`.
- **16 sondas, 352 capturas, 0 errores de página y 0 de red** (informes `NN_turnoN_probe_report.json`). Lo que se ve:
  la mano en la empuñadura, el antebrazo de apoyo en el guardamanos, la boca alineada con la puntería a derecha,
  arriba e izquierda; pesadas desde la cadera (`player_firehip`); armas blancas con el ángulo de guardia; bastones
  horizontales cruzando los dos puños; arcos verticales con la cuerda hacia el arquero y el riser en el puño delantero.
- Diagnósticos con evidencia propia: bastones (`36_turno12_bastones_antes_despues.jpg`, `diag` de pose/montura: la
  lanza y el bastón reciben la misma montura; la diferencia estaba en el PNG) y arcos (`39_turno13_arcos_antes_despues.jpg`
  frente a los embebidos; `39_turno13_arcos_detalle_x4.jpg`).
- Límites de la validación: la sonda fuerza la puntería y equipa con el gancho de QA; no se ha jugado una partida
  completa con cada arma. La pose `abajo` y `camina` se sondearon en los primeros turnos y por muestreo después
  (la geometría es la misma montura). La animación de carga del arco (cuerda tensada) no se captura en reposo.

## 5. Lecciones de generación (para las tandas siguientes)

- **Prompt estable** (HEAD + WEAPON SHAPE por clase + DESIGN de una frase + acento): crudos 1774×887 sobre croma plano,
  un solo objeto, sin manos. Los fallos del servicio («Image generation failed») no dependen del prompt, pero los
  reintentos salen antes con el DESIGN acortado a UNA frase y sin «pilot flame / canister / hazard / electric arcs /
  warning lights / icicles / orbiting dots». Balance: **136 llamadas para 105 válidas (31 fallos del servicio)**.
- **Calibración medida > tabulada.** Revisar SIEMPRE la hoja `calibrate --overlay` antes de registrar. Priors por clase
  aciertan en pistoletes y guardamanos; hay que ayudar con hints cuando el pistolete está tapado por un cuerpo grueso
  (`grip_v`), al extremo izquierdo (`grip` bajo) o cuando hay efecto pintado en la boca (`tip`).
- **La montura manda.** El ancla `hand` de `player_fire2` está en la base del puño trasero: los bastones (sin ángulo de
  guardia) necesitan `grip_v = axis + .08`; las armas blancas no, porque llevan guardia de −0,27 rad.
- **Arcos:** el motor los dibuja en una caja fija respecto a la mano trasera con `wLen = 65·(ancho/alto del lienzo)`;
  el lienzo 2:1 no sirve. Contrato propio (§8) y hint `sup_v` para que el antebrazo procedural quede horizontal.
- El generador respeta bien «lying horizontal, tip RIGHT, grip lower LEFT»; de 105 crudos ninguno salió volteado.

## 6. Pendientes de la tanda

- La cuerda procedural del arco va de las puntas a un nock a 6–17 px del riser: con el arco en reposo forma una V de
  2–3 px hacia delante (geometría del motor, no del arte). Si se quiere exacta, ajustar `riserX`/`pullDist` en `it`.
- En `player_fire2` el puño delantero del sprite queda a ≈19 px de la mano trasera: en armas con `sup` más cercano
  (espadones, cuchillo) el puño del cuerpo se adelanta al apoyo medido. Es la pose, no la calibración.
- Las 16 B antiguas (`m1911`, `magnum`, `olympia`, …) siguen con calibración manual y otro estilo de dibujo; candidatas
  a regenerarse con este mismo flujo si se quiere unificar el catálogo.
- Iconos de tienda/HUD/armería: el mismo PNG. Los arcos (320×80) se ven más finos en la cuadrícula de 104 px.

## 7. Decisiones tomadas por defecto (pendientes de confirmar)

1. Arcos sin flecha pintada y con cuerda de 1 px (invisible en mano, legible en el icono); cuerda tensada y flecha
   las dibuja el motor.
2. Espadones míticos (Devoracaos, espada del caos) a dos manos con el apoyo en la guarda; espada de energía a una mano
   (como el motor clasifica `armaLigera`).
3. Bomba flotante a una mano (`sup None`), como su tabla del motor.
4. `len` del motor se respeta en todas (no se escala ningún arma); sólo cambia la calibración.
5. Los efectos pintados en la boca (llama piloto, discos de onda, chispas) se aceptan y se corrigen con `tip`.

## 8. Contrato de las armas

- **Lienzo:** PNG RGBA **320×160** (2:1), `fit contain` margen 6, arma horizontal, **boca/punta a la DERECHA**,
  empuñadura abajo a la izquierda; croma `#00FF00` en el crudo. Maestro WebP en `rebuild_masters/T05_ARMAS/`.
- **Arcos (`cls arco`):** lienzo **320×80** (4:1), `fit {contain, margin 6, anchor bottom}`, `spriteRot +1.5708`
  (`oriented:false`), arco tumbado como arco de puente: puntas en los extremos, riser arriba, vientre hacia abajo,
  cuerda fina en el borde inferior, sin flecha. Hints `grip .35 grip_v .5 sup .37 sup_v .5`.
- **Anclas** (`manifest.entries["weapon_<id>"].anchors`): `{grip:[u,v], axis:v, tip:u, sup:[u,v]|null, oriented,
  method, spriteRot?, len?}` medidas por `weapon_cal.py`; el puente las vuelca a `WEAPON_OVERRIDES` y `dt.hd` al
  arrancar y en `invalidateWeaponCache`. `sup` define la pose a dos manos (`ddIsLongGun`); las armas `xt` (cadera) lo
  conservan sólo para telemetría e icono.
- **Reglas de hint por forma:** culata clásica `hang:false grip≈.30`; pistolete al extremo `grip .07–.14`; cuerpo
  grueso `grip + grip_v .62–.78 + sup relativo`; efecto en la boca `tip`; hoja asimétrica en asta `axis_v + axis_band .70`;
  bastón `grip_v = axis + .08`; espadón `grip` empuñadura + `sup +.13` guarda; una mano `sup None`.
- **QA:** `node tools/art_master/probe_weapons.js OUT --weapons=a,b --poses=quieto,der,arriba,abajo,izq,camina`
  (≈14 s por captura; una sola instancia de Chromium; equipar con `__DD_BRIDGE.buyOrEquipWeapon(id,true)`).
