# 09 — Blueprints espaciales por topología · v1

**Estado:** propuesta conceptual lista para prototipado, no implementada.  
**Base:** topologías observadas en las semillas 17677515 y 502304869.  
**Dependencias:** FASE 08 de escala/cámara; extracción pendiente de `roomRect`, puertas, colisiones y spawns.  
**Objetivo:** definir composición por conectividad, para que una sala conserve su función aunque el generador cambie los IDs de los nodos.

## 1. Convenciones

Los diagramas son plantas conceptuales, no mapas a escala. Las puertas se colocan según las conexiones y lados que entrega el grafo real. La orientación puede rotarse; nunca se debe mover una puerta a un lado no conectado.

- `E`: entrada desde la sala anterior.
- `X`: salida a otra sala.
- `P`: jugador / punto de entrada.
- `C`: espacio central transitable.
- `O`: obstáculo sólido opcional.
- `R`: recompensa o punto de interacción.
- `K`: área que debe permanecer despejada para telegráficos y esquiva.

No se fijan unidades, radios ni separaciones en este documento.

## 2. Arquetipo A — Umbral / inicio

**Selector:** `kind=start`.  
**Variación observada:** dos salidas en la semilla A; tres en la semilla B.

```text
┌──────────────────────────┐
│       X salida A         │
│                          │
│   O                  O   │
│                          │
│            C             │
│                          │
│   P / E                  │
│                          │
│       X salida B         │
└──────────────────────────┘
```

Reglas:
- La entrada no puede quedar enfrentada a una pared o prop sólido.
- El centro debe permitir girar y orientarse hacia más de una salida.
- Si hay tres salidas, ninguna debe quedar oculta detrás de decoración.
- No introducir presión de combate antes de que el jugador entienda el espacio.
- El objetivo y la salida principal deben distinguirse sin depender exclusivamente del color.

## 3. Arquetipo B — Conector de ruta principal

**Selector:** `kind=combat`, `main=true`, grado 2.  
**Función:** transición entre encuentros, con un cambio espacial claro respecto a la sala anterior.

```text
┌──────────────────────────┐
│                          │
│ E  ─────── C ───────  X  │
│                          │
│   O                  O   │
│                          │
│       K / ruta libre     │
└──────────────────────────┘
```

Reglas:
- No convertir todos los conectores en pasillos estrechos.
- Alternar longitudinal, abierto y con cobertura ligera cuando el catálogo lo permita.
- Mantener al menos una línea de desplazamiento sin obstáculos sólidos.
- Si contiene combate, que la geometría modifique el posicionamiento, no solo el tiempo para llegar al enemigo.
- La salida siguiente debe seguir siendo localizable durante el combate.

## 4. Arquetipo C — Cruce de tres o más conexiones

**Selector:** cualquier nodo con grado ≥ 3, excepto start, cuando el tipo y la progresión lo permitan.  
**Función:** reorientación, convergencia de rutas o decisión.

```text
┌──────────────────────────┐
│            X             │
│            │             │
│   O        C        O    │
│            │             │
│ E ─────────┼──────── X   │
│            │             │
│            K             │
└──────────────────────────┘
```

Reglas:
- Mostrar visualmente cada salida y no confundir puertas conectadas con puertas decorativas.
- No situar un pilar, estatua o gran prop en el centro geométrico si corta la circulación entre tres rutas.
- El jugador debe poder leer el siguiente objetivo antes de comprometerse.
- Si hay combate, evitar que los enemigos bloqueen simultáneamente todas las puertas.
- La sala no debe convertirse en una emboscada desde fuera de cámara.

## 5. Arquetipo D — Cámara de extremo de rama

**Selector:** nodo no inicial/no jefe con grado 1. El tipo de nodo decide si es combate, tesoro o evento.  
**Función:** justificar el desvío sin convertirse en un callejón injusto.

```text
┌──────────────────────────┐
│                          │
│       O        O         │
│                          │
│            C             │
│                          │
│            R             │
│                          │
│            E             │
└──────────────────────────┘
```

Reglas:
- El jugador debe reconocer la función antes de entrar.
- Debe existir espacio para girar y volver a la puerta.
- Una sala de combate de extremo no debe cerrar la puerta de salida de forma que el jugador quede atrapado contra enemigos.
- Una sala de tesoro debe comunicar el contenido y cualquier condición antes de activar el riesgo.
- No añadir élites, trampas o coste de acceso sin confirmar las reglas de progresión y economía.

## 6. Arquetipo E — Servicio / tienda

**Selector:** `kind=shop` o flag equivalente validado.  
**Función:** pausa de decisión económica, no una sala de combate encubierta.

```text
┌──────────────────────────┐
│            X             │
│                          │
│   R  estación / tienda   │
│                          │
│       zona de uso        │
│                          │
│            E             │
└──────────────────────────┘
```

Reglas:
- La interacción no debe bloquear la salida ni el punto de entrada.
- El panel de tienda debe permanecer dentro del viewport y no heredar zoom de mundo.
- No asumir que el tiempo, la oleada o los enemigos se pausan; verificar el comportamiento actual.
- No rediseñar economía ni inventario desde el mapa.

## 7. Arquetipo F — Arena de jefe

**Selector:** `kind=boss`.  
**Función:** lectura de patrones, desplazamiento y ventanas de ataque.

```text
┌──────────────────────────┐
│                          │
│    K                K    │
│                          │
│          BOSS            │
│                          │
│    K                K    │
│                          │
│            E             │
└──────────────────────────┘
```

Reglas:
- Mantener perímetro continuo y una salida reconocible.
- Dejar zonas despejadas para patrones circulares, radiales y barridos.
- No colocar obstáculos sólidos en las rutas que el jugador necesita para esquivar.
- La cobertura solo se añade si el patrón concreto del jefe la contempla y permite contrajuego.
- Validar los perfiles B4 individualmente; no todos los jefes tienen el mismo repertorio.
- El encuadre debe funcionar con el zoom mínimo y máximo de la cámara de FASE 08.

## 8. Mapa de aplicación a las dos semillas

La asignación se calcula por atributos, no por ID fijo:

| Semilla | Nodo | Tipo / condición | Arquetipo |
|---|---|---|---|
| A | r0 | start, grado 2 | A — Umbral |
| A | r1 | treasure, grado 1 | D — Cámara de recompensa |
| A | r2 | combat, main, grado 4 | C — Cruce de combate |
| A | r3 | combat, main, grado 2 | B — Conector de ruta |
| A | r4 | combat, no-main, grado 3 | C — Cruce de combate lateral |
| A | r5 | combat, no-main, grado 1 | D — Extremo opcional |
| A | r6 | combat, main, grado 3 | C — Cruce de ruta |
| A | r7 | combat, no-main, grado 1 | D — Extremo opcional |
| A | r8 | combat, main, grado 3 | C — Cruce/decisión |
| A | r9 | combat, main, grado 2 | B — Conector pre-jefe |
| A | r10 | boss, grado 1 | F — Arena de jefe |
| A | s0 | shop, grado 1 | E — Servicio |
| B | r0 | start, grado 3 | A — Umbral |
| B | r1 | combat, no-main, grado 2 | B — Conector lateral |
| B | r2 | combat, main, grado 3 | C — Cruce de ruta |
| B | r3 | combat, no-main, grado 2 | B — Conector lateral |
| B | r4 | combat, no-main, grado 1 | D — Extremo opcional |
| B | r5 | combat, main, grado 3 | C — Cruce de ruta |
| B | r6 | treasure, grado 1 | D — Cámara de recompensa |
| B | r7 | combat, main, grado 3 | C — Cruce/decisión |
| B | r8 | combat, main, grado 2 | B — Conector de ruta |
| B | r9 | combat, main, grado 2 | B — Conector pre-jefe |
| B | r10 | boss, grado 1 | F — Arena de jefe |
| B | s0 | shop, grado 1 | E — Servicio |

**Nota:** el arquetipo D agrupa salas terminales, pero el subtipo depende de `kind`. No convierte una sala combat en treasure. Los nodos de grado 3 se marcan como cruce, pero el espacio exacto debe responder a los lados reales de las puertas.

## 9. Contratos que debe respetar la implementación

1. Obtener puertas desde los enlaces reales del nodo.
2. Calcular el área útil después de reservar el ancho de las puertas.
3. Comprobar colisiones y radios de navegación con el jugador y enemigos actuales.
4. Colocar props sólidos fuera de las rutas críticas.
5. Mantener las áreas K despejadas según los patrones del encuentro.
6. Crear zonas de spawn solo en puntos transitables, fuera del radio inmediato del jugador y fuera de las salidas.
7. Renderizar decoración sin modificar la geometría de colisión.
8. Mantener HUD y minimapa en coordenadas de pantalla/UI, no transformadas con la cámara del mundo.

## 10. Checklist de prototipo

- [ ] Extraer las funciones reales que calculan `roomRect` y `clipRoomFn`.
- [ ] Extraer lados, posiciones y anchura real de las puertas.
- [ ] Confirmar si los arquetipos geométricos del renderer están conectados al generador de campaña.
- [ ] Prototipar un cruce de grado 3 con tres orientaciones de puerta.
- [ ] Prototipar una sala de grado 2 longitudinal y otra abierta.
- [ ] Prototipar una arena de jefe contra los patrones reales.
- [ ] Probar entrada/salida, colisiones y navegación con jugador y enemigos.
- [ ] Revisar a 1280×720, 1600×900 y 1920×1080.
- [ ] Comparar con la cámara dinámica de FASE 08.
- [ ] Obtener capturas y telemetría antes de aprobar el diseño.

## 11. Decisión de producción

**No construir 12 salas hechas a mano para una sola semilla.** Diseñar una biblioteca pequeña de arquetipos funcionales y asignarlos de forma determinista según los metadatos del nodo. Después, aplicar variación estética y de obstáculos dentro de límites seguros.

Esto reduce duplicación, mantiene compatibilidad con la generación procedural y permite que el diseño siga siendo válido cuando el grafo cambia.
