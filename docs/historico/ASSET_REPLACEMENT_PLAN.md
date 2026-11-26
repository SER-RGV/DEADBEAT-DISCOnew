# PLAN DE SUSTITUCIÓN Y PRODUCCIÓN DE ASSETS — DEADBEAT DISCO

> Complementa `ART_BIBLE.md` y `ASSET_INVENTORY.md`. No duplica el inventario por recurso.
> Regla de producción: **máximo 10 assets por tanda**; no se inicia una tanda nueva hasta validar la anterior.

## 1. Orden de familias (vigente)

1. Entornos / arquitectura → 2. Suelos → 3. Paredes, puertas y obstáculos → 4. Decoración → 5. Protagonista → 6. Enemigos → 7. Jefes → 8. Armas, proyectiles y efectos → 9. Objetos interactivos → 10. HUD → 11. Menús y pantallas → 12. Transiciones y presentación.

La Tanda 01 invirtió parcialmente este orden por una **dependencia técnica justificada**: los materiales T3B son el único sistema con un flag `__T3B.enabled=false` y un patrón `repeat` de 512 px; validarlos primero permitió comprobar el pipeline completo (generar → alpha → dimensiones → loader → `__T3B.draws`) antes de abordar arquitectura.

## 2. Diez prioridades de mayor impacto

| # | Prioridad | Impacto | Familia | Estado |
|---|---|---|---|---|
| 1 | Suelos (10 materiales T3B) | Mayor superficie en pantalla; define el valor y la lectura de cada sala | Suelos | **3/10 en Tanda 01** |
| 2 | Emblema e identidad del club | Foco del HUB, ancla de marca | Identidad | **Tanda 01** |
| 3 | Muros, puertas y umbrales modulares | Define límites de sala y navegación | Arquitectura | Pendiente |
| 4 | Decoración sin tapar jugabilidad | Personalidad por sala | Decoración | **2 props en Tanda 01** |
| 5 | Protagonista orientable + animaciones reales | Silueta del jugador en todo momento | Personajes | Pendiente |
| 6 | Familia de enemigos ILT (11 claves) | Lectura con varias unidades simultáneas | Enemigos | Pendiente (1 jefe en T01) |
| 7 | Jefes y lectura de ataques | Diferenciación de fases | Jefes | **1/11 en Tanda 01** |
| 8 | Armas (163 HD), proyectiles y efectos | Contraste funcional en combate | Combate | **1/163 en Tanda 01** |
| 9 | HUD y menús (corazones, barras, minimapa, inventario, tienda, pausa, muerte, victoria, mensajes DJ/Director) | Legibilidad en todas las resoluciones | UI | Pendiente |
| 10 | Transiciones y presentación | Continuidad de universo | Cinemática | Pendiente |

## 3. Criterios de decisión por clase A–E

- **A CONSERVAR:** recurso decodifica, está referenciado y cumple la biblia → no se toca.
- **B MEJORAR:** cumple función pero su material/contorno/paleta se puede elevar **sin cambiar ID ni dimensiones**.
- **C SUSTITUIR:** se dispone de reemplazo verificado; se conservan clave, dimensiones, pivote, formato compatible y loader. Antes de sustituir se comprueban las referencias en código y los consumidores dinámicos.
- **D CREAR:** el motor tiene un sistema sin asset o con asset procedural; requiere definir ID, dimensiones, pivote y punto de integración.
- **E RETIRAR:** **solo** con obsolescencia demostrada **y** ausencia total de dependencias. En esta fase **no se retira nada**.

## 4. Contrato técnico de cualquier tanda

1. Analizar las 3 referencias antes de generar (ya hecho; ver `ART_BIBLE.md` §1).
2. ≤10 assets, cada uno con: ID, objetivo, referencias usadas, especificaciones, dimensiones, formato, pivote, alpha, archivos producidos, resultado de integración, pruebas, evidencias, problemas pendientes.
3. Generar → comprobar archivos → comprobar dimensiones/transparencia/bordes/recorte → registrar IDs → integrar en el loader existente → conectar a los sistemas reales → comprobar representación en escenario → comprobar que no rompe animaciones/interacciones → ejecutar el juego → capturar evidencia → documentar.
4. Un asset **no se marca terminado** si solo se ha exportado como imagen.
5. No se empieza la tanda siguiente sin clasificar `VERIFICADA / PARCIALMENTE VERIFICADA / NO VERIFICADA / FALLIDA` por comprobación.
6. No se duplican fotogramas para simular animaciones; las direcciones/animaciones faltantes se documentan.
7. Si un recurso no puede integrarse, se explica el motivo y queda **pendiente**, nunca «integrado».

## 5. Estado de tandas

| Tanda | Contenido | Assets | Integración | Validación | Estado |
|---|---|---|---|---|---|
| **01** | 3 suelos, emblema, 2 props, 1 jefe, 1 arma | 8 | 8/8 en 4 loaders existentes | Ver `VISUAL_QA_REPORT.md` | Cerrada documentalmente en este commit |
| 02 | Arquitectura modular (muros, esquinas, pilares, puertas, marco, umbral, neón) | ≤10 | Pendiente | Pendiente | **No iniciada** |
| 03+ | Protagonista, familia ILT completa, HUD, transiciones | ≤10 por tanda | Pendiente | Pendiente | **No iniciada** |

## 6. Riesgos registrados

- **No confundir existencia con integración:** el pintor T3B estaba deshabilitado (`__T3B.enabled=false`) aunque los 10 WebP existieran. Sin activar ese flag, sustituir `__T3B_IMAGES[i]` no produce ningún cambio visible. Documentado y resuelto en Tanda 01.
- **Diagnóstico ≠ rendimiento:** `__T3B.roomCapture()` usa `toDataURL()` sobre un canvas grande; con texturas detalladas tarda ~47,5 s en SwiftShader. Es una función de QA, no se invoca durante el juego. La validación limpia la excluye.
- **Proyectiles:** `wa` = proyectiles del jugador; `Ia` / `balas` = proyectiles enemigos. Métrica válida: `DMO.testStats().shotsFired` + entradas en `wa`.
- **Sin GUI:** el entorno no tiene display; no hay pruebas manuales GUI. INC‑001/INC‑002 permanecen `NO REPRODUCIDAS` y **no se corrigen por intuición**.
- **Cloudflare:** 2 scripts, 2 iframes, 2×404 y 2 console errors por carga son esperados; no se eliminan.
