# BOSS-T01 — informe de integración y QA

**Estado:** integrado con QA funcional aprobado; tanda parcial de estados ilustrados.  
**Versión runtime:** `fase1-tanda01+tanda02+boss-t01+boss-t02`  
**Artefacts de referencia:** `ART_ASSETS/bosses/tanda_01/manifest.json` y `ART_AUDIT/BOSSES/evidence/T01_browser/qa_report.json`.

## Alcance integrado

- Nueve masters HD asociados a los nueve `artId` estables de bosses, manteniendo nombres, identidades y claves residentes anteriores.
- Un frame adicional `boss_09_nucleofinal_attack_01.png`, aplicado a la clave de caché HD ya consumida por el renderer.
- Bosses 05–09 conservan sus frames nativos de ataque/golpe/muerte salvo el frame alternativo de ataque indicado; el master nuevo cubre el estado idle. No se reemplazó la lógica de combate.

## Resultado de QA de navegador

Los **17 checks** del informe pasan: carga e integridad, nueve masters con dimensiones correctas, mapa de IDs estables, preservación de aliases residentes, sustitución de la caché de ataque alternativo, hooks instalados, ausencia de errores locales, constructor de boss en sala activa, dispatch visual por `artId` y estados nativos de ataque/golpe.

- Capturas dentro del juego: `ART_AUDIT/BOSSES/evidence/T01_browser/boss_artid_dispatch/`.
- Informe legible por máquina: `ART_AUDIT/BOSSES/evidence/T01_browser/qa_report.json`.
- Verificación de hash SHA-256, formato y dimensiones: ejecutada por `ART_TOOLS/qa/finalize_boss_tanda_01.py`.

## Rendimiento y limitaciones

La medición única en Chromium con SwiftShader dio aproximadamente **1,7 FPS** (239 intervalos; media 589,8 ms, p95 800 ms y máximo 31.215,5 ms). No hay baseline pre/post emparejado y el entorno ya presenta inanición de `requestAnimationFrame`; por eso el resultado es **inconcluso**, no evidencia una regresión ni acredita rendimiento aceptable en GPU real. Evidencia: `ART_AUDIT/BOSSES/evidence/T01_browser/performance.json`.

La tanda se considera integrada y verificada en loader/render, pero no completa como cobertura de estados ilustrados. No iniciar una tanda posterior basándose en esta medición de rendimiento como si fuese un pase de hardware real.
