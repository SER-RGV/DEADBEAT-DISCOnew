# 05 — Matriz de validación cruzada

## 1. Propósito

Validar que mapas, enemigos, armas y UI forman un solo sistema. Esta matriz separa inspección estática, prueba automatizada, prueba de navegador y validación humana.

## 2. Matriz

| ID | Área | Prueba | Evidencia necesaria |
|---|---|---|---|
| MAP-01 | Grafo | Todas las salas conectan según el grafo válido | Export del grafo + auditoría |
| MAP-02 | Navegación | Puertas y rutas son transitables | Recorrido completo |
| MAP-03 | Geometría | No hay spawns dentro de sólidos | Sonda de colisión |
| MAP-04 | Escala | Área útil y cámara funcionan juntas | Capturas A/B |
| MAP-05 | Jefes | Arena admite patrones y rutas de escape | Combate completo |
| ENC-01 | Enemigos | IDs/tipos/familias se resuelven correctamente | Tabla de mapeo |
| ENC-02 | Spawn | Se respetan caps, distancias y límites | Logs de spawn |
| ENC-03 | Telegraph | Aviso precede a daño y es legible | Captura + timestamps |
| ENC-04 | Encuentros | Composición ofrece contrajuego | Repetición de escenario |
| ENC-05 | Jefes | Patrón completo y fase natural | Vídeo/log de combate |
| WPN-01 | Arsenal | Catálogo único y conteo reproducible | Export de definiciones |
| WPN-02 | Integridad | Cada arma seleccionable tiene datos y asset | Informe de integridad |
| WPN-03 | Daño | Daño calculado coincide con impactos reales | Telemetría por proyectil |
| WPN-04 | Balance | Comparación en escenarios iguales | Baseline A/B |
| WPN-05 | Economía | Coste/desbloqueo corresponde a progreso | Prueba de tienda/guardado |
| UI-01 | HUD | Sin solapamientos | Capturas por resolución |
| UI-02 | Minimapa | Refleja sala, jugador y salidas reales | Comparación mundo/minimapa |
| UI-03 | Menú | Navegación completa teclado y mando | Suite + prueba física |
| UI-04 | Accesibilidad | Foco, contraste y textos legibles | Checklist |
| UI-05 | Persistencia | Nueva partida/continuar/borrar funcionan | Suite de guardado |
| INT-01 | Cámara/UI | HUD no hereda zoom | Capturas en zoom min/max |
| INT-02 | Cámara/combate | Telegráficos no salen del viewport | Escenarios de jefe |
| INT-03 | Mapa/encuentro | No hay composición imposible | Simulación y juego real |
| INT-04 | Armas/escala | Alcance y velocidad siguen coherentes | Medición mundo-pantalla |
| INT-05 | Rendimiento | No hay regresión bajo carga | Perfilado emparejado |

## 3. Resoluciones y dispositivos

Mínimo:
- 1280×720
- 1600×900
- 1920×1080
- 2560×1440

Entrada:
- Teclado y ratón.
- Mando Xbox o compatible emulado.
- Mando físico: aprobación separada, no inferida de emulación.

## 4. Niveles de evidencia

- **S0 — Estático:** código, manifiestos y datos inspeccionados.
- **S1 — Automatizado:** test determinista con resultado guardado.
- **S2 — Runtime:** navegador real, logs y capturas.
- **S3 — Humano/hardware:** mando físico, sonido escuchado y valoración de legibilidad.

No elevar un resultado S0 a “funciona en juego”. No elevar mando emulado a “mando físico probado”.

## 5. Cierre de una tarea

Cada cambio debe incluir:
- Problema u objetivo.
- Fuente de verdad.
- Estado antes.
- Cambio mínimo.
- Prueba reproducible.
- Resultado y evidencia.
- Regresiones ejecutadas.
- Limitaciones.
- Decisión de aceptar, ajustar o revertir.

## 6. Bloqueos de cierre

No cerrar:
- El balance de armas sin catálogo y baseline.
- Un encuentro sin ejecución completa.
- Un mapa sin recorrido de navegación.
- El HUD sin pruebas de resoluciones y cámara.
- El soporte de mando sin separar emulación y hardware.
- El rendimiento sin comparación bajo condiciones equivalentes.
