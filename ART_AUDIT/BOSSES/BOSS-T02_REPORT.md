# BOSS-T02 — informe de integración y QA

**Estado:** integrado; QA funcional/regresión aprobado. **No cerrar la tanda todavía:** rendimiento inconcluso en SwiftShader, sin baseline emparejado en GPU real.  
**Versión runtime:** `fase1-tanda01+tanda02+boss-t01+boss-t02`  
**Manifiesto:** `ART_ASSETS/bosses/tanda_02/manifest.json`.

## Alcance y claves conservadas

Se registraron diez PNG RGBA en `ART_PACK/art_pack.js` bajo los cache keys HD que ya consume el renderer existente:

- `boss_05_fusioncosmica`: `attack`, `attack1`, `hit`, `death`.
- `boss_06_djabismo`: `attack`, `attack1`, `hit`, `death`.
- `boss_07_altavoztitan`: `attack`, `attack1`.

No se crearon estados de juego ni hooks de gameplay. Los estados que no tienen arte T02 continúan usando los recursos nativos existentes. Las imágenes de muerte de Boss 05 y Boss 06 se probaron en el renderer real manteniendo viva la entidad de QA y sustituyendo temporalmente la vista congelada de estado; se restauró el objeto original después de cada captura.

La QA descubrió que el resolver HD consultaba ciertos aliases de residente antes que el `artId` estable, por lo que Boss 06/07 podían resolver el arte equivocado en la entidad sintética. Se corrigió únicamente la prioridad de resolución visual: un `artId` estable válido prevalece; los residentes quedan como fallback para entidades legacy sin `artId`. IDs, aliases, lógica de combate y comportamiento permanecen intactos.

## QA de integración y regresión

- **BOSS-T02: 16/16 checks aprobados**, incluyendo versión runtime, exactamente diez assets, integridad de loader, dimensión/cache, transiciones de estado originales y cero errores de página.
- **Captura en sala de juego:** 12 estados probados; el canvas confirmó que se dibujan los frames T02 de ataque de Boss 05/06/07 y los frames de golpe y muerte de Boss 05/06.
- **BOSS-T01 regresión: 17/17 checks aprobados** tras el cambio del resolver; IDs estables, aliases residentes, masters y dispatch anteriores siguen operativos.
- Hash SHA-256, formato RGBA y dimensiones locales de T02: **10/10 correctos**.
- Boss 05 death fue revisado sobre fondo magenta tras regenerar el matte; no se observa damero gris residual.

Evidencia T02: `ART_AUDIT/BOSSES/evidence/T02_browser/qa_report.json` y capturas individuales en `ART_AUDIT/BOSSES/evidence/T02_browser/state_dispatch/`.  
Evidencia de regresión: `ART_AUDIT/BOSSES/evidence/T01_browser/qa_report.json`.

## Rendimiento

La prueba comparativa solicitada en GPU real está **BLOQUEADA**: el sandbox no expone `/dev/dri` y Chromium devuelve un renderer SwiftShader explícito. No se ejecutaron pasadas inválidas ni se compararon los runs heredados como si fueran baseline. Los datos de SwiftShader (1,7 FPS en la pasada T02) se conservan solo como diagnóstico no comparable; tampoco se atribuyen los outliers a los assets. Un sondeo aparte registró 10/10 recursos cargados/decodificados y 0 pendientes al observarlos, pero no sustituye la medición GPU.

Diagnóstico completo, configuración, copias brutas no comparables y capturas: `ART_AUDIT/BOSSES/evidence/T02_performance/PERFORMANCE_GATE_REPORT.md`. No se generó gráfica de frame time porque no existe una serie emparejada válida. La tanda permanece integrada y verificada, pero **no se cierra ni se avanza a T03** hasta disponer de varias pasadas comparables en hardware acelerado.

Se preparó el runbook y el harness para validación externa, pero **no se ejecutó** la matriz GPU: `ART_AUDIT/BOSSES/T02_EXTERNAL_GPU_RUNBOOK.md` y `ART_AUDIT/BOSSES/evidence/T02_performance/external_gpu/README.md`.
