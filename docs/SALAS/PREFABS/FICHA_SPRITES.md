# Orden de producción · sprites de palco y nave

**Semilla 0, planta 0.** `r1` resuelve **palco-profundo**, no ambas plantillas. Para especificar **nave-quebrada** sin fabricar otra versión de `r1`, se usa su vecino real **`r2`**. El monitor, panel y sofá se reutilizan; la mesa de `r2` no se añade al palco. Entrega de especificaciones, no imágenes finales ni recursos registrados en producción.

[27 prompts independientes, uno por salida](prompts-sprites.md) · [Plano de r1](palco-r1.svg) · [Orden original de r1](orden-palco-r1.md)

## Piezas colocadas

Jugador de referencia **64 u de ancho × 96 u de alto** (arte, no colisión). En «rel.» la primera cifra multiplica el ancho y la segunda la altura. Ejes del mundo: +X este, +Y sur. Giro de autoría medido desde la cara útil original S: S 0°, W/oeste 90°, N 180°, E 270°. Exportar la vista nombrada ya renderizada; transformación de pantalla sin rotación, cizalla ni espejo.

| Ubicación / categoría | Vista y lectura | Rel. → ancho × alto de arte (u) | Centro de apoyo XY; cota Z | Huella de referencia y estado | Sombra rx × ry; `sortY` |
|---|---|---|---|---|---|
| Ambas · `bay` / monitor de cabina, `balcony` | S; conos hacia la pista | 0,72 × 1,30 → 46,08 × 124,80 | (1030,115); **42 palco / 30 nave** | Círculo r22; sólido, solo intacto | 18,92 × 12,10; **137** |
| Ambas · `rack` / panel ambiental, `westRecess` | E; conectores al pasillo, sin prompt de uso | 0,85 × 0,90 → 54,40 × 86,40 | (132; 162,5); 0 | Rectángulo local 54 × 20, ángulo 270°; **no sólido**, solo intacto | 23,22 × 5,50; **189,5** |
| `r1` · `front01` / mostrador, `alcoveS` | N; desde cámara se lee el dorso, no la cara de servicio | 1,40 × 0,90 → 89,60 × 86,40 | (163,585); 0 | Rectángulo 90 × 38, 180°; sólido, solo intacto | 38,70 × 10,45; **604** |
| Ambas · `seat01` / cobertura, `eastBay` | W; respaldo este, asiento abierto al oeste | 2,00 × 0,95 → 128 × 91,20 | (1015,659); 0 | Cápsula con semisegmento 44 y r22, eje N–S; **intacto y roto** | 56,76 × 12,10; **725** |
| `r2` · `table01` / cobertura, `alcoveS` | N; tablero sin fuga oblicua | 1,75 × 0,66 → 112 × 63,36 | (163,585); 0 | Rectángulo 112 × 46, 180°; **intacta y rota** | 48,16 × 12,65; **608** |

Los rectángulos se expresan **antes** del giro de autoría. La elipse visual de contacto no sustituye la cápsula ni el rectángulo. `front01.frontBand` mide 90 × 48, centro (163,542), normal N: **lectura**, `action:null`. No pintar esa franja como botón.

**Exportación:** PNG RGBA para piezas sueltas. Como escala de trabajo usar 2 px/u, redondear hacia arriba y dejar margen transparente. Fijar un marcador no imprimible en el centro de la base del modelo; guardar su proyección como pivote en píxeles del lienzo sin recortar. Así se puede colocar `pivote → (anchor.x, anchor.y − elevation)` en la prueba cenital con relieve. Exportar roto sobre el **mismo** lienzo con el **mismo** pivote, sin reencuadrar los restos para llenar la altura intacta. Sombra separada, centrada en la base elevada (la del monitor cae sobre la tarima); en roto solo contacto bajo los restos. Orden dinámico por el `sortY` resuelto, **no** por el borde inferior del PNG ni por `anchor.y − elevation`. Los estados de dibujo no quitan ni crean colisión.

## Kit arquitectónico

Las superficies se entregan separadas. Una textura de material no es un sprite de habitación: los retranqueos y chaflanes proceden de `walls[].cap` y `face`, no de la perspectiva pintada. Las piezas estáticas usan su segmento o polígono como ancla en lugar del pivote de actor.

| Salida | Vista / tamaño en mundo | Apoyo, sombra y profundidad |
|---|---|---|
| `suelo` | Cenital, repetible; muestra sugerida 128 × 128 u (dos anchos de jugador) | Recortar al perímetro local. Pase de suelo, sin sombra, sin abertura horneada. |
| `tapa`, `cara` | Tapa cenital de grosor 24 u; cara frontal ortográfica repetible. En r1 alturas de **22–72 u** según segmento | Extremos de `wall.face`; levantar por `height`, recortar en cada intervalo. Sombra proyectada separada hacia SE; cara que pueda ocluir se ordena por base, nunca por coronación. No deformar un sprite frontal para cubrir un chaflán. |
| `jamba-{vista}-{0,1}` | Dos montantes por abertura, 10 u sobre tangente × 24 u hacia fuera, altura del muro local | Anclar a los polígonos `opening.jambs[0/1]`. El bisel interno siempre apunta al centro. Sombra corta en cada pie, no una banda que cierre la luz. |
| `umbral-{vista}` | Cenital, luz 170 u × 86 u de profundidad interior | `opening.origin` es el punto medio del borde de entrada, **no** el centro de la placa. Colocar sobre `threshold`; pase de suelo sin sombra propia. |
| `tarima`, `cantoTarima` | Tapa cenital de **205 × 94 u**, origen (928,87), frente S. Canto vertical de 42 u en palco / 30 u en nave | Anclar a la base de `decks[0]`; separar superficie elevada, cara visible y sombra exterior. No duplicar la sombra bajo cada material. |
| `pisada-7`, `pisada-5`, `contrahuella` | Desde el sur: palco **7 × (205 × 15 u)**, nave **5 × (205 × 14,8 u)**; contrahuella común **205 × 6 u** | Apoyar cada pieza en `treads[i]`; labio en borde sur. Sombra estrecha debajo de la nariz, nunca un escalón extra. Recorrido total 105/74 u respectivamente. |

Arquitectura: solo estado íntegro. Proporciones comprobables: la luz de puerta son 2,66 anchos de jugador; el ascenso del palco, 0,44 alturas; el de nave, 0,31. No dibujar hojas, consolas, puertas secretas ni conectores adicionales.

### Hoja de montaje de puertas

| Sala | Arista → destino | Centro del corte en mundo | Vista interior de piezas | Altura de jamba |
|---|---|---|---|---:|
| r1 | `dockE` → r7 | (1210; 350) | W | 34 |
| r1 | `dockS` → r2 | (682,5; 855) | N | 22 |
| r1 | `dockW` → r0 | (0; 425) | E | 36 |
| r2 | `dockN` → r1 | (605; 0) | S | 72 |
| r2 | `dockW` → r3 | (0; 425) | E | 36 |

## Revisión antes de registrar imágenes

1. Servir el proyecto, abrir `/?roomDebug&roomSeed=0` e iniciar la incursión. `DD_ROOM_DEBUG.prefab('r1')` **inspecciona, no viaja**. Comparar `placements` y `openings` con el [SVG](palco-r1.svg); la guía corta en cada base marca dirección. Repetir con `r2`: no debe aparecer el puesto de r1, ni un hueco este. Para una hoja separada: `node tools/prefabs/proof.cjs 0 0 r2 > /tmp/nave.svg`.
2. En un lienzo de revisión aislado superponer base y normal a cada exportación, primero con un jugador patrón y luego sin guías. Aprobar solo si el asset mantiene la vertical, el asiento se abre al lado correcto y los pies no flotan. Una imagen cuyo frente está invertido se devuelve a autoría, **no** se arregla rotándola en runtime.
3. Alternar intacto/roto en el mismo punto. Revisar que el sofá no conserve respaldo alto y que la mesa no conserve un tablero que parezca bloqueante. Si la silueta no cabe con su escala y pivote, corregir arte; no retocar `collider` para ajustarlo a píxeles.
4. Revisar el contraste con **sprint coral, carga ámbar, abanico turquesa, rombo violeta y sector rojo**, incluidos sus temporizadores. Revisar tanto sobre la tarima como sobre vinilo intacto y restos. No adelantar props sobre los avisos. Es un criterio de aceptación pendiente de imágenes finales, no una prueba de RAVE realizada.
5. Reproducir las órdenes: `node tools/prefabs/sprite-order.cjs`. El script solo lee el catálogo y escribe Markdown en stdout. Ni los prompts ni esta ficha autorizan pintar el nuevo perímetro en producción, registrar imágenes en el manifiesto o tocar el juego/guardado.
