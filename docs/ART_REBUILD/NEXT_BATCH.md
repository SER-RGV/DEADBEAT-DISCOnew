# SIGUIENTE TANDA: `T05_ARMAS` (TANDA 05 del pack 02–07)

- **Estado:** pendiente de abrir (2026-11-15). **T04 ESCENARIOS cerrada 20/20**: informe en
  [`TANDA_04_INFORME.md`](TANDA_04_INFORME.md) (auditoría, lo que no se produce, las 20 piezas, sondas, lecciones,
  pendientes, cinco decisiones por defecto y el contrato). R03 (jefes) cerrada 42/42 ([`TANDA_03_INFORME.md`](TANDA_03_INFORME.md)).
- **Alcance (plan, [`PLAN_PRODUCCION_02-07.md`](PLAN_PRODUCCION_02-07.md) §3):** sprites HD 320×160 para las armas
  `cNNN_*` de la tabla `ja` del motor que hoy se dibujan de forma procedimental (hasta 105), por familias (pistola →
  … → míticas), con calibración `hd.grip/tip` real; el icono es el mismo PNG (el motor ya lo reutiliza). No se crean
  armas nuevas: las 9 legendarias de la biblia y el «Discobreaker» de las láminas no tienen id en `ja`.
- **Lo que ya existe:** 16 sprites HD en `assets/weapons/` (320×160, `pivot: grip-calibrated`): `weapon_c003_laser`,
  `c005_needler`, `c007_magnum`, `c008_silenciada`, `c009_desert_eagle`, `c010_explosiva`, `c011_de_veneno`,
  `c012_de_hielo`, `c013_escopeta`, `c015_escopeta_automatica`, `m1911`, `magnum`, `olympia`, `plasma`, `ricochet`,
  `uzi`. Clasificación de esos 16 en `AUDIT_INVENTORY.md` (revisar si son A o B antes de decidir si se rehacen).

## Primer paso de la tanda (auditoría, antes de generar nada)

1. Volcar la tabla `ja` desde `index.html` (ids, `role`, familia, `hd:{grip,tip,axis,…}`, si tiene sprite) y
   agrupar por familia: cuántas armas y cuántos sprites por familia; decidir el orden de los turnos de 10.
2. Ver **cómo dibuja el motor el arma en la mano** del protagonista (R01: torsos de puntería por elevación,
   cadera, fusil) y cómo usa `grip`/`tip`: medir en un sprite existente bien calibrado (`weapon_m1911`) la relación
   entre el PNG y los puntos `hd`, para que los nuevos salgan con el mismo contrato.
3. Sonda nueva `probe_weapons.js` (a partir de `probe_player.js`): dar al protagonista cada arma por el gancho de QA,
   capturar reposo, puntería a tres elevaciones y disparo, recortar la mano; informe JSON con 0 errores.
4. Hoja de modelo por familia (siluetas de la lámina `LAM_05` ↔ ids del motor) y ficha `batches/T05_ARMAS.json`
   con el contrato (lienzo 320×160, croma, orientación, dónde cae la culata y la boca).

## Pendiente arrastrado

De T04 (escenarios): salas en L o en cruz sin franja de muro en los tramos horizontales interiores (geometría de
`buildHighResRoomCache`, no arte); neón del zorro flotando en salas sin franja visible (colocación del motor);
puertas del muro sur achatadas a 0,82 por `drawDoor`; `wall_panel_tall_neon` sin uso en el manifiesto.
Decisiones por defecto sin confirmar en `TANDA_04_INFORME.md` §7 (portal relicario = descenso; «VIP» con texto).

De R03 (jefes): muerte del Núcleo y del Arquitecto no visibles (pantalla final); destello de impacto que
vela la figura; balas de patrones y botín en pixel art (tandas 06–07); con el jefe final muerto, HUD y
diálogo por encima de la pantalla de fin de partida (visto una vez bajo la sonda).

De R01 (protagonista): armas pesadas con postura de cadera en todos los ángulos; vista lateral única
(`REF_06` pide 8 direcciones); pose de daño con arma larga apuntando abajo cruza hombro y cabeza.

De R02 (enemigos): vistos en juego en los círculos I, II, III, V y VIII (faltan IV, VI, VII y IX); un solo
fotograma por estado; proporciones cambiadas por el generador en `windup`/`attack` del Tanque y `death`
del Sprinter; balas enemigas en pixel art.

Defectos de juego anotados en `AUDITORIA_VISUAL.md` §7 y sin corregir (no son arte): armería vacía
(`"TODAS"` vs `"ALL"`), diálogo pegado, minimapa blanco, botón F9, panel «VARÍA TU DISPARO» congela.
