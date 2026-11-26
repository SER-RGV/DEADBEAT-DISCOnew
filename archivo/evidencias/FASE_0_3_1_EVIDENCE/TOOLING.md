# Herramientas de diagnóstico — Fase 0.3.1

Todos los scripts se crearon **fuera del repositorio**, en `/home/user/qa_tools/`, y se ejecutaron contra el HTML servido sin modificar. Se conservan copias literales en este directorio como `diag_*.js.txt` para reproducibilidad.

| Script | Propósito | Salida |
|---|---|---|
| `diag_f031_common.js.txt` | Lanzamiento, instrumentación de solo lectura (`addInitScript`), `SNAP` de estado, secuencia de arranque | — |
| `diag_f031_discover.js.txt` | Inventario de APIs del motor y primera traza de transición | `discover_runtime_api.json` |
| `diag_f031_inc001.js.txt` | 10 intentos de ratón + 10 de control alternativo + `Q` + frames forzados | `inc001_session.json`, `01`–`04_inc001_*.png` |
| `diag_f031_inc002.js.txt` | 3 ejecuciones independientes de transición + 1 con frames forzados | `inc002_three_runs.json`, `05`–`07_run*.png` |
| `diag_f031_control.js.txt` | Comprobación suplementaria de control recuperado | `control_supplement.json`, `08`–`09_control_*.png` |

Reproducción (entorno ya preparado):

```
cd /home/user/qa_tools
node diag_f031_discover.js
node f031_inc001.js
node f031_inc002.js
node f031_control.js
```

Requiere: `/tmp/chromium`, `/tmp/qa_libs/lib`, `/tmp/fonts`, `lib.js` (Fase 0.3) y el servidor HTTP en el puerto 8123. Los nombres `diag_*.js.txt` son copias; los ejecutables son los `.js` de `/home/user/qa_tools/`.

## Extracto de la instrumentación (de `f031_common.js`)

```js
window.__qaEvents=[]; window.__qaBullets=[]; window.__qaWa=null; window.__qaFrames=0;
for (const t of ['pointerdown','pointerup','mousedown','mouseup','click','keydown','keyup']) {
  window.addEventListener(t, e => rec(e,'capture'), true);
  window.addEventListener(t, e => rec(e,'bubble'), false);
}
const origPush = Array.prototype.push;
Array.prototype.push = function () {
  for (let i=0;i<arguments.length;i++) {
    const v=arguments[i];
    if (v && typeof v==='object' && ('weaponSerial' in v) && ('accuracyCohort' in v)) {
      window.__qaWa=this;                    // array `wa` del mundo
      window.__qaBullets.push({t:Date.now(),x:Math.round(v.x),y:Math.round(v.y),
        vx:Math.round(v.vx),vy:Math.round(v.vy),weaponId:v.weaponId,
        serial:v.weaponSerial,arrLen:this.length});
    }
  }
  return origPush.apply(this,arguments);
};
const loop=()=>{window.__qaFrames++;requestAnimationFrame(loop)};
requestAnimationFrame(loop);
```

`wd()` (función de disparo del juego) crea el proyectil con firma `{weaponSerial, accuracyCohort, vx, vy, ...}` y lo inserta con `wa.push(M)` sólo si la posición es válida; incrementa `un.shotsFired`. Por eso la observación de `wa.push` **demuestra que el proyectil entra en el mundo del juego**, no sólo que se registró un `pointerdown`.

## APIs del motor utilizadas (todas públicas, ya existentes en la build)

- `DMO.testStats()` → `shotsFired`, `shotsHit`, `kills`, `balas` (**enemigos**).
- `DMO.debug.state()` → `balas` (**enemigos**), `enemies`, `px/py`, `round`, `lives`.
- `DMO.debug.setInput({fire:true|false})` → fija `fa`/`Aa` del motor (control alternativo).
- `DMO.debug.tick(dt, n)` → avanza `n` ticks de simulación (aisla inanición de `requestAnimationFrame`).
- `DMO.debug.on()/forceWave()/spawnEnemyAt(x,y)` → enemigo asistido para las pruebas.
- `DMO_HUB.state()` → `location`, `inHub`, `transitionLock`, `transitionsCompleted`, `transitionErrors`.
- `DMO.floorDrop.state()` / `DMO_CINE.state().floorDrop` → `phase`, `stage`, `active` de la animación de descenso.
- `DMO_DUNGEON.state()` → `current`, `visited`, `secured`, nodos del grafo.

## Referencias de código leídas (análisis estático, NO usado como prueba funcional)

- `function wd(){...}` — crea proyectiles del jugador en `wa`, `un.shotsFired++`.
- `h = !Mr && ye.rollT<=0 && (fa || Aa || Mu.fire || f)` — condición de disparo en el bucle.
- Hook V35 «Peaceful Hub & Transition Combat Lock» — envuelve `wd`/`tp` y devuelve `false` si `hub.transitionLock || isFloorDropLockingControls()` o `hub.inHub && !hub.invasion.active`.
- `startCampaignFromHub(0)` → `hub.transitionLock=true`, `location='TRANSITION'`; `floorDropAnim.onArrivalComplete()` → `location='CAMPAIGN_ROOM'`, `transitionLock=false`, `transitionsCompleted++`.
- `isFloorDropLockingControls()` → `floorDropAnim.stage === 'recovery'` o animación activa.

**Ninguna de estas lecturas se usó para declarar una prueba superada**: se usaron sólo para decidir qué medir en runtime.
